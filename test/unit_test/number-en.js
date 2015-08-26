$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
    
    QUnit.test( "Number EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, isDevEnv: true, printTrace: false});
        
        assert.equal(JSrealB.Module.Number.formatter(1000), "1,000", "1000 => 1,000");
        assert.equal(JSrealB.Module.Number.formatter(1000000), "1,000,000", "1000000 => 1,000,000");
        assert.equal(JSrealB.Module.Number.formatter(1000.1), "1,000.1", "1000.1 => 1,000.1");
        assert.equal(JSrealB.Module.Number.formatter(1.038503437530), "1.04", "1.038503437530 => 1.04");
        assert.equal(JSrealB.Module.Number.formatter(2135454), "2,135,454", "2135454 => 2,135,454");
        assert.equal(JSrealB.Module.Number.formatter(1000.155), "1,000.16", "1000.155 => 1,000.16");
        assert.equal(JSrealB.Module.Number.formatter(99999999999), "99,999,999,999", "99999999999 => 99,999,999,999");
        assert.equal(JSrealB.Module.Number.formatter(15.48), "15.48", "15.48 => 15.48");
    });
    
 });
});