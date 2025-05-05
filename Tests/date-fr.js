//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//
QUnit.test( "Dates en français", function( assert ) {
    loadFr();
    // natural date
    var theDate="2015-01-01T11:25:45-05:00";
    var exp=DT(theDate)
    assert.equal(exp.realize(),"le jeudi 1 janvier 2015 à 11 h 25 min 45 s", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).realize(), "le 1 janvier 2015 à 11 h 25 min 45 s", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).realize(), "le 1 à 11 h 25 min 45 s", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).realize(), "le jeudi 1 janvier à 11 h 25 min 45 s", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).realize(), "à 11 h 25 min 45 s", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).realize(), "à 11 h", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).realize(), "à 11 h 25", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).realize(), "en 2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).realize(), "en janvier 2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, hour:false, minute:false, second:false}).realize(), "le jeudi", "Only weekday");
    assert.equal(DT("2015-01-04T11:00:00-05:00").dOpt({second:false, minute:false}).realize(), 
                "le dimanche 4 janvier 2015 à 11 h", "Full info without 0 minutes and 0 seconds");
    // date in digit
    assert.equal(DT(theDate).nat(false).realize(),"jeudi 1/1/2015 11:25:45", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).nat(false).realize(), "1/1/2015 11:25:45", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).nat(false).realize(), "1 11:25:45", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).nat(false).realize(), "jeudi 1/1 11:25:45", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).nat(false).realize(), "11:25:45", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).nat(false).realize(), "11", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).nat(false).realize(), "11:25", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "1/2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "1", "Only date");
    // // relative time
    const oneDayInMs = 86400000;
    const today = new Date();
    
    const tenDaysAgo = new Date(today.getTime() + (-10 * oneDayInMs));
    const threeDaysAgo = new Date(today.getTime() + (-3 * oneDayInMs));
    const twoDaysAgo = new Date(today.getTime() + (-2 * oneDayInMs));
    const yesterday = new Date(today.getTime() + (-1 * oneDayInMs));
    
    const tomorrow = new Date(today.getTime() + (1 * oneDayInMs));
    const inTwoDays = new Date(today.getTime() + (2 * oneDayInMs));
    const inThreeDays = new Date(today.getTime() + (3 * oneDayInMs));
    const inTenDays = new Date(today.getTime() + (10 * oneDayInMs));
    
    const optionDayOnly = {year:false, month:false, date:false, hour:false, minute:false, second:false, det:false};
    const rtOpt={rtime:true,hour:false,minute:false,second:false}
    
    assert.equal(DT(tenDaysAgo).dOpt(rtOpt).realize(),"il y a 10 jours", "10 jours avant");
    assert.equal(DT(threeDaysAgo).dOpt(rtOpt).realize(),
            DT(threeDaysAgo).dOpt(optionDayOnly).realize()+" dernier", "3 jours avant");
    assert.equal(DT(twoDaysAgo).dOpt(rtOpt).realize(),
            "avant-hier", "2 jours avant");
    assert.equal(DT(yesterday).dOpt(rtOpt).realize(), "hier", "1 jour avant");

    assert.equal(DT(today).dOpt(rtOpt).realize(), "aujourd'hui", "ce jour");

    assert.equal(DT(tomorrow).dOpt(rtOpt).realize(), "demain", "1 jour après");
    assert.equal(DT(inTwoDays).dOpt(rtOpt).realize(),
            "après-demain", "2 jours après");
    assert.equal(DT(inThreeDays).dOpt(rtOpt).realize(),
            DT(inThreeDays).dOpt(optionDayOnly).realize()+" prochain", "3 jours après");
    assert.equal(DT(inTenDays).dOpt(rtOpt).realize(), "dans 10 jours", "10 jours après");
    
})
