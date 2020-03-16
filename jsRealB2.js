// //////// exemples en français
"use strict";
loadFr();

addToLexicon({"John":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":["n16"]}}})
var pomme = NP(D("le"),N("pomme"));
var  gars = NP(D("le"),N("garçon").n("p"));

var exemplesFR=[
    N("chat"),
    Pro("moi"),
    Pro("moi").tn(""),
    NP(D("le"),N("chat")),
    S(NP(D('le'),N('chat').n("p"))),
    V("aller").t("ps").pe(2).n("p"),
    V("aller").t("pc").pe(3).n("s"),
    VP(V("aller").t("f").pe(1).n("p")).typ({neg:true}),
    VP(V("aller").t("pq").pe(2).n("s")).typ({neg:true}),
    S(NP(D("le"),N("chat").g("f").n("p")),
      VP(V("manger"),
         NP(D("le"),N("souris")))),
    S(NP(D("le"),N("chat").g("f").n("p")),
      VP(V("manger"),
         NP(D("le"),N("souris")))).typ({pas:true}),
    S(NP(D('le'),Q("super"),
         N('chat').g("f").n("p").tag("b").tag("i")),
      VP(V('dévorer').t('pc'),
         NP(D('le'),
            N('souris'),
            A("gris"),"Wow!").tag("a",{href:"http://wikipedia.org/cat",target:"_blank"}))
        ).typ({neg:true}),
    S(NP(D('le'),
            N('souris').n("p")),
      VP(V('être'),
            AP(A('gris')))).typ({neg:true}),
    S(Pro("je").n("p").pe(2),
      VP(V("avoir").t("cp"),
         NP(NO(2),A("beau"),N("ami").g("f")))).typ({neg:"plus"}),
    S(NP(N("John")),
      VP(V("évanouir").t("pc")),
        PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
    S(CP(C("et"),NP(N("John")),NP(N("Mary"))),
      VP(V("évanouir").t("pc")),
         PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}),
    S(VP().add(V("aimer")).add(pomme)).add(gars,0),
    S(CP(C("et"),NP(D("le"),N("fruit"))).add(pomme).add(gars),
              VP(V("venir").t("pc"),
                 Adv("hier"))),
    S(CP(C("et"),NP(D("le"),N("orange"))).add(pomme),
                  VP(V("arriver").t("pc"),
                     Adv("hier"))),
    S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme")))),
    S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme")).tag("i").pro())),
    S(NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("qui"),
                    VP(V("manger").aux("êt").t("pc"))))),
    NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("que"),
                    Pro("je"),
                    VP(V("manger").t("pc")))),
    S(NP(D("le"),N("pomme").tag("i"),
                     SP(Pro("que"),
                        Pro("je"),
                        VP(V("manger").t("pc")))
    ).pro()),
    S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")))).typ({pas:true}),
    S(Pro("je").pe(1).n("p"), VP(V("agir").t("pc"), AdvP(Adv("conformément"),
                      PP(P("à"), NP(D("le"), N("loi")))))).typ({neg:true}),
    S(NP(D('le'),
         N('souris'),
         SP(Pro('que'),
             NP(D('le'),
                 N('chat').n("p")),
             VP(V('manger').t('pc')))),
      VP(V('être'),
         AP(A('gris')))),
    DT(),
    DT(new Date()).nat(false),
    DT(new Date()).dOpt({rtime:true}),
    NO(1.847584).dOpt({mprecision: 0}),
    NO(1.847584).dOpt({mprecision: 4}),
    NO(1.847584).dOpt({raw:false}),
    NO(1.847584).dOpt({raw:true}),
    NO(125).dOpt({nat:true}),
    NO(10).dOpt({ord:true}),
    NP(NO(0), N("avion")),
    NP(NO(2), N("avion")),
    NP(NO(1.5), N("livre")),
    NP(NO(2.4), N("livre")),
    NP(NO(2), A("rouge"),N("avion")),
    N("pomme").g("w"),    
];

//  exemples en anglais
loadEn(true)
var exemplesEN=[
    V("love"),
    V("have").t("ps"),
    V("be").pe(3),
    VP(V("love")).typ({neg:true}),
    VP(V("love")).typ({int:"yon"}),
    VP(V("love")).typ({prog:true}),
    VP(V("love")).typ({mod:"poss"}),
]

function testEx(exemple){
    console.log(exemple+"")
}

function testAllEx(fn,exemples){
    for (var i = 0; i < exemples.length; i++) {
        fn(exemples[i])
    }
}

function testToSource(exemple){
    var v0=exemple+"";
    var v1=eval(exemple.toSource())+"";
    if (v0.trim()!=v1.trim()){
        console.log("orig:%s\nrgen:%s",v0,v1)
    } else {
        console.log(v1)
    }
}

loadFr();
testAllEx(testEx,exemplesFR)
// testAllEx(testToSource,exemplesFR)

loadEn();
testAllEx(testEx,exemplesEN)
// testAllEx(testToSource,exemplesEN)
