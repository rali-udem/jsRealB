/**
    jsRealB 5.2
    Guy Lapalme, lapalme@iro.umontreal.ca, December 2024

    Build a Map of jsRealB Terminal expressions that can generate a given form
    by traversing all entries of a lexicon
 */

import { getLanguage, getLexicon, getRules } from "./Lexicon.js"
import { fromJSON } from "./JSON-tools.js";
import { load } from "./jsRealB.js"
export {buildLemmataMap}

let checkAmbiguities = false  // only enable this during development

/**
 * Print the content of a Map by writing the source version of each Terminal
 * @param {Map} lemmata 
 */
function showLemmata(lemmata){
    console.log("-------")
    var keys=Array.from(lemmata.keys());
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        var key=keys[i]
        console.log(key,":",""+lemmata.get(key).toSource())
    }
}

/**
 * Add a jsRealB expression to the list associated with a word form
 * If the word form is not already in the Map, the list is created.
 * 
 * If the variable checkAmbiguities is true, then the expression is 
 * regenerated and compared with the word form. This is useful for 
 * debugging the jsrExp generation algorithm
 *
 * @param {Map} lemmata map to update
 * @param {string} word word form
 * @param {Terminal} jsrExp expression that can generate the word
 */
function addLemma(lemmata,word,jsrExp){
    if (checkAmbiguities){
        // check if jsRealB generates the same string...
        var genWord=jsrExp.realize();
        if(genWord!=word){
            // ignore differences for French "essentiellement réflexifs" verbs
            if (getLanguage() == "en" || !jsrExp.isA("V") || !jsrExp.isReflexive() || 
                   (!genWord.endsWith(word) && !genWord.startsWith(word)))
                console.log("%s => %s != %s",jsrExp.toSource(),genWord,word);
        }
    }
    // add word
    // console.log("addLemma",word,jsRexp);
    var l=lemmata.get(word);
    if (l===undefined)lemmata.set(word,l=[]);
    l.push(jsrExp);
}

/**
 * Create a Terminal for given part-of-speech and lemma in the current language
 *
 * @param {string} pos
 * @param {string} lemma
 * @returns {Terminal}
 */
function jsrExpInit(pos,lemma){
    return fromJSON({"terminal":pos,"lemma":lemma,"lang":getLanguage()})
}

/**
 * Generate a list of jsRealB expressions (only Pro will have more than 1) 
 * from a given form (entry), for a given part-of-speech (pos) using information 
 * from the declension and lexicon information (declension, lexiconEntry)
 *
 * @param {Object} declension declension table
 * @param {string} pos part-of-speech
 * @param {string} lemma
 * @param {Object} lexiconEntry
 * @returns {Terminal} 
 */
function genExp(declension,pos,lemma,lexiconEntry){
    let lemmataLang = getLanguage()
    let jsrExp = jsrExpInit(pos,lemma)
    // console.log("genExp",declension,pos,entry,lexiconEntry);
    switch (pos) {
    case "N":
        var g=lexiconEntry["g"];
        // gender are ignored in English
        if (lemmataLang=="en"|| declension["g"]==g){
            if (declension["n"]=="p")jsrExp.n("p")
        } else if (g=="x") {
            if (declension["g"]=='f') jsrExp.g("f");
            if (declension["n"]=="p") jsrExp.n("p");
        }
        break;
    case "Pro":case "D":
        // gender
        let defaultG=lemmataLang=="fr"?"m":"n";
        let dg = declension["g"];
        if (dg===undefined || dg=="x" || dg=="n")dg=defaultG;
        if (dg != defaultG) jsrExp.g(dg);
        let dn = declension["n"];
        if (dn===undefined || dn=="x")dn="s";
        if (dn != "s")jsrExp.n(dn);
        if ("pe" in declension){
            var pe=declension["pe"];
            if (pe!=3 || lemma=="moi")jsrExp.pe(pe)
        }
        if ("own" in declension){
            jsrExp.ow(declension["own"])
        }
        if ("tn" in declension){
            jsrExp.tn(declension["tn"])
        } else if ("c" in declension){
            jsrExp.c(declension["c"])
        }
        break;
    case "A": 
        if (lemmataLang=="fr"){
            let g=declension["g"];
            if (g===undefined || g=="x")g="m";
            if (g!="m") jsrExp.g(g)
            let n=declension["n"];
            if (n===undefined)n="s";
            if (n!="s") jsrExp.n(n)
        } else { // comparatif en anglais
            let f=declension["f"];
            if (f !== undefined) jsrExp.f(f)
         }
        break;
    case "Adv":
        if (lemmataLang=="en"){ // comparatif en anglais
            let f=declension["f"];
            if (f !== undefined) jsrExp.f(f)
        }
        break;
    default:
        console.log("***POS not implemented:%s",pos)
    }
    return jsrExp;
}

