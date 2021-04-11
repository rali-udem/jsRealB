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


// parse a dependency line
// https://universaldependencies.org/format.html
function UDnode(lineNumber,fields){
    // fields has a dummy zero element to match conventional UD field numbering
    function makeFeats(featsString){
        if (featsString=="_")return {};
        let feats={};
        featsString.split("|").forEach(function(kv){
            const keyVal=kv.split("=");
            const m=/(.*?)\[(.*?)\]/.exec(keyVal[0]);
            if (m==null)
                feats[keyVal[0]]=keyVal[1];
            else
                feats[m[1]+"_"+m[2]]=keyVal[1];
        })
        return feats;
    }
    if (arguments.length==1){// clone this object
        const udNode=lineNumber; // change name of parameter
        if (Object.keys(udNode)==0)return; // dummy element
        this.id=udNode.id;
        this.form=udNode.form;
        this.lemma=udNode.lemma;
        this.upos=udNode.upos;
        this.feats=JSON.parse(JSON.stringify(udNode.feats));
        this.head=udNode.head;
        this.deprel=udNode.deprel;
        this.misc=JSON.parse(JSON.stringify(udNode.misc));
        this.left=[];
        this.right=[];
        return;
    }
    this.lineNumber=lineNumber;
    this.id=parseInt(fields[1])
    this.form=fields[2];
    this.lemma=fields[3];
    this.upos =fields[4];
    this.xpos = fields[5]; // unused
    this.feats=makeFeats(fields[6]);
    this.head=parseInt(fields[7]);
    this.deprel=fields[8];
    this.deps=fields[9];  // unused
    this.misc=makeFeats(fields[10]);
    this.left=[];
    this.right=[];
}

UDnode.prototype.addToLeftOf=function(node){
    this.parent=node;
    node.left.push(this);
    this.position="l";
}

UDnode.prototype.addToRightOf=function(node){
    this.parent=node;
    node.right.push(this);
    this.position="r";
}

UDnode.prototype.showHead=function(){
    return `${this.lemma} : ${this.upos} : ${this.feats.map(kv=>kv[0]+"="+kv[1]).join("|")}`
}

UDnode.prototype.pp=function(level){
    const indent = n=>Array(n*3).fill(" ").join("");
    let res="";
    this.left.forEach(n=>res+=n.pp(level+1));
    res+=indent(level)+this.showHead()+"\n";
    this.right.forEach(n=>res+=n.pp(level+1));
    return res;
}

UDnode.prototype.isTerminal=function(){
    return this.left.length==0 && this.right.length==0;
}

UDnode.prototype.matches=function(deprel,upos){
    return (deprel == _ || this.deprel     == deprel) &&
           (upos   == _ || this.upos   == upos);    
}

UDnode.prototype.getDeprel=function(){
    return this.deprel;
}

UDnode.prototype.getLemma = function(){
    return this.lemma;
}

UDnode.prototype.getForm = function(){
    return this.form;
}

UDnode.prototype.getUpos = function(){
    return this.upos;
}

UDnode.prototype.hasFeature=function(key,val){
    const value = this.feats[key];
    return (value !== undefined && (val == _ || val === undefined || value==val));
}

UDnode.prototype.hasNoFeature=function(){
    return Object.keys(this.feats).length===0;
}

UDnode.prototype.getFeature=function(key){
    return this.feats[key];
}

UDnode.prototype.setFeature=function(key,value){
    return this.feats[key]=value;
}

UDnode.prototype.deleteFeature=function(key){
    delete this.feats[key];
}

UDnode.prototype.selectFeature=function(key){
    if (key in this.feats){
        const val=this.feats[key];
        delete this.feats[key];
        return val;
    }
}

UDnode.prototype.hasNoSpaceAfter = function (){
    return this.misc["SpaceAfter"]=="No";
}

UDnode.prototype.toConstituent = function(isLeft){
    if (this.isTerminal())
        return this.toTerminal(isLeft);
    return this.toPhrase(isLeft)
}

UDnode.prototype.isPunct = function(){
    this.upos=="PUNCT" || (this.upos=="PART" && this.lemma=="'");
}

UDnode.prototype.feats2options = function(selFeats){
    if (this.hasNoFeature())return [];
    const feats=this.head.feats;
    let options=[];
    function addOption(selFeat,val){
        if (val===undefined) return;
        const option=selFeat=="Number" ? Number_[val] : eval(selFeat)[val];
        if (option===undefined){
            console.log("undefined option:%s=%s",selFeat,val);
        } else {
            if (option != null) options.push(option)
        }
    }
    for (const selFeat of selFeats){
        addOption(selFeat,this.selectFeature(selFeat));
        if (["Number","Gender","Person"].indexOf(selFeat)>=0){
            addOption(selFeat+"_psor",this.selectFeature(selFeat+"_psor"));
        }
    }
    return options
}

