//  adapted from https://www.geeksforgeeks.org/how-to-share-code-between-node-js-and-the-browser/

// All the code in this module is 
// enclosed in closure 
(function(exports) { 
/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

// global variables 
var exceptionOnWarning=false;  // throw an exception on Warning instead of only writing on the console
var reorderVPcomplements=false; // reorder VP complements by increasing length (experimental flag)
var defaultProps = {en:{g:"n",n:"s",pe:3,t:"p"},             // language dependent default properties
                    fr:{g:"m",n:"s",pe:3,t:"p",aux:"av"}}; 
var currentLanguage;

///////////////  Constructor for a Constituent (superclass of Phrase and Terminal)
function Constituent(constType){
    this.parentConst=null;
    this.constType=constType;    
    this.props={};
    this.realization=null;
    this.optSource=""   // string corresponding to the calls to the options
}

// error message for internal error that should never happen !!!
Constituent.prototype.error = function(mess){
    throw "Internal error: this should never have happened, sorry!\n"+this.me()+":: "+mess;
}

////////// access functions

Constituent.prototype.isA = function(type){
    return this.constType==type
}

Constituent.prototype.isOneOf = function(types){
    return types.indexOf(this.constType)>=0;
}

Constituent.prototype.isFr = function(){return this.lang=="fr"}
Constituent.prototype.isEn = function(){return this.lang=="en"}

Constituent.prototype.getRules   = function(){return this.isFr()?ruleFr:ruleEn}
Constituent.prototype.getLexicon = function(){return getLexicon(this.lang)}

// get/set the value of a property by first checking the special shared properties
Constituent.prototype.getProp = function(propName){
    if (propName=="pe" || propName=="n" || propName=="g"){
        return this.peng===undefined ? undefined : this.peng[propName];
    }
    if (propName=="t" || propName=="aux"){
        return this.taux===undefined ? undefined : this.taux[propName];
    }
    return this.props[propName];
}

Constituent.prototype.setProp = function(propName,val){
    if (propName=="pe" || propName=="n" || propName=="g"){
        if (this.peng!==undefined) this.peng[propName]=val;
    } else if (propName=="t" || propName=="aux"){
        if (this.taux!==undefined) this.taux[propName]=val;
    } else 
        this.props[propName]=val;    
}

// should be in Terminal.prototype... but here for consistency with three previous definitions
// var pengNO=0; // useful for debugging: identifier of peng struct to check proper sharing in the debugger
// var tauxNO=0; // useful for debugging: identifier of taux struct to check proper sharing in the debugger
Constituent.prototype.initProps = function(){
    if (this.isOneOf(["N","A","D","V","NO","Pro"])){
        // "tien" and "vôtre" are very special case of pronouns which are to the second person
        this.peng={pe:contains(["tien","vôtre"],this.lemma)?2:defaultProps[this.lang]["pe"],
                   n: defaultProps[this.lang]["n"],
                   g: defaultProps[this.lang]["g"],
                   // pengNO:pengNO++
                   };
        if (this.isA("V")){
            this.taux={t:defaultProps[this.lang]["t"],
                       // tauxNO:tauxNO++
                       };
            if (this.isFr())
                this.taux["aux"]=defaultProps[this.lang]["aux"];
        }
    }
}

// get a given constituent with a path starting at this
//   path is a list of node type , or list of node types (an empty string in this list means optional)
//   returns undefined if any node does not exist on the path
Constituent.prototype.getFromPath = function(path){
    if (path.length==0) return this;
    const current=path.shift();
    const c=this.getConst(current);
    if (c===undefined){
        if (typeof current == "object" && current.indexOf("")>=0 && path.length>0){// optional
            return this.getFromPath(path);
        }
        return undefined;
    }
    return c.getFromPath(path);
}

// return a pronoun corresponding to this object 
// taking into account the current gender, number and person
//  do not change the current pronoun, if it is already using the tonic form
// if case_ is not given, return the tonic form else return the corresponding case
// HACK:: parameter case_ is followed by _ so that it is not displayed as a keyword in the editor
Constituent.prototype.getTonicPro = function(case_){
    if (this.isA("Pro") && (this.props["tn"] || this.props["c"])){
        if (case_!==undefined){
            this.props["c"]=case_
        } else { // ensure tonic form
            this.props["tn"]="";
            if ("c" in this.props)delete this.props["c"];
        }
        return this;
    } else { // generate the string corresponding to the tonic form
        let pro=Pro(this.isFr()?"moi":"me");
        const g = this.getProp("g");
        if (g!==undefined)pro.g(g);
        const n = this.getProp("n");
        if (n!==undefined)pro.n(n);
        const pe = this.getProp("pe");
        if (pe!==undefined)pro.pe(pe);
        if (case_===undefined) return Pro(pro.toString()).tn("");
        return Pro(pro.toString()).c(case_) 
    }
}

Constituent.prototype.getParentLang = function(){
    if (this.lang !== undefined) return this.lang;
    if (this.parentConst === null) return currentLanguage;
    return this.parentConst.getParentLang();
}

Constituent.prototype.addOptSource = function(optionName,val){
    this.optSource+="."+optionName+"("+(val===undefined? "" :JSON.stringify(val))+")"
}

// Creation of "standard" options 
function genOptionFunc(option,validVals,allowedConsts,optionName){
    Constituent.prototype[option]=function(val,prog){
        if (val===undefined){
            if (validVals !== undefined && validVals.indexOf("")<0){
                return this.warn("no value for option",option,validVals);
            }
            val=null;
        }
        if (this.isA("CP")){// propagate an option through the children of a CP
            if(prog==undefined)this.addOptSource(optionName,val)
            for (let i = 0; i < this.elements.length; i++) {
                const e=this.elements[i];
                if (allowedConsts.length==0 || e.isOneOf(allowedConsts)){
                    e[option](val)
                }
            }
            return this;
        }
        if (allowedConsts.length==0 || this.isOneOf(allowedConsts)) {
            if (validVals !== undefined && validVals.indexOf(val)<0){
                return this.warn("ignored value for option",option,val);
            }
            // start of the real work...
            if (optionName===undefined)optionName=option; 
            this.setProp(optionName,val);
            if (prog==undefined) this.addOptSource(option,val==null?undefined:val)
            return this;
        } else {
            return this.warn("bad const for option",option,this.constType,allowedConsts)
        }
    }
}

// shared properties 
//   pe,n and g : can be applied to compoennts of NP and Sentences
genOptionFunc("pe",[1,2,3,'1','2','3'],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("n",["s","p"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("g",["m","f","n","x"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
//  t, aux : can be applied to VP and sentence
genOptionFunc("t",["p", "i", "f", "ps", "c", "s", "si", "ip", "pr", "pp", "b", // simple tenses
                   "pc", "pq", "cp", "fa", "spa", "spq"],["V","VP","S","SP","CP"]);  // composed tenses
genOptionFunc("aux",["av","êt","aê"],["V","VP","S","SP","CP"]);
// ordinary properties
genOptionFunc("f",["co","su"],["A","Adv"]);
genOptionFunc("tn",["","refl"],["Pro"]);
genOptionFunc("c",["nom","acc","dat","refl","gen"],["Pro"]);

genOptionFunc("pos",["post","pre"],["A"]);
genOptionFunc("pro",undefined,["NP","PP"]);
// English only
genOptionFunc("ow",["s","p","x"],["D","Pro"],"own");

/// Formatting options
genOptionFunc("cap",undefined,[]);
genOptionFunc("lier",undefined,[]);

// creation of option lists
function genOptionListFunc(option){
    Constituent.prototype[option]=function(val,prog){
        if (this.props[option] === undefined)this.props[option]=[];
        this.props[option].push(val);
        if(prog==undefined)this.addOptSource(option,val)
        return this;
    }
}
// strings to add 
genOptionListFunc("b");  // before
genOptionListFunc("a");  // after
genOptionListFunc("ba"); // before-after
genOptionListFunc("en"); // "entourer": old name for before-after 

///////// specific options

// HTML tags
Constituent.prototype.tag = function(name,attrs){
    if (attrs === undefined || Object.keys(attrs).length==0){
        this.addOptSource("tag",name)
        attrs={};
    } else {
        this.optSource+=".tag('"+name+"',"+JSON.stringify(attrs)+")" // special case of addOptSource...
    }
    if (this.props["tag"] === undefined)this.props["tag"]=[];
    this.props["tag"].push([name,attrs]);
    return this;
}

// date and number options
Constituent.prototype.dOpt = function(dOptions){
    this.addOptSource("dOpt",dOptions)
    if (typeof dOptions != "object"){
        return this.warn("bad application",".dOpt","object",typeof dOptions)
    }
    if (this.isA("DT")){
        const allowedKeys =["year" , "month" , "date" , "day" , "hour" , "minute" , "second" , "nat", "det", "rtime"];
        const keys=Object.keys(dOptions);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (allowedKeys.indexOf(key)>=0){
                const val = dOptions[key];
                if (typeof val == "boolean"){
                        this.props["dOpt"][key]=val
                } else {
                    return this.warn("bad application",".dOpt("+key+")","boolean",val);
                }
            } else {
                return this.warn("ignored value for option","DT.dOpt",key)
            }
        }
    } else if (this.isA("NO")){
        const allowedKeys = ["mprecision","raw","nat","ord"];
        const keys=Object.keys(dOptions);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (allowedKeys.indexOf(key)>=0){
                const val = dOptions[key]
                if (key=="mprecision"){
                    if (typeof val == "number"){
                        this.props["dOpt"]["mprecision"]=val
                    } else {
                        return this.warn("bad application","precision","number",val)
                    }
                } else if (typeof val =="boolean"){
                    this.props["dOpt"][key]=val
                } else {
                    return this.warn("bad application",".dOpt("+key+")","boolean",val)
                }
            } else {
                return this.warn("ignored value for option","NO.dOpt",key);
            }
        }
    } else {
        return this.warn("bad application",".dOpt",["DT","NO"],this.constType)
    }
    return this;
}

// number option
Constituent.prototype.nat= function(isNat){
    this.addOptSource("nat",isNat);
    if (this.isOneOf(["DT","NO"])){
        const options=this.props["dOpt"];
        if (isNat === undefined){
            options.nat=false;
        } else if (typeof isNat == "boolean"){
            options.nat=isNat;
        } else {
            return this.warn("bad application",".nat","boolean",isNat)
        }
    } else {
        return this.warn("bad application",".nat",["DT","NO"],this.constType)
    }
    return this;
}

Constituent.prototype.typ = function(types){
    const allowedTypes={
      "neg": [false,true],
      "pas": [false,true],
      "prog":[false,true],
      "exc": [false,true],
      "perf":[false,true],
      "contr":[false,true],
      "mod": [false,"poss","perm","nece","obli","will"],
      "int": [false,"yon","wos","wod","wad","woi","whe","why","whn","how","muc"]
    }
    this.addOptSource("typ",types)
    if (this.isOneOf(["S","SP","VP"])){
        // validate types and keep only ones that are valid
        for (let key in types) {
            const val=types[key];
            const allowedVals=allowedTypes[key];
            if (allowedVals === undefined){
                this.warn("unknown type",key,Object.keys(allowedTypes))
            } else {
                if (key == "neg" && this.isFr()){ // also accept string as neg value in French
                    if (!contains(["string","boolean"],typeof val)){
                        this.warn("ignored value for option",".typ("+key+")",val)
                        delete types[key]
                    }
                } else if (!contains(allowedVals,val)){
                    this.warn("ignored value for option",".typ("+key+")",val)
                    delete types[key]
                }
            }
        }
        this.props["typ"]=types;
    } else {
        this.warn("bad application",".typ("+JSON.stringify(types)+")",["S","SP","VP"],this.constType);
    }
    return this;
}

// regex for matching the first word in a generated string (ouch!!! it is quite subtle...) 
//  match index:
//     1-possible non-word chars and optional html tags
//     2-the real word 
//     3-the rest after the word  
const sepWordREen=/((?:[^<\w'-]*(?:<[^>]+>)?)*)([\w'-]+)?(.*)/

Constituent.prototype.doElisionEn = function(cList){
    //// English elision rule only for changing "a" to "an"
    // according to https://owl.english.purdue.edu/owl/resource/591/1/
    const hAnRE=/^(heir|herb|honest|honou?r(able)?|hour)/i;
    //https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
    const uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
    const acronymRE=/^[A-Z]+$/
    const punctuationRE=/^\s*[,:\.\[\]\(\)\?]+\s*$/
    // Common Contractions in the English Language taken from :http://www.everythingenglishblog.com/?p=552
    const contractionEnTable={
        "are+not":"aren’t", "can+not":"can’t", "did+not":"didn’t", "do+not":"don’t", "does+not":"doesn’t", 
        "had+not":"hadn’t", "has+not":"hasn’t", "have+not":"haven’t", "is+not":"isn’t", "must+not":"mustn’t", 
        "need+not":"needn’t", "should+not":"shouldn’t", "was+not":"wasn’t", "were+not":"weren’t", 
        "will+not":"won’t", "would+not":"wouldn’t",
        "let+us":"let’s",
        "I+am":"I’m", "I+will":"I’ll", "I+have":"I’ve", "I+had":"I’d", "I+would":"I’d",
        "she+will":"she’ll", "he+is":"he’s", "he+has":"he’s", "she+had":"she’d", "she+would":"she’d",
        "he+will":"he’ll", "he+is":"she’s", "she+has":"she’s", "he+would":"he’d", "he+had":"he’d",
        "you+are":"you’re", "you+will":"you’ll", "you+would":"you’d", "you+had":"you’d", "you+have":"you’ve",
        "we+are":"we’re", "we+will":"we’ll", "we+had":"we’d", "we+would":"we’d", "we+have":"we’ve",
        "they+will":"they’ll", "they+are":"they’re", "they+had":"they’d", "they+would":"they’d", "they+have":"they’ve",
        "it+is":"it’s", "it+will":"it’ll", "it+had":"it’d", "it+would":"it’d",
        "there+will":"there’ll", "there+is":"there’s", "there+has":"there’s", "there+have":"there’ve",
        "that+is":"that’s", "that+had":"that’d", "that+would":"that’d", "that+will":"that’ll"
    } 
    // search for terminal "a" and check if it should be "an" depending on the next word
    var last=cList.length-1;
    for (var i = 0; i < last; i++) {
        var m1=sepWordREfr.exec(cList[i].realization)
        if (m1 === undefined) continue;
        var m2=sepWordREfr.exec(cList[i+1].realization)
        if (m2 === undefined) continue;
        // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
        // for a single word 
        var w1=m1[2];
        var w2=m2[2];
        if (w1=="a" && cList[i].isA("D")){
            if (/^[aeio]/i.exec(w2) ||   // starts with a vowel
                (/^u/i.exec(w2) && !uLikeYouRE.exec(w2)) || // u does not sound like you
                hAnRE.exec(w2) ||       // silent h
                acronymRE.exec(w2)) {   // is an acronym
                    cList[i].realization=m1[1]+"an"+m1[3];
                    i++;                     // skip next word
                }
        } else if (this.contraction !== undefined && this.contraction === true) {
            if (w1=="cannot"){ // special case...
                cList[i].realization=m1[1]+"can't"+m1[3];
            } else {
                const contr=contractionEnTable[w1+"+"+w2];   
                if (contr!=null) {
                    // do contraction of first word and remove second word (keeping start and end)
                    cList[i].realization=m1[1]+contr+m1[3];
                    cList[i+1].realization=m2[1]+m2[3].trim();
                    i++;
                }
            }
        }
    }
}

// same as sepWordREen but the [\w] class is extended with French accented letters and cedilla
const sepWordREfr=/((?:[^<\wàâéèêëîïôöùüç'-]*(?:<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?(.*)/i

Constituent.prototype.doElisionFr = function(cList){
    //// Elision rules for French
    // implements the obligatory elision rules of the "Office de la langue française du Québec"
    //    http://bdl.oqlf.gouv.qc.ca/bdl/gabarit_bdl.asp?Th=2&t1=&id=1737
    // for Euphonie, rules were taken from Antidote (Guide/Phonétique)

    const elidableWordFrRE=/^(la|le|je|me|te|se|de|ne|que|puisque|lorsque|jusque|quoique)$/i
    const euphonieFrRE=/^(ma|ta|sa|ce|beau|fou|mou|nouveau|vieux)$/i
    const euphonieFrTable={"ma":"mon","ta":"ton","sa":"son","ce":"cet",
        "beau":"bel","fou":"fol","mou":"mol","nouveau":"nouvel","vieux":"vieil"};

    const contractionFrTable={
        "à+le":"au","à+les":"aux","ça+a":"ç'a",
        "de+le":"du","de+les":"des","de+des":"de","de+autres":"d'autres",
        "des+autres":"d'autres",
        "si+il":"s'il","si+ils":"s'ils"};


    function isElidableFr(realization,lemma,pos){
        // check if realization starts with a vowel
        if (/^[aeiouyàâéèêëîïôöùü]/i.exec(realization)) return true;
        if (/^h/i.exec(realization)){
            //  check for a French "h aspiré" for which no elision should be done
            var lexiconInfo=getLemma(lemma);                    // get the lemma with the right pos
            if (typeof lexiconInfo == "undefined") return true; // elide when unknown
            if (pos in lexiconInfo && lexiconInfo[pos].h==1) return false; // h aspiré found
            return true;
        }
        return false;
    }
    
    var contr;
    var last=cList.length-1;
    for (var i = 0; i < last; i++) {
        var m1=sepWordREfr.exec(cList[i].realization)
        if (m1 === undefined) continue;
        var m2=sepWordREfr.exec(cList[i+1].realization)
        if (m2 === undefined) continue;
        // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
        // for a single word 
        var w1=m1[2];
        var w2=m2[2];
        var w3NoWords = ! /^\s*\w/.test(m1[3]); // check that the rest of the first word does not start with a word
        if (elidableWordFrRE.exec(w1) && isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType) && w3NoWords){
            cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
            i++;
        } else if (euphonieFrRE.exec(w1) && isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType)&& w3NoWords){ // euphonie
            if (/ce/i.exec(w1) && /(^est$)|(^étai)/.exec(w2)){
                // very special case but very frequent
                cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
            } else {
                cList[i].realization=m1[1]+euphonieFrTable[w1]+m1[3];
            }
            i++;
        } else if ((contr=contractionFrTable[w1+"+"+w2])!=null && w3NoWords){
            // check if the next word would be elidable, so instead elide it instead of contracting
            // except when the next word is a date which has a "strange" realization
            if (elidableWordFrRE.exec(w2) && i+2<=last && !cList[i+1].isA("DT") &&
               isElidableFr(cList[i+2].realization,cList[i+2].lemma,cList[i+2].constType)){
                cList[i+1].realization=m2[1]+w2.slice(0,-1)+"'"+m2[3]
            } else { // do contraction of first word and remove second word (keeping start and end)
                cList[i].realization=m1[1]+contr+m1[3];
                cList[i+1].realization=m2[1]+m2[3].trim();
            }
            i++;
        }
    }
}

// applies to a list of Constituents (can be a single one)
// adds either to the first or last token (which can be the same)
Constituent.prototype.doFormat = function(cList){
    const punctuation=this.getRules()["punctuation"];
    const lexicon=this.getLexicon()   
    
    function getPunctString(punct){
        const punc=lexicon[punct];
        if (punc !== undefined && punc["Pc"] !== undefined){
            const tab=punc["Pc"]["tab"][0];
            const puncRule=punctuation[tab];
            return puncRule["b"]+punct+puncRule["a"]
        }
        return punct // default return string as is
    }
    
    function getBeforeAfterString(punct){
        const punc=lexicon[punct];
        if (punc !== undefined && punc["Pc"] !== undefined){
            const compl=punc["Pc"]["compl"];
            if (compl !== undefined){
                const before=punct;
                const after=compl;
                const tab=punc["Pc"]["tab"]
                const tabBefore=tab[0];
                const tabAfter=tab.length==2?tab[1]:
                               lexicon[compl]["Pc"]["tab"][0]; //get from table of compl 
                const puncRuleBefore=punctuation[tabBefore];
                const puncRuleAfter=punctuation[tabAfter];
                return {"b":puncRuleBefore["b"]+before+puncRuleBefore["a"],
                        "a":puncRuleAfter["b"]+after+puncRuleAfter["a"]}
            }
        }
        return {"b":punct,"a":punct}
    }
    
    // add before the first element of cList and after the last element of cList
    function wrapWith(before,after){
        cList[0].realization=before+cList[0].realization;
        cList[cList.length-1].realization+=after;
    }
    function startTag(tagName,attrs){
        const attString=Object.entries(attrs).map(
            function(entry){return " "+entry[0]+'="'+entry[1]+'"'}).join("")
        return "<"+tagName+attString+">";
    }
    
    // remove possible empty realisation strings (often generated by D("a").n("p")) which can break elision
    // but ensure there is at least one left so that options (.en, .a, .b) can be added.
    function removeEmpty(cList){
        for (let i=0;i<cList.length;){
            if (cList[i].realization=="" && cList.length>1)cList.splice(i,1)
            else i++
        }
    }
    
    // start of processing
    removeEmpty(cList);
    if (this.isFr())
        this.doElisionFr(cList);
    else 
        this.doElisionEn(cList);
    
    const cap = this.props["cap"];
    if (cap !== undefined && cap !== false){
        const r=cList[0].realization;
        if (r.length>0){
            cList[0].realization=r.charAt(0).toUpperCase()+r.substring(1);
        }
    }
    const as = this.props["a"];
    if (as !== undefined){
        as.forEach(function(a){wrapWith("",getPunctString(a))})
    }
    const bs = this.props["b"];
    if (bs !== undefined){
        bs.forEach(function(b){wrapWith(getPunctString(b),"")})
    }
    const ens = this.props["en"] || this.props["ba"];
    if (ens !== undefined){
        ens.forEach(function(en){
            const ba=getBeforeAfterString(en);
            wrapWith(ba["b"],ba["a"])
        })
    }
    const tags=this.props["tag"];
    if (tags !== undefined) {
        tags.forEach(function(tag){
            const attName=tag[0];
            const attVal=tag[1];
            wrapWith(startTag(attName,attVal),"</"+attName+">");
        })
    }
    return cList;
}

//  merge all tokens (i.e. Terminal with their realization field) into a single string, 
//  if at "top level", apply elision and default sentence formatting
Constituent.prototype.detokenize = function(terminals){
    let s=""; // final realized string
    const last=terminals.length-1;
    if (last<0) return s;
    for (let i = 0; i < last; i++) {
        const terminal=terminals[i];
        if (terminal.props["lier"]!== undefined){
            s+=terminal.realization+"-";
        } else if (/[- ']$/.exec(terminal.realization)){
            s+=terminal.realization;
        } else if (terminal.realization.length>0) {
            s+=terminal.realization+" ";
        }
    }
    s+=terminals[last].realization;
    // apply capitalization and final full stop
    if (this.parentConst==null){
        if (this.isA("S") && s.length>0){ // if it is a top-level S
            // force a capital at the start unless .cap(false)
            if (this.props["cap"]!== false){
                const sepWordRE=this.isEn()?sepWordREen:sepWordREfr;
                const m=sepWordRE.exec(s);
                const idx=m[1].length; // get index of first letter
                s=s.substring(0,idx)+s.charAt(idx).toUpperCase()+s.substring(idx+1);
            };
            if (this.props["tag"]===undefined){ // do not touch top-level tag
                // and a full stop at the end unless there is already one
                // taking into account any trailing HTML tag
                const m=/(.)( |(<[^>]+>))*$/.exec(s);
                if (m!=null && !contains("?!.:;/",m[1])){
                    s+="."
                }
            }
        }
    }
    return s;
}

//// ******* this seemingly simple function is in fact the start
//           of the whole realization process
// produce a string from a list of realization fields in the list of terminal
//   created by .real(), applies elision if it is the top element
Constituent.prototype.toString = function() {
    // sets the realization field in each Terminal
    const terminals=this.real(); 
    return this.detokenize(terminals);
}

Constituent.prototype.clone = function(){
    return eval(this.toSource());
}

Constituent.prototype.toSource=function(){
    return this.optSource;
}
/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

////// Constructor for a Phrase (a subclass of Constituent)

// phrase (non-terminal)
function Phrase(elements,constType,lang){
    Constituent.call(this,constType); // super constructor
    this.lang = lang || currentLanguage;
    this.elements=[];
    // list of elements to create the source of the parameters at the time of the call
    // this can be different from the elements lists because of structure modifications
    this.elementsSource=[]
    if (elements.length>0){
        const last=elements.length-1;
        // add all elements except the last to the list of elements
        for (let i = 0; i < last; i++) {
            let e=elements[i];
            if (typeof e=="string"){
                e=Q(e);
            }
            if (e instanceof Constituent) {
                e.parentConst=this;
                this.elements.push(e);
                this.elementsSource.push(e);
            } else {
                this.warn("bad Constituent",NO(i+1).dOpt({ord:true})+"",typeof e+":"+JSON.stringify(e))
            }
        }
        // terminate the list with add which does other checks on the final list
        this.add(elements[last],undefined,true)
    }
}
extend(Constituent,Phrase)

// add a new constituent, set agreement links
Phrase.prototype.add = function(constituent,position,prog){
    // create constituent
    if (typeof constituent=="string"){
        constituent=Q(constituent);
    }
    if (!(constituent instanceof Constituent)){
        return this.warn("bad Constituent",this.isFr()?"dernier":"last",typeof constituent+":"+JSON.stringify(constituent))
    }
    if (prog===undefined){// real call to .add 
        this.optSource+=".add("+constituent.toSource()+(position===undefined?"":(","+position) )+")"
    } else {
        this.elementsSource.push(constituent) // call from the constructor        
    }
    constituent.parentConst=this;
    // add it to the list of elements
    if (position == undefined){
        this.elements.push(constituent);
    } else if (typeof position == "number" && position<this.elements.length || position>=0){
        this.elements.splice(position,0,constituent)
    } else {
        this.warn("bad position",position,this.elements.length)
    }
    // change position of some children
    this.linkProperties	();
    for (let i = 0; i < this.elements.length; i++) {
        const e=this.elements[i];
        if (e.isA("A")){// check for adjective position
            const idx=this.getIndex("N");
            const pos=this.isFr()?(e.props["pos"]||"post"):"pre"; // all English adjective are pre
            if (idx >= 0){
                if ((pos=="pre" && i>idx)||(pos=="post" && i<idx)){
                    const adj=this.elements.splice(i,1)[0];
                    this.elements.splice(idx,0,adj);
                }
            }
        }
    }
    return this;
}
    
Phrase.prototype.grammaticalNumber = function(){
    return this.error("grammaticalNumber must be called on a NO, not a "+this.constType);
}

Phrase.prototype.getHeadIndex = function(phName){
    let termName=phName.substr(0,phName.length-1); // remove P at the end of the phrase name
    let headIndex=this.getIndex([phName,termName]);
    if (headIndex<0){
        this.warn("not found",termName,phName);
        headIndex=0;
    }
    return headIndex;
}

// French copula verbs
const copulesFR=["être","paraître","sembler","devenir","rester"];

//  loop over children to set the peng and taux to their head or subject
//  so that once a value is changed this change will be propagated correctly...
Phrase.prototype.linkProperties	 = function(){
    let headIndex;
    if (this.elements.length==0)return this;
    switch (this.constType) {
    case "NP": // the head is the first internal N, number with a possible NO
        // find first NP or N
        headIndex=this.getHeadIndex("NP");
        this.peng=this.elements[headIndex].peng;
        for (let i = 0; i < this.elements.length; i++) {
            if (i!=headIndex){
                const e=this.elements[i]
                if (e.isA("NO") && i<headIndex){ // NO must appear before the N for agreement
                    this.peng["n"]=e.grammaticalNumber()
                    // gender agreement between a French number and subject
                    e.peng["g"]=this.peng["g"]; 
                } else if (e.isOneOf(["D","A"])){
                    // try to keep modifications done to modifiers...
                    if (e.peng['pe']!=defaultProps[this.lang]["pe"])this.peng["pe"]=e.peng["pe"];
                    if (e.peng['g']!=defaultProps[this.lang]["g"])this.peng["g"]=e.peng["g"];
                    if (e.peng['n']!=defaultProps[this.lang]["n"])this.peng["g"]=e.peng["n"];
                    e.peng=this.peng;
                }
            }
        }
        //   set agreement between the subject of a subordinate or the object of a subordinate
        const pro=this.getFromPath(["SP","Pro"]);
        if (pro!==undefined){
            const v=pro.parentConst.getFromPath(["VP","V"]);
            if (v !=undefined){
                if (contains(["qui","who"],pro.lemma)){// agrees with this NP
                    v.peng=this.peng
                } else if (this.isFr() && pro.lemma=="que"){
                    // in French past participle can agree with a cod appearing before... keep that info in case
                        v.cod=this
                    }
            }
        }
        break;
    case "VP": 
        headIndex=this.getHeadIndex("VP");// head is the first internal V
        this.peng=this.elements[headIndex].peng;
        this.taux=this.elements[headIndex].taux;
        break;
    case "AdvP": case "PP": case "AP":
        headIndex=this.getHeadIndex(this.constType);
        this.peng=this.elements[headIndex].peng;
        break;
    case "CP":
        // nothing to do, 
        // but make sure that the propagated properties exist
        this.peng={
            // pengNO:pengNO++
        };
        // the information will be computed at realization time (see Phrase.prototype.cpReal)
        break;
    case "S": case "SP":
        var iSubj=this.getIndex(["NP","N","CP","Pro"]);
        // determine subject
        if (iSubj>=0){
            let subject=this.elements[iSubj];
            if (this.isA("SP") && subject.isA("Pro")){
                if (contains(["que","où","that"],subject.lemma)){
                    // HACK: the first pronoun  should not be a subject...
                    //        so we try to find another...
                    const jSubj=this.elements.slice(iSubj+1).findIndex(
                        e => e.isOneOf(["NP","N","CP","Pro"])
                    );
                    if (jSubj>=0){
                        subject=this.elements[iSubj+1+jSubj];
                    } else {
                        // finally this generates too many spurious messages
                        // this.warning("no possible subject found");
                        return this;
                    }
                }
            }
            this.peng=subject.peng;
            const vpv=this.linkPengWithSubject("VP","V",subject)
            if (vpv !== undefined){
                this.taux=vpv.taux;
                if (this.isFr() && contains(copulesFR,vpv.lemma)){// check for a French attribute of copula verb
                    // with an adjective
                    const attribute = vpv.parentConst.linkPengWithSubject("AP","A",subject);
                    if (attribute===undefined){
                        var elems=vpv.parentConst.elements;
                        var vpvIdx=elems.findIndex(e => e==vpv);
                        if (vpvIdx<0){
                            this.error("linkProperties	: verb not found, but this should never have happened")
                        } else {
                            for (var i=vpvIdx+1;i<elems.length;i++){
                                var pp=elems[i];
                                if (pp.isA("V") && pp.getProp("t")=="pp"){
                                    pp.peng=subject.peng;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                // check for a coordination of verbs that share the subject
                const cvs=this.getFromPath(["CP","VP"]);
                if (cvs !==undefined){
                    this.getConst("CP").elements.forEach(function(e){
                        if (e instanceof Phrase) // skip possible C
                            e.linkPengWithSubject("VP","V",subject)
                    })
                }
                if (this.isFr()){ 
                    //  in French, check for a coordinated object of a verb in a SP used as cod 
                    //  occurring before the verb
                    const cp=this.getConst("CP");
                    const sp=this.getConst("SP");
                    if (cp !==undefined && sp !== undefined){
                        var sppro=sp.getConst("Pro");
                        if (sppro !== undefined && sppro.lemma=="que"){
                            var v=sp.getFromPath([["VP",""],"V"]);
                            if (v!==undefined){
                                v.cod=cp;
                            }
                        }
                    }
                }
            }
        } else {
            // finally this generates too many spurious messages
            // this.warning("no possible subject found")
        }
        break;
    default:
        this.error("linkProperties	,unimplemented type:"+this.constType)
    }
    return this;
}

Phrase.prototype.linkPengWithSubject = function(phrase,terminal,subject){
    let pt=this.getFromPath([phrase,terminal]);
    if (pt !== undefined){
        pt.parentConst.peng = pt.peng = subject.peng;
    } else {
        pt=this.getFromPath([terminal]);
        if (pt !== undefined){
            pt.peng = subject.peng;
        }
    }
    return pt;
}
//////// tools

//  returns an identification string, useful for error messages
Phrase.prototype.me = function(){
    const children=this.elements.map(function(e){return e.me()});
    return this.constType+"("+children.join()+")";
}

Phrase.prototype.setLemma = function(lemma,terminalType){
    this.error("***: should never happen: setLemma: called on a Phrase");
    return this;
}

// find the index of a Constituent type (or one of the constituents) in the list of elements
Phrase.prototype.getIndex = function(constTypes){
    if (typeof constTypes == "string")constTypes=[constTypes];
    return this.elements.findIndex(e => e.isOneOf(constTypes),this);
}

// find a given constituent type (or one of the constituent) in the list of elements
Phrase.prototype.getConst = function(constTypes){
    const idx=this.getIndex(constTypes);
    if (idx < 0) return undefined;
    return this.elements[idx]
}

//////////// information propagation

// find the gender and number of NP elements of this Phrase
//   set masculine if at least one NP is masculine
//   set plural if one is plural or more than one combined with and
//  TODO: take into account pronoun combination in French which can change the number
Phrase.prototype.findGenderNumber = function(andCombination){
    let g="f";
    let n="s";
    let nb=0;
    for (let i = 0; i < this.elements.length; i++) {
        const e=this.elements[i];
        if (e.isOneOf(["NP","N"])){
            nb+=1
            if (e.getProp("g")=="m")g="m";
            if (e.getProp("n")=="p")n="p"
        }
    }
    if (nb==0) g="m";
    else if (nb>1 && n=="s" && andCombination)n="p";  
    return {"g":g,"n":n}
}

////////////// Phrase structure modification

// Phrase structure modification but that must be called in the context of the parentConst
// because the pronoun depends on the role of the NP in the sentence 
//         and its position can also change relatively to the verb
Phrase.prototype.pronominalize_fr = function(){
    let pro;
    const npParent=this.parentConst;
    if (npParent!==null){
        let idxV=-1;
        let myself=this;
        let idx=npParent.elements.findIndex(e => e==myself,this);
        let moveBeforeVerb=false;
        idxV=npParent.getIndex("V");
        let np=this;
        if (this.isA("NP")){
            if (this.peng==npParent.peng){ // is subject 
                pro=this.getTonicPro("nom");
            } else if (npParent.isA("SP") && npParent.elements[0].isA("Pro")){ // is relative
                pro=this.getTonicPro("nom");
            } else {
                pro=this.getTonicPro("acc") // is direct complement;
                moveBeforeVerb=true;
            }               
        } else if (this.isA("PP")){ // is indirect complement
            np=this.getFromPath([["NP","Pro"]]); // either a NP or Pro within the PP
            const prep=this.getFromPath(["P"]);
            if (prep !== undefined && np !== undefined){
                if (prep.lemma == "à"){
                    pro=np.getTonicPro("dat");
                    moveBeforeVerb=true;
                } else if (prep.lemma == "de") {
                    pro=Pro("en")
                    moveBeforeVerb=true;
                } else if (contains(["sur","vers","dans"],prep.lemma)){
                    pro=Pro("y")
                    moveBeforeVerb=true;
                } else { // change only the NP within the PP
                    let pro=np.getTonicPro();
                    pro.props=np.props;
                    pro.peng=np.peng;
                    np.elements=[pro];
                    return 
                }
            }
        }
        if (pro === undefined){
            return npParent.warn("no appropriate pronoun");
        }
        pro.peng=np.peng;
        Object.assign(pro.props,np.props);
        delete pro.props["pro"]; // this property should not be copied into the Pro
        if (moveBeforeVerb && 
            // in French a pronominalized NP as direct object is moved before the verb
            idxV>=0 && npParent.elements[idxV].getProp("t")!="ip"){ // (except at imperative tense) 
            npParent.elements.splice(idx ,1);   // remove NP
            if (this.isA("NP")) // indicate that this is a COD
                npParent.elements[idxV].cod=this;
            npParent.elements.splice(idxV,0,pro);// insert pronoun before the V
        } else {
            npParent.elements.splice(idx,1,pro);// insert pronoun where the NP was
        }
        pro.parentConst=npParent;
    } else {// special case without parentConst so we leave the NP and change its elements
        pro=this.getTonicPro();
        pro.props=this.props;
        pro.peng=this.peng;
        this.elements=[pro];
    }
    return pro;
}

// Pronominalization in English only applies to a NP (this is checked before the call)
//  and does not need reorganisation of the sentence 
//  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
Phrase.prototype.pronominalize_en = function(){
    let pro;
    const npParent=this.parentConst;
    if (npParent!==null){
        let idxV=-1;
        let myself=this;
        let idx=npParent.elements.findIndex(e => e==myself,this);
        let moveBeforeVerb=false;
        idxV=npParent.getIndex("V");
        if (this.peng==npParent.peng){ // is subject 
            pro=this.getTonicPro("nom");
        } else if (npParent.isA("SP") && npParent.elements[0].isA("Pro")){ // is relative
            pro=this.getTonicPro("nom");
        } else {
            pro=this.getTonicPro("acc") // is direct complement;
        }               
        pro.peng=this.peng;
        Object.assign(pro.props,this.props);
        if (this.peng==npParent.peng){
            npParent.peng=pro.peng
        }
        npParent.elements.splice(idx,1,pro);// insert pronoun where the NP was
        pro.parentConst=npParent;
    } else {// special case without parentConst so we leave the NP and change its elements
        pro=this.getNomPro();
        pro.props=this.props;
        pro.peng=this.peng;
        this.elements=[pro];
    }
    return pro;
}

Phrase.prototype.pronominalize = function(e){
    if (e.props["pro"]!==undefined){
        if (e.isFr()){
            return e.pronominalize_fr()
        } else { // in English pronominalize only applies to a NP
            if (e.isA("NP")){
                return  e.pronominalize_en()
            } if (!e.isA("Pro")) { // it can happen that a Pro has property "pro" set within the same expression
                return this.warn("bad application",".pro",["NP"],e.constType)
            }
        }
    }    
}

// check if any child should be pronominalized
// this must be done in the context of the parent, because some elements might be changed
Phrase.prototype.pronominalizeChildren = function(){
    let es=this.elements;
    for (let i = 0; i < es.length; i++) {
        this.pronominalize(es[i]);
    }
}


// modify the sentence structure to create a passive sentence
Phrase.prototype.passivate = function(){
    let subject,vp,newSubject;
    // find the subject at the start of this.elements
    if (this.isA("VP")){
        subject=null;
        vp=this;
    } else {
        vp=this.getConst("VP");
        if (vp !== undefined){
            if (this.elements.length>0 && this.elements[0].isOneOf(["N","NP","Pro"])){
                subject=this.elements.shift();
                if (subject.isA("Pro")){
                    // as this pronoun will be preceded by "par" or "by", the "bare" tonic form is needed
                    subject=subject.getTonicPro();
                }
            } else {
                subject=null;
            }
        } else {
            return this.warn("not found","VP",this.isFr()?"contexte passif":"passive context")
        }
    }
    // remove object (first NP or Pro within VP) from elements
    if (vp !== undefined) {
        let objIdx=vp.getIndex(["NP","Pro"]);
        if (objIdx>=0){
            let obj=vp.elements.splice(objIdx,1)[0]; // splice returns [obj]
            if (obj.isA("Pro")){
                obj=obj.getTonicPro("nom");
                if (objIdx==0){// a French pronoun inserted by .pro()
                    objIdx=vp.getIndex("V")+1 // ensure that the new object will appear after the verb
                }
            } else if (obj.isA("NP") && obj.props["pro"]!==undefined){
                obj=obj.getTonicPro("nom");
            }
            // swap subject and obj
            newSubject=obj;
            this.elements.unshift(newSubject); // add object that will become the subject
            newSubject.parentConst=this;       // adjust parentConst
            // make the verb agrees with the new subject (in English only, French is dealt below)
            if (this.isEn()){
                this.linkPengWithSubject("VP","V",newSubject);
            } 
            if (subject!=null){   // insert subject where the object was
                vp.elements.splice(objIdx,0,PP(P(this.isFr()?"par":"by"),subject)); 
                subject.parentConst=vp; // adjust parentConst
            }
        } else if (subject !=null){ // no object, but with a subject that we keep as is
            newSubject=subject;
            if (subject.isA("Pro")){
                // the original subject at nominative will be reinserted below!!!
                subject=subject.getTonicPro("nom");
            } else { 
                //create a dummy subject with a "il" unless it is at the imperative tense
                if (vp.getProp("t")!=="ip"){
                    subject=(this.isFr()?Pro("lui"):Pro("it")).c("nom");
                }
            }
            this.elements.unshift(subject);
            vp.peng=subject.peng
        }
        if (this.isFr()){
            // do this only for French because in English this is done by processTyp_en
            // change verbe into an "être" auxiliary and make it agree with the newSubject
            const verbeIdx=vp.getIndex("V")
            const verbe=vp.elements.splice(verbeIdx,1)[0];
            const aux=V("être");
            aux.parentConst=vp;
            aux.taux=verbe.taux;
            aux.peng=newSubject.peng;
            aux.props=verbe.props;
            aux.pe(3); // force person to be 3rd (number and tense will come from the new subject)
            if (vp.getProp("t")=="ip"){
                aux.t("s") // set subjonctive present tense for an imperative
            }
            const pp = V(verbe.lemma).t("pp");
            pp.peng=newSubject.peng;
            pp.parentConst=vp;
            vp.elements.splice(verbeIdx,0,aux,pp);
        }
    } else {
        return this.warn("not found","VP",isFr()?"contexte passif":"passive context")
    }
}

// generic phrase structure modification for a VP, called in the .typ({...}) for .prog, .mod, .neg
// also deals with coordinated verbs
Phrase.prototype.processVP = function(types,key,action){
    const v=this.getFromPath(["CP","VP"]);
    if (v!==undefined){// possibly a coordination of verbs
        this.getConst("CP").elements.forEach(function(e){
            if (e.isA("VP")){ e.processVP(types,key,action) }
        });
        return;
    }
    const val=types[key];
    if (val !== undefined && val !== false){
        let vp;
        if (this.isA("VP")){vp=this}
        else {
            const idxVP=this.getIndex(["VP"]);
            if (idxVP >=0 ) {vp=this.elements[idxVP]}
            else {
                this.warn("bad const for option",'.typ("'+key+":"+val+'")',this.constType,["VP"])
                return;
            }
        }
        const idxV=vp.getIndex("V");
        if (idxV!==undefined){
            const v=vp.elements[idxV];
            action(vp,idxV,v,val);
        }
    }
}

Phrase.prototype.processTyp_fr = function(types){
    // process types in a particular order
    let rules=this.getRules();
    this.processVP(types,"prog",function(vp,idxV,v){
        const verb=vp.elements.splice(idxV,1)[0];
        const origLemma=verb.lemma;
        verb.setLemma("être");// change verb, but keep person, number and tense properties of the original...
        // insert "en train","de" (separate so that élision can be done...) 
        // but do it BEFORE the pronouns created by .pro()
        let i=idxV-1;
        while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
        vp.elements.splice(i+1,0,verb,Q("en train"),Q("de"));
        vp.elements.splice(idxV+3,0,V(origLemma).t("b"));
    });
    this.processVP(types,"mod",function(vp,idxV,v,mod){
        var vUnit=v.lemma;
        for (var key in rules.verb_option.modalityVerb){
            if (key.startsWith(mod)){
                v.setLemma(rules.verb_option.modalityVerb[key]);
                break;
            }
        }
        let i=idxV-1;
        // move the modality verb before the pronoun(s) inserted by .pro()
        while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
        if (i!=idxV-1){
            const modVerb=vp.elements.splice(idxV,1)[0]; // remove the modality verb
            vp.elements.splice(i+1,0,modVerb); // move it before the pronouns
        }
        vp.elements.splice(idxV+1,0,V(vUnit).t("b"));// add the original verb at infinitive 
    });
    this.processVP(types,"neg",function(vp,idxV,v,neg){
        if (neg === true)neg="pas";
        v.neg2=neg; // HACK: to be used when conjugating at the realization time
        while (idxV>0 && vp.elements[idxV-1].isA("Pro"))idxV--;
        // insert "ne" before the verb or before possible pronouns preceding the verb
        vp.elements.splice(idxV,0,Adv("ne"));
    })
}

// negation of modal auxiliaries
const negMod={"can":"cannot","may":"may not","shall":"shall not","will":"will not","must":"must not",
              "could":"could not","might":"might not","should":"should not","would":"would not"}    

Phrase.prototype.processTyp_en = function(types){
    // replace current verb with the list new words
    //  TODO: take into account the fact that there might be already a verb with modals...
    let vp;
    if (this.isA("VP")){vp=this}
    else {
        const idxVP=this.getIndex(["VP"]);
        if (idxVP>=0) {vp=this.elements[idxVP]}
        else {
            return this.warn("bad const for option",'.typ('+JSON.stringify(types)+')',this.constType,["VP"])
        }
    }
    const idxV=vp.getIndex("V");
    if(idxV>=0){
        let v = vp.elements[idxV];
        // const pe = this.getProp("pe");
        // const g=this.getProp("g");
        // const n = this.getProp("n");
        const v_peng=v.peng;
        let t = vp.getProp("t");
        const neg = types["neg"]===true;
        // English conjugation 
        // it implements the "affix hopping" rules given in 
        //      N. Chomsky, "Syntactic Structures", 2nd ed. Mouton de Gruyter, 2002, p 38 - 48
        let auxils=[];  // list of Aux followed by V
        let affixes=[];
        let isFuture=false;
        if (t=="f"){
            isFuture=true;
            t="p"; // the auxiliary will be generated here so remove it from the V
        }
        const prog = types["prog"]!==undefined && types["prog"]!==false;
        const perf =types["perf"]!==undefined && types["perf"]!==false;
        const pas =types["pas"]!==undefined && types["pas"]!==false;
        const interro = types["int"];
        const modality=types["mod"];
        if (types["contr"]!==undefined && types["contr"]!==false){
            vp.contraction=true; // necessary because we want the negation to be contracted within the VP before the S or SP
            this.contraction=true;
        }
        const compound = this.getRules().compound;
        if (modality !== undefined && modality !== false){
            auxils.push(compound[modality].aux);
            affixes.push("b");
        } else if (isFuture){
            // caution: future in English is done with the modal will, so another modal cannot be used
            auxils.push(compound.future.aux);
            affixes.push("b");
        }
        if (perf || prog || pas){
            if (perf){
                auxils.push(compound.perfect.aux);
                affixes.push(compound.perfect.participle);
            }
            if (prog) {
                auxils.push(compound.continuous.aux);
                affixes.push(compound.continuous.participle)
            }
            if (pas) {
                auxils.push(compound.passive.aux);
                affixes.push(compound.passive.participle)
            }
        } else if (interro !==undefined && interro !== false && 
                   auxils.length==0 && v.lemma!="be" && v.lemma!="have"){ 
            // add auxiliary for interrogative if not already there
            if (interro!="wos"){
                auxils.push("do");
                affixes.push("b");
            }
        }
        auxils.push(v.lemma);
        // realise the first verb, modal or auxiliary
        // but make the difference between "have" as an auxiliary and "have" as a verb
        const vAux=auxils.shift();
        let words=[];
        // conjugate the first verb
        if (neg) { // negate the first verb
            if (vAux in negMod){
                if (vAux=="can" && t=="p"){
                    words.push(Q("cannot"))
                } else {
                    words.push(V(vAux).t(t))
                    words.push(Adv("not"))
                }
            } else if (vAux=="be" || (vAux=="have" && v.lemma!="have")) {
                words.push(V(vAux).t(t));
                words.push(Adv("not"));
            } else {
                words.push(V("do").t(t));
                words.push(Adv("not"));
                if (vAux != "do") words.push(V(vAux).t("b")); 
            }
        } else { // must only set necessary options, so that shared properties will work ok
            let newAux=V(vAux);
            if (!isFuture)newAux.t(t);
            if (v in negMod)newAux.pe(1);
            words.push(newAux);
        }
        // recover the original agreement info and set it to the first new verb...
        words[0].peng=v_peng;
        // realise the other parts using the corresponding affixes
        while (auxils.length>0) {
            v=auxils.shift();
            words.push(V(v).t(affixes.shift()));
        }
        // HACK: splice the content of the array into vp.elements
        words.forEach(function(w){w.parentConst=vp});
        Array.prototype.splice.apply(vp.elements,[idxV,1].concat(words));
    } else {
        this.warn("not found","V","VP")
    }
}

// get elements of the constituent cst2 within the constituent cst1
Phrase.prototype.getIdxCtx = function(cst1,cst2){
    if (this.isA(cst1)){
        var idx=this.getIndex(cst2)
        if (idx!==undefined)return [idx,this.elements];
    } else if (this.isOneOf(["S","SP"])){
        var cst=this.getConst(cst1);
        if (cst!==undefined)return cst.getIdxCtx(cst1,cst2);
    }
    return undefined
}

Phrase.prototype.moveAuxToFront = function(){
    // in English move the auxiliary to the front 
    if (this.isEn()){
        if (this.isOneOf(["S","SP"])){ 
            let idxCtx=this.getIdxCtx("VP","V");
            if (idxCtx!==undefined){
                let vpElems=idxCtx[1]
                const v=vpElems.splice(0,1)[0]; // remove first V
                // check if V is followed by a negation, if so move it also
                if (vpElems.length>0 && vpElems[0].isA("Adv") && vpElems[0].lemma=="not"){
                    const not=vpElems.splice(0,1)[0]
                    this.elements.splice(0,0,v,not)
                } else {
                    this.elements.splice(0,0,v);
                }
            }
        }
    }
}

// modify sentence structure according to the content of the "typ" property
Phrase.prototype.processTyp = function(types){
    if (types["pas"]!==undefined && types["pas"]!== false){
        this.passivate()
    }
    if (this.isFr()){
        if (types["contr"]!==undefined && types["contr"]!==false){
            this.warn("no French contraction")
        }
        this.processTyp_fr(types) 
    } else { 
        this.processTyp_en(types) 
    }
    const int=types["int"];
    if (int !== undefined && int !== false){
        const sentenceTypeInt=this.getRules().sentence_type.int;
        const prefix=sentenceTypeInt.prefix;
        switch (int) {
        case "yon": case "whe": case "why": case "whn": case "how": case "muc":
                this.moveAuxToFront()
            break;
        // remove a part of the sentence 
        case "wos":// remove subject (first NP,N, Pro or SP)
            if (this.isOneOf(["S","SP"])){
                const subjIdx=this.getIndex(["NP","N","Pro","SP"]);
                if (subjIdx!==undefined){
                    this.elements.splice(subjIdx,1);
                    // insure that the verb at the third person singular, 
                    // because now the subject has been removed
                    const v=this.getFromPath(["VP","V"])
                    if (v!==undefined){
                        v.setProp("n","s");
                        v.setProp("pe",3);
                    }
                }
            }
            break;
        case "wod": case "wad": // remove direct object (first NP,N,Pro or SP in the first VP)
            if (this.isOneOf(["S","SP"])){
                this.moveAuxToFront();
                const objIdxCtx=this.getIdxCtx("VP",["NP","N","Pro","SP"]);
                if (objIdxCtx!==undefined){
                    objIdxCtx[1].splice(objIdxCtx[0],1);
                }
            }
            break;
        case "woi": // remove direct object (first PP in the first VP)
            if (this.isOneOf(["S","SP"])){
                this.moveAuxToFront();
                const objIdxCtx=this.getIdxCtx("VP","PP");
                if (objIdxCtx!==undefined){
                    objIdxCtx[1].splice(objIdxCtx[0],1);
                }
            }
            break;
        default:
            this.warn("not implemented","int:"+int)
        }
        if(this.isFr() || int !="yon") {// add the interrogative prefix
            // separate the last "que" so that it can be elided
            const pref=prefix[int];
            if (/ qu(e|i)$/.test(pref)){
                this.elements.splice(0,0,Q(pref.substr(0,pref.length-4)),Q(pref.substr(pref.length-3)));
            } else {
                this.elements.splice(0,0,Q(pref));
            }
        }
        this.a(sentenceTypeInt.punctuation,true);
    }    
    const exc=types["exc"];
    if (exc !== undefined && exc === true){
        this.a(this.getRules().sentence_type.exc.punctuation,true);
    }
    return this;   
}

////////////////// Realization

//  special case of realisation of a cp for which the gender and number must be computed
//    at realization time...

Phrase.prototype.cpReal = function(){
    var res=[];
    // realize coordinated Phrase by adding ',' between all elements except for the last
    // if no C is found then all elements are separated by a ","
    // TODO: deal with the Oxford comma (i.e. a comma after all elements even the last)
    const idxC=this.getIndex("C");
    // take a copy of all elements except the coordonate
    const elems=this.elements.filter(function(x,i){return i!=idxC})
    var last=elems.length-1;
    if (elems.length==0){// empty coordinate (ignore)
        return this.doFormat(res)
    }
    if (last==0){// coordination with only one element, ignore coordinate
        this.setProp("g",elems[0].getProp("g"));
        this.setProp("n",elems[0].getProp("n"));
        this.setProp("pe",elems[0].getProp("pe"));
        this.peng=elems[0].peng; // set pe,n,g info from single element
        Array.prototype.push.apply(res,elems[0].real());
        return this.doFormat(res); // process format for the CP
    }
    // compute the combined gender and number of the coordination
    let c;
    if(idxC >= 0 ){
        c=this.elements[idxC]
        var and=this.isFr()?"et":"and";
        var gn=this.findGenderNumber(c.lemma==and)
        this.setProp("g",gn.g);
        this.setProp("n",gn.n);
        this.setProp("pe",3);
    } else {
        last++; // no coordinate, process all with the following loop 
    }            
    for (let j = 0; j < last; j++) { //insert comma after each element
        const ej=elems[j];
        if (j<last-1 && 
            (ej.props["a"] === undefined || !contains(ej.props["a"],",")))
                ej.props["a"]=[","]
        Array.prototype.push.apply(res,ej.real())
    }
    // insert realisation of C before last...
    if(idxC>=0){
        Array.prototype.push.apply(res,this.elements[idxC].real());
        Array.prototype.push.apply(res,elems[last].real());
    }
    return this.doFormat(res); // process format for the CP
}

// special case of VP for which the complements are put in increasing order of length
Phrase.prototype.vpReal = function(){
    var res=[];
    function realLength(terms){
        // sum the length of each realization and add the number of words...
        //  use the lemma length (instead of realization) 
        // so that html tags and punctuation are not taken into the count
        return terms.map(t=>t.lemma.length).reduce((a,b)=>a+b,0)+terms.length
    }
    this.pronominalizeChildren();
    // get index of last V (to take into account possible auxiliaries)
    const last=this.elements.length-1;
    var vIdx=last;
    while (vIdx>=0 && !this.elements[vIdx].isA("V"))vIdx--;
    // copy everything up to the V (included)
    if (vIdx<0)vIdx=last;
    else {
        const t=this.elements[vIdx].getProp("t");
        if (t == "pp") vIdx=last; // do not rearrange sentences with past participle
        else if (contains(["être","be"],this.elements[vIdx].lemma)) { // do not rearrange complements of être/be
            vIdx=last 
        }
    } 
    let i=0;
    while (i<=vIdx){
        Array.prototype.push.apply(res,this.elements[i].real());
        i++;
    }
    if (i>last) {
        return this.doFormat(res); // process format for the VP
    }
    // save all succeeding realisations
    let reals=[]
    while (i<=last){
        reals.push(this.elements[i].real())
        i++;
    }
    // sort realisations in increasing length
    // HACK: consider two lengths differing by less than 25% (ratio > 0.75) as equal, 
    //       so that only big differences in length are reordered
    reals.sort(function(s1,s2){
        const l1=realLength(s1),l2=realLength(s2);
        return Math.min(l1,l2)/Math.max(l1,l2)>0.75?0:l1-l2
    });
    reals.forEach(r=>Array.prototype.push.apply(res,r)); // add them
    return this.doFormat(res) // process format for the VP
}

// creates a list of Terminal each with its "realization" field now set
Phrase.prototype.real = function() {
    let res=[];
    if (this.isA("CP")){
        res=this.cpReal()
    } else {
        this.pronominalizeChildren();
        const typs=this.props["typ"];
        if (typs!==undefined)this.processTyp(typs);
        const es=this.elements;
        for (let i = 0; i < es.length; i++) {
            const e = es[i];
            var r;
            if (e.isA("CP")){
                r=e.cpReal();
            } else if (e.isA("VP") && reorderVPcomplements){
                r=e.vpReal();
            } else {
                r=e.real()
            }
            // we must flatten the lists
            Array.prototype.push.apply(res,r)
        }
    }
    return this.doFormat(res);
};

// recreate a jsRealB expression
// if indent is a number create an indented pretty-print (call it with 0 at the root)
Phrase.prototype.toSource = function(indent){
    var sep, newIdent;
    if (typeof indent == "number"){
        newIdent=indent+this.constType.length+1;
        sep=",\n"+Array(newIdent).fill(" ").join("")
    } else {
        sep=",";
        newIdent=undefined
    }
    // create source of children
    let res=this.constType+"("+this.elementsSource.map(e => e.toSource(newIdent)).join(sep)+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this); // ~ super.toSource()
    return res;
}

/////////////// Constructors for the user

// functions for creating Phrases
function S   (_){ return new Phrase(Array.from(arguments),"S"); };
function NP  (_){ return new Phrase(Array.from(arguments),"NP"); }
function AP  (_){ return new Phrase(Array.from(arguments),"AP"); }
function VP  (_){ return new Phrase(Array.from(arguments),"VP"); }
function AdvP(_){ return new Phrase(Array.from(arguments),"AdvP"); }
function PP  (_){ return new Phrase(Array.from(arguments),"PP"); }
function CP  (_){ return new Phrase(Array.from(arguments),"CP"); }
function SP  (_){ return new Phrase(Array.from(arguments),"SP"); }
/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

////// Creates a Terminal (subclass of Constituent)
// Terminal
function Terminal(lemmaArr,terminalType,lang){
    Constituent.call(this,terminalType);
    this.lang=lang || currentLanguage;
    if (terminalType!="DT" && lemmaArr.length!=1){
        this.warn("too many parameters",terminalType,lemmaArr.length)
    } else
        this.setLemma(lemmaArr[0],terminalType);
}
extend(Constituent,Terminal)

Terminal.prototype.me = function(){
    return this.constType+"("+quote(this.lemma)+")";
}

Terminal.prototype.morphoError = function (lemma,constType,errorKind,keyVals){
    this.warn("morphology error",errorKind+` :${constType}(${lemma}) : `+JSON.stringify(keyVals))
    return "[["+lemma+"]]"
}

Terminal.prototype.add = function(){
    this.warn("bad application",".add","Phrase",this.constType)
    return this;
}

//  set lemma, precompute stem and store conjugation/declension table number 
Terminal.prototype.setLemma = function(lemma,terminalType){
    if (terminalType==undefined) // when it is not called from a Constructor, keep the current terminalType
        terminalType=this.constType;
    this.lemma=lemma;
    if (this.peng===undefined) this.initProps(); // setLemma can be used on an already initialized value
    var lemmaType= typeof lemma;
    switch (terminalType) {
    case "DT":
         if (lemma==undefined){
             this.date=new Date()
         } else {
             if (lemmaType != "string" && !(lemma instanceof Date)){
                 this.warn("bad parameter","string, Date",lemmaType);
             }             
             this.date = new Date(lemma);
         }
         this.lemma = this.date+""
         this.props["dOpt"]={year:true,month:true,date:true,day:true,hour:true,minute:true,second:true,
                        nat:true,det:true,rtime:false}
        break;
    case "NO":
        if (lemmaType != "string" && lemmaType != "number"){
            this.warn("bad parameter","string, number",lemmaType);
        }
        this.value=+lemma; // this parses the number if it is a string
        this.nbDecimals=nbDecimal(lemma);
        this.props["dOpt"]={mprecision:2, raw:false, nat:false, ord:false};
        break;
    case "Q":
        this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
        break;
    case "N": case "A": case "Pro": case "D": case "V": case "Adv": case "C": case "P":
        if (lemmaType != "string"){
            this.tab=null;
            this.realization =`[[${lemma}]]`;
            return this.warn("bad parameter","string",lemmaType)
        }
        let lexInfo=this.getLexicon()[lemma];
        if (lexInfo==undefined){
            this.tab=null;
            this.realization =`[[${lemma}]]`;
            this.warn("not in lexicon");
        } else {
            lexInfo=lexInfo[terminalType];
            if (lexInfo===undefined){
                this.tab=null;
                this.realization =`[[${lemma}]]`;
                this.warn("not in lexicon");
            } else {
                const keys=Object.keys(lexInfo);
                const rules=this.getRules();
                for (let i = 0; i < keys.length; i++) {
                    const key=keys[i];
                    if (key=="tab"){ // save table number and compute stem
                        var ending;
                        this.tab=lexInfo["tab"]
                        if (typeof this.tab == "object") {// looking for a declension
                            this.tab=this.tab[0];
                            const declension=rules.declension[this.tab]; // occurs for C, Adv and P
                            if (declension !== undefined)ending = declension.ending;
                        } else {
                            ending = rules.conjugation[this.tab].ending;
                        }
                        if (lemma.endsWith(ending)){
                            this.stem=lemma.substring(0,lemma.length-ending.length);
                        } else {
                            this.tab=null
                        }
                    } else { // copy other key as property
                        let info=lexInfo[key]
                        if (typeof info === "object" && info.length==1)info=info[0];
                        this.setProp(key,info);
                    }
                }
            }
        }        
        break;
    default:
        this.warn("not implemented",terminalType);
    }
}

Terminal.prototype.grammaticalNumber = function(){
    if (!this.isA("NO")){
        return this.warn("bad application","grammaticalNumber","NO",this.constType);
    }
    
    if (this.props["dOpt"].ord==true)return "s"; // ordinal number are always singular
    
    const number=this.value;
    if (this.isFr()){
        // according to http://bdl.oqlf.gouv.qc.ca/bdl/gabarit_bdl.asp?id=1582
        return (-2 < number && number < 2) ? "s" : "p";
    } else {
        // according to https://www.chicagomanualofstyle.org/book/ed17/part2/ch09/psec019.html
        //   any number other than 1 is plural... 
        // even 1.0 but this case is not handled here because nbDecimal(1.0)=>0
        return (Math.abs(number)==1 && this.nbDecimals==0)?"s":"p";
    }
};

Terminal.prototype.getIndex = function(constTypes){
    return ((typeof constTypes == "string")?this.isA:this.isOneOf)(constTypes)?0:-1;
}

Terminal.prototype.getConst = function(constTypes){
    return this.getIndex(constTypes)==0?this:undefined;
}

// try to find the best declension match
//    value equal = 2
//    equal with x = 1
//    no match = 0
//  but if the person does not match set score to 0
Terminal.prototype.bestMatch = function(errorKind,declension,keyVals){
    let matches=[];
    for (var i = 0; i < declension.length; i++) {
        const d=declension[i];
        let nbMatches=0;
        for (let key in keyVals){
            if (d[key]!==undefined){
                const val=keyVals[key];
                if (key=="pe" && d[key]!=val){// persons must match exactly
                    nbMatches=0;
                    break;
                }
                if (d[key]==val)nbMatches+=2;
                else if (d[key]=="x")nbMatches+=1
            }
        }
        matches.push([nbMatches,d["val"]]);
    }
    matches.sort((a,b)=>b[0]-a[0]); // sort scores in decreasing order
    const best=matches[0];
    if (best[0]==0){
        this.morphoError(this.lemma,this.constType,errorKind,keyVals)
        return null;
    } 
    return best[1];
}

// constant fields
const gn=["g","n"];
const gnpe=["pe"].concat(gn) // check pe first
const gnpetnc=["tn","c"].concat(gnpe)
const gnpeown=gnpe.concat(["own"])
const fields={"fr":{"N":gn,   "D":gnpe,   "Pro":gnpetnc},
              "en":{"N":["n"],"D":gnpeown,"Pro":gnpeown}};


/// French and English declension
Terminal.prototype.decline = function(setPerson){
    const rules=this.getRules();
    let declension=rules.declension[this.tab].declension;
    let res=null;
    if (this.isOneOf(["A","Adv"])){ // special case of adjectives or adv 
        if (this.isFr()){
            const g=this.getProp("g");
            const n=this.getProp("n");
            const ending=this.bestMatch("déclinaison d'adjectif",declension,{g:g,n:n});
            if (ending==null){
                return `[[${this.lemma}]]`;
            }
            res = this.stem+ending;
            const f = this.getProp("f");// comparatif d'adjectif
            if (f !== undefined && f !== false){
                const specialFRcomp={"bon":"meilleur","mauvais":"pire"};
                if (f == "co"){
                    const comp = specialFRcomp[this.lemma];
                    return (comp !== undefined)?A(comp).g(g).n(n).toString():"plus "+res;
                }
                if (f == "su"){
                    const comp = specialFRcomp[this.lemma];
                    const art = D("le").g(g).n(n)+" ";
                    return art+(comp !== undefined?A(comp).g(g).n(n):"plus "+res);
                }
            }
        } else {
            // English adjective/adverbs are invariable but they can have comparative
            res = this.lemma;
            const f = this.getProp("f");// usual comparative/superlative
            if (f !== undefined && f !== false){
                if (this.tab=="a1"){
                    res = (f=="co"?"more ":"most ") + res;
                } else {
                    if (this.tab=="b1"){// this is an adverb with no comparative/superlative, try the adjective table
                        const adjAdv=this.getLexicon()[this.lemma]["A"]
                        if (adjAdv !== undefined){
                            declension=rules.declension[adjAdv["tab"][0]].declension;
                        }
                    } 
                    // look in the adjective declension table
                    const ending=this.bestMatch("adjective declension",declension,{f:f})
                    if (ending==null){
                        return `[[${this.lemma}]]`;
                    }
                    res = this.stem + ending;
                }
            }
        }
    } else if (declension.length==1){ // no declension
        res=this.stem+declension[0]["val"]
    } else { // for N, D, Pro
        const g=this.getProp("g");
        const n=this.getProp("n");
        let pe=3;
        if (setPerson){
            let p=this.getProp("pe");
            pe = p===undefined ? 3 : +p;
        }
        let keyVals=setPerson?{pe:pe,g:g,n:n}:{g:g,n:n};
        if (this.props["own"]!==undefined)keyVals["own"]=this.props["own"];
        if (this.isA("Pro")){// check special combinations of tn and c for pronouns
            const c  = this.props["c"];
            if (c!==undefined){
                if (this.isFr() && c=="gen"){ // genitive cannot be used in French
                    this.warn("ignored value for option","c",c)
                } else if (this.isEn() && c=="refl"){ // reflechi cannot be used in English
                    this.warn("ignored value for option","c",c)
                } else
                    keyVals["c"]=c;
            }
            const tn = this.props["tn"];
            if (tn !== undefined){
                if (c!== undefined){
                    this.warn("both tonic and clitic");
                } else {
                    keyVals["tn"]=tn;
                }
            }
            if (c !== undefined || tn !== undefined){
                if ((this.isFr() && this.lemma=="moi") || (this.isEn() && this.lemma=="me")){
                    // HACK:remove defaults from pronoun such as "moi" in French and "me" in English
                    //      because their definition is special in order to try to keep some upward compatibility
                    //      with the original way of specifying the pronouns
                    if (this.getProp("g") ===undefined)delete keyVals["g"];
                    if (this.getProp("n") ===undefined)delete keyVals["n"];
                    // make sure it matches the first and set the property for verb agreement
                    if (c=="nom" || tn==""){
                        keyVals["pe"]=1;
                        this.setProp("pe",1);
                    } 
                } else { // set person
                    const d0=declension[0];
                    this.setProp("g", d0["g"] || g);
                    this.setProp("n", d0["n"] || n);
                    this.setProp("pe",keyVals["pe"] = d0["pe"] || 3);
                }
            } else { // no c, nor tn set tn to "" except for "on"
                if(this.lemma!="on")keyVals["tn"]="";
            }
        }
        const ending=this.bestMatch(this.isFr()?"déclinaison":"declension",declension,keyVals);
        if (ending==null){
            return `[[${this.lemma}]]`;
        }
        if (this.isFr() && this.isA("N")){ 
            // check is French noun gender specified corresponds to the one given in the lexicon
            const lexiconG=this.getLexicon()[this.lemma]["N"]["g"]
            if (lexiconG === undefined){
                return this.morphoError(this.lemma,this.constType,"absent du lexique",{g:g,n:n});
            } 
            if (lexiconG != "x" && lexiconG != g) {
                return this.morphoError(this.lemma,this.constType,
                    "genre différent de celui du lexique",{g:g, lexique:lexiconG})
            }
        }
        res = this.stem+ending;
    }
    return res; 
}

// French conjugation
Terminal.prototype.conjugate_fr = function(){
    let pe = +this.getProp("pe"); // property can also be a string with a single number 
    let g = this.getProp("g");
    let n = this.getProp("n");
    const t = this.getProp("t");
    let neg;
    if (this.tab==null) return this.morphoError(this.lemma,this.constType,"conjugate_fr:tab",{pe:pe,n:n,t:t});
    switch (t) {
    case "pc":case "pq":case "cp": case "fa": case "spa": case "spq":// temps composés
        const tempsAux={"pc":"p","pq":"i","cp":"c","fa":"f","spa":"s","spq":"si"}[t];
        // const aux=this.getProp("aux");
        // const v=V("avoir").pe(pe).n(n).t(tempsAux);
        const v=V("avoir");
        v.peng=this.peng;
        v.taux=this.taux;
        v.taux["t"]=tempsAux;
        neg=this.neg2;
        if (neg!==undefined){ // apply negation to the auxiliary and remove it from the verb...
            v.neg2=neg;
            delete this.neg2
        }
        if (v.taux["aux"]=="êt"){
            v.setLemma("être");
            return VP(v,V(this.lemma).t("pp").g(g).n(n))+"";
        } else {
            // check the gender and number of a cod appearing before the verb to do proper agreement
            //   of its part participle
            g="m"
            n="s";
            var cod = this.cod;
            if (cod !== undefined){
                g=cod.getProp("g");
                n=cod.getProp("n");
            }
        }
        return VP(v,V(this.lemma).t("pp").g(g).n(n))+"";
    default:// simple tense
        var conjugation=this.getRules().conjugation[this.tab].t[t];
        if (conjugation!==undefined && conjugation!==null){
            let res;
            switch (t) {
            case "p": case "i": case "f": case "ps": case "c": case "s": case "si": case "ip":
                if (t=="ip"){ // French imperative does not exist at all persons and numbers
                    if ((n=="s" && pe!=2)||(n=="p" && pe==3)){
                        return this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t});
                    }
                }
                if (n=="p"){pe+=3};
                const term=conjugation[pe-1];
                if (term==null){
                    return this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t});
                } else {
                    res=this.stem+term;
                }
                neg=this.neg2;
                if (neg !== undefined && neg !== ""){
                    res+=" "+neg;
                }
                return res;
            case "b": case "pr": case "pp":
                res=this.stem+conjugation;
                neg=this.neg2;
                if (neg !== undefined && neg !== ""){
                    if (t=="b")res = neg+" "+res;
                    else res +=" "+neg;
                }
                if (t=="pp" && res != "été"){ //HACK: peculiar frequent case of être that does not change
                    let g=this.getProp("g");
                    if (g=="x")g="m";
                    let n=this.getProp("n");
                    if (g=="x")g="s";
                    res+={"ms":"","mp":"s","fs":"e","fp":"es"}[g+n]
                }
                return res;
            default:
                return this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t});
            }
        }
        return this.morphoError(this.lemma,this.constType,"conjugate_fr:t",{pe:pe,n:n,t:t});
    }
}

Terminal.prototype.conjugate_en = function(){
    let pe = +this.getProp("pe"); // property can also be a string with a single number 
    const g=this.getProp("g");
    const n = this.getProp("n");
    const t = this.getProp("t");
    if (this.tab==null) return this.morphoError(this.lemma,this.constType,"conjugate_en:tab",{pe:pe,n:n,t:t});
    const conjugation=this.getRules().conjugation[this.tab].t[t];
    switch (t) {
    case "p": case "ps":
        if (conjugation!==undefined){
            if (typeof conjugation == "string"){
                return this.stem+conjugation;
            }
            if (n=="p"){pe+=3};
            const term=conjugation[pe-1];
            if (term==null){
                return this.morphoError(this.lemma,this.consType,"conjugate_en:pe",{pe:pe,n:n,t:t})
            } else {
                return this.stem+term;
            }
        } else {
            return this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",{pe:pe,n:n,t:t});
        }
    case "f":
        return "will "+this.lemma;
    case "ip":
        return this.lemma;
    case "b": case "pp": case "pr":
        return this.stem+conjugation;
    default:
        return this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",{pe:pe,n:n,t:t});
    }
}

Terminal.prototype.conjugate = function(){
    if (this.isFr())return this.conjugate_fr();
    else return this.conjugate_en();
}

// For numbers

Terminal.prototype.numberFormatter = function (rawNumber, maxPrecision) {
    let precision = (maxPrecision === undefined) ? 2 : maxPrecision;
    const numberTable = this.getRules().number;
    precision = nbDecimal(rawNumber) > precision ? precision : nbDecimal(rawNumber);
    return formatNumber(rawNumber, precision, numberTable.symbol.decimal, numberTable.symbol.group);
};

Terminal.prototype.numberToWord = function(number, lang, gender) {
    if (parseInt(number) !== number){
        this.warn("bad number in word",number)
        return number+"";
    }
    if (lang=="fr" && gender=="f"){
        if (number==1)return "une";
        if (number==-1) return "moins une";
    } 
    return enToutesLettres(number,lang);
};

Terminal.prototype.numberToOrdinal = function(number,lang,gender){
    if (parseInt(number) !== number){
        this.warn("bad ordinal",number)
        return number+"";
    } 
    if (number<=0){
        this.warn("bad ordinal",number)
    }
    return ordinal(number,lang, gender);
};


////// Date

Terminal.prototype.dateFormat = function(dateObj,dOpts){
    // useful abbreviations for date format access
    const dateRule = this.getRules().date
    const naturalDate = dateRule.format.natural
    const nonNaturalDate =dateRule.format.non_natural
    const relativeDate = dateRule.format.relative_time

    // name of fields to be used in date formats
    const dateFields = ["year","month","date","day"]
    const timeFields = ["hour","minute","second"]
    let res;
    if (dOpts["rtime"]==true){
        // find the number of days of difference between today and the current date
        const today=new Date()
        const diffDays=Math.ceil((dateObj.getTime()-today.getTime())/(24*60*60*1000));
        today.setDate(today+diffDays);
        const res=relativeDate[""+diffDays];
        if (res!==undefined) return this.interpretDateFmt(dateObj,relativeDate,""+diffDays,false);
        const sign=diffDays<0?"-":"+";
        return relativeDate[sign].replace("[x]",Math.abs(diffDays))
    }
    const dfs = dateFields.filter(function(field){return dOpts[field]==true}).join("-");
    const tfs = timeFields.filter(function(field){return dOpts[field]==true}).join(":");
    if (dOpts["nat"]==true){
        res=this.interpretDateFmt(dateObj,naturalDate,dfs,dOpts["det"]==false);
        const hms=this.interpretDateFmt(dateObj,naturalDate,tfs);
        if (res=="")return hms;
        if (hms != "")return res+" "+hms;
        return res;
    }
    if (dOpts["nat"]==false){
        res=this.interpretDateFmt(dateObj,nonNaturalDate,dfs,dOpts["det"]==false);
        const hms=this.interpretDateFmt(dateObj,nonNaturalDate,tfs);
        if (res=="")return hms;
        if (hms != "")return res+" "+hms;
        return res;
    }
    this.warn("not implemented",JSON.stringify(dOpts));
    return "[["+dateObj+"]]"
}

Terminal.prototype.interpretDateFmt = function(dateObj,table,spec,removeDet){
    // fields: 1 what is before [..] 2: its content, 3=content if no [..] found
    const dateRE = /(.*?)\[([^\]]+)\]|(.*)/y;
    if (spec=="") return "";
    let res="";
    let fmt=table[spec];
    if (fmt!==undefined){
        if (removeDet){ // remove determinant at the start of the string
            var idx=fmt.indexOf("[")
            if (idx>=0)fmt=fmt.substring(idx);
        }
        dateRE.lastIndex=0;
        let match=dateRE.exec(fmt);
        while (match[0].length>0){ // loop over all fields
            if (match[1]!==undefined){
                res+=match[1];
                const pf=dateFormats[match[2]];
                if (pf!==undefined){
                    const val=pf.param.call(dateObj); // call function to get the value
                    res+=pf.func.call(this,val)       // format the value as a string
                }
            } else if (match[3]!==undefined){
                res+=match[3]      // copy the string
            } else {
                return this.error("bad match: should never happen:"+fmt);
            }
            match=dateRE.exec(fmt);
        }
        return res;
    } else {
        this.error("unimplemented format specification:"+spec);
        return "[["+dateObj+"]]"
    }
}

// Realize (i.e. set the "realization" field) for this Terminal
Terminal.prototype.real = function(){
    switch (this.constType) {
    case "N": case "A": 
        if (this.tab!==null)this.realization=this.decline(false);
        break;
    case "Adv":
        if (this.tab!==null)this.realization=this.decline(false);
        else this.realization=this.lemma;
    case "C": case "P": case "Q":
        if(this.realization===null)this.realization=this.lemma;
        break;
    case "D": case "Pro":
        if (this.tab!==null)this.realization=this.decline(true);
        break;
    case "V":
        if (this.tab!==null)this.realization=this.conjugate();
        break;
    case "DT":
        this.realization=this.dateFormat(this.date,this.props["dOpt"]);
        break;
    case "NO":
        const opts=this.props["dOpt"];
        if (opts.nat==true){
            this.realization=this.numberToWord(this.value,this.lang,this.g);
        } else if (opts.ord==true){
            this.realization=this.numberToOrdinal(this.value,this.lang,this.g);
        } else if (opts.raw==false){
            this.realization=this.numberFormatter(this.value,opts.mprecision);
        } else { //opts.raw==true
            this.realization=this.value+"";
        }
        break;
    default:
         this.error("Terminal.real:"+this.constType+": not implemented");
    }
    return this.doFormat([this])
}


// produce the string form of a Terminal
Terminal.prototype.toSource = function(){
    // create the source of the Terminal
    let res=this.constType+"("+quote(this.lemma)+")";
    // add the options by calling super.toSource()
    res+=Constituent.prototype.toSource.call(this); 
    return res;    
}

// functions for creating terminals
function N  (_){ return new Terminal(Array.from(arguments),"N") }
function A  (_){ return new Terminal(Array.from(arguments),"A") }
function Pro(_){ return new Terminal(Array.from(arguments),"Pro") }
function D  (_){ return new Terminal(Array.from(arguments),"D") }
function V  (_){ return new Terminal(Array.from(arguments),"V") }
function Adv(_){ return new Terminal(Array.from(arguments),"Adv") }
function C  (_){ return new Terminal(Array.from(arguments),"C") }
function P  (_){ return new Terminal(Array.from(arguments),"P") }
function DT (_){ return new Terminal(Array.from(arguments),"DT") }
function NO (_){ return new Terminal(Array.from(arguments),"NO") }
function Q  (_){ return new Terminal(Array.from(arguments),"Q") }

/**
    jsRealB 3.3
    Guy Lapalme, lapalme@iro.umontreal.ca, April 2020
 */
"use strict";

/// Functions for dealing with JSON input

// list of names of constituents (used in fromJSON)
const terminals = ["N", "A", "Pro", "D", "V", "Adv", "C", "P", "DT", "NO", "Q"];
const phrases   = ["S", "NP", "AP", "VP", "AdvP", "PP", "CP", "SP"];

// create expression from a JSON structure
function fromJSON(json,lang){
    if (typeof json == "object" && !Array.isArray(json)){
        if (json["lang"]){
            if (json["lang"]=="en")     lang="en";
            else if (json["lang"]=="fr")lang="fr";
            else {
                console.log("FromJSON: lang should be 'en' or 'fr', not "+json["lang"]+" 'en' will be used");
                lang="en";
            }
        }
        let lang1 = lang || currentLanguage ;
        if ("phrase" in json) {
            const constType=json["phrase"];
            if (contains(phrases,constType)){
                return Phrase.fromJSON(constType,json,lang1)
            } else {
                console.log("fromJSON: unknown Phrase type:"+constType)
            }
        } else if ("terminal" in json){
            const constType=json["terminal"];
            if (contains(terminals,constType)){
                return Terminal.fromJSON(constType,json,lang1)
            } else {
                console.log("fromJSON: unknown Terminal type:"+constType)
            }
        }
    } else {
        console.log("fromJSON: object expected, but found "+typeof json+":"+JSON.stringify(json))
    }
}

///  Create constituents from JSON
// add properties using the usual functions that test their input...
function setJSONprops(constituent,json){
    if ("props" in json){
        const props=json["props"];
        for (let opt in props){
            if (opt in Constituent.prototype){
                if (Array.isArray(props[opt])){ // deal with a list of options
                    props[opt].forEach(o=>Array.isArray(o)
                        ? Constituent.prototype[opt].apply(constituent,o)
                        : Constituent.prototype[opt].call(constituent,o))
                } else 
                    Constituent.prototype[opt].call(constituent,props[opt])
            } else {
                console.log("Terminal.fromJSON: illegal prop:"+opt);
            }
        }
    }
}


Phrase.fromJSON = function(constType,json,lang){
    if ("elements" in json){
        const elements=json["elements"];
        if (Array.isArray(elements)){
            const args=elements.map(json => fromJSON(json,lang));
            let phrase=new Phrase(args,constType);
            setJSONprops(phrase,json);
            return phrase;
        } else {
            console.log("Phrase.fromJSON: elements should be an array:"+JSON.stringify(json))
        }
    } else {
        console.log("Phrase.fromJSON: no elements found in "+JSON.stringify(json))
    }
}

Terminal.fromJSON = function(constType,json,lang){
    if ("lemma" in json){
        const lemma=json["lemma"];
        let terminal=new Terminal([lemma],constType,lang);
        setJSONprops(terminal,json)
        return terminal;
    } else {
        console.log("Terminal.fromJSON: no lemma found in "+JSON.stringify(json));
    }
}


// create the JSON form  
Phrase.prototype.toJSON = function(){
    let res={phrase:this.constType, elements:this.elements.map(e=>e.toJSON())};
    if (Object.keys(this.props).length>0) // do not output empty props
        res.props=this.props;
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

Terminal.prototype.toJSON = function(){
    let res={terminal:this.constType,lemma:this.lemma};
    if (Object.keys(this.props).length>0) // do not output empty props
        res.props=this.props;
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

// compact pretty-print of json (JSON.stringify(.,null,n) is hard to work with as it uses too many lines)
//  adaptation of ppJson.oy (in project json-rnc)
//  only useful for debugging, not necessary for using jsRealB
function ppJSON(obj,level,str){
    function out(s){str+=s}
    function outQuoted(s){
        if (s.indexOf('\\')>=0)s=s.replace(/\\/g,'\\\\');
        if (s.indexOf('"' )>=0)s=s.replace(/"/g,'\\"');
        out('"'+s+'"');
    }
    switch (arguments.length) {
    case 1:return ppJSON(obj,0,"");
    case 2:return ppJSON(obj,level,"");
    default:
        switch (typeof obj) {
        case "string":
            outQuoted(obj);
            break;
        case "object":
            if (obj===null){
                out("null")
            } else if (Array.isArray(obj)){
                out('[');
                const n=obj.length;
                // indent only if one of the elements of the array is an object != null 
                const indent = obj.some((e)=>typeof e == "object" && e!==null)
                for (var i = 1; i <= n; i++) {
                    const elem=obj[i-1];
                    if (indent && i>1)out("\n"+" ".repeat(level+1));
                    out(ppJSON(elem,level+1,""));
                    if (i<n)out(",")
                }
                out(']');
            } else {
                out('{');
                const keys=Object.keys(obj);
                const n=keys.length;
                for (var i = 1; i <= n; i++) {
                    const key=keys[i-1];
                    if (i>1)out("\n"+" ".repeat(level+1));
                    outQuoted(key);
                    out(":");
                    out(ppJSON(obj[key],level+1+key.length+3,""));
                    if (i<n)out(",")
                }
                out('}');
            }
            break;
        default: // primitive JavaScript values : boolean, number, string
            out(obj);
        }
    }
    return str;
}


/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";
///////// date formatting
// mainly rule based (should language independent)

function numberWithoutLeadingZero(n){return ""+n}
function numberWithLeadingZero(n){return (n<10?"0":"")+n}
function numberToMonth(n){return this.getRules().date.text.month[""+n]}
function numberToDay(n){return this.getRules().date.text.weekday[n]}
function numberToMeridiem(n){return this.getRules().date.text.meridiem[n<12?0:1]}
function numberTo12hour(n){return n%12}
// HACK: add to the standard Date prototype
Date.prototype.getRealMonth=function (){return this.getMonth()+1}

//// Based on format of strftime [linux]
var dateFormats = {
    Y:  { param: Date.prototype.getFullYear, func: numberWithoutLeadingZero },
    F:  { param: Date.prototype.getRealMonth,func: numberToMonth },
    M0: { param: Date.prototype.getRealMonth,func: numberWithLeadingZero },
    M:  { param: Date.prototype.getRealMonth,func: numberWithoutLeadingZero },
    d0: { param: Date.prototype.getDate,     func: numberWithLeadingZero },
    d:  { param: Date.prototype.getDate,     func: numberWithoutLeadingZero },
    l:  { param: Date.prototype.getDay,      func: numberToDay },
    A:  { param: Date.prototype.getHours,    func: numberToMeridiem },
    h:  { param: Date.prototype.getHours,    func: numberTo12hour },
    H0: { param: Date.prototype.getHours,    func: numberWithLeadingZero },
    H:  { param: Date.prototype.getHours,    func: numberWithoutLeadingZero },
    m0: { param: Date.prototype.getMinutes,  func: numberWithLeadingZero },
    m:  { param: Date.prototype.getMinutes,  func: numberWithoutLeadingZero },
    s0: { param: Date.prototype.getSeconds,  func: numberWithLeadingZero },
    s:  { param: Date.prototype.getSeconds,  func: numberWithoutLeadingZero },
    x:  { param: function(x){return x},      func: function(n){return ""+n} }
};
/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";
// https://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
// but this does not always work because ''+1.0 => "1" so nbDecimal(1.0)=>0
function nbDecimal(n) {
  var match = (''+n).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
};

function formatNumber(number, decimals, dec_point, thousands_sep) {
    // discuss at: http://phpjs.org/functions/number_format/
    // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    number = (number + '')
            .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousands_sep === 'undefined') ? '' : thousands_sep,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + (Math.round(n * k) / k)
                        .toFixed(prec);
            };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
            .split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
            .length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1)
                .join('0');
    }
    return s.join(dec);
};



//Fonctions pour la sortie en lettres:
//Fonction EnToutesLettres par Guy Lapalme , légèrement modifiée par Francis pour accomoder le genre

function enToutesLettres(s,lang){
    const en=lang=="en"
    const trace=false; // utile pour la mise au point

    // expressions des unités pour les "grands" nombres >1000 
    // expressions donnent les formes [{singulier, pluriel}...]
    //  noms de unités selon l'échelle courte présentée dans le Guide Antidote
    // elle diffère de celle présentée dans http://villemin.gerard.free.fr/TABLES/NbLettre.htm
    const unitesM=[ {sing:"mille"         ,plur:"mille"}        // 10^3
                   ,{sing:"un million"    ,plur:"millions"}     // 10^6
                   ,{sing:"un milliard"   ,plur:"milliards"}    // 10^9
                   ,{sing:"un trillion"   ,plur:"trillions"}    // 10^12
                   ,{sing:"un quatrillion",plur:"quatrillions"} // 10^15
                   ,{sing:"un quintillion",plur:"quintillions"} // 10^18
                ];
    const unitsM =[ {sing:"one thousand"      ,plur:"thousand"}    // 10^3
                   ,{sing:"one million"       ,plur:"million"}     // 10^6
                   ,{sing:"one billion"       ,plur:"billion"}     // 10^9
                   ,{sing:"one trillion"      ,plur:"trillion"}    // 10^12
                   ,{sing:"one quatrillion"   ,plur:"quatrillion"} // 10^15
                   ,{sing:"one quintillion"   ,plur:"quintillion"} // 10^18
                ];

    const maxLong=21;  // longueur d'une chaîne de chiffres traitable (fixé par la liste unitesM)

    // séparer une chaine en groupes de trois et complétant le premier groupe avec des 0 au début
    function splitS(s){
        if(s.length>3)
            return splitS(s.slice(0,s.length-3)).concat([s.slice(s.length-3)]);
        else if (s.length==1)s="00"+s;
        else if (s.length==2)s="0"+s
        return [s];
    }
    // est-ce que tous les triplets d'une liste correspondent à  0 ?
    function tousZero(ns){
        if(ns.length==0)return true;
        return (ns[0]=="000")&&tousZero(ns.slice(1));
    }

    // création d'une liste de triplets de chiffres
    function grouper(ns){ // ns est une liste de chaines de 3 chiffres
        const l=ns.length;
        if(trace)console.log("grouper:"+l+":"+ns);
        const head=ns[0];
        if(l==1)return centaines(head);
        const tail=ns.slice(1);
        if(head=="000")return grouper(tail);
        const uM=en?unitsM:unitesM;
        return (head=="001"?uM[l-2].sing:(grouper([head])+" "+uM[l-2].plur))+" "
               +(tousZero(tail)?"":grouper(tail));
    }

    // traiter un nombre entre 0 et 999
    function centaines(ns){ // ns est une chaine d'au plus trois chiffres
        if(trace)console.log("centaines:"+ns);
        if(ns.length==1)return unites(ns);
        if(ns.length==2)return dizaines(ns);
        const c=ns[0];        // centaines
        const du=ns.slice(1); // dizaines+unités
        if(c=="0") return dizaines(du);
        const cent=en?"hundred":"cent"
        if(du=="00"){
            if(c=="1") return (en?"one ":"")+cent;
            return unites(c)+" "+cent+(en?"":"s");
        }
        if(c=="1") return (en?"one ":"")+cent+" "+dizaines(du);
        return unites(c)+" "+cent+(en?" and ":" ")+dizaines(du);
    }

    // traiter un nombre entre 10 et 99
    function dizaines(ns){// ns est une chaine de deux chiffres
        if(trace)console.log("dizaines:",ns);
        const d=ns[0]; // dizaines
        const u=ns[1]; // unités
        switch  (d){
            case "0": return unites(u);
            case "1":
                return (en?["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"]
                          :["dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"])[+u];
            case "2": case "3": case "4": case "5": case "6":
                var tens = (en?["twenty","thirty","forty","fifty","sixty"]
                :["vingt","trente","quarante","cinquante","soixante"])[d-2];
                if (u==0) return tens;
                return tens + (u=="1" ? (en?"-one":" et un"): ("-"+unites(u)));
            case "7":
                if(u==0) return en?"seventy":"soixante-dix"
                return en?("seventy-"+unites(u)):("soixante-"+dizaines("1"+u));
            case "8":
                if(u==0) return en?"eighty":"quatre-vingts";
                return (en?"eighty-":"quatre-vingt-")+unites(u);
            case "9":
                if(u==0) return en?"ninety":"quatre-vingt-dix";
                return en?("ninety-"+unites(u)):("quatre-vingt-"+dizaines("1"+u));
        }
    }

    // traiter un chiffre entre 0 et 10
    function unites(u){ // u est une chaine d'un chiffre
        return (en?["zero","one","two","three","four","five","six","seven","eight","nine"]
                  :["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"])[+u];// conversion
    }
    
/// début de l'exécution de la fonction
    if(typeof s=="number")s=""+s; // convertir un nombre en chaîne
    if(!/^-?\d+$/.test(s))
        throw "nombreChaineEnLettres ne traite que des chiffres:"+s;
    let neg=false;
    if(s[0]=="-"){
        neg=true;
        s=s.slice(1);
    }
    if(s.length>maxLong)
        throw "nombreChaineEnLettres ne traite que les nombres d'au plus "+maxLong+" chiffres:"+s;
    return (neg?(en?"minus ":"moins "):"")+grouper(splitS(s)).trim();
}

// si l'orthographe française rectifiée est demandée, appliquer cette fonction à la sortie
// de enToutesLettres() pour mettre des tirets à la place des espaces partout dans le nombre...
function rectifiee(s){
    return s.replace(/ /g,"-");
}

// écriture des nombres ordinaux   //GL

// rules taken from https://www.ego4u.com/en/cram-up/vocabulary/numbers/ordinal
var ordEnExceptions={"one":"first","two":"second","three":"third","five":"fifth",
                 "eight":"eighth","nine":"ninth","twelve":"twelfth"}
// règles tirées de https://francais.lingolia.com/fr/vocabulaire/nombres-date-et-heure/les-nombres-ordinaux
var ordFrExceptions={"un":"premier","une":"première","cinq":"cinquième","neuf":"neuvième"}

function ordinal(s,lang,gender){
    const en = lang=="en";
    s=enToutesLettres(s,lang);
    if (s=="zéro" || s=="zero") return s;
    const m=/(.*?)(\w+)$/.exec(s)
    const lastWord=m[2]
    if (en) { 
        if (lastWord in ordEnExceptions)return m[1]+ordEnExceptions[lastWord]
        if (s.charAt(s.length-1)=="y") return s.substring(0,s.length-1)+"ieth"; // added from the reference
        return s+"th"
    } else {
        if (s == "un")return gender=="f"?"première":"premier";
        if (s.endsWith("et un")) return s+"ième";
        if (lastWord in ordFrExceptions) return m[1]+ordFrExceptions[lastWord];
        if (s.charAt(s.length-1)=="e" || s.endsWith("quatre-vingts")) return s.substring(0,s.length-1)+"ième";
        return s+"ième"
    }
}

/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";
// https://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
function extend(base, sub) {
    // Avoid instantiating the base class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite 
    // the existing prototype, but still maintain the inheritance chain
    const origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (let key in origProto) {
        sub.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    sub.prototype.constructor = sub;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like this instead
    Object.defineProperty(sub.prototype, 'constructor', {
        enumerable: false,
        value: sub
    });
}

// create a quoted string taking account possible escaping
function quote(s){
    if (typeof s != "string")return s;
    if (s.indexOf("'")<0)return "'"+s+"'"; // try with single quotes
    if (s.indexOf('"')<0)return '"'+s+'"'; // try with double quotes
    return '"'+s.replace('"','\\"')+'"';   // double quotes escaping double quotes 
}

// check if array contains an element
function contains(arr,elem){
    return arr.indexOf(elem)>=0;
}

function loadEn(trace,lenient){
    currentLanguage="en";
    if (trace===true)console.log("English lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implemented");
}

function loadFr(trace,lenient){
    currentLanguage="fr";
    if (trace===true)console.log("Règles et lexique français chargés");
    if (lenient==true)console.log("Le mode Lenient n'est pas implanté");
}

//// add to lexicon and return the updated object
///    to remove from lexicon (give null as newInfos)
var addToLexicon = function(lemma,newInfos,lang){
    let lexicon = getLexicon(lang)
    if (newInfos === null){ // remove key
        if (lexicon[lemma] !== undefined){
            delete lexicon[lemma]
        }
        return
    }
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    const infos=lexicon[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        for (var ni in newInfos) {
            infos[ni]=newInfos[ni]
        }
        lexicon[lemma]=infos
        return infos
    } else {
        lexicon[lemma]=newInfos
        return newInfos
    }
}

/// update current lexicon by "merging" the new lexicon with the current one
//     i.e. adding new key-value pairs and replacing existing key-value pairs with the new one
//     newLexicon is a single object with the "correct" structure
var updateLexicon = function(newLexicon,lang){
    let lexicon = getLexicon(lang);
    Object.assign(lexicon,newLexicon)
}

//// get lemma from lexicon (useful for debugging )
var getLemma = function(lemma,lang){
    return getLexicon(lang)[lemma];
}

// return the current realization language
var getLanguage = function(){
    return currentLanguage;
}

// return the current lexicon
var getLexicon = function(lang){
    if (lang===undefined)lang=currentLanguage;
    return lang=="fr"?lexiconFr:lexiconEn;    
}

//// select a random element in a list useful to have some variety in the generated text
//  if the first argument is a list, selection is done within the list
//  otherwise the selection is among the arguements 
//   (if the selected element is a function, evaluate it with no parameter)
var oneOf = function(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    const e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
}

// set the flag so that a warning generates an exception
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

// version and date informations
var jsRealB_version="3.5";
var jsRealB_dateCreated=new Date(); // might be changed by the makefile 
var lexiconEn = //========== lexicon-en.js
{" ":{"Pc":{"tab":["pc1"]}},
 "!":{"Pc":{"tab":["pc4"]}},
 "\"":{"Pc":{"compl":"\"",
            "tab":["pc5","pc6"]}},
 "'":{"Pc":{"compl":"'",
            "tab":["pc5","pc6"]}},
 "(":{"Pc":{"compl":")",
            "tab":["pc5"]}},
 ")":{"Pc":{"compl":"(",
            "tab":["pc6"]}},
 "*":{"Pc":{"compl":"*",
            "tab":["pc5","pc6"]}},
 ",":{"Pc":{"tab":["pc4"]}},
 "-":{"Pc":{"tab":["pc1"]}},
 ".":{"Pc":{"tab":["pc4"]}},
 "...":{"Pc":{"tab":["pc4"]}},
 ":":{"Pc":{"tab":["pc4"]}},
 ";":{"Pc":{"tab":["pc4"]}},
 "?":{"Pc":{"tab":["pc4"]}},
 "[":{"Pc":{"compl":"]",
            "tab":["pc5"]}},
 "]":{"Pc":{"compl":"[",
            "tab":["pc6"]}},
 "a":{"D":{"tab":["d1"]}},
 "abandon":{"V":{"tab":"v1"}},
 "abbey":{"N":{"tab":["n1"]}},
 "ability":{"N":{"tab":["n3"]}},
 "able":{"A":{"tab":["a2"]}},
 "abnormal":{"A":{"tab":["a1"]}},
 "abolish":{"V":{"tab":"v2"}},
 "abolition":{"N":{"tab":["n5"]}},
 "abortion":{"N":{"tab":["n1"]}},
 "about":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "above":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "abroad":{"Adv":{"tab":["b1"]}},
 "abruptly":{"Adv":{"tab":["b1"]}},
 "absence":{"N":{"tab":["n1"]}},
 "absent":{"A":{"tab":["a1"]}},
 "absolute":{"A":{"tab":["a1"]}},
 "absolutely":{"Adv":{"tab":["b1"]}},
 "absorb":{"V":{"tab":"v1"}},
 "absorption":{"N":{"tab":["n5"]}},
 "abstract":{"A":{"tab":["a1"]}},
 "absurd":{"A":{"tab":["a1"]}},
 "abuse":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "academic":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "academy":{"N":{"tab":["n3"]}},
 "accelerate":{"V":{"tab":"v3"}},
 "accent":{"N":{"tab":["n1"]}},
 "accept":{"V":{"tab":"v1"}},
 "acceptable":{"A":{"tab":["a1"]}},
 "acceptance":{"N":{"tab":["n5"]}},
 "access":{"N":{"tab":["n5"]},
           "V":{"tab":"v2"}},
 "accessible":{"A":{"tab":["a1"]}},
 "accident":{"N":{"tab":["n1"]}},
 "accommodate":{"V":{"tab":"v3"}},
 "accommodation":{"N":{"tab":["n1"]}},
 "accompany":{"V":{"tab":"v4"}},
 "accomplish":{"V":{"tab":"v2"}},
 "accord":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "accordance":{"N":{"tab":["n1"]}},
 "accordingly":{"Adv":{"tab":["b1"]}},
 "account":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "accountant":{"N":{"tab":["n1"]}},
 "accumulate":{"V":{"tab":"v3"}},
 "accumulation":{"N":{"tab":["n1"]}},
 "accuracy":{"N":{"tab":["n3"]}},
 "accurate":{"A":{"tab":["a1"]}},
 "accurately":{"Adv":{"tab":["b1"]}},
 "accusation":{"N":{"tab":["n1"]}},
 "accuse":{"V":{"tab":"v3"}},
 "achieve":{"V":{"tab":"v3"}},
 "achievement":{"N":{"tab":["n1"]}},
 "acid":{"N":{"tab":["n1"]}},
 "acknowledge":{"V":{"tab":"v3"}},
 "acquaintance":{"N":{"tab":["n1"]}},
 "acquire":{"V":{"tab":"v3"}},
 "acquisition":{"N":{"tab":["n1"]}},
 "acre":{"N":{"tab":["n1"]}},
 "across":{"Adv":{"tab":["b1"]},
           "P":{"tab":["pp"]}},
 "act":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "action":{"N":{"tab":["n1"]}},
 "activate":{"V":{"tab":"v3"}},
 "active":{"A":{"tab":["a1"]}},
 "actively":{"Adv":{"tab":["b1"]}},
 "activist":{"N":{"tab":["n1"]}},
 "activity":{"N":{"tab":["n3"]}},
 "actor":{"N":{"g":"x",
               "tab":["n85"]}},
 "actress":{"N":{"g":"f",
                 "tab":["n88"]}},
 "actual":{"A":{"tab":["a1"]}},
 "actually":{"Adv":{"tab":["b1"]}},
 "acute":{"A":{"tab":["a1"]}},
 "adapt":{"V":{"tab":"v1"}},
 "adaptation":{"N":{"tab":["n1"]}},
 "add":{"V":{"tab":"v1"}},
 "addition":{"N":{"tab":["n1"]}},
 "additional":{"A":{"tab":["a1"]}},
 "address":{"N":{"tab":["n2"]},
            "V":{"tab":"v2"}},
 "adequate":{"A":{"tab":["a1"]}},
 "adequately":{"Adv":{"tab":["b1"]}},
 "adjacent":{"A":{"tab":["a1"]}},
 "adjective":{"N":{"tab":["n1"]}},
 "adjust":{"V":{"tab":"v1"}},
 "adjustment":{"N":{"tab":["n1"]}},
 "administer":{"V":{"tab":"v1"}},
 "administration":{"N":{"tab":["n1"]}},
 "administrative":{"A":{"tab":["a1"]}},
 "administrator":{"N":{"g":"x",
                       "tab":["n1"]}},
 "admiration":{"N":{"tab":["n5"]}},
 "admire":{"V":{"tab":"v3"}},
 "admission":{"N":{"tab":["n1"]}},
 "admit":{"V":{"tab":"v14"}},
 "adopt":{"V":{"tab":"v1"}},
 "adoption":{"N":{"tab":["n1"]}},
 "adult":{"A":{"tab":["a1"]},
          "N":{"g":"x",
               "tab":["n1"]}},
 "advance":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "advanced":{"A":{"tab":["a1"]}},
 "advantage":{"N":{"tab":["n1"]}},
 "adventure":{"N":{"tab":["n1"]}},
 "adverse":{"A":{"tab":["a1"]}},
 "advertise":{"V":{"tab":"v3"}},
 "advertisement":{"N":{"tab":["n1"]}},
 "advice":{"N":{"tab":["n1"]}},
 "advise":{"V":{"tab":"v3"}},
 "adviser":{"N":{"g":"x",
                 "tab":["n1"]}},
 "advisory":{"A":{"tab":["a1"]}},
 "advocate":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "aesthetic":{"A":{"tab":["a1"]}},
 "affair":{"N":{"tab":["n1"]}},
 "affect":{"V":{"tab":"v1"}},
 "affection":{"N":{"tab":["n1"]}},
 "affinity":{"N":{"tab":["n3"]}},
 "afford":{"V":{"tab":"v1"}},
 "afraid":{"A":{"tab":["a1"]}},
 "after":{"C":{"tab":["cs"]},
          "P":{"tab":["pp"]}},
 "afternoon":{"N":{"tab":["n1"]}},
 "afterwards":{"Adv":{"tab":["b1"]}},
 "again":{"Adv":{"tab":["b1"]}},
 "against":{"P":{"tab":["pp"]}},
 "age":{"N":{"tab":["n1"]},
        "V":{"tab":"v72"}},
 "agency":{"N":{"tab":["n3"]}},
 "agenda":{"N":{"tab":["n1"]}},
 "agent":{"N":{"tab":["n1"]}},
 "aggression":{"N":{"tab":["n1"]}},
 "aggressive":{"A":{"tab":["a1"]}},
 "ago":{"Adv":{"tab":["b1"]}},
 "agony":{"N":{"tab":["n3"]}},
 "agree":{"V":{"tab":"v16"}},
 "agreement":{"N":{"tab":["n1"]}},
 "agricultural":{"A":{"tab":["a1"]}},
 "agriculture":{"N":{"tab":["n5"]}},
 "ahead":{"Adv":{"tab":["b1"]}},
 "aid":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "aim":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "air":{"N":{"tab":["n1"]}},
 "aircraft":{"N":{"tab":["n4"]}},
 "airline":{"N":{"tab":["n1"]}},
 "airport":{"N":{"tab":["n1"]}},
 "alarm":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "album":{"N":{"tab":["n1"]}},
 "alcohol":{"N":{"tab":["n1"]}},
 "alert":{"A":{"tab":["a1"]},
          "V":{"tab":"v1"}},
 "alien":{"A":{"tab":["a1"]}},
 "alike":{"Adv":{"tab":["b1"]}},
 "alive":{"A":{"tab":["a1"]}},
 "all":{"Adv":{"tab":["b1"]},
        "D":{"tab":["d4"]},
        "Pro":{"tab":["b1"]}},
 "allegation":{"N":{"tab":["n1"]}},
 "allege":{"V":{"tab":"v3"}},
 "allegedly":{"Adv":{"tab":["b1"]}},
 "alliance":{"N":{"tab":["n1"]}},
 "allocate":{"V":{"tab":"v3"}},
 "allocation":{"N":{"tab":["n1"]}},
 "allow":{"V":{"tab":"v1"}},
 "allowance":{"N":{"tab":["n1"]}},
 "allowed":{"A":{"tab":["a1"]}},
 "ally":{"N":{"tab":["n3"]}},
 "almost":{"Adv":{"tab":["b1"]}},
 "alone":{"A":{"tab":["a1"]},
          "Adv":{"tab":["b1"]}},
 "along":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "alongside":{"P":{"tab":["pp"]}},
 "aloud":{"Adv":{"tab":["b1"]}},
 "already":{"Adv":{"tab":["b1"]}},
 "alright":{"A":{"tab":["a1"]},
            "Adv":{"tab":["b1"]}},
 "also":{"Adv":{"tab":["b1"]}},
 "altar":{"N":{"tab":["n1"]}},
 "alter":{"V":{"tab":"v1"}},
 "alteration":{"N":{"tab":["n1"]}},
 "alternative":{"A":{"tab":["a1"]},
                "N":{"tab":["n1"]}},
 "alternatively":{"Adv":{"tab":["b1"]}},
 "altogether":{"Adv":{"tab":["b1"]}},
 "aluminium":{"N":{"tab":["n5"]}},
 "always":{"Adv":{"tab":["b1"]}},
 "amateur":{"N":{"tab":["n1"]}},
 "amazing":{"A":{"tab":["a1"]}},
 "ambassador":{"N":{"tab":["n1"]}},
 "ambiguity":{"N":{"tab":["n3"]}},
 "ambiguous":{"A":{"tab":["a1"]}},
 "ambition":{"N":{"tab":["n1"]}},
 "ambitious":{"A":{"tab":["a1"]}},
 "ambulance":{"N":{"tab":["n1"]}},
 "amend":{"V":{"tab":"v1"}},
 "amendment":{"N":{"tab":["n1"]}},
 "amid":{"P":{"tab":["pp"]}},
 "among":{"P":{"tab":["pp"]}},
 "amongst":{"P":{"tab":["pp"]}},
 "amount":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "amp":{"N":{"tab":["n1"]}},
 "ample":{"A":{"tab":["a2"]}},
 "amuse":{"V":{"tab":"v3"}},
 "amusement":{"N":{"tab":["n1"]}},
 "analogy":{"N":{"tab":["n3"]}},
 "analyse":{"V":{"tab":"v3"}},
 "analysis":{"N":{"tab":["n8"]}},
 "analyst":{"N":{"tab":["n1"]}},
 "ancestor":{"N":{"g":"x",
                  "tab":["n1"]}},
 "ancient":{"A":{"tab":["a1"]}},
 "and":{"C":{"tab":["cc"]}},
 "angel":{"N":{"tab":["n1"]}},
 "anger":{"N":{"tab":["n5"]},
          "V":{"tab":"v1"}},
 "angle":{"N":{"tab":["n1"]}},
 "angrily":{"Adv":{"tab":["b1"]}},
 "angry":{"A":{"tab":["a4"]}},
 "animal":{"N":{"tab":["n1"]}},
 "ankle":{"N":{"tab":["n1"]}},
 "anniversary":{"N":{"tab":["n3"]}},
 "announce":{"V":{"tab":"v3"}},
 "announcement":{"N":{"tab":["n1"]}},
 "annoy":{"V":{"tab":"v1"}},
 "annual":{"A":{"tab":["a1"]}},
 "annually":{"Adv":{"tab":["b1"]}},
 "anonymous":{"A":{"tab":["a1"]}},
 "another":{"D":{"tab":["d4"]},
            "Pro":{"tab":["pn5"]}},
 "answer":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "ant":{"N":{"tab":["n1"]}},
 "antibody":{"N":{"tab":["n3"]}},
 "anticipate":{"V":{"tab":"v3"}},
 "anticipation":{"N":{"tab":["n1"]}},
 "anxiety":{"N":{"tab":["n3"]}},
 "anxious":{"A":{"tab":["a1"]}},
 "anybody":{"Pro":{"tab":["pn5"]}},
 "anyone":{"Pro":{"tab":["pn5"]}},
 "anything":{"Pro":{"tab":["pn5"]}},
 "anyway":{"Adv":{"tab":["b1"]}},
 "anywhere":{"Adv":{"tab":["b1"]}},
 "apart":{"Adv":{"tab":["b1"]}},
 "apartment":{"N":{"tab":["n1"]}},
 "apology":{"N":{"tab":["n3"]}},
 "appalling":{"A":{"tab":["a1"]}},
 "apparatus":{"N":{"tab":["n2"]}},
 "apparent":{"A":{"tab":["a1"]}},
 "apparently":{"Adv":{"tab":["b1"]}},
 "appeal":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "appear":{"V":{"tab":"v1"}},
 "appearance":{"N":{"tab":["n1"]}},
 "appendix":{"N":{"tab":["n2"]}},
 "appetite":{"N":{"tab":["n1"]}},
 "apple":{"N":{"tab":["n1"]}},
 "applicable":{"A":{"tab":["a1"]}},
 "applicant":{"N":{"tab":["n1"]}},
 "application":{"N":{"tab":["n1"]}},
 "applied":{"A":{"tab":["a1"]}},
 "apply":{"V":{"tab":"v4"}},
 "appoint":{"V":{"tab":"v1"}},
 "appointment":{"N":{"tab":["n1"]}},
 "appraisal":{"N":{"tab":["n1"]}},
 "appreciate":{"V":{"tab":"v3"}},
 "appreciation":{"N":{"tab":["n1"]}},
 "approach":{"N":{"tab":["n2"]},
             "V":{"tab":"v2"}},
 "appropriate":{"A":{"tab":["a1"]}},
 "appropriately":{"Adv":{"tab":["b1"]}},
 "approval":{"N":{"tab":["n5"]}},
 "approve":{"V":{"tab":"v3"}},
 "approximately":{"Adv":{"tab":["b1"]}},
 "April":{"N":{"tab":["n1"]}},
 "aquarium":{"N":{"tab":["n1"]}},
 "arbitrary":{"A":{"tab":["a1"]}},
 "arc":{"N":{"tab":["n1"]}},
 "arch":{"N":{"tab":["n2"]}},
 "archaeological":{"A":{"tab":["a1"]}},
 "archbishop":{"N":{"tab":["n1"]}},
 "architect":{"N":{"tab":["n1"]}},
 "architectural":{"A":{"tab":["a1"]}},
 "architecture":{"N":{"tab":["n5"]}},
 "archive":{"N":{"tab":["n1"]}},
 "area":{"N":{"tab":["n1"]}},
 "arena":{"N":{"tab":["n1"]}},
 "argue":{"V":{"tab":"v3"}},
 "argument":{"N":{"tab":["n1"]}},
 "arise":{"V":{"tab":"v63"}},
 "arm":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "armchair":{"N":{"tab":["n1"]}},
 "army":{"N":{"tab":["n3"]}},
 "around":{"Adv":{"tab":["b1"]},
           "P":{"tab":["pp"]}},
 "arouse":{"V":{"tab":"v3"}},
 "arrange":{"V":{"tab":"v3"}},
 "arrangement":{"N":{"tab":["n1"]}},
 "array":{"N":{"tab":["n1"]}},
 "arrest":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "arrival":{"N":{"tab":["n1"]}},
 "arrive":{"V":{"tab":"v3"}},
 "arrow":{"N":{"tab":["n1"]}},
 "art":{"N":{"tab":["n1"]}},
 "article":{"N":{"tab":["n1"]}},
 "articulate":{"V":{"tab":"v3"}},
 "artificial":{"A":{"tab":["a1"]}},
 "artist":{"N":{"g":"x",
                "tab":["n1"]}},
 "artistic":{"A":{"tab":["a1"]}},
 "as":{"Adv":{"tab":["b1"]},
       "C":{"tab":["cs"]},
       "D":{"tab":["d4"]},
       "P":{"tab":["pp"]}},
 "ascertain":{"V":{"tab":"v1"}},
 "ash":{"N":{"tab":["n2"]}},
 "ashamed":{"A":{"tab":["a1"]}},
 "aside":{"Adv":{"tab":["b1"]}},
 "ask":{"V":{"tab":"v1"}},
 "asleep":{"A":{"tab":["a1"]}},
 "aspect":{"N":{"tab":["n1"]}},
 "aspiration":{"N":{"tab":["n1"]}},
 "assault":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "assemble":{"V":{"tab":"v3"}},
 "assembly":{"N":{"tab":["n3"]}},
 "assert":{"V":{"tab":"v1"}},
 "assertion":{"N":{"tab":["n1"]}},
 "assess":{"V":{"tab":"v2"}},
 "assessment":{"N":{"tab":["n1"]}},
 "asset":{"N":{"tab":["n1"]}},
 "assign":{"V":{"tab":"v1"}},
 "assignment":{"N":{"tab":["n1"]}},
 "assist":{"V":{"tab":"v1"}},
 "assistance":{"N":{"tab":["n5"]}},
 "assistant":{"N":{"g":"x",
                   "tab":["n1"]}},
 "associate":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "association":{"N":{"tab":["n1"]}},
 "assume":{"V":{"tab":"v3"}},
 "assumption":{"N":{"tab":["n1"]}},
 "assurance":{"N":{"tab":["n1"]}},
 "assure":{"V":{"tab":"v3"}},
 "astonishing":{"A":{"tab":["a1"]}},
 "asylum":{"N":{"tab":["n1"]}},
 "at":{"P":{"tab":["pp"]}},
 "athlete":{"N":{"g":"x",
                 "tab":["n1"]}},
 "atmosphere":{"N":{"tab":["n1"]}},
 "atom":{"N":{"tab":["n1"]}},
 "atomic":{"A":{"tab":["a1"]}},
 "attach":{"V":{"tab":"v2"}},
 "attachment":{"N":{"tab":["n1"]}},
 "attack":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "attacker":{"N":{"tab":["n1"]}},
 "attain":{"V":{"tab":"v1"}},
 "attainment":{"N":{"tab":["n1"]}},
 "attempt":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "attend":{"V":{"tab":"v1"}},
 "attendance":{"N":{"tab":["n1"]}},
 "attention":{"N":{"tab":["n1"]}},
 "attitude":{"N":{"tab":["n1"]}},
 "attract":{"V":{"tab":"v1"}},
 "attraction":{"N":{"tab":["n1"]}},
 "attractive":{"A":{"tab":["a1"]}},
 "attribute":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "auction":{"N":{"tab":["n1"]}},
 "audience":{"N":{"tab":["n1"]}},
 "audit":{"N":{"tab":["n1"]}},
 "auditor":{"N":{"tab":["n1"]}},
 "August":{"N":{"tab":["n1"]}},
 "aunt":{"N":{"g":"f",
              "tab":["n87"]}},
 "author":{"N":{"g":"x",
                "tab":["n85"]}},
 "authority":{"N":{"tab":["n3"]}},
 "automatic":{"A":{"tab":["a1"]}},
 "automatically":{"Adv":{"tab":["b1"]}},
 "autonomous":{"A":{"tab":["a1"]}},
 "autonomy":{"N":{"tab":["n3"]}},
 "autumn":{"N":{"tab":["n1"]}},
 "availability":{"N":{"tab":["n5"]}},
 "available":{"A":{"tab":["a1"]}},
 "avenue":{"N":{"tab":["n1"]}},
 "average":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "aviation":{"N":{"tab":["n5"]}},
 "avocado":{"N":{"tab":["n1"]}},
 "avoid":{"V":{"tab":"v1"}},
 "await":{"V":{"tab":"v1"}},
 "awake":{"A":{"tab":["a1"]},
          "V":{"tab":"v163"}},
 "award":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "aware":{"A":{"tab":["a1"]}},
 "awareness":{"N":{"tab":["n5"]}},
 "away":{"Adv":{"tab":["b1"]}},
 "awful":{"A":{"tab":["a1"]}},
 "awkward":{"A":{"tab":["a1"]}},
 "axis":{"N":{"tab":["n8"]}},
 "aye":{"N":{"tab":["n1"]}},
 "baby":{"N":{"g":"x",
              "tab":["n3"]}},
 "back":{"Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]},
         "P":{"tab":["pp"]},
         "V":{"tab":"v1"}},
 "background":{"N":{"tab":["n1"]}},
 "backing":{"N":{"tab":["n1"]}},
 "backwards":{"Adv":{"tab":["b1"]}},
 "bacon":{"N":{"tab":["n5"]}},
 "bad":{"A":{"tab":["a14"]}},
 "badly":{"Adv":{"tab":["b2"]}},
 "bag":{"N":{"tab":["n1"]}},
 "bail":{"N":{"tab":["n1"]}},
 "bake":{"V":{"tab":"v3"}},
 "balance":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "balcony":{"N":{"tab":["n3"]}},
 "ball":{"N":{"tab":["n1"]}},
 "ballet":{"N":{"tab":["n1"]}},
 "balloon":{"N":{"tab":["n1"]}},
 "ballot":{"N":{"tab":["n1"]}},
 "ban":{"N":{"tab":["n1"]},
        "V":{"tab":"v11"}},
 "banana":{"N":{"tab":["n1"]}},
 "band":{"N":{"tab":["n1"]}},
 "bang":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "bank":{"N":{"tab":["n1"]}},
 "banker":{"N":{"tab":["n1"]}},
 "banking":{"N":{"tab":["n5"]}},
 "bankruptcy":{"N":{"tab":["n3"]}},
 "banner":{"N":{"tab":["n1"]}},
 "bar":{"N":{"tab":["n1"]},
        "V":{"tab":"v13"}},
 "bare":{"A":{"tab":["a2"]}},
 "barely":{"Adv":{"tab":["b1"]}},
 "bargain":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "barn":{"N":{"tab":["n1"]}},
 "barrel":{"N":{"tab":["n1"]}},
 "barrier":{"N":{"tab":["n1"]}},
 "base":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "basement":{"N":{"tab":["n1"]}},
 "basic":{"A":{"tab":["a1"]}},
 "basically":{"Adv":{"tab":["b1"]}},
 "basin":{"N":{"tab":["n1"]}},
 "basis":{"N":{"tab":["n8"]}},
 "basket":{"N":{"tab":["n1"]}},
 "bass":{"N":{"tab":["n4"]}},
 "bastard":{"N":{"tab":["n1"]}},
 "bat":{"N":{"tab":["n1"]}},
 "batch":{"N":{"tab":["n2"]}},
 "bath":{"N":{"tab":["n1"]}},
 "bathroom":{"N":{"tab":["n1"]}},
 "battery":{"N":{"tab":["n3"]}},
 "battle":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "bay":{"N":{"tab":["n1"]}},
 "be":{"V":{"tab":"v151"}},
 "beach":{"N":{"tab":["n2"]}},
 "beam":{"N":{"tab":["n1"]}},
 "bean":{"N":{"tab":["n1"]}},
 "bear":{"N":{"tab":["n1"]},
         "V":{"tab":"v51"}},
 "beard":{"N":{"tab":["n1"]}},
 "bearing":{"N":{"tab":["n1"]}},
 "beast":{"N":{"tab":["n1"]}},
 "beat":{"N":{"tab":["n1"]},
         "V":{"tab":"v78"}},
 "beautiful":{"A":{"tab":["a1"]}},
 "beautifully":{"Adv":{"tab":["b1"]}},
 "beauty":{"N":{"tab":["n3"]}},
 "because":{"C":{"tab":["cs"]}},
 "become":{"V":{"tab":"v41"}},
 "bed":{"N":{"tab":["n1"]}},
 "bedroom":{"N":{"tab":["n1"]}},
 "bee":{"N":{"tab":["n1"]}},
 "beef":{"N":{"tab":["n9"]}},
 "beer":{"N":{"tab":["n1"]}},
 "before":{"Adv":{"tab":["b1"]},
           "C":{"tab":["cs"]},
           "P":{"tab":["pp"]}},
 "beg":{"V":{"tab":"v7"}},
 "begin":{"V":{"tab":"v106"}},
 "beginning":{"N":{"tab":["n1"]}},
 "behalf":{"N":{"tab":["n9"]}},
 "behave":{"V":{"tab":"v3"}},
 "behaviour":{"N":{"tab":["n5"]}},
 "behind":{"Adv":{"tab":["b1"]},
           "P":{"tab":["pp"]}},
 "being":{"N":{"tab":["n1"]}},
 "belief":{"N":{"tab":["n1"]}},
 "believe":{"V":{"tab":"v3"}},
 "bell":{"N":{"tab":["n1"]}},
 "belly":{"N":{"tab":["n3"]}},
 "belong":{"V":{"tab":"v1"}},
 "below":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "belt":{"N":{"tab":["n1"]}},
 "bench":{"N":{"tab":["n2"]}},
 "bend":{"N":{"tab":["n1"]},
         "V":{"tab":"v23"}},
 "beneath":{"P":{"tab":["pp"]}},
 "beneficial":{"A":{"tab":["a1"]}},
 "beneficiary":{"N":{"tab":["n3"]}},
 "benefit":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "berry":{"N":{"tab":["n3"]}},
 "beside":{"P":{"tab":["pp"]}},
 "besides":{"Adv":{"tab":["b1"]},
            "P":{"tab":["pp"]}},
 "bet":{"N":{"tab":["n1"]},
        "V":{"tab":"v38"}},
 "betray":{"V":{"tab":"v1"}},
 "between":{"P":{"tab":["pp"]}},
 "beyond":{"Adv":{"tab":["b1"]},
           "P":{"tab":["pp"]}},
 "bias":{"N":{"tab":["n2"]}},
 "bicycle":{"N":{"tab":["n1"]}},
 "bid":{"N":{"tab":["n1"]},
        "V":{"tab":"v117"}},
 "big":{"A":{"tab":["a7"]}},
 "bike":{"N":{"tab":["n1"]}},
 "bile":{"N":{"tab":["n5"]}},
 "bill":{"N":{"tab":["n1"]}},
 "bin":{"N":{"tab":["n1"]}},
 "bind":{"V":{"tab":"v25"}},
 "binding":{"A":{"tab":["a1"]}},
 "biography":{"N":{"tab":["n3"]}},
 "biological":{"A":{"tab":["a1"]}},
 "biology":{"N":{"tab":["n5"]}},
 "bird":{"N":{"tab":["n1"]}},
 "birth":{"N":{"tab":["n1"]}},
 "birthday":{"N":{"tab":["n1"]}},
 "biscuit":{"N":{"tab":["n1"]}},
 "bishop":{"N":{"tab":["n1"]}},
 "bit":{"N":{"tab":["n1"]}},
 "bitch":{"N":{"tab":["n2"]}},
 "bite":{"N":{"tab":["n1"]},
         "V":{"tab":"v74"}},
 "bitter":{"A":{"tab":["a1"]}},
 "bitterly":{"Adv":{"tab":["b1"]}},
 "bizarre":{"A":{"tab":["a1"]}},
 "black":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]}},
 "blade":{"N":{"tab":["n1"]}},
 "blame":{"N":{"tab":["n5"]},
          "V":{"tab":"v3"}},
 "blank":{"A":{"tab":["a1"]}},
 "blanket":{"N":{"tab":["n1"]}},
 "blast":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "bleak":{"A":{"tab":["a3"]}},
 "bleed":{"V":{"tab":"v22"}},
 "bless":{"V":{"tab":"v86"}},
 "blessing":{"N":{"tab":["n1"]}},
 "blind":{"A":{"tab":["a1"]}},
 "blink":{"V":{"tab":"v1"}},
 "block":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "bloke":{"N":{"tab":["n1"]}},
 "blonde":{"A":{"tab":["a1"]}},
 "blood":{"N":{"tab":["n1"]}},
 "bloody":{"A":{"tab":["a4"]},
           "Adv":{"tab":["b1"]}},
 "blow":{"N":{"tab":["n1"]},
         "V":{"tab":"v27"}},
 "blue":{"A":{"tab":["a2"]},
         "N":{"tab":["n1"]}},
 "board":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "boast":{"V":{"tab":"v1"}},
 "boat":{"N":{"tab":["n1"]}},
 "bodily":{"A":{"tab":["a1"]}},
 "body":{"N":{"tab":["n3"]}},
 "boil":{"V":{"tab":"v1"}},
 "boiler":{"N":{"tab":["n1"]}},
 "bold":{"A":{"tab":["a3"]}},
 "bolt":{"N":{"tab":["n1"]}},
 "bomb":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "bomber":{"N":{"tab":["n1"]}},
 "bond":{"N":{"tab":["n1"]}},
 "bone":{"N":{"tab":["n1"]}},
 "bonus":{"N":{"tab":["n2"]}},
 "book":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "booklet":{"N":{"tab":["n1"]}},
 "boom":{"N":{"tab":["n1"]}},
 "boost":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "boot":{"N":{"tab":["n1"]}},
 "border":{"N":{"tab":["n1"]}},
 "boring":{"A":{"tab":["a1"]}},
 "borough":{"N":{"tab":["n1"]}},
 "borrow":{"V":{"tab":"v1"}},
 "boss":{"N":{"tab":["n2"]}},
 "both":{"C":{"tab":["cc"]},
         "D":{"n":"p",
              "tab":["d4"]}},
 "bother":{"V":{"tab":"v1"}},
 "bottle":{"N":{"tab":["n1"]}},
 "bottom":{"N":{"tab":["n1"]}},
 "bounce":{"V":{"tab":"v3"}},
 "boundary":{"N":{"tab":["n3"]}},
 "bourgeois":{"A":{"tab":["a1"]}},
 "bow":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "bowel":{"N":{"tab":["n1"]}},
 "bowl":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "bowler":{"N":{"tab":["n1"]}},
 "box":{"N":{"tab":["n2"]}},
 "boxing":{"N":{"tab":["n5"]}},
 "boy":{"N":{"g":"m",
             "tab":["n85"]}},
 "boyfriend":{"N":{"tab":["n1"]}},
 "bracket":{"N":{"tab":["n1"]}},
 "brain":{"N":{"tab":["n1"]}},
 "brake":{"N":{"tab":["n1"]}},
 "branch":{"N":{"tab":["n2"]}},
 "brand":{"N":{"tab":["n1"]}},
 "brandy":{"N":{"tab":["n3"]}},
 "brass":{"N":{"tab":["n2"]}},
 "brave":{"A":{"tab":["a2"]}},
 "breach":{"N":{"tab":["n2"]}},
 "bread":{"N":{"tab":["n5"]}},
 "break":{"N":{"tab":["n1"]},
          "V":{"tab":"v138"}},
 "breakdown":{"N":{"tab":["n1"]}},
 "breakfast":{"N":{"tab":["n1"]}},
 "breast":{"N":{"tab":["n1"]}},
 "breath":{"N":{"tab":["n1"]}},
 "breathe":{"V":{"tab":"v3"}},
 "breed":{"N":{"tab":["n1"]},
          "V":{"tab":"v22"}},
 "breeding":{"N":{"tab":["n5"]}},
 "breeze":{"N":{"tab":["n1"]}},
 "brewery":{"N":{"tab":["n3"]}},
 "brick":{"N":{"tab":["n1"]}},
 "bride":{"N":{"g":"f",
               "tab":["n87"]}},
 "bridge":{"N":{"tab":["n1"]}},
 "brief":{"A":{"tab":["a3"]}},
 "briefly":{"Adv":{"tab":["b1"]}},
 "brigade":{"N":{"tab":["n1"]}},
 "bright":{"A":{"tab":["a3"]}},
 "brilliant":{"A":{"tab":["a1"]}},
 "bring":{"V":{"tab":"v103"}},
 "broad":{"A":{"tab":["a3"]}},
 "broadcast":{"N":{"tab":["n1"]},
              "V":{"tab":"v58"}},
 "broadly":{"Adv":{"tab":["b1"]}},
 "brochure":{"N":{"tab":["n1"]}},
 "broker":{"N":{"tab":["n1"]}},
 "bronze":{"N":{"tab":["n1"]}},
 "brother":{"N":{"g":"m",
                 "tab":["n85"]}},
 "brow":{"N":{"tab":["n1"]}},
 "brown":{"A":{"tab":["a3"]}},
 "brush":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "bubble":{"N":{"tab":["n1"]}},
 "bucket":{"N":{"tab":["n1"]}},
 "budget":{"N":{"tab":["n1"]}},
 "build":{"V":{"tab":"v23"}},
 "builder":{"N":{"tab":["n1"]}},
 "building":{"N":{"tab":["n1"]}},
 "bulb":{"N":{"tab":["n1"]}},
 "bulk":{"N":{"tab":["n5"]}},
 "bull":{"N":{"tab":["n1"]}},
 "bullet":{"N":{"tab":["n1"]}},
 "bulletin":{"N":{"tab":["n1"]}},
 "bump":{"V":{"tab":"v1"}},
 "bunch":{"N":{"tab":["n2"]}},
 "bundle":{"N":{"tab":["n1"]}},
 "burden":{"N":{"tab":["n1"]}},
 "bureau":{"N":{"tab":["n14"]}},
 "bureaucracy":{"N":{"tab":["n3"]}},
 "bureaucratic":{"A":{"tab":["a1"]}},
 "burial":{"N":{"tab":["n1"]}},
 "burn":{"N":{"tab":["n1"]},
         "V":{"tab":"v26"}},
 "burning":{"A":{"tab":["a1"]}},
 "burst":{"N":{"tab":["n1"]},
          "V":{"tab":"v18"}},
 "bury":{"V":{"tab":"v4"}},
 "bus":{"N":{"tab":["n2"]}},
 "bush":{"N":{"tab":["n2"]}},
 "business":{"N":{"tab":["n2"]}},
 "businessman":{"N":{"tab":["n7"]}},
 "busy":{"A":{"tab":["a4"]}},
 "but":{"Adv":{"tab":["b1"]},
        "C":{"tab":["cc"]}},
 "butter":{"N":{"tab":["n5"]}},
 "butterfly":{"N":{"tab":["n3"]}},
 "button":{"N":{"tab":["n1"]}},
 "buy":{"V":{"tab":"v59"}},
 "buyer":{"N":{"g":"x",
               "tab":["n1"]}},
 "by":{"P":{"tab":["pp"]}},
 "bye":{"N":{"tab":["n1"]}},
 "cab":{"N":{"tab":["n1"]}},
 "cabin":{"N":{"tab":["n1"]}},
 "cabinet":{"N":{"tab":["n1"]}},
 "cable":{"N":{"tab":["n1"]}},
 "cage":{"N":{"tab":["n1"]}},
 "cake":{"N":{"tab":["n1"]}},
 "calcium":{"N":{"tab":["n5"]}},
 "calculate":{"V":{"tab":"v3"}},
 "calculation":{"N":{"tab":["n1"]}},
 "calendar":{"N":{"tab":["n1"]}},
 "calf":{"N":{"tab":["n9"]}},
 "call":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "calm":{"A":{"tab":["a3"]},
         "N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "calorie":{"N":{"tab":["n1"]}},
 "camera":{"N":{"tab":["n1"]}},
 "camp":{"N":{"tab":["n1"]}},
 "campaign":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "can":{"N":{"tab":["n1"]},
        "V":{"tab":"v161"}},
 "canal":{"N":{"tab":["n1"]}},
 "cancel":{"V":{"tab":"v9"}},
 "cancer":{"N":{"tab":["n1"]}},
 "candidate":{"N":{"tab":["n1"]}},
 "candle":{"N":{"tab":["n1"]}},
 "canvas":{"N":{"tab":["n2"]}},
 "cap":{"N":{"tab":["n1"]}},
 "capability":{"N":{"tab":["n3"]}},
 "capable":{"A":{"tab":["a1"]}},
 "capacity":{"N":{"tab":["n3"]}},
 "capital":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "capitalism":{"N":{"tab":["n5"]}},
 "capitalist":{"N":{"tab":["n1"]}},
 "captain":{"N":{"g":"x",
                 "tab":["n1"]}},
 "capture":{"V":{"tab":"v3"}},
 "car":{"N":{"tab":["n1"]}},
 "caravan":{"N":{"tab":["n1"]}},
 "carbon":{"N":{"tab":["n1"]}},
 "card":{"N":{"tab":["n1"]}},
 "care":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "career":{"N":{"tab":["n1"]}},
 "careful":{"A":{"tab":["a1"]}},
 "carefully":{"Adv":{"tab":["b1"]}},
 "cargo":{"N":{"tab":["n2"]}},
 "carpet":{"N":{"tab":["n1"]}},
 "carriage":{"N":{"tab":["n1"]}},
 "carrier":{"N":{"tab":["n1"]}},
 "carrot":{"N":{"tab":["n1"]}},
 "carry":{"V":{"tab":"v4"}},
 "cart":{"N":{"tab":["n1"]}},
 "carve":{"V":{"tab":"v3"}},
 "case":{"N":{"tab":["n1"]}},
 "cash":{"N":{"tab":["n5"]}},
 "cassette":{"N":{"tab":["n1"]}},
 "cast":{"N":{"tab":["n1"]},
         "V":{"tab":"v18"}},
 "castle":{"N":{"tab":["n1"]}},
 "casual":{"A":{"tab":["a1"]}},
 "casualty":{"N":{"tab":["n3"]}},
 "cat":{"N":{"tab":["n1"]}},
 "catalogue":{"N":{"tab":["n1"]}},
 "catch":{"N":{"tab":["n2"]},
          "V":{"tab":"v84"}},
 "category":{"N":{"tab":["n3"]}},
 "cater":{"V":{"tab":"v1"}},
 "cathedral":{"N":{"tab":["n1"]}},
 "cattle":{"N":{"tab":["n6"]}},
 "causal":{"A":{"tab":["a1"]}},
 "cause":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "caution":{"N":{"tab":["n1"]}},
 "cautious":{"A":{"tab":["a1"]}},
 "cave":{"N":{"tab":["n1"]}},
 "cease":{"V":{"tab":"v3"}},
 "ceiling":{"N":{"tab":["n1"]}},
 "celebrate":{"V":{"tab":"v3"}},
 "celebration":{"N":{"tab":["n1"]}},
 "cell":{"N":{"tab":["n1"]}},
 "cellar":{"N":{"tab":["n1"]}},
 "cemetery":{"N":{"tab":["n3"]}},
 "census":{"N":{"tab":["n2"]}},
 "central":{"A":{"tab":["a1"]}},
 "centre":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "century":{"N":{"tab":["n3"]}},
 "cereal":{"N":{"tab":["n1"]}},
 "ceremony":{"N":{"tab":["n3"]}},
 "certain":{"A":{"tab":["a1"]}},
 "certainly":{"Adv":{"tab":["b1"]}},
 "certainty":{"N":{"tab":["n3"]}},
 "certificate":{"N":{"tab":["n1"]}},
 "chain":{"N":{"tab":["n1"]}},
 "chair":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "chairman":{"N":{"tab":["n7"]}},
 "chalk":{"N":{"tab":["n1"]}},
 "challenge":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "chamber":{"N":{"tab":["n1"]}},
 "champagne":{"N":{"tab":["n1"]}},
 "champion":{"N":{"tab":["n1"]}},
 "championship":{"N":{"tab":["n1"]}},
 "chance":{"N":{"tab":["n1"]}},
 "chancellor":{"N":{"tab":["n1"]}},
 "change":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "channel":{"N":{"tab":["n1"]}},
 "chaos":{"N":{"tab":["n5"]}},
 "chap":{"N":{"tab":["n1"]}},
 "chapel":{"N":{"tab":["n1"]}},
 "chapter":{"N":{"tab":["n1"]}},
 "character":{"N":{"tab":["n1"]}},
 "characteristic":{"A":{"tab":["a1"]}},
 "characterize":{"V":{"tab":"v3"}},
 "charge":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "charity":{"N":{"tab":["n3"]}},
 "charm":{"N":{"tab":["n1"]}},
 "charming":{"A":{"tab":["a1"]}},
 "chart":{"N":{"tab":["n1"]}},
 "charter":{"N":{"tab":["n1"]}},
 "chase":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "chat":{"N":{"tab":["n1"]},
         "V":{"tab":"v14"}},
 "cheap":{"A":{"tab":["a3"]}},
 "check":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "cheek":{"N":{"tab":["n1"]}},
 "cheer":{"V":{"tab":"v1"}},
 "cheerful":{"A":{"tab":["a1"]}},
 "cheese":{"N":{"tab":["n1"]}},
 "chemical":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "chemist":{"N":{"tab":["n1"]}},
 "chemistry":{"N":{"tab":["n5"]}},
 "cheque":{"N":{"tab":["n1"]}},
 "chest":{"N":{"tab":["n1"]}},
 "chew":{"V":{"tab":"v1"}},
 "chicken":{"N":{"tab":["n1"]}},
 "chief":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "child":{"N":{"g":"x",
               "tab":["n15"]}},
 "childhood":{"N":{"tab":["n5"]}},
 "chimney":{"N":{"tab":["n1"]}},
 "chin":{"N":{"tab":["n1"]}},
 "chip":{"N":{"tab":["n1"]}},
 "chocolate":{"N":{"tab":["n1"]}},
 "choice":{"N":{"tab":["n1"]}},
 "choir":{"N":{"tab":["n1"]}},
 "choke":{"V":{"tab":"v3"}},
 "choose":{"V":{"tab":"v93"}},
 "chop":{"V":{"tab":"v12"}},
 "chord":{"N":{"tab":["n1"]}},
 "chorus":{"N":{"tab":["n2"]}},
 "chronic":{"A":{"tab":["a1"]}},
 "church":{"N":{"tab":["n2"]}},
 "cigarette":{"N":{"tab":["n1"]}},
 "cinema":{"N":{"tab":["n1"]}},
 "circle":{"N":{"tab":["n1"]}},
 "circuit":{"N":{"tab":["n1"]}},
 "circular":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "circulate":{"V":{"tab":"v3"}},
 "circulation":{"N":{"tab":["n1"]}},
 "circumstance":{"N":{"tab":["n1"]}},
 "cite":{"V":{"tab":"v3"}},
 "citizen":{"N":{"g":"x",
                 "tab":["n1"]}},
 "citizenship":{"N":{"tab":["n1"]}},
 "city":{"N":{"tab":["n3"]}},
 "civic":{"A":{"tab":["a1"]}},
 "civil":{"A":{"tab":["a8"]}},
 "civilian":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "civilization":{"N":{"tab":["n1"]}},
 "claim":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "clarify":{"V":{"tab":"v4"}},
 "clarity":{"N":{"tab":["n5"]}},
 "clash":{"N":{"tab":["n2"]}},
 "class":{"N":{"tab":["n2"]}},
 "classic":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "classical":{"A":{"tab":["a1"]}},
 "classification":{"N":{"tab":["n1"]}},
 "classify":{"V":{"tab":"v4"}},
 "classroom":{"N":{"tab":["n1"]}},
 "clause":{"N":{"tab":["n1"]}},
 "clay":{"N":{"tab":["n5"]}},
 "clean":{"A":{"tab":["a3"]},
          "V":{"tab":"v1"}},
 "cleaner":{"N":{"tab":["n1"]}},
 "clear":{"A":{"tab":["a3"]},
          "V":{"tab":"v1"}},
 "clearance":{"N":{"tab":["n1"]}},
 "clearing":{"N":{"tab":["n1"]}},
 "clearly":{"Adv":{"tab":["b1"]}},
 "clergy":{"N":{"tab":["n3"]}},
 "clerical":{"A":{"tab":["a1"]}},
 "clerk":{"N":{"g":"x",
               "tab":["n1"]}},
 "clever":{"A":{"tab":["a3"]}},
 "client":{"N":{"tab":["n1"]}},
 "cliff":{"N":{"tab":["n1"]}},
 "climate":{"N":{"tab":["n1"]}},
 "climb":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "climber":{"N":{"tab":["n1"]}},
 "cling":{"V":{"tab":"v21"}},
 "clinic":{"N":{"tab":["n1"]}},
 "clinical":{"A":{"tab":["a1"]}},
 "clock":{"N":{"tab":["n1"]}},
 "close":{"A":{"tab":["a2"]},
          "Adv":{"tab":["b1"]},
          "V":{"tab":"v3"}},
 "closely":{"Adv":{"tab":["b1"]}},
 "closure":{"N":{"tab":["n1"]}},
 "cloth":{"N":{"tab":["n1"]}},
 "clothes":{"N":{"tab":["n6"]}},
 "clothing":{"N":{"tab":["n5"]}},
 "cloud":{"N":{"tab":["n1"]}},
 "club":{"N":{"tab":["n1"]}},
 "clue":{"N":{"tab":["n1"]}},
 "cluster":{"N":{"tab":["n1"]}},
 "clutch":{"V":{"tab":"v2"}},
 "co-operate":{"V":{"tab":"v3"}},
 "co-operation":{"N":{"tab":["n1"]}},
 "co-operative":{"A":{"tab":["a1"]}},
 "coach":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "coal":{"N":{"tab":["n1"]}},
 "coalition":{"N":{"tab":["n1"]}},
 "coast":{"N":{"tab":["n1"]}},
 "coastal":{"A":{"tab":["a1"]}},
 "coat":{"N":{"tab":["n1"]}},
 "code":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "coffee":{"N":{"tab":["n1"]}},
 "coffin":{"N":{"tab":["n1"]}},
 "coherent":{"A":{"tab":["a1"]}},
 "coin":{"N":{"tab":["n1"]}},
 "coincide":{"V":{"tab":"v3"}},
 "coincidence":{"N":{"tab":["n1"]}},
 "cold":{"A":{"tab":["a3"]},
         "N":{"tab":["n1"]}},
 "collaboration":{"N":{"tab":["n5"]}},
 "collapse":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "collar":{"N":{"tab":["n1"]}},
 "colleague":{"N":{"tab":["n1"]}},
 "collect":{"V":{"tab":"v1"}},
 "collection":{"N":{"tab":["n1"]}},
 "collective":{"A":{"tab":["a1"]}},
 "collector":{"N":{"tab":["n1"]}},
 "college":{"N":{"tab":["n1"]}},
 "colon":{"N":{"tab":["n1"]}},
 "colonel":{"N":{"tab":["n1"]}},
 "colonial":{"A":{"tab":["a1"]}},
 "colony":{"N":{"tab":["n3"]}},
 "colour":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "coloured":{"A":{"tab":["a1"]}},
 "colourful":{"A":{"tab":["a1"]}},
 "column":{"N":{"tab":["n1"]}},
 "combat":{"V":{"tab":"v1"}},
 "combination":{"N":{"tab":["n1"]}},
 "combine":{"V":{"tab":"v3"}},
 "come":{"V":{"tab":"v41"}},
 "comedy":{"N":{"tab":["n3"]}},
 "comfort":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "comfortable":{"A":{"tab":["a1"]}},
 "comfortably":{"Adv":{"tab":["b1"]}},
 "coming":{"A":{"tab":["a1"]}},
 "command":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "commander":{"N":{"tab":["n1"]}},
 "commence":{"V":{"tab":"v3"}},
 "comment":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "commentary":{"N":{"tab":["n3"]}},
 "commentator":{"N":{"tab":["n1"]}},
 "commerce":{"N":{"tab":["n5"]}},
 "commercial":{"A":{"tab":["a1"]}},
 "commission":{"N":{"tab":["n1"]},
               "V":{"tab":"v1"}},
 "commissioner":{"N":{"tab":["n1"]}},
 "commit":{"V":{"tab":"v14"}},
 "commitment":{"N":{"tab":["n1"]}},
 "committee":{"N":{"tab":["n1"]}},
 "commodity":{"N":{"tab":["n3"]}},
 "common":{"A":{"tab":["a3"]}},
 "commonly":{"Adv":{"tab":["b1"]}},
 "commons":{"N":{"tab":["n6"]}},
 "commonwealth":{"N":{"tab":["n1"]}},
 "communicate":{"V":{"tab":"v3"}},
 "communication":{"N":{"tab":["n1"]}},
 "communism":{"N":{"tab":["n5"]}},
 "communist":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "community":{"N":{"tab":["n3"]}},
 "compact":{"N":{"tab":["n1"]}},
 "companion":{"N":{"g":"x",
                   "tab":["n1"]}},
 "company":{"N":{"tab":["n3"]}},
 "comparable":{"A":{"tab":["a1"]}},
 "comparative":{"A":{"tab":["a1"]}},
 "comparatively":{"Adv":{"tab":["b1"]}},
 "compare":{"V":{"tab":"v3"}},
 "comparison":{"N":{"tab":["n1"]}},
 "compartment":{"N":{"tab":["n1"]}},
 "compatible":{"A":{"tab":["a1"]}},
 "compel":{"V":{"tab":"v9"}},
 "compensate":{"V":{"tab":"v3"}},
 "compensation":{"N":{"tab":["n1"]}},
 "compete":{"V":{"tab":"v3"}},
 "competence":{"N":{"tab":["n5"]}},
 "competent":{"A":{"tab":["a1"]}},
 "competition":{"N":{"tab":["n1"]}},
 "competitive":{"A":{"tab":["a1"]}},
 "competitor":{"N":{"tab":["n1"]}},
 "compile":{"V":{"tab":"v3"}},
 "complain":{"V":{"tab":"v1"}},
 "complaint":{"N":{"tab":["n1"]}},
 "complement":{"V":{"tab":"v1"}},
 "complementary":{"A":{"tab":["a1"]}},
 "complete":{"A":{"tab":["a1"]},
             "V":{"tab":"v3"}},
 "completely":{"Adv":{"tab":["b1"]}},
 "completion":{"N":{"tab":["n5"]}},
 "complex":{"A":{"tab":["a1"]},
            "N":{"tab":["n2"]}},
 "complexity":{"N":{"tab":["n3"]}},
 "compliance":{"N":{"tab":["n5"]}},
 "complicate":{"V":{"tab":"v3"}},
 "complicated":{"A":{"tab":["a1"]}},
 "complication":{"N":{"tab":["n1"]}},
 "comply":{"V":{"tab":"v4"}},
 "component":{"N":{"tab":["n1"]}},
 "compose":{"V":{"tab":"v3"}},
 "composer":{"N":{"tab":["n1"]}},
 "composition":{"N":{"tab":["n1"]}},
 "compound":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "comprehensive":{"A":{"tab":["a1"]}},
 "comprise":{"V":{"tab":"v3"}},
 "compromise":{"N":{"tab":["n1"]},
               "V":{"tab":"v3"}},
 "compulsory":{"A":{"tab":["a1"]}},
 "compute":{"V":{"tab":"v3"}},
 "computer":{"N":{"tab":["n1"]}},
 "conceal":{"V":{"tab":"v1"}},
 "concede":{"V":{"tab":"v3"}},
 "conceive":{"V":{"tab":"v3"}},
 "concentrate":{"V":{"tab":"v3"}},
 "concentration":{"N":{"tab":["n1"]}},
 "concept":{"N":{"tab":["n1"]}},
 "conception":{"N":{"tab":["n1"]}},
 "concern":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "concerned":{"A":{"tab":["a1"]}},
 "concerning":{"P":{"tab":["pp"]}},
 "concert":{"N":{"tab":["n1"]}},
 "concession":{"N":{"tab":["n1"]}},
 "conclude":{"V":{"tab":"v3"}},
 "conclusion":{"N":{"tab":["n1"]}},
 "concrete":{"A":{"tab":["a1"]},
             "N":{"tab":["n5"]}},
 "condemn":{"V":{"tab":"v1"}},
 "condition":{"N":{"tab":["n1"]}},
 "conduct":{"N":{"tab":["n5"]},
            "V":{"tab":"v1"}},
 "conductor":{"N":{"g":"m",
                   "tab":["n85"]}},
 "confer":{"V":{"tab":"v13"}},
 "conference":{"N":{"tab":["n1"]}},
 "confess":{"V":{"tab":"v2"}},
 "confession":{"N":{"tab":["n1"]}},
 "confidence":{"N":{"tab":["n1"]}},
 "confident":{"A":{"tab":["a1"]}},
 "confidential":{"A":{"tab":["a1"]}},
 "configuration":{"N":{"tab":["n1"]}},
 "confine":{"V":{"tab":"v3"}},
 "confirm":{"V":{"tab":"v1"}},
 "confirmation":{"N":{"tab":["n1"]}},
 "conflict":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "conform":{"V":{"tab":"v1"}},
 "confront":{"V":{"tab":"v1"}},
 "confrontation":{"N":{"tab":["n1"]}},
 "confuse":{"V":{"tab":"v3"}},
 "confusion":{"N":{"tab":["n5"]}},
 "congratulate":{"V":{"tab":"v3"}},
 "congregation":{"N":{"tab":["n1"]}},
 "congress":{"N":{"tab":["n2"]}},
 "conjunction":{"N":{"tab":["n1"]}},
 "connect":{"V":{"tab":"v1"}},
 "connection":{"N":{"tab":["n1"]}},
 "conscience":{"N":{"tab":["n1"]}},
 "conscious":{"A":{"tab":["a1"]}},
 "consciousness":{"N":{"tab":["n5"]}},
 "consensus":{"N":{"tab":["n2"]}},
 "consent":{"N":{"tab":["n5"]}},
 "consequence":{"N":{"tab":["n1"]}},
 "consequently":{"Adv":{"tab":["b1"]}},
 "conservation":{"N":{"tab":["n5"]}},
 "conservative":{"A":{"tab":["a1"]},
                 "N":{"tab":["n1"]}},
 "consider":{"V":{"tab":"v1"}},
 "considerable":{"A":{"tab":["a1"]}},
 "considerably":{"Adv":{"tab":["b1"]}},
 "consideration":{"N":{"tab":["n1"]}},
 "considering":{"P":{"tab":["pp"]}},
 "consist":{"V":{"tab":"v1"}},
 "consistency":{"N":{"tab":["n3"]}},
 "consistent":{"A":{"tab":["a1"]}},
 "consistently":{"Adv":{"tab":["b1"]}},
 "consolidate":{"V":{"tab":"v3"}},
 "consortium":{"N":{"tab":["n11"]}},
 "conspiracy":{"N":{"tab":["n3"]}},
 "constable":{"N":{"tab":["n1"]}},
 "constant":{"A":{"tab":["a1"]}},
 "constantly":{"Adv":{"tab":["b1"]}},
 "constituency":{"N":{"tab":["n3"]}},
 "constituent":{"N":{"tab":["n1"]}},
 "constitute":{"V":{"tab":"v3"}},
 "constitution":{"N":{"tab":["n1"]}},
 "constitutional":{"A":{"tab":["a1"]}},
 "constrain":{"V":{"tab":"v1"}},
 "constraint":{"N":{"tab":["n1"]}},
 "construct":{"V":{"tab":"v1"}},
 "construction":{"N":{"tab":["n1"]}},
 "constructive":{"A":{"tab":["a1"]}},
 "consult":{"V":{"tab":"v1"}},
 "consultant":{"N":{"g":"x",
                    "tab":["n1"]}},
 "consultation":{"N":{"tab":["n1"]}},
 "consume":{"V":{"tab":"v3"}},
 "consumer":{"N":{"tab":["n1"]}},
 "consumption":{"N":{"tab":["n5"]}},
 "contact":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "contain":{"V":{"tab":"v1"}},
 "container":{"N":{"tab":["n1"]}},
 "contemplate":{"V":{"tab":"v3"}},
 "contemporary":{"A":{"tab":["a1"]},
                 "N":{"tab":["n3"]}},
 "contempt":{"N":{"tab":["n5"]}},
 "contend":{"V":{"tab":"v1"}},
 "content":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "contest":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "context":{"N":{"tab":["n1"]}},
 "continent":{"N":{"tab":["n1"]}},
 "continental":{"A":{"tab":["a1"]}},
 "continually":{"Adv":{"tab":["b1"]}},
 "continuation":{"N":{"tab":["n1"]}},
 "continue":{"V":{"tab":"v3"}},
 "continuity":{"N":{"tab":["n5"]}},
 "continuous":{"A":{"tab":["a1"]}},
 "continuously":{"Adv":{"tab":["b1"]}},
 "contract":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "contraction":{"N":{"tab":["n1"]}},
 "contractor":{"N":{"tab":["n1"]}},
 "contractual":{"A":{"tab":["a1"]}},
 "contradiction":{"N":{"tab":["n1"]}},
 "contrary":{"A":{"tab":["a1"]},
             "N":{"tab":["n3"]}},
 "contrast":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "contribute":{"V":{"tab":"v3"}},
 "contribution":{"N":{"tab":["n1"]}},
 "control":{"N":{"tab":["n1"]},
            "V":{"tab":"v9"}},
 "controller":{"N":{"tab":["n1"]}},
 "controversial":{"A":{"tab":["a1"]}},
 "controversy":{"N":{"tab":["n3"]}},
 "convenience":{"N":{"tab":["n1"]}},
 "convenient":{"A":{"tab":["a1"]}},
 "convention":{"N":{"tab":["n1"]}},
 "conventional":{"A":{"tab":["a1"]}},
 "conversation":{"N":{"tab":["n1"]}},
 "conversely":{"Adv":{"tab":["b1"]}},
 "conversion":{"N":{"tab":["n1"]}},
 "convert":{"V":{"tab":"v1"}},
 "convey":{"V":{"tab":"v1"}},
 "convict":{"V":{"tab":"v1"}},
 "conviction":{"N":{"tab":["n1"]}},
 "convince":{"V":{"tab":"v3"}},
 "convincing":{"A":{"tab":["a1"]}},
 "cook":{"N":{"g":"x",
              "tab":["n1"]},
         "V":{"tab":"v1"}},
 "cooking":{"N":{"tab":["n5"]}},
 "cool":{"A":{"tab":["a3"]},
         "V":{"tab":"v1"}},
 "cooperation":{"N":{"tab":["n1"]}},
 "cop":{"V":{"tab":"v12"}},
 "cope":{"V":{"tab":"v3"}},
 "copper":{"N":{"tab":["n1"]}},
 "copy":{"N":{"tab":["n3"]},
         "V":{"tab":"v4"}},
 "copyright":{"N":{"tab":["n1"]}},
 "cord":{"N":{"tab":["n1"]}},
 "core":{"N":{"tab":["n1"]}},
 "corn":{"N":{"tab":["n1"]}},
 "corner":{"N":{"tab":["n1"]}},
 "corporate":{"A":{"tab":["a1"]}},
 "corps":{"N":{"tab":["n4"]}},
 "corpse":{"N":{"tab":["n1"]}},
 "correct":{"A":{"tab":["a1"]},
            "V":{"tab":"v1"}},
 "correction":{"N":{"tab":["n1"]}},
 "correctly":{"Adv":{"tab":["b1"]}},
 "correlation":{"N":{"tab":["n1"]}},
 "correspond":{"V":{"tab":"v1"}},
 "correspondence":{"N":{"tab":["n1"]}},
 "correspondent":{"N":{"tab":["n1"]}},
 "corresponding":{"A":{"tab":["a1"]}},
 "corridor":{"N":{"tab":["n1"]}},
 "corruption":{"N":{"tab":["n5"]}},
 "cost":{"N":{"tab":["n1"]},
         "V":{"tab":"v58"}},
 "costly":{"A":{"tab":["a4"]}},
 "costume":{"N":{"tab":["n1"]}},
 "cottage":{"N":{"tab":["n1"]}},
 "cotton":{"N":{"tab":["n5"]}},
 "cough":{"V":{"tab":"v1"}},
 "council":{"N":{"tab":["n1"]}},
 "councillor":{"N":{"tab":["n1"]}},
 "counsel":{"N":{"tab":["n5"]}},
 "counsellor":{"N":{"tab":["n1"]}},
 "count":{"N":{"g":"m",
               "tab":["n85"]},
          "V":{"tab":"v1"}},
 "counter":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "counterpart":{"N":{"tab":["n1"]}},
 "country":{"N":{"tab":["n3"]}},
 "countryside":{"N":{"tab":["n5"]}},
 "county":{"N":{"tab":["n3"]}},
 "coup":{"N":{"tab":["n1"]}},
 "couple":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "courage":{"N":{"tab":["n5"]}},
 "course":{"N":{"tab":["n1"]}},
 "court":{"N":{"tab":["n1"]}},
 "courtesy":{"N":{"tab":["n3"]}},
 "courtyard":{"N":{"tab":["n1"]}},
 "cousin":{"N":{"g":"x",
                "tab":["n1"]}},
 "covenant":{"N":{"tab":["n1"]}},
 "cover":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "coverage":{"N":{"tab":["n5"]}},
 "cow":{"N":{"tab":["n69"]}},
 "crack":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "craft":{"N":{"tab":["n1"]}},
 "craftsman":{"N":{"tab":["n7"]}},
 "crash":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "crawl":{"V":{"tab":"v1"}},
 "crazy":{"A":{"tab":["a4"]}},
 "cream":{"N":{"tab":["n1"]}},
 "create":{"V":{"tab":"v3"}},
 "creation":{"N":{"tab":["n1"]}},
 "creative":{"A":{"tab":["a1"]}},
 "creature":{"N":{"tab":["n1"]}},
 "credibility":{"N":{"tab":["n5"]}},
 "credit":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "creditor":{"N":{"tab":["n1"]}},
 "creed":{"N":{"tab":["n1"]}},
 "creep":{"V":{"tab":"v29"}},
 "crew":{"N":{"tab":["n1"]}},
 "cricket":{"N":{"tab":["n1"]}},
 "crime":{"N":{"tab":["n1"]}},
 "criminal":{"A":{"tab":["a1"]},
             "N":{"g":"x",
                  "tab":["n1"]}},
 "crisis":{"N":{"tab":["n8"]}},
 "criterion":{"N":{"tab":["n26"]}},
 "critic":{"N":{"tab":["n1"]}},
 "critical":{"A":{"tab":["a1"]}},
 "criticism":{"N":{"tab":["n1"]}},
 "criticize":{"V":{"tab":"v3"}},
 "critique":{"N":{"tab":["n1"]}},
 "crop":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "cross":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "crossing":{"N":{"tab":["n1"]}},
 "crouch":{"V":{"tab":"v2"}},
 "crowd":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "crown":{"N":{"tab":["n1"]}},
 "crucial":{"A":{"tab":["a1"]}},
 "crude":{"A":{"tab":["a2"]}},
 "cruel":{"A":{"tab":["a8"]}},
 "cruelty":{"N":{"tab":["n3"]}},
 "crush":{"V":{"tab":"v2"}},
 "cry":{"N":{"tab":["n3"]},
        "V":{"tab":"v4"}},
 "crystal":{"N":{"tab":["n1"]}},
 "cult":{"N":{"tab":["n1"]}},
 "cultivate":{"V":{"tab":"v3"}},
 "cultural":{"A":{"tab":["a1"]}},
 "culture":{"N":{"tab":["n1"]}},
 "cup":{"N":{"tab":["n1"]}},
 "cupboard":{"N":{"tab":["n1"]}},
 "cure":{"N":{"tab":["n1"]}},
 "curiosity":{"N":{"tab":["n3"]}},
 "curious":{"A":{"tab":["a1"]}},
 "curiously":{"Adv":{"tab":["b1"]}},
 "curl":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "currency":{"N":{"tab":["n3"]}},
 "current":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "currently":{"Adv":{"tab":["b1"]}},
 "curriculum":{"N":{"tab":["n1"]}},
 "curtain":{"N":{"tab":["n1"]}},
 "curve":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "cushion":{"N":{"tab":["n1"]}},
 "custody":{"N":{"tab":["n5"]}},
 "custom":{"N":{"tab":["n1"]}},
 "customer":{"N":{"g":"x",
                  "tab":["n1"]}},
 "cut":{"N":{"tab":["n1"]},
        "V":{"tab":"v17"}},
 "cutting":{"N":{"tab":["n1"]}},
 "cycle":{"N":{"tab":["n1"]}},
 "cylinder":{"N":{"tab":["n1"]}},
 "daily":{"A":{"tab":["a1"]},
          "Adv":{"tab":["b1"]}},
 "dairy":{"N":{"tab":["n3"]}},
 "damage":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "damn":{"V":{"tab":"v1"}},
 "damp":{"A":{"tab":["a3"]}},
 "dance":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "dancer":{"N":{"g":"x",
                "tab":["n1"]}},
 "dancing":{"N":{"tab":["n5"]}},
 "danger":{"N":{"tab":["n1"]}},
 "dangerous":{"A":{"tab":["a1"]}},
 "dare":{"V":{"tab":"v3"}},
 "dark":{"A":{"tab":["a3"]},
         "N":{"tab":["n5"]}},
 "darkness":{"N":{"tab":["n5"]}},
 "darling":{"N":{"g":"x",
                 "tab":["n1"]}},
 "dash":{"V":{"tab":"v2"}},
 "data":{"N":{"tab":["n4"]}},
 "date":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "daughter":{"N":{"g":"f",
                  "tab":["n87"]}},
 "dawn":{"N":{"tab":["n1"]}},
 "day":{"N":{"tab":["n1"]}},
 "daylight":{"N":{"tab":["n5"]}},
 "dead":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]}},
 "deadline":{"N":{"tab":["n1"]}},
 "deadly":{"A":{"tab":["a4"]}},
 "deaf":{"A":{"tab":["a3"]}},
 "deal":{"N":{"tab":["n1"]},
         "V":{"tab":"v55"}},
 "dealer":{"N":{"tab":["n1"]}},
 "dealing":{"N":{"tab":["n1"]}},
 "dear":{"A":{"tab":["a3"]},
         "N":{"g":"x",
              "tab":["n1"]}},
 "death":{"N":{"tab":["n1"]}},
 "debate":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "debt":{"N":{"tab":["n1"]}},
 "debtor":{"N":{"tab":["n1"]}},
 "debut":{"N":{"tab":["n1"]}},
 "decade":{"N":{"tab":["n1"]}},
 "decay":{"N":{"tab":["n5"]}},
 "December":{"N":{"tab":["n1"]}},
 "decent":{"A":{"tab":["a1"]}},
 "decide":{"V":{"tab":"v3"}},
 "decision":{"N":{"tab":["n1"]}},
 "decisive":{"A":{"tab":["a1"]}},
 "deck":{"N":{"tab":["n1"]}},
 "declaration":{"N":{"tab":["n1"]}},
 "declare":{"V":{"tab":"v3"}},
 "decline":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "decorate":{"V":{"tab":"v3"}},
 "decoration":{"N":{"tab":["n1"]}},
 "decorative":{"A":{"tab":["a1"]}},
 "decrease":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "decree":{"N":{"tab":["n1"]}},
 "dedicate":{"V":{"tab":"v3"}},
 "deed":{"N":{"tab":["n1"]}},
 "deem":{"V":{"tab":"v1"}},
 "deep":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]}},
 "deeply":{"Adv":{"tab":["b1"]}},
 "deer":{"N":{"tab":["n4"]}},
 "default":{"N":{"tab":["n5"]}},
 "defeat":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "defect":{"N":{"tab":["n1"]}},
 "defend":{"V":{"tab":"v1"}},
 "defendant":{"N":{"tab":["n1"]}},
 "defender":{"N":{"tab":["n1"]}},
 "defense":{"N":{"tab":["n1"]}},
 "defensive":{"A":{"tab":["a1"]}},
 "deficiency":{"N":{"tab":["n3"]}},
 "deficit":{"N":{"tab":["n1"]}},
 "define":{"V":{"tab":"v3"}},
 "definite":{"A":{"tab":["a1"]}},
 "definitely":{"Adv":{"tab":["b1"]}},
 "definition":{"N":{"tab":["n1"]}},
 "defy":{"V":{"tab":"v4"}},
 "degree":{"N":{"tab":["n1"]}},
 "delay":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "delegate":{"N":{"tab":["n1"]}},
 "delegation":{"N":{"tab":["n1"]}},
 "delete":{"V":{"tab":"v3"}},
 "deliberate":{"A":{"tab":["a1"]}},
 "deliberately":{"Adv":{"tab":["b1"]}},
 "delicate":{"A":{"tab":["a1"]}},
 "delicious":{"A":{"tab":["a1"]}},
 "delight":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "delightful":{"A":{"tab":["a1"]}},
 "deliver":{"V":{"tab":"v1"}},
 "delivery":{"N":{"tab":["n3"]}},
 "demand":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "democracy":{"N":{"tab":["n3"]}},
 "democrat":{"N":{"tab":["n1"]}},
 "democratic":{"A":{"tab":["a1"]}},
 "demolish":{"V":{"tab":"v2"}},
 "demonstrate":{"V":{"tab":"v3"}},
 "demonstration":{"N":{"tab":["n1"]}},
 "demonstrator":{"N":{"tab":["n1"]}},
 "denial":{"N":{"tab":["n1"]}},
 "denounce":{"V":{"tab":"v3"}},
 "dense":{"A":{"tab":["a2"]}},
 "density":{"N":{"tab":["n3"]}},
 "dentist":{"N":{"g":"x",
                 "tab":["n1"]}},
 "deny":{"V":{"tab":"v4"}},
 "depart":{"V":{"tab":"v1"}},
 "department":{"N":{"tab":["n1"]}},
 "departmental":{"A":{"tab":["a1"]}},
 "departure":{"N":{"tab":["n1"]}},
 "depend":{"V":{"tab":"v1"}},
 "dependence":{"N":{"tab":["n5"]}},
 "dependency":{"N":{"tab":["n3"]}},
 "dependent":{"A":{"tab":["a1"]}},
 "depict":{"V":{"tab":"v1"}},
 "deploy":{"V":{"tab":"v1"}},
 "deposit":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "depot":{"N":{"tab":["n1"]}},
 "depression":{"N":{"tab":["n1"]}},
 "deprivation":{"N":{"tab":["n1"]}},
 "deprive":{"V":{"tab":"v3"}},
 "depth":{"N":{"tab":["n1"]}},
 "deputy":{"N":{"tab":["n3"]}},
 "derive":{"V":{"tab":"v3"}},
 "descend":{"V":{"tab":"v1"}},
 "descent":{"N":{"tab":["n1"]}},
 "describe":{"V":{"tab":"v3"}},
 "description":{"N":{"tab":["n1"]}},
 "desert":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "deserve":{"V":{"tab":"v3"}},
 "design":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "designate":{"V":{"tab":"v3"}},
 "designer":{"N":{"tab":["n1"]}},
 "desirable":{"A":{"tab":["a1"]}},
 "desire":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "desk":{"N":{"tab":["n1"]}},
 "despair":{"N":{"tab":["n5"]}},
 "desperate":{"A":{"tab":["a1"]}},
 "desperately":{"Adv":{"tab":["b1"]}},
 "despite":{"P":{"tab":["pp"]}},
 "destination":{"N":{"tab":["n1"]}},
 "destiny":{"N":{"tab":["n3"]}},
 "destroy":{"V":{"tab":"v1"}},
 "destruction":{"N":{"tab":["n5"]}},
 "detail":{"N":{"tab":["n1"]}},
 "detain":{"V":{"tab":"v1"}},
 "detect":{"V":{"tab":"v1"}},
 "detection":{"N":{"tab":["n5"]}},
 "detective":{"N":{"tab":["n1"]}},
 "detector":{"N":{"tab":["n1"]}},
 "detention":{"N":{"tab":["n1"]}},
 "deter":{"V":{"tab":"v13"}},
 "deteriorate":{"V":{"tab":"v3"}},
 "determination":{"N":{"tab":["n5"]}},
 "determine":{"V":{"tab":"v3"}},
 "develop":{"V":{"tab":"v1"}},
 "developer":{"N":{"tab":["n1"]}},
 "development":{"N":{"tab":["n1"]}},
 "deviation":{"N":{"tab":["n1"]}},
 "device":{"N":{"tab":["n1"]}},
 "devil":{"N":{"tab":["n1"]}},
 "devise":{"V":{"tab":"v3"}},
 "devote":{"V":{"tab":"v3"}},
 "devoted":{"A":{"tab":["a1"]}},
 "diagnose":{"V":{"tab":"v3"}},
 "diagnosis":{"N":{"tab":["n8"]}},
 "diagram":{"N":{"tab":["n1"]}},
 "dialogue":{"N":{"tab":["n1"]}},
 "diameter":{"N":{"tab":["n1"]}},
 "diamond":{"N":{"tab":["n1"]}},
 "diary":{"N":{"tab":["n3"]}},
 "dictate":{"V":{"tab":"v3"}},
 "dictionary":{"N":{"tab":["n3"]}},
 "die":{"V":{"tab":"v28"}},
 "diet":{"N":{"tab":["n1"]}},
 "differ":{"V":{"tab":"v1"}},
 "difference":{"N":{"tab":["n1"]}},
 "different":{"A":{"tab":["a1"]}},
 "differential":{"A":{"tab":["a1"]}},
 "differentiate":{"V":{"tab":"v3"}},
 "differentiation":{"N":{"tab":["n1"]}},
 "differently":{"Adv":{"tab":["b1"]}},
 "difficult":{"A":{"tab":["a1"]}},
 "difficulty":{"N":{"tab":["n3"]}},
 "dig":{"V":{"tab":"v109"}},
 "digital":{"A":{"tab":["a1"]}},
 "dignity":{"N":{"tab":["n3"]}},
 "dilemma":{"N":{"tab":["n1"]}},
 "dimension":{"N":{"tab":["n1"]}},
 "diminish":{"V":{"tab":"v2"}},
 "dine":{"V":{"tab":"v3"}},
 "diner":{"N":{"g":"x",
               "tab":["n1"]}},
 "dinner":{"N":{"tab":["n1"]}},
 "dioxide":{"N":{"tab":["n1"]}},
 "dip":{"V":{"tab":"v12"}},
 "diplomat":{"N":{"tab":["n1"]}},
 "diplomatic":{"A":{"tab":["a1"]}},
 "direct":{"A":{"tab":["a1"]},
           "Adv":{"tab":["b1"]},
           "V":{"tab":"v1"}},
 "direction":{"N":{"tab":["n1"]}},
 "directive":{"N":{"tab":["n1"]}},
 "directly":{"Adv":{"tab":["b1"]}},
 "director":{"N":{"tab":["n1"]}},
 "directory":{"N":{"tab":["n3"]}},
 "dirt":{"N":{"tab":["n5"]}},
 "dirty":{"A":{"tab":["a4"]}},
 "disability":{"N":{"tab":["n3"]}},
 "disadvantage":{"N":{"tab":["n1"]}},
 "disagree":{"V":{"tab":"v16"}},
 "disagreement":{"N":{"tab":["n1"]}},
 "disappear":{"V":{"tab":"v1"}},
 "disappoint":{"V":{"tab":"v1"}},
 "disappointment":{"N":{"tab":["n1"]}},
 "disaster":{"N":{"tab":["n1"]}},
 "disastrous":{"A":{"tab":["a1"]}},
 "disc":{"N":{"tab":["n1"]}},
 "discard":{"V":{"tab":"v1"}},
 "discharge":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "disciplinary":{"A":{"tab":["a1"]}},
 "discipline":{"N":{"tab":["n1"]},
               "V":{"tab":"v3"}},
 "disclose":{"V":{"tab":"v3"}},
 "disclosure":{"N":{"tab":["n1"]}},
 "disco":{"N":{"tab":["n1"]}},
 "discount":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "discourage":{"V":{"tab":"v3"}},
 "discourse":{"N":{"tab":["n1"]}},
 "discover":{"V":{"tab":"v1"}},
 "discovery":{"N":{"tab":["n3"]}},
 "discretion":{"N":{"tab":["n5"]}},
 "discrimination":{"N":{"tab":["n5"]}},
 "discuss":{"V":{"tab":"v2"}},
 "discussion":{"N":{"tab":["n1"]}},
 "disease":{"N":{"tab":["n1"]}},
 "disguise":{"V":{"tab":"v3"}},
 "dish":{"N":{"tab":["n2"]}},
 "disk":{"N":{"tab":["n1"]}},
 "dislike":{"V":{"tab":"v3"}},
 "dismiss":{"V":{"tab":"v2"}},
 "dismissal":{"N":{"tab":["n1"]}},
 "disorder":{"N":{"tab":["n1"]}},
 "disperse":{"V":{"tab":"v3"}},
 "display":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "disposal":{"N":{"tab":["n5"]}},
 "dispose":{"V":{"tab":"v3"}},
 "disposition":{"N":{"tab":["n1"]}},
 "dispute":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "disrupt":{"V":{"tab":"v1"}},
 "disruption":{"N":{"tab":["n1"]}},
 "dissolve":{"V":{"tab":"v3"}},
 "distance":{"N":{"tab":["n1"]}},
 "distant":{"A":{"tab":["a1"]}},
 "distinct":{"A":{"tab":["a1"]}},
 "distinction":{"N":{"tab":["n1"]}},
 "distinctive":{"A":{"tab":["a1"]}},
 "distinctly":{"Adv":{"tab":["b1"]}},
 "distinguish":{"V":{"tab":"v2"}},
 "distinguished":{"A":{"tab":["a1"]}},
 "distort":{"V":{"tab":"v1"}},
 "distortion":{"N":{"tab":["n1"]}},
 "distract":{"V":{"tab":"v1"}},
 "distress":{"N":{"tab":["n5"]}},
 "distribute":{"V":{"tab":"v3"}},
 "distribution":{"N":{"tab":["n1"]}},
 "distributor":{"N":{"tab":["n1"]}},
 "district":{"N":{"tab":["n1"]}},
 "disturb":{"V":{"tab":"v1"}},
 "disturbance":{"N":{"tab":["n1"]}},
 "dive":{"V":{"tab":"v3"}},
 "diverse":{"A":{"tab":["a1"]}},
 "diversity":{"N":{"tab":["n5"]}},
 "divert":{"V":{"tab":"v1"}},
 "divide":{"V":{"tab":"v3"}},
 "dividend":{"N":{"tab":["n1"]}},
 "divine":{"A":{"tab":["a1"]}},
 "division":{"N":{"tab":["n1"]}},
 "divorce":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "do":{"V":{"tab":"v96"}},
 "dock":{"N":{"tab":["n1"]}},
 "doctor":{"N":{"g":"x",
                "tab":["n1"]}},
 "doctrine":{"N":{"tab":["n1"]}},
 "document":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "documentation":{"N":{"tab":["n5"]}},
 "dog":{"N":{"tab":["n1"]}},
 "doll":{"N":{"tab":["n1"]}},
 "dollar":{"N":{"tab":["n1"]}},
 "dolphin":{"N":{"tab":["n1"]}},
 "domain":{"N":{"tab":["n1"]}},
 "dome":{"N":{"tab":["n1"]}},
 "domestic":{"A":{"tab":["a1"]}},
 "dominance":{"N":{"tab":["n5"]}},
 "dominant":{"A":{"tab":["a1"]}},
 "dominate":{"V":{"tab":"v3"}},
 "domination":{"N":{"tab":["n5"]}},
 "donate":{"V":{"tab":"v3"}},
 "donation":{"N":{"tab":["n1"]}},
 "donor":{"N":{"tab":["n1"]}},
 "door":{"N":{"tab":["n1"]}},
 "doorway":{"N":{"tab":["n1"]}},
 "dose":{"N":{"tab":["n1"]}},
 "dot":{"N":{"tab":["n1"]}},
 "double":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "doubt":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "doubtful":{"A":{"tab":["a1"]}},
 "doubtless":{"Adv":{"tab":["b1"]}},
 "down":{"Adv":{"tab":["b1"]},
         "P":{"tab":["pp"]}},
 "downstairs":{"Adv":{"tab":["b1"]}},
 "dozen":{"N":{"tab":["n1"]}},
 "draft":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "drag":{"V":{"tab":"v7"}},
 "dragon":{"N":{"tab":["n1"]}},
 "drain":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "drainage":{"N":{"tab":["n5"]}},
 "drama":{"N":{"tab":["n1"]}},
 "dramatic":{"A":{"tab":["a1"]}},
 "dramatically":{"Adv":{"tab":["b1"]}},
 "draw":{"N":{"tab":["n1"]},
         "V":{"tab":"v54"}},
 "drawer":{"N":{"tab":["n1"]}},
 "drawing":{"N":{"tab":["n1"]}},
 "dreadful":{"A":{"tab":["a1"]}},
 "dream":{"N":{"tab":["n1"]},
          "V":{"tab":"v26"}},
 "dress":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "dressing":{"N":{"tab":["n1"]}},
 "drift":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "drill":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "drink":{"N":{"tab":["n1"]},
          "V":{"tab":"v65"}},
 "drive":{"N":{"tab":["n1"]},
          "V":{"tab":"v42"}},
 "driver":{"N":{"g":"x",
                "tab":["n1"]}},
 "drop":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "drown":{"V":{"tab":"v1"}},
 "drug":{"N":{"tab":["n1"]},
         "V":{"tab":"v7"}},
 "drum":{"N":{"tab":["n1"]}},
 "drunk":{"A":{"tab":["a3"]}},
 "dry":{"A":{"tab":["a4"]},
        "V":{"tab":"v4"}},
 "dual":{"A":{"tab":["a1"]}},
 "duck":{"N":{"tab":["n1"]}},
 "due":{"A":{"tab":["a1"]}},
 "duke":{"N":{"g":"m",
              "tab":["n85"]}},
 "dull":{"A":{"tab":["a3"]}},
 "duly":{"Adv":{"tab":["b1"]}},
 "dump":{"V":{"tab":"v1"}},
 "duration":{"N":{"tab":["n1"]}},
 "during":{"P":{"tab":["pp"]}},
 "dust":{"N":{"tab":["n5"]}},
 "duty":{"N":{"tab":["n3"]}},
 "dwelling":{"N":{"tab":["n1"]}},
 "dynamic":{"A":{"tab":["a1"]}},
 "eager":{"A":{"tab":["a1"]}},
 "eagle":{"N":{"tab":["n1"]}},
 "ear":{"N":{"tab":["n1"]}},
 "earl":{"N":{"tab":["n1"]}},
 "early":{"A":{"tab":["a4"]},
          "Adv":{"tab":["b1"]}},
 "earn":{"V":{"tab":"v1"}},
 "earth":{"N":{"tab":["n5"]}},
 "ease":{"N":{"tab":["n5"]},
         "V":{"tab":"v3"}},
 "easily":{"Adv":{"tab":["b1"]}},
 "east":{"N":{"tab":["n5"]}},
 "eastern":{"A":{"tab":["a1"]}},
 "easy":{"A":{"tab":["a4"]},
         "Adv":{"tab":["b1"]}},
 "eat":{"V":{"tab":"v70"}},
 "echo":{"N":{"tab":["n2"]},
         "V":{"tab":"v172"}},
 "economic":{"A":{"tab":["a1"]}},
 "economically":{"Adv":{"tab":["b1"]}},
 "economics":{"N":{"tab":["n5"]}},
 "economist":{"N":{"tab":["n1"]}},
 "economy":{"N":{"tab":["n3"]}},
 "edge":{"N":{"tab":["n1"]}},
 "edit":{"V":{"tab":"v1"}},
 "edition":{"N":{"tab":["n1"]}},
 "editor":{"N":{"tab":["n1"]}},
 "educate":{"V":{"tab":"v3"}},
 "education":{"N":{"tab":["n5"]}},
 "educational":{"A":{"tab":["a1"]}},
 "effect":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "effective":{"A":{"tab":["a1"]}},
 "effectively":{"Adv":{"tab":["b1"]}},
 "effectiveness":{"N":{"tab":["n5"]}},
 "efficiency":{"N":{"tab":["n5"]}},
 "efficient":{"A":{"tab":["a1"]}},
 "efficiently":{"Adv":{"tab":["b1"]}},
 "effort":{"N":{"tab":["n1"]}},
 "egg":{"N":{"tab":["n1"]}},
 "ego":{"N":{"tab":["n1"]}},
 "either":{"Adv":{"tab":["b1"]}},
 "elaborate":{"A":{"tab":["a1"]}},
 "elbow":{"N":{"tab":["n1"]}},
 "elder":{"N":{"tab":["n1"]}},
 "elderly":{"A":{"tab":["a1"]}},
 "elect":{"V":{"tab":"v1"}},
 "election":{"N":{"tab":["n1"]}},
 "electoral":{"A":{"tab":["a1"]}},
 "electorate":{"N":{"tab":["n1"]}},
 "electric":{"A":{"tab":["a1"]}},
 "electrical":{"A":{"tab":["a1"]}},
 "electricity":{"N":{"tab":["n5"]}},
 "electron":{"N":{"tab":["n1"]}},
 "electronic":{"A":{"tab":["a1"]}},
 "electronics":{"N":{"tab":["n5"]}},
 "elegant":{"A":{"tab":["a1"]}},
 "element":{"N":{"tab":["n1"]}},
 "elephant":{"N":{"tab":["n1"]}},
 "eligible":{"A":{"tab":["a1"]}},
 "eliminate":{"V":{"tab":"v3"}},
 "elite":{"N":{"tab":["n1"]}},
 "else":{"Adv":{"tab":["b1"]}},
 "elsewhere":{"Adv":{"tab":["b1"]}},
 "embark":{"V":{"tab":"v1"}},
 "embarrassing":{"A":{"tab":["a1"]}},
 "embarrassment":{"N":{"tab":["n1"]}},
 "embassy":{"N":{"tab":["n3"]}},
 "embody":{"V":{"tab":"v4"}},
 "embrace":{"V":{"tab":"v3"}},
 "embryo":{"N":{"tab":["n1"]}},
 "emerge":{"V":{"tab":"v3"}},
 "emergence":{"N":{"tab":["n5"]}},
 "emergency":{"N":{"tab":["n3"]}},
 "emission":{"N":{"tab":["n1"]}},
 "emotion":{"N":{"tab":["n1"]}},
 "emotional":{"A":{"tab":["a1"]}},
 "emperor":{"N":{"g":"m",
                 "tab":["n85"]}},
 "emphasis":{"N":{"tab":["n8"]}},
 "emphasize":{"V":{"tab":"v3"}},
 "empire":{"N":{"tab":["n1"]}},
 "empirical":{"A":{"tab":["a1"]}},
 "employ":{"V":{"tab":"v1"}},
 "employee":{"N":{"tab":["n1"]}},
 "employer":{"N":{"tab":["n1"]}},
 "employment":{"N":{"tab":["n5"]}},
 "empty":{"A":{"tab":["a4"]},
          "V":{"tab":"v4"}},
 "enable":{"V":{"tab":"v3"}},
 "enclose":{"V":{"tab":"v3"}},
 "encompass":{"V":{"tab":"v2"}},
 "encounter":{"N":{"tab":["n1"]},
              "V":{"tab":"v1"}},
 "encourage":{"V":{"tab":"v3"}},
 "encouragement":{"N":{"tab":["n1"]}},
 "end":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "ending":{"N":{"tab":["n1"]}},
 "endless":{"A":{"tab":["a1"]}},
 "endorse":{"V":{"tab":"v3"}},
 "endure":{"V":{"tab":"v3"}},
 "enemy":{"N":{"g":"x",
               "tab":["n3"]}},
 "energy":{"N":{"tab":["n3"]}},
 "enforce":{"V":{"tab":"v3"}},
 "enforcement":{"N":{"tab":["n5"]}},
 "engage":{"V":{"tab":"v3"}},
 "engagement":{"N":{"tab":["n1"]}},
 "engine":{"N":{"tab":["n1"]}},
 "engineer":{"N":{"tab":["n1"]}},
 "engineering":{"N":{"tab":["n5"]}},
 "enhance":{"V":{"tab":"v3"}},
 "enjoy":{"V":{"tab":"v1"}},
 "enjoyable":{"A":{"tab":["a1"]}},
 "enjoyment":{"N":{"tab":["n1"]}},
 "enormous":{"A":{"tab":["a1"]}},
 "enormously":{"Adv":{"tab":["b1"]}},
 "enough":{"Adv":{"tab":["b1"]}},
 "enquire":{"V":{"tab":"v3"}},
 "enquiry":{"N":{"tab":["n3"]}},
 "ensure":{"V":{"tab":"v3"}},
 "entail":{"V":{"tab":"v1"}},
 "enter":{"V":{"tab":"v1"}},
 "enterprise":{"N":{"tab":["n1"]}},
 "entertain":{"V":{"tab":"v1"}},
 "entertainment":{"N":{"tab":["n1"]}},
 "enthusiasm":{"N":{"tab":["n5"]}},
 "enthusiast":{"N":{"tab":["n1"]}},
 "enthusiastic":{"A":{"tab":["a1"]}},
 "entire":{"A":{"tab":["a1"]}},
 "entirely":{"Adv":{"tab":["b1"]}},
 "entitle":{"V":{"tab":"v3"}},
 "entitlement":{"N":{"tab":["n1"]}},
 "entity":{"N":{"tab":["n3"]}},
 "entrance":{"N":{"tab":["n1"]}},
 "entry":{"N":{"tab":["n3"]}},
 "envelope":{"N":{"tab":["n1"]}},
 "environment":{"N":{"tab":["n1"]}},
 "environmental":{"A":{"tab":["a1"]}},
 "envisage":{"V":{"tab":"v3"}},
 "enzyme":{"N":{"tab":["n1"]}},
 "episode":{"N":{"tab":["n1"]}},
 "equal":{"A":{"tab":["a1"]},
          "V":{"tab":"v9"}},
 "equality":{"N":{"tab":["n5"]}},
 "equally":{"Adv":{"tab":["b1"]}},
 "equation":{"N":{"tab":["n1"]}},
 "equilibrium":{"N":{"tab":["n5"]}},
 "equip":{"V":{"tab":"v12"}},
 "equipment":{"N":{"tab":["n5"]}},
 "equity":{"N":{"tab":["n3"]}},
 "equivalent":{"A":{"tab":["a1"]},
               "N":{"tab":["n1"]}},
 "era":{"N":{"tab":["n1"]}},
 "erect":{"V":{"tab":"v1"}},
 "erosion":{"N":{"tab":["n5"]}},
 "error":{"N":{"tab":["n1"]}},
 "escape":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "especially":{"Adv":{"tab":["b1"]}},
 "essay":{"N":{"tab":["n1"]}},
 "essence":{"N":{"tab":["n1"]}},
 "essential":{"A":{"tab":["a1"]}},
 "essentially":{"Adv":{"tab":["b1"]}},
 "establish":{"V":{"tab":"v2"}},
 "establishment":{"N":{"tab":["n1"]}},
 "estate":{"N":{"tab":["n1"]}},
 "estimate":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "eternal":{"A":{"tab":["a1"]}},
 "ethical":{"A":{"tab":["a1"]}},
 "ethics":{"N":{"tab":["n5"]}},
 "ethnic":{"A":{"tab":["a1"]}},
 "evaluate":{"V":{"tab":"v3"}},
 "evaluation":{"N":{"tab":["n1"]}},
 "even":{"Adv":{"tab":["b1"]}},
 "evening":{"N":{"tab":["n1"]}},
 "event":{"N":{"tab":["n1"]}},
 "eventual":{"A":{"tab":["a1"]}},
 "eventually":{"Adv":{"tab":["b1"]}},
 "ever":{"Adv":{"tab":["b1"]}},
 "everybody":{"Pro":{"tab":["pn5"]}},
 "everyday":{"A":{"tab":["a1"]}},
 "everyone":{"Pro":{"tab":["pn5"]}},
 "everything":{"Pro":{"tab":["pn5"]}},
 "everywhere":{"Adv":{"tab":["b1"]}},
 "evidence":{"N":{"tab":["n5"]}},
 "evident":{"A":{"tab":["a1"]}},
 "evidently":{"Adv":{"tab":["b1"]}},
 "evil":{"A":{"tab":["a1"]},
         "N":{"tab":["n1"]}},
 "evoke":{"V":{"tab":"v3"}},
 "evolution":{"N":{"tab":["n1"]}},
 "evolutionary":{"A":{"tab":["a1"]}},
 "evolve":{"V":{"tab":"v3"}},
 "exact":{"A":{"tab":["a1"]}},
 "exactly":{"Adv":{"tab":["b1"]}},
 "exaggerate":{"V":{"tab":"v3"}},
 "exam":{"N":{"tab":["n1"]}},
 "examination":{"N":{"tab":["n1"]}},
 "examine":{"V":{"tab":"v3"}},
 "example":{"N":{"tab":["n1"]}},
 "excavation":{"N":{"tab":["n1"]}},
 "exceed":{"V":{"tab":"v1"}},
 "excellent":{"A":{"tab":["a1"]}},
 "except":{"P":{"tab":["pp"]}},
 "exception":{"N":{"tab":["n1"]}},
 "exceptional":{"A":{"tab":["a1"]}},
 "exceptionally":{"Adv":{"tab":["b1"]}},
 "excess":{"A":{"tab":["a1"]},
           "N":{"tab":["n2"]}},
 "excessive":{"A":{"tab":["a1"]}},
 "exchange":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "excite":{"V":{"tab":"v3"}},
 "excitement":{"N":{"tab":["n1"]}},
 "exciting":{"A":{"tab":["a1"]}},
 "exclaim":{"V":{"tab":"v1"}},
 "exclude":{"V":{"tab":"v3"}},
 "exclusion":{"N":{"tab":["n1"]}},
 "exclusive":{"A":{"tab":["a1"]}},
 "exclusively":{"Adv":{"tab":["b1"]}},
 "excuse":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "execute":{"V":{"tab":"v3"}},
 "execution":{"N":{"tab":["n1"]}},
 "executive":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "exemption":{"N":{"tab":["n1"]}},
 "exercise":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "exert":{"V":{"tab":"v1"}},
 "exhaust":{"V":{"tab":"v1"}},
 "exhibit":{"V":{"tab":"v1"}},
 "exhibition":{"N":{"tab":["n1"]}},
 "exile":{"N":{"tab":["n1"]}},
 "exist":{"V":{"tab":"v1"}},
 "existence":{"N":{"tab":["n1"]}},
 "exit":{"N":{"tab":["n1"]}},
 "exotic":{"A":{"tab":["a1"]}},
 "expand":{"V":{"tab":"v1"}},
 "expansion":{"N":{"tab":["n5"]}},
 "expect":{"V":{"tab":"v1"}},
 "expectation":{"N":{"tab":["n1"]}},
 "expected":{"A":{"tab":["a1"]}},
 "expedition":{"N":{"tab":["n1"]}},
 "expel":{"V":{"tab":"v9"}},
 "expenditure":{"N":{"tab":["n1"]}},
 "expense":{"N":{"tab":["n1"]}},
 "expensive":{"A":{"tab":["a1"]}},
 "experience":{"N":{"tab":["n1"]},
               "V":{"tab":"v3"}},
 "experienced":{"A":{"tab":["a1"]}},
 "experiment":{"N":{"tab":["n1"]},
               "V":{"tab":"v1"}},
 "experimental":{"A":{"tab":["a1"]}},
 "expert":{"A":{"tab":["a1"]},
           "N":{"g":"x",
                "tab":["n1"]}},
 "expertise":{"N":{"tab":["n5"]}},
 "explain":{"V":{"tab":"v1"}},
 "explanation":{"N":{"tab":["n1"]}},
 "explicit":{"A":{"tab":["a1"]}},
 "explicitly":{"Adv":{"tab":["b1"]}},
 "explode":{"V":{"tab":"v3"}},
 "exploit":{"V":{"tab":"v1"}},
 "exploitation":{"N":{"tab":["n5"]}},
 "exploration":{"N":{"tab":["n1"]}},
 "explore":{"V":{"tab":"v3"}},
 "explosion":{"N":{"tab":["n1"]}},
 "export":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "expose":{"V":{"tab":"v3"}},
 "exposure":{"N":{"tab":["n1"]}},
 "express":{"A":{"tab":["a1"]},
            "V":{"tab":"v2"}},
 "expression":{"N":{"tab":["n1"]}},
 "extend":{"V":{"tab":"v1"}},
 "extension":{"N":{"tab":["n1"]}},
 "extensive":{"A":{"tab":["a1"]}},
 "extensively":{"Adv":{"tab":["b1"]}},
 "extent":{"N":{"tab":["n5"]}},
 "external":{"A":{"tab":["a1"]}},
 "extra":{"A":{"tab":["a1"]}},
 "extract":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "extraordinary":{"A":{"tab":["a1"]}},
 "extreme":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "extremely":{"Adv":{"tab":["b1"]}},
 "eye":{"N":{"tab":["n1"]}},
 "eyebrow":{"N":{"tab":["n1"]}},
 "fabric":{"N":{"tab":["n1"]}},
 "face":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "facilitate":{"V":{"tab":"v3"}},
 "facility":{"N":{"tab":["n3"]}},
 "fact":{"N":{"tab":["n1"]}},
 "faction":{"N":{"tab":["n1"]}},
 "factor":{"N":{"tab":["n1"]}},
 "factory":{"N":{"tab":["n3"]}},
 "faculty":{"N":{"tab":["n3"]}},
 "fade":{"V":{"tab":"v3"}},
 "fail":{"V":{"tab":"v1"}},
 "failure":{"N":{"tab":["n1"]}},
 "faint":{"A":{"tab":["a3"]}},
 "fair":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]}},
 "fairly":{"Adv":{"tab":["b1"]}},
 "fairy":{"N":{"tab":["n3"]}},
 "faith":{"N":{"tab":["n1"]}},
 "faithful":{"A":{"tab":["a1"]}},
 "fall":{"N":{"tab":["n1"]},
         "V":{"tab":"v76"}},
 "false":{"A":{"tab":["a1"]}},
 "fame":{"N":{"tab":["n5"]}},
 "familiar":{"A":{"tab":["a1"]}},
 "family":{"N":{"tab":["n3"]}},
 "famous":{"A":{"tab":["a1"]}},
 "fan":{"N":{"g":"x",
             "tab":["n1"]},
        "V":{"tab":"v11"}},
 "fancy":{"V":{"tab":"v4"}},
 "fantastic":{"A":{"tab":["a1"]}},
 "fantasy":{"N":{"tab":["n3"]}},
 "far":{"A":{"tab":["a17"]},
        "Adv":{"tab":["b4"]}},
 "fare":{"N":{"tab":["n1"]}},
 "farm":{"N":{"tab":["n1"]}},
 "farmer":{"N":{"g":"x",
                "tab":["n1"]}},
 "fascinate":{"V":{"tab":"v3"}},
 "fascinating":{"A":{"tab":["a1"]}},
 "fashion":{"N":{"tab":["n1"]}},
 "fashionable":{"A":{"tab":["a1"]}},
 "fast":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]}},
 "fat":{"A":{"tab":["a11"]},
        "N":{"tab":["n1"]}},
 "fatal":{"A":{"tab":["a1"]}},
 "fate":{"N":{"tab":["n1"]}},
 "father":{"N":{"g":"m",
                "tab":["n85"]}},
 "fault":{"N":{"tab":["n1"]}},
 "favour":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "favourable":{"A":{"tab":["a1"]}},
 "favourite":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "fear":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "feasible":{"A":{"tab":["a1"]}},
 "feast":{"N":{"tab":["n1"]}},
 "feather":{"N":{"tab":["n1"]}},
 "feature":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "February":{"N":{"tab":["n3"]}},
 "federal":{"A":{"tab":["a1"]}},
 "federation":{"N":{"tab":["n1"]}},
 "fee":{"N":{"tab":["n1"]}},
 "feed":{"N":{"tab":["n1"]},
         "V":{"tab":"v22"}},
 "feedback":{"N":{"tab":["n5"]}},
 "feel":{"N":{"tab":["n5"]},
         "V":{"tab":"v129"}},
 "feeling":{"N":{"tab":["n1"]}},
 "fellow":{"N":{"tab":["n1"]}},
 "female":{"A":{"tab":["a1"]},
           "N":{"g":"f",
                "tab":["n1"]}},
 "feminine":{"A":{"tab":["a1"]}},
 "feminist":{"N":{"tab":["n1"]}},
 "fence":{"N":{"tab":["n1"]}},
 "ferry":{"N":{"tab":["n3"]}},
 "fertility":{"N":{"tab":["n5"]}},
 "festival":{"N":{"tab":["n1"]}},
 "fetch":{"V":{"tab":"v2"}},
 "fever":{"N":{"tab":["n1"]}},
 "fibre":{"N":{"tab":["n1"]}},
 "fiction":{"N":{"tab":["n1"]}},
 "field":{"N":{"tab":["n1"]}},
 "fierce":{"A":{"tab":["a2"]}},
 "fiercely":{"Adv":{"tab":["b1"]}},
 "fig":{"N":{"tab":["n1"]}},
 "fight":{"N":{"tab":["n1"]},
          "V":{"tab":"v67"}},
 "fighter":{"N":{"tab":["n1"]}},
 "figure":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "file":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "fill":{"V":{"tab":"v1"}},
 "film":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "filter":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "final":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "finally":{"Adv":{"tab":["b1"]}},
 "finance":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "financial":{"A":{"tab":["a1"]}},
 "financially":{"Adv":{"tab":["b1"]}},
 "find":{"V":{"tab":"v25"}},
 "finding":{"N":{"tab":["n1"]}},
 "fine":{"A":{"tab":["a2"]},
         "N":{"tab":["n1"]}},
 "finger":{"N":{"tab":["n1"]}},
 "finish":{"N":{"tab":["n2"]},
           "V":{"tab":"v2"}},
 "fire":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "firm":{"A":{"tab":["a3"]},
         "N":{"tab":["n1"]}},
 "firmly":{"Adv":{"tab":["b1"]}},
 "firstly":{"Adv":{"tab":["b1"]}},
 "fiscal":{"A":{"tab":["a1"]}},
 "fish":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "fisherman":{"N":{"tab":["n7"]}},
 "fishing":{"N":{"tab":["n5"]}},
 "fist":{"N":{"tab":["n1"]}},
 "fit":{"A":{"tab":["a11"]},
        "N":{"tab":["n1"]},
        "V":{"tab":"v14"}},
 "fitness":{"N":{"tab":["n5"]}},
 "fitting":{"N":{"tab":["n1"]}},
 "fix":{"V":{"tab":"v2"}},
 "fixed":{"A":{"tab":["a1"]}},
 "fixture":{"N":{"tab":["n1"]}},
 "flag":{"N":{"tab":["n1"]}},
 "flame":{"N":{"tab":["n1"]}},
 "flash":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "flat":{"A":{"tab":["a11"]},
         "N":{"tab":["n1"]}},
 "flavour":{"N":{"tab":["n1"]}},
 "flee":{"V":{"tab":"v73"}},
 "fleet":{"N":{"tab":["n1"]}},
 "flesh":{"N":{"tab":["n5"]}},
 "flexibility":{"N":{"tab":["n5"]}},
 "flexible":{"A":{"tab":["a1"]}},
 "flick":{"V":{"tab":"v1"}},
 "flight":{"N":{"tab":["n1"]}},
 "fling":{"V":{"tab":"v21"}},
 "float":{"V":{"tab":"v1"}},
 "flock":{"N":{"tab":["n1"]}},
 "flood":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "floor":{"N":{"tab":["n1"]}},
 "flour":{"N":{"tab":["n5"]}},
 "flourish":{"V":{"tab":"v2"}},
 "flow":{"N":{"tab":["n5"]},
         "V":{"tab":"v1"}},
 "flower":{"N":{"tab":["n1"]}},
 "fluctuation":{"N":{"tab":["n1"]}},
 "fluid":{"N":{"tab":["n1"]}},
 "flush":{"V":{"tab":"v2"}},
 "fly":{"N":{"tab":["n3"]},
        "V":{"tab":"v80"}},
 "focus":{"N":{"tab":["n2"]},
          "V":{"tab":"v172"}},
 "fog":{"N":{"tab":["n1"]}},
 "fold":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "folk":{"N":{"tab":["n1"]}},
 "follow":{"V":{"tab":"v1"}},
 "follower":{"N":{"tab":["n1"]}},
 "following":{"A":{"tab":["a1"]}},
 "fond":{"A":{"tab":["a3"]}},
 "food":{"N":{"tab":["n1"]}},
 "fool":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "foolish":{"A":{"tab":["a1"]}},
 "foot":{"N":{"tab":["n19"]}},
 "football":{"N":{"tab":["n1"]}},
 "footstep":{"N":{"tab":["n1"]}},
 "for":{"C":{"tab":["cs"]},
        "P":{"tab":["pp"]}},
 "forbid":{"V":{"tab":"v118"}},
 "force":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "forecast":{"N":{"tab":["n1"]},
             "V":{"tab":"v58"}},
 "forehead":{"N":{"tab":["n1"]}},
 "foreign":{"A":{"tab":["a1"]}},
 "foreigner":{"N":{"g":"x",
                   "tab":["n1"]}},
 "forest":{"N":{"tab":["n1"]}},
 "forestry":{"N":{"tab":["n5"]}},
 "forever":{"Adv":{"tab":["b1"]}},
 "forge":{"V":{"tab":"v3"}},
 "forget":{"V":{"tab":"v125"}},
 "forgive":{"V":{"tab":"v43"}},
 "fork":{"N":{"tab":["n1"]}},
 "form":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "formal":{"A":{"tab":["a1"]}},
 "formally":{"Adv":{"tab":["b1"]}},
 "format":{"N":{"tab":["n1"]}},
 "formation":{"N":{"tab":["n1"]}},
 "formerly":{"Adv":{"tab":["b1"]}},
 "formidable":{"A":{"tab":["a1"]}},
 "formula":{"N":{"tab":["n1"]}},
 "formulate":{"V":{"tab":"v3"}},
 "formulation":{"N":{"tab":["n1"]}},
 "forth":{"Adv":{"tab":["b1"]}},
 "forthcoming":{"A":{"tab":["a1"]}},
 "fortnight":{"N":{"tab":["n1"]}},
 "fortunate":{"A":{"tab":["a1"]}},
 "fortunately":{"Adv":{"tab":["b1"]}},
 "fortune":{"N":{"tab":["n1"]}},
 "forum":{"N":{"tab":["n1"]}},
 "forward":{"A":{"tab":["a1"]},
            "Adv":{"tab":["b1"]}},
 "forwards":{"Adv":{"tab":["b1"]}},
 "fossil":{"N":{"tab":["n1"]}},
 "foster":{"V":{"tab":"v1"}},
 "found":{"V":{"tab":"v1"}},
 "foundation":{"N":{"tab":["n1"]}},
 "founder":{"N":{"tab":["n1"]}},
 "fountain":{"N":{"tab":["n1"]}},
 "fox":{"N":{"tab":["n2"]}},
 "fraction":{"N":{"tab":["n1"]}},
 "fragile":{"A":{"tab":["a1"]}},
 "fragment":{"N":{"tab":["n1"]}},
 "frame":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "framework":{"N":{"tab":["n1"]}},
 "franchise":{"N":{"tab":["n1"]}},
 "frankly":{"Adv":{"tab":["b1"]}},
 "fraud":{"N":{"tab":["n1"]}},
 "free":{"A":{"tab":["a2"]},
         "V":{"tab":"v16"}},
 "freedom":{"N":{"tab":["n1"]}},
 "freely":{"Adv":{"tab":["b1"]}},
 "freeze":{"V":{"tab":"v49"}},
 "freight":{"N":{"tab":["n5"]}},
 "frequency":{"N":{"tab":["n3"]}},
 "frequent":{"A":{"tab":["a1"]}},
 "frequently":{"Adv":{"tab":["b1"]}},
 "fresh":{"A":{"tab":["a3"]}},
 "Friday":{"N":{"tab":["n1"]}},
 "fridge":{"N":{"tab":["n1"]}},
 "friend":{"N":{"g":"x",
                "tab":["n1"]}},
 "friendly":{"A":{"tab":["a4"]}},
 "friendship":{"N":{"tab":["n1"]}},
 "frighten":{"V":{"tab":"v1"}},
 "frightened":{"A":{"tab":["a1"]}},
 "fringe":{"N":{"tab":["n1"]}},
 "frog":{"N":{"tab":["n1"]}},
 "from":{"P":{"tab":["pp"]}},
 "front":{"N":{"tab":["n1"]}},
 "frontier":{"N":{"tab":["n1"]}},
 "frown":{"V":{"tab":"v1"}},
 "fruit":{"N":{"tab":["n1"]}},
 "frustrate":{"V":{"tab":"v3"}},
 "frustration":{"N":{"tab":["n1"]}},
 "fuck":{"V":{"tab":"v1"}},
 "fucking":{"A":{"tab":["a1"]}},
 "fuel":{"N":{"tab":["n1"]}},
 "fulfill":{"V":{"tab":"v181"}},
 "full":{"A":{"tab":["a3"]}},
 "full-time":{"A":{"tab":["a1"]}},
 "fully":{"Adv":{"tab":["b1"]}},
 "fun":{"N":{"tab":["n5"]}},
 "function":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "functional":{"A":{"tab":["a1"]}},
 "fund":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "fundamental":{"A":{"tab":["a1"]}},
 "fundamentally":{"Adv":{"tab":["b1"]}},
 "funeral":{"N":{"tab":["n1"]}},
 "funny":{"A":{"tab":["a4"]}},
 "fur":{"N":{"tab":["n1"]}},
 "furious":{"A":{"tab":["a1"]}},
 "furnish":{"V":{"tab":"v2"}},
 "furniture":{"N":{"tab":["n5"]}},
 "furthermore":{"Adv":{"tab":["b1"]}},
 "fury":{"N":{"tab":["n3"]}},
 "fusion":{"N":{"tab":["n1"]}},
 "fuss":{"N":{"tab":["n2"]}},
 "future":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "gain":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "galaxy":{"N":{"tab":["n3"]}},
 "gall":{"N":{"tab":["n1"]}},
 "gallery":{"N":{"tab":["n3"]}},
 "gallon":{"N":{"tab":["n1"]}},
 "game":{"N":{"tab":["n1"]}},
 "gang":{"N":{"tab":["n1"]}},
 "gap":{"N":{"tab":["n1"]}},
 "garage":{"N":{"tab":["n1"]}},
 "garden":{"N":{"tab":["n1"]}},
 "gardener":{"N":{"g":"x",
                  "tab":["n1"]}},
 "garlic":{"N":{"tab":["n5"]}},
 "garment":{"N":{"tab":["n1"]}},
 "gas":{"N":{"tab":["n2"]}},
 "gasp":{"V":{"tab":"v1"}},
 "gastric":{"A":{"tab":["a1"]}},
 "gate":{"N":{"tab":["n1"]}},
 "gather":{"V":{"tab":"v1"}},
 "gathering":{"N":{"tab":["n1"]}},
 "gay":{"A":{"tab":["a3"]}},
 "gaze":{"N":{"tab":["n5"]},
         "V":{"tab":"v3"}},
 "gear":{"N":{"tab":["n1"]}},
 "gender":{"N":{"tab":["n1"]}},
 "gene":{"N":{"tab":["n1"]}},
 "general":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "generally":{"Adv":{"tab":["b1"]}},
 "generate":{"V":{"tab":"v3"}},
 "generation":{"N":{"tab":["n1"]}},
 "generous":{"A":{"tab":["a1"]}},
 "genetic":{"A":{"tab":["a1"]}},
 "genius":{"N":{"tab":["n2"]}},
 "gentle":{"A":{"tab":["a2"]}},
 "gentleman":{"N":{"g":"m",
                   "tab":["n7"]}},
 "gently":{"Adv":{"tab":["b1"]}},
 "genuine":{"A":{"tab":["a1"]}},
 "genuinely":{"Adv":{"tab":["b1"]}},
 "geographical":{"A":{"tab":["a1"]}},
 "geography":{"N":{"tab":["n5"]}},
 "geological":{"A":{"tab":["a1"]}},
 "gesture":{"N":{"tab":["n1"]}},
 "get":{"V":{"tab":"v125"}},
 "ghost":{"N":{"tab":["n1"]}},
 "giant":{"N":{"g":"x",
               "tab":["n1"]}},
 "gift":{"N":{"tab":["n1"]}},
 "gig":{"N":{"tab":["n1"]}},
 "girl":{"N":{"g":"f",
              "tab":["n87"]}},
 "girlfriend":{"N":{"tab":["n1"]}},
 "give":{"V":{"tab":"v43"}},
 "glad":{"A":{"tab":["a6"]}},
 "glance":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "glare":{"V":{"tab":"v3"}},
 "glass":{"N":{"tab":["n2"]}},
 "glimpse":{"N":{"tab":["n1"]}},
 "global":{"A":{"tab":["a1"]}},
 "gloom":{"N":{"tab":["n1"]}},
 "glorious":{"A":{"tab":["a1"]}},
 "glory":{"N":{"tab":["n3"]}},
 "glove":{"N":{"tab":["n1"]}},
 "glow":{"N":{"tab":["n5"]},
         "V":{"tab":"v1"}},
 "go":{"N":{"tab":["n2"]},
       "V":{"tab":"v122"}},
 "goal":{"N":{"tab":["n1"]}},
 "goalkeeper":{"N":{"tab":["n1"]}},
 "goat":{"N":{"tab":["n1"]}},
 "god":{"N":{"g":"m",
             "tab":["n85"]}},
 "gold":{"N":{"tab":["n5"]}},
 "golden":{"A":{"tab":["a1"]}},
 "golf":{"N":{"tab":["n5"]}},
 "good":{"A":{"tab":["a15"]},
         "N":{"tab":["n5"]}},
 "goodness":{"N":{"tab":["n5"]}},
 "gospel":{"N":{"tab":["n1"]}},
 "gossip":{"N":{"tab":["n1"]}},
 "govern":{"V":{"tab":"v1"}},
 "government":{"N":{"tab":["n1"]}},
 "governor":{"N":{"g":"x",
                  "tab":["n1"]}},
 "gown":{"N":{"tab":["n1"]}},
 "grab":{"V":{"tab":"v5"}},
 "grace":{"N":{"tab":["n1"]}},
 "grade":{"N":{"tab":["n1"]}},
 "gradual":{"A":{"tab":["a1"]}},
 "gradually":{"Adv":{"tab":["b1"]}},
 "graduate":{"N":{"g":"x",
                  "tab":["n1"]},
             "V":{"tab":"v3"}},
 "grain":{"N":{"tab":["n1"]}},
 "grammar":{"N":{"tab":["n1"]}},
 "grammatical":{"A":{"tab":["a1"]}},
 "grand":{"A":{"tab":["a3"]}},
 "grandfather":{"N":{"g":"m",
                     "tab":["n85"]}},
 "grandmother":{"N":{"g":"f",
                     "tab":["n87"]}},
 "grant":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "graph":{"N":{"tab":["n1"]}},
 "graphics":{"N":{"tab":["n5"]}},
 "grasp":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "grass":{"N":{"tab":["n2"]}},
 "grateful":{"A":{"tab":["a1"]}},
 "grave":{"A":{"tab":["a2"]},
          "N":{"tab":["n1"]}},
 "gravel":{"N":{"tab":["n5"]}},
 "gravity":{"N":{"tab":["n5"]}},
 "great":{"A":{"tab":["a3"]}},
 "greatly":{"Adv":{"tab":["b1"]}},
 "green":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]}},
 "greenhouse":{"N":{"tab":["n1"]}},
 "greet":{"V":{"tab":"v1"}},
 "greeting":{"N":{"tab":["n1"]}},
 "grey":{"A":{"tab":["a3"]}},
 "grid":{"N":{"tab":["n1"]}},
 "grief":{"N":{"tab":["n1"]}},
 "grim":{"A":{"tab":["a9"]}},
 "grin":{"N":{"tab":["n1"]},
         "V":{"tab":"v11"}},
 "grind":{"V":{"tab":"v25"}},
 "grip":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "groan":{"V":{"tab":"v1"}},
 "gross":{"A":{"tab":["a1"]}},
 "ground":{"N":{"tab":["n1"]}},
 "group":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "grow":{"V":{"tab":"v27"}},
 "growth":{"N":{"tab":["n1"]}},
 "guarantee":{"N":{"tab":["n1"]},
              "V":{"tab":"v16"}},
 "guard":{"N":{"g":"x",
               "tab":["n1"]},
          "V":{"tab":"v1"}},
 "guardian":{"N":{"g":"x",
                  "tab":["n1"]}},
 "guerrilla":{"N":{"tab":["n1"]}},
 "guess":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "guest":{"N":{"g":"x",
               "tab":["n1"]}},
 "guidance":{"N":{"tab":["n5"]}},
 "guide":{"N":{"g":"x",
               "tab":["n1"]},
          "V":{"tab":"v3"}},
 "guideline":{"N":{"tab":["n1"]}},
 "guild":{"N":{"tab":["n1"]}},
 "guilt":{"N":{"tab":["n5"]}},
 "guilty":{"A":{"tab":["a4"]}},
 "guitar":{"N":{"tab":["n1"]}},
 "gun":{"N":{"tab":["n1"]}},
 "gut":{"N":{"tab":["n1"]}},
 "guy":{"N":{"tab":["n1"]}},
 "habit":{"N":{"tab":["n1"]}},
 "habitat":{"N":{"tab":["n1"]}},
 "hair":{"N":{"tab":["n1"]}},
 "half":{"Adv":{"tab":["b1"]},
         "N":{"tab":["n9"]}},
 "hall":{"N":{"tab":["n1"]}},
 "halt":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "ham":{"N":{"tab":["n1"]}},
 "hammer":{"N":{"tab":["n1"]}},
 "hand":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "handful":{"N":{"tab":["n1"]}},
 "handicap":{"N":{"tab":["n1"]},
             "V":{"tab":"v12"}},
 "handle":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "handsome":{"A":{"tab":["a1"]}},
 "handy":{"A":{"tab":["a4"]}},
 "hang":{"V":{"tab":"v160"}},
 "happen":{"V":{"tab":"v1"}},
 "happily":{"Adv":{"tab":["b1"]}},
 "happiness":{"N":{"tab":["n5"]}},
 "happy":{"A":{"tab":["a4"]}},
 "harbour":{"N":{"tab":["n1"]}},
 "hard":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]}},
 "hardly":{"Adv":{"tab":["b1"]}},
 "hardship":{"N":{"tab":["n1"]}},
 "hardware":{"N":{"tab":["n5"]}},
 "harm":{"N":{"tab":["n5"]},
         "V":{"tab":"v1"}},
 "harmful":{"A":{"tab":["a1"]}},
 "harmony":{"N":{"tab":["n3"]}},
 "harsh":{"A":{"tab":["a3"]}},
 "harvest":{"N":{"tab":["n1"]}},
 "hastily":{"Adv":{"tab":["b1"]}},
 "hat":{"N":{"tab":["n1"]}},
 "hate":{"V":{"tab":"v3"}},
 "hatred":{"N":{"tab":["n1"]}},
 "haul":{"V":{"tab":"v1"}},
 "haunt":{"V":{"tab":"v1"}},
 "have":{"V":{"tab":"v83"}},
 "hay":{"N":{"tab":["n5"]}},
 "hazard":{"N":{"tab":["n1"]}},
 "head":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "heading":{"N":{"tab":["n1"]}},
 "headline":{"N":{"tab":["n1"]}},
 "headmaster":{"N":{"g":"x",
                    "tab":["n1"]}},
 "headquarters":{"N":{"tab":["n6"]}},
 "heal":{"V":{"tab":"v1"}},
 "health":{"N":{"tab":["n5"]}},
 "healthy":{"A":{"tab":["a4"]}},
 "heap":{"N":{"tab":["n1"]}},
 "hear":{"V":{"tab":"v16"}},
 "hearing":{"N":{"tab":["n1"]}},
 "heart":{"N":{"tab":["n1"]}},
 "heat":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "heating":{"N":{"tab":["n5"]}},
 "heaven":{"N":{"tab":["n1"]}},
 "heavily":{"Adv":{"tab":["b1"]}},
 "heavy":{"A":{"tab":["a4"]}},
 "hectare":{"N":{"tab":["n1"]}},
 "hedge":{"N":{"tab":["n1"]}},
 "heel":{"N":{"tab":["n1"]}},
 "height":{"N":{"tab":["n1"]}},
 "heir":{"N":{"g":"m",
              "hAn":1,
              "tab":["n85"]}},
 "helicopter":{"N":{"tab":["n1"]}},
 "hell":{"N":{"tab":["n1"]}},
 "helmet":{"N":{"tab":["n1"]}},
 "help":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "helpful":{"A":{"tab":["a1"]}},
 "helpless":{"A":{"tab":["a1"]}},
 "hemisphere":{"N":{"tab":["n1"]}},
 "hen":{"N":{"tab":["n1"]}},
 "hence":{"Adv":{"tab":["b1"]}},
 "herb":{"N":{"hAn":1,
              "tab":["n1"]}},
 "herd":{"N":{"tab":["n1"]}},
 "here":{"Adv":{"tab":["b1"]}},
 "heritage":{"N":{"tab":["n1"]}},
 "hero":{"N":{"g":"m",
              "tab":["n86"]}},
 "heroin":{"N":{"tab":["n5"]}},
 "hesitate":{"V":{"tab":"v3"}},
 "hide":{"V":{"tab":"v146"}},
 "hierarchy":{"N":{"tab":["n3"]}},
 "high":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]}},
 "highlight":{"N":{"tab":["n1"]},
              "V":{"tab":"v1"}},
 "highly":{"Adv":{"tab":["b1"]}},
 "highway":{"N":{"tab":["n1"]}},
 "hill":{"N":{"tab":["n1"]}},
 "hint":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "hip":{"N":{"tab":["n1"]}},
 "hire":{"N":{"tab":["n5"]},
         "V":{"tab":"v3"}},
 "historian":{"N":{"g":"x",
                   "tab":["n1"]}},
 "historic":{"A":{"tab":["a1"]}},
 "historical":{"A":{"tab":["a1"]}},
 "historically":{"Adv":{"tab":["b1"]}},
 "history":{"N":{"tab":["n3"]}},
 "hit":{"N":{"tab":["n1"]},
        "V":{"tab":"v17"}},
 "hitherto":{"Adv":{"tab":["b1"]}},
 "hobby":{"N":{"tab":["n3"]}},
 "hold":{"N":{"tab":["n1"]},
         "V":{"tab":"v34"}},
 "holder":{"N":{"tab":["n1"]}},
 "holding":{"N":{"tab":["n1"]}},
 "hole":{"N":{"tab":["n1"]}},
 "holiday":{"N":{"tab":["n1"]}},
 "holly":{"N":{"tab":["n5"]}},
 "holy":{"A":{"tab":["a4"]}},
 "home":{"Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]}},
 "homeless":{"A":{"tab":["a1"]}},
 "homework":{"N":{"tab":["n5"]}},
 "homosexual":{"A":{"tab":["a1"]}},
 "honest":{"A":{"hAn":1,
                "tab":["a1"]}},
 "honestly":{"Adv":{"tab":["b1"]}},
 "honey":{"N":{"tab":["n1"]}},
 "honour":{"N":{"hAn":1,
                "tab":["n1"]},
           "V":{"tab":"v1"}},
 "honourable":{"A":{"hAn":1,
                    "tab":["a1"]}},
 "hook":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "hope":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "hopefully":{"Adv":{"tab":["b1"]}},
 "horizon":{"N":{"tab":["n1"]}},
 "horizontal":{"A":{"tab":["a1"]}},
 "horn":{"N":{"tab":["n1"]}},
 "horrible":{"A":{"tab":["a1"]}},
 "horror":{"N":{"tab":["n1"]}},
 "horse":{"N":{"tab":["n1"]}},
 "hospital":{"N":{"tab":["n1"]}},
 "hospitality":{"N":{"tab":["n5"]}},
 "host":{"N":{"g":"m",
              "tab":["n85"]},
         "V":{"tab":"v1"}},
 "hostage":{"N":{"g":"x",
                 "tab":["n1"]}},
 "hostile":{"A":{"tab":["a1"]}},
 "hostility":{"N":{"tab":["n3"]}},
 "hot":{"A":{"tab":["a11"]}},
 "hotel":{"N":{"tab":["n1"]}},
 "hour":{"N":{"hAn":1,
              "tab":["n1"]}},
 "house":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "household":{"N":{"tab":["n1"]}},
 "housewife":{"N":{"tab":["n10"]}},
 "housing":{"N":{"tab":["n5"]}},
 "hover":{"V":{"tab":"v1"}},
 "how":{"Adv":{"tab":["b1"]},
        "Pro":{"tab":["pn6"]}},
 "however":{"Adv":{"tab":["b1"]}},
 "hug":{"V":{"tab":"v7"}},
 "huge":{"A":{"tab":["a1"]}},
 "human":{"A":{"tab":["a1"]},
          "N":{"g":"x",
               "tab":["n1"]}},
 "humanity":{"N":{"tab":["n5"]}},
 "humble":{"A":{"tab":["a2"]}},
 "humour":{"N":{"tab":["n1"]}},
 "hunger":{"N":{"tab":["n5"]}},
 "hungry":{"A":{"tab":["a4"]}},
 "hunt":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "hunter":{"N":{"g":"x",
                "tab":["n1"]}},
 "hunting":{"N":{"tab":["n5"]}},
 "hurry":{"N":{"tab":["n3"]},
          "V":{"tab":"v4"}},
 "hurt":{"V":{"tab":"v18"}},
 "husband":{"N":{"g":"m",
                 "tab":["n85"]}},
 "hut":{"N":{"tab":["n1"]}},
 "hydrogen":{"N":{"tab":["n5"]}},
 "hypothesis":{"N":{"tab":["n8"]}},
 "I":{"Pro":{"tab":["pn1"]}},
 "ice":{"N":{"tab":["n1"]}},
 "idea":{"N":{"tab":["n1"]}},
 "ideal":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "ideally":{"Adv":{"tab":["b1"]}},
 "identical":{"A":{"tab":["a1"]}},
 "identification":{"N":{"tab":["n5"]}},
 "identify":{"V":{"tab":"v4"}},
 "identity":{"N":{"tab":["n3"]}},
 "ideological":{"A":{"tab":["a1"]}},
 "ideology":{"N":{"tab":["n3"]}},
 "if":{"C":{"tab":["cs"]}},
 "ignorance":{"N":{"tab":["n5"]}},
 "ignore":{"V":{"tab":"v3"}},
 "ill":{"A":{"tab":["a1"]},
        "Adv":{"tab":["b1"]}},
 "illegal":{"A":{"tab":["a1"]}},
 "illness":{"N":{"tab":["n2"]}},
 "illuminate":{"V":{"tab":"v3"}},
 "illusion":{"N":{"tab":["n1"]}},
 "illustrate":{"V":{"tab":"v3"}},
 "illustration":{"N":{"tab":["n1"]}},
 "image":{"N":{"tab":["n1"]}},
 "imagination":{"N":{"tab":["n1"]}},
 "imaginative":{"A":{"tab":["a1"]}},
 "imagine":{"V":{"tab":"v3"}},
 "immediate":{"A":{"tab":["a1"]}},
 "immediately":{"Adv":{"tab":["b1"]}},
 "immense":{"A":{"tab":["a1"]}},
 "immigrant":{"N":{"g":"x",
                   "tab":["n1"]}},
 "immigration":{"N":{"tab":["n1"]}},
 "imminent":{"A":{"tab":["a1"]}},
 "immune":{"A":{"tab":["a1"]}},
 "impact":{"N":{"tab":["n1"]}},
 "imperial":{"A":{"tab":["a1"]}},
 "implement":{"V":{"tab":"v1"}},
 "implementation":{"N":{"tab":["n1"]}},
 "implication":{"N":{"tab":["n1"]}},
 "implicit":{"A":{"tab":["a1"]}},
 "imply":{"V":{"tab":"v4"}},
 "import":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "importance":{"N":{"tab":["n5"]}},
 "important":{"A":{"tab":["a1"]}},
 "importantly":{"Adv":{"tab":["b1"]}},
 "impose":{"V":{"tab":"v3"}},
 "impossible":{"A":{"tab":["a1"]}},
 "impress":{"V":{"tab":"v2"}},
 "impression":{"N":{"tab":["n1"]}},
 "impressive":{"A":{"tab":["a1"]}},
 "imprison":{"V":{"tab":"v1"}},
 "imprisonment":{"N":{"tab":["n5"]}},
 "improve":{"V":{"tab":"v3"}},
 "improvement":{"N":{"tab":["n1"]}},
 "impulse":{"N":{"tab":["n1"]}},
 "in":{"Adv":{"tab":["b1"]},
       "P":{"tab":["pp"]}},
 "inability":{"N":{"tab":["n5"]}},
 "inadequate":{"A":{"tab":["a1"]}},
 "inappropriate":{"A":{"tab":["a1"]}},
 "incapable":{"A":{"tab":["a1"]}},
 "incentive":{"N":{"tab":["n1"]}},
 "inch":{"N":{"tab":["n2"]}},
 "incidence":{"N":{"tab":["n1"]}},
 "incident":{"N":{"tab":["n1"]}},
 "incidentally":{"Adv":{"tab":["b1"]}},
 "include":{"V":{"tab":"v3"}},
 "inclusion":{"N":{"tab":["n5"]}},
 "income":{"N":{"tab":["n1"]}},
 "incorporate":{"V":{"tab":"v3"}},
 "increase":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "increasingly":{"Adv":{"tab":["b1"]}},
 "incredible":{"A":{"tab":["a1"]}},
 "incredibly":{"Adv":{"tab":["b1"]}},
 "incur":{"V":{"tab":"v13"}},
 "indeed":{"Adv":{"tab":["b1"]}},
 "independence":{"N":{"tab":["n5"]}},
 "independent":{"A":{"tab":["a1"]}},
 "independently":{"Adv":{"tab":["b1"]}},
 "index":{"N":{"tab":["n2"]}},
 "indicate":{"V":{"tab":"v3"}},
 "indication":{"N":{"tab":["n1"]}},
 "indicator":{"N":{"tab":["n1"]}},
 "indigenous":{"A":{"tab":["a1"]}},
 "indirect":{"A":{"tab":["a1"]}},
 "indirectly":{"Adv":{"tab":["b1"]}},
 "individual":{"A":{"tab":["a1"]},
               "N":{"tab":["n1"]}},
 "individually":{"Adv":{"tab":["b1"]}},
 "indoor":{"A":{"tab":["a1"]}},
 "induce":{"V":{"tab":"v3"}},
 "indulge":{"V":{"tab":"v3"}},
 "industrial":{"A":{"tab":["a1"]}},
 "industry":{"N":{"tab":["n3"]}},
 "inequality":{"N":{"tab":["n3"]}},
 "inevitable":{"A":{"tab":["a1"]}},
 "inevitably":{"Adv":{"tab":["b1"]}},
 "infant":{"N":{"g":"x",
                "tab":["n1"]}},
 "infect":{"V":{"tab":"v1"}},
 "infection":{"N":{"tab":["n1"]}},
 "infinite":{"A":{"tab":["a1"]}},
 "inflation":{"N":{"tab":["n5"]}},
 "inflict":{"V":{"tab":"v1"}},
 "influence":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "influential":{"A":{"tab":["a1"]}},
 "inform":{"V":{"tab":"v1"}},
 "informal":{"A":{"tab":["a1"]}},
 "information":{"N":{"tab":["n5"]}},
 "infrastructure":{"N":{"tab":["n1"]}},
 "ingredient":{"N":{"tab":["n1"]}},
 "inhabitant":{"N":{"tab":["n1"]}},
 "inherent":{"A":{"tab":["a1"]}},
 "inherit":{"V":{"tab":"v1"}},
 "inheritance":{"N":{"tab":["n1"]}},
 "inhibit":{"V":{"tab":"v1"}},
 "inhibition":{"N":{"tab":["n1"]}},
 "initial":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "initially":{"Adv":{"tab":["b1"]}},
 "initiate":{"V":{"tab":"v3"}},
 "initiative":{"N":{"tab":["n1"]}},
 "inject":{"V":{"tab":"v1"}},
 "injection":{"N":{"tab":["n1"]}},
 "injunction":{"N":{"tab":["n1"]}},
 "injure":{"V":{"tab":"v3"}},
 "injured":{"A":{"tab":["a1"]}},
 "injury":{"N":{"tab":["n3"]}},
 "inland":{"A":{"tab":["a1"]}},
 "inn":{"N":{"tab":["n1"]}},
 "inner":{"A":{"tab":["a1"]}},
 "innocence":{"N":{"tab":["n5"]}},
 "innocent":{"A":{"tab":["a1"]}},
 "innovation":{"N":{"tab":["n1"]}},
 "innovative":{"A":{"tab":["a1"]}},
 "input":{"N":{"tab":["n1"]}},
 "inquest":{"N":{"tab":["n1"]}},
 "inquiry":{"N":{"tab":["n3"]}},
 "insect":{"N":{"tab":["n1"]}},
 "insert":{"V":{"tab":"v1"}},
 "inside":{"Adv":{"tab":["b1"]},
           "N":{"tab":["n1"]},
           "P":{"tab":["pp"]}},
 "insider":{"N":{"tab":["n1"]}},
 "insight":{"N":{"tab":["n1"]}},
 "insist":{"V":{"tab":"v1"}},
 "insistence":{"N":{"tab":["n5"]}},
 "inspect":{"V":{"tab":"v1"}},
 "inspection":{"N":{"tab":["n1"]}},
 "inspector":{"N":{"tab":["n1"]}},
 "inspiration":{"N":{"tab":["n1"]}},
 "inspire":{"V":{"tab":"v3"}},
 "instal":{"V":{"tab":"v9"}},
 "install":{"V":{"tab":"v1"}},
 "installation":{"N":{"tab":["n1"]}},
 "instance":{"N":{"tab":["n1"]}},
 "instant":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "instantly":{"Adv":{"tab":["b1"]}},
 "instead":{"Adv":{"tab":["b1"]}},
 "instinct":{"N":{"tab":["n1"]}},
 "institute":{"N":{"tab":["n1"]}},
 "institution":{"N":{"tab":["n1"]}},
 "institutional":{"A":{"tab":["a1"]}},
 "instruct":{"V":{"tab":"v1"}},
 "instruction":{"N":{"tab":["n1"]}},
 "instructor":{"N":{"tab":["n1"]}},
 "instrument":{"N":{"tab":["n1"]}},
 "instrumental":{"A":{"tab":["a1"]}},
 "insufficient":{"A":{"tab":["a1"]}},
 "insurance":{"N":{"tab":["n1"]}},
 "insure":{"V":{"tab":"v3"}},
 "intact":{"A":{"tab":["a1"]}},
 "intake":{"N":{"tab":["n1"]}},
 "integral":{"A":{"tab":["a1"]}},
 "integrate":{"V":{"tab":"v3"}},
 "integration":{"N":{"tab":["n5"]}},
 "integrity":{"N":{"tab":["n5"]}},
 "intellectual":{"A":{"tab":["a1"]},
                 "N":{"tab":["n1"]}},
 "intelligence":{"N":{"tab":["n5"]}},
 "intelligent":{"A":{"tab":["a1"]}},
 "intend":{"V":{"tab":"v1"}},
 "intense":{"A":{"tab":["a1"]}},
 "intensify":{"V":{"tab":"v4"}},
 "intensity":{"N":{"tab":["n3"]}},
 "intensive":{"A":{"tab":["a1"]}},
 "intent":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "intention":{"N":{"tab":["n1"]}},
 "interaction":{"N":{"tab":["n1"]}},
 "interactive":{"A":{"tab":["a1"]}},
 "intercourse":{"N":{"tab":["n5"]}},
 "interest":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "interested":{"A":{"tab":["a1"]}},
 "interesting":{"A":{"tab":["a1"]}},
 "interface":{"N":{"tab":["n1"]}},
 "interfere":{"V":{"tab":"v3"}},
 "interference":{"N":{"tab":["n5"]}},
 "interior":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "intermediate":{"A":{"tab":["a1"]}},
 "internal":{"A":{"tab":["a1"]}},
 "international":{"A":{"tab":["a1"]}},
 "interpret":{"V":{"tab":"v1"}},
 "interpretation":{"N":{"tab":["n1"]}},
 "interrupt":{"V":{"tab":"v1"}},
 "interval":{"N":{"tab":["n1"]}},
 "intervene":{"V":{"tab":"v3"}},
 "intervention":{"N":{"tab":["n1"]}},
 "interview":{"N":{"tab":["n1"]},
              "V":{"tab":"v1"}},
 "intimate":{"A":{"tab":["a1"]}},
 "into":{"P":{"tab":["pp"]}},
 "introduce":{"V":{"tab":"v3"}},
 "introduction":{"N":{"tab":["n1"]}},
 "invade":{"V":{"tab":"v3"}},
 "invaluable":{"A":{"tab":["a1"]}},
 "invariably":{"Adv":{"tab":["b1"]}},
 "invasion":{"N":{"tab":["n1"]}},
 "invent":{"V":{"tab":"v1"}},
 "invention":{"N":{"tab":["n1"]}},
 "invest":{"V":{"tab":"v1"}},
 "investigate":{"V":{"tab":"v3"}},
 "investigation":{"N":{"tab":["n1"]}},
 "investigator":{"N":{"tab":["n1"]}},
 "investment":{"N":{"tab":["n1"]}},
 "investor":{"N":{"tab":["n1"]}},
 "invisible":{"A":{"tab":["a1"]}},
 "invitation":{"N":{"tab":["n1"]}},
 "invite":{"V":{"tab":"v3"}},
 "invoke":{"V":{"tab":"v3"}},
 "involve":{"V":{"tab":"v3"}},
 "involved":{"A":{"tab":["a1"]}},
 "involvement":{"N":{"tab":["n1"]}},
 "ion":{"N":{"tab":["n1"]}},
 "iron":{"N":{"tab":["n1"]}},
 "ironically":{"Adv":{"tab":["b1"]}},
 "irony":{"N":{"tab":["n3"]}},
 "irrelevant":{"A":{"tab":["a1"]}},
 "irrespective":{"A":{"tab":["a1"]}},
 "island":{"N":{"tab":["n1"]}},
 "isolation":{"N":{"tab":["n5"]}},
 "issue":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "item":{"N":{"tab":["n1"]}},
 "ivory":{"N":{"tab":["n5"]}},
 "jacket":{"N":{"tab":["n1"]}},
 "jail":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "jam":{"N":{"tab":["n1"]}},
 "January":{"N":{"tab":["n3"]}},
 "jar":{"N":{"tab":["n1"]}},
 "jaw":{"N":{"tab":["n1"]}},
 "jazz":{"N":{"tab":["n5"]}},
 "jealous":{"A":{"tab":["a1"]}},
 "jeans":{"N":{"tab":["n6"]}},
 "jerk":{"V":{"tab":"v1"}},
 "jet":{"N":{"tab":["n1"]}},
 "jewel":{"N":{"tab":["n1"]}},
 "jewellery":{"N":{"tab":["n5"]}},
 "job":{"N":{"tab":["n1"]}},
 "jockey":{"N":{"tab":["n1"]}},
 "join":{"V":{"tab":"v1"}},
 "joint":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "jointly":{"Adv":{"tab":["b1"]}},
 "joke":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "journal":{"N":{"tab":["n1"]}},
 "journalist":{"N":{"g":"x",
                    "tab":["n1"]}},
 "journey":{"N":{"tab":["n1"]}},
 "joy":{"N":{"tab":["n1"]}},
 "judge":{"N":{"g":"x",
               "tab":["n1"]},
          "V":{"tab":"v3"}},
 "judgement":{"N":{"tab":["n1"]}},
 "judgment":{"N":{"tab":["n1"]}},
 "judicial":{"A":{"tab":["a1"]}},
 "juice":{"N":{"tab":["n1"]}},
 "July":{"N":{"tab":["n3"]}},
 "jump":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "junction":{"N":{"tab":["n1"]}},
 "June":{"N":{"tab":["n1"]}},
 "jungle":{"N":{"tab":["n1"]}},
 "junior":{"A":{"tab":["a1"]}},
 "jurisdiction":{"N":{"tab":["n1"]}},
 "jury":{"N":{"tab":["n3"]}},
 "just":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]}},
 "justice":{"N":{"tab":["n1"]}},
 "justification":{"N":{"tab":["n1"]}},
 "justify":{"V":{"tab":"v4"}},
 "keen":{"A":{"tab":["a3"]}},
 "keep":{"V":{"tab":"v29"}},
 "keeper":{"N":{"tab":["n1"]}},
 "kettle":{"N":{"tab":["n1"]}},
 "key":{"N":{"tab":["n1"]}},
 "keyboard":{"N":{"tab":["n1"]}},
 "kick":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "kid":{"N":{"tab":["n1"]}},
 "kidney":{"N":{"tab":["n1"]}},
 "kill":{"V":{"tab":"v1"}},
 "killer":{"N":{"g":"x",
                "tab":["n1"]}},
 "killing":{"N":{"tab":["n1"]}},
 "kilometre":{"N":{"tab":["n1"]}},
 "kind":{"A":{"tab":["a3"]},
         "N":{"tab":["n1"]}},
 "kindly":{"Adv":{"tab":["b1"]}},
 "king":{"N":{"g":"m",
              "tab":["n1"]}},
 "kingdom":{"N":{"tab":["n1"]}},
 "kiss":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "kit":{"N":{"tab":["n1"]}},
 "kitchen":{"N":{"tab":["n1"]}},
 "kite":{"N":{"tab":["n1"]}},
 "knee":{"N":{"tab":["n1"]}},
 "kneel":{"V":{"tab":"v130"}},
 "knife":{"N":{"tab":["n10"]}},
 "knight":{"N":{"tab":["n1"]}},
 "knit":{"V":{"tab":"v38"}},
 "knitting":{"N":{"tab":["n5"]}},
 "knock":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "knot":{"N":{"tab":["n1"]}},
 "know":{"V":{"tab":"v27"}},
 "knowledge":{"N":{"tab":["n5"]}},
 "lab":{"N":{"tab":["n1"]}},
 "label":{"N":{"tab":["n1"]},
          "V":{"tab":"v9"}},
 "laboratory":{"N":{"tab":["n3"]}},
 "labour":{"N":{"tab":["n1"]}},
 "labourer":{"N":{"tab":["n1"]}},
 "lace":{"N":{"tab":["n1"]}},
 "lack":{"N":{"tab":["n5"]},
         "V":{"tab":"v1"}},
 "lad":{"N":{"g":"m",
             "tab":["n1"]}},
 "ladder":{"N":{"tab":["n1"]}},
 "lady":{"N":{"g":"f",
              "tab":["n3"]}},
 "lake":{"N":{"tab":["n1"]}},
 "lamb":{"N":{"tab":["n1"]}},
 "lamp":{"N":{"tab":["n1"]}},
 "land":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "landing":{"N":{"tab":["n1"]}},
 "landlord":{"N":{"g":"x",
                  "tab":["n1"]}},
 "landowner":{"N":{"tab":["n1"]}},
 "landscape":{"N":{"tab":["n1"]}},
 "lane":{"N":{"tab":["n1"]}},
 "language":{"N":{"tab":["n1"]}},
 "lap":{"N":{"tab":["n1"]}},
 "large":{"A":{"tab":["a2"]}},
 "large-scale":{"A":{"tab":["a1"]}},
 "largely":{"Adv":{"tab":["b1"]}},
 "laser":{"N":{"tab":["n1"]}},
 "last":{"V":{"tab":"v1"}},
 "late":{"A":{"tab":["a2"]},
         "Adv":{"tab":["b1"]}},
 "lately":{"Adv":{"tab":["b1"]}},
 "laugh":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "laughter":{"N":{"tab":["n5"]}},
 "launch":{"N":{"tab":["n2"]},
           "V":{"tab":"v2"}},
 "law":{"N":{"tab":["n1"]}},
 "lawn":{"N":{"tab":["n1"]}},
 "lawyer":{"N":{"g":"x",
                "tab":["n1"]}},
 "lay":{"A":{"tab":["a1"]},
        "V":{"tab":"v19"}},
 "layer":{"N":{"tab":["n1"]}},
 "lazy":{"A":{"tab":["a4"]}},
 "lead":{"N":{"tab":["n1"]},
         "V":{"tab":"v77"}},
 "leader":{"N":{"g":"x",
                "tab":["n1"]}},
 "leadership":{"N":{"tab":["n5"]}},
 "leading":{"A":{"tab":["a1"]}},
 "leaf":{"N":{"tab":["n9"]}},
 "leaflet":{"N":{"tab":["n1"]}},
 "league":{"N":{"tab":["n1"]}},
 "leak":{"V":{"tab":"v1"}},
 "lean":{"V":{"tab":"v26"}},
 "leap":{"V":{"tab":"v26"}},
 "learn":{"V":{"tab":"v26"}},
 "learner":{"N":{"g":"x",
                 "tab":["n1"]}},
 "learning":{"N":{"tab":["n5"]}},
 "lease":{"N":{"tab":["n1"]}},
 "leather":{"N":{"tab":["n1"]}},
 "leave":{"N":{"tab":["n1"]},
          "V":{"tab":"v155"}},
 "lecture":{"N":{"tab":["n1"]}},
 "lecturer":{"N":{"g":"x",
                  "tab":["n1"]}},
 "left":{"A":{"tab":["a1"]},
         "N":{"tab":["n5"]}},
 "leg":{"N":{"tab":["n1"]}},
 "legacy":{"N":{"tab":["n3"]}},
 "legal":{"A":{"tab":["a1"]}},
 "legally":{"Adv":{"tab":["b1"]}},
 "legend":{"N":{"tab":["n1"]}},
 "legislation":{"N":{"tab":["n5"]}},
 "legislative":{"A":{"tab":["a1"]}},
 "legislature":{"N":{"tab":["n1"]}},
 "legitimate":{"A":{"tab":["a1"]}},
 "leisure":{"N":{"tab":["n5"]}},
 "lemon":{"N":{"tab":["n1"]}},
 "lend":{"V":{"tab":"v23"}},
 "lender":{"N":{"g":"x",
                "tab":["n1"]}},
 "length":{"N":{"tab":["n1"]}},
 "lengthy":{"A":{"tab":["a4"]}},
 "less":{"Adv":{"tab":["b1"]},
         "P":{"tab":["pp"]}},
 "lesser":{"A":{"tab":["a1"]}},
 "lesson":{"N":{"tab":["n1"]}},
 "let":{"V":{"tab":"v17"}},
 "letter":{"N":{"tab":["n1"]}},
 "level":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]},
          "V":{"tab":"v9"}},
 "lexical":{"A":{"tab":["a1"]}},
 "liability":{"N":{"tab":["n3"]}},
 "liable":{"A":{"tab":["a1"]}},
 "liaison":{"N":{"tab":["n1"]}},
 "liberal":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "liberation":{"N":{"tab":["n1"]}},
 "liberty":{"N":{"tab":["n3"]}},
 "librarian":{"N":{"g":"x",
                   "tab":["n1"]}},
 "library":{"N":{"tab":["n3"]}},
 "licence":{"N":{"tab":["n1"]}},
 "license":{"V":{"tab":"v3"}},
 "lick":{"V":{"tab":"v1"}},
 "lid":{"N":{"tab":["n1"]}},
 "lie":{"N":{"tab":["n1"]},
        "V":{"tab":"v111"}},
 "life":{"N":{"tab":["n10"]}},
 "lifestyle":{"N":{"tab":["n1"]}},
 "lifetime":{"N":{"tab":["n1"]}},
 "lift":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "light":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]},
          "V":{"tab":"v68"}},
 "lightly":{"Adv":{"tab":["b1"]}},
 "like":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]},
         "P":{"tab":["pp"]},
         "V":{"tab":"v3"}},
 "likelihood":{"N":{"tab":["n5"]}},
 "likely":{"A":{"tab":["a4"]}},
 "likewise":{"Adv":{"tab":["b1"]}},
 "limb":{"N":{"tab":["n1"]}},
 "limestone":{"N":{"tab":["n5"]}},
 "limit":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "limitation":{"N":{"tab":["n1"]}},
 "line":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "linear":{"A":{"tab":["a1"]}},
 "linen":{"N":{"tab":["n5"]}},
 "linger":{"V":{"tab":"v1"}},
 "linguistic":{"A":{"tab":["a1"]}},
 "link":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "lion":{"N":{"tab":["n1"]}},
 "lip":{"N":{"tab":["n1"]}},
 "liquid":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "list":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "listen":{"V":{"tab":"v1"}},
 "listener":{"N":{"tab":["n1"]}},
 "literacy":{"N":{"tab":["n5"]}},
 "literally":{"Adv":{"tab":["b1"]}},
 "literary":{"A":{"tab":["a1"]}},
 "literature":{"N":{"tab":["n5"]}},
 "litigation":{"N":{"tab":["n5"]}},
 "litre":{"N":{"tab":["n1"]}},
 "little":{"A":{"tab":["a2"]},
           "Adv":{"tab":["b5"]}},
 "live":{"A":{"tab":["a1"]},
         "V":{"tab":"v3"}},
 "lively":{"A":{"tab":["a4"]}},
 "liver":{"N":{"tab":["n1"]}},
 "living":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "load":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "loan":{"N":{"tab":["n1"]}},
 "lobby":{"N":{"tab":["n3"]}},
 "local":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "locality":{"N":{"tab":["n3"]}},
 "locally":{"Adv":{"tab":["b1"]}},
 "locate":{"V":{"tab":"v3"}},
 "location":{"N":{"tab":["n1"]}},
 "lock":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "locomotive":{"N":{"tab":["n1"]}},
 "lodge":{"V":{"tab":"v3"}},
 "log":{"N":{"tab":["n1"]}},
 "logic":{"N":{"tab":["n1"]}},
 "logical":{"A":{"tab":["a1"]}},
 "lone":{"A":{"tab":["a1"]}},
 "lonely":{"A":{"tab":["a4"]}},
 "long":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]},
         "V":{"tab":"v1"}},
 "long-term":{"A":{"tab":["a1"]}},
 "look":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "loose":{"A":{"tab":["a2"]}},
 "lord":{"N":{"g":"m",
              "tab":["n1"]}},
 "lordship":{"N":{"tab":["n1"]}},
 "lorry":{"N":{"tab":["n3"]}},
 "lose":{"V":{"tab":"v143"}},
 "loss":{"N":{"tab":["n2"]}},
 "lot":{"N":{"tab":["n1"]}},
 "loud":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]}},
 "loudly":{"Adv":{"tab":["b1"]}},
 "lounge":{"N":{"tab":["n1"]}},
 "love":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "lovely":{"A":{"tab":["a4"]}},
 "lover":{"N":{"tab":["n1"]}},
 "low":{"A":{"tab":["a3"]},
        "Adv":{"tab":["b1"]}},
 "lower":{"V":{"tab":"v1"}},
 "loyal":{"A":{"tab":["a8"]}},
 "loyalty":{"N":{"tab":["n3"]}},
 "luck":{"N":{"tab":["n5"]}},
 "lucky":{"A":{"tab":["a4"]}},
 "lump":{"N":{"tab":["n1"]}},
 "lunch":{"N":{"tab":["n2"]}},
 "lung":{"N":{"tab":["n1"]}},
 "luxury":{"N":{"tab":["n3"]}},
 "machine":{"N":{"tab":["n1"]}},
 "machinery":{"N":{"tab":["n5"]}},
 "mad":{"A":{"tab":["a6"]}},
 "magazine":{"N":{"tab":["n1"]}},
 "magic":{"A":{"tab":["a1"]},
          "N":{"tab":["n5"]}},
 "magical":{"A":{"tab":["a1"]}},
 "magistrate":{"N":{"g":"x",
                    "tab":["n1"]}},
 "magnetic":{"A":{"tab":["a1"]}},
 "magnificent":{"A":{"tab":["a1"]}},
 "magnitude":{"N":{"tab":["n5"]}},
 "maid":{"N":{"tab":["n1"]}},
 "mail":{"N":{"tab":["n1"]}},
 "main":{"A":{"tab":["a1"]}},
 "mainland":{"N":{"tab":["n1"]}},
 "mainly":{"Adv":{"tab":["b1"]}},
 "mainstream":{"N":{"tab":["n5"]}},
 "maintain":{"V":{"tab":"v1"}},
 "maintenance":{"N":{"tab":["n5"]}},
 "majesty":{"N":{"tab":["n3"]}},
 "major":{"A":{"tab":["a1"]}},
 "majority":{"N":{"tab":["n3"]}},
 "make":{"N":{"tab":["n1"]},
         "V":{"tab":"v61"}},
 "make-up":{"N":{"tab":["n1"]}},
 "maker":{"N":{"tab":["n1"]}},
 "making":{"N":{"tab":["n1"]}},
 "male":{"A":{"tab":["a1"]},
         "N":{"g":"m",
              "tab":["n1"]}},
 "mammal":{"N":{"tab":["n1"]}},
 "man":{"N":{"g":"m",
             "tab":["n89"]}},
 "manage":{"V":{"tab":"v3"}},
 "management":{"N":{"tab":["n1"]}},
 "manager":{"N":{"g":"x",
                 "tab":["n1"]}},
 "managerial":{"A":{"tab":["a1"]}},
 "mandatory":{"A":{"tab":["a1"]}},
 "manifest":{"V":{"tab":"v1"}},
 "manifestation":{"N":{"tab":["n1"]}},
 "manipulate":{"V":{"tab":"v3"}},
 "manipulation":{"N":{"tab":["n1"]}},
 "mankind":{"N":{"tab":["n5"]}},
 "manner":{"N":{"tab":["n1"]}},
 "manor":{"N":{"tab":["n1"]}},
 "manpower":{"N":{"tab":["n5"]}},
 "manual":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "manufacture":{"N":{"tab":["n5"]},
                "V":{"tab":"v3"}},
 "manufacturer":{"N":{"tab":["n1"]}},
 "manuscript":{"N":{"tab":["n1"]}},
 "many":{"A":{"tab":["a1"]}},
 "map":{"N":{"tab":["n1"]},
        "V":{"tab":"v12"}},
 "marathon":{"N":{"tab":["n1"]}},
 "marble":{"N":{"tab":["n1"]}},
 "march":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "March":{"N":{"tab":["n2"]}},
 "margin":{"N":{"tab":["n1"]}},
 "marginal":{"A":{"tab":["a1"]}},
 "marine":{"A":{"tab":["a1"]}},
 "mark":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "marked":{"A":{"tab":["a1"]}},
 "marker":{"N":{"tab":["n1"]}},
 "market":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "marketing":{"N":{"tab":["n1"]}},
 "marriage":{"N":{"tab":["n1"]}},
 "married":{"A":{"tab":["a1"]}},
 "marry":{"V":{"tab":"v4"}},
 "marsh":{"N":{"tab":["n2"]}},
 "marvellous":{"A":{"tab":["a1"]}},
 "mask":{"N":{"tab":["n1"]}},
 "mass":{"N":{"tab":["n2"]}},
 "massive":{"A":{"tab":["a1"]}},
 "master":{"N":{"g":"x",
                "tab":["n1"]},
           "V":{"tab":"v1"}},
 "match":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "mate":{"N":{"tab":["n1"]}},
 "material":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "mathematical":{"A":{"tab":["a1"]}},
 "mathematics":{"N":{"tab":["n5"]}},
 "matrix":{"N":{"tab":["n2"]}},
 "matter":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "mature":{"A":{"tab":["a1"]}},
 "maturity":{"N":{"tab":["n5"]}},
 "maximum":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "may":{"V":{"tab":"v153"}},
 "May":{"N":{"tab":["n1"]}},
 "maybe":{"Adv":{"tab":["b1"]}},
 "mayor":{"N":{"g":"x",
               "tab":["n1"]}},
 "me":{"Pro":{"tab":["pn2"]}},
 "meadow":{"N":{"tab":["n1"]}},
 "meal":{"N":{"tab":["n1"]}},
 "mean":{"A":{"tab":["a3"]},
         "V":{"tab":"v55"}},
 "meaning":{"N":{"tab":["n1"]}},
 "meaningful":{"A":{"tab":["a1"]}},
 "meantime":{"N":{"tab":["n5"]}},
 "meanwhile":{"Adv":{"tab":["b1"]}},
 "measure":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "measurement":{"N":{"tab":["n1"]}},
 "meat":{"N":{"tab":["n1"]}},
 "mechanical":{"A":{"tab":["a1"]}},
 "mechanism":{"N":{"tab":["n1"]}},
 "medal":{"N":{"tab":["n1"]}},
 "medical":{"A":{"tab":["a1"]}},
 "medicine":{"N":{"tab":["n1"]}},
 "medieval":{"A":{"tab":["a1"]}},
 "medium":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "meet":{"V":{"tab":"v123"}},
 "meeting":{"N":{"tab":["n1"]}},
 "melt":{"V":{"tab":"v127"}},
 "member":{"N":{"g":"x",
                "tab":["n1"]}},
 "membership":{"N":{"tab":["n5"]}},
 "membrane":{"N":{"tab":["n1"]}},
 "memorable":{"A":{"tab":["a1"]}},
 "memorandum":{"N":{"tab":["n1"]}},
 "memorial":{"N":{"tab":["n1"]}},
 "memory":{"N":{"tab":["n3"]}},
 "mental":{"A":{"tab":["a1"]}},
 "mentally":{"Adv":{"tab":["b1"]}},
 "mention":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "menu":{"N":{"tab":["n1"]}},
 "merchant":{"N":{"tab":["n1"]}},
 "mercy":{"N":{"tab":["n3"]}},
 "mere":{"A":{"tab":["a18"]}},
 "merely":{"Adv":{"tab":["b1"]}},
 "merge":{"V":{"tab":"v3"}},
 "merger":{"N":{"tab":["n1"]}},
 "merit":{"N":{"tab":["n1"]}},
 "mess":{"N":{"tab":["n2"]}},
 "message":{"N":{"tab":["n1"]}},
 "metal":{"N":{"tab":["n1"]}},
 "metaphor":{"N":{"tab":["n1"]}},
 "method":{"N":{"tab":["n1"]}},
 "methodology":{"N":{"tab":["n3"]}},
 "metre":{"N":{"tab":["n1"]}},
 "metropolitan":{"A":{"tab":["a1"]}},
 "microphone":{"N":{"tab":["n1"]}},
 "mid":{"A":{"tab":["a1"]}},
 "middle":{"N":{"tab":["n1"]}},
 "middle-class":{"A":{"tab":["a1"]}},
 "midnight":{"N":{"tab":["n5"]}},
 "mighty":{"A":{"tab":["a4"]}},
 "migration":{"N":{"tab":["n1"]}},
 "mild":{"A":{"tab":["a3"]}},
 "mile":{"N":{"tab":["n1"]}},
 "military":{"A":{"tab":["a1"]}},
 "milk":{"N":{"tab":["n5"]}},
 "mill":{"N":{"tab":["n1"]}},
 "mind":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "mine":{"N":{"tab":["n1"]},
         "Pro":{"tab":["pn3"]}},
 "miner":{"N":{"tab":["n1"]}},
 "mineral":{"N":{"tab":["n1"]}},
 "minimal":{"A":{"tab":["a1"]}},
 "minimum":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "mining":{"N":{"tab":["n5"]}},
 "minister":{"N":{"g":"x",
                  "tab":["n1"]}},
 "ministerial":{"A":{"tab":["a1"]}},
 "ministry":{"N":{"tab":["n3"]}},
 "minor":{"A":{"tab":["a1"]}},
 "minority":{"N":{"tab":["n3"]}},
 "minus":{"P":{"tab":["pp"]}},
 "minute":{"A":{"tab":["a2"]},
           "N":{"tab":["n1"]}},
 "miracle":{"N":{"tab":["n1"]}},
 "mirror":{"N":{"tab":["n1"]}},
 "miserable":{"A":{"tab":["a1"]}},
 "misery":{"N":{"tab":["n3"]}},
 "miss":{"V":{"tab":"v2"}},
 "missile":{"N":{"tab":["n1"]}},
 "missing":{"A":{"tab":["a1"]}},
 "mission":{"N":{"tab":["n1"]}},
 "mist":{"N":{"tab":["n1"]}},
 "mistake":{"N":{"tab":["n1"]},
            "V":{"tab":"v20"}},
 "mistress":{"N":{"g":"f",
                  "tab":["n88"]}},
 "mix":{"N":{"tab":["n2"]},
        "V":{"tab":"v2"}},
 "mixed":{"A":{"tab":["a1"]}},
 "mixture":{"N":{"tab":["n1"]}},
 "moan":{"V":{"tab":"v1"}},
 "mobile":{"A":{"tab":["a1"]}},
 "mobility":{"N":{"tab":["n5"]}},
 "mode":{"N":{"tab":["n1"]}},
 "model":{"N":{"tab":["n1"]},
          "V":{"tab":"v9"}},
 "moderate":{"A":{"tab":["a1"]}},
 "modern":{"A":{"tab":["a1"]}},
 "modest":{"A":{"tab":["a1"]}},
 "modification":{"N":{"tab":["n1"]}},
 "modify":{"V":{"tab":"v4"}},
 "module":{"N":{"tab":["n1"]}},
 "mole":{"N":{"tab":["n1"]}},
 "molecular":{"A":{"tab":["a1"]}},
 "molecule":{"N":{"tab":["n1"]}},
 "moment":{"N":{"tab":["n1"]}},
 "momentum":{"N":{"tab":["n5"]}},
 "monarch":{"N":{"tab":["n1"]}},
 "monarchy":{"N":{"tab":["n3"]}},
 "monastery":{"N":{"tab":["n3"]}},
 "Monday":{"N":{"tab":["n1"]}},
 "monetary":{"A":{"tab":["a1"]}},
 "money":{"N":{"tab":["n50"]}},
 "monitor":{"N":{"g":"x",
                 "tab":["n1"]},
            "V":{"tab":"v1"}},
 "monk":{"N":{"g":"m",
              "tab":["n1"]}},
 "monkey":{"N":{"tab":["n1"]}},
 "monopoly":{"N":{"tab":["n3"]}},
 "monster":{"N":{"tab":["n1"]}},
 "month":{"N":{"tab":["n1"]}},
 "monthly":{"A":{"tab":["a1"]}},
 "monument":{"N":{"tab":["n1"]}},
 "mood":{"N":{"tab":["n1"]}},
 "moon":{"N":{"tab":["n1"]}},
 "moor":{"N":{"tab":["n1"]}},
 "moral":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "morale":{"N":{"tab":["n5"]}},
 "morality":{"N":{"tab":["n3"]}},
 "more":{"Adv":{"tab":["b1"]},
         "D":{"tab":["d4"]}},
 "moreover":{"Adv":{"tab":["b1"]}},
 "morning":{"N":{"tab":["n1"]}},
 "mortality":{"N":{"tab":["n5"]}},
 "mortgage":{"N":{"tab":["n1"]}},
 "mosaic":{"N":{"tab":["n1"]}},
 "most":{"Adv":{"tab":["b1"]}},
 "mostly":{"Adv":{"tab":["b1"]}},
 "mother":{"N":{"g":"f",
                "tab":["n87"]}},
 "motif":{"N":{"tab":["n1"]}},
 "motion":{"N":{"tab":["n1"]}},
 "motivate":{"V":{"tab":"v3"}},
 "motivation":{"N":{"tab":["n1"]}},
 "motive":{"N":{"tab":["n1"]}},
 "motor":{"N":{"tab":["n1"]}},
 "motorist":{"N":{"g":"x",
                  "tab":["n1"]}},
 "motorway":{"N":{"tab":["n1"]}},
 "mould":{"N":{"tab":["n1"]}},
 "mount":{"V":{"tab":"v1"}},
 "mountain":{"N":{"tab":["n1"]}},
 "mouse":{"N":{"tab":["n16"]}},
 "mouth":{"N":{"tab":["n1"]}},
 "move":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "movement":{"N":{"tab":["n1"]}},
 "movie":{"N":{"tab":["n1"]}},
 "much":{"Adv":{"tab":["b1"]},
         "D":{"tab":["d4"]}},
 "mud":{"N":{"tab":["n5"]}},
 "mug":{"N":{"tab":["n1"]}},
 "multiple":{"A":{"tab":["a1"]}},
 "multiply":{"V":{"tab":"v4"}},
 "municipal":{"A":{"tab":["a1"]}},
 "murder":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "murderer":{"N":{"g":"x",
                  "tab":["n1"]}},
 "murmur":{"V":{"tab":"v1"}},
 "muscle":{"N":{"tab":["n1"]}},
 "museum":{"N":{"tab":["n1"]}},
 "mushroom":{"N":{"tab":["n1"]}},
 "music":{"N":{"tab":["n5"]}},
 "musical":{"A":{"tab":["a1"]}},
 "musician":{"N":{"g":"x",
                  "tab":["n1"]}},
 "must":{"N":{"tab":["n1"]},
         "V":{"tab":"v166"}},
 "mutation":{"N":{"tab":["n1"]}},
 "mutter":{"V":{"tab":"v1"}},
 "mutual":{"A":{"tab":["a1"]}},
 "my":{"D":{"tab":["d2"]}},
 "myself":{"Pro":{"tab":["pn4"]}},
 "mysterious":{"A":{"tab":["a1"]}},
 "mystery":{"N":{"tab":["n3"]}},
 "myth":{"N":{"tab":["n1"]}},
 "nail":{"N":{"tab":["n1"]}},
 "naked":{"A":{"tab":["a1"]}},
 "name":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "namely":{"Adv":{"tab":["b1"]}},
 "narrative":{"N":{"tab":["n1"]}},
 "narrow":{"A":{"tab":["a3"]},
           "V":{"tab":"v1"}},
 "nasty":{"A":{"tab":["a4"]}},
 "nation":{"N":{"tab":["n1"]}},
 "national":{"A":{"tab":["a1"]}},
 "nationalism":{"N":{"tab":["n5"]}},
 "nationalist":{"N":{"tab":["n1"]}},
 "nationality":{"N":{"tab":["n3"]}},
 "nationally":{"Adv":{"tab":["b1"]}},
 "native":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "natural":{"A":{"tab":["a1"]}},
 "naturally":{"Adv":{"tab":["b1"]}},
 "nature":{"N":{"tab":["n1"]}},
 "naval":{"A":{"tab":["a1"]}},
 "navy":{"N":{"tab":["n3"]}},
 "near":{"A":{"tab":["a3"]},
         "Adv":{"tab":["b1"]},
         "P":{"tab":["pp"]}},
 "nearby":{"A":{"tab":["a1"]}},
 "nearly":{"Adv":{"tab":["b1"]}},
 "neat":{"A":{"tab":["a3"]}},
 "neatly":{"Adv":{"tab":["b1"]}},
 "necessarily":{"Adv":{"tab":["b1"]}},
 "necessary":{"A":{"tab":["a1"]}},
 "necessity":{"N":{"tab":["n3"]}},
 "neck":{"N":{"tab":["n1"]}},
 "need":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "needle":{"N":{"tab":["n1"]}},
 "negative":{"A":{"tab":["a1"]}},
 "neglect":{"N":{"tab":["n5"]},
            "V":{"tab":"v1"}},
 "negligence":{"N":{"tab":["n5"]}},
 "negotiate":{"V":{"tab":"v3"}},
 "negotiation":{"N":{"tab":["n1"]}},
 "neighbour":{"N":{"g":"x",
                   "tab":["n1"]}},
 "neighbourhood":{"N":{"tab":["n1"]}},
 "neither":{"Adv":{"tab":["b1"]}},
 "nephew":{"N":{"g":"m",
                "tab":["n1"]}},
 "nerve":{"N":{"tab":["n1"]}},
 "nervous":{"A":{"tab":["a1"]}},
 "nest":{"N":{"tab":["n1"]}},
 "net":{"A":{"tab":["a1"]},
        "N":{"tab":["n1"]}},
 "network":{"N":{"tab":["n1"]}},
 "neutral":{"A":{"tab":["a1"]}},
 "never":{"Adv":{"tab":["b1"]}},
 "nevertheless":{"Adv":{"tab":["b1"]}},
 "new":{"A":{"tab":["a3"]}},
 "newcomer":{"N":{"tab":["n1"]}},
 "newly":{"Adv":{"tab":["b1"]}},
 "news":{"N":{"tab":["n5"]}},
 "newspaper":{"N":{"tab":["n1"]}},
 "next":{"Adv":{"tab":["b1"]},
         "P":{"tab":["pp"]}},
 "nice":{"A":{"tab":["a2"]}},
 "nicely":{"Adv":{"tab":["b1"]}},
 "night":{"N":{"tab":["n1"]}},
 "nightmare":{"N":{"tab":["n1"]}},
 "nitrogen":{"N":{"tab":["n5"]}},
 "no":{"Adv":{"tab":["b1"]},
       "N":{"tab":["n1"]}},
 "no-one":{"Pro":{"tab":["pn5"]}},
 "noble":{"A":{"tab":["a2"]}},
 "nobody":{"Pro":{"tab":["pn5"]}},
 "nod":{"V":{"tab":"v6"}},
 "node":{"N":{"tab":["n1"]}},
 "noise":{"N":{"tab":["n1"]}},
 "noisy":{"A":{"tab":["a4"]}},
 "nominal":{"A":{"tab":["a1"]}},
 "nominate":{"V":{"tab":"v3"}},
 "nomination":{"N":{"tab":["n1"]}},
 "nonetheless":{"Adv":{"tab":["b1"]}},
 "nonsense":{"N":{"tab":["n1"]}},
 "norm":{"N":{"tab":["n1"]}},
 "normal":{"A":{"tab":["a1"]}},
 "normally":{"Adv":{"tab":["b1"]}},
 "north":{"N":{"tab":["n5"]}},
 "northern":{"A":{"tab":["a1"]}},
 "nose":{"N":{"tab":["n1"]}},
 "not":{"Adv":{"tab":["b1"]}},
 "notable":{"A":{"tab":["a1"]}},
 "notably":{"Adv":{"tab":["b1"]}},
 "note":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "notebook":{"N":{"tab":["n1"]}},
 "nothing":{"Pro":{"tab":["pn5"]}},
 "notice":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "noticeable":{"A":{"tab":["a1"]}},
 "notify":{"V":{"tab":"v4"}},
 "notion":{"N":{"tab":["n1"]}},
 "notorious":{"A":{"tab":["a1"]}},
 "noun":{"N":{"tab":["n1"]}},
 "novel":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "novelist":{"N":{"g":"x",
                  "tab":["n1"]}},
 "November":{"N":{"tab":["n1"]}},
 "now":{"Adv":{"tab":["b1"]}},
 "nowadays":{"Adv":{"tab":["b1"]}},
 "nowhere":{"Adv":{"tab":["b1"]}},
 "nuclear":{"A":{"tab":["a1"]}},
 "nucleus":{"N":{"tab":["n12"]}},
 "nuisance":{"N":{"tab":["n1"]}},
 "number":{"N":{"tab":["n1"]}},
 "numerous":{"A":{"tab":["a1"]}},
 "nun":{"N":{"g":"f",
             "tab":["n1"]}},
 "nurse":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "nursery":{"N":{"tab":["n3"]}},
 "nut":{"N":{"tab":["n1"]}},
 "oak":{"N":{"tab":["n1"]}},
 "obey":{"V":{"tab":"v1"}},
 "object":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "objection":{"N":{"tab":["n1"]}},
 "objective":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "obligation":{"N":{"tab":["n1"]}},
 "oblige":{"V":{"tab":"v3"}},
 "obscure":{"A":{"tab":["a1"]},
            "V":{"tab":"v3"}},
 "observation":{"N":{"tab":["n1"]}},
 "observe":{"V":{"tab":"v3"}},
 "observer":{"N":{"tab":["n1"]}},
 "obstacle":{"N":{"tab":["n1"]}},
 "obtain":{"V":{"tab":"v1"}},
 "obvious":{"A":{"tab":["a1"]}},
 "obviously":{"Adv":{"tab":["b1"]}},
 "occasion":{"N":{"tab":["n1"]}},
 "occasional":{"A":{"tab":["a1"]}},
 "occasionally":{"Adv":{"tab":["b1"]}},
 "occupation":{"N":{"tab":["n1"]}},
 "occupational":{"A":{"tab":["a1"]}},
 "occupy":{"V":{"tab":"v4"}},
 "occur":{"V":{"tab":"v13"}},
 "occurrence":{"N":{"tab":["n1"]}},
 "ocean":{"N":{"tab":["n1"]}},
 "October":{"N":{"tab":["n1"]}},
 "odd":{"A":{"tab":["a3"]}},
 "odds":{"N":{"tab":["n6"]}},
 "odour":{"N":{"tab":["n1"]}},
 "of":{"P":{"tab":["pp"]}},
 "off":{"Adv":{"tab":["b1"]},
        "P":{"tab":["pp"]}},
 "offence":{"N":{"tab":["n1"]}},
 "offend":{"V":{"tab":"v1"}},
 "offender":{"N":{"tab":["n1"]}},
 "offensive":{"A":{"tab":["a1"]}},
 "offer":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "offering":{"N":{"tab":["n1"]}},
 "office":{"N":{"tab":["n1"]}},
 "officer":{"N":{"g":"x",
                 "tab":["n1"]}},
 "official":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "officially":{"Adv":{"tab":["b1"]}},
 "offset":{"V":{"tab":"v17"}},
 "offspring":{"N":{"tab":["n4"]}},
 "often":{"Adv":{"tab":["b1"]}},
 "oil":{"N":{"tab":["n1"]}},
 "okay":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]}},
 "old":{"A":{"tab":["a16"]}},
 "old-fashioned":{"A":{"tab":["a1"]}},
 "omission":{"N":{"tab":["n1"]}},
 "omit":{"V":{"tab":"v14"}},
 "on":{"Adv":{"tab":["b1"]},
       "P":{"tab":["pp"]}},
 "once":{"Adv":{"tab":["b1"]}},
 "one":{"D":{"tab":["d4"],"value":1},
        "Pro":{"tab":["pn0"]}},
 "onion":{"N":{"tab":["n1"]}},
 "only":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]}},
 "onto":{"P":{"tab":["pp"]}},
 "onwards":{"Adv":{"tab":["b1"]}},
 "open":{"A":{"tab":["a1"]},
         "V":{"tab":"v1"}},
 "opening":{"N":{"tab":["n1"]}},
 "openly":{"Adv":{"tab":["b1"]}},
 "opera":{"N":{"tab":["n1"]}},
 "operate":{"V":{"tab":"v3"}},
 "operation":{"N":{"tab":["n1"]}},
 "operational":{"A":{"tab":["a1"]}},
 "operator":{"N":{"tab":["n1"]}},
 "opinion":{"N":{"tab":["n1"]}},
 "opponent":{"N":{"tab":["n1"]}},
 "opportunity":{"N":{"tab":["n3"]}},
 "oppose":{"V":{"tab":"v3"}},
 "opposite":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "opposition":{"N":{"tab":["n5"]}},
 "opt":{"V":{"tab":"v1"}},
 "optical":{"A":{"tab":["a1"]}},
 "optimism":{"N":{"tab":["n5"]}},
 "optimistic":{"A":{"tab":["a1"]}},
 "option":{"N":{"tab":["n1"]}},
 "optional":{"A":{"tab":["a1"]}},
 "or":{"C":{"tab":["cc"]}},
 "oral":{"A":{"tab":["a1"]}},
 "orange":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "orbit":{"N":{"tab":["n1"]}},
 "orchestra":{"N":{"tab":["n1"]}},
 "order":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "ordinary":{"A":{"tab":["a1"]}},
 "organ":{"N":{"tab":["n1"]}},
 "organic":{"A":{"tab":["a1"]}},
 "organism":{"N":{"tab":["n1"]}},
 "organization":{"N":{"tab":["n1"]}},
 "organizational":{"A":{"tab":["a1"]}},
 "organize":{"V":{"tab":"v3"}},
 "orientation":{"N":{"tab":["n5"]}},
 "origin":{"N":{"tab":["n1"]}},
 "original":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "originally":{"Adv":{"tab":["b1"]}},
 "originate":{"V":{"tab":"v3"}},
 "orthodox":{"A":{"tab":["a1"]}},
 "otherwise":{"Adv":{"tab":["b1"]},
              "C":{"tab":["cs"]}},
 "out":{"A":{"tab":["a1"]},
        "Adv":{"tab":["b1"]}},
 "outbreak":{"N":{"tab":["n1"]}},
 "outcome":{"N":{"tab":["n1"]}},
 "outdoor":{"A":{"tab":["a1"]}},
 "outer":{"A":{"tab":["a1"]}},
 "outfit":{"N":{"tab":["n1"]}},
 "outlet":{"N":{"tab":["n1"]}},
 "outline":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "outlook":{"N":{"tab":["n1"]}},
 "output":{"N":{"tab":["n5"]}},
 "outset":{"N":{"tab":["n1"]}},
 "outside":{"A":{"tab":["a1"]},
            "Adv":{"tab":["b1"]},
            "N":{"tab":["n1"]},
            "P":{"tab":["pp"]}},
 "outsider":{"N":{"tab":["n1"]}},
 "outstanding":{"A":{"tab":["a1"]}},
 "oven":{"N":{"tab":["n1"]}},
 "over":{"Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]},
         "P":{"tab":["pp"]}},
 "overall":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "overcome":{"V":{"tab":"v41"}},
 "overlook":{"V":{"tab":"v1"}},
 "overnight":{"Adv":{"tab":["b1"]}},
 "overseas":{"A":{"tab":["a1"]},
             "Adv":{"tab":["b1"]}},
 "overtake":{"V":{"tab":"v20"}},
 "overview":{"N":{"tab":["n1"]}},
 "overwhelm":{"V":{"tab":"v1"}},
 "owe":{"V":{"tab":"v3"}},
 "owl":{"N":{"tab":["n1"]}},
 "own":{"V":{"tab":"v1"}},
 "owner":{"N":{"g":"x",
               "tab":["n1"]}},
 "ownership":{"N":{"tab":["n5"]}},
 "oxygen":{"N":{"tab":["n5"]}},
 "ozone":{"N":{"tab":["n5"]}},
 "pace":{"N":{"tab":["n1"]}},
 "pack":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "package":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "packet":{"N":{"tab":["n1"]}},
 "pad":{"N":{"tab":["n1"]}},
 "page":{"N":{"tab":["n1"]}},
 "pain":{"N":{"tab":["n1"]}},
 "painful":{"A":{"tab":["a1"]}},
 "paint":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "painter":{"N":{"tab":["n1"]}},
 "painting":{"N":{"tab":["n1"]}},
 "pair":{"N":{"tab":["n1"]}},
 "pal":{"N":{"tab":["n1"]}},
 "palace":{"N":{"tab":["n1"]}},
 "pale":{"A":{"tab":["a2"]}},
 "palm":{"N":{"tab":["n1"]}},
 "pan":{"N":{"tab":["n1"]}},
 "panel":{"N":{"tab":["n1"]}},
 "panic":{"N":{"tab":["n1"]}},
 "papal":{"A":{"tab":["a1"]}},
 "paper":{"N":{"tab":["n1"]}},
 "par":{"N":{"tab":["n1"]}},
 "parade":{"N":{"tab":["n1"]}},
 "paragraph":{"N":{"tab":["n1"]}},
 "parallel":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "parameter":{"N":{"tab":["n1"]}},
 "parcel":{"N":{"tab":["n1"]}},
 "pardon":{"N":{"tab":["n1"]}},
 "parent":{"N":{"g":"x",
                "tab":["n1"]}},
 "parental":{"A":{"tab":["a1"]}},
 "parish":{"N":{"tab":["n2"]}},
 "park":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "parking":{"N":{"tab":["n5"]}},
 "parliament":{"N":{"tab":["n1"]}},
 "parliamentary":{"A":{"tab":["a1"]}},
 "part":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "part-time":{"A":{"tab":["a1"]}},
 "partial":{"A":{"tab":["a1"]}},
 "partially":{"Adv":{"tab":["b1"]}},
 "participant":{"N":{"tab":["n1"]}},
 "participate":{"V":{"tab":"v3"}},
 "participation":{"N":{"tab":["n5"]}},
 "particle":{"N":{"tab":["n1"]}},
 "particular":{"A":{"tab":["a1"]},
               "N":{"tab":["n1"]}},
 "particularly":{"Adv":{"tab":["b1"]}},
 "partly":{"Adv":{"tab":["b1"]}},
 "partner":{"N":{"tab":["n1"]}},
 "partnership":{"N":{"tab":["n1"]}},
 "party":{"N":{"tab":["n3"]}},
 "pass":{"N":{"tab":["n2"]},
         "V":{"tab":"v87"}},
 "passage":{"N":{"tab":["n1"]}},
 "passenger":{"N":{"g":"x",
                   "tab":["n1"]}},
 "passion":{"N":{"tab":["n1"]}},
 "passionate":{"A":{"tab":["a1"]}},
 "passive":{"A":{"tab":["a1"]}},
 "passport":{"N":{"tab":["n1"]}},
 "past":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]},
         "N":{"tab":["n1"]},
         "P":{"tab":["pp"]}},
 "pasture":{"N":{"tab":["n1"]}},
 "pat":{"V":{"tab":"v14"}},
 "patch":{"N":{"tab":["n2"]}},
 "patent":{"N":{"tab":["n1"]}},
 "path":{"N":{"tab":["n1"]}},
 "patience":{"N":{"tab":["n5"]}},
 "patient":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "patrol":{"N":{"tab":["n1"]}},
 "patron":{"N":{"tab":["n1"]}},
 "pattern":{"N":{"tab":["n1"]}},
 "pause":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "pavement":{"N":{"tab":["n1"]}},
 "pay":{"N":{"tab":["n5"]},
        "V":{"tab":"v19"}},
 "payable":{"A":{"tab":["a1"]}},
 "payment":{"N":{"tab":["n1"]}},
 "peace":{"N":{"tab":["n5"]}},
 "peaceful":{"A":{"tab":["a1"]}},
 "peak":{"N":{"tab":["n1"]}},
 "peasant":{"N":{"tab":["n1"]}},
 "peculiar":{"A":{"tab":["a1"]}},
 "pedestrian":{"N":{"g":"x",
                    "tab":["n1"]}},
 "peer":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "pen":{"N":{"tab":["n1"]}},
 "penalty":{"N":{"tab":["n3"]}},
 "pencil":{"N":{"tab":["n1"]}},
 "penetrate":{"V":{"tab":"v3"}},
 "penny":{"N":{"tab":["n3"]}},
 "pension":{"N":{"tab":["n1"]}},
 "pensioner":{"N":{"g":"x",
                   "tab":["n1"]}},
 "people":{"N":{"tab":["n6"]}},
 "pepper":{"N":{"tab":["n1"]}},
 "per":{"P":{"tab":["pp"]}},
 "perceive":{"V":{"tab":"v3"}},
 "percentage":{"N":{"tab":["n1"]}},
 "perception":{"N":{"tab":["n1"]}},
 "perfect":{"A":{"tab":["a1"]}},
 "perfectly":{"Adv":{"tab":["b1"]}},
 "perform":{"V":{"tab":"v1"}},
 "performance":{"N":{"tab":["n1"]}},
 "performer":{"N":{"g":"x",
                   "tab":["n1"]}},
 "perhaps":{"Adv":{"tab":["b1"]}},
 "period":{"N":{"tab":["n1"]}},
 "permanent":{"A":{"tab":["a1"]}},
 "permanently":{"Adv":{"tab":["b1"]}},
 "permission":{"N":{"tab":["n5"]}},
 "permit":{"V":{"tab":"v14"}},
 "persist":{"V":{"tab":"v1"}},
 "persistent":{"A":{"tab":["a1"]}},
 "person":{"N":{"g":"x",
                "tab":["n1"]}},
 "personal":{"A":{"tab":["a1"]}},
 "personality":{"N":{"tab":["n3"]}},
 "personally":{"Adv":{"tab":["b1"]}},
 "personnel":{"N":{"tab":["n1"]}},
 "perspective":{"N":{"tab":["n1"]}},
 "persuade":{"V":{"tab":"v3"}},
 "pest":{"N":{"tab":["n1"]}},
 "pet":{"N":{"tab":["n1"]}},
 "petition":{"N":{"tab":["n1"]}},
 "petrol":{"N":{"tab":["n5"]}},
 "petty":{"A":{"tab":["a4"]}},
 "phase":{"N":{"tab":["n1"]}},
 "phenomenon":{"N":{"tab":["n26"]}},
 "philosopher":{"N":{"tab":["n1"]}},
 "philosophical":{"A":{"tab":["a1"]}},
 "philosophy":{"N":{"tab":["n3"]}},
 "phone":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "photo":{"N":{"tab":["n1"]}},
 "photograph":{"N":{"tab":["n1"]},
               "V":{"tab":"v1"}},
 "photographer":{"N":{"g":"x",
                      "tab":["n1"]}},
 "photographic":{"A":{"tab":["a1"]}},
 "photography":{"N":{"tab":["n5"]}},
 "phrase":{"N":{"tab":["n1"]}},
 "physical":{"A":{"tab":["a1"]}},
 "physically":{"Adv":{"tab":["b1"]}},
 "physician":{"N":{"tab":["n1"]}},
 "physics":{"N":{"tab":["n5"]}},
 "piano":{"N":{"tab":["n1"]}},
 "pick":{"V":{"tab":"v1"}},
 "picture":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "pie":{"N":{"tab":["n1"]}},
 "piece":{"N":{"tab":["n1"]}},
 "pier":{"N":{"tab":["n1"]}},
 "pig":{"N":{"tab":["n1"]}},
 "pigeon":{"N":{"tab":["n1"]}},
 "pile":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "pill":{"N":{"tab":["n1"]}},
 "pillar":{"N":{"tab":["n1"]}},
 "pillow":{"N":{"tab":["n1"]}},
 "pilot":{"N":{"g":"x",
               "tab":["n1"]}},
 "pin":{"N":{"tab":["n1"]},
        "V":{"tab":"v11"}},
 "pine":{"N":{"tab":["n1"]}},
 "pink":{"A":{"tab":["a3"]}},
 "pint":{"N":{"tab":["n1"]}},
 "pioneer":{"N":{"tab":["n1"]}},
 "pipe":{"N":{"tab":["n1"]}},
 "pit":{"N":{"tab":["n1"]}},
 "pitch":{"N":{"tab":["n2"]}},
 "pity":{"N":{"tab":["n3"]}},
 "place":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "plain":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]}},
 "plaintiff":{"N":{"tab":["n1"]}},
 "plan":{"N":{"tab":["n1"]},
         "V":{"tab":"v11"}},
 "plane":{"N":{"tab":["n1"]}},
 "planet":{"N":{"tab":["n1"]}},
 "planner":{"N":{"tab":["n1"]}},
 "plant":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "plasma":{"N":{"tab":["n5"]}},
 "plaster":{"N":{"tab":["n1"]}},
 "plastic":{"N":{"tab":["n1"]}},
 "plate":{"N":{"tab":["n1"]}},
 "platform":{"N":{"tab":["n1"]}},
 "plausible":{"A":{"tab":["a1"]}},
 "play":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "player":{"N":{"g":"x",
                "tab":["n1"]}},
 "plea":{"N":{"tab":["n1"]}},
 "plead":{"V":{"tab":"v165"}},
 "pleasant":{"A":{"tab":["a1"]}},
 "please":{"V":{"tab":"v3"}},
 "pleased":{"A":{"tab":["a1"]}},
 "pleasure":{"N":{"tab":["n1"]}},
 "pledge":{"V":{"tab":"v3"}},
 "plot":{"N":{"tab":["n1"]},
         "V":{"tab":"v14"}},
 "plug":{"V":{"tab":"v7"}},
 "plunge":{"V":{"tab":"v3"}},
 "plus":{"P":{"tab":["pp"]}},
 "pocket":{"N":{"tab":["n1"]}},
 "poem":{"N":{"tab":["n1"]}},
 "poet":{"N":{"g":"x",
              "tab":["n1"]}},
 "poetry":{"N":{"tab":["n5"]}},
 "point":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "poison":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "pole":{"N":{"tab":["n1"]}},
 "police":{"N":{"tab":["n4"]}},
 "policeman":{"N":{"g":"m",
                   "tab":["n7"]}},
 "policy":{"N":{"tab":["n3"]}},
 "polish":{"V":{"tab":"v2"}},
 "polite":{"A":{"tab":["a2"]}},
 "political":{"A":{"tab":["a1"]}},
 "politically":{"Adv":{"tab":["b1"]}},
 "politician":{"N":{"tab":["n1"]}},
 "politics":{"N":{"tab":["n5"]}},
 "poll":{"N":{"tab":["n1"]}},
 "pollution":{"N":{"tab":["n5"]}},
 "polytechnic":{"N":{"tab":["n1"]}},
 "pond":{"N":{"tab":["n1"]}},
 "pony":{"N":{"tab":["n3"]}},
 "pool":{"N":{"tab":["n1"]}},
 "poor":{"A":{"tab":["a3"]}},
 "poorly":{"Adv":{"tab":["b1"]}},
 "pop":{"N":{"tab":["n1"]},
        "V":{"tab":"v12"}},
 "popular":{"A":{"tab":["a1"]}},
 "popularity":{"N":{"tab":["n5"]}},
 "population":{"N":{"tab":["n1"]}},
 "port":{"N":{"tab":["n1"]}},
 "portable":{"A":{"tab":["a1"]}},
 "porter":{"N":{"tab":["n1"]}},
 "portfolio":{"N":{"tab":["n1"]}},
 "portion":{"N":{"tab":["n1"]}},
 "portrait":{"N":{"tab":["n1"]}},
 "portray":{"V":{"tab":"v1"}},
 "pose":{"V":{"tab":"v3"}},
 "position":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "positive":{"A":{"tab":["a1"]}},
 "positively":{"Adv":{"tab":["b1"]}},
 "possess":{"V":{"tab":"v2"}},
 "possession":{"N":{"tab":["n1"]}},
 "possibility":{"N":{"tab":["n3"]}},
 "possible":{"A":{"tab":["a1"]}},
 "possibly":{"Adv":{"tab":["b1"]}},
 "post":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "postcard":{"N":{"tab":["n1"]}},
 "poster":{"N":{"tab":["n1"]}},
 "postpone":{"V":{"tab":"v3"}},
 "pot":{"N":{"tab":["n1"]}},
 "potato":{"N":{"tab":["n2"]}},
 "potential":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "potentially":{"Adv":{"tab":["b1"]}},
 "pottery":{"N":{"tab":["n3"]}},
 "pound":{"N":{"tab":["n1"]}},
 "pour":{"V":{"tab":"v1"}},
 "poverty":{"N":{"tab":["n5"]}},
 "powder":{"N":{"tab":["n1"]}},
 "power":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "powerful":{"A":{"tab":["a1"]}},
 "practical":{"A":{"tab":["a1"]}},
 "practically":{"Adv":{"tab":["b1"]}},
 "practice":{"N":{"tab":["n1"]}},
 "practise":{"V":{"tab":"v3"}},
 "practitioner":{"N":{"tab":["n1"]}},
 "praise":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "pray":{"V":{"tab":"v1"}},
 "prayer":{"N":{"tab":["n1"]}},
 "preach":{"V":{"tab":"v2"}},
 "precaution":{"N":{"tab":["n1"]}},
 "precede":{"V":{"tab":"v3"}},
 "precedent":{"N":{"tab":["n1"]}},
 "precious":{"A":{"tab":["a1"]}},
 "precise":{"A":{"tab":["a1"]}},
 "precisely":{"Adv":{"tab":["b1"]}},
 "precision":{"N":{"tab":["n5"]}},
 "predator":{"N":{"tab":["n1"]}},
 "predecessor":{"N":{"tab":["n1"]}},
 "predict":{"V":{"tab":"v1"}},
 "predictable":{"A":{"tab":["a1"]}},
 "prediction":{"N":{"tab":["n1"]}},
 "predominantly":{"Adv":{"tab":["b1"]}},
 "prefer":{"V":{"tab":"v13"}},
 "preference":{"N":{"tab":["n1"]}},
 "pregnancy":{"N":{"tab":["n3"]}},
 "pregnant":{"A":{"tab":["a1"]}},
 "prejudice":{"N":{"tab":["n1"]}},
 "preliminary":{"A":{"tab":["a1"]}},
 "premature":{"A":{"tab":["a1"]}},
 "premier":{"A":{"tab":["a1"]}},
 "premise":{"N":{"tab":["n1"]}},
 "premium":{"N":{"tab":["n1"]}},
 "preoccupation":{"N":{"tab":["n1"]}},
 "preparation":{"N":{"tab":["n1"]}},
 "prepare":{"V":{"tab":"v3"}},
 "prescribe":{"V":{"tab":"v3"}},
 "prescription":{"N":{"tab":["n1"]}},
 "presence":{"N":{"tab":["n5"]}},
 "present":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "presentation":{"N":{"tab":["n1"]}},
 "presently":{"Adv":{"tab":["b1"]}},
 "preservation":{"N":{"tab":["n5"]}},
 "preserve":{"V":{"tab":"v3"}},
 "presidency":{"N":{"tab":["n3"]}},
 "president":{"N":{"tab":["n1"]}},
 "presidential":{"A":{"tab":["a1"]}},
 "press":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "pressure":{"N":{"tab":["n1"]}},
 "prestige":{"N":{"tab":["n5"]}},
 "presumably":{"Adv":{"tab":["b1"]}},
 "presume":{"V":{"tab":"v3"}},
 "pretend":{"V":{"tab":"v1"}},
 "pretty":{"A":{"tab":["a4"]},
           "Adv":{"tab":["b1"]}},
 "prevail":{"V":{"tab":"v1"}},
 "prevalence":{"N":{"tab":["n5"]}},
 "prevent":{"V":{"tab":"v1"}},
 "prevention":{"N":{"tab":["n5"]}},
 "previous":{"A":{"tab":["a1"]}},
 "previously":{"Adv":{"tab":["b1"]}},
 "prey":{"N":{"tab":["n1"]}},
 "price":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "pride":{"N":{"tab":["n1"]}},
 "priest":{"N":{"g":"m",
                "tab":["n1"]}},
 "primarily":{"Adv":{"tab":["b1"]}},
 "primary":{"A":{"tab":["a1"]},
            "N":{"tab":["n3"]}},
 "prime":{"A":{"tab":["a1"]}},
 "primitive":{"A":{"tab":["a1"]}},
 "prince":{"N":{"g":"m",
                "tab":["n1"]}},
 "princess":{"N":{"g":"f",
                  "tab":["n88"]}},
 "principal":{"A":{"tab":["a1"]},
              "N":{"g":"x",
                   "tab":["n1"]}},
 "principally":{"Adv":{"tab":["b1"]}},
 "principle":{"N":{"tab":["n1"]}},
 "print":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "printer":{"N":{"tab":["n1"]}},
 "printing":{"N":{"tab":["n1"]}},
 "prior":{"A":{"tab":["a1"]}},
 "priority":{"N":{"tab":["n3"]}},
 "prison":{"N":{"tab":["n1"]}},
 "prisoner":{"N":{"g":"x",
                  "tab":["n1"]}},
 "privacy":{"N":{"tab":["n5"]}},
 "private":{"A":{"tab":["a1"]}},
 "privately":{"Adv":{"tab":["b1"]}},
 "privatization":{"N":{"tab":["n5"]}},
 "privilege":{"N":{"tab":["n1"]}},
 "privileged":{"A":{"tab":["a1"]}},
 "prize":{"N":{"tab":["n1"]}},
 "probability":{"N":{"tab":["n3"]}},
 "probable":{"A":{"tab":["a1"]}},
 "probably":{"Adv":{"tab":["b1"]}},
 "probe":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "problem":{"N":{"tab":["n1"]}},
 "procedure":{"N":{"tab":["n1"]}},
 "proceed":{"V":{"tab":"v1"}},
 "proceeding":{"N":{"tab":["n1"]}},
 "process":{"N":{"tab":["n2"]},
            "V":{"tab":"v2"}},
 "procession":{"N":{"tab":["n1"]}},
 "proclaim":{"V":{"tab":"v1"}},
 "produce":{"N":{"tab":["n5"]},
            "V":{"tab":"v3"}},
 "producer":{"N":{"tab":["n1"]}},
 "product":{"N":{"tab":["n1"]}},
 "production":{"N":{"tab":["n1"]}},
 "productive":{"A":{"tab":["a1"]}},
 "productivity":{"N":{"tab":["n5"]}},
 "profession":{"N":{"tab":["n1"]}},
 "professional":{"A":{"tab":["a1"]},
                 "N":{"g":"x",
                      "tab":["n1"]}},
 "professor":{"N":{"g":"x",
                   "tab":["n1"]}},
 "profile":{"N":{"tab":["n1"]}},
 "profit":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "profitable":{"A":{"tab":["a1"]}},
 "profound":{"A":{"tab":["a1"]}},
 "program":{"N":{"tab":["n1"]},
            "V":{"tab":"v10"}},
 "programme":{"N":{"tab":["n1"]}},
 "progress":{"N":{"tab":["n2"]},
             "V":{"tab":"v2"}},
 "progressive":{"A":{"tab":["a1"]}},
 "prohibit":{"V":{"tab":"v1"}},
 "project":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "projection":{"N":{"tab":["n1"]}},
 "prolonged":{"A":{"tab":["a1"]}},
 "prominent":{"A":{"tab":["a1"]}},
 "promise":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "promote":{"V":{"tab":"v3"}},
 "promoter":{"N":{"tab":["n1"]}},
 "promotion":{"N":{"tab":["n1"]}},
 "prompt":{"V":{"tab":"v1"}},
 "promptly":{"Adv":{"tab":["b1"]}},
 "prone":{"A":{"tab":["a1"]}},
 "pronounce":{"V":{"tab":"v3"}},
 "proof":{"N":{"tab":["n1"]}},
 "prop":{"V":{"tab":"v12"}},
 "propaganda":{"N":{"tab":["n5"]}},
 "proper":{"A":{"tab":["a1"]}},
 "properly":{"Adv":{"tab":["b1"]}},
 "property":{"N":{"tab":["n3"]}},
 "proportion":{"N":{"tab":["n1"]}},
 "proportional":{"A":{"tab":["a1"]}},
 "proposal":{"N":{"tab":["n1"]}},
 "propose":{"V":{"tab":"v3"}},
 "proposition":{"N":{"tab":["n1"]}},
 "proprietor":{"N":{"g":"x",
                    "tab":["n1"]}},
 "prosecute":{"V":{"tab":"v3"}},
 "prosecution":{"N":{"tab":["n1"]}},
 "prospect":{"N":{"tab":["n1"]}},
 "prospective":{"A":{"tab":["a1"]}},
 "prosperity":{"N":{"tab":["n5"]}},
 "protect":{"V":{"tab":"v1"}},
 "protection":{"N":{"tab":["n1"]}},
 "protective":{"A":{"tab":["a1"]}},
 "protein":{"N":{"tab":["n1"]}},
 "protest":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "protocol":{"N":{"tab":["n1"]}},
 "proud":{"A":{"tab":["a3"]}},
 "prove":{"V":{"tab":"v52"}},
 "provide":{"V":{"tab":"v3"}},
 "provider":{"N":{"tab":["n1"]}},
 "province":{"N":{"tab":["n1"]}},
 "provincial":{"A":{"tab":["a1"]}},
 "provision":{"N":{"tab":["n1"]}},
 "provisional":{"A":{"tab":["a1"]}},
 "provoke":{"V":{"tab":"v3"}},
 "psychiatric":{"A":{"tab":["a1"]}},
 "psychological":{"A":{"tab":["a1"]}},
 "psychologist":{"N":{"tab":["n1"]}},
 "psychology":{"N":{"tab":["n3"]}},
 "pub":{"N":{"tab":["n1"]}},
 "public":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "publication":{"N":{"tab":["n1"]}},
 "publicity":{"N":{"tab":["n5"]}},
 "publicly":{"Adv":{"tab":["b1"]}},
 "publish":{"V":{"tab":"v2"}},
 "publisher":{"N":{"tab":["n1"]}},
 "pudding":{"N":{"tab":["n1"]}},
 "pull":{"V":{"tab":"v1"}},
 "pulse":{"N":{"tab":["n1"]}},
 "pump":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "punch":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "punish":{"V":{"tab":"v2"}},
 "punishment":{"N":{"tab":["n1"]}},
 "pupil":{"N":{"g":"x",
               "tab":["n1"]}},
 "purchase":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "purchaser":{"N":{"tab":["n1"]}},
 "pure":{"A":{"tab":["a2"]}},
 "purely":{"Adv":{"tab":["b1"]}},
 "purple":{"A":{"tab":["a1"]}},
 "purpose":{"N":{"tab":["n1"]}},
 "pursue":{"V":{"tab":"v3"}},
 "pursuit":{"N":{"tab":["n1"]}},
 "push":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "put":{"V":{"tab":"v17"}},
 "puzzle":{"V":{"tab":"v3"}},
 "qualification":{"N":{"tab":["n1"]}},
 "qualified":{"A":{"tab":["a1"]}},
 "qualify":{"V":{"tab":"v4"}},
 "quality":{"N":{"tab":["n3"]}},
 "quantitative":{"A":{"tab":["a1"]}},
 "quantity":{"N":{"tab":["n3"]}},
 "quantum":{"N":{"tab":["n11"]}},
 "quarry":{"N":{"tab":["n3"]}},
 "quarter":{"N":{"tab":["n1"]}},
 "queen":{"N":{"g":"f",
               "tab":["n87"]}},
 "query":{"N":{"tab":["n3"]}},
 "quest":{"N":{"tab":["n1"]}},
 "question":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "questionnaire":{"N":{"tab":["n1"]}},
 "queue":{"N":{"tab":["n1"]}},
 "quick":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]}},
 "quickly":{"Adv":{"tab":["b1"]}},
 "quid":{"N":{"tab":["n1"]}},
 "quiet":{"A":{"tab":["a3"]}},
 "quietly":{"Adv":{"tab":["b1"]}},
 "quit":{"V":{"tab":"v38"}},
 "quite":{"Adv":{"tab":["b1"]}},
 "quota":{"N":{"tab":["n1"]}},
 "quotation":{"N":{"tab":["n1"]}},
 "quote":{"V":{"tab":"v3"}},
 "rabbit":{"N":{"tab":["n1"]}},
 "race":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "racial":{"A":{"tab":["a1"]}},
 "racism":{"N":{"tab":["n5"]}},
 "rack":{"N":{"tab":["n1"]}},
 "radiation":{"N":{"tab":["n1"]}},
 "radical":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "radio":{"N":{"tab":["n1"]}},
 "rage":{"N":{"tab":["n1"]}},
 "raid":{"N":{"tab":["n1"]}},
 "rail":{"N":{"tab":["n1"]}},
 "railway":{"N":{"tab":["n1"]}},
 "rain":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "raise":{"V":{"tab":"v3"}},
 "rally":{"N":{"tab":["n3"]},
          "V":{"tab":"v4"}},
 "ram":{"N":{"tab":["n1"]}},
 "range":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "rank":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "rape":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "rapid":{"A":{"tab":["a1"]}},
 "rapidly":{"Adv":{"tab":["b1"]}},
 "rare":{"A":{"tab":["a2"]}},
 "rarely":{"Adv":{"tab":["b1"]}},
 "rat":{"N":{"tab":["n1"]}},
 "rate":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "rather":{"Adv":{"tab":["b1"]}},
 "rating":{"N":{"tab":["n1"]}},
 "ratio":{"N":{"tab":["n1"]}},
 "rational":{"A":{"tab":["a1"]}},
 "raw":{"A":{"tab":["a1"]}},
 "ray":{"N":{"tab":["n1"]}},
 "reach":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "react":{"V":{"tab":"v1"}},
 "reaction":{"N":{"tab":["n1"]}},
 "reactor":{"N":{"tab":["n1"]}},
 "read":{"V":{"tab":"v18"}},
 "reader":{"N":{"g":"x",
                "tab":["n1"]}},
 "readily":{"Adv":{"tab":["b1"]}},
 "reading":{"N":{"tab":["n1"]}},
 "ready":{"A":{"tab":["a4"]}},
 "real":{"A":{"tab":["a1"]}},
 "realism":{"N":{"tab":["n5"]}},
 "realistic":{"A":{"tab":["a1"]}},
 "reality":{"N":{"tab":["n3"]}},
 "realize":{"V":{"tab":"v3"}},
 "really":{"Adv":{"tab":["b1"]}},
 "realm":{"N":{"tab":["n1"]}},
 "rear":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "reason":{"N":{"tab":["n1"]}},
 "reasonable":{"A":{"tab":["a1"]}},
 "reasonably":{"Adv":{"tab":["b1"]}},
 "reasoning":{"N":{"tab":["n5"]}},
 "reassure":{"V":{"tab":"v3"}},
 "rebel":{"N":{"tab":["n1"]}},
 "rebellion":{"N":{"tab":["n1"]}},
 "rebuild":{"V":{"tab":"v23"}},
 "recall":{"V":{"tab":"v1"}},
 "receipt":{"N":{"tab":["n1"]}},
 "receive":{"V":{"tab":"v3"}},
 "receiver":{"N":{"tab":["n1"]}},
 "recent":{"A":{"tab":["a1"]}},
 "recently":{"Adv":{"tab":["b1"]}},
 "reception":{"N":{"tab":["n1"]}},
 "recession":{"N":{"tab":["n1"]}},
 "recipe":{"N":{"tab":["n1"]}},
 "recipient":{"N":{"tab":["n1"]}},
 "reckon":{"V":{"tab":"v1"}},
 "recognition":{"N":{"tab":["n5"]}},
 "recognize":{"V":{"tab":"v3"}},
 "recommend":{"V":{"tab":"v1"}},
 "recommendation":{"N":{"tab":["n1"]}},
 "recommended":{"A":{"tab":["a1"]}},
 "reconcile":{"V":{"tab":"v3"}},
 "reconstruction":{"N":{"tab":["n1"]}},
 "record":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "recorder":{"N":{"tab":["n1"]}},
 "recording":{"N":{"tab":["n1"]}},
 "recover":{"V":{"tab":"v1"}},
 "recovery":{"N":{"tab":["n3"]}},
 "recreation":{"N":{"tab":["n1"]}},
 "recruit":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "recruitment":{"N":{"tab":["n1"]}},
 "recycle":{"V":{"tab":"v3"}},
 "red":{"A":{"tab":["a6"]},
        "N":{"tab":["n1"]}},
 "reduce":{"V":{"tab":"v3"}},
 "reduction":{"N":{"tab":["n1"]}},
 "redundancy":{"N":{"tab":["n3"]}},
 "redundant":{"A":{"tab":["a1"]}},
 "refer":{"V":{"tab":"v13"}},
 "referee":{"N":{"g":"x",
                 "tab":["n1"]}},
 "reference":{"N":{"tab":["n1"]}},
 "referendum":{"N":{"tab":["n1"]}},
 "reflect":{"V":{"tab":"v1"}},
 "reflection":{"N":{"tab":["n1"]}},
 "reform":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "reformer":{"N":{"tab":["n1"]}},
 "refuge":{"N":{"tab":["n1"]}},
 "refugee":{"N":{"g":"x",
                 "tab":["n1"]}},
 "refusal":{"N":{"tab":["n1"]}},
 "refuse":{"V":{"tab":"v3"}},
 "regain":{"V":{"tab":"v1"}},
 "regard":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "regime":{"N":{"tab":["n1"]}},
 "regiment":{"N":{"tab":["n1"]}},
 "region":{"N":{"tab":["n1"]}},
 "regional":{"A":{"tab":["a1"]}},
 "register":{"N":{"tab":["n1"]},
             "V":{"tab":"v1"}},
 "registration":{"N":{"tab":["n1"]}},
 "regret":{"N":{"tab":["n1"]},
           "V":{"tab":"v14"}},
 "regular":{"A":{"tab":["a1"]}},
 "regularly":{"Adv":{"tab":["b1"]}},
 "regulate":{"V":{"tab":"v3"}},
 "regulation":{"N":{"tab":["n1"]}},
 "regulatory":{"A":{"tab":["a1"]}},
 "rehabilitation":{"N":{"tab":["n1"]}},
 "rehearsal":{"N":{"tab":["n1"]}},
 "reign":{"N":{"tab":["n1"]}},
 "reinforce":{"V":{"tab":"v3"}},
 "reject":{"V":{"tab":"v1"}},
 "rejection":{"N":{"tab":["n1"]}},
 "relate":{"V":{"tab":"v3"}},
 "relation":{"N":{"g":"x",
                  "tab":["n1"]}},
 "relationship":{"N":{"tab":["n1"]}},
 "relative":{"A":{"tab":["a1"]},
             "N":{"g":"x",
                  "tab":["n1"]}},
 "relatively":{"Adv":{"tab":["b1"]}},
 "relax":{"V":{"tab":"v2"}},
 "relaxation":{"N":{"tab":["n1"]}},
 "release":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "relevance":{"N":{"tab":["n1"]}},
 "relevant":{"A":{"tab":["a1"]}},
 "reliable":{"A":{"tab":["a1"]}},
 "reliance":{"N":{"tab":["n5"]}},
 "relief":{"N":{"tab":["n1"]}},
 "relieve":{"V":{"tab":"v3"}},
 "religion":{"N":{"tab":["n1"]}},
 "religious":{"A":{"tab":["a1"]}},
 "reluctance":{"N":{"tab":["n5"]}},
 "reluctant":{"A":{"tab":["a1"]}},
 "reluctantly":{"Adv":{"tab":["b1"]}},
 "rely":{"V":{"tab":"v4"}},
 "remain":{"V":{"tab":"v1"}},
 "remainder":{"N":{"tab":["n1"]}},
 "remark":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "remarkable":{"A":{"tab":["a1"]}},
 "remarkably":{"Adv":{"tab":["b1"]}},
 "remedy":{"N":{"tab":["n3"]}},
 "remember":{"V":{"tab":"v1"}},
 "remind":{"V":{"tab":"v1"}},
 "reminder":{"N":{"tab":["n1"]}},
 "remote":{"A":{"tab":["a2"]}},
 "removal":{"N":{"tab":["n1"]}},
 "remove":{"V":{"tab":"v3"}},
 "renaissance":{"N":{"tab":["n1"]}},
 "render":{"V":{"tab":"v1"}},
 "renew":{"V":{"tab":"v1"}},
 "renewal":{"N":{"tab":["n1"]}},
 "rent":{"N":{"tab":["n1"]}},
 "repair":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "repay":{"V":{"tab":"v19"}},
 "repayment":{"N":{"tab":["n1"]}},
 "repeat":{"V":{"tab":"v1"}},
 "repeated":{"A":{"tab":["a1"]}},
 "repeatedly":{"Adv":{"tab":["b1"]}},
 "repetition":{"N":{"tab":["n1"]}},
 "replace":{"V":{"tab":"v3"}},
 "replacement":{"N":{"tab":["n1"]}},
 "reply":{"N":{"tab":["n3"]},
          "V":{"tab":"v4"}},
 "report":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "reportedly":{"Adv":{"tab":["b1"]}},
 "reporter":{"N":{"tab":["n1"]}},
 "represent":{"V":{"tab":"v1"}},
 "representation":{"N":{"tab":["n1"]}},
 "representative":{"A":{"tab":["a1"]},
                   "N":{"tab":["n1"]}},
 "reproduce":{"V":{"tab":"v3"}},
 "reproduction":{"N":{"tab":["n1"]}},
 "republic":{"N":{"tab":["n1"]}},
 "republican":{"N":{"tab":["n1"]}},
 "reputation":{"N":{"tab":["n1"]}},
 "request":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "require":{"V":{"tab":"v3"}},
 "requirement":{"N":{"tab":["n1"]}},
 "rescue":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "research":{"N":{"tab":["n2"]},
             "V":{"tab":"v2"}},
 "researcher":{"N":{"tab":["n1"]}},
 "resemble":{"V":{"tab":"v3"}},
 "resent":{"V":{"tab":"v1"}},
 "resentment":{"N":{"tab":["n5"]}},
 "reservation":{"N":{"tab":["n1"]}},
 "reserve":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "reservoir":{"N":{"tab":["n1"]}},
 "residence":{"N":{"tab":["n1"]}},
 "resident":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "residential":{"A":{"tab":["a1"]}},
 "residue":{"N":{"tab":["n1"]}},
 "resign":{"V":{"tab":"v1"}},
 "resignation":{"N":{"tab":["n1"]}},
 "resist":{"V":{"tab":"v1"}},
 "resistance":{"N":{"tab":["n1"]}},
 "resolution":{"N":{"tab":["n1"]}},
 "resolve":{"V":{"tab":"v3"}},
 "resort":{"N":{"tab":["n1"]}},
 "resource":{"N":{"tab":["n1"]}},
 "respect":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "respectable":{"A":{"tab":["a1"]}},
 "respective":{"A":{"tab":["a1"]}},
 "respectively":{"Adv":{"tab":["b1"]}},
 "respond":{"V":{"tab":"v1"}},
 "respondent":{"N":{"tab":["n1"]}},
 "response":{"N":{"tab":["n1"]}},
 "responsibility":{"N":{"tab":["n3"]}},
 "responsible":{"A":{"tab":["a1"]}},
 "rest":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "restaurant":{"N":{"tab":["n1"]}},
 "restoration":{"N":{"tab":["n1"]}},
 "restore":{"V":{"tab":"v3"}},
 "restrain":{"V":{"tab":"v1"}},
 "restraint":{"N":{"tab":["n1"]}},
 "restrict":{"V":{"tab":"v1"}},
 "restriction":{"N":{"tab":["n1"]}},
 "restrictive":{"A":{"tab":["a1"]}},
 "result":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "resume":{"V":{"tab":"v3"}},
 "retailer":{"N":{"tab":["n1"]}},
 "retain":{"V":{"tab":"v1"}},
 "retention":{"N":{"tab":["n5"]}},
 "retire":{"V":{"tab":"v3"}},
 "retired":{"A":{"tab":["a1"]}},
 "retirement":{"N":{"tab":["n1"]}},
 "retreat":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "retrieve":{"V":{"tab":"v3"}},
 "return":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "reveal":{"V":{"tab":"v1"}},
 "revelation":{"N":{"tab":["n1"]}},
 "revenge":{"N":{"tab":["n5"]}},
 "revenue":{"N":{"tab":["n1"]}},
 "reverse":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "revert":{"V":{"tab":"v1"}},
 "review":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "revise":{"V":{"tab":"v3"}},
 "revision":{"N":{"tab":["n1"]}},
 "revival":{"N":{"tab":["n1"]}},
 "revive":{"V":{"tab":"v3"}},
 "revolution":{"N":{"tab":["n1"]}},
 "revolutionary":{"A":{"tab":["a1"]}},
 "reward":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "rhetoric":{"N":{"tab":["n5"]}},
 "rhythm":{"N":{"tab":["n1"]}},
 "rib":{"N":{"tab":["n1"]}},
 "ribbon":{"N":{"tab":["n1"]}},
 "rice":{"N":{"tab":["n5"]}},
 "rich":{"A":{"tab":["a3"]}},
 "rid":{"V":{"tab":"v39"}},
 "ride":{"N":{"tab":["n1"]},
         "V":{"tab":"v47"}},
 "rider":{"N":{"tab":["n1"]}},
 "ridge":{"N":{"tab":["n1"]}},
 "ridiculous":{"A":{"tab":["a1"]}},
 "rifle":{"N":{"tab":["n1"]}},
 "right":{"A":{"tab":["a1"]},
          "Adv":{"tab":["b1"]},
          "N":{"tab":["n1"]}},
 "rightly":{"Adv":{"tab":["b1"]}},
 "rigid":{"A":{"tab":["a1"]}},
 "ring":{"N":{"tab":["n1"]},
         "V":{"tab":"v46"}},
 "riot":{"N":{"tab":["n1"]}},
 "rip":{"V":{"tab":"v12"}},
 "rise":{"N":{"tab":["n1"]},
         "V":{"tab":"v63"}},
 "risk":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "ritual":{"N":{"tab":["n1"]}},
 "rival":{"N":{"tab":["n1"]}},
 "river":{"N":{"tab":["n1"]}},
 "road":{"N":{"tab":["n1"]}},
 "roar":{"V":{"tab":"v1"}},
 "rob":{"V":{"tab":"v5"}},
 "robbery":{"N":{"tab":["n3"]}},
 "rock":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "rocket":{"N":{"tab":["n1"]}},
 "rod":{"N":{"tab":["n1"]}},
 "role":{"N":{"tab":["n1"]}},
 "roll":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "romance":{"N":{"tab":["n1"]}},
 "romantic":{"A":{"tab":["a1"]}},
 "roof":{"N":{"tab":["n1"]}},
 "room":{"N":{"tab":["n1"]}},
 "root":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "rope":{"N":{"tab":["n1"]}},
 "rose":{"N":{"tab":["n1"]}},
 "rotation":{"N":{"tab":["n1"]}},
 "rotten":{"A":{"tab":["a1"]}},
 "rough":{"A":{"tab":["a3"]}},
 "roughly":{"Adv":{"tab":["b1"]}},
 "round":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]},
          "P":{"tab":["pp"]},
          "V":{"tab":"v1"}},
 "route":{"N":{"tab":["n1"]}},
 "routine":{"N":{"tab":["n1"]}},
 "row":{"N":{"tab":["n1"]},
        "V":{"tab":"v1"}},
 "royal":{"A":{"tab":["a1"]}},
 "royalty":{"N":{"tab":["n3"]}},
 "rub":{"V":{"tab":"v5"}},
 "rubbish":{"N":{"tab":["n5"]}},
 "rude":{"A":{"tab":["a2"]}},
 "rug":{"N":{"tab":["n1"]}},
 "rugby":{"N":{"tab":["n5"]}},
 "ruin":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "rule":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "ruler":{"N":{"tab":["n1"]}},
 "ruling":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "rumour":{"N":{"tab":["n1"]}},
 "run":{"N":{"tab":["n1"]},
        "V":{"tab":"v33"}},
 "runner":{"N":{"g":"x",
                "tab":["n1"]}},
 "running":{"A":{"tab":["a1"]}},
 "rural":{"A":{"tab":["a1"]}},
 "rush":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "sack":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "sacred":{"A":{"tab":["a1"]}},
 "sacrifice":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "sad":{"A":{"tab":["a6"]}},
 "sadly":{"Adv":{"tab":["b1"]}},
 "safe":{"A":{"tab":["a2"]}},
 "safely":{"Adv":{"tab":["b1"]}},
 "safety":{"N":{"tab":["n5"]}},
 "sail":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "sailor":{"N":{"tab":["n1"]}},
 "saint":{"N":{"tab":["n1"]}},
 "sake":{"N":{"tab":["n1"]}},
 "salad":{"N":{"tab":["n1"]}},
 "salary":{"N":{"tab":["n3"]}},
 "sale":{"N":{"tab":["n1"]}},
 "salmon":{"N":{"tab":["n4"]}},
 "salon":{"N":{"tab":["n1"]}},
 "salt":{"N":{"tab":["n1"]}},
 "salvation":{"N":{"tab":["n5"]}},
 "same":{"A":{"tab":["a1"]}},
 "sample":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "sanction":{"N":{"tab":["n1"]}},
 "sanctuary":{"N":{"tab":["n3"]}},
 "sand":{"N":{"tab":["n1"]}},
 "sandwich":{"N":{"tab":["n2"]}},
 "satellite":{"N":{"tab":["n1"]}},
 "satisfaction":{"N":{"tab":["n1"]}},
 "satisfactory":{"A":{"tab":["a1"]}},
 "satisfy":{"V":{"tab":"v4"}},
 "Saturday":{"N":{"tab":["n1"]}},
 "sauce":{"N":{"tab":["n1"]}},
 "sausage":{"N":{"tab":["n1"]}},
 "save":{"V":{"tab":"v3"}},
 "saving":{"N":{"tab":["n1"]}},
 "say":{"N":{"tab":["n1"]},
        "V":{"tab":"v19"}},
 "saying":{"N":{"tab":["n1"]}},
 "scale":{"N":{"tab":["n1"]}},
 "scan":{"V":{"tab":"v11"}},
 "scandal":{"N":{"tab":["n1"]}},
 "scar":{"V":{"tab":"v13"}},
 "scarcely":{"Adv":{"tab":["b1"]}},
 "scatter":{"V":{"tab":"v1"}},
 "scenario":{"N":{"tab":["n1"]}},
 "scene":{"N":{"tab":["n1"]}},
 "scent":{"N":{"tab":["n1"]}},
 "schedule":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "scheme":{"N":{"tab":["n1"]}},
 "scholar":{"N":{"tab":["n1"]}},
 "scholarship":{"N":{"tab":["n1"]}},
 "school":{"N":{"tab":["n1"]}},
 "science":{"N":{"tab":["n1"]}},
 "scientific":{"A":{"tab":["a1"]}},
 "scientist":{"N":{"g":"x",
                   "tab":["n1"]}},
 "scope":{"N":{"tab":["n5"]}},
 "score":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "scramble":{"V":{"tab":"v3"}},
 "scrap":{"N":{"tab":["n1"]}},
 "scrape":{"V":{"tab":"v3"}},
 "scratch":{"V":{"tab":"v2"}},
 "scream":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "screen":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "screw":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "script":{"N":{"tab":["n1"]}},
 "scrutiny":{"N":{"tab":["n3"]}},
 "sculpture":{"N":{"tab":["n1"]}},
 "sea":{"N":{"tab":["n1"]}},
 "seal":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "search":{"N":{"tab":["n2"]},
           "V":{"tab":"v2"}},
 "season":{"N":{"tab":["n1"]}},
 "seasonal":{"A":{"tab":["a1"]}},
 "seat":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "second":{"N":{"tab":["n1"]}},
 "secondary":{"A":{"tab":["a1"]}},
 "secondly":{"Adv":{"tab":["b1"]}},
 "secret":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "secretary":{"N":{"g":"x",
                   "tab":["n3"]}},
 "secretion":{"N":{"tab":["n1"]}},
 "section":{"N":{"tab":["n1"]}},
 "sector":{"N":{"tab":["n1"]}},
 "secular":{"A":{"tab":["a1"]}},
 "secure":{"A":{"tab":["a1"]},
           "V":{"tab":"v3"}},
 "security":{"N":{"tab":["n3"]}},
 "sediment":{"N":{"tab":["n5"]}},
 "see":{"V":{"tab":"v50"}},
 "seed":{"N":{"tab":["n1"]}},
 "seek":{"V":{"tab":"v131"}},
 "seem":{"V":{"tab":"v1"}},
 "seemingly":{"Adv":{"tab":["b1"]}},
 "segment":{"N":{"tab":["n1"]}},
 "seize":{"V":{"tab":"v3"}},
 "seldom":{"Adv":{"tab":["b1"]}},
 "select":{"A":{"tab":["a1"]},
           "V":{"tab":"v1"}},
 "selection":{"N":{"tab":["n1"]}},
 "selective":{"A":{"tab":["a1"]}},
 "self":{"N":{"tab":["n9"]}},
 "sell":{"V":{"tab":"v31"}},
 "seller":{"N":{"g":"x",
                "tab":["n1"]}},
 "semantic":{"A":{"tab":["a1"]}},
 "semi-final":{"N":{"tab":["n1"]}},
 "seminar":{"N":{"tab":["n1"]}},
 "senate":{"N":{"tab":["n1"]}},
 "send":{"V":{"tab":"v23"}},
 "senior":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "sensation":{"N":{"tab":["n1"]}},
 "sense":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "sensible":{"A":{"tab":["a1"]}},
 "sensitive":{"A":{"tab":["a1"]}},
 "sensitivity":{"N":{"tab":["n3"]}},
 "sentence":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "sentiment":{"N":{"tab":["n1"]}},
 "separate":{"A":{"tab":["a1"]},
             "V":{"tab":"v3"}},
 "separately":{"Adv":{"tab":["b1"]}},
 "separation":{"N":{"tab":["n1"]}},
 "September":{"N":{"tab":["n1"]}},
 "sequence":{"N":{"tab":["n1"]}},
 "sergeant":{"N":{"tab":["n1"]}},
 "series":{"N":{"tab":["n4"]}},
 "serious":{"A":{"tab":["a1"]}},
 "seriously":{"Adv":{"tab":["b1"]}},
 "serum":{"N":{"tab":["n5"]}},
 "servant":{"N":{"tab":["n1"]}},
 "serve":{"V":{"tab":"v3"}},
 "server":{"N":{"tab":["n1"]}},
 "service":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "session":{"N":{"tab":["n1"]}},
 "set":{"N":{"tab":["n1"]},
        "V":{"tab":"v17"}},
 "setting":{"N":{"tab":["n1"]}},
 "settle":{"V":{"tab":"v3"}},
 "settlement":{"N":{"tab":["n1"]}},
 "severe":{"A":{"tab":["a2"]}},
 "severely":{"Adv":{"tab":["b1"]}},
 "sex":{"N":{"tab":["n2"]}},
 "sexual":{"A":{"tab":["a1"]}},
 "sexuality":{"N":{"tab":["n5"]}},
 "sexually":{"Adv":{"tab":["b1"]}},
 "shade":{"N":{"tab":["n1"]}},
 "shadow":{"N":{"tab":["n1"]}},
 "shaft":{"N":{"tab":["n1"]}},
 "shake":{"V":{"tab":"v20"}},
 "shall":{"V":{"tab":"v162"}},
 "shallow":{"A":{"tab":["a1"]}},
 "shame":{"N":{"tab":["n5"]}},
 "shape":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "share":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "shareholder":{"N":{"tab":["n1"]}},
 "sharp":{"A":{"tab":["a3"]}},
 "sharply":{"Adv":{"tab":["b1"]}},
 "shatter":{"V":{"tab":"v1"}},
 "shed":{"N":{"tab":["n1"]},
         "V":{"tab":"v39"}},
 "sheep":{"N":{"tab":["n4"]}},
 "sheer":{"A":{"tab":["a3"]}},
 "sheet":{"N":{"tab":["n1"]}},
 "shelf":{"N":{"tab":["n9"]}},
 "shell":{"N":{"tab":["n1"]}},
 "shelter":{"N":{"tab":["n1"]}},
 "shield":{"N":{"tab":["n1"]}},
 "shift":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "shilling":{"N":{"tab":["n1"]}},
 "shine":{"V":{"tab":"v66"}},
 "ship":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "shirt":{"N":{"tab":["n1"]}},
 "shit":{"N":{"tab":["n5"]}},
 "shiver":{"V":{"tab":"v1"}},
 "shock":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "shoe":{"N":{"tab":["n1"]}},
 "shoot":{"V":{"tab":"v40"}},
 "shop":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "shopping":{"N":{"tab":["n5"]}},
 "shore":{"N":{"tab":["n1"]}},
 "short":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]},
          "N":{"tab":["n1"]}},
 "short-term":{"A":{"tab":["a1"]}},
 "shortage":{"N":{"tab":["n1"]}},
 "shortly":{"Adv":{"tab":["b1"]}},
 "shot":{"N":{"tab":["n1"]}},
 "shoulder":{"N":{"tab":["n1"]}},
 "shout":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "show":{"N":{"tab":["n1"]},
         "V":{"tab":"v57"}},
 "shower":{"N":{"tab":["n1"]}},
 "shrink":{"V":{"tab":"v64"}},
 "shrub":{"N":{"tab":["n1"]}},
 "shrug":{"V":{"tab":"v7"}},
 "shut":{"V":{"tab":"v17"}},
 "shy":{"A":{"tab":["a3"]}},
 "sick":{"A":{"tab":["a1"]}},
 "sickness":{"N":{"tab":["n2"]}},
 "side":{"N":{"tab":["n1"]}},
 "sideways":{"Adv":{"tab":["b1"]}},
 "siege":{"N":{"tab":["n1"]}},
 "sigh":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "sight":{"N":{"tab":["n1"]}},
 "sign":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "signal":{"N":{"tab":["n1"]},
           "V":{"tab":"v9"}},
 "signature":{"N":{"tab":["n1"]}},
 "significance":{"N":{"tab":["n5"]}},
 "significant":{"A":{"tab":["a1"]}},
 "significantly":{"Adv":{"tab":["b1"]}},
 "silence":{"N":{"tab":["n1"]}},
 "silent":{"A":{"tab":["a1"]}},
 "silently":{"Adv":{"tab":["b1"]}},
 "silk":{"N":{"tab":["n1"]}},
 "silly":{"A":{"tab":["a4"]}},
 "silver":{"N":{"tab":["n5"]}},
 "similar":{"A":{"tab":["a1"]}},
 "similarity":{"N":{"tab":["n3"]}},
 "similarly":{"Adv":{"tab":["b1"]}},
 "simple":{"A":{"tab":["a2"]}},
 "simplicity":{"N":{"tab":["n5"]}},
 "simply":{"Adv":{"tab":["b1"]}},
 "simultaneously":{"Adv":{"tab":["b1"]}},
 "sin":{"N":{"tab":["n1"]}},
 "since":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "sincerely":{"Adv":{"tab":["b1"]}},
 "sing":{"V":{"tab":"v46"}},
 "singer":{"N":{"g":"x",
                "tab":["n1"]}},
 "single":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "sink":{"N":{"tab":["n1"]},
         "V":{"tab":"v64"}},
 "sip":{"V":{"tab":"v12"}},
 "sir":{"N":{"g":"m",
             "tab":["n1"]}},
 "sister":{"N":{"g":"f",
                "tab":["n87"]}},
 "sit":{"V":{"tab":"v44"}},
 "site":{"N":{"tab":["n1"]}},
 "situation":{"N":{"tab":["n1"]}},
 "size":{"N":{"tab":["n1"]}},
 "skeleton":{"N":{"tab":["n1"]}},
 "sketch":{"N":{"tab":["n2"]}},
 "ski":{"N":{"tab":["n1"]}},
 "skill":{"N":{"tab":["n1"]}},
 "skilled":{"A":{"tab":["a1"]}},
 "skin":{"N":{"tab":["n1"]}},
 "skipper":{"N":{"tab":["n1"]}},
 "skirt":{"N":{"tab":["n1"]}},
 "skull":{"N":{"tab":["n1"]}},
 "sky":{"N":{"tab":["n3"]}},
 "slab":{"N":{"tab":["n1"]}},
 "slam":{"V":{"tab":"v10"}},
 "slap":{"V":{"tab":"v12"}},
 "slave":{"N":{"tab":["n1"]}},
 "sleep":{"N":{"tab":["n5"]},
          "V":{"tab":"v29"}},
 "sleeve":{"N":{"tab":["n1"]}},
 "slice":{"N":{"tab":["n1"]}},
 "slide":{"N":{"tab":["n1"]},
          "V":{"tab":"v75"}},
 "slight":{"A":{"tab":["a3"]}},
 "slightly":{"Adv":{"tab":["b1"]}},
 "slim":{"A":{"tab":["a9"]}},
 "slip":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "slogan":{"N":{"tab":["n1"]}},
 "slope":{"N":{"tab":["n1"]}},
 "slot":{"N":{"tab":["n1"]}},
 "slow":{"A":{"tab":["a3"]},
         "V":{"tab":"v1"}},
 "slowly":{"Adv":{"tab":["b1"]}},
 "slump":{"V":{"tab":"v1"}},
 "small":{"A":{"tab":["a3"]}},
 "smart":{"A":{"tab":["a3"]}},
 "smash":{"V":{"tab":"v2"}},
 "smell":{"N":{"tab":["n1"]},
          "V":{"tab":"v99"}},
 "smile":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "smoke":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "smooth":{"A":{"tab":["a3"]},
           "V":{"tab":"v1"}},
 "smoothly":{"Adv":{"tab":["b1"]}},
 "snake":{"N":{"tab":["n1"]}},
 "snap":{"V":{"tab":"v12"}},
 "snatch":{"V":{"tab":"v2"}},
 "sniff":{"V":{"tab":"v1"}},
 "snow":{"N":{"tab":["n1"]}},
 "so":{"Adv":{"tab":["b1"]},
       "C":{"tab":["cs"]}},
 "so-called":{"A":{"tab":["a1"]}},
 "soak":{"V":{"tab":"v1"}},
 "soap":{"N":{"tab":["n1"]}},
 "soar":{"V":{"tab":"v1"}},
 "soccer":{"N":{"tab":["n5"]}},
 "social":{"A":{"tab":["a1"]}},
 "socialism":{"N":{"tab":["n5"]}},
 "socialist":{"A":{"tab":["a1"]},
              "N":{"tab":["n1"]}},
 "socially":{"Adv":{"tab":["b1"]}},
 "society":{"N":{"tab":["n3"]}},
 "sociological":{"A":{"tab":["a1"]}},
 "sociology":{"N":{"tab":["n5"]}},
 "sock":{"N":{"tab":["n1"]}},
 "socket":{"N":{"tab":["n1"]}},
 "sodium":{"N":{"tab":["n5"]}},
 "sofa":{"N":{"tab":["n1"]}},
 "soft":{"A":{"tab":["a3"]}},
 "soften":{"V":{"tab":"v1"}},
 "softly":{"Adv":{"tab":["b1"]}},
 "software":{"N":{"tab":["n5"]}},
 "soil":{"N":{"tab":["n1"]}},
 "solar":{"A":{"tab":["a1"]}},
 "soldier":{"N":{"g":"x",
                 "tab":["n1"]}},
 "sole":{"A":{"tab":["a1"]}},
 "solely":{"Adv":{"tab":["b1"]}},
 "solicitor":{"N":{"tab":["n1"]}},
 "solid":{"A":{"tab":["a1"]}},
 "solidarity":{"N":{"tab":["n5"]}},
 "solo":{"N":{"tab":["n1"]}},
 "solution":{"N":{"tab":["n1"]}},
 "solve":{"V":{"tab":"v3"}},
 "solvent":{"N":{"tab":["n1"]}},
 "some":{"D":{"tab":["d4"]}},
 "somebody":{"Pro":{"tab":["pn5"]}},
 "somehow":{"Adv":{"tab":["b1"]}},
 "someone":{"Pro":{"tab":["pn5"]}},
 "something":{"Pro":{"tab":["pn5"]}},
 "sometimes":{"Adv":{"tab":["b1"]}},
 "somewhat":{"Adv":{"tab":["b1"]}},
 "somewhere":{"Adv":{"tab":["b1"]}},
 "son":{"N":{"g":"m",
             "tab":["n1"]}},
 "song":{"N":{"tab":["n1"]}},
 "soon":{"Adv":{"tab":["b1"]}},
 "sophisticated":{"A":{"tab":["a1"]}},
 "sore":{"A":{"tab":["a1"]}},
 "sorry":{"A":{"tab":["a4"]}},
 "sort":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "soul":{"N":{"tab":["n1"]}},
 "sound":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "soup":{"N":{"tab":["n5"]}},
 "source":{"N":{"tab":["n1"]}},
 "south":{"N":{"tab":["n5"]}},
 "southern":{"A":{"tab":["a1"]}},
 "sovereignty":{"N":{"tab":["n5"]}},
 "space":{"N":{"tab":["n1"]}},
 "spare":{"A":{"tab":["a1"]},
          "V":{"tab":"v3"}},
 "spatial":{"A":{"tab":["a1"]}},
 "speak":{"V":{"tab":"v138"}},
 "speaker":{"N":{"g":"x",
                 "tab":["n1"]}},
 "special":{"A":{"tab":["a1"]}},
 "specialist":{"N":{"g":"x",
                    "tab":["n1"]}},
 "specially":{"Adv":{"tab":["b1"]}},
 "species":{"N":{"tab":["n4"]}},
 "specific":{"A":{"tab":["a1"]}},
 "specifically":{"Adv":{"tab":["b1"]}},
 "specification":{"N":{"tab":["n1"]}},
 "specify":{"V":{"tab":"v4"}},
 "specimen":{"N":{"tab":["n1"]}},
 "spectacle":{"N":{"tab":["n1"]}},
 "spectacular":{"A":{"tab":["a1"]}},
 "spectator":{"N":{"g":"x",
                   "tab":["n1"]}},
 "spectrum":{"N":{"tab":["n11"]}},
 "speculation":{"N":{"tab":["n1"]}},
 "speech":{"N":{"tab":["n2"]}},
 "speed":{"N":{"tab":["n1"]},
          "V":{"tab":"v133"}},
 "spell":{"N":{"tab":["n1"]},
          "V":{"tab":"v98"}},
 "spelling":{"N":{"tab":["n1"]}},
 "spend":{"V":{"tab":"v23"}},
 "sphere":{"N":{"tab":["n1"]}},
 "spider":{"N":{"tab":["n1"]}},
 "spill":{"V":{"tab":"v60"}},
 "spin":{"V":{"tab":"v104"}},
 "spine":{"N":{"tab":["n1"]}},
 "spirit":{"N":{"tab":["n1"]}},
 "spiritual":{"A":{"tab":["a1"]}},
 "spit":{"V":{"tab":"v44"}},
 "spite":{"N":{"tab":["n5"]}},
 "splendid":{"A":{"tab":["a1"]}},
 "split":{"N":{"tab":["n1"]},
          "V":{"tab":"v17"}},
 "spoil":{"V":{"tab":"v26"}},
 "spokesman":{"N":{"tab":["n7"]}},
 "sponsor":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "spontaneous":{"A":{"tab":["a1"]}},
 "spoon":{"N":{"tab":["n1"]}},
 "sport":{"N":{"tab":["n1"]}},
 "spot":{"N":{"tab":["n1"]},
         "V":{"tab":"v14"}},
 "spouse":{"N":{"g":"x",
                "tab":["n1"]}},
 "spray":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "spread":{"N":{"tab":["n1"]},
           "V":{"tab":"v18"}},
 "spring":{"N":{"tab":["n1"]},
           "V":{"tab":"v46"}},
 "spy":{"N":{"g":"x",
             "tab":["n3"]}},
 "squad":{"N":{"tab":["n1"]}},
 "squadron":{"N":{"tab":["n1"]}},
 "square":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "squeeze":{"V":{"tab":"v3"}},
 "stab":{"V":{"tab":"v5"}},
 "stability":{"N":{"tab":["n5"]}},
 "stable":{"A":{"tab":["a1"]},
           "N":{"tab":["n1"]}},
 "stadium":{"N":{"tab":["n1"]}},
 "staff":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "stage":{"N":{"tab":["n1"]}},
 "stagger":{"V":{"tab":"v1"}},
 "stain":{"V":{"tab":"v1"}},
 "stair":{"N":{"tab":["n1"]}},
 "staircase":{"N":{"tab":["n1"]}},
 "stake":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "stall":{"N":{"tab":["n1"]}},
 "stamp":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "stance":{"N":{"tab":["n1"]}},
 "stand":{"N":{"tab":["n1"]},
          "V":{"tab":"v37"}},
 "standard":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "standing":{"N":{"tab":["n5"]}},
 "star":{"N":{"tab":["n1"]},
         "V":{"tab":"v13"}},
 "start":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "startle":{"V":{"tab":"v3"}},
 "state":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "statement":{"N":{"tab":["n1"]}},
 "static":{"A":{"tab":["a1"]}},
 "station":{"N":{"tab":["n1"]}},
 "statistical":{"A":{"tab":["a1"]}},
 "statistics":{"N":{"tab":["n4"]}},
 "statue":{"N":{"tab":["n1"]}},
 "status":{"N":{"tab":["n5"]}},
 "statute":{"N":{"tab":["n1"]}},
 "statutory":{"A":{"tab":["a1"]}},
 "stay":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "steadily":{"Adv":{"tab":["b1"]}},
 "steady":{"A":{"tab":["a4"]}},
 "steal":{"V":{"tab":"v137"}},
 "steam":{"N":{"tab":["n5"]}},
 "steel":{"N":{"tab":["n5"]}},
 "steep":{"A":{"tab":["a3"]}},
 "steer":{"V":{"tab":"v1"}},
 "stem":{"N":{"tab":["n1"]},
         "V":{"tab":"v10"}},
 "step":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "sterling":{"A":{"tab":["a1"]}},
 "steward":{"N":{"g":"m",
                 "tab":["n1"]}},
 "stick":{"N":{"tab":["n1"]},
          "V":{"tab":"v119"}},
 "sticky":{"A":{"tab":["a4"]}},
 "stiff":{"A":{"tab":["a3"]}},
 "still":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]}},
 "stimulate":{"V":{"tab":"v3"}},
 "stimulus":{"N":{"tab":["n12"]}},
 "stir":{"V":{"tab":"v13"}},
 "stitch":{"N":{"tab":["n2"]}},
 "stock":{"N":{"tab":["n1"]}},
 "stocking":{"N":{"tab":["n1"]}},
 "stolen":{"A":{"tab":["a1"]}},
 "stomach":{"N":{"tab":["n1"]}},
 "stone":{"N":{"tab":["n1"]}},
 "stool":{"N":{"tab":["n1"]}},
 "stop":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "storage":{"N":{"tab":["n5"]}},
 "store":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "storm":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "story":{"N":{"tab":["n3"]}},
 "straight":{"A":{"tab":["a1"]},
             "Adv":{"tab":["b1"]}},
 "straighten":{"V":{"tab":"v1"}},
 "straightforward":{"A":{"tab":["a1"]}},
 "strain":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "strand":{"N":{"tab":["n1"]}},
 "strange":{"A":{"tab":["a2"]}},
 "strangely":{"Adv":{"tab":["b1"]}},
 "stranger":{"N":{"g":"x",
                  "tab":["n1"]}},
 "strap":{"N":{"tab":["n1"]}},
 "strategic":{"A":{"tab":["a1"]}},
 "strategy":{"N":{"tab":["n3"]}},
 "straw":{"N":{"tab":["n1"]}},
 "stream":{"N":{"tab":["n1"]}},
 "street":{"N":{"tab":["n1"]}},
 "strength":{"N":{"tab":["n1"]}},
 "strengthen":{"V":{"tab":"v1"}},
 "stress":{"N":{"tab":["n2"]},
           "V":{"tab":"v2"}},
 "stretch":{"N":{"tab":["n2"]},
            "V":{"tab":"v2"}},
 "strict":{"A":{"tab":["a3"]}},
 "strictly":{"Adv":{"tab":["b1"]}},
 "stride":{"V":{"tab":"v47"}},
 "strike":{"N":{"tab":["n1"]},
           "V":{"tab":"v108"}},
 "striker":{"N":{"tab":["n1"]}},
 "striking":{"A":{"tab":["a1"]}},
 "string":{"N":{"tab":["n1"]}},
 "strip":{"N":{"tab":["n1"]},
          "V":{"tab":"v12"}},
 "strive":{"V":{"tab":"v42"}},
 "stroke":{"N":{"tab":["n1"]},
           "V":{"tab":"v3"}},
 "stroll":{"V":{"tab":"v1"}},
 "strong":{"A":{"tab":["a3"]}},
 "strongly":{"Adv":{"tab":["b1"]}},
 "structural":{"A":{"tab":["a1"]}},
 "structure":{"N":{"tab":["n1"]}},
 "struggle":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "student":{"N":{"g":"x",
                 "tab":["n1"]}},
 "studio":{"N":{"tab":["n1"]}},
 "study":{"N":{"tab":["n3"]},
          "V":{"tab":"v4"}},
 "stuff":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "stumble":{"V":{"tab":"v3"}},
 "stunning":{"A":{"tab":["a1"]}},
 "stupid":{"A":{"tab":["a1"]}},
 "style":{"N":{"tab":["n1"]}},
 "subject":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "subjective":{"A":{"tab":["a1"]}},
 "submission":{"N":{"tab":["n1"]}},
 "submit":{"V":{"tab":"v14"}},
 "subscription":{"N":{"tab":["n1"]}},
 "subsequent":{"A":{"tab":["a1"]}},
 "subsequently":{"Adv":{"tab":["b1"]}},
 "subsidiary":{"N":{"tab":["n3"]}},
 "subsidy":{"N":{"tab":["n3"]}},
 "substance":{"N":{"tab":["n1"]}},
 "substantial":{"A":{"tab":["a1"]}},
 "substantially":{"Adv":{"tab":["b1"]}},
 "substantive":{"A":{"tab":["a1"]}},
 "substitute":{"N":{"tab":["n1"]},
               "V":{"tab":"v3"}},
 "subtle":{"A":{"tab":["a2"]}},
 "suburb":{"N":{"tab":["n1"]}},
 "succeed":{"V":{"tab":"v1"}},
 "success":{"N":{"tab":["n2"]}},
 "successful":{"A":{"tab":["a1"]}},
 "successfully":{"Adv":{"tab":["b1"]}},
 "succession":{"N":{"tab":["n1"]}},
 "successive":{"A":{"tab":["a1"]}},
 "successor":{"N":{"tab":["n1"]}},
 "suck":{"V":{"tab":"v1"}},
 "sudden":{"A":{"tab":["a1"]}},
 "suddenly":{"Adv":{"tab":["b1"]}},
 "sue":{"V":{"tab":"v3"}},
 "suffer":{"V":{"tab":"v1"}},
 "sufferer":{"N":{"tab":["n1"]}},
 "suffering":{"N":{"tab":["n1"]}},
 "sufficient":{"A":{"tab":["a1"]}},
 "sufficiently":{"Adv":{"tab":["b1"]}},
 "sugar":{"N":{"tab":["n1"]}},
 "suggest":{"V":{"tab":"v1"}},
 "suggestion":{"N":{"tab":["n1"]}},
 "suicide":{"N":{"tab":["n1"]}},
 "suit":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "suitable":{"A":{"tab":["a1"]}},
 "suitcase":{"N":{"tab":["n1"]}},
 "suite":{"N":{"tab":["n1"]}},
 "sulphur":{"N":{"tab":["n5"]}},
 "sum":{"N":{"tab":["n1"]},
        "V":{"tab":"v10"}},
 "summary":{"N":{"tab":["n3"]}},
 "summer":{"N":{"tab":["n1"]}},
 "summit":{"N":{"tab":["n1"]}},
 "summon":{"V":{"tab":"v1"}},
 "sun":{"N":{"tab":["n1"]}},
 "Sunday":{"N":{"tab":["n1"]}},
 "sunlight":{"N":{"tab":["n5"]}},
 "sunny":{"A":{"tab":["a4"]}},
 "sunshine":{"N":{"tab":["n5"]}},
 "super":{"A":{"tab":["a1"]}},
 "superb":{"A":{"tab":["a1"]}},
 "superintendent":{"N":{"tab":["n1"]}},
 "superior":{"A":{"tab":["a1"]}},
 "supermarket":{"N":{"tab":["n1"]}},
 "supervise":{"V":{"tab":"v3"}},
 "supervision":{"N":{"tab":["n1"]}},
 "supervisor":{"N":{"tab":["n1"]}},
 "supper":{"N":{"tab":["n1"]}},
 "supplement":{"N":{"tab":["n1"]},
               "V":{"tab":"v1"}},
 "supplementary":{"A":{"tab":["a1"]}},
 "supplier":{"N":{"tab":["n1"]}},
 "supply":{"N":{"tab":["n3"]},
           "V":{"tab":"v4"}},
 "support":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "supporter":{"N":{"tab":["n1"]}},
 "suppose":{"V":{"tab":"v3"}},
 "supposed":{"A":{"tab":["a1"]}},
 "supposedly":{"Adv":{"tab":["b1"]}},
 "suppress":{"V":{"tab":"v2"}},
 "supreme":{"A":{"tab":["a1"]}},
 "sure":{"A":{"tab":["a2"]},
         "Adv":{"tab":["b1"]}},
 "surely":{"Adv":{"tab":["b1"]}},
 "surface":{"N":{"tab":["n1"]}},
 "surgeon":{"N":{"g":"x",
                 "tab":["n1"]}},
 "surgery":{"N":{"tab":["n3"]}},
 "surplus":{"N":{"tab":["n2"]}},
 "surprise":{"N":{"tab":["n1"]},
             "V":{"tab":"v3"}},
 "surprised":{"A":{"tab":["a1"]}},
 "surprising":{"A":{"tab":["a1"]}},
 "surprisingly":{"Adv":{"tab":["b1"]}},
 "surrender":{"V":{"tab":"v1"}},
 "surround":{"V":{"tab":"v1"}},
 "surrounding":{"A":{"tab":["a1"]}},
 "survey":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "surveyor":{"N":{"tab":["n1"]}},
 "survival":{"N":{"tab":["n1"]}},
 "survive":{"V":{"tab":"v3"}},
 "survivor":{"N":{"tab":["n1"]}},
 "suspect":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "suspend":{"V":{"tab":"v1"}},
 "suspension":{"N":{"tab":["n5"]}},
 "suspicion":{"N":{"tab":["n1"]}},
 "suspicious":{"A":{"tab":["a1"]}},
 "sustain":{"V":{"tab":"v1"}},
 "swallow":{"V":{"tab":"v1"}},
 "swap":{"V":{"tab":"v12"}},
 "sway":{"V":{"tab":"v1"}},
 "swear":{"V":{"tab":"v30"}},
 "sweat":{"N":{"tab":["n1"]}},
 "sweep":{"V":{"tab":"v29"}},
 "sweet":{"A":{"tab":["a3"]},
          "N":{"tab":["n1"]}},
 "swell":{"V":{"tab":"v128"}},
 "swift":{"A":{"tab":["a3"]}},
 "swiftly":{"Adv":{"tab":["b1"]}},
 "swim":{"V":{"tab":"v107"}},
 "swimming":{"N":{"tab":["n5"]}},
 "swing":{"N":{"tab":["n1"]},
          "V":{"tab":"v21"}},
 "switch":{"N":{"tab":["n2"]},
           "V":{"tab":"v2"}},
 "sword":{"N":{"tab":["n1"]}},
 "syllable":{"N":{"tab":["n1"]}},
 "symbol":{"N":{"tab":["n1"]}},
 "symbolic":{"A":{"tab":["a1"]}},
 "symmetry":{"N":{"tab":["n5"]}},
 "sympathetic":{"A":{"tab":["a1"]}},
 "sympathy":{"N":{"tab":["n3"]}},
 "symptom":{"N":{"tab":["n1"]}},
 "syndrome":{"N":{"tab":["n1"]}},
 "syntactic":{"A":{"tab":["a1"]}},
 "synthesis":{"N":{"tab":["n8"]}},
 "system":{"N":{"tab":["n1"]}},
 "systematic":{"A":{"tab":["a1"]}},
 "table":{"N":{"tab":["n1"]}},
 "tablet":{"N":{"tab":["n1"]}},
 "tackle":{"V":{"tab":"v3"}},
 "tactic":{"N":{"tab":["n1"]}},
 "tail":{"N":{"tab":["n1"]}},
 "take":{"V":{"tab":"v20"}},
 "takeover":{"N":{"tab":["n1"]}},
 "tale":{"N":{"tab":["n1"]}},
 "talent":{"N":{"tab":["n1"]}},
 "talented":{"A":{"tab":["a1"]}},
 "talk":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "tall":{"A":{"tab":["a3"]}},
 "tank":{"N":{"tab":["n1"]}},
 "tap":{"N":{"tab":["n1"]},
        "V":{"tab":"v12"}},
 "tape":{"N":{"tab":["n1"]}},
 "target":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "tariff":{"N":{"tab":["n1"]}},
 "task":{"N":{"tab":["n1"]}},
 "taste":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "tax":{"N":{"tab":["n2"]},
        "V":{"tab":"v2"}},
 "taxation":{"N":{"tab":["n5"]}},
 "taxi":{"N":{"tab":["n1"]}},
 "taxpayer":{"N":{"tab":["n1"]}},
 "tea":{"N":{"tab":["n1"]}},
 "teach":{"V":{"tab":"v142"}},
 "teacher":{"N":{"g":"x",
                 "tab":["n1"]}},
 "teaching":{"N":{"tab":["n1"]}},
 "team":{"N":{"tab":["n1"]}},
 "tear":{"N":{"tab":["n1"]},
         "V":{"tab":"v30"}},
 "tease":{"V":{"tab":"v3"}},
 "technical":{"A":{"tab":["a1"]}},
 "technically":{"Adv":{"tab":["b1"]}},
 "technique":{"N":{"tab":["n1"]}},
 "technological":{"A":{"tab":["a1"]}},
 "technology":{"N":{"tab":["n3"]}},
 "teenage":{"A":{"tab":["a1"]}},
 "teenager":{"N":{"g":"x",
                  "tab":["n1"]}},
 "telecommunication":{"N":{"tab":["n1"]}},
 "telephone":{"N":{"tab":["n1"]},
              "V":{"tab":"v3"}},
 "television":{"N":{"tab":["n1"]}},
 "tell":{"V":{"tab":"v31"}},
 "telly":{"N":{"tab":["n3"]}},
 "temper":{"N":{"tab":["n1"]}},
 "temperature":{"N":{"tab":["n1"]}},
 "temple":{"N":{"tab":["n1"]}},
 "temporarily":{"Adv":{"tab":["b1"]}},
 "temporary":{"A":{"tab":["a1"]}},
 "tempt":{"V":{"tab":"v1"}},
 "temptation":{"N":{"tab":["n1"]}},
 "tenant":{"N":{"tab":["n1"]}},
 "tend":{"V":{"tab":"v1"}},
 "tendency":{"N":{"tab":["n3"]}},
 "tender":{"A":{"tab":["a3"]}},
 "tennis":{"N":{"tab":["n5"]}},
 "tense":{"A":{"tab":["a2"]}},
 "tension":{"N":{"tab":["n1"]}},
 "tent":{"N":{"tab":["n1"]}},
 "term":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "terminal":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "terminate":{"V":{"tab":"v3"}},
 "terrace":{"N":{"tab":["n1"]}},
 "terrible":{"A":{"tab":["a1"]}},
 "terribly":{"Adv":{"tab":["b1"]}},
 "terrify":{"V":{"tab":"v4"}},
 "territorial":{"A":{"tab":["a1"]}},
 "territory":{"N":{"tab":["n3"]}},
 "terror":{"N":{"tab":["n1"]}},
 "terrorist":{"N":{"tab":["n1"]}},
 "test":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "testament":{"N":{"tab":["n1"]}},
 "text":{"N":{"tab":["n1"]}},
 "textbook":{"N":{"tab":["n1"]}},
 "textile":{"N":{"tab":["n1"]}},
 "texture":{"N":{"tab":["n1"]}},
 "than":{"C":{"tab":["cs"]},
         "P":{"tab":["pp"]}},
 "thank":{"V":{"tab":"v1"}},
 "thanks":{"N":{"tab":["n6"]}},
 "that":{"Adv":{"tab":["b1"]},
         "C":{"tab":["cs"]},
         "D":{"tab":["d3"]},
         "Pro":{"tab":["pn6"]}},
 "the":{"D":{"tab":["d4"]}},
 "theatre":{"N":{"tab":["n1"]}},
 "theft":{"N":{"tab":["n1"]}},
 "theme":{"N":{"tab":["n1"]}},
 "then":{"Adv":{"tab":["b1"]}},
 "theology":{"N":{"tab":["n3"]}},
 "theoretical":{"A":{"tab":["a1"]}},
 "theorist":{"N":{"tab":["n1"]}},
 "theory":{"N":{"tab":["n3"]}},
 "therapist":{"N":{"tab":["n1"]}},
 "therapy":{"N":{"tab":["n3"]}},
 "there":{"Adv":{"tab":["b1"]},
          "N":{"tab":["n5"]}},
 "thereafter":{"Adv":{"tab":["b1"]}},
 "thereby":{"Adv":{"tab":["b1"]}},
 "therefore":{"Adv":{"tab":["b1"]}},
 "these":{"Pro":{"tab":["pn8"]}},
 "thesis":{"N":{"tab":["n8"]}},
 "thick":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]}},
 "thief":{"N":{"g":"x",
               "tab":["n9"]}},
 "thigh":{"N":{"tab":["n1"]}},
 "thin":{"A":{"tab":["a10"]}},
 "thing":{"N":{"tab":["n1"]}},
 "think":{"V":{"tab":"v45"}},
 "thinking":{"A":{"tab":["a1"]},
             "N":{"tab":["n5"]}},
 "this":{"Adv":{"tab":["b1"]},
         "D":{"tab":["d5"]},
         "Pro":{"tab":["pn8"]}},
 "thorough":{"A":{"tab":["a1"]}},
 "thoroughly":{"Adv":{"tab":["b1"]}},
 "though":{"Adv":{"tab":["b1"]}},
 "thought":{"N":{"tab":["n1"]}},
 "thread":{"N":{"tab":["n1"]}},
 "threat":{"N":{"tab":["n1"]}},
 "threaten":{"V":{"tab":"v1"}},
 "threshold":{"N":{"tab":["n1"]}},
 "throat":{"N":{"tab":["n1"]}},
 "throne":{"N":{"tab":["n1"]}},
 "through":{"Adv":{"tab":["b1"]},
            "P":{"tab":["pp"]}},
 "throughout":{"P":{"tab":["pp"]}},
 "throw":{"V":{"tab":"v27"}},
 "thrust":{"N":{"tab":["n1"]},
           "V":{"tab":"v18"}},
 "thumb":{"N":{"tab":["n1"]}},
 "Thursday":{"N":{"tab":["n1"]}},
 "thus":{"Adv":{"tab":["b1"]}},
 "tick":{"V":{"tab":"v1"}},
 "ticket":{"N":{"tab":["n1"]}},
 "tide":{"N":{"tab":["n1"]}},
 "tie":{"N":{"tab":["n1"]},
        "V":{"tab":"v28"}},
 "tiger":{"N":{"tab":["n1"]}},
 "tight":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]}},
 "tighten":{"V":{"tab":"v1"}},
 "tightly":{"Adv":{"tab":["b1"]}},
 "tile":{"N":{"tab":["n1"]}},
 "till":{"P":{"tab":["pp"]}},
 "timber":{"N":{"tab":["n1"]}},
 "time":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "timetable":{"N":{"tab":["n1"]}},
 "timing":{"N":{"tab":["n1"]}},
 "tin":{"N":{"tab":["n1"]}},
 "tiny":{"A":{"tab":["a4"]}},
 "tip":{"N":{"tab":["n1"]},
        "V":{"tab":"v12"}},
 "tired":{"A":{"tab":["a1"]}},
 "tissue":{"N":{"tab":["n1"]}},
 "title":{"N":{"tab":["n1"]}},
 "to":{"P":{"tab":["pp"]}},
 "toast":{"N":{"tab":["n1"]}},
 "tobacco":{"N":{"tab":["n1"]}},
 "today":{"Adv":{"tab":["b1"]}},
 "toe":{"N":{"tab":["n1"]}},
 "together":{"Adv":{"tab":["b1"]}},
 "toilet":{"N":{"tab":["n1"]}},
 "tolerate":{"V":{"tab":"v3"}},
 "toll":{"N":{"tab":["n1"]}},
 "tomato":{"N":{"tab":["n2"]}},
 "tomorrow":{"Adv":{"tab":["b1"]}},
 "ton":{"N":{"tab":["n1"]}},
 "tone":{"N":{"tab":["n1"]}},
 "tongue":{"N":{"tab":["n1"]}},
 "tonight":{"Adv":{"tab":["b1"]}},
 "tonne":{"N":{"tab":["n1"]}},
 "too":{"Adv":{"tab":["b1"]}},
 "tool":{"N":{"tab":["n1"]}},
 "tooth":{"N":{"tab":["n20"]}},
 "top":{"N":{"tab":["n1"]},
        "V":{"tab":"v12"}},
 "topic":{"N":{"tab":["n1"]}},
 "torch":{"N":{"tab":["n2"]}},
 "toss":{"V":{"tab":"v2"}},
 "total":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]},
          "V":{"tab":"v9"}},
 "totally":{"Adv":{"tab":["b1"]}},
 "touch":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "tough":{"A":{"tab":["a3"]}},
 "tour":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "tourism":{"N":{"tab":["n5"]}},
 "tourist":{"N":{"g":"x",
                 "tab":["n1"]}},
 "tournament":{"N":{"tab":["n1"]}},
 "toward":{"P":{"tab":["pp"]}},
 "towards":{"P":{"tab":["pp"]}},
 "towel":{"N":{"tab":["n1"]}},
 "tower":{"N":{"tab":["n1"]}},
 "town":{"N":{"tab":["n1"]}},
 "toxic":{"A":{"tab":["a1"]}},
 "toy":{"N":{"tab":["n1"]}},
 "trace":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "track":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "tract":{"N":{"tab":["n1"]}},
 "trade":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "trader":{"N":{"tab":["n1"]}},
 "tradition":{"N":{"tab":["n1"]}},
 "traditional":{"A":{"tab":["a1"]}},
 "traditionally":{"Adv":{"tab":["b1"]}},
 "traffic":{"N":{"tab":["n5"]}},
 "tragedy":{"N":{"tab":["n3"]}},
 "tragic":{"A":{"tab":["a1"]}},
 "trail":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "train":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "trainee":{"N":{"tab":["n1"]}},
 "trainer":{"N":{"tab":["n1"]}},
 "training":{"N":{"tab":["n5"]}},
 "trait":{"N":{"tab":["n1"]}},
 "transaction":{"N":{"tab":["n1"]}},
 "transcription":{"N":{"tab":["n1"]}},
 "transfer":{"N":{"tab":["n1"]},
             "V":{"tab":"v13"}},
 "transform":{"V":{"tab":"v1"}},
 "transformation":{"N":{"tab":["n1"]}},
 "transition":{"N":{"tab":["n1"]}},
 "translate":{"V":{"tab":"v3"}},
 "translation":{"N":{"tab":["n1"]}},
 "transmission":{"N":{"tab":["n1"]}},
 "transmit":{"V":{"tab":"v14"}},
 "transport":{"N":{"tab":["n1"]},
              "V":{"tab":"v1"}},
 "trap":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "travel":{"N":{"tab":["n1"]},
           "V":{"tab":"v9"}},
 "traveller":{"N":{"g":"x",
                   "tab":["n1"]}},
 "tray":{"N":{"tab":["n1"]}},
 "tread":{"V":{"tab":"v141"}},
 "treasure":{"N":{"tab":["n1"]}},
 "treasurer":{"N":{"tab":["n1"]}},
 "treasury":{"N":{"tab":["n3"]}},
 "treat":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "treatment":{"N":{"tab":["n1"]}},
 "treaty":{"N":{"tab":["n3"]}},
 "tree":{"N":{"tab":["n1"]}},
 "tremble":{"V":{"tab":"v3"}},
 "tremendous":{"A":{"tab":["a1"]}},
 "trench":{"N":{"tab":["n2"]}},
 "trend":{"N":{"tab":["n1"]}},
 "trial":{"N":{"tab":["n1"]}},
 "triangle":{"N":{"tab":["n1"]}},
 "tribe":{"N":{"tab":["n1"]}},
 "tribunal":{"N":{"tab":["n1"]}},
 "tribute":{"N":{"tab":["n1"]}},
 "trick":{"N":{"tab":["n1"]}},
 "trigger":{"V":{"tab":"v1"}},
 "trip":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "triumph":{"N":{"tab":["n1"]}},
 "trivial":{"A":{"tab":["a1"]}},
 "trolley":{"N":{"tab":["n1"]}},
 "troop":{"N":{"tab":["n1"]}},
 "trophy":{"N":{"tab":["n3"]}},
 "tropical":{"A":{"tab":["a1"]}},
 "trouble":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "trouser":{"N":{"tab":["n1"]}},
 "truck":{"N":{"tab":["n1"]}},
 "true":{"A":{"tab":["a2"]}},
 "truly":{"Adv":{"tab":["b1"]}},
 "trunk":{"N":{"tab":["n1"]}},
 "trust":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "trustee":{"N":{"tab":["n1"]}},
 "truth":{"N":{"tab":["n1"]}},
 "try":{"N":{"tab":["n3"]},
        "V":{"tab":"v4"}},
 "tube":{"N":{"tab":["n1"]}},
 "tuck":{"V":{"tab":"v1"}},
 "Tuesday":{"N":{"tab":["n1"]}},
 "tumble":{"V":{"tab":"v3"}},
 "tumour":{"N":{"tab":["n1"]}},
 "tune":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "tunnel":{"N":{"tab":["n1"]}},
 "turkey":{"N":{"tab":["n1"]}},
 "turn":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "turnover":{"N":{"tab":["n1"]}},
 "tutor":{"N":{"g":"x",
               "tab":["n1"]}},
 "twin":{"N":{"tab":["n1"]}},
 "twist":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "type":{"N":{"tab":["n1"]}},
 "typical":{"A":{"tab":["a1"]}},
 "typically":{"Adv":{"tab":["b1"]}},
 "tyre":{"N":{"tab":["n1"]}},
 "ugly":{"A":{"tab":["a4"]}},
 "ulcer":{"N":{"tab":["n1"]}},
 "ultimate":{"A":{"tab":["a1"]}},
 "ultimately":{"Adv":{"tab":["b1"]}},
 "umbrella":{"N":{"tab":["n1"]}},
 "unable":{"A":{"tab":["a1"]}},
 "unacceptable":{"A":{"tab":["a1"]}},
 "unaware":{"A":{"tab":["a1"]}},
 "uncertain":{"A":{"tab":["a1"]}},
 "uncertainty":{"N":{"tab":["n3"]}},
 "uncle":{"N":{"g":"m",
               "tab":["n1"]}},
 "uncomfortable":{"A":{"tab":["a1"]}},
 "unconscious":{"A":{"tab":["a1"]}},
 "uncover":{"V":{"tab":"v1"}},
 "under":{"Adv":{"tab":["b1"]},
          "P":{"tab":["pp"]}},
 "undergo":{"V":{"tab":"v48"}},
 "underground":{"A":{"tab":["a1"]}},
 "underline":{"V":{"tab":"v3"}},
 "undermine":{"V":{"tab":"v3"}},
 "underneath":{"Adv":{"tab":["b1"]},
               "P":{"tab":["pp"]}},
 "understand":{"V":{"tab":"v37"}},
 "understandable":{"A":{"tab":["a1"]}},
 "understanding":{"N":{"tab":["n1"]}},
 "undertake":{"V":{"tab":"v20"}},
 "undertaking":{"N":{"tab":["n1"]}},
 "undoubtedly":{"Adv":{"tab":["b1"]}},
 "uneasy":{"A":{"tab":["a1"]}},
 "unemployed":{"A":{"tab":["a1"]}},
 "unemployment":{"N":{"tab":["n5"]}},
 "unexpected":{"A":{"tab":["a1"]}},
 "unexpectedly":{"Adv":{"tab":["b1"]}},
 "unfair":{"A":{"tab":["a1"]}},
 "unfamiliar":{"A":{"tab":["a1"]}},
 "unfortunate":{"A":{"tab":["a1"]}},
 "unfortunately":{"Adv":{"tab":["b1"]}},
 "unhappy":{"A":{"tab":["a4"]}},
 "uniform":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "union":{"N":{"tab":["n1"]}},
 "unionist":{"N":{"tab":["n1"]}},
 "unique":{"A":{"tab":["a1"]}},
 "unit":{"N":{"tab":["n1"]}},
 "unite":{"V":{"tab":"v3"}},
 "united":{"A":{"tab":["a1"]}},
 "unity":{"N":{"tab":["n3"]}},
 "universal":{"A":{"tab":["a1"]}},
 "universe":{"N":{"tab":["n1"]}},
 "university":{"N":{"tab":["n3"]}},
 "unknown":{"A":{"tab":["a1"]}},
 "unless":{"C":{"tab":["cs"]}},
 "unlike":{"A":{"tab":["a1"]},
           "P":{"tab":["pp"]}},
 "unlikely":{"A":{"tab":["a1"]}},
 "unnecessary":{"A":{"tab":["a1"]}},
 "unpleasant":{"A":{"tab":["a1"]}},
 "unprecedented":{"A":{"tab":["a1"]}},
 "unreasonable":{"A":{"tab":["a1"]}},
 "unrest":{"N":{"tab":["n5"]}},
 "unsuccessful":{"A":{"tab":["a1"]}},
 "until":{"C":{"tab":["cs"]},
          "P":{"tab":["pp"]}},
 "unusual":{"A":{"tab":["a1"]}},
 "unusually":{"Adv":{"tab":["b1"]}},
 "unwilling":{"A":{"tab":["a1"]}},
 "up":{"Adv":{"tab":["b1"]},
       "P":{"tab":["pp"]}},
 "up-to-date":{"A":{"tab":["a1"]}},
 "update":{"V":{"tab":"v3"}},
 "upgrade":{"V":{"tab":"v3"}},
 "uphold":{"V":{"tab":"v34"}},
 "upon":{"P":{"tab":["pp"]}},
 "upper":{"A":{"tab":["a1"]}},
 "upset":{"V":{"tab":"v17"}},
 "upstairs":{"Adv":{"tab":["b1"]}},
 "upwards":{"Adv":{"tab":["b1"]}},
 "urban":{"A":{"tab":["a1"]}},
 "urge":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "urgency":{"N":{"tab":["n5"]}},
 "urgent":{"A":{"tab":["a1"]}},
 "urgently":{"Adv":{"tab":["b1"]}},
 "urine":{"N":{"tab":["n5"]}},
 "usage":{"N":{"tab":["n1"]}},
 "use":{"N":{"tab":["n1"]},
        "V":{"tab":"v3"}},
 "used":{"A":{"tab":["a1"]}},
 "useful":{"A":{"tab":["a1"]}},
 "useless":{"A":{"tab":["a1"]}},
 "user":{"N":{"tab":["n1"]}},
 "usual":{"A":{"tab":["a1"]}},
 "usually":{"Adv":{"tab":["b1"]}},
 "utility":{"N":{"tab":["n3"]}},
 "utter":{"V":{"tab":"v1"}},
 "utterance":{"N":{"tab":["n1"]}},
 "utterly":{"Adv":{"tab":["b1"]}},
 "vacant":{"A":{"tab":["a1"]}},
 "vacuum":{"N":{"tab":["n1"]}},
 "vague":{"A":{"tab":["a2"]}},
 "vaguely":{"Adv":{"tab":["b1"]}},
 "valid":{"A":{"tab":["a1"]}},
 "validity":{"N":{"tab":["n5"]}},
 "valley":{"N":{"tab":["n1"]}},
 "valuable":{"A":{"tab":["a1"]}},
 "valuation":{"N":{"tab":["n1"]}},
 "value":{"N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "valve":{"N":{"tab":["n1"]}},
 "van":{"N":{"tab":["n1"]}},
 "vanish":{"V":{"tab":"v2"}},
 "variable":{"A":{"tab":["a1"]},
             "N":{"tab":["n1"]}},
 "variant":{"N":{"tab":["n1"]}},
 "variation":{"N":{"tab":["n1"]}},
 "varied":{"A":{"tab":["a1"]}},
 "variety":{"N":{"tab":["n3"]}},
 "various":{"A":{"tab":["a1"]}},
 "vary":{"V":{"tab":"v4"}},
 "vast":{"A":{"tab":["a1"]}},
 "vat":{"N":{"tab":["n1"]}},
 "vegetable":{"N":{"tab":["n1"]}},
 "vegetation":{"N":{"tab":["n5"]}},
 "vehicle":{"N":{"tab":["n1"]}},
 "vein":{"N":{"tab":["n1"]}},
 "velocity":{"N":{"tab":["n3"]}},
 "velvet":{"N":{"tab":["n5"]}},
 "vendor":{"N":{"tab":["n1"]}},
 "venture":{"N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "venue":{"N":{"tab":["n1"]}},
 "verb":{"N":{"tab":["n1"]}},
 "verbal":{"A":{"tab":["a1"]}},
 "verdict":{"N":{"tab":["n1"]}},
 "verse":{"N":{"tab":["n1"]}},
 "version":{"N":{"tab":["n1"]}},
 "versus":{"P":{"tab":["pp"]}},
 "vertical":{"A":{"tab":["a1"]}},
 "very":{"A":{"tab":["a1"]},
         "Adv":{"tab":["b1"]}},
 "vessel":{"N":{"tab":["n1"]}},
 "veteran":{"N":{"tab":["n1"]}},
 "via":{"P":{"tab":["pp"]}},
 "viable":{"A":{"tab":["a1"]}},
 "vicar":{"N":{"tab":["n1"]}},
 "vicious":{"A":{"tab":["a1"]}},
 "victim":{"N":{"g":"x",
                "tab":["n1"]}},
 "victory":{"N":{"tab":["n3"]}},
 "video":{"N":{"tab":["n1"]}},
 "view":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "viewer":{"N":{"tab":["n1"]}},
 "viewpoint":{"N":{"tab":["n1"]}},
 "vigorous":{"A":{"tab":["a1"]}},
 "villa":{"N":{"tab":["n1"]}},
 "village":{"N":{"tab":["n1"]}},
 "villager":{"N":{"tab":["n1"]}},
 "violation":{"N":{"tab":["n1"]}},
 "violence":{"N":{"tab":["n5"]}},
 "violent":{"A":{"tab":["a1"]}},
 "virgin":{"N":{"tab":["n1"]}},
 "virtual":{"A":{"tab":["a1"]}},
 "virtually":{"Adv":{"tab":["b1"]}},
 "virtue":{"N":{"tab":["n1"]}},
 "virus":{"N":{"tab":["n2"]}},
 "visible":{"A":{"tab":["a1"]}},
 "vision":{"N":{"tab":["n1"]}},
 "visit":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "visitor":{"N":{"g":"x",
                 "tab":["n1"]}},
 "visual":{"A":{"tab":["a1"]}},
 "vital":{"A":{"tab":["a1"]}},
 "vitamin":{"N":{"tab":["n1"]}},
 "vivid":{"A":{"tab":["a1"]}},
 "vocabulary":{"N":{"tab":["n3"]}},
 "vocational":{"A":{"tab":["a1"]}},
 "voice":{"N":{"tab":["n1"]}},
 "voltage":{"N":{"tab":["n1"]}},
 "volume":{"N":{"tab":["n1"]}},
 "voluntary":{"A":{"tab":["a1"]}},
 "volunteer":{"N":{"g":"x",
                   "tab":["n1"]},
              "V":{"tab":"v1"}},
 "vote":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "voter":{"N":{"tab":["n1"]}},
 "voucher":{"N":{"tab":["n1"]}},
 "voyage":{"N":{"tab":["n1"]}},
 "vulnerable":{"A":{"tab":["a1"]}},
 "wage":{"N":{"tab":["n1"]}},
 "waist":{"N":{"tab":["n1"]}},
 "wait":{"V":{"tab":"v1"}},
 "waiter":{"N":{"g":"m",
                "tab":["n1"]}},
 "wake":{"N":{"tab":["n1"]},
         "V":{"tab":"v164"}},
 "walk":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "walker":{"N":{"tab":["n1"]}},
 "wall":{"N":{"tab":["n1"]}},
 "wander":{"V":{"tab":"v1"}},
 "want":{"N":{"tab":["n1"]},
         "V":{"tab":"v1"}},
 "war":{"N":{"tab":["n1"]}},
 "ward":{"N":{"tab":["n1"]}},
 "wardrobe":{"N":{"tab":["n1"]}},
 "warehouse":{"N":{"tab":["n1"]}},
 "warm":{"A":{"tab":["a3"]},
         "V":{"tab":"v1"}},
 "warmth":{"N":{"tab":["n5"]}},
 "warn":{"V":{"tab":"v1"}},
 "warning":{"N":{"tab":["n1"]}},
 "warrant":{"N":{"tab":["n1"]}},
 "warranty":{"N":{"tab":["n3"]}},
 "warrior":{"N":{"tab":["n1"]}},
 "wartime":{"N":{"tab":["n5"]}},
 "wary":{"A":{"tab":["a4"]}},
 "wash":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "washing":{"N":{"tab":["n5"]}},
 "waste":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]},
          "V":{"tab":"v3"}},
 "watch":{"N":{"tab":["n2"]},
          "V":{"tab":"v2"}},
 "water":{"N":{"tab":["n1"]}},
 "wave":{"N":{"tab":["n1"]},
         "V":{"tab":"v3"}},
 "way":{"N":{"tab":["n1"]}},
 "weak":{"A":{"tab":["a3"]}},
 "weaken":{"V":{"tab":"v1"}},
 "weakness":{"N":{"tab":["n2"]}},
 "wealth":{"N":{"tab":["n5"]}},
 "wealthy":{"A":{"tab":["a4"]}},
 "weapon":{"N":{"tab":["n1"]}},
 "wear":{"V":{"tab":"v30"}},
 "weather":{"N":{"tab":["n1"]}},
 "weave":{"V":{"tab":"v69"}},
 "wedding":{"N":{"tab":["n1"]}},
 "Wednesday":{"N":{"tab":["n1"]}},
 "wee":{"A":{"tab":["a1"]}},
 "weed":{"N":{"tab":["n1"]}},
 "week":{"N":{"tab":["n1"]}},
 "weekend":{"N":{"tab":["n1"]}},
 "weekly":{"A":{"tab":["a1"]}},
 "weep":{"V":{"tab":"v29"}},
 "weigh":{"V":{"tab":"v1"}},
 "weight":{"N":{"tab":["n1"]}},
 "weird":{"A":{"tab":["a3"]}},
 "welcome":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]},
            "V":{"tab":"v3"}},
 "welfare":{"N":{"tab":["n5"]}},
 "well":{"A":{"tab":["a19"]},
         "Adv":{"tab":["b3"]},
         "N":{"tab":["n1"]}},
 "well-known":{"A":{"tab":["a1"]}},
 "west":{"N":{"tab":["n5"]}},
 "western":{"A":{"tab":["a1"]}},
 "wet":{"A":{"tab":["a11"]},
        "V":{"tab":"v17"}},
 "whale":{"N":{"tab":["n1"]}},
 "what":{"D":{"tab":["d4"]}},
 "whatever":{"D":{"tab":["d4"]}},
 "whatsoever":{"D":{"tab":["d4"]}},
 "wheat":{"N":{"tab":["n5"]}},
 "wheel":{"N":{"tab":["n1"]}},
 "when":{"C":{"tab":["cs"]}},
 "whenever":{"Adv":{"tab":["b1"]}},
 "where":{"Pro":{"tab":["pn6"]}},
 "which":{"D":{"tab":["d4"]}},
 "whichever":{"D":{"tab":["d4"]}},
 "while":{"N":{"tab":["n5"]}},
 "whip":{"N":{"tab":["n1"]},
         "V":{"tab":"v12"}},
 "whisky":{"N":{"tab":["n3"]}},
 "whisper":{"N":{"tab":["n1"]},
            "V":{"tab":"v1"}},
 "white":{"A":{"tab":["a2"]},
          "N":{"tab":["n1"]}},
 "who":{"Pro":{"tab":["pn6"]}},
 "whoever":{"Pro":{"tab":["pn6"]}},
 "whole":{"A":{"tab":["a1"]},
          "N":{"tab":["n1"]}},
 "wholly":{"Adv":{"tab":["b1"]}},
 "whom":{"Pro":{"tab":["pn6"]}},
 "whose":{"D":{"tab":["d4"]}},
 "why":{"Pro":{"tab":["pn6"]}},
 "wicked":{"A":{"tab":["a1"]}},
 "wicket":{"N":{"tab":["n1"]}},
 "wide":{"A":{"tab":["a2"]},
         "Adv":{"tab":["b1"]}},
 "widely":{"Adv":{"tab":["b1"]}},
 "widen":{"V":{"tab":"v1"}},
 "widespread":{"A":{"tab":["a1"]}},
 "widow":{"N":{"g":"f",
               "tab":["n1"]}},
 "width":{"N":{"tab":["n1"]}},
 "wife":{"N":{"g":"f",
              "tab":["n91"]}},
 "wild":{"A":{"tab":["a3"]}},
 "wildly":{"Adv":{"tab":["b1"]}},
 "will":{"N":{"tab":["n1"]},
         "V":{"tab":"v81"}},
 "willing":{"A":{"tab":["a1"]}},
 "willingness":{"N":{"tab":["n5"]}},
 "win":{"N":{"tab":["n1"]},
        "V":{"tab":"v105"}},
 "wind":{"N":{"tab":["n1"]},
         "V":{"tab":"v25"}},
 "window":{"N":{"tab":["n1"]}},
 "wine":{"N":{"tab":["n1"]}},
 "wing":{"N":{"tab":["n1"]}},
 "winner":{"N":{"tab":["n1"]}},
 "winter":{"N":{"tab":["n1"]}},
 "wipe":{"V":{"tab":"v3"}},
 "wire":{"N":{"tab":["n1"]}},
 "wisdom":{"N":{"tab":["n5"]}},
 "wise":{"A":{"tab":["a2"]}},
 "wish":{"N":{"tab":["n2"]},
         "V":{"tab":"v2"}},
 "wit":{"N":{"tab":["n1"]}},
 "witch":{"N":{"g":"f",
               "tab":["n88"]}},
 "with":{"P":{"tab":["pp"]}},
 "withdraw":{"V":{"tab":"v54"}},
 "withdrawal":{"N":{"tab":["n1"]}},
 "within":{"Adv":{"tab":["b1"]},
           "P":{"tab":["pp"]}},
 "without":{"P":{"tab":["pp"]}},
 "witness":{"N":{"tab":["n2"]},
            "V":{"tab":"v2"}},
 "wolf":{"N":{"tab":["n9"]}},
 "woman":{"N":{"g":"f",
               "tab":["n90"]}},
 "wonder":{"N":{"tab":["n1"]},
           "V":{"tab":"v1"}},
 "wonderful":{"A":{"tab":["a1"]}},
 "wood":{"N":{"tab":["n1"]}},
 "wooden":{"A":{"tab":["a1"]}},
 "woodland":{"N":{"tab":["n1"]}},
 "wool":{"N":{"tab":["n1"]}},
 "word":{"N":{"tab":["n1"]}},
 "wording":{"N":{"tab":["n1"]}},
 "work":{"N":{"tab":["n1"]},
         "V":{"tab":"v94"}},
 "worker":{"N":{"g":"x",
                "tab":["n1"]}},
 "workforce":{"N":{"tab":["n1"]}},
 "working":{"A":{"tab":["a1"]},
            "N":{"tab":["n1"]}},
 "working-class":{"A":{"tab":["a1"]}},
 "workplace":{"N":{"tab":["n1"]}},
 "workshop":{"N":{"tab":["n1"]}},
 "world":{"N":{"tab":["n1"]}},
 "worldwide":{"A":{"tab":["a1"]}},
 "worm":{"N":{"tab":["n1"]}},
 "worried":{"A":{"tab":["a1"]}},
 "worry":{"N":{"tab":["n3"]},
          "V":{"tab":"v4"}},
 "worrying":{"A":{"tab":["a1"]}},
 "worship":{"N":{"tab":["n5"]}},
 "worth":{"N":{"tab":["n5"]}},
 "worthwhile":{"A":{"tab":["a1"]}},
 "worthy":{"A":{"tab":["a4"]}},
 "wound":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "wrap":{"V":{"tab":"v12"}},
 "wrist":{"N":{"tab":["n1"]}},
 "write":{"V":{"tab":"v36"}},
 "writer":{"N":{"g":"x",
                "tab":["n1"]}},
 "writing":{"N":{"tab":["n1"]}},
 "wrong":{"A":{"tab":["a3"]},
          "Adv":{"tab":["b1"]},
          "N":{"tab":["n1"]}},
 "yacht":{"N":{"tab":["n1"]}},
 "yard":{"N":{"tab":["n1"]}},
 "yarn":{"N":{"tab":["n1"]}},
 "year":{"N":{"tab":["n1"]}},
 "yell":{"V":{"tab":"v1"}},
 "yellow":{"A":{"tab":["a3"]}},
 "yes":{"N":{"tab":["n2"]}},
 "yesterday":{"Adv":{"tab":["b1"]}},
 "yet":{"Adv":{"tab":["b1"]}},
 "yield":{"N":{"tab":["n1"]},
          "V":{"tab":"v1"}},
 "young":{"A":{"tab":["a3"]}},
 "youngster":{"N":{"tab":["n1"]}},
 "youth":{"N":{"tab":["n1"]}},
 "zero":{"N":{"tab":["n1"]}},
 "zone":{"N":{"tab":["n1"]}},
 "zoo":{"N":{"tab":["n1"]}},
 "{":{"Pc":{"compl":"}",
            "tab":["pc5"]}},
 "}":{"Pc":{"compl":"{",
            "tab":["pc6"]}},
 "«":{"Pc":{"compl":"»",
            "tab":["pc7"]}},
 "»":{"Pc":{"compl":"«",
            "tab":["pc8"]}},
 "you":{"Pro":{"tab":["pn2-2"]}},
 "him":{"Pro":{"tab":["pn2-3sm"]}},
 "her":{"Pro":{"tab":["pn2-3sf"]}},
 "it":{"Pro":{"tab":["pn2-3sn"]}},
 "us":{"Pro":{"tab":["pn2-1p"]}},
 "them":{"Pro":{"tab":["pn2-3p"]}}
}
var ruleEn = //========== rule-en.js
{
    "conjugation": {
        "v1": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v2": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","es","","",""]
            }
        },
        "v3": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v4": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "ied",
                "pr": "ying",
                "pp": "ied",
                "p": ["y","y","ies","y","y","y"]
            }
        },
        "v5": {
            "ending": "b",
            "t": {
                "b": "b",
                "ps": "bbed",
                "pr": "bbing",
                "pp": "bbed",
                "p": ["b","b","bs","b","b","b"]
            }
        },
        "v6": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "dded",
                "pr": "dding",
                "pp": "dded",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v7": {
            "ending": "g",
            "t": {
                "b": "g",
                "ps": "gged",
                "pr": "gging",
                "pp": "gged",
                "p": ["g","g","gs","g","g","g"]
            }
        },
        "v8": {
            "ending": "k",
            "t": {
                "b": "k",
                "ps": "kked",
                "pr": "kking",
                "pp": "kked",
                "p": ["k","k","ks","k","k","k"]
            }
        },
        "v9": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "lled",
                "pr": "lling",
                "pp": "lled",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v10": {
            "ending": "m",
            "t": {
                "b": "m",
                "ps": "mmed",
                "pr": "mming",
                "pp": "mmed",
                "p": ["m","m","ms","m","m","m"]
            }
        },
        "v11": {
            "ending": "n",
            "t": {
                "b": "n",
                "ps": "nned",
                "pr": "nning",
                "pp": "nned",
                "p": ["n","n","ns","n","n","n"]
            }
        },
        "v12": {
            "ending": "p",
            "t": {
                "b": "p",
                "ps": "pped",
                "pr": "pping",
                "pp": "pped",
                "p": ["p","p","ps","p","p","p"]
            }
        },
        "v13": {
            "ending": "r",
            "t": {
                "b": "r",
                "ps": "rred",
                "pr": "rring",
                "pp": "rred",
                "p": ["r","r","rs","r","r","r"]
            }
        },
        "v14": {
            "ending": "t",
            "t": {
                "b": "t",
                "ps": "tted",
                "pr": "tting",
                "pp": "tted",
                "p": ["t","t","ts","t","t","t"]
            }
        },
        "v15": {
            "ending": "v",
            "t": {
                "b": "v",
                "ps": "vved",
                "pr": "vving",
                "pp": "vved",
                "p": ["v","v","vs","v","v","v"]
            }
        },
        "v16": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "d",
                "pr": "ing",
                "pp": "d",
                "p": ["","","s","","",""]
            }
        },
        "v17": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ting",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v18": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v19": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "id",
                "pr": "ying",
                "pp": "id",
                "p": ["y","y","ys","y","y","y"]
            }
        },
        "v20": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "ook",
                "pr": "aking",
                "pp": "aken",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v21": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ung",
                "pr": "inging",
                "pp": "ung",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v22": {
            "ending": "ed",
            "t": {
                "b": "ed",
                "ps": "d",
                "pr": "eding",
                "pp": "d",
                "p": ["ed","ed","eds","ed","ed","ed"]
            }
        },
        "v23": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "t",
                "pr": "ding",
                "pp": "t",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v24": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ked",
                "pr": "king",
                "pp": "ked",
                "p": ["","","s","","",""]
            }
        },
        "v25": {
            "ending": "ind",
            "t": {
                "b": "ind",
                "ps": "ound",
                "pr": "inding",
                "pp": "ound",
                "p": ["ind","ind","inds","ind","ind","ind"]
            }
        },
        "v26": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v27": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "own",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v28": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ying",
                "pp": "ied",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v29": {
            "ending": "ep",
            "t": {
                "b": "ep",
                "ps": "pt",
                "pr": "eping",
                "pp": "pt",
                "p": ["ep","ep","eps","ep","ep","ep"]
            }
        },
        "v30": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "ore",
                "pr": "earing",
                "pp": "orn",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v31": {
            "ending": "ell",
            "t": {
                "b": "ell",
                "ps": "old",
                "pr": "elling",
                "pp": "old",
                "p": ["ell","ell","ells","ell","ell","ell"]
            }
        },
        "v32": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v33": {
            "ending": "un",
            "t": {
                "b": "un",
                "ps": "an",
                "pr": "unning",
                "pp": "un",
                "p": ["un","un","uns","un","un","un"]
            }
        },
        "v34": {
            "ending": "old",
            "t": {
                "b": "old",
                "ps": "eld",
                "pr": "olding",
                "pp": "eld",
                "p": ["old","old","olds","old","old","old"]
            }
        },
        "v35": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "pr": "oing",
                "pp": "one",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v36": {
            "ending": "ite",
            "t": {
                "b": "ite",
                "ps": "ote",
                "pr": "iting",
                "pp": "itten",
                "p": ["ite","ite","ites","ite","ite","ite"]
            }
        },
        "v37": {
            "ending": "and",
            "t": {
                "b": "and",
                "ps": "ood",
                "pr": "anding",
                "pp": "ood",
                "p": ["and","and","ands","and","and","and"]
            }
        },
        "v38": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ting",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v39": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v40": {
            "ending": "ot",
            "t": {
                "b": "ot",
                "ps": "t",
                "pr": "oting",
                "pp": "t",
                "p": ["ot","ot","ots","ot","ot","ot"]
            }
        },
        "v41": {
            "ending": "ome",
            "t": {
                "b": "ome",
                "ps": "ame",
                "pr": "oming",
                "pp": "ome",
                "p": ["ome","ome","omes","ome","ome","ome"]
            }
        },
        "v42": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ove",
                "pr": "iving",
                "pp": "iven",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v43": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ave",
                "pr": "iving",
                "pp": "iven",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v44": {
            "ending": "it",
            "t": {
                "b": "it",
                "ps": "at",
                "pr": "itting",
                "pp": "at",
                "p": ["it","it","its","it","it","it"]
            }
        },
        "v45": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ought",
                "pr": "inking",
                "pp": "ought",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v46": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ang",
                "pr": "inging",
                "pp": "ung",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v47": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "pp": "idden",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v48": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pr": "going",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v49": {
            "ending": "eeze",
            "t": {
                "b": "eeze",
                "ps": "oze",
                "pr": "eezing",
                "pp": "ozen",
                "p": ["eeze","eeze","eezes","eeze","eeze","eeze"]
            }
        },
        "v50": {
            "ending": "ee",
            "t": {
                "b": "ee",
                "ps": "aw",
                "pr": "eeing",
                "pp": "een",
                "p": ["ee","ee","ees","ee","ee","ee"]
            }
        },
        "v51": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "ore",
                "pr": "earing",
                "pp": "orne",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v52": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v53": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "ded",
                "pr": "ding",
                "pp": "ded",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v54": {
            "ending": "aw",
            "t": {
                "b": "aw",
                "ps": "ew",
                "pr": "awing",
                "pp": "awn",
                "p": ["aw","aw","aws","aw","aw","aw"]
            }
        },
        "v55": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "t",
                "pr": "ing",
                "pp": "t",
                "p": ["","","s","","",""]
            }
        },
        "v56": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "sed",
                "pr": "sing",
                "pp": "sed",
                "p": ["","","ses","","",""]
            }
        },
        "v57": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v58": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v59": {
            "ending": "uy",
            "t": {
                "b": "uy",
                "ps": "ought",
                "pr": "uying",
                "pp": "ought",
                "p": ["uy","uy","uys","uy","uy","uy"]
            }
        },
        "v60": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v61": {
            "ending": "ke",
            "t": {
                "b": "ke",
                "ps": "de",
                "pr": "king",
                "pp": "de",
                "p": ["ke","ke","kes","ke","ke","ke"]
            }
        },
        "v62": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ived",
                "pr": "iving",
                "pp": "ived",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v63": {
            "ending": "ise",
            "t": {
                "b": "ise",
                "ps": "ose",
                "pr": "ising",
                "pp": "isen",
                "p": ["ise","ise","ises","ise","ise","ise"]
            }
        },
        "v64": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v65": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v66": {
            "ending": "ine",
            "t": {
                "b": "ine",
                "ps": "one",
                "pr": "ining",
                "pp": "one",
                "p": ["ine","ine","ines","ine","ine","ine"]
            }
        },
        "v67": {
            "ending": "ight",
            "t": {
                "b": "ight",
                "ps": "ought",
                "pr": "ighting",
                "pp": "ought",
                "p": ["ight","ight","ights","ight","ight","ight"]
            }
        },
        "v68": {
            "ending": "ght",
            "t": {
                "b": "ght",
                "ps": "ghted",
                "pr": "ghting",
                "pp": "ghted",
                "p": ["ght","ght","ghts","ght","ght","ght"]
            }
        },
        "v69": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "ove",
                "pr": "eaving",
                "pp": "oven",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v70": {
            "ending": "eat",
            "t": {
                "b": "eat",
                "ps": "ate",
                "pr": "eating",
                "pp": "eaten",
                "p": ["eat","eat","eats","eat","eat","eat"]
            }
        },
        "v71": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v72": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "eing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v73": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "d",
                "pr": "eing",
                "pp": "d",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v74": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "ten",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v75": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v76": {
            "ending": "all",
            "t": {
                "b": "all",
                "ps": "ell",
                "pr": "alling",
                "pp": "allen",
                "p": ["all","all","alls","all","all","all"]
            }
        },
        "v77": {
            "ending": "ad",
            "t": {
                "b": "ad",
                "ps": "d",
                "pr": "ading",
                "pp": "d",
                "p": ["ad","ad","ads","ad","ad","ad"]
            }
        },
        "v78": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "en",
                "p": ["","","s","","",""]
            }
        },
        "v79": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "id",
                "pr": "ying",
                "pp": "id",
                "p": ["y","y","ith","y","y","y"]
            }
        },
        "v80": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "ew",
                "pr": "ying",
                "pp": "own",
                "p": ["y","y","ies","y","y","y"]
            }
        },
        "v81": {
            "ending": "will",
            "t": {
                "b": "will",
                "p": "will",
                "ps": "would"
            }
        },
        "v82": {
            "ending": "whiz",
            "t": {
                "b": "whiz"
            }
        },
        "v83": {
            "ending": "ve",
            "t": {
                "b": "ve",
                "ps": "d",
                "pr": "ving",
                "pp": "d",
                "p": ["ve","ve","s","ve","ve","ve"]
            }
        },
        "v84": {
            "ending": "tch",
            "t": {
                "b": "tch",
                "ps": "ught",
                "pr": "tching",
                "pp": "ught",
                "p": ["tch","tch","tches","tch","tch","tch"]
            }
        },
        "v85": {
            "ending": "savvy",
            "t": {
                "b": "savvy"
            }
        },
        "v86": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "sed",
                "pr": "sing",
                "pp": "ses",
                "p": ["s","s","ses","s","s","s"]
            }
        },
        "v87": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "sed",
                "pr": "sing",
                "pp": "sed",
                "p": ["s","s","ses","s","s","s"]
            }
        },
        "v88": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["s","s","s","s","s","s"]
            }
        },
        "v89": {
            "ending": "rst",
            "t": {
                "b": "rst",
                "ps": "rst",
                "pr": "rsting",
                "pp": "rst",
                "p": ["rst","rst","rsts","rst","rst","rst"]
            }
        },
        "v90": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "owed",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v91": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "owed",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v92": {
            "ending": "othe",
            "t": {
                "b": "othe",
                "ps": "ad",
                "pr": "othing",
                "pp": "ad",
                "p": ["othe","othe","othes","othe","othe","othe"]
            }
        },
        "v93": {
            "ending": "ose",
            "t": {
                "b": "ose",
                "ps": "se",
                "pr": "osing",
                "pp": "sen",
                "p": ["ose","ose","oses","ose","ose","ose"]
            }
        },
        "v94": {
            "ending": "ork",
            "t": {
                "b": "ork",
                "ps": "orked",
                "pr": "orking",
                "pp": "orked",
                "p": ["ork","ork","orks","ork","ork","ork"]
            }
        },
        "v95": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v96": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "pr": "oing",
                "pp": "one",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v97": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "t",
                "pr": "ling",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v98": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": "ls"
            }
        },
        "v99": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": "ls"
            }
        },
        "v100": {
            "ending": "it",
            "t": {
                "b": "it",
                "ps": "at",
                "pr": "itting",
                "pp": "itted",
                "p": ["it","it","its","it","it","it"]
            }
        },
        "v101": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "unk",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v102": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v103": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ought",
                "pr": "inging",
                "pp": "ought",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v104": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "un",
                "pr": "inning",
                "pp": "un",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v105": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "on",
                "pr": "inning",
                "pp": "on",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v106": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "an",
                "pr": "inning",
                "pp": "un",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v107": {
            "ending": "im",
            "t": {
                "b": "im",
                "ps": "am",
                "pr": "imming",
                "pp": "um",
                "p": ["im","im","ims","im","im","im"]
            }
        },
        "v108": {
            "ending": "ike",
            "t": {
                "b": "ike",
                "ps": "uck",
                "pr": "iking",
                "pp": "uck",
                "p": ["ike","ike","ikes","ike","ike","ike"]
            }
        },
        "v109": {
            "ending": "ig",
            "t": {
                "b": "ig",
                "ps": "ug",
                "pr": "igging",
                "pp": "ug",
                "p": ["ig","ig","igs","ig","ig","ig"]
            }
        },
        "v110": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v111": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v112": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ieing",
                "pp": "ied",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v113": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ay",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v114": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v115": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "pp": "id",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v116": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ided",
                "pr": "iding",
                "pp": "ided",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v117": {
            "ending": "id",
            "t": {
                "b": "id",
                "ps": "ade",
                "pr": "idding",
                "pp": "id",
                "p": ["id","id","ids","id","id","id"]
            }
        },
        "v118": {
            "ending": "id",
            "t": {
                "b": "id",
                "ps": "ad",
                "pr": "idding",
                "pp": "idden",
                "p": ["id","id","ids","id","id","id"]
            }
        },
        "v119": {
            "ending": "ick",
            "t": {
                "b": "ick",
                "ps": "uck",
                "pr": "icking",
                "pp": "uck",
                "p": ["ick","ick","icks","ick","ick","ick"]
            }
        },
        "v120": {
            "ending": "have",
            "t": {
                "b": "have",
                "ps": "had",
                "pr": "having",
                "pp": "had",
                "p": ["have","have","has","have","have","have"]
            }
        },
        "v121": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v122": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pr": "going",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v123": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "t",
                "pr": "eting",
                "pp": "t",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v124": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "ot",
                "pr": "etting",
                "pp": "ot",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v125": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "ot",
                "pr": "etting",
                "pp": "otten",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v126": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "at",
                "pp": "otten"
            }
        },
        "v127": {
            "ending": "elt",
            "t": {
                "b": "elt",
                "ps": "elted",
                "pr": "elting",
                "pp": "elted",
                "p": ["elt","elt","elts","elt","elt","elt"]
            }
        },
        "v128": {
            "ending": "ell",
            "t": {
                "b": "ell",
                "ps": "elled",
                "pr": "elling",
                "pp": "elled",
                "p": ["ell","ell","ells","ell","ell","ell"]
            }
        },
        "v129": {
            "ending": "el",
            "t": {
                "b": "el",
                "ps": "lt",
                "pr": "eling",
                "pp": "lt",
                "p": ["el","el","els","el","el","el"]
            }
        },
        "v130": {
            "ending": "el",
            "t": {
                "b": "el",
                "ps": "eled",
                "pr": "eling",
                "pp": "eled",
                "p": ["el","el","els","el","el","el"]
            }
        },
        "v131": {
            "ending": "eek",
            "t": {
                "b": "eek",
                "ps": "ought",
                "pr": "eeking",
                "pp": "ought",
                "p": ["eek","eek","eeks","eek","eek","eek"]
            }
        },
        "v132": {
            "ending": "eech",
            "t": {
                "b": "eech",
                "ps": "eeched",
                "pr": "eeching",
                "pp": "eeched",
                "p": ["eech","eech","eeches","eech","eech","eech"]
            }
        },
        "v133": {
            "ending": "ed",
            "t": {
                "b": "ed",
                "ps": "d",
                "pr": "eding",
                "pp": "d",
                "p": ["ed","ed","eds","ed","ed","ed"]
            }
        },
        "v134": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "eaved",
                "pr": "eaving",
                "pp": "eaved",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v135": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "ave",
                "pr": "eaving",
                "pp": "eaved",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v136": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "eared",
                "pr": "earing",
                "pp": "eared",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v137": {
            "ending": "eal",
            "t": {
                "b": "eal",
                "ps": "ole",
                "pr": "ealing",
                "pp": "olen",
                "p": ["eal","eal","eals","eal","eal","eal"]
            }
        },
        "v138": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "oke",
                "pr": "eaking",
                "pp": "oken",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v139": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "oke",
                "pr": "eaking",
                "pp": "oke",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v140": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "ake",
                "pr": "eaking",
                "pp": "oken",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v141": {
            "ending": "ead",
            "t": {
                "b": "ead",
                "ps": "od",
                "pr": "eading",
                "pp": "od",
                "p": ["ead","ead","eads","ead","ead","ead"]
            }
        },
        "v142": {
            "ending": "each",
            "t": {
                "b": "each",
                "ps": "aught",
                "pr": "eaching",
                "pp": "aught",
                "p": ["each","each","eaches","each","each","each"]
            }
        },
        "v143": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "t",
                "pr": "ing",
                "pp": "t",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v145": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "e",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v146": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "den",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v147": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "den",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v148": {
            "ending": "de",
            "t": {
                "b": "de",
                "ps": "id",
                "pp": "den"
            }
        },
        "v149": {
            "ending": "born",
            "t": {
                "pp": "born"
            }
        },
        "v150": {
            "ending": "beware",
            "t": {
                "b": "beware"
            }
        },
        "v151": {
            "ending": "be",
            "t": {
                "b": "be",
                "ps": ["was","were","was","were","were","were"],
                "pr": "being",
                "pp": "been",
                "p": ["am","are","is","are","are","are"]
            }
        },
        "v152": {
            "ending": "be",
            "t": {
                "b": "be",
                "p": ["'m","'re","is","'re","'re","'re"],
                "ps": ["was","were","was","were","were","were"],
                "pr": "being",
                "pp": "been"
            }
        },
        "v153": {
            "ending": "ay",
            "t": {
                "b": "ay",
                "ps": "ight",
                "p": ["ay","ay","ay","ay","ay","ay"]
            }
        },
        "v154": {
            "ending": "ay",
            "t": {
                "b": "ay",
                "ps": "ew",
                "pr": "aying",
                "pp": "ain",
                "p": ["ay","ay","ays","ay","ay","ay"]
            }
        },
        "v155": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "ft",
                "pr": "aving",
                "pp": "ft",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v156": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "aved",
                "pr": "aving",
                "pp": "aved",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v157": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "aved",
                "pr": "aving",
                "pp": "aved",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v158": {
            "ending": "are",
            "t": {
                "b": "are",
                "ps": "are",
                "p": ["are","are","aren't","are","are","are"]
            }
        },
        "v159": {
            "ending": "ang",
            "t": {
                "b": "ang",
                "ps": "ung",
                "pr": "anging",
                "pp": "ung",
                "p": ["ang","ang","angs","ang","ang","ang"]
            }
        },
        "v160": {
            "ending": "ang",
            "t": {
                "b": "ang",
                "ps": "anged",
                "pr": "anging",
                "pp": "anged",
                "p": ["ang","ang","angs","ang","ang","ang"]
            }
        },
        "v161": {
            "ending": "an",
            "t": {
                "b": "an",
                "ps": "ould",
                "p": ["an","an","an","an","an","an"]
            }
        },
        "v162": {
            "ending": "all",
            "t": {
                "b": "all",
                "p": "all",
                "ps": "ould"
            }
        },
        "v163": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "oke",
                "pr": "aking",
                "pp": "oke",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v164": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "oke",
                "pr": "aking",
                "pp": "oken",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v165": {
            "ending": "ad",
            "t": {
                "b": "ad",
                "ps": "aded",
                "pr": "ading",
                "pp": "aded",
                "p": ["ad","ad","ads","ad","ad","ad"]
            }
        },
        "v166": {
            "ending": "must",
            "t": {
                "b": "must",
                "p":"must",
                "ps":"must"
            }
        },
        "v167": {
            "ending": "",
            "t": {
                "b": "",
                "p": ["","","n't","","",""]
            }
        },
        "v168": {
            "ending": "ought",
            "t": {
                "b": "",
                "p": "ought",
                "ps":"ought"
            }
        },
        "v169": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "zed",
                "pr": "zing",
                "pp": "zed",
                "p": ["","","zes","","",""]
            }
        },
        "v170": {
            "ending": "",
            "t": {
                "b": "",
                "pp": "n"
            }
        },
        "v171": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v172": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","es","","",""]
            }
        },
        "v173": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v174": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v175": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "p": ["","","s","","",""]
            }
        },
        "v176": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": ""
            }
        },
        "v177": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v178": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "",
                "pp": "",
                "p": ["","","","","",""]
            }
        },
        "v179": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "'d",
                "pr": "ing",
                "pp": "'d",
                "p": ["","","s","","",""]
            }
        },
        "v180": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "'d",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v181": {
            "ending": "ll",
            "t": {
                "b": "ll",
                "ps": "lled",
                "pr": "lling",
                "pp": "lled",
                "p": ["ll","ll","ls","ll","ll","ll"]
            }
        }
    },
    "declension": {
        "n1": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "s","n": "p"
            }]
        },
        "n2": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "es","n": "p"
            }]
        },
        "n3": {
            "ending": "y",
            "declension": [{
                "val": "y","n": "s"
            },{
                "val": "ies","n": "p"
            }]
        },
        "n4": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "","n": "p"
            }]
        },
        "n5": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            }]
        },
        "n6": {
            "ending": "",
            "declension": [{
                "val": "","n": "p"
            }]
        },
        "n7": {
            "ending": "an",
            "declension": [{
                "val": "an","n": "s"
            },{
                "val": "en","n": "p"
            }]
        },
        "n8": {
            "ending": "is",
            "declension": [{
                "val": "is","n": "s"
            },{
                "val": "es","n": "p"
            }]
        },
        "n9": {
            "ending": "f",
            "declension": [{
                "val": "f","n": "s"
            },{
                "val": "ves","n": "p"
            }]
        },
        "n10": {
            "ending": "fe",
            "declension": [{
                "val": "fe","n": "s"
            },{
                "val": "ves","n": "p"
            }]
        },
        "n11": {
            "ending": "um",
            "declension": [{
                "val": "um","n": "s"
            },{
                "val": "a","n": "p"
            }]
        },
        "n12": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n13": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "e","n": "p"
            }]
        },
        "n14": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "x","n": "p"
            }]
        },
        "n15": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "ren","n": "p"
            }]
        },
        "n16": {
            "ending": "ouse",
            "declension": [{
                "val": "ouse","n": "s"
            },{
                "val": "ice","n": "p"
            }]
        },
        "n17": {
            "ending": "-in-law",
            "declension": [{
                "val": "-in-law","n": "s"
            },{
                "val": "s-in-law","n": "p"
            }]
        },
        "n18": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "'s","n": "p"
            }]
        },
        "n19": {
            "ending": "oot",
            "declension": [{
                "val": "oot","n": "s"
            },{
                "val": "eet","n": "p"
            }]
        },
        "n20": {
            "ending": "ooth",
            "declension": [{
                "val": "ooth","n": "s"
            },{
                "val": "eeth","n": "p"
            }]
        },
        "n21": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "en","n": "p"
            }]
        },
        "n22": {
            "ending": "ex",
            "declension": [{
                "val": "ex","n": "s"
            },{
                "val": "ices","n": "p"
            }]
        },
        "n23": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ices","n": "p"
            }]
        },
        "n24": {
            "ending": "-on",
            "declension": [{
                "val": "-on","n": "s"
            },{
                "val": "s-on","n": "p"
            }]
        },
        "n25": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "era","n": "p"
            }]
        },
        "n26": {
            "ending": "on",
            "declension": [{
                "val": "on","n": "s"
            },{
                "val": "a","n": "p"
            }]
        },
        "n27": {
            "ending": "an-at-arms",
            "declension": [{
                "val": "an-at-arms","n": "s"
            },{
                "val": "en-at-arms","n": "p"
            }]
        },
        "n28": {
            "ending": "-at-arms",
            "declension": [{
                "val": "-at-arms","n": "s"
            },{
                "val": "s-at-arms","n": "p"
            }]
        },
        "n29": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "er","n": "p"
            }]
        },
        "n30": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n31": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "im","n": "p"
            }]
        },
        "n32": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "r","n": "p"
            }]
        },
        "n33": {
            "ending": "-by",
            "declension": [{
                "val": "-by","n": "s"
            },{
                "val": "s-by","n": "p"
            }]
        },
        "n34": {
            "ending": "a",
            "declension": [{
                "val": "a","n": "s"
            },{
                "val": "or","n": "p"
            }]
        },
        "n35": {
            "ending": "e",
            "declension": [{
                "val": "e","n": "s"
            },{
                "val": "ae","n": "p"
            }]
        },
        "n36": {
            "ending": "e",
            "declension": [{
                "val": "e","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n37": {
            "ending": "o",
            "declension": [{
                "val": "o","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n38": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "ora","n": "p"
            }]
        },
        "n39": {
            "ending": "-in",
            "declension": [{
                "val": "-in","n": "s"
            },{
                "val": "s-in","n": "p"
            }]
        },
        "n40": {
            "ending": "oose",
            "declension": [{
                "val": "oose","n": "s"
            },{
                "val": "eese","n": "p"
            }]
        },
        "n41": {
            "ending": "y-in-waiting",
            "declension": [{
                "val": "y-in-waiting","n": "s"
            },{
                "val": "ies-in-waiting","n": "p"
            }]
        },
        "n42": {
            "ending": "-out",
            "declension": [{
                "val": "-out","n": "s"
            },{
                "val": "s-out","n": "p"
            }]
        },
        "n43": {
            "ending": "-up",
            "declension": [{
                "val": "-up","n": "s"
            },{
                "val": "s-up","n": "p"
            }]
        },
        "n44": {
            "ending": "s",
            "declension": [{
                "val": "s","n": "s"
            },{
                "val": "des","n": "p"
            }]
        },
        "n45": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ces","n": "p"
            }]
        },
        "n46": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "een","n": "p"
            }]
        },
        "n47": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "in","n": "p"
            }]
        },
        "n48": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ges","n": "p"
            }]
        },
        "n49": {
            "ending": "an-of-war",
            "declension": [{
                "val": "an-of-war","n": "s"
            },{
                "val": "en-of-war","n": "p"
            }]
        },
        "n50": {
            "ending": "ey",
            "declension": [{
                "val": "ey","n": "s"
            },{
                "val": "ies","n": "p"
            }]
        },
        "n51": {
            "ending": "Grand Prix",
            "declension": [{
                "val": "Grand Prix","n": "s"
            },{
                "val": "Grands Prix","n": "p"
            }]
        },
        "n52": {
            "ending": "Madame",
            "declension": [{
                "val": "Madame","n": "s"
            },{
                "val": "Mesdames","n": "p"
            }]
        },
        "n53": {
            "ending": "Mademoiselle",
            "declension": [{
                "val": "Mademoiselle","n": "s"
            },{
                "val": "Mesdemoiselles","n": "p"
            }]
        },
        "n54": {
            "ending": "Monsieur",
            "declension": [{
                "val": "Monsieur","n": "s"
            },{
                "val": "Messieurs","n": "p"
            }]
        },
        "n55": {
            "ending": "Mr",
            "declension": [{
                "val": "Mr","n": "s"
            },{
                "val": "Messrs","n": "p"
            }]
        },
        "n56": {
            "ending": "agent provocateur",
            "declension": [{
                "val": "agent provocateur","n": "s"
            },{
                "val": "agents provocateurs","n": "p"
            }]
        },
        "n57": {
            "ending": "aide-de-camp",
            "declension": [{
                "val": "aide-de-camp","n": "s"
            },{
                "val": "aides-de-camp","n": "p"
            }]
        },
        "n58": {
            "ending": "auto-da-fé",
            "declension": [{
                "val": "auto-da-fé","n": "s"
            },{
                "val": "autos-da-fé","n": "p"
            }]
        },
        "n59": {
            "ending": "bête noire",
            "declension": [{
                "val": "bête noire","n": "s"
            },{
                "val": "bêtes noires","n": "p"
            }]
        },
        "n60": {
            "ending": "billet-doux",
            "declension": [{
                "val": "billet-doux","n": "s"
            },{
                "val": "billets-doux","n": "p"
            }]
        },
        "n61": {
            "ending": "bon mot",
            "declension": [{
                "val": "bon mot","n": "s"
            },{
                "val": "bons mots","n": "p"
            }]
        },
        "n62": {
            "ending": "brother",
            "declension": [{
                "val": "brother","n": "s"
            },{
                "val": "brethren","n": "p"
            }]
        },
        "n63": {
            "ending": "carte blanche",
            "declension": [{
                "val": "carte blanche","n": "s"
            },{
                "val": "cartes blanches","n": "p"
            }]
        },
        "n64": {
            "ending": "chef-d'oeuvre",
            "declension": [{
                "val": "chef-d'oeuvre","n": "s"
            },{
                "val": "chefs-d'oeuvre","n": "p"
            }]
        },
        "n65": {
            "ending": "cor anglais",
            "declension": [{
                "val": "cor anglais","n": "s"
            },{
                "val": "cors anglais","n": "p"
            }]
        },
        "n66": {
            "ending": "coup d'etat",
            "declension": [{
                "val": "coup d'etat","n": "s"
            },{
                "val": "coups d'etat","n": "p"
            }]
        },
        "n67": {
            "ending": "coup de grace",
            "declension": [{
                "val": "coup de grace","n": "s"
            },{
                "val": "coups de grace","n": "p"
            }]
        },
        "n68": {
            "ending": "court-martial",
            "declension": [{
                "val": "court-martial","n": "s"
            },{
                "val": "courts-martial","n": "p"
            }]
        },
        "n69": {
            "ending": "cow",
            "declension": [{
                "val": "cow","n": "s"
            },{
                "val": "kine","n": "p"
            }]
        },
        "n70": {
            "ending": "curriculum vitae",
            "declension": [{
                "val": "curriculum vitae","n": "s"
            },{
                "val": "curricula vitae","n": "p"
            }]
        },
        "n71": {
            "ending": "enfant terrible",
            "declension": [{
                "val": "enfant terrible","n": "s"
            },{
                "val": "enfants terribles","n": "p"
            }]
        },
        "n72": {
            "ending": "fait accompli",
            "declension": [{
                "val": "fait accompli","n": "s"
            },{
                "val": "faits accomplis","n": "p"
            }]
        },
        "n73": {
            "ending": "fleur-de-lis",
            "declension": [{
                "val": "fleur-de-lis","n": "s"
            },{
                "val": "fleurs-de-lis","n": "p"
            }]
        },
        "n74": {
            "ending": "fleur-de-lys",
            "declension": [{
                "val": "fleur-de-lys","n": "s"
            },{
                "val": "fleurs-de-lys","n": "p"
            }]
        },
        "n75": {
            "ending": "ignis fatuus",
            "declension": [{
                "val": "ignis fatuus","n": "s"
            },{
                "val": "ignes fatui","n": "p"
            }]
        },
        "n76": {
            "ending": "knight-errant",
            "declension": [{
                "val": "knight-errant","n": "s"
            },{
                "val": "knights-errant","n": "p"
            }]
        },
        "n77": {
            "ending": "nom de plume",
            "declension": [{
                "val": "nom de plume","n": "s"
            },{
                "val": "noms de plume","n": "p"
            }]
        },
        "n78": {
            "ending": "nouveau riche",
            "declension": [{
                "val": "nouveau riche","n": "s"
            },{
                "val": "nouveaux riches","n": "p"
            }]
        },
        "n79": {
            "ending": "penny",
            "declension": [{
                "val": "penny","n": "s"
            },{
                "val": "pence","n": "p"
            }]
        },
        "n80": {
            "ending": "petit bourgeois",
            "declension": [{
                "val": "petit bourgeois","n": "s"
            },{
                "val": "petits bourgeois","n": "p"
            }]
        },
        "n81": {
            "ending": "señor",
            "declension": [{
                "val": "señor","n": "s"
            },{
                "val": "senores","n": "p"
            }]
        },
        "n82": {
            "ending": "sock",
            "declension": [{
                "val": "sock","n": "s"
            },{
                "val": "sox","n": "p"
            }]
        },
        "n83": {
            "ending": "tableau vivant",
            "declension": [{
                "val": "tableau vivant","n": "s"
            },{
                "val": "tableaux vivants","n": "p"
            }]
        },
        "n84": {
            "ending": "wagon-lit",
            "declension": [{
                "val": "wagon-lit","n": "s"
            },{
                "val": "wagons-lit","n": "p"
            }]
        },
        "n85": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            }]
        },
        "n86": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "es","g": "m","n": "p"
            }]
        },
        "n87": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "s","g": "f","n": "p"
            }]
        },
        "n88": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n89": {
            "ending": "an",
            "declension": [{
                "val": "an","g": "m","n": "s"
            },{
                "val": "en","g": "m","n": "p"
            }]
        },
        "n90": {
            "ending": "an",
            "declension": [{
                "val": "an","g": "f","n": "s"
            },{
                "val": "en","g": "f","n": "p"
            }]
        },
        "n91": {
            "ending": "fe",
            "declension": [{
                "val": "fe","g": "f","n": "s"
            },{
                "val": "ves","g": "f","n": "p"
            }]
        },
        "a1": {
            "ending": "",
            "declension": [{
                "val": ""
            }]
        },
        "a2": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "r","f": "co"
            },{
                "val": "st","f": "su"
            }]
        },
        "a3": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "er","f": "co"
            },{
                "val": "est","f": "su"
            }]
        },
        "a4": {
            "ending": "y",
            "declension": [{
                "val": "y"
            },{
                "val": "ier","f": "co"
            },{
                "val": "iest","f": "su"
            }]
        },
        "a5": {
            "ending": "b",
            "declension": [{
                "val": "b"
            },{
                "val": "bber","f": "co"
            },{
                "val": "bbest","f": "su"
            }]
        },
        "a6": {
            "ending": "d",
            "declension": [{
                "val": "d"
            },{
                "val": "dder","f": "co"
            },{
                "val": "ddest","f": "su"
            }]
        },
        "a7": {
            "ending": "g",
            "declension": [{
                "val": "g"
            },{
                "val": "gger","f": "co"
            },{
                "val": "ggest","f": "su"
            }]
        },
        "a8": {
            "ending": "l",
            "declension": [{
                "val": "l"
            },{
                "val": "ller","f": "co"
            },{
                "val": "llest","f": "su"
            }]
        },
        "a9": {
            "ending": "m",
            "declension": [{
                "val": "m"
            },{
                "val": "mmer","f": "co"
            },{
                "val": "mmest","f": "su"
            }]
        },
        "a10": {
            "ending": "n",
            "declension": [{
                "val": "n"
            },{
                "val": "nner","f": "co"
            },{
                "val": "nnest","f": "su"
            }]
        },
        "a11": {
            "ending": "t",
            "declension": [{
                "val": "t"
            },{
                "val": "tter","f": "co"
            },{
                "val": "ttest","f": "su"
            }]
        },
        "a12": {
            "ending": "ey",
            "declension": [{
                "val": "ey"
            },{
                "val": "ier","f": "co"
            },{
                "val": "iest","f": "su"
            }]
        },
        "a13": {
            "ending": "y",
            "declension": [{
                "val": "y"
            },{
                "val": "er","f": "co"
            },{
                "val": "est","f": "su"
            }]
        },
        "a14": {
            "ending": "bad",
            "declension": [{
                "val": "bad"
            },{
                "val": "worse","f": "co"
            },{
                "val": "worst","f": "su"
            }]
        },
        "a15": {
            "ending": "good",
            "declension": [{
                "val": "good"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "a16": {
            "ending": "old",
            "declension": [{
                "val": "old"
            },{
                "val": "older","f": "co"
            },{
                "val": "oldest","f": "su"
            }]
        },
        "a17": {
            "ending": "far",
            "declension": [{
                "val": "far"
            },{
                "val": "farther","f": "co"
            },{
                "val": "farthest","f": "su"
            }]
        },
        "a18": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "st","f": "su"
            }]
        },
        "a19": {
            "ending": "well",
            "declension": [{
                "val": "well"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "pn0": {
            "ending": "one",
            "declension": [{
                "val": "one","n": "x","g": "x", "tn":""
            },{
                "val": "oneself","n": "x","g": "x", "tn":"refl"
            },{
                "val": "one","n": "x","g": "x", "c":"nom"
            },{
                "val": "one","n": "x","g": "x", "c":"acc"
            },{
                "val": "one","n": "x","g": "x", "c":"dat"
            },{
                "val": "one","n": "x","g": "x", "c":"gen"
            }]
        },
        "pn1": {
            "ending": "I",
            "declension": [{
                "val": "I","pe": 1,"n": "s","g": "x"
            },{
                "val": "you","pe": 2,"n": "x","g": "x"
            },{
                "val": "he","pe": 3,"n": "s","g": "m"
            },{
                "val": "it","pe": 3,"n": "s","g": "n"
            },{
                "val": "she","pe": 3,"n": "s","g": "f"
            },{
                "val": "we","pe": 1,"n": "p","g": "x"
            },{
                "val": "they","pe": 3,"n": "p","g": "x"
            }]
        },
        "pn2": {
            "ending": "me",
            "declension": [{
                "val": "me","pe": 1,"n": "s","g": "x", "tn":""
            },{
                "val": "you","pe": 2,"n": "x","g": "x", "tn":""
            },{
                "val": "her","pe": 3,"n": "s","g": "f", "tn":""
            },{
                "val": "him","pe": 3,"n": "s","g": "m", "tn":""
            },{
                "val": "it","pe": 3,"n": "s","g": "n", "tn":""
            },{
                "val": "us","pe": 1,"n": "p","g": "x", "tn":""
            },{
                "val": "them","pe": 3,"n": "p","g": "x", "tn":""
            },{
                "val": "myself","pe": 1,"n": "s","g": "x", "tn":"refl"
            },{
                "val": "yourself","pe": 2,"n": "x","g": "x", "tn":"refl"
            },{
                "val": "herself","pe": 3,"n": "s","g": "f", "tn":"refl"
            },{
                "val": "himself","pe": 3,"n": "s","g": "m", "tn":"refl"
            },{
                "val": "itself","pe": 3,"n": "s","g": "n", "tn":"refl"
            },{
                "val": "ourself","pe": 1,"n": "p","g": "x", "tn":"refl"
            },{
                "val": "themselves","pe": 3,"n": "p","g": "x", "tn":"refl"
            },{
                "val": "I","pe": 1,"n": "s","g": "x", "c":"nom"
            },{
                "val": "you","pe": 2,"n": "x","g": "x", "c":"nom"
            },{
                "val": "she","pe": 3,"n": "s","g": "f", "c":"nom"
            },{
                "val": "he","pe": 3,"n": "s","g": "m", "c":"nom"
            },{
                "val": "it","pe": 3,"n": "s","g": "n", "c":"nom"
            },{
                "val": "we","pe": 1,"n": "p","g": "x", "c":"nom"
            },{
                "val": "they","pe": 3,"n": "p","g": "x", "c":"nom"
            },{
                "val": "me","pe": 1,"n": "s","g": "x", "c":"acc"
            },{
                "val": "you","pe": 2,"n": "x","g": "x", "c":"acc"
            },{
                "val": "her","pe": 3,"n": "s","g": "f", "c":"acc"
            },{
                "val": "him","pe": 3,"n": "s","g": "m", "c":"acc"
            },{
                "val": "it","pe": 3,"n": "s","g": "n", "c":"acc"
            },{
                "val": "us","pe": 1,"n": "p","g": "x", "c":"acc"
            },{
                "val": "them","pe": 3,"n": "p","g": "x", "c":"acc"
            },{
                "val": "me","pe": 1,"n": "s","g": "x", "c":"dat"
            },{
                "val": "you","pe": 2,"n": "x","g": "x", "c":"dat"
            },{
                "val": "her","pe": 3,"n": "s","g": "f", "c":"dat"
            },{
                "val": "him","pe": 3,"n": "s","g": "m", "c":"dat"
            },{
                "val": "it","pe": 3,"n": "s","g": "n", "c":"dat"
            },{
                "val": "us","pe": 1,"n": "p","g": "x", "c":"dat"
            },{
                "val": "them","pe": 3,"n": "p","g": "x", "c":"dat"
            },{
                "val": "mine","pe": 1,"n": "s","g": "x", "c":"gen"
            },{
                "val": "yours","pe": 2,"n": "x","g": "x", "c":"gen"
            },{
                "val": "hers","pe": 3,"n": "s","g": "f", "c":"gen"
            },{
                "val": "his","pe": 3,"n": "s","g": "m", "c":"gen"
            },{
                "val": "its","pe": 3,"n": "s","g": "n", "c":"gen"
            },{
                "val": "ours","pe": 1,"n": "p","g": "x", "c":"gen"
            },{
                "val": "theirs","pe": 3,"n": "p","g": "x", "c":"gen"
            }]
        },
        "pn2-2": {
            "ending": "you",
            "declension": [{
                "val": "you","n": "x","g": "x", "tn":"", "pe":2,
            },{
                "val": "yourself","n": "x","g": "x", "tn":"refl", "pe":2,
            },{
                "val": "you","n": "x","g": "x", "c":"nom", "pe":2,
            },{
                "val": "you","n": "x","g": "x", "c":"acc", "pe":2,
            },{
                "val": "you","n": "x","g": "x", "c":"dat", "pe":2,
            },{
                "val": "yours","n": "x","g": "x", "c":"gen", "pe":2,
            }]
        },
        "pn2-3sm": {
            "ending": "him",
            "declension": [{
                "val": "him","n": "s","g": "m", "tn":"", "pe":3,
            },{
                "val": "himself","n": "s","g": "m", "tn":"refl", "pe":3,
            },{
                "val": "he","n": "s","g": "m", "c":"nom", "pe":3,
            },{
                "val": "him","n": "s","g": "m", "c":"acc", "pe":3,
            },{
                "val": "him","n": "s","g": "m", "c":"dat", "pe":3,
            },{
                "val": "his","n": "s","g": "m", "c":"gen", "pe":3,
            }]
        },
        "pn2-3sf": {
            "ending": "her",
            "declension": [{
                "val": "her","n": "s","g": "f", "tn":"", "pe":3,
            },{
                "val": "herself","n": "s","g": "f", "tn":"refl", "pe":3,
            },{
                "val": "she","n": "s","g": "f", "c":"nom", "pe":3,
            },{
                "val": "her","n": "s","g": "f", "c":"acc", "pe":3,
            },{
                "val": "her","n": "s","g": "f", "c":"dat", "pe":3,
            },{
                "val": "hers","n": "s","g": "f", "c":"gen", "pe":3,
            }]
        },
        "pn2-3sn": {
            "ending": "it",
            "declension": [{
                "val": "it","n": "s","g": "n", "tn":"", "pe":3,
            },{
                "val": "itself","n": "s","g": "n", "tn":"refl", "pe":3,
            },{
                "val": "it","n": "s","g": "n", "c":"nom", "pe":3,
            },{
                "val": "it","n": "s","g": "n", "c":"acc", "pe":3,
            },{
                "val": "it","n": "s","g": "n", "c":"dat", "pe":3,
            },{
                "val": "itself","n": "s","g": "n", "c":"gen", "pe":3,
            }]
        },
        "pn2-1p": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "p","g": "x", "tn":"", "pe":1
            },{
                "val": "ourself","n": "p","g": "x", "tn":"refl", "pe":1
            },{
                "val": "we","n": "p","g": "x", "c":"nom", "pe":1
            },{
                "val": "us","n": "p","g": "x", "c":"acc", "pe":1
            },{
                "val": "us","n": "p","g": "x", "c":"dat", "pe":1
            },{
                "val": "ours","n": "p","g": "x", "c":"gen", "pe":1
            }]
        },
        "pn2-3p": {
            "ending": "them",
            "declension": [{
                "val": "them","n": "p","g": "x", "tn":"", "pe":3,
            },{
                "val": "themselves","n": "p","g": "x", "tn":"refl", "pe":3,
            },{
                "val": "they","n": "p","g": "x", "c":"nom", "pe":3,
            },{
                "val": "them","n": "p","g": "x", "c":"acc", "pe":3,
            },{
                "val": "them","n": "p","g": "x", "c":"dat", "pe":3,
            },{
                "val": "theirs","n": "p","g": "x", "c":"gen", "pe":3,
            }]
        },
        "pn3": {
            "ending": "mine",
            "declension": [{
                "val": "mine","pe": 1,"n": "s","g": "x","own": "s"
            },{
                "val": "yours","pe": 2,"n": "x","g": "x","own": "x"
            },{
                "val": "hers","pe": 3,"n": "s","g": "f","own": "s"
            },{
                "val": "his","pe": 3,"n": "s","g": "m","own": "s"
            },{
                "val": "its","pe": 3,"n": "s","g": "n","own": "s"
            },{
                "val": "ours","pe": 1,"n": "p","g": "x","own": "p"
            },{
                "val": "theirs","pe": 3,"n": "p","g": "x","own": "p"
            }]
        },
        "pn4": {
            "ending": "myself",
            "declension": [{
                "val": "myself","pe": 1,"n": "s","g": "x"
            },{
                "val": "yourself","pe": 2,"n": "s","g": "x"
            },{
                "val": "herself","pe": 3,"n": "s","g": "f"
            },{
                "val": "himself","pe": 3,"n": "s","g": "m"
            },{
                "val": "itself","pe": 3,"n": "s","g": "n"
            },{
                "val": "ourselves","pe": 1,"n": "p","g": "x"
            },{
                "val": "yourselves","pe": 2,"n": "p","g": "x"
            },{
                "val": "themselves","pe": 3,"n": "p","g": "x"
            }]
        },
        "pn5": {
            "ending": "",
            "declension": [{
                "val": "","pt": "i","pe": 3
            }]
        },
        "pn6": {
            "ending": "",
            "declension": [{
                "val": "","pt": "in"
            }]
        },
        "pn7": {
            "ending": "",
            "declension": [{
                "val": "","pt": "r"
            }]
        },
        "pn8": {
            "ending": "",
            "declension": [{
                "val": "","pt": "d"
            }]
        },
        "pn9": {
            "ending": "",
            "declension": [{
                "val": "","pt": "ex"
            }]
        },
        "d1": {
            "ending": "a",
            "declension": [{
                "val": "a","n": "s"
            },{
                "val": "","n": "p"
            }]
        },
        "d2": { // GL: changed n:"." to n:"x" because it depends on the number of the owner
            "ending": "my",
            "declension": [{
                "val": "my","pe": 1,"n": "x","g": "x","own": "s"
            },{
                "val": "your","pe": 2,"n": "x","g": "x","own": "x"
            },{
                "val": "her","pe": 3,"n": "x","g": "f","own": "s"
            },{
                "val": "his","pe": 3,"n": "x","g": "m","own": "s"
            },{
                "val": "its","pe": 3,"n": "x","g": "n","own": "s"
            },{
                "val": "our","pe": 1,"n": "x","g": "x","own": "p"
            },{
                "val": "their","pe": 3,"n": "x","g": "x","own": "p"
            }]
        },
        "d3": {
            "ending": "that",
            "declension": [{
                "val": "that","n": "s"
            },{
                "val": "those","n": "p"
            }]
        },
        "d4": {
            "ending": "",
            "declension": [{
                "val": "","n": "x"
            }]
        },
        "d5": {
            "ending": "this",
            "declension": [{
                "val": "this","n": "s"
            },{
                "val": "these","n": "p"
            }]
        },        
        "b1": {
            "ending": "",
            "declension": [{
                "val": ""
            }]
        },
        "b2": {
            "ending": "badly",
            "declension": [{
                "val": "badly"
            },{
                "val": "worse","f": "co"
            },{
                "val": "worst","f": "su"
            }]
        },
        "b3": {
            "ending": "well",
            "declension": [{
                "val": "well"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "b4": {
            "ending": "far",
            "declension": [{
                "val": "far"
            },{
                "val": "farther","f": "co"
            },{
                "val": "farthest","f": "su"
            }]
        },
        "b5": {
            "ending": "little",
            "declension": [{
                "val": "little"
            },{
                "val": "less","f": "co"
            },{
                "val": "least","f": "su"
            }]
        }
    },
    "punctuation": {
        "pc1": {
            "b": "",
            "a": ""
        },
        "pc2": {
            "b": " ",
            "a": " "
        },
        "pc3": {
            "b": " ",
            "a": ""
        },
        "pc4": {
            "b": "",
            "a": " "
        },
        "pc5": {
            "b": " ",
            "a": "",
            "pos": "l"
        },
        "pc6": {
            "b": "",
            "a": " ",
            "pos": "r"
        },
        "pc7": {
            "b": " ",
            "a": " ",
            "pos": "l"
        },
        "pc8": {
            "b": " ",
            "a": " ",
            "pos": "r"
        }
    },
    "sentence_type": {
        "exc": {
            "type": "exclamative",
            "punctuation": "!"
        },
        "int": {
            "type": "interrogative",
            "punctuation": "?",
            "prefix": {
                "base": "do",
                "yon": "do",
                "wos": "who",
                "wod": "who",
                "woi": "to whom",
                "wad": "what",
                "whe": "where",
                "how": "how",
                "whn": "when",
                "why": "why",
                "muc": "how much"
            },
            "future": "will"
        },
        "dec": {
            "type": "declarative",
            "punctuation": "."
        }
    },
    "propositional": {
        "base": "that",
        "subject": "who",
        "autres": ["which","whose","whom"]
    },
    "regular": {
        "pp": {
            "ending": "",
            "option": [{
                "val": ""
            }]
        }
    },
    "verb_option": {
        "neg": {
            "prep1": "not"
        }
    },
    "usePronoun": {
        "S": "I",
        "SP":"I",
        "NP":"I",
        "VP": "me",
        "PP": "me",
        "Pro": "me"
    },
    "date": {
        "format": {
            "non_natural": {
                "year-month-date-day": "[l] [M]\/[d]\/[Y]",
                "year-month-date": "[M]\/[d]\/[Y]",
                "year-month": "[M]\/[Y]",
                "month-date": "[M]\/[d]",
                "month-date-day": "[l] [M]\/[d]",
                "year": "[Y]",
                "month": "[M]",
                "date": "[d]",
                "day": "[l]",
                "hour:minute:second": "[H0]:[m0]:[s0] [A]",
                "hour:minute": "[h]:[m0] [A]",
                "minute:second": "[m0]:[s0]",
                "hour": "[h] [A]",
                "minute": "[m]",
                "second": "[s]"
            },
            "natural": {
                "year-month-date-day": "on [l], [F] [d], [Y]",
                "year-month-date": "on [F] [d], [Y]",
                "year-month": "on [F] [Y]",
                "month-date": "on [F] [d]",
                "month-date-day": "on [l], [F] [d]",
                "year": "in [Y]",
                "month": "in [F]",
                "date": "on the [d]",
                "day": "on [l]",
                "hour:minute:second": "at [h]:[m0]:[s0] [A]",
                "hour:minute": "at [h]:[m0] [A]",
                "minute:second": "at [m]:[s0] [A]",
                "hour": "at [h] [A]",
                "minute": "at [m] min",
                "second": "at [s] s"
            },
            "relative_time": {
                "-": "[x] days ago",
                "-6": "last [l]",
                "-5": "last [l]",
                "-4": "last [l]",
                "-3": "last [l]",
                "-2": "last [l]",
                "-1": "yesterday",
                "0": "today",
                "1": "tomorrow",
                "2": "[l]",
                "3": "[l]",
                "4": "[l]",
                "5": "[l]",
                "6": "[l]",
                "+": "in [x] days"
            }
        },
        "text": {
            "weekday": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
            "month": {
                "1": "January",
                "2": "February",
                "3": "March",
                "4": "April",
                "5": "May",
                "6": "June",
                "7": "July",
                "8": "August",
                "9": "September",
                "10": "October",
                "11": "November",
                "12": "December"
            },
            "meridiem": ["a.m.","p.m."]
        }
    },
    "number": {
        "symbol": {
            "group": ",",
            "decimal": "."
        },
        "number": ["zero"]
    },
    "elision": {
        "elidables": ["a"],
        "voyellesAccentuees": "àäéèêëïîöôùû",
        "voyelles": "aeiouàäéèêëïîöôùû"
    },
    "union": "or",
    "compound": {
        "alias": "aux",
        "continuous": {
            "aux": "be",
            "participle": "pr"
        },
        "perfect": {
            "aux": "have",
            "participle": "pp"
        },
        "passive": {
            "aux": "be",
            "participle": "pp"
        },
        "future": {
            "aux": "will"
        },
        "poss": {"aux":"can"},
        "perm":  {"aux":"may"},
        "nece":   {"aux":"shall"},
        "will": {"aux":"will"},
        "obli":  {"aux":"must"}
    }
}
var lexiconFr = //========== lexicon-fr.js
{" ":{"Pc":{"tab":["pc1"]}},
 "!":{"Pc":{"tab":["pc4"]}},
 "\"":{"Pc":{"compl":"\"",
            "tab":["pc5","pc6"]}},
 "(":{"Pc":{"compl":")",
            "tab":["pc5"]}},
 ")":{"Pc":{"compl":"(",
            "tab":["pc6"]}},
 "*":{"Pc":{"compl":"*",
            "tab":["pc5","pc6"]}},
 ",":{"Pc":{"tab":["pc4"]}},
 "-":{"Pc":{"tab":["pc1"]}},
 ".":{"Pc":{"tab":["pc4"]}},
 "...":{"Pc":{"tab":["pc4"]}},
 ":":{"Pc":{"tab":["pc2"]}},
 ";":{"Pc":{"tab":["pc2"]}},
 "?":{"Pc":{"tab":["pc4"]}},
 "?!":{"Pc":{"tab":["pc4"]}},
 "[":{"Pc":{"compl":"]",
            "tab":["pc5"]}},
 "]":{"Pc":{"compl":"[",
            "tab":["pc6"]}},
 "à":{"P":{"tab":["pp"]}},
 "abaisser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "abandonner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "abattre":{"V":{"aux":["av"],
                 "tab":"v87"}},
 "abbé":{"N":{"g":"m",
              "tab":["n3"]}},
 "abeille":{"N":{"g":"f",
                 "tab":["n17"]}},
 "abîme":{"N":{"g":"m",
               "tab":["n3"]}},
 "abîmer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "abondamment":{"Adv":{"tab":["av"]}},
 "abondance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "abondant":{"A":{"tab":["n28"]}},
 "abord":{"N":{"g":"m",
               "tab":["n3"]}},
 "aborder":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "aboutir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "aboyer":{"V":{"aux":["av"],
                "tab":"v5"}},
 "abri":{"N":{"g":"m",
              "tab":["n3"]}},
 "abriter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "absence":{"N":{"g":"f",
                 "tab":["n17"]}},
 "absent":{"A":{"tab":["n28"]}},
 "absenter":{"V":{"aux":["êt"],
                  "tab":"v36"}},
 "absolu":{"A":{"tab":["n28"]}},
 "absolument":{"Adv":{"tab":["av"]}},
 "abuser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "accabler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "accepter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "accident":{"N":{"g":"m",
                  "tab":["n3"]}},
 "acclamation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "acclamer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "accompagner":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "accomplir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "accord":{"N":{"g":"m",
                "tab":["n3"]}},
 "accorder":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "accourir":{"V":{"aux":["aê"],
                  "tab":"v57"}},
 "accrocher":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "accueil":{"N":{"g":"m",
                 "tab":["n3"]}},
 "accueillir":{"V":{"aux":["av"],
                    "tab":"v51"}},
 "accuser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "acharner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "achat":{"N":{"g":"m",
               "tab":["n3"]}},
 "acheminer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "acheter":{"V":{"aux":["av"],
                 "tab":"v11"}},
 "acheteur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "achever":{"V":{"aux":["av"],
                 "tab":"v25"}},
 "acide":{"N":{"g":"m",
               "tab":["n3"]}},
 "acier":{"N":{"g":"m",
               "tab":["n3"]}},
 "acquérir":{"V":{"aux":["av"],
                  "tab":"v39"}},
 "acquitter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "acte":{"N":{"g":"m",
              "tab":["n3"]}},
 "actif":{"A":{"tab":["n46"]}},
 "action":{"N":{"g":"f",
                "tab":["n17"]}},
 "activement":{"Adv":{"tab":["av"]}},
 "activer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "activité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "actuel":{"A":{"tab":["n48"]}},
 "actuellement":{"Adv":{"tab":["av"]}},
 "adieu":{"N":{"g":"m",
               "tab":["n4"]}},
 "admettre":{"V":{"aux":["av"],
                  "tab":"v89"}},
 "administration":{"N":{"g":"f",
                        "tab":["n17"]}},
 "administrer":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "admirable":{"A":{"tab":["n25"]}},
 "admiration":{"N":{"g":"f",
                    "tab":["n17"]}},
 "admirer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "adopter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "adorer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "adoucir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "adresse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "adresser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "adroit":{"A":{"tab":["n28"]}},
 "adversaire":{"N":{"g":"x",
                    "tab":["n25"]}},
 "aérer":{"V":{"aux":["av"],
               "tab":"v28"}},
 "affaiblir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "affairé":{"A":{"tab":["n28"]}},
 "affaire":{"N":{"g":"f",
                 "tab":["n17"]}},
 "affection":{"N":{"g":"f",
                   "tab":["n17"]}},
 "affectionner":{"V":{"aux":["av"],
                      "tab":"v36"}},
 "affectueusement":{"Adv":{"tab":["av"]}},
 "affectueux":{"A":{"tab":["n54"]}},
 "affiche":{"N":{"g":"f",
                 "tab":["n17"]}},
 "affliger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "affreux":{"A":{"tab":["n54"]}},
 "agacer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "âgé":{"A":{"tab":["n28"]}},
 "âge":{"N":{"g":"m",
             "tab":["n3"]}},
 "agenouiller":{"V":{"aux":["êt"],
                     "tab":"v36"}},
 "agent":{"N":{"g":"m",
               "tab":["n3"]}},
 "agile":{"A":{"tab":["n25"]}},
 "agir":{"V":{"aux":["av"],
              "tab":"v58"}},
 "agitation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "agiter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "agréable":{"A":{"tab":["n25"]}},
 "agréablement":{"Adv":{"tab":["av"]}},
 "agréer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "agrément":{"N":{"g":"m",
                  "tab":["n3"]}},
 "agrémenter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "aide":{"N":{"g":"f",
              "tab":["n17"]}},
 "aider":{"V":{"aux":["av"],
               "tab":"v36"}},
 "aigu":{"A":{"tab":["n45"]}},
 "aiguille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "aiguiser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "aile":{"N":{"g":"f",
              "tab":["n17"]}},
 "ailleurs":{"Adv":{"tab":["av"]}},
 "aimable":{"A":{"tab":["n25"]}},
 "aimer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "aîné":{"A":{"tab":["n28"]}},
 "ainsi":{"Adv":{"tab":["av"]}},
 "air":{"N":{"g":"m",
             "tab":["n3"]}},
 "aire":{"N":{"g":"f",
              "tab":["n17"]}},
 "aisance":{"N":{"g":"f",
                 "tab":["n17"]}},
 "aisé":{"A":{"tab":["n28"]}},
 "aise":{"N":{"g":"f",
              "tab":["n17"]}},
 "aisément":{"Adv":{"tab":["av"]}},
 "ajouter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "alcool":{"N":{"g":"m",
                "tab":["n3"]}},
 "alcoolique":{"A":{"tab":["n25"]}},
 "alentours":{"N":{"g":"m",
                   "tab":["n1"]}},
 "alerte":{"N":{"g":"f",
                "tab":["n17"]}},
 "aligner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "aliment":{"N":{"g":"m",
                 "tab":["n3"]}},
 "allée":{"N":{"g":"f",
               "tab":["n17"]}},
 "allégresse":{"N":{"g":"f",
                    "tab":["n17"]}},
 "allemand":{"A":{"tab":["n28"]}},
 "aller":{"V":{"aux":["êt"],
               "tab":"v137"}},
 "allonger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "allumer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "allumette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "allure":{"N":{"g":"f",
                "tab":["n17"]}},
 "alors":{"Adv":{"tab":["av"]}},
 "alouette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "amant":{"N":{"g":"x",
               "tab":["n28"]}},
 "amateur":{"N":{"g":"x",
                 "tab":["n56"]}},
 "ambulance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "âme":{"N":{"g":"f",
             "tab":["n17"]}},
 "amende":{"N":{"g":"f",
                "tab":["n17"]}},
 "amener":{"V":{"aux":["av"],
                "tab":"v24"}},
 "amer":{"A":{"tab":["n39"]}},
 "américain":{"A":{"tab":["n28"]}},
 "ami":{"N":{"g":"x",
             "tab":["n28"]}},
 "amical":{"A":{"tab":["n47"]}},
 "amicalement":{"Adv":{"tab":["av"]}},
 "amitié":{"N":{"g":"f",
                "tab":["n17"]}},
 "amour":{"N":{"g":"x",
               "tab":["n25"]}},
 "ample":{"A":{"tab":["n25"]}},
 "amusant":{"A":{"tab":["n28"]}},
 "amusement":{"N":{"g":"m",
                   "tab":["n3"]}},
 "amuser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "ancien":{"A":{"tab":["n49"]}},
 "âne":{"N":{"g":"m",
             "tab":["n3"]}},
 "ange":{"N":{"g":"m",
              "tab":["n3"]}},
 "anglais":{"A":{"tab":["n27"]}},
 "angle":{"N":{"g":"m",
               "tab":["n3"]}},
 "angoisse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "animal":{"N":{"g":"m",
                "tab":["n5"]}},
 "animation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "animer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "anneau":{"N":{"g":"m",
                "tab":["n4"]}},
 "année":{"N":{"g":"f",
               "tab":["n17"]}},
 "anniversaire":{"N":{"g":"m",
                      "tab":["n3"]}},
 "annonce":{"N":{"g":"f",
                 "tab":["n17"]}},
 "annoncer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "annuel":{"A":{"tab":["n48"]}},
 "anticiper":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "anxiété":{"N":{"g":"f",
                 "tab":["n17"]}},
 "anxieux":{"A":{"tab":["n54"]}},
 "août":{"N":{"g":"m",
              "tab":["n3"]}},
 "apaiser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "apercevoir":{"V":{"aux":["av"],
                    "tab":"v63"}},
 "apostolique":{"A":{"tab":["n25"]}},
 "apôtre":{"N":{"g":"m",
                "tab":["n3"]}},
 "apparaître":{"V":{"aux":["aê"],
                    "tab":"v101"}},
 "apparence":{"N":{"g":"f",
                   "tab":["n17"]}},
 "apparition":{"N":{"g":"f",
                    "tab":["n17"]}},
 "appartement":{"N":{"g":"m",
                     "tab":["n3"]}},
 "appartenir":{"V":{"aux":["av"],
                    "tab":"v52"}},
 "appel":{"N":{"g":"m",
               "tab":["n3"]}},
 "appeler":{"V":{"aux":["av"],
                 "tab":"v7"}},
 "appétissant":{"A":{"tab":["n28"]}},
 "appétit":{"N":{"g":"m",
                 "tab":["n3"]}},
 "applaudir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "application":{"N":{"g":"f",
                     "tab":["n17"]}},
 "appliquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "apporter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "apprécier":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "apprendre":{"V":{"aux":["av"],
                   "tab":"v90"}},
 "apprêter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "approche":{"N":{"g":"f",
                  "tab":["n17"]}},
 "approcher":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "approuver":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "appui":{"N":{"g":"m",
               "tab":["n3"]}},
 "appuyer":{"V":{"aux":["av"],
                 "tab":"v5"}},
 "après":{"P":{"tab":["pp"]}},
 "après-midi":{"N":{"g":"x",
                    "tab":["n24"]}},
 "araignée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "arbitre":{"N":{"g":"x",
                 "tab":["n25"]}},
 "arbre":{"N":{"g":"m",
               "tab":["n3"]}},
 "arbuste":{"N":{"g":"m",
                 "tab":["n3"]}},
 "architecte":{"N":{"g":"x",
                    "tab":["n25"]}},
 "ardent":{"A":{"tab":["n28"]}},
 "ardeur":{"N":{"g":"f",
                "tab":["n17"]}},
 "ardoise":{"N":{"g":"f",
                 "tab":["n17"]}},
 "argent":{"N":{"g":"m",
                "tab":["n3"]}},
 "argenter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "arme":{"N":{"g":"f",
              "tab":["n17"]}},
 "armée":{"N":{"g":"f",
               "tab":["n17"]}},
 "armer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "armoire":{"N":{"g":"f",
                 "tab":["n17"]}},
 "arracher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "arranger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "arrêt":{"N":{"g":"m",
               "tab":["n3"]}},
 "arrêter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "arrière":{"N":{"g":"m",
                 "tab":["n3"]}},
 "arrivée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "arriver":{"V":{"aux":["êt"],
                 "tab":"v36"}},
 "arrondir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "arrondissement":{"N":{"g":"m",
                        "tab":["n3"]}},
 "arroser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "art":{"N":{"g":"m",
             "tab":["n3"]}},
 "article":{"N":{"g":"m",
                 "tab":["n3"]}},
 "artiste":{"N":{"g":"x",
                 "tab":["n25"]}},
 "aspirer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "assaut":{"N":{"g":"m",
                "tab":["n3"]}},
 "assembler":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "asseoir":{"V":{"aux":["av"],
                 "tab":"v74"}},
 "assez":{"Adv":{"tab":["av"]}},
 "assidu":{"A":{"tab":["n28"]}},
 "assiette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "assister":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "associer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "assurer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "astre":{"N":{"g":"m",
               "tab":["n3"]}},
 "atelier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "atmosphère":{"N":{"g":"f",
                    "tab":["n17"]}},
 "attachement":{"N":{"g":"m",
                     "tab":["n3"]}},
 "attacher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "attaque":{"N":{"g":"f",
                 "tab":["n17"]}},
 "attaquer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "attarder":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "atteindre":{"V":{"aux":["av"],
                   "tab":"v97"}},
 "atteler":{"V":{"aux":["av"],
                 "tab":"v7"}},
 "attendre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "attente":{"N":{"g":"f",
                 "tab":["n17"]}},
 "attentif":{"A":{"tab":["n46"]}},
 "attention":{"N":{"g":"f",
                   "tab":["n17"]}},
 "attentivement":{"Adv":{"tab":["av"]}},
 "attester":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "attirer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "attrait":{"N":{"g":"m",
                 "tab":["n3"]}},
 "attraper":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "attribuer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "attrister":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "au":{"D":{"tab":["d2"]}},
 "aube":{"N":{"g":"f",
              "tab":["n17"]}},
 "aubépine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "auberge":{"N":{"g":"f",
                 "tab":["n17"]}},
 "augmenter":{"V":{"aux":["aê"],
                   "tab":"v36"}},
 "aujourd'hui":{"Adv":{"tab":["av"]}},
 "aumône":{"N":{"g":"f",
                "tab":["n17"]}},
 "auparavant":{"Adv":{"tab":["av"]}},
 "auprès":{"Adv":{"tab":["av"]}},
 "aurore":{"N":{"g":"f",
                "tab":["n17"]}},
 "aussi":{"Adv":{"tab":["av"]},
          "C":{"tab":["cj"]}},
 "aussitôt":{"Adv":{"tab":["av"]}},
 "autant":{"Adv":{"tab":["av"]}},
 "autel":{"N":{"g":"m",
               "tab":["n3"]}},
 "auteur":{"N":{"g":"x",
                "tab":["n56"]}},
 "auto":{"N":{"g":"f",
              "tab":["n17"]}},
 "automne":{"N":{"g":"m",
                 "tab":["n3"]}},
 "automobile":{"N":{"g":"f",
                    "tab":["n17"]}},
 "autoriser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "autorité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "autre":{"A":{"pos":"pre",
               "tab":["n25"]}},
 "autrefois":{"Adv":{"tab":["av"]}},
 "autrement":{"Adv":{"tab":["av"]}},
 "avaler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "avance":{"N":{"g":"f",
                "tab":["n17"]}},
 "avancer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "avant":{"P":{"tab":["pp"]}},
 "avantage":{"N":{"g":"m",
                  "tab":["n3"]}},
 "avantageux":{"A":{"tab":["n54"]}},
 "avec":{"P":{"tab":["pp"]}},
 "avenir":{"N":{"g":"m",
                "tab":["n3"]}},
 "aventure":{"N":{"g":"f",
                  "tab":["n17"]}},
 "aventurer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "avenue":{"N":{"g":"f",
                "tab":["n17"]}},
 "averse":{"N":{"g":"f",
                "tab":["n17"]}},
 "avertir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "aveugle":{"A":{"tab":["n25"]}},
 "aviateur":{"N":{"g":"x",
                  "tab":["n56"]}},
 "avion":{"N":{"g":"m",
               "tab":["n3"]}},
 "avis":{"N":{"g":"m",
              "tab":["n2"]}},
 "aviser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "avoine":{"N":{"g":"f",
                "tab":["n17"]}},
 "avoir":{"N":{"g":"m",
               "tab":["n3"]},
          "V":{"aux":["av"],
               "tab":"v135"}},
 "avouer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "avril":{"N":{"g":"m",
               "tab":["n3"]}},
 "azur":{"N":{"g":"m",
              "tab":["n3"]}},
 "azuré":{"A":{"tab":["n28"]}},
 "bagage":{"N":{"g":"m",
                "tab":["n3"]}},
 "baguette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "baigner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "bâiller":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "bain":{"N":{"g":"m",
              "tab":["n3"]}},
 "baiser":{"N":{"g":"m",
                "tab":["n3"]}},
 "baisser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "bal":{"N":{"g":"m",
             "tab":["n3"]}},
 "balancer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "balançoire":{"N":{"g":"f",
                    "tab":["n17"]}},
 "balayer":{"V":{"aux":["av"],
                 "tab":"v5"}},
 "balcon":{"N":{"g":"m",
                "tab":["n3"]}},
 "balle":{"N":{"g":"f",
               "tab":["n17"]}},
 "ballon":{"N":{"g":"m",
                "tab":["n3"]}},
 "bambin":{"N":{"g":"x",
                "tab":["n28"]}},
 "banane":{"N":{"g":"f",
                "tab":["n17"]}},
 "banc":{"N":{"g":"m",
              "tab":["n3"]}},
 "bande":{"N":{"g":"f",
               "tab":["n17"]}},
 "bandit":{"N":{"g":"m",
                "tab":["n3"]}},
 "banque":{"N":{"g":"f",
                "tab":["n17"]}},
 "banquier":{"N":{"g":"x",
                  "tab":["n39"]}},
 "baptême":{"N":{"g":"m",
                 "tab":["n3"]}},
 "baptiser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "barbe":{"N":{"g":"f",
               "tab":["n17"]}},
 "barque":{"N":{"g":"f",
                "tab":["n17"]}},
 "barquette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "barrage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "barre":{"N":{"g":"f",
               "tab":["n17"]}},
 "barreau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "barrière":{"N":{"g":"f",
                  "tab":["n17"]}},
 "bas":{"A":{"tab":["n50"]}},
 "basse":{"N":{"g":"f",
               "tab":["n17"]}},
 "basse-cour":{"N":{"g":"f",
                    "tab":["nI"]}},
 "bassin":{"N":{"g":"m",
                "tab":["n3"]}},
 "bataille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "bateau":{"N":{"g":"m",
                "tab":["n4"]}},
 "bâtiment":{"N":{"g":"m",
                  "tab":["n3"]}},
 "bâtir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "bâton":{"N":{"g":"m",
               "tab":["n3"]}},
 "battre":{"V":{"aux":["av"],
                "tab":"v87"}},
 "bavarder":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "bazar":{"N":{"g":"m",
               "tab":["n3"]}},
 "beau":{"A":{"pos":"pre",
              "tab":["n108"]}},
 "beaucoup":{"Adv":{"tab":["av"]}},
 "beauté":{"N":{"g":"f",
                "tab":["n17"]}},
 "bébé":{"N":{"g":"m",
              "tab":["n3"]}},
 "bec":{"N":{"g":"m",
             "tab":["n3"]}},
 "bêche":{"N":{"g":"f",
               "tab":["n17"]}},
 "belge":{"A":{"tab":["n25"]}},
 "bénédiction":{"N":{"g":"f",
                     "tab":["n17"]}},
 "bénir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "berceau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "bercer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "béret":{"N":{"g":"m",
               "tab":["n3"]}},
 "berger":{"N":{"g":"x",
                "tab":["n39"]}},
 "bergère":{"N":{"g":"f",
                 "tab":["n17"]}},
 "besogne":{"N":{"g":"f",
                 "tab":["n17"]}},
 "besoin":{"N":{"g":"m",
                "tab":["n3"]}},
 "bétail":{"N":{"g":"m",
                "tab":["n3"]}},
 "bête":{"N":{"g":"f",
              "tab":["n17"]}},
 "betterave":{"N":{"g":"f",
                   "tab":["n17"]}},
 "beurre":{"N":{"g":"m",
                "tab":["n3"]}},
 "bibelot":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bibliothèque":{"N":{"g":"f",
                      "tab":["n17"]}},
 "bicyclette":{"N":{"g":"f",
                    "tab":["n17"]}},
 "bien":{"Adv":{"tab":["av"]}},
 "bien-aimé":{"A":{"tab":["n28"]}},
 "bien-être":{"N":{"g":"m",
                   "tab":["n35"]}},
 "bienfaisant":{"A":{"tab":["n28"]}},
 "bienfait":{"N":{"g":"m",
                  "tab":["n3"]}},
 "bienfaiteur":{"N":{"g":"x",
                     "tab":["n56"]}},
 "bienheureux":{"A":{"tab":["n54"]}},
 "bientôt":{"Adv":{"tab":["av"]}},
 "bienveillance":{"N":{"g":"f",
                       "tab":["n17"]}},
 "bienveillant":{"A":{"tab":["n28"]}},
 "bière":{"N":{"g":"f",
               "tab":["n17"]}},
 "bijou":{"N":{"g":"m",
               "tab":["n4"]}},
 "bille":{"N":{"g":"f",
               "tab":["n17"]}},
 "billet":{"N":{"g":"m",
                "tab":["n3"]}},
 "bise":{"N":{"g":"f",
              "tab":["n17"]}},
 "bizarre":{"A":{"tab":["n25"]}},
 "blanc":{"A":{"tab":["n61"]}},
 "blancheur":{"N":{"g":"f",
                   "tab":["n17"]}},
 "blanchir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "blé":{"N":{"g":"m",
             "tab":["n3"]}},
 "blesser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "blessure":{"N":{"g":"f",
                  "tab":["n17"]}},
 "bleu":{"A":{"tab":["n28"]}},
 "bleuet":{"N":{"g":"m",
                "tab":["n3"]}},
 "bloc":{"N":{"g":"m",
              "tab":["n3"]}},
 "blond":{"A":{"tab":["n28"]}},
 "blottir":{"V":{"aux":["êt"],
                 "tab":"v58"}},
 "blouse":{"N":{"g":"f",
                "tab":["n17"]}},
 "bluet":{"N":{"g":"m",
               "tab":["n3"]}},
 "boeuf":{"N":{"g":"m",
               "tab":["n3"]}},
 "boire":{"V":{"aux":["av"],
               "tab":"v121"}},
 "bois":{"N":{"g":"m",
              "tab":["n2"]}},
 "boisson":{"N":{"g":"f",
                 "tab":["n17"]}},
 "boîte":{"N":{"g":"f",
               "tab":["n17"]}},
 "boiteux":{"A":{"tab":["n54"]}},
 "bon":{"A":{"pos":"pre",
             "tab":["n49"]}},
 "bonbon":{"N":{"g":"m",
                "tab":["n3"]}},
 "bond":{"N":{"g":"m",
              "tab":["n3"]}},
 "bondir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "bonheur":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bonhomme":{"N":{"g":"m",
                  "tab":["n11"]}},
 "bonjour":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bonne":{"N":{"g":"f",
               "tab":["n17"]}},
 "bonnet":{"N":{"g":"m",
                "tab":["n3"]}},
 "bonsoir":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bonté":{"N":{"g":"f",
               "tab":["n17"]}},
 "bord":{"N":{"g":"m",
              "tab":["n3"]}},
 "border":{"V":{"aux":["av"],
                "tab":"v36"}},
 "bordure":{"N":{"g":"f",
                 "tab":["n17"]}},
 "borne":{"N":{"g":"f",
               "tab":["n17"]}},
 "bosquet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bossu":{"A":{"tab":["n28"]}},
 "botte":{"N":{"g":"f",
               "tab":["n17"]}},
 "bouche":{"N":{"g":"f",
                "tab":["n17"]}},
 "boucher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "boucle":{"N":{"g":"f",
                "tab":["n17"]}},
 "boucler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "bouder":{"V":{"aux":["av"],
                "tab":"v36"}},
 "boue":{"N":{"g":"f",
              "tab":["n17"]}},
 "boueux":{"A":{"tab":["n54"]}},
 "bouger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "bougie":{"N":{"g":"f",
                "tab":["n17"]}},
 "boulanger":{"N":{"g":"x",
                   "tab":["n39"]}},
 "boulangerie":{"N":{"g":"f",
                     "tab":["n17"]}},
 "boule":{"N":{"g":"f",
               "tab":["n17"]}},
 "bouleau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "boulevard":{"N":{"g":"m",
                   "tab":["n3"]}},
 "bouleverser":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "bouquet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bourdonnement":{"N":{"g":"m",
                       "tab":["n3"]}},
 "bourdonner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "bourgeois":{"N":{"g":"x",
                   "tab":["n27"]}},
 "bourgeon":{"N":{"g":"m",
                  "tab":["n3"]}},
 "bourgeonner":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "bourgmestre":{"N":{"g":"m",
                     "tab":["n3"]}},
 "bourrasque":{"N":{"g":"f",
                    "tab":["n17"]}},
 "bourse":{"N":{"g":"f",
                "tab":["n17"]}},
 "bousculer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "bout":{"N":{"g":"m",
              "tab":["n3"]}},
 "bouteille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "boutique":{"N":{"g":"f",
                  "tab":["n17"]}},
 "bouton":{"N":{"g":"m",
                "tab":["n3"]}},
 "branche":{"N":{"g":"f",
                 "tab":["n17"]}},
 "bras":{"N":{"g":"m",
              "tab":["n2"]}},
 "brave":{"A":{"tab":["n25"]}},
 "bravo":{"N":{"g":"m",
               "tab":["n3"]}},
 "brebis":{"N":{"g":"f",
                "tab":["n16"]}},
 "brèche":{"N":{"g":"f",
                "tab":["n17"]}},
 "bref":{"A":{"pos":"pre",
              "tab":["n38"]}},
 "brigand":{"N":{"g":"m",
                 "tab":["n3"]}},
 "brillant":{"A":{"tab":["n28"]}},
 "briller":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "brin":{"N":{"g":"m",
              "tab":["n3"]}},
 "brindille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "brique":{"N":{"g":"f",
                "tab":["n17"]}},
 "brise":{"N":{"g":"f",
               "tab":["n17"]}},
 "briser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "brochure":{"N":{"g":"f",
                  "tab":["n17"]}},
 "broder":{"V":{"aux":["av"],
                "tab":"v36"}},
 "brouillard":{"N":{"g":"m",
                    "tab":["n3"]}},
 "brouter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "broyer":{"V":{"aux":["av"],
                "tab":"v5"}},
 "bruit":{"N":{"g":"m",
               "tab":["n3"]}},
 "brûlant":{"A":{"tab":["n28"]}},
 "brûler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "brume":{"N":{"g":"f",
               "tab":["n17"]}},
 "brumeux":{"A":{"tab":["n54"]}},
 "brun":{"A":{"tab":["n28"]}},
 "brusque":{"A":{"tab":["n25"]}},
 "brusquement":{"Adv":{"tab":["av"]}},
 "brut":{"A":{"tab":["n28"]}},
 "brutal":{"A":{"tab":["n47"]}},
 "bruyamment":{"Adv":{"tab":["av"]}},
 "bruyant":{"A":{"tab":["n28"]}},
 "bûcheron":{"N":{"g":"x",
                  "tab":["n49"]}},
 "buis":{"N":{"g":"m",
              "tab":["n2"]}},
 "buisson":{"N":{"g":"m",
                 "tab":["n3"]}},
 "bulletin":{"N":{"g":"m",
                  "tab":["n3"]}},
 "bureau":{"N":{"g":"m",
                "tab":["n4"]}},
 "but":{"N":{"g":"m",
             "tab":["n3"]}},
 "butiner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "ça":{"Pro":{"g":"n",
              "tab":["pn18"]}},
 "cabane":{"N":{"g":"f",
                "tab":["n17"]}},
 "cabine":{"N":{"g":"f",
                "tab":["n17"]}},
 "cache-cache":{"N":{"g":"m",
                     "tab":["n2"]}},
 "cacher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "cadavre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "cadeau":{"N":{"g":"m",
                "tab":["n4"]}},
 "cadet":{"A":{"tab":["n51"]}},
 "cadran":{"N":{"g":"m",
                "tab":["n3"]}},
 "cadre":{"N":{"g":"m",
               "tab":["n3"]}},
 "café":{"N":{"g":"m",
              "tab":["n3"]}},
 "cage":{"N":{"g":"f",
              "tab":["n17"]}},
 "cahier":{"N":{"g":"m",
                "tab":["n3"]}},
 "caillou":{"N":{"g":"m",
                 "tab":["n4"]}},
 "caisse":{"N":{"g":"f",
                "tab":["n17"]}},
 "calcul":{"N":{"g":"m",
                "tab":["n3"]}},
 "calculer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "calendrier":{"N":{"g":"m",
                    "tab":["n3"]}},
 "calice":{"N":{"g":"m",
                "tab":["n3"]}},
 "calme":{"A":{"tab":["n25"]}},
 "calmer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "calvaire":{"N":{"g":"m",
                  "tab":["n3"]}},
 "camarade":{"N":{"g":"x",
                  "tab":["n25"]}},
 "camion":{"N":{"g":"m",
                "tab":["n3"]}},
 "camp":{"N":{"g":"m",
              "tab":["n3"]}},
 "campagnard":{"N":{"g":"x",
                    "tab":["n28"]}},
 "campagne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "canal":{"N":{"g":"m",
               "tab":["n5"]}},
 "canard":{"N":{"g":"m",
                "tab":["n3"]}},
 "canif":{"N":{"g":"m",
               "tab":["n3"]}},
 "canne":{"N":{"g":"f",
               "tab":["n17"]}},
 "canon":{"N":{"g":"m",
               "tab":["n3"]}},
 "canot":{"N":{"g":"m",
               "tab":["n3"]}},
 "cantique":{"N":{"g":"m",
                  "tab":["n3"]}},
 "capable":{"A":{"tab":["n25"]}},
 "capitaine":{"N":{"g":"x",
                   "tab":["n3"]}},
 "capital":{"N":{"g":"m",
                 "tab":["n5"]}},
 "capitale":{"N":{"g":"f",
                  "tab":["n17"]}},
 "caprice":{"N":{"g":"m",
                 "tab":["n3"]}},
 "car":{"C":{"tab":["cj"]}},
 "carabine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "caractère":{"N":{"g":"m",
                   "tab":["n3"]}},
 "caresse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "caresser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "carnet":{"N":{"g":"m",
                "tab":["n3"]}},
 "carotte":{"N":{"g":"f",
                 "tab":["n17"]}},
 "carré":{"A":{"tab":["n28"]}},
 "carreau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "carrefour":{"N":{"g":"m",
                   "tab":["n3"]}},
 "carrière":{"N":{"g":"f",
                  "tab":["n17"]}},
 "carrousel":{"N":{"g":"m",
                   "tab":["n3"]}},
 "cartable":{"N":{"g":"m",
                  "tab":["n3"]}},
 "carte":{"N":{"g":"f",
               "tab":["n17"]}},
 "carton":{"N":{"g":"m",
                "tab":["n3"]}},
 "cas":{"N":{"g":"m",
             "tab":["n2"]}},
 "casquette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "casser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "catastrophe":{"N":{"g":"f",
                     "tab":["n17"]}},
 "catéchisme":{"N":{"g":"m",
                    "tab":["n3"]}},
 "cathédrale":{"N":{"g":"f",
                    "tab":["n17"]}},
 "catholique":{"A":{"tab":["n25"]}},
 "cause":{"N":{"g":"f",
               "tab":["n17"]}},
 "causer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "cave":{"N":{"g":"f",
              "tab":["n17"]}},
 "caverne":{"N":{"g":"f",
                 "tab":["n17"]}},
 "ce":{"D":{"tab":["d7"]},
       "Pro":{"g":"n",
              "tab":["pn14"]}},
 "ceci":{"Pro":{"g":"n",
                "tab":["pn16"]}},
 "céder":{"V":{"aux":["av"],
               "tab":"v30"}},
 "ceinture":{"N":{"g":"f",
                  "tab":["n17"]}},
 "cela":{"Pro":{"g":"n",
                "tab":["pn19"]}},
 "célèbre":{"A":{"tab":["n25"]}},
 "célébrer":{"V":{"aux":["av"],
                  "tab":"v20"}},
 "céleste":{"A":{"tab":["n25"]}},
 "celui":{"Pro":{"g":"m",
                 "tab":["pn15"]}},
 "celui-ci":{"Pro":{"g":"m",
                    "tab":["pn17"]}},
 "celui-là":{"Pro":{"g":"m",
                    "tab":["pn20"]}},
 "cendre":{"N":{"g":"f",
                "tab":["n17"]}},
 "centaine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "centime":{"N":{"g":"m",
                 "tab":["n3"]}},
 "centimètre":{"N":{"g":"m",
                    "tab":["n3"]}},
 "central":{"A":{"tab":["n47"]}},
 "centre":{"N":{"g":"m",
                "tab":["n3"]}},
 "cependant":{"C":{"tab":["cj"]}},
 "cercle":{"N":{"g":"m",
                "tab":["n3"]}},
 "cérémonie":{"N":{"g":"f",
                   "tab":["n17"]}},
 "cerf":{"N":{"g":"m",
              "tab":["n3"]}},
 "cerise":{"N":{"g":"f",
                "tab":["n17"]}},
 "cerisier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "certain":{"A":{"tab":["n28"]}},
 "certainement":{"Adv":{"tab":["av"]}},
 "certes":{"Adv":{"tab":["av"]}},
 "cesse":{"N":{"g":"f",
               "tab":["n17"]}},
 "cesser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "chagrin":{"N":{"g":"m",
                 "tab":["n3"]}},
 "chaîne":{"N":{"g":"f",
                "tab":["n17"]}},
 "chair":{"N":{"g":"f",
               "tab":["n17"]}},
 "chaise":{"N":{"g":"f",
                "tab":["n17"]}},
 "chaland":{"N":{"g":"m",
                 "tab":["n3"]}},
 "chaleur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "chambre":{"N":{"g":"f",
                 "tab":["n17"]}},
 "chameau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "champ":{"N":{"g":"m",
               "tab":["n3"]}},
 "chance":{"N":{"g":"f",
                "tab":["n17"]}},
 "changement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "changer":{"V":{"aux":["aê"],
                 "tab":"v3"}},
 "chanson":{"N":{"g":"f",
                 "tab":["n17"]}},
 "chant":{"N":{"g":"m",
               "tab":["n3"]}},
 "chanter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "chanteur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "chantre":{"N":{"g":"x",
                 "tab":["n25"]}},
 "chapeau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "chapelet":{"N":{"g":"m",
                  "tab":["n3"]}},
 "chapelle":{"N":{"g":"f",
                  "tab":["n17"]}},
 "chapitre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "charbon":{"N":{"g":"m",
                 "tab":["n3"]}},
 "charbonnage":{"N":{"g":"m",
                     "tab":["n3"]}},
 "charge":{"N":{"g":"f",
                "tab":["n17"]}},
 "charger":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "chariot":{"N":{"g":"m",
                 "tab":["n3"]}},
 "charitable":{"A":{"tab":["n25"]}},
 "charité":{"N":{"g":"f",
                 "tab":["n17"]}},
 "charlatan":{"N":{"g":"m",
                   "tab":["n3"]}},
 "charmant":{"A":{"tab":["n28"]}},
 "charme":{"N":{"g":"m",
                "tab":["n3"]}},
 "charmer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "charrette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "charrue":{"N":{"g":"f",
                 "tab":["n17"]}},
 "chasse":{"N":{"g":"f",
                "tab":["n17"]}},
 "chasser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "chasseur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "chat":{"N":{"g":"x",
              "tab":["n51"]}},
 "château":{"N":{"g":"m",
                 "tab":["n4"]}},
 "chaud":{"A":{"tab":["n28"]}},
 "chaudement":{"Adv":{"tab":["av"]}},
 "chauffage":{"N":{"g":"m",
                   "tab":["n3"]}},
 "chauffer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "chauffeur":{"N":{"g":"x",
                   "tab":["n55"]}},
 "chauffeuse":{"N":{"g":"f",
                    "tab":["n17"]}},
 "chaume":{"N":{"g":"m",
                "tab":["n3"]}},
 "chaumière":{"N":{"g":"f",
                   "tab":["n17"]}},
 "chaussée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "chausser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "chaussure":{"N":{"g":"f",
                   "tab":["n17"]}},
 "chaux":{"N":{"g":"f",
               "tab":["n16"]}},
 "chef":{"N":{"g":"m",
              "tab":["n3"]}},
 "chef-d'oeuvre":{"N":{"g":"m",
                       "tab":["nI"]}},
 "chemin":{"N":{"g":"m",
                "tab":["n3"]}},
 "cheminée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "chemise":{"N":{"g":"f",
                 "tab":["n17"]}},
 "chêne":{"N":{"g":"m",
               "tab":["n3"]}},
 "cher":{"A":{"tab":["n39"]}},
 "chercher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "chéri":{"A":{"tab":["n28"]}},
 "chérir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "cheval":{"N":{"g":"m",
                "tab":["n5"]}},
 "chevalier":{"N":{"g":"m",
                   "tab":["n3"]}},
 "chevalière":{"N":{"g":"f",
                    "tab":["n17"]}},
 "chevelure":{"N":{"g":"f",
                   "tab":["n17"]}},
 "chevet":{"N":{"g":"m",
                "tab":["n3"]}},
 "cheveu":{"N":{"g":"m",
                "tab":["n4"]}},
 "chèvre":{"N":{"g":"f",
                "tab":["n17"]}},
 "chez":{"P":{"tab":["pp"]}},
 "chien":{"N":{"g":"x",
               "tab":["n49"]}},
 "chiffon":{"N":{"g":"m",
                 "tab":["n3"]}},
 "chiffre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "choc":{"N":{"g":"m",
              "tab":["n3"]}},
 "chocolat":{"N":{"g":"m",
                  "tab":["n3"]}},
 "choeur":{"N":{"g":"m",
                "tab":["n3"]}},
 "choisir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "choix":{"N":{"g":"m",
               "tab":["n2"]}},
 "chose":{"N":{"g":"f",
               "tab":["n17"]}},
 "chou":{"N":{"g":"m",
              "tab":["n4"]}},
 "chrétien":{"A":{"tab":["n49"]}},
 "chrysanthème":{"N":{"g":"m",
                      "tab":["n3"]}},
 "chute":{"N":{"g":"f",
               "tab":["n17"]}},
 "ci-joint":{"A":{"tab":["n28"]}},
 "ciel":{"N":{"g":"m",
              "tab":["n9"]}},
 "cigarette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "cime":{"N":{"g":"f",
              "tab":["n17"]}},
 "cimetière":{"N":{"g":"m",
                   "tab":["n3"]}},
 "cinéma":{"N":{"g":"m",
                "tab":["n3"]}},
 "circonstance":{"N":{"g":"f",
                      "tab":["n17"]}},
 "circulation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "circuler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "cirer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "cirque":{"N":{"g":"m",
                "tab":["n3"]}},
 "cité":{"N":{"g":"f",
              "tab":["n17"]}},
 "citer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "citoyen":{"N":{"g":"x",
                 "tab":["n49"]}},
 "civil":{"A":{"tab":["n28"]}},
 "clair":{"A":{"tab":["n28"]}},
 "clairière":{"N":{"g":"f",
                   "tab":["n17"]}},
 "clairon":{"N":{"g":"m",
                 "tab":["n3"]}},
 "claquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "clarté":{"N":{"g":"f",
                "tab":["n17"]}},
 "classe":{"N":{"g":"f",
                "tab":["n17"]}},
 "classique":{"A":{"tab":["n25"]}},
 "clé":{"N":{"g":"f",
             "tab":["n17"]}},
 "clef":{"N":{"g":"f",
              "tab":["n17"]}},
 "clément":{"A":{"tab":["n28"]}},
 "client":{"N":{"g":"x",
                "tab":["n28"]}},
 "climat":{"N":{"g":"m",
                "tab":["n3"]}},
 "clinique":{"N":{"g":"f",
                  "tab":["n17"]}},
 "cloche":{"N":{"g":"f",
                "tab":["n17"]}},
 "clocher":{"N":{"g":"m",
                 "tab":["n3"]}},
 "clochette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "clos":{"A":{"tab":["n27"]}},
 "clou":{"N":{"g":"m",
              "tab":["n3"]}},
 "clouer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "clown":{"N":{"g":"m",
               "tab":["n3"]}},
 "cochon":{"N":{"g":"m",
                "tab":["n3"]}},
 "coeur":{"N":{"g":"m",
               "tab":["n3"]}},
 "coffre":{"N":{"g":"m",
                "tab":["n3"]}},
 "coffret":{"N":{"g":"m",
                 "tab":["n3"]}},
 "coiffer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "coiffure":{"N":{"g":"f",
                  "tab":["n17"]}},
 "coin":{"N":{"g":"m",
              "tab":["n3"]}},
 "colère":{"N":{"g":"f",
                "tab":["n17"]}},
 "colis":{"N":{"g":"m",
               "tab":["n2"]}},
 "collection":{"N":{"g":"f",
                    "tab":["n17"]}},
 "collège":{"N":{"g":"m",
                 "tab":["n3"]}},
 "coller":{"V":{"aux":["av"],
                "tab":"v36"}},
 "colline":{"N":{"g":"f",
                 "tab":["n17"]}},
 "colonel":{"N":{"g":"x",
                 "tab":["n48"]}},
 "colonial":{"A":{"tab":["n47"]}},
 "colonne":{"N":{"g":"f",
                 "tab":["n17"]}},
 "colorer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "combat":{"N":{"g":"m",
                "tab":["n3"]}},
 "combattant":{"N":{"g":"x",
                    "tab":["n28"]}},
 "combattre":{"V":{"aux":["av"],
                   "tab":"v87"}},
 "comble":{"N":{"g":"m",
                "tab":["n3"]}},
 "combler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "commandant":{"N":{"g":"x",
                    "tab":["n28"]}},
 "commande":{"N":{"g":"f",
                  "tab":["n17"]}},
 "commandement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "commander":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "commencement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "commencer":{"V":{"aux":["av"],
                   "tab":"v0"}},
 "commerçant":{"N":{"g":"x",
                    "tab":["n28"]}},
 "commerce":{"N":{"g":"m",
                  "tab":["n3"]}},
 "commercial":{"A":{"tab":["n47"]}},
 "commettre":{"V":{"aux":["av"],
                   "tab":"v89"}},
 "commission":{"N":{"g":"f",
                    "tab":["n17"]}},
 "commode":{"N":{"g":"f",
                 "tab":["n17"]}},
 "commun":{"A":{"tab":["n28"]}},
 "communal":{"A":{"tab":["n47"]}},
 "commune":{"N":{"g":"f",
                 "tab":["n17"]}},
 "communiant":{"N":{"g":"x",
                    "tab":["n28"]}},
 "communication":{"N":{"g":"f",
                       "tab":["n17"]}},
 "communier":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "communion":{"N":{"g":"f",
                   "tab":["n17"]}},
 "communiquer":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "compagne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "compagnie":{"N":{"g":"f",
                   "tab":["n17"]}},
 "compagnon":{"N":{"g":"m",
                   "tab":["n3"]}},
 "comparaison":{"N":{"g":"f",
                     "tab":["n17"]}},
 "comparer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "compassion":{"N":{"g":"f",
                    "tab":["n17"]}},
 "complet":{"A":{"tab":["n40"]}},
 "complètement":{"Adv":{"tab":["av"]}},
 "compléter":{"V":{"aux":["av"],
                   "tab":"v22"}},
 "compliment":{"N":{"g":"m",
                    "tab":["n3"]}},
 "compliquer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "composer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "composition":{"N":{"g":"f",
                     "tab":["n17"]}},
 "comprendre":{"V":{"aux":["av"],
                    "tab":"v90"}},
 "compte":{"N":{"g":"m",
                "tab":["n3"]}},
 "compter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "comte":{"N":{"g":"m",
               "tab":["n3"]}},
 "comtesse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "concerner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "concert":{"N":{"g":"m",
                 "tab":["n3"]}},
 "concession":{"N":{"g":"f",
                    "tab":["n17"]}},
 "conclure":{"V":{"aux":["av"],
                  "tab":"v109"}},
 "concours":{"N":{"g":"m",
                  "tab":["n2"]}},
 "condamner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "condisciple":{"N":{"g":"x",
                     "tab":["n25"]}},
 "condition":{"N":{"g":"f",
                   "tab":["n17"]}},
 "condoléances":{"N":{"g":"f",
                      "tab":["n15"]}},
 "conduire":{"V":{"aux":["av"],
                  "tab":"v113"}},
 "conduite":{"N":{"g":"f",
                  "tab":["n17"]}},
 "confectionner":{"V":{"aux":["av"],
                       "tab":"v36"}},
 "conférence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "confesser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "confiance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "confier":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "confiture":{"N":{"g":"f",
                   "tab":["n17"]}},
 "confondre":{"V":{"aux":["av"],
                   "tab":"v85"}},
 "conformément":{"Adv":{"tab":["av"]}},
 "confrère":{"N":{"g":"m",
                  "tab":["n3"]}},
 "confus":{"A":{"tab":["n27"]}},
 "congé":{"N":{"g":"m",
               "tab":["n3"]}},
 "congrès":{"N":{"g":"m",
                 "tab":["n2"]}},
 "connaissance":{"N":{"g":"f",
                      "tab":["n17"]}},
 "connaître":{"V":{"aux":["av"],
                   "tab":"v101"}},
 "conquérir":{"V":{"aux":["av"],
                   "tab":"v39"}},
 "consacrer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "conscience":{"N":{"g":"f",
                    "tab":["n17"]}},
 "conseil":{"N":{"g":"m",
                 "tab":["n3"]}},
 "conseiller":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "consentement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "consentir":{"V":{"aux":["av"],
                   "tab":"v46"}},
 "conséquence":{"N":{"g":"f",
                     "tab":["n17"]}},
 "conserver":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "considérable":{"A":{"tab":["n25"]}},
 "considérer":{"V":{"aux":["av"],
                    "tab":"v28"}},
 "consister":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "consolation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "consoler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "constamment":{"Adv":{"tab":["av"]}},
 "constant":{"A":{"tab":["n28"]}},
 "constater":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "constituer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "construction":{"N":{"g":"f",
                      "tab":["n17"]}},
 "construire":{"V":{"aux":["av"],
                    "tab":"v113"}},
 "consulter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "contact":{"N":{"g":"m",
                 "tab":["n3"]}},
 "conte":{"N":{"g":"m",
               "tab":["n3"]}},
 "contempler":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "contenir":{"V":{"aux":["av"],
                  "tab":"v52"}},
 "content":{"A":{"tab":["n28"]}},
 "contenter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "contenu":{"N":{"g":"m",
                 "tab":["n3"]}},
 "conter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "continuel":{"A":{"tab":["n48"]}},
 "continuellement":{"Adv":{"tab":["av"]}},
 "continuer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "contraire":{"A":{"tab":["n25"]}},
 "contrarier":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "contre":{"P":{"tab":["pp"]}},
 "contrée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "contribuer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "convaincre":{"V":{"aux":["av"],
                    "tab":"v86"}},
 "convenable":{"A":{"tab":["n25"]}},
 "convenir":{"V":{"aux":["aê"],
                  "tab":"v52"}},
 "conversation":{"N":{"g":"f",
                      "tab":["n17"]}},
 "convertir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "conviction":{"N":{"g":"f",
                    "tab":["n17"]}},
 "copain":{"N":{"g":"x",
                "tab":["n104"]}},
 "copier":{"V":{"aux":["av"],
                "tab":"v36"}},
 "coq":{"N":{"g":"m",
             "tab":["n3"]}},
 "coquelicot":{"N":{"g":"m",
                    "tab":["n3"]}},
 "coquet":{"A":{"tab":["n51"]}},
 "coquille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "corbeau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "corbeille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "corde":{"N":{"g":"f",
               "tab":["n17"]}},
 "cordial":{"N":{"g":"m",
                 "tab":["n5"]}},
 "cordialement":{"Adv":{"tab":["av"]}},
 "cordonnier":{"N":{"g":"x",
                    "tab":["n39"]}},
 "corne":{"N":{"g":"f",
               "tab":["n17"]}},
 "corniche":{"N":{"g":"f",
                  "tab":["n17"]}},
 "corolle":{"N":{"g":"f",
                 "tab":["n17"]}},
 "corps":{"N":{"g":"m",
               "tab":["n2"]}},
 "correction":{"N":{"g":"f",
                    "tab":["n17"]}},
 "correspondance":{"N":{"g":"f",
                        "tab":["n17"]}},
 "corridor":{"N":{"g":"m",
                  "tab":["n3"]}},
 "corriger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "cortège":{"N":{"g":"m",
                 "tab":["n3"]}},
 "costume":{"N":{"g":"m",
                 "tab":["n3"]}},
 "côté":{"N":{"g":"m",
              "tab":["n3"]}},
 "côte":{"N":{"g":"f",
              "tab":["n17"]}},
 "coton":{"N":{"g":"m",
               "tab":["n3"]}},
 "cou":{"N":{"g":"m",
             "tab":["n3"]}},
 "couche":{"N":{"g":"f",
                "tab":["n17"]}},
 "coucher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "coucou":{"N":{"g":"m",
                "tab":["n3"]}},
 "coude":{"N":{"g":"m",
               "tab":["n3"]}},
 "coudre":{"V":{"aux":["av"],
                "tab":"v93"}},
 "couler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "couleur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "couloir":{"N":{"g":"m",
                 "tab":["n3"]}},
 "coup":{"N":{"g":"m",
              "tab":["n3"]}},
 "coupable":{"A":{"tab":["n25"]}},
 "coupe":{"N":{"g":"f",
               "tab":["n17"]}},
 "couper":{"V":{"aux":["av"],
                "tab":"v36"}},
 "cour":{"N":{"g":"f",
              "tab":["n17"]}},
 "courage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "courageusement":{"Adv":{"tab":["av"]}},
 "courageux":{"A":{"tab":["n54"]}},
 "courant":{"A":{"tab":["n28"]}},
 "courber":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "coureur":{"N":{"g":"x",
                 "tab":["n55"]}},
 "courir":{"V":{"aux":["av"],
                "tab":"v57"}},
 "couronne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "couronner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "courrier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "cours":{"N":{"g":"m",
               "tab":["n2"]}},
 "course":{"N":{"g":"f",
                "tab":["n17"]}},
 "court":{"A":{"tab":["n28"]}},
 "cousin":{"N":{"g":"x",
                "tab":["n28"]}},
 "coussin":{"N":{"g":"m",
                 "tab":["n3"]}},
 "couteau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "coûter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "coutume":{"N":{"g":"f",
                 "tab":["n17"]}},
 "couture":{"N":{"g":"f",
                 "tab":["n17"]}},
 "couvent":{"N":{"g":"m",
                 "tab":["n3"]}},
 "couver":{"V":{"aux":["av"],
                "tab":"v36"}},
 "couvercle":{"N":{"g":"m",
                   "tab":["n3"]}},
 "couvert":{"N":{"g":"m",
                 "tab":["n3"]}},
 "couverture":{"N":{"g":"f",
                    "tab":["n17"]}},
 "couvrir":{"V":{"aux":["av"],
                 "tab":"v44"}},
 "craindre":{"V":{"aux":["av"],
                  "tab":"v97"}},
 "crainte":{"N":{"g":"f",
                 "tab":["n17"]}},
 "craquement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "craquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "crayon":{"N":{"g":"m",
                "tab":["n3"]}},
 "créateur":{"N":{"g":"x",
                  "tab":["n56"]}},
 "créature":{"N":{"g":"f",
                  "tab":["n17"]}},
 "crèche":{"N":{"g":"f",
                "tab":["n17"]}},
 "créer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "crème":{"N":{"g":"f",
               "tab":["n17"]}},
 "crêpe":{"N":{"g":"f",
               "tab":["n17"]}},
 "crépuscule":{"N":{"g":"m",
                    "tab":["n3"]}},
 "creuser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "creux":{"A":{"tab":["n54"]}},
 "crever":{"V":{"aux":["aê"],
                "tab":"v25"}},
 "cri":{"N":{"g":"m",
             "tab":["n3"]}},
 "crier":{"V":{"aux":["av"],
               "tab":"v36"}},
 "crime":{"N":{"g":"m",
               "tab":["n3"]}},
 "crise":{"N":{"g":"f",
               "tab":["n17"]}},
 "cristal":{"N":{"g":"m",
                 "tab":["n5"]}},
 "croire":{"V":{"aux":["av"],
                "tab":"v115"}},
 "croiser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "croître":{"V":{"aux":["av"],
                 "tab":"v106"}},
 "croix":{"N":{"g":"f",
               "tab":["n16"]}},
 "croquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "croûte":{"N":{"g":"f",
                "tab":["n17"]}},
 "crucifix":{"N":{"g":"m",
                  "tab":["n2"]}},
 "cruel":{"A":{"tab":["n48"]}},
 "cueillette":{"N":{"g":"f",
                    "tab":["n17"]}},
 "cueillir":{"V":{"aux":["av"],
                  "tab":"v51"}},
 "cuiller":{"N":{"g":"f",
                 "tab":["n17"]}},
 "cuillère":{"N":{"g":"f",
                  "tab":["n17"]}},
 "cuir":{"N":{"g":"m",
              "tab":["n3"]}},
 "cuire":{"V":{"aux":["av"],
               "tab":"v113"}},
 "cuisine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "cuisinière":{"N":{"g":"f",
                    "tab":["n17"]}},
 "cuivre":{"N":{"g":"m",
                "tab":["n3"]}},
 "culotte":{"N":{"g":"f",
                 "tab":["n17"]}},
 "cultivateur":{"N":{"g":"x",
                     "tab":["n56"]}},
 "cultiver":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "culture":{"N":{"g":"f",
                 "tab":["n17"]}},
 "curé":{"N":{"g":"m",
              "tab":["n3"]}},
 "curieux":{"A":{"tab":["n54"]}},
 "curiosité":{"N":{"g":"f",
                   "tab":["n17"]}},
 "cycliste":{"N":{"g":"x",
                  "tab":["n25"]}},
 "cygne":{"N":{"g":"m",
               "tab":["n3"]}},
 "d'abord":{"Adv":{"tab":["av"]}},
 "d'après":{"P":{"tab":["pp"]}},
 "dahlia":{"N":{"g":"m",
                "tab":["n3"]}},
 "daigner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "dame":{"N":{"g":"f",
              "tab":["n17"]}},
 "danger":{"N":{"g":"m",
                "tab":["n3"]}},
 "dangereux":{"A":{"tab":["n54"]}},
 "dans":{"P":{"tab":["pp"]}},
 "danse":{"N":{"g":"f",
               "tab":["n17"]}},
 "danser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "darder":{"V":{"aux":["av"],
                "tab":"v36"}},
 "date":{"N":{"g":"f",
              "tab":["n17"]}},
 "dater":{"V":{"aux":["av"],
               "tab":"v36"}},
 "davantage":{"Adv":{"tab":["av"]}},
 "de":{"P":{"tab":["ppe"]}},
 "débarquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "débarrasser":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "débattre":{"V":{"aux":["av"],
                  "tab":"v87"}},
 "débiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "déborder":{"V":{"aux":["aê"],
                  "tab":"v36"}},
 "déboucher":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "debout":{"Adv":{"tab":["av"]}},
 "débris":{"N":{"g":"m",
                "tab":["n2"]}},
 "début":{"N":{"g":"m",
               "tab":["n3"]}},
 "décéder":{"V":{"aux":["êt"],
                 "tab":"v30"}},
 "décembre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "déception":{"N":{"g":"f",
                   "tab":["n17"]}},
 "déchaîner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "décharger":{"V":{"aux":["av"],
                   "tab":"v3"}},
 "déchirer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "décider":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "décision":{"N":{"g":"f",
                  "tab":["n17"]}},
 "déclarer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "décorer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "découper":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "décourager":{"V":{"aux":["av"],
                    "tab":"v3"}},
 "découverte":{"N":{"g":"f",
                    "tab":["n17"]}},
 "découvrir":{"V":{"aux":["av"],
                   "tab":"v44"}},
 "décrire":{"V":{"aux":["av"],
                 "tab":"v114"}},
 "dédaigner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "dedans":{"Adv":{"tab":["av"]},
           "P":{"tab":["pp"]}},
 "défaire":{"V":{"aux":["av"],
                 "tab":"v124"}},
 "défaut":{"N":{"g":"m",
                "tab":["n3"]}},
 "défendre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "défense":{"N":{"g":"f",
                 "tab":["n17"]}},
 "défenseur":{"N":{"g":"x",
                   "tab":["n55"]}},
 "défiler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "défunt":{"N":{"g":"x",
                "tab":["n28"]}},
 "dégager":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "dégât":{"N":{"g":"m",
               "tab":["n3"]}},
 "degré":{"N":{"g":"m",
               "tab":["n3"]}},
 "dehors":{"Adv":{"tab":["av"]}},
 "déjà":{"Adv":{"tab":["av"]}},
 "déjeuner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "délaisser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "délicat":{"A":{"tab":["n28"]}},
 "délice":{"N":{"g":"x",
                "tab":["n25"]}},
 "délicieux":{"A":{"tab":["n54"]}},
 "délivrer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "demain":{"Adv":{"tab":["av"]}},
 "demande":{"N":{"g":"f",
                 "tab":["n17"]}},
 "demander":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "démarche":{"N":{"g":"f",
                  "tab":["n17"]}},
 "déménager":{"V":{"aux":["aê"],
                   "tab":"v3"}},
 "demeure":{"N":{"g":"f",
                 "tab":["n17"]}},
 "demeurer":{"V":{"aux":["aê"],
                  "tab":"v36"}},
 "demi":{"N":{"g":"m",
              "tab":["n3"]}},
 "demoiselle":{"N":{"g":"f",
                    "tab":["n17"]}},
 "démolir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "démontrer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "dent":{"N":{"g":"f",
              "tab":["n17"]}},
 "dentelle":{"N":{"g":"f",
                  "tab":["n17"]}},
 "dénudé":{"A":{"tab":["n28"]}},
 "départ":{"N":{"g":"m",
                "tab":["n3"]}},
 "dépasser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "dépêcher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "dépendre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "dépens":{"N":{"g":"m",
                "tab":["n1"]}},
 "dépenser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "déplacer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "déplaire":{"V":{"aux":["av"],
                  "tab":"v123"}},
 "déployer":{"V":{"aux":["av"],
                  "tab":"v5"}},
 "déposer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "dépôt":{"N":{"g":"m",
               "tab":["n3"]}},
 "dépouiller":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "depuis":{"P":{"tab":["pp"]}},
 "déranger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "dernier":{"A":{"pos":"pre",
                 "tab":["n39"]}},
 "dernièrement":{"Adv":{"tab":["av"]}},
 "dérober":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "dérouler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "derrière":{"P":{"tab":["pp"]}},
 "dès":{"P":{"tab":["pp"]}},
 "désagréable":{"A":{"tab":["n25"]}},
 "désaltérer":{"V":{"aux":["av"],
                    "tab":"v28"}},
 "désastre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "descendre":{"V":{"aux":["aê"],
                   "tab":"v85"}},
 "descente":{"N":{"g":"f",
                  "tab":["n17"]}},
 "description":{"N":{"g":"f",
                     "tab":["n17"]}},
 "désert":{"A":{"tab":["n28"]}},
 "désespérer":{"V":{"aux":["av"],
                    "tab":"v28"}},
 "désespoir":{"N":{"g":"m",
                   "tab":["n3"]}},
 "déshabiller":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "désigner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "désir":{"N":{"g":"m",
               "tab":["n3"]}},
 "désirer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "désireux":{"A":{"tab":["n54"]}},
 "désobéir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "désobéissance":{"N":{"g":"f",
                       "tab":["n17"]}},
 "désobéissant":{"A":{"tab":["n28"]}},
 "désolation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "désoler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "désordre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "désormais":{"Adv":{"tab":["av"]}},
 "dessein":{"N":{"g":"m",
                 "tab":["n3"]}},
 "dessert":{"N":{"g":"m",
                 "tab":["n3"]}},
 "dessin":{"N":{"g":"m",
                "tab":["n3"]}},
 "dessiner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "dessous":{"P":{"tab":["pp"]}},
 "dessus":{"N":{"g":"m",
                "tab":["n2"]},
           "P":{"tab":["pp"]}},
 "destination":{"N":{"g":"f",
                     "tab":["n17"]}},
 "destinée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "destiner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "détacher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "détail":{"N":{"g":"m",
                "tab":["n3"]}},
 "déterminer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "détester":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "détour":{"N":{"g":"m",
                "tab":["n3"]}},
 "détourner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "détruire":{"V":{"aux":["av"],
                  "tab":"v113"}},
 "dette":{"N":{"g":"f",
               "tab":["n17"]}},
 "deuil":{"N":{"g":"m",
               "tab":["n3"]}},
 "devant":{"P":{"tab":["pp"]}},
 "développer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "devenir":{"V":{"aux":["êt"],
                 "tab":"v52"}},
 "deviner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "devoir":{"V":{"aux":["av"],
                "tab":"v64"}},
 "dévorer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "dévouement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "dévouer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "diable":{"N":{"g":"m",
                "tab":["n3"]}},
 "diamant":{"N":{"g":"m",
                 "tab":["n3"]}},
 "dictée":{"N":{"g":"f",
                "tab":["n17"]}},
 "dicter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "dictionnaire":{"N":{"g":"m",
                      "tab":["n3"]}},
 "dieu":{"N":{"g":"m",
              "tab":["n4"]}},
 "différence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "différent":{"A":{"tab":["n28"]}},
 "différer":{"V":{"aux":["av"],
                  "tab":"v28"}},
 "difficile":{"A":{"tab":["n25"]}},
 "difficilement":{"Adv":{"tab":["av"]}},
 "difficulté":{"N":{"g":"f",
                    "tab":["n17"]}},
 "digne":{"A":{"tab":["n25"]}},
 "dimanche":{"N":{"g":"m",
                  "tab":["n3"]}},
 "dimension":{"N":{"g":"f",
                   "tab":["n17"]}},
 "diminuer":{"V":{"aux":["aê"],
                  "tab":"v36"}},
 "dîner":{"V":{"aux":["av"],
               "tab":"v36"}},
 "dire":{"V":{"aux":["av"],
              "tab":"v117"}},
 "directement":{"Adv":{"tab":["av"]}},
 "directeur":{"N":{"g":"x",
                   "tab":["n56"]}},
 "direction":{"N":{"g":"f",
                   "tab":["n17"]}},
 "directrice":{"N":{"g":"f",
                    "tab":["n17"]}},
 "diriger":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "discours":{"N":{"g":"m",
                  "tab":["n2"]}},
 "discussion":{"N":{"g":"f",
                    "tab":["n17"]}},
 "discuter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "disparaître":{"V":{"aux":["aê"],
                     "tab":"v101"}},
 "disparition":{"N":{"g":"f",
                     "tab":["n17"]}},
 "dispenser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "disperser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "disposer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "disposition":{"N":{"g":"f",
                     "tab":["n17"]}},
 "disputer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "dissiper":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "distance":{"N":{"g":"f",
                  "tab":["n17"]}},
 "distinction":{"N":{"g":"f",
                     "tab":["n17"]}},
 "distinguer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "distraction":{"N":{"g":"f",
                     "tab":["n17"]}},
 "distraire":{"V":{"aux":["av"],
                   "tab":"v125"}},
 "distrait":{"A":{"tab":["n28"]}},
 "distribuer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "distribution":{"N":{"g":"f",
                      "tab":["n17"]}},
 "divin":{"A":{"tab":["n28"]}},
 "diviser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "division":{"N":{"g":"f",
                  "tab":["n17"]}},
 "dizaine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "docile":{"A":{"tab":["n25"]}},
 "docteur":{"N":{"g":"x",
                 "tab":["n25"]}},
 "doigt":{"N":{"g":"m",
               "tab":["n3"]}},
 "domaine":{"N":{"g":"m",
                 "tab":["n3"]}},
 "domestique":{"A":{"tab":["n25"]}},
 "domicile":{"N":{"g":"m",
                  "tab":["n3"]}},
 "dominer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "dommage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "dompteur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "don":{"N":{"g":"m",
             "tab":["n3"]}},
 "donc":{"Adv":{"tab":["av"]},
         "C":{"tab":["cj"]}},
 "donner":{"V":{"aux":["av"],
                "tab":"v36"}},
 "dont":{"Pro":{"tab":["pn23"]}},
 "dorer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "dormir":{"V":{"aux":["av"],
                "tab":"v45"}},
 "dortoir":{"N":{"g":"m",
                 "tab":["n3"]}},
 "dos":{"N":{"g":"m",
             "tab":["n2"]}},
 "dossier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "double":{"A":{"tab":["n25"]}},
 "doubler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "doucement":{"Adv":{"tab":["av"]}},
 "douceur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "douleur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "douloureux":{"A":{"tab":["n54"]}},
 "doute":{"N":{"g":"m",
               "tab":["n3"]}},
 "douter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "doux":{"A":{"tab":["n70"]}},
 "douzaine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "doyen":{"N":{"g":"x",
               "tab":["n49"]}},
 "drap":{"N":{"g":"m",
              "tab":["n3"]}},
 "drapeau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "dresser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "droit":{"A":{"tab":["n28"]}},
 "drôle":{"A":{"tab":["n25"]}},
 "du":{"D":{"tab":["d3"]}},
 "duc":{"N":{"g":"m",
             "tab":["n3"]}},
 "dur":{"A":{"tab":["n28"]}},
 "durant":{"P":{"tab":["pp"]}},
 "durée":{"N":{"g":"f",
               "tab":["n17"]}},
 "durer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "duvet":{"N":{"g":"m",
               "tab":["n3"]}},
 "eau":{"N":{"g":"f",
             "tab":["n18"]}},
 "ébats":{"N":{"g":"m",
               "tab":["n1"]}},
 "éblouir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "ébranler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "écarter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "échanger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "échantillon":{"N":{"g":"m",
                     "tab":["n3"]}},
 "échapper":{"V":{"aux":["aê"],
                  "tab":"v36"}},
 "écharpe":{"N":{"g":"f",
                 "tab":["n17"]}},
 "échec":{"N":{"g":"m",
               "tab":["n3"]}},
 "échelle":{"N":{"g":"f",
                 "tab":["n17"]}},
 "écho":{"N":{"g":"m",
              "tab":["n3"]}},
 "éclabousser":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "éclair":{"N":{"g":"m",
                "tab":["n3"]}},
 "éclaircir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "éclairer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "éclat":{"N":{"g":"m",
               "tab":["n3"]}},
 "éclatant":{"A":{"tab":["n28"]}},
 "éclater":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "éclore":{"V":{"aux":["aê"],
                "tab":"v129"}},
 "écluse":{"N":{"g":"f",
                "tab":["n17"]}},
 "école":{"N":{"g":"f",
               "tab":["n17"]}},
 "écolier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "économie":{"N":{"g":"f",
                  "tab":["n17"]}},
 "économiser":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "écorce":{"N":{"g":"f",
                "tab":["n17"]}},
 "écouler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "écouter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "écraser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "écrier":{"V":{"aux":["êt"],
                "tab":"v36"}},
 "écrire":{"V":{"aux":["av"],
                "tab":"v114"}},
 "écrit":{"A":{"tab":["n28"]}},
 "écriture":{"N":{"g":"f",
                  "tab":["n17"]}},
 "écrivain":{"N":{"g":"m",
                  "tab":["n3"]}},
 "écrouler":{"V":{"aux":["êt"],
                  "tab":"v36"}},
 "écureuil":{"N":{"g":"m",
                  "tab":["n3"]}},
 "écurie":{"N":{"g":"f",
                "tab":["n17"]}},
 "édifier":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "éducation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "effacer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "effectuer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "effet":{"N":{"g":"m",
               "tab":["n3"]}},
 "efforcer":{"V":{"aux":["êt"],
                  "tab":"v0"}},
 "effort":{"N":{"g":"m",
                "tab":["n3"]}},
 "effrayer":{"V":{"aux":["av"],
                  "tab":"v4"}},
 "effroyable":{"A":{"tab":["n25"]}},
 "égal":{"A":{"tab":["n47"]}},
 "également":{"Adv":{"tab":["av"]}},
 "égard":{"N":{"g":"m",
               "tab":["n3"]}},
 "égarer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "église":{"N":{"g":"f",
                "tab":["n17"]}},
 "élan":{"N":{"g":"m",
              "tab":["n3"]}},
 "élancer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "élargir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "électricité":{"N":{"g":"f",
                     "tab":["n17"]}},
 "électrique":{"A":{"tab":["n25"]}},
 "élégant":{"A":{"tab":["n28"]}},
 "éléphant":{"N":{"g":"m",
                  "tab":["n3"]}},
 "élève":{"N":{"g":"x",
               "tab":["n25"]}},
 "élever":{"V":{"aux":["av"],
                "tab":"v25"}},
 "éloigner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "emballer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "embarquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "embarras":{"N":{"g":"m",
                  "tab":["n2"]}},
 "embarrasser":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "embaumer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "embellir":{"V":{"aux":["aê"],
                  "tab":"v58"}},
 "embrasser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "émerveiller":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "emmener":{"V":{"aux":["av"],
                 "tab":"v24"}},
 "émotion":{"N":{"g":"f",
                 "tab":["n17"]}},
 "émouvoir":{"V":{"aux":["av"],
                  "tab":"v66"}},
 "emparer":{"V":{"aux":["êt"],
                 "tab":"v36"}},
 "empêcher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "empereur":{"N":{"g":"x",
                  "tab":["n71"]}},
 "emplacement":{"N":{"g":"m",
                     "tab":["n3"]}},
 "emplir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "emploi":{"N":{"g":"m",
                "tab":["n3"]}},
 "employé":{"N":{"g":"x",
                 "tab":["n28"]}},
 "employer":{"V":{"aux":["av"],
                  "tab":"v5"}},
 "emporter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "empressement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "empresser":{"V":{"aux":["êt"],
                   "tab":"v36"}},
 "en":{"P":{"tab":["pp"]},
       "Pro":{"tab":["pn10"]}},
 "encadrer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "enchanté":{"A":{"tab":["n28"]}},
 "encombrer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "encore":{"Adv":{"tab":["av"]}},
 "encourager":{"V":{"aux":["av"],
                    "tab":"v3"}},
 "encourir":{"V":{"aux":["av"],
                  "tab":"v57"}},
 "encre":{"N":{"g":"f",
               "tab":["n17"]}},
 "encrier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "endormir":{"V":{"aux":["av"],
                  "tab":"v45"}},
 "endosser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "endroit":{"N":{"g":"m",
                 "tab":["n3"]}},
 "énergie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "énergique":{"A":{"tab":["n25"]}},
 "enfance":{"N":{"g":"f",
                 "tab":["n17"]}},
 "enfant":{"N":{"g":"x",
                "tab":["n25"]}},
 "enfermer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "enfin":{"Adv":{"tab":["av"]}},
 "enflammer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "enfoncer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "enfouir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "enfuir":{"V":{"aux":["êt"],
                "tab":"v54"}},
 "engager":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "engloutir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "enlever":{"V":{"aux":["av"],
                 "tab":"v25"}},
 "ennemi":{"N":{"g":"x",
                "tab":["n28"]}},
 "ennui":{"N":{"g":"m",
               "tab":["n3"]}},
 "ennuyer":{"V":{"aux":["av"],
                 "tab":"v5"}},
 "ennuyeux":{"A":{"tab":["n54"]}},
 "énorme":{"A":{"tab":["n25"]}},
 "énormément":{"Adv":{"tab":["av"]}},
 "enquête":{"N":{"g":"f",
                 "tab":["n17"]}},
 "enrichir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "enseignement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "enseigner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "ensemble":{"Adv":{"tab":["av"]}},
 "ensoleillé":{"A":{"tab":["n28"]}},
 "ensuite":{"Adv":{"tab":["av"]}},
 "entasser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "entendre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "enterrement":{"N":{"g":"m",
                     "tab":["n3"]}},
 "enterrer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "enthousiasme":{"N":{"g":"m",
                      "tab":["n3"]}},
 "entier":{"A":{"tab":["n39"]}},
 "entièrement":{"Adv":{"tab":["av"]}},
 "entonner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "entourer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "entrain":{"N":{"g":"m",
                 "tab":["n3"]}},
 "entraîner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "entre":{"P":{"tab":["pp"]}},
 "entrée":{"N":{"g":"f",
                "tab":["n17"]}},
 "entreprendre":{"V":{"aux":["av"],
                      "tab":"v90"}},
 "entrer":{"V":{"aux":["êt"],
                "tab":"v36"}},
 "entretenir":{"V":{"aux":["av"],
                    "tab":"v52"}},
 "entretien":{"N":{"g":"m",
                   "tab":["n3"]}},
 "entrevoir":{"V":{"aux":["av"],
                   "tab":"v72"}},
 "entrouvrir":{"V":{"aux":["av"],
                    "tab":"v44"}},
 "envahir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "enveloppe":{"N":{"g":"f",
                   "tab":["n17"]}},
 "envelopper":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "envers":{"N":{"g":"m",
                "tab":["n2"]}},
 "envie":{"N":{"g":"f",
               "tab":["n17"]}},
 "envier":{"V":{"aux":["av"],
                "tab":"v36"}},
 "environ":{"Adv":{"tab":["av"]}},
 "environner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "envoi":{"N":{"g":"m",
               "tab":["n3"]}},
 "envoler":{"V":{"aux":["êt"],
                 "tab":"v36"}},
 "envoyer":{"V":{"aux":["av"],
                 "tab":"v134"}},
 "épais":{"A":{"tab":["n50"]}},
 "épanouir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "épargne":{"N":{"g":"f",
                 "tab":["n17"]}},
 "épargner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "épaule":{"N":{"g":"f",
                "tab":["n17"]}},
 "épauler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "épée":{"N":{"g":"f",
              "tab":["n17"]}},
 "épi":{"N":{"g":"m",
             "tab":["n3"]}},
 "épine":{"N":{"g":"f",
               "tab":["n17"]}},
 "époque":{"N":{"g":"f",
                "tab":["n17"]}},
 "épouser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "épouvantable":{"A":{"tab":["n25"]}},
 "épouvanter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "époux":{"N":{"g":"x",
               "tab":["n54"]}},
 "épreuve":{"N":{"g":"f",
                 "tab":["n17"]}},
 "éprouver":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "épuiser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "équilibre":{"N":{"g":"m",
                   "tab":["n3"]}},
 "équipage":{"N":{"g":"m",
                  "tab":["n3"]}},
 "équipe":{"N":{"g":"f",
                "tab":["n17"]}},
 "ériger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "errer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "erreur":{"N":{"g":"f",
                "tab":["n17"]}},
 "escalader":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "escalier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "esclave":{"N":{"g":"x",
                 "tab":["n25"]}},
 "espace":{"N":{"g":"x",
                "tab":["n25"]}},
 "espèce":{"N":{"g":"f",
                "tab":["n17"]}},
 "espérance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "espérer":{"V":{"aux":["av"],
                 "tab":"v28"}},
 "espiègle":{"A":{"tab":["n25"]}},
 "espoir":{"N":{"g":"m",
                "tab":["n3"]}},
 "esprit":{"N":{"g":"m",
                "tab":["n3"]}},
 "essai":{"N":{"g":"m",
               "tab":["n3"]}},
 "essayer":{"V":{"aux":["av"],
                 "tab":"v4"}},
 "essuyer":{"V":{"aux":["av"],
                 "tab":"v5"}},
 "estime":{"N":{"g":"f",
                "tab":["n17"]}},
 "estimer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "estomac":{"N":{"g":"m",
                 "tab":["n3"]}},
 "estrade":{"N":{"g":"f",
                 "tab":["n17"]}},
 "et":{"C":{"tab":["cj"]}},
 "étable":{"N":{"g":"f",
                "tab":["n17"]}},
 "établir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "établissement":{"N":{"g":"m",
                       "tab":["n3"]}},
 "étage":{"N":{"g":"m",
               "tab":["n3"]}},
 "étagère":{"N":{"g":"f",
                 "tab":["n17"]}},
 "étalage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "étaler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "étang":{"N":{"g":"m",
               "tab":["n3"]}},
 "état":{"N":{"g":"m",
              "tab":["n3"]}},
 "été":{"N":{"g":"m",
             "tab":["n3"]}},
 "éteindre":{"V":{"aux":["av"],
                  "tab":"v97"}},
 "étendre":{"V":{"aux":["av"],
                 "tab":"v85"}},
 "étendue":{"N":{"g":"f",
                 "tab":["n17"]}},
 "éternel":{"A":{"tab":["n48"]}},
 "éternité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "étincelant":{"A":{"tab":["n28"]}},
 "étinceler":{"V":{"aux":["av"],
                   "tab":"v7"}},
 "étincelle":{"N":{"g":"f",
                   "tab":["n17"]}},
 "étirer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "étoffe":{"N":{"g":"f",
                "tab":["n17"]}},
 "étoile":{"N":{"g":"f",
                "tab":["n17"]}},
 "étonnement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "étonner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "étouffer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "étourdi":{"A":{"tab":["n28"]}},
 "étrange":{"A":{"tab":["n25"]}},
 "étranger":{"A":{"tab":["n39"]}},
 "être":{"N":{"g":"m",
              "tab":["n3"]},
         "V":{"aux":["av"],
              "tab":"v136"}},
 "étroit":{"A":{"tab":["n28"]}},
 "étude":{"N":{"g":"f",
               "tab":["n17"]}},
 "étudiant":{"N":{"g":"x",
                  "tab":["n28"]}},
 "étudier":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "évangile":{"N":{"g":"m",
                  "tab":["n3"]}},
 "évanouir":{"V":{"aux":["êt"],
                  "tab":"v58"}},
 "éveiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "événement":{"N":{"g":"m",
                   "tab":["n3"]}},
 "évêque":{"N":{"g":"m",
                "tab":["n3"]}},
 "évidemment":{"Adv":{"tab":["av"]}},
 "éviter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "exact":{"A":{"tab":["n28"]}},
 "exactement":{"Adv":{"tab":["av"]}},
 "exactitude":{"N":{"g":"f",
                    "tab":["n17"]}},
 "examen":{"N":{"g":"m",
                "tab":["n3"]}},
 "examiner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "exaucer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "excellence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "excellent":{"A":{"tab":["n28"]}},
 "exciter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "exclamation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "excursion":{"N":{"g":"f",
                   "tab":["n17"]}},
 "excuse":{"N":{"g":"f",
                "tab":["n17"]}},
 "excuser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "exécuter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "exécution":{"N":{"g":"f",
                   "tab":["n17"]}},
 "exemplaire":{"N":{"g":"m",
                    "tab":["n3"]}},
 "exemple":{"N":{"g":"m",
                 "tab":["n3"]}},
 "exercer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "exercice":{"N":{"g":"m",
                  "tab":["n3"]}},
 "exhaler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "exiger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "existence":{"N":{"g":"f",
                   "tab":["n17"]}},
 "exister":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "expédier":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "expédition":{"N":{"g":"f",
                    "tab":["n17"]}},
 "expérience":{"N":{"g":"f",
                    "tab":["n17"]}},
 "expirer":{"V":{"aux":["aê"],
                 "tab":"v36"}},
 "explication":{"N":{"g":"f",
                     "tab":["n17"]}},
 "expliquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "exposer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "exposition":{"N":{"g":"f",
                    "tab":["n17"]}},
 "exprès":{"Adv":{"tab":["av"]}},
 "expression":{"N":{"g":"f",
                    "tab":["n17"]}},
 "exprimer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "exquis":{"A":{"tab":["n27"]}},
 "extérieur":{"A":{"tab":["n28"]}},
 "extraire":{"V":{"aux":["av"],
                  "tab":"v125"}},
 "extraordinaire":{"A":{"tab":["n25"]}},
 "extrême":{"A":{"tab":["n25"]}},
 "extrémité":{"N":{"g":"f",
                   "tab":["n17"]}},
 "fabrication":{"N":{"g":"f",
                     "tab":["n17"]}},
 "fabrique":{"N":{"g":"f",
                  "tab":["n17"]}},
 "fabriquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "façade":{"N":{"g":"f",
                "tab":["n17"]}},
 "fâcher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "fâcheux":{"A":{"tab":["n54"]}},
 "facile":{"A":{"tab":["n25"]}},
 "facilement":{"Adv":{"tab":["av"]}},
 "facilité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "faciliter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "façon":{"N":{"g":"f",
               "tab":["n17"]}},
 "façonner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "facteur":{"N":{"g":"x",
                 "tab":["n56"]}},
 "faible":{"A":{"tab":["n25"]}},
 "faiblesse":{"N":{"g":"f",
                   "tab":["n17"]}},
 "faim":{"N":{"g":"f",
              "tab":["n17"]}},
 "faire":{"V":{"aux":["av"],
               "tab":"v124"}},
 "fait":{"N":{"g":"m",
              "tab":["n3"]}},
 "falloir":{"V":{"aux":["av"],
                 "tab":"v80"}},
 "fameux":{"A":{"tab":["n54"]}},
 "familial":{"A":{"tab":["n47"]}},
 "familier":{"A":{"tab":["n39"]}},
 "famille":{"N":{"g":"f",
                 "tab":["n17"]}},
 "faner":{"V":{"aux":["av"],
               "tab":"v36"}},
 "farce":{"N":{"g":"f",
               "tab":["n17"]}},
 "farine":{"N":{"g":"f",
                "tab":["n17"]}},
 "farouche":{"A":{"tab":["n25"]}},
 "fatal":{"A":{"tab":["n28"]}},
 "fatigue":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fatiguer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "faucher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "faucheur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "faute":{"N":{"g":"f",
               "tab":["n17"]}},
 "fauteuil":{"N":{"g":"m",
                  "tab":["n3"]}},
 "fauve":{"A":{"tab":["n25"]}},
 "fauvette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "faux":{"A":{"pos":"pre",
              "tab":["n53"]}},
 "faveur":{"N":{"g":"f",
                "tab":["n17"]}},
 "favorable":{"A":{"tab":["n25"]}},
 "favori":{"A":{"tab":["n34"]}},
 "favoriser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "fée":{"N":{"g":"f",
             "tab":["n17"]}},
 "féliciter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "femelle":{"N":{"g":"f",
                 "tab":["n17"]}},
 "femme":{"N":{"g":"f",
               "tab":["n17"]}},
 "fendre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "fenêtre":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fer":{"N":{"g":"m",
             "tab":["n3"]}},
 "ferme":{"N":{"g":"f",
               "tab":["n17"]}},
 "fermer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "fermier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "féroce":{"A":{"tab":["n25"]}},
 "ferraille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "ferrer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "fervent":{"A":{"tab":["n28"]}},
 "ferveur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fête":{"N":{"g":"f",
              "tab":["n17"]}},
 "fêter":{"V":{"aux":["av"],
               "tab":"v36"}},
 "feu":{"N":{"g":"m",
             "tab":["n4"]}},
 "feuillage":{"N":{"g":"m",
                   "tab":["n3"]}},
 "feuille":{"N":{"g":"f",
                 "tab":["n17"]}},
 "février":{"N":{"g":"m",
                 "tab":["n3"]}},
 "fiancé":{"N":{"g":"x",
                "tab":["n28"]}},
 "ficelle":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fidèle":{"A":{"tab":["n25"]}},
 "fier":{"A":{"tab":["n39"]},
         "V":{"aux":["êt"],
              "tab":"v36"}},
 "fièrement":{"Adv":{"tab":["av"]}},
 "fièvre":{"N":{"g":"f",
                "tab":["n17"]}},
 "figure":{"N":{"g":"f",
                "tab":["n17"]}},
 "figurer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "fil":{"N":{"g":"m",
             "tab":["n3"]}},
 "file":{"N":{"g":"f",
              "tab":["n17"]}},
 "filer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "filet":{"N":{"g":"m",
               "tab":["n3"]}},
 "fille":{"N":{"g":"f",
               "tab":["n17"]}},
 "fillette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "filleul":{"N":{"g":"x",
                 "tab":["n28"]}},
 "fils":{"N":{"g":"m",
              "tab":["n2"]}},
 "fin":{"N":{"g":"f",
             "tab":["n17"]}},
 "finalement":{"Adv":{"tab":["av"]}},
 "finir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "firmament":{"N":{"g":"m",
                   "tab":["n3"]}},
 "fixe":{"A":{"tab":["n25"]}},
 "fixer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "flacon":{"N":{"g":"m",
                "tab":["n3"]}},
 "flamand":{"A":{"tab":["n28"]}},
 "flamber":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "flamme":{"N":{"g":"f",
                "tab":["n17"]}},
 "flanc":{"N":{"g":"m",
               "tab":["n3"]}},
 "flaque":{"N":{"g":"f",
                "tab":["n17"]}},
 "flatter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "flatteur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "fléau":{"N":{"g":"m",
               "tab":["n4"]}},
 "flèche":{"N":{"g":"f",
                "tab":["n17"]}},
 "fleur":{"N":{"g":"f",
               "tab":["n17"]}},
 "fleurette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "fleurir":{"V":{"aux":["av"],
                 "tab":"v43"}},
 "fleuve":{"N":{"g":"m",
                "tab":["n3"]}},
 "flocon":{"N":{"g":"m",
                "tab":["n3"]}},
 "flot":{"N":{"g":"m",
              "tab":["n3"]}},
 "flotter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "flûte":{"N":{"g":"f",
               "tab":["n17"]}},
 "foi":{"N":{"g":"f",
             "tab":["n17"]}},
 "foie":{"N":{"g":"m",
              "tab":["n3"]}},
 "foin":{"N":{"g":"m",
              "tab":["n3"]}},
 "foire":{"N":{"g":"f",
               "tab":["n17"]}},
 "fois":{"N":{"g":"f",
              "tab":["n16"]}},
 "foncer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "fonction":{"N":{"g":"f",
                  "tab":["n17"]}},
 "fond":{"N":{"g":"m",
              "tab":["n3"]}},
 "fondre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "fonds":{"N":{"g":"m",
               "tab":["n2"]}},
 "fontaine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "football":{"N":{"g":"m",
                  "tab":["n35"]}},
 "force":{"N":{"g":"f",
               "tab":["n17"]}},
 "forcer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "forestier":{"A":{"tab":["n39"]}},
 "forêt":{"N":{"g":"f",
               "tab":["n17"]}},
 "forge":{"N":{"g":"f",
               "tab":["n17"]}},
 "forger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "forgeron":{"N":{"g":"m",
                  "tab":["n3"]}},
 "forme":{"N":{"g":"f",
               "tab":["n17"]}},
 "former":{"V":{"aux":["av"],
                "tab":"v36"}},
 "formidable":{"A":{"tab":["n25"]}},
 "fort":{"A":{"tab":["n28"]},
         "Adv":{"tab":["av"]}},
 "fortement":{"Adv":{"tab":["av"]}},
 "fortune":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fossé":{"N":{"g":"m",
               "tab":["n3"]}},
 "fou":{"A":{"tab":["n109"]}},
 "foudre":{"N":{"g":"f",
                "tab":["n17"]}},
 "fouet":{"N":{"g":"m",
               "tab":["n3"]}},
 "fouetter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "fougère":{"N":{"g":"f",
                 "tab":["n17"]}},
 "fouiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "foule":{"N":{"g":"f",
               "tab":["n17"]}},
 "four":{"N":{"g":"m",
              "tab":["n3"]}},
 "fourmi":{"N":{"g":"f",
                "tab":["n17"]}},
 "fourneau":{"N":{"g":"m",
                  "tab":["n4"]}},
 "fournir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "fourniture":{"N":{"g":"f",
                    "tab":["n17"]}},
 "fourrer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "fourrure":{"N":{"g":"f",
                  "tab":["n17"]}},
 "foyer":{"N":{"g":"m",
               "tab":["n3"]}},
 "fragile":{"A":{"tab":["n25"]}},
 "fraîcheur":{"N":{"g":"f",
                   "tab":["n17"]}},
 "frais":{"A":{"tab":["n44"]}},
 "fraise":{"N":{"g":"f",
                "tab":["n17"]}},
 "franc":{"A":{"tab":["n61"]}},
 "français":{"A":{"tab":["n27"]}},
 "franchement":{"Adv":{"tab":["av"]}},
 "franchir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "franchise":{"N":{"g":"f",
                   "tab":["n17"]}},
 "frapper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "frayeur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "frêle":{"A":{"tab":["n25"]}},
 "frémir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "fréquemment":{"Adv":{"tab":["av"]}},
 "fréquent":{"A":{"tab":["n28"]}},
 "fréquenter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "frère":{"N":{"g":"m",
               "tab":["n3"]}},
 "friandise":{"N":{"g":"f",
                   "tab":["n17"]}},
 "frissonner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "froid":{"A":{"tab":["n28"]}},
 "froisser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "fromage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "froment":{"N":{"g":"m",
                 "tab":["n3"]}},
 "front":{"N":{"g":"m",
               "tab":["n3"]}},
 "frontière":{"N":{"g":"f",
                   "tab":["n17"]}},
 "frotter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "fruit":{"N":{"g":"m",
               "tab":["n3"]}},
 "fruitier":{"A":{"tab":["n39"]}},
 "fuir":{"V":{"aux":["av"],
              "tab":"v54"}},
 "fuite":{"N":{"g":"f",
               "tab":["n17"]}},
 "fumée":{"N":{"g":"f",
               "tab":["n17"]}},
 "fumer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "fureur":{"N":{"g":"f",
                "tab":["n17"]}},
 "furieux":{"A":{"tab":["n54"]}},
 "fusil":{"N":{"g":"m",
               "tab":["n3"]}},
 "futur":{"A":{"tab":["n28"]}},
 "gagner":{"V":{"aux":["av"],
                "tab":"v36"}},
 "gai":{"A":{"tab":["n28"]}},
 "gaiement":{"Adv":{"tab":["av"]}},
 "gaieté":{"N":{"g":"f",
                "tab":["n17"]}},
 "galerie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "gambader":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "gamin":{"N":{"g":"x",
               "tab":["n28"]}},
 "gant":{"N":{"g":"m",
              "tab":["n3"]}},
 "garantir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "garçon":{"N":{"g":"m",
                "tab":["n3"]}},
 "garde":{"N":{"g":"x",
               "tab":["n25"]}},
 "garder":{"V":{"aux":["av"],
                "tab":"v36"}},
 "gardien":{"N":{"g":"x",
                 "tab":["n49"]}},
 "gare":{"N":{"g":"f",
              "tab":["n17"]}},
 "garnir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "garniture":{"N":{"g":"f",
                   "tab":["n17"]}},
 "gars":{"N":{"g":"m",
              "tab":["n2"]}},
 "gâteau":{"N":{"g":"m",
                "tab":["n4"]}},
 "gâter":{"V":{"aux":["av"],
               "tab":"v36"}},
 "gauche":{"A":{"tab":["n25"]}},
 "gaufre":{"N":{"g":"f",
                "tab":["n17"]}},
 "gaz":{"N":{"g":"m",
             "tab":["n2"]}},
 "gazon":{"N":{"g":"m",
               "tab":["n3"]}},
 "gazouillement":{"N":{"g":"m",
                       "tab":["n3"]}},
 "gazouiller":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "géant":{"A":{"tab":["n28"]}},
 "gelée":{"N":{"g":"f",
               "tab":["n17"]}},
 "geler":{"V":{"aux":["av"],
               "tab":"v8"}},
 "gémir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "gendarme":{"N":{"g":"m",
                  "tab":["n3"]}},
 "gêner":{"V":{"aux":["av"],
               "tab":"v36"}},
 "général":{"A":{"tab":["n47"]}},
 "généralement":{"Adv":{"tab":["av"]}},
 "génération":{"N":{"g":"f",
                    "tab":["n17"]}},
 "généreux":{"A":{"tab":["n54"]}},
 "générosité":{"N":{"g":"f",
                    "tab":["n17"]}},
 "genêt":{"N":{"g":"m",
               "tab":["n3"]}},
 "genou":{"N":{"g":"m",
               "tab":["n4"]}},
 "genre":{"N":{"g":"m",
               "tab":["n3"]}},
 "gens":{"N":{"g":"m",
              "tab":["n2"]}},
 "gentil":{"A":{"tab":["n48"]}},
 "gentiment":{"Adv":{"tab":["av"]}},
 "géographie":{"N":{"g":"f",
                    "tab":["n17"]}},
 "géranium":{"N":{"g":"m",
                  "tab":["n3"]}},
 "gerbe":{"N":{"g":"f",
               "tab":["n17"]}},
 "germer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "geste":{"N":{"g":"m",
               "tab":["n3"]}},
 "gibecière":{"N":{"g":"f",
                   "tab":["n17"]}},
 "gibier":{"N":{"g":"m",
                "tab":["n3"]}},
 "giboulée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "gigantesque":{"A":{"tab":["n25"]}},
 "giroflée":{"N":{"g":"f",
                  "tab":["n17"]}},
 "gîte":{"N":{"g":"m",
              "tab":["n3"]}},
 "givre":{"N":{"g":"m",
               "tab":["n3"]}},
 "glace":{"N":{"g":"f",
               "tab":["n17"]}},
 "glacer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "gland":{"N":{"g":"m",
               "tab":["n3"]}},
 "glissant":{"A":{"tab":["n28"]}},
 "glisser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "glissoire":{"N":{"g":"f",
                   "tab":["n17"]}},
 "gloire":{"N":{"g":"f",
                "tab":["n17"]}},
 "gonfler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "gorge":{"N":{"g":"f",
               "tab":["n17"]}},
 "gosse":{"N":{"g":"x",
               "tab":["n25"]}},
 "gourmand":{"A":{"tab":["n28"]}},
 "goût":{"N":{"g":"m",
              "tab":["n3"]}},
 "goûter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "goutte":{"N":{"g":"f",
                "tab":["n17"]}},
 "gouvernement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "gouverner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "grâce":{"N":{"g":"f",
               "tab":["n17"]}},
 "gracieux":{"A":{"tab":["n54"]}},
 "grain":{"N":{"g":"m",
               "tab":["n3"]}},
 "graine":{"N":{"g":"f",
                "tab":["n17"]}},
 "graisse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "grammaire":{"N":{"g":"f",
                   "tab":["n17"]}},
 "grand":{"A":{"pos":"pre",
               "tab":["n28"]}},
 "grand-maman":{"N":{"g":"f",
                     "tab":["nI"]}},
 "grand-mère":{"N":{"g":"f",
                    "tab":["nI"]}},
 "grand-père":{"N":{"g":"m",
                    "tab":["nI"]}},
 "grandeur":{"N":{"g":"f",
                  "tab":["n17"]}},
 "grandiose":{"A":{"tab":["n25"]}},
 "grandir":{"V":{"aux":["aê"],
                 "tab":"v58"}},
 "grange":{"N":{"g":"f",
                "tab":["n17"]}},
 "grappe":{"N":{"g":"f",
                "tab":["n17"]}},
 "gras":{"A":{"tab":["n50"]}},
 "gratitude":{"N":{"g":"f",
                   "tab":["n17"]}},
 "gratter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "grave":{"A":{"tab":["n25"]}},
 "gravement":{"Adv":{"tab":["av"]}},
 "graver":{"V":{"aux":["av"],
                "tab":"v36"}},
 "gravir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "gravure":{"N":{"g":"f",
                 "tab":["n17"]}},
 "grêle":{"N":{"g":"x",
               "tab":["n25"]}},
 "grelotter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "grenier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "grenouille":{"N":{"g":"f",
                    "tab":["n17"]}},
 "grès":{"N":{"g":"m",
              "tab":["n2"]}},
 "griffe":{"N":{"g":"f",
                "tab":["n17"]}},
 "griffer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "grille":{"N":{"g":"f",
                "tab":["n17"]}},
 "grimper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "grincer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "grippe":{"N":{"g":"f",
                "tab":["n17"]}},
 "gris":{"A":{"tab":["n27"]}},
 "grive":{"N":{"g":"f",
               "tab":["n17"]}},
 "gronder":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "gros":{"A":{"pos":"pre",
              "tab":["n50"]}},
 "groseillier":{"N":{"g":"m",
                     "tab":["n3"]}},
 "grossier":{"A":{"tab":["n39"]}},
 "grossir":{"V":{"aux":["aê"],
                 "tab":"v58"}},
 "grotte":{"N":{"g":"f",
                "tab":["n17"]}},
 "groupe":{"N":{"g":"m",
                "tab":["n3"]}},
 "grouper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "grue":{"N":{"g":"f",
              "tab":["n17"]}},
 "guêpe":{"N":{"g":"f",
               "tab":["n17"]}},
 "guère":{"Adv":{"tab":["av"]}},
 "guérir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "guérison":{"N":{"g":"f",
                  "tab":["n17"]}},
 "guerre":{"N":{"g":"f",
                "tab":["n17"]}},
 "guetter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "guichet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "guide":{"N":{"g":"x",
               "tab":["n25"]}},
 "guider":{"V":{"aux":["av"],
                "tab":"v36"}},
 "gymnastique":{"N":{"g":"f",
                     "tab":["n17"]}},
 "habile":{"A":{"tab":["n25"]}},
 "habileté":{"N":{"g":"f",
                  "tab":["n17"]}},
 "habiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "habit":{"N":{"g":"m",
               "tab":["n3"]}},
 "habitant":{"N":{"g":"x",
                  "tab":["n28"]}},
 "habitation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "habiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "habitude":{"N":{"g":"f",
                  "tab":["n17"]}},
 "habituel":{"A":{"tab":["n48"]}},
 "habituer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "hache":{"N":{"g":"f",
               "h":1,
               "tab":["n17"]}},
 "haie":{"N":{"g":"f",
              "h":1,
              "tab":["n17"]}},
 "haillon":{"N":{"g":"m",
                 "h":1,
                 "tab":["n3"]}},
 "haine":{"N":{"g":"f",
               "h":1,
               "tab":["n17"]}},
 "haleine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "halte":{"N":{"g":"f",
               "h":1,
               "tab":["n17"]}},
 "hameau":{"N":{"g":"m",
                "tab":["n4"]}},
 "hangar":{"N":{"g":"m",
                "h":1,
                "tab":["n3"]}},
 "hanneton":{"N":{"g":"m",
                  "h":1,
                  "tab":["n3"]}},
 "hardi":{"A":{"h":1,
               "tab":["n28"]}},
 "harmonieux":{"A":{"tab":["n54"]}},
 "hasard":{"N":{"g":"m",
                "h":1,
                "tab":["n3"]}},
 "hâte":{"N":{"g":"f",
              "h":1,
              "tab":["n17"]}},
 "hâter":{"V":{"aux":["av"],
               "h":1,
               "tab":"v36"}},
 "hausser":{"V":{"aux":["av"],
                 "h":1,
                 "tab":"v36"}},
 "haut":{"A":{"h":1,
              "pos":"pre",
              "tab":["n28"]}},
 "hauteur":{"N":{"g":"f",
                 "h":1,
                 "tab":["n17"]}},
 "herbe":{"N":{"g":"f",
               "tab":["n17"]}},
 "hérissé":{"A":{"h":1,
                 "tab":["n28"]}},
 "hermine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "héroïque":{"A":{"tab":["n25"]}},
 "héros":{"N":{"g":"m",
               "h":1,
               "tab":["n2"]}},
 "hésiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "hêtre":{"N":{"g":"m",
               "h":1,
               "tab":["n3"]}},
 "heure":{"N":{"g":"f",
               "tab":["n17"]}},
 "heureusement":{"Adv":{"tab":["av"]}},
 "heureux":{"A":{"tab":["n54"]}},
 "heurter":{"V":{"aux":["av"],
                 "h":1,
                 "tab":"v36"}},
 "hibou":{"N":{"g":"m",
               "h":1,
               "tab":["n4"]}},
 "hier":{"Adv":{"tab":["av"]}},
 "hirondelle":{"N":{"g":"f",
                    "tab":["n17"]}},
 "histoire":{"N":{"g":"f",
                  "tab":["n17"]}},
 "hiver":{"N":{"g":"m",
               "tab":["n3"]}},
 "hommage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "homme":{"N":{"g":"m",
               "tab":["n3"]}},
 "honnête":{"A":{"tab":["n25"]}},
 "honneur":{"N":{"g":"m",
                 "tab":["n3"]}},
 "honorable":{"A":{"tab":["n25"]}},
 "honorer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "honte":{"N":{"g":"f",
               "h":1,
               "tab":["n17"]}},
 "honteux":{"A":{"h":1,
                 "tab":["n54"]}},
 "hôpital":{"N":{"g":"m",
                 "tab":["n5"]}},
 "horizon":{"N":{"g":"m",
                 "tab":["n3"]}},
 "horloge":{"N":{"g":"f",
                 "tab":["n17"]}},
 "horreur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "horrible":{"A":{"tab":["n25"]}},
 "hors":{"P":{"h":1,
              "tab":["pp"]}},
 "hôte":{"N":{"g":"x",
              "tab":["n52"]}},
 "hôtel":{"N":{"g":"m",
               "tab":["n3"]}},
 "houille":{"N":{"g":"f",
                 "h":1,
                 "tab":["n17"]}},
 "huile":{"N":{"g":"f",
               "tab":["n17"]}},
 "humain":{"A":{"tab":["n28"]}},
 "humanité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "humble":{"A":{"tab":["n25"]}},
 "humeur":{"N":{"g":"f",
                "tab":["n17"]}},
 "humide":{"A":{"tab":["n25"]}},
 "humidité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "hurler":{"V":{"aux":["av"],
                "h":1,
                "tab":"v36"}},
 "hygiène":{"N":{"g":"f",
                 "tab":["n17"]}},
 "hypocrite":{"A":{"tab":["n25"]}},
 "ici":{"Adv":{"tab":["av"]}},
 "idéal":{"A":{"tab":["n47"]}},
 "idée":{"N":{"g":"f",
              "tab":["n17"]}},
 "ignorant":{"A":{"tab":["n28"]}},
 "ignorer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "île":{"N":{"g":"f",
             "tab":["n17"]}},
 "illuminer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "illusion":{"N":{"g":"f",
                  "tab":["n17"]}},
 "illustre":{"A":{"tab":["n25"]}},
 "illustrer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "image":{"N":{"g":"f",
               "tab":["n17"]}},
 "imagination":{"N":{"g":"f",
                     "tab":["n17"]}},
 "imaginer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "imiter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "immaculé":{"A":{"tab":["n28"]}},
 "immédiatement":{"Adv":{"tab":["av"]}},
 "immense":{"A":{"tab":["n25"]}},
 "immobile":{"A":{"tab":["n25"]}},
 "impatiemment":{"Adv":{"tab":["av"]}},
 "impatience":{"N":{"g":"f",
                    "tab":["n17"]}},
 "impatient":{"A":{"tab":["n28"]}},
 "imperméable":{"A":{"tab":["n25"]}},
 "implorer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "importance":{"N":{"g":"f",
                    "tab":["n17"]}},
 "important":{"A":{"tab":["n28"]}},
 "importer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "imposant":{"A":{"tab":["n28"]}},
 "imposer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "impossibilité":{"N":{"g":"f",
                       "tab":["n17"]}},
 "impossible":{"A":{"tab":["n25"]}},
 "impression":{"N":{"g":"f",
                    "tab":["n17"]}},
 "imprévu":{"A":{"tab":["n28"]}},
 "imprimer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "imprudence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "imprudent":{"A":{"tab":["n28"]}},
 "incendie":{"N":{"g":"m",
                  "tab":["n3"]}},
 "incident":{"N":{"g":"m",
                  "tab":["n3"]}},
 "incliner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "inconnu":{"N":{"g":"x",
                 "tab":["n28"]}},
 "inconvénient":{"N":{"g":"m",
                      "tab":["n3"]}},
 "indication":{"N":{"g":"f",
                    "tab":["n17"]}},
 "indifférent":{"A":{"tab":["n28"]}},
 "indigne":{"A":{"tab":["n25"]}},
 "indiquer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "indispensable":{"A":{"tab":["n25"]}},
 "industrie":{"N":{"g":"f",
                   "tab":["n17"]}},
 "industriel":{"A":{"tab":["n48"]}},
 "inerte":{"A":{"tab":["n25"]}},
 "inférieur":{"A":{"tab":["n28"]}},
 "infini":{"A":{"tab":["n28"]}},
 "infiniment":{"Adv":{"tab":["av"]}},
 "infirme":{"A":{"tab":["n25"]}},
 "infirmier":{"N":{"g":"x",
                   "tab":["n39"]}},
 "influence":{"N":{"g":"f",
                   "tab":["n17"]}},
 "informer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "ingrat":{"A":{"tab":["n28"]}},
 "ingratitude":{"N":{"g":"f",
                     "tab":["n17"]}},
 "injure":{"N":{"g":"f",
                "tab":["n17"]}},
 "innocent":{"A":{"tab":["n28"]}},
 "inondation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "inonder":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "inquiet":{"A":{"tab":["n40"]}},
 "inquiéter":{"V":{"aux":["av"],
                   "tab":"v22"}},
 "inquiétude":{"N":{"g":"f",
                    "tab":["n17"]}},
 "inscrire":{"V":{"aux":["av"],
                  "tab":"v114"}},
 "insecte":{"N":{"g":"m",
                 "tab":["n3"]}},
 "insigne":{"N":{"g":"m",
                 "tab":["n3"]}},
 "insister":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "inspecteur":{"N":{"g":"x",
                    "tab":["n56"]}},
 "inspirer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "installer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "instant":{"N":{"g":"m",
                 "tab":["n3"]}},
 "institut":{"N":{"g":"m",
                  "tab":["n3"]}},
 "instituteur":{"N":{"g":"x",
                     "tab":["n56"]}},
 "instructif":{"A":{"tab":["n46"]}},
 "instruction":{"N":{"g":"f",
                     "tab":["n17"]}},
 "instruire":{"V":{"aux":["av"],
                   "tab":"v113"}},
 "instrument":{"N":{"g":"m",
                    "tab":["n3"]}},
 "intellectuel":{"A":{"tab":["n48"]}},
 "intelligence":{"N":{"g":"f",
                      "tab":["n17"]}},
 "intelligent":{"A":{"tab":["n28"]}},
 "intense":{"A":{"tab":["n25"]}},
 "intention":{"N":{"g":"f",
                   "tab":["n17"]}},
 "interdire":{"V":{"aux":["av"],
                   "tab":"v118"}},
 "intéressant":{"A":{"tab":["n28"]}},
 "intéresser":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "intérêt":{"N":{"g":"m",
                 "tab":["n3"]}},
 "intérieur":{"A":{"tab":["n28"]}},
 "interpeller":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "interroger":{"V":{"aux":["av"],
                    "tab":"v3"}},
 "interrompre":{"V":{"aux":["av"],
                     "tab":"v91"}},
 "interruption":{"N":{"g":"f",
                      "tab":["n17"]}},
 "intervenir":{"V":{"aux":["êt"],
                    "tab":"v52"}},
 "intime":{"A":{"tab":["n25"]}},
 "introduction":{"N":{"g":"f",
                      "tab":["n17"]}},
 "introduire":{"V":{"aux":["av"],
                    "tab":"v113"}},
 "inutile":{"A":{"tab":["n25"]}},
 "invention":{"N":{"g":"f",
                   "tab":["n17"]}},
 "invisible":{"A":{"tab":["n25"]}},
 "invitation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "inviter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "invoquer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "irriter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "isoler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "ivoire":{"N":{"g":"m",
                "tab":["n3"]}},
 "ivre":{"A":{"tab":["n25"]}},
 "ivresse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "jacinthe":{"N":{"g":"f",
                  "tab":["n17"]}},
 "jadis":{"Adv":{"tab":["av"]}},
 "jaillir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "jaloux":{"A":{"tab":["n54"]}},
 "jamais":{"Adv":{"tab":["av"]}},
 "jambe":{"N":{"g":"f",
               "tab":["n17"]}},
 "jambon":{"N":{"g":"m",
                "tab":["n3"]}},
 "janvier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "jardin":{"N":{"g":"m",
                "tab":["n3"]}},
 "jardinage":{"N":{"g":"m",
                   "tab":["n3"]}},
 "jardinier":{"N":{"g":"x",
                   "tab":["n39"]}},
 "jaune":{"A":{"tab":["n25"]}},
 "jaunir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "je":{"Pro":{"tab":["pn1"]}},
 "jeter":{"V":{"aux":["av"],
               "tab":"v10"}},
 "jeu":{"N":{"g":"m",
             "tab":["n4"]}},
 "jeudi":{"N":{"g":"m",
               "tab":["n3"]}},
 "jeune":{"A":{"pos":"pre",
               "tab":["n25"]}},
 "jeunesse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "joie":{"N":{"g":"f",
              "tab":["n17"]}},
 "joindre":{"V":{"aux":["av"],
                 "tab":"v97"}},
 "joli":{"A":{"pos":"pre",
              "tab":["n28"]}},
 "joncher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "jonquille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "joue":{"N":{"g":"f",
              "tab":["n17"]}},
 "jouer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "jouet":{"N":{"g":"m",
               "tab":["n3"]}},
 "joueur":{"N":{"g":"x",
                "tab":["n55"]}},
 "jouir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "joujou":{"N":{"g":"m",
                "tab":["n4"]}},
 "jour":{"N":{"g":"m",
              "tab":["n3"]}},
 "journal":{"N":{"g":"m",
                 "tab":["n5"]}},
 "journalier":{"A":{"tab":["n39"]}},
 "journée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "joyeusement":{"Adv":{"tab":["av"]}},
 "joyeux":{"A":{"tab":["n54"]}},
 "juge":{"N":{"g":"x",
              "tab":["n25"]}},
 "jugement":{"N":{"g":"m",
                  "tab":["n3"]}},
 "juger":{"V":{"aux":["av"],
               "tab":"v3"}},
 "juillet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "juin":{"N":{"g":"m",
              "tab":["n3"]}},
 "jurer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "jusque":{"P":{"tab":["ppe"]}},
 "juste":{"A":{"tab":["n25"]}},
 "justement":{"Adv":{"tab":["av"]}},
 "justice":{"N":{"g":"f",
                 "tab":["n17"]}},
 "képi":{"N":{"g":"m",
              "tab":["n3"]}},
 "kermesse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "kilogramme":{"N":{"g":"m",
                    "tab":["n3"]}},
 "kilomètre":{"N":{"g":"m",
                   "tab":["n3"]}},
 "là":{"Adv":{"tab":["av"]}},
 "là-bas":{"Adv":{"tab":["av"]}},
 "labeur":{"N":{"g":"m",
                "tab":["n3"]}},
 "laborieux":{"A":{"tab":["n54"]}},
 "labourer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "laboureur":{"N":{"g":"x",
                   "tab":["n55"]}},
 "lac":{"N":{"g":"m",
             "tab":["n3"]}},
 "lâcher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "laid":{"A":{"tab":["n28"]}},
 "laine":{"N":{"g":"f",
               "tab":["n17"]}},
 "laisser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "lait":{"N":{"g":"m",
              "tab":["n3"]}},
 "laitier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "lambeau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "lamentable":{"A":{"tab":["n25"]}},
 "lampe":{"N":{"g":"f",
               "tab":["n17"]}},
 "lancer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "langage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "langue":{"N":{"g":"f",
                "tab":["n17"]}},
 "lanterne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "lapin":{"N":{"g":"x",
               "tab":["n28"]}},
 "large":{"A":{"tab":["n25"]}},
 "largement":{"Adv":{"tab":["av"]}},
 "larme":{"N":{"g":"f",
               "tab":["n17"]}},
 "las":{"A":{"tab":["n50"]}},
 "lasser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "laver":{"V":{"aux":["av"],
               "tab":"v36"}},
 "le":{"D":{"tab":["d1"]},
       "Pro":{"g":"m",
              "tab":["d1"]}},
 "lécher":{"V":{"aux":["av"],
                "tab":"v27"}},
 "leçon":{"N":{"g":"f",
               "tab":["n17"]}},
 "lecture":{"N":{"g":"f",
                 "tab":["n17"]}},
 "léger":{"A":{"tab":["n39"]}},
 "légèrement":{"Adv":{"tab":["av"]}},
 "légume":{"N":{"g":"x",
                "tab":["n25"]}},
 "lendemain":{"N":{"g":"m",
                   "tab":["n3"]}},
 "lent":{"A":{"tab":["n28"]}},
 "lentement":{"Adv":{"tab":["av"]}},
 "lenteur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "lequel":{"Pro":{"tab":["pn24"]}},
 "lettre":{"N":{"g":"f",
                "tab":["n17"]}},
 "lever":{"V":{"aux":["av"],
               "tab":"v25"}},
 "lèvre":{"N":{"g":"f",
               "tab":["n17"]}},
 "libérer":{"V":{"aux":["av"],
                 "tab":"v28"}},
 "liberté":{"N":{"g":"f",
                 "tab":["n17"]}},
 "libre":{"A":{"tab":["n25"]}},
 "lien":{"N":{"g":"m",
              "tab":["n3"]}},
 "lier":{"V":{"aux":["av"],
              "tab":"v36"}},
 "lierre":{"N":{"g":"m",
                "tab":["n3"]}},
 "lieu":{"N":{"g":"m",
              "tab":["n4"]}},
 "lieue":{"N":{"g":"f",
               "tab":["n17"]}},
 "lièvre":{"N":{"g":"m",
                "tab":["n3"]}},
 "ligne":{"N":{"g":"f",
               "tab":["n17"]}},
 "ligue":{"N":{"g":"f",
               "tab":["n17"]}},
 "lilas":{"N":{"g":"m",
               "tab":["n2"]}},
 "limite":{"N":{"g":"f",
                "tab":["n17"]}},
 "limiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "limpide":{"A":{"tab":["n25"]}},
 "lin":{"N":{"g":"m",
             "tab":["n3"]}},
 "linge":{"N":{"g":"m",
               "tab":["n3"]}},
 "lion":{"N":{"g":"x",
              "tab":["n49"]}},
 "liquide":{"A":{"tab":["n25"]}},
 "lire":{"V":{"aux":["av"],
              "tab":"v120"}},
 "lis":{"N":{"g":"m",
             "tab":["n2"]}},
 "lisière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "lisse":{"A":{"tab":["n25"]}},
 "liste":{"N":{"g":"f",
               "tab":["n17"]}},
 "lit":{"N":{"g":"m",
             "tab":["n3"]}},
 "litière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "livre":{"N":{"g":"x",
               "tab":["n25"]}},
 "livrer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "local":{"N":{"g":"m",
               "tab":["n5"]}},
 "localité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "locomotive":{"N":{"g":"f",
                    "tab":["n17"]}},
 "loger":{"V":{"aux":["av"],
               "tab":"v3"}},
 "logis":{"N":{"g":"m",
               "tab":["n2"]}},
 "loi":{"N":{"g":"f",
             "tab":["n17"]}},
 "loin":{"Adv":{"tab":["av"]}},
 "lointain":{"A":{"tab":["n28"]}},
 "loisir":{"N":{"g":"m",
                "tab":["n3"]}},
 "long":{"A":{"tab":["n64"]}},
 "longer":{"V":{"aux":["av"],
                "tab":"v3"}},
 "longtemps":{"Adv":{"tab":["av"]}},
 "longuement":{"Adv":{"tab":["av"]}},
 "longueur":{"N":{"g":"f",
                  "tab":["n17"]}},
 "lors":{"Adv":{"tab":["av"]}},
 "lot":{"N":{"g":"m",
             "tab":["n3"]}},
 "louange":{"N":{"g":"f",
                 "tab":["n17"]}},
 "louer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "loup":{"N":{"g":"m",
              "tab":["n3"]}},
 "lourd":{"A":{"tab":["n28"]}},
 "louve":{"N":{"g":"f",
               "tab":["n17"]}},
 "loyal":{"A":{"tab":["n47"]}},
 "lueur":{"N":{"g":"f",
               "tab":["n17"]}},
 "lugubre":{"A":{"tab":["n25"]}},
 "luire":{"V":{"aux":["av"],
               "tab":"v112"}},
 "luisant":{"A":{"tab":["n28"]}},
 "lumière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "lumineux":{"A":{"tab":["n54"]}},
 "lundi":{"N":{"g":"m",
               "tab":["n3"]}},
 "lune":{"N":{"g":"f",
              "tab":["n17"]}},
 "lunette":{"N":{"g":"f",
                 "tab":["n17"]}},
 "lutin":{"N":{"g":"m",
               "tab":["n3"]}},
 "lutte":{"N":{"g":"f",
               "tab":["n17"]}},
 "lutter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "lys":{"N":{"g":"m",
             "tab":["n2"]}},
 "machine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "mâchoire":{"N":{"g":"f",
                  "tab":["n17"]}},
 "madame":{"N":{"g":"f",
                "tab":["n19"]}},
 "mademoiselle":{"N":{"g":"f",
                      "tab":["n20"]}},
 "magasin":{"N":{"g":"m",
                 "tab":["n3"]}},
 "magique":{"A":{"tab":["n25"]}},
 "magnifique":{"A":{"tab":["n25"]}},
 "mai":{"N":{"g":"m",
             "tab":["n3"]}},
 "maigre":{"A":{"tab":["n25"]}},
 "main":{"N":{"g":"f",
              "tab":["n17"]}},
 "maintenant":{"Adv":{"tab":["av"]}},
 "maintenir":{"V":{"aux":["av"],
                   "tab":"v52"}},
 "maire":{"N":{"g":"x",
               "tab":["n52"]}},
 "mais":{"Adv":{"tab":["av"]},
         "C":{"tab":["cj"]}},
 "maison":{"N":{"g":"f",
                "tab":["n17"]}},
 "maître":{"N":{"g":"x",
                "tab":["n52"]}},
 "majesté":{"N":{"g":"f",
                 "tab":["n17"]}},
 "majestueux":{"A":{"tab":["n54"]}},
 "mal":{"Adv":{"tab":["av"]}},
 "malade":{"A":{"tab":["n25"]}},
 "maladie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "malgré":{"P":{"tab":["pp"]}},
 "malheur":{"N":{"g":"m",
                 "tab":["n3"]}},
 "malheureusement":{"Adv":{"tab":["av"]}},
 "malheureux":{"A":{"tab":["n54"]}},
 "malin":{"A":{"tab":["n65"]}},
 "malle":{"N":{"g":"f",
               "tab":["n17"]}},
 "maman":{"N":{"g":"f",
               "tab":["n17"]}},
 "manche":{"N":{"g":"f",
                "tab":["n17"]}},
 "manger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "manier":{"V":{"aux":["av"],
                "tab":"v36"}},
 "manière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "manifester":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "manoeuvre":{"N":{"g":"x",
                   "tab":["n25"]}},
 "manoeuvrer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "manque":{"N":{"g":"m",
                "tab":["n3"]}},
 "manquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "mansarde":{"N":{"g":"f",
                  "tab":["n17"]}},
 "manteau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "manuel":{"A":{"tab":["n48"]}},
 "marbre":{"N":{"g":"m",
                "tab":["n3"]}},
 "marchand":{"N":{"g":"x",
                  "tab":["n28"]}},
 "marchander":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "marchandise":{"N":{"g":"f",
                     "tab":["n17"]}},
 "marche":{"N":{"g":"f",
                "tab":["n17"]}},
 "marché":{"N":{"g":"m",
                "tab":["n3"]}},
 "marcher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "mardi":{"N":{"g":"m",
               "tab":["n3"]}},
 "mare":{"N":{"g":"f",
              "tab":["n17"]}},
 "marguerite":{"N":{"g":"f",
                    "tab":["n17"]}},
 "mari":{"N":{"g":"m",
              "tab":["n3"]}},
 "mariage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "marier":{"V":{"aux":["av"],
                "tab":"v36"}},
 "marin":{"N":{"g":"m",
               "tab":["n3"]}},
 "marine":{"N":{"g":"f",
                "tab":["n17"]}},
 "marque":{"N":{"g":"f",
                "tab":["n17"]}},
 "marquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "marquis":{"N":{"g":"m",
                 "tab":["n2"]}},
 "marraine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "marron":{"N":{"g":"m",
                "tab":["n3"]}},
 "marronnier":{"N":{"g":"m",
                    "tab":["n3"]}},
 "mars":{"N":{"g":"m",
              "tab":["n2"]}},
 "marteau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "masse":{"N":{"g":"f",
               "tab":["n17"]}},
 "massif":{"A":{"tab":["n46"]}},
 "mât":{"N":{"g":"m",
             "tab":["n3"]}},
 "matériel":{"N":{"g":"m",
                  "tab":["n3"]}},
 "maternel":{"A":{"tab":["n48"]}},
 "matière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "matin":{"N":{"g":"m",
               "tab":["n3"]}},
 "matinal":{"A":{"tab":["n47"]}},
 "matinée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "maudire":{"V":{"aux":["av"],
                 "tab":"v60"}},
 "maussade":{"A":{"tab":["n25"]}},
 "mauvais":{"A":{"pos":"pre",
                 "tab":["n27"]}},
 "mauve":{"A":{"tab":["n25"]}},
 "maximum":{"N":{"g":"m",
                 "tab":["n78"]}},
 "me":{"Pro":{"tab":["pn2"]}},
 "me*coi":{"Pro":{"tab":["pn3"]}},
 "me*refl":{"Pro":{"tab":["pn6"]}},
 "mécanique":{"A":{"tab":["n25"]}},
 "méchant":{"A":{"tab":["n28"]}},
 "mécontent":{"A":{"tab":["n28"]}},
 "médaille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "médecin":{"N":{"g":"m",
                 "tab":["n3"]}},
 "méditer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "meilleur":{"A":{"pos":"pre",
                  "tab":["n28"]}},
 "mélancolie":{"N":{"g":"f",
                    "tab":["n17"]}},
 "mélancolique":{"A":{"tab":["n25"]}},
 "mélange":{"N":{"g":"m",
                 "tab":["n3"]}},
 "mélanger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "mêler":{"V":{"aux":["av"],
               "tab":"v36"}},
 "mélodie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "mélodieux":{"A":{"tab":["n54"]}},
 "membre":{"N":{"g":"m",
                "tab":["n3"]}},
 "même":{"Adv":{"tab":["av"]}},
 "mémoire":{"N":{"g":"f",
                 "tab":["n17"]}},
 "menacer":{"V":{"aux":["av"],
                 "tab":"v0"}},
 "ménage":{"N":{"g":"m",
                "tab":["n3"]}},
 "ménager":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "ménagerie":{"N":{"g":"f",
                   "tab":["n17"]}},
 "mendiant":{"N":{"g":"x",
                  "tab":["n28"]}},
 "mendier":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "mener":{"V":{"aux":["av"],
               "tab":"v24"}},
 "mensonge":{"N":{"g":"m",
                  "tab":["n3"]}},
 "menteur":{"N":{"g":"x",
                 "tab":["n55"]}},
 "mentir":{"V":{"aux":["av"],
                "tab":"v46"}},
 "menton":{"N":{"g":"m",
                "tab":["n3"]}},
 "menu":{"N":{"g":"m",
              "tab":["n3"]}},
 "menuisier":{"N":{"g":"x",
                   "tab":["n3"]}},
 "mer":{"N":{"g":"f",
             "tab":["n17"]}},
 "merci":{"N":{"g":"x",
               "tab":["n25"]}},
 "mercredi":{"N":{"g":"m",
                  "tab":["n3"]}},
 "mère":{"N":{"g":"f",
              "tab":["n17"]}},
 "mérite":{"N":{"g":"m",
                "tab":["n3"]}},
 "mériter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "merle":{"N":{"g":"m",
               "tab":["n3"]}},
 "merveille":{"N":{"g":"f",
                   "tab":["n17"]}},
 "merveilleusement":{"Adv":{"tab":["av"]}},
 "merveilleux":{"A":{"tab":["n54"]}},
 "messager":{"N":{"g":"x",
                  "tab":["n39"]}},
 "messe":{"N":{"g":"f",
               "tab":["n17"]}},
 "mesure":{"N":{"g":"f",
                "tab":["n17"]}},
 "mesurer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "métal":{"N":{"g":"m",
               "tab":["n5"]}},
 "méthode":{"N":{"g":"f",
                 "tab":["n17"]}},
 "métier":{"N":{"g":"m",
                "tab":["n3"]}},
 "métis":{"A":{"tab":["n50"]}},
 "mètre":{"N":{"g":"m",
               "tab":["n3"]}},
 "mettre":{"V":{"aux":["av"],
                "tab":"v89"}},
 "meuble":{"N":{"g":"m",
                "tab":["n3"]}},
 "meule":{"N":{"g":"f",
               "tab":["n17"]}},
 "meunier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "midi":{"N":{"g":"m",
              "tab":["n3"]}},
 "miel":{"N":{"g":"m",
              "tab":["n3"]}},
 "mien":{"Pro":{"tab":["pn12"]}},
 "miette":{"N":{"g":"f",
                "tab":["n17"]}},
 "mieux":{"Adv":{"tab":["av"]}},
 "mignon":{"A":{"tab":["n49"]}},
 "migrateur":{"A":{"tab":["n56"]}},
 "milieu":{"N":{"g":"m",
                "tab":["n4"]}},
 "militaire":{"A":{"tab":["n25"]}},
 "millier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "million":{"N":{"g":"m",
                 "tab":["n3"]}},
 "mince":{"A":{"tab":["n25"]}},
 "mine":{"N":{"g":"f",
              "tab":["n17"]}},
 "mineur":{"N":{"g":"x",
                "tab":["n55"]}},
 "ministre":{"N":{"g":"x",
                  "tab":["n25"]}},
 "minuit":{"N":{"g":"m",
                "tab":["n3"]}},
 "minuscule":{"A":{"tab":["n25"]}},
 "minute":{"N":{"g":"f",
                "tab":["n17"]}},
 "miracle":{"N":{"g":"m",
                 "tab":["n3"]}},
 "mirer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "miroir":{"N":{"g":"m",
                "tab":["n3"]}},
 "misérable":{"A":{"tab":["n25"]}},
 "misère":{"N":{"g":"f",
                "tab":["n17"]}},
 "missel":{"N":{"g":"m",
                "tab":["n3"]}},
 "mission":{"N":{"g":"f",
                 "tab":["n17"]}},
 "missionnaire":{"N":{"g":"x",
                      "tab":["n25"]}},
 "mobile":{"A":{"tab":["n25"]}},
 "mobilier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "mode":{"N":{"g":"f",
              "tab":["n17"]}},
 "modèle":{"N":{"g":"m",
                "tab":["n3"]}},
 "modérer":{"V":{"aux":["av"],
                 "tab":"v28"}},
 "moderne":{"A":{"tab":["n25"]}},
 "modeste":{"A":{"tab":["n25"]}},
 "modestie":{"N":{"g":"f",
                  "tab":["n17"]}},
 "moelleux":{"A":{"tab":["n54"]}},
 "moi":{"Pro":{"tab":["pn4"]}},
 "moi*refl":{"Pro":{"tab":["pn7"]}},
 "moi-même":{"Pro":{"tab":["pn8"]}},
 "moindre":{"A":{"tab":["n25"]}},
 "moine":{"N":{"g":"m",
               "tab":["n3"]}},
 "moineau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "moins":{"Adv":{"tab":["av"]}},
 "mois":{"N":{"g":"m",
              "tab":["n2"]}},
 "moisson":{"N":{"g":"f",
                 "tab":["n17"]}},
 "moissonneur":{"N":{"g":"x",
                     "tab":["n55"]}},
 "moitié":{"N":{"g":"f",
                "tab":["n17"]}},
 "moment":{"N":{"g":"m",
                "tab":["n3"]}},
 "mon":{"D":{"tab":["d5"]}},
 "monde":{"N":{"g":"m",
               "tab":["n3"]}},
 "monnaie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "monotone":{"A":{"tab":["n25"]}},
 "monseigneur":{"N":{"g":"m",
                     "tab":["n13"]}},
 "monsieur":{"N":{"g":"m",
                  "tab":["n12"]}},
 "monstre":{"N":{"g":"x",
                 "tab":["n25"]}},
 "mont":{"N":{"g":"m",
              "tab":["n3"]}},
 "montagne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "montant":{"N":{"g":"m",
                 "tab":["n3"]}},
 "monter":{"V":{"aux":["aê"],
                "tab":"v36"}},
 "montre":{"N":{"g":"f",
                "tab":["n17"]}},
 "montrer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "monument":{"N":{"g":"m",
                  "tab":["n3"]}},
 "moquer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "moqueur":{"A":{"tab":["n55"]}},
 "moral":{"N":{"g":"m",
               "tab":["n5"]}},
 "morale":{"N":{"g":"f",
                "tab":["n17"]}},
 "morceau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "mordre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "morne":{"A":{"tab":["n25"]}},
 "mort":{"N":{"g":"x",
              "tab":["n28"]}},
 "mortel":{"A":{"tab":["n48"]}},
 "mot":{"N":{"g":"m",
             "tab":["n3"]}},
 "moteur":{"N":{"g":"m",
                "tab":["n3"]}},
 "motif":{"N":{"g":"m",
               "tab":["n3"]}},
 "moto":{"N":{"g":"f",
              "tab":["n17"]}},
 "mou":{"A":{"tab":["n109"]}},
 "mouche":{"N":{"g":"f",
                "tab":["n17"]}},
 "mouchoir":{"N":{"g":"m",
                  "tab":["n3"]}},
 "moudre":{"V":{"aux":["av"],
                "tab":"v92"}},
 "mouiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "moulin":{"N":{"g":"m",
                "tab":["n3"]}},
 "mourir":{"V":{"aux":["êt"],
                "tab":"v55"}},
 "mousse":{"N":{"g":"f",
                "tab":["n17"]}},
 "moustache":{"N":{"g":"f",
                   "tab":["n17"]}},
 "mouton":{"N":{"g":"m",
                "tab":["n3"]}},
 "mouvement":{"N":{"g":"m",
                   "tab":["n3"]}},
 "mouvoir":{"V":{"aux":["av"],
                 "tab":"v65"}},
 "moyen":{"A":{"tab":["n49"]}},
 "moyenne":{"N":{"g":"f",
                 "tab":["n17"]}},
 "muet":{"A":{"tab":["n51"]}},
 "muguet":{"N":{"g":"m",
                "tab":["n3"]}},
 "multicolore":{"A":{"tab":["n25"]}},
 "multiple":{"A":{"tab":["n25"]}},
 "multitude":{"N":{"g":"f",
                   "tab":["n17"]}},
 "munir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "mûr":{"A":{"tab":["n28"]}},
 "mur":{"N":{"g":"m",
             "tab":["n3"]}},
 "muraille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "mûrir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "murmure":{"N":{"g":"m",
                 "tab":["n3"]}},
 "murmurer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "muscle":{"N":{"g":"m",
                "tab":["n3"]}},
 "museau":{"N":{"g":"m",
                "tab":["n4"]}},
 "musée":{"N":{"g":"m",
               "tab":["n3"]}},
 "musicien":{"A":{"tab":["n49"]}},
 "musique":{"N":{"g":"f",
                 "tab":["n17"]}},
 "myosotis":{"N":{"g":"m",
                  "tab":["n2"]}},
 "mystère":{"N":{"g":"m",
                 "tab":["n3"]}},
 "mystérieux":{"A":{"tab":["n54"]}},
 "nager":{"V":{"aux":["av"],
               "tab":"v3"}},
 "naissance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "naître":{"V":{"aux":["êt"],
                "tab":"v104"}},
 "nappe":{"N":{"g":"f",
               "tab":["n17"]}},
 "narcisse":{"N":{"g":"m",
                  "tab":["n3"]}},
 "natal":{"A":{"tab":["n28"]}},
 "nation":{"N":{"g":"f",
                "tab":["n17"]}},
 "national":{"A":{"tab":["n47"]}},
 "nature":{"N":{"g":"f",
                "tab":["n17"]}},
 "naturel":{"A":{"tab":["n48"]}},
 "naturellement":{"Adv":{"tab":["av"]}},
 "naufrage":{"N":{"g":"m",
                  "tab":["n3"]}},
 "navire":{"N":{"g":"m",
                "tab":["n3"]}},
 "ne":{"Adv":{"tab":["ave"]}},
 "néanmoins":{"Adv":{"C":{"tab":["cj"]},
                     "tab":["av"]}},
 "nécessaire":{"A":{"tab":["n25"]}},
 "négligence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "négligent":{"A":{"tab":["n28"]}},
 "négliger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "négociant":{"N":{"g":"x",
                   "tab":["n28"]}},
 "nègre":{"A":{"tab":["n25"]}},
 "neige":{"N":{"g":"f",
               "tab":["n17"]}},
 "neiger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "nerveux":{"A":{"tab":["n54"]}},
 "net":{"A":{"tab":["n51"]}},
 "nettoyer":{"V":{"aux":["av"],
                  "tab":"v5"}},
 "neuf":{"A":{"tab":["n46"]}},
 "neveu":{"N":{"g":"m",
               "tab":["n4"]}},
 "nez":{"N":{"g":"m",
             "tab":["n2"]}},
 "ni":{"C":{"tab":["cj"]}},
 "niche":{"N":{"g":"f",
               "tab":["n17"]}},
 "nid":{"N":{"g":"m",
             "tab":["n3"]}},
 "nièce":{"N":{"g":"f",
               "tab":["n17"]}},
 "niveau":{"N":{"g":"m",
                "tab":["n4"]}},
 "noble":{"A":{"tab":["n25"]}},
 "noeud":{"N":{"g":"m",
               "tab":["n3"]}},
 "noir":{"A":{"tab":["n28"]}},
 "noircir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "noisette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "noix":{"N":{"g":"f",
              "tab":["n16"]}},
 "nom":{"N":{"g":"m",
             "tab":["n3"]}},
 "nombre":{"N":{"g":"m",
                "tab":["n3"]}},
 "nombreux":{"A":{"tab":["n54"]}},
 "nommer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "non":{"Adv":{"tab":["av"]}},
 "nord":{"N":{"g":"m",
              "tab":["n35"]}},
 "normal":{"A":{"tab":["n47"]}},
 "notaire":{"N":{"g":"x",
                 "tab":["n25"]}},
 "note":{"N":{"g":"f",
              "tab":["n17"]}},
 "nôtre":{"Pro":{"tab":["pn13"]}},
 "notre":{"D":{"tab":["d6"]}},
 "nourrir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "nourriture":{"N":{"g":"f",
                    "tab":["n17"]}},
 "nouveau":{"A":{"pos":"pre",
                 "tab":["n108"]}},
 "novembre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "noyer":{"V":{"aux":["av"],
               "tab":"v5"}},
 "nu":{"A":{"tab":["n28"]}},
 "nuage":{"N":{"g":"m",
               "tab":["n3"]}},
 "nuisible":{"A":{"tab":["n25"]}},
 "nuit":{"N":{"g":"f",
              "tab":["n17"]}},
 "nullement":{"Adv":{"tab":["av"]}},
 "numéro":{"N":{"g":"m",
                "tab":["n3"]}},
 "obéir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "obéissant":{"A":{"tab":["n28"]}},
 "objet":{"N":{"g":"m",
               "tab":["n3"]}},
 "obligeance":{"N":{"g":"f",
                    "tab":["n17"]}},
 "obliger":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "obscur":{"A":{"tab":["n28"]}},
 "obscurcir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "obscurité":{"N":{"g":"f",
                   "tab":["n17"]}},
 "observation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "observer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "obstacle":{"N":{"g":"m",
                  "tab":["n3"]}},
 "obtenir":{"V":{"aux":["av"],
                 "tab":"v52"}},
 "occasion":{"N":{"g":"f",
                  "tab":["n17"]}},
 "occasionner":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "occupation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "occuper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "océan":{"N":{"g":"m",
               "tab":["n3"]}},
 "octobre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "odeur":{"N":{"g":"f",
               "tab":["n17"]}},
 "odorant":{"A":{"tab":["n28"]}},
 "oeil":{"N":{"g":"m",
              "tab":["n14"]}},
 "oeillet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "oeuf":{"N":{"g":"m",
              "tab":["n3"]}},
 "oeuvre":{"N":{"g":"f",
                "tab":["n17"]}},
 "offenser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "office":{"N":{"g":"m",
                "tab":["n3"]}},
 "officier":{"N":{"g":"x",
                  "tab":["n39"]}},
 "offre":{"N":{"g":"f",
               "tab":["n17"]}},
 "offrir":{"V":{"aux":["av"],
                "tab":"v44"}},
 "oie":{"N":{"g":"f",
             "tab":["n17"]}},
 "oiseau":{"N":{"g":"m",
                "tab":["n4"]}},
 "oisillon":{"N":{"g":"m",
                  "tab":["n3"]}},
 "ombrage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "ombre":{"N":{"g":"f",
               "tab":["n17"]}},
 "on":{"Pro":{"tab":["pn0"]}},
 "oncle":{"N":{"g":"m",
               "tab":["n3"]}},
 "onde":{"N":{"g":"f",
              "tab":["n17"]}},
 "onduler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "opération":{"N":{"g":"f",
                   "tab":["n17"]}},
 "opérer":{"V":{"aux":["av"],
                "tab":"v28"}},
 "opinion":{"N":{"g":"f",
                 "tab":["n17"]}},
 "opposer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "or":{"C":{"tab":["cj"]},
       "N":{"g":"m",
            "tab":["n3"]}},
 "orage":{"N":{"g":"m",
               "tab":["n3"]}},
 "orange":{"A":{"tab":["n24"]},
           "N":{"g":"f",
                "tab":["n17"]}},
 "oranger":{"N":{"g":"m",
                 "tab":["n3"]}},
 "ordinaire":{"A":{"tab":["n25"]}},
 "ordinairement":{"Adv":{"tab":["av"]}},
 "ordonner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "ordre":{"N":{"g":"m",
               "tab":["n3"]}},
 "orée":{"N":{"g":"f",
              "tab":["n17"]}},
 "oreille":{"N":{"g":"f",
                 "tab":["n17"]}},
 "organiser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "orgue":{"N":{"g":"x",
               "tab":["n25"]}},
 "orgueil":{"N":{"g":"m",
                 "tab":["n3"]}},
 "orgueilleux":{"A":{"tab":["n54"]}},
 "ornement":{"N":{"g":"m",
                  "tab":["n3"]}},
 "orner":{"V":{"aux":["av"],
               "tab":"v36"}},
 "orphelin":{"N":{"g":"x",
                  "tab":["n28"]}},
 "os":{"N":{"g":"m",
            "tab":["n2"]}},
 "oser":{"V":{"aux":["av"],
              "tab":"v36"}},
 "osier":{"N":{"g":"m",
               "tab":["n3"]}},
 "ôter":{"V":{"aux":["av"],
              "tab":"v36"}},
 "ou":{"C":{"tab":["cj"]}},
 "où":{"Pro":{"tab":["pn27"]}},
 "ouate":{"N":{"g":"f",
               "tab":["n17"]}},
 "oui":{"Adv":{"h":1,
               "tab":["av"]}},
 "ours":{"N":{"g":"m",
              "tab":["n2"]}},
 "outil":{"N":{"g":"m",
               "tab":["n3"]}},
 "ouverture":{"N":{"g":"f",
                   "tab":["n17"]}},
 "ouvrage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "ouvrier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "ouvrir":{"V":{"aux":["av"],
                "tab":"v44"}},
 "page":{"N":{"g":"f",
              "tab":["n17"]}},
 "paille":{"N":{"g":"f",
                "tab":["n17"]}},
 "pain":{"N":{"g":"m",
              "tab":["n3"]}},
 "paire":{"N":{"g":"f",
               "tab":["n17"]}},
 "paisible":{"A":{"tab":["n25"]}},
 "paisiblement":{"Adv":{"tab":["av"]}},
 "paître":{"V":{"aux":["tdir"],
                "tab":"v102"}},
 "paix":{"N":{"g":"f",
              "tab":["n16"]}},
 "palais":{"N":{"g":"m",
                "tab":["n2"]}},
 "pâle":{"A":{"tab":["n25"]}},
 "paletot":{"N":{"g":"m",
                 "tab":["n3"]}},
 "pâlir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "pan":{"N":{"g":"m",
             "tab":["n3"]}},
 "panache":{"N":{"g":"m",
                 "tab":["n3"]}},
 "panier":{"N":{"g":"m",
                "tab":["n3"]}},
 "panorama":{"N":{"g":"m",
                  "tab":["n3"]}},
 "pantalon":{"N":{"g":"m",
                  "tab":["n3"]}},
 "papa":{"N":{"g":"m",
              "tab":["n3"]}},
 "papier":{"N":{"g":"m",
                "tab":["n3"]}},
 "papillon":{"N":{"g":"m",
                  "tab":["n3"]}},
 "pâquerette":{"N":{"g":"f",
                    "tab":["n17"]}},
 "paquet":{"N":{"g":"m",
                "tab":["n3"]}},
 "par":{"P":{"tab":["pp"]}},
 "paradis":{"N":{"g":"m",
                 "tab":["n2"]}},
 "parages":{"N":{"g":"m",
                 "tab":["n1"]}},
 "paraître":{"V":{"aux":["aê"],
                  "tab":"v101"}},
 "parapluie":{"N":{"g":"m",
                   "tab":["n3"]}},
 "parc":{"N":{"g":"m",
              "tab":["n3"]}},
 "parcourir":{"V":{"aux":["av"],
                   "tab":"v57"}},
 "parcours":{"N":{"g":"m",
                  "tab":["n2"]}},
 "pardessus":{"N":{"g":"m",
                   "tab":["n2"]}},
 "pardon":{"N":{"g":"m",
                "tab":["n3"]}},
 "pardonner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "pareil":{"A":{"tab":["n48"]}},
 "parent":{"N":{"g":"m",
                "tab":["n3"]}},
 "parenthèse":{"N":{"g":"f",
                    "tab":["n17"]}},
 "parer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "paresse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "paresseux":{"A":{"tab":["n54"]}},
 "parfait":{"A":{"tab":["n28"]}},
 "parfaitement":{"Adv":{"tab":["av"]}},
 "parfois":{"Adv":{"tab":["av"]}},
 "parfum":{"N":{"g":"m",
                "tab":["n3"]}},
 "parfumer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "parler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "parmi":{"P":{"tab":["pp"]}},
 "paroisse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "parole":{"N":{"g":"f",
                "tab":["n17"]}},
 "parquet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "parrain":{"N":{"g":"m",
                 "tab":["n3"]}},
 "parsemer":{"V":{"aux":["av"],
                  "tab":"v13"}},
 "part":{"N":{"g":"f",
              "tab":["n17"]}},
 "partager":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "parterre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "parti":{"N":{"g":"m",
               "tab":["n3"]}},
 "participer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "particulier":{"A":{"tab":["n39"]}},
 "particulièrement":{"Adv":{"tab":["av"]}},
 "partie":{"N":{"g":"f",
                "tab":["n17"]}},
 "partir":{"V":{"aux":["êt"],
                "tab":"v46"}},
 "partout":{"Adv":{"tab":["av"]}},
 "parure":{"N":{"g":"f",
                "tab":["n17"]}},
 "parvenir":{"V":{"aux":["êt"],
                  "tab":"v52"}},
 "pas":{"Adv":{"tab":["av"]},
        "N":{"g":"m",
             "tab":["n2"]}},
 "passage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "passager":{"N":{"g":"x",
                  "tab":["n39"]}},
 "passant":{"N":{"g":"x",
                 "tab":["n28"]}},
 "passé":{"N":{"g":"m",
               "tab":["n3"]}},
 "passer":{"V":{"aux":["aê"],
                "tab":"v36"}},
 "passion":{"N":{"g":"f",
                 "tab":["n17"]}},
 "pâte":{"N":{"g":"f",
              "tab":["n17"]}},
 "paternel":{"A":{"tab":["n48"]}},
 "patience":{"N":{"g":"f",
                  "tab":["n17"]}},
 "patin":{"N":{"g":"m",
               "tab":["n3"]}},
 "pâtisserie":{"N":{"g":"f",
                    "tab":["n17"]}},
 "pâtre":{"N":{"g":"m",
               "tab":["n3"]}},
 "patrie":{"N":{"g":"f",
                "tab":["n17"]}},
 "patron":{"N":{"g":"x",
                "tab":["n49"]}},
 "patronage":{"N":{"g":"m",
                   "tab":["n3"]}},
 "patte":{"N":{"g":"f",
               "tab":["n17"]}},
 "pâture":{"N":{"g":"f",
                "tab":["n17"]}},
 "pauvre":{"A":{"tab":["n25"]}},
 "pavé":{"N":{"g":"m",
              "tab":["n3"]}},
 "payer":{"V":{"aux":["av"],
               "tab":"v4"}},
 "pays":{"N":{"g":"m",
              "tab":["n2"]}},
 "paysage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "paysan":{"N":{"g":"x",
                "tab":["n49"]}},
 "peau":{"N":{"g":"f",
              "tab":["n18"]}},
 "péché":{"N":{"g":"m",
               "tab":["n3"]}},
 "pêche":{"N":{"g":"f",
               "tab":["n17"]}},
 "pécher":{"V":{"aux":["av"],
                "tab":"v27"}},
 "pêcher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "pêcheur":{"N":{"g":"x",
                 "tab":["n55"]}},
 "peindre":{"V":{"aux":["av"],
                 "tab":"v97"}},
 "peine":{"N":{"g":"f",
               "tab":["n17"]}},
 "peiner":{"V":{"aux":["av"],
                "tab":"v36"}},
 "peintre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "peinture":{"N":{"g":"f",
                  "tab":["n17"]}},
 "pelage":{"N":{"g":"m",
                "tab":["n3"]}},
 "pelouse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "pencher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "pendant":{"P":{"tab":["pp"]}},
 "pendre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "pendule":{"N":{"g":"x",
                 "tab":["n25"]}},
 "pénétrer":{"V":{"aux":["av"],
                  "tab":"v17"}},
 "pénible":{"A":{"tab":["n25"]}},
 "péniblement":{"Adv":{"tab":["av"]}},
 "pénitence":{"N":{"g":"f",
                   "tab":["n17"]}},
 "pensée":{"N":{"g":"f",
                "tab":["n17"]}},
 "penser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "pension":{"N":{"g":"f",
                 "tab":["n17"]}},
 "pensionnaire":{"N":{"g":"x",
                      "tab":["n25"]}},
 "pensionnat":{"N":{"g":"m",
                    "tab":["n3"]}},
 "percer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "perche":{"N":{"g":"f",
                "tab":["n17"]}},
 "percher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "perdre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "perdrix":{"N":{"g":"f",
                 "tab":["n16"]}},
 "père":{"N":{"g":"m",
              "tab":["n3"]}},
 "perfection":{"N":{"g":"f",
                    "tab":["n17"]}},
 "péril":{"N":{"g":"m",
               "tab":["n3"]}},
 "périlleux":{"A":{"tab":["n54"]}},
 "période":{"N":{"g":"f",
                 "tab":["n17"]}},
 "périr":{"V":{"aux":["av"],
               "tab":"v58"}},
 "perle":{"N":{"g":"f",
               "tab":["n17"]}},
 "permettre":{"V":{"aux":["av"],
                   "tab":"v89"}},
 "permission":{"N":{"g":"f",
                    "tab":["n17"]}},
 "perpétuel":{"A":{"tab":["n48"]}},
 "perroquet":{"N":{"g":"m",
                   "tab":["n3"]}},
 "persévérer":{"V":{"aux":["av"],
                    "tab":"v28"}},
 "personnage":{"N":{"g":"m",
                    "tab":["n3"]}},
 "personne":{"N":{"g":"f",
                  "tab":["n17"]}},
 "personnel":{"A":{"tab":["n48"]}},
 "perspective":{"N":{"g":"f",
                     "tab":["n17"]}},
 "persuader":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "perte":{"N":{"g":"f",
               "tab":["n17"]}},
 "peser":{"V":{"aux":["av"],
               "tab":"v26"}},
 "pétale":{"N":{"g":"m",
                "tab":["n3"]}},
 "petit":{"A":{"pos":"pre",
               "tab":["n28"]},
          "N":{"g":"x",
               "tab":["n28"]}},
 "pétrir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "peu":{"Adv":{"tab":["av"]}},
 "peuple":{"N":{"g":"m",
                "tab":["n3"]}},
 "peupler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "peuplier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "peur":{"N":{"g":"f",
              "tab":["n17"]}},
 "peut-être":{"Adv":{"tab":["av"]}},
 "photographie":{"N":{"g":"f",
                      "tab":["n17"]}},
 "photographier":{"V":{"aux":["av"],
                       "tab":"v36"}},
 "phrase":{"N":{"g":"f",
                "tab":["n17"]}},
 "physique":{"A":{"tab":["n25"]}},
 "piano":{"N":{"g":"m",
               "tab":["n3"]}},
 "pic":{"N":{"g":"m",
             "tab":["n3"]}},
 "pie":{"N":{"g":"f",
             "tab":["n17"]}},
 "pièce":{"N":{"g":"f",
               "tab":["n17"]}},
 "pied":{"N":{"g":"m",
              "tab":["n3"]}},
 "pierre":{"N":{"g":"f",
                "tab":["n17"]}},
 "piété":{"N":{"g":"f",
               "tab":["n17"]}},
 "pieux":{"A":{"tab":["n54"]}},
 "pigeon":{"N":{"g":"m",
                "tab":["n3"]}},
 "pin":{"N":{"g":"m",
             "tab":["n3"]}},
 "pinceau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "pinson":{"N":{"g":"m",
                "tab":["n3"]}},
 "pipe":{"N":{"g":"f",
              "tab":["n17"]}},
 "piquer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "pire":{"A":{"tab":["n25"]}},
 "pis":{"Adv":{"tab":["av"]}},
 "piste":{"N":{"g":"f",
               "tab":["n17"]}},
 "pitié":{"N":{"g":"f",
               "tab":["n17"]}},
 "pittoresque":{"A":{"tab":["n25"]}},
 "place":{"N":{"g":"f",
               "tab":["n17"]}},
 "placer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "plafond":{"N":{"g":"m",
                 "tab":["n3"]}},
 "plage":{"N":{"g":"f",
               "tab":["n17"]}},
 "plaie":{"N":{"g":"f",
               "tab":["n17"]}},
 "plaindre":{"V":{"aux":["av"],
                  "tab":"v97"}},
 "plaine":{"N":{"g":"f",
                "tab":["n17"]}},
 "plainte":{"N":{"g":"f",
                 "tab":["n17"]}},
 "plaintif":{"A":{"tab":["n46"]}},
 "plaire":{"V":{"aux":["av"],
                "tab":"v123"}},
 "plaisir":{"N":{"g":"m",
                 "tab":["n3"]}},
 "plan":{"N":{"g":"m",
              "tab":["n3"]}},
 "planche":{"N":{"g":"f",
                 "tab":["n17"]}},
 "plancher":{"N":{"g":"m",
                  "tab":["n3"]}},
 "plane":{"N":{"g":"f",
               "tab":["n17"]}},
 "planer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "plante":{"N":{"g":"f",
                "tab":["n17"]}},
 "planter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "plaque":{"N":{"g":"f",
                "tab":["n17"]}},
 "plat":{"N":{"g":"m",
              "tab":["n3"]}},
 "plate":{"N":{"g":"f",
               "tab":["n17"]}},
 "plateau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "plein":{"A":{"tab":["n28"]}},
 "pleur":{"N":{"g":"m",
               "tab":["n3"]}},
 "pleurer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "pleuvoir":{"V":{"aux":["av"],
                  "tab":"v79"}},
 "pli":{"N":{"g":"m",
             "tab":["n3"]}},
 "plier":{"V":{"aux":["av"],
               "tab":"v36"}},
 "plomb":{"N":{"g":"m",
               "tab":["n3"]}},
 "plonger":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "pluie":{"N":{"g":"f",
               "tab":["n17"]}},
 "plumage":{"N":{"g":"m",
                 "tab":["n3"]}},
 "plume":{"N":{"g":"f",
               "tab":["n17"]}},
 "plumier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "plus":{"Adv":{"tab":["av"]}},
 "plusieurs":{"Adv":{"tab":["av"]}},
 "plutôt":{"Adv":{"tab":["av"]}},
 "poche":{"N":{"g":"f",
               "tab":["n17"]}},
 "poêle":{"N":{"g":"f",
               "tab":["n17"]}},
 "poésie":{"N":{"g":"f",
                "tab":["n17"]}},
 "poète":{"N":{"g":"x",
               "tab":["n103"]}},
 "poids":{"N":{"g":"m",
               "tab":["n2"]}},
 "poignée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "poil":{"N":{"g":"m",
              "tab":["n3"]}},
 "poing":{"N":{"g":"m",
               "tab":["n3"]}},
 "point":{"N":{"g":"m",
               "tab":["n3"]}},
 "pointe":{"N":{"g":"f",
                "tab":["n17"]}},
 "pointu":{"A":{"tab":["n28"]}},
 "poire":{"N":{"g":"f",
               "tab":["n17"]}},
 "poireau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "poirier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "pois":{"N":{"g":"m",
              "tab":["n2"]}},
 "poisson":{"N":{"g":"m",
                 "tab":["n3"]}},
 "poitrine":{"N":{"g":"f",
                  "tab":["n17"]}},
 "poli":{"A":{"tab":["n28"]}},
 "police":{"N":{"g":"f",
                "tab":["n17"]}},
 "politesse":{"N":{"g":"f",
                   "tab":["n17"]}},
 "politique":{"N":{"g":"x",
                   "tab":["n25"]}},
 "pomme":{"N":{"g":"f",
               "tab":["n17"]}},
 "pommier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "pompe":{"N":{"g":"f",
               "tab":["n17"]}},
 "pompier":{"N":{"g":"x",
                 "tab":["n39"]}},
 "pondre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "pont":{"N":{"g":"m",
              "tab":["n3"]}},
 "porc":{"N":{"g":"m",
              "tab":["n3"]}},
 "port":{"N":{"g":"m",
              "tab":["n3"]}},
 "porte":{"N":{"g":"f",
               "tab":["n17"]}},
 "porte-plume":{"N":{"g":"m",
                     "tab":["n2"]}},
 "portée":{"N":{"g":"f",
                "tab":["n17"]}},
 "portefeuille":{"N":{"g":"m",
                      "tab":["n3"]}},
 "porter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "porteur":{"N":{"g":"x",
                 "tab":["n55"]}},
 "portière":{"N":{"g":"f",
                  "tab":["n17"]}},
 "portrait":{"N":{"g":"m",
                  "tab":["n3"]}},
 "poser":{"V":{"aux":["av"],
               "tab":"v36"}},
 "position":{"N":{"g":"f",
                  "tab":["n17"]}},
 "posséder":{"V":{"aux":["av"],
                  "tab":"v30"}},
 "possession":{"N":{"g":"f",
                    "tab":["n17"]}},
 "possible":{"A":{"tab":["n25"]}},
 "postal":{"A":{"tab":["n47"]}},
 "poste":{"N":{"g":"x",
               "tab":["n25"]}},
 "pot":{"N":{"g":"m",
             "tab":["n3"]}},
 "potager":{"N":{"g":"m",
                 "tab":["n3"]}},
 "poteau":{"N":{"g":"m",
                "tab":["n4"]}},
 "poudre":{"N":{"g":"f",
                "tab":["n17"]}},
 "poulailler":{"N":{"g":"m",
                    "tab":["n3"]}},
 "poulain":{"N":{"g":"m",
                 "tab":["n3"]}},
 "poule":{"N":{"g":"f",
               "tab":["n17"]}},
 "poulet":{"N":{"g":"m",
                "tab":["n3"]}},
 "poumon":{"N":{"g":"m",
                "tab":["n3"]}},
 "poupée":{"N":{"g":"f",
                "tab":["n17"]}},
 "pour":{"P":{"tab":["pp"]}},
 "pourpre":{"A":{"tab":["n25"]}},
 "pourrir":{"V":{"aux":["aê"],
                 "tab":"v58"}},
 "poursuite":{"N":{"g":"f",
                   "tab":["n17"]}},
 "poursuivre":{"V":{"aux":["av"],
                    "tab":"v99"}},
 "pourtant":{"Adv":{"tab":["av"]}},
 "pourvoir":{"V":{"aux":["av"],
                  "tab":"v82"}},
 "pousser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "poussière":{"N":{"g":"f",
                   "tab":["n17"]}},
 "poussin":{"N":{"g":"m",
                 "tab":["n3"]}},
 "poutre":{"N":{"g":"f",
                "tab":["n17"]}},
 "pouvoir":{"V":{"aux":["av"],
                 "tab":"v71"}},
 "prairie":{"N":{"g":"f",
                 "tab":["n17"]}},
 "pratique":{"A":{"tab":["n25"]}},
 "pratiquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "pré":{"N":{"g":"m",
             "tab":["n3"]}},
 "préau":{"N":{"g":"m",
               "tab":["n4"]}},
 "précaution":{"N":{"g":"f",
                    "tab":["n17"]}},
 "précédent":{"A":{"tab":["n28"]}},
 "précéder":{"V":{"aux":["av"],
                  "tab":"v30"}},
 "prêcher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "précieux":{"A":{"tab":["n54"]}},
 "précipiter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "précisément":{"Adv":{"tab":["av"]}},
 "préférence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "préférer":{"V":{"aux":["av"],
                  "tab":"v28"}},
 "premier":{"A":{"pos":"pre",
                 "tab":["n39"]}},
 "prendre":{"V":{"aux":["av"],
                 "tab":"v90"}},
 "préparatif":{"N":{"g":"m",
                    "tab":["n3"]}},
 "préparation":{"N":{"g":"f",
                     "tab":["n17"]}},
 "préparer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "près":{"Adv":{"tab":["av"]},
         "P":{"tab":["pp"]}},
 "présence":{"N":{"g":"f",
                  "tab":["n17"]}},
 "présent":{"A":{"tab":["n28"]}},
 "présenter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "préserver":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "président":{"N":{"g":"x",
                   "tab":["n28"]}},
 "présidente":{"N":{"g":"f",
                    "tab":["n17"]}},
 "presque":{"Adv":{"tab":["av"]}},
 "presser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "prêt":{"A":{"tab":["n28"]}},
 "prétendre":{"V":{"aux":["av"],
                   "tab":"v85"}},
 "prêter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "prêtre":{"N":{"g":"m",
                "tab":["n3"]}},
 "preuve":{"N":{"g":"f",
                "tab":["n17"]}},
 "prévenir":{"V":{"aux":["av"],
                  "tab":"v52"}},
 "prévoir":{"V":{"aux":["av"],
                 "tab":"v73"}},
 "prier":{"V":{"aux":["av"],
               "tab":"v36"}},
 "prière":{"N":{"g":"f",
                "tab":["n17"]}},
 "primaire":{"A":{"tab":["n25"]}},
 "prime":{"N":{"g":"f",
               "tab":["n17"]}},
 "primevère":{"N":{"g":"f",
                   "tab":["n17"]}},
 "prince":{"N":{"g":"m",
                "tab":["n3"]}},
 "princesse":{"N":{"g":"f",
                   "tab":["n17"]}},
 "principal":{"A":{"tab":["n47"]}},
 "principalement":{"Adv":{"tab":["av"]}},
 "principe":{"N":{"g":"m",
                  "tab":["n3"]}},
 "printanier":{"A":{"tab":["n39"]}},
 "printemps":{"N":{"g":"m",
                   "tab":["n2"]}},
 "prise":{"N":{"g":"f",
               "tab":["n17"]}},
 "prison":{"N":{"g":"f",
                "tab":["n17"]}},
 "prisonnier":{"N":{"g":"x",
                    "tab":["n39"]}},
 "privation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "priver":{"V":{"aux":["av"],
                "tab":"v36"}},
 "prix":{"N":{"g":"m",
              "tab":["n2"]}},
 "probablement":{"Adv":{"tab":["av"]}},
 "problème":{"N":{"g":"m",
                  "tab":["n3"]}},
 "procéder":{"V":{"aux":["av"],
                  "tab":"v30"}},
 "procession":{"N":{"g":"f",
                    "tab":["n17"]}},
 "prochain":{"A":{"tab":["n28"]}},
 "proche":{"A":{"tab":["n25"]}},
 "proclamer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "procurer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "procureur":{"N":{"g":"x",
                   "tab":["n28"]}},
 "prodigieux":{"A":{"tab":["n54"]}},
 "prodiguer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "production":{"N":{"g":"f",
                    "tab":["n17"]}},
 "produire":{"V":{"aux":["av"],
                  "tab":"v113"}},
 "produit":{"N":{"g":"m",
                 "tab":["n3"]}},
 "professeur":{"N":{"g":"x",
                    "tab":["n28"]}},
 "profession":{"N":{"g":"f",
                    "tab":["n17"]}},
 "profit":{"N":{"g":"m",
                "tab":["n3"]}},
 "profiter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "profond":{"A":{"tab":["n28"]}},
 "profondément":{"Adv":{"tab":["av"]}},
 "profondeur":{"N":{"g":"f",
                    "tab":["n17"]}},
 "programme":{"N":{"g":"m",
                   "tab":["n3"]}},
 "progrès":{"N":{"g":"m",
                 "tab":["n2"]}},
 "proie":{"N":{"g":"f",
               "tab":["n17"]}},
 "projet":{"N":{"g":"m",
                "tab":["n3"]}},
 "projeter":{"V":{"aux":["av"],
                  "tab":"v10"}},
 "prolonger":{"V":{"aux":["av"],
                   "tab":"v3"}},
 "promenade":{"N":{"g":"f",
                   "tab":["n17"]}},
 "promener":{"V":{"aux":["av"],
                  "tab":"v24"}},
 "promeneur":{"N":{"g":"x",
                   "tab":["n55"]}},
 "promesse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "promettre":{"V":{"aux":["av"],
                   "tab":"v89"}},
 "promotion":{"N":{"g":"f",
                   "tab":["n17"]}},
 "prompt":{"A":{"tab":["n28"]}},
 "prononcer":{"V":{"aux":["av"],
                   "tab":"v0"}},
 "propice":{"A":{"tab":["n25"]}},
 "propos":{"N":{"g":"m",
                "tab":["n2"]}},
 "proposer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "proposition":{"N":{"g":"f",
                     "tab":["n17"]}},
 "propre":{"A":{"tab":["n25"]}},
 "proprement":{"Adv":{"tab":["av"]}},
 "propreté":{"N":{"g":"f",
                  "tab":["n17"]}},
 "propriétaire":{"N":{"g":"x",
                      "tab":["n25"]}},
 "propriété":{"N":{"g":"f",
                   "tab":["n17"]}},
 "prospérité":{"N":{"g":"f",
                    "tab":["n17"]}},
 "protecteur":{"N":{"g":"x",
                    "tab":["n56"]}},
 "protection":{"N":{"g":"f",
                    "tab":["n17"]}},
 "protéger":{"V":{"aux":["av"],
                  "tab":"v35"}},
 "prouver":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "provenir":{"V":{"aux":["êt"],
                  "tab":"v52"}},
 "proverbe":{"N":{"g":"m",
                  "tab":["n3"]}},
 "providence":{"N":{"g":"f",
                    "tab":["n17"]}},
 "provision":{"N":{"g":"f",
                   "tab":["n17"]}},
 "provoquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "prudence":{"N":{"g":"f",
                  "tab":["n17"]}},
 "prudent":{"A":{"tab":["n28"]}},
 "public":{"A":{"tab":["n60"]}},
 "puis":{"Adv":{"tab":["av"]}},
 "puisque":{"C":{"tab":["cje"]}},
 "puissance":{"N":{"g":"f",
                   "tab":["n17"]}},
 "puissant":{"A":{"tab":["n28"]}},
 "puits":{"N":{"g":"m",
               "tab":["n2"]}},
 "punir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "punition":{"N":{"g":"f",
                  "tab":["n17"]}},
 "pupitre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "pur":{"A":{"tab":["n28"]}},
 "purifier":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "quai":{"N":{"g":"m",
              "tab":["n3"]}},
 "qualité":{"N":{"g":"f",
                 "tab":["n17"]}},
 "quantité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "quart":{"N":{"g":"m",
               "tab":["n3"]}},
 "quartier":{"N":{"g":"m",
                  "tab":["n3"]}},
 "que":{"Pro":{"tab":["pn31"]}},
 "quelconque":{"A":{"tab":["n25"]}},
 "quelquefois":{"Adv":{"tab":["av"]}},
 "question":{"N":{"g":"f",
                  "tab":["n17"]}},
 "queue":{"N":{"g":"f",
               "tab":["n17"]}},
 "qui":{"Pro":{"tab":["pn30"]}},
 "quinzaine":{"N":{"g":"f",
                   "tab":["n17"]}},
 "quitter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "quoi":{"Pro":{"g":"n",
                "tab":["pn29"]}},
 "quotidien":{"A":{"tab":["n49"]}},
 "raccommoder":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "raccourcir":{"V":{"aux":["av"],
                    "tab":"v58"}},
 "race":{"N":{"g":"f",
              "tab":["n17"]}},
 "racine":{"N":{"g":"f",
                "tab":["n17"]}},
 "raconter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "radieux":{"A":{"tab":["n54"]}},
 "rafraîchir":{"V":{"aux":["av"],
                    "tab":"v58"}},
 "rage":{"N":{"g":"f",
              "tab":["n17"]}},
 "raide":{"A":{"tab":["n25"]}},
 "raisin":{"N":{"g":"m",
                "tab":["n3"]}},
 "raison":{"N":{"g":"f",
                "tab":["n17"]}},
 "raisonnable":{"A":{"tab":["n25"]}},
 "ralentir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "ramage":{"N":{"g":"m",
                "tab":["n3"]}},
 "ramasser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "rame":{"N":{"g":"f",
              "tab":["n17"]}},
 "rameau":{"N":{"g":"m",
                "tab":["n4"]}},
 "ramener":{"V":{"aux":["av"],
                 "tab":"v24"}},
 "randonnée":{"N":{"g":"f",
                   "tab":["n17"]}},
 "rang":{"N":{"g":"m",
              "tab":["n3"]}},
 "rangée":{"N":{"g":"f",
                "tab":["n17"]}},
 "ranger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "ranimer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "rapide":{"A":{"tab":["n25"]}},
 "rapidement":{"Adv":{"tab":["av"]}},
 "rapidité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "rapiécer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "rappeler":{"V":{"aux":["av"],
                  "tab":"v7"}},
 "rapport":{"N":{"g":"m",
                 "tab":["n3"]}},
 "rapporter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "rapprocher":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "rare":{"A":{"tab":["n25"]}},
 "rarement":{"Adv":{"tab":["av"]}},
 "raser":{"V":{"aux":["av"],
               "tab":"v36"}},
 "rassembler":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "rassurer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "rat":{"N":{"g":"m",
             "tab":["n3"]}},
 "rater":{"V":{"aux":["av"],
               "tab":"v36"}},
 "rattraper":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "ravage":{"N":{"g":"m",
                "tab":["n3"]}},
 "ravin":{"N":{"g":"m",
               "tab":["n3"]}},
 "ravir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "ravissant":{"A":{"tab":["n28"]}},
 "rayon":{"N":{"g":"m",
               "tab":["n3"]}},
 "rayonner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "réaliser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "réalité":{"N":{"g":"f",
                 "tab":["n17"]}},
 "réception":{"N":{"g":"f",
                   "tab":["n17"]}},
 "recevoir":{"V":{"aux":["av"],
                  "tab":"v63"}},
 "réchauffer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "recherche":{"N":{"g":"f",
                   "tab":["n17"]}},
 "rechercher":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "récit":{"N":{"g":"m",
               "tab":["n3"]}},
 "réciter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "réclamer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "récolte":{"N":{"g":"f",
                 "tab":["n17"]}},
 "récolter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "recommandation":{"N":{"g":"f",
                        "tab":["n17"]}},
 "recommander":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "recommencer":{"V":{"aux":["av"],
                     "tab":"v0"}},
 "récompense":{"N":{"g":"f",
                    "tab":["n17"]}},
 "récompenser":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "reconduire":{"V":{"aux":["av"],
                    "tab":"v113"}},
 "réconforter":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "reconnaissance":{"N":{"g":"f",
                        "tab":["n17"]}},
 "reconnaissant":{"A":{"tab":["n28"]}},
 "reconnaître":{"V":{"aux":["av"],
                     "tab":"v101"}},
 "recourir":{"V":{"aux":["av"],
                  "tab":"v57"}},
 "recours":{"N":{"g":"m",
                 "tab":["n2"]}},
 "recouvrir":{"V":{"aux":["av"],
                   "tab":"v44"}},
 "récréation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "recueillir":{"V":{"aux":["av"],
                    "tab":"v51"}},
 "reculer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "rédaction":{"N":{"g":"f",
                   "tab":["n17"]}},
 "redescendre":{"V":{"aux":["aê"],
                     "tab":"v85"}},
 "redevenir":{"V":{"aux":["êt"],
                   "tab":"v52"}},
 "redire":{"V":{"aux":["av"],
                "tab":"v117"}},
 "redoubler":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "redoutable":{"A":{"tab":["n25"]}},
 "redouter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "redresser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "réduire":{"V":{"aux":["av"],
                 "tab":"v113"}},
 "réel":{"A":{"tab":["n48"]}},
 "réellement":{"Adv":{"tab":["av"]}},
 "refaire":{"V":{"aux":["av"],
                 "tab":"v124"}},
 "réfectoire":{"N":{"g":"m",
                    "tab":["n3"]}},
 "refermer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "réfléchir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "reflet":{"N":{"g":"m",
                "tab":["n3"]}},
 "refléter":{"V":{"aux":["av"],
                  "tab":"v22"}},
 "réflexion":{"N":{"g":"f",
                   "tab":["n17"]}},
 "réformer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "refrain":{"N":{"g":"m",
                 "tab":["n3"]}},
 "refroidir":{"V":{"aux":["av"],
                   "tab":"v58"}},
 "refuge":{"N":{"g":"m",
                "tab":["n3"]}},
 "réfugier":{"V":{"aux":["êt"],
                  "tab":"v36"}},
 "refuser":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "regagner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "régaler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "regard":{"N":{"g":"m",
                "tab":["n3"]}},
 "regarder":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "régime":{"N":{"g":"m",
                "tab":["n3"]}},
 "régiment":{"N":{"g":"m",
                  "tab":["n3"]}},
 "région":{"N":{"g":"f",
                "tab":["n17"]}},
 "règle":{"N":{"g":"f",
               "tab":["n17"]}},
 "régler":{"V":{"aux":["av"],
                "tab":"v18"}},
 "règne":{"N":{"g":"m",
               "tab":["n3"]}},
 "régner":{"V":{"aux":["av"],
                "tab":"v19"}},
 "regret":{"N":{"g":"m",
                "tab":["n3"]}},
 "regretter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "régulier":{"A":{"tab":["n39"]}},
 "régulièrement":{"Adv":{"tab":["av"]}},
 "reine":{"N":{"g":"f",
               "tab":["n17"]}},
 "rejeter":{"V":{"aux":["av"],
                 "tab":"v10"}},
 "rejoindre":{"V":{"aux":["av"],
                   "tab":"v97"}},
 "réjouir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "relatif":{"A":{"tab":["n46"]}},
 "relation":{"N":{"g":"f",
                  "tab":["n17"]}},
 "relativement":{"Adv":{"tab":["av"]}},
 "relever":{"V":{"aux":["av"],
                 "tab":"v25"}},
 "religieux":{"A":{"tab":["n54"]}},
 "religion":{"N":{"g":"f",
                  "tab":["n17"]}},
 "relire":{"V":{"aux":["av"],
                "tab":"v120"}},
 "remarquable":{"A":{"tab":["n25"]}},
 "remarque":{"N":{"g":"f",
                  "tab":["n17"]}},
 "remarquer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "remède":{"N":{"g":"m",
                "tab":["n3"]}},
 "remerciement":{"N":{"g":"m",
                      "tab":["n3"]}},
 "remercier":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "remettre":{"V":{"aux":["av"],
                  "tab":"v89"}},
 "remise":{"N":{"g":"f",
                "tab":["n17"]}},
 "remonter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "remords":{"N":{"g":"m",
                 "tab":["n2"]}},
 "remplacer":{"V":{"aux":["av"],
                   "tab":"v0"}},
 "remplir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "remporter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "remuer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "renaître":{"V":{"aux":["intr"],
                  "tab":"v105"}},
 "renard":{"N":{"g":"m",
                "tab":["n3"]}},
 "rencontre":{"N":{"g":"f",
                   "tab":["n17"]}},
 "rencontrer":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "rendez-vous":{"N":{"g":"m",
                     "tab":["n2"]}},
 "rendre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "renfermer":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "renoncer":{"V":{"aux":["av"],
                  "tab":"v0"}},
 "renoncule":{"N":{"g":"f",
                   "tab":["n17"]}},
 "renouveau":{"N":{"g":"m",
                   "tab":["n4"]}},
 "renouveler":{"V":{"aux":["av"],
                    "tab":"v7"}},
 "renouvellement":{"N":{"g":"m",
                        "tab":["n3"]}},
 "renseignement":{"N":{"g":"m",
                       "tab":["n3"]}},
 "renseigner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "rentrée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "rentrer":{"V":{"aux":["aê"],
                 "tab":"v36"}},
 "renverser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "renvoyer":{"V":{"aux":["av"],
                  "tab":"v134"}},
 "répandre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "reparaître":{"V":{"aux":["av"],
                    "tab":"v101"}},
 "réparer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "répartir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "repas":{"N":{"g":"m",
               "tab":["n2"]}},
 "repasser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "repentir":{"V":{"aux":["êt"],
                  "tab":"v46"}},
 "répéter":{"V":{"aux":["av"],
                 "tab":"v22"}},
 "replier":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "répondre":{"V":{"aux":["av"],
                  "tab":"v85"}},
 "réponse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "reporter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "repos":{"N":{"g":"m",
               "tab":["n2"]}},
 "reposer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "repousser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "reprendre":{"V":{"aux":["av"],
                   "tab":"v90"}},
 "représentant":{"N":{"g":"m",
                      "tab":["n3"]}},
 "représentation":{"N":{"g":"f",
                        "tab":["n17"]}},
 "représenter":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "reprise":{"N":{"g":"f",
                 "tab":["n17"]}},
 "reproche":{"N":{"g":"m",
                  "tab":["n3"]}},
 "reprocher":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "réserve":{"N":{"g":"f",
                 "tab":["n17"]}},
 "réserver":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "résigner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "résistance":{"N":{"g":"f",
                    "tab":["n17"]}},
 "résister":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "résolution":{"N":{"g":"f",
                    "tab":["n17"]}},
 "résonner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "résoudre":{"V":{"aux":["av"],
                  "tab":"v94"}},
 "respect":{"N":{"g":"m",
                 "tab":["n3"]}},
 "respecter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "respectueux":{"A":{"tab":["n54"]}},
 "respiration":{"N":{"g":"f",
                     "tab":["n17"]}},
 "respirer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "resplendir":{"V":{"aux":["av"],
                    "tab":"v58"}},
 "ressembler":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "ressentir":{"V":{"aux":["av"],
                   "tab":"v46"}},
 "ressort":{"N":{"g":"m",
                 "tab":["n3"]}},
 "ressource":{"N":{"g":"f",
                   "tab":["n17"]}},
 "reste":{"N":{"g":"m",
               "tab":["n3"]}},
 "rester":{"V":{"aux":["êt"],
                "tab":"v36"}},
 "résultat":{"N":{"g":"m",
                  "tab":["n3"]}},
 "rétablir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "retard":{"N":{"g":"m",
                "tab":["n3"]}},
 "retardataire":{"N":{"g":"x",
                      "tab":["n25"]}},
 "retenir":{"V":{"aux":["av"],
                 "tab":"v52"}},
 "retentir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "retirer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "retomber":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "retour":{"N":{"g":"m",
                "tab":["n3"]}},
 "retourner":{"V":{"aux":["êt"],
                   "tab":"v36"}},
 "retraite":{"N":{"g":"f",
                  "tab":["n17"]}},
 "retrousser":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "retrouver":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "réunion":{"N":{"g":"f",
                 "tab":["n17"]}},
 "réunir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "réussir":{"V":{"aux":["av"],
                 "tab":"v58"}},
 "rêve":{"N":{"g":"m",
              "tab":["n3"]}},
 "réveil":{"N":{"g":"m",
                "tab":["n3"]}},
 "réveiller":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "révéler":{"V":{"aux":["av"],
                 "tab":"v16"}},
 "revenir":{"V":{"aux":["êt"],
                 "tab":"v52"}},
 "rêver":{"V":{"aux":["av"],
               "tab":"v36"}},
 "reverdir":{"V":{"aux":["av"],
                  "tab":"v58"}},
 "revêtir":{"V":{"aux":["av"],
                 "tab":"v56"}},
 "revivre":{"V":{"aux":["av"],
                 "tab":"v100"}},
 "revoir":{"V":{"aux":["av"],
                "tab":"v72"}},
 "revue":{"N":{"g":"f",
               "tab":["n17"]}},
 "rez-de-chaussée":{"N":{"g":"m",
                         "tab":["n2"]}},
 "rhume":{"N":{"g":"m",
               "tab":["n3"]}},
 "riant":{"A":{"tab":["n28"]}},
 "riche":{"A":{"tab":["n25"]}},
 "richesse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "rideau":{"N":{"g":"m",
                "tab":["n4"]}},
 "rider":{"V":{"aux":["av"],
               "tab":"v36"}},
 "rien":{"Adv":{"tab":["av"]}},
 "rigole":{"N":{"g":"f",
                "tab":["n17"]}},
 "rigoureux":{"A":{"tab":["n54"]}},
 "rire":{"V":{"aux":["av"],
              "tab":"v107"}},
 "risque":{"N":{"g":"m",
                "tab":["n3"]}},
 "risquer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "rive":{"N":{"g":"f",
              "tab":["n17"]}},
 "rivière":{"N":{"g":"f",
                 "tab":["n17"]}},
 "riz":{"N":{"g":"m",
             "tab":["n2"]}},
 "robe":{"N":{"g":"f",
              "tab":["n17"]}},
 "robuste":{"A":{"tab":["n25"]}},
 "rocher":{"N":{"g":"m",
                "tab":["n3"]}},
 "rôder":{"V":{"aux":["av"],
               "tab":"v36"}},
 "roi":{"N":{"g":"m",
             "tab":["n3"]}},
 "rôle":{"N":{"g":"m",
              "tab":["n3"]}},
 "romain":{"A":{"tab":["n28"]}},
 "rompre":{"V":{"aux":["av"],
                "tab":"v91"}},
 "ronce":{"N":{"g":"f",
               "tab":["n17"]}},
 "rond":{"A":{"tab":["n28"]}},
 "ronde":{"N":{"g":"f",
               "tab":["n17"]}},
 "ronger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "ronronner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "rose":{"N":{"g":"x",
              "tab":["n25"]}},
 "roseau":{"N":{"g":"m",
                "tab":["n4"]}},
 "rosée":{"N":{"g":"f",
               "tab":["n17"]}},
 "rosier":{"N":{"g":"m",
                "tab":["n3"]}},
 "rossignol":{"N":{"g":"m",
                   "tab":["n3"]}},
 "rôti":{"N":{"g":"m",
              "tab":["n3"]}},
 "roue":{"N":{"g":"f",
              "tab":["n17"]}},
 "rouge":{"A":{"tab":["n25"]}},
 "rougir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "rouiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "rouleau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "rouler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "roulotte":{"N":{"g":"f",
                  "tab":["n17"]}},
 "route":{"N":{"g":"f",
               "tab":["n17"]}},
 "roux":{"A":{"tab":["n53"]}},
 "royal":{"A":{"tab":["n47"]}},
 "royaume":{"N":{"g":"m",
                 "tab":["n3"]}},
 "ruban":{"N":{"g":"m",
               "tab":["n3"]}},
 "ruche":{"N":{"g":"f",
               "tab":["n17"]}},
 "rude":{"A":{"tab":["n25"]}},
 "rue":{"N":{"g":"f",
             "tab":["n17"]}},
 "ruelle":{"N":{"g":"f",
                "tab":["n17"]}},
 "ruine":{"N":{"g":"f",
               "tab":["n17"]}},
 "ruiner":{"V":{"aux":["av"],
                "tab":"v36"}},
 "ruisseau":{"N":{"g":"m",
                  "tab":["n4"]}},
 "ruisseler":{"V":{"aux":["av"],
                   "tab":"v7"}},
 "ruisselet":{"N":{"g":"m",
                   "tab":["n3"]}},
 "rusé":{"A":{"tab":["n28"]}},
 "rustique":{"A":{"tab":["n25"]}},
 "sable":{"N":{"g":"m",
               "tab":["n3"]}},
 "sabot":{"N":{"g":"m",
               "tab":["n3"]}},
 "sabre":{"N":{"g":"m",
               "tab":["n3"]}},
 "sac":{"N":{"g":"m",
             "tab":["n3"]}},
 "sacoche":{"N":{"g":"f",
                 "tab":["n17"]}},
 "sacré":{"A":{"tab":["n28"]}},
 "sacrement":{"N":{"g":"m",
                   "tab":["n3"]}},
 "sacrifice":{"N":{"g":"m",
                   "tab":["n3"]}},
 "sacrifier":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "sage":{"A":{"tab":["n25"]}},
 "sagement":{"Adv":{"tab":["av"]}},
 "sagesse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "saigner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "sain":{"A":{"tab":["n28"]}},
 "saint":{"A":{"tab":["n28"]}},
 "saisir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "saison":{"N":{"g":"f",
                "tab":["n17"]}},
 "salade":{"N":{"g":"f",
                "tab":["n17"]}},
 "salaire":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sale":{"A":{"tab":["n25"]}},
 "salir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "salle":{"N":{"g":"f",
               "tab":["n17"]}},
 "salon":{"N":{"g":"m",
               "tab":["n3"]}},
 "saluer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "salut":{"N":{"g":"m",
               "tab":["n3"]}},
 "salutation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "samedi":{"N":{"g":"m",
                "tab":["n3"]}},
 "sang":{"N":{"g":"m",
              "tab":["n3"]}},
 "sanglot":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sans":{"P":{"tab":["pp"]}},
 "santé":{"N":{"g":"f",
               "tab":["n17"]}},
 "sapin":{"N":{"g":"m",
               "tab":["n3"]}},
 "satin":{"N":{"g":"m",
               "tab":["n3"]}},
 "satisfaction":{"N":{"g":"f",
                      "tab":["n17"]}},
 "satisfaire":{"V":{"aux":["av"],
                    "tab":"v124"}},
 "satisfait":{"A":{"tab":["n28"]}},
 "sauce":{"N":{"g":"f",
               "tab":["n17"]}},
 "sauf":{"P":{"tab":["pp"]}},
 "saule":{"N":{"g":"m",
               "tab":["n3"]}},
 "saut":{"N":{"g":"m",
              "tab":["n3"]}},
 "sauter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "sautiller":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "sauvage":{"A":{"tab":["n25"]}},
 "sauver":{"V":{"aux":["av"],
                "tab":"v36"}},
 "savant":{"N":{"g":"x",
                "tab":["n28"]}},
 "savoir":{"V":{"aux":["av"],
                "tab":"v67"}},
 "savon":{"N":{"g":"m",
               "tab":["n3"]}},
 "savourer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "savoureux":{"A":{"tab":["n54"]}},
 "scène":{"N":{"g":"f",
               "tab":["n17"]}},
 "science":{"N":{"g":"f",
                 "tab":["n17"]}},
 "scier":{"V":{"aux":["av"],
               "tab":"v36"}},
 "scintiller":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "scolaire":{"A":{"tab":["n25"]}},
 "séance":{"N":{"g":"f",
                "tab":["n17"]}},
 "seau":{"N":{"g":"m",
              "tab":["n4"]}},
 "sec":{"A":{"tab":["n37"]}},
 "sécher":{"V":{"aux":["av"],
                "tab":"v27"}},
 "seconde":{"N":{"g":"f",
                 "tab":["n17"]}},
 "secouer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "secourir":{"V":{"aux":["av"],
                  "tab":"v57"}},
 "secours":{"N":{"g":"m",
                 "tab":["n2"]}},
 "secret":{"N":{"g":"m",
                "tab":["n3"]}},
 "sécurité":{"N":{"g":"f",
                  "tab":["n17"]}},
 "seigneur":{"N":{"g":"m",
                  "tab":["n3"]}},
 "sein":{"N":{"g":"m",
              "tab":["n3"]}},
 "séjour":{"N":{"g":"m",
                "tab":["n3"]}},
 "sel":{"N":{"g":"m",
             "tab":["n3"]}},
 "selon":{"P":{"tab":["pp"]}},
 "semaine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "semblable":{"A":{"tab":["n25"]}},
 "sembler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "semer":{"V":{"aux":["av"],
               "tab":"v13"}},
 "séminaire":{"N":{"g":"m",
                   "tab":["n3"]}},
 "sens":{"N":{"g":"m",
              "tab":["n2"]}},
 "sensible":{"A":{"tab":["n25"]}},
 "sentier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sentiment":{"N":{"g":"m",
                   "tab":["n3"]}},
 "sentir":{"V":{"aux":["av"],
                "tab":"v46"}},
 "séparer":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "septembre":{"N":{"g":"m",
                   "tab":["n3"]}},
 "serein":{"A":{"tab":["n28"]}},
 "sergent":{"N":{"g":"x",
                 "tab":["n28"]}},
 "série":{"N":{"g":"f",
               "tab":["n17"]}},
 "sérieusement":{"Adv":{"tab":["av"]}},
 "sérieux":{"A":{"tab":["n54"]}},
 "sermon":{"N":{"g":"m",
                "tab":["n3"]}},
 "serrer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "serrure":{"N":{"g":"f",
                 "tab":["n17"]}},
 "servante":{"N":{"g":"f",
                  "tab":["n17"]}},
 "serviable":{"A":{"tab":["n25"]}},
 "service":{"N":{"g":"m",
                 "tab":["n3"]}},
 "serviette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "servir":{"V":{"aux":["av"],
                "tab":"v47"}},
 "serviteur":{"N":{"g":"m",
                   "tab":["n3"]}},
 "seuil":{"N":{"g":"m",
               "tab":["n3"]}},
 "seul":{"A":{"tab":["n28"]}},
 "seulement":{"Adv":{"tab":["av"]}},
 "sève":{"N":{"g":"f",
              "tab":["n17"]}},
 "sévère":{"A":{"tab":["n25"]}},
 "sévèrement":{"Adv":{"tab":["av"]}},
 "sévir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "si":{"Adv":{"tab":["av"]},
       "C":{"tab":["cji"]},
       "N":{"g":"m",
            "tab":["n2"]}},
 "siècle":{"N":{"g":"m",
                "tab":["n3"]}},
 "siège":{"N":{"g":"m",
               "tab":["n3"]}},
 "sifflement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "siffler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "sifflet":{"N":{"g":"m",
                 "tab":["n3"]}},
 "signal":{"N":{"g":"m",
                "tab":["n5"]}},
 "signaler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "signature":{"N":{"g":"f",
                   "tab":["n17"]}},
 "signe":{"N":{"g":"m",
               "tab":["n3"]}},
 "signer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "signifier":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "silence":{"N":{"g":"m",
                 "tab":["n3"]}},
 "silencieusement":{"Adv":{"tab":["av"]}},
 "silencieux":{"A":{"tab":["n54"]}},
 "sillon":{"N":{"g":"m",
                "tab":["n3"]}},
 "sillonner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "simple":{"A":{"tab":["n25"]}},
 "simplement":{"Adv":{"tab":["av"]}},
 "simplicité":{"N":{"g":"f",
                    "tab":["n17"]}},
 "sincère":{"A":{"tab":["n25"]}},
 "sincèrement":{"Adv":{"tab":["av"]}},
 "sincérité":{"N":{"g":"f",
                   "tab":["n17"]}},
 "singe":{"N":{"g":"m",
               "tab":["n3"]}},
 "singulier":{"A":{"tab":["n39"]}},
 "sinistre":{"A":{"tab":["n25"]}},
 "sirène":{"N":{"g":"f",
                "tab":["n17"]}},
 "sitôt":{"Adv":{"tab":["av"]}},
 "situation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "situer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "sobre":{"A":{"tab":["n25"]}},
 "société":{"N":{"g":"f",
                 "tab":["n17"]}},
 "soeur":{"N":{"g":"f",
               "tab":["n17"]}},
 "soi-même":{"Pro":{"tab":["pn9"]}},
 "soie":{"N":{"g":"f",
              "tab":["n17"]}},
 "soif":{"N":{"g":"f",
              "tab":["n17"]}},
 "soigner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "soigneusement":{"Adv":{"tab":["av"]}},
 "soigneux":{"A":{"tab":["n54"]}},
 "soin":{"N":{"g":"m",
              "tab":["n3"]}},
 "soir":{"N":{"g":"m",
              "tab":["n3"]}},
 "soirée":{"N":{"g":"f",
                "tab":["n17"]}},
 "soit":{"Adv":{"tab":["av"]},
         "C":{"tab":["cj"]}},
 "sol":{"N":{"g":"m",
             "tab":["n3"]}},
 "soldat":{"N":{"g":"m",
                "tab":["n3"]}},
 "soleil":{"N":{"g":"m",
                "tab":["n3"]}},
 "solennel":{"A":{"tab":["n48"]}},
 "solide":{"A":{"tab":["n25"]}},
 "solitaire":{"A":{"tab":["n25"]}},
 "solitude":{"N":{"g":"f",
                  "tab":["n17"]}},
 "solliciter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "sombre":{"A":{"tab":["n25"]}},
 "somme":{"N":{"g":"f",
               "tab":["n17"]}},
 "sommeil":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sommet":{"N":{"g":"m",
                "tab":["n3"]}},
 "son":{"D":{"tab":["d5-3"]},
        "N":{"g":"m","tab":["n3"]}},
 "songer":{"V":{"aux":["av"],
                "tab":"v3"}},
 "sonner":{"V":{"aux":["aê"],
                "tab":"v36"}},
 "sonnette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "sonore":{"A":{"tab":["n25"]}},
 "sort":{"N":{"g":"m",
              "tab":["n3"]}},
 "sorte":{"N":{"g":"f",
               "tab":["n17"]}},
 "sortie":{"N":{"g":"f",
                "tab":["n17"]}},
 "sortir":{"V":{"aux":["aê"],
                "tab":"v46"}},
 "sot":{"A":{"tab":["n51"]}},
 "sou":{"N":{"g":"m",
             "tab":["n3"]}},
 "souci":{"N":{"g":"m",
               "tab":["n3"]}},
 "soudain":{"Adv":{"tab":["av"]}},
 "souffle":{"N":{"g":"m",
                 "tab":["n3"]}},
 "souffler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "souffrance":{"N":{"g":"f",
                    "tab":["n17"]}},
 "souffrir":{"V":{"aux":["av"],
                  "tab":"v44"}},
 "souhait":{"N":{"g":"m",
                 "tab":["n3"]}},
 "souhaiter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "souiller":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "soulagement":{"N":{"g":"m",
                     "tab":["n3"]}},
 "soulager":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "soulever":{"V":{"aux":["av"],
                  "tab":"v25"}},
 "soulier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "soumettre":{"V":{"aux":["av"],
                   "tab":"v89"}},
 "soupçonner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "soupe":{"N":{"g":"f",
               "tab":["n17"]}},
 "souper":{"V":{"aux":["av"],
                "tab":"v36"}},
 "soupir":{"N":{"g":"m",
                "tab":["n3"]}},
 "soupirer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "souple":{"A":{"tab":["n25"]}},
 "source":{"N":{"g":"f",
                "tab":["n17"]}},
 "sourd":{"A":{"tab":["n28"]}},
 "souriant":{"A":{"tab":["n28"]}},
 "sourire":{"V":{"aux":["av"],
                 "tab":"v107"}},
 "souris":{"N":{"g":"f",
                "tab":["n16"]}},
 "sous":{"P":{"tab":["pp"]}},
 "soutenir":{"V":{"aux":["av"],
                  "tab":"v52"}},
 "souterrain":{"A":{"tab":["n28"]}},
 "soutien":{"N":{"g":"m",
                 "tab":["n3"]}},
 "souvenir":{"N":{"g":"m",
                  "tab":["n3"]}},
 "souvent":{"Adv":{"tab":["av"]}},
 "souverain":{"N":{"g":"x",
                   "tab":["n28"]}},
 "soyeux":{"A":{"tab":["n54"]}},
 "spacieux":{"A":{"tab":["n54"]}},
 "spécial":{"A":{"tab":["n47"]}},
 "spécialement":{"Adv":{"tab":["av"]}},
 "spectacle":{"N":{"g":"m",
                   "tab":["n3"]}},
 "spectateur":{"N":{"g":"x",
                    "tab":["n56"]}},
 "splendeur":{"N":{"g":"f",
                   "tab":["n17"]}},
 "splendide":{"A":{"tab":["n25"]}},
 "sport":{"N":{"g":"m",
               "tab":["n3"]}},
 "station":{"N":{"g":"f",
                 "tab":["n17"]}},
 "stationner":{"V":{"aux":["aê"],
                    "tab":"v36"}},
 "statue":{"N":{"g":"f",
                "tab":["n17"]}},
 "studieux":{"A":{"tab":["n54"]}},
 "stupéfaction":{"N":{"g":"f",
                      "tab":["n17"]}},
 "style":{"N":{"g":"m",
               "tab":["n3"]}},
 "suave":{"A":{"tab":["n25"]}},
 "subir":{"V":{"aux":["av"],
               "tab":"v58"}},
 "subitement":{"Adv":{"tab":["av"]}},
 "sublime":{"A":{"tab":["n25"]}},
 "suc":{"N":{"g":"m",
             "tab":["n3"]}},
 "succéder":{"V":{"aux":["av"],
                  "tab":"v30"}},
 "succès":{"N":{"g":"m",
                "tab":["n2"]}},
 "successivement":{"Adv":{"tab":["av"]}},
 "succulent":{"A":{"tab":["n28"]}},
 "sucer":{"V":{"aux":["av"],
               "tab":"v0"}},
 "sucre":{"N":{"g":"m",
               "tab":["n3"]}},
 "sud":{"N":{"g":"m",
             "tab":["n35"]}},
 "sueur":{"N":{"g":"f",
               "tab":["n17"]}},
 "suffire":{"V":{"aux":["av"],
                 "tab":"v116"}},
 "suffisamment":{"Adv":{"tab":["av"]}},
 "suffisant":{"A":{"tab":["n28"]}},
 "suite":{"N":{"g":"f",
               "tab":["n17"]}},
 "suivant":{"A":{"tab":["n28"]}},
 "suivre":{"V":{"aux":["av"],
                "tab":"v99"}},
 "sujet":{"N":{"g":"m",
               "tab":["n3"]}},
 "superbe":{"A":{"tab":["n25"]}},
 "supérieur":{"A":{"tab":["n28"]}},
 "supplier":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "supporter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "supposer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "suprême":{"A":{"tab":["n25"]}},
 "sur":{"P":{"tab":["pp"]}},
 "sûr":{"A":{"tab":["n28"]}},
 "sûrement":{"Adv":{"tab":["av"]}},
 "surface":{"N":{"g":"f",
                 "tab":["n17"]}},
 "surgir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "surmonter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "surprendre":{"V":{"aux":["av"],
                    "tab":"v90"}},
 "surprise":{"N":{"g":"f",
                  "tab":["n17"]}},
 "sursaut":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sursauter":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "surtout":{"Adv":{"tab":["av"]}},
 "surveiller":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "survenir":{"V":{"aux":["êt"],
                  "tab":"v52"}},
 "suspect":{"N":{"g":"x",
                 "tab":["n28"]}},
 "suspendre":{"V":{"aux":["av"],
                   "tab":"v85"}},
 "symbole":{"N":{"g":"m",
                 "tab":["n3"]}},
 "sympathie":{"N":{"g":"f",
                   "tab":["n17"]}},
 "tabac":{"N":{"g":"m",
               "tab":["n3"]}},
 "table":{"N":{"g":"f",
               "tab":["n17"]}},
 "tableau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "tablier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tâche":{"N":{"g":"f",
               "tab":["n17"]}},
 "tache":{"N":{"g":"f",
               "tab":["n17"]}},
 "tâcher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "tacher":{"V":{"aux":["av"],
                "tab":"v36"}},
 "tacheter":{"V":{"aux":["av"],
                  "tab":"v10"}},
 "taille":{"N":{"g":"f",
                "tab":["n17"]}},
 "tailler":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "tailleur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "taillis":{"N":{"g":"m",
                 "tab":["n2"]}},
 "taire":{"V":{"aux":["av"],
               "tab":"v122"}},
 "talent":{"N":{"g":"m",
                "tab":["n3"]}},
 "talus":{"N":{"g":"m",
               "tab":["n2"]}},
 "tambour":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tant":{"Adv":{"tab":["av"]}},
 "tante":{"N":{"g":"f",
               "tab":["n17"]}},
 "tantôt":{"Adv":{"tab":["av"]}},
 "tapage":{"N":{"g":"m",
                "tab":["n3"]}},
 "taper":{"V":{"aux":["av"],
               "tab":"v36"}},
 "tapis":{"N":{"g":"m",
               "tab":["n2"]}},
 "tapisser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "taquiner":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "tard":{"Adv":{"tab":["av"]}},
 "tarder":{"V":{"aux":["av"],
                "tab":"v36"}},
 "tarte":{"N":{"g":"f",
               "tab":["n17"]}},
 "tartine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "tas":{"N":{"g":"m",
             "tab":["n2"]}},
 "tasse":{"N":{"g":"f",
               "tab":["n17"]}},
 "teinte":{"N":{"g":"f",
                "tab":["n17"]}},
 "télégramme":{"N":{"g":"m",
                    "tab":["n3"]}},
 "téléphone":{"N":{"g":"m",
                   "tab":["n3"]}},
 "téléphoner":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "tellement":{"Adv":{"tab":["av"]}},
 "témoignage":{"N":{"g":"m",
                    "tab":["n3"]}},
 "témoigner":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "témoin":{"N":{"g":"m",
                "tab":["n3"]}},
 "température":{"N":{"g":"f",
                     "tab":["n17"]}},
 "tempête":{"N":{"g":"f",
                 "tab":["n17"]}},
 "temps":{"N":{"g":"m",
               "tab":["n2"]}},
 "tendre":{"A":{"tab":["n25"]}},
 "tendrement":{"Adv":{"tab":["av"]}},
 "tendresse":{"N":{"g":"f",
                   "tab":["n17"]}},
 "ténèbres":{"N":{"g":"f",
                  "tab":["n15"]}},
 "tenir":{"V":{"aux":["av"],
               "tab":"v52"}},
 "tentation":{"N":{"g":"f",
                   "tab":["n17"]}},
 "tente":{"N":{"g":"f",
               "tab":["n17"]}},
 "tenter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "tenue":{"N":{"g":"f",
               "tab":["n17"]}},
 "terme":{"N":{"g":"m",
               "tab":["n3"]}},
 "terminer":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "terrain":{"N":{"g":"m",
                 "tab":["n3"]}},
 "terrasse":{"N":{"g":"f",
                  "tab":["n17"]}},
 "terre":{"N":{"g":"f",
               "tab":["n17"]}},
 "terrestre":{"A":{"tab":["n25"]}},
 "terreur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "terrible":{"A":{"tab":["n25"]}},
 "terrier":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tête":{"N":{"g":"f",
              "tab":["n17"]}},
 "thé":{"N":{"g":"m",
             "tab":["n3"]}},
 "théâtre":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tiède":{"A":{"tab":["n25"]}},
 "tige":{"N":{"g":"f",
              "tab":["n17"]}},
 "tigre":{"N":{"g":"x",
               "tab":["n52"]}},
 "tilleul":{"N":{"g":"m",
                 "tab":["n3"]}},
 "timbre":{"N":{"g":"m",
                "tab":["n3"]}},
 "timide":{"A":{"tab":["n25"]}},
 "tinter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "tirelire":{"N":{"g":"f",
                  "tab":["n17"]}},
 "tirer":{"V":{"aux":["av"],
               "tab":"v36"}},
 "tiroir":{"N":{"g":"m",
                "tab":["n3"]}},
 "tissu":{"N":{"g":"m",
               "tab":["n3"]}},
 "titre":{"N":{"g":"m",
               "tab":["n3"]}},
 "toile":{"N":{"g":"f",
               "tab":["n17"]}},
 "toilette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "toit":{"N":{"g":"m",
              "tab":["n3"]}},
 "tombe":{"N":{"g":"f",
               "tab":["n17"]}},
 "tombeau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "tomber":{"V":{"aux":["êt"],
                "tab":"v36"}},
 "ton":{"D":{"tab":["d5-2"]},
        "N":{"g":"m","tab":["n3"]}},
 "tonneau":{"N":{"g":"m",
                 "tab":["n4"]}},
 "tonnerre":{"N":{"g":"m",
                  "tab":["n3"]}},
 "tordre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "torrent":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tort":{"N":{"g":"m",
              "tab":["n3"]}},
 "tortue":{"N":{"g":"f",
                "tab":["n17"]}},
 "tôt":{"Adv":{"tab":["av"]}},
 "toucher":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "touffe":{"N":{"g":"f",
                "tab":["n17"]}},
 "touffu":{"A":{"tab":["n28"]}},
 "toujours":{"Adv":{"tab":["av"]}},
 "tour":{"N":{"g":"x",
              "tab":["n25"]}},
 "tourbillon":{"N":{"g":"m",
                    "tab":["n3"]}},
 "tourbillonner":{"V":{"aux":["av"],
                       "tab":"v36"}},
 "tourment":{"N":{"g":"m",
                  "tab":["n3"]}},
 "tourmenter":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "tournant":{"N":{"g":"m",
                  "tab":["n3"]}},
 "tournée":{"N":{"g":"f",
                 "tab":["n17"]}},
 "tourner":{"V":{"aux":["aê"],
                 "tab":"v36"}},
 "tournoyer":{"V":{"aux":["av"],
                   "tab":"v5"}},
 "tout":{"A":{"tab":["n76"]},
         "Adv":{"tab":["av"]},
         "N":{"g":"m",
              "tab":["n3"]}},
 "toutefois":{"Adv":{"tab":["av"]}},
 "toux":{"N":{"g":"f",
              "tab":["n16"]}},
 "trace":{"N":{"g":"f",
               "tab":["n17"]}},
 "tracer":{"V":{"aux":["av"],
                "tab":"v0"}},
 "train":{"N":{"g":"m",
               "tab":["n3"]}},
 "traîneau":{"N":{"g":"m",
                  "tab":["n4"]}},
 "traîner":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "trait":{"N":{"g":"m",
               "tab":["n3"]}},
 "traitement":{"N":{"g":"m",
                    "tab":["n3"]}},
 "traiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "trajet":{"N":{"g":"m",
                "tab":["n3"]}},
 "tram":{"N":{"g":"m",
              "tab":["n3"]}},
 "tramway":{"N":{"g":"m",
                 "tab":["n3"]}},
 "tranche":{"N":{"g":"f",
                 "tab":["n17"]}},
 "trancher":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "tranquille":{"A":{"tab":["n25"]}},
 "tranquillement":{"Adv":{"tab":["av"]}},
 "transformation":{"N":{"g":"f",
                        "tab":["n17"]}},
 "transformer":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "transmettre":{"V":{"aux":["av"],
                     "tab":"v89"}},
 "transparent":{"A":{"tab":["n28"]}},
 "transport":{"N":{"g":"m",
                   "tab":["n3"]}},
 "transporter":{"V":{"aux":["av"],
                     "tab":"v36"}},
 "travail":{"N":{"g":"m",
                 "tab":["n6"]}},
 "travailler":{"V":{"aux":["av"],
                    "tab":"v36"}},
 "travailleur":{"N":{"g":"x",
                     "tab":["n55"]}},
 "travailleuse":{"N":{"g":"f",
                      "tab":["n17"]}},
 "travers":{"N":{"g":"m",
                 "tab":["n2"]}},
 "traverser":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "trembler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "tremper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "très":{"Adv":{"tab":["av"]}},
 "trésor":{"N":{"g":"m",
                "tab":["n3"]}},
 "tressaillir":{"V":{"aux":["av"],
                     "tab":"v49"}},
 "tribunal":{"N":{"g":"m",
                  "tab":["n5"]}},
 "tricolore":{"A":{"tab":["n25"]}},
 "tricot":{"N":{"g":"m",
                "tab":["n3"]}},
 "tricoter":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "trimestre":{"N":{"g":"m",
                   "tab":["n3"]}},
 "triomphe":{"N":{"g":"m",
                  "tab":["n3"]}},
 "triompher":{"V":{"aux":["av"],
                   "tab":"v36"}},
 "triste":{"A":{"tab":["n25"]}},
 "tristement":{"Adv":{"tab":["av"]}},
 "tristesse":{"N":{"g":"f",
                   "tab":["n17"]}},
 "tromper":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "trompette":{"N":{"g":"f",
                   "tab":["n17"]}},
 "tronc":{"N":{"g":"m",
               "tab":["n3"]}},
 "trop":{"Adv":{"tab":["av"]}},
 "trotter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "trottoir":{"N":{"g":"m",
                  "tab":["n3"]}},
 "trou":{"N":{"g":"m",
              "tab":["n3"]}},
 "trouble":{"N":{"g":"m",
                 "tab":["n3"]}},
 "troubler":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "trouer":{"V":{"aux":["av"],
                "tab":"v36"}},
 "troupe":{"N":{"g":"f",
                "tab":["n17"]}},
 "troupeau":{"N":{"g":"m",
                  "tab":["n4"]}},
 "trouver":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "tuer":{"V":{"aux":["av"],
              "tab":"v36"}},
 "tuile":{"N":{"g":"f",
               "tab":["n17"]}},
 "tulipe":{"N":{"g":"f",
                "tab":["n17"]}},
 "tunnel":{"N":{"g":"m",
                "tab":["n3"]}},
 "tuque":{"N":{"g":"f",
               "tab":["n17"]}},
 "turbulent":{"A":{"tab":["n28"]}},
 "tuyau":{"N":{"g":"m",
               "tab":["n4"]}},
 "type":{"N":{"g":"m",
              "tab":["n3"]}},
 "un":{"D":{"tab":["d4"]}},
 "un peu":{"Adv":{"tab":["av"]}},
 "union":{"N":{"g":"f",
               "tab":["n17"]}},
 "unique":{"A":{"tab":["n25"]}},
 "unir":{"V":{"aux":["av"],
              "tab":"v58"}},
 "univers":{"N":{"g":"m",
                 "tab":["n2"]}},
 "universel":{"A":{"tab":["n48"]}},
 "urgent":{"A":{"tab":["n28"]}},
 "usage":{"N":{"g":"m",
               "tab":["n3"]}},
 "user":{"V":{"aux":["av"],
              "tab":"v36"}},
 "usine":{"N":{"g":"f",
               "tab":["n17"]}},
 "utile":{"A":{"tab":["n25"]}},
 "utiliser":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "utilité":{"N":{"g":"f",
                 "tab":["n17"]}},
 "vache":{"N":{"g":"f",
               "tab":["n17"]}},
 "vagabond":{"A":{"tab":["n28"]}},
 "vague":{"N":{"g":"x",
               "tab":["n25"]}},
 "vaillant":{"A":{"tab":["n28"]}},
 "vain":{"A":{"tab":["n28"]}},
 "vaincre":{"V":{"aux":["av"],
                 "tab":"v86"}},
 "vainqueur":{"N":{"g":"x",
                   "tab":["n25"]}},
 "vaisseau":{"N":{"g":"m",
                  "tab":["n4"]}},
 "vaisselle":{"N":{"g":"f",
                   "tab":["n17"]}},
 "valet":{"N":{"g":"m",
               "tab":["n3"]}},
 "valeur":{"N":{"g":"f",
                "tab":["n17"]}},
 "valise":{"N":{"g":"f",
                "tab":["n17"]}},
 "vallée":{"N":{"g":"f",
                "tab":["n17"]}},
 "valoir":{"V":{"aux":["av"],
                "tab":"v69"}},
 "vanter":{"V":{"aux":["av"],
                "tab":"v36"}},
 "vapeur":{"N":{"g":"f",
                "tab":["n17"]}},
 "varier":{"V":{"aux":["av"],
                "tab":"v36"}},
 "vase":{"N":{"g":"x",
              "tab":["n25"]}},
 "vaste":{"A":{"tab":["n25"]}},
 "veau":{"N":{"g":"m",
              "tab":["n4"]}},
 "végétal":{"A":{"tab":["n47"]}},
 "végétation":{"N":{"g":"f",
                    "tab":["n17"]}},
 "véhicule":{"N":{"g":"m",
                  "tab":["n3"]}},
 "veille":{"N":{"g":"f",
                "tab":["n17"]}},
 "veiller":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "veine":{"N":{"g":"f",
               "tab":["n17"]}},
 "vélo":{"N":{"g":"m",
              "tab":["n3"]}},
 "velours":{"N":{"g":"m",
                 "tab":["n2"]}},
 "velouté":{"A":{"tab":["n28"]}},
 "vendeur":{"N":{"g":"x",
                 "tab":["n55"]}},
 "vendre":{"V":{"aux":["av"],
                "tab":"v85"}},
 "vendredi":{"N":{"g":"m",
                  "tab":["n3"]}},
 "vénérer":{"V":{"aux":["av"],
                 "tab":"v28"}},
 "venger":{"V":{"aux":["av"],
                "tab":"v3"}},
 "venir":{"V":{"aux":["êt"],
               "tab":"v52"}},
 "vent":{"N":{"g":"m",
              "tab":["n3"]}},
 "vente":{"N":{"g":"f",
               "tab":["n17"]}},
 "ventre":{"N":{"g":"m",
                "tab":["n3"]}},
 "vêpres":{"N":{"g":"f",
                "tab":["n15"]}},
 "ver":{"N":{"g":"m",
             "tab":["n3"]}},
 "verdâtre":{"A":{"tab":["n25"]}},
 "verdoyant":{"A":{"tab":["n28"]}},
 "verdure":{"N":{"g":"f",
                 "tab":["n17"]}},
 "verger":{"N":{"g":"m",
                "tab":["n3"]}},
 "vérifier":{"V":{"aux":["av"],
                  "tab":"v36"}},
 "véritable":{"A":{"tab":["n25"]}},
 "vérité":{"N":{"g":"f",
                "tab":["n17"]}},
 "vermeil":{"N":{"g":"m",
                 "tab":["n3"]}},
 "vernir":{"V":{"aux":["av"],
                "tab":"v58"}},
 "verre":{"N":{"g":"m",
               "tab":["n3"]}},
 "vers":{"P":{"tab":["pp"]}},
 "verser":{"V":{"aux":["av"],
                "tab":"v36"}},
 "vert":{"A":{"tab":["n28"]}},
 "vertu":{"N":{"g":"f",
               "tab":["n17"]}},
 "veston":{"N":{"g":"m",
                "tab":["n3"]}},
 "vêtement":{"N":{"g":"m",
                  "tab":["n3"]}},
 "vêtir":{"V":{"aux":["av"],
               "tab":"v56"}},
 "veuf":{"A":{"tab":["n46"]}},
 "via":{"P":{"tab":["pp"]}},
 "viande":{"N":{"g":"f",
                "tab":["n17"]}},
 "vicaire":{"N":{"g":"m",
                 "tab":["n3"]}},
 "vice":{"N":{"g":"m",
              "tab":["n3"]}},
 "victime":{"N":{"g":"f",
                 "tab":["n17"]}},
 "victoire":{"N":{"g":"f",
                  "tab":["n17"]}},
 "vide":{"A":{"tab":["n25"]}},
 "vider":{"V":{"aux":["av"],
               "tab":"v36"}},
 "vie":{"N":{"g":"f",
             "tab":["n17"]}},
 "vieillard":{"N":{"g":"m",
                   "tab":["n3"]}},
 "vieillesse":{"N":{"g":"f",
                    "tab":["n17"]}},
 "vierge":{"A":{"tab":["n25"]}},
 "vieux":{"A":{"pos":"pre",
               "tab":["n73"]}},
 "vif":{"A":{"tab":["n46"]}},
 "vigne":{"N":{"g":"f",
               "tab":["n17"]}},
 "vigoureux":{"A":{"tab":["n54"]}},
 "vigueur":{"N":{"g":"f",
                 "tab":["n17"]}},
 "vilain":{"A":{"tab":["n28"]}},
 "villa":{"N":{"g":"f",
               "tab":["n17"]}},
 "village":{"N":{"g":"m",
                 "tab":["n3"]}},
 "villageois":{"N":{"g":"x",
                    "tab":["n27"]}},
 "ville":{"N":{"g":"f",
               "tab":["n17"]}},
 "vin":{"N":{"g":"m",
             "tab":["n3"]}},
 "violence":{"N":{"g":"f",
                  "tab":["n17"]}},
 "violent":{"A":{"tab":["n28"]}},
 "violet":{"A":{"tab":["n51"]}},
 "violette":{"N":{"g":"f",
                  "tab":["n17"]}},
 "visage":{"N":{"g":"m",
                "tab":["n3"]}},
 "viser":{"V":{"aux":["av"],
               "tab":"v36"}},
 "visible":{"A":{"tab":["n25"]}},
 "visite":{"N":{"g":"f",
                "tab":["n17"]}},
 "visiter":{"V":{"aux":["av"],
                 "tab":"v36"}},
 "visiteur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "vite":{"Adv":{"tab":["av"]}},
 "vitesse":{"N":{"g":"f",
                 "tab":["n17"]}},
 "vitre":{"N":{"g":"f",
               "tab":["n17"]}},
 "vitrine":{"N":{"g":"f",
                 "tab":["n17"]}},
 "vivant":{"A":{"tab":["n28"]}},
 "vivement":{"Adv":{"tab":["av"]}},
 "vivre":{"V":{"aux":["av"],
               "tab":"v100"}},
 "voeu":{"N":{"g":"m",
              "tab":["n4"]}},
 "voie":{"N":{"g":"f",
              "tab":["n17"]}},
 "voilà":{"P":{"tab":["pp"]}},
 "voile":{"N":{"g":"f",
               "tab":["n17"]}},
 "voiler":{"V":{"aux":["av"],
                "tab":"v36"}},
 "voir":{"V":{"aux":["av"],
              "tab":"v72"}},
 "voisin":{"N":{"g":"x",
                "tab":["n28"]}},
 "voisinage":{"N":{"g":"m",
                   "tab":["n3"]}},
 "voiture":{"N":{"g":"f",
                 "tab":["n17"]}},
 "voix":{"N":{"g":"f",
              "tab":["n16"]}},
 "vol":{"N":{"g":"m",
             "tab":["n3"]}},
 "volaille":{"N":{"g":"f",
                  "tab":["n17"]}},
 "volée":{"N":{"g":"f",
               "tab":["n17"]}},
 "voler":{"V":{"aux":["av"],
               "tab":"v36"}},
 "volet":{"N":{"g":"m",
               "tab":["n3"]}},
 "voleur":{"N":{"g":"x",
                "tab":["n55"]}},
 "volonté":{"N":{"g":"f",
                 "tab":["n17"]}},
 "volontiers":{"Adv":{"tab":["av"]}},
 "voltiger":{"V":{"aux":["av"],
                  "tab":"v3"}},
 "volume":{"N":{"g":"m",
                "tab":["n3"]}},
 "vouloir":{"V":{"aux":["av"],
                 "tab":"v68"}},
 "voûte":{"N":{"g":"f",
               "tab":["n17"]}},
 "voyage":{"N":{"g":"m",
                "tab":["n3"]}},
 "voyager":{"V":{"aux":["av"],
                 "tab":"v3"}},
 "voyageur":{"N":{"g":"x",
                  "tab":["n55"]}},
 "vrai":{"A":{"tab":["n28"]}},
 "vraiment":{"Adv":{"tab":["av"]}},
 "vue":{"N":{"g":"f",
             "tab":["n17"]}},
 "vulgaire":{"A":{"tab":["n25"]}},
 "wagon":{"N":{"g":"m",
               "tab":["n3"]}},
 "y":{"Pro":{"tab":["pn11"]}},
 "zèle":{"N":{"g":"m",
              "tab":["n3"]}},
 "toi":{"Pro":{"tab":["pn4-2s"]}},
 "lui":{"Pro":{"tab":["pn4-3sm"]}},
 "elle":{"Pro":{"tab":["pn4-3sf"]}},
 "nous":{"Pro":{"tab":["pn4-1p"]}},
 "vous":{"Pro":{"tab":["pn4-2p"]}},
 "eux":{"Pro":{"tab":["pn4-3pm"]}},
 "elles":{"Pro":{"tab":["pn4-3pf"]}},
 
 "tien":{"Pro":{"tab":["pn12-2"]}},
 "sien":{"Pro":{"tab":["pn12-3"]}},
 "vôtre":{"Pro":{"tab":["pn13-2"]}},
 "leur":{"Pro":{"tab":["pn13-3"]},
         "D":{"tab":["d6-3"]}}, 
 "votre":{"D":{"tab":["d6-2"]}},
 "{":{"Pc":{"compl":"}",
            "tab":["pc5"]}},
 "}":{"Pc":{"compl":"{",
            "tab":["pc6"]}}
}
var ruleFr = //========== rule-fr.js
{
    "conjugation": {
        "v0": {
            "ending": "cer",
            "t": {
                "p": ["ce","ces","ce","çons","cez","cent"],
                "i": ["çais","çais","çait","cions","ciez","çaient"],
                "f": ["cerai","ceras","cera","cerons","cerez","ceront"],
                "ps": ["çai","ças","ça","çâmes","çâtes","cèrent"],
                "c": ["cerais","cerais","cerait","cerions","ceriez","ceraient"],
                "s": ["ce","ces","ce","cions","ciez","cent"],
                "si": ["çasse","çasses","çât","çassions","çassiez","çassent"],
                "ip": [null,"ce",null,"çons","cez",null],
                "pr": "çant",
                "pp": "cé",
                "b": "cer"
            }
        },
        "v1": {
            "ending": "er",
            "t": {
                "p": ["e","es","e","ons","ez","ent"],
                "i": ["ais","ais","ait","ons","ez","aient"],
                "f": ["erai","eras","era","erons","erez","eront"],
                "ps": ["ai","as","a","âmes","âtes","èrent"],
                "c": ["erais","erais","erait","erions","eriez","eraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["asse","asses","ât","assions","assiez","assent"],
                "ip": [null,"e",null,"ons","ez",null],
                "pr": "ant",
                "pp": "é",
                "b": "er"
            }
        },
        "v2": {
            "ending": "ecer",
            "t": {
                "p": ["ece","eces","ece","eçons","ecez","ecent"],
                "i": ["eçais","eçais","eçait","ecions","eciez","eçaient"],
                "f": ["ecerai","eceras","ecera","ecerons","ecerez","eceront"],
                "ps": ["eçai","eças","eça","eçâmes","eçâtes","ecèrent"],
                "c": ["ecerais","ecerais","ecerait","ecerions","eceriez","eceraient"],
                "s": ["ece","eces","ece","ecions","eciez","ecent"],
                "si": ["eçasse","eçasses","eçât","eçassions","eçassiez","eçassent"],
                "ip": [null,"ece",null,"eçons","ecez",null],
                "pr": "eçant",
                "pp": "ecé",
                "b": "ecer"
            }
        },
        "v3": {
            "ending": "ger",
            "t": {
                "p": ["ge","ges","ge","geons","gez","gent"],
                "i": ["geais","geais","geait","gions","giez","geaient"],
                "f": ["gerai","geras","gera","gerons","gerez","geront"],
                "ps": ["geai","geas","gea","geâmes","geâtes","gèrent"],
                "c": ["gerais","gerais","gerait","gerions","geriez","geraient"],
                "s": ["ge","ges","ge","gions","giez","gent"],
                "si": ["geasse","geasses","geât","geassions","geassiez","geassent"],
                "ip": [null,"ge",null,"geons","gez",null],
                "pr": "geant",
                "pp": "gé",
                "b": "ger"
            }
        },
        "v4": {
            "ending": "yer",
            "t": {
                "p": ["ie","ies","ie","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["ierai","ieras","iera","ierons","ierez","ieront"],
                "ps": ["yai","yas","ya","yâmes","yâtes","yèrent"],
                "c": ["ierais","ierais","ierait","ierions","ieriez","ieraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": ["yasse","yasses","yât","yassions","yassiez","yassent"],
                "ip": [null,"ie",null,"yons","yez",null],
                "pr": "yant",
                "pp": "yé",
                "b": "yer"
            }
        },
        "v5": {
            "ending": "yer",
            "t": {
                "p": ["ie","ies","ie","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["ierai","ieras","iera","ierons","ierez","ieront"],
                "ps": ["yai","yas","ya","yâmes","yâtes","yèrent"],
                "c": ["ierais","ierais","ierait","ierions","ieriez","ieraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": ["yasse","yasses","yât","yassions","yassiez","yassent"],
                "ip": [null,"ie",null,"yons","yez",null],
                "pr": "yant",
                "pp": "yé",
                "b": "yer"
            }
        },
        "v6": {
            "ending": "yer",
            "t": {
                "p": ["ye","yes","ye","yons","yez","yent"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["yerai","yeras","yera","yerons","yerez","yeront"],
                "ps": ["yai","yas","ya","yâmes","yâtes","yèrent"],
                "c": ["yerais","yerais","yerait","yerions","yeriez","yeraient"],
                "s": ["ye","yes","ye","yions","yiez","yent"],
                "si": ["yasse","yasses","yât","yassions","yassiez","yassent"],
                "ip": [null,"ye",null,"yons","yez",null],
                "pr": "yant",
                "pp": "yé",
                "b": "yer"
            }
        },
        "v7": {
            "ending": "eler",
            "t": {
                "p": ["elle","elles","elle","elons","elez","ellent"],
                "i": ["elais","elais","elait","elions","eliez","elaient"],
                "f": ["ellerai","elleras","ellera","ellerons","ellerez","elleront"],
                "ps": ["elai","elas","ela","elâmes","elâtes","elèrent"],
                "c": ["ellerais","ellerais","ellerait","ellerions","elleriez","elleraient"],
                "s": ["elle","elles","elle","elions","eliez","ellent"],
                "si": ["elasse","elasses","elât","elassions","elassiez","elassent"],
                "ip": [null,"elle",null,"elons","elez",null],
                "pr": "elant",
                "pp": "elé",
                "b": "eler"
            }
        },
        "v8": {
            "ending": "eler",
            "t": {
                "p": ["èle","èles","èle","elons","elez","èlent"],
                "i": ["elais","elais","elait","elions","eliez","elaient"],
                "f": ["èlerai","èleras","èlera","èlerons","èlerez","èleront"],
                "ps": ["elai","elas","ela","elâmes","elâtes","elèrent"],
                "c": ["èlerais","èlerais","èlerait","èlerions","èleriez","èleraient"],
                "s": ["èle","èles","èle","elions","eliez","èlent"],
                "si": ["elasse","elasses","elât","elassions","elassiez","elassent"],
                "ip": [null,"èle",null,"elons","elez",null],
                "pr": "elant",
                "pp": "elé",
                "b": "eler"
            }
        },
        "v9": {
            "ending": "eler",
            "t": {
                "p": ["elle","elles","elle","elons","elez","ellent"],
                "i": ["elais","elais","elait","elions","eliez","elaient"],
                "f": ["ellerai","elleras","ellera","ellerons","ellerez","elleront"],
                "ps": ["elai","elas","ela","elâmes","elâtes","elèrent"],
                "c": ["ellerais","ellerais","ellerait","ellerions","elleriez","elleraient"],
                "s": ["elle","elles","elle","elions","eliez","ellent"],
                "si": ["elasse","elasses","elât","elassions","elassiez","elassent"],
                "ip": [null,"elle",null,"elons","elez",null],
                "pr": "elant",
                "pp": "elé",
                "b": "eler"
            }
        },
        "v10": {
            "ending": "eter",
            "t": {
                "p": ["ette","ettes","ette","etons","etez","ettent"],
                "i": ["etais","etais","etait","etions","etiez","etaient"],
                "f": ["etterai","etteras","ettera","etterons","etterez","etteront"],
                "ps": ["etai","etas","eta","etâmes","etâtes","etèrent"],
                "c": ["etterais","etterais","etterait","etterions","etteriez","etteraient"],
                "s": ["ette","ettes","ette","etions","etiez","ettent"],
                "si": ["etasse","etasses","etât","etassions","etassiez","etassent"],
                "ip": [null,"ette",null,"etons","etez",null],
                "pr": "etant",
                "pp": "eté",
                "b": "eter"
            }
        },
        "v11": {
            "ending": "eter",
            "t": {
                "p": ["ète","ètes","ète","etons","etez","ètent"],
                "i": ["etais","etais","etait","etions","etiez","etaient"],
                "f": ["èterai","èteras","ètera","èterons","èterez","èteront"],
                "ps": ["etai","etas","eta","etâmes","etâtes","etèrent"],
                "c": ["èterais","èterais","èterait","èterions","èteriez","èteraient"],
                "s": ["ète","ètes","ète","etions","etiez","ètent"],
                "si": ["etasse","etasses","etât","etassions","etassiez","etassent"],
                "ip": [null,"ète",null,"etons","etez",null],
                "pr": "etant",
                "pp": "eté",
                "b": "eter"
            }
        },
        "v12": {
            "ending": "éter",
            "t": {
                "p": ["ète","ètes","ète","étons","étez","ètent"],
                "i": ["étais","étais","était","étions","étiez","étaient"],
                "f": ["èterai","èteras","ètera","èterons","èterez","èteront"],
                "ps": ["étai","étas","éta","étâmes","étâtes","étèrent"],
                "c": ["èterais","èterais","èterait","èterions","èteriez","èteraient"],
                "s": ["ète","ètes","ète","étions","étiez","ètent"],
                "si": ["étasse","étasses","étât","étassions","étassiez","étassent"],
                "ip": [null,"ète",null,"étons","étez",null],
                "pr": "étant",
                "pp": "été",
                "b": "éter"
            }
        },
        "v13": {
            "ending": "emer",
            "t": {
                "p": ["ème","èmes","ème","emons","emez","èment"],
                "i": ["emais","emais","emait","emions","emiez","emaient"],
                "f": ["èmerai","èmeras","èmera","èmerons","èmerez","èmeront"],
                "ps": ["emai","emas","ema","emâmes","emâtes","emèrent"],
                "c": ["èmerais","èmerais","èmerait","èmerions","èmeriez","èmeraient"],
                "s": ["ème","èmes","ème","emions","emiez","èment"],
                "si": ["emasse","emasses","emât","emassions","emassiez","emassent"],
                "ip": [null,"ème",null,"emons","emez",null],
                "pr": "emant",
                "pp": "emé",
                "b": "emer"
            }
        },
        "v14": {
            "ending": "éguer",
            "t": {
                "p": ["ègue","ègues","ègue","éguons","éguez","èguent"],
                "i": ["éguais","éguais","éguait","éguions","éguiez","éguaient"],
                "f": ["èguerai","ègueras","èguera","èguerons","èguerez","ègueront"],
                "ps": ["éguai","éguas","égua","éguâmes","éguâtes","éguèrent"],
                "c": ["èguerais","èguerais","èguerait","èguerions","ègueriez","ègueraient"],
                "s": ["ègue","ègues","ègue","éguions","éguiez","èguent"],
                "si": ["éguasse","éguasses","éguât","éguassions","éguassiez","éguassent"],
                "ip": [null,"ègue",null,"éguons","éguez",null],
                "pr": "éguant",
                "pp": "égué",
                "b": "éguer"
            }
        },
        "v15": {
            "ending": "équer",
            "t": {
                "p": ["èque","èques","èque","équons","équez","èquent"],
                "i": ["équais","équais","équait","équions","équiez","équaient"],
                "f": ["èquerai","èqueras","èquera","èquerons","èquerez","èqueront"],
                "ps": ["équai","équas","équa","équâmes","équâtes","équèrent"],
                "c": ["èquerais","èquerais","èquerait","èquerions","èqueriez","èqueraient"],
                "s": ["èque","èques","èque","équions","équiez","èquent"],
                "si": ["équasse","équasses","équât","équassions","équassiez","équassent"],
                "ip": [null,"èque",null,"équons","équez",null],
                "pr": "équant",
                "pp": "équé",
                "b": "équer"
            }
        },
        "v16": {
            "ending": "éler",
            "t": {
                "p": ["èle","èles","èle","élons","élez","èlent"],
                "i": ["élais","élais","élait","élions","éliez","élaient"],
                "f": ["élerai","éleras","élera","élerons","élerez","éleront"],
                "ps": ["élai","élas","éla","élâmes","élâtes","élèrent"],
                "c": ["élerais","élerais","élerait","élerions","éleriez","éleraient"],
                "s": ["èle","èles","èle","élions","éliez","èlent"],
                "si": ["élasse","élasses","élât","élassions","élassiez","élassent"],
                "ip": [null,"èle",null,"élons","élez",null],
                "pr": "élant",
                "pp": "élé",
                "b": "éler"
            }
        },
        "v17": {
            "ending": "étrer",
            "t": {
                "p": ["ètre","ètres","ètre","étrons","étrez","ètrent"],
                "i": ["étrais","étrais","étrait","étrions","étriez","étraient"],
                "f": ["étrerai","étreras","étrera","étrerons","étrerez","étreront"],
                "ps": ["étrai","étras","étra","étrâmes","étrâtes","étrèrent"],
                "c": ["étrerais","étrerais","étrerait","étrerions","étreriez","étreraient"],
                "s": ["ètre","ètres","ètre","étrions","étriez","ètrent"],
                "si": ["étrasse","étrasses","étrât","étrassions","étrassiez","étrassent"],
                "ip": [null,"ètre",null,"étrons","étrez",null],
                "pr": "étrant",
                "pp": "étré",
                "b": "étrer"
            }
        },
        "v18": {
            "ending": "égler",
            "t": {
                "p": ["ègle","ègles","ègle","églons","églez","èglent"],
                "i": ["églais","églais","églait","églions","égliez","églaient"],
                "f": ["églerai","égleras","églera","églerons","églerez","égleront"],
                "ps": ["églai","églas","égla","églâmes","églâtes","églèrent"],
                "c": ["églerais","églerais","églerait","églerions","égleriez","égleraient"],
                "s": ["ègle","ègles","ègle","églions","égliez","èglent"],
                "si": ["églasse","églasses","églât","églassions","églassiez","églassent"],
                "ip": [null,"ègle",null,"églons","églez",null],
                "pr": "églant",
                "pp": "églé",
                "b": "égler"
            }
        },
        "v19": {
            "ending": "égner",
            "t": {
                "p": ["ègne","ègnes","ègne","égnons","égnez","ègnent"],
                "i": ["égnais","égnais","égnait","égnions","égniez","égnaient"],
                "f": ["égnerai","égneras","égnera","égnerons","égnerez","égneront"],
                "ps": ["égnai","égnas","égna","égnâmes","égnâtes","égnèrent"],
                "c": ["égnerais","égnerais","égnerait","égnerions","égneriez","égneraient"],
                "s": ["ègne","ègnes","ègne","égnions","égniez","ègnent"],
                "si": ["égnasse","égnasses","égnât","égnassions","égnassiez","égnassent"],
                "ip": [null,"ègne",null,"égnons","égnez",null],
                "pr": "égnant",
                "pp": "égné",
                "b": "égner"
            }
        },
        "v20": {
            "ending": "ébrer",
            "t": {
                "p": ["èbre","èbres","èbre","ébrons","ébrez","èbrent"],
                "i": ["ébrais","ébrais","ébrait","ébrions","ébriez","ébraient"],
                "f": ["ébrerai","ébreras","ébrera","ébrerons","ébrerez","ébreront"],
                "ps": ["ébrai","ébras","ébra","ébrâmes","ébrâtes","ébrèrent"],
                "c": ["ébrerais","ébrerais","ébrerait","ébrerions","ébreriez","ébreraient"],
                "s": ["èbre","èbres","èbre","ébrions","ébriez","èbrent"],
                "si": ["ébrasse","ébrasses","ébrât","ébrassions","ébrassiez","ébrassent"],
                "ip": [null,"èbre",null,"ébrons","ébrez",null],
                "pr": "ébrant",
                "pp": "ébré",
                "b": "ébrer"
            }
        },
        "v21": {
            "ending": "égrer",
            "t": {
                "p": ["ègre","ègres","ègre","égrons","égrez","ègrent"],
                "i": ["égrais","égrais","égrait","égrions","égriez","égraient"],
                "f": ["égrerai","égreras","égrera","égrerons","égrerez","égreront"],
                "ps": ["égrai","égras","égra","égrâmes","égrâtes","égrèrent"],
                "c": ["égrerais","égrerais","égrerait","égrerions","égreriez","égreraient"],
                "s": ["ègre","ègres","ègre","égrions","égriez","ègrent"],
                "si": ["égrasse","égrasses","égrât","égrassions","égrassiez","égrassent"],
                "ip": [null,"ègre",null,"égrons","égrez",null],
                "pr": "égrant",
                "pp": "égré",
                "b": "égrer"
            }
        },
        "v22": {
            "ending": "éter",
            "t": {
                "p": ["ète","ètes","ète","étons","étez","ètent"],
                "i": ["étais","étais","était","étions","étiez","étaient"],
                "f": ["éterai","éteras","étera","éterons","éterez","éteront"],
                "ps": ["étai","étas","éta","étâmes","étâtes","étèrent"],
                "c": ["éterais","éterais","éterait","éterions","éteriez","éteraient"],
                "s": ["ète","ètes","ète","étions","étiez","ètent"],
                "si": ["étasse","étasses","étât","étassions","étassiez","étassent"],
                "ip": [null,"ète",null,"étons","étez",null],
                "pr": "étant",
                "pp": "été",
                "b": "éter"
            }
        },
        "v23": {
            "ending": "éner",
            "t": {
                "p": ["ène","ènes","ène","énons","énez","ènent"],
                "i": ["énais","énais","énait","énions","éniez","énaient"],
                "f": ["énerai","éneras","énera","énerons","énerez","éneront"],
                "ps": ["énai","énas","éna","énâmes","énâtes","énèrent"],
                "c": ["énerais","énerais","énerait","énerions","éneriez","éneraient"],
                "s": ["ène","ènes","ène","énions","éniez","ènent"],
                "si": ["énasse","énasses","énât","énassions","énassiez","énassent"],
                "ip": [null,"ène",null,"énons","énez",null],
                "pr": "énant",
                "pp": "éné",
                "b": "éner"
            }
        },
        "v24": {
            "ending": "ener",
            "t": {
                "p": ["ène","ènes","ène","enons","enez","ènent"],
                "i": ["enais","enais","enait","enions","eniez","enaient"],
                "f": ["ènerai","èneras","ènera","ènerons","ènerez","èneront"],
                "ps": ["enai","enas","ena","enâmes","enâtes","enèrent"],
                "c": ["ènerais","ènerais","ènerait","ènerions","èneriez","èneraient"],
                "s": ["ène","ènes","ène","enions","eniez","ènent"],
                "si": ["enasse","enasses","enât","enassions","enassiez","enassent"],
                "ip": [null,"ène",null,"enons","enez",null],
                "pr": "enant",
                "pp": "ené",
                "b": "ener"
            }
        },
        "v25": {
            "ending": "ever",
            "t": {
                "p": ["ève","èves","ève","evons","evez","èvent"],
                "i": ["evais","evais","evait","evions","eviez","evaient"],
                "f": ["èverai","èveras","èvera","èverons","èverez","èveront"],
                "ps": ["evai","evas","eva","evâmes","evâtes","evèrent"],
                "c": ["èverais","èverais","èverait","èverions","èveriez","èveraient"],
                "s": ["ève","èves","ève","evions","eviez","èvent"],
                "si": ["evasse","evasses","evât","evassions","evassiez","evassent"],
                "ip": [null,"ève",null,"evons","evez",null],
                "pr": "evant",
                "pp": "evé",
                "b": "ever"
            }
        },
        "v26": {
            "ending": "eser",
            "t": {
                "p": ["èse","èses","èse","esons","esez","èsent"],
                "i": ["esais","esais","esait","esions","esiez","esaient"],
                "f": ["èserai","èseras","èsera","èserons","èserez","èseront"],
                "ps": ["esai","esas","esa","esâmes","esâtes","esèrent"],
                "c": ["èserais","èserais","èserait","èserions","èseriez","èseraient"],
                "s": ["èse","èses","èse","esions","esiez","èsent"],
                "si": ["esasse","esasses","esât","esassions","esassiez","esassent"],
                "ip": [null,"èse",null,"esons","esez",null],
                "pr": "esant",
                "pp": "esé",
                "b": "eser"
            }
        },
        "v27": {
            "ending": "écher",
            "t": {
                "p": ["èche","èches","èche","échons","échez","èchent"],
                "i": ["échais","échais","échait","échions","échiez","échaient"],
                "f": ["écherai","écheras","échera","écherons","écherez","écheront"],
                "ps": ["échai","échas","écha","échâmes","échâtes","échèrent"],
                "c": ["écherais","écherais","écherait","écherions","écheriez","écheraient"],
                "s": ["èche","èches","èche","échions","échiez","èchent"],
                "si": ["échasse","échasses","échât","échassions","échassiez","échassent"],
                "ip": [null,"èche",null,"échons","échez",null],
                "pr": "échant",
                "pp": "éché",
                "b": "écher"
            }
        },
        "v28": {
            "ending": "érer",
            "t": {
                "p": ["ère","ères","ère","érons","érez","èrent"],
                "i": ["érais","érais","érait","érions","ériez","éraient"],
                "f": ["érerai","éreras","érera","érerons","érerez","éreront"],
                "ps": ["érai","éras","éra","érâmes","érâtes","érèrent"],
                "c": ["érerais","érerais","érerait","érerions","éreriez","éreraient"],
                "s": ["ère","ères","ère","érions","ériez","èrent"],
                "si": ["érasse","érasses","érât","érassions","érassiez","érassent"],
                "ip": [null,"ère",null,"érons","érez",null],
                "pr": "érant",
                "pp": "éré",
                "b": "érer"
            }
        },
        "v29": {
            "ending": "evrer",
            "t": {
                "p": ["èvre","èvres","èvre","evrons","evrez","èvrent"],
                "i": ["evrais","evrais","evrait","evrions","evriez","evraient"],
                "f": ["èvrerai","èvreras","èvrera","èvrerons","èvrerez","èvreront"],
                "ps": ["evrai","evras","evra","evrâmes","evrâtes","evrèrent"],
                "c": ["èvrerais","èvrerais","èvrerait","èvrerions","èvreriez","èvreraient"],
                "s": ["èvre","èvres","èvre","evrions","evriez","èvrent"],
                "si": ["evrasse","evrasses","evrât","evrassions","evrassiez","evrassent"],
                "ip": [null,"èvre",null,"evrons","evrez",null],
                "pr": "evrant",
                "pp": "evré",
                "b": "evrer"
            }
        },
        "v30": {
            "ending": "éder",
            "t": {
                "p": ["ède","èdes","ède","édons","édez","èdent"],
                "i": ["édais","édais","édait","édions","édiez","édaient"],
                "f": ["éderai","éderas","édera","éderons","éderez","éderont"],
                "ps": ["édai","édas","éda","édâmes","édâtes","édèrent"],
                "c": ["éderais","éderais","éderait","éderions","éderiez","éderaient"],
                "s": ["ède","èdes","ède","édions","édiez","èdent"],
                "si": ["édasse","édasses","édât","édassions","édassiez","édassent"],
                "ip": [null,"ède",null,"édons","édez",null],
                "pr": "édant",
                "pp": "édé",
                "b": "éder"
            }
        },
        "v31": {
            "ending": "éper",
            "t": {
                "p": ["èpe","èpes","èpe","épons","épez","èpent"],
                "i": ["épais","épais","épait","épions","épiez","épaient"],
                "f": ["éperai","éperas","épera","éperons","éperez","éperont"],
                "ps": ["épai","épas","épa","épâmes","épâtes","épèrent"],
                "c": ["éperais","éperais","éperait","éperions","éperiez","éperaient"],
                "s": ["èpe","èpes","èpe","éprions","épiez","èpent"],
                "si": ["épasse","épasses","épât","épassions","épassiez","épassent"],
                "ip": [null,"èpe",null,"épons","épez",null],
                "pr": "épant",
                "pp": "épé",
                "b": "éper"
            }
        },
        "v32": {
            "ending": "eper",
            "t": {
                "p": ["èpe","èpes","èpe","epons","epez","èpent"],
                "i": ["epais","epais","epait","epions","epiez","epaient"],
                "f": ["eperai","eperas","epera","eperons","eperez","eperont"],
                "ps": ["epai","epas","epa","epâmes","epâtes","epèrent"],
                "c": ["eperais","eperais","eperait","eperions","eperiez","eperaient"],
                "s": ["èpe","èpes","èpe","eprions","epiez","èpent"],
                "si": ["epasse","epasses","epât","epassions","epassiez","epassent"],
                "ip": [null,"èpe",null,"epons","epez",null],
                "pr": "epant",
                "pp": "epé",
                "b": "eper"
            }
        },
        "v33": {
            "ending": "éser",
            "t": {
                "p": ["èse","èses","èse","ésons","ésez","èsent"],
                "i": ["ésais","ésais","ésait","ésions","ésiez","ésaient"],
                "f": ["éserai","éseras","ésera","éserons","éserez","éseront"],
                "ps": ["ésai","ésas","ésa","ésâmes","ésâtes","ésèrent"],
                "c": ["éserais","éserais","éserait","éserions","éseriez","éseraient"],
                "s": ["èse","èses","èse","ésrions","ésiez","èsent"],
                "si": ["ésasse","ésasses","ésât","ésassions","ésassiez","ésassent"],
                "ip": [null,"èse",null,"ésons","ésez",null],
                "pr": "ésant",
                "pp": "ésé",
                "b": "éser"
            }
        },
        "v34": {
            "ending": "émer",
            "t": {
                "p": ["ème","èmes","ème","émons","émez","èment"],
                "i": ["émais","émais","émait","émions","émiez","émaient"],
                "f": ["émerai","émeras","émera","émerons","émerez","émeront"],
                "ps": ["émai","émas","éma","émâmes","émâtes","émèrent"],
                "c": ["émerais","émerais","émerait","émerions","émeriez","émeraient"],
                "s": ["ème","èmes","ème","émrions","émiez","èment"],
                "si": ["émasse","émasses","émât","émassions","émassiez","émassent"],
                "ip": [null,"ème",null,"émons","émez",null],
                "pr": "émant",
                "pp": "émé",
                "b": "émer"
            }
        },
        "v35": {
            "ending": "éger",
            "t": {
                "p": ["ège","èges","ège","égeons","égez","ègent"],
                "i": ["égeais","égeais","égeait","égions","égiez","égeaient"],
                "f": ["ègerai","ègeras","ègera","ègerons","ègerez","ègeront"],
                "ps": ["égeai","égeas","égea","égeâmes","égeâtes","égèrent"],
                "c": ["ègerais","ègerais","ègerait","ègerions","ègeriez","ègeraient"],
                "s": ["ège","èges","ège","égions","égiez","ègent"],
                "si": ["égeasse","égeasses","égeât","égeassions","égeassiez","égeassent"],
                "ip": [null,"ège",null,"égeons","égez",null],
                "pr": "égeant",
                "pp": "égé",
                "b": "éger"
            }
        },
        "v36": {
            "ending": "er",
            "t": {
                "p": ["e","es","e","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["erai","eras","era","erons","erez","eront"],
                "ps": ["ai","as","a","âmes","âtes","èrent"],
                "c": ["erais","erais","erait","erions","eriez","eraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["asse","asses","ât","assions","assiez","assent"],
                "ip": [null,"e",null,"ons","ez",null],
                "pr": "ant",
                "pp": "é",
                "b": "er"
            }
        },
        "v37": {
            "ending": "évrer",
            "t": {
                "p": ["èvre","èvres","èvre","évrons","évrez","èvrent"],
                "i": ["évrais","évrais","évrait","évrions","évriez","évraient"],
                "f": ["évrerai","évreras","évrera","évrerons","évrerez","évreront"],
                "ps": ["évrai","évras","évra","évrâmes","évrâtes","évrèrent"],
                "c": ["évrerais","évrerais","évrerait","évrerions","évreriez","évreraient"],
                "s": ["èvre","èvres","èvre","évrions","évriez","èvrent"],
                "si": ["évrasse","évrasses","évrât","évrassions","évrassiez","évrassent"],
                "ip": [null,"èvre",null,"évrons","évrez",null],
                "pr": "évrant",
                "pp": "évré",
                "b": "évrer"
            }
        },
        "v38": {
            "ending": "écrer",
            "t": {
                "p": ["ècre","ècres","ècre","écrons","écrez","ècrent"],
                "i": ["écrais","écrais","écrait","écrions","écriez","écraient"],
                "f": ["écrerai","écreras","écrera","écrerons","écrerez","écreront"],
                "ps": ["écrai","écras","écra","écrâmes","écrâtes","écrèrent"],
                "c": ["écrerais","écrerais","écrerait","écrerions","écreriez","écreraient"],
                "s": ["ècre","ècres","ècre","écrions","écriez","ècrent"],
                "si": ["écrasse","écrasses","écrât","écrassions","écrassiez","écrassent"],
                "ip": [null,"ècre",null,"écrons","écrez",null],
                "pr": "écrant",
                "pp": "écré",
                "b": "écrer"
            }
        },
        "v39": {
            "ending": "érir",
            "t": {
                "p": ["iers","iers","iert","érons","érez","ièrent"],
                "i": ["érais","érais","érait","érions","ériez","éraient"],
                "f": ["errai","erras","erra","errons","errez","erront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["errais","errais","errait","errions","erriez","erraient"],
                "s": ["ière","ières","ière","érions","ériez","ièrent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"iers",null,"érons","érez",null],
                "pr": "érant",
                "pp": "is",
                "b": "érir"
            }
        },
        "v40": {
            "ending": "érir",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "érir"
            }
        },
        "v41": {
            "ending": "ïr",
            "t": {
                "p": ["is","is","it","ïssons","ïssez","ïssent"],
                "i": ["ïssais","ïssais","ïssait","ïssions","ïssiez","ïssaient"],
                "f": ["ïrai","ïras","ïra","ïrons","ïrez","ïront"],
                "ps": ["ïs","ïs","ït","ïmes","ïtes","ïrent"],
                "c": ["ïrais","ïrais","ïrait","ïrions","ïriez","ïraient"],
                "s": ["ïsse","ïsses","ïsse","ïssions","ïssiez","ïssent"],
                "si": ["ïsse","ïsses","ït","ïssions","ïssiez","ïssent"],
                "ip": [null,"is",null,"ïssons","ïssez",null],
                "pr": "ïssant",
                "pp": "ï",
                "b": "ïr"
            }
        },
        "v42": {
            "ending": "ïr",
            "t": {
                "p": ["ïs","ïs","ït","ïssons","ïssez","ïssent"],
                "i": ["ïssais","ïssais","ïssait","ïssions","ïssiez","ïssaient"],
                "f": ["ïrai","ïras","ïra","ïrons","ïrez","ïront"],
                "ps": ["ïs","ïs","ït","ïmes","ïtes","ïrent"],
                "c": ["ïrais","ïrais","ïrait","ïrions","ïriez","ïraient"],
                "s": ["ïsse","ïsses","ïsse","ïssions","ïssiez","ïssent"],
                "si": ["ïsse","ïsses","ït","ïssions","ïssiez","ïssent"],
                "ip": [null,"ïs",null,"ïssons","ïssez",null],
                "pr": "ïssant",
                "pp": "ï",
                "b": "ïr"
            }
        },
        "v43": {
            "ending": "eurir",
            "t": {
                "p": ["euris","euris","eurit","eurissons","eurissez","eurissent"],
                "i": ["eurissais","eurissais","eurissait","eurissions","eurissiez","eurissaient"],
                "f": ["eurirai","euriras","eurira","eurirons","eurirez","euriront"],
                "ps": ["euris","euris","eurit","eurîmes","eurîtes","eurirent"],
                "c": ["eurirais","eurirais","eurirait","euririons","euririez","euriraient"],
                "s": ["eurisse","eurisses","eurisse","eurissions","eurissiez","eurissent"],
                "si": ["eurisse","eurisses","eurît","eurissions","eurissiez","eurissent"],
                "ip": [null,"euris",null,"eurissons","eurissez",null],
                "pr": "eurissant",
                "pp": "euri",
                "b": "eurir"
            }
        },
        "v44": {
            "ending": "rir",
            "t": {
                "p": ["re","res","re","rons","rez","rent"],
                "i": ["rais","rais","rait","rions","riez","raient"],
                "f": ["rirai","riras","rira","rirons","rirez","riront"],
                "ps": ["ris","ris","rit","rîmes","rîtes","rirent"],
                "c": ["rirais","rirais","rirait","ririons","ririez","riraient"],
                "s": ["re","res","re","rions","riez","rent"],
                "si": ["risse","risses","rît","rissions","rissiez","rissent"],
                "ip": [null,"re",null,"rons","rez",null],
                "pr": "rant",
                "pp": "ert",
                "b": "rir"
            }
        },
        "v45": {
            "ending": "mir",
            "t": {
                "p": ["s","s","t","mons","mez","ment"],
                "i": ["mais","mais","mait","mions","miez","maient"],
                "f": ["mirai","miras","mira","mirons","mirez","miront"],
                "ps": ["mis","mis","mit","mîmes","mîtes","mirent"],
                "c": ["mirais","mirais","mirait","mirions","miriez","miraient"],
                "s": ["me","mes","me","mions","miez","ment"],
                "si": ["misse","misses","mît","missions","missiez","missent"],
                "ip": [null,"s",null,"mons","mez",null],
                "pr": "mant",
                "pp": "mi",
                "b": "mir"
            }
        },
        "v46": {
            "ending": "tir",
            "t": {
                "p": ["s","s","t","tons","tez","tent"],
                "i": ["tais","tais","tait","tions","tiez","taient"],
                "f": ["tirai","tiras","tira","tirons","tirez","tiront"],
                "ps": ["tis","tis","tit","tîmes","tîtes","tirent"],
                "c": ["tirais","tirais","tirait","tirions","tiriez","tiraient"],
                "s": ["te","tes","te","tions","tiez","tent"],
                "si": ["tisse","tisses","tît","tissions","tissiez","tissent"],
                "ip": [null,"s",null,"tons","tez",null],
                "pr": "tant",
                "pp": "ti",
                "b": "tir"
            }
        },
        "v47": {
            "ending": "vir",
            "t": {
                "p": ["s","s","t","vons","vez","vent"],
                "i": ["vais","vais","vait","vions","viez","vaient"],
                "f": ["virai","viras","vira","virons","virez","viront"],
                "ps": ["vis","vis","vit","vîmes","vîtes","virent"],
                "c": ["virais","virais","virait","virions","viriez","viraient"],
                "s": ["ve","ves","ve","vions","viez","vent"],
                "si": ["visse","visses","vît","vissions","vissiez","vissent"],
                "ip": [null,"s",null,"vons","vez",null],
                "pr": "vant",
                "pp": "vi",
                "b": "vir"
            }
        },
        "v48": {
            "ending": "illir",
            "t": {
                "p": ["s","s","t","illons","illez","illent"],
                "i": ["illais","illais","illait","illions","illiez","illaient"],
                "f": ["illirai","illiras","illira","illirons","illirez","illiront"],
                "ps": ["illis","illis","illit","illîmes","illîtes","illirent"],
                "c": ["illirais","illirais","illirait","illirions","illiriez","illiraient"],
                "s": ["ille","illes","ille","illions","illiez","illent"],
                "si": ["illisse","illisses","illît","illissions","illissiez","illissent"],
                "ip": [null,"s",null,"illons","illez",null],
                "pr": "illant",
                "pp": "illi",
                "b": "illir"
            }
        },
        "v49": {
            "ending": "ir",
            "t": {
                "p": ["e","es","e","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"e",null,"ons","ez",null],
                "pr": "ant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v50": {
            "ending": "ir",
            "t": {
                "p": ["is","is","it","issons","issez","issent"],
                "i": ["issais","issais","issait","issions","issiez","issaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["isse","isses","isse","issions","issiez","issent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"issons","issez",null],
                "pr": "issant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v51": {
            "ending": "ir",
            "t": {
                "p": ["e","es","e","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["erai","eras","era","erons","erez","eront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["erais","erais","erait","erions","eriez","eraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"e",null,"ons","ez",null],
                "pr": "ant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v52": {
            "ending": "enir",
            "t": {
                "p": ["iens","iens","ient","enons","enez","iennent"],
                "i": ["enais","enais","enait","enions","eniez","enaient"],
                "f": ["iendrai","iendras","iendra","iendrons","iendrez","iendront"],
                "ps": ["ins","ins","int","înmes","întes","inrent"],
                "c": ["iendrais","iendrais","iendrait","iendrions","iendriez","iendraient"],
                "s": ["ienne","iennes","ienne","enions","eniez","iennent"],
                "si": ["insse","insses","înt","inssions","inssiez","inssent"],
                "ip": [null,"iens",null,"enons","enez",null],
                "pr": "enant",
                "pp": "enu",
                "b": "enir"
            }
        },
        "v53": {
            "ending": "enir",
            "t": {
                "p": [null,null,"ient",null,null,null],
                "i": [null,null,"enait",null,null,null],
                "f": [null,null,"iendra",null,null,null],
                "ps": [null,null,"int",null,null,null],
                "c": [null,null,"iendrait",null,null,null],
                "s": [null,null,"ienne",null,null,null],
                "si": [null,null,"înt",null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "enant",
                "pp": "enu",
                "b": "enir"
            }
        },
        "v54": {
            "ending": "ir",
            "t": {
                "p": ["is","is","it","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"yons","yez",null],
                "pr": "yant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v55": {
            "ending": "ourir",
            "t": {
                "p": ["eurs","eurs","eurt","ourons","ourez","eurent"],
                "i": ["ourais","ourais","ourait","ourions","ouriez","ouraient"],
                "f": ["ourrai","ourras","ourra","ourrons","ourrez","ourront"],
                "ps": ["ourus","ourus","ourut","ourûmes","ourûtes","oururent"],
                "c": ["ourrais","ourrais","ourrait","ourrions","ourriez","ourraient"],
                "s": ["eure","eures","eure","ourions","ouriez","eurent"],
                "si": ["ourusse","ourusses","ourût","ourussions","ourussiez","ourussent"],
                "ip": [null,"eurs",null,"ourons","ourez",null],
                "pr": "ourant",
                "pp": "ort",
                "b": "ourir"
            }
        },
        "v56": {
            "ending": "ir",
            "t": {
                "p": ["s","s","","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"s",null,"ons","ez",null],
                "pr": "ant",
                "pp": "u",
                "b": "ir"
            }
        },
        "v57": {
            "ending": "ir",
            "t": {
                "p": ["s","s","t","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"s",null,"ons","ez",null],
                "pr": "ant",
                "pp": "u",
                "b": "ir"
            }
        },
        "v58": {
            "ending": "ir",
            "t": {
                "p": ["is","is","it","issons","issez","issent"],
                "i": ["issais","issais","issait","issions","issiez","issaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["isse","isses","isse","issions","issiez","issent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"issons","issez",null],
                "pr": "issant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v59": {
            "ending": "ir",
            "t": {
                "p": ["is","is","it","ons","ez","ent"],
                "i": ["ais","ais","ait","ions","iez","aient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["e","es","e","ions","iez","ent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"ons","ez",null],
                "pr": "ant",
                "pp": "i",
                "b": "ir"
            }
        },
        "v60": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","issons","issez","issent"],
                "i": ["issais","issais","issait","issions","issiez","issaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["isse","isses","isse","issions","issiez","issent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"issons","issez",null],
                "pr": "issant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v61": {
            "ending": "illir",
            "t": {
                "p": ["ux","ux","ut","illons","illez","illent"],
                "i": ["illais","illais","illait","illions","illiez","illaient"],
                "f": ["illirai","illiras","illira","illirons","illirez","illiront"],
                "ps": ["illis","illis","illit","illîmes","illîtes","illirent"],
                "c": ["illirais","illirais","illirait","illirions","illiriez","illiraient"],
                "s": ["illisse","illisses","illisse","illissions","illissiez","illissent"],
                "si": ["illisse","illisses","illît","illissions","illissiez","illissent"],
                "ip": [null,null,null,null,null,null],
                "pr": "illant",
                "pp": "illi",
                "b": "illir"
            }
        },
        "v62": {
            "ending": "ésir",
            "t": {
                "p": ["is","is","ît","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "isant",
                "pp": null,
                "b": "ésir"
            }
        },
        "v63": {
            "ending": "cevoir",
            "t": {
                "p": ["çois","çois","çoit","cevons","cevez","çoivent"],
                "i": ["cevais","cevais","cevait","cevions","ceviez","cevaient"],
                "f": ["cevrai","cevras","cevra","cevrons","cevrez","cevront"],
                "ps": ["çus","çus","çut","çûmes","çûtes","çurent"],
                "c": ["cevrais","cevrais","cevrait","cevrions","cevriez","cevraient"],
                "s": ["çoive","çoives","çoive","cevions","ceviez","çoivent"],
                "si": ["çusse","çusses","çût","çussions","çussiez","çussent"],
                "ip": [null,"çois",null,"cevons","cevez",null],
                "pr": "cevant",
                "pp": "çu",
                "b": "cevoir"
            }
        },
        "v64": {
            "ending": "evoir",
            "t": {
                "p": ["ois","ois","oit","evons","evez","oivent"],
                "i": ["evais","evais","evait","evions","eviez","evaient"],
                "f": ["evrai","evras","evra","evrons","evrez","evront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["evrais","evrais","evrait","evrions","evriez","evraient"],
                "s": ["oive","oives","oive","evions","eviez","oivent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ois",null,"evons","evez",null],
                "pr": "evant",
                "pp": "û",
                "b": "evoir"
            }
        },
        "v65": {
            "ending": "ouvoir",
            "t": {
                "p": ["eus","eus","eut","ouvons","ouvez","euvent"],
                "i": ["ouvais","ouvais","ouvait","ouvions","ouviez","ouvaient"],
                "f": ["ouvrai","ouvras","ouvra","ouvrons","ouvrez","ouvront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["ouvrais","ouvrais","ouvrait","ouvrions","ouvriez","ouvraient"],
                "s": ["euve","euves","euve","ouvions","ouviez","euvent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"eus",null,"ouvons","ouvez",null],
                "pr": "ouvant",
                "pp": "u",
                "b": "ouvoir"
            }
        },
        "v66": {
            "ending": "ouvoir",
            "t": {
                "p": ["eus","eus","eut","ouvons","ouvez","euvent"],
                "i": ["ouvais","ouvais","ouvait","ouvions","ouviez","ouvaient"],
                "f": ["ouvrai","ouvras","ouvra","ouvrons","ouvrez","ouvront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["ouvrais","ouvrais","ouvrait","ouvrions","ouvriez","ouvraient"],
                "s": ["euve","euves","euve","ouvions","ouviez","euvent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"eus",null,"ouvons","ouvez",null],
                "pr": "ouvant",
                "pp": "u",
                "b": "ouvoir"
            }
        },
        "v67": {
            "ending": "avoir",
            "t": {
                "p": ["ais","ais","ait","avons","avez","avent"],
                "i": ["avais","avais","avait","avions","aviez","avaient"],
                "f": ["aurai","auras","aura","aurons","aurez","auront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["aurais","aurais","aurait","aurions","auriez","auraient"],
                "s": ["ache","aches","ache","achions","achiez","achent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ache",null,"achons","achez",null],
                "pr": "achant",
                "pp": "u",
                "b": "avoir"
            }
        },
        "v68": {
            "ending": "ouloir",
            "t": {
                "p": ["eux","eux","eut","oulons","oulez","eulent"],
                "i": ["oulais","oulais","oulait","oulions","ouliez","oulaient"],
                "f": ["oudrai","oudras","oudra","oudrons","oudrez","oudront"],
                "ps": ["oulus","oulus","oulut","oulûmes","oulûtes","oulurent"],
                "c": ["oudrais","oudrais","oudrait","oudrions","oudriez","oudraient"],
                "s": ["euille","euilles","euille","oulions","ouliez","euillent"],
                "si": ["oulusse","oulusses","oulût","oulussions","oulussiez","oulussent"],
                "ip": [null,"euille",null,"oulons","euillez",null],
                "pr": "oulant",
                "pp": "oulu",
                "b": "ouloir"
            }
        },
        "v69": {
            "ending": "loir",
            "t": {
                "p": ["ux","ux","ut","lons","lez","lent"],
                "i": ["lais","lais","lait","lions","liez","laient"],
                "f": ["udrai","udras","udra","udrons","udrez","udront"],
                "ps": ["lus","lus","lut","lûmes","lûtes","lurent"],
                "c": ["udrais","udrais","udrait","udrions","udriez","udraient"],
                "s": ["ille","illes","ille","lions","liez","illent"],
                "si": ["lusse","lusses","lût","lussions","lussiez","lussent"],
                "ip": [null,"ux",null,"lons","lez",null],
                "pr": "lant",
                "pp": "lu",
                "b": "loir"
            }
        },
        "v70": {
            "ending": "loir",
            "t": {
                "p": ["ux","ux","ut","lons","lez","lent"],
                "i": ["lais","lais","lait","lions","liez","laient"],
                "f": ["udrai","udras","udra","udrons","udrez","udront"],
                "ps": ["lus","lus","lut","lûmes","lûtes","lurent"],
                "c": ["udrais","udrais","udrait","udrions","udriez","udraient"],
                "s": ["le","les","le","lions","liez","lent"],
                "si": ["lusse","lusses","lût","lussions","lussiez","lussent"],
                "ip": [null,"ux",null,"lons","lez",null],
                "pr": "lant",
                "pp": "lu",
                "b": "loir"
            }
        },
        "v71": {
            "ending": "ouvoir",
            "t": {
                "p": ["eux","eux","eut","ouvons","ouvez","euvent"],
                "i": ["ouvais","ouvais","ouvait","ouvions","ouviez","ouvaient"],
                "f": ["ourrai","ourras","ourra","ourrons","ourrez","ourront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["ourrais","ourrais","ourrait","ourrions","ourriez","ourraient"],
                "s": ["uisse","uisses","uisse","uissions","uissiez","uissent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,null,null,null,null,null],
                "pr": "ouvant",
                "pp": "u",
                "b": "ouvoir"
            }
        },
        "v72": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["errai","erras","erra","errons","errez","erront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["errais","errais","errait","errions","erriez","erraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "u",
                "b": "oir"
            }
        },
        "v73": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "u",
                "b": "oir"
            }
        },
        "v74": {
            "ending": "eoir",
            "t": {
                "p": ["ieds","ieds","ied","eyons","eyez","eyent"],
                "i": ["eyais","eyais","eyait","eyions","eyiez","eyaient"],
                "f": ["iérai","iéras","iéra","iérons","iérez","iéront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["iérais","iérais","iérait","iérions","iériez","iéraient"],
                "s": ["eye","eyes","eye","eyions","eyiez","eyent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ieds",null,"eyons","eyez",null],
                "pr": "eyant",
                "pp": "is",
                "b": "eoir"
            }
        },
        "v75": {
            "ending": "eoir",
            "t": {
                "p": ["ieds","ieds","ied","eyons","eyez","eyent"],
                "i": ["eyais","eyais","eyait","eyions","eyiez","eyaient"],
                "f": ["iérai","iéras","iéra","iérons","iérez","iéront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["iérais","iérais","iérait","iérions","iériez","iéraient"],
                "s": ["eye","eyes","eye","eyions","eyiez","eyent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ieds",null,"eyons","eyez",null],
                "pr": "eyant",
                "pp": "is",
                "b": "eoir"
            }
        },
        "v76": {
            "ending": "eoir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["eoirai","eoiras","eoira","eoirons","eoirez","eoiront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["eoirais","eoirais","eoirait","eoirions","eoiriez","eoiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "is",
                "b": "eoir"
            }
        },
        "v77": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "is",
                "b": "oir"
            }
        },
        "v78": {
            "ending": "eoir",
            "t": {
                "p": [null,null,"ied",null,null,"iéent"],
                "i": [null,null,"eyait",null,null,"eyaient"],
                "f": [null,null,"iéra",null,null,"iéront"],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,"iérait",null,null,"iéraient"],
                "s": [null,null,"iée",null,null,"iéent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "éant",
                "pp": "is",
                "b": "eoir"
            }
        },
        "v79": {
            "ending": "euvoir",
            "t": {
                "p": [null,null,"eut",null,null,"euvent"],
                "i": [null,null,"euvait",null,null,"euvaient"],
                "f": [null,null,"euvra",null,null,"euvront"],
                "ps": [null,null,"ut",null,null,null],
                "c": [null,null,"euvrait",null,null,"euvraient"],
                "s": [null,null,"euve",null,null,"euvent"],
                "si": [null,null,"ût",null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "euvant",
                "pp": "u",
                "b": "euvoir"
            }
        },
        "v80": {
            "ending": "lloir",
            "t": {
                "p": [null,null,"ut",null,null,null],
                "i": [null,null,"llait",null,null,null],
                "f": [null,null,"udra",null,null,null],
                "ps": [null,null,"llut",null,null,null],
                "c": [null,null,"udrait",null,null,null],
                "s": [null,null,"ille",null,null,null],
                "si": [null,null,"llût",null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": "llu",
                "b": "lloir"
            }
        },
        "v81": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": "u",
                "b": "oir"
            }
        },
        "v82": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "u",
                "b": "oir"
            }
        },
        "v83": {
            "ending": "oir",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": [null,null,null,null,null,null],
                "f": ["errai","erras","erra","errons","errez","erront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["errais","errais","errait","errions","erriez","erraient"],
                "s": [null,null,null,null,null,null],
                "si": [null,null,"ût",null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "oyant",
                "pp": "u",
                "b": "oir"
            }
        },
        "v84": {
            "ending": "oir",
            "t": {
                "p": [null,null,"oit",null,null,"oient"],
                "i": [null,null,"oyait",null,null,"oyaient"],
                "f": [null,null,"oira",null,null,"oiront"],
                "ps": [null,null,"ut",null,null,"urent"],
                "c": [null,null,"oirait",null,null,"oiraient"],
                "s": [null,null,"oie",null,null,"oient"],
                "si": [null,null,"ût",null,null,"ussent"],
                "ip": [null,null,null,null,null,null],
                "pr": "éant",
                "pp": "u",
                "b": "oir"
            }
        },
        "v85": {
            "ending": "dre",
            "t": {
                "p": ["ds","ds","d","dons","dez","dent"],
                "i": ["dais","dais","dait","dions","diez","daient"],
                "f": ["drai","dras","dra","drons","drez","dront"],
                "ps": ["dis","dis","dit","dîmes","dîtes","dirent"],
                "c": ["drais","drais","drait","drions","driez","draient"],
                "s": ["de","des","de","dions","diez","dent"],
                "si": ["disse","disses","dît","dissions","dissiez","dissent"],
                "ip": [null,"ds",null,"dons","dez",null],
                "pr": "dant",
                "pp": "du",
                "b": "dre"
            }
        },
        "v86": {
            "ending": "cre",
            "t": {
                "p": ["cs","cs","c","quons","quez","quent"],
                "i": ["quais","quais","quait","quions","quiez","quaient"],
                "f": ["crai","cras","cra","crons","crez","cront"],
                "ps": ["quis","quis","quit","quîmes","quîtes","quirent"],
                "c": ["crais","crais","crait","crions","criez","craient"],
                "s": ["que","ques","que","quions","quiez","quent"],
                "si": ["quisse","quisses","quît","quissions","quissiez","quissent"],
                "ip": [null,"cs",null,"quons","quez",null],
                "pr": "quant",
                "pp": "cu",
                "b": "cre"
            }
        },
        "v87": {
            "ending": "tre",
            "t": {
                "p": ["s","s","","tons","tez","tent"],
                "i": ["tais","tais","tait","tions","tiez","taient"],
                "f": ["trai","tras","tra","trons","trez","tront"],
                "ps": ["tis","tis","tit","tîmes","tîtes","tirent"],
                "c": ["trais","trais","trait","trions","triez","traient"],
                "s": ["te","tes","te","tions","tiez","tent"],
                "si": ["tisse","tisses","tît","tissions","tissiez","tissent"],
                "ip": [null,"s",null,"tons","tez",null],
                "pr": "tant",
                "pp": "tu",
                "b": "tre"
            }
        },
        "v88": {
            "ending": "tre",
            "t": {
                "p": ["s","s","t","tons","tez","tent"],
                "i": ["tais","tais","tait","tions","tiez","taient"],
                "f": ["trai","tras","tra","trons","trez","tront"],
                "ps": [null,null,null,null,null,null],
                "c": ["trais","trais","trait","trions","triez","traient"],
                "s": ["te","tes","te","tions","tiez","tent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"s",null,"tons","tez",null],
                "pr": "tant",
                "pp": "tu",
                "b": "tre"
            }
        },
        "v89": {
            "ending": "ettre",
            "t": {
                "p": ["ets","ets","et","ettons","ettez","ettent"],
                "i": ["ettais","ettais","ettait","ettions","ettiez","ettaient"],
                "f": ["ettrai","ettras","ettra","ettrons","ettrez","ettront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["ettrais","ettrais","ettrait","ettrions","ettriez","ettraient"],
                "s": ["ette","ettes","ette","ettions","ettiez","ettent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ets",null,"ettons","ettez",null],
                "pr": "ettant",
                "pp": "is",
                "b": "ettre"
            }
        },
        "v90": {
            "ending": "endre",
            "t": {
                "p": ["ends","ends","end","enons","enez","ennent"],
                "i": ["enais","enais","enait","enions","eniez","enaient"],
                "f": ["endrai","endras","endra","endrons","endrez","endront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["endrais","endrais","endrait","endrions","endriez","endraient"],
                "s": ["enne","ennes","enne","enions","eniez","ennent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ends",null,"enons","enez",null],
                "pr": "enant",
                "pp": "is",
                "b": "endre"
            }
        },
        "v91": {
            "ending": "pre",
            "t": {
                "p": ["ps","ps","pt","pons","pez","pent"],
                "i": ["pais","pais","pait","pions","piez","paient"],
                "f": ["prai","pras","pra","prons","prez","pront"],
                "ps": ["pis","pis","pit","pîmes","pîtes","pirent"],
                "c": ["prais","prais","prait","prions","priez","praient"],
                "s": ["pe","pes","pe","pions","piez","pent"],
                "si": ["pisse","pisses","pît","pissions","pissiez","pissent"],
                "ip": [null,"ps",null,"pons","pez",null],
                "pr": "pant",
                "pp": "pu",
                "b": "pre"
            }
        },
        "v92": {
            "ending": "dre",
            "t": {
                "p": ["ds","ds","d","lons","lez","lent"],
                "i": ["lais","lais","lait","lions","liez","laient"],
                "f": ["drai","dras","dra","drons","drez","dront"],
                "ps": ["lus","lus","lut","lûmes","lûtes","lurent"],
                "c": ["drais","drais","drait","drions","driez","draient"],
                "s": ["le","les","le","lions","liez","lent"],
                "si": ["lusse","lusses","lût","lussions","lussiez","lussent"],
                "ip": [null,"ds",null,"lons","lez",null],
                "pr": "lant",
                "pp": "lu",
                "b": "dre"
            }
        },
        "v93": {
            "ending": "dre",
            "t": {
                "p": ["ds","ds","d","sons","sez","sent"],
                "i": ["sais","sais","sait","sions","siez","saient"],
                "f": ["drai","dras","dra","drons","drez","dront"],
                "ps": ["sis","sis","sit","sîmes","sîtes","sirent"],
                "c": ["drais","drais","drait","drions","driez","draient"],
                "s": ["se","ses","se","sions","siez","sent"],
                "si": ["sisse","sisses","sît","sissions","sissiez","sissent"],
                "ip": [null,"ds",null,"sons","sez",null],
                "pr": "sant",
                "pp": "su",
                "b": "dre"
            }
        },
        "v94": {
            "ending": "udre",
            "t": {
                "p": ["us","us","ut","lvons","lvez","lvent"],
                "i": ["lvais","lvais","lvait","lvions","lviez","lvaient"],
                "f": ["udrai","udras","udra","udrons","udrez","udront"],
                "ps": ["lus","lus","lut","lûmes","lûtes","lurent"],
                "c": ["udrais","udrais","udrait","udrions","udriez","udraient"],
                "s": ["lve","lves","lve","lvions","lviez","lvent"],
                "si": ["lusse","lusses","lût","lussions","lussiez","lussent"],
                "ip": [null,"us",null,"lvons","lvez",null],
                "pr": "lvant",
                "pp": "lu",
                "b": "udre"
            }
        },
        "v95": {
            "ending": "udre",
            "t": {
                "p": ["us","us","ut","lvons","lvez","lvent"],
                "i": ["lvais","lvais","lvait","lvions","lviez","lvaient"],
                "f": ["udrai","udras","udra","udrons","udrez","udront"],
                "ps": [null,null,null,null,null,null],
                "c": ["udrais","udrais","udrait","udrions","udriez","udraient"],
                "s": ["lve","lves","lve","lvions","lviez","lvent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"us",null,"lvons","lvez",null],
                "pr": "lvant",
                "pp": "us",
                "b": "udre"
            }
        },
        "v96": {
            "ending": "udre",
            "t": {
                "p": ["us","us","ut","lvons","lvez","lvent"],
                "i": ["lvais","lvais","lvait","lvions","lviez","lvaient"],
                "f": ["udrai","udras","udra","udrons","udrez","udront"],
                "ps": [null,null,null,null,null,null],
                "c": ["udrais","udrais","udrait","udrions","udriez","udraient"],
                "s": ["lve","lves","lve","lvions","lviez","lvent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"us",null,"lvons","lvez",null],
                "pr": "lvant",
                "pp": "us",
                "b": "udre"
            }
        },
        "v97": {
            "ending": "ndre",
            "t": {
                "p": ["ns","ns","nt","gnons","gnez","gnent"],
                "i": ["gnais","gnais","gnait","gnions","gniez","gnaient"],
                "f": ["ndrai","ndras","ndra","ndrons","ndrez","ndront"],
                "ps": ["gnis","gnis","gnit","gnîmes","gnîtes","gnirent"],
                "c": ["ndrais","ndrais","ndrait","ndrions","ndriez","ndraient"],
                "s": ["gne","gnes","gne","gnions","gniez","gnent"],
                "si": ["gnisse","gnisses","gnît","gnissions","gnissiez","gnissent"],
                "ip": [null,"ns",null,"gnons","gnez",null],
                "pr": "gnant",
                "pp": "nt",
                "b": "ndre"
            }
        },
        "v98": {
            "ending": "ndre",
            "t": {
                "p": ["ns","ns","nt","gnons","gnez","gnent"],
                "i": ["gnais","gnais","gnait","gnions","gniez","gnaient"],
                "f": ["ndrai","ndras","ndra","ndrons","ndrez","ndront"],
                "ps": ["gnis","gnis","gnit","gnîmes","gnîtes","gnirent"],
                "c": ["ndrais","ndrais","ndrait","ndrions","ndriez","ndraient"],
                "s": ["gne","gnes","gne","gnions","gniez","gnent"],
                "si": ["gnisse","gnisses","gnît","gnissions","gnissiez","gnissent"],
                "ip": [null,null,null,null,null,null],
                "pr": "gnant",
                "pp": null,
                "b": "ndre"
            }
        },
        "v99": {
            "ending": "vre",
            "t": {
                "p": ["s","s","t","vons","vez","vent"],
                "i": ["vais","vais","vait","vions","viez","vaient"],
                "f": ["vrai","vras","vra","vrons","vrez","vront"],
                "ps": ["vis","vis","vit","vîmes","vîtes","virent"],
                "c": ["vrais","vrais","vrait","vrions","vriez","vraient"],
                "s": ["ve","ves","ve","vions","viez","vent"],
                "si": ["visse","visses","vît","vissions","vissiez","vissent"],
                "ip": [null,"s",null,"vons","vez",null],
                "pr": "vant",
                "pp": "vi",
                "b": "vre"
            }
        },
        "v100": {
            "ending": "ivre",
            "t": {
                "p": ["is","is","it","ivons","ivez","ivent"],
                "i": ["ivais","ivais","ivait","ivions","iviez","ivaient"],
                "f": ["ivrai","ivras","ivra","ivrons","ivrez","ivront"],
                "ps": ["écus","écus","écut","écûmes","écûtes","écurent"],
                "c": ["ivrais","ivrais","ivrait","ivrions","ivriez","ivraient"],
                "s": ["ive","ives","ive","ivions","iviez","ivent"],
                "si": ["écusse","écusses","écût","écussions","écussiez","écussent"],
                "ip": [null,"is",null,"ivons","ivez",null],
                "pr": "ivant",
                "pp": "écu",
                "b": "ivre"
            }
        },
        "v101": {
            "ending": "aître",
            "t": {
                "p": ["ais","ais","aît","aissons","aissez","aissent"],
                "i": ["aissais","aissais","aissait","aissions","aissiez","aissaient"],
                "f": ["aîtrai","aîtras","aîtra","aîtrons","aîtrez","aîtront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["aîtrais","aîtrais","aîtrait","aîtrions","aîtriez","aîtraient"],
                "s": ["aisse","aisses","aisse","aissions","aissiez","aissent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ais",null,"aissons","aissez",null],
                "pr": "aissant",
                "pp": "u",
                "b": "aître"
            }
        },
        "v102": {
            "ending": "aître",
            "t": {
                "p": ["ais","ais","aît","aissons","aissez","aissent"],
                "i": ["aissais","aissais","aissait","aissions","aissiez","aissaient"],
                "f": ["aîtrai","aîtras","aîtra","aîtrons","aîtrez","aîtront"],
                "ps": [null,null,null,null,null,null],
                "c": ["aîtrais","aîtrais","aîtrait","aîtrions","aîtriez","aîtraient"],
                "s": ["aisse","aisses","aisse","aissions","aissiez","aissent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"ais",null,null,"aissez",null],
                "pr": "aissant",
                "pp": "u",
                "b": "aître"
            }
        },
        "v103": {
            "ending": "aître",
            "t": {
                "p": ["ais","ais","aît","aissons","aissez","aissent"],
                "i": ["aissais","aissais","aissait","aissions","aissiez","aissaient"],
                "f": ["aîtrai","aîtras","aîtra","aîtrons","aîtrez","aîtront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["aîtrais","aîtrais","aîtrait","aîtrions","aîtriez","aîtraient"],
                "s": ["aisse","aisses","aisse","aissions","aissiez","aissent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ais",null,"aissons","aissez",null],
                "pr": "aissant",
                "pp": "u",
                "b": "aître"
            }
        },
        "v104": {
            "ending": "aître",
            "t": {
                "p": ["ais","ais","aît","aissons","aissez","aissent"],
                "i": ["aissais","aissais","aissait","aissions","aissiez","aissaient"],
                "f": ["aîtrai","aîtras","aîtra","aîtrons","aîtrez","aîtront"],
                "ps": ["aquis","aquis","aquit","aquîmes","aquîtes","aquirent"],
                "c": ["aîtrais","aîtrais","aîtrait","aîtrions","aîtriez","aîtraient"],
                "s": ["aisse","aisses","aisse","aissions","aissiez","aissent"],
                "si": ["aquisse","aquisses","aquît","aquissions","aquissiez","aquissent"],
                "ip": [null,"ais",null,"aissons","aissez",null],
                "pr": "aissant",
                "pp": "é",
                "b": "aître"
            }
        },
        "v105": {
            "ending": "aître",
            "t": {
                "p": ["ais","ais","aît","aissons","aissez","aissent"],
                "i": ["aissais","aissais","aissait","aissions","aissiez","aissaient"],
                "f": ["aîtrai","aîtras","aîtra","aîtrons","aîtrez","aîtront"],
                "ps": ["aquis","aquis","aquit","aquîmes","aquîtes","aquirent"],
                "c": ["aîtrais","aîtrais","aîtrait","aîtrions","aîtriez","aîtraient"],
                "s": ["aisse","aisses","aisse","aissions","aissiez","aissent"],
                "si": ["aquisse","aquisses","aquît","aquissions","aquissiez","aquissent"],
                "ip": [null,"ais",null,"aissons","aissez",null],
                "pr": "aissant",
                "pp": null,
                "b": "aître"
            }
        },
        "v106": {
            "ending": "oître",
            "t": {
                "p": ["oîs","oîs","oît","oissons","oissez","oissent"],
                "i": ["oissais","oissais","oissait","oissions","oissiez","oissaient"],
                "f": ["oîtrai","oîtras","oîtra","oîtrons","oîtrez","oîtront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["oîtrais","oîtrais","oîtrait","oîtrions","oîtriez","oîtraient"],
                "s": ["oisse","oisses","oisse","oissions","oissiez","oissent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"oîs",null,"oissons","oissez",null],
                "pr": "oissant",
                "pp": "û",
                "b": "oître"
            }
        },
        "v107": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","ions","iez","ient"],
                "i": ["iais","iais","iait","iions","iiez","iaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ie","ies","ie","iions","iiez","ient"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"ions","iez",null],
                "pr": "iant",
                "pp": "i",
                "b": "ire"
            }
        },
        "v108": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "is",
                "b": "ire"
            }
        },
        "v109": {
            "ending": "ure",
            "t": {
                "p": ["us","us","ut","uons","uez","uent"],
                "i": ["uais","uais","uait","uions","uiez","uaient"],
                "f": ["urai","uras","ura","urons","urez","uront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["urais","urais","urait","urions","uriez","uraient"],
                "s": ["ue","ues","ue","uions","uiez","uent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"us",null,"uons","uez",null],
                "pr": "uant",
                "pp": "u",
                "b": "ure"
            }
        },
        "v110": {
            "ending": "ure",
            "t": {
                "p": ["us","us","ut","uons","uez","uent"],
                "i": ["uais","uais","uait","uions","uiez","uaient"],
                "f": ["urai","uras","ura","urons","urez","uront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["urais","urais","urait","urions","uriez","uraient"],
                "s": ["ue","ues","ue","uions","uiez","uent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"us",null,"uons","uez",null],
                "pr": "uant",
                "pp": "us",
                "b": "ure"
            }
        },
        "v111": {
            "ending": "re",
            "t": {
                "p": ["s","s","t","sons","sez","sent"],
                "i": ["sais","sais","sait","sions","siez","saient"],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": ["sis","sis","sit","sîmes","sîtes","sirent"],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": ["se","ses","se","sions","siez","sent"],
                "si": ["sisse","sisses","sît","sissions","sissiez","sissent"],
                "ip": [null,"s",null,"sons","sez",null],
                "pr": "sant",
                "pp": "",
                "b": "re"
            }
        },
        "v112": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "i",
                "b": "ire"
            }
        },
        "v113": {
            "ending": "re",
            "t": {
                "p": ["s","s","t","sons","sez","sent"],
                "i": ["sais","sais","sait","sions","siez","saient"],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": ["sis","sis","sit","sîmes","sîtes","sirent"],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": ["se","ses","se","sions","siez","sent"],
                "si": ["sisse","sisses","sît","sissions","sissiez","sissent"],
                "ip": [null,"s",null,"sons","sez",null],
                "pr": "sant",
                "pp": "t",
                "b": "re"
            }
        },
        "v114": {
            "ending": "re",
            "t": {
                "p": ["s","s","t","vons","vez","vent"],
                "i": ["vais","vais","vait","vions","viez","vaient"],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": ["vis","vis","vit","vîmes","vîtes","virent"],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": ["ve","ves","ve","vions","viez","vent"],
                "si": ["visse","visses","vît","vissions","vissiez","vissent"],
                "ip": [null,"s",null,"vons","vez",null],
                "pr": "vant",
                "pp": "t",
                "b": "re"
            }
        },
        "v115": {
            "ending": "oire",
            "t": {
                "p": ["ois","ois","oit","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ois",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "u",
                "b": "oire"
            }
        },
        "v116": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "i",
                "b": "ire"
            }
        },
        "v117": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","ites","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","ites",null],
                "pr": "isant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v118": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v119": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v120": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","isons","isez","isent"],
                "i": ["isais","isais","isait","isions","isiez","isaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ise","ises","ise","isions","isiez","isent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"is",null,"isons","isez",null],
                "pr": "isant",
                "pp": "u",
                "b": "ire"
            }
        },
        "v121": {
            "ending": "oire",
            "t": {
                "p": ["ois","ois","oit","uvons","uvez","oivent"],
                "i": ["uvais","uvais","uvait","uvions","uviez","uvaient"],
                "f": ["oirai","oiras","oira","oirons","oirez","oiront"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["oirais","oirais","oirait","oirions","oiriez","oiraient"],
                "s": ["oive","oives","oive","uvions","uviez","oivent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ois",null,"uvons","uvez",null],
                "pr": "uvant",
                "pp": "u",
                "b": "oire"
            }
        },
        "v122": {
            "ending": "aire",
            "t": {
                "p": ["ais","ais","ait","aisons","aisez","aisent"],
                "i": ["aisais","aisais","aisait","aisions","aisiez","aisaient"],
                "f": ["airai","airas","aira","airons","airez","airont"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["airais","airais","airait","airions","airiez","airaient"],
                "s": ["aise","aises","aise","aisions","aisiez","aisent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ais",null,"aisons","aisez",null],
                "pr": "aisant",
                "pp": "u",
                "b": "aire"
            }
        },
        "v123": {
            "ending": "aire",
            "t": {
                "p": ["ais","ais","aît","aisons","aisez","aisent"],
                "i": ["aisais","aisais","aisait","aisions","aisiez","aisaient"],
                "f": ["airai","airas","aira","airons","airez","airont"],
                "ps": ["us","us","ut","ûmes","ûtes","urent"],
                "c": ["airais","airais","airait","airions","airiez","airaient"],
                "s": ["aise","aises","aise","aisions","aisiez","aisent"],
                "si": ["usse","usses","ût","ussions","ussiez","ussent"],
                "ip": [null,"ais",null,"aisons","aisez",null],
                "pr": "aisant",
                "pp": "u",
                "b": "aire"
            }
        },
        "v124": {
            "ending": "aire",
            "t": {
                "p": ["ais","ais","ait","aisons","aites","ont"],
                "i": ["aisais","aisais","aisait","aisions","aisiez","aisaient"],
                "f": ["erai","eras","era","erons","erez","eront"],
                "ps": ["is","is","it","îmes","îtes","irent"],
                "c": ["erais","erais","erait","erions","eriez","eraient"],
                "s": ["asse","asses","asse","assions","assiez","assent"],
                "si": ["isse","isses","ît","issions","issiez","issent"],
                "ip": [null,"ais",null,"aisons","aites",null],
                "pr": "aisant",
                "pp": "ait",
                "b": "aire"
            }
        },
        "v125": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": [null,null,null,null,null,null],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"is",null,"yons","yez",null],
                "pr": "yant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v126": {
            "ending": "ire",
            "t": {
                "p": ["is","is","it","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": [null,null,null,null,null,null],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"is",null,"yons","yez",null],
                "pr": "yant",
                "pp": "it",
                "b": "ire"
            }
        },
        "v127": {
            "ending": "ourdre",
            "t": {
                "p": [null,null,"ourd",null,null,"ourdent"],
                "i": [null,null,"ourdait",null,null,"ourdaient"],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "ourdre"
            }
        },
        "v128": {
            "ending": "ore",
            "t": {
                "p": ["os","os","ôt",null,null,"osent"],
                "i": [null,null,null,null,null,null],
                "f": ["orai","oras","ora","orons","orez","oront"],
                "ps": [null,null,null,null,null,null],
                "c": ["orais","orais","orait","orions","oriez","oraient"],
                "s": ["ose","oses","ose","osions","osiez","osent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"os",null,null,null,null],
                "pr": "osant",
                "pp": "os",
                "b": "ore"
            }
        },
        "v129": {
            "ending": "re",
            "t": {
                "p": ["s","s","t",null,null,"sent"],
                "i": [null,null,null,null,null,null],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": [null,null,null,null,null,null],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": ["se","ses","se","sions","siez","sent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,"s",null,null,null,null],
                "pr": "sant",
                "pp": "s",
                "b": "re"
            }
        },
        "v130": {
            "ending": "re",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": "s",
                "b": "re"
            }
        },
        "v131": {
            "ending": "re",
            "t": {
                "p": ["s","s","t",null,null,null],
                "i": [null,null,null,null,null,null],
                "f": ["rai","ras","ra","rons","rez","ront"],
                "ps": [null,null,null,null,null,null],
                "c": ["rais","rais","rait","rions","riez","raient"],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,"s",null,null,null,null],
                "pr": null,
                "pp": "t",
                "b": "re"
            }
        },
        "v132": {
            "ending": "re",
            "t": {
                "p": [null,null,"t",null,null,"ssent"],
                "i": [null,null,"ssait",null,null,"ssaient"],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,"sse",null,null,"ssent"],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "ssant",
                "pp": null,
                "b": "re"
            }
        },
        "v133": {
            "ending": "ndre",
            "t": {
                "p": ["ns","ns","nt","gnons","gnez","gnent"],
                "i": ["gnais","gnais","gnait","gnions","gniez","gnaient"],
                "f": ["ndrai","ndras","ndra","ndrons","ndrez","ndront"],
                "ps": ["gnis","gnis","gnit","gnîmes","gnîtes","gnirent"],
                "c": ["ndrais","ndrais","ndrait","ndrions","ndriez","ndraient"],
                "s": ["gne","gnes","gne","gnions","gniez","gnent"],
                "si": ["gnisse","gnisses","gnît","gnissions","gnissiez","gnissent"],
                "ip": [null,"ns",null,"gnons","gnez",null],
                "pr": "gnant",
                "pp": "nt",
                "b": "ndre"
            }
        },
        "v134": {
            "ending": "oyer",
            "t": {
                "p": ["oie","oies","oie","oyons","oyez","oient"],
                "i": ["oyais","oyais","oyait","oyions","oyiez","oyaient"],
                "f": ["errai","erras","erra","errons","errez","erront"],
                "ps": ["oyai","oyas","oya","oyâmes","oyâtes","oyèrent"],
                "c": ["errais","errais","errait","errions","erriez","erraient"],
                "s": ["oie","oies","oie","oyions","oyiez","oient"],
                "si": ["oyasse","oyasses","oyât","oyassions","oyassiez","oyassent"],
                "ip": [null,"oie",null,"oyons","oyez",null],
                "pr": "oyant",
                "pp": "oyé",
                "b": "oyer"
            }
        },
        "v135": {
            "ending": "avoir",
            "t": {
                "p": ["ai","as","a","avons","avez","ont"],
                "i": ["avais","avais","avait","avions","aviez","avaient"],
                "f": ["aurai","auras","aura","aurons","aurez","auront"],
                "ps": ["eus","eus","eut","eûmes","eûtes","eurent"],
                "c": ["aurais","aurais","aurait","aurions","auriez","auraient"],
                "s": ["aie","aies","ait","ayons","ayez","aient"],
                "si": ["eusse","eusses","eût","eussions","eussiez","eussent"],
                "ip": [null,"aie",null,"ayons","ayez",null],
                "pr": "ayant",
                "pp": "eu",
                "b": "avoir"
            }
        },
        "v136": {
            "ending": "être",
            "t": {
                "p": ["suis","es","est","sommes","êtes","sont"],
                "i": ["étais","étais","était","étions","étiez","étaient"],
                "f": ["serai","seras","sera","serons","serez","seront"],
                "ps": ["fus","fus","fut","fûmes","fûtes","furent"],
                "c": ["serais","serais","serait","serions","seriez","seraient"],
                "s": ["sois","sois","soit","soyons","soyez","soient"],
                "si": ["fusse","fusses","fût","fussions","fussiez","fussent"],
                "ip": [null,"sois",null,"soyons","soyez",null],
                "pr": "étant",
                "pp": "été",
                "b": "être"
            }
        },
        "v137": {
            "ending": "aller",
            "t": {
                "p": ["vais","vas","va","allons","allez","vont"],
                "i": ["allais","allais","allait","allions","alliez","allaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["allai","allas","alla","allâmes","allâtes","allèrent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["aille","ailles","aille","allions","alliez","aillent"],
                "si": ["allasse","allasses","allât","allassions","allassiez","allassent"],
                "ip": [null,"va",null,"allons","allez",null],
                "pr": "allant",
                "pp": "allé",
                "b": "aller"
            }
        },
        "v138": {
            "ending": "aroir",
            "t": {
                "p": [null,null,"ert",null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "aroir"
            }
        },
        "v139": {
            "ending": "loir",
            "t": {
                "p": [null,null,"ut",null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "loir"
            }
        },
        "v140": {
            "ending": "ravoir",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "ravoir"
            }
        },
        "v141": {
            "ending": "er",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": null,
                "b": "er"
            }
        },
        "v142": {
            "ending": "ir",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": "u",
                "b": "ir"
            }
        },
        "v143": {
            "ending": "uïr",
            "t": {
                "p": ["is","is","it","yons","yez","ient"],
                "i": ["yais","yais","yait","yions","yiez","yaient"],
                "f": ["irai","iras","ira","irons","irez","iront"],
                "ps": ["uïs","uïs","uït","uïmes","uïtes","uïrent"],
                "c": ["irais","irais","irait","irions","iriez","iraient"],
                "s": ["ie","ies","ie","yions","yiez","ient"],
                "si": ["uïsse","uïsses","uït","uïssions","uïssiez","uïssent"],
                "ip": [null,"is",null,"yons","yez",null],
                "pr": "yant",
                "pp": "uï",
                "b": "uïr"
            }
        },
        "v144": {
            "ending": "re",
            "t": {
                "p": [null,null,null,null,null,null],
                "i": [null,null,null,null,null,null],
                "f": [null,null,null,null,null,null],
                "ps": [null,null,null,null,null,null],
                "c": [null,null,null,null,null,null],
                "s": [null,null,null,null,null,null],
                "si": [null,null,null,null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": null,
                "pp": "s",
                "b": "re"
            }
        },
        "v145": {
            "ending": "er",
            "t": {
                "p": [null,null,"e",null,null,null],
                "i": [null,null,"ait",null,null,null],
                "f": [null,null,"era",null,null,null],
                "ps": [null,null,"a",null,null,null],
                "c": [null,null,"erait",null,null,null],
                "s": [null,null,"e",null,null,null],
                "si": [null,null,"ât",null,null,null],
                "ip": [null,null,null,null,null,null],
                "pr": "ant",
                "pp": "é",
                "b": "er"
            }
        }
    },
    "compound": {
        "alias": "aux",
        "participle": "pp",
        "aux": {
            "av": "avoir",
            "êt": "être",
            "aê": "avoir"
        },
        "pc": {
            "auxTense": "p",
            "progAuxTense": "i"
        },
        "pq": {
            "auxTense": "i",
            "progAuxTense": "i"
        },
        "spa": {
            "auxTense": "s",
            "progAuxTense": "i"
        },
        "spq": {
            "auxTense": "si",
            "progAuxTense": "i"
        },
        "cp": {
            "auxTense": "c",
            "progAuxTense": "c"
        },
        "fa": {
            "auxTense": "f",
            "progAuxTense": "f"
        }
    },
    "elision": {
        "elisionEtre": {
            "verbe": ["en","est","était"],
            "aux": ["a","aura","avait","ait","eût","aurait"],
            "pp": ["été","étés","étées"]
        },
        "elidables": ["la","ma","ta","sa","le","me","te","se","ce","de","ne","je",
                      "si","que","jusque","lorsque","puisque","quoique","nouveau","beau"],
        "voyellesAccentuees": "àäéèêëïîöôùû",
        "voyelles": "aeiouàäéèêëïîöôùû"
    },
    "declension": {
        "nI": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "","g": "f","n": "s"
            },{
                "val": "","g": "m","n": "p"
            },{
                "val": "","g": "f","n": "p"
            }]
        },
        "n1": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "p"
            }]
        },
        "n2": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "","g": "m","n": "p"
            }]
        },
        "n3": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            }]
        },
        "n4": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "x","g": "m","n": "p"
            }]
        },
        "n5": {
            "ending": "al",
            "declension": [{
                "val": "al","g": "m","n": "s"
            },{
                "val": "aux","g": "m","n": "p"
            }]
        },
        "n6": {
            "ending": "ail",
            "declension": [{
                "val": "ail","g": "m","n": "s"
            },{
                "val": "aux","g": "m","n": "p"
            }]
        },
        "n7": {
            "ending": "ail",
            "declension": [{
                "val": "ail","g": "m","n": "s"
            },{
                "val": "aulx","g": "m","n": "p"
            }]
        },
        "n8": {
            "ending": "aïeul",
            "declension": [{
                "val": "aïeul","g": "m","n": "s"
            },{
                "val": "aïeux","g": "m","n": "p"
            }]
        },
        "n9": {
            "ending": "ciel",
            "declension": [{
                "val": "ciel","g": "m","n": "s"
            },{
                "val": "cieux","g": "m","n": "p"
            }]
        },
        "n10": {
            "ending": "dit",
            "declension": [{
                "val": "dit","g": "m","n": "s"
            },{
                "val": "xdits","g": "m","n": "p"
            }]
        },
        "n11": {
            "ending": "homme",
            "declension": [{
                "val": "homme","g": "m","n": "s"
            },{
                "val": "shommes","g": "m","n": "p"
            }]
        },
        "n12": {
            "ending": "monsieur",
            "declension": [{
                "val": "monsieur","g": "m","n": "s"
            },{
                "val": "messieurs","g": "m","n": "p"
            }]
        },
        "n13": {
            "ending": "monseigneur",
            "declension": [{
                "val": "monseigneur","g": "m","n": "s"
            },{
                "val": "messeigneurs","g": "m","n": "p"
            }]
        },
        "n14": {
            "ending": "oeil",
            "declension": [{
                "val": "oeil","g": "m","n": "s"
            },{
                "val": "yeux","g": "m","n": "p"
            }]
        },
        "n15": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "p"
            }]
        },
        "n16": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "","g": "f","n": "p"
            }]
        },
        "n17": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "s","g": "f","n": "p"
            }]
        },
        "n18": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "x","g": "f","n": "p"
            }]
        },
        "n19": {
            "ending": "madame",
            "declension": [{
                "val": "madame","g": "f","n": "s"
            },{
                "val": "mesdames","g": "f","n": "p"
            }]
        },
        "n20": {
            "ending": "mademoiselle",
            "declension": [{
                "val": "mademoiselle","g": "f","n": "s"
            },{
                "val": "mesdemoiselles","g": "f","n": "p"
            }]
        },
        "n21": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "p"
            },{
                "val": "","g": "f","n": "p"
            }]
        },
        "n22": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "p"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n23": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "","g": "f","n": "s"
            }]
        },
        "n24": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "","g": "f","n": "s"
            },{
                "val": "","g": "m","n": "p"
            },{
                "val": "","g": "f","n": "p"
            }]
        },
        "n25": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "s","g": "f","n": "p"
            }]
        },
        "n26": {
            "ending": "s",
            "declension": [{
                "val": "s","g": "m","n": "p"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n27": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "e","g": "f","n": "s"
            },{
                "val": "","g": "m","n": "p"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n28": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "e","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n29": {
            "ending": "eau",
            "declension": [{
                "val": "eau","g": "m","n": "s"
            },{
                "val": "elle","g": "f","n": "s"
            },{
                "val": "eaux","g": "m","n": "p"
            },{
                "val": "elles","g": "f","n": "p"
            }]
        },
        "n30": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "de","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "des","g": "f","n": "p"
            }]
        },
        "n31": {
            "ending": "ou",
            "declension": [{
                "val": "ou","g": "m","n": "s"
            },{
                "val": "olle","g": "f","n": "s"
            },{
                "val": "ous","g": "m","n": "p"
            },{
                "val": "olles","g": "f","n": "p"
            }]
        },
        "n32": {
            "ending": "fou-fou",
            "declension": [{
                "val": "fou-fou","g": "m","n": "s"
            },{
                "val": "fofolle","g": "f","n": "s"
            },{
                "val": "fou-fou","g": "m","n": "p"
            },{
                "val": "fofolles","g": "f","n": "p"
            }]
        },
        "n33": {
            "ending": "ou",
            "declension": [{
                "val": "ou","g": "m","n": "s"
            },{
                "val": "ouse","g": "f","n": "s"
            },{
                "val": "ous","g": "m","n": "p"
            },{
                "val": "ouses","g": "f","n": "p"
            }]
        },
        "n34": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "te","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "tes","g": "f","n": "p"
            }]
        },
        "n35": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            }]
        },
        "n36": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            }]
        },
        "n37": {
            "ending": "ec",
            "declension": [{
                "val": "ec","g": "m","n": "s"
            },{
                "val": "èche","g": "f","n": "s"
            },{
                "val": "ecs","g": "m","n": "p"
            },{
                "val": "èches","g": "f","n": "p"
            }]
        },
        "n38": {
            "ending": "ef",
            "declension": [{
                "val": "ef","g": "m","n": "s"
            },{
                "val": "ève","g": "f","n": "s"
            },{
                "val": "efs","g": "m","n": "p"
            },{
                "val": "èves","g": "f","n": "p"
            }]
        },
        "n39": {
            "ending": "er",
            "declension": [{
                "val": "er","g": "m","n": "s"
            },{
                "val": "ère","g": "f","n": "s"
            },{
                "val": "ers","g": "m","n": "p"
            },{
                "val": "ères","g": "f","n": "p"
            }]
        },
        "n40": {
            "ending": "et",
            "declension": [{
                "val": "et","g": "m","n": "s"
            },{
                "val": "ète","g": "f","n": "s"
            },{
                "val": "ets","g": "m","n": "p"
            },{
                "val": "ètes","g": "f","n": "p"
            }]
        },
        "n41": {
            "ending": "ès",
            "declension": [{
                "val": "ès","g": "m","n": "s"
            },{
                "val": "esse","g": "f","n": "s"
            },{
                "val": "ès","g": "m","n": "p"
            },{
                "val": "esses","g": "f","n": "p"
            }]
        },
        "n42": {
            "ending": "ès",
            "declension": [{
                "val": "ès","g": "m","n": "s"
            },{
                "val": "èze","g": "f","n": "s"
            },{
                "val": "ès","g": "m","n": "p"
            },{
                "val": "èzes","g": "f","n": "p"
            }]
        },
        "n43": {
            "ending": "nègre",
            "declension": [{
                "val": "nègre","g": "m","n": "s"
            },{
                "val": "négresse","g": "f","n": "s"
            },{
                "val": "nègres","g": "m","n": "p"
            },{
                "val": "négresses","g": "f","n": "p"
            }]
        },
        "n44": {
            "ending": "ais",
            "declension": [{
                "val": "ais","g": "m","n": "s"
            },{
                "val": "aîche","g": "f","n": "s"
            },{
                "val": "ais","g": "m","n": "p"
            },{
                "val": "aîches","g": "f","n": "p"
            }]
        },
        "n45": {
            "ending": "igu",
            "declension": [{
                "val": "igu","g": "m","n": "s"
            },{
                "val": "iguë","g": "f","n": "s"
            },{
                "val": "igus","g": "m","n": "p"
            },{
                "val": "iguës","g": "f","n": "p"
            }]
        },
        "n46": {
            "ending": "f",
            "declension": [{
                "val": "f","g": "m","n": "s"
            },{
                "val": "ve","g": "f","n": "s"
            },{
                "val": "fs","g": "m","n": "p"
            },{
                "val": "ves","g": "f","n": "p"
            }]
        },
        "n47": {
            "ending": "al",
            "declension": [{
                "val": "al","g": "m","n": "s"
            },{
                "val": "ale","g": "f","n": "s"
            },{
                "val": "aux","g": "m","n": "p"
            },{
                "val": "ales","g": "f","n": "p"
            }]
        },
        "n48": {
            "ending": "l",
            "declension": [{
                "val": "l","g": "m","n": "s"
            },{
                "val": "lle","g": "f","n": "s"
            },{
                "val": "ls","g": "m","n": "p"
            },{
                "val": "lles","g": "f","n": "p"
            }]
        },
        "n49": {
            "ending": "n",
            "declension": [{
                "val": "n","g": "m","n": "s"
            },{
                "val": "nne","g": "f","n": "s"
            },{
                "val": "ns","g": "m","n": "p"
            },{
                "val": "nnes","g": "f","n": "p"
            }]
        },
        "n50": {
            "ending": "s",
            "declension": [{
                "val": "s","g": "m","n": "s"
            },{
                "val": "sse","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "sses","g": "f","n": "p"
            }]
        },
        "n51": {
            "ending": "t",
            "declension": [{
                "val": "t","g": "m","n": "s"
            },{
                "val": "tte","g": "f","n": "s"
            },{
                "val": "ts","g": "m","n": "p"
            },{
                "val": "ttes","g": "f","n": "p"
            }]
        },
        "n52": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "sse","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "sses","g": "f","n": "p"
            }]
        },
        "n53": {
            "ending": "x",
            "declension": [{
                "val": "x","g": "m","n": "s"
            },{
                "val": "sse","g": "f","n": "s"
            },{
                "val": "x","g": "m","n": "p"
            },{
                "val": "sses","g": "f","n": "p"
            }]
        },
        "n54": {
            "ending": "x",
            "declension": [{
                "val": "x","g": "m","n": "s"
            },{
                "val": "se","g": "f","n": "s"
            },{
                "val": "x","g": "m","n": "p"
            },{
                "val": "ses","g": "f","n": "p"
            }]
        },
        "n55": {
            "ending": "eur",
            "declension": [{
                "val": "eur","g": "m","n": "s"
            },{
                "val": "euse","g": "f","n": "s"
            },{
                "val": "eurs","g": "m","n": "p"
            },{
                "val": "euses","g": "f","n": "p"
            }]
        },
        "n56": {
            "ending": "eur",
            "declension": [{
                "val": "eur","g": "m","n": "s"
            },{
                "val": "rice","g": "f","n": "s"
            },{
                "val": "eurs","g": "m","n": "p"
            },{
                "val": "rices","g": "f","n": "p"
            }]
        },
        "n57": {
            "ending": "sauveur",
            "declension": [{
                "val": "sauveur","g": "m","n": "s"
            },{
                "val": "salvatrice","g": "f","n": "s"
            },{
                "val": "sauveurs","g": "m","n": "p"
            },{
                "val": "salvatrices","g": "f","n": "p"
            }]
        },
        "n58": {
            "ending": "eur",
            "declension": [{
                "val": "eur","g": "m","n": "s"
            },{
                "val": "eresse","g": "f","n": "s"
            },{
                "val": "eurs","g": "m","n": "p"
            },{
                "val": "eresses","g": "f","n": "p"
            }]
        },
        "n59": {
            "ending": "er",
            "declension": [{
                "val": "er","g": "m","n": "s"
            },{
                "val": "eresse","g": "f","n": "s"
            },{
                "val": "ers","g": "m","n": "p"
            },{
                "val": "eresses","g": "f","n": "p"
            }]
        },
        "n60": {
            "ending": "c",
            "declension": [{
                "val": "c","g": "m","n": "s"
            },{
                "val": "que","g": "f","n": "s"
            },{
                "val": "cs","g": "m","n": "p"
            },{
                "val": "ques","g": "f","n": "p"
            }]
        },
        "n61": {
            "ending": "anc",
            "declension": [{
                "val": "anc","g": "m","n": "s"
            },{
                "val": "anche","g": "f","n": "s"
            },{
                "val": "ancs","g": "m","n": "p"
            },{
                "val": "anches","g": "f","n": "p"
            }]
        },
        "n62": {
            "ending": "duc",
            "declension": [{
                "val": "duc","g": "m","n": "s"
            },{
                "val": "duchesse","g": "f","n": "s"
            },{
                "val": "ducs","g": "m","n": "p"
            },{
                "val": "duchesses","g": "f","n": "p"
            }]
        },
        "n63": {
            "ending": "e",
            "declension": [{
                "val": "e","g": "m","n": "s"
            },{
                "val": "esque","g": "f","n": "s"
            },{
                "val": "es","g": "m","n": "p"
            },{
                "val": "esques","g": "f","n": "p"
            }]
        },
        "n64": {
            "ending": "ong",
            "declension": [{
                "val": "ong","g": "m","n": "s"
            },{
                "val": "ongue","g": "f","n": "s"
            },{
                "val": "ongs","g": "m","n": "p"
            },{
                "val": "ongues","g": "f","n": "p"
            }]
        },
        "n65": {
            "ending": "in",
            "declension": [{
                "val": "in","g": "m","n": "s"
            },{
                "val": "igne","g": "f","n": "s"
            },{
                "val": "ins","g": "m","n": "p"
            },{
                "val": "ignes","g": "f","n": "p"
            }]
        },
        "n66": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "e","g": "f","n": "s"
            }]
        },
        "n67": {
            "ending": "iers",
            "declension": [{
                "val": "iers","g": "m","n": "s"
            },{
                "val": "ierce","g": "f","n": "s"
            },{
                "val": "iers","g": "m","n": "p"
            },{
                "val": "ierces","g": "f","n": "p"
            }]
        },
        "n68": {
            "ending": "ant",
            "declension": [{
                "val": "ant","g": "m","n": "s"
            },{
                "val": "antine","g": "f","n": "s"
            },{
                "val": "ants","g": "m","n": "p"
            },{
                "val": "antines","g": "f","n": "p"
            }]
        },
        "n69": {
            "ending": "ut",
            "declension": [{
                "val": "ut","g": "m","n": "s"
            },{
                "val": "use","g": "f","n": "s"
            },{
                "val": "uts","g": "m","n": "p"
            },{
                "val": "uses","g": "f","n": "p"
            }]
        },
        "n70": {
            "ending": "doux",
            "declension": [{
                "val": "doux","g": "m","n": "s"
            },{
                "val": "douce","g": "f","n": "s"
            },{
                "val": "doux","g": "m","n": "p"
            },{
                "val": "douces","g": "f","n": "p"
            }]
        },
        "n71": {
            "ending": "empereur",
            "declension": [{
                "val": "empereur","g": "m","n": "s"
            },{
                "val": "impératrice","g": "f","n": "s"
            },{
                "val": "empereurs","g": "m","n": "p"
            },{
                "val": "impératrices","g": "f","n": "p"
            }]
        },
        "n72": {
            "ending": "hébreu",
            "declension": [{
                "val": "hébreu","g": "m","n": "s"
            },{
                "val": "hébraïque","g": "f","n": "s"
            },{
                "val": "hébreux","g": "m","n": "p"
            },{
                "val": "hébraïques","g": "f","n": "p"
            }]
        },
        "n73": {
            "ending": "vieux",
            "declension": [{
                "val": "vieux","g": "m","n": "s"
            },{
                "val": "vieille","g": "f","n": "s"
            },{
                "val": "vieux","g": "m","n": "p"
            },{
                "val": "vieilles","g": "f","n": "p"
            }]
        },
        "n74": {
            "ending": "c",
            "declension": [{
                "val": "c","g": "m","n": "s"
            },{
                "val": "cque","g": "f","n": "s"
            },{
                "val": "cs","g": "m","n": "p"
            },{
                "val": "cques","g": "f","n": "p"
            }]
        },
        "n75": {
            "ending": "quelqu'un",
            "declension": [{
                "val": "quelqu'un","g": "m","n": "s"
            },{
                "val": "quelqu'une","g": "f","n": "s"
            },{
                "val": "quelques-uns","g": "m","n": "p"
            },{
                "val": "quelques-unes","g": "f","n": "p"
            }]
        },
        "n76": {
            "ending": "tout",
            "declension": [{
                "val": "tout","g": "m","n": "s"
            },{
                "val": "toute","g": "f","n": "s"
            },{
                "val": "tous","g": "m","n": "p"
            },{
                "val": "toutes","g": "f","n": "p"
            }]
        },
        "n77": {
            "ending": "us",
            "declension": [{
                "val": "us","g": "m","n": "s"
            },{
                "val": "i","g": "m","n": "p"
            }]
        },
        "n78": {
            "ending": "um",
            "declension": [{
                "val": "um","g": "m","n": "s"
            },{
                "val": "a","g": "m","n": "p"
            }]
        },
        "n79": {
            "ending": "um",
            "declension": [{
                "val": "um","g": "m","n": "s"
            },{
                "val": "a","g": "f","n": "s"
            },{
                "val": "a","g": "m","n": "p"
            },{
                "val": "a","g": "f","n": "p"
            }]
        },
        "n80": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "es","g": "m","n": "p"
            }]
        },
        "n81": {
            "ending": "eu",
            "declension": [{
                "val": "eu","g": "m","n": "s"
            },{
                "val": "ei","g": "m","n": "p"
            }]
        },
        "n82": {
            "ending": "man",
            "declension": [{
                "val": "man","g": "m","n": "s"
            },{
                "val": "men","g": "m","n": "p"
            }]
        },
        "n83": {
            "ending": "y",
            "declension": [{
                "val": "y","g": "m","n": "s"
            },{
                "val": "ies","g": "m","n": "p"
            }]
        },
        "n84": {
            "ending": "man",
            "declension": [{
                "val": "man","g": "f","n": "s"
            },{
                "val": "men","g": "f","n": "p"
            }]
        },
        "n85": {
            "ending": "y",
            "declension": [{
                "val": "y","g": "f","n": "s"
            },{
                "val": "ies","g": "f","n": "p"
            }]
        },
        "n86": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "i","g": "m","n": "p"
            }]
        },
        "n87": {
            "ending": "o",
            "declension": [{
                "val": "o","g": "m","n": "s"
            },{
                "val": "i","g": "m","n": "p"
            }]
        },
        "n88": {
            "ending": "o",
            "declension": [{
                "val": "o","g": "m","n": "s"
            },{
                "val": "o","g": "f","n": "s"
            },{
                "val": "i","g": "m","n": "p"
            },{
                "val": "i","g": "f","n": "p"
            }]
        },
        "n89": {
            "ending": "or",
            "declension": [{
                "val": "or","g": "m","n": "s"
            },{
                "val": "ores","g": "m","n": "p"
            }]
        },
        "n90": {
            "ending": "o",
            "declension": [{
                "val": "o","g": "m","n": "s"
            },{
                "val": "a","g": "m","n": "p"
            }]
        },
        "n91": {
            "ending": "o",
            "declension": [{
                "val": "o","g": "m","n": "s"
            },{
                "val": "a","g": "f","n": "s"
            },{
                "val": "a","g": "m","n": "p"
            },{
                "val": "a","g": "f","n": "p"
            }]
        },
        "n92": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "e","g": "m","n": "p"
            }]
        },
        "n93": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "er","g": "m","n": "p"
            }]
        },
        "n94": {
            "ending": "ar",
            "declension": [{
                "val": "ar","g": "m","n": "s"
            },{
                "val": "our","g": "m","n": "p"
            }]
        },
        "n95": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "a","g": "m","n": "p"
            }]
        },
        "n96": {
            "ending": "oy",
            "declension": [{
                "val": "oy","g": "m","n": "s"
            },{
                "val": "oyim","g": "m","n": "p"
            }]
        },
        "n97": {
            "ending": "oï",
            "declension": [{
                "val": "oï","g": "m","n": "s"
            },{
                "val": "oïm","g": "m","n": "p"
            }]
        },
        "n98": {
            "ending": "ai",
            "declension": [{
                "val": "ai","g": "m","n": "s"
            },{
                "val": "ayin","g": "m","n": "p"
            }]
        },
        "n99": {
            "ending": "e",
            "declension": [{
                "val": "e","g": "m","n": "s"
            },{
                "val": "i","g": "m","n": "p"
            }]
        },
        "n100": {
            "ending": "a",
            "declension": [{
                "val": "a","g": "f","n": "s"
            },{
                "val": "ae","g": "f","n": "p"
            }]
        },
        "n101": {
            "ending": "gens",
            "declension": [{
                "val": "gens","g": "f","n": "s"
            },{
                "val": "gentes","g": "f","n": "p"
            }]
        },
        "n102": {
            "ending": "au",
            "declension": [{
                "val": "au","g": "m","n": "s"
            },{
                "val": "aude","g": "f","n": "s"
            },{
                "val": "aux","g": "m","n": "p"
            },{
                "val": "audes","g": "f","n": "p"
            }]
        },
        "n103": {
            "ending": "ète",
            "declension": [{
                "val": "ète","g": "m","n": "s"
            },{
                "val": "étesse","g": "f","n": "s"
            },{
                "val": "ètes","g": "m","n": "p"
            },{
                "val": "étesses","g": "f","n": "p"
            }]
        },
        "n104": {
            "ending": "ain",
            "declension": [{
                "val": "ain","g": "m","n": "s"
            },{
                "val": "ine","g": "f","n": "s"
            },{
                "val": "ains","g": "m","n": "p"
            },{
                "val": "ines","g": "f","n": "p"
            }]
        },
        "n105": {
            "ending": "in",
            "declension": [{
                "val": "in","g": "m","n": "s"
            },{
                "val": "ineresse","g": "f","n": "s"
            },{
                "val": "ins","g": "m","n": "p"
            },{
                "val": "ineresses","g": "f","n": "p"
            }]
        },
        "n106": {
            "ending": "eg",
            "declension": [{
                "val": "eg","g": "m","n": "s"
            },{
                "val": "ègue","g": "f","n": "s"
            },{
                "val": "egs","g": "m","n": "p"
            },{
                "val": "ègues","g": "f","n": "p"
            }]
        },
        "n107": {
            "ending": "targui",
            "declension": [{
                "val": "targui","g": "m","n": "s"
            },{
                "val": "targuia","g": "f","n": "s"
            },{
                "val": "touareg","g": "m","n": "p"
            },{
                "val": "targuiat","g": "f","n": "p"
            }]
        },
        "n108": {
            "ending": "eau",
            "declension": [{
                "val": "eau","g": "m","n": "s"
            },{
                "val": "elle","g": "f","n": "s"
            },{
                "val": "eaux","g": "m","n": "p"
            },{
                "val": "elles","g": "f","n": "p"
            }]
        },
        "n109": {
            "ending": "ou",
            "declension": [{
                "val": "ou","g": "m","n": "s"
            },{
                "val": "olle","g": "f","n": "s"
            },{
                "val": "ous","g": "m","n": "p"
            },{
                "val": "olles","g": "f","n": "p"
            }]
        },
        "pn0":{
            "ending":"on",
            "declension":[{
                "val":"on", "g":"m", "n":"s"
            },{
                "val":"soi", "g":"x", "n":"s", "tn":""
            },{
                "val":"soi-même", "g":"x", "n":"s", "tn":"refl"
            },{
                "val":"soi", "g":"x", "n":"s", "c":"nom"
            },{
                "val":"le", "g":"x", "n":"s", "c":"acc"
            },{
                "val":"soi", "g":"x", "n":"s", "c":"dat"
            },{
                "val":"se", "g":"x", "n":"s", "c":"refl"
            }]
        },
        "pn1": {
            "ending": "je",
            "declension": [{
                "val": "je","g": "x","n": "s","pe": 1
            },{
                "val": "nous","g": "x","n": "p","pe": 1
            },{
                "val": "tu","g": "x","n": "s","pe": 2
            },{
                "val": "vous","g": "x","n": "p","pe": 2
            },{
                "val": "il","g": "m","n": "s","pe": 3
            },{
                "val": "elle","g": "f","n": "s","pe": 3
            },{
                "val": "ils","g": "m","n": "p","pe": 3
            },{
                "val": "elles","g": "f","n": "p","pe": 3
            }]
        },
        "pn2": {
            "ending": "me",
            "declension": [{
                "val": "me","g": "x","n": "s","pe": 1
            },{
                "val": "nous","g": "x","n": "p","pe": 1
            },{
                "val": "te","g": "x","n": "s","pe": 2
            },{
                "val": "vous","g": "x","n": "p","pe": 2
            },{
                "val": "le","g": "m","n": "s","pe": 3
            },{
                "val": "la","g": "f","n": "s","pe": 3
            },{
                "val": "les","g": "x","n": "p","pe": 3
            }]
        },
        "pn3": {
            "ending": "me*coi",
            "declension": [{
                "val": "me","g": "x","n": "s","pe": 1
            },{
                "val": "nous","g": "x","n": "p","pe": 1
            },{
                "val": "te","g": "x","n": "s","pe": 2
            },{
                "val": "vous","g": "x","n": "p","pe": 2
            },{
                "val": "lui","g": "x","n": "s","pe": 3
            },{
                "val": "leur","g": "x","n": "p","pe": 3
            }]
        },
        "pn4":{
            "ending":"moi",
            "declension":[{
                "val":"moi", "g":"x", "n":"s", "pe":1, "tn":""
            },{
                "val":"moi-même", "g":"x", "n":"s", "pe":1, "tn":"refl"
            },{
                "val":"je", "g":"x", "n":"s", "pe":1, "c":"nom"
            },{
                "val":"me", "g":"x", "n":"s", "pe":1, "c":"acc"
            },{
                "val":"me", "g":"x", "n":"s", "pe":1, "c":"dat"
            },{
                "val":"me", "g":"x", "n":"s", "pe":1, "c":"refl"
            },{
                "val":"nous", "g":"x", "n":"p", "pe":1, "tn":""
            },{
                "val":"nous-mêmes", "g":"x", "n":"p", "pe":1, "tn":"refl"
            },{
                "val":"nous", "g":"x", "n":"p", "pe":1, "c":"nom"
            },{
                "val":"nous", "g":"x", "n":"p", "pe":1, "c":"acc"
            },{
                "val":"nous", "g":"x", "n":"p", "pe":1, "c":"dat"
            },{
                "val":"nous", "g":"x", "n":"p", "pe":1, "c":"refl"
            },{
                "val":"toi", "g":"x", "n":"s", "pe":2, "tn":""
            },{
                "val":"toi-même", "g":"x", "n":"s", "pe":2, "tn":"refl"
            },{
                "val":"tu", "g":"x", "n":"s", "pe":2, "c":"nom"
            },{
                "val":"te", "g":"x", "n":"s", "pe":2, "c":"acc"
            },{
                "val":"te", "g":"x", "n":"s", "pe":2, "c":"dat"
            },{
                "val":"te", "g":"x", "n":"s", "pe":2, "c":"refl"
            },{
                "val":"vous", "g":"x", "n":"p", "pe":2, "tn":""
            },{
                "val":"vous-mêmes", "g":"x", "n":"p", "pe":2, "tn":"refl"
            },{
                "val":"vous", "g":"x", "n":"p", "pe":2, "c":"nom"
            },{
                "val":"vous", "g":"x", "n":"p", "pe":2, "c":"acc"
            },{
                "val":"vous", "g":"x", "n":"p", "pe":2, "c":"dat"
            },{
                "val":"vous", "g":"x", "n":"p", "pe":2, "c":"refl"
            },{
                "val":"lui", "g":"m", "n":"s", "pe":3, "tn":""
            },{
                "val":"lui-même", "g":"m", "n":"s", "pe":3, "tn":"refl"
            },{
                "val":"il", "g":"m", "n":"s", "pe":3, "c":"nom"
            },{
                "val":"le", "g":"m", "n":"s", "pe":3, "c":"acc"
            },{
                "val":"lui", "g":"m", "n":"s", "pe":3, "c":"dat"
            },{
                "val":"se", "g":"m", "n":"s", "pe":3, "c":"refl"
            },{
                "val":"elle", "g":"f", "n":"s", "pe":3, "tn":""
            },{
                "val":"elle-même", "g":"f", "n":"s", "pe":3, "tn":"refl"
            },{
                "val":"elle", "g":"f", "n":"s", "pe":3, "c":"nom"
            },{
                "val":"la", "g":"f", "n":"s", "pe":3, "c":"acc"
            },{
                "val":"lui", "g":"f", "n":"s", "pe":3, "c":"dat"
            },{
                "val":"se", "g":"f", "n":"s", "pe":3, "c":"refl"
            },{
                "val":"eux", "g":"m", "n":"p", "pe":3, "tn":""
            },{
                "val":"eux-mêmes", "g":"m", "n":"p", "pe":3, "tn":"refl"
            },{
                "val":"ils", "g":"m", "n":"p", "pe":3, "c":"nom"
            },{
                "val":"les", "g":"m", "n":"p", "pe":3, "c":"acc"
            },{
                "val":"leur", "g":"m", "n":"p", "pe":3, "c":"dat"
            },{
                "val":"se", "g":"m", "n":"p", "pe":3, "c":"refl"
            },{
                "val":"elles", "g":"f", "n":"p", "pe":3, "tn":""
            },{
                "val":"elles-mêmes", "g":"f", "n":"p", "pe":3, "tn":"refl"
            },{
                "val":"elles", "g":"f", "n":"p", "pe":3, "c":"nom"
            },{
                "val":"les", "g":"f", "n":"p", "pe":3, "c":"acc"
            },{
                "val":"leur", "g":"f", "n":"p", "pe":3, "c":"dat"
            },{
                "val":"se", "g":"f", "n":"p", "pe":3, "c":"refl"
            }]
        },
        "pn4-2s":{
            "ending":"toi",
            "declension":[{
                "val":"toi", "tn":"", "n":"s", "pe":2
            },{
                "val":"toi-même", "tn":"refl", "n":"s", "pe":2
            },{
                "val":"tu", "c":"nom", "n":"s", "pe":2
            },{
                "val":"te", "c":"acc", "n":"s", "pe":2
            },{
                "val":"te", "c":"dat", "n":"s", "pe":2
            },{
                "val":"te", "c":"refl", "n":"s", "pe":2
            }]
        },
        "pn4-3sm":{
            "ending":"lui",
            "declension":[{
                "val":"lui", "tn":"", "g":"m", "n":"s", "pe":3
            },{
                "val":"lui-même", "tn":"refl", "g":"m", "n":"s", "pe":3
            },{
                "val":"il", "c":"nom", "g":"m", "n":"s", "pe":3
            },{
                "val":"le", "c":"acc", "g":"m", "n":"s", "pe":3
            },{
                "val":"lui", "c":"dat", "g":"m", "n":"s", "pe":3
            },{
                "val":"se", "c":"refl", "g":"m", "n":"s", "pe":3
            }]
        },
        "pn4-3sf":{
            "ending":"elle",
            "declension":[{
                "val":"elle", "g":"f", "tn":"", "n":"s", "pe":3
            },{
                "val":"elle-même", "g":"f", "tn":"refl", "n":"s", "pe":3
            },{
                "val":"elle", "g":"f", "c":"nom", "n":"s", "pe":3
            },{
                "val":"la", "g":"f", "c":"acc", "n":"s", "pe":3
            },{
                "val":"lui", "g":"f", "c":"dat", "n":"s", "pe":3
            },{
                "val":"se", "g":"f", "c":"refl", "n":"s", "pe":3
            }]
        },
        "pn4-1p":{
            "ending":"nous",
            "declension":[{
                "val":"nous", "tn":"", "g":"x", "n":"p", "pe":1
            },{
                "val":"nous-mêmes", "tn":"refl", "g":"x", "n":"p", "pe":1
            },{
                "val":"nous", "c":"nom", "g":"x", "n":"p", "pe":1
            },{
                "val":"nous", "c":"acc", "g":"x", "n":"p", "pe":1
            },{
                "val":"nous", "c":"dat", "g":"x", "n":"p", "pe":1
            },{
                "val":"nous", "c":"refl", "g":"x", "n":"p", "pe":1
            }]
        },
        "pn4-2p":{
            "ending":"vous",
            "declension":[{
                "val":"vous", "tn":"", "g":"x", "n":"p", "pe":2
            },{
                "val":"vous-mêmes", "tn":"refl", "g":"x", "n":"p", "pe":2
            },{
                "val":"vous", "c":"nom", "g":"x", "n":"p", "pe":2
            },{
                "val":"vous", "c":"acc", "g":"x", "n":"p", "pe":2
            },{
                "val":"vous", "c":"dat", "g":"x", "n":"p", "pe":2
            },{
                "val":"vous", "c":"refl", "g":"x", "n":"p", "pe":2
            }]
        },
        "pn4-3pm":{
            "ending":"eux",
            "declension":[{
                "val":"eux", "tn":"", "g":"m", "n":"p", "pe":3
            },{
                "val":"eux-mêmes", "tn":"refl", "g":"m", "n":"p", "pe":3
            },{
                "val":"ils", "c":"nom", "g":"m", "n":"p", "pe":3
            },{
                "val":"les", "c":"acc", "g":"m", "n":"p", "pe":3
            },{
                "val":"leur", "c":"dat", "g":"m", "n":"p", "pe":3
            },{
                "val":"se", "c":"refl", "g":"m", "n":"p", "pe":3
            }]
        },
        "pn4-3pf":{
            "ending":"elles",
            "declension":[{
                "val":"elles", "g":"f", "tn":"", "g":"f", "n":"p", "pe":3
            },{
                "val":"elles-mêmes", "g":"f", "tn":"refl", "g":"f", "n":"p", "pe":3
            },{
                "val":"elles", "g":"f", "c":"nom", "g":"f", "n":"p", "pe":3
            },{
                "val":"les", "g":"f", "c":"acc", "g":"f", "n":"p", "pe":3
            },{
                "val":"leur", "g":"f", "c":"dat", "g":"f", "n":"p", "pe":3
            },{
                "val":"se", "g":"f", "c":"refl", "g":"f", "n":"p", "pe":3
            }]
        },
        "pn5": {
            "ending": "mézigue",
            "declension": [{
                "val": "mézigue","g": "m","n": "s","pe": 1
            },{
                "val": "mézigues","g": "m","n": "p","pe": 1
            },{
                "val": "tézigue","g": "m","n": "s","pe": 2
            },{
                "val": "tézigues","g": "m","n": "p","pe": 2
            },{
                "val": "sézigue","g": "m","n": "s","pe": 3
            },{
                "val": "sézigues","g": "m","n": "p","pe": 3
            }]
        },
        "pn6": {
            "ending": "me*refl",
            "declension": [{
                "val": "me","g": "x","n": "s","pe": 1
            },{
                "val": "nous","g": "x","n": "p","pe": 1
            },{
                "val": "te","g": "x","n": "s","pe": 2
            },{
                "val": "vous","g": "x","n": "p","pe": 2
            },{
                "val": "se","g": "x","n": "x","pe": 3
            }]
        },
        "pn7": {
            "ending": "moi*refl",
            "declension": [{
                "val": "moi","g": "x","n": "s","pe": 1
            },{
                "val": "nous","g": "x","n": "p","pe": 1
            },{
                "val": "toi","g": "x","n": "s","pe": 2
            },{
                "val": "vous","g": "x","n": "p","pe": 2
            },{
                "val": "soi","g": "x","n": "x","pe": 3
            }]
        },
        "pn8": {
            "ending": "moi-même",
            "declension": [{
                "val": "moi-même","g": "x","n": "s","pe": 1
            },{
                "val": "nous-mêmes","g": "x","n": "p","pe": 1
            },{
                "val": "toi-même","g": "x","n": "s","pe": 2
            },{
                "val": "vous-mêmes","g": "x","n": "p","pe": 2
            },{
                "val": "lui-même","g": "m","n": "s","pe": 3
            },{
                "val": "elle-même","g": "f","n": "s","pe": 3
            },{
                "val": "eux-mêmes","g": "m","n": "p","pe": 3
            },{
                "val": "elles-mêmes","g": "f","n": "p","pe": 3
            }]
        },
        "pn9": {
            "ending": "soi-même",
            "declension": [{
                "val": "soi-même","g": "x","n": "s","pe": 3
            }]
        },
        "pn10": {
            "ending": "en",
            "declension": [{
                "val": "en","g": "x","n": "x"
            }]
        },
        "pn11": {
            "ending": "y",
            "declension": [{
                "val": "y","g": "x","n": "x"
            }]
        },
        "pn12":{
            "ending":"mien",
            "declension":[{
                "val":"mien", "g":"m", "n":"s", "pe":1
            },{
                "val":"mienne", "g":"f", "n":"s", "pe":1
            },{
                "val":"miens", "g":"m", "n":"p", "pe":1
            },{
                "val":"miennes", "g":"f", "n":"p", "pe":1
            },{
                "val":"tien", "g":"m", "n":"s", "pe":2
            },{
                "val":"tienne", "g":"f", "n":"s", "pe":2
            },{
                "val":"tiens", "g":"m", "n":"p", "pe":2
            },{
                "val":"tiennes", "g":"f", "n":"p", "pe":2
            },{
                "val":"sien", "g":"m", "n":"s", "pe":3
            },{
                "val":"sienne", "g":"f", "n":"s", "pe":3
            },{
                "val":"siens", "g":"m", "n":"p", "pe":3
            },{
                "val":"siennes", "g":"f", "n":"p", "pe":3
            }]
        },
        "pn12-2":{
            "ending":"tien",
            "declension":[{
                "val":"tien", "g":"m", "n":"s", "pe":2
            },{
                "val":"tienne", "g":"f", "n":"s", "pe":2
            },{
                "val":"tiens", "g":"m", "n":"p", "pe":2
            },{
                "val":"tiennes", "g":"f", "n":"p", "pe":2
            }]
        },
        "pn12-3":{
            "ending":"sien",
            "declension":[{
                "val":"sien", "g":"m", "n":"s", "pe":3
            },{
                "val":"sienne", "g":"f", "n":"s", "pe":3
            },{
                "val":"siens", "g":"m", "n":"p", "pe":3
            },{
                "val":"siennes", "g":"f", "n":"p", "pe":3
            }]
        },
        "pn13":{
            "ending":"nôtre",
            "declension":[{
                "val":"nôtre", "g":"m", "n":"s", "pe":1
            },{
                "val":"nôtre", "g":"f", "n":"s", "pe":1
            },{
                "val":"nôtres", "g":"m", "n":"p", "pe":1
            },{
                "val":"nôtres", "g":"f", "n":"p", "pe":1
            },{
                "val":"vôtre", "g":"m", "n":"s", "pe":2
            },{
                "val":"vôtre", "g":"f", "n":"s", "pe":2
            },{
                "val":"vôtres", "g":"m", "n":"p", "pe":2
            },{
                "val":"vôtres", "g":"f", "n":"p", "pe":2
            },{
                "val":"leur", "g":"m", "n":"s", "pe":3
            },{
                "val":"leur", "g":"f", "n":"s", "pe":3
            },{
                "val":"leurs", "g":"m", "n":"p", "pe":3
            },{
                "val":"leurs", "g":"f", "n":"p", "pe":3
            }]
        },
        "pn13-2":{
            "ending":"vôtre",
            "declension":[{
                "val":"vôtre", "g":"m", "n":"s", "pe":2
            },{
                "val":"vôtre", "g":"f", "n":"s", "pe":2
            },{
                "val":"vôtres", "g":"m", "n":"p", "pe":2
            },{
                "val":"vôtres", "g":"f", "n":"p", "pe":2
            }]
        },
        "pn13-3":{
            "ending":"leur",
            "declension":[{
                "val":"leur", "g":"m", "n":"s", "pe":3
            },{
                "val":"leur", "g":"f", "n":"s", "pe":3
            },{
                "val":"leurs", "g":"m", "n":"p", "pe":3
            },{
                "val":"leurs", "g":"f", "n":"p", "pe":3
            }]
        },
        "pn14": {
            "ending": "ce",
            "declension": [{
                "val": "ce","g": "n","n": "s","pe": 3
            }]
        },
        "pn15": {
            "ending": "celui",
            "declension": [{
                "val": "celui","g": "m","n": "s","pe": 3
            },{
                "val": "celle","g": "f","n": "s","pe": 3
            },{
                "val": "ceux","g": "m","n": "p","pe": 3
            },{
                "val": "celles","g": "f","n": "p","pe": 3
            }]
        },
        "pn16": {
            "ending": "ceci",
            "declension": [{
                "val": "ceci","g": "n","n": "s","pe": 3
            }]
        },
        "pn17": {
            "ending": "celui-ci",
            "declension": [{
                "val": "celui-ci","g": "m","n": "s","pe": 3
            },{
                "val": "celle-ci","g": "f","n": "s","pe": 3
            },{
                "val": "ceux-ci","g": "m","n": "p","pe": 3
            },{
                "val": "celles-ci","g": "f","n": "p","pe": 3
            }]
        },
        "pn18": {
            "ending": "ça",
            "declension": [{
                "val": "ça","g": "n","n": "s","pe": 3
            }]
        },
        "pn19": {
            "ending": "cela",
            "declension": [{
                "val": "cela","g": "n","n": "s","pe": 3
            }]
        },
        "pn20": {
            "ending": "celui-là",
            "declension": [{
                "val": "celui-là","g": "m","n": "s","pe": 3
            },{
                "val": "celle-là","g": "f","n": "s","pe": 3
            },{
                "val": "ceux-là","g": "m","n": "p","pe": 3
            },{
                "val": "celles-là","g": "f","n": "p","pe": 3
            }]
        },
        "pn21": {
            "ending": "qui",
            "declension": [{
                "val": "qui","g": "m","n": "s","pe": 3
            },{
                "val": "qui","g": "f","n": "s","pe": 3
            },{
                "val": "qui","g": "m","n": "p","pe": 3
            },{
                "val": "qui","g": "f","n": "p","pe": 3
            }]
        },
        "pn22": {
            "ending": "que",
            "declension": [{
                "val": "que","g": "m","n": "s"
            },{
                "val": "que","g": "f","n": "s"
            },{
                "val": "que","g": "m","n": "p"
            },{
                "val": "que","g": "f","n": "p"
            }]
        },
        "pn23": {
            "ending": "dont",
            "declension": [{
                "val": "dont","g": "m","n": "s"
            },{
                "val": "dont","g": "f","n": "s"
            },{
                "val": "dont","g": "m","n": "p"
            },{
                "val": "dont","g": "f","n": "p"
            }]
        },
        "pn24": {
            "ending": "lequel",
            "declension": [{
                "val": "lequel","g": "m","n": "s"
            },{
                "val": "laquelle","g": "f","n": "s"
            },{
                "val": "lesquels","g": "m","n": "p"
            },{
                "val": "lesquelles","g": "f","n": "p"
            }]
        },
        "pn25": {
            "ending": "auquel",
            "declension": [{
                "val": "auquel","g": "m","n": "s"
            },{
                "val": "à laquelle","g": "f","n": "s"
            },{
                "val": "auxquels","g": "m","n": "p"
            },{
                "val": "auxquelles","g": "f","n": "p"
            }]
        },
        "pn26": {
            "ending": "duquel",
            "declension": [{
                "val": "duquel","g": "m","n": "s"
            },{
                "val": "de laquelle","g": "f","n": "s"
            },{
                "val": "desquels","g": "m","n": "p"
            },{
                "val": "desquelles","g": "f","n": "p"
            }]
        },
        "pn27": {
            "ending": "où",
            "declension": [{
                "val": "où"
            }]
        },
        "pn28": {
            "ending": "quand",
            "declension": [{
                "val": "quand"
            }]
        },
        "pn29": {
            "ending": "quoi",
            "declension": [{
                "val": "quoi"
            }]
        },
        "pn30": {
            "ending": "qui",
            "declension": [{
                "val": "qui"
            }]
        },
        "pn31": {
            "ending": "que",
            "declension": [{
                "val": "que"
            }]
        },
        "pn32": {
            "ending": "comment",
            "declension": [{
                "val": "comment"
            }]
        },
        "pn33": {
            "ending": "combien",
            "declension": [{
                "val": "combien"
            }]
        },
        "pn34": {
            "ending": "pourquoi",
            "declension": [{
                "val": "pourquoi"
            }]
        },
        "pn35": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "le","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "lles","g": "f","n": "p"
            }]
        },
        "d1": {
            "ending": "le",
            "declension": [{
                "val": "le","g": "m","n": "s"
            },{
                "val": "la","g": "f","n": "s"
            },{
                "val": "les","g": "m","n": "p"
            },{
                "val": "les","g": "f","n": "p"
            }]
        },
        "d2": {
            "ending": "au",
            "declension": [{
                "val": "au","g": "m","n": "s"
            },{
                "val": "à la","g": "f","n": "s"
            },{
                "val": "aux","g": "m","n": "p"
            },{
                "val": "aux","g": "f","n": "p"
            }]
        },
        "d3": {
            "ending": "du",
            "declension": [{
                "val": "du","g": "m","n": "s"
            },{
                "val": "de la","g": "f","n": "s"
            },{
                "val": "des","g": "m","n": "p"
            },{
                "val": "des","g": "f","n": "p"
            }]
        },
        "d4": {
            "ending": "un",
            "declension": [{
                "val": "un","g": "m","n": "s"
            },{
                "val": "une","g": "f","n": "s"
            },{
                "val": "des","g": "m","n": "p"
            },{
                "val": "des","g": "f","n": "p"
            }]
        },
        "d5":{
            "ending":"mon",
            "declension":[{
                "val":"mon", "g":"m", "n":"s", "pe":1
            },{
                "val":"ma", "g":"f", "n":"s", "pe":1
            },{
                "val":"mes", "g":"m", "n":"p", "pe":1
            },{
                "val":"mes", "g":"f", "n":"p", "pe":1
            },{
                "val":"ton", "g":"m", "n":"s", "pe":2
            },{
                "val":"ta", "g":"f", "n":"s", "pe":2
            },{
                "val":"tes", "g":"m", "n":"p", "pe":2
            },{
                "val":"tes", "g":"f", "n":"p", "pe":2
            },{
                "val":"son", "g":"m", "n":"s", "pe":3
            },{
                "val":"sa", "g":"f", "n":"s", "pe":3
            },{
                "val":"ses", "g":"m", "n":"p", "pe":3
            },{
                "val":"ses", "g":"f", "n":"p", "pe":3
            }]
        },
        "d5-2":{
            "ending":"ton",
            "declension":[{
                "val":"ton", "g":"m", "n":"s"
            },{
                "val":"ta", "g":"f", "n":"s"
            },{
                "val":"tes", "g":"m", "n":"p"
            },{
                "val":"tes", "g":"f", "n":"p"
            }]
        },
        "d5-3":{
            "ending":"son",
            "declension":[{
                "val":"son", "g":"m", "n":"s"
            },{
                "val":"sa", "g":"f", "n":"s"
            },{
                "val":"ses", "g":"m", "n":"p"
            },{
                "val":"ses", "g":"f", "n":"p"
            }]
        },
        "d6":{
            "ending":"notre",
            "declension":[{
                "val":"notre", "g":"m", "n":"s", "pe":1
            },{
                "val":"notre", "g":"f", "n":"s", "pe":1
            },{
                "val":"nos", "g":"m", "n":"p", "pe":1
            },{
                "val":"nos", "g":"f", "n":"p", "pe":1
            },{
                "val":"votre", "g":"m", "n":"s", "pe":2
            },{
                "val":"votre", "g":"f", "n":"s", "pe":2
            },{
                "val":"vos", "g":"m", "n":"p", "pe":2
            },{
                "val":"vos", "g":"f", "n":"p", "pe":2
            },{
                "val":"leur", "g":"m", "n":"s", "pe":3
            },{
                "val":"leur", "g":"f", "n":"s", "pe":3
            },{
                "val":"leurs", "g":"m", "n":"p", "pe":3
            },{
                "val":"leurs", "g":"f", "n":"p", "pe":3
            }]
        },
        "d6-2":{
            "ending":"votre",
            "declension":[{
                "val":"votre", "g":"m", "n":"s"
            },{
                "val":"votre", "g":"f", "n":"s"
            },{
                "val":"vos", "g":"m", "n":"p"
            },{
                "val":"vos", "g":"f", "n":"p"
            }]
        },
        "d6-3":{
            "ending":"leur",
            "declension":[{
                "val":"leur", "g":"m", "n":"s"
            },{
                "val":"leur", "g":"f", "n":"s"
            },{
                "val":"leurs", "g":"m", "n":"p"
            },{
                "val":"leurs", "g":"f", "n":"p"
            }]
        },
        "d7": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "tte","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "s","g": "f","n": "p"
            }]
        },
        "d8": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "le","g": "f","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            },{
                "val": "les","g": "f","n": "p"
            }]
        }
    },
    "punctuation": {
        "pc1": {
            "b": "",
            "a": ""
        },
        "pc2": {
            "b": " ",
            "a": " "
        },
        "pc3": {
            "b": " ",
            "a": ""
        },
        "pc4": {
            "b": "",
            "a": " "
        },
        "pc5": {
            "b": " ",
            "a": "",
            "pos": "l"
        },
        "pc6": {
            "b": "",
            "a": " ",
            "pos": "r"
        },
        "pc7": {
            "b": " ",
            "a": " ",
            "pos": "l"
        },
        "pc8": {
            "b": " ",
            "a": " ",
            "pos": "r"
        }
    },
    "sentence_type": {
        "exc": {
            "type": "exclamative",
            "punctuation": "!"
        },
        "int": {
            "type": "interrogative",
            "punctuation": "?",
            "prefix": {
                "base": "est-ce que",
                "yon": "est-ce que",
                "wos": "qui est-ce qui",
                "wod": "qui est-ce que",
                "woi": "à qui est-ce que",
                "wad": "qu'est-ce que",
                "whe": "où est-ce que",
                "how": "comment est-ce que",
                "whn": "quand est-ce que",
                "why": "pourquoi est-ce que",
                "muc": "combien"
            }
        },
        "dec": {
            "type": "declarative",
            "punctuation": "."
        }
    },
    "propositional": {
        "base": "que",
        "subject": "qui",
        "pronoun": {
            "alias": "pro",
            "type": "Pro"
        },
        "cdInfo": {
            "alias": "cdInfo"
        }
    },
    "regular": {
        "av": {
            "ending": "",
            "option": [{
                "val": ""
            }]
        },
        "ave": {
            "ending": "e",
            "option": [{
                "val": "e"
            },{
                "val": "'"
            }]
        },
        "pp": {
            "ending": "",
            "option": [{
                "val": ""
            }]
        },
        "ppe": {
            "ending": "e",
            "option": [{
                "val": "e"
            },{
                "val": "'"
            }]
        }
    },
    "verb_option": {
        "neg": {
            "prep1": "ne",
            "prep2": "pas",
            "autres": ["pas","jamais","plus","guère","nullement","rien","que"]
        },
        "prog": {
            "aux": "être",
            "keyword": "en train de"
        },
        "modalityVerb":{
             "possibility":"pouvoir",
             "permission":"pouvoir",
             "necessity":"devoir",
             "willingness":"vouloir",
             "obligation":"devoir"
        }
    },
    "usePronoun": {
        "S": "je",
        "VP": "le",
        "PP": "moi",
        "Pro": "moi"
    },
    "date": {
        "format": {
            "non_natural": {
                "year-month-date-day": "[l] [d]\/[M]\/[Y]",
                "year-month-date": "[d]\/[M]\/[Y]",
                "year-month": "[M]\/[Y]",
                "month-date": "[d]\/[M]",
                "month-date-day": "[l] [d]\/[M]",
                "year": "[Y]",
                "month": "[m]",
                "date": "[d]",
                "day": "[l]",
                "hour:minute:second": "[H0]:[m0]:[s0]",
                "hour:minute": "[H0]:[m0]",
                "minute:second": "[m0]:[s0]",
                "hour": "[H]",
                "minute": "[m]",
                "second": "[s]"
            },
            "natural": {
                "year-month-date-day": "le [l] [d] [F] [Y]",
                "year-month-date": "le [d] [F] [Y]",
                "year-month": "en [F] [Y]",
                "month-date": "le [d] [F]",
                "month-date-day": "le [l] [d] [F]",
                "year": "en [Y]",
                "month": "en [F]",
                "date": "le [d]",
                "day": "le [l]",
                "hour:minute:second": "à [H] h [m] min [s] s",
                "hour:minute": "à [H] h [m]",
                "minute:second": "à [m] min [s] s",
                "hour": "à [H] h",
                "minute": "à [i] min",
                "second": "à [s] s"
            },
            "relative_time": {
                "-": "il y a [x] jours",
                "-6": "[l] dernier",
                "-5": "[l] dernier",
                "-4": "[l] dernier",
                "-3": "[l] dernier",
                "-2": "avant-hier",
                "-1": "hier",
                "0": "aujourd'hui",
                "1": "demain",
                "2": "après-demain",
                "3": "[l] prochain",
                "4": "[l] prochain",
                "5": "[l] prochain",
                "6": "[l] prochain",
                "+": "dans [x] jours"
            }
        },
        "text": {
            "weekday": ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
            "month": {
                "1": "janvier",
                "2": "février",
                "3": "mars",
                "4": "avril",
                "5": "mai",
                "6": "juin",
                "7": "juillet",
                "8": "août",
                "9": "septembre",
                "10": "octobre",
                "11": "novembre",
                "12": "décembre"
            }
        }
    },
    "number": {
        "symbol": {
            "group": " ",
            "decimal": ","
        },
        "number": ["zéro"]
    },
    "union": "ou"
}
/**
    jsRealB 3.2
    Guy Lapalme, lapalme@iro.umontreal.ca, February 2020
 */
"use strict";

// Output of warnings:
// it uses jsRealB for the realization of messages
// not sure this design is simpler, but it shows how jsRealB can be used for realizing its own messages

// add words to the basic lexicon for use in the warnings
//  the lexical information is taken from dmf and dme
loadFr();
addToLexicon("aucun",{ D: { tab: [ 'd4' ] }})
addToLexicon("comme",{ Adv: { tab: [ 'av' ] }, C: { tab: [ 'cj' ] } })
addToLexicon("contraction",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("français",{ A: { tab: [ 'n27' ] }, N: { g: 'm', tab: [ 'n35' ] } })
addToLexicon("illégal",{ A: { tab: [ 'n47' ] } });
addToLexicon("implémenter",{ V: { aux: [ 'av' ], tab: 'v36' } })
addToLexicon("lexique",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("option",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("morphologie",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("ordinal",{ A: { tab: [ 'n47' ] }, N: { g: 'm', tab: [ 'n5' ] } })
addToLexicon("paramètre",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("pronom",{N: {g: "m", tab: ["n3"]}});

loadEn();
addToLexicon("as",{ Adv: { tab: [ 'b1' ]}})
addToLexicon("French",{ A: { tab: [ 'a1' ] }, N: { tab: [ 'n5' ] } })
addToLexicon("implement",{ N: { tab: [ 'n1' ] }, V: { tab: 'v1' } })
addToLexicon("lexicon",{ N: { tab: [ 'n1' ] } })
addToLexicon("morphology",{ N: { tab: [ 'n5' ] } })
addToLexicon("ordinal",{ A: { tab: [ 'a1' ] }, N: { tab: [ 'n1' ] } })
addToLexicon("pronoun",{N: {tab: ["n1"]}})

// generate a warning message in the current language
//   the first argument must correspond to a key in the warnings table
Constituent.prototype.warn = function(_){
    let args=Array.from(arguments);
    let mess;
    const lang=getLanguage();
    // load the current language, 
    // HACK:  wrap object with parentheses so that the parser does not think this is the start of a block
    ({en:loadEn,fr:loadFr})[lang](); 
    const messFns = this.warnings[args.shift()];  // get the English and French jsRealB structure
    if (messFns===undefined){
        this.error("warn called with an unknown error message:"+arguments[0])
    }
    mess=this.me()+":: "+ messFns[lang].apply(null,args).cap(false) // realize the warning 
    if (exceptionOnWarning) throw mess;
    console.warn(mess);
    return this;
}

// create a list of elements [a,b,c] => "a, b $conj c" 
const makeDisj = function(conj,elems){
    return CP.apply(null,[C(conj)].concat(elems.map(e=>Q(e))))+""
}

// table of jsRealB structures for warning messages
//   the warnings are parameterized by strings that are inserted verbatim in the realization
Constituent.prototype.warnings = {
    "bad parameter":
        {en:(good,bad)=> // the parameter should be $good, not $bad
            S(NP(D("the"),N("parameter")),
              VP(V("be").t("ps"),Q(good).a(","),Adv("not"),Q(bad))).typ({mod:"nece"}),
         fr:(good,bad)=> // le paramètre devrait être $good, pas $bad
            S(NP(D("le"),N("paramètre")),
              VP(V("être").t("c"),Q(good).a(","),Adv("pas"),Q(bad))).typ({mod:"nece"})},
    "bad application":
        {en:(info,goods,bad)=> // $info should be applied to $good, not to $bad
            S(Q(info),VP(V("apply").t("ps"),
                         PP(P("to"),makeDisj("or",goods)).a(","),Adv("not"),PP(P("to"),Q(bad))))
               .typ({mod:"nece",pas:true}),
         fr:(info,goods,bad)=> // $info devrait être appliqué à $good, non à $bad.
            S(Q(info),VP(V("appliquer").t("c"),
                         PP(P("à"),makeDisj("ou",goods)).a(','),Adv("non"),PP(P("à"),Q(bad))))
              .typ({mod:"nece",pas:true})},
    "bad position":
        {en:(bad,limit)=> // $bad should be smaller than $limit.
            S(NO(bad),VP(V("be").t("ps"),A("small").f("co"),P("than"),NO(limit))).typ({mod:"nece"}),
         fr:(bad,limit)=> // $bad devrait être plus petit que $limit.
            S(NO(bad),VP(V("être").t("c"),A("petit").f("co"),Pro("que"),NO(limit))).typ({mod:"nece"})},
    "bad const for option":
        {en:(option,constType,allowedConsts)=> 
            // option $option is applied to $constType, but it should be $allowedConsts.
              CP(C("but"),
                 VP(V("apply"),NP(N("option"),Q(option)),PP(P("to"),Q(constType))).typ({pas:true}).a(","),
                 VP(Pro("I"),V("be").t("ps"),makeDisj("or",allowedConsts)).typ({mod:"nece"})
              ),
         fr:(option,constType,allowedConsts)=>
              //  l'option $option est appliquée à $constType, mais elle devrait être $allowedConsts
              CP(C("mais"),
                 VP(V("appliquer"),NP(D("le"),N("option"),Q(option)),PP(P("à"),Q(constType)))
                    .typ({pas:true}).a(","),
                 VP(Pro("je").g("f"),V("être").t("c"),makeDisj("ou",allowedConsts)).typ({mod:"nece"})
              )},
    "ignored value for option":
        {en:(option,bad)=> // $bad: bad value for option $option is ignored.
            S(Q(bad).a(":"),
              VP(V("ignore"),NP(D("this"),A("bad"),N("value"),
                                PP(P("for"),N("option"),Q(option)))).typ({pas:true})),
         fr:(option,bad)=>  // $bad : cette mauvaise valeur pour l'option $option est ignorée
            S(Q(bad).a(":"),
              VP(V("ignorer"),NP(D("ce"),A("mauvais"),N("valeur"),
                                 PP(P("pour"),D("le"),N("option"),Q(option)))).typ({pas:true}))},
    "unknown type":
        {en:(key,allowedTypes) => // illegal type: $key, it should be $allowedTypes.
            S(NP(A("illegal"),N("type").a(":"),Q(key)).a(","),
              VP(Pro("I"),V("be").t("ps"),makeDisj("or",allowedTypes))).typ({mod:"nece"}),
         fr:(key,allowedTypes) => // type illégal : $key, il devrait être $allowedTypes.
            S(NP(N("type"),A("illégal").a(":"),Q(key)).a(","),
              VP(Pro("je"),V("être").t("c"),makeDisj("ou",allowedTypes))).typ({mod:"nece"})},
    "no value for option":
        {en:(option,validVals)=> // no value for option $option should be one of $validVals.
            S(NP(Adv("no"),N("value"),PP(P("for"),N("option"),Q(option))),
              VP(V("be").t("ps"),Pro("one"),PP(P("of"),Q(validVals)))).typ({mod:"nece"}),
         fr:(option,validVals)=> // aucune valeur pour l'option $option, devrait être une parmi $validVals.
            S(NP(D("aucun"),N("valeur"),PP(P("pour"),D("le"),N("option"),Q(option))).a(","),
              VP(V("être").t("c"),D("un").g("f"),PP(P("parmi"),Q(validVals)))).typ({mod:"nece"})},
    "not found":
        {en:(missing,context)=> // no $missing found in $context.
            S(AdvP(Adv("no"),Q(missing)),VP(V("find").t("pp"),PP(P("in"),Q(context)))),
         fr:(missing,context)=> // aucun $missing trouvé dans $context.
            S(D("aucun"),Q(missing),VP(V("trouver").t("pp"),PP(P("dans"),Q(context))))},
    "bad ordinal":
        {en:(value)=> // cannot realize $value as ordinal.
            S(VP(V("realize"),Q(value),AdvP(Adv("as"),N("ordinal")))).typ({neg:true,mod:"poss"}),
         fr:(value)=> // $value ne peut pas être réalisé comme un ordinal.
            S(Q(value),VP(V("réaliser"),AdvP(Adv("comme"),NP(D("un"),N("ordinal")))))
              .typ({neg:true,mod:"poss",pas:true})},
    "bad number in word":
        {en:(value)=> // cannot realize $value in words.
            S(VP(V("realize"),Q(value),PP(P("in"),N("word").n("p")))).typ({neg:true,mod:"poss"}),
         fr:(value)=>// $value ne peut pas être réalisé en mots.
            S(VP(Q(value),V("réaliser"),PP(P("en"),NP(N("mot").n("p"))))).typ({neg:true,mod:"poss",pas:true})},
    "no French contraction":
        {en:()=> // contraction is ignored in French.
            S(VP(V("ignore"),NP(N("contraction")),PP(P("in"),N("French")))).typ({pas:true}),
         fr:()=> // la contraction est ignorée en français.
            S(VP(V("ignorer"),NP(D("le"),N("contraction")),PP(P("en"),N("français")))).typ({pas:true})},
    "morphology error":
        {en:(info)=> // morphology error: $info.
            S(NP(N("morphology"),N("error")).a(":"),Q(info)),
         fr:(info)=> // erreur de morphologie : $info.
            S(NP(N("erreur"),PP(P("de"),N("morphologie"))).a(":"),Q(info))},
    "not implemented":
        {en:(info)=> // $info is not implemented.
            S(Q(info),VP(V("implement"))).typ({neg:true,pas:true}),
         fr:(info)=> // $info n'est pas implémenté.
            S(Q(info),VP(V("implémenter"))).typ({neg:true,pas:true})},
    "not in lexicon":
        {en:()=> // not found in lexicon.
            S(Adv("not"),V("find").t("pp"),PP(P("in"),N("lexicon"))),
         fr:()=> // absent du lexique.
            S(AP(A("absent"),PP(P("de"),NP(D("le"),N("lexique")))))},
    "no appropriate pronoun":
        {en:()=>S(VP(V("find").t("ps"),NP(N("pronoun")))).typ({neg:true,pas:true,mod:"poss"}),
         fr:()=>S(VP(V("trouver").t("pc"),NP(N("pronom")))).typ({neg:true,pas:true,mod:"poss"})
        },
    "both tonic and clitic":
        {en:()=>// tn(..) and c(..) cannot be used together, tn(..) is ignored.
             S(CP(C("and"),Q("tn(..)"),Q("c(..)")),VP(V("use").n("p"),Adv("together"))
                  .typ({neg:true,pas:true,mod:"poss"}).a(","),
               Q("tn(..)"),VP(V("ignore")).typ({pas:true})),
         fr:()=>// tn(..) et c(..) utilisés ensemble, tn(..) est ignoré.
             S(CP(C("et"),Q("tn(..)"),Q("c(..)")),VP(V("utiliser").t("pp").n("p"),Adv("ensemble")).a(","),
               Q("tn(..)"),VP(V("ignorer")).typ({pas:true}))
        },
    "bad Constituent":
        {en:(rank,type)=> // the $rank parameter is not Constituent.
            S(NP(D("the"),Q(rank),N("parameter")),
              VP(V("be"),Q("Constituent"),Adv("but"),Q(type))).typ({neg:true}),
         fr:(rank,type)=> // le $rank paramètre n'est pas Constituent.
            S(NP(D("le"),Q(rank),N("paramètre")),
              VP(V("être"),Q("Constituent"),Adv("mais"),Q(type))).typ({neg:true})},
    "too many parameters":
        {en:(termType,number)=> // $termType accepts one parameter, but has $number.
             S(Q(termType),CP(C("but"),
                              VP(V("accept"),NP(D("a"),A("single"),N("parameter"))).a(","),
                              VP(VP(V("have"),NO(number))))),
         fr:(termType,number)=> // $termType accepte un paramètre, mais en a $number.
             S(Q(termType),CP(C("mais"),
                              VP(V("accepter"),NP(D("un"),A("seul"),N("paramètre"))).a(","),
                              VP(VP(Pro("en"),V("avoir"),NO(number)))))}
}

// function testWarnings(n){
//     for (w in warnings){
//         console.log(w)
//         N(n).warn(w,"A","B","C")
//     }
// }
jsRealB_dateCreated="2020-06-29 11:27"
//  Terminals
exports.N=N;
exports.A=A;
exports.Pro=Pro;
exports.D=D;
exports.V=V;
exports.Adv=Adv;
exports.P=P;
exports.C=C;
exports.Q=Q;
// Phrases
exports.S=S;
exports.SP=SP;
exports.CP=CP;
exports.VP=VP;
exports.NP=NP;
exports.AP=AP;
exports.PP=PP;
exports.AdvP=AdvP;

exports.DT=DT; // Dates
exports.NO=NO; // Numbers

// Utilities
exports.addToLexicon=addToLexicon; 
exports.updateLexicon=updateLexicon; 
exports.getLemma=getLemma;
exports.getLanguage=getLanguage;
exports.getLexicon=getLexicon;
exports.oneOf=oneOf;
exports.setExceptionOnWarning=setExceptionOnWarning;
// JSON
exports.fromJSON=fromJSON;
exports.ppJSON=ppJSON;

exports.jsRealB_version=jsRealB_version;
exports.jsRealB_dateCreated=jsRealB_dateCreated;

if (typeof lexiconEn !== "undefined") exports.lexiconEn=lexiconEn;
if (typeof loadEn    !== "undefined") exports.loadEn=loadEn;
if (typeof lexiconFr !== "undefined") exports.lexiconFr=lexiconFr;
if (typeof loadFr    !== "undefined") exports.loadFr=loadFr;
})(typeof exports === 'undefined'? this['jsRealB']={}: exports);
// do this only for webpage
if (this["jsRealB"]!== undefined) {
    // eval exports of file in the global namespace
    for (var v in this['jsRealB']){
        eval(v+"= this.jsRealB."+v);
    }
}

