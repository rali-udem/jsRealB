var struct;

var $structEn,$structFr,s,$langue,$generer,$tab;

var allTypes=["neg","pas","prog","perf","int","mod"];
var types; // change selon la langue
var pos={"int":["yon","wos","wod","wad","woi","whe","why","whn","how","muc"],
         "mod":["poss","perm","nece","obli","will"]}
var nb;

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

function genererTypes(s,$tab,types,obj){
    // console.log("genererTypes(%o,%o)",types,obj);
    if (types.length==0){
        generer(s,$tab,obj)
    } else {
        var type=types[0]
        obj[type]=false;
        genererTypes(s,$tab,types.slice(1),obj);
        if (type in pos){ // plusieurs possibilités
            var poss=pos[type]
            for (var i = 0; i < poss.length; i++) {
                obj[type]=poss[i];
                genererTypes(s,$tab,types.slice(1),obj);
            }
        } else { // que vrai et faux comme alternatives
            obj[type]=true;
            genererTypes(s,$tab,types.slice(1),obj);
        }
    }
}

function genererStruct(struct,lang){
    $("#sortie,#nombre").empty();
    var $tab=$("<table/>");
    $("#sortie").append($tab);
    types=allTypes.slice(); // copier tous les types
    if (lang=="fr")// pas de "perf" en français, l'enlever de types
        types.splice(types.indexOf("perf"),1)
    // générer le titre du tableau
    var $tr=$("<tr/>");
    for (var i = 0; i < types.length; i++) {
        var type=types[i];
        $tr.append("<th>"+type+"</th>")
    }
    $tr.append(lang=="fr"?"<th>Réalisation</th>":"<th>Realization</th>");
    $tab.append($tr)
    // évaluer les phrases
    try {
        nb=0;
        genererTypes(eval(struct),$tab,types,{});
        $("#nombre").append(nb+(lang=="fr"?" phrases réalisées":" realized sentences"))
    } catch (err) {
        $("#nombre").text((lang=="fr"?"Erreur dans la structure jsRealB: ":"Error in jsRealB: ")+err.message);
    }
}

function showLangTextArea(){
    if ($langue.val()=="en")
        {$structFr.hide();$structEn.show();}
    else
        {$structEn.hide();$structFr.show();};
}

$(document).ready(function() {
    $structEn=$("#struct-en");
    $structFr=$("#struct-fr");
    $langue=$("#langue");
    $langue.change(showLangTextArea);
    showLangTextArea();
    $generer=$("#generer");
    $generer.click(function(e){
        if ($langue.val()=="en"){
            $structFr.hide();$structEn.show();
            loadEn();
            genererStruct($structEn.val(),"en")
        } else {
            $structEn.hide();$structFr.show();
            loadFr();
            genererStruct($structFr.val(),"fr")
        }
    });
});
