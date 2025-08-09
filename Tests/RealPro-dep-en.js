QUnit.test( "RealPro Dependencies EN", function( assert ) {
     Object.assign(globalThis,jsRealB);
     loadEn();
    addToLexicon("John",{N:{tab:"nI",g:"m"}})
    addToLexicon("Mary",{N:{tab:"nI",g:"f"}})
    addToLexicon("Paris",{N:{tab:"nI"}})
    addToLexicon("Fred",{N:{tab:"nI",g:"m"}});
    addToLexicon("Maria-Luz",{N:{tab:"nI",g:"f"}});
    addToLexicon("firefighter",getLemma("fighter"));
    // examples translated from .../Personage/lib/RealPro-2.3/sample-dsynts
    // created with a call to makeQUnit() in .../Personage/lib/RealPro-2.3/sample-dsynts/compare_RealPro_jsRealb.js
    // with some added afterwards taken from the ANLP-97 paper on RealPro
    const sentences = [
{"expression": // 1
root(V("see").t("ip").pe(1).n("p"),  
     comp(Pro("something")),
     comp(V("get").t("ps"),
          subj(Pro("I").pe(1)),
          comp(P("for"),
               comp(Pro("me").pe(2))))),
"expected":"Let's see something I got for you. ",
"message":"./letssee.dss"},

{"expression": // 2
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John does not love Mary. ",
"message":"./Examples_from_User_Manual/10-John-does-not-love-Mary.dss"},

{"expression": // 3
root(V("be"),
     subj(Pro("there").n("p")),
     mod(N("firefighter"),
          det(D("a"))).n("p"),
     mod(A("available")),
     comp(P("in"),
          comp(N("city"),
               det(D("this"))))).typ({"neg":true,"perf":true,"int":"yon"}),
"expected":"Have there not been firefighters available in this city? ",
"message":"./Examples_from_User_Manual/11-Have-there-not-been-firefighters.dss"},

{"expression": // 4
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John loves Mary. ",
"message":"./Examples_from_User_Manual/11-John-loves-Mary.dss"},

{"expression": // 5
root(V("tell"),
     subj(N("John")),
     comp(N("Mary")),
     comp(N("story"),
          det(D("a")))),
"expected":"John tells Mary a story. ",
"message":"./Examples_from_User_Manual/11-John-tells-Mary-a-story.dss"},

{"expression": // 6
root(V("see").t("ps"),
     subj(Pro("I").pe(1)),
     comp(V("eat").t("pr"),
          subj(N("John")),
          comp(N("bean").n("p")))),
"expected":"I saw John eating beans. ",
"message":"./Examples_from_User_Manual/12-I-saw-John-eating-beans.dss"},

{"expression": // 7
root(V("tell").t("ps"),
     subj(Pro("I").pe(1)),
     comp(N("Mary")),
     comp(Pro("that"),
          comp(V("eat").t("p"),
               subj(N("John")),
               comp(N("bean").n("p"))))),
"expected":"I told Mary that John eats beans. ",
"message":"./Examples_from_User_Manual/12-I-told-Mary-that-John-eats-beans.dss"},

{"expression": // 8
root(V("bother").t("p"),
     subj(Pro("I")),
     comp(N("Mary")),
     comp(Pro("that"),
          comp(V("see").t("p"),
               subj(N("John")),
               comp(Pro("myself").g("m"))).typ({"neg":true,"mod":"poss"}))),
"expected":"It bothers Mary that John cannot see himself. ",
"message":"./Examples_from_User_Manual/12-It-bothers-Mary-that-John-can-not.dss"},

{"expression": // 9
root(V("be").t("c"),
     subj(Pro("I")),
     mod(A("horrible")),
     comp(P("for"),
          comp(V("see").t("b"),
               subj(N("John")),
               mod(P("to")).pos("pre"),
               comp(Pro("myself").g("m"))))),
"expected":"It would be horrible for John to see himself. ",
"message":"./Examples_from_User_Manual/12-It-would-be-horrible-for-John-to.dss"},

{"expression": // 10
root(V("wonder"),
     subj(N("authority"),
          det(D("the"))).n("p"),
     comp(V("give").t("ps"),
          subj(Pro("who")),
          comp(N("book").n("p")),
          comp(Pro("whom"),
               mod(P("to")).pos("pre")))).typ({"prog":true}),
"expected":"The authorities are wondering who gave books to whom. ",
"message":"./Examples_from_User_Manual/13-The-authorities-are-wondering-who-whom.dss"},

{"expression": // 11
root(P("under"),
    comp(Pro("which"),
         comp(N("bridge"))),
    mod(V("sleep").t("ps"),
         subj(N("Maria-Luz"))).typ({"int":"yon"})),
"expected":"Under which bridge did Maria-Luz sleep? ",
"message":"./Examples_from_User_Manual/13-Under-which-bridge-did-Maria-Luz-sleep.dss"},

{"expression": // 12
root(V("like"),
     comp(N("John")),
     subj(N("Mary"))).typ({"int":"wos"}),
"expected":"Who likes John? ",
"message":"./Examples_from_User_Manual/13-Who-likes-John.dss"},

{"expression": // 13
root(V("like"),
     comp(N("John")),
     subj(N("Mary"))).typ({"int":"wod"}),
"expected":"Whom does Mary like? ",
"message":"./Examples_from_User_Manual/13-Whom-does-Mary-like.dss"},

{"expression": // 14
root(V("sleep"),
     mod(Adv("admittedly")).pos("pre").a(","),
     subj(N("Maria-Luz")).pro(),
     mod(Adv("really")),
     mod(Adv("very")),
     mod(Adv("soundly")),
     comp(Pro("there")),
     mod(Adv("now"))).typ({"prog":true}),
"expected":"Admittedly, she is sleeping really very soundly there now. ",
"message":"./Examples_from_User_Manual/14-Admittedly,-she-is-really-sleeping-very-soundly.dss"},

{"expression": // 15
root(V("do").t("c"),
     comp(C("if"),
          comp(V("have").t("ps"),
               subj(Pro("you")),
               comp(N("money")))).pos("pre"),
     subj(Pro("I").pe(1)),
     comp(Pro("anything")),
     comp(P("for"),
          mod(Pro("you")))),
"expected":"If you had money I would do anything for you. ",
"message":"./Examples_from_User_Manual/14-If-you-had-money.dss"},

{"expression": // 16
root(V("eat"),
     subj(N("John")),
     comp(N("bean").n("p")),
     comp(Adv("often"))),
"expected":"John eats beans often. ",
"message":"./Examples_from_User_Manual/14-John-eats-beans-often.dss"},

{"expression": // 17
root(V("eat"),
     subj(N("John")),
     comp(N("bean").n("p")),
     comp(Adv("often")).pos("pre")),
"expected":"John often eats beans. ",
"message":"./Examples_from_User_Manual/14-John-often-eats-beans.dss"},

{"expression": // 18
root(V("eat"),
     comp(Adv("often")).pos("pre").a(","),
     subj(N("John")),
     comp(N("bean").n("p"))),
"expected":"Often, John eats beans. ",
"message":"./Examples_from_User_Manual/14-Often,-John-eats-beans.dss"},

{"expression": // 19
root(V("eat"),
     comp(Adv("often")).pos("pre"),
     subj(N("John")),
     comp(N("bean").n("p"))),
"expected":"Often John eats beans. ",
"message":"./Examples_from_User_Manual/14-Often-John-eats-beans.dss"},

{"expression": // 20
coord(C("but"),
      root(V("laugh").t("ps"),
           subj(N("John"))),
      root(V("smack").t("ps"),
           subj(N("Mary")),
           coord(C("and"),
                 comp(N("butler"),
                      det(D("the"))),
                 comp(N("maid"),
                      det(D("the")))))),
"expected":"John laughed but Mary smacked the butler and the maid. ",
"message":"./Examples_from_User_Manual/15-John-laughed-but-Mary-smacked-butler&.dss"},

{"expression": // 21
root(V("see").t("ps"),
     subj(Pro("I").pe(1)),
     comp(N("Fred").a(","),
          comp(V("drink").t("ps"),
               subj(Pro("who")),
               comp(N("martini"),
                    det(D("a")))).typ({"prog":true}))),
"expected":"I saw Fred, who was drinking a martini. ",
"message":"./Examples_from_User_Manual/16-I-saw-Fred,-who-was-drinking-a-martini.dss"},

{"expression": // 22
root(V("see").t("ps"),
     subj(Pro("I").pe(1)),
     comp(N("guy").n("p"),
          det(D("the")),
          comp(V("drink").t("ps"),
               subj(Pro("who")),
               comp(N("martini").n("p"),
                    det(D("a")))).typ({"prog":true}))),
"expected":"I saw the guys who were drinking martinis. ",
"message":"./Examples_from_User_Manual/16-I-saw-the-guys-who-were-drinking-martinis.dss"},

{"expression": // 23
root(V("attack").t("pp"),
     comp(P("by"),mod(N("Mary"))),
     subj(N("guy"),
          det(D("the"))).n("p")),
"expected":"The guys attacked by Mary. ",
"message":"./Examples_from_User_Manual/16-The-guys-attacked-by-Mary.dss"},

{"expression": // 24
root(V("be"),
     subj(Pro("this")),
     comp(N("test"),
          det(D("a")))).cap(false).a("."),
"expected":"this is a test. ",
"message":"./Examples_from_User_Manual/17-this-is-a-test.dss"},

{"expression": // 25
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).ba("("),
"expected":" (John loves Mary) ",
"message":"./Examples_from_User_Manual/18-(John-loves-Mary).dss"},

{"expression": // 26
root(V("be"),
     subj(Pro("this")),
     comp(Q("CoGenTex").tag("a",{href:"http://www.cogentex.com"}))),
"expected":"This is <a href=\"http://www.cogentex.com\">CoGenTex</a>. ",
"message":"./Examples_from_User_Manual/19-HTML-This-is-CoGenTex.dss"},

{"expression": // 27
Q("**&FuN aNd GaMeS&**."),
"expected":"**&FuN aNd GaMeS&**.",
"message":"./Examples_from_User_Manual/4-Fun-and-Games.dss"},

{"expression": // 28
Q("Mesmerizingly").a("."),
"expected":"Mesmerizingly. ",
"message":"./Examples_from_User_Manual/4-Mesmerizingly.dss"},

{"expression": // 29
root(Q("Yemen"),
     det(D("the"))),
"expected":"The Yemen. ",
"message":"./Examples_from_User_Manual/5-The-Yemen.dss"},

{"expression": // 30
root(N("car"),
     det(D("this"))).n("p"),
"expected":"These cars. ",
"message":"./Examples_from_User_Manual/5-These-cars.dss"},

{"expression": // 31
root(N("tiara")).n("p"),
"expected":"Tiaras. ",
"message":"./Examples_from_User_Manual/5-Tiaras.dss"},

{"expression": // 32
root(NO(14),
     det(D("all")),
     comp(P("of"),
          comp(N("duck").n("p"),
               det(D("the"))))),
"expected":"All 14 of the ducks. ",
"message":"./Examples_from_User_Manual/6-All-14-of-the-ducks.dss"},

{"expression": // 33
root(D("all"),
     comp(N("duck").n("p"),
          det(D("the")))),
"expected":"All the ducks. ",
"message":"./Examples_from_User_Manual/6-All-the-ducks.dss"},

{"expression": // 34
root(N("duck"),
     det(NO(6).nat(true),
         mod(Adv("more"),
             comp(P("than"))).pos("pre"))),
"expected":"More than six ducks. ",
"message":"./Examples_from_User_Manual/6-More-than-6-ducks.dss"},

{"expression": // 35
root(N("duck"),
     det(NO(4).nat(true),
         det(D("the")))),
"expected":"The four ducks. ",
"message":"./Examples_from_User_Manual/6-The-four-ducks.dss"},

{"expression": // 36
root(N("definition"),
     mod(N("friend"),
         det(D("my").pe(1).ow("p")),
         det(V("esteem").t("pp"))).poss().pos("pre"),
     det(NO(2).nat(true)),
     mod(A("bland")),
     comp(P("of"),
          comp(N("happiness")))),
"expected":"Our esteemed friend's two bland definitions of happiness. ",
"message":"./Examples_from_User_Manual/7-Our-esteemed-friend.dss"},

{"expression": // 37
root(V("be").t("c"),
     subj(Pro("anything"),
          mod(Adv("almost")).pos("pre"),
          mod(Adv("else"))),
     comp(Pro("something"),
          mod(A("new")).pos("post"))),
"expected":"Almost anything else would be something new. ",
"message":"./Examples_from_User_Manual/8-Almost-anything-else-would-be-something-new.dss"},

{"expression": // 38
root(V("do").t("c"),
     subj(Pro("I").pe(1)),
     comp(Pro("anything")),
     comp(P("for"),
          comp(N("girl"),
               det(D("the"))).pro())),
"expected":"I would do anything for her. ",
"message":"./Examples_from_User_Manual/8-I-would-do-anything.dss"},

{"expression": // 39
root(V("see"),
     subj(N("John"))).typ({"refl":true}),
"expected":"John sees himself. ",
"message":"./Examples_from_User_Manual/8-John-sees-himself.dss"},

{"expression": // 40
root(V("reveal").t("ps"),
     subj(N("psychiatrist"),
          det(D("the"))),
     comp(N("patient"),
          det(D("the"))),
     comp(P("to"),
          mod(Pro("myself").g("f")))),
"expected":"The psychiatrist revealed the patient to herself. ",
"message":"./Examples_from_User_Manual/8-The-psych-rev-patient-to-herself.dss"},

{"expression": // 41
root(N("egg").a(","),
     det(NO(2).nat()),
     mod(A("small")).pos("post")),
"expected":"Two eggs, small. ",
"message":"./Examples_from_User_Manual/9-Two-eggs,-small.dss"},

{"expression": // 42
root(V("kiss").t("ps"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John was kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aac0i00.dss"},

{"expression": // 43
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"int":"yon"}),
"expected":"Was John kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aac0i0q.dss"},

{"expression": // 44
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"neg":true}),
"expected":"John was not kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aac0in0.dss"},

{"expression": // 45
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"Was John not kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aac0inq.dss"},

{"expression": // 46
root(V("kiss"),
     comp(N("Mary"))).t("ps").typ({"prog":true}),
"expected":"Was kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aac0m00.dss"},

{"expression": // 47
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("ps").typ({"prog":true,"neg":true}),
"expected":"You were not kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aac0mn0-bl-fix.dss"},

{"expression": // 48
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("ps").typ({"prog":true,"neg":true}),
"expected":"You were not kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aac0mn0.dss"},

{"expression": // 49
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true}),
"expected":"John had been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aacpi00.dss"},

