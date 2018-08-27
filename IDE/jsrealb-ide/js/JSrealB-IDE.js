//
//   Environnement de programmation JSrealB
//     intègre l'éditeur Javascript ACE
//

// transformer une structure d'élements JSrealB en Node
function jsReal2Node(jsNode){
    if(typeof jsNode === "string")
    {
        return new Node(jsNode);
    }
    else
    {
        var n=new Node(jsNode.category);
        n.realisation=jsNode.realization;
        n.prop = jsNode.prop;
        n.defaultProp = jsNode.defaultProp;
        n.childrenProp = jsNode.childrenProp;
        
        var length = jsNode.elements.length;
        if(length > 0)
        {
            for(var i = 0; i < length; i++)
            {
                n.addChild(jsReal2Node(jsNode.elements[i]));
            }
        }
        else
        {
            n.addChild(new Node(jsNode.unit));
        }
    }
    
    return n;
}

////////////
//   affichage de l'arbre dans le canvas
//
var tree,$realisation,$entree,$sepH,$sortie,$canvas,$sepV,$info,$resultats;
var language;

function dessiner(expr, language){
    loadLanguage(
        "data/",
        language,
        function() {
            $realisation.hide();
            clearCanvas();
            $("#outtexte").text("");
            // tree=parse(expr);
            // console.log(pprint(tree));
            jsTree=null;
            try {
                jsTree=eval(expr);
                var result = jsTree.toString();
                if(jsTree){
                    tree=jsReal2Node(jsTree);
                    layout(tree);
                    // Node.ctx.fillStyle="black"; // dessiner le texte de la réalisation complète
                    // Node.ctx.fillText(strip(result),10,20);
                    $("#outtexte").text(strip(result));
                }
            } catch (e) {
                // Node.ctx.fillStyle="#000000";
                // Node.ctx.fillText(e.toString(),10,30);
                $("#outtexte").text(e);
            }
        }
    );
}

// distance au carré entre deux points
function dist2(x1,y1,x2,y2){    
    return (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);
}

// trouver un noeud "proche" dans le sous-arbre ayant jsNode pour racine
// retourne null si aucun n'est assez proche
function noeudProche(jsNode,xC,yC){
    if(dist2(jsNode.x,jsNode.y,xC,yC)<400)return jsNode;
    if(jsNode.children){
        for(var i=0;i<jsNode.children.length;i++){
            var n=noeudProche(jsNode.children[i],xC,yC);
            if(n!=null)return n;
        }
    }
    return null;
}


function jsObjectToHtmlTable(obj,title){
    var l = Object.keys(obj).length;
    if (l==0)return null;
    var $caption=$("<caption/>").text(title);
    var $thead=$("<thead><tr><th>Prop</th><th>"+
                              (lang=="fr"?"Valeur":"Value")+"</th></tr></thead>");
    var $tbody=$("<tbody/>");
    for (var key in obj){
        $tbody.append("<tr><td>" + key + "</td><td>" + obj[key] + "</td></tr>")
    }
    return $("<table/>").append($caption,$thead,$tbody);
}

// fonctions associées au clic de souris
function afficherRealisation(e){
    var offset=$canvasContainer.offset()
    var xScroll=$canvasContainer.scrollLeft();
    var yScroll=$canvasContainer.scrollTop()
    var xC=e.clientX-offset.left+xScroll;
    var yC=e.clientY-offset.top+yScroll;
    var n=noeudProche(tree,xC,yC);
    $realisation.empty();
    if(n!=null && n.realisation){
        $realisation.append("<b>" + n.realisation + "</b>")
                .append(jsObjectToHtmlTable(n.prop, lang=="fr"?"Propriétés de l'élément":"Element properties"))
                .append(jsObjectToHtmlTable(n.defaultProp, lang=="fr"?"Propriétés par défaut":"Default properties"))
                .append(jsObjectToHtmlTable(n.childrenProp, lang=="fr"?"Propriétés transmises par les enfants":"Properties from children"));
        $realisation.css("left",(xC-xScroll)+"px");
        $realisation.css("top",(yC-25-yScroll)+"px");
        $realisation.show();
    }
}

function cacherRealisation(e){
    $realisation.hide();
}

/// gestion des barres de séparations
var deplacement=null;
function debutDeplacerSep(e){
    deplacement=e.currentTarget;
}
function finDeplacerSep(e){
    deplacement=null;
}

