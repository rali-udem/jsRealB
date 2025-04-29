"use strict";
var lang,format,representation;
Object.assign(globalThis,jsRealB);

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
    "#rep":["Representation","Représentation"],
    "label[for=dependencies]":["Dependencies","Dépendances"],
    "#const_color":["Constituent color coding","Couleurs des Constituent(s)"],
    "#show_resource_query":["Show resource query","Afficher l'interrogation des ressources"],
    "#hide_resource_query":["Hide resource query","Masquer l'interrogation des ressources"],
    "#res_query_legend":["Query linguistic resources","Interrogation des ressources"],
    "#lex_query>option[value=lx]":["Lexicon","Lexique"],
    "#lex_query>option[value=lm]":["Lemmatize","Lemmatisation"],
    "#rules_query>option[value=dn]":["Declension number","Numéro de déclinaison"],
    "#rules_query>option[value=de]":["Declension ending","Terminaison de déclinaison"],
    "#rules_query>option[value=cn]":["Conjugation number","Numéro de conjugaison"],
    "#rules_query>option[value=ce]":["Conjugation ending","Terminaison de conjugaison"],
    "#to-dependent":["To dependencies","En dépendances"],
    "#to-constituent":["To constituents","En constituants"],
    "#indent":["Indent","Indenter"],
    "#inflection":["Display conjugation and declension in a new tab","Afficher la conjugaison et la déclinaison dans un nouvel onglet"],
    "#lexicon":["Lexicon","Lexique"],
    "#rules":["Rules","Règles"],
}

const attrs = {
    "#doc":["href","../../documentation/user.html?lang=en","../../documentation/user.html?lang=fr"],
    "#lex_query_input":["placeholder","word or regex [/ pos]","mot ou regex [/ pos]"],
}

const typs = ["neg","pas","perf","prog","refl","exc","maje","contr",
              ["mod","poss","perm","nece","obli","will"],
              ["int","yon","wos","was","wod","wad","woi","wai","whe","why","whn","how","muc","tag"]
             ]

function makeTypsMenu(){
    const $fs = $("#typsMenu")
    const sp = "&nbsp;&nbsp;"
    for (let typ of typs){
        if (typeof(typ)=="string"){
            if (typ != "neg") $fs.append(sp);
            $fs.append(typ);
            $fs.append($(`<input type="checkbox" id="typ_${typ}">`));
        } else {
            $fs.append(sp+typ[0])
            const $select = $(`<select id="typ_${typ[0]}"/>`)
            $select.append($("<option>false</option>"))
            for (let i=1;i<typ.length;i++){
                $select.append($(`<option>${typ[i]}</option>`))
            }
            $fs.append($select)
        }
    }
}

function checkTypsMenu(){
    let typOpts = {}
    for (let typ of typs){
        if (typeof(typ)==="string"){
            if ($(`#typ_${typ}`).is(":checked")) typOpts[typ]=true;
        } else {
            const val=$(`#typ_${typ[0]}`).val()
            if (val != "false"){
                typOpts[typ[0]]=val
            }
        }
    }
    return typOpts
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
        $("#typsMenu").prop("title","Modifications de phrase à appliquer. Une modification déjà spécifiée a préséance.")
        $("#to-dependent").prop("title","Transformation 'heuristique' en dépendances; à vos risques et périls!");
        $("#to-constituent").prop("title","Transformation 'heuristique' en constituents; à vos risques et périls!");
        $("#match-case-re-label").prop("title","Respecter la casse")
        $("#lex_query_input").prop("placeholder","mot ou regex");
        $("#rules_query_input").prop("placeholder","numéro ou terminaison")
        for (let t in texts) $(t).text(texts[t][1])
        for (let a in attrs) $(a).attr(attrs[a][0],attrs[a][2])       
        loadFr();
    } else {
        $("#titre1").html('Realize a <a href="https://github.com/rali-udem/jsRealB" title="GitHub - rali-udem/jsRealB: A JavaScript bilingual text realizer for web development" target="_blank">jsRealB</a> expression')
        $("#typsMenu").prop("title","Sentence modifications to apply. An existing modification is not changed.")
        $("#to-dependent").prop("title","'Heuristic' transformation to dependencies; use at your own risk!");
        $("#to-constituent").prop("title","'Heuristic' transformation to constituents; use at your own risk!");
        $("#match-case-re-label").prop("title","Match case")
        $("#lex_query_input").prop("placeholder","word or regex");
        $("#rules_query_input").prop("placeholder","number or ending")
        for (let t in texts) $(t).text(texts[t][0])        
        for (let a in attrs) $(a).attr(attrs[a][0],attrs[a][1])     
        loadEn();
    }
    editor.setValue(exemples[representation][lang][format]);
    $("#to-dependent").prop("disabled",representation=="dependencies");
    $("#to-constituent").prop("disabled",representation=="constituents");
    editor.selection.clearSelection();
    $("#result").html("")
};

