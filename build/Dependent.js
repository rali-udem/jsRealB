/**
    jsRealB 4.0
    Guy Lapalme, lapalme@iro.umontreal.ca, mars 2022
 */
"use strict";

////// Constructor for a Dependent (a subclass of Constituent)

// Dependent (non-terminal)
function Dependent(params,deprel,lang){ // lang parameter used calls in IO-json.js
    Constituent.call(this,deprel); // super constructor
    this.lang = lang || currentLanguage;
    this.dependents=[];
    this.terminal=Q("*terminal*");    // dummy terminal so that error messages can be issued
    if (params.length==0){
        this.warn("Dependent without params");
        return null;
    }
    if (params[0] instanceof Terminal){
        this.terminal=params.shift()
    } else {
        this.warn("Dependent needs Terminal",typeof params[0]);
    }
    this.terminal.parentConst=this;
    this.peng=this.terminal.peng;
    if (this.terminal.isA("V"))this.taux=this.terminal.taux;
    params=params.filter(e=>e!=undefined && e!=null) // remove "null" dependents
    // list of dependents to create the source of the parameters at the time of the call
    // this can be different from the dependent lists because of structure modifications
    this.dependentsSource=[]
    if (params.length>0){
        const last=params.length-1;
        // add all dependents except the last to the list of dependents
        for (let i = 0; i < last; i++) {
            let d=params[i];
            if (d instanceof Dependent) {
                this.addDependent(d);
                this.dependentsSource.push(d);
            } else {
                this.warn("bad Dependent",NO(i+1).dOpt({ord:true})+"",typeof d+":"+JSON.stringify(d))
            }
        }
        // terminate the list with add which does other checks on the final list
        this.add(params[last],undefined,true)
    }
}
extend(Constituent,Dependent)

// add a Constituent as a child of this Phrase
Dependent.prototype.addDependent = function(dependent,position){
    if (dependent instanceof Dependent){
        dependent.parentConst=this;
        // add it to the list of dependents
        if (position == undefined){
            this.dependents.push(dependent);
        } else if (typeof position == "number" && position<=this.dependents.length && position>=0){
            this.dependents.splice(position,0,dependent)
        } else {
            this.warn("bad position",position,this.dependents.length)
        }
    } else {
        this.warn("bad Dependent",NO(position+1).dOpt({ord:true})+"",typeof dependent)
    }
    return this
}

// remove a child of this Dependent and return it
Dependent.prototype.removeDependent = function(position){
    if (typeof position == "number" && position<this.dependents.length && position>=0){
        const elem=this.dependents.splice(position,1)[0];
        elem.parentConst=null
        return elem
    }
    return this.warn("bad position",position,this.dependents.length)
}

// add a new constituent, set agreement links
Dependent.prototype.add = function(dependent,position,prog){
    if (!(dependent instanceof Dependent)){
        return this.warn("bad Dependent",this.isFr()?"dernier":"last",typeof dependent+":"+JSON.stringify(dependent))
    }
    if (prog===undefined){// real call to .add 
        this.optSource+=".add("+dependent.toSource()+(position===undefined?"":(","+position) )+")"
    } else {
        this.dependentsSource.push(dependent) // call from the constructor        
    }
    this.addDependent(dependent,position);
    this.linkProperties();
    return this;
}

//  returns an identification string, useful for error messages
Dependent.prototype.me = function(){
    let children=this.dependents.map(function(e){return e.me()});
    children.unshift(this.terminal.me())
    return this.constType+"("+children.join()+")";
}

Dependent.prototype.linkProperties = function(){
    //TODO: this is the important thing to set up correctly
    if (this.dependents.length==0) return this;
    //  loop over children to set the peng and taux to their head or subject
    //  so that once a value is changed this change will be propagated correctly...
    for (const d of this.dependents){
        switch (d.constType){
        case "subj":
            if (this.terminal.isA("V")){
                this.terminal.peng=d.peng;
            }
            break;
        case "det":
            if (d.terminal.isA("D")){
                let pe=this.peng.pe; // save person (for possessives)
                d.terminal.peng=this.peng;
                d.terminal.peng.pe=pe;
            }
            break;
        case "mod":
            if (d.terminal.isA("A")){
                d.terminal.peng=this.peng
            }
            break;
        case "comp":
            // nothing to do??
            break;
        case "root":
            this.error("An internal root was found")
            break;
        case "coord":
            // nothing to do, 
            // but make sure that the propagated properties exist
            d.peng={
                pengNO:pengNO++
            };
            // the information will be computed at realization time (see Dependent.prototype.coordReal)
            break;
        default :
            this.error("Strange dependent:"+d.constType)
        }
    }
}

Dependent.prototype.setLemma = function(lemma,terminalType){
    this.error("***: should never happen: setLemma: called on a Dependent");
    return this;
}


