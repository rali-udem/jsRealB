// for CommonJS script
// let jsRealB=require("jsrealb")
// the following assignments are also possible in ES module
import jsRealB from "jsrealb"
// let {default:jsRealB} = await import("jsrealb") 

// make exports availablle in the global scope
Object.assign(globalThis,jsRealB)

// realize the English sentence : "The cats will chase the mouse."
loadEn(true)
console.log(""+S(NP(D("the"),N("cat")),VP(V("chase"),NP(D("the"),N("mouse")))).n("p").t("f"))
