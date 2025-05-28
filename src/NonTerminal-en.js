/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { Terminal } from "./Terminal.js"
import { Pro,V,Adv,P,Q } from "./jsRealB.js"
export { English_non_terminal }

// negation of modal auxiliaries
const negMod={"can":"cannot","may":"may not","shall":"shall not","will":"will not","must":"must not",
              "could":"could not","might":"might not","should":"should not","would":"would not"}; 

/**
 * English specific class for functions shared between Phrase_en and Dependent_en
 */
const English_non_terminal = (superclass) =>
    class extends superclass {
        /**
         * Return the English word for "last"
         *
         * @returns {"last"}
         */
        word_last(){return "last"}
                
        /**
         * Return the default adjective position
         *
         * @returns {"pre")
         */
        adj_def_pos(){return "pre"}
        
        /**
         * Return a pronoun for a passive subject
         *
         * @param {*} subject
         * @returns {Terminal}
         */
        passive_pronoun_subject(subject){
            if (subject.lemma == "I")
                return Pro("me").tn("").g(subject.getProp("g"))
                        .n(subject.getProp("n")).pe(subject.getProp("pe"))
            return subject.getTonicPro()
        }

        /**
         * Return a default passive subject
         *
         * @returns {"it"}
         */
        passive_dummy_subject(){return "it"}
            
        /**
         * Return s atring corresponding to a "passive context" for the error message
         *
         * @returns {"passive context"}
         */
        passive_context(){return "passive context"}
        
        /**
         * Link passive with subject. Essentially empty for English
         *
         * @returns {true}
         */
        passive_should_link_subject(){return true}
        
        /**
         * Return a preposition in a passive context according to a condition
         *
         * @param {boolean} test
         * @returns {("to" | "by")}
         */
        passive_prep(test) {return test ? "to" : "by"}

        /**
         * Check if the object in a passive sentence is a human
         *
         * @param {string} int
         * @param {Constituent} cmp
         * @returns {boolean}
         */
        passive_human_object(int, cmp){
            return int == "wod" && cmp !== undefined && ["m","f"].includes(cmp.getProp("g"))
        }

        /**
         * Check if an interrogative prefix should be added
         *
         * @param {*} int_ : interrorative type
         * @returns {boolean}
         */
        should_add_interrogative_prefix(int_) {
            return int_ != "yon"
        }

        /**
         * Return the lemma corresponding to "and"
         *
         * @returns {"and"}
         */
        and_conj() {return "and"}
            
        /**
         * Return an object with set of string for prepositions used for different types of questions
         * The list of prepositions was obtained with:
         *  cat lexicon-en.json | jq -c 'to_entries | map(select(.value|has("P"))|.key )'
         *
         * @returns {{ all: string[], whe: string[], whn: string[] }}
         */
        prepositionsList(){
            return {
                "all":new Set([ "about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "amongst", 
                                "around", "as", "at", "back", "before", "behind", "below", "beneath", "beside", "besides", "between", 
                                "beyond", "by", "concerning", "considering", "despite", "down", "during", "except", "for", "from", 
                                "in", "inside", "into", "less", "like", "minus", "near", "next", "of", "off", "on", "onto", "outside", 
                                "over", "past", "per", "plus", "round", "since", "than", "through", "throughout", "till", "to", "toward", 
                                "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "with", "within", "without" ] ),
                "whe":new Set(["above", "across", "along", "alongside", "amid","around", "before", "behind", "below", "beneath", "beside", 
                            "besides", "between", "beyond", "in", "inside", "into", "near", "next", "onto", "outside", "over", "past",
                            "toward", "towards", "under", "underneath","until","via","within",  ]),
                "whn":new Set(["after", "before", "during","since",  "till", ]),
            }
        }

        /**
         * English conjugation (used by processTyp)
         * implements the "affix hopping" rules given in 
         *      N. Chomsky, "Syntactic Structures", 2nd ed. Mouton de Gruyter, 2002, p 38 - 48
         * @param {string} v verb
         * @param {string} t tense
         * @param {Object} compound compound object from the rules of the language
         * @param {Object} types current options for this Phrase
         */
        affixHopping(v,t,compound,types){
            const v_peng=v.peng;
            const neg = types["neg"]===true;
            let auxils=[];  // list of Aux followed by V
            let affixes=[];
            let isFuture=false;
            if (t=="f" || t=="c"){
                isFuture=true;
                t = t=="f"?"p":"ps"; // the auxiliary will be generated here so remove it from the V
            }
            const prog = types["prog"]!==undefined && types["prog"]!==false;
            const perf =types["perf"]!==undefined && types["perf"]!==false;
            const pas =types["pas"]!==undefined && types["pas"]!==false;
            const interro = types["int"];
            const modality=types["mod"];
            if (modality !== undefined && modality !== false){
                auxils.push(compound[modality].aux);
                affixes.push("b");
            } else if (isFuture){
                // caution: future and conditional in English are done with the modal will, so another modal cannot be used
                auxils.push(compound.future.aux);
                affixes.push("b");
            }
            if (perf || prog || pas){
                if (perf){
                    auxils.push(compound.perfect.aux);
                    affixes.push(compound.perfect.participle);
                }
                if (prog) {
                    auxils.push(compound.continuous.aux);
                    affixes.push(compound.continuous.participle)
                }
                if (pas) {
                    auxils.push(compound.passive.aux);
                    affixes.push(compound.passive.participle)
                }
            } else if (interro !==undefined && interro !== false && 
                    auxils.length==0 && v.lemma!="be" && v.lemma!="have"){ 
                // add auxiliary for interrogative if not already there
                if (interro!="wos" && interro!="was" && interro!="tag"){
                    if (!["pp","pr","b-to"].includes(t)){ // do not add auxiliary for participle and infi
                        auxils.push("do");
                        affixes.push("b");
                    }
                }
            }
            auxils.push(v.lemma);
            // realise the first verb, modal or auxiliary
            // but make the difference between "have" as an auxiliary and "have" as a verb
            const vAux=auxils.shift();
            let words=[];
            // conjugate the first verb
            if (neg) { // negate the first verb
                if (["pp","pr","b","b-to","bp","bp-to"].includes(t)){ // special case for these tenses
                    words.push(Adv("not","en"));
                    if (t=="b" || t=="bp") words.push(P("to","en"));
                    words.push(V(vAux,"en").t(t));
                } else if (t=="ip" && v_peng["pe"]==1 && v_peng["n"]=="p") { 
                    // very special case , insert "not" between "let's" and the verb
                    words.push(Q("let's"))
                    words.push(Adv("not","en"));
                    words.push(V(vAux,"en").t("b"));
                } else if (vAux in negMod){
                    if (vAux=="can" && t=="p"){
                        words.push(Q("cannot"))
                    } else {
                        words.push(V(vAux,"en").t(t))
                        words.push(Adv("not","en"))
                    }
                } else if (vAux=="be" || (vAux=="have" && v.lemma!="have")) {
                    words.push(V(vAux).t(t));
                    words.push(Adv("not","en"));
                } else {
                    words.push(V("do","en").t(t));
                    words.push(Adv("not","en"));
                    if (vAux != "do") words.push(V(vAux).t("b")); 
                }
            } else { // must only set necessary options, so that shared properties will work ok
                let newAux=V(vAux).t(t);
                if (v.lemma in negMod)newAux.pe(1);
                words.push(newAux);
            }
            // recover the original agreement info and set it to the first new verb...
            words[0].peng=v_peng;
            // realise the other parts using the corresponding affixes
            while (auxils.length>0) {
                const vb=auxils.shift();
                words.push(V(vb).t(affixes.shift()));
            }
            if (types["refl"]===true && t!="pp"){
                words.push(Pro("myself","en").pe(v.getProp("pe")).n(v.getProp("n")).g(v.getProp("g")))
            }
            return words
        }

        /**
         * In a VP, place the first consecutive adverbs at a correct position according to the rules of English. 
         * Usually an adverb is set according to either .pos("pre"|"post")
         * The problem occurs mainly with verbs with an auxiliary. 
         * TODO: deal with more than one sequence of adverbs (although it should be rare)
         * @param {Terminal[]} res : list of Terminals possibly modified in place 
         */
        checkAdverbPos(res){
            function moveTo(startIdx,n,toIdx){
                res.splice(toIdx,0,...res.splice(startIdx,n))
            }
            const relpro = this.relative_pronouns()
            // find the start of the current "sentence" in order not to move an adverb across the boundary of a relative
            let start = res.length-1
            while (start>=0 && !(res[start].isA("Pro")&&relpro.includes(res[start].lemma))) start--;
            start++;
            // find first consecutive adverbs (ignoring "not" and "ne")
            const advIdxes = res.map((e,i)=>(i>=start && e.isA("Adv") && e.lemma != "not")?i:-1).filter((e)=> e!=-1)
            if (advIdxes.length==0) return;
            const advIdx = advIdxes[0]
            const advTerminal = res[advIdx]
            // check that the indexes of adverbs are consecutive, remove those that are not
            for (let i=1; i<advIdxes.length;i++){
                if (advIdxes[i] != advIdxes[i-1]+1){
                    advIdxes.splice(i,advIdxes.length-i)
                }
            }
            function moveAfterAux(auxMods){
                for (let auxIdx = 0;auxIdx<advIdx-1; auxIdx++){
                    const e = res[auxIdx];
                    if (e.isA("V") && auxMods.includes(e.lemma)){
                        if (res[auxIdx+1].isA("V")){
                            // there is an auxiliary/modals followed by a verb, insert adverb after the auxiliary
                            // but avoid "will" or "shall" in future (check the parentConst in this case)
                            if (e.lemma=="will" || e.lemma=="shall"){
                                if (e.parentConst !== null && e.parentConst.getProp("t")=="f") continue;
                            }
                            moveTo(advIdx,advIdxes.length,auxIdx+1)
                        } else {
                            // in English insert after negation (in French, negation [ne  ... pas] is added after this step)
                            if (res[auxIdx+1].lemma=="not" && res[auxIdx+2].isA("V"))
                                moveTo(advIdx,advIdxes.length,auxIdx+2)
                         }
                        break;
                    }
                }
            }

            if (advIdx >= start+2 && advTerminal.props["pos"]===undefined){
                // do not touch adverb with pos specified
                // the adverb must be put after the first auxiliary
                    moveAfterAux(["have","can","will","shall","may","must"])
            }
        }

        /**
         * Place pronoun within the list of realized tokens, Empty for English
         */
        doPronounPlacement(){}

        /**
         * Return the appropriate interrogative pronoun for "woi"
         *
         * @param {*} int_
         * @returns {("whom" | "what")}
         */
        interrogative_pronoun_woi(int_){
            return int_ == "woi" ? "whom" : "what"
        }

    }
