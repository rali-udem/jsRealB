var pronoms=["moi","mien","nôtre"];

var options = {
    pe:[1,2,3],
    g:["m","f"],
    n:["s","p"],
    ow:["s","p"],
    tn:["","refl"],
    c:["nom","acc","dat","refl"]
}

let titres=["lemme","tonique","tonique réfléchi",
              "clitique nominatif","clitique accusatif","clitique datif","clitique réfléchi"];
const tnC=["",".tn('')",".tn('refl')",".c('nom')",".c('acc')",".c('dat')",".c('refl')"]

var header="<tr><td><code>jsRealB</code><br/>Réalisation</td></tr>"

function makeOptions(opts){
    if (opts.length==0)return [""];
    var o1=opts.shift();
    var rest = makeOptions(opts);
    var out=[];
    for (var i = 0; i < options[o1].length; i++) {
        var o=options[o1][i];
        var res=`.${o1}("${o}")`;
        for (var j = 0; j < rest.length; j++) {
            out.push(res+rest[j]);
        }
    }
    return out;
}

function $makeCell(Const,terminal,options){
    var exp=`${Const}("${terminal}")`+options;
    console.log(exp);
    return $("<td><code>"+exp+"</code><br/>"+eval(exp)+"</td>")
}

function $makeTable(Const,terminal,options){
    var $t=$("<table/>")
    $t.append($(header))
    var opts=makeOptions(options)
    for (var i = 0; i < opts.length; i++) {
        $t.append($("<tr/>").append($makeCell(Const,terminal,opts[i])))
    }
    return $t;
}

function $addLignes($table,Const,terminal,options){
    var opts=makeOptions(options)
    for (var i = 0; i < opts.length; i++) {
        $table.append($("<tr/>").append($makeCell(Const,terminal,opts[i])))
    }
}

function $pronomsPersonnels(pro,opts){
    let $t=$("<table>");
    let $tr=$("<tr/>")
    for (var i = 0; i < titres.length; i++) {
        $tr.append("<th>"+titres[i]+"</th>")
    }
    $t.append($tr);
    for (var i = 0; i < opts.length; i++) {
        $tr=$("<tr/>");
        const os=opts[i];
        const exp=`Pro("${pro}")`+os;
        const citation=pro=="on"?"on":eval(exp);
        $tr.append($makeCell("Pro",pro,os))
        for (var j = 1; j < tnC.length; j++) {
            $tr.append($makeCell("Pro",citation,tnC[j]))
        }
        $t.append($tr);
    }
    return $t;
}

function $flexionsGenreNombre(Const,singPlur){
    let $t=$("<table>");
    const titres=["lemme","masc sing","fem sing","masc plur","fem plur"];
    const gn=makeOptions(["n","g"]);
    gn.unshift("")
    let $tr=$("<tr/>")
    for (var i = 0; i < titres.length; i++) {
        $tr.append("<th>"+titres[i]+"</th>")
    }
    $t.append($tr);
    for (var i = 0; i < singPlur.length; i++) {
        let mot=singPlur[i];
        for (let j=1;j<4;j++){
            $tr=$("<tr/>");
            const exp=`${Const}("${mot}").pe(${j})`
            const citation=eval(eval(exp))
            $tr.append($makeCell(Const,mot,`.pe(${j})`))
            for (var k = 1; k < gn.length; k++) {
                $tr.append($makeCell(Const,citation,(j==1?".pe(1)":"")+gn[k]))
            }
            $t.append($tr)
        }
    }
    return $t;
}

function $englishPossessiveDeterminers(){
    let $t=$("<table/>");
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
    return $t
}

$(document).ready(function() {
    loadFr();
    $tableau=$("#francais");
    $tableau.append($pronomsPersonnels("moi",makeOptions(["g","n","pe"])))
    $tableau.append($pronomsPersonnels("on",[""]));
    $tableau.append($flexionsGenreNombre("Pro",["mien","nôtre"]))
    $tableau.append($flexionsGenreNombre("D",["mon","notre"]))
    
    loadEn();
    // HACK: change c("refl")=>c("gen")
    options.c[3]="gen";
    tnC[6]=".c('gen')"
    titres=["lemma","tonic","tonic reflexive",
              "clitic nominative","clitic accusative","clitic dative","clitic genitive"];
    $table=$("#english");
    $table.append($pronomsPersonnels("me",makeOptions(["g","n","pe"])))
    $table.append($englishPossessiveDeterminers())
});