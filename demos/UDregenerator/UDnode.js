import {mood, verbform, tenses, person, person_psor, number, number_psor, case_, definite, gender, gender_psor,
        degree, pronType, numtype, reflex, udMapping, getOption, ud2jsrdeprel, applyOptions, checkFirst, checkLast} from "./UD2jsr.js"
export {UDnode,_};

if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
    let {default:jsRealB} = await import("../../dist/jsRealB.js");
    Object.assign(globalThis,jsRealB);
}

const pairs = {"()":"(",
               "[]":"[",
               "{}":"{",
               "\"\"":"\"",
               "''":"'",
               "«»":"«"}

// keep information about a single node in the tree
// with the following fields taken from a line of the file
//   lineNumber : lineNumber in the file
//   id : line id of the dependency
//   form
//   lemma
//   upos
//   feats : list of [key,val]
//   head : index of the head
//   misc  : list of [key,val]
//   deprel :
//   left : list of UDnode
//   right: list of UDnode
//   parent: UDnode (null if root)
//   position: "l" or "r"
//   indexInText: character position in the sentence (text)  of the start of this token [set in UD.js]

// parse a dependency line
// https://universaldependencies.org/format.html
class UDnode {
    constructor(lineNumber, fields) {
        // fields has a dummy zero element to match conventional UD field numbering
        function makeFeats(featsString) {
            if (featsString == "_")
                return {};
            let feats = {};
            featsString.split("|").forEach(function (kv) {
                const keyVal = kv.split("=");
                const m = /(.*?)\[(.*?)\]/.exec(keyVal[0]);
                if (m == null)
                    feats[keyVal[0]] = keyVal[1];

                else
                    feats[m[1] + "_" + m[2]] = keyVal[1];
            });
            return feats;
        }
        if (fields === undefined) { // clone this object
            const udNode = lineNumber; // change name of parameter
            if (Object.keys(udNode) == 0)
                return; // dummy element
            this.id = udNode.id;
            this.form = udNode.form;
            this.lemma = udNode.lemma;
            this.upos = udNode.upos;
            this.feats = JSON.parse(JSON.stringify(udNode.feats));
            this.head = udNode.head;
            this.deprel = udNode.deprel;
            this.misc = JSON.parse(JSON.stringify(udNode.misc));
            this.left = [];
            this.right = [];
            return;
        }
        this.lineNumber = lineNumber;
        this.id = parseInt(fields[1]);
        this.form = fields[2];
        this.lemma = fields[3];
        this.upos = fields[4];
        this.xpos = fields[5]; // unused
        this.feats = makeFeats(fields[6]);
        this.head = parseInt(fields[7]);
        this.deprel = fields[8];
        this.deps = fields[9]; // unused
        this.misc = makeFeats(fields[10]);
        this.left = [];
        this.right = [];
    }
    addToLeftOf(node) {
        this.parent = node;
        node.left.push(this);
        this.position = "l";
    }
    addToRightOf(node) {
        this.parent = node;
        node.right.push(this);
        this.position = "r";
    }
    showHead() {
        return `${this.lemma} : ${this.upos} : ${this.feats.map(kv => kv[0] + "=" + kv[1]).join("|")}`;
    }
    pp(level) {
        const indent = n => Array(n * 3).fill(" ").join("");
        let res = "";
        this.left.forEach(n => res += n.pp(level + 1));
        res += indent(level) + this.showHead() + "\n";
        this.right.forEach(n => res += n.pp(level + 1));
        return res;
    }
    isTerminal() {
        return this.left.length == 0 && this.right.length == 0;
    }