UDnode.prototype.options2feats = function(options){
    const keys=Object.keys(options);
    if (keys.length==0)return "_";
    let res=[];
    for (let key of keys){
        const val=options[key];
        if (key=="Number_")key="Number";
        else if (key.endsWith("_psor"))key=key.substring(0,key.length-5)+"[psor]"
        res.push(key+"="+val)
    }
    return res.join("|");
}

// regenerate CONLLU format
UDnode.prototype.conll = function(){
    return [this.id,this.form,this.lemma,this.upos,this.xpos,this.options2feats(this.feats),
            this.head,this.deprel,this.deps,this.options2feats(this.misc)].join("\t")
}

// Phrase processing (language independent)

// process coordination by gathering all children (starting at the second one) in a list 
// creating phrase with the first child and then adding the CP
UDnode.prototype.processCoordination = function(phrase,headTerm,sentOptions){
    let c; // default
    let ph=new JSR(phrase,[]);
    // split children into separate trees to the right that will be processed separately
    let conjs=[]
    let right=this.right;
    let n=right.length
    for (let i=n-1;i>=0;i--){
        if (right[i].getDeprel()=="conj"){
            conjs.push(right[i]);
            right.splice(i,1);
        }
    }
    conjs.reverse();
    // process first 
    appendTo(ph.children,this.left.map(c=>c.toConstituent()));
    ph.children.push(headTerm);
    // remove punct
    if (this.right.length>0){
        const [last]=this.right.slice(-1);
        if (last.getDeprel()=="punct" && last.getUpos()=="PUNCT" && last.getLemma()==",")
            this.right.splice(-1,1);
    }
    appendTo(ph.children,this.right.map(c=>c.toConstituent()));
    let childrenJSR=[ph.addOptions(sentOptions)];  // add options to the first child
    // process other children and pick the conjunction
    // we conjecture that NP take their argument to the left and VP to the right
    n=conjs.length;
    let hasOxfordComma=false;
    for (let i=0;i<n;i++){
        let ci=conjs[i];
        let [dep,idx]=ci.findDeprelUpos("cc","CCONJ",_);
        if (idx>=0){ // remove it
            c=dep[idx].getLemma();
            dep.splice(idx,1);
        }
        // remove also front comma...
        if (ci.left.length>0){
            const first=ci.left[0];
            if (first.getDeprel()=="punct" && first.getUpos()=="PUNCT" && first.getLemma()==","){
                ci.left.splice(0,1);
                if (i==n-1)hasOxfordComma=true;
            }
        }
        childrenJSR.push(ci.toConstituent());
    }
    if (c!==undefined) childrenJSR.unshift(new JSR("C",c,hasOxfordComma?['b(",")']:[]));
    let res=new JSR("CP",childrenJSR);
    return res;
}

// make children having a depRel "fixed or flat  
// very delicate HACK
UDnode.prototype.getMyIndex = function(udNodeList){
    // const me=this; // make sure that this is not changed
    return udNodeList.findIndex(udn=>udn==this);
}

UDnode.prototype.spliceIntoGrandParent=function (p){
    const isLeft=this.position=="l";
    const list=isLeft?this.parent.left:this.parent.right;
    // const list=isLeft?this.parent.left:this.parent.right;
    // const [p]=list.splice(idxP,1);   // remove from parent list
    const upp=this.parent.parent;    // insert into grand parent
    let idxPP=this.parent.getMyIndex(upp.left);
    if (idxPP>=0){
        upp.left.splice(isLeft?idxPP:idxPP+1,0,p)
    } else {
        idxPP=this.parent.getMyIndex(upp.right);
        upp.right.splice(isLeft?idxPP:idxPP+1,0,p);
    }
}


UDnode.prototype.processFixedFlat = function(){
    const deprel=this.getDeprel();
    if (deprel == "fixed" || deprel == "flat"){     // move this node up
        if (this.parent.parent==undefined) return ; // this can occur in short examples
        let idxP=this.getMyIndex(this.parent.left);
        if (idxP>=0){
            // this.spliceIntoGrandParent(true,idxP)
            this.spliceIntoGrandParent(this.parent.left.splice(idxP,1)[0])
        } else {
            idxP=this.getMyIndex(this.parent.right)
            // this.spliceIntoGrandParent(false,idxP);
            this.spliceIntoGrandParent(this.parent.right.splice(idxP,1)[0])
        }
        // HACK: change name of deprel so that it will not be moved more than once
        this.deprel+="*"; 
    }
    if (this.isTerminal())return;
    this.left.forEach(udn=>udn.processFixedFlat()); 
    this.right.slice().reverse().forEach(udn=>udn.processFixedFlat());
}

