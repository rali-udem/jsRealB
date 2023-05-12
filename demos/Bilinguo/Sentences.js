"use strict"
// taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// return a list of shuffled indices for a list
function getIndices(list){
    return shuffle(Array.from(Array(list.length).keys()));
}

// call the appropriate jsReal load functions
function load(lang){
    if (lang=="en") loadEn(); else loadFr();
}

const dets = [["un","a"],["le","the"]]
const persons = [1,2,3];
const numbers = ["s","p"];

// adaptées de phrases tirées de https://lessuperprofs.jimdofree.com/1re-année/phrases-du-jour/
const sentences = [// 0
    {text:"Le livre est sur la table",
     level:0,    
     fr: (le,livre,la,table)=>
             S(NP(D(le),N(livre)),
               VP(V("être"),
                  PP(P("sur"),NP(D(la),N(table))))),
     en: (the,book,a,table)=>
             S(NP(D(the),N(book)),
               VP(V("be"),
                  PP(P("on"),NP(D(a),N(table))))),
     params:[dets,
             [["livre","book"],["chandelle","candlestick"],["crayon","pen"]],
             dets,
             [["table","table"],["bureau","desk"]]]
    }, // 1
    {text: "Mon père voit huit moutons",
    level:1,
     fr:(pe,pere,voit,huit,mouton)=>
            S(NP(D("mon").pe(pe),N(pere)),
              VP(V(voit),NP(NO(huit).nat(),N(mouton)))),
     en:(pe,father,see,eight,sheep)=>
            S(NP(D("my").pe(pe),N(father)),
              VP(V(see),NP(NO(eight).nat(),N(sheep)))),
     params:[ persons,
              [["père","father"],["frère","brother"],["soeur","sister"],["tante","aunt"]],
              [["voir","see"],["appeler","call"],["vendre","sell"]],
              [[2,2],[3,3],[7,7]],
              [["veau","calf"],["vache","cow"],["cochon","pig"],["mouton","sheep"]]]
    }, // 2
    {text:"Le pauvre oiseau voit un lapin.",
    level:2,
     fr: (le,pauvre,oiseau,voir,un,lapin) =>
            S(NP(D(le),A(pauvre),N(oiseau)),
              VP(V(voir),NP(D(un),N(lapin)))),
     en: (the,poor,bird,see,a,rabbit) =>
            S(NP(D(the),A(poor),N(bird)),
              VP(V(see),NP(D(a),N(rabbit)))),
     params:[dets,
             [["pauvre","poor"],["bleu","blue"],["rapide","fast"]],
             [["oiseau","bird"],["papillon","butterfly"],["chauve-souris","bat"]],
             [["voir","see"],["attraper","catch"]],
             dets,
             [["lapin","rabbit"],["ours","bear"],["renard","fox"]]]
     }, // 3
    {text:"J'aime chercher des mots dans les livres.",
     level:3,
     fr:(pe,aimer,chercher,mot,livre,nb)=>
         S(Pro("je").pe(pe),
           VP(V(aimer),
              V(chercher).t("b"),
              NP(D("un"),N(mot)),
              PP(P("dans"),NP(D("le"),N(livre)).n(nb)))),
     en:(pe,love,search,word,book,nb)=>
         S(Pro("I").pe(pe).g("m"),
           VP(V(love),
              V(search).t("pr"),
              NP(D("a"),N(word)),
              PP(P("in"),NP(D("the"),N(book)).n(nb)))),
     params:[persons,
             [["aimer","love"],["détester","hate"],["désirer","want"]],
             [["chercher","search"],["trouver","find"]],
             [["mot","word"],["verbe","verb"],["expression","expression"]],
             [["dictionnaire","dictionary"],["livre","book"]],
             numbers]
    }, // 4
    {text:"Je vois vingt lutins coquins et vilains,sous le sapin.",
     level:4,
     fr:(pe,voir,vingt,lutin,coquin,vilain,sapin)=>
        S(Pro("je").pe(pe),
          VP(V(voir),
             NP(NO(vingt).nat(),N(lutin),
                CP(C("et"),A(coquin),A(vilain)))),
                PP(P("sous"),
                   NP(D("le"),N(sapin)))),
     en:(pe,see,twenty,elf,naughty,nasty,fir)=>
        S(Pro("I").pe(pe).g("m"),
          VP(V(see),
             NP(NO(twenty).nat(),
                CP(C("and"),A(naughty),A(nasty)),
                N(elf)),
             PP(P("under"),
                NP(D("the"),N(fir))))),
     params:[
         persons,
         [["voir","see"],["placer","put"],["disposer","set"]],
         [20,5,13],
         [["lutin","elf"],["animal","animal"],["personnage","character"]],
         [["coquin","naughty"],["farceur","mischievous"]],
         [["vilain","nasty"],["laid","ugly"],["beau","pretty"]],
         [["sapin","fir"],["arbre","tree"],["bouleau","birch"]],
     ]
    },
    // {text:"Je suis très heureux de pouvoir raconter mes histoires."},
    // {text:"Le petit chat a mal à la patte."},
    // {text:"Elle adore manger une pomme et regarder un film."},
]

