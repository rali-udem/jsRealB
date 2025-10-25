// modules ES6
export {Grille,pick,prefixFreq}

// modules CommonJS
// module.exports = {Grille:Grille,pick:pick,prefixFreq:prefixFreq}

const NOIR ="\u2588"; // full block \u2588
const LIBRE = "_";
const COL = 2 ; // largeur de chaque colonne lors de l'affichage dans montrerGrille()

// taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
// recherche d'un pattern::[char] dans un trie, à partir d'un préfixe
// lorsqu'on arrive à un pattern vide et qu'il y a un terminateur de mot 
// on l'ajoute à la liste mots.
//    appel: let mots=[]; search(trie,"BONJOUR".split(""),"",mots)
function search(trie,pattern,prefix,mots){
    if (trie == undefined) return;
    if (pattern.length == 0 && trie["*"]=="")mots.push(prefix);
    const c = pattern[0]
    if (c == LIBRE){
        for (let c1 in trie)
            if (c1 != "#" && c1 != "*")
                search(trie[c1],pattern.slice(1),prefix+c1,mots)
    } else if (c == "[") {
        const idx = pattern.indexOf("]");
        for (let k=1;k<idx;k++){
            search(trie[pattern[k]],pattern.slice(idx+1),prefix+pattern[k],mots)
        }
    } else
        search(trie[c],pattern.slice(1),prefix+c,mots)     
}


function prefixFreq(trie,prefix){
    function _pf(trie,pref){
        if (trie == undefined) return 0;
        if (pref.length==0)return trie["#"] || 1; // 1 par défaut
        return _pf(trie[pref[0]],pref.slice(1))
    }
    if (typeof prefix=="string")prefix=prefix.split("")
    return _pf(trie,prefix)
}

function prefixFollow(trie,prefix){
    function _pf(trie,pref){
        if (trie == undefined) return [];
        if (pref.length==0) 
            return Object.keys(trie).filter(e => e!="#" && e!="*" && trie[e]["#"]!==undefined);
        return _pf(trie[pref[0]],pref.slice(1))
    }
    if (typeof prefix=="string")prefix=prefix.split("");
    return _pf(trie,prefix)
}


// retourner un élément choisi aléatoirement dans une liste
function pick(elems){
    return elems[Math.floor(Math.random()*elems.length)]
}

class Grille {
    constructor (nb_lignes,nb_cols,trie,scoreF,getDef){
        this.nb_lignes = nb_lignes;
        this.nb_cols = nb_cols;
        this.nb_lignes1 = nb_lignes+1;
        this.nb_cols1 = nb_cols+1;

        this.trie = trie;
        this.scoreF = scoreF;
        this.getDef = getDef;

        this.initGrille();
        // compteur du nombre d'échecs lors de l'appel récursif complet
        this.nb_echecs = 0; 
    }
    
    initGrille(){
        // ajoute une bordure de NOIR pour faciliter les tests par la suite
        this.nb_libres = this.nb_lignes*this.nb_cols; 
        this.nb_noirs = 0
        this.mots_places = new Set()       
        this.grille = [Array(this.nb_cols+2).fill(NOIR)];
        for (let h=0;h<this.nb_lignes;h++){
            const ligne = Array(this.nb_cols).fill(LIBRE);
            ligne.unshift(NOIR);
            ligne.push(NOIR)
            this.grille.push(ligne)
        }
        this.grille.push(Array(this.nb_cols+2).fill(NOIR));
    }
    
    // retourner une copie (deep-copy) de l'état de variables pour une grille 
    saveState(){
       return {nb_libres:this.nb_libres,
                nb_noirs:this.nb_noirs, 
                // prendre des copies 
                mots_places:new Set(this.mots_places.values()),
                grille:this.grille.map(row=>[...row])}
    }
    
    // remettre une grille à un état sauvé
    resetState({nb_libres,nb_noirs,mots_places,grille}){
        this.nb_libres=nb_libres;
        this.nb_noirs=nb_noirs;
        // remettre une copie
        this.mots_places=new Set(mots_places.values());  
        this.grille = grille.map(row=>[...row])
    }
    
