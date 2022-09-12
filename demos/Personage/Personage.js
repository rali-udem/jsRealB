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

// another source of inspiration might be 
//    /Users/lapalme/Dropbox/personage-nlg/Personage/resources/parameters/handcrafted/bigfive

import {extraversion,agreeableness,concientiousness} from "./generation_parameters.js";
export const params = { 
    "extraversion":     extraversion,
    "agreeableness":    agreeableness,
    "concientiousness": concientiousness
}

import "../../dist/jsRealB.js";
Object.assign(globalThis,jsRealB)

let trace=false;  // to help tracing

const allPlaces = ["place","venue","establishment","location"]; // a commonplace name
//// list fields of the meaning representation with a default ordering
const mr_fields = ['name', 'eatType', 'customerRating', 'area', 'near', 'familyFriendly', 'food', 'priceRange']

//// list of all encountered mr_values for each field in the "training" dataset
export const mr_values = {
    'personality': ['AGREEABLE','DISAGREEABLE','CONSCIENTIOUSNESS','UNCONSCIENTIOUSNESS','EXTRAVERT'],
    'area': ['city centre', 'riverside'],
    'customerRating': ['low', 'mediocre', "average", "decent", 'high', 'excellent'],
    'eatType': ['pub', 'coffee shop', 'restaurant'],
    'familyFriendly': ['no', 'yes'],
    'food': ['Chinese', 'English', 'French', 'Indian', 'Italian', 'Japanese', 'fast food'],
    'priceRange': ['20-25', 'a lot', 'a small amount', 'cheap', 'high', 'moderate'],
}

//// subsets of mr_values that are considered as "positive" or "negative"
const mr_values_polarity = {
    'customerRating': {'positive':new Set(['high','excellent']),
                       'negative':new Set(['low','mediocre'  ])},
    'familyFriendly':{'positive':new Set(['yes']),
                      'negative':new Set(['no' ])},
    'priceRange':{'positive':new Set(['a small amount','cheap']),
                  'negative':new Set(['a lot','high'          ])},
}

function checkPolarity(field,value){
    if (!(field in mr_values_polarity)) return 'neutral';
    const mvp = mr_values_polarity[field];
    if (mvp.positive.has(value))return 'positive';
    if (mvp.negative.has(value))return 'negative';
    return 'neutral';
}

// lexicalizations adapted from 
//  R. Higashinaka, M. A. Walker, and R. Prasad. 
//  An unsupervised method for learning generation lexicons for spoken dialogue systems by mining user reviews. 
//  ACM Transactions on Speech and Language Processing, 4(4), 2007.
//       https://users.soe.ucsc.edu/~maw/papers/acm_tslp07.pdf
//     Table 1 and Appendix A
//
//  customerRating extracted from "food_quality" in
//      Personage/resources/lexical/adjectives/adj_single_filtered_by_hand.txt
const attribute_lexicalizations = {
    food: ["food","meal",],
    service: ["service", "staff", "waitstaff", "wait staff", "server", "waiter", "waitress",],
    atmosphere : ["atmosphere", "decor", "ambience", "decoration",],
    // for prices (low to high)
    prices : [["cheap","inexpensive","economical",], 
              ["moderate","affordable","reasonable",],
              ["high","expensive","pricey","overpriced",]],
    // for customerRating (low to excellent)
    ratings: [["low","awful", "bad", "terrible", "horrible", "horrendous"],
              ["mediocre","bland",  "bad"],
              ["average","decent", "acceptable", "adequate", "satisfying"],
              ["high","good", "flavorful", "tasty", "nice"],
              ["excellent", "delicious", "great", "exquisite", "wonderful", "legendary", 
               "superb", "terrific", "fantastic", "outstanding", "incredible", "delectable", 
               "fabulous", "tremendous", "awesome", "delightful", "marvelous"]]
              
}

// values taken from ../../demos/e2eChallenge/devsetFields.json
const names = ["Blue Spice", "Clowns", "Cocum", "Cotto", "Giraffe", "Green Man", "Loch Fyne", "Strada", "The Cricketers",
               "The Mill", "The Phoenix", "The Plough", "The Punter", "The Vaults", "The Waterman", "The Wrestlers",
               "Wildwood", "Zizzi"]

const nears = ["Crowne Plaza Hotel", "Burger King", "Rainbow Vegetarian Café", "All Bar One", "The Sorrento", "Café Sicilia",
               "Express by Holiday Inn", "The Rice Boat", "The Bakers", "Raja Indian Cuisine", "Avalon", "Ranch", "Café Rouge"]


