/**
    jsRealB 3.0
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
    const mess=this.me()+":: "+(messFr!==undefined && getLanguage()=="fr"?messFr:messEn);
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
                return this.warning("Option "+option+" without value; should be one of ["+validVals+"]",
                                    "Option "+option+" sans valeur; devrait être une parmi ["+validVals+"]")
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
                return this.warning("Option "+option+" with invalid value:"+val+" ignored",
                                    "Option "+option+" avec une valeur invalide:"+val+" ignoré");
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
                                            " but it should be applied only on one of "+allowedConsts,
                                "Option "+option+" appliquée à "+this.constType+
                                            " qui ne peut être appliquée qu'à une de "+allowedConsts)
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
                    this.warning("dOpt: the value of "+key+" should be a boolean, not "+val,
                                 "dOpt: la valeur de "+key+" devrait être booléenne, non "+val);
                }
            } else {
                this.warning(key+ "is not an allowed key in dOpt of DT",
                             key+ "n'est pas une clé permise pour dOpt de DT");
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
                        this.warning("mprecision should be a number, not "+val,
                                     "mprecision devrait être un nombre, non "+val)
                    }
                } else if (typeof val =="boolean"){
                    this.noOptions[key]=val
                } else {
                    this.warning(".dOpt("+key+") for NO should be boolean, not "+val,
                                 ".dOpt("+key+") pour NO devrait être booléenne, non "+val)
                }
            } else {
                this.warning(key+ "is not an allowed key in dOpt for NO",
                             key+ "n'est pas une clé valide pour dOpt de NO");
            }
        }
    } else {
        this.warning(".dOpt should only be applied to a DT or a NO, not a "+this.constType,
                     ".dOpt devrait être appliqué à un DT ou un NO, non à "+this.constType);
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
            this.warning("nat: the value of the argument should be a boolean, not "+isNat,
                         "nat: la valeur du paramètre devrait être booléenne, non "+isNat);
        }
    } else {
        this.warning(".nat should only be applied to a DT or a NO, not a "+this.constType,
                     ".nat devrait être appliqué à DT ou à NO, non un "+this.constType);
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
    
    const cap = this.prop["cap"];
    if (cap !== undefined && cap !== false){
        const r=cList[0].realization;
        if (r.length>0){
            cList[0].realization=r.charAt(0).toUpperCase()+r.substring(1);
        }
    }
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
            if (!contains("?!.:;/",s.charAt(idxLastChar))){
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
}/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */

////// Constructor for a Phrase (a subclass of Constituent)

// phrase (non-terminal)
function Phrase(elements,constType){
    Constituent.call(this,constType); // super constructor
    this.elements=[];
    if (elements.length>0){
        const last=elements.length-1;
        // add all elements except the last to the list of elements
        for (let i = 0; i < last; i++) {
            let e=elements[i];
            if (typeof e=="string"){
                e=Q(e);
            }
            e.parentConst=this;
            this.elements.push(e);
        }
        // terminate the list with add which does other checks on the final list
        this.add(elements[last],undefined)
    }
}
extend(Constituent,Phrase)

// add a new constituent, set agreement links
Phrase.prototype.add = function(constituent,position){
    // create constituent
    if (typeof constituent=="string"){
        constituent=Q(constituent);
    }
    constituent.parentConst=this;
    // add it to the list of elements
    if (position == undefined){
        this.elements.push(constituent);
    } else if (position<this.elements.length || position>=0){
        this.elements.splice(position,0,constituent)
    } else {
        warning("Bad position for .add:"+position+"should be less than "+this.elements.length)
    }
    // change content or content position of some children
    this.setAgreementLinks();
    for (let i = 0; i < this.elements.length; i++) {
        const e=this.elements[i];
        if (e.isA("A")){// check for adjective position
            const idx=this.getIndex("N");
            const pos=this.isFr()?(e.prop["pos"]||"post"):"pre"; // all English adjective are pre
            if (idx >= 0){
                if ((pos=="pre" && i>idx)||(pos=="post" && i<idx)){
                    const adj=this.elements.splice(i,1)[0];
                    this.elements.splice(idx,0,adj);
                }
            }
        } else if (e.isA("NP") && e.prop["pro"]!==undefined){
            e.pronominalize()
        }
    }
    return this;
}
    
Phrase.prototype.grammaticalNumber = function(){
    return this.error("grammaticalNumber must be called on a NO, not a "+this.constType);
}


