import {UDnode,applyOptions,_} from "./UDnode.js";
import {feats2options} from "./UD2jsr.js";
export {UDnode};

// French version
// create a Constituent
UDnode.prototype.toTerminal = function(isLeft){
    function tonicPronoun(form,udLemma){
        const nomList = ["je","tu","il","elle","nous","vous","ils","elles"];
        const accList = ["me","te","le","les","la"];
        if (nomList.indexOf(form)>=0 || nomList.indexOf(udLemma)>=0){
            return Pro("moi").c("nom");
        }
        if (accList.indexOf(form)>=0 || nomList.indexOf(udLemma)>=0){
            return Pro("moi").c("acc")
        }
        return Pro(udLemma);
    }

    function possessivePronoun (form,pluralPsor){
        const ppTable={
            "mien":  ["mien", 1],
            "tien":  ["mien", 2],
            "sien":  ["mien", 3],
            "nôtre": ["nôtre",1],
            "vôtre": ["nôtre",2],
            "leur":  ["nôtre",3],
        };
        const plurTable = {
            "mien":"nôtre","tien":"vôtre","sien":"leur"
        };
        if (form in ppTable){
            if (pluralPsor && form in plurTable)
                form=plurTable[form];
            const [lemma,person]=ppTable[form]
            return Pro(lemma).pe(person);
        }
    }

    function possessiveDeterminer(udLemma,pluralPsor){
        const pdTable = {
             "mon":    ["mon",  1],
             "ton":    ["mon",  2],
             "son":    ["mon",  3],
             "notre":  ["notre",1],
             "votre":  ["notre",2],
             "leur":   ["notre",3],
        };
        const plurTable = {
            "mon":"notre","ton":"votre","son":"leur"
        };
        if (udLemma in pdTable){
            if (pluralPsor && udLemma in plurTable)
                udLemma=plurTable[udLemma];
            let [lemma,person]=pdTable[udLemma];
            return D(lemma).pe(person)
        }
        return D(udLemma);
    }

    const lemma=this.getLemma(); 
    const upos=this.getUpos();
    switch (upos) {
        // Open classes
    case "ADJ":
        return feats2options(A(lemma).pos(isLeft?"pre":"post"),this,["Gender","Number"])
    case "ADV":
        return Adv(lemma);
    case "INTJ":
        return Q(lemma);
    case "NOUN":
        return feats2options(N(lemma),this,["Gender","Number","Person","Tense","Degree"])
    case "PROPN":
        return Q(lemma)
    case "VERB": case "AUX":
        return feats2options(V(lemma),this,["Mood","VerbForm","Tense","Person","Number","Gender"]);
        // Closed classes
    case "ADP":
        return P(lemma);
    case "CCONJ":
        return C(lemma);
    case "DET":
        if (this.hasFeature("Poss","Yes")){
            return feats2options(possessiveDeterminer(lemma,this.hasFeature("Number_psor","Plur")),this,
                                 ["Person","Person_psor","Gender","Number","Number_psor"]);
        }
        const definite=this.getFeature("Definite");
        if (definite != undefined){
            return feats2options(D(lemma),this,["Person","Gender","Number"]);
        }
        return D(lemma);
        break;
    case "NUM":
        const ix=["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix"].indexOf(lemma);
        if (ix>=0) return NO(ix).dOpt({nat:true});
        if (isNaN(lemma)) return Q(lemma);
        return NO(lemma).dOpt({raw:true});
        break;
    case "PART":
        if (lemma=="not" && this.hasNoFeature()){
            return Adv("not")
        } else {
            return Q(lemma)
        }
        break;
    case "PRON":
        let pro;
        if (this.hasFeature("Poss","Yes") && this.hasFeature("PronType","Prs")){
            pro=possessivePronoun(this.getForm().toLowerCase());
        }
        if (lemma=="se"){
            return feats2options(Pro("moi").c("refl"),this,["Person","Gender","Number"]);
        }
        if (lemma=="lui" && this.getForm()=="lui"){
            return Pro("lui").tn("")
        }
        if(pro===undefined)
            pro=tonicPronoun(this.getForm().toLowerCase(),lemma);
        // HACK: this should be done using "lier()" with the previous word or add a new terminal
        //   but this would imply knowing the previous token, not available right now or returning a list of tokens
        if (this.getForm().startsWith("-"))pro.b("-");
        if (this.hasFeature("Case"))
            return feats2options(pro,this,["Case","Person","Gender","Number","Reflex"]);
        else {
            // if(pro.options.findIndex(o=>o.startsWith('c('))<0)pro.c("nom");
            return feats2options(pro,this,["Person","Person_psor","Gender","Number","Number_psor","Reflex"])
        }
        break;
    case "SCONJ":
        return C(lemma)
    case "PUNCT": case "SYM": case "X":
        return Q(lemma);
    default:
        console.log("UPOS inconnu:%s",upos)
    }
}


