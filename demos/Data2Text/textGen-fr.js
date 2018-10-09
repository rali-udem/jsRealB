var inNodeJs=typeof module !== 'undefined' && module.exports;
if (inNodeJs) {
    var tasksFr=require(__dirname+"/tasks-fr.js");
    for (var v in tasksFr)
        eval("var "+v+"=tasksFr."+v);
}

// variables globales
jourDebut=new Date();// dates à initialiser plus tard
jourFin=new Date(); 
////

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

function jour(j){
    return DT(d_nb(jourDebut,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(jourDebut,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
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

/// pour afficher les mois sur les axes en français

function fmtMois(i){
    return ["janvier","février","mars","avril","mai","juin",
            "juillet","août","septembre","octobre","novembre","décembre"][i];
}

function tooltipText(duration,start,end,critical){
    return SP(NP(NO(duration),N("jour")).a(","),
              critical?PP(P("de"),jourMois(start),P("à"),jourMois(end)):
                       PP(P("entre"),CP(C("et"),jourMois(start),jourMois(end))));
}

function realiseTaches(tasks,p){
    // console.log("realiseTaches:",tasks[0],p)
    var res=CP(C("et"));
    for (var i = 1; i < tasks.length; i++) {
        var t=tasks[i][p];
        // console.log(i,tasks[i].id);
        if (p=='vp')t.t("b"); // mettre verbe à l'infinitif
        if (!inNodeJs)t.tag("span",{"id":"T"+tasks[i].id});
        res.add(t)
    }
    return res;
}

function introduction(totalTime,firstTasks){
    // indiquer la durée du projet
    var duree=NP(NO(totalTime).dOpt({nat: true}),variante([N("jour"),N("journée")]));
    var q0=PP(P("pour"),V("compléter").t("b"),travail).a(",");
    var q1=SP(Pro("je"),V("falloir").t("f"),Q("au moins"),totalTime);
    var realisation = variante([
        ()=>S(q0,q1),
        ()=>S(q1,q0),
        ()=>S(duree,VP(V("être").t("f"),A("nécessaire"),q0))
    ]);
    // indiquer les tâches du début
    realisation += "\n"+variante([
        ()=>S(Pro("je").pe("3"),
              VP(V("falloir"),V("commencer").t("b"),
                       PP(P("par"),realiseTaches(firstTasks,nvp())))),
        ()=>S(Pro("je").n("p").pe(2),V("devoir").t("c"),
              VP(V("débuter").t("b"),
                       PP(P("par"),realiseTaches(firstTasks,nvp()))))
    ])+"\n";
    return realisation;
}

function developpement(middleTasks){
    var realisation = "";
    for (var i = 0; i < middleTasks.length; i++) {
        var t = middleTasks[i];
        var v=variante([
            ()=>S(jour(t[0]),
                  VP(V("marquer").t("f"),
                     NP(D("le"),N("début")),PP(P("de"),realiseTaches(t,'np')))),
            ()=>S(variante([()=>Adv("puis"),()=>Adv("ensuite"),()=>Q("Après cela,"),()=>Q("Par la suite,")]),
                  nvp()=='np'?SP(N("on"),VP(V("passer").t("f"),PP(P("à"),realiseTaches(t,'np'))))
                             :SP(Pro("je"),VP(V("falloir").t("f"),realiseTaches(t,'vp')))),
            ()=>S(jour(t[0]).a(","),
                   NP(N("on")),
                   VP(V("devoir").t("c"),Q("se"),V("occuper").t("b"),
                      PP(P("de"),realiseTaches(t,nvp()))))
        ]);
        // console.log(v);
        realisation+=v+"\n";
    }
    return realisation;
}

function conclusion(lastTasks,duree){
    var realisation=variante([
        ()=>S(variante([()=>Q("Finalement,"),()=>Q("En dernier lieu,"),()=>Q("À la fin,")]),
              N("on"),VP(V("faire").t("f")),realiseTaches(lastTasks,'np')
            ),
        ()=>S(N("on"),VP(V(variante(["terminer","finir","achever"])).t("f"),
              P("par"),realiseTaches(lastTasks,nvp()))
            )
    ])+"\n";
    realisation+=S(travail,VP(V("compléter").t("fa").aux("être"),jour(duree)));
    return realisation+"\n";
}

if (typeof module !== 'undefined' && module.exports) {
    exports.d_nb=d_nb
    exports.fmtMois=fmtMois;
    exports.tooltipText=tooltipText;
    exports.data=data;
    exports.tasks=tasks;
    exports.introduction=introduction;
    exports.developpement=developpement;
    exports.conclusion=conclusion;
}
