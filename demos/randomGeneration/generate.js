//
//  JSrealBDemo
//    Guy Lapalme (April 2020):
//     reorganize the code to use new jsRealB: capabilities: toSource(), oneOf
//     a single JavaScript file is used for both languages
//     new user interface (with bootstrap)
//

var lexicon;

// construit la liste des arguments plutôt que .add pour avoir une forme source regénérée plus sympathique
function expressionNP(suffix){
    if ($("#usePron"+suffix).is(":checked")){
        let personne=parseInt($("#pers"+suffix).val());
        let nombre=$("#number"+suffix).val();
        let genre=$("#gender"+suffix).val()
        return Pro(enFrancais?"je":"I").pe(personne).n(nombre).g(genre)
    } else {
        let det=cbVal("det"+suffix);
        let nom=$("#nom"+suffix).val();
        let adj=$("#adj"+suffix).val();
        let adjAnt=$("#adjAnt"+suffix).val();
        let adjForm=cbVal("adjForm"+suffix);
        let pluriel=$("#nounPlural"+suffix).is(":checked");
        let pronom=$("#nounPron"+suffix).is(":checked");
        if (nom=="")return null;
        let n=N(nom)
        if (pluriel)n.n("p");
        let nArgs= det=="nil"?[n]:[D(det),n];
        if (adj != ""){
            let a=A(adj);
            if (adjAnt)a.pos(adjAnt);
            if (adjForm!="nil")a.f(adjForm);
            nArgs.push(a);
        }
        let np=NP.apply(null,nArgs)
        if (pronom)np.pro()
        return np
    }
}

function expressionVerbe(verbe,temps){
    if(verbe!=""){
        let v=V(verbe).t(temps);
        if (temps=="ip")
            v.pe($("#pers").val()).n($("#number").val());
        return v;
    }
    return null;
}

function option(code,nom){
    return DOMtag(option,nom,{value:code});
}

var codesTemps=
     enFrancais ? {
        ind:{p:"présent",i:"imparfait",ps:"passé simple", f:"futur"},//,ip:"impératif"},
        comp:{pc:"passé composé",pq:"plus-que-parfait",fa:"futur antérieur"},
        cond:{c:"présent",cp:"passé"},
        sub:{s:"présent",si:"imparfait",spa:"passé",spq:"plus-que-parfait"},
        imp:{ip:"présent"},
     } : {
        ind:{p:"present",ps:"past",f:"future"},
        imp:{ip:"present"}
    };
;

var codesPersonne={
    imp:{p:[1,2],s:[2]},
    aut:{p:[1,2,3],s:[1,2,3]}
};
var tagPersonne = {
    1:enFrancais?"1ière":"1st",
    2:enFrancais?"2ième":"2nd",
    3:enFrancais?"3ième":"3rd"
};

function cbVal(cbName){
    return $(`input[name="${cbName}"]:checked`).val();
}
    
function changeTemps(){
    // console.log("appel de changeTemps");
    var select=$("<select>").attr({id:"tense",size:1}).addClass("custom-select","col-2");
    var cts=codesTemps[$("#mode").val()];
    for(var ct in cts)
        select.append($("<option>"+cts[ct]+"</option>").attr({value:ct}));
    var oldSelect=$("#tense");
    oldSelect.replaceWith(select);

    var tempsSel = ($("#mode").val() == "imp")?"imp":"aut";
    var nombre = $("#number").val();
    var perSelect=$("<select>").attr({id:"pers",size:1}).addClass("custom-select","col-2");

    for (var pers in codesPersonne[tempsSel][nombre]){
      perSelect.append($("<option>"+tagPersonne[codesPersonne[tempsSel][nombre][pers]]+
                        "</option>").attr({value:codesPersonne[tempsSel][nombre][pers]}))
    }       
    var oldPerSelect =$("#personne");
    oldPerSelect.replaceWith(perSelect);
}

