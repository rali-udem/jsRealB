/**
    jsRealB 2.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */


// global variables 
var exceptionOnWarning=false;  // throw an exception on Warning instead of merely write on the console
var reorderVPcomplements=true; // reorder VP complements by increasing length (experimental flag)
var defaultProps; // to be filled by loadEn | loadFR
var currentLanguage, rules, lexicon;

///////////////  Constructor for a Constituent (superclass of Phrase and Terminal)
function Constituent(constType){
    this.parentConst=null;
    this.constType=constType;    
    this.prop={};
    this.realization=null;
    this.lang=currentLanguage;
}

// warning message on the console prefixed with an identification or throws an Exception
Constituent.prototype.warning = function(messEn,messFr){
    const mess=this.me()+":: "+(messFr!==undefined && getLang()=="fr"?messFr:messEn);
    if (exceptionOnWarning) throw mess;
    console.warn(mess);
    return this;
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

// get the property by following the "agreesWith" links, but keeping track of last verb 
// in case of "tense" so that it does not take the "default" tense of the subject...
Constituent.prototype.getProp = function(propName){
    // check for specific property on this element
    const val = this.prop[propName];
    if (val !== undefined) return val ; 
    // follow the agreement list
    let lastVerb;
    let current=this;
    let next=current.agreesWith;
    while (next !== undefined){
        if (current.isOneOf(["V","VP"]))lastVerb=current;
        current=next;
        next=next.agreesWith;
    }
    if (propName=="t" && lastVerb !== undefined)return lastVerb.prop["t"] || defaultProps["t"]
    return current.prop[propName] || defaultProps[propName] 
}

// get the property in the first surrounding sentence (S or SP)
Constituent.prototype.getSentProp = function(propName){
    const value=this.prop[propName];
    if (value!==undefined) return value;
    if (this.parentConst==null || this.constType=="S" || this.constType=="SP")
        return undefined;
    return this.parentConst.getSentProp(propName);
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

// Creation of "standard" options 
function genOptionFunc(option,validVals,allowedConsts,optionName){
    Constituent.prototype[option]=function(val){
        if (val===undefined){
            if (validVals !== undefined && validVals.indexOf("")<0){
                return this.warning("Option "+option+" without value; should be one of ["+validVals+"]")
            }
            val=null;
        }
        if (this.isA("CP")){// propagate an option through the children of a CP
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
                return this.warning("Option "+option+" with invalid value:"+val+" ignored");
            }
            // start of the real work...
            if (optionName===undefined)optionName=option;
            let current=this; 
            if (!contains(["pro","cap","lier","ow"],optionName)){// follow the "agreement" links except for some options
                while (current.agreesWith!==undefined)current=current.agreesWith;
            }
            current.prop[optionName]=val;
            return this;
        } else {
            return this.warning("Option "+option+" is applied to a "+this.constType+
                                " but it should be applied only on one of "+allowedConsts)
        }
    }
}

genOptionFunc("t",["p", "i", "f", "ps", "c", "s", "si", "ip", "pr", "pp", "b", // simple tenses
                   "pc", "pq", "cp", "fa", "spa", "spq"],["V","VP","S"]);  // composed tenses
genOptionFunc("g",["m","f","n","x"],["D","N","NP","A","AP","Pro","V","VP","S"]);
genOptionFunc("n",["s","p"],["D","N","NP","A","AP","Pro","V","VP","S"]);
genOptionFunc("pe",[1,2,3,'1','2','3'],["D","Pro","N","NP","V","VP","S"]);
genOptionFunc("f",["co","su"],["A","AP","Adv"]);
genOptionFunc("aux",["av","êt","aê"],["V","VP"]);

genOptionFunc("pos",["post","pre"],["A","AP"]);
genOptionFunc("pro",undefined,["N","NP"]);
// English only
genOptionFunc("ow",["s","p","x"],["D","Pro"],"own");

/// Formatting options
genOptionFunc("cap",undefined,[]);
genOptionFunc("lier",undefined,[]);

// creation of option lists
function genOptionListFunc(option){
    Constituent.prototype[option]=function(val){
        if (this.prop[option] === undefined)this.prop[option]=[];
        this.prop[option].push(val);
        return this;
    }
}

genOptionListFunc("b");
genOptionListFunc("a");
genOptionListFunc("en");

///////// specific options

// HTML tags
Constituent.prototype.tag = function(name,attrs){
    if (attrs === undefined)attrs="";
    if (this.prop["tag"] === undefined)this.prop["tag"]=[];
    this.prop["tag"].push([name,attrs]);
    return this;
}

// date options
Constituent.prototype.dOpt = function(dOptions){
    if (this.isA("DT")){
        const allowedKeys =["year" , "month" , "date" , "day" , "hour" , "minute" , "second" , "nat", "det", "rtime"];
        const keys=Object.keys(dOptions);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (allowedKeys.indexOf(key)>=0){
                const val = dOptions[key];
                if (typeof val == "boolean"){
                    this.dateOpts[key]=val
                } else {
                    this.warning("dOpt: the value of "+key+" should be a boolean not "+val);
                }
            } else {
                this.warning(key+ "is not an allowed key in dOpt fo DT");
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
                        this.noOptions["mprecision"]=val
                    } else {
                        this.warning("mprecision should be a number not "+val)
                    }
                } else if (typeof val =="boolean"){
                    this.noOptions[key]=val
                } else {
                    this.warning(".dOpt("+key+") for NO should be boolean not "+val)
                }
            } else {
                this.warning(key+ "is not an allowed key in dOpt for NO");
            }
        }
    } else {
        this.warning(".dOpt should only be applied to a DT or a NO not a "+this.constType);
    }
    return this;
}

