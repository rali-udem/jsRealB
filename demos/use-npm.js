// example of use of the npm jsrealb 
//   after have executed
//   npm install jsrealb 
var jsRealB=require("jsrealb")
// import exports in current scope
for (var v in jsRealB)
        eval(v+"=jsRealB."+v);
// show the version and date of jsRealB
console.log(jsRealB_version+"::"+jsRealB_dateCreated)
// realize a sentence in English : "The cats will chase the mouse."
loadEn(true)
console.log(""+S(NP(D("the"),N("cat")),VP(V("chase"),NP(D("the"),N("mouse")))).n("p").t("f"))
// réaliser une phrase en français : "Les chats ont chassé la souris."
loadFr(true)
console.log(""+S(NP(D("le"),N("chat")),VP(V("chasser"),NP(D("le"),N("souris")))).n("p").t("pc"))
