// node.js unix "filter" which 
//   takes a input a one line containing a JSrealB expression in either JavsScript or JSON notation
//  it must be at least one non-space char long
//   it returns its English realisation if there is no error in the input
// call: node jsRealB-filter.js

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
    if (line.length>0){
        let errType,sentence;
        try {        
            if (line.startsWith("{")){
                errorType="JSON";
                sentence=fromJSON(JSON.parse(line)).toString();
            } else {
                errorType="jsRealB expression";
                sentence=eval(line).toString();
            }
            console.log(sentence)
        } catch (e) {
            console.error(`${e}\nErroneous ${errorType}: ${line}`)
        }
    }
})

// try this as input
// S(NP(D("the"),N("man")),VP(V("love")))
// or
// {"phrase":"S", "elements":[{"phrase":"NP", "elements":[{"terminal":"D", "lemma":"the"}, {"terminal":"N", "lemma":"man"}]}, {"phrase":"VP", "elements":[{"terminal":"V", "lemma":"love"}]}], "lang":"fr"}
// it should return in both cases
// The man loves.