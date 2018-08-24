//========== addLexicon-en.js
loadEn(); // make sure additions are to the English lexicon
// ajouts au lexique anglais de JSrealB 
addToLexicon("acquaint",{"V":{"tab":"v1"}});
addToLexicon("administrate",{"V":{"tab":"v3"}});
addToLexicon("asbestos",{"N":{"tab":["n1"]}});
addToLexicon("boa",{"N":{"tab":["n1"]}});
addToLexicon("brother-in-law",{"N":{"tab":["n1"]}});
addToLexicon("center",{"N":{"tab":["n1"]},"V":{"tab":"v3"}}); // idem que centre
addToLexicon("click",{"N":{"tab":["n1"]},"V":{"tab":"v1"}});
addToLexicon("conquer",{"V":{"tab":"v1"}});
addToLexicon("cooperate",{"V":{"tab":"v3"}});
addToLexicon("constrictor",{"N":{"tab":["n1"]}});
addToLexicon("correlate",{"V":{"tab":"v3"}});
addToLexicon("default",{"N":{"tab":["n1"]},"V":{"tab":"v1"}});
addToLexicon("defense",{"N":{"tab":["n1"]}}); //idem que defence
addToLexicon("e-mail",{"N":{"tab":["n1"]}});
addToLexicon('favor',{"N":{"tab":["n1"]},"V":{"tab":"v1"}});//idem que favour
addToLexicon("infer",{"V":{"tab":"v1"}});
addToLexicon("insult",{"V":{"tab":"v1"}});
addToLexicon("internet",{"N":{"tab":"n1"}});
addToLexicon("earthquake",{"N":{"tab":["n1"]}});
addToLexicon("globe",{"N":{"tab":["n1"]}});
addToLexicon("giggle",{"N":{"tab":["n1"]},"V":{"tab":"v3"}});
addToLexicon("governmental",{"A":{"tab":["a1"]}});
addToLexicon("lastly",{"Adv":{"tab":["b1"]}});
addToLexicon("matriarch",{"N":{"g":"f","tab":["n87"]}});
addToLexicon("media",{"N":{"tab":["n1"]}});
addToLexicon("obligate",{"V":{"tab":"v3"}});
addToLexicon("opine",{"V":{"tab":"v1"}});
addToLexicon("opium",{"N":{"tab":["n1"]}});
addToLexicon("panda",{"N":{"tab":["n1"]}});
addToLexicon("proliferation",{"N":{"tab":["n1"]}});
addToLexicon("semantics",{"N":{"tab":["n5"]}});
addToLexicon("sadden",{"V":{"tab":"v1"}});
addToLexicon("scarf",{"N":{"tab":["n1"]}});
addToLexicon("sift",{"V":{"tab":"v1"}});
addToLexicon("slay",{"V":{"tab":"v1"}});
addToLexicon("smuggle",{"V":{"tab":"v3"}});
addToLexicon("terrorism",{"N":{"tab":["n1"]}});
addToLexicon("thistle",{"N":{"tab":["n1"]}});
addToLexicon("traffic",{"N":{"tab":["n1"]}});
addToLexicon("vice",{"N":{"tab":["n1"]},"A":{"tab":["a1"]}});
addToLexicon("violate",{"V":{"tab":"v3"}});
addToLexicon("tsunami",{"N":{"tab":["n1"]}});
addToLexicon("url",{"N":{"tab":["n1"]}});
addToLexicon("web",{"N":{"tab":["n1"]}});
addToLexicon("whistle",{"N":{"tab":["n1"]},"V":{"tab":"v3"}});

weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
for (var i = 0; i < weekdays.length; i++) {
    addToLexicon(weekdays[i],{"N":{"tab":["n1"]}});
}
// corrections au lexique
addToLexicon("need",{"N":{"tab":["n1"]},"V":{"tab":"v22"}}); // comme pour feed, était 167!!
addToLexicon("say",{"N":{"tab":["n1"]},"V":{"tab":"v19"}}); // était v79
// ajouts à des mots existants
addToLexicon("access",{"N":{"tab":["n2"]},"V":{"tab":"v2"}});   // ajout comme verbe
addToLexicon("border",{"N":{"tab":["n1"]},"V":{"tab":"v1"}});   // ajout comme verbe
addToLexicon("except",{"P":{"tab":["pp"]},"V":{"tab":"v1"}});   // ajout comme verbe
addToLexicon("evidence",{"N":{"tab":["n5"]},"V":{"tab":"v3"}});
addToLexicon("key",{"N":{"tab":["n1"]},"A":{"tab":"a1"}});
addToLexicon("sanction",{"N":{"tab":["n1"]},"V":{"tab":"v1"}});   // ajout comme verbe
addToLexicon("source",{"N":{"tab":["n1"]},"V":{"tab":"v3"}});   // ajout comme verbe
addToLexicon("worth",{"N":{"tab":["n5"]},"V":{"tab":"v2"}});
// adjectifs pour les modaux
addToLexicon("obligatory",{"A":{"tab":["a1"]}});
addToLexicon("allowed",{"A":{"tab":["a1"]}});
addToLexicon("recommended",{"A":{"tab":["a1"]}});
addToLexicon("preferable",{"A":{"tab":["a1"]}});

addToLexicon("same",{"A":{"tab":["a1"]}});

// étrangement this est comme Adv et Pro mais non D dans le lexique...
addToLexicon("this",{"D":{ "tab": ["d4"] }, "Pro": { "tab": ["pn8"]}}); // mais problème avec la table d3
addToLexicon("that",{"Pro":{"tab":["pn6"]},"Adv":{"tab":["b1"]},"D":{"tab":["d3"]}}); 
// ajout de prépositions
addToLexicon("than",{"P":{"tab":["pp"]}});
addToLexicon("as",{"P":{"tab":["pp"]},"Adv":{"tab":["b1"]}}); // as est déjà là comme adverbe
addToLexicon("on",{"P":{"tab":["pp"]},"Adv":{"tab":["b1"]}}); // on est déjà là comme prep
addToLexicon("off",{"P":{"tab":["pp"]},"Adv":{"tab":["b1"]}}); // off est déjà là comme prep
addToLexicon("down",{"P":{"tab":["pp"]},"Adv":{"tab":["b1"]}}); // down est déjà là comme prep
// ajouts d'adverbes
addToLexicon("more",{"Adv":{ "tab": ["b1"] }}); 
addToLexicon("many",{"Adv":{ "tab": ["b1"] }}); 
addToLexicon("too",{"Adv":{"tab":["b1"]}});
addToLexicon("how",{"Adv":{"tab":["b1"]}});
addToLexicon("most",{"Adv":{"tab":["b1"]}});
addToLexicon("less",{"Adv":{"tab":["b1"]}});
// modifications d'adverbes
addToLexicon("out",{"Adv":{"tab":["b1"]},"A":{"tab":["a1"]}}); // ajout comme adjectif
addToLexicon("all",{"Adv":{"tab":["b1"]},"Pro":{"tab":["b1"]}});// ajout comme pronom
