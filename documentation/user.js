"use strict";
var jsRealBdir='./dist/';
var currentLang;

// taken from https://www.sitepoint.com/url-parameters-jquery/
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

function changeLanguage(){
    setLanguage(currentLang=="en"?"fr":"en");
}

function setLanguage(lang){
    if (lang=="en"){
        currentLang="en"; $("[lang=en]").show(); $("[lang=fr]").hide();
    } else {
        currentLang="fr"; $("[lang=fr]").show(); $("[lang=en]").hide();        
    }
}

function tag(tagName,body,attrs){
    if(arguments.length==1)return "<"+tagName+"/>";
    return "<"+tagName+(arguments.length>2?" "+attrs:"")+">"+
        body+"</"+tagName+">";
}

var titres=[
    {"fr":"Nom","en":"Name"},
    {"fr":"Représentation","en":"Representation"},
    {"fr":"Exemple","en":"Example"},
    {"fr":"Réalisation","en":"Realisation"}
];

function insertArticle($article,infos,lang){
    // console.log("insertArticle(%o,%o,%o)",$article,infos,lang);
    var infos=eval($article.attr("id"));
    if (lang=='fr')loadFr(); else loadEn();
    if (infos[lang]!="")
        $article.append($(tag("h3",infos[lang],'lang="'+lang+'"')));
    var $table=$(tag("table","",'lang="'+lang+'"'));
    var $head=$(tag("tr",tag("th",titres[0][lang])+
                         tag("th",titres[1][lang])+
                         tag("th",titres[2][lang])+
                         tag("th",titres[3][lang])));
    $table.append($head);
    for (var i = 0; i < infos.ex.length; i++) {
        var ex=infos.ex[i];
        var $tr;
        if (ex["pattern"]!==undefined){
            if (ex[lang][0]!=''){
                $tr=$(tag("tr",tag("td",ex[lang][0],"class='description'")+
                               tag("td",ex["pattern"],"class='pattern'")+
                               tag("td",ex[lang][1],"class='example-"+lang+"'")+
                               tag("td",eval(ex[lang][1]),"class='realisation'")));
            }
        } else
            $tr=$(tag("tr",tag("td",ex[lang])+tag("td",ex["group"],"colspan='3' class='pattern'"),"class='groupe'"))
        $table.append($tr);
    }
    $article.append($table);
}

function insertQuickLinks(lang){
    var $ql=$("#quicklinks .dropdown-content");
    $("h2[lang="+lang+"]").each(function(){
        var id=$(this).attr("id");
        $ql.append(tag("a",$(this).html(),'href="#'+id+'" '+'lang="'+lang+'"'));
    });
}

$(document).ready(function() {
    $("#jsRealB-en").append(jsRealBdir+"jsRealB-en.min.js")
    $("#jsRealB-fr").append(jsRealBdir+"jsRealB-fr.min.js")
    $("#jsRealB-enfr").append(jsRealBdir+"jsRealB-enfr.min.js")
    $("#jsRealB-en-node").append(jsRealBdir+"jsRealB-en.node.js")
    $("#jsRealB-fr-node").append(jsRealBdir+"jsRealB-fr.node.js")
    $("#jsRealB-enfr-node").append(jsRealBdir+"jsRealB-enfr.node.js")
    insertQuickLinks("fr");
    insertQuickLinks("en");
    $("div[id]").each(function(){
        var $art=$(this);
        var infos=eval($art.attr("id"));
        insertArticle($art,infos,"fr");
        insertArticle($art,infos,"en");
    });
    $("#langSelect").css({"cursor":"pointer"})
    $("#langSelect").click(changeLanguage);
    
    var lang=$.urlParam("lang");
    // console.log("lang="+lang);
    if (lang=="en" || lang=="fr")
        setLanguage(lang);
    else
        setLanguage("fr");
});
