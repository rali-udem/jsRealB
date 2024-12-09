QUnit.test( "JSON-tests", function( assert ) {
    Object.assign(globalThis,jsRealB);
    loadEn();
    // using Phrase
    const exp=S(NP(D("the"),N("cat").n("p")),
                VP(V("sit").t("ps"),
                   PP(P("on"),
                      NP(D("the"),N("mat"))))).typ({neg:true})
    const expSent=exp.clone().toString();
    assert.equal(expSent,"The cats did not sit on the mat. ","original sentence built using Phrase")
    const expJSON=exp.toJSON();
    assert.equal(ppJSON(expJSON),
`{"phrase":"S",
 "elements":[{"phrase":"NP",
              "elements":[{"terminal":"D",
                           "lemma":"the"},
                          {"terminal":"N",
                           "lemma":"cat",
                           "props":{"cnt":"yes",
                                    "n":"p"}}]},
             {"phrase":"VP",
              "elements":[{"terminal":"V",
                           "lemma":"sit",
                           "props":{"t":"ps"}},
                          {"phrase":"PP",
                           "elements":[{"terminal":"P",
                                        "lemma":"on",
                                        "props":{"ldv":true}},
                                       {"phrase":"NP",
                                        "elements":[{"terminal":"D",
                                                     "lemma":"the"},
                                                    {"terminal":"N",
                                                     "lemma":"mat",
                                                     "props":{"cnt":"yes"}}]}]}]}],
 "props":{"typ":{"neg":true}},
 "lang":"en"}`, "pretty-print of JSON from Phrase")
    assert.equal(fromJSON(expJSON).toString(),expSent,"regenerated sentence via JSON conversion")
    // using  Dependent
    const dep=root(V("sit").t("f"),
                   subj(N("cat").n("p"),
                        det(D("the"))),
                   comp(P("on"),
                        mod(N("mat"),
                            det(D("the"))))).typ({neg:true})
    const depSent=dep.clone().toString();
    assert.equal(depSent,"The cats will not sit on the mat. ","original sentence built using Dependent")
    const depJSON=dep.toJSON();
    assert.equal(ppJSON(depJSON),
`{"dependent":"root",
 "terminal":{"terminal":"V",
             "lemma":"sit",
             "props":{"t":"f"}},
 "dependents":[{"dependent":"subj",
                "terminal":{"terminal":"N",
                            "lemma":"cat",
                            "props":{"cnt":"yes",
                                     "n":"p"}},
                "dependents":[{"dependent":"det",
                               "terminal":{"terminal":"D",
                                           "lemma":"the"},
                               "dependents":[]}]},
               {"dependent":"comp",
                "terminal":{"terminal":"P",
                            "lemma":"on",
                            "props":{"ldv":true}},
                "dependents":[{"dependent":"mod",
                               "terminal":{"terminal":"N",
                                           "lemma":"mat",
                                           "props":{"cnt":"yes"}},
                               "dependents":[{"dependent":"det",
                                              "terminal":{"terminal":"D",
                                                          "lemma":"the"},
                                              "dependents":[]}]}]}],
 "props":{"typ":{"neg":true}},
 "lang":"en"}`,"pretty-print of JSON from Dependent")
    assert.equal(fromJSON(depJSON).toString(),depSent,"regenerated sentence via JSON conversion")
    
});
