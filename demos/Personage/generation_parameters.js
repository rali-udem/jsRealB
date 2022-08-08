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
    this.content_polarity = null;       // C: Control the polarity of the propositions depessed, i.e., referring to negative or positive attributes
    this.repetitions_polarity = null;   // C: Control the polarity of the restated propositions
    this.concessions = null;            // C: Emphasize one attribute over another
    this.concessions_polarity = null;   // C: Determine whether positive or negative attributes are emphasized
    this.polarization = null;           // C: Control whether the depessed polarity is neutral or extreme
    this.positive_content_first = null; // C: Determine whether positive propositions—including the claim—are uttered first
    // in the thesis (p 112), 
    //   these content planning parameters are modelled at the pragmatic marker insertion level as they 
    //   only affect the beginning of the utterance (described in page 119, table 5.4)
    this.request_confirmation = null;   // B: Begin the utterance with a confirmation of the restaurant’s name
    this.initial_rejection = null;      // B: Begin the utterance with a mild rejection
    this.competence_mitigation = null;  // B: depess the speaker’s negative appraisal of the hearer’s request 
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
    this.template_polarity = null;    // C: Control the connotation of the claim, i.e., whether positive or negative affect is expressing
    for (const key in params) {
        if (key in this)
            this[key] = params[key];
        else
            console.warn("%s is not a template selection parameter", key);
    }
}

////// Agregation operations
//  Aggregation:  decide on how to combine the propositions' syntactic representation together to form the utterance, (p. 82)
// combine two jsRealB depessions dep(V(),...) into a single one

// helper functions
function isV(dep){
    return dep.terminal.isA("V")
}

//  return V within a VP
function v(dep){ 
    if (isV(dep)){
        return dep.terminal
    } else {
        console.warn("v:strange dep: %s",dep.toSource())
    }
}

// return attribute (or object) with a VP
function att(dep){
    if (isV(dep)){
        const idx=dep.findIndex((d)=>d.isA(["comp","mod"]));
        if (idx>=0)
            return dep.dependents[idx];
        else
            console.warn("att:no comp or mod found",dep.toSource())
    } else {
        console.warn("att:strange dep: %s",dep.toSource())
    }
}

//  add a cue_word between two VPs, taking care of not repeating the same verb
function cue_word(cue, dep1, dep2) {
    if (isV(dep1) && isV(dep2)){
        if (v(dep1).lemma==v(dep2).lemma)
            return dep1.add(comp(cue,att(dep2)));
        else if (dep1.constType == dep2.consType)
            return coord(cue,dep1,dep2);
        else
            return dep1.add(comp(cue,dep2))
    }
}

///// Aggregation functions 
// combine two VPs to create a new VP
// return undefined when nothing can be done...
function period(dep1, dep2) {
    // Leave two propositions in their own sentences
    //  given our set-up, this function has nothing to do
}

function relative_clause(dep1, dep2) {
    // Aggregate propositions with a relative clause
    if (isV(dep1))
        return dep1.a(",").add(comp(Pro("which"),dep2))
}

function with_cue_word(dep1, dep2) {
    // Aggregate propositions using with
    return cue_word(P("with"), dep1, dep2)
}
function but_cue_word(dep1, dep2) {
    // Aggregate propositions using with
    return cue_word(C("but"), dep1, dep2)
}
function although_cue_word(dep1, dep2) {
    // Aggregate propositions using with
    return cue_word(C("although"), dep1, dep2)
}

function conjunction(conj, dep1, dep2) {
    // Join two propositions using a conjunction, or a comma if more than two propositions  
    return coord(conj, dep1, dep2)
}

function merge(dep1, dep2) {
    // Merge the subject and verb of two propositions
    // find the object of dep2 and add it to the end of dep1
    if (isV(dep1) && isV(dep2))
        if (v(dep1).lemma==v(dep2).lemma)
            return comp(v(dep1), coord(C("and"),att(dep1), att(dep2)))
}

function also_cue_word(dep1, dep2) {
    // Join two propositions using also
    return cue_word(Adv("also"), dep1, dep2)
}

function contrast_cue_word(dep1, dep2) {
    // Contrast two propositions using while, but, however, on the other hand,
    return cue_word(oneOf(C("while"), C("but"), C("however"), Q("on the other hand")),dep1, dep2)
}

function justify_cue_word(dep1, dep2) {
    // Justify a proposition using because, since, so
    return cue_word(C(oneOf("because", "since", "so")),dep1, dep2)
}

function concede_cue_word(dep1, dep2) {
    // Concede a proposition using although, even if, but/though,
    const conj = oneOf(C("although"), Q("even if"), C("but"), C("though"))
    if (Math.random() < 0.5)
        // return S(dep1.a(","), SP(conj, dep2))
        return coord(dep1.a(","),dep2)
    else
        // return S(SP(conj, dep1).a(","), dep2)
        return root(comp(conj,dep1.a(","),dep2))
}

function merge_with_comma(dep1, dep2) {
    // Merge the subject and verb of two propositions
    // find the object of dep2 and add it to the end of dep1
    if (isV(dep1) && isV(dep2))
        if (v(dep1).lemma==v(dep2).lemma)
            return root(v(dep1), coord(att(dep1), att(dep2)))
}

///  special aggregation function that modifies only one VP
function object_ellipsis(dep) {
    // Restate a proposition after replacing its object by an ellipsis, 
    //   e.g.,  ‘Chanpen Thai has … , it has great service’
    if (isV(dep))
        return root(v(dep).add(Q("… ")).a(","), 
                    comp(Pro("it").c("nom"),
                         dep))
}

