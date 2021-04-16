// arguments : lang file [typ]
const argv=process.argv.slice(2);
if (argv.length==0 || argv[0].startsWith("-h")){
    console.log("usage: node UDregenerator-node.js lang inputFile\n"+
                "   lang: en|fr\n"+
                "   inputFile: path of CONLLU file\n");
    process.exit(0)
}
const language=argv[0];
if (language!="en" && language!="fr"){
    console.log('only "en" or "fr" implemented');
    process.exit(1)
}
const fileName=argv[1];
const fs = require('fs');
let conlluFile = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'});
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
const enfr=require(`./UDregenerator-${language}.js`);
const utils=require("./utils.js");
const lvs=require("./levenshtein.js");
const UDregenerator=require("./UDregenerator.js");

// update dictionary
enfr.addNewWords()
setQuoteOOV(true)

const fmt="# %s = %s";
// UDregenerator execution
uds=UDregenerator.parseUDs(conlluFile);
let nbDiffs=0,nbModifs=0;
uds.forEach(function (ud,i){
    const text=ud.text;
    const jsr=ud.toJSR();
    const jsRealBexpr=jsr.pp(0);
    const isNotProjective=ud.root.project()==null;
    resetSavedWarnings();
    let jsrReal=eval(jsRealBexpr).toString();
    const warnings=getSavedWarnings();
    jsrReal=utils.fixPunctuation(jsrReal);
    const diffs=lvs.computeDiffs(text,jsrReal);
    let nb=diffs[3];
    console.log("%d: %s",i,ud.sent_id);
    if (isNotProjective) console.log("## non projective");
    if (nb>0){
        nbDiffs++;
        const [d1,d2]=lvs.showDiffs(diffs);
        console.log("%d %s%s",nb,language=="en"?"difference":"différence",nb==1?"":"s");
        console.log(fmt, "text",d1);
        console.log(fmt, "TEXT",d2);
    } else {
        console.log(fmt, "text",text);
        console.log(fmt, "TEXT",jsrReal);
    }
    nb=warnings.length;
    if (nb>0){
        console.log("%d %s%s: %s",nb,language=="en"?"error":"erreur",nb>1?"s":"",ud.sent_id);
        console.log(warnings.join("\n"));
    }
    console.log("---");
});    
console.log(language=="en"?"%d UD processed":"%d UD traitées",uds.length)
console.log(language=="en"?"%d UD different found":"%d UD différentes",nbDiffs);
