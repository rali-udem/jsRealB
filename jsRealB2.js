// //////// exemples en français
"use strict";
loadFr();

addToLexicon({"John":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":["n16"]}}})
var pomme = NP(D("le"),N("pomme"));
var  gars = NP(D("le"),N("garçon").n("p"));

var exemplesFr=[
    [N("chat"),
        "chat"],
    [Pro("moi"),
        "lui"],
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
      VP(Pro("lui").c("refl"),V("évanouir").aux("êt").t("pc")),
        PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
        "John ne s'est pas évanoui au lundi 21 mai 1979 à 6 h 5 min 0 s."],
    [S(CP(C("et"),NP(N("John")),NP(N("Mary"))),
      VP(V("évanouir").t("pc")),
         PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
        "John et Mary ne sont pas évanouis au lundi 21 mai 1979 à 6 h 5 min 0 s."],
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
];

//  exemples en anglais
loadEn()
var exemplesEn=[
    [V("love"),"loves"],
    [V("have").t("ps"),"had"],
    [V("be").pe(3),"is"],
    [VP(V("love")).typ({neg:true}),"does not love"],
    [VP(V("love")).typ({int:"yon"}),"does love? "],
    [VP(V("love")).typ({prog:true}),"is loving"],
    [VP(V("love")).typ({mod:"poss"}),"can love"],
]

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

function checkAllEx(exemples){
    const nb=exemples.length;
    let nbDiffs=0;
    for (var i=0;i<nb;i++){
        const exp=exemples[i][0];
        const gen=exp.toString();
        const expected=exemples[i][1];
        if (expected!==null && gen!=expected){
            console.log("%s\n ==> %s\n *** %s",exp.toSource(),gen,expected)
            nbDiffs++;
        }
    }
    if (nbDiffs==0){
        console.log(getLanguage()=="en"?"*** no differences!":"*** pas de différences!")
    } else {
        console.log("*** %s diff%srence%s",nbDiffs,getLanguage()=="en"?"e":"é",nbDiffs==1?"":"s")
    }
}

loadFr();
// testAllEx(showEx,exemplesFr)
// testAllEx(showToSource,exemplesFr)
checkAllEx(exemplesFr);

loadEn();
// testAllEx(showEx,exemplesEn)
// testAllEx(showToSource,exemplesEn)
checkAllEx(exemplesEn);
