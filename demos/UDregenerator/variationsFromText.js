//  create questions and or negation of sentences in a file (.txt) 
//  The sentences are parsed by Stanza to produce UD structures which are then
//  transformed in a constituent structure used by jsRealB to recreate the original sentence
//  That structure is then used to produce variations (questions or negation) of the sentence
//      node variationsFromText.js [-l en|fr] [-q] [-n] [-h] file.txt 
//  this creates "file.conllu" if it does not exist or is "older" than "file.txt"

// defaults
let language="en";  // -l (en|fr)
let questions=false  // -q
let negation=false   // -n
let textFileName=null;

function usage(){
    console.log(
`usage: node variationsFromText.js [-l en|fr] [-q] [-n] [-h] file.txt 
 where -l: language (en default)
       -q: generate questions (default false) 
       -n: generation negation (default false)
       -h: this message
        file.txt: text file with sentences on a single line
 this creates "file.conllu" if it does not exist or is "older" than file.txt`)
    process.exit()
}
// parse arguments
if (process.argv.length==2) usage();
for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    console.log(i,arg);
    if (arg == "-h")usage();
    else if (arg=="-l"){
        i++;
        language=process.argv[i];
        if (language!="en" && language!="fr"){
            console.log("only en and fr supported")
            process.exit()
        }
    } else if (arg=="-q"){
        questions=true;
    } else if (arg=="-n"){
        negation=true;
    } else {
        textFileName=process.argv[i];
        break;
    }
}
if (textFileName==null){
    console.log("no file specified");
    process.exit()
}

const ud=require("./UD.js");
UD=ud.UD;
const UDnode=require(`./UDnode-${language}.js`)
//////// 
//  load JSrealB
var jsrealb=require('../../dist/jsRealB-node.js');
// eval exports 
for (var v in jsrealb){
    eval("var "+v+"=jsrealb."+v);
}
// jsrealb.setQuoteOOV(true)

const enfr=require(`./UDregenerator-${language}.js`);
const utils=require("./utils.js");
const UDregenerator=require("./UDregenerator.js");

// taken from Phrase.js
const prepositionsList = {
    "en":{
        "all":new Set([ "about", "above", "across", "after", "against", "along", "alongside", "amid", "among", "amongst", "around", "as", "at", "back", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "by", "concerning", "considering", "despite", "down", "during", "except", "for", "from", "in", "inside", "into", "less", "like", "minus", "near", "next", "of", "off", "on", "onto", "outside", "over", "past", "per", "plus", "round", "since", "than", "through", "throughout", "till", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "with", "within", "without" ] ),
        "whe":new Set(["above", "across", "along", "alongside", "amid","around", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "in", "inside", "into", "near", "next", "onto", "outside", "over", "past","toward", "towards", "under", "underneath","until","via","within",  ]),
        "whn":new Set(["after", "before", "during","since",  "till", ]),
    },
    "fr":{
        "all":new Set([ "à", "après", "avant", "avec", "chez", "contre", "d'après", "dans", "de", "dedans", "depuis", "derrière", "dès", "dessous", "dessus", "devant", "durant", "en", "entre", "hors", "jusque", "malgré", "par", "parmi", "pendant", "pour", "près", "sans", "sauf", "selon", "sous", "sur", "vers", "via", "voilà" ]),
        "whe":new Set(["après", "avant", "chez","dans",  "dedans","derrière","dessous", "dessus", "devant","entre", "hors","près","sous", "sur", "vers", "via",]),
        "whn":new Set(["après", "avant","depuis", "dès","durant", "en","pendant",]),
    }
}

const preps=prepositionsList["en"];
const fmt="# %s = %s";
let nbQuestions=0,nbNegations=0;

function generateQuestion(jsr,ansJSR,typ){
    const answer=eval(ansJSR.pp(0)).toString();
    let jsrExpr=jsr.pp(0);
    const m=jsrExpr.match(/\.typ\(\{(.*?)\}\)$/); // does the expression ends with .typ()
    if (m==null)
        jsrExpr+=`.typ({int:"${typ}"})`; // if not add typ at the end
    else
        jsrExpr=jsrExpr.substring(0,m.index)+`.typ({${m[1]},int:"${typ}"})` // add int at the end of the existing typ
    const question=eval(jsrExpr).toString();
    console.log(fmt,typ.toUpperCase()+" ",clean(question)+" => "+clean(answer));
    nbQuestions++;
}

