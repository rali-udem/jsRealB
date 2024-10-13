import {Constituent, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP} from "../../src/jsRealB.js"

import {lemmataFr, tokenizeFr} from "./lemmatize.js"
import { keywordsFr, elizaFinals, elizaQuits, elizaInitials } from "./keywordsFr.js";

export {elizaInitials, elizaQuits, elizaFinals, keywordsFr, enKeys, 
        select, choose, tokenizeFr,mememot,matchDecomp, getTerminals, 
        showTerminalLists, getKeyword, getQuestion, changePerson}

// Forcer la réalisation avec realize, plus pratique pour la mise au point
Constituent.debug=true;

// Trier les mots-clés en ordre décroissant de "rank"
keywordsFr.sort((k1,k2) => k2.rank - k1.rank )

//  Créer une table des mots-clés en anglais 
//  utilisé dans testAll et "goto keyword")
let enKeys = {}
keywordsFr.forEach(function(kw){
    enKeys[kw.key_en]=kw; // add table entry
    for (let pat of kw.pats){
        // nouvel attribut pour garder trace de la dernière alternative générée
        pat.idx_reasmb = pat.reasmb.length-1 
    }
})

// Trouver les terminaux qui peuvent réaliser "word" et les trier par leur fréquence de POS (heuristique)
function getTerminals(word){
    const terminalOrder = {"D":0,"N":1,"V":2,"A":3,"Pro":4,"Adv":5,"P":6,"C":7,"DT":8,"NO":9,"Q":10}
    if (lemmataFr.has(word)){
        let terms = lemmataFr.get(word)
        terms.sort((t1,t2)=>terminalOrder[t1.constType]-terminalOrder[t2.constType])
        return terms
    }
    return [Q(word)]
}    

// afficher des listes de terminaux (pour la mise au point)
function showTerminalLists(terminalLists){
    for (let tl of terminalLists){
        console.log(tl[0].realize()+" : "+tl.map(e=>e.toSource()).join(", "))
    }
    console.log("----")    
}

// vérifier si "term1" correspond à "term2" (i.e. même constType et même lemme))
// si props==true, on vérifie aussi les propriétés "pe","g","n","t"
// si la valeur de la propriété de term1 est "x", on accepte toutes les valeurs
// si term1 ou term2 sont des listes, il suffit qu'un des éléments de la liste match
function mememot(term1,term2,props){ 
    if (Array.isArray(term1)){
        for (let term of term1){
            if (mememot(term,term2,props) != null)
                return term2
        }
        return null
    }
    if (Array.isArray(term2)){
        for (let term of term2){
            if (mememot(term1,term,props) != null)
                return term
        }
        return null
    }
    if (term1.constType == term2.constType && term1.lemma == term2.lemma){
        if (props){ // vérifier aussi les propriétés, en ignorant les valeurs absentes ou "x"
            for (let prop of ["pe","g","n","t"]){
                let p = term1.getProp(prop);
                if (p !== undefined && p != "x"){
                    if (p != term2.getProp(prop))return null
                }
            }
        }
        return term2
    }
    return null
}

// changer les premières personnes en deuxième (et vice-versa) dans une liste de terminaux
// S'il y a des changements alors on recrée de nouveaux terminaux avec "clone" 
function changePerson(group,use_majestic){
    let res = []
    for (let termList of group){
        let term = termList[0]
        if (term.isA("Pro","D","V")){
            let pe = term.getProp("pe");
            if (pe==1)
                term = term.clone().pe(2)
            else if (pe==2)
                term = term.clone().pe(1).n("s")
            if (term.lemma == "mon" && use_majestic){
                term = term.clone().setLemma("notre").maje(false)
            }
        }
        res.push(term)
    }
    return res;
}

// simili regex pour matcher une expression de décomposition avec des * et une liste de terminaux
// Si use_majestic est true,  on change les personnes dans les terminaux des groupes 
function matchDecomp(decomps,terminals,use_majestic){
    let groups=[[Q("dummy")]] // inutilisé, mais permet d'indexer à partir de 1
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
                while (mememot(nextWord, terminals[iTerm],true)==null){ // sauter ce  terminal jsuqu'au prochain mot de décomp
                    group.push(terminals[iTerm])
                    iTerm++;
                    if (iTerm >= terminals.length) break
                }
                groups.push(changePerson(group,use_majestic))
            }
        } else if (iTerm >=terminals.length){ // décomp trop long pour terminals
            return null
        } else if (mememot(decomps[iDecomp],terminals[iTerm],true)!=null){
            // mot de decomp correspond au terminal
            iTerm++;
        } else {  // decomp word does not match terminal
            return null
        }
    }
     return groups
}

// choisir un élément au hasard dans une liste
function choose(liste){
    return liste[Math.trunc(Math.random()*liste.length)]
}

// retourner la prochaine alternative dans une liste de pattern 
function select(pat){
    let idx = (pat.idx_reasmb+1)%pat.reasmb.length // trouver le prochain index
    pat.idx_reasmb = idx                           // mettre à jour l'index
    return pat.reasmb[idx]
 }

 // trouver le mot clé dont la clé match un des terminaux
 function getKeyword(terminals){
    const idx = keywordsFr.findIndex(
        keyword=>terminals.some(t=>mememot(keyword.key,t)!==null)
    )
    if (idx>=0)return keywordsFr[idx]
    return null;
 }

 // retourner la fonction question qui matche un pattern dans un mot-clé avec les groupes
 // traite aussi le cas du "goto" en se rappelant récursivement
 function getQuestion(terminals,keyword,use_majestic,trace){
    for (let pat of keyword.pats){
        let groups = matchDecomp(pat.decomp,terminals,use_majestic);
        if (groups != null){
            if (trace) console.log("groups: /",groups.slice(1).map(g=>g.map(t=>t.realize())).join("/"),"/")
            let questionFn = select(pat);
            if (typeof questionFn != "function"){// traiter le goto
                if (trace) console.log("=>",questionFn);
                return getQuestion(terminals,enKeys[questionFn.slice(5)],use_majestic,trace);
            }
            return [questionFn,groups];
        }
    }
    return [null,null];
 }
