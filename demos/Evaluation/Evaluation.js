"use strict";
var lang,format,representation;
Object.assign(globalThis,jsRealB);

loadEn();buildLemmataEn();
loadFr();buildLemmataFr();

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

const texts = {  // simple localization of texts
    "#kb-shortcuts":["Editor help","Aide pour l'éditeur"],
    "#realize":["Realize","Réaliser"],
    "#titreResult":["Realization","Réalisation"],
    "#rep":["Representation","Représentation"],
    "label[for=dependencies]":["Dependencies","Dépendances"],
    "#const_color":["Constituent color coding","Couleurs des Constituent(s)"],
    "#show_resource_query":["Show resource query","Afficher l'interrogation des ressources"],
    "#hide_resource_query":["Hide resource query","Masquer l'interrogation des ressources"],
    "#res_query_legend":["Query linguistic resources","Interrogation des ressources"],
    "#type_query>option[value=lx]":["Lexicon","Lexique"],
    "#type_query>option[value=lm]":["Lemmatize","Lemmatisation"],
    "#type_query>option[value=dn]":["Declension number","Numéro de déclinaison"],
    "#type_query>option[value=de]":["Declension ending","Terminaison de déclinaison"],
    "#type_query>option[value=cn]":["Cnnjugation number","Numéro de conjugaison"],
    "#type_query>option[value=ce]":["Conjugation ending","Terminaison de conjugaison"],
    "#to-dependent":["To Dependencies","En Dépendances"],
    "#indent":["Indent","Indenter"],
}

const attrs = {
    "#doc":["href","../../documentation/user.html?lang=en","../../documentation/user.html?lang=fr"],
    "#res_query":["placeholder","word or regex","mot ou regex"],
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
        $("#to-dependent").prop("title","Transformation 'heuristique' des constituents en dépendances");
        for (let t in texts) $(t).text(texts[t][1])
        for (let a in attrs) $(a).attr(attrs[a][0],attrs[a][2])       
        loadFr();
    } else {
        $("#titre1").html('Realize a <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a> expression')
        $("#to-dependent").prop("title","'Heuristic' transformation into dependencies");
        for (let t in texts) $(t).text(texts[t][0])        
        for (let a in attrs) $(a).attr(attrs[a][0],attrs[a][1])     
        loadEn();
    }
    editor.setValue(exemples[representation][lang][format]);
    $("#to-dependent").prop("disabled",representation=="dependencies");
    editor.selection.clearSelection();
    $("#result").html("")
};

function realize(){
    let res;
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

function toDependent(){
    let res;
    const content=editor.getValue();
    exemples[representation][lang][format]=content; // save current value
    try {
        editor.setValue(eval(content).toDependent().toSource(0));
        editor.selection.clearSelection();
        res="";
        $("#dependencies").prop("checked",true);
        representation="dependencies";
        $("#to-dependent").prop("disabled",true);
    } catch (err){
        res=(lang=='fr'?"<b>Erreur: </b>":"<b>Error: </b>")+err;
    }
    $("#result").html(res); 
}

// indent the whole content of the editor using the "improved" indentation algorithm called on a "\n"
// caution: this is different from editor.indent() which adds a tab in from lines in the selection
function indent(){
    const lines=editor.getValue().split("\n");
    if (lines.length==0)return;
    editor.setValue("")
    editor.insert(lines.shift().trim());
    for (let line of lines){
        editor.insert("\n");       // to set proper indent 
        editor.insert(line.trim()) // add trim line
    }
}

const query_functions = {
    "lx":getLexiconInfo,
    "lm":lemmatize,
    "cn":getConjugation,
    "ce":getConjugationEnding,
    "dn":getDeclension,
    "de":getDeclensionEnding
}

function query_resource(e){
    // console.log("query_resource("+e+")")
    const $result = $("#query_result")
    if (e.which==13){
        let query = $("#res_query").val().trim();
        let category;
        const query_type=$("#type_query").val();
        if (query_type=="lx" && query.indexOf(" ")){
            [query,category]=query.split(/ +/)
        }
        $result.text("");
        const query_function = query_functions[query_type]
        if (query_function !== undefined){
            const out = query_function(query);
            if (typeof out === "string" )
                $result.text(out)
                // q_res.session.setValue(out)
            else {
                if (category !== undefined){ // filter by category
                    for (let word in out){
                        if (!(category in out[word]))
                            delete(out[word])
                    }
                    if (Object.keys(out).length==0){
                        $result.text(query+":"+category+":"
                            +(lang=="en"? ": not in English lexicon" : ": absent du lexique français"))
                        return;
                    }
                }
                $result.text(ppJSON(out))
            }
                // q_res.session.setValue(JSON.stringify(out,null," "))
        } else {
            $result.text("** Strange query:"+query_type)
        }
     } 
}

function show_resource_query(show){
    if (show){
        $("#show_resource_query").hide()
        $("#resource_query").show()
    } else {
        $("#show_resource_query").show()
        $("#resource_query").hide()
    }
}
var editor,q_res;

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
    $("#indent").click(indent);
    $("#to-dependent").click(toDependent);
    $("#res_query").keypress(query_resource)
    $("#show_resource_query").click((_)=>show_resource_query(true))
    $("#hide_resource_query").click((_)=>show_resource_query(false))
    $('#resource_query').hide()
});