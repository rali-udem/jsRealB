JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Regular rule FR", function( assert ) {
        
        assert.equal( Adv("justement"), "justement", "justement => justement" );
        assert.equal( Adv("ne"), "ne", "ne => ne" );
//        assert.equal( Adv("ne").el(), "n'", "(elision) ne => n'" );
        
        assert.equal( P("jusque"), "jusque", "jusque => jusque" );
//        assert.equal( P("jusque").el(), "jusqu'", "(elision) jusque => jusqu'" );
        assert.equal( P("de"), "de", "de => de" );
//        assert.equal( P("de").el(true), "d'", "(elision) de => d'" );
//        assert.equal( P("dans").el(true), "dans", "(pas elision possible) dans => dans" );
        assert.equal( P("parmi"), "parmi", "parmi => parmi" );
        assert.equal( P("à"), "à", "à => à" );
        assert.equal( P("par"), "par", "par => par" );
    });

    JSrealLoader({
            language: "en",
            lexiconUrl: URL.lexicon.en,
            ruleUrl: URL.rule.en,
            featureUrl: URL.feature
        }, function() {
        QUnit.test( "Regular rule EN", function( assert ) {
            
            assert.equal( P("round"), "round", "round => round" );
            assert.equal( P("through"), "through", "through => through" );
            assert.equal( P("to"), "to", "to => to" );
            assert.equal( P("unlike"), "unlike", "unlike => unlike" );
            
    //        assert.equal( , "", "" );
        });
    });
});