{"expression": // 50
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Had John been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aacpi0q.dss"},

{"expression": // 51
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true,"neg":true}),
"expected":"John had not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aacpin0.dss"},

{"expression": // 52
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Had John not been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aacpinq.dss"},

{"expression": // 53
root(V("kiss"),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true}),
"expected":"Had been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aacpm00.dss"},

{"expression": // 54
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("ps").typ({"prog":true,"perf":true,"neg":true}),
"expected":"You had not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aacpmn0.dss"},

{"expression": // 55
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("ps"),
"expected":"John loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aas0i00.dss"},

{"expression": // 56
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"int":"yon"}),
"expected":"Did John love Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aas0i0q.dss"},

{"expression": // 57
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"neg":true}),
"expected":"John did not love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aas0in0.dss"},

{"expression": // 58
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"neg":true,"int":"yon"}),
"expected":"Did John not love Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aas0inq.dss"},

{"expression": // 59
root(V("love"),
     comp(N("Mary"))).t("ps"),
"expected":"Loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aas0m00.dss"},

{"expression": // 60
root(V("love"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("ps").typ({"neg":true}),
"expected":"You did not love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aas0mn0.dss"},

{"expression": // 61
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"perf":true}),
"expected":"John had loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aaspi00.dss"},

{"expression": // 62
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"int":"yon","perf":true}),
"expected":"Had John kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aaspi0q.dss"},

