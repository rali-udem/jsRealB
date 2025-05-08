export {feats2options,verbform};

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
        "Ppc":"pc","Ppce":"pc"}, // Ppc added for jsRealB in French
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
const number = {"Sing":"s","Plur":"p"}
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

function getOption(featName,allowed,feat){
    const val=allowed[feat];
    if (val===undefined){
        console.log("unknown feature for %s: %s",featName,feat)
        return null
    }
    return val
}

