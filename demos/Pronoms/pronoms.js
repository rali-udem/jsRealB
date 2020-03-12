var pronoms=["moi","mien","nôtre"];

var options = {
    pe:[1,2,3],
    g:["m","f"],
    n:["s","p"],
    tn:["","refl"],
    c:["nom","acc","dat","refl"]
}

function makeOptions(opts){
    if (opts.length==0)return [];
    var o1=opts.shift();
    var rest = makeOptions(opts);
    var out=[];
    for (var i = 0; i < options[o1].length; i++) {
        var o=options[o1][i];
        var res=`.${o1}("${o}")`;
        if (rest.length==0){
            out.push(res);
        } else {
            for (var j = 0; j < rest.length; j++) {
                out.push(res+rest[j]);
            }
        }
    }
    return out;
}

// makeOptions(["pe","g","n"])

// function $makePeGN(Const,terminal,pe,g,n){
//     var exp=Const(terminal).pe(pe).g(g).n(n);
//     return $("<td><code>"+exp.toSource()+"</code></td>"+"<td>"+exp+"</td>")
// }

function $makeTablePeGN(Const,terminal){
    var t=$("<table/>")
    t.append($("<tr><th>jsRealB</th><th>Réalisation</th></tr>"))
    var opts=makeOptions(["pe","g","n"])
    for (var i = 0; i < opts.length; i++) {
        var exp=`${Const}("${terminal}")`+opts[i];
        console.log(exp);
        t.append($("<tr><td><code>"+exp+"</code></td>"+"<td>"+eval(exp)+"</td></tr>"))
    }
    return t;
}

// function $makeGN(Const,terminal,g,n){
//     var exp=Const(terminal).g(g).n(n);
//     return $("<td><code>"+exp.toSource()+"</code></td>"+"<td>"+exp+"</td>")
// }
//
// function $makeTableGN(Const,terminal){
//     var t=$("<table/>")
//     t.append($("<tr><th>jsRealB</th><th>Réalisation</th></tr>"))
//     for (var j = 0; j < genres.length; j++) {
//         var g=genres[j];
//         for (var k = 0; k < nombres.length; k++) {
//             var n=nombres[k];
//             t.append($("<tr/>").append($makeGN(Const,terminal,g,n)))
//         }
//     }
//     return t;
// }




$(document).ready(function() {
    Object.assign(lexiconFr,lexiconFrPro);
    Object.assign(ruleFr,ruleFrPro);
    loadFr();
    $tableau=$("#pronoms");
    for (var i = 0; i < pronoms.length; i++) {
        $tableau.append($makeTablePeGN("Pro",pronoms[i]))
    }
    // $tableau=$("#determinants");
    // $tableau.append($makeTableGN(Pro,"mien"))
    // $tableau.append($makeTableGN(D,"mon"))
    
});