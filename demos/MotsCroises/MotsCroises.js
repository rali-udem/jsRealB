
// modules ES6
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import trie from "./Donnees/trie-fr.json" with { type: "json" };
import probs from "./Donnees/probs-fr.json" with { type: "json" };
// import probs from "./Donnees/probs-en.json";
import mots from "./Donnees/mots-fr.json" with { type: "json" };
// import {mots} from "./Donnees/mots-en.json" ;

import {Grille} from "./Grille.js"
// création des fichiers pour d'autres applications
import {grilleToHTML,grilleToObject,grilleToPuz} from "./exportGrille.js"

// modules CommonJS
// fs = require("fs")
// __dirname = "."

// const lang="fr"
// const trie = require(`./Donnees/trie-${lang}.json`)
// import trie from "./Donnees/trie-en.json";
// const probs = require(`./Donnees/probs-${lang}.json`)
// const mots = require(`./Donnees/mots-${lang}.json`)
// const {Grille:Grille} = require("./Grille.js")

/// décommenter pour les définitions de MCWiktionnaire
// const MCWikti = require("./MCWikti.js")
// const getDef = MCWikti.getDef 

// const {grilleToHTML:grilleToHTML, 
//        grilleToObject:grilleToObject,
//        grilleToPuz:grilleToPuz} = require("./exportGrille.js")


// lancement de la création d'une grille
//  nb_lignes,nb_cols: dimensions de la grille (HxV)
//  mots: liste de dictionnaires des formes avec leur définitions
//  trie: trie des préfixes
//  score: fonction qui calcule la moyenne des probabilités qu'une lettre apparaisse à une certaine position 
//  getDef: fonction qui retourne la définition associée à une forme
//  tauxMax : entier indiquant le pourcentage de cases noires considéré comme suffisant pour arrêter
//  maxIter : si positif: nombre maximum d'itérations avec la méthode itérative
//            si négatif ou nul: méthode récursive 
//                  si négatif: méthode récursive complète
//                  si nul    : méthode récursive sauf premier niveau
//  trace : si true on affiche la grille générée à chque itération
function choisirGrille(nb_lignes,nb_cols,mots,trie,score,getDef,tauxMax,maxIter,trace){
    const maxLong = mots.length-1;
    if (nb_lignes>maxLong || nb_cols>maxLong){
        console.log("*** La longueur des mots est limitée à %d, mais la grille est %d x %d",maxLong,nb_lignes,nb_cols);
        return;
    }
    console.time("Création de mots croisés")
    let gBest,initBest,rempliBest,tauxBest=100;
    let iter=0;
    let grilleInit = null;
    let grilleRemplie=null;
    let tauxNoirs = null;
    if (maxIter<=0){
        // version avec backtrack
        gBest = new Grille(nb_lignes,nb_cols,trie,score,getDef);
        gBest.pourtour();
        initBest=gBest.grilleStr(true);
        maxIter<0 ? gBest.completer_rec_full() : gBest.completer_seq();
        tauxBest = Math.trunc(gBest.nb_noirs*100/(gBest.nb_cols*gBest.nb_lignes));
    } else {
        // version itérative
        while (iter<maxIter){
            const g = new Grille(nb_lignes,nb_cols,trie,score,getDef);
            g.pourtour(); 
            grilleInit=g.grilleStr(true);
            g.remplir();
            grilleRemplie=g.grilleStr(true);
            g.completer_iter();
            // g.montrerGrille(true)            
            tauxNoirs = Math.trunc(g.nb_noirs*100/(g.nb_cols*g.nb_lignes))
            if (tauxNoirs<tauxBest){
                gBest = g;
                initBest = grilleInit
                rempliBest = grilleRemplie;
                tauxBest = tauxNoirs;
            }
            if (trace){
                g.montrerGrille(true)
                console.log("Nombre de carreaux noirs: %d %d%%",g.nb_noirs,tauxNoirs);
                console.log("---")
            }
            iter++;
            if (tauxNoirs<tauxMax) break;
        }
    }
    console.timeEnd("Création de mots croisés");
    console.log("*** Après %d itération%s",iter,iter>1?"s":"",(maxIter<=0)?"avec":"sans","backtrack");
    gBest.montrerGrille();
    gBest.montrerDefinitions();
    console.log("\nCases noires: %d %d%%.",gBest.nb_noirs,tauxBest);
    console.log("\n Solution");
    gBest.montrerGrille(true);
    
    fs.writeFileSync(__dirname+"/Sorties/grille.html",grilleToHTML(gBest))
    const grille_obj = grilleToObject(gBest,"Guy Lapalme","jsRealB","© 2025")
    fs.writeFileSync(__dirname+"/Sorties/grille.json",JSON.stringify(grille_obj,null,3));
    fs.writeFileSync(__dirname+"/Sorties/grille.puz", grilleToPuz(grille_obj));
    //  utile pour la rédaction du README....
    // console.log("\naprès initialisation");
    // console.log(initBest)
    // console.log("\naprès remplissage")
    // console.log(rempliBest)
}

// probs:[l][p][c]: probabilité que dans un mot de l lettres, à la position p, on retrouve un c
function prob(l,pos,c){return probs[l][pos-1][c]}

// calculer le score d'un mot: 
// moyenne des probabilités que chaque lettre soit à la position donnée par 
//   la valeur correspondante de pos
function score(mot,pos){
    const l=mot.length;
    let t = 0;
    for (let i=0;i<l;i++){
        // t+=probs[l][pos[i]][mot.charAt(i)]
        t+=prob(l,pos[i],mot.charAt(i))
    }
    return t/l
}


const getDef = forme => [mots[forme.length][forme]|| `Q('${forme}')`];
const ligne = "=".repeat(40)

// lancer la creation de grilles
console.log("Méthode itérative")
choisirGrille(10,8,mots,trie,score,getDef,10,3,false) 
console.log(ligne);

console.log("Méthode récursive partielle")
choisirGrille(10,8,mots,trie,score,getDef,10,0,false) 
console.log(ligne);

console.log("Méthode récursive complète")
// appel qui peut être long à exécuter c'est pourquoi un compteur est affiché
// à tous les 1000 "échecs", ce qui permet de savoir que cela avance...
choisirGrille(10,8,mots,trie,score,getDef,10,-1,false) 
console.log(ligne);

// test unitaire de grille
// const g = new Grille(10,8,trie,score,getDef,10,15,true);
// g.setGrille(
// `  1 2 3 4 5 6 7 8
// 1| R E C A R D E E
// 2| E _ _ _ _ _ _ S
// 3| P _ _ _ _ _ _ S
// 4| E _ _ _ _ _ _ U
// 5| R _ _ _ _ _ _ Y
// 6| C _ _ _ _ _ _ E
// 7| E _ _ _ _ _ _ U
// 8| R _ _ _ _ _ _ S
// 9| E _ _ _ _ _ _ E
// 10| Z O N A S S E S
// `)
// g.remplir()
// g.montrerGrille(true)
