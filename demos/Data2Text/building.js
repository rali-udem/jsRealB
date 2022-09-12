import {pert,computeSchedule,totalTime} from "./pert.js";
import {tasks,data} from "./tasks-data.js";
import {generateTaskDescriptions} from "./tasks.js";
import {dates,d_nb,introduction,developpement,conclusion,traceTasks} from "./textGen.js"

let lang;
if (typeof process !== "undefined" && process?.versions?.node){ // cannot use isRunningUnderNode yet!!!
    let {default:jsRealB} = await import("../../dist/jsRealB.js");
    Object.assign(globalThis,jsRealB);
    const argv=process.argv.slice(2);
    if (argv.length==0 || argv[0].startsWith("-h")){
        console.log("usage: node building.js lang [date]\n"+
                    "   lang: en|fr\n"+
                    "   date : starting date YYYY/MM/DD")
        process.exit(0)
    }
    const language=argv[0];
    if (language!="en" && language!="fr"){
        console.log('only "en" or "fr" implemented, en is choosen');
        lang="en";
    }
    if (argv.length>1){
        dates.start = new Date(argv[1])
    } else {
        dates.start = new Date(2018,10,1);
    }
    lang=language;
} else { // called from the web page
    Object.assign(globalThis,jsRealB);// jsRealB was imported by the script tag 
    lang=language; // from the script in the web page
}

/// compute critical path and task dates
pert(tasks);
const schedule=computeSchedule(tasks)
const nbDays=totalTime(tasks);
dates.end=d_nb(dates.start,nbDays);
generateTaskDescriptions(lang);

function traceAndRealize(lang){
    const newDate=new Date($("#startDate").val()+"T00:00:00-04:00");
    if (newDate!="Invalid Date"){
        dates.start=newDate;
        dates.end=d_nb(dates.start,nbDays);
    }
    $("#graphique").empty();  
    traceTasks(lang,data,$(window).width()-$("#etapes table").width()-100,$("#etapes table").height());
    $("#text").empty();
    $("#dateDebut")
        .text(""+DT(dates.start).dOpt({"day":false,"hour":false,"minute":false,"second":false,"det":false}));
    $("#text").append($("<p/>").html(introduction(lang,nbDays,schedule[0])));
    $("#text").append($("<p/>").html(developpement(lang,schedule.slice(1,schedule.length-1))));
    $("#text").append($("<p/>").html(conclusion(lang,schedule[schedule.length-1],nbDays)));    
}

if (isRunningUnderNode){
    console.log(introduction(lang,nbDays,schedule[0]));
    console.log(developpement(lang,schedule.slice(1,schedule.length-1)));
    console.log(conclusion(lang,schedule[schedule.length-1],nbDays));
} else { // called from the web page
    $(document).ready(function() {
        $("#startDate").change(()=>traceAndRealize(lang));
        const $table=$("<table/>")
        .append("<tr><th>Id</th><th style='width:300px'>Description</th><th># days</th><th>Precedes</th></tr>");
        Object.values(tasks).forEach(
            function (t){
                const $tr=$("<tr></tr>")
                .append($("<td/>").text(t.id))
                .append($("<td id='T_"+t.id+"'/>").text(S(t.np)))
                .append($("<td/>").text(t.duration))
                .append($("<td/>").text(t.succ))
                $table.append($tr);
            });
        $("#etapes").append($table);
        traceAndRealize(lang)
    });
}
