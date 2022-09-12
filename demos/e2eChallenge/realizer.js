//////////// realiser part using jsRealB
// the given choices "...":[...] are from the training set
Object.assign(globalThis,jsRealB);

// English realizer
function jsrRealize(fields){
    loadEn();
    // "name":[  "Alimentum", ... ],
    var name="name" in fields?Q(fields["name"]):NP(D("the"),N(oneOf("restaurant","establishment")));
    var allPlaces=["place","arena","venue","establishment","restaurant"];

    // "eatType":[ "coffee shop", "pub", "restaurant" ]
    var eatType=NP(D("a"),N("eatType" in fields?fields["eatType"]:oneOf(allPlaces)));

     // "near":[ "Yippee Noodle Bar", ... ],
    var near="near" in fields?PP(P("near"),Q(fields["near"])):"";

    // "area":[ "riverside", "city centre" ],
    var area="";
    if ("area" in fields){
        area=fields["area"]=="riverside"?oneOf(()=>PP(P("on"),NP(D("the"),N("riverside"))),
                                               ()=>PP(P("in"),NP(D("the"),N("riverside"),N("area"))),
                                              )
                                        :PP(P("in"),NP(D("the"),N("city"),N("centre")))
    }

    var advice=S(name,VP(V("be"),eatType,near,area));

    // "food":[ "Chinese", "English", "Fast food", "French", "Indian", "Italian", "Japanese" ],
    var food="";
    if ("food" in fields){
        var fo=fields["food"];
        if (fo=="Fast food")fo="fast";
        food=Q(fo);
        var npFood=NP(food,N("food"));
        var serve=V(oneOf("serve","provide","have","offer"))
        advice.add(oneOf(SP(Pro("that"),serve,npFood),
                         VP(serve.clone().t("pr"),npFood)))
    };
    
    // "priceRange":[ "cheap", "high", "less than £20", "moderate", "more than £30", "£20-25" ],
    var priceRange="";
    if ("priceRange" in fields){
        var pr=fields["priceRange"];
        priceRange=pr.indexOf("£")>=0?PP(P("with"),N("price").n("p"),Q(pr))
                                     :PP(P("with"),NP(A(pr),N("price").n("p")));
        advice.add(priceRange);
    }
    
    // "customer rating":[ "5 out of 5", "average", "1 out of 5", "low", "3 out of 5", "high" ],
    var customerRating="";
    if ("customer rating" in fields){
        var cr=fields["customer rating"];
        customerRating=S(Pro("I").g("n"),
                         VP(V("have"),
                            oneOf(()=>NP(D("a"),Q(cr),oneOf(N("customer"),Q("")),N("rating")),
                                  ()=>NP(D("a"),oneOf(N("customer"),Q("")),N("rating"),P("of"),Q(cr))))
                         );
    }

    // "familyFriendly":[ "yes", "no" ],
    var familyFriendly=""
    if ("familyFriendly" in fields){
        familyFriendly=S(oneOf(()=>Pro("I").g("n"),
                               ()=>NP(D("the"),N(oneOf(allPlaces))),
                               ()=>Pro("I").n("p")
                         ),
                         VP(V("be"),
                            NP(oneOf(N("family").lier(),N("kid")),A("friendly"))))
                       .typ({"neg":fields["familyFriendly"]=="no"})
    }

    return advice+" "+customerRating+" "+familyFriendly;
}

