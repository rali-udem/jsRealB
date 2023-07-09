//  this file is essentially the same as IDE/nodeIDE.js
//   except for the import/export statements that I never managed to get working

Object.assign(globalThis,jsRealB);
const lexiconEn = getLexicon("en");
const ruleEn = getRules("en");

const lexiconFr = getLexicon("fr")
const ruleFr = getRules("fr")

// Only set this flag during development, it takes a long time to execute
const checkAmbiguities=false;
let lemmataEn,lemmataFr,lemmataLang;

function isConstituent(obj){
    return obj instanceof Constituent;
}

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

function addLemma(lemmata,word,jsRexp){
    if (checkAmbiguities){
        // check if jsRealB generates the same string...
        var genWord=eval(jsRexp);
        if(genWord!=word){
            console.log("%s => %s != %s",jsRexp,genWord,word);
        }
    }
    // add word
    // console.log("addLemma",word,jsRexp);
    var l=lemmata.get(word);
    if (l===undefined)lemmata.set(word,l=[]);
    l.push(jsRexp);
}

// generate a list of jsRealB expressions (only Pro will have more than 1)
//  from a given form (entry), for a given part-of-speech (pos)
//  using information from the declension and lexicon information (declension, lexiconEntry)
function genExp(declension,pos,entry,lexiconEntry){
    var out = pos+'("'+entry+'")';
    // console.log("genExp",declension,pos,entry,lexiconEntry);
    switch (pos) {
    case "N":
        var g=lexiconEntry["g"];
        // gender are ignored in English
        if (lemmataLang=="en"|| declension["g"]==g){
            return out+(declension["n"]=="p"?'.n("p")':"");
        } else if (g=="x") {
            return out+'.g("'+declension["g"]+'")'+(declension["n"]=="p"?'.n("p")':"")
        }
        break;
    case "Pro":case "D":
        // gender
        let defGender=lemmataLang=="fr"?"m":"n";
        let dg = declension["g"];
        if (dg===undefined || dg=="x" || dg=="n")dg=defGender;
        const outG = dg==defGender?"":'.g("'+dg+'")';
        // number
        let dn = declension["n"];
        if (dn===undefined || dn=="x")dn="s";
        const outN = dn=="s"?"":'.n("'+dn+'")';
        // person
        let outPe=""
        if ("pe" in declension){
            var pe=declension["pe"];
            outPe+=(pe!=3 || entry=="moi")?'.pe('+pe+')':"";
        }
        // ow
        let outOw="";
        if ("own" in declension){
            outOw='.ow("'+declension["own"]+'")'
        }
        // combine all
        if ("tn" in declension){
            out+=outG + outN + outPe + outOw +`.tn("${declension["tn"]}")`
        } else if ("c" in declension){
            out+=outG + outN + outPe + outOw+`.c("${declension["c"]}")`
        } else {
            out+=outG + outN + outPe + outOw
        }
        return out;
        break;
    case "A": 
        if (lemmataLang=="fr"){
            var g=declension["g"];
            if (g===undefined || g=="x")g="m";
            var n=declension["n"];
            if (n===undefined)n="s";
            return out+(g!="m"?'.g("'+g+'")':'')+(n!="s"?'.n("'+n+'")':'');
        } else { // comparatif en anglais
            var f=declension["f"];
            return out+(f==undefined?"":'.f("'+f+'")');
        }
        break;
    case "Adv":
        if (lemmataLang=="fr"){
            return out;
        } else {
            var f=declension["f"];
            return out+(f==undefined?"":'.f("'+f+'")');
        }
        break;
    default:
        console.log("***POS not implemented:%s",pos)
    }
    return null;
}

function expandConjugation(lexicon,lemmata,rules,entry,tab){
    var conjug=rules["conjugation"][tab];
    // console.log(conjug);
    if (conjug==undefined)return;
    var ending=conjug["ending"];
    var endRadical=entry.length-ending.length;
    var radical=entry.slice(0,endRadical);
    if (entry.slice(endRadical)!=ending){
        console.log("strange ending:",entry,":",ending);
        return;
    }
    var tenses=Object.keys(conjug["t"]);
    for (var k = 0; k < tenses.length; k++) {
        var t=tenses[k];
        var persons=conjug["t"][t]
        if (persons===null)continue;
        if (typeof persons =="object" && persons.length==6){
            for (var pe = 0; pe < 6; pe++) {
                if (persons[pe]==null) continue;
                var word=radical+persons[pe];
                var pe3=pe%3+1;
                var n=pe>=3?"p":"s";
                var jsRexp='V("'+entry+'")'+(t!="p"?'.t("'+t+'")':'')
                                           +(pe3!=3?'.pe('+pe3+')':'')
                                           +(n!='s'?'.n("'+n+'")':'');
                addLemma(lemmata,word,jsRexp);
            }
        } else if (typeof persons=="string"){
            // if (lemmataLang=="en" && t=="b")
            //     addLemma(lemmata,"to "+radical+persons,'V("'+entry+'").t("b")')
            // else
                addLemma(lemmata,radical+persons,'V("'+entry+'")'+(t!="p"?'.t("'+t+'")':''));
        } else {
            console.log("***Strange persons:",entry,tenses,k,persons);
        }
    }
}

function expandDeclension(lexicon,lemmata,rules,entry,pos,tab){
    var rulesDecl=rules["declension"];
    var declension=null;
    if (tab in rulesDecl)
        declension=rulesDecl[tab];
    else if (tab in rules["regular"] || declension == null){
        addLemma(lemmata,entry,pos+'("'+entry+'")');
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
    // console.log("decl",decl);
    for (var l = 0; l < decl.length; l++) {
        var jsRexp=genExp(decl[l],pos,entry,lexicon[entry][pos]);
        if (jsRexp!=null){
            var word=radical+decl[l]["val"];
            addLemma(lemmata,word,jsRexp);
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
            if (pos=="basic") continue;
            if (pos=="Pc") continue; // ignore punctuation
            if (pos=="V"){ // conjugation
                expandConjugation(lexicon,lemmata,rules,entry,
                                  entryInfos["V"]["tab"]);
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
        return lemmata.get(query).join("\n")
    // try to match with a regular expression
    const re=new RegExp("^"+query+"$");
    let res=[];
    for (let key of lemmata.keys()){
        if (re.test(key))res.push(key+": "+lemmata.get(key).join("; "));
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
    var regex=new RegExp("^"+word+"$")
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

