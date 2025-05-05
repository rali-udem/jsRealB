/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { Constituent,deprels } from "./Constituent.js";
import { getLanguage,getLexicon,getRules, quoteOOV } from "./Lexicon.js";
import { nbDecimal,numberFormatter, enToutesLettres, ordinal, roman} from "./Number.js";
import { NO } from "./jsRealB.js"

export {Terminal}

/**
 * create a quoted string taking account possible escaping
 * @param {string} s string to quote
 * @returns quoted string
 */
function quote(s){
    if (typeof s != "string")return s;
    if (!s.includes("'"))return "'"+s+"'"; // try with single quotes
    if (!s.includes('"'))return '"'+s+'"'; // try with double quotes
    return '"'+s.replace('"','\\"')+'"';   // double quotes escaping double quotes 
}

/**
 * Class for terminals (single words)
 * It mainly deals with declension and conjugation 
 */
class Terminal extends Constituent{
    /**
     * Initialises the terminal by setting up important information
     * @param {string} lemmaArr lemma for this Terminal + an optional language
     * @param {string} terminalType kind of this Terminal
      * @returns a new Terminal instance
     */
    constructor(lemmaArr,terminalType){
        super(terminalType);
        if (lemmaArr.length==0 && terminalType!="DT"){
            this.lang=lang|| getLanguage(); // useful for error message
            this.setLemma("",terminalType);
            this.warn("bad number of parameters",terminalType,0);
            return
        }
        if (lemmaArr.length==1){
            this.lang= getLanguage()
            this.setLemma(lemmaArr[0],terminalType);
        } else if (lemmaArr.length==2 && (lemmaArr[1]=="en" || lemmaArr[1]=="fr")){
            this.lang=lemmaArr[1]
            this.setLemma(lemmaArr[0],terminalType);
        } else {
            this.lang= getLanguage();
            this.setLemma(lemmaArr[0],terminalType);
            if (terminalType!="DT")
                this.warn("bad number of parameters",terminalType,lemmaArr.length)
        }
    }

    /**
     * Computes a string describing this instance
     * @returns string describing this instance
     */
    me(){
        return this.constType+"("+quote(this.lemma)+")";
    }

    /**
     * Output a warning about a morphological error
     * @param {string} errorKind key of the error message
     * @param {object} keyVals properties of this terminal to add to the message 
     * @returns this instance
     */
    morphoError(errorKind,keyVals){
        this.warn("morphology error",errorKind+` :${this.me()} : `+JSON.stringify(keyVals));
        this.realization="[["+this.lemma+"]]";
        this.constType="Q"
        return this
    }

    /**
     * Output a more informative error message, in case add(...) is called on a Terminal
     * otherwise it would simply raise a "method not found" exception
     * In fact: should never be called
     * @returns this instance
     */
    add(){
        this.warn("bad application",".add","Phrase",this.constType)
        return this;
    }

