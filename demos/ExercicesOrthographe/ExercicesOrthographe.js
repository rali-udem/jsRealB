Object.assign(globalThis,jsRealB);
// current language
let lang = "en";  // will be changed to "fr" at the launch in jQuery(document).ready(function() 

// current context
let config,level;
let lexicon, nombres, genres, patterns, determiners, nouns, pronominalize, adjectives, verbs, tenses, types;
// global statistics
let nbPhrases=0,nbVertes=0;

function getNom(dict,val){
    for (let key in dict){
        if (dict[key]==val)return key;
    }
    return "Strange val:"+val
}

function nouveauNP(){
    const noun = oneOf(nouns)
    let det = oneOf(determiners)
    // in English, undefinite determiner cannot be used with uncountable nouns
    if (lang == "en" && lexicon[noun]["N"]["cnt"] == "no") det = "the";
    let gender = null;
    if (lang=="fr"){
        gender = lexicon[noun]["N"]["g"]
        if (gender=="x")gender=choice("m","f")
    } else if (lexicon[noun]["N"]["g"] == "x"){
        gender=choice("m","f")
    }
    let adj = null;
    if (Math.random()<0.75){
        adj = oneOf(adjectives)
    }
    // ensure singular for uncountable English nouns
    let number = (lang=="en" && lexicon[noun]["N"]["cnt"] == "no") ? "s" : oneOf("s","p")
    const pronom = Math.random() < level.pronominalization
    return [det,adj,noun,gender,number,pronom]
}

function infosDeNP(np){
    const det = np.elements[0].lemma
    const noun = np.elements[1].lemma
    // in English, undefinite determiner cannot be used with uncountable nouns
    if (lang == "en" && lexicon[noun]["N"]["cnt"] == "no") det = "the";
    let gender = null;
    if (lang=="fr"){
        gender = lexicon[noun]["N"]["g"]
        if (gender=="x")gender=choice("m","f")
    } else if (lexicon[noun]["N"]["g"] == "x"){
        gender=choice("m","f")
    }
    let adj = null;
    if (np.elements.length==3){
        adj = np.elements[2].lemma
    }
    // ensure singular for uncountable English nouns
    let number = (lang=="en" && lexicon[noun]["N"]["cnt"] == "no") ? "s" : oneOf("s","p")
    const pronom = Math.random() < level.pronominalization
    return [det,adj,noun,gender,number,pronom]    
}

function getCharacteristics(noun,gender,number,pron){
    let characs = []
    if (pron)characs.push(config.pronominaliser);
    if (lang=="fr"){ // specify gender when it can be both in the lexicon
        if (lexicon[noun]["N"]["g"]=="x")
            characs.push(getNom(config.gender,gender));
    } else {
        if (gender !== null)
            characs.push(getNom(config.gender,gender));
    }   
    characs.push(getNom(config.number,number));
    return characs
}

function nouvellePhrase(){
    let pattern = oneOf(patterns)
    console.log("** pattern:",pattern)
    // effectuer le choix des lemmes
    let svo = make_groups(pattern);
    if (svo == null){
        console.log("** bad pattern:"+pattern)
        return
    }
    let [subjs,vps,objs] = svo
    
    // let [det_s,adj_s,noun_s,gender_s,number_s,pron_s] = nouveauNP()
    // let [det_c,adj_c,noun_c,gender_c,number_c,pron_c] = nouveauNP()
    let sujet = oneOf(subjs)
    let [det_s,adj_s,noun_s,gender_s,number_s,pron_s] = infosDeNP(sujet)
    let complement = oneOf(objs)
    let [det_c,adj_c,noun_c,gender_c,number_c,pron_c] = infosDeNP(complement)
    // let verbe = oneOf(verbs)
    let vp = oneOf(vps)
    let verbe = vp.elements[0].lemma
    if (vp.elements.length>1){
        vp.elements[1].elements.forEach(e=>verbe += " "+e.lemma)
    }
    let tenseName = oneOf(tenses)
    let typName = oneOf(types)
    let tense = config.temps[tenseName]
    if (tense == undefined)console.log("bad tense name:",tenseName)
    let typ = config.types[typName]
    if (typ == undefined)console.log("bad typ name", typName)
    

    // specification of the constraints
    let $table=$("table");
    let $tr=$("<tr/>")
    $tr.append(`<th rowspan="2">${typName}</th>`);
    $tr.append(`<th colspan="3">${getCharacteristics(noun_s,gender_s,number_s,pron_s).join(", ")}</th>`)
    $tr.append(`<th colspan="1">${tenseName}</th>`);
    $tr.append(`<th colspan="3">${getCharacteristics(noun_c,gender_c,number_c,pron_c).join(", ")}</th>`);
    $table.append($tr)
    
    $tr=$("<tr/>")
    $tr.append(`<td class="d_sujet">${det_s}</td>`);
    $tr.append(`<td class="a_sujet">${adj_s !== null?adj_s:""}</td>`)
    $tr.append(`<td class="sujet">${noun_s}</td>`);
    $tr.append(`<td class="verbe">${verbe}</td>`);
    $tr.append(`<td class="d_cod">${det_c}</td>`);
    $tr.append(`<td class="a_cod">${adj_c !== null?adj_c:""}</td>`);
    $tr.append(`<td class="cod">${noun_c}</td>`);
    $table.append($tr)
    
    $tr=$("<tr/>")
    $tr.append(`<td colspan="8"><input type="text" name="reponse" value="" id="reponse" placeholder="${config.taperLaPhrase}"  class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></td>`);
    $table.append($tr);
    $("#reponse").change(verifier)

    $tr=$("<tr/>")
    $tr.append(`<td colspan="8" class="corrige"></td>`);
    $table.append($tr);
    
    $table.append(`<tr><td class="spacer" colspan="8"></td></tr>`)
    $("#reponse").focus();
    $("#encore").prop("disabled",true);

    // let sujet=NP(D(det_s),N(noun_s));
    // if (adj_s != null)sujet.add(A(adj_s))
    if (gender_s !== null)sujet.g(gender_s)
    if (pron_s){
        sujet.pro();
    }
    sujet.n(number_s);
    
    // let complement=NP(D(det_c),N(noun_c));
    // if (adj_c != null)complement.add(A(adj_c));
    if (gender_c !==null)complement.g(gender_c)
    if (pron_c){
        complement.pro();
    }
    complement.n(number_c);
    add(vp,complement)
    corrige = S(sujet,vp).typ(typ).realize();
    nbPhrases++;
    return corrige    
}

