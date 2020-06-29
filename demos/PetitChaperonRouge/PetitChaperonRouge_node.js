//////// 
//  load JSrealB
var fs = require('fs');
var jsrealb=require('../../dist/jsRealB-node.js');
// eval exports 
for (var v in jsrealb){
    eval("var "+v+"=jsrealb."+v);
}

loadFr();
// ajouter les mots inconnus au dictionnaire français "de base"
addToLexicon("accort",{ A: { tab: [ 'n28' ] }})
addToLexicon("bobinette",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("chaperon",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("chevillette",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("choir",{ V: { aux: [ 'av' ], tab: 'v83' } })
addToLexicon("ci",{ Adv: { tab: [ 'av' ] } })
addToLexicon("comment",{ Adv: { tab: [ 'av' ] }})
addToLexicon("compère",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("complaisant",{ A: { tab: [ 'n28' ] } })
addToLexicon("contrefaire",{ V: { aux: [ 'av' ], tab: 'v124' } })
addToLexicon("courroux",{ N: { g: 'm', tab: [ 'n2' ] } })
addToLexicon("déshabillé",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("doucereux",{ A: { tab: [ 'n54' ] }, N: { g: 'm', tab: [ 'n54' ] } })
addToLexicon("enrhumer",{ V: { aux: [ 'av' ], tab: 'v36' } })
addToLexicon("étonné",{ A: { tab: [ 'n28' ] } })
addToLexicon("fait",{ A: { tab: [ 'n28' ] }, N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("fiel",{ N: { g: 'm', tab: [ 'n3' ] } })
addToLexicon("galette",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("huche",{ N: { g: 'f', h: 1, tab: [ 'n17' ] } })
addToLexicon("là",{ Adv: { tab: [ 'av' ] } })
addToLexicon("mal",{ A: { tab: [ 'n66' ] }})
addToLexicon("mère-grand",getLemma("grand-mère"))
addToLexicon("moralité",{ N: { g: 'f', tab: [ 'n17' ] } })
addToLexicon("par-delà",{ P: { tab: [ 'pp' ] } })
addToLexicon("privé",{ A: { tab: [ 'n28' ] } })
addToLexicon("que",{Adv: { tab: [ 'av' ] }})
addToLexicon("quelque",{ Adv: { tab: [ 'av' ] }, D: { tab: [ 'n25' ] } })
addToLexicon("seoir",{ V: { aux: [ 'av' ], tab: 'v78' } })

// updateLexicon(require("/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-dmf.json"))

// Le petit chaperon rouge
var pcr =  NP(A("petit"),A("rouge"),N("chaperon"))
var lpcr = NP(D("le"),pcr)

var ppdb = function(det){
    return NP(D(det),A("petit"),N("pot"),PP(P("de"),N("beurre")))
}
// function fmt(s){
//     var mots=s.split(" ");
//     var ligne="";
//     for (var i = 0; i < mots.length; i++) {
//         ligne+=mots[i]+" ";
//         if (ligne.length>80){
//             console.log(ligne);
//             ligne=""
//         }
//     }
//     if (ligne.length>0)
//         console.log(ligne)
// }
function fmt(s){
    console.log(s)
}

fmt(lpcr.clone().cap()+"\n")

// Il était une fois une petite fille de village, la plus jolie qu'on eût su voir: 
var p1=SP(Pro("je"),
  VP(V("être").t("i"),
     NP(D("un"),N("fois")),
     NP(D("un"),A("petit"),N("fille"),
        PP(P("de"),N("village")))).a(","),
  AP(A("joli").g("f").f("su"),
  SP(Pro("que"),
     Pro("on"),
     VP(V("savoir").t("spq"),
        V("voir").t("b"))))).a(":").cap()
// sa mère en était folle, et sa mère-grand plus folle encore. 
var p2=SP(
     NP(D("mon"),N("mère"),Pro("en")),
     VP(V("être").t("i"),A("fou")).a(","),
     C("et"),
     NP(D("mon"),N("mère-grand"),A("fou").f("co"),Adv("encore")).a(".")
)

// Cette bonne femme lui fit faire un petit chaperon rouge qui lui seyait si bien,
// que partout on l'appelait le petit chaperon rouge.
var p3=S(NP(D("ce"),A("bon"),N("femme"),
  VP(Pro("me*coi"),
     V("faire").t("ps"),
     V("faire").t("b")),
     NP(D("un"),pcr),
        SP(Pro("qui"),
           VP(Pro("me*coi"),
              V("seoir").t("i"),
              "si",
              Adv("bien")))).a(","),
     SP(Pro("que"),
        Adv("partout"),
        Pro("on"),
        VP(Pro("le").g("f"),
           V("appeler").t("i"),lpcr))) 

fmt(""+p1+" "+p2+" "+p3)

// Un jour, sa mère ayant cuit et fait des galettes, lui dit:
var p4=
    S(SP(NP(D("un"),N("jour")).a(","),
         NP(D("mon"),N("mère")),
         CP(C("et"),
            VP(V("avoir").t("pr"),V("cuire").t("pp")),
            VP(V("faire").t("pp"),
               NP(D("un"),N("galette").n("p"))))).a(','),
      VP(Pro("me*coi").g("m"),
         V("dire").t("ps"))).a(":");

// "Va voir comment se porte la mère-grand, car on m'a dit qu'elle était malade. 
// Porte-lui une galette et ce petit pot de beurre. "
var p5=
    S(S(VP(V("aller").t("ip").pe(2),V("voir").t("b"),
         VP(Adv("comment"),
            Pro("me*refl"),V("porter"),
            NP(D("le"),N("mère-grand"))))).cap().a(","),
      S(C("car"),
         Pro("on"),Pro("me*refl").pe(1),V("dire").t("pc"),
         SP(Pro("que"),Pro("je").g("f"),V("être").t("i"),A("malade"))).a("."),
      S(VP(V("porter").t("ip").pe(2).lier(),
        Pro("me*coi").g("f"),
        CP(C("et"),NP(D("un"),N("galette")),
                   ppdb("ce")) )).cap()
     ).en("\"")

//   Le petit chaperon rouge partit aussitôt pour aller chez sa mère-grand, qui demeurait dans un autre village. 
var p6 =
    S(lpcr,
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
                     ))))))

// En passant dans un bois, elle rencontra compère le loup, qui eût bien envie de la manger! mais il n'osa, à cause de quelques bûcherons qui étaient dans la forêt. 
var p7 =
    S(VP(P("en"),V("passer").t("pr"),
         PP(P("dans"),
            NP(D("un"),N("bois")))).a(","),
      S(Pro("je").g("f"),
        VP(V("rencontrer").t("ps"),
             NP(N("compère"),D("le"),N("loup")))).a(","),
      SP(Pro("qui"),
         VP(V("avoir").t("ps"),
            Adv("bien"),N("envie"),
            P("de"),Pro("le").g("f"),V("manger").t("b"))).a("!"),
      S(C("mais"),Pro("je"),VP(V("oser")).a(",").t("ps")).typ({neg:""}),
      SP(P("à"),N("cause"),P("de"),
         NP(D("quelque"),
            N("bûcheron").n("p"),
            SP(Pro("qui"),
               V("être").t("i"),
               PP(P("dans"),
                  NP(D("le"),N("forêt"))))))
     )

// Il lui demanda où elle allait.=
var fille=NP(D("le"),N("fille"))
var p8 =
     S(Pro("je"),Pro("me*coi").g("f"),
       VP(V("demander").t("ps"),
          SP(Pro("où"),
             Pro("je").g("f"),
                 VP(V("aller").t("i")))));
                 
// La pauvre enfant, qui ne savait pas qu'il était dangereux de s'arrêter à écouter un loup, lui dit : 
var p9=
    S(NP(D("le"),A("pauvre").pos("pre"),N("enfant").g("f"),
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
    ).a(":")

//" Je vais voir ma mère-grand, et lui porter une galette, avec un petit pot de beurre, que ma mère lui envoie.
var p10 =                 
    S(Pro("je").pe(1),
      VP(V("aller"),
         CP(C("et"),
            VP(V("voir").t("b"),
               NP(D("mon").pe(1),N("mère-grand")).a(",")),
            VP(Pro("me*coi"),V("porter").t("b"),
               NP(D("un"),N("galette")).a(","),
                  PP(P("avec"),
                     NP(ppdb("un"),
                           SP(Pro("que"),
                              NP(D("mon").pe(1),N("mère")),
                              VP(Pro("me*coi"),
                                 V("envoyer"))))))))
    ).b('"')
fmt("\n"+p4+p5+p6+" "+p7+" "+p8+" "+p9+" "+p10)

// - Demeure-t-elle bien loin ; lui dit le loup. 
var p11 = 
    S(VP(V("demeurer").lier(),Q("t").lier(),Pro("je").g("f"),
         Adv("bien"),Adv("loin")).a(";"),
      VP(Pro("me*coi"),
         V("dire"),
         NP(D("le"),N("loup")))).cap().b("- ")
fmt(""+p11)

// - Oh ! oui, dit le petit chaperon rouge ! 
var p12 =
    S(Q("Oh").a("!"),
      VP(Adv("oui").a(","),
         V("dire"),lpcr)).a("!").b("- ")
// c'est par-delà le moulin que vous voyez tout là-bas, à la première maison du village. 
var p13 = 
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
      ).a(".")
fmt(""+p12+p13)

// - Eh bien ! dit le loup, je veux l'aller voir aussi ! 
var p14 =
     S(Q("eh"),Adv("bien").a("!"),
       V("dire"),NP(D("le"),N("loup")).a(","),
       S(Pro("je").pe(1),
         VP(V("vouloir"),
            Pro("le").g("f"),
            V("aller").t("b"),V("voir").t("b"),
            Adv("aussi")))).cap().a("!").b("- ")

// je m'y en vais par ce chemin-ci, et toi par ce chemin-là ! 
var p15 =
     S(CP(C("et"),
        S(Pro("je").pe(1),
          Pro("me*refl").pe(1),Pro("y"),
          Pro("en"),
          VP(V("aller").pe(1),
             PP(P("par"),
                NP(D("ce"),N("chemin").lier(),Adv("ci"))))).a(","),
        S(Pro("moi").pe(2),
          PP(P("par"),
                NP(D("ce"),N("chemin").lier(),Adv("là")))))).a("!")
        
// et nous verrons à qui plus tôt y sera. "

var p16 =
      SP(C("et"),
        Pro("je").pe(1).n("p"),
        VP(V("voir").t("f"),
           PP(P("à"),
              Pro("qui"),
              Adv("plus"),Adv("tôt"),Pro("y"),V("être").t("f")))).a(". \"")

fmt(""+p14+p15+p16+"\n")
      
// Le loup se mit à courir de toute sa force par le chemin qui était le plus court, et la petite fille s'en alla par le chemin le plus long, s'amusant à cueillir des noisettes, à courir après les papillons, et à faire des bouquets des petites fleurs qu'elle rencontrait.
var p17 =
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
                ))))).cap()

