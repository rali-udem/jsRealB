"use strict";

// compute edit distance and return list of edit commands
function levenshtein(str1,str2) {
   function minimum(a,b,c) {
       if (a<=b && a<=c)return a;
       if (b<=a && b<=c)return b;
       return c;
   }
   function equalTokens(t1,t2){
       return t1==t2;
   }
    // console.log("source:"+source);
    let out="";
    let distance = new Array(str1.length+1);
    let iStart, jStart;
    for(let i=0; i<=str1.length; i++){
        distance[i] = new Array(str2.length+1);
        distance[i][0] = i;
    }
    for(let j=0; j<str2.length+1; j++)
        distance[0][j]=j;
    
    for(let i=1; i<=str1.length; i++)
        for(let j=1;j<=str2.length; j++)
            distance[i][j]= 
                minimum(distance[i-1][j]+1,
                        distance[i][j-1]+1, 
                        distance[i-1][j-1]+(equalTokens(str1[i-1],str2[j-1])?0:1));
    
    //out += outDist(str1,str2,distance);
    
    // retrouver la liste des editions                              
    let edits = [];
    let i=str1.length;
    let j=str2.length;
    while(i>0 || j>0){
        let min = distance[i][j]-1;
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

// // return the tokens of both strings, the list edit commands and number of differences between two strings  
// //  when the second string is an Array of warnings: returns -1 as number of differences
// function computeDiffs(str1,str2){
//     function normalize(str){
//         //        ligature, single right quotation mark (U+2019)
//         return str.replace(/œ/g,"oe").replace(/’/g,"'") 
//     }
//     if (Array.isArray(str2)){ 
//         return [[],[],[],-1];
//     }
//     str1=normalize(str1.trim());
//     str2=normalize(str2.trim());
//     // // tokenize by separating at spaces and punctuation and keeping all tokens by capturing ()
//     // const wordRegex=/([^-\s.,:;!$()'"?[\]]+)/;
//     // separate by character
//     const wordRegex="";
//     const toks1=str1.split(wordRegex);
//     const toks2=str2.split(wordRegex);
//     return [toks1,toks2].concat(levenshtein(toks1,toks2));
// }


// function addHTMLStr(toks,i,j,editType){
//     if (i==j)return "";
//     let res=toks.slice(i,j).join("");
//     if (editType==undefined) return res;
//     return `<span class="${editType}">${res}</span>`
// }

// function applyEdits(diffs,text1,text2){
//     let res=[];
//     let last1=0;
//     let i=diffs.length-1;
//     while (i>=0){
//         const current=diffs[i];
//         const op=current[0];
//         if (op=="REP"){
//             const [_,start1,end1,start2,end2]=current;
//             res.push(text1.slice(last1,start1).join(""));
//             res.push(addHTMLStr(text1,start1,end1+1,"del"))
//             res.push(addHTMLStr(text2,start2,end2+1,"ins"))
//             last1=end1+1;
//         } else if (op=="INS"){
//             const [_,start2,end2,start1]=current;
//             res.push(text1.slice(last1,start1).join(""))
//             res.push(addHTMLStr(text2,start2,end2+1,"ins"))
//             last1=start1
//         } else if (op=="DEL"){
//             const [_,start1,end1]=current;
//             res.push(text1.slice(last1,start1).join(""))
//             res.push(addHTMLStr(text1,start1,end1+1,"del"))
//             last1=end1+1
//         }
//         i--;
//     }
//     res.push(text1.slice(last1,text1.length).join(""))
//     return res.join("")
// }

// if (typeof module !== 'undefined' && module.exports) { // called as a node.js module
//     exports.computeDiffs=computeDiffs;
//     exports.showDiffs = function(diffs){ return showDiffs(diffs,addColoredStr)};
// }