import {UDnode,applyOptions,_} from "./UDnode.js";
import {feats2options} from "./UD2jsr.js";
export {UDnode};

//  Terminal (English)
// CAUTION: this function can modify the feats structure
UDnode.prototype.toTerminal = function(){
    function tonicPronoun(udLemma){
        const tpTable = { 
            "i":"me", 
            "I":"me",
            "he":"him",
            "she":"her",
            "we":"us",
            "they":"them"
        };
        if (udLemma in tpTable){
            let pro=Pro(tpTable[udLemma]).c("nom")
            if (udLemma=="i"||udLemma=="I")pro.pe(1)
            return pro
        } 
        return Pro(udLemma);
    }

    function possessivePronoun (udLemma){
        const ppTable = {
                "mine":"me",
                "his":"him",
                "hers":"her",
                "its":"me",
                "ours":"us",
                "yours":"you",
                "theirs":"them"
        };
        if (udLemma in ppTable){
            let pro=Pro(ppTable[udLemma]).c("gen")
            if (udLemma=="mine")pro.pe(1);
            return pro
        } else if (udLemma=="my") {
            // strangely UD tags this determiner as a pronoun...
            return D("my");
        }
    }

    function possessiveDeterminer(udLemma){
        // in some UD the lemma is the nominative pronoun...
        const options ={
             "my":   [1,"s",null],
             "I":    [1,"s",null],
             "your": [2,"s",null],
             "his":  [3,"s","m"],
             "he":   [3,"s","m"],
             "her":  [3,"s","f"],
             "she":  [3,"s","f"],
             "its":  [3,"s","n"],
             "it":   [3,"s","n"],
             "our":  [1,"p",null],
             "we":   [1,"p",null],
             "your": [2,"p",null],
             "you":  [2,"p",null],
             "their":[3,"p",null],
             "they": [3,"p",null],
        }
        if (udLemma in options){
            const [pe,n,g]=options[udLemma];
            let det=D("my").pe(pe).ow(n)
            if (g!==null)det.g(g);
            return det
        }
    }
    
    const lemma=this.getLemma()
    const upos=this.getUpos();
    switch (upos) {
        //open classes
    case "ADJ":
        if (this.hasFeature("NumType","Ord")){
            const ix=["zero","one","two","three","four","five","six","seven","eight","nine","ten",
                      "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventen","eighteen","nineteen","twenty"].indexOf(lemma);
            if (ix>=0) return NO(ix).dOpt({ord:true});
            if (isNaN(lemma)) return Q(lemma);
        }
        return feats2options(A(lemma),this,["Gender","Number","Degree"])
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
        let det;
        const definite=this.getFeature("Definite");
        if (definite != undefined){
            return feats2options(D(definite=="Def"?"the":"a"),this,["Gender","Number"]);
        }
        if (this.hasFeature("Poss","Yes") && this.hasFeature("PronType","Prs")){
            det=possessiveDeterminer(lemma);
            if (det===undefined){
                console.log("strange possessive determiner:"+lemma);
                return D(lemma)
            }
            return det;
        }
        return D(lemma)
        break;
    case "NUM":
        if (this.hasFeature("NumType","Card")){
            const ix=["zero","one","two","three","four","five","six","seven","eight","nine","ten"].indexOf(lemma);
            if (ix>=0) return NO(ix).dOpt({nat:true});
            if (isNaN(lemma)) return Q(lemma);
        }
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
            pro=possessivePronoun(lemma);
            // many possessive determiner are coded as possessive pronouns 
            // https://universaldependencies.org/u/feat/PronType.html#prs-personal-or-possessive-personal-pronoun-or-determiner
            if (pro===undefined && !this.hasFeature("Case")){ // do not try when the Case feature is present
                const posDet=possessiveDeterminer(lemma);
                if (posDet!==undefined) return posDet;
            }
        }
        if(pro===undefined)
            pro=tonicPronoun(lemma);
        if (this.hasFeature("Case"))
            return feats2options(pro,this,["Case","Person","Gender","Number"]);
        else {
            // if(pro.options.indexOf('c("gen")')<0)pro.addOptions(Case["Nom"]);
            return feats2options(pro,this,["Person","Gender","Number"])
        }
        break;
    case "SCONJ":
        return C(lemma)
    case "PUNCT": case "SYM" : case "X":
        return Q(lemma); 
    default:
        console.log("Unknown UPOS:%s",upos)
    }
}

