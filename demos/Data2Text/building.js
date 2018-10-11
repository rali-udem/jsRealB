if (typeof module !== 'undefined' && module.exports) {
    var jsRealB=require("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dme-node.min.js");
    for (var v in jsRealB)
        eval("var "+v+"=jsRealB."+v);

    var pertjs=require(__dirname+"/pert.js");
    for (var v in pertjs)
        eval("var "+v+"=pertjs."+v);
}

// add to the lexicon
loadEn();
var verbs=[];
for (var i = 0; i < verbs.length; i++)
    addToLexicon(verbs[i],"");
var nouns=["paving","stringer"];
for (var i = 0; i < nouns.length; i++)
    addToLexicon(nouns[i],{"N":{"g":"m","tab":["n1"]}});
addToLexicon({"another":{"D":{"tab":["d4"]}}});
addToLexicon({"other":{"D":{"tab":["d4"]}}});
// addToLexicon({"armé":{"A":{"tab":["n28"]}}});
// addToLexicon({"on":{"N":{"g":"m","tab":["n3"]}}})// hack: on devrait plutôt changer la table pn1...
// addToLexicon({"need":{"N":{"tab":["n1"]},"V":{"tab":"v26"}}}); // error for conjugation table of need

function np(n){
    return (typeof n=="string")?NP(D("the"),N(n)):n;
}

function tnp(n0,prep,n1){ // task np
    return NP(np(n0),PP(P(prep),np(n1)));
}

function tvp(v,n){ //task vp
    if (typeof v=="string")v=V(v);
    return VP(v,np(n));
}

var betonArme=NP(D("the"),V("reinforce").t("pp"),N("concrete"));
var puits=np("shaft").n("p");
var longrines=np("stringer").n("p");
var canalisations=np("canalization").n("p");
var travail=tnp("construction","of","building");

function Task(id,duration,precedes,np,vp){
    this.id=id;   // same as the key, but useful for tracing
    this.index=null;
    this.duration=duration;
    this.pred=[];
    this.succ=precedes.length==0?[]:precedes.split(","); // yes : the successors of a node are the one that it precedes
    this.np=np;
    this.vp=vp;
    this.est=null; // earliest start time
    this.lst=null; // latest start time
    this.eet=null; // earliest end time
    this.let=null; // latest end time
    this.level=0;  // level computed after network creation
}

var q; // variable temporaire utilisée lors de l'initialisation de tasks
var data = [
    new Task("a",10,"c,q,t",  tnp("study","of","heating"),
                              tvp("plan","heating")),
    new Task("b",3, "c,u",    tnp("study","of","roof"),
                              tvp("plan","roof")),
    new Task("c",15,"k,d,p",  tnp("study","of","frame"),
                              tvp("plan","frame")),
    new Task("d",10,"f,o",    q=tnp("study","of",betonArme),
                              tvp("plan",q)),
    new Task("e",15,"g,i,o,f",tnp("preparation","of","land"),
                              tvp("prepare","land")),
    new Task("f",5,"g,i,o",   tnp("installation","of","land"),
                              tvp("install","land")),
    new Task("g",30,"h",      q=tnp("earthwork","for",puits),
                              tvp("do",q)),
    new Task("h",20,"n",      q=tnp("concrete","for",puits),
                              tvp("install",q)),
    new Task("i",4, "j",      tnp("ground","for",longrines),
                              tvp("ground",longrines)),
    new Task("j",18,"n",      q=tnp("concrete","for",longrines),
                              tvp("pour",q)),
    new Task("k",60,"l,m",    tnp("construction","of",q=tnp("frame","in","factory")),
                              tvp("build",q)),
    new Task("l",20,"m,s",    q=NP(NP(D("a"),Adv("first"),N("coat")),
                                   PP(P("of"),tnp(N("paint"),"in","factory"))),
                              tvp("apply",q)),
    new Task("m",5 ,"n",      tnp("move","of","frame"),
                              tvp("move","frame")),
    new Task("n",25,"x,w,r",  tnp("assembly","of","structure"),
                              tvp("assemble","structure")),
    new Task("o",5, "p",      tnp("earthwork","for",canalisations),
                              tvp("do",canalisations)),
    new Task("p",5, "w,r",    tnp("masonry","for",canalisations),
                              tvp("concrete",canalisations)),
    new Task("q",45,"r",      tnp(np("supply").n("p"),"for","heating"),
                              VP(V("supply"),PP(P("for"),NP(D("the"),N("heating"))))),
    new Task("r",35,"s",      tnp("installation","of","heating"),
                              tvp("install","heating")),
    new Task("s",40,"u",      NP(D("other"),N("coat"),PP(P("of"),N("paint"))).n("p"),
                              tvp("end","painting")),
    new Task("t",2,"v",       tnp("study","of","electricity"),
                              tvp("plan",tnp("installation","of","electricity"))),
    new Task("u",20,"v",      tnp("isolation","of","roof"),
                              tvp("insulate","roof")),
    new Task("v",20,"",       tnp("installation","of","electricity"),
                              tvp("install","electricity")),
    new Task("w",35,"",       q=NP(D("the"),N("paving")),
                              tvp("execute",q)),
    new Task("x",55,"",       NP(D("the"),N("sealer")).n("p"),
                              PP(CP(C("and"),V("fill"),V("cover")),P("of"),N("coating").n("p")))
];


