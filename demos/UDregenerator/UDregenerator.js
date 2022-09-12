export {parseUDs,UDregeneratorLoad}
import {UD} from "./UD.js";
import { fixPunctuation } from "./utils.js";
import { computeDiffs,showDiffs,addHTMLStr} from "./levenshtein.js";
import {showDependencies,showTree,spacing,start,addWord,addLabel,selectRow} from "./drawDependencies.js"

///// for the dependency tree drawing
/////////// drawing of the dependency representation
// uses addWord, addLabel functions from drawDependencies.js

const deltaDepTree = 20;

let terminals, dependents, depRoot,dependencies,tree, language; // shared variables used for drawing

// slighly different from the one in drawDependencies.js
function drawSentenceCT(display,deps){
    let endX=start.x;
    // draw the words of the sentence and update width and x in deps
    for (let i = 1; i < deps.length; i++) {
        const dep=deps[i];
        const [width,_word]=addWord(display,null,endX,start.y,dep.form,
                                   dep.opts,
                                   false,false);
        deps[i].x=endX;
        deps[i].width=width;
        deps[i].mid=endX+width/2;
        endX+=width+spacing.word;
    }
    return endX;
}

// find the maximum level of the dependency tree
function maxLevel(depInfo,level){
    let children=depInfo.children
    if (children.length==0) return level;
    return Math.max.apply(null,children.map(c=>maxLevel(c,level+1)))
}

function updateXY(depInfo,y){
    depInfo.y=y+deltaDepTree;
    // align with the middle of the word
    depInfo.x=depInfo.form.mid
    depInfo.children.forEach(d=>updateXY(d,depInfo.y))
}

function drawDepTree(display,depInfo){
    let children=depInfo.children;
    let c=depInfo.form;
    // dotted line to the terminal
    display.append("line")
        .attr("x1",depInfo.x).attr("y1",depInfo.y).attr("x2",c.mid).attr("y2",c.y)
        .attr("fill","none")
        .attr("stroke","black")
        .attr("stroke-dasharray","1")
    ;
    for (let i = 0; i < children.length; i++) {
        let c=children[i];
        drawDepTree(display,c);
        display.append("line")
            .attr("x1",depInfo.x).attr("y1",depInfo.y).attr("x2",c.x).attr("y2",c.y)
            .attr("fill","none")
            .attr("stroke","black")
            .attr("stroke-width","1")
        ;
    }
}

function drawDepLabels(display,depInfo){
    const text=addLabel(display,depInfo.x,depInfo.y,depInfo.label);
    text.attr("cursor","pointer");
    // if (depInfo.opts.length>0)
    text.append("title").text(depInfo.opts);
    depInfo.children.forEach(c=>drawDepLabels(display,c));
}

function addDepInfos(dep){    
    let form={form:dep.terminal.lemma,opts:dep.terminal.optSource,x:-1,y:-1}
    let options=dep.terminal.toSource()
    let depInfo={label:dep.constType,form:form,children:[],opts:dep.optSource,x:-1,y:-1};
    dep.dependents.forEach(function(d){if (d.depPosition()=="pre")depInfo.children.push(addDepInfos(d))})
    terminals.push(form);
    dependents.push(depInfo);
    if (dep.parentConst===null)depRoot=depInfo;
    dep.dependents.forEach(function(d){if (d.depPosition()=="post")depInfo.children.push(addDepInfos(d))})
    return depInfo
}
function showDependents(jsRealBstruct){
    terminals=[{}] // add dummy for drawSentence
    dependents =[];
    depRoot = null;
    addDepInfos(jsRealBstruct);    
    start.y= maxLevel(depRoot,1) * deltaDepTree + deltaDepTree/2;
    var svg=d3.select("svg#constTree");
    let display=svg.select("g");
    display.selectAll("*").remove();
    svg.attr("height",start.y+20); // update height of the drawing
    var endX=drawSentenceCT(display,terminals); // this updates the .x, .width, .mid of each terminal
    terminals.forEach(t=>t.y=start.y);
    svg.attr("width",endX+start.x); // update width of the drawing
    updateXY(depRoot,-deltaDepTree/2);
    drawDepTree(display,depRoot); // draw lines
    drawDepLabels(display,depRoot); // add labels (over some lines)
}

/////  user interface functions
let currentUD,uds;
let udContent,currentFile;

// Separates a single string into UDs separated at a blank line
// returns a list of dependencies
function parseUDs(groupVal,fileName){
    fileName = fileName || "textarea";
    let udsStrings=groupVal.split("\n\n");
    let uds=[];
    let startLine=1;
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
        ud.isProjective=ud.root.project()!=null;
        if (!ud.isProjective)
            ud.textInMenu="*"+ud.text;
        else
            ud.textInMenu=" "+ud.text;
        if (ud.textInMenu.length>100){
            ud.textInMenu=ud.textInMenu.substring(0,97)+"..."
        }
        uds.push(ud);
        startLine+=ud.nbLines+1;
    })
    return uds;
}


const fieldNames=["ID","FORM","LEMMA","UPOS","XPOS","FEATS","HEAD","DEPREL","DEPS","MISC"];
const nbFields=fieldNames.length;