// traverse jsRealB expression adding negation to all vp 
//   caution: this modifies the original structure...
function negateVP(jsr){
    const children=jsr.children
    if (children==undefined || children.length==0)return;
    if (jsr.constName=="VP"){
        const v=jsr.getFromPath(["V"]);
        const t=v.getOption("t");
        if (t=="b" || t=="pp")return;
        jsr.addOptions("typ({neg:true})")
    }
    for (var i = 0; i < children.length; i++) {
        negateVP(children[i])
    }
    return;
}

function generateNegation(jsr){
    negateVP(jsr) // caution: this modifies the original structure
    let jsrExpr=jsr.pp(0);
    const negation=eval(jsrExpr).toString();
    console.log(fmt,"neg ",clean(negation));
    nbNegations++;
}
 
// generate question from a structure
function generateQuestions(jsr){
    // subject=first NP,N, Pro or SP (before the VP,V)
    const subject=jsr.getFromPath([["VP","V","NP","N","Pro","SP"]]);
    if (subject!==undefined){
        if (!subject.isA("VP") && !subject.isA("V")) // the VP occured before the NP,N... so ignore it
            generateQuestion(jsr,subject,"was");
    }
    // direct object = first NP,N,Pro or SP in the first VP
    const dirObj=jsr.getFromPath([["VP"],["NP","N","Pro","SP"]]);
    if (dirObj!==undefined)
        generateQuestion(jsr,dirObj,"wad");
    // indirect object = first PP in the first VP
    const indirObj = jsr.getFromPath( [["VP"],["PP"]]);
    if (indirObj!==undefined){
        const prep=indirObj.children[0].children
        if (typeof(prep)=="string"){
            if (preps["whe"].has(prep))
                generateQuestion(jsr,indirObj,"whe");
            else if (preps["whn"].has(prep))
                generateQuestion(jsr,indirObj,"whe");
            else 
                generateQuestion(jsr,indirObj,"wai");
        } else {
            console.log("strange PP",ndirObj.children[0])
        }
    }
}

function clean(s){
    return utils.fixPunctuation(s.replace(/\[\[(.*?)\]\]/g,"$1"))
}

function generate(conlluFile){
    // UDregenerator execution
    uds=UDregenerator.parseUDs(conlluFile);
    uds.forEach(function (ud,i){
        const text=ud.text;
        console.log(fmt, "id  ",ud.sent_id);
        console.log(fmt, "text",text);
        const jsr=ud.toJSR();              // :: JSR
        const jsRealBexpr=jsr.pp(0);       // :: string à évaluer
        resetSavedWarnings();             // so that warnings are not displayed
        console.log(fmt, "TEXT",clean(eval(jsRealBexpr).toString()));
        // console.log(jsr.pp())
        if (jsr.isA("S") || jsr.isA("VP")){
            if (questions) generateQuestions(jsr);
            if (negation)  generateNegation(jsr);
        } else if (jsr.isA("CP")){
            const cpChildren=jsr.children;
            for (jsrChild of cpChildren) {
                if (jsrChild.isA("C"))continue;
                if (jsrChild.isA("S") || jsrChild.isA("VP")){
                    if (questions)generateQuestions(jsrChild);
                    if (negation) generateNegation(jsrChild);
                } else {
                    console.log(fmt,"ERR ","Question in a CP cannot be created from a "+jsr.constName);
                }
            }
        } else {
            console.log(fmt,"ERR ","Question cannot be created from a "+jsr.constName);
        }
        console.log("");
    });    
    console.log(language=="en"?"%d UD dependencies processed":"%d UD dépendences traitées",uds.length)
    if (questions) console.log("%d questions",nbQuestions);
    if (negation) console.log("%d negations",nbNegations);
}

conlluFileName=textFileName.replace(/.txt$/,".conllu")
const fs = require('fs');
if (!fs.existsSync(conlluFileName) || fs.statSync(conlluFileName).mtime<fs.statSync(textFileName).mtime){
    console.error("*** Creating %s",conlluFileName)
    // create conllu file
    const { spawn } = require('child_process');
    const child = spawn("./text2ud.py",[lang, textFileName])
    child.on("exit",function(code,signal){
        if (code==0){
            console.error("*** Wrote  %s",conlluFileName);
            generate(fs.readFileSync(conlluFileName,{encoding:'utf8', flag:'r'}))
        } else {
            console.error('*** Problem in file creation:' +`code ${code} and signal ${signal}`);
        }
    })
} else {
    generate(fs.readFileSync(conlluFileName,{encoding:'utf8', flag:'r'}))
}
