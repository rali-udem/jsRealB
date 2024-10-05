import {elizaInitials, elizaQuits, elizaFinals, keywordsFr, enKeys, select, choose, 
        tokenizeFr,mememot,matchDecomp, getTerminals, showTerminalLists, getKeyword, 
        getQuestion, changePerson} from "./eliza.js"


let user_gender="m";
let eliza_gender="f";
let use_majestic= true;
let trace = false;


function ask(fn,groups,infos){
    let expr = fn(groups,user_gender).typ({"maje":use_majestic});
    if (trace) console.log(expr.toSource())
    let res = "Eliza  : "+ expr.realize()
    if (trace) res+=":"+infos
    console.log(res)
}

function runScript(inputs){
    console.log("Discussion avec Eliza: \n  genre du patient:%s, genre d'Eliza:%s vouvoiement: %s\n",
        user_gender,eliza_gender,use_majestic?"oui":"non")
    ask(choose(elizaInitials),[],": initials")  // initial prompt
    for (let input of inputs){
        console.log("Patient: "+input)              // get next input
        if (elizaQuits.includes(input.toLowerCase())){
            ask(choose(elizaFinals),[],": finals") // last answer
        } else {
            // transform input to reply
            let terminals = tokenizeFr(input).map(getTerminals);
            // if (trace) showTerminalLists(terminals)
            const keyWord = getKeyword(terminals)
            if (keyWord==null){
                ask(select(enKeys["xnone"].pats[0]),[],": xnone:"+enKeys["xnone"].pats[0].idx_reasmb)
            } else {
                let [questionFn,groups] = getQuestion(terminals,keyWord,use_majestic,trace)
                if (questionFn != null){
                    ask(questionFn,groups,"")
                } else {
                    console.log("*** pas de question trouvée...")
                }
            }
        }
    }
    console.log("============")
}

let userInputs = [
    "Je me rappelle le bon vieux temps",
    "Mais j'oublie toujours votre nom",
    "Je rêve de devenir célèbre",
    "J'ai peur des machines",
    "Je suis souvent fatigué",
    "J'estime que vous ne m'aidez pas beaucoup",
    "J'aimerais vous présenter de mon épouse",
    "Pourquoi ne pouvez-vous pas m'aider à progresser",
    "Pourquoi ne pouvez-vous pas m'aider à progresser",
    "Je vous demande pardon",
    "Tous les personnes sont semblables",
    "Can we continue in English",
    "But I want to speak in English",
    "Fin"
]

let exampleLines = [
    "C'est mon petit ami qui m'a fait venir ici",
    "Les hommes se ressemblent tous.",
    "Ils nous embêtent toujours à propos de quelque chose ou d'autre.",
    "Il dit que je suis souvent déprimée.",
    "C'est vrai. Je suis malheureuse",
    "J'ai besoin d'aide, c'est certain.",
    "Je pourrais peut-être apprendre à m'entendre avec ma mère.",
    "Ma mère s'occupe de moi.",
    "Mon père",
    "Vous ressemblez à mon père par certains côtés.",
    "Tu n'es pas très agressif, mais je pense que tu ne veux pas que je le remarque.",
    "Tu ne te disputes pas avec moi.",
    "Tu as peur de moi",
    "Mon père a peur de tout le monde",
    "Les brutes",
    "Fin"
]

//  Unit tests of all sentences
function testAll(key_en, userText){
    console.log("testAll(%s,%s)",key_en,userText)
    let keyword = enKeys[key_en];
    if (keyword !== undefined){
        const key = keyword.key
        let terminals = tokenizeFr(userText).map(getTerminals);
        console.log("** key_en: %s lemma:%s : %s",keyword.key_en, key.lemma, userText)
        showTerminalLists(terminals)
        for (let pat of keyword.pats){
            let groups = matchDecomp(pat.decomp,terminals);
            if (groups != null){
                console.log("groups: /",groups.slice(1).map(g=>g.map(t=>t.realize())).join("/"),"/")
                for (let fn of pat.reasmb){
                    if (typeof fn == "function"){
                        const expr = fn(groups,user_gender)
                        console.log(expr.typ({"maje":use_majestic}).realize());
                    } else {
                        console.log("==>",fn)
                    }
                }
                console.log("===");
            }
        }
    } else 
        console.log("keyword:%s absent",key_en)
    console.log("---------")
}


