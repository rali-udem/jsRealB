import jsRealB from "../dist/jsRealB.js"
Object.assign(globalThis,jsRealB);

import {addExp, en,fr,enfr} from "./examples-functions-module.js"

addExp(en());
addExp(fr());
addExp(enfr());
