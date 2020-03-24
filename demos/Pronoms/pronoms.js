var pronoms=["moi","mien","nôtre"];

var options = {
    pe:[1,2,3],
    g:["m","f"],
    n:["s","p"],
    ow:["s","p"],
    tn:["","refl"],
    c:["nom","acc","dat","refl"]
}


function makeOptions(opts){
    if (opts.length==0)return [""];
    var o1=opts.shift();
    var rest = makeOptions(opts);
    var out=[];
    for (var i = 0; i < options[o1].length; i++) {
        var o=options[o1][i];
        var res = o1=="pe" ? `.pe(${o})` : `.${o1}("${o}")`;
        for (var j = 0; j < rest.length; j++) {
            out.push(res+rest[j]);
        }
    }
    return out;
}

function $makeCell(Const,terminal,options){
    var exp=`${Const}("${terminal}")`+options;
    // console.log(exp);
    return $("<td><b>"+eval(exp)+"</b><br/><code>"+exp+"</code></td>")
}


function ajouterTitre($t,titres){
    $tr=$("<tr/>")
    for (var i = 0; i < titres.length; i++) {
        $tr.append("<th>"+titres[i]+"</th>")
    }
    $t.append($tr);    
}

function pronomsPersonnels($t,pro,opts,tnC){
    for (var i = 0; i < opts.length; i++) {
        let $tr=$("<tr/>");
        if (i==opts.length-1)$tr.addClass("last");
        const os=opts[i];
        const exp=`Pro("${pro}")`+os;
        const citation=pro=="on"?"on":eval(exp);
        $tr.append($makeCell("Pro",pro,os))
        for (var j = 1; j < tnC.length; j++) {
            $tr.append($makeCell("Pro",citation,tnC[j]))
        }
        $t.append($tr);
    }
}


function flexionsGenreNombre($t,Const,singPlur,gn){
    for (var i = 0; i < singPlur.length; i++) {
        let mot=singPlur[i];
        for (let j=1;j<4;j++){
            $tr=$("<tr/>");
            if (j==3)$tr.addClass("last")
            const exp=`${Const}("${mot}").pe(${j})`
            const citation=eval(eval(exp))
            $tr.append($makeCell(Const,mot,`.pe(${j})`))
            for (var k = 1; k < gn.length; k++) {
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
    const tnC=["",".tn('')",".tn('refl')",".c('nom')",".c('acc')",".c('dat')",".c('refl')"]
    var header="<tr><td><code>jsRealB</code><br/>Réalisation</td></tr>"
    let $francais=$("#francaisPro");
    let $t=$("<table/>");
    ajouterTitre($t,titres)
    pronomsPersonnels($t,"moi",makeOptions(["g","n","pe"]),tnC)
    pronomsPersonnels($t,"on",[""],tnC);
    $francais.append($t)
    
    $t=$("<table/>");
    titres=["lemme","masculin singulier","féminin singulier","masculin pluriel","féminin pluriel"];
    const gn=makeOptions(["n","g"]);
    gn.unshift("")
    ajouterTitre($t,titres)
    $francais.append($t)
    flexionsGenreNombre($t,"Pro",["mien","nôtre"],gn);
    
    $francais=$("#francaisDet");
    $t=$("<table/>");
    ajouterTitre($t,titres)
    flexionsGenreNombre($t,"D",["mon","notre"],gn); 
    $francais.append($t)
}

function englishPossessiveDeterminers($t){
    const genres=options.g.concat(["n"])
    const ow=["s","p"];
    for (var i = 0; i < ow.length; i++) {
        var o= ow[i];
        for (var pe=1;pe<4;pe++){
            let opts=`.pe(${pe}).ow("${o}")`;
            if (pe==3 && o=="s"){
                for (var k = 0; k < genres.length; k++) {
                    var g=genres[k];
                    opts+=`.g("${g}")`
                    $t.append($("<tr/>").append($makeCell("D","my",opts)))
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
    const tnC=["",".tn('')",".tn('refl')",".c('nom')",".c('acc')",".c('dat')",".c('gen')"]
    let $english=$("#englishPro");
    let $t=$("<table/>");
    ajouterTitre($t,titres);
    pronomsPersonnels($t,"me",makeOptions(["g","n","pe"]),tnC);
    pronomsPersonnels($t,"it",[""],tnC);
    $english.append($t);

    $english=$("#englishDet")
    $t=$("<table/>");
    const gn=makeOptions(["n","g"]);
    gn.unshift("")
    ajouterTitre($t,["Possessive determiner"]);
    
    englishPossessiveDeterminers($t)
    $english.append($t);
}

$(document).ready(function() {
    tableauFrancais();
    englishTable();
});