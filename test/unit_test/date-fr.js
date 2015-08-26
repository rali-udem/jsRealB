//
// /!\ Ces tests ne fonctionnent que sur le fuseau horaire GMT-05 !
//

$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
    $.getJSON(URL.feature, function(feature) {
    
    QUnit.test( "Date FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});
        
        // natural date
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00")), "le jeudi 1 janvier 2015 à 11h 25min 45s", "Full info");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {day:false, date:true}), "le 1 janvier 2015 à 11h 25min 45s", "Without week day");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {day:false, month:false, year:false}), "le 1 à 11h 25min 45s", "Without day, month and year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false}), "le jeudi 1 janvier à 11h 25min 45s", "Without year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false}), "à 11h 25min 45s", "Only time");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, minute:false, second:false}), "à 11h", "Only hour");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, second:false}), "à 11h25", "Only hour and minute");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {month:false, date:false, day:false, hour:false, minute:false, second:false}), "en 2015", "Only year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {date:false, day:false, hour:false, minute:false, second:false}), "en janvier 2015", "Only month and year");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, hour:false, minute:false, second:false}), "le jeudi", "Only weekday");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-04T11:00:00-05:00")), "le dimanche 4 janvier 2015 à 11h00", "Full info without  0 seconds");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-04T11:00:00-05:00"), {det:false}), "dimanche 4 janvier 2015 11h00", "Full info without determiner");
        assert.equal(JSrealB.Module.Date.toWord(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, second:false, det:false}), "11h25", "Only hour and minute");
        
        // non-natural date
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00")), "01/01/2015 11:25:45", "Full info");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {day:false, date:true}), "01/01/2015 11:25:45", "Without weekday");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {year:false}), "01/01 11:25:45", "Without year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false}), "11:25:45", "Only time");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, minute:false, second:false}), "11", "Only hour");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, day:false, second:false}), "11:25", "Only hour and minute");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {month:false, date:false, day:false, hour:false, minute:false, second:false}), "2015", "Only year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {date:false, day:false, hour:false, minute:false, second:false}), "01/2015", "Only month and year");
        assert.equal(JSrealB.Module.Date.formatter(new Date("2015-01-01T11:25:45-05:00"), {year:false, month:false, date:false, hour:false, minute:false, second:false}), "01", "Only date");
    
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
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(tenDaysAgo), "il y a 10 jours", "10 jours avant");
        assert.equal(JSrealB.Module.Date.toRelativeTime(threeDaysAgo), 
                JSrealB.Module.Date.toWord(threeDaysAgo, optionDayOnly) + " dernier", "3 jours avant");
        assert.equal(JSrealB.Module.Date.toRelativeTime(twoDaysAgo), "avant-hier", "2 jours avant");
        assert.equal(JSrealB.Module.Date.toRelativeTime(yesterday), "hier", "1 jour avant");
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(today), "aujourd'hui", "ce jour");
        
        assert.equal(JSrealB.Module.Date.toRelativeTime(tomorrow), "demain", "1 jour après");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inTwoDays), "après-demain", "2 jours après");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inThreeDays), 
                JSrealB.Module.Date.toWord(inThreeDays, optionDayOnly) + " prochain", "3 jours après");
        assert.equal(JSrealB.Module.Date.toRelativeTime(inTenDays), "dans 10 jours", "10 jours après");
    
    });
  });
 });
});