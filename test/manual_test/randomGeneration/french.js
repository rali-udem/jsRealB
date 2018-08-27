//
//  JSrealBDemo
//

var lexique;

function expressionNP(det,nom,adj,adjAnt,pluriel,pronom){
    // console.log("expressionNP",det,nom,adj,adjAnt,pluriel,pronom);
    if (pronom!=null){
        var nm=lexique[nom];
        if (nm && nm["N"]){
            return "Pro('"+pronom+"').pe(3).g('"+nm["N"]["g"]+"')"+(pluriel?".n('p')":"");
        }
        return null;
    }
    if(nom!=""){
        var np="NP(";
        if(det!="nil")np+="D('"+det+"'),";
        if(adj!=""  && adjAnt){
            np+="A(\""+adj+"\"),";
        }
        np+="N(\""+nom+"\")";
        if(adj!="" && !adjAnt){
            np+=",A(\""+adj+"\")";
        }
        np+=")";// fin du NP
        if(pluriel)np+=".n('p')";
        return np;
    } 
    return null;
}

function expressionVerbe(){
    var verbe=$("#verbe").val();
    var temps=$("#temps").val();
    if(verbe!=""){
        var v="V(\""+verbe+"\").t('"+temps+"')";
        return v;
    }
    return null;
}

function option(code,nom){
    return DOMtag(option,nom,{value:code});
}

var codesTemps={
        ind:{p:"présent",i:"imparfait",ps:"passé simple", f:"futur"},
        cond:{c:"présent"},
        sub:{s:"présent",si:"imparfait"},
    };

function changeTemps(){
    // console.log("appel de changeTemps");
    var select=$("<select>").attr({id:"temps",size:1});
    var cts=codesTemps[$("#mode").val()];
    for(var ct in cts)
        select.append($("<option>"+cts[ct]+"</option>").attr({value:ct}));
    var oldSelect=$("#temps");
    oldSelect.replaceWith(select);
}

function evaluer(){
    $("#realisation").value=eval($("#jsreal").val()+".real()");
}

function realiser(){
    var sujet=expressionNP($("#det").val(),
                           $("#nom").val(),
                           $("#adj").val(),
                           $("#adjAnt").is(":checked"),
                           $("#pluriel").is(":checked"),
                           $("#est-pronom").is(":checked")?"je":null);
    if(sujet==null){
        var personne=$("#personne").val();
        var nombre=$("#nombre").val();
        if(personne!="nil" && nombre!="nil")
            sujet="Pro('je').pe("+personne+").n('"+nombre+"')";
    }
    var verbe=expressionVerbe();
    var objDirNominalise=$("#est-pronomOD").is(":checked")?"me":null;
    var objetDirect=expressionNP($("#detOD").val(),
                                 $("#nomOD").val(),
                                 $("#adjOD").val(),
                                 $("#adjAntOD").is(":checked"),
                                 $("#plurielOD").is(":checked"),
                                 objDirNominalise);
    var prepOI=$("#prepOI").val();
    var objetIndirect=expressionNP($("#detOI").val(),
                                   $("#nomOI").val(),
                                   $("#adjOI").val(),
                                   $("#adjAntOI").is(":checked"),
                                   $("#plurielOI").is(":checked"),
                                   $("#est-pronomOI").is(":checked")?"moi":null); 
    if(sujet!=null || verbe!=null){
        var expr="S(";
        if(sujet!=null)expr+=sujet;
        if(verbe!=null){
            if(objDirNominalise!=null)expr+=",\n  Pro(\""+objDirNominalise+"\").pe(3).n('s')";
            if(sujet!=null)expr+=",\n  ";
            expr+="VP("+verbe;
            if(objetDirect!=null && objDirNominalise==null)expr+=",\n     "+objetDirect;
            if(prepOI!=""||objetIndirect!=null){
                if(prepOI!="" && objetIndirect!=null){
                   expr+=",\n        PP(P(\""+prepOI+"\"),"+objetIndirect+")"; 
                } else {
                    $("#jsreal").val("objet indirect exige une préposition et un objet");
                    return;
                }
            }
            expr+=")"; // fin de VP(
        }
        // console.log("expr",expr);
        expr+=")";// fin du S
        $("#jsreal").val(expr);
        $("#realisation").val(eval(expr+".real()"));
    } else
        $("#jsreal").val("il faut indiquer au moins un sujet ou un verbe");
}

// vocabulaire pour les tirages aléatoires
// initialisé à la lecture du vocabulaire

var lesNoms,lesAdjectifs,lesVerbes,LesPrepositions;

function aleatoire() {
  deroulantAleatoire($('#det'),1);
  motAleatoire($('#nom'),lesNoms);
  aleatoireBinaire($('#adjAnt'));
  motAleatoire($('#adj'),lesAdjectifs);
  aleatoireBinaire($('#pluriel'));
  // aleatoireBinaire($('#est-pronom'));
  deroulantAleatoire($('#personne'));
  deroulantAleatoire($("#nombre"));

  deroulantAleatoire($('#detOD'));
  motAleatoire($('#nomOD'),lesNoms)
  aleatoireBinaire($('#adjAntOD'));
  motAleatoire($('#adjOD'),lesAdjectifs);
  aleatoireBinaire($('#plurielOD'));
  // aleatoireBinaire($('#est-pronomOD'));

  motAleatoire($('#verbe'),lesVerbes);
  deroulantAleatoire($('#mode'), true);
  changeTemps();
  deroulantAleatoire($('#temps'), true);

  motAleatoire($('#prepOI'),lesPrepositions);
  deroulantAleatoire($('#detOI'));
  motAleatoire($('#nomOI'),lesNoms);
  aleatoireBinaire($('#adjAntOI'));
  motAleatoire($('#adjOI'),lesAdjectifs);
  aleatoireBinaire($('#plurielOI'));
  // aleatoireBinaire($('#est-pronomOI'));

  realiser(); 
}

function deroulantAleatoire($selObj, zeroAcceptable) {
  $selObj.prop("selectedIndex", typeof(zeroAcceptable)!=='undefined' ? 
                         Math.floor(Math.random() * ($selObj.find("option").length)) :
                         Math.floor(Math.random() * ($selObj.find("option").length - 1)) + 1);

}

function motAleatoire($id,liste){
    $id.val(liste[Math.floor(Math.random() * liste.length)])
}

function aleatoireBinaire($checkBox) {
  $checkBox.prop("checked",Math.random() > 0.5);
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
    lexique=JSrealB.Config.get("lexicon");
    lesNoms=[];
    lesVerbes=[];
    lesAdjectifs=[];
    lesPrepositions=[];
    $.each(lexique,function(key,value){
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
    $("#realiser").on("click",realiser);
    $("#evaluer").on("click",evaluer);
    $("#aleatoire").on("click",aleatoire);
    $("#mode").prop("selectedIndex",0);
    $("#jsreal").val("");
    $("#realisation").val("");
    changeTemps();
    JSrealLoader({language: "fr", 
                  lexiconUrl: "../../../data/lex-fr.json", 
                  ruleUrl: "../../../data/rule-fr.json", 
                  featureUrl: "../../../data/feature.json"},
         initVocabulaire,
         console.error);
});

