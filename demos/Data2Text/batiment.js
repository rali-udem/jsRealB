// if (typeof module !== 'undefined' && module.exports) {
//     var jsRealB=require("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-fr-node.min.js");
//     for (var v in jsRealB)
//         eval("var "+v+"=jsRealB."+v);
//
//     var pertjs=require(__dirname+"/pert.js");
//     for (var v in pertjs)
//         eval("var "+v+"=pertjs."+v);
// }
//
// var tasks={};
// // créer un objet pour faciliter les indexations
// for (var i = 0; i < data.length; i++) {
//     var d=data[i];
//     d.index=i;
//     tasks[d.id]=d;
// }
// console.log(tasks);
// tiré de https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Math/random#Obtenir_un_entier_aléatoire_dans_un_intervalle_ouvert_à_droite
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function variante(elems){
    var e=elems[getRandomInt(0,elems.length)];
    return typeof e=='function'?e():e;
}

function nvp(){return variante(["np","vp"])}

// ajoute un nombre de jour à une date
function d_nb(d0,nb){
    var d=new Date(d0);
    d.setDate(d.getDate() + nb);
    return d;
}

function jour(j){
    return DT(d_nb(jourDebut,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(jourDebut,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

pert(tasks);
var schedule=computeSchedule(tasks)
var duree=tempsTotal(tasks);
var jourDebut=new Date(2018,10,1);
var jourFin=d_nb(jourDebut,duree);
var cheminCritique=criticalPath(tasks);

function traceAndRealize(){
    var newDate=new Date($("#startDate").val()+"T00:00:00-04:00");
    // window.alert("newDate:"+newDate);
    if (newDate!="Invalid Date"){
        jourDebut=newDate;
        jourFin=d_nb(jourDebut,duree);
    }
    $("#graphique").empty();  
    traceTasks(data,$(window).width()-$("#etapes table").width()-100,$("#etapes table").height());
    $("#text").empty();
    $("#dateDebut")
      .text(""+DT(jourDebut).dOpt({"day":false,"hour":false,"minute":false,"second":false,"det":false}));
    $("#text").append($("<p/>").html(introduction(duree,schedule[0])));
    $("#text").append($("<p/>").html(developpement(schedule.slice(1,schedule.length-1))));
    $("#text").append($("<p/>").html(conclusion(schedule[schedule.length-1],duree)));    
}

$(document).ready(function() {
    $("#startDate").change(traceAndRealize);
    $table=$("<table/>")
                .append("<tr><th>Id</th><th>Description</th><th>dur</th><th>Prec</th></tr>");
    data.forEach(
        function (t){
            $tr=$("<tr></tr>")
                    .append($("<td/>").text(t.id))
                    .append($("<td/>").text(t.np))
                    .append($("<td/>").text(t.duration))
                    .append($("<td/>").text(t.succ));
            $table.append($tr);
        }
    );
    $("#etapes").append($table);
    traceAndRealize();
});
