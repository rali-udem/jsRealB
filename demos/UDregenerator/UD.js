// root class for keeping global information about a UD structure info in a tree form
// with the following fields:
//  taken from comments :
//     sent_id : sentence id
//     text :  original text
//     jsRealBexpr: taken from lines between "# jsRealB-start" and "# jsRealB-end" it is updated during execution
//  information about the file
//     fileName : name of the containing file
//     startLine : line number where this UD starts
//     nbLines  : number of lines used by this UD
//  computed:
//     root : UDnode
//     nodes : list of UDnode (in the original order) with dummy element 0
//     tokens : list of lemmas built by an inorder traversal of the tree
//     jsRealBsent : generated sentence by jsRealB
//     x,y,mid,width: for sentence drawing
//     sentence : string to display in the menu
//     diffs : list of edit operation for transforming the sentence realized by jsealB to the original text

function UD(fileName,multiLine,startLine){
    this.fileName=fileName;
    this.startLine=startLine;
    let lines=multiLine.split(/\n/);
    this.nodes=[{}]; // dummy node at index 0 to ease indexing
    this.sent_id="";
    this.text="";
    this.nbLines=lines.length;
    let jsrLines=[];
    // build a list of nodes keeping the head index info
    for (var i=0;i<this.nbLines;i++){
        let line=lines[i];
        if(line.length>0 && ! line.startsWith("//")){ // useful extension for commenting UD lines for debugging
            if (line.startsWith("#")){
                if (m=/^# sent_id = (.*)$/.exec(line)){
                    this.sent_id=m[1]
                    // console.log(sent_id)
                } else if (m=/^# text = (.*)$/.exec(line)){ // save original text
                    this.text=m[1];
                } else if (line.startsWith("# jsRealB-start")){
                    i++;
                    while(!lines[i].startsWith("# jsRealB-end")){
                        jsrLines.push(lines[i])
                        i++;
                    }
                }
            } else if (line.match(/^\d+\t/)) {// match lines starting with a single number (skip n-n)
                line=line.trim();
                fields=line.split("\t");
                if(fields.length<10){
                    window.alert("CoNLL-U too short:"+(i+startline)+":\n"+line);
                    return;
                }
                fields.unshift("dummy"); // pour avoir les indices à partir de 1
                this.nodes.push(new UDnode(i+startLine,fields))
            } else if (!line.match(/^\d+(-|\.)\d+\t/)){// ignore range (indicated by -) and empty nodes (decimal number)
                console.log("strange line:%d\n  %s\n=>%s\n  %s",i,lines[i-1],lines[i],lines[i+1]);
            }
        }
    }
    // console.log(nodes);
    // build the tree from the root and head index
    this.root=null;
    this.allForms=[];
    const nbNodes=this.nodes.length;
    if (nbNodes==1)return;
    for (let i=1;i<nbNodes;i++){
        const node=this.nodes[i];
        const head=node.head;
        if (head==0)this.root=node;
        else if (head<node.id){
            node.addToRightOf(this.nodes[head]);
        } else {
            node.addToLeftOf(this.nodes[head]);
        }
    }
    this.tokens=this.root.getTokens();
    this.tokens.unshift({});
    // console.log(this.tokens);
    this.jsRealBexpr=jsrLines.join("\n");
    // console.log(this.root);
}

UD.prototype.show=function(){
    return `# file = ${this.fileName}\n# sent_id = ${this.sent_id}\n# text = ${this.text}\n${this.root.pp(0)}`
}

/// for text generation
UD.prototype.toJSR = function(){
    ///   HACK: as the generation process modifies its input we have to "simili-clone" it before
    ///         realisation, so that the dependency and tree drawings show all the information
    let clonedNodes=this.nodes.map(udn=>new UDnode(udn));
    let clonedRoot=null;
    const nbNodes=clonedNodes.length;
    for (let i=1;i<nbNodes;i++){
        const node=clonedNodes[i];
        const head=node.head;
        if (head==0)
            clonedRoot=node;
        else if (head<node.id){
            node.addToRightOf(clonedNodes[head]);
        } else {
            node.addToLeftOf(clonedNodes[head]);
        }
    }
    ///   end of cloning
    const rchildren=clonedRoot.right;
    const n=rchildren.length;
    // HACK:remove final full stop and add it after transformation to jsRealB expression
    //    this is because jsRealB can add one after a S
    let addPunct=null;
    if (n>0 && rchildren[n-1].getDeprel()=="punct"){
        const finalPunct=rchildren[n-1].getLemma();
        if (finalPunct == "."){
            addPunct=finalPunct
            rchildren.splice(n-1,1);
        }
    }
    clonedRoot.processFixedFlat();
    let jsr=clonedRoot.toConstituent();
    if (addPunct!==null)jsr.addOptions([`a("${addPunct}")`]);
    return jsr;
}

// recreate the conll format
UD.prototype.conll = function(){
    let res=[`# sent_id = ${this.sent_id}`];
    res.push(`# text = ${this.text}`);
    if (this.jsRealBsent!= undefined && this.jsRealBsent.length>0){
        res.push(`# TEXT = ${this.jsRealBsent}`);
    }
    for (let udn of this.nodes){
        if (Object.keys(udn).length>0)
            res.push(udn.conll())
    }
    if (this.jsRealBexpr!=undefined && this.jsRealBexpr.length>0){
        res.push("# jsRealB-start");
        res.push(this.jsRealBexpr)
        res.push("# jsRealB-end");
    }
    return res.join("\n")+"\n\n"
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.UD=UD;
}