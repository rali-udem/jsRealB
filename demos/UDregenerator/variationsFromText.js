//  create questions and or negation of sentences in a file (.txt) 
//  The sentences are parsed by Stanza to produce UD structures which are then
//  transformed in a constituent structure used by jsRealB to recreate the original sentence
//  That structure is then used to produce variations (questions or negation) of the sentence
//      node variationsFromText.js [-l en|fr] [-sud] [-q] [-n] [-h] [-t] file.txt 
//  this creates "file.conllu" if it does not exist or is "older" than "file.txt"
//  if the file is already a "conllu", then process it directly

// defaults
let language="en";   // -l (en|fr)
let isSUD=false;     // -sud
let questions=false  // -q
let negation=false   // -n
let showTrees=false  // -t
let fileName=null;

function usage(){
    console.log(
`usage: node variationsFromText.js [-l en|fr] [-q] [-n] [-h] [-t] file.{txt|conllu} 
 where -l: language (en default)
       -sud : input uses the SUD annotation scheme
       -q: generate questions (default false) 
       -n: generation negation (default false)
       -h: this message
       -t: show trees
        file.txt: text file with sentences on a single line
 this creates "file.conllu" if it does not exist or is "older" than file.txt
        file.conllu: process directly the conllu file`)
    process.exit()
}
// parse arguments
if (process.argv.length==2) usage();
for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg == "-h")usage();
    else if (arg=="-l"){
        i++;
        language=process.argv[i];
        if (language!="en" && language!="fr"){
            console.log("only en and fr supported")
            process.exit()
        }
    } else if (arg=="-sud"){
        isSUD=true;
    } else if (arg=="-q"){
        questions=true;
    } else if (arg=="-n"){
        negation=true;
    } else if (arg=="-t"){
        showTrees=true;
    } else {
        fileName=process.argv[i];
        break;
    }
}
if (fileName==null){
    console.log("no file specified");
    process.exit()
}
/// load system tools
import { existsSync, statSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

//////// 
//  load JSrealB
let {default:jsRealB} = await import("../../dist/jsRealB.js");
Object.assign(globalThis,jsRealB);
if (language=="en")loadEn(); else loadFr();

//////
//  load regenerator classes
import { parseUDs } from "./UDregenerator.js";
await import(`./UDregenerator-${language}.js`);
import { fixPunctuation } from "./utils.js";

// taken from Lexicon.js
const prepositionsList = {
    "en":{
        "all":new Set(["about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "amongst", "around", 
                       "as", "at", "back", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "by", 
                       "concerning", "considering", "despite", "down", "during", "except", "for", "from", "in", "inside", "into", 
                       "less", "like", "minus", "near", "next", "of", "off", "on", "onto", "outside", "over", "past", "per", "plus", 
                       "round", "since", "than", "through", "throughout", "till", "to", "toward", "towards", "under", "underneath", 
                       "unlike", "until", "up", "upon", "versus", "with", "within", "without" ] ),
        "whe":new Set(["above", "across", "along", "alongside", "amid","around", "before", "behind", "below", "beneath", "beside", 
                       "besides", "between", "beyond", "in", "inside", "into", "near", "next", "onto", "outside", "over", "past",
                       "toward", "towards", "under", "underneath","until","via","within",  ]),
        "whn":new Set(["after", "before", "during","since",  "till", ]),
    },
    "fr":{
        "all":new Set([ "à", "après", "avant", "avec", "chez", "contre", "d'après", "dans", "de", "dedans", "depuis", "derrière", 
                        "dès", "dessous", "dessus", "devant", "durant", "en", "entre", "hors", "jusque", "malgré", "par", "parmi", 
                        "pendant", "pour", "près", "sans", "sauf", "selon", "sous", "sur", "vers", "via", "voilà" ]),
        "whe":new Set(["après", "avant", "chez","dans",  "dedans","derrière","dessous", "dessus", "devant","entre", "hors","près",
                       "sous", "sur", "vers", "via",]),
        "whn":new Set(["après", "avant","depuis", "dès","durant", "en","pendant",]),
    }
}

const preps=prepositionsList[language];
const fmt="# %s = %s";
let nbQuestions=0,nbNegations=0;

function generateQuestion(jsr,ansJSR,typ,index){
    if (ansJSR.terminal.isA("Pro")) return; // do not generate a question whose answer is a pronoun
    const currTyp=jsr.getProp("typ")
    const question=jsr.clone();
    question.searchStart=index;
    if (currTyp==null){
        question.typ({"int":typ})
    } else {
        currTyp["int"]=typ;
        question.setProp("typ",currTyp)
    }
    if (showTrees){
        console.log(jsr.toSource(0));
        console.log(question.toSource(0));
        console.log(ansJSR.toSource(0));
    }
    console.log(fmt,typ.toUpperCase()+" ",clean(question.realize())+" => "+clean(ansJSR.realize()));
    nbQuestions++;
}

// TODO: deal  with coordination of sentences
function generateNegation(jsr){
    const typ=jsr.getProp("typ");
    if (jsr.terminal.isA("V") && 
        // do not try to negate an already negated sentence...
        !(typ!==undefined && typ["neg"]!==undefined && typ["neg"]!==false)){
        const negation=jsr.clone().typ({neg:true});
        if (showTrees){
            console.log(jsr.toSource(0));
            console.log(negation.toSource(0));
        }
        console.log(fmt,"neg ",clean(negation.realize()));
        nbNegations++;
    }
}
 
// this closely parallels the code in Dependent.processTypInt
// so that the removal of the answer is the same in both cases
function generateQuestions(jsr){
    const subjIdx=jsr.findIndex(d=>d.isA("subj"));
    if (subjIdx>=0){
        // insure that the verb at the third person singular,
        // because now the subject has been removed
        let jsr1=jsr.clone();
        jsr1.terminal.setProp("n","s");
        jsr1.terminal.setProp("pe",3);
        generateQuestion(jsr1,jsr1.dependents[subjIdx],"was")
    }
    // HACK: given the fact that jsRealB considers only the "first" matching dependent
    //       when creating a question, it will not generate appropriate questions in the
    //       case of more than one complement such as
    //         The north star does not move [in the sky] [in the northern hemisphere] [during the night].
    //       So when there are more than one complements, we change the startind index so that jsRealB 
    //       picks it and "remove" it
    for (let index=0;index<jsr.dependents.length;index++){
        const dep = jsr.dependents[index];
        const pos=dep.getProp("pos")||"post";
        // ignore complements coming before the verb
        if (pos=="post"){
            if (dep.isA("comp","mod")){
                let prep;
                if (dep.isA("P")){ // preposition is the head
                    prep=dep.terminal.lemma;
                } else { // a preposition occurs as a dependent and occurs at the start
                    const pIdx=dep.findIndex((d)=>d.terminal.isA("P") && d.getProp("pos")=="pre");
                    if (pIdx>=0) prep=dep.dependents[pIdx].terminal.lemma;
                }    
                if (prep!==undefined){
                    if (preps["whe"].has(prep))
                        generateQuestion(jsr,dep,"whe",index);
                    else if (preps["whn"].has(prep))
                        generateQuestion(jsr,dep,"whn",index);
                    else
                        generateQuestion(jsr,dep,"wai",index);
                } else
                generateQuestion(jsr,dep,"wad",index);
            }
        }
    }
}

function clean(s){
    return fixPunctuation(s.replace(/\[\[(.*?)\]\]/g,"$1"))
}

function generate(conlluFile){
    // UDregenerator execution
    const uds=parseUDs(conlluFile);
    uds.forEach(function (ud,i){
        // if (ud.text.length>=80)return; // for the moment only deal with short sentences (less than 80 characters)
        const text=ud.text;
        console.log(fmt, "id  ",ud.sent_id);
        console.log(fmt, "text",text);
        resetSavedWarnings();             // so that warnings are not displayed
        let udCloned=ud.similiClone();
        // remove ending full stop, it will be regenerated by jsRealB
        if (udCloned.right.length>0){
            let lastIdx=udCloned.right.length-1;
            if (udCloned.right[lastIdx].deprel=="punct" && udCloned.right[lastIdx].lemma=="."){
                udCloned.right.splice(lastIdx,1)
            }
        }
        let jsr=udCloned.toDependent(false,isSUD)
        // if root is a coord, add a dummy root, so that realization will be done correctly
        let isCoord=false;
        if (jsr.isA('coord')){
            jsr=root(Q(""),jsr);
            isCoord=true;
        }
        const jsRealBexpr=jsr;       // :: string à évaluer
        console.log(fmt, "TEXT",clean(jsRealBexpr.clone().realize()));
        // console.log(jsRealBexpr.toSource(0));
        if (jsr.terminal.isA("V")){ // ignore sentence whose root is not a verb
            if (questions) generateQuestions(jsr);
            if (negation)  generateNegation(jsr);
        } else if (isCoord){
            for (let d of jsr.dependents) {
                    if (questions)generateQuestions(d);
                    if (negation) generateNegation(d);
            }
        } else {
            console.log(fmt,"ERR ","Question cannot be created from a root "+jsr.terminal.constType);
            if (showTrees)
                console.log(jsr.toSource(0));
        }
        console.log("");
    });    
    console.log(language=="en"?"%d UD dependencies processed":"%d UD dépendences traitées",uds.length)
    if (questions) console.log("%d questions",nbQuestions);
    if (negation) console.log("%d negations",nbNegations);
}

function processing(){
    if (fileName.endsWith(".txt")){  
        // deal with a txt file with a sentence on each line, that will be parsed using Stanza
        const conlluFileName=fileName.replace(/.txt$/,".conllu")
        if (!existsSync(conlluFileName) || statSync(conlluFileName).mtime<statSync(fileName).mtime){
            console.error("*** Creating %s",conlluFileName)
            // create conllu file
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const child = spawn(`${__dirname}/text2ud.py`,[language, fileName])
            child.on("exit",function(code,signal){
                if (code==0){
                    console.error("*** Wrote  %s",conlluFileName);
                    generate(readFileSync(conlluFileName,{encoding:'utf8', flag:'r'}))
                } else {
                    console.error('*** Problem in file creation:' +`code ${code} and signal ${signal}`);
                }
            })
        } else {
            generate(readFileSync(conlluFileName,{encoding:'utf8', flag:'r'}))
        }
    } else if (fileName.endsWith(".conllu")){
            generate(readFileSync(fileName,{encoding:'utf8', flag:'r'}))
    } else {
        console.log("file extension should .txt or .conllu: %s",fileName)
    }
}

Constituent.debug=true;
processing();