fmt(p17+"\n")

// Le loup ne fut pas longtemps à arriver à la maison de la mère-grand ! il heurte: toc , toc. 
var p18 =
    S(NP(D("le"),N("loup")),
      VP(V("être").t("ps"),Adv("longtemps"),P("à"),
         VP(V("arriver").t("b"),
            PP(P("à"),
               NP(D("le"),N("maison"),
                  PP(P("de"),N("mère-grand")))))).a("!"),
      SP(Pro("je"),V("heurter").a(":"),Q("toc").a(","),"toc")
    ).typ({neg:true})
    
// - " Qui est là ? - C'est votre fille, le petit chaperon rouge, dit le loup en contrefaisant sa voix, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie. " 
var p19 =
    S(Pro("qui"),V("être"),Adv("là")).a("?").b('"')

var p20 =
      S(Pro("ce"),V("être"),
        NP(D("notre").pe("2"),N("fille").a(","),
           lpcr.clone().a(","),
           VP(V("dire"),
              NP(D("le"),N("loup"))),
              VP(P("en"),V("contrefaire").t("pr"),
                 NP(D("mon"),N("voix"))).a(","),
           SP(Pro("qui"),
              VP(Pro("je").pe(2).n("p"),
                 V("apporter"),
                 CP(C("et"),
                    NP(D("un"),N("galette")),
                       NP(ppdb("un").clone().a(","),
                       SP(Pro("que"),
                          NP(D("mon").pe(1),N("mère")),
                          VP(Pro("je").n("p").pe("2"),
                             V("envoyer"))))))))
    ).b("- ")

