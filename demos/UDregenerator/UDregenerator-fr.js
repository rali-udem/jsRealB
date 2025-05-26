import { UDregeneratorLoad } from "./UDregenerator.js";
import { initUD } from "./UDinit-fr.js";
import { initSUD} from "./SUDinit-fr.js";
import "./UDnode-fr.js";
export {addNewWords}

function addNewWords(){
    loadFr();
    
    addToLexicon("approfondi",{"A":{"tab":"n28"},"N":{"g":"m","tab":"n3"}});
    addToLexicon('infondé', {"A":{"tab":"n28"}});
    addToLexicon("stock",{"N":{"g":"m","tab":"n3"}});
    addToLexicon("vice", {"A":{"tab":"n24"}});
    
    // mots fréquemment rencontrés, mais qui semblent douteux à ajouter au dictionnaire pour tous
    addToLexicon("parce",{"C":{"tab":"cj"}}); // idem que "parce que"
    addToLexicon("sahraoui",{"N":{"g":"x","tab":"n28"},"A":{"g":"x","tab":"n28"}})
    addToLexicon("comme",{"P":{"tab":"ppe"}})
}

if (!(typeof process !== "undefined" && process?.versions?.node)){ // cannot use isRunningUnderNode yet!!!
    Object.assign(globalThis,jsRealB);
    UDregeneratorLoad("fr",initUD,initSUD,addNewWords);
}