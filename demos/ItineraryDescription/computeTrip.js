////////
//  Computation of a shortest path between two Montreal Metro stations
//  Guy Lapalme, lapalme@iro.umontreal.ca, oct 2018
//    this file can be used either in a web page or as a node.js module
///////

export {createNetwork, showNetwork, findTrip, routeNos, routeNodes,routes,network,isTransfer};

const MAX_DIST=100000;
const DIST_MINUTES=150; // approximate ratio of distances between stations and minutes
const STOP_TIME=1;      // approximate time in minutes for a stop
const TRANSFER_TIME= 5; // approximate time for transfering lines
const trace=false;

//  data structure of for a node in an undirected network
class Node {
    constructor(id, s, route) {
        this.id = id; // identification either a number or "number"-"line number" for a transfer station
        this.stationName = s.station; // external name of the station
        this.route = route; // route/line number
        this.long = s.coords[0]; // longitude
        this.lat = s.coords[1]; // latitude
        this.links = []; // list of [nodeId, distance] with neighbors in the network
        this.start = null; // node of the first station of the line
        this.end = null; // node of the last station of the line
        this.index = -1; // rank of this station in the line

        // for computing the shortest path
        this.minDist = MAX_DIST; // minimum dist from the current node
        this.precede = null; // previous node in the shortest path
    }
    toString() {
        let res = this.id + ":" + this.stationName + ":" + this.route + " index=" + this.index +
            " " + this.long.toFixed(0) + "@" + this.lat.toFixed(0);
        if (this.links.length > 0) {
            res += " links=[" + this.links.map(l => l[0].id + ":" + l[1].toFixed(2)).join(",") + "]";
        }
        if (this.minDist != MAX_DIST)
            res += " minDist=" + (this.minDist.toFixed(2));
        if (this.precede != null)
            res += " precede=" + this.precede.id;
        if (this.start != null)
            res += " start=" + this.start.id;
        if (this.end != null)
            res += " end=" + this.end.id;
        return res;
    }
}


// display functions to help debugging
function showDist(routes){
    console.log("Distances between stations")
    for (let j = 0; j < routes.length; j++) {
        const routeNo=routes[j].route;
        const stations=routes[j].stations
        for (var i = 1; i < stations.length; i++) {
            const s0=stations[i-1];
            const s1=stations[i];
            const dist=Math.sqrt((s0.coords[0]-s1.coords[0])**2+(s0.coords[1]-s1.coords[1])**2)/DIST_MINUTES
             // approximate time in minutes
            console.log("%s::%s:%s -> %s:%s : %d",routeNo,s0.id,s0.station,s1.id,s1.station,dist);
        }
    }
}

function showNetwork(network){
    console.log("Network for computing path");
    for (let iNode in network){
        console.log(network[iNode].toString());
    }
    console.log("RouteNodes");
    for (let i in routeNodes) {
        console.log(i,":",routeNodes[i].map(n=>n.id).join(","))
    }
}

function showTrip(network,trip){
    for (var i = 0; i < trip.length; i++) {
        var t=trip[i];
        var legs=[]
        for (var j = 0; j < t.length; j++) {
            var leg=t[j];
            legs.push("("+leg[0]+":"+network[leg[0]].stationName+","+leg[1].toFixed(2)+")")
        }
        if(trace)console.log(legs.join(","))
    }
}

// get the dist between node n1 and node n2
//   if n2 is in the links associated with n1
function getDist(network,n1,n2){
    var l=n1.links;
    for (var i = 0; i < l.length; i++) {
        var nDist=l[i];
        if (nDist[0]==n2)return nDist[1];
    }
    return null;
}

function addLinks(network,n1,n2,dist){
    if (getDist(network,n1,n2)==null)
        n1.links.push([n2,dist]);
    if (getDist(network,n2,n1)==null)
        n2.links.push([n1,dist]);
}

function ensureNode(network,id,station,route){
    var n=network[id];
    if (n!==undefined)return n;
    return network[id]=new Node(id,station,route)
}

function isTransfer(id){
    return /\d+-\d+/.test(id)
}

function isSameStationTransfer(id1,id2){
    var m1=/(\d+)-\d+/.exec(id1)
    var m2=/(\d+)-\d+/.exec(id2)
    return m1!=null && m2!=null && m1[1]==m2[1];
}

function makeId(s,routeNo){
    return (s.route==routeNo)?s.id:(s.id+"-"+routeNo) 
}

// check if id exists in network, if not then try by appending a routeNumber
function checkId(network,id){
    if (network[id]!==undefined)return id;
    for (var i = 0; i < routeNos.length; i++) {
        var idRn=id+"-"+routeNos[i];
        if (network[idRn]!==undefined)return idRn;
    }
    return undefined;
}

var routeNos=[];
var routeNodes={};

