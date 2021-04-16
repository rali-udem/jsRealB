if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    const utils=require("./utils.js")
    const fixPunctuation=utils.fixPunctuation;
}
///// for the constituent tree drawing
/////////// drawing of the constituent representation

const deltaConstTree = 20;

function drawSentenceCT(display,deps){
    var endX=startX;
    // draw the words of the sentence and update width and x in deps
    for (var i = 1; i < deps.length; i++) {
        var dep=deps[i];
        var tooltip="";
        var width=addWord(display,endX,startY,dep.form,
                          "",
                          false,false);
        deps[i].x=endX;
        deps[i].width=width;
        deps[i].mid=endX+width/2;
        endX+=width+wordSpacing;
    }
    return endX;
}

// find the maximum level of the constituent tree
function maxLevel(cnst,level){
    if (!cnst.children) return level;
    return Math.max.apply(null,cnst.children.map(c=>maxLevel(c,level+1)))
}

// reçoit x,y retourne le x de son dernier enfant
// remet son x au milieu de ses enfants
function updateXY(cnst,y){
    // console.log("setXY("+this.label+":"+x+","+y+")");
    let children=cnst.children;
    cnst.y=y+deltaConstTree;
    if (!children[0].children){
        // this is a terminal,so align with the middle of the word
        cnst.x=children[0].mid;
    } else {
        children.forEach(c=>updateXY(c,cnst.y))
        // align in the middle of its children
        let last=children.length-1;
        cnst.x=(children[0].x+children[last].x)/2;
    }
}

function drawConstTree(display,cnst){
    let children=cnst.children;
    if (!children[0].children){
        let c=children[0];
        // dotted line to the terminal
        display.append("line")
            .attr("x1",cnst.x).attr("y1",cnst.y).attr("x2",c.mid).attr("y2",c.y)
            .attr("fill","none")
            .attr("stroke","black")
            .attr("stroke-dasharray","1")
        ;
    } else {
        for (let i = 0; i < children.length; i++) {
            let c=children[i];
            drawConstTree(display,c);
            display.append("line")
                .attr("x1",cnst.x).attr("y1",cnst.y).attr("x2",c.x).attr("y2",c.y)
                .attr("fill","none")
                .attr("stroke","black")
                .attr("stroke-width","1")
            ;
        }
    }
}

function drawConstLabels(display,cnst){
    if (!cnst.children) return;
    var text=addLabel(display,cnst.x,cnst.y,cnst.label);
    text.attr("cursor","pointer");
    // if (cnst.opts.length>0)
    text.append("title").text(cnst.opts.join());
    cnst.children.forEach(c=>drawConstLabels(display,c));
}

function showConstituents(jsRealBstruct){
    terminals=[{}]; // add dummy for drawSentence
    constituents=[]    
    constParse(new Tokenizer(jsRealBstruct));
    startY= maxLevel(constituents[0],1) * deltaConstTree - deltaConstTree/2;
    var svg=d3.select("svg#constTree");
    display=svg.select("g");
    display.selectAll("*").remove();
    svg.attr("height",startY+20); // update height of the drawing
    var endX=drawSentenceCT(display,terminals); // this updates the .x, .width, .mid of each terminal
    terminals.forEach(t=>t.y=startY);
    svg.attr("width",endX+startX); // update width of the drawing
    updateXY(constituents[0],-deltaConstTree/2);
    drawConstTree(display,constituents[0]); // draw lines
    drawConstLabels(display,constituents[0]); // add labels (over some lines)
}

/////  user interface functions
let currentUD,uds;

