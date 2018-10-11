if (typeof module !== 'undefined' && module.exports) {
    /// déjà exporté dans tasks-fr.js
    // var jsRealB=require("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dmefr-node.min.js");
    // // on déclare les constructeurs de jsRealB comme globaux... car il faudrait les réexporter
    // for (var v in jsRealB)
    //         eval(v+"=jsRealB."+v);

    var pertjs=require(__dirname+"/pert.js");
    for (var v in pertjs)
            eval("var "+v+"=pertjs."+v);

    var tasksData=require(__dirname+"/tasks-data.js");
    for (var v in tasksData)
            eval("var "+v+"=tasksData."+v);

    var textGen=require(__dirname+"/textGen-en.js");
    for (var v in textGen)
            eval("var "+v+"=textGen."+v);
}
// add to the dme lexicon
loadEn();
var verbs=[];
for (var i = 0; i < verbs.length; i++)
    addToLexicon(verbs[i],"");
var nouns=["paving","stringer"];
for (var i = 0; i < nouns.length; i++)
    addToLexicon(nouns[i],{"N":{"g":"m","tab":["n1"]}});
addToLexicon({"another":{"D":{"tab":["d4"]}}});
addToLexicon({"other":{"D":{"tab":["d4"]}}});

function np(n){
    return (typeof n=="string")?NP(D("the"),N(n)):n;
}

function tnp(n0,prep,n1){ // task np
    return NP(np(n0),PP(P(prep),np(n1)));
}

function tvp(v,n){ //task vp
    if (typeof v=="string")v=V(v);
    return VP(v,np(n));
}

var concrete=NP(D("the"),V("reinforce").t("pp"),N("concrete"));
var shafts=np("shaft").n("p");
var stringers=np("stringer").n("p");
var canalizations=np("canalization").n("p");
var work=tnp("construction","of","building");

var q; // variable temporaire utilisée lors de l'initialisation de tasks
addNPVP(tasks,"a",tnp("study","of","heating"),tvp("plan","heating"));
addNPVP(tasks,"b",tnp("study","of","roof"),tvp("plan","roof"));
addNPVP(tasks,"c",tnp("study","of","frame"),tvp("plan","frame"));
addNPVP(tasks,"d",q=tnp("study","of",concrete),tvp("plan",q));
addNPVP(tasks,"e",tnp("preparation","of","land"),tvp("prepare","land"));
addNPVP(tasks,"f",tnp("installation","of","land"),tvp("install","land"));
addNPVP(tasks,"g",q=tnp("earthwork","for",shafts),tvp("do",q));
addNPVP(tasks,"h",q=tnp("concrete","for",shafts),tvp("install",q));
addNPVP(tasks,"i",tnp("ground","for",stringers),tvp("ground",stringers));
addNPVP(tasks,"j",q=tnp("concrete","for",stringers),tvp("pour",q));
addNPVP(tasks,"k",tnp("construction","of",q=tnp("frame","in","factory")),tvp("build",q));
addNPVP(tasks,"l",q=NP(NP(D("a"),Adv("first"),N("coat")),PP(P("of"),tnp(N("paint"),"in","factory"))),tvp("apply",q));
addNPVP(tasks,"m",tnp("move","of","frame"),tvp("move","frame"));
addNPVP(tasks,"n",tnp("assembly","of","structure"),tvp("assemble","structure"));
addNPVP(tasks,"o",tnp("earthwork","for",canalizations),tvp("do",canalizations));
addNPVP(tasks,"p",tnp("masonry","for",canalizations),tvp("concrete",canalizations));
addNPVP(tasks,"q",tnp(np("supply").n("p"),"for","heating"),VP(V("supply"),PP(P("for"),NP(D("the"),N("heating")))));
addNPVP(tasks,"r",tnp("installation","of","heating"),tvp("install","heating"));
addNPVP(tasks,"s",NP(D("other"),N("coat"),PP(P("of"),N("paint"))).n("p"),tvp("end","painting"));
addNPVP(tasks,"t",tnp("study","of","electricity"),tvp("plan",tnp("installation","of","electricity")));
addNPVP(tasks,"u",tnp("isolation","of","roof"),tvp("insulate","roof"));
addNPVP(tasks,"v",tnp("installation","of","electricity"),tvp("install","electricity"));
addNPVP(tasks,"w",q=NP(D("the"),N("paving")),tvp("execute",q));
addNPVP(tasks,"x",NP(D("the"),N("sealer")).n("p"),PP(CP(C("and"),V("fill"),V("cover")),P("of"),N("coating").n("p")));

if (typeof module !== 'undefined' && module.exports) {
    exports.tasks=tasks;
    exports.data=data;
    exports.work=work;
}