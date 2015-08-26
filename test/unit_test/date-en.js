//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//

$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
    $.getJSON(URL.feature, function(feature) {
    
    QUnit.test( "Date EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});
        
        // natural date
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00")), "on Thursday, January 1, 2015 at 11:25:45 AM", "Full info");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {day:false, date:true}), "on January 1, 2015 at 11:25:45 AM", "Without week day");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {day:false, month:false, year:false}), "on 1 at 11:25:45 AM", "Without day, month and year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false}), "on Thursday, January 1 at 11:25:45 AM", "Without year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false}), "at 11:25:45 AM", "Only time");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T14:25:45-05:00"), {year:false, month:false, date:false, day:false, minute:false, second:false}), "at 02 PM", "Only hour");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, second:false}), "at 11:25 AM", "Only hour and minute");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {month:false, date:false, day:false, hour:false, minute:false, second:false}), "on 2015", "Only year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {date:false, day:false, hour:false, minute:false, second:false}), "on January 2015", "Only month and year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, hour:false, minute:false, second:false}), "on Thursday", "Only weekday");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-04T11:00:00-05:00")), "on Sunday, January 4, 2015 at 11:00 AM", "Full info without 0 minutes and 0 seconds");
        
        // non-natural date
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00")), "01/11/2015 11:25:45 AM", "Full info");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {day:false, date:true}), "01/11/2015 11:25:45 AM", "Without weekday");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {year:false}), "01/11 11:25:45 AM", "Without year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {year:false, month:false, date:false, day:false}), "11:25:45 AM", "Only time");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {year:false, month:false, date:false, day:false, minute:false, second:false}), "11 AM", "Only hour");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {year:false, month:false, date:false, day:false, second:false}), "11:25 AM", "Only hour and minute");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {month:false, date:false, day:false, hour:false, minute:false, second:false}), "2015", "Only year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {date:false, day:false, hour:false, minute:false, second:false}), "01/2015", "Only month and year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-11T11:25:45-05:00"), {year:false, month:false, date:false, hour:false, minute:false, second:false}), "11", "Only date");
    
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
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(tenDaysAgo), "10 days ago", "10 days before");
        assert.equal(JSrealB.Module.Date.toRelativeTime(twoDaysAgo), 
                "last " + JSrealB.Module.Date.toWord(twoDaysAgo, optionDayOnly), "3 days before");
        assert.equal(JSrealB.Module.Date.toRelativeTime(threeDaysAgo), 
                "last " + JSrealB.Module.Date.toWord(threeDaysAgo, optionDayOnly), "3 days before");
        assert.equal(JSrealB.Module.Date.toRelativeTime(yesterday), "yesterday", "1 day before");
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(today), "today", "this day");
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(tomorrow), "tomorrow", "1 day after");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inTwoDays), 
                "next " + JSrealB.Module.Date.toWord(inTwoDays, optionDayOnly), "3 days after");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inThreeDays), 
                "next " + JSrealB.Module.Date.toWord(inThreeDays, optionDayOnly), "3 days after");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inTenDays), "in 10 days", "10 days after");
    });
  });
 });
});