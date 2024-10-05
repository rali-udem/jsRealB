
import { N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP, oneOf, loadFr } from "../../src/jsRealB.js"

export {keywordsFr, elizaFinals, elizaQuits, elizaInitials}
loadFr()

// pour decomp seulement... doit matcher la sortie de lemmatize
const star = Q("*")
const je_decomp  = Pro("je").pe(1)
const me_decomp  = Pro("me").pe(1)
const mon_decomp = D("mon").pe(1).g("x")
const tu_decomp  = Pro("je").pe(2).n("x")
const family = [N("mère"),N("maman"),N("père"),N("papa"),N("frère"),N("soeur"),N("époux").g("x"),N("enfant").n("x")]
// pronoms paramétrables avec "maje"
const moi = () => Pro("moi").pe(1).c("nom").maje(false)
const moi_ton = () => Pro("moi").pe(1).tn("").maje(false)
const moi_cod = () => moi().c("acc")
const moi_coi = () => moi().c("dat")

const vous = (g) => Pro("moi").pe(2).g(g).c("nom")
const vous_ton = (g) => Pro("moi").pe(2).g(g).tn("")
const vous_cod = (g) => vous(g).c("acc")
const vous_coi = (g) => vous(g).c("dat")

const votre = () => D("mon").pe(2)
const mon   = () => D("mon").pe(1).maje(false)
// abréviations pratiques
const svp        = () => AdvP(Adv("si"),Pro("lui").c("nom"),VP(Pro("moi").pe(2).c("dat"),V("plaire")))
// const questceque = (...x)=>S(Pro("que"),VP(V("être").lier(),Pro("ce"),Pro("que"),x)).a("?")
const estceque   = (...x)=>S(VP(V("être").lier(),Pro("ce"),Pro("que"),x)).a("?")

/*  à placer dans la page web de la démo d'évaluation de jsRealB
let m = ["(0)","(1)","(2)"]
let f = (m,g) =>S(vous(g),VP(V("penser"),Pro("cela"),
                    PP(P("de"),NP(D("le"),N("machine").n("p"))))).typ({"int":"wad"})

S(f(m,"m"),Q("##"),f(m,"f").typ({maje:true}).cap(true))
*/
// même organisation que elizadata.js de https://www.masswerk.at/elizabot/"
// mais avec des objets et de noms de propriété

let elizaInitials = [
    // "How do you do.  Please tell me your problem.",
    // comment allez-vous ?  Expliquez-moi votre problème.
    (m,g)=>S(SP(vous(g),
                VP(V("aller"))).typ({"int":"how"}),
             SP(VP(V("expliquer").t("ip").pe(2).lier(),moi_ton(),
                NP(votre(),N("problème"))).cap(true))),
    // "Please tell me what's been bothering you.",
    // Dites-moi ce qui vous tracasse.
    (m,g)=>S(VP(V("dire").t("ip").pe(2).lier(),
                moi_ton(),
                Pro("ce"),
                SP(Pro("qui"),VP(V("tracasser"),vous_cod(g))))),
    // "Is something troubling you ?"
    // Quelque chose vous préoccupe ?
    (m,g) => S(NP(D("quelque"),N("chose"),
               VP(V("préoccuper"),vous_cod(g)))).typ({"int":"yon"})
]

const au_revoir = ()=>SP(P("à"),NP(D("le"),V("revoir").t("b"))).a(".");

let elizaFinals = [
    // "Goodbye.  It was nice talking to you.",
    // « Au revoir.  Ce fut un plaisir de vous parler »,
    (m,g) => S(au_revoir(),
               SP(Pro("ce"),
                  VP(V("être").t("ps"),
                     NP(D("un"),N("plaisir"),
                        PP(P("de"),VP(V("parler").t("b"),vous_coi(g)))))).cap(true)),
    // "Goodbye.  This was really a nice talk.",
    // « Au revoir.  C'était vraiment une belle discussion »,
    (m,g) => S(au_revoir(),
               SP(Pro("ce"),
                  VP(V("être").t("i"),Adv("vraiment"),
                     NP(D("un"),N("discussion"),A("beau")))).cap(true)),
    // "Goodbye.  I'm looking forward to our next session.",
    // « Au revoir.  J'attends avec impatience notre prochaine session »,
    (m,g) => S(au_revoir(),
               SP(moi(),
                  VP(V("attendre"),
                     PP(P("avec"),N("impatience")),
                     NP(D("notre").pe(1),A("prochain").pos("pre"),N("discussion")))).cap(true)),
    // "This was a good session, wasn't it -- but time is over now.   Goodbye.",
    // C'était une bonne session, n'est-ce pas, mais le temps est écoulé.   Au revoir »,
    (m,g) => S(SP(Pro("ce"),
                  VP(V("être").t("i"),
                     NP(D("un"),A("bon"),N("session")))).typ({"int":"tag"}),
               SP(C("mais"),
                  NP(D("le"),N("temps")),
                     VP(V("être"),V("écouler").t("pp"))).a("."),
               au_revoir().cap(true)),
    // "Maybe we could discuss this moreover in our next session ?   Goodbye."
    // Peut-être pourrions-nous en discuter davantage lors de notre prochaine session ?   Au revoir. »
    (m,g) => S(Adv('peut-être'),
               SP(Pro("nous").c("nom"),
                  VP(V("discuter"),Adv("davantage"),
                     Adv("lors"),P("de"),NP(D("notre").pe(1),A("prochain"),N("session")))).typ({"mod":"poss","int":"yon"}),
               au_revoir().cap(true))
]

let elizaQuits = [
    "bye","fin","quitter","salut"
]

