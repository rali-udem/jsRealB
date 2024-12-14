/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { English_constituent } from "./Constituent-en.js"
import { Pro,V,Adv, subj,comp, mod} from "./jsRealB.js"
import { getRules} from "./Lexicon.js";

export {English_dependent}

/**
 * English specific Dependent class
 */
const English_dependent = (superclass) =>
    class extends English_constituent(superclass){
        /**
         * Link attributes in a dependent. Empty for English
         *
         * @param {*} depTerm
         * @param {*} headTerm
         */
        link_attributes(depTerm,headTerm){}

        /**
         * Check if English determiner "a" is used with an uncountable noun
         * Outputs a warning if it the case.
         * @ param{Terminal} det : the determiner
         * @param {Terminal} headNoun : the head Noun Terminal
         */
        check_determiner_cnt(det){
            if (det.lemma == "a" && this.terminal.getProp("cnt")=="no")
                det.morphoError("The undefinite determiner cannot be linked with an uncountable noun", this.terminal.lemma)
        }

        /**
         * Link a past participle with a direct object appearing before. 
         * Empty for English
         *
         * @param {*} dep
         * @param {*} HeadTerm
         */
        link_pp_before(dep,HeadTerm) {}

        /**
         * Link a past participle with a subject. Empty for English
         *
         * @param {*} depTerm
         */
        link_pp_with_head(depTerm){}

        /**
         * Make a passive agree after an auxiliary.
         * Empty for English because it is done by processTyp_en
         *
         * @param {*} obj
         */
        passive_agree_with_auxiliary(obj){}

        /**
         * Check for passive subject with "par". Empty for English
         */
        check_passive_subject_with_par(){}

        /**
         * Pronominalization in English only applies to a NP (this is checked before the call)
         *  and does not need reorganisation of the sentence 
         *  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
         * @returns a Pro corresponding to the current NP
         */
        pronominalize(){
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
         * English phrase modification (mostly performed by affixHopping)
         * This might modify the current list of elements
         * @param {Object} types typ options for this Phrase
         */
        processTyp_verb(types){
            // replace current verb with the list new words
            //  TODO: take into account the fact that there might be already a verb with modals...
            if (types["contr"]!==undefined && types["contr"]!==false){
                // necessary because we want the negation to be contracted within the VP before the S or SP
                this.contraction=true;
            }
            const words=this.affixHopping(this.terminal,this.getProp("t"),getRules(this.lang).compound,types);
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
         * Move the auxiliary to the front 
         *
         * @param {*} int : type of interrogative unused
         */
        move_object(int){
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
         * Deal with a tag question, a short question added after an affirmation to ask for verification. 
         * source: https://www.anglaisfacile.com/exercices/exercice-anglais-2/exercice-anglais-95625.php
         *
         * @param {*} types : type options for this sentence
         */
        tag_question(types){
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
    };