// French realizer
function jsrRealiser(fields){
    loadFr();
    // "name":[  "Alimentum", ... ],
    var name="name" in fields?Q(fields["name"]):NP(D("le"),N(oneOf("restaurant","établissement")));
    var allPlaces=["endroit","institution","entreprise","établissement","restaurant"];

    // "eatType":[ "coffee shop", "pub", "restaurant" ]
    var eatType=NP(D("un"),N("eatType" in fields?(fields["eatType"]=="coffee shop"?"café":fields["eatType"])
                                                :oneOf(allPlaces)));

     // "near":[ "Yippee Noodle Bar", ... ],
    var near="near" in fields?PP(Adv("près"),P("de"),Q(fields["near"])):"";

    // "area":[ "riverside", "city centre" ],
    var area="";
    if ("area" in fields){
        area=fields["area"]=="riverside"?oneOf(()=>PP(P("à"),NP(D("le"),N("bord"),P("de"),NP(D("le"),N("rivière")))),
                                               ()=>PP(P("dans"),NP(D("le"),N("quartier"),Q("Riverside"))))
                                        :PP(P("à"),NP(D("le"),N("centre-ville")))
    }
    var advice=S(name,VP(V("être"),eatType,near,area));

    // "food":[ "Chinese", "English", "Fast food", "French", "Indian", "Italian", "Japanese" ],
    foodFr = { "Chinese":"chinois", "English":"anglais", "Fast food":"de la restauration rapide", 
               "French":"français", "Indian":"indien", "Italian":"italien", "Japanese":"japonais" };
    var food="";
    if ("food" in fields){
        var fo=fields["food"];
        if (fo=="Fast food")npFood=Q(foodFr[fo]);
        else npFood=NP(D("un"),N("cuisine"),A(foodFr[fo]));
        var serve=V(oneOf("servir","offrir","proposer","présenter"))
        advice.add(oneOf(SP(Pro("qui"),serve,npFood),
                         VP(serve.clone().t("pr"),npFood)
                         )
                  )
    };
    
    // "priceRange":[ "cheap", "high", "less than £20", "moderate", "more than £30", "£20-25" ],
    priceRangeFr=  {"cheap":A("abordable"), "high":A("élevé"), "less than £20":Q("moins de £20"), 
                    "moderate":A("modéré"), "more than £30":Q("plus de £30"), "£20-25":Q("£20-25")};
    var priceRange="";
    if ("priceRange" in fields){
        var pr=fields["priceRange"];
        priceRange=pr.indexOf("£")>=0?PP(P("avec"),NP(D("un"),N("prix").n("p"),P("de"),priceRangeFr[pr]))
                                     :PP(P("à"),NP(priceRangeFr[pr],N("prix").n("p")));
        advice.add(priceRange);
    }
    
    // "customer rating":[  ],
    customerRatingFr= {"5 out of 5":Q("5 sur 5"), "average":A("moyen"), "1 out of 5":Q("1 sur 5"), 
                       "low":A("bas"), "3 out of 5":Q("3 sur 5"), "high":A("élevé")};
    var customerRating="";
    if ("customer rating" in fields){
        var cr=customerRatingFr[fields["customer rating"]];
        customerRating=oneOf(()=>S(eatType.clone().pro(),
                                   VP(V("obtenir"),NP(D("un"),N("classement"),cr))),
                             ()=>S(NP(D("le"),N("client").n("p")),
                                   VP(Pro("me*coi"),V("donner"),
                                      NP(D("un"),N("classement"),cr))),
                             ()=>S(eatType.clone().pro(),VP(V("être"),A("classé"),cr))
                             );
    }

    // "familyFriendly":[ "yes", "no" ],
    var familyFriendly=""
    if ("familyFriendly" in fields){
        familyFriendly=S(oneOf(()=>eatType.clone().pro(),
                               ()=>NP(D("le"),N(oneOf(allPlaces)))),
                         VP(V("être"),
                            A(oneOf("adapté","approprié")),
                            PP(P("pour"),NP(D("le"),N("enfant").n("p")))))
                       .typ({"neg":fields["familyFriendly"]=="no"})
    }
    return advice+" "+customerRating+" "+familyFriendly;
}

function updateLexicons(){
    // addToLexicon({"center":{"N":{"tab":"n1"},"V":{"tab":"v3"}}});// idem as centre (Canadian...)
    loadEn();
    addToLexicon({"coffee shop":{"N":{"tab":"n1"}}});
    addToLexicon("riverside",{N: {tab: "n1"}});
    for (let foodType in ["Chinese","English","French","Indian","Italian","Japanese"])
        addToLexicon(foodType,{ A:{tab:'a1'}});
    
    loadFr();
    addToLexicon({"restaurant":{"N":{"g":"m","tab":"n3"}}});
    addToLexicon({"pub":{"N":{"g":"m","tab":"n3"}}});
    addToLexicon({"entreprise":{"N":{"g":"f","tab":"n17"}}});
    addToLexicon({"institution":{"N":{"g":"f","tab":"n17"}}});
    addToLexicon({"centre-ville":{"N":{"g":"m","tab":"n3"}}});// à vérifier pour faire centres-ville au pluriel...

    addToLexicon({"adapté":{"A":{"tab":"n28"}}});
    addToLexicon({"approprié":{"A":{"tab":"n28"}}});
    addToLexicon({"classé":{"A":{"tab":"n28"}}});

    addToLexicon({"élevé":{"A":{"tab":"n28"}}});
    addToLexicon({"modéré":{"A":{"tab":"n28"}}});
    addToLexicon({"abordable":{"A":{"tab":"n25"}}})

    addToLexicon({"classement":{"N":{"g":"m","tab":"n3"}}});
    // types de repas
    addToLexicon({"chinois":{"A":{"tab":"n27"}}});
    addToLexicon({"japonais":{"A":{"tab":"n27"}}});
    addToLexicon({"italien":{"A":{"tab":"n49"}}});
    addToLexicon({"indien":{"A":{"tab":"n49"}}});    
}
