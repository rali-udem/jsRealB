function Etat(nom,x,y,struct){
    this.nom=nom;
    this.struct=struct;
    this.x=x;
    this.y=y;
    graphe[nom]=this;
}    
    
Etat.prototype.log=function(){
    console.log(this.realiser())
}

Etat.prototype.estDans = function(chemin){
    const re=new RegExp("\\b"+etat+"\\b");
    return re.test(chemin);
}
    
Etat.prototype.getStruct = function(){
    return this.struct!==undefined ? this.struct : ()=>Q(nom);
}

Etat.prototype.estEnCapitales = function(){
    const infoMr=this.nom.replace("Mr","");
    return infoMr.toUpperCase()==infoMr;
}
    
Etat.prototype.afficher = function(cx,cy){
    var g=svg.append("g").attr("transform",`translate(${cx},${cy})`);
    g.etat=this;
    let text=g.append("text").attr("stroke","none").attr("fill","black");
    const ix=this.nom.indexOf("/");
    const info=this.nom;
    let bbox,tspan,dy;
    if (ix<0){
        tspan=text.append("tspan").attr("pointer-events","none").text(info);
        bbox=text.node().getBBox();
        dy=bbox.height;
    } else {
        text.append("tspan").attr("pointer-events","none").text(info.substring(0,ix));
        bbox=text.node().getBBox();
        dy=bbox.height;
        tspan=text.append("tspan").attr("dy",dy).attr("x",0).text(info.substring(ix+1));
        bbox=text.node().getBBox();
    }
    if (this instanceof Test){
        tspan.attr("style","text-decoration: underline;"); // souligner la dernière ligne
        this.gBtn = text.append("tspan").attr("dy",dy)
            .attr("x",0)
            .text(this.nonOui?"NON":"OUI")
            .datum(this);
        this.dBtn = text.append("tspan").attr("dy",0)
            .attr("x",bbox.width-(this.nonOui?OUIwidth:NONwidth))
            .text(this.nonOui?"OUI":"NON")
            .datum(this);
        bbox=text.node().getBBox();
    }
    const padding = 3;
    this.bgdRect = g.insert("rect","text") // insert rectangle before text
            .attr("x", bbox.x - padding)
            .attr("y", bbox.y - padding)
            .attr("rx",3).attr("ry",3)
            .attr("width", bbox.width + (padding*2))
            .attr("height", bbox.height + (padding*2))
            .attr("fill","none")
            .classed(this instanceof Test ? "test" : "etape",true);
            // .attr("pointer-events","none");
    if (this.estEnCapitales()){ // entourer si l'info est tout en majuscule
        this.bgdRect.attr("stroke","black")
    }
    bbox.x+=cx;
    bbox.y+=cy;
    this.bbox=bbox;
    this.text=text;
}
    
Etat.prototype.selectionner = function(select,className){
    if (className===undefined)className="selected";
    d3.select(this.text.node().firstChild).classed(className,select);
    if (this.nom.indexOf("/")>=0){
        d3.select(this.text.node().firstChild.nextElementSibling).classed(className,select);
    }
}

// https://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
function extend(base, sub) {
    // Avoid instantiating the base class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite 
    // the existing prototype, but still maintain the inheritance chain
    const origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (let key in origProto) {
        sub.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    sub.prototype.constructor = sub;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like this instead
    Object.defineProperty(sub.prototype, 'constructor', {
        enumerable: false,
        value: sub
    });
}
