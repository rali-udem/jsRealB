JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Déclinaison FR", function( assert ) {
        
        // Noun
        assert.equal( N("jouet").n("s"), "jouet", "Nom au singulier" );
        assert.equal( N("jouet").n("p"), "jouets", "Nom au pluriel" );
        
        assert.equal( N("copain").n("s").g("f"), "copine", "Nom au singulier féminin" );
        assert.equal( N("copain").g("f").n("s"), "copine", "Nom au féminin singulier" );
        assert.equal( N("copain").n("p").g("f"), "copines", "Nom au pluriel féminin" );
        assert.equal( N("copain").g("f").n("p"), "copines", "Nom au féminin pluriel" );
        
        assert.equal( N("cycliste"), "cycliste", "Nom avec un genre x (sans genre déterminé)" );
        assert.equal( N("équipe"), "équipe", "Nom féminin" );
        
        // Adjective
        assert.equal( A("vieux").g("m").n("s"), "vieux", "Adjectif au masculin singulier" );
        assert.equal( A("vieux").g("m").n("p"), "vieux", "Adjectif au masculin pluriel" );
        assert.equal( A("vieux").g("f").n("s"), "vieille", "Adjectif au féminin singulier" );
        assert.equal( A("vieux").g("f").n("p"), "vieilles", "Adjectif au féminin singulier" );
        
        assert.equal( Pro("ce"), "ce", "ce => ce" );
        assert.equal( Pro("que"), "que", "que => que" );
        assert.equal( Pro("je").n("p").pe("3"), "ils", "(p3 masc plur) je => ils" );
        assert.equal( Pro("je").n("p").g("f").pe(3), "elles", "(p3 fem plur) je => elles" );
        assert.equal( Pro("je").n("p").pe(2), "vous", "(p2 plur) je => vous" );
        assert.equal( Pro("me").pe(2), "te", "(p2) me => te" );
        assert.equal( Pro("moi").pe(3), "lui", "(p3) moi => lui" );
        assert.equal( Pro("en"), "en", "en => en" );
        assert.equal( Pro("ceci"), "ceci", "ceci => ceci" );
        
        assert.equal( D("un").g("f").n("p"), "des", "1. D" );
        assert.equal( D("un").g("m").n("p"), "des", "2. D" );
        assert.equal( D("un").g("f"), "une", "3. D" );
        assert.equal( D("mon").g("m").n("p").pe(2), "tes", "4. D" );
        assert.equal( D("mon").n("p").pe(3), "ses", "5. D" );
        assert.equal( D("mon").n("s").pe(3), "son", "6. D" );
        assert.equal( D("mon").n("p").pe(1), "mes", "7. D" );
        assert.equal( D("notre").n("p").pe(3), "leurs", "8. D" );
        assert.equal( D("notre").n("p").pe(2), "vos", "9. D" );
        assert.equal( D("notre").pe(3), "leur", "10. D" );
        
//        assert.equal( , "", "" );
    });

    JSrealLoader({
            language: "en",
            lexiconUrl: URL.lexicon.en,
            ruleUrl: URL.rule.en,
            featureUrl: URL.feature
        }, function() {
        QUnit.test( "Declension EN", function( assert ) {

            // Noun
            assert.equal( N("game").n("s"), "game", "Nom au singulier" );
            assert.equal( N("game").n("p"), "games", "Nom au pluriel" );

            assert.equal( N("child").n("s"), "child", "Nom au singulier" );
            assert.equal( N("child").n("p"), "children", "Nom au pluriel" );

            // Adjective
            assert.equal( A("easy").f('su'), "easiest", "Adjectif -> superlative 1" );
            assert.equal( A("cold").f('su'), "coldest", "Adjectif -> superlative 2" );
            assert.equal( A("tall").f('su'), "tallest", "Adjectif -> superlative 3" );

            assert.equal( A("happy").f('co'), "happier", "Adjectif -> comparative 1" );
            assert.equal( A("lucky").f('co'), "luckier", "Adjectif -> comparative 2" );
            assert.equal( A("easy").f('co'), "easier", "Adjectif -> comparative 3" );

            // Pronoun
            assert.equal( Pro("anybody").n("s").pe(3), "anybody", "anybody => anybody" );
            assert.equal( Pro("anybody").n("p").pe(3), "anybody", "anybody => anybody" );
            assert.equal( Pro("anything").n("s").g("f").pe(3), "anything", "anything => anything" );
            assert.equal( Pro("anything").n("p").g("f").pe(3), "anything", "anything => anything" );
            assert.equal( Pro("I").n("p").g("f").pe(1), "we", "(p1 plur fem) I => we" );
            assert.equal( Pro("I").n("s").g("f").pe(3), "she", "(p3 sing fem) I => she" );
            assert.equal( Pro("mine").n("s").g("f").pe(3), "hers", "(p3 sing fem) mine => hers" );
            
            // Determiner
            assert.equal( D("my").pe(3).g("f"), "her", "(p3 sing fem) my => her" );
            assert.equal( D("my").pe(3).g("n"), "its", "(p3 sing neuter) my => its" );
            assert.equal( D("my").pe(1).g("m").n("p").ow("p"), "our", "(p3 plur masc) my => our" );
            
            // Adverb
            assert.equal( Adv("ill"), "ill", "ill => ill" );
            assert.equal( Adv("badly").f("co"), "worse", "(co) badly => worse" );
            assert.equal( Adv("badly").f("su"), "worst", "(su) badly => worst" );
            assert.equal( Adv("little").f("co"), "less", "(co) little => less" );
            assert.equal( Adv("little").f("su"), "least", "(su) little => least" );
            
    //        assert.equal( , "", "" );
        });
    });
});