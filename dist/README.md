# jsRealB - A JavaScript Bilingual Text Realizer for Web Development

*Version 4.0 - May 2022*

**Natural Language Generation (NLG)** is a field of artificial intelligence that focuses on the development of systems that produce text for different applications, for example the textual description of massive datasets or the automation of routine text creation.

The web is constantly growing and its content, getting progressively more dynamic, is well-suited to automation by a realizer. However existing realizers are not designed with the web in mind and their operation requires much knowledge, complicating their use.

**jsRealB is a text realizer designed specifically for the web**, easy to learn and to use. This realizer allows its user to build a variety of French and English expressions and sentences, to add HTML tags to them and to easily integrate them into web pages.

The documentation can be accessed [here](http://rali.iro.umontreal.ca/JSrealB/current/documentation/user.html?lang=en). You can switch language in the upper right corner of the page. 

### Example of use of npm package after install
    var jsRealB=require("jsrealb")

    // import exports in current scope
    for (var v in jsRealB)
            eval(v+"=jsRealB."+v);

    // realize the English sentence : "The cats will chase the mouse."
    loadEn(true)
    console.log(""+S(NP(D("the"),N("cat")),VP(V("chase"),NP(D("the"),N("mouse")))).n("p").t("f"))
    
[Guy Lapalme](mailto:lapalme@iro.umontreal.ca)

