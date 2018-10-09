// javascript version of randomgen.pl described in
//    Michel Boyer and Guy Lapalme, Text Generation, in Logic and Logic Grammar for Language Processing, 
//    Ellis Horwood, 1990, Chapter 12, p-256-257 
if (typeof module !== 'undefined' && module.exports) {
    var jsRealB=require("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dme-node.min.js");
    for (var v in jsRealB)
        eval("var "+v+"=jsRealB."+v);

    function show(exp){
        console.log(exp.toObject(),":",exp.toString());
    }
}
// a simple sentence
var cat=NP(D("the"),N("cat"));
var mouse=NP(D("a"),A("grey"),N("mouse"));
var sent=S(cat,VP(V("eat"),mouse));

// modifications are "permanent"
var cat1=NP(D("the"),N("cat"));
var mouse1=NP(D("a"),A("grey"),N("mouse"));

if (typeof module !== 'undefined' && module.exports) {
    // some variations
    show(S(cat,VP(V("eat"),mouse)));
    show(S(cat,VP(V("eat"),mouse)).n("p").t("f"));
    show(S(cat,VP(V("eat"),mouse)).typ({"pas":true}));
    show(S(cat,VP(V("eat"),mouse)).typ({"neg":true}));
    show(S(cat,VP(V("eat"),mouse)).typ({"int":"wos"}));
    show(S(cat,VP(V("eat"),mouse)).typ({"int":"wos","pas":true,"neg":true}));

    show(S(cat1.n("p"),VP(V("eat"),mouse1.n("p").pro())));
    show(S(cat1,VP(V("eat"),mouse1))); // bad...
    // clone before modification

    show(S(cat.clone().n("p"),VP(V("eat"),mouse.clone().n("p").pro())));
    show(S(cat,VP(V("eat"),mouse)));
}

// random NP
function np(){
    return NP(D("a"),a(),N(oneOf("cat","mouse","dog","rabbit"))).n(oneOf("s","p"));
}

// random Adjective
function a(){
    return oneOf(
        ()=>A(oneOf("fussy","grey","nervous")),
        ()=>Q("")
    );
}

// random VP or VP,NP
function vp(){
    return oneOf(
        ()=>VP(V(oneOf("eat","run","love"))),
        ()=>VP(V(oneOf("eat","love")),np())
    );
}

if (typeof module !== 'undefined' && module.exports) {
    for (var i = 0; i < 20; i++) {
        show(S(np(),vp()));
    }
}