if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
}

var language="en";
function addNewWords(lexiconDME){
    loadEn();
    updateLexicon(lexiconDME);
    // add some words to the lexicon some taken from 
    //    /Users/lapalme/Dropbox/AMR/jsRealB/addLexicon-dme.js    
    addToLexicon("responsively",{ Adv: { "tab":"b1" } });
    
    const prepositions=[
        "as","not","than","because","due"
    ];
    prepositions.forEach(function(prep){
        addToLexicon(prep,{"P":{"tab":"pp"}})
    })

    const adverbs=[
        "how","when","there","why","much","where","up","down","most","more","less","on","off",
        "too","super","of","further","twice","for","least"
    ]
    adverbs.forEach(function(adv){
        addToLexicon(adv,{"Adv":{"tab":"b1"}})
    })

    const adjectives=[
        "other","many","more","own","much","such","next","most","several","else","enough","top",
        "another","further","least","more","last","same","own","most","favorite","jewish",
        "terrorist","painted"
    ];
    adjectives.forEach(function(adj){
        addToLexicon(adj,{"A":{"tab":"a1"}})
    })
    
    addToLexicon("layout",{ N: { "tab":"n1" } });
    addToLexicon("am",{ N: { "tab":"n5" } });
    addToLexicon("pm",{ N: { "tab":"n5" } });
    addToLexicon("moving",{ A: { "tab":"a1" } });
    addToLexicon("last",{ A: { "tab":"a1" } });
    
    addToLexicon("e-mail",getLemma("mail"));
    addToLexicon("email",getLemma("mail"));
    
    // accept nationalities also starting with a lower case
    // we use a crude test for finding lemma indentying nationalities words ending in an and starting with a capital
    const nationalities = Object.keys(getLexicon()).filter(l=>/^[A-Z].*an$/.test(l)); 
    nationalities.push("British");
    nationalities.push("English");
    nationalities.push("French");
    nationalities.push("Hebrew");
    nationalities.push("Iraqi");
    nationalities.push("Arab");
    for (const n of nationalities){
        addToLexicon(n.toLowerCase(),getLemma(n));
    }
    
    // although I feel that these should be flagged as an error... they happen too often!
    addToLexicon("best",{ A: { "tab":"a1" } });
    addToLexicon("better",{ A: { "tab":"a1" } });
    addToLexicon("&",getLemma("and"));
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    const fs = require('fs');
    const lexiconDME = JSON.parse(fs.readFileSync("../../data/lexicon-dme.json")); 
    
    jsRealB=require("../../dist/jsRealB-node.js");
    loadEn=jsRealB.loadEn;
    addToLexicon=jsRealB.addToLexicon;
    updateLexicon=jsRealB.updateLexicon;
    getLemma=jsRealB.getLemma;
    getLexicon=jsRealB.getLexicon;
    addNewWords(lexiconDME);
    exports.language=language;
    exports.addNewWords=addNewWords;
} else {
    // after loading the web page
    d3.select(window).on("load",UDregeneratorLoad);     
}