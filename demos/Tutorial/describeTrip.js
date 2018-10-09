////////
//  Description of a shortest path between two Montreal Metro stations
//     using information computed by "computeDist.js"
//     text realization using jsRealB
//  Guy Lapalme, lapalme@iro.umontreal.ca, oct 2018
//    Javascript adaptation of the Prolog/DCG version shown in
//     Michel Boyer and Guy Lapalme, Text Generation, 
//     Chapter 12 of Logic and Logic Grammar for Language Processing, pp. 258-260, Ellis Horwood, 1990. 
//    this file can be used either in a web page or as a node.js module
///////

// return last element of a list
function last(elems){
    return elems[elems.length-1];
}

var lineColor={"1":"green","2":"orange","4":"yellow","5":"blue"};

// realise the "name" a line: give its color and the name of start/end station depending on the direction
function genLine(leg){
    var from=network[leg[0][0]];
    var to=network[last(leg)[0]];
    // console.log("genLine:",from.id,to.id);
    var res=NP(D("the"),A(lineColor[from.route]),N("line"));
    if (from.index<to.index){
        if (to!=from.end)// do not add direction when the destination is at the last station which will be generated anyway
            res.add(PP(P("towards"),Q(from.end.stationName)));
    } else {
        if (to!=from.start)
            res.add(NP(N("direction"),Q(from.start.stationName)).en('('));
    }
    return res;
}

// realize the number of stations to go on a line
function nbStations(leg,ord){
    if (ord===undefined)ord=false;
    var st=N(oneOf("station","stop"));
    if (leg.length==2){
        return NP(Adv("only"),NO(1).dOpt({"nat": true}),st);
    }
    return NP(NO(leg.length-1).dOpt({"ord":ord}),st)
}

// realize a trip without any transfer
function singleLine(leg,duration){
    if (duration==0)
        return S(Pro("I").pe(2),V("be"),Adv("already"),
                 PP(P("at"),D("my").pe(2),N("destination"))).a("!");
    var sp1 = oneOf(()=>SP(D("this"),V("be"),CP(C("and"),A("simple"),A("fast")),nbStations(leg),
                           Adv("no"),N("transfer")),
                    ()=>SP(Pro("I").pe(2),
                           VP(V("be"),Adv("only"),nbStations(leg),Adv("away"))),
                    ()=>SP(Pro("this"),VP(V("make").t("f"),nbStations(leg),
                                          PP(P("for"),NP(D("the"),A("whole"),N("trip")))))
                    ).a(",");
    var sp2 = oneOf(()=>SP(V("take").t("ip"),genLine(leg)),
                    ()=>SP(V("follow").t("ip"),genLine(leg),
                           PP(P("for"),NP(NO(Math.round(duration)),N("minute")))));
    return S(sp1,sp2).toString();
}

// realise the name of the destination station
function destination(leg){
    return Q(network[last(leg)[0]].stationName);
}

// realize first leg of a trip
function introduction(leg,duration){
    var sp1 = S(Pro("I").pe(2),VP(V("be"),NP(NO(Math.round(duration)),N("minute"))),
                 PP(P("from"),NP(D("my").pe(2),N("destination")))).a(",");
    var sp2 = oneOf(
                ()=>SP(V("take").t("ip"),genLine(leg),
                       PP(P("for"),nbStations(leg))),
                ()=>SP(V("board").t("ip"),PP(P("on"),genLine(leg)))
              );
    var pp = oneOf(()=>PP(P("until"),SP(Pro("I").pe(2),
                                        VP(V("be"),PP(P("at"),destination(leg))))),
                   ()=>PP(P("up"),P("to"),destination(leg))
             );
    return S(sp1,sp2.add(pp));
}

// recursively realize intermediary legs of a trip
function body(legs){
    if (legs.length==0)return "";
    // console.log(legs);
    var leg=legs[0]
    var out=oneOf(
        ()=>S(VP(V("take").t("ip"),genLine(leg),PP(P("up"),P("to"),destination(leg)))),
        ()=>S(VP(V("change").t("ip"),PP(P("on"),genLine(leg),P("until"),destination(leg)))),
        ()=>S(VP(V("transfer").t("ip"),PP(P("for"),destination(leg),P("on"),genLine(leg)))),
        ()=>S(VP(V("switch")).t("ip"),
               PP(P("on"),genLine(leg),P("for"),nbStations(leg)))
    );
    return out+" "+body(legs.slice(1));
}

// realise last leg of a trip
function conclusion(leg){
    var out=oneOf(
        ()=>S(Adv("finally"),Pro("I").pe(2),V("take").t("f"),genLine(leg),
               V("arrive").t("b"),PP(P("to"),destination(leg))),
        ()=>S(Q("at last").a(","),Pro("I").pe(2),
              VP(V("find").t("f"),destination(leg).a(","),
                 PP(nbStations(leg,true),P("on"),genLine(leg)))),
        ()=>S(NP(D("my").pe(2),N("destination"),destination(leg)),
              VP(V("be").t("f"),P("after"),nbStations(leg),
                             P("on"),genLine(leg)))
    );
    return out;
}

// output title and the full text of the trip
function generate(trip){
    var duration=last(last(trip))[1];
    var title=VP(V("go").t("b"),P("from"),Q(network[trip[0][0][0]].stationName),
                 P("to"),Q(network[last(last(trip))[0]].stationName)).cap().tag("h2")+"\n";
    if (trip.length==1){
        return title+singleLine(trip[0],duration);
    } else {
        let text=title;
        text+=introduction(trip[0],duration).tag("p")+" ";
        text+="<p>"+body(trip.slice(1,trip.length-1))+"</p>";
        text+=conclusion(last(trip)).tag("p");
        return text;
    }
}

// when used as a node module
if (typeof module !== 'undefined' && module.exports) {
    // when called by node.js
    function evalExports(file){
        let f=require(file);
        for (let v in f){
            eval(v+"= f."+v);
        }
    }
    evalExports("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dmefr-node.min.js");
    evalExports(__dirname+"/computeTrip.js");
    loadEn();

    const fs = require('fs');
    var routes = JSON.parse(fs.readFileSync(__dirname+"/metroLinesSorted.json")); 

    var network=createNetwork(routes);
    // showNetwork(network);
    var stationIds=Object.keys(network);

    function findTripGenerate(from,to){
        var trip=findTrip(network,from,to);
        console.log(generate(trip).toString());
    }

    findTripGenerate(18,57);
    // findTripGenerate(61,"11-1");
    for (var i = 0; i < 10; i++) {
        findTripGenerate(oneOf(stationIds),oneOf(stationIds));
        console.log("-----");
    }
}
