/**
    jsRealB 4.5
    Guy Lapalme, lapalme@iro.umontreal.ca, August 2023
 */
 
import { Constituent } from "./Constituent.js";
import { getLanguage, loadEn, loadFr } from "./Lexicon.js";
import {Terminal,N,A,Pro,D,V,Adv,C,P,DT,NO,Q} from "./Terminal.js"
import {Phrase,S,NP,AP,VP,AdvP,PP,CP,SP} from "./Phrase.js"

export {exceptionOnWarning, setExceptionOnWarning, resetSavedWarnings, getSavedWarnings}

/**
 * When true, throw an exception on Warning instead of only writing on the console
 */
let exceptionOnWarning=false;
/**
* if this is set to an array then warnings will be pushed on this array, 
* so that all warnings can be returned in one bunch to the caller which has
* to resetSavedWarnings() once it has called getSavedWarnings() 
 */
let savedWarnings=undefined;    

/**
 * Sets the flag so that a warning also generates an exception
 * @param {boolean} val 
 */
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

/**
 * Resets the list of saved warnings, so that the next warn calls
 * add the warning to this list instead of writing them to the console
 * Useful, to show the warning to the user web page.
 */
function resetSavedWarnings(){
    savedWarnings=[]
}

/**
 * Returns the current list of saved warnings. 
 * CAUTION: it DOES NOT reset the list
 * @returns the list of saved warnings
 */
function getSavedWarnings(){
    return savedWarnings || [];
}


/**
 * Transliterate an English jsRealB Constituent by transforming all lemmata terminals
 * into their French equivalent using the en_fr table.
 * This sometimes leads to non-colloquial French, but it avoids maintaining two very similar
 * parallel structures
 *  
 * @param {Constituent} en_exp 
 * @returns a Constituent that can be realized in French
 */

function translate(en_exp){
    /**
     * English to French equivalents used in error messages
     * words that stay the same (e.g. option) are not indicated
     */
    var en_fr = {
        "a":"un", "accept":"accepter", "among":"parmi", "and":"et", "apply":"appliquer", "appropriate":"approprié", "as":"comme",
        "bad":"mauvais", "be":"être", "but":"mais",
        "end":"terminer", "error":"erreur", "English":"anglais", "exist":"exister", "expect":"attendre",
        "find":"trouver", "for":"pour", "French":"français",
        "have":"avoir",
        "I":"je", "illegal":"illégal", "in":"en", "ignore":"ignorer", "implement":"implémenter",
        "language":"langage", "lexicon":"lexique",
        "morphology":"morphologie",
        "no":"aucun", "not":"non", "number":"nombre",
        "of":"de", "one":"un", "only":"seulement", "or":"ou",   
        "parameter":"paramètre", "pronoun":"pronom",
        "realize":"réaliser", "reflexive":"réflexif", "Roman":"romain",
        "small":"petit", "single":"seul",
        "than":"que", "the":"le", "this":"ce", "to":"à", "together":"ensemble",
        "use":"utiliser",
        "value":"valeur",
        "with":"avec", "within":"dans", "without":"sans", "word":"mot",
    }

    function setProps(oldObj,newObj){
        newObj.props = oldObj.props
        newObj.optSource = oldObj.optSource
        return newObj
    }
    
    function terminal_tr(terminal){
        let lemma = terminal.lemma in en_fr ? en_fr[terminal.lemma]: terminal.lemma
        return setProps(terminal,new Terminal([lemma],terminal.constType,"fr"))
    }
    
    function phrase_tr(phrase){
        let children = phrase.elements.map(e=>e instanceof Phrase ? phrase_tr(e) : terminal_tr(e))
        return setProps(phrase,new Phrase(children,phrase.constType,"fr"))
    }

    return phrase_tr(en_exp)    
}


/** 
 * Output of warnings:
 * Generate a warning message in the current language
 *   the first argument must correspond to a key in the warnings table
 * It uses jsRealB for the realization of messages. It is not sure that this design 
 * is simpler, but it shows how jsRealB can be used for realizing its own messages.
 * 
 * @param {...string} _ key of the message with optional arguments
 * @returns string with the message 
 */
Constituent.prototype.warn = function(_){
    let args=Array.from(arguments);
    let mess;
    const lang=getLanguage();
    const messFn = Constituent.warnings[args.shift()];  // get the English and French jsRealB structure
    if (messFn===undefined){
        this.error("warn called with an unknown error message:"+arguments[0])
    }
    // create the expression for the English version of the message
    loadEn()
    let messExp = messFn.apply(null,args).cap(false)
    if (lang == "fr"){ // transform the expression in French
        messExp=translate(messExp)
        loadFr()
    }
    mess=this.me()+":: "+ messExp.realize()
    if (exceptionOnWarning) throw mess;
    if (Array.isArray(savedWarnings))
        savedWarnings.push(mess);
    else
        console.warn(mess);
    return this;
}

