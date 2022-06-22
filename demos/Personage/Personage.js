// Implementation in jsRealB of
// F. Mairesse and M. A. Walker.
// Towards personality-based user adaptation: psychologically informed stylistic language generation.
// User Model. User Adapt. Interact., 20(3):227–278, 2010.
//    text taken from : https://users.soe.ucsc.edu/~maw/papers/umuai2010.pdf
//    data taken from : https://nlds.soe.ucsc.edu/stylistic-variation-nlg


const allPlaces=["place","arena","venue","establishment","restaurant"];
//// list fields of the meaning representation
const mr_fields = ['area', 'customerRating', 'eatType', 'familyFriendly', 'food', 'name', 'near', 'priceRange']

//// list of all encountered mr_values for each field in the "training" dataset
const mr_values = {'area': ['city centre', 'riverside'],
             'customerRating': ['average', 'decent', 'excellent', 'high', 'low', 'mediocre'],
             'eatType': ['pub', 'coffee shop', 'restaurant'],
             'familyFriendly': ['no', 'yes'],
             'food': ['Chinese', 'English', 'French', 'Indian', 'Italian', 'Japanese', 'fast food'],
            //  'name': ['nameVariable'],
            //  'near': ['nearVariable'],
             'priceRange': ['20-25', 'a lot', 'a small amount', 'cheap', 'high', 'moderate'],
             }


//// traits from the paper
const traits = {"extra":"Extraversion", "ems":"Emotional stability", "agree":"Agreeableness",
          "consc":"Conscientiousness", "open":"Openness to experience"}

//// "personality" from the data
const personality = {"AGREEABLE":["agree",1],
               "DISAGREEABLE":["agree",0],
               "CONSCIENTIOUSNESS":["consc",1],
               "UNCONSCIENTIOUSNESS":["consc",0],
               "EXTRAVERT":["extra",1]}

const adjectives = { // Table 3 (page 6)
    "extra": ["warm", "gregarious", "assertive", "sociable", "excitement", "seeking", "active", "spontaneous", "optimistic", "talkative",
              "shy", "quiet", "reserved", "passive", "solitary", "moody", "joyless"],
    "ems":   ["calm", "even-tempered", "reliable", "peaceful", "confident",
              "neurotic", "anxious", "depressed", "self-conscious", "oversensitive", "vulnerable"],
    "agree": ["trustworthy", "friendly", "considerate", "generous", "helpful", "altruistic",
              "unfriendly", "selfish", "suspicious", "uncooperative", "malicious"],
    "consc": ["competent", "disciplined", "dutiful", "achievement", "striving", "deliberate", "careful", "orderly",
              "disorganized", "impulsive", "unreliable", "careless", "forgetful"],
    "open":  ["creative", "intellectual", "imaginative", "curious", "cultured", "complex",
              "narrow-minded", "conservative", "ignorant", "simple"],
}

const names = ["Blue Spice", "Clowns", "Cocum", "Cotto", "Giraffe", "Green Man", "Loch Fyne", "Strada", "The Cricketers",
         "The Mill", "The Phoenix", "The Plough", "The Punter", "The Vaults", "The Waterman", "The Wrestlers",
         "Wildwood", "Zizzi"]

nears = ["Crowne Plaza Hotel", "Burger King", "Rainbow Vegetarian Café", "All Bar One", "The Sorrento", "Café Sicilia",
         "Express by Holiday Inn", "The Rice Boat", "The Bakers", "Raja Indian Cuisine", "Avalon", "Ranch", "Café Rouge"]

if (typeof module !== 'null' && module.exports) {
    //  load jsRealB
    let jsRealB=require("jsrealb")
    // import exports in current scope
    for (var v in jsRealB)
            eval(v+"=jsRealB."+v);
}

function you(){return Pro("I").pe(2).n("s")}
function we(){return Pro("I").pe(1).n("p")}
function us(){return Pro("me").pe(1).n("p")}

function area(personality,area_value){
    if (area_value=="riverside"){
        return oneOf(()=>PP(P("on"),NP(D("the"),N("riverside"))),
                     ()=>PP(P("in"),NP(D("the"),N("riverside"),N("area"))))
    } else 
        return PP(P("in"),NP(D("the"),N("city"),N("centre")))
}

