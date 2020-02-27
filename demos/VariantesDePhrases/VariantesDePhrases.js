var struct;

var $langue,$generer,$tab;
var $struct,$tbody,$infos,$message;

var allTypes=["neg","contr","pas","prog","perf","int","mod"];
var types; // change selon la langue
var pos={"int":["yon","wos","wod","wad","woi","whe","why","whn","how","muc"],
         "mod":["poss","perm","nece","obli","will"]}
var nb,ex;

// gérer un three state checkbox (i.e. on alterne entre checked )
// adapté de https://css-tricks.com/indeterminate-checkboxes/
function threeStatesCB() {
  if (this.readOnly) this.checked=this.readOnly=false;
  else if (!this.checked) this.readOnly=this.indeterminate=true;
}

// génération d'une phrase
function generer(s,$tab,obj){
    // console.log("generer(%o)",obj);
    var $tr=$("<tr/>");
    for (var i = 0; i < types.length; i++) {
        var v=obj[types[i]];
        $tr.append(v?("<td>"+v+"</td>"):"<td/>");
    }
    $tr.append("<td>"+s.clone().typ(obj)+"</td>");
    $tab.append($tr);
    nb++;
}

// génération récursive de toutes les possibilités de types
function genererTypes(s,$tab,types,obj){
    // console.log("genererTypes(%o,%o)",types,obj);
    if (types.length==0){
        generer(s,$tab,obj)
    } else {
        var type=types[0]
        obj[type]=false;
        genererTypes(s,$tab,types.slice(1),obj);
        var $cbType=$("#cb-"+type)
        if ($cbType.is(":checked") || $cbType.prop("indeterminate")){
            if (type in pos){ // plusieurs possibilités
                if ($cbType.prop("indeterminate")){ // ne faire que la première
                    obj[type]=pos[type][0];
                    genererTypes(s,$tab,types.slice(1),obj);
                } else {
                    var poss=pos[type]
                    for (var i = 0; i < poss.length; i++) {
                        obj[type]=poss[i];
                        genererTypes(s,$tab,types.slice(1),obj);
                    }
                }
            } else { // que vrai et faux comme alternatives
                obj[type]=true;
                genererTypes(s,$tab,types.slice(1),obj);
            }
        }
    }
}

function genererHeader(lang){
    $tab.empty();
    types=allTypes.slice(); // copier tous les types
    if (lang=="fr"){// pas de "perf", ni "contr" en français, les enlever de types
        types.splice(types.indexOf("perf"),1)
        types.splice(types.indexOf("contr"),1)
    }
    // générer le titre du tableau
    var $thead=$("<thead></thead>");
    var $tr=$("<tr></tr>");
    $thead.append($tr);
    for (var i = 0; i < types.length; i++) {
        var type=types[i];
        var cb = '<input type="checkbox" checked="checked" id="cb-'+type+'"/> ';
        $tr.append("<th class='flag'>"+cb+type+"</th>")
    }
    $tr.append(lang=="fr"?"<th>Réalisation (<span id='nbSentences'/> phrases)</th>":
                          "<th>Realization (<span id='nbSentences'/> sentences)</th>");
    $tab.append($thead);
    $tbody=$("<tbody></tbody>");
    $tab.append($tbody);
    // patch for three state checkboxes
    for (type in pos){
        $("#cb-"+type).prop("checked",false).prop("indeterminate",true).click(threeStatesCB);
    }
}

function genererStruct(struct,lang){
    $tbody.empty();
    // évaluer les phrases
    try {
        nb=0;
        genererTypes(eval(struct),$tbody,types,{});
        $message.html("&nbsp;")
        $("#nbSentences").text(nb);
    } catch (err) {
        $message.text((lang=="fr"?"Erreur dans la structure jsRealB: ":
                                  "Error in jsRealB: ")+err.message);
    }
}

function showLangTextArea(){
    var isEn=$langue.val()=="en";
    var $currentMenu;
    if (isEn) {
        $sentMenuEn.show();$sentMenuFr.hide();
        genererHeader("en");
        loadSentence($sentMenuEn,examplesEn);
    } else {
        $sentMenuEn.hide();$sentMenuFr.show();
        genererHeader("fr");
        loadSentence($sentMenuFr,examplesFr);
    }
}

function createSentenceMenu(lang,examples,$menu){
    if (lang=="en")loadEn();else loadFr();
    for (var i = 0; i < examples.length; i++) {
        var expr=examples[i].expr;
        var sent=eval(expr).toString();
        examples[i].sent=sent;
        var $option=$(`<option value="${i}">`+sent+"</option>");
        if (i==0)$option.attr("selected","selected");
        $menu.append($option);
    }
}

function loadSentence($menu,examples){
    var index=parseInt($menu.val());
    ex=examples[index]
    $struct.val(ex.expr.trim());
    if (ex.ref!==undefined){
        $infos.html('<a target="_blank" href="'+ex.url+'">'+ex.ref+'</a> '+ex.no);
    }
    $("tbody",$tab).empty();
    $("#nbSentences").text("-");
    $message.html("&nbsp;")
}

$(document).ready(function() {
    $sentMenuEn=$("#sentMenuEn");
    $sentMenuFr=$("#sentMenuFr");
    $struct=$("#struct");
    $langue=$("#langue");
    $infos=$("#infos");
    $tab=$("#tab");
    $message=$("#message");
    $langue.change(showLangTextArea);
    $generer=$("#generer");
    createSentenceMenu("en",examplesEn,$sentMenuEn);
    createSentenceMenu("fr",examplesFr,$sentMenuFr);
    $sentMenuEn.change(function(){loadSentence($sentMenuEn,examplesEn)});
    $sentMenuFr.change(function(){loadSentence($sentMenuFr,examplesFr)});
    showLangTextArea();
    $generer.click(function(e){
        if ($langue.val()=="en"){
            loadEn();
            genererStruct($struct.val(),"en")
        } else {
            loadFr();
            genererStruct($struct.val(),"fr")
        }
    });
});