// La bonne mère-grand, qui était dans son lit, car elle se trouvait un peu mal, lui cria : 
var p21 =
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
     ).a(":")

// " Tire la chevillette, la bobinette cherra. "
var p22 =
     S(VP(V("tirer").pe(2).t("ip"),
          NP(D("le"),N("chevillette"))).a(","),
       NP(D("le"),N("bobinette")),V("choir").t("f")
      ).en('"')

// Le loup tira la chevillette, et la porte s'ouvrit. 
var p23 =
      CP(C("et"),
         S(NP(D("le"),N("loup")),
           VP(V("tirer").t("ps"),
              NP(D("le"),N("chevillette")))).a(",").cap(),
         S(NP(D("le"),N("porte")),
           VP(Pro("me*refl"),V("ouvrir").t("ps"))).a("."))

// Il se jeta sur la bonne femme, et la dévora en moins de rien, car il y avait plus de trois jours qu'il n'avait mangé. ensuite il ferma la porte, et s'en alla coucher dans le lit de la mère-grand, en attendant le petit chaperon rouge, qui, quelque temps après, vint heurter à la porte : toc , toc : 
var p24 =
  S(CP(C("car"),
      S(Pro("je"),
        CP(C("et"),
           VP(Pro("me*refl"),V("jeter").t("ps"),
             PP(P("sur"),
                NP(D("le"),A("bon"),N("femme")))).a(","),
           VP(Pro("me").g("f"),V("dévorer").t("ps"),
              PP(P("en"),Adv("moins"),P("de"),Adv("rien"))).a(","))),
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
           V("attendre").t("pr"),lpcr,
           SP(Pro("qui").a(","),
              Adv("quelque"),N("temps"),P("après").a(","),
              VP(V("heurter").t("ps"),
                 PP(P("à"),NP(D("le"),N("porte"))))))).a(":"),
      Q("toc").a(","),"toc"
  ).a(":")

