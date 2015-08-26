$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
    
    QUnit.test( "Number FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, isDevEnv: true, printTrace: false});
        
        assert.equal(JSrealB.Module.Number.formatter(1000), "1 000", "1000 => 1 000");
        assert.equal(JSrealB.Module.Number.formatter(1000000), "1 000 000", "1000000 => 1 000 000");
        assert.equal(JSrealB.Module.Number.formatter(1000.1), "1 000,1", "1000.1 => 1 000,1");
        assert.equal(JSrealB.Module.Number.formatter(1.038503437530), "1,04", "1.038503437530 => 1,04");
        assert.equal(JSrealB.Module.Number.formatter(2135454), "2 135 454", "2135454 => 2 135 454");
        assert.equal(JSrealB.Module.Number.formatter(1000.155), "1 000,16", "1000.155 => 1 000,16");
        assert.equal(JSrealB.Module.Number.formatter(99999999999), "99 999 999 999", "99999999999 => 99 999 999 999");
        assert.equal(JSrealB.Module.Number.formatter(15.48), "15,48", "15.48 => 15,48");
        
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber(15.48), "p", "1. Grammatical number");
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber(1.45), "s", "2. Grammatical number");
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber(0.988), "s", "3. Grammatical number");
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber(-12), "p", "4. Grammatical number");
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber(2), "p", "5. Grammatical number");
        assert.equal(JSrealB.Module.Number.getGrammaticalNumber("0.5485894"), "s", "6. Grammatical number");
    });
    
 });
});