{"expression": // 63
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"neg":true,"perf":true}),
"expected":"John had not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aaspin0.dss"},

{"expression": // 64
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("ps").typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"Had John not kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/aaspinq.dss"},

{"expression": // 65
root(V("love"),
     comp(N("Mary"))).t("ps").typ({"perf":true}),
"expected":"Had loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aaspm00.dss"},

{"expression": // 66
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("ps").typ({"perf":true,"neg":true}),
"expected":"You had not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/aaspmn0.dss"},

{"expression": // 67
root(V("kiss"),
     comp(N("John"))).t("ps").typ({"prog":true,"pas":true}),
"expected":"John was being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apc0i00.dss"},

{"expression": // 68
root(V("kiss"),
     comp(N("John"))).t("ps").typ({"prog":true,"int":"yon","pas":true}),
"expected":"Was John being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/apc0i0q.dss"},

{"expression": // 69
root(V("kiss"),
     comp(N("John"))).t("ps").typ({"prog":true,"neg":true,"pas":true}),
"expected":"John was not being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apc0in0.dss"},

{"expression": // 70
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"prog":true,"neg":true,"pas":true,"int":"yon"}),
"expected":"Was John not being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/apc0inq.dss"},

{"expression": // 71
root(V("kiss")).t("ps").typ({"pas":true,"prog":true}),
"expected":"Was being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apc0m00.dss"},

{"expression": // 72
root(V("kiss").t("ps"),
     comp(Pro("I").pe(2))).typ({"prog":true,"neg":true,"pas":true}),
"expected":"You were not being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apc0mn0.dss"},

{"expression": // 73
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"perf":true,"prog":true,"pas":true}),
"expected":"John had been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apcpi00.dss"},

{"expression": // 74
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"perf":true,"prog":true,"pas":true,"int":"yon"}),
"expected":"Had John been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/apcpi0q.dss"},

{"expression": // 75
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"perf":true,"prog":true,"neg":true,"pas":true}),
"expected":"John had not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apcpin0.dss"},

{"expression": // 76
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"perf":true,"prog":true,"neg":true,"pas":true,"int":"yon"}),
"expected":"Had John not been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/apcpinq.dss"},

{"expression": // 77
root(V("kiss")).t("ps").typ({"perf":true,"prog":true,"pas":true}),
"expected":"Had been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apcpm00.dss"},

{"expression": // 78
root(V("kiss").t("ps"),
     comp(Pro("I").pe(2))).typ({"prog":true,"perf":true,"neg":true,"pas":true}),
"expected":"You had not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apcpmn0.dss"},

