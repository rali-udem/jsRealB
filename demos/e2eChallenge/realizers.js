//////////// realiser part using jsRealB
// the given choices "...":[...] are from the training set
Object.assign(globalThis,jsRealB);

class Realizer {
    // Common processing to both languages
    // Simple concatenation of the realization taking care of undefined return
    realize(fields,phrase_type){
        function noUndef(struct){
            if (struct == undefined) return ""
            return struct.realize()
        }
        switch (phrase_type) {
            case 1:
                return noUndef(CP(this.and_conj,
                                  this.advice(fields),
                                  this.customerRating(fields),
                                  this.familyFriendly(fields)));
            case 2:
                return noUndef(CP(this.and_conj,
                                  this.advice(fields),
                                  this.customerRating(fields)).a("."))
                       + noUndef(this.familyFriendly(fields));
            case 3:                        
                return noUndef(this.advice(fields))
                    + noUndef(this.customerRating(fields))
                    + noUndef(this.familyFriendly(fields))
        }
    }
}

class English extends Realizer {
    constructor(){
        super()
        loadEn();
        addToLexicon({"coffee shop":{"N":{"tab":"n1"}}});    
        this.allPlaces=["place","arena","venue","establishment","restaurant"];
        this.and_conj = C("and")
    }

    realize(fields,key){
        loadEn();
        return super.realize(fields,key)
    }

    advice(fields) {
        // "name":[  "Alimentum", ... ],
        const name="name" in fields?Q(fields["name"]):NP(D("the"),N(oneOf("restaurant","establishment"))); 
        // "eatType":[ "coffee shop", "pub", "restaurant" ]
        const eatType=NP(D("a"),N("eatType" in fields?fields["eatType"]:oneOf(this.allPlaces)));
        // "near":[ "Yippee Noodle Bar", ... ],
        const near="near" in fields?PP(P("near"),Q(fields["near"])):null;
        // "area":[ "riverside", "city centre" ],
        let area, food, priceRange;
        if ("area" in fields){
            area=fields["area"]=="riverside" 
              ? oneOf(()=>PP(P("on"),NP(D("the"),N("riverside"))),
                      ()=>PP(P("in"),NP(D("the"),N("riverside"),N("area"))),
                     )
              : PP(P("in"),NP(D("the"),N("city"),N("centre")))
        }

        // "food":[ "Chinese", "English", "Fast food", "French", "Indian", "Italian", "Japanese" ],
        if ("food" in fields){
            const fo=fields["food"];
            if (fo=="Fast food")fo="fast";
            food=Q(fo);
            const npFood=NP(food,N("food"));
            const serve=V(oneOf("serve","provide","have","offer"))
            food = oneOf(()=>SP(Pro("that"),serve,npFood),
                         ()=>VP(serve.t("pr"),npFood))
        };
        // "priceRange":[ "cheap", "high", "less than £20", "moderate", "more than £30", "£20-25" ],
        if ("priceRange" in fields){
            const pr=fields["priceRange"];
            priceRange=pr.indexOf("£")>=0?PP(P("with"),N("price").n("p"),Q(pr))
                                        :PP(P("with"),NP(A(pr),N("price").n("p")));
        }
        return S(name,VP(V("be"),eatType,near,area,food,priceRange))
    }

    customerRating(fields){
        // "customer rating":[ "5 out of 5", "average", "1 out of 5", "low", "3 out of 5", "high" ]
        if ("customer rating" in fields){
            const cr=fields["customer rating"];
            return S(Pro("I").g("n"),
                             VP(V("have"),
                                oneOf(()=>NP(D("a"),Q(cr),oneOf(N("customer"),Q("")),N("rating")),
                                      ()=>NP(D("a"),oneOf(N("customer"),Q("")),N("rating"),P("of"),Q(cr))))
                             )
        }
    }

    familyFriendly(fields){
        // "familyFriendly":[ "yes", "no" ],
        if ("familyFriendly" in fields){
            return S(oneOf(()=>Pro("I").g("n"),
                           ()=>NP(D("the"),N(oneOf(this.allPlaces))),
                           ()=>Pro("I").n("p")
                          ),
                             VP(V("be"),
                                NP(oneOf(N("family").lier(),N("kid")),A("friendly").pos("post"))))
                           .typ({"neg":fields["familyFriendly"]=="no"})
        }
    }
}