// number option
Constituent.prototype.nat= function(isNat){
    if (this.isOneOf(["DT","NO"])){
        const options=this.isA("DT")?this.dateOpts:this.noOptions;
        if (isNat === undefined){
            options.nat=false;
        } else if (typeof isNat == "boolean"){
            options.nat=isNat;
        } else {
            this.warning("nat: the value of the argument should be a boolean not "+isNat);
        }
    } else {
        this.warning(".nat should only be applied to a DT or a NO not a "+this.constType);
    }
    return this;
}

// propagate information from the subject to the verb in this Phrase or Terminal
Constituent.prototype.verbAgreeWith = function(subject){
    if (this.isA("VP")){
        const v=this.getConst("V");
        if (v!==undefined){
            this.agreesWith=v;
            v.agreesWith=subject;
            if (v.lemma=="être"){// attribut du sujet
                const apa=this.getConst(["AP","A"])
                if (apa !== undefined){
                    if (apa.isA("AP")){
                        const a=apa.getConst("A");
                        if (a!== undefined){
                            apa.agreesWith=a;
                            a.agreesWith=subject;
                        }
                    } else { // apa is A
                        apa.agreesWith=subject
                    }
                }
            }
        }
    } else if (this.isA("V")){ // this is a V
        this.agreesWith=subject;
    } else {
        this.error("verbAgreeWith should be called on VP or V, not a "+this.constType)
    }
}

