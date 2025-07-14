/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import {getRules, getLexicon, getLanguage, quoteOOV } from "./Lexicon.js";
import { exceptionOnWarning, savedWarnings, Pro, fromJSON } from "./jsRealB.js";
export {Constituent, deprels}

/**
 * list of implemented dependency relations
 */
const deprels = ["root","subj","det","mod","comp","coord"]

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


    static pengNO=0; // useful for debugging: identifier of peng struct to check proper sharing in the debugger
    static tauxNO=0; // useful for debugging: identifier of taux struct to check proper sharing in the debugger

    /**
     * Initialize the properties of a Terminal
     */
    initProps(){
        if (this.isA("N","A","D","V","NO","Pro","Q","DT")){
            const props = this.defaultProps();
            this.peng={pe: props["pe"],
                        n: props["n"],
                        g: props["g"],
                        pengNO:Constituent.pengNO++
                        };
            if (this.isA("V")){
                this.taux={t:props["t"],
                           tauxNO:Constituent.tauxNO++};
            }
        }
    }

    /**
     * Creates a new copy of this instance by creating it from a JSON representation of this object
     * @returns a deep copy of this instance
     */
    clone(){
        return fromJSON(this.toJSON(), this.lang);
    }
    
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
     * Get the value of the "n" property taking into account possible local "majestic" override
     * @returns "s" or "p"
     */
    getNumber(){
        if (this.peng && this.peng.n == "s" && this.peng.pe<3) {
            if (this.peng.maje !== undefined && this.peng.maje === false) return "s"
            if (this.isMajestic()) return "p"
        }
        return this.getProp("n")
    }

    /**
     * Set the value of a property, but also possibly changing the shared properties
     * @param {string} propName name of the property to change
     * @param {any} val value to put as value of propName
     * @returns {Constituent} the current Constituent
     */
    setProp(propName,val,inSetLemma){
        if (propName=="pe" || propName=="n" || propName=="g"){
            if (this.peng!==undefined) this.peng[propName]=val;
        } else if (propName=="t" || propName=="aux"){
            if (this.taux!==undefined) this.taux[propName]=val;
        }
        // this is important to ensure that local options override global values
        // but it must be "undone" in Terminal.setLemma
        if (!["pe","n","g","t","aux"].includes(propName) || inSetLemma === undefined)
            this.props[propName]=val; 
        return this
    }

    /**
     * Get a given constituent with a path starting at this
     * @param {string[]} path a list of node type , or list of node types (an empty string in this list 
     *                   means optional)
     * @returns  undefined if any node does not exist on the path
     * @example a parameter of the form: [["VP"],["CP"],["AP,""],[A]] will find an "A" within
     *          an optional "AP" which is a childo f a "CP" within a "VP" 
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
     * return a pronoun corresponding to this object 
     * taking into account the current gender, number and person
     *  do not change the current pronoun, if it is already using the tonic form or does not have one (e.g. this)
     * if case_ is not given, return the tonic form else return the corresponding case
     * HACK: This should be defined in Constituent.js but it is defined here to get around the circular import of Pro !
     * @param {string} case_ case for the tonic pronoun [case_ is followed by _ so that it is not displayed as a keyword in the editor]
     * @returns a new Pronoun
     */
    getTonicPro(case_){
        if (this.isA("Pro")){
            if (this.props["tn"] || this.props["c"]){
                if (case_!==undefined){
                    this.props["c"]=case_
                } else { // ensure tonic form
                    this.props["tn"]="";
                    if ("c" in this.props)delete this.props["c"];
                }
                return this;
            } else {
                if (this.tonic_forms().includes(this.lemma)){
                    // lemma is already in tonic form
                    if (case_ !== undefined)
                        return Pro(this.lemma,this.lang).c(case_)
                } else {
                    if (case_ !== undefined)
                        return Pro(this.realize(),this.lang).c(case_)
                }
                return this
            }
        } else { // generate the string corresponding to the tonic form
            let pro=Pro(this.tonic_pe_1(),this.lang)
            const g = this.getProp("g")
            if (g!==undefined)pro.g(g);
            const n = this.getProp("n");
            if (n!==undefined)pro.n(n);
            const pe = this.getProp("pe");
            if (pe!==undefined)pro.pe(pe);
            if (case_===undefined) return Pro(pro.realize(),this.lang).tn("");
            return Pro(pro.realize(),this.lang).c(case_) 
        }
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
            this.optSource+=`.tag("${name}",${JSON.stringify(attrs)})`// special case of addOptSource...
        }
        if (this.props["tag"] === undefined)this.props["tag"]=[];
        this.props["tag"].push([name,attrs]);
        return this;
    }
    
    /**
     * Regex for valid Markdown specifications with the following groups
     *   #{1,6}  : 1 : header              
     *   *{1,}   : 2 : bold+italic
     *   >+      : 3 : blockquote
     *   \s+\+   : 4 : unordered list
     *   \d+\.+  : 5 : ordered list
     *   ---     : 6 : horizontal rule
     *   @.*     : 7 : link
     *   <       : 8 : autolink
     * @static
     * @type {regex}
     */
    static mdRE = /^(?:(#{1,6})|(\*{1,3})|(>+)|(\s*\+)|(\d+\.+)|(---)|(@.*)|(<))$/
    
    /**
     * Save information for a Markdown markup in both source and props
     * @param {string} markup matching Constituent.mdRE
     * @returns this Contituent with md value set
     */
    md(markup){
        if (typeof markup != "string"){
            return this.warn("bad application",".md","string",typeof markup);
        }
        const match = Constituent.mdRE.exec(markup);
        if (match == null){
            return this.warn("ignored value for option",".md",markup);
        }
        if (this.props["md"] === undefined) this.props["md"]=[];
        this.props["md"].push(markup);
        this.optSource+=`.md("${markup}")`;
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
            const allowedKeys = ["mprecision","raw","nat","ord","rom"];
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
        this.addOptSource("nat",isNat);
        return this;
    }

    /**
     * Override the global "majestic" flog for this Pro or D
     * HACK: this adds a flag to the peng structure so that agreements are correctly made
     * @param {boolean} isMaje if false it will override 
     * @returns this Constituent
     */
    maje(isMaje){
        if (this.isA("Pro","D")){
            if (typeof isMaje == "boolean"){
                this.setProp("maje",isMaje); // useful for toJSON/used for cloning also
                this.peng["maje"]=isMaje
                this.addOptSource("maje",isMaje);
                return this;
            }
            return this.warn("bad application",".maje","boolean",isMaje)
        }
        return this.warn("bad application",".maje",["Pro","D"],this.constType)
    }

    /**
     * Set the sentence type
     * @param {Object} types object indicating sentence modifications
     * @returns This constituent
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
        "maje" :[false,true], // majestative (en français: politesse, modestie, majesté...)
        "mod": [false,"poss","perm","nece","obli","will"],
        "int": [false,"yon","wos","wod","woi","was","wad","wai","whe","why","whn","how","muc","tag"]
        }
        if (this.isA("S","SP","VP","root","mod","comp")){
            if (this.isA("root","mood","comp") && ! this.terminal.isA("V")){
                this.warn("bad application",`.typ("${types}")`,[`${this.constType}(V(..))`],
                      `${this.constType}(${this.terminal.constType}(..))`)
            } else {
                // validate types and keep only ones that are valid
                if (typeof types == "object"){
                    for (let key in types) {
                        const val=types[key];
                        const allowedVals=allowedTypes[key];
                        if (allowedVals === undefined){
                            this.warn("unknown type",key,Object.keys(allowedTypes))
                        } else {
                            if (key == "neg" && this.validate_neg_option(val,types)){
                            } else if (!allowedVals.includes(val)){
                                this.warn("ignored value for option",".typ("+key+")",val)
                                delete types[key]
                            }
                        }
                    }
                    this.addOptSource("typ",types)
                    if (this.props["typ"]===undefined){
                        this.props["typ"]=types;  // initialise .typ
                    } else {  // update .typ with new values
                        Object.assign(this.props["typ"],types)
                    }
                } else {
                    this.warn("ignored value for option",".typ",typeof(types)+":"+JSON.stringify(types))
                }
            }
        } else {
            this.warn("bad application",".typ("+JSON.stringify(types)+")",["S","SP","VP","root","mod","comp"],this.constType);
        }
        return this;
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
        // reorder pronouns
        if (this.isA("VP") || (this.isA(deprels) && this.terminal.isA("V")))
            this.doPronounPlacement(cList);
        
        this.doElision(cList)
        
        const cap = this.props["cap"];
        if (cap !== undefined && cap === true){
            const r=cList[0].realization;
            if (r.length>0){
                cList[0].realization=r.charAt(0).toUpperCase()+r.substring(1);
            }
        }

        const poss = this.props["poss"]
        if (poss === true){
            const last = cList.length -1
            cList[last].realization += cList[last].realization.endsWith("s") ? "'" : "'s"
        }

        const tags=this.props["tag"];
        if (tags !== undefined) {
            tags.forEach(function(tag){
                const attName=tag[0];
                const attVal=tag[1];
                wrapWith(startTag(attName,attVal),"</"+attName+">");
            })
        }
        
        const md = this.props["md"];
        if (md !== undefined) {
            md.forEach(function(markup){
                const m = Constituent.mdRE.exec(markup);
                if (m == undefined){
                    return error("Bad value for markup:"+markup);
                }
                for (let i=1;i<9;i++){
                    if (m[i]!= null){
                        switch (i) {
                            case 1:   // header
                                wrapWith(m[1]+" ","\n");
                                return
                            case 2:  // bold and italic
                                wrapWith(m[2],m[2]);
                                return
                            case 3: // blockquote
                                wrapWith("\n"+m[3],"\n");
                                return
                            case 4: case 5: // unordered and ordered lists
                                wrapWith("\n"+m[i]+" ","\n");
                                return
                            case 6: // horizontal rule after
                                wrapWith("","\n---\n");
                                return
                            case 7 : // link
                                wrapWith("[",`](${m[7].slice(1)})`)
                                return
                            case 8 : // autolink
                                wrapWith("<",">")
                                return
                            default:
                                error("Strange md value:"+i)
                        }
                    }
                }
            }); 
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
     * Apply Title case to the realization of a Terminal
     * according to https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case
     * Only the current terminal is taken into account, 
     * so the "first word after a colon, em dash, or end punctuation" might not be capitalized as it should
     * @param {Terminal} t 
     */
    titleCase(t){
        let s = t.realization;
        const m=this.sepWordRE().exec(s);
        const word = m[2];
        const len = word.length;  // get length of word in realization
        if (len >= 4 || !t.isA("C","P","D")){
            // capitalize words of 4 letters or more or short 
            // non minor (conjunction,preposition,articles)
            const idx=m[1].length; // get index of first letter
            t.realization = s.substring(0,idx)+s.charAt(idx).toUpperCase()+s.substring(idx+1);
        }
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
        const doTitleCase =  this.isEn() && this.props["cap"] == "tit";
        for (let i = 0; i < last; i++) {
            const terminal=terminals[i];
            if (doTitleCase) this.titleCase(terminal)
            if (terminal.props["lier"] === true){
                // HACK: terminal.realization might be changed in French by check_for_t
                const liaison = "-"+this.check_for_t(terminals,i); 
                s+=terminal.realization+liaison;
            } else if (/[- ']$/.exec(terminal.realization)){
                s+=terminal.realization;
            } else if (terminal.realization.length>0) {
                s+=terminal.realization+" ";
            }
        }
        const lastTerm = terminals[last];
        if (lastTerm.realization.startsWith(" ") && last>0){ // do not remove leading space
            lastTerm.realization = lastTerm.realization.slice(1)
        }
        if (doTitleCase) this.titleCase(lastTerm)
        s+=lastTerm.realization;
        
        if (this.parentConst==null){// if it is a top-level S
            if ((this.isA("S","root") || (this.isA("coord") && this.dependents[0].isA("root"))) 
                && s.length>0){ 
                // apply capitalization at the start and final full stop unless .cap(false)
                if (this.props["cap"] === undefined || [true,"tit"].includes(this.props["cap"])){
                    const m=this.sepWordRE().exec(s);
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
     * @param if set to "en" or "fr", loads the language before the realization
     * @returns string from a list of realization fields in the list of terminal
     */
    realize(lang){
        if (lang !== undefined)load(lang);
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
     * Useful for the debug information
     * @returns string showing the numbers of the peng and taux structure
     */
    getPengTauxStr(){
        let res = ""
        if (this.peng !== undefined){
            if (this.peng.pengNO !== undefined) res += "#"+this.peng.pengNO;
            if (this.taux && this.taux.tauxNO !== undefined) res += "-"+this.taux.tauxNO;
        } 
        return res
    }
    
    /**
     * Compute indentation and a string to insert between each element of a list
     * useful for producing nicely indented display of expressions
     * @param {int} indent number of spaces to indent
     * @returns list of two values: updated indent with length constituent name, string of (updated) indent spaces preceded by a newline
     */
    indentSep (indent,debug){
        if (indent>=0){
            indent=indent+this.constType.length+1;
            if (debug){
                indent += this.getPengTauxStr().length
            } 
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

    warn(...args){
        const mess = this.warning(args)
        if (exceptionOnWarning) throw mess;
        if (Array.isArray(savedWarnings))
            savedWarnings.push(mess);
        else
            console.warn(mess);
        return this;    
    }
}

/**
 * Creation of the many standard options for constituents
 * HACK the following definitions modify the Constituent class
 * @param {string} option name of the option to create  
 * @param {string[]} validVals array of acceptable values for this option or undefined; 
 *        if "" is allowed, then no parameter can be used and it is considered as true, false can also be used
 * @param {string[]} allowedConsts constituents names for this option is acceptable
 * @param {string?} optionName if present, name of the internal name for this option
 */
function genOptionFunc(option,validVals,allowedConsts,optionName){
    Constituent.prototype[option]=function(val,prog){
        if (val===undefined){
            if (!validVals.includes("")){
                return this.warn("no value for option",option,validVals);
            }
        }
        if (optionName===undefined)optionName=option; 
        if (this.isA("CP") && !["cap","lier","pos"].includes(option)){
            // propagate an option through the children of a CP except for "cap", "pos" and "lier"
            if(prog==undefined)this.addOptSource(optionName,val)
            for (let i = 0; i < this.elements.length; i++) {
                const e=this.elements[i];
                if (allowedConsts.length==0 || e.isA(allowedConsts)){
                    e[option](val,true)  // do not add this option to the source of these elements
                }
            }
            return this;
        }
        if (this.isA("coord") && !["cap","lier","pos"].includes(option)){
            // propagate an option through the head of the dependents of a coord except for "cap", "pos" and "lier"
            if(prog==undefined)this.addOptSource(optionName,val)
            for (let i = 0; i < this.dependents.length; i++) {
                const e=this.dependents[i].terminal;
                if (allowedConsts.length==0 || e.isA(allowedConsts)){
                    e[option](val,true)  // do not add this option to the source of the head of the dependents
                }
            }
            return this;
        }
        if (allowedConsts.length==0 || this.isA(allowedConsts) || this.isA(deprels)) {
            // start of the real work...
            if (val === undefined){
                if (!validVals.includes("")){
                    return this.warn("ignored value for option",option,val);
                }
                val = true
            } else if (!validVals.includes(val)){
                this.warn("ignored value for option",option,val);
                if (!validVals.includes(false))return this;
                val = false
            }
            this.setProp(optionName,val);
            if (prog===undefined) this.addOptSource(option,val==null?undefined:val)
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
genOptionFunc("n",["s","p","x"],["D","Pro","N","NO","NP","A","AP","V","VP","S","SP","CP"]);
genOptionFunc("g",["m","f","n","x"],["D","Pro","N","NP","A","AP","V","VP","S","SP","CP"]);
//  t, aux : can be applied to VP and sentence
genOptionFunc("t",["p", "i", "f", "ps", "c", "s", "si", "ip", "pr", "pp", "b", "b-to", // simple tenses
                   "pc", "pq", "cp", "pa", "fa", "spa", "spq", "bp", "bp-to"],         // compound tenses
                   ["V","VP","S","SP","CP"]);
genOptionFunc("aux",["av","êt","aê"],["V","VP","S","SP","CP"]);
// ordinary properties
genOptionFunc("f",["co","su"],["A","Adv"]);
genOptionFunc("tn",["","refl"],["Pro"]);
genOptionFunc("c",["nom","acc","dat","refl","gen"],["Pro"]);

genOptionFunc("pos",["post","pre"],["A","Adv",...deprels]);
genOptionFunc("pro",["",true,false],["NP","PP"]);
// English only
genOptionFunc("ow",["s","p","x"],["D","Pro"],"own");
genOptionFunc("poss",["",true,false],["N","Q"])

/// Formatting options
genOptionFunc("cap",[true,false,"tit",""],[]);
genOptionFunc("lier",["",true,false],[]);

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
