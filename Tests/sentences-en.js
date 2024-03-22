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
        // VP : Verbal Phrase
        // 22
        {"expression":S(NP(D("a"), N("child")), VP(V("find"), NP(D("a"), N("cat"))).t("ps")),
        "expected":"A child found a cat. ",
        "message":"2. VP"},
        // 23
        {"expression":S(NP(Pro("I").pe(3).g("m")), VP(V("hate"), NP(N("soup")))),
         "expected":"He hates soup. ",
         "message":"3. VP"},
        // 24
        {"expression":S(NP(Pro("I").pe(3).g("f")), VP(V("eat"), NP(N("soup"))).t("ps")),
         "expected":"She ate soup. ",
         "message":"4. VP"},
        // 25
        {"expression":S(NP(Pro("I").pe(2)), VP(V("enjoy"), NP(D("a"), N("meat")))),
         "expected":"You enjoy a meat. ",
         "message":"5. VP"},
        // 26
        {"expression":S(NP(D("a"), N("girl")), VP(V("have"))),
         "expected":"A girl has. ",
         "message":"6. VP"},

         // AP : Adjective Phrase
        // 27
        {"expression":AP(Adv("extremely"), A("pleasant")),
         "expected":"extremely pleasant",
         "message":"1. AP"},
        // 28
        {"expression":AP(Adv("much"), A("quick").f("co")),
         "expected":"much quicker",
         "message":"2. AP"},
        // 29
        {"expression":AP(Adv("very"), A("hard")),
         "expected":"very hard",
         "message":"3. AP"},

         // AdvP : Adverbial Phrase
        // 30
        {"expression":AdvP(Adv("very"), Adv("quietly")),
         "expected":"very quietly",
         "message":"1. AdvP"},
        // 31
        {"expression":AdvP(Adv("extremely"), Adv("softly")),
         "expected":"extremely softly",
         "message":"2. AdvP"},
        // 32
        {"expression":AdvP(Adv("totally"), Adv("abruptly")),
         "expected":"totally abruptly",
         "message":"3. AdvP"},

         // PP : Prepositional Phrase
        // 33
        {"expression":PP(P("on"), NP(D("a"), N("table"))),
         "expected":"on a table",
         "message":"1. PP"},
        // 34
        {"expression":PP(P("by"), NP(D("a"), N("window"))),
         "expected":"by a window",
         "message":"2. PP"},
         // 35
        {"expression":PP(P("in"),NP(D("the"),N("dark"),PP(P("of"),N("night"))) ),
         "expected":"in the dark of night",
         "message":"3. PP"},
        // 36
        {"expression":PP(P("for"), NP(D("a"), N("while"))),
         "expected":"for a while",
         "message":"4. PP"},
         // 37
        {"expression":PP(P("against"), AdvP(Adv("all")), N("odds")),
         "expected":"against all odds",
         "message":"5. PP"},
        // 38
        {"expression":PP(P("of"), NP(A("great"), N("talent"))),
         "expected":"of great talent",
         "message":"6. PP"},
        // 39
        {"expression":PP(P("with"), NP(D("that"), N("key"))),
         "expected":"with that key",
         "message":"7. PP"},
        // 40
        {"expression":PP(P("of"), NP(N("piano"))),
         "expected":"of piano",
         "message":"8. PP"},

        // CP : Coordinated Phrase
        // 41
        {"expression":CP(C("or"), Pro('me').pe(1), Pro('I').pe(2), Pro('I').pe(3).g("f")),
         "expected":"me, you or she",
         "message":"1. CP"},
        // 42
        {"expression":CP(C("and"), NP(N("cat")), NP(N("dog")), NP(N("snake"))).n("p"),
         "expected":"cats, dogs and snakes",
         "message":"2. CP"},
        // 43        
        {"expression":CP(NP(N("cat")), NP(N("dog")), NP(N("snake"))),
         "expected":"cat, dog, snake",
         "message":"3. CP"},

         // SP : Propositional Phrase
        // 44
        {"expression":S( NP(D("the"), N("mouse"), SP( Adv("that"), NP( D("the"), N("cat")), VP( V("eat").t("ps"))))),
         "expected":"The mouse that the cat ate. ",
         "message":"1. SP"},
        // 45
        {"expression":NP(D("a"), N("girl"), SP( Pro("who"), VP( V("play"), NP(N("soccer"))))),
         "expected":"a girl who plays soccer",
         "message":"2. SP(who)"},
        // 46
        {"expression":NP(D("the"), N("girl").n("p"), SP( Pro("who"), VP( V("play"), NP(N("soccer"))))),
         "expected":"the girls who play soccer",
         "message":"2. SP(who)"},
         // 47
        {"expression":S(NP(D("the"),N("chicken")),VP(V("bite").t("p"))),
         "expected":"The chicken bites. ",
         "message":"No pronoun"},
         // 48
        {"expression":S(NP(D("the"),N("chicken")).pro(),VP(V("bite").t("p"))),
         "expected":"It bites. ",
         "message":"Subject as pronoun"},
         // 49
        {"expression":S(NP(D("the"),N("chicken")),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")))),
         "expected":"The chicken bites kids. ",
         "message":"No pronoun + cd"},
         // 50
        {"expression":S(NP(D("the"),N("chicken")),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")).pro())),
         "expected":"The chicken bites them. ",
         "message":"Cd as pronoun"},
         // 51
        {"expression":S(NP(D("the"),N("chicken")).pro(),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")).pro())),
         "expected":"It bites them. ",
         "message":"Cd and subject as pronoun"},
         // 52
        {"expression":S(NP(D("the"),N("chicken")),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")),PP(P("at"),NP(D("my").pe(1),N("house"))))),
         "expected":"The chicken bites kids at my house. ",
         "message":"No pronoun + cd + ci"},
         // 53
        {"expression":S(NP(D("the"),N("chicken")),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")),PP(P("at"),NP(D("my").pe(1),N("house")).pro()))),
         "expected":"The chicken bites kids at it. ",
         "message":"Ci as pronoun"},
         // 54
        {"expression":S(NP(D("the"),N("chicken")).pro(),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")).pro(),PP(P("at"),NP(D("my").pe(1),N("house")).pro()))),
         "expected":"It bites them at it. ",
         "message":"Subject, cd and ci as pronoun"},
         // 55
        {"expression":S(NP(D("the"),N("chicken")).pro(),VP(V("bite").t("p"),NP(D("a"),N("kid").n("p")).pro(),PP(P("at"),NP(D("my").pe(1),N("house").g("n")).pro()))),
         "expected":"It bites them at it. ",
         "message":"Subject, cd and ci as pronoun"},
         // 56
        {"expression":S(Pro("I").pe(1),VP(V("give"),PP(P("to"),NP(D("a"),N("woman"))))),
         "expected":"I give to a woman. ",
         "message":"woman -> feminine noun"},
         // 57
        {"expression":S(Pro("I").pe(1),VP(V("give"),PP(P("to"),NP(D("a"),N("woman")).pro()))),
         "expected":"I give to her. ",
         "message":"woman -> feminine pronoun"},

         //Passive action
         // 58
        {"expression":S(NP(D("the"),N("soldier").n("p")),VP(V("find").t("ps"),NP(D("a"),N("girl")))),
         "expected":"The soldiers found a girl. ",
         "message":"Simple sentence"},
         // 59
        {"expression":S(NP(D("the"),N("soldier").n("p")),VP(V("find").t("ps"),NP(D("a"),N("girl")))).typ({pas:true}),
         "expected":"A girl was found by the soldiers. ",
         "message":"Passive sentence, with subject and cd"},
         // 60
        {"expression":S(NP(D("the"),N("soldier").n("p")),VP(V("find").t("ps"))).typ({pas:true}),
         "expected":"It was found by the soldiers. ",
         "message":"Passive sentence, no cd"},
         // 61
        {"expression":S(VP(V("find").t("ps"),NP(D("a"),N("girl")))).typ({pas:true}),
         "expected":"A girl was found. ",
         "message":"Passive sentence, no subject"},

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
