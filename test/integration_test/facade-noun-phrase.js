JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Syntagme FR", function( assert ) {
        // NP : Noun Phrase
        assert.equal( NP(D("un"), N("camion")), "un camion", "NP : Aucun accord nécessaire" );
        assert.equal( NP(D("un"), N("camion")).n("p"), "des camions", "NP : Accord en nombre" );
        assert.equal( NP(D("un"), N("voiture")), "une voiture", "NP : Accord en genre" );
        assert.equal( NP(D("un"), A("beau"), N("voiture")).n("p"), "des belles voitures", "NP : Accord en genre et nombre" );
        assert.equal( NP(D("un"), N("personne"), A("riche")), "une personne riche", "NP : accord en genre + adjectif");
        
    JSrealLoader({
            language: "en",
            lexiconUrl: URL.lexicon.en,
            ruleUrl: URL.rule.en,
            featureUrl: URL.feature
        }, function() {
        QUnit.test( "Phrase EN", function( assert ) {
            // NP : Noun Phrase
            assert.equal( NP(D("a"), A("lonely"), N("tourist").n("p")), "the lonely tourists", "1. NP: plural" );
            assert.equal( NP(D("a"), N("car")), "a car", "2. NP" );
            assert.equal( NP(D("a"), N("car")).n("p"), "the cars", "3. NP : Accord en nombre" );
            assert.equal( NP(D("a"), A("old"), N("man")).n("p"), "the old men", "4. NP: adjective + plural" );
            assert.equal( NP(D("a"), A("young"), N("man")), "a young man", "5. NP" );
            assert.equal( NP(D("a"), N("bone")), "a bone", "6. NP" );
    //        assert.equal( NP(D("a"), A("old"), N("man")), "an old man", "7. NP: adjective" );
    //        assert.equal( NP(D("a"), N("apple")), "an apple", "8. NP: elision" );
            assert.equal( NP(D("a"), AP(A("big"), A("red")), N("car")), "a big red car", "9. NP" );
            assert.equal(NP(D("the"), N("boy")), "the boy", "10. NP");
        });
    });
});
});