    matches(deprel, upos) {
        function eqDR(thisDepRel){ // HACK: save "this" as the enclosing one...
            if (Array.isArray(deprel))
                return deprel.includes(thisDepRel)
            return thisDepRel==deprel
        }
        return (deprel == _ || eqDR(this.deprel)) &&
            (upos == _ || this.upos == upos);
    }
    getDeprel() {
        return this.deprel;
    }
    getLemma() {
        return this.lemma;
    }
    getForm() {
        return this.form;
    }
    getUpos() {
        return this.upos;
    }
    hasFeature(key, val) {
        const value = this.feats[key];
        return (value !== undefined && (val == _ || val === undefined || value == val));
    }
    hasNoFeature() {
        return Object.keys(this.feats).length === 0;
    }
    getFeature(key) {
        return this.feats[key];
    }
    setFeature(key, value) {
        return this.feats[key] = value;
    }
    deleteFeature(key) {
        delete this.feats[key];
    }
    selectFeature(key) {
        if (key in this.feats) {
            const val = this.feats[key];
            delete this.feats[key];
            return val;
        }
    }
    hasNoSpaceAfter() {
        return this.misc["SpaceAfter"] == "No";
    }
    toConstituent(isSUD) {
        if (this.isTerminal())
            return this.toTerminal();
        // this.processFixedFlat();
        return this.toDependent(isSUD);
    }
    isPunct() {
        this.upos == "PUNCT" || (this.upos == "PART" && this.lemma == "'");
    }
    options2feats(options) {
        const keys = Object.keys(options);
        if (keys.length == 0)
            return "_";
        let res = [];
        for (let key of keys) {
            const val = options[key];
            if (key == "Number_")
                key = "Number";
            else if (key.endsWith("_psor"))
                key = key.substring(0, key.length - 5) + "[psor]";
            res.push(key + (val === undefined ? "" : ("=" + val))); //some misc values are undefined
        }
        return res.join("|");
    }
    // regenerate CONLLU format
    conll() {
        return this.conllLine;
    }
    //  check if deprel is present with corresponding features, return [children list,index] 
    findDeprelUpos(deprel, upos) {
        let idx = this.left.findIndex(udt => udt.matches(deprel, upos));
        if (idx >= 0)
            return [this.left, idx];
        idx = this.right.findIndex(udt => udt.matches(deprel, upos));
        if (idx >= 0)
            return [this.right, idx];
        return [undefined, -1];
    }
    // find the projection of head as a sorted list of numbers
    //    if the result is a consecutive array of numbers return it, otherwise return null
    // idea adapted from 
    //     Sylvain Kahane, Alexis Nasr, and Owen Rambow.
    //     Pseudo-projectivity, a polynomially parsable non-projective dependency grammar. 
    //     In 36th Annual Meeting of the Association for Computational Linguistics and 
    //     17th International Conference on Computational Linguistics, Volume 1, pages 646–652, 
    //     Montreal, Quebec, Canada, August 1998. 
    project() {
        // check if the numbers in the array s are consecutive
        function checkConsecutive(s) {
            if (s.length <= 1)
                return true;
            let current = s[0] + 1;
            for (let i = 1; i < s.length; i++) {
                if (s[i] != current)
                    return false;
                current++;
            }
            return true;
        }

        let s = [this.id];
        let ls = this.left;
        if (ls.length > 0) {
            for (let i = 0; i < ls.length; i++) {
                const p = ls[i].project();
                if (p == null)
                    return null; // stop as soon it is not projective
                s = s.concat(p);
            }
        }
        let rs = this.right;
        if (rs.length > 0) {
            for (let i = 0; i < rs.length; i++) {
                const p = rs[i].project();
                if (p == null)
                    return null; // stop as soon it is not projective
                s = s.concat(p);
            }
        }
        s.sort(function (a, b) { return a - b; }); // sort numbers because by default sort does it alphabetically...
        if (checkConsecutive(s))
            return s;
        return null;
    }
    // simplified implementation of the above
    isProjective(){
        let cnt = 1;
        function check(node){
            for (let n of node.left){
                if (!this.check(n)) return false;
            }
            if (node.id == cnt) cnt++;
            for (let n of node.right){
                if (!this.check(n)) return false;
            }
            return true;
        }
        return this.check(cnt)
    }
    
    // generate a string from the forms in the tree by an inOrder traversal
    getTokens() {
        let res = this.left.map(n => n.getTokens()).flat();
        res.push(this.form);
        return res.concat(this.right.map(n => n.getTokens()).flat());
    }

    check(feat,fields){
        const val = this.getFeature(feat)
        if (val !== undefined)
            return getOption(feat,fields,val)
    }
    
