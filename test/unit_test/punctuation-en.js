$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
    
    QUnit.test( "Punctuation EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});
        
        assert.equal( JSrealB.Module.Punctuation.isValid("."), true, "Test if '.' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("..."), true, "Test if '...' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("-"), true, "Test if '-' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid(";"), true, "Test if ';' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid(","), true, "Test if ',' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid(":"), true, "Test if ':' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("*"), true, "Test if '*' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("?"), true, "Test if '?' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("!"), true, "Test if '!' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("("), true, "Test if '(' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid(")"), true, "Test if ')' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("}"), true, "Test if '}' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("{"), true, "Test if '{' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("]"), true, "Test if ']' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid("["), true, "Test if '[' is punctuation mark" );
        assert.equal( JSrealB.Module.Punctuation.isValid('"'), true, "Test if '\"' is punctuation mark" );

        assert.equal( JSrealB.Module.Punctuation.before(" once uppon a time", "-"), "-once uppon a time", " - once uppon a time" );
        assert.equal( JSrealB.Module.Punctuation.before(" once uppon a time", "*"), " *once uppon a time", " *once uppon a time" );
        assert.equal( JSrealB.Module.Punctuation.before(" - once uppon a time", "*"), " *- once uppon a time", " *- once uppon a time" );
        assert.equal( JSrealB.Module.Punctuation.before(" , once uppon a time", "."), ". once uppon a time", ". once uppon a time" );
        assert.equal( JSrealB.Module.Punctuation.after("once uppon a time ", "."), "once uppon a time. ", "once uppon a time. " );
        assert.equal( JSrealB.Module.Punctuation.after("once uppon a time ", "!"), "once uppon a time! ", "once uppon a time! " );
        assert.equal( JSrealB.Module.Punctuation.after("once uppon a time ", ";"), "once uppon a time; ", "once uppon a time; " );
        assert.equal( JSrealB.Module.Punctuation.after("once uppon a time.", ";"), "once uppon a time; ", "once uppon a time; " );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time ", '"'), " \"once uppon a time\" ", ' "once uppon a time" ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time ", '*'), " *once uppon a time* ", ' *once uppon a time* ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time ", '('), " (once uppon a time) ", ' (once uppon a time) ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time ", ')'), " (once uppon a time) ", ' (once uppon a time) ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time ", '['), " [once uppon a time] ", ' [once uppon a time] ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" once uppon a time? ", '['), " [once uppon a time?] ", ' [once uppon a time?] ' );
        assert.equal( JSrealB.Module.Punctuation.surround("once uppon a time? ", '{'), " {once uppon a time?} ", ' {once uppon a time?} ' );

        //    assert.equal( , "", "" );

        });
    });
});
});