    /**
     * Set lemma, precompute stem and store conjugation/declension table number 
     * @param {string} lemma for which to add morphological information
     * @param {string | undefined} terminalType undefined when it is not called from a Constructor, then keep the current terminalType
     * @returns this instance
     */
    setLemma(lemma,terminalType){
        if (terminalType==undefined) // when it is not called from a Constructor, keep the current terminalType
            terminalType=this.constType;
        if (typeof lemma == "string")
            lemma=lemma.replace(/œ/g,"oe").replace(/æ/g,"ae"); // expand ligature
        this.lemma=lemma;
        if (this.peng===undefined) this.initProps(); // setLemma can be used on an already initialized value
        var lemmaType= typeof lemma;
        switch (terminalType) {
        case "DT":
            if (lemma==undefined){
                this.date=new Date()
            } else {
                if (lemmaType == "string"){
                    this.date = new Date(lemma)
                } else if (lemma instanceof Date){
                    this.date = lemma;
                    this.lemma = lemma.toString()
                } else {
                    this.warn("bad parameter","string, Date",lemmaType);
                }             
            }
            this.props["dOpt"]={year:true,month:true,date:true,day:true,hour:true,minute:true,second:true,
                            nat:true,det:true,rtime:false}
            break;
        case "NO":
            if (lemmaType != "string" && lemmaType != "number"){
                this.warn("bad parameter","string, number",lemmaType);
                this.lemma=this.value=lemma=0
            }
            if (lemmaType == "string"){
                let lexInfo=getLexicon(this.lang)[lemma];
                if (lexInfo !== undefined && lexInfo.value){
                    if (lexInfo["A"]) {
                        // if it exists as an adjective it is considered as an ordinal number written in letters 
                        // is given its "value" as lemma 
                        this.lemma=this.value=lexInfo.value
                        this.props["dOpt"]={ord:true};
                        this.addOptSource("ord",true);
                        break;
                    } else {
                        // a number written in letters is given its "value" as lemma 
                        this.lemma=this.value=lexInfo.value
                        this.props["dOpt"]={nat:true};
                        this.addOptSource("nat",true);
                        break;
                    }
                } else if (!/^[-+]?[0-9]+([., ][0-9]*)?([Ee][-+][0-9]+)?$/.test(lemma)){
                    // check if this looks like a legal number...
                    this.warn("bad parameter","number",lemmaType);
                    this.lemma=this.value=0;
                } else {
                    this.lemma=lemma=lemma.replace(this.thousand_seps(),"")
                    this.value=+lemma; // this parses the number if it is a string
                }
            } else {
                this.lemma=this.value=lemma;
            }
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
            let lexInfo=getLexicon(this.lang)[lemma];
            if (lexInfo==undefined){
                this.tab=null;
                this.realization =`[[${lemma}]]`;
                if (quoteOOV){
                    this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                    this.constType="Q";
                    this.realization=this.lemma
                } else {
                    this.warn("not in lexicon",this.lang);                    
                }
            } else {
                lexInfo=lexInfo[terminalType];
                if (lexInfo===undefined){
                        this.tab=null;
                        this.realization =`[[${lemma}]]`;
                        let otherPOS=Object.keys(getLexicon(this.lang)[lemma]);
                        let idxLdv=otherPOS.indexOf("ldv") // check if "ldv" is a key...
                        if (idxLdv>=0)otherPOS.splice(idxLdv,1) // remove it if is there...
                        if (quoteOOV){
                            this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                            this.constType="Q";
                            this.realization=this.lemma
                        } else {
                            this.warn("not in lexicon",this.lang,otherPOS);                            
                        }
                } else {
                    const keys=Object.keys(lexInfo);
                    const rules=getRules(this.lang);
                    for (let i = 0; i < keys.length; i++) {
                        const key=keys[i];
                        if (key=="tab"){ // save table number and compute stem
                            var ending;
                            this.tab=lexInfo["tab"]
                            if (terminalType!="V") {// looking for a declension
                                const declension=rules.declension[this.tab]; // occurs for C, Adv and P
                                if (declension !== undefined){
                                    ending = declension.ending;
                                    // set person for Pro when different than 3 (i.e. all elements of declension are the same)
                                    if (terminalType=="Pro"){
                                        const dd=declension.declension;
                                        const pe=dd[0].pe || 3;
                                        if (pe !== 3){
                                            let i=1;
                                            while (i<dd.length && dd[i].pe==pe)i++;
                                            if (i==dd.length)this.setProp("pe",pe);
                                        }
                                    } else if (terminalType=="N" && this.noun_always_plural().includes(this.tab)){
                                        this.setProp("n","p")
                                    }
                                }
                            } else { // looking for a conjugation
                                const conjTable = rules.conjugation[this.tab];
                                if (conjTable !== undefined){
                                    ending=conjTable.ending
                                } else {// this can happen when a wrong lexicon entry has been added
                                    ending=""
                                    this.warn("bad lexicon table",lemma,ending);
                                }
                            }
                            if (lemma.endsWith(ending)){
                                this.stem=lemma.substring(0,lemma.length-ending.length);
                            } else {
                                this.tab=null
                                if (!this.isA("Adv","C","P"))
                                    this.warn("bad lexicon table",lemma,ending);
                            }
                        } else { // copy other key as property
                            let info=lexInfo[key]
                            this.setProp(key,info,true);
                        }
                    }
                }
            }        
            break;
        default:
            this.warn("not implemented",terminalType);
        }
        return this;
    }

    /**
     * Computes the appropriate "grammatical number" for this NO according to the rules of the language
     * @returns "s" | "p"
     */
    grammaticalNumber(){
        if (!this.isA("NO")){
            return this.warn("bad application","grammaticalNumber","NO",this.constType);
        }
        if (this.props["n"]) return this.props["n"] // explicit number given to NO
        if (this.props["dOpt"].ord==true)return "s"; // ordinal number are always singular
        return null
    };

