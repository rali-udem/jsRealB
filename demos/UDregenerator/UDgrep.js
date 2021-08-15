let udContent="";
const maxTokensDisplayed=2000;
const fieldNames=["ID","FORM","LEMMA","UPOS","XPOS","FEATS","HEAD","DEPREL","DEPS","MISC"];
const nbFields=fieldNames.length;

let tokens,           // tokens must be global to get sentence info not in the table
    selectedTR,       // current selected if !=null (useful for arrow navigation)
    currentUD,        // current UD
    uds;             // all UDs read from the file

// this applies the initial filters 
function loadTokens(uds){
    tokens=[]
    let nbTokensFiltered=0;
    // build initial filters
    let filters=[];
    for (var j = 0; j < nbFields; j++) {
        const fn=fieldNames[j];
        const jj=j; // save current j for internal closures
        const ignoreCase=d3.select("#ignoreCase").property("checked")?"i":""
        if (d3.select("#"+fn).classed("checked")){
            if (d3.select("#search-"+fn).property("value")!=""){
                filters.push( (fields)=>
                   new RegExp(d3.select("#search-"+fn).property("value"),ignoreCase).test(fields[jj]) )
            }
        } else if (d3.select("#"+fn).classed("inv-checked")){
            if (d3.select("#search-"+fn).property("value")!=""){
                filters.push( (fields)=>
                    !new RegExp(d3.select("#search-"+fn).property('value'),ignoreCase).test(fields[jj]) ) // negated regex
            }
        }
    }
    // should we have to check equality between lemma and form
    const eqFN=d3.select("#formEQlemma").property("checked")
                    ?(form,lemma)=>form.toLowerCase()==lemma.toLowerCase()
                    :d3.select("#formEQlemma").property("indeterminate")
                       ?(form,lemma)=>form.toLowerCase()!=lemma.toLowerCase()
                       :(form,lemma)=>true;
                       
    uds.forEach(function(ud){
        const nbNodes=ud.nodes.length;
        for (let i = 1; i < nbNodes; i++) {
            let fields=ud.nodes[i].conll().split("\t")
            // "normalize" the fields of the current token
            for (var j = 0; j < nbFields; j++) {
                const f=fields[j].trim();
                if (f=="_")fields[j]="";
                else fields[j]=f;
            }
            // check all initial filters [fieldNo,Regex]
            if (eqFN(fields[1],fields[2]) && filters.every((f)=>f(fields))){ 
                nbTokensFiltered++;
                if (nbTokensFiltered<=maxTokensDisplayed){
                    fields.push(ud);// add reference to the sentence                    
                    tokens.push(fields)
                }
            }
        }
        
    })
    return nbTokensFiltered;
}

//   Parse the udContent and fill the table
function parse(){
    // clear previous info
    d3.select("#message").empty();
    d3.selectAll("#lineNo,#sentId,#tokenId,#text").text("");
    d3.selectAll("#tokens th").classed("colTri decroissant croissant",false);
    tree.style("display","none");
    dependencies.style("display","none");
    selectedTR=null;   
    // insert new info
    let nbTokensFiltered=loadTokens(uds);
    let message=`${nbTokensFiltered.toLocaleString()} tokens`;
    if (nbTokensFiltered>maxTokensDisplayed)
        message+=` matched the initial filters,`+
        ` but only the first ${maxTokensDisplayed.toLocaleString()} are displayed`;
    d3.select("#message").text(message);
    fillTable(d3.select("#tokens"));
}

// function matchForm(form,text){
//     const formREw=new RegExp(`\\b${form}\\b`);
//     const formRE=new RegExp(form)
//     // search before as word otherwise search as a string
//     return formREw.exec(currentUD.text)||formRE.exec(currentUD.text)
//
// }

function showSentenceFromRow(tr){
    // change selection
    selectedTR=tr;
    let tbody=d3.select("#tokens tbody");
    tbody.selectAll("td").classed("selected-row",false);
    d3.select(tr).selectAll("td").classed("selected-row",true);
    // update sentence info
    const trUD=d3.select(tr).datum();
    if(trUD!=currentUD){
        currentUD=trUD;
        d3.select("#sentId").text(currentUD.sent_id);
        d3.select("#lineNo").text(currentUD.startLine);
        showSentenceParse(currentUD);
    }
    // highlight the form in the text
    let id=d3.select(tr).select("td").text()
    d3.select("#tokenId").text(id);
    let form=d3.select(tr).selectAll("td").nodes()[1].textContent;
    let selectedNode=currentUD.nodes[+id];
    d3.select("#text")
        .html(currentUD.text.substr(0,selectedNode.indexInText)+
            '<b>'+form+'</b>'+currentUD.text.substr(selectedNode.indexInText+form.length));
    
    // highlight word in the link and tree displays
    d3.selectAll("svg .selected-word").classed("selected-word",false);
    selectedNode.wordInLinks.classed("selected-word",true);
    selectedNode.wordInTree.classed("selected-word",true);
}