function customerRating(personality,cr_value){
    return S(Pro("I").g("n"),
      VP(V("have"),
         oneOf(()=>NP(D("a"),Q(cr_value),oneOf(N("customer"),Q("")),N("rating")),
               ()=>NP(D("a"),oneOf(N("customer"),Q("")),N("rating"),P("of"),Q(cr_value))))
    )
}

function familyFriendly(personality,ff_value){
    return S(
        oneOf(()=>Pro("I").g("n"),
              ()=>NP(D("the"),N(oneOf(allPlaces))),
              ()=>Pro("I").n("p")
        ),
        VP(V("be"),
           NP(oneOf(N("family").lier(),N("kid")),A("friendly")))).typ({"neg":ff_value=="no"})
}

function food_eattype(personality,food_value,eat_value){
    let res;
    if (eat_value===null || eat_value===undefined){
        res=NP(N(oneOf(allPlaces)))
    } else {
        if (food_value=="fast food")
            res=NP(A("fast"),N("food"))
        else {
            if (food_value !== null && food_value !== undefined) food_value=A(food_value)
            if (eat_value=="coffee shop"){
                res=SP(food_value,N("coffee"),N("shop"))
            } else
                res=SP(food_value,N(eat_value))
        }
    }
    res.add(D("a"),0)
    switch (personality) {
        case "AGREEABLE":
            res=SP(Pro("I"),VP(V("be"),res));
            break;
    
        default:
            bad("food_eattype",personality);
            break;
    }
    return res;
}

function name(personality,name_value){
    if(name_value===null)return null;
    let res;
    switch (personality) {
        case "AGREEABLE":
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
            return oneOf(
                ()=>SP(oneOf(Q(""),Adv("actually").a(",")),
                       oneOf(Q(""),Adv("basically").a(",")),
                       Pro("everybody"),
                       VP(V("know"),Q(name_value))),
                ()=>SP(Q("oh"),N("God"),Adv("basically").a(","),Q(name_value)),
                ()=>SP(Q(name_value))
            )
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


function priceRange(personality,price_value){
    return price_value.indexOf("-")>=0?PP(P("with"),N("price").n("p"),Q(price_value),N("dollar").n("p"))
                                      :PP(P("with"),NP(A(price_value),N("price").n("p")));;
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
            break;
    
        default:
            bad("finale",personality)
            break;
    }
    return null;
}

function bad(mr_value,personality){
    console.warn("%s: unimplemented personality: %s",mr_value,personality);
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
    fields = mr_fields.filter(v=>v!="name" && infos[v]!==null && infos[v]!==undefined)
    shuffleArray(fields)
    fields.unshift("name")
    fields.push("finale")
    return fields
}

function generate(personality,infos){
    const fields=content_plan(infos) // 'area', 'customerRating', 'eatType', 'familyFriendly', 'food', 'name', 'near', 'priceRange'
    let expr;
    let res=S();
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
        if (expr!=null){
            const l=res.elements.length;
            if (l>0){
                const last=res.elements[res.elements.length-1];
                const lastProp = last.getProp("typ")
                if (lastProp===undefined || !("int" in lastProp))
                    last.a(",")
            }                
            res.add(expr)
        }
    }
    return res;
}



////  start of execution
loadEn();

if (typeof module !== 'null' && module.exports) {
    let util=require("util");
    let fs=require("fs");
    let lines = fs.readFileSync("./demos/Personage/personage-train-start.jsonl",'utf-8').trim().split("\n")
    for (const line of lines) {
        const infos = JSON.parse(line)
        infos["name"]=oneOf(names);
        if (infos["near"]!==undefined)infos["near"]=oneOf(nears)
        console.log(util.inspect(infos));
        console.log(content_plan(infos))
        const exp=generate("AGREEABLE",infos)
        // console.log(exp.toSource(0))
        console.log(exp.toString());
    }
} else {
    $(document).ready(function() {
        // $("#dependances,#constituents").change(()=>generateHTML(story))
        // generateHTML(story)
    })
}
