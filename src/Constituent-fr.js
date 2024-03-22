/**
   jsRealB 5.0
   Guy Lapalme, lapalme@iro.umontreal.ca, December 2023
   
   Mixin using the "weird trick" explained at
       https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
 */

export {French_constituent}
import { getLemma } from "./Lexicon.js";
import {N,A,Pro,D,V,Adv,C,P,DT,NO,Q,S,NP,AP,VP,AdvP,PP,CP,SP} from "./jsRealB.js"


/**
 * French specific Constituent class
 */
const French_constituent = (superclass) => 
    class extends superclass {
        /**
         * Return the language of this object
         *
         * @returns {"fr"}
         */
        lang(){return "fr"}
        
        /**
         * Check if language of this object is English
         *
         * @returns {false}
         */
        isEn(){return false}
        
        /**
         * Check if language of this object is French
         *
         * @returns {true}
         */
        isFr(){return true}

        /**
         * Return an object with the default properties for a French word
         *
         * @returns {{ g: "m", n: "s", pe: 3, t: "p", "aux":"av" }}
         */
        defaultProps(){
            return {"g": "m", "n": "s", "pe": 3, "t": "p", "aux": "av"}
        }

        /**
         * Initialize object properties
         */
        initProps(){
            super.initProps()
            if (this.isA("V"))
                this.taux["aux"] = "av"
        }

        /**
         * Return the list of French tonic forms
         *
         * @returns {string[]}
         */
        tonic_forms(){
            return ["toi", "lui", "nous", "vous", "eux", "elle", "elles", "on", "soi"]
        }

        tonic_pe_1(){return "moi"}

        relative_pronouns(){
            return ["qui","que","où","lequel","auquel","duquel"]
        }

        validate_neg_option(val,types){
            if (!["string","boolean"].includes(typeof val)){
                this.warn("ignored value for option",".typ("+key+")",val)
                delete types[key]
            }
            return true
        }

        // same as sepWordREen but the [\w] class is extended with French accented letters and cedilla
        // HACK: referred to by "this.constructor.sepWordREfr" 
        // according to https://stackoverflow.com/questions/69448030/javascript-refer-to-anonymous-class-static-variable
        sepWordRE(){
            return /((?:[^<\wàâéèêëîïôöùüç'-]*(?:<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?(.*)/i
        }

        /**
         * Process French elision by changing the realization fields of Terminals, the list
         * might be modified
         * @param {Terminal[]} cList list of Terminals
         * @returns undefined
         */
        doElision(cList){
            //// Elision rules for French
            // implements the obligatory elision rules of the "Office de la langue française du Québec"
            //    https://vitrinelinguistique.oqlf.gouv.qc.ca/21737/lorthographe/elision-et-apostrophe/elision-obligatoire
            // for Euphonie, rules were taken from Antidote (Guide/Phonétique)
    
            const elidableWordFrRE=/^(la|le|je|me|te|se|de|ne|que|puisque|lorsque|jusque|quoique)$/i
            const euphonieFrRE=/^(ma|ta|sa|ce|beau|fou|mou|nouveau|vieux)$/i
            const euphonieFrTable={"ma":"mon","ta":"ton","sa":"son","ce":"cet",
                "beau":"bel","fou":"fol","mou":"mol","nouveau":"nouvel","vieux":"vieil"};
    
            const contractionFrTable={
                "à+le":"au","à+les":"aux","ça+a":"ç'a",
                "de+le":"du","de+les":"des","de+des":"de","de+autres":"d'autres",
                "des+autres":"d'autres",
                "si+il":"s'il","si+ils":"s'ils"};
    
    
            function isElidableFr(realization,lemma,pos){
                // check if realization starts with a vowel
                if (/^[aeiouyàâéèêëîïôöùü]/i.exec(realization)) return true;
                if (/^h/i.exec(realization)){
                    //  check for a French "h aspiré" for which no elision should be done
                    let lexiconInfo=getLemma(typeof lemma == "string" ? lemma:realization,"fr"); // get the lemma with the right pos
                    if (typeof lexiconInfo == "undefined"){ 
                        lexiconInfo=getLemma(lemma.toLowerCase()); // check with lower case
                        if (typeof lexiconInfo == "undefined")return true; // elide when unknown
                    } 
                    if (!(pos in lexiconInfo))pos=Object.keys(lexiconInfo)[0]; // try the first pos if current not found
                    if (pos in lexiconInfo && lexiconInfo[pos].h==1) return false; // h aspiré found
                    return true;
                }
                return false;
            }
            
            var contr;
            var last=cList.length-1;
            if (last==0)return; // do not try to elide a single word
            for (var i = 0; i < last; i++) {
                if (i>0 && cList[i-1].getProp("lier")=== true) // ignore if the preceding word is "lié" to this one
                    continue;
                var m1=this.sepWordRE().exec(cList[i].realization)
                if (m1 === undefined || m1[2]===undefined) continue;
                var m2=this.sepWordRE().exec(cList[i+1].realization)
                if (m2 === undefined || m2[2]===undefined) continue;
                // HACK: m1 and m2 save the parts before and after the first word (w1 and w2) which is in m_i[2]
                // for a single word 
                var w1=m1[2];
                var w2=m2[2];
                var w3NoWords = ! /^\s*\w/.test(m1[3]); // check that the rest of the first word does not start with a word
                let elisionFound=false;
                if (isElidableFr(w2,cList[i+1].lemma,cList[i+1].constType)){ // is the next word elidable
                    if (elidableWordFrRE.exec(w1) && w3NoWords){
                        cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
                        elisionFound=true;
                    } else if (euphonieFrRE.exec(w1) && w3NoWords && cList[i].getProp("n")=="s"){ // euphonie
                        if (/^ce$/i.exec(w1) && /(^est$)|(^étai)|(^a$)/.exec(w2)){
                            // very special case but very frequent
                            cList[i].realization=m1[1]+w1.slice(0,-1)+"'"+m1[3];
                        } else if (!["et","ou"].includes(w2)){
                            // avoid euphonie before "et" or "or": e.g. "beau et fort" and not "bel et fort"
                            cList[i].realization=m1[1]+euphonieFrTable[w1]+m1[3];
                        }
                        elisionFound=true;
                    }
                }
                if (elisionFound) {
                    i++;    // skip next token 
                } else if ((contr=contractionFrTable[w1+"+"+w2])!=null && w3NoWords && last>1){
                    // try contraction
                    // check if the next word would be elidable, so instead elide it instead of contracting
                    // except when the next word is a date which has a "strange" realization
                    // do not elide when there are only two words, wait until at least another token is there
                    if (elidableWordFrRE.exec(w2) && i+2<=last && !cList[i+1].isA("DT") &&
                        isElidableFr(cList[i+2].realization,cList[i+2].lemma,cList[i+2].constType)){
                        cList[i+1].realization=m2[1]+w2.slice(0,-1)+"'"+m2[3]
                    } else if (!(w2.startsWith("le") && cList[i+1].isA("Pro"))){ 
                        // do contraction of first word and remove second word (keeping start and end)
                        // HACK: except when le/les is a pronoun
                        cList[i].realization=m1[1]+contr+m1[3];
                        cList[i+1].realization=m2[1]+m2[3].trim();
                    }
                    i++;
                }
            }
        }

        check_for_t(terminals,i){
            // check for adding -t- in French between a verb and pronoun
            if (terminals[i].isA("V") && terminals[i+1].isA("Pro")){
                /* According to Antidote:
                C'est le cas, notamment, quand le verbe à la 3e personne du singulier du passé, du présent ou 
                du futur de l'indicatif se termine par une autre lettre que d ou t et qu'il est suivi 
                des pronoms sujets il, elle ou on. Dans ce cas, on ajoute un ‑t‑ entre le verbe 
                et le pronom sujet inversé.*/
                if (/[^dt]$/.test(terminals[i].realization) && ["il","elle","on"].includes(terminals[i+1].realization)){
                    return "t-";
                }
            }            
            return ""
        }

        warning(args){
            /**
             * Create a list of elements [a,b,c] => "a, b $conj c" 
             * @param {string} conj 
             * @param {string[]} elems 
             * @returns string 
             */
            function makeDisj(elems){
                if (!Array.isArray(elems))elems=[elems];
                return CP.apply(null,[C("ou")].concat(elems.map(e=>Q(e)))).realize()
            }
    
            /**
             * Table of jsRealB structures for warning messages
             * The warnings are parameterized by strings that are inserted verbatim in the realization
             */
            const warnings = {
                "bad parameter": (good, bad)=>
                    // le paramètre devrait être $good, non $bad
                    S(NP(D("le"), N("paramètre")),
                      VP(V("être").t("c"), Q(good).a(","), Q("non"), Q(bad))).typ({"mod": "nece"}),
                "bad application": (info, goods, bad)=>
                    // $info devrait être appliqué à $good, non à $bad.
                    S(Q(info), VP(V("appliquer").t("c"),
                                  PP(P("à"), makeDisj(goods)).a(","), Q("non"), PP(P("à"), Q(bad)))
                      ).typ({"mod": "nece", "pas": true}),
                "bad position": (bad, limit)=>
                    // $bad devrait être plus petit que $limit.
                    S(Q(bad), VP(V("être").t("c"), A("petit").f("co"), C("que"), Q(limit))).typ({"mod": "nece"}),
                "bad const for option": (option, constType, allowedConsts)=>
                    // l'option $option est appliquée à $constType, mais devrait être à $allowedConsts
                    CP(C("mais"),
                       VP(V("appliquer"), NP(D("le"), N("option"), Q(option)), PP(P("à"), Q(constType)))
                           .typ({"pas": true}).a(","),
                       SP(VP(V("être").t("c"), PP(P("à"), makeDisj(allowedConsts)))).typ({"mod": "nece"})),
                "ignored value for option": (option, bad)=>
                    // $bad: cette mauvaise valeur pour l'option $option est ignorée
                    S(Q(bad).a(":"),
                      VP(V("ignorer"), NP(D("ce"), A("mauvais").pos("pre"), N("valeur"),
                                         PP(P("pour"), D("le"),N("option"), Q(option)))).typ({"pas": true})),
                "unknown type": (key, allowedTypes)=>
                    // type illégal : $key, il devrait être $allowedTypes.
                    S(NP(A("illégal"), N("type"), Q(key).b(":")).a(","),
                      VP(V("être").t("c"), makeDisj(allowedTypes)).typ({"mod": "nece"})),
                "no value for option": (option, validVals)=>
                    // aucune valeur pour l'option $option, elle devrait être une parmi $validVals.
                    S(NP(D("aucun"), N("valeur"),
                         PP(P("pour"), D("le"), N("option"), Q("A"))).a(","),
                      SP(Pro("elle"),
                         VP(V("être").t("c"), Pro("un").g("f"),
                            PP(P("parmi"), Q("B")))).typ({"mod": "nece"})),
                "not found": (missing, context)=>
                    // aucun $missing trouvé dans $context.
                    S(AdvP(D("aucun"), Q(missing)), VP(V("trouver").t("pp"), PP(P("dans"), Q(context)))),
                "bad ordinal": (value)=>
                    // $value ne peut pas être réalisé comme un ordinal.
                    S(VP(V("réaliser"), Q(value), AdvP(Adv("comme"), D("un"), N("ordinal")))).typ({"neg": true, "mod": "poss"}),
                "bad roman": (value)=>
                    // cannot realize $value as a Roman number.
                    // ne peut pas réaliser $value comme un nombre romain.
                    S(VP(V("réaliser"), Q(value), AdvP(Adv("comme"), NP(D("un"), A("romain"), N("nombre"))))).typ(
                        {"neg": true, "mod": "poss"}),
                "bad number in word": (value)=>
                    // cannot realize $value in words.
                    // $value ne peut pas être réalisé en mots.
                    S(VP(V("réaliser"), Q(value), PP(P("en"), N("mot").n("p")))).typ({"neg": true, "mod": "poss"}),
                "no French contraction": ()=>
                    // la contraction est ignorée en français.
                    S(VP(V("ignorer"), NP(D("le"),N("contraction")), PP(P("en"), N("français")))).typ({"pas": true}),
                "morphology error": (info)=>
                    // erreur dans la morphologie : $info.
                    S(NP(N("erreur"), PP(P("dans"), NP(D("le"), N("morphologie")))).a(":"), Q(info)),
                "not implemented": (info)=>
                    // $info n'est pas implémenté
                    S(Q(info), VP(V("implémenter"))).typ({"neg": true, "pas": true}),
                "not in lexicon": (lang, altPos)=>
                    // absent du lexique $lang, mais existe comme $altPos
                    S(A("absent"),
                      PP(P("de"), D("le"), lang=="fr" ? A("français"): A("anglais"), N("lexique")),
                      altPos !== undefined ? AdvP(Adv("mais"), V("exister"), Adv("comme"),makeDisj(altPos)):Q("")),
                "no appropriate pronoun": ()=>
                    // un pronom adéquat ne peut pas être trouvé
                    S(VP(V("trouver"), NP(D("un"), A("approprié"), N("pronom")))).typ({"neg": true, "pas": true, "mod": "poss"}),
                "both tonic and clitic": ()=>
                    // tn(..) et c(..) ne peuvent pas être utilisés ensemble, tn(..) est ignoré.
                    S(CP(C("et"), Q("tn(..)"), Q("c(..)")),
                      VP(V("être"),V("utiliser").t("pp"), Adv("ensemble"))
                          .typ({"neg": true, "mod": "poss"}).a(","),
                      Q("tn(..)"), VP(V("ignorer")).typ({"pas": true})),
                "bad Constituent": (rank, type)=>
                    // le $rank paramètre n'est pas Constituent.
                    S(NP(D("le"), N("paramètre"), Q(rank)),
                      VP(V("être"), Q("Constituent"), Adv("mais"), Q(type))).typ({"neg": true}),
                "bad Dependent": (rank, type)=>
                    // le paramètre $rank n'est pas Dependent mais $type
                    S(NP(D("le"), N("paramètre"), Q(rank)),
                      VP(V("être"), Q("Dependent"), Adv("mais"), Q(type))).typ({"neg": true}),
                "Dependent needs Terminal": (type)=>
                    // le premier paramètre du Dependent n'est pas Terminal mais $type.
                    S(NP(D("le"), NO(1).dOpt({"ord": true}), N("paramètre"), PP(P("de"), Q("Dependent"))),
                      VP(V("être"), Q("Terminal"), Adv("mais"), Q(type))).typ({"neg": true}),
                "bad number of parameters": (termType, number)=>
                    // $termType accepte un seul paramètre, mais en a $number.
                    S(Q(termType), VP(V("accepter"), NP(D("un"), A("seul").pos("pre"), N("paramètre"))).a(","),
                      SP(C("mais"), Pro("je"), VP(VP(Pro("en"),V("avoir"), NO(number))))),
                "Dependent without params": ()=>
                    // Dependent sans paramètre
                    S(Q("Dependent"), PP(P("sans"), N("paramètre"))),
                "bad lexicon table": (lemma, ending)=>
                    // erreur dans le lexique: $lemma devrait terminer par $ending
                    S(NP(N("erreur"), PP(P("dans"), NP(D("le"), N("lexique")))).a(":"),
                      SP(Q(lemma), VP(V("terminer"), PP(P("par"), Q(ending)))).typ({"neg": true})),
                "bad language": (lang)=>
                    // langage doit être "en" ou "fr", non $lang
                    S(NP(N("langage")), VP(V("être"), CP(C("ou"), Q('"en"'), Q('"fr"')).a(","), Q("non"), Q(lang).en('"'))).typ(
                        {"mod": "obli"}),
                "ignored reflexive": (pat)=>
                    // ne peut pas être réflexif, seulement $pat
                    S(VP(V("être"), A("réflexif")).typ({"mod": "poss", "neg": true}).a(","),
                      AdvP(Adv("seulement"), pat.length > 0 ? makeDisj(pat) : null)),
                "inconsistent dependents within a coord": (expected, found)=>
                    // $expected attendu dans ce coord mais $found a été trouvé
                    S(Q(expected), VP(V("attendre").t("pp"), PP(P("dans"), NP(D("ce"), Q("coord")))),
                      SP(C("mais"), Q(found), V("être").t("pc"), V("trouver").t("pp"))),
                "user-warning": (mess)=>
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