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

JSR.prototype.getOption=function(opt){
    const options=this.options;
    if (options==undefined || options.length==0)return undefined;
    const optRE=new RegExp(`${opt}["']\\((.*)\\)["']`);
    if (typeof options=="string"){
        const m=optRE.exec(options);
        return m==null ? undefined : m[1];
    } else {
        for (var i = 0; i < options.length; i++) {
            const m=optRE.exec(options[i]);
            return m==null ? undefined : m[1];
            
        }
    }
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

JSR.prototype.isOneOf = function(types){
    return types.indexOf(this.constName)>=0;
}

// find the index of a Constituent type (or one of the constituents) in the list of elements
JSR.prototype.getIndex = function(constNames){
    if (typeof constNames == "string")constNames=[constNames];
    return this.children.findIndex(e => e.isOneOf(constNames),this);
}

// find a given constituent type (or one of the constituent) in the list of elements
JSR.prototype.getConst = function(constNames){
    const idx=this.getIndex(constNames);
    if (idx < 0) return undefined;
    return this.children[idx]
}
// get a given constituent with a path starting at this
//   path is a list of node type , or list of node types (an empty string in this list means optional)
//   returns undefined if any node does not exist on the path
JSR.prototype.getFromPath = function(path){
    if (path.length==0) return this;
    const current=path[0];
    const c=this.getConst(current);
    if (c===undefined){
        if (typeof current == "object" && current.indexOf("")>=0 && path.length>0){// optional
            return this.getFromPath(path.slice(1));
        }
        return undefined;
    }
    return c.getFromPath(path.slice(1));
}


JSR.prototype.realize=function(){
    resetSavedWarnings();
    const expr=this.pp(0);
    const realization=eval(expr).toString();
    const warnings=getSavedWarnings();
    return [realization,warnings]
}


if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.JSR=JSR;
}