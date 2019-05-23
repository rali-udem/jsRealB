// jsRealB lemmatizer: given a word, show all possible way to realize it in jsRealB
//    was also useful for "debugging" the lexicon entries and language rules
//    we can also that jsRealB regenerates the appropriate string

//    usage: lemmatize (fr|en|dme) true?
//    if second argument then check ambiguities

if (typeof module !== 'undefined' && module.exports) {    
    const fs = require('fs');
    const jsRealBDir="/Users/lapalme/Documents/GitHub/jsRealB/"
    const buildDir=jsRealBDir+"build/"

    var lexiconName="fr"
    if (process.argv.length>2)lexiconName=process.argv[2]
    var checkAmbiguities=false;
    if (process.argv.length>3)checkAmbiguities=true;

    var lemmataLang;
    if (lexiconName=="fr"){
        lemmataLang="fr"
    } else if (lexiconName == "en" || lexiconName == "dme"){
        lemmataLang="en"
    } else {
        console.log("unknown language:"+lexiconName)
        console.log("usage: lemmatize (en|dme|fr)? checkAmbiguities?");
        lexiconName="fr";
        lemmataLang="fr";
        console.log("defaulting to "+lexiconName);
    }

    var rules = JSON.parse(fs.readFileSync(buildDir+"rule-"+(lexiconName=='dme'?"en":lexiconName)+".json")); 
    var  lexicon=JSON.parse(fs.readFileSync(buildDir+"lexicon-"+lexiconName+".json"));

    // load jsRealB
    var jsRealB=require(jsRealBDir+"dist/jsRealB-"+lexiconName+".min.js");
    for (var v in jsRealB)
        eval("var "+v+"=jsRealB."+v);
}

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

function genExp(declension,pos,entry,lexiconEntry){
    var out = pos+'("'+entry+'")';
    // console.log("genExp",declension,pos,entry,lexiconEntry);
    switch (pos) {
    case "N":
        var g=lexiconEntry["g"];
        // gender are ignored in English
        if (lemmataLang=="en"|| declension["g"]==g || declension["g"]=="x"){
            return out+(declension["n"]=="p"?'.n("p")':"");
        }
        break;
    case "Pro":case "D":
        var defGender=lemmataLang=="fr"?"m":"n";
        var g=declension["g"];
        if (g===undefined || g=="x" || g=="n")g=defGender;
        out+='.g("'+g+'")';
        var n=declension["n"];
        if (n===undefined || n=="x")n="s";
        out+=n!="s"?'.n("'+n+'")':'';
        if ("pe" in declension){
            var pe=declension["pe"];
            out+=(pe!=3?'.pe('+pe+')':'');
        }
        if ("own" in declension){
            out+='.ow("'+declension["own"]+'")'
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
            if (lemmataLang=="en" && t=="b")
                addLemma(lemmata,"to "+radical+persons,'V("'+entry+'").t("b")')
            else
                addLemma(lemmata,radical+persons,'V("'+entry+'")'+(t!="p"?'.t("'+t+'")':''));
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
            addLemma(lemmata,entry,pos+'("'+entry+'")');
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

if (typeof module !== 'undefined' && module.exports) {    

    function showAmbiguities(lemmata){
        var inv=new Map();
        for (var [lemma,jsRexps] of lemmata){
            for (var i = 0; i < jsRexps.length; i++) {
                var jsRexp=jsRexps[i];
                var l=inv.get(jsRexp);
                if (l===undefined)inv.set(jsRexp,l=[]);
                l.push(lemma);
            }
        }
        var ambiguous=[];
        for (var [jsrExp,lemmas] of inv){
            if (lemmas.length>1){
                ambiguous.push([jsrExp,lemmas])
            }
        }
        if (ambiguous.length==0){
            console.log("no ambiguity found");
            return
        }
        console.log("%d ambiguities",ambiguous.length);
        ambiguous.sort(([key1,val1],[key2,val2])=> key1<key2?-1:(key1==key2?0:1));
        for (var i=0;i<ambiguous.length;i++){
            var amb=ambiguous[i];
            console.log(amb[0]+':'+amb[1]);
        }
    }


    var lemmata=buildLemmata(lemmataLang,lexicon,rules);
    // showLemmata(lemmata);
    let nbForms=0;
    lemmata.forEach((forms,lemma,map)=>nbForms+=forms.length); // add length of all lists
    console.log("Lexicon %s:%d entries => %d forms, %d lemma",
    lexiconName,Object.values(lexicon).length,nbForms,lemmata.size);
    if(checkAmbiguities)
        showAmbiguities(lemmata);
    
    /// command line interface for node.js
    /// adapted from  https://nodejs.org/api/readline.html#readline_example_tiny_cli
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'word or constructor > '
    });

    rl.prompt();
    rl.on('line', (line) => {
        var line=line.trim();
        if (line.length>0){
            if (line.indexOf("(")>=0){ // word contains (, so it must be a jsR constructor
                try {
                    console.log(eval(line).toString());
                } catch (e){
                    console.log("Error in realizing: "+line);
                    console.log(e.toString());
                }
            } else if (lemmata.has(line)){
                var exps=lemmata.get(line);
                for (var i = 0; i < exps.length; i++) {
                    console.log(exps[i]);
                }
            } else {
                console.log("%s not found",line)
            }
        }
      rl.prompt();
    }).on('close', () => {
        console.log("")
        process.exit(0);
    });
}