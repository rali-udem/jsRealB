/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

////// Creates a Terminal (subclass of Constituent)
// Terminal
function Terminal(lemmaArr,terminalType,lang){
    Constituent.call(this,terminalType);
    if (lemmaArr.length==0 && terminalType!="DT"){
        this.lang=lang||currentLanguage; // useful for error message
        this.setLemma("",terminalType);
        this.warn("bad number of parameters",terminalType,0);
        return
    }
    if (lemmaArr.length==1){
        this.lang=lang || currentLanguage
        this.setLemma(lemmaArr[0],terminalType);
    } else if (lemmaArr.length==2 && (lemmaArr[1]=="en" || lemmaArr[1]=="fr")){
        this.lang=lemmaArr[1]
        this.setLemma(lemmaArr[0],terminalType);
    } else {
        this.lang=lang||currentLanguage;
        this.setLemma(lemmaArr[0],terminalType);
        if (terminalType!="DT")
            this.warn("bad number of parameters",terminalType,lemmaArr.length)
    }
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
        if (lemmaType == "string"){
            // check if this looks like a legal number...
            if (!/^[-+]?[0-9]+([.,][0-9]*)?([Ee][-+][0-9]+)?$/.test(lemma)){
                this.warn("bad parameter","number",lemmaType);
                lemma=0;
            } else {
                lemma=lemma.replace(this.isEn()? /,/g : / /g,"")
            }
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
            if (quoteOOV){
                this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                this.constType="Q";
            } else {
                this.tab=null;
                this.realization =`[[${lemma}]]`;
                this.warn("not in lexicon");
            }
        } else {
            lexInfo=lexInfo[terminalType];
            if (lexInfo===undefined){
                if (quoteOOV){
                    this.lemma=typeof lemma=="string"?lemma:JSON.stringify(lemma);
                    this.constType="Q";
                } else {
                    this.tab=null;
                    this.realization =`[[${lemma}]]`;
                    this.warn("not in lexicon",Object.keys(this.getLexicon()[lemma]));
                }
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
                            if (declension !== undefined){
                                ending = declension.ending;
                                // set person for Pro when different than 3 (i.e. all elements of declension are the same)
                                if (terminalType=="Pro"){
                                    const dd=declension.declension;
                                    const pe=dd[0].pe;
                                    if (pe !== 3){
                                        let i=1;
                                        while (i<dd.length && dd[i].pe==pe)i++;
                                        if (i==dd.length)this.setProp("pe",pe);
                                    }
                                }
                            }
                        } else {
                            ending = rules.conjugation[this.tab].ending;
                        }
                        if (lemma.endsWith(ending)){
                            this.stem=lemma.substring(0,lemma.length-ending.length);
                        } else {
                            this.tab=null
                            if (!this.isOneOf(["Adv","C","P"]))
                                this.warn("bad lexicon table",lemma,ending);
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
    let stem=this.stem;
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
                            const ending=rules.declension[adjAdv["tab"][0]].ending;
                            stem=stem.slice(0,stem.length-ending.length);
                        }
                    } 
                    // look in the adjective declension table
                    const ending=this.bestMatch("adjective declension",declension,{f:f})
                    if (ending==null){
                        return `[[${this.lemma}]]`;
                    }
                    res = stem + ending;
                }
            }
        }
    } else if (declension.length==1){ // no declension
        res=this.stem+declension[0]["val"]
    } else { // for N, D, Pro
        let g=this.getProp("g");
        if (this.isOneOf(["D","N"]) && g==undefined)g="m";
        let n=this.getProp("n");
        if (this.isOneOf(["D","N"]) && n==undefined)n="s";
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

Terminal.prototype.removeNextConstInSentence = function(){
    const parentElems=this.parentConst.elements;
    const me=this;
    const meIdx=parentElems.findIndex(e=>e===me);
    if (meIdx>=0){
        const nextWord=parentElems.splice(meIdx+1,1)[0]; // remove nextWord from parent
        nextWord.realization=nextWord+""; // force realization
        return nextWord;
    } 
    return this.error("no parent for removeNextConstInSentence")
}

// create a new constituent and fill its realization field 
// used in conjugate_fr and conjugate_en
function constReal(cnst){
    cnst.realization=cnst.isA("Q")?cnst.lemma:cnst.toString();
    return cnst;
}
// French conjugation returns a list of Terminals
Terminal.prototype.conjugate_fr = function(){
    let pe = +this.getProp("pe") || 3; // property can also be a string with a single number 
    let g = this.getProp("g");
    let n = this.getProp("n");
    const t = this.getProp("t");
    let neg;
    if (this.tab==null) 
        return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_fr:tab",{pe:pe,n:n,t:t})))];
    switch (t) {
    case "pc":case "pq":case "cp": case "fa": case "spa": case "spq":// temps composés
        const tempsAux={"pc":"p","pq":"i","cp":"c","fa":"f","spa":"s","spq":"si"}[t];
        // const aux=this.getProp("aux");
        // const v=V("avoir").pe(pe).n(n).t(tempsAux);
        const aux =  V("avoir","fr"); // new Terminal(["avoir"],"V","fr");
        aux.parentConst=this.parentConst;
        aux.peng=this.peng;
        aux.taux=this.taux;
        aux.taux["t"]=tempsAux;
        if (aux.taux["aux"]=="êt"){
            aux.setLemma("être");
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
        // const vLemma=new Terminal([this.lemma],"V","fr")
        let pp=constReal(V(this.lemma,"fr").t("pp").g(g).n(n));
        neg=this.neg2;
        aux.realization=aux+"";
        if (this.props["lier"] !== undefined ){
            aux.props["lier"]=this.props["lier"];
            const nextWord=this.removeNextConstInSentence();
            if (neg!==undefined && neg !== ""){
                delete this.neg2;
                // const negFr=new Terminal([neg],"Adv","fr");
                return [aux,nextWord,constReal(Adv(neg,"fr")),pp];
            } else {
                return [aux,nextWord,pp]
            }
        }
        if (neg!==undefined && neg !== ""){
            // const negFr=new Terminal([neg],"Adv","fr");
            return [aux,constReal(Adv(neg,"fr")),pp];
        }
        return [aux,pp];
        // return VP(v,V(this.lemma).t("pp").g(g).n(n))+"";
    default:// simple tense
        var conjugation=this.getRules().conjugation[this.tab].t[t];
        if (conjugation!==undefined && conjugation!==null){
            let res;
            switch (t) {
            case "p": case "i": case "f": case "ps": case "c": case "s": case "si": case "ip":
                if (t=="ip"){ // French imperative does not exist at all persons and numbers
                    if ((n=="s" && pe!=2)||(n=="p" && pe==3)){
                        return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t})))];
                    }
                }
                if (n=="p"){pe+=3};
                const term=conjugation[pe-1];
                if (term==null){
                    return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t})))];
                } else {
                    this.realization=this.stem+term;
                }
                neg=this.neg2;
                if (this.props["lier"]!==undefined){
                    const nextWord=this.removeNextConstInSentence();
                    if (neg!==undefined && neg !== ""){
                        // const negFr=new Terminal([neg],"Adv","fr");
                        return [this, nextWord,constReal(Adv(neg,"fr"))];
                    } else {
                        return [this,nextWord]
                    }
                } 
                if (neg !== undefined && neg !== ""){
                    // const negFr=new Terminal([neg],"Adv","fr");
                    return [this,constReal(Adv(neg,"fr"))]
                }
                return [this];
            case "b": case "pr": case "pp":
                this.realization=this.stem+conjugation;
                if (t=="pp" && this.realization != "été"){ //HACK: peculiar frequent case of être that does not change
                    let g=this.getProp("g");
                    if (g=="x")g="m";
                    let n=this.getProp("n");
                    if (g=="x")g="s";
                    this.realization+={"ms":"","mp":"s","fs":"e","fp":"es"}[g+n]
                }
                neg=this.neg2;
                if (neg !== undefined && neg !== ""){
                    const qNeg=Q(neg);
                    qNeg.realization=neg;
                    if (t=="b"){
                        return [qNeg,this]
                    }
                    else return[this,qNeg];
                }
                return [this];
            default:
                return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_fr",{pe:pe,n:n,t:t})))];
            }
        }
        return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_fr:t",{pe:pe,n:n,t:t})))];
    }
}

