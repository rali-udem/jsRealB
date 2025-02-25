/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
 */
    
import { Constituent } from "./Constituent.js";
import { Terminal } from "./Terminal.js";
import { getElems,Pro,P,NO,Q,dependent,det,comp } from "./jsRealB.js" 
import { Phrase } from "./Phrase.js"
import { getLanguage,getRules } from "./Lexicon.js";

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
     * Returns the current number of dependents
     * @returns number of constituents
     */
    nbConstituents(){
        return this.dependents.length
    }
    
    /**
     * Returns the current list of dependents
     * @returns the list of constituents
     */
    constituents(){
        return this.dependents
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
            return this.warn("bad Dependent",this.word_last(),dependent.constructor.name)
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
     * Remove a child at a given position and remove the corresponding position in sourceElement
     * or in the optSource
     * @param {*} position index of child to remove
     * @returns this
     */
    remove(position){
        let dep = this.removeDependent(position)
        if (dep !== this){
            let src = dep.toSource().replace(/\(/g,"\\(").replace(/\)/g,"\\)")
            let srcRE =  new RegExp("\\.add\\("+src+"(,\\d+)?\\)")
            if (srcRE.test(this.optSource)){ // was it added whith add ?
                this.optSource=this.optSource.replace(srcRE,"");
            } else {
                this.dependentsSource.splice(position,1);
            }
            return this
        }
        return this
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
                    this.check_determiner_cnt(depTerm);
                } else if (depTerm.isA("NO")){
                    depTerm.peng=headTerm.peng
                    depTerm.peng["n"]=depTerm.grammaticalNumber();
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

                    this.link_attributes(depTerm,headTerm)
                } else if (depTerm.isA("V")){
                    //   set agreement between the subject of a subordinate or the object of a relative subordinate
                    const iRel=dep.findIndex(depI=>depI.isA("subj","comp","mod") && 
                            depI.terminal.isA("Pro") && this.relative_pronouns().includes(depI.terminal.lemma));
                    if (iRel>=0){
                        const rel=dep.dependents[iRel].constType;
                        if (rel=="subj")// verb agrees with this subject
                            depTerm.peng=this.peng;
                        this.link_pp_before(dep,headTerm)
                    }
                    this.link_pp_with_head(depTerm)
                } else if (depTerm.isA("Pro") && 
                            this.relative_pronouns_propagate().includes(depTerm.lemma)){
                    // a relative linked to depTerm in which the new peng should be propagated
                    if (this.peng !== undefined){
                        depTerm.peng=this.peng
                    }
                    for (let depI of dep.dependents)
                        if (depI.peng!==undefined)
                            this.setPengRecursive(depI,depI.peng.pengNO,this.peng)
                    }
                break;
            case "root":
                // this.error("An internal root was found")
                break;
            case "coord":
                let firstDep=null;
                for (let d of dep.dependents){
                    if (!d.isA("C")){
                        firstDep=d;
                        break;
                    }
                }
                if (firstDep !== null){
                    if (firstDep.isA("subj")){
                        dep.peng = this.peng;
                    } else if (firstDep.isA("det")){
                        dep.peng=headTerm.peng;
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
            case "*pre*":case "*post*":
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
     * Pronominalization of children  
     * check if this is applicable for the language of the element
     * this must be done in the context of the parent, because some elements might be changed
     * @param {Constituent} e element to pronominalize
     */
    pronominalizeChildren(){
        for (let d of this.dependents){
            if (d.props["pro"]===true && !d.terminal.isA("Pro"))// it can happen that a Pro has property "pro" set within the same expression
                d.pronominalize()
        }
    }

    /**
     * Modify the sentence structure to create a passive sentence
     */
    passivate(){
        let subj,obj,prep;  // original subject and object, they are swapped below...
        // find the subject
        if (this.terminal.isA("V")){
            const subjIdx=this.findIndex((d)=>d.isA("subj"));
            if (subjIdx>=0){
                subj=this.dependents[subjIdx];
                let subject=subj.terminal;
                if (subject.isA("Pro")){
                    subject = this.passive_pronoun_subject(subject)
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
                } else if (obj.terminal.isA("N") && obj.props["pro"]===true){
                    obj=obj.getTonicPro("nom")
                }
                // swap subject and object by changing their relation name !!!
                // HACK: obj is the new subject
                obj.changeDeprel("subj")

                if (this.passive_should_link_subject())
                    this.terminal.peng = obj.peng
                if (subj!=null){   // the original subject is now the indirect object
                    subj.changeDeprel("mod")
                    this.removeDependent(subjIdx);
                    prep = this.passive_prep(subj.terminal.isA("V"))
                    this.addDependent(comp(P(prep,this.lang),subj))
                }
            } else if (subj!=null){ // no object, but with a subject
                // create a dummy subject with a "il"/"it" 
                obj=Pro(this.passive_dummy_subject(),this.lang).c("nom"); //HACK: obj is the new subject
                // add new subject at the front of the sentence
                subj.changeDeprel("mod")
                this.removeDependent(subjIdx)
                this.addPre(obj)
                this.peng=obj.peng
                prep = this.passive_prep(subj.terminal.isA("V"))
                this.addDependent(comp(P(prep,this.lang),subj))
            }
            this.passive_agree_with_auxiliary(obj)
        } else {
            return this.warn("not found","V",this.passive_context())
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
            this.addDependent(dependent("*pre*",[terminal]),position)
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
            this.addDependent(dependent("*post*",[terminal]),0)
        }
        return this;
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
            this.move_object(int)
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
                if (d.isA("comp") && d.terminal.isA("N","Pro")){
                    // check if that there are no preposition within its dependents
                    const pIdx=d.findIndex((d)=>d.terminal.isA("P") && d.getProp("pos")=="pre");
                    if (pIdx<0){
                        cmp=this.removeDependent(i)
                        break;
                    } 
                }
            }
            pp=this.check_passive_subject_with_par()
            if (this.passive_human_object(int,cmp)){
                prefix="whom";
            } else
                prefix=intPrefix[int];
            this.move_object(int)
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
                    const preps = this.preposition_list()
                    if (int=="whe" && preps["whe"].has(prep)){
                        remove=true
                    } else if (int=="whn" && preps["whn"].has(prep)){
                        remove=true
                    } else if (preps["all"].has(prep)){ // "woi" | "wai"
                        prefix = prep + " " + this.interrogative_pronoun_woi(int_)
                        remove=true
                    }
                    if (remove) {
                        this.removeDependent(i)
                        break;
                    }
                }
            }
            this.move_object(int)
            break;
        case "tag":
            this.tag_question(types);
            prefix=intPrefix[int];
            break;
        default:
            this.warn("not implemented","int:"+int)
        }
        if (this.should_add_interrogative_prefix(int))
            this.addPre(Q(prefix),0)
        if (pp !== undefined) {// add "par" in front of some French passive interrogative
            this.addPre(pp,0)
            if (int=="wad") // replace "que" by "quoi" for French passive wad
                this.dependents[1].terminal.lemma="quoi";
        }     
        this.a(sentenceTypeInt.punctuation,true);
    }

    /**
     * Modify sentence structure according to the content of the "typ" property
     * @param {Object} types typ options for this Phrase
     */
    processTyp(types){
        if (types["pas"]!==undefined && types["pas"]!== false){
            this.passivate()
        }
        this.processTyp_verb(types)
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
        //    Q(", and") deal with the Oxford comma (i.e. a comma after all elements even the last)
        //    but this adds a spurious space before the comma
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
            // var and=this.isFr()?"et":"and";
            const and = this.and_conj()
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
            pos = this.terminal.props["pos"] || this.adj_def_pos()
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
            // realize coords before the rest because it can change gender and number of subject
            // save their realization
            let coordReals = []
            for (let d of ds){
                if(d.isA("coord"))
                    coordReals.push(d.coordReal())
            }
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
                    res.push(...(d.isA("coord") ? coordReals.shift() : d.real()))
            } else {  // both pre and post
                res = []
                for (let i=0;i<ds.length;i++){
                    const d=ds[i];
                    res.push(...(d.isA("coord") ? coordReals.shift() : d.real()))
                    if (i==nextPre-1)
                        res.push(...this.terminal.real())
                }
            }
            if (this.terminal.isA("V"))
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
        let depsSource=this.dependentsSource.map(e => e.toSource(newIndent))
        depsSource.unshift(this.terminal.toSource())
        // create source of children
        let res=this.constType+"("+depsSource.join(sep)+")";
        // add the options 
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
        let depsDebug=this.dependents.map(e => e.toDebug(newIndent));
        depsDebug.unshift(this.terminal.toDebug());
        let res=this.constType + this.getPengTauxStr();
        res += "("+depsDebug.join(sep)+")";
        // add the options 
        res+=super.toDebug()
        return res;
    }
}

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
        let idx=me.getHeadIndex(phName);
        // if the first N has a poss flag, try to find the next "non possessive" N
        if (phName=="NP" && me.elements[idx].isA("N") && me.elements[idx].props["poss"] === true){
            for (let i=idx+1;i<me.elements.length;i++){
                if (me.elements[i].isA("N") && me.elements[i].props["poss"]===undefined){
                    idx=i;
                    break
                }
            }
        }
        if (me.elements[idx].isA(termName)){
            deprel = dependent(depName,[me.elements[idx]])
            me.elements.forEach(function(e,i){
                if (i!=idx){
                    const dep=e.toDependent(phName=="VP"?"comp":"mod")
                    deprel.add(setPos(i,idx,dep),undefined,true)
                }
            })
            deprel.props = me.props
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
            deprel = dependent("coord",[this.elements[idxC]])
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
            deprel = dependent(depName,[Q("")])
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
    Object.assign(deprel.props,this.props)
    deprel.optSource+=removeAddOption(this.optSource)
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
        deprel = dependent(depName||"root",[this])
    }
    if (isTopLevel)deprel.cap(false);
    return deprel
}

