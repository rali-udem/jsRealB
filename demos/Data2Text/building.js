if (typeof module !== 'undefined' && module.exports) {
    // eval exports of file in the global namespace
    function evalExports(file){
        let f=require(file);
        for (let v in f){
            eval(v+"= f."+v);
        }
    }
    evalExports("../../dist/jsRealB-dmefr.min.js");
    evalExports(__dirname+"/pert.js");
    evalExports(__dirname+"/tasks-data.js");
    evalExports(__dirname+"/tasks-en.js");
    evalExports(__dirname+"/textGen-en.js");
}

function jour(j){
    return DT(d_nb(startDate,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(startDate,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

/// start processing
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
}