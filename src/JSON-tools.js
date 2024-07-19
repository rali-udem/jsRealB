/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
 */

import { Constituent} from "./Constituent.js";
import {Terminal, Terminal_en, Terminal_fr, Phrase, Phrase_en, Phrase_fr, Dependent, Dependent_en, Dependent_fr} from "./jsRealB.js"
export {fromJSON,ppJSON}

/// Functions for dealing with JSON input

// list of names of constituents (used in fromJSON)
const terminals = ["N", "A", "Pro", "D", "V", "Adv", "C", "P", "DT", "NO", "Q"];
const phrases   = ["S", "NP", "AP", "VP", "AdvP", "PP", "CP", "SP"];
const dependents = ["root", "det", "subj", "comp", "mod", "coord"];

/**
 * Create a Constituent from a parsed JSON structure
 * <a href="http://rali.iro.umontreal.ca/JSrealB/current/data/jsRealB-jsonInput.html">more info</a>
 * @param {Object} json to convert
 * @param {"en"|"fr"} lang language for this object 
 * @returns Constituent corresponding to the JSON structure 
 */
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
        if ("phrase" in json) {
            const constType=json["phrase"];
            if (phrases.includes(constType)){
                return Phrase.fromJSON(constType,json,lang)
            } else {
                console.log("fromJSON: unknown Phrase type:"+constType)
            }
        } else if ("dependent" in json) {
            const constType=json["dependent"];
            if (dependents.includes(constType)){
                return Dependent.fromJSON(constType,json,lang)
            } else {
                console.log("fromJSON: unknown Phrase type:"+constType)
            }
        } else if ("terminal" in json){
            const constType=json["terminal"];
            if (terminals.includes(constType)){
                return Terminal.fromJSON(constType,json,lang)
            } else {
                console.log("fromJSON: unknown Terminal type:"+constType)
            }
        }
    } else {
        console.log("fromJSON: object expected, but found "+typeof json+":"+JSON.stringify(json))
    }
}

/**
 * Add properties to the current object from the information in the JSON object
 * It applies the "usual" jsRealB options
 * @param {Object} json 
 * @returns this object
 */
Constituent.prototype.setJSONprops = function(json){
    if ("props" in json){
        const props=json["props"];
        for (let opt in props){
            if (opt in this){
                if (Array.isArray(props[opt])){ // deal with a list of options
                    props[opt].forEach(o=>Array.isArray(o)
                        ? Constituent.prototype[opt].apply(this,o)
                        : Constituent.prototype[opt].call(this,o))
                } else 
                    Constituent.prototype[opt].call(this,props[opt])
            } else if (!["pat","h","cnt"].includes(opt)){ // do not copy properties from Terminal bia the lexicon
                console.log("Constituent.fromJSON: illegal prop:"+opt);
            }
        }
    }
    return this
}

/**
 * Transform a JSON object into a Phrase
 * @param {String} constType kind of Phrase to create
 * @param {Object} json JSON object to transform
 * @param {string?} lang optional language
 * @returns new Phrase corresponding to the fields of the JSON object
 */
Phrase.fromJSON = function(constType,json,lang){
    if ("elements" in json){
        const elements=json["elements"];
        if (Array.isArray(elements)){
            const args=elements.map(json => fromJSON(json,lang));
            return (lang=="en" ? new Phrase_en(args,constType,"en")
                               : new Phrase_fr(args,constType,"fr")).setJSONprops(json);
        } else {
            console.log("Phrase.fromJSON: elements should be an array:"+JSON.stringify(json))
        }
    } else {
        console.log("Phrase.fromJSON: no elements found in "+JSON.stringify(json))
    }
}

/**
 * Transform a JSON object into a Dependent
 * @param {String} constType kind of Dependent to create
 * @param {Object} json JSON object to transform
 * @param {string?} lang optional language
 * @returns new Dependent corresponding to the fields of the JSON object
 */
 Dependent.fromJSON = function(constType,json,lang){
    if (!("terminal" in json)){
        console.log("Dependent.fromJSON: no terminal found in Dependent:"+JSON.stringify(json));
    } else {
        if ("dependents" in json){
            const dependents=json["dependents"];
            if (Array.isArray(dependents)){
                let args=dependents.map(json => fromJSON(json,lang));
                args.unshift(fromJSON(json["terminal"],lang));
                return (lang=="en" ? new Dependent_en(args,constType,"en")
                                   : new Dependent_fr(args,constType,"fr")).setJSONprops(json);
            } else {
                console.log("Dependent.fromJSON: dependents should be an array:"+JSON.stringify(json))
            }
        } else {
            console.log("Dependent.fromJSON: no dependents found in "+JSON.stringify(json))
        }
    }
}

