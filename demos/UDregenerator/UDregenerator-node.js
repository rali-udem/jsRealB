// arguments : lang file [typ]
const argv=process.argv.slice(2);
if (argv.length==0 || argv[0].startsWith("-h")){
    console.log("usage: node UDregenerator-node.js lang inputFile [mod|diff]\n"+
                "   lang: en|fr\n"+
                "   inputFile: path of CONLLU file\n"+
                "   mod: content of sentence modification added in .typ({mod}) to a VP or S\n"+
    "   diff: only show sentences that are regenerated differently from the original");
    process.exit(0)
}
const language=argv[0];
if (language!="en" && language!="fr"){
    console.log('only "en" or "fr" implemented');
    process.exit(1)
}
const fileName=argv[1];
let typ;
if (argv.length>2){
    typ=argv[2];
}
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

const fmt="# %s = %s";
// UDregenerator execution
uds=UDregenerator.parseUDs(conlluFile);
let nbDiffs=0,nbModifs=0;;
uds.forEach(function (ud,i){
    const text=ud.text;
    const jsr=ud.toJSR();
    const jsRealBexpr=jsr.pp(0);
    const isNotProjective=ud.root.project()==null;
    resetSavedWarnings();
    let jsrReal=eval(jsRealBexpr).toString();
    const warnings=getSavedWarnings();
    if (warnings.length==0){
        jsrReal=utils.fixPunctuation(jsrReal);
        if (typ===undefined || typ=="diff"){ // compare with the original
            const diffs=lvs.computeDiffs(text,jsrReal);
            const nb=diffs[3];
            if (nb>0){
                nbDiffs++;
                const [d1,d2]=lvs.showDiffs(diffs);
                console.log("%d: %s",i,ud.sent_id);
                if (isNotProjective) console.log("## non projective");
                console.log("%d %s%s",nb,language=="en"?"difference":"différence",nb==1?"":"s");
                console.log(fmt, "text",d1);
                console.log(fmt, "TEXT",d2);
                console.log("---");
            } else if (typ != "diff"){
                console.log("%d: %s",i,ud.sent_id);
                if (isNotProjective) console.log("## non projective");
                console.log(fmt, "text",text);
                console.log(fmt, "TEXT",jsrReal);
                console.log("---");
            }
        } else { // apply sentence modification
            console.log("%d:in %s",i,ud.sent_id);
            if (isNotProjective) console.log("## non projective");
            console.log(fmt, "text",text);
            console.log(fmt, "TEXT",jsrReal);
            if (jsr.isA("S") || jsr.isA("VP")){
                nbModifs++;
                jsr.addOptions(`typ({${typ}})`);
                const jsrExprTyp=jsr.pp(0);
                console.log(fmt,typ.slice(0,4),jsr.realize(jsrExprTyp));
                console.log("---");
            } else {
                console.log(language=="en"?" %s cannot be applied to a %s":" %s n'est pas applicable à %s",
                            typ,jsr.constName);
                console.log("---");
            }
        }
    } else {
        const nb=warnings.length;
        console.log("%d:in %s",i,ud.sent_id);
        if (isNotProjective) console.log("## non projective");
        console.log("%d %s%s: %s",nb,language=="en"?"error":"erreur",nb>1?"s":"",ud.sent_id);
        console.log(warnings.join("\n"));
        console.log("---");
    }
});    
console.log(language=="en"?"%d UD dependencies processed":"%d UD dépendences traitées",uds.length)
if (typ=="diff"){
    console.log(language=="en"?"%d different found":"%d différentes",nbDiffs);
} else {
    console.log(language=="en"?"%d modified":"%d modifiées",nbModifs);
}