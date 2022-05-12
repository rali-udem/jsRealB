jsRealB=require("jsrealb")

for (var v in jsRealB)
    eval(v+"=jsRealB."+v);

loadFr();
// listes de mots
const animes = "chat,chien,souris,veau,vache,cochon,homme,femme,oncle,tante,frère,soeur".split(/, */)
const inanimes = "fromage,gâteau,pomme,tarte,orange,rôti,poulet".split(/, */)
const transitifs = "manger,aimer,détester,adorer,apprécier".split(/, */)
const intransitifs = "courir,danser".split(/, */)
// listes de variantes
const nomNombre={"s":"singulier","p":"pluriel"};
const nombre = Object.keys(nomNombre);
const article = ["un","le"];
const nomTemps ={"p":"présent","i":"imparfait","f":"futur","pc":"passé composé"}
const codeTemps=Object.keys(nomTemps);

nb=10  // nombres de phrases à produire 
for (let i=0;i<nb;i++){
    // effectuer le choix des lemmes
    const anime=oneOf(animes);
    const inanime= oneOf(inanimes);
    // choisir parmi les variantes
    const n1=oneOf(nombre);
    const a1=oneOf(article)
    const n2=oneOf(nombre);
    const a2=oneOf(article)
    const t=oneOf(codeTemps);
    
    let v,s,transitif;
    if (Math.random()<0.75){ // 3 trois fois sur 4 , créer une structure de phrase avec un complément d'objet direct
        transitif=true;
        v=oneOf(transitifs);
        // on crée une fonction qui va créer une structure de phrase 
        // pour créer une nouvelle structure à chaque appel 
        s = () => S(NP(D(a1),N(anime).n(n1)),
                    VP(V(v),NP(D(a2),N(inanime).n(n2))));
        // afficher la structure
        console.log("Phrase à trou".padEnd(25)+`: ${a1}_ ${anime}_[${nomNombre[n1]}] ${v}_ ${a2}_ ${inanime}_[${nomNombre[n2]}].`)
    } else {  // 1 fois sur 4, créer une structure de phrase sans COD
        transitif=false;
        v=oneOf(intransitifs);
        s = ()=>S(NP(D(a1),N(anime).n(n1)),VP(V(v)));
        // afficher la structure
        console.log("Phrase à trou".padEnd(25)+`: ${a1}_ ${anime}_[${nomNombre[n1]}] ${v}_ .`)
    }
    // l'astuce ici est que lors qu'on appelle s() dans le contexte d'une chaîne, ceci lance la génération
    console.log(nomTemps[t].padEnd(25)+`: ${s().t(t)}`); // générer la phrase au temps choisi
    console.log(`négatif ${nomTemps[t]}`.padEnd(25)+`: ${s().t(t).typ({"neg":true})}`);
    if (transitif) // mettre au passif une phrase avec un COD
        console.log(`passif ${nomTemps[t]}`.padEnd(25)+`: ${s().t(t).typ({"pas":true})}`)
    console.log(`question ${nomTemps[t]}`.padEnd(25)+`: ${s().t(t).typ({"int":"yon"})}`)
    console.log("----")
}