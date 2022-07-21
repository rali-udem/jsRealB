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
//
//      4.3: Extraversion [extra]        Table 4.3  p 86  
//            Extraversion vs. introversion (sociable, assertive vs. reserved, shy)
//      4.5: Agreeableness [agree]       Table 4.5  p 94
//            Agreeableness vs. disagreeable (friendly vs. antagonistic, faultfinding)
//      4.6: Conscienstiousness [consc]  Table 4.6  p 97 
//            Conscientiousness vs. unconscientious (organised vs. inefficient, careless)
//
//      only the "rule-based generation module" is implemented


//   Content planning: refine communicative goals, 
//   select and structure the propositional content, 
//     e.g. by manipulating a rhetorical structure tree (p.82)
function ContentPlanning(params = {}) {
    // set default values
    this.verbosity = null;              // C: Control the number of propositions in the utterance
    this.restatements = null;           // C: Paraphrase an existing proposition
    this.repetitions = null;            // C: Repeat an existing proposition
    this.content_polarity = null;       // C: Control the polarity of the propositions expressed, i.e., referring to negative or positive attributes
    this.repetitions_polarity = null;   // C: Control the polarity of the restated propositions
    this.concessions = null;            // C: Emphasize one attribute over another
    this.concessions_polarity = null;   // C: Determine whether positive or negative attributes are emphasized
    this.polarization = null;           // C: Control whether the expressed polarity is neutral or extreme
    this.positive_content_first = null; // C: Determine whether positive propositions—including the claim—are uttered first
    this.request_confirmation = null;   // B: Begin the utterance with a confirmation of the restaurant’s name
    this.initial_rejection = null;      // B: Begin the utterance with a mild rejection
    this.competence_mitigation = null;  // B: Express the speaker ’s negative appraisal of the hearer ’s request 
    // change values given as parameters
    for (const key in params) {
        if (key in this)
            this[key] = params[key];
        else
            console.warn("%s is not a content planning parameter", key);
    }
}



//  Syntactic template selection: decide what syntactic template to select for expressing each proposition, 
//  chosen from a handcrafted generation dictionary; (p 82)
function SyntacticTemplateSelection(params = {}) {
    this.self_references = null;      // C: Control the number of first person pronouns
    this.syntactic_complexity = null; // C: Control the syntactic complexity (syntactic embedding)
    this.template_polarity = null;    // C: Control the connotation of the claim, i.e., whether positive or negative affect is expressed
    for (const key in params) {
        if (key in this)
            this[key] = params[key];
        else
            console.warn("%s is not a template selection parameter", key);
    }
}

////// Agregation operations
//  Aggregation:  decide on how to combine the propositions' syntactic rep- resentation together to form the utterance, (p. 82)
// combine two jsRealB expressions VP(V(),...) into a single one

// helper functions
//  return V within a VP
function v(expr){ 
    if (expr.isA("VP")){
        return expr.elements[0]
    } else {
        console.warn("v:strange expr: %s",expr.toSource())
    }
}

// return attribute (or object) with a VP
function att(expr){
    if (expr.isA("VP")){
        return expr.elements[1];
    } else {
        console.warn("att:strange expr: %s",expr.toSource())
    }
}

//  add a cue_word between two VPs, taking care of not repeating the same verb
function cue_word(cue, vp1, vp2) {
    if (vp1.isA("VP") && vp2.isA("VP")){
        if (v(vp1).lemma==v(vp2).lemma)
            return VP(v(vp1), SP(att(vp1), PP(cue, att(vp2))))
        return VP(v(vp1),SP(att(vp1),PP(cue,vp2)))
    }
}

///// Aggregation functions 
// combine two VPs to create a new VP
// return undefined when nothing can be done...
function period(vp1, vp2) {
    // Leave two propositions in their own sentences
    //  given our set-up, this function has nothing to do
}

function relative_clause(vp1, vp2) {
    // Aggregate propositions with a relative clause
    if (vp1.isA("VP"))
        return SP(SP(Pro("which"), v(vp1),att(vp1)).a(","),vp2)
}

