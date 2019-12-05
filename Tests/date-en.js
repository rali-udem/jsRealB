//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//
QUnit.test( "English dates", function( assert ) {
    loadEn();
    // natural date
    var theDate="2015-01-01T11:25:45-05:00";
    var exp=DT(theDate)
    assert.equal(exp.toString(),"on Thursday, January 1, 2015 at 11:25:45 a.m.", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).toString(), "on January 1, 2015 at 11:25:45 a.m.", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).toString(), "on the 1 at 11:25:45 a.m.", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).toString(), "on Thursday, January 1 at 11:25:45 a.m.", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).toString(), "at 11:25:45 a.m.", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).toString(), "at 11 a.m.", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).toString(), "at 11:25 a.m.", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).toString(), "in 2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).toString(), "on January 2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, hour:false, minute:false, second:false}).toString(), "on Thursday", "Only weekday");
    assert.equal(DT("2015-01-04T11:00:00-05:00").dOpt({minute:false,second:false}).toString(),"on Sunday, January 4, 2015 at 11 a.m.", "Full info without 0 minutes and 0 seconds");
    // date in digit
    assert.equal(DT(theDate).nat(false).toString(),"Thursday 1/1/2015 11:25:45 a.m.", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).nat(false).toString(), "1/1/2015 11:25:45 a.m.", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).nat(false).toString(), "1 11:25:45 a.m.", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).nat(false).toString(), "Thursday 1/1 11:25:45 a.m.", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).nat(false).toString(), "11:25:45 a.m.", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).nat(false).toString(), "11 a.m.", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).nat(false).toString(), "11:25 a.m.", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "1/2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, day:false, hour:false, minute:false, second:false}).nat(false).toString(), "1", "Only date");
    // relative time
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

    assert.equal(DT(tenDaysAgo).dOpt({rtime: true}).toString(), "10 days ago", "10 days before");
    assert.equal(DT(twoDaysAgo).dOpt({rtime: true}).toString(),
            "last " + DT(twoDaysAgo).dOpt(optionDayOnly), "3 days before");
    assert.equal(DT(threeDaysAgo).dOpt({rtime: true}).toString(),
            "last " + DT(threeDaysAgo).dOpt(optionDayOnly), "3 days before");
    assert.equal(DT(yesterday).dOpt({rtime: true}).toString(), "yesterday", "1 day before");

    assert.equal(DT(today).dOpt({rtime: true}).toString(), "today", "this day");

    assert.equal(DT(tomorrow).dOpt({rtime: true}).toString(), "tomorrow", "1 day after");
    assert.equal(DT(inTwoDays).dOpt({rtime: true}).toString(),
            DT(inTwoDays).dOpt(optionDayOnly), "3 days after");
    assert.equal(DT(inThreeDays).dOpt({rtime: true}).toString(),
            DT(inThreeDays).dOpt(optionDayOnly), "3 days after");
    assert.equal(DT(inTenDays).dOpt({rtime: true}).toString(), "in 10 days", "10 days after");
    
})
