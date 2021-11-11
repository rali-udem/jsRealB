//
//   Conjugation-Declension tables with jsRealB
//

var $entree,$tableau;
var language;

var titleConj={"fr": "Conjugaison de ","en":"Conjugation of: to "};
var titleDecl={"fr": "Déclinaison de ","en":"Declension of "};
var titleCommeNom={"fr": " comme nom","en":" as noun"};
var titleCommeAdj={"fr": " comme adjectif","en":" as adjective"};

function addTable_fr(verbe,temps){
    // console.log("addTable("+verbe+','+temps+")");
    var $tableau=$("#tableau");    // find the table element
    var $row=$("<tr/>");                // create a new row
    for (var t=0;t<temps.length;t++) // fill the title of the table
        $row.append("<th>"+temps[t][0]+"</th>")
    $tableau.append($row); // add it to the table
    // generate a row for the 6 persons (3 singular and 3 plural)
    for(var n=0;n<2;n++){  // la forme (var n in "sp") ne fonctionne pas car JSrealB a ajouté des choses au prototype de String...
        var nb="sp"[n];
        for(var p=1;p<=3;p++){  
            $row=$("<tr/>");
            for(var t=0;t<temps.length;t++){ // a row at 3 tenses
                var pronom=Pro(language=="fr"?"je":"I").pe(p).n(nb).g(p==3?"f":"m");
                var negation = $("#negationButton").is(':checked');
                var passive = $("#passiveButton").is(':checked');
                var progressive = $("#progressiveButton").is(':checked');
                if (temps[t][0].substr(0,10)=="Subjonctif")
                    $row.append("<td>"+SP(Q("que"),SP(pronom,VP(V(verbe).t(temps[t][1])))
                                      .typ({neg:negation,pas:passive,prog:progressive}))+"</td>");
                else if(temps[t][1]=='ip'){//temps impératif
                    if(["1s","3s","3p"].indexOf(p+nb)>=0){
                        $row.append("<td></td>");
                    }
                    else{// spécifier pe et n car pas de pronom...
                        $row.append("<td>"+SP(VP(V(verbe).pe(p).n(nb).t(temps[t][1])))
                                    .typ({neg:negation,pas:passive,prog:progressive})+"</td>");
                    }
                }
                else{    
                    $row.append("<td>"+SP(pronom,VP(V(verbe).t(temps[t][1])))
                                       .typ({neg:negation,pas:passive,prog:progressive})+"</td>");
                }
                    
            }
            $tableau.append($row);
        }
    }
}

function addTable_en(verbe,temps){
    var $tableau=$("#tableau");    // find the table element
    var $row=$("<tr/>");                // create a new row
    var negation = $("#negationButton").is(':checked');
    var passive = $("#passiveButton").is(':checked');
    var progressive = $("#progressiveButton").is(':checked');
    var perfect = $("#perfectButton").is(':checked');
    var progPerf = progressive && perfect;
    // fill the title of the table
    $row.append("<th>"+temps[0]+"</th>");
    if (progressive)
        $row.append("<th>"+temps[0]+" progressive</th>")
    if (perfect)
        $row.append("<th>"+temps[0]+" perfect</th>")
    if (progPerf)
        $row.append("<th>"+temps[0]+" progressive perfect</th>")
    $tableau.append($row); // add it to the table
    // generate a row for the 6 persons (3 singular and 3 plural)
    for(var n=0;n<2;n++){
        var nb="sp"[n];
        for(var p=1;p<=3;p++){
            $row=$("<tr/>");
            var pronom=Pro(language=="fr"?"je":"I").pe(p).n(nb).g(p==3?"f":"m");
            $row.append("<td>"+SP(pronom,VP(V(verbe).t(temps[1])))
                   .typ({neg:negation,pas:passive})+"</td>");
            if (progressive)$row.append("<td>"+SP(pronom,VP(V(verbe).t(temps[1])))
                   .typ({neg:negation,pas:passive,prog:true})+"</td>");
            if (perfect)$row.append("<td>"+SP(pronom,VP(V(verbe).t(temps[1])))
                   .typ({neg:negation,pas:passive,perf:true})+"</td>");
            if (progPerf)$row.append("<td>"+SP(pronom,VP(V(verbe).t(temps[1])))
                   .typ({neg:negation,pas:passive,perf:true,prog:true})+"</td>");
            $tableau.append($row);
        }
    }
}

