$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
        $.getJSON(URL.test.en, function(test) {
            $.getJSON(URL.feature, function(feature) {
    
    QUnit.test( "Conjugation EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true});

        assert.equal( JSrealB.Module.Conjugation.conjugate("have", "p", 1), "have", "I have" );
        assert.equal( JSrealB.Module.Conjugation.conjugate("love", "p", 2), "love", "You love" );

        // Automated Tests
        var conjugationTable = test.conjugation;
        $.each(conjugationTable, function(verb, verbInfo) {
            if(verbInfo !== null 
                    && $.isPlainObject(verbInfo)
                    && !$.isEmptyObject(verbInfo))
            {
                $.each(verbInfo, function (tenseShortForm, conjugatedVerb) {
                    if(conjugatedVerb.length > 0)
                    {
                        var tenseAndPerson = tenseShortForm.separateTenseAndPerson();

                        assert.equal( JSrealB.Module.Conjugation.conjugate(verb, tenseAndPerson.tense, tenseAndPerson.person), 
                            conjugatedVerb, "(" + tenseShortForm + ") " + verb + " => " + conjugatedVerb);
                    }
                });
            }
        });
    });
    });
    });
    });
});