    /**
     * Find the best declension match
     * @param {string} errorKind key for an eventual morphological warning
     * @param {Object} declension declension table to search
     * @param {Object} keyVals key-value pairs to search
     * @returns string to add to the stem for the best match or null if nothing could be found
     */
    bestMatch(errorKind,declension,keyVals){
        let matches=[];
        for (var i = 0; i < declension.length; i++) {
            // try to find the best declension match
            //    value equal = 2, equal with x = 1, no match = 0
            //  but if the person does not match set score to 0
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
            this.morphoError(errorKind,keyVals)
            return null;
        } 
        return best[1];
    }

    /**
     * Check if this terminal is in the context of a "maje:true" .typ option 
     * @returns {boolean}
     */
    isMajestic(){
        const maje = this.getProp("maje"); // check local value
        if (maje !== undefined) return maje;
        let pc = this.parentConst; // check context
        while (pc != null){
            const typs=pc.props["typ"]
            if (typs !== undefined && typs["maje"]===true)return true
            pc=pc.parentConst;
        }
        return false;
    }

    /**
     * French and English declension of this Terminal taking current properties into account
     * @param {boolean} setPerson if true, take person into account
     * @returns list of Terminals with their realization field filled
     */
    decline(setPerson){
        const rules=getRules(this.lang);
        let declension=rules.declension[this.tab].declension;
        let stem=this.stem;
        let g=this.getProp("g");
        if (this.isA("D","N") && g==undefined)g="m";
        let n = this.getNumber()
        if (this.isA("D","N") && n==undefined)n="s";
        if (this.isA("A","Adv")){ 
            return this.decline_adj_adv(rules,declension,stem)
        } else if (declension.length==1){ // no declension
            this.realization = this.stem+declension[0]["val"]
        } else { // for N, D, Pro
            let pe=3;
            if (setPerson){
                let p=this.getProp("pe");
                pe = p===undefined ? 3 : +p;
            }
            let keyVals=setPerson?{pe:pe,g:g,n:n}:{g:g,n:n};
            if (!this.isA("N") && this.isMajestic()){
                if (this.check_majestic(keyVals))
                    declension=rules.declension[this.tab].declension;
            }
            if (this.props["own"]!==undefined)keyVals["own"]=this.props["own"];
            if (this.isA("Pro")){// check special combinations of tn and c for pronouns
                const c  = this.props["c"];
                if (c!==undefined){
                    if (!this.check_bad_pronoun_case(c))
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
                    if (this.lemma == this.tonic_pe_1()){
                    // HACK:remove defaults from pronoun such as "moi" in French and "me" in English
                        //      because their definition is special in order to try to keep some upward compatibility
                        //      with the original way of specifying the pronouns
                        if (this.getProp("g") ===undefined)delete keyVals["g"];
                        if (this.getProp("n") ===undefined)delete keyVals["n"];
                        // make sure it matches the first and set the property for verb agreement
                        if ((c=="nom" || tn=="") && this.getProp("pe")===undefined){
                            keyVals["pe"]=1;
                            this.setProp("pe",1);
                        } 
                    } else { // set person, gender and number except when subject in an English genitive
                        const d0=declension[0];
                        if (this.should_set_person_number(c)){
                            this.setProp("g", d0["g"] || g);
                            this.setProp("n", d0["n"] || n);
                            this.setProp("pe",keyVals["pe"] = d0["pe"] || 3);
                        }
                    }
                } else { // no c, nor tn set tn to "" except for "on"
                    if(this.lemma!="on")keyVals["tn"]="";
                }
            }
            const decl=this.declension_word()
            const ending=this.bestMatch(decl,declension,keyVals);
            if (ending==null){
                return [this.morphoError(decl,keyVals)];
            }
            this.realization = this.stem+ending;
        }
        if (this.isA("N")){
            const resgl = this.check_gender_lexicon(g,n)
            if (resgl != null) return resgl;
            if (n == "p"){
                const rescnt = this.check_countable();
                if (rescnt != null) return rescnt;
            }
        }
        return [this]; 
    }

    /**
     * Insert a new terminal with its realization field already filled in a list of terminal
     * used heavily in conjugate_fr and conjugate_en
     * @param {Terminal[]} terms list of Terminals in which to insert 
     * @param {Terminal} newTerminal new Terminal to which the realization 
     * @param {number} position index in list, at the end when not defined 
     * @returns modified list
     */
    insertReal(terms,newTerminal,position){
        if (newTerminal instanceof Terminal){
            newTerminal.parentConst=this.parentConst;
            newTerminal.realize(); // use jsRealB to fill the realization field
            if (position==undefined)
                terms.push(newTerminal);
            else
                terms.splice(position,0,newTerminal)
            return terms
        } else 
            this.warn("bad Constituent",NO(position+1).dOpt({ord:true}).realize(),typeof newTerminal)
    }

