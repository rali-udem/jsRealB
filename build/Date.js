/**
    jsRealB 3.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */
"use strict";
///////// date formatting
// mainly rule based (should language independent)

function numberWithoutLeadingZero(n){return ""+n}
function numberWithLeadingZero(n){return (n<10?"0":"")+n}
function numberToMonth(n){return rules.date.text.month[""+n]}
function numberToDay(n){return rules.date.text.weekday[n]}
function numberToMeridiem(n){return rules.date.text.meridiem[n<12?0:1]}
function numberTo12hour(n){return n%12}
// HACK: add to the standard Date prototype
Date.prototype.getRealMonth=function (){return this.getMonth()+1}

//// Based on format of strftime [linux]
var dateFormats = {
    Y:  { param: Date.prototype.getFullYear, func: numberWithoutLeadingZero },
    F:  { param: Date.prototype.getRealMonth,func: numberToMonth },
    M0: { param: Date.prototype.getRealMonth,func: numberWithLeadingZero },
    M:  { param: Date.prototype.getRealMonth,func: numberWithoutLeadingZero },
    d0: { param: Date.prototype.getDate,     func: numberWithLeadingZero },
    d:  { param: Date.prototype.getDate,     func: numberWithoutLeadingZero },
    l:  { param: Date.prototype.getDay,      func: numberToDay },
    A:  { param: Date.prototype.getHours,    func: numberToMeridiem },
    h:  { param: Date.prototype.getHours,    func: numberTo12hour },
    H0: { param: Date.prototype.getHours,    func: numberWithLeadingZero },
    H:  { param: Date.prototype.getHours,    func: numberWithoutLeadingZero },
    m0: { param: Date.prototype.getMinutes,  func: numberWithLeadingZero },
    m:  { param: Date.prototype.getMinutes,  func: numberWithoutLeadingZero },
    s0: { param: Date.prototype.getSeconds,  func: numberWithLeadingZero },
    s:  { param: Date.prototype.getSeconds,  func: numberWithoutLeadingZero },
    x:  { param: function(x){return x},      func: function(n){return ""+n} }
};
