/**
 *   jsRealB 4.5
 *   Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
*/

import { Constituent } from "./Constituent.js";
import { getLanguage,getLexicon,getRules, quoteOOV } from "./Lexicon.js";
import { nbDecimal,numberFormatter, enToutesLettres, ordinal, roman} from "./Number.js";
export {Terminal, N, A, Pro, D, V, Adv, C, P, DT, NO, Q}
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
     * @param {string} lemmaArr lemma for this Terminal
     * @param {string} terminalType kind of this Terminal
     * @param {en|fr} lang language specified mainly in IO-json.js
     * @returns a new Terminal instance
     */
    constructor(lemmaArr,terminalType,lang){ // lang parameter used calls in IO-json.js
        super(terminalType);
        if (lemmaArr.length==0 && terminalType!="DT"){
            this.lang=lang|| getLanguage(); // useful for error message
            this.setLemma("",terminalType);
            this.warn("bad number of parameters",terminalType,0);
            return
        }
        if (lemmaArr.length==1){
            this.lang=lang ||  getLanguage()
            this.setLemma(lemmaArr[0],terminalType);
        } else if (lemmaArr.length==2 && (lemmaArr[1]=="en" || lemmaArr[1]=="fr")){
            this.lang=lemmaArr[1]
            this.setLemma(lemmaArr[0],terminalType);
        } else {
            this.lang=lang|| getLanguage();
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
    // global variables 
    static defaultProps = {en:{g:"n",n:"s",pe:3,t:"p"},             // language dependent default properties
                           fr:{g:"m",n:"s",pe:3,t:"p",aux:"av"}}; 

    initProps(){
        if (this.isA("N","A","D","V","NO","Pro","Q","DT")){
            // "tien" and "vôtre" are very special case of pronouns which are to the second person
            this.peng={pe: Terminal.defaultProps[this.lang]["pe"],
                        n: Terminal.defaultProps[this.lang]["n"],
                        g: Terminal.defaultProps[this.lang]["g"],
                        pengNO:Constituent.pengNO++
                        };
            if (this.isA("V")){
                this.taux={t:Terminal.defaultProps[this.lang]["t"],
                        tauxNO:Constituent.tauxNO++
                        };
                if (this.isFr())
                    this.taux["aux"]=Terminal.defaultProps[this.lang]["aux"];
            }
        }
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
                    this.lemma=lemma=lemma.replace(this.isEn()? /,/g : / /g,"")
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
                this.warn("not in lexicon",this.lang);
                if (quoteOOV){
                    this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                    this.constType="Q";
                    this.realization=this.lemma
                }
            } else {
                lexInfo=lexInfo[terminalType];
                if (lexInfo===undefined){
                        this.tab=null;
                        this.realization =`[[${lemma}]]`;
                        let otherPOS=Object.keys(getLexicon(this.lang)[lemma]);
                        let idxBasic=otherPOS.indexOf("basic") // check if "basic" is a key...
                        if (idxBasic>=0)otherPOS.splice(idxBasic,1) // remove it if is there...
                        this.warn("not in lexicon",this.lang,otherPOS);
                    if (quoteOOV){
                        this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                        this.constType="Q";
                        this.realization=this.lemma
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
                                // this.tab=this.tab[0];
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
                            // if (typeof info === "object" && info.length==1)info=info[0];
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

    /// 
    /**
     * French and English declension of this Terminal taking current properties into account
     * @param {boolean} setPerson if true, take person into account
     * @returns list of Terminals with their realization field filled
     */
    decline(setPerson){
        const rules=getRules(this.lang);
        let declension=rules.declension[this.tab].declension;
        let stem=this.stem;
        let res=null;
        if (this.isA("A","Adv")){ 
            // special case of French adjectives or adv, they can have more than one token
            if (this.isFr()){
                const g=this.getProp("g");
                const n=this.getProp("n");
                const ending=this.bestMatch("déclinaison d'adjectif",declension,{g:g,n:n});
                if (ending==null){
                    return [this.morphoError("decline [fr]:A",{g:g,n:n})];
                }
                const f = this.getProp("f");// comparatif d'adjectif
                if (f !== undefined && f !== false){
                    const specialFRcomp={"bon":"meilleur","mauvais":"pire"};
                    res = []
                    if (f == "co"){
                        const comp = specialFRcomp[this.lemma];
                        if (comp !== undefined){
                            this.insertReal(res,A(comp).g(g).n(n));
                        } else {
                            this.insertReal(res,Adv("plus"))
                            this.insertReal(res,A(this.lemma).g(g).n(n)) // to avoid infinite recursion
                        }
                   } else if (f == "su"){
                        this.insertReal(res,D("le").g(g).n(n))
                        const comp = specialFRcomp[this.lemma];
                        if (comp !== undefined){
                            this.insertReal(res,A(comp).g(g).n(n))
                        } else {
                            this.insertReal(res,Adv("plus"))
                            this.insertReal(res,A(this.lemma).g(g).n(n)) // to avoid infinite recursion
                        }
                    }
                    return res
                } else {
                    this.realization = this.stem+ending
                    return [this]
                }
            } else {
                // English adjective/adverbs are invariable but they can have comparative, thus more than one token
                this.realization = this.lemma;
                const f = this.getProp("f");// usual comparative/superlative
                if (f !== undefined && f !== false){
                    if (this.tab=="a1"){
                        const comp = Adv(f=="co"?"more":"most")
                        comp.realization = comp.lemma
                        return [comp,this]
                    } else {
                        if (this.tab=="b1"){// this is an adverb with no comparative/superlative, try the adjective table
                            const adjAdv=getLexicon(this.lang)[this.lemma]["A"]
                            if (adjAdv !== undefined){
                                declension=rules.declension[adjAdv["tab"]].declension;
                                const ending=rules.declension[adjAdv["tab"]].ending;
                                stem=stem.slice(0,stem.length-ending.length);
                            } else // adverb without adjective
                                return [this]
                        } 
                        // look in the adjective declension table
                        const ending=this.bestMatch("adjective declension",declension,{f:f})
                        if (ending==null){
                            return [this.morphoError("decline [en]:A",{f:f})]
                        }
                        this.realization = stem + ending;
                        return [this]
                    }
                }
            }
        } else if (declension.length==1){ // no declension
            this.realization = this.stem+declension[0]["val"]
        } else { // for N, D, Pro
            let g=this.getProp("g");
            if (this.isA("D","N") && g==undefined)g="m";
            let n=this.getProp("n");
            if (this.isA("D","N") && n==undefined)n="s";
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
                        if ((c=="nom" || tn=="") && this.getProp("pe")===undefined){
                            keyVals["pe"]=1;
                            this.setProp("pe",1);
                        } 
                    } else { // set person, gender and number except when subject in an English genitive
                        const d0=declension[0];
                        if (this.isFr() || c != "gen"){
                            this.setProp("g", d0["g"] || g);
                            this.setProp("n", d0["n"] || n);
                            this.setProp("pe",keyVals["pe"] = d0["pe"] || 3);
                        }
                    }
                } else { // no c, nor tn set tn to "" except for "on"
                    if(this.lemma!="on")keyVals["tn"]="";
                }
            }
            const decl=this.isFr()?"déclinaison":"declension"
            const ending=this.bestMatch(decl,declension,keyVals);
            if (ending==null){
                return [this.morphoError(decl,keyVals)];
            }
            if (this.isFr() && this.isA("N")){ 
                // check is French noun gender specified corresponds to the one given in the lexicon
                const lexiconG=getLexicon(this.lang)[this.lemma]["N"]["g"]
                if (lexiconG === undefined){
                    return [this.morphoError("genre absent du lexique",{g:g,n:n})];
                } 
                if (lexiconG != "x" && lexiconG != g) {
                    return [this.morphoError("genre différent de celui du lexique",{g:g, lexique:lexiconG})]
                }
            }
            this.realization = this.stem+ending;
        }
        return [this]; 
    }

    /**
     * Insert a new terminal with its realization field already filled in a list of terminal
     * used heavily in conjugate_fr and conjugate_en
     * @param {Terminal[]} terms list of Terminals in which to insert 
     * @param {Terminal} newTerminal new Terminal to which the realization 
     * @param {number} position index in list 
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
            if (pc.isA("VP","SP","S") || (pc.isA(Constituent.deprels) && pc.terminal.isA("V"))){
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
     * French conjugation of this Terminal
     * @returns list of Terminals with their realization field filled
     */
    conjugate_fr(){
        let pe = +this.getProp("pe") || 3; // property can also be a string with a single number 
        let g = this.getProp("g");
        let n = this.getProp("n");
        const t = this.getProp("t");
        let neg;
        if (this.tab==null) 
            return [this.morphoError("conjugate_fr:tab",{pe:pe,n:n,t:t})];
        switch (t) {
        case "pc":case "pq":case "cp": case "fa": case "pa": case "spa": case "spq": case "bp":// temps composés
            const tempsAux={"pc":"p","pq":"i","cp":"c","fa":"f","pa":"ps","spa":"s","spq":"si", "bp":"b"}[t];
            const aux =  V("avoir","fr"); // new Terminal(["avoir"],"V","fr");
            aux.parentConst=this.parentConst;
            aux.peng=this.peng;
            aux.taux=Object.assign({},this.taux); // separate tense of the auxiliary from the original
            if (this.isReflexive()){
                aux.setLemma("être");          // réflexive verbs must use French "être" auxiliary
                aux.setProp("pat",["réfl"]);   // set reflexive for the auxiliary
            } else if (aux.taux["aux"]=="êt"){
                aux.setLemma("être");
            } else {   // auxiliary "avoir"
                // check the gender and number of a cod appearing before the verb to do proper agreement
                //   of its past participle  except when the verb is "être" which will always agree
                if (this.lemma!="être"){
                    g="m"
                    n="s";
                    var cod = this.cod;
                    if (cod !== undefined){
                        g=cod.getProp("g");
                        n=cod.getProp("n");
                    }
                }
            }
            aux.taux["t"]=tempsAux;
            aux.realization=aux.realize();  // realize the auxiliary using jsRealB!!!
            const pp=V(this.lemma,"fr")
            // change this verb to pp
            pp.setProp("g",g);
            pp.setProp("n",n);
            pp.setProp("t","pp");
            pp.realization=pp.realize();      // realize the pp using jsRealB without other options
            this.realization=pp.realization;  // set verb realization to the pp realization
            //  check special cases
            if (this.neg2 !== undefined) {
                aux.neg2=this.neg2;                // save this flag to put on the auxiliary, 
                delete this.neg2;                  // delete it on this verb
            }
            if (this.props["lier"]===true){
                aux.setProp("lier",true)  // put this flag on the auxiliary
                delete this.props["lier"] // delete it from the verb
                // HACK: check if the verb was lié to a nominative pronoun (e.g. subject inversion for a question)
                const myParent=this.parentConst;
                if (myParent!==null){
                    if (!myParent.isA(Constituent.deprels)){
                        const myself=this;
                        const myParentElems=myParent.elements;
                        let idxMe=myParentElems.findIndex(e => e==myself,this);
                        if (idxMe>=0 && idxMe<myParentElems.length-1){
                            const idxNext=idxMe+1;
                            const next=myParentElems[idxNext]
                            if (next.isA("Pro")){
                                const thePro=myParentElems.splice(idxNext,1)[0]; // remove next pro from parent
                                thePro.realization=thePro.realize() // insert its realization after the auxiliary and before the verb
                                return [aux,thePro,this] 
                            }
                        }
                    } else {
                        // search for pronoun in parent
                        const proIndex=myParent.findIndex(d=>d.terminal.isA("Pro"))
                        if (proIndex>=0) {
                            const thePro=myParent.removeDependent(proIndex).terminal; // remove Pro from Parent
                            const thePro2=thePro.clone();   // as the original Pro is already realized in the output list, we must hack
                            thePro2.realization=thePro2.realize(); // insert its realization after the auxiliary and before the verb
                            thePro.realization="";          // set original Pro realization to nothing 
                            return [aux,thePro2,this]
                        }
                    } 
                }
            }
            return [aux,this];
        default:// simple tense
            var conjugation=getRules(this.lang).conjugation[this.tab].t[t];
            if (conjugation!==undefined && conjugation!==null){
                let res,term;
                switch (t) {
                case "p": case "i": case "f": case "ps": case "c": case "s": case "si":
                    term=conjugation[pe-1+(n=="p"?3:0)];
                    if (term==null){
                        return [this.morphoError("conjugate_fr",{pe:pe,n:n,t:t})];
                    } else {
                        this.realization=this.stem+term;
                    }
                    res=[this];
                    if (this.isReflexive() && this.parentConst==null){
                        this.insertReal(res,Pro("moi","fr").c("refl").pe(pe).n(n).g(g),0)
                    }
                    return res;
                case "ip":
                    if ((n=="s" && pe!=2)||(n=="p" && pe==3)){// French imperative does not exist at all persons and numbers
                        return [this.morphoError("conjugate_fr",{pe:pe,n:n,t:t})];
                    }
                    term=conjugation[pe-1+(n=="p"?3:0)];
                    if (term==null){
                        return [this.morphoError("conjugate_fr",{pe:pe,n:n,t:t})];
                    } else {
                        this.realization=this.stem+term;
                    }
                    res=[this];
                    if (this.isReflexive() && this.parentConst==null){
                        this.lier();
                        this.insertReal(res,Pro("moi","fr").tn("").pe(pe).n(n).g(g));
                    }
                    return res;
                case "b": case "pr": case "pp":
                    this.realization=this.stem+conjugation;
                    res=[this];
                    if ( this.isReflexive()&& this.parentConst==null && t!="pp" ){
                        this.insertReal(res,Pro("moi","fr").c("refl").pe(pe).n(n).g(g),0)
                    }
                    if (t=="pp" && this.realization != "été"){ //HACK: peculiar frequent case of être that does not change
                        let g=(this.cod ?? this).getProp("g");
                        let n=(this.cod ?? this).getProp("n");
                        if (g=="x" || g=="n")g="m"; // neutre peut arriver avec un sujet en anglais
                        if (n=="x")n="s";
                        const gn=g+n;
                        if (!(gn == "mp" && this.realization.endsWith("s"))){// pas de s au masculin pluriel si termine en s
                            if (gn != "ms" && this.realization.endsWith("û"))// changer "dû" en "du" sauf pour masc sing
                                this.realization=this.realization.slice(0,-1)+"u"
                            this.realization+={"ms":"","mp":"s","fs":"e","fp":"es"}[gn]
                        }
                    }
                    return res;
                default:
                    return [this.morphoError("conjugate_fr",{pe:pe,n:n,t:t})];
                }
            }
            return [this.morphoError("conjugate_fr:t",{pe:pe,n:n,t:t})];
        }
    }

    /**
     * English conjugation of this Terminal
     * @returns list of Terminals with their realization field filled
     */
    conjugate_en(){
        let pe = +this.getProp("pe") || 3; // property can also be a string with a single number 
        const n = this.getProp("n");
        const g = this.getProp("g") || "m"; // migh be used for reflexive pronoun
        const t = this.getProp("t");
        if (this.tab==null)
            return [this.morphoError("conjugate_en:tab",{pe:pe,n:n,t:t})];
        // subjonctive present is like present except that it does not end in s at 3rd person
        // subjonctive past is like simple past
        const t1 = t=="s"?"p":(t=="si"?"ps":t);
        const conjugation=getRules(this.lang).conjugation[this.tab].t[t1];
        let res=[this];
        if (conjugation!==undefined){
            switch (t) {
                case "p": case "ps": 
                case "s": case "si": 
                    if (typeof conjugation == "string"){
                        this.realization=this.stem+conjugation;
                    } else {
                        let term=conjugation[pe-1+(n=="p"?3:0)];
                        if (term==null){
                            return [this.morphoError("conjugate_en:pe",{pe:pe,n:n,t:t})];
                        } else {
                            // remove final s at subjonctive present by taking the form at the first person
                            if (t=="s" && pe==3)term=conjugation[0];
                            this.realization=this.stem+term;
                        }
                    }
                    break;
                case "b": case "pp": case "pr":
                    this.realization=this.stem+conjugation;
            }
        } else if (t=="f"){
            this.realization=this.lemma;
            this.insertReal(res,V("will"),0);
        } else if (t=="c"){
            this.realization=this.lemma;
            this.insertReal(res,V("will").t("ps"),0);
        } else if (t=="bp" || t=="bp-to"){
            const pp = getRules(this.lang).conjugation[this.tab].t["pp"];
            this.realization=pp!==undefined?(this.stem+pp):this.lemma;
            this.insertReal(res,V("have").t("b"),0);
            if (t=="bp-to") this.insertReal(res,P("to"),0);
        } else if (t=="b-to"){
            this.realization=this.lemma;
            this.insertReal(res,P("to"),0);
        } else if (t=="ip"){
            this.realization=this.lemma;
            if (pe==1 && n=="p")this.insertReal(res,Q("let's"),0);
        } else
            return [this.morphoError("conjugate_en: unrecognized tense",{pe:pe,n:n,t:t})];
        return res;
    }

    /**
     * Conjugation of this Terminal
     * @returns list of Terminals with their realization field filled
     */
    conjugate(){
        if (this.isFr())return this.conjugate_fr();
        else return this.conjugate_en();
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
        
        const timeS = interpret(["hour","minute","second"].filter(field=> dOpts[field]==true).join(":"));
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
        if (lang=="fr" && gender=="f"){
            if (number==1)return "une";
            if (number==-1) return "moins une";
        } 
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
     * Creates a new copy of this instance by evaluating a string representation of this object
     * NB: this method is identical in subclasses of Constituent and cannot be defined in Constituent 
     * to ensure that eval has access to all symbols now that packages are used
     * @returns a deep copy of this instance
     */
    clone(){
        return eval(this.toSource());
    }

    /**
     * Produce the string form of a Terminal
     * @returns string corresponding to the creation of this Terminal
     */
    toSource(){
        // create the source of the Terminal
        let res=this.constType+"("+quote(this.lemma)+")";
        // add the options by calling super.toSource()
        return res+Constituent.prototype.toSource.call(this);    
    }

    /**
     * Creates a "debug" representation from the structure not from the saved source strings
     * CAUTION: this output is NOT a legal jsRealB expression, contrarily to .toSource()
     * @returns string representation of this Terminal
     */
    toDebug(){
        let res=this.constType+"("+quote(this.lemma)+")";
        if (this.peng !== undefined){
            if (this.peng.pengNO !== undefined) res += "#"+this.peng.pengNO;
            if (this.peng.tauxNO !== undefined) res += "-"+this.peng.tauxNO;
        } 
        return res+Constituent.prototype.toDebug.call(this);
    }
}

/**
 * Creates a Noun Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with N as constType
 */
function N  (_){ return new Terminal(Array.from(arguments),"N") }
/**
 * Creates an Adjective Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NA as constType
 */
function A  (_){ return new Terminal(Array.from(arguments),"A") }
/**
 * Creates a Pronoun Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with Pro as constType
 */
function Pro(_){ return new Terminal(Array.from(arguments),"Pro") }
/**
 * Creates a Determiner Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with D as constType
 */
function D  (_){ return new Terminal(Array.from(arguments),"D") }
/**
 * Creates a Verb Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NV as constType
 */
function V  (_){ return new Terminal(Array.from(arguments),"V") }
/**
 * Creates an Adverb Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with N as constType
 */
function Adv(_){ return new Terminal(Array.from(arguments),"Adv") }
/**
 * Creates a Conjunction Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with C as constType
 */
function C  (_){ return new Terminal(Array.from(arguments),"C") }
/**
 * Creates a Preposition Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with P as constType
 */
function P  (_){ return new Terminal(Array.from(arguments),"P") }
/**
 * Creates a Date Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with DT as constType
 */
function DT (_){ return new Terminal(Array.from(arguments),"DT") }
/**
 * Creates a Number Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NO as constType
 */
function NO (_){ return new Terminal(Array.from(arguments),"NO") }
/**
 * Creates a Quoted String Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with Q as constType
 */
function Q  (_){ return new Terminal(Array.from(arguments),"Q") }

const tonicForms = {
    "fr" : ["toi","lui","nous","vous","eux","elle","elles","on","soi"],
    "en" : ["us","her","you","him","them","it"]
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
Constituent.prototype.getTonicPro = function(case_){
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
            if (tonicForms[this.lang].includes(this.lemma)){
                // lemma is already in tonic form
                if (case_ !== undefined)
                    return Pro(this.lemma).c(case_)
            } else {
                if (case_ !== undefined)
                    return Pro(this.realize()).c(case_)
            }
            return this
        }
    } else { // generate the string corresponding to the tonic form
        let pro=Pro(this.isFr()?"moi":"me",this.lang);
        const g = this.getProp("g");
        if (g!==undefined)pro.g(g);
        const n = this.getProp("n");
        if (n!==undefined)pro.n(n);
        const pe = this.getProp("pe");
        if (pe!==undefined)pro.pe(pe);
        if (case_===undefined) return Pro(pro.realize(),this.lang).tn("");
        return Pro(pro.realize(),this.lang).c(case_) 
    }
}
