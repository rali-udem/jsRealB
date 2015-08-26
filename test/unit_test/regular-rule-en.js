$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
    
    QUnit.test( "Regular Rule EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});

        assert.equal( JSrealB.Module.RegularRule.apply("through", JSrealB.Config.get('feature.category.word.preposition')), "through", "through => through" );
        assert.equal( JSrealB.Module.RegularRule.apply("to", JSrealB.Config.get('feature.category.word.preposition')), "to", "to => to" );
        assert.equal( JSrealB.Module.RegularRule.apply("with", JSrealB.Config.get('feature.category.word.preposition')), "with", "with => with" );
        assert.equal( JSrealB.Module.RegularRule.apply("without", JSrealB.Config.get('feature.category.word.preposition')), "without", "without => without" );
        assert.equal( JSrealB.Module.RegularRule.apply("about", JSrealB.Config.get('feature.category.word.preposition')), "about", "about => about" );
    });
    });
});
});