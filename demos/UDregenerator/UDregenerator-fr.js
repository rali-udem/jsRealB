var language="fr";
function addNewWords(){
    loadFr();
    
    addToLexicon("approfondi",{"A":{"tab":"n28"},"N":{"g":"m","tab":"n3"}});
    addToLexicon('infondé', {"A":{"tab":"n28"}});
    addToLexicon("stock",{"N":{"g":"m","tab":"n3"}});
    addToLexicon("vice", {"A":{"tab":"n24"}});
    
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