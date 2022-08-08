/**
    jsRealB 4.0
    Guy Lapalme, lapalme@iro.umontreal.ca, mars 2022
 */
"use strict";

////// Constructor for a Dependent (a subclass of Constituent)

// Dependent (non-terminal)
function Dependent(params,deprel,lang){ // lang parameter used calls in IO-json.js
    Constituent.call(this,deprel); // super constructor
    this.lang = lang || currentLanguage;
    this.dependents=[];
    this.terminal=Q("*terminal*");    // dummy terminal so that error messages can be issued
    if (params.length==0){
        this.warn("Dependent without params");
        return null;
    }
    if (typeof params[0]=="string"){
        this.terminal=Q(params.shift())
    } else if (params[0] instanceof Terminal){
        this.terminal=params.shift()
    } else {
        this.warn("Dependent needs Terminal",params[0].constructor.name);
        params.shift(); // ignore first param
    }
    this.terminal.parentConst=this;
    this.peng=this.terminal.peng;
    if (this.terminal.isA("V"))this.taux=this.terminal.taux;
    params=_elems(params) // _elems is defined in Phrase to remove "null" and flatten lists
    // params=params.filter(e=>e!=undefined && e!=null) // remove "null" dependents
    // list of dependents to create the source of the parameters at the time of the call
    // this can be different from the dependent lists because of structure modifications
    this.dependentsSource=[]
    if (params.length>0){
        const last=params.length-1;
        // add all dependents except the last to the list of dependents
        for (let i = 0; i < last; i++) {
            let d=params[i];
            if (d instanceof Dependent) {
                this.addDependent(d);
                this.dependentsSource.push(d);
            } else {
                this.warn("bad Dependent",NO(i+1).dOpt({ord:true})+"",d.constructor.name+":"+JSON.stringify(d))
            }
        }
        // terminate the list with add which does other checks on the final list
        this.add(params[last],undefined,true)
    }
}
extend(Constituent,Dependent)

// add a Constituent as a child of this Phrase
Dependent.prototype.addDependent = function(dependent,position){
    if (dependent instanceof Dependent){
        dependent.parentConst=this;
        // add it to the list of dependents
        if (position == undefined){
            this.dependents.push(dependent);
        } else if (typeof position == "number" && position<=this.dependents.length && position>=0){
            this.dependents.splice(position,0,dependent)
        } else {
            this.warn("bad position",position,this.dependents.length)
        }
    } else {
        this.warn("bad Dependent",NO(position+1).dOpt({ord:true})+"",dependent.constructor.name)
    }
    return this
}

// remove a child of this Dependent and return it
Dependent.prototype.removeDependent = function(position){
    if (typeof position == "number" && position<this.dependents.length && position>=0){
        const elem=this.dependents.splice(position,1)[0];
        elem.parentConst=null
        return elem
    }
    return this.warn("bad position",position,this.dependents.length)
}

Dependent.prototype.changeDeprel = function(newDep){
    if (this.isA("coord"))
        this.dependents.forEach((d)=>d.constType=newDep);
    else 
        this.constType=newDep;
    return this;
}

// find index of one of deprels taking into account possible coord starting from position from
// returns -1 when not found
Dependent.prototype.findIndex = function(test,from){
    from = from||0;
    for (let i=from;i<this.dependents.length;i++){
        const d=this.dependents[i];
        if (d.isA("coord") && d.dependents.length>0 && test(d.dependents[0])) return i;
        if (test(d)) return i;
    }
    return -1
}

// add a new constituent, set agreement links
Dependent.prototype.add = function(dependent,position,prog){
    if (!(dependent instanceof Dependent)){
        return this.warn("bad Dependent",this.isFr()?"dernier":"last",dependent.constructor.name)
    }
    if (prog===undefined){// real call to .add 
        this.optSource+=".add("+dependent.toSource()+(position===undefined?"":(","+position) )+")"
    } else {
        this.dependentsSource.push(dependent) // call from the constructor        
    }
    this.addDependent(dependent,position);
    this.linkProperties();
    return this;
}

//  returns an identification string, useful for error messages
Dependent.prototype.me = function(){
    let children=this.dependents.map(function(e){return e.me()});
    children.unshift(this.terminal.me())
    return this.constType+"("+children.join()+")";
}