    //////// accès aux cases de la grille (avec vérification des accès)
    // lire une case
    get(h,v){
        if (h < 0 || h > this.nb_lignes1 || v < 0 || v > this.nb_cols1) 
            console.log("get: mauvaise position",h,v)
        return this.grille[h][v]
    }
    // changer une case
    set(h,v,val){
        if (h < 0 || h > this.nb_lignes1 || v < 0 || v > this.nb_cols1)
            console.log("set: mauvaise position",h,v,val)
        if (this.isLettre(h,v) && val !=LIBRE && this.grille[h][v]!=val)
            console.log("set:superposition de lettres: %s sur %s",val,this.grille[h][v])
        if(this.grille[h][v]==val)return;
        if (this.isLibre(h,v)) this.nb_libres--;
        this.grille[h][v]=val;
        if (val == NOIR)this.nb_noirs++;
        else if (val == LIBRE)this.nb_libres++;
    }
    
    //////// informations à propos des cases de la grille
    isLettre(h,v){
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(this.get(h,v))
    }
    
    isLibre(h,v){
        return this.get(h,v)==LIBRE
    }

    isNoir(h,v){
        return this.get(h,v)==NOIR
    }
    
    noircir(h,v){
        this.set(h,v,NOIR)   
    }
    
    ////////////  
    //   Affichage de la grille 
    grilleStr(solution){  // retourner une string correspondant à l'affichage de la grille
        function showNum(i){
            return i.toString().padStart(COL)
        }
        function showCar(c){
            return  ((c==NOIR || solution) ? c : "_").padStart(COL);
        }
        let res = []
        const entete = Array.from(Array(this.nb_cols+1).keys()).slice(1).map(showNum).join("")
        res.push(" ".repeat(COL+1)+entete);
        // affichage des données brutes
        // console.log(defs.map(v => `${v.sens}:${v.h},${v.v}:${v.mot}::${v.expr}`).join("\n"))
        for (let h=1;h<=this.nb_lignes;h++){
            res.push(showNum(h)+"|"+this.grille[h].slice(1,this.nb_cols1).map(showCar).join(""))
        }
        return res.join("\n")        
    }
    
    montrerGrille(solution){
        console.log(this.grilleStr(solution))
    }
                   
    // liste des cases libres
    caseslibres(){
        let libres=[];
        for (let h=1;h<=this.nb_lignes;h++)
            for (let v=1;v<=this.nb_cols;v++)
                if (this.isLibre(h,v))libres.push([h,v])
        return libres;
    }
    
    // noircir une case libre 
    noircirUne(){
        // noircir une case au hasard
        const libres = this.caseslibres();
        if (libres.length != this.nb_libres){
            console.log("*** problème de compte de cases libres",libres.length,this.nb_libres)
        }
        if (libres.length > 0) {
            const [h,v] = pick(libres);
            // console.log("NOIR à %d,%d",h,v)
            this.noircir(h,v);
            return true;
        }
        return false;        
    }
    
    // pour la mise au point
    // remplir une grille avec des valeurs tirées de grilleStr
    setGrille(lignes){
        this.nb_libres = this.nb_lignes*this.nb_cols; 
        this.nb_noirs = 0
        let h=1;
        for (let ligne of lignes.split("\n")){
            ligne = ligne.replaceAll(/[^_█A-Z]/g,"");
            if (ligne.length>0){
                for (let v=1;v<=this.nb_cols;v++)
                    this.set(h,v,ligne[v-1])
                h++;
            }
        }
    }
    
    
    // qui considère toutes les cases libres et détermine la suite la plus longue
    // motsPossibles() pourra trouver des mots plus courts
    candidats(){
        let candidats=[];
        const libres = this.caseslibres();
        for (const [h,v] of libres){
            for (const [dh,dv,sens] of [[0,1,"H"],[1,0,"V"]]){
                // prendre les lettres avant la case libre
                let k=1
                let long=1;
                while (this.isLettre(h-k*dh,v-k*dv)){
                    k++;
                    long++;
                }
                // prendre les lettres ou les cases libres suivant la case libre
                let nb=1;
                let l=1;
                while(!this.isNoir(h+l*dh,v+l*dv)){
                    if (this.isLibre(h+l*dh,v+l*dv))nb++;
                    l++;
                    long++;
                }
                if (long>1)
                    candidats.push({h:h-(k-1)*dh,v:v-(k-1)*dv,sens:sens,long:long,nb:nb})
            }
        }
        return candidats;
    }
    
    
    // récuperer un mot début en h,v
    getMot(h,v,sens){
        const [dh,dv] = sens == "H" ? [0,1] : [1,0];
        let mot=[]
        let k=0;
        while (true){
            let h1 = h+k*dh, v1=v+k*dv;
            if (this.isNoir(h1,v1))break;
            mot+=this.get(h1,v1);
            k++;
        }
        return mot;
    }
    
