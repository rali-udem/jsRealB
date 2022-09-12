// Realization of an existing text

/*  Original...  taken from https://sites.pitt.edu/~dash/perrault02.html
Little Red Riding Hood)

Charles Perrault

Once upon a time there lived in a certain village a little country girl, the prettiest creature who was ever seen. Her mother was excessively fond of her; and her grandmother doted on her still more. This good woman had a little red riding hood made for her. It suited the girl so extremely well that everybody called her Little Red Riding Hood.
One day her mother, having made some cakes, said to her, "Go, my dear, and see how your grandmother is doing, for I hear she has been very ill. Take her a cake, and this little pot of butter."

Little Red Riding Hood set out immediately to go to her grandmother, who lived in another village.

As she was going through the wood, she met with a wolf, who had a very great mind to eat her up, but he dared not, because of some woodcutters working nearby in the forest. He asked her where she was going. The poor child, who did not know that it was dangerous to stay and talk to a wolf, said to him, "I am going to see my grandmother and carry her a cake and a little pot of butter from my mother."

"Does she live far off?" said the wolf
"Oh I say," answered Little Red Riding Hood; "it is beyond that mill you see there, at the first house in the village."
"Well," said the wolf, "and I'll go and see her too. I'll go this way and go you that, and we shall see who will be there first."

The wolf ran as fast as he could, taking the shortest path, and the little girl took a roundabout way, entertaining herself by gathering nuts, running after butterflies, and gathering bouquets of little flowers. It was not long before the wolf arrived at the old woman's house. He knocked at the door: tap, tap.

"Who's there?"
"Your grandchild, Little Red Riding Hood," replied the wolf, counterfeiting her voice; "who has brought you a cake and a little pot of butter sent you by mother."

The good grandmother, who was in bed, because she was somewhat ill, cried out, "Pull the bobbin, and the latch will go up."

The wolf pulled the bobbin, and the door opened, and then he immediately fell upon the good woman and ate her up in a moment, for it been more than three days since he had eaten. He then shut the door and got into the grandmother's bed, expecting Little Red Riding Hood, who came some time afterwards and knocked at the door: tap, tap.
"Who's there?"

Little Red Riding Hood, hearing the big voice of the wolf, was at first afraid; but believing her grandmother had a cold and was hoarse, answered, "It is your grandchild Little Red Riding Hood, who has brought you a cake and a little pot of butter mother sends you."

The wolf cried out to her, softening his voice as much as he could, "Pull the bobbin, and the latch will go up."

Little Red Riding Hood pulled the bobbin, and the door opened.

The wolf, seeing her come in, said to her, hiding himself under the bedclothes, "Put the cake and the little pot of butter upon the stool, and come get into bed with me."

Little Red Riding Hood took off her clothes and got into bed. She was greatly amazed to see how her grandmother looked in her nightclothes, and said to her, "Grandmother, what big arms you have!"

"All the better to hug you with, my dear."
"Grandmother, what big legs you have!"
"All the better to run with, my child."
"Grandmother, what big ears you have!"
"All the better to hear with, my child."
"Grandmother, what big eyes you have!"
"All the better to see with, my child."
"Grandmother, what big teeth you have got!"
"All the better to eat you up with."

And, saying these words, this wicked wolf fell upon Little Red Riding Hood, and ate her all up.

Moral: Children, especially attractive, well bred young ladies, should never talk to strangers, for if they should do so, they may well provide dinner for a wolf. I say "wolf," but there are various kinds of wolves. There are also those who are charming, quiet, polite, unassuming, complacent, and sweet, who pursue young women at home and in the streets. And unfortunately, it is these gentle wolves who are the most dangerous ones of all.
*/


// little riding hood
function lrrh(det){
    let np=NP(A("little"),A("red"),V("ride").t("pr"),N("hood"))
    if (det)np.add(D(det),0)
    return np
}

function LRRH(det){
    let res=NP();
    for (let c of lrrh(det).elements){
        res.add(c.cap(true))
    }
    return res
}

function lpob(det){
    return NP(D(det),A("little"),N("pot"),PP(P("of"),N("butter")))
}

function whosThere(){ 
    return S(Pro("I").g("m"),
             VP(V("be"),Adv("there"))).typ({int:"wos"})
}

function howBig(n){
    return S(N("grandmother").cap().a(","),
             SP(D("what"),A("big"),n,
                SP(Pro("I").pe(2),VP(V("have"))))).a("!").en("\"")
}