Dependent.prototype.linkProperties = function(){
    if (this.dependents.length==0) return this;
    //  loop over children to set the peng and taux to their head or subject
    //  so that once a value is changed this change will be propagated correctly...
    const headTerm=this.terminal;
    if (this.isA("coord")){
        // must create this.peng already because it might be used in the current dependents (for adjectives, attributes...)
        // the information will be computed at realization time (see Dependent.prototype.coordReal)
        this.peng={
            pengNO:pengNO++
        };
    }
    for (const d of this.dependents){
        const depTerm=d.terminal;
        switch (d.constType){
        case "subj":
            if (headTerm.isA("V")){
                headTerm.peng=d.peng;
            }
            break;
        case "det":
            if (depTerm.isA("D")){
                if (this.peng){
                    if (depTerm.peng){// save person (for possessives)
                        let pe=depTerm.peng.pe; 
                        depTerm.peng=this.peng;
                        depTerm.peng.pe=pe;
                    } else { // some strange determiner construct do not have peng
                        depTerm.peng=this.peng;
                    } 
                } 
            } else if (depTerm.isA("NO")){
                headTerm.peng["n"]=depTerm.grammaticalNumber();
                // gender agreement between a French number and subject
                depTerm.peng["g"]=headTerm.peng["g"]
            } else if (depTerm.isA("P") && depTerm.lemma=="de"){ // HACK: deal with specific case : det(P("de"),mod(D(...)))
                if (d.dependents.length==1 && d.dependents[0].isA("mod") && 
                    d.dependents[0].terminal.isA("D")){
                    d.dependents[0].terminal.peng=this.peng;
                }
            }
            break;
        case "mod":case "comp":
            if (depTerm.isA("A")){
                depTerm.peng=this.peng
                // check for an attribute of a copula with an adjective
                if (this.isFr() && copulesFR.includes(headTerm.lemma)){
                    const iSubj=this.findIndex(d0=>d0.isA("subj") && d0.terminal.isA("N"));
                    if (iSubj>=0){
                        depTerm.peng=this.dependents[iSubj].peng;
                    }
                }
            } else if (depTerm.isA("V")){
                //   set agreement between the subject of a subordinate or the object of a relative subordinate
                const iRel=d.findIndex(d0=>d0.isA("subj","comp","mod") && 
                        d0.terminal.isA("Pro") && ["qui","que","who","that"].includes(d0.terminal.lemma));
                if (iRel>=0){
                    const rel=d.dependents[iRel].constType;
                    if (rel=="subj"){ // verb agrees with this subject
                        depTerm.peng=this.peng;
                    } else if (this.isFr()){ // rel is comp or mod
                        // in French past participle can agree with a cod appearing before... keep that info in case
                        depTerm.cod=headTerm;
                    }
                }
                // check for past participle in French that should agree with the head
                if (this.isFr() && depTerm.getProp("t")=="pp"){
                    depTerm.peng=this.peng;
                }
            }
            break;
        case "root":
            // this.error("An internal root was found")
            break;
        case "coord":
            if (d.dependents.length>0){
                const firstDep=d.dependents[0]
                if (firstDep.isA("subj")){
                    headTerm.peng=d.peng
                } else if (firstDep.isA("mod","comp")&& firstDep.terminal.isA("V","A")){
                    // consider this as coordination of verb sharing a subject (the current root)
                    //  or a coordination of adjectives
                    for (let d0 of d.dependents){
                        d0.peng=this.peng;
                        d0.terminal.peng=this.peng;
                    }
                }
            }
            break;
        default :
            this.error("Strange dependent:"+d.constType)
        }
    }
}

Dependent.prototype.setLemma = function(lemma,terminalType){
    this.error("***: should never happen: setLemma: called on a Dependent");
    return this;
}


// find the gender, number and Person of NP elements of this Dependent
//   set masculine if at least one NP is masculine
//   set plural if one is plural or more than one combined with and
//   set person to the minimum one encountered (i.e. 1st < 2nd < 3rd) mostly useful for French 
Dependent.prototype.findGenderNumberPerson = function(andCombination){
    let g="f";
    let n="s";
    let pe=3;
    let nb=0;
    for (let i = 0; i < this.dependents.length; i++) {
        const e=this.dependents[i].terminal;
        if (e.isA("NP","N","Pro","Q")){
            nb+=1;
            const propG=e.getProp("g");
            if (propG=="m" || propG=="x" || e.isA("Q"))g="m"; // masculine if gender is unspecified
            if (e.getProp("n")=="p")n="p";
            const propPe=e.getProp("pe");
            if (propPe !== undefined && propPe<pe)pe=propPe;
        }
    }
    if (nb==0) g="m";
    else if (nb>1 && n=="s" && andCombination)n="p";  
    return {"g":g,"n":n,"pe":pe}
}

