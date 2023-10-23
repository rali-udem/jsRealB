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
