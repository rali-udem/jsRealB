// info about a sentence
function UDsent(fileName,sentId){
    this.fileName=fileName;
    this.sentId=sentId;
}
let udContent="";
const maxTokensDisplayed=2000;
const fieldNames=["ID","FORM","LEMMA","UPOS","XPOS","FEATS","HEAD","DEPREL","DEPS","MISC"];
const nbFields=fieldNames.length;
let tokens,      // tokens must be global to get sentence info not in the table
    currentFile, // name of the last file read (useful for avoiding rereading it)
    lineHeight;  // height of the line in the text box (useful for displaying the current sentenc)

// parse the content of the textbox "multiLine" as lines in conllu format
//  which starts at line "startLine" in file "fileName" 
// this applies the initial filters 
function parseUD(fileName,multiLine,startLine){
    tokens=[]
    let lines=multiLine.split(/\n/);
    const nbLines=lines.length;
    let nbTokensFiltered=0;
    // build initial filters
    let filters=[];
    for (var j = 0; j < nbFields; j++) {
        const fn=fieldNames[j];
        const jj=j; // save current j for internal closures
        if ($("#"+fn).hasClass("checked")){
            if ($("#search-"+fn).val()!=""){
                filters.push( (fields)=>new RegExp($("#search-"+fn).val(),"i").test(fields[jj]) )
            }
        } else if ($("#"+fn).hasClass("inv-checked")){
            if ($("#search-"+fn).val()!=""){
                filters.push( (fields)=>!new RegExp($("#search-"+fn).val(),"i").test(fields[jj]) ) // negated regex
            }
        }
    }
    // should we have to check equality between lemma and form
    const eqFN=$("#formEQlemma").prop("checked")
                    ?(form,lemma)=>form.toLowerCase()==lemma.toLowerCase()
                    :$("#formEQlemma").prop("indeterminate")
                       ?(form,lemma)=>form.toLowerCase()!=lemma.toLowerCase()
                       :(form,lemma)=>true;
    // build a list of nodes keeping the head index info
    for (var i=0;i<nbLines;i++){
        let line=lines[i].trim();
        let sentId,text,fields;
        if(line.length>0 && ! line.startsWith("//")){ // useful extension for commenting UD lines for debugging
            if (line.startsWith("#")){
                if (m=/^# sent_id = (.*)$/.exec(line)){
                    currentSentence=new UDsent(fileName,m[1]);
                } else if (m=/^# text = (.*)$/.exec(line)){ // save original text
                    currentSentence.text=m[1];
                    currentSentence.line=startLine+i;
                } else if (line.startsWith("# jsRealB-start")){
                    i++;
                    while(!lines[i].startsWith("# jsRealB-end"))i++;
                }
            } else if (line.match(/^\d+\t/)) {// match lines starting with a single number (skip n-n)
                fields=line.split("\t");
                if(fields.length<nbFields){
                     $("#message").append(`CoNLL-U too short:${i+startLine}:${line}`)
                } else {
                    // "normalize" the fields of the current token
                    for (var j = 0; j < nbFields; j++) {
                        const f=fields[j].trim();
                        if (f=="_")fields[j]="";
                        else if (j==5){
                            const feats=f.split("|");
                            if (feats.length<=3) fields[j]=f;
                            else // FEATS too long, split after the third so that it will displayed on two lines
                                fields[j]=feats.slice(0,3).join("|")+"| "+feats.slice(3).join("|")
                        } else 
                            fields[j]=f;
                    }
                    // check all initial filters [fieldNo,Regex]
                    if (eqFN(fields[1],fields[2]) && filters.every((f)=>f(fields))){ 
                        nbTokensFiltered++;
                        if (nbTokensFiltered<=maxTokensDisplayed){
                            fields.push(startLine+i);
                            fields.push(currentSentence); // add info about the sentence
                            tokens.push(fields)
                        }
                    }
                }
            } else if (!line.match(/^\d+(-|\.)\d+\t/)){// ignore range (indicated by -) and empty nodes (decimal number)
                $("#message").append(`strange line:${i+startLine}:${line}<br/>`);
            }
        }
    }
    return nbTokensFiltered;
}

//   Parse the textbox and fill the table
function parse(){
    $("#message").empty();
    $("#id-text td").text("");
    $("#tokens th").removeClass("colTri decroissant croissant");
    let nbTokensFiltered=parseUD(currentFile,udContent,1);
    $("#message").append(`${nbTokensFiltered.toLocaleString()} tokens`);
    if (nbTokensFiltered>maxTokensDisplayed){
        $("#message").append(` matched the initial filters,`+
                             ` but only the first ${maxTokensDisplayed.toLocaleString()} are displayed</p>`)
    }
    fillTable($("#tokens"));
}