// loop over children to make links between elements that should agree with each other
Phrase.prototype.setAgreementLinks = function(){
    if (this.elements.length==0)return this;
    switch (this.constType) {
    case "NP": // agrees with the first internal N, number with a possible NO
        let noNumber,noConst;
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i]
            if (e.isOneOf(["N","NP"]) && this.agreesWith===undefined){
                this.agreesWith=e;
            } else if (e.isA("NO")){
                noConst=e;
            } else if (e.isOneOf(["D","Pro","A"])){
                e.agreesWith=this;
            }
        }
        if (noConst !== undefined && this.agreesWith !== undefined){// there was a NO in the S
            this.agreesWith.prop["n"]=noConst.grammaticalNumber(); 
            // gender agreement between a French number and subject
            noConst.prop["g"]=this.agreesWith.getProp("g"); 
        }
        //   set agreement between the subject of a subordinate or the object of a subordinate
        const pro=this.getFromPath(["SP","Pro"]);
        if (pro!==undefined){
            if (contains(["qui","who"],pro.lemma)){// agrees with this NP
                pro.agreesWith=this;
            } else if (this.isFr() && pro.lemma=="que"){
                // in French past participle can agree with a cod appearing before... keep that info in case
                const v=pro.parentConst.getFromPath(["VP","V"]);
                if (v !=undefined){
                    v.prop["cod"]=this
                }
            }
        }
        break;
    case "AP": // agrees with the first internal A
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i]
            if (e.isA("A")){
                this.agreesWith=e;
                break;
            }
        }
        break;
    case "VP": // agrees with the first internal V
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i]
            if (e.isA("V")){
                this.agreesWith=e;
                break;
            }
        }
    case "AdvP": case "PP": // no agreement needed
        break;
    case "CP":
        // not sure agreement has to be done...
        break;
    case "S": case "SP":
        var iSubj=this.getIndex(["NP","N","CP","Pro"]);
        // determine subject
        if (iSubj>=0){
            let subject=this.elements[iSubj];
            if (this.isA("SP") && subject.isA("Pro") && contains(["que","that"],subject.lemma)){
                // HACK: the first pronoun  should not be a subject...
                //        so we try to find another...
                const jSubj=this.elements.slice(iSubj+1).findIndex(
                    e => e.isOneOf(["NP","N","CP","Pro"])
                );
                if (iSubj>=0){
                    subject=this.elements[iSubj+1+jSubj];
                } else {
                    // finally this generates too many spurious messages
                    // this.warning("no possible subject found");
                    return this;
                }
            }
            this.agreesWith=subject;
            const vpv=this.getFromPath([["VP",""],"V"]);
            if (vpv !== undefined){
                vpv.verbAgreeWith(subject);
                if (this.isFr() && vpv.lemma=="être"){// check for a French attribute of "ëtre"
                    const attribute=vpv.parentConst.getFromPath([["AP",""],"A"]);
                    if (attribute!==undefined){
                        attribute.agreesWith=subject;
                    }
                }
            } else {
                // check for a coordination of verbs that share the subject
                const cvs=this.getFromPath(["CP","VP"]);
                if (cvs !==undefined){
                    this.getConst("CP").elements.forEach(function(e){
                        if (e instanceof Phrase)e.verbAgreeWith(subject)
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
                                v.prop["cod"]=cp;
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
        this.error("setAgreementLinks,unimplemented type:"+this.constType)
    }
    return this;
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
Phrase.prototype.pronominalize = function(){
    if (this.isA("NP")){
        const npParent=this.parentConst
        let proS,idxV=-1;
        if (npParent!==null){
            const myself=this;
            const idxNP=npParent.elements.findIndex(e => e==myself,this);
            if (this==npParent.agreesWith){// is subject 
                proS=this.isFr()?"je":"I";
            } else if (npParent.isA("PP")){ // is indirect complement
                proS=this.isFr()?"je":"I";
            } else if (npParent.isA("SP") && npParent.elements[0].isA("Pro")){ // is relative
                proS=this.isFr()?"je":"I";
            } else {
                proS=this.isFr()?"le":"me"; // is direct complement;
                idxV=npParent.getIndex("V");
            }
            const pro=Pro(proS);
            pro.agreesWith=this.agreesWith;
            pro.prop=this.prop;
            if (this==npParent.agreesWith){
                npParent.agreesWith=pro
            }
            if (this.isFr() && proS=="le" && 
                // in French a pronominalized NP as direct object is moved before the verb
                idxV>=0 && npParent.elements[idxV].getProp("t")!="ip"){ // (except at imperative tense) 
                npParent.elements.splice(idxNP,1);   // remove NP
                npParent.elements[idxV].prop["cod"]=this;
                npParent.elements.splice(idxV,0,pro);// insert pronoun before the V
            } else {
                npParent.elements.splice(idxNP,1,pro);// insert pronoun where the NP was
            }
            pro.parentConst=npParent;
        } else {// special case without parentConst so we leave the NP and change its elements
            var pro=Pro(this.isFr()?"je":"I");
            prop.prop=this.prop;
            pro.agreesWith=this.agreesWith;
            this.elements=[pro];
        }
    } else {
        this.warning(".pro() should be applied only to an NP, not a"+this.constType,
                     ".pro() ne devrait être appliqué qu'à un NP, non un "+this.constType)
    }
}

// modify the sentence structure to create a passive sentence
Phrase.prototype.passivate = function(){
    let subject,vp,newSubject;
    const nominative=this.isFr()?"je":"I";
    const accusative=this.isFr()?"moi":"me";
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
                    if (subject.lemma==nominative)subject.setLemma(accusative);
                    else if (subject.lemma==accusative)subject.setLemma(nominative); 
                }
            } else {
                subject=null;
                n=vp.getProp("n"); // useful for French imperative
            }
        } else {
            return this.warning("Phrase.passivate: no VP found",
                                "Phrase.passivate: aucun VP trouvé")
        }
    }
    // remove object (first NP or Pro within VP) from elements
    if (vp !== undefined) {
        let objIdx=vp.getIndex(["NP","Pro"]);
        if (objIdx>=0){
            var obj=vp.elements.splice(objIdx,1)[0]; // splice returns [obj]
            if (obj.isA("Pro")){
                if (objIdx==0){// a French pronoun inserted by .pro()
                    obj.setLemma(nominative);  // make the new subject nominative
                    objIdx=vp.getIndex("V")+1 // ensure that the new object will appear after the verb
                } else 
                    if (obj.lemma==accusative)obj.setLemma(nominative);
            }
            // swap subject and obj
            newSubject=obj;
            this.elements.unshift(newSubject); // add object that will become the subject
            newSubject.parentConst=this;       // adjust parentConst
            this.agreesWith=newSubject;
            if (subject!=null){   // insert subject where the object was
                vp.elements.splice(objIdx,0,PP(P(this.isFr()?"par":"by"),subject)); 
                subject.parentConst=vp; // adjust parentConst
            }
        } else if (subject !=null){ // no object, but with a subject that we keep as is
            newSubject=subject;
            if (subject.isA("Pro")){
                // the original subject at nominative will be reinserted below!!!
                subject.setLemma(nominative);
            } else { 
                //create a dummy subject with a "il" unless it is at the imperative tense
                if (vp.getProp("t")!=="ip"){
                    subject=Pro(nominative).g(this.isFr()?"m":"n").n("s").pe(3);
                }
            }
            this.elements.unshift(subject);
            this.agreesWith=subject;
        }
        if (this.isFr()){
            // do this only for French because in English this is done by processTyp_en
            // change verbe into an "être" auxiliary and make it agree with the newSubject
            const verbeIdx=vp.getIndex("V")
            const verbe=vp.elements.splice(verbeIdx,1)[0];
            const aux=V("être").t(verbe.getProp("t"));
            aux.parentConst=vp;
            aux.prop=verbe.prop;
            aux.agreesWith=newSubject;
            const pp = V(verbe.lemma).t("pp");
            pp.agreesWith=newSubject;
            pp.parentConst=vp;
            vp.elements.splice(verbeIdx,0,aux,pp);
        }
    } else {
        this.warning("Phrase.passivate: no VP found",
                     "Phrase.passivate: aucun VP trouvé");
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
                this.warning('.typ("'+key+":"+val+'") without VP',
                             '.typ("'+key+":"+val+'") sans VP');
                return;
            }
        }
        const idxV=vp.getIndex("V");
        if(idxV!==undefined){
            const v=vp.elements[idxV];
            action(vp,idxV,v,val);
        }
    }
}