    ////////////////
    //      Ajout  d'un mot à la grille 
    setMot(h,v,sens,mot){
        // console.log(`setMot(${h},${v},${sens},${mot})`);
        const longMot = mot.length;
        // placer le mot
        const [dh,dv] = sens == "H" ? [0,1] : [1,0];
        for (let k=0;k<longMot;k++){
            const h1=h+k*dh, v1=v+k*dv;
            if (this.isLibre(h1,v1)){
                this.set(h1,v1,mot.charAt(k));
            }
        }
        this.mots_places.add(mot);
        // this.montrerGrille(true);
        // ajouter les cases noires pour délimiter le mot si nécessaire
        if (sens=="V"){
            // bloquer les lignes en haut et en bas 
            if (this.isLibre(h-1,v)) {
                this.noircir(h-1,v);
            }
            const hl = h+longMot;
            if (this.isLibre(hl,v)){
                this.noircir(hl,v);
            }
        } else { //sens == "H"
            // bloquer les colonnes à gauche et à droite 
            if (this.isLibre(h,v-1)){
                this.noircir(h,v-1);
            }
            const vl = v+longMot;
            if (this.isLibre(h,vl)){
                this.noircir(h,vl);
            }
        }
    }
        
    // parcourir la grille et afficher les définitions
    sortirDefinitions(){
        let chevilles=[], horiz=[], vert=[];
        for (let h=1;h<=this.nb_lignes;h++){
            let defs = []
            let vDeb=1;
            while(vDeb<this.nb_cols){
                if (!this.isNoir(h,vDeb)){
                    let mot=this.get(h,vDeb);
                    let v=vDeb+1;
                    while (!this.isNoir(h,v)){
                        mot+=this.get(h,v);                        
                        v++
                    }
                    const long=v-vDeb;
                    if (long>1){
                        const def = this.getDef(mot);
                        if (/Q\('[A-Z]+'\)/.test(def))chevilles.push(mot);
                        defs.push(def);
                    }
                    vDeb=v+1;
                } else {
                    vDeb++;
                }
            }
            if(defs.length>0){
                horiz.push([h,defs])
            }
        }
        for (let v=1;v<=this.nb_cols;v++){
            let defs = []
            let hDeb=1;
            while(hDeb<this.nb_lignes){
                if (!this.isNoir(hDeb,v)){
                    let mot = this.get(hDeb,v);
                    let h=hDeb+1;
                    while (!this.isNoir(h,v)){
                        mot+=this.get(h,v)
                        h++
                    }
                    const long = h-hDeb;
                    if (long>1){
                        const def = this.getDef(mot)[0];
                        if (/Q\('[A-Z]+'\)/.test(def))chevilles.push(mot);
                        defs.push(def)
                    }
                    hDeb=h+1;
                } else {
                    hDeb++;
                }
            }
            if (defs.length>0)vert.push([v,defs])
        }
        return {horiz:horiz,vert:vert,chevilles:chevilles}
     }
    
    // afficher les définitions sur la console
    montrerDefinitions(){
        const {horiz:horiz,vert:vert,chevilles:chevilles} = this.sortirDefinitions();
        console.log("\nHorizontalement");
        console.log(horiz.map(([h,defs])=>h+" : "+defs.join(" - ")).join("\n"))
        console.log("\nVerticalement");
        console.log(vert.map(([v,defs])=>v+" : "+defs.join(" - ")).join("\n"))
        if (chevilles.length>0)
            console.log("\nChevilles: "+chevilles.join(", "))
    }
    
    // chercher tous les mots selon un pattern (liste ou chaîne)
    trouverMots(pattern){
        // if (typeof pattern != "string") pattern=pattern.join("")
        // return generateWith(pattern)
        let mots = [];
        if (typeof pattern == "string") pattern = pattern.split("")
        search(this.trie,pattern,"",mots);
        // éliminer les mots "longs" déjà dans la grille
        mots=mots.filter(m => m.length < 4 || !this.mots_places.has(m))
        return mots;
    }
    
