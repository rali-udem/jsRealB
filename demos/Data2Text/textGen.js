export {dates,d_nb,introduction,developpement,conclusion, traceTasks}

// global variables 
let dates = {// dates to initialized in building.js
    start:new Date(),
    end:new Date()
}

let work,duration;

function nvp(){return oneOf("np","vp")}

// adds a number of days to a date
function d_nb(d0,nb){
    const d=new Date(d0);
    d.setDate(d.getDate() + nb);
    return d;
}

function jour(j){
    return DT(d_nb(dates.start,j)).dOpt({"day":false,"hour":false,"minute":false,"second":false});
}

function jourMois(j){
    return DT(d_nb(dates.start,j)).dOpt({"year":false,"day":false,"hour":false,"minute":false,"second":false});
}

function fmtMois(lang,i){
    return (lang=="en" ?
        ["January","February","March","April","May","June",
            "July","August","September","October","November","December"]:
        ["janvier","février","mars","avril","mai","juin",
            "juillet","août","septembre","octobre","novembre","décembre"])[i];
}

function tooltipText(lang,duration,start,end,critical){
    if (lang=="en")
        return SP(NP(NO(duration),N("day")).a(","),
              critical?PP(P("from"),jourMois(start).dOpt({"det":false}),P("to"),jourMois(end).dOpt({"det":false})):
                       PP(P("between"),CP(C("and"),jourMois(start).dOpt({"det":false}),jourMois(end).dOpt({"det":false}))));
    return SP(NP(NO(duration),N("jour")).a(","),
        critical?PP(P("de"),jourMois(start),P("à"),jourMois(end)):
                PP(P("entre"),CP(C("et"),jourMois(start),jourMois(end))));
            
}


function realiseTaches(lang,tasks,p,f){
    // console.log("realiseTaches:",tasks[0],p)
    const res=CP(C(lang=="en"?"and":"et"));
    for (let i = 1; i < tasks.length; i++) {
        const t=tasks[i][p];
        // console.log(i,tasks[i].id);
        if (p=='vp'){ // set verb to infinitive
            tasks[i].v.t(lang=="en"?"b-to":"b");
        } 
        if (!isRunningUnderNode)
            t.tag("span",{"id":"T"+tasks[i].id});
        if(f!==undefined)tasks[i].v=f(tasks[i].v)
        res.add(t)
    }
    return res;
}

function introduction(lang,totalTime,firstTasks){
    if (lang=="en"){
        work=NP(D("the"),N("construction"),PP(P("of"),NP(D("the"),N("building"))));
        duration=NP(NO(totalTime).dOpt({nat: true}),N("day"));
        const q0=PP(P("for"),work);
        const q1=SP(Q("at least"),duration,VP(V("need").t("f"))).typ({"pas":true});
        let realisation = oneOf(
            ()=>S(q0.a(","),q1),
            ()=>S(q1.a(","),q0),
            ()=>S(duration,VP(V("be").t("f"),A("necessary"),q0))
        );
        // indiquer les tâches du début
        realisation += "\n"+oneOf(
            ()=>S(Pro("I").pe(2),
                VP(V("shall").t("ps"),Q("start"),realiseTaches(lang,firstTasks,nvp()))),
            ()=>S(Pro("I").pe(2),
                VP(V("need"),P("to"),V("start").t("b"),realiseTaches(lang,firstTasks,nvp())))
        )+"\n";
        return realisation;
    } else {
        // indiquer la durée du projet
        work=NP(D("le"),N("construction"),PP(P("de"),NP(D("le"),N("bâtiment"))));
        duration=NP(NO(totalTime).dOpt({nat: true}),oneOf(N("jour"),N("journée")));
        const q0=PP(P("pour"),V("compléter").t("b"),work);
        const q1=SP(Pro("je").pe(3).n("s"),V("falloir").t("f"),Q("au moins"),duration);
        let realisation = oneOf(
            ()=>S(q0.a(","),q1),
            ()=>S(q1.a(","),q0),
            ()=>S(duration,VP(V("être").t("f"),A("nécessaire"),q0))
        );
        // indiquer les tâches du début
        realisation += "\n"+oneOf(
            ()=>S(Pro("je").pe(3),
                VP(V("falloir"),V("commencer").t("b"),
                        PP(P("par"),realiseTaches(lang,firstTasks,nvp())))),
            ()=>S(Pro("je").n("p").pe(2),
                VP(V("devoir").t("c"),V("débuter").t("b"),
                    PP(P("par"),realiseTaches(lang,firstTasks,nvp()))))
        )+"\n";
        return realisation;
    }
}

