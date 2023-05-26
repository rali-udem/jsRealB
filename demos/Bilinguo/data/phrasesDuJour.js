import {dets,pes,numbers,relatives} from "./entities.js"
export {sentences}

// adaptées de phrases tirées de https://lessuperprofs.jimdofree.com/1re-année/phrases-du-jour/
const sentences = [// 0
    {text:"Le père nettoie une table",
     level:0,    
     fr: (garcon, nettoie,table)=>
             S(NP(D("le"),N(garcon)),
               VP(V(nettoie)),
                  NP(D("un"),N(table))),
     en: (father,clean,table)=>
             S(NP(D("the"),N(father)),
               VP(V(clean),
                  NP(D("a"),N(table)))),
     params:[relatives,
             [["nettoyer","clean"],["préparer","set"],["laver","wash"]],
             [["table","table"],["bureau","desk"],["comptoir","counter"]]],
    }, // 1
    {text: "L'enfant mange une pomme de terre",
     level:0,
     fr:(enfant,manger,un,pommeDT,n)=>
          S(NP(D("le"),N(enfant)),
            VP(V(manger),
               NP(D(un),pommeDT.n(n)))),
      en:(child,eat,a,potato,n)=>
           S(NP(D("the"),N(child)),
             VP(V(eat),
                NP(D(a),potato.n(n)))),
       params:[[["enfant","child"],...relatives],
                [["manger","eat"],["adorer","love"],["détester","hate"]],
                dets,
                [[()=>NP(N("pomme"),PP(P("de"),N("terre"))),()=>N("potato")],
                 [()=>NP(N("melon"),PP(P("de"),N("eau"))),()=>N("watermelon")]],
                numbers],
    }, // 2
    {text: "Mon père voit huit moutons",
    level:1,
     fr:(pe,pere,voit,huit,mouton)=>
            S(NP(D("mon").pe(pe),N(pere)),
              VP(V(voit),NP(NO(huit).nat(),N(mouton)))),
     en:(pe,father,see,eight,sheep)=>
            S(NP(D("my").pe(pe),N(father)),
              VP(V(see),NP(NO(eight).nat(),N(sheep)))),
     params:[ pes,
              relatives,
              [["voir","see"],["appeler","call"],["vendre","sell"]],
              [[2,2],[3,3],[7,7]],
              [["veau","calf"],["vache","cow"],["cochon","pig"],["mouton","sheep"]]]
    }, // 3
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
     }, // 4
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
     params:[pes,
             [["aimer","love"],["détester","hate"],["apprécier","enjoy"]],
             [["chercher","search"],["trouver","find"]],
             [["mot","word"],["verbe","verb"],["phrase","sentence"]],
             [["dictionnaire","dictionary"],["livre","book"]],
             numbers]
    }, // 5
    {text:"Je vois vingt lutins coquins et vilains, sous le sapin.",
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
         pes,
         [["voir","see"],["placer","put"],["disposer","set"]],
         [20,5,13],
         [["lutin","elf"],["animal","animal"],["personnage","character"]],
         [["coquin","naughty"],["farceur","mischievous"]],
         [["vilain","nasty"],["laid","ugly"],["beau","pretty"]],
         [["sapin","fir"],["arbre","tree"],["bouleau","birch"]],
     ]
    }, // 6
    {text:"Je suis heureux de raconter une histoire.",
     level:3,
     fr:(heureux,raconter,une,histoire)=>
         S(Pro("je").pe(1),
           VP(V("être"),heureux,
               PP(P("de"),
                   VP(V(raconter).t("b"),
                      NP(D(une),N(histoire)))))),
     en:(happy,tell,a,story)=>
         S(Pro("I").pe(1),
           VP(V("be"),happy,
                VP(V(tell).t("b-to"),
                      NP(D(a),N(story))))),
     params:[
        [[()=>A("heureux"),()=>A("happy")],[()=>A("enchanté"),()=>V("thrill").t("pp")]],
        [["raconter","tell"],["expliquer","explain"]],
        dets,
        [["histoire","story"],["anecdote","anecdote"]],
     ]},
    // {text:"Le petit chat a mal à la patte."},
    // {text:"Elle adore manger une pomme et regarder un film."},
]