function deplacerSep(e){
    if(!deplacement)return;
    if(deplacement==$sepH[0]){// déplace la séparation horizontale (donc ligne verticale)
        var largeur=$entree.width()+$sortie.width();    
        var xC=e.clientX;
        var prop=Math.round(xC*100/largeur);
        $entree.css("width",prop+"%");
        $sepH.css("left",prop+"%");
        $sortie.css("width",(100-prop)+"%");
        editor.resize();
    } else { // déplace la séparation verticale (donc ligne horizontale)
        var hauteur=$sortie.height();
        var yC=e.clientY-$sortie.offset().top;
        var prop=Math.round(yC*100/hauteur);
        $("#canvasContainer").css("height",prop+"%");
        $sepV.css("top",prop+"%");
        $info.css("height",(100-prop)+"%");
    }
}

/// Gestion du storage local pour remettre le dernier état de l'éditeur
// Feature test
var hasStorage = (function() {
    var mod = "jsrealb_storage_feature_test";
  try {
    localStorage.setItem(mod, mod);
    localStorage.removeItem(mod);
    return true;
  } catch (exception) {
    return false;
  }
}());

////
function storeCurrentData() {
    if(hasStorage && editor !== undefined)
    {
        localStorage.setItem("jsrealb_language", language);
        localStorage.setItem("jsrealb_source", editor.getValue());
    }
}


/////////
//   recherche dans les ressources
function showQ(s){
    if (s.indexOf("\\")>=0)s=s.replace("\\","\\\\");
    if (s.indexOf('"')>=0)s=s.replace('"','\\\"');
    return '"'+s+'"';
}
// afficher la chaine JSON représentant un objet
function showJson(obj){
    if (typeof obj === "string")
        return showQ(obj);
    if (typeof obj === "object"){
        if (obj==null)return "null";
        if (obj instanceof Array){
            var res="[";
            var l=obj.length;
            for(var i=0;i<l;i++)
                res+=showJson(obj[i])+",";
            if(l>0)res=res.slice(0,-1);
            return res+"]";
        }
        var res="{";
        for (key in obj){
            res+=showQ(key)+":"+showJson(obj[key])+",";
        }
        if(res.length>1)res=res.slice(0,-1); //enlever la dernière virgule 
        return res+"}";
    }
    if (typeof obj == "boolean")
        return showQ(obj);
    if (typeof obj == "number")
        return obj;
}

function showDictEntries(lexique,query){
    var regexp=new RegExp("^"+query+"$");
    var $caption=$("<caption/>").text(query);
    // récuperer les résultats et tous les champs possibles
    var validKeys=[];
    var allFields=["tab"];
    for (var key in lexique){
        if (regexp.test(key)){
            validKeys.push(key);
            var val=lexique[key];
            for (var cats in val){
                for (field in val[cats])
                    if(allFields.indexOf(field)<0)
                        allFields.push(field);
            }
        }
    }
    validKeys.sort(function(a,b){return a.localeCompare(b)});
    var nbFields=allFields.length;
    // créer le tableau des entrées
    var $thead=$("<thead><tr><th>entrée</th><th>cat</th><th>"+(allFields.join("</th><th>"))+"</th></tr></thead>");
    var $tbody=$("<tbody>")
    var nbValidKeys=validKeys.length;
    for (var i=0;i<nbValidKeys;i++){
        var validKey=validKeys[i];
        var catsObject=lexique[validKey];
        var allCats=Object.keys(catsObject);
        var nbCats=allCats.length;
        for(var j=0;j<nbCats;j++){
            var cat=allCats[j];
            var $tr=$("<tr>");
            if(j==0){// entrée
                var rowspan="";
                if(nbCats>1)rowspan=" rowspan='"+nbCats+"'";
                var $validKey=$("<td"+rowspan+">"+validKey+"</td>");
                $validKey.addClass("infoSup");
                $validKey.attr("title","JSON de l'entrée "+validKey);
                $tr.append($validKey); 
            }
            $tr.append("<td>"+cat+"</td>");
            for (var k=0;k<nbFields;k++){// autres champs
                var valCat=catsObject[cat][allFields[k]];
                if(valCat==null)valCat="";
                var $valCat=$("<td>"+valCat+"</td>");
                if(k==0){
                    $valCat.addClass("infoSup");
                    $valCat.attr("title","Contenu de la table "+valCat);
                }
                $tr.append($valCat);
            }
            $tbody.append($tr);
        }
    }
    $table=$("<table class='info'/>").append($thead,$tbody);
    $table.click(addInfoDic);
    return $table;
}