/**
 * Generate all verb forms in a lemmataMap using rules  
 *
 * @param {Map} lemmata
 * @param {Object} rules
 * @param {string} lemma
 * @param {string} tab
 */
function expandConjugation(lemmata,rules,lemma,tab){
    let conjug=rules["conjugation"][tab];
    // console.log(conjug);
    if (conjug==undefined)return;
    let ending=conjug["ending"];
    let endRadical=lemma.length-ending.length;
    let radical=lemma.slice(0,endRadical);
    if (lemma.slice(endRadical)!=ending){
        console.log("strange ending:",lemma,":",ending);
        return;
    }
    let tenses=Object.keys(conjug["t"]);
    for (let k = 0; k < tenses.length; k++) {
        let t=tenses[k];
        let persons=conjug["t"][t]
        if (persons===null)continue;
        if (typeof persons =="object" && persons.length==6){
            for (let pe = 0; pe < 6; pe++) {
                if (persons[pe]==null) continue;
                let word=radical+persons[pe];
                let pe3=pe%3+1;
                let n=pe>=3?"p":"s";
                let jsrExp=jsrExpInit("V",lemma)
                if (t != "p") jsrExp.t(t);
                if (pe3 != 3) jsrExp.pe(pe3);
                if (n != "s") jsrExp.n(n);
                addLemma(lemmata,word,jsrExp);
            }
        } else if (typeof persons=="string"){
                let word = radical+persons;
                let jsrExp=jsrExpInit("V",lemma);
                if (t != "p") jsrExp.t(t);
                addLemma(lemmata,word,jsrExp);
                if (t == "pp" && getLanguage()=="fr" && word != "été"){
                    if (word.endsWith("û"))word = word.slice(0,-1)+"u";
                    addLemma(lemmata,word+"e",jsrExp.clone().g("f"));
                    addLemma(lemmata,word+(word.endsWith("s")?"":"s"),jsrExp.clone().n("p"));
                    addLemma(lemmata,word+"es",jsrExp.clone().g("f").n("p"));
                }
        } else {
            console.log("***Strange persons:",lemma,tenses,k,persons);
        }
    }
}

/**
 * Generate word form for all pos except verbs
 *
 * @param {Object} lexicon
 * @param {Map} lemmata
 * @param {Object} rules
 * @param {string} entry
 * @param {string} pos
 * @param {string} tab
 */
function expandDeclension(lexicon,lemmata,rules,entry,pos,tab){
    var rulesDecl=rules["declension"];
    var declension=null;
    if (tab in rulesDecl)
        declension=rulesDecl[tab];
    else if (tab in rules["regular"] || declension == null){
        addLemma(lemmata,entry,jsrExpInit(pos,entry));
        return;
    }
    var ending=declension["ending"];
    var endRadical=entry.length-ending.length;
    var radical=entry.slice(0,endRadical);
    if (entry.slice(endRadical)!=ending){
        console.log("strange ending:",entry,":",ending);
        return;
    }
    var decl=declension["declension"];
    let seenVals=[]
    // console.log("decl",decl);
    for (var l = 0; l < decl.length; l++) {
        const dec = decl[l];
        if (!seenVals.includes(dec['val'])){ // do not generate identical values in the same table
            seenVals.push(dec['val']);
            var jsRexp=genExp(decl[l],pos,entry,lexicon[entry][pos]);
            if (jsRexp!=null){
                var word=radical+decl[l]["val"];
                addLemma(lemmata,word,jsRexp);
            }
        }
    }
}

/**
 * returns a Map with
 *  key : inflected form
 *  value : Array of Terminal objets that can be realized as the key
 *
 * @param {String} lang
 * @returns {Map}
 */
function buildLemmataMap(lang){
    load(lang)
    let lexicon = getLexicon()
    let rules = getRules()
    if (checkAmbiguities){
        console.log(lang=="en"?"Checking ambiguities for English lemmata ..."
                              :"Vérification de la table des lemmes en français")
    }
    let lemmata=new Map();  // use a Map instead of an object because "constructor" is an English word...
    let allEntries=Object.keys(lexicon);
    for (var i = 0; i < allEntries.length; i++) {
        var entry=allEntries[i];
        var entryInfos=lexicon[entry];
        var allPos=Object.keys(entryInfos);
        // console.log(entryInfos,allPos)
        for (var j = 0; j <  allPos.length; j++) {
            var pos=allPos[j];
            // console.log(entryInfos,j,pos);
            if (pos=="ldv" || pos == "niveau" || pos=="value") continue; // ignore these properties
            if (pos=="Pc") continue; // ignore punctuation
            if (pos=="V"){ // conjugation
                expandConjugation(lemmata,rules,entry,entryInfos["V"]["tab"]);
            } else {       // declension
                expandDeclension(lexicon,lemmata,rules,entry,pos,entryInfos[pos]["tab"]);
            }
        }
    }
    return lemmata;
}
