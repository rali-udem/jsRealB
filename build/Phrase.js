/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";

////// Constructor for a Phrase (a subclass of Constituent)

// phrase (non-terminal)
function Phrase(elements,constType,lang){ // lang parameter used calls in IO-json.js
    Constituent.call(this,constType); // super constructor
    this.lang = lang || currentLanguage;
    elements=elements.filter(e=>e!=undefined && e!=null) // remove "null" elements
    this.elements=[];
    // list of elements to create the source of the parameters at the time of the call
    // this can be different from the elements lists because of structure modifications
    this.elementsSource=[]
    if (elements.length>0){
        const last=elements.length-1;
        // add all elements except the last to the list of elements
        for (let i = 0; i < last; i++) {
            let e=elements[i];
            if (typeof e=="string"){
                e=Q(e);
            }
            if (e instanceof Constituent) {
                this.addElement(e);
                this.elementsSource.push(e);
            } else {
                this.warn("bad Constituent",NO(i+1).dOpt({ord:true})+"",typeof e+":"+JSON.stringify(e))
            }
        }
        // terminate the list with add which does other checks on the final list
        this.add(elements[last],undefined,true)
    }
}
extend(Constituent,Phrase)

// add a Constituent as a child of this Phrase
Phrase.prototype.addElement = function(elem,position){
    if (elem instanceof Constituent){
        elem.parentConst=this;
        // add it to the list of elements
        if (position == undefined){
            this.elements.push(elem);
        } else if (typeof position == "number" && position<=this.elements.length && position>=0){
            this.elements.splice(position,0,elem)
        } else {
            this.warn("bad position",position,this.elements.length)
        }
    } else {
        this.warn("bad Constituent",NO(position+1).dOpt({ord:true})+"",typeof elem)
    }
    return this
}

// remove a child of this Phrase and return it
Phrase.prototype.removeElement = function(position){
    if (typeof position == "number" && position<this.elements.length && position>=0){
        const elem=this.elements.splice(position,1)[0];
        elem.parentConst=null
        return elem
    }
    return this.warn("bad position",position,this.elements.length)
}

// add a new constituent, set agreement links
Phrase.prototype.add = function(constituent,position,prog){
    function allAorN(elems,start,end){
        if (start>end) {[end,start]=[start,end]}
        for (var k=start;k<=end;k++){
            if (!elems[k].isOneOf(["A","N"]))return false;
        }
        return true
    }
    // create constituent
    if (typeof constituent=="string"){
        constituent=Q(constituent);
    }
    if (!(constituent instanceof Constituent)){
        return this.warn("bad Constituent",this.isFr()?"dernier":"last",typeof constituent+":"+JSON.stringify(constituent))
    }
    if (prog===undefined){// real call to .add 
        this.optSource+=".add("+constituent.toSource()+(position===undefined?"":(","+position) )+")"
    } else {
        this.elementsSource.push(constituent) // call from the constructor        
    }
    this.addElement(constituent,position)
    // change position of some children
    this.linkProperties	();
    for (let i = 0; i < this.elements.length; i++) {
        const e=this.elements[i];
        if (e.isA("A")){// check for adjective position
            const idx=this.getIndex("N");
            const pos=e.isFr()?(e.props["pos"]||"post"):"pre"; // all English adjective are pre
            if (idx >= 0){
                if ((pos=="pre" && i>idx)||(pos=="post" && i<idx)){
                    if (allAorN(this.elements,i,idx)){
                        this.addElement(this.removeElement(i),idx)
                    }
                }
            }
        } else if (e.isA("Pro") && this.isA("VP")){
            // a pronoun (clitic accusative,dative or reflexive or tonic reflexive) should appear before the verb
            if (contains(["acc","dat","refl"],e.getProp("c")) || e.getProp("tn")=="refl"){
                const idxV=this.getIndex("V")
                if (i>idxV){
                    this.addElement(this.removeElement(i),idxV);
                }
            }
        }
    }
    return this;
}
    
Phrase.prototype.grammaticalNumber = function(){
    return this.error("grammaticalNumber must be called on a NO, not a "+this.constType);
}

Phrase.prototype.getHeadIndex = function(phName){
    let termName=phName.substr(0,phName.length-1); // remove P at the end of the phrase name
    let headIndex=this.getIndex([phName,termName]);
    if (headIndex<0){
        // this.warn("not found",termName,phName); // this generates too many spurious messages
        headIndex=0;
    }
    return headIndex;
}

// French copula verbs
const copulesFR=["être","paraître","sembler","devenir","rester"];