function realize(){
    let res, expr;
    try {
        const content=editor.getValue();
        if (format=="JSON"){
            expr = fromJSON(JSON.parse(content))
        } else {
            expr=eval(content);            
        }
        const typs = checkTypsMenu();
        if (expr.props["typ"] !== undefined){ // override tyo menu values with thos at the top of the expression
            Object.assign(typs,expr.props["typ"])
            expr.props["typ"]={}
        }
        if (Object.keys(typs).length>0) expr.typ(typs);
        res = expr.realize()
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
        if (format=="jsRealB")
            editor.setValue(eval(content).toDependent().toSource(0));
        else // JSON format
            editor.setValue(ppJSON(fromJSON(JSON.parse(content)).toDependent().toJSON()))
        editor.selection.clearSelection();
        res="";
        $("#dependencies").prop("checked",true);
        representation="dependencies";
        $("#to-dependent").prop("disabled",true);
        $("#to-constituent").prop("disabled",false);
    } catch (err){
        res=(lang=='fr'?"<b>Erreur: </b>":"<b>Error: </b>")+err;
    }
    $("#result").html(res); 
}

function toConstituent(){
    let res;
    const content=editor.getValue();
    exemples[representation][lang][format]=content; // save current value
    try {
        if (format=="jsRealB")
            editor.setValue(eval(content).toConstituent().toSource(0));
        else // JSON format
            editor.setValue(ppJSON(fromJSON(JSON.parse(content)).toConstituent().toJSON()))
        editor.selection.clearSelection();
        res="";
        $("#constituents").prop("checked",true);
        representation="constituents";
        $("#to-dependent").prop("disabled",false);
        $("#to-constituent").prop("disabled",true);
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
}

function lex_query(e){
    // console.log("lex_query("+e.charCode+")")    
    if (e.which==13){
        let query = $(this).val().trim()
        let category;
        const $result = $("#lex_result")
        const query_type=$("#lex_query").val();
        const match_case = $("#match-case-re").prop("checked")
        $result.text("");
        if (query_type=="lx" && query.indexOf("/")){
            [query,category]=query.split(/ *\/ */)
            if (category !==undefined && !["N","A","Pro","D","V","Adv","C","P"].includes(category)){
                $result.text(category+(lang=="en"? ": bad lexicon category" : ": mauvaise catégorie lexicale"))
                return
            }
        }
        const query_function = query_functions[query_type]
        if (query_function !== undefined){
            const out = query_function(query,undefined,match_case);
            if (typeof out === "string" )
                $result.text(out)
            else {
                if (category === undefined){
                    if (Object.keys(out).length==0){
                        $result.text(query+(lang=="en"? ": not in English lexicon" : ": absent du lexique français"))
                        return;
                    }
                } else {// filter by category
                    for (let word of Object.keys(out)){
                        if (!(category in out[word]))
                            delete(out[word])
                    }
                    if (Object.keys(out).length==0){
                        $result.text(query+":"+category+
                            (lang=="en"? ": not in English lexicon" : ": absent du lexique français"))
                        return;
                    }
                }
                $result.text(ppJSON(out))
            }
        } else {
            $result.text("** Strange query:"+query_type)
        }
     } 
}

function rules_query(e){
    // console.log("rules_query("+e+")")    
    if (e.which==13){
        const $result = $("#rules_result")
        $result.text("");
        let query = $(this).val().trim();
        // guess query_function
        let out;
        if (/^v/.test(query)){
            out=getConjugation(query,lang);
        } else if (/^(n|pn|d)/.test(query)){
            out=getDeclension(query,lang)
        } else {
            out=[getDeclensionEnding(query,lang),getConjugationEnding(query,lang)].join("\n")
            if(out == "\n"){
                out = query + " : " + (lang=="en" ? "no ending found" : "aucune terminaison trouvée")
            }            
        }
        $result.text(out)
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
    
    lemmataEn = buildLemmataMap("en")
    lemmataFr = buildLemmataMap("fr")
    rulesEn = getRules("en")
    rulesFr = getRules("fr")
    makeTypsMenu()

    changeExemple();
    setExceptionOnWarning(true);
    $("#francais,#english,#jsrealb,#json,#constituents,#dependencies").click(changeExemple);
    $("#realize").click(realize);
    $("#indent").click(indent);
    $("#to-dependent").click(toDependent);
    $("#to-constituent").click(toConstituent);
    $("#lex_query_input").keypress(lex_query);
    $("#rules_query_input").keypress(rules_query);
    $("#show_resource_query").click((_)=>show_resource_query(true))
    $("#hide_resource_query").click((_)=>show_resource_query(false))
    $('#resource_query').hide()
});