var language;

exempleFr= `var dest=NP(D("le"),N("monde"));
S(Pro("je").pe(1),
  VP(V("dire"),
     "bonjour",
     PP(P("à"),dest.tag("b"))))
`
exempleEn=`var dest=NP(D("the"),N("world"));
S(Pro("I").pe(1),
  VP(V("say"),
     "hello",
     PP(P("to"),dest.tag("b"))))
`

function checkLanguage() {
    language = $("#francais")[0].checked?"fr":"en";
    if(language == 'fr'){
        loadFr();
        $("#realize").val("Réaliser");
        $("#titreResult").text("Réalisation");
        $("#doc").attr("href","../../documentation/user.html?lang=fr")
        $("#input").val(exempleFr)
        $("#result").html("")
    }
    else{
        loadEn();
        $("#realize").val("Realize");
        $("#titreResult").text("Realization")
        $("#doc").attr("href","../../documentation/user.html?lang=en")
        $("#input").val(exempleEn)        
        $("#result").html("")
    }
};

function realize(){
    var res;
    try {
        res=eval($("#input").val()).toString();
    } catch (err){
        res=(language=='fr'?"<b>Erreur: </b>":"<b>Error: </b>")+err;
    }
    $("#result").html(res);    
}

$(document).ready(function(){
    checkLanguage();
    setExceptionOnWarning(true);
    $("#francais,#english").click(checkLanguage);
    $("#realize").click(realize);
});