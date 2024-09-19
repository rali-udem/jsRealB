/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { Terminal } from "./Terminal.js"
import {N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./jsRealB.js"

export {French_non_terminal}

/**
 * Tables des positions des clitiques en français, tirées de 
 *    Choi-Jonin (I.) & Lagae (V.), 2016, « Les pronoms personnels clitiques », in Encyclopédie Grammaticale du Français, 
 *    en ligne : http://encyclogram.fr
 *  section 3.1.1. (http://encyclogram.fr/notx/006/006_Notice.php#tit31)
 */
const proclitiqueOrdre = { // page 11 du PDF
    // premier pronom que nous ignorons pour les besoins de cette application
    // "je":1, "tu":1, "il":1, "elle":1, "on":1, "on":1, "nous":1, "vous":1, "vous":1, "ils":1, "elle":1,
    "ne":2, 
    "me":3, "te":3, "se":3, "nous":3, "vous":3, 
    "le":4, "la":4, "les":4, 
    "lui":5, "leur":5,
    "y":6,
    "en":7,
    "*verbe*":8,
    "pas":9,  // s'applique aussi aux autre négations... plus, guère
} 

const proclitiqueOrdreImperatifNeg = { // page 14 du PDF
    "ne":1, 
    "me":2, "te":2, "nous":2, "vous":2, 
    "le":3, "la":3, "les":3, 
    "lui":4, "leur":4,
    "y":5,
    "en":6,
    "*verbe*":7,
    "pas":8,  // s'applique aussi aux autre négations... plus, guère
} 

const proclitiqueOrdreImperatifPos = { // page 15 du PDF
    "*verbe*":1,
    "le":2, "la":2, "les":2, 
    "lui":3, "leur":3,
    "me":4, "te":4, "nous":4, "vous":4, 
    "y":5,
    "en":6,
} 

const proclitiqueOrdreInfinitif = { // page 17 du PDF
    "ne":1, 
    "pas":2,  // s'applique aussi aux autre négations... plus, guère, jamais
    "me":3, "te":3, "se":3, "nous":3, "vous":3, 
    "le":4, "la":4, "les":4, 
    "lui":5, "leur":5,
    "y":6,
    "en":7,
    "*verbe*":8,
} 

/**
 * Compare position of two pronoun (used for sorting)
 * @param {Pro} pro1 first pronoun
 * @param {Pro} pro2 secong pronoun
 * @param {Object} table table giving the position of a pronoun
 */
function compareClitics(pro1,pro2,table){
    const k1=table[pro1.realization] || 100
    const k2=table[pro2.realization] || 100;
    return k1-k2;
}

/**
 * French specific class for functions shared between Phrase_en and Dependent_en
 */
const French_non_terminal = (superclass) =>
    class extends superclass {
         /**
         * Return the French word for "last"
         *
         * @returns {"dernier"}
         */
         word_last(){return "dernier"}

         /**
         * Return the default adjective position
         *
         * @returns {"post")
         */            
        adj_def_pos(){return "post"}
        
        /**
         * Return a pronoun for a passive subject
         *
         * @param {*} subject
         * @returns {Terminal}
         */
        passive_pronoun_subject(subject){
            if (subject.lemma == "je")
                return Pro("moi").tn("").g(subject.getProp("g"))
                        .n(subject.getProp("n")).pe(subject.getProp("pe"))
            return subject.getTonicPro()
        }
        
        /**
         * Return the list of French copula verbs
         *
         * @returns {string[]}
         */
        copules(){
            return ["être","paraître","sembler","devenir","rester"]
        }

        /**
         * Return a default passive subject
         *
         * @returns {"lui"}
         */        
        passive_dummy_subject(){return "lui"}
            
        /**
         * Return s atring corresponding to a "passive context" for the error message
         *
         * @returns {"contexte passif"}
         */
        passive_context(){return "contexte passif"}

        /**
         * Link passive with subject. Essentially empty for English
         *
         * @returns {false}
         */        
        passive_should_link_subject(){return false}
        
        /**
         * Return a preposition in a passive context according to a condition
         *
         * @param {boolean} test
         * @returns {("de" | "par")}
         */
        passive_prep(test) {return test ? "de" : "par"}

        /**
         * Check if the object in a passive sentence is a human
         *
         * @param {string} int
         * @param {Constituent} cmp
         * @returns {false}
         */
        passive_human_object(int, cmp){return false}

        /**
         * Check if an interrogative prefix should be added
         *
         * @param {*} int_ : interrorative type
         * @returns {true}
         */
        should_add_interrogative_prefix(int_) {return true}

        /**
         * Return the lemma corresponding to "and"
         *
         * @returns {"et"}
         */
        and_conj() {return "et"}
        
        /**
         * Return an object with set of string for prepositions used for different types of questions
         * The list of prepositions was obtained with:
         *   cat lexicon-fr.json | jq -c 'to_entries | map(select(.value|has("P"))|.key )'
         *
         * @returns  {{ all: string[], whe: string[], whn: string[] }}
         */
        prepositionsList(){
            return {
                "all":new Set([ "à", "après", "avant", "avec", "chez", "contre", "d'après", "dans", "de", "dedans", "depuis", "derrière", 
                    "dès", "dessous", "dessus", "devant", "durant", "en", "entre", "hors", "jusque", "malgré", "par", "parmi", 
                    "pendant", "pour", "près", "sans", "sauf", "selon", "sous", "sur", "vers", "via", "voilà" ]),
                "whe":new Set(["après", "avant", "chez","dans",  "dedans","derrière","dessous", "dessus", "devant","entre", "hors",
                    "près","sous", "sur", "vers", "via",]),
                "whn":new Set(["après", "avant","depuis", "dès","durant", "en","pendant",]),
            }
        }
        /**
         * In a VP, place the first consecutive adverbs at a correct position according to the rules of French. 
         * Usually an adverb is set according to either .pos("pre"|"post")
         * The problem occurs mainly with verbs with an auxiliary. 
         * TODO: deal with more than one sequence of adverbs (although it should be rare)
         * @param {Terminal[]} res : list of Termnals possibly modified in place 
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
            const advIdxes = res.map((e,i)=>(i>=start && e.isA("Adv") && !(["not","ne"].includes(e.lemma)))?i:-1).filter((e)=> e!=-1)
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
                            if (auxMods.includes(res[auxIdx+1].lemma)){
                                // another French modal ()
                                moveTo(advIdx,advIdxes.length,auxIdx+2)
                            } else {
                                moveTo(advIdx,advIdxes.length,auxIdx+1)
                            }
                        } else {
                            // check for infinitive verb (the adverb should go before it)
                            let infinitiveFound=false;
                            for (let idx=advIdx-1;idx>auxIdx;idx--){
                                if (res[idx].props["t"]=="b"){
                                    moveTo(advIdx,advIdxes.length,idx)
                                    infinitiveFound=true
                                }
                            }
                            if (!infinitiveFound){
                                // check for inverted pronoun (added by .typ("int":"yon")
                                if (res[auxIdx+1].isA("Pro") && res[auxIdx+2].isA("V"))
                                    moveTo(advIdx,advIdxes.length,auxIdx+2)
                            }
                        }
                        break;
                    }
                }
            }

            if (advIdx >= start+2 && advTerminal.props["pos"]===undefined){
                // do not touch adverb with pos specified
                // French : https://fr.tsedryk.ca/grammaire/presentations/adverbes/4_La_place_de_l_adverbe.pdf (page 3)
                // place immediately after the auxiliary
                const advLemma = advTerminal.lemma;
                if (advLemma.endsWith("ment")) return; // adverbe qui finit en -ment, laisser après le verbe
                //  adverbes de temps et de lieu qu'il faut laisser après le verbe
                //  extraits d'une liste de types d'adverbes à https://www.scribbr.fr/elements-linguistiques/adverbe/
                const tempsAdv = ["hier","demain","longtemps","aujourd'hui","tôt","tard","auparavant","autrefois"]
                const lieuAdv = ["ici","là","là-bas","là-haut","ailleurs","autour","derrière","dessus","dessous","devant",
                "dedans","dehors","loin","près","alentour","après","avant","partout",
                "où","partout","au-dessus","au-dessous","au-devant","nulle part","quelque part"]
                if (tempsAdv.includes(advLemma) || lieuAdv.includes(advLemma)) return
                if (advLemma.length<=6 || ["toujours","souvent"].includes(advLemma))
                    // adverbe court ou commun: déjà, très, trop, toujours, souvent ... 
                    moveAfterAux(["avoir","être","vouloir","devoir","savoir"])
            }
        }

        /**
         * Look for "clitic" pronouns and sort them according to the rules of French
         * CAUTION: some heuristics being used, in some cases the order might not be "optimal" 
         * @param {Terminal[]} cList list of Terminal in which the pronouns might be sorted
         */
        doPronounPlacement(cList){
            function isLie(v){
                const lie = v.getProp("lier")
                return lie !== undefined && lie === true
            }

            let verbPos,cliticTable,neg2,prog;
            // check for combination of negation, progressive and modality verb
            // negation should be put on the "être" and "modality" and not on the original verb
            let iDeb=0
            for (let i=iDeb;i<cList.length;i++){
                let c=cList[i];
                if (c.isA("V") && c.neg2 !== undefined){
                    if (c.isMod || c.isProg){
                        if (isLie(c)){
                            c.insertReal(cList,Q(c.neg2),i+2);
                        } else
                            c.insertReal(cList,Q(c.neg2),i+1);               
                        c.insertReal(cList,Adv("ne","fr"),i);
                        delete c.neg2 // remove negation from the original verb
                        iDeb=i+3      // skip these in the following loop
                        if (c.isProg)iDeb+=2 // skip "en train","de"
                        break;
                    }
                }
            }
            // gather verb position and pronouns coming after the verb possibly adding a reflexive pronoun
            let pros=[]
            for (let i=iDeb;i<cList.length;i++){
                let c=cList[i];
                if (c.isA("V") && c.getProp("t")!="pp"){ // ignore past participles that act like adjectives
                    if (verbPos===undefined){
                        if (c.isMod || c.isProg){
                            if (c.isProg){prog=c}
                            continue;
                        }
                        // if (isLie(c) && c.neg2===undefined) return; // do not change anything when a verb is lié
                        verbPos=i
                        // find the appropriate clitic table to use
                        const t=c.getProp("t");
                        if (t=="ip"){
                            cliticTable = (c.neg2!==undefined) ? proclitiqueOrdreImperatifNeg : proclitiqueOrdreImperatifPos;
                        } else if (t=="b"){
                            cliticTable = proclitiqueOrdreInfinitif
                        } else 
                            cliticTable=proclitiqueOrdre;
                        // check for negation
                        if (c.neg2 !== undefined){
                            c.insertReal(pros,Adv("ne","fr"));
                            if (t=="b")
                                c.insertReal(pros,Q(c.neg2));
                            else
                                neg2=c.neg2;
                                delete c.neg2;// remove negation from the original verb
                        }
                        if (c.isReflexive() && c.getProp("t")!="pp"){
                            if (prog!==undefined)c=prog;
                            c.insertReal(pros,Pro("moi","fr").c("refl")
                                            .pe(c.getProp("pe")||3).n(c.getNumber()||"s")
                                            .g(c.getProp("g")||"m"));
                        }
                    }
                } else if (c.isA("Pro") && verbPos!==undefined){
                    if (!c.realization.endsWith("'") &&
                        (c.getProp("pos")===undefined || (c.parentConst!==null && c.parentConst.getProp("pos")===undefined))){
                        // do not try to change position of a constituent with specified pos or with an elided realization
                        if (["refl","acc","dat"].includes(c.getProp("c")) || c.lemma=="y" || c.lemma=="en"){
                            pros.push(cList.splice(i,1)[0]);
                            i--; // to ensure that all elements are taken into account because cList array has changed
                        } else if (["qui","que","quoi","dont","où"].includes(c.lemma) ){// do not cross boundary of a relative
                            break;
                        }

                    }
                } else if (c.isA("P","C","Adv","Pro") && verbPos!==undefined){
                    // HACK: stop when seeing a preposition or a conjunction
                    //         or a "strange" pronoun that might start a phrase
                    //      whose structure has been flattened at this stage
                    if (c.lemma=="par" && i<cList.length-1 && cList[i+1].isA("Pro")){
                        // if "par"  followed by a Pro is encountered (probably for passive), keep them together
                        i++;
                    } else
                        break;
                }
            }
            if (verbPos === undefined)return;
            // add ending "pas" after the verb unless it is "lié" in which case it goes after the next word
            if (neg2){// HACK: add neg2 to the original verb...
                const vb=cList[verbPos]
                vb.insertReal(cList,Q(neg2),verbPos+(isLie(vb)?2:1))
                if (pros.length>0  &&  pros[0].isA("Adv") && pros[0].lemma=="ne"){
                    cList.splice(verbPos,0,pros.shift())
                    verbPos++;
                }
            }
            if (pros.length>1)pros.sort((p1,p2)=>compareClitics(p1,p2,cliticTable));
            if (pros.length>0){
                // insert pronouns before the verb except for proclitiqueOrdreImperatifPos
                cList.splice(verbPos+(cliticTable["*verbe*"]==1 ? 1 : 0),0,...pros)
            }
        }

    }
