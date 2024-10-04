// Conversation avec Eliza 
// ATTENTION: dans VSCODE, il faut utiliser la console "terminal" et non "debug" comme pour les autres applications

import {elizaInitials, elizaQuits, elizaFinals, enKeys, 
       select, choose, tokenizeFr,getTerminals, 
       getKeyword, getQuestion} from "./eliza.js"
       
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
const rl = readline.createInterface({ input, output });

// configuration du dialogue
let user_gender="f";
let eliza_gender="f";
let use_majestic= true;
let trace = false

function ask(fn,groups){
    return fn(groups,user_gender).typ({"maje":use_majestic}).realize()+"\n"
}

async function talkWithEliza(){
    let prompt = ask(choose(elizaInitials,[]));
    while(true) {
        let userInput = await rl.question(prompt);
        if (elizaQuits.includes(userInput.toLowerCase())){// dernière question
            console.log(ask(choose(elizaFinals),[])) 
            rl.close()
            break;
        } else {
            let terminals = tokenizeFr(userInput).map(getTerminals);
            const keyWord = getKeyword(terminals);  // trouver le bon mot-clé
            if (keyWord==null){
                prompt = ask(select(enKeys["xnone"].pats[0]),[])
            } else {
                let [questionFn,groups] = getQuestion(terminals,keyWord,use_majestic,trace)
                if (questionFn != null){
                    prompt = ask(questionFn,groups)
                } else {
                    prompt = "*** pas de question trouvée..."+keyWord.key_en+"\n"
                }
            }
        }
    }
}

talkWithEliza()
