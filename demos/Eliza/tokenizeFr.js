import {buildLemmataMap} from "../../src/jsRealB.js"

export {lemmataFr, tokenizeFr}
let lemmataFr;

//  Heuristic for splitting a French sentence in words, expanding elisions and contractions
function tokenizeFr(sentence){
    const elidableFRList = ["ce", "la", "le", "je", "me", "te", "se", "de", "ne", "que", "puisque", "lorsque", "jusque", "quoique" ]
    const contractionFrTable={
        "au":"à+le","aux":"à+les","ç'a":"ça+a",
        "du":"de+le","des":"de+les","d'autres":"de+autres",
        "s'il":"si+il","s'ils":"si+ils"};

    // split on non French letter and apostrophe and remove empty tokens
    const words = sentence.toLowerCase().split(/[^a-z'àâéèêëîïôöùüç]/).filter(w=>w.length>0) 
    // expand elision and contraction
    let i=0
    while (i<words.length){
        const word=words[i];
        if (!lemmataFr.has(word)){
            // word does not exist try to expand elision or contraction
            let m = /(.*?)'([haeiouyàâéèêëîïôöùüç].*)/.exec(word) // check for apostrophe followed by vowell or h
            if (m != null ){ 
                for (let elw of elidableFRList){ // expand elision
                    if (elw.startsWith(m[1])){
                        words.splice(i,1,...[elw,m[2]])
                        i++
                        break;
                    }
                }
            } else { // expand contraction
                if (contractionFrTable[word] !== undefined){
                    words.splice(i,1,...contractionFrTable[word].split("+"))
                    i++
                }
            }
        }
        i++
    }
    return words
}

lemmataFr = buildLemmataMap("fr")
