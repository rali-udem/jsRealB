loadEn();
// // when used as a node module
// if (typeof module !== 'undefined' && module.exports) {
//     // when called by node.js
//     function evalExports(file){
//         let f=require(file);
//         for (let v in f){
//             eval(v+"= f."+v);
//         }
//     }
//     evalExports("../dist/jsRealB-dmefr.min.js");
//     evalExports(__dirname+"/computeTrip.js");
//     evalExports(__dirname+"/pert.js");
//     evalExports(__dirname+"/tasks-data.js");
// }

function np(n){
    return (typeof n=="string")?NP(D("the"),N(n)):n;
}

function tnp(n0,prep,n1){ // task np
    if (typeof n0=="string")
        return NP(D("the"),N(n0),PP(P(prep),np(n1)));
    if (n0.isA("N"))
        return NP(n0).add(PP(P(prep),np(n1)))
    return n0.add(PP(P(prep),np(n1)));
}

function tvp(v,n){ //task vp
    if (typeof v=="string")v=V(v);
    return VP(v,np(n));
}

function generateTaskDescriptions() {
    // add to the english lexicon
    loadEn();
    var verbs=[{"insulate":{"V":{"tab":"v3"}}},{"concrete":{"V":{"tab":"v3"}}},
               {"ground":{"N":{"tab":["n1"]},"V":{"tab":"v1"}}}];
    for (var i = 0; i < verbs.length; i++)
        addToLexicon(verbs[i]);
    var nouns=["paving","coating","stringer","earthwork","canalization","masonry","sealer"];
    for (var i = 0; i < nouns.length; i++)
        addToLexicon(nouns[i],{"N":{"g":"n","tab":["n1"]}});
    addToLexicon({"another":{"D":{"tab":["d4"]}}});
    addToLexicon({"other":{"D":{"tab":["d4"]}}});


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
    addNPVP(tasks,"l",q=NP(D("a"),Adv("first"),N("coat"),PP(P("of"),tnp(N("paint"),"in","factory"))),
                      tvp("apply",q));
    addNPVP(tasks,"m",tnp("move","of","frame"),tvp("move","frame"));
    addNPVP(tasks,"n",tnp("assembly","of","structure"),tvp("assemble","structure"));
    addNPVP(tasks,"o",tnp("earthwork","for",canalizations),tvp("do",canalizations));
    addNPVP(tasks,"p",tnp("masonry","for",canalizations),tvp("concrete",canalizations));
    addNPVP(tasks,"q",tnp(np("supply").n("p"),"for","heating"),
                      VP(V("supply"),PP(P("for"),NP(D("the"),N("heating")))));
    addNPVP(tasks,"r",tnp("installation","of","heating"),tvp("install","heating"));
    addNPVP(tasks,"s",NP(D("other"),N("coat"),PP(P("of"),N("paint"))).n("p"),tvp("end","painting"));
    addNPVP(tasks,"t",tnp("study","of","electricity"),tvp("plan",tnp("installation","of","electricity")));
    addNPVP(tasks,"u",tnp("isolation","of","roof"),tvp("insulate","roof"));
    addNPVP(tasks,"v",tnp("installation","of","electricity"),tvp("install","electricity"));
    addNPVP(tasks,"w",q=NP(D("the"),N("paving")),tvp("execute",q));
    addNPVP(tasks,"x",NP(D("the"),N("sealer")).n("p"),
                         SP(CP(C("and"),VP(V("fill")),VP(V("cover"))),PP(P("of"),N("coating").n("p"))));
}

if (typeof module !== 'undefined' && module.exports) {
    exports.generateTaskDescriptions=generateTaskDescriptions;
}