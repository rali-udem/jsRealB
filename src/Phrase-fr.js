/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { French_constituent } from "./Constituent-fr.js";
import { getRules } from "./Lexicon.js";
import {N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./jsRealB.js"
export {French_phrase}

/**
 * French specific Phrase class
 */
const French_phrase = (superclass) =>
    class extends French_constituent(superclass) {
        /**
         * Link properties for current Determiner, Adjective and Verb.
         *
         * @param {Terminal} e
         */
        link_DAV_properties(e){
            if (e.isA("A") && e.lemma=="quelques"){
                // check for "quelques" as adjective which should add plural in French
                this.peng["n"]="p"
                return
            }
            if (e.isA("A","D")){
                // link gender and number of the noun to the determiners and adjectives
                // in English possessive determiner should not depend on the noun but on the "owner"
                e.peng=this.peng
                return
            }
            if (e.isA("V") && e.getProp("t")=="pp"){
                e.peng=this.peng
            }
        }

        /**
         * Link the verb of a relative
         *
         * @param {Terminal} pro
         * @param {Terminal} v
         */
        link_subj_obj_subordinate(pro,v,subject){
            if (["qui","lequel"].includes(pro.lemma) && pro===subject){// agrees with this NP
                v.peng=this.peng
                if (pro.lemma == "lequel") pro.peng=this.peng
                this.linkAttributes(v,this.getFromPath([["VP"],["CP"]]),this)
            } else if (["duquel","auquel"].includes(pro.lemma)) {
                pro.peng=this.peng  // only agree the pronoun
            } else if (pro.lemma=="que"){
                // in French past participle can agree with a cod appearing before... keep that info in case
                v.cod=this
                // HACK: check for a "temps composé" formed by "avoir" followed by a past participle 
                if (v.lemma=="avoir"){
                    const idx=v.parentConst.getIndex("V");
                    if (v.parentConst.elements.length>idx+1){
                        const next=v.parentConst.elements[idx+1]
                        if (next.isA("V") && next.getProp("t")=="pp"){
                            next.cod=this
                        }
                    }
                }
            }
        }
        
        /**
         * Link the subject with the attributes in a verb phrase or in a coordination of verb phrases
         * used in SP and in a NP
         * @param {*} vpv  the verb phrase
         * @param {*} vpcp  a coordination of verb phrase (can be undefined)
         * @param {*} subject the subject to link
         */
        linkAttributes(vpv,vpcp,subject){
            if (this.copules().includes(vpv.lemma)){
                // check for coordination of attributes or past participles
                // const vpcp = this.getFromPath([["VP"],["CP"]])
                if (vpcp!== undefined){
                    for (let e of vpcp.elements){
                        if (e.isA("A"))
                            e.peng=subject.peng;
                        else if (e.isA("V") && e.getProp("t")=="pp")
                            e.peng=subject.peng
                        else if (e.isA("AP"))
                            e.linkPengWithSubject("AP","A",subject)
                        else if (e.isA("VP")){
                            const v = e.getConst("V");
                            if (v !== undefined && v.getProp("t")=="pp"){
                                v.peng=subject.peng;
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
                                const e=elems[i];
                                if (e.isA("V") && e.getProp("t")=="pp"){
                                    e.peng=subject.peng;
                                    break;
                                }
                            }
                        }
                    }
                }                
            }
        }

    
        /**
         * Check if a lemma is pronoun that should not be subject of a subordinate
         */
        should_try_another_subject(lemma,iSubj){
            return ["que","où","dont"].includes(lemma) ||
                (lemma == "qui" && iSubj>0 && this.elements[iSubj-1].isA("P"))
        }
    
        /**
         * Check for a coordinated object of a verb in a SP used as cod occurring before the verb
         */
        check_coordinated_object(){
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

        /**
         * Pronominalization in French
         * Phrase structure modification but that must be called in the context of the parentConst
         * because the pronoun depends on the role of the NP in the sentence 
         *         and its position can also change relatively to the verb
         * @returns a Pro corresponding to the current NP
         */
        pronominalize(){
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
         * Make the auxiliary agree with the new subject in a passive sentence. 
         *
         * @param {Phrase} vp
         * @param {Phrase} newSubject
         */
        passive_agree_auxiliary(vp,newSubject){
            // change verbe into an "être" auxiliary and make it agree with the newSubject
            const verbeIdx=vp.getIndex("V")
            const verbe=vp.removeElement(verbeIdx);
            const aux=V(verbe.lemma == "être" ? "avoir" : "être","fr");
            aux.parentConst=vp;
            aux.taux=verbe.taux;
            if (newSubject!==undefined) // this can happen when a subject is Q
                aux.peng=newSubject.peng;
            aux.props=verbe.props;
            if (vp.getProp("t")=="ip"){
                aux.t("s") // set subjonctive present tense for an imperative
            }
            const pp = V(verbe.lemma,"fr").t("pp");
            if (newSubject!==undefined) // this can happen when a subject is Q
                pp.peng=newSubject.peng;
            vp.addElement(aux,verbeIdx).addElement(pp,verbeIdx+1)
        }

        /**
         * French phrase modification for .prog, .mod, .neg 
         * @param {Object} types typ options for this Phrase
         */
        processTyp_verb(types){
            // process types in a particular order
            let rules=getRules(this.lang)
            this.processVP(types,"prog",function(vp,idxV,v){
                const verb=vp.removeElement(idxV);
                const origLemma=verb.lemma;
                verb.setLemma("être");// change verb, but keep person, number and tense properties of the original...
                verb.isProg=verb;
                // except for sentence refl which should be kept on the original verb
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
                let newV=V(origLemma).t("b")
                newV.pe(v.getProp("pe")).n(v.getProp("n")); // copy also person and number used for pronoun of reflexive verb
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
         * Move the verb before the subject by using an inversion rule which is quite "delicate"
         * rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
         * if subject is a pronoun, invert and add "-t-" or "-" 
         *       except for first person singular ("je") which, in some cases, is non colloquial (e.g. aime-je or prends-je)
         * if subject is a noun or certain pronouns, the subject stays but add a new pronoun
         *
         * @param {*} int : type of interrogative
         */
        move_object(int){
            let v = this.getFromPath([["VP",""],["V"]]) // find the verb
            if (v == undefined) return // do not move if no verb is present
            const proLikeNoun = ["aucun","beaucoup","ça","ceci","cela","celui-ci","celui-là","quelqu'un","tout"];
            const subjIdx=this.getIndex(["NP","N","Pro","SP","CP"]);
            if (subjIdx>=0){
                const subj=this.elements[subjIdx];
                let pro;
                if (subj.isA("Pro") && !proLikeNoun.includes(subj.lemma)){
                    if (subj.getProp("pe")==1 && subj.getProp("n")=="s"){ // add "est-ce que" at the start
                        // unless the verb is one of "ai, dis, dois, fais, puis, sais, suis, vais, veux, vois" according to
                        // https://www.academie-francaise.fr/questions-de-langue#42_strong-em-inversion-du-sujet-je-puis-je-em-strong 
                        if (v.getProp("t")=="p" && v.getProp("pe")==1){
                            if (!["avoir","dire","devoir","faire","pouvoir","savoir","être","aller","vouloir","voir"].includes(v.lemma)){
                                this.add(Q("est-ce que"),subjIdx);
                                return;
                            }
                        }
                    } 
                    pro = this.removeElement(subjIdx); // remove subject pronoun
                } else if (["wod","wad"].includes(int)){ // do not invert subject when "wod" or "wad"
                    this.add(Q("est-ce que"),subjIdx)
                    return;
                } else if (subj.isA("CP")){
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
         * Check for passive subject starting with par.
         * Possibly changing changing cmp and pp
         *
         * @param {Phrase} cmp complement
         * @param {Terminal} pp
         * @returns {{}}
         */
        passive_subject_par(cmp,pp){
            // check for passive subject starting with par
            const [idx,ppElems]=this.getIdxCtx("VP","PP");
            if (idx!==undefined){
                pp=ppElems[idx].getConst("P");
                if (pp!==undefined && pp.lemma=="par"){
                    cmp = ppElems[0].parentConst.removeElement(idx); // remove the passive subject
                } else {
                    pp=undefined;
                }
            }
            return [cmp,pp]
        }

        /**
         * Return the appropriate interrogative pronoun for "woi"
         *
         * @param {*} int_
         * @returns {("whom" | "what")}
         */
        interrogative_pronoun_woi(int_){
            return int_ == "woi" ? "qui" : "quoi"
        }

        /**
         * Deal with a tag question, a short question added after an affirmation to ask for verification. 
         * in French really simple, add "n'est-ce pas"
         *
         * @param {*} types : unused
         */
        tag_question(types){
            return this.a(", n'est-ce pas")
        }
    };


