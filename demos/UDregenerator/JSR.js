if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    //  load JSrealB
    var jsrealb=require('../../dist/jsRealB-node.js');
    // eval exports 
    for (var v in jsrealb){
        eval("var "+v+"=jsrealb."+v);
    }
    var utils=require('./utils.js');
    fixPunctuation=utils.fixPunctuation;
}

function JSR(constName,children,options){
    this.constName=constName;
    this.children=children===undefined ? [] : children;
    if (options===undefined)
        this.options=[];
    else
        this.options=typeof options == "string"?[options]:options;
}

JSR.prototype.addChildren=function(newChildren){
    if (Array.isArray(newChildren))
        appendTo(this.children,newChildren);
    else
        this.children.push(newChildren);
    return this;
}

JSR.prototype.addOptions=function(newOptions){
    if (newOptions.length==0)return this;
    if (typeof newOptions == "string")
        this.options.push(newOptions);
    else
        appendTo(this.options,newOptions);
    return this;
}

JSR.prototype.options2string = function(){
    return this.options.map(o=>"."+o).join("");
}

JSR.prototype.pp = function(indent){
    indent=indent || 0;
    let res;
    if (this.isTerminal())
        res =`${this.constName}("${this.children}")`;
    else if (typeof this.children == "number")
        res =`${this.constName}(${this.children})`;
    else {
        indent=indent+this.constName.length+1;
        const cpp=this.children.map(c=>c.pp(indent))
        res =`${this.constName}(${cpp.join(",\n"+Array(indent).fill(" ").join(""))})`;
    }
    return res+this.options2string();
}

JSR.prototype.isA = function(c){
    return this.constName==c;
}

JSR.prototype.isTerminal = function(){
    return typeof this.children == "string";
}

JSR.prototype.realize=function(){
    resetSavedWarnings();
    const expr=this.pp(0);
    const realization=eval(expr).toString();
    const warnings=getSavedWarnings();
    if (warnings.length>0)
        return warnings;
    else
        return fixPunctuation(realization);
}


if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.JSR=JSR;
}