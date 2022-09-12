export const graphe=[];

export class Etat {
    constructor(nom, x, y, struct) {
        this.nom = nom;
        this.struct = struct;
        this.x = x;
        this.y = y;
        graphe[nom] = this;
    }
    log() {
        console.log(this.realiser());
    }
    estDans(chemin) {
        const re = new RegExp("\\b" + etat + "\\b");
        return re.test(chemin);
    }
    getStruct() {
        return this.struct !== undefined ? this.struct : () => Q(nom);
    }
    estEnCapitales() {
        const infoMr = this.nom.replace("Mr", "");
        return infoMr.toUpperCase() == infoMr;
    }
    afficher(svg,cx, cy) {
        const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
        g.etat = this;
        let text = g.append("text").attr("stroke", "none").attr("fill", "black");
        const ix = this.nom.indexOf("/");
        const info = this.nom;
        let bbox, tspan, dy;
        if (ix < 0) {
            tspan = text.append("tspan").attr("pointer-events", "none").text(info);
            bbox = text.node().getBBox();
            dy = bbox.height;
        } else {
            text.append("tspan").attr("pointer-events", "none").text(info.substring(0, ix));
            bbox = text.node().getBBox();
            dy = bbox.height;
            tspan = text.append("tspan").attr("dy", dy).attr("x", 0).text(info.substring(ix + 1));
            bbox = text.node().getBBox();
        }
        bbox=this.updateBBox(bbox,tspan,text,dy);
        const padding = 3;
        this.bgdRect = g.insert("rect", "text") // insert rectangle before text
            .attr("x", bbox.x - padding)
            .attr("y", bbox.y - padding)
            .attr("rx", 3).attr("ry", 3)
            .attr("width", bbox.width + (padding * 2))
            .attr("height", bbox.height + (padding * 2))
            .attr("fill", "none")
            .classed(this.constructor.name.toLowerCase(), true);
        // .attr("pointer-events","none");
        if (this.estEnCapitales()) { // entourer si l'info est tout en majuscule
            this.bgdRect.attr("stroke", "black");
        }
        bbox.x += cx;
        bbox.y += cy;
        this.bbox = bbox;
        this.text = text;
    }
    updateBBox(bbox,_tspan,_text,_dy){// only useful for Test
        return bbox; 
    }
    selectionner(select, className) {
        if (className === undefined)
            className = "selected";
        d3.select(this.text.node().firstChild).classed(className, select);
        if (this.nom.indexOf("/") >= 0) {
            d3.select(this.text.node().firstChild.nextElementSibling).classed(className, select);
        }
    }
}    
