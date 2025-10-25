// modules ES6
export {grilleToHTML,grilleToObject,grilleToPuz}

// modules CommonJS
// module.exports = {
//     grilleToHTML:grilleToHTML,
//     grilleToObject:grilleToObject,
//     grilleToPuz:grilleToPuz
// }

// créer une page HTML avec l'information d'une grille 
function grilleToHTML(g){
    function tag(name,val,attrs){
        let res = "<"+name;
        if (attrs) 
            res+=" "+Object.entries(attrs).map(([key,val]) =>`${key}="${val}"`).join(" ")
        res +=">"+val+"</"+name+">"
        return res;
    }
    function tr(val,attrs){return tag("tr",val,attrs)}
    function td(val,attrs){return tag("td",val,attrs)}
    function th(val,attrs){return tag("th",val,attrs)}
    function noir(){return td("",{style:"background-color:black"})}

    
    let res = "";
    const head = (size=30)=>`
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<style>
		#mots-croises {
			table-layout:fixed;
			border-collapse:collapse;
			margin-right:20px;
            margin-top:50px;
		}
		#mots-croises th,#mots-croises td{
			width:${size}px;
			height:${size}px;
			margin:0;
			padding:0;
			vertical-align:middle; 
            text-align:center;
		}
        #mots-croises td{
			border: 1px solid #999;            
        }
        #mots-croises td img {
            width:${size}px;
            height:${size}px;
            display:block; 
            margin:auto;
        }
	</style>  
</head>
`;
    function grille(g,solution){
        let trs=[]
        let ths=th("",{style:"border:none"});
        for (let j=1;j<=g.nb_cols;j++) ths+=th(j)
        trs.push(tr(ths));
        for (let i=1;i<=g.nb_lignes;i++){
            let tds="  "+th(i);
            for (let j=1;j<=g.nb_cols;j++){
                if (g.isNoir(i,j)) tds+=noir() 
                else tds+=td(solution ? g.get(i,j) : "") 
            }
            trs.push(tr(tds))
        }
        return tag("table",trs.join("\n"),{id:"mots-croises"})   
    }
    
    function definitions(g){
        const {horiz:horiz,vert:vert,chevilles:chevilles} = g.sortirDefinitions();
        let res = []
        res.push(tag("h3","Horizontalement"));
        let lis = [];
        for (let [h,defs] of horiz){
            lis.push(tag("li",defs.join(" - "),{value:h}))
        }
        res.push(tag("ol",lis.join("\n   ")))
        res.push(tag("h3","Verticalement"))
        lis = []
        for (let [v,defs] of vert){
            lis.push(tag("li",defs.join(" - "),{value:v}))
        }
        res.push(tag("ol",lis.join("\n   ")))
        if (chevilles.length>0){
            res.push(tag("h3","Chevilles"));
            res.push(tag("p",chevilles.join(", ")))
        }
        return res.join("\n")        
    }

    return `
<html>
${head()}
<body style="font-family:sans-serif">
<h1>Mots croisés <i>jsRealB</i></h1>
${[grille(g,false),
   definitions(g),
   tag("h3","Solution"),
   grille(g,true)].join("\n\n")}
</body>
</html>
`}


