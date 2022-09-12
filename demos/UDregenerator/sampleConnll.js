const udDir="/Users/lapalme/Dropbox/UDregenerator/UD-2.8/"
const sampleSize=10

// taken from https://javascript.info/task/shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
import { readFileSync, writeFileSync } from 'fs';
import _glob from "glob";
const { glob } = _glob;
import { parseUDs } from "./UDregenerator.js";

for (const lang of ["en","fr"]){
    let nbFiles=0
    let total=0
    let total0=0
    const sampleOutFileName=`${udDir}${lang}-sample-${sampleSize}.conllux1`;
    let fileNames=glob.sync(`${udDir}${lang}/*-ud-test.conllu`,{});
    let out="";
    for (let fileName of fileNames){
        nbFiles++;
        let conlluFile = readFileSync(fileName,{encoding:'utf8', flag:'r'});
        let uds=parseUDs(conlluFile,fileName);
        const n0=uds.length;
        total0+=n0;
        uds=uds.filter(ud=>ud.nodes.length>5); // keep only UD with 5 tokens or more (counting the dummy 0 element)
        const n=uds.length;
        total+=n;
        shuffle(uds); // permute the uds
        for (let i=0;i<sampleSize;i++){ // take only the first
            const ud=uds[i];
            ud.jsRealBexpr="##"
            out+=`# file = ${fileName.substring(udDir.length)}\n`;
            out+=ud.conll();
        }
        console.log("%s::%d ud sampled from %d (%d)",fileName.substring(udDir.length),sampleSize,total,total0);
    }
    writeFileSync(sampleOutFileName,out,{encoding:'utf8', flag:'w'})
    console.log("%d files processed; %d ud sampled from %d (%d)",nbFiles,nbFiles*sampleSize,total,total0)
}
