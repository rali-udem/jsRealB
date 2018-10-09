var inNodeJs=typeof module !== 'undefined' && module.exports;
if (inNodeJs) {
    var tasksEn=require(__dirname+"/tasks-en.js");
    for (var v in tasksEn)
        eval("var "+v+"=tasksEn."+v);
}

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

function fmtMois(i){
    return ["January","February","March","April","May","June",
            "July","August","September","October","November","December"][i];
}

function tooltipText(duration,start,end,critical){
    return SP(NP(NO(duration),N("day")).a(","),
              critical?PP(P("from"),jourMois(start).dOpt({"det":false}),P("to"),jourMois(end).dOpt({"det":false})):
                       PP(P("between"),CP(C("and"),jourMois(start).dOpt({"det":false}),jourMois(end).dOpt({"det":false}))));
}

function realiseTaches(tasks,p,f){
    // console.log("realiseTaches:",tasks[0],p)
    var res=CP(C("and"));
    for (var i = 1; i < tasks.length; i++) {
        var t=tasks[i][p];
        // console.log(i,tasks[i].id);
        if (p=='vp')t.pe(1); // hack pour avoir la forme de base du verbe
        if (!inNodeJs)t.tag("span",{"id":"T"+tasks[i].id});
        if(f!==undefined)t=f(t)
        res.add(t)
    }
    return res;
}

function introduction(totalTime,firstTasks){
    // indiquer la durée du projet
    var duree=NP(NO(totalTime).dOpt({nat: true}),N("day"));
    var q0=VP(V("end").t("b"),work).a(",");
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
                   VP(V("shall").t("ps"),Q("prepare"),realiseTaches(t,"vp",x=>x.t("b")))
                  )
        ]);
        // console.log(v);
        realisation+=v+"\n";
    }
    return realisation;
}

function conclusion(lastTasks,duree){
    var realisation=variante([
        ()=>S(variante([()=>Q("Finally,"),()=>Q("Lastly"),()=>Q("In conclusion,")]),
              Pro("I").pe(2),VP(V("do").t("f")),realiseTaches(lastTasks,'np')),
        ()=>S(Pro("I").pe(2),VP(V(variante(["end","finish","complete"])).t("f"),
               P("by"),realiseTaches(lastTasks,'np'))),
        ()=>S(Pro("I").pe(2),VP(V(variante(["end","finish","complete"])).t("f"),
               P("by"),realiseTaches(lastTasks,'vp',x=>x.t("pr"))))
    ])+"\n";
    realisation+=S(work,VP(V("be").t("f"),V("complete").t("pp"),jour(duree)));
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