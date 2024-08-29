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
    return [Q(`${word}`)]
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
    function q(t){return Q(t[0].realize())} // quote realization of first acception
    let groups=[terminals.map(t=>q(t))]
    let last = decomps.length-1
    let iTerm=0
    for (let iDecomp=0;iDecomp<=last;iDecomp++){
        if (mememot(decomps[iDecomp],Q("*")) != null){ //  deal with * 
            if (iDecomp==last){
                // faire un groupe avec le premier terminal de tout le reste
                groups.push(terminals.slice(iTerm).map(t=>q(t))) 
            } else {
                let group = []
                let nextWord = decomps[iDecomp+1]
                while (mememot(nextWord, terminals[iTerm],true)==null){ // skip terminal until the nextword in decomp
                    group.push(nextWord)
                    iTerm++;
                    if (iTerm >= terminals.length) break
                }
                groups.push(group.map(t=>Q(t)))
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

function select(elems){
    if (elems.length==0){
        const v = "select vide"  // pour lancer le débugger quand ça plante à cause d'erreur dans les données
        return
    }
    const e = elems[Math.floor(Math.random()*elems.length)]
    if (typeof e == "function") return e
    // traiter un goto en allant traiter le premier groupe de patterns associé à ce terminal    
    const gotoKW = keywordsFr.find(kw => mememot(kw.key,e)!=null)
    if (gotoKW == undefined)return e; // s'il n'existe pas, pour le moment retourne le terminal...
    return select(gotoKW.pats[0].reasmb)
}


function transform(userText,g){
    let terminals = tokenizeFr(userText).map(getTerminals);
    for (let keyword of keywordsFr){
        if (terminals.some(t=>mememot(keyword.key,t)!==null)){// check for keyword
            for (let pat of keyword.pats){
                let groups = matchDecomp(pat.decomp,terminals);
                if (groups != null){
                    const fn = select(pat.reasmb)
                    if (typeof fn == "function")
                        return fn(groups,g).typ({"maje":true}).realize() 
                    return fn.realize()
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

function testAll(kw, userText){
    let terminals = tokenizeFr(userText).map(getTerminals);
    for (let keyword of keywordsFr){
        if (keyword.key instanceof Constituent && kw == keyword.key.lemma){
            console.log("** keyword:%s : %s",keyword.key.lemma,userText)
            for (let pat of keyword.pats){
                for (let fn of pat.reasmb){
                    if (typeof fn == "function"){
                        let groups = matchDecomp(pat.decomp,terminals);
                        if (groups != null){
                            console.log(fn(groups,"f").typ({"maje":true}).realize())
                        }
                    } else {
                        console.log(fn.lemma)
                    }
                }
            }
            return
        }
    }
    console.log("keyword:%s absent",keyword)
}


let userInputs = [
    "Je me rappelle manger de la soupe",
    "Il y a des fois où je me rappelle des enfants",
    "bye"
]
// chat(userInputs,"f")
// chat(["je vous demande pardon"],"m")
// chat(["J'ai peur des machines"],"m")
// chat(["Excusez-moi"],"m")
// chat(["xnone"],"m")
// chat(["Parfois, j'oublie de demander service à quelqu'un."],"m")
// chat(["Dites-moi avez-vous oublié les anniversaires"],"f")
// chat(["J'espère que vous vous rappelez de notre expérience"],"m")

// testAll("xnone","")
// testAll("excuser","excusez-moi")
// testAll("pardon","je vous demande pardon")
// testAll("rappeler","je me rappelle des choses")
// testAll("rappeler","vous vous rappelez de vos voyages")
// testAll("rappeler","ceci vous rappelle des bons souvenirs")
// testAll("oublier","J'oublie toujours les anniversaires")
// testAll("oublier","Quand avez-vous oublié de venir")
// testAll("si","Ah si j'avais su")
// testAll("rêve","J'ai fait un rêve avec des éléphants roses")
// testAll("peut-être","J'irai peut-être au ciel")
testAll("nom","je ne connais pas votre nom")
testAll("allemand","Parlez-moi en allemand")