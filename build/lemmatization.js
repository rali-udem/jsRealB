// Lemmatization module
//    useful for checking that the tables generate the correct forms
//    also for creating a jsRealB expression from an inflected form
//    this is necessary for the "lenient" mode

//   show content of the lemmata table
function showLemmata(lemmata){
    console.log("-------")
    var keys=Array.from(lemmata.keys());
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        var key=keys[i]
        console.log(key,":",""+JSON.stringify(lemmata.get(key)))
    }
}

var nbForms=0;
var checkAmbiguities=false;
//  add a Lemma struct combining the information given by obj
// object = {Pos1:{"lemma":[{g="..",..}],...}],Pos}
function addLemma(lemmata,word,obj){
    if (checkAmbiguities){
        // check if jsRealB generates the same string...
        var jsRexp=obj2jsr(obj);
        // console.log("addLemma",word,JSON.stringify(obj),jsRexp);
        var genWord=eval(jsRexp);
        if (genWord!=word){
            console.log("%s => %s != %s",jsRexp,genWord,word);
        }
    }
    // add word
    var lemma=lemmata.get(word);
    if (lemma===undefined)lemmata.set(word,lemma=new Object());
    var pos=obj["pos"];
    var lemmaPos=lemma[pos];
    if (lemmaPos===undefined)lemma[pos]=lemmaPos=new Object();
    var entry=obj["entry"];
    var lPosLemma=lemmaPos[lemma];
    if (lPosLemma===undefined)lemmaPos[entry]=lPosLemma=new Array();
    var options=new Object();
    var keys=Object.keys(obj);
    keys.splice(keys.indexOf("pos"),1);
    keys.splice(keys.indexOf("entry"),1);
    for (var i = 0; i < keys.length; i++) {
        var k=keys[i];
        options[k]=obj[k];
    }
    lPosLemma.push(options);
    nbForms+=1;
}

// create a jsRealB expression from an object of the form
//   {pos:..., entry:..., opt1:.., opt2,...}
function obj2jsr(obj){
    return obj["pos"]+'("'+obj["entry"]+'")'+jsRoptions(obj);
}

function jsRoptions(obj){
    var res="";
    var allKeys=Object.keys(obj);
    var iPos=allKeys.indexOf("pos");
    if (iPos != -1)allKeys.splice(iPos,1);
    var iEntry=allKeys.indexOf("entry");
    if (iEntry != -1)allKeys.splice(iEntry,1);
    for (var i = 0; i < allKeys.length; i++) {
        var key=allKeys[i];
        res+="."+key+'("'+obj[key]+'")';
    }
    return res;
}

//  return a list of jsRealB expressions corresponding to a lemma object
function lemma2jsRexps(lemmaObj){
    var exps=[];
    var allPos=Object.keys(lemmaObj);
    for (var i = 0; i < allPos.length; i++) {
        var pos=allPos[i];
        var allEntries=Object.keys(lemmaObj[pos]);
        for (var j = 0; j < allEntries.length; j++) {
            var entry=allEntries[j];
            var exp=pos+'("'+entry+'")';
            var allOptions=lemmaObj[pos][entry];
            for (var k = 0; k < allOptions.length; k++) {
                exps.push(exp+jsRoptions(allOptions[k]));
            }
        }
    }
    return exps;
}