{"expression": // 79
root(V("love").t("ps"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John was loved. ",
"message":"./Examples_from_User_Manual/Verbs/aps0i00.dss"},

{"expression": // 80
root(V("love").t("ps"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"Was John loved? ",
"message":"./Examples_from_User_Manual/Verbs/aps0i0q.dss"},

{"expression": // 81
root(V("love").t("ps"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John was not loved. ",
"message":"./Examples_from_User_Manual/Verbs/aps0in0.dss"},

{"expression": // 82
root(V("love").t("ps"),
     comp(N("John"))).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Was John not loved? ",
"message":"./Examples_from_User_Manual/Verbs/aps0inq.dss"},

{"expression": // 83
root(V("love").t("ps")).typ({"pas":true}),
"expected":"Was loved. ",
"message":"./Examples_from_User_Manual/Verbs/aps0m00.dss"},

{"expression": // 84
root(V("kiss").t("ps"),
     comp(Pro("I").pe(2))).typ({"neg":true,"pas":true}),
"expected":"You were not kissed. ",
"message":"./Examples_from_User_Manual/Verbs/aps0mn0.dss"},

{"expression": // 85
root(V("like").t("ps"),
     comp(N("John"))).typ({"perf":true,"pas":true}),
"expected":"John had been liked. ",
"message":"./Examples_from_User_Manual/Verbs/apspi00.dss"},

{"expression": // 86
root(V("like").t("ps"),
     comp(N("John"))).typ({"perf":true,"pas":true,"int":"yon"}),
"expected":"Had John been liked? ",
"message":"./Examples_from_User_Manual/Verbs/apspi0q.dss"},

{"expression": // 87
root(V("kiss").t("ps"),
     comp(N("John"))).typ({"perf":true,"pas":true,"neg":true}),
"expected":"John had not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apspin0.dss"},

{"expression": // 88
root(V("love").t("ps"),
     comp(N("John"))).typ({"perf":true,"pas":true,"neg":true,"int":"yon"}),
"expected":"Had John not been loved? ",
"message":"./Examples_from_User_Manual/Verbs/apspinq.dss"},

{"expression": // 89
root(V("like").t("ps")).typ({"perf":true,"pas":true}),
"expected":"Had been liked. ",
"message":"./Examples_from_User_Manual/Verbs/apspm00.dss"},

{"expression": // 90
root(V("kiss").t("ps"),
     comp(Pro("I").pe(2))).typ({"perf":true,"neg":true,"pas":true}),
"expected":"You had not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/apspmn0.dss"},

{"expression": // 91
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John will be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fac0i00.dss"},

{"expression": // 92
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon","prog":true}),
"expected":"Will John be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/fac0i0q.dss"},

{"expression": // 93
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John will not be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fac0in0.dss"},

{"expression": // 94
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"Will John not be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/fac0inq.dss"},

{"expression": // 95
root(V("kiss").t("f"),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"Will be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fac0m00.dss"},

{"expression": // 96
root(V("kiss").t("f"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"You will not be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fac0mn0.dss"},

{"expression": // 97
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John will have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/facpi00.dss"},

{"expression": // 98
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Will John have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/facpi0q.dss"},

{"expression": // 99
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true}),
"expected":"John will not have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/facpin0.dss"},

{"expression": // 100
root(V("kiss").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Will John not have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/facpinq.dss"},

{"expression": // 101
root(V("kiss").t("ip"),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"Have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/facpm00.dss"},

{"expression": // 102
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).typ({"neg":true,"prog":true,"perf":true}),
"expected":"You have not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/facpmn0.dss"},

{"expression": // 103
root(V("love").t("f"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John will love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fas0i00.dss"},

{"expression": // 104
root(V("love").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"Will John love Mary? ",
"message":"./Examples_from_User_Manual/Verbs/fas0i0q.dss"},

{"expression": // 105
root(V("love").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John will not love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fas0in0.dss"},

{"expression": // 106
root(V("love").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"Will John not love Mary? ",
"message":"./Examples_from_User_Manual/Verbs/fas0inq.dss"},

{"expression": // 107
root(V("love").t("ip"),
     comp(N("Mary"))),
"expected":"Love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fas0m00.dss"},

{"expression": // 108
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"You do not kiss Mary. ",
"message":"./Examples_from_User_Manual/Verbs/fas0mn0.dss"},

{"expression": // 109
root(V("love").t("f"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true}),
"expected":"John will have loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/faspi00.dss"},

{"expression": // 110
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("f").typ({"perf":true,"int":"yon"}),
"expected":"Will John have loved Mary? ",
"message":"./Examples_from_User_Manual/Verbs/faspi0q.dss"},

{"expression": // 111
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("f").typ({"perf":true,"neg":true}),
"expected":"John will not have kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/faspin0.dss"},

{"expression": // 112
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("f").typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"Will John not have kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/faspinq.dss"},

{"expression": // 113
root(V("love"),
     comp(N("Mary"))).pe(1).typ({"perf":true}),
"expected":"Have loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/faspm00.dss"},

{"expression": // 114
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).pe(1).typ({"perf":true,"neg":true}),
"expected":"You have not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/faspmn0.dss"},

{"expression": // 115
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"prog":true}),
"expected":"John will be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpc0i00.dss"},

{"expression": // 116
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"Will John be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/fpc0i0q.dss"},

{"expression": // 117
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"prog":true,"neg":true}),
"expected":"John will not be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpc0in0.dss"},

{"expression": // 118
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Will John not be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/fpc0inq.dss"},

{"expression": // 119
root(V("kiss")).t("f").typ({"pas":true,"prog":true}),
"expected":"Will be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpc0m00.dss"},

{"expression": // 120
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"prog":true}),
"expected":"John will have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpcpi00.dss"},

{"expression": // 121
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"prog":true,"int":"yon"}),
"expected":"Will John have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/fpcpi0q.dss"},

{"expression": // 122
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"neg":true,"prog":true}),
"expected":"John will not have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpcpin0.dss"},

{"expression": // 123
root(V("kiss"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Will John not have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/fpcpinq.dss"},

{"expression": // 124
root(V("kiss").t("p").n("p")).typ({"prog":true,"pas":true,"perf":true}),
"expected":"Have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpcpm00.dss"},

{"expression": // 125
root(V("kiss").t("p"),
     comp(Pro("I").pe(2))).typ({"prog":true,"pas":true,"perf":true,"neg":true}),
"expected":"You have not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpcpmn0.dss"},

{"expression": // 126
root(V("love").t("f"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John will be loved. ",
"message":"./Examples_from_User_Manual/Verbs/fps0i00.dss"},

{"expression": // 127
root(V("love"),
     comp(N("John"))).t("f").typ({"pas":true,"int":"yon"}),
"expected":"Will John be loved? ",
"message":"./Examples_from_User_Manual/Verbs/fps0i0q.dss"},

{"expression": // 128
root(V("love"),
     comp(N("John"))).t("f").typ({"pas":true,"neg":true}),
"expected":"John will not be loved. ",
"message":"./Examples_from_User_Manual/Verbs/fps0in0.dss"},

{"expression": // 129
root(V("love"),
     comp(N("John"))).t("f").typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Will John not be loved? ",
"message":"./Examples_from_User_Manual/Verbs/fps0inq.dss"},

{"expression": // 130
root(V("love")).t("f").typ({"pas":true}),
"expected":"Will be loved. ",
"message":"./Examples_from_User_Manual/Verbs/fps0m00.dss"},

{"expression": // 131
root(V("kiss"),
     comp(Pro("I").pe(2))).t("f").typ({"pas":true,"neg":true}),
"expected":"You will not be kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fps0mn0.dss"},

{"expression": // 132
root(V("like"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true}),
"expected":"John will have been liked. ",
"message":"./Examples_from_User_Manual/Verbs/fpspi00.dss"},

{"expression": // 133
root(V("like"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"int":"yon"}),
"expected":"Will John have been liked? ",
"message":"./Examples_from_User_Manual/Verbs/fpspi0q.dss"},

{"expression": // 134
root(V("like"),
     comp(N("John"))).t("f").typ({"pas":true,"perf":true,"neg":true}),
"expected":"John will not have been liked. ",
"message":"./Examples_from_User_Manual/Verbs/fpspin0.dss"},

{"expression": // 135
root(V("kiss").t("f"),
     comp(N("John"))).typ({"pas":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Will John not have been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/fpspinq.dss"},

{"expression": // 136
root(V("like")).t("ip").typ({"pas":true,"perf":true}),
"expected":"Have been liked. ",
"message":"./Examples_from_User_Manual/Verbs/fpspm00.dss"},

{"expression": // 137
root(V("kiss"),
     comp(Pro("I").pe(2))).typ({"pas":true,"perf":true,"neg":true}),
"expected":"You have not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/fpspmn0.dss"},

{"expression": // 138
root(V("kiss").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0a00.dss"},

{"expression": // 139
root(V("kiss").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"int":"yon"}),
"expected":"John been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0a0q.dss"},

{"expression": // 140
root(V("kiss").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0an0.dss"},

{"expression": // 141
root(V("kiss").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"John not been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0anq.dss"},

{"expression": // 142
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John would be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0c00.dss"},

{"expression": // 143
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"int":"yon"}),
"expected":"Would John be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0c0q.dss"},

{"expression": // 144
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John would not be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0cn0.dss"},

{"expression": // 145
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"Would John not be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0cnq.dss"},

{"expression": // 146
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John is kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0i00.dss"},

{"expression": // 147
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"int":"yon"}),
"expected":"Is John kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0i0q.dss"},

{"expression": // 148
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John is not kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0in0.dss"},

{"expression": // 149
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"Is John not kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0inq.dss"},

{"expression": // 150
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John is kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0n00.dss"},

{"expression": // 151
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"int":"yon"}),
"expected":"Is John kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0n0q.dss"},

{"expression": // 152
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John is not kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0nn0.dss"},

{"expression": // 153
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"Is John not kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0nnq.dss"},

{"expression": // 154
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true}),
"expected":"John being kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0p00.dss"},

{"expression": // 155
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"int":"yon"}),
"expected":"John being kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0p0q.dss"},

{"expression": // 156
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true}),
"expected":"John not being kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0pn0.dss"},

{"expression": // 157
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"}),
"expected":"John not being kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0pnq.dss"},

{"expression": // 158
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true})),
"expected":"For John to be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0t00.dss"},

{"expression": // 159
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"int":"yon"})),
"expected":"For John to be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0t0q.dss"},

{"expression": // 160
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"neg":true})),
"expected":"For John not to be kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pac0tn0.dss"},

{"expression": // 161
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"neg":true,"int":"yon"})),
"expected":"For John not to be kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pac0tnq.dss"},

{"expression": // 162
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John has been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpa00.dss"},

{"expression": // 163
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Has John been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpa0q.dss"},

{"expression": // 164
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true}),
"expected":"John has not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpan0.dss"},

{"expression": // 165
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpanq.dss"},

{"expression": // 166
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John would have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpc00.dss"},

{"expression": // 167
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Would John have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpc0q.dss"},

{"expression": // 168
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true}),
"expected":"John would not have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpcn0.dss"},

{"expression": // 169
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Would John not have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpcnq.dss"},

{"expression": // 170
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John has been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpi00.dss"},

{"expression": // 171
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Has John been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpi0q.dss"},

{"expression": // 172
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true}),
"expected":"John has not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpin0.dss"},

{"expression": // 173
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpinq.dss"},

{"expression": // 174
root(V("kiss").t("p").n("p"),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"Have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpm00.dss"},

{"expression": // 175
root(V("kiss").t("p").n("p"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true}),
"expected":"You have not been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpmn0.dss"},

{"expression": // 176
root(V("kiss").t("p").n("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John has been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpn00.dss"},

{"expression": // 177
root(V("kiss").t("p").n("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true,"int":"yon"}),
"expected":"Has John been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpn0q.dss"},

{"expression": // 178
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"prog":true,"perf":true}),
"expected":"John having been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpp00.dss"},

{"expression": // 179
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"perf":true})),
"expected":"For John to have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacpt00.dss"},

{"expression": // 180
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp("Mary")).typ({"prog":true,"perf":true,"int":"yon"})),
"expected":"For John to have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacpt0q.dss"},

{"expression": // 181
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true})),
"expected":"For John not to have been kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pacptn0.dss"},

{"expression": // 182
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"prog":true,"perf":true,"neg":true,"int":"yon"})),
"expected":"For John not to have been kissing Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pacptnq.dss"},

