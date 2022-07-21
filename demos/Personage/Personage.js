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
// const mr_fields = ['area', 'customerRating', 'eatType', 'familyFriendly', 'food', 'name', 'near', 'priceRange']

//// list of all encountered mr_values for each field in the "training" dataset
const mr_values = {
    'personality': ['AGREEABLE','DISAGREEABLE','CONSCIENTIOUSNESS','UNCONSCIENTIOUSNESS','EXTRAVERT'],
    'area': ['city centre', 'riverside'],
    'customerRating': ['low', 'mediocre', "average", "decent", 'excellent', 'high'],
    'eatType': ['pub', 'coffee shop', 'restaurant'],
    'familyFriendly': ['no', 'yes'],
    'food': ['Chinese', 'English', 'French', 'Indian', 'Italian', 'Japanese', 'fast food'],
    'priceRange': ['20-25', 'a lot', 'a small amount', 'cheap', 'high', 'moderate'],
}

// lexicalizations adapted from 
//  R. Higashinaka, M. A. Walker, and R. Prasad. 
//  An unsupervised method for learning generation lexicons for spoken dialogue systems by mining user reviews. 
//  ACM Transactions on Speech and Language Processing, 4(4), 2007.
//       https://users.soe.ucsc.edu/~maw/papers/acm_tslp07.pdf
//     Table 1 and Appendix A
const attribute_lexicalizations = {
    food: ["food","meal",],
    service: ["service", "staff", "waitstaff", "wait staff", "server", "waiter", "waitress",],
    atmosphere : ["atmosphere", "decor", "ambience", "decoration",],
    // for prices (low to high)
    prices : [["cheap","inexpensive",], 
              ["moderate","affordable","reasonable",],
              ["high","expensive","pricey","overpriced",]],
    // for customerRating (low to high)
    ratings: [['low', 'mediocre',],
              ["average", "decent",],
              ['excellent', 'high',]]
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


// functions that return an array [verb, object or attribute]
// the subject is implicitely the "named" place
function area_near(infos){
    const area_value=infos["area"]
    let location;
    if (area_value=="riverside"){
        location = oneOf(()=>PP(P("on"),NP(D("the"),N("riverside"))),
                         ()=>PP(P("in"),NP(D("the"),N("riverside"),N("area"))))
    } else 
        location = PP(P("in"),NP(D("the"),N("city"),N("centre")));
    const near_value=infos["near"]
    if (near_value !==undefined){
        location.add(PP(P("near"),Q(near_value)))
    }
    return VP(V("be"),location)
}

function customerRating(infos){
    const cr_value = infos["customerRating"]
    const rating = oneOf(()=>NP(D("a"),Q(cr_value),oneOf(N("customer"),Q("")),N("rating")),
                       ()=>NP(D("a"),oneOf(N("customer"),Q("")),N("rating"),P("of"),Q(cr_value)))
    return VP(V("have"),rating)
}

function eatType(infos){
    const eat_value = infos["eatType"]
    return VP(V("be"),NP(D("a"),N(eat_value)))
}

function familyFriendly(infos){
    const ff_value = infos["familyFriendly"];
    return VP(V("be"),
              NP(ff_value=="no"?Adv("not"):null,
                 oneOf(N("family").lier(),N("kid")),A("friendly").pos("post")))
}            

function food(infos){
    let food_value=infos["food"]
    if (food_value=="fast food")food_value="fast";
    return VP(V("serve"),NP(A(food_value),N("food")))
}

// function name(name_value){
//     return Constituent(V("be"),Q(name_value))
// }

function near(infos){
    const near_value = infos["near"]
    return VP(V("be"),PP(P("near"),Q(near_value)))
}

function priceRange(infos){
    const price_value = infos["priceRange"];
    if (price_value.indexOf("-")>=0 ){
        return VP(V("has"),
                 NP(D("a"),N("price").n("p"),
                   PP(P("in"),
                      NP(D("the"),Q(price_value),N("dollar").n("p"),N("range")))))
    }
    if (price_value.startsWith("a"))
        return VP(V("cost"),Q(price_value))
    if (price_value=="cheap")
        return VP(V("be"),A(price_value))
    else 
        return VP(V("have"),NP(A(price_value),N("price").n("p")))
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
        case "name_eatType":  return name_eatType(infos)
        case "area":          return area_near(infos)
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
    if ("eatType" in infos){
        return S(Q(infos["name"]),VP(V("be")),NP(D("a"),N(infos["eatType"])))
    } else {
        return S(NP(D("the"),N(oneOf(allPlaces))),VP(V("be"),Q(infos["name"])))
    }
}

// simplest generator, after giving name and type, and then output each field separately using "it" as subject
function simple_generate(infos){
    let res=[name_eatType(infos)]; // build list of jsRealB expression
    for (key in infos) {
        if (["name","eatType","ref","personality"].indexOf(key)<0){
            if (!(key=="near" && "area" in infos)) { // do not repeat "near" if area is expressed
                res.push(S(Pro("I"),generate_key(key,infos)));
            }
        }
    }
    return res.map(e=>e.toString()).join(""); // realize each expression as a list
}

//  apply parameter function when a random number is below prob 
//  each  parameter transforms one or two VP into a single one
//  the list of parameters is shuffled to vary the order of transformations to apply
const trace=false;

function apply_parameters(type,params, in_vps, invert){
    if (params.length==0)return in_vps;
    let out_vps=[];
    const initial_in_length=in_vps.length
    for (const agg_param of shuffleArray(params)){
        if (in_vps.length==0) break;
        let [agg_fn, prob]=agg_param;
        if (invert)prob=1.0-prob;
        if (agg_fn.length==1){ // transform a single expression
            const r = Math.random();
            if (r<prob){
                const new_vp=agg_fn(in_vps[0])
                if (new_vp!==undefined){
                        if(trace)console.log("*apply1*:",agg_fn.name);
                        out_vps.push(new_vp)
                        in_vps=in_vps.slice(1)
                    }
                }
        } else if (in_vps.length>1) { 
            // transform two expressions
            const r = Math.random();
            if (r < prob) {
                const new_vp=agg_fn(in_vps[0],in_vps[1])
                if (new_vp !== undefined){
                    if(trace) console.log("*apply2*:",agg_fn.name);
                    out_vps.push(new_vp);
                    in_vps=in_vps.slice(2)
                } 
            }
        }
    }
    if (trace){
        if (in_vps.length==initial_in_length)
            console.warn("no %s function could be applied: %d",type,in_vps.length);
    }
    while (in_vps.length>0){
        out_vps.push(in_vps.splice(0,1)[0])
    }
    return out_vps;
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
    const title = `recommandation:${invert?' not ':' '} ${type}`
    //  initialize the list of jsRealB expressions
    let vps = [];  // ::[Constituent]
    for (key of ["food","customerRating","familyFriendly","priceRange","area"]){
        if (key in infos){
            vps.push(generate_key(key,infos))
        }
    }
    // TODO: take into account "content planning" parameter
    // TODO: take into account "syntactic template" parameters

    // apply "aggregation" parameters // [Constituent] -> [Constituent]
    // each agregation parameter combines one or two [Contituent]
    const agg_vps = [name_eatType(infos)].concat(
                    apply_parameters(title+":aggregation",params["aggregation"],vps,invert))
    const prg_vps = apply_parameters(title+":pragmatic-marker",params["pragmatic_marker"],agg_vps,invert)

    // linearize everything, adding a possible "it" when a VP is encountered  
    return prg_vps.map(e => (e.isA("VP") ? S(Pro("I"), e) : e).toString()).join("");
} 


function personalized_recommandation_log(infos){
    console.log(infos["personality"])
    console.log(showInfos(infos));
    console.log(simple_generate(infos));
    switch (infos["personality"]) {
        case "EXTRAVERT":
            console.log("GEN:",recommendation("extra",params.extraversion,infos,false))
            break;
        case "AGREEABLE":
            console.log("GEN:",recommendation("agree",params.agreeableness,infos,false))
            break;
        case "DISAGREEABLE":
            console.log("GEN:",recommendation("agree",params.agreeableness,infos,true))
            break;
        case "CONSCIENTIOUSNESS":
            console.log("GEN:",recommendation("consc",params.concientiousness,infos,false));
            break;
        case "UNCONSCIENTIOUSNESS":
            console.log("GEN:",recommendation("consc",params.concientiousness,infos,true));
            break;
        default:
            console.warn("unknown personality:",infos["personality"]);
            break;
    }
    console.log("REF:",infos["ref"])
    console.log("---")
}

function personalized_recommandation(infos){
    switch (infos["personality"]) {
        case "EXTRAVERT":
             return recommendation("extra",extraversion,infos,false)
        case "AGREEABLE":
             return recommendation("agree",agreeableness,infos,false)
        case "DISAGREEABLE":
             return recommendation("agree",agreeableness,infos,true)
        case "CONSCIENTIOUSNESS":
             return recommendation("consc",concientiousness,infos,false)
        case "UNCONSCIENTIOUSNESS":
             return recommendation("consc",concientiousness,infos,true)
        default:
            console.warn("unknown personality:",infos["personality"]);
            break;
    }
    return Q("unknown personality")
}

const dataFileName="/Users/lapalme/Dropbox/personage-nlg/personage-nlg-test.jsonl"
let fieldNames,allFields,$fields,$sentences,$search,mrRefs;

function updateLexicons(){
    // addToLexicon({"center":{"N":{"tab":"n1"},"V":{"tab":"v3"}}});// idem as centre (Canadian...)
    loadEn();
    addToLexicon({"coffee shop":{"N":{"tab":"n1"}}});
    addToLexicon("riverside",{N: {tab: "n1"}});
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


function getDataSet(){
    $.get(dataFileName,function(data){
        createSearch(data.trim().split("\n").map(makeInfos))
    }).fail($search.append($("b").text(dataFileName+" not found")));
}

function createFields(data){
    allFields=data
    fieldNames=Object.keys(allFields);
    console.log(fieldNames);
    var $tr=$("<tr/>");
    for (var i = 0; i < fieldNames.length; i++) {
        $tr.append($("<th>"+fieldNames[i]+"</th>"))
    }
    $fields.append($tr);
    $tr=$("<tr/>")
    for (var i = 0; i < fieldNames.length; i++) {
        var fn=fieldNames[i];
        var $select=$("<select class='field' name='"+fn+"'><option value=''></option></select>");
        allFields[fn].sort()
        for (var j = 0; j < allFields[fn].length; j++) {
            var v=allFields[fn][j];
            $select.append($("<option value='"+v+"'>"+v+"</option>"))
        }
        $select.append("<option value='any'>** any **</option>")
        $tr.append($("<td/>").append($select))
        $fields.append($tr);
    }
}

function createSearch(data){
    var $searchB=$("<input type='button' value='search'></input>")
    $searchB.click(e=>search(false));
    $search.append($searchB);
    var $resetB=$("<input type='button' value='reset'></input>");
    $resetB.click(function(e){$(".field").each(function(j){$(this).val("")})});
    $search.append($resetB);
    var $randomB=$("<input type='button' value='random'></input>");
    $randomB.click(function(e){
        $(".field").each(function(j){
            var fs=Array.from(allFields[fieldNames[j]]);
            fs.push('')
            $(this).val(oneOf(fs));
        });
        search(false)
    });
    $search.append($randomB);
    mrRefs=data;
    search(false);
}

function filter(fields,infos,strict){
    for (var i=0;i<fieldNames.length;i++){
        var fn=fieldNames[i];
        if (fn in fields){
            var o=infos[fn]
            if (o==undefined)return false;
            if (o!=fields[fn] && fields[fn]!="any")return false;
        } else {
            if (strict && infos[fn]!=undefined) 
                return false;
        }
    }
    return true
}

function showValuesInMenu(event){
    $(".current").removeClass("current");
    var $tgt=$(event.target);
    const id= $tgt.attr("id")
    if (id == undefined || id =="sentences")return; // click into the textarea without sentences
    $tgt.addClass("current");
    var i=parseInt(id.slice(1));
    var mr=mrRefs[i];
    console.log(i,mr);
    $(".field").each(function(j){
        var fn=fieldNames[j];
        $(this).val(fn in mr?mr[fn]:"")
    })
    search(true);
}

function getFieldsFromMenus(){
    var fields={};
    $(".field").each(function(){
        var $this=$(this);
        var val=$this.val();
        if (val!="" && val!="any")fields[$this.attr("name")]=val
    })
    return fields;
}

// function mrEqual(mr1,mr2){
//     var mr1Keys=Object.keys(mr1)
//     var mr2Keys=Object.keys(mr2)
//     if (mr1Keys.length!=mr2Keys.length)return false;
//     for (var i = 0; i < mr1Keys.length; i++) {
//         var k=mr1Keys[i];
//         if (!(k in mr2) || mr1[k]!=mr2[k])return false
//     }
//     return true;
// }



function search(strict){
    $sentences.empty();
    $("#jsrPersonality").empty();
    $("#jsrOutEn").empty();
    var fields=getFieldsFromMenus();
    if (Object.keys(fields).length==0)strict=false; // force non strict on all empty
    var references=[];
    let first;
    for (var i = 0; i < mrRefs.length; i++) {
        var mrRef=mrRefs[i];
        console.log(mrRef);
        if (filter(fields,mrRef,strict)){
            references.push(mrRef["ref"]);
            $sentences.append($(`<tr><td>${mrRef["personality"]}</td><td id="I${i}">${mrRef["ref"]}</td></tr>`));
            if (first===undefined)first=mrRef
        }
    }
    $("#nbSent").text(references.length);
    if (first===undefined) return;
    var jsrOutEn=personalized_recommandation(first);
    $("#jsrPersonality").text(fields["personality"])
    $("#jsrOutEn").html(jsrOutEn);
    // var bleuStr="";
    // if (0<references.length && references.length<mrRefs.length){
    //     bleuStr="BLEU="+bleu([jsrOutEn],references).toFixed(2)
    // }
    // $("#bleu").text(bleuStr);
    // var jsrOutFr=jsrRealiser(fields);
    // $("#jsrOutFr").html(jsrOutFr);
}


////  start of execution
if (typeof module !== 'undefined' && module.exports) {
    let params=require("./generation_parameters");
    let util=require("util")
    updateLexicons();
    // console.log(util.inspect(params.extraversion));
    let fs=require("fs");
    const lines = fs.readFileSync(dataFileName,'utf-8').trim().split("\n")
    let nb=0    
    for (const line of lines.slice(0,10)) {
        personalized_recommandation_log(makeInfos(line));
        nb++;
    }
    console.log("%d meaning representations processed",nb)
} else {
    $(document).ready(function() {
        $fields=$("#fields");
        $search=$("#search");
        $sentences=$("#sentences");
        $sentences.click(showValuesInMenu);
        getDataSet();
        updateLexicons();
        createFields(mr_values);
    })
}
