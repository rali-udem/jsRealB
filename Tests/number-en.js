QUnit.test( "Number EN", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadEn();
    assert.equal(NO(1000).realize(), "1,000", "1000 => 1,000");
    assert.equal(NO(1000000).realize(), "1,000,000", "1000000 => 1,000,000");
    assert.equal(NO(1000.1).realize(), "1,000.1", "1000.1 => 1,000.1");
    assert.equal(NO(1.038503437530).realize(), "1.04", "1.038503437530 => 1.04");
    assert.equal(NO(2135454).realize(), "2,135,454", "2135454 => 2,135,454");
    assert.equal(NO(1000.155).realize(), "1,000.16", "1000.155 => 1,000.16");
    assert.equal(NO(99999999999).realize(), "99,999,999,999", "99999999999 => 99,999,999,999");
    assert.equal(NO(15.48).realize(), "15.48", "15.48 => 15.48");

    assert.equal(NP(NO(15.48),N("pound")).realize(), "15.48 pounds", "1. Accord avec le nombre");
    assert.equal(NP(NO(1.45),N("pound")).realize(), "1.45 pounds", "2. Accord avec le nombre");
    assert.equal(NP(NO(1),N("pound")).realize(), "1 pound", "3.a Accord avec le nombre");
    assert.equal(NP(NO(0),N("pound")).realize(), "0 pounds", "3.a Accord avec le nombre");
    assert.equal(NP(NO(0.988),N("pound")).realize(), "0.99 pounds", "3. Accord avec le nombre");
    assert.equal(NP(NO(-12),N("pound")).realize(), "-12 pounds", "4. Accord avec le nombre");
    assert.equal(NP(NO(2),N("pound")).realize(), "2 pounds", "5. Accord avec le nombre");
    assert.equal(NP(NO("0.5485894"),N("pound")).realize(), "0.55 pounds", "6. Accord avec le nombre");
    assert.equal( NO(1).nat().realize(), "one", "1 -> one");
    assert.equal( NO(47).nat().realize(), "forty-seven", "47 -> forty-seven");
    assert.equal( NO(13579086).nat().realize(), "thirteen million five hundred and seventy-nine thousand eighty-six", "big number (langue naturelle)");

});
