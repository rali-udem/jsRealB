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
//              'name': ['nameVariable'],
//              'near': ['nearVariable'],
//              'priceRange': ['20-25', 'a lot', 'a small amount', 'cheap', 'high', 'moderate'],
//              }

// values taken from ../../demos/e2eChallenge/devsetFields.json
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

function VO(vrb,obj){
    this.vrb=vrb;
    this.obj=obj
}

function vo(vrb,obj){
    return new VO(vrb,obj)
}

// functions that return an array [verb, object or attribute]
// the subject is implicitely the "named" place
function area(area_value){
    let location;
    if (area_value=="riverside"){
        location = oneOf(()=>PP(P("on"),NP(D("the"),N("riverside"))),
                         ()=>PP(P("in"),NP(D("the"),N("riverside"),N("area"))))
    } else 
        location = PP(P("in"),NP(D("the"),N("city"),N("centre")));
    return vo(V("be"),location)
}

function customerRating(cr_value){
    let rating = oneOf(()=>NP(D("a"),Q(cr_value),oneOf(N("customer"),Q("")),N("rating")),
                       ()=>NP(D("a"),oneOf(N("customer"),Q("")),N("rating"),P("of"),Q(cr_value)))
    return vo(V("have"),rating)
}

function eatType(eat_value){
    return vo(V("be"),NP(D("a"),N(eat_value)))
}

function familyFriendly(ff_value){
    return vo(V("be"),ff_value=="no"?Adv("not"):null,
             NP(oneOf(N("family").lier(),N("kid")),A("friendly").pos("post")))
}            

function food(food_value){
    if (food_value=="fast food")food_value="fast";
    return vo(V("serve"),NP(A(food_value),N("food")))
}

function name(name_value){
    return vo(V("be"),Q(name_value))
}

function near(near_value){
    return vo(V("be"),PP(P("near"),Q(near_value)))
}

function priceRange(price_value){
    if (price_value.indexOf("-")>=0 ){
        return vo(V("has"),
                 NP(D("a"),N("price").n("p"),
                   PP(P("in"),
                      NP(D("the"),Q(price_value),N("dollar").n("p"),N("range")))))
    }
    if (price_value.startsWith("a"))
        return vo(V("cost"),Q(price_value))
    if (price_value=="cheap")
        return vo(V("be"),A(price_value))
    else 
        return (V("have"),NP(A(price_value),N("price").n("p")))
}

// display information in a compact format
function showInfos(infos){
    let fields=[]
    for (const key in infos) {
        if (key!="ref" && key!="personality") {
            fields.push(key+"["+infos[key]+"]")
        }
    }
    return fields.join(", ")
}

function generate_key(key,infos){
    switch (key) {
        case "area":          return area(infos[key])
        case "customerRating":return customerRating(infos[key])
        case "eatType":       return eatType(infos[key])
        case "familyFriendly":return familyFriendly(infos[key])
        case "food":          return food(infos[key])
        case "near":          return near(infos[key])
        case "priceRange":    return priceRange(infos[key])
        default:
            console.warn("bad key: %s",key);
        }
}

// simplest generator, after giving name and type, output each field separately
function simple_generate(infos){
    let res;
    if ("eatType" in infos){
        res=S(Q(infos["name"]),VP(V("be")),NP(D("a"),N(infos["eatType"]))).toString()
    } else {
        res=S(NP(D("the"),N(oneOf(allPlaces))),VP(V("be"),Q(infos["name"]))).toString()
    }
    for (key in infos) {
        if (["name","eatType","ref","personality"].indexOf(key)<0){
            let expr=generate_key(key,infos)
            res+=S(Pro("I"),VP(expr.vrb,expr.obj)).toString();
        }
    }
    return res;
}

////  start of execution
loadEn();
addToLexicon("coffee shop",{"N":{"tab":"n1"}})

if (typeof module !== 'null' && module.exports) {
    let fs=require("fs");
    let lines = fs.readFileSync("/Users/lapalme/Dropbox/personage-nlg/personage-nlg-test.jsonl",'utf-8').trim().split("\n")
    let nb=0    
    for (const line of lines) {
        if (nb>100)break;
        // get information (giving name and nears that have dummy values in the data)
        const infos = JSON.parse(line)
        infos["name"]=oneOf(names);
        if (infos["near"]!==undefined)infos["near"]=oneOf(nears)
        console.log(showInfos(infos));
        console.log(simple_generate(infos))
        // let fields=content_plan(infos)
        // console.log("Content Plan: %s",fields.join())
        // console.log("A:"+generate(fields,"AGREEABLE",infos));
        // console.log("D:"+generate(fields,"DISAGREEABLE",infos));
        // console.log("C:"+generate(fields,"CONSCIENTIOUSNESS",infos));
        // console.log("U:"+generate(fields,"UNCONSCIENTIOUSNESS",infos));
        // console.log("E:"+generate(fields,"EXTRAVERT",infos));
        // console.log("R:"+infos["personality"].charAt(0)+":"+
        //              infos["ref"].replace(/NAME/g,infos["name"]).replace(/NEAR/g,infos["near"]))
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
