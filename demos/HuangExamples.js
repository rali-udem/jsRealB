//  
// Some interesting examples of transformations of sentences for developing jsRealB
// taken from
//    http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html
//

// add person names to the vocabulary
addToLexicon({"John":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Jim": {"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Bill":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":["n4"]}}})

//  ex 35a
//  => Do you know that Bill married his ex-wife again?
S(Pro("I").pe(2),
  VP(V("know"),
     SP(Pro("that"),
        S(Q("Bill"),
          VP(V("marry").t("ps"),
             D("my").g("m").ow("s"),
             Q("ex").lier("-"),N("wife"))))
             )).t("ps")
 .typ({int:"yon"})
// .typ({int:"yon",mod:"will"}).t("ps")
//  => Would you know that Bill married his ex-wife again?
// .typ({int:"yon",neg:true})
//  => Don't you know that Bill married his ex-wife again?
   

//  ex 35b
//  => Does she love him still?
S(Pro("I").g("f"),
  VP(V("love"),
     Pro("me"),Adv("still")))
     .typ({int:"yon"})
// .typ({neg:false,prog:true,int:"yon"})
//  => Is she loving him still?


//  Homework 6 -1a
//  =>  Mary won't talk to Bill.   
S(Q("Mary"),
  VP(V("talk"),
     PP(P("to"),Q("Bill"))))
// .typ({prog:true,neg:true,int:"yon"}).t("f")
//  => Won't Mary be talking to Bill?


//  taken from 
//    http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch7.html

//  ex 11a
//  => Bill was cheated by John. (ex 20)
S(NP(N("John")),
  VP(V("cheat"),NP(N("Bill"))))
  .typ({pas:true}).t("ps")
//  .typ({prog:true,perf:true}) (ex 26a)
// => John has been cheating Bill.
//   .typ({prog:true,perf:true,prog:true,pas:true}) (ex 27a)
// => Bill has been being cheated by John.

// ex 26b 
//   => Bill must have been explaining the problem to her.
S(NP(N("Bill")),
  VP(V("explain"),
     NP(D("the"),N("problem")),
        PP(P("to"),Pro("me").g("f"))))
.typ({prog:true,perf:true,mod:"obli"})
// .typ({prog:true,perf:true,pas:true,mod:"obli"}) (ex 27b)
// => The problem must have been being explained by Bill to her.
// .typ({prog:true,perf:true,pas:true,neg:true,mod:"obli"}) (tous les flags.)
// => The problem must not have been being explained by Bill to her.

// ex 26c
// => Jim has made the claim that Bill should put the idea behind him.
S(NP(N("Jim")),
  VP(V("make"),
     NP(D("the"),N("claim"),
        SP(S(Pro("that"),
          NP(N("Bill")),
          VP(V("put"),
             NP(D("the"),N("idea")),
             PP(P("behind"),
                Pro("me")))).typ({mod:"nece"}).t("ps")
           )))).typ({perf:true})
// ex 27c
//      Pro("me")))).typ({mod:"nece",pas:true}).t("ps")
// )))).typ({perf:true,pas:true})
// => The claim that the idea should be put by Bill behind him has been made by Jim.

           
