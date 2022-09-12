let fieldNames,allFields,mrRefs,$fields,$sentences,$search,$corpus;
import { apply_parameters } from "./generation_parameters.js";
import {mr_values,params,add_words_to_lexicon,makeInfos,personalized_recommandation} from "./Personage.js"

function getDataSet(dataFileName){
    $.get(dataFileName,function(data){
        mrRefs=data.trim().split("\n").map(makeInfos)
        search();
        $("body").css("cursor", "default");
        $("input[value=reset]").trigger("click");
        $("input[value=search]").trigger("click");
        }).fail($search.append($("b").text(dataFileName+" not found")));
}

export function createFields(data){
    allFields=data
    fieldNames=Object.keys(allFields);
    var $tr=$("<tr/>");
    for (var i = 0; i < fieldNames.length; i++) {
        $tr.append($("<th>"+fieldNames[i]+"</th>"))
    }
    $tr.append("<th>Name</th>");
    $tr.append("<th>Near</th>");
    $fields.append($tr);
    $tr=$("<tr/>")
    for (var i = 0; i < fieldNames.length; i++) {
        var fn=fieldNames[i];
        var $select=$("<select class='field' name='"+fn+"'><option value=''></option></select>");
        for (var j = 0; j < allFields[fn].length; j++) {
            var v=allFields[fn][j];
            $select.append($("<option value='"+v+"'>"+v+"</option>"))
        }
        $tr.append($("<td/>").append($select))
    }
    $tr.append($("<td id='name'></td>"));
    $tr.append($("<td id='near'></td>"));
    $fields.append($tr);
}

export function createSearch(data){
    var $searchB=$("<input type='button' value='search' title='Display sentences with the current field values'></input>")
    $searchB.click(e=>search());
    $search.append($searchB);
    var $resetB=$("<input type='button' value='reset' title='Erase all field values'></input>");
    $resetB.click(function(e){$(".field").each(function(j){$(this).val("")})});
    $search.append($resetB);
    var $randomB=$("<input type='button' value='random' title='Select random values for the fields'></input>");
    $randomB.click(function(e){
        $(".field").each(function(j){
            var fs=Array.from(allFields[fieldNames[j]]);
            fs.push('')
            $(this).val(oneOf(fs));
        });
        search()
    });
    $search.append($randomB);    
}

function filter(fields,infos){
    // keep only records with matching fields (blank matches anything)
    for (var i=0;i<fieldNames.length;i++){
        var fn=fieldNames[i];
        if (fn in fields){
            var o=infos[fn]
            if (o==undefined)return false;
            if (o!=fields[fn] && fields[fn]!="")return false;
        }
    }
    return true
}

export function showValuesInMenu(event){
    $(".current").removeClass("current");
    var $tgt=$(event.target);
    const id= $tgt.attr("id")
    if (id == undefined || id =="sentences")return; // click into the textarea without sentences
    $tgt.addClass("current");
    var i=parseInt(id.slice(1));
    var mr=mrRefs[i];
    $(".field").each(function(j){
        var fn=fieldNames[j];
        $(this).val(fn in mr?mr[fn]:"")
    })
    $("#name").text(mr["name"]);
    $("#near").text(mr["near"]||" ");

    // realize all variations 
    $("#jsrPersonality").empty()
    for (let pers of mr_values["personality"]){
        $("#jsrPersonality").append(`<tr><td>${pers}</td>}<td>${personalized_recommandation(params,pers,mr,apply_parameters)}</td></tr>`)
    }
}

function getFieldsFromMenus(){
    var fields={};
    $(".field").each(function(){
        var $this=$(this);
        var val=$this.val();
        if (val!="")fields[$this.attr("name")]=val
    })
    return fields;
}

export function changeCorpus(){
    $("body").css("cursor", "progress");
    const corpusType=$corpus.val()
    const dataFileName=`./data/personage-nlg-${corpusType}.jsonl`
    getDataSet(dataFileName);
}

function search(){
    $sentences.empty()
    $("#jsrPersonality").empty();
    var fields=getFieldsFromMenus();
    var references=[];
    let first;
    for (var i = 0; i < mrRefs.length; i++) {
        var mrRef=mrRefs[i];
        if (filter(fields,mrRef)){
            references.push(mrRef["ref"]);
            $sentences.append($(`<tr><td>${mrRef["personality"]}</td><td id="I${i}">${mrRef["ref"]}</td></tr>`));
            if (first===undefined)first=mrRef
        }
    }
    $("#nbSent").text(references.length.toLocaleString());
    $("#name,#near").text("");
}

// to debug from Visual Code Studio 
//   start a web server in the jsRealB directory
//   e.g.  python3 -m http.server
$(document).ready(function() {
    $fields=$("#fields");
    $search=$("#search");
    $sentences=$("#sentences");
    $sentences.click(showValuesInMenu);
    $corpus=$("#corpus");
    $corpus.change(changeCorpus);
    changeCorpus();
    createSearch(mrRefs)
    add_words_to_lexicon();
    createFields(mr_values);
})

