var pronoms=["moi","mien","nôtre"];

var options = {
    pe:[1,2,3],
    g:["m","f"],
    n:["s","p"],
    tn:["","refl"],
    c:["nom","acc","dat","refl"]
}

var header="<tr><th>jsRealB</th><th>Réalisation</th></tr>"

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


function $makeTable(Const,terminal,options){
    var t=$("<table/>")
    t.append($(header))
    var opts=makeOptions(options)
    for (var i = 0; i < opts.length; i++) {
        var exp=`${Const}("${terminal}")`+opts[i];
        console.log(exp);
        t.append($("<tr><td><code>"+exp+"</code></td>"+"<td>"+eval(exp)+"</td></tr>"))
    }
    return t;
}

function $addLignes($table,Const,terminal,options){
    var opts=makeOptions(options)
    for (var i = 0; i < opts.length; i++) {
        var exp=`${Const}("${terminal}")`+opts[i];
        console.log(exp)
        $table.append($("<tr><td><code>"+exp+"</code></td>"+"<td>"+eval(exp)+"</td></tr>"))
    }
}

$(document).ready(function() {
    Object.assign(lexiconFr,lexiconFrPro);
    Object.assign(ruleFr.declension,ruleFrPro_declension);
    loadFr();
    $tableau=$("#pronoms");
    $tableau.append($makeTable("Pro","moi",["g","n","pe"]))
    $tableau.append($makeTable("Pro","on",[]))
    $tableau.append($makeTable("Pro","moi-même",["g","n","pe"]))
    $tableau.append($makeTable("Pro","mien",["g","n","pe"]))
    $tableau.append($makeTable("Pro","nôtre",["g","n","pe"]))
    $tableau.append($makeTable("Pro","mien",["g","n","pe"]))
    $tableau.append($makeTable("D","mon",["g","n"]))
    
    var nouveauxPronoms=["toi","lui","elle","vous","eux","elles","on"];
    for (var i = 0; i < nouveauxPronoms.length; i++) {
        var pro=nouveauxPronoms[i];
        var $table=$("<table/>");
        $table.append($(header));
        $addLignes($table,"Pro",pro,["tn"]);
        $addLignes($table,"Pro",pro,["c"]);
        $tableau.append($table)
    }
});