Phrase.prototype.processTyp_fr = function(types){
    // process types in a particular order
    this.processVP(types,"prog",function(vp,idxV,v){
        vp.elements.splice(idxV+1,0,Q("en train de"),V(v.lemma).t("b"));
        v.setLemma("être");
    });
    this.processVP(types,"mod",function(vp,idxV,v,mod){
        var vUnit=v.lemma;
        for (key in rules.verb_option.modalityVerb){
            if (key.startsWith(mod)){
                v.setLemma(rules.verb_option.modalityVerb[key]);
                break;
            }
        }
        vp.elements.splice(idxV+1,0,V(vUnit).t("b"));
    });
    this.processVP(types,"neg",function(vp,idxV,v,neg){
        if (neg === true)neg="pas";
        v.prop["neg"]=neg; // HACK: to be used when conjugating at the realization time
        // insert "ne" before the verb or before a possible pronoun preceding the verb
        if (idxV>0 && vp.elements[idxV-1].isA("Pro")){
            vp.elements.splice(idxV-1,0,Adv("ne"));
        } else {
            vp.elements.splice(idxV,0,Adv("ne"));
        }
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
        if (idxVP !==undefined) {vp=this.elements[idxVP]}
        else {
            this.warning('.typ("'+key+'") without VP',
                         '.typ("'+key+'") sans VP');
            return;
        }
    }
    const idxV=vp.getIndex("V");
    if(idxV!==undefined){
        let v = vp.elements[idxV];
        const pe = this.getProp("pe");
        const g=this.getProp("g");
        const n = this.getProp("n");
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
        const compound = rules.compound;
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
        v=auxils.shift();
        let words=[];
        if (neg) { // negate the first verb
            if (v in negMod){
                if (v=="can"){
                    words.push(Q("cannot"))
                } else {
                    words.push(V(v).t("b"))
                    words.push(Adv("not"))
                }
            } else if (v=="be" || v=="have") {
                words.push(V(v).pe(pe).n(n).t(t));
                words.push(Adv("not"));
            } else {
                words.push(V("do").pe(pe).n(n).t(t));
                words.push(Adv("not"));
                if (v != "do") words.push(V(v).t("b")); 
            }
        } else // conjugate the first verb
            words.push(V(v).pe(v in negMod?1:pe).n(n).t(t));
        // realise the other parts using the corresponding affixes
        while (auxils.length>0) {
            v=auxils.shift();
            words.push(V(v).t(affixes.shift()));
        }
        // HACK: splice the content of the array into vp.elements
        words.forEach(function(w){w.parentConst=vp});
        Array.prototype.splice.apply(vp.elements,[idxV,1].concat(words));
    } else {
        this.warning("no V found in a VP",
                     "aucun V trouvé dans un VP")
    }
}

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
            var idxCtx=this.getIdxCtx("VP","V");
            if (idxCtx!==undefined){
                var aux=idxCtx[1].splice(0,1)[0]; // remove first V
                this.elements.splice(0,0,aux);
            }
        }
    }
}