// Dependency structure modification but that must be called in the context of the parentConst
// because the pronoun depends on the role of the N in the sentence 
//         and its position can also change relatively to the verb
Dependent.prototype.pronominalize_fr = function(){
    let pro;
    let mySelf=this;
    if (this.isA("subj")){
        if (!this.terminal.isA("N","Pro"))
            return this.warn("no appropriate pronoun")
        pro=this.getTonicPro("nom")
    } else if (this.isA("comp","mod") && this.terminal.isA("P")){
        let prep=this.terminal.lemma;
        if (this.dependents.length==1 && this.dependents[0].isA("comp","mod")){
            if (this.dependents[0].terminal.isA("N")){
                const n=this.dependents[0].terminal;
                if (prep == "à"){
                    pro=n.getTonicPro("dat");
                } else if (prep == "de") {
                    pro=Pro("en","fr").c("dat");
                } else if (["sur","vers","dans"].includes(prep)){
                    pro=Pro("y","fr").c("dat");
                } else { // change only the N keeping the P intact
                    pro=this.getTonicPro("nom");
                    mySelf=this.dependents[0];
                }
            } else {
                return this.warn("no appropriate pronoun")
            }
        }
    } else {
        pro=this.getTonicPro("acc")
        if (this.parentConst!==null && this.parentConst.terminal.isA("V")){// consider that it is direct complement
            this.parentConst.terminal.cod=this; // indicate that this is a COD
        }
    }
    pro.parentConst=this;
    pro.peng=mySelf.peng
    mySelf.terminal=pro
    mySelf.dependents=[]
    mySelf.dependentsSource=[]
}

// Pronominalization in English only applies to a N (this is checked before the call)
//  and does not need reorganisation of the sentence 
//  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
Dependent.prototype.pronominalize_en = function(){
    let pro;
    this.props.pe=3; // ensure that pronominalization of anything other than a pronoun is 3rd person
    if (this.parentConst===null || this.isA("subj")){    // is it a subject
        pro=this.getTonicPro("nom")
    } else {
        pro=this.getTonicPro("acc") //is direct complement
    }
    pro.peng=this.peng;
    pro.parentConst=this;
    this.terminal=pro
    this.dependents=[]
    this.dependentsSource=[]
}

// check if any child should be pronominalized
// this must be done in the context of the parent, because some elements might be changed
Dependent.prototype.pronominalizeChildren = function(){
    for (let d of this.dependents){
        if (d.props["pro"]!==undefined && !d.terminal.isA("Pro")){// it can happen that a Pro has property "pro" set within the same expression
            if (d.isFr()){
                d.pronominalize_fr()
            } else { 
                if (d.terminal.isA("N")){
                    d.pronominalize_en()
                } else {
                    return this.warn("no appropriate pronoun")
                }
            }
        }
    }
}

Dependent.prototype.passivate = function(){
    let subj,obj;  // original subject and object, they are swapped below...
    // find the subject
    if (this.terminal.isA("V")){
        const subjIdx=this.findIndex((d)=>d.isA("subj"));
        if (subjIdx>=0){
            subj=this.dependents[subjIdx];
            if (subj.terminal.isA("Pro")){
                // as this pronoun will be preceded by "par" or "by", the "bare" tonic form is needed
                // to which we assign the original person, number, gender
                subj.terminal=subj.terminal.getTonicPro().g(subj.getProp("g"))
                                        .n(subj.getProp("n")).pe(subj.getProp("pe"));
            }
        } else {
            subj=null
        }
        // find direct object (first N or Pro of a comp) from dependents
        const objIdx=this.findIndex((d)=>d.isA("comp")&& d.terminal.isA("N","Pro"))
        if (objIdx>=0){
            obj=this.dependents[objIdx]
            if (obj.terminal.isA("Pro")){
                obj.terminal=obj.terminal.getTonicPro("nom")
            } else if (obj.terminal.isA("N") && obj.props["pro"]!==undefined){
                obj=obj.getTonicPro("nom")
            }
            // swap subject and object by changing their relation name !!!
            // HACK: obj is the new subject
            obj.changeDeprel("subj")
            // make the verb agrees with the new subject (in English only, French is dealt below)
            if (this.isEn()){
                this.terminal.peng=obj.peng
            } 
            if (subj!=null){   // the original subject is now the indirect object
                subj.changeDeprel("mod")
                this.removeDependent(subjIdx);
                this.addDependent(comp(P(this.isFr()?"par":"by",this.lang),subj))
            }
        } else if (subj!=null){ // no object, but with a subject
            //create a dummy subject with a "il"/"it" 
            obj=Pro(this.isFr()?"lui":"it",this.lang).c("nom"); //HACK: obj is the new subject
            // add new subject at the front of the sentence
            this.addPre(obj)
            this.peng=obj.peng
             // add original subject after the verb to serve as an object
            this.addDependent(comp(P(this.isFr()?"par":"by",this.lang),subj))
        }
        if (this.isFr()){
            // do this only for French because in English this is done by processTyp_en
            // change verbe into an "être" auxiliary and make it agree with the newSubj
            // force person to be 3rd (number and tense will come from the new subject)
            const verbe=this.terminal.lemma;
            this.terminal.setLemma("être");
            this.terminal.pe(3);
            if (this.getProp("t")=="ip"){
                this.t("s") // set subjonctive present tense for an imperative
            }
            const pp = V(verbe,"fr").t("pp");
            if (obj!==undefined){ // this can be undefined when a subject is Q or missing
                this.terminal.peng=obj.peng;
                pp.peng=obj.peng;
            }
            // insert the pp before the comp, so that it appears immediately after the verb
            //  calling addPre(pp) would evaluate the pp too soon...
            let compIdx=this.findIndex(d=>d.isA("comp"));
            if (compIdx==-1)compIdx=0;
            this.addPost(pp,compIdx);
        }
    } else {
        return this.warn("not found","V",isFr()?"contexte passif":"passive context")
    }
}

