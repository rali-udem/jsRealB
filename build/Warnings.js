/**
    jsRealB 3.2
    Guy Lapalme, lapalme@iro.umontreal.ca, February 2020
 */
"use strict";

// global variables
var exceptionOnWarning=false;  // throw an exception on Warning instead of only writing on the console
var savedWarnings=undefined;    // if this is set to an array then warnings will be pushed on this array, 
                                // so that all warnings can be returned in one bunch to the caller which has
                                // to resetSavedWarnings() once it has called getSavedWarnings()

// set the flag so that a warning generates an exception
function setExceptionOnWarning(val){
    exceptionOnWarning=val;
}

// reset savedWarnings
function resetSavedWarnings(){
    savedWarnings=[]
}

function getSavedWarnings(){
    return savedWarnings || [];
}

// Output of warnings:
// it uses jsRealB for the realization of messages
// not sure this design is simpler, but it shows how jsRealB can be used for realizing its own messages

// generate a warning message in the current language
//   the first argument must correspond to a key in the warnings table
Constituent.prototype.warn = function(_){
    let args=Array.from(arguments);
    let mess;
    const lang=getLanguage();
    // load the current language, 
    // HACK:  wrap object with parentheses so that the parser does not think this is the start of a block
    ({en:loadEn,fr:loadFr})[lang](); 
    const messFns = this.warnings[args.shift()];  // get the English and French jsRealB structure
    if (messFns===undefined){
        this.error("warn called with an unknown error message:"+arguments[0])
    }
    mess=this.me()+":: "+ messFns[lang].apply(null,args).cap(false) // realize the warning 
    if (exceptionOnWarning) throw mess;
    if (Array.isArray(savedWarnings))
        savedWarnings.push(mess);
    else
        console.warn(mess);
    return this;
}

// create a list of elements [a,b,c] => "a, b $conj c" 
const makeDisj = function(conj,elems){
    if (!Array.isArray(elems))elems=[elems];
    return CP.apply(null,[C(conj)].concat(elems.map(e=>Q(e))))+""
}

