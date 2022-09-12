import {OUIwidth,NONwidth,OUIheight,NONheight, m,fleche,tracer} from "./Graphique.js";
import {graphe,Etat} from "./Etat.js";

 
export class Test extends Etat {
    constructor(nom, x, y, struct,alternativeOUI, alternativeNON, nonOui, g_path, d_path) {
        super(nom, x, y, struct);
        this.alternativeOUI = alternativeOUI;
        this.alternativeNON = alternativeNON;
        this.nonOui = nonOui;
        this.g_path = g_path;
        this.d_path = d_path;
    }
    toString() {
        return `Test(${this.nom},${this.alternativeOUI},${this.alternativeNON})`;
    }
    updateBBox(bbox,tspan,text,dy){
        tspan.attr("style", "text-decoration: underline;"); // souligner la dernière ligne
        this.gBtn = text.append("tspan").attr("dy", dy)
            .attr("x", 0)
            .text(this.nonOui ? "NON" : "OUI")
            .datum(this);
        this.dBtn = text.append("tspan").attr("dy", 0)
            .attr("x", bbox.width - (this.nonOui ? OUIwidth : NONwidth))
            .text(this.nonOui ? "OUI" : "NON")
            .datum(this);
        return text.node().getBBox();
    }
    //realiser() voir dans graphe... 
    oui() { return graphe[this.alternativeOUI]; }
    non() { return graphe[this.alternativeNON]; }
    lier() {
        let etatGauche, etatDroit;
        const depart = this;
        if (this.nonOui) {
            etatGauche = this.non();
            etatDroit = this.oui();
        } else {
            etatGauche = this.oui();
            etatDroit = this.non();
        }
        const dep_bbox = depart.bbox;
        const dx = depart.bbox.x;
        const dy = depart.bbox.y;
        let d_bbox = {
            x: dep_bbox.x, y: dep_bbox.y + dep_bbox.height - OUIheight,
            height: OUIheight, width: OUIwidth
        };
        // lier l'état à gauche
        if (depart.g_path === undefined) {
            if (d_bbox.y < etatGauche.bbox.y) { // verticale bas
                this.gauche_path = tracer(d_bbox, etatGauche.bbox, "b");
            } else if (d_bbox.x > etatGauche.bbox.x) { // ligne horizontale gauche
                this.gauche_path = tracer(d_bbox, etatGauche.bbox, "g");
            } else {
                this.gauche_path = tracer(d_bbox, undefined, "g");
            }
        } else {
            this.gauche_path = fleche(m(d_bbox.x, d_bbox.y + d_bbox.height / 2) + " " + depart.g_path);
        }
        // etat à droite
        d_bbox = {
            x: dep_bbox.x + dep_bbox.width - NONwidth, y: dep_bbox.y + dep_bbox.height - NONheight,
            height: NONheight, width: NONwidth
        };
        if (depart.d_path === undefined) {
            if (d_bbox.y < etatDroit.bbox.y) { // ligne verticale bas
                this.droite_path = tracer(d_bbox, etatDroit.bbox, "b");
            } else if (d_bbox.x < etatDroit.bbox.x) { // ligne horizontale droite
                this.droite_path = tracer(d_bbox, etatDroit.bbox, "d");
            } else {
                this.droite_path = tracer(d_bbox, undefined, "d");
            }
        } else {
            this.droite_path = fleche(m(d_bbox.x + d_bbox.width, d_bbox.y + d_bbox.height / 2) + " " + depart.d_path);
        }
    }
    selectionner(oui, select) {
        Etat.prototype.selectionner.call(this, select);
        let dBtn, gBtn, droite_path, gauche_path;
        if (this.nonOui) {
            dBtn = this.gBtn; droite_path = this.gauche_path;
            gBtn = this.dBtn; gauche_path = this.droite_path;
        } else {
            dBtn = this.dBtn; droite_path = this.droite_path;
            gBtn = this.gBtn; gauche_path = this.gauche_path;
        }
        if (oui) {
            gBtn.classed("selected", select);
            gauche_path.classed("selected", select)
                .attr("marker-end", "url(#blue-arrow)");
        } else {
            dBtn.classed("selected", select);
            droite_path.classed("selected", select)
                .attr("marker-end", "url(#blue-arrow)");
        }
    }
}    
