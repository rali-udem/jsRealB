/**
    jsRealB 2.0
    Guy Lapalme, lapalme@iro.umontreal.ca, nov 2019
 */

// https://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
// but this does not always work because ''+1.0 => "1" so nbDecimal(1.0)=>0
function nbDecimal(n) {
  var match = (''+n).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
};

function formatNumber(number, decimals, dec_point, thousands_sep) {
    // discuss at: http://phpjs.org/functions/number_format/
    // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    number = (number + '')
            .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousands_sep === 'undefined') ? '' : thousands_sep,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + (Math.round(n * k) / k)
                        .toFixed(prec);
            };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
            .split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
            .length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1)
                .join('0');
    }
    return s.join(dec);
};



//Fonctions pour la sortie en lettres:
//Fonction EnToutesLettres par Guy Lapalme , légèrement modifiée par Francis pour accomoder le genre

function enToutesLettres(s,lang){
    const en=lang=="en"
    const trace=false; // utile pour la mise au point

    // expressions des unités pour les "grands" nombres >1000 
    // expressions donnent les formes [{singulier, pluriel}...]
    //  noms de unités selon l'échelle courte présentée dans le Guide Antidote
    // elle diffère de celle présentée dans http://villemin.gerard.free.fr/TABLES/NbLettre.htm
    const unitesM=[ {sing:"mille"         ,plur:"mille"}        // 10^3
                   ,{sing:"un million"    ,plur:"millions"}     // 10^6
                   ,{sing:"un milliard"   ,plur:"milliards"}    // 10^9
                   ,{sing:"un trillion"   ,plur:"trillions"}    // 10^12
                   ,{sing:"un quatrillion",plur:"quatrillions"} // 10^15
                   ,{sing:"un quintillion",plur:"quintillions"} // 10^18
                ];
    const unitsM =[ {sing:"one thousand"      ,plur:"thousand"}    // 10^3
                   ,{sing:"one million"       ,plur:"million"}     // 10^6
                   ,{sing:"one billion"       ,plur:"billion"}     // 10^9
                   ,{sing:"one trillion"      ,plur:"trillion"}    // 10^12
                   ,{sing:"one quatrillion"   ,plur:"quatrillion"} // 10^15
                   ,{sing:"one quintillion"   ,plur:"quintillion"} // 10^18
                ];

    const maxLong=21;  // longueur d'une chaîne de chiffres traitable (fixé par la liste unitesM)

    // séparer une chaine en groupes de trois et complétant le premier groupe avec des 0 au début
    function splitS(s){
        if(s.length>3)
            return splitS(s.slice(0,s.length-3)).concat([s.slice(s.length-3)]);
        else if (s.length==1)s="00"+s;
        else if (s.length==2)s="0"+s
        return [s];
    }
    // est-ce que tous les triplets d'une liste correspondent à  0 ?
    function tousZero(ns){
        if(ns.length==0)return true;
        return (ns[0]=="000")&&tousZero(ns.slice(1));
    }

    // création d'une liste de triplets de chiffres
    function grouper(ns){ // ns est une liste de chaines de 3 chiffres
        const l=ns.length;
        if(trace)console.log("grouper:"+l+":"+ns);
        const head=ns[0];
        if(l==1)return centaines(head);
        const tail=ns.slice(1);
        if(head=="000")return grouper(tail);
        const uM=en?unitsM:unitesM;
        return (head=="001"?uM[l-2].sing:(grouper([head])+" "+uM[l-2].plur))+" "
               +(tousZero(tail)?"":grouper(tail));
    }

    // traiter un nombre entre 0 et 999
    function centaines(ns){ // ns est une chaine d'au plus trois chiffres
        if(trace)console.log("centaines:"+ns);
        if(ns.length==1)return unites(ns);
        if(ns.length==2)return dizaines(ns);
        const c=ns[0];        // centaines
        const du=ns.slice(1); // dizaines+unités
        if(c=="0") return dizaines(du);
        const cent=en?"hundred":"cent"
        if(du=="00"){
            if(c=="1") return (en?"one ":"")+cent;
            return unites(c)+" "+cent+(en?"":"s");
        }
        if(c=="1") return (en?"one ":"")+cent+" "+dizaines(du);
        return unites(c)+" "+cent+(en?" and ":" ")+dizaines(du);
    }

    // traiter un nombre entre 10 et 99
    function dizaines(ns){// ns est une chaine de deux chiffres
        if(trace)console.log("dizaines:",ns);
        const d=ns[0]; // dizaines
        const u=ns[1]; // unités
        switch  (d){
            case "0": return unites(u);
            case "1":
                return (en?["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"]
                          :["dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"])[+u];
            case "2": case "3": case "4": case "5": case "6":
                var tens = (en?["twenty","thirty","forty","fifty","sixty"]
                :["vingt","trente","quarante","cinquante","soixante"])[d-2];
                if (u==0) return tens;
                return tens + (u=="1" ? (en?"-one":" et un"): ("-"+unites(u)));
            case "7":
                if(u==0) return en?"seventy":"soixante-dix"
                return en?("seventy-"+unites(u)):("soixante-"+dizaines("1"+u));
            case "8":
                if(u==0) return en?"eighty":"quatre-vingts";
                return (en?"eighty-":"quatre-vingt-")+unites(u);
            case "9":
                if(u==0) return en?"ninety":"quatre-vingt-dix";
                return en?("ninety-"+unites(u)):("quatre-vingt-"+dizaines("1"+u));
        }
    }

    // traiter un chiffre entre 0 et 10
    function unites(u){ // u est une chaine d'un chiffre
        return (en?["zero","one","two","three","four","five","six","seven","eight","nine"]
                  :["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"])[+u];// conversion
    }
    
/// début de l'exécution de la fonction
    if(typeof s=="number")s=""+s; // convertir un nombre en chaîne
    if(!/^-?\d+$/.test(s))
        throw "nombreChaineEnLettres ne traite que des chiffres:"+s;
    let neg=false;
    if(s[0]=="-"){
        neg=true;
        s=s.slice(1);
    }
    if(s.length>maxLong)
        throw "nombreChaineEnLettres ne traite que les nombres d'au plus "+maxLong+" chiffres:"+s;
    return (neg?(en?"minus ":"moins "):"")+grouper(splitS(s)).trim();
}

