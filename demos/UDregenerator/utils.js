export {appendTo, fixPunctuation, compareAll };
// useful auxiliary functions

// add elements of list l2 to the end of l1 and return l1
//  because I have problem remembering this trick taken from
//   https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/push
function appendTo(l1,l2){
    if (Array.isArray(l2)){
        Array.prototype.push.apply(l1,l2);
    } else {
        l1.push(l2)
    }
    return l1;
}

function fixPunctuation(str){
    str=str.replace(/ +([-,.?!:%])/g,"$1");
    str=str.replace(/\( /,"(");
    str=str.replace(/ \)/,")");
    return str;
}

// check if two tokens are equal (taking some exception into account)
function equalToks(jTok,tTok){
    jTok=jTok.trim().toLowerCase();
    tTok=tTok.trim().toLowerCase();
    if (jTok==tTok)return true;
    if (jTok=="is"   && (tTok=="ai" || tTok=="'s"))return true;
    if (jTok=="not"  && (tTok=="n't" || tTok=="nt"))return true;
    if (jTok=="will" && tTok=="'ll")return true;
    return false
}

// realize each group and compare with the original text
// show differences on the Javascript console
function compareAll(){
    let nb=0,nbDiffs=0;
    for (let g of groups){
        nb++;
        const text=g.depsInfo.deps.map(d=>d.form).join(" ").trim();
        const jsr=g.jsrReal;
        const sentId=g.depsInfo.sentId;
        let jsrTokens=jsr.split(/([\w']+)/).filter(t=>!/^ *$/.test(t));
        let textTokens=text.split(/([\w']+)/).filter(t=>!/^ *$/.test(t));
        if (textTokens[textTokens.length-1].trim()!="."){
            if (textTokens[textTokens.length-1].trim()!=jsrTokens[jsrTokens.length-1].trim())
                jsrTokens.pop()
        }
        if (jsrTokens.length != textTokens.length){
            console.log(sentId+":"+text+":"+jsr);
            nbDiffs++;
        } else {
            for (i in textTokens){
                if (!equalToks(jsrTokens[i],textTokens[i])){
                    console.log(sentId+":"+text+":"+jsr);
                    nbDiffs++;
                    break;
                }
            }
        }
    }
    console.log("%d structures processed; %d difference%s",nb,nbDiffs,nbDiffs>1?"s":"")
}
