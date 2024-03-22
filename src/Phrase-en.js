/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import {English_constituent} from "./Constituent-en.js"
import {N,A,Pro,D,V,Adv,C,P,DT,NO,Q, VP} from "./jsRealB.js"
import { getRules} from "./Lexicon.js";

export {English_phrase}

/**
 * English specific Phrase class
 */
const English_phrase = (superclass) =>
    class extends English_constituent(superclass){
        /**
         * Link properties for current Determiner and Adjective.
         * Nothing to do with Verb in English.
         *
         * @param {Terminal} e
         */
        link_DAV_properties(e){
            if (e.isA("D") && e.lemma=="no"){
                // check for "no" as determiner which should add plural in English
                this.peng["n"]="p"
                return
            } 
            if (this.isA("A") || (e.isA("D") && e.getProp("own") === undefined)){
                // link gender and number of the noun to the determiners and adjectives
                // in English possessive determiner should not depend on the noun but on the "owner"
                e.peng=this.peng
                return
            } 
        } 

        /**
         * Link the verb of a relative
         *
         * @param {Terminal} pro
         * @param {Terminal} v
         */
        link_subj_obj_subordinate(pro,v,_subject){
            if (["who","which","that"].includes(pro.lemma)){// agrees with this NP
                v.peng=this.peng
                this.linkAttributes(v,this.getFromPath([["VP"],["CP"]]),this)
            }
        }

        /**
         * Link the subject with the attributes in a verb phrase or in a coordination of verb phrases.
         * Empty for English
         * @param {*} vpv  the verb phrase
         * @param {*} vpcp  a coordination of verb phrase (can be undefined)
         * @param {*} subject the subject to link
         */
        linkAttributes(vpv,vpcp,subject){}

        /**
         * Check for a coordinated object of a verb in a SP used as cod occurring before the verb.
         * Empty for English
         */
        check_coordinated_object(){}


        /**
         * Check if a lemma is pronoun that should not be subject of a subordinate
         */
        should_try_another_subject(lemma,_iSubj){
            return lemma == "that"
        }

        /**
         * Pronominalization in English only applies to a NP (this is checked before the call)
         *  and does not need reorganisation of the sentence 
         *  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
         * @returns a Pro corresponding to the current NP
         */
        pronominalize(){
            if (!this.isA("NP"))
                return this.warn("bad application",".pro",["NP"],this.constType)
            const npParent=this.parentConst;
            let pro;
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
         * Make the auxiliary agree with the new subject in a passive sentence. 
         * Empty for English, because this is done by processTyp
         *
         * @param {*} vp
         * @param {*} newSubject
         */
        passive_agree_auxiliary(vp,newSubject){}

        /**
         * English phrase modification (mostly performed by affixHopping)
         * This might modify the current list of elements
         * @param {Object} types typ options for this Phrase
         */
        processTyp_verb(types){
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
                const words=this.affixHopping(vp.elements[idxV],vp.getProp("t"),getRules(this.lang).compound,types)
                // insert the content of the word array into vp.elements
                vp.removeElement(idxV);
                for (let i=0;i<words.length;i++)
                    vp.addElement(words[i],idxV+i);
            } else {
                this.warn("not found","V","VP")
            }
        }

        /**
         * Move the auxiliary to the front 
         *
         * @param {*} int unused
         */
        move_object(int){
            if (this.isA("S","SP")){ 
                let [idx,vpElems]=this.getIdxCtx("VP","V");
                if (idx!==undefined && !["pp","pr","b-to"].includes(this.getProp("t"))){ // do not move when tense is participle)
                    const v=vpElems[0].parentConst.removeElement(0);// remove first V
                    this.addElement(v,0)
                }
            } 
        }

        /**
         * Check for passive subject starting with par.
         * Do nothing for English
         *
         * @param {Phrase} cmp complement
         * @param {Terminal} pp
         * @returns {{}}
         */
        passive_subject_par(cmp,pp){
            return [cmp,pp]
        }

        /**
         * Return the appropriate interrogative pronoun for "woi"
         *
         * @param {*} int_
         * @returns {("whom" | "what")}
         */
        interrogative_pronoun_woi(int_){
            return int_ == "woi" ? "whom" : "what"
        }

        /**
         * Deal with a tag question, a short question added after an affirmation to ask for verification. 
         * source: https://www.anglaisfacile.com/exercices/exercice-anglais-2/exercice-anglais-95625.php
         *
         * @param {*} types : type options for this sentence
         */
        tag_question(types){  
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
                            pro=subj.clone().pro()
                            pro.g(subj.getProp("g")).n(subj.getProp("n")) // ensure proper number and gender
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
                vp.peng=pro.peng;  // ensure that the head of the vp is the pronoun for pronominalize_en
                this.addElement(vp);
            }
        }
    };
