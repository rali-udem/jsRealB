// design of a new organisation for warnings
// it uses jsRealB for the realization of messages
// not sure this is simpler, but at least it shows how jsRealB can be used for realizing its own messages

// add words to the basic lexicon for use in the warnings
//  the lexical information is taken from dmf and dme
loadFr();
addToLexicon("aucun",{ D: { tab: [ 'd4' ] }})
addToLexicon("comme",{ Adv: { tab: [ 'av' ] }, C: { tab: [ 'cj' ] } })
addToLexicon("contraction",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("français",{ A: { tab: [ 'n27' ] }, N: { g: 'm', tab: [ 'n35' ] } })
addToLexicon("implémenter",{ V: { aux: [ 'av' ], tab: 'v36' } })
addToLexicon("lexique",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("option",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("morphologie",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("ordinal",{ A: { tab: [ 'n47' ] }, N: { g: 'm', tab: [ 'n5' ] } })
addToLexicon("paramètre",{ N: { g: 'm', tab: [ 'n3' ] } })


loadEn();
addToLexicon("as",{ Adv: { tab: [ 'b1' ]}})
addToLexicon("French",{ A: { tab: [ 'a1' ] }, N: { tab: [ 'n5' ] } })
addToLexicon("implement",{ N: { tab: [ 'n1' ] }, V: { tab: 'v1' } })
addToLexicon("lexicon",{ N: { tab: [ 'n1' ] } })
addToLexicon("morphology",{ N: { tab: [ 'n5' ] } })
addToLexicon("ordinal",{ A: { tab: [ 'a1' ] }, N: { tab: [ 'n1' ] } })

Constituent.prototype.warn = function(_){
    let args=Array.from(arguments);
    let mess;
    const lang=getLanguage();
    // load the current language, 
    // HACK:  wrap object with parentheses so that the parser does not think this is the start of a block
    ({en:loadEn,fr:loadFr})[lang](); 
    const messFns = this.warnings[args.shift()];
    if (messFns===undefined){
        this.error("warn called with an unknown error message:"+arguments[0])
    }
    mess=this.me()+":: "+ messFns[lang].apply(null,args).cap(false)
    if (exceptionOnWarning) throw mess;
    console.warn(mess);
    return this;
}


// table of jsRealB structures for warning messages
Constituent.prototype.warnings = {
    "bad parameter":
        {en:(good,bad)=>
            S(NP(D("the"),N("parameter")),
              VP(V("be").t("ps"),Q(good),Adv("not"),Q(bad))).typ({mod:"nece"}),
         fr:(good,bad)=>
            S(NP(D("le"),N("paramètre")),
              VP(V("être").t("c"),Q(good),Adv("pas"),Q(bad))).typ({mod:"nece"})},
    "bad application":
        {en:(info,good,bad)=>
            S(Q(info),VP(V("be").t("ps"),V("apply").t("pp"),
                         PP(P("to"),Q(good)),Adv("not"),PP(P("to"),Q(bad)))).typ({mod:"nece"}),
         fr:(info,good,bad)=>
            S(Q(info),VP(V("être").t("c"),V("appliquer").t("pp"),
                         PP(P("à"),Q(good)),Adv("non"),PP(P("à"),Q(bad)))).typ({mod:"nece"})},
    "bad position":
        {en:(bad,limit)=>
            S(NO(bad),VP(V("be").t("ps"),A("small").f("co"),P("than"),NO(limit))).typ({mod:"nece"}),
         fr:(bad,limit)=>
            S(NO(bad),VP(V("être").t("c"),A("petit").f("co"),Pro("que"),NO(limit))).typ({mod:"nece"})},
    "bad const for option":
        {en:(option,constType,allowedConsts)=>
            S(NP(N("option"),Q(option)),
              CP(C("but"),
                 VP(V("be"),V("apply").t("pp"),PP(P("to"),Q(constType))),
                 VP(V("be").t("ps"),Pro("one"),PP(P("of"),Q(allowedConsts))).typ({mod:"nece"})
              )),
         fr:(option,constType,allowedConsts)=>
            S(NP(D("le"),N("option"),Q(option)),
              CP(C("mais"),
                 VP(V("être"),V("appliquer").t("pp").g("f"),PP(P("à"),Q(constType))),
                 VP(V("être").t("c"),D("un").g("f"),PP(P("parmi"),Q(allowedConsts))).typ({mod:"nece"})
              ))},
    "ignored value for option":
        {en:(option,bad)=>
            S(NP(Q(bad).a(":"),A("bad"),N("value"),PP(P("for"),N("option"),Q(option))),
              VP(V("be"),V("ignore").t("pp"))),
         fr:(option,bad)=>
            S(NP(Q(bad).a(":"),NP(D("le"),A("mauvais"),N("valeur")),PP(P("pour"),D("le"),N("option"),Q(option))),
              VP(V("être"),V("ignorer").t("pp")))},
    "no value for option":
        {en:(option,validVals)=>
            S(NP(Adv("no"),N("value"),PP(P("for"),N("option"),Q(option))),
              VP(V("be").t("ps"),Pro("one"),PP(P("of"),Q(validVals)))).typ({mod:"nece"}),
         fr:(option,validVals)=>
            S(NP(D("aucun"),N("valeur"),PP(P("pour"),D("le"),N("option"),Q(option))).a(","),
              VP(V("être").t("c"),D("un").g("f"),PP(P("parmi"),Q(validVals)))).typ({mod:"nece"})},
    "not found":
        {en:(missing,context)=>
            S(NP(Adv("no"),Q(missing)),VP(V("find").t("pp"),PP(P("in"),Q(context)))),
         fr:(missing,context)=>
            S(NP(D("aucun"),Q(missing)),VP(V("trouver").t("pp"),PP(P("dans"),Q(context))))},
    "bad ordinal":
        {en:(value)=>S(VP(V("realize"),Q(value),AdvP(Adv("as"),N("ordinal")))).typ({neg:true,mod:"poss"}),
         fr:(value)=>S(VP(V("réaliser"),Q(value),AdvP(Adv("comme"),NP(D("un"),N("ordinal"))))).typ({neg:true,mod:"poss"})},
    "bad number in word":
        {en:(value)=>S(VP(V("realize"),Q(value),PP(P("in"),N("word").n("p")))).typ({neg:true,mod:"poss"}),
         fr:(value)=>S(VP(V("réaliser"),Q(value),PP(P("en"),NP(N("mot").n("p"))))).typ({neg:true,mod:"poss"})},
    "no French contraction":
        {en:()=>S(NP(N("contraction")),VP(V("be"),V("ignore").t("pp"),PP(P("in"),N("French")))),
         fr:()=>S(NP(D("le"),N("contraction")),VP(V("être"),V("ignorer").t("pp"),PP(P("en"),N("français"))))},
    "morphology error":
        {en:(info)=>S(NP(N("morphology"),N("error")).a(":"),Q(info)),
         fr:(info)=>S(NP(N("erreur"),PP(P("de"),N("morphologie"))).a(":"),Q(info))},
    "not implemented":
        {en:(info)=>S(Q(info),VP(V("implement"))).typ({neg:true,pas:true}),
         fr:(info)=>S(Q(info),VP(V("implémenter"))).typ({neg:true,pas:true})},
    "not in lexicon":
        {en:()=>S(Adv("not"),V("find").t("pp"),PP(P("in"),N("lexicon"))),
         fr:()=>S(AP(A("absent"),PP(P("de"),NP(D("le"),N("lexique")))))},
    "bad Constituent":
        {en:(rank,type)=>S(NP(D("the"),Q(rank),N("parameter")),
                           VP(V("be"),Q("Constituent"))).typ({neg:true}),
         fr:(rank,type)=>S(NP(D("le"),Q(rank),N("paramètre")),
                           VP(V("être"),Q("Constituent"))).typ({neg:true})},
    "too many parameters":
        {en:(termType,number)=>
             S(Q(termType),CP(C("but"),
                              VP(V("accept"),D("one"),N("parameter")),
                              VP(V("have"),NO(number)))),
         fr:(termType,number)=>
             S(Q(termType),CP(C("mais"),
                              VP(V("accepter"),D("un"),N("paramètre")),
                              VP(P("en"),V("avoir"),NO(number))))}
}

Constituent.prototype.makeDisj = function(elems){
    return CP.apply(null,[C(this.isFr()?"ou":"or")].concat(elems.map(e=>Q(e))))+""
}

// function testWarnings(n){
//     for (w in warnings){
//         console.log(w)
//         N(n).warn(w,"A","B","C")
//     }
// }
