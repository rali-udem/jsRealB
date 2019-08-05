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
    
    var groupPropNameList = (propList === undefined) ? Object.keys(this.prop).concat(Object.keys(this.defaultProp)) : propList;

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
    if(propList !== undefined && valueList !== undefined && propList.length !== valueList.length)
    {
        return false;
    }
    
    var groupPropNameList = (propList === undefined) ? Object.keys(this.prop)
            .concat(Object.keys(this.defaultProp)).concat(Object.keys(this.childrenProp)) : propList;

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
    
    var groupPropNameList = (propList === undefined) ? Object.keys(this.prop).concat(Object.keys(this.defaultProp)).concat(Object.keys(this.childrenProp)) : propList;
    
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
             JSrealB.Config.get("feature.category.word.adverb"),
             JSrealB.Config.get("feature.category.word.preposition"),
             JSrealB.Config.get("feature.category.word.conjunction"),
             JSrealB.Config.get("feature.category.phrase.adverb"),
             JSrealB.Config.get("feature.category.phrase.prepositional"),
             JSrealB.Config.get("feature.category.phrase.propositional"),
             JSrealB.Config.get("feature.category.phrase.coordinated"),
             JSrealB.Config.get("feature.category.phrase.sentence")]
    var elemList = this.elements;
    var change = false;
    var imax = elemList.length;
    //console.log(this)


        // trier les compléments d'un VP en ordre de longueur de réalisation...
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
                if(cd.category == JSrealB.Config.get("feature.category.word.pronoun"))
                    cd.unit = JSrealB.Config.get("rule.usePronoun.S"); 
                
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
                parent.addNewElement(VPpos,elemList[CDpos]);//will bump the verb and place the cd just before
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
                        } else {
                            parent.addNewElement(vp,pronoun);
                        }
                        parent.resetProp(true);
                        parent.elements[vp].setProp(JSrealB.Config.get("feature.cdInfo.alias"),cdInfo);
                    }                    
                break;
            }
            change =true;
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
        if (content === null) return "* aucune réalisation *";
        var res=elisionFr(content);
        // console.log("fr:%s",res)
        return res;
    } else {
        if (content === null) return "* no realisation *";
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

// simplification of JSrealB loading
//   dataDir: relative or absolute path to the data directory
//   language: "en" | "fr"
//   fn : function to call once loading is completed
function loadLanguage(dataDir,language,fn){
    JSrealLoader({
        language: language,
        lexiconUrl: dataDir+"lex-"+language+".json",
        ruleUrl: dataDir+"rule-"+language+".json",
        featureUrl: dataDir+"feature.json"
    }, 
    fn,
    function(mess){
        alert(mess)
    })
}
/**
 * HTTP Request
 */
JSrealB.Request = (function() {
    var createCORSRequest = function(method, url) {
        var xhr = new XMLHttpRequest();
        if (xhr.overrideMimeType)
        {
            xhr.overrideMimeType("application/json");
        }
        if ("withCredentials" in xhr) { // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest !== "undefined") { // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            xhr = null; // CORS not supported.
        }
        return xhr;
    };
    
    var httpGetRequest = function(url, success, failure) {

        var request = createCORSRequest("GET", url);
        if (!request) {
            JSrealB.Logger.alert('HTTP Get Request not supported');
            return;
        }
        request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200 || request.status === 0)
                success(request.responseText);
            else if (failure)
                failure(request.status, request.statusText);
            }
        };
        request.send(null);
    };
    
    return {
        getJson: function(url, success, failure) {
            
            if(typeof url === "undefined")
            {
                failure(610, "Incorrect url: " + url);
                return;
            }
            
            httpGetRequest(
                url, 
                function(rawData) {
                    try
                    {
                        var json = JSON.parse(rawData);
                        success(json);
                    }
                    catch(error)
                    {
                        failure(611, "JSON parsing error: " + error + " with " + url);
                    }
                },
                failure);
        }
    };
})();

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

var jsRealB_version="1.1";
var jsRealB_dateCreated=new Date();
// Lemmatization module
//    useful for checking that the tables generate the correct forms
//    also for creating a jsRealB expression from an inflected form
//    this is necessary for the "lenient" mode

//   show content of the lemmata table
function showLemmata(lemmata){
    console.log("-------")
    var keys=Array.from(lemmata.keys());
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
        var key=keys[i]
        console.log(key,":",""+JSON.stringify(lemmata.get(key)))
    }
}

var nbForms=0;
var checkAmbiguities=false;
//  add a Lemma struct combining the information given by obj
// object = {Pos1:{"lemma":[{g="..",..}],...}],Pos}
function addLemma(lemmata,word,obj){
    if (checkAmbiguities){
        // check if jsRealB generates the same string...
        var jsRexp=obj2jsr(obj);
        // console.log("addLemma",word,JSON.stringify(obj),jsRexp);
        var genWord=eval(jsRexp);
        if (genWord!=word){
            console.log("%s => %s != %s",jsRexp,genWord,word);
        }
    }
    // add word
    var lemma=lemmata.get(word);
    if (lemma===undefined)lemmata.set(word,lemma=new Object());
    var pos=obj["pos"];
    var lemmaPos=lemma[pos];
    if (lemmaPos===undefined)lemma[pos]=lemmaPos=new Object();
    var entry=obj["entry"];
    var lPosLemma=lemmaPos[lemma];
    if (lPosLemma===undefined)lemmaPos[entry]=lPosLemma=new Array();
    var options=new Object();
    var keys=Object.keys(obj);
    keys.splice(keys.indexOf("pos"),1);
    keys.splice(keys.indexOf("entry"),1);
    for (var i = 0; i < keys.length; i++) {
        var k=keys[i];
        options[k]=obj[k];
    }
    lPosLemma.push(options);
    nbForms+=1;
}

// create a jsRealB expression from an object of the form
//   {pos:..., entry:..., opt1:.., opt2,...}
function obj2jsr(obj){
    return obj["pos"]+'("'+obj["entry"]+'")'+jsRoptions(obj);
}

function jsRoptions(obj){
    var res="";
    var allKeys=Object.keys(obj);
    var iPos=allKeys.indexOf("pos");
    if (iPos != -1)allKeys.splice(iPos,1);
    var iEntry=allKeys.indexOf("entry");
    if (iEntry != -1)allKeys.splice(iEntry,1);
    for (var i = 0; i < allKeys.length; i++) {
        var key=allKeys[i];
        res+="."+key+'("'+obj[key]+'")';
    }
    return res;
}

//  return a list of jsRealB expressions corresponding to a lemma object
function lemma2jsRexps(lemmaObj){
    var exps=[];
    var allPos=Object.keys(lemmaObj);
    for (var i = 0; i < allPos.length; i++) {
        var pos=allPos[i];
        var allEntries=Object.keys(lemmaObj[pos]);
        for (var j = 0; j < allEntries.length; j++) {
            var entry=allEntries[j];
            var exp=pos+'("'+entry+'")';
            var allOptions=lemmaObj[pos][entry];
            for (var k = 0; k < allOptions.length; k++) {
                exps.push(exp+jsRoptions(allOptions[k]));
            }
        }
    }
    return exps;
}

function genExp(declension,pos,entry,lexiconEntry){
    var out={pos:pos,entry:entry};
    switch (pos) {
    case "N":
        var g=lexiconEntry["g"];
        // gender are ignored in English
        if (lemmataLang=="en"|| declension["g"]==g || declension["g"]=="x"){
            if (declension["n"]=="p")out["n"]="p";
            return out;
        }
        break;
    case "Pro":case "D":
        var defGender=lemmataLang=="fr"?"m":"n";
        var g=declension["g"];
        if (g===undefined || g=="x" || g=="n")g=defGender;
        out["g"]=g;
        var n=declension["n"];
        if (n===undefined || n=="x")n="s";
        if (n!="s")out["n"]=n;
        if ("pe" in declension){
            var pe=declension["pe"];
            if (pe!=3)out["pe"]=pe;
        }
        if ("own" in declension){
            out["ow"]=declension["own"];
        }
        return out;
        break;
    case "A": 
        if (lemmataLang=="fr"){
            var g=declension["g"];
            if (g===undefined || g=="x")g="m";
            var n=declension["n"];
            if (n===undefined)n="s";
            if (g!="m")out["g"]=g;
            if (n!="s")out["n"]=n;
        } else { // comparatif en anglais
            var f=declension["f"];
            if (f!=undefined)out["f"]=f;
        }
        return out;
        break;
    case "Adv":
        if (lemmataLang=="fr"){
            return out;
        } else {
            var f=declension["f"];
            if (f!=undefined)out["f"]=f;
        }
        return out;
        break;
    default:
        console.log("***POS not implemented:%s",pos)
    }
    return null;
}
    
function expandConjugation(lexicon,lemmata,rules,entry,tab,conjug){
    var conjug=rules["conjugation"][tab];
    // console.log(conjug);
    if (conjug==undefined)return;
    var ending=conjug["ending"];
    var endRadical=entry.length-ending.length;
    var radical=entry.slice(0,endRadical);
    if (entry.slice(endRadical)!=ending){
        console.log("strange ending:",entry,":",ending);
        return;
    }
    var tenses=Object.keys(conjug["t"]);
    for (var k = 0; k < tenses.length; k++) {
        var t=tenses[k];
        var persons=conjug["t"][t]
        if (persons===null)continue;
        var jsRexp={pos:"V",entry:entry};
        if (typeof persons =="object" && persons.length==6){
            for (var pe = 0; pe < 6; pe++) {
                if (persons[pe]==null) continue;
                var word=radical+persons[pe];
                var pe3=pe%3+1;
                var n=pe>=3?"p":"s";
                if (t!="p")jsRexp["t"]=t;
                if (pe3!=3)jsRexp["pe"]=pe3; else delete jsRexp["pe"];
                if (n!="s")jsRexp["n"]=n;
                addLemma(lemmata,word,jsRexp);
            }
        } else if (typeof persons=="string"){
            if (lemmataLang=="en" && t=="b") {
                jsRexp["t"]="b";
                addLemma(lemmata,"to "+radical+persons,jsRexp);
            } else {
                if (t!="p")jsRexp["t"]=t;
                addLemma(lemmata,radical+persons,jsRexp);
            }
        } else {
            console.log("***Strange persons:",entry,tenses,k,persons);
        }
    }
}

function expandDeclension(lexicon,lemmata,rules,entry,pos,tabs){
    // console.log(entry,"tabs",tabs)
    for (var k = 0; k < tabs.length; k++) {
        var tab=tabs[k];
        var rulesDecl=rules["declension"];
        var declension=null;
        if (tab in rulesDecl)
            declension=rulesDecl[tab];
        else if (tab in rules["regular"]){
            addLemma(lemmata,entry,{pos:pos,entry:entry});
            continue;
        }
        if (declension==null)continue;
        // console.log(declension);
        var ending=declension["ending"];
        var endRadical=entry.length-ending.length;
        var radical=entry.slice(0,endRadical);
        if (entry.slice(endRadical)!=ending){
            console.log("strange ending:",entry,":",ending);
            continue;
        }
        var decl=declension["declension"];
        // console.log("decl",decl);
        for (var l = 0; l < decl.length; l++) {
            var jsRexp=genExp(decl[l],pos,entry,lexicon[entry][pos]);
            if (jsRexp!=null){
                var word=radical+decl[l]["val"];
                addLemma(lemmata,word,jsRexp);
            }
        }
    }
}

function buildLemmata(lang,lexicon,rules){
    lemmataLang=lang;
    var lemmata=new Map();  // use a Map instead of an object because "constructor" is an English word...
    var allEntries=Object.keys(lexicon);
    for (var i = 0; i < allEntries.length; i++) {
        var entry=allEntries[i];
        var entryInfos=lexicon[entry];
        var allPos=Object.keys(entryInfos);
        // console.log(entryInfos,allPos)
        for (var j = 0; j <  allPos.length; j++) {
            var pos=allPos[j];
            // console.log(entryInfos,j,pos);
            if (pos=="Pc") continue; // ignore punctuation
            if (pos=="V"){ // conjugation
                expandConjugation(lexicon,lemmata,rules,entry,
                                  entryInfos["V"]["tab"],rules["conjugation"]["tab"]);
            } else {       // declension
                expandDeclension(lexicon,lemmata,rules,entry,pos,entryInfos[pos]["tab"]);
            }
        }
    }
    return lemmata;
}

