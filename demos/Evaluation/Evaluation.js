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
        editor.setValue(exempleFr)
        $("#result").html("")
    }
    else{
        loadEn();
        $("#realize").val("Realize");
        $("#titreResult").text("Realization")
        $("#doc").attr("href","../../documentation/user.html?lang=en")
        editor.setValue(exempleEn)
        $("#result").html("")
    }
};

function realize(){
    var res;
    try {
        res=eval(editor.getValue()).toString();
    } catch (err){
        res=(language=='fr'?"<b>Erreur: </b>":"<b>Error: </b>")+err;
    }
    $("#result").html(res);    
}

var editor;

$(document).ready(function(){
    editor = ace.edit("input")
    editor.setTheme("ace/theme/textmate");
    // editor.getSession().setMode("ace/mode/JSreal");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    editor.setFontSize("16px"); // grandeur de police de défaut
    
    checkLanguage();
    setExceptionOnWarning(true);
    $("#francais,#english").click(checkLanguage);
    $("#realize").click(realize);
});