function you(){return Pro("I").pe(2).n("s")}
function we(){return Pro("I").pe(1).n("p")}
function us(){return Pro("me").pe(1).n("p")}


function name(personality,name_value){
    if(name_value===null)return null;
    let res;
    switch (personality) {
        case "AGREEABLE":
        case "CONSCIENTIOUSNESS":
            res = oneOf(
                ()=>SP(VP(V("let").t("ip"),us(),V("see").t("b"),
                          oneOf(()=>SP(Pro("what"),
                                       VP(we(),V("find"),
                                          PP(P("about"),Q(name_value))).typ({"mod":"poss"})),
                                ()=>Q(name_value)))),
                ()=>SP(you(),
                       VP(V("want"),P("to"),V("know").t("b"),Adv("more"),
                          PP(P("about"),Q(name_value)))),
                ()=>SP(you(),
                       VP(V("say"),Q(name_value))).t("ps").typ({"int":"yon"})
            )
            break;
        case "DISAGREEABLE":
            res = oneOf(
                ()=>SP(oneOf(Q(""),Adv("actually").a(",")),
                       oneOf(Q(""),Adv("basically").a(",")),
                       Pro("everybody"),
                       VP(V("know"),Q(name_value))),
                ()=>SP(Q("oh"),N("god").cap(),Adv("basically").a(","),Q(name_value)),
                ()=>SP(Q(name_value))
            )
            break;            
        case "UNCONSCIENTIOUSNESS":
            res=name("DISAGREEABLE",name_value)
            res.add(oneOf(
                ()=>Q("err..."),
                ()=>Q("oh gosh err..."),
                ()=>S(Q(oneOf("Yeah","oh gosh","mhm...")),Pro("I").pe(1),
                      VP(V("be"),A("sure"))).typ({neg:true}),
                ()=>Q(oneOf("yeah","well","right")).a(",")
            ),0);
            break;
         case "EXTRAVERT":
            res=name("AGREEABLE",name_value)
            res.add(oneOf(
                ()=>null,
                ()=>Q(oneOf("yeah","well","right")).a(",")
            ),0)
            break;
        default:
            bad("name",personality);
            break;
    }
    return res;
}

function near(personality,near_value){
    let nearP=P("near")
    switch (personality) {
        case "DISAGREEABLE":
            if (Math.random()>0.5)
                nearP=AP(A("damn"),nearP)
            break;
        case "AGREEABLE":
            if (Math.random()>0.5)
                nearP=PP(N("sort"),PP(P("of"),nearP))
        default:
            break;
    }
    const res = oneOf(
        ()=>S(Pro("I"),VP(V("be")),
                PP(nearP,Q(near_value))),
        ()=>SP(C("and"),
                S(Pro("I"),VP(V("be")),
                              PP(nearP,Q(near_value)))),
        ()=>PP(nearP,Q(near_value))
    )
    return res;
}




function finale(personality){
    switch (personality) {
        case "AGREEABLE":
            return oneOf(
                ()=> SP(you(),VP(V("see"))).a("?"),
                ()=> Adv("alright").a("?"),
                ()=> Q("okay").a("?"),
                ()=>null
            )
        case "DISAGREEABLE":
            if (Math.random()<0.2)
                return S(Q(oneOf("Oh God, come on","Come on, oh God","Come on, I mean")))
            return null;
        case "CONSCIENTIOUSNESS": 
        case "UNCONSCIENTIOUSNESS":
            return null;
        case "EXTRAVERT":
            return oneOf(
                ()=> N("pal").a("!"),
                ()=> N("buddy").a("!"),
                ()=> N("mate").a("!"),
                ()=> SP(you(),VP(V("know"))).typ({exc:true}),
                ()=> null
            )
        default:
            return bad("finale",personality)
    }
}

function bad(mr_value,personality){
    console.warn("%s: unimplemented personality: %s",mr_value,personality);
    return null
}

// adapted from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
}

//  Crude content planning 
//     returns the list of of non-null fields in random order, but starting with "name" and ending with finale
//     ensure that output food and foodtype together when both are present
function content_plan(infos){
    if ("food" in infos && "eatType" in infos)delete infos["eatType"] // foodType is combined with food when present...
    let fields = mr_fields.filter(v=>v!="name" && infos[v]!==null && infos[v]!==undefined)
    shuffleArray(fields)
    fields.unshift("name")
    fields.push("finale")
    return fields
}

/**
 * @param {string} personality
 * @param {{ [x: string]: any; }} infos
 */
function generate(fields,personality,infos){
    let expr;
    let exprs=[];
    // generate each field keeping only non-null ones
    for (const field of fields) {
        switch (field) {
            case "name":
                expr=name(personality,infos["name"]);
                break;
            case "area":
                expr=area(personality,infos["area"]);
                break;
            case "customerRating":
                expr=customerRating(personality,infos["customerRating"]);
                break;
            case "familyFriendly":
                expr=familyFriendly(personality,infos["familyFriendly"]);
                break;
            case "food":case "eatType":
                expr=food_eattype(personality,infos["food"],infos["eatType"]);
                break;
            case "near":
                expr=near(personality,infos["near"]);
                break;
            case "priceRange":
                expr=priceRange(personality,infos["priceRange"]);
                break;
            case "finale":
                expr=finale(personality);
                break;
            default:
                console.warn("bad field:",field)
                break;
        }
        if (expr!=null)exprs.push(expr)
    }
    // combine the expressions into one or more lists of at most NB expressions
    const NB=4
    let exprss=[]
    while (exprs.length>=NB){
        const typ=exprs[0].getProp("typ");
        if (typ && "int" in typ){ // check for an interrogative that should appear alone
            exprss.push(exprs.splice(0,1))
        } else {
            const l=Math.trunc(Math.random(NB)*NB)+1
            exprss.push(exprs.splice(0,l))
        }
    }
    if (exprs.length>0){
        exprss.push(exprs)
    }
    // Realize the final string
    let res=""
    for (const exprs of exprss) {
        // separate each expression in a list of expressions by a comma or "and"
        res+=S(CP(exprs.length>2?C("and"):null,exprs))
    }
    return res;
}
