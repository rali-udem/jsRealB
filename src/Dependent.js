/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
 */
    
import {Constituent} from "./Constituent.js";
import {Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./Terminal.js" 
import {Phrase} from "./Phrase.js"
import {getElems, affixHopping, doFrenchPronounPlacement,checkAdverbPos} from "./NonTerminal.js";
import {getLanguage,getRules,copulesFR,prepositionsList } from "./Lexicon.js";
export {Dependent}
/**
 * Dependent a subclass of Constituent for creating non terminals in Dependency notation
 */
class Dependent extends Constituent {// Dependent (non-terminal)
    /**
     * Build a new Dependent
     * @param {Constituent[]} params first is Terminal, others are Dependent
     * @param {string} deprel kind of this Dependent
     * @param {"en"|"fr"} lang  optional: specify language for this Dependent otherwise use current language 
     */
    constructor(params,deprel,lang){ // lang parameter used calls in IO-json.js
        super(deprel); 
        this.lang = lang || getLanguage();
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
        params=getElems(params) // getElems is defined in Phrase to remove "null" and flatten lists
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
                    this.warn("bad Dependent",NO(i+2).dOpt({ord:true}).realize(),d.constructor.name+":"+JSON.stringify(d))
                }
            }
            // terminate the list with add which does other checks on the final list
            this.add(params[last],undefined,true)
        }
    }


    /**
     * Add a Dependent as a child of this Dependent
     * @param {Dependent} elem Consittuent to add
     * @param {int?} position position in the children to add this element, at the end if not specified 
     * @returns this Phrase
     */
    addDependent(dependent,position){
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
            this.warn("bad Dependent",NO(position+1).dOpt({ord:true}).realize(),dependent.constructor.name)
        }
        return this
    }

    /**
     * Remove a child of this Dependent 
     * @param {int} position index of child to remove
     * @returns the remove child 
     */
    removeDependent(position){
        if (typeof position == "number" && position<this.dependents.length && position>=0){
            const elem=this.dependents.splice(position,1)[0];
            elem.parentConst=null
            return elem
        }
        return this.warn("bad position",position,this.dependents.length)
    }

    /**
     * Change the name of a Dependent or dependents under a coord 
     * @param {string} newDep new name for the current Dependent
     * @returns this Dependent
     */
    changeDeprel(newDep){
        if (this.isA("coord"))
            this.dependents.forEach((d)=>d.constType=newDep);
        else 
            this.constType=newDep;
        return this;
    }

    // find index of one of deprels taking into account possible coord starting from position from
    // returns -1 when not found
    /**
     * Find index of one of deprels satisfying test taking into account possible coord 
     * starting at position from (0 if not specified)
     * @param {function(Dependent):boolean} test  
     * @param {int} from starting index
     * @returns index in the dependents, -1 if not found
     */
    findIndex(test,from){
        from = from||0;
        for (let i=from;i<this.dependents.length;i++){
            const d=this.dependents[i];
            if (d.isA("coord") && d.dependents.length>0 && test(d.dependents[0])) return i;
            if (test(d)) return i;
        }
        return -1
    }

     /**
     * Add a new dependent and set agreement links
     * @param {Dependent} dependent  Dependent to add
     * @param {int} position position at whcih to add, if not given add at the end
     * @param {boolean} prog if specified then it is called by the constructor not the user so do not keep source info about this add
     * @returns this Dependent
     */
    add(dependent,position,prog){
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

    /**
     * Creates a string identifying this Phrase
     * @returns identification string
     */
    me(){
        let children=this.dependents.map(function(e){return e.me()});
        children.unshift(this.terminal.me())
        return this.constType+"("+children.join()+")";
    }

    /**
     * Traverse a dependent to change all peng having oldPenNO to the newPeng
     * This is useful for linking attributes in relatives in a top-down fashion
     * @param {*} oldDep  starting point of the change
     * @param {*} oldPengNO pengNO umber to change
     * @param {*} newPeng   new peng to update
     */
    setPengRecursive(oldDep,oldPengNO,newPeng){
        oldDep.peng=newPeng;
        // check if terminal and children of oldDep have the same oldPengNO and change it to the newPeng
        if (oldDep.terminal.peng && oldDep.terminal.peng.pengNO==oldPengNO)
            oldDep.terminal.peng=newPeng;
        for (let d of oldDep.dependents){
            this.setPengRecursive(d,oldPengNO,newPeng)
        }
    }

    /**
     * Ensures agreement between Constituents
     * Loops over children to set the peng and taux to their head or subject
     * so that once a value is changed this change will be propagated correctly...
     * @returns this Dependent
     */
    linkProperties(){
        if (this.dependents.length==0) return this;
        //  loop over children to set the peng and taux to their head or subject
        //  so that once a value is changed this change will be propagated correctly...
        const headTerm=this.terminal;
        if (this.isA("coord")){
            // must create this.peng already because it might be used in the current dependents (for adjectives, attributes...)
            // the information will be computed at realization time (see Dependent.prototype.coordReal)
            this.peng={
                pengNO:Constituent.pengNO++
            };
            headTerm.peng=this.peng;
        }
        for (const dep of this.dependents){
            const depTerm=dep.terminal;
            switch (dep.constType){
            case "subj":
                if (headTerm.isA("V")){
                    headTerm.peng=dep.peng;
                }
                break;
            case "det":
                if (depTerm.isA("D")){
                    depTerm.peng=this.peng;
                } else if (depTerm.isA("NO")){
                    depTerm.peng=headTerm.peng
                } else if (depTerm.isA("P") && depTerm.lemma=="de"){ // HACK: deal with specific case : det(P("de"),mod(D(...)))
                    if (dep.dependents.length==1 && dep.dependents[0].isA("mod") && 
                        dep.dependents[0].terminal.isA("D")){
                        dep.dependents[0].terminal.peng=this.peng;
                    }
                }
                break;
            case "mod":case "comp":
                if (depTerm.isA("A")){
                    if (this.peng !== undefined)
                        depTerm.peng=this.peng
                    // check for an attribute of a copula with an adjective
                    if (this.isFr() && copulesFR.includes(headTerm.lemma)){
                        const iSubj=this.findIndex(d0=>d0.isA("subj") && d0.terminal.isA("N","Pro"));
                        if (iSubj>=0){
                            depTerm.peng=this.dependents[iSubj].peng;
                        }
                    }
                } else if (depTerm.isA("V")){
                    //   set agreement between the subject of a subordinate or the object of a relative subordinate
                    const iRel=dep.findIndex(depI=>depI.isA("subj","comp","mod") && 
                            depI.terminal.isA("Pro") && ["qui","que","who","that"].includes(depI.terminal.lemma));
                    if (iRel>=0){
                        const rel=dep.dependents[iRel].constType;
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
                } else if (depTerm.isA("Pro") && ["qui","que","who","that"].includes(depTerm.lemma)){
                    // a relative linked to depTerm in which the new peng should be propagated
                    if (this.peng !== undefined)
                        depTerm.peng=this.peng
                    for (let depI of dep.dependents)
                        this.setPengRecursive(depI,depI.peng.pengNO,this.peng)
                    }
                break;
            case "root":
                // this.error("An internal root was found")
                break;
            case "coord":
                if (dep.dependents.length>0){
                    const firstDep=dep.dependents[0]
                    if (firstDep.isA("subj")){
                        headTerm.peng=dep.peng
                    } else if (firstDep.isA("det")){
                        dep.peng=headTerm.peng
                    } else if (firstDep.isA("mod","comp")&& firstDep.terminal.isA("V","A")){
                        // consider this as coordination of verb sharing a subject (the current root)
                        //  or a coordination of adjectives
                        dep.peng=headTerm.peng;
                        for (let depI of dep.dependents){
                            depI.peng=headTerm.peng;
                            depI.terminal.peng=headTerm.peng;
                        }
                    }
                }
                break;
            default :
                this.error("Strange dependent:"+dep.constType)
            }
        }
    }

    /**
     * Provide a more informative error message for a situation that should never have occurred
     * @param {string} lemma 
     * @param {string} terminalType 
     * @returns raises an exception
     */
    setLemma(lemma,terminalType){
        this.error("***: should never happen: setLemma: called on a Dependent");
        return this;
    }

    /**
     * Find the gender, number and Person of (N,Pro,Q) of this Dependent terminal
     *   set masculine if at least one (N,Pro,Q) is masculine
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
        for (let i = 0; i < this.dependents.length; i++) {
            const e=this.dependents[i].terminal;
            if (e.isA("N","Pro","Q","NO")){
                nb+=1;
                const propG=e.getProp("g");
                if (g === undefined && propG !== undefined) g = propG;
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
     * Pronominalization in French
     * Phrase structure modification but that must be called in the context of the parentConst
     * because the pronoun depends on the role of the NP in the sentence 
     *         and its position can also change relatively to the verb
     * @returns a Pro corresponding to the current NP
     */
    pronominalize_fr(){
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

    /**
     * Pronominalization in English only applies to a NP (this is checked before the call)
     *  and does not need reorganisation of the sentence 
     *  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
     * @returns a Pro corresponding to the current NP
     */
    pronominalize_en(){
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

    /**
     * Pronominalization of children  
     * check if this is applicable for the language of the element
     * this must be done in the context of the parent, because some elements might be changed
     * @param {Constituent} e element to pronominalize
     */
    pronominalizeChildren(){
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

    /**
     * Modify the sentence structure to create a passive sentence
     */
    passivate(){
        let subj,obj;  // original subject and object, they are swapped below...
        // find the subject
        if (this.terminal.isA("V")){
            const subjIdx=this.findIndex((d)=>d.isA("subj"));
            if (subjIdx>=0){
                subj=this.dependents[subjIdx];
                if (subj.terminal.isA("Pro")){
                    subj.terminal = subj.terminal.getTonicPro()
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
                    let prep = this.isFr() ? "par" : "by";
                    if (subj.terminal.isA("V")) // subject is a V
                        prep = this.isFr() ? "de" : "to"
                    this.addDependent(comp(P(prep,this.lang),subj))
                }
            } else if (subj!=null){ // no object, but with a subject
                // create a dummy subject with a "il"/"it" 
                obj=Pro(this.isFr()?"lui":"it",this.lang).c("nom"); //HACK: obj is the new subject
                // add new subject at the front of the sentence
                subj.changeDeprel("mod")
                this.removeDependent(subjIdx)
                this.addPre(obj)
                this.peng=obj.peng
                // add original subject after the verb to serve as an object
                let prep = this.isFr() ? "par" : "by";
                if (subj.terminal.isA("V")) // subject is a V
                    prep = this.isFr() ? "de" : "to"
                this.addDependent(comp(P(prep,this.lang),subj))
            }
            if (this.isFr()){
                // do this only for French because in English this is done by processTyp_en
                // change verbe into an "être" auxiliary and make it agree with the newSubj
                // force person to be 3rd (number and tense will come from the new subject)
                const verbe=this.terminal.lemma;
                this.terminal.setLemma(verbe == "être" ? "avoir" : "être");
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
                let compIdx=this.findIndex(d=>d.isA("comp","mod"));
                if (compIdx==-1)compIdx=0;
                this.addDependent(new Dependent([pp],"*post*"),compIdx)
            }
        } else {
            return this.warn("not found","V",isFr()?"contexte passif":"passive context")
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
    processV(types,key,action){
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

     /**
     * Add a *pre* special dependencies for a list of terminal or a single terminal
     * This used only during realizatioon
     * @param {*} terminals a Terminal or a list of terminals
     * @param {*} position  position in which to insert the new dependency
     * @returns this Dependent
     */
    addPre(terminals,position){
        if (terminals instanceof Terminal)terminals=[terminals];
        for (let terminal of terminals){
            this.addDependent(new Dependent([terminal],"*pre*"),position)
        }
        return this;
    }

     /**
     * Add a *post* special dependencies for a list of terminal or a single terminal
     * This used only during realizatioon
     * @param {*} terminals a Terminal or a list of terminals
     * @param {*} position  position in which to insert the new dependency
     * @returns this Dependent
     */
     addPost(terminals){
        if (terminals instanceof Terminal)terminals=[terminals];
        for (let terminal of terminals.reverse()){ // must add them in reverse order because of position 0
            this.addDependent(new Dependent([terminal],"*post*"),0);
        }
        return this;
    }

    /**
     * French phrase modification for .prog, .mod, .neg 
     * @param {Object} types typ options for this Phrase
     */
    processTyp_fr(types){
        this.processV(types,"prog",function(deprel,v){
            // insert "en train","de" (separate so that élision can be done...) 
            // TODO::but do it BEFORE the pronouns created by .pro()
            const origLemma=deprel.terminal.lemma
            deprel.terminal.setLemma("être"); // change verb, but keep person, number and tense properties of the original...
            deprel.addPost([Q("en train"),Q("de"),V(origLemma).t("b")])
            deprel.terminal.isProg=v;
        })
        this.processV(types,"mod",(deprel,mod)=>{ // define an arrow function to keep the original this
            let rules=getRules(this.lang);
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

    /**
     * English phrase modification (mostly performed by affixHopping)
     * This might modify the current list of elements
     * @param {Object} types typ options for this Phrase
     */
    processTyp_en(types){
        // replace current verb with the list new words
        //  TODO: take into account the fact that there might be already a verb with modals...
        if (types["contr"]!==undefined && types["contr"]!==false){
            // necessary because we want the negation to be contracted within the VP before the S or SP
            this.contraction=true;
        }
        const words=affixHopping(this.terminal,this.getProp("t"),getRules(this.lang).compound,types);
        // the new root should be the last verb 
        let last=words.pop();
        if (last.isA("Pro") && last.lemma=="myself"){ // skip possible "myself" for reflexive verb
            this.addPost(last);
            last=words.pop()
        }
        this.terminal=last;
        this.addPre(words)
    }

    /**
     * in English move the auxiliary to the front 
     */
    moveAuxToFront(){
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
        } else if (this.dependents.length==0) { // add "do" when only the terminal is left...
            this.addDependent(comp(V("do").pe(3).t("p")))
        }
    }

    /**
     * in French : use an inversion rule which is quite "delicate"
     * rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
     * if subject is a pronoun, invert and add "-t-" or "-"
     * if subject is a noun, the subject stays but add a new pronoun
     */
    invertSubject(){
        // in French : use inversion rule which is quite "delicate"
        // rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
        // if subject is a pronoun, invert and add "-t-" or "-"
        //       except for first person singular ("je") which is most often non colloquial (e.g. aime-je or prends-je)
        // if subject is a noun, the subject stays but add a new pronoun
        let subjIdx=this.findIndex((d)=>d.isA("subj"));
        if (subjIdx>=0){
            const subject=this.dependents[subjIdx].terminal;
            let pro;
            if (subject.isA("Pro")){
                if (subject.getProp("pe")==1 && subject.getProp("n")=="s"){ // add "est-ce que" at the start
                    this.add(det(Q("est-ce que")),0);
                    return;
                }
                pro=this.removeDependent(subjIdx).terminal; //remove subject
            } else if (subject.isA("C")){
                pro=Pro("moi","fr").c("nom").g("m").n("p").pe(3); // create a "standard" pronoun, to be patched by cpReal
                subject.pronoun=pro;  // add a flag to be processed by cpReal
            } else
                pro=Pro("moi","fr").g(subject.getProp("g")).n(subject.getProp("n")).pe(3).c("nom"); // create a pronoun
            if (this.terminal.isA("V")){
                this.addPost(pro);
                this.terminal.lier()
            }
        }
    }

    /**
     * Process options for interrogative for both French and English
     * @param {Object} types typ options for this Phrase
     * HACK: in some cases, the start of the search for the first dependent to "remove" 
     *       is set by the local "hidden" attribute: this.searchStart currently used by 
     *       variationsFromText
     */
    processTypInt(types){
        const int=types["int"]
        const sentenceTypeInt=getRules(this.lang).sentence_type.int
        const intPrefix=sentenceTypeInt.prefix;
        let prefix,pp; // to be filled later
        let searchStart = this.searchStart;
        if (searchStart===undefined) searchStart=0;
        switch (int) {
        case "yon": case "how": case "why": case "muc": 
            if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
            prefix=intPrefix[int];
            break;
        // remove a part of the sentence 
        case "wos": case "was":// remove subject 
            let subjIdx=this.findIndex((d)=>d.isA("subj"),searchStart)
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
            for (let i=searchStart;i<this.dependents.length;i++){
                const d=this.dependents[i];
                if (d.isA("comp") && d.terminal.isA("N")){
                    // check if that there are no preposition within its dependents
                    const pIdx=d.findIndex((d)=>d.terminal.isA("P") && d.getProp("pos")=="pre");
                    if (pIdx<0){
                        cmp=this.removeDependent(i)
                        break;
                    } 
                // } else { // remove other type of complement
                //     cmp=this.removeDependent(i)
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
            for (let i=searchStart;i<this.dependents.length;i++){
                const d=this.dependents[i];
                let prep;
                if (d.terminal.isA("P")){ // preposition is the head
                    prep=d.terminal.lemma;
                } else { // a preposition occurs as a dependent and occurs at the start
                    const pIdx=d.findIndex((d)=>d.terminal.isA("P") && d.getProp("pos")=="pre");
                    if (pIdx>=0) prep=d.dependents[pIdx].terminal.lemma;
                }
                if (d.isA("comp","mod") && prep!==undefined){
                    // try to find a more appropriate prefix by looking at preposition in the structure
                    const preps=prepositionsList[this.lang];
                    if (int=="whe" && preps["whe"].has(prep)){
                        remove=true
                    } else if (int=="whn" && preps["whn"].has(prep)){
                        remove=true
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
                // check for negative adverbs...
                const advIdx=this.findIndex((d)=>d.isA("mod") && d.terminal.isA("Adv"));
                if (advIdx>=0 && ["hardly","scarcely","never","seldom"].includes(this.dependents[advIdx].terminal.lemma)){
                    neg=true
                }
                let subjIdx=this.findIndex((d)=>d.isA("subj"))
                if (subjIdx>=0){
                    const subject=this.dependents[subjIdx].terminal;
                    if (subject.isA("Pro")){
                        if (subject.getProp("pe")==1 && aux=="be" && t=="p" && !neg){
                            // very special case : I am => aren't I
                            pe=2
                        } else if (["this","that","nothing"].includes(subject.lemma)){
                            pro=Pro("I").g("n") // it
                        } else if (["somebody","anybody","nobody","everybody",
                                    "someone","anyone","everyone"].includes(subject.lemma)){
                            pro=Pro("I").n("p"); // they
                            if (subject.lemma=="nobody")neg=true;                     
                        } else 
                            pro=subject.clone();
                        pro=subj(pro).pos("post")
                    } else if (subject.isA("N")){
                        pro=this.dependents[subjIdx].clone().pro().pos("post")
                        pro.g(subject.getProp("g")).n(subject.getProp("n")) // ensure proper number and gender
                    } else {
                        pro=subj(Pro("it").c("nom")).pos("post")
                    }
                } else { // no subject, but check if the verb is imperative
                    if (t == "ip"){
                        if (aux == "do") aux = "will" // change aux when the aux is default
                        pro = Pro("I").pe(2).n(n).g(g)
                    } else 
                        pro = Pro("it").c("nom")
                    pro = subj(pro).pos("post")
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

    /**
     * Modify sentence structure according to the content of the "typ" property
     * @param {Object} types typ options for this Phrase
     */
    processTyp(types){
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
            this.a(getRules(this.lang).sentence_type.exc.punctuation,true);
        }
        return this;   
    }

    /**
     * Special case of realisation of a coord for which the gender and number must be computed
     * at realization time
     */
    coordReal(){
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
        // except if a dependent is another coord 
        const deprel=this.dependents[0].constType;
        const noConnect = this.terminal.lemma=="";
        for (let j = 0; j < last; j++) { //insert comma after each element
            const dj=this.dependents[j];
            if (noConnect || j<last-1){ // except the last if there is conjunction
                if (dj.props["a"] === undefined || !dj.props["a"].includes(","))
                    dj.props["a"]=[","];
            }
            if (dj.isA("coord")){
                res.push(...dj.coordReal());
            } else if (!dj.isA(deprel) && deprel != "coord"){
                this.warn("inconsistent dependents within a coord",deprel,dj.constType)
            } else
                res.push(...dj.real())
        }
        // insert realisation of the terminal before last...
        res.push(...this.terminal.real());
        const lastD = this.dependents[last]
        if (lastD.isA("coord")){
            res.push(...lastD.coordReal());
            return this.doFormat(res);
        } else if (!lastD.isA(deprel)  && deprel != "coord"){
            this.warn("inconsistent dependents within a coord",deprel,lastD.constType)
        }    
        // insert last element
        res.push(...lastD.real());
        // compute the combined gender and number of the coordination once children have been realized
        // CAUTION: gender and person might not be correct in the case of embedded coord
        const thisCoord=this.terminal;
        if (thisCoord.isA("C")){
            var and=this.isFr()?"et":"and";
            var gn=this.findGenderNumberPerson(thisCoord.lemma==and);
            if (gn.g !==undefined) this.setProp("g",gn.g);
            if (gn.n !==undefined) this.setProp("n",gn.n);
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
        return this.doFormat(res);
    }

    /**
     * Check where this dependent shoould go relative to its parent
     * @returns "pre" | "pos"
     */
    depPosition(){
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

    /**
     * Change order of pronouns in French (quite intricate)
     * Instance method that calls a common method for both Phrase and Dependent
     * called by doFormat in Constituent.js
     * HACK: call local to get around import circularity
     * @param {Terminal[]} clist list of terminals which can be reorganized
     */
    doFrenchPronounPlacement(clist){
        return doFrenchPronounPlacement(clist); // call function in NonTerminal.js
    }
    
    /**
     * Sets the realization field of its elements
     * @returns a list of Terminals with their realization fields set
     */
    real() {
        let res;
        if (this.isA("coord") && this.parentConst==null){
            // special case of coord at the root
            res=this.coordReal();
        } else {
            this.pronominalizeChildren();
            const typs=this.props["typ"];
            if (typs!==undefined)this.processTyp(typs);
            const ds=this.dependents;

            // move all "pre" dependents at the front 
            // HACK: we must move these in place because realization might remove some of them 
            let nextPre=0
            for (let i=0;i<ds.length;i++){
                const d=ds[i]
                if (d.depPosition()=="pre"){
                    if (nextPre != i)
                        ds.splice(nextPre,0,ds.splice(i,1)[0]);
                    nextPre++;
                }
            }
            // realize dependents
            if (ds.length==0){  // no dependent
                res = this.terminal.real()
            } else if (nextPre==0) { // no pre
                res = this.terminal.real();
                for (let d of ds)
                    res.push(...(d.isA("coord") ? d.coordReal() : d.real()))
            } else {  // both pre and post
                res = []
                for (let i=0;i<ds.length;i++){
                    const d=ds[i];
                    res.push(...(d.isA("coord") ? d.coordReal() : d.real()))
                    if (i==nextPre-1)
                        res.push(...this.terminal.real())
                }
            }
            if (this.terminal.isA("V"))
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
        let depsSource=this.dependentsSource.map(e => e.toSource(newIndent))
        depsSource.unshift(this.terminal.toSource())
        // create source of children
        let res=this.constType+"("+depsSource.join(sep)+")";
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
        let [newIndent,sep]=this.indentSep(indent,true);
        // create debug of children
        let depsDebug=this.dependents.map(e => e.toDebug(newIndent));
        depsDebug.unshift(this.terminal.toDebug());
        let res=this.constType;
        if (this.peng !== undefined){
            if (this.peng.pengNO !== undefined) res += "#"+this.peng.pengNO;
            if (this.taux && this.taux.tauxNO !== undefined) res += "-"+this.taux.tauxNO;
        } 
        res += "("+depsDebug.join(sep)+")";
        // add the options by calling "super".toSource()
        res+=Constituent.prototype.toDebug.call(this); // ~ super.toSource()
        return res;
    }
}

/**
 * Creates a root
 * @param {...Constituent} _ a Terminal possibly followed by Dependents
 * @returns Dependent with root as constType
 */
 export function root(_){ return new Dependent(Array.from(arguments),"root"); };
 /**
  * Creates a subj
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with subj as constType
  */
 export function subj(_){ return new Dependent(Array.from(arguments),"subj"); }
 /**
  * Creates a det
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with det as constType
  */
  export function det(_) { return new Dependent(Array.from(arguments),"det"); }
 /**
  * Creates a mod
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with mod as constType
  */
  export function mod(_) { return new Dependent(Array.from(arguments),"mod"); }
 /**
  * Creates a comp
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with comp as constType
  */
  export function comp(_){ return new Dependent(Array.from(arguments),"comp"); }
 /**
  * Creates a coord
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with coord as constType
  */
  export function coord(_){ return new Dependent(Array.from(arguments),"coord"); }


//// create a Dependent version of Constituent expression
/**
 * Create a dependent version of a Phrase 
 *  (undocumented feature with many HACKS, mainly used for testing)
 * CAUTION: this function is on the Phrase prototype, but defined here to avoid circular import
 * @param {string} depName kind of Dependent to create
 * @returns a Dependent
 */
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

/**
 * Create a dependent version of a Terminal 
 *  (undocumented feature with many HACKS, mainly used for testing)
 * CAUTION: this function is on the Terminal prototype, but defined here to avoid circular import
 * @param {string} depName kind of Dependent to create
 * @returns a Dependent
 */
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