function with_cue_word(vp1, vp2) {
    // Aggregate propositions using with
    return cue_word(P("with"), vp1, vp2)
}
function but_cue_word(vp1, vp2) {
    // Aggregate propositions using with
    return cue_word(Adv("but"), vp1, vp2)
}
function although_cue_word(vp1, vp2) {
    // Aggregate propositions using with
    return cue_word(C("although"), vp1, vp2)
}

function conjunction(conj, vp1, vp2) {
    // Join two propositions using a conjunction, or a comma if more than two propositions  
    return CP(conj, vp1, vp2)
}

function merge(vp1, vp2) {
    // Merge the subject and verb of two propositions
    // find the object of vp2 and add it to the end of vp1
    if (vp1.isA("VP") && vp2.isA("VP"))
        if (v(vp1).lemma==v(vp2).lemma)
            return VP(v(vp1), CP(C("and"),att(vp1), att(vp2)))
}

function also_cue_word(vp1, vp2) {
    // Join two propositions using also
    return cue_word(Adv("also"), vp1, vp2)
}

function contrast_cue_word(vp1, vp2) {
    // Contrast two propositions using while, but, however, on the other hand,
    return cue_word(oneOf(C("while"), C("but"), C("however"), Q("on the other hand")),vp1, vp2)
}

function justify_cue_word(vp1, vp2) {
    // Justify a proposition using because, since, so
    return cue_word(C(oneOf("because", "since", "so")),vp1, vp2)
}

function concede_cue_word(vp1, vp2) {
    // Concede a proposition using although, even if, but/though,
    const conj = oneOf(C("although"), Q("even if"), C("but"), C("though"))
    if (Math.random() < 0.5)
        return S(vp1.a(","), SP(conj, vp2))
    else
        return S(SP(conj, vp1).a(","), vp2)
}

function merge_with_comma(vp1, vp2) {
    // Merge the subject and verb of two propositions
    // find the object of vp2 and add it to the end of vp1
    if (vp1.isA("VP") && vp2.isA("VP"))
        if (V(vp1).lemma==V(vp2).lemma)
            return S(v(vp1), CP(att(vp1), att(vp2)))
}

///  special aggregation function that modifies only one VP
function object_ellipsis(vp) {
    // Restate a proposition after replacing its object by an ellipsis, 
    //   e.g.,  ‘Chanpen Thai has … , it has great service’
    if (vp.isA("VP"))
        return VP(v(vp).add(Q("… ")).a(","), SP(Pro("I"),vp))
}

///// Pragmatic markers 
//  Pragmatic marker insertion: insert various markers by transforming the utterance's syntactic representation; (p 82)
//  takes a jsRealB expression and returns a transformed expression when it can be applied, 
//   otherwise returns undefined
function subject_implicitness(expr) {
    // TODO: Make the restaurant implicit by moving the attribute to the subject, e.g., ‘the service is great’
    // console.warn("subject_implicitness not yet implemented");
}

function stuttering(expr) {
    // Duplicate the first letters of a restaurant’s name,
    if (expr instanceof Terminal) {
        if (expr.lemma.length > 2) {
            expr.b(expr.lemma.substring(0, 2))
        }
    }
}

function negation(expr) {
    // TODO: Negate a verb by replacing its modifier by its antonym,
    // console.warn("negation not yet implemented");
}

//  Helper
function hedges(expr, hdg) {
    let vp;
    if (expr.isOneOf("S","SP")){
        vp=expr.getConst("VP")
    } else if (expr.isA("VP"))
        vp=expr;
    if (vp!==undefined) {
        const obj= vp.getConst(["NP","SP","Pro","PP"])           
        if (obj !== undefined) {
            obj.add(hdg, 0)
        }
   }
}

function softener_hedges(expr) {
    //  Insert syntactic elements (sort of, kind of, somewhat, quite, around, rather, 
    //                             I think that, it seems that, it seems to me that) 
    //  to mitigate the strength of a proposition  
    return hedges(expr, oneOf(Q("sort of"), Q("kind of"), Adv("quite"), Adv("around"), Adv("rather"),
        Q("I think that"), Q("it seems to me that"), Q("it seems to me that")))
}

function soft_hedges(expr){
    return hedges(expr,oneOf(Q("kind of"), Q("like")))
}

function emphasizer_hedges(expr) {
    // Insert syntactic elements (really, basically, actually, just) to strengthen a proposition,
    return hedges(expr, oneOf(Adv("really"), Adv("basically"), Adv("actually"), A("just")))
}

