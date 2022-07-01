//  jsRealB implementation of PERSONAGE's generation parameters 
//  given in Table 2 (page 462-463) of 
//   François Mairesse and Marilyn A. Walker. 2011. 
//   Controlling User Perceptions of Linguistic Style: Trainable Generation of Personality Traits. 
//   Computational Linguistics, 37(3):455–488.
//        https://aclanthology.org/J11-3002
//   
// more complete info in sections of chapters 4 and 5: 
//      Mairesse, Francois (2008) 
//      Learning to adapt in dialogue systems : data-driven models for personality recognition and generation.
//      PhD thesis, University of Sheffield.
//           https://etheses.whiterose.ac.uk/14937/
//      4.3: Extraversion [extra]        Table 4.3  p 86 
//      4.5: Agreeableness [agree]       Table 4.5  p 101
//      4.6: Conscienstiousness [consc]  Table 4.6  p 104 
//       
//      only the "rule-based generation module" is implemented

function ContentPlanning(params={}){
    // set default values
    this.verbosity = null;              // C: Control the number of propositions in the utterance
    this.restatements = null;           // C: Paraphrase an existing proposition
    this.repetitions  = null;           // C: Repeat an existing proposition
    this.content_polarity = null;       // C: Control the polarity of the propositions expressed, i.e., referring to negative or positive attributes
    this.repetitions_polarity = null;   // C: Control the polarity of the restated propositions
    this.concessions = null;            // C: Emphasize one attribute over another
    this.concessions_polarity = null;   // C: Determine whether positive or negative attributes are emphasized
    this.polarization = null;           // C: Control whether the expressed polarity is neutral or extreme
    this.positive_content_first = null; // C: Determine whether positive propositions—including the claim—are uttered first
    this.request_confirmation = null;   // B: Begin the utterance with a confirmation of the restaurant’s name
    this.initial_rejection = null;      // B: Begin the utterance with a mild rejection
    this.competence_mitigation = null;   // B: Express the speaker ’s negative appraisal of the hearer ’s request 
    // change values given as parameters
    for (const key in params) {
        if (key in this)
            this[key]=params[key];
        else
            console.warn("%s is not a content planning parameter",key);
    }
}


function SyntacticTemplateSelection(params={}){
    this.self_references = null;      // C: Control the number of first person pronouns
    this.syntactic_complexity = null; // C: Control the syntactic complexity (syntactic embedding)
    this.template_polarity = null;    // C: Control the connotation of the claim, i.e., whether positive or negative affect is expressed
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
    return vo(expr1.vrb,SP(expr1.obj,PP(cue,expr2.obj)))
}

// function getSubjectIndex(expr){
//     if (expr.isOneOf(["S","SP"])){
//         return expr.getIndex(["Pro","NP","N"]);
//     }    
//     return -1
// }

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
    return cue_word(P("with"),expr1,expr2)
}

function conjunction(conj, expr1,expr2){
    // Join two propositions using a conjunction, or a comma if more than two propositions  
    return vo(CP(conj,VP(expr1.all),VP(expr2.all)))
}

function merge(expr1,expr2){
    // Merge the subject and verb of two propositions
    // TODO:: check that the merge is appropriate...
    // find the object of expr2 and add it to the end of expr1
    return vo(expr1.vrb,CP(C("and"),expr1.obj,expr2.obj))
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
        return vo(S(SP(expr1.all).a(","),SP(conj,expr2.all)),null)
    else
        return vo(S(SP(conj,expr1.all).a(","),expr2),null)
}

function merge_with_comma(expr1,expr2){
    // Merge the subject and verb of two propositions
    // TODO:: check that the merge is appropriate...
    // find the object of expr2 and add it to the end of expr1
    return vo(expr1.vrb,CP(expr1.obj,expr2.obj),null)
}

function object_ellipsis(expr){
    // Restate a proposition after replacing its object by an ellipsis, 
    //   e.g.,  ‘Chanpen Thai has … , it has great service’
    return vo(expr.vrb.add(Q("… ")).a(","),null)
}

///// Pragmatic markers 
//  takes a jsRealB expression and returns a new none
function subject_implicitness(expr){
    // Make the restaurant implicit by moving the attribute to the subject, e.g., ‘the service is great’
    console.warn("subject_implicitness not yet implemented");
    return expr
}

function stuttering(expr){
    // Duplicate the first letters of a restaurant’s name,
    if (expr instanceof Terminal){
        if (expr.lemma.length>2){
            expr.b(expr.lemma.substring(0,2))
        }
    }
}

function negation(expr){
    // Negate a verb by replacing its modifier by its antonym,
    console.warn("negation not yet implemented");
    return expr
}

//  Helper
function hedges(expr,hdg){
    let obj=getObject(expr)
    if (obj!==undefined){
        obj.add(hdg,0)
    }
}

function softener_hedges(expr){
    //  Insert syntactic elements (sort of, kind of, somewhat, quite, around, rather, 
    //                             I think that, it seems that, it seems to me that) 
    //  to mitigate the strength of a proposition  
    return hedges(expr,oneOf(Q("sort of"),Q("kind of"),Adv("quite"),Adv("around"),Adv("rather"),
                              Q("I think that"),Q("it seems to me that"),Q("it seems to me that")))
}

function emphasizer_hedges(expr){
    // Insert syntactic elements (really, basically, actually, just) to strengthen a proposition,
    return hedges(expr, oneOf(Adv("really"),Adv("basically"),Adv("Actually"),A("just")))
}

function acknowledgements(expr){
    // Insert an initial back-channel (yeah, right, ok, I see, oh, well),
    return expr.a(oneOf("yeah","right","ok","I see","oh","well")+",")
}

function filled_pauses(expr){
    // Insert syntactic elements expressing hesitancy 
    let bs=oneOf("I mean","err","mmhm")
    let as=oneOf("like","you know")
    return hedges(expr.b(bs), oneOf(Q(as)))
}

function exclamation(expr){
    // Insert an exclamation mark,
    return expr.typ({excl:true})
}

function expletives(expr){
    // Insert a swear word
    return hedges(expr,oneOf([Q("damn")]))
}

function near_expletives(expr){
    // Insert a near-swear word
    return hedges(expr, oneOf([Q("darn")]))
}

function tag_question(expr){
    // Insert a tag question
    return expr.typ({"int":"tag"})
}

function in_group_marker(expr){
    // Refer to the hearer as a member of the same social group,
    return expr.a(Q(oneOf("pal","mate","buddy")))
}

const high=0.9, low=0.1;

// Table 3 (p 86) of Mairesse 2008
const extraversion = {
    content_planning: new ContentPlanning({
        verbosity: high,
        restatements: high,
        repetitions:high,
        content_polarity:high,
        repetitions_polarity:high,
        concessions_polarity:high,
        positive_content_first:high,
        request_confirmation:true,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        syntactic_complexity:low,
        template_polarity: high,
    }),
    aggregation : {
        "high":[also_cue_word,(e1,e2)=>cue_word(C("but"),e1,e2)],
        "low" :[(e1,e2)=>cue_word(C("although"),e1,e2),relative_clause]
    },
    pragmatic_marker : {
        "high":[subject_implicitness,(e)=>hedges([Q("kind of"),Q("like")]),near_expletives,
                emphasizer_hedges,exclamation,tag_question,in_group_marker],
        "low" :[negation,softener_hedges,acknowledgements,filled_pauses,]
    }
    // TODO: process lexical choice ....
}

if (typeof module !== 'null' && module.exports) {
    exports.high=high;
    exports.low=low;
    exports.extraversion=extraversion
}