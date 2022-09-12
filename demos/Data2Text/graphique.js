//  tasks display using D3.js
import {dates,d_nb,fmtMois,tooltipText} from "./textGen-en.js";
import { isCritical } from "./pert.js";
import { tasks } from "./tasks-data.js";

export function createToolTip(sel,d){
    const g=sel.append("g").classed("tooltip",true).attr("pointer-events","none");
    const spans=[S(d.np).toString().replace(/<[^>]+>/g,""),
               tooltipText(d.duration,d.est,d.let_,isCritical(d))]
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

export function traceTasks(data,width,height){
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
              const g=createToolTip(svg,d);
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
    /// to display months in French
    const mois=["janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];
    // ajouter les axes
    const x_axis=d3.axisBottom().scale(x_scale)
          .tickFormat(function(d){return fmtMois(d.getMonth())});
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