var corrige;
function verifier(){
    // console.log("corrige",corrige)
    let reponse=$("#reponse").prop("value");
    if (reponse.length==0)return;
    reponse=reponse.replace(/ +(\?|\.)/,"$1")  // enlever les espaces avant le . ou le ?
    reponse=reponse.replace(/œ/g,"oe").replace(/’/g,"'") // normaliser ligature et apostrophe
    const n=$("table tr").length;
    // figer la réponse
    const $td=$("table").find(`tr:eq(${n-3})`).find("td:last")
    $td.text(reponse);
    
    // Comparaison de la réponse et du corrigé
    // au level des caractères
    // const sepRE=""
    // const joinStr=""
    // au level des mots
    const sepRE=/([^-\s.,:;!$()'"?[\]]+)/;
    const joinStr=" ";
    
    let reponseCmp = reponse.trim().split(sepRE);
    let corrigeCmp = corrige.trim().split(sepRE);
    var diffs=levenshtein(reponseCmp,corrigeCmp);
    // console.log("reponse:",reponseCmp)
    // console.log("corrige:",corrigeCmp)
    // console.log("diffs:",  diffs)

    let diffsHTML;
    if (diffs[1]==0){
        diffsHTML=`<span class="bravo">${reponse}</span>`;
        nbVertes++;
    } else {
        diffsHTML=applyEdits(diffs[0],reponseCmp,corrigeCmp);
    }
    // console.log("diffsHTML",diffsHTML);
    $("#exercices").find(`tr:eq(${n-2})`).find(".corrige").html(diffsHTML);
    const pourcent=Math.round(nbVertes*100/nbPhrases)
    $("#encore").prop("disabled",false);
    $("#score").html(`<b>${nbVertes}</b> / ${nbPhrases} (${pourcent} %)`)
}

function instructions(){
    const courant=$(this).prop("value");
    if (courant==config.masquerInstructions){
        $("#instructions").hide();
        $(this).prop("value",config.montrerInstructions)
    } else {
        $("#instructions").show();
        $(this).prop("value",config.masquerInstructions)
    }
}

function filter(lexicon,pos,annee){
    let res = []
    if (lang == "fr"){ 
        // in French, check if niveau <= annee 
        for (let key in lexicon){
            if (lexicon[key][pos]) {
                const niv = lexicon[key][pos]["niveau"]
                if (niv !== undefined && niv <= annee){
                    res.push(key)
                }
            }
        }
    } else {
        // in English: only select if ldv is present at the entry or pos level
        for (let key in lexicon){
            if (lexicon[key][pos]){
                if (lexicon[key]["ldv"]){
                    res.push(key)
                } else if (lexicon[key][pos]["ldv"]) {
                    res.push(key)
                }
            }
        }
    }
    return res
}

function combine(levels,kind,annee){
    // annee is also used for English as it serves as a mesure of the level
    let res = []
    for (let level in levels){
        if (levels[level].annee<=annee){
            res.push(...levels[level][kind])
        }
    }
    return res;
}

function changeLevel(){
    const levels = config.levels;
    level = levels[$("#levels").val()];
    determiners = config.determiners;
    const annee = level.annee;
    // nouns = level.nouns || filter(lexicon,"N",annee)
    // adjectives = level.adjectives || filter(lexicon,"A",annee);
    // verbs = level.verbs || filter(lexicon,"V",annee);
    patterns = level.patterns
    // keep only French tdir verbs
    // if (lang=="fr"){
    //     verbs = verbs.filter(v => lexicon[v]["V"]["pat"].includes("tdir"))
    // }
    tenses = combine(levels,"temps",annee)
    types  = combine(levels,"types",annee)
    // reset exercices and counters
    $("#exercices").empty()
    nbPhrases = 0;
    nbVertes = 0;
    corrige=nouvellePhrase();
}

function changeLang(){
    lang = lang=="en"?"fr":"en"
    load(lang);
    lexicon = getLexicon();
    // build the nveaux menu
    const $menulevels = $("#levels")
    $menulevels.empty();
    config = configuration[lang]
    const levels = config.levels;
    for (let level in levels){
        $menulevels.append(`<option value="${level}">${level}</option>`)
    }
    if ($("#instructions").is(":visible")){
        $("#cacher-montrer").val(config.masquerInstructions)
    } else {
        $("#cacher-montrer").val(config.montrerInstructions)
    }
    $("#encore").val(config.phrasesuivante);

    const otherLang = lang=="en"?"fr":"en";
    $(`*[lang=${otherLang}]`).hide()
    $(`*[lang=${lang}]`).show()
    $("#change-lang").val(config.otherLang);

    changeLevel();
 }

jQuery(document).ready(function() {
    $("#change-lang").click(changeLang)
    $("#levels").change(changeLevel)
    $("#cacher-montrer").click(instructions);
    changeLang();   
    $("#encore").click(nouvellePhrase)
});

