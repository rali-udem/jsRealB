JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Exception", function( assert ) {
        
        assert.raises(function() { throw N("fille").g("m").toString(); }, 
                function(err) { return err === "[[fille]]"; }, "1. Exception");
                
        assert.raises(function() { throw N("pas").g("f").toString(); }, 
                function(err) { return err === "[[pas]]"; }, "2. Exception");
                
        assert.raises(function() { throw V("manger").t("pc").toString(); }, 
                function(err) { return err === "[[manger]]"; }, "3. Exception");
                
        assert.raises(function() { throw N("KHFOUYFLKDJL").toString(); }, 
                function(err) { return err === "[[KHFOUYFLKDJL]]"; }, "4. Exception");
                
        assert.raises(function() { throw N("jouet").a("isNotPunctuationMark").toString(); }, 
                function(err) { return err === "[[jouet]]"; }, "5. Exception");
    });
});

