/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
   
   Mixin using the "weird trick" explained at
        https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
 */


import {N,A,Pro,D,V,Adv,C,P,DT,NO,Q,S,NP,AP,VP,AdvP,PP,CP,SP} from "./jsRealB.js"

export {English_constituent}

/**
 * English specific Constituent class
 */
const English_constituent = (superclass) => 
    class extends superclass {
        /**
         * Return the language of this object
         *
         * @returns {"en"}
         */
        lang(){return "en"}
        
        /**
         * Check if language of this object is English
         *
         * @returns {true}
         */
        isEn(){return true}
        
        /**
         * Check if language of this object is French
         *
         * @returns {false}
         */
        isFr(){return false}

        
        /**
         * Return an object with the default properties for an English word
         *
         * @returns {{ g: "n", n: "s", pe: 3, t: "p" }}
         */
        defaultProps(){
            return {"g": "n", "n": "s", "pe": 3, "t": "p"}
        }

        /**
         * Return the list of English tonic forms
         *
         * @returns {string[]}
         */
        tonic_forms(){
            return ["us", "her", "you", "him", "them", "it"]
        }

        /**
         * Return the first person tonic pronoun
         *
         * @returns {"me"}
         */
        tonic_pe_1(){return "me"}

        /**
         * Return a list of English relative pronouns
         *
         * @returns {string[]}
         */
        relative_pronouns(){
            return ["that", "who", "which"]
        }

        /**
         * Validate string values for the neg options. Empty for English
         *
         * @param {*} val : unused
         * @param {*} types : unused
         * @returns {false}
         */
        validate_neg_option(val, types){
            return false
        }
   
        /**
         * Regex for matching the first word in a generated string (ouch!!! it is quite subtle...) 
         *  match index:
         *     1-possible non-word chars and optional html tags
         *     2-the real word 
         *     3-the rest after the word  
         * according to https://stackoverflow.com/questions/69448030/javascript-refer-to-anonymous-class-static-variable
         *
         * @returns {Regex}
         */
        sepWordRE(){
            return /((?:[^<\w'-]*(?:<[^>]+>)?)*)([\w'-]+)?(.*)/
        }
    
        /**
         * Process English elision by changing the realization fields of Terminals, the list
         * might be modified
         * @param {Terminal[]} cList list of Terminals
         * @returns undefined
         */
        doElision(cList){
            //// English elision rule only for changing "a" to "an"
            // according to https://owl.purdue.edu/owl/general_writing/grammar/articles_a_versus_an.html
            const hAnRE=/^(heir|herb|honest|honou?r(able)?|hour)/i;
            //https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
            const uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
            const acronymRE=/^[A-Z]+$/
            // Common Contractions in the English Language taken from :http://www.everythingenglishblog.com/?p=552
            const contractionEnTable={
                "are+not":"aren't", "can+not":"can't", "did+not":"didn't", "do+not":"don't", "does+not":"doesn't", 
                "had+not":"hadn't", "has+not":"hasn't", "have+not":"haven't", "is+not":"isn't", "must+not":"mustn't", 
                "need+not":"needn't", "should+not":"shouldn't", "was+not":"wasn't", "were+not":"weren't", 
                "will+not":"won't", "would+not":"wouldn't", "could+not":"couldn't",
                "let+us":"let's",
                "I+am":"I'm", "I+will":"I'll", "I+have":"I've", "I+had":"I'd", "I+would":"I'd",
                "she+will":"she'll", "he+is":"he's", "he+has":"he's", "she+had":"she'd", "she+would":"she'd",
                "he+will":"he'll", "she+is":"she's", "she+has":"she's", "he+would":"he'd", "he+had":"he'd",
                "you+are":"you're", "you+will":"you'll", "you+would":"you'd", "you+had":"you'd", "you+have":"you've",
                "we+are":"we're", "we+will":"we'll", "we+had":"we'd", "we+would":"we'd", "we+have":"we've",
                "they+will":"they'll", "they+are":"they're", "they+had":"they'd", "they+would":"they'd", "they+have":"they've",
                "it+is":"it's", "it+will":"it'll", "it+had":"it'd", "it+would":"it'd",
                "there+will":"there'll", "there+is":"there's", "there+has":"there's", "there+have":"there've",
                "that+is":"that's", "that+had":"that'd", "that+would":"that'd", "that+will":"that'll",
                "what+is":"what's"
            } 
            // search for terminal "a" and check if it should be "an" depending on the next word
            var last=cList.length-1;
            if (last==0)return; // do not try to elide a single word
            for (var i = 0; i < last; i++) {
                var m1=this.sepWordRE().exec(cList[i].realization)
                if (m1 === undefined || m1[2]===undefined) continue;
                var m2=this.sepWordRE().exec(cList[i+1].realization)
                if (m2 === undefined || m2[2]===undefined) continue;
                // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
                // for a single word 
                var w1=m1[2];
                var w2=m2[2];
                if ((w1=="a"||w1=="A") && cList[i].isA("D")){
                    if (/^[ai]/i.exec(w2) ||   // starts with a or i
                        (/^e/i.exec(w2) && !/^eu/i.exec(w2) || // starts with e but not eu
                        /^o/i.exec(w2) && !/^onc?e/.exec(w2) || // starts with o but not one or once
                        /^u/i.exec(w2) && !uLikeYouRE.exec(w2)) || // u does not sound like you
                        hAnRE.exec(w2) ||       // silent h
                        acronymRE.exec(w2)) {   // is an acronym
                            cList[i].realization=m1[1]+w1+"n"+m1[3];
                            i++;                     // skip next word
                        }
                } else if (this.contraction !== undefined && this.contraction === true) {
                    if (w1=="cannot"){ // special case...
                        cList[i].realization=m1[1]+"can't"+m1[3];
                    } else {
                        const contr=contractionEnTable[w1+"+"+w2];   
                        if (contr!=null) {
                            // do contraction of first word and remove second word (keeping start and end)
                            cList[i].realization=m1[1]+contr+m1[3];
                            cList[i+1].realization=m2[1]+m2[3].trim();
                            i++;
                        }
                    }
                }
            }
        }
        
        /**
         * Check if -t- must be added in the final realization. Empty for English
         *
         * @param {*} terminals unused
         * @param {*} i unused
         * @returns {""}
         */
        check_for_t(terminals,i){return ""}

        /**
         * Return a string with an English error message
         *
         * @param {string[]} args : message key followed by specific arguments
         * @returns {string}
         */
        warning(args){
            /**
             * Create a list of elements [a,b,c] => "a, b $conj c" 
             * @param {string} conj 
             * @param {string[]} elems 
             * @returns string 
             */
            function makeDisj(elems){
                if (!Array.isArray(elems))elems=[elems];
                return CP.apply(null,[C("or")].concat(elems.map(e=>Q(e)))).realize()
            }
    
            /**
             * Table of jsRealB structures for warning messages
             * The warnings are parameterized by strings that are inserted verbatim in the realization
             */
            const warnings = {
                "bad parameter":(good,bad )=> 
                    // the parameter should be $good, not $bad
                    S(NP(D("the"),N("parameter")),
                        VP(V("be").t("c"),Q(good).a(","),Q("not"),Q(bad))).typ({mod:"nece"}),
                "bad application":(info,goods,bad)=> 
                    // $info should be applied to $good, not to $bad
                    S(Q(info),VP(V("apply").t("c"),
                                    PP(P("to"),makeDisj(goods)).a(","),Q("not"),PP(P("to"),Q(bad)))
                        ).typ({mod:"nece",pas:true}),
                "bad position":(bad,limit)=> 
                    // $bad should be smaller than $limit.
                    S(Q(bad),VP(V("be").t("c"),A("small").f("co"),C("than"),Q(limit))).typ({mod:"nece"}),
                "bad const for option":(option,constType,allowedConsts)=> 
                    // the option $option is applied to $constType, but should be to $allowedConsts.
                    CP(C("but"),
                        VP(V("apply"),NP(D("the"),N("option"),Q(option)),PP(P("to"),Q(constType))).typ({pas:true}).a(","),
                        SP(VP(V("be").t("c"),PP(P("to"),makeDisj(allowedConsts)))).typ({mod:"nece"})),
                "ignored value for option":(option,bad)=>
                    // $bad: this bad value for option $option is ignored.
                    S(Q(bad).a(":"),
                        VP(V("ignore"),NP(D("this"),A("bad").pos("pre"),N("value"),
                                        PP(P("for"),N("option"),Q(option)))).typ({pas:true})),
                "unknown type": (key,allowedTypes) => 
                    // illegal type: $key, it should be $allowedTypes.
                    S(NP(A("illegal"),N("type"),Q(key).b(":")).a(","),
                        VP(V("be").t("c"),makeDisj(allowedTypes)).typ({mod:"nece"})),
                "no value for option": (option,validVals)=>
                    // no value for option $option should be one of $validVals.
                    S(NP(D("no"),N("value"),PP(P("for"),N("option"),Q(option))),
                        VP(V("be"),PP(P("among"),Q(validVals)))).typ({mod:"nece"}),
                "not found":(missing,context)=> 
                    // no $missing found in $context.
                    S(AdvP(D("no"),Q(missing)),VP(V("find").t("pp"),PP(P("in"),Q(context)))),
                "bad ordinal": (value)=> 
                    // cannot realize $value as ordinal.
                    S(VP(V("realize"),Q(value),AdvP(Adv("as"),D("a"),N("ordinal")))).typ({neg:true,mod:"poss"}),
                "bad roman":(value)=> 
                    // cannot realize $value as a Roman number.
                    S(VP(V("realize"),Q(value),AdvP(Adv("as"),NP(D("a"),A("Roman"),N("number"))))).typ({neg:true,mod:"poss"}),
                "bad number in word":(value)=> 
                    // cannot realize $value in words.
                    S(VP(V("realize"),Q(value),PP(P("in"),N("word").n("p")))).typ({neg:true,mod:"poss"}),
                "no French contraction":()=> 
                    // contraction is ignored in French.
                    S(VP(V("ignore"),NP(N("contraction")),PP(P("in"),N("French")))).typ({pas:true}),
                "morphology error":(info)=>
                    // error within the morphology: $info.
                    S(NP(N("error"),PP(P("within"),NP(D("the"),N("morphology")))).a(":"),Q(info)),
                "not implemented":(info)=> // $info is not implemented.
                    S(Q(info),VP(V("implement"))).typ({neg:true,pas:true}),
                "not in lexicon":(lang,altPos)=> 
                    // not found in lexicon.
                    S(Adv("not"),V("find").t("pp"),PP(P("within"),D("the"),A(lang=="en"?"English":"French"),N("lexicon")),
                        altPos!==undefined?AdvP(Adv("but"),V("exist"),Adv("as"),makeDisj(altPos)):Q("")),
                "no appropriate pronoun":()=>
                    // an appropriate pronoun cannot be found
                    S(VP(V("find"),NP(D("a"),A("appropriate"),N("pronoun")))).typ({neg:true,pas:true,mod:"poss"}),
                "both tonic and clitic":()=>
                    // tn(..) and c(..) cannot be used together, tn(..) is ignored.
                    S(CP(C("and"),Q("tn(..)"),Q("c(..)")),VP(V("use").n("p"),Adv("together"))
                            .typ({neg:true,pas:true,mod:"poss"}).a(","),
                        Q("tn(..)"),VP(V("ignore")).typ({pas:true})),
                "bad Constituent":(rank,type)=> 
                    // the $rank parameter is not Constituent.
                    S(NP(D("the"),N("parameter"),Q(rank)),
                        VP(V("be"),Q("Constituent"),Adv("but"),Q(type))).typ({neg:true}),
                "bad Dependent":(rank,type)=> 
                    // the $rank parameter is not Dependent but $type.
                    S(NP(D("the"),N("parameter"),Q(rank)),
                        VP(V("be"),Q("Dependent"),Adv("but"),Q(type))).typ({neg:true}),
                "Dependent needs Terminal":(type)=> 
                    // the first parameter of Dependent is not Terminal but $type.
                    S(NP(D("the"),NO(1).dOpt({"ord":true}),N("parameter"),PP(P("of"),Q("Dependent"))),
                        VP(V("be"),Q("Terminal"),Adv("but"),Q(type))).typ({neg:true}),
                "bad number of parameters":(termType,number)=> 
                    // $termType accepts one parameter, but has $number.
                    S(Q(termType),VP(V("accept"),NP(D("a"),A("single"),N("parameter"))).a(","),
                        SP(C("but"),Pro("I"),VP(VP(V("have"),NO(number))))),
                "Dependent without params":()=> 
                    // Dependent without parameter
                    S(Q("Dependent"),PP(P("without"),N("parameter"))),
                "bad lexicon table":(lemma,ending)=> 
                    // error in lexicon: $lemma should end with $ending
                    S(NP(N("error"),PP(P("within"),NP(D("the"),N("lexicon")))).a(":"),
                        SP(Q(lemma),VP(V("end"),PP(P("with"),Q(ending)))).typ({neg:true})),
                "bad language":(lang) => 
                    // language must be "en" or "fr", not $lang
                    S(NP(N("language")),VP(V("be"),CP(C("or"),Q('"en"'),Q('"fr"')).a(","),Q("not"),Q(lang).en('"'))).typ({mod:"obli"}),
                "ignored reflexive":(pat)=> 
                    // cannot be reflexive, only $pat
                    S(VP(V("be"),A("reflexive")).typ({"mod":"poss","neg":true}).a(","),
                        pat.length>0?AdvP(Adv("only"),makeDisj(pat)):undefined),
                "inconsistent dependents within a coord":(expected,found)=> 
                    //  $expected expected within this coord, but $found was found
                    S(Q(expected),VP(V("expect").t("pp"),PP(P("within"),NP(D("this"),Q("coord")))),
                        SP(C("but"),Q(found),V("be").t("ps"),V("find").t("pp"))),
                "user-warning":(mess)=>  
                    // user specific message, either a String or a Constituent that will be realized
                    S(typeof(mess) == "string" ? Q(mess): Q(mess.realize()))
            }
    
            const messFn = warnings[args.shift()];  // get the jsRealB structure
            let messExp = messFn.apply(null,args).cap(false)
            if (messFn===undefined){
                this.error("warn called with an unknown error message:"+arguments[0])
            }
            return this.me()+":: "+ messExp.realize()  
        }
    
    };
