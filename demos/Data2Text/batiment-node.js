// var jsRealB=require("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dmefr-node.min.js");
// for (var v in jsRealB)
//         eval("var "+v+"=jsRealB."+v);

// var pertjs=require(__dirname+"/pert.js");
// for (var v in pertjs){
//     eval("var "+v+"=pertjs."+v);
// }

// var textGen=require(__dirname+"/textGen-fr.js");
// for (var v in textGen)
//         eval("var "+v+"=textGen."+v);

function evalExports(file){
    let f=require(file);
    for (let v in f)
        eval(v+"= f."+v);
}

evalExports("/Users/lapalme/Documents/GitHub/jsRealB/dist/jsRealB-dmefr-node.min.js");
evalExports(__dirname+"/pert.js");
evalExports(__dirname+"/textGen-fr.js")

pert(tasks);
var schedule=computeSchedule(tasks)
// var cheminCritique=criticalPath(tasks);
// console.log("Chemin critique="+cheminCritique);

loadFr();
var duree=tempsTotal(tasks);
jourDebut=new Date(2018,10,1);
jourFin=d_nb(jourDebut,duree).getTime();

showTasks(data,"Tâches");
// showSchedule(schedule);
console.log(introduction(duree,schedule[0]));
console.log(developpement(schedule.slice(1,schedule.length-1)));
console.log(conclusion(schedule[schedule.length-1],duree));

loadEn();
var textGen=require(__dirname+"/textGen-en.js");
for (var v in textGen)
        eval("var "+v+"=textGen."+v);

loadEn();
showTasks(data,"Tasks");
// showSchedule(schedule);
// console.log("Chemin critique/Critical Path="+cheminCritique);
console.log(introduction(duree,schedule[0]));
console.log(developpement(schedule.slice(1,schedule.length-1)));
console.log(conclusion(schedule[schedule.length-1],duree));