{"expression": // 183
root(V("like").t("ps"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John liked Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0a00.dss"},

{"expression": // 184
root(V("like").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"John liked Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0a0q.dss"},

{"expression": // 185
root(V("like").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John not liked Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0an0.dss"},

{"expression": // 186
root(V("like").t("pp"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"John not liked Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0anq.dss"},

{"expression": // 187
root(V("like").t("c"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John would like Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0c00.dss"},

{"expression": // 188
root(V("like").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"Would John like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0c0q.dss"},

{"expression": // 189
root(V("love").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John would not love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0cn0.dss"},

{"expression": // 190
root(V("love").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"Would John not love Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0cnq.dss"},

{"expression": // 191
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John likes Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0i00.dss"},

{"expression": // 192
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"Does John like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0i0q.dss"},

{"expression": // 193
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John does not like Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0in0.dss"},

{"expression": // 194
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"Does John not like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0inq.dss"},

{"expression": // 195
root(V("love").t("ip"),
     comp(N("Mary"))),
"expected":"Love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0m00.dss"},

{"expression": // 196
root(V("love").t("p"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"You do not love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0mn0.dss"},

{"expression": // 197
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John likes Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0n00.dss"},

{"expression": // 198
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"Does John like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0n0q.dss"},

{"expression": // 199
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John does not like Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0nn0.dss"},

{"expression": // 200
root(V("like").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"Does John not like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0nnq.dss"},

{"expression": // 201
root(V("kiss").t("pr"),
     subj(N("John")),
     comp(N("Mary"))),
"expected":"John kissing Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0p00.dss"},

{"expression": // 202
root(V("like").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon"}),
"expected":"John liking Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0p0q.dss"},

{"expression": // 203
root(V("like").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true}),
"expected":"John not liking Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0pn0.dss"},

{"expression": // 204
root(V("like").t("pr"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"int":"yon"}),
"expected":"John not liking Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0pnq.dss"},

{"expression": // 205
root(V("love").t("b-to"),
     subj(N("John"),
          det(P("for"))),
     comp(N("Mary"))),
"expected":"For John to love Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0t00.dss"},

{"expression": // 206
root(N("John"),
     det(P("for")),
     comp(V("like").t("b-to"),
          comp("Mary")).typ({"int":"yon"})),
"expected":"For John to like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0t0q.dss"},

{"expression": // 207
root(N("John"),
     det(P("for")),
     comp(V("like").t("b-to"),
          comp(N("Mary"))).typ({"neg":true})),
"expected":"For John not to like Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pas0tn0.dss"},

{"expression": // 208
root(N("John"),
     det(P("for")),
     comp(V("like").t("b-to"),
          comp(N("Mary"))).typ({"neg":true,"int":"yon"})),
"expected":"For John not to like Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pas0tnq.dss"},

{"expression": // 209
root(V("love").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true}),
"expected":"John has loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspa00.dss"},

{"expression": // 210
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"int":"yon","perf":true}),
"expected":"Has John kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspa0q.dss"},

{"expression": // 211
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"perf":true}),
"expected":"John has not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspan0.dss"},

{"expression": // 212
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"perf":true,"int":"yon"}),
"expected":"Has John not kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspanq.dss"},

{"expression": // 213
root(V("love").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true}),
"expected":"John would have loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspc00.dss"},

{"expression": // 214
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true,"int":"yon"}),
"expected":"Would John have kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspc0q.dss"},

{"expression": // 215
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true,"neg":true}),
"expected":"John would not have kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspcn0.dss"},

{"expression": // 216
root(V("kiss").t("c"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"Would John not have kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspcnq.dss"},

{"expression": // 217
root(V("love").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"perf":true}),
"expected":"John has loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspi00.dss"},

{"expression": // 218
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true,"int":"yon"}),
"expected":"Has John kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspi0q.dss"},

{"expression": // 219
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true,"neg":true}),
"expected":"John has not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspin0.dss"},

{"expression": // 220
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspinq.dss"},

{"expression": // 221
root(V("love"),
     comp(N("Mary"))).t("ip").typ({"perf":true}),
"expected":"Have loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspm00.dss"},

{"expression": // 222
root(V("kiss"),
     subj(Pro("I").pe(2)),
     comp(N("Mary"))).t("p").typ({"perf":true,"neg":true}),
"expected":"You have not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspmn0.dss"},

{"expression": // 223
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true}),
"expected":"John has loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspn00.dss"},

{"expression": // 224
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true,"int":"yon"}),
"expected":"Has John kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspn0q.dss"},

{"expression": // 225
root(V("kiss").t("p"),
     subj(N("John")),
     comp(N("Mary"))).typ({"neg":true,"perf":true}),
"expected":"John has not kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspnn0.dss"},

{"expression": // 226
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("p").typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspnnq.dss"},

{"expression": // 227
root(V("love"),
     subj(N("John")),
     comp(N("Mary"))).t("pr").typ({"perf":true}),
"expected":"John having loved Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspp00.dss"},

{"expression": // 228
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("pr").typ({"perf":true,"int":"yon"}),
"expected":"John having kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspp0q.dss"},

{"expression": // 229
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("pr").typ({"perf":true,"neg":true}),
"expected":"John not having kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pasppn0.dss"},

{"expression": // 230
root(V("kiss"),
     subj(N("John")),
     comp(N("Mary"))).t("pr").typ({"perf":true,"neg":true,"int":"yon"}),
"expected":"John not having kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pasppnq.dss"},

{"expression": // 231
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"perf":true})),
"expected":"For John to have kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/paspt00.dss"},

{"expression": // 232
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"perf":true,"int":"yon"})),
"expected":"For John to have kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/paspt0q.dss"},

