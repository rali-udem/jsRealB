"use strict";
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

// go the corresponding h2 or h3 element in the other language
function changeLanguage(){
    // find the index first h2 element displayed on the page in the current language
    let h2Tops = $(`h2[lang=${currentLang}],h3[lang=${currentLang}]`).map(function(){return this.offsetTop}).get();
    const currTop = window.scrollY;
    const idx=h2Tops.findIndex(v => v>=currTop);
    setLanguage(currentLang=="en"?"fr":"en");
    if (idx>=0){
        // scroll to the corresponding element in the new language
        h2Tops = $(`h2[lang=${currentLang}],h3[lang=${currentLang}]`).map(function(){return this.offsetTop}).get();
        window.scrollTo(0,h2Tops[idx])
    }
}

function setLanguage(lang){
    if (lang=="en"){
        currentLang="en"; $("[lang=en]").show(); $("[lang=fr]").hide();
    } else {
        currentLang="fr"; $("[lang=fr]").show(); $("[lang=en]").hide();        
    }
}

var titres=[
    {"fr":"Nom","en":"Name"},
    {"fr":"Représentation","en":"Representation"},
    {"fr":"Exemple","en":"Example"},
    {"fr":"Réalisation","en":"Realisation"}
];

function insertArticle($article,infos,lang){
    // console.log("insertArticle(%o,%o,%o)",$article,infos,lang);
    if (lang=='fr')loadFr(); else loadEn();
    if (infos[lang]!="")
        $article.append($(`<h3 lang="${lang}">${infos[lang]}</h3>`));
    let $table=$(`<table lang="${lang}"/>`);
    let $head = $(`<tr><th>${titres[0][lang]}</th><th>${titres[1][lang]}</th><th>${titres[2][lang]}</th><th>${titres[3][lang]}</th></tr>`)
    $table.append($head);
    for (let i = 0; i < infos.ex.length; i++) {
        const ex=infos.ex[i];
        let $tr=$(`<tr/>`);
        if (ex["pattern"]!==undefined){
            if (ex[lang][0]!=''){
                $tr.append($(`<td class="description">${ex[lang][0]}</td>`));
                $tr.append($(`<td class="pattern">${ex["pattern"]}</td>`));
                const jsrExpr = ex[lang][1];
                $tr.append($(`<td class="example-${lang}">${jsrExpr}</td>`));
                const jsrEval = eval(jsrExpr)
                const jsrReal = jsrEval instanceof Constituent ? jsrEval.realize() : jsrEval 
                $tr.append($(`<td class="realisation">${jsrReal}</td>`));
            }
        } else {
            $tr.addClass("groupe");
            $tr.append($(`<td>${ex[lang]}</td> <td colspan='3' class='pattern'>${ex["group"]}</td>`));
        }
        $table.append($tr);
    }
    $article.append($table);
}

function insertQuickLinks(lang){
    const $ql=$("#quicklinks .dropdown-content");
    $("h2[lang="+lang+"]").each(function(){
        const id=$(this).attr("id");
        $ql.append(`<a href="#${id}" lang="${lang}">${$(this).html()}</a>`)
    });
}


//// for the table of pronouns...
const options = {
    pe:[1,2,3],
    g:["m","f"],
    n:["s","p"],
    ow:["s","p"],
    tn:["","refl"],
    c:["nom","acc","dat","refl"]
}


function makeOptions(opts){
    if (opts.length==0)return [""];
    const o1=opts.shift();
    const rest = makeOptions(opts);
    let out=[];
    for (let i = 0; i < options[o1].length; i++) {
        const o=options[o1][i];
        const res = o1=="pe" ? `.pe(${o})` : `.${o1}("${o}")`;
        for (let j = 0; j < rest.length; j++) {
            out.push(res+rest[j]);
        }
    }
    return out;
}

function $makeCell(Const,terminal,options){
    const exp=`${Const}("${terminal}")`+options;
    return $("<td><span class='realisation'>"+eval(exp+".realize()")+"</span><br/>"+
                 "<span class='pattern'>"+exp+"</span></td>");
}


function ajouterTitre($t,titres){
    let $tr=$("<tr/>")
    for (let i = 0; i < titres.length; i++) {
        $tr.append("<th>"+titres[i]+"</th>")
    }
    $t.append($tr);    
}

function pronomsPersonnels($t,pro,opts,tnC){
    for (let i = 0; i < opts.length; i++) {
        let $tr=$("<tr/>");
        if (i==opts.length-1)$tr.addClass("last");
        const os=opts[i];
        const exp=`Pro("${pro}")`+os;
        const citation=pro=="on"?"on":eval(exp).realize();
        $tr.append($makeCell("Pro",pro,os))
        for (var j = 1; j < tnC.length; j++) {
            let x=tnC[j];
            if (i==0 && opts.length>1)x+=".pe(1)";       // ensure pe for first line
            if (os=='.pe(1).g("f").n("s")' && pro=="me")x+='.g("f")'; // HACK: very special case of English pronouns
            $tr.append($makeCell("Pro",citation,x));
        }
        $t.append($tr);
    }
}


