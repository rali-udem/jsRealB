/*
 * Bibliothèque JavaScript JSrealB
 * JSreal v1 http://daou.st/JSreal
 * 
 * v1 Par Nicolas Daoust, sous la direction de Guy Lapalme
 * Université de Montréal
 * 2013
 * 
 * v2 Par Paul Molins, sous la direction de Guy Lapalme
 * Version bilingue, approche systématique à base de tables de règles
 * Université de Montréal
 * 2015
 *
 * v3 Par Francis Gauthier, sous la direction de Guy Lapalme
 * Améliorations apportées à JSrealB
 * Université de Montréal
 * 2016
 * 
 * Guy Lapalme à partir de juillet 2017 
 * ajout de l'expression des nombres ordinaux (novembre 2017) en calquant ce qui est fait pour .nat
 * ajout du constructeur Q ("quoted text") pour permettre des options sur des chaines
 * changement complet du module d'élision (français et anglais)
 * plusieurs corrections pour faciliter le traitement d'expressions générées automatiquement
 * génération aléatoire "oneOf"
 * réorganisation de la conjugaison des verbes anglais suite à l'ajout des modaux
 * ajout du mode "lenient" qui accepte des formes fléchies comme paramètre des constructeurs
 */

/*
 * JSrealB Facade
 */
var JSrealE = function(elts, category, transformation) {
    this.unit = null;
    this.realization = null;
    this.category = category;
    this.fct = null;
    this.transformation = transformation || null;
    this.constructor = category;
    this.prop = {};
    this.defaultProp = {};
    this.childrenProp = {};
    this.defaultCtx = {};
    this.ctx = {};
    this.parent = null;
    this.elements = [];
    this.constituents = {head: undefined, modifier: [], subordinate: [], complement: []};
    this.initProp = {};
    
    if (typeof elts == "number"){
        elts=elts.toString();
    }

    var naturalDisplay = true;
    if(this.transformation === JSrealE.ruleType.date)
    {
        this.unit = elts;
    }
    else if(this.transformation === JSrealE.ruleType.number)
    {
        var lang=getLanguage()
        naturalDisplay = false;
        if (typeof elts == "string")
            elts = elts.replace(lang=="en"?/,| /g:/ /g,"");// remove possible , and spaces within a number
        if (!isNumeric(elts)){
            var lemma=getLemma(elts);
            if (lemma !== undefined){
                if (lemma["D"]!==undefined && lemma["D"]["value"]!==undefined){ // cardinal number
                    this.unit=lemma["D"]["value"];
                    naturalDisplay=true;
                } else if (lemma["A"]!==undefined && lemma["A"]["value"]!==undefined){ // ordinal number
                    this.unit=lemma["A"]["value"]
                    this.setCtx(JSrealB.Config.get("feature.display_option.alias")
                                + "." + JSrealB.Config.get("feature.display_option.ordinal"), 
                                    true);
                }
            } else
                this.unit=elts;
        } else 
            this.unit = elts;
    }
    else if(isString(elts))
    {
        if (JSrealB.Config.get("lenient")){
            var entries=JSrealB.Config.get("lexicon")[elts]
            if (entries!== undefined && Object.keys(entries).indexOf(category)>=0) 
                // form of the appropriate category already exists
                this.unit = elts;
            else { // try to find the lemma and take it as the unit otherwise leave it
                var unit1=form2lemma(JSrealB.Config.get("lemmata"),elts,category);
                this.unit= unit1 !== undefined ? unit1 : elts;
            }
        } else {
            this.unit=elts;
        }
        this.initUnitProperty();
    }
    else if(Array.isArray(elts) || isObject(elts))
    {
        this.elements = elts;
        if(this.category == "SP") this.initUnitProperty();
    }
    
    this.initContext(naturalDisplay);
};

JSrealE.language = {
    english: "en",
    french: "fr"
};

JSrealE.ruleType = {
    conjugation: 1,
    declension: 2,
    regular: 3,
    date: 4,
    number: 5,
    none: 6
};

JSrealE.grammaticalFunction = {
    modifier: 1,
    head: 2,
    subordinate: 3,
    complement: 4
};

//// Init
JSrealE.prototype.initUnitProperty = function() {
    if(this.transformation !== JSrealE.ruleType.none)
    {   // default number
        var unitFeature = JSrealB.Module.Common.getWordFeature(this.unit, this.category, true);
        var unitNumber = (unitFeature !== null) ? unitFeature[JSrealB.Config.get("feature.number.alias")] : undefined;
        if(unitNumber !== undefined)
        {
            this.defaultProp[JSrealB.Config.get("feature.number.alias")] = unitNumber;
        } else        
            this.defaultProp[JSrealB.Config.get("feature.number.alias")] = JSrealB.Config.get("feature.number.singular");
        this.defaultProp[JSrealB.Config.get("feature.owner.alias")] = JSrealB.Config.get("feature.owner.singular");
        
        if(this.category === JSrealB.Config.get("feature.category.word.verb")
                || this.category === JSrealB.Config.get("feature.category.phrase.verb"))
        {
            this.defaultProp[JSrealB.Config.get("feature.tense.alias")] = JSrealB.Config.get("feature.tense.indicative.present"); // Indicatif présent ou present tense
            this.defaultProp[JSrealB.Config.get("feature.cdInfo.alias")] = {};
        }
    
        // default gender
        var unitFeature = JSrealB.Module.Common.getWordFeature(this.unit, this.category, true);
        var unitGender = (unitFeature !== null) ? unitFeature[JSrealB.Config.get("feature.gender.alias")] : undefined;
        if(unitGender !== undefined)
        {
            this.defaultProp[JSrealB.Config.get("feature.gender.alias")] = unitGender;
        }
        else
        {
            this.defaultProp[JSrealB.Config.get("feature.gender.alias")] =
                 (JSrealB.Config.get("language")==JSrealE.language.english && // mots anglais sauf les pronoms sont neutres par défaut
                     this.category !== JSrealB.Config.get("feature.category.word.pronoun"))
                        ? JSrealB.Config.get("feature.gender.neuter")
                        : JSrealB.Config.get("feature.gender.masculine");
        }
        
        // default person
        var unitPerson = (unitFeature !== null) ? 
                            unitFeature[JSrealB.Config.get("feature.person.alias")] : undefined;
        if(unitPerson !== undefined)
        {
            this.defaultProp[JSrealB.Config.get("feature.person.alias")] = unitPerson;
        }
        else
        {
            this.defaultProp[JSrealB.Config.get("feature.person.alias")] = JSrealB.Config.get("feature.person.p3");        
        }

        //adjective position
        if(this.category === JSrealB.Config.get("feature.category.word.adjective")){
            var adjLex = JSrealB.Config.get("lexicon")[this.unit];
            if(adjLex != undefined){
                adjLex=adjLex[JSrealB.Config.get("feature.category.word.adjective")];
                if(adjLex != undefined && adjLex[JSrealB.Config.get("feature.antepose.alias")] != undefined &&
                     adjLex[JSrealB.Config.get("feature.antepose.alias")] == JSrealB.Config.get("feature.antepose.before")){
                    this.defaultProp[JSrealB.Config.get("feature.antepose.alias")] = JSrealB.Config.get("feature.antepose.before");
                }
                else{
                    this.defaultProp[JSrealB.Config.get("feature.antepose.alias")] = JSrealB.Config.get("feature.antepose.default");
                }
            }
        }
        
    }
};

JSrealE.prototype.initContext = function(naturalDisplay) {
    this.ctx[JSrealB.Config.get("feature.display_option.alias")] = {};
    this.ctx[JSrealB.Config.get("feature.sentence_type.alias")] = {};
    this.ctx[JSrealB.Config.get("feature.html.alias")] = [];
    this.ctx[JSrealB.Config.get("feature.typography.surround")] = [];
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")] = {};
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")][JSrealB.Config.get("feature.display_option.natural")] = naturalDisplay;
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")][JSrealB.Config.get("feature.display_option.relative_time")] = false;
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")][JSrealB.Config.get("feature.display_option.raw")] = false;
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")][JSrealB.Config.get("feature.display_option.max_precision")] = 2;
    this.defaultCtx[JSrealB.Config.get("feature.display_option.alias")][JSrealB.Config.get("feature.display_option.determiner")] = true;
};

//// Operations / Construction
JSrealE.prototype.getProp = function(propName) {
    var propValue = this.prop[propName];
    
    if(propValue === undefined)
    {
        return this.getDefaultProp(propName);
    }
    
    return propValue;
};

JSrealE.prototype.getDefaultProp = function(propName) {
    var defaultPropValue = this.defaultProp[propName];
    
    if(defaultPropValue === undefined)
    {
        return null;
    }
    
    return defaultPropValue;
};

JSrealE.prototype.getChildrenProp = function(propName) {
    var propValue = this.childrenProp[propName];
    
    if(propValue === undefined)
    {
        return null;
    }
    
    return propValue;
};

JSrealE.prototype.setProp = function(propName, propValue) {
    
    if(this.prop[propName] === undefined)
        this.prop[propName] = propValue;
    
    return this;
};

JSrealE.prototype.setDefaultProp = function(propName, propValue) {
    this.defaultProp[propName] = propValue;
    
    return this;
};

JSrealE.prototype.setChildrenProp = function(propName, propValue) {
    this.childrenProp[propName] = propValue;
    
    return this;
};

JSrealE.prototype.getCtx = function(ctxName) {
    var ctxValue = fetchFromObject(this.ctx, ctxName);
    
    if(ctxValue === undefined)
    {
        return this.getDefaultCtx(ctxName);
    }
    
    return ctxValue;
};

JSrealE.prototype.getDefaultCtx = function(ctxName) {
    var defaultCtxValue = fetchFromObject(this.defaultCtx, ctxName);
    
    if(defaultCtxValue === undefined)
    {
        return null;
    }
    
    return defaultCtxValue;
};

JSrealE.prototype.setCtx = function(ctxName, ctxValue) {
    if(fetchFromObject(this.ctx, ctxName) === undefined)
        fetchFromObject(this.ctx, ctxName, ctxValue);
    
    return this;
};

JSrealE.prototype.addCtx = function(ctxName, ctxValue) {
    if(Array.isArray(fetchFromObject(this.ctx, ctxName))){
        fetchFromObject(this.ctx, ctxName).push(ctxValue);
    }
    return this;
}

JSrealE.prototype.addConstituent = function(element, grammaticalFunction) {
    switch(grammaticalFunction)
    {
        case JSrealE.grammaticalFunction.modifier:
            element.fct = JSrealE.grammaticalFunction.modifier;
            this.constituents.modifier.push(element);
        break;
        case JSrealE.grammaticalFunction.head:
            if(this.constituents.head === undefined
                    || this.constituents.head === null)
            {
                element.fct = JSrealE.grammaticalFunction.head;
                this.constituents.head = element;
                break;
            }
        case JSrealE.grammaticalFunction.subordinate:
            element.fct = JSrealE.grammaticalFunction.subordinate;
            this.constituents.subordinate.push(element);
        break;
        case JSrealE.grammaticalFunction.complement:
            element.fct = JSrealE.grammaticalFunction.complement;
            this.constituents.complement.push(element);
        break;
    }
};

JSrealE.prototype.setInitProp = function(propName, propValue) {
    this.initProp[propName] = propValue;

    return this;
}

JSrealE.prototype.getInitProp = function(propName){
    var propValue = this.initProp[propName];
    
    if(propValue === undefined)
    {
        return null;
    }

    return propValue;
}

// create a array without repetition of property names from a list of properties
// we use a Set to avoid repetition
JSrealE.prototype.getPropNameList = function (newProps,propList) {
    if (propList !== undefined) return propList;
    var res=new Set([])
    for (var i = 0; i < newProps.length; i++) {
        var names=Object.keys(newProps[i]);
        for (var j = 0; j < names.length; j++) {
            res.add(names[j])
        }
    }
    return Array.from(res);
}

/**
 * Propagation from parent to child
 * @param {type} target is a child
 * @param {type} propList to propagate
 * @param {type} valueList to propagate
 */
JSrealE.prototype.topDownFeaturePropagation = function(target, propList, valueList) {
    if(propList !== undefined && valueList !== undefined && propList.length !== valueList.length)
    {
        return false;
    }
    
    var groupPropNameList = this.getPropNameList([this.prop,this.defaultProp],propList);

    var j, nbGroupProp;
    for(j = 0, nbGroupProp = groupPropNameList.length; j < nbGroupProp; j++)
    {
        target.setProp(groupPropNameList[j], 
                ((valueList === undefined) ? this.getProp(groupPropNameList[j]) : valueList[j]));
    }
    
    return true;
};

/**
 * Propagation from element to element on same level
 * @param {type} target is a sibling
 * @param {type} propList to propagate
 * @param {type} valueList to propagate
 */
JSrealE.prototype.siblingFeaturePropagation = function(target, propList, valueList) {
    function remove(array,item){// remove an item from an array inplace
        var index = array.indexOf(item);
        if (index > -1) array.splice(index, 1);
    }
    if(propList !== undefined && valueList !== undefined && propList.length !== valueList.length)
    {
        return false;
    }
    
    var groupPropNameList = this.getPropNameList([this.prop,this.defaultProp,this.childrenProp], propList);
    // do not propagate person of a determiner e.g. D("my") that could change the verb 
    if (this.category=="D")remove(groupPropNameList,"pe")
    // do not propagate number the grammatical number (.n(...)) into a number NO
    else if (target.category=="NO")remove(groupPropNameList,"n");
    
    var j, nbGroupProp;
    for(j = 0, nbGroupProp = groupPropNameList.length; j < nbGroupProp; j++)
    {
        if(valueList !== undefined)
        {
            target.setDefaultProp(groupPropNameList[j], valueList[j]);
        }
        else if(this.getChildrenProp(groupPropNameList[j]) !== null)
        {
            target.setDefaultProp(groupPropNameList[j], this.getChildrenProp(groupPropNameList[j]));
        }
        else
        {
            target.setDefaultProp(groupPropNameList[j], this.getProp(groupPropNameList[j]));
        }
    }
    
    return true;
};

/**
 * Propagation from child to parent
 * @param {type} target is a parent
 * @param {type} propList to propagate
 * @param {type} valueList to propagate
 */
JSrealE.prototype.bottomUpFeaturePropagation = function(target, propList, valueList) {
    if(propList !== undefined && valueList !== undefined && propList.length !== valueList.length)
    {
        return false;
    }
    
    var groupPropNameList = this.getPropNameList([this.prop,this.defaultProp,this.childrenProp],propList);
    
    var j, nbGroupProp;
    for(j = 0, nbGroupProp = groupPropNameList.length; j < nbGroupProp; j++)
    {
        if(valueList !== undefined)
        {
            target.setChildrenProp(groupPropNameList[j], valueList[j]);
        }
        else if(this.getChildrenProp(groupPropNameList[j]) !== null)
        {
            target.setChildrenProp(groupPropNameList[j], this.getChildrenProp(groupPropNameList[j]));
        }
        else
        {
            target.setChildrenProp(groupPropNameList[j], this.getProp(groupPropNameList[j]));
        }
    }
    
    return true;
};

//  "clone" pour réutiliser un objet facilement sans la référence
// comme les objets jsRealB possèdent des références circulaires, on ne peut utiliser "simple" clone récursif,
//    on recrée donc une représentation chaîne de l'objet qu'on fait évaluer
JSrealE.prototype.toSource = function() {
    function mkVal(val){
        return typeof val=="string"?JSON.stringify(val):val;
    }
    var nativeString = this.category
    if(this.unit != null){
        nativeString += "("+JSON.stringify(this.unit)+")";
    } else{
        var subElems=[];
        for(var i = 0, imax=this.elements.length; i < imax; i++){
            var e=this.elements[i];
            if (e instanceof JSrealE) // should always be true for correct expressions
                subElems.push(e.toSource());
            else
                subElems.push(e.toString())
        }
        nativeString += "("+subElems.join(",")+")";
    }
    //Pour ajouter des features au clone, ajouter les setInitProp dans les features voulus
    var subProps=[];
    for (prop in this.initProp){
        if (prop.startsWith("vOpt."))
            subProps.push(".typ({"+prop.substring(5)+":"+mkVal(this.initProp[prop])+"})");
        else
            subProps.push("."+prop+"(\""+this.initProp[prop]+"\")");
    }
    // ajouter les features de prop qui ne sont pas dans initProp
    for (prop in this.prop){
        if (this.initProp[prop]==undefined){
            if (prop.startsWith("vOpt."))
                subProps.push(".typ({"+prop.substring(5)+":"+mkVal(this.prop[prop])+"})");
            else
                subProps.push("."+prop+"(\""+this.prop[prop]+"\")");
        }
    }
    //// ajouter les éléments du contexte
    //       types de phrases
    var typeList=[]
    for (prop in this.ctx.typ){
        typeList.push(prop+":"+mkVal(this.ctx.typ[prop]));
    }
    if (typeList.length>0)
        subProps.push(".typ({"+typeList.join(",")+"})");
    //   HTML tags
    var htmlElems=this.ctx.html;
    for (var i = 0; i < htmlElems.length; i++) {
        var e=htmlElems[i];
        if (e[1]===undefined)
            subProps.push('.tag("'+e[0]+'")');
        else {
            var keys=Object.keys(e[1]);
            var attrs=[];
            for (var j = 0; j < keys.length; j++) {
                var attrName=keys[j];
                attrs.push(attrName+':"'+e[1][attrName]+'"')
            }
            subProps.push('.tag("'+e[0]+'",{'+attrs.join(',')+'})');
        }
    }
    // formattage
    if (this.ctx[JSrealB.Config.get("feature.liaison.alias")]==true)
        subProps.push('.lier()');
    if (this.ctx[JSrealB.Config.get("feature.typography.before")]!==undefined)
        subProps.push('.b("'+this.ctx[JSrealB.Config.get("feature.typography.before")]+'")');
    if (this.ctx[JSrealB.Config.get("feature.typography.after")]!==undefined)
        subProps.push('.a("'+this.ctx[JSrealB.Config.get("feature.typography.after")]+'")');
    if (this.ctx[JSrealB.Config.get("feature.typography.ucfirst")]===true)
        subProps.push('.cap()');
    var surround=this.ctx[JSrealB.Config.get("feature.typography.surround")];
    for (var i = 0; i < surround.length; i++){
        subProps.push('.en("'+surround[i]+'")');
    }
    return nativeString+subProps.join("");
}
JSrealE.prototype.clone = function(){
    var native = this.toSource();
    // console.log("native:"+native)
    return eval(native);
}

//// Word Features / Properties
// tense
JSrealE.prototype.t = function(tense) {
    if(!contains(JSrealB.Config.get("feature.tense"), tense))
    {
        throw JSrealB.Exception.invalidInput(tense, "tense");
    }
    this.setInitProp(JSrealB.Config.get("feature.tense.alias"),tense)
    return this.setProp(JSrealB.Config.get("feature.tense.alias"), tense);
};
// person
JSrealE.prototype.pe = function(person) {
    if(!isNumeric(person) || person < 1 || person > 3)
    {
        throw JSrealB.Exception.invalidInput(person, "person");
    }
    this.setInitProp(JSrealB.Config.get("feature.person.alias"),person)
    return this.setProp(JSrealB.Config.get("feature.person.alias"), (isString(person) ? intVal(person) : person));
};
 // grammatical gender