    static noIgnoredReflVerbs=new Set(["avoir","être","pouvoir","devoir","vouloir"]); // used in reflexive

    /**
     * Check if this verb is reflexive either "essentiellement" or is included in a sentence with "typ({refl:true})"
     * @returns true if verb is reflexive
     */
    isReflexive(){
        if (!this.isA("V")){
            return this.error("isReflexive() should be called only for a verb,  not a "+this.constType)
        }
        const pat=this.getProp("pat")
        if (pat!==undefined && pat.length==1  && pat[0]=="réfl") return true; // essentiellement réflexif
        // check for "refl" typ (only called for V): Terminal.conjugate_fr
        let pc=this.parentConst;
        while (pc != undefined){
            // look for the first enclosing S, SP or Dependent with a terminal V
            if (pc.isA("VP","SP","S") || (pc.isA(deprels) && pc.terminal.isA("V"))){
                const typs=pc.props["typ"];
                if (typs!==undefined && typs["refl"]===true){
                    if (!pat.includes("réfl")){
                        this.ignoreRefl=true;
                        if (!Terminal.noIgnoredReflVerbs.has(this.lemma))
                            this.warn("ignored reflexive",pat)
                        return false;
                    }
                    return true
                }
                if (!pc.isA("VP")) // unless it is VP stop at the first sentence
                    return false
            }
            pc=pc.parentConst;
        }
        return false
    }

    /**
     * Format the date
     * @param {Date} dateObj the date to format
     * @param {Object} dOpts options to take into account
     * @returns string representation of the date
     */
    dateFormat(dateObj,dOpts){
        // useful abbreviations for date format access
        const fmtRE=/(.*?)\[(.+?)\]|(.+$)/g
        const dateRule = getRules(this.lang).date
        const fmts=dateRule.format[dOpts["nat"]?"natural":"non_natural"]
        
        function interpret(fields){
            if (fields.length==0)return "";
            let res="";
            let fmt=fmts[fields];
            if (!dOpts["det"])fmt=fmt.slice(fmt.indexOf("[")); // remove determineer before first left bracket
            for (const m of fmt.matchAll(fmtRE)){
                if (m[1]==undefined)
                    res+=m[3];
                else {
                    const z=(n=>(n<10?"0":"")+n);
                    res+=m[1];
                    switch (m[2]) {
                        case "Y" : res+=dateObj.getFullYear(); break;
                        case "F" : res+=dateRule["text"]["month"][""+(dateObj.getMonth()+1)]; break;
                        case "M0": res+=z(dateObj.getMonth()+1); break;
                        case "M" : res+=dateObj.getMonth()+1; break;
                        case "d0": res+=z(dateObj.getDate()); break;
                        case "d" : res+=dateObj.getDate(); break;
                        case "l" : res+=dateRule["text"]["weekday"][""+dateObj.getDay()]; break;
                        case "A" : res+=dateRule["text"]["meridiem"][dateObj.getHours()<12 ? 0 : 1]; break;
                        case "h" : res+=dateObj.getHours()%12; break;
                        case "H0": res+=z(dateObj.getHours()); break;
                        case "H" : res+=dateObj.getHours(); break;
                        case "m0": res+=z(dateObj.getMinutes()); break;
                        case "m" : res+=dateObj.getMinutes(); break;
                        case "s0": res+=z(dateObj.getSeconds()); break;
                        case "s" : res+=dateObj.getSeconds(); break;
                        break;
                    default:
                        console.log("strange field:"+m[2])
                    }
                }    
            }
            return res;
        }
        let dateS;
        if (dOpts["rtime"]){
            const relativeDate = dateRule["format"]["relative_time"]
            // find the number of days of difference between relDay and the time of the dateObj
            const relDay=dOpts["rtime"]
            const diffDays=Math.ceil((dateObj.getTime()-relDay.getTime())/(24*60*60*1000));
            relDay.setDate(relDay+diffDays);
            const res=relativeDate[""+diffDays];
            if (res!==undefined){
                dateS=relativeDate[""+diffDays].replace("[l]",dateRule["text"]["weekday"][dateObj.getDay()])
            } else {
                const sign=diffDays<0?"-":"+";
                dateS=relativeDate[sign].replace("[x]",Math.abs(diffDays))
            }
        } else {
            dateS = interpret(["year","month","date","day"].filter(field=> dOpts[field]==true).join("-"));
        }
        let timeFields = ["hour","minute","second"].filter(field=> dOpts[field]==true).join(":")
        if (dOpts["nat"]===true){// remove 0 min and 0 seconds in natural mode
            const h = dateObj.getHours()
            const m = dateObj.getMinutes()
            const s = dateObj.getSeconds()
            if (timeFields=="hour:minute:second"){
                if (m==0 && s==0){
                    if (h==0) timeFields = "0h"
                    else if (h==12) timeFields = "12h" 
                    else timeFields="hour"
                } else if (s==0) timeFields="hour:minute"
            } else if (timeFields=="hour:minute"){
                if (m==0) timeFields = "hour"
            }
        }
        const timeS = interpret(timeFields);
        return [dateS,timeS].filter(s=>s.length>0).join(" ")
    }