// fill the table 
function fillTable(table){
    table.selectAll("tbody tr").remove();
    const tbody=table.select("tbody");
    // fill content with rows
    for (var i = 0; i < tokens.length; i++) {
        toks=tokens[i];
        let tr=tbody.append("tr");
        for (var j = 0; j < nbFields; j++) {
            tr.append("td").classed(fieldNames[j],true).text(toks[j]);
        }
        tr.datum(toks[nbFields]);
    }
    table.on ("click",function(e){
        const tgt=d3.event.target;
        if (tgt.nodeName == "TH")return;// click in the header, this will call the sort
        const tr=d3.select(tgt).node().parentNode;
        showSentenceFromRow(tr);
    })
}

// show/hide instructions
function toggleInstructions(){
    const me=d3.select(this);
    const val=me.property("value");
    if (val=="Hide instructions"){
        d3.select("#instructions").style("display","none");
        me.property("value","Show instructions");
    } else {
        d3.select("#instructions").style("display","block");
        me.property("value","Hide instructions");                
    }
}

// deal with a three state checkbox 
// adapted from https://css-tricks.com/indeterminate-checkboxes/
function threeStatesCB() {
  if (this.readOnly) this.checked=this.readOnly=false;
  else if (!this.checked) this.readOnly=this.indeterminate=true;
}

// Separates a single string into UDs separated at a blank line
// returns a list of dependencies
function parseUDs(groupVal,fileName){
    let udsStrings=groupVal.split("\n\n");
    let uds=[];
    let startLine=1;
    let sentence;
    udsStrings.forEach(function(string){
        if (string.trim().length==0){
            startLine++;
            return; // ignore empty uds
        }
        const ud=new UD(fileName,string,startLine);
        if (ud.nodes.length==1){// commented group
            startLine+=ud.nbLines;
            return;
        }
        uds.push(ud);
        startLine+=ud.nbLines+1;
    })
    return uds;
}



function getFile(){
    let file = d3.select("#file-input").node().files[0];
    if (file!==undefined){
        fileName=file.name
        d3.select("#fileName").text(file.name);
        // read the local file
    	let reader = new FileReader();
    	reader.addEventListener('load', function(e) {
            uds=parseUDs(e.target.result,file.name)
            parse();
            d3.select("#file-input").property("value",""); // so that we can reload the last file...
    	});
    	reader.readAsText(file);
    }
}

function createFilters(){
    const fieldSelect=d3.select("#fieldSelect");
    // create the initial filter textbox
    for (var j = 0; j < nbFields; j++) {
        const fName=fieldNames[j];
        const span=fieldSelect.append("span")
            .classed("fieldName",true)
            .attr("id",fName)
            .text(fName);
        const search = fieldSelect.append("input")
            .attr("type",text)
            .attr("id","search-"+fName)
            .attr("placeholder",fName=="ID"?"":"regex")
            .attr("size",fName=="ID"?3:20);
        search.style("display","none");
        span.on("click",function(){ // listener on the fieldName
            if (d3.select(this).classed("checked")){
                d3.select(this)
                    .classed("checked",false)
                    .classed("inv-checked",true);
                d3.select("#search-"+fName)
                    .property("placeholder","inv-regex");
            } else if (d3.select(this).classed("inv-checked")){
                d3.select("#search-"+fName).style("display","none");
                d3.select(this)
                    .classed("inv-checked",false);
            } else {
                d3.select("#"+fName).classed("checked",true)
                d3.select("#search-"+fName)
                    .property("placeholder","regex")
                    .style("display","inline");
            }
        });
        // add checkbox for equality between form and lemma
        if (j==1){
            fieldSelect.append("label")
                .classed("fieldName",true)
                .attr("for","formEQlemma")
                .attr("title","check if FORM and LEMMA are the same")
                .text("=")
            let cb = fieldSelect.append("input")
                .attr("type","checkbox")
                .attr("id","formEQlemma");
            cb.property("checked",false)
                .property("indeterminate",false).
                on("click",threeStatesCB);
        }
    }
    fieldSelect.append("input")
        .classed("right",true)
        .attr("type","checkbox")
        .attr("id","ignoreCase")
        .attr("checked",true);
    fieldSelect.append("label")
        .classed("right",true)
        .attr("for","ignoreCase")
        .attr("title","Are regexps case-insensitive?")
        .text("Ignore Case")
}

