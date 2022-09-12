import {addNPVP} from "./pert.js"
import {tasks} from "./tasks-data.js"

function npL(n,nb,det){
    if (typeof n == "string"){
        const nC=N(n);
        if (typeof nb !="undefined")nC.n(nb);
        return NP(D(det),nC)
    }
    return n;
}

function tnpL(n0,prep,n1,det){ // task np
    if (typeof n0=="string")
        return NP(D(det),N(n0),PP(P(prep),npL(n1,undefined,det)));
    if (n0.isA("N"))
        return NP(n0).add(PP(P(prep),npL(n1,undefined,det)))
    return n0.add(PP(P(prep),npL(n1,undefined,det)));
}

//task vp return both the V and VP (useful for setting the verb to infinitive)
function tvpL(v,n,det){ 
    if (typeof v=="string")v=V(v);
    return [v,VP(v,npL(n,undefined,det))];
}

export function generateTaskDescriptions(lang) {
    if (lang=="fr"){
        const np = (n,nb)=>npL(n,nb,"le");
        const tnp = (n0,prep,n1) => tnpL(n0,prep,n1,"le");
        const tvp = (v,n) => tvpL(v,n,"le");
        loadFr();
        // ajouts au lexique
        const verbes1erGroupe=["approvisionner","bétonner","débuter","effectuer","planifier","terrasser"];
        for (let i = 0; i < verbes1erGroupe.length; i++) 
            addToLexicon(verbes1erGroupe[i],{"V":{"tab":"v36","aux":["av"]}});
        const nomsFeminins=["canalisation","charpente","couverture","installation","isolation",
                        "longrine","maçonnerie","pose"];
        for (let i = 0; i < nomsFeminins.length; i++)
            addToLexicon(nomsFeminins[i],{"N":{"g":"f","tab":"n17"}});
        const nomsMasculins=["approvisionnement","béton","chantier","dallage","enduit","montage","terrassement"];
        for (let i = 0; i < nomsMasculins.length; i++) 
            addToLexicon(nomsMasculins[i],{"N":{"g":"m","tab":"n3"}});
        addToLexicon({"en":{"P":{"tab":"pp"}}});
        addToLexicon({"armé":{"A":{"tab":"n28"}}});
        addToLexicon({"on":{"N":{"g":"m","tab":"n3"}}})// hack: on devrait plutôt changer la table pn1...

        const betonArme=np("béton").add(A("armé"));
        const puits=np("puits","p");
        const longrines=np("longrine","p");
        const canalisations=np("canalisation","p");

        let q; // variable temporaire utilisée lors de l'initialisation de tasks
        addNPVP(tasks,"a",tnp("étude","de","chauffage"),tvp("planifier","chauffage"));
        addNPVP(tasks,"b",tnp("étude","de","couverture"),tvp("planifier","couverture"));
        addNPVP(tasks,"c",tnp("étude","de","charpente"),tvp("planifier","charpente"));
        addNPVP(tasks,"d",q=tnp("étude","de",betonArme),tvp("planifier",q));
        addNPVP(tasks,"e",tnp("préparation","de","terrain"),tvp("préparer","terrain"));
        addNPVP(tasks,"f",tnp("installation","de","chantier"),tvp("installer","chantier"));
        addNPVP(tasks,"g",q=tnp("terrassement","pour",puits),tvp("effectuer",q));
        addNPVP(tasks,"h",q=tnp("béton","pour",puits),tvp("installer",q));
        addNPVP(tasks,"i",tnp("terrassement","pour",longrines),tvp("terrasser",longrines));
        addNPVP(tasks,"j",q=tnp("béton","pour",longrines),tvp("couler",q));
        addNPVP(tasks,"k",tnp("construction","de",q=tnp("charpente","en",N("atelier"))),tvp("construire",q));
        addNPVP(tasks,"l",q=tnp(NP(D("un"),N("couche"),A("premier")),"de",tnp(N("peinture"),"en",N("usine"))),tvp("appliquer",q));
        addNPVP(tasks,"m",tnp("transport","de","charpente"),tvp("transporter","charpente"));
        addNPVP(tasks,"n",tnp("montage","de","charpente"),tvp("monter","charpente"));
        addNPVP(tasks,"o",tnp("terrassement","pour",canalisations),tvp("terrasser",canalisations));
        addNPVP(tasks,"p",tnp("maçonnerie","pour",canalisations),tvp("bétonner",canalisations));
        addNPVP(tasks,"q",tnp(np("approvisionnement","p"),"pour","chauffage"),
                        [q=V("approvisionner"),VP(Q("se"),q,PP(P("pour"),NP(D("le"),N("chauffage"))))]);
        addNPVP(tasks,"r",tnp("pose","de","chauffage"),tvp("poser","chauffage"));
        addNPVP(tasks,"s",NP(D("le"),A("autre"),N("couche").n("p"),PP(P("de"),N("peinture"))),tvp("terminer","peinture"));
        addNPVP(tasks,"t",tnp("étude","pour","électricité"),tvp("planifier",tnp("installation","de","électricité")));
        addNPVP(tasks,"u",tnp("isolation","de","couverture"),tvp("isoler","couverture"));
        addNPVP(tasks,"v",tnp("installation","de","électricité"),tvp("installer","électricité"));
        addNPVP(tasks,"w",q=NP(D("le"),N("dallage")),tvp("exécuter",q));
        addNPVP(tasks,"x",NP(D("le"),N("enduit").n("p")),
                        [q=V("recouvrir"),VP(q,P("de"),N("enduit").n("p"))]);
    } else {
        const np = (n,nb)=>npL(n,nb,"the");
        const tnp = (n0,prep,n1) => tnpL(n0,prep,n1,"the");
        const tvp = (v,n) => tvpL(v,n,"the");
        // add to the english lexicon
        loadEn();
        const verbs=[{"insulate":{"V":{"tab":"v3"}}},{"concrete":{"V":{"tab":"v3"}}},
                {"ground":{"N":{"tab":"n1"},"V":{"tab":"v1"}}}];
        for (let i = 0; i < verbs.length; i++)
            addToLexicon(verbs[i]);
        const nouns=["paving","coating","stringer","earthwork","canalization","masonry","sealer"];
        for (let i = 0; i < nouns.length; i++)
            addToLexicon(nouns[i],{"N":{"g":"n","tab":"n1"}});
        addToLexicon({"another":{"D":{"tab":"d4"}}});
        addToLexicon({"other":{"D":{"tab":"d4"}}});
        
        const concrete=NP(D("the"),V("reinforce").t("pp"),N("concrete"));
        const shafts=np("shaft","p");
        const stringers=np("stringer","p");
        const canalizations=np("canalization","p");
        const work=tnp("construction","of","building");

        let q; // variable temporaire utilisée lors de l'initialisation de tasks
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
        addNPVP(tasks,"l",q=NP(D("a"),NO(1).dOpt({ord:true}),N("coat"),PP(P("of"),tnp(N("paint"),"in","factory"))),
                        tvp("apply",q));
        addNPVP(tasks,"m",tnp("move","of","frame"),tvp("move","frame"));
        addNPVP(tasks,"n",tnp("assembly","of","structure"),tvp("assemble","structure"));
        addNPVP(tasks,"o",tnp("earthwork","for",canalizations),tvp("do",canalizations));
        addNPVP(tasks,"p",tnp("masonry","for",canalizations),tvp("concrete",canalizations));
        addNPVP(tasks,"q",tnp(np("supply","p"),"for","heating"),
                        tvp("supply",PP(P("for"),NP(D("the"),N("heating")))));
        addNPVP(tasks,"r",tnp("installation","of","heating"),tvp("install","heating"));
        addNPVP(tasks,"s",NP(D("other"),N("coat").n("p"),PP(P("of"),N("paint"))),tvp("end","painting"));
        addNPVP(tasks,"t",tnp("study","of","electricity"),tvp("plan",tnp("installation","of","electricity")));
        addNPVP(tasks,"u",tnp("isolation","of","roof"),tvp("insulate","roof"));
        addNPVP(tasks,"v",tnp("installation","of","electricity"),tvp("install","electricity"));
        addNPVP(tasks,"w",q=NP(D("the"),N("paving")),tvp("execute",q));
        addNPVP(tasks,"x",q=NP(D("the"),N("sealer").n("p")),
                        tvp("apply",q));
    }
}
