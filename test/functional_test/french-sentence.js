JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Sentence FR", function( assert ) {
        assert.equal(
            S(
                NP( D('le'),
                    N('souris'),
                    SP( C('que'),
                        NP(D('le'),
                            N('chat')).n("p"),
                        VP(V('manger').t('f')))),
                VP( V('être').t('p'),
                    AP(A('gris')))
            ),
            "La souris que les chats mangeront est grise.",
            "1. Sentence"
        );
        assert.equal( S(N("cadeau").n("p")).cap(false), "cadeaux.", "2. S : Première lettre en minuscule" );
        assert.equal( S(A("beau").n("p"), N("cadeau").n("p")).cap(true), "Beaux cadeaux.", "3. S : Première lettre en majuscule 2" );
        assert.equal( S( NP(D("le"), N("père"), PP(P("de"), NP(D("mon").pe(1), N("fille")) ) )), "Le père de ma fille.", "4. S : Syntagme complexe");
        assert.equal( S(NP(Pro("je").pe(3)), VP(V("agir"), AdvP(Adv("conformément"), PP(P("à"), NP(D("le"), N("loi")))))).t("p"), "Il agit conformément à la loi.", "5. S" );
        assert.equal( S(NP(Pro("je")).pe(2), VP(V("travailler"), AdvP(Adv("bien"))).t("p")), "Tu travailles bien.", "8. S" );
        assert.equal( S(CP(C("et"), NP(D("le"), N("garçon")), NP(D("le"), N("fille"))), VP(V("dormir")).t("p")), "Le garçon et la fille dorment.", "7. S" );
        assert.equal( S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))), "La boulangère et la cliente parlent.", "8. S" );
        assert.equal( S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), NP(D("le"), N("vendeur")), NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))), "La boulangère, le vendeur et la cliente parlent.", "9. S" );
    });
});