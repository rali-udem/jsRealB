/* uncomment this for testing this file alone */
import {Constituent, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP} from "../../src/jsRealB.js"

import {lemmataFr, tokenizeFr} from "./lemmatize.js"
import { keywordsFr, elizaFinals, elizaQuits, elizaInitials } from "./keywordsFr.js";

export {elizaInitials, elizaQuits, elizaFinals, keywordsFr, enKeys, select, choose, tokenizeFr,mememot,matchDecomp, getTerminals}

// sort keywords in decreasing order of "rank"
keywordsFr.sort((k1,k2) => k2.rank - k1.rank )

//  create table of English keywords (used in testAll and "goto keyword")
let enKeys = {}
keywordsFr.forEach(function(kw){
    enKeys[kw.key_en]=kw; // add table entry
    for (let pat of kw.pats){
        pat.idx_reasmb = pat.reasmb.length-1 // to keep track of last reasmb alternative used
    }
})

// find all terminals that can generate a given string and sort them heuristically by POS "frequency"
function getTerminals(word){
    const terminalOrder = {"D":0,"N":1,"V":2,"A":3,"Pro":4,"Adv":5,"P":6,"C":7,"DT":8,"NO":9,"Q":10}
    if (lemmataFr.has(word)){
        let terms = lemmataFr.get(word)
        terms.sort((t1,t2)=>terminalOrder[t1.constType]-terminalOrder[t2.constType])
        return terms
    }
    return [Q(`${word}`)]
}    

function showTerminalLists(terminalLists){
    for (let tl of terminalLists){
        console.log(tl[0].realize()+" : "+tl.map(e=>e.toSource()).join(", "))
    }
    console.log("----")    
}

// returns the decomp term if it matches one of the term in the terms list 
function mememot(term1,term2,props){ 
    if (Array.isArray(term1)){
        for (let term of term1){
            if (mememot(term,term2,props) != null)
                return term
        }
        return null
    }
    if (Array.isArray(term2)){
        for (let term of term2){
            if (mememot(term1,term,props) != null)
                return term1
        }
        return null
    }
    if (term1.constType == term2.constType && term1.lemma == term2.lemma){
        if (props){ // vérifier aussi les propriétés
            for (let prop of ["pe","g","n","t"]){
                let p = term1.getProp(prop);
                if (p !== undefined && p != term2.getProp(prop))return null
            }
        }
        return term1
    }
    return null
}

function changePerson(group,use_majestic){
    let res = []
    for (let termList of group){
        let term = termList[0]
        // console.log(term.realize(),term.lemma, term.getProp("pe"))
        let pe = term.getProp("pe");
        if (pe==1)
            term = term.pe(2)
        if (term.lemma == "mon" && use_majestic){
            term.setLemma("notre")
        }
        res.push(term)
    }
    return res;
}

function matchDecomp(decomps,terminals,use_majestic){
    let groups=[terminals]
    let last = decomps.length-1
    let iTerm=0
    for (let iDecomp=0;iDecomp<=last;iDecomp++){
        if (mememot(decomps[iDecomp],Q("*")) != null){ //  deal with * 
            if (iDecomp==last){
                // faire un groupe avec le premier terminal de tout le reste
                groups.push(changePerson(terminals.slice(iTerm),use_majestic)) 
            } else {
                let group = []
                let nextWord = decomps[iDecomp+1]
                while (mememot(nextWord, terminals[iTerm],true)==null){ // skip terminal until the nextword in decomp
                    group.push(terminals[iTerm])
                    iTerm++;
                    if (iTerm >= terminals.length) break
                }
                groups.push(changePerson(group,use_majestic))
            }
        } else if (iTerm >=terminals.length){ // décomp too long for terminals
            return null
        } else if (mememot(decomps[iDecomp],terminals[iTerm],true)!=null){ // decomp word matches terminal
            iTerm++;
        } else {  // decomp word does not match terminal
            return null
        }
    }
     return groups
}

// choose a random element in a list
function choose(list){
    return list[Math.trunc(Math.random()*list.length)]
}

function select(pat){
    let idx = (pat.idx_reasmb+1)%pat.reasmb.length
    pat.idx_reasmb = idx
    const reasmb = pat.reasmb[idx]
    if (typeof reasmb == "function") return reasmb;
    // deal with goto ...
    return select(enKeys[reasmb.slice(5)].pats[0])
}