// fill the table 
function fillTable(table$){
    $("tbody tr",table$).remove();
    const tbody=$("tbody",table$);
    // fill content with rows
    for (var i = 0; i < tokens.length; i++) {
        toks=tokens[i];
        let tr$=$("<tr/>");
        for (var j = 0; j < nbFields; j++) {
            const td$=$(`<td class="${fieldNames[j]}">${toks[j]}</td>`);
            tr$.append(td$);
        }
        tr$.data("line",toks[nbFields]);
        tr$.data("sentence",toks[nbFields+1]);
        tbody.append(tr$);
    }
    table$.click(function(e){
        const tgt=e.target;
        if ($(tgt).is("th"))return;// click in the header, this will call the sort
        const tr$=$(tgt).parents("tr");
        const sentence=tr$.data("sentence");
        $("#sentId").text(sentence.sentId);
        $("#tokenId").text($("td",tr$).first().text());
        const lineNo=tr$.data("line");
        $("#lineNo").text(lineNo);
        const form=$("td",tr$).slice(1,2).text();
        $("#text").html(sentence.text.replace(form,'<b>'+form+'</b>'));
    })
}

// show/hide instructions
function toggleInstructions(){
    const me$=$(this);
    const val=me$.val();
    if (val=="Hide instructions"){
        $("#instructions").css("display","none");
        me$.val("Show instructions");
    } else {
        $("#instructions").css("display","block");
        me$.val("Hide instructions");                
    }
}

// deal with a three state checkbox 
// adapted from https://css-tricks.com/indeterminate-checkboxes/
function threeStatesCB() {
  if (this.readOnly) this.checked=this.readOnly=false;
  else if (!this.checked) this.readOnly=this.indeterminate=true;
}

function getFile(){
    let file = $("#file-input").get(0).files[0];
    if (file!==undefined){
        fileName=file.name
        $("#fileName").text(file.name);
        // read the local file
    	let reader = new FileReader();
        // $("*").css("cursor","wait");
    	reader.addEventListener('load', function(e) {
        	udContent=e.target.result;
            parse();
            // $("*").css("cursor","auto");
    	});
    	reader.readAsText(file);
    }
}


jQuery(document).ready(function() {
    const fieldSelect$=$("#fieldSelect");
    // create the initial filter textbox
    for (var j = 0; j < nbFields; j++) {
        const fName=fieldNames[j];
        let span$=$(`<span class="fieldName" id="${fName}">${fName}</span>`);
        fieldSelect$.append(span$);
        let search$=$(`<input type="text" id="search-${fName}" placeholder="${fName=="ID"?"":"regex"}" size="${fName=="ID"?3:10}"/>`);
        fieldSelect$.append(search$);
        search$.hide();
        // add a listener on the textbox
        span$.on("click",function(){
            if ($(this).hasClass("checked")){
                $(this).removeClass("checked").addClass("inv-checked");
                $("#search-"+fName).prop("placeholder","inv-regex");
            } else if ($(this).hasClass("inv-checked")){
                $("#search-"+fName).hide();
                $(this).removeClass("inv-checked");
            } else {
                $("#"+fName).addClass("checked")
                $("#search-"+fName).prop("placeholder","regex").show();
            }
        });
        // add checkbox for equality between form and lemma
        if (j==1){
            let cb$=$(`<input type="checkbox" id="formEQlemma"/>`);
            fieldSelect$
                .append('<label class="fieldName" for="formEQlemma" title="check if FORM and LEMMA are the same">=</label>');
            fieldSelect$.append(cb$);
            cb$.prop("checked",false).prop("indeterminate",false).click(threeStatesCB);
        }
    }
    const table$=$("#tokens")
    // create headers of the table
    let tr$=$("<tr/>");
    for (var j = 0; j < nbFields; j++) {
        const th$=$(`<th class="${fieldNames[j]}">${fieldNames[j]}</th>`);
        const jj=j+1;
        tr$.append(th$);
    }
    $("thead",table$).append(tr$);

    // Table sorting by clicking in the column heading
    // https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript/49041392#49041392
    //  quite subtle but it works efficiently
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;
    const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
        v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
        )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));
    // do the work...
    document.querySelectorAll('#tokens th').forEach(th => th.addEventListener('click', (() => {
        const noCol=Array.from(th.parentNode.children).indexOf(th)
        // var cmp=lt;
        var th$=$(`thead th:nth-child(${noCol+1})`,table$);
        if (th$.hasClass("colTri")){        // changer l'ordre de tri
            // cmp=th$.hasClass("croissant")?gt:lt;
            th$.toggleClass("croissant decroissant")
        } else {
            $("thead th",table$).removeClass("colTri croissant decroissant");
            th$.addClass("colTri croissant");
        }
        const table = th.closest('table');
        const tbody = document.querySelector("tbody",table);
        Array.from(table.querySelectorAll('tbody tr:nth-child(n+1)'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
            .forEach(tr => tbody.appendChild(tr) );
    })));
    $("#maxTokens").text(maxTokensDisplayed.toLocaleString()); // insert current value in the web page
    udContent=initUD;
    parse();
    $("#file-input").change(getFile);
    $("#parse").click(parse);
    $("#showHideInstructions").click(toggleInstructions);
    // add default value because it can happen that lineheight is undefined for reason that I did not managed to understand
    lineHeight=parseInt($("#input").css('line-height')) || 12 ; 
});