{"expression": // 233
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"perf":true,"neg":true})),
"expected":"For John not to have kissed Mary. ",
"message":"./Examples_from_User_Manual/Verbs/pasptn0.dss"},

{"expression": // 234
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to"),
          comp(N("Mary"))).typ({"perf":true,"neg":true,"int":"yon"})),
"expected":"For John not to have kissed Mary? ",
"message":"./Examples_from_User_Manual/Verbs/pasptnq.dss"},

{"expression": // 235
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true}),
"expected":"John is being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0a00.dss"},

{"expression": // 236
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"Is John being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0a0q.dss"},

{"expression": // 237
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"neg":true}),
"expected":"John is not being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0an0.dss"},

{"expression": // 238
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Is John not being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0anq.dss"},

{"expression": // 239
root(V("kiss"),
     comp(N("John"))).t("c").typ({"pas":true,"prog":true}),
"expected":"John would be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0c00.dss"},

{"expression": // 240
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"Would John be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0c0q.dss"},

{"expression": // 241
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"prog":true,"neg":true}),
"expected":"John would not be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0cn0.dss"},

{"expression": // 242
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Would John not be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0cnq.dss"},

{"expression": // 243
root(V("kiss").t("p"),
     comp(N("John"))).typ({"pas":true,"prog":true}),
"expected":"John is being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0i00.dss"},

{"expression": // 244
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"Is John being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0i0q.dss"},

{"expression": // 245
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"neg":true}),
"expected":"John is not being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0in0.dss"},

{"expression": // 246
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Is John not being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0inq.dss"},

{"expression": // 247
root(V("kiss")).n("p").t("p").typ({"pas":true,"prog":true}),
"expected":"Are being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0m00.dss"},

{"expression": // 248
root(V("kiss"),
     comp(N("John"))).t("ip").typ({"pas":true,"prog":true}),
"expected":"John be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0n00.dss"},

{"expression": // 249
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"Is John being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0n0q.dss"},

{"expression": // 250
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"neg":true}),
"expected":"John is not being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0nn0.dss"},

{"expression": // 251
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"prog":true,"int":"yon","neg":true}),
"expected":"Is John not being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0nnq.dss"},

{"expression": // 252
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"pas":true,"prog":true}),
"expected":"John being being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0p00.dss"},

{"expression": // 253
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"pas":true,"prog":true,"int":"yon"}),
"expected":"John being being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0p0q.dss"},

{"expression": // 254
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"pas":true,"prog":true,"neg":true}),
"expected":"John not being being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0pn0.dss"},

{"expression": // 255
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"pas":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"John not being being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0pnq.dss"},

{"expression": // 256
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"prog":true})),
"expected":"For John to be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0t00.dss"},

{"expression": // 257
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"prog":true,"int":"yon"})),
"expected":"For John to be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0t0q.dss"},

{"expression": // 258
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"neg":true,"pas":true,"prog":true})),
"expected":"For John not to be being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppc0tn0.dss"},

{"expression": // 259
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"neg":true,"pas":true,"prog":true,"int":"yon"})),
"expected":"For John not to be being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppc0tnq.dss"},

{"expression": // 260
root(V("kiss"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true}),
"expected":"John has been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpa00.dss"},

{"expression": // 261
root(V("kiss"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true,"int":"yon"}),
"expected":"Has John been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpa0q.dss"},

