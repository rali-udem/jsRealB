import "../../dist/jsRealB.js";
Object.assign(globalThis,jsRealB);

import {Chemin,tousLesChemins } from "./Chemin.js";
import {etats,parametrer,etatFinal} from "./Graphe.js";
import {organigramme} from "./Graphique.js"


// fonctions auxiliaires

let chemins,chemin,noChemin;

function numeroChemin(){
    noChemin=parseInt(d3.select("#noChemin").property("value"));
    if (noChemin<1 || isNaN(noChemin)){ // valider le numéro de chemin
        noChemin=1;
    } else if (noChemin>chemins.length){
        noChemin=chemins.length;
    }
    d3.select("#noChemin").property("value",noChemin);
    parametrer(chemin);
    chemin=chemins[noChemin-1];
    chemin.montrer();
}


function maManiere(){
    parametrer(chemin);
    chemin = new Chemin([etatFinal,[etatFinal.getSuivant(),"ATTENDRE"]]);
    chemin.montrer();
    chemin.allonger();    
}

document.addEventListener("DOMContentLoaded", function(e) {
    loadFr();
    addToLexicon({snack: { N: { g: 'm', tab:  'n3'  } }});
    addToLexicon({prétexte: { A: { tab:  'n25'  }, N: { g: 'x', tab:  'n17'  } }});
    addToLexicon({cheffe: { N: { g: 'f', tab: 'n17' }}});
    
    d3.select("#cacherAfficherInstructions").on("click",function(){
        const val=d3.select("#cacherAfficherInstructions").property("value");
        if (val=="Cacher les instructions"){
            d3.select("#instructions").style("display","none");
            d3.select(this).property("value","Afficher les instructions")
        } else {
            d3.select("#instructions").style("display","block");
            d3.select(this).property("value","Cacher les instructions")
        }
    });

    organigramme(etats);
    chemins=tousLesChemins();
    // écouter les événements
    d3.select("#noChemin").property("max",chemins.length);
    d3.selectAll(".nbManieres").text(chemins.length);
    d3.selectAll("select").on("change",function(){
        parametrer(chemin);
        chemin.montrer();
    });
    d3.select("#noChemin").on("change",numeroChemin);
    d3.select("#a_ma_maniere").on("click",maManiere);
    // afficher le premier chemin
    chemin=new Chemin([etatFinal].concat(chemins[0].actions));
    parametrer();
    chemin.montrer();
});