Dependent.prototype.processV = function(types,key,action){
    if (this.isA("coord")){
        this.dependents.forEach(function(d){
            d.processV(types,action)
        })
    } else if (this.terminal.isA("V")){
        const val=types[key];
        if (val!=undefined && val !== false){
            action(this,val)
        }
    }
}

// add special internal dependencies (used only during realization)
Dependent.prototype.addPre = function(terminals,position){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*pre*"),position)
        return this;
    }
    for (let terminal of terminals){
        this.addDependent(new Dependent([terminal],"*pre*"),position)
    }
    return this;
}

Dependent.prototype.addPost = function(terminals){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*post*"),0);
        return this;
    }
    for (let terminal of terminals.reverse()){ // must add them in reverse order because of position 0
        this.addDependent(new Dependent([terminal],"*post*"),0);
    }
    return this;
}

Dependent.prototype.processTyp_fr = function(types){
    this.processV(types,"prog",function(deprel,v){
        // insert "en train","de" (separate so that élision can be done...) 
        // TODO::but do it BEFORE the pronouns created by .pro()
        const origLemma=deprel.terminal.lemma
        deprel.terminal.setLemma("être"); // change verb, but keep person, number and tense properties of the original...
        deprel.addPost([Q("en train"),Q("de"),V(origLemma).t("b")])
        deprel.terminal.isProg=v;
    })
    this.processV(types,"mod",function(deprel,mod){
        let rules=deprel.getRules();
        let origLemma=deprel.terminal.lemma;
        for (let key in rules.verb_option.modalityVerb){
            if (key.startsWith(mod)){
                deprel.terminal.setLemma(rules.verb_option.modalityVerb[key]);
                break;
            }
        }
        deprel.terminal.isMod=true
        let newV=V(origLemma).t("b");
        if (deprel.terminal.isProg){ // copy progressive from original verb...
            newV.isProg=deprel.terminal.isProg;
            delete deprel.terminal.isProg
        }
        deprel.addPost(newV)
    })
    this.processV(types,"neg",function(deprel,neg){
        if (neg===true)neg="pas";
        deprel.terminal.neg2=neg;  // HACK: to be used when conjugating at the realization time
    })
}

Dependent.prototype.processTyp_en = function(types){
    // replace current verb with the list new words
    //  TODO: take into account the fact that there might be already a verb with modals...
    if (types["contr"]!==undefined && types["contr"]!==false){
        // necessary because we want the negation to be contracted within the VP before the S or SP
        this.contraction=true;
    }
    const words=affixHopping(this.terminal,this.getProp("t"),this.getRules().compound,types);
    // the new root should be the last verb 
    let last=words.pop();
    if (last.isA("Pro") && last.lemma=="myself"){ // skip possible "myself" for reflexive verb
        this.addPost(last);
        last=words.pop()
    }
    this.terminal=last;
    this.addPre(words)
}

Dependent.prototype.moveAuxToFront=function(){
    let auxIdx=this.findIndex((d)=>d.isA("*pre*")); // added by affixHopping
    if (auxIdx>=0 && !["pp","pr"].includes(this.getProp("t"))){ // do not move when tense is participle
        const aux = this.dependents[auxIdx].terminal;
        this.removeDependent(auxIdx)
        this.addPre(aux,0)                             // put auxiliary before
    } else if (["be","have"].includes(this.terminal.lemma)) {
        //no auxiliary, but check for have or be "alone" for which the subject should appear
        const subjIdx=this.findIndex(d=>d.isA("subj"));
        if (subjIdx>=0)
            this.dependents[subjIdx].pos("post")
    }
}