// si l'orthographe française rectifiée est demandée, appliquer cette fonction à la sortie
// de enToutesLettres() pour mettre des tirets à la place des espaces partout dans le nombre...
function rectifiee(s){
    return s.replace(/ /g,"-");
}

// écriture des nombres ordinaux   //GL

// rules taken from https://www.ego4u.com/en/cram-up/vocabulary/numbers/ordinal
ordEnExceptions={"one":"first","two":"second","three":"third","five":"fifth",
                 "eight":"eighth","nine":"ninth","twelve":"twelfth"}
// règles tirées de https://francais.lingolia.com/fr/vocabulaire/nombres-date-et-heure/les-nombres-ordinaux
ordFrExceptions={"un":"premier","une":"première","cinq":"cinquième","neuf":"neuvième"}
var ordinal = function(s,lang,gender){
    const en = lang=="en";
    s=enToutesLettres(s,lang);
    if (s=="zéro" || s=="zero") return s;
    const m=/(.*?)(\w+)$/.exec(s)
    const lastWord=m[2]
    if (en) { 
        if (lastWord in ordEnExceptions)return m[1]+ordEnExceptions[lastWord]
        if (s.charAt(s.length-1)=="y") return s.substring(0,s.length-1)+"ieth"; // added from the reference
        return s+"th"
    } else {
        if (s == "un")return gender=="f"?"première":"premier";
        if (s.endsWith("et un")) return s+"ième";
        if (lastWord in ordFrExceptions) return m[1]+ordFrExceptions[lastWord];
        if (s.charAt(s.length-1)=="e" || s.endsWith("quatre-vingts")) return s.substring(0,s.length-1)+"ième";
        return s+"ième"
    }
}

