QUnit.test( "Interrogative EN", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadEn();
     var sentences = [
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))), // 1
     "expected":"The cat eats the mouse. ",
     "message":"Simple sentence, no option"},  
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":"yon"}),  // 2
     "expected":"Does the cat eat the mouse? ",
     "message":"Interrogative sentence"}, 
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":'wos'}),  // 3
     "expected":"Who eats the mouse? ",
     "message":"Interrogative sentence (subject-who)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":'wod'}),  // 4
     "expected":"Who does the cat eat? ",
     "message":"Interrogative sentence (direct object-who)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":'wad'}),  // 5
     "expected":"What does the cat eat? ",
     "message":"Interrogative sentence (direct object-what)"},               
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")),PP(P("to"),NP(D("my"),N("family"))))).typ({"int":'woi'}), // 6
     "expected":"To whom does the cat eat the mouse? ",
     "message":"Interrogative sentence (indirect object-who)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":'whe'}), // 7
     "expected":"Where does the cat eat the mouse? ",
     "message":"Interrogative sentence (where)"},               
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat"),NP(D("the"),N("mouse")))).typ({"int":'how'}), // 8
     "expected":"How does the cat eat the mouse? ",
     "message":"Interrogative sentence (how)"},
     //Different tense
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon"}),//9
     "expected":"Did the cat eat the mouse? ",
     "message":"Interrogative sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon"}),//10
     "expected":"Will the cat eat the mouse? ",
     "message":"Interrogative sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wad'}),//11
     "expected":"What will the cat eat? ",
     "message":"Interrogative sentence(wad,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wos'}),//12
     "expected":"Who will eat the mouse? ",
     "message":"Interrogative sentence (subject-who)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wod'}),//13
     "expected":"Who will the cat eat? ",
     "message":"Interrogative sentence (direct object-who)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'whe'}),//14
     "expected":"Where will the cat eat the mouse? ",
     "message":"Interrogative sentence(whe,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'how'}),//15
     "expected":"How will the cat eat the mouse? ",
     "message":"Interrogative sentence (how)"}, 
    //With other options
    //Perfect
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":"yon"}),//16
     "expected":"Had the cat eaten the mouse? ",
     "message":"Interrogative/Perfect sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":"yon"}),//17
     "expected":"Will the cat have eaten the mouse? ",
     "message":"Interrogative/Perfect sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wad'}),//18
     "expected":"What had the cat eaten? ",
     "message":"Interrogative/Perfect sentence(wad,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wad'}),//19
     "expected":"What will the cat have eaten? ",
     "message":"Interrogative/Perfect sentence(wad,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wos'}),//20
     "expected":"Who had eaten the mouse? ",
     "message":"Interrogative/Perfect sentence (wos,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wos'}),//21
     "expected":"Who will have eaten the mouse? ",
     "message":"Interrogative/Perfect sentence (wos, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wod'}),//22
     "expected":"Who had the cat eaten? ",
     "message":"Interrogative/Perfect sentence (wod, past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wod'}),//23
     "expected":"Who will the cat have eaten? ",
     "message":"Interrogative/Perfect sentence (wod, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'whe'}),//24
     "expected":"Where had the cat eaten the mouse? ",
     "message":"Interrogative/Perfect sentence(whe,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'whe'}),//25
     "expected":"Where will the cat have eaten the mouse? ",
     "message":"Interrogative/Perfect sentence(whe,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'how'}),//26
     "expected":"How had the cat eaten the mouse? ",
     "message":"Interrogative/Perfect sentence (how, past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'how'}),//27
     "expected":"How will the cat have eaten the mouse? ",
     "message":"Interrogative/Perfect sentence (how, future)"},
    //Negation
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true}),//28
     "expected":"Did the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true}),// 29
     "expected":"Will the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'wad',"neg":true}), // 30
     "expected":"What did the cat not eat? ",
     "message":"Interrogative/Negative sentence(wad,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wad',"neg":true}), // 31
     "expected":"What will the cat not eat? ",
     "message":"Interrogative/Negative sentence(wad,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'wos',"neg":true}), // 32
     "expected":"Who did not eat the mouse? ",
     "message":"Interrogative/Negative sentence (wos,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wos',"neg":true}), // 33
     "expected":"Who will not eat the mouse? ",
     "message":"Interrogative/Negative sentence (wos, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'wod',"neg":true}), // 34
     "expected":"Who did the cat not eat? ",
     "message":"Interrogative/Negative sentence (wod, past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wod',"neg":true}), //35
     "expected":"Who will the cat not eat? ",
     "message":"Interrogative/Negative sentence (wod, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'whe',"neg":true}), //36
     "expected":"Where did the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence(whe,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'whe',"neg":true}), // 37
     "expected":"Where will the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence(whe,future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'how',"neg":true}),// 38
     "expected":"How did the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence (how, past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'how',"neg":true}), // 39
     "expected":"How will the cat not eat the mouse? ",
     "message":"Interrogative/Negative sentence (how, future)"},
    //Negation + perfect
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":"yon","neg":true}), //40
     "expected":"Had the cat not eaten the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":"yon","neg":true}), // 41
     "expected":"Will the cat not have eaten the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wad',"neg":true}), // 42
     "expected":"What had the cat not eaten? ",
     "message":"Interrogative/Negative/Perfect sentence(wad,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'wad',"neg":true}), // 43
     "expected":"What will the cat not have eaten? ",
     "message":"Interrogative/Negative/Perfect sentence (wad, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'whe',"neg":true}), // 44
     "expected":"Where had the cat not eaten the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"perf":true,"int":'whe',"neg":true}), // 45
     "expected":"Where will the cat not have eaten the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,future)"},
        //Progressive
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon","prog":true}), // 46
     "expected":"Was the cat eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon","prog":true}), // 47
     "expected":"Will the cat be eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'wad',"prog":true}), // 48
     "expected":"What was the cat eating? ",
     "message":"Interrogative/Negative/Perfect sentence(wad,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wad',"prog":true}), // 49
     "expected":"What will the cat be eating? ",
     "message":"Interrogative/Negative/Perfect sentence (wad, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'whe',"prog":true}), // 50
     "expected":"Where was the cat eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'whe',"prog":true}), // 51
     "expected":"Where will the cat be eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,future)"},
    //Progressive + negation
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true,"prog":true}), // 52
     "expected":"Was the cat not eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true,"prog":true}), // 53
     "expected":"Will the cat not be eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'wad',"neg":true,"prog":true}), // 54
     "expected":"What was the cat not eating? ",
     "message":"Interrogative/Negative/Perfect sentence(wad,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'wad',"neg":true,"prog":true}), // 55
     "expected":"What will the cat not be eating? ",
     "message":"Interrogative/Negative/Perfect sentence (wad, future)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":'whe',"neg":true,"prog":true}), // 56
     "expected":"Where was the cat not eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":'whe',"neg":true,"prog":true}), // 57
     "expected":"Where will the cat not be eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(whe,future)"},
    //Progressive,perfect and negation
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true,"prog":true,"perf":true}), // 58
     "expected":"Had the cat not been eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(past)"},
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon","neg":true,"prog":true,"perf":true}), // 59
     "expected":"Will the cat not have been eating the mouse? ",
     "message":"Interrogative/Negative/Perfect sentence(future)"},
    //Passive
    {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("ps"),NP(D("the"),N("mouse")))).typ({"int":"yon","pas":true}), // 60
     "expected":"Was the mouse eaten by the cat? ",
     "message":"Interrogative/Negative/Perfect sentence(past)"},
     {"expression":S(NP(D("the"),N("cat")),VP(V("eat").t("f"),NP(D("the"),N("mouse")))).typ({"int":"yon","pas":true}), // 61
     "expected":"Will the mouse be eaten by the cat? ",
     "message":"Interrogative/Negative/Perfect sentence(future)"},
     // tag questions
     {"expression":S(NP(D("the"),N("cat")),VP(V("like"),NP(D("the"),N("girl")))).typ({"int":"tag","pas":false}), // 62
     "expected":"The cat likes the girl, doesn't it? ",
     "message":"tag question, affirmative"},
     {"expression":S(NP(D("the"),N("cat")),VP(V("like"),NP(D("the"),N("girl")))).typ({"int":"tag","pas":true}), // 63
     "expected":"The girl is liked by the cat, isn't she? ",
     "message":"tag question,passive "},
     {"expression":S(NP(D("the"),N("cat")),VP(V("like").t("f"),NP(D("the"),N("girl")))).typ({"int":"tag","pas":false}), // 64
     "expected":"The cat will like the girl, won't it? ",
     "message":"tag question, affirmative future"},
     {"expression":S(NP(D("the"),N("cat")),VP(V("like").t("f"),NP(D("the"),N("girl")))).typ({"int":"tag","pas":true}), // 65
     "expected":"The girl will be liked by the cat, won't she? ",
     "message":"tag question, passive, future"},
    ];
    for (var i = 0; i < sentences.length; i++) {
        var s=sentences[i];
        var exp=s.expression;
        assert.equal(exp.realize(),s.expected,s.message)
    }
});