function allTheBetter(v){
    return S(Adv("all"),
             D("the"),A("good").f("co"),
             v.t("b-to"),
             Pro("I").pe(2),
             P("with").a(","),
             D("my").pe(1),N("dear")).en("\"")
}


const story = [
     // Little Red Riding Hood
    {h1: [()=>LRRH()]},
    {p:[()=>Q("Charles Perrault")]},
    {p:[
        // Once upon a time there lived in a certain village a little country girl, the prettiest creature who was ever seen. 
        ()=>
        S(SP(Adv("once"),
             PP(P("upon"),NP(D("a"),N("time"))),
             Adv("there"),
             VP(V("live").t("ps"),
                PP(P("in"),
                   NP(D("a"),A("certain"),N("village")))),
             NP(D("a"),A("little"),N("country"),N("girl"))).a(","),
           NP(D("the"),
              A("pretty").f("su"),
              N("creature"),
              SP(Pro("who"),
                 VP(V("be").t("ps"),Adv("ever"),V("see").t("pp"))))),
        // Her mother was excessively fond of her; and her grandmother doted on her still more. 
        ()=>
            S(SP(NP(D("my").g("f"),N("mother")),
                 VP(V("be").t("ps"),
                    AdvP(Adv("excessively"),A("fond"),
                         PP(P("of"),Pro("me").g("f"))))).a(";"),
              SP(C("and"),
                 NP(D("my").g("f"),N("grandmother")),
                 VP(V("dote").t("ps"),
                    PP(P("on"),
                       Pro("me").g("f"),
                       Adv("still"),D("more"))))),

        // This good woman had a little red riding hood made for her. 
        ()=>
            S(NP(D("this"),A("good"),N("woman")),
                 VP(V("have"),
                    lrrh("a"),
                    V("make").t("pp"),
                    PP(P("for"),Pro("me").g("f")))),

        // It suited the girl so extremely well that everybody called her Little Red Riding Hood.
        ()=>
            S(Pro("I"),
              VP(V("suit").t("ps"),
                 NP(D("the"),N("girl")),
                 AdvP(Adv("so"),Adv("well"),
                      SP(C("that"),
                         Pro("everybody"),
                         VP(V("call").t("ps"),
                            Pro("me").g("f"),LRRH()))))),
         ]},
         {p:[
            // One day her mother, having made some cakes, said to her, "Go, my dear, and see how your grandmother is doing, for I hear she has been very ill. Take her a cake, and this little pot of butter."
             ()=>
                S(SP(NP(D("one"),N("day"),D("my").g("f"),N("mother")).a(","),
                     VP(V("make").t("pr"),
                        NP(D("some"),N("cake").n("p")))).typ({perf:true}).a(","),
                  SP(CP(C("and"),
                        VP(V("go").t("ip").a(","),
                             NP(D("my").pe(1),N("dear")).a(",")).cap(),
                        VP(V("see").t("ip"),
                           SP(Pro("how"),
                              NP(D("my").pe(2),N("grandmother")),
                              VP(V("do")),
                                 SP(C("for"),
                                    Pro("I").pe(1),
                                    VP(V("hear"),
                                       SP(Pro("I").g("f"),
                                          VP(V("be"),A("ill"))).typ({}))).a(".")
                              ).typ({prog:true}))
                          ),
                      VP(V("take").cap().t("ip"),
                         Pro("me").g("f"),
                         CP(C("and"),
                            NP(D("a"),N("cake")).a(","),
                            lpob("this")))
                     ).en("\"")
                 )
         ]},
         {p:[
          // Little Red Riding Hood set out immediately to go to her grandmother, who lived in another village.
          ()=>
             S(LRRH(),
               VP(V("set").t("ps"),Adv("out"),Adv("immediately"),
                  V("go").t("b-to"),
                  PP(P("to"),
                     NP(D("my").g("f"),N("grandmother"),
                        SP(Pro("who"),
                           VP(V("live").t("ps"),
                              PP(P("in"),
                                 NP(D("another"),N("village"))))))))
             )
         ]},
         {p:[
            // As she was going through the wood, she met with a wolf, who had a very great mind to eat her up, but he dared not, because of some woodcutters working nearby in the forest. 
            ()=> 
                 S(SP(C("as"),
                      Pro("I").g("f"),
                      VP(V("go").t("ps"),
                         PP(P("through"),
                            NP(D("the"),N("wood")))).typ({prog:true})).a(","),
                   SP(Pro("I").g("f"),
                      VP(V("meet").t("ps"),
                         PP(P("with"),
                            NP(D("a"),N("wolf").a(","),
                               SP(Pro("who"),
                                  CP(C("but"),
                                     S(V("have").t("ps"),
                                        NP(D("a"),Adv("very"),A("great"),N("mind"),
                                           VP(V("eat").t("b-to"),Pro("me").g("f"),P("up").a(",")))),
                                     S(Pro("I").pe("3"),
                                        VP(V("dare").t("ps"),Adv("not"),
                                           S(C("because"),
                                              PP(P("of"),
                                                 NP(D("some"),N("woodcutter").n("p"),
                                                    VP(V("work").t("pr"),A("nearby"),
                                                       PP(P("in"),
                                                          NP(D("the"),N("forest")))))))))
                                   )))
                           )))
                  ),

            // He asked her where she was going. 
             ()=>
                  S(Pro("I").g("m"),
                    VP(V("ask").t("ps"),
                       Pro("me").g("f"),
                       SP(Pro("where"),
                          Pro("I").g("f"),
                          VP(V("go").t("ps"))).typ({prog:true}))),

            // The poor child, who did not know that it was dangerous to stay and talk to a wolf, said to him, "I am going to see my grandmother and carry her a cake and a little pot of butter from my mother."
             ()=>
                  S(NP(D("the"),A("poor"),N("child").a(","),
                       SP(Pro("who"),
                          VP(V("know").t("ps"),
                             SP(Pro("that"),
                                Pro("I"),
                                VP(V("be").t("ps"),
                                   AP(A("dangerous"),
                                      CP(C("and"),
                                         VP(V("stay").t("b-to")),
                                         VP(V("talk").t("b"),
                                            PP(P("to"),
                                               NP(D("a"),N("wolf")))))))))).typ({neg:true})),
                    VP(V("say").t("ps"),
                       PP(P("to"),Pro("me").g("m"))).a(","),
                    SP(Pro("I").pe(1),
                       VP(V("go"),
                          SP(CP(C("and"),
                                VP(V("see").t("b-to"),
                                   NP(D("my").pe(1),N("grandmother"))),
                                VP(V("carry").t("b"),Pro("me").g("f"),
                                   CP(C("and"),
                                      NP(D("a"),N("cake")),
                                      lpob("a").add(PP(P("from"),NP(D("my").pe(1),N("mother"))))))))
                          )).typ({prog:true}).en("\"")
                ),
         ]},
         
         {p:[
            // "Does she live far off?" said the wolf
             ()=>
                S(SP(Pro("I").g("f"),
                     VP(V("live"),
                        Adv("far"),P("off"))).typ({int:"yon"}).en("\""),
                  VP(V("say").t("ps"),
                     NP(D("the"),N("wolf")))),
         ]},
         {p:[
            // "Oh I say," answered Little Red Riding Hood; "it is beyond that mill you see there, at the first house in the village."
             ()=>
                S(SP(SP(Q("oh"),Pro("I").pe(1),
                        VP(V("say"))).en('"'),
                     VP(V('answer').t("ps"),
                        LRRH())).a(";"),
                  SP(Pro("I"),
                     VP(V("be")),
                        PP(P("beyond"),
                           NP(D("that"),N("mill"),
                              SP(Pro("I").pe(2),
                                 VP(V("see"),
                                    Adv("there").a(","),
                                    PP(P("at"),
                                       NP(D("the"),A("first"),N("house"),   
                                          PP(P("in"),
                                             NP(D("the"),N("village")))))))))).en("\"")
                 ),
             ]},
             {p:[
            // "Well," said the wolf, "and I'll go and see her too. I'll go this way and go you that, and we shall see who will be there first."
             ()=>
                 S(Adv("well").en("\"").a(","),
                   VP(V("say").t("ps"),
                      NP(D("the"),N("wolf"))).a(","),
                   S(S(C("and"),
                       Pro("I").pe(1),
                       VP(V("go").t("f"),
                          C("and"),
                          V("see").t("b"),
                          Pro("me").g("f"),
                          Adv("too"))).a("."),
                     CP(C("and"),
                        CP(C("and"),
                           S(Pro("I").pe(1),
                             VP(V("go").t("f"),
                                NP(D("this"),N("way")))),
                           S(Pro("I").pe(2),
                             VP(V("go"),Pro("that"))).a(",")),
                        SP(Pro("I").pe(1).n("p"),
                           VP(V("see").t("f"),
                              SP(Pro("who"),
                                 V("be").t("f"),
                                 Adv("there"),Adv("first")))))
                     ).en("\"")
                   ),
         ]},
         {p:[
            // The wolf ran as fast as he could, taking the shortest path, and the little girl took a roundabout way, entertaining herself by gathering nuts, running after butterflies, and gathering bouquets of little flowers. 
             ()=>
                S(CP(C("and"),
                     S(NP(D("the"),N("wolf")),
                       VP(V("run").t("ps"),
                          AdvP(Adv("as"),A("fast"),Adv("as"),
                               Pro("I").g("m"),
                               V("can").t("ps")).a(","),
                          VP(V("take").t("pr"),
                             NP(D("the"),A("short").f("su"),N("path"))))),
                     S(NP(D("the"),A("little"),N("girl")),
                       CP(C("and"),
                          VP(V("take"),
                             NP(D("a"),A("roundabout"),N("way"))),
                          VP(V("entertain"),
                             Pro("myself").g("f"),
                             PP(P("by"),
                                VP(V("gather").t("ps"),N("nut").n("p")))),
                          VP(V("run"),
                             PP(P("after"),N("butterfly").n("p"))),
                          VP(V("gather"),
                             NP(N("bouquet").n("p"),
                                PP(P("of"),NP(A("little"),N("flower").n("p")))))
                          ).t("pr"))
                      )),

            // It was not long before the wolf arrived at the old woman's house. 
            ()=>
                S(Pro("I"),
                  VP(V("be").t("ps"),
                     AP(A("long"),
                        PP(P("before"),
                           NP(D("the"),N("wolf"),
                              VP(V("arrive").t("ps"),
                                 PP(P("at"),
                                    NP(D("the"),A("old"),N("woman").a("'s"),N("house")),
                                       ))))))
                  ).typ({neg:true}),

            // He knocked at the door: tap, tap.
            ()=>
                S(Pro("I").g("m"),
                  VP(V("knock").t("ps"),
                     PP(P("at"),
                        NP(D("the"),N("door")))).a(":"),
                  Q("tap").a(","),
                  Q("tap")
                 ),
             
         ]},
         {p:[
            // "Who's there?"
             whosThere 
         ]},
         {p:[
            // "Your grandchild, Little Red Riding Hood," replied the wolf, counterfeiting her voice; "who has brought you a cake and a little pot of butter sent you by mother."
             ()=> //var s17 =
                S(NP(D("my").pe(2).n("p"),N("grandchild").a(","),LRRH()).en("\"").a(","),
                  VP(V("reply").t("ps"),
                     NP(D("the"),N("wolf")),
                     VP(V("counterfeit").t("pr"),
                        NP(D("my").g("f"),N("voice")))).a(";"),
                  SP(Pro("who"),
                     VP(V("bring").t("ps"),
                        Pro("me").pe(2),
                        CP(C("and"),
                           NP(N("cake")),
                           NP(D("a"),A("little"),N("pot"),
                              PP(P("of"),N("butter"),
                                 V("send").t("pp"),Pro("I").pe(2),
                                 PP(P("by"),N("mother"))))))).typ({perf:true}).en("\"")
                 ), 
         ]},
         {p:[
            // The good grandmother, who was in bed, because she was somewhat ill, cried out, "Pull the bobbin, and the latch will go up."
              ()=>//var s18 =
                 S(NP(D("the"),A("good"),N("grandmother").a(","),
                      SP(Pro("who"),
                         VP(V("be").t("ps"),
                            PP(P("in"),N("bed")).a(","),
                            SP(C("because"),
                               Pro("I").g("f"),
                               VP(V("be").t("ps"),
                                  AdvP(Adv("somewhat"),A("ill")))).a(",")))),
                      VP(V("cry").t("ps"),Adv("out")).a(","),
                      CP(C("and"),
                         S(VP(V("pull").t("ip").cap(),NP(D("the"),N("bobbin")))).a(","),
                         S(NP(D("the"),N("latch")),
                           VP(V("go").t("f"),P("up")))
                         ).en("\"")
                   ),
             ]},
            {p:[

            // The wolf pulled the bobbin, and the door opened, and then he immediately fell upon the good woman and ate her up in a moment, for it been more than three days since he had eaten.
                ()=>//var s19 =
                S(S(NP(D("the"),N("wolf")),
                    VP(V("pull").t("ps"),
                       NP(D("the"),N("bobbin")))).a(","),
                  S(C("and"),
                    NP(D("the"),N("door")),
                    VP(V("open").t("ps"))).a(","),
                  S(CP(C("and"),
                       S(Adv("then"),Pro("I").g("m"),
                         VP(Adv("immediately"),
                            V("fall").t("ps"),
                            PP(P("upon"),
                               NP(D("the"),A("good"),N("woman"))))).a(","),
                       S(VP(V("eat").t("ps"),
                            Pro("me").g("f"),
                            P("up"),PP(P("in"),NP(D("a"),N("moment")))).a(","),
                            SP(C("for"),Pro("I"),
                               VP(V("be").t("pp"),
                                  D("more"),C("than"),
                                  NP(NO(3).nat(true),N("day"),
                                     SP(P("since"),
                                        Pro("I").g("m"),
                                        VP(V("eat").t("ps"))).typ({perf:true})))))
                     ))
                ),

            // He then shut the door and got into the grandmother's bed, expecting Little Red Riding Hood, who came some time afterwards and knocked at the door: tap, tap.
               ()=> //var s20 =
                S(CP(C("and"),
                     S(Pro("I").g("m"),
                       VP(Adv("then"),V("shut").t("ps"),
                          NP(D("the"),N("door")))),
                     S(VP(V("get").t("ps"),
                          PP(P("into"),
                             NP(D("the"),N("grandmother").a("'s"),N("bed")))).a(","),
                       VP(V("expect").t("pr"),
                          LRRH().a(","),
                          SP(Pro("who"),
                             CP(C("and"),
                                VP(V("come").t("ps"),
                                   NP(D("some"),N("time"),Adv("afterwards"))),
                                VP(V("knock").t("ps"),
                                   PP(P("at"),NP(D("the"),N("door"))).a(":"),
                                   Q("tap").a(","),Q("tap"))))
                           ))
                       )),
             
         ]},
         {p:[whosThere]},
         {p:[
        // Little Red Riding Hood, hearing the big voice of the wolf, was at first afraid; but believing her grandmother had a cold and was hoarse, answered, "It is your grandchild Little Red Riding Hood, who has brought you a cake and a little pot of butter mother sends you."
         ()=> //var s21 =
            S(LRRH(),
              VP(V("hear").t("pr"),
                 NP(D("the"),A("big"),N("voice"),
                    PP(P("of"),NP(D("the"),N("wolf"))))).a(","),
              VP(V("be").t("ps"),
                 PP(P("at"),Adv("first"),A("afraid"))).a(";"),
              SP(C("but"),
                 VP(V("believe").t("pr"),
                    NP(D("my").g("f"),N("grandmother"),
                       CP(C("and"),
                          VP(V("have").t("ps"),NP(D("a"),N("cold"))),
                          VP(V("be").t("ps"),A("hoarse"))).a(",")))),
              VP(V("answer").t("ps")).a(","),
              S(Pro("I"),
                VP(V("be"),
                   NP(D("my").pe(2).n("p"),N("grandchild"),LRRH()).a(","),
                   SP(Pro("who"),
                      VP(V("bring").t("ps"),
                         Pro("I").pe(2),
                         lpob("a"),
                         SP(N("mother"),
                            VP(V("send"),Pro("I").pe(2))))).typ({perf:true}))
              ).a("\"")
            ),
         ]},
         {p:[
            // The wolf cried out to her, softening his voice as much as he could, "Pull the bobbin, and the latch will go up."
             ()=> //var s22 =
                S(NP(D("the"),N("wolf")),
                  VP(V("cry"),Adv("out"),
                     PP(P("to"),Pro("me").g("f"))).a(","),
                  VP(V("soften").t("pr"),
                     NP(D("my").g("m"),N("voice"),
                        SP(Adv("as"),D("much"),Adv("as"),
                           Pro("I").g("m"),
                           V("can").t("ps")))).a(","),
                  CP(C("and"),
                     S(VP(V("pull").t("ip").cap(),NP(D("the"),N("bobbin")))).a(","),
                     S(NP(D("the"),N("latch")),
                       VP(V("go").t("f"),P("up")))
                     ).en("\"")
                  )
         ]},
         {p:[
            // Little Red Riding Hood pulled the bobbin, and the door opened.
             ()=> //var s23 =
                CP(C("and"),
                   S(LRRH(), 
                     VP(V("pull").t("ps"),
                        NP(D("the"),N("bobbin")))).a(","),
                    S(NP(D("the"),N("door")),
                      VP(V("open").t("ps"))).a(".")
                 ),
             
         ]},
         {p:[
        // The wolf, seeing her come in, said to her, hiding himself under the bedclothes, "Put the cake and the little pot of butter upon the stool, and come get into bed with me."
           ()=> //var s24 =
            S(NP(D("the"),N("wolf")).a(","),
              VP(V("see").t("pr"),
                 Pro("me").g("f"),
                 V("come").t("b"),P("in")).a(","),
              VP(V("say").t("ps"),
                 PP(P("to"),Pro("me").g("f")).a(","),
                 VP(V("hide").t("pr"),
                    Pro("myself").g("m"),
                    PP(P("under"),
                       NP(D("the"),N("bedcloth").n("p"))))).a(","),
             CP(C("and"),
                VP(V("put").t("ip").pe(2).cap(),
                   CP(C("and"),
                      NP(D("the"),N("cake")),
                      lpob("the")),
                   PP(P("upon"),
                      NP(D("the"),N("stool")))).a(","),
                VP(V("come").t("ip").pe(2),
                   V("get").t("b"),
                   PP(P("into"),NP(D("the"),N("bed"))),
                   PP(P("with"),Pro("me").pe(1)))).en("\"")
            ),
             
         ]},
         {p:[
            // Little Red Riding Hood took off her clothes and got into bed. 
             ()=> //var s25 =
                S(LRRH(),
                  CP(C("and"),
                     VP(V("take").t("ps"),P("off"),
                        NP(D("my").g("f"),N("cloth").n("p"))),
                     VP(V("get").t("ps"),P("into"),N("bed")))),
    
            // She was greatly amazed to see how her grandmother looked in her nightclothes, and said to her, "Grandmother, what big arms you have!"
            ()=> //var s26 =
                S(Pro("I").g("f"),
                  CP(C("and"),
                     VP(V("be").t("ps"),Adv("greatly"),V("amaze").t("pp"),
                        VP(V("see").t("b-to"),
                           SP(Pro("how"),
                              NP(D("my").g("f"),N("grandmother")),
                              VP(V("look").t("ps"),
                                 PP(P("in"),
                                    NP(D("my").g("f"),N("nightcloth").n("p"))).a(","))))),
                     VP(V("say").t("ps"),
                        PP(P("to"),Pro("me").g("f")).a(","),
                        howBig(N("arm").n("p"))))
                ),
             
         ]},
         {br:[
            // "All the better to hug you with, my dear."
            ()=>allTheBetter(V("hug")),    
            // "Grandmother, what big legs you have!"
            ()=>howBig(N("leg").n("p")),
            // "All the better to run with, my child."
            ()=>allTheBetter(V("run")),    
            // "Grandmother, what big ears you have!"
            ()=>howBig(N("ear").n("p")),    
            // "All the better to hear with, my child."
            ()=>allTheBetter(V("hear")),    
            // "Grandmother, what big eyes you have!"
            ()=>howBig(N("eye").n("p")),    
            // "All the better to see with, my child."
            ()=>allTheBetter(V("see")),    
            // "Grandmother, what big teeth you have got!"
            ()=>howBig(N("tooth").n("p")),    
            // "All the better to eat you up with."
            ()=>allTheBetter(V("eat")),             
         ]},
         {p:[
            // And, saying these words, this wicked wolf fell upon Little Red Riding Hood, and ate her all up.
             ()=> //var s26a =
                S(C("and"),VP(V("say").t("pr"),
                              NP(D("this"),N("word").n("p"))).a(","),
                  NP(D("this"),A("wicked"),N("wolf")),
                  CP(C("and"),
                     VP(V("fall").t("ps"),
                        PP(P("upon"),LRRH())).a(","),
                     VP(V("eat").t("ps"),
                        Pro("me").g("f"),Adv("all"),Adv("up")))
                ),
         ]},
         {p:[
            // Moral: Children, especially attractive, well bred young ladies, should never talk to strangers, for if they should do so, they may well provide dinner for a wolf.
             ()=> //var s27 =
                S(N("moral").a(":"),
                  NP(N("child").n("p").cap().a(","),
                     AP(Adv("especially"),A("attractive")).a(","),
                     AP(Adv("well"),V("breed").t("pp"),A("young"),N("lady").n("p")).a(",")),
                  VP(V("shall").t("ps"),
                     Adv("never"),V("talk").t("b"),
                     PP(P("to"),N("stranger").n("p"))).a(","),
                  SP(C("for"),C("if"),
                     Pro("I").n("p"),
                     VP(V("shall").t("ps"),
                        V("do").t("b"),
                        Adv("so"))).a(","),
                  S(Pro("I").n("p"),
                    VP(V("provide"),
                       NP(N("diner"),
                          PP(P("for"),
                             NP(D("the"),N("wolf"))))).typ({mod:"perm"}))
                 ),
    
            // I say "wolf," but there are various kinds of wolves. 
             ()=> //var s28 =
                 S(Pro("I").pe(1),
                   VP(V("say"),
                      N("wolf").en("\""),
                      SP(C("but"),
                         Pro("I").n("p"),
                         VP(V("be"),
                            NP(A("various"),N("case").n("p"),
                               P("of"),N("wolf").n("p")))).b(","))
                  ),

            // There are also those who are charming, quiet, polite, unassuming, complacent, and sweet, who pursue young women at home and in the streets. 
            ()=> //var s29 =
                S(Pro("I").n("p"),
                  VP(V("be"),Adv("also"),
                     SP(Pro("who"),
                        VP(V("be").n("p"),
                           CP(C("and"),
                              A("charming"),
                              A("quiet"),
                              A("polite"),
                              A("unassuming"),
                              A("complacent"),
                              A("sweet")))).a(","),
                     SP(Pro("who"),
                        VP(V("pursue").n("p"),
                           NP(A("young"),N("woman").n("p")),
                           PP(P("at"),N("home"),
                              P("in"),NP(D("the"),N("street").n("p")))))),
                 ),
            // And unfortunately, it is these gentle wolves who are the most dangerous ones of all.
            ()=> //var s30 = 
                S(C("and"),Adv("unfortunately"),
                  Pro("I"),
                  VP(V("be"),
                     NP(D("this"),A("gentle"),N("wolf").n("p"),
                        SP(Pro("who"),
                           VP(V("be"),
                              AP(D("the"),A("dangerous").f("su"),D("ones"),P("of"),D("all"))))))
                ),
             
                     ]},
]
    