    //  Recherche de mots avec vérification des croisements
    // retourne une liste à deux éléments
    //   - la liste des mots horizontaux possibles en mettant c en h,v (c peut être LIBRE)
    //   - nombre de caractères avant la case h,v 
    //  HACK: comme on a ajouté des NOIR autour de la grille, on évite de tester les frontières  
    motsDir(h,v,sens,c){
        let [dh,dv] = sens=="H" ? [0,1] : [1,0]
        let before=[];
        let h1=h-dh,v1=v-dv;
        while (!this.isNoir(h1,v1)){
            before.unshift(this.get(h1,v1));
            h1-=dh;v1-=dv;            
        }
        let after = [];
        h1=h+dh; v1=v+dv;
        while(this.isLettre(h1,v1)){
            after.push(this.get(h1,v1));
            h1+=dh;v1+=dv;    
        }
        const beforeL = before.length;
        const motPat = [...before,c,...after];
        // éviter d'appeler trouverMots qui peut retourner [], si un nouveau mot est créé
        // dans les deux directions...
        if (c != LIBRE) return [[motPat.join("")],beforeL]
        return [this.trouverMots(motPat),beforeL];      
    }
    
    // retourne les lettres qui précèdent h,v selon sens
    // ajoute lettre à la fin si présente
    getPref(h,v,sens,lettre){
        const [dh,dv] = sens == "H" ? [0,1] : [1,0];
        let pref=[];
        if (lettre !==undefined){
            pref.push(lettre)
        }
        h-=dh;v-=dv;
        while(this.isLettre(h,v)){
            pref.push(this.get(h,v))
            h-=dh;v-=dv;
        }
        return pref.reverse()
    }
    
    // retourne le mot et la valeur des nombres de préfixes correspondant à chaque lette
    ajoutePrefl(mot,h,v,sens){
        const [dh,dv,autreSens] = sens == "H" ? [0,1,"V"] : [1,0,"H"];
        let s=0;
        for (let k=0;k<mot.length;k++){
            const h1 = h+k*dh, v1=v+k*dv;
            if (this.isLibre(h1,v1)){
                const pref = this.getPref(h1,v1,autreSens,mot.charAt(k));
                // if (pref.length>1)
                    s+=prefixFreq(this.trie,pref)
            }
        }
        return [mot,s]        
    }
    
    // vérifie si la case en h,v a un croisement horizontal
    croiseHoriz(h,v){
        if (v==1) return this.isLettre(h,v+1);
        if (v==this.nb_cols) return this.isLettre(h,v-1)
        return (this.isLettre(h,v+1) || this.isLettre(h,v-1))
    }
    
    // vérifie si la case en h,v a un croisement vertical
    croiseVert(h,v){
        if (h==1) return this.isLettre(h+1,v)
        if (h==this.nb_lignes)return this.isLettre(h-1,v)
        return (this.isLettre(h+1,v) || this.isLettre(h-1,v))
    }
    
    // Retourne une liste de mots plaçables en h,v selon le sens en fonction des lettres
    //  déjà présentes sur la grille
    // si check est true alors on vérifie les croisements 
    // avec les lignes ou colonnes précédentes en s'assurant que cela forme des prèfixes
    // réalisables
    // si fix est true, on ne retourne que des mots de longueur long
    motsPossibles(h,v,sens,long,check,fix){
        let patterns = [];
        let pattern = "";
        let [dh,dv,autreSens] = sens=="H" ? [0,1,"V"] : [1,0,"H"];
        for (let k=0;k<long;){
            if (!check){
                const l = this.get(h+dh*k,v+dv*k);
                if (l == NOIR) break;
                pattern+=l;
                k++;
            } else { // vérification des croisements
                let h1=h+dh*k,v1=v+dv*k;
                if (this.isLibre(h1,v1)){
                    const croiseB = sens == "H" ? this.croiseVert(h1,v1) : this.croiseHoriz(h1,v1);
                    if (!croiseB){
                        pattern+=LIBRE;
                        k++;
                    } else {
                        // en tenant compte des mots complets plaçables
                        const [mots,beforeL] = this.motsDir(h1,v1,autreSens,LIBRE)
                        if (mots.length==0){
                            break;
                        } else {
                            const possSet = new Set(mots.map(m=>m.charAt(beforeL))).values()
                            pattern += possSet.size==1 ? possSet.next() 
                                                       : "["+Array.from(possSet).sort().join("")+"]";
                        }
                        // en ne tenant compte que des préfixes... mais ça crée trop de chevilles
                        // const follow = prefixFollow(this.trie,this.getPref(h1,v1,autreSens))
                        // if (follow.length==0){
                        //     break;
                        // } else {
                        //     pattern += follow.length==1 ? follow[0] : `[${follow.sort().join("")}]`
                        // }
                        k++;
                        if (k<long && this.isNoir(h+dh*k,v+dv*k)){
                            patterns.push(pattern)
                            break;
                        }
                    }
                } else if (this.isLettre(h1,v1)){
                    pattern+=this.get(h1,v1)
                    k++;
                } else { // noir
                    break;
                }
            }
            patterns.push(pattern)
        }
        if (patterns.length==0) return []
        const lastPattern=patterns.at(-1)
        if (fix) return this.trouverMots(lastPattern)
        let possibles = [];
        for (let k=patterns.length-1;k>=0;k--){
            const mots = this.trouverMots(patterns[k])
            // calculer le nombre de lettres matchées par le pattern
            let nb = patterns[k].match(/\[[A-Z]+\]|[_A-Z]/g).length-1
            if(mots.length>0){
                possibles.push(mots);
                break; // ne considérer que les mots les plus longs
            }
            // sauter le prochain s'il y a une lettre à la fin du présent pattern
            // pour laisser de la place pour le noir                       
            while (this.isLettre(h+nb*dh,v+nb*dv)){k--;nb--;} 
        }
        return possibles;
    }
        
