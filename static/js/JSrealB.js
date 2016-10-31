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

    var naturalDisplay = true;
    if(this.transformation === JSrealE.ruleType.date)
    {
        this.unit = elts;
    }
    else if(this.transformation === JSrealE.ruleType.number)
    {
        naturalDisplay = false;
        this.unit = elts;
    }
    else if(isString(elts))
    {
        this.unit = elts;
        this.initUnitProperty();
    }
    else if(Array.isArray(elts) || isObject(elts))
    {
        this.elements = elts;
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
    {
        this.defaultProp[JSrealB.Config.get("feature.number.alias")] = JSrealB.Config.get("feature.number.singular");
        this.defaultProp[JSrealB.Config.get("feature.owner.alias")] = JSrealB.Config.get("feature.owner.singular");
        
        if(this.category === JSrealB.Config.get("feature.category.word.verb")
                || this.category === JSrealB.Config.get("feature.category.phrase.verb"))
        {
            this.defaultProp[JSrealB.Config.get("feature.tense.alias")] = JSrealB.Config.get("feature.tense.base"); // Infinitif present ou base form
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
            this.defaultProp[JSrealB.Config.get("feature.gender.alias")] = JSrealB.Config.get("feature.gender.masculine");
        }
        
        // default person
        var unitPerson = (unitFeature !== null) ? unitFeature[JSrealB.Config.get("feature.person.alias")] : undefined;
        if(unitPerson !== undefined)
        {
            this.defaultProp[JSrealB.Config.get("feature.person.alias")] = unitPerson;
        }
        else
        {
            this.defaultProp[JSrealB.Config.get("feature.person.alias")] = JSrealB.Config.get("feature.person.p3");
        }
    }
};

JSrealE.prototype.initContext = function(naturalDisplay) {
    this.ctx[JSrealB.Config.get("feature.display_option.alias")] = {};
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

//// Word Features / Properties
// tense
JSrealE.prototype.t = function(tense) {
    if(!contains(JSrealB.Config.get("feature.tense"), tense))
    {
        throw JSrealB.Exception.invalidInput(tense, "tense");
    }
    return this.setProp(JSrealB.Config.get("feature.tense.alias"), tense);
};
// person
JSrealE.prototype.pe = function(person) {
    if(!isNumeric(person) || person < 1 || person > 3)
    {
        throw JSrealB.Exception.invalidInput(person, "person");
    }
    return this.setProp(JSrealB.Config.get("feature.person.alias"), (isString(person) ? intVal(person) : person));
};
 // grammatical gender
JSrealE.prototype.g = function(grammaticalGender) {
    if(!contains(JSrealB.Config.get("feature.gender"), grammaticalGender))
    {
        throw JSrealB.Exception.invalidInput(grammaticalGender, "gender");
    }
    return this.setProp(JSrealB.Config.get("feature.gender.alias"), grammaticalGender);
};
// grammatical number
JSrealE.prototype.n = function(grammaticalNumber) {
    if(!contains(JSrealB.Config.get("feature.number"), grammaticalNumber))
    {
        throw JSrealB.Exception.invalidInput(grammaticalNumber, "number");
    }
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
    return this.setProp(JSrealB.Config.get("feature.owner.alias"), owner);
};

//// Typography / Html / Context
// first char in upper case
JSrealE.prototype.cap = function(ucf) {
    if(!isBoolean(ucf) && ucf !== undefined)
    {
        throw JSrealB.Exception.invalidInput(ucf, "ucf");
    }
    return this.setCtx(JSrealB.Config.get("feature.typography.ucfist"), (ucf === undefined || ucf === true));
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
    return this.setCtx(JSrealB.Config.get("feature.typography.surround"), punctuation);
};
// Coordination
JSrealE.prototype.c = function(wordOrPunctuation) {
    return this.setCtx(JSrealB.Config.get("feature.category.word.conjunction"), wordOrPunctuation);
};
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
    this.setCtx(JSrealB.Config.get("feature.html.element"), elt);
    this.setCtx(JSrealB.Config.get("feature.html.attribute"), attr);
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
        this.sortWord();
        if(this.constituents.head !== undefined)
        {
            var eltList = this.createRealizationList();
            this.realizeGroup(eltList);
            this.realization = this.printElements();
            return this.typography(this.html(this.phonetic(this.realization)));
        }
        else
        {
            throw JSrealB.Exception.headWordNotFound(this.category);
        }
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
    for(i = 0, length = elementList.length; i < length; i++)
    {
        e = elementList[i];
        
        e.parent = this.category;
        
        this.phraseToElementPropagation(e);

        e.realization = (e instanceof JSrealE) ? e.real() : "";
        
        this.elementToElementPropagation(e);
        this.elementToPhrasePropagation(e);
    }
};