JSrealE.prototype.g = function(grammaticalGender) {
    if(!contains(JSrealB.Config.get("feature.gender"), grammaticalGender))
    {
        throw JSrealB.Exception.invalidInput(grammaticalGender, "gender");
    }
    this.setInitProp(JSrealB.Config.get("feature.gender.alias"),grammaticalGender);
    return this.setProp(JSrealB.Config.get("feature.gender.alias"), grammaticalGender);
};
// grammatical number
JSrealE.prototype.n = function(grammaticalNumber) {
    if(!contains(JSrealB.Config.get("feature.number"), grammaticalNumber))
    {
        throw JSrealB.Exception.invalidInput(grammaticalNumber, "number");
    }
    this.setInitProp(JSrealB.Config.get("feature.number.alias"),grammaticalNumber)
    return this.setProp(JSrealB.Config.get("feature.number.alias"), grammaticalNumber);
};
// form (superlative / comparative)
JSrealE.prototype.f = function(form) {
    if(!contains(JSrealB.Config.get("feature.form"), form))
    {
        throw JSrealB.Exception.invalidInput(form, "form");
    }
    return this.setProp(JSrealB.Config.get("feature.form.alias"), form);
};
// owner
JSrealE.prototype.ow = function(owner) {
    if(!contains(JSrealB.Config.get("feature.owner"), owner))
    {
        throw JSrealB.Exception.invalidInput(owner, "owner");
    }
    this.setInitProp(JSrealB.Config.get("feature.owner.alias"),owner);
    return this.setProp(JSrealB.Config.get("feature.owner.alias"), owner);
};
//adjectif anteposé
JSrealE.prototype.pos = function(antepose) {
    if(!contains(JSrealB.Config.get("feature.antepose"), antepose))
    {
        throw JSrealB.Exception.invalidInput(antepose, "antéposé")
    }
    return this.setProp(JSrealB.Config.get("feature.antepose.alias"), antepose);
}
//// Typography / Html / Context
// first char in upper case
JSrealE.prototype.cap = function(ucf) {
    if(!isBoolean(ucf) && ucf !== undefined)
    {
        throw JSrealB.Exception.invalidInput(ucf, "ucf");
    }
    return this.setCtx(JSrealB.Config.get("feature.typography.ucfirst"), (ucf === undefined || ucf === true));
};
// punctuation before an element
JSrealE.prototype.b = function(punctuation) {
    return this.setCtx(JSrealB.Config.get("feature.typography.before"), punctuation);
};
// punctuation after an element
JSrealE.prototype.a = function(punctuation) {
    return this.setCtx(JSrealB.Config.get("feature.typography.after"), punctuation);
};
// punctuation around an element
JSrealE.prototype.en = function(punctuation) {
    return this.addCtx(JSrealB.Config.get("feature.typography.surround"), punctuation);
};
//Liaison forçée en français
JSrealE.prototype.lier = function() {
    return this.setCtx(JSrealB.Config.get("feature.liaison.alias"),true);
};
//Ajout types de phrases
JSrealE.prototype.typ = function(optionList){
    if(optionList !== undefined && isObject(optionList))
    {
        var optionKeyList = Object.keys(optionList);
        for(var i = 0, length = optionKeyList.length; i < length; i++)
        {
            if(JSrealB.Config.get("feature.sentence_type.context_wise").indexOf(optionKeyList[i])>=0){
                this.setCtx(JSrealB.Config.get("feature.sentence_type.alias") 
                    + "." + optionKeyList[i], optionList[optionKeyList[i]]);
            }
            else{
                this.setProp(JSrealB.Config.get("feature.verb_option.alias") 
                        + "." + optionKeyList[i], optionList[optionKeyList[i]]);
                this.setInitProp(JSrealB.Config.get("feature.verb_option.alias") 
                        + "." + optionKeyList[i], optionList[optionKeyList[i]]);
            }
        }        
        return this;
    }
    
    return null;
}
//temps perfect (anglais)
JSrealE.prototype.perf = function(t_f){
    if(typeof t_f != "boolean"){
        throw JSrealB.Exception.invalidInput(t_f, "perfect tense");
    }
    if(t_f){
        this.setProp(JSrealB.Config.get("feature.verb_option.alias") 
                + "." + JSrealB.Config.get("feature.verb_option.perfect"), true);
        this.setInitProp(JSrealB.Config.get("feature.verb_option.alias") 
                + "." + JSrealB.Config.get("feature.verb_option.perfect"), true);
    }
    return this;
}   
//Auxiliaires forcés
JSrealE.prototype.aux = function(a){
    try{
        if(!contains(JSrealB.Config.get("rule.compound.aux"), a)){
            throw JSrealB.Exception.invalidInput(a, "auxiliary");
        }
        return this.setProp(JSrealB.Config.get("rule.compound.alias"),a);
    }
    catch(e){return this;}//english
}
// Natural
JSrealE.prototype.nat = function(natural) {
    if(!isBoolean(natural) && natural !== undefined)
    {
        throw JSrealB.Exception.invalidInput(natural, "natural");
    }
    
    return this.setCtx(JSrealB.Config.get("feature.display_option.alias")
            + "." + JSrealB.Config.get("feature.display_option.natural"), 
                (natural === undefined || natural === true));
};
// ordinal
JSrealE.prototype.ord = function(ordinal) {
    if(!isBoolean(ordinal) && ordinal !== undefined)
    {
        throw JSrealB.Exception.invalidInput(natural, "ordinal");
    }
    // force singular for ordinal number
    this.defaultProp[JSrealB.Config.get("feature.number.alias")] = JSrealB.Config.get("feature.number.singular");
    return this.setCtx(JSrealB.Config.get("feature.display_option.alias")
            + "." + JSrealB.Config.get("feature.display_option.ordinal"), 
                (ordinal === undefined || ordinal === true));
};
// Display option
JSrealE.prototype.dOpt = function(optionList) {
    if(optionList !== undefined && isObject(optionList))
    {
        var optionKeyList = Object.keys(optionList);
        for(var i = 0, length = optionKeyList.length; i < length; i++)
        {
            this.setCtx(JSrealB.Config.get("feature.display_option.alias") 
                    + "." + optionKeyList[i], optionList[optionKeyList[i]]);
        }
        
        return this;
    }
    
    return null;
};
JSrealE.prototype.tag = function(elt, attr) {
    var tag = [elt,attr];
    //this.addCtx(JSrealB.Config.get("feature.html.element"), elt);
    //this.addCtx(JSrealB.Config.get("feature.html.attribute"), attr);
    this.addCtx(JSrealB.Config.get("feature.html.alias"), tag);
    return this;
};
//// Agreement
JSrealE.prototype.sortWord = function() {}; // Abstract

JSrealE.prototype.phraseToElementPropagation = function(element) {
    if(element.fct === JSrealE.grammaticalFunction.modifier)
    {
        this.topDownFeaturePropagation(element);
    }
    else if(element.fct === JSrealE.grammaticalFunction.head)
    {
        this.topDownFeaturePropagation(element);
    }
    else if(element.fct === JSrealE.grammaticalFunction.subordinate)
    {
        if(this.constituents.head === null)
        {
            this.topDownFeaturePropagation(element);
        }
    }
    
    return this;
};

JSrealE.prototype.elementToElementPropagation = function(element) {
    if(element.fct === JSrealE.grammaticalFunction.modifier) 
    {
        if(this.constituents.head !== null)
        {
            element.siblingFeaturePropagation(this.constituents.head);
        }
    }
    else if(element.fct === JSrealE.grammaticalFunction.head)
    {
        for(var i = 0, length = this.constituents.subordinate.length; i < length; i++)
        {
            element.siblingFeaturePropagation(this.constituents.subordinate[i]);
        }
    }
};

JSrealE.prototype.elementToPhrasePropagation = function(element) {
    if(element.fct === JSrealE.grammaticalFunction.head)
    {
        element.bottomUpFeaturePropagation(this);
    }
};
//// Transformation
JSrealE.prototype.toString = function() {
    return this.real();
};

JSrealE.prototype.real = function() {
    if(this.elements.length > 0) // group
    {
        if (this.constituents.head === undefined)//GL to prevent an infinite loop
            this.sortWord();
        // if(this.constituents.head !== undefined)
        // {
            var eltList = this.createRealizationList();          
            // console.log("real:eltList",eltList);
            this.realizeGroup(eltList);
            // do not try to modify the structure if no head found
            if(this.constituents.head !== undefined) 
                this.modifyStructure();

            this.realization = this.printElements();
            // console.log("real:realization",this.realization);
          
            return this.html(this.typography(this.phonetic(this.realization)));
        // }
        // else
        // {
        //     throw JSrealB.Exception.headWordNotFound(this.category,this);
        // }
    }
    else // terminal element
    {
        var realization = this.realizeTerminalElement();
        return this.typography(this.html(this.phonetic(realization)));
    }
};


JSrealE.prototype.createRealizationList = function() {
    var eltList = [];
    if(this.constituents.modifier !== undefined && this.constituents.modifier.length > 0)
        eltList = eltList.concat(this.constituents.modifier);
    
    if(this.constituents.head !== undefined && this.constituents.head !== null)
        eltList.push(this.constituents.head);
    
    if(this.constituents.subordinate !== undefined && this.constituents.subordinate.length > 0)
        eltList = eltList.concat(this.constituents.subordinate);
    
    if(this.constituents.complement !== undefined && this.constituents.complement.length > 0)
        eltList = eltList.concat(this.constituents.complement);

    return eltList;
};


JSrealE.prototype.realizeGroup = function(elementList) {
    var i, length;
    var e = null;
    // console.log("realizeGroup:",this);
    for(i = 0, length = elementList.length; i < length; i++)
    {
        e = elementList[i];
        
        e.parent = this;//.category;
        
        this.phraseToElementPropagation(e);
        e.realization = (e instanceof JSrealE) ? e.real() : "";
        
        this.elementToElementPropagation(e);
        this.elementToPhrasePropagation(e);
    }
};

JSrealE.prototype.add = function(childElement, pos){
    if(pos == undefined){
        var pos = this.elements.length;
    }
    this.constituents = {head: undefined, modifier: [], subordinate: [], complement: []};
    
    this.addNewElement(pos,childElement);

    this.sortWord();

    this.resetProp(false);

    return this;
}

JSrealE.prototype.deleteElement = function(elemIndex) {
    var imax = this.elements.length;
    for(var i = elemIndex; i < imax; i++){
        this.elements[i] = this.elements[i+1];
    }
    delete this.elements[i+1];
    this.elements.length -=1;
}


JSrealE.prototype.addNewElement = function(elemIndex, elementAdd) {
    if(elementAdd instanceof JSrealE){
        elementAdd.parent = this;
    }
    var imax = this.elements.length;
    var temp = this.elements[elemIndex];
    this.elements[elemIndex] = elementAdd;
    for(var i =elemIndex+1; i<imax+1; i++){
        var temp2 = this.elements[i];
        this.elements[i] = temp;
        temp = temp2;
    }
    this.elements.length +=1;
}


JSrealE.prototype.getTreeRoot = function(strict) {
    // if strict = strict || true;
    if (strict==undefined) strict=true; //GL juillet 2017
    if(this.category == JSrealB.Config.get("feature.category.phrase.sentence"))
        return this;
    else if(!strict && this.category == JSrealB.Config.get("feature.category.phrase.propositional")){
        return this;
    }else if(this.parent!= null){
        return this.parent.getTreeRoot(strict);
    }

    throw "Could not find tree root (S or SP)";
}


JSrealE.prototype.resetProp = function(recursive) {
    
    this.childrenProp ={}
    if(this.category == "VP") this.initUnitProperty(); //reset defaultProp   
    this.prop = {}

    for(var p in this.initProp){
        //remettre les propriétés initiales dictées par l'utilisateur dans le nouvel arbre
        this.setProp(p,this.initProp[p])
    }
    this.prop["vOpt.pas"]     = false; //empêche une récursion infinie

    if(this.elements.length > 0){
        this.constituents = {head: undefined, modifier: [], subordinate: [], complement: []};
        //this.sortWord()  // il y en a un dans chaque appel de real()
    }    
    //this.defaultProp = {}
    if(recursive){
        var imax = this.elements.length
        for(var i = 0; i < imax; i++){

            var child = this.elements[i];
            if(child instanceof JSrealE){
                child.resetProp(recursive);    
            }            
        }
    }
}

var getSubject = function(sObject){
    if(sObject.category == JSrealB.Config.get("feature.category.phrase.sentence") 
        || sObject.category == JSrealB.Config.get("feature.category.phrase.propositional")){
        var elemList = sObject.elements;
        var imax = elemList.length;
        var SubjPos = -1;
        for(var i = 0; i < imax; i++){
            if(elemList[i].category == JSrealB.Config.get("feature.category.phrase.noun")
                    || (elemList[i].category == JSrealB.Config.get("feature.category.word.pronoun") 
                       && elemList[i].unit == JSrealB.Config.get("rule.usePronoun.S"))){
                SubjPos = i;
            }
            if(elemList[i].category == JSrealB.Config.get("feature.category.phrase.verb")){
                //on essaie de trouver le sujet avant le VP. Évite d'effacer un complément de phrase qui serait un NP
                break;
            }
        }
        return SubjPos;
    }
    else{
        throw "Not a Sentence type, could not find subject";
    }
}
    
var getGroup = function(sObject,groupAlias){
    if (sObject===undefined)return -1; //GL can be called on a string...
    var elemList = sObject.elements;
    var imax = elemList.length;
    var gPos = -1;
    for(var i = 0; i < imax; i++){
        if(elemList[i].category == groupAlias){
            gPos = i;
            return gPos;
        }
    }
    return gPos;
}

JSrealE.prototype.modifyStructure = function() {
    var donotSort=[JSrealB.Config.get("feature.category.quoted"),
             JSrealB.Config.get("feature.category.word.pronoun"),
             JSrealB.Config.get("feature.category.word.adverb"),
             JSrealB.Config.get("feature.category.word.preposition"),
             JSrealB.Config.get("feature.category.word.conjunction"),
             JSrealB.Config.get("feature.category.phrase.adverb"),
             // JSrealB.Config.get("feature.category.phrase.prepositional"),
             // JSrealB.Config.get("feature.category.phrase.propositional"),
             JSrealB.Config.get("feature.category.phrase.coordinated"),
             JSrealB.Config.get("feature.category.phrase.sentence")]
    var elemList = this.elements;
    var change = false;
    var imax = elemList.length;
    //console.log(this)


    // trier les compléments d'un VP en ordre de longueur de réalisation... s'il y a au moins un complément
    if(this.category == JSrealB.Config.get("feature.category.phrase.verb") && imax>2 &&
        //  si la phrase n'est pas au passif   
       !this.getChildrenProp(JSrealB.Config.get("feature.verb_option.alias")+".pas")){
        //  et qu'elle ne contienne un Q, P ou C ou des phrases qui devraient demeurer au même endroit
        var shouldSort=true; // activer le tri...
        var realLengths=[];
        for(var i = 0; i < imax; i++){
            var el=elemList[i];
            if (donotSort.indexOf(el.category)>=0){
                shouldSort=false;
                break;
            }
            realLengths[i]={ind:i,
                val:(el.category==JSrealB.Config.get("feature.category.word.verb"))
                  ? 0 // length set to 0 to keep the verb at the front
                  :(typeof(el)=="string"?el.length:el.realization.length)};
        };
        if (shouldSort) {
            var newElemList=[];
            realLengths.sort(function(a,b){return a.val-b.val});
            for (var i=0;i<imax;i++){
                newElemList.push(elemList[realLengths[i].ind]);
            }
            this.elements=newElemList;
        };
    }
    
    //Passif (inversion du sujet et de l'objet direct)
    if(this.getChildrenProp(JSrealB.Config.get("feature.verb_option.alias")+".pas") == true){
        if(this.category == JSrealB.Config.get("feature.category.phrase.verb")){
            var parent = this.getTreeRoot();
            var verbe = this.constituents.head;
            this.recursion = (this.recursion == null)?1:this.recursion+1; //help to debug infinite recursion
            if(this.recursion != null && this.recursion > 10){
                JSrealB.Logger.alert("Could not resolve the passive tense of "+verbe.unit);
                this.childrenProp[JSrealB.Config.get("feature.verb_option.alias")+".pas"] = false;
                return ""; // probably infinite recursion 
            } 

            //get subject
            var subjectPos = getSubject(parent);
            
            //get CD
            var CDpos = getGroup(this, JSrealB.Config.get("feature.category.phrase.noun"));
            if (CDpos == -1) { // try to find a pronoun as CD
                CDpos = getGroup(this, JSrealB.Config.get("feature.category.word.pronoun"));
            }
            var VPos = getGroup(this, JSrealB.Config.get("feature.category.word.verb"))

            if(subjectPos!= -1 && CDpos != -1){
                var suj= parent.elements[subjectPos];
                if(suj.category == JSrealB.Config.get("feature.category.word.pronoun")) 
                    suj.unit = JSrealB.Config.get("rule.usePronoun.Pro"); 
                var cd = elemList[CDpos];
                if(cd.category == JSrealB.Config.get("feature.category.word.pronoun")){
                    cd.unit = JSrealB.Config.get("rule.usePronoun.S"); 
                    if (cd.unit=="me")cd.unit="I" // change accusative pronoun in COD to nominative
                }
                
                //inversion
                parent.elements[subjectPos] = cd;
                elemList[CDpos] = suj;

                verbe.setInitProp("vOpt.pas",true);
                verbe.setInitProp("vOpt.hasSubject",true);
                
                parent.resetProp(true);
                change = true;
            }
            else if(subjectPos != -1){
                var suj= parent.elements[subjectPos];
                if(suj.category == JSrealB.Config.get("feature.category.word.pronoun")) 
                    suj.unit = JSrealB.Config.get("rule.usePronoun.Pro");
                this.addNewElement(VPos+1,parent.elements[subjectPos]);
                parent.elements[subjectPos]=
                    Pro(JSrealB.Config.get("rule.usePronoun.S")).g(getLanguage()=="en"?"n":"m");

                verbe.setInitProp("vOpt.pas",true);
                verbe.setInitProp("vOpt.hasSubject",true);
                
                parent.resetProp(true);
                change = true;

            }
            else if(CDpos != -1){
                var VPpos = getGroup(parent,JSrealB.Config.get("feature.category.phrase.verb"));
                var cd=elemList[CDpos];
                if (cd.category==JSrealB.Config.get("feature.category.word.pronoun")){
                    if (cd.unit=="me")cd.unit="I" // change accusative pronoun in COD to nominative
                }
                parent.addNewElement(VPpos,cd);//will bump the verb and place the cd just before
                
                this.deleteElement(CDpos);

                verbe.setInitProp("vOpt.pas",true);

                parent.resetProp(true);
                change = true;
            } else { // CDpos==-1 && subjectPos==-1 => add "it" as subject... because the verb will be put in passive
                // but do this for only top level 
                if (parent.parent==null){
                    var VPpos = getGroup(parent,JSrealB.Config.get("feature.category.phrase.verb"));
                    parent.addNewElement(VPpos,new Pro("I").pe(3).n("s").g("n"));
                    parent.resetProp(true);                
                    verbe.setInitProp("vOpt.pas",true);
                    change = true;
                }
            }
        }
    }
    //Pronominalisation d'un groupe du nom
    if(this.getCtx(JSrealB.Config.get("feature.toPronoun.alias")) == true){
        try{
            var parent = this.parent;
            var np = getGroup(parent,JSrealB.Config.get("feature.category.phrase.noun"));
            var pro = JSrealB.Config.get("rule.usePronoun."+parent.category);
            var personne=this.getChildrenProp(JSrealB.Config.get("feature.person.alias"));
            var number=this.getChildrenProp(JSrealB.Config.get("feature.number.alias"));
            var gender=this.getChildrenProp(JSrealB.Config.get("feature.gender.alias"));
            var pronoun = new Pro(pro).pe(personne).n(number).g(gender);
            var cdInfo = {n:this.getChildrenProp(JSrealB.Config.get("feature.number.alias")),
                          g:this.getChildrenProp(JSrealB.Config.get("feature.gender.alias"))}
            parent.deleteElement(np);
            switch(parent.category){
                case JSrealB.Config.get("feature.category.phrase.sentence"):
                case JSrealB.Config.get("feature.category.phrase.prepositional"):
                    //Sujet ou objet indirect
                    parent.addNewElement(np,pronoun);
                    this.ctx[JSrealB.Config.get("feature.toPronoun.alias")] = false;
                    parent.resetProp(true);
                break;
                case JSrealB.Config.get("feature.category.phrase.verb"):
                    //Objet direct : on l'ajoute en anglais
                    if(JSrealB.Config.get("language")==JSrealE.language.english){
                        parent.addNewElement(np,pronoun);
                        parent.resetProp(true);
                    }
                    else{ // en français
                        var vp = getGroup(parent,JSrealB.Config.get("feature.category.word.verb"));
                        if (parent.getChildrenProp(JSrealB.Config.get("feature.tense.alias"))
                            == JSrealB.Config.get("feature.tense.imperative.present")){
                                // à l'impératif, on l'ajoute après le verbe lié avec un -
                                parent.constituents.head.setCtx(JSrealB.Config.get("feature.liaison.alias"),true);
                                parent.addNewElement(np,pronoun);
                        } else if (parent.getChildrenProp(JSrealB.Config.get("feature.verb_option.alias")+".pas")) {
                            // au passif placer le pronom après le verbe qui sera suivi de par
                            parent.addNewElement(np,pronoun);
                        } else {
                            // placer le pronom avant
                            parent.addNewElement(vp,pronoun);
                        }
                        parent.resetProp(true);
                        parent.elements[vp].setProp(JSrealB.Config.get("feature.cdInfo.alias"),cdInfo);
                    }
                break;
            }
            change=true;
        }
        catch(e){
            console.log("Cette pronominalisation n'est pas supportée: "+e)
        }
    }
    //Impératif (retrait du Sujet)
    var tense=this.getChildrenProp(JSrealB.Config.get("feature.tense.alias"))
    if( tense == JSrealB.Config.get("feature.tense.imperative.present")){
        if(this.category == JSrealB.Config.get("feature.category.phrase.sentence")){
            var NPpos = getSubject(this);
            if(NPpos != -1){
                this.deleteElement(NPpos);
                change = true;     
            }
        }
    }

    //Interrogatif 
    var int = this.getCtx(JSrealB.Config.get("feature.sentence_type.alias"))
                     [JSrealB.Config.get("feature.sentence_type.interrogative")];
    if(int!= undefined){
        if(int!= false){
            if(!contains(JSrealB.Config.get("feature.sentence_type.interro_prefix"),int) || int == true)int = 'base';
            if (typeof(this.interrogationForm)=="function") // can be called on simple string
                change = this.interrogationForm(int);
        }
    }    

    if(change){
        var racine = this.getTreeRoot(false); // GL mars 2018 ()=>(false)
        var newStringFromRacine = racine.toString();
        return newStringFromRacine;  
    }
    return "";
};


