// variables globales
startDate=new Date();// dates à initialiser plus tard
endDate=new Date();

function nvp(){return oneOf("np","vp")}

function jour(j){
    return DT(d_nb(startDate,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(startDate,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

// ajoute un nombre de jour à une date
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
        if (!(typeof module !== 'undefined' && module.exports))
            t.tag("span",{"id":"T"+tasks[i].id});
        res.add(t)
    }
    return res;
}

function introduction(nbDays,firstTasks){
    // indiquer la durée du projet
    travail=NP(D("le"),N("construction"),PP(P("de"),NP(D("le"),N("bâtiment"))));
    var duree=NP(NO(nbDays).dOpt({nat: true}),oneOf(N("jour"),N("journée")));
    var q0=PP(P("pour"),V("compléter").t("b"),travail).a(",");
    var q1=SP(Pro("je"),V("falloir").t("f"),Q("au moins"),duree);
    var realisation = oneOf(
        ()=>S(q0,q1),
        ()=>S(q1,q0),
        ()=>S(duree,VP(V("être").t("f"),A("nécessaire"),q0))
    );
    // indiquer les tâches du début
    realisation += "\n"+oneOf(
        ()=>S(Pro("je").pe("3"),
              VP(V("falloir"),V("commencer").t("b"),
                       PP(P("par"),realiseTaches(firstTasks,nvp())))),
        ()=>S(Pro("je").n("p").pe(2),V("devoir").t("c"),
              VP(V("débuter").t("b"),
                       PP(P("par"),realiseTaches(firstTasks,nvp()))))
    )+"\n";
    return realisation;
}

function developpement(middleTasks){
    var realisation = "";
    for (var i = 0; i < middleTasks.length; i++) {
        var t = middleTasks[i];
        var v=oneOf(
            ()=>S(jour(t[0]),
                  VP(V("marquer").t("f"),
                     NP(D("le"),N("début")),PP(P("de"),realiseTaches(t,'np')))),
            ()=>S(oneOf(()=>Adv("puis"),()=>Adv("ensuite"),()=>Q("Après cela,"),()=>Q("Par la suite,")),
                  nvp()=='np'?SP(N("on"),VP(V("passer").t("f"),PP(P("à"),realiseTaches(t,'np'))))
                             :SP(Pro("je"),VP(V("falloir").t("f"),realiseTaches(t,'vp')))),
            ()=>S(jour(t[0]).a(","),
                   NP(N("on")),
                   VP(V("devoir").t("c"),Q("se"),V("occuper").t("b"),
                      PP(P("de"),realiseTaches(t,nvp()))))
        );
        // console.log(v);
        realisation+=v+"\n";
    }
    return realisation;
}

function conclusion(lastTasks,duree){
    var realisation=oneOf(
        ()=>S(oneOf(()=>Q("Finalement,"),()=>Q("En dernier lieu,"),()=>Q("À la fin,")),
              N("on"),VP(V("faire").t("f")),realiseTaches(lastTasks,'np')
            ),
        ()=>S(N("on"),VP(V(oneOf("terminer","finir","achever")).t("f"),
              P("par"),realiseTaches(lastTasks,nvp()))
            )
    )+"\n";
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
