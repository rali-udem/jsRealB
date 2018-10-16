// when used as a node module
if (typeof module !== 'undefined' && module.exports) {
    // eval exports of file in the global namespace
    function evalExports(file){
        let f=require(file);
        for (let v in f){
            eval(v+"= f."+v);
        }
    }
    evalExports("../../dist/jsRealB-dmefr-node.min.js");
    evalExports(__dirname+"/pert.js");
    evalExports(__dirname+"/tasks-data.js");
    evalExports(__dirname+"/tasks-fr.js");
    evalExports(__dirname+"/textGen-fr.js");
}

function jour(j){
    return DT(d_nb(startDate,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(startDate,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

pert(tasks);
var schedule=computeSchedule(tasks)
var nbDays=totalTime(tasks);
startDate=new Date(2018,10,1);
endDate=d_nb(startDate,nbDays);
var cheminCritique=criticalPath(tasks);
generateTaskDescriptions();

function traceAndRealize(){
    var newDate=new Date($("#startDate").val()+"T00:00:00-04:00");
    if (newDate!="Invalid Date"){
        startDate=newDate;
        endDate=d_nb(startDate,nbDays);
    }
    $("#graphique").empty();  
    traceTasks(data,$(window).width()-$("#etapes table").width()-100,$("#etapes table").height());
    $("#text").empty();
    $("#dateDebut")
      .text(""+DT(startDate).dOpt({"day":false,"hour":false,"minute":false,"second":false,"det":false}));
    $("#text").append($("<p/>").html(introduction(nbDays,schedule[0])));
    $("#text").append($("<p/>").html(developpement(schedule.slice(1,schedule.length-1))));
    $("#text").append($("<p/>").html(conclusion(schedule[schedule.length-1],nbDays)));    
}

if (typeof module !== 'undefined' && module.exports) { // as a node module
    console.log(introduction(nbDays,schedule[0]));
    console.log(developpement(schedule.slice(1,schedule.length-1)));
    console.log(conclusion(schedule[schedule.length-1],nbDays));
} else { // called from the web page
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
}
