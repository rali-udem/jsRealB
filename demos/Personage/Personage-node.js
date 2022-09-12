import { apply_parameters } from "./generation_parameters.js";
import {mr_values,params,add_words_to_lexicon,makeInfos,personalized_recommandation_out,personalized_recommandation} from "./Personage.js"

const exampleInfos = {  // information attributes and values used in README.js
    'name' : 'Loch Fyne',
    'area': 'city centre',
    'near': 'The Rice Boat',
    'eatType': 'restaurant',
    'familyFriendly': 'no',
    'food': 'fast food',
}

let dataFileName="./data/personage-nlg-test.jsonl"
add_words_to_lexicon();
if (false){ // generate the example used in README.md
    for (let pers of mr_values.personality){
        console.log("%s | %s ",pers, personalized_recommandation(params,pers,exampleInfos,apply_parameters));
    }
} else {  // generate from data file
    // taken from  https://bobbyhadz.com/blog/javascript-dirname-is-not-defined-in-es-module-scope
    let path=await import("path")
    let {fileURLToPath} = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    dataFileName=path.resolve(__dirname,dataFileName)
    let fs = await import("fs")
    const lines = fs.readFileSync(dataFileName,'utf-8').trim().split("\n")
    setExceptionOnWarning(true);
    let nb=0;
    for (const line of lines.slice(0,undefined)) {
        personalized_recommandation_out(params,makeInfos(line),apply_parameters);
        nb++;
    }
    console.log("%d meaning representations processed",nb)
}