let keywordsFr =
[{"key":Q("xnone"), "key_en":"xnone", "rank":0, "pats":[  // xnone: on ne devrait arriver ici qu'en désespoir de cause...    
 {"decomp":[star], // *
  "reasmb":[
    // en: I'm not sure I understand you fully.
    // fr: Je ne suis pas sûr de bien vous comprendre 
    (m,g) => S(moi(),
              VP(V("être"),A("sûr"),
                 PP(P("de"),Adv("bien"),vous_cod(g),V("comprendre").t("b")))).typ({"neg":true}),
    // en: Please go on.
    // fr: Continuez, s'il vous plaît
    (m,g) => S(V("continuer").t("ip").pe(2),svp()),
    // en: What does that suggest to you ?
    // fr: Qu'est-ce que cela vous suggère ?
    (m,g) => S(Pro("cela"),
               VP(V("suggérer"),Pro("ceci"),vous_coi(g))).typ({"int":"wad"}),
    // en: Do you feel strongly about discussing such things ?
    // fr:  Avez-vous envie de discuter de ce genre de choses ? 
    (m,g) => S(vous(g),
               VP(V("avoir"),
                  NP(N("envie"),
                  PP(P("de"),
                     VP(V("discuter").t("b"),
                        PP(P("de"),
                           NP(D("ce"),N("genre"),P("de"),N("chose").n("p")))))))).typ({"int":"yon"}),
    // en: That is interesting.  Please continue.
    // fr: C'est intéressant.  Continuez, s'il vous plaît 
    (m,g) => S(Pro("ce"),VP(V("être"),A("intéressant")).a("."),
              SP(V("continuer").t("ip").pe(2),svp()).cap(true)),
    // en: Tell me more about that.
    // fr: Dites-m'en plus à ce sujet
    (m,g) => S(VP(V("dire").t("ip").pe(2),
                  moi_coi(),Pro("en"),
                  AdvP(Adv("plus"),
                       PP(P("à"),NP(D("ce"),N("sujet")))))),
    // en: Does talking about this bother you ?
    // fr: Est-ce que le fait d'en parler vous dérange ?
    (m,g) => S(NP(D("le"),N("fait"),
                  PP(P("de"),Pro("en"),V("parler").t("b"))),
               VP(V("déranger"),vous_cod(g))).typ({"int":"yon"})
]}
]},

{"key":[V("excuser"),N("pardon")], "key_en":"sorry", "rank":0, "pats":[  // sorry
 {"decomp":[star], // *
  "reasmb":[
    // en: Please don't apologise.
    // fr: S'il vous plaît, ne vous excusez pas.
    (m,g) => S(svp().a(","),
               SP(VP(V("excuser").t("ip").pe(2))).typ({"refl":true,"neg":true})),
    // en: Apologies are not necessary.
    // fr: Les excuses ne sont pas nécessaires
    (m,g) => S(NP(D("le"),N("excuse").n("p")),
               VP(V("être"),A("nécessaire"))).typ({"neg":true}),
    // en: I've told you that apologies are not required.
    // fr: Je vous ai dit que les excuses n'étaient pas nécessaires
    (m,g) => S(moi(),
               VP(V("dire").t("pc"),
                  vous_coi(g),
                  Pro("que"),
                  SP(NP(D("le"),N("excuse").n("p")),
                     VP(V("être").t("i"),
                        A("nécessaire"))).typ({"neg":true}))),
    // en: It did not bother me.  Please continue.
    // fr: Cela ne m'a pas dérangé.  Veuillez continuer.
    (m,g) => S(SP(Pro("cela"),
                  VP(V("déranger").t("pc"),moi_cod(g))).typ({"neg":true}).a("."),
               SP(V("vouloir").t("ip").pe(2),V("continuer").t("b")).cap(true))
    ]}
]},

// combiné avec la clé précédente!
// {"key":N("pardon"), "key_en":"apologize", "rank":0, "pats":[  // apologise
//  {"decomp":[star], // *
//   "reasmb":[
//     // en: goto sorry
//     "goto sorry",
//     ]}
// ]},

{"key":V("rappeler"), "key_en":"remember", "rank":5, "pats":[  // remember
    {"decomp":[star,je_decomp,me_decomp,V("rappeler"),star], // * je me rappelle *  // "* i remember *"
     "reasmb":[
    // en: Do you often think of (2) ?
    // fr: Pensez-vous souvent à (2)
    (m,g) => S(vous(g),
               VP(V("penser"),Adv("souvent"),
                  PP(P("à"),m[2]))).typ({"int":"yon"}),
    // en: Does thinking of (2) bring anything else to mind ?
    // fr: Le fait de penser à (2) vous rappelle-t-il quelque chose?
    (m,g) => S(NP(D("le"),N("fait"),
                  PP(P("de"),VP(V("penser").t("b"),
                     PP(P("à"),m[2])))),
               VP(vous_coi(g),V("rappeler"),
                  NP(D("quelque"),N("chose")))).typ({"int":"yon"}),
    // en: What else do you recollect ?
    // fr: De quoi d'autre vous souvenez-vous ?
    (m,g) => S(PP(P("de"),Pro("quoi"),P("de"),N("autre")),
               VP(V("souvenir").pe(2).lier(),vous(g))).a("?"),
    // en: Why do you remember (2) just now ?
    // fr: Pourquoi vous souvenez-vous de (2) à l'instant ?
    (m,g) => S(Adv("pourquoi"),
               VP(V("souvenir").pe(2).lier(),vous(g),
                  PP(P("de"),m[2]),PP(P("à"),NP(D("le"),N("instant"))))).a("?"),
    // en: What in the present situation reminds you of (2) ?
    // fr: Qu'est-ce qui, dans la situation actuelle, vous rappelle (2)
    (m,g) => S(Pro("que"),
               VP(V("être"),Pro("ce"),Pro("qui").a(","),
                  PP(P("dans"),NP(D("le"),N("situation"),A("actuel"))).a(","),
                  SP(vous_coi(g)),VP(V("rappeler"),m[2]))).a("?"),
    // en: What is the connection between me and (2) ?
    // fr: Quel est le lien entre moi et (2)
    (m,g) => S(Pro("quel"),
               VP(V("être"),
                  NP(D("le"),N("lien"),
                     PP(P("entre"),moi_ton(),C("et"),m[2])))).a("?"),
    // en: What else does (2) remind you of ?
    // fr: Que (2) vous rappelle d'autre ?
    (m,g) => S(m[2],
               VP(V("rappeler"),
                   Pro("cela"),vous_coi(g),
                   D("de"),N("autre"))).typ({"int":"wad"})
    ]},
    {"decomp":[star,tu_decomp,tu_decomp,V("rappeler").n("p").pe(2),P("de"),star],  // * vous vous rappelez de // * do you remember *
     "reasmb":[
    // en: Did you think I would forget (2) ?
    // fr: Comment est-ce que nous pourrions oublier (2)?
    (m,g) => S(moi(),
              VP(V("oublier").t('c'),m[2])).typ({"int":"how","mod":"poss"}),
    // en: Why do you think I should recall (2) now ?
    // fr: De quoi dois-je me souvenir à propos de (2) ?
    (m,g) => S(PP(P("de"),Pro("quoi")),moi(),
               VP(V("souvenir").pe(1),
                  PP(P("à"),N("propos"),P("de"),m[2]))
              ).typ({"mod":"nece","int":"yon"}),
    // en: What about (2) ?
    // fr: Qu'en est-il de (2) ?
    (m,g) => S(Pro("que"),
               VP(Pro("en"),V("être").lier(),
                  Pro("lui").c("nom"),PP(P("de"),m[2]))),
    // en: goto what
        "goto what",
    // en: You mentioned (2) ?
    // fr: Vous avez mentionné (2) ?
    (m,g) => S(vous(g),VP(V("mentionner").t("pc"),m[2])),
    ]},
    {"decomp":[star, tu_decomp, V("rappeler"), star], // * you remember *
     "reasmb":[
    // en: How could I forget (2) ?
    // fr: Comment pourrais-je oublier (2)?
    (m,g) => S(moi(),
               VP(V("oublier").t("c"),m[2])).typ({"mod":"poss","int":"how"}),
    // en: What about (2) should I remember ?
    // fr: Qu'est-ce que je retiens de (2)?
    (m,g) => S(moi(),
               VP(V("retenir"),
                  Pro("cela"),PP(P("de"),m[2]))).typ({"int":"wad"}),
    // en: goto you
        "goto you",
    ]}
]},

{"key":V("oublier"), "key_en":"forget", "rank":5, "pats":[  // forget
    {"decomp":[star,je_decomp,V("oublier").pe(1),star], // * j'oublie *  // * i forget *
     "reasmb":[
    // en: Can you think of why you might forget (2) ?
    // fr: Pouvez-vous penser à la raison pour laquelle vous pourriez oublier (2) ?
    (m,g) => S(vous(g), 
               VP(V("penser"), 
                  PP(P("à"), 
                     NP(D("le"), N("raison"), 
                        PP(P("pour"), 
                           Pro("lequel").g("f"),
                           SP(vous(g), VP(V("oublier").t("c"), m[2])
                             ).typ({ "mod": "poss" })))))
              ).typ({ 'int': "yon", "mod": "poss" }),
    // en: Why can't you remember (2) ?
    // fr: Pourquoi ne vous souvenez-vous pas de (2) ? 
    (m,g) => S(vous(g),
               VP(V("souvenir"),
                  PP(P("de"),m[2]))).typ({'int':"why","neg":true}),
    // en: How often do you think of (2) ?
    // fr: Combien de fois pensez-vous à (2) ? 
    (m,g) => S(AdvP(Adv("combien"),P("de"),N("fois")),
               vous(g),
               VP(V("penser"),PP(P("à"),m[2]))).typ({"int":"yon"}),
    // en: Does it bother you to forget that ?
    // fr: Cela vous gêne-t-il d'oublier cela ?
    (m,g) => S(Pro("cela"),
               VP(V("gêner"),vous_cod(g),
                  SP(P("de"),V("oublier").t("b"),Pro("cela")))).typ({'int':"yon"}),
    // en: Could it be a mental block ?
    // fr: Serait-ce un blocage mental ?
    (m,g) => S(Pro("ce"),
               VP(V("être").t("c").aux("êt"),
                  NP(D("un"),N("blocage"),A("mental")))).typ({"int":"yon"}),
    // en: Are you generally forgetful ?
    // fr: Êtes-vous généralement distrait ?
    (m,g)  => S(vous(g),
                VP(V("être"),Adv("généralement"),A("distrait"))).typ({"int":"yon"}),
    // en: Do you think you are suppressing (2) ?
    // fr: Pensez-vous que vous supprimez (2) ?
    (m,g)  => S(vous(g),
                VP(V("penser"),
                   SP(Pro("que"),vous(g),VP(V("supprimer"),m[2])))
                ).typ({"int":"yon"})
    ]},
    {"decomp":[star,V("avoir").pe(2).n("x"),tu_decomp,V("oublier").t("pp"),star],  // * avez-vous oublié *  // * did you forget *
     "reasmb":[
    // en: Why do you ask ?
    // fr: Pourquoi demandez-vous ?,
    (m,g)  => S(vous(g),VP(V("demander"))).typ({"int":"why"}),
    // en: Are you sure you told me ?
    // fr: Êtes-vous sûr de ce que vous m'avez dit ?
    (m,g)  => S(vous(g),
                VP(V("être"),A("sûr"),
                   PP(P("de"),Pro("ce"),
                      SP(Pro("que"),vous(g),
                         VP(V("dire").t("pc"),moi_coi()))))
                ).typ({"int":"yon"}),
    // en: Would it bother you if I forgot (2) ?
    // fr: Cela vous dérangerait-il si j'oubliais (2) ?
    (m,g) => S(Pro("cela"),
               VP(V("déranger").t("c"),vous_cod(g),
                  SP(C("si"),moi(),
                     VP(V("oublier").t("i"),m[2])))).typ({'int':"yon"}),
    // en: Why should I recall (2) just now ?
    // fr: Pourquoi devrais-je me rappeler (2) à l'instant ?
    (m,g) => S(moi(),
               VP(V("rappeler").t("c"),
                  PP(P("de"),m[2]),
                  PP(P("à"),NP(D("le"),N("instant"))))
               ).typ({"int":"why","mod":"nece","refl":true}),
    // en: goto what
    // fr: 
       "goto what",
    // en: Tell me more about (2).
    // fr: Dites-m'en plus sur (2)
    (m,g) => S(VP(V("dire").t("ip").pe(2).lier(),
               moi_coi(),Pro("en"),
               AdvP(Adv("plus"),
                    PP(P("sur"),m[2]))))
]}
]},

{"key":C("si"), "key_en":"if", "rank":3, "pats":[  // if
    {"decomp":[star,C("si"),star], // * if *
     "reasmb":[
    // en: Do you think it's likely that (2) ?
    // fr: Pensez-vous qu'il est probable que (2) ?
        (m,g) => S(vous(g),
                   VP(V("penser"),
                      SP(Pro("que"),Pro("lui").c("nom"),
                         VP(V("être"),A("probable"),Pro("que"),m[2])))
                  ).typ({"int":"yon"}),
    // en: Do you wish that (2) ?
    // fr: Souhaitez-vous que (2) ?
    (m,g) => S(vous(g),
                VP(V("souhaiter"),
                    SP(Pro("que"),m[2]))).typ({"int":"yon"}),
    // en: What do you know about (2) ?
    // fr: Que davez-vous de (2) ?
    (m,g) => S(vous(g),
                VP(V("savoir"),Pro("cela"),
                    PP(P("de"),m[2]))).typ({"int":"wad"}),
    // en: Really, if (2) ?
    // fr: Vraiment, si (2) ?
    (m,g) => S(Adv("vraiment"),C("si"),m[2]),
    // en: What would you do if (2) ?
    // fr: Que feriez-vous si (2) ?
    (m,g) => S(vous(g),
               VP(V("faire").t("c"),Pro("cela"),
                  SP(C("si"),m[2]))).typ({"int":"wad"}),
    // en: But what are the chances that (2) ?
    // fr: Mais quelles sont les chances que (2) ? 
    (m,g) => S(Adv("mais"),
               Pro("quel").n("p").g("f"),
               VP(V("être").n("p"),
                  NP(D("le"),N("chance").n("p"),
                     SP(Pro("que"),m[2])))).a("?"),
    // en: What does this speculation lead to ?
    // fr: À quoi ces spéculations mènent-elles?
    (m,g) => S(NP(D("ce"),N("spéculation").n("p")),
               VP(V("mener").n("p"),
                  PP(P("à"),Pro("cela")))).typ({"int":"wai"}),
    ]}
]},

{"key":V("rêver"), "key_en":"dreamed", "rank":4, "pats":[  // dreamed
  {"decomp":[star, je_decomp,V("rêver"),P("de"),star], // * i dreamed *
   "reasmb":[
    // en: Really, (2) ?
    // fr: Réellement, (2)?
    (m,g) => S(Adv("réellement").a(","),m[2]).a("?"),
    // en: Have you ever fantasized (2) while you were awake ?
    // fr: Avez-vous déjà fantasmé (2) alors que vous étiez éveillé(e) ?
    (m,g) => S(vous(g),
              VP(V("fantasmer").t("pc"),
                 Adv("déjà"),m[2]),
              SP(Adv("alors"),Pro("que"),
                 vous(g),VP(V("éveiller").t("pc").aux("êt")))
              ).typ({"int":"yon"}),
    // en: Have you ever dreamed (2) before ?
    // fr: Avez-vous déjà rêvé (2) ?
    (m,g) => S(vous(g),
                VP(V("rêver").t("pc"),
                    Adv("déjà"),m[2])).typ({"int":"yon"}),
    // en: goto dream
    "goto dream"
    ]}
]},

{"key":N("rêve"), "key_en":"dream", "rank":3, "pats":[  // dream
 {"decomp":[star], // *
  "reasmb":[
    // en: What does that dream suggest to you ?
    // fr: Qu'est-ce que ce rêve vous suggère ?
        (m,g) => S(NP(D("ce"),N("rêve")),
                   VP(Pro("cela"),vous_coi(g),V("suggérer"))).typ({"int":"wad"}),
    // en: Do you dream often ?
    // fr: Rêvez-vous souvent ? 
        (m,g) => S(vous(g),VP(V("rêver"),Adv("souvent"))).typ({"int":"yon"}),
    // en: What persons appear in your dreams ?
    // fr: Qui sont les personnes qui apparaissent dans vos rêves ?
        (m,g) => S(Pro("lui").g("f").n("p"),
                   VP(V("être"),
                     NP(D("le"),N("personne").n("p"),
                        SP(Pro("qui"),
                           VP(V("apparaître"),
                              PP(P("dans"),
                                 NP(votre(),N("rêve").n("p")))))))
                   ).typ({"int":"wos"}),
    // en: Do you believe that dreams have something to do with your problem ?
    // fr: Croyez-vous que les rêves ont quelque chose à voir avec votre problème ?
        (m,g) => S(vous(g),
                   VP(V("croire"),
                      SP(Pro("que"),NP(D("le"),N("rêve").n("p")),
                         VP(V("avoir"),
                            NP(D("quelque"),N("chose"),
                               PP(P("à"),
                                  VP(V("voir").t("b"),
                                     PP(P("avec"),
                                        NP(votre(),N("problème")))))))))
                ).typ({"int":"yon"}),
    ]}
]},

{"key":Adv("peut-être"), "key_en":"perhaps", "rank":0, "pats":[  // perhaps
 {"decomp":[star], // *
  "reasmb":[
    // en: You don't seem quite certain.
    // fr: Vous ne semblez pas tout à fait certain
    (m,g) => S(vous(g),
               VP(V("sembler"),
                  AdvP(Adv("tout"),P("à"),N("fait")),A("certain"))
              ).typ({"neg":true}),
    // en: Why the uncertain tone ?
    // fr: Pourquoi ce ton incertain ?
    (m,g) => S(NP(D("ce"),N("ton"),A("incertain"))).typ({"int":"why"}),
    // en: Can't you be more positive ?
    // fr:  Ne pouvez-vous pas être plus positif ? 
    (m,g) => S(vous(g),
               VP(V("être"),A("positif").f("co"))
              ).typ({"int":"yon","mod":"poss","neg":true}), 
    // en: You aren't sure ?
    // fr: N'êtes-vous pas sûr?
    (m,g) => S(vous(g),VP(V("être"),A("sûr"))).typ({"neg":true,"int":"yon"}),
    // en: Don't you know ?
    // fr: Vous ne savez pas ? 
    (m,g) => S(vous(g),VP(V("savoir"))).typ({"neg":true}).a("?"),
    // en: How likely, would you estimate ?
    // fr: Quelle est la probabilité que vous estimez ? 
    (m,g) => S(Pro("quel").g("f"),
               VP(V("être"),NP(D("le"),N("probabilité"),
                  SP(Pro("que"),vous(g),V("estimer"))))).a("?"),
    ]}
]},

{"key":N("nom"), "key_en":"name", "rank":15, "pats":[  // name
 {"decomp":[star], // *
  "reasmb":[
    // en: I am not interested in names.
    // fr: Les noms ne m'intéressent pas.
    (m,g) => S(NP(D("le"),N("nom").n("p")),
               VP(V("intéresser"),moi_cod(g))).typ({"neg":true}),
    // en: I've told you before, I don't care about names -- please continue.
    // fr: Je vous l'ai déjà dit, les noms ne m'intéressent pas - continuez, s'il vous plaît.
    (m,g) => S(moi(),
               VP(vous_coi(g),V("dire").t("pc"),Adv("déjà")).a(","),
               SP(NP(D("le"),N("nom").n("p")),
                  VP(V("intéresser"),moi_cod(g))).typ({"neg":true}).a(" -- "),
               V("continuer").t("ip").pe(2),svp()),
    ]}
]},

{"key":Q("deutsch"), "key_en":"deutsch", "rank":0, "pats":[  // deutsch
 {"decomp":[star], // *
  "reasmb":[
    // en: goto xforeign
    "goto xforeign",
    // en: I told you before, I don't understand German.
    // fr: Je te l'ai déjà dit, je ne comprends pas l'allemand
    (m,g) => S(moi(),VP(vous_coi(g),Pro("le"),V("dire").t("pc"),Adv("déjà")).a(","),
                  SP(moi(),VP(V("comprendre"),NP(D("le"),N("allemand")))).typ({"neg":true})),
    ]}
]},

{"key":Q("english"), "key_en":"francais", "rank":0, "pats":[  // francais
 {"decomp":[star], // *
  "reasmb":[
    // en: goto xforeign
    "goto xforeign",
    // en: I told you before, I don't understand French.
    // fr: Je te l'ai déjà dit, je ne comprends pas le français 
    (m,g) => S(moi(),VP(vous_coi(g),Pro("le"),V("dire").t("pc"),Adv("déjà")).a(","),
                  SP(moi(),VP(V("comprendre"),NP(D("le"),N("anglais")))).typ({"neg":true})),
    ]}
]},

{"key":Q("italiano"), "key_en":"italiano", "rank":0, "pats":[  // italiano
 {"decomp":[star], // *
  "reasmb":[
    // en: goto xforeign
    "goto xforeign",
    // en: I told you before, I don't understand Italian.
    // fr: Je te l'ai déjà dit, je ne comprends pas l'italien 
    (m,g) => S(moi(),VP(vous_coi(g),Pro("le"),V("dire").t("pc"),Adv("déjà")).a(","),
               SP(moi(),VP(V("comprendre"),NP(D("le"),N("italien")))).typ({"neg":true})),
    ]}
]},

{"key":Q("espanol"), "key_en":"espanol", "rank":0, "pats":[  // espanol
 {"decomp":[star], // *
  "reasmb":[
    // en: goto xforeign
    "goto xforeign",
    // en: I told you before, I don't understand Spanish.
    // fr: Je te l'ai déjà dit, je ne comprends pas l'espagnol
    (m,g) => S(moi(),VP(vous_coi(g),Pro("le"),V("dire").t("pc"),Adv("déjà")).a(","),
               SP(moi(),VP(V("comprendre"),NP(D("le"),N("espagnol")))).typ({"neg":true})),
    ]}
]},

{"key":Q("xforeign"), "key_en":"xforeign", "rank":0, "pats":[  // xforeign
 {"decomp":[star], // *
  "reasmb":[
    // en: I speak only English.
    // fr: Je ne comprends que le français
    (m,g) => S(moi(),VP(V("comprendre"),NP(D("le"),N("français"))).typ({"neg":"que"})),
    ]}
]},

{"key":N("bonjour"), "key_en":"hello", "rank":0, "pats":[  // hello
 {"decomp":[star], // *
  "reasmb":[
    // en: How do you do.  Please state your problem.
    // fr: Comment allez-vous ?  Veuillez exposer votre problème.
    (m,g) => S(SP(vous(g),VP(V("aller"))).typ({"int":"how"}),
                   SP(VP(V("vouloir").t("ip").pe(2),V("exposer").t("b"),NP(votre(),N("problème")))).cap(true)),
    // en: Hi.  What seems to be your problem ?
    // fr: Bonjour. Quel semble être votre problème ?
    (m,g) => S(N("bonjour").cap(true).a("."),
                   SP(Pro("quel"),VP(V("être"),NP(votre(),N("problème")))).cap(true).a("?")),
    ]}
]},

{"key":[N("ordinateur"),N("machine")], "key_en":"computer", "rank":50, "pats":[  // computer
 {"decomp":[Q("*")], // *
  "reasmb":[
    // en: Do computers worry you ?
    // fr: Les ordinateurs vous inquiètent-ils ?
    (m,g) => S(NP(D("le"),N("ordinateur").n("p")),
               VP(V("inquiéter"),vous_cod(g))).typ({"int":"yon"}),
    // en: Why do you mention computers ?
    // fr: Pourquoi parlez-vous d'ordinateurs ?
    (m,g) =>S(vous(g),
              VP(V("parler"),
                 NP(D("de"),N("ordinateur").n("p")))).typ({"int":"why"}),
    // en: What do you think machines have to do with your problem ?
    // fr: Quel est, selon vous, le rapport entre les machines et votre problème ?
    (m,g) =>S(Pro("quel"),
              VP(V("être").a(","),
                 PP(P("selon"),vous_ton(g)).a(","),
                 NP(D("le"),N("rapport"),
                    PP(P("entre"),
                         CP(C("et"),
                            NP(D("le"),N("machine").n("p")),
                            NP(votre(),N("problème"))))))).a("?"),
    // en: Don't you think computers can help people ?
    // fr: Ne pensez-vous pas que les ordinateurs peuvent aider les gens ?
    (m,g) =>S(vous(g),
              VP(V("penser"),
                 SP(Pro("que"),
                    NP(D("le"),N("ordinateur").n("p")),
                    VP(V("aider"),
                       NP(D("le"),N("gens").n("p")))).typ({"mod":"poss"}))
              ).typ({"int":"yon","neg":true}),
    // en: What about machines worries you ?
    // fr: Qu'est-ce qui vous inquiète dans les machines ?
    (m,g) =>S(Pro("cela"),
              VP(vous_cod(g),V("inquiéter"),
                 PP(P("dans"),
                    NP(D("le"),N("machine").n("p"))))).typ({"int":"was"}),    
    // en: What do you think about machines ?
    // fr: Que pensez-vous des machines ?
    (m,g) =>S(vous(g),
             VP(V("penser"),Pro("cela"),
                PP(P("de"),NP(D("le"),N("machine").n("p"))))).typ({"int":"wad"}),
    // en: You don't think I am a computer program, do you ?
    // fr: Vous ne pensez pas que je suis un programme informatique, n'est-ce pas ?
    (m,g) => S(vous(g),
              VP(V("penser"),
                 SP(Pro("que"),moi(),VP(V("être"),
                    NP(D("un"),N("programme"),A("informatique")))))
              ).typ({"int":"tag","neg":true}),          
    ]}
]},

{"key":V("être"), "key_en":"am", "rank":0, "pats":[  // am
 {"decomp":[star,V("être").pe(1),je_decomp,star], // suis je // * am i *
  "reasmb":[
    // en: Do you believe you are (2) ?
    // fr: Croyez-vous que vous êtes (2) ?
    (m,g) => S(vous(g),
               VP(V("croire"),
                  SP(Pro("que"),vous(g),
                     VP(V("être"),m[2])))).typ({"int":"yon"}),
    // en: Would you want to be (2) ?
    // fr: Voudriez-vous être (2) ?
    (m,g) => S(vous(g),
               VP(V("vouloir").t("c"),
                  VP(V("être").t("b"),m[2]))).typ({"int":"yon"}),
    // en: Do you wish I would tell you you are (2) ?
    // fr: Aimeriez-vous que je vous dise que vous êtes (2) ? 
    (m,g) => S(vous(g),
               VP(V("aimer").t("c"),
                  SP(Pro("que"),moi(),
                     VP(vous_coi(g),V("dire").t("s"),
                        SP(Pro("que"),vous(g),
                           VP(V("être"),m[2])))))).typ({"int":"yon"}),
    // en: What would it mean if you were (2) ?
    // fr: Qu'est-ce que cela signifierait si vous étiez (2) ?
    (m,g) => S(Pro("cela"),
               VP(V("signifier").t("c"),
                  Pro("ceci"),
                  SP(C("si"),vous(g),
                     VP(V("être").t("i"),m[2])))).typ({"int":"wad"}),
    // en: goto what
    "goto what",
    ]},
 {"decomp":[star,[V("être").pe(2),V("être").pe(2).n("p")],tu_decomp,star], // [es|êtes] [tu|vous] // * are you *
     "reasmb":[
    // en: Why are you interested in whether I am (2) or not ?
    // fr: Pourquoi vous intéressez-vous à savoir si je suis (2) ou non ?
    (m,g) => S(vous(g),
               VP(V("intéresser"),
                  PP(P("à"),V("savoir").t("b"),
                     SP(C("si"),moi(),
                        VP(V("être"),m[2],
                           C("ou"),Adv("non")))))
               ).typ({"int":"why","refl":true}),
    // en: Would you prefer if I weren't (2) ?
    // fr: Préféreriez-vous que je ne sois pas (2) ? 
    (m,g) => S(vous(g),
               VP(V("préférer").t("c"),
                  SP(C("que"),moi(),
                     VP(V("être").t("s"),m[2])).typ({"neg":true}))
              ).typ({"int":"yon"}),
    // en: Perhaps I am (2) in your fantasies.
    // fr: Peut-être suis-je (2) dans vos fantasmes 
    (m,g) => S(Adv("peut-être"),moi(),
               VP(V("être").pe(1).n("s"),m[2],
                  PP(P("dans"),
                     NP(votre(),N("fantasme").n("p"))))
              ).typ({"int":"yon"}),
    // en: Do you sometimes think I am (2) ?
    // fr: Pensez-vous parfois que je suis (2) ? 
    (m,g) => S(vous(g),
               VP(V("penser"),Adv("parfois"),
                  SP(Pro("que"),moi(),
                     VP(V("être"),m[2])))
             ).typ({"int":"yon"}),
    // en: goto what
    "goto what",
    // en: Would it matter to you ?
    // fr: Cela aurait-il de l'importance pour vous ? 
    (m,g) => S(Pro("cela"),
               VP(V("avoir").t("c").lier(),
                  PP(P("de"),
                     NP(D("le"),N("importance"),
                        PP(P("pour"),vous_ton(g)))))).typ({"int":"yon"}),
    // en: What if I were (2) ?
    // fr: Et si j'étais (2) ?
    (m,g) => S(C("et"),C("si"),moi(),
               VP(V("être").t("i"),m[2])).a("?"),
    ]},
 {"decomp":[star,je_decomp,V("être").pe(1),star], // * je suis * // * i am *
    "reasmb":[
        // en: goto i
       "goto i",
    ]},
    {"decomp":[star,tu_decomp,[V("être").pe(2),V("être").pe(2).n("p")],star], // * [tu|vous] [es|êtes] * // * you are *
    "reasmb":[
        // en: goto you
        "goto you",
    ]},
 {"decomp":[star,[V("être").pe(3).n("p")],star], // * sont * // * are *
    "reasmb":[
    // en: Did you think they might not be (2) ?
    // fr: Avez-vous pensé qu'ils pourraient ne pas être (2) ?
    (m,g) => S(vous(g),
               VP(V("penser").t("pc"),
                  SP(Pro("que"),
                     Pro("moi").c("nom").pe(3).n("p"),
                     VP(V("pouvoir").t("c"),
                        VP(V("être").t("b"),m[2]).typ({"neg":true})
                   )))).typ({"int":"yon"}),
    // en: Would you like it if they were not (2) ?
    // fr: Aimeriez-vous qu'ils ne soient pas (2) ?
    (m,g) => S(vous(g),
               VP(V("aimer").t("c"),
                  SP(Pro("que"),
                     Pro("moi").c("nom").pe(3).n("p"),
                     VP(V("être").t("s"),m[2])).typ({"neg":true}))
              ).typ({"int":"yon"}),
    // en: What if they were not (2) ?
    // fr:  Et s'ils n'étaient pas (2) ?
    (m,g) => S(C("et"),
               SP(C("si"),
                  Pro("moi").c("nom").pe(3).n("p"),
                  VP(V("être").t("i"),m[2])).typ({"neg":true})),
    // en: Are they always (2) ?
    // fr: Sont-ils toujours (2) ? 
    (m,g) => S(Pro("moi").c("nom").pe(3).n("p"),
               VP(V("être"),Adv('toujours'),m[2])).typ({"int":"yon"}),
    // en: Possibly they are (2).
    // fr: Il est possible qu'ils soient (2)
    (m,g) => S(Pro("moi").c("nom").pe(3),
               VP(V("être"),A('possible'),
                  SP(Pro("que"),
                     Pro("moi").c("nom").pe(3).n("p"), 
                     VP(V("être").t("s"),m[2])))),
    // en: Are you positive they are (2) ?
    // fr: Êtes-vous sûr qu'ils sont (2) ?
    (m,g) => S(vous(g),
               VP(V("être"),A('sûr'),
                  SP(Pro("que"),
                     Pro("moi").c("nom").pe(3).n("p"), 
                     VP(V("être"),m[2])))).typ({'int':"yon"}),
    ]},
   {"decomp":[star,V("être").t("i").pe(1), je_decomp, star], // étais-je // * was i *
    "reasmb":[
    // en: What if you were (2) ?
    // fr: Et si vous étiez (2) ?
    (m,g) => S(C("et"),C("si"),vous(g),
               VP(V("être").t("i"),m[2])).a("?"),
    // en: Do you think you were (2) ?
    // fr: Pensez-vous que vous étiez (2) ?
    (m,g) => S(vous(g),
               VP(V("penser"),
                  SP(Pro("que"),vous(g),
                     VP(V("être").t("i"),m[2])))).typ({"int":"yon"}),
    // en: Were you (2) ?
    // fr: Etiez-vous (2) ? 
    (m,g) => S(vous(g),
               VP(V("être").t("i"),m[2])).typ({"int":"yon"}),
    // en: What would it mean if you were (2) ?
    // fr: Qu'est-ce que le fait d'être (2) signifierait ?
    (m,g) => S(NP(D("le"),N("fait"),
                  PP(P("de"),V("être").t("b"),m[2])),
               VP(V("signifier").t("c"),Pro("cela"))).typ({"int":"wad"}),
    // en: What does ' (2) ' suggest to you ?
    // fr: Que (2) vous suggère ?
    (m,g) =>S(m[2],
              VP(V("suggérer"),Pro("cela"),vous_coi(g))).typ({"int":"wad"}),
    // en: goto what
        "goto what"
  ]},
  {"decomp":[star, je_decomp, V("être").t("i").pe(1), star], // j'étais // * i was *
   "reasmb":[
    // en: Were you really (2) ?
    // fr: Étais-tu vraiment (2) ? 
    (m,g) => S(vous(g),
               VP(V("être").t("i"),
                  Adv("vraiment"),m[2])).typ({"int":"yon"}),
    // en: Why do you tell me you were (2) now ?
    // fr: Pourquoi me dis-tu que tu étais (2) maintenant ?
    (m,g) => S(vous(g),
               VP(V("dire"),moi_coi(),
                  SP(vous(g),
                     VP(V("être").t("i"),m[2],Adv("maintenant"))))
              ).typ({"int":"why"}),
    // en: Perhaps I already know you were (2).
    // fr: Peut-être que je sais déjà que tu étais (2).
    (m,g) => S(Adv("peut-être"),
               SP(Pro("que"),moi(),
                  VP(V("savoir"),Adv("déjà"),
                     SP(Pro("que"),vous(g),
                        VP(V("être").t("i"),m[2]))))),
    ]},
  {"decomp":[star,[V("être").pe(2).t("i"),V("être").pe(2).t("i").n("p")],tu_decomp,star], // * [étais|étiez] [tu|vous] *, // * were you *
    "reasmb":[
    // en: Would you like to believe I was (2) ?
    // fr: Voulez-vous croire que j'étais (2) ? 
    (m,g) => S(vous(g),
               VP(V("vouloir"),V("croire").t("b"),
                 SP(Pro("que"),moi(),
                    VP(V("être").t("i"),m[2])))).typ({"int":"yon"}),
    // en: What suggests that I was (2) ?
    // fr: Qu'est-ce qui suggère que j'étais (2) ?
    (m,g) => S(Pro("cela"),VP(V("suggérer"),
               SP(Pro("que"),moi(),
                  VP(V("être").t("i"),m[2])))).typ({"int":"was"}),
    // en: What do you think ?
    // fr: Qu'en pensez-vous ? 
    (m,g) => S(vous(g),Pro("en"),
               VP(V("penser").lier(),Pro("cela"))).typ({"int":"wad"}),
    // en: Perhaps I was (2).
    // fr: Peut-être que j'étais (2).
    (m,g) => S(Adv("peut-être"),
               SP(Pro("que"),moi(),
                  VP(V("être").t("i"),m[2]))),
    // en: What if I had been (2) ?
    // fr: Et si j'avais été (2) ?
    (m,g) => S(C("et"),C("si"),moi(),
               VP(V("être").t("pq"),m[2])),
    ]},
   {"decomp":[star], // *
    "reasmb":[
    // en: Why do you say 'am' ?
    // fr: Pourquoi dites-vous cela?
    (m,g) => S(vous(g),VP(V("dire"),Pro("cela"))).typ({"int":"why"}),
    // en: I don't understand that.
    // fr: Je ne comprends pas cela.
    (m,g) => S(moi(),VP(V("comprendre"),Pro("cela"))).typ({"neg":true}),
    ]},
]},

{"key":D("notre"), "key_en":"your", "rank":0, "pats":[  // votre // your
 {"decomp":[star, D("notre").pe(2), star], // * your *
  "reasmb":[
    // en: Why are you concerned over my (2) ?
    // fr: Pourquoi t'inquiètes-tu de mon (2) ?
    (m,g) => S(vous(g),
               VP(V("inquiéter"),
                  PP(P("de"),NP(mon(),m[2])))).typ({"refl":true,"int":"why"}),
    // en: What about your own (2) ?
    // fr: Qu'en est-il de votre propre (2) ? 
    (m,g) => S(C("que"),
               Pro("lui").c("nom"),Pro("en"), 
               VP(V("être"),
                  PP(P("de"),NP(mon(),A("propre"),m[2])))
              ).typ({"int":"yon"}),
    // en: Are you worried about someone else's (2) ?
    // fr: Vous inquiétez-vous pour le (2) de quelqu'un d'autre?
    (m,g) => S(vous(g),
               VP(V("inquiéter"),
                  PP(P("pour"),
                     NP(D("le"),m[2],
                        PP(P("de"),
                           Pro("quelqu'un"),P("de"),N("autre")))))
             ).typ({"int":"yon","refl":true}),
    // en: Really, my (2) ?
    // fr: Vraiment, mon (2) ? 
    (m,g) => S(Adv("vraiment"),NP(mon(),m[2])).a("?"),
    // en: What makes you think of my (2) ?
    // fr: Qu'est-ce qui vous fait penser à mon (2) ?
    (m,g) => S(Pro("cela"),
               VP(V("faire"),V("penser").t("b"),
                  vous_coi(g),
                  PP(P("à"),NP(mon(),m[2])))).typ({"int":"was"}),
    // en: Do you want my (2) ?
    // fr: Voulez-vous mon (2) ?
    (m,g) => S(vous(g),VP(V("vouloir"),NP(mon(),m[2]))).typ({"int":"yon"})
    ]}
]},

{"key":je_decomp, "key_en":"i", "rank":0, "pats":[  // je // i
 {"decomp":[star, je_decomp, [V("désirer"),V("vouloir"),V("devoir")] ,star], // je @désire // * i @desire *
  "reasmb":[
    // en: What would it mean to you if you got (3) ?
    // fr: Qu'est-ce que cela signifierait pour vous si vous obteniez (2) ?
    (m,g) => S(Pro("cela"),
               VP(V("signifier").t("c"),
                  Pro("ceci"),
                  PP(P("pour"),vous_ton(g)),
                     SP(C("si"),vous(g)
                        ,VP(V("obtenir").t("i"),m[2])))
              ).typ({"int":"wad"}),
    // en: Why do you want (3) ?
    // fr: Pourquoi voulez-vous (2) ? 
    (m,g) => S(vous(g),VP(V("vouloir"),m[2])).typ({"int":"why"}),
    // en: Suppose you got (3) soon.
    // fr: Supposez que vous obteniez (2) bientôt 
    (m,g) => S(V("supposer").t("ip").pe(2),
               SP(Pro("que"),vous(g),
                  VP(V("obtenir").t("i"),m[2],Adv("bientôt")))),
    // en: What if you never got (3) ?
    // fr: Et si vous n'obteniez jamais (2) ? 
    (m,g) => S(C('et'),C("si"),
               SP(vous(g),
                  VP(V("obtenir").t("i"),m[2])).typ({"neg":"jamais"})),
    // en: What would getting (3) mean to you ?
    // fr: Que signifierait pour vous l'obtention de (2) ?
    (m,g) => S(NP(D("le"),N("obtention"),
                  PP(P("de"),m[2])),
              VP(V("signifier").t("c"),
                 Pro("cela"),
                 PP(P("pour"),vous_ton(g)))).typ({"int":"wad"}),
    // en: What does wanting (3) have to do with this discussion ?
    // fr: Quel est le rapport entre le fait de vouloir (2) et cette discussion ?
    (m,g) => S(Pro("quel"),
               VP(V("être"),
                  NP(D("le"),N("rapport"),
                     PP(P("entre"),
                        CP(C("et"),
                           NP(D("le"),N("fait"),
                              PP(P("de"),V("vouloir").t("b"),m[2])),
                           NP(D("ce"),N("discussion"))))))).a("?"),
    ]},
 {"decomp":[star, je_decomp, V("être").pe(1), [A("triste"), A("malheureux"), V('déprimer').t("pp")], star], // * je suis @triste *// * i am* @sad *
  "reasmb":[
    // en: I am sorry to hear that you are (3).
    // fr: Je suis désolé d'apprendre que vous êtes (2)
    (m,g) => S(moi(),
              VP(V("être"),
              AP(A("désolé"),
                 PP(P("de"),
                    VP(V("apprendre").t("b"),
                       SP(Pro("que"),vous(g),VP(V("être"),m[2]))))))),
    // en: Do you think coming here will help you not to be (3) ?
    // fr: Pensez-vous que venir ici vous aidera à ne pas être (2) ?
    (m,g) => S(vous(g),
              VP(V("penser"),
                 SP(Pro("que"),V("venir").t("b"),Adv("ici"),
                    VP(V("aider").t("f"),vous_cod(g),
                       PP(P("à"),VP(V("être").t("b"),m[2]).typ({"neg":true})))))
              ).typ({"int":"yon"}),
    // en: I'm sure it's not pleasant to be (3).
    // fr: Je suis sûr qu'il n'est pas agréable d'être (2)
    (m,g) => S(moi(),VP(V("être"),A("sûr"),
              SP(Pro("que"),Pro("lui").c("nom"),
                VP(V("être"),A("agréable"),
                   PP(P("de"),V("être").t("b"),m[2]))).typ({"neg":true}))),
    // en: Can you explain what made you (3) ?
    // fr: Pouvez-vous expliquer ce qui vous a poussé à être (2) ?
    (m,g) => S(vous(g),
               VP(V("expliquer"),
                  Pro("ce"),
                  SP(Pro("qui"),
                     VP(V("pousser").t("pc"),
                          vous_cod(g),
                          PP(P("à"),VP(V("être").t("b"),m[2])))))
              ).typ({"int":"yon","mod":"poss"}),
    ]},
 {"decomp":[star, je_decomp, V("être").pe(1), [A("joyeux"), A("heureux"), A("content")], star], // * i am* @happy *
  "reasmb":[
    // en: How have I helped you to be (3) ?
    // fr: Comment vous ai-je aidé à être (2) ?
    (m,g) => S(moi(),
               VP(V("aider").t("pc"),
                  vous_cod(g),
                   PP(P("à"),V("être").t("b"),m[2]))).typ({"int":"how"}),
    // en: Has your treatment made you (3) ?
    // fr: Votre traitement vous a-t-il permis d'être (2) ? 
    (m,g) => S(NP(votre(),N("traitement")),
               VP(V("permettre").t("pc"),vous_coi(g),
                  PP(P("de"),V("être").t("b"),m[2]))).typ({"int":"yon"}),
    // en: What makes you (3) just now ?
    // fr: Qu'est-ce qui fait que vous êtes (2) en ce moment ? 
    (m,g) => S(Pro("cela"),
        VP(V("faire"),SP(Pro("que"),vous(g),V("être"),m[2],
                         PP(P("en"),NP(D("ce"),N("moment")))))).typ({"int":"was"}),
    // en: Can you explain why you are suddenly (3) ?
    // fr: Pouvez-vous expliquer pourquoi vous êtes soudainement (2) ?
    (m,g) =>S(vous(g),VP(V("expliquer"),
        SP(C("pourquoi"),vous(g),V("être"),Adv("soudainement"),m[2]))).typ({"int":"yon","mod":"poss"}),
    ]},
 {"decomp":[star, je_decomp, V("être").t("i").pe(1)], // * j'étais * // * i was *
  "reasmb":[
    // en: goto was
    "goto was"
     ]},
 {"decomp":[star,je_decomp, [V("penser").pe(1),V("estimer").pe(1),V("croire").pe(1)], Pro("que"),je_decomp, star ], 
    // * je @crois que je * // * i @belief i *
  "reasmb":[
    // en: Do you really think so ?
    // fr: Vous le pensez vraiment ?
    (m,g) => S(vous(g),VP(V("penser"),Pro("lui").c("acc"),Adv("vraiment"))).a("?"),
    // en: But you are not sure you (3).
    // fr: Mais vous n'êtes pas sûr que (2) 
    (m,g) => S(vous(g),VP(V("être"),A("sûr"),Pro("que"),vous(g), m[2])).typ({"neg":true}),
    // en: Do you really doubt you (3) ?
    // fr: Vous doutez vraiment que (2)
    (m,g) => S(vous(g),VP(V("douter"),Adv("vraiment"),Pro("que"),vous(g), m[2])).a("?"),
    ]},
 {"decomp":[star,je_decomp, [V("penser").pe(1),V("estimer").pe(1),V("croire").pe(1)], Pro("que"),tu_decomp, star ], 
    // * je @crois que tu *, // * i* @belief *you *
  "reasmb":[
    // en: goto you 
    "goto you",
    ]},
 {"decomp":[star,je_decomp, V("être").pe(1), star], // * je suis * // * i am *
  "reasmb":[
    // en: Is it because you are (2) that you came to me ?
    // fr: Est-ce parce que tu es (2) que tu es venu me voir ?
    (m,g) => S(Pro("ce"),VP(V("être"),
                SP(C('parce que'),vous(g),VP(V("être"),m[2])),
                SP(C("que"),vous(g),VP(V("venir").t("pc"),VP(Q("me"),V("voir").t("b")))))).typ({"int":"yon"}),
    // en: How long have you been (2) ?
    // fr: Depuis combien de temps êtes-vous (2) ?
    (m,g) => S(PP(P("depuis"),Adv("combien"),P("de"),N("temps")),
                vous(g),VP(V("être"),m[2])).typ({"int":"yon"}),
    // en: Do you believe it is normal to be (2) ?
    // fr: Croyez-vous qu'il est normal d'être (2) ? 
    (m,g) => S(vous(g),VP(V("croire"),SP(Pro("que"),Pro("lui").c("nom"),
               VP(V("être"),AP(A("normal"),
                    PP(P("de"),V("être").t("b"),m[2])))))).typ({"int":"yon"}),
    // en: Do you enjoy being (2) ?
    // fr: Aimez-vous être (2) ? 
    (m,g) => S(vous(g),VP(V("aimer"),V("être").t("b"),m[2])).typ({"int":"yon"}),
    // en: Do you know anyone else who is (2) ?
    // fr: Connaissez-vous quelqu'un d'autre qui est (2) ?
    (m,g) => S(vous(g),VP(V("connaître"),Pro("quelqu'un"),
                PP(P("de"),A("autre"),
                    SP(Pro("qui"),VP(V("être"),m[2]))))).typ({"int":"yon"}),
    ]},
 {"decomp":[star, je_decomp, Adv("ne"), V("pouvoir").pe(1), Adv("pas"), star], 
    // * je ne peux pas * // * i @cannot *
  "reasmb":[
    // en: How do you know that you can't (3) ?
    // fr: Comment savez-vous que vous ne pouvez pas (2) 
    (m,g) => S(vous(g),VP(V("savoir"),
             SP(Pro("que"),vous(g),VP(V("pouvoir"),m[2])).typ({"neg":true}))).typ({"int":"how"}),
    // en: Have you tried ?
    // fr: Avez-vous essayé ?
    (m,g) => S(vous(g),VP(V("essayer").t("pc"))).typ({"int":"yon"}),
    // en: Perhaps you could (3) now.
    // fr: Peut-être pourriez-vous (2) maintenant 
    (m,g) => S(Adv("peut-être"),vous(g),VP(V("pouvoir").t("c"),m[2],Adv("maintenant"))).typ({"int":"yon"}),
    // en: Do you really want to be able to (3) ?
    // fr: Voulez-vous vraiment être capable de (2) ? 
    (m,g) => S(vous(g),VP(V("vouloir"),Adv("vraiment"),
        VP(V("être").t("b"),A("capable"),PP(P("de"),m[2])))).typ({"int":"yon"}),
    // en: What if you could (3) ?
    // fr: Et si vous pouviez (2) 
    (m,g) => S(C('et'),C("si"),vous(g),VP(V("pouvoir").t("i"),m[2])),
    ]},
 {"decomp":[star, je_decomp, Adv("ne"), V("vouloir").pe(1), Adv("pas"), star], 
    // * je ne veux pas * // * i don't *
  "reasmb":[
    // en: Don't you really (2) ?
    // fr: Êtes-vous vraiment obligé de (2)  
    (m,g) => S(vous(g),VP(V("être"),Adv("vraiment"),A("obligé"),PP(P("de"),m[2]))
                ).typ({"int":"yon"}),
    // en: Why don't you (2) ?
    // fr: Pourquoi ne le faites-vous pas ?
    (m,g) => S(vous(g),VP(V("faire"),Pro("lui").c("acc"))).typ({"int":"why","neg":true}),
    // en: Do you wish to be able to (2) ?
    // fr: Souhaitez-vous pouvoir (2) ?
        (m,g) => S(vous(g),VP(V("souhaiter"),V("pouvoir").t("b"),m[2])).typ({"int":"yon"}),
    // en: Does that trouble you ?
    // fr: Cela vous gêne-t-il ? 
    (m,g) => S(Pro("cela"),VP(V("gêner"),vous_cod(g))).typ({"int":"yon"}),
    ]},
 {"decomp":[star,je_decomp, V("sentir").pe(1), star], // * je pense * // * i feel *
  "reasmb":[
    // en: Tell me more about such feelings.
    // fr: Parlez-moi de ces sentiments.
    (m,g) => S(VP(V("parler").t("ip").pe(2).lier(),moi_ton(),PP(P("de"),NP(D("ce"),N("sentiment").n("p"))))),
    // en: Do you often feel (2) ?
    // fr: Ressentez-vous souvent (2) ?
    (m,g) => S(vous(g),VP(V("ressentir"),Adv("souvent"),m[2])).typ({"int":"yon"}),
    // en: Do you enjoy feeling (2) ?
    // fr: Aimez-vous  (2) ?
    (m,g) => S(vous(g),VP(V("aimer"),m[2])).typ({"int":"yon"}),
    // en: Of what does feeling (2) remind you ?
    // fr: Que vous rappelle  (2) ?
    (m,g) => S(VP(V("rappeler"),Pro("cela"),vous_coi(g),m[2])).typ({"int":"wad"}),
    ]},
// no idea how to transpose this in French...
// it relies on the fact that infinitive and 2 person of present are of the same form
//  {"decomp":[star], // * i * you *
//   "reasmb":[
//     // en: Perhaps in your fantasies we (2) each other.
//     // fr: Peut-être que dans tes fantasmes nous nous (2) mutuellement 
//         (m,g) => Q("à faire"),
//     // en: Do you wish to (2) me ?
//     // fr: Voulez-vous me (2) ?
//         (m,g) => Q("à faire"),
//     // en: You seem to need to (2) me.
//     // fr: Vous semblez avoir besoin de me (2).
//         (m,g) => Q("à faire"),
//     // en: Do you (2) anyone else ?
//     // fr: Voulez-vous (2) quelqu'un d'autre ?
//         (m,g) => Q("à faire"),
//     ]},
 {"decomp":[star], // *
  "reasmb":[
    // en: You say (1) ?
    // fr: Vous dites (1) ?
    (m,g) => S(vous(g),VP(V("dire"),SP(m[1]).en("\""))).a("?"),
    // en: Can you elaborate on that ?
    // fr: Pouvez-vous élaborer sur cela?
    (m,g) => S(vous(g),VP(V("élaborer"),PP(P("sur"),Pro("cela")))).typ({"int":"yon","mod":"poss"}),
    // en: Do you say (1) for some special reason ?
    // fr: Vous dites (1) pour une raison particulière.
    (m,g) => S(vous(g),VP(V("dire"),SP(m[1]).en("\""), PP(P("pour"),NP(D("un"),N("raison"),A("particulier"))))),
    // en: That's quite interesting.
    // fr: C'est très intéressant.
    (m,g) => S(Pro("ce"),VP(V("être"),AdvP(Adv("très"),A("intéressant")))),
    ]}
]},

{"key":tu_decomp, "key_en":"you", "rank":0, "pats":[  // you
 {"decomp":[star, tu_decomp, me_decomp, [V("rappeler").pe(2).n("s"), V("rappeler").pe(2).n("p"), P("de"), star]], // * you remind me of *
  "reasmb":[
    // en: goto alike
    // fr: 
    "goto alike",
    ]},
 {"decomp":[star, tu_decomp, [V("être").pe(2).n("s"),V("être").pe(2).n("p")], star], // * you are *
  "reasmb":[
    // en: What makes you think I am (2) ?
    // fr: Qu'est-ce qui vous fait penser que je suis (2) ?
    (m,g) => S(Pro("cela"),
               VP(V("faire"),vous_coi(g),V("penser").t("b"),
                  SP(Pro("que"),moi(),
                     VP(V("être"),m[2])))).typ({"int":"was"}),
    // en: Does it please you to believe I am (2) ?
    // fr: Cela vous fait-il plaisir de croire que je suis (2) ? 
    (m,g) => S(Pro("cela"),
               VP(V("faire"),vous_coi(g),
                  N("plaisir"),
                  PP(P("de"),V("croire").t("b"),
                  SP(Pro("que"),moi(),
                     VP(V("être"),m[2]))))).typ({"int":"yon"}),
    // en: Do you sometimes wish you were (2) ?
    // fr: Souhaitez-vous parfois être (2) ? 
    (m,g) => S(vous(g),
               VP(V("souhaiter"),
                  AdvP(Adv("parfois"),
                  V("être").t("b"),m[2]))).typ({"int":"yon"}),
    // en: Perhaps you would like to be (2).
    // fr: Peut-être aimeriez-vous être (2).
    (m,g) => S(Adv("peut-être"),
               vous(g),
               VP(V("aimer").t("c"),
               V("être").t("b"),m[2])).typ({"int":"yon"}),
    ]},
// no idea how to transpose this in French...
// it relies on the fact that infinitive and 2 person of present are of the same form
//  {"decomp":[star], // * you * me *
//   "reasmb":[
//     // en: Why do you think I (2) you ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: You like to think I (2) you -- don't you ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: What makes you think I (2) you ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: Really, I (2) you ?
//     // fr:  
//         (m,g) => Q("à faire"),
//     // en: Do you wish to believe I (2) you ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: Suppose I did (2) you -- what would that mean ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: Does someone else believe I (2) you ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     ]},
 {"decomp":[star, tu_decomp, star], // * you *
  "reasmb":[
    // en: We were discussing you -- not me.
    // fr: Nous parlions de vous, pas de moi
    (m,g) => S(moi(),VP(V("parler").t("i"),PP(P("de"),vous_ton(g)).a(","),
                AdvP(Adv("pas"),P("de"),moi_ton()))),
    // en: Oh, I (2) ?
    // fr: Oh, (2)
    (m,g) => S(Q("oh"),m[2]),
    // en: You're not really talking about me -- are you ?
    // fr: Vous ne parlez pas vraiment de moi, n'est-ce pas ?
    (m,g) => S(vous(g),VP(V("parler"),PP(P("de"),moi_ton()))).typ({"neg":true, "int":"tag"}),
    // en: What are your feelings now ?
    // fr: Quels sont tes sentiments maintenant ?
    (m,g) => S(Pro("quel").n("p"),
               VP(V("être"),NP(votre(),N("sentiment").n("p"),Adv("maintenant")))).a("?"),
    ]}
]},

{"key":Adv("oui"), "key_en":"yes", "rank":0, "pats":[  // yes
 {"decomp":[star], // *
  "reasmb":[
    // en: You seem to be quite positive.
    // fr: Vous semblez être tout à fait positif 
    (m,g) => S(vous(g),
               VP(V("sembler"),
               AdvP(Adv("tout"),P("à"),N("fait")),
                    A("positif"))),
    // en: You are sure.
    // fr: Vous êtes sûr de vous
    (m,g) =>S(vous(g),
             VP(V("être"),A("sûr"),
                PP(P("de"),vous_ton(g)))),
    // en: I see.
    // fr: Je vois
    (m,g) => S(moi(),VP(V("voir"))),
    // en: I understand.
    // fr: Je comprends.
    (m,g) => S(moi(),VP(V("comprendre"))),
    ]}
]},

{"key":N("personne"), "key_en":"no_one", "rank":0, "pats":[  // no_one
 {"decomp":[star, N("personne"), Adv("ne"), star], // * no one *
  "reasmb":[
    // en: Are you sure, no one (2) ?
    // fr: Vous êtes sûr, personne (2) ?
    (m,g) => S(vous(g),
               VP(V("être"),
                  A("sûr").pos("pre").a(","),
                  N("personne"),Adv("ne"),m[2])),
    // en: Surely someone (2) .
    // fr: Sûrement quelqu'un (2) .
    (m,g) => S(Adv("sûrement"),Pro("quelqu'un"),m[2]),
    // en: Can you think of anyone at all ?
    // fr: Pouvez-vous penser à quelqu'un ?
    (m,g) => S(vous(g),
               VP(V("penser"),
               PP(P("à"),Pro("quelqu'un")))).typ({"int":"yon","mod":"poss"}),
    // en: Are you thinking of a very special person ?
    // fr: Pensez-vous à une personne très spéciale ? 
    (m,g) => S(vous(g),
               VP(V("penser"),
                  PP(P("à"),
                     NP(D("un"),N("personne"),Adv("très"),A("spécial"))))
              ).typ({"int":"yon"}),
    // en: Who, may I ask ?
    // fr: Qui, puis-je demander ? »,
    (m,g) => S(Pro("qui").a(","),
                SP(moi(),VP(V("demander"))).typ({"int":"yon","mod":"poss"})),
    // en: You have a particular person in mind, don't you ?
    // fr: Vous pensez à une personne en particulier, n'est-ce pas ?
    (m,g) => S(vous(g),
               VP(V("penser"),
                  PP(P("à"),
                     NP(D("un"),N("personne"),
                     PP(P("en"),N("particulier")))))).typ({"int":"tag"}),
    // en: Who do you think you are talking about ?
    // fr: De qui pensez-vous parler ? 
    (m,g) => S(vous(g),
               VP(V("penser"),V("parler").t("b"),
               PP(P("de"),Pro("lui").c("dat")))).typ({"int":"woi"}),
    ]},
]},

{"key":Adv("non"), "key_en":"no", "rank":0, "pats":[  // no
    {"decomp":[star], // *
  "reasmb":[
    // en: Are you saying no just to be negative?
    // fr: Dites-vous non juste pour être négatif ?
    (m,g) => S(vous(g),
              VP(V("dire"),Adv("non"),
                 AdvP(Adv("juste"),
                      P("pour"),V("être").t("b"),
                      A("négatif")))).typ({"int":"yon"}),
    // en: You are being a bit negative.
    // fr: Vous êtes un peu négatif 
    (m,g) => S(vous(g),
               VP(V("être"),
                  AdvP(Adv("juste"),D("un"),Adv("peu"),A("négatif")))),
    // en: Why not ?
    // fr:Pourquoi pas ? 
    (m,g) => S(Adv("pourquoi"),Adv("pas")).a("?"),
    // en: Why 'no' ?
    // fr: Pourquoi 'non' ?
    (m,g) => S(Adv("pourquoi"),Adv("non").en("\"")).a("?"),
    ]}
]},

{"key":D("mon").pe(1), "key_en":"my", "rank":2, "pats":[  // my
//  to fix when we figure out what to do with $
//  {"decomp":[N("nom")], // $ * my *
//   "reasmb":[
//     // en: Does that have anything to do with the fact that your (2) ?
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: Lets discuss further why your (2).
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: Earlier you said your (2).
//     // fr: 
//         (m,g) => Q("à faire"),
//     // en: But your (2).
//     // fr: 
//         (m,g) => Q("à faire"),
//     ]},
 {"decomp":[star, mon_decomp,family, star], // * my* @family *
  "reasmb":[
    // en: Tell me more about your family.
    // fr: Parlez-moi de votre famille 
    (m,g) => S(VP(V("parler").t("ip").pe(2).lier(),
               moi_ton(),
               PP(P("de"),NP(votre(),N("famille"))))),
    // en: Who else in your family (4) ?
    // fr: Who else in your family
    (m,g) => S(Pro("qui"),
               P("de"),N("autre"),
               PP(P("dans"),
                  NP(votre(),N("famille")))).a("?"),
    // en: Your (3) ?
    // fr: Votre famille ?
    (m,g) => S(NP(votre(),N("famille"))).a("?"),
    // en: What else comes to your mind when you think of your (3) ?
    // fr: Qu'est-ce qui vous vient à l'esprit quand vous pensez à votre famille ?
    (m,g) => S(Pro("cela"),
               VP(V("venir"),vous_coi(g),
                  PP(P("à"),NP(D("le"),N("esprit"))),
                  SP(C("quand"),vous(g),
                     VP(V("penser"),
                        PP("à"),NP(votre(),N("famille")))))).typ({"int":"was"})
    ]},
 {"decomp":[star,mon_decomp, star], // * my *
  "reasmb":[
    // en: Your (2) ?
    // fr: Votre (2) ?
    (m,g) => S(NP(votre(),m[2])).a("?"),
    // en: Why do you say your (2) ?
    // fr: Pourquoi dites-vous votre (2) ?
    (m,g) =>S(vous(g),
              VP(V("dire"),NP(votre(),m[2]))).typ({"int":"why"}),
    // en: Does that suggest anything else which belongs to you ?
    // fr: Cela suggère-t-il quelque chose d'autre qui vous appartient? »,
    (m,g) => S(Pro("cela"),VP(V("suggérer"),
                NP(D("quelque"),N("chose"),
                   PP(P("de"),N("autre")),
                   SP(Pro("qui"),
                      VP(V("appartenir"),vous_coi(g)))))).typ({"int":"yon"}),
    // en: Is it important to you that your (2) ?
    // fr: Est ce-que (2) est important pour vous?
    (m,g) => estceque(m[2],
                      VP(V("être"),A("important"),
                         PP(P("pour"),vous_ton(g)))),
    ]}
]},

{"key":V("pouvoir"), "key_en":"can", "rank":0, "pats":[  // can
 {"decomp":[star, [V("pouvoir").pe(2),V("pouvoir").pe(2).n("p")], tu_decomp, star ], 
          // peux-tu, pouvez-tu // * can you *
  "reasmb":[
    // en: You believe I can (2) don't you ?
    // fr: Vous croyez que je peux (2), n'est-ce pas ?
    (m,g) => S(vous(g),
               VP(V("croire"),
                  SP(Pro("que"),moi(),
                     VP(V("pouvoir"),m[2])))).typ({"int":"tag"}),
    // en: goto what
    // fr: 
    "goto what",
    // en: You want me to be able to (2).
    // fr: Vous voulez que je puisse (2) 
    (m,g) => S(vous(g),
               VP(V("vouloir"),
                  SP(Pro("que"),moi(),
                     VP(V("pouvoir").t("s"),m[2])))),
    // en: Perhaps you would like to be able to (2) yourself.
    // fr: Peut-être voudriez-vous être capable vous-mêmes de (2)?
    (m,g) =>S(Adv("peut-être"),vous(g),
                VP(V("vouloir").t("c"),
                   V("être").t("b"),
                   AP(A("capable"),
                      vous_ton(g).tn("refl"),
                      PP(P("de"),m[2])))).typ({"int":"yon"}),
    ]},
 {"decomp":[star, C("puis"), je_decomp, star], // puis-je (HACK for jsRealB lemmatization) // * can i *
  "reasmb":[
    // en: Whether or not you can (2) depends on you more than on me.
    // fr: Que vous puissiez ou non (2) dépend de vous plus que de moi 
    (m,g) => S(SP(Pro("que"),
                  vous(g),
                  VP(V("pouvoir").t("s"),m[2],C("ou"),Adv("non"))),
               VP(V("dépendre"),
                  AdvP(Adv("plus"),P("de"),vous_ton(g),
                       C("que"),P("de"),moi_ton()))),
    // en: Do you want to be able to (2) ?
    // fr:  Voulez-vous pouvoir (2) ?
    (m,g) => S(vous(g),
               VP(V("vouloir"),
                  V("pouvoir").t("b"),m[2])).typ({"int":"yon"}),
    // en: Perhaps you don't want to (2).
    // fr: Peut-être ne voulez-vous pas (2)
    (m,g) => S(Adv("peut-être"),vous(g),
               VP(V("vouloir"),m[2])).typ({"int":"yon","neg":true}),
    // en: goto what
    // fr: 
        "goto what",
    ]}
]},

{"key":Pro("quoi"), "key_en":"what", "rank":0, "pats":[  // quoi // what
 {"decomp":[star], // *
  "reasmb":[
    // en: Why do you ask ?
    // fr: Pourquoi cette question ?
    (m,g) => S(Adv("pourquoi"),
               NP(D("ce"),N("question"))).a("?"),
    // en: Does that question interest you ?
    // fr: Cette question vous intéresse-t-elle ?
    (m,g) => S(NP(D("ce"),N("question")),
               VP(V("intéresser"),vous_cod(g))).typ({"int":"yon"}),
    // en: What is it you really want to know ?
    // fr: Que voulez-vous vraiment savoir ?
    (m,g) => S(vous(g),
               VP(V("vouloir"),
                  Adv("réellement"),
                  V("savoir").t("b"),
                  Pro("cela"))).typ({"int":"wad"}),
    // en: Are such questions much on your mind ?
    // fr: Ces questions vous préoccupent-elles beaucoup ?
    (m,g) => S(NP(D("ce"),N("question").n("p")),
               VP(V("préoccuper"),vous_cod(g),
                  Adv("beaucoup"))).typ({"int":"yon"}),
    // en: What answer would please you most ?
    // fr: Quelle réponse vous plairait le plus ?
    (m,g) => S(NP(D("quel"),N("réponse")),
               VP(V("plaire").t("c"),
                  vous_cod(g),
                  D("le"),Adv("plus"))).a("?"),
    // en: What do you think ?
    // fr: Qu'en pensez-vous ? 
    (m,g) => S(Pro("que"),Pro("en"),
               VP(V("penser").pe(2).n("p").lier(),vous(g))).a("?"),
    // en: What comes to mind when you ask that ?
    // fr: Qu'est-ce qui vous vient à l'esprit lorsque vous posez cette question ?
    (m,g) => S(Pro("cela"),
               VP(V("venir"),vous_coi(g),
                  PP(P("à"),NP(D("le"),N("esprit"))),
                  SP(C("lorsque"),vous(g),
                     VP(V("poser"),
                        NP(D("ce"),N("question")))))).typ({"int":"was"}),
    // en: Have you asked such questions before ?
    // fr: Avez-vous déjà posé de telles questions ?
    (m,g) => S(vous(g),
               VP(V("poser").t("pc"),
                  Adv("déjà"),
                  NP(D("de"),A("tel"),N("question").n("p")))
               ).typ({"int":"yon"}),
    // en: Have you asked anyone else ?
    // fr: Avez-vous demandé à quelqu'un d'autre ?
    (m,g) => S(vous(g),
               VP(V("demander").t("pc"),
                  PP(P("à"),Pro("quelqu'un"),
                     P("de"),A("autre")))).typ({"int":"yon"}),
    ]}
]},

{"key":Pro("qui"), "key_en":"who", "rank":0, "pats":[  // qui // who
 {"decomp":[Pro("qui"), star], // who *
  "reasmb":[
    // en: goto what
    // fr: 
    "goto what",
    ]}
]},

{"key":Adv("quand"), "key_en":"when", "rank":0, "pats":[  // quand // when
 {"decomp":[Adv("quand"), star], // when *
  "reasmb":[
    // en: goto what
    // fr: 
    "goto what"
    ]}
]},

{"key":Adv("où"), "key_en":"where", "rank":0, "pats":[  // où // where
 {"decomp":[Adv("où"), star], // where *
  "reasmb":[
    // en: goto what
    // fr: 
    "goto what"
    ]}
]},

{"key":Adv("comment"), "key_en":"how", "rank":0, "pats":[  //comment // how
 {"decomp":[Adv("comment"), star], // how *
  "reasmb":[
    // en: goto what
    // fr: 
    "goto what"
    ]}
]},

{"key":Q("parce"), "key_en":"because", "rank":0, "pats":[  // parce que // because
    // HACK: this is not lemmatized correctly.... 
 {"decomp":[star], // *
  "reasmb":[
    // en: Is that the real reason ?
    // fr: Est-ce la vraie raison ?
    (m,g) => S(Pro('ce'),
               VP(V("être"),
                  NP(D("le"),A("vrai").pos("pre"),N("raison")))
               ).typ({"int":"yon"}),
    // en: Don't any other reasons come to mind ?
    // fr: D'autres raisons ne vous viennent-elles pas à l'esprit ? 
    (m,g) => S(NP(D("de"),A("autre").pos("pre"),N("raison").n("p")),
               VP(V("venir"),vous_coi(g),
                  PP(P("à"),NP(D("le"),N("esprit"))))
               ).typ({"int":"yon","neg":true}),
    // en: Does that reason seem to explain anything else ?
    // fr: Cette raison semble-t-elle expliquer autre chose ? 
    (m,g) => S(NP(D("ce"),N("raison")),
               VP(V("sembler"),V("expliquer").t("b"),
                  NP(A("autre"),N("chose")))
               ).typ({"int":"yon","neg":oneOf(true,false)}),
    // en: What other reasons might there be ?
    // fr: Quelles sont les autres raisons possibles ?
    (m,g) => S(Pro("quel").n("p").g("f"),
               VP(V("être").n("p"),
                  NP(D("le"),A("autre"),N("raison").n("p"),
                     A("possible")))).a("?"),
    ]}
]},

{"key":Adv("pourquoi"), "key_en":"why", "rank":0, "pats":[  // why
 {"decomp":[star, Adv("pourquoi"),Adv("ne"),[V("pouvoir").pe(2),V("pouvoir").pe(2).n("p")],tu_decomp,Adv("pas"), star], 
    // * pourquoi ne pouvez vous pas * // * why don't you *
    // HACK: slight change of meaning for French...
  "reasmb":[
    // en: Do you believe I don't (2) ?
    // fr: Croyez-vous que je ne peux pas (2) ? 
    (m,g) => S(vous(g),
               VP(V("croire"),
                  SP(Pro("que"),moi(),
                     VP(V("pouvoir"),m[2])).typ({"neg":true}))
               ).typ({"int":"yon"}),
    // en: Perhaps I will (2) in good time.
    // fr: Peut-être (2) en temps voulu 
    (m,g) => S(Adv("peut-être"),m[2],
               PP(P("en"),N("temps"),V("vouloir").t("pp"))),
    // en: Should you (2) yourself ?
    // fr: Devriez-vous vous-mêmes (2) ?
    (m,g) => S(vous(g),
               VP(V("devoir").t("c"),
                  vous_ton(g).tn("refl"),m[2])).typ({"int":"yon"}),
    // en: You want me to (2) ?
    // fr: Vous souhaitez (2) ?
    (m,g) => S(vous(g),VP(V("souhaiter"),m[2])),
    // en: goto what
    "goto what"
    ]},
 {"decomp": [star, Adv("pourquoi"),Adv("ne"),C("puis"),je_decomp,Adv("pas"), star], 
    //  pourquoi je ne peux pas // * why can't i *
  "reasmb":[
    // en: Do you think you should be able to (2) ?
    // fr: Pensez-vous que vous devriez pouvoir (2) ? 
    (m,g) => S(vous(g),
               VP(V("penser"),
                  SP(Pro("que"),vous(g),
                     VP(V("pouvoir").t("c"),m[2])
                     ).typ({"mod":"nece"}))
               ).typ({"int":"yon"}),
    // en: Do you want to be able to (2) ?
    // fr: Voulez-vous être capable de (2) ?
    (m,g) => S(vous(g),
               VP(V("vouloir"),
                  VP(V("être").t("b"),
                     AP(A("capable"),P("de"),m[2])))
               ).typ({"int":"yon"}),
    // en: Do you believe this will help you to (2) ?
    // fr: Pensez-vous que cela vous aidera à (2) ?
    (m,g) => S(vous(g),
               VP(V("penser"),
                  SP(Pro("que"),Pro("cela"),
                     VP(V("aider").t("f"),vous_cod(g),
                        P("à"),m[2])))).typ({"int":"yon"}),
    // en: Have you any idea why you can't (2) ?
    // fr: Avez-vous une idée de la raison pour laquelle vous ne pouvez pas (2) ?
    (m,g) => S(vous(g),
               VP(V("avoir"),
                  NP(D("un"),N("idée"),
                     PP(P("pour"),Pro("lequel").g("f"),
                        SP(vous(g),VP(V("pouvoir"),m[2])).typ({"neg":true})
                        )))).typ({"int":"yon"}),
    // en: goto what
    // fr: 
        "goto what"
    ]},
 {"decomp":[star], // *
  "reasmb":[
    // en: goto what
    // fr: 
        "goto what",
    ]}
]},

{"key":"jsRterm", "key_en":"everyone", "rank":2, "pats":[  // everyone
 {"decomp":[star], // * @everyone *
  "reasmb":[
    // en: Really, (2) ?
    // fr: Vraiment ?
    (m,g) => S(Adv("vraiment")).a("?"),
    // en: Surely not (2).
    // fr: Sûrement pas.
    (m,g) => S(Adv("sûrement"),Adv("pas")),
    // en: Can you think of anyone in particular ?
    // fr: Pouvez-vous penser à quelqu'un en particulier ?
    (m,g) => S(vous(g),VP(V("penser"),
                PP(P("à"),Pro("quelqu'un"),P("en"),N("particulier")))).typ({"int":"yon"}),
    // en: Who, for example?
    // fr: Qui, par exemple ? 
    (m,g) => S(Pro("qui").a(","),PP(P("par"),N("exemple"))).a("?"),
    // en: Are you thinking of a very special person ?
    // fr: Pensez-vous à une personne très spéciale ? 
    (m,g) => S(vous(g),VP(V("penser"),PP(P("à"),NP(D("un"),N("personne"),Adv("très"),A("spécial"))))).typ({"int":"yon"}),
    // en: Who, may I ask ?
    // fr: Qui, si je peux me permettre ?
    (m,g) => S(Pro("qui").a(","),SP(C("si"),moi(),VP(V("permettre"))).typ({"mod":"poss","refl":true})).a("?"),
    // en: Someone special perhaps ?
    // fr: Quelqu'un de spécial peut-être ? 
    (m,g) => S(Pro("quelqu'un"),PP(P("de"),A("spécial")),Adv("peut-être")).a("?"),
    // en: You have a particular person in mind, don't you ?
    // fr: Vous pensez à une personne en particulier, n'est-ce pas ? 
    (m,g) => S(vous(g),VP(V("penser"),
            PP(P("à"),NP(D("un"),N("personne"),P("en"),N("particulier"))))).typ({"int":"tag"}),
    // en: Who do you think you're talking about ?
    // fr: De qui pensez-vous parler ? 
    (m,g) => S(vous(g),VP(V("penser"),V("parler").t("b"),PP(P("de"),Pro("lui")))).typ({"int":"woi"}),
    ]}
]},

{"key":Pro('tout').n("p"), "key_en":"everybody", "rank":2, "pats":[  // everybody
 {"decomp":[star], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
    "goto everyone",
    ]}
]},

