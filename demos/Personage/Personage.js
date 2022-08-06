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

const allPlaces=["place","venue","establishment","restaurant"];
//// list fields of the meaning representation with a default ordering
const mr_fields = ['name', 'eatType', 'customerRating', 'area', 'near', 'familyFriendly', 'food', 'priceRange']

//// list of all encountered mr_values for each field in the "training" dataset
const mr_values = {
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

if (typeof module !== 'undefined' && module.exports) {    //  load jsRealB
    let jsRealB=require("../../dist/jsRealB-node")
    // import exports in current scope
    for (var v in jsRealB)
            eval(v+"=jsRealB."+v);
}


// adapted from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
}


// functions that return a Dependence (with a subject to be added later)
// the subject is implicitely the "named" place
function area(infos){
    const area_value=infos["area"]
    let location;
    if (area_value=="riverside"){
        location = oneOf(()=>comp(P("on"),
                                  comp(N("riverside"),
                                  det(D("the")))),
                         ()=>comp(P("in"),
                                  comp(N("riverside"),
                                       mod(N("area")),
                                       det(D("the")))))
    } else 
        location = comp(P("in"),
                         comp(N("city"),
                              det(D("the")),
                              mod(N("centre"))));
     return root(V("be"),location)
}

function find_synonym(value,synonyms_list){
    for (const synonyms of synonyms_list) {
        if (synonyms.indexOf(value)>=0)
            return oneOf(synonyms)
    }
    return value;
}

function customerRating(infos){
    const cr_value = find_synonym(infos["customerRating"],attribute_lexicalizations["ratings"]);
    const customer = oneOf(N("customer"),Q(""));
    const ratingExpr = oneOf(()=>comp(customer,
                                      det(D("a")),
                                      mod(A(cr_value)),
                                      mod(N("rating"))),
                             ()=>comp(customer,
                                      det(D("a")),
                                      mod(N("rating")),
                                      comp(P("of"),
                                           mod(A(cr_value)))))
    return root(V("have"),ratingExpr)
}

function eatType(infos){
    const eat_value = infos["eatType"]
    return root(V("be"),comp(N(eat_value),
                             det(D("a"))))
}

function familyFriendly(infos){
    const ff_value = infos["familyFriendly"];
    return root(V("be"),
                comp(oneOf(N("family").lier(),N("kid")),
                     mod(A("friendly")).pos("post"))).typ({neg:!ff_value})
}            

function food(infos){
    let food_value=infos["food"]
    if (food_value=="fast food")food_value="fast";
    return root(V("serve"),
                comp(N("food"),
                     mod(A(food_value))))
}

function near(infos){
    const near_value = infos["near"]
    return root(V("be"),
                comp(P("near"),
                     mod(Q(near_value))))
}

function priceRange(infos){
    let price_value = infos["priceRange"];
    if (price_value.indexOf("-")>=0 ){
        return root(V("have"),
                 comp(N("price").n("p"),
                      det(D("a")),
                      comp(P("in"),
                           comp(N("range"),
                                det(D("the")),
                                mod(N("pound").n("p"),
                                    det(Q(price_value)))))))
    }
    if (price_value.startsWith("a"))
        return root(V("cost"),
                    comp(Q(price_value)))
    price_value = find_synonym(price_value,attribute_lexicalizations["prices"]);
    return root(V("be"),
               mod(A(price_value)))
}

// display information in a compact format
function showInfos(keys,infos){
    res=[];
    for (key of keys)
        if (infos[keys]!==undefined)
            res.push(`${key}[${infos[key]}]`);
    return res.join(", ")
}

function generate_key(key,infos){
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
    let res;
    const qName=Q(infos["name"])
    if ("eatType" in infos){
        res=root(V("be"),
                 subj(qName),
                 comp(N(infos["eatType"]),
                     det(D("a"))));
    } else {
        res=root(V("be"),
                 subj(N(oneOf(allPlaces))),
                 det(D("the")),
                 comp(qName));
    }
    // if (infos["near"]!==undefined && infos["area"]===undefined){
    //     res.add(comp(P("near"),
    //                  mod(infos["near"])));
    // }
    return res;
}

