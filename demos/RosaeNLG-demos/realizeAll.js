import { phones } from "./phones.js"
import { English } from "./English.js";
import { Francais } from "./Francais.js";

if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
    // node.js version
    let {default:jsRealB} = await import("../../dist/jsRealB.js");
    Object.assign(globalThis,jsRealB);
    const english = new English()
    const francais = new Francais()
    console.log("jsRealB version of the RosaeNLG examples and tutorials")
    console.log("** English\n")
    for (let phone of phones)
        console.log("<p>"+english.realizePhone(phone)+"</p>")
    console.log("---")
    console.log(english.realizeExample())

    console.log("\n** Français\n")
    for (let phone of phones)
        console.log("<p>"+francais.realizePhone(phone)+"</p>")    
    console.log("---")
    console.log(francais.realizeExemple())
 } else {
    // used in a web page with jQuery
    $(document).ready(function() {
        Object.assign(globalThis,jsRealB);
        const english = new English()
         // English
        const $phones_en = $("#phones-en")
        for (let phone of phones){
            $phones_en.append("<p>"+english.realizePhone(phone)+"</p>")
        }
        $("#example").append(english.realizeExample())
        // français
        const francais = new Francais()
        const $phones_fr = $("#phones-fr")
        for (let phone of phones){
            $phones_fr.append("<p>"+francais.realizePhone(phone)+"</p>")
        }
        $("#exemple").append(francais.realizeExemple())
    })
 }
