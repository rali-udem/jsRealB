JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Ponctuation FR", function( assert ) {
        // Conjunction
        assert.equal( C("et/ou"), "et/ou", "1. Conjonction" );
        assert.equal( C("et"), "et", "2. Conjonction" );
        assert.equal( C("ou"), "ou", "3. Conjonction" );
        assert.equal( C("-"), "-", "4. Conjonction" );
        assert.equal( C(";"), ";", "5. Conjonction" );
        assert.equal( C(","), ",", "6. Conjonction" );
        
        // before
        assert.equal( S(N("cadeau").n("p")).b("-").cap(), "-Cadeaux.", "Tiret en début de phrase" );
        assert.equal( S(N("cadeau").n("p")).b("*").cap(), "*Cadeaux.", "Etoile en début de phrase" );
        assert.equal( S(N("cadeau").n("p")).b(".").cap(), ". Cadeaux.", "Point en début de phrase" );

        // after
        assert.equal( S(N("cadeau").n("p")).a(",").cap(), "Cadeaux,", "1 virgule d'exclamation en fin de phrase" );
        assert.equal( S(N("cadeau").n("p")).a("!").cap(), "Cadeaux !", "1 point d'exclamation en fin de phrase" );
        assert.equal( S(N("cadeau").n("p")).a("...").cap(), "Cadeaux...", "3 points en fin de phrase" );
        assert.equal( S(N("cadeau").n("p").a("..."), V("dormir").t("p").pe(3), V("manger").t("p").pe(1)).cap(), "Cadeaux... dort mange.", "Ponctuation sur des éléments à l'intérieur de la phrase" );
        
        // surround
        assert.equal( S(N("cadeau").n("p")).en("(").cap(), "(Cadeaux)", "Entourer la phrase de parenthèses" );
        assert.equal( S(N("cadeau").n("p")).en(")").cap(), "(Cadeaux)", "Entourer la phrase de parenthèses" );
        assert.equal( S(N("cadeau").n("p")).a("!").en("[").cap(), "[Cadeaux !]", "Entourer la phrase de crochets" );
        assert.equal( S(N("cadeau").n("p")).a("!").en("]").cap(), "[Cadeaux !]", "Entourer la phrase de crochets" );
        assert.equal( S(A("grand").g("f"), N("maison"), N("cadeau").n("p").a("!").en("]")).cap(), "Grande maison [cadeaux !].", "Entourer la phrase de crochets" );
        
        //        assert.equal( , "", "" );
    });

    JSrealLoader({
            language: "en",
            lexiconUrl: URL.lexicon.en,
            ruleUrl: URL.rule.en,
            featureUrl: URL.feature
        }, function() {
        QUnit.test( "Punctuation EN", function( assert ) {
            // before
            assert.equal( S(N("gift").n("p")).b("-").cap(), "-Gifts.", "Tiret en début de phrase" );
            assert.equal( S(N("gift").n("p")).b("*").cap(), "*Gifts.", "Etoile en début de phrase" );
            assert.equal( S(N("gift").n("p")).b(".").cap(), ". Gifts.", "Point en début de phrase" );

            // after
            assert.equal( S(N("gift").n("p")).a(",").cap(), "Gifts,", "1 virgule d'exclamation en fin de phrase" );
            assert.equal( S(N("gift").n("p")).a("!").cap(), "Gifts!", "1 point d'exclamation en fin de phrase" );
            assert.equal( S(N("gift").n("p")).a("...").cap(), "Gifts...", "3 points en fin de phrase" );
            assert.equal( S(N("gift").n("p").a("..."), V("sleep").t("p").pe(3), V("eat").t("p").pe(1)).cap(), "Gifts... sleeps eat.", "Ponctuation sur des éléments à l'intérieur de la phrase" );

            // surround
            assert.equal( S(N("gift").n("p")).en("(").cap(), "(Gifts)", "Entourer la phrase de parenthèses" );
            assert.equal( S(N("gift").n("p")).en(")").cap(), "(Gifts)", "Entourer la phrase de parenthèses" );
            assert.equal( S(N("gift").n("p")).a("!").en("[").cap(), "[Gifts!]", "Entourer la phrase de crochets" );
            assert.equal( S(N("gift").n("p")).a("!").en("]").cap(), "[Gifts!]", "Entourer la phrase de crochets" );
            assert.equal( S(A("big").f("su"), N("house"), N("gift").n("p").a("!").en("]")).cap(), "Biggest house [gifts!].", "Entourer la phrase de crochets" );
        });
    });
});