    feats2options(constituent,selFeats){
        
        if (this.hasNoFeature() || constituent.isA("Q"))return constituent;
        for (const selFeat of selFeats){
            switch (selFeat) {
            case "Mood":
                const moodVal=this.selectFeature("Mood")
                if (moodVal !== undefined){
                    const tense=this.selectFeature("Tense")
                    if (tense !==undefined){
                        const jsrTense=getOption(`Mood[${moodVal}]`,mood[moodVal],tense)
                        if (jsrTense !== null){
                            constituent.t(jsrTense)
                        }
                    } else if (moodVal == "Imp"){
                        constituent.t("ip")
                        this.deleteFeature("Tense")
                    }
                }
                break;
            case "VerbForm":
                const formVal=this.selectFeature("VerbForm")
                if (formVal !== undefined){
                    if (formVal=="Part" && this.hasFeature("Tense")){
                        const jsrTense=this.selectFeature("Tense");
                        if (jsrTense=="Pres")constituent.t("pr");
                        else if (jsrTense=="Past")constituent.t("pp")
                    } else if (["Inf","Ger"].includes(formVal)) {
                        constituent.t(verbform[formVal])
                    } else {
                        const tense=this.selectFeature("Tense");
                        if (tense !== undefined){
                            const jsrTense = getOption("Tense",tenses,tense);
                            constituent.t(jsrTense);
                            if (["Ppce", "Ppae","Ppqe","Pfae"].includes(formVal))
                                constituent.aux("êt");
                        }
                    }
                }
                break;
            case "Tense":
                const tense1=this.selectFeature("Tense")
                if (tense1 !==undefined){
                    const jsrTense=getOption("Tense",tenses,tense1)
                    if (jsrTense !== null){
                        constituent.t(jsrTense);
                        if (["Ppce", "Ppae","Ppqe","Pfae"].includes(tense1))constituent.aux("êt")
                    }
                }
                break;
            case "Person":
                const jsrPe = this.check("Person",person)
                if (jsrPe !== undefined && constituent.getProp("pe")!=jsrPe) constituent.pe(jsrPe);
                break;
            case "Person_psor":
                const jsrPe_psor = this.check("Person_psor",person)
                if (jsrPe_psor !== undefined && constituent.getProp("pe")!=jsrPe_psor) constituent.pe(jsrPe_psor)
                break;
            case "Number":
                const jsrN = this.check("Number",number)
                if (jsrN !== undefined && constituent.getProp("n")!=jsrN) constituent.n(jsrN);
                break;
            case "Number_psor":
                const jsrN_psor = this.check("Number_psor",number)
                if (jsrN_psor !== undefined && constituent.getProp("n")!=jsrN_psor) constituent.n(jsrN_psor);
                break;
            case "Case":
                const jsrC = this.check("Case",case_)
                if (jsrC !== undefined && constituent.getProp("c")!=jsrC) constituent.c(jsrC);
                break;
            case "Definite":
                this.selectFeature("Definite") // ignore
                break;
            case "Gender":
                const jsrG = this.check("Gender",gender)
                if (jsrG !== undefined && constituent.getProp("g")!=jsrG) constituent.g(jsrG);
                break;
            case "Gender_psor":
                const jsrG_psor = this.check("Gender_psor",gender)
                if (jsrG_psor !== undefined && constituent.getProp("g")!=jsrG_psor) constituent.g(jsrG_psor);
                break;
            case "Degree":
                const jsrDeg = this.check("Degree",degree)
                if (jsrDeg != null) constituent.f(jsrDeg);
                break;
            case "PronType":
                this.selectFeature("PronType") // ignore
                break;
            case "NumType":
                this.selectFeature("NumType") // ignore
                break;
            case "Reflex":
                const jsrRefl = this.check("Reflex",reflex)
                if (jsrRefl !== undefined) constituent.c(jsrRefl);
                break;
                
            default:
                console.log("Strange feature:%s in %o",selFeat,this)
            }
        }
        return constituent
    }
    
    
    /// useful for examples in the paper
    toJSON(level) {
        const spaces = n => Array(n).fill(" ").join("");
        const s = spaces(level);
        let res = [`{"deprel":"${this.deprel}", "upos":"${this.upos}", "lemma":"${this.lemma}",` +
            ` "form":"${this.form}", "id":${this.id}, "head":${this.head}`];
        if (!this.hasNoFeature())
            res[0] += ', "feats":' + JSON.stringify(this.feats);
        if (this.left.length > 0) {
            res.push(' "left":[' + this.left.map(n => n.toJSON(level + 9)).join(",\n" + spaces(level + 9)) + "]");
        }
        if (this.right.length > 0) {
            res.push(' "right":[' + this.right.map(n => n.toJSON(level + 10)).join(",\n" + spaces(level + 10)) + "]");
        }
        return res.join(",\n" + s) + "}";
    }
    // short version of the preceding
    toJSON0(level) {
        const spaces = n => Array(n).fill(" ").join("");
        const s = spaces(level);
        let res = [`{"deprel":"${this.deprel}", "lemma":"${this.lemma}", ...`];
        // if (!this.hasNoFeature())
        //     res[0]+=', "feats":'+JSON.stringify(this.feats);
        if (this.left.length > 0) {
            res.push(' "left":[' + this.left.map(n => n.toJSON0(level + 9)).join(",\n" + spaces(level + 9)) + "]");
        }
        if (this.right.length > 0) {
            res.push(' "right":[' + this.right.map(n => n.toJSON0(level + 10)).join(",\n" + spaces(level + 10)) + "]");
        }
        return res.join(",\n" + s) + "}";
    }
    // process coordination by gathering all children (starting at the second one) in a list 
    // creating phrase with the first child and then adding the CP
    processCoordination(sentOptions, isSUD) {
        function removeCommaCoord(n){
            // remove front comma if it exists,
            // if it is a coord return it otherwise return null
            if (n.left.length>0){
                const first = n.left[0]
                if (first.deprel=="punct" && first.upos=="PUNCT" && first.lemma == ","){
                    n.left.shift()
                } else if (first.deprel=="cc" && first.upos == "CCONJ"){
                    n.left.shift()
                    return first
                }
            }
            return null
        }
        // split coordination children into separate trees that will be processed separately
        // according to https://surfacesyntacticud.github.io/guidelines/u/particular_phenomena/coord/
        let conjs = [];
        let n, c;
        if (isSUD) {
            // In SUD, each conjunct is attached to the head of the previous one in a chain.
            let current = this;
            let [dep, idx] = current.findDeprelUpos("conj", _);
            while (idx >= 0) {
                if (dep === current.right) {
                    current = dep[idx];
                    const cc = removeCommaCoord(current)
                    if (cc !== null) c= cc;
                    conjs.push(current);
                    dep.splice(idx, 1); // remove conj link
                    [dep, idx] = current.findDeprelUpos("conj", _);
                } else {
                    console.log("conj is not a right child", dep, idx);
                    idx = -1;
                }
            }
        } else {
            // In UD, all conjuncts of a coordination are attached to the head of the first conjunct in a bouquet.
            let right = this.right;
            // remove possible ending punct
            const last = checkLast(this.right,e=>e.deprel == "punct" && e.upos=="PUNCT")
            if (last !== null){
                sentOptions.push(["a",last.lemma])
                this.right.pop()                
            }
            n = right.length;
            for (let i = n - 1; i >= 0; i--) { // process in reverse so that indices stay the same after splice
                if (right[i].deprel == "conj") {
                    const cc = removeCommaCoord(right[i])
                    if (cc !== null)c = cc;
                    conjs.push(right[i])
                    right.splice(i, 1); // remove conj link
                }
            }
            conjs.reverse(); // recover original order
        }

        let deprel = ["nsubj","csubj"].includes(this.deprel) ? "subj" : "mod";
        let conjChildren =[this.toConstituent(isSUD)]
        // combine children
        for (let conj of conjs){
            conjChildren.push(conj.toConstituent(isSUD))
        }

        let coordTerm = c === undefined ? Q("") : c.toConstituent(isSUD);
        // create coordination
        if (coordTerm instanceof Dependent) {
            // some strange coordination term (e.g. "ainsi que"), create specific a constant by realizing the dependent
            coordTerm = Q(coordTerm.realize());
        }
        let coordDep = coord(coordTerm);
        for (let child of conjChildren) {
            if (child instanceof Terminal) {
                coordDep.add(dependent(deprel,[child]));
            } else {
                if (child.constType != deprel)
                    child.changeDeprel(deprel);
                coordDep.add(child);
            }
        }
        return applyOptions(coordDep,sentOptions);
    }
           
