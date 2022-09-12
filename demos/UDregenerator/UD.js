import {UDnode} from "./UDnode.js"
export {UD};

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

class UD {
    constructor(fileName, multiLine, startLine) {
        this.fileName = fileName;
        this.startLine = startLine;
        let lines = multiLine.split(/\n/);
        this.nodes = [{}]; // dummy node at index 0 to ease indexing
        this.sent_id = "";
        this.text = "";
        let lastIndexInText = 0;
        this.nbLines = lines.length;
        let jsrLines = [];
        let lineRange, rangeLine, rangeStart = -1, rangeEnd = -1;
        let m; // for regex matching
        // build a list of nodes keeping the head index info
        for (let i = 0; i < this.nbLines; i++) {
            let line = lines[i];
            if (line.length > 0 && !line.startsWith("//")) { // useful extension for commenting UD lines for debugging
                if (line.startsWith("#")) {
                    if (m = /^# sent_id = (.*)$/.exec(line)) {
                        this.sent_id = m[1];
                        // console.log(sent_id)
                    } else if (m = /^# text = (.*)$/.exec(line)) { // save original text
                        this.text = m[1];
                    } else if (line.startsWith("# jsRealB-start")) {
                        i++;
                        while (!lines[i].startsWith("# jsRealB-end")) {
                            jsrLines.push(lines[i]);
                            i++;
                        }
                    }
                } else if (line.match(/^\d+\t/)) { // match lines starting with a single number (skip n-n)
                    line = line.trim();
                    let fields = line.split("\t");
                    if (fields.length < 10) {
                        window.alert("CoNLL-U too short:" + (i + startLine) + ":\n" + line);
                        return;
                    }
                    fields.unshift("dummy"); // pour avoir les indices à partir de 1
                    const udNode = new UDnode(i + startLine, fields);
                    udNode.conllLine = line; // save original line
                    if (rangeStart <= fields[1] && fields[1] <= rangeEnd) { // deal with a line range 
                        // the index and the form must be the original form in the text (e.g du instead of de le)
                        udNode.formInText = lines[rangeLine].split("\t")[1];
                        udNode.indexInText = this.text.indexOf(udNode.formInText, lastIndexInText);
                        if (udNode.indexInText < 0) { // this should never happen...
                            console.log("line %d:: %s : %d not found in\n%s\n", i + startLine, udNode.formInText, lastIndexInText, this.text);
                        }
                        if (fields[1] == rangeEnd)
                            lastIndexInText = udNode.indexInText + udNode.formInText.length;
                    } else {
                        udNode.formInText = fields[2];
                        udNode.indexInText = this.text.indexOf(udNode.formInText, lastIndexInText);
                        if (udNode.indexInText < 0) { // this should never happen...
                            console.log("line %d:: %s : %d not found in\n%s\n", i + startLine, udNode.formInText, lastIndexInText, this.text);
                        }
                        lastIndexInText = udNode.indexInText + udNode.formInText.length;
                    }
                    this.nodes.push(udNode);
                } else if ((lineRange = /^(\d+)-(\d+)\t/.exec(line)) !== null) {
                    // keep last line range, useful for getting an appropriate indexInText
                    rangeLine = i;
                    rangeStart = +lineRange[1];
                    rangeEnd = +lineRange[2];
                } else if (!line.match(/^\d+\.\d+\t/)) { // ignore empty nodes (decimal number)
                    console.log("strange line:%d\n  %s\n=>%s\n  %s", i, lines[i - 1], lines[i], lines[i + 1]);
                }
            }
        }
        // console.log(nodes);
        // build the tree from the root and head index
        this.root = null;
        this.allForms = [];
        const nbNodes = this.nodes.length;
        if (nbNodes == 1)
            return;
        for (let i = 1; i < nbNodes; i++) {
            const node = this.nodes[i];
            let head = +node.head;
            if (!Number.isInteger(head) || head < 0 || head >= nbNodes) {
                console.log("Illegal head: \"%s\" for node %d", node.head, i);
                if (this.root !== null)
                    head = this.root.id;
                else {
                    this.root = node;
                    head = 0;
                }

            }
            if (head == 0)
                this.root = node;
            else if (head < node.id) {
                node.addToRightOf(this.nodes[head]);
            } else {
                node.addToLeftOf(this.nodes[head]);
            }
        }
        this.tokens = this.root.getTokens();
        this.tokens.unshift({});
        // console.log(this.tokens);
        this.jsRealBexpr = jsrLines.join("\n");
        // console.log(this.root);
    }
    show() {
        return `# file = ${this.fileName}\n# sent_id = ${this.sent_id}\n# text = ${this.text}\n${this.root.pp(0)}`;
    }
    /// for text generation
    similiClone() {
        ///   HACK: as the generation process modifies its input we have to "simili-clone" it before
        ///         realisation, so that the dependency and tree drawings show all the information
        let clonedNodes = this.nodes.map(udn => new UDnode(udn));
        let clonedRoot = null;
        const nbNodes = clonedNodes.length;
        for (let i = 1; i < nbNodes; i++) {
            const node = clonedNodes[i];
            const head = node.head;
            if (head == 0)
                clonedRoot = node;
            else if (head < node.id) {
                node.addToRightOf(clonedNodes[head]);
            } else {
                node.addToLeftOf(clonedNodes[head]);
            }
        }
        return clonedRoot;
    }
    // recreate the conll format
    conll() {
        let res = [`# sent_id = ${this.sent_id}`];
        res.push(`# text = ${this.text}`);
        if (this.jsRealBsent != undefined && this.jsRealBsent.length > 0) {
            res.push(`# TEXT = ${this.jsRealBsent}`);
        }
        for (let udn of this.nodes) {
            if (Object.keys(udn).length > 0)
                res.push(udn.conll());
        }
        if (this.jsRealBexpr != undefined && this.jsRealBexpr.length > 0) {
            res.push("# jsRealB-start");
            res.push(this.jsRealBexpr);
            res.push("# jsRealB-end");
        }
        return res.join("\n") + "\n\n";
    }
}
