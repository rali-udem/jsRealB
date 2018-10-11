///// Test for developing the Elision module (now integrated in core.js)
//// English elision rule only for changing "a" to "an"
// according to https://owl.english.purdue.edu/owl/resource/591/1/
var hAnRE=/^(heir|herb|honest|honou?r|hour)/i;
//https://www.quora.com/Where-can-I-find-a-list-of-words-that-begin-with-a-vowel-but-use-the-article-a-instead-of-an
uLikeYouRE=/^(uni.*|ub.*|use.*|usu.*|uv.*)/i;
acronymRE=/^[A-Z]+$/
punctuationRE=/[,:\.\[\]\(\)\?]/

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

// for Euphonie, rules were taken from Antidote V9

// same as sepWordREen but the [\w] class extended with French Accented letters and cedilla
var sepWordREfr=/(([^<\wàâéèêëîïôöùüç'-]*(<[^>]+>)?)*)([\wàâéèêëîïôöùüç'-]+)?/yi

var elidableWordFrRE=/^(la|le|je|me|te|se|de|ne|que|puisque|lorsque|jusque|quoique)$/i
var euphonieFrRE=/^(ma|ta|sa|ce|beau|fou|mou|nouveau|vieux)$/i
var euphonieFrTable={"ma":"mon","ta":"ton","sa":"son","ce":"cet",
    "beau":"bel","fou":"fol","mou":"mol","nouveau":"nouvel","vieux":"vieil"};

var contractionFrTable={
    "à+le":"au","à+les":"aux","ça+a":"ç'a",
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
    // split content into a list of tokens [content_0, sep_0, content_1, sep_1,...]
    // to allow an easier look ahead in the case of a contraction followed by an elision
    var tokens=[current];
    while ((sepWord=sepWordREfr.exec(content))!==null){
        sep=sepWord[1];
        if (sep===undefined)sep="";
        tokens.push(sep);
        current=sepWord[4];
        if (current==undefined)break;
        tokens.push(current);
    }
    // console.log("tokens:%d:%s",tokens.length,tokens);
    current=tokens[0];
    if(tokens.length==1)return current;
    var i=2;
    while (i<tokens.length){
        previous=current; sep=tokens[i-1]; current=tokens[i];
        // console.log("%d::previous:%s;sep:%s;current:%s",i,previous,sep,current);
        if (!punctuationRE.exec(sep)){   // do not elide over punctuation
            if (elidableWordFrRE.exec(previous) && isElidableFr(current)){
                res=res+previous.slice(0,-1)+"'"+sep.trim();
            } else if (euphonieFrRE.exec(previous) && isElidableFr(current)){ // euphonie
                    if (/ce/i.exec(previous) && /(^est$)|(^étai)/.exec(current)){
                        // very special case but very frequent
                        res=res+previous.slice(0,-1)+"'"+sep.trim();
                    } else {
                        res=res+lookUp(previous,euphonieFrTable)+sep;
                    }
            } else if ((contr=lookUp(previous+"+"+current,contractionFrTable))!=null){
                // check if the next word would be elidable, so instead elide it instead of contracting
                if (elidableWordFrRE.exec(current) && i+2<tokens.length && isElidableFr(tokens[i+2])){
                    res=res+previous+sep+current.slice(0,-1)+"'"+tokens[i+1].trim();
                    current=tokens[i+2];
                    i+=2;
                } else {
                    res=res+contr+sep.trim();
                    current="";// to force the loop to ignore current
                }
            } else {
                res=res+previous+sep; // copy input
            }
        } else {
            res=res+previous+sep; // copy input
        }
        i+=2;
    }
    res+=current
    // add last separator
    if (tokens.length%2==0)res+=tokens[tokens.length-1]
    return res;
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

eval(require("fs").readFileSync(__dirname+'/elisionTests.js')+'')
console.log(showElision(elisionEn,elisionTestsEn));
console.log(showElision(elisionFr,elisionTestsFr));