import {UDnode,_} from "./UDnode.js";
import {applyOptions,checkLast} from "./UD2jsr.js"
export {UDnode_fr};

// French version
class UDnode_fr extends UDnode {

    constructor(lineNumber, fields){
        super(lineNumber,fields)
    }
    
    toTerminal(){
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
            return Pro(form)
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
            return this.feats2options(A(lemma).pos(this.position=="l"?"pre":"post"),["Gender","Number"])
        case "ADV":
            return Adv(lemma);
        case "INTJ":
            return Q(lemma);
        case "NOUN":
            return this.feats2options(N(lemma),["Gender","Number","Person","Tense","Degree"])
        case "PROPN":
            return Q(lemma)
        case "VERB": case "AUX":
            return this.feats2options(V(lemma),["Mood","VerbForm","Tense","Person","Number","Gender"]);
            // Closed classes
        case "ADP":
            return P(lemma);
        case "CCONJ":
            return C(lemma);
        case "DET":
            if (this.hasFeature("Poss","Yes")){
                return this.feats2options(possessiveDeterminer(lemma,this.hasFeature("Number_psor","Plur")),
                                    ["Person","Person_psor","Gender","Number","Number_psor"]);
            }
            const definite=this.getFeature("Definite");
            if (definite != undefined){
                return this.feats2options(D(lemma),["Person","Gender","Number"]);
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
            if (this.hasFeature("Reflex","Yes")){
                return this.feats2options(Pro("moi").c("refl"),["Person","Gender","Number"]);
            }
            let pro;
            if (this.hasFeature("Poss","Yes") && this.hasFeature("PronType","Prs")){
                pro=possessivePronoun(this.getForm().toLowerCase());
            }
            if (lemma=="lui"){
                if (this.getForm()=="lui"){
                    return Pro("lui").tn("")
                } else {
                    pro = Pro("moi")
                    if (/^(il|ils)$/i.test(this.getForm()))
                        if (!this.hasFeature("Case"))
                            pro.c("nom")
                }
            }
            if(pro===undefined)
                pro=tonicPronoun(this.getForm().toLowerCase(),lemma);
            // HACK: this should be done using "lier()" with the previous word or add a new terminal
            //   but this would imply knowing the previous token, not available right now or returning a list of tokens
            if (this.getForm().startsWith("-"))pro.b("-");
            if (this.hasFeature("Case"))
                return this.feats2options(pro,["Case","Person","Gender","Number","Reflex"]);
            else {
                pro = this.feats2options(pro,["Person","Person_psor","Gender","Number","Number_psor","Reflex"])
                if (this.deprel=='nsubj')pro.c("nom")
                else if (this.deprel=="obj")pro.c("acc")
                else if (this.deprel=='iobj')pro.c("dat");
                return pro;
            }
            break;
        case "SCONJ":
            return C(lemma)
        case "PUNCT": case "SYM": case "X":
            return Q(lemma);
        default:
            console.log("UPOS inconnu:%s",upos)
            return Q(this.getForm())
        }
    }


    // modify the UD structure to better reflect the structure expected by jsRealB
    toDependent(isSUD){
        const cmpTenses = {"Pres":["Ppc","Ppce"],
                             "Imp": ["Ppq","Ppqe"],
                             "Past":["Ppa","Ppae"],
                             "Fut": ["Pfa","Pfae"]}
       // check coordination
        if (this.right.findIndex(udt=>udt.matches("conj",_))>=0){ 
            return this.processCoordination([],isSUD);
        }
        
        // find the sentence type 
        //   must be called before because it might change the structure
        let sentOptions=this.getSentOptions();
        let res = this.toDependent_common(sentOptions,isSUD)
        if (res !== undefined) return res;
 
        // check for "passé composé" when verb is past participle and a left child is an AUX
        //  remove AUX and add "special" tense (Ppc) to the verb for processing in toTerminal()
        if (["VERB","AUX"].includes(this.getUpos())){
            if (this.hasFeature("Tense","Past") && this.hasFeature("VerbForm","Part")){
                for (let i=0;i<this.left.length;i++){
                    const leftChild=this.left[i];
                    if (leftChild.getUpos()=="AUX" && leftChild.hasFeature("VerbForm","Fin")){
                        const t = leftChild.getFeature("Tense")
                        if (t !== undefined){
                            this.setFeature("Tense",cmpTenses[t][leftChild.lemma == "avoir" ? 0 : 1]);
                            this.deleteFeature("VerbForm");
                            this.left.splice(i,1); // remove aux
                            // check for advmod-ADV before the verb and the old auxiliary
                            // set its position after
                            for (let k=i;k<this.left.length;k++){
                                if (this.left[k].deprel=="advmod" && this.left[k].upos=="ADV"){
                                    this.left[k].position="r"
                                }
                            }
                            break;
                        }
                    }
                }
            }
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
        // process the rest by the common traversale
        return applyOptions(this.childrenDeps(headTerm,isSUD),sentOptions)
    }

    // generate options in the form of a list of [name of optionFunction,parameter]
    //  not very useful in French
    getSentOptions(isSUD){
        // check for a "ne" ... "pas" in both left and right dependents 
        let advs=[], neIdx;
        // find all adverbs, keeping track of "ne"
        [this.left,this.right].forEach( function(deps){
            deps.forEach(function(udt,i){
                if(udt.deprel=="advmod" && udt.upos=="ADV"){
                    if (udt.lemma=="ne"){
                        neIdx=advs.length;
                    }
                    advs.push([deps,i])
                }
            })
        })
        // 
        if (neIdx!==undefined){ // possible negation
            // find next adverb following "ne"
            for (let j=neIdx+1;j<advs.length;j++){
                const [deps,i]=advs[j];
                if (["pas","jamais","plus","guère"].includes(deps[i].lemma)){
                    // found a negation...
                    let negParam=deps[i].lemma;
                    if (negParam=="pas")negParam=true;
                    deps.splice(i,1);
                    const [depsNe,iNe]=advs[neIdx];
                    depsNe.splice(iNe,1);
                    return this.getSentOptions().concat([["typ",{"neg":negParam}]])
                }
            }
        }
        
        // check for interrogative with final ? and remove an expl:subj pronoun to the right
        if (checkLast(this.right,e=>e.lemma == "?") !== null){
            let [dep,idx] = this.findDeprelUpos("expl:subj","PRON");
            if (idx>=0){
                dep.splice(idx,0)
                this.right.pop()
                return this.getSentOptions().concat([["typ",{"int":"yon"}]])
            }
        }

        return [];
    }
}