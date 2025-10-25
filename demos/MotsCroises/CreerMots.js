// modules ES6
import jsRealB from "../../dist/jsRealB.js"
Object.assign(globalThis,jsRealB);
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// modules CommonJS
// const fs = require("fs")
// const jsRealB = require("./jsRealB.js")
// Object.assign(globalThis,jsRealB);
// const __dirname = "."

function ecrireJSON(lang,nom,objet){
    const fileName = __dirname+`/Donnees/${nom}-${lang}.json`
    fs.writeFileSync(fileName,ppJSON(objet))
    console.log(fileName,lang=="fr" ? "écrit" : "written")   
}

// vérification de le présence de l'indicateur niveau en français ou ldv en anglais
// finalement pas utilisé car cela limitait trop le nombre mots (surtout courts)
function aGarder(exps,lang){
    let found = false;
    for (const exp of exps){
        // vérifier si un des lemmes a un indicateur approprié 
        const lemma = exp.lemma
        const lemmaInfos = getLemma(lemma)
        const pos = exp.constType
        if (lang == "fr"){
            // vérifier la présence du champ niveau dans la partie du discours
            // should be return true  but is seems that return within a for ... of only ends current loop
            if (lemmaInfos[pos].niveau !== undefined){found=true; break} 
        }
        // vérifier la présence du champ ldv soit au niveau du lemme ou de la partie du discours
        if (lemmaInfos.ldv !== undefined || lemmaInfos[pos].ldv !== undefined) {found=true; break}
    }
    return found
}

function normalize(forme){
    let norm = forme.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever les accents
    norm = norm.toUpperCase().replace(/[^A-Z]/g,"")  // en majuscules et enlever les caractères non alphabétiques
    return norm;
}

//  Détermination des formes acceptables et de leur "définition" avec une expression jsRealB
function creerMotsExpr(lang, maxLong){
    load(lang);
    const lemmataMap = buildLemmataMap(lang);
    const motsExprs = Array.from({length:maxLong+1}, () => ({}));
    for (const [forme,exps] of lemmataMap){
        let mot = normalize(forme)
        const motL = mot.length
        // vérifier si cette entrée doit être gardée
        if (motL<=1 || motL>maxLong)continue  // filtrer sur la longueur de la forme
        let exp = exps[0];
        // if (!aGarder(exps,lang))continue;
        // prendre l'expression la plus "longue/compliquée"...
        exp = exp.toSource()
        for (let i=0;i<exps.length;i++){
            const expi = exps[i].toSource();
            if (expi.length>exp.length)exp=expi;
        }
        motsExprs[motL][mot] = exp.replaceAll('"',"'") // éviter les \" dans le JSON
    }
    // sauver sur un fichier
    ecrireJSON(lang,"mots",motsExprs)
    console.log(motsExprs.map((dic,i)=> (i+" : ").padStart(7) + Object.keys(dic).length).slice(2).join("\n"))
    console.log("total: "+motsExprs.reduce((acc,dic)=>acc+Object.keys(dic).length,0))
    return motsExprs
}    

//////////////   TRIE
// créer le trie des mots en indiquant "*" pour la fin d'un mot.
function creerTrie(lang,motsExprs){
    // ajouter le nombre de mots débutant par ce préfixe
    // le nombre de mots sous cette racine est indiqué avec "#"
    function addNb(pm){
        let nb=0;
        for (const p in pm){
            if (p == "*") nb++;
            else 
                nb += addNb(pm[p])
        }
        if (nb>1) pm["#"] = nb; // éviter d'indiquer un 1
        return nb;
    }
    
    const trie = {}
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ"){
        trie[c]={}
    }
    
    for (let k=2;k<motsExprs.length;k++){
        for (const mot of Object.keys(motsExprs[k])){
                const caracs = mot.split("")
                let currentTrie = trie[caracs[0]]
                for (const c of caracs.slice(1)){
                    if (currentTrie[c] == undefined)currentTrie[c]={};           
                    currentTrie=currentTrie[c]
                }
                currentTrie["*"]="" 
        }
    }
    addNb(trie)
    
    ecrireJSON(lang,"trie",trie)
    return trie  
}



// regénérer les mots à partir du trie
function trie2mots(trie,prefix,mots){
    for (let c in trie){
        if (c == "#")continue;
        if (c == "*") 
            mots.push(prefix)
        else 
            trie2mots(trie[c],prefix+c,mots)
    }
}

// let mots = []
// trie2mots(trie,"",mots)
// console.log(mots.length, mots.slice(0,100))
const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

// calcul des probabilités d'occurrences de chaque i eme lettre des mots
// probs : une table par longueur de mots [prob]
// prob  : pour chaque position [{char:float}]
function probs(mots){
    const long=mots[0].length;
    let proba = []
    for (let k=0;k<long;k++){
        // calcul des fréquences
        let fs = {}
        for (const lettre of lettres){
            fs[lettre]=0;
        }
        for (const mot of mots){
            const c = mot.charAt(k);
            fs[c]++;
        }
        // normalisation sur le nombre de mots
        const m = mots.length
        for (let c in fs){
            fs[c] /= m;
        }
        proba.push(fs)
    }
    return proba;
}

function creerScores(lang,motsExprs,maxLong){
    let allProbs=[[],[]] // valeurs bidons pour long 0 et 1
    for (let k=2;k<=maxLong;k++){
        allProbs.push(probs(Object.keys(motsExprs[k])))
    }
    ecrireJSON(lang,"probs",allProbs)
}

// function ajouterScores(lang,motsExprs,maxLong){
//     const mots_scores = {} // mots_probs:: [expr,prob]    
//     // valeurs bidon pour faciliter l'indexage
//     for (let k=2;k<=maxLong;k++){
//         const mots = Object.keys(motsExprs).filter(m=>m.length==k)
//         let ps = [[]] // ps::[i]{char}=>number
//         // probabilité pour un mot de K lettres que la ie lettre soit une telle valeur        
//         for (let i=1;i<=k;i++){
//             ps.push(probs(mots,i))
//         }
//         for (const mot of mots){
//             let score = 0;
//             for (let i=0;i<k;i++){
//                 score+=ps[i+1][mot.charAt(i)]
//             }
//             mots_scores[mot]=[motsExprs[mot],score]    
//         }
//         console.log("%d lettres: %d",k,mots.length)
//     }
//     console.log("%d mots",Object.keys(motsExprs).length)
//     ecrireJSON(lang,"mots-scores",mots_scores)
//     return mots_scores;  
// }


let motsExprs, trie, mots_scores;
const maxLong = 10;

function creerInfos(lang,longueur){
    motsExprs = creerMotsExpr(lang,longueur);
    trie = creerTrie(lang,motsExprs);
    // mots_scores = ajouterScores(lang,motsExprs,longueur); 
    creerScores(lang,motsExprs,longueur);
} 

// création des fichiers de données
creerInfos("fr",maxLong)
creerInfos("en",maxLong)
