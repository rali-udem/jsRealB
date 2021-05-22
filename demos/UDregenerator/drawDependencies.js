///////// Draw the sentence at the bottom of the display

// these variables could be local, but it is convenient to have them globally for inspecting them in the debugger
var dependencies,tree,groups; 

var depsInfo;
var svg, display;
var startX=10,startY; // updated later
var deltaDependencies=15; // spacing between links in dependency 
var deltaTree=50;         // spacing between lines in the tree representation
var wordSpacing=5;        // space between words of the sentence
var letterSpacing=0;      // space within words

//  Styling is done within the program to make the export independent of an external CSS
var fontFamilyWord="Times New Roman";
var fontSizeWord="12pt";
var fontFamilyLabel="Times New Roman";
var fontSizeLabel="10pt";
var lineHeight=13; // reset at the start of the program

// draw a word at x,y and return its length in the drawing
function addWord(display,i,x,y,mot,tooltip,isRoot,isDiff){
    var word=display.append("text")
        .attr("x",x).attr("y",y)
        .attr("fill",isRoot?"red":"black")
        .attr("stroke","none")
        .attr("dominant-baseline","hanging")
        .attr("font-family",fontFamilyWord)
        .attr("font-size",fontSizeWord)
        .attr("letter-spacing",letterSpacing+"px")
        .attr("cursor","pointer")
        .text(mot);
    if (i!=null)word
        .on("click",function(){
                const tr=d3.selectAll("#tokens tbody tr").nodes()[i-1]
                selectRow(tr);
                tr.scrollIntoView(false);
            });
    if (isDiff){
        word.attr("text-decoration","underline overline")
            // .attr("text-decoration-color","blue")    // does not work in Safari...
            // .attr("text-decoration-style","double")
    }
    // var wordLength=word.node().getComputedTextLength();
    var wordLength=word.node().getBBox().width; // so that letter-spacing is taken into account
    word.append("title").text(tooltip) 
    return wordLength;
}

function drawSentence(display,ud){
    var endX=startX;
    // draw the words of the sentence and update width and x in deps
    for (var i = 1; i < ud.nodes.length; i++) {
        var udn=ud.nodes[i];
        var width=addWord(display,i,endX,startY,udn.form,
                         `${udn.id} ${udn.lemma} ${udn.upos} ${udn.options2feats(udn.feats)}`,
                          i==ud.root.id,udn.form!=ud.tokens[i]);
        udn.x=endX;
        udn.width=width;
        udn.mid=endX+width/2;
        endX+=width+wordSpacing;
    }
    return endX;
}

// common drawing functions

// add a label centered at x,y with a white background
function addLabel(display,x,y,label){
    const text = display.append("text")
        .attr("x",x).attr("y",y)
        .attr("fill","green")
        .attr("stroke","none")
        .attr("text-anchor","middle")
        .attr("dominant-baseline","middle")
        .attr("font-family",fontFamilyLabel)
        .attr("font-size",fontSizeLabel)
        .text(label)
    // add white box "behind the text" (using insert) to simulate text-background
    const textBBox=text.node().getBBox();
    const rect= display.insert("rect","text:last-child")
        .attr("x",textBBox.x)
        .attr("y",textBBox.y)
        .attr("width",textBBox.width)
        .attr("height",textBBox.height)
        .attr("fill","white");
    return text;    
}

/////////// drawing of the linked structure
       
// add dependency link between positions x1,y and x2,y at height h with the label 
function addDep(display,x1,x2,y,h,label){
    // console.log("addDep(%o,%o):%s",x1,x2,label);
    var dx=10;
    var dx2=2*dx;
    var sign,l,d;
    if (x1<x2){
        sign='' ;l=x2-x1-dx2;
    } else {
        sign='-';l=x2-x1+dx2;
    }
    d=`M${x1},${y} v -${h-dx} q0,-${dx} ${sign}${dx},-${dx} l${l},0 q${sign}${dx},0 ${sign}${dx},${dx} v${h-dx}`;
    // add arrow
    display.append("path")
        .attr("d",d)
        .attr("fill","none")
        .attr("stroke","black")
        .attr("stroke-width","1")
        .attr("marker-end","url(#arrow)");
    // add name of dependency (label)
    addLabel(display,(x2+x1)/2,y-h,label);
}