class Francais extends Realizer {
    constructor(){
        super()
        loadFr();
        addToLexicon({"pub":{"N":{"g":"m","tab":"n3"}}});
        addToLexicon({"centre-ville":{"N":{"g":"m","tab":"n3"}}});    
        addToLexicon({"adapté":{"A":{"tab":"n28"}}});
        addToLexicon({"classé":{"A":{"tab":"n28"}}});   
        this.allPlaces=["endroit","institution","entreprise","établissement","restaurant"];
        this.and_conj = C("et")
    }

    realize(fields,key){
        loadFr();
        return super.realize(fields,key)
    }

     advice(fields) {
        // "name":[  "Alimentum", ... ],
        const name="name" in fields?Q(fields["name"]):NP(D("le"),N(oneOf("restaurant","établissement")));
        // "eatType":[ "coffee shop", "pub", "restaurant" ]
        const eatType=NP(D("un"),
                         N("eatType" in fields
                            ? (fields["eatType"]=="coffee shop"?"café": fields["eatType"])
                            : oneOf(this.allPlaces)));
        // "near":[ "Yippee Noodle Bar", ... ],
        const near="near" in fields?PP(Adv("près"),P("de"),Q(fields["near"])):"";
        // "area":[ "riverside", "city centre" ],
        let area, food, priceRange;
        if ("area" in fields){
            area=fields["area"]=="riverside"
               ? oneOf(()=>PP(P("à"),NP(D("le"),N("bord"),P("de"),NP(D("le"),N("rivière")))),
                       ()=>PP(P("dans"),NP(D("le"),N("quartier"),Q("Riverside"))))
               : PP(P("à"),NP(D("le"),N("centre-ville")))
        }

        // "food":[ "Chinese", "English", "Fast food", "French", "Indian", "Italian", "Japanese" ]
        const foodFr = { "Chinese":"chinois", "English":"anglais", 
                         "French":"français", "Indian":"indien", "Italian":"italien", "Japanese":"japonais" };
        if ("food" in fields){
            const fo=fields["food"];
            let foodKind;
            if (fo=="Fast food"){
                foodKind = Q("de la restauration rapide")
            } else {
                foodKind=NP(D("un"),N("cuisine"),A(foodFr[fo]))
            }
            const serve=V(oneOf("servir","offrir","proposer","présenter"))
            food = oneOf(()=>SP(Pro("qui"),serve,foodKind),
                         ()=>VP(serve.t("pr"),foodKind))
        };
        // "priceRange":[ "cheap", "high", "less than £20", "moderate", "more than £30", "£20-25" ],
        const priceRangeFr=  {"cheap":A("abordable"), 
                        "high":A("élevé"), 
                        "less than £20":Q("moins de £20"), 
                        "moderate":A("modéré"), 
                        "more than £30":Q("plus de £30"), 
                        "£20-25":Q("£20-25")};
        if ("priceRange" in fields){
            const pr=fields["priceRange"];
            priceRange=pr.indexOf("£")>=0
               ? PP(P("avec"),NP(D("un"),N("prix").n("p"),P("de"),priceRangeFr[pr]))
               : PP(P("à"),NP(priceRangeFr[pr],N("prix").n("p")));
        }
        return S(name,VP(V("être"),eatType,near,area,food,priceRange))
    }

    customerRating(fields){
        const customerRatingFr= {"5 out of 5":Q("5 sur 5"), "average":A("moyen"), 
         "1 out of 5":Q("1 sur 5"), "low":A("bas"), "3 out of 5":Q("3 sur 5"), 
         "high":A("élevé")};
        // "customer rating":[ "5 out of 5", "average", "1 out of 5", "low", "3 out of 5", "high" ]
        if ("customer rating" in fields){
            const cr=customerRatingFr[fields["customer rating"]];
            return oneOf(()=>S(Pro("lui").c("nom"),
                               VP(V("obtenir"),NP(D("un"),N("classement"),cr))),
                         ()=>S(NP(D("le"),N("client").n("p")),
                               VP(Pro("me*coi"),V("donner"),
                                  NP(D("un"),N("classement"),cr))),
                         ()=>S(Pro("lui").c("nom"),VP(V("être"),A("classé"),cr))
                        )
        }
    }

    familyFriendly(fields){
        // "familyFriendly":[ "yes", "no" ],
        if ("familyFriendly" in fields){
            return S(oneOf(()=>Pro("lui").c("nom"),
                           ()=>NP(D("le"),N(oneOf(this.allPlaces)))),
                    VP(V("être"),
                       A(oneOf("adapté","approprié")),
                       PP(P("pour"),NP(D("le"),N("enfant").n("p"))))
                    ).typ({"neg":fields["familyFriendly"]=="no"})
        }
    }
}