function generateHTML(texte){
    loadEn();
    const annotation = $("input[name='annotation']:checked").val();
    $(".story").empty()
    let para, phrase, source;
    for (let group of texte){
        const tag=Object.keys(group)[0];
        const phrases=group[tag];
        para = tag=="br" ? $("<p>") : $(`<${tag}>`);
        for (let phraseF of phrases) {
            const elem = $(`<span class="texte">${phraseF().toString()}</span> `);
            if (annotation=="dep"){
                source=phraseF().toDependent().toSource(0)
            } else {
                source=phraseF().toSource(0)                
            }
            elem.append(`<span class="tt">${source}</span>`)
            para.append(elem);
            if (tag=="br")para.append("<br>")
        }
        $(".story").append(para)
    }
}

function generateTXT(texte){
    for (let group of texte){
        const tag=Object.keys(group)[0];
        const phrases=group[tag];
        let out=""
        for (let phraseF of phrases) {
            const jsr=phraseF();
            out+=jsr.toString()+" "
            if (tag=='br'){
                console.log(out);
                out=""
            }
        }
        if (out.length>0){
            console.log(out);
            console.log()
            out=""
        }
    }
    
}

function init(jsr){
   Object.assign(globalThis,jsr);
   loadEn();
   // add unknown English words to the dictionary
   addToLexicon("amaze",{ V: { tab: 'v3' } });
   addToLexicon("bedcloth",{ N: { "tab":"n2" } })
   addToLexicon("nightcloth",{ N: { "tab":"n2" } })
   addToLexicon("woodcutter",{ N: { "tab":"n1" } });
}


if (typeof process !== "undefined" && process?.versions?.node){
   let {default:jsRealB} = await import("../../dist/jsRealB.js");
   init(jsRealB);
   generateTXT(story);      
} else {
   $(document).ready(function() {
      init(jsRealB);
      $("#dependances,#constituents").change(()=>generateHTML(story))
      generateHTML(story);
   })
}

