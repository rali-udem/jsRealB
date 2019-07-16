// add person names to the vocabulary
loadEn();
addToLexicon({"John":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Jim": {"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Bill":{"N":{"g":"m","tab":["n4"]}}})
addToLexicon({"Mary":{"N":{"g":"f","tab":["n4"]}}})

/* 
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html",no:"35a",
 expr:`
`},
*/

var examplesEn = [
{
 expr:`
S(NP(D('the'),
     N('cat')),
  VP(V('eat'),
     NP(D('the'),
        N('mouse'))))`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html",no:"35a",
 expr:`
S(Pro("I").pe(2),
  VP(V("know"),
     SP(Pro("that"),
        S(N("Bill"),
          VP(V("marry").t("ps"),
             D("my").g("m").ow("s"),
             Q("ex").lier("-"),N("wife")))).t("ps")
             ))
`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html",no:"35b",
 expr:`
S(Pro("I").g("f"),
  VP(V("love"),
     Pro("me"),Adv("still")))
     .typ({int:"yon"})
`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html",no:"Homework 6 (1a)",
 expr:`
S(N("Mary"),
  VP(V("talk"),
     PP(P("to"),N("Bill"))))
`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch7.html",no:"20",
 expr:`
S(NP(N("John")),
  VP(V("cheat"),NP(N("Bill"))))
  .t("ps")
`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch7.html",no:"26b",
 expr:`
S(NP(N("Bill")),
  VP(V("explain"),
     NP(D("the"),N("problem")),
        PP(P("to"),Pro("me").g("f"))))
`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch7.html",no:"26c",
 expr:`
S(NP(N("Jim")),
  VP(V("make"),
     NP(D("the"),N("claim"),
        SP(S(Pro("that"),
          NP(N("Bill")),
          VP(V("put"),
             NP(D("the"),N("idea")),
             PP(P("behind"),
                Pro("me")))).typ({mod:"nece"}).t("ps")
           ))))
`},
];
var examplesFr = [
    {
     expr:`
S(NP(D('le'),
     N('chat')),
  VP(V('manger'),
     NP(D('le'),
        N('souris'))))`},
{ref:"Huang",url:"http://www.people.fas.harvard.edu/~ctjhuang/lecture_notes/lecch6.html",no:"35a",
 expr:`
S(Pro("je").pe(2),
  VP(V("savoir"),
     SP(Pro("que"),
        S(Q("Bill"),
          VP(V("marier").t("ps"),
             D("mon").g("m"),
             Q("ex").lier("-"),N("femme")))).t("ps")
             ))
`}
];

var examples={"en":examplesEn,"fr":examplesFr};
