//========== addLexicon-en.js
loadEn(); // make sure additions are to the English lexicon
// ajouts au lexique de JSrealB (version dme)
addToLexicon("tsunami",{"N":{"tab":["n1"]}});

// corrections au lexique
addToLexicon("need",{"N":{"tab":["n1"]},"V":{"tab":"v22"}}); // comme pour feed, était 167!!
addToLexicon("cooperate",{"V":{"tab":"v3"}});                // comme co-operate
addToLexicon("say",{"N":{"tab":["n1"]},"V":{"tab":"v19"}});  // était v79
addToLexicon("do",{"V":{"tab":"v96"}}); // enlever do comme nom...
addToLexicon("defense",{"N":{"tab":["n1"]}}); //idem que defence
// ajouts à des mots existants
addToLexicon("access",{"N":{"tab":["n5"]},"V":{"tab":"v2"}});   // ajout comme verbe
// adjectifs pour les modaux
addToLexicon("allowed",{"A":{"tab":["a1"]}})
addToLexicon("recommended",{"A":{"tab":["a1"]}})

addToLexicon("same",{"A":{"tab":["a1"]}})

// étrangement this est comme Adv et Pro mais non D dans le lexique...
// addToLexicon("this",{"D":{ "tab": ["d4"] }, "Pro": { "tab": ["pn8"]}}); // mais problème avec la table d3
addToLexicon("that",{"Pro":{"tab":["pn6"]},"Adv":{"tab":["b1"]},"D":{"tab":["d3"]}}); 
addToLexicon("one",{"Pro":{"tab":["pn5"]}}); // comme another
// ajout de prépositions
addToLexicon("than",{"P":{"tab":["pp"]}});
addToLexicon("as",{"P":{"tab":["pp"]}}); // as est déjà là comme adverbe
addToLexicon("on",{"Adv":{"tab":["b1"]}}); // on est déjà là comme prep
addToLexicon("off",{"Adv":{"tab":["b1"]}}); // off est déjà là comme prep
addToLexicon("down",{"Adv":{"tab":["b1"]}}); // down est déjà là comme prep
addToLexicon("up",{"P":{"tab":["pp"]},"Adv":{"tab":["b1"]}}); // up est déjà là comme prep
// ajouts d'adverbes
addToLexicon("more",{"Adv":{ "tab": ["b1"] }}); 
addToLexicon("many",{"Adv":{ "tab": ["b1"] }}); 
addToLexicon("too",{"Adv":{"tab":["b1"]}});
addToLexicon("how",{"Adv":{"tab":["b1"]}});
addToLexicon("most",{"Adv":{"tab":["b1"]}});
addToLexicon("less",{"Adv":{"tab":["b1"]}});
// modifications d'adverbes
addToLexicon("out",{"A":{"tab":["a1"]}}); // ajout comme adjectif
addToLexicon("all",{"Pro":{"tab":["b1"]}});// ajout comme pronom

// modifications de ponctuations
addToLexicon("'",{ "Pc": { "compl": "'", "tab": ["pc5","pc6"] }});
addToLexicon("«",{ "Pc": { "compl": "»", "tab": ["pc7"] }});
addToLexicon("»",{ "Pc": { "compl": "«", "tab": ["pc8"] }});

// ajouts pour les textes de biologie (fréquence plus de 50 dans amr-ISI/amr-release-{dev|test|training}.txt)
addToLexicon("mutate",{"V":{"tab":"v3"}});        // 1408
addToLexicon("phosphorylate",{"V":{"tab":"v3"}}); // 1329
addToLexicon("downregulate",{"V":{"tab":"v3"}});  // 160
addToLexicon("overexpress",{"V":{"tab":"v2"}});   // 138
addToLexicon("upregulate",{"V":{"tab":"v3"}});    // 121
addToLexicon("culture",{"V":{"tab":"v3"}});       // 112
addToLexicon("transfect",{"V":{"tab":"v1"}});     // 111
addToLexicon("metastasize",{"V":{"tab":"v3"}});   // 62
addToLexicon("immunoprecipitate",{"V":{"tab":"v3"}}); //52
addToLexicon("phosphorylation",{"N":{"tab":["n5"]}});  //52
addToLexicon("ubiquinate",{"V":{"tab":"v3"}});        //51
