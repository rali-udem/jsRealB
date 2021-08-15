if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    const udn = require('./UDnode.js');
    UDnode=udn.UDnode;
    _=udn._;
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
            return new JSR("Pro",tpTable[udLemma],(udLemma=="i"||udLemma=="I"?['pe("1")']:[]))
        }
        return new JSR("Pro",udLemma);
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
            let options=['c("gen")'];
            if (udLemma=="mine")options.push('pe("1")');
            return new JSR("Pro",ppTable[udLemma],options);
        }
    }

    function possessiveDeterminer(udLemma){
        // in some UD the lemma is the nominative pronoun...
        const options ={
             "my":   ['pe("1")','ow("s")'],
             "I":    ['pe("1")','ow("s")'],
             "your": ['pe("2")','ow("s")'],
             "his":  ['pe("3")','ow("s")','g("m")'],
             "he":   ['pe("3")','ow("s")','g("m")'],
             "her":  ['pe("3")','ow("s")','g("f")'],
             "she":  ['pe("3")','ow("s")','g("f")'],
             "its":  ['pe("3")','ow("s")','g("n")'],
             "it":   ['pe("3")','ow("s")','g("n")'],
             "our":  ['pe("1")','ow("p")'],
             "we":   ['pe("1")','ow("p")'],
             "your": ['pe("2")','ow("p")'],
             "you":  ['pe("2")','ow("p")'],
             "their":['pe("3")','ow("p")'],
             "they": ['pe("3")','ow("p")'],
        }
        if (udLemma in options)
            return new JSR("D","my",options[udLemma]);
    }
    
    const lemma=this.getLemma().replace(/"/g,'\\"'); // protect double quotes
    const upos=this.getUpos();
    switch (this.getUpos()) {
    case "NUM":
        if (this.hasFeature("NumType","Card")){
            const ix=["zero","one","two","three","four","five","six","seven","eight","nine","ten"].indexOf(lemma);
            if (ix>=0) return new JSR("NO",ix,'dOpt({nat:true})');
            if (isNaN(lemma)) return new JSR("Q",lemma);
            return new JSR("NO",lemma,'dOpt({raw:true})');
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
            return pro.addOptions(this.feats2options(["Case","Person","Gender","Number"]));
        else {
            if(pro.options.indexOf('c("gen")')<0)pro.addOptions(Case["Nom"]);
            return pro.addOptions(this.feats2options(["Person","Gender","Number"]))
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
        appendTo(options,this.feats2options(["Person","Number"]));
        return new JSR("V",lemma,options);
    case "PART":
        if (lemma=="not" && this.hasNoFeature()){
            return new JSR("Adv","not")
        }
        break;
    case "DET":
        let det;
        const definite=this.getFeature("Definite");
        if (definite != undefined){
            return new JSR("D",definite=="Def"?"the":"a",this.feats2options(["Gender","Number"]));
        }
        if (this.hasFeature("Poss","Yes") && this.hasFeature("PronType","Prs")){
            det=possessiveDeterminer(lemma);
            if (det===undefined){
                console.log("strange possessive determiner:"+lemma);
                return new JSR("D",lemma)
            }
            return det;
        }
        break;
    case "PUNCT":
        return new JSR("Q",lemma); // check for " that must be escaped, because it will appear between " "
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


/// CAUTION: this function can modify the structure of the dependency input.
UDnode.prototype.toPhrase = function(){
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
    let typOptions=[];
    if (sentOptions.length>0){
        let otherOptions=[];
        for (const op of sentOptions){ // separate two kinds of sentence options
            if (/\w+:"?\w"?/.test(op))
                typOptions.push(op);
            else
                otherOptions.push(op) 
        }
        sentOptions=otherOptions;
        if (typOptions.length>0)
            sentOptions.push(`typ({${typOptions.join(",")}})`)
    }
    let headOptions=[];
    
    // change a cop upos to an aux (caution delicate HACK...)
    // it must be done before anything else...
    // this allows creating a sentence of the type S(subj,VP(V(be),...)) from a dependency
    // having a noun or an adjective as root
    [dep,idx]=this.findDeprelUpos("cop",_);
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
        let newS=newAux.toPhrase().addOptions(sentOptions);
        newS.constName="S"; // ensure a S as root
        return newS;
    }
    
    let headTerm=this.toTerminal();
    // check infinitive (remove the PART and add "to " in front of the verb)
    let n=this.left.length;
    if (n>0 && this.left[n-1].getLemma()=="to" && headTerm.isA("V")){
        this.left.splice(n-1,1);
        headTerm.addOptions('b("to ")');
        headTerm.addOptions('t("b")');
    }
    // process nominals (other cases to process...)
    const nominals=["NOUN","PROPN","PRON","NUM","ADJ"];
    if (nominals.indexOf(upos)>=0){
        return this.processNominal(headTerm,sentOptions);
    }
    // // check coordination
    if (this.right.findIndex(udt=>udt.matches("conj",_,_))>0){ // conj should not be first child
        return this.processCoordination("VP",headTerm,sentOptions);
    }
    // check future tense
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="will"){
        dep.splice(idx,1);
        headOptions.push(`t("f")`);
    }
    // check adverbial phrase
    if (upos=="ADV"){
        let advp=new JSR("AdvP",this.left.map(c=>c.toConstituent()));
        advp.children.push(headTerm.addOptions(headOptions));
        appendTo(advp.children,this.right.map(c=>c.toConstituent()));
        return advp.addOptions(sentOptions);
    }
    
    // process clause with S(subject, VP(head,rightchildren))
    //  because processChildren might change the head, we have to build the expression bottom-up
    
    let vp=new JSR("VP",this.right.map(c=>c.toConstituent()));
    vp.children.unshift(headTerm.addOptions(headOptions));
    if (this.left.length>0) {
        // check passive
        idx=this.left.findIndex(udt=>udt.matches("aux:pass","AUX"))
        if (idx>=0 && this.left[idx].getLemma()=="be"){
            let [aux]=this.left.splice(idx,1);
            let be=aux.toTerminal();
            if (idx>0){
                let prev=this.left[idx-1];
                if (prev.getUpos()=="PART" && prev.getLemma()=="to"){
                    be.addOptions(['t("b")','b("to ")']);
                    this.left.splice(idx-1,1);
                }
            }
            vp.children.unshift(be);
        }
        let s=new JSR("S",this.left.map(c=>c.toConstituent()));
        // change a VP(V(..).t("pr"),...) to a SP(V(...).t("pr"),...)
        if (s.children.length>0 && s.children[0].isA("VP")){
            const vp=s.children[0];
            if (vp.children[0].isA("V") && vp.children[0].options.indexOf('t("pr")')>=0)
                vp.constName="SP";
        }
        s.children.push(vp)
        return s.addOptions(sentOptions);
    }
    return vp.addOptions(sentOptions);
}

UDnode.prototype.getSentOptions=function(){
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
            let options=[`mod:"${mod}"`];
            if (["could","might","should","would","ought"].indexOf(lemma)>=0)
                options.unshift('t("ps")'); // set past tense
            return this.getSentOptions().concat(options);
        }
    }
    // match all sentenceTypes...
    if (this.hasFeature("VerbForm","Prog")){
        [dep,idx]=this.findDeprelUpos("aux","AUX");
        if (idx>=0 && dep[idx].getLemma()=="be"){
            this.deleteFeature("VerbForm"); // the gerund form will be generated by sentence type
            dep.splice(idx,1);
            return this.getSentOptions().concat([`prog:true`]);
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
                return this.getSentOptions().concat([`perf:true`]);
            }
        }
    }
    [dep,idx]=this.findDeprelUpos("advmod","PART");
    if (idx>=0 && dep[idx].getLemma()=="not"){
        dep.splice(idx,1);
        [dep1,idx1]=this.findDeprelUpos("aux","AUX");
        if (idx1>=0 && dep1[idx1].getLemma()=="do"){
            dep1.splice(idx1,1);
        }        
        return this.getSentOptions().concat([`neg:true`]);
    }
    [dep,idx]=this.findDeprelUpos("advmod","ADV");
    if (idx>=0){
        const adv=dep[idx].getLemma();
        if (adv=="why" || adv=="how" || adv=="when"){
            [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
            if (idx1>=0 && dep1[idx1].getLemma()=="?"){
                dep1.splice(idx1,1);
                dep.splice(idx,1);
                return this.getSentOptions().concat([`int:"${adv}"`]);
            }
        }
    }
    [dep,idx]=this.findDeprelUpos("aux","AUX");
    if (idx>=0 && dep[idx].getLemma()=="do"){
        [dep1,idx1]=this.findDeprelUpos("punct","PUNCT");
        if (idx1>=0 && dep1[idx1].getLemma()=="?"){
            dep1.splice(idx1,1);
            dep.splice(idx,1);
            return this.getSentOptions().concat([`int:"yon"`]);
        }
    }
    return [];
}
