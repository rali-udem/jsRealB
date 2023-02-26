/**
   jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
 */

import {Constituent} from "./Constituent.js";
import {Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./Terminal.js"
import {getElems, affixHopping, doFrenchPronounPlacement, checkAdverbPos} from "./NonTerminal.js";
import {getLanguage,getRules,copulesFR,prepositionsList,reorderVPcomplements} from "./Lexicon.js";
export {Phrase, S, NP, AP, VP, AdvP, PP, CP, SP};
/**
 * Phrase a subclass of Constituent for creating non terminals in Constituency notation
 */
class Phrase extends Constituent{
    /**
     * Build a new Phrase
     * @param {Constituents[]} elements children of this Phrase
     * @param {string} constType kind of this Phrase
     * @param {"en"|"fr"} lang  optional: specify language for this Phrase otherwise use current language  
     */
    constructor(elements,constType,lang){ // lang parameter used calls in IO-json.js
        super(constType); // super constructor
        this.lang = lang || getLanguage();
        elements=getElems(elements); 
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
                if (e instanceof Terminal || e instanceof Phrase) {
                    this.addElement(e);
                    this.elementsSource.push(e);
                } else {
                    this.warn("bad Constituent",NO(i+1).dOpt({ord:true}).realize(),typeof e+":"+JSON.stringify(e))
                }
            }
            // terminate the list with add which does other checks on the final list
            this.add(elements[last],undefined,true)
        }
    }

    /**
     * Add a Constituent as a child of this Phrase
     * @param {Terminal | Phrase} elem Constituent to add
     * @param {int?} position position in the children to add this element, at the end if not specified 
     * @returns this Phrase
     */
    addElement(elem,position){
        if (elem instanceof Terminal || elem instanceof Phrase){
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
            this.warn("bad Constituent",NO(position+1).dOpt({ord:true}).realize(),typeof elem)
        }
        return this
    }

    /**
     * Remove a child of this Phrase 
     * @param {int} position index of child to remove
     * @returns the remove child 
     */
    removeElement(position){
        if (typeof position == "number" && position<this.elements.length && position>=0){
            const elem=this.elements.splice(position,1)[0];
            elem.parentConst=null
            return elem
        }
        return this.warn("bad position",position,this.elements.length)
    }

    /**
     * Add a new constituent and set agreement links
     * @param {Constituent} constituent  Constituent to add
     * @param {int} position position at whcih to add, if not given add at the end
     * @param {boolean} prog if specified then it is called by the constructor not the user so do not keep source info about this add
     * @returns this Phrase
     */
    add(constituent,position,prog){
        function allAorN(elems,start,end){
            if (start>end) {[end,start]=[start,end]}
            for (var k=start;k<=end;k++){
                if (!elems[k].isA("A","N"))return false;
            }
            return true
        }
        if (constituent===null)return this;
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
                if (idx >= 0){
                    // unless specified the position of an English adjective is pre, but is post for a French one
                    const pos=e.props["pos"]||(e.isFr()?"post":"pre"); 
                    if ((pos=="pre" && i>idx)||(pos=="post" && i<idx)){
                        if (allAorN(this.elements,i,idx)){
                            this.addElement(this.removeElement(i),idx)
                        }
                    }
                }
            } else if (e.isA("Adv") && e.props["pos"]!==undefined){ 
                // check for adverb position relative to the verb if .pos() is specified
                const vbIdx = this.getIndex("V")
                if (vbIdx >=0){
                    const pos=e.props["pos"]
                    if ((pos == "pre" && i>vbIdx) || (pos=="post" && i<vbIdx))
                        this.addElement(this.removeElement(i),vbIdx)
                }
            }
        }
        return this;
    }
    
    /**
     * Provide a more informative error about a call that should never have happened
     * @returns raise an exception
     */
    grammaticalNumber(){
        return this.error("grammaticalNumber must be called on a NO, not a "+this.constType);
    }

    /**
     * Gets the head of a given Phrase within the children of this Phrase
     * @param {string} phName Phrase name
     * @returns index of the head within children, if not found return 0 (the first child)
     */
    getHeadIndex(phName){
        let termName=phName.substring(0,phName.length-1); // remove P at the end of the phrase name
        let headIndex=this.getIndex([phName,termName]);
        if (headIndex<0){
            // this.warn("not found",termName,phName); // this generates too many spurious messages
            headIndex=0;
        }
        return headIndex;
    }

    /**
     * Ensures agreement between Constituents
     * Loops over children to set the peng and taux to their head or subject
     * so that once a value is changed this change will be propagated correctly...
     * @returns this Phrase
     */
    linkProperties	(){
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
                        } else if (e.isA("D","A")){
                            // link gender and number of the noun to the determiners and adjectives
                            // in English possessive determiner should not depend on the noun but on the "owner"
                            if (this.isFr() || !e.isA("D") || e.getProp("own") === undefined){
                                e.peng=this.peng
                            }
                        } else if (e.isA("CP")){ // check for a coordination of adjectives or number
                            const me=this;
                            e.elements.forEach(function(e){
                                if (e.isA("A","NO")) // 
                                    e.peng=me.peng
                            })
                        }
                    }
                }
            }
            //   set agreement between the subject of a subordinate or the object of a subordinate
            const pro=this.getFromPath([["S","SP"],"Pro"]);
            if (pro!==undefined){
                const v=pro.parentConst.getFromPath(["VP","V"]);
                if (v !=undefined){
                    if (["qui","who","which","that"].includes(pro.lemma)){// agrees with this NP
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
                pengNO:Constituent.pengNO++
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
                    if (["que","où","that"].includes(subject.lemma)){
                        // HACK: the first pronoun  should not be a subject...
                        //        so we try to find another...
                        const jSubj=this.elements.slice(iSubj+1).findIndex(
                            e => e.isA("NP","N","CP","Pro")
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
                    if (this.isFr() && copulesFR.includes(vpv.lemma)){
                        // check for coordination of attributes or past participles
                        const vpcp = this.getFromPath([["VP"],["CP"]])
                        if (vpcp!== undefined){
                            for (let e of vpcp.elements){
                                if (e.isA("A"))
                                    e.peng=subject.peng;
                                else if (e.isA("V") && e.getProp("t")=="pp")
                                    e.peng=subject.peng
                                else if (e.isA("AP"))
                                    e.linkPengWithSubject("AP","A",subject)
                                else if (e.isA("VP")){
                                    const v = e.getFromPath([["VP"],["V"]]);
                                    if (v !== undefined && v.getProp("t")=="pp"){
                                        pp.peng=subject.peng;
                                    }
                                }
                            }
                        } else { 
                            // check for a single French attribute of copula verb
                            // with an adjective
                            const attribute = vpv.parentConst.linkPengWithSubject("AP","A",subject);
                            if (attribute===undefined){
                                // check for past participle after the verb
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

    /**
     * Make the subject agree with the verb
     * @param {Phrase} phrase 
     * @param {Terminal} terminal 
     * @param {Constituent} subject 
     * @returns returns the subject
     */
    linkPengWithSubject(phrase,terminal,subject){
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

    /**
     * Creates a string identifying this Phrase
     * @returns identification string
     */
    me(){
        const children=this.elements.map(function(e){return e.me()});
        return this.constType+"("+children.join()+")";
    }

    /**
     * Provide a more informative error message for a situation that should never have occurred
     * @param {string} lemma 
     * @param {string} terminalType 
     * @returns raises an exception
     */
    setLemma(lemma,terminalType){
        this.error("***: should never happen: setLemma: called on a Phrase");
        return this;
    }

    /**
     * Finds the index of the first Constituent of the specified type (or of one of the arguments) in the list of elements
     * @param {...string} constTypes a single of a list of constType
     * @returns index or -1 if not found
     */
    getIndex(constTypes){
        if (typeof constTypes == "string")constTypes=[constTypes];
        return this.elements.findIndex(e => e.isA(constTypes),this);
    }

    // find a given constituent type (or one of the constituent) in the list of elements
    /**
     * Finds the first Constituent of the specified type (or of one of the arguments) in the list of elements
     * @param {...string} constTypes a single of a list of constType
     * @returns the found Constituent or undefined if not found
     */
     getConst(constTypes){
        const idx=this.getIndex(constTypes);
        if (idx < 0) return undefined;
        return this.elements[idx]
    }

    /**
     * Find the gender, number and Person of (NP,N,Pro,Q) elements of this Phrase
     *   set masculine if at least one (NP,N,Pro,Q) is masculine
     *   set plural if one is plural or more than one combined with and
     *   set person to the minimum one encountered (i.e. 1st < 2nd < 3rd) mostly useful for French 
     * @param {boolean} andCombination true if combined with "and"
     * @returns Object with "g", "n" and "pe" set
     */
    findGenderNumberPerson(andCombination){
        let g="f";
        let n="s";
        let pe=3;
        let nb=0;
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i];
            if (e.isA("NP","N","Pro","Q","NO")){
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

    /**
     * Pronominalization in French
     * Phrase structure modification but that must be called in the context of the parentConst
     * because the pronoun depends on the role of the NP in the sentence 
     *         and its position can also change relatively to the verb
     * @returns a Pro corresponding to the current NP
     */
    pronominalize_fr(){
        let pro;
        const npParent=this.parentConst;
        if (npParent!==null){
            const myself=this;
            let idxMe=npParent.elements.findIndex(e => e==myself,this);
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
                } else if (idxV>=0) { // if there is a verb
                    pro=this.getTonicPro("acc") // is direct complement;
                    npParent.elements[idxV].cod=this;// indicate that this is a COD
                } else { // only replace the noun
                    pro=this.getTonicPro("nom")
                }
            } else if (this.isA("PP")){ // is indirect complement
                np=this.getFromPath([["NP","Pro"]]); // either a NP or Pro within the PP
                const prep=this.getFromPath(["P"]);
                if (prep !== undefined && np !== undefined){
                    if (prep.lemma == "à"){
                        pro=np.getTonicPro("dat");
                    } else if (prep.lemma == "de") {
                        pro=Pro("en","fr").c("dat")
                    } else if (["sur","vers","dans"].includes(prep.lemma)){
                        pro=Pro("y","fr").c("dat")
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
            npParent.removeElement(idxMe);// insert pronoun where the NP was
            npParent.addElement(pro,idxMe);
        } else {// special case without parentConst so we leave the NP and change its elements
            pro=this.getTonicPro();
            pro.props=this.props;
            pro.peng=this.peng;
            this.elements=[pro];
        }
        return pro;
    }

    /**
     * Pronominalization in English only applies to a NP (this is checked before the call)
     *  and does not need reorganisation of the sentence 
     *  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
     * @returns a Pro corresponding to the current NP
     */
    pronominalize_en(){
        let pro;
        if (this.isA("Pro"))return; // TODO: correct this later
        const npParent=this.parentConst;
        if (npParent!==null){
            let idxV=-1;
            let myself=this;
            let idxMe=npParent.elements.findIndex(e => e==myself,this);
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

    /**
     * Pronominalization of children  
     * check if this is applicable for the language of the element
     * this must be done in the context of the parent, because some elements might be changed
     * @param {Constituent} e element to pronominalize
     */
    pronominalizeChildren(){
        for (let e of this.elements) {
            if (e.props["pro"]!==undefined && !e.isA("Pro")){// it can happen that a Pro has property "pro" set within the same expression
                if (e.isFr()){
                    e.pronominalize_fr()
                } else { // in English pronominalize only applies to a NP
                    if (e.isA("NP")){
                        e.pronominalize_en()
                    } else {
                        return this.warn("bad application",".pro",["NP"],e.constType)
                    }
                }
            }    
        }
    }

    /**
     * Modify the sentence structure to create a passive sentence
     */
    passivate(){
        let subject,vp,newSubject;
        // find the subject at the start of this.elements
        if (this.isA("VP")){
            subject=null;
            vp=this;
        } else {
            vp=this.getConst("VP");
            if (vp !== undefined){
                if (this.elements.length>0 && this.elements[0].isA("N","NP","Pro","S")){
                    subject=this.removeElement(0);
                    if (subject.isA("Pro")){ 
                        subject = subject.getTonicPro()
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
                    let prep;
                    if (subject.isA("S"))  // take for granted that the S is a VP
                        prep = this.isFr() ? "de" : "to";
                    else
                        prep = this.isFr() ? "par" : "by";
                    vp.addElement(PP(P(prep,this.lang),subject),objIdx);
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
                let prep,pos;
                if (subject.isA("S")){  // take for granted that the S is a VP
                    prep = this.isFr() ? "de" : "to";
                    pos = undefined;
                } else {
                    prep = this.isFr() ? "par" : "by";
                    pos= vpIdx+1
                }
                vp.addElement(PP(P(prep,this.lang),subject),pos);
            }
            if (this.isFr()){
                // do this only for French because in English this is done by processTyp_en
                // change verbe into an "être" auxiliary and make it agree with the newSubject
                const verbeIdx=vp.getIndex("V")
                const verbe=vp.removeElement(verbeIdx);
                const aux=V(verbe.lemma == "être" ? "avoir" : "être","fr");
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

    /**
     * Generic phrase structure modification for a VP, called in the .typ({...}) for .prog, .mod, .neg
     * also deals with coordinated verbs
     * This might modify the current list of elements
     * @param {Object} types typ options for this Phrase
     * @param {string} key option to process
     * @param {Function} action function that modifies the structure
     */
    processVP(types,key,action){
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

    /**
     * French phrase modification for .prog, .mod, .neg 
     * @param {Object} types typ options for this Phrase
     */
    processTyp_fr(types){
        // process types in a particular order
        let rules=getRules(this.lang);
        this.processVP(types,"prog",function(vp,idxV,v){
            const verb=vp.removeElement(idxV);
            const origLemma=verb.lemma;
            verb.setLemma("être");// change verb, but keep person, number and tense properties of the original...
            verb.isProg=verb;
            // except for sentence refl which should be kept on the original verb
            // if (isReflexive)verb.ignoreRefl=true; // HACK: flag used by Terminal.isReflexive()
            // insert "en train","de" (separate so that élision can be done...) 
            // but do it BEFORE the pronouns created by .pro()
            let i=idxV-1;
            while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
            vp.addElement(verb,i+1).addElement(Q("en train"),i+2).addElement(Q("de"),i+3)
            vp.addElement(V(origLemma).t("b"),idxV+3);
        });
        this.processVP(types,"mod",function(vp,idxV,v,mod){
            var origLemma=v.lemma;
            for (var key in rules.verb_option.modalityVerb){
                if (key.startsWith(mod)){
                    v.setLemma(rules.verb_option.modalityVerb[key]);
                    delete v.cod; // remove possible cod  information from the original verb
                    break;
                }
            }
            v.isMod=true
            let i=idxV-1;
            // move the modality verb before the pronoun(s) inserted by .pro()
            while (i>=0 && vp.elements[i].isA("Pro") && vp.elements[i].peng!==vp.peng)i--;
            if (i!=idxV-1){
                vp.addElement(vp.removeElement(idxV),i+1); // remove the modality verb and move it before the pronouns
            }
            let newV=V(origLemma).t("b");
            if (v.isProg){ // copy progressive from original verb...
                newV.isProg=v.isProg;
                delete v.isProg
            }
            vp.addElement(newV,idxV+1); // add the original verb at infinitive 
        });
        this.processVP(types,"neg",function(vp,idxV,v,neg){
            if (neg === true)neg="pas";
            v.neg2=neg; // HACK: to be used when conjugating at the realization time
        })
    }


    /**
     * English phrase modification (mostly performed by affixHopping)
     * This might modify the current list of elements
     * @param {Object} types typ options for this Phrase
     */
    processTyp_en(types){
        // replace current verb with the list new words
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
            if (types["contr"]!==undefined && types["contr"]!==false){
                vp.contraction=true; // necessary because we want the negation to be contracted within the VP before the S or SP
                this.contraction=true;
            }
            const words=affixHopping(vp.elements[idxV],vp.getProp("t"),getRules(this.lang).compound,types)
            // insert the content of the word array into vp.elements
            vp.removeElement(idxV);
            for (let i=0;i<words.length;i++)
                vp.addElement(words[i],idxV+i);
        } else {
            this.warn("not found","V","VP")
        }
    }

    /**
     * Get elements of the constituent cst2 within the constituent cst1
     * used for phrase modification (e.g. moveAuxToFront...)
     * @param {Constituent} cst1 
     * @param {Constiuent} cst2 
     */
    getIdxCtx(cst1,cst2){
        if (this.isA(cst1)){
            var idx=this.getIndex(cst2)
            if (idx>=0)return [idx,this.elements];
        } else if (this.isA("S","SP")){
            var cst=this.getConst(cst1);
            if (cst!==undefined)return cst.getIdxCtx(cst1,cst2);
        }
        return [undefined,undefined]
    }

    /**
     * in English move the auxiliary to the front 
     */
    moveAuxToFront(){
        if (this.isEn()){
            if (this.isA("S","SP")){ 
                let [idx,vpElems]=this.getIdxCtx("VP","V");
                if (idx!==undefined && !["pp","pr","b-to"].includes(this.getProp("t"))){ // do not move when tense is participle)
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

    /**
     * in French : use an inversion rule which is quite "delicate"
     * rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
     * if subject is a pronoun, invert and add "-t-" or "-"
     * if subject is a noun, the subject stays but add a new pronoun
     */
    invertSubject(){
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

    /**
     * Process options for interrogative for both French and English
     * @param {Object} types typ options for this Phrase
     */
    processInt(types){
        const int=types["int"];
        const sentenceTypeInt=getRules(this.lang).sentence_type.int;
        const intPrefix=sentenceTypeInt.prefix;
        let prefix,pp; // to be filled later
        switch (int) {
        case "yon": case "how": case "why": case "muc": 
            if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
            prefix=intPrefix[int];
            break;
        // remove a part of the sentence 
        case "wos": case "was":// remove subject (first NP,N, Pro or SP)
            if (this.isA("S","SP","VP")){
                const subjIdx=this.getIndex(["NP","N","Pro","SP"]);
                if (subjIdx!==undefined){
                    const vbIdx=this.getIndex(["VP","V"]);
                    if (vbIdx!==undefined && subjIdx<vbIdx){ // subject should be before the verb
                        // insure that the verb at the third person, 
                        // because now the subject has been removed
                        const v=this.elements[vbIdx];
                        v.setProp("pe",3);
                        this.removeElement(subjIdx);
                    }
                }
            }
            prefix=intPrefix[int];
            break;
        case "wod": case "wad": // remove direct object (first NP,N,Pro or SP in the first VP)
            if (this.isA("S","SP","VP")){
                let cmp;
                const [idx,obj]=this.getIdxCtx("VP",["NP","N","Pro","SP"]);
                if (idx!==undefined){
                    cmp=obj[0].parentConst.removeElement(idx)
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
                if (this.isEn() && int=="wod" && cmp!==undefined && ["m","f"].includes(cmp.getProp("g"))){ // human direct object
                    prefix="whom";
                } else
                    prefix=intPrefix[int];
                if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
            }
            break;
        case "woi": case "wai":case "whe":case "whn": // remove indirect object (first PP in the first VP)
            if (this.isA("S","SP","VP")){
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
        case "tag":
            if (this.isA("S","SP","VP")){
                // according to Antidote: Syntax Guide - Question tag
                // Question tags are short questions added after affirmations to ask for verification
                if (this.isFr()){ // in French really simple, add "n'est-ce pas"
                    this.a(", n'est-ce pas")
                } else { 
                    // in English, sources: https://www.anglaisfacile.com/exercices/exercice-anglais-2/exercice-anglais-95625.php
                    //  or https://www.englishclub.com/grammar/tag-questions.htm
                    // must find  and pronoun and conjugate the auxiliary
                    let aux;
                    const currV=this.getFromPath(["VP","V"]);
                    if (currV !== undefined){
                        if ("mod" in types && types["mod"]!==false){
                            aux=getRules(this.lang).compound[types["mod"]]["aux"];
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
                        const subjIdx=this.getIndex(["NP","N","Pro","SP"]);
                        if (subjIdx >= 0){
                            const vbIdx=this.getIndex(["VP","V"]);
                            if (vbIdx >= 0 && subjIdx<vbIdx){ // subject should be before the verb
                                const subj=this.elements[subjIdx];
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
                                } else {
                                    // pro=Pro("I").pe(3).n(subj.getProp("n")).g(subj.getProp("g"))
                                    pro=subj.clone().pro()
                                }
                            }
                        } else { // no subject, but check if the verb is imperative
                            if (t == "ip"){
                                if (aux == "do") aux = "will" // change aux when the aux is default
                                pro = Pro("I").pe(2).n(n).g(g)
                            }
                        }
                        // check for negative adverbs...
                        const adv=currV.parentConst.getConst("Adv");
                        if (adv!==undefined && ["hardly","scarcely","never","seldom"].includes(adv.lemma)){
                            neg=true
                        }
                        currV.parentConst.a(","); // add comma to parent of the verb
                        //   this is a nice illustration of jsRealB using itself for realization
                        let vp;
                        if (aux=="have" && !neg){ 
                            // special case because it should be realized as "have not" instead of "does not have" 
                            vp=VP(V("have").t(t).pe(pe).n(n),Adv("not"),pro).typ({"contr":true})
                        } else { // use jsRealB itself for realizing the tag by adding a new VP
                            vp=VP(V(aux).t(t).pe(pe).n(n),pro).typ({"neg":!neg,"contr":true});
                        }
                        pro.peng=vp. peng;  // ensure that the head of the vp is the pronoun for pronominalize_en
                        this.addElement(vp);
                    }
                }
                prefix=intPrefix[int];
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

    /**
     * Modify sentence structure according to the content of the "typ" property
     * @param {Object} types typ options for this Phrase
     */
    processTyp(types){
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
            this.processInt(types);
        const exc=types["exc"];
        if (exc !== undefined && exc === true){
            this.a(getRules(this.lang).sentence_type.exc.punctuation,true);
        }
        return this;   
    }

    ////////////////// Realization
    
    /**
     * Change order of pronouns in French (quite intricate)
     * Instance method that calls a common method for both Phrase and Dependent
     * called by doFormat in Constituent.js
     * HACK: call local to get around import circularity
     * @param {Terminal[]} clist list of terminals which can be reorganized
     */
    doFrenchPronounPlacement(clist){
        return doFrenchPronounPlacement(clist); // caution: NO this is this call...
    }
    
    /**
     * Special case of realisation of a cp for which the gender and number must be computed
     * at realization time
     */
    cpReal(){
        var res=[];
        // realize coordinated Phrase by adding ',' between all elements except for the last
        // if no C is found then all elements are separated by a ","
        // TODO: deal with the Oxford comma (i.e. a comma after all elements even the last)
        //       although it can be "patched" using C("and").b(",") but this adds a spurious space before the comma
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
                if (ej.props["a"] === undefined || !ej.props["a"].includes(","))
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
            // for an inserted pronoun, we must override its existing properties...
            if (this.pronoun!==undefined){
                this.pronoun.peng=gn;
                this.pronoun.props["g"]=gn.g;
                this.pronoun.props["n"]=gn.n;
                this.pronoun.props["pe"]=gn.pe;
            }
        }
        return this.doFormat(res); 
    }

    /**
     * Special case of VP for which the complements are put in increasing order of length
     * Not used often, because it does not seem to be very useful
     */
    vpReal(){
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
            else if (["être","be"].includes(this.elements[vIdx].lemma)) { // do not rearrange complements of être/be
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

    /**
     * Sets the realization field of its elements
     * @returns a list of Terminals with their realization fields set
     */
    real() {
        let res=[];
        if (this.isA("CP")){
            res=this.cpReal()
        } else {
            this.pronominalizeChildren();
            const typs=this.props["typ"];
            if (typs!==undefined)this.processTyp(typs);
            const es=this.elements;
            for (let e of es){
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
            if (this.isA("VP"))
                checkAdverbPos(res)
        }
        return this.doFormat(res);
    };
    
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
     * Recreate a jsRealB expression
     * if indent is non negative number create an indented pretty-print string (call it with 0 at the root)
     * if called with no parameter (equivalent to a negative number) then create a single line
     * @param {int} indent indentation level
     * @returns a (possibly indented) String corresponding to the source expression of this Phrase
     */
    toSource(indent){
        if (indent===undefined)indent=-1;
        let [newIndent,sep]=this.indentSep(indent);
        // create source of children
        let res=this.constType+"("+this.elementsSource.map(e => e.toSource(newIndent)).join(sep)+")";
        // add the options by calling "super".toSource()
        res+=Constituent.prototype.toSource.call(this); // ~ super.toSource()
        return res;
    }

    /**
     * Creates a "debug" representation from the structure not from the saved source strings
     * CAUTION: this output is NOT a legal jsRealB expression, contrarily to .toSource()
     * @param {int} indent indentation level
     * @returns a (possibly indented) string showing the current internal state of this Phrase
     */
    toDebug(indent){
        if (indent===undefined)indent=-1;
        let [newIndent,sep]=this.indentSep(indent);
        // create debug of children
        let res=this.constType+"("+this.elements.map(e => e.toDebug(newIndent)).join(sep)+")";
        // add the options by calling "super".toSource()
        res+=Constituent.prototype.toDebug.call(this); // ~ super.toSource()
        return res;
    }        
}
/////////////// Constructors for the user

// functions for creating Phrases

/**
 * Creates a Sentence Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with S as constType
 */
function S   (_){ return new Phrase(Array.from(arguments),"S"); };
/**
 * Creates a Noun Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with NP as constType
 */
function NP  (_){ return new Phrase(Array.from(arguments),"NP"); }
/**
 * Creates a Adjective Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with AP as constType
 */
function AP  (_){ return new Phrase(Array.from(arguments),"AP"); }
/**
 * Creates a Verb Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with VP as constType
 */
function VP  (_){ return new Phrase(Array.from(arguments),"VP"); }
/**
 * Creates a Adverb Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with AdvP as constType
 */
function AdvP(_){ return new Phrase(Array.from(arguments),"AdvP"); }
/**
 * Creates a Preposition Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with PP as constType
 */
function PP  (_){ return new Phrase(Array.from(arguments),"PP"); }
/**
 * Creates a Coordinate Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with CP as constType
 */
function CP  (_){ return new Phrase(Array.from(arguments),"CP"); }
/**
 * Creates a Subordinate Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with SP as constType
 */
function SP  (_){ return new Phrase(Array.from(arguments),"SP"); }
