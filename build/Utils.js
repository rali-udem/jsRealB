/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";
// https://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
function extend(base, sub) {
    // Avoid instantiating the base class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite 
    // the existing prototype, but still maintain the inheritance chain
    const origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (let key in origProto) {
        sub.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    sub.prototype.constructor = sub;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like this instead
    Object.defineProperty(sub.prototype, 'constructor', {
        enumerable: false,
        value: sub
    });
}

// create a quoted string taking account possible escaping
function quote(s){
    if (typeof s != "string")return s;
    if (s.indexOf("'")<0)return "'"+s+"'"; // try with single quotes
    if (s.indexOf('"')<0)return '"'+s+'"'; // try with double quotes
    return '"'+s.replace('"','\\"')+'"';   // double quotes escaping double quotes 
}

function loadEn(trace,lenient){
    currentLanguage="en";
    if (trace===true)console.log("English lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implemented");
}

function loadFr(trace,lenient){
    currentLanguage="fr";
    if (trace===true)console.log("Règles et lexique français chargés");
    if (lenient==true)console.log("Le mode Lenient n'est pas implanté");
}

//// add to lexicon and return the updated object
///    to remove from lexicon (give null as newInfos)
var addToLexicon = function(lemma,newInfos,lang){
    let lexicon = getLexicon(lang)
    if (newInfos === null){ // remove key
        if (lexicon[lemma] !== undefined){
            delete lexicon[lemma]
        }
        return
    }
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    const infos=lexicon[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        for (var ni in newInfos) {
            infos[ni]=newInfos[ni]
        }
        lexicon[lemma]=infos
    } else {
        lexicon[lemma]=newInfos
    }
    return lexicon[lemma]
}

/// update current lexicon by "merging" the new lexicon with the current one
//     i.e. adding new key-value pairs and replacing existing key-value pairs with the new one
//     newLexicon is a single object with the "correct" structure
var updateLexicon = function(newLexicon,lang){
    let lexicon = getLexicon(lang);
    Object.assign(lexicon,newLexicon)
}

//// get lemma from lexicon (useful for debugging )
var getLemma = function(lemma,lang){
    return getLexicon(lang)[lemma];
}

// return the current realization language
var getLanguage = function(){
    return currentLanguage;
}

// return the current lexicon
var getLexicon = function(lang){
    if (lang===undefined)lang=currentLanguage;
    return lang=="fr"?lexiconFr:lexiconEn;    
}

// Flag for quoting out of vocabulary tokens
var quoteOOV=false;
var setQuoteOOV = function(qOOV){
    quoteOOV=qOOV
}

// reorder VP complements by increasing length
//  undocumented feature, seems "useful" for AMR to text generation
var reorderVPcomplements=false;
var setReorderVPcomplements = function(reorder){
    reorderVPcomplements=reorder;
}

//// select a random element in a list useful to have some variety in the generated text
//  if the first argument is a list, selection is done within the list
//  otherwise the selection is among the arguments 
//   (if the selected element is a function, evaluate it with no parameter)
var oneOf = function(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    const e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
}

//// useful variables for evaluating jsRealB expressions written in Python
var False = false;
var True  = true;
var None  = null;

// version and date informations
var jsRealB_version="4.1";
var jsRealB_dateCreated=new Date(); // might be changed by the makefile 
