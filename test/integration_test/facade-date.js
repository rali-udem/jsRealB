//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//

function addLeadingZero(n)
{
    var str = n.toString();
    if(str.length < 2)
    {
        str = "0" + str;
    }        
        
    return str;
}

var today = new Date();

var shortDateNonNaturalFormat = {day: false, hour: false, minute: false, second: false, nat:false};
var fullDateNonNaturalFormat = {nat:false};
var fullHourNonNaturalFormat = {day: false, date: false, month: false, year: false, nat:false};
var shortDateNaturalFormat = {day: false, hour: false, minute: false, second: false, nat:true};
var fullDateNaturalFormat = {nat:true};
var fullHourNaturalFormat = {day: false, date: false, month: false, year: false, nat:true};
var shortHourNaturalFormat = {second: false, day: false, date: false, month: false, year: false, nat:true};
var relativeTimeFormat = {rtime:true};

JSrealLoader({
        language: "fr",
        lexiconUrl: URL.lexicon.fr,
        ruleUrl: URL.rule.fr,
        featureUrl: URL.feature
    }, function() {
    QUnit.test( "Date FR", function( assert ) {
        assert.raises(function() { DT("2014-07-01T102:23:33-05:00" ).dOpt(shortDateNonNaturalFormat).toString(); }, "2014-07-01T102:23:33-05:00 n'est pas une date dans un format valide", "0. Test input : Invalid date" );
        assert.equal( DT().dOpt(shortDateNonNaturalFormat), addLeadingZero(today.getDate()) + "/" + addLeadingZero(today.getMonth()+1) + "/" + today.getFullYear(), "1. Test input" );
        assert.equal( DT("2014-07-01T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "01/07/2014", "2. Test input" );
        assert.equal( DT(new Date("2014-07-01T12:23:33-05:00" )).dOpt(shortDateNonNaturalFormat), "01/07/2014", "3. Test input" );
        
        assert.equal( DT(today).dOpt(relativeTimeFormat), "aujourd'hui", "Test relative time" );

        assert.equal( DT("2015-06-29T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "29/06/2015", "1. Test non natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "10/10/2015", "2. Test non natural date" );
        assert.equal( DT("2015-04-01T08:26:45-05:00" ).dOpt(fullDateNonNaturalFormat), "01/04/2015 09:26:45", "3. Test non natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullDateNonNaturalFormat), "10/10/2015 13:23:33", "4. Test non natural date" );
        assert.equal( DT("2015-04-01T08:00:00-05:00" ).dOpt(fullDateNonNaturalFormat), "01/04/2015 09:00", "5. Test non natural date" );
        assert.equal( DT("2015-10-10T23:01:01-05:00" ).dOpt(fullHourNonNaturalFormat), "00:01:01", "6. Test non natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullHourNonNaturalFormat), "13:23:33", "7. Test non natural date" );
        
        assert.equal( DT("2015-06-29T12:23:33-05:00" ).dOpt(shortDateNaturalFormat), "le 29 juin 2015", "1. Test natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortDateNaturalFormat), "le 10 octobre 2015", "2. Test natural date" );
        assert.equal( DT("2015-04-01T08:26:45-05:00" ).dOpt(fullDateNaturalFormat), "le mercredi 1 avril 2015 à 09h 26min 45s", "3. Test natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullDateNaturalFormat), "le samedi 10 octobre 2015 à 13h 23min 33s", "4. Test natural date" );
        assert.equal( DT("2015-10-10T12:23:00-05:00" ).dOpt(fullDateNaturalFormat), "le samedi 10 octobre 2015 à 13h23", "5. Test natural date" );
        assert.equal( DT("2015-10-10T12:00:00-05:00" ).dOpt(fullDateNaturalFormat), "le samedi 10 octobre 2015 à 13h00", "6. Test natural date" );
        assert.equal( DT("2015-10-10T00:00:00-05:00" ).dOpt(fullDateNaturalFormat), "le samedi 10 octobre 2015 à 01h00", "7. Test natural date" );
        assert.equal( DT("2015-10-10T23:01:01-05:00" ).dOpt(fullHourNaturalFormat), "à 00h 01min 01s", "8. Test natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullHourNaturalFormat), "à 13h 23min 33s", "9. Test natural date" );
        assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortHourNaturalFormat), "à 13h23", "10. Test natural date" );
    });

    JSrealLoader({
            language: "en",
            lexiconUrl: URL.lexicon.en,
            ruleUrl: URL.rule.en,
            featureUrl: URL.feature
        }, function() {
        QUnit.test( "Date EN", function( assert ) {
            assert.raises(function() { DT("2014-07-01T102:23:33-05:00" ).dOpt(shortDateNonNaturalFormat).toString(); }, "2014-07-01T102:23:33-05:00 isn't a valid date, wrong format", "0. Test input : Invalid date" );
            assert.equal( DT().dOpt(shortDateNonNaturalFormat), addLeadingZero(today.getMonth()+1) + "/" + addLeadingZero(today.getDate()) + "/" + today.getFullYear(), "1. Test input" );
            assert.equal( DT("2014-07-01T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "07/01/2014", "2. Test input" );
            assert.equal( DT(new Date("2014-07-01T12:23:33-05:00" )).dOpt(shortDateNonNaturalFormat), "07/01/2014", "3. Test input" );

            assert.equal( DT(today).dOpt(relativeTimeFormat), "today", "Test relative time" );

            assert.equal( DT("2015-06-29T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "06/29/2015", "1. Test non natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortDateNonNaturalFormat), "10/10/2015", "2. Test non natural date" );
            assert.equal( DT("2015-04-01T08:26:45-05:00" ).dOpt(fullDateNonNaturalFormat), "04/01/2015 09:26:45 AM", "3. Test non natural date" );
            assert.equal( DT("2015-10-10T16:23:33-05:00" ).dOpt(fullDateNonNaturalFormat), "10/10/2015 05:23:33 PM", "4. Test non natural date" );
            assert.equal( DT("2015-10-10T23:01:01-05:00" ).dOpt(fullHourNonNaturalFormat), "00:01:01 AM", "5. Test non natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullHourNonNaturalFormat), "01:23:33 PM", "6. Test non natural date" );

            assert.equal( DT("2015-06-29T12:23:33-05:00" ).dOpt(shortDateNaturalFormat), "on June 29, 2015", "1. Test natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortDateNaturalFormat), "on October 10, 2015", "2. Test natural date" );
            assert.equal( DT("2015-04-01T08:26:45-05:00" ).dOpt(fullDateNaturalFormat), "on Wednesday, April 1, 2015 at 09:26:45 AM", "3. Test natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullDateNaturalFormat), "on Saturday, October 10, 2015 at 01:23:33 PM", "4. Test natural date" );
            assert.equal( DT("2015-10-10T23:01:01-05:00" ).dOpt(fullHourNaturalFormat), "at 00:01:01 AM", "5. Test natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(fullHourNaturalFormat), "at 01:23:33 PM", "6. Test natural date" );
            assert.equal( DT("2015-10-10T12:23:33-05:00" ).dOpt(shortHourNaturalFormat), "at 01:23 PM", "7. Test natural date" );
        });
    });
});