// - " Qui est là ? " 
var p25 = 
   S(Pro("qui"),V("être"),Adv("là")).a("?").b("- ").cap()

// le petit chaperon rouge, qui entendit la grosse voix du loup, eut peur d'abord, mais, croyant que sa mère-grand était enrhumée, répondit:
var p26 =
    S(lpcr.clone().a(","),
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
   ).a(":")
 
// " C'est votre fille, le petit chaperon rouge, qui vous apporte une galette et un petit pot de beurre, que ma mère vous envoie."
var p27 =
    S(Pro("ce"),
      VP(V("être"),
         NP(D("notre").pe(2),N("fille")).a(","),
            lpcr.clone().a(","),
            SP(Pro("qui"),Pro("je").n("p").pe(2),
               VP(V("apporter"),
                  CP(C("et"),
                     NP(D("un"),N("galette")),
                     NP(ppdb("un").clone().a(","),
                        SP(Pro("que"),
                           NP(D("mon").pe(1),N("mère")),Pro("je").pe(2).n("p"),
                           V("envoyer")))))))).en('"')

// Le loup lui cria en adoucissant un peu sa voix : " Tire la chevillette, la bobinette cherra. "
var p28 =
   S(NP(D("le"),N("loup")),Pro("me*coi"),
     VP(V("crier").t("ps"),
        P("en"),V("adoucir").t("pr"),Adv("un peu"),
        NP(D("mon"),N("voix")))).a(':')