function showConjugation(conjugations,mot,query,terminaison){
    var regexp=new RegExp("^"+query+"$");
    var $div=$("<div/>")
    for(no in conjugations){
        if (regexp.test(terminaison?conjugations[no]["ending"]:no)){
            var conjugation=conjugations[no];
            var $caption=$("<caption/>").html(mot+" <b>"+no+"</b> :: "+conjugation["ending"]);
            var $tbody=$("<tbody/>");
            var $thead=$("<thead><tr><th>temps</th><th>valeurs</th></tr></thead>");
            var $tbody=$("<tbody>");
            var lesTemps=conjugation["t"];
            var nomTemps=Object.keys(lesTemps);
            var nbTemps=nomTemps.length;
            for (var i=0;i<nbTemps;i++){
                $tbody.append("<tr><td>"+nomTemps[i]+"</td><td>"+lesTemps[nomTemps[i]]+"</td></tr>");
            }
            $div.append($("<table class='info'/>").append($caption,$thead,$tbody))
        }
    }
    return $div;
}

function showDeclension(declensions,mot,query,terminaison){
    var regexp=new RegExp("^"+query+"$");
    var $div=$("<div/>")
    for(no in declensions){
        if (regexp.test(terminaison?declensions[no]["ending"]:no)){
            var declension=declensions[no];
            var $caption=$("<caption/>").html(mot+" <b>"+no+"</b> :: "+declension["ending"]);
            var lines=declension["declension"];
            var nbLines=lines.length;
            // trouver les champs présents (on suppose que toutes les entrées ont les mêmes champs)
            var fields=["val"];
            var line0=lines[0];
            for(var field in line0)
                if(fields.indexOf(field)<0)fields.push(field);
            var nbFields=fields.length;
            // créer les lignes de la table
            var $tbody=$("<tbody/>");
            var $thead=$("<thead><tr><th>"+(fields.join("</th><th>"))+"</th></tr></thead>");
            var $tbody=$("<tbody>");
            for (var i=0;i<nbLines;i++){
                $tr=$("<tr/>");
                for(var j=0;j<nbFields;j++){
                    $tr.append("<td>"+lines[i][fields[j]]+"</td>")
                }
                $tbody.append($tr);
            }
            $div.append($("<table class='info'/>").append($caption,$thead,$tbody))
        }
    }
    return $div;
}

// n'est appelé que lorsqu'on tape return
function chercherInfos(e){
    if(e.which!=13)return;
    var query=$("#interrogation").val();
    if(query=="")return;
    loadLanguage("data/",$("#langue").val(),function(){
        $("#resultatInterrogation").empty();
        $("#resultatJson").empty()
        var type=$("#typeInterrogation").val();
        var $result;
        if (type=="dico"){
            $result=showDictEntries(JSrealB.Config.get("lexicon"),query)
        } else if (type=="conjugation-no"){
            $result=showConjugation(JSrealB.Config.get("rule")["conjugation"],"",query,false);
        } else if (type=="conjugation-term"){
           $result=showConjugation(JSrealB.Config.get("rule")["conjugation"],"",query,true); 
        } else if (type=="declension-no"){
            $result=showDeclension(JSrealB.Config.get("rule")["declension"],"",query,false);
        } else if (type=="declension-term"){
           $result=showDeclension(JSrealB.Config.get("rule")["declension"],"",query,true); 
        }
        $("#resultatInterrogation").append($result);
    });
}

function addInfoDic(e){
    var $tgt=$(e.target);
    if ($tgt[0].nodeName!="TD")return;
    var nbCols=$(e.currentTarget).find("th").size();
    var nbSibs=$tgt.siblings().size();
    var isFirstLine=nbSibs==nbCols-1;
    var index=$tgt.index();
    var val=$tgt.text();
    if(index==0){
        // afficher le JSON
        var jsonMot=JSrealB.Config.get("lexicon")[val];
        if (jsonMot){
            $("#resultatInterrogation").append("<div>"+showQ(val)+":"+showJson(jsonMot)+"</div>");
        }
    } else if( (isFirstLine && index==2) || (nbSibs==nbCols-2 && index==1)){
        // on vérifie si on est dans le colonne no 2 ou 1 si la première est absente
        var mot="";
        if(isFirstLine){
            mot=$tgt.siblings().first().text();
        }
        var c=val.charAt(0);
        var $result;
        if (c=="v"){ // chercher la congugaison
            $result=showConjugation(JSrealB.Config.get("rule")["conjugation"],mot,val,false);
        } else { // chercher la déclinaison
            $result=showDeclension(JSrealB.Config.get("rule")["declension"],mot,val,false);
        }
        $("#resultatInterrogation").append($result);
    }
}