function developpement(lang,middleTasks){
    let realisation = "";
    if (lang=="en"){
        for (let i = 0; i < middleTasks.length; i++) {
            const t = middleTasks[i];
            // console.log(t);
            const v=oneOf(
                ()=>S(jour(t[0]),
                    VP(V("be").t("f"),
                        NP(D("the"),N("start")),PP(P("of"),realiseTaches(lang,t,'np')))
                    ),
                ()=>S(oneOf(Adv("then"),P("after"),Adv("next"),Adv("afterwards")),
                    nvp()=='np'?SP(Pro("I").pe(2),VP(V("do").t("f"),realiseTaches(lang,t,'np')))
                                :SP(Pro("I").pe(2),VP(V("shall").t("ps"),realiseTaches(lang,t,'vp')))
                    ),
                ()=>S(jour(t[0]),
                    Pro("I").pe(2),
                    VP(V("shall").t("ps"),Q("prepare"),realiseTaches(lang,t,"vp"))
                    )
            );
            // console.log(v);
            realisation+=v+"\n";
        }
    } else {
        for (let i = 0; i < middleTasks.length; i++) {
            const t = middleTasks[i];
            const v=oneOf(
                ()=>S(jour(t[0]),
                      VP(V("marquer").t("f"),
                         NP(D("le"),N("début")),PP(P("de"),realiseTaches(lang,t,'np')))),
                ()=>S(oneOf(()=>C("puis"),()=>Adv("ensuite"),()=>Q("Après cela,"),()=>Q("Par la suite,")),
                      nvp()=='np'?SP(N("on"),VP(V("passer").t("f"),PP(P("à"),realiseTaches(lang,t,'np'))))
                                 :SP(Pro("je"),VP(V("falloir").t("f"),realiseTaches(lang,t,'vp')))),
                ()=>S(jour(t[0]).a(","),
                       NP(N("on")),
                       VP(V("devoir").t("c"),Q("se"),V("occuper").t("b"),
                          PP(P("de"),realiseTaches(lang,t,'vp'))))
            );
            // console.log(v);
            realisation+=v+"\n";
        }    
    }
    return realisation;
}

function conclusion(lang,lastTasks,duration){
    if (lang=="en"){
        let realisation=oneOf(
            ()=>S(oneOf(()=>Q("Finally,"),()=>Q("Lastly"),()=>Q("In conclusion,")),
                Pro("I").pe(2),VP(V("do").t("f")),realiseTaches(lang,lastTasks,'np')),
            ()=>S(Pro("I").pe(2),VP(V(oneOf("end","finish","complete")).t("f"),
                P("by"),realiseTaches(lang,lastTasks,'np'))),
            ()=>S(Pro("I").pe(2),VP(V(oneOf("end","finish","complete")).t("f"),
                P("by"),realiseTaches(lang,lastTasks,'vp',x=>x.t("pr"))))
        )+"\n";
        realisation+=S(work,VP(V("be").t("f"),V("complete").t("pp"),jour(duration)));
        return realisation+"\n";
    } else {
        let realisation=oneOf(
            ()=>S(oneOf(()=>Q("Finalement,"),()=>Q("En dernier lieu,"),()=>Q("À la fin,")),
                  N("on"),VP(V("faire").t("f")),realiseTaches(lang,lastTasks,'np')
                ),
            ()=>S(N("on"),VP(V(oneOf("terminer","finir","achever")).t("f"),
                  P("par"),realiseTaches(lang,lastTasks,nvp()))
                )
        )+"\n";
        realisation+=S(work,VP(V("compléter").t("fa").aux("êt"),jour(duration)));
        return realisation+"\n";    
    }
}

//////  Generate graphics
import { isCritical } from "./pert.js";
import { tasks } from "./tasks-data.js";

function createToolTip(sel,d,lang){
    const g=sel.append("g").classed("tooltip",true).attr("pointer-events","none");
    const spans=[S(d.np).toString().replace(/<[^>]+>/g,""),
               tooltipText(lang,d.duration,d.est,d.let_,isCritical(d))]
    const text=g.append("text").attr("fill","black")
                .text(spans[0])
                .append("tspan")
                      .text(spans[1])
                      .attr("x",0)
                      .attr("dy",15);
    // the next line should be : 
    // bbox=text.node.getBBox(); //but it only work in Chrome and Safari but not in Firefox
    const bbox= {"x":0,"y":-12,"width":text.node().getComputedTextLength(),"height":30};
    const padding = 2;
    const rect = g.insert("rect","text") // insert rectangle "under" the text
        .attr("x", bbox.x - padding)
        .attr("y", bbox.y - padding)
        .attr("rx",3).attr("ry",3)
        .attr("width", bbox.width + (padding*2))
        .attr("height", bbox.height + (padding*2))
    .attr("fill", "white").attr("stroke","black");
    return g;
}