// Le petit chaperon rouge tira la chevillette, et la porte s'ouvrit.
var p29 =
   CP(C("et"),
      S(lpcr.clone().cap(),
        VP(V("tirer").t("ps"),NP(D("le"),N("chevillette"))).a(",")),
      S(NP(D("le"),N("porte"),
           VP(Pro("me*refl"),V("ouvrir").t("ps")).a("."))))

fmt(""+p18+" "+p19+" "+p20+p21+p22+p23+p24+p25+p26+p27+p28+p29+"\n");

// Le loup, la voyant entrer, lui dit en se cachant dans le lit, sous la couverture : 
var p30 =
   S(NP(D("le"),N("loup")).a(","),
     Pro("le").g("f"),V("voir").t("pr"),V("entrer").t("b").a(","),
     VP(Pro("me*coi"),V("dire"),
        VP(P("en"),Pro("me*refl"),V("cacher").t("pr"),
           PP(P("dans"),NP(D("le"),N("lit"))).a(","),
           PP(P("sous"),NP(D("le"),N("couverture")))))
   ).a(":")

// " Mets la galette et le petit pot de beurre sur la huche, et viens te coucher avec moi. " 
var p31 =
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
    ).en('"')

// Le petit chaperon rouge se déshabille, et va se mettre dans le lit, où elle fut bien étonnée de voir comment sa mère-grand était faite en son déshabillé.
var p32 =
    S(lpcr,
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
      ))

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
                v.t("b").a(","),
                NP(D("mon").pe(1),N("enfant")))).cap().a("!").b("- ")
}

// Elle lui dit : " ma mère-grand, que vous avez de grands bras ! 
var p33=
       S(Pro("je").pe(3).g("f"),
         Pro("me*coi"),V("dire")).a(":")
var p33a =
    queVousAvez("bras")
// - C'est pour mieux t'embrasser ma fille !
var p34=
    cestPourMieux(VP(Pro("me").pe(2),V("embrasser")))
// - Ma mère-grand, que vous avez de grandes jambes ! 
var p35=
    queVousAvez("jambe")
// - C'est pour mieux courir mon enfant ! 
var p36 =
    cestPourMieux(V("courir"))
// - Ma mère-grand, que vous avez de grandes oreilles !
var p37 =
    queVousAvez("oreille")
// - C'est pour mieux écouter mon enfant ! 
var p38 =
    cestPourMieux(V("écouter"))
// - Ma mère-grand, que vous avez de grands yeux ! 
var p39 =
    queVousAvez("oeil")
// - C'est pour mieux voir, mon enfant !
var p40 =
    cestPourMieux(V("voir"))
// - Ma mère-grand, que vous avez de grandes dents ! 
var p41 =
    queVousAvez("dent")
// - C'est pour te manger ! " et, en disant ces mots, ce méchant loup se jeta sur le petit chaperon rouge, et la mangea.
var p42 =
    S(S(Pro("ce"),V("être"),P("pour"),Adv("mieux"),Pro("me").pe(2),V("manger").t("b")).a("!"),
     C("et"),
     SP(P("en"),V("dire").t("pr"),NP(D("ce"),N("mot").n("p"))).a(","),
     CP(C("et"),
        S(NP(D("ce"),A("méchant").pos("pre"),N("loup")),
          VP(Pro("me*refl"),V("jeter").t("ps"),
             PP(P("sur"),lpcr)).a(",")),
        S(Pro("le").g("f"),
          V("manger").t("ps")))
     ).b("- ")

fmt(""+p30+" "+p31+" "+p32+" "+p33);
[p33a,p34,p35,p36,p37,p38,p39,p40,p41,p42].forEach(x=>fmt(""+x))

