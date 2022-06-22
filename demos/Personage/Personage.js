// @ ts-check
// Implementation in jsRealB of
// F. Mairesse and M. A. Walker.
// Towards personality-based user adaptation: psychologically informed stylistic language generation.
// User Model. User Adapt. Interact., 20(3):227–278, 2010.
//    text taken from : https://users.soe.ucsc.edu/~maw/papers/umuai2010.pdf
//    data taken from : https://nlds.soe.ucsc.edu/stylistic-variation-nlg
// Unfortunately the data only deals with a subset of the 5 traits (agree, consc, extra) and the paper is not very
// explicit about the formulations used for each trait. So formulations were chosen by looking 
// at the training data... some them taken from the "e2eChallenge" demo.

const allPlaces=["place","venue","establishment","restaurant"];
//// list fields of the meaning representation
const mr_fields = ['area', 'customerRating', 'eatType', 'familyFriendly', 'food', 'name', 'near', 'priceRange']

//// list of all encountered mr_values for each field in the "training" dataset
// const mr_values = {'area': ['city centre', 'riverside'],
//              'customerRating': ['average', 'decent', 'excellent', 'high', 'low', 'mediocre'],
//              'eatType': ['pub', 'coffee shop', 'restaurant'],
//              'familyFriendly': ['no', 'yes'],
//              'food': ['Chinese', 'English', 'French', 'Indian', 'Italian', 'Japanese', 'fast food'],
//             //  'name': ['nameVariable'],
//             //  'near': ['nearVariable'],
//              'priceRange': ['20-25', 'a lot', 'a small amount', 'cheap', 'high', 'moderate'],
//              }


const names = ["Blue Spice", "Clowns", "Cocum", "Cotto", "Giraffe", "Green Man", "Loch Fyne", "Strada", "The Cricketers",
         "The Mill", "The Phoenix", "The Plough", "The Punter", "The Vaults", "The Waterman", "The Wrestlers",
         "Wildwood", "Zizzi"]

const nears = ["Crowne Plaza Hotel", "Burger King", "Rainbow Vegetarian Café", "All Bar One", "The Sorrento", "Café Sicilia",
         "Express by Holiday Inn", "The Rice Boat", "The Bakers", "Raja Indian Cuisine", "Avalon", "Ranch", "Café Rouge"]

if (typeof module !== 'null' && module.exports) {
    //  load jsRealB
    let jsRealB=require("../../dist/jsRealB-node")
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
           NP(oneOf(N("family").lier(),N("kid")),A("friendly").pos("post")))).typ({"neg":ff_value=="no"})
}

function food_eattype(personality,food_value,eat_value){
    let res;
    if (eat_value===null || eat_value===undefined){
        res=NP(N(oneOf(allPlaces)))
    } 
    if (food_value=="fast food")
        res=NP(A("fast"),N("food"))
    else {
        if (food_value !== null && food_value !== undefined) food_value=A(food_value)
        if (eat_value=="coffee shop"){
            res=SP(food_value,N("coffee"),N("shop"))
        } else
            res=SP(food_value,res)
    }
    res.add(D("a"),0)
    if (personality=="AGREEABLE")
        res=SP(Pro("I"),VP(V("be"),res));
    return res;
}

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


function priceRange(personality,price_value){
    return price_value.indexOf("-")>=0 
              ? PP(P("with"),N("price").n("p"),
                   PP(P("in"),
                      NP(D("the"),Q(price_value),N("dollar").n("p"),N("range"))))
              : PP(P("with"),NP(A(price_value),N("price").n("p")));
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
    // combine the expressions into one or more lists of at most N expressions
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
        // separate each expression in aliste of expressions by a comma or "and"
        res+=S(CP(exprs.length>2?C("and"):null,exprs))
    }
    return res;
}

function showInfos(infos){
    let fields=[]
    for (const key in infos) {
        if (Object.hasOwnProperty.call(infos, key) && key!="ref" && key!="personality") {
            fields.push(key+"["+infos[key]+"]")
        }
    }
    return fields.join(", ")
}

////  start of execution
loadEn();

if (typeof module !== 'null' && module.exports) {
    let fs=require("fs");
    let lines = fs.readFileSync("/Users/lapalme/Dropbox/personage-nlg/personage-nlg-test.jsonl",'utf-8').trim().split("\n")
    let nb=0    
    for (const line of lines) {
        if (nb>10)break;
        const infos = JSON.parse(line)
        infos["name"]=oneOf(names);
        if (infos["near"]!==undefined)infos["near"]=oneOf(nears)
        console.log(showInfos(infos));
        let fields=content_plan(infos)
        console.log("Content Plan: %s",fields.join())
        console.log("A:"+generate(fields,"AGREEABLE",infos));
        console.log("D:"+generate(fields,"DISAGREEABLE",infos));
        console.log("C:"+generate(fields,"CONSCIENTIOUSNESS",infos));
        console.log("U:"+generate(fields,"UNCONSCIENTIOUSNESS",infos));
        console.log("E:"+generate(fields,"EXTRAVERT",infos));
        console.log("R:"+infos["personality"].charAt(0)+":"+
                     infos["ref"].replace(/NAME/g,infos["name"]).replace(/NEAR/g,infos["near"]))
        console.log("---")
        nb++;
    }
    console.log("%d meaning representations processed",nb)
} else {
    $(document).ready(function() {
        // $("#dependances,#constituents").change(()=>generateHTML(story))
        // generateHTML(story)
    })
}
