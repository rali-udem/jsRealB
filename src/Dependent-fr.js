/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { French_constituent } from "./Constituent-fr.js";
import { getRules } from "./Lexicon.js";
import {terminal, N,A,Pro,D,V,Adv,C,P,DT,NO,Q, 
        phrase, S,NP,AP,VP,AdvP,PP,CP,SP, 
        dependent, root, subj, det, mod, comp, coord} from "./jsRealB.js"
export {French_dependent}


/**
 * French specific dependent class
 */
const French_dependent = (superclass) =>
    class extends French_constituent(superclass) {
        /**
         * Link attributes in a dependent with the ones of the head in the case of copula.
         *
         * @param {Terminal} depTerm 
         * @param {Terminal} headTerm
         */
        link_attributes(depTerm,headTerm){
            // check for an attribute of a copula with an adjective
            if (this.copules().includes(headTerm.lemma)){
                const iSubj=this.findIndex(d0=>d0.isA("subj") && d0.terminal.isA("N","Pro"));
                if (iSubj>=0){
                    depTerm.peng=this.dependents[iSubj].peng;
                }
            }           
        }
         /**
         * Check if English determiner "a" is used with an uncountable noun
         * No-op in French
         * @param {*} -term
         */
         check_determiner_cnt(_term){}

        /**
         * Link a past participle with a direct object appearing before. 
         * Empty for English
         *
         * @param {Dependent} dep
         * @param {Terminal} HeadTerm
         */
        link_pp_before(dep,headTerm){
            const depTerm=dep.terminal
            // rel is comp or mod
            // in French past participle can agree with a cod appearing before... keep that info in case
            depTerm.cod=headTerm;
            // HACK: check for a "temps composé" formed by "avoir" followed by a past participle 
            if (depTerm.lemma=="avoir"){
                const iVerb=dep.findIndex(depI=>depI.isA("comp") && depI.terminal.isA("V") && depI.terminal.getProp("t")=="pp");
                if (iVerb>=0) dep.dependents[iVerb].terminal.cod=headTerm;
            }
        }

        /**
         * Link a past participle with a subject.
         *
         * @param {Terminal} depTerm
         */
        link_pp_with_head(depTerm){
            // check for past participle in French that should agree with the head
            if (depTerm.getProp("t")=="pp"){
                depTerm.peng=this.peng;
            }
        }

        /**
         * Make a passive agree after an auxiliary.
         *
         * @param {Terminal} obj
         */
        passive_agree_with_auxiliary(obj){
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
            this.addDependent(dependent("*post*",[pp]),compIdx)
        }

        /**
         * Check for passive subject with "par". 
         */
        check_passive_subject_with_par(){
            // check for passive subject starting with par
            let pp;
            let parIdx=this.findIndex(d=>d.isA("comp") && d.terminal.isA("P") && d.terminal.lemma=="par");
            if (parIdx>=0){
                pp=this.dependents[parIdx].terminal;
                this.removeDependent(parIdx);// remove the passive subject
            }
            return pp
        }

        /**
         * Pronominalization in French
         * Phrase structure modification but that must be called in the context of the parentConst
         * because the pronoun depends on the role of the NP in the sentence 
         *         and its position can also change relatively to the verb
         * @returns a Pro corresponding to the current NP
         */
        pronominalize(){
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
        }
        
        /**
         * French phrase modification for .prog, .mod, .neg 
         * @param {Object} types typ options for this Phrase
         */
        processTyp_verb(types){
            if (types["contr"]!==undefined && types["contr"]!==false){
                this.warn("no French contraction")
            }
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
         * Move subject before the verb in question
         * use inversion rule which is quite "delicate"
         * rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
         * if subject is a pronoun, invert and add "-t-" or "-"
         *       except for first person singular ("je") which is, in some cases, non colloquial (e.g. aime-je or prends-je)
         * if subject is a noun or certain pronouns, the subject stays but add a new pronoun
         *
         * @param {string} int : question type 
         */
        move_object(int){
            if (!this.terminal.isA("V")) return // do not move if the head is not a verb
            const v = this.terminal
            const proLikeNoun = ["aucun","beaucoup","ça","ceci","cela","celui-ci","celui-là","quelqu'un","tout"];
            let subjIdx=this.findIndex((d)=>d.isA("subj"));
            if (subjIdx>=0){
                const subject=this.dependents[subjIdx].terminal;
                let pro;
                if (subject.isA("Pro") && !proLikeNoun.includes(subject.lemma)){
                    if (subject.getProp("pe")==1 && subject.getProp("n")=="s"){ // add "est-ce que" at the start
                        // unless the verb is one of "ai, dis, dois, fais, puis, sais, suis, vais, veux, vois" according to
                        // https://www.academie-francaise.fr/questions-de-langue#42_strong-em-inversion-du-sujet-je-puis-je-em-strong 
                        if (v.getProp("t")=="p" && v.getProp("pe")==1){
                            if (!["avoir","dire","devoir","faire","pouvoir","savoir","être","aller","vouloir","voir"].includes(v.lemma)){
                                this.add(det(Q("est-ce que")),0);
                                return;
                            }
                        }
                    }
                    pro=this.removeDependent(subjIdx).terminal; //remove subject
                } else if (["wod","wad"].includes(int)){ // do not invert subject when "wod" or "wad"
                    this.add(det(Q("est-ce que")),0);
                    return;
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
         * Deal with a tag question, a short question added after an affirmation to ask for verification. 
         * in French really simple, add "n'est-ce pas"
         * @param {*} types : type options for this sentence (unused in French)
         */
        tag_question(types){
                this.a(", n'est-ce pas")
        }
    };