// modify the UD structure to better reflect the structure expected by jsRealB
UDnode.prototype.toDependent = function(isLeft,isSUD){
    function isModal(option){
        let [key,val]=option;
        if (key!="typ")return false;
        return val.hasOwnProperty("mod")
    }
    
    // find the sentence type 
    //   must be called before because it might change the structure
    let sentOptions=this.getSentOptions();
    let headOptions=[];
    
    if (!isSUD){ // in SUD, the copula is already the root so no change is needed
        // change a cop upos to an aux (caution delicate HACK...)
        // it must be done before anything else...
        // this allows creating a sentence of the type S(subj,VP(V(be),...)) from a dependency
        // having a noun or an adjective as root
        const modalIdx=sentOptions.findIndex(isModal)
        const copUpos = modalIdx<0 ? "AUX" : "VERB";  // with a modal, the UPOS is VERB
        let [dep,idx]=this.findDeprelUpos("cop",copUpos);
        if (idx>=0){
            let [newAux]=dep.splice(idx,1);
            if (newAux.hasFeature("VerbForm","Inf")) // ensure verb is conjugated
                newAux.deleteFeature("VerbForm");
            let [dep1,idx1]=this.findDeprelUpos("nsubj",_); 
            if (idx1>=0){
                const [subj]=dep1.splice(idx1,1);
                newAux.left.push(subj);  // add as subject of the new auxiliary
            }
            newAux.deprel="aux";
            this.deprel="xcomp"; // change this to the complement of the new auxiliary
            newAux.right.unshift(this);
            // push what was before the "old" auxiliary to the front of the new auxiliary
            // as the subject and auxiliary have been removed, idx must have been at least 2...
            if (idx>=2 && dep==this.left){
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
    
    let headTerm=this.toTerminal();
    // check infinitive (remove the PART and change infinitive to "b-to")
    let n=this.left.length;
    if (n>0 && this.left[n-1].getLemma()=="to" && headTerm.isA("V") && headTerm.getProp("t")=="b"){
        this.left.splice(n-1,1);
        headTerm.t("b-to");
    }
    
    // check future tense
    const [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="will"){
        const [w]=dep.splice(idx,1);
        headOptions.push(["t",w.hasFeature("Tense","Past")?"c":"f"]);
    }
    
    // process the rest by the common traversal
    return applyOptions(this.childrenDeps(applyOptions(headTerm,headOptions),isLeft,isSUD),sentOptions)
}

// generate options in the form of a list of [name of optionFunction,parameter]
UDnode.prototype.getSentOptions=function(isSUD){
    const modals={
        "can":"poss",
        "could":"poss",
        "may":"perm",
        "might":"perm",
        "shall":"nece",
        "should":"nece",
        "would":"will",
        "must":"obli",
        "ought":"obli",
    //  "will":"will", //will is most often used for future
    }
    
    
    let dep,idx,dep1,idx1;
    // deal with a modal
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0){
        const lemma=dep[idx].getLemma();
        const mod=modals[lemma];
        if (mod!==undefined){
            dep.splice(idx,1); // remove aux...
            let options=[["typ",{"mod":mod}]] //[`mod:"${mod}"`];
            if (["could","might","should","would","ought"].indexOf(lemma)>=0)
                options.unshift(["t","ps"]); // set past tense
            return this.getSentOptions().concat(options);
        }
    }
    // match all sentenceTypes...
    if (this.hasFeature("VerbForm","Prog")){
        [dep,idx]=this.findDeprelUpos("aux","AUX");
        if (idx>=0 && dep[idx].getLemma()=="be"){
            this.deleteFeature("VerbForm"); // the gerund form will be generated by sentence type
            dep.splice(idx,1);
            return this.getSentOptions().concat([["typ",{"prog":true}]]);
        }
    }
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="have"){
        const vbIdx=dep.slice(idx+1).findIndex(e=>e.getUpos()=="AUX"||e.getUpos("VERB"));
        if (vbIdx>=0){
            const vb=dep[idx+1+vbIdx];
            if (vb.hasFeature("VerbForm","Part") && vb.hasFeature("Tense","Past")){
                vb.deleteFeature("VerbForm");
                vb.deleteFeature("Tense");
                dep.splice(idx,1); // remove auxiliary
                return this.getSentOptions().concat([["typ",{"perf":true}]]);
            }
        }
    }
    [dep,idx]=this.findDeprelUpos("advmod","PART");
    if (idx>=0 && dep[idx].getLemma()=="not"){
        dep.splice(idx,1);
        [dep1,idx1]=this.findDeprelUpos("aux","AUX");
        if (idx1>=0 && dep1[idx1].getLemma()=="do"){
            this.feats=dep1[idx1].feats; // copy to the verb the features from the removed auxiliary
            dep1.splice(idx1,1);
        }        
        return this.getSentOptions().concat([["typ",{"neg":true}]]);
    }
    [dep,idx]=this.findDeprelUpos("advmod","ADV");
    if (idx>=0){
        const adv=dep[idx].getLemma();
        if (adv=="why" || adv=="how" || adv=="when"){
            [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
            if (idx1>=0 && dep1[idx1].getLemma()=="?"){
                dep1.splice(idx1,1);
                dep.splice(idx,1);
                return this.getSentOptions().concat([["typ",{"int":adv}]]);
            }
        }
    }
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="do"){
        [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
        if (idx1>=0 && dep1[idx1].getLemma()=="?"){
            dep1.splice(idx1,1);
            dep.splice(idx,1);
            return this.getSentOptions().concat([["typ",{"int":"yon"}]]);
        }
    }
    return [];
}