///// Pragmatic markers 
//  Pragmatic marker insertion: insert various markers by transforming the utterance's syntactic representation; (p 82)
//  takes a jsRealB expression and returns a transformed expression when it can be applied, 
//   otherwise returns undefined
function subject_implicitness(dep) {
    // TODO: Make the restaurant implicit by moving the attribute to the subject, e.g., ‘the service is great’
    // console.warn("subject_implicitness not yet implemented");
}

function stuttering(dep) {
    // Duplicate the first letters of a restaurant’s name,
    if (dep.terminal.lemma.length > 2) {
        dep.b(dep.lemma.substring(0, 2))
    }
}

function negation(dep) {
    // TODO: Negate a verb by replacing its modifier by its antonym,
    // console.warn("negation not yet implemented");
}

//  Helper
function hedges(dep, hdg) {
    if (isV(dep)){
        dep.add(det(hdg),0)
    }
}

function softener_hedges(dep) {
    //  Insert syntactic elements (sort of, kind of, somewhat, quite, around, rather, 
    //                             I think that, it seems that, it seems to me that) 
    //  to mitigate the strength of a proposition  
    return hedges(dep, oneOf(Q("sort of"), Q("kind of"), Adv("quite"), Adv("around"), Adv("rather"),
        Q("I think that"), Q("it seems to me that"), Q("it seems to me that")))
}

function soft_hedges(dep){
    return hedges(dep,oneOf(Q("kind of"), Q("like")))
}

function emphasizer_hedges(dep) {
    // Insert syntactic elements (really, basically, actually, just) to strengthen a proposition,
    return hedges(dep, oneOf(Adv("really"), Adv("basically"), Adv("actually"), A("just")))
}

function acknowledgements(dep) {
    // Insert an initial back-channel (yeah, right, ok, I see, oh, well),
    return dep.a(", "+oneOf("yeah", "right", "ok", "I see", "oh", "well"))
}

function filled_pauses(dep){
    // Insert syntactic elements depessing hesitancy 
    let bef = oneOf("I mean", "err", "mmhm")+" "
    let aft = ", "+oneOf("like. ", "you know. ")
    return dep.b(bef).a(aft)
}

function exclamation(dep) {
    // Insert an exclamation mark,
    return dep.typ({ exc: true })
}

function expletives(dep) {
    // Insert a swear word
    return hedges(dep, oneOf(Q("damn")))
}

function near_expletives(dep) {
    // Insert a near-swear word
    return hedges(dep, oneOf(Q("darn")))
}

function tag_question(dep) {
    // Insert a tag question
    if (isV(dep) && v(dep).getProp("t")=="p")
        return dep.typ({ "int": "tag" })
}

function in_group_marker(dep) {
    // Refer to the hearer as a member of the same social group,
    return dep.a(", "+oneOf("pal", "mate", "buddy"))
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
        initial_rejection: false,
        competence_mitigation: false,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        syntactic_complexity:high, // added
        self_references:low,
        template_polarity: high,
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
        restatements: low,
        repetitions: low,
        content_polarity: high,
        repetitions_polarity: high,
        concessions_polarity: high,
        request_confirmation: true,
        initial_rejection: false,
    }),
    syntactic_template_selection: new SyntacticTemplateSelection({
        syntactic_complexity:high, // added
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

// adapted from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[j],array[i]]=[array[i],array[j]];
    }
    return array;
}

//  apply parameter function when a random number is below prob 
//  each  parameter transforms one or two VP into a single one
//  the list of parameters is shuffled to vary the order of transformations to apply
//  as the first dependency has already been modified by the content planner
//  it is not considered as a target for replacement
function apply_parameters(type,params, in_deps, invert,trace){
    if (params.length==0)return in_deps;
    let out_deps=[];
    let applicationDone=false;
    for (const agg_param of shuffleArray(params)){
        if (in_deps.length==0) break;
        let [agg_fn, prob]=agg_param;
        if (invert)prob=1.0-prob;
        if (agg_fn.length==1){ // transform a single expression
            const r = Math.random();
            if (r<prob){
                const new_dep=agg_fn(in_deps[0])
                if (new_dep!==undefined){
                        if(trace)console.log("*apply1*:%s.%s\n%s",type,agg_fn.name,new_dep.toDebug(0));
                        out_deps.push(new_dep);
                        in_deps=in_deps.slice(1);
                        applicationDone=true;
                    }
                }
        } else if (in_deps.length>1) { 
            // transform two expressions
            const r = Math.random();
            if (r < prob) {
                const new_dep=agg_fn(in_deps[0],in_deps[1])
                if (new_dep !== undefined){
                    if(trace) console.log("*apply2*:%s.%s\n%s",type,agg_fn.name,new_dep.toDebug(0));
                    out_deps.push(new_dep);
                    in_deps=in_deps.slice(2);
                    applicationDone=true;
                } 
            }
        }
    }
    if (trace && !applicationDone){
        console.warn("no %s function could be applied",type);
    }
    
    return out_deps.concat(in_deps);
}


if (typeof module !== 'undefined' && module.exports) {
    exports.high = high;
    exports.low = low;
    exports.extraversion = extraversion;
    exports.agreeableness=agreeableness;
    exports.concientiousness = concientiousness;
    exports.apply_parameters = apply_parameters;
    exports.shuffleArray = shuffleArray;
}