export {levenshtein, computeDiffs,addHTMLStr,showDiffs, addColoredStr}

// compute edit distance between str1 and str2 and return list of edit commands 
function levenshtein(str1,str2) {
   function minimum(a,b,c) {
       if (a<=b && a<=c)return a;
       if (b<=a && b<=c)return b;
       return c;
   }
   function equalTokens(t1,t2){
       return t1.trim().toLowerCase()==t2.trim().toLowerCase();
   }
    // console.log("source:"+source);
    var out="";
    let distance = new Array(str1.length+1);
    let i,j,iStart,jStart;
    for(i=0; i<=str1.length; i++){
        distance[i] = new Array(str2.length+1);
        distance[i][0] = i;
    }
    for(j=0; j<str2.length+1; j++)
        distance[0][j]=j;
    
    for(i=1; i<=str1.length; i++)
        for(j=1;j<=str2.length; j++)
            distance[i][j]= 
                minimum(distance[i-1][j]+1,
                        distance[i][j-1]+1, 
                        distance[i-1][j-1]+(equalTokens(str1[i-1],str2[j-1])?0:1));
    
    //out += outDist(str1,str2,distance);
    
    // retrouver la liste des editions                              
    let edits = [];
    i=str1.length;
    j=str2.length;
    while(i>0 || j>0){
        var min = distance[i][j]-1;
        if (i>0 && j>0 && distance[i-1][j-1]==min){
            iStart=i=i-1;
            jStart=j=j-1;
            while(i>0 && j>0 && distance[i-1][j-1]==min-1){
                i=i-1; j=j-1; min=min-1;
            }
            edits.push(["REP",i,iStart,j,jStart]);
        } else if (j>0 && distance[i][j-1]==min){
            jStart=j=j-1;
            while(j>0 && distance[i][j-1]==min-1){
                j=j-1; min=min-1;
            }
            edits.push(["INS",j,jStart,i]);
        } else if (i>0 && distance [i-1][j]==min) {
            iStart=i=i-1;
            while(i>0 && distance[i-1][j]==min-1){
                i=i-1; min=min-1;
            }
            edits.push(["DEL",i,iStart]);
        } else {
            i--;j--;
        }
    }
    // console.log(outEdits(edits));
    return [edits,edits.length];
}

// return the tokens of both strings, the list edit commands and number of differences between two strings  
function computeDiffs(str1,str2){
    function normalize(str){
        // ligature, single right quotation mark (U+2019)
        let res=str.replace(/œ/g,"oe").replace(/’/g,"'");
        let m;
        // remove space around some special chars
        res=res.replace(/([«"(]) +/,"$1").replace(/ +([»")]])/,"$1");
        return res;
    }
    str1=normalize(str1.trim());
    str2=normalize(str2.trim());
    // tokenize by separating at spaces and punctuation and keeping all tokens by capturing ()
    const wordRegex=/([^-\s.,:;!$()"?[\]«»]+)/;  
    const toks1=str1.split(wordRegex);
    const toks2=str2.split(wordRegex);
    return [toks1,toks2].concat(levenshtein(toks1,toks2));
}

function addHTMLStr(toks,i,j,editType){
    if (i==j)return "";
    let res=toks.slice(i,j).join("");
    if (editType==undefined) return res;
    return `<span class="${editType}">${res}</span>`
}

// return two HTML strings showing the difference between the two
// classes: rep (replacement), ins (insert), del (delete)
function showDiffs(diffs,addStr){
    const [toks1,toks2,edits,nbedits]=diffs;
    // recreer les chaines en indiquant les modifications
    let out1="";
    let out2="";
    let lastI=0,lastJ=0;
    let i,j;
    for (let iEdit = edits.length - 1; iEdit >= 0; iEdit--) {
        const es = edits[iEdit]
        switch (es[0]) {
        case "REP": // replacement
            i=es[1];
            out1+=addStr(toks1,lastI,i)
            lastI = es[2]+1;
            out1+=addStr(toks1,i,lastI,"rep")
            j = es[3];
            out2+=addStr(toks2,lastJ,j);
            lastJ = es[4]+1;
            out2+=addStr(toks2,j,lastJ,"rep");
            break;
        case "INS":
            j = es[1];
            out2+=addStr(toks2,lastJ,j);
            lastJ = es[2]+1;
            out2+=addStr(toks2,j,lastJ,"ins")
            i = es[3];
            out1+=addStr(toks1,lastI,i);
            out1+=addStr(["•"],0,1,"ins");
            lastI = i;
            break;
        case "DEL":
            i = es[1];
            out1+=addStr(toks1,lastI,i);
            lastI = es[2]+1;
            out1+=addStr(toks1,i,lastI,"del");
            break;
        default:
        }
    }
    return [out1+addStr(toks1,lastI,toks1.length),out2+addStr(toks2,lastJ,toks2.length)]
}

// show differences on Node.js console using SGR codes
// adapted from https://stackoverflow.com/questions/4842424/list-of-ansi-color-escape-sequences
function sgr(codes,mess){ // Select Graphic Rendition
    return `\u001b[${codes.join(";")}m${mess}\u001b[0m`
}

function addColoredStr(toks,i,j,editType){
    const  bold=1,underlined=4,red=31,green=32,blue=34,whiteBg=47;
    if (i==j)return "";
    let res=toks.slice(i,j).join("");
    if (editType==undefined) return res;
    switch (editType) {
    case "rep":
        return sgr([bold,green,underlined],res);
    case "ins":
        return sgr([bold,red],res);
    case "del":
        return sgr([bold,blue,whiteBg],res);
    default:
        console.log("addColoredStr: bad editType",editType)
    }
    return ""
}

