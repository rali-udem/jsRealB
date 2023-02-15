/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
 */

import {getRules, getLexicon, getLanguage, quoteOOV, getLemma} from "./Lexicon.js";
export {Constituent}

/**
 * Class representing all objects that are realizable by jsRealB
 * it keeps common properties to all Constituents 
 */
class Constituent {
    /**
     * Creates a new Constituent.
     * This constructor should never be called directly, only via super
     * it is thus an <i>abstract</i> class
     * @param {string} constType kind of constituent
     */
    constructor(constType){
        this.parentConst=null;
        this.constType=constType;    
        this.props={};
        this.realization=null;
        this.optSource=""   // string corresponding to the calls to the options
    }

    /**
     * list of implemented dependency relations
     */
    static deprels = ["root","subj","det","mod","comp","coord"]
    // 
    static pengNO=0; // useful for debugging: identifier of peng struct to check proper sharing in the debugger
    static tauxNO=0; // useful for debugging: identifier of taux struct to check proper sharing in the debugger

    /**
     * Raise exception for internal error that should never happen !!!
     * @param {string} mess error message to display 
     */
    error(mess){
        throw "Internal error: this should never have happened, sorry!\n"+this.me()+":: "+mess;
    }

    /**
     * Check for type or types e.g.: isA("V","N",...)
     * @param {string[] | arguments} types 
     * @returns true if this object is of the given type or one of the given types
     */
    isA(types){
        if (arguments.length==1){
            if (!Array.isArray(types))
                return types==this.constType;
        } else {
            types=Array.from(arguments);
        }
        return types.includes(this.constType)
    }

    /**
     * Check language
     * @returns true if the language of this Constituent is French
     */
    isFr(){return this.lang=="fr"}

    /**
     * Check language
     * @returns true if the language of this Constituent is English
     */
    isEn(){return this.lang=="en"}

