/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
    Functions shared with Dependent
 */


import {Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./Terminal.js"
import { negMod } from "./Lexicon.js";
export {getElems, affixHopping, doFrenchPronounPlacement}

/**
 * flatten list of elements removing null and undefined
 * @param {Constittuent[]} es List of (Lists) Consituents with possibly undefined or null elements
 * @returns list of Constituents
 */
function getElems(es){ // 
    let res=[]
    for (const e of es) {
        if (e !== null && e!== undefined){
            if (Array.isArray(e)){
                Array.prototype.push.apply(res,getElems(e)); // recursive call
            } else
                res.push(e);
        }
    }
    return res;
}

/**
 * for English conjugation (used by Phrase.processTyp_en and Dependent.processTyp_en)
 * implements the "affix hopping" rules given in 
 *      N. Chomsky, "Syntactic Structures", 2nd ed. Mouton de Gruyter, 2002, p 38 - 48
 * @param {string} v verb
 * @param {string} t tense
 * @param {Object} compound compound object from the rules of the language
 * @param {Object} types current options for this Phrase
 */
function affixHopping(v,t,compound,types){
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
        if (t=="pp" || t=="pr" || t=="b-to" || t=="b"){ // special case for these tenses
            words.push(Adv("not","en"));
            if (t=="b") words.push(P("to","en"));
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
    "me":4, "te":4, "nous":2, "vous":2, 
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
 * In French: look for "clitic" pronouns and sort them according to the rules of French
 * CAUTION: some heuristics being used, in some cases the order might not be "optimal" 
 * @param {Terminal[]} cList list of Terminal in which the pronouns might be sorted
 */
function doFrenchPronounPlacement(cList){
    let verbPos,cliticTable,neg2,prog;
    // check for combination of negation, progressive and modality verb
    // negation should be put on the "être" and "modality" and not on the original verb
    let iDeb=0
    for (let i=iDeb;i<cList.length;i++){
        let c=cList[i];
        if (c.isA("V") && c.neg2 !== undefined){
            if (c.isMod || c.isProg){
                c.insertReal(cList,Q(c.neg2),i+1);
                c.insertReal(cList,Adv("ne","fr"),i);
                delete c.neg2 // remove negation from the original verb
                iDeb=i+3      // skip these in the following loop
                if (c.isProg)iDeb+=2 // skip "en train","de"
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
                }
                if (c.isReflexive() && c.getProp("t")!="pp"){
                    if (prog!==undefined)c=prog;
                    c.insertReal(pros,Pro("moi","fr").c("refl")
                                    .pe(c.getProp("pe")).n(c.getProp("n"))
                                    .g(c.getProp("g")));
                }
            }
        } else if (c.isA("Pro") && verbPos!==undefined){
            if (c.getProp("pos")==undefined || (c.parentConst!==null && c.parentConst.getProp("pos")===undefined)){
                // do not try to change position of a constituent with specified pos
                if (["refl","acc","dat"].includes(c.getProp("c")) || c.lemma=="y" || c.lemma=="en"){
                    pros.push(cList.splice(i,1)[0]);
                    i--; // to ensure that all elements are taken into account because cList array has changed
                }
            }
        // HACK: stop when seeing a preposition (except "par" introduced by a passivee) or a conjunction 
        //          or a "strange" pronoun that might start a phrase 
        //       whose structure has been flattened at this stage
        } else if (c.isA("P","C","Adv","Pro") && verbPos!==undefined && c.lemma!="par"){
            break;
        }
    }
    if (verbPos === undefined)return;
    // add ending "pas" after the verb unless it is "lié" in which cas it goes after the next word
    if (neg2){// HACK: add neg2 to the original verb...
        const vb=cList[verbPos]
        vb.insertReal(cList,Q(neg2),verbPos+(vb.getProp("lier")===undefined?1:2))
        if (pros.length>0  &&  pros[0].isA("Adv") && pros[0].lemma=="ne"){
            cList.splice(verbPos,0,pros.shift())
            verbPos++;
        }
    }    
    if (pros.length>1)pros.sort((p1,p2)=>compareClitics(p1,p2,cliticTable));
    if (pros.length>0){
        // insert pronouns before the verb 
        for (let k=0;k<pros.length;k++){
            cList.splice(verbPos+k,0,pros[k])
        }
    }
}