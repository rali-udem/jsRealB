QUnit.test( "Sentence EN", function( assert ) {
    loadEn();
    var sentences = [
        {expression:S( NP(D("the"), N("cat")), VP(V("sit"), PP(P("on"), NP(D("the"), N("coach")))).t("ps") ),
         expected:"The cat sat on the coach.",
         message:"Full sentence"},
        {expression:S(N("gift").n("p")).cap(),
         expected:"Gifts.",
         message:"Word with a capital"},
        {expression:S(NP(D("a"), N("man")), VP(V("hit"), NP(D("a"), N("ball")))).t("p").typ({pas:true}),
         expected:"A ball is hit by a man.",
         message:"Passive sentence"},
        {expression:S(NP(D("a"), N("cat")), VP(V("play"), NP(N("piano")))).t("f").typ({neg:true}),
         expected:"A cat will not play piano.",
         message:"Negative sentence"},
        {expression:S(NP(A("nice"), N("dog")).n("p"), VP(V("like").n("p"), NP(N("cat")).n("p"))).t("pr"),
         expected:"Nice dogs liking cats.",
         message:"Present participle"},
        {expression:S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).perf(true),
         expected:"A boy has drunk water.",
         message:"Present perfect"},
        {expression:S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).typ({int:"yon"}),
         expected:"Does a boy drink water?",
         message:"Yes or no question"},
        {expression:S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water")))).typ({int:"wos",mod:"perm"}),
         expected:"Who may drink water?",
         message:"who question with permission"},
        {expression:S(NP(D("a"), N("boy")), VP(V("drink"), NP(N("water"))).pe(3)).t("ps").typ({mod:"perm"}),
         expected:"A boy might drink water.",
         message:"Modality permission"},
        {expression:S(CP(C("and"), NP(D("the"), N("seller")), NP(D("the"), N("customer"))), VP(V("speak"))),
         expected:"The seller and the customer speak.",
         message:"Coordination"},
        {expression:S(NP(D("a"),N("mouse")).n("p"), VP(V("run"), NP(D("a"),N("mile")))),
         expected:"Mice run a mile.",
         message:"Plural subject, but singular complement"}
    ];
    for (var i = 0; i < sentences.length; i++) {
        var s=sentences[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});