// Separates a single string into UDs separated at a blank line
// returns a list of dependencies
function parseUDs(groupVal,fileName){
    fileName = fileName || "textarea";
    let udsStrings=groupVal.split("\n\n");
    let uds=[];
    let startLine=1;
    let sentence;
    udsStrings.forEach(function(string){
        if (string.trim().length==0){
            startLine++;
            return; // ignore empty uds
        }
        // depsInfo=parseDeps(strings,startLine);
        const ud=new UD(fileName,string,startLine);
        // console.log(ud.show());
        if (ud.nodes.length==1){// commented group
            startLine+=ud.nbLines;
            return;
        }
        let isProjective=ud.root.project()!=null;
        if (!isProjective)
            ud.sentence="*"+ud.text;
        else
            ud.sentence=" "+ud.text;
        if (ud.sentence.length>100){
            ud.sentence=ud.sentence.substring(0,97)+"..."
        }
        uds.push(ud);
        startLine+=ud.nbLines+1;
    })
    return uds;
}

function getFile(){
	let file = d3.select("#file-input").node().files[0];
    if (file !== undefined){
    	let reader = new FileReader();
    	reader.addEventListener('load', function(e) {
        	d3.select("#input").text(e.target.result);
            parseTextArea();
    	});
    	reader.readAsText(file);
    } else {
        parseTextArea();
    }
}
// parse all uds in the textarea and build the menu of sentences
function parseTextArea(){
    const sentLength=100;
    var showOnlyDiffs=d3.select("#onlyDiffs").property("checked");
    uds=parseUDs(d3.select("textarea").property("value"));
    let sentences=d3.select("#sentences");
    let currentUDno=sentences.node().value||"0"; // save position in the sentence menu
    sentences.selectAll("*").remove();
    // realize each group and add realization info to each
    uds.forEach(function (ud,i){
        const jsr=ud.toJSR();
        ud.jsRealBexpr=jsr.pp(0);
        ud.jsrRealBsent=jsr.realize();
        const text=ud.text;
        ud.diffs=computeDiffs(text,ud.jsrRealBsent);
        if (!showOnlyDiffs || ud.diffs[3]!=0){
            sentences.append("option").attr("value",i).text(ud.sentence);
        }
    })
    var nb=sentences.selectAll("option").size()
    d3.select("#nbSent").html(nb+(language=="en"?" sentence":" phrase")+(nb>1?"s":""));
    if (d3.select(`#sentences option[value="${currentUDno}"]`).size()==0) 
        // if previous currentUDno appears in the menu does not appear set it to the first
        currentUDno=d3.select("#sentences option").node().value;
    sentences.node().value=currentUDno;
    currentUD=uds[+currentUDno];
    showSentenceParse(currentUD);
    showRealization(currentUD,true);
}

function htmlWarnings(warnings){
    if (warnings.length==1){
        return `<b style="color:red">1 ${language=="en"?"error":"erreur"}</b>:`+warnings[0];
    } else {
        return `<b style="color:red">${warnings.length} ${language=="en"?"errors":"erreurs"}</b>:<br/>`+
                warnings.map(w=>'&nbsp;• '+w+'<br/>').join("")
    }
}

function showRealization(ud,updateEditor){
    const nbDiffs=ud.diffs[3];
    if (nbDiffs==-1){ 
        // realization error : show error message without any formatting
        d3.select("#text").text(ud.text);
        d3.select("#jsrSentence").html(htmlWarnings(ud.jsrRealBsent));
        d3.select("#nbDiffs").text("")
    } else {
        const [sent1,sent2]=showDiffs(ud.diffs,addHTMLStr);
        d3.select("#text").html(sent1);
        d3.select("#jsrSentence").html(sent2);
        if (nbDiffs==0)
            d3.select("#nbDiffs").text("");
        else
            d3.select("#nbDiffs").text(`${nbDiffs} ${language=="en"?"difference":"différence"}${nbDiffs>1?"s":""}` )
    }
    if (updateEditor){
        // put expression in editor 
        editor.setValue(ud.jsRealBexpr);
        editor.selection.clearSelection();
        editor.resize()
        editor.gotoLine(1,1,false);
        editor.scrollToLine(1,true,false,function(){});
    }
    const svgConstTree=d3.select("#constTree");
    const savedDisplayStyle=svgConstTree.style("display");
    // ensure that the display is visible so that the width is computed correctly
    svgConstTree.style("display","block");
    showConstituents(ud.jsRealBexpr);
    // reset to the original value
    svgConstTree.style("display",savedDisplayStyle);
    // const jsr=ud.toJSR();
    // const savedDisplayStyle=svgConstTree.style("display");
    // svgConstTree.style("display","block");
    // jsr.showConstituents(svgConstTree);
    
    // svgConstTree.style("display",savedDisplayStyle);
}

