//========== addLexicon-en.js
loadEn(false,true); // make sure additions are to the English lexicon
// ajouts au lexique de JSrealB (version dme)
addToLexicon("tsunami",{"N":{"tab":["n1"]}});
addToLexicon("sushi",{"N":{"tab":["n1"]}});

////////////////// Additions for SRST 2019

// modern words 
addToLexicon({"download":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}}) //  load
addToLexicon({"upload":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})   //  load
addToLexicon({"email":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})    //  mail
addToLexicon({"e-mail":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})   //  mail
addToLexicon({"ecommerce":{"N":{"tab":["n5"]}}})                 // commerce
addToLexicon({"e-commerce":{"N":{"tab":["n5"]}}})
addToLexicon({"database":{"N":{"tab":["n1"]}}})                // base Noun       
addToLexicon({"data-base":{"N":{"tab":["n1"]}}})               // base Noun
addToLexicon({"browser":{"N":{"tab":["n1"]}}})                 // dowser
addToLexicon({"online":{"N":{"tab":["n1"]}}})                  // airline
addToLexicon({"fax":{"N":{"tab":["n2"]},"V":{"tab":"v2"}}})    // tax
addToLexicon({"smartphone":{"N":{"tab":["n1"]}}})              // gramophone
addToLexicon({"iphone":{"N":{"tab":["n1"]}}})                  // gramophone
addToLexicon({"spreadsheet":{"N":{"tab":["n1"]}}})             // time-sheet
addToLexicon({"pixel":{"N":{"tab":["n1"]}}})                   // angel
addToLexicon({"megapixel":{"N":{"tab":["n1"]}}})               // angel

addToLexicon({"euro":{"N":{"tab":["n1"]}}})                    // bistro
addToLexicon({"something":{"N":{"tab":["n1"]}}})               // thing, already there as pronoun
addToLexicon({"cupcake":{"N":{"tab":["n1"]}}})                 // bridecake
addToLexicon({"burger":{"N":{"tab":["n1"]}}})                  // hamburger
addToLexicon({"vegan":{"N":{"tab":["n1"]}}})                   // vegetarian

// american English
addToLexicon({"theater":{"N":{"tab":["n1"]}}});                // theatre
addToLexicon({"color":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})  // colour
addToLexicon({"center":{"N":{"tab":["n1"]},"V":{"tab":"v3"}}}) // centre
addToLexicon({"defense":{"N":{"tab":["n1"]}}})                 // defence
addToLexicon({"neighborhood":{"N":{"tab":["n1"]}}})            // neighbourhood
addToLexicon({"favor":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}})  // favour
addToLexicon({"flavor":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}}) // flavour
addToLexicon({"summarise":{"V":{"tab":"v3"}}})                 // summarize
addToLexicon({"civilisation":{"N":{"tab":["n1"]}}})            // civilization

addToLexicon({"there":{"Pro":{"tab":["pn6"]}}})   // invariable pronoun
addToLexicon({"all":{"Pro":{"tab":["pn6"]}}})
addToLexicon({"one":{"Pro":{"tab":["pn6"]},"N":{"tab":"n1"}}})
addToLexicon({"other":{"Pro":{"tab":["pn6"]}}})

addToLexicon("this",{"D":{"tab":["d5"]}})
addToLexicon("these",{"D":{"n":"p","tab":["d4"]}})  // should use lemma this

//  but I am not always sure that the POS are always appropriate
addToLexicon({"an":{"D":{"tab":["d4"]}}})   // should not have to do that...

var prepositions=[
    "as","not","than","because","due"
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
    "another","further","least","more","last","same","own","most","favorite","jewish",
    "terrorist"
];
adjectives.forEach(function(adj){
    addToLexicon(adj,{"A":{"tab":["a1"]}})
})

// relating to a nation or noun
// many of these are already there starting with a Capital
var adjectiveNouns = [
"african","afghan","american","arab","arabian","arabic","argentinian","armenian","asian","australian","bosnian",
"brazilian","british","canadian","chinese","egyptian","english","european","french","german","greek","indian","iranian",
"iraqi","irish","islamic","islamist","israeli","italian","jamaican","japanese","jew","jordanian","kurdish",
"lebanese","macedonian","malaysian","mexican","muslim","norwegian","pakistani","palestinian","parisian",
"Republican","russian","scottish","sicilian","spanish","swedish","sunni","syrian","thai","turkish","vietnamese"
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
