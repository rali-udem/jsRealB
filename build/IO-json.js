/**
    jsRealB 3.3
    Guy Lapalme, lapalme@iro.umontreal.ca, April 2020
 */
"use strict";

/// Functions for dealing with JSON input

// list of names of constituents (used in fromJSON)
const terminals = ["N", "A", "Pro", "D", "V", "Adv", "C", "P", "DT", "NO", "Q"];
const phrases   = ["S", "NP", "AP", "VP", "AdvP", "PP", "CP", "SP"];

// create expression from a JSON structure
function fromJSON(json,lang){
    if (typeof json == "object" && !Array.isArray(json)){
        if (json["lang"]){
            if (json["lang"]=="en")     lang="en";
            else if (json["lang"]=="fr")lang="fr";
            else {
                console.log("FromJSON: lang should be 'en' or 'fr', not "+json["lang"]+" 'en' will be used");
                lang="en";
            }
        }
        let lang1 = lang || currentLanguage ;
        if ("phrase" in json) {
            const constType=json["phrase"];
            if (contains(phrases,constType)){
                return Phrase.fromJSON(constType,json,lang1)
            } else {
                console.log("fromJSON: unknown Phrase type:"+constType)
            }
        } else if ("terminal" in json){
            const constType=json["terminal"];
            if (contains(terminals,constType)){
                return Terminal.fromJSON(constType,json,lang1)
            } else {
                console.log("fromJSON: unknown Terminal type:"+constType)
            }
        }
    } else {
        console.log("fromJSON: object expected, but found "+typeof json+":"+JSON.stringify(json))
    }
}

///  Create constituents from JSON
// add properties using the usual functions that test their input...
function setJSONprops(constituent,json){
    if ("props" in json){
        const props=json["props"];
        for (let opt in props){
            if (opt in Constituent.prototype){
                if (Array.isArray(props[opt])){ // deal with a list of options
                    props[opt].forEach(o=>Array.isArray(o)
                        ? Constituent.prototype[opt].apply(constituent,o)
                        : Constituent.prototype[opt].call(constituent,o))
                } else 
                    Constituent.prototype[opt].call(constituent,props[opt])
            } else {
                console.log("Terminal.fromJSON: illegal prop:"+opt);
            }
        }
    }
}


Phrase.fromJSON = function(constType,json,lang){
    if ("elements" in json){
        const elements=json["elements"];
        if (Array.isArray(elements)){
            const args=elements.map(json => fromJSON(json,lang));
            let phrase=new Phrase(args,constType,lang);
            setJSONprops(phrase,json);
            return phrase;
        } else {
            console.log("Phrase.fromJSON: elements should be an array:"+JSON.stringify(json))
        }
    } else {
        console.log("Phrase.fromJSON: no elements found in "+JSON.stringify(json))
    }
}

Terminal.fromJSON = function(constType,json,lang){
    if ("lemma" in json){
        const lemma=json["lemma"];
        let terminal=new Terminal([lemma],constType,lang);
        setJSONprops(terminal,json)
        return terminal;
    } else {
        console.log("Terminal.fromJSON: no lemma found in "+JSON.stringify(json));
    }
}


// create the JSON form  
Phrase.prototype.toJSON = function(){
    let res={phrase:this.constType, elements:this.elements.map(e=>e.toJSON())};
    if (Object.keys(this.props).length>0) // do not output empty props
        res.props=this.props;
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

Terminal.prototype.toJSON = function(){
    let res={terminal:this.constType,lemma:this.lemma};
    if (Object.keys(this.props).length>0) // do not output empty props
        res.props=this.props;
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

// compact pretty-print of json (JSON.stringify(.,null,n) is hard to work with as it uses too many lines)
//  adaptation of ppJson.oy (in project json-rnc)
//  only useful for debugging, not necessary for using jsRealB
function ppJSON(obj,level,str){
    function out(s){str+=s}
    function outQuoted(s){
        if (s.indexOf('\\')>=0)s=s.replace(/\\/g,'\\\\');
        if (s.indexOf('"' )>=0)s=s.replace(/"/g,'\\"');
        out('"'+s+'"');
    }
    switch (arguments.length) {
    case 1:return ppJSON(obj,0,"");
    case 2:return ppJSON(obj,level,"");
    default:
        switch (typeof obj) {
        case "string":
            outQuoted(obj);
            break;
        case "object":
            if (obj===null){
                out("null")
            } else if (Array.isArray(obj)){
                out('[');
                const n=obj.length;
                // indent only if one of the elements of the array is an object != null 
                const indent = obj.some((e)=>typeof e == "object" && e!==null)
                for (var i = 1; i <= n; i++) {
                    const elem=obj[i-1];
                    if (indent && i>1)out("\n"+" ".repeat(level+1));
                    out(ppJSON(elem,level+1,""));
                    if (i<n)out(",")
                }
                out(']');
            } else {
                out('{');
                const keys=Object.keys(obj);
                const n=keys.length;
                for (var i = 1; i <= n; i++) {
                    const key=keys[i-1];
                    if (i>1)out("\n"+" ".repeat(level+1));
                    outQuoted(key);
                    out(":");
                    out(ppJSON(obj[key],level+1+key.length+3,""));
                    if (i<n)out(",")
                }
                out('}');
            }
            break;
        default: // primitive JavaScript values : boolean, number, string
            out(obj);
        }
    }
    return str;
}