{"expression": // 262
root(V("kiss"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true,"neg":true}),
"expected":"John has not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpan0.dss"},

{"expression": // 263
root(V("kiss"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpanq.dss"},

{"expression": // 264
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true}),
"expected":"John would have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpc00.dss"},

{"expression": // 265
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"prog":true,"perf":true,"int":"yon"}),
"expected":"Would John have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpc0q.dss"},

{"expression": // 266
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true,"neg":true}),
"expected":"John would not have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpcn0.dss"},

{"expression": // 267
root(V("kiss").t("c"),
     comp(N("John"))).typ({"pas":true,"int":"yon","neg":true,"perf":true,"prog":true}),
"expected":"Would John not have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpcnq.dss"},

{"expression": // 268
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"perf":true,"prog":true}),
"expected":"John has been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpi00.dss"},

{"expression": // 269
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"perf":true,"prog":true,"int":"yon"}),
"expected":"Has John been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpi0q.dss"},

{"expression": // 270
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"perf":true,"prog":true,"neg":true}),
"expected":"John has not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpin0.dss"},

{"expression": // 271
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"perf":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Has John not been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpinq.dss"},

{"expression": // 272
root(V("kiss").pe(1)).t("p").typ({"pas":true,"perf":true,"prog":true}),
"expected":"Have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpm00.dss"},

{"expression": // 273
root(V("kiss"),
     comp(Pro("I").pe(2))).t("p").typ({"pas":true,"perf":true,"prog":true,"neg":true}),
"expected":"You have not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpmn0.dss"},

{"expression": // 274
root(V("kiss"),
     comp(N("John"))).t("p").typ({"pas":true,"perf":true,"prog":true}),
"expected":"John has been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpn00.dss"},

{"expression": // 275
root(V("kiss").t("p"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true,"int":"yon"}),
"expected":"Has John been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpn0q.dss"},

{"expression": // 276
root(V("kiss").t("p"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true,"neg":true}),
"expected":"John has not been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpnn0.dss"},

{"expression": // 277
root(V("kiss").t("p"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true,"neg":true,"int":"yon"}),
"expected":"Has John not been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpnnq.dss"},

{"expression": // 278
root(V("kiss").t("pr"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true}),
"expected":"John having been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpp00.dss"},

{"expression": // 279
root(V("kiss").t("pr"),
     comp(N("John"))).typ({"pas":true,"perf":true,"prog":true,"int":"yon"}),
"expected":"John having been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpp0q.dss"},

{"expression": // 280
root(V("kiss").t("pr"),
     comp(N("John"))).typ({"pas":true,"neg":true,"perf":true,"prog":true}),
"expected":"John not having been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcppn0.dss"},

{"expression": // 281
root(V("kiss").t("pr"),
     comp(N("John"))).typ({"pas":true,"neg":true,"perf":true,"prog":true,"int":"yon"}),
"expected":"John not having been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcppnq.dss"},

{"expression": // 282
root(V("kiss").t("b"),
     comp(N("John"),
          det(P("for"))).a(" to")).typ({"pas":true,"perf":true,"prog":true}),
"expected":"For John to have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcpt00.dss"},

{"expression": // 283
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"perf":true,"prog":true,"int":"yon"})),
"expected":"For John to have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcpt0q.dss"},

{"expression": // 284
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"perf":true,"prog":true,"neg":true})),
"expected":"For John not to have been being kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppcptn0.dss"},

{"expression": // 285
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"perf":true,"prog":true,"neg":true,"int":"yon"})),
"expected":"For John not to have been being kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppcptnq.dss"},

