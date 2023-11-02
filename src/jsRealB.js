/**
    jsRealB 4.6.5
    Guy Lapalme, lapalme@iro.umontreal.ca, October 2023

    Import all functions and classes of the jsRealB system and export them in one package
    It also adds a few utility functions and constants
 */

import {Constituent} from "./Constituent.js";
import {Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./Terminal.js"
import {Phrase, S,NP,AP,VP,AdvP,PP,CP,SP} from "./Phrase.js"
import {Dependent,root, subj, det, mod, comp, coord} from "./Dependent.js"
import {loadFr,loadEn,addToLexicon,getLanguage,getLemma,getLexicon,getRules,setReorderVPcomplements,setQuoteOOV} from "./Lexicon.js"
import {exceptionOnWarning,setExceptionOnWarning, resetSavedWarnings, getSavedWarnings, testWarnings} from "./Warnings.js";
import {fromJSON,ppJSON} from "./JSON-tools.js"

export {Constituent,
        Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q,
        Phrase,S,NP,AP,VP,AdvP,PP,CP,SP,
        Dependent,root, subj, det, mod, comp, coord,
        loadFr,loadEn,addToLexicon,getLanguage,getLemma,getLexicon,getRules,setReorderVPcomplements,setQuoteOOV,
        exceptionOnWarning,setExceptionOnWarning, resetSavedWarnings, getSavedWarnings, testWarnings,
        fromJSON,ppJSON,
        load, oneOf, mix, False, True, None, jsRealB_version, jsRealB_dateCreated, isRunningUnderNode}

/**
 * Set current language
 * @param {string} lang must be "en" or "fr"
 * @param {boolean?} trace if given and true, write message on the console
 * This function is defined here instead of being in Lexicon.js to be able to call warn(...)
 */
function load(lang,trace=false){
    if (lang=="fr") loadFr(trace)
    else if (lang=="en") loadEn(trace)
    else
        Q(lang).warn("bad language",lang)
}

let jsRealB_oneOf_map= new Map()  // internal Map for keeping track of calls to specific oneOf call
/**
 * Select a random element in a list useful to have some variety in the generated text
 * if the first argument is a list, selection is done within the list,
 * otherwise the selection is among the arguments
 * Implements the "mode:once" of RosaeNLG (https://rosaenlg.org/rosaenlg/4.3.0/mixins_ref/synonyms.html#_choose_randomly_but_try_not_to_repeat)
 * Select an alternative randomly, but tries not to repeat the same alternative. 
 * When all alternatives have been triggered, it will reset, but will try not run the last triggered alternative 
 * as the first new one, avoiding repetitions.
 * @param {Array | any} elems 
 * @returns the selected element, if it is a function, evaluate it with no parameter
 */
function oneOf(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    const l = elems.length;
    const elems_key = elems.toString()  // HACK: create key from the array
    let indices, idx;
    if (jsRealB_oneOf_map.has(elems_key)){
        let past_indices=jsRealB_oneOf_map.get(elems_key) // a list of past indices
        if (past_indices.length<l){
            indices=[]
            for (let i=0;i<l;i++){ 
                if (past_indices.indexOf(i)<0)
                    indices.push(i)
            }
        } else { // reset the list but avoid last index
            const last_idx = past_indices[past_indices.length-1]
            indices=[...Array(l).keys()]
            indices.splice(last_idx,1) // remove last index
            past_indices.splice(0)     // clear the array
        }
        idx = indices[Math.floor(Math.random()*indices.length)] // select index
        past_indices.push(idx)  
    } else { // first call
        indices=[...Array(l).keys()]
        idx = indices[Math.floor(Math.random()*indices.length)] // select index
        jsRealB_oneOf_map.set(elems_key,[idx])                  // initialise Map element
    }
    const e = elems[idx]
    return typeof e=='function'?e():e;
}

/**
 * Mix elements of a list in a random order.
 * If the first argument is a list, mixing is done within the list,
 * otherwise the mix is among the arguments. The original list is not modified
 * @param {Array | any} elems 
 * @returns a new list with original arguments shuffled, if an element of the list is a function, evaluate it with no parameter
 */
function mix(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    else
        elems = [...elems] // copy the original list
    // shuffle the elements adapting the algorithm given in
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
    for (let i = elems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elems[i], elems[j]] = [elems[j], elems[i]];
    }
    return elems.map(e=>typeof e=='function'?e():e);
}

/**
 * False constant: useful for evaluating jsRealB expressions written in Python
 */
const False = false;
/**
 * True constant: useful for evaluating jsRealB expressions written in Python
 */
const True  = true;
/**
 * Null constant: useful for evaluating jsRealB expressions written in Python
 */
const None  = null;

/**
 * Version number
 */
const jsRealB_version="4.6.6";
/**
 * Date of jsRealB "compile", it is set by webpack
 */
const jsRealB_dateCreated=typeof BUILDTIME == "string" ? BUILDTIME : new Date().toLocaleString("en-CA"); 

// 
/**
 * Runtime environment checking
 */
const isRunningUnderNode = typeof process !== "undefined" && process?.versions?.node;
