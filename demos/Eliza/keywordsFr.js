/* uncomment this for testing this file alone */
import { N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP } from "../../src/jsRealB.js"

export {keywordsFr}

// pour decomp seulement... doit matcher la sortie de lemmatize
const star = Q("*")
const je_pat = Pro("je").pe(1)
const me_pat = Pro("me").pe(1)
const vous_pat = Pro("je").pe(2).n("p")

// pronoms paramétrables
const moi = () => Pro("moi").pe(1).c("nom")
const moi_cod = () => moi().c("acc")
const moi_coi = () => moi().c("dat")
const vous = (n,g) => Pro("moi").pe(2).n(n).g(g).c("nom")
const vous_ton = (n,g) => Pro("moi").pe(2).n(n).g(g).tn("")
const vous_cod = (n,g) => vous(n,g).c("acc")
const vous_coi = (n,g) => vous(n,g).c("dat")
const votre = (n) => D(n=="s"?"ton":"votre")

// raccourcis utiles
const svp        = (n) => AdvP(Adv("si"),Pro("lui").c("nom"),VP(Pro("moi").pe(2).n(n).c("dat"),V("plaire")))
const questceque = (...x)=>S(Pro("que"),VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")
const estceque   = (...x)=>S(VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")

// same organization as elizadata.js from https://www.masswerk.at/elizabot/"
// but with objects and property names

let keywordsFr =
[{"key":Q("*xnone*"), "rank":0, "pats":[  // xnone: on ne devrait arriver ici qu'en désespoir de cause...    
 {"decomp":[star], // *
  "reasmb":[
    // en: I'm not sure I understand you fully.
    // fr: Je ne suis pas sûr de bien vous comprendre 
    (m,n,g) => S(moi(),VP(V("être"),A("sûr"),PP(P("de"),Adv("bien"),vous_cod(n,g),V("comprendre").t("b")))).typ({"neg":true}),
    // en: Please go on.
    // fr: Continuez, s'il vous plaît
    (m,n,g) => S(V("continuer").t("ip").pe(2).n(n),svp(n)),
    // en: What does that suggest to you ?
    // fr: Qu'est-ce que cela vous suggère ?
    (m,n,g) => questceque(Pro("cela"),VP(vous_coi(n,g),V("suggérer"))),
    // en: Do you feel strongly about discussing such things ?
    // fr:  Avez-vous envie de discuter de ce genre de choses ? 
    (m,n,g) => S(vous(n,g),VP(V("avoir"),NP(N("envie"),PP(P("de"),VP(V("discuter").t("b"),PP(P("de"),
                 NP(D("ce"),N("genre"),P("de"),N("chose").n("p")))))))).typ({"int":"yon"}),
    // en: That is interesting.  Please continue.
    // fr: C'est intéressant.  Continuez, s'il vous plaît 
    (m,n,g) => S(Pro("ce"),VP(V("être"),A("intéressant")).a("."),SP(V("continuer").t("ip").pe(2).n(n),svp(n)).cap(true)),
    // en: Tell me more about that.
    // fr: Dites-m'en plus à ce sujet
    (m,n,g) => S(VP(V("dire").t("ip").pe(2).n(n),moi_coi(),Pro("en"),
                    AdvP(Adv("plus"),PP(P("à"),NP(D("ce"),N("sujet")))))),
    // en: Does talking about this bother you ?
    // fr: Est-ce que le fait d'en parler vous dérange ?
    (m,n,g) => estceque(NP(D("le"),N("fait"),PP(P("de"),Pro("en"),V("parler").t("b"))),vous_cod(n,g),V("déranger"))
]}
]},
{"key":V("excuser"), "rank":0, "pats":[  // sorry
 {"decomp":[star], // *
  "reasmb":[
    // en: Please don't apologise.
    // fr: S'il vous plaît, ne vous excusez pas.
    (m,n,g) => S(svp(n).a(","),SP(VP(V("excuser").t("ip").pe(2).n(n))).typ({"refl":true,"neg":true})),
    // en: Apologies are not necessary.
    // fr: Les excuses ne sont pas nécessaires
    (m,n,g) => S(NP(D("le"),N("excuse").n("p")),VP(V("être"),A("nécessaire"))).typ({"neg":true}),
    // en: I've told you that apologies are not required.
    // fr: Je vous ai dit que les excuses n'étaient pas nécessaires
    (m,n,g) => S(moi(),vous_coi(n,g),VP(V("dire").t("pc"),Pro("que"),
                SP(NP(D("le"),N("excuse").n("p")),VP(V("être").t("i"),A("nécessaire"))).typ({"neg":true}))),
    // en: It did not bother me.  Please continue.
    // fr: Cela ne m'a pas dérangé.  Veuillez continuer.
    (m,n,g) => S(SP(Pro("cela"),moi_cod(n,g),VP(V("déranger").t("pc"))).typ({"neg":true}).a("."),
                 SP(V("vouloir").t("ip").pe(2).n(n),V("continuer").t("b")).cap(true))
    ]}
]},
{"key":N("pardon"), "rank":0, "pats":[  // apologise
 {"decomp":[star], // *
  "reasmb":[
    // en: goto sorry
        V("excuser"),
    ]}
]},
{"key":V("rappeler"), "rank":5, "pats":[  // remember
 {"decomp":[star,je_pat,me_pat,V("rappeler"),star], // * je me rappelle *  // "* i remember *"
  "reasmb":[
    // en: Do you often think of (2) ?
    // fr: Pensez-vous souvent à (2)
    (m,n,g) => S(vous(n,g),VP(V("penser"),Adv("souvent"),PP(P("à"),m[2]))).typ({"int":"yon"}),
    // en: Does thinking of (2) bring anything else to mind ?
    // fr: Le fait de penser à (2) vous rappelle-t-il quelque chose?
    (m,n,g) => S(NP(D("le"),N("fait"),PP(P("de"),VP(V("penser").t("b"),PP(P("à"),m[2])))),
                 VP(vous_coi(n,g),V("rappeler"),NP(D("quelque"),N("chose")))).typ({"int":"yon"}),
    // en: What else do you recollect ?
    // fr: De quoi d'autre vous souvenez-vous ?
    (m,n,g) => S(PP(P("de"),Pro("quoi"),P("de"),N("autre")),VP(V("souvenir").pe(2).n(n).lier(),vous(n,g))).a("?"),
    // en: Why do you remember (2) just now ?
    // fr: Pourquoi vous souvenez-vous de (2) à l'instant ?
    (m,n,g) => S(Adv("pourquoi"),VP(V("souvenir").pe(2).n(n).lier(),vous(n,g)),
                 PP(P("de"),m[2]),PP(P("à"),NP(D("le"),N("instant")))).a("?"),
    // en: What in the present situation reminds you of (2) ?
    // fr: Qu'est-ce qui, dans la situation actuelle, vous rappelle (2)
    (m,n,g) => S(Pro("que"),VP(V("être"),Pro("ce"),Pro("qui").a(","),PP(P("dans"),NP(D("le"),N("situation"),A("actuel"))).a(","),
                 SP(vous_coi(n,g)),VP(V("rappeler"),m[2]))).a("?"),
    // en: What is the connection between me and (2) ?
    // fr: Quel est le lien entre moi et (2)
    (m,n,g) => S(Pro("quel"),VP(V("être"),NP(D("le"),N("lien"),PP(P("entre"),moi(),C("et"),m[2])))).a("?"),
    // en: What else does (2) remind you of ?
    // fr: Qu'est-ce que (2) vous rappelle d'autre ?
    (m,n,g) => questceque(m[2],VP(vous_coi(n,g),V("rappeler"),D("de"),N("autre"))).a("?")
    ]},
    {"decomp":[star,vous_pat,vous_pat,V("rappeler").n("p").pe(2),P("de"),star],  // * vous vous souvenez de // * do you remember *
     "reasmb":[
    // en: Did you think I would forget (2) ?
    // fr: Comment pourrais-je oublier (2) ?
    (m,n,g) => S(moi(),VP(V("oublier").t('c'),m[2])).typ({"int":"how","mod":"poss"}),
    // en: Why do you think I should recall (2) now ?
    // fr: De quoi dois-je me souvenir à propos de (2) ?
    (m,n,g) => S(PP(P("de"),Pro("quoi")),moi(),
                 VP(V("souvenir").pe(1).n(n),PP(P("à"),N("propos"),P("de"),m[2]))).typ({"mod":"nece","int":"yon"}),
    // en: What about (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You mentioned (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},
    {"decomp":[N("nom")], // * you remember *
     "reasmb":[
    // en: How could I forget (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What about (2) should I remember ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto you
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":V("oublier"), "rank":5, "pats":[  // forget
 {"decomp":[star,je_pat,V("oublier"),star], // * j'oublie *  // * i forget *
  "reasmb":[
    // en: Can you think of why you might forget (2) ?
    // fr: Pouvez-vous penser à la raison pour laquelle vous pourriez oublier (2) ?
    (m,n,g) => S(vous(n, g), VP(V("penser"), PP(P("à"), NP(D("le"), N("raison"), PP(P("pour"), Pro("lequel").g("f"),
                 SP(vous(n, g), VP(V("oublier").t("c"), m[2])).typ({ "mod": "poss" })))))).typ({ 'int': "yon", "mod": "poss" }),
    // en: Why can't you remember (2) ?
    // fr: Pourquoi ne vous souvenez-vous pas de (2) ? 
    (m,n,g) => S(vous(n,g),VP(V("souvenir"),PP(P("de"),m[2]))).typ({'int':"why","neg":true}),
    // en: How often do you think of (2) ?
    // fr: Combien de fois pensez-vous à (2) ? 
    (m,n,g) => S(AdvP(Adv("combien"),P("de"),N("fois")),vous(n,g),VP(V("penser"),PP(P("à"),m[2]))).typ({"int":"yon"}),
    // en: Does it bother you to forget that ?
    // fr: Cela vous gêne-t-il d'oublier cela ?
    (m,n,g) => S(Pro("cela"),VP(vous_cod(n,g),V("gêner").lier(),Pro("je"),SP(P("de"),V("oublier").t("b"),Pro("cela")))).a("?"),
    // en: Could it be a mental block ?
    // fr: Serait-ce un blocage mental ?
    (m,n,g) => S(Pro("ce"),VP(V("être").t("c").aux("êt"),NP(D("un"),N("blocage"),A("mental")))).typ({"int":"yon"}),
    // en: Are you generally forgetful ?
    // fr: Êtes-vous généralement distrait ?
    (m,n,g)  => S(vous(n,g),VP(V("être"),Adv("généralement"),A("distrait"))).typ({"int":"yon"}),
    // en: Do you think you are suppressing (2) ?
    // fr: Pensez-vous que vous supprimez (2) ?
    (m,n,g)  => S(vous(n,g),VP(V("penser"),SP(Pro("que"),vous(n,g),VP(V("supprimer"),m[2])))).typ({"int":"yon"})
    ]},
    {"decomp":[star,V("avoir").t("p").pe(2).n("p"),vous_pat,V("oublier").t("pp"),star],  // * avez-vous oublié *  // * did you forget *
     "reasmb":[
    // en: Why do you ask ?
    // fr: Pourquoi demandez-vous ?,
    (m,n,g)  => S(vous(n,g),VP(V("demander"))).typ({"int":"why"}),
    // en: Are you sure you told me ?
    // fr: Êtes-vous sûr de ce que vous m'avez dit ?
    (m,n,g)  => S(vous(n,g),VP(V("être"),A("sûr"),PP(P("de"),Pro("ce"),
                  SP(Pro("que"),vous(n,g),VP(V("dire").t("pc"),moi_coi()))))).typ({"int":"why"}),
    // en: Would it bother you if I forgot (2) ?
    // fr: Cela vous dérangerait-il si j'oubliais (2) ?
    (m,n,g) => S(Pro("cela"),vous_cod(n,g), VP(V("déranger").t("c").lier(),Pro("lui").c("nom"),
                SP(C("si"),moi(),VP(V("oublier").t("i"),m[2])))),
    // en: Why should I recall (2) just now ?
    // fr: Pourquoi devrais-je me rappeler (2) à l'instant ?
    (m,n,g) => S(moi(),VP(Pro("moi").pe(1).c("acc"),V("rappeler").t("c"),
                 PP(P("de"),m[2]),PP(P("à"),NP(D("le"),N("instant"))))).typ({"int":"why","mod":"nece"}),
    // en: goto what
    // fr: 
        Pro("quoi"),
    // en: Tell me more about (2).
    // fr: Dites-m'en plus sur (2)
    (m,n,g) => S(VP(V("dire").t("ip").pe(2).n(n),moi_coi(),Pro("en"),AdvP(Adv("plus"),PP(P("sur"),m[2]))))
]}
]},
{"key":"jsRterm", "rank":3, "pats":[  // if
 {"decomp":[N("nom")], // * if *
  "reasmb":[
    // en: Do you think it's likely that (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you wish that (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What do you know about (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Really, if (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What would you do if (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: But what are the chances that (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What does this speculation lead to ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":4, "pats":[  // dreamed
 {"decomp":[N("nom")], // * i dreamed *
  "reasmb":[
    // en: Really, (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you ever fantasized (2) while you were awake ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you ever dreamed (2) before ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto dream
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":3, "pats":[  // dream
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: What does that dream suggest to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you dream often ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What persons appear in your dreams ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you believe that dreams have something to do with your problem ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // perhaps
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: You don't seem quite certain.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why the uncertain tone ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can't you be more positive ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You aren't sure ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Don't you know ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: How likely, would you estimate ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":15, "pats":[  // name
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: I am not interested in names.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I've told you before, I don't care about names -- please continue.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // deutsch
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto xforeign
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I told you before, I don't understand German.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // francais
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto xforeign
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I told you before, I don't understand French.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // italiano
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto xforeign
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I told you before, I don't understand Italian.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // espanol
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto xforeign
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I told you before, I don't understand Spanish.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // xforeign
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: I speak only English.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // hello
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: How do you do.  Please state your problem.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Hi.  What seems to be your problem ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":[N("ordinateur"),N("machine")], "rank":50, "pats":[  // computer
 {"decomp":[Q("*")], // *
  "reasmb":[
    // en: Do computers worry you ?
    // fr: Les ordinateurs vous inquiètent-ils ?
    (m,n,g) => S(NP(D("le"),N("ordinateur").n("p")),VP(V("inquiéter"),vous_cod(n,g))).typ({"int":"yon"}),
    // en: Why do you mention computers ?
    // fr: Pourquoi parlez-vous d'ordinateurs ?
    (m,n,g) =>S(vous(n,g),VP(V("parler"),NP(D("de"),N("ordinateur").n("p")))).typ({"int":"why"}),
    // en: What do you think machines have to do with your problem ?
    // fr: Quel est, selon vous, le rapport entre les machines et votre problème ?
    (m,n,g) =>S(Pro("quel"),VP(V("être").a(","),PP(P("selon"),vous_ton(n,g)).a(","),
                NP(D("le"),N("rapport"),PP(P("entre"),
                    CP(C("et"),NP(D("le"),N("machine").n("p")),NP(votre(n),N("problème"))))))),
    // en: Don't you think computers can help people ?
    // fr: Ne pensez-vous pas que les ordinateurs peuvent aider les gens ?
    (m,n,g) =>S(vous(n,g),VP(V("penser"),SP(Pro("que"),NP(D("le"),N("ordinateur").n("p")),
                VP(V("pouvoir"),V("aider").t("b"),NP(D("le"),N("gens").n("p")))))).typ({"int":"yon","neg":true}),
    // en: What about machines worries you ?
    // fr: Qu'est-ce qui vous inquiète dans les machines ?
    (m,n,g) =>S(Pro("cela"),VP(vous_cod(n,g),V("inquiéter"),
                PP(P("dans"),NP(D("le"),N("machine").n("p"))))).typ({"int":"was"}),    
    // en: What do you think about machines ?
    // fr: Que pensez-vous des machines ?
    (m,n,g) =>S(vous(n,g),VP(V("penser"),Pro("cela"),PP(P("de"),NP(D("le"),N("machine").n("p"))))).typ({"int":"wad"}),
    // en: You don't think I am a computer program, do you ?
    // fr: Vous ne pensez pas que je suis un programme informatique, n'est-ce pas ?
    (m,n,g) => S(vous(n,g),VP(V("penser"),SP(Pro("que"),moi(),VP(V("être"),
                NP(D("un"),N("programme"),A("informatique")))))).typ({"int":"tag","neg":true}),          
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // am
 {"decomp":[N("nom")], // * am i *
  "reasmb":[
    // en: Do you believe you are (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Would you want to be (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you wish I would tell you you are (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What would it mean if you were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i am *
  "reasmb":[
    // en: goto i
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // *
  "reasmb":[
    // en: Why do you say 'am' ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I don't understand that.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // are
 {"decomp":[N("nom")], // * are you *
  "reasmb":[
    // en: Why are you interested in whether I am (2) or not ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Would you prefer if I weren't (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps I am (2) in your fantasies.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you sometimes think I am (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Would it matter to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What if I were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * you are *
  "reasmb":[
    // en: goto you
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * are *
  "reasmb":[
    // en: Did you think they might not be (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Would you like it if they were not (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What if they were not (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are they always (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Possibly they are (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are you positive they are (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // your
 {"decomp":[N("nom")], // * your *
  "reasmb":[
    // en: Why are you concerned over my (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What about your own (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are you worried about someone else's (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Really, my (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What makes you think of my (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you want my (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // was
 {"decomp":[N("nom")], // * was i *
  "reasmb":[
    // en: What if you were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you think you were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Were you (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What would it mean if you were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What does ' (2) ' suggest to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i was *
  "reasmb":[
    // en: Were you really ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why do you tell me you were (2) now ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps I already know you were (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * was you *
  "reasmb":[
    // en: Would you like to believe I was (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What suggests that I was (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What do you think ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps I was (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What if I had been (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // i
 {"decomp":[N("nom")], // * i @desire *
  "reasmb":[
    // en: What would it mean to you if you got (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why do you want (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Suppose you got (3) soon.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What if you never got (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What would getting (3) mean to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What does wanting (3) have to do with this discussion ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i am* @sad *
  "reasmb":[
    // en: I am sorry to hear that you are (3).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you think coming here will help you not to be (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I'm sure it's not pleasant to be (3).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can you explain what made you (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i am* @happy *
  "reasmb":[
    // en: How have I helped you to be (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Has your treatment made you (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What makes you (3) just now ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can you explain why you are suddenly (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i was *
  "reasmb":[
    // en: goto was
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i @belief i *
  "reasmb":[
    // en: Do you really think so ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: But you are not sure you (3).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you really doubt you (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i* @belief *you *
  "reasmb":[
    // en: goto you
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i am *
  "reasmb":[
    // en: Is it because you are (2) that you came to me ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: How long have you been (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you believe it is normal to be (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you enjoy being (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you know anyone else who is (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i @cannot *
  "reasmb":[
    // en: How do you know that you can't (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you tried ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps you could (3) now.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you really want to be able to (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What if you could (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i don't *
  "reasmb":[
    // en: Don't you really (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why don't you (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you wish to be able to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does that trouble you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i feel *
  "reasmb":[
    // en: Tell me more about such feelings.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you often feel (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you enjoy feeling (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Of what does feeling (2) remind you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * i * you *
  "reasmb":[
    // en: Perhaps in your fantasies we (2) each other.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you wish to (2) me ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You seem to need to (2) me.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you (2) anyone else ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // *
  "reasmb":[
    // en: You say (1) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can you elaborate on that ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you say (1) for some special reason ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: That's quite interesting.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // you
 {"decomp":[N("nom")], // * you remind me of *
  "reasmb":[
    // en: goto alike
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * you are *
  "reasmb":[
    // en: What makes you think I am (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does it please you to believe I am (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you sometimes wish you were (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps you would like to be (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * you* me *
  "reasmb":[
    // en: Why do you think I (2) you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You like to think I (2) you -- don't you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What makes you think I (2) you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Really, I (2) you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you wish to believe I (2) you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Suppose I did (2) you -- what would that mean ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does someone else believe I (2) you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * you *
  "reasmb":[
    // en: We were discussing you -- not me.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Oh, I (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You're not really talking about me -- are you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What are your feelings now ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // yes
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: You seem to be quite positive.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You are sure.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I see.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: I understand.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // no
 {"decomp":[N("nom")], // * no one *
  "reasmb":[
    // en: Are you sure, no one (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Surely someone (2) .
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can you think of anyone at all ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are you thinking of a very special person ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who, may I ask ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You have a particular person in mind, don't you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who do you think you are talking about ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // *
  "reasmb":[
    // en: Are you saying no just to be negative?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You are being a bit negative.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why not ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why 'no' ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // my
 {"decomp":[N("nom")], // $ * my *
  "reasmb":[
    // en: Does that have anything to do with the fact that your (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Lets discuss further why your (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Earlier you said your (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: But your (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * my* @family *
  "reasmb":[
    // en: Tell me more about your family.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who else in your family (4) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Your (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What else comes to your mind when you think of your (3) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * my *
  "reasmb":[
    // en: Your (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Why do you say your (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does that suggest anything else which belongs to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Is it important to you that your (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // can
 {"decomp":[N("nom")], // * can you *
  "reasmb":[
    // en: You believe I can (2) don't you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You want me to be able to (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps you would like to be able to (2) yourself.
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * can i *
  "reasmb":[
    // en: Whether or not you can (2) depends on you more than on me.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you want to be able to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps you don't want to (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // what
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: Why do you ask ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does that question interest you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What is it you really want to know ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are such questions much on your mind ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What answer would please you most ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What do you think ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What comes to mind when you ask that ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you asked such questions before ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you asked anyone else ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // who
 {"decomp":[N("nom")], // who *
  "reasmb":[
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // when
 {"decomp":[N("nom")], // when *
  "reasmb":[
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // where
 {"decomp":[N("nom")], // where *
  "reasmb":[
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // how
 {"decomp":[N("nom")], // how *
  "reasmb":[
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // because
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: Is that the real reason ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Don't any other reasons come to mind ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Does that reason seem to explain anything else ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What other reasons might there be ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // why
 {"decomp":[N("nom")], // * why don't you *
  "reasmb":[
    // en: Do you believe I don't (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Perhaps I will (2) in good time.
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Should you (2) yourself ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You want me to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // * why can't i *
  "reasmb":[
    // en: Do you think you should be able to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you want to be able to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Do you believe this will help you to (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Have you any idea why you can't (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]},{"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto what
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // everyone
 {"decomp":[N("nom")], // * @everyone *
  "reasmb":[
    // en: Really, (2) ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Surely not (2).
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Can you think of anyone in particular ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who, for example?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Are you thinking of a very special person ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who, may I ask ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Someone special perhaps ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: You have a particular person in mind, don't you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Who do you think you're talking about ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // everybody
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // nobody
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":2, "pats":[  // noone
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: goto everyone
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":1, "pats":[  // always
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: Can you think of a specific example ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: When ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What incident are you thinking of ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Really, always ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":10, "pats":[  // alike
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: In what way ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What resemblence do you see ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What does that similarity suggest to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What other connections do you see ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What do you suppose that resemblence means ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What is the connection, do you suppose ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Could there really be some connection ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: How ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":10, "pats":[  // like
 {"decomp":[N("nom")], // * @be *like *
  "reasmb":[
    // en: goto alike
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]},
{"key":"jsRterm", "rank":0, "pats":[  // different
 {"decomp":[N("nom")], // *
  "reasmb":[
    // en: How is it different ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What differences do you see ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What does that difference suggest to you ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What other distinctions do you see ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: What do you suppose that disparity means ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: Could there be some connection, do you suppose ?
    // fr: 
        (m,n,g) => Q("à faire"),
    // en: How ?
    // fr: 
        (m,n,g) => Q("à faire"),
    ]}
]}
]

// trier les mots clés par ordre décroissant de "rank"
keywordsFr.sort((k1,k2) => k2.rank - k1.rank )

/*  à placer dans la page web de la démo d'évaluation de jsRealB

const moi = () => Pro("moi").pe(1).c("nom")
const moi_cod = () => moi().c("acc")
const moi_coi = () => moi().c("dat")
const vous = (n,g) => Pro("moi").pe(2).n(n).g(g).c("nom")
const vous_ton = (n,g) => Pro("moi").pe(2).n(n).g(g).tn("")
const vous_cod = (n,g) => vous(n,g).c("acc")
const vous_coi = (n,g) => vous(n,g).c("dat")
const votre = (n) => D(n=="s"?"ton":"votre")
const svp        = (n) => AdvP(Adv("si"),Pro("lui").c("nom"),VP(Pro("moi").pe(2).n(n||"p").c("dat"),V("plaire")))
const questceque = (...x)=>S(Pro("que"),VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")
const estceque   = (...x)=>S(VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")

let m = ["(0)","(1)","(2)"]
let f = (m,n,g) =>S(vous(n,g),VP(V("penser"),Pro("cela"),
                PP(P("de"),NP(D("le"),N("machine").n("p"))))).typ({"int":"wad"})

S(f(m,"s","m"),Q("##"),f(m,"p","f"))

*/