function conjuguer(verbe){
    // console.log("conjuguer("+verbe+")");
    var vEntry=getLemma(verbe)
    if (vEntry !== undefined){
        if ("V" in vEntry){
            $("#tableau").append("<h1>"+titleConj[language]+verbe+"</h1>");
            if (language=='fr'){
                addTable_fr(verbe,[["Présent","p"],["Imparfait","i"],["Futur simple","f"],["Passé simple","ps"]]);
                addTable_fr(verbe,[["Passé composé","pc"],["Plus-que-parfait","pq"],["Futur antérieur","fa"]]);
                addTable_fr(verbe,[["Subjonctif présent","s"],["Subjonctif imparfait","si"],["Subjonctif passé","spa"],["Subjonctif plus-que-parfait","spq"]]);
                addTable_fr(verbe,[["Conditionnel présent","c"],["Conditionnel passé","cp"],["Impératif","ip"]]);
            } else {
                addTable_en(verbe,["Present","p"]);
                addTable_en(verbe,["Simple past","ps"]);
                addTable_en(verbe,["Future","f"]);
                //Ajout imperative
                // TODO:: corriger l'impératif au passif, progressif ou parfait
                // if( (!($("#passiveButton").is(':checked')))
                //     && (!($("#progressiveButton").is(':checked')))
                //     && (!($("#perfectButton").is(':checked')))){
                $("#tableau").append($("<tr/>").append("<th style='padding-top:10px'>Imperative</th>"));
                const typOpts={neg:$("#negationButton").is(':checked'),
                               pas:$("#passiveButton").is(':checked'),
                               prog:$("#progressiveButton").is(':checked'),
                               perf:$("#perfectButton").is(':checked')
                              }
                    $("#tableau")
                        .append("<tr><td>"+S(VP(V(verbe).t('ip').pe(2).n("s"))).typ(typOpts)+"</td></tr>");
                    $("#tableau")
                        .append("<tr><td>"+S(VP(V(verbe).t('ip').pe(1).n("p"))).typ(typOpts)+"</td></tr>");
                    $("#tableau")
                        .append("<tr><td>"+S(VP(V(verbe).t('ip').pe(2).n("p"))).typ(typOpts)+"</td></tr>");
                // }
            }
        }
    }
}

function decliner(mot){
    // console.log("declinerNom("+mot+")");
    var entry=getLemma(mot);
    if (entry == undefined){
        $("#messErreur")[0].innerHTML="n'appartient pas au lexique, désolé.";
        $("#messErreur").css('color','red');
    }
    if ("N" in entry || "A" in entry){
        $tableau.append("<h1>"+titleDecl[language]+mot+"</h1>");
        let $table=$("<table>");
        if ("N" in entry){
            $table.append(`<tr><th colspan="2"><i>${titleCommeNom[language]}</i></th></tr>`)
            if (language=="fr"){
                $table.append("<tr><th></th><th>Singulier</th><th>Pluriel</th></tr>")
                const entryN=entry["N"]
                const g=entryN["g"]
                if (g=="m"||g=="x"){
                    $table.append(`<tr><td><i>Masculin</i></td>
                        <td>${N(mot).g("m").n("s")}</td><td>${N(mot).g("m").n("p")}</td></tr>`)
                }
                if(g=="f"||g=="x"){
                    $table.append(`<tr><td><i>Féminin</i></td>
                        <td>${N(mot).g("f").n("s")}</td><td>${N(mot).g("f").n("p")}</td></tr>`)
                }
            } else {
                $table.append("<tr><th>Singular</th><th>Plural</th></tr>")
                $table.append(`<tr><td>${N(mot).n("s")}</td><td>${N(mot).n("p")}</td></tr>`)
            }
        };
        if ("A" in entry){
            $table.append(`<tr><th colspan="2"><i>${titleCommeAdj[language]}</i></th></tr>`)
            if (language=="fr"){
                $table.append("<tr><th></th><th>Singulier</th><th>Pluriel</th></tr>")
                $table.append(`<tr><td><i>Masculin</i></td><td>${A(mot).g("m").n("s")}</td><td>${A(mot).g("m").n("p")}</td></tr>`)
                $table.append(`<tr><td><i>Féminin</i></td><td>${A(mot).g("f").n("s")}</td><td>${A(mot).g("f").n("p")}</td></tr>`)
            } else {
                $table.append("<tr><th>Comparative</th><th>Superlative</th></tr>")
                $table.append(`<tr><td>${A(mot).f("co")}</td><td>${A(mot).f("su")}</td></tr>`)
            }
        }
        $tableau.append($table)
    }
    $("#messErreur")[0].innerHTML="";
}

function conjugueDecline(e){
    // console.log("conjugueDecline("+e+")")
    if (e.which==13){
        $tableau.text("");
        var val=$entree.val();
        if(val.trim().length!=0){
            conjuguer(val);
            decliner(val);
        }
    } 
}

function checkLanguage() {
    language = $("#lang-fr")[0].checked?"fr":"en";
    if(language == 'fr'){
        loadFr();
        $("#perfectL").hide();
    }
    else{
        loadEn();
        $("#perfectL").show();
    }
};


$(document).ready(function() {
   $entree=$("#entree");
   $tableau=$("#tableau");
   $entree.keypress(conjugueDecline);
   $("input[type=checkbox]").change(
       function(){
           var val=$entree.val();
           if(val.trim().length!=0){
               $tableau.text("");
               conjuguer(val);
               decliner(val);
           }
       }
   )
   checkLanguage();
   $("#lang-fr").click(checkLanguage);
   $("#lang-en").click(checkLanguage);
});