function getFile(){
    let file = d3.select("#file-input").node().files[0];
    if (file!==undefined){
        currentFile=file.name
        d3.select("#fileName").text(file.name);
        // read the local file
    	let reader = new FileReader();
        // $("*").css("cursor","wait");
    	reader.addEventListener('load', function(e) {
            udContent=e.target.result
            parse(udContent,file.name);
            // $("*").css("cursor","auto");
    	});
    	reader.readAsText(file);
    }
}

// parse all uds in the textarea and build the menu of sentences
function parse(udContent,fileName){
    // check options set by checkboxes
    const showOnlyDiffs=d3.select("#onlyDiffs").property("checked");
    const showOnlyWarnings=d3.select("#onlyWarnings").property("checked");
    const showOnlyNonProj=d3.select("#onlyNonProj").property("checked");
    const isSUD=d3.select('input[name="annotationScheme"]:checked').property("value")=="sudSch";
    function shouldAddToMenu(ud){
        let add=true;
        if (showOnlyDiffs && ud.diffs[3]==0)add=false;
        if (showOnlyWarnings && ud.warnings.length==0)add=false;
        if (showOnlyNonProj && ud.isProjective)add=false;
        return add;
    }
    uds=parseUDs(udContent,fileName);
    let sentences=d3.select("#sentences");
    let currentUDno=sentences.node().value||"0"; // save position in the sentence menu
    sentences.selectAll("*").remove();
    // realize each group and add realization info to each
    uds.forEach(function (ud,i){
        resetSavedWarnings();
        let udCloned=ud.similiClone();
        // remove ending full stop, it will be regenerated by jsRealB
        if (udCloned.right.length>0){
            let lastIdx=udCloned.right.length-1;
            if (udCloned.right[lastIdx].deprel=="punct" && udCloned.right[lastIdx].lemma=="."){
                udCloned.right.splice(lastIdx,1)
            }
        }
        let jsr=udCloned.toDependent(false,isSUD)
        // if root is a coord, add a dummy root, so that realization will be done correctly
        if (jsr.isA('coord'))jsr=root(Q(""),jsr)
        ud.jsRealBexpr=jsr;
        ud.jsRealBsent=jsr.clone().toString();
        ud.warnings=getSavedWarnings();
        ud.textInMenu=(ud.warnings.length>0?"!":" ")+ud.textInMenu;
        ud.diffs=computeDiffs(ud.text,ud.jsRealBsent);
        if (shouldAddToMenu(ud)){
            sentences.append("option").attr("value",i).text(ud.textInMenu);
        }
    })
    const nb=sentences.selectAll("option").size()
    d3.select("#nbSent").html(nb+(language=="en"?" sentence":" phrase")+(nb>1?"s":""));
    if (nb>0){ // if menu is not empty, update current UD
        if (d3.select(`#sentences option[value="${currentUDno}"]`).size()==0){
            // if previous currentUDno appears in the menu does not appear set it to the first
            currentUDno=d3.select("#sentences option").node().value;
        }
        sentences.node().value=currentUDno; // set the appropriate menu item
        currentUD=uds[+currentUDno];
        showUDtable(currentUD);
        showRealization(currentUD,true);
        showSentenceParse(currentUD);
    }
}

function htmlWarnings(warnings){
    if (warnings.length==1){
        return `<b style="color:red">1 ${language=="en"?"warning":"avertissement"}</b>:`+warnings[0];
    } else {
        return `<b style="color:red">${warnings.length} ${language=="en"?"warnings":"avertissements"}</b>:<br/>`+
                warnings.map(w=>'&nbsp;• '+w+'<br/>').join("")
    }
}

function showUDtable(ud){
    d3.select("#lineNo").text(ud.nodes[1].lineNumber);
    d3.select("#sentId").text(ud.sent_id);
    let tbody=d3.select("#tokens tbody");
    tbody.selectAll("tr").remove()
    for (var i = 1; i < ud.nodes.length; i++) {
        const fields=ud.nodes[i].conll().split("\t");
        let tr=tbody.append("tr");
        for (var j = 0; j < fields.length; j++) {
            tr.append("td")
                .classed(fieldNames[j],true)
                .text(fields[j])
        }
    }
    tbody.on("click",function(e){ // row selection on a cell of the table body
        const tgt=d3.event.target;
        const tr=d3.select(tgt).node().parentNode;
        selectRow(tr,currentUD.nodes[tr.children[0].textContent].lineNumber);
    })
}