function makeStructs(src,tgt,level){
    // HACK: the word selection is done by shuffling a new list of indices (so that the corresponding src and tgt words are selected)
    //       and taking (shifting) the first indices of this list when needed either for a word or a distractor 
    const [srcIdx,tgtIdx] = src=="fr" ? [0,1] : [1,0]
    const s = oneOf(sentences.filter(s=>s.level<=level));  // select a sentence
    // const s = sentences[4];   // useful for testing a single sentence
    // build the list of parameters and distractors for the target language
    let params=[], distractors=[];
    for (let ps of s.params){
        if (!Array.isArray(ps[0]))ps=ps.map(e=>[e,e]); // src and tgt values are the same
        let indices = getIndices(ps);
        let idx=indices.shift();
        const param=["",""];
        param[srcIdx]=ps[idx][srcIdx];
        param[tgtIdx]=ps[idx][tgtIdx];
        params.push(param)
        if (typeof(param[tgtIdx])=="string" && param[tgtIdx].length>1 && indices.length>0){
            const distractor=ps[indices.shift()][tgtIdx];
            if (!distractors.includes(distractor))
                distractors.push(distractor)
        }           
    }
    load(src);
    const srcStruct = s[src].apply(null,params.map(e=>e[srcIdx]));
    load(tgt);
    const tgtStruct = s[tgt].apply(null,params.map(e=>e[tgtIdx]));
    return [srcStruct,tgtStruct,distractors]
}

// if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
//     let {default:jsRealB} = await import("../../dist/jsRealB.js");
//     Object.assign(globalThis,jsRealB);

//     function makeSentences(src,tgt,level){
//         const t = oneOf([{fr:"p","en":"p"},{fr:"pc","en":"ps"},{fr:"f","en":"f"}]);
//         const n = oneOf("s","p");
//         const typ = oneOf([{},{neg:true},{prog:true},{"mod":"poss"},{"int":"yon"},{"int":"tag"}].slice(0,level+1));
//         let res={};
//         [res[src],res[tgt],res["distractors"]]=makeStructs(src,tgt,level);
//         res[src].n(n).t(t[src]).typ(typ);
//         res[tgt].n(n).t(t[tgt]).typ(typ);
//         return res;
//     }

//     function showSentences(src,tgt,level){
//         const sents=makeSentences(src,tgt,level);
//         let res=[];
//         load(src);
//         res.push(sents[src].realize());
//         load(tgt);
//         res.push(sents[tgt].realize());
//         res.push(sents["distractors"]);
//         console.log(level,":",res.join(" || "))
//     }

//     for (let i=0;i<20;i++){
//         showSentences("fr","en",oneOf(1,2,3,4));
//         showSentences("en","fr",oneOf(1,2,3,4));
//     }
//  }