// Moralité
var m0 =
    N("moralité").cap()

// On voit ici que de jeunes enfants
var m1 =
   SP(Pro("on"),
     VP(V("voir"),Adv("ici"),
        SP(Pro("que"),
           NP(D("un"),A("jeune"),N("enfant").n("p"))))).cap()
// surtout de jeunes filles,
var m2 =
    NP(Adv("surtout"),
       NP(D("un"),A("jeune"),N("fille").n("p")))
// belles, bien faites et gentilles,
var m3 =
   SP(CP(C("et"),
         A("beau"),
         AP(Adv("bien"),A("fait")),
         A("gentil")).g("f").n("p")).a(",")
// font très mal d'écouter toutes sortes de gens,
var m4 =
    VP(V("faire").n("p"),
       Adv("très"),Adv("mal"),
       PP(P("de"),
          VP(V("écouter").t("b"),
             NP(A("tout").pos("pre"),N("sorte").n("p"),
                P("de"),N("gens"))))).a(",")
// et que ce n'est pas chose étrange,
var m5 =
    SP(C("et"),Pro("que"),Pro("ce"),
       VP(V("être"),NP(N("chose"),A("étrange")))).typ({neg:true}).a(",")
// s'il en est tant que le loup mange.
var m6 = 
    SP(C("si"),Pro("je"),P("en"),
       VP(V("être"),Adv("tant"),
          SP(Pro("que"),
             NP(D("le"),N("loup")),
             V("manger")))).a(".")
// Je dis le loup, car tous les loups
var m7 =
    SP(Pro("je").pe(1),
       VP(V("dire"),
          NP(D("le"),N("loup"))).a(","),
       SP(C("car"),
          NP(A("tout").pos("pre"),D("le"),N("loup").n("p")))
    ).cap()
// ne sont pas de la même sorte :
var m8 =
    VP(V("être").n("p"),
       PP(P("de"),
          NP(D("le"),Adv("même"),N("sorte")))).typ({neg:true}).a(":")
// il en est d'une humeur accorte,
var m9 =
    SP(Pro("je"),Pro("en"),
       VP(V("être"),
          PP(P("de"),
             NP(D("un"),N("humeur"),A("accort"))))).a(",")
// sans bruit, sans fiel et sans courroux
var m10 =
    CP(C("et"),
       PP(P("sans"),N("bruit")),
       PP(P("sans"),N("fiel")),
       PP(P("sans"),N("courroux"))
       )
// qui privés, complaisants et doux,
var m11 =
    SP(Pro("qui"),
       CP(C("et"),
          A("privé"),A("complaisant"),A("doux")).n("p")).a(",")
// suivent les jeunes demoiselles
var m12 =
    VP(V("suivre").n("p"),
       NP(D("le"),A("jeune"),N("demoiselle").n("p")))
// jusque dans les maisons, jusque dans les ruelles.
var m13 =
    SP(PP(P("jusque"),P("dans"),NP(D("le"),N("maison").n("p"))).a(","),
       PP(P("jusque"),P("dans"),NP(D("le"),N("ruelle").n("p"))).a("."))
// Mais hélas ! qui ne sait que ces loups doucereux,
var m14 =
    SP(C("mais"),Q("hélas").a("!"),
       Pro("qui"),Adv("ne"),V("savoir"),
       SP(Pro("que"),NP(D("ce"),N("loup").n("p"),A("doucereux")))).a(",")
// de tous les loups sont les plus dangereux !
var m15 = 
    SP(P("de"),
       NP(A("tout").pos("pre"),D("le"),N("loup").n("p")),
       VP(V("être"),A("dangereux").f("su"))).a("!")
//
//  - Charles Perrault, contes
var m16 =
    SP("Charles",Q("Perrault").a(","),N("conte").n("p")).b("- ");

fmt("\n"+m0+"\n");
[m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14,m15].forEach(x=>fmt(x+""));
fmt("\n"+m16);

/*  Original...
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