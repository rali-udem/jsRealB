JSrealLoader({
        language: "en",
        lexiconUrl: URL.lexicon.en,
        ruleUrl: URL.rule.en,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Sentence EN", function( assert ) {
        assert.equal(
            S(
                NP(D("the"), N("cat")),
                VP(V("sit"), PP(P("on"), NP(D("the"), N("coach")))).t("ps")
            ),
            "The cat sat on the coach.",
            "1. Sentence"
        );
        assert.equal( S(N("gift").n("p")).cap(), "Gifts.", "2. Use of 'sentence' with first letter in upper case" );
        assert.equal( S(NP(D("a"), N("man")), VP(V("hit"), NP(D("a"), N("ball")))).t("p"), "A man hits a ball.", "3. S" );
        assert.equal( S(NP(D("a"), N("cat")), VP(V("play"), NP(N("piano")))).t("p"), "A cat plays piano.", "4. S" );
        assert.equal( S(NP(A("nice"), N("dog")).n("p"), VP(V("like").n("p"), NP(N("cat")).n("p"))).t("p"), "Nice dogs like cats.", "5. S");
        assert.equal( S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).t("p"), "A boy drinks water.", "6. S" );
        assert.equal( S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water"))).pe(3)).t("p"), "A boy drinks water.", "6. S" );
        assert.equal( S(CP(C("and"), NP(D("the"), N("seller")), NP(D("the"), N("customer"))), VP(V("speak"))), "The seller and the customer speak.", "6. S" );
    });
});