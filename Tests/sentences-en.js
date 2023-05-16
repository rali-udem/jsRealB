QUnit.test( "Sentence EN", function( assert ) {
   Object.assign(globalThis,jsRealB);
   loadEn();
    var sentences = [
        // 1
        {"expression":S( NP(D("the"), N("cat")), VP(V("sit").t("ps"), PP(P("on"), NP(D("the"), N("couch"))))),
         "expected":"The cat sat on the couch. ",
         "message":"Full sentence"},
        // 2
        {"expression":S(N("gift").n("p")).cap(),
         "expected":"Gifts. ",
         "message":"Word with a capital"},
        // 3
        {"expression":S(NP(D("a"), N("man")), VP(V("hit").t("p"), NP(D("a"), N("ball")))).typ({"pas":true}),
         "expected":"A ball is hit by a man. ",
         "message":"Passive sentence"},
        // 4
        {"expression":S(NP(D("a"), N("cat")), VP(V("play").t("f"), NP(N("piano")))).typ({"neg":true}),
         "expected":"A cat will not play piano. ",
         "message":"Negative sentence"},
        // 5
        {"expression":S(NP(A("nice"), N("dog").n("p")), VP(V("like").t("pr"), NP(D("a"),N("cat").n("p")))),
         "expected":"Nice dogs liking cats. ",
         "message":"Present participle"},
        // 6
        {"expression":S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).typ({"perf":true}),
         "expected":"A boy has drunk water. ",
         "message":"Present perfect"},
        // 7
        {"expression":S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).typ({"int":"yon"}),
         "expected":"Does a boy drink water? ",
         "message":"Yes or no question"},
        // 8
        {"expression":S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).typ({"int":"wos","mod":"perm"}),
         "expected":"Who may drink water? ",
         "message":"Who question with permission"},
        // 9
        {"expression":S(NP(D("a"), N("boy")), VP(V("drink").t("ps"), NP(N("water")))).typ({"mod":"perm"}),
         "expected":"A boy might drink water. ",
         "message":"Modality permission"},
        // 10
        {"expression":S(CP(C("and"), NP(D("the"), N("seller")), NP(D("the"), N("customer"))), VP(V("speak"))),
         "expected":"The seller and the customer speak. ",
         "message":"Coordination"},
        // 11
        {"expression":S(NP(D("a"),N("mouse").n("p")), VP(V("run"), NP(D("a"),N("mile")))),
         "expected":"Mice run a mile. ",
         "message":"Plural subject, but singular complement"},
        // 12
        {"expression":S(NP(D("the"),N("cat").n("p")),VP(V("eat"),NP(D("a"),A("grey"),N("mouse")))).typ({"pas":true}),
         "expected":"A grey mouse is eaten by the cats. ",
         "message":"Subject changes number in passive mode"},
        // 13
        {"expression":S(NP(D("the"),N("cat").n("p")),VP(V("eat").t("f"),NP(D("a"),A("grey"),N("mouse")))),
         "expected":"The cats will eat a grey mouse. ",
         "message":"Global change of number"},
        // 14
        {"expression":S(NP(D("the"),N("cat")),
                      VP(V("eat").t("f"),NP(D("a"),A("grey"),N("mouse"))))
                         .typ({"int":"why","pas":true,"neg":true}),
         "expected":"Why will a grey mouse not be eaten by the cat? ",
         "message":"Interrogative, passive and negative"},
        // 15
        {"expression":S(CP(C("and"),
                         NP(D("a"),N("apple").tag("a",{"href":"https:en.wikipedia.org/wiki/Apple"})),
                         NP(D("a"),N("university")),
                         NP(D("a"),A("humble"),N("guy")),
                         NP(D("a"),A('honourable'),N("mention")),
                         NP(D('a'),Q("XML"),N("exercise"))),
                      VP(V("be"),
                         NP(D("a"),
                            A("interesting").tag("i"),
                            N("case").n("p")))),
         "expected":"An <a href=\"https:en.wikipedia.org/wiki/Apple\">apple</a>, a university, a humble guy, an honourable mention and an XML exercise are <i>interesting</i> cases. ",
         "message":"English elision with a coordinated subject"
         },
        // 16
        {"expression":S(Pro("I").g("f"),
                      VP(V("play"),
                        NP(D("a"),
                           A("musical"),
                           N("note"),
                           VP(V("name").t("pp"),
                              Q("a").cap().tag("a",{"href":"https:en.wikipedia.org/wiki/A_(musical_note)"}),
                              PP(P("on"),
                                 NP(D("the"),N("piano"))))))),
         "expected":"She plays a musical note named <a href=\"https:en.wikipedia.org/wiki/A_(musical_note)\">A</a> on the piano. ",
         "message": "Elision with a strange a"
         },
        // 17
        {"expression":S(Pro("I").g("m"),
                      VP(V("love"),
                         NP(D("a"),N("woman")).pro())
                     ),
         "expected":"He loves her. ",
         "message":"Pronominalization of a noun designating a person"
         },
        // 18
        {"expression":S(Pro("me").g("m"),
                      VP(V("love"),
                         NP(D("a"),N("woman")).pro())
                     ).typ({"int":"wos","pas":true}),
         "expected":"Who is loved by him? ",
         "message":"Interrogative passive"
         },
        // 19
        {"expression":S(CP(C("and"),NP(D("the"),N("cat")))
                               .add(NP(D("the"),N("dog"))),
                      VP(V("play"),
                         PP(P("with"),NP(D("a"),N("elephant")))
                        )
                     ),
         "expected":"The cat and the dog play with an elephant. ",
         "message":"Coordination built incrementaly "
         },
        // 20
        {"expression":S(VP().add(V("eat")).add(NP(D("the"),N("apple")))).add(NP(D("a"),N("boy").n("p")),0),
         "expected":"Boys eat the apple. ",
         "message":"Adding constituents both before and after"
         },
        // // 21
        {"expression":S(NP(D("the"),N("girl")).pro(),
                      VP(V("see"),
                         NP(D("the"),N("man")).pro(),
                         PP(P("through"),NP(D("the"),N("window")).pro()))),
         "expected":"She sees him through it. ",
         "message":"Pronominalization of subject, object and indirect object"
         },
        // // 22
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 23
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 24
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 25
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 26
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 27
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 28
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
        // // 29
        // {"expression":,
        //  "expected":"",
        //  "message":
        //  },
    ];
    for (var i = 0; i < sentences.length; i++) {
        var s=sentences[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});
