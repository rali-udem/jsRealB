/* uncomment this for testing this file alone */
import {Constituent, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP} from "../../src/jsRealB.js"

import {lemmataFr, tokenizeFr} from "./lemmatize.js"
import { keywordsFr } from "./keywordsFr.js";


// find all terminals that can generate a given string and sort them heuristically by POS "frequency"
function getTerminals(word){
    const terminalOrder = {"D":0,"N":1,"V":2,"A":3,"Pro":4,"Adv":5,"P":6,"C":7,"DT":8,"NO":9,"Q":10}
    if (lemmataFr.has(word)){
        let terms = lemmataFr.get(word)
        terms.sort((t1,t2)=>terminalOrder[t1.constType]-terminalOrder[t2.constType])
        return terms
    }
    return [Q(`*${word}*`)]
}    

function showTerminalLists(terminalLists){
    for (let tl of terminalLists){
        console.log(tl[0].realize()+" : "+tl.map(e=>e.toSource()))
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
            for (let prop of ["pe","g","n"]){
                let p = term1.getProp(prop);
                if (p !== undefined && p != term2.getProp(prop))return null
            }
        }
        return term1
    }
    return null
}


function matchDecomp(decomps,terminals){
    let groups=[] 
    let last = decomps.length-1
    let iTerm=0
    for (let iDecomp=0;iDecomp<=last;iDecomp++){
        if (mememot(decomps[iDecomp],Q("*")) != null){ //  deal with * 
            if (iDecomp==last){
                // faire un groupe avec le premier terminal de tout le reste
                groups.push([SP(terminals.slice(iTerm).map(ts=>ts[0]))]) 
            } else {
                let group = []
                let nextWord = decomps[iDecomp+1]
                while (mememot(nextWord, terminals[iTerm],true)==null){ // skip terminal until the nextword in decomp
                    group.push(nextWord)
                    iTerm++;
                    if (iTerm >= terminals.length) break
                }
                groups.push([SP(group)])
            }
        } else if (iTerm >=terminals.length){ // décomp too long for terminals
            return null
        } else if (mememot(decomps[iDecomp],terminals[iTerm],true)!=null){ // decomp word matches terminal
            iTerm++;
        } else {  // decomp word does not match terminal
            return null
        }
    }
    groups.unshift(terminals.map(t=>t[0])) // groups[0] matches all words (select only the first one)
    return groups
}

function select(elems){
    if (elems.length==0){
        const v = "select vide"  // pour lancer le débugger quand ça plante à cause d'erreur dans les données
        return
    }
    const e = elems[Math.floor(Math.random()*elems.length)]
    if (typeof e == "function") return e
    // traiter un goto en allant traiter le premier groupe de patterns associé à ce terminal
    return select(keywordsFr.find(kw => mememot(kw.key,e)!=null).pats[0].reasmb)
}


function transform(userText,pe,g,all){
    let terminals = tokenizeFr(userText).map(getTerminals);
    for (let keyword of keywordsFr){
        if (terminals.some(t=>mememot(keyword.key,t)!==null)){// check for keyword
            for (let pat of keyword.pats){
                let groups = matchDecomp(pat.decomp,terminals);
                if (groups !== null){
                    if (all){
                        return [`@$pe=${pe}, g=${g} @`,
                            ...pat.reasmb.map(fn=>(typeof(fn) == "function" ? fn(groups,g).typ({"maje":true}):fn).realize()),
                            "@@@@"].join("\n")
                    }
                    return select(pat.reasmb)(groups,g).typ({"maje":true}).realize() 
                }
            }
        }
    }
    return "Je suis sans mots!"
}

function chat(inputs,pe,g,all){
    for (let input of inputs){
        console.log("User:  "+input)
        console.log("Eliza: "+transform(input,pe,g,all))
    }
}


// console.log(transform("Je me rappelle manger de la soupe",2,"f","s"))
// console.log(transform("Il y a des fois où je me rappelle des enfants",3,"f","p"))

let userInputs = [
    "Je me rappelle manger de la soupe",
    "Il y a des fois où je me rappelle des enfants",
    "bye"
]
chat(userInputs,2,"f")
chat(["je vous demande pardon"],2,"m")
chat(["J'ai peur des machines"],2,"m",true)
chat(["Excusez-moi"],2,"m",true)
chat(["xnone"],2,"m",true)
chat(["Parfois, j'oublie de demander service à quelqu'un."],2,"m",true)
chat(["Dites-moi avez-vous oublié les anniversaires"],2,"f",true)
chat(["J'espère que vous vous rappelez de notre expérience"],2,"m",true)