// network of nodes from the information about the routes
function createNetwork(routes){
    var network={};
    for (var j = 0; j < routes.length; j++) {
        var routeNo=routes[j].route;
        routeNos.push(routeNo);
        var stations=routes[j].stations;
        var nodes=new Array(); // keep track of nodes of this line
        for (var i = 1; i < stations.length; i++) {
            var s1=stations[i-1];
            var n1=ensureNode(network,makeId(s1,routeNo),s1,routeNo);
            if (nodes.length==0)nodes.push(n1);
            var s2=stations[i];
            var n2=ensureNode(network,makeId(s2,routeNo),s2,routeNo)
            var dist=Math.sqrt((s1.coords[0]-s2.coords[0])**2+(s1.coords[1]-s2.coords[1])**2)/600 // temps approx en minutes
            nodes.push(n2);
            addLinks(network,n1,n2,dist+STOP_TIME);
        }
        routeNodes[routeNo]=nodes;
        // add index, start node and end node in this line (useful for giving directions)
        var start=nodes[0];
        var end=nodes[nodes.length-1];
        for (var i = 0; i < nodes.length; i++) {
            var n=nodes[i];
            n.index=i;
            n.start=start;
            n.end=end;
        } 
    };
    // add distance between transfer stations
    for (var j = 0; j < routes.length; j++) {
        var routeNo=routes[j].route;
        var stations=routes[j].stations;
        for (var i = 0; i < stations.length; i++) {
            var s=stations[i];
            var id=s.id;
            if (s.route!=routeNo){
                var otherRoutes=s.route.split(",");
                for (var k=0;k<otherRoutes.length;k++){
                    var rn=otherRoutes[k];
                    if (rn!=routeNo){
                        addLinks(network,network[id+"-"+routeNo],network[id+"-"+rn],TRANSFER_TIME);
                    }
                }
            }
        }
    };
    return network;
}

// find route between two ids in the network
function findTrip(network,id1,id2){
    id1=checkId(network,id1);
    id2=checkId(network,id2);
    if (network[id1]===undefined){
        console.log("%s not found in network",id1);
        return null;
    } else if (network[id2]===undefined){
        console.log("%s not found in network",id2);
        return null
    };
    if (id1==id2){
        return [[[id1,0]]];
    }
    for (let iNode in network){
        network[iNode].minDist=MAX_DIST;
    };
    network[id1].minDist=0;
    network[id1].precede=null;
    // Ford algorithm for shortest path
    // much simpler to implement than Dijkstra on such a small network
    let changed;
    do {
        changed=false;
        for (let iNode in network){
            const n1=network[iNode];
            for (let i in n1.links){
                const n2=n1.links[i][0];
                const dist=n1.minDist+n1.links[i][1];
                if (dist<n2.minDist){
                    n2.minDist=dist;
                    n2.precede=n1;
                    changed=true;
                }
            }
        }
    } while (changed);
    // get shortest path from n2 to n1 and reverse it
    const path=[];
    let n=network[id2];
    while (n!=null){
        path.push([n.id,n.minDist]);
        n=n.precede;
    }
    path.reverse()
    if (trace) console.log("Path from %s to %s: %d :%s",id1,id2,network[id2].minDist.toFixed(2),
                           JSON.stringify(path));
    // split in lines at the transfer station
    let startPath=0;
    let iPath=0;
    const trip=[];
    if (isSameStationTransfer(path[0][0],path[1][0])){
        // very special case path starts with two transfers within same line
        path.shift() // remove dummy transfer       
        for (let i = 0; i < path.length; i++) {
            path[i][1]-=TRANSFER_TIME; // remove dummy transfer time from the rest of the path
        }
    }
    while (iPath<path.length){
        let id=path[iPath][0];
        if (isTransfer(id)){
            // a transfer station
            if (iPath<path.length-1){
                let id1=path[iPath+1][0];
                if (isSameStationTransfer(id,id1)){
                    trip.push(path.slice(startPath,iPath+1));
                    iPath++
                    startPath=iPath;
                }
            }
        }
        iPath++;
    }
    
    if (startPath<iPath-1 || !isSameStationTransfer(path[startPath][0],path[iPath-1][0])) // do not add a single within transfer change
        trip.push(path.slice(startPath,iPath));
    if (trace){
        console.log("Route from %s:%s to %s:%s",id1,network[id1].stationName,id2,network[id2].stationName);
        showTrip(network,trip);
        console.log("---");
    }
    return trip;
}

import {routes} from "./metroLinesSortedRose.js"
let network=createNetwork(routes);

if (typeof process !== "undefined" && process?.versions?.node) {
    // https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line/66309132#66309132
    let path=await import("path")
    let {fileURLToPath} = await import('url');
    const nodePath = path.resolve(process.argv[1]);
    const modulePath = path.resolve(fileURLToPath(import.meta.url))
    const isRunningDirectlyViaCLI = nodePath === modulePath;

    if (isRunningDirectlyViaCLI){
        console.log(findTrip(network,45,56),"\n---");
        console.log(findTrip(network,11,56),"\n---");
        console.log(findTrip(network,5,11),"\n---");
        console.log(findTrip(network,12,12),"\n---");
        console.log(findTrip(network,64,61),"\n---");
        console.log(findTrip(network,32,56),"\n---");
    }   
}