"use strict";
var lang,format,representation;

const constituentFr= `var dest=NP(D("le"),N("monde"));
S(Pro("je").pe(1),
  VP(V("dire"),
     "bonjour",
     PP(P("à"),dest.tag("b"))))
`;

const dependencyFr= `var dest=comp(N("monde"),det(D("le")));
root(V("dire"),
     subj(Pro("je").pe(1)),
     comp("bonjour"),
     comp(P("à"),
          dest.tag("b")))
`;

loadFr();
const constituentFrJSON = ppJSON(eval(constituentFr).toJSON())
const dependencyFrJSON = ppJSON(eval(dependencyFr).toJSON())

const constituentEn=`var dest=NP(D("the"),N("world"));
S(Pro("I").pe(1),
  VP(V("say"),
     "hello",
     PP(P("to"),dest.tag("b"))))
`;

const dependencyEn=`var dest=comp(N("world"),det(D("the")));
root(V("say"),
     subj(Pro("I").pe(1)),
     comp("hello"),
     comp(P("to"),
          dest.tag("b")))
`;

loadEn()
const constituentEnJSON = ppJSON(eval(constituentEn).toJSON());
const dependencyEnJSON = ppJSON(eval(dependencyEn).toJSON());

const constituentEnFr=`loadFr();
var dest=NP(D("le"),N("monde"));
loadEn();
S(Pro("I").pe(1),
  VP(V("say"),
     "hello",
     PP(P("to"),dest.tag("b"))))
`;

const dependencyEnFr=`loadFr();
var dest=comp(N("monde"),det(D("le")));
loadEn();
root(V("say"),
     subj(Pro("I").pe(1)),
     comp("hello"),
     comp(P("to"),
          dest.tag("b")))
`;

const constituentEnFrJSON = ppJSON(eval(constituentEnFr).toJSON())
const dependencyEnFrJSON  = ppJSON(eval(dependencyEnFr).toJSON())

const exemples = {
    "constituents":{
        "en"   :{"jsRealB":constituentEn,  "JSON":constituentEnJSON},
        "fr"   :{"jsRealB":constituentFr,  "JSON":constituentFrJSON},
        "en-fr":{"jsRealB":constituentEnFr,"JSON":constituentEnFrJSON},
    },
    "dependencies":{
        "en"   :{"jsRealB":dependencyEn,  "JSON":dependencyEnJSON},
        "fr"   :{"jsRealB":dependencyFr,  "JSON":dependencyFrJSON},
        "en-fr":{"jsRealB":dependencyEnFr,"JSON":dependencyEnFrJSON},
    }
}


function changeExemple() {
    if (lang !== undefined && representation !== undefined){// sauver la valeur courante
        const editorVal=editor.getValue();
        if (editorVal.length==0)return;
        exemples[representation][lang][format]=editorVal;
    }
    lang=$("input[name='language']:checked").val();
    format=$("input[name='format']:checked").val();
    representation=$("input[name='representation']:checked").val();
    if(lang == 'fr'){
        $("#titre1").html('Réaliser une expression <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a>')
        $("#realize").val("Réaliser");
        $("#titreResult").text("Réalisation");
        $("#rep").text("Représentation")
        $("label[for=dependencies]").text("Dépendances")
        $("#doc").attr("href","../../documentation/user.html?lang=fr")
        loadFr();
    }
    else{
        $("#titre1").html('Realize a <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a> expression')
        $("#realize").val("Realize");
        $("#titreResult").text("Realization")
        $("#rep").text("Representation")
        $("label[for=dependencies]").text("Dependencies")
        $("#doc").attr("href","../../documentation/user.html?lang=en")
        loadEn();
    }
    editor.setValue(exemples[representation][lang][format]);
    editor.selection.clearSelection();
    $("#result").html("")
};

function realize(){
    var res;
    try {
        const content=editor.getValue();
        if (format=="JSON"){
            res=fromJSON(JSON.parse(content)).toString();
        } else {
            res=eval(content).toString();            
        }
    } catch (err){
        res=(lang=='fr'?"<b>Erreur: </b>":"<b>Error: </b>")+err;
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
    
    changeExemple();
    setExceptionOnWarning(true);
    $("#francais,#english,#jsrealb,#json,#constituents,#dependencies").click(changeExemple);
    $("#realize").click(realize);
});