function Test(nom,x,y,struct,alternativeOUI,alternativeNON,nonOui,g_path,d_path){
    Etat.call(this,nom,x,y,struct);
    this.alternativeOUI=alternativeOUI;
    this.alternativeNON=alternativeNON;
    this.nonOui=nonOui;
    this.g_path=g_path;
    this.d_path=d_path;
}    

Test.prototype.toString = function(){
    return `Test(${this.nom},${this.alternativeOUI},${this.alternativeNON})`
}
    
Test.prototype.realiser = function(OuiNon){
    function alt(etat){
        return etat instanceof Etape 
                   ? etat.getStruct() 
                   : ()=>S(protagoniste.struct(),
                           VP(protagoniste.struct().c("acc"),
                              V("demander").t(t).aux("êt"),
                              SP(C("si"),etat.getStruct()())))
    }
    // donner un temps de conditionnel et de la phrase conséquence étant donné le temps courant
    const cond={p:"p", pc:"pq", i:"pq", f:"p" };
    const csq ={p:"p", pc:"cp", i:"cp", f:"f" };
    if (this.struct===undefined)
        return this.nom+":"+OuiNon;
    let res=[];
    let alternative=this.struct;
    let oui = alt(this.oui());
    let non = alt(this.non());
    res.push(oneOf(S(C("ou"),Adv("bien"),alternative().a(","),
                     C("ou"),Adv("bien"),neg(alternative)),
                   interrog(alternative)));
    // console.log(this.oui(),this.oui().getStruct());
    res.push(S(C("si"),alternative().t(cond[t]).a(","),oui().t(csq[t])));
    res.push(oneOf(()=>S(C("sinon"),non().t(csq[t])),
                   ()=>S(C("si"),neg(alternative).t(cond[t]).a(","),non().t(csq[t]))));
    if (OuiNon){
        res.push(oneOf(S(C("or"),alternative()),
                       S(Adv("heureusement"),alternative()),
                       S(VP(V("supposer").t("ip").pe(1).n("p"),
                            SP(Pro("que"),alternative().t("s"))))));
    } else {
        res.push(oneOf(S("cependant",neg(alternative)),
                       S(Adv("toutefois"),neg(alternative)),
                       S(VP(V("supposer").t("ip").pe(1).n("p"),
                            SP(Pro("que"),neg(alternative).t("s"))))));
    }
    return res.join(" ");
}
    
Test.prototype.oui=function(){return graphe[this.alternativeOUI]}
Test.prototype.non=function(){return graphe[this.alternativeNON]}
    
Test.prototype.lier = function(){
    let etatGauche,etatDroit;
    const depart=this;
    if (this.nonOui){
        etatGauche=this.non();
        etatDroit =this.oui();
    } else {
        etatGauche=this.oui();
        etatDroit =this.non();
    }
    const dep_bbox=depart.bbox;
    const dx=depart.bbox.x;
    const dy=depart.bbox.y;
    let d_bbox={x:dep_bbox.x,y:dep_bbox.y+dep_bbox.height-OUIheight,
                height:OUIheight,width:OUIwidth};
    // lier l'état à gauche
    if (depart.g_path===undefined){
        if (d_bbox.y<etatGauche.bbox.y){ // verticale bas
            this.gauche_path=tracer(d_bbox,etatGauche.bbox,"b")
        } else if (d_bbox.x>etatGauche.bbox.x){ // ligne horizontale gauche
            this.gauche_path=tracer(d_bbox,etatGauche.bbox,"g")
        } else {
            this.gauche_path=tracer(d_bbox,undefined,"g")
        }
    } else {
        this.gauche_path=fleche(m(d_bbox.x,d_bbox.y+d_bbox.height/2)+" "+depart.g_path)
    }
    // etat à droite
    d_bbox={x:dep_bbox.x+dep_bbox.width-NONwidth,y:dep_bbox.y+dep_bbox.height-NONheight,
            height:NONheight,width:NONwidth};
    if (depart.d_path===undefined){ 
        if (d_bbox.y<etatDroit.bbox.y){ // ligne verticale bas
            this.droite_path=tracer(d_bbox,etatDroit.bbox,"b")
        } else if (d_bbox.x<etatDroit.bbox.x){ // ligne horizontale droite
            this.droite_path=tracer(d_bbox,etatDroit.bbox,"d")
        } else {
            this.droite_path=tracer(d_bbox,undefined,"d")
        }
    } else {
        this.droite_path=fleche(m(d_bbox.x+d_bbox.width,d_bbox.y+d_bbox.height/2)+" "+depart.d_path);
    }
}
    
Test.prototype.selectionner = function(oui,select){
    Etat.prototype.selectionner.call(this,select);
    let dBtn,gBtn,droite_path,gauche_path;
    if (this.nonOui){
        dBtn=this.gBtn; droite_path=this.gauche_path;
        gBtn=this.dBtn; gauche_path=this.droite_path;
    } else {
        dBtn=this.dBtn; droite_path=this.droite_path;
        gBtn=this.gBtn; gauche_path=this.gauche_path;
    }
    if (oui){
        gBtn.classed("selected",select);
        gauche_path.classed("selected",select)
                   .attr("marker-end","url(#blue-arrow)");
    } else {
        dBtn.classed("selected",select);
        droite_path.classed("selected",select)
                   .attr("marker-end","url(#blue-arrow)");
    }
}

extend(Etat,Test)
