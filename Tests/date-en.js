//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//
QUnit.test( "English dates", function( assert ) {
    loadEn();
    // natural date
    var theDate="2015-01-01T11:25:45-05:00";
    var exp=DT(theDate)
    assert.equal(exp.realize(),"on Thursday, January 1, 2015 at 11:25:45 a.m.", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).realize(), "on January 1, 2015 at 11:25:45 a.m.", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).realize(), "on the 1 at 11:25:45 a.m.", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).realize(), "on Thursday, January 1 at 11:25:45 a.m.", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).realize(), "at 11:25:45 a.m.", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).realize(), "at 11 a.m.", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).realize(), "at 11:25 a.m.", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).realize(), "in 2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).realize(), "on January 2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, hour:false, minute:false, second:false}).realize(), "on Thursday", "Only weekday");
    assert.equal(DT("2015-01-04T11:00:00-05:00").dOpt({minute:false,second:false}).realize(),"on Sunday, January 4, 2015 at 11 a.m.", "Full info without 0 minutes and 0 seconds");
    // date in digit
    assert.equal(DT(theDate).nat(false).realize(),"Thursday 1/1/2015 11:25:45 a.m.", "Full info");
    assert.equal(DT(theDate).dOpt({day:false, date:true}).nat(false).realize(), "1/1/2015 11:25:45 a.m.", "Without week day");
    assert.equal(DT(theDate).dOpt({day:false, month:false, year:false}).nat(false).realize(), "1 11:25:45 a.m.", "Without day, month and year");
    assert.equal(DT(theDate).dOpt({year:false}).nat(false).realize(), "Thursday 1/1 11:25:45 a.m.", "Without year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false}).nat(false).realize(), "11:25:45 a.m.", "Only time");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, minute:false, second:false}).nat(false).realize(), "11 a.m.", "Only hour");
    assert.equal(DT(theDate).dOpt({year:false, month:false, date:false, day:false, second:false}).nat(false).realize(), "11:25 a.m.", "Only hour and minute");
    assert.equal(DT(theDate).dOpt({month:false, date:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "2015", "Only year");
    assert.equal(DT(theDate).dOpt({date:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "1/2015", "Only month and year");
    assert.equal(DT(theDate).dOpt({year:false, month:false, day:false, hour:false, minute:false, second:false}).nat(false).realize(), "1", "Only date");
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

    assert.equal(DT(tenDaysAgo).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(), "10 days ago", "10 days before");
    assert.equal(DT(twoDaysAgo).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(),
            "last " + DT(twoDaysAgo).dOpt(optionDayOnly).realize(), "3 days before");
    assert.equal(DT(threeDaysAgo).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(),
            "last " + DT(threeDaysAgo).dOpt(optionDayOnly).realize(), "3 days before");
    assert.equal(DT(yesterday).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(), "yesterday", "1 day before");

    assert.equal(DT(today).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(), "today", "this day");

    assert.equal(DT(tomorrow).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(), "tomorrow", "1 day after");
    assert.equal(DT(inTwoDays).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(),
            DT(inTwoDays).dOpt(optionDayOnly).realize(), "3 days after");
    assert.equal(DT(inThreeDays).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(),
            DT(inThreeDays).dOpt(optionDayOnly).realize(), "3 days after");
    assert.equal(DT(inTenDays).dOpt({rtime: true,hour:false,minute:false,second:false}).realize(), "in 10 days", "10 days after");
    
})