//Ajout fonction pour ordonner les groupes du nom avec adjectifs
JSrealE.prototype.arrangeNP = function (elemList) {
    var nounIndex = -1;
    var adjIndexes = [];
    for(var i = 0, j = 0, length = elemList.length; i < length; i++)
    {
        var eCategory = elemList[i].category;
        if(eCategory == JSrealB.Config.get("feature.category.word.noun"))
        {
            nounIndex = i;
        }
        else if(eCategory == JSrealB.Config.get("feature.category.word.adjective") || eCategory == JSrealB.Config.get("feature.category.phrase.adjective"))
        {
            adjIndexes.push(i);
        }
    }
    if(adjIndexes == []){
        //no adjective
        return elemList;
    }
    for(var i=0; i < adjIndexes.length; i++){
        var adjIndex = adjIndexes[i];
        var adj = elemList[adjIndex];
        if(elemList[adjIndex].getProp(JSrealB.Config.get("feature.antepose.alias")) == JSrealB.Config.get("feature.antepose.before")){
            if(adjIndex > nounIndex){
                this.deleteElement(adjIndex);
                this.addNewElement(nounIndex,adj);
            }
        }
        else if(elemList[adjIndex].getProp(JSrealB.Config.get("feature.antepose.alias")) == JSrealB.Config.get("feature.antepose.after")){
            if(adjIndex < nounIndex){
                this.deleteElement(adjIndex);
                this.addNewElement(nounIndex,adj);
            }
        }
    }
    return elemList;
}

JSrealE.prototype.printElements = function() {
    var elementList = this.elements;
    var separator = " ";
    var lastSeparator = " ";

    if(this.category === JSrealB.Config.get("feature.category.phrase.noun") && JSrealB.Config.get("language")==JSrealE.language.french){
        //s'assurer que le nom et l'adjectif sont dans le bon ordre 
        elementList = this.arrangeNP(elementList);
    }
    
    // COORDINATED PHRASE
    var conjunction = this.getCtx(JSrealB.Config.get("feature.category.word.conjunction"));
    if(this.category === JSrealB.Config.get("feature.category.phrase.coordinated")
            && conjunction !== null)
    {
        if(JSrealB.Module.Punctuation.isValid(conjunction))
        {
            separator = JSrealB.Module.Punctuation.after("", conjunction);
            lastSeparator = separator;
        }
        else 
        {
            separator = ", ";
            lastSeparator = " " + conjunction + " ";
        }

        // we remove conjunction from elementList
        var newElementList = [];
        for(var i = 0, j = 0, length = elementList.length; i < length; i++)
        {
            if(elementList[i].category !== JSrealB.Config.get("feature.category.word.conjunction"))
            {
                newElementList[j++] = elementList[i];
            }
        }
        elementList = newElementList;
    }
    
    var result = this.printEachElement(elementList, separator, lastSeparator);

    var addFullStop = false;
    var upperCaseFirstLetter = false;
    var punctPoints=[JSrealB.Config.get("rule.sentence_type.int.punctuation"),
                     JSrealB.Config.get("rule.sentence_type.exc.punctuation")];
    if(this.parent === null
        && this.category === JSrealB.Config.get("feature.category.phrase.sentence"))
    {
        addFullStop = (this.getCtx(JSrealB.Config.get("feature.typography.surround")).length == 0);
        upperCaseFirstLetter = (this.getCtx(JSrealB.Config.get("feature.typography.ucfirst")) === null);
        var lastChar = result.substring(result.length-1); 
        // in case the last token already has punctuation...
        var lastPunctuation=punctPoints.indexOf(lastChar)>=0?lastChar:"";
        var interro = this.getCtx(JSrealB.Config.get("feature.sentence_type.interrogative"));
        if(interro == true && lastChar!=JSrealB.Config.get("rule.sentence_type.int.punctuation")){
          lastPunctuation += JSrealB.Config.get("rule.sentence_type.int.punctuation");
          // if(this.getCtx("firstAux")!=null)result= this.getCtx("firstAux")+" "+result;  
        } 
        var exclama = this.getCtx(JSrealB.Config.get("feature.sentence_type.alias"))[JSrealB.Config.get("feature.sentence_type.exclamative")];
        if(!interro && exclama == true && lastChar!=JSrealB.Config.get("rule.sentence_type.exc.punctuation")) 
            lastPunctuation += JSrealB.Config.get("rule.sentence_type.exc.punctuation");
        if(lastPunctuation == undefined){
            lastPunctuation += JSrealB.Config.get("rule.sentence_type.dec.punctuation");
        }

    }
    
    result = phraseFormatting(result, upperCaseFirstLetter, addFullStop, lastPunctuation);
    
    return result;
};

JSrealE.prototype.printEachElement = function(elementList, separator, lastSeparator) {
    var result = "";
    var i, listLength;
    var currentSeparator = "";
    var elm = null;
    for(i = 0, listLength = elementList.length; i < listLength; i++)
    {
        elm = elementList[i];
        
        if(i === listLength - 1) // dernier
        {
            currentSeparator = "";
        }
        else if(elm instanceof JSrealE && elm.getCtx(JSrealB.Config.get("feature.liaison.alias")) == true)
        {
            currentSeparator = "-";
        }
        else if(i === listLength - 2) // avant dernier
        {
            currentSeparator = lastSeparator;
        }        
        else
        {
            currentSeparator = separator;
        }

        if(elm instanceof JSrealE)
        {
            if(elm.realization !== null && elm.realization !== undefined)
            {
                result += elm.realization + currentSeparator;
            }
            else if(elm.unit !== null && elm.unit !== undefined)
            {
                result += "[[" + elm.unit + "]]" + currentSeparator;
            }
            else
            {
                JSrealB.Logger.alert("Undefined unit and realization attributes of element : " + JSON.stringify(elm));
            }
        }
        else if(isString(elm))
        {
            result += elm + currentSeparator;
        }
    }
    // HACK: OUACHE... patch quand certains types de question terminent par "par"
    if (result.endsWith(" par")){
        if (result.startsWith("qui est-ce")) {
            result="par qui"+" "+ result.substring(3,result.length-4);
        } else if (result.startsWith("qu'est-ce que")){
            result="par quoi"+" "+result.substring(3,result.length-4);
        }
    }
    return result;
};

JSrealE.prototype.realizeTerminalElement = function() {
    // console.log("realizeTerminalElement:",this);
    if (this.elements.length === 0)
    {
        if (this.transformation === JSrealE.ruleType.declension)
        {
            return this.realizeDeclension();
        }
        else if (this.transformation === JSrealE.ruleType.conjugation){
            var conjugation = this.realizeConjugation();
            //La forme interrogative anglaise met le premier auxiliaire au début
            if (JSrealB.Config.get("language")=="en") {
                try {
                    var firstAux=this.getTreeRoot(false).getCtx("firstAux");
                    if (firstAux!=null)
                        return this.realization;
                    var intCtx = this.getTreeRoot(false).getCtx( //GL juillet 2017 (true=>false)
                        JSrealB.Config.get("feature.sentence_type.alias")+"."+
                        JSrealB.Config.get("feature.sentence_type.interrogative"))
                    if (intCtx==true 
                        || contains(JSrealB.Config.get("feature.sentence_type.interro_prefix"),intCtx))
                        conjugation = this.putAuxInFront(conjugation);
                } catch (e){
                    // console.warn("Error while moving aux:"+e) //GL spurious message when generating only single NP or VP
                }
            } 
            return conjugation;
        }
        else if(this.transformation === JSrealE.ruleType.regular)
        {
            return this.realizeRegularTransformation();
        }
        else if(this.transformation === JSrealE.ruleType.none)
        {
            return this.unit;
        }
        else if(this.transformation === JSrealE.ruleType.date)
        {
            return this.realizeDate();
        }
        else if(this.transformation === JSrealE.ruleType.number)
        {
            return this.realizeNumber();
        }
        else
        {
            return "[[" + this.unit + "]]";
        }
    }
    
    return null;
};

