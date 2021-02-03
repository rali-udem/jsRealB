/// Simplistic node.js  jsRealBServer 
var http = require("http");
var url = require('url');
var fs = require('fs');

var querystring = require('querystring');
/////////
//  load jsRealB file
const path=__dirname+'/jsRealB.js'
var jsRealB=require(path);

// "evaluate" the exports (Constructors for terminals and non-terminal) in the current context
// so that they can be used directly
for (var v in jsRealB){
    eval("var "+v+"=jsRealB."+v);
}

loadEn(true);
// eval(fs.readFileSync(__dirname+'/addLexicon-dme.js').toString());

// taken from https://stackoverflow.com/questions/4295782/how-to-process-post-data-in-node-js
function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = querystring.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}


http.createServer(function (request, response) {
    if(request.method == 'POST') {
        processPost(request, response, function() {
            console.log("it is a post");
            console.log(request.post);
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            // Use request.post here
            var query = request.post;
            var lang  = query.lang
            var exp   = query.exp
            console.log(exp)
            if (lang=="en"){
                 let errorType,sentence;
                 try {
                     if (exp.startsWith("{")){
                         errorType="JSON";
                         jsonExp=JSON.parse(exp);
                         sentence=fromJSON(jsonExp).toString();
                     } else {
                         errorType="jsRealB expression";
                         sentence=eval(exp).toString();
                         console.log("sentence=",sentence)
                     }
                     response.end(sentence)
                 } catch (e) {
                     errorMess=`${e}\nErroneous realization from ${errorType}\n`;
                     if (errorType=="JSON"){
                         try { // pretty-print if possible... i.e. not a JSON error
                             response.end(errorMess+ppJSON(JSON.parse(exp)))
                         } catch(e){ // print line as is
                             response.errorMess+end(exp);
                         }
                     } else {
                         response.end(errorMess+exp)
                     }
                 }
            } else {
                response.end('Language should be "en", but '+lang+' received\n')
            }

            response.end();
        });
    } else {
        console.log("it is not a post",request.method)
        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }
   // response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
   // var req = url.parse(request.url, true);
}).listen(8082);
// Console will print the message
console.log('jsRealB server [built on %s] running at http://127.0.0.1:8082/',jsRealB_dateCreated);

/* 
start server with : node dist/jsRealB-server.js
try these examples in a browser
http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))
that should display:
The man loves.
*/