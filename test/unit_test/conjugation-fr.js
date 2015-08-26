$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
        $.getJSON(URL.test.fr, function(test) {
        $.getJSON(URL.feature, function(feature) {
    
    QUnit.test( "Conjugation FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true});

        // Regular verbs
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 1), "aime", "J'aime" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 2), "aimes", "Tu aimes" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 3), "aime", "Il aime" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 4), "aimons", "Nous aimons" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 5), "aimez", "Vous aimez" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('aimer', 'p', 6), "aiment", "Ils aiment" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 1), "place", "Je place" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 2), "places", "Tu places" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 3), "place", "Il place" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 4), "plaçons", "Nous plaçons" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 5), "placez", "Vous placez" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('placer', 'p', 6), "placent", "Ils placent" );
        
        // Special verbs
        
        assert.notEqual( JSrealB.Module.Conjugation.conjugate('vouloir', 'ip', 1), null, "Personne qui n'existe pas à l'impératif" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('vouloir', 'ip', 2), "veuille", "Veuille" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('vouloir', 'ip', 4), "voulons", "Voulons" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('vouloir', 'ip', 5), "veuillez", "Veuillez" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('falloir', 's', 3), "faille", "Qu'il faille" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('refaire', 'ip', 2), "refais", "Tu refais" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('pouvoir', 's', 4), "puissions", "Que nous puissions" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('croire', 'ip', 2), "crois", "Tu crois" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('croire', 'pp', null), "cru", "Cru" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('mouvoir', 'pp', null), "mu", "Mu" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('croître', 's', 2), "croisses", "Que tu Croisses" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('croître', 'pp', null), "crû", "Crû" );
        
        assert.equal( JSrealB.Module.Conjugation.conjugate('abattre', 'p', 3), "abat", "Il abat" );
        assert.equal( JSrealB.Module.Conjugation.conjugate('vêtir', 'p', 3), "vêt", "Il vêt" );
        
        // Automated Tests
        var conjugationTable = test.conjugation;
        $.each(conjugationTable, function(verb, verbInfo) {
            if(verbInfo !== null 
                    && $.isPlainObject(verbInfo)
                    && !$.isEmptyObject(verbInfo))
            {
                var tenses = Object.keys(verbInfo);
                
                var tenseShortForm = tenses[Math.floor(tenses.length * Math.random())];
                var conjugatedVerb = verbInfo[tenseShortForm];
                if(conjugatedVerb.length > 0)
                {
                    var tenseAndPerson = tenseShortForm.separateTenseAndPerson();
                
                    assert.equal( JSrealB.Module.Conjugation.conjugate(verb, tenseAndPerson.tense, tenseAndPerson.person), 
                        conjugatedVerb, "(" + tenseShortForm + ") " + verb + " => " + conjugatedVerb);
                }
            }
        });
    
//    assert.equal( , "", "" );

    });
    });
    });
    });
});

