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
        $("#titre1").html('Réaliser une expression <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a>')
        $("#realize").val("Réaliser");
        $("#titreResult").text("Réalisation");
        $("#doc").attr("href","../../documentation/user.html?lang=fr")
        var currValen=editor.getValue();  // sauver la valeur courante anglaise pour y revenir
        if (currValen.length>0)exempleEn=currValen;
        loadFr();
        editor.setValue(exempleFr)
    }
    else{
        loadEn();
        $("#titre1").html('Realize a <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a> expression')
        $("#realize").val("Realize");
        $("#titreResult").text("Realization")
        $("#doc").attr("href","../../documentation/user.html?lang=en")
        var currValfr=editor.getValue(); // sauver la valeur courante française pour y revenir
        if (currValfr.length>0)exempleFr=currValfr;
        editor.setValue(exempleEn);
    }
    editor.selection.clearSelection();
    $("#result").html("")
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
    editor.setAutoScrollEditorIntoView(true);
    editor.setOption("minLines", 10);
    editor.setOption("maxLines", 20);
    editor.setFontSize("16px"); // grandeur de police de défaut
    
    checkLanguage();
    setExceptionOnWarning(true);
    $("#francais,#english").click(checkLanguage);
    $("#realize").click(realize);
});