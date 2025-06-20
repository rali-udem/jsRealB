/// Simplistic node.js jsRealBServer
import {readFileSync} from "fs";
import { createServer } from "http";
import { parse } from 'url';

///////// 
//  load jsRealB file
import jsRealB from "./jsRealB.js";

// "evaluate" the exports (Constructors for terminals and non-terminal) in the current context
// so that they can be used directly
Object.assign(globalThis,jsRealB);

// load a Javascript init file given as parameter
if (process.argv.length>2 && process.argv[2].endsWith(".js")){
    // console.log("evaluate", process.argv[2])
    eval(readFileSync(process.argv[2],"utf-8"))
}

loadEn(true);

createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
   var req = parse(request.url, true);
   var query = req.query;
   var lang = query.lang
   var exp = query.exp
   if (lang=="en"){
       let errorType,sentence;
       try {        
           if (exp.startsWith("{")){
               errorType="JSON";
               const jsonExp=JSON.parse(exp);
               sentence=fromJSON(jsonExp).realize();
           } else {
               errorType="jsRealB expression";
               sentence=eval(exp).realize();
           }
           response.end(sentence)
       } catch (e) {
           const mess=`${e}\nErroneous realization from ${errorType}\n`
           if (errorType=="JSON"){
               try { // pretty-print if possible... i.e. not a JSON error
                   response.end(mess+ppJSON(JSON.parse(exp)))
               } catch(e){ // print line as is
                   response.end(mess+exp);
               }
           } else {
               response.end(mess+exp)
           }
       }
   } else {
       response.end('Language should be "en", but '+lang+' received\n')
   }
}).listen(8081);
// Console will print the message
console.log('jsRealB server [built on %s] running at http://127.0.0.1:8081/',jsRealB_dateCreated);

/* 
start server with : node ./dist/jsRealB-server.js
try these examples in a browser
http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))
that should display:
The man loves.
*/