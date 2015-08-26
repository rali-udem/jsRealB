//
//   création d'un tableau de conjugaison avec JSreal
//

var $entree,$tableau;
var language;

var titleConj={"fr": "Conjugaison de ","en":"Conjugation of "};
var titleDecl={"fr": "Déclinaison de ","en":"Declension of "};
var titleCommeNom={"fr": " comme nom","en":" as noun"};
var titleCommeAdj={"fr": " comme adjectif","en":" as adjective"};

function addTable(verbe,temps){
    // console.log("addTable("+verbe+','+temps+")");
    var $tableau=$("#tableau");    // find the table element
    var $row=$("<tr/>");                // create a new row
    for (var t=0;t<temps.length;t++) // fill the title of the table
        $row.append("<th style='padding-top:10px'>"+temps[t][0]+"</th>")
    $tableau.append($row); // add it to the table
    // generate a row for the 6 persons (3 singular and 3 plural)
    for(var n=0;n<2;n++){  // la forme (var n in "sp") ne fonctionne pas car JSrealB a ajouté des choses au prototype de String...
        var nb="sp"[n];
        for(var p=1;p<=3;p++){  
            $row=$("<tr/>");
            for(var t=0;t<temps.length;t++){ // a row at 3 tenses
                var pronom=""+Pro(language=="fr"?"je":"I").pe(p).n(nb).g("f");
                var v=""+V(verbe).t(temps[t][1]).pe(p).n(nb);
                if (temps[t][0].substr(0,10)=="Subjonctif")
                    $row.append("<td>"+S("que",pronom,v).a(" ")+"</td>");
                else
                    $row.append("<td>"+S(pronom,v).a(" ")+"</td>");
            }
            $tableau.append($row);
        }
    }
}

function conjuguer(verbe){
    // console.log("conjuguer("+verbe+")");
    var lexicon=JSrealB.Config.get("lexicon");
    if (verbe in lexicon){
        if ("V" in lexicon[verbe]){
            $("#tableau").append("<h1>"+titleConj[language]+verbe+"</h1>");
            if (language=='fr'){
                addTable(verbe,[["Présent","p"],["Imparfait","i"],["Futur simple","f"]]);
                addTable(verbe,[["Passé simple","ps"]]);//,["Plus-que-parfait","pq"],["Passé composé","pc"]]);
                addTable(verbe,[["Subjonctif présent","s"],["Subjonctif imparfait","si"]]);//,["Subjonctif passé","spa"]]);
                addTable(verbe,[["Conditionnel présent","c"]])//,["Conditionnel passé","cp"]]);
            } else {
                addTable(verbe,[["Present","p"]]);
                addTable(verbe,[["Simple past","ps"]])
            }
        }
    }
}

function addLigne(titre,struct){
    $tableau.append("<p>"+titre+struct+"</p>");
}


function declinerNom(mot){
    // console.log("declinerNom("+mot+")");
    var lexicon=JSrealB.Config.get("lexicon");
    if (mot in lexicon){
        if ("N" in lexicon[mot]){
            $tableau.append("<h1>"+titleDecl[language]+mot+titleCommeNom[language]+"</h1>");
            if (language=="fr"){
                addLigne("Masculin singulier: ",N(mot).g("m").n("s"));
                addLigne("Féminin singulier: " ,N(mot).g("f").n("s"));
                addLigne("Masculin pluriel: "  ,N(mot).g("m").n("p"));
                addLigne("Féminin pluriel: "   ,N(mot).g("f").n("p"));
            } else {
                addLigne("Singular: ",N(mot).n("s"));
                addLigne("Plural: "  ,N(mot).n("p"));
            }
        };
        if ("A" in lexicon[mot]){
            $tableau.append("<h1>"+titleDecl[language]+mot+titleCommeAdj[language]+"</h1>");
            if (language=="fr"){
                addLigne("Masculin singulier: ",A(mot).g("m").n("s"));
                addLigne("Féminin singulier: " ,A(mot).g("f").n("s"));
                addLigne("Masculin pluriel: "  ,A(mot).g("m").n("p"));
                addLigne("Féminin pluriel: "   ,A(mot).g("f").n("p"));
            } else {
                addLigne("Comparative: ",A(mot).f("co"));
                addLigne("Superlative: ",A(mot).f("su"));
            }
        }
    }
}

function conjugueDecline(e){
    // console.log("conjugueDecline("+e+")")
    if (e.which==13){
        $tableau.text("");
        var val=$entree.val();
        if(val.trim().length!=0){
            conjuguer(val);
            declinerNom(val);
        }
    } 
}
var dataDir="../../../data/";
var configs = {"fr":{ language: "fr", 
                  lexiconUrl: dataDir+"lex-fr.json", 
                  ruleUrl: dataDir+"rule-fr.json", 
                  featureUrl: dataDir+"feature.json"},
           "en":{ language: "en", 
                  lexiconUrl: dataDir+"lex-en.json", 
                  ruleUrl: dataDir+"rule-en.json", 
                  featureUrl: dataDir+"feature.json"}
        };

function checkLanguage() {
    language = $("#lang-fr")[0].checked?"fr":"en";
    JSrealLoader(configs[language],function(){},console.error);
};


$(document).ready(function() {
   $entree=$("#entree");
   $tableau=$("#tableau");
   $entree.keypress(conjugueDecline);
   checkLanguage();
   $("#lang-fr").click(checkLanguage);
   $("#lang-en").click(checkLanguage);
});