    //////// Ajouts dans la grille
    
    pourtourMot(h,v,sens,long,posScore){
        let possibles = this.motsPossibles(h,v,sens,long,false,true);
        const pos = Array.from({length:long},_=>posScore)
        const possibles_scores = possibles.map(m=>[m,this.scoreF(m,pos)])
        possibles_scores.sort((m1,m2)=>m2[1]-m1[1])
        const mot = pick(possibles_scores.slice(0,20))[0]
        this.setMot(h,v,sens,mot)
    }
    
    // rempir le pourtour    
    pourtour(){
        // potence avec des mots au hasard
        this.pourtourMot(1,1,"H",this.nb_cols,1,this)
        this.pourtourMot(1,1,"V",this.nb_lignes,1,this)
        // dernières ligne et colonne avec des mots au hasard
        this.pourtourMot(this.nb_lignes,1,"H",this.nb_cols,this.nb_cols,this)
        this.pourtourMot(1,this.nb_cols,"V",this.nb_lignes,this.nb_lignes,this) 
    }
    
    // spécification que de la potence
    potence(horizontal, vertical){
        this.setMot(1,1,"H",horizontal)
        this.setMot(1,1,"V",vertical)
    }
 
    /////////  Complétion de la grille     
    remplir(){
        let n = 0;
        let h=2,v=2;
        let sens="H";
        while(h<this.nb_lignes && v<this.nb_cols){
            // trouver le début de la ligne/colonne en cherchant le premier noir depuis la fin
            let hDeb=h,vDeb=v,long;
            if (sens == "H"){
                vDeb=this.nb_cols;
                while (!this.isNoir(h,vDeb))vDeb--;
                long = this.nb_cols-vDeb;
                vDeb++;
            } else {
                hDeb=this.nb_lignes;
                while(!this.isNoir(hDeb,v))hDeb--;
                long = this.nb_lignes-hDeb;
                hDeb++;
            }        
            let possibles = this.motsPossibles(hDeb,vDeb,sens,long,true,false);
            // console.log(hDeb,vDeb,sens,":",possibles.map(p=>p.length+"").join());
            // this.montrerGrille(true);
            if (possibles.length>0){
                // trier en fonction de la fréquence des préfixes
                let possibles_freq = possibles[0].map(m=>this.ajoutePrefl(m,hDeb,vDeb,sens))
                possibles_freq.sort((m1,m2)=>m2[1]-m1[1]);
                let mot = possibles_freq[0][0]
                this.setMot(hDeb,vDeb,sens,mot);
            } else {
                // console.log("pas de mot possible")
            }
            if (sens=="H"){h++; sens="V"}
            else {v++; sens="H"}
        }
    }
    
    //////// Méthode itérative de remplissage
    completer_iter(){
        let candidats = this.candidats();
        while(candidats.length>0){
            // mélanger horizontaux et verticaux et ensuite trier pour considérer les éléments
            // avec le plus de cases libres, sur la longueur en cas d'égalité
            shuffleArray(candidats).sort((c1,c2)=>c2.nb!=c1.nb?(c2.nb-c1.nb):(c2.long-c1.long))
            let trouve = false;
            while (candidats.length>0 && !trouve){
                let {h:h,v:v,sens:sens,long:long} = candidats.shift();
                // console.log([sens,h,v,long])
                let possibles = this.motsPossibles(h,v,sens,long,true,false);
                if (possibles.length>0){
                    // trier en fonction de la frequence des préfixes
                    const possibles_freq = possibles[0].map(m=>this.ajoutePrefl(m,h,v,sens))
                    possibles_freq.sort((m1,m2)=>m2[1]-m1[1])
                    this.setMot(h,v,sens,possibles_freq[0][0])
                    trouve = true;
                }
            }
            if (!trouve && !this.noircirUne())break;
            candidats = this.candidats()
        }
    }
    
