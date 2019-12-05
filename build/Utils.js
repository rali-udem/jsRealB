/**
    jsRealB 2.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */

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

function contains(arr,elem){
    return arr.indexOf(elem)>=0;
}

function loadEn(trace,lenient){
    currentLanguage="en";
    lexicon=lexiconEn;
    rules=ruleEn;
    defaultProps={g:"n",n:"s",pe:3,t:"p"};  // language dependent default properties
    if (trace===true)console.log("English lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implement");
}

function loadFr(trace,lenient){
    currentLanguage="fr";
    lexicon=lexiconFr;
    rules=ruleFr;
    defaultProps={g:"m",n:"s",pe:3,t:"p",aux:"av"};  // language dependent default properties 
    if (trace===true)console.log("French lexicon and rules loaded");
    if (lenient==true)console.log("Lenient mode not implement");
}

//// add to lexicon and return the updated object
///    to remove from lexicon (pass undefined as newInfos)
var addToLexicon = function(lemma,newInfos){
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    const infos=lexicon[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        for (ni in newInfos) {
            infos[ni]=newInfos[ni]
        }
        lexicon[lemma]=infos
        return infos
    } else {
        lexicon[lemma]=newInfos
        return newInfos
    }
}

/// update current lexicon by "merging" the new lexicon with the current one
//     i.e. adding new key-value pairs and replacing existing key-value pairs with the new one
//     newLexicon is a single object with the "correct" structure
var updateLexicon = function(newLexicon){
    Object.assign(lexicon,newLexicon)
}

//// get lemma from lexicon (useful for debugging )
var getLemma = function(lemma){
    return lexicon[lemma];
}

// return the current realization language
var getLanguage = function(){
    return currentLanguage;
}

//// select a random element in a list useful to have some variety in the generated text
//  if the first argument is a list, selection is done within the list
//  otherwise the selection is among the arguements 
//   (if the selected element is a function, evaluate it with no parameter)
var oneOf = function(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
}

// set the flag so that a warning generates an exception
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

var jsRealB_version="3.0";
var jsRealB_dateCreated=new Date(); // might be changed in the makefile 