{"key":Adv("personne"), "key_en":"nobody", "rank":2, "pats":[  // nobody
 {"decomp":[star], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
    "goto everyone",
    ]}
]},

{"key":D("aucun"), "rank":2, "key_en":"noone", "pats":[  // noone
 {"decomp":[star], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
    "goto everyone",
    ]}
]},

{"key":Adv("toujours"), "key_en":"always", "rank":1, "pats":[  // always
 {"decomp":[star], // *
  "reasmb":[
    // en: Can you think of a specific example ?
    // fr: Pouvez-vous penser à un exemple précis ?
    (m,g) => S(vous(g),
               VP(V("penser"),
                  PP(P("à"),
                     NP(D("un"),N("exemple"),A("précis"))))
               ).typ({"int":"yon","mod":"poss"}),
    // en: When ?
    // fr: Quand ?
    (m,g) => S(Adv("quand")).a("?"),
    // en: What incident are you thinking of ?
    // fr: A quel incident pensez-vous ? 
    (m,g) => S(PP(P("à"),A("quel"),N("incident")),
               vous(g),
               VP(V("penser"))).typ({"int":"yon"}),
    // en: Really, always ?
    // fr: Vraiment, toujours ?
    (m,g) => S(Adv("vraiment").a(","),Adv("toujours")).a("?"),
    ]}
]},