function genExp(declension,pos,entry,lexiconEntry){
    var out={pos:pos,entry:entry};
    switch (pos) {
    case "N":
        var g=lexiconEntry["g"];
        // gender are ignored in English
        if (lemmataLang=="en"|| declension["g"]==g || declension["g"]=="x"){
            if (declension["n"]=="p")out["n"]="p";
            return out;
        }
        break;
    case "Pro":case "D":
        var defGender=lemmataLang=="fr"?"m":"n";
        var g=declension["g"];
        if (g===undefined || g=="x" || g=="n")g=defGender;
        out["g"]=g;
        var n=declension["n"];
        if (n===undefined || n=="x")n="s";
        if (n!="s")out["n"]=n;
        if ("pe" in declension){
            var pe=declension["pe"];
            if (pe!=3)out["pe"]=pe;
        }
        if ("own" in declension){
            out["ow"]=declension["own"];
        }
        return out;
        break;
    case "A": 
        if (lemmataLang=="fr"){
            var g=declension["g"];
            if (g===undefined || g=="x")g="m";
            var n=declension["n"];
            if (n===undefined)n="s";
            if (g!="m")out["g"]=g;
            if (n!="s")out["n"]=n;
        } else { // comparatif en anglais
            var f=declension["f"];
            if (f!=undefined)out["f"]=f;
        }
        return out;
        break;
    case "Adv":
        if (lemmataLang=="fr"){
            return out;
        } else {
            var f=declension["f"];
            if (f!=undefined)out["f"]=f;
        }
        return out;
        break;
    default:
        console.log("***POS not implemented:%s",pos)
    }
    return null;
}
    
function expandConjugation(lexicon,lemmata,rules,entry,tab,conjug){
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
        var jsRexp={pos:"V",entry:entry};
        if (typeof persons =="object" && persons.length==6){
            for (var pe = 0; pe < 6; pe++) {
                if (persons[pe]==null) continue;
                var word=radical+persons[pe];
                var pe3=pe%3+1;
                var n=pe>=3?"p":"s";
                if (t!="p")jsRexp["t"]=t;
                if (pe3!=3)jsRexp["pe"]=pe3; else delete jsRexp["pe"];
                if (n!="s")jsRexp["n"]=n;
                addLemma(lemmata,word,jsRexp);
            }
        } else if (typeof persons=="string"){
            if (lemmataLang=="en" && t=="b") {
                jsRexp["t"]="b";
                addLemma(lemmata,"to "+radical+persons,jsRexp);
            } else {
                if (t!="p")jsRexp["t"]=t;
                addLemma(lemmata,radical+persons,jsRexp);
            }
        } else {
            console.log("***Strange persons:",entry,tenses,k,persons);
        }
    }
}

function expandDeclension(lexicon,lemmata,rules,entry,pos,tabs){
    // console.log(entry,"tabs",tabs)
    for (var k = 0; k < tabs.length; k++) {
        var tab=tabs[k];
        var rulesDecl=rules["declension"];
        var declension=null;
        if (tab in rulesDecl)
            declension=rulesDecl[tab];
        else if (tab in rules["regular"]){
            addLemma(lemmata,entry,{pos:pos,entry:entry});
            continue;
        }
        if (declension==null)continue;
        // console.log(declension);
        var ending=declension["ending"];
        var endRadical=entry.length-ending.length;
        var radical=entry.slice(0,endRadical);
        if (entry.slice(endRadical)!=ending){
            console.log("strange ending:",entry,":",ending);
            continue;
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
}

function buildLemmata(lang,lexicon,rules){
    lemmataLang=lang;
    var lemmata=new Map();  // use a Map instead of an object because "constructor" is an English word...
    var allEntries=Object.keys(lexicon);
    for (var i = 0; i < allEntries.length; i++) {
        var entry=allEntries[i];
        var entryInfos=lexicon[entry];
        var allPos=Object.keys(entryInfos);
        // console.log(entryInfos,allPos)
        for (var j = 0; j <  allPos.length; j++) {
            var pos=allPos[j];
            // console.log(entryInfos,j,pos);
            if (pos=="Pc") continue; // ignore punctuation
            if (pos=="V"){ // conjugation
                expandConjugation(lexicon,lemmata,rules,entry,
                                  entryInfos["V"]["tab"],rules["conjugation"]["tab"]);
            } else {       // declension
                expandDeclension(lexicon,lemmata,rules,entry,pos,entryInfos[pos]["tab"]);
            }
        }
    }
    return lemmata;
}

//  return the lemma corresponding to a form and a pos
//          undefined if not found
function form2lemma(lemmata,form,pos){
    var lemma = lemmata.get(form);
    if (lemma === undefined) return undefined;
    if (lemma[pos]===undefined) return undefined;
    return Object.keys(lemma[pos])[0];
}
