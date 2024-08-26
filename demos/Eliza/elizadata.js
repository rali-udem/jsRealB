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
const vous_cod = (n,g) => vous(n,g).c("acc")
const vous_coi = (n,g) => vous(n,g).c("dat")
const votre = (n) => D(n=="s"?"ton":"votre")

// raccourcis utiles
const svp        = (n) => AdvP(Adv("si"),Pro("lui").c("nom"),VP(Pro("moi").pe(2).n(n||"p").c("dat"),V("plaire")))
const questceque = (...x)=>S(Pro("que"),VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")
const estceque   = (...x)=>S(VP(V("être"),Pro("ce"),Pro("que"),x)).a("?")

// same organization as elizadata.js from https://www.masswerk.at/elizabot/"
// but with objects and property names

// seulement utilisé comme modèle d'entrée 
let modeleKey = [ 
        {"key":Q("*"),rank:0, "pats": [
          {"decomp":[N("nom")],  // 
           "reasmb":[
                  //  phrases en français ; // anglais   
                  (m,n,g) => S(Q(m+n+g))
              ]
          }],      
        },
    ]

let keywordsFr = [
     {"key":Q("*xnone*"),"rank":0, "pats":[// xnone: on ne devrait arriver ici qu'en désespoir de cause...    
        {"decomp":[star],
         "reasmb": [
        // Je ne suis pas sûr de bien vous comprendre », //    "I'm not sure I understand you fully.",
        (m,n,g) => S(moi(),VP(V("être"),A("sûr"),PP(P("de"),Adv("bien"),vous_cod(n,g),V("comprendre").t("b")))).typ({"neg":true}),
        // « Continuez, s'il vous plaît »,//    "Please go on.",
        (m,n,g) => S(V("continuer").t("ip").pe(2).n(n),svp(n)),
        // « Qu'est-ce que cela vous suggère ? », //    "What does that suggest to you ?",
        (m,n,g) => questceque(Pro("cela"),VP(vous_coi(n,g),V("suggérer"))),
        // « Avez-vous envie de discuter de ce genre de choses ? »,//    "Do you feel strongly about discussing such things ?",
        (m,n,g) => S(vous(n,g),VP(V("avoir"),NP(N("envie"),PP(P("de"),VP(V("discuter").t("b"),PP(P("de"),
                            NP(D("ce"),N("genre"),P("de"),N("chose").n("p")))))))).typ({"int":"yon"}),
        // « C'est intéressant.  Continuez, s'il vous plaît »,//    "That is interesting.  Please continue.",
        (m,n,g) => S(Pro("ce"),VP(V("être"),A("intéressant")).a("."),
                        SP(V("continuer").t("ip").pe(2).n(n),svp(n)).cap(true)),
        // « Dites-m'en plus à ce sujet »,//    "Tell me more about that.",
        (m,n,g) => S(VP(V("dire").t("ip").pe(2).n(n),moi_coi(),Pro("en"),
                    AdvP(Adv("plus"),PP(P("à"),NP(D("ce"),N("sujet")))))),
        // « Est-ce que le fait d'en parler vous dérange ? //    "Does talking about this bother you ?"
        (m,n,g) => estceque(NP(D("le"),N("fait"),PP(P("de"),Pro("en"),V("parler").t("b"))),vous_cod(n,g),V("déranger"))
        ]}
    ]},
    {"key":V("excuser"), "rank":0,"pats":[  // sorry
        {"decomp":[star],
         "reasmb":[
        //     « S'il vous plaît, ne vous excusez pas. »,//    "Please don't apologise.",
        (m,n,g) => S(svp(n).a(","),SP(VP(V("excuser").t("ip").pe(2).n(n))).typ({"refl":true,"neg":true})),
        //     « Les excuses ne sont pas nécessaires »,//    "Apologies are not necessary.",
        (m,n,g) => S(NP(D("le"),N("excuse").n("p")),VP(V("être"),A("nécessaire"))).typ({"neg":true}),
        //     « Je vous ai dit que les excuses n'étaient pas nécessaires »,//    "I've told you that apologies are not required.",
        (m,n,g) => S(moi(),vous_coi(n,g),VP(V("dire").t("pc"),Pro("que"),
                    SP(NP(D("le"),N("excuse").n("p")),VP(V("être").t("i"),A("nécessaire"))).typ({"neg":true}))),
        //     « Cela ne m'a pas dérangé.  Veuillez continuer."]]]], //    "It did not bother me.  Please continue."
        (m,n,g) => S(SP(Pro("cela"),moi_cod(n,g),VP(V("déranger").t("pc"))).typ({"neg":true}).a("."),
                    SP(V("vouloir").t("ip").pe(2).n(n),V("continuer").t("b")).cap(true))
        ]}
    ]},
    {"key":N("pardon"),"rank":0,"pats":[  // apologize
        {"decomp":[star],
         "reasmb":[
            V("excuser")  // goto "excuser"
        ]}
    ]},
    {"key":V("rappeler"),"rank":5,"pats":[  // remember
        {"decomp":[star,je_pat,me_pat,V("rappeler"),star], // * je me rappelle *  // "* i remember *"
        "reasmb":[
            //     [« Pensez-vous souvent à (2) ? »,  "Do you often think of (2) ?",
        (m,n,g) => S(vous(n,g),VP(V("penser"),Adv("souvent"),PP(P("à"),m[2]))).typ({"int":"yon"}),
            //      « Le fait de penser à (2) vous rappelle-t-il quelque chose?,  "Does thinking of (2) bring anything else to mind ?",
        (m,n,g) => S(NP(D("le"),N("fait"),PP(P("de"),VP(V("penser").t("b"),PP(P("à"),m[2])))),
                    VP(vous_coi(n,g),V("rappeler"),NP(D("quelque"),N("chose")))).typ({"int":"yon"}),
            //      « De quoi d'autre vous souvenez-vous ? »,"What else do you recollect ?",
        (m,n,g) => S(PP(P("de"),Pro("quoi"),P("de"),N("autre")),VP(V("souvenir").pe(2).n(n).lier(),vous(n,g))).a("?"),
            //      « Pourquoi vous souvenez-vous de (2) à l'instant ? »,"Why do you remember (2) just now ?",
        (m,n,g) => S(Adv("pourquoi"),VP(V("souvenir").pe(2).n(n).lier(),vous(n,g)),
                    PP(P("de"),m[2]),PP(P("à"),NP(D("le"),N("instant")))).a("?"),
            //      « Qu'est-ce qui, dans la situation actuelle, vous rappelle (2) ?"What in the present situation reminds you of (2) ?",
        (m,n,g) => S(Pro("que"),VP(V("être"),Pro("ce"),Pro("qui").a(","),
                     PP(P("dans"),NP(D("le"),N("situation"),A("actuel"))).a(","),
                     SP(vous_coi(n,g)),VP(V("rappeler"),m[2]))).a("?"),
            //      « Quel est le lien entre moi et (2) ?"What is the connection between me and (2) ?",
        (m,n,g) => S(Pro("quel"),VP(V("être"),NP(D("le"),N("lien"),PP(P("entre"),moi(),C("et"),m[2])))).a("?"),
            //      « Qu'est-ce que (2) vous rappelle d'autre ?"]],] "What else does (2) remind you of ?"
        (m,n,g) => questceque(m[2],VP(vous_coi(n,g),V("rappeler"),D("de"),N("autre"))).a("?")
        ]},
        {"decomp":[star,vous_pat,vous_pat,V("rappeler").n("p").pe(2),P("de"),star],  // * vous vous souvenez de *  "* do you remember *",
         "reasmb":[
                //     [« Comment pourrais-je oublier (2) ? », "Did you think I would forget (2) ?",
            (m,n,g) => S(moi(),VP(V("oublier").t('c'),m[2])).typ({"int":"how","mod":"poss"}),
                //      « De quoi dois-je me souvenir à propos de (2) ? »,"Why do you think I should recall (2) now ?",
            (m,n,g) => S(PP(P("de"),Pro("quoi")),moi(),
                        VP(V("souvenir").pe(1).n(n),PP(P("à"),N("propos"),P("de"),m[2]))).typ({"mod":"nece","int":"yon"})
                // "What about (2) ?",
                // "goto what",
                // "You mentioned (2) ?"
            ]},
        ]},
     {"key":V("oublier"),"rank":5,"pats":[
        {"decomp":[star,je_pat,V("oublier"),star], // * j'oublie * // "* i forget *"
         "reasmb":[
             // Pouvez-vous penser à la raison pour laquelle vous pourriez oublier (2) ? "Can you think of why you might forget (2) ?",
            (m,n,g) => {
                 return S(vous(n, g), VP(V("penser"), PP(P("à"), NP(D("le"), N("raison"), PP(P("pour"), Pro("lequel").g("f"),
                     SP(vous(n, g), VP(V("oublier").t("c"), m[2])).typ({ "mod": "poss" })))))).typ({ 'int': "yon", "mod": "poss" })
             },
                    // Pourquoi ne vous souvenez-vous pas de (2) ?  "Why can't you remember (2) ?",
            (m,n,g) => S(vous(n,g),VP(V("souvenir"),PP(P("de"),m[2]))).typ({'int':"why","neg":true}),
                    // Combien de fois pensez-vous à (2) ?  // "How often do you think of (2) ?",
            (m,n,g) => S(AdvP(Adv("combien"),P("de"),N("fois")),vous(n,g),VP(V("penser"),PP(P("à"),m[2]))).typ({"int":"yon"}),
                    // Cela vous gêne-t-il d'oublier cela ? // "Does it bother you to forget that ?",
            (m,n,g) => S(Pro("cela"),VP(vous_cod(n,g),V("gêner").lier(),Pro("je"),SP(P("de"),V("oublier").t("b"),Pro("cela")))).a("?"),
                    // Serait-ce un blocage mental ? // "Could it be a mental block ?",
            (m,n,g) => S(Pro("ce"),VP(V("être").t("c").aux("êt"),NP(D("un"),N("blocage"),A("mental")))).typ({"int":"yon"}),
                    // Êtes-vous généralement distrait ? // "Are you generally forgetful ?",
            (m,n,g)  => S(vous(n,g),VP(V("être"),Adv("généralement"),A("distrait"))).typ({"int":"yon"}),
                    // Pensez-vous que vous supprimez (2) ?// "Do you think you are suppressing (2) ?"     
            (m,n,g)  => S(vous(n,g),VP(V("penser"),SP(Pro("que"),vous(n,g),VP(V("supprimer"),m[2])))).typ({"int":"yon"})
            ]},
        {"decomp":[star,V("avoir").t("p").pe(2).n("p"),vous_pat,V("oublier").t("pp"),star],  // * avez-vous oublié * "* did you forget *"
         "reasmb":[
                // Pourquoi demandez-vous ?,"Why do you ask ?",
            (m,n,g)  => S(vous(n,g),VP(V("demander"))).typ({"int":"why"}),
                // Êtes-vous sûr de ce que vous m'avez dit ?"Are you sure you told me ?",
            (m,n,g)  => S(vous(n,g),VP(V("être"),A("sûr"),PP(P("de"),Pro("ce"),
                        SP(Pro("que"),vous(n,g),VP(V("dire").t("pc"),moi_coi()))))).typ({"int":"why"}),
                // Cela vous dérangerait-il si j'oubliais (2) ? "Would it bother you if I forgot (2) ?",
            (m,n,g) => S(Pro("cela"),vous_cod(n,g), VP(V("déranger").t("c").lier(),Pro("lui").c("nom"),
                        SP(C("si"),moi(),VP(V("oublier").t("i"),m[2])))),
                // Pourquoi devrais-je me rappeler (2) à l'instant ? "Why should I recall (2) just now ?",
            (m,n,g) => S(moi(),VP(Pro("me").pe(1).c("acc"),V("rappeler").t("c"),
                    PP(P("de"),m[2]),PP(P("à"),NP(D("le"),N("instant"))))).typ({"int":"why","mod":"nece"}),
            // "goto what",
                // Dites-m'en plus sur (2)  "Tell me more about (2)."
            (m,n,g) => S(VP(V("dire").t("ip").pe(2).n(n),moi_coi(),Pro("en"),AdvP(Adv("plus"),PP(P("sur"),m[2]))))
            ]}
        ]},
    {"key":[N("ordinateur"),N("machine")],rank:50, "pats": [
        {"decomp":[Q("*")],  // 
        "reasmb":[
                // « Les ordinateurs vous inquiètent-ils ?// "Do computers worry you ?",
            (m,n,g) => S(NP(D("le"),N("ordinateur").n("p")),VP(V("inquiéter"),vous_cod(n,g))).typ({"int":"yon"}),
                // « Pourquoi parlez-vous d'ordinateurs ?// "Why do you mention computers ?",
            (m,n,g) =>S(vous(n,g),VP(V("parler"),NP(D("de"),N("ordinateur").n("p")))).typ({"int":"why"}),
                // « Quel est, selon vous, le rapport entre les machines et votre problème ? »,
                // "What do you think machines have to do with your problem ?",
            (m,n,g) =>S(A("quel"),VP(V("être"),NP(D("le"),N("rapport"),
                      PP(P("entre"),CP(C("et"),NP(D("le"),N("machine").n("p")),NP(votre(n),N("problème"))))))),
                // « Ne pensez-vous pas que les ordinateurs peuvent aider les gens ? »,
                // "Don't you think computers can help people ?",
            (m,n,g) =>S(vous(n,g),VP(V("penser"),SP(Pro("que"),NP(D("le"),N("ordinateur").n("p")),
                       VP(V("pouvoir"),V("aider").t("b"),NP(D("le"),N("gens").n("p")))))).typ({"int":"yon","neg":true}),
                // « Qu'est-ce qui vous inquiète dans les machines ?// "What about machines worries you ?",
            (m,n,g) =>S(Pro("cela"),VP(vous_cod(n,g),V("inquiéter"),
                       PP(P("dans"),NP(D("le"),N("machine").n("p"))))).typ({"int":"was"}),    
                // « Que pensez-vous des machines ? »,// "What do you think about machines ?",
            (m,n,g) =>S(vous(n,g),VP(V("penser"),Pro("cela"),
                PP(P("de"),NP(D("le"),N("machine").n("p"))))).typ({"int":"wad"}),
                // « Vous ne pensez pas que je suis un programme informatique, n'est-ce pas ? »
                // "You don't think I am a computer program, do you ?"
            (m,n,g) => S(vous(n,g),VP(V("penser"),SP(Pro("que"),moi(),VP(V("être"),
                         NP(D("un"),N("programme"),A("informatique")))))).typ({"int":"tag","neg":true})  
            ]
        }],      
        },
  
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