UDnode.prototype.processNominal = function(headTerm,sentOptions){
    // check coordination 
    const conjs=this.right.filter(udt=>udt.matches("conj",_,_));
    if (conjs.length>0){// get the first conj
        return this.processCoordination("NP",headTerm,sentOptions);
    }
    let np=new JSR("NP");
    np.addChildren(this.left.map(c=>c.toConstituent(true)));
    np.addChildren(headTerm);
    np.addChildren(this.right.map(c=>c.toConstituent(false)));
    // if NP first child is P, then changeit to PP
    if (np.children[0].isA("P"))np.constName="PP";
    return np.addOptions(sentOptions);
}

//  check if deprel is present with corresponding features, return [children list,index] 
UDnode.prototype.findDeprelUpos = function(deprel,upos){
    let idx=this.left.findIndex(udt=>udt.matches(deprel,upos));
    if (idx>=0) return [this.left,idx];
    idx=this.right.findIndex(udt=>udt.matches(deprel,upos));
    if (idx>=0) return [this.right,idx];
    return [undefined,-1];
}

// find the projection of head as a sorted list of numbers
//    if the result is a consecutive array of numbers return it, otherwise return null
// idea adapted from 
//     Sylvain Kahane, Alexis Nasr, and Owen Rambow.
//     Pseudo-projectivity, a polynomially parsable non-projective dependency grammar. 
//     In 36th Annual Meeting of the Association for Computational Linguistics and 
//     17th International Conference on Computational Linguistics, Volume 1, pages 646–652, 
//     Montreal, Quebec, Canada, August 1998. 

UDnode.prototype.project=function(){
    // check if the numbers in the array s are consecutive
    function checkConsecutive(s){
        if (s.length<=1) return true;
        let current=s[0]+1;
        for (let i = 1; i < s.length; i++) {
            if (s[i]!=current)return false;
            current++;
        }
        return true;
    }
    
    let s=[this.id];
    let ls=this.left;
    if (ls.length>0){
        for (let i = 0; i < ls.length; i++) {
            const p=ls[i].project();
            if (p==null) return null; // stop as soon it is not projective
            s=s.concat(p)
        }
    }
    let rs=this.right;
    if (rs.length>0){
        for (let i = 0; i < rs.length; i++) {
            const p=rs[i].project();
            if (p==null) return null; // stop as soon it is not projective
            s=s.concat(p)
        }
    }
    s.sort(function(a,b){return a-b}) // sort numbers because by default sort does it alphabetically...
    if (checkConsecutive(s)) return s;
    return null;
}

// generate a string from the forms in the tree by an inOrder traversal
UDnode.prototype.getTokens=function(){
    let res=this.left.map(n=>n.getTokens()).flat();
    res.push(this.form);
    return res.concat(this.right.map(n=>n.getTokens()).flat());
}

/// useful for examples in the paper
UDnode.prototype.toJSON=function(level){
    const spaces = n=>Array(n).fill(" ").join("");   
    const s=spaces(level)
    let res=[`{"deprel":"${this.deprel}", "upos":"${this.upos}", "lemma":"${this.lemma}",`+
             ` "form":"${this.form}", "id":${this.id}, "head":${this.head}`];
    if (!this.hasNoFeature()) 
        res[0]+=', "feats":'+JSON.stringify(this.feats);
    if (this.left.length>0){
        res.push(' "left":['+this.left.map(n=>n.toJSON(level+9)).join(",\n"+spaces(level+9))+"]")
    }
    if (this.right.length>0){
        res.push(' "right":['+this.right.map(n=>n.toJSON(level+10)).join(",\n"+spaces(level+10))+"]")
    }
    return res.join(",\n"+s)+"}";
}

// short version of the preceding
UDnode.prototype.toJSON0=function(level){
    const spaces = n=>Array(n).fill(" ").join("");   
    const s=spaces(level)
    let res=[`{"deprel":"${this.deprel}", "lemma":"${this.lemma}", ...`];
    // if (!this.hasNoFeature())
    //     res[0]+=', "feats":'+JSON.stringify(this.feats);
    if (this.left.length>0){
        res.push(' "left":['+this.left.map(n=>n.toJSON0(level+9)).join(",\n"+spaces(level+9))+"]")
    }
    if (this.right.length>0){
        res.push(' "right":['+this.right.map(n=>n.toJSON0(level+10)).join(",\n"+spaces(level+10))+"]")
    }
    return res.join(",\n"+s)+"}";
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


// tools used in functions

const _ = "ANYTHING";  // like in Prolog

function addSentTypes(l,sentTypes){
    if (typeof l == "string") 
        return l+sentTypes;
    l[l.length-1]+=sentTypes;
    return l;
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.UDnode=UDnode;
    exports._=_;
}