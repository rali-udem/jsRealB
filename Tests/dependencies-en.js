QUnit.test( "Dependencies EN", function( assert ) {
     Object.assign(globalThis,jsRealB);
     loadEn();
     const sentences = [
        // 1
        {"expression":
          root(V("sit").t("ps"),
              subj(N("cat"),det(D("the"))),
              comp(P("on"),mod(N("couch"),det(D("the"))))),
         "expected":"The cat sat on the couch. ",
         "message":"Full sentence"},
        // 2
        {"expression":root(N("gift").n("p")).cap(),
         "expected":"Gifts. ",
         "message":"Word with a capital"},
        // 3
        {"expression":
         root(V("hit").t("p"),
              subj(N("man"),det(D("a"))),
              comp(N("ball"),det(D("a")))).typ({"pas":true}),
         "expected":"A ball is hit by a man. ",
         "message":"Passive sentence"},
        // 4
        {"expression":root(V("play").t("f"),
                           subj(N("cat"),det(D("a"))),
                           comp(N("piano"))).typ({"neg":true}),
         "expected":"A cat will not play piano. ",
         "message":"Negative sentence"},
        // 5
        {"expression":root(V("like").t("pr"),
                           subj(N("dog").n("p"),mod(A("nice"))), 
                           comp(N("cat"),
                                det(D("a"))).n("p")),
         "expected":"Nice dogs liking cats. ",
         "message":"Present participle"},
        // 6
        {"expression":root(V("drink"),
                           subj(N("boy"),det(D("a"))),
                           comp(N("water"))).typ({"perf":true}),
         "expected":"A boy has drunk water. ",
         "message":"Present perfect"},
        // 7
        {"expression":root(V('drink'),
                           comp(N('water')),
                           subj(N('boy'),
                                det(D('a')))).typ({"int":"yon"}),
         "expected":"Does a boy drink water? ",
         "message":"Yes or no question"},
        // 8
        {"expression":
            root(V('drink'),
                 comp(N('water')),
                 subj(N('boy'),
                      det(D('a')))).typ({"int":"wos","mod":"perm"}),
         "expected":"Who may drink water? ",
         "message":"Who question with permission"},
        // 9
        {"expression":
            root(V('drink').t("ps"),
                 comp(N('water')),
                 subj(N('boy'),
                      det(D('a')))).typ({"mod":"perm"}),
         "expected":"A boy might drink water. ",
         "message":"Modality permission"},
        // 10
        {"expression":
            root(V('speak'),
                 coord(C('and'),
                       subj(N('seller'),
                            det(D('the'))),
                       subj(N('customer'),
                            det(D('the'))))),
         "expected":"The seller and the customer speak. ",
         "message":"Coordination"},
        // 11
        {"expression":
            root(V('run'),
                 comp(N('mile'),
                      det(D('a'))),
                 subj(N('mouse').n("p"),
                      det(D('a')))),
         "expected":"Mice run a mile. ",
         "message":"Plural subject, but singular complement"},
        // 12
        {"expression":
            root(V('eat'),
                 comp(N('mouse'),
                      det(D('a')),
                      mod(A('grey'))),
                 subj(N('cat').n("p"),
                      det(D('the')))).typ({"pas":true}),
         "expected":"A grey mouse is eaten by the cats. ",
         "message":"Subject changes number in passive mode"},
        // 13
        {"expression":
            root(V('eat').t("f"),
                 comp(N('mouse'),
                      det(D('a')),
                      mod(A('grey'))),
                 subj(N('cat').n("p"),
                      det(D('the')))),
         "expected":"The cats will eat a grey mouse. ",
         "message":"Global change of number"},
        // 14
        {"expression":
            root(V('eat').t("f"),
                 comp(N('mouse'),
                      det(D('a')),
                      mod(A('grey'))),
                 subj(N('cat'),
                      det(D('the')))).typ({"int":"why","pas":true,"neg":true}),
         "expected":"Why will a grey mouse not be eaten by the cat? ",
         "message":"Interrogative, passive and negative"},
        // 15
        {"expression":
            root(V('be'),
                 comp(N('case').n("p"),
                      det(D('a')),
                      mod(A('interesting').tag("i"))),
                 coord(C('and'),
                       subj(N('apple').tag('a',{"href":"https:en.wikipedia.org/wiki/Apple"}),
                            det(D('a'))),
                       subj(N('university'),
                            det(D('a'))),
                       subj(N('guy'),
                            det(D('a')),
                            mod(A('humble'))),
                       subj(N('mention'),
                            det(D('a')),
                            mod(A('honourable'))),
                       subj(N('exercise'),
                            det(D('a'),
                                mod(Q('XML')))))),
         "expected":"An <a href=\"https:en.wikipedia.org/wiki/Apple\">apple</a>, a university, a humble guy, an honourable mention and an XML exercise are <i>interesting</i> cases. ",
         "message":"English elision with a coordinated subject"
         },
        // 16
        {"expression":
            root(V('play'),
                 comp(N('note'),
                      det(D('a')),
                      mod(A('musical')),
                      mod(V('name').t("pp"),
                          comp(Q('a').cap().tag('a',{"href":"https:en.wikipedia.org/wiki/A_(musical_note)"})),
                          comp(P('on'),
                               mod(N('piano'),
                                   det(D('the')))))),
                 subj(Pro('I').g("f"))),
         "expected":"She plays a musical note named <a href=\"https:en.wikipedia.org/wiki/A_(musical_note)\">A</a> on the piano. ",
         "message": "Elision with a strange a"
         },
        // 17
        {"expression":
            root(V('love'),
                 comp(N('woman'),
                      det(D('a'))).pro(),
                 subj(Pro('I').g("m"))),
         "expected":"He loves her. ",
         "message":"Pronominalization of a noun designating a person"
         },
        // 18
        {"expression":
            root(V('love'),
                 comp(N('woman'),
                      det(D('a'))).pro(),
                 subj(Pro('me').g("m"))).typ({"int":"wos","pas":true}),
         "expected":"Who is loved by him? ",
         "message":"Interrogative passive"
         },
        // 19
        {"expression":
            root(V('play'),
                 comp(P('with'),
                      mod(N('elephant'),
                          det(D('a')))),
                 coord(C('and'),
                       subj(N('cat'),
                            det(D('the')))).add(subj(N('dog'),
                                                     det(D('the'))))),
         "expected":"The cat and the dog play with an elephant. ",
         "message":"Coordination built incrementaly "
         },
        // 20
        {"expression":root(V("eat")).add(comp(N("apple"),det(D("a")))).add(subj(N("boy"),det(D("a"))).n("p")),
         "expected":"Boys eat an apple. ",
         "message":"Adding constituents both before and after"
         },
        // // 21
        {"expression":
            root(V('see'),
                 comp(N('man'),
                      det(D('the'))).pro(),
                 comp(P('through'),
                      mod(N('window'),
                          det(D('the'))).pro()),
                 subj(N('girl'),
                      det(D('the'))).pro()),
        "expected":"She sees him through it. ",
         "message":"Pronominalization of subject, object and indirect object"
         },
        // // // 22
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 23
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 24
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 25
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 26
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 27
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 28
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
        // // // 29
        // // {"expression":,
        // //  "expected":"",
        // //  "message":
        // //  },
    ];
    for (var i = 0; i < sentences.length; i++) {
        var s=sentences[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});
