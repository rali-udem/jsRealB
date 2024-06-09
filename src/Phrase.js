/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { Constituent } from "./Constituent.js";
import { Terminal } from "./Terminal.js";
import { getElems,Pro,P,NO,Q,PP } from "./jsRealB.js"
import {getLanguage,getRules,reorderVPcomplements} from "./Lexicon.js";

export {Phrase};

/**
 * Phrase a subclass of Constituent for creating non terminals in Constituency notation
 */
class Phrase extends Constituent{
    /**
     * Build a new Phrase
     * @param {Constituent[]} elements children of this Phrase
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
            return this.warn("bad Constituent",this.word_last(),typeof constituent+":"+JSON.stringify(constituent))
        }
        if (prog===undefined){// real call to .add 
            this.optSource+=".add("+constituent.toSource()+(position===undefined?"":(","+position) )+")"
        } else {
            this.elementsSource.push(constituent) // call from the constructor        
        }
        this.addElement(constituent,position)
        // change position of some children
        this.linkProperties();
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i];
            if (e.isA("A")){// check for adjective position
                const idx=this.getIndex("N");
                if (idx >= 0){
                    // unless specified the position of an English adjective is pre, but is post for a French one
                    const pos=e.props["pos"]||this.adj_def_pos(); 
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
    linkProperties(){
        let headIndex;
        if (this.elements.length==0)return this;
        switch (this.constType) {
        case "NP": // the head is the first internal N, number with a possible NO
            // find first NP or N
            headIndex=this.getHeadIndex("NP");
            // if the first N has a poss flag, try to find the next "non possessive" N
            if (this.elements[headIndex].isA("N") && this.elements[headIndex].props["poss"] === true){
                for (let i=headIndex+1;i<this.elements.length;i++){
                    if (this.elements[i].isA("N") && this.elements[i].props["poss"]===undefined){
                        headIndex=i;
                        break
                    }
                }
            }
            this.peng=this.elements[headIndex].peng;
            for (let i = 0; i < this.elements.length; i++) {
                if (i!=headIndex){
                    const e=this.elements[i];
                    if (this.peng){ // do not try to modify if current peng does not exist e.g. Q
                        if (e.isA("NO") && i<headIndex){ // NO must appear before the N for agreement
                            this.peng["n"]=e.grammaticalNumber();
                            // gender agreement between a French number and subject
                            e.peng["g"]=this.peng["g"]; 
                        } else if (e.isA("D","A","V")){
                            this.link_DAV_properties(e)
                        } else if (e.isA("CP")){ // check for a coordination of adjectives or number
                            const me=this;
                            e.peng = me.peng
                            e.elements.forEach(function(e){
                                if (e.isA("A","NO")) // 
                                    e.peng=me.peng
                            })
                        } else if (e.isA("AP","AdvP")){ // propagate N through AP and AdvP
                            for (let e1 of e.elements){
                                this.link_DAV_properties(e1)
                            }
                        }
                    }
                }
            }
            //   set agreement between the subject of a subordinate or the object of a subordinate
            const pro=this.getFromPath([["S","SP"],"Pro"]);
            if (pro!==undefined){
                const v=pro.parentConst.getFromPath(["VP","V"]);
                if (v !=undefined)
                    this.link_subj_obj_subordinate(pro,v,pro.parentConst.subject)
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
            this.subject = null
            if (iSubj>=0){
                let subject=this.elements[iSubj];
                if (this.isA("SP") && subject.isA("Pro")){
                    if (this.should_try_another_subject(subject.lemma,iSubj)){
                        // HACK: the first pronoun  should not be a subject...
                        //        so we try to find another...
                        const jSubj=this.elements.slice(iSubj+1).findIndex(
                            e => e.isA("NP","N","CP","Pro")
                        );
                        if (jSubj>=0){
                            subject=this.elements[iSubj+1+jSubj];
                            this.subject = subject
                        } else {
                            // finally this generates too many spurious messages
                            // this.warning("no possible subject found");
                            return this;
                        }
                    } else
                        this.subject=subject
                }
                this.peng=subject.peng;
                const vpv=this.linkPengWithSubject("VP","V",subject)
                if (vpv !== undefined){
                    this.taux=vpv.taux;
                    this.linkAttributes(vpv,this.getFromPath([["VP"],["CP"]]),subject)
                } else {
                    // check for a coordination of verbs that share the subject
                    const cvs=this.getFromPath(["CP","VP"]);
                    if (cvs !==undefined){
                        this.getConst("CP").elements.forEach(function(e){
                            if (e instanceof Phrase) // skip possible C
                                e.linkPengWithSubject("VP","V",subject)
                        })
                    }
                    this.check_coordinated_object()
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
        let g;
        let n;
        let pe=3;
        let nb=0;
        for (let i = 0; i < this.elements.length; i++) {
            const e=this.elements[i];
            if (e.isA("NP","N","Pro","Q","NO")){
                nb+=1;
                const propG=e.getProp("g");
                if (g===undefined && propG !== undefined) g= propG;
                if (propG=="m")g="m"; // masculine if one is encountered
                if (e.getProp("n")=="p")n="p";
                const propPe=e.getProp("pe");
                if (propPe !== undefined && propPe<pe)pe=propPe;
            }
        }
        if (nb>1 && andCombination)n="p";  
        return {"g":g,"n":n,"pe":pe}
    }

    /**
     * Pronominalization of children  
     * check if this is applicable for the language of the element
     * this must be done in the context of the parent, because some elements might be changed
     * @param {Constituent} e element to pronominalize
     */
    pronominalizeChildren(){
        for (let e of this.elements) {
            if (e.props["pro"]===true && !e.isA("Pro")){// it can happen that a Pro has property "pro" set within the same expression
                e.pronominalize()
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
                        subject = this.passive_pronoun_subject(subject)
                    }
                } else {
                    subject=null;
                }
            } else {
                return this.warn("not found","VP",this.passive_context())
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
                } else if (obj.isA("NP") && obj.props["pro"]===true){
                    obj=obj.getTonicPro("nom");
                }
                // swap subject and obj
                newSubject=obj;
                this.addElement(newSubject,0);// add object that will become the subject
                // make the verb agrees with the new subject (in English only, French is dealt below)
                if (this.passive_should_link_subject())
                    this.linkPengWithSubject("VP","V",newSubject);
                if (subject!=null){   // insert subject where the object was
                    let prep = this.passive_prep(subject.isA("S"))
                    vp.addElement(PP(P(prep,this.lang),subject),objIdx);
                }
            } else if (subject !=null){ // no object, but with a subject
                //create a dummy subject with a "il"/"it" 
                newSubject=Pro(this.passive_dummy_subject(),this.lang).c("nom");
                // add new subject at the front of the sentence
                this.addElement(newSubject,0);
                this.linkPengWithSubject("VP","V",newSubject);
                vp.peng=newSubject.peng
                // add original subject after the verb to serve as an object
                let vpIdx=vp.getIndex("V");
                let pos;
                let prep = this.passive_prep(subject.isA("S"))
                if (subject.isA("S")){  // take for granted that the S is a VP
                    pos = undefined;
                } else {
                    pos= vpIdx+1
                }
                vp.addElement(PP(P(prep,this.lang),subject),pos);
            }
            this.passive_agree_auxiliary(vp,newSubject)
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
            this.move_object(int);
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
                if (idx!==undefined)
                    cmp=obj[0].parentConst.removeElement(idx)
                [cmp,pp] = this.passive_subject_par(cmp,pp)
                if (this.passive_human_object(cmp,pp)){ // human direct object
                    prefix="whom";
                } else
                    prefix=intPrefix[int];
                this.move_object(int);
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
                        const preps=this.prepositionsList();
                        if (int=="whe"){
                            if (preps["whe"].has(prep))
                                ppElems[0].parentConst.removeElement(idx);
                        } else if (int=="whn"){
                            if (preps["whn"].has(prep))
                                ppElems[0].parentConst.removeElement(idx);
                        } else if (preps["all"].has(prep)){ // "woi" | "wai"
                            prefix = prep + " " + this.interrogative_pronoun_woi(int)
                            ppElems[0].parentConst.removeElement(idx);
                        }
                    }
                }
                this.move_object(int)
            }
            break;
        case "tag":
            if (this.isA("S","SP","VP")){
                this.tag_question(types)
                prefix=intPrefix[int];
            }
            break;
        default:
            this.warn("not implemented","int:"+int)
        }
        if (this.should_add_interrogative_prefix(int)){
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
        this.processTyp_verb(types)
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
     * Special case of realisation of a cp for which the gender and number must be computed
     * at realization time
     */
    cpReal(){
        var res=[];
        // realize coordinated Phrase by adding ',' between all elements except for the last
        // if no C is found then all elements are separated by a ","
        // TODO: deal with the Oxford comma (i.e. a comma after all elements even the last)
        //       although it can be "patched" using C("and").b(",") but this adds a spurious space before the comma
        let idxC=this.getIndex("C");
        //  if no coord was found and the first is a Q, consider this as the string to put before the last realization
        if (idxC<0 && this.elements[0].isA("Q"))idxC=0
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
            var and=this.and_conj();
            var gn=this.findGenderNumberPerson(c.lemma==and);
            if (gn.g !==undefined) this.setProp("g",gn.g);
            if (gn.n !==undefined) this.setProp("n",gn.n);
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
            return this.cpReal()
        } else {
            this.pronominalizeChildren();
            const typs=this.props["typ"];
            if (typs!==undefined)this.processTyp(typs);
            const es=this.elements;
            // realize CPs before the rest because it can change gender and number of subject
            // save their realization
            let cpsReal = []
            for (let e of es){
                if(e.isA("CP"))
                    cpsReal.push(e.cpReal())
            }
            for (let e of es){
                var r;
                if (e.isA("CP")){
                    r=cpsReal.shift() // recover previous realization
                } else if (e.isA("VP") && reorderVPcomplements){
                    r=e.vpReal();
                } else {
                    r=e.real()
                }
                // we must flatten the lists
                Array.prototype.push.apply(res,r)
            }
            if (this.isA("VP") && res.length>1)
                this.checkAdverbPos(res)
        }
        return this.doFormat(res);
    };

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
        // add the options by calling super.toSource()
        res+=super.toSource()
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
        let [newIndent,sep]=this.indentSep(indent,true);
        // create debug of children
        let res=this.constType;
        if (this.peng !== undefined){
            if (this.peng.pengNO !== undefined) res += "#"+this.peng.pengNO;
            if (this.taux && this.taux.tauxNO !== undefined) res += "-"+this.taux.tauxNO;
        } 
        res += "("+this.elements.map(e => e.toDebug(newIndent)).join(sep)+")";
        // add the options by calling super.toSource()
        res+=super.toSource()
        return res;
    }        
}

