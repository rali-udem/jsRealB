//
//  JSrealBDemo

var lexique;

function expressionNP(det,nom,adj,adjForm,pluriel,pronom, genderNeuter){
    genderNeuter = genderNeuter || false;

    if(nom!=""){
        var np="NP(";
        if(det!="nil")np+="D('"+det+"'),";
        if(adj!=""){
            np+="A(\""+adj+"\")";
            if(adjForm!="nil"){
                np+=".f('"+adjForm+"')"
            }
            np+=",";
        }
        np+="N(\""+nom+"\")";
        np+=")";// fin du NP
        if(pluriel)np+=".n('p')";
        if(pronom)np+=".pro()";
        if(genderNeuter)np+=".g('n')";
        return np;
    } 
    return null;
}

function expressionVerbe(){
    var verbe=$("#verbe").val();
    var temps=$("#temps").val();
    
    if(verbe!=""){
      // var perfect =$("#perfect").is(':checked');
      var v="V(\""+verbe+"\").t('"+temps+"')"
      // v += (perfect==true)?".perf(true)":"";
      return v;
    }
    return null;
}

function option(code,nom){
    return DOMtag(option,nom,{value:code});
}

var codesTemps={
    ind:{p:"present",ps:"past",f:"future"},
    imp:{ip:"present"}
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
    $("#realisation").val(eval($("#jsreal").val()).toString());
}

function realiser(){
    if ($("#temps").val() !== "ip"){ // ignorer le sujet si à l'impératif
        var sujet=expressionNP($("#det").val(),
                               $("#nom").val(),
                               $("#adj").val(),
                               $("#adjForm").val(),
                               $("#pluriel").is(":checked"),
                               $("#est-pronom").is(":checked"),
                               $("#neuterSub").is(":checked"));
        if(sujet==null){
            var personne=$("#personne").val();
            var nombre=$("#nombre").val();
            if(personne!="nil" && nombre!="nil")
                sujet="Pro('I').pe("+personne+").n('"+nombre+"')";
        }
    }
    var verbe=expressionVerbe();
    var objetDirect=expressionNP($("#detOD").val(),
                                 $("#nomOD").val(),
                                 $("#adjOD").val(),
                                 $("#adjODForm").val(),
                                 $("#plurielOD").is(":checked"),
                                 $("#est-pronomOD").is(":checked"),
                                 $("#neuterOD").is(":checked"));
    var prepOI=$("#prepOI").val();
    var objetIndirect=expressionNP($("#detOI").val(),
                                   $("#nomOI").val(),
                                   $("#adjOI").val(),
                                   $("#adjOIForm").val(),
                                   $("#plurielOI").is(":checked"),
                                   $("#est-pronomOI").is(":checked"),
                                   $("#neuterOI").is(":checked"));


    if(sujet!=null || verbe!=null){
        var expr="S(";
        if(sujet!=null)expr+=sujet;
        if(verbe!=null){
            if(sujet!=null)expr+=",\n  ";
            expr+="VP("+verbe;
            if(objetDirect!=null)expr+=",\n     "+objetDirect;
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
        expr+="\n )"
        //Ajout type de phrase
        var typP = ".typ({";

        var negation=$("#negation").is(':checked');
        var passive =$("#passive").is(':checked');
        var progressive =$("#progressive").is(':checked');
        var question =$("#queForm").is(":checked");
        var perfect =$("#perfect").is(':checked');
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
        typP += (perfect)?"perf:true,":"";
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
        $("#realisation").val(eval(expr.toString()));
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
  //aleatoireBinaire($('#pluriel'));
  // aleatoireBinaire($('#est-pronom'));
  deroulantAleatoire($('#personne'));
  deroulantAleatoire($("#nombre"));

  deroulantAleatoire($('#detOD'));
  motAleatoire($('#nomOD'),lesNoms)
  aleatoireBinaire($('#adjAntOD'));
  motAleatoire($('#adjOD'),lesAdjectifs);
  //aleatoireBinaire($('#plurielOD'));
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
  //aleatoireBinaire($('#plurielOI'));
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
    loadEn();
    lexique=lexiconEn;
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