// find the gender, number and Person of NP elements of this Phrase
//   set masculine if at least one NP is masculine
//   set plural if one is plural or more than one combined with and
//   set person to the minimum one encountered (i.e. 1st < 2nd < 3rd) mostly useful for French 
Dependent.prototype.findGenderNumberPerson = function(andCombination){
    let g="f";
    let n="s";
    let pe=3;
    let nb=0;
    for (let i = 0; i < this.dependents.length; i++) {
        const e=this.dependents[i].terminal;
        if (e.isOneOf(["NP","N","Pro","Q"])){
            nb+=1;
            const propG=e.getProp("g");
            if (propG=="m" || propG=="x" || e.isA("Q"))g="m"; // masculine if gender is unspecified
            if (e.getProp("n")=="p")n="p";
            const propPe=e.getProp("pe");
            if (propPe !== undefined && propPe<pe)pe=propPe;
        }
    }
    if (nb==0) g="m";
    else if (nb>1 && n=="s" && andCombination)n="p";  
    return {"g":g,"n":n,"pe":pe}
}



Dependent.prototype.pronominalizeChildren = function(){
    //TODO: to implement...
    // console.log("pronominalizeChildren should be defined")
}

Dependent.prototype.passivate = function(){
    //TODO:...
    console.log("passivate not implemented")
    
}

Dependent.prototype.processV = function(types,key,action){
    if (this.isA("coord")){
        this.dependents.forEach(function(d){
            d.processV(types,action)
        })
    } else if (this.terminal.isA("V")){
        const val=types[key];
        if (val!=undefined && val !== false){
            action(this,val)
        }
    }
}

// add special internal dependencies (used only during realization)
Dependent.prototype.addPre = function(terminals){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*pre*"))
        return this;
    }
    for (let terminal of terminals){
        this.addDependent(new Dependent([terminal],"*pre*"))
    }
    return this;
}

Dependent.prototype.addPost = function(terminals){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*post*"),0)
        return this;
    }
    for (let terminal of terminals.reverse()){ // must add them in reverse order because of position 0
        this.addDependent(new Dependent([terminal],"*post*"),0)
    }
    return this;
}

Dependent.prototype.processTyp_fr = function(types){
    this.processV(types,"prog",function(deprel,_v){
        // insert "en train","de" (separate so that élision can be done...) 
        // TODO::but do it BEFORE the pronouns created by .pro()
        const origLemma=deprel.terminal.lemma
        deprel.terminal.setLemma("être"); // change verb, but keep person, number and tense properties of the original...
        deprel.addPost([Q("en train"),Q("de"),V(origLemma).t("b")])
    })
    this.processV(types,"mod",function(deprel,mod){
        let rules=deprel.getRules();
        let origLemma=deprel.terminal.lemma;
        for (let key in rules.verb_option.modalityVerb){
            if (key.startsWith(mod)){
                deprel.terminal.setLemma(rules.verb_option.modalityVerb[key]);
                break;
            }
        }
        // TODO:move the modality verb before the pronoun(s) inserted by .pro()
        deprel.addPost(V(origLemma).t("b"))
    })
    this.processV(types,"neg",function(deprel,neg){
        if (neg===true)neg="pas";
        // deprel.terminal.neg2=neg;  // HACK: to be used when conjugating at the realization time
        deprel.addPre(Adv("ne"))
        deprel.addPost(Adv(neg))
    })
}

Dependent.prototype.processTyp_en = function(types){
    // replace current verb with the list new words
    //  TODO: take into account the fact that there might be already a verb with modals...
    if (types["contr"]!==undefined && types["contr"]!==false){
        // necessary because we want the negation to be contracted within the VP before the S or SP
        this.contraction=true;
    }
    const words=affixHopping(this.terminal,this.getProp("t"),this.getRules().compound,types);
    this.terminal=words.shift()
    this.addPost(words)
}

Dependent.prototype.processTypInt = function(types){
    //TODO:...
    console.log("processTypInt not implemented")
}

Dependent.prototype.processTyp = function(types){
    let pp; // flag for possible pp removal for French wod or wad
    if (types["pas"]!==undefined && types["pas"]!== false){
        this.passivate()
    }
    if (this.isFr()){
        if (types["contr"]!==undefined && types["contr"]!==false){
            this.warn("no French contraction")
        }
        this.processTyp_fr(types) 
    } else { 
        this.processTyp_en(types) 
    }
    if ("int" in types && types["int"] !== false)
        this.processInt(types["int"]);
    const exc=types["exc"];
    if (exc !== undefined && exc === true){
        this.a(this.getRules().sentence_type.exc.punctuation,true);
    }
    return this;   
}