function flexionsGenreNombre($t,Const,singPlur,gn){
    for (let i = 0; i < singPlur.length; i++) {
        let mot=singPlur[i];
        for (let j=1;j<4;j++){
            let $tr=$("<tr/>");
            if (j==3)$tr.addClass("last")
            const exp=`${Const}("${mot}").pe(${j})`
            const citation=eval(exp).realize()
            $tr.append($makeCell(Const,mot,`.pe(${j})`))
            for (let k = 1; k < gn.length; k++) {
                $tr.append($makeCell(Const,citation,(j==1?".pe(1)":"")+gn[k]))
            }
            $t.append($tr)
        }
    }
}

function tableauFrancais(){
    loadFr();
    let titres=["lemme","tonique","tonique réfléchi",
                  "clitique nominatif","clitique accusatif","clitique datif","clitique réfléchi"];
    const tnC=["",'.tn("")','.tn("refl")','.c("nom")','.c("acc")','.c("dat")','.c("refl")']
    var header="<tr><td><code>jsRealB</code><br/>Réalisation</td></tr>"
    let $pronomTon=$("#pronomsTon");
    let $t=$("<table/>");
    ajouterTitre($t,titres)
    pronomsPersonnels($t,"moi",makeOptions(["g","n","pe"]),tnC)
    pronomsPersonnels($t,"on",[""],tnC);
    $pronomTon.append($t)
    
    let $pronomPoss=$("#pronomsPoss")
    $t=$("<table/>");
    titres=["lemme","masculin singulier","féminin singulier","masculin pluriel","féminin pluriel"];
    const gn=makeOptions(["n","g"]);
    gn.unshift("")
    ajouterTitre($t,titres)
    flexionsGenreNombre($t,"Pro",["mien","nôtre"],gn);
    $pronomPoss.append($t)
    
    let $determinantsPoss=$("#determinantsPoss");
    $t=$("<table/>");
    ajouterTitre($t,titres)
    flexionsGenreNombre($t,"D",["mon","notre"],gn); 
    $determinantsPoss.append($t)
}

function englishPossessiveDeterminers($t){
    const genres=options.g.concat(["n"])
    const ow=["s","p"];
    for (let i = 0; i < ow.length; i++) {
        const o= ow[i];
        for (let pe=1;pe<4;pe++){
            let opts=`.pe(${pe}).ow("${o}")`;
            if (pe==3 && o=="s"){
                for (let k = 0; k < genres.length; k++) {
                    const g=genres[k];
                    $t.append($("<tr/>").append($makeCell("D","my",opts+`.g("${g}")`)))
                }
            } else {
                $t.append($("<tr/>").append($makeCell("D","my",opts)))
            }
        }
    }
    return 
}

function englishTable(){
    loadEn();
    let titres=["lemma","tonic","tonic reflexive",
                "clitic nominative","clitic accusative","clitic dative","clitic genitive"];
    const tnC=["",'.tn("")','.tn("refl")','.c("nom")','.c("acc")','.c("dat")','.c("gen")']
    let $tonicPro=$("#tonicPro");
    let $t=$("<table/>");
    ajouterTitre($t,titres);
    pronomsPersonnels($t,"me",makeOptions(["pe","g","n"]),tnC);
    pronomsPersonnels($t,"it",[""],tnC);
    $tonicPro.append($t);

    let $possDet=$("#possDet")
    $t=$("<table/>");
    ajouterTitre($t,["Possessive determiner"]);
    englishPossessiveDeterminers($t)
    $possDet.append($t);
}

$(document).ready(function() {
    Object.assign(globalThis,jsRealB);
    $(".version-no").text(jsRealB_version);
    $(".version-date").text(jsRealB_dateCreated);
    insertQuickLinks("fr");
    insertQuickLinks("en");
    $("div[id]").each(function(){
        var $art=$(this);
        var infos=eval($art.attr("id"));
        if (infos.ex!==undefined){
            insertArticle($art,infos,"fr");
            insertArticle($art,infos,"en");
        }
    });
    $("#langSelect").css({"cursor":"pointer"})
    $("#langSelect").click(changeLanguage);
    
    // add pronoun section
    tableauFrancais();
    englishTable();
    
    var lang=$.urlParam("lang");
    // console.log("lang="+lang);
    if (lang=="en" || lang=="fr")
        setLanguage(lang);
    else
        setLanguage("fr");
});
