let fieldNames,allFields,$fields,$sentences,$search,$corpus,mrRefs;

function getDataSet(dataFileName){
    $.get(dataFileName,function(data){
        mrRefs=data.trim().split("\n").map(makeInfos)
        search(false);
    }).fail($search.append($("b").text(dataFileName+" not found")));
}

function createFields(data){
    allFields=data
    fieldNames=Object.keys(allFields);
    console.log(fieldNames);
    var $tr=$("<tr/>");
    for (var i = 0; i < fieldNames.length; i++) {
        $tr.append($("<th>"+fieldNames[i]+"</th>"))
    }
    $fields.append($tr);
    $tr=$("<tr/>")
    for (var i = 0; i < fieldNames.length; i++) {
        var fn=fieldNames[i];
        var $select=$("<select class='field' name='"+fn+"'><option value=''></option></select>");
        allFields[fn].sort()
        for (var j = 0; j < allFields[fn].length; j++) {
            var v=allFields[fn][j];
            $select.append($("<option value='"+v+"'>"+v+"</option>"))
        }
        $tr.append($("<td/>").append($select))
        $fields.append($tr);
    }
}

function createSearch(data){
    var $searchB=$("<input type='button' value='search'></input>")
    $searchB.click(e=>search(false));
    $search.append($searchB);
    var $resetB=$("<input type='button' value='reset'></input>");
    $resetB.click(function(e){$(".field").each(function(j){$(this).val("")})});
    $search.append($resetB);
    var $randomB=$("<input type='button' value='random'></input>");
    $randomB.click(function(e){
        $(".field").each(function(j){
            var fs=Array.from(allFields[fieldNames[j]]);
            fs.push('')
            $(this).val(oneOf(fs));
        });
        search(false)
    });
    $search.append($randomB);
    
}

function filter(fields,infos,strict){
    for (var i=0;i<fieldNames.length;i++){
        var fn=fieldNames[i];
        if (fn in fields){
            var o=infos[fn]
            if (o==undefined)return false;
            if (o!=fields[fn] && fields[fn]!="any")return false;
        } else {
            if (strict && infos[fn]!=undefined) 
                return false;
        }
    }
    return true
}

function showValuesInMenu(event){
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
    // realize all variations of mr
    $("#jsrPersonality").empty()
    let selectPers=mr["personality"];
    $("#jsrPersonality").append(`<tr><td>${selectPers}</td>}<td>${personalized_recommandation(selectPers,mr)}</td></tr>`)
    for (pers of mr_values["personality"]){
        if (pers != selectPers){
            $("#jsrPersonality").append(`<tr><td>${pers}</td>}<td>${personalized_recommandation(pers,mr)}</td></tr>`)
        }
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

function changeCorpus(){
    const corpusType=$corpus.val()
    dataFileName=`./data/personage-nlg-${corpusType}.jsonl`
    getDataSet(dataFileName);
    $("input[value=reset]").trigger("click");
    $("input[value=search]").trigger("click");
}


function search(strict){
    $sentences.empty()
    $("#jsrPersonality").empty();
    var fields=getFieldsFromMenus();
    if (Object.keys(fields).length==0)strict=false; // force non strict on all empty
    var references=[];
    let first;
    for (var i = 0; i < mrRefs.length; i++) {
        var mrRef=mrRefs[i];
        if (filter(fields,mrRef,strict)){
            references.push(mrRef["ref"]);
            $sentences.append($(`<tr><td>${mrRef["personality"]}</td><td id="I${i}">${mrRef["ref"]}</td></tr>`));
            if (first===undefined)first=mrRef
        }
    }
    $("#nbSent").text(references.length.toLocaleString());
    // if (first===undefined) return;
    // let selectPers=fields["personality"];
    // if (selectPers===undefined)selectPers=first["personality"];
    // $("#jsrPersonality").append(`<tr><td>${selectPers}</td>}<td>${personalized_recommandation(selectPers,first)}</td></tr>`)
    // for (pers of mr_values["personality"]){
    //     if (pers != selectPers){
    //         $("#jsrPersonality").append(`<tr><td>${pers}</td>}<td>${personalized_recommandation(pers,first)}</td></tr>`)
    //     }
    // }
}
