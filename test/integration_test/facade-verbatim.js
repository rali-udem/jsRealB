JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Verbatim FR", function( assert ) {
        assert.equal(NP(D("un"), N("joueur"), "gentille").g("f"), "une joueuse gentille", "1. Verbatim");
        assert.equal(S("bonjour"), "Bonjour.", "2. Verbatim");
        assert.equal(S(NP(Pro("je").pe(1)), VP(V("être").t("p"), "John")).a("!"), "Je suis John !", "3. Verbatim");
        assert.equal(PP(P("à"), NP(N("midi"))), "à midi", "4. Verbatim");
        assert.equal(VP(V("manger").t("p"), "un oeuf"), "mange un oeuf", "5. Verbatim");
        
        JSrealLoader({
        language: "en",
        lexiconUrl: URL.lexicon.en,
        ruleUrl: URL.rule.en,
        featureUrl: URL.feature
            }, function() {
            QUnit.test( "Verbatim EN", function( assert ) {
                assert.equal(NP(D("the"), "kind", N("player")), "the kind player", "1. Verbatim");
                assert.equal(S("Hello World").a("!"), "Hello World!", "2. Verbatim");
                assert.equal(S(NP(Pro("I").pe(1)), VP(V("be").t("p"), "John")).a("!"), "I am John!", "3. Verbatim");
                assert.equal(S("we did something ", PP(P("at"), NP(N("midnight")))), "We did something at midnight.", "4. Verbatim");
                assert.equal(VP(V("eat"), "an apple").t("p"), "eats an apple", "5. Verbatim");
                assert.equal( NP("no more", N("bottle").n("p")), "no more bottles", "6. Verbatim");
            });
        });
    });
});