    /**
     * Realize (i.e. set the "realization" field) for this Terminal
     * @returns list of Terminals in which the "realization" field has been filled 
     */
    real(){
        switch (this.constType) {
        case "N": case "A": 
            if (this.tab!==null) return this.doFormat(this.decline(false));
            break;
        case "Adv":
            if (this.tab!==null)return this.doFormat(this.decline(false));
            else if (this.realization===null) this.realization=this.lemma;
            break;
        case "C": case "P": case "Q":
            if(this.realization===null)this.realization=this.lemma;
            break;
        case "D": case "Pro":
            if (this.tab!==null)return this.doFormat(this.decline(true));
            break;
        case "V":
            // caution: conjugate returns a list of tokens
            return this.doFormat(this.conjugate());
        case "DT":
            this.realization=this.dateFormat(this.date,this.getProp("dOpt"));
            break;
        case "NO":
            this.setProp("n",this.grammaticalNumber())
            const opts=this.getProp("dOpt");
            if (opts.nat==true){
                this.realization=this.numberToWord(this.value,this.lang,this.peng.g);
            } else if (opts.ord==true){
                this.setProp("n","s") // number of an ordinal number is always singular
                this.realization=this.numberToOrdinal(this.value,this.lang,this.peng.g);
            } else if (opts.rom==true) {
                this.realization = this.numberToRoman(this.value)
            } else if (opts.raw==false){
                this.realization=numberFormatter(this.value,this.lang,opts.mprecision);
            } else { //opts.raw==true
                this.realization=this.value+"";
            }
            break;
        default:
            this.error("Terminal.real:"+this.constType+": not implemented");
        }
        return this.doFormat([this])
    }

    /**
     * Show a number in words (natural form)
     * @param {number} number to write as words 
     * @param {"en"|"fr"} lang language to use
     * @param {"m"|"f"} gender gender to use (in French only)
     * @returns string corresponding to the number in words
     */
    numberToWord(number, lang, gender) {
        if (parseInt(number) !== number){
            this.warn("bad number in word",number)
            return number+"";
        }
        const one = this.numberOne(number,gender)
        if (one != null)return one;
        return enToutesLettres(number,lang);
    };

    /**
     * Show an ordinal number in words (natural form)
     * @param {number} number to write as words 
     * @param {"en"|"fr"} lang language to use
     * @param {"m"|"f"} gender gender to use (in French only)
     * @returns string corresponding to the number in words
     */
    numberToOrdinal(number,lang,gender){
        if (parseInt(number) !== number || number <= 0){
            this.warn("bad ordinal",number)
            return `[[${number}]]`;
        }
        return ordinal(number,lang, gender);
    };

    /**
     * Show a number as roman
     * @param {number} number to write in roman numerotation
     * @returns string corresponding to the value in roman letters 
     */
    numberToRoman(number){
        if (parseInt(number) !== number || number <= 0 || number >= 4000){
            this.warn("bad roman",number)
            return `[[${number}]]`;
        }
        return roman(number)
    }

    /**
     * Produce the string form of a Terminal
     * @returns string corresponding to the creation of this Terminal
     */
    toSource(){
        // create the source of the Terminal
        let res=this.constType+"("+quote(this.lemma)+")";
        // add the options by calling super.toSource()
        return res+super.toSource();    
    }

    /**
     * Creates a "debug" representation from the structure not from the saved source strings
     * CAUTION: this output is NOT a legal jsRealB expression, contrarily to .toSource()
     * @returns string representation of this Terminal
     */
    toDebug(){
        let res=this.constType+"("+quote(this.lemma)+")"+this.getPengTauxStr();
        return res+super.toDebug();
    }
}
