//
//  JSrealBDemo
//    Guy Lapalme (Feb 2020):
//     reorganize the code to use new jsRealB: capabilities: toSource(), oneOf
//     a single JavaScript file is used for both languages
//

var lexicon;

// construit la liste des arguments plutôt que .add pour avoir une forme source regénérée plus sympathique
function expressionNP(det,nom,adj,adjAnt,adjForm,pluriel,pronom){
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

function expressionVerbe(verbe,temps){
    if(verbe!=""){
        let v=V(verbe).t(temps);
        if (temps=="ip")
            v.pe($("#personne").val()).n($("#nombre").val());
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

function changeTemps(){
    // console.log("appel de changeTemps");
    var select=$("<select>").attr({id:"temps",size:1});
    var cts=codesTemps[$("#mode").val()];
    for(var ct in cts)
        select.append($("<option>"+cts[ct]+"</option>").attr({value:ct}));
    var oldSelect=$("#temps");
    oldSelect.replaceWith(select);

    var tempsSel = ($("#mode").val() == "imp")?"imp":"aut";
    var nombre = $("#nombre").val();
    var perSelect=$("<select>").attr({id:"personne",size:1});

    for (var pers in codesPersonne[tempsSel][nombre]){
      perSelect.append($("<option>"+tagPersonne[codesPersonne[tempsSel][nombre][pers]]+
                        "</option>").attr({value:codesPersonne[tempsSel][nombre][pers]}))
    }       
    var oldPerSelect =$("#personne");
    oldPerSelect.replaceWith(perSelect);

}

function evaluer(){
    $("#realisation").val(eval($("#jsreal").val()).toString());
}

function realiser(){
    var sujet=null;
    if ($("#temps").val() !== "ip"){ // ignorer le sujet si à l'impératif
        sujet=expressionNP($("#det").val(),
                           $("#nom").val(),
                           $("#adj").val(),
                           $("#adjAnt").val(),
                           $("#adjForm").val(),
                           $("#pluriel").is(":checked"),
                           $("#est-pronom").is(":checked"));
        if(sujet==null){
            var personne=parseInt($("#personne").val());
            var nombre=$("#nombre").val();
            if(personne!="nil" && nombre!="nil")
            sujet=Pro(enFrancais?"je":"I").pe(personne).n(nombre)
        }
    }
    var verbe=expressionVerbe($("#verbe").val(),$("#temps").val());
    var objDirNominalise=$("#est-pronomOD").is(":checked");
    var objetDirect=expressionNP($("#detOD").val(),
                                 $("#nomOD").val(),
                                 $("#adjOD").val(),
                                 $("#adjAntOD").val(),
                                 $("#adjFormOD").val(),
                                 $("#plurielOD").is(":checked"),
                                 $("#est-pronomOD").is(":checked"));
    var prepOI=$("#prepOI").val();
    var objetIndirect=expressionNP($("#detOI").val(),
                                   $("#nomOI").val(),
                                   $("#adjOI").val(),
                                   $("#adjAntOI").val(),
                                   $("#adjFormOI").val(),
                                   $("#plurielOI").is(":checked"),
                                   $("#est-pronomOI").is(":checked")); 
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
                    $("#jsreal").val("objet indirect exige une préposition et un objet");
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
            if ($("#excForm").is(":checked"))options.exc=true;
            const modVal=$("#modSpec").val()
            if (modVal!="base")options.mod=modVal;
            const intVal=$("#intSpec").val();
            if (intVal!="base")options.int=intVal;
        } else {
            expr=S(sujet)
        }
        // create the jsRealB expression
        if (Object.keys(options).length==0){
            $("#jsreal").val(expr.toSource(0))
        } else {
            // keep a copy before the options are processed, because they can modify the expression...
            const exprC=expr.clone() 
            expr.typ(options)
            $("#jsreal").val(exprC.toSource(0)+".typ("+JSON.stringify(options)+")");
        }
        $("#realisation").val(expr.toString());
    } else
        $("#jsreal").val("il faut indiquer au moins un sujet ou un verbe");
}

// vocabulaire pour les tirages aléatoires
// initialisé à la lecture du vocabulaire

var lesNoms,lesAdjectifs,lesVerbes,LesPrepositions;

function aleatoire() {
  deroulantAleatoire($('#det'),1);
  $('#nom').val(oneOf(lesNoms));
  // $('#adjAnt')[0][0].selected = 'selected';
  $('#adj').val(oneOf(lesAdjectifs));
  $('#pluriel').val(oneOf([true,false]));
  deroulantAleatoire($('#personne'));
  deroulantAleatoire($("#nombre"));

  deroulantAleatoire($('#detOD'));
  $('#nomOD').val(oneOf(lesNoms))
  // $('#adjAntOD')[0][0].selected = 'selected';
  $('#adjOD').val(oneOf(lesAdjectifs));
  $('#plurielOD').val(oneOf([true,false]));
  // $('#est-pronomOD').val(oneOf([true,false]));

  $('#verbe').val(oneOf(lesVerbes));
  deroulantAleatoire($('#mode'), true);
  changeTemps();
  deroulantAleatoire($('#temps'), true);
  //options aléatoires
  $('#negation').val(oneOf([true,false]));
  //$('#passive').val(oneOf([true,false]));
  //$('#progressive').val(oneOf([true,false]));


  $('#prepOI').val(oneOf(lesPrepositions));
  deroulantAleatoire($('#detOI'));
  $('#nomOI').val(oneOf(lesNoms));
  // $('#adjAntOI')[0][0].selected = 'selected';
  $('#adjOI').val(oneOf(lesAdjectifs));
  $('#plurielOI').val(oneOf([true,false]));
  $('#negation').val(oneOf([true,false]));
  // $('#est-pronomOI').val(oneOf([true,false]));

  realiser(); 
}

function deroulantAleatoire($selObj, zeroAcceptable) {
    const l=$selObj.find("option").length;
    $selObj.prop("selectedIndex", 
                 Math.floor(typeof(zeroAcceptable)!=='undefined'?Math.random()*l:Math.random()*(l-1)+1));
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
    $("input[name^=nom]").autocomplete({source:chercher(lesNoms)});
    $("input[name^=adj]").autocomplete({source:chercher(lesAdjectifs)});
    $("input[name^=verbe]").autocomplete({source:chercher(lesVerbes)});
    $("input[name^=prep]").autocomplete({source:chercher(lesPrepositions)});
}

$(document).ready(function() {
    if (enFrancais){
        loadFr(); 
    } else{
        loadEn();
    }
    lexicon=getLexicon(); 
    $("#realiser").on("click",realiser);
    $("#evaluer").on("click",evaluer);
    $("#aleatoire").on("click",aleatoire);
    $("#mode").prop("selectedIndex",0);
    $("#jsreal").val("");
    $("#realisation").val("");
    changeTemps();
    initVocabulaire();
});

