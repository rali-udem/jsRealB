import {elizaInitials, elizaQuits, elizaFinals, keywordsFr, enKeys, select, choose, tokenizeFr,mememot,matchDecomp, getTerminals} from "./eliza.js"

// interactive use 
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
const rl = readline.createInterface({ input, output });

let user_gender="f";
let eliza_gender="f";
let use_majestic= true;
let trace = false

async function talkWithEliza(){
    function getAnswer(fn,groups){
        return fn(groups,user_gender).typ({"maje":use_majestic}).realize()+"\n"
    }
    let prompt = getAnswer(choose(elizaInitials,[]));
    while(true) {
        let input = await rl.question(prompt);
        if (elizaQuits.includes(input.toLowerCase())){
            console.log(getAnswer(choose(elizaFinals,[]))) // last answer
            rl.close()
            break;
        } else {
            // transform input to reply
            let terminals = tokenizeFr(input).map(getTerminals);
            // if (trace) showTerminalLists(terminals)
            let replyFound = false;
        search: for (let keyword of keywordsFr){ // search for keyword occurrence
                if (terminals.some(t=>mememot(keyword.key,t)!==null)){
                    let patIdx = 0
                    for (let pat of keyword.pats){
                        let groups = matchDecomp(pat.decomp,terminals,use_majestic);
                        if (groups != null){
                            prompt=getAnswer(select(pat),groups);
                            replyFound = true;
                            break search;
                        }
                        patIdx++;
                    }
                }
            }
            if (!replyFound) // no appropriate reply found
                prompt = getAnswer(select(enKeys["xnone"].pats[0]),[])
        }
    }
}

talkWithEliza()
