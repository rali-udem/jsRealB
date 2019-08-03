//========== addLexicon-en.js
loadEn(false,true); // make sure additions are to the English lexicon
// ajouts au lexique de JSrealB (version dme)
addToLexicon("tsunami",{"N":{"tab":["n1"]}});
addToLexicon({"theater":{"N":{"tab":["n1"]}}}); // same as theatre


////////////////// Additions for SRST 2019
addToLexicon({"download":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}}) // like load
addToLexicon({"email":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})    // like mail
addToLexicon({"e-mail":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})   // like mail
addToLexicon({"ecommerce":{"N":{"tab":["n5"]}}})               // commerce
addToLexicon({"e-commerce":{"N":{"tab":["n5"]}}})
addToLexicon({"database":{"N":{"tab":["n1"]}}})                // like base Noun       
addToLexicon({"data-base":{"N":{"tab":["n1"]}}})               // like base Noun
addToLexicon({"browser":{"N":{"tab":["n1"]}}})                 // like dowser

addToLexicon({"euro":{"N":{"tab":["n1"]}}})                    // like bistro
addToLexicon({"fax":{"N":{"tab":["n2"]},"V":{"tab":"v2"}}})    // like tax
addToLexicon({"color":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})  // color
addToLexicon({"center":{"N":{"tab":["n1"]},"V":{"tab":"v3"}}}) // centre
addToLexicon({"something":{"N":{"tab":["n1"]}}})               // like thing, already there as pronoun
addToLexicon({"defense":{"N":{"tab":["n1"]}}})                 //  defence

//  but I am not always sure that the POS are appropriate
addToLexicon({"please":{"N":{"tab":["n5"]}}}) // interjections are invariable nouns in dme...

var determiners=[
    "this","these"
]
determiners.forEach(function(det){
    addToLexicon(det,{"D":{"tab":["d5"]}})
})

var prepositions=[
    "as","not","than","because"
];
prepositions.forEach(function(prep){
    addToLexicon(prep,{"P":{"tab":["pp"]}})
})

var adverbs=[
    "how","when","there","why","much","where","up","down","most","more","on","off",
    "too","super","of","further","twice","for"
]
adverbs.forEach(function(adv){
    addToLexicon(adv,{"Adv":{"tab":["b1"]}})
})

var adjectives=[
    "other","many","more","own","much","such","next","most","several","else","enough","less","top",
    "another","further","least","more","last","same","own","most","favorite","jewish"
];
adjectives.forEach(function(adj){
    addToLexicon(adj,{"A":{"tab":["a1"]}})
})

// relating to a nation or noun
// many of these are already there starting with a Capital
var adjectiveNouns = [
"african","american","arab","arabian","arabic","argentinian","asian","bosnian","brazilian",
"british","canadian","chinese","egyptian","english","european","french","indian","iranian",
"iraqi","irish","islamist","israeli","italian","jamaican","japanese","jew","jordanian","kurdish",
"lebanese","malaysian","mexican","norwegian","pakistani","palestinian","parisian",
"russian","scottish","sicilian","spanish","swedish","syrian","vietnamese"
];
adjectiveNouns.forEach(function(adjN){
    addToLexicon(adjN,{"A":{"tab":["a1"]},"N":{"tab":["n1"]}});
})
//////////////////

// ajouts pour les textes de biologie (fréquence plus de 50 dans amr-ISI/amr-release-{dev|test|training}.txt)
addToLexicon("mutate",{"V":{"tab":"v3"}});        // 1408
addToLexicon("phosphorylate",{"V":{"tab":"v3"}}); // 1329
addToLexicon("downregulate",{"V":{"tab":"v3"}});  // 160
addToLexicon("overexpress",{"V":{"tab":"v2"}});   // 138
addToLexicon("upregulate",{"V":{"tab":"v3"}});    // 121
addToLexicon("culture",{"V":{"tab":"v3"}});       // 112
addToLexicon("transfect",{"V":{"tab":"v1"}});     // 111
addToLexicon("metastasize",{"V":{"tab":"v3"}});   // 62
addToLexicon("immunoprecipitate",{"V":{"tab":"v3"}}); //52
addToLexicon("phosphorylation",{"N":{"tab":["n5"]}});  //52
addToLexicon("ubiquinate",{"V":{"tab":"v3"}});        //51
