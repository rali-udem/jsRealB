JSrealLoader({
        language: "en",
        lexiconUrl: URL.lexicon.en,
        ruleUrl: URL.rule.en,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "JSrealB init EN", function( assert ) {
        assert.equal( JSrealB.Config.get('language'), "en", "Language is english" );
        assert.notEqual( JSrealB.Config.get('lexicon'), {}, "Lexion is not empty" );
        assert.notEqual( JSrealB.Config.get('rule'), {}, "Rules tables are not empty" );
        assert.notEqual( JSrealB.Config.get('feature'), {}, "Dictionary is not empty" );
        
        assert.equal( JSrealB.Config.get('lexicon.be.V.tab'), "v151", "Check 'be' table number" );
        assert.deepEqual( JSrealB.Config.get('rule.declension.a1.declension'), [{"val": ""}], "Check a1 table declensions" );
        assert.deepEqual( JSrealB.Config.get('feature.category.word.noun'), "N", "Check name of noun in the feature dictionary" );
    });
    
    // new language
    JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "JSrealB init FR", function( assert ) {
        assert.equal( JSrealB.Config.get('language'), "fr", "Language is french" );
        assert.notEqual( JSrealB.Config.get('lexicon'), {}, "Lexion is not empty" );
        assert.notEqual( JSrealB.Config.get('rule'), {}, "Rules tables are not empty" );
        assert.notEqual( JSrealB.Config.get('feature'), {}, "Dictionary is not empty" );
        
        assert.equal( JSrealB.Config.get('lexicon.manger.V.tab'), "v3", "Check 'manger' table number" );
        assert.deepEqual( JSrealB.Config.get('rule.conjugation.v0.ending'), "cer", "Check v0 ending" );
        assert.deepEqual( JSrealB.Config.get('feature.gender.alias'), "g", "Check alias of gender in the feature dictionary" );
    });
});
});