//  return the lemma corresponding to a form and a pos
//          undefined if not found
function form2lemma(lemmata,form,pos){
    var lemma = lemmata.get(form);
    if (lemma === undefined) return undefined;
    if (lemma[pos]===undefined) return undefined;
    return Object.keys(lemma[pos])[0];
}
var ruleEn = //========== rule-en.js
{
    "conjugation": {
        "v1": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v2": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","es","","",""]
            }
        },
        "v3": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v4": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "ied",
                "pr": "ying",
                "pp": "ied",
                "p": ["y","y","ies","y","y","y"]
            }
        },
        "v5": {
            "ending": "b",
            "t": {
                "b": "b",
                "ps": "bbed",
                "pr": "bbing",
                "pp": "bbed",
                "p": ["b","b","bs","b","b","b"]
            }
        },
        "v6": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "dded",
                "pr": "dding",
                "pp": "dded",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v7": {
            "ending": "g",
            "t": {
                "b": "g",
                "ps": "gged",
                "pr": "gging",
                "pp": "gged",
                "p": ["g","g","gs","g","g","g"]
            }
        },
        "v8": {
            "ending": "k",
            "t": {
                "b": "k",
                "ps": "kked",
                "pr": "kking",
                "pp": "kked",
                "p": ["k","k","ks","k","k","k"]
            }
        },
        "v9": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "lled",
                "pr": "lling",
                "pp": "lled",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v10": {
            "ending": "m",
            "t": {
                "b": "m",
                "ps": "mmed",
                "pr": "mming",
                "pp": "mmed",
                "p": ["m","m","ms","m","m","m"]
            }
        },
        "v11": {
            "ending": "n",
            "t": {
                "b": "n",
                "ps": "nned",
                "pr": "nning",
                "pp": "nned",
                "p": ["n","n","ns","n","n","n"]
            }
        },
        "v12": {
            "ending": "p",
            "t": {
                "b": "p",
                "ps": "pped",
                "pr": "pping",
                "pp": "pped",
                "p": ["p","p","ps","p","p","p"]
            }
        },
        "v13": {
            "ending": "r",
            "t": {
                "b": "r",
                "ps": "rred",
                "pr": "rring",
                "pp": "rred",
                "p": ["r","r","rs","r","r","r"]
            }
        },
        "v14": {
            "ending": "t",
            "t": {
                "b": "t",
                "ps": "tted",
                "pr": "tting",
                "pp": "tted",
                "p": ["t","t","ts","t","t","t"]
            }
        },
        "v15": {
            "ending": "v",
            "t": {
                "b": "v",
                "ps": "vved",
                "pr": "vving",
                "pp": "vved",
                "p": ["v","v","vs","v","v","v"]
            }
        },
        "v16": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "d",
                "pr": "ing",
                "pp": "d",
                "p": ["","","s","","",""]
            }
        },
        "v17": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ting",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v18": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v19": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "id",
                "pr": "ying",
                "pp": "id",
                "p": ["y","y","ys","y","y","y"]
            }
        },
        "v20": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "ook",
                "pr": "aking",
                "pp": "aken",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v21": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ung",
                "pr": "inging",
                "pp": "ung",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v22": {
            "ending": "ed",
            "t": {
                "b": "ed",
                "ps": "d",
                "pr": "eding",
                "pp": "d",
                "p": ["ed","ed","eds","ed","ed","ed"]
            }
        },
        "v23": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "t",
                "pr": "ding",
                "pp": "t",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v24": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ked",
                "pr": "king",
                "pp": "ked",
                "p": ["","","s","","",""]
            }
        },
        "v25": {
            "ending": "ind",
            "t": {
                "b": "ind",
                "ps": "ound",
                "pr": "inding",
                "pp": "ound",
                "p": ["ind","ind","inds","ind","ind","ind"]
            }
        },
        "v26": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v27": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "own",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v28": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ying",
                "pp": "ied",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v29": {
            "ending": "ep",
            "t": {
                "b": "ep",
                "ps": "pt",
                "pr": "eping",
                "pp": "pt",
                "p": ["ep","ep","eps","ep","ep","ep"]
            }
        },
        "v30": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "ore",
                "pr": "earing",
                "pp": "orn",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v31": {
            "ending": "ell",
            "t": {
                "b": "ell",
                "ps": "old",
                "pr": "elling",
                "pp": "old",
                "p": ["ell","ell","ells","ell","ell","ell"]
            }
        },
        "v32": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v33": {
            "ending": "un",
            "t": {
                "b": "un",
                "ps": "an",
                "pr": "unning",
                "pp": "un",
                "p": ["un","un","uns","un","un","un"]
            }
        },
        "v34": {
            "ending": "old",
            "t": {
                "b": "old",
                "ps": "eld",
                "pr": "olding",
                "pp": "eld",
                "p": ["old","old","olds","old","old","old"]
            }
        },
        "v35": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "pr": "oing",
                "pp": "one",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v36": {
            "ending": "ite",
            "t": {
                "b": "ite",
                "ps": "ote",
                "pr": "iting",
                "pp": "itten",
                "p": ["ite","ite","ites","ite","ite","ite"]
            }
        },
        "v37": {
            "ending": "and",
            "t": {
                "b": "and",
                "ps": "ood",
                "pr": "anding",
                "pp": "ood",
                "p": ["and","and","ands","and","and","and"]
            }
        },
        "v38": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ting",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v39": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v40": {
            "ending": "ot",
            "t": {
                "b": "ot",
                "ps": "t",
                "pr": "oting",
                "pp": "t",
                "p": ["ot","ot","ots","ot","ot","ot"]
            }
        },
        "v41": {
            "ending": "ome",
            "t": {
                "b": "ome",
                "ps": "ame",
                "pr": "oming",
                "pp": "ome",
                "p": ["ome","ome","omes","ome","ome","ome"]
            }
        },
        "v42": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ove",
                "pr": "iving",
                "pp": "iven",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v43": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ave",
                "pr": "iving",
                "pp": "iven",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v44": {
            "ending": "it",
            "t": {
                "b": "it",
                "ps": "at",
                "pr": "itting",
                "pp": "at",
                "p": ["it","it","its","it","it","it"]
            }
        },
        "v45": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ought",
                "pr": "inking",
                "pp": "ought",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v46": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ang",
                "pr": "inging",
                "pp": "ung",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v47": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "pp": "idden",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v48": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pr": "going",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v49": {
            "ending": "eeze",
            "t": {
                "b": "eeze",
                "ps": "oze",
                "pr": "eezing",
                "pp": "ozen",
                "p": ["eeze","eeze","eezes","eeze","eeze","eeze"]
            }
        },
        "v50": {
            "ending": "ee",
            "t": {
                "b": "ee",
                "ps": "aw",
                "pr": "eeing",
                "pp": "een",
                "p": ["ee","ee","ees","ee","ee","ee"]
            }
        },
        "v51": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "ore",
                "pr": "earing",
                "pp": "orne",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v52": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v53": {
            "ending": "d",
            "t": {
                "b": "d",
                "ps": "ded",
                "pr": "ding",
                "pp": "ded",
                "p": ["d","d","ds","d","d","d"]
            }
        },
        "v54": {
            "ending": "aw",
            "t": {
                "b": "aw",
                "ps": "ew",
                "pr": "awing",
                "pp": "awn",
                "p": ["aw","aw","aws","aw","aw","aw"]
            }
        },
        "v55": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "t",
                "pr": "ing",
                "pp": "t",
                "p": ["","","s","","",""]
            }
        },
        "v56": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "sed",
                "pr": "sing",
                "pp": "sed",
                "p": ["","","ses","","",""]
            }
        },
        "v57": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v58": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v59": {
            "ending": "uy",
            "t": {
                "b": "uy",
                "ps": "ought",
                "pr": "uying",
                "pp": "ought",
                "p": ["uy","uy","uys","uy","uy","uy"]
            }
        },
        "v60": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v61": {
            "ending": "ke",
            "t": {
                "b": "ke",
                "ps": "de",
                "pr": "king",
                "pp": "de",
                "p": ["ke","ke","kes","ke","ke","ke"]
            }
        },
        "v62": {
            "ending": "ive",
            "t": {
                "b": "ive",
                "ps": "ived",
                "pr": "iving",
                "pp": "ived",
                "p": ["ive","ive","ives","ive","ive","ive"]
            }
        },
        "v63": {
            "ending": "ise",
            "t": {
                "b": "ise",
                "ps": "ose",
                "pr": "ising",
                "pp": "isen",
                "p": ["ise","ise","ises","ise","ise","ise"]
            }
        },
        "v64": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v65": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v66": {
            "ending": "ine",
            "t": {
                "b": "ine",
                "ps": "one",
                "pr": "ining",
                "pp": "one",
                "p": ["ine","ine","ines","ine","ine","ine"]
            }
        },
        "v67": {
            "ending": "ight",
            "t": {
                "b": "ight",
                "ps": "ought",
                "pr": "ighting",
                "pp": "ought",
                "p": ["ight","ight","ights","ight","ight","ight"]
            }
        },
        "v68": {
            "ending": "ght",
            "t": {
                "b": "ght",
                "ps": "ghted",
                "pr": "ghting",
                "pp": "ghted",
                "p": ["ght","ght","ghts","ght","ght","ght"]
            }
        },
        "v69": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "ove",
                "pr": "eaving",
                "pp": "oven",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v70": {
            "ending": "eat",
            "t": {
                "b": "eat",
                "ps": "ate",
                "pr": "eating",
                "pp": "eaten",
                "p": ["eat","eat","eats","eat","eat","eat"]
            }
        },
        "v71": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v72": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "ed",
                "pr": "eing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v73": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "d",
                "pr": "eing",
                "pp": "d",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v74": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "ten",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v75": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v76": {
            "ending": "all",
            "t": {
                "b": "all",
                "ps": "ell",
                "pr": "alling",
                "pp": "allen",
                "p": ["all","all","alls","all","all","all"]
            }
        },
        "v77": {
            "ending": "ad",
            "t": {
                "b": "ad",
                "ps": "d",
                "pr": "ading",
                "pp": "d",
                "p": ["ad","ad","ads","ad","ad","ad"]
            }
        },
        "v78": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "pp": "en",
                "p": ["","","s","","",""]
            }
        },
        "v79": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "id",
                "pr": "ying",
                "pp": "id",
                "p": ["y","y","ith","y","y","y"]
            }
        },
        "v80": {
            "ending": "y",
            "t": {
                "b": "y",
                "ps": "ew",
                "pr": "ying",
                "pp": "own",
                "p": ["y","y","ies","y","y","y"]
            }
        },
        "v81": {
            "ending": "will",
            "t": {
                "b": "will",
                "p": "will",
                "ps": "would"
            }
        },
        "v82": {
            "ending": "whiz",
            "t": {
                "b": "whiz"
            }
        },
        "v83": {
            "ending": "ve",
            "t": {
                "b": "ve",
                "ps": "d",
                "pr": "ving",
                "pp": "d",
                "p": ["ve","ve","s","ve","ve","ve"]
            }
        },
        "v84": {
            "ending": "tch",
            "t": {
                "b": "tch",
                "ps": "ught",
                "pr": "tching",
                "pp": "ught",
                "p": ["tch","tch","tches","tch","tch","tch"]
            }
        },
        "v85": {
            "ending": "savvy",
            "t": {
                "b": "savvy"
            }
        },
        "v86": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "sed",
                "pr": "sing",
                "pp": "ses",
                "p": ["s","s","ses","s","s","s"]
            }
        },
        "v87": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "sed",
                "pr": "sing",
                "pp": "sed",
                "p": ["s","s","ses","s","s","s"]
            }
        },
        "v88": {
            "ending": "s",
            "t": {
                "b": "s",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["s","s","s","s","s","s"]
            }
        },
        "v89": {
            "ending": "rst",
            "t": {
                "b": "rst",
                "ps": "rst",
                "pr": "rsting",
                "pp": "rst",
                "p": ["rst","rst","rsts","rst","rst","rst"]
            }
        },
        "v90": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "owed",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v91": {
            "ending": "ow",
            "t": {
                "b": "ow",
                "ps": "ew",
                "pr": "owing",
                "pp": "owed",
                "p": ["ow","ow","ows","ow","ow","ow"]
            }
        },
        "v92": {
            "ending": "othe",
            "t": {
                "b": "othe",
                "ps": "ad",
                "pr": "othing",
                "pp": "ad",
                "p": ["othe","othe","othes","othe","othe","othe"]
            }
        },
        "v93": {
            "ending": "ose",
            "t": {
                "b": "ose",
                "ps": "se",
                "pr": "osing",
                "pp": "sen",
                "p": ["ose","ose","oses","ose","ose","ose"]
            }
        },
        "v94": {
            "ending": "ork",
            "t": {
                "b": "ork",
                "ps": "orked",
                "pr": "orking",
                "pp": "orked",
                "p": ["ork","ork","orks","ork","ork","ork"]
            }
        },
        "v95": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v96": {
            "ending": "o",
            "t": {
                "b": "o",
                "ps": "id",
                "pr": "oing",
                "pp": "one",
                "p": ["o","o","oes","o","o","o"]
            }
        },
        "v97": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "t",
                "pr": "ling",
                "p": ["l","l","ls","l","l","l"]
            }
        },
        "v98": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": "ls"
            }
        },
        "v99": {
            "ending": "l",
            "t": {
                "b": "l",
                "ps": "led",
                "pr": "ling",
                "pp": "led",
                "p": "ls"
            }
        },
        "v100": {
            "ending": "it",
            "t": {
                "b": "it",
                "ps": "at",
                "pr": "itting",
                "pp": "itted",
                "p": ["it","it","its","it","it","it"]
            }
        },
        "v101": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "unk",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v102": {
            "ending": "ink",
            "t": {
                "b": "ink",
                "ps": "ank",
                "pr": "inking",
                "pp": "unk",
                "p": ["ink","ink","inks","ink","ink","ink"]
            }
        },
        "v103": {
            "ending": "ing",
            "t": {
                "b": "ing",
                "ps": "ought",
                "pr": "inging",
                "pp": "ought",
                "p": ["ing","ing","ings","ing","ing","ing"]
            }
        },
        "v104": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "un",
                "pr": "inning",
                "pp": "un",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v105": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "on",
                "pr": "inning",
                "pp": "on",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v106": {
            "ending": "in",
            "t": {
                "b": "in",
                "ps": "an",
                "pr": "inning",
                "pp": "un",
                "p": ["in","in","ins","in","in","in"]
            }
        },
        "v107": {
            "ending": "im",
            "t": {
                "b": "im",
                "ps": "am",
                "pr": "imming",
                "pp": "um",
                "p": ["im","im","ims","im","im","im"]
            }
        },
        "v108": {
            "ending": "ike",
            "t": {
                "b": "ike",
                "ps": "uck",
                "pr": "iking",
                "pp": "uck",
                "p": ["ike","ike","ikes","ike","ike","ike"]
            }
        },
        "v109": {
            "ending": "ig",
            "t": {
                "b": "ig",
                "ps": "ug",
                "pr": "igging",
                "pp": "ug",
                "p": ["ig","ig","igs","ig","ig","ig"]
            }
        },
        "v110": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v111": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v112": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ied",
                "pr": "ieing",
                "pp": "ied",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v113": {
            "ending": "ie",
            "t": {
                "b": "ie",
                "ps": "ay",
                "pr": "ying",
                "pp": "ain",
                "p": ["ie","ie","ies","ie","ie","ie"]
            }
        },
        "v114": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v115": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ode",
                "pr": "iding",
                "pp": "id",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v116": {
            "ending": "ide",
            "t": {
                "b": "ide",
                "ps": "ided",
                "pr": "iding",
                "pp": "ided",
                "p": ["ide","ide","ides","ide","ide","ide"]
            }
        },
        "v117": {
            "ending": "id",
            "t": {
                "b": "id",
                "ps": "ade",
                "pr": "idding",
                "pp": "id",
                "p": ["id","id","ids","id","id","id"]
            }
        },
        "v118": {
            "ending": "id",
            "t": {
                "b": "id",
                "ps": "ad",
                "pr": "idding",
                "pp": "idden",
                "p": ["id","id","ids","id","id","id"]
            }
        },
        "v119": {
            "ending": "ick",
            "t": {
                "b": "ick",
                "ps": "uck",
                "pr": "icking",
                "pp": "uck",
                "p": ["ick","ick","icks","ick","ick","ick"]
            }
        },
        "v120": {
            "ending": "have",
            "t": {
                "b": "have",
                "ps": "had",
                "pr": "having",
                "pp": "had",
                "p": ["have","have","has","have","have","have"]
            }
        },
        "v121": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v122": {
            "ending": "go",
            "t": {
                "b": "go",
                "ps": "went",
                "pr": "going",
                "pp": "gone",
                "p": ["go","go","goes","go","go","go"]
            }
        },
        "v123": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "t",
                "pr": "eting",
                "pp": "t",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v124": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "ot",
                "pr": "etting",
                "pp": "ot",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v125": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "ot",
                "pr": "etting",
                "pp": "otten",
                "p": ["et","et","ets","et","et","et"]
            }
        },
        "v126": {
            "ending": "et",
            "t": {
                "b": "et",
                "ps": "at",
                "pp": "otten"
            }
        },
        "v127": {
            "ending": "elt",
            "t": {
                "b": "elt",
                "ps": "elted",
                "pr": "elting",
                "pp": "elted",
                "p": ["elt","elt","elts","elt","elt","elt"]
            }
        },
        "v128": {
            "ending": "ell",
            "t": {
                "b": "ell",
                "ps": "elled",
                "pr": "elling",
                "pp": "elled",
                "p": ["ell","ell","ells","ell","ell","ell"]
            }
        },
        "v129": {
            "ending": "el",
            "t": {
                "b": "el",
                "ps": "lt",
                "pr": "eling",
                "pp": "lt",
                "p": ["el","el","els","el","el","el"]
            }
        },
        "v130": {
            "ending": "el",
            "t": {
                "b": "el",
                "ps": "eled",
                "pr": "eling",
                "pp": "eled",
                "p": ["el","el","els","el","el","el"]
            }
        },
        "v131": {
            "ending": "eek",
            "t": {
                "b": "eek",
                "ps": "ought",
                "pr": "eeking",
                "pp": "ought",
                "p": ["eek","eek","eeks","eek","eek","eek"]
            }
        },
        "v132": {
            "ending": "eech",
            "t": {
                "b": "eech",
                "ps": "eeched",
                "pr": "eeching",
                "pp": "eeched",
                "p": ["eech","eech","eeches","eech","eech","eech"]
            }
        },
        "v133": {
            "ending": "ed",
            "t": {
                "b": "ed",
                "ps": "d",
                "pr": "eding",
                "pp": "d",
                "p": ["ed","ed","eds","ed","ed","ed"]
            }
        },
        "v134": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "eaved",
                "pr": "eaving",
                "pp": "eaved",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v135": {
            "ending": "eave",
            "t": {
                "b": "eave",
                "ps": "ave",
                "pr": "eaving",
                "pp": "eaved",
                "p": ["eave","eave","eaves","eave","eave","eave"]
            }
        },
        "v136": {
            "ending": "ear",
            "t": {
                "b": "ear",
                "ps": "eared",
                "pr": "earing",
                "pp": "eared",
                "p": ["ear","ear","ears","ear","ear","ear"]
            }
        },
        "v137": {
            "ending": "eal",
            "t": {
                "b": "eal",
                "ps": "ole",
                "pr": "ealing",
                "pp": "olen",
                "p": ["eal","eal","eals","eal","eal","eal"]
            }
        },
        "v138": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "oke",
                "pr": "eaking",
                "pp": "oken",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v139": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "oke",
                "pr": "eaking",
                "pp": "oke",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v140": {
            "ending": "eak",
            "t": {
                "b": "eak",
                "ps": "ake",
                "pr": "eaking",
                "pp": "oken",
                "p": ["eak","eak","eaks","eak","eak","eak"]
            }
        },
        "v141": {
            "ending": "ead",
            "t": {
                "b": "ead",
                "ps": "od",
                "pr": "eading",
                "pp": "od",
                "p": ["ead","ead","eads","ead","ead","ead"]
            }
        },
        "v142": {
            "ending": "each",
            "t": {
                "b": "each",
                "ps": "aught",
                "pr": "eaching",
                "pp": "aught",
                "p": ["each","each","eaches","each","each","each"]
            }
        },
        "v143": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "t",
                "pr": "ing",
                "pp": "t",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v145": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "e",
                "pr": "ing",
                "pp": "ed",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v146": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "den",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v147": {
            "ending": "e",
            "t": {
                "b": "e",
                "ps": "",
                "pr": "ing",
                "pp": "den",
                "p": ["e","e","es","e","e","e"]
            }
        },
        "v148": {
            "ending": "de",
            "t": {
                "b": "de",
                "ps": "id",
                "pp": "den"
            }
        },
        "v149": {
            "ending": "born",
            "t": {
                "pp": "born"
            }
        },
        "v150": {
            "ending": "beware",
            "t": {
                "b": "beware"
            }
        },
        "v151": {
            "ending": "be",
            "t": {
                "b": "be",
                "ps": ["was","were","was","were","were","were"],
                "pr": "being",
                "pp": "been",
                "p": ["am","are","is","are","are","are"]
            }
        },
        "v152": {
            "ending": "be",
            "t": {
                "b": "be",
                "p": ["'m","'re","is","'re","'re","'re"],
                "ps": ["was","were","was","were","were","were"],
                "pr": "being",
                "pp": "been"
            }
        },
        "v153": {
            "ending": "ay",
            "t": {
                "b": "ay",
                "ps": "ight",
                "p": ["ay","ay","ay","ay","ay","ay"]
            }
        },
        "v154": {
            "ending": "ay",
            "t": {
                "b": "ay",
                "ps": "ew",
                "pr": "aying",
                "pp": "ain",
                "p": ["ay","ay","ays","ay","ay","ay"]
            }
        },
        "v155": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "ft",
                "pr": "aving",
                "pp": "ft",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v156": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "aved",
                "pr": "aving",
                "pp": "aved",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v157": {
            "ending": "ave",
            "t": {
                "b": "ave",
                "ps": "aved",
                "pr": "aving",
                "pp": "aved",
                "p": ["ave","ave","aves","ave","ave","ave"]
            }
        },
        "v158": {
            "ending": "are",
            "t": {
                "b": "are",
                "ps": "are",
                "p": ["are","are","aren't","are","are","are"]
            }
        },
        "v159": {
            "ending": "ang",
            "t": {
                "b": "ang",
                "ps": "ung",
                "pr": "anging",
                "pp": "ung",
                "p": ["ang","ang","angs","ang","ang","ang"]
            }
        },
        "v160": {
            "ending": "ang",
            "t": {
                "b": "ang",
                "ps": "anged",
                "pr": "anging",
                "pp": "anged",
                "p": ["ang","ang","angs","ang","ang","ang"]
            }
        },
        "v161": {
            "ending": "an",
            "t": {
                "b": "an",
                "ps": "ould",
                "p": ["an","an","an","an","an","an"]
            }
        },
        "v162": {
            "ending": "all",
            "t": {
                "b": "all",
                "p": "all",
                "ps": "ould"
            }
        },
        "v163": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "oke",
                "pr": "aking",
                "pp": "oke",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v164": {
            "ending": "ake",
            "t": {
                "b": "ake",
                "ps": "oke",
                "pr": "aking",
                "pp": "oken",
                "p": ["ake","ake","akes","ake","ake","ake"]
            }
        },
        "v165": {
            "ending": "ad",
            "t": {
                "b": "ad",
                "ps": "aded",
                "pr": "ading",
                "pp": "aded",
                "p": ["ad","ad","ads","ad","ad","ad"]
            }
        },
        "v166": {
            "ending": "must",
            "t": {
                "b": "",
                "ps":"must",
                "p":"must"
            }
        },
        "v167": {
            "ending": "",
            "t": {
                "b": "",
                "p": ["","","n't","","",""]
            }
        },
        "v168": {
            "ending": "ought",
            "t": {
                "b": "",
                "p": "ought",
                "ps":"ought"
            }
        },
        "v169": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "zed",
                "pr": "zing",
                "pp": "zed",
                "p": ["","","zes","","",""]
            }
        },
        "v170": {
            "ending": "",
            "t": {
                "b": "",
                "pp": "n"
            }
        },
        "v171": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v172": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","es","","",""]
            }
        },
        "v173": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v174": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "ed",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v175": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ing",
                "p": ["","","s","","",""]
            }
        },
        "v176": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": ""
            }
        },
        "v177": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "ding",
                "pp": "",
                "p": ["","","s","","",""]
            }
        },
        "v178": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "",
                "pr": "",
                "pp": "",
                "p": ["","","","","",""]
            }
        },
        "v179": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "'d",
                "pr": "ing",
                "pp": "'d",
                "p": ["","","s","","",""]
            }
        },
        "v180": {
            "ending": "",
            "t": {
                "b": "",
                "ps": "'d",
                "pr": "ing",
                "pp": "ed",
                "p": ["","","s","","",""]
            }
        },
        "v181": {
            "ending": "ll",
            "t": {
                "b": "ll",
                "ps": "lled",
                "pr": "lling",
                "pp": "lled",
                "p": ["ll","ll","ls","ll","ll","ll"]
            }
        }
    },
    "declension": {
        "n1": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "s","n": "p"
            }]
        },
        "n2": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "es","n": "p"
            }]
        },
        "n3": {
            "ending": "y",
            "declension": [{
                "val": "y","n": "s"
            },{
                "val": "ies","n": "p"
            }]
        },
        "n4": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "","n": "p"
            }]
        },
        "n5": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            }]
        },
        "n6": {
            "ending": "",
            "declension": [{
                "val": "","n": "p"
            }]
        },
        "n7": {
            "ending": "an",
            "declension": [{
                "val": "an","n": "s"
            },{
                "val": "en","n": "p"
            }]
        },
        "n8": {
            "ending": "is",
            "declension": [{
                "val": "is","n": "s"
            },{
                "val": "es","n": "p"
            }]
        },
        "n9": {
            "ending": "f",
            "declension": [{
                "val": "f","n": "s"
            },{
                "val": "ves","n": "p"
            }]
        },
        "n10": {
            "ending": "fe",
            "declension": [{
                "val": "fe","n": "s"
            },{
                "val": "ves","n": "p"
            }]
        },
        "n11": {
            "ending": "um",
            "declension": [{
                "val": "um","n": "s"
            },{
                "val": "a","n": "p"
            }]
        },
        "n12": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n13": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "e","n": "p"
            }]
        },
        "n14": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "x","n": "p"
            }]
        },
        "n15": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "ren","n": "p"
            }]
        },
        "n16": {
            "ending": "ouse",
            "declension": [{
                "val": "ouse","n": "s"
            },{
                "val": "ice","n": "p"
            }]
        },
        "n17": {
            "ending": "-in-law",
            "declension": [{
                "val": "-in-law","n": "s"
            },{
                "val": "s-in-law","n": "p"
            }]
        },
        "n18": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "'s","n": "p"
            }]
        },
        "n19": {
            "ending": "oot",
            "declension": [{
                "val": "oot","n": "s"
            },{
                "val": "eet","n": "p"
            }]
        },
        "n20": {
            "ending": "ooth",
            "declension": [{
                "val": "ooth","n": "s"
            },{
                "val": "eeth","n": "p"
            }]
        },
        "n21": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "en","n": "p"
            }]
        },
        "n22": {
            "ending": "ex",
            "declension": [{
                "val": "ex","n": "s"
            },{
                "val": "ices","n": "p"
            }]
        },
        "n23": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ices","n": "p"
            }]
        },
        "n24": {
            "ending": "-on",
            "declension": [{
                "val": "-on","n": "s"
            },{
                "val": "s-on","n": "p"
            }]
        },
        "n25": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "era","n": "p"
            }]
        },
        "n26": {
            "ending": "on",
            "declension": [{
                "val": "on","n": "s"
            },{
                "val": "a","n": "p"
            }]
        },
        "n27": {
            "ending": "an-at-arms",
            "declension": [{
                "val": "an-at-arms","n": "s"
            },{
                "val": "en-at-arms","n": "p"
            }]
        },
        "n28": {
            "ending": "-at-arms",
            "declension": [{
                "val": "-at-arms","n": "s"
            },{
                "val": "s-at-arms","n": "p"
            }]
        },
        "n29": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "er","n": "p"
            }]
        },
        "n30": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n31": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "im","n": "p"
            }]
        },
        "n32": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "r","n": "p"
            }]
        },
        "n33": {
            "ending": "-by",
            "declension": [{
                "val": "-by","n": "s"
            },{
                "val": "s-by","n": "p"
            }]
        },
        "n34": {
            "ending": "a",
            "declension": [{
                "val": "a","n": "s"
            },{
                "val": "or","n": "p"
            }]
        },
        "n35": {
            "ending": "e",
            "declension": [{
                "val": "e","n": "s"
            },{
                "val": "ae","n": "p"
            }]
        },
        "n36": {
            "ending": "e",
            "declension": [{
                "val": "e","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n37": {
            "ending": "o",
            "declension": [{
                "val": "o","n": "s"
            },{
                "val": "i","n": "p"
            }]
        },
        "n38": {
            "ending": "us",
            "declension": [{
                "val": "us","n": "s"
            },{
                "val": "ora","n": "p"
            }]
        },
        "n39": {
            "ending": "-in",
            "declension": [{
                "val": "-in","n": "s"
            },{
                "val": "s-in","n": "p"
            }]
        },
        "n40": {
            "ending": "oose",
            "declension": [{
                "val": "oose","n": "s"
            },{
                "val": "eese","n": "p"
            }]
        },
        "n41": {
            "ending": "y-in-waiting",
            "declension": [{
                "val": "y-in-waiting","n": "s"
            },{
                "val": "ies-in-waiting","n": "p"
            }]
        },
        "n42": {
            "ending": "-out",
            "declension": [{
                "val": "-out","n": "s"
            },{
                "val": "s-out","n": "p"
            }]
        },
        "n43": {
            "ending": "-up",
            "declension": [{
                "val": "-up","n": "s"
            },{
                "val": "s-up","n": "p"
            }]
        },
        "n44": {
            "ending": "s",
            "declension": [{
                "val": "s","n": "s"
            },{
                "val": "des","n": "p"
            }]
        },
        "n45": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ces","n": "p"
            }]
        },
        "n46": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "een","n": "p"
            }]
        },
        "n47": {
            "ending": "",
            "declension": [{
                "val": "","n": "s"
            },{
                "val": "in","n": "p"
            }]
        },
        "n48": {
            "ending": "x",
            "declension": [{
                "val": "x","n": "s"
            },{
                "val": "ges","n": "p"
            }]
        },
        "n49": {
            "ending": "an-of-war",
            "declension": [{
                "val": "an-of-war","n": "s"
            },{
                "val": "en-of-war","n": "p"
            }]
        },
        "n50": {
            "ending": "ey",
            "declension": [{
                "val": "ey","n": "s"
            },{
                "val": "ies","n": "p"
            }]
        },
        "n51": {
            "ending": "Grand Prix",
            "declension": [{
                "val": "Grand Prix","n": "s"
            },{
                "val": "Grands Prix","n": "p"
            }]
        },
        "n52": {
            "ending": "Madame",
            "declension": [{
                "val": "Madame","n": "s"
            },{
                "val": "Mesdames","n": "p"
            }]
        },
        "n53": {
            "ending": "Mademoiselle",
            "declension": [{
                "val": "Mademoiselle","n": "s"
            },{
                "val": "Mesdemoiselles","n": "p"
            }]
        },
        "n54": {
            "ending": "Monsieur",
            "declension": [{
                "val": "Monsieur","n": "s"
            },{
                "val": "Messieurs","n": "p"
            }]
        },
        "n55": {
            "ending": "Mr",
            "declension": [{
                "val": "Mr","n": "s"
            },{
                "val": "Messrs","n": "p"
            }]
        },
        "n56": {
            "ending": "agent provocateur",
            "declension": [{
                "val": "agent provocateur","n": "s"
            },{
                "val": "agents provocateurs","n": "p"
            }]
        },
        "n57": {
            "ending": "aide-de-camp",
            "declension": [{
                "val": "aide-de-camp","n": "s"
            },{
                "val": "aides-de-camp","n": "p"
            }]
        },
        "n58": {
            "ending": "auto-da-fé",
            "declension": [{
                "val": "auto-da-fé","n": "s"
            },{
                "val": "autos-da-fé","n": "p"
            }]
        },
        "n59": {
            "ending": "bête noire",
            "declension": [{
                "val": "bête noire","n": "s"
            },{
                "val": "bêtes noires","n": "p"
            }]
        },
        "n60": {
            "ending": "billet-doux",
            "declension": [{
                "val": "billet-doux","n": "s"
            },{
                "val": "billets-doux","n": "p"
            }]
        },
        "n61": {
            "ending": "bon mot",
            "declension": [{
                "val": "bon mot","n": "s"
            },{
                "val": "bons mots","n": "p"
            }]
        },
        "n62": {
            "ending": "brother",
            "declension": [{
                "val": "brother","n": "s"
            },{
                "val": "brethren","n": "p"
            }]
        },
        "n63": {
            "ending": "carte blanche",
            "declension": [{
                "val": "carte blanche","n": "s"
            },{
                "val": "cartes blanches","n": "p"
            }]
        },
        "n64": {
            "ending": "chef-d'oeuvre",
            "declension": [{
                "val": "chef-d'oeuvre","n": "s"
            },{
                "val": "chefs-d'oeuvre","n": "p"
            }]
        },
        "n65": {
            "ending": "cor anglais",
            "declension": [{
                "val": "cor anglais","n": "s"
            },{
                "val": "cors anglais","n": "p"
            }]
        },
        "n66": {
            "ending": "coup d'etat",
            "declension": [{
                "val": "coup d'etat","n": "s"
            },{
                "val": "coups d'etat","n": "p"
            }]
        },
        "n67": {
            "ending": "coup de grace",
            "declension": [{
                "val": "coup de grace","n": "s"
            },{
                "val": "coups de grace","n": "p"
            }]
        },
        "n68": {
            "ending": "court-martial",
            "declension": [{
                "val": "court-martial","n": "s"
            },{
                "val": "courts-martial","n": "p"
            }]
        },
        "n69": {
            "ending": "cow",
            "declension": [{
                "val": "cow","n": "s"
            },{
                "val": "kine","n": "p"
            }]
        },
        "n70": {
            "ending": "curriculum vitae",
            "declension": [{
                "val": "curriculum vitae","n": "s"
            },{
                "val": "curricula vitae","n": "p"
            }]
        },
        "n71": {
            "ending": "enfant terrible",
            "declension": [{
                "val": "enfant terrible","n": "s"
            },{
                "val": "enfants terribles","n": "p"
            }]
        },
        "n72": {
            "ending": "fait accompli",
            "declension": [{
                "val": "fait accompli","n": "s"
            },{
                "val": "faits accomplis","n": "p"
            }]
        },
        "n73": {
            "ending": "fleur-de-lis",
            "declension": [{
                "val": "fleur-de-lis","n": "s"
            },{
                "val": "fleurs-de-lis","n": "p"
            }]
        },
        "n74": {
            "ending": "fleur-de-lys",
            "declension": [{
                "val": "fleur-de-lys","n": "s"
            },{
                "val": "fleurs-de-lys","n": "p"
            }]
        },
        "n75": {
            "ending": "ignis fatuus",
            "declension": [{
                "val": "ignis fatuus","n": "s"
            },{
                "val": "ignes fatui","n": "p"
            }]
        },
        "n76": {
            "ending": "knight-errant",
            "declension": [{
                "val": "knight-errant","n": "s"
            },{
                "val": "knights-errant","n": "p"
            }]
        },
        "n77": {
            "ending": "nom de plume",
            "declension": [{
                "val": "nom de plume","n": "s"
            },{
                "val": "noms de plume","n": "p"
            }]
        },
        "n78": {
            "ending": "nouveau riche",
            "declension": [{
                "val": "nouveau riche","n": "s"
            },{
                "val": "nouveaux riches","n": "p"
            }]
        },
        "n79": {
            "ending": "penny",
            "declension": [{
                "val": "penny","n": "s"
            },{
                "val": "pence","n": "p"
            }]
        },
        "n80": {
            "ending": "petit bourgeois",
            "declension": [{
                "val": "petit bourgeois","n": "s"
            },{
                "val": "petits bourgeois","n": "p"
            }]
        },
        "n81": {
            "ending": "señor",
            "declension": [{
                "val": "señor","n": "s"
            },{
                "val": "senores","n": "p"
            }]
        },
        "n82": {
            "ending": "sock",
            "declension": [{
                "val": "sock","n": "s"
            },{
                "val": "sox","n": "p"
            }]
        },
        "n83": {
            "ending": "tableau vivant",
            "declension": [{
                "val": "tableau vivant","n": "s"
            },{
                "val": "tableaux vivants","n": "p"
            }]
        },
        "n84": {
            "ending": "wagon-lit",
            "declension": [{
                "val": "wagon-lit","n": "s"
            },{
                "val": "wagons-lit","n": "p"
            }]
        },
        "n85": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "s","g": "m","n": "p"
            }]
        },
        "n86": {
            "ending": "",
            "declension": [{
                "val": "","g": "m","n": "s"
            },{
                "val": "es","g": "m","n": "p"
            }]
        },
        "n87": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "s","g": "f","n": "p"
            }]
        },
        "n88": {
            "ending": "",
            "declension": [{
                "val": "","g": "f","n": "s"
            },{
                "val": "es","g": "f","n": "p"
            }]
        },
        "n89": {
            "ending": "an",
            "declension": [{
                "val": "an","g": "m","n": "s"
            },{
                "val": "en","g": "m","n": "p"
            }]
        },
        "n90": {
            "ending": "an",
            "declension": [{
                "val": "an","g": "f","n": "s"
            },{
                "val": "en","g": "f","n": "p"
            }]
        },
        "n91": {
            "ending": "fe",
            "declension": [{
                "val": "fe","g": "f","n": "s"
            },{
                "val": "ves","g": "f","n": "p"
            }]
        },
        "a1": {
            "ending": "",
            "declension": [{
                "val": ""
            }]
        },
        "a2": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "r","f": "co"
            },{
                "val": "st","f": "su"
            }]
        },
        "a3": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "er","f": "co"
            },{
                "val": "est","f": "su"
            }]
        },
        "a4": {
            "ending": "y",
            "declension": [{
                "val": "y"
            },{
                "val": "ier","f": "co"
            },{
                "val": "iest","f": "su"
            }]
        },
        "a5": {
            "ending": "b",
            "declension": [{
                "val": "b"
            },{
                "val": "bber","f": "co"
            },{
                "val": "bbest","f": "su"
            }]
        },
        "a6": {
            "ending": "d",
            "declension": [{
                "val": "d"
            },{
                "val": "dder","f": "co"
            },{
                "val": "ddest","f": "su"
            }]
        },
        "a7": {
            "ending": "g",
            "declension": [{
                "val": "g"
            },{
                "val": "gger","f": "co"
            },{
                "val": "ggest","f": "su"
            }]
        },
        "a8": {
            "ending": "l",
            "declension": [{
                "val": "l"
            },{
                "val": "ller","f": "co"
            },{
                "val": "llest","f": "su"
            }]
        },
        "a9": {
            "ending": "m",
            "declension": [{
                "val": "m"
            },{
                "val": "mmer","f": "co"
            },{
                "val": "mmest","f": "su"
            }]
        },
        "a10": {
            "ending": "n",
            "declension": [{
                "val": "n"
            },{
                "val": "nner","f": "co"
            },{
                "val": "nnest","f": "su"
            }]
        },
        "a11": {
            "ending": "t",
            "declension": [{
                "val": "t"
            },{
                "val": "tter","f": "co"
            },{
                "val": "ttest","f": "su"
            }]
        },
        "a12": {
            "ending": "ey",
            "declension": [{
                "val": "ey"
            },{
                "val": "ier","f": "co"
            },{
                "val": "iest","f": "su"
            }]
        },
        "a13": {
            "ending": "y",
            "declension": [{
                "val": "y"
            },{
                "val": "er","f": "co"
            },{
                "val": "est","f": "su"
            }]
        },
        "a14": {
            "ending": "bad",
            "declension": [{
                "val": "bad"
            },{
                "val": "worse","f": "co"
            },{
                "val": "worst","f": "su"
            }]
        },
        "a15": {
            "ending": "good",
            "declension": [{
                "val": "good"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "a16": {
            "ending": "old",
            "declension": [{
                "val": "old"
            },{
                "val": "older","f": "co"
            },{
                "val": "oldest","f": "su"
            }]
        },
        "a17": {
            "ending": "far",
            "declension": [{
                "val": "far"
            },{
                "val": "farther","f": "co"
            },{
                "val": "farthest","f": "su"
            }]
        },
        "a18": {
            "ending": "",
            "declension": [{
                "val": ""
            },{
                "val": "st","f": "su"
            }]
        },
        "a19": {
            "ending": "well",
            "declension": [{
                "val": "well"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "pn1": {
            "ending": "I",
            "declension": [{
                "val": "I","pe": 1,"n": "s","g": "x"
            },{
                "val": "you","pe": 2,"n": "x","g": "x"
            },{
                "val": "he","pe": 3,"n": "s","g": "m"
            },{
                "val": "it","pe": 3,"n": "s","g": "n"
            },{
                "val": "she","pe": 3,"n": "s","g": "f"
            },{
                "val": "we","pe": 1,"n": "p","g": "x"
            },{
                "val": "they","pe": 3,"n": "p","g": "x"
            }]
        },
        "pn2": {
            "ending": "me",
            "declension": [{
                "val": "me","pe": 1,"n": "s","g": "x"
            },{
                "val": "you","pe": 2,"n": "x","g": "x"
            },{
                "val": "her","pe": 3,"n": "s","g": "f"
            },{
                "val": "him","pe": 3,"n": "s","g": "m"
            },{
                "val": "it","pe": 3,"n": "s","g": "n"
            },{
                "val": "us","pe": 1,"n": "p","g": "x"
            },{
                "val": "them","pe": 3,"n": "p","g": "x"
            }]
        },
        "pn3": {
            "ending": "mine",
            "declension": [{
                "val": "mine","pe": 1,"n": "s","g": "x","own": "s"
            },{
                "val": "yours","pe": 2,"n": "x","g": "x","own": "x"
            },{
                "val": "hers","pe": 3,"n": "s","g": "f","own": "s"
            },{
                "val": "his","pe": 3,"n": "s","g": "m","own": "s"
            },{
                "val": "its","pe": 3,"n": "s","g": "n","own": "s"
            },{
                "val": "ours","pe": 1,"n": "p","g": "x","own": "p"
            },{
                "val": "theirs","pe": 3,"n": "p","g": "x","own": "p"
            }]
        },
        "pn4": {
            "ending": "myself",
            "declension": [{
                "val": "myself","pe": 1,"n": "s","g": "x"
            },{
                "val": "yourself","pe": 2,"n": "s","g": "x"
            },{
                "val": "herself","pe": 3,"n": "s","g": "f"
            },{
                "val": "himself","pe": 3,"n": "s","g": "m"
            },{
                "val": "itself","pe": 3,"n": "s","g": "n"
            },{
                "val": "ourselves","pe": 1,"n": "p","g": "x"
            },{
                "val": "yourselves","pe": 2,"n": "p","g": "x"
            },{
                "val": "themselves","pe": 3,"n": "p","g": "x"
            }]
        },
        "pn5": {
            "ending": "",
            "declension": [{
                "val": "","pt": "i","pe": 3
            }]
        },
        "pn6": {
            "ending": "",
            "declension": [{
                "val": "","pt": "in"
            }]
        },
        "pn7": {
            "ending": "",
            "declension": [{
                "val": "","pt": "r"
            }]
        },
        "pn8": {
            "ending": "",
            "declension": [{
                "val": "","pt": "d"
            }]
        },
        "pn9": {
            "ending": "",
            "declension": [{
                "val": "","pt": "ex"
            }]
        },
        "d1": {
            "ending": "a",
            "declension": [{
                "val": "a","n": "s"
            },{
                "val": "","n": "p"
            }]
        },
        "d2": {
            "ending": "my",
            "declension": [{
                "val": "my","pe": 1,"n": "s","g": "x","own": "s"
            },{
                "val": "your","pe": 2,"n": "x","g": "x","own": "x"
            },{
                "val": "her","pe": 3,"n": "s","g": "f","own": "s"
            },{
                "val": "his","pe": 3,"n": "s","g": "m","own": "s"
            },{
                "val": "its","pe": 3,"n": "s","g": "n","own": "s"
            },{
                "val": "our","pe": 1,"n": "p","g": "x","own": "p"
            },{
                "val": "their","pe": 3,"n": "p","g": "x","own": "p"
            }]
        },
        "d3": {
            "ending": "that",
            "declension": [{
                "val": "that","n": "s"
            },{
                "val": "those","n": "p"
            }]
        },
        "d4": {
            "ending": "",
            "declension": [{
                "val": "","n": "x"
            }]
        },
        "d5": {
            "ending": "this",
            "declension": [{
                "val": "this","n": "s"
            },{
                "val": "these","n": "p"
            }]
        },        
        "b1": {
            "ending": "",
            "declension": [{
                "val": ""
            }]
        },
        "b2": {
            "ending": "badly",
            "declension": [{
                "val": "badly"
            },{
                "val": "worse","f": "co"
            },{
                "val": "worst","f": "su"
            }]
        },
        "b3": {
            "ending": "well",
            "declension": [{
                "val": "well"
            },{
                "val": "better","f": "co"
            },{
                "val": "best","f": "su"
            }]
        },
        "b4": {
            "ending": "far",
            "declension": [{
                "val": "far"
            },{
                "val": "farther","f": "co"
            },{
                "val": "farthest","f": "su"
            }]
        },
        "b5": {
            "ending": "little",
            "declension": [{
                "val": "little"
            },{
                "val": "less","f": "co"
            },{
                "val": "least","f": "su"
            }]
        }
    },
    "punctuation": {
        "pc1": {
            "b": "",
            "a": ""
        },
        "pc2": {
            "b": " ",
            "a": " "
        },
        "pc3": {
            "b": " ",
            "a": ""
        },
        "pc4": {
            "b": "",
            "a": " "
        },
        "pc5": {
            "b": " ",
            "a": "",
            "pos": "l"
        },
        "pc6": {
            "b": "",
            "a": " ",
            "pos": "r"
        },
        "pc7": {
            "b": " ",
            "a": " ",
            "pos": "l"
        },
        "pc8": {
            "b": " ",
            "a": " ",
            "pos": "r"
        }
    },
    "sentence_type": {
        "exc": {
            "type": "exclamative",
            "punctuation": "!"
        },
        "int": {
            "type": "interrogative",
            "punctuation": "?",
            "prefix": {
                "base": "do",
                "yon": "do",
                "wos": "who",
                "wod": "who",
                "woi": "to whom",
                "wad": "what",
                "whe": "where",
                "how": "how",
                "whn": "when",
                "why": "why",
                "muc": "how much"
            },
            "future": "will"
        },
        "dec": {
            "type": "declarative",
            "punctuation": "."
        }
    },
    "propositional": {
        "base": "that",
        "subject": "who",
        "autres": ["which","whose","whom"]
    },
    "regular": {
        "pp": {
            "ending": "",
            "option": [{
                "val": ""
            }]
        }
    },
    "verb_option": {
        "neg": {
            "prep1": "not"
        }
    },
    "usePronoun": {
        "S": "I",
        "SP":"I",
        "NP":"I",
        "VP": "me",
        "PP": "me",
        "Pro": "me"
    },
    "date": {
        "format": {
            "non_natural": {
                "year-month-date-day": "[l] [m]\/[d]\/[Y]",
                "year-month-date": "[m]\/[d]\/[Y]",
                "year-month": "[m]\/[Y]",
                "month-date": "[m]\/[d]",
                "month-date-day": "[m]\/[d]",
                "year": "[Y]",
                "month": "[m]",
                "date": "[d]",
                "day": "[l]",
                "hour:minute:second": "[H0]:[m0]:[s0] [A]",
                "hour:minute": "[h]:[m0] [A]",
                "minute:second": "[m0]:[s0]",
                "hour": "[h] [A]",
                "minute": "[m]",
                "second": "[s]"
            },
            "natural": {
                "year-month-date-day": "on [l], [F] [d], [Y]",
                "year-month-date": "on [F] [d], [Y]",
                "year-month": "on [F] [Y]",
                "month-date": "on [F] [d]",
                "month-date-day": "on [l], [F] [d]",
                "year": "in [Y]",
                "month": "in [F]",
                "date": "on the [d]",
                "day": "on [l]",
                "hour:minute:second": "at [h]:[m0]:[s0] [A]",
                "hour:minute": "at [h]:[m0] [A]",
                "minute:second": "at [m]:[s0] [A]",
                "hour": "at [h] [A]",
                "minute": "at [m] min",
                "second": "at [s] s"
            },
            "relative_time": {
                "-": "[x] days ago",
                "-6": "last [l]",
                "-5": "last [l]",
                "-4": "last [l]",
                "-3": "last [l]",
                "-2": "last [l]",
                "-1": "yesterday",
                "0": "today",
                "1": "tomorrow",
                "2": "[l]",
                "3": "[l]",
                "4": "[l]",
                "5": "[l]",
                "6": "[l]",
                "+": "in [x] days"
            }
        },
        "text": {
            "weekday": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
            "month": {
                "1": "January",
                "2": "February",
                "3": "March",
                "4": "April",
                "5": "May",
                "6": "June",
                "7": "July",
                "8": "August",
                "9": "September",
                "10": "October",
                "11": "November",
                "12": "December"
            },
            "meridiem": ["a.m.","p.m."]
        }
    },
    "number": {
        "symbol": {
            "group": ",",
            "decimal": "."
        },
        "number": ["zero"]
    },
    "elision": {
        "elidables": ["a"],
        "voyellesAccentuees": "àäéèêëïîöôùû",
        "voyelles": "aeiouàäéèêëïîöôùû"
    },
    "union": "or",
    "compound": {
        "alias": "aux",
        "continuous": {
            "aux": "be",
            "participle": "pr"
        },
        "perfect": {
            "aux": "have",
            "participle": "pp"
        },
        "passive": {
            "aux": "be",
            "participle": "pp"
        },
        "future": {
            "aux": "will"
        },
        "possibility": {"aux":"can"},
        "permission":  {"aux":"may"},
        "necessity":   {"aux":"shall"},
        "willingness": {"aux":"will"},
        "obligation":  {"aux":"must"}
    }
}
var lexiconEn = //========== lexicon-dme.js
{
    " ": {
        "Pc": {
            "tab": ["pc1"]
        }
    },
    ".": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    "...": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    ",": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    ";": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    ":": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    "!": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    "?": {
        "Pc": {
            "tab": ["pc4"]
        }
    },
    "-": {
        "Pc": {
            "tab": ["pc1"]
        }
    },
    "\"": {
        "Pc": {
            "compl": "\"",
            "tab": ["pc5","pc6"]
        }
    },
    "'": {
        "Pc": {
            "compl": "'",
            "tab": ["pc5","pc6"]
        }
    },
    "*": {
        "Pc": {
            "compl": "*",
            "tab": ["pc5","pc6"]
        }
    },
    "(": {
        "Pc": {
            "compl": ")",
            "tab": ["pc5"]
        }
    },
    ")": {
        "Pc": {
            "compl": "(",
            "tab": ["pc6"]
        }
    },
    "[": {
        "Pc": {
            "compl": "]",
            "tab": ["pc5"]
        }
    },
    "]": {
        "Pc": {
            "compl": "[",
            "tab": ["pc6"]
        }
    },
    "{": {
        "Pc": {
            "compl": "}",
            "tab": ["pc5"]
        }
    },
    "}": {
        "Pc": {
            "compl": "{",
            "tab": ["pc6"]
        }
    },
    "«":{ "Pc": { "compl": "»", "tab": ["pc7"] }},
    "»":{ "Pc": { "compl": "«", "tab": ["pc8"] }},
    "a": {
        "D": {
            "tab": ["d1"]
        }
    },
    "abandon": {
        "V": {
            "tab": "v1"
        }
    },
    "abbey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ability": {
        "N": {
            "tab": ["n3"]
        }
    },
    "able": {
        "A": {
            "tab": ["a2"]
        }
    },
    "abnormal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "abolish": {
        "V": {
            "tab": "v2"
        }
    },
    "abolition": {
        "N": {
            "tab": ["n5"]
        }
    },
    "abortion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "about": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "above": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "abroad": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "abruptly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "absence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "absent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "absolute": {
        "A": {
            "tab": ["a1"]
        }
    },
    "absolutely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "absorb": {
        "V": {
            "tab": "v1"
        }
    },
    "absorption": {
        "N": {
            "tab": ["n5"]
        }
    },
    "abstract": {
        "A": {
            "tab": ["a1"]
        }
    },
    "absurd": {
        "A": {
            "tab": ["a1"]
        }
    },
    "abuse": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "academic": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "academy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "accelerate": {
        "V": {
            "tab": "v3"
        }
    },
    "accent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accept": {
        "V": {
            "tab": "v1"
        }
    },
    "acceptable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "acceptance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "access": {
        "N": {
            "tab": ["n5"]
        },
        "V":{"tab":"v2"}
    },
    "accessible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "accident": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accommodate": {
        "V": {
            "tab": "v3"
        }
    },
    "accommodation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accompany": {
        "V": {
            "tab": "v4"
        }
    },
    "accomplish": {
        "V": {
            "tab": "v2"
        }
    },
    "accord": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "accordance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accordingly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "account": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "accountant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accumulate": {
        "V": {
            "tab": "v3"
        }
    },
    "accumulation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accuracy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "accurate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "accurately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "accusation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "accuse": {
        "V": {
            "tab": "v3"
        }
    },
    "achieve": {
        "V": {
            "tab": "v3"
        }
    },
    "achievement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "acid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "acknowledge": {
        "V": {
            "tab": "v3"
        }
    },
    "acquaintance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "acquire": {
        "V": {
            "tab": "v3"
        }
    },
    "acquisition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "acre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "across": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "act": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "action": {
        "N": {
            "tab": ["n1"]
        }
    },
    "activate": {
        "V": {
            "tab": "v3"
        }
    },
    "active": {
        "A": {
            "tab": ["a1"]
        }
    },
    "actively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "activist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "activity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "actor": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "actress": {
        "N": {
            "g": "f",
            "tab": ["n88"]
        }
    },
    "actual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "actually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "acute": {
        "A": {
            "tab": ["a1"]
        }
    },
    "adapt": {
        "V": {
            "tab": "v1"
        }
    },
    "adaptation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "add": {
        "V": {
            "tab": "v1"
        }
    },
    "addition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "additional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "address": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "adequate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "adequately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "adjacent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "adjective": {
        "N": {
            "tab": ["n1"]
        }
    },
    "adjust": {
        "V": {
            "tab": "v1"
        }
    },
    "adjustment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "administer": {
        "V": {
            "tab": "v1"
        }
    },
    "administration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "administrative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "administrator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "admiration": {
        "N": {
            "tab": ["n5"]
        }
    },
    "admire": {
        "V": {
            "tab": "v3"
        }
    },
    "admission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "admit": {
        "V": {
            "tab": "v14"
        }
    },
    "adopt": {
        "V": {
            "tab": "v1"
        }
    },
    "adoption": {
        "N": {
            "tab": ["n1"]
        }
    },
    "adult": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "advance": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "advanced": {
        "A": {
            "tab": ["a1"]
        }
    },
    "advantage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "adventure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "adverse": {
        "A": {
            "tab": ["a1"]
        }
    },
    "advertise": {
        "V": {
            "tab": "v3"
        }
    },
    "advertisement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "advice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "advise": {
        "V": {
            "tab": "v3"
        }
    },
    "adviser": {
        "N": {
            "tab": ["n1"]
        }
    },
    "advisory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "advocate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "aesthetic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "affair": {
        "N": {
            "tab": ["n1"]
        }
    },
    "affect": {
        "V": {
            "tab": "v1"
        }
    },
    "affection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "affinity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "afford": {
        "V": {
            "tab": "v1"
        }
    },
    "afraid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "after": {
        "P": {
            "tab": ["pp"]
        }
    },
    "afternoon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "afterwards": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "again": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "against": {
        "P": {
            "tab": ["pp"]
        }
    },
    "age": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v72"
        }
    },
    "agency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "agenda": {
        "N": {
            "tab": ["n1"]
        }
    },
    "agent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "aggression": {
        "N": {
            "tab": ["n1"]
        }
    },
    "aggressive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ago": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "agony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "agree": {
        "V": {
            "tab": "v16"
        }
    },
    "agreement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "agricultural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "agriculture": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ahead": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "aid": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "aim": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "air": {
        "N": {
            "tab": ["n1"]
        }
    },
    "aircraft": {
        "N": {
            "tab": ["n4"]
        }
    },
    "airline": {
        "N": {
            "tab": ["n1"]
        }
    },
    "airport": {
        "N": {
            "tab": ["n1"]
        }
    },
    "alarm": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "album": {
        "N": {
            "tab": ["n1"]
        }
    },
    "alcohol": {
        "N": {
            "tab": ["n1"]
        }
    },
    "alert": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "alien": {
        "A": {
            "tab": ["a1"]
        }
    },
    "alike": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "alive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "all": {
        "Adv": {
            "tab": ["b1"]
        },
        "Pro":{"tab":["b1"]}
    },
    "allegation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "allege": {
        "V": {
            "tab": "v3"
        }
    },
    "allegedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "alliance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "allocate": {
        "V": {
            "tab": "v3"
        }
    },
    "allocation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "allow": {
        "V": {
            "tab": "v1"
        }
    },
    "allowance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "allowed":{"A":{"tab":["a1"]}},
    "ally": {
        "N": {
            "tab": ["n3"]
        }
    },
    "almost": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "alone": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "along": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "alongside": {
        "P": {
            "tab": ["pp"]
        }
    },
    "aloud": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "already": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "alright": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "also": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "altar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "alter": {
        "V": {
            "tab": "v1"
        }
    },
    "alteration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "alternative": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "alternatively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "altogether": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "aluminium": {
        "N": {
            "tab": ["n5"]
        }
    },
    "always": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "amateur": {
        "N": {
            "tab": ["n1"]
        }
    },
    "amazing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ambassador": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ambiguity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "ambiguous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ambition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ambitious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ambulance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "amend": {
        "V": {
            "tab": "v1"
        }
    },
    "amendment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "amid": {
        "P": {
            "tab": ["pp"]
        }
    },
    "among": {
        "P": {
            "tab": ["pp"]
        }
    },
    "amongst": {
        "P": {
            "tab": ["pp"]
        }
    },
    "amount": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "amp": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ample": {
        "A": {
            "tab": ["a2"]
        }
    },
    "amuse": {
        "V": {
            "tab": "v3"
        }
    },
    "amusement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "analogy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "analyse": {
        "V": {
            "tab": "v3"
        }
    },
    "analysis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "analyst": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ancestor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ancient": {
        "A": {
            "tab": ["a1"]
        }
    },
    "angel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "anger": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "angle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "angrily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "angry": {
        "A": {
            "tab": ["a4"]
        }
    },
    "animal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ankle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "anniversary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "announce": {
        "V": {
            "tab": "v3"
        }
    },
    "announcement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "annoy": {
        "V": {
            "tab": "v1"
        }
    },
    "annual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "annually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "anonymous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "answer": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "ant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "antibody": {
        "N": {
            "tab": ["n3"]
        }
    },
    "anticipate": {
        "V": {
            "tab": "v3"
        }
    },
    "anticipation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "anxiety": {
        "N": {
            "tab": ["n3"]
        }
    },
    "anxious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "anybody": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "anyone": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "anything": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "anyway": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "anywhere": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "apart": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "apartment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "apology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "appalling": {
        "A": {
            "tab": ["a1"]
        }
    },
    "apparatus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "apparent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "apparently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "appeal": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "appear": {
        "V": {
            "tab": "v1"
        }
    },
    "appearance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "appendix": {
        "N": {
            "tab": ["n2"]
        }
    },
    "appetite": {
        "N": {
            "tab": ["n1"]
        }
    },
    "apple": {
        "N": {
            "tab": ["n1"]
        }
    },
    "applicable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "applicant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "application": {
        "N": {
            "tab": ["n1"]
        }
    },
    "applied": {
        "A": {
            "tab": ["a1"]
        }
    },
    "apply": {
        "V": {
            "tab": "v4"
        }
    },
    "appoint": {
        "V": {
            "tab": "v1"
        }
    },
    "appointment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "appraisal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "appreciate": {
        "V": {
            "tab": "v3"
        }
    },
    "appreciation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "approach": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "appropriate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "appropriately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "approval": {
        "N": {
            "tab": ["n5"]
        }
    },
    "approve": {
        "V": {
            "tab": "v3"
        }
    },
    "approximately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "aquarium": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arbitrary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "arc": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "archaeological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "archbishop": {
        "N": {
            "tab": ["n1"]
        }
    },
    "architect": {
        "N": {
            "tab": ["n1"]
        }
    },
    "architectural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "architecture": {
        "N": {
            "tab": ["n5"]
        }
    },
    "archive": {
        "N": {
            "tab": ["n1"]
        }
    },
    "area": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arena": {
        "N": {
            "tab": ["n1"]
        }
    },
    "argue": {
        "V": {
            "tab": "v3"
        }
    },
    "argument": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arise": {
        "V": {
            "tab": "v63"
        }
    },
    "arm": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "armchair": {
        "N": {
            "tab": ["n1"]
        }
    },
    "army": {
        "N": {
            "tab": ["n3"]
        }
    },
    "around": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "arouse": {
        "V": {
            "tab": "v3"
        }
    },
    "arrange": {
        "V": {
            "tab": "v3"
        }
    },
    "arrangement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "array": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arrest": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "arrival": {
        "N": {
            "tab": ["n1"]
        }
    },
    "arrive": {
        "V": {
            "tab": "v3"
        }
    },
    "arrow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "art": {
        "N": {
            "tab": ["n1"]
        }
    },
    "article": {
        "N": {
            "tab": ["n1"]
        }
    },
    "articulate": {
        "V": {
            "tab": "v3"
        }
    },
    "artificial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "artist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "artistic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "as": {
        "P":{"tab":["pp"]},
        "Adv": {
            "tab": ["b1"]
        }
    },
    "ascertain": {
        "V": {
            "tab": "v1"
        }
    },
    "ash": {
        "N": {
            "tab": ["n2"]
        }
    },
    "ashamed": {
        "A": {
            "tab": ["a1"]
        }
    },
    "aside": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "ask": {
        "V": {
            "tab": "v1"
        }
    },
    "asleep": {
        "A": {
            "tab": ["a1"]
        }
    },
    "aspect": {
        "N": {
            "tab": ["n1"]
        }
    },
    "aspiration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assault": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "assemble": {
        "V": {
            "tab": "v3"
        }
    },
    "assembly": {
        "N": {
            "tab": ["n3"]
        }
    },
    "assert": {
        "V": {
            "tab": "v1"
        }
    },
    "assertion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assess": {
        "V": {
            "tab": "v2"
        }
    },
    "assessment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "asset": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assign": {
        "V": {
            "tab": "v1"
        }
    },
    "assignment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assist": {
        "V": {
            "tab": "v1"
        }
    },
    "assistance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "assistant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "associate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "association": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assume": {
        "V": {
            "tab": "v3"
        }
    },
    "assumption": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assurance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "assure": {
        "V": {
            "tab": "v3"
        }
    },
    "astonishing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "asylum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "at": {
        "P": {
            "tab": ["pp"]
        }
    },
    "athlete": {
        "N": {
            "tab": ["n1"]
        }
    },
    "atmosphere": {
        "N": {
            "tab": ["n1"]
        }
    },
    "atom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "atomic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "attach": {
        "V": {
            "tab": "v2"
        }
    },
    "attachment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attack": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "attacker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attain": {
        "V": {
            "tab": "v1"
        }
    },
    "attainment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attempt": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "attend": {
        "V": {
            "tab": "v1"
        }
    },
    "attendance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attitude": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attract": {
        "V": {
            "tab": "v1"
        }
    },
    "attraction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "attractive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "attribute": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "auction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "audience": {
        "N": {
            "tab": ["n1"]
        }
    },
    "audit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "auditor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "aunt": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "author": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "authority": {
        "N": {
            "tab": ["n3"]
        }
    },
    "automatic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "automatically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "autonomous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "autonomy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "autumn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "availability": {
        "N": {
            "tab": ["n5"]
        }
    },
    "available": {
        "A": {
            "tab": ["a1"]
        }
    },
    "avenue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "average": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "aviation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "avocado": {
        "N": {
            "tab": ["n1"]
        }
    },
    "avoid": {
        "V": {
            "tab": "v1"
        }
    },
    "await": {
        "V": {
            "tab": "v1"
        }
    },
    "awake": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v163"
        }
    },
    "award": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "aware": {
        "A": {
            "tab": ["a1"]
        }
    },
    "awareness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "away": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "awful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "awkward": {
        "A": {
            "tab": ["a1"]
        }
    },
    "axis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "aye": {
        "N": {
            "tab": ["n1"]
        }
    },
    "baby": {
        "N": {
            "tab": ["n3"]
        }
    },
    "back": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "background": {
        "N": {
            "tab": ["n1"]
        }
    },
    "backing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "backwards": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "bacon": {
        "N": {
            "tab": ["n5"]
        }
    },
    "bad": {
        "A": {
            "tab": ["a14"]
        }
    },
    "badly": {
        "Adv": {
            "tab": ["b2"]
        }
    },
    "bag": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bake": {
        "V": {
            "tab": "v3"
        }
    },
    "balance": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "balcony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "ball": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ballet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "balloon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ballot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ban": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "banana": {
        "N": {
            "tab": ["n1"]
        }
    },
    "band": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bang": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bank": {
        "N": {
            "tab": ["n1"]
        }
    },
    "banker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "banking": {
        "N": {
            "tab": ["n5"]
        }
    },
    "bankruptcy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "banner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bar": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v13"
        }
    },
    "bare": {
        "A": {
            "tab": ["a2"]
        }
    },
    "barely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "bargain": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "barn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "barrel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "barrier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "base": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "basement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "basic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "basically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "basin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "basis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "basket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bass": {
        "N": {
            "tab": ["n4"]
        }
    },
    "bastard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "batch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bath": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bathroom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "battery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "battle": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "bay": {
        "N": {
            "tab": ["n1"]
        }
    },
    "be": {
        "V": {
            "tab": "v151"
        }
    },
    "beach": {
        "N": {
            "tab": ["n2"]
        }
    },
    "beam": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bean": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bear": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v51"
        }
    },
    "beard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bearing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "beast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "beat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v78"
        }
    },
    "beautiful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "beautifully": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "beauty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "become": {
        "V": {
            "tab": "v41"
        }
    },
    "bed": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bedroom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "beef": {
        "N": {
            "tab": ["n9"]
        }
    },
    "beer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "before": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "beg": {
        "V": {
            "tab": "v7"
        }
    },
    "begin": {
        "V": {
            "tab": "v106"
        }
    },
    "beginning": {
        "N": {
            "tab": ["n1"]
        }
    },
    "behalf": {
        "N": {
            "tab": ["n9"]
        }
    },
    "behave": {
        "V": {
            "tab": "v3"
        }
    },
    "behaviour": {
        "N": {
            "tab": ["n5"]
        }
    },
    "behind": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "being": {
        "N": {
            "tab": ["n1"]
        }
    },
    "belief": {
        "N": {
            "tab": ["n1"]
        }
    },
    "believe": {
        "V": {
            "tab": "v3"
        }
    },
    "bell": {
        "N": {
            "tab": ["n1"]
        }
    },
    "belly": {
        "N": {
            "tab": ["n3"]
        }
    },
    "belong": {
        "V": {
            "tab": "v1"
        }
    },
    "below": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "belt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bench": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bend": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v23"
        }
    },
    "beneath": {
        "P": {
            "tab": ["pp"]
        }
    },
    "beneficial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "beneficiary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "benefit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "berry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "beside": {
        "P": {
            "tab": ["pp"]
        }
    },
    "besides": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "bet": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v38"
        }
    },
    "betray": {
        "V": {
            "tab": "v1"
        }
    },
    "between": {
        "P": {
            "tab": ["pp"]
        }
    },
    "beyond": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "bias": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bicycle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bid": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v117"
        }
    },
    "big": {
        "A": {
            "tab": ["a7"]
        }
    },
    "bike": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bile": {
        "N": {
            "tab": ["n5"]
        }
    },
    "bill": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bind": {
        "V": {
            "tab": "v25"
        }
    },
    "binding": {
        "A": {
            "tab": ["a1"]
        }
    },
    "biography": {
        "N": {
            "tab": ["n3"]
        }
    },
    "biological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "biology": {
        "N": {
            "tab": ["n5"]
        }
    },
    "bird": {
        "N": {
            "tab": ["n1"]
        }
    },
    "birth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "birthday": {
        "N": {
            "tab": ["n1"]
        }
    },
    "biscuit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bishop": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bitch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bite": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v74"
        }
    },
    "bitter": {
        "A": {
            "tab": ["a1"]
        }
    },
    "bitterly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "bizarre": {
        "A": {
            "tab": ["a1"]
        }
    },
    "black": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "blade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "blame": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "blank": {
        "A": {
            "tab": ["a1"]
        }
    },
    "blanket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "blast": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bleak": {
        "A": {
            "tab": ["a3"]
        }
    },
    "bleed": {
        "V": {
            "tab": "v22"
        }
    },
    "bless": {
        "V": {
            "tab": "v86"
        }
    },
    "blessing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "blind": {
        "A": {
            "tab": ["a1"]
        }
    },
    "blink": {
        "V": {
            "tab": "v1"
        }
    },
    "block": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bloke": {
        "N": {
            "tab": ["n1"]
        }
    },
    "blonde": {
        "A": {
            "tab": ["a1"]
        }
    },
    "blood": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bloody": {
        "A": {
            "tab": ["a4"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "blow": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v27"
        }
    },
    "blue": {
        "A": {
            "tab": ["a2"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "board": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "boast": {
        "V": {
            "tab": "v1"
        }
    },
    "boat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bodily": {
        "A": {
            "tab": ["a1"]
        }
    },
    "body": {
        "N": {
            "tab": ["n3"]
        }
    },
    "boil": {
        "V": {
            "tab": "v1"
        }
    },
    "boiler": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bold": {
        "A": {
            "tab": ["a3"]
        }
    },
    "bolt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bomb": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bomber": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bond": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bone": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bonus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "book": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "booklet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "boom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "boost": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "boot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "border": {
        "N": {
            "tab": ["n1"]
        }
    },
    "boring": {
        "A": {
            "tab": ["a1"]
        }
    },
    "borough": {
        "N": {
            "tab": ["n1"]
        }
    },
    "borrow": {
        "V": {
            "tab": "v1"
        }
    },
    "boss": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bother": {
        "V": {
            "tab": "v1"
        }
    },
    "bottle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bottom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bounce": {
        "V": {
            "tab": "v3"
        }
    },
    "boundary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "bourgeois": {
        "A": {
            "tab": ["a1"]
        }
    },
    "bow": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bowel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bowl": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "bowler": {
        "N": {
            "tab": ["n1"]
        }
    },
    "box": {
        "N": {
            "tab": ["n2"]
        }
    },
    "boxing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "boy": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "boyfriend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bracket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "branch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "brand": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brandy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "brass": {
        "N": {
            "tab": ["n2"]
        }
    },
    "brave": {
        "A": {
            "tab": ["a2"]
        }
    },
    "breach": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bread": {
        "N": {
            "tab": ["n5"]
        }
    },
    "break": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v138"
        }
    },
    "breakdown": {
        "N": {
            "tab": ["n1"]
        }
    },
    "breakfast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "breast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "breath": {
        "N": {
            "tab": ["n1"]
        }
    },
    "breathe": {
        "V": {
            "tab": "v3"
        }
    },
    "breed": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v22"
        }
    },
    "breeding": {
        "N": {
            "tab": ["n5"]
        }
    },
    "breeze": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brewery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "brick": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bride": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "bridge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brief": {
        "A": {
            "tab": ["a3"]
        }
    },
    "briefly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "brigade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bright": {
        "A": {
            "tab": ["a3"]
        }
    },
    "brilliant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "bring": {
        "V": {
            "tab": "v103"
        }
    },
    "broad": {
        "A": {
            "tab": ["a3"]
        }
    },
    "broadcast": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v58"
        }
    },
    "broadly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "brochure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "broker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bronze": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brother": {
        "N": {
            "tab": ["n85"]
        }
    },
    "brow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "brown": {
        "A": {
            "tab": ["a3"]
        }
    },
    "brush": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "bubble": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bucket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "budget": {
        "N": {
            "tab": ["n1"]
        }
    },
    "build": {
        "V": {
            "tab": "v23"
        }
    },
    "builder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "building": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bulb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bulk": {
        "N": {
            "tab": ["n5"]
        }
    },
    "bull": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bullet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bulletin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bump": {
        "V": {
            "tab": "v1"
        }
    },
    "bunch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bundle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "burden": {
        "N": {
            "tab": ["n1"]
        }
    },
    "bureau": {
        "N": {
            "tab": ["n14"]
        }
    },
    "bureaucracy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "bureaucratic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "burial": {
        "N": {
            "tab": ["n1"]
        }
    },
    "burn": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v26"
        }
    },
    "burning": {
        "A": {
            "tab": ["a1"]
        }
    },
    "burst": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v18"
        }
    },
    "bury": {
        "V": {
            "tab": "v4"
        }
    },
    "bus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "bush": {
        "N": {
            "tab": ["n2"]
        }
    },
    "business": {
        "N": {
            "tab": ["n2"]
        }
    },
    "businessman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "busy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "butter": {
        "N": {
            "tab": ["n5"]
        }
    },
    "butterfly": {
        "N": {
            "tab": ["n3"]
        }
    },
    "button": {
        "N": {
            "tab": ["n1"]
        }
    },
    "buy": {
        "V": {
            "tab": "v59"
        }
    },
    "buyer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "by": {
        "P": {
            "tab": ["pp"]
        }
    },
    "bye": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cab": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cabin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cabinet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cable": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "calcium": {
        "N": {
            "tab": ["n5"]
        }
    },
    "calculate": {
        "V": {
            "tab": "v3"
        }
    },
    "calculation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "calendar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "calf": {
        "N": {
            "tab": ["n9"]
        }
    },
    "call": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "calm": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "calorie": {
        "N": {
            "tab": ["n1"]
        }
    },
    "camera": {
        "N": {
            "tab": ["n1"]
        }
    },
    "camp": {
        "N": {
            "tab": ["n1"]
        }
    },
    "campaign": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "can": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "canal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cancel": {
        "V": {
            "tab": "v9"
        }
    },
    "cancer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "candidate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "candle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "canvas": {
        "N": {
            "tab": ["n2"]
        }
    },
    "cap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "capability": {
        "N": {
            "tab": ["n3"]
        }
    },
    "capable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "capacity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "capital": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "capitalism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "capitalist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "captain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "capture": {
        "V": {
            "tab": "v3"
        }
    },
    "car": {
        "N": {
            "tab": ["n1"]
        }
    },
    "caravan": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carbon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "card": {
        "N": {
            "tab": ["n1"]
        }
    },
    "care": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "career": {
        "N": {
            "tab": ["n1"]
        }
    },
    "careful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "carefully": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "cargo": {
        "N": {
            "tab": ["n2"]
        }
    },
    "carpet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carriage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carrier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carrot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carry": {
        "V": {
            "tab": "v4"
        }
    },
    "cart": {
        "N": {
            "tab": ["n1"]
        }
    },
    "carve": {
        "V": {
            "tab": "v3"
        }
    },
    "case": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cash": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cassette": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cast": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v18"
        }
    },
    "castle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "casual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "casualty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "cat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "catalogue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "catch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v84"
        }
    },
    "category": {
        "N": {
            "tab": ["n3"]
        }
    },
    "cater": {
        "V": {
            "tab": "v1"
        }
    },
    "cathedral": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cattle": {
        "N": {
            "tab": ["n6"]
        }
    },
    "causal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "cause": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "caution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cautious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "cave": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cease": {
        "V": {
            "tab": "v3"
        }
    },
    "ceiling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "celebrate": {
        "V": {
            "tab": "v3"
        }
    },
    "celebration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cell": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cellar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cemetery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "census": {
        "N": {
            "tab": ["n2"]
        }
    },
    "central": {
        "A": {
            "tab": ["a1"]
        }
    },
    "centre": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "century": {
        "N": {
            "tab": ["n3"]
        }
    },
    "cereal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ceremony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "certain": {
        "A": {
            "tab": ["a1"]
        }
    },
    "certainly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "certainty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "certificate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chair": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "chairman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "chalk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "challenge": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "chamber": {
        "N": {
            "tab": ["n1"]
        }
    },
    "champagne": {
        "N": {
            "tab": ["n1"]
        }
    },
    "champion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "championship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chancellor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "change": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "channel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chaos": {
        "N": {
            "tab": ["n5"]
        }
    },
    "chap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chapel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chapter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "character": {
        "N": {
            "tab": ["n1"]
        }
    },
    "characteristic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "characterize": {
        "V": {
            "tab": "v3"
        }
    },
    "charge": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "charity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "charm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "charming": {
        "A": {
            "tab": ["a1"]
        }
    },
    "chart": {
        "N": {
            "tab": ["n1"]
        }
    },
    "charter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chase": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "chat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v14"
        }
    },
    "cheap": {
        "A": {
            "tab": ["a3"]
        }
    },
    "check": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "cheek": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cheer": {
        "V": {
            "tab": "v1"
        }
    },
    "cheerful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "cheese": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chemical": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "chemist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chemistry": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cheque": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chew": {
        "V": {
            "tab": "v1"
        }
    },
    "chicken": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chief": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "child": {
        "N": {
            "tab": ["n15"]
        }
    },
    "childhood": {
        "N": {
            "tab": ["n5"]
        }
    },
    "chimney": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chip": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chocolate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "choice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "choir": {
        "N": {
            "tab": ["n1"]
        }
    },
    "choke": {
        "V": {
            "tab": "v3"
        }
    },
    "choose": {
        "V": {
            "tab": "v93"
        }
    },
    "chop": {
        "V": {
            "tab": "v12"
        }
    },
    "chord": {
        "N": {
            "tab": ["n1"]
        }
    },
    "chorus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "chronic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "church": {
        "N": {
            "tab": ["n2"]
        }
    },
    "cigarette": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cinema": {
        "N": {
            "tab": ["n1"]
        }
    },
    "circle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "circuit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "circular": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "circulate": {
        "V": {
            "tab": "v3"
        }
    },
    "circulation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "circumstance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cite": {
        "V": {
            "tab": "v3"
        }
    },
    "citizen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "citizenship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "city": {
        "N": {
            "tab": ["n3"]
        }
    },
    "civic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "civil": {
        "A": {
            "tab": ["a8"]
        }
    },
    "civilian": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "civilization": {
        "N": {
            "tab": ["n1"]
        }
    },
    "claim": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "clarify": {
        "V": {
            "tab": "v4"
        }
    },
    "clarity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "clash": {
        "N": {
            "tab": ["n2"]
        }
    },
    "class": {
        "N": {
            "tab": ["n2"]
        }
    },
    "classic": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "classical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "classification": {
        "N": {
            "tab": ["n1"]
        }
    },
    "classify": {
        "V": {
            "tab": "v4"
        }
    },
    "classroom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clause": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clay": {
        "N": {
            "tab": ["n5"]
        }
    },
    "clean": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "cleaner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clear": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "clearance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clearing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clearly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "clergy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "clerical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "clerk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clever": {
        "A": {
            "tab": ["a3"]
        }
    },
    "client": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cliff": {
        "N": {
            "tab": ["n1"]
        }
    },
    "climate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "climb": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "climber": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cling": {
        "V": {
            "tab": "v21"
        }
    },
    "clinic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clinical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "clock": {
        "N": {
            "tab": ["n1"]
        }
    },
    "close": {
        "A": {
            "tab": ["a2"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "closely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "closure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cloth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clothes": {
        "N": {
            "tab": ["n6"]
        }
    },
    "clothing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cloud": {
        "N": {
            "tab": ["n1"]
        }
    },
    "club": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cluster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "clutch": {
        "V": {
            "tab": "v2"
        }
    },
    "coach": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "coal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coalition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coastal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "coat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "code": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "coffee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coffin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coherent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "coin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "coincide": {
        "V": {
            "tab": "v3"
        }
    },
    "coincidence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cold": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "collaboration": {
        "N": {
            "tab": ["n5"]
        }
    },
    "collapse": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "collar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "colleague": {
        "N": {
            "tab": ["n1"]
        }
    },
    "collect": {
        "V": {
            "tab": "v1"
        }
    },
    "collection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "collective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "collector": {
        "N": {
            "tab": ["n1"]
        }
    },
    "college": {
        "N": {
            "tab": ["n1"]
        }
    },
    "colon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "colonel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "colonial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "colony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "colour": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "coloured": {
        "A": {
            "tab": ["a1"]
        }
    },
    "colourful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "column": {
        "N": {
            "tab": ["n1"]
        }
    },
    "combat": {
        "V": {
            "tab": "v1"
        }
    },
    "combination": {
        "N": {
            "tab": ["n1"]
        }
    },
    "combine": {
        "V": {
            "tab": "v3"
        }
    },
    "come": {
        "V": {
            "tab": "v41"
        }
    },
    "comedy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "comfort": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "comfortable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "comfortably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "coming": {
        "A": {
            "tab": ["a1"]
        }
    },
    "command": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "commander": {
        "N": {
            "tab": ["n1"]
        }
    },
    "commence": {
        "V": {
            "tab": "v3"
        }
    },
    "comment": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "commentary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "commentator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "commerce": {
        "N": {
            "tab": ["n5"]
        }
    },
    "commercial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "commission": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "commissioner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "commit": {
        "V": {
            "tab": "v14"
        }
    },
    "commitment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "committee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "commodity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "common": {
        "A": {
            "tab": ["a3"]
        }
    },
    "commonly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "commons": {
        "N": {
            "tab": ["n6"]
        }
    },
    "commonwealth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "communicate": {
        "V": {
            "tab": "v3"
        }
    },
    "communication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "communism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "communist": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "community": {
        "N": {
            "tab": ["n3"]
        }
    },
    "compact": {
        "N": {
            "tab": ["n1"]
        }
    },
    "companion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "company": {
        "N": {
            "tab": ["n3"]
        }
    },
    "comparable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "comparative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "comparatively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "compare": {
        "V": {
            "tab": "v3"
        }
    },
    "comparison": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compartment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compatible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "compel": {
        "V": {
            "tab": "v9"
        }
    },
    "compensate": {
        "V": {
            "tab": "v3"
        }
    },
    "compensation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compete": {
        "V": {
            "tab": "v3"
        }
    },
    "competence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "competent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "competition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "competitive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "competitor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compile": {
        "V": {
            "tab": "v3"
        }
    },
    "complain": {
        "V": {
            "tab": "v1"
        }
    },
    "complaint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "complement": {
        "V": {
            "tab": "v1"
        }
    },
    "complementary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "complete": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "completely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "completion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "complex": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n2"]
        }
    },
    "complexity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "compliance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "complicate": {
        "V": {
            "tab": "v3"
        }
    },
    "complicated": {
        "A": {
            "tab": ["a1"]
        }
    },
    "complication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "comply": {
        "V": {
            "tab": "v4"
        }
    },
    "component": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compose": {
        "V": {
            "tab": "v3"
        }
    },
    "composer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "composition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "compound": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "comprehensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "comprise": {
        "V": {
            "tab": "v3"
        }
    },
    "compromise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "compulsory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "compute": {
        "V": {
            "tab": "v3"
        }
    },
    "computer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conceal": {
        "V": {
            "tab": "v1"
        }
    },
    "concede": {
        "V": {
            "tab": "v3"
        }
    },
    "conceive": {
        "V": {
            "tab": "v3"
        }
    },
    "concentrate": {
        "V": {
            "tab": "v3"
        }
    },
    "concentration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "concept": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conception": {
        "N": {
            "tab": ["n1"]
        }
    },
    "concern": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "concerned": {
        "A": {
            "tab": ["a1"]
        }
    },
    "concerning": {
        "P": {
            "tab": ["pp"]
        }
    },
    "concert": {
        "N": {
            "tab": ["n1"]
        }
    },
    "concession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conclude": {
        "V": {
            "tab": "v3"
        }
    },
    "conclusion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "concrete": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "condemn": {
        "V": {
            "tab": "v1"
        }
    },
    "condition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conduct": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "conductor": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "confer": {
        "V": {
            "tab": "v13"
        }
    },
    "conference": {
        "N": {
            "tab": ["n1"]
        }
    },
    "confess": {
        "V": {
            "tab": "v2"
        }
    },
    "confession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "confidence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "confident": {
        "A": {
            "tab": ["a1"]
        }
    },
    "confidential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "configuration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "confine": {
        "V": {
            "tab": "v3"
        }
    },
    "confirm": {
        "V": {
            "tab": "v1"
        }
    },
    "confirmation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conflict": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "conform": {
        "V": {
            "tab": "v1"
        }
    },
    "confront": {
        "V": {
            "tab": "v1"
        }
    },
    "confrontation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "confuse": {
        "V": {
            "tab": "v3"
        }
    },
    "confusion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "congratulate": {
        "V": {
            "tab": "v3"
        }
    },
    "congregation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "congress": {
        "N": {
            "tab": ["n2"]
        }
    },
    "conjunction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "connect": {
        "V": {
            "tab": "v1"
        }
    },
    "connection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conscience": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conscious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "consciousness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "consensus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "consent": {
        "N": {
            "tab": ["n5"]
        }
    },
    "consequence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "consequently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "conservation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "conservative": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "consider": {
        "V": {
            "tab": "v1"
        }
    },
    "considerable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "considerably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "consideration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "considering": {
        "P": {
            "tab": ["pp"]
        }
    },
    "consist": {
        "V": {
            "tab": "v1"
        }
    },
    "consistency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "consistent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "consistently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "consolidate": {
        "V": {
            "tab": "v3"
        }
    },
    "consortium": {
        "N": {
            "tab": ["n11"]
        }
    },
    "conspiracy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "constable": {
        "N": {
            "tab": ["n1"]
        }
    },
    "constant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "constantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "constituency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "constituent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "constitute": {
        "V": {
            "tab": "v3"
        }
    },
    "constitution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "constitutional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "constrain": {
        "V": {
            "tab": "v1"
        }
    },
    "constraint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "construct": {
        "V": {
            "tab": "v1"
        }
    },
    "construction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "constructive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "consult": {
        "V": {
            "tab": "v1"
        }
    },
    "consultant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "consultation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "consume": {
        "V": {
            "tab": "v3"
        }
    },
    "consumer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "consumption": {
        "N": {
            "tab": ["n5"]
        }
    },
    "contact": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "contain": {
        "V": {
            "tab": "v1"
        }
    },
    "container": {
        "N": {
            "tab": ["n1"]
        }
    },
    "contemplate": {
        "V": {
            "tab": "v3"
        }
    },
    "contemporary": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n3"]
        }
    },
    "contempt": {
        "N": {
            "tab": ["n5"]
        }
    },
    "contend": {
        "V": {
            "tab": "v1"
        }
    },
    "content": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "contest": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "context": {
        "N": {
            "tab": ["n1"]
        }
    },
    "continent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "continental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "continually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "continuation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "continue": {
        "V": {
            "tab": "v3"
        }
    },
    "continuity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "continuous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "continuously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "contract": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "contraction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "contractor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "contractual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "contradiction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "contrary": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n3"]
        }
    },
    "contrast": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "contribute": {
        "V": {
            "tab": "v3"
        }
    },
    "contribution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "control": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "controller": {
        "N": {
            "tab": ["n1"]
        }
    },
    "controversial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "controversy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "convenience": {
        "N": {
            "tab": ["n1"]
        }
    },
    "convenient": {
        "A": {
            "tab": ["a1"]
        }
    },
    "convention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conventional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "conversation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "conversely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "conversion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "convert": {
        "V": {
            "tab": "v1"
        }
    },
    "convey": {
        "V": {
            "tab": "v1"
        }
    },
    "convict": {
        "V": {
            "tab": "v1"
        }
    },
    "conviction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "convince": {
        "V": {
            "tab": "v3"
        }
    },
    "convincing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "cook": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "cooking": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cool": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "co-operate": {
        "V": {
            "tab": "v3"
        }
    },
    "cooperation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "co-operation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "co-operative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "cop": {
        "V": {
            "tab": "v12"
        }
    },
    "cope": {
        "V": {
            "tab": "v3"
        }
    },
    "copper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "copy": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "copyright": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cord": {
        "N": {
            "tab": ["n1"]
        }
    },
    "core": {
        "N": {
            "tab": ["n1"]
        }
    },
    "corn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "corner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "corporate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "corps": {
        "N": {
            "tab": ["n4"]
        }
    },
    "corpse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "correct": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "correction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "correctly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "correlation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "correspond": {
        "V": {
            "tab": "v1"
        }
    },
    "correspondence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "correspondent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "corresponding": {
        "A": {
            "tab": ["a1"]
        }
    },
    "corridor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "corruption": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cost": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v58"
        }
    },
    "costly": {
        "A": {
            "tab": ["a4"]
        }
    },
    "costume": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cottage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cotton": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cough": {
        "V": {
            "tab": "v1"
        }
    },
    "council": {
        "N": {
            "tab": ["n1"]
        }
    },
    "councillor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "counsel": {
        "N": {
            "tab": ["n5"]
        }
    },
    "counsellor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "count": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "counter": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "counterpart": {
        "N": {
            "tab": ["n1"]
        }
    },
    "country": {
        "N": {
            "tab": ["n3"]
        }
    },
    "countryside": {
        "N": {
            "tab": ["n5"]
        }
    },
    "county": {
        "N": {
            "tab": ["n3"]
        }
    },
    "coup": {
        "N": {
            "tab": ["n1"]
        }
    },
    "couple": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "courage": {
        "N": {
            "tab": ["n5"]
        }
    },
    "course": {
        "N": {
            "tab": ["n1"]
        }
    },
    "court": {
        "N": {
            "tab": ["n1"]
        }
    },
    "courtesy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "courtyard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cousin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "covenant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cover": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "coverage": {
        "N": {
            "tab": ["n5"]
        }
    },
    "cow": {
        "N": {
            "tab": ["n69"]
        }
    },
    "crack": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "craft": {
        "N": {
            "tab": ["n1"]
        }
    },
    "craftsman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "crash": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "crawl": {
        "V": {
            "tab": "v1"
        }
    },
    "crazy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "cream": {
        "N": {
            "tab": ["n1"]
        }
    },
    "create": {
        "V": {
            "tab": "v3"
        }
    },
    "creation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "creative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "creature": {
        "N": {
            "tab": ["n1"]
        }
    },
    "credibility": {
        "N": {
            "tab": ["n5"]
        }
    },
    "credit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "creditor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "creed": {
        "N": {
            "tab": ["n1"]
        }
    },
    "creep": {
        "V": {
            "tab": "v29"
        }
    },
    "crew": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cricket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "crime": {
        "N": {
            "tab": ["n1"]
        }
    },
    "criminal": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "crisis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "criterion": {
        "N": {
            "tab": ["n26"]
        }
    },
    "critic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "critical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "criticism": {
        "N": {
            "tab": ["n1"]
        }
    },
    "criticize": {
        "V": {
            "tab": "v3"
        }
    },
    "critique": {
        "N": {
            "tab": ["n1"]
        }
    },
    "crop": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "cross": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "crossing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "crouch": {
        "V": {
            "tab": "v2"
        }
    },
    "crowd": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "crown": {
        "N": {
            "tab": ["n1"]
        }
    },
    "crucial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "crude": {
        "A": {
            "tab": ["a2"]
        }
    },
    "cruel": {
        "A": {
            "tab": ["a8"]
        }
    },
    "cruelty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "crush": {
        "V": {
            "tab": "v2"
        }
    },
    "cry": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "crystal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cult": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cultivate": {
        "V": {
            "tab": "v3"
        }
    },
    "cultural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "culture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cup": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cupboard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "curiosity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "curious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "curiously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "curl": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "currency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "current": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "currently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "curriculum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "curtain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "curve": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "cushion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "custody": {
        "N": {
            "tab": ["n5"]
        }
    },
    "custom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "customer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cut": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v17"
        }
    },
    "cutting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cycle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "cylinder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "daily": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "dairy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "damage": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "damn": {
        "V": {
            "tab": "v1"
        }
    },
    "damp": {
        "A": {
            "tab": ["a3"]
        }
    },
    "dance": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "dancer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dancing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "danger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dangerous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dare": {
        "V": {
            "tab": "v158"
        }
    },
    "dark": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "darkness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "darling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dash": {
        "V": {
            "tab": "v2"
        }
    },
    "data": {
        "N": {
            "tab": ["n4"]
        }
    },
    "date": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "daughter": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "dawn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "day": {
        "N": {
            "tab": ["n1"]
        }
    },
    "daylight": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dead": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "deadline": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deadly": {
        "A": {
            "tab": ["a4"]
        }
    },
    "deaf": {
        "A": {
            "tab": ["a3"]
        }
    },
    "deal": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v55"
        }
    },
    "dealer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dealing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dear": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "death": {
        "N": {
            "tab": ["n1"]
        }
    },
    "debate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "debt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "debtor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "debut": {
        "N": {
            "tab": ["n1"]
        }
    },
    "decade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "decay": {
        "N": {
            "tab": ["n5"]
        }
    },
    "decent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "decide": {
        "V": {
            "tab": "v3"
        }
    },
    "decision": {
        "N": {
            "tab": ["n1"]
        }
    },
    "decisive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "deck": {
        "N": {
            "tab": ["n1"]
        }
    },
    "declaration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "declare": {
        "V": {
            "tab": "v3"
        }
    },
    "decline": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "decorate": {
        "V": {
            "tab": "v3"
        }
    },
    "decoration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "decorative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "decrease": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "decree": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dedicate": {
        "V": {
            "tab": "v3"
        }
    },
    "deed": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deem": {
        "V": {
            "tab": "v1"
        }
    },
    "deep": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "deeply": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "deer": {
        "N": {
            "tab": ["n4"]
        }
    },
    "default": {
        "N": {
            "tab": ["n5"]
        }
    },
    "defeat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "defect": {
        "N": {
            "tab": ["n1"]
        }
    },
    "defense": {
        "N": {
            "tab": ["n1"]
        }
    },
    "defend": {
        "V": {
            "tab": "v1"
        }
    },
    "defendant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "defender": {
        "N": {
            "tab": ["n1"]
        }
    },
    "defensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "deficiency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "deficit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "define": {
        "V": {
            "tab": "v3"
        }
    },
    "definite": {
        "A": {
            "tab": ["a1"]
        }
    },
    "definitely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "definition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "defy": {
        "V": {
            "tab": "v4"
        }
    },
    "degree": {
        "N": {
            "tab": ["n1"]
        }
    },
    "delay": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "delegate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "delegation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "delete": {
        "V": {
            "tab": "v3"
        }
    },
    "deliberate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "deliberately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "delicate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "delicious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "delight": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "delightful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "deliver": {
        "V": {
            "tab": "v1"
        }
    },
    "delivery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "demand": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "democracy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "democrat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "democratic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "demolish": {
        "V": {
            "tab": "v2"
        }
    },
    "demonstrate": {
        "V": {
            "tab": "v3"
        }
    },
    "demonstration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "demonstrator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "denial": {
        "N": {
            "tab": ["n1"]
        }
    },
    "denounce": {
        "V": {
            "tab": "v3"
        }
    },
    "dense": {
        "A": {
            "tab": ["a2"]
        }
    },
    "density": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dentist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deny": {
        "V": {
            "tab": "v4"
        }
    },
    "depart": {
        "V": {
            "tab": "v1"
        }
    },
    "department": {
        "N": {
            "tab": ["n1"]
        }
    },
    "departmental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "departure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "depend": {
        "V": {
            "tab": "v1"
        }
    },
    "dependence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dependency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dependent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "depict": {
        "V": {
            "tab": "v1"
        }
    },
    "deploy": {
        "V": {
            "tab": "v1"
        }
    },
    "deposit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "depot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "depression": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deprivation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deprive": {
        "V": {
            "tab": "v3"
        }
    },
    "depth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deputy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "derive": {
        "V": {
            "tab": "v3"
        }
    },
    "descend": {
        "V": {
            "tab": "v1"
        }
    },
    "descent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "describe": {
        "V": {
            "tab": "v3"
        }
    },
    "description": {
        "N": {
            "tab": ["n1"]
        }
    },
    "desert": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "deserve": {
        "V": {
            "tab": "v3"
        }
    },
    "design": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "designate": {
        "V": {
            "tab": "v3"
        }
    },
    "designer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "desirable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "desire": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "desk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "despair": {
        "N": {
            "tab": ["n5"]
        }
    },
    "desperate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "desperately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "despite": {
        "P": {
            "tab": ["pp"]
        }
    },
    "destination": {
        "N": {
            "tab": ["n1"]
        }
    },
    "destiny": {
        "N": {
            "tab": ["n3"]
        }
    },
    "destroy": {
        "V": {
            "tab": "v1"
        }
    },
    "destruction": {
        "N": {
            "tab": ["n5"]
        }
    },
    "detail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "detain": {
        "V": {
            "tab": "v1"
        }
    },
    "detect": {
        "V": {
            "tab": "v1"
        }
    },
    "detection": {
        "N": {
            "tab": ["n5"]
        }
    },
    "detective": {
        "N": {
            "tab": ["n1"]
        }
    },
    "detector": {
        "N": {
            "tab": ["n1"]
        }
    },
    "detention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deter": {
        "V": {
            "tab": "v13"
        }
    },
    "deteriorate": {
        "V": {
            "tab": "v3"
        }
    },
    "determination": {
        "N": {
            "tab": ["n5"]
        }
    },
    "determine": {
        "V": {
            "tab": "v3"
        }
    },
    "develop": {
        "V": {
            "tab": "v1"
        }
    },
    "developer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "development": {
        "N": {
            "tab": ["n1"]
        }
    },
    "deviation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "device": {
        "N": {
            "tab": ["n1"]
        }
    },
    "devil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "devise": {
        "V": {
            "tab": "v3"
        }
    },
    "devote": {
        "V": {
            "tab": "v3"
        }
    },
    "devoted": {
        "A": {
            "tab": ["a1"]
        }
    },
    "diagnose": {
        "V": {
            "tab": "v3"
        }
    },
    "diagnosis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "diagram": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dialogue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "diameter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "diamond": {
        "N": {
            "tab": ["n1"]
        }
    },
    "diary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dictate": {
        "V": {
            "tab": "v3"
        }
    },
    "dictionary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "die": {
        "V": {
            "tab": "v28"
        }
    },
    "diet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "differ": {
        "V": {
            "tab": "v1"
        }
    },
    "difference": {
        "N": {
            "tab": ["n1"]
        }
    },
    "different": {
        "A": {
            "tab": ["a1"]
        }
    },
    "differential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "differentiate": {
        "V": {
            "tab": "v3"
        }
    },
    "differentiation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "differently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "difficult": {
        "A": {
            "tab": ["a1"]
        }
    },
    "difficulty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dig": {
        "V": {
            "tab": "v109"
        }
    },
    "digital": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dignity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dilemma": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dimension": {
        "N": {
            "tab": ["n1"]
        }
    },
    "diminish": {
        "V": {
            "tab": "v2"
        }
    },
    "dine": {
        "V": {
            "tab": "v3"
        }
    },
    "dinner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dioxide": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dip": {
        "V": {
            "tab": "v12"
        }
    },
    "diplomat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "diplomatic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "direct": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "direction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "directive": {
        "N": {
            "tab": ["n1"]
        }
    },
    "directly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "director": {
        "N": {
            "tab": ["n1"]
        }
    },
    "directory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dirt": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dirty": {
        "A": {
            "tab": ["a4"]
        }
    },
    "disability": {
        "N": {
            "tab": ["n3"]
        }
    },
    "disadvantage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disagree": {
        "V": {
            "tab": "v16"
        }
    },
    "disagreement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disappear": {
        "V": {
            "tab": "v1"
        }
    },
    "disappoint": {
        "V": {
            "tab": "v1"
        }
    },
    "disappointment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disaster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disastrous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "disc": {
        "N": {
            "tab": ["n1"]
        }
    },
    "discard": {
        "V": {
            "tab": "v1"
        }
    },
    "discharge": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "disciplinary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "discipline": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "disclose": {
        "V": {
            "tab": "v3"
        }
    },
    "disclosure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disco": {
        "N": {
            "tab": ["n1"]
        }
    },
    "discount": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "discourage": {
        "V": {
            "tab": "v3"
        }
    },
    "discourse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "discover": {
        "V": {
            "tab": "v1"
        }
    },
    "discovery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "discretion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "discrimination": {
        "N": {
            "tab": ["n5"]
        }
    },
    "discuss": {
        "V": {
            "tab": "v2"
        }
    },
    "discussion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disease": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disguise": {
        "V": {
            "tab": "v3"
        }
    },
    "dish": {
        "N": {
            "tab": ["n2"]
        }
    },
    "disk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dislike": {
        "V": {
            "tab": "v3"
        }
    },
    "dismiss": {
        "V": {
            "tab": "v2"
        }
    },
    "dismissal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disorder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disperse": {
        "V": {
            "tab": "v3"
        }
    },
    "display": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "disposal": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dispose": {
        "V": {
            "tab": "v3"
        }
    },
    "disposition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dispute": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "disrupt": {
        "V": {
            "tab": "v1"
        }
    },
    "disruption": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dissolve": {
        "V": {
            "tab": "v3"
        }
    },
    "distance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "distant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "distinct": {
        "A": {
            "tab": ["a1"]
        }
    },
    "distinction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "distinctive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "distinctly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "distinguish": {
        "V": {
            "tab": "v2"
        }
    },
    "distinguished": {
        "A": {
            "tab": ["a1"]
        }
    },
    "distort": {
        "V": {
            "tab": "v1"
        }
    },
    "distortion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "distract": {
        "V": {
            "tab": "v1"
        }
    },
    "distress": {
        "N": {
            "tab": ["n5"]
        }
    },
    "distribute": {
        "V": {
            "tab": "v3"
        }
    },
    "distribution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "distributor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "district": {
        "N": {
            "tab": ["n1"]
        }
    },
    "disturb": {
        "V": {
            "tab": "v1"
        }
    },
    "disturbance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dive": {
        "V": {
            "tab": "v3"
        }
    },
    "diverse": {
        "A": {
            "tab": ["a1"]
        }
    },
    "diversity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "divert": {
        "V": {
            "tab": "v1"
        }
    },
    "divide": {
        "V": {
            "tab": "v3"
        }
    },
    "dividend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "divine": {
        "A": {
            "tab": ["a1"]
        }
    },
    "division": {
        "N": {
            "tab": ["n1"]
        }
    },
    "divorce": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "do": {
        "V": {
            "tab": "v96"
        }
    },
    "dock": {
        "N": {
            "tab": ["n1"]
        }
    },
    "doctor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "doctrine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "document": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "documentation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dog": {
        "N": {
            "tab": ["n1"]
        }
    },
    "doll": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dollar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dolphin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "domain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dome": {
        "N": {
            "tab": ["n1"]
        }
    },
    "domestic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dominance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "dominant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dominate": {
        "V": {
            "tab": "v3"
        }
    },
    "domination": {
        "N": {
            "tab": ["n5"]
        }
    },
    "donate": {
        "V": {
            "tab": "v3"
        }
    },
    "donation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "donor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "door": {
        "N": {
            "tab": ["n1"]
        }
    },
    "doorway": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dose": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "double": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "doubt": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "doubtful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "doubtless": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "down": {
        "Adv":{"tab":["b1"]},
        "P": {
            "tab": ["pp"]
        }
    },
    "downstairs": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "dozen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "draft": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "drag": {
        "V": {
            "tab": "v7"
        }
    },
    "dragon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "drain": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "drainage": {
        "N": {
            "tab": ["n5"]
        }
    },
    "drama": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dramatic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dramatically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "draw": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v54"
        }
    },
    "drawer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "drawing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dreadful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "dream": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v26"
        }
    },
    "dress": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "dressing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "drift": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "drill": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "drink": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v65"
        }
    },
    "drive": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v42"
        }
    },
    "driver": {
        "N": {
            "tab": ["n1"]
        }
    },
    "drop": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "drown": {
        "V": {
            "tab": "v1"
        }
    },
    "drug": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v7"
        }
    },
    "drum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "drunk": {
        "A": {
            "tab": ["a3"]
        }
    },
    "dry": {
        "A": {
            "tab": ["a4"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "dual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "duck": {
        "N": {
            "tab": ["n1"]
        }
    },
    "due": {
        "A": {
            "tab": ["a1"]
        }
    },
    "duke": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "dull": {
        "A": {
            "tab": ["a3"]
        }
    },
    "duly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "dump": {
        "V": {
            "tab": "v1"
        }
    },
    "duration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "during": {
        "P": {
            "tab": ["pp"]
        }
    },
    "dust": {
        "N": {
            "tab": ["n5"]
        }
    },
    "duty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "dwelling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "dynamic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "eager": {
        "A": {
            "tab": ["a1"]
        }
    },
    "eagle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ear": {
        "N": {
            "tab": ["n1"]
        }
    },
    "earl": {
        "N": {
            "tab": ["n1"]
        }
    },
    "early": {
        "A": {
            "tab": ["a4"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "earn": {
        "V": {
            "tab": "v1"
        }
    },
    "earth": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ease": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "easily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "east": {
        "N": {
            "tab": ["n5"]
        }
    },
    "eastern": {
        "A": {
            "tab": ["a1"]
        }
    },
    "easy": {
        "A": {
            "tab": ["a4"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "eat": {
        "V": {
            "tab": "v70"
        }
    },
    "echo": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v172"
        }
    },
    "economic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "economically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "economics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "economist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "economy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "edge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "edit": {
        "V": {
            "tab": "v1"
        }
    },
    "edition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "editor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "educate": {
        "V": {
            "tab": "v3"
        }
    },
    "education": {
        "N": {
            "tab": ["n5"]
        }
    },
    "educational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "effect": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "effective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "effectively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "effectiveness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "efficiency": {
        "N": {
            "tab": ["n5"]
        }
    },
    "efficient": {
        "A": {
            "tab": ["a1"]
        }
    },
    "efficiently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "effort": {
        "N": {
            "tab": ["n1"]
        }
    },
    "egg": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ego": {
        "N": {
            "tab": ["n1"]
        }
    },
    "either": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "elaborate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "elbow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "elder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "elderly": {
        "A": {
            "tab": ["a1"]
        }
    },
    "elect": {
        "V": {
            "tab": "v1"
        }
    },
    "election": {
        "N": {
            "tab": ["n1"]
        }
    },
    "electoral": {
        "A": {
            "tab": ["a1"]
        }
    },
    "electorate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "electric": {
        "A": {
            "tab": ["a1"]
        }
    },
    "electrical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "electricity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "electron": {
        "N": {
            "tab": ["n1"]
        }
    },
    "electronic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "electronics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "elegant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "element": {
        "N": {
            "tab": ["n1"]
        }
    },
    "elephant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "eligible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "eliminate": {
        "V": {
            "tab": "v3"
        }
    },
    "elite": {
        "N": {
            "tab": ["n1"]
        }
    },
    "else": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "elsewhere": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "embark": {
        "V": {
            "tab": "v1"
        }
    },
    "embarrassing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "embarrassment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "embassy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "embody": {
        "V": {
            "tab": "v4"
        }
    },
    "embrace": {
        "V": {
            "tab": "v3"
        }
    },
    "embryo": {
        "N": {
            "tab": ["n1"]
        }
    },
    "emerge": {
        "V": {
            "tab": "v3"
        }
    },
    "emergence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "emergency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "emission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "emotion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "emotional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "emperor": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "emphasis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "emphasize": {
        "V": {
            "tab": "v3"
        }
    },
    "empire": {
        "N": {
            "tab": ["n1"]
        }
    },
    "empirical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "employ": {
        "V": {
            "tab": "v1"
        }
    },
    "employee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "employer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "employment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "empty": {
        "A": {
            "tab": ["a4"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "enable": {
        "V": {
            "tab": "v3"
        }
    },
    "enclose": {
        "V": {
            "tab": "v3"
        }
    },
    "encompass": {
        "V": {
            "tab": "v2"
        }
    },
    "encounter": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "encourage": {
        "V": {
            "tab": "v3"
        }
    },
    "encouragement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "end": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "ending": {
        "N": {
            "tab": ["n1"]
        }
    },
    "endless": {
        "A": {
            "tab": ["a1"]
        }
    },
    "endorse": {
        "V": {
            "tab": "v3"
        }
    },
    "endure": {
        "V": {
            "tab": "v3"
        }
    },
    "enemy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "energy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "enforce": {
        "V": {
            "tab": "v3"
        }
    },
    "enforcement": {
        "N": {
            "tab": ["n5"]
        }
    },
    "engage": {
        "V": {
            "tab": "v3"
        }
    },
    "engagement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "engine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "engineer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "engineering": {
        "N": {
            "tab": ["n5"]
        }
    },
    "enhance": {
        "V": {
            "tab": "v3"
        }
    },
    "enjoy": {
        "V": {
            "tab": "v1"
        }
    },
    "enjoyable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "enjoyment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "enormous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "enormously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "enough": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "enquire": {
        "V": {
            "tab": "v3"
        }
    },
    "enquiry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "ensure": {
        "V": {
            "tab": "v3"
        }
    },
    "entail": {
        "V": {
            "tab": "v1"
        }
    },
    "enter": {
        "V": {
            "tab": "v1"
        }
    },
    "enterprise": {
        "N": {
            "tab": ["n1"]
        }
    },
    "entertain": {
        "V": {
            "tab": "v1"
        }
    },
    "entertainment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "enthusiasm": {
        "N": {
            "tab": ["n5"]
        }
    },
    "enthusiast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "enthusiastic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "entire": {
        "A": {
            "tab": ["a1"]
        }
    },
    "entirely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "entitle": {
        "V": {
            "tab": "v3"
        }
    },
    "entitlement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "entity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "entrance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "entry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "envelope": {
        "N": {
            "tab": ["n1"]
        }
    },
    "environment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "environmental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "envisage": {
        "V": {
            "tab": "v3"
        }
    },
    "enzyme": {
        "N": {
            "tab": ["n1"]
        }
    },
    "episode": {
        "N": {
            "tab": ["n1"]
        }
    },
    "equal": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "equality": {
        "N": {
            "tab": ["n5"]
        }
    },
    "equally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "equation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "equilibrium": {
        "N": {
            "tab": ["n5"]
        }
    },
    "equip": {
        "V": {
            "tab": "v12"
        }
    },
    "equipment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "equity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "equivalent": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "era": {
        "N": {
            "tab": ["n1"]
        }
    },
    "erect": {
        "V": {
            "tab": "v1"
        }
    },
    "erosion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "error": {
        "N": {
            "tab": ["n1"]
        }
    },
    "escape": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "especially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "essay": {
        "N": {
            "tab": ["n1"]
        }
    },
    "essence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "essential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "essentially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "establish": {
        "V": {
            "tab": "v2"
        }
    },
    "establishment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "estate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "estimate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "eternal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ethical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ethics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ethnic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "evaluate": {
        "V": {
            "tab": "v3"
        }
    },
    "evaluation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "even": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "evening": {
        "N": {
            "tab": ["n1"]
        }
    },
    "event": {
        "N": {
            "tab": ["n1"]
        }
    },
    "eventual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "eventually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "ever": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "everybody": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "everyday": {
        "A": {
            "tab": ["a1"]
        }
    },
    "everyone": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "everything": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "everywhere": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "evidence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "evident": {
        "A": {
            "tab": ["a1"]
        }
    },
    "evidently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "evil": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "evoke": {
        "V": {
            "tab": "v3"
        }
    },
    "evolution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "evolutionary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "evolve": {
        "V": {
            "tab": "v3"
        }
    },
    "exact": {
        "A": {
            "tab": ["a1"]
        }
    },
    "exactly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "exaggerate": {
        "V": {
            "tab": "v3"
        }
    },
    "exam": {
        "N": {
            "tab": ["n1"]
        }
    },
    "examination": {
        "N": {
            "tab": ["n1"]
        }
    },
    "examine": {
        "V": {
            "tab": "v3"
        }
    },
    "example": {
        "N": {
            "tab": ["n1"]
        }
    },
    "excavation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exceed": {
        "V": {
            "tab": "v1"
        }
    },
    "excellent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "except": {
        "P": {
            "tab": ["pp"]
        }
    },
    "exception": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exceptional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "exceptionally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "excess": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n2"]
        }
    },
    "excessive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "exchange": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "excite": {
        "V": {
            "tab": "v3"
        }
    },
    "excitement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exciting": {
        "A": {
            "tab": ["a1"]
        }
    },
    "exclaim": {
        "V": {
            "tab": "v1"
        }
    },
    "exclude": {
        "V": {
            "tab": "v3"
        }
    },
    "exclusion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exclusive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "exclusively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "excuse": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "execute": {
        "V": {
            "tab": "v3"
        }
    },
    "execution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "executive": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "exemption": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exercise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "exert": {
        "V": {
            "tab": "v1"
        }
    },
    "exhaust": {
        "V": {
            "tab": "v1"
        }
    },
    "exhibit": {
        "V": {
            "tab": "v1"
        }
    },
    "exhibition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exist": {
        "V": {
            "tab": "v1"
        }
    },
    "existence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "exotic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "expand": {
        "V": {
            "tab": "v1"
        }
    },
    "expansion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "expect": {
        "V": {
            "tab": "v1"
        }
    },
    "expectation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "expected": {
        "A": {
            "tab": ["a1"]
        }
    },
    "expedition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "expel": {
        "V": {
            "tab": "v9"
        }
    },
    "expenditure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "expense": {
        "N": {
            "tab": ["n1"]
        }
    },
    "expensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "experience": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "experienced": {
        "A": {
            "tab": ["a1"]
        }
    },
    "experiment": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "experimental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "expert": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "expertise": {
        "N": {
            "tab": ["n5"]
        }
    },
    "explain": {
        "V": {
            "tab": "v1"
        }
    },
    "explanation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "explicit": {
        "A": {
            "tab": ["a1"]
        }
    },
    "explicitly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "explode": {
        "V": {
            "tab": "v3"
        }
    },
    "exploit": {
        "V": {
            "tab": "v1"
        }
    },
    "exploitation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "exploration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "explore": {
        "V": {
            "tab": "v3"
        }
    },
    "explosion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "export": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "expose": {
        "V": {
            "tab": "v3"
        }
    },
    "exposure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "express": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "expression": {
        "N": {
            "tab": ["n1"]
        }
    },
    "extend": {
        "V": {
            "tab": "v1"
        }
    },
    "extension": {
        "N": {
            "tab": ["n1"]
        }
    },
    "extensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "extensively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "extent": {
        "N": {
            "tab": ["n5"]
        }
    },
    "external": {
        "A": {
            "tab": ["a1"]
        }
    },
    "extra": {
        "A": {
            "tab": ["a1"]
        }
    },
    "extract": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "extraordinary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "extreme": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "extremely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "eye": {
        "N": {
            "tab": ["n1"]
        }
    },
    "eyebrow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fabric": {
        "N": {
            "tab": ["n1"]
        }
    },
    "face": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "facilitate": {
        "V": {
            "tab": "v3"
        }
    },
    "facility": {
        "N": {
            "tab": ["n3"]
        }
    },
    "fact": {
        "N": {
            "tab": ["n1"]
        }
    },
    "faction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "factor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "factory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "faculty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "fade": {
        "V": {
            "tab": "v3"
        }
    },
    "fail": {
        "V": {
            "tab": "v1"
        }
    },
    "failure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "faint": {
        "A": {
            "tab": ["a3"]
        }
    },
    "fair": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "fairly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fairy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "faith": {
        "N": {
            "tab": ["n1"]
        }
    },
    "faithful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fall": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v76"
        }
    },
    "false": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fame": {
        "N": {
            "tab": ["n5"]
        }
    },
    "familiar": {
        "A": {
            "tab": ["a1"]
        }
    },
    "family": {
        "N": {
            "tab": ["n3"]
        }
    },
    "famous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fan": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "fancy": {
        "V": {
            "tab": "v4"
        }
    },
    "fantastic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fantasy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "far": {
        "A": {
            "tab": ["a17"]
        },
        "Adv": {
            "tab": ["b4"]
        }
    },
    "fare": {
        "N": {
            "tab": ["n1"]
        }
    },
    "farm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "farmer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fascinate": {
        "V": {
            "tab": "v3"
        }
    },
    "fascinating": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fashion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fashionable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fast": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fat": {
        "A": {
            "tab": ["a11"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "fatal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "father": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "fault": {
        "N": {
            "tab": ["n1"]
        }
    },
    "favour": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "favourable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "favourite": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "fear": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "feasible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "feast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "feather": {
        "N": {
            "tab": ["n1"]
        }
    },
    "feature": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "federal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "federation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "feed": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v22"
        }
    },
    "feedback": {
        "N": {
            "tab": ["n5"]
        }
    },
    "feel": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v129"
        }
    },
    "feeling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fellow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "female": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "feminine": {
        "A": {
            "tab": ["a1"]
        }
    },
    "feminist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ferry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "fertility": {
        "N": {
            "tab": ["n5"]
        }
    },
    "festival": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fetch": {
        "V": {
            "tab": "v2"
        }
    },
    "fever": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fibre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fiction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "field": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fierce": {
        "A": {
            "tab": ["a2"]
        }
    },
    "fiercely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fig": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fight": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v67"
        }
    },
    "fighter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "figure": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "file": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "fill": {
        "V": {
            "tab": "v1"
        }
    },
    "film": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "filter": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "final": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "finally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "finance": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "financial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "financially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "find": {
        "V": {
            "tab": "v25"
        }
    },
    "finding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fine": {
        "A": {
            "tab": ["a2"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "finger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "finish": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "fire": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "firm": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "firmly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "firstly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fiscal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fish": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "fisherman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "fishing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "fist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fit": {
        "A": {
            "tab": ["a11"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v14"
        }
    },
    "fitness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "fitting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fix": {
        "V": {
            "tab": "v2"
        }
    },
    "fixed": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fixture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flag": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flame": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flash": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "flat": {
        "A": {
            "tab": ["a11"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "flavour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flee": {
        "V": {
            "tab": "v73"
        }
    },
    "fleet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flesh": {
        "N": {
            "tab": ["n5"]
        }
    },
    "flexibility": {
        "N": {
            "tab": ["n5"]
        }
    },
    "flexible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "flick": {
        "V": {
            "tab": "v1"
        }
    },
    "flight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fling": {
        "V": {
            "tab": "v21"
        }
    },
    "float": {
        "V": {
            "tab": "v1"
        }
    },
    "flock": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flood": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "floor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flour": {
        "N": {
            "tab": ["n5"]
        }
    },
    "flourish": {
        "V": {
            "tab": "v2"
        }
    },
    "flow": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "flower": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fluctuation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fluid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "flush": {
        "V": {
            "tab": "v2"
        }
    },
    "fly": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v80"
        }
    },
    "focus": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v172"
        }
    },
    "fog": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fold": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "folk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "follow": {
        "V": {
            "tab": "v1"
        }
    },
    "follower": {
        "N": {
            "tab": ["n1"]
        }
    },
    "following": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fond": {
        "A": {
            "tab": ["a3"]
        }
    },
    "food": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fool": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "foolish": {
        "A": {
            "tab": ["a1"]
        }
    },
    "foot": {
        "N": {
            "tab": ["n19"]
        }
    },
    "football": {
        "N": {
            "tab": ["n1"]
        }
    },
    "footstep": {
        "N": {
            "tab": ["n1"]
        }
    },
    "for": {
        "P": {
            "tab": ["pp"]
        }
    },
    "forbid": {
        "V": {
            "tab": "v118"
        }
    },
    "force": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "forecast": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v58"
        }
    },
    "forehead": {
        "N": {
            "tab": ["n1"]
        }
    },
    "foreign": {
        "A": {
            "tab": ["a1"]
        }
    },
    "foreigner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "forest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "forestry": {
        "N": {
            "tab": ["n5"]
        }
    },
    "forever": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "forge": {
        "V": {
            "tab": "v3"
        }
    },
    "forget": {
        "V": {
            "tab": "v125"
        }
    },
    "forgive": {
        "V": {
            "tab": "v43"
        }
    },
    "fork": {
        "N": {
            "tab": ["n1"]
        }
    },
    "form": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "formal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "formally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "format": {
        "N": {
            "tab": ["n1"]
        }
    },
    "formation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "formerly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "formidable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "formula": {
        "N": {
            "tab": ["n1"]
        }
    },
    "formulate": {
        "V": {
            "tab": "v3"
        }
    },
    "formulation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "forth": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "forthcoming": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fortnight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fortunate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fortunately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fortune": {
        "N": {
            "tab": ["n1"]
        }
    },
    "forum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "forward": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "forwards": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fossil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "foster": {
        "V": {
            "tab": "v1"
        }
    },
    "found": {
        "V": {
            "tab": "v1"
        }
    },
    "foundation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "founder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fountain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fox": {
        "N": {
            "tab": ["n2"]
        }
    },
    "fraction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fragile": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fragment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frame": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "framework": {
        "N": {
            "tab": ["n1"]
        }
    },
    "franchise": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frankly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fraud": {
        "N": {
            "tab": ["n1"]
        }
    },
    "free": {
        "A": {
            "tab": ["a2"]
        },
        "V": {
            "tab": "v16"
        }
    },
    "freedom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "freely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "freeze": {
        "V": {
            "tab": "v49"
        }
    },
    "freight": {
        "N": {
            "tab": ["n5"]
        }
    },
    "frequency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "frequent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "frequently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fresh": {
        "A": {
            "tab": ["a3"]
        }
    },
    "fridge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "friend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "friendly": {
        "A": {
            "tab": ["a4"]
        }
    },
    "friendship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frighten": {
        "V": {
            "tab": "v1"
        }
    },
    "frightened": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fringe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frog": {
        "N": {
            "tab": ["n1"]
        }
    },
    "from": {
        "P": {
            "tab": ["pp"]
        }
    },
    "front": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frontier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frown": {
        "V": {
            "tab": "v1"
        }
    },
    "fruit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "frustrate": {
        "V": {
            "tab": "v3"
        }
    },
    "frustration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fuck": {
        "V": {
            "tab": "v1"
        }
    },
    "fucking": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fuel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fulfill": {
        "V": {
            "tab": "v181"
        }
    },
    "full": {
        "A": {
            "tab": ["a3"]
        }
    },
    "full-time": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fully": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fun": {
        "N": {
            "tab": ["n5"]
        }
    },
    "function": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "functional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fund": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "fundamental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "fundamentally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "funeral": {
        "N": {
            "tab": ["n1"]
        }
    },
    "funny": {
        "A": {
            "tab": ["a4"]
        }
    },
    "fur": {
        "N": {
            "tab": ["n1"]
        }
    },
    "furious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "furnish": {
        "V": {
            "tab": "v2"
        }
    },
    "furniture": {
        "N": {
            "tab": ["n5"]
        }
    },
    "furthermore": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "fury": {
        "N": {
            "tab": ["n3"]
        }
    },
    "fusion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "fuss": {
        "N": {
            "tab": ["n2"]
        }
    },
    "future": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "gain": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "galaxy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "gall": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gallery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "gallon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "game": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gang": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "garage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "garden": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gardener": {
        "N": {
            "tab": ["n1"]
        }
    },
    "garlic": {
        "N": {
            "tab": ["n5"]
        }
    },
    "garment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gas": {
        "N": {
            "tab": ["n2"]
        }
    },
    "gasp": {
        "V": {
            "tab": "v1"
        }
    },
    "gastric": {
        "A": {
            "tab": ["a1"]
        }
    },
    "gate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gather": {
        "V": {
            "tab": "v1"
        }
    },
    "gathering": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gay": {
        "A": {
            "tab": ["a3"]
        }
    },
    "gaze": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "gear": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gender": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gene": {
        "N": {
            "tab": ["n1"]
        }
    },
    "general": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "generally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "generate": {
        "V": {
            "tab": "v3"
        }
    },
    "generation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "generous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "genetic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "genius": {
        "N": {
            "tab": ["n2"]
        }
    },
    "gentle": {
        "A": {
            "tab": ["a2"]
        }
    },
    "gentleman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "gently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "genuine": {
        "A": {
            "tab": ["a1"]
        }
    },
    "genuinely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "geographical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "geography": {
        "N": {
            "tab": ["n5"]
        }
    },
    "geological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "gesture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "get": {
        "V": {
            "tab": "v125"
        }
    },
    "ghost": {
        "N": {
            "tab": ["n1"]
        }
    },
    "giant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gift": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gig": {
        "N": {
            "tab": ["n1"]
        }
    },
    "girl": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "girlfriend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "give": {
        "V": {
            "tab": "v43"
        }
    },
    "glad": {
        "A": {
            "tab": ["a6"]
        }
    },
    "glance": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "glare": {
        "V": {
            "tab": "v3"
        }
    },
    "glass": {
        "N": {
            "tab": ["n2"]
        }
    },
    "glimpse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "global": {
        "A": {
            "tab": ["a1"]
        }
    },
    "gloom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "glorious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "glory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "glove": {
        "N": {
            "tab": ["n1"]
        }
    },
    "glow": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "go": {
        "N": {
            "tab": ["n4"]
        },
        "V": {
            "tab": "v122"
        }
    },
    "goal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "goalkeeper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "goat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "god": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "gold": {
        "N": {
            "tab": ["n5"]
        }
    },
    "golden": {
        "A": {
            "tab": ["a1"]
        }
    },
    "golf": {
        "N": {
            "tab": ["n5"]
        }
    },
    "good": {
        "A": {
            "tab": ["a15"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "goodness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "gospel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gossip": {
        "N": {
            "tab": ["n1"]
        }
    },
    "govern": {
        "V": {
            "tab": "v1"
        }
    },
    "government": {
        "N": {
            "tab": ["n1"]
        }
    },
    "governor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gown": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grab": {
        "V": {
            "tab": "v5"
        }
    },
    "grace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gradual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "gradually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "graduate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "grain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grammar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grammatical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "grand": {
        "A": {
            "tab": ["a3"]
        }
    },
    "grandfather": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "grandmother": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "grant": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "graph": {
        "N": {
            "tab": ["n1"]
        }
    },
    "graphics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "grasp": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "grass": {
        "N": {
            "tab": ["n2"]
        }
    },
    "grateful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "grave": {
        "A": {
            "tab": ["a2"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "gravel": {
        "N": {
            "tab": ["n5"]
        }
    },
    "gravity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "great": {
        "A": {
            "tab": ["a3"]
        }
    },
    "greatly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "green": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "greenhouse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "greet": {
        "V": {
            "tab": "v1"
        }
    },
    "greeting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grey": {
        "A": {
            "tab": ["a3"]
        }
    },
    "grid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grief": {
        "N": {
            "tab": ["n1"]
        }
    },
    "grim": {
        "A": {
            "tab": ["a9"]
        }
    },
    "grin": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "grind": {
        "V": {
            "tab": "v25"
        }
    },
    "grip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "groan": {
        "V": {
            "tab": "v1"
        }
    },
    "gross": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ground": {
        "N": {
            "tab": ["n1"]
        }
    },
    "group": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "grow": {
        "V": {
            "tab": "v27"
        }
    },
    "growth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guarantee": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v16"
        }
    },
    "guard": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "guardian": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guerrilla": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guess": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "guest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guidance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "guide": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "guideline": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guild": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guilt": {
        "N": {
            "tab": ["n5"]
        }
    },
    "guilty": {
        "A": {
            "tab": ["a4"]
        }
    },
    "guitar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gun": {
        "N": {
            "tab": ["n1"]
        }
    },
    "gut": {
        "N": {
            "tab": ["n1"]
        }
    },
    "guy": {
        "N": {
            "tab": ["n1"]
        }
    },
    "habit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "habitat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hair": {
        "N": {
            "tab": ["n1"]
        }
    },
    "half": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n9"]
        }
    },
    "hall": {
        "N": {
            "tab": ["n1"]
        }
    },
    "halt": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "ham": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hammer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hand": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "handful": {
        "N": {
            "tab": ["n1"]
        }
    },
    "handicap": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "handle": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "handsome": {
        "A": {
            "tab": ["a1"]
        }
    },
    "handy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "hang": {
        "V": {
            "tab": "v160"
        }
    },
    "happen": {
        "V": {
            "tab": "v1"
        }
    },
    "happily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "happiness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "happy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "harbour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hard": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "hardly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "hardship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hardware": {
        "N": {
            "tab": ["n5"]
        }
    },
    "harm": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "harmful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "harmony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "harsh": {
        "A": {
            "tab": ["a3"]
        }
    },
    "harvest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hastily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "hat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hate": {
        "V": {
            "tab": "v3"
        }
    },
    "hatred": {
        "N": {
            "tab": ["n1"]
        }
    },
    "haul": {
        "V": {
            "tab": "v1"
        }
    },
    "haunt": {
        "V": {
            "tab": "v1"
        }
    },
    "have": {
        "V": {
            "tab": "v83"
        }
    },
    "hay": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hazard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "head": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "heading": {
        "N": {
            "tab": ["n1"]
        }
    },
    "headline": {
        "N": {
            "tab": ["n1"]
        }
    },
    "headmaster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "headquarters": {
        "N": {
            "tab": ["n6"]
        }
    },
    "heal": {
        "V": {
            "tab": "v1"
        }
    },
    "health": {
        "N": {
            "tab": ["n5"]
        }
    },
    "healthy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "heap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hear": {
        "V": {
            "tab": "v16"
        }
    },
    "hearing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "heart": {
        "N": {
            "tab": ["n1"]
        }
    },
    "heat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "heating": {
        "N": {
            "tab": ["n5"]
        }
    },
    "heaven": {
        "N": {
            "tab": ["n1"]
        }
    },
    "heavily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "heavy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "hectare": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hedge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "heel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "height": {
        "N": {
            "tab": ["n1"]
        }
    },
    "heir": {
        "N": {
            "g": "m",
            "hAn": 1,
            "tab": ["n85"]
        }
    },
    "helicopter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hell": {
        "N": {
            "tab": ["n1"]
        }
    },
    "helmet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "help": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "helpful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "helpless": {
        "A": {
            "tab": ["a1"]
        }
    },
    "hemisphere": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hence": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "herb": {
        "N": {
            "hAn": 1,
            "tab": ["n1"]
        }
    },
    "herd": {
        "N": {
            "tab": ["n1"]
        }
    },
    "here": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "heritage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hero": {
        "N": {
            "g": "m",
            "tab": ["n86"]
        }
    },
    "heroin": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hesitate": {
        "V": {
            "tab": "v3"
        }
    },
    "hide": {
        "V": {
            "tab": "v146"
        }
    },
    "hierarchy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "high": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "highlight": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "highly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "highway": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hill": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hint": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "hip": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hire": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "historian": {
        "N": {
            "tab": ["n1"]
        }
    },
    "historic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "historical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "historically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "history": {
        "N": {
            "tab": ["n3"]
        }
    },
    "hit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v17"
        }
    },
    "hitherto": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "hobby": {
        "N": {
            "tab": ["n3"]
        }
    },
    "hold": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v34"
        }
    },
    "holder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "holding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hole": {
        "N": {
            "tab": ["n1"]
        }
    },
    "holiday": {
        "N": {
            "tab": ["n1"]
        }
    },
    "holly": {
        "N": {
            "tab": ["n5"]
        }
    },
    "holy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "home": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "homeless": {
        "A": {
            "tab": ["a1"]
        }
    },
    "homework": {
        "N": {
            "tab": ["n5"]
        }
    },
    "homosexual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "honest": {
        "A": {
            "hAn": 1,
            "tab": ["a1"]
        }
    },
    "honestly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "honey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "honour": {
        "N": {
            "hAn": 1,
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "honourable": {
        "A": {
            "hAn": 1,
            "tab": ["a1"]
        }
    },
    "hook": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "hope": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "hopefully": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "horizon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "horizontal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "horn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "horrible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "horror": {
        "N": {
            "tab": ["n1"]
        }
    },
    "horse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hospital": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hospitality": {
        "N": {
            "tab": ["n5"]
        }
    },
    "host": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "hostage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hostile": {
        "A": {
            "tab": ["a1"]
        }
    },
    "hostility": {
        "N": {
            "tab": ["n3"]
        }
    },
    "hot": {
        "A": {
            "tab": ["a11"]
        }
    },
    "hotel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hour": {
        "N": {
            "hAn": 1,
            "tab": ["n1"]
        }
    },
    "house": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "household": {
        "N": {
            "tab": ["n1"]
        }
    },
    "housewife": {
        "N": {
            "tab": ["n10"]
        }
    },
    "housing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hover": {
        "V": {
            "tab": "v1"
        }
    },
    "how":{"Adv":{"tab":["b1"]}},
    "however": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "hug": {
        "V": {
            "tab": "v7"
        }
    },
    "huge": {
        "A": {
            "tab": ["a1"]
        }
    },
    "human": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "humanity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "humble": {
        "A": {
            "tab": ["a2"]
        }
    },
    "humour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hunger": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hungry": {
        "A": {
            "tab": ["a4"]
        }
    },
    "hunt": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "hunter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hunting": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hurry": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "hurt": {
        "V": {
            "tab": "v18"
        }
    },
    "husband": {
        "N": {
            "g": "m",
            "tab": ["n85"]
        }
    },
    "hut": {
        "N": {
            "tab": ["n1"]
        }
    },
    "hydrogen": {
        "N": {
            "tab": ["n5"]
        }
    },
    "hypothesis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "I": {
        "Pro": {
            "tab": ["pn1"]
        }
    },
    "ice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "idea": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ideal": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "ideally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "identical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "identification": {
        "N": {
            "tab": ["n5"]
        }
    },
    "identify": {
        "V": {
            "tab": "v4"
        }
    },
    "identity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "ideological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ideology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "ignorance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ignore": {
        "V": {
            "tab": "v3"
        }
    },
    "ill": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "illegal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "illness": {
        "N": {
            "tab": ["n2"]
        }
    },
    "illuminate": {
        "V": {
            "tab": "v3"
        }
    },
    "illusion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "illustrate": {
        "V": {
            "tab": "v3"
        }
    },
    "illustration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "image": {
        "N": {
            "tab": ["n1"]
        }
    },
    "imagination": {
        "N": {
            "tab": ["n1"]
        }
    },
    "imaginative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "imagine": {
        "V": {
            "tab": "v3"
        }
    },
    "immediate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "immediately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "immense": {
        "A": {
            "tab": ["a1"]
        }
    },
    "immigrant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "immigration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "imminent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "immune": {
        "A": {
            "tab": ["a1"]
        }
    },
    "impact": {
        "N": {
            "tab": ["n1"]
        }
    },
    "imperial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "implement": {
        "V": {
            "tab": "v1"
        }
    },
    "implementation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "implication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "implicit": {
        "A": {
            "tab": ["a1"]
        }
    },
    "imply": {
        "V": {
            "tab": "v4"
        }
    },
    "import": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "importance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "important": {
        "A": {
            "tab": ["a1"]
        }
    },
    "importantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "impose": {
        "V": {
            "tab": "v3"
        }
    },
    "impossible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "impress": {
        "V": {
            "tab": "v2"
        }
    },
    "impression": {
        "N": {
            "tab": ["n1"]
        }
    },
    "impressive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "imprison": {
        "V": {
            "tab": "v1"
        }
    },
    "imprisonment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "improve": {
        "V": {
            "tab": "v3"
        }
    },
    "improvement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "impulse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "in": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "inability": {
        "N": {
            "tab": ["n5"]
        }
    },
    "inadequate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inappropriate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "incapable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "incentive": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "incidence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "incident": {
        "N": {
            "tab": ["n1"]
        }
    },
    "incidentally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "include": {
        "V": {
            "tab": "v3"
        }
    },
    "inclusion": {
        "N": {
            "tab": ["n5"]
        }
    },
    "income": {
        "N": {
            "tab": ["n1"]
        }
    },
    "incorporate": {
        "V": {
            "tab": "v3"
        }
    },
    "increase": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "increasingly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "incredible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "incredibly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "incur": {
        "V": {
            "tab": "v13"
        }
    },
    "indeed": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "independence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "independent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "independently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "index": {
        "N": {
            "tab": ["n2"]
        }
    },
    "indicate": {
        "V": {
            "tab": "v3"
        }
    },
    "indication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "indicator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "indigenous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "indirect": {
        "A": {
            "tab": ["a1"]
        }
    },
    "indirectly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "individual": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "individually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "indoor": {
        "A": {
            "tab": ["a1"]
        }
    },
    "induce": {
        "V": {
            "tab": "v3"
        }
    },
    "indulge": {
        "V": {
            "tab": "v3"
        }
    },
    "industrial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "industry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "inequality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "inevitable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inevitably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "infant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "infect": {
        "V": {
            "tab": "v1"
        }
    },
    "infection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "infinite": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inflation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "inflict": {
        "V": {
            "tab": "v1"
        }
    },
    "influence": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "influential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inform": {
        "V": {
            "tab": "v1"
        }
    },
    "informal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "information": {
        "N": {
            "tab": ["n5"]
        }
    },
    "infrastructure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ingredient": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inhabitant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inherent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inherit": {
        "V": {
            "tab": "v1"
        }
    },
    "inheritance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inhibit": {
        "V": {
            "tab": "v1"
        }
    },
    "inhibition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "initial": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "initially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "initiate": {
        "V": {
            "tab": "v3"
        }
    },
    "initiative": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inject": {
        "V": {
            "tab": "v1"
        }
    },
    "injection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "injunction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "injure": {
        "V": {
            "tab": "v3"
        }
    },
    "injured": {
        "A": {
            "tab": ["a1"]
        }
    },
    "injury": {
        "N": {
            "tab": ["n3"]
        }
    },
    "inland": {
        "A": {
            "tab": ["a1"]
        }
    },
    "inn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inner": {
        "A": {
            "tab": ["a1"]
        }
    },
    "innocence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "innocent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "innovation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "innovative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "input": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inquest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inquiry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "insect": {
        "N": {
            "tab": ["n1"]
        }
    },
    "insert": {
        "V": {
            "tab": "v1"
        }
    },
    "inside": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "insider": {
        "N": {
            "tab": ["n1"]
        }
    },
    "insight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "insist": {
        "V": {
            "tab": "v1"
        }
    },
    "insistence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "inspect": {
        "V": {
            "tab": "v1"
        }
    },
    "inspection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inspector": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inspiration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "inspire": {
        "V": {
            "tab": "v3"
        }
    },
    "instal": {
        "V": {
            "tab": "v9"
        }
    },
    "install": {
        "V": {
            "tab": "v1"
        }
    },
    "installation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "instance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "instant": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "instantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "instead": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "instinct": {
        "N": {
            "tab": ["n1"]
        }
    },
    "institute": {
        "N": {
            "tab": ["n1"]
        }
    },
    "institution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "institutional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "instruct": {
        "V": {
            "tab": "v1"
        }
    },
    "instruction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "instructor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "instrument": {
        "N": {
            "tab": ["n1"]
        }
    },
    "instrumental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "insufficient": {
        "A": {
            "tab": ["a1"]
        }
    },
    "insurance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "insure": {
        "V": {
            "tab": "v3"
        }
    },
    "intact": {
        "A": {
            "tab": ["a1"]
        }
    },
    "intake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "integral": {
        "A": {
            "tab": ["a1"]
        }
    },
    "integrate": {
        "V": {
            "tab": "v3"
        }
    },
    "integration": {
        "N": {
            "tab": ["n5"]
        }
    },
    "integrity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "intellectual": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "intelligence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "intelligent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "intend": {
        "V": {
            "tab": "v1"
        }
    },
    "intense": {
        "A": {
            "tab": ["a1"]
        }
    },
    "intensify": {
        "V": {
            "tab": "v4"
        }
    },
    "intensity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "intensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "intent": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "intention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "interaction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "interactive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "intercourse": {
        "N": {
            "tab": ["n5"]
        }
    },
    "interest": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "interested": {
        "A": {
            "tab": ["a1"]
        }
    },
    "interesting": {
        "A": {
            "tab": ["a1"]
        }
    },
    "interface": {
        "N": {
            "tab": ["n1"]
        }
    },
    "interfere": {
        "V": {
            "tab": "v3"
        }
    },
    "interference": {
        "N": {
            "tab": ["n5"]
        }
    },
    "interior": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "intermediate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "internal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "international": {
        "A": {
            "tab": ["a1"]
        }
    },
    "interpret": {
        "V": {
            "tab": "v1"
        }
    },
    "interpretation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "interrupt": {
        "V": {
            "tab": "v1"
        }
    },
    "interval": {
        "N": {
            "tab": ["n1"]
        }
    },
    "intervene": {
        "V": {
            "tab": "v3"
        }
    },
    "intervention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "interview": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "intimate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "into": {
        "P": {
            "tab": ["pp"]
        }
    },
    "introduce": {
        "V": {
            "tab": "v3"
        }
    },
    "introduction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "invade": {
        "V": {
            "tab": "v3"
        }
    },
    "invaluable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "invariably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "invasion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "invent": {
        "V": {
            "tab": "v1"
        }
    },
    "invention": {
        "N": {
            "tab": ["n1"]
        }
    },
    "invest": {
        "V": {
            "tab": "v1"
        }
    },
    "investigate": {
        "V": {
            "tab": "v3"
        }
    },
    "investigation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "investigator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "investment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "investor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "invisible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "invitation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "invite": {
        "V": {
            "tab": "v3"
        }
    },
    "invoke": {
        "V": {
            "tab": "v3"
        }
    },
    "involve": {
        "V": {
            "tab": "v3"
        }
    },
    "involved": {
        "A": {
            "tab": ["a1"]
        }
    },
    "involvement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "iron": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ironically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "irony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "irrelevant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "irrespective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "island": {
        "N": {
            "tab": ["n1"]
        }
    },
    "isolation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "issue": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "item": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ivory": {
        "N": {
            "tab": ["n5"]
        }
    },
    "jacket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jail": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "jam": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jaw": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jazz": {
        "N": {
            "tab": ["n5"]
        }
    },
    "jealous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "jeans": {
        "N": {
            "tab": ["n6"]
        }
    },
    "jerk": {
        "V": {
            "tab": "v1"
        }
    },
    "jet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jewel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jewellery": {
        "N": {
            "tab": ["n5"]
        }
    },
    "job": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jockey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "join": {
        "V": {
            "tab": "v1"
        }
    },
    "joint": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "jointly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "joke": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "journal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "journalist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "journey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "joy": {
        "N": {
            "tab": ["n1"]
        }
    },
    "judge": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "judgement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "judgment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "judicial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "juice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jump": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "junction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jungle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "junior": {
        "A": {
            "tab": ["a1"]
        }
    },
    "jurisdiction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "jury": {
        "N": {
            "tab": ["n3"]
        }
    },
    "just": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "justice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "justification": {
        "N": {
            "tab": ["n1"]
        }
    },
    "justify": {
        "V": {
            "tab": "v4"
        }
    },
    "keen": {
        "A": {
            "tab": ["a3"]
        }
    },
    "keep": {
        "V": {
            "tab": "v29"
        }
    },
    "keeper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kettle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "key": {
        "N": {
            "tab": ["n1"]
        }
    },
    "keyboard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kick": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "kid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kidney": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kill": {
        "V": {
            "tab": "v1"
        }
    },
    "killer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "killing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kilometre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kind": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "kindly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "king": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kingdom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kiss": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "kit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kitchen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kite": {
        "N": {
            "tab": ["n1"]
        }
    },
    "knee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "kneel": {
        "V": {
            "tab": "v130"
        }
    },
    "knife": {
        "N": {
            "tab": ["n10"]
        }
    },
    "knight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "knit": {
        "V": {
            "tab": "v38"
        }
    },
    "knitting": {
        "N": {
            "tab": ["n5"]
        }
    },
    "knock": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "knot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "know": {
        "V": {
            "tab": "v27"
        }
    },
    "knowledge": {
        "N": {
            "tab": ["n5"]
        }
    },
    "lab": {
        "N": {
            "tab": ["n1"]
        }
    },
    "label": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "laboratory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "labour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "labourer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lack": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "lad": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ladder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lady": {
        "N": {
            "tab": ["n3"]
        }
    },
    "lake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lamb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lamp": {
        "N": {
            "tab": ["n1"]
        }
    },
    "land": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "landing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "landlord": {
        "N": {
            "tab": ["n1"]
        }
    },
    "landowner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "landscape": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lane": {
        "N": {
            "tab": ["n1"]
        }
    },
    "language": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "large": {
        "A": {
            "tab": ["a2"]
        }
    },
    "largely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "large-scale": {
        "A": {
            "tab": ["a1"]
        }
    },
    "laser": {
        "N": {
            "tab": ["n1"]
        }
    },
    "last": {
        "V": {
            "tab": "v1"
        }
    },
    "late": {
        "A": {
            "tab": ["a2"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "lately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "laugh": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "laughter": {
        "N": {
            "tab": ["n5"]
        }
    },
    "launch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "law": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lawn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lawyer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lay": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v19"
        }
    },
    "layer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lazy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "lead": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v77"
        }
    },
    "leader": {
        "N": {
            "tab": ["n1"]
        }
    },
    "leadership": {
        "N": {
            "tab": ["n5"]
        }
    },
    "leading": {
        "A": {
            "tab": ["a1"]
        }
    },
    "leaf": {
        "N": {
            "tab": ["n9"]
        }
    },
    "leaflet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "league": {
        "N": {
            "tab": ["n1"]
        }
    },
    "leak": {
        "V": {
            "tab": "v1"
        }
    },
    "lean": {
        "V": {
            "tab": "v26"
        }
    },
    "leap": {
        "V": {
            "tab": "v26"
        }
    },
    "learn": {
        "V": {
            "tab": "v26"
        }
    },
    "learner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "learning": {
        "N": {
            "tab": ["n5"]
        }
    },
    "lease": {
        "N": {
            "tab": ["n1"]
        }
    },
    "leather": {
        "N": {
            "tab": ["n1"]
        }
    },
    "leave": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v155"
        }
    },
    "lecture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lecturer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "left": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "leg": {
        "N": {
            "tab": ["n1"]
        }
    },
    "legacy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "legal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "legally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "legend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "legislation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "legislative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "legislature": {
        "N": {
            "tab": ["n1"]
        }
    },
    "legitimate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "leisure": {
        "N": {
            "tab": ["n5"]
        }
    },
    "lemon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lend": {
        "V": {
            "tab": "v23"
        }
    },
    "lender": {
        "N": {
            "tab": ["n1"]
        }
    },
    "length": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lengthy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "less":{"Adv":{"tab":["b1"]}},
    "lesser": {
        "A": {
            "tab": ["a1"]
        }
    },
    "lesson": {
        "N": {
            "tab": ["n1"]
        }
    },
    "let": {
        "V": {
            "tab": "v17"
        }
    },
    "letter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "level": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "lexical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "liability": {
        "N": {
            "tab": ["n3"]
        }
    },
    "liable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "liaison": {
        "N": {
            "tab": ["n1"]
        }
    },
    "liberal": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "liberation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "liberty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "librarian": {
        "N": {
            "tab": ["n1"]
        }
    },
    "library": {
        "N": {
            "tab": ["n3"]
        }
    },
    "licence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "license": {
        "V": {
            "tab": "v3"
        }
    },
    "lick": {
        "V": {
            "tab": "v1"
        }
    },
    "lid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lie": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v111"
        }
    },
    "life": {
        "N": {
            "tab": ["n10"]
        }
    },
    "lifestyle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lifetime": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lift": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "light": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v68"
        }
    },
    "lightly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "like": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "likelihood": {
        "N": {
            "tab": ["n5"]
        }
    },
    "likely": {
        "A": {
            "tab": ["a4"]
        }
    },
    "likewise": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "limb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "limestone": {
        "N": {
            "tab": ["n5"]
        }
    },
    "limit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "limitation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "line": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "linear": {
        "A": {
            "tab": ["a1"]
        }
    },
    "linen": {
        "N": {
            "tab": ["n5"]
        }
    },
    "linger": {
        "V": {
            "tab": "v1"
        }
    },
    "linguistic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "link": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "lion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lip": {
        "N": {
            "tab": ["n1"]
        }
    },
    "liquid": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "list": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "listen": {
        "V": {
            "tab": "v1"
        }
    },
    "listener": {
        "N": {
            "tab": ["n1"]
        }
    },
    "literacy": {
        "N": {
            "tab": ["n5"]
        }
    },
    "literally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "literary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "literature": {
        "N": {
            "tab": ["n5"]
        }
    },
    "litigation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "litre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "little": {
        "A": {
            "tab": ["a2"]
        },
        "Adv": {
            "tab": ["b5"]
        }
    },
    "live": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "lively": {
        "A": {
            "tab": ["a4"]
        }
    },
    "liver": {
        "N": {
            "tab": ["n1"]
        }
    },
    "living": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "load": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "loan": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lobby": {
        "N": {
            "tab": ["n3"]
        }
    },
    "local": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "locality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "locally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "locate": {
        "V": {
            "tab": "v3"
        }
    },
    "location": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lock": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "locomotive": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lodge": {
        "V": {
            "tab": "v3"
        }
    },
    "log": {
        "N": {
            "tab": ["n1"]
        }
    },
    "logic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "logical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "lone": {
        "A": {
            "tab": ["a1"]
        }
    },
    "lonely": {
        "A": {
            "tab": ["a4"]
        }
    },
    "long": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "long-term": {
        "A": {
            "tab": ["a1"]
        }
    },
    "look": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "loose": {
        "A": {
            "tab": ["a2"]
        }
    },
    "lord": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lordship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lorry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "lose": {
        "V": {
            "tab": "v143"
        }
    },
    "loss": {
        "N": {
            "tab": ["n2"]
        }
    },
    "lot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "loud": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "loudly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "lounge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "love": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "lovely": {
        "A": {
            "tab": ["a4"]
        }
    },
    "lover": {
        "N": {
            "tab": ["n1"]
        }
    },
    "low": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "lower": {
        "V": {
            "tab": "v1"
        }
    },
    "loyal": {
        "A": {
            "tab": ["a8"]
        }
    },
    "loyalty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "luck": {
        "N": {
            "tab": ["n5"]
        }
    },
    "lucky": {
        "A": {
            "tab": ["a4"]
        }
    },
    "lump": {
        "N": {
            "tab": ["n1"]
        }
    },
    "lunch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "lung": {
        "N": {
            "tab": ["n1"]
        }
    },
    "luxury": {
        "N": {
            "tab": ["n3"]
        }
    },
    "machine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "machinery": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mad": {
        "A": {
            "tab": ["a6"]
        }
    },
    "magazine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "magic": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "magical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "magistrate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "magnetic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "magnificent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "magnitude": {
        "N": {
            "tab": ["n5"]
        }
    },
    "maid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "main": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mainland": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mainly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "mainstream": {
        "N": {
            "tab": ["n5"]
        }
    },
    "maintain": {
        "V": {
            "tab": "v1"
        }
    },
    "maintenance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "majesty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "major": {
        "A": {
            "tab": ["a1"]
        }
    },
    "majority": {
        "N": {
            "tab": ["n3"]
        }
    },
    "make": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v61"
        }
    },
    "maker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "make-up": {
        "N": {
            "tab": ["n1"]
        }
    },
    "making": {
        "N": {
            "tab": ["n1"]
        }
    },
    "male": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "mammal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "man": {
        "N": {
            "g": "m",
            "tab": ["n89"]
        }
    },
    "manage": {
        "V": {
            "tab": "v3"
        }
    },
    "management": {
        "N": {
            "tab": ["n1"]
        }
    },
    "manager": {
        "N": {
            "tab": ["n1"]
        }
    },
    "managerial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mandatory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "manifest": {
        "V": {
            "tab": "v1"
        }
    },
    "manifestation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "manipulate": {
        "V": {
            "tab": "v3"
        }
    },
    "manipulation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mankind": {
        "N": {
            "tab": ["n5"]
        }
    },
    "manner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "manor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "manpower": {
        "N": {
            "tab": ["n5"]
        }
    },
    "manual": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "manufacture": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "manufacturer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "manuscript": {
        "N": {
            "tab": ["n1"]
        }
    },
    "many":{"Adv":{ "tab": ["b1"] }},
    "map": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "marathon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "marble": {
        "N": {
            "tab": ["n1"]
        }
    },
    "march": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "margin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "marginal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "marine": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mark": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "marked": {
        "A": {
            "tab": ["a1"]
        }
    },
    "marker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "market": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "marketing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "marriage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "married": {
        "A": {
            "tab": ["a1"]
        }
    },
    "marry": {
        "V": {
            "tab": "v4"
        }
    },
    "marsh": {
        "N": {
            "tab": ["n2"]
        }
    },
    "marvellous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mask": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mass": {
        "N": {
            "tab": ["n2"]
        }
    },
    "massive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "master": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "match": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "mate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "material": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "mathematical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mathematics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "matrix": {
        "N": {
            "tab": ["n2"]
        }
    },
    "matter": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "mature": {
        "A": {
            "tab": ["a1"]
        }
    },
    "maturity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "maximum": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "may": {
        "V": {
            "tab": "v153"
        }
    },
    "maybe": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "mayor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "me": {
        "Pro": {
            "tab": ["pn2"]
        }
    },
    "meadow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "meal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mean": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v55"
        }
    },
    "meaning": {
        "N": {
            "tab": ["n1"]
        }
    },
    "meaningful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "meantime": {
        "N": {
            "tab": ["n5"]
        }
    },
    "meanwhile": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "measure": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "measurement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "meat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mechanical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mechanism": {
        "N": {
            "tab": ["n1"]
        }
    },
    "medal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "medical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "medicine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "medieval": {
        "A": {
            "tab": ["a1"]
        }
    },
    "medium": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "meet": {
        "V": {
            "tab": "v123"
        }
    },
    "meeting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "melt": {
        "V": {
            "tab": "v127"
        }
    },
    "member": {
        "N": {
            "tab": ["n1"]
        }
    },
    "membership": {
        "N": {
            "tab": ["n5"]
        }
    },
    "membrane": {
        "N": {
            "tab": ["n1"]
        }
    },
    "memorable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "memorandum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "memorial": {
        "N": {
            "tab": ["n1"]
        }
    },
    "memory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "mental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mentally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "mention": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "menu": {
        "N": {
            "tab": ["n1"]
        }
    },
    "merchant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mercy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "mere": {
        "A": {
            "tab": ["a18"]
        }
    },
    "merely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "merge": {
        "V": {
            "tab": "v3"
        }
    },
    "merger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "merit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mess": {
        "N": {
            "tab": ["n2"]
        }
    },
    "message": {
        "N": {
            "tab": ["n1"]
        }
    },
    "metal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "metaphor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "method": {
        "N": {
            "tab": ["n1"]
        }
    },
    "methodology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "metre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "metropolitan": {
        "A": {
            "tab": ["a1"]
        }
    },
    "microphone": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "middle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "middle-class": {
        "A": {
            "tab": ["a1"]
        }
    },
    "midnight": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mighty": {
        "A": {
            "tab": ["a4"]
        }
    },
    "migration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mild": {
        "A": {
            "tab": ["a3"]
        }
    },
    "mile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "military": {
        "A": {
            "tab": ["a1"]
        }
    },
    "milk": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mill": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mind": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "mine": {
        "N": {
            "tab": ["n1"]
        },
        "Pro": {
            "tab": ["pn3"]
        }
    },
    "miner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mineral": {
        "N": {
            "tab": ["n1"]
        }
    },
    "minimal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "minimum": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "mining": {
        "N": {
            "tab": ["n5"]
        }
    },
    "minister": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ministerial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ministry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "minor": {
        "A": {
            "tab": ["a1"]
        }
    },
    "minority": {
        "N": {
            "tab": ["n3"]
        }
    },
    "minus": {
        "P": {
            "tab": ["pp"]
        }
    },
    "minute": {
        "A": {
            "tab": ["a2"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "miracle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mirror": {
        "N": {
            "tab": ["n1"]
        }
    },
    "miserable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "misery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "miss": {
        "V": {
            "tab": "v2"
        }
    },
    "missile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "missing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mistake": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v20"
        }
    },
    "mistress": {
        "N": {
            "g": "f",
            "tab": ["n88"]
        }
    },
    "mix": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "mixed": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mixture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "moan": {
        "V": {
            "tab": "v1"
        }
    },
    "mobile": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mobility": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mode": {
        "N": {
            "tab": ["n1"]
        }
    },
    "model": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "moderate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "modern": {
        "A": {
            "tab": ["a1"]
        }
    },
    "modest": {
        "A": {
            "tab": ["a1"]
        }
    },
    "modification": {
        "N": {
            "tab": ["n1"]
        }
    },
    "modify": {
        "V": {
            "tab": "v4"
        }
    },
    "module": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mole": {
        "N": {
            "tab": ["n1"]
        }
    },
    "molecular": {
        "A": {
            "tab": ["a1"]
        }
    },
    "molecule": {
        "N": {
            "tab": ["n1"]
        }
    },
    "moment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "momentum": {
        "N": {
            "tab": ["n5"]
        }
    },
    "monarch": {
        "N": {
            "tab": ["n1"]
        }
    },
    "monarchy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "monastery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "monetary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "money": {
        "N": {
            "tab": ["n50"]
        }
    },
    "monitor": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "monk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "monkey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "monopoly": {
        "N": {
            "tab": ["n3"]
        }
    },
    "monster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "month": {
        "N": {
            "tab": ["n1"]
        }
    },
    "monthly": {
        "A": {
            "tab": ["a1"]
        }
    },
    "monument": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mood": {
        "N": {
            "tab": ["n1"]
        }
    },
    "moon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "moor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "moral": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "morale": {
        "N": {
            "tab": ["n5"]
        }
    },
    "morality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "more":{"Adv":{ "tab": ["b1"] }},
    "moreover": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "morning": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mortality": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mortgage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mosaic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "most":{"Adv":{"tab":["b1"]}},
    "mostly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "mother": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "motif": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motivate": {
        "V": {
            "tab": "v3"
        }
    },
    "motivation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motive": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motorist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "motorway": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mould": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mount": {
        "V": {
            "tab": "v1"
        }
    },
    "mountain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mouse": {
        "N": {
            "tab": ["n16"]
        }
    },
    "mouth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "move": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "movement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "movie": {
        "N": {
            "tab": ["n1"]
        }
    },
    "much": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "mud": {
        "N": {
            "tab": ["n5"]
        }
    },
    "mug": {
        "N": {
            "tab": ["n1"]
        }
    },
    "multiple": {
        "A": {
            "tab": ["a1"]
        }
    },
    "multiply": {
        "V": {
            "tab": "v4"
        }
    },
    "municipal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "murder": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "murderer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "murmur": {
        "V": {
            "tab": "v1"
        }
    },
    "muscle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "museum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mushroom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "music": {
        "N": {
            "tab": ["n5"]
        }
    },
    "musical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "musician": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mutation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "mutter": {
        "V": {
            "tab": "v1"
        }
    },
    "mutual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "my": {
        "D": {
            "tab": ["d2"]
        }
    },
    "myself": {
        "Pro": {
            "tab": ["pn4"]
        }
    },
    "mysterious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "mystery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "myth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "naked": {
        "A": {
            "tab": ["a1"]
        }
    },
    "name": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "namely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "narrative": {
        "N": {
            "tab": ["n1"]
        }
    },
    "narrow": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "nasty": {
        "A": {
            "tab": ["a4"]
        }
    },
    "nation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "national": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nationalism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "nationalist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nationality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "nationally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "native": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "natural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "naturally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nature": {
        "N": {
            "tab": ["n1"]
        }
    },
    "naval": {
        "A": {
            "tab": ["a1"]
        }
    },
    "navy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "near": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "nearby": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nearly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "neat": {
        "A": {
            "tab": ["a3"]
        }
    },
    "neatly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "necessarily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "necessary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "necessity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "neck": {
        "N": {
            "tab": ["n1"]
        }
    },
    "need": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "needle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "negative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "neglect": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "negligence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "negotiate": {
        "V": {
            "tab": "v3"
        }
    },
    "negotiation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "neighbour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "neighbourhood": {
        "N": {
            "tab": ["n1"]
        }
    },
    "neither": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nephew": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nerve": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nervous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "net": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "network": {
        "N": {
            "tab": ["n1"]
        }
    },
    "neutral": {
        "A": {
            "tab": ["a1"]
        }
    },
    "never": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nevertheless": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "new": {
        "A": {
            "tab": ["a3"]
        }
    },
    "newcomer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "newly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "news": {
        "N": {
            "tab": ["n5"]
        }
    },
    "newspaper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "next": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nice": {
        "A": {
            "tab": ["a2"]
        }
    },
    "nicely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "night": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nightmare": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nitrogen": {
        "N": {
            "tab": ["n5"]
        }
    },
    "no": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "noble": {
        "A": {
            "tab": ["a2"]
        }
    },
    "nobody": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "nod": {
        "V": {
            "tab": "v6"
        }
    },
    "node": {
        "N": {
            "tab": ["n1"]
        }
    },
    "noise": {
        "N": {
            "tab": ["n1"]
        }
    },
    "noisy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "nominal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nominate": {
        "V": {
            "tab": "v3"
        }
    },
    "nomination": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nonetheless": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nonsense": {
        "N": {
            "tab": ["n1"]
        }
    },
    "no-one": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "norm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "normal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "normally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "north": {
        "N": {
            "tab": ["n5"]
        }
    },
    "northern": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nose": {
        "N": {
            "tab": ["n1"]
        }
    },
    "not": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "notable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "notably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "note": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "notebook": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nothing": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "notice": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "noticeable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "notify": {
        "V": {
            "tab": "v4"
        }
    },
    "notion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "notorious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "noun": {
        "N": {
            "tab": ["n1"]
        }
    },
    "novel": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "novelist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "now": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nowadays": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nowhere": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "nuclear": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nucleus": {
        "N": {
            "tab": ["n12"]
        }
    },
    "nuisance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "number": {
        "N": {
            "tab": ["n1"]
        }
    },
    "numerous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "nun": {
        "N": {
            "tab": ["n1"]
        }
    },
    "nurse": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "nursery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "nut": {
        "N": {
            "tab": ["n1"]
        }
    },
    "oak": {
        "N": {
            "tab": ["n1"]
        }
    },
    "obey": {
        "V": {
            "tab": "v1"
        }
    },
    "object": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "objection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "objective": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "obligation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "oblige": {
        "V": {
            "tab": "v3"
        }
    },
    "obscure": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "observation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "observe": {
        "V": {
            "tab": "v3"
        }
    },
    "observer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "obstacle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "obtain": {
        "V": {
            "tab": "v1"
        }
    },
    "obvious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "obviously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "occasion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "occasional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "occasionally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "occupation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "occupational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "occupy": {
        "V": {
            "tab": "v4"
        }
    },
    "occur": {
        "V": {
            "tab": "v13"
        }
    },
    "occurrence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ocean": {
        "N": {
            "tab": ["n1"]
        }
    },
    "odd": {
        "A": {
            "tab": ["a3"]
        }
    },
    "odds": {
        "N": {
            "tab": ["n6"]
        }
    },
    "odour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "of": {
        "P": {
            "tab": ["pp"]
        }
    },
    "off": {
        "Adv":{"tab":["b1"]},
        "P": {
            "tab": ["pp"]
        }
    },
    "offence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "offend": {
        "V": {
            "tab": "v1"
        }
    },
    "offender": {
        "N": {
            "tab": ["n1"]
        }
    },
    "offensive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "offer": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "offering": {
        "N": {
            "tab": ["n1"]
        }
    },
    "office": {
        "N": {
            "tab": ["n1"]
        }
    },
    "officer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "official": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "officially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "offset": {
        "V": {
            "tab": "v1"
        }
    },
    "offspring": {
        "N": {
            "tab": ["n4"]
        }
    },
    "often": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "oil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "okay": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "old": {
        "A": {
            "tab": ["a16"]
        }
    },
    "old-fashioned": {
        "A": {
            "tab": ["a1"]
        }
    },
    "omission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "omit": {
        "V": {
            "tab": "v14"
        }
    },
    "on": {
        "Adv":{"tab":["b1"]},
        "P": {
            "tab": ["pp"]
        }
    },
    "once": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "one":{"Pro":{"tab":["pn5"]}},
    "onion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "only": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "onto": {
        "P": {
            "tab": ["pp"]
        }
    },
    "onwards": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "open": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "opening": {
        "N": {
            "tab": ["n1"]
        }
    },
    "openly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "opera": {
        "N": {
            "tab": ["n1"]
        }
    },
    "operate": {
        "V": {
            "tab": "v3"
        }
    },
    "operation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "operational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "operator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "opinion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "opponent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "opportunity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "oppose": {
        "V": {
            "tab": "v3"
        }
    },
    "opposite": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "opposition": {
        "N": {
            "tab": ["n5"]
        }
    },
    "opt": {
        "V": {
            "tab": "v1"
        }
    },
    "optical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "optimism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "optimistic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "option": {
        "N": {
            "tab": ["n1"]
        }
    },
    "optional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "oral": {
        "A": {
            "tab": ["a1"]
        }
    },
    "orange": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "orbit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "orchestra": {
        "N": {
            "tab": ["n1"]
        }
    },
    "order": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "ordinary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "organ": {
        "N": {
            "tab": ["n1"]
        }
    },
    "organic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "organism": {
        "N": {
            "tab": ["n1"]
        }
    },
    "organization": {
        "N": {
            "tab": ["n1"]
        }
    },
    "organizational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "organize": {
        "V": {
            "tab": "v3"
        }
    },
    "orientation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "origin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "original": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "originally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "originate": {
        "V": {
            "tab": "v3"
        }
    },
    "orthodox": {
        "A": {
            "tab": ["a1"]
        }
    },
    "otherwise": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "out": {
        "Adv": {
            "tab": ["b1"]
        },
        "A":{"tab":["a1"]}
    },
    "outbreak": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outcome": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outdoor": {
        "A": {
            "tab": ["a1"]
        }
    },
    "outer": {
        "A": {
            "tab": ["a1"]
        }
    },
    "outfit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outlet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outline": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "outlook": {
        "N": {
            "tab": ["n1"]
        }
    },
    "output": {
        "N": {
            "tab": ["n5"]
        }
    },
    "outset": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outside": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "outsider": {
        "N": {
            "tab": ["n1"]
        }
    },
    "outstanding": {
        "A": {
            "tab": ["a1"]
        }
    },
    "oven": {
        "N": {
            "tab": ["n1"]
        }
    },
    "over": {
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "overall": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "overcome": {
        "V": {
            "tab": "v41"
        }
    },
    "overlook": {
        "V": {
            "tab": "v1"
        }
    },
    "overnight": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "overseas": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "overtake": {
        "V": {
            "tab": "v20"
        }
    },
    "overview": {
        "N": {
            "tab": ["n1"]
        }
    },
    "overwhelm": {
        "V": {
            "tab": "v1"
        }
    },
    "owe": {
        "V": {
            "tab": "v3"
        }
    },
    "owl": {
        "N": {
            "tab": ["n1"]
        }
    },
    "own": {
        "V": {
            "tab": "v1"
        }
    },
    "owner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ownership": {
        "N": {
            "tab": ["n5"]
        }
    },
    "oxygen": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ozone": {
        "N": {
            "tab": ["n5"]
        }
    },
    "pace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pack": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "package": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "packet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pad": {
        "N": {
            "tab": ["n1"]
        }
    },
    "page": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pain": {
        "N": {
            "tab": ["n1"]
        }
    },
    "painful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "paint": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "painter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "painting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pair": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "palace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pale": {
        "A": {
            "tab": ["a2"]
        }
    },
    "palm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pan": {
        "N": {
            "tab": ["n1"]
        }
    },
    "panel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "panic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "papal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "paper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "par": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "paragraph": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parallel": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "parameter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parcel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pardon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parental": {
        "A": {
            "tab": ["a1"]
        }
    },
    "parish": {
        "N": {
            "tab": ["n2"]
        }
    },
    "park": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "parking": {
        "N": {
            "tab": ["n5"]
        }
    },
    "parliament": {
        "N": {
            "tab": ["n1"]
        }
    },
    "parliamentary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "part": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "partial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "partially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "participant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "participate": {
        "V": {
            "tab": "v3"
        }
    },
    "participation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "particle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "particular": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "particularly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "partly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "partner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "partnership": {
        "N": {
            "tab": ["n1"]
        }
    },
    "part-time": {
        "A": {
            "tab": ["a1"]
        }
    },
    "party": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pass": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v87"
        }
    },
    "passage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "passenger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "passion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "passionate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "passive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "passport": {
        "N": {
            "tab": ["n1"]
        }
    },
    "past": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "pasture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pat": {
        "V": {
            "tab": "v14"
        }
    },
    "patch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "patent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "path": {
        "N": {
            "tab": ["n1"]
        }
    },
    "patience": {
        "N": {
            "tab": ["n5"]
        }
    },
    "patient": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "patrol": {
        "N": {
            "tab": ["n1"]
        }
    },
    "patron": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pattern": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pause": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "pavement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pay": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v19"
        }
    },
    "payable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "payment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "peace": {
        "N": {
            "tab": ["n5"]
        }
    },
    "peaceful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "peak": {
        "N": {
            "tab": ["n1"]
        }
    },
    "peasant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "peculiar": {
        "A": {
            "tab": ["a1"]
        }
    },
    "pedestrian": {
        "N": {
            "tab": ["n1"]
        }
    },
    "peer": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "pen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "penalty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pencil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "penetrate": {
        "V": {
            "tab": "v3"
        }
    },
    "penny": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pension": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pensioner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "people": {
        "N": {
            "tab": ["n6"]
        }
    },
    "pepper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "per": {
        "P": {
            "tab": ["pp"]
        }
    },
    "perceive": {
        "V": {
            "tab": "v3"
        }
    },
    "percentage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "perception": {
        "N": {
            "tab": ["n1"]
        }
    },
    "perfect": {
        "A": {
            "tab": ["a1"]
        }
    },
    "perfectly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "perform": {
        "V": {
            "tab": "v1"
        }
    },
    "performance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "performer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "perhaps": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "period": {
        "N": {
            "tab": ["n1"]
        }
    },
    "permanent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "permanently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "permission": {
        "N": {
            "tab": ["n5"]
        }
    },
    "permit": {
        "V": {
            "tab": "v14"
        }
    },
    "persist": {
        "V": {
            "tab": "v1"
        }
    },
    "persistent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "person": {
        "N": {
            "tab": ["n1"]
        }
    },
    "personal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "personality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "personally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "personnel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "perspective": {
        "N": {
            "tab": ["n1"]
        }
    },
    "persuade": {
        "V": {
            "tab": "v3"
        }
    },
    "pest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "petition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "petrol": {
        "N": {
            "tab": ["n5"]
        }
    },
    "petty": {
        "A": {
            "tab": ["a4"]
        }
    },
    "phase": {
        "N": {
            "tab": ["n1"]
        }
    },
    "phenomenon": {
        "N": {
            "tab": ["n26"]
        }
    },
    "philosopher": {
        "N": {
            "tab": ["n1"]
        }
    },
    "philosophical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "philosophy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "phone": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "photo": {
        "N": {
            "tab": ["n1"]
        }
    },
    "photograph": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "photographer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "photographic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "photography": {
        "N": {
            "tab": ["n5"]
        }
    },
    "phrase": {
        "N": {
            "tab": ["n1"]
        }
    },
    "physical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "physically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "physician": {
        "N": {
            "tab": ["n1"]
        }
    },
    "physics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "piano": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pick": {
        "V": {
            "tab": "v1"
        }
    },
    "picture": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "pie": {
        "N": {
            "tab": ["n1"]
        }
    },
    "piece": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pig": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pigeon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pile": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "pill": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pillar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pillow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pilot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pin": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "pine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pink": {
        "A": {
            "tab": ["a3"]
        }
    },
    "pint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pioneer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pipe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pitch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "pity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "place": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "plain": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "plaintiff": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plan": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v11"
        }
    },
    "plane": {
        "N": {
            "tab": ["n1"]
        }
    },
    "planet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "planner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plant": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "plasma": {
        "N": {
            "tab": ["n5"]
        }
    },
    "plaster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plastic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "platform": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plausible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "play": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "player": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plea": {
        "N": {
            "tab": ["n1"]
        }
    },
    "plead": {
        "V": {
            "tab": "v165"
        }
    },
    "pleasant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "please": {
        "V": {
            "tab": "v3"
        }
    },
    "pleased": {
        "A": {
            "tab": ["a1"]
        }
    },
    "pleasure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pledge": {
        "V": {
            "tab": "v3"
        }
    },
    "plot": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v14"
        }
    },
    "plug": {
        "V": {
            "tab": "v7"
        }
    },
    "plunge": {
        "V": {
            "tab": "v3"
        }
    },
    "plus": {
        "P": {
            "tab": ["pp"]
        }
    },
    "pocket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "poem": {
        "N": {
            "tab": ["n1"]
        }
    },
    "poet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "poetry": {
        "N": {
            "tab": ["n5"]
        }
    },
    "point": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "poison": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "pole": {
        "N": {
            "tab": ["n1"]
        }
    },
    "police": {
        "N": {
            "tab": ["n4"]
        }
    },
    "policeman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "policy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "polish": {
        "V": {
            "tab": "v2"
        }
    },
    "polite": {
        "A": {
            "tab": ["a2"]
        }
    },
    "political": {
        "A": {
            "tab": ["a1"]
        }
    },
    "politically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "politician": {
        "N": {
            "tab": ["n1"]
        }
    },
    "politics": {
        "N": {
            "tab": ["n5"]
        }
    },
    "poll": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pollution": {
        "N": {
            "tab": ["n5"]
        }
    },
    "polytechnic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pond": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pony": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pool": {
        "N": {
            "tab": ["n1"]
        }
    },
    "poor": {
        "A": {
            "tab": ["a3"]
        }
    },
    "poorly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "pop": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "popular": {
        "A": {
            "tab": ["a1"]
        }
    },
    "popularity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "population": {
        "N": {
            "tab": ["n1"]
        }
    },
    "port": {
        "N": {
            "tab": ["n1"]
        }
    },
    "portable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "porter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "portfolio": {
        "N": {
            "tab": ["n1"]
        }
    },
    "portion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "portrait": {
        "N": {
            "tab": ["n1"]
        }
    },
    "portray": {
        "V": {
            "tab": "v1"
        }
    },
    "pose": {
        "V": {
            "tab": "v3"
        }
    },
    "position": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "positive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "positively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "possess": {
        "V": {
            "tab": "v2"
        }
    },
    "possession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "possibility": {
        "N": {
            "tab": ["n3"]
        }
    },
    "possible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "possibly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "post": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "postcard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "poster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "postpone": {
        "V": {
            "tab": "v3"
        }
    },
    "pot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "potato": {
        "N": {
            "tab": ["n2"]
        }
    },
    "potential": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "potentially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "pottery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pound": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pour": {
        "V": {
            "tab": "v1"
        }
    },
    "poverty": {
        "N": {
            "tab": ["n5"]
        }
    },
    "powder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "power": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "powerful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "practical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "practically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "practice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "practise": {
        "V": {
            "tab": "v3"
        }
    },
    "practitioner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "praise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "pray": {
        "V": {
            "tab": "v1"
        }
    },
    "prayer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "preach": {
        "V": {
            "tab": "v2"
        }
    },
    "precaution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "precede": {
        "V": {
            "tab": "v3"
        }
    },
    "precedent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "precious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "precise": {
        "A": {
            "tab": ["a1"]
        }
    },
    "precisely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "precision": {
        "N": {
            "tab": ["n5"]
        }
    },
    "predator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "predecessor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "predict": {
        "V": {
            "tab": "v1"
        }
    },
    "predictable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prediction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "predominantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "prefer": {
        "V": {
            "tab": "v13"
        }
    },
    "preference": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pregnancy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pregnant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prejudice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "preliminary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "premature": {
        "A": {
            "tab": ["a1"]
        }
    },
    "premier": {
        "A": {
            "tab": ["a1"]
        }
    },
    "premise": {
        "N": {
            "tab": ["n1"]
        }
    },
    "premium": {
        "N": {
            "tab": ["n1"]
        }
    },
    "preoccupation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "preparation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prepare": {
        "V": {
            "tab": "v3"
        }
    },
    "prescribe": {
        "V": {
            "tab": "v3"
        }
    },
    "prescription": {
        "N": {
            "tab": ["n1"]
        }
    },
    "presence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "present": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "presentation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "presently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "preservation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "preserve": {
        "V": {
            "tab": "v3"
        }
    },
    "presidency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "president": {
        "N": {
            "tab": ["n1"]
        }
    },
    "presidential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "press": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "pressure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prestige": {
        "N": {
            "tab": ["n5"]
        }
    },
    "presumably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "presume": {
        "V": {
            "tab": "v3"
        }
    },
    "pretend": {
        "V": {
            "tab": "v1"
        }
    },
    "pretty": {
        "A": {
            "tab": ["a4"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "prevail": {
        "V": {
            "tab": "v1"
        }
    },
    "prevalence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "prevent": {
        "V": {
            "tab": "v1"
        }
    },
    "prevention": {
        "N": {
            "tab": ["n5"]
        }
    },
    "previous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "previously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "prey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "price": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "pride": {
        "N": {
            "tab": ["n1"]
        }
    },
    "priest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "primarily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "primary": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n3"]
        }
    },
    "prime": {
        "A": {
            "tab": ["a1"]
        }
    },
    "primitive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prince": {
        "N": {
            "tab": ["n1"]
        }
    },
    "princess": {
        "N": {
            "g": "f",
            "tab": ["n88"]
        }
    },
    "principal": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "principally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "principle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "print": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "printer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "printing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prior": {
        "A": {
            "tab": ["a1"]
        }
    },
    "priority": {
        "N": {
            "tab": ["n3"]
        }
    },
    "prison": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prisoner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "privacy": {
        "N": {
            "tab": ["n5"]
        }
    },
    "private": {
        "A": {
            "tab": ["a1"]
        }
    },
    "privately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "privatization": {
        "N": {
            "tab": ["n5"]
        }
    },
    "privilege": {
        "N": {
            "tab": ["n1"]
        }
    },
    "privileged": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prize": {
        "N": {
            "tab": ["n1"]
        }
    },
    "probability": {
        "N": {
            "tab": ["n3"]
        }
    },
    "probable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "probably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "probe": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "problem": {
        "N": {
            "tab": ["n1"]
        }
    },
    "procedure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "proceed": {
        "V": {
            "tab": "v1"
        }
    },
    "proceeding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "process": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "procession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "proclaim": {
        "V": {
            "tab": "v1"
        }
    },
    "produce": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "producer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "product": {
        "N": {
            "tab": ["n1"]
        }
    },
    "production": {
        "N": {
            "tab": ["n1"]
        }
    },
    "productive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "productivity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "profession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "professional": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "professor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "profile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "profit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "profitable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "profound": {
        "A": {
            "tab": ["a1"]
        }
    },
    "program": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v10"
        }
    },
    "programme": {
        "N": {
            "tab": ["n1"]
        }
    },
    "progress": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "progressive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prohibit": {
        "V": {
            "tab": "v1"
        }
    },
    "project": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "projection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prolonged": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prominent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "promise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "promote": {
        "V": {
            "tab": "v3"
        }
    },
    "promoter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "promotion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prompt": {
        "V": {
            "tab": "v1"
        }
    },
    "promptly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "prone": {
        "A": {
            "tab": ["a1"]
        }
    },
    "pronounce": {
        "V": {
            "tab": "v3"
        }
    },
    "proof": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prop": {
        "V": {
            "tab": "v12"
        }
    },
    "propaganda": {
        "N": {
            "tab": ["n5"]
        }
    },
    "proper": {
        "A": {
            "tab": ["a1"]
        }
    },
    "properly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "property": {
        "N": {
            "tab": ["n3"]
        }
    },
    "proportion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "proportional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "proposal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "propose": {
        "V": {
            "tab": "v3"
        }
    },
    "proposition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "proprietor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prosecute": {
        "V": {
            "tab": "v3"
        }
    },
    "prosecution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prospect": {
        "N": {
            "tab": ["n1"]
        }
    },
    "prospective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "prosperity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "protect": {
        "V": {
            "tab": "v1"
        }
    },
    "protection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "protective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "protein": {
        "N": {
            "tab": ["n1"]
        }
    },
    "protest": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "protocol": {
        "N": {
            "tab": ["n1"]
        }
    },
    "proud": {
        "A": {
            "tab": ["a3"]
        }
    },
    "prove": {
        "V": {
            "tab": "v52"
        }
    },
    "provide": {
        "V": {
            "tab": "v3"
        }
    },
    "provider": {
        "N": {
            "tab": ["n1"]
        }
    },
    "province": {
        "N": {
            "tab": ["n1"]
        }
    },
    "provincial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "provision": {
        "N": {
            "tab": ["n1"]
        }
    },
    "provisional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "provoke": {
        "V": {
            "tab": "v3"
        }
    },
    "psychiatric": {
        "A": {
            "tab": ["a1"]
        }
    },
    "psychological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "psychologist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "psychology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "pub": {
        "N": {
            "tab": ["n1"]
        }
    },
    "public": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "publication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "publicity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "publicly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "publish": {
        "V": {
            "tab": "v2"
        }
    },
    "publisher": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pudding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pull": {
        "V": {
            "tab": "v1"
        }
    },
    "pulse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pump": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "punch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "punish": {
        "V": {
            "tab": "v2"
        }
    },
    "punishment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pupil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "purchase": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "purchaser": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pure": {
        "A": {
            "tab": ["a2"]
        }
    },
    "purely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "purple": {
        "A": {
            "tab": ["a1"]
        }
    },
    "purpose": {
        "N": {
            "tab": ["n1"]
        }
    },
    "pursue": {
        "V": {
            "tab": "v3"
        }
    },
    "pursuit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "push": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "put": {
        "V": {
            "tab": "v17"
        }
    },
    "puzzle": {
        "V": {
            "tab": "v3"
        }
    },
    "qualification": {
        "N": {
            "tab": ["n1"]
        }
    },
    "qualified": {
        "A": {
            "tab": ["a1"]
        }
    },
    "qualify": {
        "V": {
            "tab": "v4"
        }
    },
    "quality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "quantitative": {
        "A": {
            "tab": ["a1"]
        }
    },
    "quantity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "quantum": {
        "N": {
            "tab": ["n11"]
        }
    },
    "quarry": {
        "N": {
            "tab": ["n3"]
        }
    },
    "quarter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "queen": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "query": {
        "N": {
            "tab": ["n3"]
        }
    },
    "quest": {
        "N": {
            "tab": ["n1"]
        }
    },
    "question": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "questionnaire": {
        "N": {
            "tab": ["n1"]
        }
    },
    "queue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "quick": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "quickly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "quid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "quiet": {
        "A": {
            "tab": ["a3"]
        }
    },
    "quietly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "quit": {
        "V": {
            "tab": "v38"
        }
    },
    "quite": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "quota": {
        "N": {
            "tab": ["n1"]
        }
    },
    "quotation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "quote": {
        "V": {
            "tab": "v3"
        }
    },
    "rabbit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "race": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "racial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "racism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "rack": {
        "N": {
            "tab": ["n1"]
        }
    },
    "radiation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "radical": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "radio": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "raid": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "railway": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rain": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "raise": {
        "V": {
            "tab": "v3"
        }
    },
    "rally": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "ram": {
        "N": {
            "tab": ["n1"]
        }
    },
    "range": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "rank": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "rape": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "rapid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rapidly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "rare": {
        "A": {
            "tab": ["a2"]
        }
    },
    "rarely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "rat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rate": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "rather": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "rating": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ratio": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "raw": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ray": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reach": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "react": {
        "V": {
            "tab": "v1"
        }
    },
    "reaction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reactor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "read": {
        "V": {
            "tab": "v18"
        }
    },
    "reader": {
        "N": {
            "tab": ["n1"]
        }
    },
    "readily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "reading": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ready": {
        "A": {
            "tab": ["a4"]
        }
    },
    "real": {
        "A": {
            "tab": ["a1"]
        }
    },
    "realism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "realistic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reality": {
        "N": {
            "tab": ["n3"]
        }
    },
    "realize": {
        "V": {
            "tab": "v3"
        }
    },
    "really": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "realm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rear": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "reason": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reasonable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reasonably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "reasoning": {
        "N": {
            "tab": ["n5"]
        }
    },
    "reassure": {
        "V": {
            "tab": "v3"
        }
    },
    "rebel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rebellion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rebuild": {
        "V": {
            "tab": "v23"
        }
    },
    "recall": {
        "V": {
            "tab": "v1"
        }
    },
    "receipt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "receive": {
        "V": {
            "tab": "v3"
        }
    },
    "receiver": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "recently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "reception": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recipe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recipient": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reckon": {
        "V": {
            "tab": "v1"
        }
    },
    "recognition": {
        "N": {
            "tab": ["n5"]
        }
    },
    "recognize": {
        "V": {
            "tab": "v3"
        }
    },
    "recommend": {
        "V": {
            "tab": "v1"
        }
    },
    "recommendation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recommended":{"A":{"tab":["a1"]}},
    "reconcile": {
        "V": {
            "tab": "v3"
        }
    },
    "reconstruction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "record": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "recorder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recording": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recover": {
        "V": {
            "tab": "v1"
        }
    },
    "recovery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "recreation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recruit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "recruitment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "recycle": {
        "V": {
            "tab": "v3"
        }
    },
    "red": {
        "A": {
            "tab": ["a6"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "reduce": {
        "V": {
            "tab": "v3"
        }
    },
    "reduction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "redundancy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "redundant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "refer": {
        "V": {
            "tab": "v13"
        }
    },
    "referee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reference": {
        "N": {
            "tab": ["n1"]
        }
    },
    "referendum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reflect": {
        "V": {
            "tab": "v1"
        }
    },
    "reflection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reform": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "reformer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "refuge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "refugee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "refusal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "refuse": {
        "V": {
            "tab": "v3"
        }
    },
    "regain": {
        "V": {
            "tab": "v1"
        }
    },
    "regard": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "regime": {
        "N": {
            "tab": ["n1"]
        }
    },
    "regiment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "region": {
        "N": {
            "tab": ["n1"]
        }
    },
    "regional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "register": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "registration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "regret": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v14"
        }
    },
    "regular": {
        "A": {
            "tab": ["a1"]
        }
    },
    "regularly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "regulate": {
        "V": {
            "tab": "v3"
        }
    },
    "regulation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "regulatory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rehabilitation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rehearsal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reign": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reinforce": {
        "V": {
            "tab": "v3"
        }
    },
    "reject": {
        "V": {
            "tab": "v1"
        }
    },
    "rejection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "relate": {
        "V": {
            "tab": "v3"
        }
    },
    "relation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "relationship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "relative": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "relatively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "relax": {
        "V": {
            "tab": "v2"
        }
    },
    "relaxation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "release": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "relevance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "relevant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reliable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reliance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "relief": {
        "N": {
            "tab": ["n1"]
        }
    },
    "relieve": {
        "V": {
            "tab": "v3"
        }
    },
    "religion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "religious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reluctance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "reluctant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reluctantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "rely": {
        "V": {
            "tab": "v4"
        }
    },
    "remain": {
        "V": {
            "tab": "v1"
        }
    },
    "remainder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "remark": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "remarkable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "remarkably": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "remedy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "remember": {
        "V": {
            "tab": "v1"
        }
    },
    "remind": {
        "V": {
            "tab": "v1"
        }
    },
    "reminder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "remote": {
        "A": {
            "tab": ["a2"]
        }
    },
    "removal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "remove": {
        "V": {
            "tab": "v3"
        }
    },
    "renaissance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "render": {
        "V": {
            "tab": "v1"
        }
    },
    "renew": {
        "V": {
            "tab": "v1"
        }
    },
    "renewal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "repair": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "repay": {
        "V": {
            "tab": "v19"
        }
    },
    "repayment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "repeat": {
        "V": {
            "tab": "v1"
        }
    },
    "repeated": {
        "A": {
            "tab": ["a1"]
        }
    },
    "repeatedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "repetition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "replace": {
        "V": {
            "tab": "v3"
        }
    },
    "replacement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reply": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "report": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "reportedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "reporter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "represent": {
        "V": {
            "tab": "v1"
        }
    },
    "representation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "representative": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "reproduce": {
        "V": {
            "tab": "v3"
        }
    },
    "reproduction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "republic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "republican": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reputation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "request": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "require": {
        "V": {
            "tab": "v3"
        }
    },
    "requirement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rescue": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "research": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "researcher": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resemble": {
        "V": {
            "tab": "v3"
        }
    },
    "resent": {
        "V": {
            "tab": "v1"
        }
    },
    "resentment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "reservation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reserve": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "reservoir": {
        "N": {
            "tab": ["n1"]
        }
    },
    "residence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resident": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "residential": {
        "A": {
            "tab": ["a1"]
        }
    },
    "residue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resign": {
        "V": {
            "tab": "v1"
        }
    },
    "resignation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resist": {
        "V": {
            "tab": "v1"
        }
    },
    "resistance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resolution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resolve": {
        "V": {
            "tab": "v3"
        }
    },
    "resort": {
        "N": {
            "tab": ["n1"]
        }
    },
    "resource": {
        "N": {
            "tab": ["n1"]
        }
    },
    "respect": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "respectable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "respective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "respectively": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "respond": {
        "V": {
            "tab": "v1"
        }
    },
    "respondent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "response": {
        "N": {
            "tab": ["n1"]
        }
    },
    "responsibility": {
        "N": {
            "tab": ["n3"]
        }
    },
    "responsible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rest": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "restaurant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "restoration": {
        "N": {
            "tab": ["n1"]
        }
    },
    "restore": {
        "V": {
            "tab": "v3"
        }
    },
    "restrain": {
        "V": {
            "tab": "v1"
        }
    },
    "restraint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "restrict": {
        "V": {
            "tab": "v1"
        }
    },
    "restriction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "restrictive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "result": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "resume": {
        "V": {
            "tab": "v3"
        }
    },
    "retailer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "retain": {
        "V": {
            "tab": "v1"
        }
    },
    "retention": {
        "N": {
            "tab": ["n5"]
        }
    },
    "retire": {
        "V": {
            "tab": "v3"
        }
    },
    "retired": {
        "A": {
            "tab": ["a1"]
        }
    },
    "retirement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "retreat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "retrieve": {
        "V": {
            "tab": "v3"
        }
    },
    "return": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "reveal": {
        "V": {
            "tab": "v1"
        }
    },
    "revelation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "revenge": {
        "N": {
            "tab": ["n5"]
        }
    },
    "revenue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "reverse": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "revert": {
        "V": {
            "tab": "v1"
        }
    },
    "review": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "revise": {
        "V": {
            "tab": "v3"
        }
    },
    "revision": {
        "N": {
            "tab": ["n1"]
        }
    },
    "revival": {
        "N": {
            "tab": ["n1"]
        }
    },
    "revive": {
        "V": {
            "tab": "v3"
        }
    },
    "revolution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "revolutionary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "reward": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "rhetoric": {
        "N": {
            "tab": ["n5"]
        }
    },
    "rhythm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rib": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ribbon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rice": {
        "N": {
            "tab": ["n5"]
        }
    },
    "rich": {
        "A": {
            "tab": ["a3"]
        }
    },
    "rid": {
        "V": {
            "tab": "v39"
        }
    },
    "ride": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v47"
        }
    },
    "rider": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ridge": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ridiculous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rifle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "right": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "rightly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "rigid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ring": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v46"
        }
    },
    "riot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rip": {
        "V": {
            "tab": "v12"
        }
    },
    "rise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v63"
        }
    },
    "risk": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "ritual": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rival": {
        "N": {
            "tab": ["n1"]
        }
    },
    "river": {
        "N": {
            "tab": ["n1"]
        }
    },
    "road": {
        "N": {
            "tab": ["n1"]
        }
    },
    "roar": {
        "V": {
            "tab": "v1"
        }
    },
    "rob": {
        "V": {
            "tab": "v5"
        }
    },
    "robbery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "rock": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "rocket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rod": {
        "N": {
            "tab": ["n1"]
        }
    },
    "role": {
        "N": {
            "tab": ["n1"]
        }
    },
    "roll": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "romance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "romantic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "roof": {
        "N": {
            "tab": ["n1"]
        }
    },
    "room": {
        "N": {
            "tab": ["n1"]
        }
    },
    "root": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "rope": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rose": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rotation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rotten": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rough": {
        "A": {
            "tab": ["a3"]
        }
    },
    "roughly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "round": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        },
        "P": {
            "tab": ["pp"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "route": {
        "N": {
            "tab": ["n1"]
        }
    },
    "routine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "row": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "royal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "royalty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "rub": {
        "V": {
            "tab": "v5"
        }
    },
    "rubbish": {
        "N": {
            "tab": ["n5"]
        }
    },
    "rude": {
        "A": {
            "tab": ["a2"]
        }
    },
    "rug": {
        "N": {
            "tab": ["n1"]
        }
    },
    "rugby": {
        "N": {
            "tab": ["n5"]
        }
    },
    "ruin": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "rule": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "ruler": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ruling": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "rumour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "run": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v33"
        }
    },
    "runner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "running": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "rush": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "sack": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "sacred": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sacrifice": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "sad": {
        "A": {
            "tab": ["a6"]
        }
    },
    "sadly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "safe": {
        "A": {
            "tab": ["a2"]
        }
    },
    "safely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "safety": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sail": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "sailor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "saint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "salad": {
        "N": {
            "tab": ["n1"]
        }
    },
    "salary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sale": {
        "N": {
            "tab": ["n1"]
        }
    },
    "salmon": {
        "N": {
            "tab": ["n4"]
        }
    },
    "salon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "salt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "salvation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "same":{"A":{"tab":["a1"]}},
    "sample": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "sanction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sanctuary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sand": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sandwich": {
        "N": {
            "tab": ["n2"]
        }
    },
    "satellite": {
        "N": {
            "tab": ["n1"]
        }
    },
    "satisfaction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "satisfactory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "satisfy": {
        "V": {
            "tab": "v4"
        }
    },
    "sauce": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sausage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "save": {
        "V": {
            "tab": "v3"
        }
    },
    "saving": {
        "N": {
            "tab": ["n1"]
        }
    },
    "say": {
        "N":{"tab":["n1"]},
        "V": {
            "tab": "v19"
        }
    },
    "saying": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scale": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scan": {
        "V": {
            "tab": "v11"
        }
    },
    "scandal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scar": {
        "V": {
            "tab": "v13"
        }
    },
    "scarcely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "scatter": {
        "V": {
            "tab": "v1"
        }
    },
    "scenario": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scene": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "schedule": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "scheme": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scholar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scholarship": {
        "N": {
            "tab": ["n1"]
        }
    },
    "school": {
        "N": {
            "tab": ["n1"]
        }
    },
    "science": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scientific": {
        "A": {
            "tab": ["a1"]
        }
    },
    "scientist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scope": {
        "N": {
            "tab": ["n5"]
        }
    },
    "score": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "scramble": {
        "V": {
            "tab": "v3"
        }
    },
    "scrap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scrape": {
        "V": {
            "tab": "v3"
        }
    },
    "scratch": {
        "V": {
            "tab": "v2"
        }
    },
    "scream": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "screen": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "screw": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "script": {
        "N": {
            "tab": ["n1"]
        }
    },
    "scrutiny": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sculpture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sea": {
        "N": {
            "tab": ["n1"]
        }
    },
    "seal": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "search": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "season": {
        "N": {
            "tab": ["n1"]
        }
    },
    "seasonal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "seat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "second": {
        "N": {
            "tab": ["n1"]
        }
    },
    "secondary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "secondly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "secret": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "secretary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "secretion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "section": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sector": {
        "N": {
            "tab": ["n1"]
        }
    },
    "secular": {
        "A": {
            "tab": ["a1"]
        }
    },
    "secure": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "security": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sediment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "see": {
        "V": {
            "tab": "v50"
        }
    },
    "seed": {
        "N": {
            "tab": ["n1"]
        }
    },
    "seek": {
        "V": {
            "tab": "v131"
        }
    },
    "seem": {
        "V": {
            "tab": "v1"
        }
    },
    "seemingly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "segment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "seize": {
        "V": {
            "tab": "v3"
        }
    },
    "seldom": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "select": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "selection": {
        "N": {
            "tab": ["n1"]
        }
    },
    "selective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "self": {
        "N": {
            "tab": ["n9"]
        }
    },
    "sell": {
        "V": {
            "tab": "v31"
        }
    },
    "seller": {
        "N": {
            "tab": ["n1"]
        }
    },
    "semantic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "semi-final": {
        "N": {
            "tab": ["n1"]
        }
    },
    "seminar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "senate": {
        "N": {
            "tab": ["n1"]
        }
    },
    "send": {
        "V": {
            "tab": "v23"
        }
    },
    "senior": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "sensation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sense": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "sensible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sensitive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sensitivity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sentence": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "sentiment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "separate": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "separately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "separation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sequence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sergeant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "series": {
        "N": {
            "tab": ["n4"]
        }
    },
    "serious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "seriously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "serum": {
        "N": {
            "tab": ["n5"]
        }
    },
    "servant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "serve": {
        "V": {
            "tab": "v3"
        }
    },
    "server": {
        "N": {
            "tab": ["n1"]
        }
    },
    "service": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "session": {
        "N": {
            "tab": ["n1"]
        }
    },
    "set": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v17"
        }
    },
    "setting": {
        "N": {
            "tab": ["n1"]
        }
    },
    "settle": {
        "V": {
            "tab": "v3"
        }
    },
    "settlement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "severe": {
        "A": {
            "tab": ["a2"]
        }
    },
    "severely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sex": {
        "N": {
            "tab": ["n2"]
        }
    },
    "sexual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sexuality": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sexually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "shade": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shadow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shaft": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shake": {
        "V": {
            "tab": "v20"
        }
    },
    "shallow": {
        "A": {
            "tab": ["a1"]
        }
    },
    "shame": {
        "N": {
            "tab": ["n5"]
        }
    },
    "shape": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "share": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "shareholder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sharp": {
        "A": {
            "tab": ["a3"]
        }
    },
    "sharply": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "shatter": {
        "V": {
            "tab": "v1"
        }
    },
    "shed": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v39"
        }
    },
    "sheep": {
        "N": {
            "tab": ["n4"]
        }
    },
    "sheer": {
        "A": {
            "tab": ["a3"]
        }
    },
    "sheet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shelf": {
        "N": {
            "tab": ["n9"]
        }
    },
    "shell": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shelter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shield": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shift": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "shilling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shine": {
        "V": {
            "tab": "v66"
        }
    },
    "ship": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "shirt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shit": {
        "N": {
            "tab": ["n5"]
        }
    },
    "shiver": {
        "V": {
            "tab": "v1"
        }
    },
    "shock": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "shoe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shoot": {
        "V": {
            "tab": "v40"
        }
    },
    "shop": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "shopping": {
        "N": {
            "tab": ["n5"]
        }
    },
    "shore": {
        "N": {
            "tab": ["n1"]
        }
    },
    "short": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "shortage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shortly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "short-term": {
        "A": {
            "tab": ["a1"]
        }
    },
    "shot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shoulder": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shout": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "show": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v57"
        }
    },
    "shower": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shrink": {
        "V": {
            "tab": "v64"
        }
    },
    "shrub": {
        "N": {
            "tab": ["n1"]
        }
    },
    "shrug": {
        "V": {
            "tab": "v7"
        }
    },
    "shut": {
        "V": {
            "tab": "v17"
        }
    },
    "shy": {
        "A": {
            "tab": ["a3"]
        }
    },
    "sick": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sickness": {
        "N": {
            "tab": ["n2"]
        }
    },
    "side": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sideways": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "siege": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sigh": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "sight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sign": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "signal": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "signature": {
        "N": {
            "tab": ["n1"]
        }
    },
    "significance": {
        "N": {
            "tab": ["n5"]
        }
    },
    "significant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "significantly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "silence": {
        "N": {
            "tab": ["n1"]
        }
    },
    "silent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "silently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "silk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "silly": {
        "A": {
            "tab": ["a4"]
        }
    },
    "silver": {
        "N": {
            "tab": ["n5"]
        }
    },
    "similar": {
        "A": {
            "tab": ["a1"]
        }
    },
    "similarity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "similarly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "simple": {
        "A": {
            "tab": ["a2"]
        }
    },
    "simplicity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "simply": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "simultaneously": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "since": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "sincerely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sing": {
        "V": {
            "tab": "v46"
        }
    },
    "singer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "single": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "sink": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v64"
        }
    },
    "sip": {
        "V": {
            "tab": "v12"
        }
    },
    "sir": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sister": {
        "N": {
            "g": "f",
            "tab": ["n87"]
        }
    },
    "sit": {
        "V": {
            "tab": "v44"
        }
    },
    "site": {
        "N": {
            "tab": ["n1"]
        }
    },
    "situation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "size": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skeleton": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sketch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "ski": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skill": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skilled": {
        "A": {
            "tab": ["a1"]
        }
    },
    "skin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skipper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skirt": {
        "N": {
            "tab": ["n1"]
        }
    },
    "skull": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sky": {
        "N": {
            "tab": ["n3"]
        }
    },
    "slab": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slam": {
        "V": {
            "tab": "v10"
        }
    },
    "slap": {
        "V": {
            "tab": "v12"
        }
    },
    "slave": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sleep": {
        "N": {
            "tab": ["n5"]
        },
        "V": {
            "tab": "v29"
        }
    },
    "sleeve": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slide": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v75"
        }
    },
    "slight": {
        "A": {
            "tab": ["a3"]
        }
    },
    "slightly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "slim": {
        "A": {
            "tab": ["a9"]
        }
    },
    "slip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "slogan": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slope": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slot": {
        "N": {
            "tab": ["n1"]
        }
    },
    "slow": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "slowly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "slump": {
        "V": {
            "tab": "v1"
        }
    },
    "small": {
        "A": {
            "tab": ["a3"]
        }
    },
    "smart": {
        "A": {
            "tab": ["a3"]
        }
    },
    "smash": {
        "V": {
            "tab": "v2"
        }
    },
    "smell": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v99"
        }
    },
    "smile": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "smoke": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "smooth": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "smoothly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "snake": {
        "N": {
            "tab": ["n1"]
        }
    },
    "snap": {
        "V": {
            "tab": "v12"
        }
    },
    "snatch": {
        "V": {
            "tab": "v2"
        }
    },
    "sniff": {
        "V": {
            "tab": "v1"
        }
    },
    "snow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "so": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "soak": {
        "V": {
            "tab": "v1"
        }
    },
    "soap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "soar": {
        "V": {
            "tab": "v1"
        }
    },
    "so-called": {
        "A": {
            "tab": ["a1"]
        }
    },
    "soccer": {
        "N": {
            "tab": ["n5"]
        }
    },
    "social": {
        "A": {
            "tab": ["a1"]
        }
    },
    "socialism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "socialist": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "socially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "society": {
        "N": {
            "tab": ["n3"]
        }
    },
    "sociological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sociology": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sock": {
        "N": {
            "tab": ["n1"]
        }
    },
    "socket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sodium": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sofa": {
        "N": {
            "tab": ["n1"]
        }
    },
    "soft": {
        "A": {
            "tab": ["a3"]
        }
    },
    "soften": {
        "V": {
            "tab": "v1"
        }
    },
    "softly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "software": {
        "N": {
            "tab": ["n5"]
        }
    },
    "soil": {
        "N": {
            "tab": ["n1"]
        }
    },
    "solar": {
        "A": {
            "tab": ["a1"]
        }
    },
    "soldier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sole": {
        "A": {
            "tab": ["a1"]
        }
    },
    "solely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "solicitor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "solid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "solidarity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "solo": {
        "N": {
            "tab": ["n1"]
        }
    },
    "solution": {
        "N": {
            "tab": ["n1"]
        }
    },
    "solve": {
        "V": {
            "tab": "v3"
        }
    },
    "solvent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "somebody": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "somehow": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "someone": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "something": {
        "Pro": {
            "tab": ["pn5"]
        }
    },
    "sometimes": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "somewhat": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "somewhere": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "son": {
        "N": {
            "tab": ["n1"]
        }
    },
    "song": {
        "N": {
            "tab": ["n1"]
        }
    },
    "soon": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sophisticated": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sore": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sorry": {
        "A": {
            "tab": ["a4"]
        }
    },
    "sort": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "soul": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sound": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "soup": {
        "N": {
            "tab": ["n5"]
        }
    },
    "source": {
        "N": {
            "tab": ["n1"]
        }
    },
    "south": {
        "N": {
            "tab": ["n5"]
        }
    },
    "southern": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sovereignty": {
        "N": {
            "tab": ["n5"]
        }
    },
    "space": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spare": {
        "A": {
            "tab": ["a1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "spatial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "speak": {
        "V": {
            "tab": "v138"
        }
    },
    "speaker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "special": {
        "A": {
            "tab": ["a1"]
        }
    },
    "specialist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "specially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "species": {
        "N": {
            "tab": ["n4"]
        }
    },
    "specific": {
        "A": {
            "tab": ["a1"]
        }
    },
    "specifically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "specification": {
        "N": {
            "tab": ["n1"]
        }
    },
    "specify": {
        "V": {
            "tab": "v4"
        }
    },
    "specimen": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spectacle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spectacular": {
        "A": {
            "tab": ["a1"]
        }
    },
    "spectator": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spectrum": {
        "N": {
            "tab": ["n11"]
        }
    },
    "speculation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "speech": {
        "N": {
            "tab": ["n2"]
        }
    },
    "speed": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v133"
        }
    },
    "spell": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v98"
        }
    },
    "spelling": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spend": {
        "V": {
            "tab": "v23"
        }
    },
    "sphere": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spider": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spill": {
        "V": {
            "tab": "v60"
        }
    },
    "spin": {
        "V": {
            "tab": "v104"
        }
    },
    "spine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spirit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spiritual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "spit": {
        "V": {
            "tab": "v44"
        }
    },
    "spite": {
        "N": {
            "tab": ["n5"]
        }
    },
    "splendid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "split": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v17"
        }
    },
    "spoil": {
        "V": {
            "tab": "v26"
        }
    },
    "spokesman": {
        "N": {
            "tab": ["n7"]
        }
    },
    "sponsor": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "spontaneous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "spoon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sport": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spot": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v14"
        }
    },
    "spouse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "spray": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "spread": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v18"
        }
    },
    "spring": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v46"
        }
    },
    "spy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "squad": {
        "N": {
            "tab": ["n1"]
        }
    },
    "squadron": {
        "N": {
            "tab": ["n1"]
        }
    },
    "square": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "squeeze": {
        "V": {
            "tab": "v3"
        }
    },
    "stab": {
        "V": {
            "tab": "v5"
        }
    },
    "stability": {
        "N": {
            "tab": ["n5"]
        }
    },
    "stable": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "stadium": {
        "N": {
            "tab": ["n1"]
        }
    },
    "staff": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "stage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stagger": {
        "V": {
            "tab": "v1"
        }
    },
    "stain": {
        "V": {
            "tab": "v1"
        }
    },
    "stair": {
        "N": {
            "tab": ["n1"]
        }
    },
    "staircase": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stake": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "stall": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stamp": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "stance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stand": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v37"
        }
    },
    "standard": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "standing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "star": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v13"
        }
    },
    "start": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "startle": {
        "V": {
            "tab": "v3"
        }
    },
    "state": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "statement": {
        "N": {
            "tab": ["n1"]
        }
    },
    "static": {
        "A": {
            "tab": ["a1"]
        }
    },
    "station": {
        "N": {
            "tab": ["n1"]
        }
    },
    "statistical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "statistics": {
        "N": {
            "tab": ["n4"]
        }
    },
    "statue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "status": {
        "N": {
            "tab": ["n5"]
        }
    },
    "statute": {
        "N": {
            "tab": ["n1"]
        }
    },
    "statutory": {
        "A": {
            "tab": ["a1"]
        }
    },
    "stay": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "steadily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "steady": {
        "A": {
            "tab": ["a4"]
        }
    },
    "steal": {
        "V": {
            "tab": "v137"
        }
    },
    "steam": {
        "N": {
            "tab": ["n5"]
        }
    },
    "steel": {
        "N": {
            "tab": ["n5"]
        }
    },
    "steep": {
        "A": {
            "tab": ["a3"]
        }
    },
    "steer": {
        "V": {
            "tab": "v1"
        }
    },
    "stem": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v10"
        }
    },
    "step": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "sterling": {
        "A": {
            "tab": ["a1"]
        }
    },
    "steward": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stick": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v119"
        }
    },
    "sticky": {
        "A": {
            "tab": ["a4"]
        }
    },
    "stiff": {
        "A": {
            "tab": ["a3"]
        }
    },
    "still": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "stimulate": {
        "V": {
            "tab": "v3"
        }
    },
    "stimulus": {
        "N": {
            "tab": ["n12"]
        }
    },
    "stir": {
        "V": {
            "tab": "v13"
        }
    },
    "stitch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "stock": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stocking": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stolen": {
        "A": {
            "tab": ["a1"]
        }
    },
    "stomach": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stone": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stool": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stop": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "storage": {
        "N": {
            "tab": ["n5"]
        }
    },
    "store": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "storm": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "story": {
        "N": {
            "tab": ["n3"]
        }
    },
    "straight": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "straighten": {
        "V": {
            "tab": "v1"
        }
    },
    "straightforward": {
        "A": {
            "tab": ["a1"]
        }
    },
    "strain": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "strand": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strange": {
        "A": {
            "tab": ["a2"]
        }
    },
    "strangely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "stranger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strap": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strategic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "strategy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "straw": {
        "N": {
            "tab": ["n1"]
        }
    },
    "stream": {
        "N": {
            "tab": ["n1"]
        }
    },
    "street": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strength": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strengthen": {
        "V": {
            "tab": "v1"
        }
    },
    "stress": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "stretch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "strict": {
        "A": {
            "tab": ["a3"]
        }
    },
    "strictly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "stride": {
        "V": {
            "tab": "v47"
        }
    },
    "strike": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v108"
        }
    },
    "striker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "striking": {
        "A": {
            "tab": ["a1"]
        }
    },
    "string": {
        "N": {
            "tab": ["n1"]
        }
    },
    "strip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "strive": {
        "V": {
            "tab": "v42"
        }
    },
    "stroke": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "stroll": {
        "V": {
            "tab": "v1"
        }
    },
    "strong": {
        "A": {
            "tab": ["a3"]
        }
    },
    "strongly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "structural": {
        "A": {
            "tab": ["a1"]
        }
    },
    "structure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "struggle": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "student": {
        "N": {
            "tab": ["n1"]
        }
    },
    "studio": {
        "N": {
            "tab": ["n1"]
        }
    },
    "study": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "stuff": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "stumble": {
        "V": {
            "tab": "v3"
        }
    },
    "stunning": {
        "A": {
            "tab": ["a1"]
        }
    },
    "stupid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "style": {
        "N": {
            "tab": ["n1"]
        }
    },
    "subject": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "subjective": {
        "A": {
            "tab": ["a1"]
        }
    },
    "submission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "submit": {
        "V": {
            "tab": "v14"
        }
    },
    "subscription": {
        "N": {
            "tab": ["n1"]
        }
    },
    "subsequent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "subsequently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "subsidiary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "subsidy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "substance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "substantial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "substantially": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "substantive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "substitute": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "subtle": {
        "A": {
            "tab": ["a2"]
        }
    },
    "suburb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "succeed": {
        "V": {
            "tab": "v1"
        }
    },
    "success": {
        "N": {
            "tab": ["n2"]
        }
    },
    "successful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "successfully": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "succession": {
        "N": {
            "tab": ["n1"]
        }
    },
    "successive": {
        "A": {
            "tab": ["a1"]
        }
    },
    "successor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suck": {
        "V": {
            "tab": "v1"
        }
    },
    "sudden": {
        "A": {
            "tab": ["a1"]
        }
    },
    "suddenly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sue": {
        "V": {
            "tab": "v3"
        }
    },
    "suffer": {
        "V": {
            "tab": "v1"
        }
    },
    "sufferer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suffering": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sufficient": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sufficiently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "sugar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suggest": {
        "V": {
            "tab": "v1"
        }
    },
    "suggestion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suicide": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "suitable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "suitcase": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suite": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sulphur": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sum": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v10"
        }
    },
    "summary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "summer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "summit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "summon": {
        "V": {
            "tab": "v1"
        }
    },
    "sun": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sunlight": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sunny": {
        "A": {
            "tab": ["a4"]
        }
    },
    "sunshine": {
        "N": {
            "tab": ["n5"]
        }
    },
    "super": {
        "A": {
            "tab": ["a1"]
        }
    },
    "superb": {
        "A": {
            "tab": ["a1"]
        }
    },
    "superintendent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "superior": {
        "A": {
            "tab": ["a1"]
        }
    },
    "supermarket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "supervise": {
        "V": {
            "tab": "v3"
        }
    },
    "supervision": {
        "N": {
            "tab": ["n1"]
        }
    },
    "supervisor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "supper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "supplement": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "supplementary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "supplier": {
        "N": {
            "tab": ["n1"]
        }
    },
    "supply": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "support": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "supporter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suppose": {
        "V": {
            "tab": "v3"
        }
    },
    "supposed": {
        "A": {
            "tab": ["a1"]
        }
    },
    "supposedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "suppress": {
        "V": {
            "tab": "v2"
        }
    },
    "supreme": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sure": {
        "A": {
            "tab": ["a2"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "surely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "surface": {
        "N": {
            "tab": ["n1"]
        }
    },
    "surgeon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "surgery": {
        "N": {
            "tab": ["n3"]
        }
    },
    "surplus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "surprise": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "surprised": {
        "A": {
            "tab": ["a1"]
        }
    },
    "surprising": {
        "A": {
            "tab": ["a1"]
        }
    },
    "surprisingly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "surrender": {
        "V": {
            "tab": "v1"
        }
    },
    "surround": {
        "V": {
            "tab": "v1"
        }
    },
    "surrounding": {
        "A": {
            "tab": ["a1"]
        }
    },
    "survey": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "surveyor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "survival": {
        "N": {
            "tab": ["n1"]
        }
    },
    "survive": {
        "V": {
            "tab": "v3"
        }
    },
    "survivor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suspect": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "suspend": {
        "V": {
            "tab": "v1"
        }
    },
    "suspension": {
        "N": {
            "tab": ["n5"]
        }
    },
    "suspicion": {
        "N": {
            "tab": ["n1"]
        }
    },
    "suspicious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sustain": {
        "V": {
            "tab": "v1"
        }
    },
    "swallow": {
        "V": {
            "tab": "v1"
        }
    },
    "swap": {
        "V": {
            "tab": "v12"
        }
    },
    "sway": {
        "V": {
            "tab": "v1"
        }
    },
    "swear": {
        "V": {
            "tab": "v30"
        }
    },
    "sweat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "sweep": {
        "V": {
            "tab": "v29"
        }
    },
    "sweet": {
        "A": {
            "tab": ["a3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "swell": {
        "V": {
            "tab": "v128"
        }
    },
    "swift": {
        "A": {
            "tab": ["a3"]
        }
    },
    "swiftly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "swim": {
        "V": {
            "tab": "v107"
        }
    },
    "swimming": {
        "N": {
            "tab": ["n5"]
        }
    },
    "swing": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v21"
        }
    },
    "switch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "sword": {
        "N": {
            "tab": ["n1"]
        }
    },
    "syllable": {
        "N": {
            "tab": ["n1"]
        }
    },
    "symbol": {
        "N": {
            "tab": ["n1"]
        }
    },
    "symbolic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "symmetry": {
        "N": {
            "tab": ["n5"]
        }
    },
    "sympathetic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "sympathy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "symptom": {
        "N": {
            "tab": ["n1"]
        }
    },
    "syndrome": {
        "N": {
            "tab": ["n1"]
        }
    },
    "syntactic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "synthesis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "system": {
        "N": {
            "tab": ["n1"]
        }
    },
    "systematic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "table": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tablet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tackle": {
        "V": {
            "tab": "v3"
        }
    },
    "tactic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tail": {
        "N": {
            "tab": ["n1"]
        }
    },
    "take": {
        "V": {
            "tab": "v20"
        }
    },
    "takeover": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tale": {
        "N": {
            "tab": ["n1"]
        }
    },
    "talent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "talented": {
        "A": {
            "tab": ["a1"]
        }
    },
    "talk": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "tall": {
        "A": {
            "tab": ["a3"]
        }
    },
    "tank": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tap": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "tape": {
        "N": {
            "tab": ["n1"]
        }
    },
    "target": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "tariff": {
        "N": {
            "tab": ["n1"]
        }
    },
    "task": {
        "N": {
            "tab": ["n1"]
        }
    },
    "taste": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "tax": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "taxation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "taxi": {
        "N": {
            "tab": ["n1"]
        }
    },
    "taxpayer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tea": {
        "N": {
            "tab": ["n1"]
        }
    },
    "teach": {
        "V": {
            "tab": "v142"
        }
    },
    "teacher": {
        "N": {
            "tab": ["n1"]
        }
    },
    "teaching": {
        "N": {
            "tab": ["n1"]
        }
    },
    "team": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tear": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v30"
        }
    },
    "tease": {
        "V": {
            "tab": "v3"
        }
    },
    "technical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "technically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "technique": {
        "N": {
            "tab": ["n1"]
        }
    },
    "technological": {
        "A": {
            "tab": ["a1"]
        }
    },
    "technology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "teenage": {
        "A": {
            "tab": ["a1"]
        }
    },
    "teenager": {
        "N": {
            "tab": ["n1"]
        }
    },
    "telecommunication": {
        "N": {
            "tab": ["n1"]
        }
    },
    "telephone": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "television": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tell": {
        "V": {
            "tab": "v31"
        }
    },
    "telly": {
        "N": {
            "tab": ["n3"]
        }
    },
    "temper": {
        "N": {
            "tab": ["n1"]
        }
    },
    "temperature": {
        "N": {
            "tab": ["n1"]
        }
    },
    "temple": {
        "N": {
            "tab": ["n1"]
        }
    },
    "temporarily": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "temporary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "tempt": {
        "V": {
            "tab": "v1"
        }
    },
    "temptation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tenant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tend": {
        "V": {
            "tab": "v1"
        }
    },
    "tendency": {
        "N": {
            "tab": ["n3"]
        }
    },
    "tender": {
        "A": {
            "tab": ["a3"]
        }
    },
    "tennis": {
        "N": {
            "tab": ["n5"]
        }
    },
    "tense": {
        "A": {
            "tab": ["a2"]
        }
    },
    "tension": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tent": {
        "N": {
            "tab": ["n1"]
        }
    },
    "term": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "terminal": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "terminate": {
        "V": {
            "tab": "v3"
        }
    },
    "terrace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "terrible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "terribly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "terrify": {
        "V": {
            "tab": "v4"
        }
    },
    "territorial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "territory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "terror": {
        "N": {
            "tab": ["n1"]
        }
    },
    "terrorist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "test": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "testament": {
        "N": {
            "tab": ["n1"]
        }
    },
    "text": {
        "N": {
            "tab": ["n1"]
        }
    },
    "textbook": {
        "N": {
            "tab": ["n1"]
        }
    },
    "textile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "texture": {
        "N": {
            "tab": ["n1"]
        }
    },
    "than":{"P":{"tab":["pp"]}},
    "thank": {
        "V": {
            "tab": "v1"
        }
    },
    "thanks": {
        "N": {
            "tab": ["n6"]
        }
    },
    "that": {
        "Pro":{"tab":["pn6"]},
        "Adv": {
            "tab": ["b1"]
        },
        "D": {
            "tab": ["d3"]
        }
    },
    "the": {
        "D": {
            "tab": ["d4"]
        }
    },
    "theatre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "theft": {
        "N": {
            "tab": ["n1"]
        }
    },
    "theme": {
        "N": {
            "tab": ["n1"]
        }
    },
    "then": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "theology": {
        "N": {
            "tab": ["n3"]
        }
    },
    "theoretical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "theorist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "theory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "therapist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "therapy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "thereafter": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "thereby": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "therefore": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "these": {
        "Pro": {
            "tab": ["pn8"]
        }
    },
    "thesis": {
        "N": {
            "tab": ["n8"]
        }
    },
    "thick": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "thief": {
        "N": {
            "tab": ["n9"]
        }
    },
    "thigh": {
        "N": {
            "tab": ["n1"]
        }
    },
    "thin": {
        "A": {
            "tab": ["a10"]
        }
    },
    "thing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "think": {
        "V": {
            "tab": "v45"
        }
    },
    "thinking": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n5"]
        }
    },
    "this": {
        "Adv": {
            "tab": ["b1"]
        },
        "Pro": {
            "tab": ["pn8"]
        },
        "D": {
            "tab": ["d5"]
        }
    },
    "thorough": {
        "A": {
            "tab": ["a1"]
        }
    },
    "thoroughly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "though": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "thought": {
        "N": {
            "tab": ["n1"]
        }
    },
    "thread": {
        "N": {
            "tab": ["n1"]
        }
    },
    "threat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "threaten": {
        "V": {
            "tab": "v1"
        }
    },
    "threshold": {
        "N": {
            "tab": ["n1"]
        }
    },
    "throat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "throne": {
        "N": {
            "tab": ["n1"]
        }
    },
    "through": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "throughout": {
        "P": {
            "tab": ["pp"]
        }
    },
    "throw": {
        "V": {
            "tab": "v27"
        }
    },
    "thrust": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v18"
        }
    },
    "thumb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "thus": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "tick": {
        "V": {
            "tab": "v1"
        }
    },
    "ticket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tide": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tie": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v28"
        }
    },
    "tiger": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tight": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "tighten": {
        "V": {
            "tab": "v1"
        }
    },
    "tightly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "tile": {
        "N": {
            "tab": ["n1"]
        }
    },
    "till": {
        "P": {
            "tab": ["pp"]
        }
    },
    "timber": {
        "N": {
            "tab": ["n1"]
        }
    },
    "time": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "timetable": {
        "N": {
            "tab": ["n1"]
        }
    },
    "timing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tiny": {
        "A": {
            "tab": ["a4"]
        }
    },
    "tip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "tired": {
        "A": {
            "tab": ["a1"]
        }
    },
    "tissue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "title": {
        "N": {
            "tab": ["n1"]
        }
    },
    "to": {
        "P": {
            "tab": ["pp"]
        }
    },
    "toast": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tobacco": {
        "N": {
            "tab": ["n1"]
        }
    },
    "today": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "toe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "together": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "toilet": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tolerate": {
        "V": {
            "tab": "v3"
        }
    },
    "toll": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tomato": {
        "N": {
            "tab": ["n2"]
        }
    },
    "tomorrow": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "ton": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tone": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tongue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tonight": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "tonne": {
        "N": {
            "tab": ["n1"]
        }
    },
    "too":{"Adv":{"tab":["b1"]}},
    "tool": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tooth": {
        "N": {
            "tab": ["n20"]
        }
    },
    "top": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "topic": {
        "N": {
            "tab": ["n1"]
        }
    },
    "torch": {
        "N": {
            "tab": ["n2"]
        }
    },
    "toss": {
        "V": {
            "tab": "v2"
        }
    },
    "total": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "totally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "touch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "tough": {
        "A": {
            "tab": ["a3"]
        }
    },
    "tour": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "tourism": {
        "N": {
            "tab": ["n5"]
        }
    },
    "tourist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tournament": {
        "N": {
            "tab": ["n1"]
        }
    },
    "toward": {
        "P": {
            "tab": ["pp"]
        }
    },
    "towards": {
        "P": {
            "tab": ["pp"]
        }
    },
    "towel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tower": {
        "N": {
            "tab": ["n1"]
        }
    },
    "town": {
        "N": {
            "tab": ["n1"]
        }
    },
    "toxic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "toy": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trace": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "track": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "tract": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trade": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "trader": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tradition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "traditional": {
        "A": {
            "tab": ["a1"]
        }
    },
    "traditionally": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "traffic": {
        "N": {
            "tab": ["n5"]
        }
    },
    "tragedy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "tragic": {
        "A": {
            "tab": ["a1"]
        }
    },
    "trail": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "train": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "trainee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trainer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "training": {
        "N": {
            "tab": ["n5"]
        }
    },
    "trait": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transaction": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transcription": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transfer": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v13"
        }
    },
    "transform": {
        "V": {
            "tab": "v1"
        }
    },
    "transformation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transition": {
        "N": {
            "tab": ["n1"]
        }
    },
    "translate": {
        "V": {
            "tab": "v3"
        }
    },
    "translation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transmission": {
        "N": {
            "tab": ["n1"]
        }
    },
    "transmit": {
        "V": {
            "tab": "v14"
        }
    },
    "transport": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "trap": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "travel": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v9"
        }
    },
    "traveller": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tray": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tread": {
        "V": {
            "tab": "v141"
        }
    },
    "treasure": {
        "N": {
            "tab": ["n1"]
        }
    },
    "treasurer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "treasury": {
        "N": {
            "tab": ["n3"]
        }
    },
    "treat": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "treatment": {
        "N": {
            "tab": ["n1"]
        }
    },
    "treaty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "tree": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tremble": {
        "V": {
            "tab": "v3"
        }
    },
    "tremendous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "trench": {
        "N": {
            "tab": ["n2"]
        }
    },
    "trend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trial": {
        "N": {
            "tab": ["n1"]
        }
    },
    "triangle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tribe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tribunal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tribute": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trick": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trigger": {
        "V": {
            "tab": "v1"
        }
    },
    "trip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "triumph": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trivial": {
        "A": {
            "tab": ["a1"]
        }
    },
    "trolley": {
        "N": {
            "tab": ["n1"]
        }
    },
    "troop": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trophy": {
        "N": {
            "tab": ["n3"]
        }
    },
    "tropical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "trouble": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "trouser": {
        "N": {
            "tab": ["n1"]
        }
    },
    "truck": {
        "N": {
            "tab": ["n1"]
        }
    },
    "true": {
        "A": {
            "tab": ["a2"]
        }
    },
    "truly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "trunk": {
        "N": {
            "tab": ["n1"]
        }
    },
    "trust": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "trustee": {
        "N": {
            "tab": ["n1"]
        }
    },
    "truth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "try": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "tube": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tuck": {
        "V": {
            "tab": "v1"
        }
    },
    "tumble": {
        "V": {
            "tab": "v3"
        }
    },
    "tumour": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tune": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "tunnel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "turkey": {
        "N": {
            "tab": ["n1"]
        }
    },
    "turn": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "turnover": {
        "N": {
            "tab": ["n1"]
        }
    },
    "tutor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "twin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "twist": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "type": {
        "N": {
            "tab": ["n1"]
        }
    },
    "typical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "typically": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "tyre": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ugly": {
        "A": {
            "tab": ["a4"]
        }
    },
    "ulcer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ultimate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "ultimately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "umbrella": {
        "N": {
            "tab": ["n1"]
        }
    },
    "unable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unacceptable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unaware": {
        "A": {
            "tab": ["a1"]
        }
    },
    "uncertain": {
        "A": {
            "tab": ["a1"]
        }
    },
    "uncertainty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "uncle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "uncomfortable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unconscious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "uncover": {
        "V": {
            "tab": "v1"
        }
    },
    "under": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "undergo": {
        "V": {
            "tab": "v48"
        }
    },
    "underground": {
        "A": {
            "tab": ["a1"]
        }
    },
    "underline": {
        "V": {
            "tab": "v3"
        }
    },
    "undermine": {
        "V": {
            "tab": "v3"
        }
    },
    "underneath": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "understand": {
        "V": {
            "tab": "v37"
        }
    },
    "understandable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "understanding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "undertake": {
        "V": {
            "tab": "v20"
        }
    },
    "undertaking": {
        "N": {
            "tab": ["n1"]
        }
    },
    "undoubtedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "uneasy": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unemployed": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unemployment": {
        "N": {
            "tab": ["n5"]
        }
    },
    "unexpected": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unexpectedly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "unfair": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unfamiliar": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unfortunate": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unfortunately": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "unhappy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "uniform": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "union": {
        "N": {
            "tab": ["n1"]
        }
    },
    "unionist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "unique": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "unite": {
        "V": {
            "tab": "v3"
        }
    },
    "united": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "universal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "universe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "university": {
        "N": {
            "tab": ["n3"]
        }
    },
    "unknown": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unlike": {
        "A": {
            "tab": ["a1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "unlikely": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unnecessary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unpleasant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unprecedented": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unreasonable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unrest": {
        "N": {
            "tab": ["n5"]
        }
    },
    "unsuccessful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "until": {
        "P": {
            "tab": ["pp"]
        }
    },
    "unusual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "unusually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "unwilling": {
        "A": {
            "tab": ["a1"]
        }
    },
    "up": {
        "P": {
            "tab": ["pp"]
        },
        "Adv":{"tab":["b1"]}
    },
    "update": {
        "V": {
            "tab": "v3"
        }
    },
    "upgrade": {
        "V": {
            "tab": "v3"
        }
    },
    "uphold": {
        "V": {
            "tab": "v34"
        }
    },
    "upon": {
        "P": {
            "tab": ["pp"]
        }
    },
    "upper": {
        "A": {
            "tab": ["a1"]
        }
    },
    "upset": {
        "V": {
            "tab": "v17"
        }
    },
    "upstairs": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "up-to-date": {
        "A": {
            "tab": ["a1"]
        }
    },
    "upwards": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "urban": {
        "A": {
            "tab": ["a1"]
        }
    },
    "urge": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "urgency": {
        "N": {
            "tab": ["n5"]
        }
    },
    "urgent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "urgently": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "urine": {
        "N": {
            "tab": ["n5"]
        }
    },
    "usage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "use": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "used": {
        "A": {
            "tab": ["a1"]
        }
    },
    "useful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "useless": {
        "A": {
            "tab": ["a1"]
        }
    },
    "user": {
        "N": {
            "tab": ["n1"]
        }
    },
    "usual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "usually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "utility": {
        "N": {
            "tab": ["n3"]
        }
    },
    "utter": {
        "V": {
            "tab": "v1"
        }
    },
    "utterance": {
        "N": {
            "tab": ["n1"]
        }
    },
    "utterly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "vacant": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vacuum": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vague": {
        "A": {
            "tab": ["a2"]
        }
    },
    "vaguely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "valid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "validity": {
        "N": {
            "tab": ["n5"]
        }
    },
    "valley": {
        "N": {
            "tab": ["n1"]
        }
    },
    "valuable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "valuation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "value": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "valve": {
        "N": {
            "tab": ["n1"]
        }
    },
    "van": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vanish": {
        "V": {
            "tab": "v2"
        }
    },
    "variable": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "variant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "variation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "varied": {
        "A": {
            "tab": ["a1"]
        }
    },
    "variety": {
        "N": {
            "tab": ["n3"]
        }
    },
    "various": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vary": {
        "V": {
            "tab": "v4"
        }
    },
    "vast": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vat": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vegetable": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vegetation": {
        "N": {
            "tab": ["n5"]
        }
    },
    "vehicle": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vein": {
        "N": {
            "tab": ["n1"]
        }
    },
    "velocity": {
        "N": {
            "tab": ["n3"]
        }
    },
    "velvet": {
        "N": {
            "tab": ["n5"]
        }
    },
    "vendor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "venture": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "venue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "verb": {
        "N": {
            "tab": ["n1"]
        }
    },
    "verbal": {
        "A": {
            "tab": ["a1"]
        }
    },
    "verdict": {
        "N": {
            "tab": ["n1"]
        }
    },
    "verse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "version": {
        "N": {
            "tab": ["n1"]
        }
    },
    "versus": {
        "P": {
            "tab": ["pp"]
        }
    },
    "vertical": {
        "A": {
            "tab": ["a1"]
        }
    },
    "very": {
        "A": {
            "tab": ["a1"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "vessel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "veteran": {
        "N": {
            "tab": ["n1"]
        }
    },
    "via": {
        "P": {
            "tab": ["pp"]
        }
    },
    "viable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vicar": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vicious": {
        "A": {
            "tab": ["a1"]
        }
    },
    "victim": {
        "N": {
            "tab": ["n1"]
        }
    },
    "victory": {
        "N": {
            "tab": ["n3"]
        }
    },
    "video": {
        "N": {
            "tab": ["n1"]
        }
    },
    "view": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "viewer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "viewpoint": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vigorous": {
        "A": {
            "tab": ["a1"]
        }
    },
    "villa": {
        "N": {
            "tab": ["n1"]
        }
    },
    "village": {
        "N": {
            "tab": ["n1"]
        }
    },
    "villager": {
        "N": {
            "tab": ["n1"]
        }
    },
    "violation": {
        "N": {
            "tab": ["n1"]
        }
    },
    "violence": {
        "N": {
            "tab": ["n5"]
        }
    },
    "violent": {
        "A": {
            "tab": ["a1"]
        }
    },
    "virgin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "virtual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "virtually": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "virtue": {
        "N": {
            "tab": ["n1"]
        }
    },
    "virus": {
        "N": {
            "tab": ["n2"]
        }
    },
    "visible": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vision": {
        "N": {
            "tab": ["n1"]
        }
    },
    "visit": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "visitor": {
        "N": {
            "tab": ["n1"]
        }
    },
    "visual": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vital": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vitamin": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vivid": {
        "A": {
            "tab": ["a1"]
        }
    },
    "vocabulary": {
        "N": {
            "tab": ["n3"]
        }
    },
    "vocational": {
        "A": {
            "tab": ["a1"]
        }
    },
    "voice": {
        "N": {
            "tab": ["n1"]
        }
    },
    "voltage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "volume": {
        "N": {
            "tab": ["n1"]
        }
    },
    "voluntary": {
        "A": {
            "tab": ["a1"]
        }
    },
    "volunteer": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "vote": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "voter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "voucher": {
        "N": {
            "tab": ["n1"]
        }
    },
    "voyage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "vulnerable": {
        "A": {
            "tab": ["a1"]
        }
    },
    "wage": {
        "N": {
            "tab": ["n1"]
        }
    },
    "waist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wait": {
        "V": {
            "tab": "v1"
        }
    },
    "waiter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wake": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v164"
        }
    },
    "walk": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "walker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wall": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wander": {
        "V": {
            "tab": "v1"
        }
    },
    "want": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "war": {
        "N": {
            "tab": ["n1"]
        }
    },
    "ward": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wardrobe": {
        "N": {
            "tab": ["n1"]
        }
    },
    "warehouse": {
        "N": {
            "tab": ["n1"]
        }
    },
    "warm": {
        "A": {
            "tab": ["a3"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "warmth": {
        "N": {
            "tab": ["n5"]
        }
    },
    "warn": {
        "V": {
            "tab": "v1"
        }
    },
    "warning": {
        "N": {
            "tab": ["n1"]
        }
    },
    "warrant": {
        "N": {
            "tab": ["n1"]
        }
    },
    "warranty": {
        "N": {
            "tab": ["n3"]
        }
    },
    "warrior": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wartime": {
        "N": {
            "tab": ["n5"]
        }
    },
    "wary": {
        "A": {
            "tab": ["a4"]
        }
    },
    "wash": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "washing": {
        "N": {
            "tab": ["n5"]
        }
    },
    "waste": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "watch": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "water": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wave": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "way": {
        "N": {
            "tab": ["n1"]
        }
    },
    "weak": {
        "A": {
            "tab": ["a3"]
        }
    },
    "weaken": {
        "V": {
            "tab": "v1"
        }
    },
    "weakness": {
        "N": {
            "tab": ["n2"]
        }
    },
    "wealth": {
        "N": {
            "tab": ["n5"]
        }
    },
    "wealthy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "weapon": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wear": {
        "V": {
            "tab": "v30"
        }
    },
    "weather": {
        "N": {
            "tab": ["n1"]
        }
    },
    "weave": {
        "V": {
            "tab": "v69"
        }
    },
    "wedding": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wee": {
        "A": {
            "tab": ["a1"]
        }
    },
    "weed": {
        "N": {
            "tab": ["n1"]
        }
    },
    "week": {
        "N": {
            "tab": ["n1"]
        }
    },
    "weekend": {
        "N": {
            "tab": ["n1"]
        }
    },
    "weekly": {
        "A": {
            "tab": ["a1"]
        }
    },
    "weep": {
        "V": {
            "tab": "v29"
        }
    },
    "weigh": {
        "V": {
            "tab": "v1"
        }
    },
    "weight": {
        "N": {
            "tab": ["n1"]
        }
    },
    "weird": {
        "A": {
            "tab": ["a3"]
        }
    },
    "welcome": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v3"
        }
    },
    "welfare": {
        "N": {
            "tab": ["n5"]
        }
    },
    "well": {
        "A": {
            "tab": ["a19"]
        },
        "Adv": {
            "tab": ["b3"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "well-known": {
        "A": {
            "tab": ["a1"]
        }
    },
    "west": {
        "N": {
            "tab": ["n5"]
        }
    },
    "western": {
        "A": {
            "tab": ["a1"]
        }
    },
    "wet": {
        "A": {
            "tab": ["a11"]
        },
        "V": {
            "tab": "v17"
        }
    },
    "whale": {
        "N": {
            "tab": ["n1"]
        }
    },
    "what": {
        "D": {
            "tab": ["d4"]
        }
    },
    "whatever": {
        "D": {
            "tab": ["d4"]
        }
    },
    "whatsoever": {
        "D": {
            "tab": ["d4"]
        }
    },
    "wheat": {
        "N": {
            "tab": ["n5"]
        }
    },
    "wheel": {
        "N": {
            "tab": ["n1"]
        }
    },
    "when":{"C":{"tab":["cs"]}},
    "whenever": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "where": {
        "Pro": {
            "tab": ["pn6"]
        }
    },
    "which": {
        "D": {
            "tab": ["d4"]
        }
    },
    "whichever": {
        "D": {
            "tab": ["d4"]
        }
    },
    "while": {
        "N": {
            "tab": ["n5"]
        }
    },
    "whip": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v12"
        }
    },
    "whisky": {
        "N": {
            "tab": ["n3"]
        }
    },
    "whisper": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "white": {
        "A": {
            "tab": ["a2"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "who": {
        "Pro": {
            "tab": ["pn6"]
        }
    },
    "whoever": {
        "Pro": {
            "tab": ["pn6"]
        }
    },
    "whole": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "wholly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "whom": {
        "Pro": {
            "tab": ["pn6"]
        }
    },
    "whose": {
        "D": {
            "tab": ["d4"]
        }
    },
    "why": {
        "Pro": {
            "tab": ["pn6"]
        }
    },
    "wicked": {
        "A": {
            "tab": ["a1"]
        }
    },
    "wicket": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wide": {
        "A": {
            "tab": ["a2"]
        },
        "Adv": {
            "tab": ["b1"]
        }
    },
    "widely": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "widen": {
        "V": {
            "tab": "v1"
        }
    },
    "widespread": {
        "A": {
            "tab": ["a1"]
        }
    },
    "widow": {
        "N": {
            "tab": ["n1"]
        }
    },
    "width": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wife": {
        "N": {
            "g": "f",
            "tab": ["n91"]
        }
    },
    "wild": {
        "A": {
            "tab": ["a3"]
        }
    },
    "wildly": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "will": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v81"
        }
    },
    "willing": {
        "A": {
            "tab": ["a1"]
        }
    },
    "willingness": {
        "N": {
            "tab": ["n5"]
        }
    },
    "win": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v105"
        }
    },
    "wind": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v25"
        }
    },
    "window": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wine": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "winner": {
        "N": {
            "tab": ["n1"]
        }
    },
    "winter": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wipe": {
        "V": {
            "tab": "v3"
        }
    },
    "wire": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wisdom": {
        "N": {
            "tab": ["n5"]
        }
    },
    "wise": {
        "A": {
            "tab": ["a2"]
        }
    },
    "wish": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "wit": {
        "N": {
            "tab": ["n1"]
        }
    },
    "witch": {
        "N": {
            "g": "f",
            "tab": ["n88"]
        }
    },
    "with": {
        "P": {
            "tab": ["pp"]
        }
    },
    "withdraw": {
        "V": {
            "tab": "v54"
        }
    },
    "withdrawal": {
        "N": {
            "tab": ["n1"]
        }
    },
    "within": {
        "Adv": {
            "tab": ["b1"]
        },
        "P": {
            "tab": ["pp"]
        }
    },
    "without": {
        "P": {
            "tab": ["pp"]
        }
    },
    "witness": {
        "N": {
            "tab": ["n2"]
        },
        "V": {
            "tab": "v2"
        }
    },
    "wolf": {
        "N": {
            "tab": ["n9"]
        }
    },
    "woman": {
        "N": {
            "g": "f",
            "tab": ["n90"]
        }
    },
    "wonder": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "wonderful": {
        "A": {
            "tab": ["a1"]
        }
    },
    "wood": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wooden": {
        "A": {
            "tab": ["a1"]
        }
    },
    "woodland": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wool": {
        "N": {
            "tab": ["n1"]
        }
    },
    "word": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wording": {
        "N": {
            "tab": ["n1"]
        }
    },
    "work": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v94"
        }
    },
    "worker": {
        "N": {
            "tab": ["n1"]
        }
    },
    "workforce": {
        "N": {
            "tab": ["n1"]
        }
    },
    "working": {
        "A": {
            "tab": ["a1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "working-class": {
        "A": {
            "tab": ["a1"]
        }
    },
    "workplace": {
        "N": {
            "tab": ["n1"]
        }
    },
    "workshop": {
        "N": {
            "tab": ["n1"]
        }
    },
    "world": {
        "N": {
            "tab": ["n1"]
        }
    },
    "worldwide": {
        "A": {
            "tab": ["a1"]
        }
    },
    "worm": {
        "N": {
            "tab": ["n1"]
        }
    },
    "worried": {
        "A": {
            "tab": ["a1"]
        }
    },
    "worry": {
        "N": {
            "tab": ["n3"]
        },
        "V": {
            "tab": "v4"
        }
    },
    "worrying": {
        "A": {
            "tab": ["a1"]
        }
    },
    "worship": {
        "N": {
            "tab": ["n5"]
        }
    },
    "worth": {
        "N": {
            "tab": ["n5"]
        }
    },
    "worthwhile": {
        "A": {
            "tab": ["a1"]
        }
    },
    "worthy": {
        "A": {
            "tab": ["a4"]
        }
    },
    "wound": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "wrap": {
        "V": {
            "tab": "v12"
        }
    },
    "wrist": {
        "N": {
            "tab": ["n1"]
        }
    },
    "write": {
        "V": {
            "tab": "v36"
        }
    },
    "writer": {
        "N": {
            "tab": ["n1"]
        }
    },
    "writing": {
        "N": {
            "tab": ["n1"]
        }
    },
    "wrong": {
        "A": {
            "tab": ["a3"]
        },
        "Adv": {
            "tab": ["b1"]
        },
        "N": {
            "tab": ["n1"]
        }
    },
    "yacht": {
        "N": {
            "tab": ["n1"]
        }
    },
    "yard": {
        "N": {
            "tab": ["n1"]
        }
    },
    "yarn": {
        "N": {
            "tab": ["n1"]
        }
    },
    "year": {
        "N": {
            "tab": ["n1"]
        }
    },
    "yell": {
        "V": {
            "tab": "v1"
        }
    },
    "yellow": {
        "A": {
            "tab": ["a3"]
        }
    },
    "yes": {
        "N": {
            "tab": ["n2"]
        }
    },
    "yesterday": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "yet": {
        "Adv": {
            "tab": ["b1"]
        }
    },
    "yield": {
        "N": {
            "tab": ["n1"]
        },
        "V": {
            "tab": "v1"
        }
    },
    "young": {
        "A": {
            "tab": ["a3"]
        }
    },
    "youngster": {
        "N": {
            "tab": ["n1"]
        }
    },
    "youth": {
        "N": {
            "tab": ["n1"]
        }
    },
    "zero": {
        "N": {
            "tab": ["n1"]
        }
    },
    "zone": {
        "N": {
            "tab": ["n1"]
        }
    },
    "zoo": {
        "N": {
            "tab": ["n1"]
        }
    }
}
//========== addLexicon-en.js
loadEn(false,true); // make sure additions are to the English lexicon
// ajouts au lexique anglais de JSrealB 
addToLexicon("tsunami",{"N":{"tab":["n1"]}});
if (typeof module !== 'undefined' && module.exports) {
    //// exports pour node.js
    //  Terminaux
    exports.N=N;
    exports.A=A;
    exports.Pro=Pro;
    exports.D=D;
    exports.V=V;
    exports.Adv=Adv;
    exports.P=P;
    exports.C=C;
    exports.Q=Q;
    // Syntagmes
    exports.S=S;
    exports.SP=SP;
    exports.CP=CP;
    exports.VP=VP;
    exports.NP=NP;
    exports.AP=AP;
    exports.PP=PP;
    exports.AdvP=AdvP;

    exports.DT=DT; // dates
    exports.NO=NO; // nombres

    exports.addToLexicon=addToLexicon;
    exports.getLemma=getLemma;
    exports.oneOf=oneOf;
    
    exports.jsRealB_dateCreated=jsRealB_dateCreated;
    exports.jsRealB_version=jsRealB_version;
    
    // lemmatization
    exports.nbForms=nbForms;
    exports.lemma2jsRexps=lemma2jsRexps;
    exports.buildLemmata=buildLemmata;
    exports.showLemmata=showLemmata;
    exports.form2lemma=form2lemma;
    exports.checkAmbiguities=checkAmbiguities;

    if (typeof lexiconEn !== "undefined") exports.lexiconEn=lexiconEn;
    if (typeof loadEn    !== "undefined") exports.loadEn=loadEn;
    if (typeof lexiconFr !== "undefined") exports.lexiconFr=lexiconFr;
    if (typeof loadFr    !== "undefined") exports.loadFr=loadFr;
}