JSrealE.prototype.putAuxInFront = function(conjug) {    
    // Get first token which is the auxiliary possibly followed by not 
    // HACK: we consider that there is no HMTL tag between the auxiliary and not
    // variation on sepWordREen used for elision
    var auxWordsRE=/(([^<\w'-]*(<[^>]+>)?)*)([\w'-]+( +not)?)?/yi
    var auxWords=auxWordsRE.exec(conjug);
    var sep=auxWords[1], aux=auxWords[4];
    if (aux===undefined) return conjug; // only a separator found
    var res=(sep===undefined)?"":sep;
    // put aux as root
    var roote = this.getTreeRoot();
    roote.setCtx("firstAux",aux);
    // return first sep (possibly start of html tag and the rest of string )
    return sep+conjug.substring(auxWordsRE.lastIndex);
};

JSrealE.prototype.realizeConjugation = function() {
    var tense = this.getProp(JSrealB.Config.get("feature.tense.alias"));
    if( tense == JSrealB.Config.get("feature.tense.imperative.present")){
        this.defaultProp[JSrealB.Config.get("feature.person.alias")] = JSrealB.Config.get("feature.person.p2");
    }
    var person = this.getProp(JSrealB.Config.get("feature.person.alias"));
    var number = this.getProp(JSrealB.Config.get("feature.number.alias"));

    var gender = this.getProp(JSrealB.Config.get("feature.gender.alias"));
    var verbOptions = { neg: this.getProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.negation")),
                        pas: this.getProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.passive")) || 
                            this.getInitProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.passive")),
                        prog:this.getProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.progressive")),
                        perf:this.getProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.perfect")),
                        hasSubject:this.getProp(JSrealB.Config.get("feature.verb_option.alias")+".hasSubject")};
                        
    // get info about interrogative
    try{
        verbOptions.interro = this.getTreeRoot(true).getCtx(JSrealB.Config.get("feature.sentence_type.alias")
                                                              +"."+JSrealB.Config.get("feature.sentence_type.interrogative"));
        //if(this.getTreeRoot(true).getCtx("firstAux")!=null)verbOptions.interro = "old";
    }catch(e){}
    // get info about modality
    try{
        var allModPrefixes=JSrealB.Config.get("feature.sentence_type.modality_prefix");
        var value= this.getTreeRoot(true).getCtx(JSrealB.Config.get("feature.sentence_type.alias")
                                                 +"."+JSrealB.Config.get("feature.sentence_type.modality"));
        for (key in allModPrefixes){
            if (value == allModPrefixes[key]){
                verbOptions.modality = key;
                break;
            }
        }
        // if(this.getTreeRoot(true).getCtx("firstAux")!=null)verbOptions.interro = "old";
    }catch(e){}

    var aux = this.getProp(JSrealB.Config.get("rule.compound.alias"));
    try{
        if(contains(JSrealB.Config.get("rule.compound.aux"),aux)){
            var auxF=aux;
        }
    }
    catch(e){var auxF="";/*english doesn't have rule.compund.aux*/}

    var cdProp = this.getProp(JSrealB.Config.get("feature.cdInfo.alias"));
    if(this.getInitProp(JSrealB.Config.get("feature.verb_option.alias")+"."+JSrealB.Config.get("feature.verb_option.passive")) == true){
        verbOptions.pas = true;
    }
    if(!(verbOptions.prog == true || verbOptions.pas == true || verbOptions.perf == true)){
        verbOptions.native = true; //needed for simple tense negative in english 
    }
    if(number === JSrealB.Config.get("feature.number.plural"))
    {
        person = parseInt(person)+3;
    }
    return JSrealB.Module.Conjugation.conjugate(this.unit, tense, person, gender, verbOptions, cdProp, auxF);
};

JSrealE.prototype.getFirst = function(alias) {
    for(var i = 0, imax = this.elements.length; i < imax; i++){
        if(this.elements[i].category == alias || alias == "any"){
            return this.elements[i];
        }
    }
    return null;
}

JSrealE.prototype.realizeDeclension = function() {
    var feature = {};
    feature[(JSrealB.Config.get("feature.gender.alias"))] = this.getProp(JSrealB.Config.get("feature.gender.alias"));
    feature[(JSrealB.Config.get("feature.number.alias"))] = this.getProp(JSrealB.Config.get("feature.number.alias"));
    feature[(JSrealB.Config.get("feature.form.alias"))] = this.getProp(JSrealB.Config.get("feature.form.alias"));
    feature[(JSrealB.Config.get("feature.person.alias"))] = this.getProp(JSrealB.Config.get("feature.person.alias"));
    feature[(JSrealB.Config.get("feature.owner.alias"))] = this.getProp(JSrealB.Config.get("feature.owner.alias"));

    return JSrealB.Module.Declension.decline(this.unit, this.category, feature);
};

JSrealE.prototype.realizeRegularTransformation = function() {
    return JSrealB.Module.RegularRule.apply(this.unit, this.category);
};

JSrealE.prototype.realizeDate = function() {
    var date;
    if(this.unit instanceof Date)
    {
        date = this.unit;
    }
    else if(typeof this.unit === "string"
            && this.unit.length > 0
            && (new Date(this.unit)).toString() === "Invalid Date")
    {
        throw JSrealB.Exception.wrongDate(this.unit);
    }
    else if(typeof this.unit === "string")
    {
        date = new Date(this.unit);
    }
    else
    {
        date = new Date();
    }
    
    if(this.getCtx(JSrealB.Config.get("feature.display_option.alias") 
            + "." + JSrealB.Config.get("feature.display_option.relative_time")))
    {
        return JSrealB.Module.Date.toRelativeTime(date, this.getCtx(JSrealB.Config.get("feature.display_option.alias")));
    }
    else if(this.getCtx(JSrealB.Config.get("feature.display_option.alias") 
            + "." + JSrealB.Config.get("feature.display_option.natural")))
    {
        return JSrealB.Module.Date.toWord(date, this.getCtx(JSrealB.Config.get("feature.display_option.alias")));
    }
    else
    {
        return JSrealB.Module.Date.formatter(date, this.getCtx(JSrealB.Config.get("feature.display_option.alias")));
    }
};

JSrealE.prototype.realizeNumber = function() {
    var currentElement = this;
    var number = this.unit;

    
    var updateGrammaticalNumber = function(grammaticalNumber) {
        currentElement.setDefaultProp(JSrealB.Config.get("feature.number.alias"), grammaticalNumber);
    }
    var optionAlias=JSrealB.Config.get("feature.display_option.alias")+ "."
    if(this.getCtx( optionAlias + JSrealB.Config.get("feature.display_option.raw")))
    {
        return number.toString();
    }
    
    else if(this.getCtx(optionAlias + JSrealB.Config.get("feature.display_option.natural"))
         || this.getCtx(optionAlias + JSrealB.Config.get("feature.display_option.ordinal")))
    {   
        try{
            if(this.getProp(JSrealB.Config.get("feature.gender.alias"))){
                var numGender = this.getProp(JSrealB.Config.get("feature.gender.alias"));
            }
            else if(this.parent != null){
                var noyau = this.parent.constituents.head;
                if(noyau !== undefined && noyau !== null){
                    var numGender = noyau.getProp(JSrealB.Config.get("feature.gender.alias"));
                }else{var numGender = "m"}
            } else {
                var numGender = "m"
            };
            if (this.getCtx(optionAlias + JSrealB.Config.get("feature.display_option.ordinal")))
                return JSrealB.Module.Number.toOrdinal(
                    number, 
                    this.getCtx(JSrealB.Config.get("feature.display_option.alias")
                        + "." + JSrealB.Config.get("feature.display_option.max_precision")), 
                    function(grammaticalNumber) {//GL ensure singular for ordinal
                        currentElement.setDefaultProp(JSrealB.Config.get("feature.number.alias"),
                                                      JSrealB.Config.get("feature.number.singular"));
                    },
                    JSrealB.Config.get("language"), numGender).toString();
            else
                return JSrealB.Module.Number.toWord(
                    number, 
                    this.getCtx(JSrealB.Config.get("feature.display_option.alias")
                        + "." + JSrealB.Config.get("feature.display_option.max_precision")), 
                    updateGrammaticalNumber,
                    JSrealB.Config.get("language"), numGender).toString();
            }
        catch(e){
            console.warn("Error with number to word:"+e)
        }
        
    }
    else
    {   //enters here     
        return JSrealB.Module.Number.formatter(number, 
                this.getCtx(JSrealB.Config.get("feature.display_option.alias")
                + "." + JSrealB.Config.get("feature.display_option.max_precision")), 
                updateGrammaticalNumber).toString();
    }
};

JSrealE.prototype.typography = function(str) {
    var result = str;
    if(this.getCtx(JSrealB.Config.get("feature.typography.ucfirst")) === true)
    {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    var pcBefore = this.getCtx(JSrealB.Config.get("feature.typography.before"));
    if(pcBefore !== null)
    {
        result = JSrealB.Module.Punctuation.before(result, pcBefore);
    }
    
    var pcAfter = this.getCtx(JSrealB.Config.get("feature.typography.after"));
    if(pcAfter !== null)
    {
        result = JSrealB.Module.Punctuation.after(result, pcAfter);
    }
    
    var pcSurround = this.getCtx(JSrealB.Config.get("feature.typography.surround")); //liste de surround
    if(pcSurround.length > 0){
        for(var i=0; i < pcSurround.length; i++){
            result = JSrealB.Module.Punctuation.surround(result, pcSurround[i]);    
        }        
    }
    
    return trim(result);
};

JSrealE.prototype.html = function(content) {
    var output = content;
    
    var htmltags = this.getCtx(JSrealB.Config.get("feature.html.alias")); //liste de paires elm/attr
    
    var addTag = function(elt, attr){
        var attrStr = "";
        if(attr !== null && attr !== undefined)
        {
            var attrKeyList = Object.keys(attr);
            var length = attrKeyList.length;
            for(var i = 0; i < length; i++)
            {
                attrStr += " " + attrKeyList[i] + '="' + attr[attrKeyList[i]] + '"';
            }
        }
        return "<" + elt + attrStr + ">" + output + "</" + elt + ">";

    }

    if(htmltags.length > 0)
    {
        if(Array.isArray(htmltags)){
            //this.setCtx("htmlTags",elt.length);
            for(var i=0; i < htmltags.length; i++){
            
                var elt = htmltags[i][0];
                var attr = htmltags[i][1];
                output = addTag(elt, attr);
            }
        }
        else{
            output = addTag(elts, attrs);                
        }
        
    }
    return output;
};

JSrealE.prototype.phonetic = function(content) {
    // console.log("phonetic:%s",content)
    if (JSrealB.Config.get("language")=="fr"){
        // if (content === null) return "* aucune réalisation *";
        if (content === null) return "";
        var res=elisionFr(content);
        // console.log("fr:%s",res)
        return res;
    } else {
        // if (content === null) return "* no realisation *";
        if (content === null) return "";
        var res=elisionEn(content);
        // console.log("en:%s",res)
        return res;
    }
};

//// Utils
var phraseFormatting = function(str, upperCaseFirstLetter, addFullStop, lastPunctuation, prefix) {
    lastPunctuation = lastPunctuation || ".";
    prefix = prefix || null;
    // replace multiple spaces with a single space
    var newString = str.replace(/\s{2,}/g, ' ');
    

    if(prefix!=null){
        //ajout d'un prefixe ex.: Est-ce que
        newString = prefix+" "+newString;
    }

    if(upperCaseFirstLetter)
    {
        var stringWithoutLeftHtml = stripLeftHtml(newString);
        newString = ((newString.charAt(0) === "<") ? newString.slice(0, newString.indexOf(stringWithoutLeftHtml)) : "") 
            + stringWithoutLeftHtml.charAt(0).toUpperCase() + stringWithoutLeftHtml.slice(1); // first char in upper case
    }
    
    if(addFullStop)
    {
        if(JSrealB.Module.Punctuation.isValid(lastPunctuation)){
            newString = JSrealB.Module.Punctuation.after(newString, lastPunctuation);
        }
        else{
            newString = JSrealB.Module.Punctuation.after(newString, "."); // add full stop
        }
    }
    
    newString = trim(newString);
    
    return newString;
};


// *** the elision module can be tested separately in the file elision.js

//// English elision rule only for changing "a" to "an"
// according to https://owl.english.purdue.edu/owl/resource/591/1/
var hAnRE=/^(heir|herb|honest|honou?r|hour)/i;
//https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
acronymRE=/^[A-Z]+$/
punctuationRE=/[,:\.\[\]\(\)\?"']/

// regex for matching (ouch!!! it is quite subtle...) 
//     1-possible non-word chars and optional html tags
//     4-following word  
var sepWordREen=/(([^<\w'-]*(<[^>]+>)?)*)([\w'-]+)?/yi

function elisionEn(content){
    sepWordREen.lastIndex=0; // make sure to restart matching
    var sepWord=sepWordREen.exec(content);
    if (sepWord===null) return content;
    var previous="", sep=sepWord[1], current=sepWord[4];
    if (current===undefined) return content; // only a separator found
    var res=(sep===undefined)?"":sep;
    while ((sepWord=sepWordREen.exec(content))!==null){
        previous=current; sep=sepWord[1]; current=sepWord[4];
        if (sep===undefined)sep="";
        if (current===undefined){
                return res+previous+sep;
        }
        // console.log("%s:%s:%s",previous,sep,current)
        if (previous=="a" || previous=="A"){
            if (!punctuationRE.exec(sep)){   // do not elide over punctuation
                if (/^[aeio]/i.exec(current) ||   // start with a vowel
                    (current.charAt(0)=="u" && !uLikeYouRE.exec(current)) || // u does not sound like you
                    hAnRE.exec(current) ||       // silent h
                    acronymRE.exec(current)) {   // is an acronym
                        res=res+(previous=="a"?"an":"An")+sep;
                        continue;
                }
            }
        }
        res=res+previous+sep; // copy input
    }
    return res+current;
}

//// Elision rules for French
// implements the obligatory elision rules of the "Office de la langue française du Québec"
//    http://bdl.oqlf.gouv.qc.ca/bdl/gabarit_bdl.asp?Th=2&t1=&id=1737
// but does not always taking into account the actual part of speech
// only takes the first case from the lexicon

// for Euphonie, rules were taken from Antidote V9

// same as sepWordREen but the [\w] class extended with French Accented letters and cedilla
var sepWordREfr=/(([^<\wàâéèêëîïôöùüç'-]*(<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?/yi

var elidableWordFrRE=/^(la|le|je|me|te|se|de|ne|que|puisque|lorsque|jusque|quoique)$/i
var euphonieFrRE=/^(ma|ta|sa|ce|beau|fou|mou|nouveau|vieux)$/i
var euphonieFrTable={"ma":"mon","ta":"ton","sa":"son","ce":"cet",
    "beau":"bel","fou":"fol","mou":"mol","nouveau":"nouvel","vieux":"vieil"};

var contractionFrTable={
    "à+le":"au","à+les":"aux","ça+a":"ç'a",
    "de+le":"du","de+les":"des","de+des":"de","de+autres":"d'autres",
    "des+autres":"d'autres",
    "si+il":"s'il","si+ils":"s'ils"};

function lookUp(entry,table){
    var res=table[entry.toLowerCase()]
    if (res==null) return null;
    var c=entry.charAt(0);
    if (c.toUpperCase()==c){
        return res.charAt(0).toUpperCase()+res.slice(1)
    }
    return res;
}

function elisionFr(content){
    sepWordREfr.lastIndex=0; // make sure to restart matching
    var sepWord=sepWordREfr.exec(content)
    if (sepWord===null) return content;
    var previous="",sep=sepWord[1], current=sepWord[4];
    if (current===undefined) return content; // only a separator found
    var res=(sep===undefined)?"":sep;
    // split content into a list of tokens [content_0, sep_0, content_1, sep_1,...]
    // to allow an easier look ahead in the case of a contraction followed by an elision
    var tokens=[current];
    while ((sepWord=sepWordREfr.exec(content))!==null){
        sep=sepWord[1];
        if (sep===undefined)sep="";
        tokens.push(sep);
        current=sepWord[4];
        if (current==undefined)break;
        tokens.push(current);
    }
    // console.log("tokens:%d:%s",tokens.length,tokens);
    current=tokens[0];
    if(tokens.length==1)return current;
    var i=2;
    while (i<tokens.length){
        previous=current; sep=tokens[i-1]; current=tokens[i];
        // console.log("%d::previous:%s;sep:%s;current:%s",i,previous,sep,current);
        if (!punctuationRE.exec(sep)){   // do not elide over punctuation
            if (elidableWordFrRE.exec(previous) && isElidableFr(current)){
                res=res+previous.slice(0,-1)+"'"+sep.trim();
            } else if (euphonieFrRE.exec(previous) && isElidableFr(current)){ // euphonie
                    if (/ce/i.exec(previous) && /(^est$)|(^étai)/.exec(current)){
                        // very special case but very frequent
                        res=res+previous.slice(0,-1)+"'"+sep.trim();
                    } else {
                        res=res+lookUp(previous,euphonieFrTable)+sep;
                    }
            } else if ((contr=lookUp(previous+"+"+current,contractionFrTable))!=null){
                // check if the next word would be elidable, so instead elide it instead of contracting
                if (elidableWordFrRE.exec(current) && i+2<tokens.length && isElidableFr(tokens[i+2])){
                    res=res+previous+sep+current.slice(0,-1)+"'"+tokens[i+1].trim();
                    current=tokens[i+2];
                    i+=2;
                } else {
                    res=res+contr+sep.trim();
                    current="";// to force the loop to ignore current
                }
            } else {
                res=res+previous+sep; // copy input
            }
        } else {
            res=res+previous+sep; // copy input
        }
        i+=2;
    }
    res+=current
    // add last separator
    if (tokens.length%2==0)res+=tokens[tokens.length-1]
    return res;
}

function isElidableFr(word){
    if (/^[aeiouàâéèêëîïôöùü]/i.exec(word)) return true;
    if (/^h/i.exec(word) && !hAspire(word)) return true;
    return false;
}
// ******* end of elision.js

function hAspire(word){
    var w=JSrealB.Config.get("lexicon")[word];
    if (w && Object.values(w)[0].h==1) return true;
    return false;
}

//// Word category
var N = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.noun"), JSrealE.ruleType.declension);
};

var A = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.adjective"), JSrealE.ruleType.declension);
};

var Pro = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.pronoun"), JSrealE.ruleType.declension);
};

var D = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.determiner"), JSrealE.ruleType.declension);
};

var V = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.verb"), JSrealE.ruleType.conjugation);
};

V.prototype.putAuxInFront = function(conjug) {
    //GL by default does not do anything (useful only for English)
    return conjug;
};

var Adv = function(unit) {
    if(JSrealB.Config.get("language") === JSrealE.language.english)
    {
        return new JSrealE(unit, JSrealB.Config.get("feature.category.word.adverb"), JSrealE.ruleType.declension);
    }
    
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.adverb"), JSrealE.ruleType.regular);
};

var P = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.preposition"), JSrealE.ruleType.regular);
};

var C = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.word.conjunction"), JSrealE.ruleType.none);
};
//GL ajout du Quoted text pour permettre des options sur du texte
var Q = function(unit) {
    return new JSrealE(unit, JSrealB.Config.get("feature.category.quoted"), JSrealE.ruleType.none);
};

//// Phrase
/// Sentence
var S = function(childrenElt) {
    if(!(this instanceof S))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new S_FR(arguments);
        }
        else
        {
            return new S_EN(arguments);
        }
    }    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.sentence"));
};
extend(JSrealE, S);

S.prototype.sortWord = function() {
    this.constituents.head = null;
    
    var eS;
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        eS = this.elements[i];

        switch(eS.category)
        {
            case JSrealB.Config.get("feature.category.phrase.verb"):
            case JSrealB.Config.get("feature.category.word.verb"): // essai pour rendre le programme pour souple.
                this.addConstituent(eS, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
                if(this.constituents.head === null) // before verb
                {
                        this.addConstituent(eS, JSrealE.grammaticalFunction.modifier);
                    break;
                }
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
                this.addConstituent(eS, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eS, JSrealE.grammaticalFunction.complement);
        }
    }

    return this;
};

///Propositional phrase
var SP = function(childrenElt) {
    if(!(this instanceof SP))
    {
        return new SP(arguments);
    }

    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.propositional"), JSrealE.ruleType.none)
}
extend(JSrealE, SP);

SP.prototype.sortWord = function() { 
    //same as sentence from here
    this.constituents.head = null;
    
    var eSP;
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        eSP = this.elements[i];

        switch(eSP.category)
        {
            case JSrealB.Config.get("feature.category.phrase.verb"):
                this.addConstituent(eSP, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
                if(this.constituents.head === null) // before verb
                {
                        this.addConstituent(eSP, JSrealE.grammaticalFunction.modifier);
                    break;
                }
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
                this.addConstituent(eSP, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eSP, JSrealE.grammaticalFunction.complement);
        }
    }

}
var S_FR = function(childrenElt) {
    S.call(this, childrenElt);
};
extend(S, S_FR);

var S_EN = function(childrenElt) {
    S.call(this, childrenElt);
};
extend(S, S_EN);

S_FR.prototype.interrogationForm = function(int) {
    switch(int){
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.default"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.yesOrNo"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.where"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.how"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.when"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.why"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.howMuch"):
        break;
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoSubject"):
        var sujP = getSubject(this); //subject position
        if(sujP != -1){
            this.deleteElement(sujP);
            // s'assurer de mettre le verbe à la troisième personne du singulier car le sujet sera
            //  qui est-ce qui?
            var verbe = this.constituents.head;
            verbe.setChildrenProp("n","s");
            verbe.setChildrenProp("pe",3);
            this.resetProp(true);
        }
        break;
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoDirect"):
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.whatDirect"):
        var vP = getGroup(this,JSrealB.Config.get("feature.category.phrase.verb"));
        var cdP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.phrase.noun"));
        var vvP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.word.verb"));
        var proP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.word.pronoun"));
        if(vP != -1 && cdP != -1){
            this.elements[vP].deleteElement(cdP);
        } 
        if(vP != -1 && proP != -1 && vvP != -1 && proP < vvP){
            //object direct pronominalisé
            this.elements[vP].deleteElement(proP);
        }
        break;
    case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoIndirect"):
        var vP = getGroup(this,JSrealB.Config.get("feature.category.phrase.verb"));
        var ciP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.phrase.prepositional"));
        if(vP != -1 && ciP != -1){
            this.elements[vP].deleteElement(ciP);
        } 
        break;
    }
    this.addNewElement(0,JSrealB.Config.get("rule.sentence_type.int.prefix")[int]);
    fetchFromObject(this.ctx, JSrealB.Config.get("feature.sentence_type.alias")
        +"."+JSrealB.Config.get("feature.sentence_type.interrogative"), false); // set int:false (end recursion)
    this.setCtx(JSrealB.Config.get("feature.sentence_type.interrogative"),true); //for later use in punctuation

    return true;
}

S_EN.prototype.interrogationForm = function(int) {
    var change=false;
    switch(int){
        //remove specific part of phrase
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.where"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.how"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.when"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.why"):
            break;
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoSubject"):
            var sujP = getSubject(this); //subject position
            if(sujP != -1){
                this.deleteElement(sujP);
                // ensure that the verb will be at the 3rd person singular because the subject will be 
                //  who?
                var verbe = this.constituents.head;
                verbe.setChildrenProp("n","s");
                verbe.setChildrenProp("pe",3);
                // this.resetProp(true);
                change = true;
            }
            break;
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoDirect"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whatDirect"):
            var vP = getGroup(this,JSrealB.Config.get("feature.category.phrase.verb"));
            var cdP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.phrase.noun"));
            if (cdP == -1) cdP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.word.pronoun"));
            if(vP != -1 && cdP != -1){
                this.elements[vP].deleteElement(cdP);
                change = true; 
            } 
            break;
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoIndirect"):
            var vP = getGroup(this,JSrealB.Config.get("feature.category.phrase.verb"));
            var ciP = getGroup(this.elements[vP],JSrealB.Config.get("feature.category.phrase.prepositional"));
            if(vP != -1 && ciP != -1){
                this.elements[vP].deleteElement(ciP);
                change = true; 
            } 
            break;
    }
    //Add prefix + first aux(from Ctx)
    switch(int){
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoDirect"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whatDirect"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoIndirect"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.where"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.how"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.when"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.why"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.howMuch"):
        case JSrealB.Config.get("feature.sentence_type.interro_prefix.whoSubject"):
            var prefix = JSrealB.Config.get("rule.sentence_type.int.prefix")[int]
            var aux=this.getCtx("firstAux");
            if(this.getCtx("firstAux")!=null){
                prefix+=" "+aux
            }           
            this.addNewElement(0,prefix);
            break;
        default:
            if(this.getCtx("firstAux")!=null){
                this.addNewElement(0,this.getCtx("firstAux"));
            }           
    }

    fetchFromObject(this.ctx, JSrealB.Config.get("feature.sentence_type.alias")
        +"."+JSrealB.Config.get("feature.sentence_type.interrogative"), false); // set int:false (end recursion)
    this.setCtx(JSrealB.Config.get("feature.sentence_type.interrogative"),true); //for later use in punctuation

    return change;
}
    