// créer un objet avec l'information de la grille
// selon l'organisation suggérée par les fichiers .puz
// Description des champs correspondant à ceux du format PUZ décrit de façon assez cryptique à
//     https://code.google.com/archive/p/puz/wikis/FileFormat.wiki
// - nCols: nombre de colonnes
// - nRows: nombre de rangées
// - author: auteur de la grille (optionnel)
// - puzzle: titre de la grille (optionnel)
// - copyright: copyright (optionnel)
// - solution: lettres à placer dans la grilles, les carreaux noirs sont indiqués par des points
// - numbers: listes de lignes, chacune étant une liste de numéros des définitions selon la numérotation des grilles américaines qui indiquent des numéros séquentiels de cases de début de mots soit horizontalement ou verticalement. 
// - acrossClues: liste de définitions horizontales indexées selon les numéros de numbers, null s'il n'y a pas de définition correspondantes
// - downClues: liste de définitions horizontales indexées selon les numéros de numbers, null s'il n'y a pas de définition correspondantes
function grilleToObject(g,title,author,copyright){
    const nbCols = g.nb_cols;
    const nbRows = g.nb_lignes;
    let res = {title:title,author:author,copyright:copyright,nCols:nbCols,nRows:nbRows}
    let diagram = [];
    let solution = [];
    let numbers = [];
    let k=1;
    // construire les grilles
    for (let h=1;h<=nbRows;h++){
        let dline="";
        let sline="";
        let nline=[];
        for (let v=1;v<=nbCols;v++){
            if (g.isLettre(h,v)){
                dline+="-";
                sline+=g.get(h,v);
                if ((g.isNoir(h-1,v) && g.isLettre(h+1,v)) || 
                    (g.isNoir(h,v-1) && g.isLettre(h,v+1))){
                    nline.push(k++)
                } else {
                    nline.push(0)
                }
            } else {
                dline+=".";
                sline+=".";
                nline.push(0);
            }
        }
        diagram.push(dline);
        solution.push(sline);
        numbers.push(nline)
    }
    res.diagram=diagram;
    res.solution=solution;
    res.numbers=numbers;
    // ajouter les définitions
    let acrossClues = Array.from({length:k},(_)=>null);
    let downClues = Array.from({length:k},()=>null);
    for (let h=1;h<=nbRows;h++){
        for (let v=1;v<=nbCols;v++){
            const n = numbers[h-1][v-1];
            if (n!=0){
                // HACK: on utilise le fait que la grille est "entourée" de cases noires
                if (g.isNoir(h,v-1)){ // est-ce le début d'un mot horizontal
                    let mot=g.getMot(h,v,"H")
                    if (mot.length>1)
                        acrossClues[n]=g.getDef(mot)[0]
                }
                if (g.isNoir(h-1,v)){// est-ce le début d'un mot vertical
                    let mot = g.getMot(h,v,"V");
                    if (mot.length>1)
                        downClues[n]=g.getDef(mot)[0]
                }
            }
        }
    }
    res.acrossClues=acrossClues;
    res.downClues=downClues;
    res.notepad = "Cette grille teste les terminaux de jsRealB";
    return res;
}

///// Crétation d'un fichier de format ".puz" un format "binaire"
//  qui est le standard de fait pour les mots-croisés.
//  L'entrée est un objet créé par "grilleToObject(...)" qui code les informations
//  avec la même organisation que les fichiers .puz
//  Ce code est une petite modification d'une classe dans "files.js" à 
//                      https://github.com/keiranking/Phil
//  documentation : https://gist.github.com/sliminality/dab21fa834eae0a70193c7cd69c356d5
//  on peut tester la sortie en glissant le fichier sur 
//        https://communicrossings.com/files/crossword/puz/derekslager/puz.html
class PuzWriter {
  constructor() {
    this.buf = []
  }

  pad(n) {
    for (var i = 0; i < n; i++) {
      this.buf.push(0);
    }
  }

  writeShort(x) {
    this.buf.push(x & 0xff, (x >> 8) & 0xff);
  }

  setShort(ix, x) {
    this.buf[ix] = x & 0xff;
    this.buf[ix + 1] = (x >> 8) & 0xff;
  }

  writeString(s) {
    if (s === undefined) s = '';
    for (var i = 0; i < s.length; i++) {
      var cp = s.codePointAt(i);
      if (cp < 0x100 && cp > 0) {
        this.buf.push(cp);
      } else {
        // TODO: expose this warning through the UI
        console.log('string "' + s + '" has non-ISO-8859-1 codepoint at offset ' + i);
        this.buf.push('?'.codePointAt(0));
      }
      if (cp >= 0x10000) i++;   // advance by one codepoint
    }
    this.buf.push(0);
  }

