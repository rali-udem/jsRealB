import jsRealB from "../../dist/jsRealB.js"
Object.assign(globalThis,jsRealB);

import {phones} from "./tuto.js"

import { English } from "./English.js";
import { Francais } from "./Francais.js";

const english = new English()
const francais = new Francais()
for (let phone of phones){
    console.log("<p>"+english.realizePhone(phone)+"</p>")
    console.log("<p>"+francais.realizePhone(phone)+"</p>")
}