{"expression": // 286
root(V("love"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John is loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0a00.dss"},

{"expression": // 287
root(V("love"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"Is John loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0a0q.dss"},

{"expression": // 288
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John is not loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0an0.dss"},

{"expression": // 289
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Is John not loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0anq.dss"},

{"expression": // 290
root(V("love").t("c"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John would be loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0c00.dss"},

{"expression": // 291
root(V("love").t("c"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"Would John be loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0c0q.dss"},

{"expression": // 292
root(V("love").t("c"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John would not be loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0cn0.dss"},

{"expression": // 293
root(V("love").t("c"),
     comp(N("John"))).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Would John not be loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0cnq.dss"},

{"expression": // 294
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John is loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0i00.dss"},

{"expression": // 295
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"Is John loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0i0q.dss"},

{"expression": // 296
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John is not loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0in0.dss"},

{"expression": // 297
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Is John not loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0inq.dss"},

{"expression": // 298
root(V("love").t("p").n("p")).typ({"pas":true}),
"expected":"Are loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0m00.dss"},

{"expression": // 299
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John is loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0n00.dss"},

{"expression": // 300
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"Is John loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0n0q.dss"},

{"expression": // 301
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John is not loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0nn0.dss"},

{"expression": // 302
root(V("love").t("p"),
     comp(N("John"))).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"Is John not loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0nnq.dss"},

{"expression": // 303
root(V("love").t("pr"),
     comp(N("John"))).typ({"pas":true}),
"expected":"John being loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0p00.dss"},

{"expression": // 304
root(V("love").t("pr"),
     comp(N("John"))).typ({"pas":true,"int":"yon"}),
"expected":"John being loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0p0q.dss"},

{"expression": // 305
root(V("love").t("pr"),
     comp(N("John"))).typ({"pas":true,"neg":true}),
"expected":"John not being loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0pn0.dss"},

{"expression": // 306
root(V("love").t("pr"),
     comp(N("John")).pos("pre")).typ({"pas":true,"neg":true,"int":"yon"}),
"expected":"John not being loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0pnq.dss"},

{"expression": // 307
root(N("John"),
     det(P("for")),
     comp(V("love").t("b-to")).typ({"pas":true})),
"expected":"For John to be loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0t00.dss"},

{"expression": // 308
root(N("John"),
     det(P("for")),
     comp(V("love").t("b-to")).typ({"pas":true,"int":"yon"})),
"expected":"For John to be loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0t0q.dss"},

{"expression": // 309
root(N("John"),
     det(P("for")),
     comp(V("love").t("b-to")).typ({"pas":true,"neg":true})),
"expected":"For John not to be loved. ",
"message":"./Examples_from_User_Manual/Verbs/pps0tn0.dss"},

{"expression": // 310
root(N("John"),
     det(P("for")),
     comp(V("love").t("b-to")).typ({"pas":true,"neg":true,"int":"yon"})),
"expected":"For John not to be loved? ",
"message":"./Examples_from_User_Manual/Verbs/pps0tnq.dss"},

{"expression": // 311
root(V("like").t("p"),
     comp(N("John")).pos("pre")).typ({"pas":true,"perf":true}),
"expected":"John has been liked. ",
"message":"./Examples_from_User_Manual/Verbs/ppspa00.dss"},

{"expression": // 312
root(V("kiss").t("p"),
     comp(N("John"))).typ({"pas":true,"perf":true,"int":"yon"}),
"expected":"Has John been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspa0q.dss"},

{"expression": // 313
root(V("kiss").t("p"),
     comp(N("John")).pos("pre")).typ({"pas":true,"perf":true,"neg":true}),
"expected":"John has not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspan0.dss"},

{"expression": // 314
root(V("kiss").t("p"),
     comp(N("John")).pos("pre")).typ({"pas":true,"perf":true,"neg":true,"int":"yon"}),
"expected":"Has John not been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspanq.dss"},

{"expression": // 315
root(V("like").t("c"),
     comp(N("John"))).typ({"perf":true,"pas":true}),
"expected":"John would have been liked. ",
"message":"./Examples_from_User_Manual/Verbs/ppspc00.dss"},

{"expression": // 316
root(V("kiss").t("c"),
     comp(N("John"))).typ({"perf":true,"pas":true,"int":"yon"}),
"expected":"Would John have been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspc0q.dss"},

{"expression": // 317
root(V("kiss").t("c"),
     comp(N("John"))).typ({"perf":true,"pas":true,"neg":true}),
"expected":"John would not have been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspcn0.dss"},

{"expression": // 318
root(V("kiss").t("c"),
     comp(N("John"))).typ({"perf":true,"pas":true,"neg":true,"int":"yon"}),
"expected":"Would John not have been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspcnq.dss"},

{"expression": // 319
root(V("like"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true}),
"expected":"John has been liked. ",
"message":"./Examples_from_User_Manual/Verbs/ppspi00.dss"},

{"expression": // 320
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"int":"yon"}),
"expected":"Has John been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspi0q.dss"},

{"expression": // 321
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"neg":true}),
"expected":"John has not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspin0.dss"},

{"expression": // 322
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"neg":true,"int":"yon"}),
"expected":"Has John not been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspinq.dss"},

{"expression": // 323
root(V("like").t("ip")).typ({"pas":true,"perf":true}),
"expected":"Have been liked. ",
"message":"./Examples_from_User_Manual/Verbs/ppspm00.dss"},

{"expression": // 324
root(V("kiss").t("p"),
     comp(Pro("I").pe(2))).typ({"pas":true,"perf":true,"neg":true}),
"expected":"You have not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspmn0.dss"},

{"expression": // 325
root(V("like"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true}),
"expected":"John has been liked. ",
"message":"./Examples_from_User_Manual/Verbs/ppspn00.dss"},

{"expression": // 326
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"int":"yon"}),
"expected":"Has John been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspn0q.dss"},

{"expression": // 327
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"neg":true}),
"expected":"John has not been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspnn0.dss"},

{"expression": // 328
root(V("kiss"),
     comp(N("John"))).t("p").typ({"perf":true,"pas":true,"neg":true,"int":"yon"}),
"expected":"Has John not been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspnnq.dss"},

{"expression": // 329
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"perf":true,"pas":true}),
"expected":"John having been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspp00.dss"},

{"expression": // 330
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"perf":true,"pas":true,"int":"yon"}),
"expected":"John having been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspp0q.dss"},

{"expression": // 331
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"perf":true,"neg":true,"pas":true}),
"expected":"John not having been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppsppn0.dss"},

{"expression": // 332
root(V("kiss"),
     comp(N("John"))).t("pr").typ({"perf":true,"neg":true,"pas":true,"int":"yon"}),
"expected":"John not having been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppsppnq.dss"},

{"expression": // 333
root(V("kiss"),
     comp(N("John"),
          mod(P("for")).pos("pre")),
     mod(P("to")).pos("pre")).t("b").typ({"perf":true,"pas":true}),
"expected":"For John to have been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppspt00.dss"},

{"expression": // 334
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"perf":true,"int":"yon"})),
"expected":"For John to have been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppspt0q.dss"},

{"expression": // 335
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"perf":true,"neg":true})),
"expected":"For John not to have been kissed. ",
"message":"./Examples_from_User_Manual/Verbs/ppsptn0.dss"},

{"expression": // 336
root(N("John"),
     det(P("for")),
     comp(V("kiss").t("b-to")).typ({"pas":true,"neg":true,"perf":true,"int":"yon"})),
"expected":"For John not to have been kissed? ",
"message":"./Examples_from_User_Manual/Verbs/ppsptnq.dss"}
];

//  other examples 
sentences.push(
{"expression": // 337
root(V("mean"),
     subj(V("win").t("pr"),
          subj(N("Mary")),
          comp(N("competition"),
               det(D("this")))),
     coord(C("and"),
           comp(V("study"),
                subj(N("Mary")).pro(),
                comp(P("in"),
                     comp(N("Paris")))).typ({mod:"poss"}),
           comp(V("live"),
                comp(P("with"),
                     comp(N("aunt").a(","),
                          det(D("my").g("f")))),
                          comp(V("adore"),
                               comp(Pro("whom")).pos("pre"),
                               subj(N("Mary")).pro())).typ({mod:"poss"}))
    ),
"expected":"Mary winning this competition means she can study in Paris and can live with her aunt, whom she adores. ",
"message":"Example 3 - RealPro-anlp97.pdf"}
);

sentences.push({
"expression": // 338
root(V("claim"),
     subj(N("girl"),
          det(D("this")),
          mod(A("small"))),
     mod(Adv("often")).pos("pre"),
     comp(C("that"),
          comp(V("claim"),
              subj(N("boy"),
                  det(D("that"))),
              mod(Adv("often")).pos("pre")),
          comp(C("that"),
              comp(V("like"),
                  subj(N("Mary")),
                  comp(N("wine"),
                         mod(A("red"))))))),
"expected":"This small girl often claims that that boy often claims that Mary likes red wine. ",
"message":"Example in section 7 - RealPro-anlp97.pdf "
});
sentences.push({
"expression": // 339
S(NP(D("this"),N("girl"),A("small")),
  VP(Adv("often"),V("claim"),
     SP(C("that"),
        NP(D("that"),N("boy")),
        VP(Adv("often"),V("say"),
          SP(C("that"),
              N("Mary"),
              VP(V("like"),
                 NP(A("red"),N("wine")))))))),
"expected":"This small girl often claims that that boy often says that Mary likes red wine. ",
"message":"Example in section 7 - RealPro-anlp97.pdf - Constituent version"
});
     

for (var i = 0; i < sentences.length; i++) {
    var s=sentences[i];
    var exp=s.expression;
    assert.equal(exp.realize(),s.expected,s.message)
}
});
