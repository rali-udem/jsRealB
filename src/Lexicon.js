
/**
   jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2022
 */

////  this is still experimental and not supported by Safari and Firefox
import LexiconEn from "../data/lexicon-en.json" assert { type: 'json' };
import LexiconFr from "../data/lexicon-fr.json" assert { type: 'json' };
import rulesEn from "../data/rules-en.json" assert { type: 'json' };
import rulesFr from "../data/rules-fr.json" assert { type: 'json' };
export {copulesFR,negMod,prepositionsList,modalityVerbs,
        loadEn,loadFr,addToLexicon,updateLexicon,getLemma,getLanguage,getLexicon,getRules,
        quoteOOV,setQuoteOOV,reorderVPcomplements,setReorderVPcomplements}

// hidden variables 
const lexicon = {"en":LexiconEn,"fr":LexiconFr};
const rules   = {"en":rulesEn,  "fr":rulesFr};

let language  = "en";

// French copula verbs
const copulesFR=["être","paraître","sembler","devenir","rester"];
// negation of modal auxiliaries
const negMod={"can":"cannot","may":"may not","shall":"shall not","will":"will not","must":"must not",
            "could":"could not","might":"might not","should":"should not","would":"would not"};  
// all prepositions from lexicon-en|fr.js (used for implementing int:"woi|wai|whn|whe"
// tail +2 lexicon-en|fr.js | jq 'to_entries | map(select(.value|has("P"))|.key )'
const prepositionsList = {
    "en":{
        "all":new Set([ "about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "amongst", "around", "as", "at", "back", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "by", "concerning", "considering", "despite", "down", "during", "except", "for", "from", "in", "inside", "into", "less", "like", "minus", "near", "next", "of", "off", "on", "onto", "outside", "over", "past", "per", "plus", "round", "since", "than", "through", "throughout", "till", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "with", "within", "without" ] ),
        "whe":new Set(["above", "across", "along", "alongside", "amid","around", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "in", "inside", "into", "near", "next", "onto", "outside", "over", "past","toward", "towards", "under", "underneath","until","via","within",  ]),
        "whn":new Set(["after", "before", "during","since",  "till", ]),
    },
    "fr":{
        "all":new Set([ "à", "après", "avant", "avec", "chez", "contre", "d'après", "dans", "de", "dedans", "depuis", "derrière", "dès", "dessous", "dessus", "devant", "durant", "en", "entre", "hors", "jusque", "malgré", "par", "parmi", "pendant", "pour", "près", "sans", "sauf", "selon", "sous", "sur", "vers", "via", "voilà" ]),
        "whe":new Set(["après", "avant", "chez","dans",  "dedans","derrière","dessous", "dessus", "devant","entre", "hors","près","sous", "sur", "vers", "via",]),
        "whn":new Set(["après", "avant","depuis", "dès","durant", "en","pendant",]),
    }
}

const modalityVerbs=["vouloir","devoir","pouvoir"]

/**
 * Set current language to "en" English
 * @param {boolean?} trace if given and true, write message on the console
 */
function loadEn(trace=false){
    language="en";
    if (trace)console.log("English lexicon and rules loaded")
}
/**
 * Set current language to "fr" French
 * @param {boolean?} trace if given and true, write message on the console
 */
function loadFr(trace=false){
    language="fr";
    if (trace)console.log("Règles et lexique français chargés")
}

/**
 * Add new info or replace lexical information about a lemma
 * With a single object, then the key is the lemma to change
 * Existing info about a lemma that is not specified stays unchanged
 * 
 * @param {string|object} lemma lemma to change
 * @param {object|null} newInfos new information, if null delete the entry
 * @param {string?} lang language in which to change, otherwise use current language
 * @returns changed entry for lemma 
 */
function addToLexicon(lemma,newInfos,lang){
    let lex = getLexicon(lang)
    if (newInfos === null){ // remove key
        if (lex[lemma] !== undefined){
            delete lex[lemma]
        }
        return
    }
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    const infos=lex[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        Object.assign(lex[lemma],newInfos)
    } else {
        lex[lemma]=newInfos
    }
    return lex[lemma]
}

/**
 * Update current lexicon by "merging" the new lexicon with the current one
 *    i.e. adding new key-value pairs and replacing existing key-value pairs with the new one
 * @param {Object} newLexicon a single object with the "correct" structure
 */
function updateLexicon(newLexicon){
    let lexicon = getLexicon(language);
    Object.assign(lexicon,newLexicon)
}

/**
 * Get lemma information from the lexicon
 * @param {string} lemma to query
 * @param {("en"|"fr")?} lang 
 */
function getLemma(lemma,lang){
    return getLexicon(lang)[lemma];
}

/**
 * @returns the current realization language
 */
function getLanguage(){
    return language;
}

/**
 * @param {("en"|"fr")?} lang language for the lexicon, if undefined then the current language
 * @returns the lexicon of the specified language
 */
function getLexicon(lang){
    if (lang!==undefined)
        return lexicon[lang];
    return lexicon[language]
}

/**
 * @param {("en"|"fr")?} lang language for the rules, if undefined then the current language
 * @returns the rules of the specified language
 */
function getRules(lang){
    if (lang!==undefined)
        return rules[lang];
    return rules[language]
}
 
let quoteOOV=false;
/**
 * Set flag for quoting out of vocabulary tokens, otherwise a warning is issued
 * @param {boolean} qOOV 
 */
function setQuoteOOV (qOOV){
    quoteOOV=qOOV
}

let reorderVPcomplements=false;
/**
 * Flag for reordering VP complements by increasing length
 * Undocumented feature, seemed "useful" for AMR to text generation
 * @param {boolean} reorder 
 */
function setReorderVPcomplements(reorder){
    reorderVPcomplements=reorder;
}

