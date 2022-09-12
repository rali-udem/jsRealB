export {svg, width,height,minX,maxX,minY,maxY, OUIwidth,NONwidth,OUIheight,NONheight, m,l,organigramme,fleche,tracer};
import {graphe} from "./Etat.js";

let width,height,minX,maxX,minY,maxY;

const OUIwidth=29, NONwidth=35; // à ajuster en fonction de la police...
const OUIheight=19,NONheight=19;

const svg=d3.select("svg");

// fonctions auxiliaires pour le tracé de l'organigramme
function fleche(d){
    return svg.append("path")
              .attr("d",d)
              .attr("fill","none")
              .attr("stroke","black")
              .attr("stroke-width","1")
              .attr("marker-end","url(#arrow)");    
}

const m = (x,y)=>` M ${x} ${y}`;
const l = (x,y)=>` L ${x} ${y}`;

// tracer une flèche entre deux bbox
function tracer(d_bbox,a_bbox, direction){
    // direction: h(aut), b(as), 
    //            g(auche), d(roite), si arrivee est undefined aller vers les côtés
    let dx=d_bbox.x;
    let dy=d_bbox.y;
    let dw=d_bbox.width;
    let dh=d_bbox.height;
    switch (direction) {
    case "h":
        return fleche(m(dx+dw/2,dy)+l(dx,a_bbox.y+a_bbox.height));
        break;
    case "b":
        return fleche(m(dx+dw/2,dy+dh)+l(dx+dw/2,a_bbox.y));
        break;
    case "g":
        dy+=dh/2;
        if (a_bbox==undefined){
            return fleche(m(dx,dy)+l(minX,dy))
        } else {
            return fleche(m(dx,dy)+l(a_bbox.x+a_bbox.width,dy))
        }
        break;
    case "d":
        dy+=dh/2
        if (a_bbox==undefined){
            return fleche(m(dx+dw,dy)+l(maxX,dy))
        } else {
            return fleche(m(dx+dw,dy)+l(a_bbox.x,dy));
        }
        break;
    default:
        console.log("direction inconnue:"+direction)
    }
}


function organigramme(etats){
    const bcr=svg.node().getBoundingClientRect();
    width=bcr.width;
    height=bcr.height;
    // attention à ne pas changer pour éviter d'avoir à tout recalculer les positions 
    const x_extent=[79,825];  
    const y_extent=[17,1026];
    const margin=20;
    const x_scale = d3.scaleLinear().range([margin,-margin+width]).domain(x_extent);
    const y_scale = d3.scaleLinear().range([margin,-margin+height]).domain(y_extent);
    
    // placer tous les états
    svg.selectAll("g")
        .data(etats)
        .enter()
        .each(function(etat){
            etat.afficher(svg,x_scale(etat.x),y_scale(etat.y));
        })
            
    // grande flèche à gauche
    minX=10;
    const rsd=graphe["Réfléchir, Se décider"];
    minY=rsd.bbox.y+rsd.bbox.height/2;
    const a6m=graphe["  ATTENDEZ SIX MOIS  "];
    maxY = a6m.bbox.y+a6m.bbox.height/2;
    fleche(m(a6m.bbox.x,maxY)+l(minX,maxY)+l(minX,minY)+l(rsd.bbox.x,minY));
    
    // grande flèche droite
    maxX=width-10;
    const sdr=graphe["Se décider, Réfléchir"];
    const rpp=graphe["Réfléchissez au prochain problème"];
    fleche(m(rpp.bbox.x+rpp.bbox.width,maxY)+l(maxX,maxY)+l(maxX,minY)+
           l(sdr.bbox.x+sdr.bbox.width,minY));
    
    etats.forEach(function(etat){etat.lier()});
}    


