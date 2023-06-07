//  this script can be executed by itself using node.js to generate many sentences
//  to check if the sentence patterns do something reasonable

let {default:jsRealB} = await import("../../dist/jsRealB.js");
Object.assign(globalThis,jsRealB);

import {makeStructs,sentences} from "./Sentences.js"

// basic validation of sentence structures
function sameForm(list){
    if (list.length==0) return false;
    const first=list[0];
    if (Array.isArray(first)){
        const firstType=typeof first[0];
        return !list.some(e=>e.length!=2 || typeof e[0]!=firstType || typeof e[1]!=firstType)
    } else {
        const firstType=typeof first;
        return !list.some(e=>typeof e != firstType)
    }
}

function validateSentence(sent){
    const text=sent.text;
    const frF=sent.fr;
    const nbParamsF=sent.fr.length;
    const enF=sent.en;
    const nbParamsE=sent.en.length;
    if (nbParamsF!=nbParamsE){
        console.log(text+": bad number of function arguments: fr:"+nbParamsF+" != "+nbParamsE);
        return
    }
    const params=sent.params;
    if (params.length!=nbParamsF){
        console.log(text+": bad number of parameters:"+params.length+" != "+nbParamsF);
        return;
    }
    for (let i=0; i<params.length;i++){
        if (! sameForm(params[i])){
            console.log(text+": parameter "+i+": bad format")
            return;
        }
    }
}

for (let sentence of sentences)
    validateSentence(sentence);
console.log("** end of sentence validation")

function makeSentences(sent,src,tgt){
    const t = oneOf([{fr:"p","en":"p"},{fr:"pc","en":"ps"},{fr:"f","en":"f"}]);
    const typ = oneOf([{},{neg:true},{prog:true},{"mod":"poss"},{"int":"yon"},{"int":"tag"}]);
    let res={};
    [res[src],res[tgt],res["distractors"]]=makeStructs(sent,src,tgt);
    res[src].t(t[src]).typ(typ);
    res[tgt].t(t[tgt]).typ(typ);
    res.t = t[src];
    res.typ = typ;
    return res;
}

function showSentences(sent,src,tgt){
    const sents=makeSentences(sent,src,tgt);
    let res=[];
    res.push(sents[src].realize(src));
    res.push(sents[tgt].realize(tgt));
    res.push(sents["distractors"]);
    console.log(sent["id"].toString().padEnd(5),sents.t.padEnd(2),JSON.stringify(sents.typ).padEnd(15),":",res.join(" || "))
}

for (let sent of sentences){
  showSentences(sent,"fr","en");
  showSentences(sent,"en","fr");
}