{"key":A("semblable"), "key_en":"alike", "rank":10, "pats":[  // alike
 {"decomp":[star], // *
  "reasmb":[
    // en: In what way ?
    // fr:  En quoi ?
    (m,g) => S(P("en"),Pro("quoi")).a("?"),
    // en: What resemblence do you see ?
    // fr: Quelle ressemblance voyez-vous ?
    (m,g) => S(NP(A("quel"),N("ressemblance")),
               SP(vous(g),VP(V("voir"))).typ({"int":"yon"})),
    // en: What does that similarity suggest to you ?
    // fr: Qu'est-ce que cette ressemblance vous suggère?
    (m,g) =>S(NP(D("ce"),N("ressemblance")),
              VP(V("suggérer"),Pro("cela"),vous_coi(g))).typ({"int":"wad"}),
    // en: What other connections do you see ?
    // fr: Quels autres liens voyez-vous ? 
    (m,g) => S(NP(D("quel"),A("autre"),N("lien").n("p")),
               SP(vous(g),VP(V("voir"))).typ({"int":"yon"})),
    // en: What do you suppose that resemblence means ?
    // fr: Que pensez-vous que cette ressemblance signifie ?
    (m,g) => S(vous(g),
               VP(V("penser"),Pro("cela"),
                  SP(Pro("que"),
                     NP(D("ce"),N("ressemblance")),
                     VP(V("signifier"))))).typ({"int":"wad"}),
    // en: What is the connection, do you suppose ?
    // fr: Quel est le lien, à votre avis ?
    (m,g) => S(Pro("quel"),
               VP(V("être"),
                  NP(D("le"),N("lien")),
                  PP(P("à"),NP(votre(),N("avis"))))).a("?"),
    // en: Could there really be some connection ?
    // fr: Pourrait-il vraiment y avoir un lien ? 
    (m,g) => S(Pro("lui").c("nom"),
               VP(V("avoir").t("c"),Pro("y"),
                  NP(D("un"),N("lien")))).typ({"int":"yon","mod":"poss"}),
    // en: How ?
    // fr: Comment ?
    (m,g) => S(Adv("comment")).a("?"),
    ]}
]},