// modify the UD structure to better reflect the structure expected by jsRealB
UDnode.prototype.toDependent = function(isLeft,isSUD){
    // find the sentence type 
    //   must be called before because it might change the structure
    let sentOptions=this.getSentOptions();
    let headOptions=[];
    
    if (!isSUD){ // in SUD, the copula is already the root so no change is needed
        // change a cop upos to an aux (caution delicate HACK...)
        // it must be done before anything else...
        // this allows creating a sentence of the type S(subj,VP(V(be),...)) from a dependency
        // having a noun or an adjective as root
        const [dep,idx]=this.findDeprelUpos("cop","AUX");
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
            return applyOptions(newAux.toDependent(isLeft,isSUD),sentOptions);
        }
    }

    // check coordination
    if (this.right.findIndex(udt=>udt.matches("conj",_))>=0){ 
        return this.processCoordination(sentOptions,isSUD);
    }
    // remove "se" in front of "essentiellement reflexif" verb that will be regenerated by jsRealB
    if (this.getUpos()=="VERB"){
        let lemmaInfos=getLemma(this.getLemma());
        if (lemmaInfos!==undefined && lemmaInfos["V"]!==undefined && lemmaInfos["V"]["pat"]!==undefined){
            let pat=lemmaInfos["V"]["pat"];
            if (Array.isArray(pat) && pat.length==1 && pat[0]=="réfl"){
                let idx=this.left.findIndex(udn=>udn.getUpos()=="PRON" && udn.hasFeature("Reflex","Yes"));
                if (idx>=0) {
                    this.left.splice(idx,1)
                }
            }
        }
    }
    let headTerm=this.toTerminal();
    // process the rest by the common traversal
    return applyOptions(this.childrenDeps(applyOptions(headTerm,headOptions),isLeft,isSUD),sentOptions)
}

// generate options in the form of a list of [name of optionFunction,parameter]
//  not very useful in French
UDnode.prototype.getSentOptions=function(isSUD){
    let dep,idx,dep1,idx1;
    // match all sentenceTypes...
    if (this.hasFeature("VerbForm","Prog")){
        [dep,idx]=this.findDeprelUpos("aux","AUX");
        if (idx>=0 && dep[idx].getLemma()=="être"){
            this.deleteFeature("VerbForm"); // the gerund form will be generated by sentence type
            dep.splice(idx,1);
            return this.getSentOptions().concat(["prog",true]);
        }
    }
    // [dep,idx]=this.findDeprelUpos("aux","AUX");
    // if (idx>=0 && dep[idx].getLemma()=="avoir"){
    //     const vbIdx=dep.slice(idx+1).findIndex(e=>e.getUpos()=="AUX"||e.getUpos("VERB"));
    //     if (vbIdx>=0){
    //         const vb=dep[idx+1+vbIdx];
    //         if (vb.hasFeature("VerbForm","Part") && vb.hasFeature("Tense","Past")){
    //             vb.deleteFeature("VerbForm");
    //             vb.deleteFeature("Tense");
    //             dep.splice(idx,1); // remove auxiliary
    //             return this.getSentOptions().concat([`perf:true`]); // ignoré par jsRealB....
    //         }
    //     }
    // }
    return [];
    
}