Dependent.prototype.coordReal = function(){
    let res=[];
    // realize coordinated Dependents by adding ',' between all elements except for the last
    // no check is done on the terminal, so
    //    if the terminal is Q(",") then all elements are separated by a ","
    //    Q("and,") deal with the Oxford comma (i.e. a comma after all elements even the last)
    var last=this.dependents.length-1;
    if (last==-1){
        return []
    }
    if (last==0){// coordination with only one element, ignore coordinate
        Array.prototype.push.apply(res,this.dependents[0].real());
        this.setProp("g",this.dependents[0].getProp("g"));
        this.setProp("n",this.dependents[0].getProp("n"));
        this.setProp("pe",this.dependents[0].getProp("pe")||3);
        return this.doFormat(res); // process format for the CP
    }
    // check that all dependents use the same deprel
    const deprel=this.dependents[0].constType;
    for (let j = 0; j < last; j++) { //insert comma after each element
        const dj=this.dependents[j];
        if (!dj.isA(deprel)){
            this.warn("inconsistent dependents within a coord",deprel,dj.constType)
        }
        if (j<last-1) dj.props["a"]=[","];
        Array.prototype.push.apply(res,dj.real())
    }
    // insert realisation of the terminal before last...
    Array.prototype.push.apply(res,this.terminal.real());
    // insert last element
    Array.prototype.push.apply(res,this.dependents[last].real());
    // compute the combined gender and number of the coordination once children have been realized
    if (this.terminal.isA("C")){
        var and=this.isFr()?"et":"and";
        var gn=this.findGenderNumberPerson(this.terminal.lemma==and);
        this.setProp("g",gn.g);
        this.setProp("n",gn.n);
        this.setProp("pe",gn.pe);
        // for an inserted pronoun, we must override its existing properties...
        if (this.pronoun!==undefined){
            this.pronoun.peng=gn;
            this.pronoun.props["g"]=gn.g;
            this.pronoun.props["n"]=gn.n;
            this.pronoun.props["pe"]=gn.pe;
        }
    }
    return res;
}

// creates a list of Terminal each with its "realization" field now set
Dependent.prototype.real = function() {
    let res
    const typs=this.props["typ"];
    if (typs!==undefined)this.processTyp(typs);
    this.pronominalizeChildren();
    const ds=this.dependents;
    // check for coord as subject of a verb and adjust the peng of the verb that will be realized before it in
    // the realization loop
    if (this.terminal.isA("V")){
        for (let d of ds){
            if (d.isA("coord") && d.dependents.length>0 && d.dependents[0].isA("subj")){
                this.terminal.peng=d.peng
                break;
            }
        }
    }
    let before=[];
    let after=[];
    // realize and order them by gathering the dependents that should appear before and after the terminal
    for (let d of ds) {
        let r;
        if (d.isA("coord")){
            r=d.coordReal();
        } else {
            r=d.real()
        }
        // check where this dependent shoould go
        let pos="post";             // default is after
        if (d.props["pos"]=="pre"){ // explicit before
            pos="pre"
        } else {
            if (d.isOneOf(["subj","det","*pre*"])){ // subject and det are always before
                pos="pre"
            } else if (d.isA("mod") && d.terminal.isA("A") && d.parentConst.terminal.isA("N")){ 
                // check adjective position with respect to a noun
                pos=d.isFr()?(d.terminal.props["pos"]||"post"):"pre"; // all English adjective are pre
            } else if (d.isA("coord") && d.dependents.length>0 && d.dependents[0].isOneOf(["subj","det"])){
                pos="pre"
            }
        }
        Array.prototype.push.apply(pos=="pre"?before:after,r)
    }
    res=before.concat(this.terminal.real(),after)
    return this.doFormat(res);
};


// recreate a jsRealB expression
// if indent is positive number create an indented pretty-print string (call it with 0 at the root)
// if called with no parameter then create a single line
Dependent.prototype.toSource = function(indent){
    let sep;
    if (indent===undefined)indent=-1;
    if (indent>=0){
        indent=indent+this.constType.length+1;
        sep=",\n"+Array(indent).fill(" ").join("")
    } else {
        sep=",";
    }
    let depsSource=this.dependentsSource.map(e => e.toSource(indent))
    depsSource.unshift(this.terminal.toSource())
    // create source of children
    let res=this.constType+"("+depsSource.join(sep)+")";
    // add the options by calling "super".toSource()
    res+=Constituent.prototype.toSource.call(this); // ~ super.toSource()
    return res;
}


// functions for creating Dependents

function root(_){ return new Dependent(Array.from(arguments),"root"); };

function subj(_){ return new Dependent(Array.from(arguments),"subj"); }
function det(_) { return new Dependent(Array.from(arguments),"det"); }
function mod(_) { return new Dependent(Array.from(arguments),"mod"); }

function comp(_){ return new Dependent(Array.from(arguments),"comp"); }
function compObj(_){ return new Dependent(Array.from(arguments),"comp"); }
function compObl(_){ return new Dependent(Array.from(arguments),"comp"); }

function coord(_){ return new Dependent(Array.from(arguments),"coord"); }

var deprels = ["root","subj","det","mod","comp","coord"] // list of implemented dependency relations