// modify sentence structure according to the content of the .typ(...) option
Phrase.prototype.typ = function(types){
    const allowedTypes={
      "neg": [false,true],
      "pas": [false,true],
      "prog":[false,true],
      "exc": [false,true],
      "perf":[false,true],
      "mod": [false,"poss","perm","nece","obli","will"],
      "int": [false,"yon","wos","wod","wad","woi","whe","why","whn","how","muc"]
     }
    if (this.isOneOf(["S","SP","VP"])){
        // validate types and keep only ones that are valid
        const entries=Object.entries(types);
        for (let i = 0; i < entries.length; i++) {
            const key=entries[i][0];
            const val=entries[i][1];
            const allowedVals=allowedTypes[key];
            if (allowedVals===undefined){
                if (!(key=="neg" && typeof val == "string")){
                    this.warning(key+" is not allowed as key of .typ",
                                 key+" n'est pas accepté comme clé de .typ");
                    delete types[key]
                }
            }
        }
        if (types["pas"]!==undefined && types["pas"]!== false){
            this.passivate()
        }
        if (this.isFr()){
            this.processTyp_fr(types) 
        } else { 
            this.processTyp_en(types) 
        }
        const int=types["int"];
        if (int !== undefined && int !== false){
            const sentenceTypeInt=rules.sentence_type.int;
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
                            v.prop["n"]="s";
                            v.prop["pe"]=3;
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
                this.warning(int+" interrogative type not implemented",
                             int+" type d'interrogative non implanté")
            }
            if(this.isFr() || int !="yon") // add the interrogative prefix
                this.elements.splice(0,0,Q(prefix[int]));
            this.a(sentenceTypeInt.punctuation);
        }    
        const exc=types["exc"];
        if (exc !== undefined && exc === true){
            this.a(rules.sentence_type.exc.punctuation);
        }
    } else {
        this.warning(".typ("+JSON.stringify(types)+") applied to a "+this.constType+ " should be S, SP or VP",
                     ".typ("+JSON.stringify(types)+") appliqué à un "+this.constType+ " devrait être S, SP or VP");
    }
    return this;
}

////////////////// Realization

//  special case of realisation of a cp for which the gender and number must be computed
//    at realization time...

