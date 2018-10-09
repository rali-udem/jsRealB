var struct;

var $struct,s,$langue,$generer,$tab;

var types=["exc","neg","pas","prog","int"];
var pos={"int":["yon","wos","wod","woi","wad","whe","whn","how"]}
var nb;

function generer(s,$tab,obj){
    // console.log("generer(%o)",obj);
    $tab.append(
        "<tr>"+
            "<td>"+(obj.exc?obj.exc:"")+"</td>"+
            "<td>"+(obj.neg?obj.neg:"")+"</td>"+
            "<td>"+(obj.pas?obj.pas:"")+"</td>"+
            "<td>"+(obj.prog?obj.prog:"")+"</td>"+
            "<td>"+(obj.int?obj.int:"")+"</td>"+
            "<td>"+s.clone().typ({exc:obj.exc,neg:obj.neg,pas:obj.pas,prog:obj.prog,int:obj.int})+"</td>"
        +"</tr>"
    )
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

$(document).ready(function() {
    $struct=$("#struct");
    $langue=$("#langue");
    $generer=$("#generer");
    $generer.click(function(){
        var lang=$langue.val()
        $("#sortie,#nombre").empty();
        if (lang=="fr")loadFr();
        else loadEn();
        // récupérer la structure
        struct=$struct.text();
        var $tab=$("<table/>");
        $("#sortie").append($tab);
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
            genererTypes(eval($struct.val()),$tab,types,{});
            $("#nombre").append(nb+(lang=="fr"?" phrases réalisées":" realized sentences"))
        } catch (err) {
            $("#nombre").text((lang=="fr"?"Erreur dans la structure jsRealB: ":"Error in jsRealB: ")+err.message);
        }
    });
});
