// une action est soit une Etape ou une liste [Test,"OUI"|"NON"|"ATTENDRE"]
import {Etape} from "./Etape.js";
import {Test} from "./Test.js";
import {etatFinal} from "./Graphe.js"

export class Chemin {
    constructor(actions) {
        this.actions = actions;
    }
    // ajouter une nouvelle action ainsi que la direction si c'est un test
    ajouter(etat, direction) {
        if (etat instanceof Etape) {
            this.actions.push(etat);
        } else if (etat instanceof Test) {
            this.actions.push([etat, direction]);
        } else {
            console.log("Chemin.ajouter: etat bizarre:", etat);
        }
        return this;
    }
    // vérifier si un chemin contient déjà un etat
    contient(etat) {
        return this.actions.find(e => e instanceof Etape ? e == etat : e[0] == etat);
    }
    // écrire la réalisation de chaque action 
    log() {
        this.actions.forEach(e => e.log());
        console.log("---");
    }
    // afficher un chemin dans la fenêtre #realisation
    realiser(d3elem) {
        const n = this.actions.length;
        for (let i = 0; i < n; i++) {
            const action = this.actions[i];
            if (action instanceof Etape) {
                d3elem.append("p")
                    .attr("id", "p" + (i))
                    .text(action.realiser());
                action.selectionner(true, true);
                action.bgdRect.attr("id", `g${i}`);
            } else {
                if (action[1] == "ATTENDRE") {
                    // ne réaliser que la question par inversion pour un test où on attend la réponse
                    d3elem.append("p")
                        .attr("id", "p" + (i))
                        .text(action[0].struct().typ({ int: "yon" }));
                    return;
                }
                d3elem.append("p")
                    .attr("id", "p" + (i))
                    .text(action[0].realiser(action[1] == "OUI"));
                action[0].selectionner(action[1] == "OUI", true);
                action[0].bgdRect.attr("id", `g${i}`);
            }
        }
        d3elem.append("p")
            .text("***")
            .style("text-align", "center");
    }
    ajouterHandlers() {
        const chemin = this;
        function mouseOver(scroll, i) {
            d3.select("#p" + i).style("border", "1px solid black");
            d3.select(`#g${i}`)
                .attr("stroke", "blue")
                .attr("stroke-width", "2px");
            if (scroll)
                scrollIfNeeded(i, chemin);
        }
        function mouseOut(action, i) {
            d3.select("#p" + i).style("border", "none");
            d3.select(`#g${i}`)
                .attr("stroke", action.estEnCapitales() ? "black" : "none")
                .attr("stroke-width", "1px");
        }
        const n = chemin.actions.length;
        for (let i = 0; i < n; i++) {
            let action = chemin.actions[i];
            if (!(action instanceof Etape))
                action = action[0];
            d3.select("#p" + i)
                .on("mouseover", () => mouseOver(false, i))
                .on("mouseout", () => mouseOut(action, i));
            d3.select("#g" + i)
                .on("mouseover", () => mouseOver(true, i))
                .on("mouseout", () => mouseOut(action, i));
        }
    }
    enleverHandlers() {
        const n = this.actions.length;
        for (let i = 0; i < n; i++) {
            d3.select("#g" + i).on("mouseover", null).on("mouseout", null).attr("id", null);
            d3.select("#p" + i).on("mouseover", null).on("mouseout", null);
        }
    }
    montrer() {
        d3.selectAll("#realisation *").remove(); // nettoyer le texte
        d3.selectAll("path.selected").attr("marker-end", "url(#arrow)"); // remettre le bout des flèches en noir
        d3.selectAll(".selected").classed("selected", false); // nettoyer l'organigramme
        this.realiser(d3.select("#realisation"));
        this.ajouterHandlers();
    }
    // allonger le chemin suite à la réponse contenue dans le dernier Test
    allonger() {
        const monChemin = this;
        function handle(choix, next) {
            monChemin.enleverHandlers();
            dernier[1] = choix; // changer "ATTENDRE" par le résultat choisi
            while (next instanceof Etape && next != etatFinal && next.nom != "CORBEILLE") {
                monChemin.ajouter(next);
                next = next.getSuivant();
            }
            d3.selectAll(".activeChoice").classed("activeChoice", false);
            if (next != etatFinal && next.nom != "CORBEILLE") {
                monChemin.ajouter(next, "ATTENDRE");
                monChemin.allonger();
            } else {
                monChemin.ajouter(next);
            }
            monChemin.montrer();
        }
        const dernier = this.actions[this.actions.length - 1];
        if (Array.isArray(dernier) && dernier.length == 2) {
            const etat = dernier[0];
            const nonOui = etat.nonOui;
            etat.gBtn
                .classed("activeChoice", true)
                .on("click", function () {
                    handle(nonOui ? "NON" : "OUI", nonOui ? etat.non() : etat.oui());
                });
            etat.dBtn
                .classed("activeChoice", true)
                .on("click", function () {
                    handle(nonOui ? "OUI" : "NON", nonOui ? etat.oui() : etat.non());
                });
        } else {
            console.log("dernier pas un tableau avec un test et un chaine", dernier);
            throw "dernier pas instance de Test";
        }
        return;
    }
}

/////////////
//  fonctions globales qui ne font pas partie d'un chemin mais qui y sont reliées

// essayer d'aligner le paragraphe avec l'élément graphique correspondant
export function scrollIfNeeded(i,chemin){
    d3.select("#realisation").node().scrollTop=0     // scroll au début
    const g_pos=d3.select(`#g${i}`).node().getBoundingClientRect().top; // pos de g_i
    const o_pos=d3.select(`#organigramme`).node().getBoundingClientRect().top; // pos organigramme
    const p0_pos=d3.select(`#p0`).node().getBoundingClientRect().top; // pos de p_0
    const p_pos=d3.select(`#p${i}`).node().getBoundingClientRect().top; // pos de p_i
    const real_rect=d3.select(`#realisation`).node().getBoundingClientRect() // rect de realisation
    // scroller pour aligner le paragraphe avec l'élment graphique
    const delta_org=g_pos-o_pos;
    d3.select("#realisation").node().scrollTop=p_pos-p0_pos-delta_org;
}

export function tousLesChemins(){
    // parcours à la Perec
    let tousChemins=[];
    function parcoursPerec(depart,chemin){
        // attention il faut créer des chemins différents à chaque appel récursif
        // console.log("parcoursPerec",depart,chemin)
        if (depart==etatFinal || depart.nom=="CORBEILLE"){
            tousChemins.push(chemin);
            return;
        }
        if (depart instanceof Etape){
            let arrivee = depart.getSuivant();
            if (! chemin.contient(arrivee))
                parcoursPerec(arrivee,new Chemin(chemin.actions.concat([depart])));
        } else if (depart instanceof Test) {
            const non = depart.non(); // Perec semble traiter le cas non en premier
            if (! chemin.contient(non))
                parcoursPerec(non,new Chemin(chemin.actions.concat([[depart,"NON"]])));
            const oui = depart.oui();
            if (! chemin.contient(oui))
                parcoursPerec(oui,new Chemin(chemin.actions.concat([[depart,"OUI"]])));
        } else {
            console.log("etat inconnu:%s::%s",depart, typeof depart)
        }
    }

    parcoursPerec(etatFinal.getSuivant(),new Chemin([]));
    // console.log("%d parcours",tousChemins.length);
    return tousChemins;
}