// localisation de l'interface...

var lang;  // langue courante
var interrogationMenuFr=["dictionnaire","no de conjugaison","terminaison de conjugaison","numéro de déclinaison","terminaison de déclinaison"];
var interrogationMenuEn=["dictionary","conjugation number","conjugation ending","declination number","declination ending"];
function setLang(newLang){
    $("[lang="+lang+"]").hide();
    lang=newLang;
    $("[lang="+lang+"]").show();
    // patcher le menu d'interrogation des ressources
    $("#typeInterrogation option").each(function (i){
        $(this).text((lang=="fr"?interrogationMenuFr:interrogationMenuEn)[i])
    });
}

    
////
var editor;
$(document).ready(function() {
    $entree     =$("#entree");
    $sepH       =$("#sepH");
    $sortie     =$("#sortie");
    $realisation=$("#realisation");
    $canvasContainer=$("#canvasContainer");
    $sepV       =$("#sepV");
    $info       =$("#info");
    $resultats  =$("#resultatInterrogation");

    $canvas=$("#canvas")
    var canvas=$canvas[0];
    Node.ctx = canvas.getContext('2d');
    Node.ctx.fillStyle="#FF0000";
    Node.ctx.font=Node.labelHeight+"px "+Node.labelFont;

    editor = ace.edit("entree");
    editor.setTheme("ace/theme/textmate");
    // editor.getSession().setMode("ace/mode/JSreal");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    editor.setFontSize("16px"); // grandeur de police de défaut

    if(localStorage.getItem("jsrealb_source") !== undefined
            && localStorage.getItem("jsrealb_source") !== null
            && localStorage.getItem("jsrealb_source") !== "")
    {
        language = localStorage.getItem("jsrealb_language");
        editor.setValue(localStorage.getItem("jsrealb_source"));
        dessiner(editor.getValue(), language);
    }
    else
    {
        language = "en";
        // exemple de génération "bilingue", il suffit de (dé)commenter (CMD-/ sur mac)
        // pour avoir la version dans la bonne langue...
        editor.setValue(""

          + "/*\n"
          + "\n"
          + "// Décommenter ce bloc et commenter le suivant puis cliquer 'Réaliser en français'\n"
          + "// Uncomment this block and comment the next one then click 'Réaliser en français'\n"
          + "\n"
          + "S(\n"
          + "   CP(C('ou'),\n"
          + "      NP(AP(A('fort')), N('averse')),\n"
          + "      NP(N('orage'))).n('p'),\n"
          + "   VP(V('cesser').t('pr'),\n"
          + "      (PP(P('vers'),\n"
          + "          DT('2015/09/15 09:00').dOpt({year: false, month: false, date: false, day: true,\n"
          + "                 minute: false, second: false, det:false, nat: true}))))\n"
          + ").a('!')\n"
          + "\n"
          + "*/\n"

          + "\n\n\n"

          + "S(\n"
          + "    NP(Pro('I').pe(1).n('p')),\n"
          + "    VP(V('expect')),\n"
          + "    CP(C('or'),\n"
          + "        NP(AP(A('heavy')), N('shower')),\n"
          + "        NP(N('storm'))).n('p'),\n"
          + "        VP(V('end').t('pr'),\n"
          + "        DT('2015/09/15 09:00').dOpt({year: false, month: false, date: false, day: true,\n"
          + "                      minute: false, second: false, det:true, nat: true}))\n"
          + ").a('!')\n"

        );
        dessiner(editor.getValue(), language);
    }

    $("#french-realization-en,#french-realization-fr").click(function(){
        language = "fr";
        dessiner(editor.getValue(), language);
    });
    $("#english-realization-en,#english-realization-fr").click(function(){
        language = "en";
        dessiner(editor.getValue(), language);
    });
    $canvas.mousedown(afficherRealisation);
    $canvas.mouseup(cacherRealisation);
    $sepH.mousedown(debutDeplacerSep);
    $sepV.mousedown(debutDeplacerSep);
    $(window).mouseup(finDeplacerSep);
    $(window).mousemove(deplacerSep);
    $(window).unload(storeCurrentData);
    
    $("#interrogation").keypress(chercherInfos);
    $("#toEn").click(function(){setLang("en")});
    $("#toFr").click(function(){setLang("fr")});
    lang="fr";setLang("en"); // mettre la langue de départ en anglais
});