// regex for matching the first word in a generated string (ouch!!! it is quite subtle...) 
//  match index:
//     1-possible non-word chars and optional html tags
//     2-the real word
//     3-the rest after the word  
const sepWordREen=/((?:[^<\w'-]*(?:<[^>]+>)?)*)([\w'-]+)?(.*)/

function doElisionEn(cList){
    //// English elision rule only for changing "a" to "an"
    // according to https://owl.english.purdue.edu/owl/resource/591/1/
    const hAnRE=/^(heir|herb|honest|honou?r(able)?|hour)/i;
    //https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
    const uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
    const acronymRE=/^[A-Z]+$/
    const punctuationRE=/^\s*[,:\.\[\]\(\)\?]+\s*$/
    
    // search for terminal "a" and check if it should be "an" depending on the next word
    var last=cList.length-1;
    for (var i = 0; i < last; i++) {
        var m1=sepWordREen.exec(cList[i].realization)
        if (m1 === undefined) continue;
        var w1=m1[2]        
        if (w1=="a" && cList[i].isA("D")){
            var m2=sepWordREen.exec(cList[i+1].realization);
            if (m2 === undefined)continue;
            var w2=m2[2];
            if (/^[aeio]/i.exec(w2) ||   // starts with a vowel
                (w2.charAt(0)=="u" && !uLikeYouRE.exec(w2)) || // u does not sound like you
                hAnRE.exec(w2) ||       // silent h
                acronymRE.exec(w2)) {   // is an acronym
                    cList[i].realization=m1[1]+"an"+m1[3];
                    i++;                     // skip next word
                }
        }
    }
}

// same as sepWordREen but the [\w] class is extended with French accented letters and cedilla
// const sepWordREfr=/(([^<\wàâéèêëîïôöùüç'-]*(<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?/i
const sepWordREfr=/((?:[^<\wàâéèêëîïôöùüç'-]*(?:<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?(.*)/i

function doElisionFr(cList){
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
        if (/^[aeiouàâéèêëîïôöùü]/i.exec(realization,lemma,pos)) return true;
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
        if (elidableWordFrRE.exec(w1) && isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType)){
            cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
            i++;
        } else if (euphonieFrRE.exec(w1) && isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType)){ // euphonie
            if (/ce/i.exec(w1) && /(^est$)|(^étai)/.exec(w2)){
                // very special case but very frequent
                cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
            } else {
                cList[i].realization=m1[1]+euphonieFrTable[w1]+m1[3];
            }
            i++;
        } else if ((contr=contractionFrTable[w1+"+"+w2])!=null){
            // check if the next word would be elidable, so instead elide it instead of contracting
            if (elidableWordFrRE.exec(w2) && i+2<=last &&
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
    const punctuation=rules["punctuation"];    
    
    function getPunctString(punct){
        const punc=lexicon[punct];
        if (punc !== undefined && punc["Pc"] !== undefined){
            const tab=punc["Pc"]["tab"][0];
            const puncRule=rules["punctuation"][tab];
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
                const puncRuleBefore=rules["punctuation"][tabBefore];
                const puncRuleAfter=rules["punctuation"][tabAfter];
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
        let attString="";
        if (attrs !== "") {
            attString=Object.entries(attrs).map(
                function(entry){return " "+entry[0]+'="'+entry[1]+'"'}).join("")
        }
        return "<"+tagName+attString+">";
    }
    
    // start of processing
    
    if (this.isFr())
        doElisionFr(cList);
    else 
        doElisionEn(cList);
    
    const as = this.prop["a"];
    if (as !== undefined){
        as.forEach(function(a){wrapWith("",getPunctString(a))})
    }
    const bs = this.prop["b"];
    if (bs !== undefined){
        bs.forEach(function(b){wrapWith(getPunctString(b),"")})
    }
    const ens = this.prop["en"];
    if (ens !== undefined){
        ens.forEach(function(en){
            const ba=getBeforeAfterString(en);
            wrapWith(ba["b"],ba["a"])
        })
    }
    const cap = this.prop["cap"];
    if (cap !== undefined && cap !== false){
        const r=cList[0].realization;
        if (r.length>0){
            cList[0].realization=r.charAt(0).toUpperCase()+r.substring(1);
        }
    }
    const tags=this.prop["tag"];
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
        if (terminal.prop["lier"]!== undefined){
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
        if (this.constType=="S" && s.length>0){ // if it is a top-level S
            // force a capital at the start unless .cap(false)
            if (this.prop["cap"]!== false){
                const sepWordRE=this.isEn()?sepWordREen:sepWordREfr;
                const m=sepWordRE.exec(s);
                const idx=m[1].length; // get index of first letter
                s=s.substring(0,idx)+s.charAt(idx).toUpperCase()+s.substring(idx+1);
            }
            // and a full stop at the end unless there is already one
            // taking into account any trailing HTML tag
            const m=/ ?(<[^>]+>)*$/.exec(s);
            const idxLastChar=s.length-1-m[0].length;
            if (!contains("?!./",s.charAt(idxLastChar))){
                s=s.substring(0,idxLastChar+1)+"."+s.substring(idxLastChar+1)
            }
        }
    }
    return s;
}

// produce a string from a list of realization fields in the list of terminal
//   created by .real(), applies elision if it is the top element
Constituent.prototype.toString = function() {
    // this launches the whole realization process which forces 
    // the creation of the realization field in each Terminal
    const terminals=this.real(); 
    return this.detokenize(terminals);
}

Constituent.prototype.clone = function(){
    return eval(this.toSource());
}

// create the source for the options from the properties
Constituent.prototype.toSource = function(){
    let res="";
    let typs=[];
    Object.entries(this.prop).forEach(
        function (e) {
            const key=e[0];
            let val=e[1];
            switch (key){
            case "tag": // special case of HTML tag
                val.forEach(
                    function (tagE){
                        res+=".tag("+quote(tagE[0])
                        if(tagE[1]!="")res+=","+JSON.stringify(tagE[1])
                        res+=")";
                    }
                )
                break;
            // options to be combined in a single .typ
            case "neg": case"pas": case "prog": case "perf": case "exc":case "mod": case "int": 
                if (val===false)break;
                if (val!==true)val=quote(val);
                typs.push(key+":"+val);
                break;
            case "h": case "cod":// option to ignore
                break;
            case "own": // internal option name differs from external one... 
                res+=".ow("+quote(val)+")";
                break;
            default: // standard option but ignoring default values
                if ( !(key in defaultProps) || val!=defaultProps[key]){
                    if (typeof val === "object"){
                        val.forEach(function(ei){res+="."+key+"("+quote(ei)+")"})
                    } else {
                        res+="."+key+"("+quote(val)+")";
                    }
                }
            }
        }
    )
    return res+(typs.length==0?"":(".typ({"+typs.join()+"})"));
}