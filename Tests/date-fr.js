//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//
QUnit.test( "Dates en français", function( assert ) {
    loadFr();
    // natural date
    var theDate="2015-01-01T11:25:45-05:00";
    var exp=DT(theDate)
    assert.equal(exp.toString(),"le jeudi 1 janvier 2015 à 11 h 25 min 45 s", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).toString(), "le 1 janvier 2015 à 11 h 25 min 45 s", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).toString(), "le 1 à 11 h 25 min 45 s", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).toString(), "le jeudi 1 janvier à 11 h 25 min 45 s", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).toString(), "à 11 h 25 min 45 s", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).toString(), "à 11 h", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).toString(), "à 11 h 25", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).toString(), "en 2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).toString(), "en janvier 2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, hour:false, minute:false, second:false}).toString(), "le jeudi", "Only weekday");
    assert.equal(DT("2015-01-04T11:00:00-05:00").dOpt({second:false, minute:false}).toString(), 
                "le dimanche 4 janvier 2015 à 11 h", "Full info without 0 minutes and 0 seconds");
    // date in digit
    assert.equal(DT(theDate).nat(false).toString(),"jeudi 1/1/2015 11:25:45", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).nat(false).toString(), "1/1/2015 11:25:45", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).nat(false).toString(), "1 11:25:45", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).nat(false).toString(), "jeudi 1/1 11:25:45", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).nat(false).toString(), "11:25:45", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).nat(false).toString(), "11", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).nat(false).toString(), "11:25", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "1/2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "1", "Only date");
    // // relative time
    var oneDayInMs = 86400000;
    var today = new Date();

    var tenDaysAgo = new Date(today.getTime() + (-10 * oneDayInMs));
    var threeDaysAgo = new Date(today.getTime() + (-3 * oneDayInMs));
    var twoDaysAgo = new Date(today.getTime() + (-2 * oneDayInMs));
    var yesterday = new Date(today.getTime() + (-1 * oneDayInMs));

    var tomorrow = new Date(today.getTime() + (1 * oneDayInMs));
    var inTwoDays = new Date(today.getTime() + (2 * oneDayInMs));
    var inThreeDays = new Date(today.getTime() + (3 * oneDayInMs));
    var inTenDays = new Date(today.getTime() + (10 * oneDayInMs));

    var optionDayOnly = {year:false, month:false, date:false, hour:false, minute:false, second:false, det:false};

    assert.equal(DT(tenDaysAgo).dOpt({rtime: true}).toString(),"il y a 10 jours", "10 jours avant");
    assert.equal(DT(threeDaysAgo).dOpt({rtime: true}).toString(),
            DT(threeDaysAgo).dOpt(optionDayOnly)+" dernier", "3 jours avant");
    assert.equal(DT(twoDaysAgo).dOpt({rtime: true}).toString(),
            "avant-hier", "2 jours avant");
    assert.equal(DT(yesterday).dOpt({rtime: true}).toString(), "hier", "1 jour avant");

    assert.equal(DT(today).dOpt({rtime: true}).toString(), "aujourd'hui", "ce jour");

    assert.equal(DT(tomorrow).dOpt({rtime: true}).toString(), "demain", "1 jour après");
    assert.equal(DT(inTwoDays).dOpt({rtime: true}).toString(),
            "après-demain", "2 jours après");
    assert.equal(DT(inThreeDays).dOpt({rtime: true}).toString(),
            DT(inThreeDays).dOpt(optionDayOnly)+" prochain", "3 jours après");
    assert.equal(DT(inTenDays).dOpt({rtime: true}).toString(), "dans 10 jours", "10 jours après");
    
})
