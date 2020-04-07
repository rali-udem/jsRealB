var $setName,setName,fieldNames,allFields,$fields,$sentences,$search,mrRefs;

$(document).ready(function() {
    $setName=$("#setName");
    $setName.change(getDataSet);
    $fields=$("#fields");
    $sentences=$("#sentences");
    $sentences.click(showValuesInMenu);
    $search=$("#search");
    getDataSet();
    updateLexicons();
});

function getDataSet(){
    setName=$setName.val();
    $fields.empty();
    $.getJSON(setName+"Fields.json",createFields)
        .fail($search.append($("b").text(setName+"Fields.json not found")))
    $search.empty();    
    $.getJSON(setName+".json",createSearch)
        .fail($search.append($("b").text(setName+".json not found")));
}

function createFields(data){
    allFields=data
    fieldNames=Object.keys(allFields);
    fieldNames.sort((f1,f2)=>allFields[f2].length-allFields[f1].length);
    // console.log(fieldNames);
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
        $select.append("<option value='any'>** any **</option>")
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
    mrRefs=data;
    search(false);
}

function filter(fields,mrRef,strict){
    for (var i=0;i<fieldNames.length;i++){
        var fn=fieldNames[i];
        if (fn in fields){
            var o=mrRef["mr"][fn]
            if (o==undefined)return false;
            if (o!=fields[fn] && fields[fn]!="any")return false;
        } else {
            if (strict && mrRef["mr"][fn]!=undefined) 
                return false;
        }
    }
    return true
}

function showValuesInMenu(event){
    $(".current").removeClass("current");
    var $tgt=$(event.target);
    $tgt.addClass("current");
    var i=parseInt($tgt.attr("id").slice(1));
    var mr=mrRefs[i]["mr"];
    // console.log(i,mr);
    $(".field").each(function(j){
        var fn=fieldNames[j];
        $(this).val(fn in mr?mr[fn]:"")
    })
    search(true);
}

function getFieldsFromMenus(){
    var fields={};
    $(".field").each(function(){
        var $this=$(this);
        var val=$this.val();
        if (val!="" && val!="any")fields[$this.attr("name")]=val
    })
    return fields;
}

function mrEqual(mr1,mr2){
    var mr1Keys=Object.keys(mr1)
    var mr2Keys=Object.keys(mr2)
    if (mr1Keys.length!=mr2Keys.length)return false;
    for (var i = 0; i < mr1Keys.length; i++) {
        var k=mr1Keys[i];
        if (!(k in mr2) || mr1[k]!=mr2[k])return false
    }
    return true;
}

function search(strict){
    $sentences.empty();
    var fields=getFieldsFromMenus();
    if (Object.keys(fields).length==0)strict=false; // force non strict on all empty
    var previousMr={}
    var first=true;
    var references=[];
    for (var i = 0; i < mrRefs.length; i++) {
        var mrRef=mrRefs[i];
        // console.log(mrRef);
        if (filter(fields,mrRef,strict)){
            var $div=$("<div id=s"+i+">"+mrRef["ref"]+"</div>");
            references.push([mrRef["ref"]]);
            if (!first && !mrEqual(previousMr,mrRef["mr"])){
                $div.css("border-top","thin solid black")
            }
            previousMr=mrRef["mr"];
            $sentences.append($div);
            first=false;
        }
    }
    $("#nbSent").text($("div",$sentences).length);
    var jsrOutEn=jsrRealize(fields);
    $("#jsrOutEn").html(jsrOutEn);
    var bleuStr="";
    if (0<references.length && references.length<mrRefs.length){
        bleuStr="BLEU="+bleu([jsrOutEn],references).toFixed(2)
    }
    $("#bleu").text(bleuStr);
    var jsrOutFr=jsrRealiser(fields);
    $("#jsrOutFr").html(jsrOutFr);
}