JSrealE.prototype.printElements = function() {
    var elementList = this.elements;
    
    var separator = " ";
    var lastSeparator = " ";
    
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
    
    // SENTENCE
    var addFullStop = false;
    var upperCaseFirstLetter = false;
    if(this.parent === null
        && this.category === JSrealB.Config.get("feature.category.phrase.sentence"))
    {
        addFullStop = (this.getCtx(JSrealB.Config.get("feature.typography.surround")) === null);
        upperCaseFirstLetter = (this.getCtx(JSrealB.Config.get("feature.typography.ucfist")) === null);
    }
    
    result = phraseFormatting(result, upperCaseFirstLetter, addFullStop);
    
    return result;
};

JSrealE.prototype.printEachElement = function(elementList, separator, lastSeparator) {
    var result = "";
    var i, listLength;
    var currentSeparator = "";
    var e = null;
    for(i = 0, listLength = elementList.length; i < listLength; i++)
    {
        e = elementList[i];
        
        if(i === listLength - 1) // dernier
        {
            currentSeparator = "";
        }
        else if(i === listLength - 2) // avant dernier
        {
            currentSeparator = lastSeparator;
        }
        else
        {
            currentSeparator = separator;
        }

        if(e instanceof JSrealE)
        {
            if(e.realization !== null && e.realization !== undefined)
            {
                result += e.realization + currentSeparator;
            }
            else if(e.unit !== null && e.unit !== undefined)
            {
                result += "[[" + e.unit + "]]" + currentSeparator;
            }
            else
            {
                JSrealB.Logger.alert("Undefined unit and realization attributes of element : " + JSON.stringify(e));
            }
        }
        else if(isString(e))
        {
            result += e + currentSeparator;
        }
    }
    
    return result;
};

