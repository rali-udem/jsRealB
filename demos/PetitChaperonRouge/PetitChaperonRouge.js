// Réalisation d'un texte existant

/*  Original... tiré de https://clpav.fr/lecture-chaperon.htm et https://clpav.fr/moralite-chaperon.htm
                     Le petit chaperon rouge

Il était une fois une petite fille de village, la plus jolie qu'on eût su voir: sa mère en était folle, et sa mère-grand plus folle encore. Cette bonne femme lui fit faire un petit chaperon rouge qui lui seyait si bien, que partout on l'appelait le petit chaperon rouge.

Un jour, sa mère ayant cuit et fait des galettes, lui dit: " Va voir comment se porte la mère-grand, car on m'a dit qu'elle était malade. porte-lui une galette et ce petit pot de beurre. " Le petit chaperon rouge partit aussitôt pour aller chez sa mère-grand, qui demeurait dans un autre village. En passant dans un bois, elle rencontra compère le loup, qui eût bien envie de la manger! mais il n'osa, à cause de quelques bûcherons qui étaient dans la forêt. Il lui demanda où elle allait. La pauvre enfant, qui ne savait pas qu'il était dangereux de s'arrêter à écouter un loup, lui dit : " Je vais voir ma mère-grand, et lui porter une galette, avec un petit pot de beurre, que ma mère lui envoie. 
- Demeure-t-elle bien loin ; lui dit le loup. 
- Oh ! oui, dit le petit chaperon rouge ! c'est par-delà le moulin que vous voyez tout là-bas, à la première maison du village. 
- Eh bien ! dit le loup, je veux l'aller voir aussi ! je m'y en vais par ce chemin-ci, et toi par ce chemin-là ! et nous verrons à qui plus tôt y sera. "

Le loup se mit à courir de toute sa force par le chemin qui était le plus court, et la petite fille s'en alla par le chemin le plus long, s'amusant à cueillir des n"oisettes, à courir après les papillons, et à faire des bouquets des petites fleurs qu'elle rencontrait.

Le loup ne fut pas longtemps à arriver à la maison de la mère-grand ! il heurte: toc , toc. - " Qui est là ? - C'est votre fille, le petit chaperon rouge, dit le loup en contrefaisant sa voix, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie. " La bonne mère-grand, qui était dans son lit, car elle se trouvait un peu mal, lui cria : " Tire la chevillette, la bobinette cherra. " Le loup tira la chevillette, et la porte s'ouvrit. Il se jeta sur la bonne femme, et la dévora en moins de rien, car il y avait plus de trois jours qu'il n'avait mangé. ensuite il ferma la porte, et s'en alla coucher dans le lit de la mère-grand, en attendant le petit chaperon rouge, qui, quelque temps après, vint heurter à la porte : toc , toc : - " Qui est là ? " le petit chaperon rouge, qui entendit la grosse voix du loup, eut peur d'abord, mais, croyant que sa mère-grand était enrhumée, répondit: " C'est votre fille, le petit chaperon rouge, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie. " Le loup lui cria en adoucissant un peu sa voix : " Tire la chevillette, la bobinette cherra. " Le petit chaperon rouge tira la chevillette, et la porte s'ouvrit.

Le loup, la voyant entrer, lui dit en se cachant dans le lit, sous la couverture : " Mets la galette et le petit pot de beurre sur la huche, et viens te coucher avec moi. " Le petit chaperon rouge se déshabille, et va se mettre dans le lit, où elle fut bien étonnée de voir comment sa mère-grand était faite en son déshabillé. Elle lui dit : " ma mère-grand, que vous avez de grands bras ! - C'est pour mieux t'embrasser ma fille ! - Ma mère-grand, que vous avez de grandes jambes ! - C'est pour mieux courir mon enfant ! - Ma mère-grand, que vous avez de grandes oreilles ! - C'est pour mieux écouter mon enfant ! - Ma mère-grand, que vous avez de grands yeux ! - C'est pour mieux voir, mon enfant ! - Ma mère-grand, que vous avez de grandes dents ! - C'est pour te manger ! " et, en disant ces mots, ce méchant loup se jeta sur le petit chaperon rouge, et la mangea.

Moralité

On voit ici que de jeunes enfants
surtout de jeunes filles,
belles, bien faites et gentilles,
font très mal d'écouter toutes sortes de gens,
et que ce n'est pas chose étrange,
s'il en est tant que le loup mange.
Je dis le loup, car tous les loups
ne sont pas de la même sorte : 
il en est d'une humeur accorte,
sans bruit, sans fiel et sans courroux
qui privés, complaisants et doux,
suivent les jeunes demoiselles
jusque dans les maisons, jusque dans les ruelles.
Mais hélas ! qui ne sait que ces loups doucereux,
de tous les loups sont les plus dangereux !

 - Charles Perrault, contes
*/

