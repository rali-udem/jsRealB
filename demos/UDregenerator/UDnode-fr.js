if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    const udt = require('./UDnode.js');
    UDnode=udt.UDnode;
    _=udt._;
    const udjsr=require("./UD2jsr.js");
    // eval exports 
    for (var v in udjsr){
        eval(v+"=udjsr."+v);
    }
    const jsr=require("./JSR.js");
    JSR=jsr.JSR;
    const utils=require("./utils.js");
    appendTo=utils.appendTo;

    exports.UDnode=UDnode;
}
// French version

UDnode.prototype.toTerminal = function(isLeft){
    function tonicPronoun(udLemma){
        const nomList = ["je","tu","il","elle","nous","vous","ils","elles"];
        const accList = ["me","te","le","les","la"];
        if (nomList.indexOf(udLemma)>=0){
            return new JSR("Pro","moi",['c("nom")']);
        } 
        if (accList.indexOf(udLemma)>=0){
            return new JSR("Pro","moi",['c("acc")'])
        }
        return new JSR("Pro",udLemma);
    }

    function possessivePronoun (udLemma,pluralPsor){
        const ppTable={
            "mien":  ["mien","pe(1)"],
            "tien":  ["mien","pe(2)"],
            "sien":  ["mien","pe(3)"],
            "nôtre": ["nôtre","pe(1)"],
            "vôtre": ["nôtre","pe(2))"],
            "leur":  ["nôtre","pe(3)"],
        };
        const plurTable = {
            "mien":"nôtre","tien":"vôtre","sien":"leur"
        };
        if (udLemma in ppTable){
            if (pluralPsor && udLemma in plurTable)
                udLemma=plurTable[udLemma];
            const [lemma,option]=ppTable[udLemma]
            return new JSR("Pro",lemma,option);
        }
    }

    function possessiveDeterminer(udLemma,pluralPsor){
        const pdTable = {
             "mon":    ["mon","pe(1)"],
             "ton":    ["mon","pe(2)"],
             "son":    ["mon","pe(3)"],
             "notre":  ["notre","pe(1)"],
             "votre":  ["notre","pe(2)"],
             "leur":   ["notre","pe(3)"],
        };
        const plurTable = {
            "mon":"notre","ton":"votre","son":"leur"
        };
        if (udLemma in pdTable){
            if (pluralPsor && udLemma in plurTable)
                udLemma=plurTable[udLemma];
            const [lemma,option]=pdTable[udLemma];
            return new JSR("D",lemma,option)
        }
        return new JSR("D",udLemma);
    }

    const lemma=this.getLemma().replace(/"/g,'\\"'); // protect double quotes;
    const upos=this.getUpos();
    switch (upos) {
    case "NUM":
        const ix=["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix"].indexOf(lemma);
        if (ix>=0) return new JSR("NO",ix,'dOpt({nat:true})');
        if (isNaN(lemma)) return new JSR("Q",lemma);
        return new JSR("NO",lemma,'dOpt({raw:true})');
        break;
    case "ADJ":
        return new JSR("A",lemma,[`pos("${isLeft?"pre":"post"}")`]).addOptions(this.feats2options(["Gender","Number"]))
    case "PRON":
        let pro;
        if (this.hasFeature("Poss","Yes") && this.hasFeature("PronType","Prs")){
            pro=possessivePronoun(this.getForm());
        }
        if (lemma=="se"){
            return new JSR("Pro","moi",[`c("refl")`]).addOptions(this.feats2options(["Person","Gender","Number"]));
        }
        if(pro===undefined)
            pro=tonicPronoun(lemma);
        // HACK: this should be done using "lier()" with the previous word or add a new terminal
        //   but this would imply knowing the previous token, not available right now or returning a list of tokens
        if (this.getForm().startsWith("-"))pro.addOptions(['b("-")']);
        if (this.hasFeature("Case"))
            return pro.addOptions(this.feats2options(["Case","Person","Gender","Number","Reflex"]));
        else {
            if(pro.options.findIndex(o=>o.startsWith('c('))<0)pro.addOptions(Case["Nom"]);
            return pro.addOptions(this.feats2options(["Person","Gender","Number","Reflex"]))
        }
        break;
    case "VERB": case "AUX":
        let options;
        const verbForm=this.selectFeature("VerbForm")|| "Fin";
        if (verbForm=="Fin"){
            const mood=this.selectFeature("Mood") || "Ind";
            const tense=this.selectFeature("Tense") || "Pres";
            options = [ Mood[mood][tense] ];
        } else if (verbForm=="Part"){
            const tense=this.selectFeature("Tense") || "Pres";
            options = [Mood["Part"][tense]];
        } else {
            options = [ VerbForm[verbForm] ];
        }
        appendTo(options,this.feats2options(["Person","Number","Gender"]));
        return new JSR("V",lemma,options);
    case "PART":
        if (lemma=="not" && this.hasNoFeature()){
            return new JSR("Adv","not")
        }
        break;
    case "DET":
        if (this.hasFeature("Poss","Yes")){
            return possessiveDeterminer(this.getLemma(),this.hasFeature("Number_psor","Plur"))
                       .addOptions(this.feats2options(["Person","Gender","Number"]));
        }
        const definite=this.getFeature("Definite");
        if (definite != undefined){
            return new JSR("D",this.getLemma())
                       .addOptions(this.feats2options(["Person","Gender","Number"]));
        }
        break;
    case "PUNCT":
        return new JSR("Q",lemma);
    default:
        // let it go through if no return was done
    }
    // general case    
    const constType=udPos_jsrPos[upos];
    if (constType=="Q") 
        return new JSR("Q",this.getForm().replace(/"/g,'\\"')); // return original form ignoring features
    const res=new JSR(constType,lemma,this.feats2options(["Gender","Number","Person","Tense","Degree"]));
    if (constType=="V"){
        res.addOptions(this.feats2options(["Mood","VerbForm"]));
    }
    return res;
}

// French
UDnode.prototype.toPhrase = function(toLeft){
    let dep,idx;
    // process head
    const upos=this.upos;
    const headConst=udPos_jsrPos[upos];
    if (headConst === undefined){
        console.log("toPhrase:unknown constType",upos);
    }
    // find the sentence type 
    //   must be called before because it might change the structure
    let sentOptions=this.getSentOptions();
    if (sentOptions.length>0) 
        sentOptions=[`typ({${sentOptions.join(",")}})`];
    // let headOptions=[];
    
    // change a cop upos to an aux (caution delicate HACK...) 
    //   unless it is a question (its root is interrogative adjective)
    // it must be done before anything else...
    // this allows creating a sentence of the type S(subj,VP(V(be),...)) from a dependency
    // having a noun or an adjective as root
    const isQuestion = this.matches("root","ADJ") && this.lemma.startsWith("qu");
    if (!isQuestion){
        [dep,idx]=this.findDeprelUpos("cop","AUX");
        if (idx>=0){
            let [newAux]=dep.splice(idx,1);
            let [dep1,idx1]=this.findDeprelUpos("nsubj",_); 
            if (idx1>=0){
                const [subj]=dep1.splice(idx1,1);
                newAux.left.push(subj);  // add as subject of the new auxiliary
            }
            newAux.deprel="aux";
            this.deprel="xcomp"; // change this to the complement of the new auxiliary
            newAux.right.unshift(this);
            // push what was before the "old" auxiliary to the front of the new auxiliary
            // as the subject and auxiliary hAve been removed, idx must have been at least 2...
            if (idx>=1 && dep==this.left){
                const auxId=newAux.id;
                while (this.left.length>0){
                    const x=this.left.pop();
                    if (x.id<newAux.id)
                        newAux.left.unshift(x);
                    else
                        newAux.right.unshift(x)
                }
                // newAux.left=dep.splice(0,idx).concat(newAux.left);
            }
            return newAux.toPhrase().addOptions(sentOptions);
        }
    }
     
    let headTerm=this.toTerminal(toLeft);
    
            
    // process nominals (other cases to process...)
    const nominals=["NOUN","PROPN","PRON","NUM","ADJ"];
    if (nominals.indexOf(upos)>=0){
        return this.processNominal(headTerm,sentOptions);
    }
    
    // // check coordination
    if (this.right.findIndex(udt=>udt.matches("conj",_,_))>0){ // conj should not be first child
        return this.processCoordination("VP",headTerm,sentOptions);
    }

    // process clause with S(subject, VP(head,rightchildren))
    //  because processChildren might change the head, we have to build the expression bottom-up    

    let vp=new JSR("VP");
    vp.addChildren(headTerm);
    vp.addChildren(this.right.map(c=>c.toConstituent(false)));
    if (this.left.length>0) {
        // // check passive
        // idx=this.left.findIndex(udt=>udt.matches("aux:pass","AUX"))
        // if (idx>=0 && this.left[idx].getLemma()=="être"){
        //     let [aux]=this.left.splice(idx,1);
        //     let be=aux.toTerminal(false);
        //     vp.children.unshift(be);
        // }
        let s=new JSR("S",this.left.map(c=>c.toConstituent(true)));
        s.addChildren(vp)
        return s.addOptions(sentOptions);
    }
    return vp.addOptions(sentOptions);
}

UDnode.prototype.getSentOptions=function(){
    let dep,idx,dep1,idx1;
    // match all sentenceTypes...
    if (this.hasFeature("VerbForm","Prog")){
        [dep,idx]=this.findDeprelUpos("aux","AUX");
        if (idx>=0 && dep[idx].getLemma()=="être"){
            this.deleteFeature("VerbForm"); // the gerund form will be generated by sentence type
            dep.splice(idx,1);
            return this.getSentOptions().concat([`prog:true`]);
        }
    }
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="avoir"){
        const vbIdx=dep.slice(idx+1).findIndex(e=>e.getUpos()=="AUX"||e.getUpos("VERB"));
        if (vbIdx>=0){
            const vb=dep[idx+1+vbIdx];
            if (vb.hasFeature("VerbForm","Part") && vb.hasFeature("Tense","Past")){
                vb.deleteFeature("VerbForm");
                vb.deleteFeature("Tense");
                dep.splice(idx,1); // remove auxiliary
                return this.getSentOptions().concat([`perf:true`]);
            }
        }
    }
    return [];
}