Dependent.prototype.invertSubject=function(){
    // in French : use inversion rule which is quite "delicate"
    // rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
    // if subject is a pronoun, invert and add "-t-" or "-"
    // if subject is a noun, the subject stays but add a new pronoun
    let subjIdx=this.findIndex((d)=>d.isA("subj"));
    if (subjIdx>=0){
        const subj=this.dependents[subjIdx].terminal;
        let pro;
        if (subj.isA("Pro")){
            pro=this.removeDependent(subjIdx).terminal; //remove subject
        } else if (subj.isA("C")){
            pro=Pro("moi","fr").c("nom").g("m").n("p").pe(3); // create a "standard" pronoun, to be patched by cpReal
            subj.pronoun=pro;  // add a flag to be processed by cpReal
        } else
            pro=Pro("moi","fr").g(subj.getProp("g")).n(subj.getProp("n")).pe(3).c("nom"); // create a pronoun
        if (this.terminal.isA("V")){
            this.addPost(pro);
            this.terminal.lier()
        }
    }
}

Dependent.prototype.processTypInt = function(types){
    const int=types["int"]
    const sentenceTypeInt=this.getRules().sentence_type.int
    const intPrefix=sentenceTypeInt.prefix;
    let prefix,pp; // to be filled later
    switch (int) {
    case "yon": case "how": case "why": case "muc": 
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        prefix=intPrefix[int];
        break;
    // remove a part of the sentence 
    case "wos": case "was":// remove subject 
        let subjIdx=this.findIndex((d)=>d.isA("subj"))
        if (subjIdx>=0){
            // insure that the verb at the third person singular,
            // because now the subject has been removed
            this.terminal.setProp("n","s");
            this.terminal.setProp("pe",3);
            this.removeDependent(subjIdx)
        }
        prefix=intPrefix[int];
        break;
    case "wod": case "wad": // remove direct object (first comp starting with N)
        let cmp;
        for (let i=0;i<this.dependents.length;i++){
            const d=this.dependents[i];
            if (d.isA("comp") && d.terminal.isA("N")){
                cmp=this.removeDependent(i)
                break;
            }
        }
        if (this.isFr()){// check for passive subject starting with par
            let parIdx=this.findIndex(d=>d.isA("comp") && d.terminal.isA("P") && d.terminal.lemma=="par");
            if (parIdx>=0){
                pp=this.dependents[parIdx].terminal;
                this.removeDependent(parIdx);// remove the passive subject
            }
        }
        if (this.isEn() && int=="wod" && cmp!==undefined && ["m","f"].includes(cmp.getProp("g"))){ // human direct object
            prefix="whom";
        } else
            prefix=intPrefix[int];
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        break;
    case "woi": case "wai":case "whe":case "whn": // remove indirect object first comp or mod with a P as terminal
        let remove=false;
        prefix=intPrefix[int];  // get default prefix
        for (let i=0;i<this.dependents.length;i++){
            const d=this.dependents[i];
            if (d.isA("comp","mod") && d.terminal.isA("P")){
                // try to find a more appropriate prefix by looking at preposition in the structure
                let prep=d.terminal.lemma;
                const preps=prepositionsList[this.lang];
                if (int=="whe"){
                    if (preps["whe"].has(prep))remove=true
                } else if (int=="whn"){
                    if (preps["whn"].has(prep))remove=true
                } else if (preps["all"].has(prep)){ // "woi" | "wai"
                    // add the preposition in front of the prefix (should be in the table...)
                    prefix=prep+" "+(this.isEn()?(int=="woi"?"whom":"what")
                                                :(int=="woi"?"qui" :"quoi"));
                    remove=true
                }
                if (remove) {
                    this.removeDependent(i)
                    break;
                }
            }
        }
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        break;
    case "tag":
        // according to Antidote: Syntax Guide - Question tag
        // Question tags are short questions added after affirmations to ask for verification
        if (this.isFr()){ // in French really simple, add "n'est-ce pas"
            this.a(", n'est-ce pas")
        } else { // in English, sources: https://www.anglaisfacile.com/exercices/exercice-anglais-2/exercice-anglais-95625.php
                 // must find  the pronoun and conjugate the auxiliary
            let aux;
            // look for the first verb or auxiliary (added by affixHopping)
            const vIdx=this.findIndex(d=>d.terminal.isA("V") && d.depPosition()=="pre");
            const currV = vIdx<0 ? this.terminal : this.dependents[vIdx].terminal; 
            if ("mod" in types && types["mod"]!==false){
                aux=this.getRules().compound[types["mod"]]["aux"];
            } else {
                if (["have","be","can","will","shall","may","must"].includes(currV.lemma))aux=currV.lemma;
                else aux="do"
            }
            let neg = "neg" in types && types["neg"]===true;
            let pe = currV.getProp("pe");
            let t  = currV.getProp("t");
            let n  = currV.getProp("n");
            let g  = currV.getProp("g");
            let pro = Pro("I").pe(pe).n(n).g(g); // get default pronoun
            // check for negative adverbs...
            const advIdx=this.findIndex((d)=>d.isA("mod") && d.terminal.isA("Adv"));
            if (advIdx>=0 && ["hardly","scarcely","never","seldom"].includes(this.dependents[advIdx].terminal.lemma)){
                neg=true
            }
            let subjIdx=this.findIndex((d)=>d.isA("subj"))
            if (subjIdx>=0){
                const subj=this.dependents[subjIdx].terminal;
                if (subj.isA("Pro")){
                    if (subj.getProp("pe")==1 && aux=="be" && t=="p" && !neg){
                        // very special case : I am => aren't I
                        pe=2
                    } else if (["this","that","nothing"].includes(subj.lemma)){
                        pro=Pro("I").g("n") // it
                    } else if (["somebody","anybody","nobody","everybody",
                                "someone","anyone","everyone"].includes(subj.lemma)){
                        pro=Pro("I").n("p"); // they
                        if (subj.lemma=="nobody")neg=true;                     
                    } else 
                        pro=subj.clone();
                    pro=comp(pro)
                } else if (subj.isA("N")){
                    pro=this.dependents[subjIdx].clone().pro().pos("post")
                } else {
                    pro=comp(Pro("it").c("nom"))
                }
            } else { // no subject found, so generate 
                pro=comp(pro)
            }
            let iDeps=this.dependents.length-1
            while(iDeps>=0 && this.dependents[iDeps].depPosition()!="post")iDeps--;
            if (iDeps<0)
                currV.a(","); // add comma to the verb
            else // add comma to the last current dependent
                this.dependents[iDeps].a(","); 
            // this is a nice use-case of jsRealB using itself for realization
            if (aux=="have" && !neg){ 
                // special case because it should be realized as "have not" instead of "does not have" 
                this.addDependent(comp(V("have").t(t).pe(pe).n(n),
                                       mod(Adv("not")),
                                       pro).typ({"contr":true}))
            } else { // use jsRealB itself for realizing the tag by adding a new VP
                this.addDependent(comp(V(aux).t(t).pe(pe).n(n),
                                       pro).typ({"neg":!neg,"contr":true}))
            }
        }
        prefix=intPrefix[int];
        break;
    default:
        this.warn("not implemented","int:"+int)
    }
    if(this.isFr() || int !="yon") {// add the interrogative prefix
        this.addPre(Q(prefix),0)
        if (pp !== undefined){ // add "par" in front of some French passive interrogative
            this.addPre(pp,0)
            if (int=="wad"){ // replace "que" by "quoi" for French passive wad
                this.dependents[1].terminal.lemma="quoi";
            }
        }
    }
    this.a(sentenceTypeInt.punctuation,true);
}