if (typeof module !== 'undefined' && module.exports) {
    jsRealB=require("jsrealb")
    for (var v in jsRealB)
            eval(v+"=jsRealB."+v);
}


//  Réalisation du conte du Petit Chaperon Rouge
loadFr();
// ajouter les mots inconnus au dictionnaire français "de base"
addToLexicon("accort",{ A: { "tab":"n28" }})
addToLexicon("chevillette",{ N: { g: 'f', "tab":"n17" } })
addToLexicon("déshabillé",{ N: { g: 'm', "tab":"n3" } })
addToLexicon("étonné",{ A: { "tab":"n28" } })
addToLexicon("mère-grand",Object.assign({},getLemma("grand-mère")))

// Définitions globales

// [Le] petit chaperon rouge
function pcr(det){
    return NP(D(det),A("petit"),A("rouge"),N("chaperon"))
}
// [le] petit pot de beurre
function ppdb(det){
    return NP(D(det),A("petit"),N("pot"),PP(P("de"),N("beurre")))
}
function queVousAvez(n){
  return S(NP(D("mon").pe(1),N("mère-grand")).a(","),
              SP(Adv("que"),
              Pro("je").pe(2).n("p"),
              V("avoir"),
              NP(D("un"),A("grand"),N(n).n("p")))).cap().a("!").b("- ")
}

function cestPourMieux(v){
    return S(Pro("ce"),
             VP(V("être"),P("pour"),Adv("mieux"),
                v.a(","),
                NP(D("mon").pe(1),N("enfant")))).cap().a("!").b("- ")
}