    //  create a dependent by mapping the deprel name to a jsRealB one
    childrenDeps(head, isSUD) {
        const deprel = (isSUD ? sud2jsrdeprel : ud2jsrdeprel)(this.deprel);
        let dep = dependent(deprel,[head]);
        // check for a pair of surrounding punctuation
        const first = checkFirst(this.left,e => e.deprel == "punct")
        const last  = checkLast(this.right,e => e.deprel == "punct")
        if (first !== null && last !== null){
            const combined = first.lemma + last.lemma;
            const jsrBA = pairs[combined]
             if (jsrBA !== undefined){
                dep.ba(jsrBA)
                this.left.shift()
                this.right.pop()
            }
        } else if (first !== null) { // add first punct as option b()
            dep.b(first.getLemma());
            this.left.shift();            
        } else if (last !== null) { // add last punct as option a()
            dep.a(last.getLemma());
            this.right.pop();            
        }
        this.left.forEach(n => dep.add(n.toDependent(isSUD)));
        this.right.forEach(n => dep.add(n.toDependent(isSUD)));
        
        if (this.position=="l" && ["mod", "comp"].includes(deprel)) 
            dep.pos("pre");
        if (this.position=="r" && ["det", "subj"].includes(deprel))
            dep.pos("post");
        return dep;
    }
    