// add a dependency between two words
//    the w1 (the source) is put at a given proportion in the left or right middle part of the width of the word
//    the w2 (the target) is at the middle of the word
function addDepWord(display,isToLeft,prop,w1,w2,h,label){
    var x1=isToLeft?w1.x+w1.width/2*prop
                   :w1.x+w1.width-w1.width/2*prop;
    addDep(display,x1,w2.mid,startY,h,label);
}

// draw dependencies by recursively going through the dependencies starting from the head
function drawDependencies(display,head){
    var leftH=0;
    var lchildren=head.left;
    // must go through the left children in reverse
    for (var i = lchildren.length - 1; i >= 0; i--) {
        var c=lchildren[i]
        var h=drawDependencies(display,c);
        leftH=Math.max(h.right,leftH)+deltaDependencies;
        addDepWord(display,true,1-(i+1)/(lchildren.length+1),head,c,leftH,c.deprel)
        leftH=Math.max(h.left,leftH);// insure to go over the arcs between the c and the next level
    }
    var rightH=0;
    var rchildren=head.right;
    for (var i = 0; i < rchildren.length; i++) {
        var c=rchildren[i];
        var h=drawDependencies(display,c);
        rightH=Math.max(h.left,rightH)+deltaDependencies;
        addDepWord(display,false,(i+1)/(rchildren.length+1),head,c,rightH,c.deprel);
        rightH=Math.max(h.right,rightH)// insure to go over the arcs between the c and the next level
    }
    return {left:leftH,right:rightH};
}

function showDependencies(ud,genTokens){
    var svg=d3.select("svg#dependencies");
    startY=parseInt(svg.attr("height"))-deltaDependencies;
    display=svg.select("g");
    display.selectAll("*").remove();
    var endX=drawSentence(display,ud);
    svg.attr("width",endX+startX); // update width of the drawing
    // draw the dependencies
    var leftRightH=drawDependencies(display,ud.root);
    // update heigth of the drawing
    var h=Math.max(leftRightH.left,leftRightH.right);
    svg.attr("height",h+2*deltaDependencies+5);
    display.attr("transform",`translate(0 ${deltaDependencies-(startY-h)})`)
}

/////////// drawing of the tree representation

// recursively set the Y value for the tree representation
function setY(head,y){
    head.y=y;
    var maxY=y;
    var children=head.left;
    head.left.forEach(function(c){
        maxY=Math.max(maxY,setY(c,y+deltaTree));
    })
    head.right.forEach(function (c) {
        maxY=Math.max(maxY,setY(c,y+deltaTree));
    })
    return maxY;
}

function drawTree(display,root){
    var x1=root.mid
    var y1=root.y;
    var x2=x1;
    var y2=startY;
    function drawChildren(c,i,arr){ // default parameters set by forEach
        var x2=c.mid;
        var y2=c.y;
        display.append("line")
            .attr("x1",x1).attr("y1",y1).attr("x2",x2).attr("y2",y2)
            .attr("fill","none")
            .attr("stroke","black")
            .attr("stroke-width","1")
        ;
        var prop=(i+1)/(arr.length+1);
        addLabel(display,x1+(x2-x1)*prop,y1+(y2-y1)*prop,c.deprel)
        drawTree(display,c);
    }
    // line up to the word
    display.append("line")
        .attr("x1",root.mid).attr("y1",y1).attr("x2",x2).attr("y2",y2)
        .attr("fill","none")
        .attr("stroke","black")
        .attr("stroke-width","1")
        .attr("stroke-dasharray","1")
    root.left.forEach(drawChildren);
    root.right.forEach(drawChildren);
    display.append("circle")
        .attr("cx",x1).attr("cy",y1).attr("r",3).attr("fill","black")
        .append("title").text(root.id)
}

function showTree(ud){
    startY=setY(ud.root,10);
    var svg=d3.select("svg#tree");
    display=svg.select("g");
    display.selectAll("*").remove();
    svg.attr("height",startY+20); // update height of the drawing
    var endX=drawSentence(display,ud);
    svg.attr("width",endX+startX); // update width of the drawing
    drawTree(display,ud.root);
}

