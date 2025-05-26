import {UDnode,_} from "./UDnode.js";
import {applyOptions} from "./UD2jsr.js"
export {UDnode_en};

class UDnode_en extends UDnode {
    
    constructor(lineNumber, fields){
        super(lineNumber,fields)
    }

    //  Terminal (English)
    // CAUTION: this function can modify the feats structure
    toTerminal(){
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
            return this.feats2options(A(lemma),["Gender","Number","Degree"])
        case "ADV":
            return Adv(lemma);
        case "INTJ":
            return Q(lemma);
        case "NOUN":
            return this.feats2options(N(lemma),["Gender","Number","Person","Tense","Degree"])
        case "PROPN":
            // check if it exists in the lexicon as a noun... (e.g. days of week or months)
            const infos = getLemma(lemma) 
            if (infos !== undefined && "N" in infos) return N(lemma)
            return Q(lemma)
        case "VERB": case "AUX":
            return this.feats2options(V(lemma),["Mood","VerbForm","Tense","Person","Number","Gender"]);
            // Closed classes
        case "ADP":
            return P(lemma);
        case "CCONJ":
            return C(lemma);
        case "DET":
            let det;
            const definite=this.getFeature("Definite");
            if (definite != undefined){
                return this.feats2options(D(definite=="Def"?"the":"a"),["Gender","Number"]);
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
                return this.feats2options(pro,["Case","Person","Gender","Number"]);
            else {
                // if(pro.options.indexOf('c("gen")')<0)pro.addOptions(Case["Nom"]);
                return this.feats2options(pro,["Person","Gender","Number"])
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
    toDependent(isSUD){
 
        // check coordination
        if (this.right.findIndex(udt=>udt.matches("conj",_))>=0){ 
            return this.processCoordination([],isSUD);
        }
       
        // find the sentence type 
        //   must be called before because it might change the structure
        let sentOptions=this.getSentOptions();
        let res = this.toDependent_common(sentOptions,isSUD)
        if (res !== undefined) return res;
               
        let headTerm=this.toTerminal();
        if (headTerm.isA("N","Q")){ 
            // check 's possessive
            if (isSUD){ // in SUD the 's is the head of the following word...
                if (headTerm.lemma == "'s" && this.left.length>0){
                    const previous = this.left[this.left.length-1];
                    if (previous.deprel == "comp:obj"){
                        headTerm = previous.toTerminal().poss()
                        this.left.pop()
                    }
                }
            } else {
                if (this.right.length == 1 && this.right[0].lemma == "'s"){
                    this.right.pop()
                    headTerm.poss()
                }
            }
        } else {
            // check infinitive (remove the PART and change infinitive to "b-to")
            let n=this.left.length;
            if (n>0 && this.left[n-1].getLemma()=="to" && headTerm.isA("V") && headTerm.getProp("t")=="b"){
                this.left.splice(n-1,1); 
                headTerm.t("b-to");
            }
            // check future tense
            let [dep,idx] = this.findDeprelUpos("aux","AUX")
            if (idx>=0 && dep[idx].lemma == "will"){
                const w = dep.splice(idx,1)[0]
                headTerm.t(w.hasFeature("Tense","Past") ? "c" : "f")
            }
        }        
        // process the rest by the common traversal
        return applyOptions(this.childrenDeps(headTerm,isSUD),sentOptions)
    }

// generate options in the form of a list of [name of optionFunction,parameter]
    getSentOptions(isSUD){
        function checkNegation(me){
            const [dep,idx] = me.findDeprelUpos("advmod","PART")
            if (idx >= 0){
                if (dep[idx].lemma == "not"){
                    dep.splice(idx,1)
                    return [["typ",{"neg":true}]]
                }
            }
            return []
        }
        
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
            const modal=modals[lemma];
            if (modal!==undefined){
                this.feats = dep[idx].feats // set verb features to those of aux
                dep.splice(idx,1); // remove aux...
                let options=[["typ",{"mod":modal}]] //[`mod:"${mod}"`];
                if (["could","might","should","would","ought"].indexOf(lemma)>=0)
                    options.unshift(["t","ps"]); // set past tense
                // check for negated modal
                options.push(...checkNegation(this))
                return this.getSentOptions().concat(options);
            }
        }
        // check for progressive
        if (this.hasFeature("VerbForm","Prog") || 
            (this.hasFeature("VerbForm","Part") && this.hasFeature("Tense","Pres"))){
            [dep,idx]=this.findDeprelUpos("aux","AUX");
            if (idx>=0 && dep[idx].getLemma()=="be"){
                this.feats = dep[idx].feats
                dep.splice(idx,1);
                return this.getSentOptions().concat(
                    [["typ",{"prog":true}]],checkNegation(this));
            }
        }
        // check for perfect
        if (this.upos == "VERB"){
            [dep,idx]=this.findDeprelUpos("aux","AUX");
            if (idx>=0 && dep[idx].getLemma()=="have"){
                this.feats = dep[idx].feats; // copy aux features to verb
                dep.splice(idx,1) // remove auxiliary
                return this.getSentOptions().concat(
                    [["typ",{"perf":true}]],checkNegation(this))
            }
        }

        // check for some interrogation type
        [dep,idx]=this.findDeprelUpos("advmod","ADV");
        if (idx>=0){
            const adv=dep[idx].getLemma();
            if (adv=="why" || adv=="how" || adv=="when"){
                [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
                if (idx1>=0 && dep1[idx1].getLemma()=="?"){
                    dep1.splice(idx1,1);
                    dep.splice(idx,1);
                    return this.getSentOptions().concat(
                        [["typ",{"int":adv=="when"?"whn":adv}]],checkNegation(this));
                }
            }
        }
        
        // check for yon interrogative
        [dep,idx]=this.findDeprelUpos(["aux","cop"],"AUX");
        if (idx>=0 && ["do","have","be"].includes(dep[idx].getLemma())){
            [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
            if (idx1>=0 && dep1[idx1].getLemma()=="?"){
                dep1.splice(idx1,1);
                if (dep[idx].getLemma() == "do"){
                    this.feats = dep[idx].feats;
                    dep.splice(idx,1);
                }                
                return this.getSentOptions().concat(
                    [["typ",{"int":"yon"}]],checkNegation(this));
            }
        }
        
        // check for sole negation
        [dep,idx]=this.findDeprelUpos("advmod","PART");
        if (idx>=0 && dep[idx].getLemma()=="not"){
            [dep1,idx1]=this.findDeprelUpos("aux","AUX");
            if (idx1>=0 && dep1[idx1].getLemma()=="do"){
                dep.splice(idx,1);
                this.feats=dep1[idx1].feats; // copy to the verb the features from the removed auxiliary
                dep1.splice(idx1,1);
                return this.getSentOptions().concat([["typ",{"neg":true}]]);
            }        
        }
        return [];
    }
}