// functions that return a Dependent (with a subject to be added later)
// they are of the form root(V(...),comp(...))
function area(infos){
    const area_value=infos["area"]
    let location;
    if (area_value=="riverside"){  // => is on the riverside
        location = oneOf(()=>comp(P("on"),
                                  comp(N("riverside"),
                                  det(D("the")))),
                         ()=>comp(P("in"), // => in the riverside area
                                  comp(N("riverside"),
                                       mod(N("area")),
                                       det(D("the")))))
    } else 
        location = comp(P("in"), // => in the city centre
                         comp(N("city"),
                              det(D("the")),
                              mod(N("centre"))));
     return root(V("be"),location)
}

function find_synonym(word,synonyms_list){
    for (const synonyms of synonyms_list) {
        if (synonyms.includes(word))
            return oneOf(synonyms)
    }
    return word;
}

function customerRating(infos){ 
    const cr_value = find_synonym(infos["customerRating"],attribute_lexicalizations["ratings"]);
    const customer = oneOf(N("customer"),Q(""));
    const ratingExpr = oneOf(()=>comp(customer, // => has a cr_value customer rating
                                      det(D("a")),
                                      mod(A(cr_value)),
                                      mod(N("rating"))),
                             ()=>comp(customer,// => has a customer? rating of cr_value
                                      det(D("a")),
                                      mod(N("rating")),
                                      comp(P("of"),
                                           mod(A(cr_value)))))
    return root(V("have"),ratingExpr)
}

function eatType(infos){ // => is a eatType
    const eat_value = infos["eatType"]
    return root(V("be"),comp(N(eat_value),
                             det(D("a"))))
}

function familyFriendly(infos){  // => is not? family|kid friendly
    const ff_value = infos["familyFriendly"]=="yes";
    return root(V("be"),
                comp(oneOf(N("family").lier(),N("kid")),
                     mod(A("friendly")).pos("post"))).typ({neg:!ff_value})
}            

function food(infos){    // => serves fast|French|Chinese... food
    let food_value=infos["food"]
    if (food_value=="fast food")food_value="fast";
    return root(V("serve"),
                comp(N("food"),
                     mod(A(food_value))))
}

function near(infos){
    const near_value = infos["near"]
    return root(V("be"), // => is near near_value
                comp(P("near"),
                     mod(Q(near_value))))
}

function priceRange(infos){
    let price_value = infos["priceRange"];
    if (price_value.indexOf("-")>=0 ){ // => has prices in the price_value range
        return root(V("have"),
                 comp(N("price").n("p"),
                      det(D("a")),
                      comp(P("in"),
                           comp(N("range"),
                                det(D("the")),
                                mod(N("pound").n("p"),
                                    det(Q(price_value)))))))
    }
    if (price_value.startsWith("a")) // => costs price_value 
        return root(V("cost"),
                    comp(Q(price_value)))
    price_value = find_synonym(price_value,attribute_lexicalizations["prices"]);
    return root(V("be"),  // => is price_value (with many synonyms) 
                comp(A(price_value)))
}

// display information in a compact format
function showInfos(keys,infos){
    let res=[];
    for (let key of keys)
        if (infos[key]!==undefined)
            res.push(`${key}[${infos[key]}]`);
    return res.join(", ")
}

function create_dep(key,infos){
    switch (key) {
        case "name_eatType":  return name_eatType(infos)
        case "area":          return area(infos)
        case "customerRating":return customerRating(infos)
        case "eatType":       return eatType(infos)
        case "familyFriendly":return familyFriendly(infos)
        case "food":          return food(infos)
        case "near":          return near(infos)
        case "priceRange":    return priceRange(infos)
        default:
            console.warn("bad key: %s",key);
        }
}

// give initial information about the place, return a jsRealB expression
function name_eatType(infos){
    const qName=Q(infos["name"]); // create a terminal with the name verbatim
    if ("eatType" in infos){  // => qName is a eatType
        return root(V("be"),
                    subj(qName),
                    comp(N(infos["eatType"]),
                        det(D("a"))));
    } 
    return root(V("be"),   // => The place|venue|... is qName
                subj(N(oneOf(["place","venue","establishment","location"])), // no eatType present, choose a commonplace name
                     det(D("the"))),
                comp(qName));
}

// simplest generator, after giving name and type, and then output each field separately using "it" as subject
function simple_generate(infos){
    let res=[name_eatType(infos)]; // build list of jsRealB expression
    for (let key of mr_fields.slice(2)) {
        if (key in infos)
            res.push(create_dep(key,infos).add(subj(Pro("it").c("nom"))));
    }
    return res.map(e=>e.toString()).join(""); // realize each expression as a list
}

