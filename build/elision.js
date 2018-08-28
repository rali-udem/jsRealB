///// Test for developing the Elision module (now integrated in core.js)
//// English elision rule only for changing "a" to "an"
// according to https://owl.english.purdue.edu/owl/resource/591/1/
var hAnRE=/^(heir|herb|honest|honou?r|hour)/i;
//https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
acronymRE=/^[A-Z]+$/
punctuationRE=/[,:\."'\[\]\(\)\?]/

// regex for matching (ouch!!! it is quite subtle...) 
//     1-possible non-word chars and optional html tags
//     4-following word  
var sepWordREen=/(([^<\w'-]*(<[^>]+>)?)*)([\w'-]+)?/yi

function elisionEn(content){
    sepWordREen.lastIndex=0; // make sure to restart matching
    var sepWord=sepWordREen.exec(content);
    if (sepWord===null) return content;
    var previous="", sep=sepWord[1], current=sepWord[4];
    if (current===undefined) return content; // only a separator found
    var res=(sep===undefined)?"":sep;
    while ((sepWord=sepWordREen.exec(content))!==null){
        previous=current; sep=sepWord[1]; current=sepWord[4];
        if (sep===undefined)sep="";
        if (current===undefined){
                return res+previous+sep;
        }
        // console.log("%s:%s:%s",previous,sep,current)
        if (previous=="a" || previous=="A"){
            if (!punctuationRE.exec(sep)){   // do not elide over punctuation
                if (/^[aeio]/i.exec(current) ||   // start with a vowel
                    (current.charAt(0)=="u" && !uLikeYouRE.exec(current)) || // u does not sound like you
                    hAnRE.exec(current) ||       // silent h
                    acronymRE.exec(current)) {   // is an acronym
                        res=res+(previous=="a"?"an":"An")+sep;
                        continue;
                }
            }
        }
        res=res+previous+sep; // copy input
    }
    return res+current;
}

//// Elision rules for French
// implements the obligatory elision rules of the "Office de la langue française du Québec"
//    http://bdl.oqlf.gouv.qc.ca/bdl/gabarit_bdl.asp?Th=2&t1=&id=1737
// but does not always taking into account the actual part of speech
// only takes the first case from the lexicon
// As this algorithm is greedy, it only goes forward in a sentence by considering pairs of words 
//  it cannot handle cases like:
//       "à le homme"   => "au homme"  should be "à l'homme"
//       "de le exercice" => "du exercice" instead of "de l'exercice"

// for Euphonie, rules taken from Antidote V9

// same as sepWordREen but the [\w] class extended with French Accented letters and cedilla
var sepWordREfr=/(([^<\wàâéèêëîïôöùüç'-]*(<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?/yi

var elidableWordFrRE=/^(la|le|je|me|te|se|de|ne|que|jusque|quoique)$/i
var euphonieFrRE=/^(ma|ta|sa|ce|beau|fou|mou|nouveau|vieux)$/i
var euphonieFrTable={"ma":"mon","ta":"ton","sa":"son","ce":"cet",
    "beau":"bel","fou":"fol","mou":"mol","nouveau":"nouvel","vieux":"vieil"};

var contractionFrTable={
    "à+le":"au","à+les":"aux",
    "de+le":"du","de+les":"des","de+des":"de","de+autres":"d'autres",
    "des+autres":"d'autres",
    "si+il":"s'il","si+ils":"s'ils"};

function lookUp(entry,table){
    var res=table[entry.toLowerCase()]
    if (res==null) return null;
    var c=entry.charAt(0);
    if (c.toUpperCase()==c){
        return res.charAt(0).toUpperCase()+res.slice(1)
    }
    return res;
}

function elisionFr(content){
    sepWordREfr.lastIndex=0; // make sure to restart matching
    var sepWord=sepWordREfr.exec(content)
    if (sepWord===null) return content;
    var previous="",sep=sepWord[1], current=sepWord[4];
    if (current===undefined) return content; // only a separator found
    var res=(sep===undefined)?"":sep;
    while ((sepWord=sepWordREfr.exec(content))!==null){
        // console.log("res:"+res);
        previous=current; sep=sepWord[1]; current=sepWord[4];
        if (sep===undefined)sep="";
        if (current===undefined){// at the end of the string with only a separator
            return res+previous+sep;
        }
        // console.log("previous:%s;sep:%s;current:%s",previous,sep,current);
        if (!punctuationRE.exec(sep)){   // do not elide over punctuation
            if (elidableWordFrRE.exec(previous)){
                if (isElidableFr(current)){
                    res=res+previous.slice(0,-1)+"'"+sep.replace(/ /g,"");
                    continue;
                }
            }
            if (euphonieFrRE.exec(previous)){ // euphonie
                if (isElidableFr(current)){
                    if (/ce/i.exec(previous) && /(^est$)|(^étai)/.exec(current)){
                        // very special case but very frequent
                        res=res+previous.slice(0,-1)+"'"+sep.replace(/ /g,"");
                    } else
                        res=res+lookUp(previous,euphonieFrTable)+sep;
                    continue;
                }
            }
            var contr=lookUp(previous+"+"+current,contractionFrTable);
            if (contr!=null){
                res=res+contr+sep.replace(/ /g,"");
                // to force the loop to ignore current
                previous="";sep="";current="";
                continue;
            }
        }
        res=res+previous+sep; // copy input
    }
    return res+current;
}

function isElidableFr(word){
    if (/^[aeiouàâéèêëîïôöùü]/i.exec(word)) return true;
    if (/^h/i.exec(word) && !hAspire(word)) return true;
    return false;
}

// used for testing : in real life, should look in the lexicon for the presence of flag h:1
// and even there one should do some morphology... e.g. heurter should be conjugated!
function hAspire(word){
    return /^(héros|hêtre|honte|hibou)/i.exec(word)
}

function showElision(elisionFn,strings){
    for (var i = 0; i < strings.length; i++) {
        s=strings[i]
        console.log("**",s)
        console.log("->",elisionFn(s))
    }
}

console.log(showElision(elisionEn,[
    "<p><i>123 men</i></p>",
    "@@A <p>elevator</p>",
    "A unicorn, a unusual exercise, a honorable mention, a humorous guy",
    "This is a XML exercise that <i><b>a</b> educator</i> can give",
    "Plays <a href='https:en.wikipedia.org/wiki/A_(musical_note)'>musical note named A</a>, on the oboe for tuning the orchestra for it.",
    "&"
]))

console.log(showElision(elisionFr,[
    "<p><i>bonjour</i></p>",
    "Le enfant",
    "le chat se élève le Élève le 'avocat' que aujourd'hui claque à ma amie",
    "le Hameçon le héros ma Habitude",
    "De le <b>chapeau</b>, à <i>les amis</i>, mon <b>beau</b> ami, mon <i>vieux étudiant</i>.",
    "Et ceci aussi fonctionne: jusque à les, jusque à des!!!",
    "&","bonjour",
    "Le élève aimable écrit sur la ardoise",
    "Je te aime pour la éternité",
    "Ce ne est pas un test de élision très aisé à réussir de le premier coup",
    "Que je aime à faire ce exercice et ce est un chien",
    "Que il aime avoir de le exercice",
    "La église et la amie et sa amie",
    "Quoique il fasse beau",
    "La élève me a dit de ne pas la interroger",
    "La histoire est une épreuve de examen et le homme ne respecte plus la nature",
    "Ma amie et ce honnête père sont entrés avec la armoire",
    "Ce est de la affection dont cet enfant a besoin",
    "<b>Les tests suivants te illustrent la erreur</b>",
    "Il se adressa *à le homme* à la porte de ce ancien chateau",
    "Ça été très difficile de approcher et *de le approcher*",
    "La hirondelle me honore mais me amène *à le hôpital* et à le hibou"
]))