/**
 * Create a list of elements [a,b,c] => "a, b $conj c" 
 * @param {string} conj 
 * @param {string[]} elems 
 * @returns string 
 */
function makeDisj(conj,elems){
    if (!Array.isArray(elems))elems=[elems];
    return CP.apply(null,[C(conj)].concat(elems.map(e=>Q(e)))).realize()
}

/**
 * Table of jsRealB structures for warning messages
 * The warnings are parameterized by strings that are inserted verbatim in the realization
 * The structures are defined in English, 
 * but, given that they have an identical structure in French (except for Terminal lemmata) 
 * they are "translated" in French in Constituent.warn() when required ...
 */
Constituent.warnings = {
    "bad parameter":(good,bad )=> 
        // the parameter should be $good, not $bad
        // le paramètre devrait être $good, pas $bad
        S(NP(D("the"),N("parameter")),
            VP(V("be").t("c"),Q(good).a(","),Q("not"),Q(bad))).typ({mod:"nece"}),
    "bad application":(info,goods,bad)=> 
        // $info should be applied to $good, not to $bad
        // $info devrait être appliqué à $good, non à $bad.
        S(Q(info),VP(V("apply").t("c"),
                         PP(P("to"),makeDisj("or",goods)).a(","),Q("not"),PP(P("to"),Q(bad)))
               ).typ({mod:"nece",pas:true}),
    "bad position":(bad,limit)=> 
        // $bad should be smaller than $limit.
        // $bad devrait être plus petit que $limit.
        S(Q(bad),VP(V("be").t("c"),A("small").f("co"),C("than"),Q(limit))).typ({mod:"nece"}),
    "bad const for option":(option,constType,allowedConsts)=> 
         // the option $option is applied to $constType, but should be to $allowedConsts.
         // l'option $option est appliquée à $constType, mais devrait être à $allowedConsts
        CP(C("but"),
            VP(V("apply"),NP(D("the"),N("option"),Q(option)),PP(P("to"),Q(constType))).typ({pas:true}).a(","),
            SP(VP(V("be").t("c"),PP(P("to"),makeDisj("or",allowedConsts)))).typ({mod:"nece"})),
    "ignored value for option":(option,bad)=>
        // $bad: this bad value for option $option is ignored.
        // $bad: cette mauvaise valeur pour l'option $option est ignorée
        S(Q(bad).a(":"),
            VP(V("ignore"),NP(D("this"),A("bad").pos("pre"),N("value"),
                            PP(P("for"),N("option"),Q(option)))).typ({pas:true})),
    "unknown type": (key,allowedTypes) => 
        // illegal type: $key, it should be $allowedTypes.
        // type illégal : $key, il devrait être $allowedTypes.
        S(NP(A("illegal"),N("type"),Q(key).b(":")).a(","),
            VP(V("be").t("c"),makeDisj("or",allowedTypes)).typ({mod:"nece"})),
    "no value for option": (option,validVals)=>
        // no value for option $option should be one of $validVals.
        // aucune valeur pour l'option $option, devrait être une parmi $validVals.
        S(NP(D("no"),N("value"),PP(P("for"),N("option"),Q(option))),
            VP(V("be"),PP(P("among"),Q(validVals)))).typ({mod:"nece"}),
    "not found":(missing,context)=> 
        // no $missing found in $context.
        // aucun $missing trouvé dans $context.
        S(AdvP(D("no"),Q(missing)),VP(V("find").t("pp"),PP(P("in"),Q(context)))),
    "bad ordinal": (value)=> 
        // cannot realize $value as ordinal.
        // $value ne peut pas être réalisé comme un ordinal.
        S(VP(V("realize"),Q(value),AdvP(Adv("as"),D("a"),N("ordinal")))).typ({neg:true,mod:"poss"}),
    "bad roman":(value)=> 
        // cannot realize $value as a Roman number.
        // $value ne peut pas être réalisé comme un nombre romain.
        S(VP(V("realize"),Q(value),AdvP(Adv("as"),NP(D("a"),A("Roman"),N("number"))))).typ({neg:true,mod:"poss"}),
    "bad number in word":(value)=> 
        // cannot realize $value in words.
        // $value ne peut pas être réalisé en mots.
        S(VP(V("realize"),Q(value),PP(P("in"),N("word").n("p")))).typ({neg:true,mod:"poss"}),
    "no French contraction":()=> 
        // contraction is ignored in French.
        // la contraction est ignorée en français.
        S(VP(V("ignore"),NP(N("contraction")),PP(P("in"),N("French")))).typ({pas:true}),
    "morphology error":(info)=>
        // error within the morphology: $info.
        // erreur dans la morphologie : $info.
        S(NP(N("error"),PP(P("within"),NP(D("the"),N("morphology")))).a(":"),Q(info)),
    "not implemented":(info)=> // $info is not implemented.
        S(Q(info),VP(V("implement"))).typ({neg:true,pas:true}),
    "not in lexicon":(lang,altPos)=> 
        // not found in lexicon.
        // absent du lexique.
        S(Adv("not"),V("find").t("pp"),PP(P("within"),D("the"),A(lang=="en"?"English":"French"),N("lexicon")),
              altPos!==undefined?AdvP(Adv("but"),V("exist"),Adv("as"),makeDisj("or",altPos)):Q("")),
    "no appropriate pronoun":()=>
        // an appropriate pronoun cannot be found
        // un pronom adéquat ne peut être trouvé
        S(VP(V("find"),NP(D("a"),A("appropriate"),N("pronoun")))).typ({neg:true,pas:true,mod:"poss"}),
    "both tonic and clitic":()=>
        // tn(..) and c(..) cannot be used together, tn(..) is ignored.
        // tn(..) et c(..) ne peuvent pas être utilisés ensemble, tn(..) est ignoré.
        S(CP(C("and"),Q("tn(..)"),Q("c(..)")),VP(V("use").n("p"),Adv("together"))
                  .typ({neg:true,pas:true,mod:"poss"}).a(","),
               Q("tn(..)"),VP(V("ignore")).typ({pas:true})),
    "bad Constituent":(rank,type)=> 
        // the $rank parameter is not Constituent.
        // le $rank paramètre n'est pas Constituent.
        S(NP(D("the"),N("parameter"),Q(rank)),
              VP(V("be"),Q("Constituent"),Adv("but"),Q(type))).typ({neg:true}),
    "bad Dependent":(rank,type)=> 
        // the $rank parameter is not Dependent but $type.
        // le $rank parametre n'est pas Dependent mais $type
        S(NP(D("the"),N("parameter"),Q(rank)),
              VP(V("be"),Q("Dependent"),Adv("but"),Q(type))).typ({neg:true}),
    "Dependent needs Terminal":(type)=> 
        // the first parameter of Dependent is not Terminal but $type.
        // le premier paramètre du Dependent n'est pas Terminal mais $type.
        S(NP(D("the"),NO(1).dOpt({"ord":true}),N("parameter"),PP(P("of"),Q("Dependent"))),
              VP(V("be"),Q("Terminal"),Adv("but"),Q(type))).typ({neg:true}),
    "bad number of parameters":(termType,number)=> 
        // $termType accepts one parameter, but has $number.
        // $termType accepte un seul paramètre, mais en a $number.
        S(Q(termType),VP(V("accept"),NP(D("a"),A("single"),N("parameter"))).a(","),
               SP(C("but"),Pro("I"),VP(VP(V("have"),NO(number))))),
    "Dependent without params":()=> 
        // Dependent without parameter
        // Dependent sans paramètre
        S(Q("Dependent"),PP(P("without"),N("parameter"))),
    "bad lexicon table":(lemma,ending)=> 
        // error in lexicon: $lemma should end with $ending
        // erreur dans lexique: $lemma devrait terminer par $ending
        S(NP(N("error"),PP(P("within"),NP(D("the"),N("lexicon")))).a(":"),
              SP(Q(lemma),VP(V("end"),PP(P("with"),Q(ending)))).typ({neg:true})),
    "bad language":(lang) => 
        // language must be "en" or "fr", not $lang
        // langage doit être "en" ou "fr", non $lang
        S(NP(N("language")),VP(V("be"),CP(C("or"),Q('"en"'),Q('"fr"')).a(","),Q("not"),Q(lang).en('"'))).typ({mod:"obli"}),
    "ignored reflexive":(pat)=> 
        // cannot be reflexive, only $pat
        // ne peut être réflexif, seulement $pat
        S(VP(V("be"),A("reflexive")).typ({"mod":"poss","neg":true}).a(","),
            pat.length>0?AdvP(Adv("only"),makeDisj("or",pat)):undefined),
    "inconsistent dependents within a coord":(expected,found)=> 
        //  $expected expected within this coord, but $found was found
        // toutes les dépendances d'un coord devraient être $expected, mais $found a été rencontré
        S(Q(expected),VP(V("expect").t("pp"),PP(P("within"),NP(D("this"),Q("coord")))),
              SP(C("but"),Q(found),V("be").t("ps"),V("find").t("pp"))),
    "user-warning":(mess)=>  
        // user specific message, either a String or a Constituent that will be realized
        S(mess instanceof Constituent ? Q(mess.realize()) : Q(mess.toString()))
}

/**
 * Show all warnings with dummy parameters in the console : useful for debugging
 */
export function testWarnings(){
    for (let w in Constituent.warnings){
        console.log(w);
        loadEn();
        NP(D("a"),N("error")).warn(w,"A","B","C");
        loadFr();
        NP(D("un"),N("erreur")).warn(w,"A","B","C");
    }
}