function run_testAll(){
    // testAll("xnone","")
    // testAll("sorry","excusez-moi")
    // testAll("sorry","je vous demande pardon")
    // testAll("remember","je me rappelle des choses")
    // testAll("remember","vous vous rappelez de vos voyages")
    // testAll("remember","ceci vous rappelle des bons souvenirs")
    // testAll("forget","J'oublie les anniversaires")
    // testAll("forget","Quand avez-vous oublié de venir")
    // testAll("if","Ah si j'avais su")
    // testAll("dreamed","Je rêve d'être informaticien")
    // testAll("dream","J'ai fait un rêve avec des éléphants roses")
    // testAll("perhaps","J'irai peut-être au ciel")
    // testAll("name","je ne connais pas votre nom")
    // testAll("deutsch","Sprechen bitte auf Deutsch")
    // testAll("francais","In English please")
    // testAll("italiano","In italiano")
    // testAll("espanol","Habla espanol")
    // testAll("xforeign","Anything")
    // testAll("hello","Bonjour")
    // testAll("computer","J'ai peur des ordinateurs")
    // testAll("am","Pourquoi suis-je perdu ?")
    // testAll("am","Pourquoi êtes-vous perdu ?")
    // testAll("am","Pourquoi es-tu perdu ?")
    // testAll("am","Ils sont jaloux")
    // testAll("your","J'aime bien votre attitude")
    // testAll("i","Étais-je capable d'y arriver ?")
    // testAll("i","Étais-tu capable d'y arriver ?")
    // testAll("i","Étiez-vous capable d'y arriver ?")
    // testAll("i","Je désire du chocolat")
    // testAll("i","Je suis malheureux en affaire")
    // testAll("i","Je suis heureux en affaire")
    // testAll("i","Je pense que je vais bien")
    // testAll("i","je suis à l'affut")
    // testAll("i","Je ne peux pas aller à la plage")
    // testAll("i","Je ne veux pas manger de la soupe")
    // testAll('i',"Je sens des mauvaises vibrations")
    // testAll("you","Vous me rappelez de revenir")
    // testAll("you","Vous êtes très fort")
    // testAll("yes","Très bien")
    // testAll("no_one","Personne ne veut venir")
    // testAll("no","non")
    // testAll("my","j'aime bien mon épouse")
    // testAll("can","Pouvez-vous m'aider ?")
    // testAll("can","puis-je vous demander des choses")
    // testAll("what","Je ne sais plus quoi faire")
    // testAll("because","Je vous parle parce que j'ai peur")
    // testAll("everyone","J'imagine que tout le monde veut aller au ciel")
    // testAll("why","Je ne vois pas pourquoi ne pouvez-vous pas arriver demain")
    // testAll("why","Pourquoi ne puis-je pas arriver en retard")
    // testAll("always","J'aime toujours cela")
    // testAll("alike","Le chien est semblable au chat")
    // testAll("like","C'est pareil")
    // testAll("different","nous sommes tous différentd")

    // test all initial and final sentences
    // for (let group of [elizaFinals,elizaInitials]) {
    //     for (let f of group){
    //         console.log(f([],"f").typ({"maje":true}).realize())
    //     }
    // }
}
import {Constituent, N, A, Pro, D, V, Adv, C, P, DT, NO, Q,
    S, NP, AP, VP, AdvP, PP, CP, SP} from "../../src/jsRealB.js"
import {lemmataFr} from "./lemmatize.js"

// exemples utilisés dans le document "Développement d'Eliza en français"
function exemplesPapier(){
    
    function show(expr){
        console.log(expr.toSource(0)+"\n => "+expr.realize())
        console.log("--")
    }
    
    // section 2.1
    show(Pro('moi').pe(3).g("f").c("nom"))
    show(A("content").g("f"))
    show(V("être").t("i").pe(2))
    
    show(
        S(Pro("moi").pe(3).g("f").c("nom"), 
          VP(V("être").t("i"),
             A("content"),"de venir"))
    )
    
    show(
        S(Pro("moi").pe(3).g("f").c("nom"), 
          VP(V("être").t("i"),
             A("content"),"de venir")).typ({"int":"yon","neg":true})
    )
       
    function vous(g){
        return Pro("moi").pe(2).g(g).c("nom")
    }
    
    function f(m,g){
        return S(vous(g),
                 VP(V("penser"),
                    PP(P("à"),m[2])))
    }
    
    const m = ["","","revenir à la maison"]
    show(f(m,"f"))
    show(f(m,"f").typ({"int":"yon"}))
    
    // section 2.2
    show(f(m,"f").typ({"int":"yon","maje":true}))
    
    function moi(g){return Pro("moi").pe(1).g(g).tn("")}
    function f1(){
        return S(vous("f"),
                VP(V("être"),
                    A("content"),
                    PP(P("de"),moi("m")))
            ).typ({"maje":true})
    }
    show(f1())

    function moi_(g){return Pro("moi").pe(1).g(g).tn("").maje(false)}
    function f1_(){
        return S(vous("f"),
                 VP(V("être"),
                    A("content"),
                    PP(P("de"),moi_("m")))
               ).typ({"maje":true})
    }
    show(f1_())
    
    // section 3.2
    showTerminalLists([lemmataFr.get("suis")])
    showTerminalLists([lemmataFr.get("la")])

    let terminals = tokenizeFr("Généralement je me rappelle le début de ma carrière").map(getTerminals)
    showTerminalLists(terminals)
    
    // section 3.3
    const decomp = [Q("*"),Pro("je").pe(1),Pro("me").pe(1),V("rappeler"),Q("*")]
    // sans vouvoiement
    let groups = matchDecomp(decomp,terminals,true)
    for (let group of groups.slice(1)){
        console.log(group.map(t=>t.toSource()))
    }

    console.log(f(groups,"m").toSource(0))
    console.log(
        f(groups,"m").typ({"maje":true}).realize()
    )
    // avec vouvoiement
    groups = matchDecomp(decomp,terminals,false)
    for (let group of groups.slice(1)){
        console.log(group.map(t=>t.toSource()))
    }
    
    show(
        S(Pro("moi").pe(2).g("m").c("nom"),
          VP(V("penser"),
             Adv("souvent"),
             PP(P("à"),[D('le'), N('début'), D('de'), 
                        D('notre').g("f").pe(2).maje(false), N('carrière')]))
         ).typ({"int":"yon"}).typ({"maje":true})
    )
}


// lancer les tests
runScript(userInputs)
// runScript(exampleLines)

// run_testAll()
// exemplesPapier()