// table of jsRealB structures for warning messages
//   the warnings are parameterized by strings that are inserted verbatim in the realization
Constituent.prototype.warnings = {
    "bad parameter":
        {en:(good,bad)=> // the parameter should be $good, not $bad
            S(NP(D("the"),N("parameter")),
              VP(V("be").t("ps"),Q(good).a(","),Adv("not"),Q(bad))).typ({mod:"nece"}),
         fr:(good,bad)=> // le paramètre devrait être $good, pas $bad
            S(NP(D("le"),N("paramètre")),
              VP(V("être").t("c"),Q(good).a(","),Adv("non"),Q(bad))).typ({mod:"nece"})},
    "bad application":
        {en:(info,goods,bad)=> // $info should be applied to $good, not to $bad
            S(Q(info),VP(V("apply").t("ps"),
                         PP(P("to"),makeDisj("or",goods)).a(","),Adv("not"),PP(P("to"),Q(bad))))
               .typ({mod:"nece",pas:true}),
         fr:(info,goods,bad)=> // $info devrait être appliqué à $good, non à $bad.
            S(Q(info),VP(V("appliquer").t("c"),
                         PP(P("à"),makeDisj("ou",goods)).a(','),Adv("non"),PP(P("à"),Q(bad))))
              .typ({mod:"nece",pas:true})},
    "bad position":
        {en:(bad,limit)=> // $bad should be smaller than $limit.
            S(NO(bad),VP(V("be").t("ps"),A("small").f("co"),P("than"),NO(limit))).typ({mod:"nece"}),
         fr:(bad,limit)=> // $bad devrait être plus petit que $limit.
            S(NO(bad),VP(V("être").t("c"),A("petit").f("co"),Pro("que"),NO(limit))).typ({mod:"nece"})},
    "bad const for option":
        {en:(option,constType,allowedConsts)=> 
            // option $option is applied to $constType, but it should be to $allowedConsts.
              CP(C("but"),
                 VP(V("apply"),NP(N("option"),Q(option)),PP(P("to"),Q(constType))).typ({pas:true}).a(","),
                 SP(Pro("I"),VP(V("be").t("ps"),PP(P("to"),makeDisj("or",allowedConsts)))).typ({mod:"nece"})
              ),
         fr:(option,constType,allowedConsts)=>
              //  l'option $option est appliquée à $constType, mais elle devrait l'être à $allowedConsts
              CP(C("mais"),
                 VP(V("appliquer"),NP(D("le"),N("option"),Q(option)),PP(P("à"),Q(constType)))
                    .typ({pas:true}).a(","),
                 SP(Pro("je").g("f"),
                    VP(Pro("elle").c("acc"),
                       V("être").t("c"),PP(P("à"),makeDisj("ou",allowedConsts)))).typ({mod:"nece"})
              )},
    "ignored value for option":
        {en:(option,bad)=> // $bad: bad value for option $option is ignored.
            S(Q(bad).a(":"),
              VP(V("ignore"),NP(D("this"),A("bad"),N("value"),
                                PP(P("for"),N("option"),Q(option)))).typ({pas:true})),
         fr:(option,bad)=>  // $bad : cette mauvaise valeur pour l'option $option est ignorée
            S(Q(bad).a(":"),
              VP(V("ignorer"),NP(D("ce"),A("mauvais"),N("valeur"),
                                 PP(P("pour"),D("le"),N("option"),Q(option)))).typ({pas:true}))},
    "unknown type":
        {en:(key,allowedTypes) => // illegal type: $key, it should be $allowedTypes.
            S(NP(A("illegal"),N("type").a(":"),Q(key)).a(","),
              VP(Pro("I"),V("be").t("ps"),makeDisj("or",allowedTypes))).typ({mod:"nece"}),
         fr:(key,allowedTypes) => // type illégal : $key, il devrait être $allowedTypes.
            S(NP(N("type"),A("illégal").a(":"),Q(key)).a(","),
              SP(Pro("je"),VP(V("être").t("c"),makeDisj("ou",allowedTypes))).typ({mod:"nece"}))},
    "no value for option":
        {en:(option,validVals)=> // no value for option $option should be one of $validVals.
            S(NP(Adv("no"),N("value"),PP(P("for"),N("option"),Q(option))),
              VP(V("be").t("ps"),Pro("one"),PP(P("of"),Q(validVals)))).typ({mod:"nece"}),
         fr:(option,validVals)=> // aucune valeur pour l'option $option, devrait être une parmi $validVals.
            S(NP(D("aucun"),N("valeur"),PP(P("pour"),D("le"),N("option"),Q(option))).a(","),
              VP(V("être").t("c"),D("un").g("f"),PP(P("parmi"),Q(validVals)))).typ({mod:"nece"})},
    "not found":
        {en:(missing,context)=> // no $missing found in $context.
            S(AdvP(Adv("no"),Q(missing)),VP(V("find").t("pp"),PP(P("in"),Q(context)))),
         fr:(missing,context)=> // aucun $missing trouvé dans $context.
            S(D("aucun"),Q(missing),VP(V("trouver").t("pp"),PP(P("dans"),Q(context))))},
    "bad ordinal":
        {en:(value)=> // cannot realize $value as ordinal.
            S(VP(V("realize"),Q(value),AdvP(Adv("as"),N("ordinal")))).typ({neg:true,mod:"poss"}),
         fr:(value)=> // $value ne peut pas être réalisé comme un ordinal.
            S(Q(value),VP(V("réaliser"),AdvP(Adv("comme"),NP(D("un"),N("ordinal")))))
              .typ({neg:true,mod:"poss",pas:true})},
    "bad number in word":
        {en:(value)=> // cannot realize $value in words.
            S(VP(V("realize"),Q(value),PP(P("in"),N("word").n("p")))).typ({neg:true,mod:"poss"}),
         fr:(value)=>// $value ne peut pas être réalisé en mots.
            S(VP(Q(value),V("réaliser"),PP(P("en"),NP(N("mot").n("p"))))).typ({neg:true,mod:"poss",pas:true})},
    "no French contraction":
        {en:()=> // contraction is ignored in French.
            S(VP(V("ignore"),NP(N("contraction")),PP(P("in"),N("French")))).typ({pas:true}),
         fr:()=> // la contraction est ignorée en français.
            S(VP(V("ignorer"),NP(D("le"),N("contraction")),PP(P("en"),N("français")))).typ({pas:true})},
    "morphology error":
        {en:(info)=> // morphology error: $info.
            S(NP(N("morphology"),N("error")).a(":"),Q(info)),
         fr:(info)=> // erreur de morphologie : $info.
            S(NP(N("erreur"),PP(P("de"),N("morphologie"))).a(":"),Q(info))},
    "not implemented":
        {en:(info)=> // $info is not implemented.
            S(Q(info),VP(V("implement"))).typ({neg:true,pas:true}),
         fr:(info)=> // $info n'est pas implémenté.
            S(Q(info),VP(V("implémenter"))).typ({neg:true,pas:true})},
    "not in lexicon":
        {en:(lang,altPos)=> // not found in lexicon.
            S(Adv("not"),V("find").t("pp"),PP(P("in"),A(lang=="en"?"English":"French"),N("lexicon")),
              altPos!==undefined?AdvP(Adv("but"),V("exist"),Adv("as"),makeDisj("or",altPos)):Q("")),
         fr:(lang,altPos)=> // absent du lexique.
            S(AP(A("absent"),PP(P("de"),NP(D("le"),N("lexique"),A(lang=="en"?"anglais":"français")))),
              altPos!==undefined?AdvP(Adv("mais"),V("exister"),Adv("comme"),makeDisj("ou",altPos)):Q(""))},
    "no appropriate pronoun":
        {en:()=>S(VP(V("find").t("ps"),NP(D("a"),A("appropriate"),N("pronoun")))).typ({neg:true,pas:true,mod:"poss"}),
         fr:()=>S(VP(V("trouver").t("pc"),NP(D("un"),A("adéquat"),N("pronom")))).typ({neg:true,pas:true,mod:"poss"})
        },
    "both tonic and clitic":
        {en:()=>// tn(..) and c(..) cannot be used together, tn(..) is ignored.
             S(CP(C("and"),Q("tn(..)"),Q("c(..)")),VP(V("use").n("p"),Adv("together"))
                  .typ({neg:true,pas:true,mod:"poss"}).a(","),
               Q("tn(..)"),VP(V("ignore")).typ({pas:true})),
         fr:()=>// tn(..) et c(..) utilisés ensemble, tn(..) est ignoré.
             S(SP(CP(C("et"),Q("tn(..)"),Q("c(..)")),VP(V("utiliser").t("pp").n("p"),Adv("ensemble"))).a(","),
               SP(Q("tn(..)"),VP(V("ignorer")).typ({pas:true})))
        },
    "bad Constituent":
        {en:(rank,type)=> // the $rank parameter is not Constituent.
            S(NP(D("the"),Q(rank),N("parameter")),
              VP(V("be"),Q("Constituent"),Adv("but"),Q(type))).typ({neg:true}),
         fr:(rank,type)=> // le $rank paramètre n'est pas Constituent.
            S(NP(D("le"),Q(rank),N("paramètre")),
              VP(V("être"),Q("Constituent"),Adv("mais"),Q(type))).typ({neg:true})},
    "bad Dependent":
        {en:(rank,type)=> // the $rank parameter is not Dependent but $type.
            S(NP(D("the"),Q(rank),N("parameter")),
              VP(V("be"),Q("Dependent"),Adv("but"),Q(type))).typ({neg:true}),
         fr:(rank,type)=> // le $rank paramètre n'est pas Dependent mais $type.
            S(NP(D("le"),Q(rank),N("paramètre")),
              VP(V("être"),Q("Dependent"),Adv("mais"),Q(type))).typ({neg:true})},
    "Dependent needs Terminal":
        {en:(type)=> // the first parameter of Dependent is not Terminal but $type.
            S(NP(D("the"),A("first"),N("parameter"),PP(P("of"),Q("Dependent"))),
              VP(V("be"),Q("Terminal"),Adv("but"),Q(type))).typ({neg:true}),
         fr:(type)=> // le premier paramètre du Dependent n'est pas Terminal mais $type.
            S(NP(D("le"),A("premier"),N("paramètre"),PP(P("de"),NP(D("le"),Q("Dependent")))),
              VP(V("être"),Q("Terminal"),Adv("mais"),Q(type))).typ({neg:true})},
    "bad number of parameters":
        {en:(termType,number)=> // $termType accepts one parameter, but has $number.
             S(Q(termType),VP(V("accept"),NP(D("a"),A("single"),N("parameter"))).a(","),
               SP(C("but"),Pro("I"),VP(VP(V("have"),NO(number))))),
         fr:(termType,number)=> // $termType accepte un seul paramètre, mais en a $number.
             S(Q(termType),VP(V("accepter"),NP(D("un"),A("seul").pos("pre"),N("paramètre"))).a(","),
               SP(C("mais"),Pro("je"),VP(VP(Pro("en"),V("avoir"),NO(number)))))},
    "Dependent without params":
        {en:()=> // Dependent without parameter
             S(Q("Dependent"),PP(P("without"),N("parameter"))),
         fr:()=> // Dependent sans paramètre.
             S(Q("Dependent"),PP(P("sans"),N("paramètre")))},
    "bad lexicon table":
        {en:(lemma,ending)=> // error in lexicon table number: $lemma should end with $ending
            S(NP(N("error"),P("in"),N("lexicon"),N("table"),N("number")).a(":"),
              SP(Q(lemma),VP(V("end"),PP(P("with"),Q(ending)))).typ({neg:true})),
         fr:(lemma,ending)=> // erreur de numéro de table dans le lexique: $lemma devrait terminer par $ending
            S(NP(N("erreur"),P("de"),N("numéro"),P("de"),N("table"),P("dans"),NP(D("le"),N("lexique"))).a(":"),
              SP(Q(lemma),VP(V("terminer"),PP(P("par"),Q(ending)))).typ({neg:true}))},
    "ignored reflexive":
        {en:(pat)=> // cannot be reflexive, only $pat
            S(VP(V("be"),A("reflexive")).typ({"mod":"poss","neg":true}),Adv("only"),makeDisj("or",pat)),
         fr:(pat)=> // ne peut être réflexif, seulement $pat
            S(VP(V("être"),A("réflexif")).typ({"mod":"poss","neg":true}),
              pat.length>0?AdvP(Adv("seulement"),makeDisj("ou",pat)):undefined)},
    "inconsistent dependents within a coord":
        {en:(expected,found)=> //  $expected expected within this coord, but $found was found
            S(Q(expected),VP(V("expect").t("pp"),PP(P("within"),NP(D("this"),Q("coord")))),
              SP(C("but"),Q(found),V("be").t("ps"),V("find").t("pp"))),
         fr:(expected,found)=> // toutes les dépendances d'un coord devraient être $expected, mais $found a été rencontré
            S(NP(A("tout"),D("le"),N("dépendance").n("p"),P("de"),D("un"),Q("coord")),
              VP(V("devoir").t("cp"),V("être").t("b"),Q(expected)),
              SP(C("mais"),Q(found),V("être").t("pc"),V("rencontrer").t("pp")))},
    "user-warning":  // user specific message, either a String or a Constituent that will be realized
        {en:(mess)=>mess.toString(),
         fr:(mess)=>mess.toString()},
}

// show all warnings with dummy parameters in the console : useful for debugging
function testWarnings(){
    for (let w in Constituent.prototype.warnings){
        console.log(w);
        loadEn();
        NP(D("a"),N("error")).warn(w,"A","B","C");
        loadFr();
        NP(D("un"),N("erreur")).warn(w,"A","B","C");
    }
}