{"key":A("pareil"), "key_en":"like", "rank":10, "pats":[  // like
 {"decomp":[star], // * @be *like *
  "reasmb":[
    // en: goto alike
    // fr: 
    "goto alike"
    ]}
]},

{"key":A("différent"), "key_en":"different", "rank":0, "pats":[  // different
 {"decomp":[star], // *
  "reasmb":[
    // en: How is it different ?
    // fr: En quoi est-ce différent ?
    (m,g) => S(P("en"),Pro("quoi"),
               SP(Pro("ce"),
                  VP(V("être"),A("différent"))).typ({"int":"yon"})),
    // en: What differences do you see ?
    // fr: Quelles différences voyez-vous ?
    (m,g) => S(NP(D("quel"),N("différence").n("p")),
               SP(vous(g),VP(V("voir"))).typ({"int":"yon"})),
    // en: What does that difference suggest to you ?
    // fr: Qu'est-ce que cette différence vous suggère ?
    (m,g) => S(NP(D("ce"),N("différence")),
               VP(V("suggérer"),Pro("cela"),vous_coi(g))).typ({"int":"wad"}),
    // en: What other distinctions do you see ?
    // fr: Quelles autres distinctions voyez-vous ? 
    (m,g) => S(NP(D("quel"),A("autre"),N("distinction").n("p")),
               SP(vous(g),VP(V("voir"))).typ({"int":"yon"})),
    // en: What do you suppose that disparity means ?
    // fr: Que pensez-vous que cette disparité signifie ?
    (m,g) => S(vous(g),
               VP(V("penser"),Pro("cela"),
                  SP(Pro("que"),
                     NP(D("ce"),N("disparité")),
                     VP(V("signifier"))))).typ({"int":"wad"}),
    // en: Could there be some connection, do you suppose ?
    // fr: Pourrait-il y avoir un lien, pensez-vous ?
    (m,g) => S(SP(Pro("lui").c("nom"),
                  VP(V("avoir").t("c"),Pro("y"),NP(D("un"),N("lien")))
                  ).typ({"mod":"poss","int":"yon"}),
               SP(vous(g),VP(V("penser"))).typ({"int":"yon"})),
    // en: How ?
    // fr: Comment ?
    (m,g) => S(Adv("comment").a("?")),
    ]}
]}
]

// affichage de l'organisation des mots-clés
function showTerms(terms){
    if (Array.isArray(terms))
        return "["+ terms.map(t=>t.lemma).join()+"]";
    return terms.lemma
}

function keywordsFrStruct(){
    for (let kw of keywordsFr){
        console.log(showTerms(kw.key),kw.rank,kw.key_en)
        for (let pat of kw.pats){
            console.log("    %s",pat.decomp.map(showTerms).join())
        }
    }
}

// keywordsFrStruct()