  writeHeader(json) {
    this.pad(2); // placeholder for checksum
    this.writeString('ACROSS&DOWN');
    this.pad(2); // placeholder for cib checksum
    this.pad(8); // placeholder for masked checksum
    this.version = '1.3';
    this.writeString(this.version);
    this.pad(2); // probably extra space for version string
    this.writeShort(0);  // scrambled checksum
    this.pad(12);  // reserved
    this.w = json.nCols;
    this.h = json.nRows;
    this.buf.push(this.w);
    this.buf.push(this.h);
    this.numClues = json.acrossClues.length + json.downClues.length;
    this.writeShort(this.numClues);
    this.writeShort(1);  // puzzle type
    this.writeShort(0);  // scrambled tag
  }

  writeFill(json) {
    const grid = json.solution.join("");
    const BLACK_CP = '.'.codePointAt(0);
    this.solution = this.buf.length;
    for (var i = 0; i < grid.length; i++) {
      this.buf.push(grid[i].codePointAt(0));  // Note: assumes grid is ISO-8859-1
    }
    this.grid = this.buf.length;
    for (var i = 0; i < grid.length; i++) {
      var cp = grid[i].codePointAt(0);
      if (cp != BLACK_CP) cp = '-'.codePointAt(0);
      this.buf.push(cp);
    }
  }

  writeStrings(json) {
    this.stringStart = this.buf.length;
    this.writeString(json.title);
    this.writeString(json.author);
    this.writeString(json.copyright);
    const across = json.acrossClues;
    const down = json.downClues;
    for (let k=1;k<across.length;k++){
        if (across[k]!=null)this.writeString(across[k])
        if (down[k]!=null)this.writeString(down[k])
    }
    this.writeString(json.notepad)
  }

  checksumRegion(base, len, cksum) {
    for (var i = 0; i < len; i++) {
      cksum = (cksum >> 1) | ((cksum & 1) << 15);
      cksum = (cksum + this.buf[base + i]) & 0xffff;
    }
    return cksum;
  }

  strlen(ix) {
    var i = 0;
    while (this.buf[ix + i]) i++;
    return i;
  }

  checksumStrings(cksum) {
    let ix = this.stringStart;
    for (var i = 0; i < 3; i++) {
      const len = this.strlen(ix);
      if (len) {
        cksum = this.checksumRegion(ix, len + 1, cksum);
      }
      ix += len + 1;
    }
    for (var i = 0; i < this.numClues; i++) {
      const len = this.strlen(ix);
      cksum = this.checksumRegion(ix, len, cksum);
      ix += len + 1;
    }
    if (this.version == '1.3') {
      const len = this.strlen(ix);
      if (len) {
        cksum = this.checksumRegion(ix, len + 1, cksum);
      }
      ix += len + 1;
    }
    return cksum;
  }

  setMaskedChecksum(i, maskLow, maskHigh, cksum) {
    this.buf[0x10 + i] = maskLow ^ (cksum & 0xff);
    this.buf[0x14 + i] = maskHigh ^ (cksum >> 8);
  }

  computeChecksums() {
    var c_cib = this.checksumRegion(0x2c, 8, 0);
    this.setShort(0xe, c_cib);
    var cksum = this.checksumRegion(this.solution, this.w * this.h, c_cib);
    var cksum = this.checksumRegion(this.grid, this.w * this.h, cksum);
    cksum = this.checksumStrings(cksum);
    this.setShort(0x0, cksum);
    this.setMaskedChecksum(0, 0x49, 0x41, c_cib);
    var c_sol = this.checksumRegion(this.solution, this.w * this.h, 0);
    this.setMaskedChecksum(1, 0x43, 0x54, c_sol);
    var c_grid = this.checksumRegion(this.grid, this.w * this.h, 0);
    this.setMaskedChecksum(2, 0x48, 0x45, c_grid);
    var c_part = this.checksumStrings(0);
    this.setMaskedChecksum(3, 0x45, 0x44, c_part);
  }
    
}

function grilleToPuz(object){
    const pw = new PuzWriter();
    pw.writeHeader(object);
    pw.writeFill(object);
    pw.writeStrings(object);
    pw.computeChecksums();
    return new Uint8Array(pw.buf);  
}