function showSentenceParse(ud){
    d3.select("textarea").node().scrollTop=ud.startLine*lineHeight;
    const displayType=d3.select("#displayType").property("value");
    if (displayType=="hide"){
        tree.style("display","none");
        dependencies.style("display","none")
    } else if (displayType=="links"){
        tree.style("display","none");
        dependencies.style("display","block")
        showDependencies(ud);
    } else {
        tree.style("display","block");
        dependencies.style("display","none")
        showTree(ud);
    }
}

var editor;

function updateRealization(){
    resetSavedWarnings();
    const content=editor.getValue();
    currentUD.jsRealBexpr=content;
    let realization=eval(content).toString();
    const warnings=getSavedWarnings();
    if (warnings.length>0){
        currentUD.jsrRealBsent=warnings;
        realization=warnings;
    } else
        currentUD.jsrRealBsent=fixPunctuation(realization);
    currentUD.diffs=computeDiffs(currentUD.text,realization);
    showRealization(currentUD,false);
}

function toggleInstructions(){
    const me=d3.select(this);
    const val=me.property("value");
    if (val=="Hide instructions" || val=="Masquer les instructions"){
        d3.select("#instructions").style("display","none");
        me.property("value",language=="en"?"Show instructions":"Afficher les instructions");
    } else {
        d3.select("#instructions").style("display","block");
        me.property("value",language=="en"?"Hide instructions":"Masquer les instructions");                
    }
}
function toggleConstituentTree(){
    const me=d3.select(this);
    const val=me.property("value");
    if (val=="Hide Constituent Tree" || val=="Masquer l'arbre de constituents"){
        d3.select("#constTree").style("display","none");
        me.property("value",language=="en"?"Show Constituent Tree":"Afficher l'arbre de constituents");
    } else {
        d3.select("#constTree").style("display","block");
        me.property("value",language=="en"?"Hide Constituent Tree":"Masquer l'arbre de constituents");                
    }
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.parseUDs=parseUDs;
} else {
    // after loading the web page
    d3.select(window).on("load",
        function (){
            lineHeight=parseInt(d3.select("textarea").style('line-height'));
            dependencies=d3.select("#dependencies");
            tree=d3.select("#tree");
            d3.selectAll("#parse,#onlyDiffs").on("click",getFile);
            d3.select("#showHideInstructions").on("click",toggleInstructions);
            d3.select("#showHideContituentTree").on("click",toggleConstituentTree);
            d3.select("#displayType").on("change",function(){
                showSentenceParse(currentUD);
            });
            d3.select("#sentences").on("change",function(){
                currentUD=uds[+d3.select("#sentences").property("value")];
                showSentenceParse(currentUD);
                showRealization(currentUD,true);
            })
            d3.select("#wordSpacing").on("change",function(){
                wordSpacing=+this.value;
                showSentenceParse(currentUD);
            });
            d3.select("#letterSpacing").on("change",function(){
                letterSpacing=+this.value;
                showSentenceParse(currentUD);
            });
            d3.select("#quoteOOV").on("change",function(){
                setQuoteOOV(d3.select(this).property("checked"))
            })
            // pour l'éditeur
            editor = ace.edit("jsrStructure");
            editor.setTheme("ace/theme/textmate");
            // editor.getSession().setMode("ace/mode/JSreal");
            editor.getSession().setMode("ace/mode/javascript");
            editor.setShowPrintMargin(false);
            editor.setAutoScrollEditorIntoView(true);
            editor.setOption("minLines", 10);
            editor.setOption("maxLines", 20);
            editor.setFontSize("16px"); // grandeur de police de défaut

            d3.select("#realize").on("click",updateRealization);
            d3.select("#load-file").on("click",getFile);
            
        });     
}
 