function isApplicable(val,invert){
    if (val == null) return false;  // this also check for undefined...
    if (typeof val == "boolean") return invert ? !val : val;
    if (invert) val=1.0-val;
    return Math.random() < val;
}

// for recommandation
//  ideally the content planner should determine what to say
//  Here we have so few infos that they will all be realized, but the
//  content planner has to determine the field ordering
function contentPlanner(title,cp_params,infos,invert){
    let fields = mr_fields.slice(2).filter((f)=>infos[f]!==undefined); //keep only fields present in infos
    if (isApplicable(cp_params.positive_content_first)){
        // order infos so that positive terms come at the start
        let newFields =[]
        for (let i = 0; i < fields.length;) {
            const f = fields[i];
            if (checkPolarity(f,infos[f])=="positive")
                newFields.push(fields.splice(i,1)[0])
            else
                i++
        }
        fields=newFields.concat(fields);
    }
    if (isApplicable(cp_params.verbosity,invert)){
        // as all fields are expressed, this is not relevant
    }
    if (isApplicable(cp_params.restatements,invert) || isApplicable(cp_params.repetitions,invert)){
        // as we do not handle paraphrase, we consider it as a repetition
        // repeat one field except for the last... that would appear twice in succession
        if (fields.length>1) {
            const newField=oneOf(fields.slice(0,-1));
            fields.push(newField);
        }
    }

    // TODO: deal with 
    //    content_polarity
    //    repetitions_polarity
    //    concessions
    //    concessions_polarity
    //    polarization

    if (trace) {
        console.log(title,showInfos(fields,infos));
    }

    // create initial dependency 
    //  formulations taken from page 119 (table 5.4)
    //   but apply only one of them
    let deps = [name_eatType(infos)];
    if (isApplicable(cp_params.request_confirmation,invert)){
        const qName=Q(infos["name"])
         deps.unshift(oneOf(
            // You want to know more about...
            ()=>root(V("want"), 
                     subj(Pro("you")),
                     comp(V("know").t("b-to"),
                          comp(Adv("more"),
                               comp(P("about"),
                                    comp(qName))))),
            ()=>root(V("see").t("ip").pe(1).n("p"), // Let's see
                     comp(qName).a("... ")),
            // Let's see what we can find about
            ()=>root(V("see").t("ip").pe(1).n("p"), 
                     comp(Pro("what"),
                          comp(V("find"),
                               subj(Pro("I").n("p").pe(1)),
                               comp(P("about"),
                                    comp(qName))).typ({mod:"poss"}))),
            ()=>root(V("say").t("ps"), // did you say ...?
                     subj(Pro("I").pe(2)),
                     comp(qName)).typ({"int":"yon"})                              
         )); 
    } else if (isApplicable(cp_params.initial_rejection,invert)){
        const I = subj(Pro("I").pe(1))
        deps.unshift(oneOf(
            ()=>root(V("know"),I).typ({neg:true,contr:true}), // I don't know
            ()=>root(V("be"),I,         // I am not sure
                     mod(A("sure"))).typ({neg:true}),
            ()=>root(V("be").t("ps"),I, // I might be wrong
                     mod(A("wrong"))).typ({"mod":"perm"})
        ))
    } else if (isApplicable(cp_params.competence_mitigation,invert)){
        deps[0]=oneOf(
            ()=>deps[0].add(comp(V("come").t("ip"), //come on
                                 comp(P("on"))).pos("pre")),
            // everybody kwows that ...
            ()=>root(V("know"),
                     subj(Pro("everybody")),
                     comp(C("that"),
                          deps[0])),
            // I thought that everybody knew that
            ()=>root(V("think").t("ps"),
                     subj(Pro("I").pe(1)),
                     comp(C("that"),
                          comp(V("know").t("ps"),
                               subj(Pro("everybody")),
                               comp(C("that"),
                                    deps[0]))))
        )
    }
    return [deps,fields];
}

function syntacticTemplater(title,deps,fields,st_params,infos,invert){
    let fss;
    if (isApplicable(st_params.syntactic_complexity,invert)){
        // combine the fields into one or more lists of at most NB fields
        const NB=3
        fss=[]
        while (fields.length>=NB){
            const l=Math.trunc(Math.random(NB)*NB)+1
            fss.push(fields.splice(0,l))
        }
        if (fields.length>0){
            fss.push(fields)
        }
    } else { // return a list of simple dependencies
        fss = fields.map(f=>[f])
    }
    // create dependencies
    for (let fs of fss){
        const it=subj(Pro("it").c("nom"));
        if (fs.length==1){ // simple sentence
            deps.push(create_dep(fs[0],infos).add(it))
        } else if (fs.length==2){
            // coordinate only the dependents of similar verbs
            const dep0=create_dep(fs[0],infos);
            const dep1=create_dep(fs[1],infos);
            if (dep0.terminal.lemma==dep1.terminal.lemma){
                deps.push(root(dep0.terminal,
                                it,
                                coord(C("and"),dep0.dependents,dep1.dependents)))
            } else {
                deps.push(coord(C("and"),fs.map((f)=>create_dep(f,infos).add(it))))
            }
        } else {
            deps.push(coord(C("and"),fs.map((f)=>create_dep(f,infos).add(it))))
        }
    }
    return deps
}