/// le conte sous forme de liste d'objets dont la clé est le tag HTML et le contenu
/// est une liste de phrases à insérer dans le cet élément
const conte = [
    {h1:[()=>pcr("le").cap(true)]},
    //---------
    {p:[()=>S(
       // Il était une fois une petite fille de village, la plus jolie qu'on eût su voir: 
       SP(Pro("je"),
          VP(V("être").t("i"),
             NP(D("un"),N("fois")),
             NP(D("un"),A("petit"),N("fille"),
                PP(P("de"),N("village")))).a(","),
          AP(A("joli").g("f").f("su"),
          SP(Pro("que"),
             Pro("on"),
             VP(V("savoir").t("spq"),
                V("voir").t("b"))))).a(":"),
       // sa mère en était folle, et sa mère-grand plus folle encore. 
       CP(C("et"),
          SP(NP(D("mon"),N("mère"),Pro("en")),
             VP(V("être").t("i"),A("fou"))).a(","),
          NP(D("mon"),N("mère-grand"),A("fou").f("co"),Adv("encore")))),
      // Cette bonne femme lui fit faire un petit chaperon rouge qui lui seyait si bien,
      // que partout on l'appelait le petit chaperon rouge.
     ()=>S(NP(D("ce"),A("bon"),N("femme")),
          VP(Pro("me*coi"),
             V("faire").t("ps"),
             V("faire").t("b"),
              pcr("un").add(
                SP(Pro("qui"),
                   VP(Pro("me*coi"),
                      V("seoir").t("i"),
                      "si",
                      Adv("bien")))).a(","),
             SP(Pro("que"),
                Adv("partout"),
                Pro("on"),
                VP(Pro("le").g("f"),
                   V("appeler").t("i"),pcr("le")))))
        
        ]},
    //---------
    {p:[
        // Un jour, sa mère ayant cuit et fait des galettes, lui dit:
        ()=>S(SP(NP(D("un"),N("jour")).a(","),
                 NP(D("mon"),N("mère")),
                 CP(C("et"),
                    VP(V("avoir").t("pr"),V("cuire").t("pp")),
                    VP(V("faire").t("pp"),
                       NP(D("un"),N("galette").n("p"))))).a(','),
              VP(Pro("me*coi").g("m"),
                 V("dire").t("ps"))).a(":"),

        // "Va voir comment se porte la mère-grand, car on m'a dit qu'elle était malade. 
        ()=>S(CP(C("car"),
                SP(VP(V("aller").t("ip").pe(2),V("voir").t("b"),
                 VP(Adv("comment"),
                    Pro("me*refl"),V("porter"),
                    NP(D("le"),N("mère-grand"))))).a(","),
                SP(Pro("on"),Pro("me*refl").pe(1),
                   VP(V("dire").t("pc"),
                      SP(Pro("que"),Pro("je").g("f"),
                         V("être").t("i"),A("malade")))))).b('"'),

        // Porte-lui une galette et ce petit pot de beurre. "
        ()=>S(VP(V("porter").t("ip").pe(2).lier(),
                Pro("me*coi").g("f"),
                CP(C("et"),NP(D("un"),N("galette")),
                           ppdb("ce")) )).a("\""),

        // Le petit chaperon rouge partit aussitôt pour aller chez sa mère-grand, qui demeurait dans un autre village. 
        ()=>
            S(pcr("le"),
              VP(V("partir").t("ps"),
                 Adv("aussitôt"),
                 PP(P("pour"),
                    VP(V("aller").t("b"),
                       PP(P("chez"),
                          NP(D("mon"),N("mère-grand").a(","),
                             SP(Pro("qui"),
                                VP(V("demeurer").t("i"),
                                   PP(P("dans"),
                                      NP(D("un"),A("autre"),N("village")))))
                             )))))),
        
        // En passant dans un bois, elle rencontra compère le loup, qui eût bien envie de la manger! mais il n'osa, à cause de quelques bûcherons qui étaient dans la forêt. 
        ()=>S(VP(P("en"),V("passer").t("pr"),
                 PP(P("dans"),
                    NP(D("un"),N("bois")))).a(","),
              S(Pro("je").g("f"),
                VP(V("rencontrer").t("ps"),
                     NP(N("compère"),D("le"),N("loup")))).a(","),
              SP(Pro("qui"),
                 VP(V("avoir").t("ps"),
                    Adv("bien"),N("envie"),
                    P("de"),Pro("le").g("f"),V("manger").t("b"))).a("!"),
              S(C("mais"),Pro("je"),VP(V("oser").t("ps")).a(",")).typ({neg:""}),
              SP(P("à"),N("cause"),P("de"),
                 NP(D("quelque"),
                    N("bûcheron").n("p"),
                    SP(Pro("qui"),
                       V("être").t("i"),
                       PP(P("dans"),
                          NP(D("le"),N("forêt"))))))),
    
        // Il lui demanda où elle allait.
         ()=>S(Pro("je"),Pro("me*coi").g("f"),
               VP(V("demander").t("ps"),
                  SP(Pro("où"),
                     Pro("je").g("f"),
                         VP(V("aller").t("i"))))),

        // La pauvre enfant, qui ne savait pas qu'il était dangereux de s'arrêter à écouter un loup, lui dit : 
        ()=>S(NP(D("le"),A("pauvre").pos("pre"),N("enfant").g("f"),
                 SP(Pro("qui"),
                    VP(V("savoir").t("i"),
                       SP(Pro("que"),
                          Pro("je"),
                          VP(V("être"),
                             AP(A("dangereux"),
                                PP(P("de"),
                                   VP(Pro("me*refl"),
                                     V("arrêter").t("b"),
                                     PP(P("à"),
                                        VP(V("écouter").t("b"),
                                           NP(D("un"),N("loup"))).a(","))))))))).typ({neg:true})),
              VP(Pro("me*coi"),
                 V("dire"))
            ).a(":"),

        //" Je vais voir ma mère-grand, et lui porter une galette, avec un petit pot de beurre, que ma mère lui envoie.
        ()=> S(Pro("je").pe(1),
              VP(V("aller"),
                 CP(C("et"),
                    VP(V("voir").t("b"),
                       NP(D("mon").pe(1),N("mère-grand")).a(",")),
                    VP(Pro("me*coi"),V("porter").t("b"),
                       NP(D("un"),N("galette")).a(","),
                          PP(P("avec"),
                             ppdb("un").add(
                                   SP(Pro("que"),
                                      NP(D("mon").pe(1),N("mère")),
                                      VP(Pro("me*coi"),
                                         V("envoyer"))))))))
            ).en('"'),
         ]},
    //---------
    {br:[
        // - Demeure-t-elle bien loin ; lui dit le loup. 
        ()=> S(VP(V("demeurer").lier(),Q("t").lier(),Pro("je").g("f"),
                 Adv("bien"),Adv("loin")).a(";"),
              VP(Pro("me*coi"),
                 V("dire"),
                 NP(D("le"),N("loup")))).cap().b("- "),
        // - Oh ! oui, dit le petit chaperon rouge ! 
        // c'est par-delà le moulin que vous voyez tout là-bas, à la première maison du village. 
        ()=>S(SP(Q("Oh").a("!"),
                 VP(Adv("oui").a(","),
                    V("dire"),pcr("le"))).a("!").b("- "),
              SP(Pro("ce"),
                VP(V("être"),
                   PP(P("par-delà"),
                      NP(D("le"),N("moulin"),
                         SP(Pro("que"),
                            Pro("je").pe(2).n("p"),
                            V("voir"),
                            Adv("tout"),Adv("là-bas")).a(","),
                         PP(P("à"),
                            NP(D("le"),A("premier"),N("maison"),
                               PP(P("de"),NP(D("le"),N("village"))))))))
                )).a("."),

        // - Eh bien ! dit le loup, je veux l'aller voir aussi ! 
        // je m'y en vais par ce chemin-ci, et toi par ce chemin-là ! 
        // et nous verrons à qui plus tôt y sera. "
        ()=>
            S(
               S(S(Q("eh"),Adv("bien").a("!"),
                      V("dire"),NP(D("le"),N("loup")).a(","),
                      S(Pro("je").pe(1),
                        VP(V("vouloir"),
                           Pro("le").g("f"),
                           V("aller").t("b"),V("voir").t("b"),
                           Adv("aussi")))).cap().a("!").b("- "),
                 CP(C("et"),
                    S(Pro("je").pe(1),
                      Pro("me*refl").pe(1),Pro("y"),
                      Pro("en"),
                      VP(V("aller").pe(1),
                         PP(P("par"),
                            NP(D("ce"),N("chemin").lier(),Adv("ci"))))).a(","),
                    S(Pro("moi").pe(2),
                      PP(P("par"),
                            NP(D("ce"),N("chemin").lier(),Adv("là")))))).a("!"),
            S(C("et"),Pro("je").pe(1).n("p"),
              VP(V("voir").t("f"),
                   PP(P("à"),
                      Pro("qui"),
                      Adv("plus"),Adv("tôt"),Pro("y"),V("être").t("f")))).a(". \"")
            ),
    ]},
    
    //---------
    {p:[
        // Le loup se mit à courir de toute sa force par le chemin qui était le plus court, et la petite fille s'en alla par le chemin le plus long, s'amusant à cueillir des noisettes, à courir après les papillons, et à faire des bouquets des petites fleurs qu'elle rencontrait.
        ()=>
           CP(C("et"),
              SP(NP(D("le"),N("loup")),
                VP(Pro("me*refl"),
                   V("mettre").t("ps"),P("à"),V("courir").t("b")),
                   PP(P("de"),NP(A("tout").pos("pre"),D("mon"),N("force"))),
                   PP(P("par"),
                      NP(D("le"),N("chemin"),
                         SP(Pro("qui"),
                            VP(V("être").t("i"),
                               A("court").f("su"))))).a(",")).cap(),
              SP(NP(D("le"),A("petit"),N("fille")),
                Pro('me*refl'),Pro("en"),V("aller").t("ps"),
                PP(P("par"),NP(D("le"),N("chemin"),A("long").f("su")).a(","),
                   VP(Pro("me*refl"),V("amuser").t("pr"),
                      CP(C("et"),
                         VP(P("à"),V("cueillir").t("b"),NP(D("un"),N("noisette").n("p"))),
                         VP(P("à"),V("courir").t("b"),PP(P("après"),NP(D("le"),N("papillon").n("p")))),
                         VP(P("à"),V("faire").t("b"),NP(D("un"),N("bouquet").n("p"),
                                                 PP(P("de"),NP(D("le"),N("fleur").n("p")),
                                                               SP(Pro("que"),Pro("je").g("f"),V("rencontrer").t("i")))))
                        ))))).cap(),


        // Le loup ne fut pas longtemps à arriver à la maison de la mère-grand ! il heurte: toc , toc. 
        ()=>
            S(NP(D("le"),N("loup")),
              VP(V("être").t("ps"),Adv("longtemps"),P("à"),
                 VP(V("arriver").t("b"),
                    PP(P("à"),
                       NP(D("le"),N("maison"),
                          PP(P("de"),N("mère-grand")))))).a("!"),
              SP(Pro("je"),V("heurter").a(":"),Q("toc").a(","),"toc")
            ).typ({neg:true}),
    
        // - " Qui est là ? - C'est votre fille, le petit chaperon rouge, dit le loup en contrefaisant sa voix, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie. " 
        ()=>
            S(Pro("qui"),V("être"),Adv("là")).a("?").b('"'),

        ()=>
              S(Pro("ce"),V("être"),
                NP(D("notre").pe("2"),N("fille").a(","),
                   pcr("un").clone().a(","),
                   VP(V("dire"),
                      NP(D("le"),N("loup"))),
                      VP(P("en"),V("contrefaire").t("pr"),
                         NP(D("mon"),N("voix"))).a(","),
                   SP(Pro("qui"),
                      VP(Pro("je").pe(2).n("p"),
                         V("apporter"),
                         CP(C("et"),
                            NP(D("un"),N("galette")),
                            ppdb("un").a(",").add(
                               SP(Pro("que"),
                                  NP(D("mon").pe(1),N("mère")),
                                  VP(Pro("je").n("p").pe("2"),
                                     V("envoyer"))))))))
            ).b("- "),

        // La bonne mère-grand, qui était dans son lit, car elle se trouvait un peu mal, lui cria : 
        ()=>
            S(NP(D("le"),A("bon"),N("mère-grand"),
                 SP(Pro("qui"),
                    VP(V("être").t("i"),
                       PP(P("dans"),
                          NP(D("mon"),N("lit")))).a(","),
                       SP(C("car"),
                          Pro("je").g("f"),Pro("me*refl"),
                          VP(V("trouver").t("i"),
                             D("un"),Adv("peu"),A("mal"))).a(","))),
               Pro("me*coi"),V("crier").t("ps")
             ).a(":"),

        // " Tire la chevillette, la bobinette cherra. "
        ()=>
             S(VP(V("tirer").pe(2).t("ip"),
                  NP(D("le"),N("chevillette"))).a(","),
               NP(D("le"),N("bobinette")),V("choir").t("f")
              ).en('"'),

        // Le loup tira la chevillette, et la porte s'ouvrit. 
        ()=>
              CP(C("et"),
                 S(NP(D("le"),N("loup")),
                   VP(V("tirer").t("ps"),
                      NP(D("le"),N("chevillette")))).a(",").cap(),
                 S(NP(D("le"),N("porte")),
                   VP(Pro("me*refl"),V("ouvrir").t("ps"))).a(".")),

        // Il se jeta sur la bonne femme, et la dévora en moins de rien, car il y avait plus de trois jours qu'il n'avait mangé. ensuite il ferma la porte, et s'en alla coucher dans le lit de la mère-grand, en attendant le petit chaperon rouge, qui, quelque temps après, vint heurter à la porte : toc , toc : 
        ()=>
          S(CP(C("car"),
              S(Pro("je"),
                CP(C("et"),
                   VP(Pro("me*refl"),V("jeter").t("ps"),
                     PP(P("sur"),
                        NP(D("le"),A("bon"),N("femme")))).a(","),
                   VP(Pro("me").g("f"),V("dévorer").t("ps"),
                      PP(P("en"),Adv("moins"),P("de"),N("rien"))).a(","))),
               S(Pro("je"),Pro("y"),
                 VP(V("avoir").t("i"),Adv("plus"),
                    PP(P("de"),NP(NO(3).dOpt({nat:true}),N("jour")),
                       SP(Pro("que"),Pro("je"),   
                          VP(V("manger").t("pq")).typ({neg:""}))))).a(",")),
              S(Adv("ensuite"),
                Pro("je"),
                VP(V("fermer").t("ps"),
                   NP(D("le"),N("porte")))),
              S(C("et"),
                VP(Pro("me*refl"),V("aller").t("ps"),
                   V("coucher").t("b"),
                   PP(P("dans"),
                      NP(D("le"),N("lit"),
                         PP(P("de"),NP(D("le"),N("mère-grand"))))))).a(","),
              S(VP(P("en"),
                   V("attendre").t("pr"),pcr("un"),
                   SP(Pro("qui").a(","),
                      Adv("quelque"),N("temps"),P("après").a(","),
                      VP(V("heurter").t("ps"),
                         PP(P("à"),NP(D("le"),N("porte"))))))).a(":"),
              Q("toc").a(","),"toc"
          ).a(":"),

        // - " Qui est là ? " 
        ()=>
           S(Pro("qui"),V("être"),Adv("là")).a("?").b("- ").cap(),

        // le petit chaperon rouge, qui entendit la grosse voix du loup, eut peur d'abord, mais, croyant que sa mère-grand était enrhumée, répondit:
        ()=>
            S(pcr("un").clone().a(","),
              SP(Pro("qui"),
                 VP(V("entendre").t("ps"),
                    NP(D("le"),A("gros"),N("voix"),P("de"),NP(D("le"),N("loup"))))),
              VP(V("avoir").t("ps"),
                 N("peur"),Adv("d'abord")).a(","),
              SP(C("mais").a(","),
                   VP(V("croire").t("pr"),
                      SP(Pro("que"),
                         NP(D("mon"),N("mère-grand")),
                         VP(V("être").t("i"),
                            V("enrhumer").t("pp"))))).a(","),
              V("répondre").t("ps")
           ).a(":"),
 
        // " C'est votre fille, le petit chaperon rouge, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie."
        ()=>
            S(Pro("ce"),
              VP(V("être"),
                 NP(D("notre").pe(2),N("fille")).a(","),
                    pcr("un").clone().a(","),
                    SP(Pro("qui"),Pro("je").n("p").pe(2),
                       VP(V("apporter"),
                          CP(C("et"),
                             NP(D("un"),N("galette")),
                             ppdb("un").a(",").add(
                                SP(Pro("que"),
                                   NP(D("mon").pe(1),N("mère")),Pro("je").pe(2).n("p"),
                                   V("envoyer")))))))).en('"'),

        // Le loup lui cria en adoucissant un peu sa voix : " Tire la chevillette, la bobinette cherra. "
        ()=>
           S(NP(D("le"),N("loup")),Pro("me*coi"),
             VP(V("crier").t("ps"),
                P("en"),V("adoucir").t("pr"),D("un"),Adv("peu"),
                NP(D("mon"),N("voix")))).a(':'),

        // Le petit chaperon rouge tira la chevillette, et la porte s'ouvrit.
        ()=>
           CP(C("et"),
              S(pcr("un").clone().cap(),
                VP(V("tirer").t("ps"),NP(D("le"),N("chevillette"))).a(",")),
              S(NP(D("le"),N("porte"),
                   VP(Pro("me*refl"),V("ouvrir").t("ps")).a(".")))),
        
    ]},
    
    //---------
    {p:[
        // Le loup, la voyant entrer, lui dit en se cachant dans le lit, sous la couverture : 
        ()=>
           S(NP(D("le"),N("loup")).a(","),
             Pro("le").g("f"),V("voir").t("pr"),V("entrer").t("b").a(","),
             VP(Pro("me*coi"),V("dire"),
                VP(P("en"),Pro("me*refl"),V("cacher").t("pr"),
                   PP(P("dans"),NP(D("le"),N("lit"))).a(","),
                   PP(P("sous"),NP(D("le"),N("couverture")))))
           ).a(":"),

        // " Mets la galette et le petit pot de beurre sur la huche, et viens te coucher avec moi. " 
        ()=>
           S(CP(C("et"),
                VP(V("mettre").pe(2).t("ip"),
                   CP(C("et"),
                      NP(D("le"),N("galette")),
                      ppdb("le")),
                   PP(P("sur"),NP(D("le"),N("huche"))).a(",")),
                VP(V("venir").pe(2).t("ip"),
                   Pro("me*refl").pe(2),
                   V("coucher").t("b"),
                   PP(P("avec"),Pro("moi").pe(1))))
            ).en('"'),

        // Le petit chaperon rouge se déshabille, et va se mettre dans le lit, où elle fut bien étonnée de voir comment sa mère-grand était faite en son déshabillé.
        ()=>
            S(pcr("un"),
              CP(C("et"),
                 VP(Pro("me*refl"),V("déshabiller")),
                 VP(V("aller"),Pro("me*refl"),V("mettre").t("b"),
                    PP(P("dans"),
                       NP(D("le"),N("lit").a(","),
                          SP(Pro("où"),
                             Pro("je").g("f"),
                             VP(V("être").t("ps"),Adv("bien"),A("étonné"),
                                PP(P("de"),V("voir").t("b"),
                                   SP(Adv("comment"),
                                      NP(D("mon"),N("mère-grand")),
                                      VP(V("être").t("i"),A("fait"),
                                         PP(P("en"),NP(D("mon"),N("déshabillé")))))))))))
              )),
        ]},
    {br:[
        // Elle lui dit : " ma mère-grand, que vous avez de grands bras ! 
        ()=>
               S(Pro("je").pe(3).g("f"),
                 VP(Pro("me*coi"),V("dire"))).a(":"),
        ()=>
            queVousAvez("bras"),
        // - C'est pour mieux t'embrasser ma fille !
        ()=>
            cestPourMieux(VP(Pro("me").pe(2),V("embrasser").t("b"))),
        // - Ma mère-grand, que vous avez de grandes jambes ! 
        ()=>
            queVousAvez("jambe"),
        // - C'est pour mieux courir mon enfant ! 
        ()=>
            cestPourMieux(V("courir").t("b")),
        // - Ma mère-grand, que vous avez de grandes oreilles !
        ()=>
            queVousAvez("oreille"),
        // - C'est pour mieux écouter mon enfant ! 
        ()=>
            cestPourMieux(V("écouter").t("b")),
        // - Ma mère-grand, que vous avez de grands yeux ! 
        ()=>
            queVousAvez("oeil"),
        // - C'est pour mieux voir, mon enfant !
        ()=>
            cestPourMieux(V("voir").t("b")),
        // - Ma mère-grand, que vous avez de grandes dents ! 
        ()=>
            queVousAvez("dent"),
        // - C'est pour te manger ! " et, en disant ces mots, ce méchant loup se jeta sur le petit chaperon rouge, et la mangea.
        ()=>
            S(Pro("ce"),V("être"),P("pour"),Adv("mieux"),Pro("me").pe(2),V("manger").t("b")).a("!")
    ]}, 
    {p:[()=>S(C("et"),
             SP(P("en"),V("dire").t("pr"),NP(D("ce"),N("mot").n("p"))).a(","),
             CP(C("et"),
                S(NP(D("ce"),A("méchant").pos("pre"),N("loup")),
                  VP(Pro("me*refl"),V("jeter").t("ps"),
                     PP(P("sur"),pcr("un"))).a(",")),
                S(Pro("le").g("f"),
                  V("manger").t("ps")))
             ),
        
    ]},
    
    //---------
    {h1:[()=>N("moralité").tag("i").cap()]},
    
    //---------
    {br:[
        // On voit ici que de jeunes enfants
        ()=>
           SP(Pro("on"),
             VP(V("voir"),Adv("ici"),
                SP(Pro("que"),
                   NP(D("un"),A("jeune"),N("enfant").n("p"))))).cap(),
        // surtout de jeunes filles,
        ()=>
            AdvP(Adv("surtout"),
               NP(D("un"),A("jeune"),N("fille").n("p"))),
        // belles, bien faites et gentilles,
        ()=>
           SP(CP(C("et"),
                 A("beau"),
                 AP(Adv("bien"),A("fait")),
                 A("gentil")).g("f").n("p")).a(","),
        // font très mal d'écouter toutes sortes de gens,
        ()=>
            VP(V("faire").n("p"),
               Adv("très"),Adv("mal"),
               PP(P("de"),
                  VP(V("écouter").t("b"),
                     NP(A("tout").pos("pre"),N("sorte").n("p"),
                        P("de"),N("gens"))))).a(","),
        // et que ce n'est pas chose étrange,
        ()=>
            SP(C("et"),Pro("que"),Pro("ce"),
               VP(V("être"),NP(N("chose"),A("étrange")))).typ({neg:true}).a(","),
        // s'il en est tant que le loup mange.
        ()=>
            SP(C("si"),Pro("je"),P("en"),
               VP(V("être"),Adv("tant"),
                  SP(Pro("que"),
                     NP(D("le"),N("loup")),
                     V("manger")))).a("."),
        // Je dis le loup, car tous les loups
        ()=>
            SP(Pro("je").pe(1),
               VP(V("dire"),
                  NP(D("le"),N("loup"))).a(","),
               SP(C("car"),
                  NP(A("tout").pos("pre"),D("le"),N("loup").n("p")))
            ).cap(),
        // ne sont pas de la même sorte :
        ()=>
            VP(V("être").n("p"),
               PP(P("de"),
                  NP(D("le"),Adv("même"),N("sorte")))).typ({neg:true}).a(":"),
        // il en est d'une humeur accorte,
        ()=>
            SP(Pro("je"),Pro("en"),
               VP(V("être"),
                  PP(P("de"),
                     NP(D("un"),N("humeur"),A("accort"))))).a(","),
        // sans bruit, sans fiel et sans courroux
        ()=>
            CP(C("et"),
               PP(P("sans"),N("bruit")),
               PP(P("sans"),N("fiel")),
               PP(P("sans"),N("courroux"))
               ),
        // qui privés, complaisants et doux,
        ()=>
            SP(Pro("qui"),
               CP(C("et"),
                  A("privé"),A("complaisant"),A("doux")).n("p")).a(","),
        // suivent les jeunes demoiselles
        ()=>
            VP(V("suivre").n("p"),
               NP(D("le"),A("jeune"),N("demoiselle").n("p"))),
        // jusque dans les maisons, jusque dans les ruelles.
        ()=>
            SP(PP(P("jusque"),P("dans"),NP(D("le"),N("maison").n("p"))).a(","),
               PP(P("jusque"),P("dans"),NP(D("le"),N("ruelle").n("p"))).a(".")),
        // Mais hélas ! qui ne sait que ces loups doucereux,
        ()=>
            SP(C("mais"),Q("hélas").a("!"),
               Pro("qui"),Adv("ne"),V("savoir"),
               SP(Pro("que"),NP(D("ce"),N("loup").n("p"),A("doucereux")))).a(","),
        // de tous les loups sont les plus dangereux !
        ()=>
            SP(P("de"),
               NP(A("tout").pos("pre"),D("le"),N("loup").n("p")),
               VP(V("être"),A("dangereux").f("su"))).a("!"),
    ]},
    
    //---------
    {p:[
        //  - Charles Perrault, contes
        ()=>
             SP(Q("Charles"),Q("Perrault").a(","),N("conte").n("p")).tag("i").b("- ")
    ]},
    
]


function generateHTML(texte){
    loadFr();
    const annotation = $("input[name='annotation']:checked").val();
    $(".histoire").empty()
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
        $(".histoire").append(para)
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
            out=""
        }
    }
    
}

if (typeof module !== 'undefined' && module.exports) {
    generateTXT(conte)
} else {
    $(document).ready(function() {
        $("#dependances,#constituents").change(()=>generateHTML(conte))
        generateHTML(conte)
    })
}