Phrase.prototype.cpReal = function(res){
    // realize coordinated Phrase by adding ',' between elements except the last
    const idxC=this.getIndex("C");
    // take a copy of all elements except the coordonate
    const elems=this.elements.filter(function(x,i){return i!=idxC})
    var last=elems.length-1;
    // compute the combined gender and number of the coordination
    if(idxC >= 0 ){
        // var c=this.elements.splice(idxC,1)[0]
        var c=this.elements[idxC]
        var and=this.isFr()?"et":"and";
        var gn=this.findGenderNumber(c.lemma==and)
        this.prop["g"]=gn.g;
        this.prop["n"]=gn.n;
    }            
    if (last==0){// coordination with only one element, ignore coordinate
        Array.prototype.push.apply(res,elems[0].real());
    } else {
        for (let j = 0; j < last; j++) { //insert comma after each element
            const ej=elems[j];
            if (j<last-1 && 
                (ej.prop["a"] === undefined || !contains(ej.prop["a"],",")))
                    ej.prop["a"]=[","]
            Array.prototype.push.apply(res,ej.real())
        }
        // insert realisation of C before last...
        if(idxC>=0)
            Array.prototype.push.apply(res,this.elements[idxC].real());
        Array.prototype.push.apply(res,elems[last].real());
    }
    this.doFormat(res); // process format for the CP   
}

// special case of VP for which the complements are put in increasing order of length
Phrase.prototype.vpReal = function(res){
    function realLength(terms){
        // sum the length of each realization and add the number of words...
        return terms.map(t=>t.realization.length).reduce((a,b)=>a+b,0)+terms.length
    }
    // get index of last V (to take into account possible auxiliaries)
    const last=this.elements.length-1;
    vIdx=last;
    while (vIdx>=0 && !this.elements[vIdx].isA("V"))vIdx--;
    // copy everything up to the V (included)
    if (vIdx<0)vIdx=last;
    else {
        const t=this.elements[vIdx].getProp("t");
        if (t == "pp") vIdx=last; // do not rearrange sentences with past participle
    } 
    let i=0;
    while (i<=vIdx){
        Array.prototype.push.apply(res,this.elements[i].real());
        i++;
    }
    if (i>last) {
        this.doFormat(res); // process format for the VP
        return
    }
    // save all succeeding realisations
    let reals=[]
    while (i<=last){
        reals.push(this.elements[i].real())
        i++;
    }
    // sort realisations in increasing length
    reals.sort(function(s1,s2){return realLength(s1)-realLength(s2)})
    reals.forEach(r=>Array.prototype.push.apply(res,r)); // add them
    this.doFormat(res) // process format for the VP
}

// creates a list of Terminal each with its "realization" field now set
Phrase.prototype.real = function() {
    let res=[];
    if (this.isA("CP")){
        this.cpReal(res)
    } else {
        const es=this.elements;    
        for (let i = 0; i < es.length; i++) {
            const e = es[i];
            if (e.isA("CP")){
                e.cpReal(res);
            } else if (e.isA("VP") && reorderVPcomplements){
                e.vpReal(res);
            } else {
                // we must flatten the lists
                Array.prototype.push.apply(res,e.real())
            }
        }
    }
    return this.doFormat(res);
};

// recreate a jsRealB expression
Phrase.prototype.toSource = function(){
    // create source of children
    let res=this.constType+"("+this.elements.map(e => e.toSource()).join()+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this);
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

////// Creates a Terminal (subclass of Constituent)

// Terminal
function Terminal(terminalType,lemma){
    Constituent.call(this,terminalType);
    this.setLemma(lemma,terminalType);
}
extend(Constituent,Terminal)

Terminal.prototype.me = function(){
    return this.constType+"("+quote(this.lemma)+")";
}

Terminal.prototype.morphoError = function (lemma,type,fn,vals){
    this.warning("morphology error:"+fn+"("+vals+")",
                 "erreur de morphologie:"+fn+"("+vals+")");
    return "[["+lemma+"]]"
}

// Phrase structure modifications (should not be called on Terminal)==> warning
Terminal.prototype.typ = function(types){
    this.warning(".typ("+JSON.stringify(types)+") applied to a "+this.constType+ " should be S, SP or VP",
                 ".typ("+JSON.stringify(types)+") appliqué à "+this.constType+ " devrait être S, SP or VP")
    return this;
}
Terminal.prototype.pro = function(args){
    this.warning(".pro("+JSON.stringify(args)+") applied to a "+this.constType+ " should be a NP",
                 ".pro("+JSON.stringify(types)+") appliqué à "+this.constType+ " devrait être NP");
    return this;
}

Terminal.prototype.add = function(){
    this.warning(".add should be applied to Phrase, not a "+this.constType,
                 ".add appliqué à une Phrase, non un "+this.constType);
    return this;
}