function buildJsRealExpr(){
    var sujet=null;
    if ($("#temps").val() !== "ip"){ // ignorer le sujet si à l'impératif
        sujet=expressionNP("");
    }
    var verbe=expressionVerbe($("#verbe").val(),$("#tense").val());
    var objDirNominalise=$("#est-pronomOD").is(":checked");
    var objetDirect=expressionNP("OD");
    var prepOI=$("#prepOI").val();
    var objetIndirect=expressionNP("OI");

    if(sujet!=null || verbe!=null){
        // on construit la liste des paramètres plutôt que d'utiliser .add pour que l'expression
        // générée ressemble à un appel normal...
        let args=[];
        var options={}
        let expr;
        if (verbe!=null){
            if (sujet!=null)args.push(sujet);
            let vpArgs=[verbe]
            if (objetDirect!=null){
                vpArgs.push(objetDirect);
            }
            if (prepOI != "" || objetIndirect !=null){
                if (prepOI != "" && objetIndirect !=null){
                    vpArgs.push(PP(P(prepOI),objetIndirect));
                } else {
                    $("#jsreal").val(
                        enFrancais ? "objet indirect exige une préposition et un objet"
                                   : "indirect object needs a preposition and an object");
                    return;
                }
            }
            args.push(VP.apply(null,vpArgs));
            expr=S.apply(null,args)
            //Ajout type de phrase
            if ($("#negation").is(':checked'))options.neg=true;
            if ($("#contraction").is(':checked'))options.contr=true;
            if ($("#passive").is(':checked'))options.pas=true;
            if ($("#perfect").is(':checked'))options.perf=true;
            if ($("#progressive").is(':checked'))options.prog=true;
            if ($("#exclamative").is(":checked"))options.exc=true;
            const modVal=$("#modSpec").val()
            if (modVal!="base")options.mod=modVal;
            const intVal=$("#intSpec").val();
            if (intVal!="base")options.int=intVal;
        } else {
            expr=S(sujet)
        }
        return {js:expr,options:options}
    } else {
        return null
    }
}


function showExpr(exprOptions){
    if (exprOptions==null){
        $("#jsreal").val(enFrancais?"au moins un sujet et un verbe doivent être spécifiés":
                                    "at least a subject or a verb must be given");
        return;
    }
    const jsexpr=exprOptions["js"];
    const options=exprOptions["options"];
    if (jsexpr!==undefined){
        // create the jsRealB expression
        if (Object.keys(options).length==0){
            $("#jsreal").val(jsexpr.toSource(0))
            $("#json").val(ppJSON(jsexpr.toJSON()))
            $("#realisation").val(jsexpr.toString());
        } else {
            // keep a copy before the options are processed, because they can modify the expression...
            const jsexprC=jsexpr.clone() 
            $("#jsreal").val(jsexpr.toSource(0)+".typ("+JSON.stringify(options)+")");
            jsexprC.typ(options)
            $("#realisation").val(jsexprC.toString());
            let jsonExpr=jsexpr.toJSON();
            jsonExpr["typ"]=options;
            $("#json").val(ppJSON(jsonExpr));
        }
    } else {// the JSON was modified
        const jsexpr=fromJSON(exprOptions["json"]);
        $("#jsreal").val(jsexpr.toSource(0));
        $("#realisation").val(jsexpr.toString());
    }
}

// vocabulaire pour les tirages aléatoires
// initialisé à la lecture du vocabulaire

var lesNoms,lesAdjectifs,lesVerbes,LesPrepositions;

