function Etape(nom,x,y,struct,suivant,nextPath){
    Etat.call(this,nom,x,y,struct); // super constructor
    this.suivant=suivant;
    this.nextPath=nextPath;
    this.toString = function(){
        return `Etape(${this.nom},${this.suivant})`
    }
}

Etape.prototype.realiser = function(){
    if (this.struct===undefined)
        return this.nom;
    return this.struct()+"";
}

Etape.prototype.getSuivant = function(){return graphe[this.suivant]}
    
Etape.prototype.lier = function(){
    if (this.nom=="Réfléchissez au prochain problème" || 
        this.nom=="  ATTENDEZ SIX MOIS  " ||
        this.suivant===undefined)return;
    depart=this;
    arrivee=graphe[this.suivant];
    let dx=depart.bbox.x, ax=arrivee.bbox.x;
    let dy=depart.bbox.y, ay=arrivee.bbox.y;
    if (depart.nextPath===undefined){
        if (eq(dy,ay)){ // flèche horizontale
            if (dx<ax) { // d -> a  vers la droite
                this.suivant_path=tracer(depart.bbox,arrivee.bbox,"d")
            } else { // a <- d vers la gauche
                this.suivant_path=tracer(depart.bbox,arrivee.bbox,"g")
            }
        } else if (eq(dx,ax)){ // flèche verticale
            if (dy<ay){ // flèche en bas
                this.suivant_path=tracer(depart.bbox,arrivee.bbox,"b")
            } else {    // fleche en haut
                this.suivant_path=tracer(depart.bbox,arrivee.bbox,"h")
            }
        } else { // faire une flèche par les côtés
            const deltaMinX=Math.abs(dx-minX);
            const deltaMaxX=Math.abs(dx+depart.bbox.width-maxX);
            if (deltaMinX<deltaMaxX){ // vers le minX
                this.suivant_path=tracer(depart.bbox,undefined,"g")
            } else { // vers le maxX
                this.suivant_path=tracer(depart.bbox,undefined,"d")
            }
        }
    } else {
        this.suivant_path=fleche(m(dx+depart.bbox.width/2,dy+depart.bbox.height)+" "+depart.nextPath);
    }    
}

Etape.prototype.selectionner = function(oui,select){
    Etat.prototype.selectionner.call(this,select);
    if (this.suivant_path!==undefined)
        this.suivant_path.classed("selected",select)
                         .attr("marker-end","url(#blue-arrow)");
}

extend(Etat,Etape)
