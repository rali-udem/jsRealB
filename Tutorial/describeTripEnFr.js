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
import {findTrip, network} from "./computeTrip.js";
import "../dist/jsRealB.js";
Object.assign(globalThis,jsRealB);
let currentLang="fr";

// return last element of a list
function last(elems){
    return elems[elems.length-1];
}

var lineNames={"1":{"en":"green","fr":"vert"},
               "2":{"en":"orange","fr":"orange"},
               "4":{"en":"yellow","fr":"jaune"},
               "5":{"en":"blue","fr":"bleu"},
               "6":{"en":"pink","fr":"rose"}
}

// realise the "name" a line: give its name/color and the name of start/end station depending on the direction
function genLine(leg){
    var from=network[leg[0][0]];
    var to=network[last(leg)[0]];
    // console.log("genLine:",from.id,to.id);
    var res= currentLang=="en"? NP(D("the"),A(lineNames[from.route]["en"]),N("line"))
                              : NP(D("le"),A(lineNames[from.route]["fr"]),N("ligne"));
    if (from.index<to.index){
        if (to!=from.end)
            // do not add direction when the destination is at the last station which will be generated anyway
            res.add(PP(P(currentLang=="en"?"towards":"vers"),Q(from.end.stationName)));
    } else {
        if (to!=from.start)
            // do not add direction when the destination is at the first station which will be generated anyway
            res.add(NP(N("direction"),Q(from.start.stationName)).en('('));
    }
    return res;
}

// realize the number of stations to go on a line
function nbStations(leg,ord){
    if (ord===undefined)ord=false;
    var st=N(oneOf("station",currentLang=="en"?"stop":"arrêt"));
    if (leg.length==2){
        return currentLang=="en"?NP(Adv("only"),NO(1).dOpt({"nat": true}),st)
                                :NP(NO(1).dOpt({"ord":true}),st);
    }
    return NP(NO(leg.length-1).dOpt({"ord":ord}),st)
}

// realize a trip without any transfer
function singleLine(leg,duration){
    if (duration==0)
        return currentLang=="en"?S(Pro("I").pe(2),V("be"),Adv("already"),
                            PP(P("at"),D("my").pe(2),N("destination"))).a("!")
                         :S(Pro("je").pe(2).n("p"),V("être"),Adv("déjà"),
                            PP(P("à"),D("notre").pe(2),N("destination"))).a("!");
    if (currentLang=="en"){
        var sp1 = oneOf(()=>SP(D("this"),V("be"),CP(C("and"),A("simple"),A("fast")),nbStations(leg),
                               Adv("no"),N("transfer")),
                        ()=>SP(Pro("I").pe(2),
                               VP(V("be"),Adv("only"),nbStations(leg),Adv("away"))),
                        ()=>SP(Pro("this"),VP(V("make").t("f"),nbStations(leg),
                                              PP(P("for"),NP(D("the"),A("whole"),N("trip")))))
                        ).a(",");
        var sp2 = oneOf(()=>SP(V("take").t("ip").pe(2),genLine(leg)),
                        ()=>SP(V("follow").t("ip").pe(2),genLine(leg),
                               PP(P("for"),NP(NO(Math.round(duration)),N("minute")))));
        return S(sp1,sp2).toString();
    } else {
        var sp1 = oneOf(()=>SP(D("ce"),V("être"),CP(C("et"),A("simple"),A("rapide")),nbStations(leg),
                               NP(D("aucun"),N("correspondance"))),
                        ()=>SP(Pro("je").pe(2).n("p"),
                               VP(V("être"),Adv("seulement"),P("à"),nbStations(leg))),
                        ()=>SP(Pro("ceci"),VP(V("faire").t("f"),nbStations(leg),
                                              PP(P("pour"),A("tout"),NP(D("le"),N("trajet")))))
                        ).a(",");
        var sp2 = oneOf(()=>SP(V("prendre").t("ip").pe(2).n("p"),genLine(leg)),
                        ()=>SP(V("suivre").t("ip").pe(2).n("p"),genLine(leg),
                               PP(P("pour"),NP(NO(Math.round(duration)),N("minute")))));
        return S(sp1,sp2).toString();
    }
}

// realise the name of the destination station
function destination(leg){
    return Q(network[last(leg)[0]].stationName);
}

