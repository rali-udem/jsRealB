/// Simplistic node.js  jsRealBServer 
var http = require("http");
var url = require('url');
var fs = require('fs');
///////// 
//  load JSrealB file
var jsRealB=require(__dirname+'/jsRealB-dme.js');

// "evaluate" the exports (Constructors for terminals and non-terminal) in the current context
// so that they can be used directly
for (var v in jsRealB){
    eval("var "+v+"=jsRealB."+v);
}

loadEn(true);
eval(fs.readFileSync(__dirname+'/addLexicon-dme.js').toString());

http.createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
   var req = url.parse(request.url, true);
   var query = req.query;
   var lang = query.lang
   var exp = query.exp
   if (lang=="en"){
       try{
           jsExp=eval(exp);
           var resp=jsExp.toString();
           response.end(resp+"\n");
       } catch (e){
           response.end(e+"\n")
       }
   } else {
       response.end('Language should be "en", but '+lang+' received\n')
   }
}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');

/* 
start server with : node server-en.js
try these examples in a browser
http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))
that should display:
The man loves.
*/