// add specialized words to the lexion

loadFr();
dmf = require("../data/lexicon-dmf.json")
updateLexicon(dmf)
console.log("dmf loaded:%d entries",Object.keys(dmf).length)
addToLexicon("ennuagement",{"N":{"g":"m","tab":["n3"]}})

loadEn();
addToLexicon({"gust":{"N":{"tab":["n5"]},"V":{"tab":"v1"}}})
addToLexicon({"cloudiness":{"N":{"tab":["n2"]}}})