    // change a cop upos to an aux (caution delicate HACK...)
    // it must be done before anything else...
    // this allows creating a sentence of the type root(V(be),subj(),comp(...)) from a dependency
    // having a noun or an adjective as root
    move_copula(dep,idx){
        let [newAux]=dep.splice(idx,1);
        if (newAux.hasFeature("VerbForm","Inf")) // ensure verb is conjugated
            newAux.deleteFeature("VerbForm");
        let [dep1,idx1]=this.findDeprelUpos(["nsubj", "expl:subj"],_); 
        let subj;
        if (idx1>=0){
            [subj]=dep1.splice(idx1,1);
            subj.addToLeftOf(newAux) // add as subject of the new auxiliary 
        }
        // TODO: update parent of the new auxiliary
        newAux.deprel="aux";
        this.deprel="xcomp"; // change this to the complement of the new auxiliary
        newAux.right.unshift(this);
        this.position="r"
        // push what was before the "old" subject to the front of the new auxiliary
        // only do this for a subject in front of the current node
        if (subj !== undefined && dep1 === this.left){
            for(let k=idx1-1;k>=0;k--){
                const [x] = this.left.splice(k,1)
                newAux.left.unshift(x)
                x.position="l"
            }
        }
        this.parent = newAux
        this.position = "r"
        return newAux        
    }
    
    // language independent transformations
    toDependent_common(sentOptions,isSUD){
        function isModal(option){
            let [key,val]=option;
            if (key!="typ")return false;
            return val.hasOwnProperty("mod")
        }

        if (!isSUD){ // in SUD, the copula is already the root so no change is needed
            // check for copula
            const modalIdx=sentOptions.findIndex(isModal)
            const copUpos = modalIdx<0 ? "AUX" : "VERB";  // with a modal, the UPOS is VERB
            let [dep,idx]=this.findDeprelUpos("cop",copUpos);
            if (idx>=0){
                const newAux = this.move_copula(dep,idx)
                return applyOptions(newAux.toDependent(),sentOptions)
            }
        }
        // check for a simple prepositional phrase
        if (this.left.length>1){
            const first = checkFirst(this.left,e => ["case","mark"].includes(e.deprel) && e.upos=="ADP")
            if (first !== null){
                    const prep = first.lemma
                    this.left.shift()
                    let expr = this.toDependent();
                    expr.add(mod(P(prep)).pos("pre"),0)
                    return applyOptions(expr,sentOptions)
                }
        }
    }   
}

const sudMapping ={
    "root":"root",
    "unk":"mod",
    "subj":"subj","udep":"mod",
    "mod":"mod",
    "comp":"comp","comp:obl":"comp","comp:obj":"comp","comp:aux":"comp","comp:cleft":"comp","comp:pred":"comp",
    "vocative":"mod","discourse":"mod",
    "appos":"mod","det":"det","clf":"mod","conj":"mod","cc":"mod","flat":"mod","dislocated":"mod",
    "compound":"mod","list":"mod","parataxis":"mod",
    "orphan":"mod","goeswith":"mod","reparandum":"mod",
    "punct":"mod",
    }


function sud2jsrdeprel(sudDeprel){
    const idAt=sudDeprel.indexOf("@"); // ignore @ and the rest
    if (idAt>=0)sudDeprel=sudDeprel.substring(0,idAt);
    const deprel=sudMapping[sudDeprel]
    if (deprel === undefined){
        console.log("unknown SUD deprel : %s",sudDeprel);
        return "comp";
    }
    return deprel;
}


// ///////// Regenerate the tokens from the forms in the tree in order to do a "sanity check" on the dependency
// //  CAVEAT:
// //     in principle, the order of the generated tokens should be the same as the original
// //     but not necessarily in the case of non-projective dependencies
// //         there are also cases where the "wrong" dependencies will linearize in the same list of tokens
// //   Finally it seems (but I did not prove it) that this test will never show anything on a projective dependency
// // do an inorder traversal of the tree to create a list of list... of tokens
// function depsToTokens(deps,head){
//     let tokens=[];
//     deps[head].left.forEach(function(h){ tokens.push(depsToTokens(deps,h)) })
//     tokens.push(deps[head].form);
//     deps[head].right.forEach(function(h){ tokens.push(depsToTokens(deps,h)) })
//     return tokens;
// }
//
// // produce a list of tokens by doing an inorder traversal of the tree
// function baselineGen(depsInfo){
//     let tokens=[];               // list of tokens to build
//     const deps=depsInfo.deps;
//     function inOrder(head){
//         deps[head].left.forEach(c=>inOrder(c)); // traverse left
//         tokens.push(deps[head].form);           // add a token
//         deps[head].right.forEach(c=>inOrder(c));// traverse right
//     }
//     inOrder(depsInfo.root);
//     return tokens.join(" ");
// }

const _ = "ANYTHING";  // like in Prolog
