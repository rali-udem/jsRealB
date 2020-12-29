///////////////////////////////////////
// Génération de texte

function neg(s,n){
    ng = n || true;
    return s instanceof Q ? s().a(n?"-":"+") : s().typ({neg:ng}) 
}
function interrog(s){
    return s instanceof Q ? s().a("?") : 
                            oneOf(()=>s().typ({int:"yon"}),  // question par inversion
    ()=>S(Q("est-ce"),Q("que"),s()).a("?")) // question deébutant pas "Est-ce que"
}

// paramètres du texte t=temps, g=genre, n=nombre, pe=personne
var t="pc";
let protagoniste = {
    pe:2,n:"p",g:"m",
    struct:() => Pro("moi").pe(protagoniste.pe)
                           .g(protagoniste.g)
                           .n(protagoniste.n).c("nom"),
    structTn:() => Pro("moi").pe(protagoniste.pe)
                             .g(protagoniste.g)
                             .n(protagoniste.n).tn("")
   }

// personnages
let poss         = () => D(protagoniste.n=="s"?"mon":"notre").pe(protagoniste.pe)
let chef         = {g:"m",struct:() => NP(poss(),
                                          N(chef.g=="m"?"chef":"cheffe").cap(),
                                          PP(P("de"),N("service").cap()))}
let chefPro      = () => Pro("moi").g(chef.g).pe(3).c("nom");
let chefNom      = () => Q((chef.g=="m"? "Mr": "Mme")+" X");
let collegue     = {g:"f",struct:()=>collegue.g=="f"
                                        ? NP(N("mademoiselle").cap(),Q("Yollande"))
                                        : NP(N("monsieur").cap(),Q("Rolland"))}

// fonctions auxiliaires
function allerVoir(personne,t){
    return VP(V("aller").t(t),V("voir").t("b"),personne.struct())
}
function allezChez(personne,but){
    let vp= allerVoir(personne,t)
    if (but !== undefined)vp.add(but())
    return S(protagoniste.struct(),vp)
}
function demanderAugment(){
    return PP(P("pour"),
              Pro("moi").g("m").n("s").pe(3).c("dat"),
              VP(V("demander").t("b"),
              NP(D("un"),N("augmentation"))));
}

function cEst(np){
    if (typeof n == "string")np=NP(D("le"),N(n));
    return S(Pro("ce"),VP(V("être").t(t),np))
}

var chemins,chemin,noChemin;

function numeroChemin(){
    noChemin=parseInt(d3.select("#noChemin").property("value"));
    if (noChemin<1 || isNaN(noChemin)){ // valider le numéro de chemin
        noChemin=1;
    } else if (noChemin>chemins.length){
        noChemin=chemins.length;
    }
    d3.select("#noChemin").property("value",noChemin);
    parametrer();
    chemin=chemins[noChemin-1];
    chemin.montrer();
}

function parametrer(){
    if(chemin!==undefined)chemin.enleverHandlers();
    t=d3.select("#temps").property("value");
    const st=d3.select("#style").property("value");
    if (st=="vous"){
        protagoniste.n="p";protagoniste.pe="2"
    } else {
        protagoniste.n="s";protagoniste.pe="2"
    }
    protagoniste.g=d3.select("#sexeProtagoniste").property("value");
    chef.g=d3.select("#sexeChef").property("value");
    collegue.g=d3.select("#sexeCollegue").property("value");
    d3.selectAll(".activeChoice").classed("activeChoice",false);
}

function maManiere(){
    parametrer();
    chemin = new Chemin([etatFinal,[etatFinal.getSuivant(),"ATTENDRE"]]);
    chemin.montrer();
    chemin.allonger();    
}

loadFr();
// Pour tester en local, lancer un serveur web local dans le répertoire jsRealB, p.e. python -m SimpleHTTPServer
d3.json("../../data/lexicon-dmf.json").then(function(data){
    updateLexicon(data);
    // console.log("dmf chargé: %d entrées",Object.keys(getLexicon()).length)
    addToLexicon({snack: { N: { g: 'm', tab: [ 'n3' ] } }});
    addToLexicon({prétexte: { A: { tab: [ 'n25' ] }, N: { g: 'x', tab: [ 'n17' ] } }});
    addToLexicon({cheffe: { N: { g: 'f', tab: [ 'n17' ]}}});
    
    d3.select("#cacherAfficherInstructions").on("click",function(){
        const val=d3.select("#cacherAfficherInstructions").property("value");
        if (val=="Cacher les instructions"){
            d3.select("#instructions").style("display","none");
            d3.select(this).property("value","Afficher les instructions")
        } else {
            d3.select("#instructions").style("display","block");
            d3.select(this).property("value","Cacher les instructions")
        }
    });

    organigramme();
    chemins=tousLesChemins();
    // écouter les événements
    d3.select("#noChemin").property("max",chemins.length);
    d3.selectAll(".nbManieres").text(chemins.length);
    d3.selectAll("select").on("change",function(){
        parametrer();
        chemin.montrer();
    });
    d3.select("#noChemin").on("change",numeroChemin);
    d3.select("#a_ma_maniere").on("click",maManiere);
    // afficher le premier chemin
    chemin=new Chemin([etatFinal].concat(chemins[0].actions));
    parametrer();
    chemin.montrer();
});

