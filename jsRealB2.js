// ////////
loadFr();
console.log(N("chat").toString());
console.log(NP(D("le"),N("chat")).toString());
console.log(S(NP(D('le'),N('chat')).n("p")).toString());
console.log(""+V("aller").t("ps").pe(2).n("p"))
console.log(""+V("aller").t("pc").pe(3).n("s"))
console.log(""+VP(V("aller")).t("f").pe(1).n("p").typ({neg:true}))
console.log(""+VP(V("aller")).t("pq").pe(2).n("s").typ({neg:true}))

console.log(""+
    S(NP(D("le"),N("chat").g("f")).n("p"),
      VP(V("manger"),
         NP(D("le"),N("souris"))))
);

console.log(""+
    S(NP(D("le"),N("chat").g("f")).n("p"),
      VP(V("manger"),
         NP(D("le"),N("souris")))).typ({pas:true})
);

console.log(""+
    S(NP(D('le'),Q("super"),
         N('chat').g("f").tag("b").tag("i")).n("p"),
      VP(V('dévorer').t('pc'),
         NP(D('le'),
            N('souris'),
            A("gris"),"Wow!").tag("a",{href:"http://wikipedia.org/cat",target:"_blank"}))
        ).typ({neg:true})
);

console.log(""+
S(NP(D('le'),
        N('souris')).n("p"),
  VP(V('être'),
        AP(A('gris')))).typ({neg:true})
);

console.log(
    S(Pro("je").n("p").pe(2),
      VP(V("avoir").t("cp"),
         NP(NO(2),A("beau"),N("ami").g("f")))).typ({neg:"plus"}).toString()
)

addToLexicon({"John":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":["n16"]}}})
console.log(""+
S(NP(N("John")),
  VP(V("évanouir")).t("pc"),
     PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}).toString()
)
console.log(""+
S(CP(C("et"),NP(N("John")),NP(N("Mary"))),
  VP(V("évanouir")).t("pc"),
     PP(P("à"),DT("1979-05-21T10:05:00"))).typ({neg:true}).toString()
)


var pomme = NP(D("le"),N("pomme"));
var  gars = NP(D("le"),N("garçon")).n("p");
console.log(S(VP().add(V("aimer")).add(pomme)).add(gars,0)+"");

console.log(S(CP(C("et"),NP(D("le"),N("fruit"))).add(pomme).add(gars),
              VP(V("venir").t("pc"),
                 Adv("hier")))+"");

console.log(S(CP(C("et"),NP(D("le"),N("orange"))).add(pomme),
              VP(V("arriver").t("pc"),
                 Adv("hier")))+"");

console.log(S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme"))))+"")
console.log(S(Pro("je"),
              VP(V("manger").t("pc"),
                 NP(D("le"),N("pomme")).tag("i").pro()))+"")
console.log(S(NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("qui"),
                    VP(V("manger").aux("êt").t("pc")))))+"")
console.log(NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("que"),
                    Pro("je"),
                    VP(V("manger").t("pc"))))+"")
console.log(S(NP(D("le"),N("pomme").tag("i"),
                 SP(Pro("que"),
                    Pro("je"),
                    VP(V("manger").t("pc")))
).pro()).toString())

console.log(S(NP(D("le"),N("enfant")),VP(V("manger"),NP(D("le"),N("gâteau")))).n("p").typ({pas:true})+"")
console.log(S(Pro("je").pe(1).n("p"), VP(V("agir").t("pc"), AdvP(Adv("conformément"),
                      PP(P("à"), NP(D("le"), N("loi")))))).t("pc").typ({neg:true})+"")
console.log(S(NP(D('le'),
                 N('souris'),
                 SP(Pro('que'),
                     NP(D('le'),
                         N('chat')).n("p"),
                     VP(V('manger').t('pc')))),
              VP(V('être').t('p'),
                 AP(A('gris'))))+"")


console.log(DT(new Date())+"")
console.log(DT(new Date()).nat(false)+"")
console.log(DT(new Date()).dOpt({rtime:true})+"")

console.log(NO(1.847584).dOpt({mprecision: 0})+"")
console.log(NO(1.847584).dOpt({mprecision: 4})+"")
console.log(NO(1.847584).dOpt({raw:false})+"")
console.log(NO(1.847584).dOpt({raw:true})+"")
console.log(NO(125).dOpt({nat:true})+"")
console.log(NO(10).dOpt({ord:true})+"")

console.log(NP(NO(0), N("avion"))+"")
console.log(NP(NO(2), N("avion"))+"")
console.log(NP(NO(1.5), N("livre"))+"")
console.log(NP(NO(2.4), N("livre"))+"")
console.log(NP(NO(2), A("rouge"),N("avion"))+"")
//
console.log(N("pomme").g("w")+"")


loadEn(true)
console.log(V("love")+"")
console.log(V("have").t("ps")+"")
console.log(V("be").pe(3)+"")
console.log(VP(V("love")).typ({neg:true})+"")
console.log(VP(V("love")).typ({int:"yon"})+"")
console.log(VP(V("love")).typ({prog:true})+"")
console.log(VP(V("love")).typ({mod:"poss"})+"")

loadFr(true);