QUnit.test( "Nombres FR", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadFr();
    
    assert.equal(NO(1000).realize(), "1 000", "1000 => 1 000");
    assert.equal(NO(1000000).realize(), "1 000 000", "1000000 => 1 000 000");
    assert.equal(NO(1000.1).realize(), "1 000,1", "1000.1 => 1 000,1");
    assert.equal(NO(1.038503437530).realize(), "1,04", "1.038503437530 => 1,04");
    assert.equal(NO(2135454).realize(), "2 135 454", "2135454 => 2 135 454");
    assert.equal(NO(1000.155).realize(), "1 000,16", "1000.155 => 1 000,16");
    assert.equal(NO(99999999999).realize(), "99 999 999 999", "99999999999 => 99 999 999 999");
    assert.equal(NO(15.48).realize(), "15,48", "15.48 => 15,48");
    
    assert.equal(NP(NO(15.48),N("livre")).realize(), "15,48 livres", "1. Accord avec le nombre");
    assert.equal(NP(NO(1.45),N("livre")).realize(), "1,45 livre", "2. Accord avec le nombre");
    assert.equal(NP(NO(0.988),N("livre")).realize(), "0,99 livre", "3. Accord avec le nombre");
    assert.equal(NP(NO(-12),N("livre")).realize(), "-12 livres", "4. Accord avec le nombre");
    assert.equal(NP(NO(2),N("livre")).realize(), "2 livres", "5. Accord avec le nombre");
    assert.equal(NP(NO(1),N("livre")).realize(), "1 livre", "5. Accord avec le nombre");
    assert.equal(NP(NO("0.5485894"),N("livre")).realize(), "0,55 livre", "6. Accord avec le nombre");
    assert.equal( NO(1).nat().realize(), "un", "1 -> un");
    assert.equal( NP(NO(1).nat(),N("fille")).realize(), "une fille", "1 -> une");
    assert.equal( NO(47).nat().realize(), "quarante-sept", "47 -> quarante-sept");
    assert.equal( NO(13579086).nat().realize(), "treize millions cinq cent soixante-dix-neuf mille quatre-vingt-six", "gros nombre (langue naturelle)"); 
});