function traceTasks(lang,data,width,height){
    const margin=20;
    const rectHeight=Math.floor(height/(1.4*data.length));
    const svg=d3.select("#graphique").append("svg");
    svg.attr("width",width+"px").attr("height",height+"px")
          .selectAll("g.task")
          .data(data)
          .enter()
          .append("g").classed("task",true);
  
    const x_extent=[dates.start,dates.end];
    const y_extent=[0,data.length];
    const x_scale = d3.scaleTime().range([margin,width-margin]).domain(x_extent);
    const y_scale = d3.scaleLinear().range([margin,height-margin]).domain(y_extent);
    d3.selectAll("g.task").each(function(d){
        const s=d3.select(this);
        const est=x_scale(d_nb(dates.start,d.est));
        const eet=x_scale(d_nb(dates.start,d.eet));
        const lst=x_scale(d_nb(dates.start,d.lst));
        const let_=x_scale(d_nb(dates.start,d.let_));
        const y=y_scale(d.index)-rectHeight;
        if (isCritical(d)){
            d.rect=s.append("rect")
                  .attr("x",est).attr("y",y).attr("width",eet-est).attr("height",rectHeight)
                  .attr("stroke","black").attr("fill","#39F")
        } else {
            const w=let_-est;
            const dur=eet-est;
            s.append("rect")
                  .attr("x",est).attr("y",y).attr("width",w).attr("height",rectHeight)
                  .attr("stroke","black").attr("fill","white");
            d.rect=s.append("rect")
                  .attr("x",est+(w-dur)/2).attr("y",y).attr("width",dur).attr("height",rectHeight)
                  .attr("stroke","black").attr("fill","#CFC");
        }
    });
    // display tooltips
    d3.selectAll("g.task")
          .on("mouseover",function(d){
              svg.select(".tooltip").remove();
              d3.selectAll("div#text span.current, td.current").classed("current",false);
              svg.selectAll("g.task rect").attr("stroke","black");
              d.rect.attr("fill","yellow");
              const g=createToolTip(svg,d,lang);
              const tooltipLength=parseFloat(g.select("rect").attr("width"));
              let x = x_scale(d_nb(dates.start,d.let_))+3;
              if (x+tooltipLength > width){
                  x=Math.max(margin+5,x_scale(d_nb(dates.start,d.est))-tooltipLength-3)
              }
              g.attr("transform","translate("+x+","+Math.max(rectHeight,y_scale(d.index)-rectHeight)+")");
              for (let i = 0; i < d.pred.length; i++) {
                  tasks[d.pred[i]].rect.attr("stroke","red").attr("stroke-width",2);
              }
              for (let i = 0; i < d.succ.length; i++) {
                  tasks[d.succ[i]].rect.attr("stroke","red").attr("stroke-width",2)
              }
              d3.select("span#T"+d.id).classed("current",true);
              d3.select("td#T_"+d.id).classed("current",true);
          })
          .on("mouseout",function(d){
              d3.select("g.tooltip").style("opacity",0);
              d3.selectAll("div#text span.current, td.current").classed("current",false);
              d.rect.attr("fill",isCritical(d)?"#39F":"#CFC");
              for (let i = 0; i < d.pred.length; i++) {
                  tasks[d.pred[i]].rect.attr("stroke","black").attr("stroke-width",1);
              }
              for (let i = 0; i < d.succ.length; i++) {
                  tasks[d.succ[i]].rect.attr("stroke","black").attr("stroke-width",1)
              }
          });
    // ajouter les axes
    const x_axis=d3.axisBottom().scale(x_scale)
          .tickFormat(function(d){return fmtMois(lang,d.getMonth())});
    d3.select("svg").append("g")
          .attr("class","x axis")
          .attr("transform","translate(0,"+(height-margin-rectHeight/2)+")")
          .call(x_axis);
    const y_axis=d3.axisLeft().scale(y_scale)
          .tickValues(d3.range(data.length))
          .tickFormat(function(v){
              return String.fromCodePoint("a".codePointAt(0)+v)
          });
    d3.select("svg").append("g")
          .attr("class","y axis")
          .attr("transform","translate("+margin+","+(-rectHeight/2)+")")
          .call(y_axis)
}
