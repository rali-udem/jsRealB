QUnit.test( "Phrase FR", function( assert ) {
   Object.assign(globalThis,jsRealB);
   loadFr();
    var pomme = NP(D("le"),N("pomme"));
    var  gars = NP(D("le"),N("garçon").n("p"));
    addToLexicon({"John":{"N":{"g":"m","tab":"n4"}}})
    addToLexicon({"Mary":{"N":{"g":"f","tab":"n16"}}})
    var phrases = [
        // 1
        {"expression":S(
                    NP( D('le'),
                        N('souris'),
                        SP(Pro('que'),
                            NP(D('le'),
                                N('chat').n("p")),
                            VP(V('manger').t('pc')))),
                    VP( V('être').t('p'),
                        AP(A('gris')))
                ),
         "expected":"La souris que les chats ont mangée est grise. ",
         "message":"Phrase avec attribut, de plus le passé composé avec avoir est accordé correctement... "},
        // 2
        {"expression":S(N("cadeau").n("p")).cap(false),
         "expected":"cadeaux",
         "message":"Phrase sans capitale"},
        // 3
        {"expression":S(NP(A("beau"), N("cadeau").n("p"))),
         "expected":"Beaux cadeaux. ",
         "message":"Accord adjectif"},
        // 4
        {"expression":NP(D("le"),N("gens").n("p"),A("vulgaire").pos("pre")),
         "expected":"les vulgaires gens",
         "message":"Adjectif pré-posé"},
        // 5
        {"expression":S( NP(D("le"), N("père"), PP(P("de"), NP(D("mon").pe(1), N("fille")) ) )),
         "expected":"Le père de ma fille. ",
         "message":"Accord adjectif"},
        // 6
        {"expression":S(Pro("je").pe(1).n("p"), VP(V("agir").t("pc"), AdvP(Adv("conformément"), 
                      PP(P("à"), NP(D("le"), N("loi")))))).typ({"neg":true}),
         "expected":"Nous n'avons pas agi conformément à la loi. ",
         "message":"Phrase négative avec accord du verbe"},
        // 7
        {"expression":S(Pro("je").pe(2), VP(V("travailler").t("pc"),
                      AdvP(Adv("bien")))).typ({"mod":"nece"}),
         "expected":"Tu as dû bien travailler. ",
         "message":"Phrase au passé avec modalité de nécessité"},
        // 8
        {"expression":S(CP(C("et"), NP(D("le"), N("garçon")), NP(D("le"), N("fille"))), 
                      VP(V("être").t("p"),A("gentil"))),
         "expected":"Le garçon et la fille sont gentils. ",
         "message": "Coordination"},
        // 9
        {"expression":S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), 
                      NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))).typ({"int":"yon"}),
         "expected":"La boulangère et la cliente parlent-elles? ",
         "message":"Coordination et interrogation"},
        // 10
        {"expression":S(CP(C("et"), NP(D("le"), N("boulanger").g("f")), NP(D("le"), N("vendeur")), 
                      NP(D("le"), N("client").g("f"))), VP(V("parler").t("p"))),
         "expected":"La boulangère, le vendeur et la cliente parlent. ",
         "message":"Coordination"},
        // 11
        {"expression":S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")))).typ({"pas":true}),
         "expected":"Le gâteau est mangé par les enfants. ",
         "message":"Passif avec élision"},
        // 12
        {"expression":S(NP(D("le"),N("enfant").n("p")).pro(),VP(V("manger"),NP(D("le"),N("gâteau")))),
         "expected":"Ils mangent le gâteau. ",
         "message":"Pronominalisation du sujet"},
        // 13
        {"expression":S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")).pro())),
         "expected":"Les enfants le mangent. ",
         "message":"Pronominalisation du complément"},
        // 14
        {"expression":S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")).pro())).typ({"pas":true}),
         "expected":"Il est mangé par les enfants. ",
         "message":"Pronominalisation du complément au passif"},
        // 15
        {"expression":S(NP(D("le"),N("chat").g("f").n("p")),
                  VP(V("manger"),
                     NP(D("le"),N("souris")))),
         "expected":"Les chattes mangent la souris. ",
         "message":"Phrase affirmative"},
        // 16
        {"expression":S(NP(D('le'),Q("super"),
                     N('chat').g("f").n("p").tag("b").tag("i")),
                  VP(V('dévorer').t('pc'),
                     NP(D('le'),
                        N('souris'),
                        A("gris"),"Wow!").tag("a",{"href":"http://wikipedia.org/cat","target":"_blank"}))
                    ).typ({"neg":true}),
         "expected":'Les super <i><b>chattes</b></i> n\'ont pas dévoré <a href="http://wikipedia.org/cat" target="_blank">la souris grise Wow!</a>',
         "message":"Phrase avec tag HTML"},
        // 17
        {"expression":S(NP(D('le'),
                         N('souris').n("p")),
                      VP(V('être').t('p'),
                            AP(A('gris')))).typ({"neg":true}),
         "expected":"Les souris ne sont pas grises. ",
         "message":"Accord avec être"},
        // 18
        {"expression":S(Pro("je").n("p").pe(2),
                  VP(V("avoir").t("cp"),
                     NP(NO(2),A("beau"),N("ami").g("f")))).typ({"neg":"plus"}),
         "expected":"Vous n'auriez plus eu 2 belles amies. ",
         "message":"Négation avec adjectif au pluriel"},
        // 19
        {"expression":S(NP(N("John")),
                      VP(V("évanouir").t("pc"),
                         PP(P("à"),DT("1979-05-21T12:00:00")
                                     .dOpt({"hour":false,"minute":false,"second":false}))))
                     .typ({"neg":true}),
         "expected":"John ne s'est pas évanoui au lundi 21 mai 1979. ",
         "message":"Phrase avec une date et un ajout au dictionnaire"},
        // 20
        {"expression":S(CP(C("et"),NP(N("John")),NP(N("Mary"))),
                      VP(V("évanouir").t("pc"),
                         PP(P("à"),
                            DT("1979-05-21T12:00:00")
                             .dOpt({"hour":false,"minute":false,"second":false})))
                      ).typ({"neg":true}),
         "expected":"John et Mary ne se sont pas évanouis au lundi 21 mai 1979. ",
         "message":"Phrase avec coordination ou et date. "},
        // 21
        {"expression":S(VP().add(V("aimer")).add(pomme)).add(gars,0),
         "expected":"Les garçons aiment la pomme. ",
         "message":"Phrase construite par morceaux"},
        // 22
        {"expression":S(CP(C("et"),NP(D("le"),N("fruit"))).add(pomme).add(gars),
                          VP(V("venir").t("pc"),
                             Adv("hier"))),
         "expected":"Le fruit, la pomme et les garçons sont venus hier. ",
         "message":"Coordination construite par morceaux"},
        // 23
        {"expression":S(CP(C("et"),NP(D("le"),N("orange"))).add(pomme),
                          VP(V("arriver").t("pc"),
                             Adv("hier"))),
         "expected":"L'orange et la pomme sont arrivées hier. ",
         "message":"Coordination avec attribut au pluriel"},
        // 24
        {"expression":S(Pro("je"),
                          VP(V("manger").t("pc"),
                             NP(D("le"),N("pomme")))),
         "expected":"Il a mangé la pomme. ",
         "message":"Phrase de base"},
        // 25
        {"expression":S(Pro("je"),
                          VP(V("manger").t("pc"),
                             NP(D("le"),N("pomme")).tag("i").pro())),
         "expected":"Il <i>l'</i> a mangée. ",
         "message":"Pronominalisation combinée avec tag HTML"},
        // 26
        {"expression":S(NP(D("le"),N("pomme").tag("i"),
                          SP(Pro("qui"),
                             VP(V("manger").aux("êt").t("pc"))))),
         "expected":"La <i>pomme</i> qui est mangée. ",
         "message":"Phrase avec attribut"},
        // 27
        {"expression":NP(D("le"),N("pomme").tag("i"),
                             SP(Pro("que"),
                                Pro("je"),
                                VP(V("manger").t("pc")))),
         "expected":"la <i>pomme</i> qu'il a mangée",
         "message":"NP avec relative"},
        // 28
        {"expression":S(NP(D("le"),N("pomme").tag("i"),
                             SP(Pro("que"),
                                Pro("je"),
                                VP(V("manger").t("pc")))).pro()),
         "expected":"Elle. ",
         "message":"Pronominalisation qui couvre toute la phrase... "},
        // 29
        {"expression":S(NP(D("le"),N("enfant").n("p")),VP(V("manger"),NP(D("le"),N("gâteau")))).typ({"pas":true}),
         "expected":"Le gâteau est mangé par les enfants. ",
         "message":"Passive"},
        // 30
        {"expression":S(Pro("je").pe(1).n("p"), VP(V("agir").t("c"), AdvP(Adv("conformément"),
                                  PP(P("à"), NP(D("le"), N("loi")))))).typ({"mod":"nece"}),
         "expected":"Nous devrions agir conformément à la loi. ",
         "message":"avec PP"},
        // 31
        {"expression":S(NP(D("le"),N("chat").n("p")),
                      CP(C("et"),VP(V("courir")),
                                 VP(V("sauter")),
                                 VP(V("manger"),NP(D("le"),N("souris"))))),
         "expected":"Les chats courent, sautent et mangent la souris. ",
         "message":"Sujet d'une coordination de verbes"},
        // 32
        {"expression":S(Pro("ce"),
                      VP(V("être"),
                         PP(P('de'),
                            NP(D("le"),
                               N("exercice"),
                               AP(A("aisé"),
                                  PP(P("à"),
                                     VP(V("réussir").t("b"),
                                        PP(P("de"),
                                           NP(D("le"),
                                              A("premier"),
                                              N("coup")))))))))
                       ).typ({"neg":true}),
         "expected":"Ce n'est pas de l'exercice aisé à réussir du premier coup. ",
         "message":"Multiples élisions"},
        // 33
        {"expression":S(CP(C("et"),
                         NP(D("mon").pe(1),N("ami").g("f")),
                         NP(D("le"),A("vieux"),N("étudiant").g("f"))),
                       SP(Pro("que"),
                          NP(D("ce"),N("homme")),
                          VP(V("recevoir").t("pc")))),
         "expected":"Mon amie et la vieille étudiante que cet homme a reçues. ",
         "message":"Élisions, euphonies et cod coordonné placé avant le verbe"},
        // 34
        {"expression": S(NP(D("le").tag("i"),N("chat").tag("b"))),
         "expected":"<i>Le</i> <b>chat</b>. ",
         "message":"Top level,capitalization with HTML tags. "},
        // 35
        {"expression":S(Pro("je").pe(2),
                      VP(V("demander").t("pc"),
                         NP(D("mon"),N("adresse")).pro(),
                         PP(P("à"),NP(D("mon"),N("parent").n("p"))).pro())),
         "expected":"Tu la leur as demandée. ",
         "message":"Pronominalisation de l'objet direct et de l'objet indirect (datif)"},
        // 36
        {"expression":S(Pro("je"),
                      VP(V("parler").t("pc"),
                         PP(P("à"),NP(D("mon"),N("ami").g("f"))).pro(),
                         PP(P("de"),NP(D("mon"),N("problème"))).pro())),
         "expected":"Il lui en a parlé. ",
         "message":"Pronominalisation de deux objets indirects"},
         // 37
         {"expression":S(Pro('je'),
                         VP(V('aller').t("pc"),
                            Adv('hier'),
                            PP(P('à'),
                               NP(D('le'),
                                  N('maison'))))).typ({"neg":true}),
          "expected":"Il n'est pas allé hier à la maison. ",
          "message":"Position de l'adverbe dans une négation"},
         // 38
         {"expression":S(Pro('je'),
                         VP(V('aller').t("pc"),
                            Adv('souvent'),
                            PP(P('à'),
                               NP(D('le'),
                                  N('maison'))),
                            Adv('sûrement'))).typ({"neg":true}),
          "expected":"Il n'est pas souvent allé à la maison sûrement. ",
          "message":"Position d'adverbes séparés"},
         // 39
         {"expression":S(Pro('je'),
                         VP(V('aller').t("pc"),
                            Adv('souvent').pos("post"),
                            PP(P('à'),
                               NP(D('le'),
                                  N('maison'))))).typ({"neg":true}),
          "expected":"Il n'est pas allé souvent à la maison. ",
          "message":"Position d'un adverbe avec .pos()"},
         // 40
         {"expression":S(NP(D('le'),
                           N('chat')),
                        VP(V('manger'),
                           Adv('bien'),
                           Adv('souvent'),
                           NP(D('le'),
                              N('souris')))).typ({"pas":true}),
          "expected":"La souris est bien souvent mangée par le chat. ",
          "message":"Position d'adverbes contigus"},
         //   41
           {"expression":S(S(VP(V("trouver").t("b"),
                                NP(D("un"),N("livre"),
                                   SP(Pro("dont"),
                                      Pro("on"),
                                      VP(V("dire").t("s"),
                                         SP(Pro("que"),
                                             VP(V("traduire").t("pc"),Pro("lui").c("acc")).typ({'neg':true,"pas":true}))
                                         ).typ({"mod":"poss"}))))),
                           VP(V("être"),A("difficile"))).typ({"pas":true,"neg":true}),
           "expected": "Il n'a pas été difficile de trouver un livre dont on puisse dire qu'il n'a pas été traduit. ",
           "message": "Subordonnées modifiées imbriquées"},
         //   42
         {"expression":S(S(VP(V("trouver").t("b"),
                              NP(D("un"),N("livre"),
                                 SP(Pro("que"),
                                    Pro("lui").c("nom"),
                                    VP(V("traduire").t("pc")).typ({'neg':true,"pas":false}))))),
                         VP(V("être"),A("difficile"))).typ({"pas":true,"neg":true}),
           "expected": "Il n'a pas été difficile de trouver un livre qu'il n'a pas traduit. ",
           "message": "Subordonnées modifiées imbriquées - bis"},
         //   43
         {"expression":CP(C("et"),
                          NP(D("de"),
                             A("multiple").pos('pre'),
                             N("tâche")),
                          N("démarche")).n('p'),
           "expected": "de multiples tâches et démarches",
           "message": "propagation d'option dans un CP"},
         // 44
         {"expression":
            S(Pro("lui").c("nom"),
               VP(V("indiquer").t("c"),
                  SP(C("si"),
                     Pro("lui").c("nom"),
                     VP(V("plaider"),
                        AP(A("coupable"),
                           PP(P("de"),
                              NP(D("le"),
                                 N("fait").n("p"),
                                 SP(Pro("qui"),
                                    VP(V("être"),
                                       V("reprocher").t("pp"),
                                       Pro("lui").c("dat")))))))))).typ({"mod": "nece"}),
         "expected": "Il devrait indiquer s'il plaide coupable des faits qui lui sont reprochés. ",
         "message": "NP avec une relative contenant un attribut"},
        // 45
        {"expression":NP(D("un"),N("personne"), AP(Adv("très"),A("beau"))),
         "expected":"une personne très belle",
         "message":"accord dans un AP"},
        // 46
        {"expression":NP(D("un"), AP(Adv("très"),A("beau")),N("personne")),
         "expected":"une très belle personne",
         "message":"accord dans un AP"},

        // VP : Verbal Phrase
        // 47
        {"expression":S(NP(Pro("je")).pe(2), VP(V("être"), AP(A("intelligent")))).g("f"),
         "expected":"Tu es intelligente. ",
         "message":"1. VP"},
        // 48
        {"expression":S(NP(Pro("je")).pe(2), VP(V("travailler"), AdvP(Adv("bien")))),
         "expected":"Tu travailles bien. ",
         "message":"2. VP"},
        // 49
        {"expression":S(NP(D("le"), N("visiteur")), VP(V("dormir")).t("i"), NP(D("le"), N("matin"))),
         "expected":"Le visiteur dormait le matin. ",
         "message":"3. VP"},
        // 50
        {"expression":S(NP(Pro("je")).pe(3).g("f"), VP(V("manger"), NP(D("un"), N("gâteau")).n("p")).t("i")),
         "expected":"Elle mangeait des gâteaux. ",
         "message":"4. VP"},
        // 51
        {"expression":S(NP(D("ce"), N("gâteau")), VP(V("être")), AP(A("excellent"))),
         "expected":"Ce gâteau est excellent. ",
         "message":"5. VP"},
        // 52
        {"expression":S(NP(Pro("je").pe(1).n("p")), VP(V("mettre"), NP(D("le"), N("courrier"), PP(P("sur"), NP(D("le"), N("table")))))),
         "expected":"Nous mettons le courrier sur la table. ",
         "message":"6. VP"},
        // 53
        {"expression":S(NP(Pro("je").pe(1)), VP(V("parler"), PP(P("à"), NP(D("un"), N("fille"))))),
         "expected":"Je parle à une fille. ",
         "message":"7. VP"},
        // 54 
        {"expression":S(NP(Pro("je").pe(3).n("p")), VP(V("arrêter"), AdvP(Adv("rapidement")), NP(D("le"), N("discussion"))).t("ps")),
         "expected":"Ils arrêtèrent rapidement la discussion. ",
         "message":"8. VP"},
        // 55
        {"expression":S(NP(D("le"), N("petit")).g("f"), VP(V("garder"), NP(D("le"), N("montre")))),
         "expected":"La petite garde la montre. ",
         "message":"9. VP"},
        // 56
        {"expression":S(NP(Pro("je")).pe(3), VP(V("refuser")).t("f")),
         "expected":"Il refusera. ",
         "message":"10. VP"},
        // 57
        {"expression":S(Pro("je"),VP(V("manger"),NP(D("un"),N("pomme"),V("laisser").t("pp"),PP(P("par"),N("terre"))))),
         "expected":"Il mange une pomme laissée par terre. ",
         "message":"11.VP + NP(avec pp accordé seul) + PP"},
        // 58
        {"expression":NP(D("le"),N("fenêtre").n("p"),V("ouvrir").t("pp")),
         "expected":"les fenêtres ouvertes",
         "message":"12. NP(avec pp accordé seul)"},

        // AP : Adjective Phrase
        // 59
        {"expression":AP(A("grand").g("f")),
         "expected":"grande",
         "message":"1. AP"},
        // 60
        {"expression":AP(A("content").g("f")),
         "expected":"contente",
         "message":"2. AP"},
        // 61
        {"expression":AP(AdvP(Adv("très")), A("grand").g("f")),
         "expected":"très grande",
         "message":"3. AP"},
        
        // AdvP : Adverbial Phrase
        // 62
        {"expression":AdvP(Adv("évidemment")),
         "expected":"évidemment",
         "message":"1. AdvP"},
        // 63
        {"expression":AdvP(Adv("fort")),
         "expected":"fort",
         "message":"2. AdvP"},
        // 64
        {"expression":AdvP(Adv("rapidement")),
         "expected":"rapidement",
         "message":"3. AdvP"},
        
        // PP : Prepositional Phrase
        // 65
        {"expression":PP(P("dans"), NP(D("le"), N("ville"))),
         "expected":"dans la ville",
         "message":"1. PP"},
        // 66
        {"expression":PP(P("de"), NP(D("ce"), N("femme"))),
         "expected":"de cette femme",
         "message":"2. PP"},
        // 67
        {"expression":PP(P("à"), NP(D("le"), N("maison"))),
         "expected":"à la maison",
         "message":"3. PP"},
        // 68
        {"expression":PP(P("par"), NP(D("le"), N("fenêtre")).n("p")),
         "expected":"par les fenêtres",
         "message":"4. PP"},
        // 69
        {"expression":PP(P("avec"), NP(D("mon"), N("femme"))),
         "expected":"avec sa femme",
         "message":"5. PP"},
        
        // CP : Coordinated Phrase
        // 70
        {"expression":CP(C("ou"), Pro('moi').pe(2), Pro('je').pe(3).g("f")),
         "expected":"toi ou elle",
         "message":"0. CP"},
        // 71
        {"expression":CP(C("ou"), Pro('moi').pe(1), Pro('moi').pe(2), Pro('je').pe(3).g("f")),
         "expected":"moi, toi ou elle",
         "message":"1. CP"},
        // 72
        {"expression":NP(N("jeu").n("p").a(";"), N("jouet").n("p").a(";"), N("cadeau").n("p")),
         "expected":"jeux ; jouets ; cadeaux",
         "message":"3. CP"},
        // 73
        {"expression":NP(D('le'), N('vaisseau').n('p').lier(), N('mère').n('p')),
         "expected":"les vaisseaux-mères",
         "message":"4. CP"},
        // 74
        {"expression":NP(D('un'), N('mur'), A('rouge').lier(), A('orange')),
         "expected":"un mur rouge-orange",
         "message":"5. CP"},
        // 75
        {"expression":CP(NP(D("le"), N("garçon")), NP(D("le"), N("fille")), C("et")),
         "expected":"le garçon et la fille",
         "message":"6. CP"},
        // 76
        {"expression":CP(NP(D("le"), N("garçon")), C("et"), NP(D("le"), N("fille"))),
         "expected":"le garçon et la fille",
         "message":"7. CP"},
        // 77
        {"expression":CP(C("et"), NP(D("le"), N("garçon")), NP(D("le"), N("fille"))),
         "expected":"le garçon et la fille",
         "message":"8. CP"},
        
        // SP : Propositional Phrase
        // 78
        {"expression":NP(D('le'), N('chose'), SP(Pro('que'), NP(Pro('je').pe(2)), VP(V('dire').t("pc")))),
         "expected":"la chose que tu as dite",
         "message":"1. SP"},
        // 79
        {"expression":NP(D('le'),N('souris'),SP(Pro('que'),NP(D('le'), N('chat')), VP(V('manger')))),
         "expected":"la souris que le chat mange",
         "message":"2. SP"},
        // 80
        {"expression":NP(Pro('ce'), SP(Pro('dont'),NP(Pro('je').pe(2)),VP(V('parler')))),
         "expected":"ce dont tu parles",
         "message":"3. SP"},
        // 81
        {"expression":S( NP( D("le"), N("personne").n("p"), SP( Pro("que"), Pro("je").pe("1").n("p"), VP( V("rencontrer").t("pc"))))),
         "expected":"Les personnes que nous avons rencontrées. ",
         "message":"4. SP + pp(avoir)"},
        // 82
        {"expression":S( NP( D("le"), N("fleur").n("p"), SP( Pro("que"), NP( D("le"), N("garçon").n("p")), VP( Pro("je").pe(1).n("p"), V("offrir").t("pc")))), VP( V("être").t("pc"), A("joli"))),
         "expected":"Les fleurs que les garçons nous ont offertes ont été jolies. ",
         "message":"5. SP + pp(avoir) + pp(être)"},
        // 83
        {"expression":S( NP( N("pierre").n("p"), SP( Pro("qui"), VP( V("rouler")))), VP( V("amasser"), NP( N("mousse")))).typ({neg:true}),
         "expected":"Pierres qui roulent n'amassent pas mousse. ",
         "message":"6. SP(qui)"},
        // 84
        {"expression":S( NP( D("le"), N("dame").n("p"), SP( P("à"), Pro("qui"), Pro("je").pe("1").n("s"), VP( V("parler").t("pc")))), VP(V("être").t("pc"), A("joli"))),
         "expected":"Les dames à qui j'ai parlé ont été jolies. ",
         "message":"7. SP(à qui)"},

        // Composition
        // 85
        {"expression":NP(D("le"), A("petit"), N("chien").g("f"), A("blanc"), PP(P("de"), NP( D("mon").pe(1), N("voisin").g("f").n("p")) ) ),
         "expected":"la petite chienne blanche de mes voisines",
         "message":"1. NP + PP"},
        // 86
        {"expression":NP(D("le"), N("père"), PP(P("de"), NP(D("mon").pe(1), N("fille")) ) ),
         "expected":"le père de ma fille",
         "message":"2. NP + PP"},
        // 87
        {"expression":AP(AdvP(Adv("très")), A("fier"), PP(P("de"), NP(D("mon").pe(3), N("famille")))),
         "expected":"très fier de sa famille",
         "message":"3. AP + AdvP + PP + NP"},
        // 88
        {"expression":AdvP(Adv("conformément"), PP(P("à"), NP(D("le"), N("loi")))),
         "expected":"conformément à la loi",
         "message":"4. AdvP + PP + NP"},
        // 89
        {"expression":S( NP(D("le"), N("peintre")), VP(V("réparer"), NP(D("le"), N("mur"))), PP(P("dans"), NP(D("le"), N("cour"))) ),
         "expected":"Le peintre répare le mur dans la cour. ",
         "message":"5. S + NP + VP + PP"},
         // 90
         {"expression":S(NP(D("le"),N("pomme").n("p")),VP(V("être"),A("beau"))),
          "expected":"Les pommes sont belles. " ,
          "message":"Les pommes sont belles."},
         // 91
         {"expression":S(NP(D("le"),N("pomme")),VP(V("être"),CP(C("et"),A("beau"),A("joli")))),
          "expected":"La pomme est belle et jolie. ",
          "message":"La pomme est belle et jolie"},
          // 92
          {"expression":
             S(NP(D('le'),
                  N('fleur').n("p"),
                  SP(Pro('que'),
                     NP(D('le'),
                        N('garçon').n("p")),
                     VP(V('offrir').t("pc"),
                        PP(P('à'),
                           NP(D('le'),
                              N('fille'),
                              A('jeune')).n("p")).pro(true)))),
               VP(V('être').t("pc"),
                  A('joli'))),
            "expected":"Les fleurs que les garçons leur ont offertes ont été jolies. ",
            "message":"Pronominalisation d'un PP" 
          },            
        //Pronominalisation des groupes du nom
        // 93
        {"expression":S(NP(D('un'),N("poule")).n('p'),VP(V("mordre").t('p'))),
        "expected":"Des poules mordent. ",
        "message":"Sans pronominalisation"},
        // 94
        {"expression":S(NP(D('un'),N("poule")).n('p').pro(),VP(V("mordre").t('p'))),
         "expected":"Elles mordent. ",
         "message":"Pronominalisation sujet"},
        // 95
        {"expression":S(NP(D('un'),N("poule")).n('p'),VP(V("mordre").t('p'),NP(D("un"),N("enfant")))),
         "expected":"Des poules mordent un enfant. ",
         "message":"Sans pronominalisation (avec cd)"},
        // 96
        {"expression":S(NP(D('un'),N("poule")).n('p'),VP(V("mordre").t('p'),NP(D("un"),N("enfant")).pro())),
         "expected":"Des poules le mordent. ",
         "message":"Pronominalisation cd"},
        // 97
        {"expression":S(NP(D('un'),N("poule")).n('p').pro(),VP(V("mordre").t('p'),NP(D("un"),N("enfant")).pro())),
         "expected":"Elles le mordent. ",
         "message":"Pronominalisation sujet+cd"},
        // 98
        {"expression":S(NP(D('un'),N("poule")).n('p'),VP(V("mordre").t('p'),NP(D("un"),N("enfant")),PP(P("dans"),NP(D("un"),N("maison"))))),
         "expected":"Des poules mordent un enfant dans une maison. ",
         "message":"Sans pronominalisation (avec cd+ci)"},
        // 99
        {"expression":S(NP(D('un'),N("poule")).n('p'),VP(V("mordre").t('p'),NP(D("un"),N("enfant")),PP(P("dans"),NP(D("un"),N("maison")).pro()))),
         "expected":"Des poules mordent un enfant dans elle. ",
         "message":"Pronominalisation ci"},
        // 100
        {"expression":S(NP(D('un'),N("poule")).n('p').pro(),VP(V("mordre").t('p'),NP(D("un"),N("enfant")).pro(),PP(P("dans"),NP(D("un"),N("maison")).pro()))),
         "expected":"Elles le mordent dans elle. ",
         "message":"Pronominalisation sujet+cd+ci"},

        //Action passive
        // 101
        {"expression":S(NP(D("le"),N("soldat").n("p")),VP(V("trouver").t("pc"),NP(D("le"),N("fille")))),
         "expected":"Les soldats ont trouvé la fille. ",
         "message":"Phrase simple"},
        // 102
        {"expression":S(NP(D("le"),N("soldat").n("p")),VP(V("trouver").t("pc"),NP(D("le"),N("fille")))).typ({pas:true}),
         "expected":"La fille a été trouvée par les soldats. ",
         "message":"Phrase passive avec sujet et cd"},
        // 103
        {"expression":S(NP(D("le"),N("soldat").n("p")),VP(V("trouver").t("pc"))).typ({pas:true}),
         "expected":"Il a été trouvé par les soldats. ",
         "message":"Phrase passive avec sujet, sans cd"},
        // 104
        {"expression":S(VP(V("trouver").t("pc"),NP(D("le"),N("fille")))).typ({pas:true}),
         "expected":"La fille a été trouvée. ",
         "message":"Phrase passive avec cd, sans sujet"},
    ];
    
    for (var i = 0; i < phrases.length; i++) {
        var s=phrases[i];
        var exp=s.expression;
        assert.equal(exp.toString(),s.expected,s.message)
    }
});

