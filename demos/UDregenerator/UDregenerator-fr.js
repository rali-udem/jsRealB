var language="fr";
function addNewWords(lexiconDMF){
    loadFr();
    updateLexicon(lexiconDMF);
    
    addToLexicon("approfondi",{"A":{"tab":["n28"]},"N":{"g":"m","tab":["n3"]}});
    addToLexicon('infondé', {"A":{"tab":["n28"]}});
    addToLexicon("stock",{"N":{"g":"m","tab":["n3"]}});
    addToLexicon('déduit',{"A":{"tab":["n28"]}});
    addToLexicon("vice", {"A":{"tab":["n24"]}});
    
    addToLexicon("euro",{"N":{"g":"m","tab":["n3"]}})
    addToLexicon("internet",{"N":{"g":"m","tab":["n3"]}})
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    const fs = require('fs');
    lexiconDMF = JSON.parse(fs.readFileSync("../../data/lexicon-dmf.json")); 
    
    jsRealB=require("../../dist/jsRealB-node.js");
    loadFr=jsRealB.loadFr;
    addToLexicon=jsRealB.addToLexicon;
    getLemma=jsRealB.getLemma;
    getLexicon=jsRealB.getLexicon;
    updateLexicon=jsRealB.updateLexicon;
    addNewWords(lexiconDMF);
    exports.language=language;
    exports.addNewWords=addNewWords;
} 