//  set lemma, precompute stem and store conjugation/declension table number 
Terminal.prototype.setLemma = function(lemma,terminalType){
    if (terminalType==undefined) // when it is not called from a Constructor, keep the current terminalType
        terminalType=this.constType; 
    this.lemma=lemma;
    switch (terminalType) {
    case "DT":
         this.date = lemma==undefined?new Date():new Date(lemma);
         this.dateOpts={year:true,month:true,date:true,day:true,hour:true,minute:true,second:true,
                        nat:true,det:true,rtime:false}
        break;
    case "NO":
        this.value=+lemma; // this parses the number if it is a string
        this.nbDecimals=nbDecimal(lemma);
        this.noOptions={mprecision:2, raw:false, nat:false, ord:false};
        break;
    case "Q":
        break;
    case "N": case "A": case "Pro": case "D": case "V": case "Adv": case "C": case "P":
        let lexInfo=lexicon[lemma];
        if (lexInfo==undefined){
            this.tab=null
        } else {
            lexInfo=lexInfo[terminalType];
            if (lexInfo===undefined){
                this.tab=null
            } else {
                const keys=Object.keys(lexInfo);
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
                        if (typeof info === "object" && info.length==1)info=info[0]
                        this.prop[key]=info
                    }
                }
            }
        }        
        break;
    default:
        this.warning("setLemma: unknown terminal type:"+terminalType,
                     "setLemma: type de terminal inconnu:"+terminalType)
    }
}

