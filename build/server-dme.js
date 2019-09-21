/// Simplistic node.js  jsRealBServer 
var http = require("http");
var url = require('url');
var fs = require('fs');

// taken from https://stackoverflow.com/questions/10645994/how-to-format-a-utc-date-as-a-yyyy-mm-dd-hhmmss-string-using-nodejs
function timestamp(d){
  if (typeof d == "string") return d;
  function pad(n) {return n<10 ? "0"+n : n}
  dash="-"
  colon=":"
  return d.getFullYear()+dash+
  pad(d.getMonth()+1)+dash+
  pad(d.getDate())+" "+
  pad(d.getHours())+colon+
  pad(d.getMinutes())
}
///////// 
//  load jsRealB file
const path=__dirname+'/jsRealB-dme.js'
var jsRealB=require(path);

// "evaluate" the exports (Constructors for terminals and non-terminal) in the current context
// so that they can be used directly
for (var v in jsRealB){
    eval("var "+v+"=jsRealB."+v);
}

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
console.log('Server [built on %s] running at http://127.0.0.1:8081/',timestamp(jsRealB_dateCreated));

/* 
start server with : node server-en.js
try these examples in a browser
http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))
that should display:
The man loves.
*/