"use strict";

// compute edit distance and return list of edit commands
function levenshtein(str1,str2) {
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
                Math.min(distance[i-1][j]+1,
                         distance[i][j-1]+1, 
                         distance[i-1][j-1]+(str1[i-1]==str2[j-1]?0:1));
    
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
