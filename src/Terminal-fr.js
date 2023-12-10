/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { getLanguage,getLexicon,getRules, quoteOOV } from "./Lexicon.js";

import {N,A,Pro,D,V,Adv} from "./jsRealB.js"
import {deprels} from "./Constituent.js"
import {French_constituent} from "./Constituent-fr.js"
export {French_terminal}

const French_terminal = (superclass) =>
    class extends French_constituent(superclass) {
        /**
         * Returns the French thousand separator
         *
         * @returns {RegExp}
         */
        thousand_seps(){return / /g}

        /**
         * Return the grammtical number of this terminal
         *
         * @returns {"s"|"p"}
         */
        grammaticalNumber(){
            const res = super.grammaticalNumber()
            if (res != null) return res;
            const number = this.value
            // according to http://bdl.oqlf.gouv.qc.ca/bdl/gabarit_bdl.asp?id=1582
            return (-2 < number && number < 2) ? "s" : "p";
        }

        /**
         * Decline an adjective or an adverb by filling the realization field.
         * Caution: can return more than one terminal
         *
         * @param {any} rules
         * @param {any} declension
         * @param {string} stem
         * @returns {Terminal[]}
         */
        decline_adj_adv(rules,declension,stem){
            // special case of French adjectives or adv, they can have more than one token
            const g=this.getProp("g");
            const n=this.getProp("n");
            const ending=this.bestMatch("déclinaison d'adjectif",declension,{g:g,n:n});
            if (ending==null){
                return [this.morphoError("decline [fr]:A",{g:g,n:n})];
            }
            const f = this.getProp("f");// comparatif d'adjectif
            if (f !== undefined && f !== false){
                const specialFRcomp={"bon":"meilleur","mauvais":"pire"};
                let res = []
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
        }

        /**
         * Check if "genitive" is used in French
         *
         * @param {string} c
         * @returns {boolean}
         */
        check_bad_pronoun_case(c){
            if (c=="gen"){ // genitive cannot be used in French
                this.warn("ignored value for option","c",c)
                return true
            }
            return false
        }
        /**
         * Check if the person of a pronoun should be changed (i.e. it not genitive )
         *
         * @param {string} c : case of the pronoun
         * @returns {boolean}
         */
        should_set_person_number(c){
            return true
        }

        /**
         * Return a list of tonic forms for pronouns
         *
         * @returns {string[]}
         */
        tonic_forms(){
            return ["toi","lui","nous","vous","eux","elle","elles","on","soi"]
        }

        /**
         * Return the French word for "declension"
         *
         * @returns {"declension"}
         */
        declension_word(){return "déclinaison"}

        /**
         * Check if the specified gender and number corresponds to what is 
         * acceptable in the lexicon. 
         *
         * @param {*} g
         * @param {*} n
         * @returns {null}
         */
        check_gender_lexicon(g,n){
            if (this.isA("N")){ 
                // check is French noun gender specified corresponds to the one given in the lexicon
                const lexiconG=getLexicon(this.lang)[this.lemma]["N"]["g"]
                if (lexiconG === undefined){
                    return [this.morphoError("genre absent du lexique",{g:g,n:n})];
                } 
                if (lexiconG != "x" && lexiconG != g) {
                    return [this.morphoError("genre différent de celui du lexique",{g:g, lexique:lexiconG})]
                }
            }
            return null           
        }

    
        /**
         * French conjugation of this Terminal
         * @returns list of Terminals with their realization field filled
         */
        conjugate(){
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
                        if (!myParent.isA(deprels)){
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
         * Return an appropriate numeric adjective for numeric "one" according to number and gender. 
         *
         * @param {int} number 1 or -1
         * @param {string} gender
         * @returns {null}
         */
        numberOne(number,gender){
            if (gender=="f"){
                if (number==1)return "une";
                if (number==-1) return "moins une";
            }
            return null; 
        }
    };