// realize first leg of a trip
function introduction(leg,duration){
    if(currentLang=="en"){
        var sp1 = S(Pro("I").pe(2),VP(V("be"),NP(NO(Math.round(duration)),N("minute"))),
                     PP(P("from"),NP(D("my").pe(2),N("destination")))).a(",");
        var sp2 = oneOf(
                    ()=>SP(V("take").t("ip").pe(2),genLine(leg),
                           PP(P("for"),nbStations(leg))),
                    ()=>SP(V("board").t("ip").pe(2),PP(P("on"),genLine(leg)))
                  );
        var pp = oneOf(()=>PP(P("until"),SP(Pro("I").pe(2),
                                            VP(V("be"),PP(P("at"),destination(leg))))),
                       ()=>PP(P("up"),P("to"),destination(leg))
                 );
        return S(sp1,sp2.add(pp));
    } else {
        var sp1 = S(Pro("je").pe(2).n("p").n("p"),
                    VP(V("être"),P("à"),NP(NO(Math.round(duration)),N("minute"))),
                        PP(P("de"),NP(D("notre").pe(2),N("destination")))).a(",");
        var sp2 = oneOf(
                    ()=>SP(V("prendre").t("ip").pe(2).n("p"),genLine(leg),
                           PP(P("pour"),nbStations(leg))),
                    ()=>SP(V("embarquer").t("ip").pe(2).n("p"),PP(P("sur"),genLine(leg)))
                  );
        var pp = oneOf(()=>SP(P("jusque"),P("à"),Pro("ce"),Pro("je").pe(2).n("p"),
                              VP(V("être").t("s").pe(2).n("p"),PP(P("à"),destination(leg)))),
                       ()=>PP(P("jusque"),P("à"),destination(leg))
                 );
        return S(sp1,sp2.add(pp));
    }
}

// recursively realize intermediary legs of a trip
function body(legs){
    if (legs.length==0)return "";
    var leg=legs[0]
    if (currentLang=="en"){
        var out=oneOf(
            ()=>S(VP(V("take").t("ip").pe(2),genLine(leg),PP(P("up"),P("to"),destination(leg)))),
            ()=>S(VP(V("change").t("ip").pe(2),PP(P("on"),genLine(leg),P("until"),destination(leg)))),
            ()=>S(VP(V("transfer").t("ip").pe(2),PP(P("for"),destination(leg),P("on"),genLine(leg)))),
            ()=>S(VP(V("switch")).t("ip").pe(2),
                   PP(P("on"),genLine(leg),P("for"),nbStations(leg)))
        );
        return out+" "+body(legs.slice(1));
    } else {
        var out=oneOf(
            ()=>S(VP(V("prendre").t("ip").pe(2).n("p"),
                     genLine(leg),PP(P("jusque"),P("à"),destination(leg)))),
            ()=>S(VP(V("changer").t("ip").pe(2).n("p"),
                     PP(P("pour"),genLine(leg),P("vers"),destination(leg)))),
            ()=>S(VP(V("transférer").t("ip").pe(2).n("p"),
                     PP(P("pour"),destination(leg),P("sur"),genLine(leg)))),
            ()=>S(VP(V("passer")).t("ip").pe(2).n("p"),
                   PP(P("sur"),genLine(leg),P("pour"),nbStations(leg)))
        );
        return out+" "+body(legs.slice(1));
    }   
}

// realise last leg of a trip
function conclusion(leg){
    if (currentLang=="en"){
        var out=oneOf(
            ()=>S(Adv("finally"),Pro("I").pe(2),V("take").t("f"),genLine(leg),
                   V("arrive").t("pr"),PP(P("to"),destination(leg))),
            ()=>S(Q("at last").a(","),Pro("I").pe(2),
                  VP(V("find").t("f"),destination(leg).a(","),
                     PP(nbStations(leg,true),P("on"),genLine(leg)))),
            ()=>S(NP(D("my").pe(2),N("destination"),destination(leg)),
                  VP(V("be").t("f"),P("after"),nbStations(leg),
                                 P("on"),genLine(leg)))
        );
        return out;
    } else {
        var out=oneOf(
            ()=>S(Adv("finalement").a(","),Pro("je").pe(2).n("p"),
                   VP(V("prendre").t("f"),genLine(leg),
                      P("pour"),V("arriver").t("b"),PP(P("à"),destination(leg)))),
            ()=>S(Adv("enfin").a(","),Pro("je").pe(2).n("p"),
                  VP(V("trouver").t("f"),destination(leg).a(","),
                     PP(nbStations(leg,true),P("sur"),genLine(leg)))),
            ()=>S(NP(D("notre").pe(2),N("destination"),destination(leg)),
                  VP(V("être").t("f"),NP(D("le"),nbStations(leg,true),
                                         PP(P("sur"),genLine(leg)))))
        );
        return out;
    }
}

// output title and the full text of the trip
export function generate(trip,lang){
    if (lang!==undefined)
        currentLang=lang;
    var duration=last(last(trip))[1];
    if (currentLang=="en"){
        var title=VP(V("go").t("b"),P("from"),Q(network[trip[0][0][0]].stationName),
                     P("to"),Q(network[last(last(trip))[0]].stationName)).cap().tag("h2")+"\n";
    } else {
        var title=VP(P("pour"),V("aller").t("b"),P("de"),Q(network[trip[0][0][0]].stationName),
                     P("vers"),Q(network[last(last(trip))[0]].stationName)).cap().tag("h2")+"\n";
    }
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

if (isRunningUnderNode) {    
    if (currentLang=="en") loadEn(); else loadFr();

    let stationIds=Object.keys(network);

    function findTripGenerate(from,to){
        const trip=findTrip(network,from,to);
        console.log(generate(trip).toString());
    }

    findTripGenerate(18,57);
    findTripGenerate(61,"11-1");
    for (let i = 0; i < 10; i++) {
        findTripGenerate(oneOf(stationIds),oneOf(stationIds));
        console.log("-----");
    }
} 
