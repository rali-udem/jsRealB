// listes de variantes
const nombre = Object.keys(nomNombre);
const genre = Object.keys(nomGenre);
const codeTemps=Object.keys(nomTemps);
const codeTypes=Object.keys(types);

let nbPhrases=0,nbVertes=0;

function nouvellePhrase(){
    // effectuer le choix des lemmes
    const anime=oneOf(animes);
    const inanime= oneOf(inanimes);
    // choisir parmi les variantes
    const n1=oneOf(nombre);
    let g1=null;
    const animeN = getLemma(anime)["N"]
    if (n1=="pro" && animeN["g"]=="x"){
        g1 = oneOf(genre) 
    }
    const a1=oneOf(article)
    const n2=oneOf(nombre);
    const a2=oneOf(article);
    const verbe=oneOf(transitifs);
    const adjectif=oneOf(adjectifs);
    const t=oneOf(codeTemps);
    const typ=oneOf(codeTypes);
    
    let $table=$("table");
    let $tr=$("<tr/>")
    $tr.append(`<th rowspan="2">${typ}</th>`);
    if (g1==null){
        $tr.append(`<th colspan="2">${nomNombre[n1]}</th>`);
    } else {
        if (getLanguage()=="en"){
            $tr.append(`<th colspan="2">${nomGenre[g1]} ${nomNombre[n1]}</th>`)
        } else {
            $tr.append(`<th colspan="2">${nomNombre[n1]} ${nomGenre[g1]}</th>`)
        }
    }
    $tr.append(`<th colspan="1">${nomTemps[t]}</th>`);
    $tr.append(`<th colspan="3">${nomNombre[n2]}</th>`);
    $table.append($tr)
    
    $tr=$("<tr/>")
    $tr.append(`<td class="d_sujet">${a1}</td>`);
    $tr.append(`<td class="sujet">${anime}</td>`);
    $tr.append(`<td class="verbe">${verbe}</td>`);
    $tr.append(`<td class="d_cod">${a2}</td>`);
    $tr.append(`<td class="a_cod">${adjectif}</td>`);
    $tr.append(`<td class="cod">${inanime}</td>`);
    $table.append($tr)
    
    $tr=$("<tr/>")
    $tr.append(`<td colspan="7"><input type="text" name="reponse" value="" id="reponse" placeholder="${taperLaPhrase}"  class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></td>`);
    $table.append($tr);
    $("#reponse").change(verifier)

    $tr=$("<tr/>")
    $tr.append(`<td colspan="7" class="corrige"></td>`);
    $table.append($tr);
    
    $table.append(`<tr><td class="spacer" colspan="7"></td></tr>`)
    $("#reponse").focus();
    $("#encore").prop("disabled",true);
    let sujet=NP(D(a1),N(anime));
    if (n1=="pro"){
        if (g1 !== null)sujet.g(g1)
        sujet.pro();
    } else 
        sujet.n(n1);
    let complement=NP(D(a2),N(inanime));
    if (adjectif!="")complement.add(A(adjectif));
    if (n2=="pro")complement.pro(); else complement.n(n2);
    corrige= S(sujet,VP(V(verbe).t(t),complement)).typ(types[typ]).toString();
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
    // au niveau des caractères
    // const sepRE=""
    // const joinStr=""
    // au niveau des mots
    const sepRE=/([^-\s.,:;!$()'"?[\]]+)/;
    const joinStr=" ";
    
    let reponseCmp = reponse.trim().split(sepRE);
    let corrigeCmp = corrige.trim().split(sepRE);
    var diffs=levenshtein(reponseCmp,corrigeCmp);
    // console.log(diffs);
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
    if (courant==masquerInstructions){
        $("#instructions").hide();
        $(this).prop("value",montrerInstructions)
    } else {
        $("#instructions").show();
        $(this).prop("value",masquerInstructions)
    }
}

function makeCP(args){
    return CP.apply(null,[ou].concat(args.map(t=>Q(t).tag("em")))).toString()
}

jQuery(document).ready(function() {
    $("#cacher-montrer").click(instructions);
    $("#types-phrase").html(makeCP(Object.keys(types)));
    $("#temps-verbe").html(makeCP(Object.values(nomTemps)));
    corrige=nouvellePhrase();
    $("#encore").click(nouvellePhrase)
});