/// Coordinated Phrase
var CP = function(childrenElt) {
    if(!(this instanceof CP))
    {
        return new CP(arguments);
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.coordinated"));
};
extend(JSrealE, CP);

CP.prototype.sortWord = function() {
    this.constituents.head = null;
    
    var eCP;
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        eCP = this.elements[i];
        
        switch (eCP.category) {
            case JSrealB.Config.get("feature.category.word.conjunction"):
                this.setCtx(JSrealB.Config.get("feature.category.word.conjunction"), eCP.unit);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
                this.addConstituent(eCP, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eCP, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

CP.prototype.elementToPhrasePropagation = function(element) {
    if (!element.elements)return this;//GL ignorer dans le cas des chaines littérales   
    // Person
    var phrasePerson = this.getChildrenProp(JSrealB.Config.get("feature.person.alias"));
    var elementPerson = (element.elements.length > 0) 
        ? element.getChildrenProp(JSrealB.Config.get("feature.person.alias"))
        : element.getProp(JSrealB.Config.get("feature.person.alias"));

    if(phrasePerson === null)
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.person.alias")]);
    }
    else if(phrasePerson === JSrealB.Config.get("feature.person.p1")
            || elementPerson === JSrealB.Config.get("feature.person.p1"))
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.person.alias")], [JSrealB.Config.get("feature.person.p1")]);
    }
    else if (phrasePerson === JSrealB.Config.get("feature.person.p2")
            || elementPerson === JSrealB.Config.get("feature.person.p2"))
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.person.alias")], [JSrealB.Config.get("feature.person.p2")]);
    }
    else
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.person.alias")], [JSrealB.Config.get("feature.person.p3")]);
    }
    
    // Number
    if(this.elements.length <= 2) // At least 1 coordinate + 2 elements
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.number.alias")], [JSrealB.Config.get("feature.number.singular")]);
    }
    else
    {
        var conjunction = this.getCtx(JSrealB.Config.get("feature.category.word.conjunction"));
        if(conjunction == JSrealB.Config.get("rule.union")){
            element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.number.alias")], [this.getProp(JSrealB.Config.get("feature.number.alias")) || JSrealB.Config.get("feature.number.singular")]);
        }
        else{
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.number.alias")], [JSrealB.Config.get("feature.number.plural")]);

        }
    }
    
    // Gender
    var phraseGender = this.getChildrenProp(JSrealB.Config.get("feature.gender.alias"));
    var elementGender = (element.elements.length > 0) 
        ? element.getChildrenProp(JSrealB.Config.get("feature.gender.alias"))
        : element.getProp(JSrealB.Config.get("feature.gender.alias"));
    if(phraseGender === null)
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.gender.alias")]);
    }
    else if(phraseGender !== elementGender)
    {
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.gender.alias")], [JSrealB.Config.get("feature.gender.masculine")]);
    }
    
    return this;
};