function initTable(){
    const table=d3.select("#tokens")
    // create headers of the table
    let tr = table.select("thead").append("tr");
    for (var j = 0; j < nbFields; j++) {
        tr.append("th")
            .classed(fieldNames[j],true)
            .text(fieldNames[j])
    }

    // Table sorting by clicking in the column heading
    // https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript/49041392#49041392
    //  quite subtle but it works efficiently
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;
    const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
        v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
        )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));
    // do the work...
    document.querySelectorAll('#tokens th').forEach(th => th.addEventListener('click', (() => {
        const noCol=Array.from(th.parentNode.children).indexOf(th);
        let ascending;
        let th1=table.select(`thead th:nth-child(${noCol+1})`);
        if (th1.classed("colTri")){        // changer l'ordre de tri
            if (th1.classed("croissant")){
               th1.classed("croissant",ascending=false);
               th1.classed("decroissant",true);
            } else {
                th1.classed("croissant",ascending=true);
                th1.classed("decroissant",false);
            }
        } else {
            table.selectAll("thead th").classed("colTri croissant decroissant",false);
            th1.classed("colTri",true).classed("croissant",true);
            ascending=true;
        }
        const tableNode=table.node();
        const tbody = document.querySelector("tbody",tableNode);
        Array.from(tableNode.querySelectorAll('tbody tr:nth-child(n+1)'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), ascending))
            .forEach(tr => tbody.appendChild(tr) );
    })));    
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

// redefine function from drawDependencies to ignore clicking on tokens to display 
// in the table, because it is not guaranteed that the token is shown in the table
function drawSentence(display,ud){
    var endX=startX;
    // draw the words of the sentence and update width and x in deps
    for (var i = 1; i < ud.nodes.length; i++) {
        var udn=ud.nodes[i];
        var [width,word]=addWord(display,null,endX,startY,udn.form,
                         `${udn.id} ${udn.lemma} ${udn.upos} ${udn.options2feats(udn.feats)}`,
                          i==ud.root.id,udn.form!=ud.tokens[i]);
        udn.x=endX;
        udn.width=width;
        udn.mid=endX+width/2;
        udn.wordInTree=udn.wordInLinks=word;
        endX+=width+wordSpacing;
    }
    return endX;
}


function UDgrepLoad(){
    dependencies=d3.select("#dependencies");
    tree=d3.select("#tree");
    createFilters();
    initTable();
    d3.select("#maxTokens").text(maxTokensDisplayed.toLocaleString()); // insert current value in the web page
    uds=parseUDs(initUD,"initUDs");
    parse();
    d3.select("#file-input").on("change",getFile);
    d3.select("#parse").on("click",parse);
    d3.select("#showHideInstructions").on("click",toggleInstructions);
    d3.select("#displayType").on("change",function(){
        showSentenceParse(currentUD);
    });
    d3.select("#wordSpacing").on("change",function(){
        wordSpacing=+this.value;
        showSentenceParse(currentUD);
    });
    d3.select("#letterSpacing").on("change",function(){
        letterSpacing=+this.value;
        showSentenceParse(currentUD);
    });
    d3.select("body").on("keydown",function(){
        if (selectedTR==null)return;
        const key=d3.event.keyCode;
        if (key==38){// up
            if (selectedTR.previousSibling!=null){
                showSentenceFromRow(selectedTR.previousSibling);
                selectedTR.scrollIntoView(false);
                d3.event.preventDefault();
            }
        } else if (key==40) {// down
            if (selectedTR.nextSibling!=null){
                showSentenceFromRow(selectedTR.nextSibling);
                selectedTR.scrollIntoView(false)
                d3.event.preventDefault();
            }
        }
    })
    // allow file selection via drag and drop
    // adapted from https://stackoverflow.com/questions/47515232/how-to-set-file-input-value-when-dropping-file-on-page/47522812#47522812

    let docElem = document.documentElement;
    let body = document.body;
    let fileInput = document.querySelector('#file-input');

    docElem.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('dragging');
    });

    docElem.addEventListener('dragleave', () => {
      body.classList.remove('dragging');
    });

    docElem.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('dragging');
  
      fileInput.files = e.dataTransfer.files;
    });
}

d3.select(window).on("load",UDgrepLoad);