var tasks={};
// créer un objet pour faciliter les indexations
for (var i = 0; i < data.length; i++) {
    var d=data[i];
    d.index=i;
    tasks[d.id]=d;
}

// tiré de https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Math/random#Obtenir_un_entier_aléatoire_dans_un_intervalle_ouvert_à_droite
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

//  in order no to evaluate all variants before choosing one, just add ()=> in front of each expression
//   which turns the variant into a function that will be evaluated after selection of the variant
function variante(elems){
    var e=elems[getRandomInt(0,elems.length)];
    // console.log(e);
    return typeof e=='function'?e():e;
}

function nvp(){return variante(["np","vp"])}

function realiseTaches(tasks,p){
    // console.log("realiseTaches:",tasks[0],p)
    var res=CP(C("and"));
    for (var i = 1; i < tasks.length; i++) {
        var t=tasks[i][p];
        // console.log(i,tasks[i].id);
        // if (p=='vp')t.t("b"); // mettre verbe à l'infinitif en français
        if (p=='vp')t.pe(2);  // mettre verbe à la forme de base en anglais...
        t.tag("span",{"id":"T"+tasks[i].id});
        res.add(t)
    }
    return res;
}

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

function introduction(totalTime,firstTasks){
    // indiquer la durée du projet
    var duree=NP(NO(totalTime).dOpt({nat: true}),N("day"));
    var q0=VP(V("end").t("b"),travail).a(",");
    var q1=SP(Q("at least"),duree,V("need").t("f").typ({"pas":true}));
    var realisation = variante([
        ()=>S(q0,q1),
        ()=>S(q1,q0),
        ()=>S(duree,VP(V("be").t("f"),A("necessary"),q0))
    ]);
    // indiquer les tâches du début
    realisation += "\n"+variante([
        ()=>S(Pro("I").pe("2"),
              V("shall").t("ps"),Q("start"),realiseTaches(firstTasks,nvp())),
        ()=>S(Pro("I").pe(2),V("need"),
              VP(V("start").t("b"),realiseTaches(firstTasks,nvp())))
    ])+"\n";
    return realisation;
}


function developpement(middleTasks){
    var realisation = "";
    for (var i = 0; i < middleTasks.length; i++) {
        var t = middleTasks[i];
        // console.log(t);
        var v=variante([
            ()=>S(jour(t[0]),
                  VP(V("be").t("f"),
                     NP(D("the"),N("start")),PP(P("of"),realiseTaches(t,'np')))
                 ),
            ()=>S(Adv(variante(["then","after","next","afterwards"])),
                  nvp()=='np'?SP(Pro("I").pe(2),VP(V("do").t("f"),realiseTaches(t,'np')))
                             :SP(Pro("I").pe(2),VP(V("shall").t("ps"),realiseTaches(t,'vp')))
                  ),
            ()=>S(jour(t[0]),
                   Pro("I").pe(2),
                   VP(V("shall").t("ps"),Q("prepare"),realiseTaches(t,nvp()))
                  )
        ]);
        // console.log(v);
        realisation+=v+"\n";
    }
    return realisation;
}

function conclusion(lastTasks){
    var realisation=variante([
        ()=>S(variante([()=>Q("Finally,"),()=>Q("Lastly"),()=>Q("In conclusion,")]),
              Pro("I").pe(2),VP(V("do").t("f")),realiseTaches(lastTasks,'np')
         ),
        ()=>S(Pro("I").pe(2),VP(V(variante(["end","finish","complete"])).t("f"),
              P("by"),realiseTaches(lastTasks,nvp()))
         )
    ])+"\n";
    realisation+=S(travail,VP(V("be").t("f"),V("complete").t("pp"),jour(duree)));
    return realisation+"\n";
}

/// start processing
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
                .append("<tr><th>Id</th><th>Desription</th><th># days</th><th>Precedes</th></tr>");
    Object.values(tasks).forEach(
        function (t){
            $tr=$("<tr></tr>")
                    .append($("<td/>").text(t.id))
                    .append($("<td/>").text(t.np))
                    .append($("<td/>").text(t.duration))
                    .append($("<td/>").text(t.succ))
            $table.append($tr);
        }
    )
    $("#etapes").append($table);
    traceAndRealize();
});
