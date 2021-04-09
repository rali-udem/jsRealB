loadFr();
// listes de mots
const article = ["un","le"];
const animes = "chat,chien,souris,veau,vache,cochon,homme,femme,oncle,tante,frère,soeur,nièce,cousin".split(/, */)
const inanimes = "fromage,gâteau,pomme,tarte,orange,rôti,poulet,oeuf,surprise".split(/, */)
const transitifs = "manger,aimer,détester,adorer,apprécier,dévorer".split(/, */)
const intransitifs = "courir,danser".split(/, */)
const adjectifs = ",,beau,blanc,noir,petit,grand".split(/, */)
const nomNombre={"s":"singulier","p":"pluriel","pro":"pronom"};
const nomTemps ={"p":"présent","i":"imparfait","f":"futur","c":"conditionnel",
                 "pc":"passé composé","ps":"passé simple"};
const types={"affirmative":{neg:false},"négative":{neg:true},"passive":{pas:true},"interrogative":{int:"yon"}};
// localisation
const montrerInstructions="Montrer les instructions";
const masquerInstructions="Masquer les instructions";
const ou=C("ou")
const taperLaPhrase="Entrer la phrase ici"

