//  this file is essentially the same as IDE/nodeIDE.js
//   except for the import/export statements that I never managed to get working

/* uncomment this for testing this file alone 
import {Constituent, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP,
    root, subj, det, mod, comp, coord,
    loadFr, loadEn, load, addToLexicon, getLanguage, getLemma, getLexicon, getRules,
    jsRealB_dateCreated, jsRealB_version, oneOf, choice, mix,
    fromJSON, ppJSON} from "./../../src/jsRealB.js"
*/
// comment next line for testing this file alone
Object.assign(globalThis,jsRealB);
const lexiconEn = getLexicon("en");
const ruleEn = getRules("en");

const lexiconFr = getLexicon("fr")
const ruleFr = getRules("fr")

// Only set this flag during development 
const checkAmbiguities=false;
let lemmataEn,lemmataFr,lemmataLang;

//////////// LEMMATIZATION

// start of functions
function showLemmata(lemmata){
    console.log("-------")
    var keys=Array.from(lemmata.keys());
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        var key=keys[i]
        console.log(key,":",""+lemmata.get(key))
    }
}

function addLemma(lemmata,word,jsrExp){
    if (checkAmbiguities){
        // check if jsRealB generates the same string...
        var genWord=jsrExp.realize();
        if(genWord!=word){
            // ignore differences for French "essentiellement réflexifs" verbs
            if (lemmataLang == "en" || !jsrExp.isA("V") || !jsrExp.isReflexive() || 
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

function jsrExpInit(pos,lemma){
    return fromJSON({"terminal":pos,"lemma":lemma,"lang":lemmataLang})
}

// generate a list of jsRealB expressions (only Pro will have more than 1)
//  from a given form (entry), for a given part-of-speech (pos)
//  using information from the declension and lexicon information (declension, lexiconEntry)

// generate a jsRealB Terminal
//  from a given form (entry), for a given part-of-speech (pos)
//  using information from the declension and lexicon information (declension, lexiconEntry)
function genExp(declension,pos,lemma,lexiconEntry){
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
            var f=declension["f"];
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

function expandConjugation(lexicon,lemmata,rules,lemma,tab){
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
                let jsrExp=jsrExpInit("V",lemma)
                if (t != "p") jsrExp.t(t)  
                addLemma(lemmata,word,jsrExp);
        } else {
            console.log("***Strange persons:",lemma,tenses,k,persons);
        }
    }
}

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

function buildLemmata(lang,lexicon,rules){
    lemmataLang=lang;
    if (checkAmbiguities){
        console.log("Checking ambiguities for %s lemmata ...",lang=="en"?"English":"French")
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
            if (pos=="basic" || pos=="value") continue; // ignore these properties
            if (pos=="Pc") continue; // ignore punctuation
            if (pos=="V"){ // conjugation
                expandConjugation(lexicon,lemmata,rules,entry,entryInfos["V"]["tab"]);
            } else {       // declension
                expandDeclension(lexicon,lemmata,rules,entry,pos,entryInfos[pos]["tab"]);
            }
        }
    }
    return lemmata;
}

function lemmatize(query,lang){
    function removeAccent(s){
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }
    lang=lang||getLanguage()
    const lemmata = lang=="en" ? lemmataEn : lemmataFr;
    if (lemmata.has(query)) // check for verbatim
        return lemmata.get(query).map(e=>e.toSource()).join("\n")
    // try to match with a regular expression
    const re=new RegExp("^"+query+"$");
    let res=[];
    for (let key of lemmata.keys()){
        if (re.test(key))res.push(key+": "+lemmata.get(key).map(e=>e.toSource()).join("; "));
    }
    if (res.length==0){
        return query+" : "+(getLanguage()=="en"?"cannot be lemmatized":"ne peut être lemmatisé");
    } else {
        // sort without accent to get more usual dictionary order
        res.sort((a,b)=>a==b?0:removeAccent(a)<removeAccent(b)?-1:1);
        return res.join("\n");
    }
}
/////////// Resource query

function getNo(no,table,errorMessage){
    if (no in table)
        return table[no];
    // try to match with a regular expression
    const re=new RegExp("^"+no+"$");
    let res=[];
    for (var key of Object.keys(table)){
        if (re.test(key))res.push(key+":"+ppJSON(table[key],key.length+1));
    }
    if (res.length==0)
        return no+":"+errorMessage;
    return res.join("\n")
}

function getEnding(ending,table,errorMessage){
    const re=new RegExp("^"+ending+"$");
    let res=[];
    for (var key of Object.keys(table)){
        if (re.test(table[key].ending))res.push(key+":"+ppJSON(table[key],key.length+1));
    }
    if (res.length==0)
        return ending+":"+errorMessage
    return res.join("\n")
}

function getConjugation(no,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getNo(no,ruleEn.conjugation,"no conjugation found");
    return getNo(no,ruleFr.conjugation,"pas de conjugaison trouvée");
}

function getConjugationEnding(ending,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getEnding(ending,ruleEn.conjugation,"no conjugation found");
    return getEnding(ending,ruleFr.conjugation,"pas de conjugaison trouvée");
}

function getDeclension(no,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getNo(no,ruleEn.declension,"no declension found");
    return getNo(no,ruleFr.declension,"pas de déclinaison trouvée");
}

function getDeclensionEnding(ending,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getEnding(ending,ruleEn.declension,"no declension found");
    return getEnding(ending,ruleFr.declension,"pas de déclinaison trouvée");
}

function getLexiconInfo(word,lang){
    lang=lang||getLanguage()
    var lexicon=(lang=="en")?lexiconEn:lexiconFr;
    if (word in lexicon)
        return {[word]:lexicon[word]};
    // try with a regular expression
    var res={}
    var regex=new RegExp("^"+word+"$",'i')
    for (let w in lexicon){
        if (regex.exec(w))res[w]=lexicon[w];
    }
    if (Object.keys(res).length==0)
        return word+(lang=="en"? ": not in English lexicon" : ": absent du lexique français")
    else return res;
    
}

function buildLemmataEn(){
    lemmataEn=buildLemmata("en",lexiconEn,ruleEn);
}

function buildLemmataFr(){
    lemmataFr=buildLemmata("fr",lexiconFr,ruleFr);
}

/* uncomment next lines for testing this file alone
// a few tests
loadEn()
buildLemmataEn()
console.log("---")
console.log(lemmatize("love"))
console.log("---")
loadFr()
buildLemmataFr()
console.log("---")
console.log(lemmatize("porte"))
console.log(lemmatize("s..s"))
*/