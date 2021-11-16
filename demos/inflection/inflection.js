//
//   Conjugation-Declension tables with jsRealB
//

var $entree,$tableau;
var language;

var titleConj={"fr": "Conjugaison de ","en":"Conjugation of: to "};
var titleDecl={"fr": "Déclinaison de ","en":"Declension of "};
var titleCommeNom={"fr": " comme nom","en":" as noun"};
var titleCommeAdj={"fr": " comme adjectif","en":" as adjective"};

function conjuguer(verbe, lang,typs){
    function realize(t,pe,n){
        if (t=="ip"){
            if ((n=="s" && [1,3].indexOf(pe)>=0) || (n=="p" && pe==3)){
                return ""
            } else {
                return VP(V(verbe).t("ip").pe(pe).n(n)).typ(typs)
            }
        } else {
            let sp=SP(Pro(lang=="fr"?"je":"I").pe(pe).n(n),VP(V(verbe).t(t))).typ(typs)
            if (t.startsWith("s"))// subjonctif
                sp=SP(Q("que"),sp);
            return sp
        }
    }
    let temps;
    if (lang=="fr"){
        loadFr();
        const entry=getLemma(verbe)
        if (entry===undefined || !("V" in entry))return;
        temps= [
            [["Présent","p"],["Imparfait","i"],["Futur simple","f"],["Passé simple","ps"]],
            [["Passé composé","pc"],["Plus-que-parfait","pq"],["Futur antérieur","fa"]],
            [["Subjonctif présent","s"],["Subjonctif imparfait","si"],["Subjonctif passé","spa"],
             ["Subjonctif plus-que-parfait","spq"]],
            [["Conditionnel présent","c"],["Conditionnel passé","cp"],["Impératif","ip"]]
        ]
    } else {
        loadEn();
        const entry=getLemma(verbe)
        if (entry===undefined || !("V" in entry))return;
        temps= [
            [["Present","p"]],
            [["Simple past","ps"]],
            [["Future","f"]],
        ]
    }
    $("#tableau").append("<h1>"+titleConj[language]+verbe+"</h1>");
    for (tmp of temps) {
        let $row=$("<tr/>");
        for (t of tmp){
            $row.append(`<th>${t[0]}</th>`)
        }
        $("#tableau").append($row)
        for (n of "sp"){
            for (pe of [1,2,3]){
                $row=$("<tr/>");
                for (t of tmp)
                    $row.append("<td>"+realize(t[1],pe,n)+"</td>")
                $("#tableau").append($row)
            }
        }
    }
}

function declinerNom(mot,lang){
    if (lang=="fr"){
        $("#tableau").append("<tr><th></th><th>Singulier</th><th>Pluriel</th></tr>");
        const g=getLemma(mot)["N"]["g"];
        if ("mx".indexOf(g)>=0)
            $("#tableau")
               .append(`<tr><td><i>Masculin</i></td><td>${N(mot).g("m").n("s")}</td>`+
                                               `<td>${N(mot).g("m").n("p")}</td></tr>`);
        if ("fx".indexOf(g)>=0)
            $("#tableau")
               .append(`<tr><td><i>Féminin</i></td><td>${N(mot).g("f").n("s")}</td>`+
                                               `   <td>${N(mot).g("f").n("p")}</td></tr>`);
    } else {
         $("#tableau").append("<tr><th>Singular</th><th>Plural</th></tr>");
         $("#tableau").append(`<tr><td>${N(mot).n("s")}</td><td>${N(mot).n("p")}</td></tr>`);
    }
}

function declinerAdj(mot,lang){
    if (lang=="fr"){
        $("#tableau").append("<tr><th></th><th>Singulier</th><th>Pluriel</th></tr>");
        $("#tableau")
            .append(`<tr><td><i>Masculin</i></td><td>${A(mot).g("m").n("s")}</td>`+
                                   `<td>${A(mot).g("m").n("p")}</td></tr>`);
        $("#tableau")
            .append(`<tr><td><i>Féminin</i></td><td>${A(mot).g("f").n("s")}</td>`+
                                   `<td>${A(mot).g("f").n("p")}</td></tr>`);
    } else {
        $("#tableau").append("<tr><th>Comparative</th><th>Superlative</th></tr>");
        $("#tableau").append(`<tr><td>${A(mot).f("co")}</td><td>${A(mot).f("su")}</td></tr>`);
    }
}

function decliner(mot,lang){
    if (lang=="fr") loadFr(); else loadEn();
    const entry=getLemma(mot);
    if (entry === undefined){
        $("#messErreur")[0].innerHTML="n'appartient pas au lexique, désolé.";
        $("#messErreur").css('color','red');
        return
    }
    $("#messErreur")[0].innerHTML="";
    if ("N" in entry){
        $("#tableau").append(`<tr><th colspan="2"><i>${titleCommeNom[language]}</i></th></tr>`)
        declinerNom(mot,lang)
    }
    if ("A" in entry){
        $("#tableau").append(`<tr><th colspan="2"><i>${titleCommeAdj[language]}</i></th></tr>`)
        declinerAdj(mot,lang)
    }
}


function conjugueDecline(e){
    // console.log("conjugueDecline("+e+")")
    if (e.which==13){
        $tableau.text("");
        var val=$entree.val();
        if(val.trim().length!=0){
            conjuguer(val,language,getTyps(language));
            decliner(val,language);
        }
    } 
}

function getTyps(lang){
    let typs={neg:$("#negationButton").is(':checked'),
              pas:$("#passiveButton").is(':checked'),
              prog:$("#progressiveButton").is(':checked')}
    if (lang=="en")
        typs["perf"]= $("#perfectButton").is(':checked');
    return typs;
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
               conjuguer(val,language,getTyps(language));
               decliner(val,language);
           }
       }
   )
   checkLanguage();
   $("#lang-fr").click(checkLanguage);
   $("#lang-en").click(checkLanguage);
});