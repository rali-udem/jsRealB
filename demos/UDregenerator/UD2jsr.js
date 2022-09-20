export {feats2options};

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
const mood = {"Ind":{"Past":"ps","Pres":"p","Fut":"f","Imp":"i","Pqp":"pq"},
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

function feats2options(constituent,udNode,selFeats){
    if (udNode.hasNoFeature())return constituent;
    for (const selFeat of selFeats){
        switch (selFeat) {
        case "Mood":
            const moodVal=udNode.selectFeature("Mood")
            if (moodVal !== undefined){
                const tense=udNode.selectFeature("Tense")
                if (tense !==undefined){
                    const jsrTense=getOption(`Mood[${moodVal}]`,mood[moodVal],tense)
                    if (jsrTense !== null){
                        constituent.t(jsrTense)
                    }
                }
            }
            break;
        case "VerbForm":
            const formVal=udNode.selectFeature("VerbForm")
            if (formVal !== undefined){
                if (formVal=="Part" && udNode.hasFeature("Tense")){
                    const jsrTense=udNode.selectFeature("Tense");
                    if (jsrTense=="Pres")constituent.t("pr");
                    else if (jsrTense=="Past")constituent.t("pp")
                } else {
                    const jsrTense=getOption("VerbForm",verbform,formVal)
                    if (jsrTense !== null){
                        constituent.t(jsrTense)
                    }
                }
            }
            break;
        case "Tense":
            const tense1=udNode.selectFeature("Tense")
            if (tense1 !==undefined){
                const jsrTense=getOption("Tense",tenses,tense1)
                if (jsrTense !== null){
                    constituent.t(jsrTense)
                }
            }
            break;
        case "Person":
            const pe=udNode.selectFeature("Person")
            if (pe !==undefined){
                const jsrPe=getOption("Person",person,pe)
                if (jsrPe !== null){
                    constituent.pe(jsrPe)
                }
            }
            break;
        case "Person_psor":
            const pe_=udNode.selectFeature("Person_psor")
            if (pe_ !==undefined){
                const jsrPe=getOption("Person_psor",person_psor,pe_)
                if (jsrPe !== null){
                    constituent.pe(jsrPe)
                }
            }
            break;
        case "Number":
            const n=udNode.selectFeature("Number")
            if (n !==undefined){
                const jsrN=getOption("Number",number,n)
                if (jsrN !== null){
                    constituent.n(jsrN)
                }
            }
            break;
        case "Number_psor":
            const n_=udNode.selectFeature("Number_psor")
            if (n_ !==undefined){
                const jsrN=getOption("Number_psor",number_psor,n_)
                if (jsrN !== null){
                    constituent.ow(jsrN)
                }
            }
            break;
        case "Case":
            const c=udNode.selectFeature("Case")
            if (c !==undefined){
                const jsrC=getOption("Case",case_,c)
                if (jsrC !== null){
                    constituent.c(jsrC)
                }
            }
            break;
        case "Definite":
            udNode.selectFeature("Def") // ignore
            break;
        case "Gender":
            const g=udNode.selectFeature("Gender")
            if (g !==undefined){
                const jsrG=getOption("Gender",gender,g)
                if (jsrG !== null){
                    constituent.g(jsrG)
                }
            }
            break;
        case "Gender_psor":
            const g_=udNode.selectFeature("Gender_psor")
            if (g_ !==undefined){
                const jsrN=getOption("Gender_psor",gender,g_)
                if (jsrG !== null){
                    constituent.g(jsrG)
                }
            }
            break;
        case "Degree":
            const deg=udNode.selectFeature("Degree")
            if (deg !==undefined){
                const jsrDeg=getOption("Degree",degree,deg)
                if (jsrDeg !== null){
                    constituent.f(jsrDeg)
                }
            }
            break;
        case "PronType":
            udNode.selectFeature("PronType") // ignore
            break;
        case "NumType":
            udNode.selectFeature("NumbType") // ignore
            break;
        case "Reflex":
            const refl=udNode.selectFeature("Reflex")
            if (refl !==undefined){
                const jsrRefl=getOption("Reflex",reflex,refl)
                if (jsrRefl !== null){
                    constituent.c(jsrRefl)
                }
            }            
            break;
            
        default:
            console.log("Strange feature:%s in %o",selFeat,udNode)
        }
    }
    return constituent
}