// simplest generator, after giving name and type, and then output each field separately using "it" as subject
function simple_generate(infos){
    let res=[name_eatType(infos)]; // build list of jsRealB expression

    for (let key of mr_fields.slice(2)) {
        if (key in infos)
            res.push(generate_key(key,infos).add(subj(Pro("it").c("nom")),0));
    }
    return res.map(e=>e.toString()).join(""); // realize each expression as a list
}

const trace=false;

//  apply parameter function when a random number is below prob 
//  each  parameter transforms one or two VP into a single one
//  the list of parameters is shuffled to vary the order of transformations to apply
//  as the first dependency has already been modified by the content planner
//  it is not considered as a target for replacement
function apply_parameters(type,params, in_deps, invert){
    if (params.length==0)return in_deps;
    let out_deps=in_deps.splice(0,1);
    let applicationDone=false;
    for (const agg_param of shuffleArray(params)){
        if (in_deps.length==0) break;
        let [agg_fn, prob]=agg_param;
        if (invert)prob=1.0-prob;
        if (agg_fn.length==1){ // transform a single expression
            const r = Math.random();
            if (r<prob){
                const new_vp=agg_fn(in_deps[0])
                if (new_vp!==undefined){
                        if(trace)console.log("*apply1*:",type,agg_fn.name,new_vp.toSource());
                        out_deps.push(new_vp);
                        in_deps=in_deps.slice(1);
                        applicationDone=true;
                    }
                }
        } else if (in_deps.length>1) { 
            // transform two expressions
            const r = Math.random();
            if (r < prob) {
                const new_vp=agg_fn(in_deps[0],in_deps[1])
                if (new_vp !== undefined){
                    if(trace) console.log("*apply2*:",type,agg_fn.name,new_vp.toSource());
                    out_deps.push(new_vp);
                    in_deps=in_deps.slice(2)
                    applicationDone=true;
                } 
            }
        }
    }
    if (trace && !applicationDone){
        console.warn("no %s function could be applied",type);
    }
    while (in_deps.length>0){
        out_deps.push(in_deps.splice(0,1)[0])
    }
    return out_deps;
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
    let fields = mr_fields.slice(2);
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
        const newField=oneOf(fields.slice(0,-1));
        fields.push(newField);
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
    for (let field of fields){
        if (field in infos)
           deps.push(generate_key(field,infos).add(subj(Pro("it").c("nom"))))
    }
    return deps;
}

// check if a dep is "simple": 
//  i.e. of the form dep(V(...),
//                       subj(Pro("it")),
//                       comp(....)) 
//       without any modification
function isSimpleDep(dep){
    const term=dep.terminal
    if (term.isA("V") && dep.dependents.length==2 && 
        Object.keys(dep.props).length==0){
        const subjIdx=dep.findIndex((d)=>d.isA("subj"));
        if (subjIdx>=0){
            if (dep.dependents[subjIdx].terminal.lemma=="it") return true;
        }
    }
    return false;
}

function syntacticTemplater(title,deps,st_params,invert){
    if (isApplicable(st_params.syntactic_complexity,invert)){
        // combine very simple sentences into a coordination
        // only the first occurrence is modified...
        const l=deps.length;
        let i=0;
        // console.warn("try to combine simple sentences")
        while (i<l && !isSimpleDep(deps[i]))i++; // find first simple
        if (i<l){
            j=i+1;
            while (j<l && isSimpleDep(deps[j]))j++;
            if (j<l && i<j){
                const removedDeps=deps.splice(i+1,j-i)
                removedDeps.forEach((dep)=>
                    dep.dependents.splice(dep.findIndex((d)=>d.isA("subj")),1))
                deps[i]=coord(C("and"),deps[i],removedDeps)
                return deps
            }
        }        
    }
    return deps
}

