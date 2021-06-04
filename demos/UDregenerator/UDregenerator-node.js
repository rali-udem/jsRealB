// arguments : lang file.conllu
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
if (argv.length<2){
    console.log("missing input file")
    process.exit(1);
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
let nbDiffs=0, nbWarnings=0, nbNonProjective=0;
// UDregenerator execution
uds=UDregenerator.parseUDs(conlluFile);
uds.forEach(function (ud,i){
    console.log("%d: %s",i,ud.sent_id);
    const jsr=ud.toJSR();
    const jsRealBexpr=jsr.pp(0);
    const [jsRealBsent,warnings]=jsr.realize();
    const diffs=lvs.computeDiffs(ud.text,jsRealBsent);
    if (!ud.isProjective){
        nbNonProjective++;
        console.log("## non projective");
    }
    let nb=diffs[3];
    if (nb>0){
        nbDiffs++;
        const [d1,d2]=lvs.showDiffs(diffs);
        console.log("%d %s%s",nb,language=="en"?"difference":"différence",nb==1?"":"s");
        console.log(fmt, "text",d1);
        console.log(fmt, "TEXT",d2);
    } else {
        console.log(fmt, "text",ud.text);
        console.log(fmt, "TEXT",jsRealBsent);
    }
    nb=warnings.length;
    if (nb>0){
        nbWarnings++;
        console.log("%d %s%s: %s",nb,language=="en"?"warnings":"avertissements",nb>1?"s":"",ud.sent_id);
        console.log(warnings.join("\n"));
    }
    console.log("---");
});

// output global statistics    
console.log(language=="en"?"%d UD processed":"%d UD traitées",uds.length)
console.log(language=="en"?"%d UD non projective found":"%d UD non projectives",nbNonProjective);
console.log(language=="en"?"%d UD different found":"%d UD différentes",nbDiffs);
console.log(language=="en"?"%d UD with warnings found":"%d UD avec avertissements",nbWarnings);