    //////// Méthode récursive de remplissage
    
    //  Fonctions auxiliaires
    //    retourner tous les mots possibles pour une liste de places candidates
    getAllPossibles(candidats){
        function showPossible({h,v,sens,mot,freq_pref}){
            return `${h},${v},${sens},${mot},${freq_pref}`
        }
        let allPossibles = [];
        while (candidats.length>0){
            const {h:h,v:v,sens:sens,long:long} = candidats.shift();
            let possibles = this.motsPossibles(h,v,sens,long,true,false);
            if (possibles.length>0){
                const possibles_freq = possibles[0].map(m=>this.ajoutePrefl(m,h,v,sens))
                // trier en fonction de la fréquence des préfixes
                // possibles_freq.sort((m1,m2)=>m2[1]-m1[1]);
                allPossibles.push(...possibles_freq.map(
                    mf => ({h:h,v:v,sens:sens,mot:mf[0], freq_pref:mf[1]}))
                )
            }
        }       
        // allPossibles.sort((a,b)=>b.mot.length-a.mot.length) // trier sur la longueur des mots
        allPossibles.sort((a,b)=>b.freq_pref-a.freq_pref) // trier sur les valeurs des préfixes
        // console.log("possibilités:%d\n%s",allPossibles.length,allPossibles.slice(0,5).map(showPossible).join("\n"))
        return allPossibles;
    }
    
    // Exploration du tableau des formesPossibles jusqu'à la position "end" (non-inclus) 
    // cette fonction termine avec une Exception soit lors d'un blocage ou de la complétion de la grille 
    completer_rec(formesPossibles,end){
        if (formesPossibles.length==0){
            if ((++this.nb_echecs % 1000) == 0) console.log(this.nb_echecs);
            throw new Error("bloquée")
        }
        let saved= this.saveState();
        for (const {h,v,sens,mot} of formesPossibles){
            this.setMot(h,v,sens,mot);
            if (this.nb_libres<=1){
                if (this.nb_libres==1) this.noircirUne();
                throw new Error("complétée")
            }
            try {
                // appel récursif
                this.completer_rec(this.getAllPossibles(this.candidats()).slice(0,end),end);
            } catch (e){
                if (e.message=="complétée") throw e;
            }
            this.resetState(saved);
        }
        if ((++this.nb_echecs % 1000) == 0) console.log(this.nb_echecs);
        throw new Error("bloquée")
    }
    
    // Lancement de la méthode récursive avec exploration de toutes les possibilités 
    completer_rec_full(){
        this.nb_echecs = 0;
        try {
            this.completer_rec(this.getAllPossibles(this.candidats()),undefined)
        } catch (e){
            console.log("grille",e.message)
        }
        console.log("après %d échecs",this.nb_echecs);
        return this;
    }
    
    // Lancement de la méthode récursive avec retour au premier niveau lors d'un blocage du remplissage
    //   
    completer_seq(){
        const checkLength = p=>(p.sens=="H" && p.mot.length==this.nb_cols) || (p.sens=="V" && p.mot.length==this.nb_lignes)
        let formesPossibles = this.getAllPossibles(this.candidats()).filter(checkLength);
        let nb=1;
        const saved = this.saveState();
        for (const {h,v,sens,mot,freq_pref} of formesPossibles){
            // console.log("fill3",nb,h,v,sens,mot)
            this.setMot(h,v,sens,mot);
            // this.montrerGrille(true);
            try {
                // explorer que quelques possibilités pour les niveaux intermédiaires
                this.completer_rec(this.getAllPossibles(this.candidats()).slice(0,3),1)
            } catch (e) {
                // console.log(e.message,nb)
                // this.montrerGrille(true);
                if (e.message=="complétée")break;
            }
            this.resetState(saved);
            nb++;
            if (nb%10==0)console.log("possibilités %d",nb)
        }
        return nb;       
    }
}
