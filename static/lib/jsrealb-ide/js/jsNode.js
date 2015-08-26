/////////
//       Arbre qui sera affiché
// noeuds de l'arbre
function Node(label,prop){
    this.label=strip(label);
    this.prop=prop;
    this.children=[];
    this.x=-1;
    this.y=-1;
}

// configuration
Node.labelHeight=18;
Node.labelFont="Arial";
Node.spaceBetweenWords=10;


Node.prototype.addChild=function(node){
    this.children.push(node);
    return this;
}

// reçoit x,y retourne le x de son dernier enfant
// remet son x au milieu de ses enfants
Node.prototype.setXY=function(x,y){
    // console.log("setXY("+this.label+":"+x+","+y+")");
    var nb=this.children.length;
    this.y=y+2*Node.labelHeight;
    this.labelWidth=Node.ctx.measureText(this.label).width;
    if(nb==0){
        this.x=x;
        return x+this.labelWidth+Node.spaceBetweenWords;
    }
    for(var i=0;i<nb;i++){
        x=this.children[i].setXY(x,this.y);
        // console.log("i="+i+";x="+x);
    }
    this.x=(this.children[0].x+this.children[nb-1].x)/2;
    return x;
}

Node.prototype.maxHeight=function(){
    var nb=this.children.length;
    if(nb==0)return this.y;
    var max=0;
    for(var i=0;i<nb;i++){
        var h=this.children[i].maxHeight();
        if(h>max)max=h;
    }
    return max;
}

Node.prototype.setLeafY=function(leafY){
    var nb=this.children.length;
    if(nb==0){
        this.y=leafY;
        return;
    }
    for(var i=0;i<nb;i++)
        this.children[i].setLeafY(leafY);
}

var ignoredProps={defaultCons:true,defaultCoo:true,c:true,ro:true,noDetHead:true};

Node.prototype.showProp=function(){
    // PAUL : OUT on 2015-07-14
//    if(this.prop!=undefined){
//        var res="";
//        for(var i in this.prop){
//            if(!ignoredProps[i])
//                res+=i+":"+this.prop[i]+" ";
//        }
//        return res;
//    }
    return null;
}

Node.prototype.drawNode=function(){
    var ctx=Node.ctx;
    var nb=this.children.length;
    for(var i=0;i<nb;i++){
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.children[i].x,this.children[i].y);
        ctx.stroke();
        this.children[i].drawNode()
    }
    var x=this.x-(nb==0?3:this.labelWidth/2);
    ctx.clearRect(x-3,this.y-Node.labelHeight/2,this.labelWidth+6,Node.labelHeight+3);
    ctx.fillStyle=nb==0?"#036A07":"#0000FF";
    ctx.fillText(this.label,x,this.y+Node.labelHeight/2);
    var props=this.showProp();
    if(props && props.length>0){
        var saveFont=ctx.font;
        ctx.font="12px "+Node.labelFont;
        ctx.fillText(props,x+this.labelWidth,this.y);
        ctx.font=saveFont;
    }
}

//  hack tiré de http://css-tricks.com/snippets/javascript/strip-html-tags-in-javascript/
function strip(html){
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText;
}

// fonctions globales
pprint=function(node,level){
    if(level==undefined)level=0;
    if(node==null)return;
    var res="";
    var l=node.label
          /*+"{"+Math.floor(this.x)+"@"+Math.floor(this.y)+":"+Math.floor(this.labelWidth)+"}"*/
          ;
    res+=l;
    if(node.children.length>0){
        res+="[";
        level+=l.length+1;
        for(var i=0;i<node.children.length;i++){
            res+=pprint(node.children[i],level);
            if(i<node.children.length-1){//ne pas sauter de ligne pour le dernier
                res+="\n"+new Array(level+1).join(' ');// fin de ligne avant une ligne de "level" blancs
            }
        }
        res+="]";
    }
    return res;
}

function clearCanvas(){
    Node.ctx.clearRect(0,0,Node.ctx.canvas.width,Node.ctx.canvas.height);    
}

function layout(tree){
    if(tree==null)return;
    tree.setXY(20,0);
    // console.log(pprint(tree));
    tree.setLeafY(tree.maxHeight());
    tree.drawNode();    
}

function parseNode(tkr){
    var n;
    // console.log("parseNode0:",tkr.toString());
    if(tkr.token.type==Token.END_INPUT)return null;
    if(tkr.token.type==Token.IDENTIFIER){
        n=new Node(tkr.token.val);
        tkr.next();
        if(tkr.token.type==Token.SYM && tkr.token.val=="("){
            tkr.next();
            if(tkr.token.type==Token.SYM && tkr.token.val==")")// constructeur vide
                tkr.next();
            else 
                while(true){
                    n.addChild(parseNode(tkr));
                    if(tkr.token.type==Token.SYM){
                        if(tkr.token.val==",") {
                            tkr.next();
                        } else if (tkr.token.val==")"){
                            tkr.next();
                            break;
                            } else
                            error(tkr,"Comma or right parenthesis expected but found");
                        } else if(tkr.token.type==Token.END_INPUT){
                            return n;
                        } else {
                            error(tkr,"Symbol expected but found");
                        }
                    }
                }
        // console.log("parseNode1:",tkr.toString()); 
        while (tkr.token.type==Token.SYM && tkr.token.val=="."){// ignorer les appels de type .id(...)
            tkr.next();
            if(tkr.token.type==Token.IDENTIFIER){
                tkr.next();
                if(tkr.token.type==Token.SYM && tkr.token.val=="("){
                    tkr.next();
                    if(tkr.token.type==Token.END_INPUT)return n;
                    var parLevel=1;
                    while(parLevel>0){
                        if(tkr.token.type==Token.SYM){
                            if(tkr.token.val=="(")parLevel++;
                            else if(tkr.token.val==")")parLevel--;
                        }
                        tkr.next();
                        if(tkr.token.type==Token.END_INPUT)return n;
                    }
                }
            } else
                error(tkr,"Identifier expected after a period");
        }
        return n; 
    } else {
        error(tkr,"Identifier expected but found");
    }
}

