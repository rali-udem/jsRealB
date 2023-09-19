"use strict"
import {sentences} from "./data/AllSentences.js"

export {makeStructs,sentences,getIndices,tokenize,shuffle}

  // taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// return a list of shuffled indices for a list
function getIndices(list){
    return shuffle(Array.from(Array(list.length).keys()));
}

// split a string into tokens taking into account French accented letters
// because of the parentheses in the regex all tokens are kept. 
// Tokens with only spaces are removed
function tokenize(s){
    return s.split(/([^a-zA-Zà-üÀ-Ü]+)/).filter(e=>e.trim().length>0)
}

//  get value of parameter and evaluate it in the appropriate language if it is a function
function getParam(lang,val){
    if (typeof val == 'function'){
        load(lang);
        return val()
    }
    return val;
}

function makeStructs(sent, src,tgt){
  // for a given sentence sent, generate an exercise with the given source and target languages
  // HACK: the word selection is done by shuffling a new list of indices (so that the corresponding src and tgt words are selected)
  //       and taking (shifting) the first indices of this list when needed either for a word or a distractor
  //       Because currently inflection is done within the jsRealB structure, it is not applied to the corresponding distractor
  //       this would imply to reorganize the way the specifications are given 
    const [srcIdx,tgtIdx] = src=="fr" ? [0,1] : [1,0]
    // build the list of parameters and distractors for the target language
    let params=[], distractors=[];
    for (let ps of sent.params){
        if (!Array.isArray(ps[0]))ps=ps.map(e=>[e,e]); // src and tgt values are the same
        let indices = getIndices(ps);
        let idx=indices.shift();
        const param=new Array(2);
        param[srcIdx]=getParam(src,ps[idx][srcIdx])
        param[tgtIdx]=getParam(tgt,ps[idx][tgtIdx]);
        params.push(param);
        if (indices.length>0){
          if (typeof(param[tgtIdx])=="string" && param[tgtIdx].length>1){
              const distractor=ps[indices.shift()][tgtIdx];
              if (!distractors.includes(distractor))
                distractors.push(distractor)
          } else if (param[tgtIdx] instanceof Constituent){
                distractors.push(...tokenize(getParam(tgt,ps[indices.shift()][tgtIdx]).realize()))
          }
        }          
    }
    // create source and target structure
    load(src);
    const srcStruct = sent[src].apply(null,params.map(e=>e[srcIdx]));
    load(tgt);
    const tgtStruct = sent[tgt].apply(null,params.map(e=>e[tgtIdx]));
    return [srcStruct,tgtStruct,distractors,sent.id]
}