Terminal.prototype.grammaticalNumber = function(){
    if (!this.isA("NO")){
        return this.warning("grammaticalNumber must be called on a NO, not a "+this.constType,
                            "grammaticalNumber doit être appelé sur un NO, non un "+this.constType);
    }
    
    if (this.noOptions.ord==true)return "s"; // ordinal number are always singular
    
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
Terminal.prototype.bestMatch = function(declension,fields){
    let matches=[];
    for (var i = 0; i < declension.length; i++) {
        const d=declension[i];
        let nbMatches=0;
        for (let j = 0; j < fields.length; j++) {
            const f=fields[j];
            if (d[f]!==undefined){
                const fVal=this.getProp(f)
                if (f == "pe" && d[f]!=fVal){
                    nbMatches=0;
                    break;
                }
                if (d[f]==fVal)nbMatches+=2;
                else if (d[f]=="x") nbMatches+=1;
            }
        }
        matches.push([nbMatches,d["val"]]);
    }
    matches.sort((a,b)=>b[0]-a[0])
    const best=matches[0];
    return (best[0]==0)?null:best[1];
}

// constant fields
const gn=["g","n"];
const gnpe=gn.concat(["pe"])
const gnpeown=gnpe.concat(["own"])
const fields={"fr":{"N":gn,   "D":gnpe,   "Pro":gnpe},
              "en":{"N":["n"],"D":gnpeown,"Pro":gnpeown}};


/// French and English declension
Terminal.prototype.decline = function(setPerson){
    const g=this.getProp("g");
    const n=this.getProp("n");
    const pe=setPerson?+this.getProp("pe"):3;
    if (this.tab==null){
        if (this.isA("Adv")) // this happens for some adverbs in French with table in rules.regular...
            return this.lemma; 
        return this.morphoError(this.lemma,this.constType,"decline:tab",[g,n,pe]);
    } 
    const declension=rules.declension[this.tab].declension;
    let res=null;
    if (this.isOneOf(["A","Adv"])){ // special case of adjectives or adv 
        if (this.isFr()){
            const ending=this.bestMatch(declension,gn);
            if (ending==null){
                return this.morphoError(this.lemma,this.constType,"decline",[g,n]);
            }
            res = this.stem+ending;
            const f = this.getProp("f");// comparatif d'adjectif
            if (f !== undefined && f !== false){
                if (this.isFr()){
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
            }
        } else {
            // English adjective/adverbs are invariable but they can have comparative
            res = this.lemma;
            const f = this.getProp("f");// usual comparative/superlative
            if (f !== undefined && f !== false){
                if (this.tab=="a1"){
                    res = (f=="co"?"more ":"the most ") + res;
                } else { // look in the adjective declension table
                    const ending=this.bestMatch(declension,["f"])
                    if (ending==null){
                        return this.morphoError(this.lemma,this.constType,"decline:adjective",[f]);
                    }
                    res = this.stem + ending;
                }
            }
        }
    } else if (declension.length==1){
        res=this.stem+declension[0]["val"]
    } else { // for N, D, Pro
        const ending=this.bestMatch(declension,fields[this.lang][this.constType]);
        if (ending==null){
            return this.morphoError(this.lemma,this.constType,"decline",[g,n,pe]);
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
    if (this.tab==null) return this.morphoError(this.lemma,this.constType,"conjugate_fr:tab",[pe,n,t]);
    switch (t) {
    case "pc":case "pq":case "cp": case "fa": case "spa": case "spq":// temps composés
        const tempsAux={"pc":"p","pq":"i","cp":"c","fa":"f","spa":"s","spq":"si"}[t];
        const aux=this.prop["aux"];
        const v=V("avoir").pe(pe).n(n).t(tempsAux);
        neg=this.prop["neg"];
        if (neg!==undefined){ // apply negation to the auxiliary and remove it from the verb...
            v.prop["neg"]=neg;
            delete this.prop["neg"]
        }
        if (aux=="êt"){
            v.setLemma("être");
            return VP(v,V(this.lemma).t("pp").g(g).n(n))+"";
        } else {
            // check the gender and number of a cod appearing before the verb to do proper agreement
            //   of its part participle
            g="m"
            n="s";
            var cod = this.prop["cod"];
            if (cod !== undefined){
                g=cod.getProp("g");
                n=cod.getProp("n");
            }
        }
        return VP(v,V(this.lemma).t("pp").g(g).n(n))+"";
    default:// simple tense
        var conjugation=rules.conjugation[this.tab].t[t];
        if (conjugation!==undefined){
            let res;
            switch (t) {
            case "p": case "i": case "f": case "ps": case "c": case "s": case "si": case "ip":
                if (t=="ip"){ // French imperative does not exist at all persons and numbers
                    if ((n=="s" && pe!=2)||(n=="p" && pe==3)){
                        return this.morphoError(this.lemma,this.constType,"conjugate_fr",[pe,n,t]);
                    }
                }
                if (n=="p"){pe+=3};
                const term=conjugation[pe-1];
                if (term==null){
                    return this.morphoError(this.lemma,this.constType,"conjugate_fr",[pe,n,t]);
                } else {
                    res=this.stem+term;
                }
                neg=this.prop["neg"];
                if (neg !== undefined && neg !== ""){
                    res+=" "+neg;
                }
                return res;
            case "b": case "pr": case "pp":
                res=this.stem+conjugation;
                neg=this.prop["neg"];
                if (neg !== undefined && neg !== ""){
                    if (t=="b")res = neg+" "+res;
                    else res +=" "+neg;
                }
                if (t=="pp"){
                    res+={"ms":"","mp":"s","fs":"e","fp":"es"}[this.getProp("g")+this.getProp("n")]
                }
                return res;
            default:
                return this.morphoError(this.lemma,this.constType,"conjugate_fr",[pe,n,t]);
            }
        }
        return this.morphoError(this.lemma,this.constType,"conjugate_fr:t",[pe,n,t]);
    }
}

Terminal.prototype.conjugate_en = function(){
    let pe = +this.getProp("pe"); // property can also be a string with a single number 
    const g=this.getProp("g");
    const n = this.getProp("n");
    const t = this.getProp("t");
    if (this.tab==null) return this.morphoError(this.lemma,this.constType,"conjugate_en:tab",[pe,n,t]);
    const conjugation=rules.conjugation[this.tab].t[t];
    switch (t) {
    case "p": case "ps":
        if (typeof conjugation == "string"){
            return this.stem+conjugation;
        }
        if (n=="p"){pe+=3};
        const term=conjugation[pe-1];
        if (term==null){
            return this.morphoError(this.lemma,this.consType,"conjugate_en:pe",[pe,n,t])
        } else {
            return this.stem+term;
        }
    case "f":
        return "will "+this.lemma;
    case "ip":
        return this.lemma;
    case "b": case "pp": case "pr":
        return this.stem+conjugation;
    default:
        return this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",[pe,n,t]);
    }
    
}

Terminal.prototype.conjugate = function(){
    if (this.isFr())return this.conjugate_fr();
    else return this.conjugate_en();
}

// For numbers

Terminal.prototype.numberFormatter = function (rawNumber, maxPrecision) {
    let precision = (maxPrecision === undefined) ? 2 : maxPrecision;
    const numberTable = rules.number;
    precision = nbDecimal(rawNumber) > precision ? precision : nbDecimal(rawNumber);
    return formatNumber(rawNumber, precision, numberTable.symbol.decimal, numberTable.symbol.group);
};

Terminal.prototype.numberToWord = function(number, lang, gender) {
    if (parseInt(number) !== number){
        this.warning("cannot show a decimal number in words",
                     "ne peut écrire en mots un nombre avec décimales");
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
        this.warning("cannot show a decimal number as ordinal",
                     "on ne peut réaliser un nombre avec décimales comme un ordinal");
        return number+"";
    } else if (number<=0){
        this.warning("cannot show 0 or a negative number as an ordinal",
                     "one ne peut réaliser 0 ou un nombre négatif comme un ordinal")
    }
    return ordinal(number,lang, gender);
};


////// Date

Terminal.prototype.dateFormat = function(dateObj,dOpts){
    // useful abbreviations for date format access
    const dateRule = rules.date
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
    dfs = dateFields.filter(function(field){return dOpts[field]==true}).join("-");
    tfs = timeFields.filter(function(field){return dOpts[field]==true}).join(":");
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
    this.warning("not implemented:"+JSON.stringify(dOpt),
                 "non implanté:"+JSON.stringify(dOpts))
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
                    res+=pf.func(val)               // format the value as a string
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
    case "N": case "A": case "D": case "Adv": 
        this.realization=this.decline(false);
        break;
    case "C": case "P": case "Q":
        this.realization=this.lemma;
        break;
    case "Pro":
        this.realization=this.decline(true);
        break;
    case "V":
        this.realization=this.conjugate();
        break;
    case "DT":
        this.realization=this.dateFormat(this.date,this.dateOpts);
        break;
    case "NO":
        const opts=this.noOptions;
        if (opts.nat==true){
            this.realization=this.numberToWord(this.value,this.lang,this.getProp("g"));
        } else if (opts.ord==true){
            this.realization=this.numberToOrdinal(this.value,this.lang,this.getProp("g"));
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
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this);
    return res;
}

// functions for creating terminals
function N  (lemma){ return new Terminal("N",lemma) }
function A  (lemma){ return new Terminal("A",lemma) }
function Pro(lemma){ return new Terminal("Pro",lemma) }
function D  (lemma){ return new Terminal("D",lemma) }
function V  (lemma){ return new Terminal("V",lemma) }
function Adv(lemma){ return new Terminal("Adv",lemma) }
function C  (lemma){ return new Terminal("C",lemma) }
function P  (lemma){ return new Terminal("P",lemma) }
function DT (lemma){ return new Terminal("DT",lemma) }
function NO (lemma){ return new Terminal("NO",lemma) }
function Q  (lemma){ return new Terminal("Q",lemma) }

/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */

///////// date formatting
// mainly rule based (should language independent)

function numberWithoutLeadingZero(n){return ""+n}
function numberWithLeadingZero(n){return (n<10?"0":"")+n}
function numberToMonth(n){return rules.date.text.month[""+n]}
function numberToDay(n){return rules.date.text.weekday[n]}
function numberToMeridiem(n){return rules.date.text.meridiem[n<12?0:1]}
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
ordEnExceptions={"one":"first","two":"second","three":"third","five":"fifth",
                 "eight":"eighth","nine":"ninth","twelve":"twelfth"}
// règles tirées de https://francais.lingolia.com/fr/vocabulaire/nombres-date-et-heure/les-nombres-ordinaux
ordFrExceptions={"un":"premier","une":"première","cinq":"cinquième","neuf":"neuvième"}
var ordinal = function(s,lang,gender){
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

function contains(arr,elem){
    return arr.indexOf(elem)>=0;
}

function loadEn(trace,lenient){
    currentLanguage="en";
    lexicon=lexiconEn;
    rules=ruleEn;
    defaultProps={g:"n",n:"s",pe:3,t:"p"};  // language dependent default properties
    if (trace===true)console.log("English lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implemented");
}

function loadFr(trace,lenient){
    currentLanguage="fr";
    lexicon=lexiconFr;
    rules=ruleFr;
    defaultProps={g:"m",n:"s",pe:3,t:"p",aux:"av"};  // language dependent default properties 
    if (trace===true)console.log("French lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implemented");
}

//// add to lexicon and return the updated object
///    to remove from lexicon (pass undefined as newInfos)
var addToLexicon = function(lemma,newInfos){
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    const infos=lexicon[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        for (ni in newInfos) {
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
var updateLexicon = function(newLexicon){
    Object.assign(lexicon,newLexicon)
}

//// get lemma from lexicon (useful for debugging )
var getLemma = function(lemma){
    return lexicon[lemma];
}

// return the current realization language
var getLanguage = function(){
    return currentLanguage;
}

//// select a random element in a list useful to have some variety in the generated text
//  if the first argument is a list, selection is done within the list
//  otherwise the selection is among the arguements 
//   (if the selected element is a function, evaluate it with no parameter)
var oneOf = function(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
}

// set the flag so that a warning generates an exception
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

var jsRealB_version="3.0";
var jsRealB_dateCreated=new Date(); // might be changed in the makefile 
jsRealB_dateCreated="2020-01-22 17:25"
