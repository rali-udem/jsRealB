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

Dependent.prototype.changeDeprel = function(newDep){
    if (this.isA("coord"))
        this.dependents.forEach((d)=>d.constType=newDep);
    else 
        this.constType=newDep;
    return this;
}

// find index of one of deprels taking into account possible coord starting from position from
// returns -1 when not found
Dependent.prototype.findIndex = function(test,from){
    from = from||0;
    for (let i=from;i<this.dependents.length;i++){
        const d=this.dependents[i];
        if (d.isA("coord") && d.dependents.length>0 && test(d.dependents[0])) return i;
        if (test(d)) return i;
    }
    return -1
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

// Dependency structure modification but that must be called in the context of the parentConst
// because the pronoun depends on the role of the N in the sentence 
//         and its position can also change relatively to the verb
Dependent.prototype.pronominalize_fr = function(){
    let pro;
    let mySelf=this;
    if (this.isA("subj")){
        if (!this.terminal.isA("N"))
            return this.warn("no appropriate pronoun")
        pro=this.getTonicPro("nom")
    } else if (this.isOneOf(["comp","mod"]) && this.parentConst.terminal.isA("P")){
        let prep=this.parentConst.terminal.lemma;
        if (!this.terminal.isA("N"))
            return this.warn("no appropriate pronoun")
        if (prep == "à"){
            pro=np.getTonicPro("dat");
            mySelf=this.parentConst;
        } else if (prep == "de") {
            pro=Pro("en","fr").c("dat");
            mySelf=this.parentConst;
        } else if (contains(["sur","vers","dans"],prep)){
            pro=Pro("y","fr").c("dat");
            mySelf=this.parentConst;
        } else { // change only the N keeping the P intact
            pro=this.getTonicPro("nom");
        }
    } else {
        pro=this.getTonicPro("acc")
    }
    pro.parentConst=this;
    pro.peng=mySelf.peng
    mySelf.terminal=pro
    mySelf.dependents=[]
    mySelf.dependentsSource=[]
}

// Pronominalization in English only applies to a N (this is checked before the call)
//  and does not need reorganisation of the sentence 
//  Does not currently deal with "Give the book to her." that {c|sh}ould be "Give her the book."
Dependent.prototype.pronominalize_en = function(){
    let pro;
    if (this.isA("subj")){    // is it a subject
        pro=this.getTonicPro("nom")
    } else {
        pro=this.getTonicPro("acc") //is direct complement
    }
    pro.peng=this.peng
    pro.parentConst=this;
    this.terminal=pro
    this.dependents=[]
    this.dependentsSource=[]
}

// check if any child should be pronominalized
// this must be done in the context of the parent, because some elements might be changed
Dependent.prototype.pronominalizeChildren = function(){
    for (let d of this.dependents){
        if (d.props["pro"]!==undefined && !d.terminal.isA("Pro")){// it can happen that a Pro has property "pro" set within the same expression
            if (d.isFr()){
                d.pronominalize_fr()
            } else { 
                if (d.terminal.isA("N")){
                    d.pronominalize_en()
                } else {
                    return this.warn("no appropriate pronoun")
                }
            }
        }
    }
}

Dependent.prototype.passivate = function(){
    let subj,obj;  // original subject and object, they are swapped below...
    // find the subject
    if (this.terminal.isA("V")){
        const subjIdx=this.findIndex((d)=>d.isA("subj"));
        if (subjIdx>=0){
            subj=this.dependents[subjIdx];
            if (subj.terminal.isA("Pro")){
                // as this pronoun will be preceded by "par" or "by", the "bare" tonic form is needed
                // to which we assign the original person, number, gender
                subj.terminal=subj.terminal.getTonicPro().g(subj.getProp("g"))
                                        .n(subj.getProp("n")).pe(subj.getProp("pe"));
            }
        } else {
            subj=null
        }
        // find direct object (first N or Pro of a comp) from dependents
        const objIdx=this.findIndex((d)=>d.isA("comp")&& d.terminal.isOneOf(["N","Pro"]))
        if (objIdx>=0){
            obj=this.dependents[objIdx]
            if (obj.terminal.isA("Pro")){
                obj.terminal=obj.terminal.getTonicPro("nom")
            } else if (obj.terminal.isA("N") && obj.props["pro"]!==undefined){
                obj=obj.getTonicPro("nom")
            }
            // swap subject and object by changing their relation name !!!
            // HACK: obj is the new subject
            obj.changeDeprel("subj")
            // make the verb agrees with the new subject (in English only, French is dealt below)
            if (this.isEn()){
                this.terminal.peng=obj.peng
            } 
            if (subj!=null){   // the original subject is now the indirect object
                subj.changeDeprel("mod")
                this.removeDependent(subjIdx);
                this.addDependent(comp(P(this.isFr()?"par":"by",this.lang),subj))
            }
        } else if (subj!=null){ // no object, but with a subject
            //create a dummy subject with a "il"/"it" 
            obj=Pro(this.isFr()?"lui":"it",this.lang).c("nom"); //HACK: obj is the new subject
            // add new subject at the front of the sentence
            this.addPre(obj)
            this.peng=obj.peng
             // add original subject after the verb to serve as an object
            this.addDependent(comp(P(this.isFr()?"par":"by",this.lang),obj))
        }
        if (this.isFr()){
            // do this only for French because in English this is done by processTyp_en
            // change verbe into an "être" auxiliary and make it agree with the newSubj
            // force person to be 3rd (number and tense will come from the new subject)
            const verbe=this.terminal.lemma;
            this.terminal.setLemma("être");
            this.terminal.pe(3);
            if (this.getProp("t")=="ip"){
                this.t("s") // set subjonctive present tense for an imperative
            }
            const pp = V(verbe,"fr").t("pp");
            if (obj!==undefined){ // this can be undefined when a subject is Q or missing
                this.terminal.peng=obj.peng;
                pp.peng=obj.peng;
            }
            // insert the pp before the comp, so that it appears immediately after the verb
            //  calling addPre(pp) would evaluate the pp too soon...
            let compIdx=this.findIndex(d=>d.isA("comp"));
            if (compIdx==-1)compIdx=0;
            this.addDependent(new Dependent([pp],"*post*"),compIdx); 
        }
    } else {
        return this.warn("not found","V",isFr()?"contexte passif":"passive context")
    }
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
Dependent.prototype.addPre = function(terminals,position){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*pre*"),position)
        return this;
    }
    for (let terminal of terminals){
        this.addDependent(new Dependent([terminal],"*pre*"),position)
    }
    return this;
}

Dependent.prototype.addPost = function(terminals){
    if (terminals instanceof Terminal){
        this.addDependent(new Dependent([terminals],"*post*"),0);
        return this;
    }
    for (let terminal of terminals.reverse()){ // must add them in reverse order because of position 0
        this.addDependent(new Dependent([terminal],"*post*"),0);
    }
    return this;
}

Dependent.prototype.processTyp_fr = function(types){
    this.processV(types,"prog",function(deprel,v){
        // insert "en train","de" (separate so that élision can be done...) 
        // TODO::but do it BEFORE the pronouns created by .pro()
        const origLemma=deprel.terminal.lemma
        deprel.terminal.setLemma("être"); // change verb, but keep person, number and tense properties of the original...
        deprel.addPost([Q("en train"),Q("de"),V(origLemma).t("b")])
        deprel.terminal.isProg=v;
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
        deprel.terminal.isMod=true
        let newV=V(origLemma).t("b");
        if (deprel.terminal.isProg){ // copy progressive from original verb...
            newV.isProg=deprel.terminal.isProg;
            delete deprel.terminal.isProg
        }
        deprel.addPost(newV)
    })
    this.processV(types,"neg",function(deprel,neg){
        if (neg===true)neg="pas";
        deprel.terminal.neg2=neg;  // HACK: to be used when conjugating at the realization time
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

Dependent.prototype.moveAuxToFront=function(){
    let vIdx=this.findIndex((d)=>d.isA("*post*")); // added by affixHopping
    if (vIdx>=0){
        const aux=this.terminal;                       // save auxiliary   
        this.terminal=this.dependents[vIdx].terminal;  // set verb as head
        this.removeDependent(vIdx);                    // remove link added by affixHopping
        this.addPre(aux,0)                             // put auxiliary before
    }
}

Dependent.prototype.invertSubject=function(){
    // in French : use inversion rule which is quite "delicate"
    // rules from https://francais.lingolia.com/fr/grammaire/la-phrase/la-phrase-interrogative
    // if subject is a pronoun, invert and add "-t-" or "-"
    // if subject is a noun, the subject stays but add a new pronoun
    let subjIdx=this.findIndex((d)=>d.isA("subj"));
    if (subjIdx>=0){
        const subj=this.dependents[subjIdx].terminal;
        let pro;
        if (subj.isA("Pro")){
            pro=this.removeDependent(subjIdx).terminal; //remove subject
        } else if (subj.isA("CP")){
            pro=Pro("moi","fr").c("nom").g("m").n("p").pe(3); // create a "standard" pronoun, to be patched by cpReal
            subj.pronoun=pro;  // add a flag to be processed by cpReal
        } else
            pro=Pro("moi","fr").g(subj.getProp("g")).n(subj.getProp("n")).pe(3).c("nom"); // create a pronoun
        if (this.terminal.isA("V")){
            this.addPost(pro,0);
            this.terminal.lier()
        }
    }
}

Dependent.prototype.processTypInt = function(int){
    const sentenceTypeInt=this.getRules().sentence_type.int
    const intPrefix=sentenceTypeInt.prefix;
    let prefix,pp; // to be filled later
    switch (int) {
    case "yon": case "how": case "why": case "muc": 
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        prefix=intPrefix[int];
        break;
    // remove a part of the sentence 
    case "wos": case "was":// remove subject 
        let subjIdx=this.findIndex((d)=>d.isA("subj"))
        if (subjIdx>=0){
            // insure that the verb at the third person singular,
            // because now the subject has been removed
            this.terminal.setProp("n","s");
            this.terminal.setProp("pe",3);
            this.removeDependent(subjIdx)
        }
        prefix=intPrefix[int];
        break;
    case "wod": case "wad": // remove direct object (first comp starting with N)
        for (let i=0;i<this.dependents.length;i++){
            const d=this.dependents[i];
            if (d.isA("comp") && d.terminal.isA("N")){
                this.removeDependent(i)
                break;
            }
        }
        prefix=intPrefix[int];
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        break;
    case "woi": case "wai":case "whe":case "whn": // remove indirect object first comp or mod with a P as terminal
        let remove=false;
        prefix=intPrefix[int];  // get default prefix
        for (let i=0;i<this.dependents.length;i++){
            const d=this.dependents[i];
            if (d.isOneOf(["comp","mod"]) && d.terminal.isA("P")){
                // try to find a more appropriate prefix by looking at preposition in the structure
                let prep=d.terminal.lemma;
                const preps=prepositionsList[this.lang];
                if (int=="whe"){
                    if (preps["whe"].has(prep))remove=true
                } else if (int=="whn"){
                    if (preps["whn"].has(prep))remove=true
                } else if (preps["all"].has(prep)){ // "woi" | "wai"
                    // add the preposition in front of the prefix (should be in the table...)
                    prefix=prep+" "+(this.isEn()?(int=="woi"?"whom":"what")
                                                :(int=="woi"?"qui" :"quoi"));
                    remove=true
                }
                if (remove) {
                    this.removeDependent(i)
                    break;
                }
            }
        }
        if (this.isEn()) this.moveAuxToFront(); else this.invertSubject();
        break;
    default:
        this.warn("not implemented","int:"+int)
    }
    if(this.isFr() || int !="yon") {// add the interrogative prefix
        this.addPre(Q(prefix),0)
        // if (pp !== undefined){ // add "par" in front of some French passive interrogative
        //     this.addElement(pp,0)
        //     if (int=="wad"){ // replace "que" by "quoi" for French passive wad
        //         this.elements[1].lemma="quoi";
        //     }
        // }
    }
    this.a(sentenceTypeInt.punctuation,true);
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
        this.processTypInt(types["int"]);
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
    this.pronominalizeChildren();
    const typs=this.props["typ"];
    if (typs!==undefined)this.processTyp(typs);
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