Dependent.prototype.processTyp = function(types){
    // let pp; // flag for possible pp removal for French wod or wad
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
    if ("int" in types && types["int"] !== false)
        this.processTypInt(types);
    const exc=types["exc"];
    if (exc !== undefined && exc === true){
        this.a(this.getRules().sentence_type.exc.punctuation,true);
    }
    return this;   
}

Dependent.prototype.coordReal = function(){
    let res=[];
    // realize coordinated Dependents by adding ',' between all elements except for the last
    // no check is done on the terminal, so
    //    if the terminal is Q(",") then all elements are separated by a ","
    //    Q("and,") deal with the Oxford comma (i.e. a comma after all elements even the last)
    var last=this.dependents.length-1;
    if (last==-1){
        return []
    }
    if (last==0){// coordination with only one element, ignore coordinate
        const dep = this.dependents[0]
        res = dep.real()
        this.setProp("g",dep.getProp("g"))
        this.setProp("n",dep.getProp("n"))
        this.setProp("pe",dep.getProp("pe")||3)
        return this.doFormat(res); // process format for the CP
    }
    // check that all dependents use the same deprel
    const deprel=this.dependents[0].constType;
    for (let j = 0; j < last; j++) { //insert comma after each element
        const dj=this.dependents[j];
        if (!dj.isA(deprel)){
            this.warn("inconsistent dependents within a coord",deprel,dj.constType)
        }
        if (j<last-1) dj.props["a"]=[","];
        Array.prototype.push.apply(res,dj.real())
    }
    // insert realisation of the terminal before last...
    Array.prototype.push.apply(res,this.terminal.real());
    if (!this.dependents[last].isA(deprel)){
        this.warn("inconsistent dependents within a coord",deprel,this.dependents[last].constType)
    }    
    // insert last element
    Array.prototype.push.apply(res,this.dependents[last].real());
    // compute the combined gender and number of the coordination once children have been realized
    const thisCoord=this.terminal;
    if (thisCoord.isA("C")){
        var and=this.isFr()?"et":"and";
        var gn=this.findGenderNumberPerson(thisCoord.lemma==and);
        this.setProp("g",gn.g);
        this.setProp("n",gn.n);
        this.setProp("pe",gn.pe);
        // for an inserted pronoun, we must override its existing properties...
        if (thisCoord.pronoun!==undefined){
            thisCoord.pronoun.peng=gn;
            thisCoord.pronoun.props["g"]=gn.g;
            thisCoord.pronoun.props["n"]=gn.n;
            thisCoord.pronoun.props["pe"]=gn.pe;
        }
    } else if (!thisCoord.isA("Q")){
        // in some cases the coordination can be a quoted string (possibly empty)
        this.warn("bad parameter","C",thisCoord.constType)
    }
    return res;
}

