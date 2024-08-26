/**
    jsRealB 5.0
    Guy Lapalme, lapalme@iro.umontreal.ca, December 2023

    Import all functions and classes of the jsRealB system and export them in one package
    It also adds many utility functions and constants
 */

import { Constituent } from "./Constituent.js";

import { Terminal } from "./Terminal.js"
import { English_terminal } from "./Terminal-en.js";
import { French_terminal } from "./Terminal-fr.js";

import { English_non_terminal } from "./NonTerminal-en.js";
import { French_non_terminal } from "./NonTerminal-fr.js";

import { Phrase } from "./Phrase.js"
import { English_phrase } from "./Phrase-en.js";
import { French_phrase } from "./Phrase-fr.js";

import { Dependent } from "./Dependent.js"
import { English_dependent } from "./Dependent-en.js";
import { French_dependent } from "./Dependent-fr.js";

import {loadFr, loadEn, addToLexicon, getLanguage, getLemma, getLexicon, getRules, setReorderVPcomplements, setQuoteOOV} from "./Lexicon.js"
import {fromJSON, ppJSON} from "./JSON-tools.js"

export {Constituent, Terminal, Phrase, Dependent, 
        loadFr, loadEn, addToLexicon, getLanguage, getLemma, getLexicon, getRules, setReorderVPcomplements, setQuoteOOV,
        fromJSON, ppJSON,
        getElems, exceptionOnWarning, setExceptionOnWarning, resetSavedWarnings, getSavedWarnings, savedWarnings,
        load, oneOf, choice, mix, jsRealB_version, jsRealB_dateCreated, isRunningUnderNode,
        Terminal_en, Terminal_fr, terminal, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
        Phrase_en, Phrase_fr, phrase, S, NP, AP, VP, AdvP, PP, CP, SP,
        Dependent_en, Dependent_fr, dependent, root, subj, det, mod, comp, coord,
}

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
                Array.prototype.push.apply(res, getElems(e)); // recursive call
            } else
                res.push(e);
        }
    }
    return res;
}

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

function shuffle(elems){
    // shuffle the elements adapting the algorithm given in
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
    for (let i = elems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [elems[i], elems[j]] = [elems[j], elems[i]];
    }
}

let jsRealB_oneOf_map= new Map()  // internal Map for keeping track of calls to specific oneOf call
/**
 * Select a random element in a list useful to have some variety in the generated text
 * if the first argument is a list, selection is done within the list,
 * otherwise the selection is among the arguments
 * Implements the "mode:once" of RosaeNLG (https://rosaenlg.org/rosaenlg/4.3.0/mixins_ref/synonyms.html#_choose_randomly_but_try_not_to_repeat)
 * Select an alternative randomly, but tries not to repeat the same alternative. 
 * When all alternatives have been triggered, it will reset, but will not run the last triggered alternative 
 * as the first new one, avoiding repetitions.
 * If a <i>classical</i> random selection is preferred, use: choice(elems)
 * @param {Array | any} elems 
 * @returns the selected element, if it is a function, evaluate it with no parameter, null on an empty list
 */
function oneOf(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    let indices, idx;
    const l = elems.length;
    if (l == 0) return null;
    if (l == 1) 
        idx=0;
    else {
        const elems_key = elems.toString()  // HACK: create key from the array
        if (!jsRealB_oneOf_map.has(elems_key)){ // first call
            indices=[...Array(l).keys()] // a list of indices to return
            shuffle(indices)
            idx = indices.pop() // select last element as index
            jsRealB_oneOf_map.set(elems_key,indices) // initialise Map element
        } else {
            indices=jsRealB_oneOf_map.get(elems_key) // get shuffled indices
            idx = indices.pop()  // return last élement as index
            if (indices.length==0) { // reset the shuffled list but avoid last index
                indices=[...Array(l).keys()] // a list of indices to return
                shuffle(indices)
                const last = indices.length-1
                if (indices[last]==idx){ 
                    // swap first and last so that last will not be returned next time
                    [indices[0],indices[last]]=[indices[last],indices[0]]
                }
                jsRealB_oneOf_map.set(elems_key,indices) // reset Map element
            }
        }
    }
    const e = elems[idx]
    return typeof e=='function'?e():e;
}

