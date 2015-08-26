$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
    
    QUnit.test( "Ponctuation FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});
        
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
        
        assert.equal( JSrealB.Module.Punctuation.before(" il était une fois", "-"), "-il était une fois", " - il était une fois" );
        assert.equal( JSrealB.Module.Punctuation.before(" il était une fois", "*"), " *il était une fois", " *il était une fois" );
        assert.equal( JSrealB.Module.Punctuation.before(" - il était une fois", "*"), " *- il était une fois", " *- il était une fois" );
        assert.equal( JSrealB.Module.Punctuation.before(" , il était une fois", "."), ". il était une fois", ". il était une fois" );
        assert.equal( JSrealB.Module.Punctuation.after("il était une fois ", "."), "il était une fois. ", "il était une fois. " );
        assert.equal( JSrealB.Module.Punctuation.after("il était une fois ", "!"), "il était une fois ! ", "il était une fois ! " );
        assert.equal( JSrealB.Module.Punctuation.after("il était une fois ", ";"), "il était une fois ; ", "il était une fois ; " );
        assert.equal( JSrealB.Module.Punctuation.after("il était une fois.", ";"), "il était une fois ; ", "il était une fois ; " );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ", '"'), " \"il était une fois\" ", ' "il était une fois" ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ", '*'), " *il était une fois* ", ' *il était une fois* ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ", '('), " (il était une fois) ", ' (il était une fois) ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ", ')'), " (il était une fois) ", ' (il était une fois) ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ", '['), " [il était une fois] ", ' [il était une fois] ' );
        assert.equal( JSrealB.Module.Punctuation.surround(" il était une fois ? ", '['), " [il était une fois ?] ", ' [il était une fois ?] ' );
        assert.equal( JSrealB.Module.Punctuation.surround("il était une fois ? ", '{'), " {il était une fois ?} ", ' {il était une fois ?} ' );

        //    assert.equal( , "", "" );

        });
    });
});
});