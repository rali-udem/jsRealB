// node.js unix "filter" which 
//   takes a input a one line containing a JSrealB expression (must be at least one non-space char long)
//   returns its English realisation
// call: node filter-enfr.js

//////// 
//  load JSrealB
var fs = require('fs');
var jsrealb=require('./jsRealB-node.js');
// eval exports 
for (var v in jsrealb){
    eval("var "+v+"=jsrealb."+v);
}

loadEn();
// eval(fs.readFileSync(__dirname+'/addLexicon-dme.js').toString());

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
    line=line.trim();
    if (line.length>0)
        console.log(eval(line).toString());
})

// try this as input
// S(NP(D("the"),N("man")),VP(V("love")))
// it should return
// The man loves.