////////
//  Display with d3.js of a shortest path between two Montreal Metro stations
//     using information computed by "computeDist.js"
//  Guy Lapalme, lapalme@iro.umontreal.ca, oct 2018
//  
///////
import {findTrip, routeNos, routeNodes,network,isTransfer} from "./computeTrip.js";
import {generate} from "./describeTripEnFr.js";

let currentLang;

var margin=20;
var width=500;
var height=500;
var svg;

// find the scales 
var entries=Object.entries(network)
var x_extent=d3.extent(entries,e=>e[1].long);
var y_extent=d3.extent(entries,e=>e[1].lat);

var x_scale = d3.scaleLinear().range([margin,width-margin]).domain(x_extent);
var y_scale = d3.scaleLinear().range([height-margin,margin]).domain(y_extent);

function routeNodePath(routeNodes){
    var n=routeNodes[0];
    var d="M "+x_scale(n.long)+","+y_scale(n.lat)+" ";
    for (var i = 0; i < routeNodes.length; i++) {
        n=routeNodes[i];
        d+="L "+x_scale(n.long)+","+y_scale(n.lat)+" ";
    }
    return d;
}

function tripPath(trip){
    // console.log("tripPath",trip)
    var n=network[trip[0][0][0]];
    var d="M "+x_scale(n.long)+","+y_scale(n.lat)+" ";
    for (var i = 0; i < trip.length; i++) {
        var leg=trip[i];
        for (var j = 0; j < leg.length; j++) {
            n=network[leg[j][0]];
            d+="L "+x_scale(n.long)+","+y_scale(n.lat)+" ";
        }
    }
    return d;
}

var lineColor={"1":"green","2":"orange","4":"yellow","5":"blue","6":"magenta"}
var startNode=null,endNode=null,trip=null;

function traceTrip(trip){
    svg.append("path")
         .attr("id","trippath")
         .attr("d",tripPath(trip))
         .attr("fill","none")
         .attr("stroke","cyan")
         .attr("stroke-width",5)
         .attr("stroke-linecap","round")
         .attr("stroke-dasharray","2,10")
}

function showLabeledText(cx,cy,info){
    var g=svg.append("g")
             .classed("tooltip",true)
             .attr("transform","translate("+(cx+25)+","+(cy-10)+") rotate(-30)");
             var text=g.append("text").attr("stroke","none").attr("fill","black").text(info);
    var bbox=text.node().getBBox();
    var padding = 2;
    var rect = g.insert("rect","text") // insert rectangle before text
        .attr("x", bbox.x - padding)
        .attr("y", bbox.y - padding)
        .attr("rx",3).attr("ry",3)
        .attr("width", bbox.width + (padding*2))
        .attr("height", bbox.height + (padding*2))
        .attr("fill", "white").attr("stroke","black")
        .attr("pointer-events","none");
    return g;
}

function processClick(){
    // console.log("processClick",d,i,nodes,this);
    if (startNode==null){
        d3.selectAll(".startNode,.tooltip,#trippath").remove();
    }
    var cx=d3.select(this).attr("cx");
    var cy=d3.select(this).attr("cy")
    svg.append("circle")
        .classed("startNode",true)
        .attr("cx",cx)
        .attr("cy",cy)
        .attr("r",8)
        .attr("fill","none")
        .attr("stroke","cyan")
        .attr("stroke-width",3);
    showLabeledText(cx,cy,this.routeNode.stationName);
    if (startNode==null) {
        startNode=this.routeNode;
    } else {
        endNode=this.routeNode;
        trip=findTrip(network,startNode.id,endNode.id);
        traceTrip(trip);
        var text=generate(trip,currentLang).toString();
        d3.select("#itinerary").html(text);
        startNode=null;
    }
}

function traceRouteNodes(routeNos,routeNodes,network){
    svg=d3.select("#graphique").append("svg")
              .attr("width",width).attr("height",height)
              .append("g")//fudge factor transform to get "nice" display, i.e. looking like the usual metro maps
                  .attr("transform","rotate(30,200,200) translate(-55 35)")
                  .attr("stroke","black")
                  .attr("stroke-width",1);
    for (var i = 0; i < routeNos.length; i++) {
        var routeNo=routeNos[i];
        svg.append("path")
              .attr("d",routeNodePath(routeNodes[routeNo]))
              .attr("fill","none")
              .attr("stroke",lineColor[routeNo])
              .attr("stroke-width",10);
        var nbNodes=routeNodes[routeNo].length
        for (var j = 0; j < nbNodes ; j++) {
            var rn=routeNodes[routeNo][j];
            var csel=svg.append("circle")
                    .attr("cx",x_scale(rn.long))
                    .attr("cy",y_scale(rn.lat))
                    .attr("r",5)
                    .attr("fill","white")
                    .on("click",processClick);
            csel.node().routeNode=rn; // save pointer to the routeNode in the DOM node 
            if (j==0 || j== nbNodes-1 || isTransfer(rn.id)){
                svg.append("g")
                    .attr("transform","translate("+x_scale(rn.long)+","+
                                                   y_scale(rn.lat)+") rotate(-30)")
                    .append("text")
                     .attr("fill","black")
                     .attr("stroke","none")
                     .attr("text-anchor","left")
                     .text(rn.stationName)
                     .attr("pointer-events","none");
            }
        }
    }
}

// deal with language change
function changeLanguage(){
    setLanguage(currentLang=="en"?"fr":"en");
}

// taken from https://www.sitepoint.com/url-parameters-jquery/
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

function setLanguage(lang){
    if (lang=="en"){
        currentLang="en"; 
        loadEn();
        $("[lang=en]").show(); $("[lang=fr]").hide();
    } else {
        currentLang="fr";
        loadFr(); 
        $("[lang=fr]").show(); $("[lang=en]").hide();        
    }
    if (trip!=null)
        d3.select("#itinerary").html(generate(trip,currentLang).toString());
}



$(document).ready(function() {
    traceRouteNodes(routeNos,routeNodes,network);
    $("#langSelect").css({"cursor":"pointer"})
    $("#langSelect").click(changeLanguage);
    var lang=$.urlParam("lang");
    // console.log("lang="+lang);
    if (lang=="en" || lang=="fr")
        setLanguage(lang);
    else
        setLanguage("en");
});