// check where this dependent shoould go relative to its parent
Dependent.prototype.depPosition = function(){
    let pos=this.props["pos"];
    if (pos!==undefined) return pos // always follow specified pos
    pos = "post";             // default is after
    if (this.isA("subj","det","*pre*")){ 
        // subject and det are always before except when specified otherwise
        pos="pre"
    } else if (this.isA("mod") && this.terminal.isA("A") && this.parentConst.terminal.isA("N")){ 
        // check adjective position with respect to a noun
        pos=this.isFr()?(this.terminal.props["pos"]||"post"):"pre"; // all English adjective are pre
    } else if (this.isA("coord") && this.dependents.length>0){
            pos=this.dependents[0].depPosition() // take the position of the first element of the coordination
    }
    return pos;
}

// creates a list of Terminal each with its "realization" field now set
Dependent.prototype.real = function() {
    let res;
    if (this.isA("coord") && this.parentConst==null){
        // special case of coord at the root
        res=this.coordReal();
    } else {
        this.pronominalizeChildren();
        const typs=this.props["typ"];
        if (typs!==undefined)this.processTyp(typs);
        const ds=this.dependents;
        // realize coordinations before anything elso to compute their final number and person
        for (let d of ds){
            if (d.isA("coord"))
                d.tokens=d.coordReal() // save realization info in the dependent
        }
        let before=[];
        let after=[];
        // realize and order them by gathering the dependents that should appear before and after the terminal
        for (let d of ds) {
            let r;
            if (d.isA("coord")){
                r=d.tokens;  // get back generated tokens
            } else {
                r=d.real()
            }
            // check where this dependent shoould go
            Array.prototype.push.apply(d.depPosition()=="pre"?before:after,r)
        }
        res=before.concat(this.terminal.real(),after)
    }
    return this.doFormat(res);
};


// recreate a jsRealB expression
// if indent is positive number create an indented pretty-print string (call it with 0 at the root)
// if called with no parameter then create a single line
Dependent.prototype.toSource = function(indent){
    if (indent===undefined)indent=-1;
    let [newIndent,sep]=this.indentSep(indent);
    let depsSource=this.dependentsSource.map(e => e.toSource(indent))
    depsSource.unshift(this.terminal.toSource())
    // create source of children
    let res=this.constType+"("+depsSource.join(sep)+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this); // ~ super.toSource()
    return res;
}

// Creates a "debug" representation from the structure not from the saved source strings
// CAUTION: this output is NOT a legal jsRealB expression, contrarily to .toSource()
Dependent.prototype.toDebug = function(indent){
    if (indent===undefined)indent=-1;
    let [newIndent,sep]=this.indentSep(indent);
    // create debug of children
    let depsDebug=this.dependents.map(e => e.toDebug(newIndent));
    depsDebug.unshift(this.terminal.toDebug());
    let res=this.constType+"("+depsDebug.join(sep)+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toDebug.call(this); // ~ super.toSource()
    return res;
}

