 // Mapping of UD POS tags to jsRaelB constructors
 // taken from https://universaldependencies.org/u/pos/index.html
const udPos_jsrPos = {
     //  Open class
    ADJ:"A",
    ADV:"Adv",
    INTJ:"Q",
    NOUN:"N",
    PROPN:"Q",
    VERB:"V",
     // Closed class
    ADP:"P",
    AUX:"V",
    CCONJ:"C",
    DET:"D",
    NUM:"NO",
    PART:"Q",
    PRON:"Pro",
    SCONJ:"C",
     // other
    PUNCT:"Q",
    SYM:"Q",
    X:"Q",
};

///  Mapping from UD features to jsr options
//      https://universaldependencies.org/u/feat/index.html
//   CAUTION: only deals with English and French phenomena that can be mapped to jsRealB options

const Mood ={ // combined with tense
    // https://universaldependencies.org/u/feat/Mood.html
    Ind:{// indicative
        Past:'t("ps")', // past tense
        Pres:'t("p")', // present
        Fut: 't("f")', // future
        Imp: 't("i")', // imperfect
        Pqp: 't("pq")', // pluperfect
    }, 
    Imp:{// imperative
        Pres:'t("ip")', // present
    }, 
    Cnd:{// conditional
        Past:'t("cp")', // past tense
        Pres:'t("c")', // present
    }, 
    Sub:{// subjonctive
        Past:'t("spa")', // past tense
        Pres:'t("s")', // present
        Imp: 't("si")', // imperfect
        Pqp: 't("spq")', // pluperfect
    },
    Part:{// participle
        Past:'t("pp")', // past tense
        Pres:'t("pr")', // present
    } 
};

const VerbForm = {
    // https://universaldependencies.org/u/feat/VerbForm.html
    Fin: null,  // Rule of thumb: this is the value if it has non-empty Mood, 
    Inf: 't("b")',  // infinitive
    Part:'t("pp")', // participle
    Ger: 't("pr")', // gerund NB:Using VerbForm=Ger is discouraged and alternatives should be considered first
};

const Tense = {
    // https://universaldependencies.org/u/feat/Tense.html
    //   indicative mood if not specified
    Past:'t("ps")', // past tense
    Pres:'t("p")', // present
    Fut: 't("f")', // future
    Imp: 't("i")', // imperfect
    Pqp: 't("pq")', // pluperfect
};

const Person = {
    // https://universaldependencies.org/u/feat/Person.html
    1:'pe("1")',
    2:'pe("2")',
    3:'pe("3")'
};
const Person_psor=Person;

const Number_ = { // add underline to ensure that this does not override the standard Number class...
    // https://universaldependencies.org/u/feat/Number.html
    Sing:'n("s")', // singular
    Plur:'n("p")', //  plural
};

const Number_psor = { 
    Sing:'ow("s")', // singular
    Plur:'ow("p")', //  plural
};

const Case = {
    // https://universaldependencies.org/u/feat/Case.html
    Acc:'c("acc")', // accusative
    Dat:'c("dat")', // dative
    Gen:'c("gen")', // genitive
    Nom:'c("nom")', // nominative
}

const Definite = {
    //  https://universaldependencies.org/u/feat/Definite.html
    Def:null, // definite
    Ind:null, // indefinite
}

const Gender ={
    // https://universaldependencies.org/u/feat/Gender.html
    Masc:'g("m")', // masculine
    Fem: 'g("f")', // feminine
    Neut:'g("n")', // neuter
}
const Gender_psor=Gender;

const Degree = {
    // https://universaldependencies.org/u/feat/Degree.html
    Cmp:'f("co")',  // comparative
    Sup:'f("su")',  // superlative
    Pos:null,
}

const PronType = {
    // https://universaldependencies.org/u/feat/PronType.html
    Prs:null,  // personal
    Art:null,  // article
    Int:null,  // interrogative
    Rel:null,  // relative
    Dem:null,  // demonstrative
    Neg:null,  // negative
    Ind:null,  // interrogative
}

const NumType = {
    Card:null, // cardinal
    Ord :null, // ordinal
}

const Reflex = {
    Yes:'c("refl")'
}

if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
    exports.udPos_jsrPos=udPos_jsrPos;
    exports.Mood=Mood;
    exports.VerbForm=VerbForm;
    exports.Tense=Tense;
    exports.Person=Person;
    exports.Person_psor=Person_psor;
    exports.Number_=Number_;
    exports.Number_psor=Number_psor;
    exports.Case=Case;
    exports.Definite=Definite;
    exports.Gender=Gender;
    exports.Gender_psor=Gender_psor;
    exports.Degree=Degree;
    exports.PronType=PronType;
    exports.NumType=NumType;
    exports.Reflex=Reflex;
}