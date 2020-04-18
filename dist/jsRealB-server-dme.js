/// Simplistic node.js  jsRealBServer 
var http = require("http");
var url = require('url');
var fs = require('fs');

///////// 
//  load jsRealB file
const path=__dirname+'/jsRealB-node.js'
var jsRealB=require(path);

// "evaluate" the exports (Constructors for terminals and non-terminal) in the current context
// so that they can be used directly
for (var v in jsRealB){
    eval("var "+v+"=jsRealB."+v);
}

loadEn(true);
dmeLexicon = require(__dirname+"/../data/lexicon-dme.json")
console.log(Object.keys(dmeLexicon).length+" lexicon entries")
updateLexicon(dmeLexicon)

// eval(fs.readFileSync(__dirname+'/addLexicon-dme.js').toString());
const args=process.argv
if (args.length>2){
    eval(fs.readFileSync(args[2]).toString());
    console.log(args[2]+": loaded")
}

http.createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
   var req = url.parse(request.url, true);
   var query = req.query;
   var lang = query.lang
   var exp = query.exp
   if (lang=="en"){
       try {        
           if (exp.startsWith("{")){
               errorType="JSON";
               sentence=fromJSON(JSON.parse(exp)).toString();
           } else {
               errorType="jsRealB expression";
               sentence=eval(exp).toString();
           }
           response.end(sentence+"\n")
       } catch (e) {
           response.end(`${e}\nErroneous ${errorType}: ${exp}\n`)
       }
   } else {
       response.end('Language should be "en", but '+lang+' received\n')
   }
}).listen(8081);
// Console will print the message
console.log('jsRealB server [built on %s] running at http://127.0.0.1:8081/',jsRealB_dateCreated);

/* 
start server with : node dist/jsRealB-server-dme.js
try these examples in a browser
http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))
that should display:
The man loves.
*/