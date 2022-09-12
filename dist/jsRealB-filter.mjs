// node.js unix "filter" which 
//   takes a input a one line containing a jsRealB expression in either JavsScript or JSON notation
//  it must be at least one non-space char long
//  it returns its English realisation if there areee no error in the input
// call: node jsRealB-filter.js

//////// 
//  load JSrealB
import jsRealB from './jsRealB.js';
Object.assign(globalThis,jsRealB);

loadEn();

import { createInterface } from 'readline';
var rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function realizeSentence(input,lang,okFunc,errFunc){
    let errorType,sentence;
    try {        
        if (input.startsWith("{")){
            errorType="JSON";
            const jsonExp=JSON.parse(input);
            if (jsonExp["lang"]){ // check specified language in the JSON
                if (jsonExp["lang"]!=lang){
                    errFunc("specified language should be "+lang+" not "+jsonExp["lang"]);
                    jsonExp["lang"]=lang;
                } else {
                    jsonExp["lang"]=lang;
                }
            }
            sentence=fromJSON(jsonExp).toString();
        } else {
            errorType="jsRealB expression";
            sentence=eval(input).toString();
        }
        okFunc(sentence)
    } catch (e) {
        errFunc(`${e}\nErroneous realization from ${errorType}`)
        if (errorType=="JSON"){
            try { // pretty-print if possible... i.e. not a JSON error
                errFunc(ppJSON(JSON.parse(input)))
            } catch(e){ // print line as is
                errFunc(input);
            }
        } else {
            errFunc(input)
        }
    }
}

rl.on('line', function(line){
    line=line.trim();
    if (line.length>0){
        realizeSentence(line,"en",console.log,console.error)
    }
})

// try this as input
// S(NP(D("the"),N("man")),VP(V("love")))
// or
// {"phrase":"S", "elements":[{"phrase":"NP", "elements":[{"terminal":"D", "lemma":"the"}, {"terminal":"N", "lemma":"man"}]}, {"phrase":"VP", "elements":[{"terminal":"V", "lemma":"love"}]}], "lang":"en"}
// it should return in both cases
// The man loves.
//   test of erroneous input 
// S(NP(D("the"),N("man")),VP(V("love",true)))
// {"phrase":"S", "elements":[{"phrase":"NP", "elements":[{"terminal":"D", "lemma":"the"}, {"terminal":"N", "lemma":"man"}]}, {"phrase":"VP", "elements":[{"terminal":"V", "lemma":3}]}], "lang":"en"}
