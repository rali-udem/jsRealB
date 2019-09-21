QUnit.test( "Phrase FR", function( assert ) {
    loadFr();
    var phrases = [
        {expression:S(
                    NP( D('le'),
                        N('souris'),
                        SP( C('que'),
                            NP(D('le'),
                                N('chat')).n("p"),
                            VP(V('manger').t('pc')))),
                    VP( V('être').t('p'),
                        AP(A('gris')))
                ),
         expected:"La souris que les chats ont mangé est grise.",
         message:"Phrase avec attribut, mais le passé composé avec avoir n'est pas accordé correctement..."},
        {expression:S(N("cadeau").n("p")).cap(false),
         expected:"cadeaux.",
         message:"Phrase sans capitale"},
        {expression:S(NP(A("beau"), N("cadeau")).n("p")),
         expected:"Beaux cadeaux.",
         message:"Accord adjectif"},
        {expression:NP(D("le"),N("gens"),A("bon").g("f").pos("pre")).n("p"),
         expected:"les bonnes gens",
         message:"Adjectif pré-posé"},
        {expression:S( NP(D("le"), N("père"), PP(P("de"), NP(D("mon").pe(1), N("fille")) ) )),
         expected:"Le père de ma fille.",
         message:"Accord adjectif"},
        {expression:S(NP(Pro("je").pe(1).n("p")), VP(V("agir").t("pc"), AdvP(Adv("conformément"), 
                      PP(P("à"), NP(D("le"), N("loi")))))).t("pc").typ({neg:true}),
         expected:"Nous n'avons pas agi conformément à la loi.",
         message:"Phrase négative avec accord du verbe"},
        {expression:S(NP(Pro("je")).pe(2), VP(V("travailler"), AdvP(Adv("bien"))).t("pc")).typ({mod:"nece"}),
         expected:"Tu as dû travailler bien.",
         message:"Phrase au passé avec modalité de nécessité"},
        {expression:S(CP(C("et"), NP(D("le"), N("garçon")), NP(D("le"), N("fille"))), 
                      VP(V("être"),A("gentil")).t("p")),
         expected:"Le garçon et la fille sont gentils.",
         message: "Coordination"},
        {expression:S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), 
                      NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))).typ({int:"yon"}),
         expected:"Est-ce que la boulangère et la cliente parlent?",
         message:"Coordination et interrogation"},
        {expression:S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), NP(D("le"), N("vendeur")), 
                      NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))),
         expected:"La boulangère, le vendeur et la cliente parlent.",
         message:"Coordination"},
        {expression:S(NP(D("le"),N("enfant")),VP(V("manger"),NP(D("le"),N("gâteau")))).n("p").typ({pas:true}),
         expected:"Les gâteaux sont mangés par l'enfant.",
         message:"Passif avec élision"},
        {expression:S(NP(D("le"),N("enfant")).pro(),VP(V("manger"),NP(D("le"),N("gâteau")))).n("p"),
         expected:"Ils mangent le gâteau.",
         message:"Pronominalisation du sujet"},
        {expression:S(NP(D("le"),N("enfant")),VP(V("manger"),NP(D("le"),N("gâteau")).pro())).n("p"),
         expected:"Les enfants le mangent.",
         message:"Pronominalisation du complément"},
    ];
    for (var i = 0; i < phrases.length; i++) {
        var s=phrases[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});