function error(tkr,mess){
    console.log(mess+":"+tkr.token.toString()+"\n"+tkr.toString());
    throw "erreur d'analyse";
}

function parse(str){
    try {
        var tkr=new Tokenizer(str);
        return parseNode(tkr);
    } catch (e){
        return null;
    }
}

// constructeurs simplifiés pour tester
// non-terminal
function n(label){
    var node = new Node(label);
    for(var i=1;i<arguments.length;i++)
        node.addChild(arguments[i]);
    return node;
}
// terminal
function t(label,str){
    return new Node(label).addChild(new Node(str));
}

testT=n("S",n("NP",t("Det","le"),t("N","chat")),
           n("VP",t("V","mange"),
                  n("PrepP",t("Prep","avec"),
                            n("NP",t("Det","la"),
                                   t("N","fourchette"))),
                  n("NP",t("Det","la"),t("N","souris")))
           );


/********************************************************
 grammaire "très" simplifiée d'une expression javascript qui ne sert qu'à
   déterminer l'indentation
     attention: on suppose l'expression syntaxiquement correcte

 terme = ["new"] IDENTIFIER ["(" expr-list  ")"] | numeric | "(" expression ")" |
         "[" expr-list "]" | "{" expr-list "}" | ("+"|"-") terme
 expression = terme (OPERATOR expression)*
 expr-list = expression ("," expression)*
**********************************************************/
var trace_indent=0;
function indent(tkr){
    // le contexte est la chaîne indentée jusqu'ici et le niveau courant d'indentation
    function next(ctx){
        ctx.res+=tkr.token.val;
        ctx.level+=tkr.token.val.length;
        tkr.next();
        return ctx;
    }
    
    function terme (ctx){
        if(trace_indent)console.log("terme:"+tkr.token+":"+ctx.level);
        if(tkr.token.type==Token.END_INPUT)return ctx;
        if(tkr.token.type==Token.IDENTIFIER){
            if(tkr.token.val=="new"){
                ctx=next(ctx);
                if(tkr.token.type!=Token.IDENTIFIER)
                    error(tkr,"Identifier expected");
            }
            ctx=next(ctx);
            if (tkr.token.type==Token.SYM && tkr.token.val=="("){
                ctx=next(ctx);
                if(tkr.token.type!=Token.SYM || tkr.token.val!=")"){
                    ctx=expr_list(ctx);
                    if(tkr.token.type!=Token.SYM||tkr.token.val!=")")
                        error(tkr,"Closing parenthesis expected");
                }
                ctx=next(ctx);
            }
        } else if (tkr.token.type==Token.NUMBER || tkr.token.type==Token.STRING){
            ctx=next(ctx);
        } else if (tkr.token.type==Token.SYM) {
            if(tkr.token.val=="("){
                ctx=next(ctx);
                ctx=expression(ctx);
                if(tkr.token.type!=Token.SYM||tkr.token.val!=")")
                    error(tkr,"Closing parenthesis expected");
                ctx=next(ctx);
            } else if (tkr.token.val=="["){
                ctx=next(ctx);
                ctx=expr_list(ctx);
                if(tkr.token.type!=Token.SYM||tkr.token.val!="]")
                    error(tkr,"Closing bracket expected");
                ctx=next(ctx);                
            } else if (tkr.token.val=="{"){
                ctx=next(ctx);
                ctx=expr_list(ctx);
                if(tkr.token.type!=Token.SYM||tkr.token.val!="}")
                    error(tkr,"Closing brace expected");
                ctx=next(ctx);                
            } else
                error(tkr,"Illegal symbol")
        } else if (tkr.token.type=Token.OPERATOR && ("+-".indexOf(tkr.token.val)>=0)) {
            ctx=next(ctx);
            ctx=terme(ctx);
        } else
            error(tkr,"Illegal terme start");
        return ctx;
    }
    
    function expression(ctx){
        if(trace_indent)console.log("expression:"+tkr.token.val+":"+ctx.level);
        ctx=terme(ctx);
        while (tkr.token.type==Token.OPERATOR){
            ctx=next(ctx);
            ctx=expression(ctx);
        }
        return ctx;
    }
    
    function expr_list(ctx){
        if(trace_indent)console.log("expr_list:"+tkr.token.val+":"+ctx.level);
        var level=ctx.level;
        ctx=expression(ctx);
        while (tkr.token.type==Token.SYM && tkr.token.val==","){
            ctx=next(ctx);
            ctx=expression({res:ctx.res+"\n"+new Array(level+1).join(" "),level:level});
        }
        return ctx;
    }
    
    return expr_list({res:"",level:0}).res;
}

function showIndent(str){
    try {
        var tkr=new Tokenizer(str);
        return indent(tkr);
    } catch (e){
        return null;
    }
}