//  loop over children to set the peng and taux to their head or subject
//  so that once a value is changed this change will be propagated correctly...
Phrase.prototype.linkProperties	 = function(){
    let headIndex;
    if (this.elements.length==0)return this;
    switch (this.constType) {
    case "NP": // the head is the first internal N, number with a possible NO
        // find first NP or N
        headIndex=this.getHeadIndex("NP");
        this.peng=this.elements[headIndex].peng;
        for (let i = 0; i < this.elements.length; i++) {
            if (i!=headIndex){
                const e=this.elements[i];
                if (this.peng){ // do not try to modify if current peng does not exist e.g. Q
                    if (e.isA("NO") && i<headIndex){ // NO must appear before the N for agreement
                        this.peng["n"]=e.grammaticalNumber();
                        // gender agreement between a French number and subject
                        e.peng["g"]=this.peng["g"]; 
                    } else if (e.isOneOf(["D","A"])){
                        // link gender and number of the noun to the determiners and adjectives
                        // in English possessive determiner should not depend on the noun but on the "owner"
                        if (this.isFr() || !e.isA("D") || e.getProp("own") === undefined){
                            e.peng=this.peng
                        }
                    }
                }
            }
        }
        //   set agreement between the subject of a subordinate or the object of a subordinate
        const pro=this.getFromPath([["S","SP"],"Pro"]);
        if (pro!==undefined){
            const v=pro.parentConst.getFromPath(["VP","V"]);
            if (v !=undefined){
                if (contains(["qui","who"],pro.lemma)){// agrees with this NP
                    v.peng=this.peng
                } else if (this.isFr() && pro.lemma=="que"){
                    // in French past participle can agree with a cod appearing before... keep that info in case
                        v.cod=this
                    }
            }
        }
        break;
    case "VP": 
        headIndex=this.getHeadIndex("VP");// head is the first internal V
        this.peng=this.elements[headIndex].peng;
        this.taux=this.elements[headIndex].taux;
        break;
    case "AdvP": case "PP": case "AP":
        headIndex=this.getHeadIndex(this.constType);
        this.peng=this.elements[headIndex].peng;
        break;
    case "CP":
        // nothing to do, 
        // but make sure that the propagated properties exist
        this.peng={
            // pengNO:pengNO++
        };
        // the information will be computed at realization time (see Phrase.prototype.cpReal)
        break;
    case "S": case "SP":
        let vpv = this.getFromPath([["","VP"],"V"]);
        if (vpv !== undefined){
            this.taux=vpv.taux;        // share tense and auxiliary of the verb
            if (vpv.getProp("t")=="ip")// do not search for subject for an imperative verb
                return this; 
        }
        let iSubj=this.getIndex(["NP","N","CP","Pro"]);
        // determine subject
        if (iSubj>=0){
            let subject=this.elements[iSubj];
            if (this.isA("SP") && subject.isA("Pro")){
                if (contains(["que","où","that"],subject.lemma)){
                    // HACK: the first pronoun  should not be a subject...
                    //        so we try to find another...
                    const jSubj=this.elements.slice(iSubj+1).findIndex(
                        e => e.isOneOf(["NP","N","CP","Pro"])
                    );
                    if (jSubj>=0){
                        subject=this.elements[iSubj+1+jSubj];
                    } else {
                        // finally this generates too many spurious messages
                        // this.warning("no possible subject found");
                        return this;
                    }
                }
            }
            this.peng=subject.peng;
            const vpv=this.linkPengWithSubject("VP","V",subject)
            if (vpv !== undefined){
                this.taux=vpv.taux;
                if (this.isFr() && contains(copulesFR,vpv.lemma)){// check for a French attribute of copula verb
                    // with an adjective
                    const attribute = vpv.parentConst.linkPengWithSubject("AP","A",subject);
                    if (attribute===undefined){
                        let elems=vpv.parentConst.elements;
                        let vpvIdx=elems.findIndex(e => e==vpv);
                        if (vpvIdx<0){
                            this.error("linkProperties	: verb not found, but this should never have happened")
                        } else {
                            for (var i=vpvIdx+1;i<elems.length;i++){
                                var pp=elems[i];
                                if (pp.isA("V") && pp.getProp("t")=="pp"){
                                    pp.peng=subject.peng;
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                // check for a coordination of verbs that share the subject
                const cvs=this.getFromPath(["CP","VP"]);
                if (cvs !==undefined){
                    this.getConst("CP").elements.forEach(function(e){
                        if (e instanceof Phrase) // skip possible C
                            e.linkPengWithSubject("VP","V",subject)
                    })
                }
                if (this.isFr()){ 
                    //  in French, check for a coordinated object of a verb in a SP used as cod 
                    //  occurring before the verb
                    const cp=this.getConst("CP");
                    const sp=this.getConst("SP");
                    if (cp !==undefined && sp !== undefined){
                        let sppro=sp.getConst("Pro");
                        if (sppro !== undefined && sppro.lemma=="que"){
                            let v=sp.getFromPath([["VP",""],"V"]);
                            if (v!==undefined){
                                v.cod=cp;
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
        this.error("linkProperties	,unimplemented type:"+this.constType)
    }
    return this;
}

Phrase.prototype.linkPengWithSubject = function(phrase,terminal,subject){
    // do not link a subject pronoun at genitive
    if (subject.isA("Pro") && subject.props["c"]=="gen") return;
    let pt=this.getFromPath([phrase,terminal]);
    if (pt !== undefined){
        pt.parentConst.peng = pt.peng = subject.peng;
    } else {
        pt=this.getFromPath([terminal]);
        if (pt !== undefined){
            pt.peng = subject.peng;
        }
    }
    return pt;
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

// find the gender, number and Person of NP elements of this Phrase
//   set masculine if at least one NP is masculine
//   set plural if one is plural or more than one combined with and
//   set person to the minimum one encountered (i.e. 1st < 2nd < 3rd) mostly useful for French 
Phrase.prototype.findGenderNumberPerson = function(andCombination){
    let g="f";
    let n="s";
    let pe=3;
    let nb=0;
    for (let i = 0; i < this.elements.length; i++) {
        const e=this.elements[i];
        if (e.isOneOf(["NP","N","Pro","Q"])){
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

////////////// Phrase structure modification

// Phrase structure modification but that must be called in the context of the parentConst
// because the pronoun depends on the role of the NP in the sentence 
//         and its position can also change relatively to the verb
Phrase.prototype.pronominalize_fr = function(){
    let pro;
    const npParent=this.parentConst;
    if (npParent!==null){
        const myself=this;
        let idxMe=npParent.elements.findIndex(e => e==myself,this);
        let moveBeforeVerb=false;
        let idxV=idxMe-1; // search for the first verb before the NP
        while (idxV>=0 && !npParent.elements[idxV].isA("V"))idxV--;
        if (idxV>=1 && npParent.elements[idxV].getProp("t")=="pp" &&
            npParent.elements[idxV-1].isA("V"))idxV--; // take for granted that it is an auxiliary, so skip it also
        let np;
        if (this.isA("NP")){
            np=this;
            if (this.peng==npParent.peng){ // is subject 
                pro=this.getTonicPro("nom");
            } else if (npParent.isA("SP") && npParent.elements[0].isA("Pro")){ // is relative
                pro=this.getTonicPro("nom");
            } else {
                pro=this.getTonicPro("acc") // is direct complement;
                npParent.elements[idxV].cod=this;// indicate that this is a COD
                moveBeforeVerb=true;
            }               
        } else if (this.isA("PP")){ // is indirect complement
            np=this.getFromPath([["NP","Pro"]]); // either a NP or Pro within the PP
            const prep=this.getFromPath(["P"]);
            if (prep !== undefined && np !== undefined){
                if (prep.lemma == "à"){
                    pro=np.getTonicPro("dat");
                    moveBeforeVerb=true;
                } else if (prep.lemma == "de") {
                    pro=Pro("en","fr")
                    moveBeforeVerb=true;
                } else if (contains(["sur","vers","dans"],prep.lemma)){
                    pro=Pro("y","fr")
                    moveBeforeVerb=true;
                } else { // change only the NP within the PP
                    pro=np.getTonicPro();
                    pro.props=np.props;
                    pro.peng=np.peng;
                    np.elements=[pro];
                    return 
                }
            }
        }
        if (pro === undefined){
            return npParent.warn("no appropriate pronoun");
        }
        pro.peng=np.peng;
        Object.assign(pro.props,np.props);
        delete pro.props["pro"]; // this property should not be copied into the Pro
        if (moveBeforeVerb && 
            // in French a pronominalized NP as direct object is moved before the verb
            idxV>=0 && npParent.elements[idxV].getProp("t")!="ip"){ // (except at imperative tense) 
            npParent.removeElement(idxMe);// remove NP
            npParent.addElement(pro,idxV);// insert pronoun before the V
        } else {
            npParent.removeElement(idxMe);// insert pronoun where the NP was
            npParent.addElement(pro,idxMe);
        }
    } else {// special case without parentConst so we leave the NP and change its elements
        pro=this.getTonicPro();
        pro.props=this.props;
        pro.peng=this.peng;
        this.elements=[pro];
    }
    return pro;
}

// Pronominalization in English only applies to a NP (this is checked before the call)
//  and does not need reorganisation of the sentence 
//  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
Phrase.prototype.pronominalize_en = function(){
    let pro;
    const npParent=this.parentConst;
    if (npParent!==null){
        let idxV=-1;
        let myself=this;
        let idxMe=npParent.elements.findIndex(e => e==myself,this);
        let moveBeforeVerb=false;
        idxV=npParent.getIndex("V");
        if (this.peng==npParent.peng){ // is subject 
            pro=this.getTonicPro("nom");
        } else if (npParent.isA("SP") && npParent.elements[0].isA("Pro")){ // is relative
            pro=this.getTonicPro("nom");
        } else {
            pro=this.getTonicPro("acc") // is direct complement;
        }               
        pro.peng=this.peng;
        Object.assign(pro.props,this.props);
        if (this.peng==npParent.peng){
            npParent.peng=pro.peng
        }
        npParent.removeElement(idxMe);// insert pronoun where the NP was
        npParent.addElement(pro,idxMe);
    } else {// special case without parentConst so we leave the NP and change its elements
        pro=this.getTonicPro("nom");
        pro.props=this.props;
        pro.peng=this.peng;
        this.elements=[pro];
    }
    return pro;
}

Phrase.prototype.pronominalize = function(e){
    if (e.props["pro"]!==undefined && !e.isA("Pro")){// it can happen that a Pro has property "pro" set within the same expression
        if (e.isFr()){
            return e.pronominalize_fr()
        } else { // in English pronominalize only applies to a NP
            if (e.isA("NP")){
                return  e.pronominalize_en()
            } else {
                return this.warn("bad application",".pro",["NP"],e.constType)
            }
        }
    }    
}

// check if any child should be pronominalized
// this must be done in the context of the parent, because some elements might be changed
Phrase.prototype.pronominalizeChildren = function(){
    let es=this.elements;
    for (let i = 0; i < es.length; i++) {
        this.pronominalize(es[i]);
    }
}


// modify the sentence structure to create a passive sentence
Phrase.prototype.passivate = function(){
    let subject,vp,newSubject;
    // find the subject at the start of this.elements
    if (this.isA("VP")){
        subject=null;
        vp=this;
    } else {
        vp=this.getConst("VP");
        if (vp !== undefined){
            if (this.elements.length>0 && this.elements[0].isOneOf(["N","NP","Pro"])){
                subject=this.removeElement(0);
                if (subject.isA("Pro")){
                    // as this pronoun will be preceded by "par" or "by", the "bare" tonic form is needed
                    // to which we report the original person, number, gender
                    subject=subject.getTonicPro().g(subject.getProp("g")).n(subject.getProp("n")).pe(subject.getProp("pe"));
                }
            } else {
                subject=null;
            }
        } else {
            return this.warn("not found","VP",this.isFr()?"contexte passif":"passive context")
        }
    }
    // remove object (first NP or Pro within VP) from elements
    if (vp !== undefined) {
        let objIdx=vp.getIndex(["NP","Pro"]);
        if (objIdx>=0){
            let obj=vp.removeElement(objIdx);
            if (obj.isA("Pro")){
                obj=obj.getTonicPro("nom");
                if (objIdx==0){// a French pronoun inserted by .pro()
                    objIdx=vp.getIndex("V")+1 // ensure that the new object will appear after the verb
                }
            } else if (obj.isA("NP") && obj.props["pro"]!==undefined){
                obj=obj.getTonicPro("nom");
            }
            // swap subject and obj
            newSubject=obj;
            this.addElement(newSubject,0);// add object that will become the subject
            // make the verb agrees with the new subject (in English only, French is dealt below)
            if (this.isEn()){
                this.linkPengWithSubject("VP","V",newSubject);
            } 
            if (subject!=null){   // insert subject where the object was
                vp.addElement(PP(P(this.isFr()?"par":"by",this.lang),subject),objIdx);
            }
        } else if (subject !=null){ // no object, but with a subject
            //create a dummy subject with a "il"/"it" 
            newSubject=Pro(this.isFr()?"lui":"it",this.lang).c("nom");
            // add new subject at the front of the sentence
            this.addElement(newSubject,0);
            this.linkPengWithSubject("VP","V",newSubject);
            vp.peng=newSubject.peng
            // add original subject after the verb to serve as an object
            let vpIdx=vp.getIndex("V");
            vp.addElement(PP(P(this.isFr()?"par":"by",this.lang),subject),vpIdx+1);
        }
        if (this.isFr()){
            // do this only for French because in English this is done by processTyp_en
            // change verbe into an "être" auxiliary and make it agree with the newSubject
            const verbeIdx=vp.getIndex("V")
            const verbe=vp.removeElement(verbeIdx);
            const aux=V("être","fr");
            aux.parentConst=vp;
            aux.taux=verbe.taux;
            if (newSubject!==undefined) // this can happen when a subject is Q
                aux.peng=newSubject.peng;
            aux.props=verbe.props;
            aux.pe(3); // force person to be 3rd (number and tense will come from the new subject)
            if (vp.getProp("t")=="ip"){
                aux.t("s") // set subjonctive present tense for an imperative
            }
            const pp = V(verbe.lemma,"fr").t("pp");
            if (newSubject!==undefined) // this can happen when a subject is Q
                pp.peng=newSubject.peng;
            vp.addElement(aux,verbeIdx).addElement(pp,verbeIdx+1)
        }
    } else {
        return this.warn("not found","VP",isFr()?"contexte passif":"passive context")
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
                this.warn("bad const for option",'.typ("'+key+":"+val+'")',this.constType,["VP"])
                return;
            }
        }
        const idxV=vp.getIndex("V");
        if (idxV>=0){
            const v=vp.elements[idxV];
            action(vp,idxV,v,val);
        }
    }
}

Phrase.prototype.processTyp_fr = function(types){
    // process types in a particular order
    let rules=this.getRules();
    this.processVP(types,"prog",function(vp,idxV,v){
        const isReflexive=vp.elements[idxV].isReflexive(); // must be called before removeElement to take account its parentConst 
        const verb=vp.removeElement(idxV);
        const origLemma=verb.lemma;
        verb.setLemma("être");// change verb, but keep person, number and tense properties of the original...
        // except for sentence refl which should be kept on the original verb
        if (isReflexive)verb.ignoreRefl=true; // HACK: flag used by Terminal.isReflexive()
        // insert "en train","de" (separate so that élision can be done...) 
        // but do it BEFORE the pronouns created by .pro()
        let i=idxV-1;
        while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
        vp.addElement(verb,i+1).addElement(Q("en train"),i+2).addElement(Q("de"),i+3)
        if (isReflexive){ // for "essentiellement réflexifs" verbs, add appropriate pronoun before the infinitive (without se)
            vp.addElement(Pro("me*refl").pe(verb.getProp("pe")).n(verb.getProp("n")).g(verb.getProp("g")),idxV+3)
              .addElement(Q(origLemma),idxV+4)
        } else
            vp.addElement(V(origLemma).t("b"),idxV+3);
    });
    this.processVP(types,"mod",function(vp,idxV,v,mod){
        var vUnit=v.lemma;
        for (var key in rules.verb_option.modalityVerb){
            if (key.startsWith(mod)){
                v.setLemma(rules.verb_option.modalityVerb[key]);
                break;
            }
        }
        let i=idxV-1;
        // move the modality verb before the pronoun(s) inserted by .pro()
        while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
        if (i!=idxV-1){
            vp.addElement(vp.removeElement(idxV),i+1); // remove the modality verb and move it before the pronouns
        }
        vp.addElement(V(vUnit).t("b"),idxV+1); // add the original verb at infinitive 
    });
    this.processVP(types,"neg",function(vp,idxV,v,neg){
        if (neg === true)neg="pas";
        v.neg2=neg; // HACK: to be used when conjugating at the realization time
        while (idxV>0 && vp.elements[idxV-1].isA("Pro"))idxV--;
        // insert "ne" before the verb or before possible pronouns preceding the verb
        if (v.getProp("t")!="pp")
            vp.addElement(Adv("ne","fr"),idxV)
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
        if (idxVP>=0) {vp=this.elements[idxVP]}
        else {
            return this.warn("bad const for option",'.typ('+JSON.stringify(types)+')',this.constType,["VP"])
        }
    }
    const idxV=vp.getIndex("V");
    if(idxV>=0){
        const v = vp.elements[idxV];
        const v_peng=v.peng;
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
        if (types["contr"]!==undefined && types["contr"]!==false){
            vp.contraction=true; // necessary because we want the negation to be contracted within the VP before the S or SP
            this.contraction=true;
        }
        const compound = this.getRules().compound;
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
            if (interro!="wos" && interro!="was"){
                auxils.push("do");
                affixes.push("b");
            }
        }
        auxils.push(v.lemma);
        // realise the first verb, modal or auxiliary
        // but make the difference between "have" as an auxiliary and "have" as a verb
        const vAux=auxils.shift();
        let words=[];
        // conjugate the first verb
        if (neg) { // negate the first verb
            if (t=="pp" || t=="pr"){ // special case for these tenses
                words.push(Adv("not","en"));
                words.push(V(vAux,"en").t(t));
            } else if (vAux in negMod){
                if (vAux=="can" && t=="p"){
                    words.push(Q("cannot"))
                } else {
                    words.push(V(vAux,"en").t(t))
                    words.push(Adv("not","en"))
                }
            } else if (vAux=="be" || (vAux=="have" && v.lemma!="have")) {
                words.push(V(vAux).t(t));
                words.push(Adv("not","en"));
            } else {
                words.push(V("do","en").t(t));
                words.push(Adv("not","en"));
                if (vAux != "do") words.push(V(vAux).t("b")); 
            }
        } else { // must only set necessary options, so that shared properties will work ok
            let newAux=V(vAux);
            if (!isFuture)newAux.t(t);
            if (v.lemma in negMod)newAux.pe(1);
            words.push(newAux);
        }
        // recover the original agreement info and set it to the first new verb...
        words[0].peng=v_peng;
        // realise the other parts using the corresponding affixes
        while (auxils.length>0) {
            const vb=auxils.shift();
            words.push(V(vb).t(affixes.shift()));
        }
        if (types["refl"]===true && t!="pp"){
            words.push(Pro("myself","en").pe(v.getProp("pe")).n(v.getProp("n")).g(v.getProp("g")))
        }
        // insert the content of the word array into vp.elements
        vp.removeElement(idxV);
        for (let i=0;i<words.length;i++)
            vp.addElement(words[i],idxV+i);
    } else {
        this.warn("not found","V","VP")
    }
}

// get elements of the constituent cst2 within the constituent cst1
Phrase.prototype.getIdxCtx = function(cst1,cst2){
    if (this.isA(cst1)){
        var idx=this.getIndex(cst2)
        if (idx>=0)return [idx,this.elements];
    } else if (this.isOneOf(["S","SP"])){
        var cst=this.getConst(cst1);
        if (cst!==undefined)return cst.getIdxCtx(cst1,cst2);
    }
    return [undefined,undefined]
}

Phrase.prototype.moveAuxToFront = function(){
    // in English move the auxiliary to the front 
    if (this.isEn()){
        if (this.isOneOf(["S","SP"])){ 
            let [idx,vpElems]=this.getIdxCtx("VP","V");
            if (idx!==undefined){
                const v=vpElems[0].parentConst.removeElement(0);// remove first V
                // check if V is followed by a negation, if so move it also
                if (vpElems.length>0 && vpElems[0].isA("Adv") && vpElems[0].lemma=="not"){
                    const not=vpElems[0].parentConst.removeElement(0)
                    this.addElement(v,0).addElement(not,1)
                } else {
                    this.addElement(v,0)
                }
            }
        }
    } 
}

Phrase.prototype.invertSubject = function(){
    // in French : use inversion rule which is quite "delicate"
    // rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
    // if subject is a pronoun, invert and add "-t-" or "-"
    // if subject is a noun, the subject stays but add a new pronoun
    const subjIdx=this.getIndex(["NP","N","Pro","SP","CP"]);
    if (subjIdx>=0){
        const subj=this.elements[subjIdx];
        let pro;
        if (subj.isA("Pro"))
            pro = this.removeElement(subjIdx); // remove subject pronoun
        else if (subj.isA("CP")){
            pro=Pro("moi","fr").c("nom").g("m").n("p").pe(3); // create a "standard" pronoun, to be patched by cpReal
            subj.pronoun=pro;  // add a flag to be processed by cpReal
        } else 
            pro=Pro("moi","fr").g(subj.getProp("g")).n(subj.getProp("n")).pe(3).c("nom"); // create a pronoun
        let [idx,vpElems] = this.getIdxCtx("VP","V");
        if (idx!==undefined) {
            let v=vpElems[idx];
            v.parentConst.addElement(pro,idx+1)
            v.lier() // add - after verb
        }
    } 
}

// all prepositions from lexicon-en|fr.js (used for implementing int:"woi|wai|whn|whe"
// tail +2 lexicon-en|fr.js | jq 'to_entries | map(select(.value|has("P"))|.key )'
const prepositionsList = {
    "en":{
        "all":new Set([ "about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "amongst", "around", "as", "at", "back", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "by", "concerning", "considering", "despite", "down", "during", "except", "for", "from", "in", "inside", "into", "less", "like", "minus", "near", "next", "of", "off", "on", "onto", "outside", "over", "past", "per", "plus", "round", "since", "than", "through", "throughout", "till", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "with", "within", "without" ] ),
        "whe":new Set(["above", "across", "along", "alongside", "amid","around", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "in", "inside", "into", "near", "next", "onto", "outside", "over", "past","toward", "towards", "under", "underneath","until","via","within",  ]),
        "whn":new Set(["after", "before", "during","since",  "till", ]),
    },
    "fr":{
        "all":new Set([ "à", "après", "avant", "avec", "chez", "contre", "d'après", "dans", "de", "dedans", "depuis", "derrière", "dès", "dessous", "dessus", "devant", "durant", "en", "entre", "hors", "jusque", "malgré", "par", "parmi", "pendant", "pour", "près", "sans", "sauf", "selon", "sous", "sur", "vers", "via", "voilà" ]),
        "whe":new Set(["après", "avant", "chez","dans",  "dedans","derrière","dessous", "dessus", "devant","entre", "hors","près","sous", "sur", "vers", "via",]),
        "whn":new Set(["après", "avant","depuis", "dès","durant", "en","pendant",]),
    }
}

Phrase.prototype.processInt = function(int){
    const sentenceTypeInt=this.getRules().sentence_type.int
    const intPrefix=sentenceTypeInt.prefix;
    let prefix,pp; // to be filled later
    switch (int) {
    case "yon": case "how": case "why": case "muc": 
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        prefix=intPrefix[int];
        break;
    // remove a part of the sentence 
    case "wos": case "was":// remove subject (first NP,N, Pro or SP)
        if (this.isOneOf(["S","SP","VP"])){
            const subjIdx=this.getIndex(["NP","N","Pro","SP"]);
            if (subjIdx!==undefined){
                const vbIdx=this.getIndex(["VP","V"]);
                if (vbIdx!==undefined && subjIdx<vbIdx){ // subject should be before the verb
                    // insure that the verb at the third person singular, 
                    // because now the subject has been removed
                    const v=this.elements[vbIdx];
                    v.setProp("n","s");
                    v.setProp("pe",3);
                    this.removeElement(subjIdx);
                }
            }
        }
        prefix=intPrefix[int];
        break;
    case "wod": case "wad": // remove direct object (first NP,N,Pro or SP in the first VP)
        if (this.isOneOf(["S","SP","VP"])){
            const [idx,obj]=this.getIdxCtx("VP",["NP","N","Pro","SP"]);
            if (idx!==undefined){
                obj[0].parentConst.removeElement(idx)
            } else if (this.isFr()){// check for passive subject starting with par
                const [idx,ppElems]=this.getIdxCtx("VP","PP");
                if (idx!==undefined){
                    pp=ppElems[idx].getConst("P");
                    if (pp!==undefined && pp.lemma=="par"){
                        ppElems[0].parentConst.removeElement(idx); // remove the passive subject
                    } else {
                        pp=undefined;
                    }
                }
            }
            prefix=intPrefix[int];
            if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        }
        break;
    case "woi": case "wai":case "whe":case "whn": // remove indirect object (first PP in the first VP)
        if (this.isOneOf(["S","SP","VP"])){
            const [idx,ppElems]=this.getIdxCtx("VP","PP");
            prefix=intPrefix[int];  // get default prefix
            if (idx!==undefined){ 
                // try to find a more appropriate prefix by looking at preposition in the structure
                let prep=ppElems[idx].elements[0];
                if (prep.isA("P")){
                    prep=prep.lemma;
                    const preps=prepositionsList[this.lang];
                    if (int=="whe"){
                        if (preps["whe"].has(prep))
                            ppElems[0].parentConst.removeElement(idx);
                    } else if (int=="whn"){
                        if (preps["whn"].has(prep))
                            ppElems[0].parentConst.removeElement(idx);
                    } else if (preps["all"].has(prep)){ // "woi" | "wai"
                        // add the preposition in front of the prefix (should be in the table...)
                        prefix=prep+" "+(this.isEn()?(int=="woi"?"whom":"what")
                                                    :(int=="woi"?"qui" :"quoi"));
                        ppElems[0].parentConst.removeElement(idx);
                    }
                }
            }
            if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        }
        break;
    default:
        this.warn("not implemented","int:"+int)
    }
    if(this.isFr() || int !="yon") {// add the interrogative prefix
        this.addElement(Q(prefix),0)
        if (pp !== undefined){ // add "par" in front of some French passive interrogative
            this.addElement(pp,0)
            if (int=="wad"){ // replace "que" by "quoi" for French passive wad
                this.elements[1].lemma="quoi";
            }
        }
    }
    this.a(sentenceTypeInt.punctuation,true);//
}

// modify sentence structure according to the content of the "typ" property
Phrase.prototype.processTyp = function(types){
    let pp; // flag for possible pp removal for French wod or wad
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
        this.processInt(types["int"]);
    const exc=types["exc"];
    if (exc !== undefined && exc === true){
        this.a(this.getRules().sentence_type.exc.punctuation,true);
    }
    return this;   
}

////////////////// Realization

//  special case of realisation of a cp for which the gender and number must be computed
//    at realization time...

Phrase.prototype.cpReal = function(){
    var res=[];
    // realize coordinated Phrase by adding ',' between all elements except for the last
    // if no C is found then all elements are separated by a ","
    // TODO: deal with the Oxford comma (i.e. a comma after all elements even the last)
    const idxC=this.getIndex("C");
    // take a copy of all elements except the coordonate
    const elems=this.elements.filter(function(x,i){return i!=idxC})
    var last=elems.length-1;
    if (last==-1){// empty coordinate (ignore)
        return []
    }
    if (last==0){// coordination with only one element, ignore coordinate
        Array.prototype.push.apply(res,elems[0].real());
        this.setProp("g",elems[0].getProp("g"));
        this.setProp("n",elems[0].getProp("n"));
        this.setProp("pe",elems[0].getProp("pe")||3);
        return this.doFormat(res); // process format for the CP
    }
    for (let j = 0; j < last; j++) { //insert comma after each element
        const ej=elems[j];
        if (idxC<0 || j<last-1){ // except the last if there is conjunction
            if (ej.props["a"] === undefined || !contains(ej.props["a"],","))
                ej.props["a"]=[","];
        }
        Array.prototype.push.apply(res,ej.real())
    }
    // insert realisation of C before last...
    if(idxC>=0){
        Array.prototype.push.apply(res,this.elements[idxC].real());
    }
    // insert last element
    Array.prototype.push.apply(res,elems[last].real());
    // compute the combined gender and number of the coordination once children have been realized
    let c;
    if(idxC >= 0 ){
        c=this.elements[idxC]
        var and=this.isFr()?"et":"and";
        var gn=this.findGenderNumberPerson(c.lemma==and);
        this.setProp("g",gn.g);
        this.setProp("n",gn.n);
        this.setProp("pe",gn.pe);
        // for the pronoun, we must override its existing properties...
        if (this.pronoun!==undefined){
            this.pronoun.peng=gn;
            this.pronoun.props["g"]=gn.g;
            this.pronoun.props["n"]=gn.n;
            this.pronoun.props["pe"]=gn.pe;
        }
    }
    return res; 
}

// special case of VP for which the complements are put in increasing order of length
Phrase.prototype.vpReal = function(){
    var res=[];
    function realLength(terms){
        // sum the length of each realization and add the number of words...
        //  use the lemma length (instead of realization) 
        // so that html tags and punctuation are not taken into the count
        return terms.map(t=>t.lemma.length).reduce((a,b)=>a+b,0)+terms.length
    }
    this.pronominalizeChildren();
    // get index of last V (to take into account possible auxiliaries)
    const last=this.elements.length-1;
    var vIdx=last;
    while (vIdx>=0 && !this.elements[vIdx].isA("V"))vIdx--;
    // copy everything up to the V (included)
    if (vIdx<0)vIdx=last;
    else {
        const t=this.elements[vIdx].getProp("t");
        if (t == "pp") vIdx=last; // do not rearrange sentences with past participle
        else if (contains(["être","be"],this.elements[vIdx].lemma)) { // do not rearrange complements of être/be
            vIdx=last 
        }
    } 
    let i=0;
    while (i<=vIdx){
        Array.prototype.push.apply(res,this.elements[i].real());
        i++;
    }
    if (i>last) {
        return this.doFormat(res); // process format for the VP
    }
    // save all succeeding realisations
    let reals=[]
    while (i<=last){
        reals.push(this.elements[i].real())
        i++;
    }
    // sort realisations in increasing length
    // HACK: consider two lengths differing by less than 25% (ratio > 0.75) as equal, 
    //       so that only big differences in length are reordered
    reals.sort(function(s1,s2){
        const l1=realLength(s1),l2=realLength(s2);
        return Math.min(l1,l2)/Math.max(l1,l2)>0.75?0:l1-l2
    });
    reals.forEach(r=>Array.prototype.push.apply(res,r)); // add them
    return this.doFormat(res) // process format for the VP
}

// creates a list of Terminal each with its "realization" field now set
Phrase.prototype.real = function() {
    let res=[];
    if (this.isA("CP")){
        res=this.cpReal()
    } else {
        this.pronominalizeChildren();
        const typs=this.props["typ"];
        if (typs!==undefined)this.processTyp(typs);
        const es=this.elements;
        for (let i = 0; i < es.length; i++) {
            const e = es[i];
            var r;
            if (e.isA("CP")){
                r=e.cpReal();
            } else if (e.isA("VP") && reorderVPcomplements){
                r=e.vpReal();
            } else {
                r=e.real()
            }
            // we must flatten the lists
            Array.prototype.push.apply(res,r)
        }
    }
    return this.doFormat(res);
};

// recreate a jsRealB expression
// if indent is positive number create an indented pretty-print string (call it with 0 at the root)
// if called with no parameter then create a single line
Phrase.prototype.toSource = function(indent){
    let sep;
    if (indent===undefined)indent=-1;
    if (indent>=0){
        indent=indent+this.constType.length+1;
        sep=",\n"+Array(indent).fill(" ").join("")
    } else {
        sep=",";
    }
    // create source of children
    let res=this.constType+"("+this.elementsSource.map(e => e.toSource(indent)).join(sep)+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this); // ~ super.toSource()
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
