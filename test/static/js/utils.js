convertToDeclensionShortForm = function(gender, number) {
    if(gender !== null && gender.length > 0 && number.length > 0)
    {        
        return gender.declensionShortForm() + number.declensionShortForm();
    }
    else if(number.length > 0)
    {
        return number.declensionShortForm();
    }
    
    return null;
};

hasOwnValue = function(obj, val) {
    if(obj === undefined)
        return false;
    
    for(var prop in obj) {
        if(obj[prop] === val) {
            return true;   
        }
    }
    
    return false;
};

String.prototype.separateGenderAndNumber = function() {
    
    var grammar = {
        gender: {masculine: "m", feminine: "f", unspecified: "x", neuter: "n", unapplicable: null, unknown: null},
        number: {singular: "s", plural: "p", unknown: null}
    };

    var grammaticalGender = null;
    var grammaticalNumber = null;
    if(this.length === 2)
    {
        grammaticalGender = (hasOwnValue(grammar.gender, this.charAt(0))) ? this.charAt(0) : null;
        grammaticalNumber = (hasOwnValue(grammar.number, this.charAt(1))) ? this.charAt(1) : null;
    }
    else if(this.length === 1)
    {
        grammaticalNumber = (hasOwnValue(grammar.number, this.declensionShortForm())) ? this.declensionShortForm() : null;
    }
    
    return {g: grammaticalGender, n: grammaticalNumber};
};

String.prototype.declensionShortForm = function() {
    return this.charAt(0);
};

String.prototype.separateTenseAndPerson = function() {
    var tenseAndPerson = this.split(/(\d+)/).filter(Boolean);
    if(tenseAndPerson.length === 2)
    {
        return {tense: tenseAndPerson[0], person: tenseAndPerson[1]};
    }
    else if(tenseAndPerson.length === 1 && intVal(tenseAndPerson[0]) === null)
    {
        return {tense: tenseAndPerson[0], person: null}; // tense
    }
    else
    {
        return {tense: null, person: null};
    }
};