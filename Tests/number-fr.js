QUnit.test( "Nombres FR", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadFr();
    
    assert.equal(NO(1000).toString(), "1 000", "1000 => 1 000");
    assert.equal(NO(1000000).toString(), "1 000 000", "1000000 => 1 000 000");
    assert.equal(NO(1000.1).toString(), "1 000,1", "1000.1 => 1 000,1");
    assert.equal(NO(1.038503437530).toString(), "1,04", "1.038503437530 => 1,04");
    assert.equal(NO(2135454).toString(), "2 135 454", "2135454 => 2 135 454");
    assert.equal(NO(1000.155).toString(), "1 000,16", "1000.155 => 1 000,16");
    assert.equal(NO(99999999999).toString(), "99 999 999 999", "99999999999 => 99 999 999 999");
    assert.equal(NO(15.48).toString(), "15,48", "15.48 => 15,48");
    
    assert.equal(NP(NO(15.48),N("livre")).toString(), "15,48 livres", "1. Accord avec le nombre");
    assert.equal(NP(NO(1.45),N("livre")).toString(), "1,45 livre", "2. Accord avec le nombre");
    assert.equal(NP(NO(0.988),N("livre")).toString(), "0,99 livre", "3. Accord avec le nombre");
    assert.equal(NP(NO(-12),N("livre")).toString(), "-12 livres", "4. Accord avec le nombre");
    assert.equal(NP(NO(2),N("livre")).toString(), "2 livres", "5. Accord avec le nombre");
    assert.equal(NP(NO("0.5485894"),N("livre")).toString(), "0,55 livre", "6. Accord avec le nombre");
});
