export {UDnode,applyOptions,_};

if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
    let {default:jsRealB} = await import("../../dist/jsRealB.js");
    Object.assign(globalThis,jsRealB);
}

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
        if (arguments.length == 1) { // clone this object
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
        return (deprel == _ || this.deprel == deprel) &&
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
    toConstituent(isLeft, isSUD) {
        if (this.isTerminal())
            return this.toTerminal();
        // this.processFixedFlat();
        return this.toDependent(isLeft, isSUD);
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
    // generate a string from the forms in the tree by an inOrder traversal
    getTokens() {
        let res = this.left.map(n => n.getTokens()).flat();
        res.push(this.form);
        return res.concat(this.right.map(n => n.getTokens()).flat());
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
            n = right.length;
            for (let i = n - 1; i >= 0; i--) { // process in reverse so that indices stay the same after splice
                if (right[i].getDeprel() == "conj") {
                    conjs.push(right[i]);
                    right.splice(i, 1); // remove conj link
                }
            }
            conjs.reverse(); // recover original order
        }
        // process first
        let deprel;
        const firstConst = this.toConstituent(null, isSUD);
        if (firstConst instanceof Dependent) {
            deprel = firstConst.constType;
            if (deprel == "root")
                deprel = "subj";
        } else {
            deprel = "mod";
        }

        let conjChildren = [firstConst];

        // remove punct
        if (this.right.length > 0) {
            const [last] = this.right.slice(-1);
            if (last.getDeprel() == "punct" && last.getUpos() == "PUNCT" && last.getLemma() == ",")
                this.right.splice(-1, 1);
        }
        // appendTo(depChildren,conjs.map(c=>new Dependent([c.toConstituent(false,false)],"mod")));
        // process other children and pick the conjunction
        // we conjecture that NP take their argument to the left and VP to the right
        n = conjs.length;
        let hasOxfordComma = false;
        for (let i = 0; i < n; i++) {
            let ci = conjs[i];
            let [dep, idx] = ci.findDeprelUpos("cc", _);
            if (idx >= 0) { // remove it
                c = dep[idx];
                dep.splice(idx, 1);
            }
            // remove also front comma...
            if (ci.left.length > 0) {
                const first = ci.left[0];
                if (first.getDeprel() == "punct" && first.getUpos() == "PUNCT" && first.getLemma() == ",") {
                    ci.left.splice(0, 1);
                    if (i == n - 1)
                        hasOxfordComma = true;
                }
            }
            conjChildren.push(ci.toConstituent(null, isSUD));
        }
        let coordTerm = c === undefined ? Q("") : c.toConstituent(null, isSUD);
        // create coordination
        if (coordTerm instanceof Dependent) {
            // some strange coordination term (e.g. "ainsi que"), create specific a constant by realizing the dependent
            coordTerm = Q(coordTerm.realize());
        }
        if (hasOxfordComma)
            coordTerm.b(",");
        let coordDep = coord(coordTerm);
        for (let child of conjChildren) {
            if (child instanceof Terminal) {
                coordDep.add(new Dependent([child], deprel), undefined, true);
            } else {
                if (child.constType != deprel)
                    child.changeDeprel(deprel);
                coordDep.add(child, undefined, true);
            }
        }
        return applyOptions(coordDep, sentOptions);
    }
    
    //  create a dependent by mapping the deprel name to a jsRealB one
    childrenDeps(head, isLeft, isSUD) {
        const deprel = (isSUD ? sud2jsrdeprel : ud2jsrdeprel)(this.deprel);
        let dep = new Dependent([head], deprel);
        if (isLeft !== null) { // isLeft is null when processing a coordination that should be left as is
            if (isLeft && ["mod", "comp"].indexOf(deprel) >= 0)
                dep.pos("pre");
            if (!isLeft && ["det", "subj"].indexOf(deprel) >= 0)
                dep.pos("post");
        }
        if (this.left.length > 0) {
            const first = this.left[0];
            if (first.getDeprel() == "punct") { // add first punct as option b()
                dep.b(first.getLemma());
                this.left.shift();
            }
            this.left.forEach(n => dep.add(n.toDependent(true, isSUD), undefined, true));
        }
        if (this.right.length > 0) {
            const last = this.right[this.right.length - 1];
            if (last.getDeprel() == "punct") { // add last punct as option a()
                dep.a(last.getLemma());
                this.right.pop();
            }
            this.right.forEach(n => dep.add(n.toDependent(false, isSUD), undefined, true));
        }
        return dep;
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

const udMapping = { 
    // core arguments
    "nsubj":"subj","csubj":"subj",
    "obj":"comp","ccomp":"comp",
    "iobj":"comp","xcomp":"comp",
    // non-core dependents
    "obl":"comp","advcl":"mod","advmod":"mod","aux":"mod",
    "vocative":"mod","discourse":"mod","cop":"mod",
    "expl":"mod","mark":"mod",
    // nominal dependents
    "nmod":"mod","acl":"comp","amod":"mod","det":"det",
    "appos":"mod","clf":"mod",
    "nummod":"mod","case":"mod",
    // coordination
    "conj":"mod","cc":"mod",
    // multiword expressions
    "fixed":"mod","flat":"mod","compound":"mod",
    // loose
    "list":"mod","parataxis":"mod",
    // special
    "orphan":"mod","goeswith":"mod","reparandum":"mod",
    // other
    "punct":"mod","root":"root","dep":"comp",
};

function ud2jsrdeprel(udDeprel){
    const idColon=udDeprel.indexOf(":"); // ignore colon and after
    if (idColon>=0)udDeprel=udDeprel.substring(0,idColon);
    const deprel=udMapping[udDeprel]
    if (deprel === undefined){
        console.log("unknown UD deprel : %s",udDeprel);
        return "comp";
    }
    return deprel;    
}

// combine all typ options into a single list and apply other options directly to a dependent
function applyOptions(dep,options){
    let typOpts={};
    for (let i = 0; i < options.length; i++) {
        let [key,val]=options[i];
        if (key=="typ")
            typOpts=Object.assign(typOpts,val);
        else 
            Constituent.prototype[key].call(dep,val)
    }
    if (Object.keys(typOpts).length>0)
        Constituent.prototype.typ.call(dep,typOpts);
    return dep
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
