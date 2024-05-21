Object.assign(globalThis,jsRealB);

loadEn();
// word list
const article = ["a","the"];
const animes = "cat, dog, mouse, veal, cow, pig, man, woman, uncle, aunt, brother, sister, cousin, grandmother, actor".split(/, */)
const inanimes = "cheese, cake, apple, pie, orange, lamb, chicken, egg, surprise".split(/, */)
const transitifs = "eat, love, hate, admire, appreciate, understand".split(/, */)
const intransitifs = "run, dance".split(/, */) // unused for now
const adjectifs = ",, pretty, white, black, small, big".split(/, */)
const nomNombre={"s":"singular","p":"plural","pro":"pronoun"};
const nomGenre={"m":"masculine","f":"feminine"}
const nomTemps ={"p":"present","f":"future","ps":"simple past"};
const types={"affirmative":{neg:false},"negative":{neg:true},"passive":{pas:true},"interrogative":{int:"yon"},
             "perfect":{perf:true},"progressive":{prog:true}};
// localisation
const montrerInstructions="Show instructions";
const masquerInstructions="Hide instructions";
const ou=C("or")
const taperLaPhrase="Type your sentence here"