// CAUTION: this function is on the **Phrase** prototype
// create a dependent version of a constituent 
Phrase.prototype.toDependent = function(depName){
    function removeAddOption(s){
        // we must remove the add option because the Phrase structure has already taken it into account
        // so it should not be outputted in the Dependent version
        // remove first occurrence of .add(...)
        let iAdd=s.indexOf(".add(");
        if (iAdd<0)return s;
        const l=s.length
        let p=1
        let i=iAdd+5
        while (p>0 && i<l){ // count parentheses levels (does not take into account parentheses within string)
            const c=s.charAt(i);
            if (c=="(")p++;
            else if (c==")")p--;
            i++
        }
        // remove first occurrence of .add(...) and recurse on the rest of the string
        return s.substring(0,iAdd)+removeAddOption(s.substring(i))
    }
    
    function setPos(i,idx,dep){
        // check if the position has to be specified
        if (i<idx){
            if (dep.isA("comp")) 
                dep.pos("pre");
            else if (dep.isA("mod") && (!dep.isEn() || !dep.terminal.isA("A"))) 
                dep.pos("pre")
        } else {
            if (dep.isA("subj","det"))
                dep.pos("post")
        }
        return dep
    }
    
    function makeDep(me,phName){
        let deprel;
        const termName=phName.substr(0,phName.length-1); // remove P at the end of the phrase name
        const idx=me.getHeadIndex(phName);
        if (me.elements[idx].isA(termName)){
            deprel = new Dependent([me.elements[idx]],depName)
            me.elements.forEach(function(e,i){
                if (i!=idx){
                    const dep=e.toDependent(phName=="VP"?"comp":"mod")
                    deprel.add(setPos(i,idx,dep),undefined,true)
                }
            })
        } else {
            console.log(`Phrase.toDependent:: ${phName} without ${termName}`,me.toSource())
        }
        return deprel
    }
    
    let deprel; 
    depName=depName||"root";
    switch (this.constType){
    case "NP": case "VP": case "AP": case "PP": case "AdvP":
        deprel=makeDep(this,this.constType);
        break;
    case "CP":
        const idxC=this.getIndex("C");
        if (idxC>=0){
            deprel=new Dependent([this.elements[idxC]],"coord");
            this.elements.forEach(function(e,i){
                if (i!=idxC)deprel.add(e.toDependent(depName),undefined,true)
            })
        } else {
            console.log("Phrase.toDependent:: CP without C", this.toSource())
        }
        break;
    case "S": case "SP":
        let v;
        let iVP=this.getIndex("VP");
        if (iVP>=0){
            deprel=this.elements[iVP].toDependent(depName)
        } else {
            // console.log("Phrase.toDependent:: S without VP",this.toSource()) [it seems that we can ignore this]
            // return this
            deprel=new Dependent([Q("")],depName);
        }
        let iPro=-1;
        if (this.isA("SP")){ 
            if (this.isFr()){// check for possible relative pronoun "que" in French that could be object 
                iPro=this.getIndex(["Pro"]);
                if (iPro>=0 && this.elements[iPro].lemma=="que"){
                    deprel.add(this.elements[iPro].toDependent("comp").pos("pre"),0,true);
                } else {
                    iPro = -1
                }
            }
        }
        let iSubj=this.getIndex(["NP","N","CP","Pro"]);
        // add rest of args
        this.elements.forEach(function(e,i){
            if (i!=iVP && i!=iPro) {
                const dep=e.toDependent(i==iSubj?"subj":"mod");
                deprel.add(setPos(i,iVP,dep),undefined,true)
            }
        })
        break;
    default:
        console.log(`Phrase.toDependent:: ${this.constType} not yet implemented`)
    }
    deprel.props=this.props;
    deprel.optSource=removeAddOption(this.optSource)
    if (this.parentConst===null && !this.isA("S"))deprel.cap(false)
    return deprel
}

Terminal.prototype.toDependent = function(depName){
    let deprel;
    // HACK: this.parentConst in changed during transformation to refer to the parent dependennt...
    let isTopLevel=this.parentConst===null; // we save it to use it at the end
    if (this.isA("D","NO")){
        deprel=det(this)
    } else {
        deprel=new Dependent([this],depName||"root");
    }
    if (isTopLevel)deprel.cap(false);
    return deprel
}



// functions for creating Dependents

function root(_){ return new Dependent(Array.from(arguments),"root"); };

function subj(_){ return new Dependent(Array.from(arguments),"subj"); }
function det(_) { return new Dependent(Array.from(arguments),"det"); }
function mod(_) { return new Dependent(Array.from(arguments),"mod"); }

function comp(_){ return new Dependent(Array.from(arguments),"comp"); }
function compObj(_){ return new Dependent(Array.from(arguments),"comp"); }
function compObl(_){ return new Dependent(Array.from(arguments),"comp"); }

function coord(_){ return new Dependent(Array.from(arguments),"coord"); }

var deprels = ["root","subj","det","mod","comp","coord"] // list of implemented dependency relations
