import {minX,maxX,fleche,m,tracer} from "./Graphique.js"
import {graphe,Etat} from "./Etat.js";

export {protagoniste}

const eq = (v1,v2) => Math.abs(v1-v2)<10 ; // à peu près égal...

let protagoniste = {
    pe:2,n:"s",g:"m",
    use_majestic:true,
    struct:() => Pro("moi").pe(protagoniste.pe)
                           .g(protagoniste.g)
                           .n(protagoniste.n).c("nom"),
    structTn:() => Pro("moi").pe(protagoniste.pe)
                             .g(protagoniste.g)
                             .n(protagoniste.n).tn("")
   }
 
export class Etape extends Etat{
    constructor(nom, x, y, struct,suivant, nextPath) {
        super(nom, x, y, struct);
        this.suivant = suivant;
        this.nextPath = nextPath;
    }
    realiser() {
        if (this.struct === undefined)return this.nom;
        return this.struct().typ({"maje":protagoniste.use_majestic}).realize();
    }
    toString() {
        return `Etape(${this.nom},${this.suivant})`;
    }
    getSuivant() { return graphe[this.suivant]; }
    lier() {
        if (this.nom == "Réfléchissez au prochain problème" ||
            this.nom == "  ATTENDEZ SIX MOIS  " ||
            this.suivant === undefined)
            return;
        const depart = this;
        const arrivee = graphe[this.suivant];
        let dx = depart.bbox.x, ax = arrivee.bbox.x;
        let dy = depart.bbox.y, ay = arrivee.bbox.y;
        if (depart.nextPath === undefined) {
            if (eq(dy, ay)) { // flèche horizontale
                if (dx < ax) { // d -> a  vers la droite
                    this.suivant_path = tracer(depart.bbox, arrivee.bbox, "d");
                } else { // a <- d vers la gauche
                    this.suivant_path = tracer(depart.bbox, arrivee.bbox, "g");
                }
            } else if (eq(dx, ax)) { // flèche verticale
                if (dy < ay) { // flèche en bas
                    this.suivant_path = tracer(depart.bbox, arrivee.bbox, "b");
                } else { // fleche en haut
                    this.suivant_path = tracer(depart.bbox, arrivee.bbox, "h");
                }
            } else { // faire une flèche par les côtés
                const deltaMinX = Math.abs(dx - minX);
                const deltaMaxX = Math.abs(dx + depart.bbox.width - maxX);
                if (deltaMinX < deltaMaxX) { // vers le minX
                    this.suivant_path = tracer(depart.bbox, undefined, "g");
                } else { // vers le maxX
                    this.suivant_path = tracer(depart.bbox, undefined, "d");
                }
            }
        } else {
            this.suivant_path = fleche(m(dx + depart.bbox.width / 2, dy + depart.bbox.height) + " " + depart.nextPath);
        }
    }
    selectionner(oui, select) {
        super.selectionner(select);
        if (this.suivant_path !== undefined)
            this.suivant_path.classed("selected", select)
                .attr("marker-end", "url(#blue-arrow)");
    }
}

