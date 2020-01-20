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
                if (neg !== undefined){
                    res+=" "+neg;
                }
                return res;
            case "b": case "pr": case "pp":
                res=this.stem+conjugation;
                neg=this.prop["neg"];
                if (neg !== undefined){
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