function aleatoire() {
    radioButtonAleatoire("det");
    $('#nom').val(oneOf(lesNoms));
    radioButtonAleatoire("adjForm");
    $('#adj').val(oneOf(lesAdjectifs));
    $('#pluriel').val(oneOf([true,false]));
    deroulantAleatoire($('#personne'));
    deroulantAleatoire($("#nombre"));

    radioButtonAleatoire("detOD");
    $('#nomOD').val(oneOf(lesNoms))
    radioButtonAleatoire("adjFormOD");
    $('#adjOD').val(oneOf(lesAdjectifs));
    $('#plurielOD').val(oneOf([true,false]));

    $('#verbe').val(oneOf(lesVerbes));
    $('#mode').prop("selectedIndex", 0); // toujours indicatif
    changeTemps();
    deroulantAleatoire($('#temps'), true);
    //options aléatoires
    $('#negation').val(oneOf([true,false]));

    $('#prepOI').val(oneOf(lesPrepositions));
    radioButtonAleatoire("detOI");
    $('#nomOI').val(oneOf(lesNoms));
    radioButtonAleatoire("adjFormOI");
    $('#adjOI').val(oneOf(lesAdjectifs));
    $('#plurielOI').val(oneOf([true,false]));
    $('#negation').val(oneOf([true,false]));
    // $('#est-pronomOI').val(oneOf([true,false]));
    changeTemps();
    showExpr(buildJsRealExpr())
}

function deroulantAleatoire($selObj, zeroAcceptable) {
    const l=$selObj.find("option").length;
    $selObj.prop("selectedIndex", 
                 Math.floor(typeof(zeroAcceptable)!=='undefined'?Math.random()*l:Math.random()*(l-1)+1));
}

function radioButtonAleatoire(rbName){
    const l= $(`input[name=${rbName}]`);
    $(l[Math.floor(Math.random()*l.length)]).prop("checked","checked")
}

function aleatoireBinaire($checkBox) {
    $checkBox.prop("checked",oneOf([true,false]));
}

// pour que l'autocomplete ne cherche que les mots débutant par le préfixe. 
function chercher(liste){
    return function( request, response ) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
          response( $.grep( liste, function( item ){
              return matcher.test( item );
          }))
      }
}

// récupérer le vocabulaire pour la génération aléatoire
function initVocabulaire(){
    lesNoms=[];
    lesVerbes=[];
    lesAdjectifs=[];
    lesPrepositions=[];
    $.each(lexicon,function(key,value){
        if(value["N"])lesNoms.push(key);
        if(value["A"])lesAdjectifs.push(key);
        if(value["V"])lesVerbes.push(key);
        if(value["P"])lesPrepositions.push(key);
    })
    // ajouter les autocomplete
    function ajouterAutocomplete(matchPrefix,list){
        $(`input[name^=${matchPrefix}].typeahead`).typeahead(
            {hint:true,hightlight:true,minLength:1},
            {name:matchPrefix,source:new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: list
            })}
       );
    }
    ajouterAutocomplete("nom",lesNoms);
    ajouterAutocomplete("adj",lesAdjectifs);
    ajouterAutocomplete("verbe",lesVerbes);
    ajouterAutocomplete("prep",lesPrepositions);
}

function usePronounCallback(self,selectors){
    const checked=$(self).is(":checked")
    $(selectors).prop("readonly",checked)
                .css("background-color",checked?"#EEE":"#FFF")    
}

$(document).ready(function() {
    if (enFrancais){
        loadFr(); 
    } else{
        loadEn();
    }
    lexicon=getLexicon(); 
    changeTemps();
    initVocabulaire();
    // boutons de réalisation
    $("#realiser").on("click",function(){ showExpr(buildJsRealExpr()) });
    $("#realiserJS").on("click",function(){showExpr({js:eval($("#jsreal").val()),options:{}}) });
    $("#realiserJSON").on("click",function(){showExpr({json:JSON.parse($("#json").val())}) });
    // désactiver l'entrée des noms et adjectifs lors de usePronoun
    $(`#usePron`)  .on("click",function(){usePronounCallback(this,"#nom,#adj")})
    $(`#usePronOD`).on("click",function(){usePronounCallback(this,"#nomOD,#adjOD")})
    $(`#usePronOI`).on("click",function(){usePronounCallback(this,"#nomOI,#adjOI")})
    
    $("#mode").on("change",changeTemps);
    $("#aleatoire").on("click",aleatoire);
});

