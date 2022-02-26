// //////// exemples en français
"use strict";
loadFr();

addToLexicon({"John":{"N":{"g":"m","tab":"n4"}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":"n16"}}})
var pomme = NP(D("le"),N("pomme"));
var  gars = NP(D("le"),N("garçon").n("p"));

var exemplesFr=[
    [N("chat"),
        "chat"],
    [Pro("moi").c("acc"),
        "me"],
    [Pro("moi").tn(""),
        "moi"],
    [NP(D("le"),N("chat")),
        "le chat"],
    [S(NP(D('le'),N('chat').n("p"))),
        "Les chats."],
    [V("aller").t("ps").pe(2).n("p"),
        "allâtes"],
    [V("aller").t("pc").pe(3).n("s"),
        "est allé"],
    [VP(V("aller").t("f").pe(1).n("p")).typ({neg:true}),
        "n'irons pas"],
    [VP(V("aller").t("pq").pe(2).n("s")).typ({neg:true}),
        "n'étais pas allé"],
    [S(NP(D("le"),N("chat").g("f").n("p")),
      VP(V("manger"),
         NP(D("le"),N("souris")))),
        "Les chattes mangent la souris."],
    [S(NP(D("le"),N("chat").g("f").n("p")),
      VP(V("manger"),
         NP(D("le"),N("souris")))).typ({pas:true}),
        "La souris est mangée par les chattes."],
    [S(NP(D('le'),Q("super"),
         N('chat').g("f").n("p").tag("b").tag("i")),
      VP(V('dévorer').t('pc'),
         NP(D('le'),
            N('souris'),
            A("gris"),"Wow!").tag("a",{href:"http://wikipedia.org/cat",target:"_blank"}))
        ).typ({neg:true}),
        'Les super <i><b>chattes</b></i> n\'ont pas dévoré <a href="http://wikipedia.org/cat" target="_blank">la souris grise Wow!</a>'],
    [
        S(NP(D('le'),
            N('souris').n("p")),
      VP(V('être'),
            AP(A('gris')))).typ({neg:true}),
        "Les souris ne sont pas grises."],
    [S(Pro("je").n("p").pe(2),
      VP(V("avoir").t("cp"),
         NP(NO(2),A("beau"),N("ami").g("f")))).typ({neg:"plus"}),
        "Vous n'auriez plus eu 2 belles amies."],
    [S(NP(N("John")),
      VP(V("évanouir").aux("êt").t("pc")),
        PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
        "John ne s'est pas évanoui au lundi 21 mai 1979 à 10 h 5 min 0 s."],
    [S(CP(C("et"),NP(N("John")),NP(N("Mary"))),
      VP(V("évanouir").t("pc")),
         PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
        "John et Mary ne se sont pas évanouis au lundi 21 mai 1979 à 10 h 5 min 0 s."],
    [S(VP().add(V("aimer")).add(pomme)).add(gars,0),
        "Les garçons aiment la pomme."],
    [S(CP(C("et"),NP(D("le"),N("fruit"))).add(pomme).add(gars),
              VP(V("venir").t("pc"),
                 Adv("hier"))),
        "Le fruit, la pomme et les garçons sont venus hier."],
    [S(CP(C("et"),NP(D("le"),N("orange"))).add(pomme),
                  VP(V("arriver").t("pc"),
                     Adv("hier"))),
        "L'orange et la pomme sont arrivées hier."],
    [S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme")))),
        "Il a mangé la pomme."],
    [S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme")).tag("i").pro())),
        "Il <i>l'</i> a mangée."],
    [S(NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("qui"),
                    VP(V("manger").aux("êt").t("pc"))))),
        "La <i>pomme</i> qui est mangée."],
    [NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("que"),
                    Pro("je"),
                    VP(V("manger").t("pc")))),
        "la <i>pomme</i> qu'il a mangée"],
    [S(NP(D("le"),N("pomme").tag("i"),
                     SP(Pro("que"),
                        Pro("je"),
                        VP(V("manger").t("pc")))).pro()),
        "Elle."],
    [S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")))).typ({pas:true}),
        "Le gâteau est mangé par les enfants."],
    [S(Pro("je").pe(1).n("p"), VP(V("agir").t("pc"), AdvP(Adv("conformément"),
                      PP(P("à"), NP(D("le"), N("loi")))))).typ({neg:true}),
        "Nous n'avons pas agi conformément à la loi."],
    [S(NP(D('le'),
         N('souris'),
         SP(Pro('que'),
             NP(D('le'),
                 N('chat').n("p")),
             VP(V('manger').t('pc')))),
      VP(V('être'),
         AP(A('gris')))),
        "La souris que les chats ont mangée est grise."],
    [DT(),
        null],
    [DT(new Date()).nat(false),
        null],
    [DT(new Date()).dOpt({rtime:true}),
        null],
    [NO(1.847584).dOpt({mprecision: 0}),
        "2"],
    [NO(1.847584).dOpt({mprecision: 4}),
        "1,8476"],
    [NO(1.847584).dOpt({raw:false}),
        "1,85"],
    [NO(1.847584).dOpt({raw:true}),
        "1.847584"],
    [NO(125).dOpt({nat:true}),
        "cent vingt-cinq"],
    [NO(10).dOpt({ord:true}),
        "dixième"],
    [NP(NO(0), N("avion")),
        "0 avion"],
    [NP(NO(2), N("avion")),
         "2 avions"],
    [NP(NO(1.5), N("livre")),
        "1,5 livre"],
    [NP(NO(2.4), N("livre")),
        "2,4 livres"],
    [NP(NO(2), A("rouge"),N("avion")),
        "2 avions rouges"],
    [N("pomme").g("w"),
        "pomme"],
    [S(Pro("lui").c("nom"),
      VP(V("donner").t("pc"),
         NP(D("un"),N("pomme")).pro(),
         PP(P("à"),NP(D("le"),A("jeune"),N("femme"))
         ))),
         "Il l'a donnée à la jeune femme."],
    [S(Pro("lui").c("nom"),
      VP(V("donner").t("pc"),
         NP(D("un"),N("pomme")).pro(),
         PP(P("à"),NP(D("le"),A("jeune"),N("femme"))).pro())),
         "Il la lui a donnée."],
    [S(Pro("je").pe(1),
      VP(V("mettre").t("pc"),
         NP(D("le"),N("lettre")),
         PP(P("sur"),NP(D("le"),N("table"))).pro())),
         "J'y ai mis la lettre."],
    [S(Pro("je").pe(1),
      VP(V("mettre").t("pc"),
         NP(D("le"),N("lettre")).pro(),
         PP(P("sur"),NP(D("le"),N("table"))).pro())).typ({neg:true}),
         "Je ne l'y ai pas mise."],
    // exemples du papier "Architecture..."
    // Figure 6
    [S(Pro("lui").c("nom"),
       VP(V("donner").t("pc"),
          NP(D("un"),N("pomme")).pro())),
     "Il l'a donnée."],
    // Table 1 - 1
    [S(Pro("lui").c("nom"),
       VP(V("donner").t("pc"),
          NP(D("un"),N("pomme")).pro())).typ({neg:true}),
     "Il ne l'a pas donnée."],
    // Table 1 - 2
    [S(Pro("lui").c("nom"),
       VP(V("donner").t("pc"),
          NP(D("un"),N("pomme")).pro(),
          PP(P("à"),NP(D("le"),N("fille"))))).typ({neg:true}),
     "Il ne l'a pas donnée à la fille."],
    // Table 1 - 3
    [S(Pro("lui").c("nom"),
       VP(V("donner").t("pc"),
          NP(D("un"),N("pomme")).pro(),
          PP(P("à"),NP(D("le"),N("fille"))).pro())).typ({neg:true}),
     "Il ne la lui a pas donnée."],
    // Table 1 - 4
    [S(Pro("lui").c("nom"),
       VP(V("donner").t("pc"),
          NP(D("un"),N("pomme")).pro(),
          PP(P("à"),NP(D("le"),N("fille"))).pro())).typ({neg:true,pas:true}),
     "Elle ne lui a pas été donnée par lui."],
    // position des pronoms devant le verbe
    [S(Pro('lui').c("nom"),
       VP(V('donner').t("pc"),
          NP(D('un'),N('chat')).pro(),
          Pro("elle").c("dat"))),
     "Il le lui a donné."],
    // modifications globales de propriétés
    [S(NP(D("le"),N("chat").g("f")),
      VP(V("manger"),
         NP(D("le"),N("souris")))).t("f"),
        "La chatte mangera la souris."],
    [S(CP(C("et"),
          Pro("elle").tn(""),
          Pro("moi").tn("")),
        VP(V("aller"),
           PP(P("à"),
              NP(D("le"),N("plage"))))).t("pc"),
     "Elle et moi sommes allés à la plage."],
    // changement de personne dans le déterminant
    [S(NP(D("notre").pe(2),N("chef")),
       VP(V("aller"))),
     "Votre chef va."],
    // nouveau type de question "yon" par inversion du sujet
    [S(NP(D('le'),  // 54
          N('chat')),
       VP(V('manger'),
          NP(D('le'),
             N('souris')))).typ({int:"yon"}),
     "Le chat mange-t-il la souris? "],
    [S(NP(D('le'), // 55
          N('chat')),
       VP(V('manger'),
          NP(D('le'),
             N('souris')))).typ({int:"yon",neg:true}),
     "Le chat ne mange-t-il pas la souris? "],
    [S(NP(D('le'), // 56
          N('chat')),
       VP(V('manger'),
          NP(D('le'),
             N('souris')))).typ({int:"yon",pas:true}),
     "La souris est-elle mangée par le chat? "],
     [S(Pro("je"),  // 57
        VP(V('manger'),
           NP(D('le'),
              N('fromage')))).typ({int:"yon"}),
     "Mange-t-il le fromage? "],
     [S(Pro("je"),  // 58
        VP(V('manger').t("pc"),
           NP(D('le'),
              N('fromage')))).typ({int:"yon"}),
     "A-t-il mangé le fromage? "],
];

//  exemples en anglais
loadEn();
let apple = NP(D("a"),N("apple"));
let appleC = apple.clone();
let appleF = ()=>NP(D("a"),N("apple"))

var exemplesEn=[
    [V("love"),"loves"],                             // 0
    [V("have").t("ps"),"had"],                       // 1
    [V("be").pe(3),"is"],                            // 2
    [VP(V("love")).typ({neg:true}),"does not love"], // 3
    [VP(V("love")).typ({int:"yon"}),"does love? "],  // 4
    [VP(V("love")).typ({prog:true}),"is loving"],    // 5
    [VP(V("love")).typ({mod:"poss"}),"can love"],    // 6
    // examples from the "Architecture..." paper
    // Figure 1
    [S(Pro("him").c("nom"),                          // 7
       VP(V("eat"),
          NP(D("a"),N("apple").n("p")).tag("em")
     )),"He eats <em>apples</em>."],
    //  Figure 1 (with global modification)
    [S(Pro("him").c("nom"),                          // 8
       VP(V("eat"),
          NP(D("a"),N("apple").n("p")).tag("em")
     )).t("ps"),
     "He ate <em>apples</em>."],
    // Figure 4
    [S(Pro("him").c("nom"),                          // 9
       VP(V("eat"),
          NP(D("a"),N("apple").n("p"))
     )).typ({"neg":true}),"He does not eat apples."],
    // Figure 5
    [S(Pro("him").c("nom"),                          //10
       VP(V("eat"),
          NP(D("a"),N("apple").n("p"))
     )).typ({"neg":true,"pas":true}),
     "Apples are not eaten by him."],
    // Section 6.1
    [S(Pro("him").c("nom"), VP(V("eat"),            // 11
       NP(D("a"),N("apple").n("p")).add(A("red"))) 
      ).add(Adv("now").a(","),0),
     "Now, he eats red apples."],
    // Section 6.2
    [S(CP(C("and"),NP(D("the"),N("apple")),         // 12
                   NP(D("the"),N("orange")),
                   NP(D("the"),N("banana"))), 
       VP(V("be"),A("good"))),
     "The apple, the orange and the banana are good."],
    [S(CP(C("and"),NP(D("the"),N("apple"))),        // 13
       VP(V("be"),A("good"))),
     "The apple is good."],
     // Section 6.3
     [S(Pro("him").c("nom"),                        // 14
        CP(C("and"),
           VP(V("eat"),apple), VP(V("love"),apple.pro()))),
      "He eats an apple and loves it."],
      // this example is not exactly what is in the paper, but I have not managed to make it work properly
     [S(NP(D("a"),N("apple")).pro(),VP(V("be"),A("red"))),// 15 
      "It is red."],
     [S(Pro("him").c("nom"),                       // 16
        CP(C("and"),
           VP(V("eat"),appleC), 
           VP(V("love"),appleC.clone().pro()))),
      "He eats an apple and loves it."],
     [S(appleC ,VP(V("be"),A("red"))),             // 17
      "An apple is red."],
     [S(Pro("him").c("nom"),                       // 18
        CP(C("and"),
           VP(V("eat"),appleF()), 
           VP(V("love"),appleF().clone().pro()))),
      "He eats an apple and loves it."],
     [S(appleF() ,VP(V("be"),A("red"))),           // 19
      "An apple is red."],
      // Section 6.4
      [S(Pro("him").c("nom"),                      // 20
         VP(V("eat"),
            NP(D("a"), N("apple").tag("a", {href:"https://en.wikipedia.org/wiki/Apple"})))),
       'He eats an <a href="https://en.wikipedia.org/wiki/Apple">apple</a>.'],
      // Section 6.6
      [NP(NO(1).dOpt({nat:true}),N("plane")),     // 21
       "one plane"],   
      [NP(NO(3).dOpt({nat:true}),N("plane")),     // 22
       "three planes"],
      [NP(NP(D("the"),                            // 23 
        A("large").f("su"),
        NP(P("of"),
           D("the"),
           N("trainer").n("p")).a(",")),
        D("this").n("s"),    // check propagation of the number (this should not be these)
        N("addition").n("s")),
       "the largest of the trainers, this addition"]
];

// dépendances en français
loadFr();
addToLexicon("Mauritanie",{"N":{"g":"f","tab":["n16"]}})
addToLexicon("Algérie",{"N":{"g":"f","tab":["n16"]}})
addToLexicon("Maroc",{"N":{"g":"m","tab":["n1"]}})

var dependancesFr=[
    [root(V("pleuvoir"),
          subj(Pro("lui").c("nom")),
          mod(P("dans"),
              compObj(N("maison"),
                     det(D("mon").pe(1))))),"Il pleut dans ma maison."],       // 0
    [root(V("bâtir").t("ps"),
          subj(Pro("moi").c("nom")),
          comp(N("cabane").n("p"),
               det(D("un")),
               mod(A("petit")),
               mod(A("rouge"))),
          mod(P("en"),
              mod(Q("1998")))),"Je bâtis des petites cabanes rouges en 1998."], // 1
    [root(V("manger"),
          subj(Pro("vous").c("nom")),
          coord(C("et"),
                comp(N("pomme"),
                     det(D("un"))),
                comp(N("orange"),
                     det(D("un"))).n("p"))),
     "Vous mangez une pomme et des oranges."],                                // 2
    [root(V("être"),
          subj(Pro("ce")),
          mod(Adv("alors")),
          comp(Q("Alba"),
               coord(C("et"),
                     mod(V("reprendre"),
                         subj(Pro("qui")),
                         compObj(N("contrôle"),
                                 det(D("le")),
                                 compObl(P("de"),
                                         compObj(N("situation"),
                                                 det(D("le")))))),
                     mod(V("réprimer"),
                         subj(Pro("qui")),
                         compObj(N("révolte"),
                                 det(D("un")),
                                 compObj(P("de"),
                                         compObj(N("peuple"),
                                                 det(D("le")))),
                                 compObj(P("devant"),
                                         compObj(N("cour"),
                                                 det(D("le")),
                                                 mod(A("royal"))))))))),
    "C'est alors Alba qui reprend le contrôle de la situation et qui réprime une révolte du peuple devant la cour royale."],// 3
    [root(V("courir"),
          coord(C("et"),
                subj(N("chat"),
                     det(D("le"))),
                subj(N("chien"),
                     det(D("le"))))),
    "Le chat et le chien courent."],                                 // 4
    [root(V("avoir"),
          subj(Pro("lui").c("nom")),
          compObj(N("peur"),
                  compObl(P("de"),
                          compObj(N("araignée"),
                                  det(D("le")))))),
     "Il a peur de l'araignée."],                                    // 5
    [root(V("être"),
          mod(C("mais")).pos("pre"),
          subj(N("réalité"),
               det(D("le"))),
          compObj(C("que"),
                  compObj(V("être"),
                          subj(N("Mauritanie"),
                               det(D("le"))),
                          coord(C("ou"),
                                compObj(N("Maroc"),
                                        det(D("le"))),
                                compObj(N("Algérie"),
                                        det(D("le"))))).typ({neg:true}))),
     "Mais la réalité est que la Mauritanie n'est pas le Maroc ou l'Algérie."], //6
    [root(V("manger"),
          subj(N("garçon"),
               det(D("le"))).n("p").pro(),
          coord(C("et"),
                comp(N("pomme"),
                     det(D("un"))),
                comp(N("orange"),
                     det(D("un"))).n("p"))),
     "Ils mangent une pomme et des oranges."],                             // 7
    [root(V("pleuvoir"),
          subj(Pro("lui").c("nom")),
          mod(P("dans"),
              compObj(N("maison"),
                     det(D("mon").pe(1))).pro())),"Il y pleut."],       // 8
    [root(V("bâtir").t("ps"),
          subj(Pro("moi").c("nom")),
          comp(N("cabane").n("p"),
               det(D("un")),
               mod(A("petit")),
               mod(A("rouge"))).pro(),
          mod(P("en"),
              mod(Q("1998")))),"Je les bâtis en 1998."],                // 9
    [root(V("manger"),
          subj(N("souris"),
               det(D("le"))),
          comp(N("fromage"),
               det(D("le")))).typ({"pas":true}),
     "Le fromage est mangé par la souris."],
    
]


// English dependences
loadEn();
addToLexicon("practice",{"V":{"tab":"v3"}}) // should be in the original lexicon
var dependenciesEn=[
    [root(V("walk"),
              subj(N("man"),
                   det(D("a")))),"A man walks."],                             // 0
    [root(V("be"),
          subj(V("practice").t("pr"),
                   compObj(N("joke"),
                            det(D("my").pe(2).ow("s")))),
                    mod(A("crucial"))),"Practicing your joke is crucial."],    // 1
    [root(V("eat"),
          subj(Pro("him").c("nom")),
          comp(N("apple"),
               det(D("a"))).n("p").tag("em")).t("ps"),"He ate <em>apples</em>."],// 2
    [root(V("come").t("pr"),
          compObl(P("into"),
                  compObj(N("area"),
                         det(D("the")))),
          compObl(P("to"),
                 compObj(V("see").t("b"),
                         compObj(N("concert"),
                                 det(D("a"))).n("p")))),
    "Coming into the area to see concerts."],                                    // 3
    [root(V("be").t("ps"),
          subj(Pro("it")),
          compObl(P("from"),
                  mod(Q("John"))),
          compObj(C("that"),
                  compObj(V("hear").t("ps"),
                         subj(Pro("me").c("nom").g("f")),
                         compObj(N("news"),
                                 det(D("the")))))),
     "It was from John that she heard the news."],                                //4
    [root(V("be"),
           subj(N("man"),
                det(D("every")),
                mod(V("be"),
                    subj(Pro("that")),
                      mod(V("miss").t("pr")))),
          comp(V("punish").t("pp")),
          compObl(P("for"),
            mod(Pro("you")))),
    "Every man that is missing is punished for you."],                              //5
    [root(V("stop").t("ps"),
          subj(Pro("it")),
          mod(Adv("nearly")).pos("pre"),
          compObj(V("rain").t("pr"))).typ({"perf":true}),
     "It nearly had stopped raining."],                                            //6
    [root(V("waste").t("ps"),
          mod(C("if"),
              compObj(V("have").t("ps"),
                      subj(Pro("I")).pe(1),
                       compObj(N("chance"),
                               det(D("a")),
                               mod(A("similar"))))).a(",").pos("pre"),
          subj(Pro("I").pe(1)),
          compObj(Pro("it"))).typ({"mod":"will","neg":true}),
     "If I had a similar chance, I would not waste it."],                        //7
    [root(V("walk"),
              subj(N("man"),
                   det(D("a"))).pro()),"He walks."],                             // 8
    [root(V("be"),
          subj(V("practice").t("pr"),
                   compObj(N("joke"),
                            det(D("my").pe(2).ow("s"))).pro()),
                    mod(A("crucial"))),"Practicing it is crucial."],    // 9
    [root(V("eat"),
          subj(Pro("him").c("nom")),
          comp(N("apple"),
               det(D("a"))).n("p").pro().tag("em")).t("ps"),"He ate <em>them</em>."],// 10
    
];
   
function showEx(exemple){
    console.log(exemple[0]+"")
}

function testAllEx(fn,exemples){
    for (var i = 0; i < exemples.length; i++) {
        fn(exemples[i])
    }
}

function showToSource(exemple){
    var v0=exemple[0]+"";
    var v1=eval(exemple[0].toSource())+"";
    if (v0.trim()!=v1.trim()){
        console.log("orig:%s\nrgen:%s",v0,v1)
    } else {
        console.log(v1)
    }
}

function showDiffs(nbDiffs,nbTests){
    if (getLanguage()=="en"){
        if (nbDiffs==0)
            console.log("*** no differences over %d tests",nbTests);
        else
            console.log("*** %d difference%s over %d tests",nbDiffs,nbDiffs==1?"":"s",nbTests) 
    } else {
        if (nbDiffs==0)
            console.log("*** aucune différence sur %d tests",nbTests);
        else
            console.log("*** %d différence%s sur %d tests",nbDiffs,nbDiffs==1?"":"s",nbTests) 
    }
}

function checkAllEx(exemples){
    const nb=exemples.length;
    let nbDiffs=0;
    for (var i=0;i<nb;i++){
        const exp=exemples[i][0];
        // console.log(exp.toSource());
        const gen=exp.toString();
        const expected=exemples[i][1];
        if (expected!==null && gen!=expected){
            console.log("%d:%s\n => %s\n ** %s",i,exp.toSource(),gen,expected)
            nbDiffs++;
        }
    }
    showDiffs(nbDiffs,exemples.length);
}

function checkAllExJSON(exemples){
    const nb=exemples.length;
    let nbDiffs=0;
    for (var i=0;i<nb;i++){
        const expJS=exemples[i][0].toJSON();
        const genJS=fromJSON(expJS).toString();
        const expected=exemples[i][1];
        if (expected!==null && genJS!=expected){
            console.log("%d:%s\n => %s\n ** %s",i,ppJSON(expJS),genJS,expected)
            nbDiffs++;
        }
    }
    showDiffs(nbDiffs,exemples.length);
}



loadFr();
// testAllEx(showEx,exemplesFr)
// testAllEx(showToSource,exemplesFr)
// checkAllEx(exemplesFr);
// checkAllExJSON(exemplesFr);
checkAllEx(dependancesFr);

loadEn();
// // testAllEx(showEx,exemplesEn)
// // testAllEx(showToSource,exemplesEn)
// checkAllEx(exemplesEn);
// checkAllExJSON(exemplesEn);
checkAllEx(dependenciesEn)

loadFr(true);