//  from Chapter 5 (figure 5.4, p 109)
function recommendation(type,personalityParams,infos,invert,applyParamFn){
    // define content plan using fields in the current data (given after ~~ )
    //  corresponding roughly to values used in the thesis
    //  best                        ~~ name+eatType
    //  justify     2: cuisine      ~~ food
    //              3: food-quality ~~ customerRating
    //              4: atmosphere   ~~ familyFriendly
    //              5: service      ~~ --
    //              6: price        ~~ priceRange
    //              7: location     ~~ area+near
    const title = `recommandation:${invert?'not ':''}${type}`

    //  initialize the list of jsRealB expressions and the rest of the fields
    let [deps,fields] = contentPlanner(title,personalityParams.content_planning,infos,invert);

    // apply syntactic templates to the fields (i.e. combine some of them) to create the full set of deps
    deps = syntacticTemplater(title,deps,fields,personalityParams.syntactic_template_selection,infos,invert);
   
    if (trace){
        console.log(deps.map((dep)=>dep.toDebug(0)).join("\n"))
    }        
    
    // apply "aggregation" parameters // [Constituent] -> [Constituent]
    // each agregation parameter combines one or two [Contituent]
    const agg_deps = applyParamFn(title+":aggregation",personalityParams["aggregation"],deps,invert,trace)
    const prg_deps = applyParamFn(title+":pragmatic-marker",personalityParams["pragmatic_marker"],agg_deps,invert,trace)
    
    if (trace){
        console.log(prg_deps.map((dep)=>dep.toDebug(0)).join("\n"))
    }    
    
    // linearize everything 
    return prg_deps.map(e => e.toString()).join("");
} 

export function personalized_recommandation_out(params,infos,applyParamFn){
    function out(v){process.stdout.write(v+"\n")}
    out(infos["personality"])
    out(showInfos(mr_fields,infos));
    out("SPL:"+simple_generate(infos));
    out("GEN:"+personalized_recommandation(params,infos["personality"],infos,applyParamFn));
    out("REF:"+infos["ref"]);
    out("---");
}


export function personalized_recommandation(params,pers,infos,applyParamFn){
    switch (pers) {
        case "EXTRAVERT":
             return recommendation("extra",params.extraversion,infos,false,applyParamFn)
        case "AGREEABLE":
             return recommendation("agree",params.agreeableness,infos,false,applyParamFn)
        case "DISAGREEABLE":
             return recommendation("agree",params.agreeableness,infos,true,applyParamFn)
        case "CONSCIENTIOUSNESS":
             return recommendation("consc",params.concientiousness,infos,false,applyParamFn)
        case "UNCONSCIENTIOUSNESS":
             return recommendation("consc",params.concientiousness,infos,true,applyParamFn)
        default:
            console.warn("unknown personality:",pers);
            break;
    }
    return Q("unknown personality")
}

export function add_words_to_lexicon(){
    // Object.assign(globalThis,jsRealB);
    loadEn();
    addToLexicon({"coffee shop":{"N":{"tab":"n1"}}});
    addToLexicon("riverside",{"N": {"tab": "n1"}});
    addToLexicon("staff",{"N": {"tab": "n1"}});
    addToLexicon("wait staff",{"N": {"tab": "n1"}});
    
    addToLexicon("horrendous",{"A": {"tab": "a1"}});
    addToLexicon("overpriced",{"A": {"tab": "a1"}});
    addToLexicon("flavorful",{"A": {"tab": "a1"}});
}

export function makeInfos(line){
    // get information (giving name and nears that have dummy values in the data)
    // patch ref with these new infos
    let infos = JSON.parse(line)
    infos["name"]=oneOf(names);
    infos["ref"]=infos["ref"].replace(/NAME/g,infos["name"])
    if (infos["near"]!==undefined){
        infos["near"]=oneOf(nears);
        infos["ref"]=infos["ref"].replace(/NEAR/g,infos["near"])
    }
    return infos;
}
