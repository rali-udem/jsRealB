$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
    
    QUnit.test( "Regular Rule FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});

        var featureElision = {};
        
        assert.equal( JSrealB.Module.RegularRule.apply("activement", JSrealB.Config.get('feature.category.word.adverb')), "activement", "activement => activement" );
//        assert.equal( JSrealB.Module.RegularRule.apply("ne", JSrealB.Config.get('feature.category.word.adverbe'), featureElision), "n'", "(elision) ne => n'" )
        
        assert.equal( JSrealB.Module.RegularRule.apply("par", JSrealB.Config.get('feature.category.word.preposition')), "par", "par => par" );
//        assert.equal( JSrealB.Module.RegularRule.apply("de", JSrealB.Config.get('feature.category.word.preposition'), featureElision), "d'", "(elision) de => d'" );
//        assert.equal( JSrealB.Module.RegularRule.apply("jusque", JSrealB.Config.get('feature.category.word.preposition'), featureElision), "l'", "(elision) le => l'" );
        
        
        
//        assert.equal( JSrealB.Module.RegularRule.apply("", JSrealB.Config.get('feature.category.word.preposition')), "", " => " );
    });
    });
});
});