JSrealE.prototype.realizeTerminalElement = function() {
    if(this.elements.length === 0)
    {
        if(this.transformation === JSrealE.ruleType.declension)
        {
            return this.realizeDeclension();
        }
        else if(this.transformation === JSrealE.ruleType.conjugation)
        {
            return this.realizeConjugation();
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

JSrealE.prototype.realizeConjugation = function() {
    var tense = this.getProp(JSrealB.Config.get("feature.tense.alias"));
    var person = this.getProp(JSrealB.Config.get("feature.person.alias"));
    var number = this.getProp(JSrealB.Config.get("feature.number.alias"));

    if(number === JSrealB.Config.get("feature.number.plural"))
    {
        person += 3;
    }
    
    return JSrealB.Module.Conjugation.conjugate(this.unit, tense, person);
};

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
    
    if(this.getCtx(JSrealB.Config.get("feature.display_option.alias")
            + "." + JSrealB.Config.get("feature.display_option.raw")))
    {
        return number.toString();
    }
    else if(this.getCtx(JSrealB.Config.get("feature.display_option.alias") 
            + "." + JSrealB.Config.get("feature.display_option.natural")))
    {        
        return JSrealB.Module.Number.toWord(number, 
                this.getCtx(JSrealB.Config.get("feature.display_option.alias")
                + "." + JSrealB.Config.get("feature.display_option.max_precision")), 
                updateGrammaticalNumber).toString();
    }
    else
    {        
        return JSrealB.Module.Number.formatter(number, 
                this.getCtx(JSrealB.Config.get("feature.display_option.alias")
                + "." + JSrealB.Config.get("feature.display_option.max_precision")), 
                updateGrammaticalNumber).toString();
    }
};

JSrealE.prototype.typography = function(str) {
    var result = str;
    if(this.getCtx(JSrealB.Config.get("feature.typography.ucfist")) === true)
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
    
    var pcSurround = this.getCtx(JSrealB.Config.get("feature.typography.surround"));
    if(pcSurround !== null)
    {
        result = JSrealB.Module.Punctuation.surround(result, pcSurround);
    }
    
    return trim(result);
};

JSrealE.prototype.html = function(content) {
    var output = content;
    
    var elt = this.getCtx(JSrealB.Config.get("feature.html.element"));
    var attr = this.getCtx(JSrealB.Config.get("feature.html.attribute"));
    if(elt !== null)
    {
        var attrStr = "";
        if(attr !== null)
        {
            var attrKeyList = Object.keys(attr);
            var length = attrKeyList.length;
            for(var i = 0; i < length; i++)
            {
                attrStr += " " + attrKeyList[i] + '="' + attr[attrKeyList[i]] + '"';
            }
        }
        output = "<" + elt + attrStr + ">" + output + "</" + elt + ">";
    }
    return output;
};

JSrealE.prototype.phonetic = function(content) {
    var newContent = content;
    
    // patch pour l'élision et la contraction en français
    if (JSrealB.Config.get("language")=="fr"){
//        var mots=newContent.split(" ");
        var htmlTagRegex =/\s*(<[^>]*>)|\s+/ig;
        var mots = newContent.split(htmlTagRegex);
        for(var i = 0, length1 = mots.length; i < length1; i++) { if(mots[i] === undefined) mots.splice(i, 1); } // fix : remove undefined
        var length2=mots.length;
        if(length2>=2){
             // crée des Tokens qui devraient venir d'ailleurs...
            var tokens=mots.map(function(mot){return new Tokn(mot)});
//            newContent=eliderMots([tokens.shift()],tokens).map(function(token){return token.toString()}).join(" "); // Edit by Paul
            tokens = eliderMots([tokens.shift()],tokens);
            newContent = "";
            for(var j = 0, length3 = tokens.length; j < length3; j++)
            {
                newContent += tokens[j] + ((tokens[j].mot.charAt(0) === "<" 
                        || (j+1 < length3 && tokens[j+1].mot.slice(0, 2) === "</")
                        || j+1 >= length3) ? "" : " ");
            }
        }
    }

    return newContent;
};

//// Utils
var phraseFormatting = function(str, upperCaseFirstLetter, addFullStop) {
    // replace multiple spaces with a single space
    var newString = str.replace(/\s{2,}/g, ' ');
    
    if(upperCaseFirstLetter)
    {
        var stringWithoutLeftHtml = stripLeftHtml(newString);
        newString = ((newString.charAt(0) === "<") ? newString.slice(0, newString.indexOf(stringWithoutLeftHtml)) : "") 
            + stringWithoutLeftHtml.charAt(0).toUpperCase() + stringWithoutLeftHtml.slice(1); // first char in upper case
    }
    
    if(addFullStop)
    {
        newString = JSrealB.Module.Punctuation.after(newString, "."); // add full stop
    }
    
    newString = trim(newString);
    
    return newString;
};

//// "module cheap" d'élision en français
// appelé dans phraseFormatting
var voyellesAccentuees="àäéèêëïîöôùû";
var voyelles="aeiou"+voyellesAccentuees;

var elidables = ["la","ma","ta","sa",
                 "le","me","te","se","ce","de","ne","je",
                 "si",
                 "qui","que","jusque","lorsque","puisque","quoique"];

// règles de http://www.aidenet.eu/grammaire01b.htm
// Tokn au lieu de Token utilisé dans IDE...
function Tokn(mot){ // normalement on aurait besoin du lemme et de la catégorie 
    this.mot=mot;
    this.capitalized=false;
    var c=mot.charAt(0);
    if(c==c.toUpperCase()){
        c=c.toLowerCase();
        this.mot=c+this.mot.substring(1);
        this.capitalized=true;
    }
    this.elidable=elidables.indexOf(this.mot)>=0;
    this.voyelleOuHmuet=false;
    if(voyelles.indexOf(c)>=0){
        this.voyelleOuHmuet=true;
        return;
    }
    if(c==="h"){
        var lex=JSrealB.Config.get("lexicon")[this.mot];
        if (lex){// on devrait avoir l'info de la catégorie... et sur le lemme.
            // ici on cherche dans la première en supposant que le mot est un lemme 
            for (cat in lex){
                if (!lex[cat].h){
                    this.voyelleOuHmuet=true;
                    break;
                }
            }
        }
        else
        {
            this.voyelleOuHmuet=true;
        }
    }
}

Tokn.prototype.toString = function (){
    if (this.capitalized)return this.mot.charAt(0).toUpperCase()+this.mot.substring(1);
    return this.mot;
}

// pour la mise au point
function showTokens(tokens){
    return "["+tokens.map(function(token){return token.toString()}).join(",")+"]";
}

function removeLastLetter(str){return str.substring(0,str.length-1)}
function remplaceToken(tokens,i,newMot){
    tokens[i].mot=newMot;
    tokens.splice(i+1,1);//enlever le prochain token
}

function contracter(tokens){
    // appliquer les contractions à le=> au, "à les"=> aux, "de le"=>du, "de les"=>"des", "de des"=> "de", "des autres"=>"d'autres"
    for(var i=0;i<tokens.length-1;i++){
        var motI=tokens[i].mot;
        var motI1=tokens[i+1].mot;
        if(motI=="à"){
            if(motI1=="le")remplaceToken(tokens,i,"au") 
            else if (motI1=="les")remplaceTokens(tokens,i,"aux")
        } else if (motI=="de"){
            if(motI1=="le")remplaceToken(tokens,i,"du") 
            else if (motI1=="les") remplaceToken(tokens,i,"des")
            else if (motI1=="des") remplaceToken(tokens,i,"de")
            else if (motI1=="autres") remplaceToken(tokens,i,"d'autres")
        } else if (motI=="des"){
            if (motI1=="autres") remplaceToken(tokens,i,"d'autres")
        }
    }
    return tokens;
}

function eliderMots(prevTokens,tokens){
    if (tokens.length==0) 
        return contracter(prevTokens);
    var lastTokenId=((prevTokens[prevTokens.length-1]).mot.charAt(0) !== "<") ? prevTokens.length-1 : prevTokens.length-2;
    var lastToken=prevTokens[lastTokenId];
    if (lastToken.elidable && tokens[0].voyelleOuHmuet){ 
        if (["ma","ta","sa"].indexOf(lastToken.mot)>=0){ // ma=>mon,ta=>ton,sa=>son
            lastToken.mot=lastToken.mot.charAt(0)+"on";
            prevTokens.push(tokens.shift());
        // } else if (lastToken.mot=="ce"){ // ce => cet (Il faudrait vérifier que le mot suivant n'est pas un verbe...)
        //     lastToken.mot="cet";
        //     prevTokens.push(tokens.shift());
        } else {// remplace la dernière lettre par ' et on colle le prochain mot
//            lastToken.mot=removeLastLetter(lastToken.mot)+"'"+tokens.shift(); // Edit by Paul
//            lastToken.elidable=false;                                 // Edit by Paul

            tokens[0].mot=removeLastLetter(lastToken.mot)+"'"+tokens[0];
            tokens[0].capitalized=lastToken.capitalized;
            prevTokens.splice(lastTokenId, 1);
            prevTokens.push(tokens.shift());
        }
    } else {
        prevTokens.push(tokens.shift());
    }
    return eliderMots(prevTokens,tokens);
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


//// Phrase
/// Sentence
var S = function(childrenElt) {
    if(!(this instanceof S))
    {
        return new S(arguments);
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.sentence"));
};
extend(JSrealE, S);

S.prototype.sortWord = function() {
    this.constituents.head = null;
    
    var e;
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        e = this.elements[i];

        switch(e.category)
        {
            case JSrealB.Config.get("feature.category.phrase.verb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                if(this.constituents.head === null) // before verb
                {
                        this.addConstituent(e, JSrealE.grammaticalFunction.modifier);
                    break;
                }
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
        }
    }

    return this;
};

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
    
    var e;
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        e = this.elements[i];
        
        switch (e.category) {
            case JSrealB.Config.get("feature.category.word.conjunction"):
                this.setCtx(JSrealB.Config.get("feature.category.word.conjunction"), e.unit);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

CP.prototype.elementToPhrasePropagation = function(element) {    
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
        element.bottomUpFeaturePropagation(this, [JSrealB.Config.get("feature.number.alias")], [JSrealB.Config.get("feature.number.plural")]);
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
        var e = this.elements[i];
        switch(e.category)
        {
            case JSrealB.Config.get("feature.category.word.verb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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
        var e = this.elements[i];
        
        switch (e.category) {
            case JSrealB.Config.get("feature.numerical.alias"):
                this.addConstituent(e, JSrealE.grammaticalFunction.modifier);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                if(this.constituents.head === undefined)
                {
                    this.addConstituent(e, JSrealE.grammaticalFunction.head);
                }
                else
                {
                    this.addConstituent(e, JSrealE.grammaticalFunction.complement);
                }
            break;
            case JSrealB.Config.get("feature.category.word.determiner"):
            case JSrealB.Config.get("feature.category.word.adverb"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adjective"):
//            case JSrealB.Config.get("feature.category.phrase.propositional"): // only gender of head word in french?
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
        }
    }
    
    return this;
};

var NP_EN = function(childrenElt) {
    NP.call(this, childrenElt);
};
extend(NP, NP_EN);

NP_EN.prototype.sortWord = function() {
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var e = this.elements[i];
        
        switch (e.category) {
            case JSrealB.Config.get("feature.numerical.alias"):
                this.addConstituent(e, JSrealE.grammaticalFunction.modifier);
            break;
            case JSrealB.Config.get("feature.category.word.noun"):
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.word.pronoun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.determiner"):
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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
        var e = this.elements[i];
        
        switch (e.category)
        {
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.word.adjective"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.adverb"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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
        var e = this.elements[i];
        
        switch (e.category)
        {
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.adverb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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
        var e = this.elements[i];
        
        switch (e.category)
        {
            case JSrealB.Config.get("feature.category.word.adverb"):
//                if(this.constituents.head === undefined)
//                {
//                    this.constituents.degree = e; // Degree
//                }
                
                this.addConstituent(e, JSrealE.grammaticalFunction.head); // Manner
            break;
            case JSrealB.Config.get("feature.category.phrase.adverb"):
            case JSrealB.Config.get("feature.category.word.preposition"):
            case JSrealB.Config.get("feature.category.phrase.prepositional"):
            case JSrealB.Config.get("feature.category.phrase.propositional"):
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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
        var e = this.elements[i];
        
        switch (e.category) {
            case JSrealB.Config.get("feature.category.word.preposition"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.word.verb"):
            case JSrealB.Config.get("feature.category.phrase.verb"):
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
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

/// SP : Propositional Phrase
var SP = function(childrenElt) {
    if(!(this instanceof SP))
    {
        if(JSrealB.Config.get("language") === JSrealE.language.french)
        {
            return new SP_FR(arguments);
        }
        else
        {
            return new SP_EN(arguments);
        }
    }
    
    JSrealE.call(this, childrenElt, JSrealB.Config.get("feature.category.phrase.propositional"));
};
extend(JSrealE, SP);

SP.prototype.sortWord = function() {
    this.constituents.head = null;
    
    for (var i = 0, imax = this.elements.length; i < imax; i++)
    {
        var e = this.elements[i];
        
        switch (e.category)
        {
            case JSrealB.Config.get("feature.category.phrase.sentence"):
            case JSrealB.Config.get("feature.category.phrase.verb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.head);
            break;
            case JSrealB.Config.get("feature.category.phrase.noun"):
            case JSrealB.Config.get("feature.category.phrase.coordinated"):
                if(this.constituents.head === null) // before verb
                {
                        this.addConstituent(e, JSrealE.grammaticalFunction.modifier);
                    break;
                }
            case JSrealB.Config.get("feature.category.phrase.adjective"):
            case JSrealB.Config.get("feature.category.phrase.adverb"):
                this.addConstituent(e, JSrealE.grammaticalFunction.subordinate);
            break;
            default:
                this.addConstituent(e, JSrealE.grammaticalFunction.complement);
        }
    }

    return this;
};

var SP_FR = function(childrenElt) {
    SP.call(this, childrenElt);
};
extend(SP, SP_FR);

var SP_EN = function(childrenElt) {
    SP.call(this, childrenElt);
};
extend(SP, SP_EN);

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
        init: function(language, lexicon, rule, feature) {
            this.Config.set({
                language: language,
                lexicon: lexicon,
                rule: rule,
                feature: feature,
                isDevEnv: true,
                printTrace: false
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
                throw JSrealB.Exception.wrongDeclension(unit, category, JSON.stringify(feature));
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

//// Conjugation Module (Verbs)
JSrealB.Module.Conjugation = (function() {
    var applyEnding = function(unit, tense, person, conjugationTable) {
        if(conjugationTable[(JSrealB.Config.get('feature.tense.alias'))][tense] !== undefined)
        {
            if(person === null || typeof conjugationTable.t[tense] === 'string')
            {
                return stem(unit, conjugationTable.ending) 
                        + conjugationTable.t[tense];
            }
            else if(conjugationTable.t[tense][person-1] !== undefined
                    && conjugationTable.t[tense][person-1] !== null)
            {
                return stem(unit, conjugationTable.ending) 
                        + conjugationTable.t[tense][person-1];
            }
            else
            {
                throw JSrealB.Exception.wrongPerson(unit, person);
            }
        }
        else
        {
            throw JSrealB.Exception.wrongTense(unit, tense);
        }
    };
    
    var conjugate = function(unit, tense, person) {
        var verbInfo = JSrealB.Module.Common.getWordFeature(unit, JSrealB.Config.get('feature.category.word.verb'));
        var conjugationTable = JSrealB.Config.get("rule").conjugation[verbInfo.tab];

        if(conjugationTable !== undefined)
        {
            return applyEnding(unit, tense, person, conjugationTable);
        }
        else
        {
            throw JSrealB.Exception.tableNotExists(unit, verbInfo.tab);
        }
    };

    return {
        conjugate: function(verb, tense, person) {
            var conjugatedVerb = null;

            try
            {
                conjugatedVerb = conjugate(verb, tense, person);
            }
            catch(err)
            {
                return "[[" + verb + "]]";
            }

            return conjugatedVerb;
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
            return numberWithLeadingZero(getInt(n) >= 12 ? (getInt(n) - 12) : n);
        }
        
        return "[[" + n + "]]";
    };
    
    var doNothing = function(s) {
        return s;
    };
    
    //// Based on format of strftime [linux]
    var format = {
        Y: {
            param: getYear,
            func: numberWithoutLeadingZero
        },
        F: {
            param: getMonth,
            func: numberToMonth
        },
        m: {
            param: getMonth,
            func: numberWithLeadingZero
        },
        d: {
            param: getDate,
            func: numberWithLeadingZero
        },
        j: {
            param: getDate,
            func: numberWithoutLeadingZero
        },
        l: {
            param: getDay,
            func: numberToDay
        },
        A: {
            param: getHour,
            func: numberToMeridiem
        },
        h: {
            param: getHour,
            func: numberTo12hour
        },
        H: {
            param: getHour,
            func: numberWithLeadingZero
        },
        i: {
            param: getMinute,
            func: numberWithLeadingZero
        },
        s: {
            param: getSecond,
            func: numberWithLeadingZero
        },
        x: {
            param: getCustomValue,
            func: doNothing
        }
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

JSrealB.Module.Number = (function() {
    var toWord = function(rawNumber, maxPrecision, grammaticalNumber) {
        throw "TODO";
        
        if(grammaticalNumber !== undefined)
        {
            grammaticalNumber(getGrammaticalNumber(getNumberFormat(rawNumber, maxPrecision, ".", "")));
        }
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
        toWord: function(rawNumber, maxPrecision, grammaticalNumber) {
            var numberToWord = null;

            try
            {
                if(isValid(rawNumber))
                {
                    numberToWord = toWord(rawNumber, maxPrecision, grammaticalNumber);
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
        feature: {}
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
        
        return msg;
    };

    return {
        wordNotExists: function(u) {
            return exception(4501, u);
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
        invalidInput: function(u) {
            return exception(4513, u);
        },
        headWordNotFound: function(u) {
            return exception(4514, u);
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
        console.warn(message);

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

var JSrealLoader = function(resource, done, fail) {
    
    var language = resource.language;

    // Checks language
    if(language === undefined
            || Object.keys(JSrealBResource).indexOf(language) < 0)
    {
        fail("Undefined or wrong language");
        return;
    }
    
    // Uses cache
    if(typeof JSrealBResource[language]["lexicon"] !== "undefined"
            && typeof JSrealBResource[language]["rule"] !== "undefined"
            && typeof JSrealBResource.common.feature !== "undefined")
    {
        JSrealB.init(language, JSrealBResource[language]["lexicon"], 
            JSrealBResource[language]["rule"], JSrealBResource.common.feature);
        done();
        return;
    }
    
    var lexiconUrl = resource.lexiconUrl;
    var ruleUrl = resource.ruleUrl;
    var featureUrl = resource.featureUrl;
    
    JSrealB.Request.getJson(
        lexiconUrl,
        function(lexicon)
        {
            JSrealBResource[language]["lexicon"] = lexicon;
            JSrealB.Request.getJson(
                ruleUrl,
                function(rule)
                {
                    JSrealBResource[language]["rule"] = rule;
                    if(typeof JSrealBResource.common.feature !== "undefined")
                    {
                        JSrealB.init(language, lexicon, rule, 
                            JSrealBResource.common.feature);
                        done();
                    }
                    else
                    {
                        JSrealB.Request.getJson(
                            featureUrl,
                            function(feature)
                            {
                                JSrealBResource.common.feature = feature;

                                JSrealB.init(language, lexicon, rule, feature);

                                done();
                            }, 
                            function(status, error) {
                                JSrealB.Logger.alert("Dictionary loading : " 
                                        + status + " : " + error);
                                if(fail) fail(error);
                            }
                        );
                    }
                }, 
                function(status, error) {
                    JSrealB.Logger.alert("Rule loading : " + status + " : " + error);
                    if(fail) fail(error);
                }
            );
        }, 
        function(status, error) {
            JSrealB.Logger.alert("Lexicon loading : " + status + " : " + error);
            if(fail) fail(error);
        }
    );
};