function acknowledgements(expr) {
    // Insert an initial back-channel (yeah, right, ok, I see, oh, well),
    return expr.a(", "+oneOf("yeah", "right", "ok", "I see", "oh", "well"))
}

function filled_pauses(expr){
    // Insert syntactic elements expressing hesitancy 
    let bef = oneOf("I mean", "err", "mmhm")+" "
    let aft = ", "+oneOf("like. ", "you know. ")
    return expr.b(bef).a(aft)
}

function exclamation(expr) {
    // Insert an exclamation mark,
    return expr.typ({ exc: true })
}

function expletives(expr) {
    // Insert a swear word
    return hedges(expr, oneOf(Q("damn")))
}

function near_expletives(expr) {
    // Insert a near-swear word
    return hedges(expr, oneOf(Q("darn")))
}

function tag_question(expr) {
    // Insert a tag question
    if (expr.isA("VP"))
        expr=S(Pro("I"),expr)
    return expr.typ({ "int": "tag" })
}

function in_group_marker(expr) {
    // Refer to the hearer as a member of the same social group,
    return expr.a(", "+oneOf("pal", "mate", "buddy"))
}

const high = 0.9, low = 0.1;
//  Extraverts tend to engage in social interaction, they are enthusiastic, risk-taking, talkative and assertive,
//  whereas introverts are more reserved and solitary. (p 83 of Mairesse 2008)
//       Table 3 (p 86, ibid.) 
const extraversion = {
    content_planning: new ContentPlanning({
        verbosity: high,
        restatements: high,
        repetitions: high,
        content_polarity: high,
        repetitions_polarity: high,
        concessions_polarity: high,
        positive_content_first: high,
        request_confirmation: true,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        syntactic_complexity: low,
        template_polarity: high,
    }),
    aggregation: [
        [also_cue_word, high],
        [but_cue_word, high],
        [although_cue_word, low],
        [relative_clause, low],
    ],
    pragmatic_marker: [
        [subject_implicitness, high],
        [soft_hedges, high],
        [near_expletives, high],
        [emphasizer_hedges, high],
        [exclamation, high],
        [tag_question, high],
        [in_group_marker, high],
        [negation, low],
        [softener_hedges, low],
        [acknowledgements, low],
        [filled_pauses, low]
    ]
    // TODO: process lexical choice ....
}

// Agreeable people are generous, optimistic, emphatic, interested in others, and 
// they make people feel comfortable.
//   Table 4.5 (p. 94)

const agreeableness = {
    content_planning: new ContentPlanning({
        repetitions: high,
        content_polarity: high,
        concessions_polarity: high,
        positive_content_first: high,
        request_confirmation: true,
        competence_mitigation: low,
        initial_rejection: low.toExponential,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        template_polarity: high,
        self_references:low,
    }),
    aggregation: [
        [period, low],
    ],
    pragmatic_marker: [
        [subject_implicitness, low],
        [negation, low],
        [expletives,low],
        [softener_hedges, high],
        [acknowledgements, high],
        [emphasizer_hedges, low],
        [filled_pauses, high],
        [tag_question, high],
        [in_group_marker, high],
    ]
    // TODO: process lexical choice ....
}

//      4.6: Conscientiousness [consc]  Table 4.6  p 97 

const concientiousness = {
    content_planning: new ContentPlanning({
        content_polarity: high,
        repetitions_polarity: high,
        concessions_polarity: high,
        request_confirmation: true,
        restatements: low,
        repetitions: low,
        initial_rejection: low,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        template_polarity: high,
    }),
    aggregation: [
        [contrast_cue_word,low],
        [justify_cue_word,low],
        [although_cue_word, high],
        [relative_clause, high],
    ],
    pragmatic_marker: [
        [negation, low],
        [expletives,low],
        [near_expletives, low],
        [in_group_marker, low],
        [filled_pauses, low],
        [softener_hedges, high],
        [acknowledgements, high],
        [exclamation, low],
    ]
    // TODO: process lexical choice ....
}

if (typeof module !== 'null' && module.exports) {
    exports.high = high;
    exports.low = low;
    exports.extraversion = extraversion
    exports.agreeableness=agreeableness
    exports.concientiousness = concientiousness
}