// English conjugation returns a list of terminals
Terminal.prototype.conjugate_en = function(){
    let pe = +this.getProp("pe") || 3; // property can also be a string with a single number 
    const g=this.getProp("g");
    const n = this.getProp("n");
    const t = this.getProp("t");
    if (this.tab==null)
        return [constReal(Q(this.morphoError(this.lemma,this.constType,"conjugate_en:tab",{pe:pe,n:n,t:t})))];
    // subjonctive present is like present except that it does not end in s at 3rd person
    // subjonctive past is like simple past
    const t1 = t=="s"?"p":(t=="si"?"ps":t);
    const conjugation=this.getRules().conjugation[this.tab].t[t1];
    switch (t) {
        case "p": case "ps": 
        case "s": case "si": 
        if (conjugation!==undefined){
            if (typeof conjugation == "string"){
                this.realization=this.stem+conjugation;
                return [this];
            }
            if (n=="p"){pe+=3};
            let term=conjugation[pe-1];
            if (term==null){
                return [constReal(Q(this.morphoError(this.lemma,this.consType,"conjugate_en:pe",{pe:pe,n:n,t:t})))];
            } else {
                // remove final s at subjonctive present by taking the form at the first person
                if (t=="s" && pe==3)term=conjugation[0];
                this.realization=this.stem+term;
                return [this];
            }
        } else {
            return [constReal(Q(this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",{pe:pe,n:n,t:t})))];
        }
    case "f":
        this.realization=this.lemma;
        return [constReal(V("will","en").t("b")),this];
    case "ip":
        this.realization=this.lemma;
        return [this];
    case "b": case "pp": case "pr":
        if (conjugation===undefined){
            return [constReal(Q(this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",{pe:pe,n:n,t:t})))]
        }
        this.realization=this.stem+conjugation;
        return [this];
    default:
        return [constReal(Q(this.morphoError(this.lemma,"V","conjugate_en: unrecognized tense",{pe:pe,n:n,t:t})))];
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
        // caution: conjugate returns a list of tokens
        return this.doFormat(this.conjugate());
    case "DT":
        this.realization=this.dateFormat(this.date,this.props["dOpt"]);
        break;
    case "NO":
        const opts=this.props["dOpt"];
        if (opts.nat==true){
            this.realization=this.numberToWord(this.value,this.lang,this.peng.g);
        } else if (opts.ord==true){
            this.realization=this.numberToOrdinal(this.value,this.lang,this.peng.g);
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

