'use strict';

// Recherche des définitions en français dans la base sqLite de MCWikti

const sqlite = require("sqlite-sync")
sqlite.connect("./Donnees/mots-20250124.sqlite")
// console.log(sqlite.run(`SELECT * FROM "main"."formes" WHERE "forme" = 'BONJOUR';`))

///  accès aux bases de données
function shortenDef(def){
    const m = /[\.;:]/.exec(def)
    if (m== null)return def;
    return def.substring(0,m.index)+".";
}

function getDefs(forme){
    let allDefs = [];
    const rows = sqlite.run(`SELECT * FROM "main"."formes" WHERE "forme" = '${forme}';`);
    for (const row of rows){       
        const ds = JSON.parse(row.definition);
        allDefs.push(...ds.definitions.map(d=>d.defs).flat())  
    }     
    return allDefs.map(shortenDef)
}

   /////////  Traitement des définitions françaises
function getDef(forme){
    const defs = getDefs(forme);
    if (defs.length==0) return null;
    // trouver la définition la plus courte
    let minLength=1000;
    let minDef;
    defs.forEach(d=>{  // ignorer ces définitions inintéressantes
        if (!/Nom de famille|Prénom|Variante (ortho )?de/.test(d) &&
            !(new RegExp(forme,"i").test(d))){ //ignorer les définitions contenant la forme
            const l = d.length;
            if (l>2 && l<minLength){
                minDef=d;
                minLength=l;
            }
        }
    });
    let m = /Pluriel de (\p{Letter}+)/u.exec(minDef); // éviter des définitions de la forme 'Pluriel de ..'
    if (m != null){
        const newForme = m[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever les accdents
        const newDef = getDef(newForme.toUpperCase()); // chercher la définition du mot au singulier
        if (newDef !== null) minDef=newDef + (" (Plur.)")
    }
    return minDef || defs[0];
}


// console.log("**",getDefs("BONJOUR").join("\n"))

// const jsRealB = require("./jsRealB.js")
// Object.assign(globalThis,jsRealB);



//    recherche dans l'automate
//    finalement pas utilisée car on utilise un trie par longueur

// const automateJSON = require("./mots-20250124-automate.json")
// const start = automateJSON.start
// const automate = automateJSON.automate

//  retourne le prochain numéro d'état à partir de l'état numéroté iState pour le caractère char
//  retourne null si l'état n'existe pas
function next(char,iState){
    // console.log("next("+char+","+iState+")")
    var etat=automate[iState]
    if (etat.length==1){
        return etat[0][0]==char?etat[0][1]:null;
    }
    // chercher dans la liste d'états triés en ordre croissant
    for (let i=0;i<etat.length;i++){
        const ce = etat[i][0]
        if (ce==char)return etat[i][1]
        if (ce>char) break;
    }
    return null
}

//  chercher dans l'automate
function generateWith(word,iState=start){
    // console.log("generateWith(%o,%o)",word,iState);
    var out=[];
    if (iState == null) return out;
    if (word.length==0){
        var s1=next("#",iState);
        if (s1!=null && s1==-1)
            out=[""]
    } else {
        var first=word.charAt(0);
        var rest=word.substring(1);
        if (first==".") {// matcher tous les cas dans l'état courant
            var etat=automate[iState]
            // console.log("etat="+etat);
            for (var i = 0; i < etat.length; i++) {
                var e=etat[i];
                if (e[1]>=0){
                    var g=generateWith(rest,e[1]);
                    for (var j = 0; j < g.length; j++) {
                        out.push(e[0]+g[j]);
                    }
                }
            }
        // } else if (first=="*"){  // non utilisé pour la génération de mots croisés
        //     out=generateWith(rest,iState)// sauter le premier caractère
        //     var etat=automate[iState];
        //     for (var i=0;i<etat.length;i++){
        //         var e=etat[i];
        //         if (e[1]>=0){
        //             var g=generateWith(word,e[1]);
        //             for (var j=0;j<g.length;j++){
        //                 out.push(e[0]+g[j])
        //             }
        //         }
        //     }
        } else if (first=="["){
            var i=0;
            var n=rest.length;
            while(i<n && rest.charAt(i)!="]"){i++}
            for (var j=0;j<i;j++){
                var c=rest.charAt(j);
                var etat=next(c,iState);
                if (etat>=0){
                    var g=generateWith(rest.substring(i+1),etat);
                    for (let k=0;k<g.length;k++){
                        out.push(c+g[k])
                    }
                }
            }
        } else {
            var iState=next(first,iState);
            if (iState != null && iState>=0){
                var g=generateWith(rest,iState);
                for (var i = 0; i < g.length; i++) {
                    out.push(first+g[i])
                }
            } else
                out=[]
        }
    }
    // console.log("generateWith(%o,%o)=>%o",word,iState,out);
    return out;
}

module.exports = {
    generateWith:generateWith,
    getDef:getDef
}
