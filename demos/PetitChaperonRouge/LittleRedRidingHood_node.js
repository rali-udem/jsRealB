//////// 
//  load JSrealB
var fs = require('fs');
var jsrealb=require('../../dist/jsRealB-node.js');
// eval exports 
for (var v in jsrealb){
    eval("var "+v+"=jsrealb."+v);
}

loadEn();
updateLexicon(require("/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-dme.json"))
// add unknown English words to the dictionary
addToLexicon({"there":{"Adv":{"tab":["b1"]}}})
addToLexicon("this",{"D":{"tab":["d5"]}})
// little riding hood
var lrrh =  NP(A("little"),A("red"),V("ride").t("pr"),N("hood"))
var tlrrh = NP(D("the"),lrrh)
var LRRH =  NP(A("little").cap(),A("red").cap(),V("ride").t("pr").cap(),N("hood").cap())

var ppdb = function(det){
    return NP(D(det),A("petit"),N("pot"),PP(P("de"),N("beurre")))
}
function fmt(s){
    var mots=s.split(" ");
    var ligne="";
    for (var i = 0; i < mots.length; i++) {
        ligne+=mots[i]+" ";
        if (ligne.length>80){
            console.log(ligne);
            ligne=""
        }
    }
    if (ligne.length>0)
        console.log(ligne)
}

// function fmt(s){
//     console.log(s)
// }

 // Little Red Riding Hood
fmt(LRRH+"\n")

// Charles Perrault
fmt(Q("Charles Perrault")+"\n")

// Once upon a time there lived in a certain village a little country girl, the prettiest creature who was ever seen. 
var s1 = 
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
             VP(V("be").t("ps"),Adv("ever"),V("see").t("pp")))))

// Her mother was excessively fond of her; and her grandmother doted on her still more. 
var s2 =
    S(SP(NP(D("my").g("f"),N("mother")),
         VP(V("be").t("ps"),
            AdvP(Adv("excessively"),A("fond"),
                 PP(P("of"),Pro("me").g("f"))))).a(";"),
      SP(C("and"),
         NP(D("my").g("f"),N("grandmother")),
         VP(V("dote").t("ps"),
            PP(P("on"),
               Pro("me").g("f"),
               Adv("still"),D("more")))))

// This good woman had a little red riding hood made for her. 
var s3 =
    S(NP(D("this"),A("good"),N("woman")),
         VP(V("have"),
            NP(D("a"),lrrh),
            V("make").t("pp"),
            PP(P("for"),Pro("me").g("f"))))

// It suited the girl so extremely well that everybody called her Little Red Riding Hood.
var s4 =
    S(Pro("I"),
      VP(V("suit").t("ps"),
         NP(D("the"),N("girl")),
         AdvP(Adv("so"),Adv("well"),
              SP(C("that"),
                 Pro("everybody"),
                 VP(V("call").t("ps"),
                    Pro("me").g("f"),LRRH)))))

fmt(s1+" "+s2+" "+s3+" "+s4+"\n")
   
// One day her mother, having made some cakes, said to her, "Go, my dear, and see how your grandmother is doing, for I hear she has been very ill. Take her a cake, and this little pot of butter."
var s5 =
    S(SP(NP(D("one"),N("day"),D("my").g("f"),N("mother")).a(","),
         VP(V("make").t("pr"),
            NP(D("some"),N("cake")).n("p"))).typ({perf:true}).a(","),
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
                NP(D("this"),A("little"),N("pot"),P("of"),N("butter"))))
         ).en("\"")
     )
fmt(s5+"\n")

// Little Red Riding Hood set out immediately to go to her grandmother, who lived in another village.
var s6 =
     S(LRRH,
       VP(V("set").t("ps"),Adv("out"),Adv("immediately"),
          P("to"),V("go").t("b"),
          PP(P("to"),
             NP(D("my").g("f"),N("grandmother"),
                SP(Pro("who"),
                   VP(V("live").t("ps"),
                      PP(P("in"),
                         NP(D("another"),N("village"))))))))
     )
fmt(s6+"\n")

// As she was going through the wood, she met with a wolf, who had a very great mind to eat her up, but he dared not, because of some woodcutters working nearby in the forest. 
// He asked her where she was going. 
// The poor child, who did not know that it was dangerous to stay and talk to a wolf, said to him, "I am going to see my grandmother and carry her a cake and a little pot of butter from my mother."

          
/*  Original...
Little Red Riding Hood

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