function Task(id,duration,precedes,np,vp){
    this.id=id;
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

// get a new date nb days from d0
function d_nb(d0,nb){
    var d=new Date(d0);
    d.setDate(d.getDate() + nb);
    return d;
}

// for adding description 
function addNPVP(tasks,id,np,vvp){
    tasks[id].np=np;
    tasks[id].v=vvp[0];
    tasks[id].vp=vvp[1];
}
// Display activities

// needed because node.js does not provide good formatting functions
function fill(val,width){
    if (val==null) return "null".padStart(width);
    return val.toString().padEnd(width);
}
function fillSt(val,width){
    if (val==null) return "null".padStart(width);
    return val.toString().padStart(width);
}
function f5(val){return fillSt(val,5)};

function showTasks(tasks,titre){
    console.log(titre)
    console.log("id:  pred  :  succ  : dur :level: EST : LST : EET : LET :"+(tasks[0].np?"  Réalisations":""));
    for (var it in tasks) {
        var t=tasks[it];
        if (t.np){
            console.log(" %s:%s:%s:%s:%s:%s:%s:%s:%s:%s | %s",
                    t.id,fill(t.pred,8),fill(t.succ,8),f5(t.duration),f5(t.level),f5(t.est),f5(t.lst),f5(t.eet),f5(t.let),
                    fill(t.np,40),t.vp.t("b"));
        } else {
            console.log(" %s:%s:%s:%s:%s:%s:%s:%s:%s:%s",
                    t.id,fill(t.pred,8),fill(t.succ,8),f5(t.duration),f5(t.level),f5(t.est),f5(t.lst),f5(t.eet),f5(t.let));
        }
    }
    console.log("--")
}

function showSchedule(groups){
    for (var i = 0; i < groups.length; i++) {
        var g=groups[i];
        var desc=[];
        for (var j = 1; j < g.length; j++) {
            desc.push(g[j].np);
        }
        console.log("%s:%s",f5(g[0]),desc);
    }
}

//  PERT computation loosely inspired by https://gist.github.com/perico/7790396

// add pred links to all links
function addPredecessors(tasks){
    var ids=Object.keys(tasks);
    for (var idT in tasks){
        var t=tasks[idT]
        for (s in t.succ){
            tasks[t.succ[s]].pred.push(idT);
        }
    }
}

// find task ids with no successors
function findSourcesSinks(tasks){
    var sources=[];
    var sinks=[]
    for (var idT in tasks){
        var t=tasks[idT];
        if (t.pred.length==0)
            sources.push(idT);
        if (t.succ.length==0)
            sinks.push(idT);
    }
    return [sources,sinks];
}
// set the Earliest (Start|End) Time
function setEST(n,tasks){
    // console.log("setEST(%s)",n)
    var current=tasks[n];
    var newEST=current.est+current.duration;
    for (var i = 0; i < current.succ.length; i++) {
        var s=current.succ[i];
        // console.log("s=%s",s);
        var next=tasks[s];
        if (next.est==null || next.est<newEST) {
            next.est=newEST;
            next.eet=newEST+next.duration;
        }
        setEST(s,tasks); 
    }
}
// set the Latest (End|Start) Time
function setLET(n,tasks){
    var current=tasks[n];
    var newLET=current.let-current.duration;
    for (var i = 0; i < current.pred.length; i++) {
        var s=current.pred[i];
        // console.log("s=%s",s);
        var next=tasks[s];
        if (next.let==null || next.let>newLET) {
            next.let=newLET;
            next.lst=newLET-next.duration;
        }
        setLET(s,tasks); 
    }    
}

function updateLevel(n,tasks){
    var current=tasks[n];
    var currentLevel=current.level;
    for (var i = 0; i < current.succ.length; i++) {
        var s=current.succ[i];
        tasks[s].level=Math.max(currentLevel+1,tasks[s].level);
        updateLevel(s,tasks);
    }
}

function pert(tasks){
    // console.log(tasks);
    startDay=0;
    addPredecessors(tasks);
    // showTasks("Tâches initiales");
    var sources,sinks;
    [sources,sinks]=findSourcesSinks(tasks);
    for (var i = 0; i < sources.length; i++) {
        var s=sources[i];
        tasks[s].est=startDay;
        tasks[s].eet=tasks[s].duration;
        setEST(s,tasks);
        updateLevel(s,tasks);
    }
    // showTasks("Tâches avec Early Start et End");
    // find lastDay
    lastDay=startDay;
    for (var i = 0; i < sinks.length; i++) {
        var s=sinks[i];
        if (tasks[s].eet>lastDay)lastDay=tasks[s].eet;
    }
    // console.log("lastDay="+lastDay);
    for (var i = 0; i < sinks.length; i++) {
        var s=sinks[i];
        tasks[s].let=lastDay;
        tasks[s].lst=lastDay-tasks[s].duration;
        setLET(s,tasks)
    }
}

function isCritical(task){
    return task.est==task.lst;
}

function criticalPath(tasks){
    critiques=[];
    for (var it in tasks){
        var t=tasks[it]
        if (isCritical(t))critiques.push(it)
    }
    return critiques;
}

function computeSchedule(tasks){
    var es=Object.entries(tasks);
    es.sort(function(e1,e2){return e1[1].est-e2[1].est});
    var groups=[]; 
    var current=null;
    var lastGroup=-1;
    for (var i = 0; i < es.length; i++) {
        var est=es[i][1].est;
        if (est!=current){
            lastGroup+=1;
            current=est;
            groups.push([est,es[i][1]]);
        } else {
            groups[lastGroup].push(es[i][1]);
        }
    }
    return groups
}

function totalTime(tasks){
    return Math.max(... Object.values(tasks).map(function(t){return t.eet}))
}

///// for the node.js module
if (typeof module !== 'undefined' && module.exports) {
    exports.Task=Task;
    exports.addNPVP=addNPVP;
    exports.showTasks=showTasks;
    exports.showSchedule=showSchedule;
    exports.pert=pert;
    exports.isCritical=isCritical;
    exports.criticalPath=criticalPath;
    exports.computeSchedule=computeSchedule;
    exports.totalTime=totalTime;
}