/// Verb Phrase VP
var VP = function(childrenElt) {
    if(!(this instanceof VP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new VP_FR(arguments);
        }
        else
        {
            return new VP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.verb"));
};
extend(JSrealE, VP);

VP.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eVP = this.elements[i];
        switch(eVP.category)
        {          
            case JSrealB.Config.get("feature.category.word.verb"):
                this.addConstituent(eVP, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.pronoun"):
                this.addConstituent(eVP, 
                    getLanguage()=="fr"?JSrealE.grammaticalFunction.modifier // put pronoun before verb in French
                           :JSrealE.grammaticalFunction.complement);
            break;
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
            //essai pour les cas "jolie et belle"
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                this.addConstituent(eVP, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eVP, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

VP.prototype.elementToPhrasePropagation = function(element) {
    // do not propagate all values out of a VP (i.e. a number that would propagate to complements)
    // e.g. S(VP(V("run").n("p")),NP(N("mile"))) produced "run miles"
    // only propagate verb options
    var propNames=[];
    var propValues=[];
    
    var groupPropNameList = this.getPropNameList([this.prop,this.defaultProp,this.childrenProp]);
    for (var i = 0; i < groupPropNameList.length; i++) {
        var propName=groupPropNameList[i];
        if (propName.startsWith("vOpt.")){
            propNames.push(propName);
            var val=this.getProp(propName);
            propValues.push(val);
        }
    }
    if(element.fct === JSrealE.grammaticalFunction.head){
        element.bottomUpFeaturePropagation(this,propNames,propValues);
    }
}

var VP_FR = function(childrenElt) {
    VP.call(this, childrenElt);
};
extend(VP, VP_FR);

var VP_EN = function(childrenElt) {
    VP.call(this, childrenElt);
};
extend(VP, VP_EN);

/// Noun Phrase
var NP = function(childrenElt) {
    if(!(this instanceof NP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new NP_FR(arguments);
        }
        else
        {
            return new NP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.noun"));
};
extend(JSrealE, NP);

NP.prototype.sortWord = function() {};

var NP_FR = function(childrenElt) {
    NP.call(this, childrenElt);
};
extend(NP, NP_FR);

NP_FR.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eNP = this.elements[i];
        
        switch (eNP.category) {
            case JSrealB.Config.get("feature.numerical.alias"):
                this.addConstituent(eNP, JSrealE.grammaticalFunction.modifier);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                if(this.constituents.head === undefined)
                {
                    this.addConstituent(eNP, JSrealE.grammaticalFunction.head);
                }
                else
                {
                    this.addConstituent(eNP, JSrealE.grammaticalFunction.complement);
                }
            break;
            case JSrealB.Config.get("feature.category.word.determiner"):
            case JSrealB.Config.get("feature.category.word.adverb"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.phrase.propositional"): // only gender of head word in french?
            //ajout pour accord du participe passé employé seul
            case JSrealB.Config.get("feature.category.word.verb"):
                this.addConstituent(eNP, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eNP, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

//Element to element propagation needs to be a little different for subordinate
NP.prototype.elementToElementPropagation = function(element) {
    if(element.fct === JSrealE.grammaticalFunction.modifier) 
    {
        if(this.constituents.head !== undefined && this.constituents.head !== null)
        {
            element.siblingFeaturePropagation(this.constituents.head);
        }
    }
    else if(element.fct === JSrealE.grammaticalFunction.head)
    {
        if(this.constituents.modifier.length > 0)
        {
            for(var i = 0, length = this.constituents.modifier.length; i < length; i++){
                element.siblingFeaturePropagation(this.constituents.modifier[i]);    
            }            
        }
           
        for(var i = 0, length = this.constituents.subordinate.length; i < length; i++)
        {
            if(this.constituents.subordinate[i].category == "SP"){
                var groupPropNameList = Object.keys(element.prop).concat(Object.keys(element.defaultProp));

                var j, nbGroupProp;
                var npInfo = {};
                for(j = 0, nbGroupProp = groupPropNameList.length; j < nbGroupProp; j++)
                {   
                    npInfo[groupPropNameList[j]] = element.getProp(groupPropNameList[j])
                }
                // var pronomSub = this.constituents.subordinate[i].getProp(JSrealB.Config.get("feature.propositional.pronoun.alias"));
                if(JSrealB.Config.get("language") === JSrealE.language.french){
                    var pronomSub = this.constituents.subordinate[i].getFirst("Pro");
                    if (pronomSub!=null){
                        if(pronomSub.unit == JSrealB.Config.get("rule.propositional.base")){
                            this.constituents.subordinate[i].setProp(JSrealB.Config.get("feature.cdInfo.alias"),npInfo);
                        }
                        else if(pronomSub.unit == JSrealB.Config.get("rule.propositional.subject")){
                            for(var key in npInfo){
                                pronomSub.setProp(key,npInfo[key]);
                            } 
                        }
                    } else {
                        var firstWord = this.constituents.subordinate[i].getFirst("any");
                        if(firstWord.unit == JSrealB.Config.get("rule.propositional.subject")){
                            for(var key in npInfo){
                                firstWord.setProp(key,npInfo[key]);
                            }
                        }
                    }
                }
                else{
                    var firstWord = this.constituents.subordinate[i].getFirst("any");
                    if(firstWord.unit == JSrealB.Config.get("rule.propositional.subject")){
                        for(var key in npInfo){
                            firstWord.setProp(key,npInfo[key]);
                        }
                    }
                }
                
                
            }
            else{
                element.siblingFeaturePropagation(this.constituents.subordinate[i]);
            }
            
        }
    }
};

NP.prototype.pro = function() {
    return this.setCtx(JSrealB.Config.get("feature.toPronoun.alias"),true);
    // var nIdx = getGroup(this,JSrealB.Config.get("feature.category.word.noun"));
    // var n = this.elements[nIdx];
    // n.topDownFeaturePropagation(this); // HACK: we use topDownFeature to copy prop but in fact it is bottumUp!
    // this.unit="I" // to be changed later...
    // this.category=this.constructor=JSrealB.Config.get("feature.category.word.pronoun");
    // this.transformation=JSrealE.ruleType.declension;
    // this.elements=[]
    // return this;
}

var NP_EN = function(childrenElt) {
    NP.call(this, childrenElt);
};
extend(NP, NP_EN);

NP_EN.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eNP = this.elements[i];
        
        switch (eNP.category) {
            case JSrealB.Config.get("feature.numerical.alias"):
                this.addConstituent(eNP, JSrealE.grammaticalFunction.modifier);
            break;
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
            case JSrealB.Config.get("feature.category.quoted"):
                this.addConstituent(eNP, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.determiner"):
                var number=eNP.getProp[JSrealB.Config.get("feature.number.alias")]
                if (number!==null)
                    this.addConstituent(eNP, JSrealE.grammaticalFunction.modifier);
                else
                    this.addConstituent(eNP, JSrealE.grammaticalFunction.subordinate);
                break;
            case JSrealB.Config.get("feature.category.phrase.propositional"):
                this.addConstituent(eNP, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(eNP, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

/// Adjective Phrase AP
var AP = function(childrenElt) {
    if(!(this instanceof AP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new AP_FR(arguments);
        }
        else
        {
            return new AP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.adjective"));
};
extend(JSrealE, AP);

AP.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eAP = this.elements[i];
        
        switch (eAP.category)
        {
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
                this.addConstituent(eAP, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.adverb"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(eAP, JSrealE.grammaticalFunction.complement);
        }
    }
    return this;
};

var AP_FR = function(childrenElt) {
    AP.call(this, childrenElt);
};
extend(AP, AP_FR);

var AP_EN = function(childrenElt) {
    AP.call(this, childrenElt);
};
extend(AP, AP_EN);

/// Adverbial Phrase AdvP
var AdvP = function(childrenElt) {
    if(!(this instanceof AdvP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new AdvP_FR(arguments);
        }
        else
        {
            return new AdvP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.adverb"));
};
extend(JSrealE, AdvP);

AdvP.prototype.sortWord = function() {};

var AdvP_FR = function(childrenElt) {
    AdvP.call(this, childrenElt);
};
extend(AdvP, AdvP_FR);

AdvP_FR.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eAdv = this.elements[i];
        
        switch (eAdv.category)
        {
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.adverb"):
                this.addConstituent(eAdv, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(eAdv, JSrealE.grammaticalFunction.complement);
        }
    }
    return this;
};

var AdvP_EN = function(childrenElt) {
    AdvP.call(this, childrenElt);
};
extend(AdvP, AdvP_EN);

AdvP_EN.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var eAdv = this.elements[i];
        
        switch (eAdv.category)
        {
            case JSrealB.Config.get("feature.category.word.adverb"):                
                this.addConstituent(eAdv, JSrealE.grammaticalFunction.head); // Manner
            break;
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(eAdv, JSrealE.grammaticalFunction.complement);
        }
    }
    return this;
};

/// Prepositional Phrase PP
var PP = function(childrenElt) {
    if(!(this instanceof PP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new PP_FR(arguments);
        }
        else
        {
            return new PP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.prepositional"));
};
extend(JSrealE, PP);

PP.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var ePP = this.elements[i];
        
        switch (ePP.category) {
            case JSrealB.Config.get("feature.category.word.preposition"):
                this.addConstituent(ePP, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.verb"):
            case JSrealB.Config.get("feature.category.phrase.verb"):
            default:
                this.addConstituent(ePP, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

var PP_FR = function(childrenElt) {
    PP.call(this, childrenElt);
};
extend(PP, PP_FR);

var PP_EN = function(childrenElt) {
    PP.call(this, childrenElt);
};
extend(PP, PP_EN);

/// Blank Node
var BN  = function(childrenElt) {
    BN.call(this, childrenElt);
};
extend(JSrealE, BN);

//// Date
var DT = function(date) {
    if(!(this instanceof DT))
    {
        return new DT(date);
    }
    
    JSrealE.call(this, date, JSrealB.Config.get("feature.date.alias"), JSrealE.ruleType.date);
};
extend(JSrealE, DT);

//// Number
var NO = function(number) {
    if(!(this instanceof NO))
    {
        return new NO(number);
    }
    
    JSrealE.call(this, number, JSrealB.Config.get("feature.numerical.alias"), JSrealE.ruleType.number);
};
extend(JSrealE, NO);


/*
 * JSrealB
 */
var JSrealB = (function() {
    return {
        init: function(language, lexicon, rule, feature,lenient,lemmata) {
            this.Config.set({
                language: language,
                lexicon: lexicon,
                rule: rule,
                feature: feature,
                isDevEnv: true,
                printTrace: false,
                lenient: lenient,
                lemmata: lemmata
            });
        }
    };
})();

/**
 * Modules
 */
JSrealB.Module = {};

//// Punctuation Module
JSrealB.Module.Punctuation = (function() {
    var positionType = {
        start: 1,
        end: 2
    };
    
    var removeIncompatiblePunctuation = function(sentence, posType, pInfo) {
        var result = "";
        
        if(posType === positionType.start)
        {
            result = ltrim(sentence);
            var firstChar = "";
            var previousResult = result;
            do
            {
                firstChar = result.charAt(0);
                if(isPunctuationMark(firstChar)
                        && pInfo[JSrealB.Config.get("feature.typography.complementary")] === undefined
                        && getPunctuationInfo(firstChar)[JSrealB.Config.get("feature.typography.complementary")] === undefined)
                {
                    result = result.substring(1);
                }

                previousResult = result;
            } while(previousResult !== result);
            result = ltrim(result);
        }
        else if(posType === positionType.end)
        {
            result = rtrim(sentence);
            var lastChar = "";
            var previousResult = result;
            do
            {
                lastChar = result.charAt(result.length-1);
                if(isPunctuationMark(lastChar)
                        && pInfo[JSrealB.Config.get("feature.typography.complementary")] === undefined
                        && getPunctuationInfo(lastChar)[JSrealB.Config.get("feature.typography.complementary")] === undefined)
                {
                    result = result.substring(0, result.length - 1);
                }

                previousResult = result;
            } while(previousResult !== result);
            result = rtrim(result);
        }
        
        return result;
    };
    
    var isPunctuationMark = function(punctuation) {
        return (typeof JSrealB.Config.get("lexicon")[punctuation] !== "undefined"
            && typeof JSrealB.Config.get("lexicon")[punctuation][JSrealB.Config.get('feature.category.word.punctuation')] !== "undefined");
    };
    
    var getPunctuationInfo = function(punctuation) {
        var pInfo = null;
        
        if(!isPunctuationMark(punctuation))
        {
            throw JSrealB.Exception.wrongPunctuation(punctuation);
        }
        
        pInfo = JSrealB.Config.get("lexicon")[punctuation][JSrealB.Config.get('feature.category.word.punctuation')];
        
        return pInfo;
    };
    
    var getRuleTable = function(tableId) {
        var ruleTable = JSrealB.Config.get("rule")["punctuation"][tableId];
        
        if(ruleTable === undefined)
        {
            throw JSrealB.Exception.tableNotExists("unknown", tableId);
        }
        
        return ruleTable;
    };
    
    var applyBefore = function(sentence, punctuation) {
        var pInfo = getPunctuationInfo(punctuation);
        var ruleTable = getRuleTable(pInfo["tab"][0]);
        
        return ruleTable[JSrealB.Config.get("feature.typography.before")] 
                + punctuation 
                + ruleTable[JSrealB.Config.get("feature.typography.after")] 
                + removeIncompatiblePunctuation(sentence, positionType.start, pInfo);
    };
    
    var applyAfter = function(sentence, punctuation) {
        var pInfo = getPunctuationInfo(punctuation);
        var ruleTable = getRuleTable(pInfo["tab"][0]);
        
        return removeIncompatiblePunctuation(sentence, positionType.end, pInfo)
                + ruleTable[JSrealB.Config.get("feature.typography.before")] 
                + punctuation 
                + ruleTable[JSrealB.Config.get("feature.typography.after")];
    };
    
    var surround = function(sentence, punctuation) {
        var result = sentence;
        var pInfo = getPunctuationInfo(punctuation);
        
        if(pInfo["tab"].length > 1)
        {
            var tmpRuleTable = null;
            var ruleTable1 = getRuleTable(pInfo["tab"][0]);
            var ruleTable2 = getRuleTable(pInfo["tab"][1]);
            
            // Inversement si necessaire
            if(ruleTable1[JSrealB.Config.get("feature.typography.position.alias")] 
                    !== JSrealB.Config.get("feature.typography.position.left"))
            {
                tmpRuleTable = ruleTable1;
                ruleTable1 = ruleTable2;
                ruleTable2 = tmpRuleTable;
            }
            
            result = trim(result);
            result = ruleTable1[JSrealB.Config.get("feature.typography.before")]
                    + punctuation + ruleTable1[JSrealB.Config.get("feature.typography.after")]
                    + result
                    + ruleTable2[JSrealB.Config.get("feature.typography.before")]
                    + punctuation + ruleTable2[JSrealB.Config.get("feature.typography.after")];
        }
        else if(pInfo[JSrealB.Config.get("feature.typography.complementary")] !== undefined)
        {
            var complementary = pInfo[JSrealB.Config.get("feature.typography.complementary")];
            var ruleTable = getRuleTable(pInfo["tab"][0]);
            
            var leftPunctuation = punctuation;
            var rightPunctuation = complementary;
            
            if(ruleTable[JSrealB.Config.get("feature.typography.position.alias")] 
                    !== JSrealB.Config.get("feature.typography.position.left"))
            {
                leftPunctuation = complementary;
                rightPunctuation = punctuation;
            }
            
            var resultWithPcBefore = applyBefore(trim(result), leftPunctuation);
            var resultWithPcBeforeAndAfter = applyAfter(resultWithPcBefore, rightPunctuation);
            
            if(trim(result) !== trim(resultWithPcBefore)
                    && trim(resultWithPcBefore) !== resultWithPcBeforeAndAfter)
            {
                result = trim(result);
                result = resultWithPcBeforeAndAfter;
            }
        }
        else
        {
            throw JSrealB.Exception.pcMarkNotSupported(punctuation);
        }
        
        return result;
    };
    
    return {
        before: function(sentence, punctuation) {
            try
            {
                return applyBefore(sentence, punctuation);
            }
            catch(err)
            {
                return "[[" + sentence + "]]";
            }
        },
        after: function(sentence, punctuation) {
            try
            {
                return applyAfter(sentence, punctuation);
            }
            catch(err)
            {
                return "[[" + sentence + "]]";
            }
        },
        surround: function(sentence, punctuation) {
            try
            {
                return surround(sentence, punctuation);
            }
            catch(err)
            {
                return "[[" + sentence + "]]";
            }
        },
        isValid: function(punctuation) {
            return isPunctuationMark(punctuation);
        }
    };
})();

//// Declension Module (Nouns, Adjectives, Pronouns) + Determinant agreement
JSrealB.Module.Declension = (function() {
    var applyEnding = function(unit, feature, declensionTable) {
        
        if(feature.g == JSrealB.Config.get("feature.gender.either")){ 
            //quelques mots français du lexique peuvent s'accorder dans les deux genres.
            feature.g = JSrealB.Config.get("feature.gender.masculine");
        }
        if (typeof feature.pe == "string") feature.pe=+feature.pe; // make sure pe is an integer... to match in declension tables
        var declension = getValueByFeature(declensionTable.declension, feature);
                

        if(declension !== null)
        {
            return stem(unit, declensionTable.ending) + declension;
        }
        else
        {
            return false;
        }
    };
    
    //GL ajout du traitement des comparatifs "longs" en anglais et traitement simple des comparatifs en français
    var specialFRcomp={
        "bon":{"co":"meilleur","su":"le meilleur"},
        "bons":{"co":"meilleurs","su":"les meilleurs"},
        "bonne":{"co":"meilleure","su":"la meilleure"},
        "bonnes":{"co":"meilleures","su":"les meilleures"},
        "mauvais":{"co":"pire","su":"le pire"}, // faudra traiter le sing/pluriel éventuellement
        "mauvaise":{"co":"pire","su":"la pire"},
        "mauvaises":{"co":"pires","su":"les pires"}
    };
    var addComparativeWord = function(result,compFeature,table){
        // console.log("result:%o;compFeature:%o;table:%o",result,compFeature,table);
        if(JSrealB.Config.get("language")=="fr"){
            var special=specialFRcomp[result];
            if (special)return special[compFeature];
            return (compFeature=="co" ? "plus ":"le plus ")+result;
        } else if (table=="a1"){ // dans les autres cas en anglais, le suffixe de comparatif est dans la table...
            return (compFeature=="co" ? "more ":"the most ")+result;
        } else
            return result;
    };
    
    var decline = function(unit, category, feature) {
        var unitInfo = JSrealB.Module.Common.getWordFeature(unit, category);

        if(feature === undefined) { feature = {}; }
        
        var declensionTable = [];
        for(var i = 0, length = unitInfo.tab.length; i < length; i++)
        {
            declensionTable[i] = JSrealB.Config.get("rule").declension[unitInfo.tab[i]];
        }
        
        // gender
        if(feature[JSrealB.Config.get("feature.gender.alias")] !== undefined
                && unitInfo[JSrealB.Config.get("feature.gender.alias")] !== undefined)
        {
            // if gender is "x", we choose masculine
            if(unitInfo[JSrealB.Config.get("feature.gender.alias")] === JSrealB.Config.get("feature.gender.either"))
            {
                feature[JSrealB.Config.get("feature.gender.alias")] = JSrealB.Config.get("feature.gender.masculine");
            }
        }
        if(JSrealB.Config.get("language")=="fr" && feature.g == JSrealB.Config.get("feature.gender.neuter")
                && category!= JSrealB.Config.get("feature.category.word.pronoun")) //Cas spécial avec les pronoms neutres en français
            {
                feature[JSrealB.Config.get("feature.gender.alias")] = JSrealB.Config.get("feature.gender.masculine");
            }
        
        if(declensionTable.length > 0)
        {
            var result = false;
            var j = 0;
            do
            {
                result = applyEnding(unit, feature, declensionTable[j]);
                
                j++;
            } while(result === false && j < declensionTable.length); 
            // pour les homonymes qui se distinguent par le genre (ex: barbe en francais)
            if(result === false)
            {
                //  cette exception produit trop d'erreurs inutiles (e.g. si on traite un nom féminin dans un groupe avec
                //  une catégorie masculin), par exemple
                //    mother doesn't decline with these properties, for category  N, {"g":"m","n":"s","f":null,"pe":3,"own":"s"}
                // throw JSrealB.Exception.wrongDeclension(unit, category, JSON.stringify(feature));
                result=unit;
            }
            // traitement des comparatifs
            var compFeature=feature[JSrealB.Config.get("feature.form.alias")];
            if (compFeature=="co" || compFeature=="su"){
                result=addComparativeWord(result,compFeature,unitInfo.tab[j-1]);
            }
            return result;
        }
        else
        {
            throw JSrealB.Exception.tableNotExists(unit, unitInfo.tab);
        }
    };
    
    return {
        decline: function(unit, category, feature) {
            var declinedUnit = null;

            try
            {
                declinedUnit = decline(unit, category, feature);
            }
            catch(err)
            {
                return "[[" + unit + "]]";
            }

            return declinedUnit;
        }
    };
})();

//// Conjugation Module (auxils)
JSrealB.Module.Conjugation = (function(){

    var applySimpleEnding = function(unit, tense, person, conjugationTable){
        //temps simple anglais et français
        if(person === null || typeof conjugationTable.t[tense] === 'string'){
            return stem(unit, conjugationTable.ending) + conjugationTable.t[tense];
        }
        else if(conjugationTable.t[tense][person-1] !== undefined
            && conjugationTable.t[tense][person-1] !== null){
                return stem(unit, conjugationTable.ending) + conjugationTable.t[tense][person-1];
        } else {
            throw JSrealB.Exception.wrongPerson(unit, person);
        }
    };

    var conjugatePPAvecAvoirEtre = function(unit, person, gender, tense, cdProp, aux){
        cdProp = cdProp || {};
        var pp = conjugate(unit,tense,person);
        var declTable = JSrealB.Config.get("rule.declension")["n28"];
        if(aux == JSrealB.Config.get("rule.compound.aux.êt")){
            var featureAux = {"g":gender,"n":(person>3)?"p":"s"};
        }else{
            if(cdProp == undefined) return pp;
            var featureAux = {"g":cdProp.g, "n":cdProp.n};
        }
        var declension = getValueByFeature(declTable.declension, featureAux);
        if(declension !== null)
        {
            var ppConjugue = stem(pp, declTable.ending) + declension;
        }
        else{
            return pp;
        }
        return ppConjugue;
    };
        
    var getConjugationTable = function (unit){
        var verbInfo = JSrealB.Module.Common.getWordFeature(unit, JSrealB.Config.get('feature.category.word.verb'));
        var conjugationTable = JSrealB.Config.get("rule").conjugation[verbInfo.tab];
        if (conjugationTable !== undefined){
            return conjugationTable;
        } else {
            throw JSrealB.Exception.tableNotExists(unit, verbInfo.tab);
        }
    }
    var conjugateFR_PP = function(unit, person, gender, aux, cdProp){
        var pp = applySimpleEnding(unit,JSrealB.Config.get("feature.tense.participle.past"),person,getConjugationTable(unit));
        var declTable = JSrealB.Config.get("rule.declension")["n28"]; // i.e. ms="",mp="s",fs="e",fp="es"
        if (aux == JSrealB.Config.get("rule.compound.aux.êt")){
            var featureAux = {"g":gender,"n":(person>3)?"p":"s"};
        } else {
            if(cdProp == undefined) return pp;
            var featureAux = {"g":cdProp.g, "n":cdProp.n};
        }
        var declension = getValueByFeature(declTable.declension, featureAux);
        if(declension !== null) {
            return stem(pp, declTable.ending) + declension;
        } else {
            return pp;
        }
    };
    
    var conjugateFR = function(unit,tense, person, gender,neg,pas,prog,interro,modality,auxF,cdProp){
        var conjugTable=getConjugationTable(unit);
        if (pas){
            auxVerb=JSrealB.Config.get("rule.verb_option.prog.aux")
            aux = conjugateFR(auxVerb, tense, person, gender,neg,false,prog,interro,modality,auxF,cdProp);
            return [aux,conjugateFR_PP(unit,person,gender,auxVerb,cdProp)].join(" ");
        } else if (prog) {
            auxVerb=JSrealB.Config.get("rule.verb_option.prog.aux")
            aux = conjugateFR(auxVerb, tense, person, gender,neg,pas,false,interro,modality,auxF,cdProp);
            return [aux,JSrealB.Config.get("rule.verb_option.prog.keyword"),unit].join(" ");
        } else if (modality) {
            var modVerb=JSrealB.Config.get("rule.verb_option.modalityVerb");
            return [conjugateFR(modVerb[modality],tense,person,gender,neg,pas,prog,interro,false,auxF,cdProp),unit].join(" ");
        } else if (JSrealB.Config.get("rule.compound")[tense]!==undefined){
            var auxTab = JSrealB.Module.Common.getWordFeature(unit,JSrealB.Config.get('feature.category.word.verb'))["aux"];
            var auxVerb=JSrealB.Config.get("rule.compound.aux")[auxTab]
            aux = conjugateFR(auxVerb,JSrealB.Config.get("rule.compound")[tense]["auxTense"],person,gender,
                              neg,pas,prog,interro,modality,auxF,cdProp);
            return [aux,conjugateFR_PP(unit,person,gender,auxVerb,cdProp)].join(" ");
        } else if (neg) {
            var verb=conjugateFR(unit,tense,person,gender,false,pas,prog,interro,false,auxF,cdProp);
            var optionNeg=JSrealB.Config.get("rule.verb_option.neg");
            var prep2 = typeof neg=="string"?neg:optionNeg.prep2
            if (tense == JSrealB.Config.get("feature.tense.base")){
                return [optionNeg["prep1"],prep2,unit].join(" ");
            } else {
                return [optionNeg["prep1"],verb,prep2].join(" ");
            }
        } else {
            return applySimpleEnding(unit, tense, person,conjugTable);
        }
    }
    // negation of modal auxiliaries
    var negMod={"can":"cannot","may":"may not","shall":"shall not","will":"will not","must":"must not",
                "could":"could not","might":"might not","should":"should not","would":"would not"}    
    // English conjugation 
    // it implements the "affix hopping" rules given in 
    //      N. Chomsky, "Syntactic Structures", 2nd ed. Mouton de Gruyter, 2002, p 38 - 48
    var conjugateEN = function(unit, tense, person, neg,pas,prog,perf,interro,modality){
        switch (tense) {
        case "ip": // ignore all flags except negation
            if (neg)
                return (person==4?"let's not ":"do not ")+unit;
            return ((person==4)?"let's ":"")+unit;
        case "b":
            return (person==0)?unit:"to "+unit;
        default :
            var auxils=[];  // list of Aux followed by V
            var affixes=[];
            var isFuture=tense=="f"
            if (modality){
                auxils.push(JSrealB.Config.get("rule.compound")[modality].aux);
                affixes.push("b");
            } else if (isFuture){
                // caution: future in English is done with the modal will, so another modal cannot be used
                auxils.push(JSrealB.Config.get("rule.compound.future.aux"));
                affixes.push("b");
            }
            if (perf || prog || pas){
                if (perf){
                    auxils.push(JSrealB.Config.get("rule.compound.perfect.aux"));
                    affixes.push(JSrealB.Config.get("rule.compound.perfect.participle"));
                }
                if (prog) {
                    auxils.push(JSrealB.Config.get("rule.compound.continuous.aux"));
                    affixes.push(JSrealB.Config.get("rule.compound.continuous.participle"))
                }
                if (pas) {
                    auxils.push(JSrealB.Config.get("rule.compound.passive.aux"));
                    affixes.push(JSrealB.Config.get("rule.compound.passive.participle"))
                }
            } else if (interro && auxils.length==0 && unit!="be" && unit!="have"){ 
                // add auxiliary for interrogative if not already there
                if (interro!="wos" && interro!="old"){
                    auxils.push("do");
                    affixes.push("b");
                }
            }
            auxils.push(unit);
            // realise the first verb, modal or auxiliary
            var v=auxils.shift();
            var words=[];
            if (isFuture)tense="p";
            if (neg) { // negate the first verb
                if (v in negMod){
                    words.push(negMod[v]);
                } else if (v=="be" || v=="have") {
                    words.push(applySimpleEnding(v,tense,person,getConjugationTable(v)));
                    words.push("not");
                } else {
                    words.push(applySimpleEnding("do",tense,person,getConjugationTable("do"))+(neg?"n't":""))
                    if (v != "do") words.push(v);
                }
            } else // conjugate the first verb
                words.push(applySimpleEnding(v,tense,person,getConjugationTable(v)));
            // realise the other parts using the corresponding affixes
            while (auxils.length>0) {
                v=auxils.shift();
                words.push(applySimpleEnding(v, affixes.shift(),0,getConjugationTable(v)));
            }
            return words.join(" ");
        }
    }

    var conjugate = function(unit, tense, person, gender, verbOptions, cdProp, auxF) {
        gender = gender || "";
        verbOptions = verbOptions || {};
        cdProp = cdProp || {};
        auxF = auxF || undefined;
        if(tense == 'ip') verbOptions.prog = false;//cause une erreur pour l'impératif au passif 
        if (getLanguage()=="fr"){ // français
             var verb = conjugateFR(unit, tense, person, gender, 
                             verbOptions.neg,verbOptions.pas==true,verbOptions.prog==true,
                             verbOptions.interro,verbOptions.modality,cdProp,auxF);
             if (verbOptions.pas == true && verbOptions.hasSubject == true && 
                  verbOptions.interro!="wod" && verbOptions.interro!="wad"){
                 verb += " par";
             }
             return verb;
        } else { // English
            var verb =  conjugateEN(unit, tense, person, 
                             verbOptions.neg==true,verbOptions.pas==true,verbOptions.prog==true,verbOptions.perf==true,
                             verbOptions.interro,verbOptions.modality)
            if (verbOptions.pas==true && verbOptions.hasSubject) verb += " by";
            return verb;
        }
    };

    return {
        conjugate: function(verb, tense, person, gender, verbOptions, cdProp, auxF) {
            try {
                return conjugate(verb, tense, person, gender, verbOptions, cdProp, auxF);
            } catch(err) {
                return "[[" + verb + "]]";
            }
        }
    };

})();

// Regular rule Application Module (only 1 rule, no choice)
JSrealB.Module.RegularRule = (function() {
    var applyEnding = function(unit, feature, ruleTable) {
        var newEnding = getValueByFeature(ruleTable.option, feature);

        if(newEnding !== null)
        {
            return stem(unit, ruleTable.ending) + newEnding;
        }
        else
        {
            return false;
        }
    };
    
    var apply = function(unit, category, feature) {
        var unitInfo = JSrealB.Module.Common.getWordFeature(unit, category);
        var ruleTable = [];
        for(var i in unitInfo.tab)
        {
            ruleTable[i] = JSrealB.Config.get("rule").regular[unitInfo.tab[i]];
        }
        
        if(ruleTable.length > 0)
        {
            var result = false;
            var j = 0;
            do
            {
                result = applyEnding(unit, feature, ruleTable[j]);
                
                j++;
            } while(result === false && j < ruleTable.length); 
            
            if(result === false)
            {
                throw JSrealB.Exception.wrongRule(unit, JSON.stringify(feature));
            }
            
            return result;
        }
        else
        {
            throw JSrealB.Exception.tableNotExists(unit, unitInfo.tab);
        }
    };
    
    return {
        apply: function(unit, category, feature) {
            var correctUnit = null;

            try
            {
                var properfeature = (feature === undefined) ? {} : feature;
                correctUnit = apply(unit, category, properfeature);
            }
            catch(err)
            {
                return "[[" + unit + "]]";
            }

            return correctUnit;
        }
    };
})();


JSrealB.Module.Common = (function() {
    var getUnitInfo = function(unit, category, avoidException) {
        var info = JSrealB.Config.get("lexicon")[unit];
        if(info !== undefined)
        {
            if(info[category] !== undefined)
            {
                return info[category];
            }
            else
            {
                if(avoidException === undefined || avoidException === false)
                    throw JSrealB.Exception.wordNotExists(unit, category);
                else
                    return null;
            }
        }
        else
        {
            if(avoidException === undefined || avoidException === false)
                throw JSrealB.Exception.wordNotExists(unit);
            else
                return null;
        }
    };
    
    return {
        getWordFeature: function(unit, category, avoidException) {
            return getUnitInfo(unit, category, avoidException);
        }
    };
})();

JSrealB.Module.Date = (function() {
    var year, month, date, day, hour, minute, second, customValue;
    
    var getYear = function() { return year; };
    var getMonth = function() { return month; };
    var getDate = function() { return date; };
    var getDay = function() { return day; };
    var getHour = function() { return hour; };
    var getMinute = function() { return minute; };
    var getSecond = function() { return second; };
    var getCustomValue = function() { return customValue; };
    
    var applyTextualDateRule = function(i, cat) {
        if(isNumeric(i))
        {
            var list = JSrealB.Config.get("rule").date.text[cat];

            if(list !== undefined && list[i] !== undefined)
            {
                return list[i];
            }
            else
            {
                throw JSrealB.Exception.wrongDate(cat);
            }
        }
        
    };
    
    var numberToMonth = function(n) {
        try
        {
            return applyTextualDateRule(n, "month");
        }
        catch(e)
        {
            return "[[" + n + "]]";
        }
    };
    
    var numberToDay = function(n) {
        try
        {
            return applyTextualDateRule(n, "weekday");
        }
        catch(e)
        {
            return "[[" + n + "]]";
        }
    };
    
    var numberWithLeadingZero = function(digit) {
        if(isNumeric(digit))
        {
            var number = getInt(digit).toString();
            if(number.length < 2)
            {
                number = "0" + number;
            }
            
            return number.toString();
        }
        
        return "[[" + digit + "]]";
    };
    
    var numberWithoutLeadingZero = function(digit) {
        if(isNumeric(digit))
        {
            return getInt(digit).toString();
        }
        
        return "[[" + digit + "]]";
    };
    
    var numberToMeridiem = function(n) {
        return applyTextualDateRule(((getInt(n) < 12) ? 0 : 1), "meridiem");
    };
    
    var numberTo12hour = function(n) {
        if(isNumeric(n))
        {
            return numberWithoutLeadingZero(getInt(n) >= 12 ? (getInt(n) - 12) : n);
        }
        
        return "[[" + n + "]]";
    };
    
    var doNothing = function(s) {
        return s;
    };
    
    //// Based on format of strftime [linux]
    var format = {
        Y: { param: getYear,    func: numberWithoutLeadingZero },
        F: { param: getMonth,   func: numberToMonth },
        M0: { param: getMonth,  func: numberWithLeadingZero },
        M: { param: getMonth,   func: numberWithoutLeadingZero },
        d0: { param: getDate,   func: numberWithLeadingZero },
        d: { param: getDate,    func: numberWithoutLeadingZero },
        l: { param: getDay,     func: numberToDay },
        A: { param: getHour,    func: numberToMeridiem },
        h: { param: getHour,    func: numberTo12hour },
        H0: { param: getHour,   func: numberWithLeadingZero },
        H: { param: getHour,    func: numberWithoutLeadingZero },
        m0: { param: getMinute, func: numberWithLeadingZero },
        m: { param: getMinute,  func: numberWithoutLeadingZero },
        s0: { param: getSecond, func: numberWithLeadingZero },
        s: { param: getSecond,  func: numberWithoutLeadingZero },
        x: { param: getCustomValue, func: doNothing }
    };
    
    var getPatternKey = function(elementDisplayed, allElementList, separator) {
        var key = "";
        
        for(var i = 0, length = allElementList.length; i < length; i++)
        {
            if((allElementList[i] !== "second")
                    || getInt(eval(allElementList[i])) !== 0)
            {
                key += (elementDisplayed !== undefined
                        && elementDisplayed[allElementList[i]] !== undefined 
                        && elementDisplayed[allElementList[i]] === false) ? "" : allElementList[i] + separator;
            }
        }
        
        key =  trim(key);
        
        return (key.length > 0) ? key.substring(0, key.length - 1) : null;
    };
    
    var singlePatternRealization = function(pattern) {
        if(format[pattern] !== undefined)
        {
            return format[pattern].func(format[pattern].param());
        }
        
        return "[[" + pattern + "]]";
    };
    
    var patternRealization = function(pattern) {
        var c, realization = "", singlePattern = null;
        for(var i = 0, length = pattern.length; i < length; i++)
        {
            c = pattern.charAt(i);
            
            if(c === "[")
            {
                singlePattern = "";
            }
            else if(c === "]")
            {
                realization += singlePatternRealization(singlePattern);
                singlePattern = null;
            }
            else if(singlePattern !== null)
            {
                singlePattern += c;
            }
            else
            {
                realization += c;
            }
        }
        
        return realization;
    };
    
    var setFullDate = function(oDate) {
        year   = oDate.getFullYear();
        month  = oDate.getMonth() + 1;
        date   = oDate.getDate(); // month day
        day    = oDate.getDay(); // weekday
        hour   = oDate.getHours();
        minute = oDate.getMinutes();
        second = oDate.getSeconds();
    };
    
    var removeDeterminer = function(date, displayDeterminer) {
        var newDate = date;
        if(displayDeterminer !== undefined
                && displayDeterminer === false)
        {
            var pos = newDate.indexOf("[");
            if(pos >= 0)
            {
                newDate = newDate.substring(pos);
            }
        }
        
        return newDate;
    };
    
    var dateRealization = function(oDate, patternTable, firstPatternKey, secondPatternKey, displayDeterminer) {        
        var firstPart = "";
        if(firstPatternKey !== null
                && patternTable[firstPatternKey] !== undefined)
        {
            var firstPattern = removeDeterminer(patternTable[firstPatternKey], displayDeterminer);
            firstPart = patternRealization(firstPattern);
        }
        
        var secondPart = "";
        if(secondPatternKey !== null
                && patternTable[secondPatternKey] !== undefined)
        {
            var secondPattern = removeDeterminer(patternTable[secondPatternKey], displayDeterminer);
            secondPart = patternRealization(secondPattern);
        }
        
        return trim(firstPart + " " + secondPart);
    };
    
    var toWord = function(oDate, elementDisplayed) {
        setFullDate(oDate);
        
        var firstPatternKey = getPatternKey(elementDisplayed, ["year", "month", "date", "day"], "-");
        var secondPatternKey = getPatternKey(elementDisplayed, ["hour", "minute", "second"], ":");
        
        var patternTable = JSrealB.Config.get("rule").date.format.natural;
        
        return dateRealization(oDate, patternTable, firstPatternKey, secondPatternKey, 
                ((elementDisplayed !== undefined) ? elementDisplayed.det : undefined));
    };
    
    var formatter = function(oDate, elementDisplayed) {
        setFullDate(oDate);
        
        var firstPatternKey = getPatternKey(elementDisplayed, ["year", "month", "date", "day"], "-");
        var secondPatternKey = getPatternKey(elementDisplayed, ["hour", "minute", "second"], ":");
        
        var patternTable = JSrealB.Config.get("rule").date.format.non_natural;
        
        return dateRealization(oDate, patternTable, firstPatternKey, secondPatternKey);
    };
    
    var realDayDiff = function(oDate1, oDate2) {
        var timeDiff = oDate1.getTime() - oDate2.getTime();
        var diffDays = timeDiff / (1000 * 3600 * 24);

        return getFloat(diffDays);
    };
    
    var relativeDayDiff = function(oDate1, oDate2) {
        var tmpDate = new Date();
        
        var nbDayDiff = getInt(Math.ceil(realDayDiff(oDate1, oDate2)));
        
        tmpDate.setDate(tmpDate.getDate() + nbDayDiff);
        
        if(tmpDate.getDate() !== oDate1.getDate())
        {
            nbDayDiff--;
        }
        
        return nbDayDiff;
    };
    
    var toRelativeTime = function(oDate, elementDisplayed) {
        setFullDate(oDate);
        var today = new Date();
        
        var patternKey = relativeDayDiff(oDate, today);
        var patternTable = JSrealB.Config.get("rule").date.format.relative_time;
        
        if(patternTable[patternKey] === undefined)
        {
            customValue = Math.abs(patternKey);
            patternKey = (patternKey < 0) ? "-" : "+";
        }
        
        return dateRealization(oDate, patternTable, patternKey.toString(), null);
    };
    
    return {
        toWord: function(oDate, elementDisplayed) {
            return toWord(oDate, elementDisplayed);
        },
        formatter: function(oDate, elementDisplayed) {
            return formatter(oDate, elementDisplayed);
        },
        toRelativeTime: function(oDate, elementDisplayed) {
            return toRelativeTime(oDate, elementDisplayed);
        }
    };
})();

//Functions from JSreal used to convert num to string (words)

// Fonctions importées de JSreal



JSrealB.Module.Number = (function() {
    var toWord = function(rawNumber, maxPrecision, grammaticalNumber,lang, gender) {
        // throw "TODO";
        var lang = lang || "fr";
        
        if(grammaticalNumber !== undefined)
        {
            grammaticalNumber(getGrammaticalNumber(getNumberFormat(rawNumber, maxPrecision, ".", "")));
        }

        var formattedNumber = formatter(rawNumber, maxPrecision, grammaticalNumber);
        var specialFractions=[[0.20, "one-fifth"],[0.25, "one-fourth"],[0.25, "one-quarter"],
                              [0.333, "one-third"],[0.40, "two-fifths"],
                              [0.50, "one-half"],[0.666, "two-thirds"],[0.75, "three-quarters"]];
        if (rawNumber<1.0 && lang == "en"){
            for (var i = 0; i < specialFractions.length; i++) {
                var sp=specialFractions[i];
                if (Math.abs(rawNumber-sp[0])<0.01)
                    return sp[1];
            }
        }
        var numberLettres = enToutesLettres(parseInt(rawNumber),lang == "en", gender)

        if( lang == "fr" && numberLettres == "un" && gender == "f"){
            numberLettres += "e";
        }

        return numberLettres;

    };
    
    var toOrdinal = function(rawNumber, maxPrecision, grammaticalNumber,lang, gender) {
        // throw "TODO";
        var lang = lang || "fr";
        
        if(grammaticalNumber !== undefined)
        {
            grammaticalNumber(JSrealB.Config.get("feature.number.singular")); //ordinal are always singular
        }

        var formattedNumber = formatter(rawNumber, maxPrecision, grammaticalNumber);

        var numberOrdLettres = ordinal(parseInt(rawNumber),lang == "en", gender)

        return numberOrdLettres;

    };
    
    var getNumberFormat = function(number, decimals, dec_point, thousands_sep) {
        // discuss at: http://phpjs.org/functions/number_format/
        // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
        number = (number + '')
                .replace(/[^0-9+\-Ee.]/g, '');
        var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? '' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function (n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + (Math.round(n * k) / k)
                            .toFixed(prec);
                };
        // Fix for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
                .split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '')
                .length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1)
                    .join('0');
        }
        return s.join(dec);
    };
    
    var formatter = function(rawNumber, maxPrecision, grammaticalNumber) {
        var precision = (maxPrecision === undefined) ? 2 : maxPrecision;
        var numberTable = JSrealB.Config.get("rule").number;
        precision = nbDecimal(rawNumber) > precision ? precision : nbDecimal(rawNumber);
        
        var formattedNumber = getNumberFormat(rawNumber, precision, numberTable.symbol.decimal, numberTable.symbol.group);
        
        if(grammaticalNumber !== undefined)
        {
            grammaticalNumber(getGrammaticalNumber(getNumberFormat(rawNumber, precision, ".", "")));
        }

        return formattedNumber;
    };
    
    var getGrammaticalNumber = function(rawNumber) {
        var properNumber = getInt(rawNumber);
        return (properNumber >= -1 && properNumber <= 1) ? 
                JSrealB.Config.get("feature.number.singular") : JSrealB.Config.get("feature.number.plural");
    };
    
    var isValid = function(s)
    {
        return s !== undefined && isNumeric(s);
    };

    //Fonctions pour la sortie en lettres:


    //Fonction EnToutesLettres par Guy Lapalme , légèrement modifiée par Francis pour accomoder le genre

    function enToutesLettres(s,en){
        var trace=false; // utile pour la mise au point

        // expressions des unités pour les "grands" nombres >1000 
        // expressions donnent les formes [{singulier, pluriel}...]
        //  noms de unités selon l'échelle courte présentée dans le Guide Antidote
        // elle diffère de celle présentée dans http://villemin.gerard.free.fr/TABLES/NbLettre.htm
        var unitesM=[ {sing:"mille"         ,plur:"mille"}        // 10^3
                     ,{sing:"un million"    ,plur:"millions"}     // 10^6
                     ,{sing:"un milliard"   ,plur:"milliards"}    // 10^9
                     ,{sing:"un trillion"   ,plur:"trillions"}    // 10^12
                     ,{sing:"un quatrillion",plur:"quatrillions"} // 10^15
                     ,{sing:"un quintillion",plur:"quintillions"} // 10^18
                    ];
        var unitsM =[ {sing:"one thousand"      ,plur:"thousand"}    // 10^3
                     ,{sing:"one million"       ,plur:"million"}     // 10^6
                     ,{sing:"one billion"       ,plur:"billion"}     // 10^9
                     ,{sing:"one trillion"      ,plur:"trillion"}    // 10^12
                     ,{sing:"one quatrillion"   ,plur:"quatrillion"} // 10^15
                     ,{sing:"one quintillion"   ,plur:"quintillion"} // 10^18
                    ];

        var maxLong=21;  // longueur d'une chaîne de chiffres traitable (fixé par la liste unitesM)

        // séparer une chaine en groupes de trois et complétant le premier groupe avec des 0 au début
        function splitS(s){
            if(s.length>3)
                return splitS(s.slice(0,s.length-3)).concat([s.slice(s.length-3)]);
            else if (s.length==1)s="00"+s;
            else if (s.length==2)s="0"+s
            return [s];
        }
        // est-ce que tous les triplets d'une liste correspondent à  0 ?
        function tousZero(ns){
            if(ns.length==0)return true;
            return (ns[0]=="000")&&tousZero(ns.slice(1));
        }

        // création d'une liste de triplets de chiffres
        function grouper(ns){ // ns est une liste de chaines de 3 chiffres
            var l=ns.length;
            if(trace)console.log("grouper:"+l+":"+ns);
            var head=ns[0];
            if(l==1)return centaines(head);
            var tail=ns.slice(1);
            if(head=="000")return grouper(tail);
            var uM=en?unitsM:unitesM;
            return (head=="001"?uM[l-2].sing:(grouper([head])+" "+uM[l-2].plur))+" "
                   +(tousZero(tail)?"":grouper(tail));
        }

        // traiter un nombre entre 0 et 999
        function centaines(ns){ // ns est une chaine d'au plus trois chiffres
            if(trace)console.log("centaines:"+ns);
            if(ns.length==1)return unites(ns);
            if(ns.length==2)return dizaines(ns);
            var c=ns[0];        // centaines
            var du=ns.slice(1); // dizaines+unités
            if(c=="0") return dizaines(du);
            var cent=en?"hundred":"cent"
            if(du=="00"){
                if(c=="1") return (en?"one ":"")+cent;
                return unites(c)+" "+cent+(en?"":"s");
            }
            if(c=="1") return (en?"one ":"")+cent+" "+dizaines(du);
            return unites(c)+" "+cent+(en?" and ":" ")+dizaines(du);
        }

        // traiter un nombre entre 10 et 99
        function dizaines(ns){// ns est une chaine de deux chiffres
            if(trace)console.log("dizaines:",ns);
            var d=ns[0]; // dizaines
            var u=ns[1]; // unités
            switch  (d){
                case "0": return unites(u);
                case "1":
                    return (en?["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"]
                              :["dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"])[+u];
                case "2": case "3": case "4": case "5": case "6":
                    var tens = (en?["twenty","thirty","forty","fifty","sixty"]
                    :["vingt","trente","quarante","cinquante","soixante"])[d-2];
                    if (u==0) return tens;
                    return tens + (u=="1" ? (en?"-one":" et un"): ("-"+unites(u)));
                case "7":
                    if(u==0) return en?"seventy":"soixante-dix"
                    return en?("seventy-"+unites(u)):("soixante-"+dizaines("1"+u));
                case "8":
                    if(u==0) return en?"eighty":"quatre-vingts";
                    return (en?"eighty-":"quatre-vingt-")+unites(u);
                case "9":
                    if(u==0) return en?"ninety":"quatre-vingt-dix";
                    return en?("ninety-"+unites(u)):("quatre-vingt-"+dizaines("1"+u));
            }
        }

        // traiter un chiffre entre 0 et 10
        function unites(u){ // u est une chaine d'un chiffre
            return (en?["zero","one","two","three","four","five","six","seven","eight","nine"]
                      :["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"])[+u];// conversion
        }
        
    /// début de l'exécution de la fonction
        if(typeof s=="number")s=""+s; // convertir un nombre en chaîne
        if(!/^-?\d+$/.test(s))
            throw "nombreChaineEnLettres ne traite que des chiffres:"+s;
        var neg=false;
        if(s[0]=="-"){
            neg=true;
            s=s.slice(1);
        }
        if(s.length>maxLong)
            throw "nombreChaineEnLettres ne traite que les nombres d'au plus "+maxLong+" chiffres:"+s;
        return (neg?(en?"minus ":"moins "):"")+grouper(splitS(s)).trim();
    }

    // si l'orthographe française rectifiée est demandée, appliquer cette fonction à la sortie
    // de enToutesLettres() pour mettre des tirets à la place des espaces partout dans le nombre...
    function rectifiee(s){
        return s.replace(/ /g,"-");
    }
    
    // écriture des nombres ordinaux   //GL

    // rules taken from https://www.ego4u.com/en/cram-up/vocabulary/numbers/ordinal
    ordEnExceptions={"one":"first","two":"second","three":"third","five":"fifth",
                     "eight":"eighth","nine":"ninth","twelve":"twelfth"}
    // règles tirées de https://francais.lingolia.com/fr/vocabulaire/nombres-date-et-heure/les-nombres-ordinaux
    ordFrExceptions={"un":"premier","une":"première","cinq":"cinquième","neuf":"neuvième"}
    function ordinal(s,en,gender){
        s=enToutesLettres(s,en);
        if (s=="zéro" || s=="zero") return s;
        var m=/(.*?)(\w+)$/.exec(s)
        var lastWord=m[2]
        if (en) { 
            if (lastWord in ordEnExceptions)return m[1]+ordEnExceptions[lastWord]
            if (s.charAt(s.length-1)=="y") return s.substring(0,s.length-1)+"ieth"; // added from the reference
            return s+"th"
        } else {
            if (s == "un")return gender=="f"?"première":"premier";
            if (s.endsWith("et un")) return s+"ième";
            if (lastWord in ordFrExceptions) return m[1]+ordFrExceptions[lastWord];
            if (s.charAt(s.length-1)=="e" || s.endsWith("quatre-vingts")) return s.substring(0,s.length-1)+"ième";
            return s+"ième"
        }
    }
    
    return {
        formatter: function(rawNumber, maxPrecision, grammaticalNumber) {
            var formattedNumber = null;

            try
            {
                if(isValid(rawNumber))
                {
                    formattedNumber = formatter(rawNumber, maxPrecision, grammaticalNumber);
                }
                else
                {
                    throw JSrealB.Exception.wrongNumber(rawNumber);
                }

                return formattedNumber;
            }
            catch(e)
            {
                return "[[" + rawNumber + "]]";
            }
        },
        toWord: function(rawNumber, maxPrecision, grammaticalNumber, language, gender) {
            var numberToWord = null;

            try
            {
                if(isValid(rawNumber))
                {
                    numberToWord = toWord(rawNumber, maxPrecision, grammaticalNumber, language, gender);
                }
                else
                {
                    throw JSrealB.Exception.wrongNumber(rawNumber);
                }

                return numberToWord;
            }
            catch(e)
            {
                return "[[" + rawNumber + "]]";
            }
        },
        toOrdinal: function(rawNumber, maxPrecision, grammaticalNumber, language, gender) { //GL
            var numberToOrdinal = null;

            try
            {
                if(isValid(rawNumber))
                {
                    numberToOrdinal = toOrdinal(rawNumber, maxPrecision, grammaticalNumber, language, gender);
                }
                else
                {
                    throw JSrealB.Exception.wrongNumber(rawNumber);
                }

                return numberToOrdinal;
            }
            catch(e)
            {
                return "[[" + rawNumber + "]]";
            }
        },
        getGrammaticalNumber: function(rawNumber) {
            var grammaticalNumber = null;

            try
            {
                if(isValid(rawNumber))
                {
                    grammaticalNumber = getGrammaticalNumber(rawNumber);
                }
                else
                {
                    throw JSrealB.Exception.wrongNumber(rawNumber);
                }

                return grammaticalNumber;
            }
            catch(e)
            {
                return "[[" + rawNumber + "]]";
            }
        },
        getNumberFormat: function(number, decimals, dec_point, thousands_sep) {
            return getNumberFormat(number, decimals, dec_point, thousands_sep);
        },
        toRelativeNumber: function(rawNumber)
        {
            var numberToWord = null;

            try
            {
                if(isValid(rawNumber))
                {
                    //On veut seulement le nombre sans les décimales
                    numberToWord = toWord(rawNumber, 0, JSrealB.Config.get("feature.number.singular"));
                }
                else
                {
                    throw JSrealB.Exception.wrongNumber(rawNumber);
                }
                // console.log(numberToWord);

                return numberToWord;
            }
            catch(e)
            {
                return "[[" + rawNumber + "]]";
            }
        }
    };
})();

/*
 * Utils
 */
var isString = function(s)
{
    return (typeof s === "string");
};

var isNumeric = function(n)
{
    return !isNaN(getFloat(n)) && isFinite(n);
};

// https://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
var nbDecimal = function(n) {
  var match = (''+n).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
};

var isBoolean = function(b) {
    return (b === true || b === false);
};

var isObject = function(o) {
    return (typeof o === "object" && !Array.isArray(o));
};

var getInt = function(n) {
    return parseInt(n, 10);
};

var getFloat = function(n) {
    return parseFloat(n, 10);
};

var intVal = function(str) {
    var numberTable = str.split(' ').join('').match(/-?\d+/);
    var output = (numberTable !== null) ? getInt(numberTable[0]) : null;
    return output;
};

var ltrim = function(str) {
    return str.replace(/^\s+/,"");
};

var rtrim = function(str) {
    return str.replace(/\s+$/,"");
};

var trim = function (str) {
    return str.replace(/^\s+|\s+$/g,"");
};

var stem = function(str, ending){
    if (ending.length > 0)
    {
        var start = str.length - ending.length;
        if (start < 0 || str.substring(start) !== ending)
        {
            throw JSrealB.Exception.wrongEnding(str, ending);
        }
        
        return str.substring(0, start);
    }
    return str;
};

var inArray = function(array, value)
{
    if(value === undefined) return false;
    
    return (array.indexOf(value) >= 0);
};

var contains = function(obj, value)
{
    if(Array.isArray(obj))
    {
        return inArray(obj, value);
    }
    else if(isObject(obj))
    {
        var typeOfValue = (typeof value);
        var valueOfObject = false;
        for(var prop in obj)
        {
            if(typeof obj[prop] === typeOfValue)
            {
                if(obj[prop] === value)
                {
                    valueOfObject = true;
                    break;
                }
            }
            else
            {
                valueOfObject = contains(obj[prop], value);
                if(valueOfObject) break;
            }
        }
        
        return valueOfObject;
    }
    else if(obj === value)
    {
        return true;
    }
    
    return false;
};

var stripLeftHtml = function(html)
{
    return html.replace(/^<([^>]+)>/i,"");
}

var fetchFromObject = function(obj, prop, value) {
    if(obj === undefined)
        return undefined;

    var _index = prop.indexOf('.');

    if(_index > -1)
        return fetchFromObject(obj[prop.substring(0, _index)], prop.substr(_index+1), value);
    else if(value !== undefined)
        return obj[prop] = value;
    else
        return obj[prop];
};

var getValueByFeature = function(featureList, featureRequested) {
    var value = null;
    var i = 0;
    var featureLength = Object.keys(featureList).length;
    var j = 0;
    var currentFeatureList = {};
    var currentFeatureLength = 0;
    var featureRequestedLength = 0;
    var nbMatchedFeature = 0;
    var nbNotMatchedFeature = 0;
    var nbMissingFeature = 0;
    var bestSolution = null;
    var bestSolutionScore = 0;
    var bestSolutionErrorNb = 0;
    var bestSolutionMissingFeatureNb = 1000;
    var defaultValue = null;
    while(i < featureLength && value === null)
    {
        j = 0;
        nbMatchedFeature = 0;
        nbNotMatchedFeature = 0;
        nbMissingFeature = 0;
        currentFeatureLength = Object.keys(featureList[i]).length;
        currentFeatureList = Object.keys(featureRequested);
        featureRequestedLength = currentFeatureList.length;
        while(j < featureRequestedLength)
        {
            
            if(featureList[i].hasOwnProperty(currentFeatureList[j])
                    && (featureList[i][currentFeatureList[j]]
                            === featureRequested[currentFeatureList[j]]
                        || featureList[i][currentFeatureList[j]] === "x" // x accepts all values
                        )
                    && featureRequested[currentFeatureList[j]] !== null
                )
            {
                nbMatchedFeature++;
            }
            else if(featureList[i].hasOwnProperty(currentFeatureList[j]))
            {
                nbNotMatchedFeature++;
            }
            else
            {
                nbMissingFeature++;
            }
            
            j++;
        }
        
        // better solution : more matching features
        if(nbMatchedFeature >= currentFeatureLength - 1     // we remove "val" key
                && nbMatchedFeature > bestSolutionScore)
        {
            bestSolution = featureList[i];
            bestSolutionScore = nbMatchedFeature;
            bestSolutionMissingFeatureNb = nbMissingFeature;
        }
        // better solution : less not matching features
        else if(nbMatchedFeature >= currentFeatureLength - 1  // we remove "val" key
                && nbMatchedFeature === bestSolutionScore
                && nbNotMatchedFeature < bestSolutionErrorNb)
        {
            bestSolution = featureList[i];
            bestSolutionErrorNb = nbNotMatchedFeature;
            bestSolutionMissingFeatureNb = nbMissingFeature;
        }
        // better solution : 
        else if(nbMatchedFeature > 0
                && nbNotMatchedFeature === 0
                && nbMatchedFeature > bestSolutionScore
                && nbMissingFeature <= bestSolutionMissingFeatureNb)
        {
            bestSolution = featureList[i];
            bestSolutionErrorNb = nbNotMatchedFeature;
            bestSolutionMissingFeatureNb = nbMissingFeature;
        }
        
        
        if(nbMatchedFeature === featureRequestedLength
                || (featureLength === 1 && nbNotMatchedFeature === 0)) // if there is only 1 feature
        {
            value = featureList[i]['val'];
        }
        // Default Value
        else if(currentFeatureLength === 1 // only val
                && nbNotMatchedFeature === 0)
        {
            defaultValue = featureList[i]['val'];
        }

        i++;
    }

    return (value !== null) ? value : ((bestSolution !== null) ? bestSolution['val'] : defaultValue);
};

// https://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
function extend(base, sub) {
    // Avoid instantiating the base class just to setup inheritance
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // for a polyfill
    // Also, do a recursive merge of two prototypes, so we don't overwrite 
    // the existing prototype, but still maintain the inheritance chain
    var origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (var key in origProto) {
        sub.prototype[key] = origProto[key];
    }
    // Remember the constructor property was set wrong, let's fix it
    sub.prototype.constructor = sub;
    // In ECMAScript5+ (all modern browsers), you can make the constructor property
    // non-enumerable if you define it like this instead
    Object.defineProperty(sub.prototype, 'constructor', {
        enumerable: false,
        value: sub
    });
}

/*
 * Configuration
 */
JSrealB.Config = (function() {
    
    var config = {
        language: JSrealE.language.english,
        isDevEnv: false,
        printTrace: false,
        lexicon: {},
        rule: {},
        feature: {},
        lenient: false,
        lemmata: null
    };
    
    return {
        add: function(args) {
            var newSettings = {};
            for(var key in args)
            {
                if(config[key] === undefined)
                {
                    config[key] = args[key];
                    newSettings[key] = config[key];
                }
            }
            
            return newSettings;
        },
        set: function(args) {
            var newSettings = {};
            for(var key in args)
            {
                if(config[key] !== undefined)
                {
                    config[key] = args[key];
                    
                    newSettings[key] = config[key];
                }
            }
            
            return newSettings;
        },
        get: function(key) {
            var val = fetchFromObject(config, key);
            
            if(val !== undefined)
                return val;
            
            JSrealB.Logger.warning(key + " is not defined!");
            return null;
        }
    };
})();

/*
 * Exception
 */
JSrealB.Exception = (function() {
    
    var exceptionConfig = {
        exception: {
            4501: {
                "en": "doesn't exist in lexicon",
                "fr": "n'est pas présent dans le lexique"
            },
            4502: {
                "en": "isn't a valid number",
                "fr": "n'est pas un nombre bien formé"
            },
            4503: {
                "en": "has no rule with table id",
                "fr": "n'a pas de règle avec l'id"
            },
            4504: {
                "en": "has no ending",
                "fr": "n'a pas la terminaison"
            },
            4505: {
                "en": "doesn't conjugate in",
                "fr": "ne se conjugue pas au"
            },
            4506: {
                "en": "doesn't use this person or person doesn't exist, person =",
                "fr": "n'utilise pas cette personne ou cette personne n'existe pas, person ="
            },
            4507: {
                "en": "isn't a valid date, wrong format",
                "fr": "n'est pas une date dans un format valide"
            },
            4508: {
                "en": "doesn't decline with these properties, for category ",
                "fr": "ne se décline pas avec ces propriétés, pour la catégorie"
            },
            4509: {
                "en": "isn't a punctuation mark",
                "fr": "n'est pas un signe de ponctuation"
            },
            4510: {
                "en": "is not supported",
                "fr": "n'est pas supporté"
            },
            4512: {
                "en": "doesn't know rule with properties",
                "fr": "ne connait pas de règle avec les propriétés"
            },
            4513: {
                "en": "isn't a valid value for",
                "fr": "n'est pas une valeur valide pour"
            },
            4514: {
                "en": "has no headword",
                "fr": "n'a pas de noeud"
            }
        }
    };
    
    var exception = function(id, unit, info1, info2) {        
        var msg = unit + " " + exceptionConfig.exception[id][JSrealB.Config.get("language")];
        if(info1 !== undefined) msg += " " + info1;
        if(info2 !== undefined) msg += ", " + info2;
        
        JSrealB.Logger.warning(msg);
        if (typeof ideWarning !== 'undefined'){// to display warnings in the IDE
            ideWarning+=msg+"\n"
        }
        return msg;
    };

    return {
        wordNotExists: function(u,category) {
            return exception(4501, u,category);
        },
        wrongNumber: function(u) {
            return exception(4502, u);
        },
        wrongDate: function(u) {
            return exception(4507, u);
        },
        tableNotExists: function(u, tableId) {
            return exception(4503, u, tableId);
        },
        wrongEnding: function(u, ending) {
            return exception(4504, u, ending);
        },
        wrongTense: function(u, tense) {
            return exception(4505, u, tense);
        },
        wrongDeclension: function(u, category, feature) {
            return exception(4508, u, category, feature);
        },
        wrongRule: function(u, feature) {
            return exception(4512, u, feature);
        },
        wrongPerson: function(u, p) {
            return exception(4506, u, p);
        },
        wrongPunctuation: function(u) {
            return exception(4509, u);
        },
        pcMarkNotSupported: function(u) {
            return exception(4510, u);
        },
        invalidInput: function(u, i) {
            return exception(4513, u, i);
        },
        headWordNotFound: function(u,exp) {
            return exception(4514, u,exp.toSource());
        }
    };
})();

/*
 * Logger
 */
JSrealB.Logger = (function() {
    var debug = function(message) {
        if(JSrealB.Config.get("isDevEnv"))
        {
            console.log('%cDebug: ' + message, 'background: #CEE3F6; color: black');
        }
    };
    
    var info = function(message) {
        console.log(message);
    };
    
    var warning = function(message) {
        if(message!="rule.compound.aux is not defined!")console.warn(message);

        if(JSrealB.Config.get("printTrace"))
        {
            console.trace();
        }
    };
    
    var alert = function(message) {
        console.error(message);
        
        if(JSrealB.Config.get("printTrace"))
        {
            console.trace();
        }
    };
    
    return {
        print: function(object) {
            print(object);
        },
        debug: function(message) {
            debug(message);
        },
        info: function(message) {
            info(message);
        },
        warning: function(message) {
            warning(message);
        },
        alert: function(message) {
            alert(message);
        }
    };
})();

/**
 * 
 * Initialization
 */
var JSrealBResource = {en: {}, fr: {}, common: {}};

var feature = {
    "category": {
        "alias": "c",
        "word": {
            "noun": "N",
            "verb": "V",
            "determiner": "D",
            "pronoun": "Pro",
            "adjective": "A",
            "adverb": "Adv",
            "preposition": "P",
            "conjunction": "C",
            "complementizer": "Com",
            "punctuation": "Pc"
        },
        "phrase": {
            "noun": "NP",
            "verb": "VP",
            "adjective": "AP",
            "adverb": "AdvP",
            "prepositional": "PP",
            "propositional": "SP",
            "coordinated": "CP",
            "sentence": "S"
        },
        "quoted":"Q"
    },
    "tense": {
        "alias": "t",
        "base": "b",
        "gerund": "g",
        "indicative": {
            "present": "p",
            "imperfect": "i",
            "past": "ps",
            "simple_past": "ps",
            "compound_past": "pc",
            "pluperfect": "pq",
            "simple_future": "f",
            "futur antérieur": "fa"
        },
        "imperative": {
            "present": "ip"
        },
        "conditional": {
            "present": "c",
            "past": "cp"
        },
        "subjunctive": {
            "present": "s",
            "imperfect": "si",
            "past": "spa",
            "pluperfect": "spq"
        },
        "infinitive": {
            "present": "npr",
            "past": "npa",
            "future": "nf"
        },
        "participle": {
            "present": "pr",
            "past": "pp",
            "future": "pf"
        }
    },
    "type": {
        "verb": {
            "alias": "vt"
        },
        "noun": {
            "alias": "nt"
        },
        "pronoun": {
            "alias": "pt",
            "personnal": "p",
            "reflexive": "rx",
            "demonstrative": "d",
            "indefinite": "i",
            "relative": "r",
            "interrogative": "in",
            "existential": "ex",
            "possessive": "po",
            "adverbial": "a"
        }
    },
    "person": {
        "alias": "pe",
        "unapplicable": null,
        "unspecified": "x",
        "p1": 1,
        "p2": 2,
        "p3": 3
    },
    "gender": {
        "alias": "g",
        "unapplicable": null,
        "unspecified": "x",
        "masculine": "m",
        "feminine": "f",
        "neuter": "n",
        "either": "x"
    },
    "number": {
        "alias": "n",
        "unapplicable": null,
        "unspecified": "x",
        "singular": "s",
        "plural": "p",
        "either": "x"
    },
    "owner": {
        "alias": "ow",
        "singular": "s",
        "plural": "p",
        "either": "x"
    },
    "form": {
        "alias": "f",
        "comparative": "co",
        "superlative": "su"
    },
    "antepose": {
        "alias": "pos",
        "default": "post",
        "before": "pre",
        "after": "post"
    },
    "typography": {
        "alias": "typo",
        "ucfirst": "ucf",
        "before": "b",
        "after": "a",
        "surround": "sur",
        "position": {
            "alias": "pos",
            "left": "l",
            "right": "r"
        },
        "complementary": "compl"
    },
    "sentence_type": {
        "alias": "typ",
        "declarative": "dec",
        "exclamative": "exc",
        "interrogative": "int",
        "modality":"mod",
        "context_wise": ["dec","exc","int","mod"],
        "interro_prefix": {
            "default": "base",
            "yesOrNo": "yon",
            "whoSubject": "wos",
            "whoDirect": "wod",
            "whoIndirect": "woi",
            "whatDirect": "wad",
            "where": "whe",
            "when":"whn", //GL ajout de TYPes de questions
            "why":"why",
            "how": "how",
            "howMuch": "muc"
        },
        "modality_prefix":{
            "default":"base",
            "possibility":"poss",
            "permission": "perm",
            "necessity":  "nece",
            "willingness": "will",
            "obligation": "obli"
        }
    },
    "verb_option": {
        "alias": "vOpt",
        "negation": "neg",
        "passive": "pas",
        "progressive": "prog",
        "perfect": "perf"
    },
    "cdInfo": {
        "alias": "cdInfo"
    },
    "liaison": {
        "alias": "lier"
    },
    "toPronoun": {
        "alias": "toPro"
    },
    "html": {
        "alias": "html",
        "element": "elt",
        "attribute": "attr"
    },
    "phonetic": {
        "alias": "phon",
        "elision": "ev",
        "hVoyelle": "hAn"
    },
    "date": {
        "alias": "DT"
    },
    "numerical": {
        "alias": "NO"
    },
    "display_option": {
        "alias": "dOpt",
        "raw": "raw",
        "max_precision": "mprecision",
        "natural": "nat",
        "ordinal":"ord",
        "year": "year",
        "month": "month",
        "date": "date",
        "day": "day",
        "hour": "hour",
        "minute": "minute",
        "second": "second",
        "relative_time": "rtime",
        "determiner": "det",
        "natural_language": "nl"
    }
}

var lemmataEn=null;
var loadEn = function(trace,lenient){    
    var language = "en";
    if (lenient===undefined)lenient=false;
    try{
        JSrealBResource[language]["lexicon"] = lexiconEn;
        JSrealBResource[language]["rule"] = ruleEn;
        if (lenient && lemmataEn==null) {
            lemmataEn=buildLemmata("en",lexiconEn,ruleEn);
        }
        if(typeof JSrealBResource.common.feature !== "undefined")
        {
            JSrealB.init(language, lexiconEn, ruleEn, 
                JSrealBResource.common.feature,
                lenient,lemmataEn
            );
        }
        else{
            JSrealBResource.common.feature = feature;
            JSrealB.init(language, lexiconEn, ruleEn, feature,lenient,lemmataEn);
        }
        if(trace)
            console.warn("English language loaded successfully.")
    }
    catch(e){
        console.warn("Error loading JSrealB En: "+e)
    }
}
    
var lemmataFr=null;
var loadFr = function(trace,lenient){
    var language = "fr";
    if (lenient===undefined)lenient=false;
    try{
        JSrealBResource[language]["lexicon"] = lexiconFr;
        JSrealBResource[language]["rule"] = ruleFr;
        if (lenient && lemmataFr==null) {
            lemmataFr=buildLemmata("fr",lexiconFr,ruleFr);
        }
        if(typeof JSrealBResource.common.feature !== "undefined")
        {
            JSrealB.init(language, lexiconFr, ruleFr, 
                JSrealBResource.common.feature,lenient,lemmataFr);
        }
        else{
            JSrealBResource.common.feature = feature;
            JSrealB.init(language, lexiconFr, ruleFr, feature,lenient,lemmataFr);
        }
        if(trace)
            console.warn("Langue française chargée.")
    }
    catch(e){
        console.warn("Error loading JSrealB Fr: "+e)
    }
}

////////  useful for avoiding to export the JSrealB object

//// add to lexicon and return the updated object
///    to remove from lexicon (pass undefined as newInfos)
var addToLexicon = function(lemma,newInfos){
    if (newInfos==undefined){// convenient when called with a single JSON object as shown in the IDE
        newInfos=Object.values(lemma)[0];
        lemma=Object.keys(lemma)[0];
    }
    var infos=JSrealB.Config.get("lexicon")[lemma]
    if (infos!==undefined && newInfos!==undefined){ // update with newInfos
        for (ni in newInfos) {
            infos[ni]=newInfos[ni]
        }
        JSrealB.Config.get("lexicon")[lemma]=infos
        return infos
    } else {
        JSrealB.Config.get("lexicon")[lemma]=newInfos
        return newInfos
    }
}

//// get lemma from lexicon (useful for debugging )
var getLemma = function(lemma){
    return JSrealB.Config.get("lexicon")[lemma]
}

// return the current realization language
var getLanguage=function(){
    return JSrealB.Config.get("language");
}

//// select a random element in a list useful to have some variety in the generated text
//  if the first argument is a list, selection is done within the list
//  otherwise the selection is among the arguements 
//   (if the selected element is a function, evaluate it without parameter)
var oneOf = function(elems){
    if (!Array.isArray(elems))
        elems=Array.from(arguments);
    e=elems[Math.floor(Math.random()*elems.length)];
    return typeof e=='function'?e():e;
}

var jsRealB_version="1.2";
var jsRealB_dateCreated=new Date(); // might be overridden by the makefile for node.js
jsRealB_dateCreated="2019-09-20 14:30"