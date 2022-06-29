//  jsRealB implementation of PERSONAGE's generation parameters
//  given in Table 2 (page 462-463) of 
//   François Mairesse and Marilyn A. Walker. 2011. 
//   Controlling User Perceptions of Linguistic Style: Trainable Generation of Personality Traits. 
//   Computational Linguistics, 37(3):455–488.
//        https://aclanthology.org/J11-3002


 
function ContentPlanning(params={}){
    // set default values
    this.verbosity = 0.5              // C: Control the number of propositions in the utterance
    this.restatements = 0.5           // C: Paraphrase an existing proposition
    this.repetitions  = 0.5           // C: Repeat an existing proposition
    this.content_polarity = 0.5       // C: Control the polarity of the propositions expressed, i.e., referring to negative or positive attributes
    this.repetitions_polarity = 0.5   // C: Control the polarity of the restated propositions
    this.concessions = 0.5            // C: Emphasize one attribute over another
    this.concessions_polarity = 0.5   // C: Determine whether positive or negative attributes are emphasized
    this.polarization = 0.5           // C: Control whether the expressed polarity is neutral or extreme
    this.positive_content_first = 0.5 // C: Determine whether positive propositions—including the claim—are uttered first
    this.request_confirmation = true  // B: Begin the utterance with a confirmation of the restaurant’s name
    this.initial_rejection = true     // B: Begin the utterance with a mild rejection
    this.competence_mitigation = true // B: Express the speaker ’s negative appraisal of the hearer ’s request 
    // change values given as parameters
    for (const key in params) {
        if (key in this)
            this[key]=params[key];
        else
            console.warn("%s is not a content planning parameter",key);
    }
}

function TemplateSelection(params={}){
    this.self_references = 0.5      // C: Control the number of first person pronouns
    this.syntactic_complexity = 0.5 // C: Control the syntactic complexity (syntactic embedding)
    this.template_polarity = 0.5    // C: Control the connotation of the claim, i.e., whether positive or negative affect is expressed
    for (const key in params) {
        if (key in this)
            this[key]=params[key];
        else
            console.warn("%s is not a template selection parameter",key);
    }
}

////// Agregation operations
// combine two jsRealB expressions into a single one
//   take for granted that they are called when the C value is appropriate

// helper functions
function cue_word(cue,expr1,expr2){
    return S(expr1,cue,expr2)
}

function getSubjectIndex(expr){
    if (expr.isOneOf(["S","SP"])){
        return expr.getIndex(["Pro","NP","N"]);
    }    
    return -1
}

function getObject(expr){
    if (expr.isOneOf(["S","SP"])){
        const vp=expr.getConst("VP");
        if (vp!==undefined){
            return vp.getConst(["NP","SP","PP"]);
        }
    }
    return undefined
}

// start of aggregation functions taking two structures [verb, obj] to create a new one
// return null when nothing is done...
function aggregation (expr1,expr2){
    // Leave two propositions in their own sentences
    return null
}    

function relative_clause(expr1,expr2){
    // Aggregate propositions with a relative clause
    return vo(SP(Pro("which"),expr1.vrb,expr2).a(","),expr2)  
}    

function with_cue_word(expr1,expr2){
    // Aggregate propositions using with
    return vo(expr1.vrb,SP(expr1.obj,PP(P("with"),expr2.obj)))
}

function conjunction(conj, expr1,expr2){
    // Join two propositions using a conjunction, or a comma if more than two propositions  
    return vo(expr1.vrb,CP(C("and"),expr1.obj,expr2.obj))
    return []
}

function merge(expr1,expr2){
    // Merge the subject and verb of two propositions
    // TODO:: check that the merge is appropriate...
    // find the object of expr2 and add it to the end of expr1
    const obj=getObject(expr2)
    if (obj!==undefined){
        return S(expr1,C("and"),obj)
    }
    return null
}

function also_cue_word(expr1,expr2){
    // Join two propositions using also
    return cue_word(P("also"),expr1,expr2)
}

function contrast_cue_word(expr1,expr2){
    // Contrast two propositions using while, but, however, on the other hand,
    return cue_word(oneOf(C("while"),C("but"),C("however"),Q("on the other hand")),
                    expr1,expr2)
}

function justify_cue_word(expr1,expr2){
    // Justify a proposition using because, since, so
    return cue_word(C(oneOf("because","since","so"),
                      expr1,expr2))
}

function concede_cue_word(expr1,expr2){
    // Concede a proposition using although, even if, but/though,
    const conj= oneOf(C("although"),Q("even if"),C("but"),C("though"))
    if (Math.random()<0.5)
        return S(expr1.a(","),SP(conj,expr2))
    else
        return S(SP(conj,expr1).a(","),expr2)
}

function merge_with_comma(expr1,expr2){
    // Merge the subject and verb of two propositions
    // TODO:: check that the merge is appropriate...
    // find the object of expr2 and add it to the end of expr1
    const obj=getObject(expr2)
    if (obj!==undefined){
        return S(expr1.a(","),obj)
    }
    return null
}

function object_ellipsis(expr){
    // Restate a proposition after replacing its object by an ellipsis, 
    //   e.g.,  ‘Chanpen Thai has … , it has great service’
    if (expr.isOneOf(["S","SP"])){
        const vp=expr.getConst("VP");
        if (vp!==undefined){
            const idx=vp.getIndex(["NP","SP","PP"]);
            if (idx>0){ // take for granted that the verb is before the object
                const obj=vp.elements.splice(idx,1)[0];
                return S(expr.add(Q("… ")).a(","),SP(Pro("I"),
                         VP(vp.elements[idx-1].clone(),obj)))
            }
        }
    }
}