    /**
     * Get the value of a property by first checking the property of this instance
     * and then the value of shared properties
     * @param {string} propName name of the property to query
     * @returns the value associated with propName or undefined if propName is not defined
     */
    getProp(propName){
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

    /**
     * Set the value of a property, but also possibly changing the shared properties
     * @param {string} propName name of the property to change
     * @param {any} val value to put as value of propName
     */
    setProp(propName,val){
        if (propName=="pe" || propName=="n" || propName=="g"){
            if (this.peng!==undefined) this.peng[propName]=val;
        } else if (propName=="t" || propName=="aux"){
            if (this.taux!==undefined) this.taux[propName]=val;
        }
        this.props[propName]=val;
    }

    /**
     * Get a given constituent with a path starting at this
     * @param {string[]} path a list of node type , or list of node types (an empty string in this list means optional)
     * @returns  undefined if any node does not exist on the path
     */
    getFromPath(path){
        if (path.length==0) return this;
        const current=path.shift();
        const c=this.getConst(current);
        if (c===undefined){
            if (typeof current == "object" && current.includes("") && path.length>0){// optional
                return this.getFromPath(path);
            }
            return undefined;
        }
        return c.getFromPath(path);
    }

    /**
     * Gets the language of this element or the one of the nearest parent
     * if no language is found, return current language (useful for JSON processing)
     * @returns "en"|"fr"
     */
    getParentLang(){
        if (this.lang !== undefined) return this.lang;
        if (this.parentConst === null) return getLanguage();
        return this.parentConst.getParentLang();
    }

    /**
     * Save string to reconstruct the setting of the value for an option
     * @param {string} optionName name of the option
     * @param {any} val value of the corresponding option
     */
    addOptSource(optionName,val){
        this.optSource+="."+optionName+"("+(val===undefined? "" :JSON.stringify(val))+")"
    }

    /**
     * Save information for an HTML tag in both source and props
     * @param {string} name tag name
     * @param {object} attrs values associated with the tag
     * @returns this Constituent with tag value set
     */
    tag(name,attrs){
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

    /**
     * Save information for date and number options
     * @param {object} dOptions options to set
     * @returns this Constituent with dOptions set
     */
    dOpt(dOptions){
        this.addOptSource("dOpt",dOptions)
        if (typeof dOptions != "object"){
            return this.warn("bad application",".dOpt","object",typeof dOptions)
        }
        if (this.isA("DT")){
            const allowedKeys =["year" , "month" , "date" , "day" , "hour" , "minute" , "second" , "nat", "det", "rtime"];
            const keys=Object.keys(dOptions);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (allowedKeys.includes(key)){
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
                if (allowedKeys.includes(key)){
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

    /**
     * Should this number be realized in letters
     * @param {boolean?} isNat if true or undefined the number will be realized as words
     * @returns this Constituent
     */
    nat(isNat){
        this.addOptSource("nat",isNat);
        if (this.isA("DT","NO")){
            const options=this.props["dOpt"];
            if (isNat === undefined){
                options.nat=true;
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

    /**
     * Set the sentence type
     * @param {Object} types object indicating sentence modifications
     * @returns This constituentt
     */
    typ(types){
        const allowedTypes={
        "neg": [false,true],
        "pas": [false,true],
        "prog":[false,true],
        "exc": [false,true],
        "perf":[false,true],
        "contr":[false,true],
        "refl" :[false,true], // reflexive
        "mod": [false,"poss","perm","nece","obli","will"],
        "int": [false,"yon","wos","wod","woi","was","wad","wai","whe","why","whn","how","muc","tag"]
        }
        this.addOptSource("typ",types)
        if (this.isA("S","SP","VP") || this.isA(Constituent.deprels)){
            // validate types and keep only ones that are valid
            if (typeof types == "object"){
                for (let key in types) {
                    const val=types[key];
                    const allowedVals=allowedTypes[key];
                    if (allowedVals === undefined){
                        this.warn("unknown type",key,Object.keys(allowedTypes))
                    } else {
                        if (key == "neg" && this.isFr()){ // also accept string as neg value in French
                            if (!["string","boolean"].includes(typeof val)){
                                this.warn("ignored value for option",".typ("+key+")",val)
                                delete types[key]
                            }
                        } else if (!allowedVals.includes(val)){
                            this.warn("ignored value for option",".typ("+key+")",val)
                            delete types[key]
                        }
                    }
                }
                this.props["typ"]=types;
            } else {
                this.warn("ignored value for option",".typ",typeof(types)+":"+JSON.stringify(types))
            }
        } else {
            this.warn("bad application",".typ("+JSON.stringify(types)+")",["S","SP","VP","Dependent"],this.constType);
        }
        return this;
    }

    // regex for matching the first word in a generated string (ouch!!! it is quite subtle...) 
    //  match index:
    //     1-possible non-word chars and optional html tags
    //     2-the real word 
    //     3-the rest after the word  
    static sepWordREen=/((?:[^<\w'-]*(?:<[^>]+>)?)*)([\w'-]+)?(.*)/
   
    /**
     * Process English elision by changing the realization fields of Terminals, the list
     * might be modified
     * @param {Terminal[]} cList list of Terminals
     * @returns undefined
     */
    doElisionEn(cList){
        //// English elision rule only for changing "a" to "an"
        // according to https://owl.english.purdue.edu/owl/resource/591/1/
        const hAnRE=/^(heir|herb|honest|honou?r(able)?|hour)/i;
        //https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
        const uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
        const acronymRE=/^[A-Z]+$/
        // Common Contractions in the English Language taken from :http://www.everythingenglishblog.com/?p=552
        const contractionEnTable={
            "are+not":"aren't", "can+not":"can't", "did+not":"didn't", "do+not":"don't", "does+not":"doesn't", 
            "had+not":"hadn't", "has+not":"hasn't", "have+not":"haven't", "is+not":"isn't", "must+not":"mustn't", 
            "need+not":"needn't", "should+not":"shouldn't", "was+not":"wasn't", "were+not":"weren't", 
            "will+not":"won't", "would+not":"wouldn't", "could+not":"couldn't",
            "let+us":"let's",
            "I+am":"I'm", "I+will":"I'll", "I+have":"I've", "I+had":"I'd", "I+would":"I'd",
            "she+will":"she'll", "he+is":"he's", "he+has":"he's", "she+had":"she'd", "she+would":"she'd",
            "he+will":"he'll", "she+is":"she's", "she+has":"she's", "he+would":"he'd", "he+had":"he'd",
            "you+are":"you're", "you+will":"you'll", "you+would":"you'd", "you+had":"you'd", "you+have":"you've",
            "we+are":"we're", "we+will":"we'll", "we+had":"we'd", "we+would":"we'd", "we+have":"we've",
            "they+will":"they'll", "they+are":"they're", "they+had":"they'd", "they+would":"they'd", "they+have":"they've",
            "it+is":"it's", "it+will":"it'll", "it+had":"it'd", "it+would":"it'd",
            "there+will":"there'll", "there+is":"there's", "there+has":"there's", "there+have":"there've",
            "that+is":"that's", "that+had":"that'd", "that+would":"that'd", "that+will":"that'll"
        } 
        // search for terminal "a" and check if it should be "an" depending on the next word
        var last=cList.length-1;
        if (last==0)return; // do not try to elide a single word
        for (var i = 0; i < last; i++) {
            var m1=Constituent.sepWordREen.exec(cList[i].realization)
            if (m1 === undefined || m1[2]===undefined) continue;
            var m2=Constituent.sepWordREen.exec(cList[i+1].realization)
            if (m2 === undefined || m2[2]===undefined) continue;
            // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
            // for a single word 
            var w1=m1[2];
            var w2=m2[2];
            if ((w1=="a"||w1=="A") && cList[i].isA("D")){
                if (/^[ai]/i.exec(w2) ||   // starts with a or i
                    (/^e/i.exec(w2) && !/^eu/i.exec(w2) || // starts with e but not eu
                     /^o/i.exec(w2) && !/^onc?e/.exec(w2) || // starts with o but not one or once
                     /^u/i.exec(w2) && !uLikeYouRE.exec(w2)) || // u does not sound like you
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
    static sepWordREfr=/((?:[^<\wàâéèêëîïôöùüç'-]*(?:<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?(.*)/i;

   /**
     * Process French elision by changing the realization fields of Terminals, the list
     * might be modified
     * @param {Terminal[]} cList list of Terminals
     * @returns undefined
     */
    doElisionFr(cList){
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
            var m1=Constituent.sepWordREfr.exec(cList[i].realization)
            if (m1 === undefined || m1[2]===undefined) continue;
            var m2=Constituent.sepWordREfr.exec(cList[i+1].realization)
            if (m2 === undefined || m2[2]===undefined) continue;
            // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
            // for a single word 
            var w1=m1[2];
            var w2=m2[2];
            var w3NoWords = ! /^\s*\w/.test(m1[3]); // check that the rest of the first word does not start with a word
            let elisionFound=false;
            if (isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType)){ // is the next word elidable
                if (elidableWordFrRE.exec(w1) && w3NoWords){
                    cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
                    elisionFound=true;
                } else if (euphonieFrRE.exec(w1) && w3NoWords && cList[i].getProp("n")=="s"){ // euphonie
                    if (/^ce$/i.exec(w1) && /(^est$)|(^étai)|(^a$)/.exec(w2)){
                        // very special case but very frequent
                        cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
                    } else {
                        cList[i].realization=m1[1]+euphonieFrTable[w1]+m1[3];
                    }
                    elisionFound=true;
                }
            }
            if (elisionFound) {
                i++;    // skip next token 
            } else if ((contr=contractionFrTable[w1+"+"+w2])!=null && w3NoWords && last>1){
                // try contraction
                // check if the next word would be elidable, so instead elide it instead of contracting
                // except when the next word is a date which has a "strange" realization
                // do not elide when there are only two words, wait until at least another token is there
                if (elidableWordFrRE.exec(w2) && i+2<=last && !cList[i+1].isA("DT") &&
                    isElidableFr(cList[i+2].realization,cList[i+2].lemma,cList[i+2].constType)){
                    cList[i+1].realization=m2[1]+w2.slice(0,-1)+"'"+m2[3]
                } else if (!(w2.startsWith("le") && cList[i+1].isA("Pro"))){ 
                    // do contraction of first word and remove second word (keeping start and end)
                    // HACK: except when le/les is a pronoun
                    cList[i].realization=m1[1]+contr+m1[3];
                    cList[i+1].realization=m2[1]+m2[3].trim();
                }
                i++;
            }
        }
    }

    /**
     * Applies to a list of Constituents (can be a single one)
     * adds either to the first or last token (which can be the same)
     * @param {Terminal[]} cList list of Terminals
     * @returns undefined
     */
    doFormat(cList){
        const punctuation=getRules(this.lang)["punctuation"];
        const lexicon=getLexicon(this.lang)   
        
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
        // reorder French pronouns
        if (this.isFr() && (this.isA("VP") || (this.isA(Constituent.deprels) && this.terminal.isA("V"))))
            this.doFrenchPronounPlacement(cList);
        
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
        const tags=this.props["tag"];
        if (tags !== undefined) {
            tags.forEach(function(tag){
                const attName=tag[0];
                const attVal=tag[1];
                wrapWith(startTag(attName,attVal),"</"+attName+">");
            })
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
        return cList;
    }

    /**
     * Merge all tokens (i.e. Terminal with their realization field) into a single string, 
     * if at "top level", apply elision and default sentence formatting
     * @param {Terminal[]} terminals 
     * @returns the final realization string
     */
    detokenize(terminals){
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
                    C'est le cas, notamment, quand le verbe à la 3e personne du singulier du passé, du présent ou 
                    du futur de l'indicatif se termine par une autre lettre que d ou t et qu'ßil est suivi 
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
        
        if (this.parentConst==null){// if it is a top-level S
            if ((this.isA("S","root") || (this.isA("coord") && this.dependents[0].isA("root"))) 
                && s.length>0){ 
                // apply capitalization at the start and final full stop unless .cap(false)
                if (this.props["cap"]!== false){
                    const sepWordRE=this.isEn()?Constituent.sepWordREen:Constituent.sepWordREfr;
                    const m=sepWordRE.exec(s);
                    const idx=m[1].length; // get index of first letter
                    if (idx<s.length) // check if there was a letter
                        s=s.substring(0,idx)+s.charAt(idx).toUpperCase()+s.substring(idx+1);
                    if (this.props["tag"]===undefined){ // do not touch top-level tag
                        // and a full stop at the end unless there is already one
                        // taking into account any trailing HTML tag
                        const m=/(.)( |(<[^>]+>))*$/.exec(s);
                        if (m!=null && !"?!.:;/)]}".includes(m[1])){
                            s+=". "  // add a space after . like for rule "pc4"
                        }
                    }
                };
            }
        }
        return s;
    }

    /**
     * This seemingly simple function is in fact the start of the whole realization process
     * @returns string from a list of realization fields in the list of terminal
     */
    realize(){
        const terminals=this.real(); 
        return this.detokenize(terminals);
    }

    /**
     * if true then toString() returns the source, 
     * this useful for debugging in VScode which displays an object with toString()
     * which sometimes has side-effects... 
     * In this case realization must be obtained using .realize()
     */
    static debug = false;

    /**
     * If Constituent.debug is true, returns the source string of the expression otherwise
     * returns the realization
     * @returns final string
     */
    toString() {
        return Constituent.debug?this.toSource():this.realize();
    }

    /**
     * Compute indentation and a string to insert between each element of a list
     * useful for producing nicely indented display of expressions
     * @param {int} indent number of spaces to indent
     * @returns list of two values: updated indent with length constituent name, string of (updated) indent spaces preceded by a newline
     */
    indentSep (indent){
        if (indent>=0){
            indent=indent+this.constType.length+1;
            return [indent,",\n"+(" ".repeat(indent))]
        }
        return [indent,","];
    }

    /**
     * show the source form
     * @returns the saved source for the options of this constituent
     */
    toSource(){
        return this.optSource;
    }

    /**
     * Creates a "debug" representation from the structure not from the saved source strings
     * CAUTION: this output is NOT a legal jsRealB expression, contrarily to .toSource()
     * @returns string representation of the current options
     */
    toDebug(){
        return Object.keys(this.props).length>0 ? JSON.stringify(this.props) :""
    }
}

/**
 * Creation of the many standard options for constituents
 * HACK the following definitions modify the Constituent class
 * @param {string} option name of the option to create  
 * @param {string[]} validVals acceptable values for this option 
 * @param {string[]} allowedConsts constituents names for this option is acceptable
 * @param {string?} optionName if present, name of the internal name for this option
 */
function genOptionFunc(option,validVals,allowedConsts,optionName){
    Constituent.prototype[option]=function(val,prog){
        if (val===undefined){
            if (validVals !== undefined && !validVals.includes("")){
                return this.warn("no value for option",option,validVals);
            }
            val=null;
        }
        if (this.isA("CP") && !["cap","lier"].includes(option)){
            // propagate an option through the children of a CP except for "cap" and "lier"
            if(prog==undefined)this.addOptSource(optionName,val)
            for (let i = 0; i < this.elements.length; i++) {
                const e=this.elements[i];
                if (allowedConsts.length==0 || e.isA(allowedConsts)){
                    e[option](val)
                }
            }
            return this;
        }
        if (allowedConsts.length==0 || this.isA(allowedConsts) || this.isA(Constituent.deprels)) {
            if (validVals !== undefined && !validVals.includes(val)){
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

/// create many options on loading
// shared properties 
//   pe,n and g : can be applied to components of NP and Sentences
genOptionFunc("pe",[1,2,3,'1','2','3'],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("n",["s","p","x"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("g",["m","f","n","x"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
//  t, aux : can be applied to VP and sentence
genOptionFunc("t",["p", "i", "f", "ps", "c", "s", "si", "ip", "pr", "pp", "b", "b-to", // simple tenses
                   "pc", "pq", "cp", "pa", "fa", "spa", "spq","bp"],["V","VP","S","SP","CP"]);    // compound tenses
genOptionFunc("aux",["av","êt","aê"],["V","VP","S","SP","CP"]);
// ordinary properties
genOptionFunc("f",["co","su"],["A","Adv"]);
genOptionFunc("tn",["","refl"],["Pro"]);
genOptionFunc("c",["nom","acc","dat","refl","gen"],["Pro"]);

genOptionFunc("pos",["post","pre"],["A","Adv",...Constituent.deprels]);
genOptionFunc("pro",undefined,["NP","PP","N"]);
// English only
genOptionFunc("ow",["s","p","x"],["D","Pro"],"own");

/// Formatting options
genOptionFunc("cap",undefined,[]);
genOptionFunc("lier",undefined,[]);

/**
 * Creation of list options
 * @param {option} option name of the option
 */
function genOptionListFunc(option){
    Constituent.prototype[option]=function(val,prog){
        if (this.props[option] === undefined)this.props[option]=[];
        this.props[option].push(val);
        if(prog==undefined)this.addOptSource(option,val)
        return this;
    }
}

/// add new list functions on loading
genOptionListFunc("b");  // before
genOptionListFunc("a");  // after
genOptionListFunc("ba"); // before-after
genOptionListFunc("en"); // "entourer": old name for before-after 
