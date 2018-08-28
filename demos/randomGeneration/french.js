//
//  JSrealBDemo
//

var lexique;

function expressionNP(det,nom,adj,adjAnt,pluriel,pronom){

    if(nom!=""){
        var np="NP(";
        if(det!="nil")np+="D('"+det+"'),";
        np+="N(\""+nom+"\")";
        if(adj!="")np+=",A(\""+adj+"\")";
        np+=")";// fin du NP
        if(adj!="")np+=(adjAnt=="")?"":".ant('"+adjAnt+"')";
        if(pluriel)np+=".n('p')";
        if(pronom)np+=".pro()";
        return np;
    } 
    return null;
}

function expressionVerbe(){
    var verbe=$("#verbe").val();
    var temps=$("#temps").val();
    // var negation=$("#negation").is(':checked');
    // var passive =$("#passive").is(':checked');
    // var progressive =$("#progressive").is(':checked');
    if(verbe!=""){
    //   var vopt = ".typ({";
    //   vopt += (negation)?"neg:true,":"";
    //   vopt +=(passive)?"pas:true,":"";
    //   vopt +=(progressive)?"prog:true,":"";
    //   if(vopt == ".typ({"){
    //     vopt = "";
    //   }
    //   else{
    //     vopt = vopt.slice(0,-1);
    //     vopt += "})"
    //   }
    var v="V(\""+verbe+"\").t('"+temps+"')"//+vopt;
      v += (temps == "ip")?".pe('"+$("#personne").val()+"')"+".n('"+$("#nombre").val()+"')":"";
      return v;
    }
    return null;
}

function option(code,nom){
    return DOMtag(option,nom,{value:code});
}

var codesTemps={
        ind:{p:"présent",i:"imparfait",ps:"passé simple", f:"futur"},//,ip:"impératif"},
        comp:{pc:"passé composé",pq:"plus-que-parfait",fa:"futur antérieur"},
        cond:{c:"présent",cp:"passé"},
        sub:{s:"présent",si:"imparfait",spa:"passé",spq:"plus-que-parfait"},
        imp:{ip:"présent"},
};

var codesPersonne={
  imp:{p:[1,2],s:[2]},
  aut:{p:[1,2,3],s:[1,2,3]}
};
var tagPersonne={
  1:"1ière",
  2:"2ième",
  3:"3ième"
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

    for(var pers in codesPersonne[tempsSel][nombre]){
      perSelect.append($("<option>"+tagPersonne[codesPersonne[tempsSel][nombre][pers]]+"</option>").attr({value:codesPersonne[tempsSel][nombre][pers]}))
    }       
      
    var oldPerSelect =$("#personne");
    oldPerSelect.replaceWith(perSelect);
      
    //}

}

function evaluer(){
    $("#realisation").value=eval($("#jsreal").val()+".real()");
}

function realiser(){
    var sujet=expressionNP($("#det").val(),
                           $("#nom").val(),
                           $("#adj").val(),
                           $("#adjAnt").val(),
                           $("#pluriel").is(":checked"),
                           $("#est-pronom").is(":checked"));
    if(sujet==null){
        var personne=$("#personne").val();
        var nombre=$("#nombre").val();
        if(personne!="nil" && nombre!="nil")
            sujet="NP(Pro('je').pe("+personne+").n('"+nombre+"'))";
    }
    var verbe=expressionVerbe();
    var objDirNominalise=$("#est-pronomOD").is(":checked");
    var objetDirect=expressionNP($("#detOD").val(),
                                 $("#nomOD").val(),
                                 $("#adjOD").val(),
                                 $("#adjAntOD").val(),
                                 $("#plurielOD").is(":checked"),
                                 $("#est-pronomOD").is(":checked"));
    var prepOI=$("#prepOI").val();
    var objetIndirect=expressionNP($("#detOI").val(),
                                   $("#nomOI").val(),
                                   $("#adjOI").val(),
                                   $("#adjAntOI").val(),
                                   $("#plurielOI").is(":checked"),
                                   $("#est-pronomOI").is(":checked")); 
    // var theForm = document.forms[0];
    // for(var i =0; i< theForm.length;i++){
    //   if(theForm[i].checked){
    //     var sType = theForm[i].value; 
    //   }
    // }

    if(sujet!=null || verbe!=null){
        var expr="S(";
        if(sujet!=null)expr+=sujet;
        if(verbe!=null){
            //if(objDirNominalise!=null)expr+=",\n  Pro(\""+objDirNominalise+"\").pe(3).n('s')";
            if(sujet!=null)expr+=",\n  ";
            expr+="VP("+verbe;
            if(objetDirect!=null)expr+=",\n     "+objetDirect;
            if(prepOI!=""||objetIndirect!=null){
                if(prepOI!="" && objetIndirect!=null){
                   expr+=",\n     PP(P(\""+prepOI+"\"),"+objetIndirect+")"; 
                } else {
                    $("#jsreal").val("objet indirect exige une préposition et un objet");
                    return;
                }
            }
            expr+=")"; // fin de VP(
        }

        expr+="\n )"
        //Ajout type de phrase
        var typP = ".typ({";

        var negation=$("#negation").is(':checked');
        var passive =$("#passive").is(':checked');
        var progressive =$("#progressive").is(':checked');
        var question =$("#queForm").is(":checked");
        if(question == true){
          for(i in $("#intSpec")[0]){
            if($("#intSpec")[0][i] != null && $("#intSpec")[0][i].selected == true){
              //console.log($("#intSpec")[0][i].selected);
              question = "\""+$("#intSpec")[0][i].value+"\"";
            }
          }
        }
        var exclamation =$("#excForm").is(":checked");

        typP += (negation)?"neg:true,":"";
        typP +=(passive)?"pas:true,":"";
        typP +=(progressive)?"prog:true,":"";
        typP += (question!=false)?"int:"+question+",":"";
        typP +=(exclamation)?"exc:true,":"";

        if(typP == ".typ({"){
          typP = "";
        }
        else{
          typP = typP.slice(0,-1);
          typP += "})"
        }

        expr += typP;
        
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
  $('#adjAnt')[0][0].selected = 'selected';
  motAleatoire($('#adj'),lesAdjectifs);
  aleatoireBinaire($('#pluriel'));
  // aleatoireBinaire($('#est-pronom'));
  deroulantAleatoire($('#personne'));
  deroulantAleatoire($("#nombre"));

  deroulantAleatoire($('#detOD'));
  motAleatoire($('#nomOD'),lesNoms)
  $('#adjAntOD')[0][0].selected = 'selected';
  motAleatoire($('#adjOD'),lesAdjectifs);
  aleatoireBinaire($('#plurielOD'));
  // aleatoireBinaire($('#est-pronomOD'));

  motAleatoire($('#verbe'),lesVerbes);
  deroulantAleatoire($('#mode'), true);
  changeTemps();
  deroulantAleatoire($('#temps'), true);
  //options aléatoires
  aleatoireBinaire($('#negation'));
  //aleatoireBinaire($('#passive'));
  //aleatoireBinaire($('#progressive'));


  motAleatoire($('#prepOI'),lesPrepositions);
  deroulantAleatoire($('#detOI'));
  motAleatoire($('#nomOI'),lesNoms);
  $('#adjAntOI')[0][0].selected = 'selected';
  motAleatoire($('#adjOI'),lesAdjectifs);
  aleatoireBinaire($('#plurielOI'));
  aleatoireBinaire($('#negation'));
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
    initVocabulaire();
});

