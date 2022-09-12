/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022

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
        oneOf, False, True, None, jsRealB_version, jsRealB_dateCreated, isRunningUnderNode}

/**
 * Select a random element in a list useful to have some variety in the generated text
 * if the first argument is a list, selection is done within the list,
 * otherwise the selection is among the arguments 
 * @param {Array | any} elems 
 * @returns the selected element, if it is a function, evaluate it with no parameter
 */
function oneOf(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    const e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
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
const jsRealB_version="4.5";
/**
 * Date of jsRealB "compile", it is  set by webpack
 */
const jsRealB_dateCreated=BUILDTIME; // BUILDTIME is set by webpack

// 
/**
 * Runtime environment checking
 */
const isRunningUnderNode = typeof process !== "undefined" && process?.versions?.node;
