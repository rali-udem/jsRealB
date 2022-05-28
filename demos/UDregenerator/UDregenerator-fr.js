var language="fr";
function addNewWords(){
    loadFr();
    
    addToLexicon("approfondi",{"A":{"tab":"n28"},"N":{"g":"m","tab":"n3"}});
    addToLexicon('infondé', {"A":{"tab":"n28"}});
    addToLexicon("stock",{"N":{"g":"m","tab":"n3"}});
    addToLexicon("vice", {"A":{"tab":"n24"}});
    
    // mots fréquemment rencontrés, mais qui semblent douteux à ajouter au dictionnaire pour tous
    addToLexicon("parce",{"C":{"tab":"cj"},"basic":true}); // idem que "parce que"
    addToLexicon("sahraoui",{"N":{"g":"x","tab":"n28"},"A":{"g":"x","tab":"n28"}})
    addToLexicon("comme",{"P":{"tab":"ppe"}})
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module    
    jsRealB=require("../../dist/jsRealB-node.js");
    loadFr=jsRealB.loadFr;
    addToLexicon=jsRealB.addToLexicon;
    getLemma=jsRealB.getLemma;
    getLexicon=jsRealB.getLexicon;
    updateLexicon=jsRealB.updateLexicon;
    exports.language=language;
    exports.addNewWords=addNewWords;
} else {
    // after loading the web page
    d3.select(window).on("load",UDregeneratorLoad);     
}