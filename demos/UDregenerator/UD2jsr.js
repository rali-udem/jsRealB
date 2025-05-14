export {mood, verbform, tenses, person, person_psor, number, number_psor, case_, definite, gender, gender_psor,
        degree, pronType, numtype, reflex, udMapping, getOption, ud2jsrdeprel, applyOptions, checkFirst, checkLast};

// Mapping of UD POS tags to jsRaelB constructors
// taken from https://universaldependencies.org/u/pos/index.html
// const udPos_jsrPos = {
//      //  Open class
//     ADJ:A,
//     ADV:Adv,
//     INTJ:Q,
//     NOUN:N,
//     PROPN:Q,
//     VERB:V,
//      // Closed class
//     ADP:P,
//     AUX:V,
//     CCONJ:C,
//     DET:D,
//     NUM:NO,
//     PART:Q,
//     PRON:Pro,
//     SCONJ:C,
//      // other
//     PUNCT:Q,
//     SYM:Q,
//     X:Q,
// };

///  Mapping from UD features to jsr options
//      https://universaldependencies.org/u/feat/index.html
//   CAUTION: only deals with English and French phenomena that can be mapped to jsRealB options

    // https://universaldependencies.org/u/feat/Mood.html
const mood = {"Ind":{"Past":"ps","Pres":"p","Fut":"f","Imp":"i","Pqp":"pq",
                     "Ppc":"pc","Ppce":"pc", // Ppc added for jsRealB in French
                     "Ppq":"pq","Ppqe":"pq",
                     "Ppa":"pa","Ppae":"pa",
                     "Pfa":"pa","Pfae":"pa"}, 
        "Imp":{"Pres":"ip"},
        "Cnd":{"Past":"cp","Pres":"c"},
        "Sub":{"Past":"spa","Pres":"s","Imp":"si","Pqp":"spq"},
        "Part":{"Past":"pp","Pres":"pr"},
        }

    // https://universaldependencies.org/u/feat/VerbForm.html
const verbform = {"Fin":null,"Inf":"b","Part":"pp","Ger":"pr"}

    // https://universaldependencies.org/u/feat/Tense.html
    //   indicative mood if not specified
const tenses = mood["Ind"]

    // https://universaldependencies.org/u/feat/Person.html
const person = {"1":1,"2":2,"3":3}
const person_psor=person;

    // https://universaldependencies.org/u/feat/Number.html
const number = {"Sing":"s","Plur":"p", "Ptan":"s"}
const number_psor = number

    // https://universaldependencies.org/u/feat/Case.html
const case_ = {"Acc":"acc","Dat":"dat","Gen":"gen","Nom":"nom"}

    //  https://universaldependencies.org/u/feat/Definite.html
const definite = {"Def":null,"Ind":null}
    // https://universaldependencies.org/u/feat/Gender.html
const gender = {"Masc":"m", "Fem":"f", "Neut":"n"}
const gender_psor = gender

    // https://universaldependencies.org/u/feat/Degree.html
const degree = {"Cmp":"co","Sup":"su","Pos":null}

    // https://universaldependencies.org/u/feat/PronType.html
const pronType = {"Prs":null,"Art":null,"Int":null,"Rel":null,"Dem":null,"Neg":null,"Ind":null}

const numtype = {"Card":null,"Ord":null}

const reflex = {"Yes":"refl"}

const udMapping = { 
    // core arguments
    "nsubj":"subj","csubj":"subj",
    "obj":"comp","ccomp":"comp",
    "iobj":"comp","xcomp":"comp",
    // non-core dependents
    "obl":"comp","advcl":"mod","advmod":"mod","aux":"mod",
    "vocative":"mod","discourse":"mod","cop":"mod",
    "expl":"mod","mark":"mod",
    // nominal dependents
    "nmod":"mod","acl":"comp","amod":"mod","det":"det",
    "appos":"mod","clf":"mod",
    "nummod":"mod","case":"mod",
    // coordination
    "conj":"mod","cc":"mod",
    // multiword expressions
    "fixed":"mod","flat":"mod","compound":"mod",
    // loose
    "list":"mod","parataxis":"mod","dislocated":"mod",
    // special
    "orphan":"mod","goeswith":"mod","reparandum":"mod",
    // other
    "punct":"mod","root":"root","dep":"comp",
};


function getOption(featName,allowed,feat){
    const val=allowed[feat];
    if (val===undefined){
        console.log("unknown feature for %s: %s",featName,feat)
        return null
    }
    return val
}


function ud2jsrdeprel(udDeprel){
    const idColon=udDeprel.indexOf(":"); // ignore colon and after
    if (idColon>=0)udDeprel=udDeprel.substring(0,idColon);
    const deprel=udMapping[udDeprel]
    if (deprel === undefined){
        console.log("unknown UD deprel : %s",udDeprel);
        return "comp";
    }
    return deprel;    
}

// combine all typ options into a single list and apply other options directly to a dependent
function applyOptions(dep,options){
    let typOpts={};
    for (let i = 0; i < options.length; i++) {
        let [key,val]=options[i];
        if (key=="typ")
            typOpts=Object.assign(typOpts,val);
        else 
            Constituent.prototype[key].call(dep,val)
    }
    if (Object.keys(typOpts).length>0)
        Constituent.prototype.typ.call(dep,typOpts);
    return dep
}

// check if first element of list satisfies a predicate
//  if so return it otherwise null
function checkFirst(list,pred){
    return list.length>0 && pred(list[0]) ? list[0] : null
}
// check if last element of list satisfies a predicate
//  if so return it otherwise null
function checkLast(list,pred){
    return list.length>0 && pred(list[list.length-1]) ? list[list.length-1] : null
}
