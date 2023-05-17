import { readFileSync, writeFileSync } from 'fs';

const data_en =  readFileSync('/Users/lapalme/Desktop/Phrases-Bing/phrases-en.jsr', 'utf8');
const data_fr =  readFileSync('/Users/lapalme/Desktop/Phrases-Bing/phrases-fr.jsr', 'utf8');

const deps_en = data_en.trim().split("\n\n")
const deps_fr = data_fr.trim().split("\n\n")

console.log("en:",deps_en.length,"fr:",deps_fr.length)

function getVal(s){
    return s.substring(s.indexOf("=")+1)
}

let structs = [];
for (let i=0;i<deps_en.length;i++){
    const lines_en=deps_en[i].split("\n");
    if (lines_en.length<3)break;
    const lines_fr=deps_fr[i].split("\n");
    let struct = `{
    id: ${getVal(lines_en[0])},
    text: "${getVal(lines_en[1])+" | "+getVal(lines_fr[1])}",
    en : ()=>
            ${lines_en.slice(3).join("\n            ")},
    fr : ()=>
            ${lines_fr.slice(3).join("\n            ")},
    params:[]
}`;
    console.log(struct);
    structs.push(struct);
}

writeFileSync('/Users/lapalme/Desktop/Phrases-Bing/sentences-en-fr.js',
               "[\n"+structs.join(",\n")+"]",'utf-8')