//  from Chapter 5 (figure 5.4, p 109)
function recommendation(type,params,infos,invert){
    // define content plan using fields in the current data (given after ~~ )
    //  corresponding roughly to values in the thesis
    //  best                        ~~ name+eatType
    //  justify     2: cuisine      ~~ food
    //              3: food-quality ~~ customerRating
    //              4: atmosphere   ~~ familyFriendly
    //              5: service      ~~ --
    //              6: price        ~~ priceRange
    //              7: location     ~~ area+near
    const title = `recommandation:${invert?'not ':''}${type}`
    //  initialize the list of jsRealB expressions

    let deps = contentPlanner(title,params.content_planning,infos,invert);
    
    // if (trace){
    //     console.log(deps.map((dep)=>dep.toSource(0)).join("\n"))
    // }
    
    // apply "aggregation" parameters // [Constituent] -> [Constituent]
    // each agregation parameter combines one or two [Contituent]
    const agg_deps = apply_parameters(title+":aggregation",params["aggregation"],deps,invert)
    const prg_deps = apply_parameters(title+":pragmatic-marker",params["pragmatic_marker"],agg_deps,invert)
    
    if (trace){
        console.log(prg_deps.map((dep)=>dep.toSource(0)).join("\n"))
    }
    
    // contrarily to the thesis, syntactic templates are applied after aggregation and pragmatic marker
    // to combine the first successive simple dependencies in the final output when syntactic_complexity is high
    deps = syntacticTemplater(title,prg_deps,params.syntactic_template_selection)

    // linearize everything 
    return deps.map(e => e.toString()).join("");
} 

function personalized_recommandation_log(params,infos){
    console.log(infos["personality"])
    console.log(showInfos(mr_fields,infos));
    console.log(simple_generate(infos));
    console.log("GEN:",personalized_recommandation(params,infos["personality"],infos));
    // console.log("REF:",infos["ref"]);
    console.log("---");
}

function personalized_recommandation(params,pers,infos){
    switch (pers) {
        case "EXTRAVERT":
             return recommendation("extra",params.extraversion,infos,false)
        case "AGREEABLE":
             return recommendation("agree",params.agreeableness,infos,false)
        case "DISAGREEABLE":
             return recommendation("agree",params.agreeableness,infos,true)
        case "CONSCIENTIOUSNESS":
             return recommendation("consc",params.concientiousness,infos,false)
        case "UNCONSCIENTIOUSNESS":
             return recommendation("consc",params.concientiousness,infos,true)
        default:
            console.warn("unknown personality:",pers);
            break;
    }
    return Q("unknown personality")
}

function updateLexicons(){
    // addToLexicon({"center":{"N":{"tab":"n1"},"V":{"tab":"v3"}}});// idem as centre (Canadian...)
    loadEn();
    addToLexicon({"coffee shop":{"N":{"tab":"n1"}}});
    addToLexicon("riverside",{"N": {"tab": "n1"}});
    addToLexicon("horrendous",{"A": {"tab": "a1"}})
}

function makeInfos(line){
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

let dataFileName="./data/personage-nlg-test.jsonl"

////  start of execution
if (typeof module !== 'undefined' && module.exports) {
    let params=require("./generation_parameters");
    let util=require("util");
    updateLexicons();
    // console.log(util.inspect(params.extraversion));
    let fs=require("fs");
    dataFileName=require("path").resolve(__dirname,dataFileName)
    // console.log(dataFileName);
    const lines = fs.readFileSync(dataFileName,'utf-8').trim().split("\n")
    setExceptionOnWarning(false);
    let nb=0    
    for (const line of lines.slice(0,100)) {
        personalized_recommandation_log(params,makeInfos(line));
        nb++;
    }
    console.log("%d meaning representations processed",nb)
} else {  // for execution in a web page
    // to debug from Visual Code Studio 
    //   start a web server in the jsRealB directory
    //   e.g.  python3 -m http.server
    $(document).ready(function() {
        $fields=$("#fields");
        $search=$("#search");
        $sentences=$("#sentences");
        $sentences.click(showValuesInMenu);
        $corpus=$("#corpus");
        $corpus.change(changeCorpus);
        getDataSet(dataFileName);
        createSearch(mrRefs)
        updateLexicons();
        createFields(mr_values);
    })
}