/**
 * Create a Terminal from a JSON representation
 * @param {string} constType type of Terminal to create
 * @param {Object} json json Object to transform
 * @param {"en"|"fr"} lang language for this Terminal
 * @returns Terminal
 */
Terminal.fromJSON = function(constType,json,lang){
    if ("lemma" in json){
        return (lang=="en" ? new Terminal_en([json["lemma"],"en"],constType)
                           : new Terminal_fr([json["lemma"],"fr"],constType)).setJSONprops(json);
    } else {
        console.log("Terminal.fromJSON: no lemma found in "+JSON.stringify(json));
    }
}

function addJSONprops(obj,res){
    let props = Object.keys(obj.props)
    if (props.length==0)return res;
    res.props={}
    for (let prop of props){
        if (prop == "own"){
            res.props["ow"]=obj.props["own"]
        } else {
            res.props[prop]=obj.props[prop]
        }
    }
    return res
}

/**
 * Create an Object with appropriate fields for JSON input
 * @returns an Object which can be serialized as a JSON object
 */
Phrase.prototype.toJSON = function(){
    let res={phrase:this.constType, elements:this.elements.map(e=>e.toJSON())};
    // if (Object.keys(this.props).length>0) // do not output empty props
    //     res.props=this.props;
    res=addJSONprops(this,res)
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

/**
 * Create an Object with appropriate fields for JSON input
 * @returns an Object which can be serialized as a JSON object
 */
Dependent.prototype.toJSON = function (){
    let res={dependent:this.constType, 
                terminal: this.terminal.toJSON()};
    if (this.dependents)
        res["dependents"]=this.dependents.map(e=>e.toJSON());
    // if (Object.keys(this.props).length>0) // do not output empty props
    //     res.props=this.props;
    res=addJSONprops(this,res)
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

/**
 * Create an object that can be serialized as a JSON object with fields terminal and lemma
 * @returns Object with the appropriate JSON fields corresponding to this Terminal
 */
Terminal.prototype.toJSON = function(){
    let res={terminal:this.constType,lemma:this.lemma};
    // if (Object.keys(this.props).length>0) // do not output empty props
    //     res.props=this.props;
    res=addJSONprops(this,res)
    if (this.parentConst==null || this.lang!=this.parentConst.lang) // only indicate when language changes
        res.lang=this.lang;
    return res;
}

/**
 * Compact pretty-print of json (JSON.stringify(.,null,n) is hard to work with as it uses too many lines)
 * Adaptation of ppJson.py (in project json-rnc)
 * only useful for debugging, not necessary for using jsRealB
 * @param {Object} obj JSON object to pretty-print
 * @param {int?} level indentation level, 0 if omitted 
 * @param {String} str string to which new info is appended, "" if omitted
 * @returns indented string
 */
function ppJSON(obj,level,str){
    function out(s){str+=s}
    function quoted(s){
        if (s.includes('\\'))s=s.replace(/\\/g,'\\\\');
        if (s.includes('"' ))s=s.replace(/"/g,'\\"');
        if (s.includes('\n'))s=s.replace(/\n/g,'\\n');
        return '"'+s+'"';
    }
    switch (arguments.length) {
    case 1:return ppJSON(obj,0,"");
    case 2:return ppJSON(obj,level,"");
    default:
        switch (typeof obj) {
        case "string":
            out(quoted(obj));
            break;
        case "object":
            if (obj===null){
                out("null")
            } else if (Array.isArray(obj)){
                // indent only if one of the elements of the array is an object != null 
                const indent = obj.some((e)=>typeof e == "object" && e!==null)
                let children = obj.map(elem => ppJSON(elem,level+1,""))
                out('['+children.join(indent ? (",\n"+" ".repeat(level+1)): ",")+']');
            } else {
                const keys=Object.keys(obj);
                let children = keys.map(key=>quoted(key)+":"+ppJSON(obj[key],level+1+key.length+3,""))
                out('{'+children.join(",\n"+" ".repeat(level+1))+'}')
             }
            break;
        default: // primitive JavaScript values : boolean, number, string
            out(obj);
        }
    }
    return str;
}
