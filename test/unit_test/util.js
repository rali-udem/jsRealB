QUnit.test( "Util functions", function( assert ) {
    // verb stem
    assert.equal( stem("placer", "cer"), "pla", "Récupération du radical du verbe 'placer'");
    assert.raises( function() { stem("manger", "ir"); }, "Erreur attendue : mauvaise terminaison");
    assert.equal( stem("maximum", ""), "maximum", "Erreur attendue : terminaison vide");
    assert.raises( function() { stem("manger", "amanger"); }, "Erreur attendue : terminaison plus grande que le mot (par l'avant)");
    assert.raises( function() { stem("manger", "mangera"); }, "Erreur attendue : terminaison plus grande que le mot (par l'arrière)");

    // intVal
//    assert.equal( intVal("23"), 23, "Extract int value from string");
//    assert.equal( intVal("2"), 2, "Extract int value from string");
//    assert.equal( intVal("T 4 546 vf"), 4546, "Extract int value from string");
//    assert.equal( intVal("1kfjbg7!kvi"), 1, "Extract first int value from string");
//    assert.equal( intVal("azertuvfdj"), null, "No integer => output = null");
//    assert.equal( intVal(""), null, "Empty string => output = null");
    
    // floatVal // Never Used
//var floatVal = function(str) {
//    var numberTable = str.split(' ').join('').split(',').join('.').match(/-?\d+(\.\d+)?/);
//    var output = (numberTable !== null) ? getFloat(numberTable[0]) : null;
//    return output;
//};
//    assert.equal( "23.3".floatVal(), 23.3, "Extract float value from string");
//    assert.equal( "23,4".floatVal(), 23.4, "Extract float value from string");
//    assert.equal( "23, 4".floatVal(), 23.4, "Extract float value from string");
//    assert.equal( "23 ,4".floatVal(), 23.4, "Extract float value from string");
//    assert.equal( "23".floatVal(), 23.0, "Extract float value from string");
//    assert.equal( "azertuvfdj".floatVal(), null, "No float => output = null");
//    assert.equal( "".floatVal(), null, "Empty string => output = null");
    
    // isString
    assert.equal( isString("3"), true, "1. is string");
    assert.equal( isString("fd3"), true, "2. is string");
    assert.equal( isString("3fd"), true, "3. is string");
    assert.equal( isString("hjldfudruoe"), true, "4. is string");
    assert.equal( isString("hjldfudruoe"), true, "5. is string");
    assert.equal( isString(3), false, "1. is not string");
    assert.equal( isString(false), false, "2. is not string");
    assert.equal( isString({}), false, "3. is not string");
    assert.equal( isString([]), false, "4. is not string");
    
    // isNumeric
    assert.equal( isNumeric("3"), true, "'3' is numeric?");
    assert.equal( isNumeric(30), true, "30 is numeric?");
    assert.equal( isNumeric(3.25), true, "3.25  is numeric?");
    assert.equal( isNumeric(-258), true, "-258  is numeric?");
    assert.equal( isNumeric("-258"), true, "'-258' is numeric?");
    assert.equal( isNumeric("afgfh"), false, "string is numeric?");
    assert.equal( isNumeric("a3"), false, "'a3' is numeric?");
    assert.equal( isNumeric({}), false, "object is numeric?");
    assert.equal( isNumeric(null), false, "null is numeric?");
    assert.equal( isNumeric(true), false, "true is numeric?");
    
    // isIntlDate // unused
//    assert.equal( isIntlDate("2015-02-01"), true, "2015-02-01 is international date?");
//    assert.equal( isIntlDate("2000-12-31"), true, "2000-12-31 is international date?");
//    assert.equal( isIntlDate("3000-02-03"), true, "3000-02-03 is international date?");
//    assert.equal( isIntlDate("0000-01-01"), true, "0000-01-01 is international date?");
//    assert.equal( isIntlDate("2010-00-01"), false, "2010-00-01 is not international date?");
//    assert.equal( isIntlDate("2010-13-01"), false, "2010-13-01 is not international date?");
//    assert.equal( isIntlDate("2010/10/10"), false, "2010/10/10 is not international date?");
//    assert.equal( isIntlDate("10/10/2010"), false, "10/10/2010 is not international date?");
//    assert.equal( isIntlDate("10-10-2014"), false, "10-10-2014 is not international date?");
//    assert.equal( isIntlDate("2015-13-01"), false, "2015-13-01 is not international date?");
//    assert.equal( isIntlDate("20-2015-20"), false, "20-2015-20 is not international date?");
//    assert.equal( isIntlDate("2016-01-00"), false, "2016-01-00 is not international date?");
//    assert.equal( isIntlDate("2015-01-32"), false, "2015-01-32 is not international date?");
//    assert.equal( isIntlDate("2015-02-31"), false, "2015-04-31 is not international date?");
//    assert.equal( isIntlDate("2015-04-31"), false, "2015-04-31 is not international date?");
    
    // ltrim
    assert.equal( ltrim(" sd oef vds d fsd "), "sd oef vds d fsd ", "ltrim : 1 space in left side");
    assert.equal( ltrim("        sd oef vds d fsd "), "sd oef vds d fsd ", "ltrim : some spaces in left side");
    assert.equal( ltrim("sd oef vds d fsd "), "sd oef vds d fsd ", "ltrim : no space in left side");
    
    // rtrim
    assert.equal( rtrim("  sd oef vds d fsd "), "  sd oef vds d fsd", "rtrim : 1 space in left side");
    assert.equal( rtrim("  sd oef vds d fsd       "), "  sd oef vds d fsd", "rtrim : some spaces in left side");
    assert.equal( rtrim("  sd oef vds d fsd"), "  sd oef vds d fsd", "rtrim : no space in left side");
    
    // hasOwnValue
    assert.equal( hasOwnValue({test: "test", t: "toto", va: "to"}, "test"), true, "Find 1st value");
    assert.equal( hasOwnValue({test: "test", t: "toto", va: "to"}, "toto"), true, "Find a value");
    assert.equal( hasOwnValue({test: "test", t: "toto", va: "to"}, "to"), true, "Find last value");
    assert.equal( hasOwnValue({test: "test", t: "toto", va: "to"}, "fhj"), false, "Value does not exist");
     
     
    // separateTextNumber
    assert.deepEqual( "p1".separateTenseAndPerson(), {tense: "p", person: "1"}, "Separate 'p' and '1' from 'p1'");
    assert.deepEqual( "p4".separateTenseAndPerson(), {tense: "p", person: "4"}, "Separate 'p' and '4' from 'p4'");
    assert.deepEqual( "p".separateTenseAndPerson(), {tense: "p", person: null}, "Get 'p' from 'p'");
    assert.deepEqual( "".separateTenseAndPerson(), {tense:  null, person: null}, "Get empty array from empty string");
    assert.deepEqual( "ip3".separateTenseAndPerson(), {tense: "ip", person: "3"}, "Separate 'ip' and '3' from 'ip3'");
    
    // separateGenderAndNumber
    assert.deepEqual( "fs".separateGenderAndNumber(), {g: "f", n: "s"}, "Separate 'f' and 's' from 'fs'");
    assert.deepEqual( "fp".separateGenderAndNumber(), {g: "f", n: "p"}, "Separate 'f' and 'p' from 'fp'");
    assert.deepEqual( "ms".separateGenderAndNumber(), {g: "m", n: "s"}, "Separate 'm' and 's' from 'ms'");
    assert.deepEqual( "mp".separateGenderAndNumber(), {g: "m", n: "p"}, "Separate 'm' and 'p' from 'mp'");
    assert.deepEqual( "p".separateGenderAndNumber(), {g: null, n: "p"}, "Separate null and 'p' from 'p'");
    assert.deepEqual( "s".separateGenderAndNumber(), {g: null, n: "s"}, "Separate null and 's' from 's'");
    assert.deepEqual( "".separateGenderAndNumber(), {g: null, n: null}, "Try to separate empty string");
    assert.deepEqual( "kytre".separateGenderAndNumber(), {g: null, n: null}, "Try to separate a long string");
    assert.deepEqual( "mo".separateGenderAndNumber(), {g: 'm', n: null}, "Unknonw number expected");
    assert.deepEqual( "nj".separateGenderAndNumber(), {g: 'n', n: null}, "Unknonw number And neutral gender expected");

    // convertToDeclensionShortForm
    assert.equal( convertToDeclensionShortForm("m", "s"), "ms", "m, s => ms");
    assert.equal( convertToDeclensionShortForm("masculine", "plural"), "mp", "masculine, plural => mp");
    assert.equal( convertToDeclensionShortForm("feminine", "singular"), "fs", "feminine, singular => fs");
    assert.equal( convertToDeclensionShortForm("feminine", "plural"), "fp", "feminine, plural => fp");
    assert.equal( convertToDeclensionShortForm("toto", ""), null, "Error expected : empty grammatical number string");
    assert.equal( convertToDeclensionShortForm("", "plural"), "p", "Success : empty grammatical gender string");
    assert.equal( convertToDeclensionShortForm("", "singular"), "s", "Success : empty grammatical gender string 2");
    
    // findOption
    assert.equal( getValueByFeature([ {val: "0", t: "ab", m: "fe"}, {val: "1", o: "", t: "abc", h: "oo"} ], {t: "abc", h: "oo"}), "1", "Find option : normal case");
    assert.equal( getValueByFeature([ {val: "0", t: "ab", m: "fe"}, {val: "1", o: "", t: "abc", h: "oo"} ], {}), "0", "Empty feature requested => get first option");
    assert.equal( getValueByFeature([], {t: "ab"}), null, "Empty feature list");
    assert.equal( getValueByFeature([{val: "0", t: "ab", m: "fe"}, {val: "1", o: "", t: "abc", h: "oo"}], {m: "eeee"}), null, "Option does not exist");
    assert.equal( getValueByFeature([{val: "0", t: "ab", m: "fe"}, {val: "1", o: "", t: "abc", h: "oo"}], {t: "eeee"}), null, "Wrong value");
    assert.equal( getValueByFeature([{val: "0", t: "ab", m: "fe"}, {val: "1", o: "d", t: "abc", h: "oo"}], {o: "d", t: "eeee"}), null, "Correct feature 1, incorrect feature 2");
    assert.equal( getValueByFeature([{val: "0", m: "test", t: "ab"}], {m: null, t: "ab"}), null, "1 null parameter, null expected");
    assert.equal( getValueByFeature([{val: "0", t: "ab"}, {val: "1", m: "kol", t: "ab"}], {m: "kol", t: "ab"}), "1", "1 option with all correct features and another with just 1 correct feature");
    assert.equal( getValueByFeature([{val: "0", t: "ab"}, {val: "1", s: "pls", m: "kol", t: "ab"}], {s: "pm", m: "kol", t: "ab"}), "0", "Choose the best option between 2");
    assert.equal( getValueByFeature([{val: "0", m: "etfd", t: "ab"}, {val: "1", t: "ab"}], {m: "kol", t: "ab"}), "1", "Choose the best option between 2");
    assert.equal( getValueByFeature([{val: "0", m: "test", t: "ab"}], {p: 243}), "0", "Only 1 feature and any that does not match");

    // isBoolean
    assert.equal( isBoolean(true), true, "true is boolean?");
    assert.equal( isBoolean(false), true, "false is boolean?");
    assert.equal( isBoolean(1), false, "1 is boolean?");
    assert.equal( isBoolean(0), false, "0 is boolean?");
    assert.equal( isBoolean("test"), false, "string is boolean?");
    assert.equal( isBoolean({}), false, "object is boolean?");
    
    // inArray
    assert.equal( inArray([0, 1, 2, 3], 0), true, "array has first number");
    assert.equal( inArray(["t", "1", "2", "3"], "t"), true, "array has first string");
    assert.equal( inArray([0, 1, 2, 3], 3), true, "array has last numbee");
    assert.equal( inArray(["0", "1", "2", "m"], "m"), true, "array has last string");
    assert.equal( inArray([0, 1, 2, 3], 4), false, "error expected");
    assert.equal( inArray([], 4), false, "error expected");
    
    // isObject
    assert.equal( isObject({}), true, "is an object");
    assert.equal( isObject([]), false, "is not an object");
    assert.equal( isObject({"test": 1}), true, "is an object");
    assert.equal( isObject(true), false, "is not an object");
    assert.equal( isObject(1), false, "is not an object");
        
    // contains
    assert.equal( contains([1,2,3,4], 2), true, "array contains value");
    assert.equal( contains({"test": 2, "test2": 4}, 2), true, "object contains value");
    assert.equal( contains(2, 2), true, "number is value");
    assert.equal( contains("2", "2"), true, "string is value");
    assert.equal( contains({"alt": "jo", "lo": {"jdi": "john"}}, "john"), true, "1. complex object contains value");
    assert.equal( contains({"alt": "jo", "lo": {"jdi": {"jdi": "john"}}}, "john"), true, "2. complex object contains value");
    assert.equal( contains({"alt": "jo", "lo": {"jdi": [3,4,5]}}, 4), true, "3. complex object contains value");
    assert.equal( contains({"alt": "jo", "lo": {"jdi": [3,4,5]}}, 8), false, "1. object does not contain value");
    assert.equal( contains({"alt": "jo", "lo": {"jdi": 0}}, 8), false, "2. object does not contain value");
    assert.equal( contains([1, 2, 4], 8), false, "3. object does not contain value");
    
    // getNumberFormat
    assert.equal( JSrealB.Module.Number.getNumberFormat(1234.56), "1235", "1234.56 => 1235");
    assert.equal( JSrealB.Module.Number.getNumberFormat(1234.56, 2, ",", " "), "1 234,56", "1234.56 => 1 234,56");
    assert.equal( JSrealB.Module.Number.getNumberFormat(1234.5678, 2, ".", ""), "1234.57", "1234.5678 => 1234.57");
    assert.equal( JSrealB.Module.Number.getNumberFormat(67, 2, ',', '.'), "67,00", "67 => 67,00");
    assert.equal( JSrealB.Module.Number.getNumberFormat(1000, 0, ',', ' '), "1 000", "1000 => 1 000");
    assert.equal( JSrealB.Module.Number.getNumberFormat(67.311, 2), "67.31", "67.311 => 67.31");
    assert.equal( JSrealB.Module.Number.getNumberFormat(1000.55, 1), "1000.6", "1000.55 => 1000.6");
    assert.equal( JSrealB.Module.Number.getNumberFormat(67000, 5, ',', '.'), "67.000,00000", "67000 => 67.000,00000");
    assert.equal( JSrealB.Module.Number.getNumberFormat(0.9, 0), "1", "0.9 => 1");
    assert.equal( JSrealB.Module.Number.getNumberFormat('1.20', 2), "1.20", "'1.20' => 1.20");
    assert.equal( JSrealB.Module.Number.getNumberFormat('1.20', 4), "1.2000", "'1.20' => 1.2000");
    assert.equal( JSrealB.Module.Number.getNumberFormat('1.2000', 3), "1.200", "'1.2000' => '1.200'");
    assert.equal( JSrealB.Module.Number.getNumberFormat('1 000,50', 2, '.', ' '), "100 050.00", "'1 000,50' => '100 050.00'");
    assert.equal( JSrealB.Module.Number.getNumberFormat(1e-8, 8, '.', ''), "0.00000001", "1e-8 => '0.00000001'");
    
    //    assert.equal( "", "", "");
});