export {addExp, en, fr, enfr}

function addExp(exp){
    if (isRunningUnderNode){
        console.log(exp.realize())
    } else {
        const element = document.createElement('p');
        element.innerHTML = exp;
        document.body.appendChild(element);
    }
}

// English example
function en(){
    loadEn();
    return S(NP(D("the"),N("cat")).n("p"),
             VP(V("sit").t("ps"),
                 PP(P("on"),
                 NP(D("the"),N("mat"))))).typ({int:"tag",neg:true})
}

// Exemple en français
function fr(){
    loadFr();
    return S(NP(D("le"),N("chat")).n("p"),
             VP(V("asseoir").t("pc"),
                 PP(P("sur"),
                 NP(D("le"),N("tapis"))))).typ({int:"tag",neg:true,refl:true})
}

// Bilingual example - Exemple bilingue
function enfr(){
    loadEn();
    const en1 = NP(D("the"),N("cat").n("p"));
    const en2 = NP(D("a"),N("mat")).n("p");
    loadFr();
    return S(en1,
             VP(V("asseoir").t("pc").tag("em"),
                 PP(P("sur").tag("em"),
                     en2))).typ({refl:true,int:"tag"})
}

if (typeof process !== "undefined" && process?.versions?.node){ 
// if (typeof jsRealB == "undefined"){  // alternative test...
    // check if the script is called by a node script but we cannot use isRunningUnderNode yet!!!
    // import "..." must appear at the top level, so we use the import function
    let {default:jsRealB} = await import("../dist/jsRealB.js");  
    Object.assign(globalThis, jsRealB);
    loadEn();
    console.log(S(VP(V("load").t("pr"),N("module"))).ba("**").realize());
}
