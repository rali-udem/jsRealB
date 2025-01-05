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
         * Return the grammatical number of this terminal
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
                return [this.morphoError("pas de terminaison acceptable pour :A",{g:g,n:n})];
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
         * Check if the person of a pronoun should be changed (i.e. it is not genitive )
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
         * Returns the list of table number in rules-fr that indicates a noun that is always plural
         *
         * @returns {[string]}
         */
        noun_always_plural(){return ['n1','n15','n21','n22','n26']}

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
         * Check if this English noun is uncountable, if so do not accept plural.
         * Returns null because it is not applicable in French.
         * @returns {null}
         */
        check_countable(){return null}

        /**
         * Check if a pronoun or a possessive determiner must be changed 
         * @param {object} keyvals might be changed
         * @returns true if declension table must be changed because lemma has been changed
         */
        check_majestic(keyVals){
            if (this.isA("D")){
                if (this.lemma == "mon" && keyVals["pe"]<3){
                    this.setLemma("notre")
                    return true
                } else if (this.lemma == "ton" || (this.lemma == "notre" && keyVals["pe"]==2 && keyVals["n"]=="s")){
                    this.setLemma("votre")
                    return true;
                }
            }
            return false;
        }

        /**
         * French conjugation of this Terminal
         * @returns list of Terminals with their realization field filled
         */
        conjugate(){
            let pe = +this.getProp("pe") || 3; // property can also be a string with a single number 
            let g = this.getProp("g");
            let n = this.getNumber();
            const t = this.getProp("t");
            let conjugation;
            if (this.tab==null) 
                return [this.morphoError("pas de table de conjugation trouvée",{pe:pe,n:n,t:t})];
            switch (t) {
            case "pc":case "pq":case "cp": case "fa": case "pa": case "spa": case "spq": case "bp":// temps composés
                const tempsAux={"pc":"p","pq":"i","cp":"c","fa":"f","pa":"ps","spa":"s","spq":"si", "bp":"b"}[t];
                // check that the original verb can be conjugated at the tense and person of the auxliary
                // useful for defective verb (e.g. pleuvoir) so that it is still defective at compound tenses
                // so that both "je pleut" "j'ai plu" raise a warning
                conjugation=getRules(this.lang).conjugation[this.tab].t[tempsAux];
                if (conjugation === undefined || conjugation == null){
                    return [this.morphoError("pas de conjugaison trouvée",{pe:pe,n:n,t:t})];
                } else if (conjugation[pe-1+(n=="p"?3:0)]==null){
                    return [this.morphoError("conjugation impossible à ces personne et nombre",{pe:pe,n:n,t:t})];
                }
                const aux =  V("avoir","fr"); 
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
                    g="m"
                    n="s";
                    if (this.lemma!="être"){
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
                pp.parentConst = this.parentConst
                // change this verb to pp
                pp.setProp("g",g);
                if (this.isMajestic())
                    pp.setProp("n",this.peng.n); // HACK: keep original number (ignoring maje)
                else
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
                conjugation=getRules(this.lang).conjugation[this.tab].t[t];
                if (conjugation!==undefined && conjugation!==null){
                    let res,term;
                    switch (t) {
                    case "p": case "i": case "f": case "ps": case "c": case "s": case "si":
                        term=conjugation[pe-1+(n=="p"?3:0)];
                        if (term==null){
                            return [this.morphoError("verbe défectif pour ces personne et nombre",{pe:pe,n:n,t:t})];
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
                            return [this.morphoError("impératif non conjugable à cette personne",{pe:pe,n:n,t:t})];
                        }
                        term=conjugation[pe-1+(n=="p"?3:0)];
                        if (term==null){
                            return [this.morphoError("impératif non existant",{pe:pe,n:n,t:t})];
                        } else {
                            this.realization=this.stem+term;
                        }
                        res=[this];
                        if (this.isReflexive() && this.parentConst==null){
                            this.lier();
                            this.insertReal(res,Pro("moi","fr").tn("").pe(pe).n(n).g(g));
                        }
                        return res;
                    case "pp":
                        g=(this.cod ?? this).getProp("g");
                        n=(this.cod ?? this).getProp("n");
                        if (g=="x" || g=="n")g="m"; // neutre peut arriver avec un sujet en anglais
                        if (n=="x")n="s";
                        const idx = (n=="s" ? 0 : 2)+(g=="m"? 0 : 1)
                        const termPP = conjugation[idx]
                        if (termPP == null){
                            return [this.morphoError("verbe défectif pour ces personne et nombre",{pe:pe,n:n,t:t})];
                        }
                        if (idx>0){
                            const pat = this.getProp("pat")
                            if (pat != undefined && pat.length==1 && pat[0]=="intr" && this.getProp("aux")=="av"){ 
                                // ne pas conjuguer un pp d'un verbe intransitif avec auxiliaire avoir
                                return [this.morphoError("pas de flexion pour un participe passé d'un verbe intransitif",{pe:pe,g:g,n:n,t:t})];
                            }
                        }
                        this.realization=this.stem+termPP;
                        return [this];
                    case "b": case "pr": 
                        this.realization=this.stem+conjugation;
                        res=[this];
                        if ( this.isReflexive()&& this.parentConst==null){
                            this.insertReal(res,Pro("moi","fr").c("refl").pe(pe).n(n).g(g),0)
                        }
                        return res;
                    default:
                        return [this.morphoError("temps de conjugaison non traité",{pe:pe,n:n,t:t})];
                    }
                }
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


