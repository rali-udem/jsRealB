"use strict";
var lang,format;

const exempleFr= `var dest=NP(D("le"),N("monde"));
S(Pro("je").pe(1),
  VP(V("dire"),
     "bonjour",
     PP(P("à"),dest.tag("b"))))
`;

const exempleFrJSON = `{"phrase":"S",
 "elements":[{"terminal":"Pro", "lemma":"je", "props":{"pe":1}},
             {"phrase":"VP",
              "elements":[{"terminal":"V", "lemma":"dire", "props":{"aux":"av"}},
                          {"terminal":"Q", "lemma":"bonjour"},
                          {"phrase":"PP",
                           "elements":[{"terminal":"P", "lemma":"à"},
                                       {"phrase":"NP",
                                        "elements":[{"terminal":"D", "lemma":"le"},
                                                    {"terminal":"N", "lemma":"monde", "props":{"g":"m"}}],
                                        "props":{"tag":[["b", {}]]}}]}]}],
"lang":"fr"}
`;

const exempleEn=`var dest=NP(D("the"),N("world"));
S(Pro("I").pe(1),
  VP(V("say"),
     "hello",
     PP(P("to"),dest.tag("b"))))
`;

const exempleEnJSON=`{"phrase":"S",
 "elements":[{"terminal":"Pro", "lemma":"I", "props":{"pe":1}},
             {"phrase":"VP",
              "elements":[{"terminal":"V", "lemma":"say"},
                          {"terminal":"Q", "lemma":"hello"},
                          {"phrase":"PP",
                           "elements":[{"terminal":"P", "lemma":"to"},
                                       {"phrase":"NP",
                                        "elements":[{"terminal":"D", "lemma":"the"},
                                                    {"terminal":"N", "lemma":"world"}],
                                        "props":{"tag":[["b", {}]]}}]}]}],
"lang":"en"}
`;

const exempleEnFr=`loadFr();
var dest=NP(D("le"),N("monde"));
loadEn();
S(Pro("I").pe(1),
  VP(V("say"),
     "hello",
     PP(P("to"),dest.tag("b"))))
`;

const exempleEnFrJSON=`{"phrase":"S",
 "elements":[{"terminal":"Pro", "lemma":"I", "props":{"pe":1}},
             {"phrase":"VP",
              "elements":[{"terminal":"V", "lemma":"say"},
                          {"terminal":"Q", "lemma":"hello"},
                          {"phrase":"PP",
                           "elements":[{"terminal":"P", "lemma":"to"},
                                       {"phrase":"NP",
                                        "elements":[{"terminal":"D", "lemma":"le"},
                                                    {"terminal":"N", "lemma":"monde", "props":{"g":"m"}}],
                                        "props":{"tag":[["b", {}]]},
                                        "lang":"fr"}]}]}],
 "lang":"en"}
`;


const exemples = {
    "en"   :{"jsRealB":exempleEn,  "JSON":exempleEnJSON},
    "fr"   :{"jsRealB":exempleFr,  "JSON":exempleFrJSON},
    "en-fr":{"jsRealB":exempleEnFr,"JSON":exempleEnFrJSON}
}


function changeExemple() {
    if (lang !== undefined){// sauver la valeur courante
        const editorVal=editor.getValue();
        if (editorVal.length==0)return;
        exemples[lang][format]=editorVal;
    }
    lang=$("input[name='language']:checked").val();
    format=$("input[name='format']:checked").val();
    if(lang == 'fr'){
        $("#titre1").html('Réaliser une expression <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a>')
        $("#realize").val("Réaliser");
        $("#titreResult").text("Réalisation");
        $("#doc").attr("href","../../documentation/user.html?lang=fr")
        loadFr();
    }
    else{
        $("#titre1").html('Realize a <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a> expression')
        $("#realize").val("Realize");
        $("#titreResult").text("Realization")
        $("#doc").attr("href","../../documentation/user.html?lang=en")
        loadEn();
    }
    editor.setValue(exemples[lang][format]);
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
    $("#francais,#english,#jsrealb,#json").click(changeExemple);
    $("#realize").click(realize);
});