/**
 * Select a random element in a list useful to have some variety in the generated text
 * if the first argument is a list, selection is done within the list,
 * otherwise the selection is among the arguments
 * @param {Array | any} elems 
 * @returns the selected element, if it is a function, evaluate it with no parameter, null on an empty list
 */
function choice(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    let idx;
    const l = elems.length;
    if (l == 0) return null;
    if (l == 1) 
        idx=0;
    else {
        idx = Math.floor(Math.random()*l)
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
    // // shuffle the elements adapting the algorithm given in
    // // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
    // for (let i = elems.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [elems[i], elems[j]] = [elems[j], elems[i]];
    // }
    shuffle(elems)
    return elems.map(e=>typeof e=='function'?e():e);
}

/**
 * Version number
 */
const jsRealB_version="5.1";
/**
 * Date of jsRealB "compile", it is set by webpack
 */
const jsRealB_dateCreated=typeof BUILDTIME == "string" ? BUILDTIME : new Date().toLocaleString("en-CA"); 

// 
/**
 * Runtime environment checking
 */
const isRunningUnderNode = typeof process !== "undefined" && process?.versions?.node;

/**
 * When true, throw an exception on Warning instead of only writing on the console
 */
let exceptionOnWarning=false;
/**
 * if this is set to an array then warnings will be pushed on this array, 
 * so that all warnings can be returned in one bunch to the caller which has
 * to resetSavedWarnings() once it has called getSavedWarnings() 
 */
let savedWarnings=undefined;    

/**
 * Sets the flag so that a warning also generates an exception
 * @param {boolean} val 
 */
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

/**
 * Resets the list of saved warnings, so that the next warn calls
 * add the warning to this list instead of writing them to the console
 * Useful, to show the warning to the user web page.
 */
function resetSavedWarnings(){
    savedWarnings=[]
}

/**
 * Returns the current list of saved warnings. 
 * CAUTION: it DOES NOT reset the list
 * @returns the list of saved warnings
 */
function getSavedWarnings(){
    return savedWarnings || [];
}

///////////////////////////////////////////////////////////////////////
///    User factory functions
///

/**
 * Empty class for an English terminal 
 *
 * @class Terminal_en
 * @typedef {Terminal_en}
 * @extends {English_terminal(Terminal)}
 */
class Terminal_en extends English_terminal(Terminal){}
/**
 * Empty class for a French Terminal
 *
 * @class Terminal_fr
 * @typedef {Terminal_fr}
 * @extends {French_terminal(Terminal)}
 */
class Terminal_fr extends French_terminal(Terminal){}

/**
 * Create an instance of a language specific Terminal according to the current language
 *
 * @param {string} terminalType
 * @param {string} lemma
 * @returns {(Terminal_en | Terminal_fr)}
 */
function terminal(terminalType,lemmaArr){
    let lang;
    if (lemmaArr.length==1){
        lang = getLanguage()
    } else {
        lang = lemmaArr[1]
    }
    return lang=="en" ? new Terminal_en(lemmaArr,terminalType) 
                      : new Terminal_fr(lemmaArr,terminalType)
}

/**
 * Creates a Noun terminal
 * @param {...string} lemma with an optional language
 * @returns {(Terminal_en | Terminal_fr)}
 */
function N(...lemma){return terminal("N",lemma)}

/**
 * Creates an Adjective Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NA as constType
 */
function A(...lemma){return terminal("A",lemma)} 

/**
 * Creates a Pronoun Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with Pro as constType
 */
function Pro(...lemma){return terminal("Pro",lemma)} 

/**
 * Creates a Determiner Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with D as constType
 */
function D(...lemma){return terminal("D",lemma)}

/**
 * Creates a Verb Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NV as constType
 */
function V(...lemma){return terminal("V",lemma)} 

/**
 * Creates an Adverb Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with N as constType
 */
function Adv(...lemma){return terminal("Adv",lemma)} 

/**
 * Creates a Conjunction Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with C as constType
 */
function C(...lemma){return terminal("C",lemma)} 

/**
 * Creates a Preposition Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with P as constType
 */
function P(...lemma){return terminal("P",lemma)}

/**
 * Creates a Date Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with DT as constType
 */
function DT(...lemma){return terminal("DT",lemma)}

/**
 * Creates a Number Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with NO as constType
 */
function NO(...lemma){return terminal("NO",lemma)} 

/**
 * Creates a Quoted String Terminal
 * @param {...string} _ lemma with optional language 
 * @returns Terminal with Q as constType
 */
function Q(...lemma){return terminal("Q",lemma)} 

/**
 * Empty class for an English Phrase
 *
 * @class Phrase_en
 * @typedef {Phrase_en}
 * @extends {English_phrase(English_non_terminal(Phrase))}
 */
class Phrase_en extends English_phrase(English_non_terminal(Phrase)){}
/**
 * Empty class for a French Phrase
 *
 * @class Phrase_fr
 * @typedef {Phrase_fr}
 * @extends {French_phrase(French_non_terminal(Phrase))}
 */
class Phrase_fr extends French_phrase(French_non_terminal(Phrase)){}

/**
 * Create an instance of a language specific Phrase according to the current language
 *
 * @param {*} phraseType
 * @param {*} elements
 * @returns {(Phrase_en | Phrase_fr)}
 */
function phrase(phraseType,elements){
    return getLanguage()=="en" ? new Phrase_en(elements,phraseType,"en") 
                               : new Phrase_fr(elements,phraseType,"fr")
}

/**
 * Creates a Sentence Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with S as constType
 */
function S(...elements){return phrase("S",elements)}

/**
 * Creates a Noun Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with NP as constType
 */
function NP(...elements){return phrase("NP",elements)}

/**
 * Creates a Adjective Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with AP as constType
 */
function AP(...elements){return phrase("AP",elements)}

/**
 * Creates a Verb Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with VP as constType
 */
function VP(...elements){return phrase("VP",elements)}

/**
 * Creates a Adverb Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with AdvP as constType
 */
function AdvP(...elements){return phrase("AdvP",elements)}

/**
 * Creates a Preposition Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with PP as constType
 */
function PP(...elements){return phrase("PP",elements)}

/**
 * Creates a Coordinate Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with CP as constType
 */
function CP(...elements){return phrase("CP",elements)}

/**
 * Creates a Subordinate Phrase
 * @param {Constituent[]} list of children Constituents
 * @returns Phrase with SP as constType
 */
function SP(...elements){return phrase("SP",elements)}

/**
 * Empty class for an English dependent
 *
 * @class Dependent_en
 * @typedef {Dependent_en}
 * @extends {English_dependent(English_non_terminal(Dependent))}
 */
class Dependent_en extends English_dependent(English_non_terminal(Dependent)){}
/**
 * Empty class for a French Dependent
 *
 * @class Dependent_fr
 * @typedef {Dependent_fr}
 * @extends {French_dependent(French_non_terminal(Dependent))}
 */
class Dependent_fr extends French_dependent(French_non_terminal(Dependent)){}

/**
 * Create an instance of a specific Dependent according to the current language
 *
 * @param {*} deprel
 * @param {*} dependents
 * @returns {(Dependent_en | Dependent_fr)}
 */
function dependent(deprel,dependents){
    return getLanguage()=="en" ? new Dependent_en(dependents,deprel,"en") 
                               : new Dependent_fr(dependents,deprel,"fr")
}

/**
 * Creates a root
 * @param {...Constituent} _ a Terminal possibly followed by Dependents
 * @returns Dependent with root as constType
 */
 function root(...dependents){return dependent("root",dependents)}

 /**
  * Creates a subj
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with subj as constType
  */
 function subj(...dependents){return dependent("subj",dependents)}

 /**
  * Creates a det
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with det as constType
  */
function det(...dependents){return dependent("det",dependents)}

 /**
  * Creates a mod
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with mod as constType
  */
function mod(...dependents){return dependent("mod",dependents)}

 /**
  * Creates a comp
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with comp as constType
  */
function comp(...dependents){return dependent("comp",dependents)}

 /**
  * Creates a coord
  * @param {...Constituent} _ a Terminal possibly followed by Dependents
  * @returns Dependent with coord as constType
  */
function coord(...dependents){return dependent("coord",dependents)}
