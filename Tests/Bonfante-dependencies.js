QUnit.test( "Dependencies EN - Bonfante", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadEn();
    function fool_voters(nb0, nb1,n1, nb2,n2, nb3){
        return SP(NP(nb0,N("politician")),
                VP(V("fool"),
                    NP(nb1,N("voter").n(n1)),
                    PP(P("on"),
                        NP(nb2,N("issue").n(n2)),
                        NP(nb3,
                        PP(P("of"),
                            NP(D("the"),
                                N("time"))))))).typ({"mod":"poss"})
    }

    const sentences = [
        // 1
        {"expression":
        root(V("follow"),
                subj(Pro("me").pe(1).c("nom")),
                comp(N("link").n("p"),
                    mod(V("indicate"),
                        subj(Pro("that")),
                        mod(Adv("strongly")).pos("pre")))).typ({"perf": true, "prog": true}),
        "expected":"I have been following links that strongly indicate. ",
        "message":"p 47 2.2"},
        // 2
        {"expression":
        root(V("say").t("ps"),
                subj(Pro("them").c("nom")),
                comp(V("give"),
                    subj(Pro("them").c("nom")),
                    comp(Pro("me").pe(1).c("dat")),
                    comp(N("detail").n("p"),
                        det(D("that"))),
                    comp(P("over"),
                        comp(N("phone"),
                            det(D("the"))))).typ({"neg": true, "mod": "poss", "contr": true})),
        "expected":"They said they can't give me those details over the phone. ",
        "message":"p 56 2.16"},
        // 3
        {"expression":
        coord(C("and"),
                root(V("finance").n("p"),
                    subj(Pro("who"),
                        mod(N("people"),
                            det(D("the")),
                            det(D("same"))).pos("pre")),
                    comp(N("arm").n("p"))),
                root(V("dispatch").n("p"),
                    comp(N("murderer").n("p"),
                        mod(N("suicide")).pos("pre"))))            ,
        "expected":"The same people who finance arms and dispatch suicide murderers. ",
        "message":"p 58"},
        // 4
        {"expression":
        root(V("be"),
                subj(Pro("me").c("nom").pe(1)),
                mod(V("determine").t("pp"),
                    comp(V("prove").t("b-to"),
                        comp(P("to"),
                            comp(N("committee").cap(),
                                det(D("the")))),
                        comp(Pro("that"),
                            comp(V("be"),
                                subj(Pro("me").c("nom").pe(1)),
                                mod(A("successful"))).typ({"mod":"poss"}))))),
        "expected": "I am determined to prove to the Committee that I can be successful. ",
        "message": " Figure 2.24 p 61 "},
        // 5
        {"expression":
        root(V("make"),
                det(Adv("so")),
                subj(V("kidnap").t("pr"),
                    det(D("this"))),
                comp(Pro("him").c("acc"),
                    comp(V("look").t("b"),
                        mod(A("weak"))))).cap(false),
        "expected": "so this kidnapping makes him look weak",
        "message": " Figure 2.26 p 62"},
 
        // 6
        {"expression":
             S(CP(C("but"),
                  fool_voters(D("a"), D("most"), "p", D("most"), "p", D("most")).a(","),
                  fool_voters(D("no"), D("all"), "p", AP(D("every"), A("single")), "s", D("all")))),
         "expected": "A politician can fool most voters on most issues most of the time, "+
                     "but no politicians can fool all voters on every single issue all of the time. ",
         "message": " Figure 4.21 p 116 / REM: utilise une fonction pour factoriser le code"},

    ];

    for (var i = 0; i < sentences.length; i++) {
        var s=sentences[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});