function showRealization(ud,updateEditor){
    const nbDiffs=ud.diffs[3];
    let sent1,sent2;
    [sent1,sent2]=showDiffs(ud.diffs,addHTMLStr);
    if (ud.warnings.length>0)
        sent2+="<br/>"+htmlWarnings(ud.warnings);
    d3.select("#text").html(sent1);
    d3.select("#jsrSentence").html(sent2);
    if (nbDiffs==0)
        d3.select("#nbDiffs").text(language=="en"?"no differences":"aucune différence");
    else
        d3.select("#nbDiffs").text(`${nbDiffs} ${language=="en"?"difference":"différence"}${nbDiffs>1?"s":""}` )
    if (updateEditor){
        // put expression in editor 
        editor.setValue(ud.jsRealBexpr.toSource(0));
        editor.selection.clearSelection();
        editor.resize()
        editor.gotoLine(1,1,false);
        editor.scrollToLine(1,true,false,function(){});
    }
    const jsrEditor=d3.select("#jsrEditor");
    const savedJsrEditorDisplay=jsrEditor.style("display");
    const svgConstTree=d3.select("#constTree");
    const savedCstTreeDisplay=svgConstTree.style("display");
    // ensure that the display is visible so that the width is computed correctly
    jsrEditor.style("display","block");
    svgConstTree.style("display","block");
    showDependents(ud.jsRealBexpr);
    // reset to the original value
    jsrEditor.style("display",savedJsrEditorDisplay);
    svgConstTree.style("display",savedCstTreeDisplay);
}

function showSentenceParse(ud){
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

let editor;

function updateRealization(){
    resetSavedWarnings();
    const content=editor.getValue();
    currentUD.jsRealBexpr=eval(content);
    let realization=currentUD.jsRealBexpr.toString();
    currentUD.warnings=getSavedWarnings();
    currentUD.jsRealBsent=fixPunctuation(realization);
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


function toggleDependentTree(){
    const me=d3.select(this);
    const val=me.property("value");
    if (val=="Hide dependency tree" || val=="Masquer l'arbre de dépendances"){
        d3.select("#constTree").style("display","none");
        me.property("value",language=="en"?"Show dependency tree":"Afficher l'arbre de dépendances");
    } else {
        d3.select("#constTree").style("display","block");
        me.property("value",language=="en"?"Hide dependency tree":"Masquer l'arbre de dépendances");                
    }
}

function toggleJsrEditor(){
    const me=d3.select(this);
    const val=me.property("value");
    if (val=="Hide jsRealB editor" || val=="Masquer l'éditeur jsRealB"){
        d3.select("#jsrEditor").style("display","none");
        me.property("value",language=="en"?"Show jsRealB editor":"Afficher l'éditeur jsRealB");
    } else {
        d3.select("#jsrEditor").style("display","block");
        me.property("value",language=="en"?"Hide jsRealB editor":"Masquer l'éditeur jsRealB");                
    }
}

function UDregeneratorLoad(lang,initUD,addNewWords){
    language=lang;
    dependencies=d3.select("#dependencies");
    tree=d3.select("#tree");
    d3.select("#file-input")
        .on("click", 
            // ensure that the same file can reloaded on the "change" event called after the file selection 
            // adapted from https://stackoverflow.com/questions/4109276/how-to-detect-input-type-file-change-for-the-same-file/4118320#4118320
            ()=>d3.select(d3.event.target).property("value","")
        )
        .on("change",getFile);
    const thead=d3.select("#tokens thead");
    
    // create headers of the table
    let tr=thead.append("tr");
    for (var j = 0; j < nbFields; j++) {
        tr.append("th")
            .classed(fieldNames[j],true)
            .text(fieldNames[j]);
    }
    d3.selectAll("#parse").on("click",()=>parse(udContent,currentFile));
    d3.select("#showHideInstructions").on("click",toggleInstructions);
    d3.select("#showHideDependencyTree").on("click",toggleDependentTree);
    d3.select("#showHide-jsrEditor").on("click",toggleJsrEditor);
    d3.select("#displayType").on("change",function(){
        showSentenceParse(currentUD);
    });
    d3.select("#sentences").on("change",function(){
        currentUD=uds[+d3.select("#sentences").property("value")];
        showUDtable(currentUD);
        showSentenceParse(currentUD);
        showRealization(currentUD,true);
    })
    d3.select("#wordSpacing").on("change",function(){
        spacing.word=+this.value;
        showSentenceParse(currentUD);
    });
    d3.select("#letterSpacing").on("change",function(){
        spacing.letter=+this.value;
        showSentenceParse(currentUD);
    });
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
    setQuoteOOV(true);
    udContent=initUD;
    const fileName="initialUDs";
    d3.select("#fileName").text(fileName);
    addNewWords();
    parse(udContent,fileName);
    
    // allow file selection via drag and drop
    // adapted from https://stackoverflow.com/questions/47515232/how-to-set-file-input-value-when-dropping-file-on-page/47522812#47522812

    let docElem = document.documentElement;
    let dragzone = d3.select("#dragzone").node(); // ignore editor area in which drag and drop is already handled
    let fileInput = document.querySelector('#file-input');

    docElem.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragzone.classList.add('dragging');
    });

    docElem.addEventListener('dragleave', () => {
      dragzone.classList.remove('dragging');
    });

    docElem.addEventListener('drop', (e) => {
      e.preventDefault();
      dragzone.classList.remove('dragging');
  
      fileInput.files = e.dataTransfer.files;
      let file = fileInput.files[0];
      if (file!==undefined){
          d3.select("#fileName").text(file.name);
          getFile()
      }
    });
}
