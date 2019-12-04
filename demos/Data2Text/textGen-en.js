// global variables 
startDate=new Date();// dates to initialized in building.js
endDate=new Date();

function nvp(){return oneOf("np","vp")}

function jour(j){
    return DT(d_nb(startDate,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(startDate,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

// adds a number of days to a date
function d_nb(d0,nb){
    var d=new Date(d0);
    d.setDate(d.getDate() + nb);
    return d;
}

function jour(j){
    return DT(d_nb(startDate,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(startDate,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
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
        if (!(typeof module !== 'undefined' && module.exports))
            t.tag("span",{"id":"T"+tasks[i].id});
        if(f!==undefined)t=f(t)
        res.add(t)
    }
    return res;
}

function introduction(totalTime,firstTasks){
    // console.log("firstTasks",firstTasks);
    // indiquer la durée du projet
    work=NP(D("the"),N("construction"),PP(P("of"),NP(D("the"),N("building"))));
    var duree=NP(NO(totalTime).dOpt({nat: true}),N("day"));
    var q0=PP(P("for"),work);
    var q1=SP(Q("at least"),duree,VP(V("need").t("f"))).typ({"pas":true});
    var realisation = oneOf(
        ()=>S(q0.a(","),q1),
        ()=>S(q1.a(","),q0),
        ()=>S(duree,VP(V("be").t("f"),A("necessary"),q0))
    );
    // indiquer les tâches du début
    realisation += "\n"+oneOf(
        ()=>S(Pro("I").pe(2),
              V("shall").t("ps"),Q("start"),realiseTaches(firstTasks,nvp())),
        ()=>S(Pro("I").pe(2),V("need"),
              VP(V("start").t("b"),realiseTaches(firstTasks,nvp())))
    )+"\n";
    return realisation;
}

function developpement(middleTasks){
    var realisation = "";
    for (var i = 0; i < middleTasks.length; i++) {
        var t = middleTasks[i];
        // console.log(t);
        var v=oneOf(
            ()=>S(jour(t[0]),
                  VP(V("be").t("f"),
                     NP(D("the"),N("start")),PP(P("of"),realiseTaches(t,'np')))
                 ),
            ()=>S(Adv(oneOf("then","after","next","afterwards")),
                  nvp()=='np'?SP(Pro("I").pe(2),VP(V("do").t("f"),realiseTaches(t,'np')))
                             :SP(Pro("I").pe(2),VP(V("shall").t("ps"),realiseTaches(t,'vp')))
                  ),
            ()=>S(jour(t[0]),
                   Pro("I").pe(2),
                   VP(V("shall").t("ps"),Q("prepare"),realiseTaches(t,"vp",x=>x.t("b")))
                  )
        );
        // console.log(v);
        realisation+=v+"\n";
    }
    return realisation;
}

function conclusion(lastTasks,duree){
    var realisation=oneOf(
        ()=>S(oneOf(()=>Q("Finally,"),()=>Q("Lastly"),()=>Q("In conclusion,")),
              Pro("I").pe(2),VP(V("do").t("f")),realiseTaches(lastTasks,'np')),
        ()=>S(Pro("I").pe(2),VP(V(oneOf("end","finish","complete")).t("f"),
               P("by"),realiseTaches(lastTasks,'np'))),
        ()=>S(Pro("I").pe(2),VP(V(oneOf("end","finish","complete")).t("f"),
               P("by"),realiseTaches(lastTasks,'vp',x=>x.t("pr"))))
    )+"\n";
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