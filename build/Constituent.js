/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

// global variables 
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
    const value=this.props[propName];
    if (value!==undefined) return value;
    if (propName=="pe" || propName=="n" || propName=="g"){
        return this.peng===undefined ? undefined : this.peng[propName];
    }
    if (propName=="t" || propName=="aux"){
        return this.taux===undefined ? undefined : this.taux[propName];
    }
    return undefined;
}

Constituent.prototype.setProp = function(propName,val){
    if (propName=="pe" || propName=="n" || propName=="g"){
        if (this.peng!==undefined) this.peng[propName]=val;
    } else if (propName=="t" || propName=="aux"){
        if (this.taux!==undefined) this.taux[propName]=val;
    }
    this.props[propName]=val;
}

// should be in Terminal.prototype... but here for consistency with three previous definitions
// var pengNO=0; // useful for debugging: identifier of peng struct to check proper sharing in the debugger
// var tauxNO=0; // useful for debugging: identifier of taux struct to check proper sharing in the debugger
Constituent.prototype.initProps = function(){
    if (this.isOneOf(["N","A","D","V","NO","Pro"])){
        // "tien" and "vôtre" are very special case of pronouns which are to the second person
        this.peng={pe:defaultProps[this.lang]["pe"],
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
        let pro=Pro(this.isFr()?"moi":"me",this.lang);
        const g = this.getProp("g");
        if (g!==undefined)pro.g(g);
        const n = this.getProp("n");
        if (n!==undefined)pro.n(n);
        const pe = this.getProp("pe");
        if (pe!==undefined)pro.pe(pe);
        if (case_===undefined) return Pro(pro.toString(),this.lang).tn("");
        return Pro(pro.toString(),this.lang).c(case_) 
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
        if (this.isA("CP") && !contains(["cap","lier"],option)){
            // propagate an option through the children of a CP except for "cap" and "lier"
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
            if (quoteOOV && this.isA("Q"))return this;
            return this.warn("bad const for option",option,this.constType,allowedConsts)
        }
    }
}

// shared properties 
//   pe,n and g : can be applied to compoennts of NP and Sentences
genOptionFunc("pe",[1,2,3,'1','2','3'],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("n",["s","p","x"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
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
    // HACK: attrs == instead of === to check also for null 
    if (attrs == undefined || Object.keys(attrs).length==0){
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
                if (key == "rtime"){
                    if (typeof val=="boolean"){
                        this.props["dOpt"]["rtime"]=val?new Date():false;
                    } else if (typeof val=="string"){
                        this.props["dOpt"]["rtime"]=new Date(val)
                    } else if (val instanceof Date){
                        this.props["dOpt"]["rtime"]=val
                    } else {
                        return this.warn("bad application",".dOpt('rtime')",
                                         ["boolean","string","Date"],val);
                    }
                } else if (typeof val == "boolean"){
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
      "int": [false,"yon","wos","wod","woi","was","wad","wai","whe","why","whn","how","muc"]
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
    // Common Contractions in the English Language taken from :http://www.everythingenglishblog.com/?p=552
    const contractionEnTable={
        "are+not":"aren’t", "can+not":"can’t", "did+not":"didn’t", "do+not":"don’t", "does+not":"doesn’t", 
        "had+not":"hadn’t", "has+not":"hasn’t", "have+not":"haven’t", "is+not":"isn’t", "must+not":"mustn’t", 
        "need+not":"needn’t", "should+not":"shouldn’t", "was+not":"wasn’t", "were+not":"weren’t", 
        "will+not":"won’t", "would+not":"wouldn’t",
        "let+us":"let’s",
        "I+am":"I’m", "I+will":"I’ll", "I+have":"I’ve", "I+had":"I’d", "I+would":"I’d",
        "she+will":"she’ll", "he+is":"he’s", "he+has":"he’s", "she+had":"she’d", "she+would":"she’d",
        "he+will":"he’ll", "she+is":"she’s", "she+has":"she’s", "he+would":"he’d", "he+had":"he’d",
        "you+are":"you’re", "you+will":"you’ll", "you+would":"you’d", "you+had":"you’d", "you+have":"you’ve",
        "we+are":"we’re", "we+will":"we’ll", "we+had":"we’d", "we+would":"we’d", "we+have":"we’ve",
        "they+will":"they’ll", "they+are":"they’re", "they+had":"they’d", "they+would":"they’d", "they+have":"they’ve",
        "it+is":"it’s", "it+will":"it’ll", "it+had":"it’d", "it+would":"it’d",
        "there+will":"there’ll", "there+is":"there’s", "there+has":"there’s", "there+have":"there’ve",
        "that+is":"that’s", "that+had":"that’d", "that+would":"that’d", "that+will":"that’ll"
    } 
    // search for terminal "a" and check if it should be "an" depending on the next word
    var last=cList.length-1;
    if (last==0)return; // do not try to elide a single word
    for (var i = 0; i < last; i++) {
        var m1=sepWordREen.exec(cList[i].realization)
        if (m1 === undefined || m1[2]===undefined) continue;
        var m2=sepWordREen.exec(cList[i+1].realization)
        if (m2 === undefined || m2[2]===undefined) continue;
        // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
        // for a single word 
        var w1=m1[2];
        var w2=m2[2];
        if ((w1=="a"||w1=="A") && cList[i].isA("D")){
            if (/^[aeio]/i.exec(w2) ||   // starts with a vowel
                (/^u/i.exec(w2) && !uLikeYouRE.exec(w2)) || // u does not sound like you
                hAnRE.exec(w2) ||       // silent h
                acronymRE.exec(w2)) {   // is an acronym
                    cList[i].realization=m1[1]+w1+"n"+m1[3];
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
            let lexiconInfo=getLemma(typeof lemma == "string" ? lemma:realization,"fr"); // get the lemma with the right pos
            if (typeof lexiconInfo == "undefined"){ 
                lexiconInfo=getLemma(lemma.toLowerCase()); // check with lower case
                if (typeof lexiconInfo == "undefined")return true; // elide when unknown
            } 
            if (!(pos in lexiconInfo))pos=Object.keys(lexiconInfo)[0]; // try the first pos if current not found
            if (pos in lexiconInfo && lexiconInfo[pos].h==1) return false; // h aspiré found
            return true;
        }
        return false;
    }
    
    var contr;
    var last=cList.length-1;
    if (last==0)return; // do not try to elide a single word
    for (var i = 0; i < last; i++) {
        if (i>0 && cList[i-1].getProp("lier")!== undefined) // ignore if the preceding word is "lié" to this one
            continue;
        var m1=sepWordREfr.exec(cList[i].realization)
        if (m1 === undefined || m1[2]===undefined) continue;
        var m2=sepWordREfr.exec(cList[i+1].realization)
        if (m2 === undefined || m2[2]===undefined) continue;
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
            } else {
                const tab=punc["Pc"]["tab"][0];
                const puncRule=punctuation[tab];
                punct=puncRule["b"]+punct+puncRule["a"]
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
        as.forEach(function(a){wrapWith("",getBeforeAfterString(a)["b"])})
    }
    const bs = this.props["b"];
    if (bs !== undefined){
        bs.forEach(function(b){wrapWith(getBeforeAfterString(b)["b"],"")})
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
            // check for adding -t- in French between a verb and pronoun
            if (this.isFr() && terminal.isA("V") && terminals[i+1].isA("Pro")){
                /* According to Antidote:
                C’est le cas, notamment, quand le verbe à la 3e personne du singulier du passé, du présent ou 
                du futur de l’indicatif se termine par une autre lettre que d ou t et qu’il est suivi 
                des pronoms sujets il, elle ou on. Dans ce cas, on ajoute un ‑t‑ entre le verbe 
                et le pronom sujet inversé.*/
                if (/[^dt]$/.test(terminal.realization) && /^[ieo]/.test(terminals[i+1].realization)){
                    s+="t-";
                }
            }
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
