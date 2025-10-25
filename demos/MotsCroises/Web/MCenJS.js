var $current=null; // cellule courante
var $defCourante=null; // definition courante
var $definitionCourante=null; // affichage au-dessus de la grille
var direction="H";
var nCols,nRows, diagram, solution, numbers, acrossClues, downClues;
var startDate;
var grille;

// Conserver les actions de l'usager pour le undo
//  une action est un objet de la forme
//    déplacement {op:"dep", pos:cellule, apres:cellule}
//    inscription {op:"ins", pos:cellule, avant:"lettre", apres:"lettre"}
//    changement de direction {op:"dir", pos:cellule, avant:"H|V", apres:"H|V"}
var actions = [];

function saveAction(action){
	actions.push(action);
	// console.log(showActions());
}

function showCell(cell){
	return cell==null?"/":cell.id;
}

function showActions(){
	var res=[];
	for(var i in actions){
		var a=actions[i];
		if(a.op=="dep")
			res+="DEP("+showCell(a.pos)+","+showCell(a.apres)+"), ";
		else if (a.op=="ins")
			res+="INS("+showCell(a.pos)+","+a.avant+"=>"+a.apres+"), ";
		else if (a.op=="dir")
			res+="DIR("+showCell(a.pos)+","+a.avant+"=>"+a.apres+"), ";
		else
		 	console.log("action bizarre"+a);
	}
	return res;
}

function saveDep(avantCell,apresCell){
	saveAction({op:"dep", pos:avantCell, apres:apresCell});
}

function saveIns(avantLet,apresLet){
	saveAction({op:"ins",pos:$current, avant:avantLet,apres:apresLet});
}

function saveDir(avantDir,apresDir){
	saveAction({op:"dir",pos:$current, avant:avantDir,  apres:apresDir});
}

//  gestion de l'id sous la forme Hi_Vj
var re=/H(\d+)_V(\d+)/;
function decodeId(id){
    var h=id.replace(re,"$1");
    var v=id.replace(re,"$2");
    return {h:parseInt(h),v:parseInt(v)}
}

function encodeId(i,j){
    return "H"+i+"_V"+j;
}
function $encodeId(i,j){
    return $("#"+encodeId(i,j));
}

// vérifier si la position i,j est une case noire
function estNoire(i,j){
    return diagram[i-1].charAt(j-1)==".";
}

function scrollTo($cadre,$def){
    var defPos=$def.position()
    if(defPos){
        var topC=$cadre.position().top;
        var topD=defPos.top;
        var dist=topD-topC+$cadre.scrollTop();
        // console.log("topC:%d topD:%d scrollTop:%d dist:%d", topC,topD,$cadre.scrollTop(),dist);
        // $cadre.scrollTop(dist);
        $cadre.animate({scrollTop:dist});
    }
}

// affichage de la définition
function showDef(){
    if($current.hasClass("noire")){
        // enlever la définition courante
        if($defCourante!=null){
            $defCourante.removeClass("defCourante");
            $definitionCourante.empty();
        }
        return;
    }
    var hv=decodeId($current.attr("id"));
    // trouver le début du mot
    if(direction=="H")
        while(hv.v>1 && !estNoire(hv.h,hv.v-1))
            hv.v=hv.v-1;
    else
        while(hv.h>1 && !estNoire(hv.h-1,hv.v))
            hv.h=hv.h-1;
    var $cell=$encodeId(hv.h,hv.v);
    var id=encodeId(hv.h,hv.v);
    var couranteId=id+"-def"+direction;
    if($defCourante!=null){
        // vérifie si on est resté dans la même définition
        if(couranteId==$defCourante.attr("id"))return;
        $defCourante.removeClass("defCourante");
    }
    // nouvelle définition
    $defCourante=$("#"+couranteId);
    $defCourante.addClass("defCourante");
    $definitionCourante.text($defCourante.text());
}

function trouverMot(hv,dir){
    if (dir=="H"){
        var i=hv.h;
        var debut=hv.v;
        var fin=hv.v;
        while (debut>=1 && !estNoire(i,debut))debut--;// aller vers la gauche
        while (fin<=nCols && !estNoire(i,fin))fin++;// aller vers la droite
    } else {
        var j=hv.v;
        var debut=hv.h;
        var fin=hv.h;
        while (debut>=1 && !estNoire(debut,j))debut--;// aller vers le haut
        while (fin<=nRows && !estNoire(fin,j))fin++;// aller vers le bas
    }
    return {debut:debut+1,fin:fin-1}
}

function selectCase(i,j,select){
    if (select)
        $encodeId(i,j).addClass("selection");
    else
        $encodeId(i,j).removeClass("selection");    
}

// selectionner (ou non, selon la valeur du 2e paramètre) le mot contenant la case hv
function selectMot(hv,select){
    if(estNoire(hv.h,hv.v))return;
    // étendre la sélection à tout le mot contenant la cellule courante
    var df=trouverMot(hv,direction);
    // console.log("selectMot:%o,%s",df,direction);
    if(direction=="H"){
        var i=hv.h;
        for(var j=df.debut;j<=df.fin;j++){
            selectCase(i,j,select);
        }
    } else {
        var j=hv.v;
        for (var i=df.debut;i<=df.fin;i++){
            selectCase(i,j,select);
        }
    }
}


//  indiquer la nouvelle cellule courante
// à partir de la position h,v mais ne pas indiquer une case noire si le 3e parametre est true
//  retourne true si on a pu se déplacer...
function setCurrentHV(h,v,pasDeNoir){
    // console.log("setCurrentHV:"+h+":"+v+":"+pasDeNoir);
    if(h<1 || h>nRows || v<1 || v>nCols) return false;
    if(pasDeNoir && estNoire(h,v))return false;
    setCurrent($encodeId(h,v),true);
    return true
}

// à partir d'une nouvelle cellule
function setCurrent($newCurrent,scroll){
    if($current!=null){ // enlever la sélection courante
        $current.removeClass("courante");
        selectMot(decodeId($current.attr("id")),false);
    }
    $current=$newCurrent;
    if($current==null)return;
    selectMot(decodeId($current.attr("id")),true);
    $current.addClass("courante");
    showDef();
    if(scroll)
        scrollTo($(direction=="H"?"#hDefs":"#vDefs"),$defCourante);

}

function grilleRemplie(){
    return !($(".blanche").is(function(){return $(this).text()==""}))
}


// vérifier si un mot est complété correctement et si oui barrer sa définition
function verifierMotComplete(){
    var hv=decodeId($current.attr("id"));
    // vérifier horizontalement
    var df=trouverMot(hv,"H");
    var i=hv.h;
    var $debut=$encodeId(i,df.debut);
    // console.log("verifierH:%o,%o,%o",hv,df,$debut);
    if ($debut.attr("acrossclue")){
        var complet=true;
        for(var j=df.debut;j<=df.fin;j++){
            var $ij=$encodeId(i,j);
            if ($ij.text()=="" || $ij.hasClass("mauvaise")){
                complet=false;
                break;
            }
        }
        $debutDef=$("#"+encodeId(i,df.debut)+"-defH");
        // console.log("verifierMotCompleteH:%o:%o",$debutDef,complet);
        if (complet){
            $debutDef.addClass("motTrouve");
        } else {
            $debutDef.removeClass("motTrouve");
        }
    }
    // vérifier verticalement
    var df=trouverMot(hv,"V");
    var j=hv.v;
    var $debut=$encodeId(df.debut,j);
    // console.log("verifierV:%o,%o,%o",hv,df,$debut);
    if ($debut.attr("downclue")){
        var complet=true;
        for(var i=df.debut;i<=df.fin;i++){
            var $ij=$encodeId(i,j);
            if ($ij.text()=="" || $ij.hasClass("mauvaise")){
                complet=false;
                break;
            }
        }
        $debutDef=$("#"+encodeId(df.debut,j)+"-defV");
        // console.log("verifierMotCompleteV:%o:%o",$debutDef,complet);
        if (complet){
            $debutDef.addClass("motTrouve");
        } else {
            $debutDef.removeClass("motTrouve");
        }
    }    
}

// inscrire une lettre à la position courante
function addLetter(lettre,save){
    if($current.hasClass("cheat"))return;
    if(save)
        saveIns($current.text(),lettre)
    $current.text(lettre);
    $current.removeClass("mauvaise");
    var hv=decodeId($current.attr("id"));
    if ($("#check").is(":checked")){
        // indiquer si la lettre est bonne ou non selon la solution
        if(lettre!=solution[hv.h-1][hv.v-1])
            $current.addClass("mauvaise");
    }
    verifierMotComplete();
    if(save){
        // se positionner à la prochaine cellule
        if(direction=="H")
            setCurrentHV(hv.h,hv.v+(lettre==""?-1:1),true);
        else
            setCurrentHV(hv.h+(lettre==""?-1:1),hv.v,true);
        if(grilleRemplie()){
            // vérifier la solution en ajoutant .mauvaise aux cases différentes de la solution
            $(".blanche").each(function(index){
                const hv = decodeId($(this).attr("id"));
                if ($(this).text()!=solution[hv.h-1][hv.v-1]){
                    $(this).addClass("mauvaise")
                }
            });
            var nbSecs = Math.round((new Date()-startDate)/1000);
            var nbMin = Math.floor(nbSecs/60);
            nbSecs = nbSecs-nbMin*60;
            $("#message").text("Vous avez rempli votre grille en "+
                                nbMin+" minutes"+(nbSecs>0?(" et "+nbSecs+" secondes"):""));
        }
    }
}


// construction de la grille et des tableaux de définitions
function construireGrille($table){
    $current=null;
    $defCourante=null;
    nCols=grille.nCols;
    nRows=grille.nRows;
    // ligne du haut avec les numéros de colonne
    var $tr = $("<tr><td class='numero'></td></tr>");
    for (var j=0;j<nCols;j++)
        $tr.append("<td class='numero'>"+(j+1)+"</td>");
    $table.append($tr);
    // chaque ligne précédée de son numéro
    diagram=grille.diagram;
    solution=grille.solution;
    // liste de listes de définitions
    var horizDefs=[];
    for (var i=0;i<nRows;i++){
        horizDefs.push([])
    }
    var vertDefs=[];
    for (var j=0;j<nCols;j++){
        vertDefs.push([])
    }
    for (var i=0;i<nRows;i++){
        $tr=$("<tr><td class='numero'>"+(i+1)+"</td></tr>");
        for (var j=0; j< diagram[i].length;j++){
            var id=encodeId(i+1,j+1);
            var $td=$("<td/>").attr("id",id);
            var n = grille.numbers[i][j];
            if(n>0){ // associer un numéro de définition avec cette case
                if(grille.acrossClues[n]!=null){
                    $td.attr("acrossclue",n);
                    horizDefs[i].push({id:id,def:grille.acrossClues[n]}); 
                }
                if(grille.downClues[n]!=null){
                    $td.attr("downclue",n);
                    vertDefs[j].push({id:id,def:grille.downClues[n]});
                }
            }
            if(grille.diagram[i].charAt(j)==".")
                $td.addClass("noire");
            else {
                $td.click(setCurrentEvent);
                $td.addClass("blanche");
            }
            $tr.append($td);
        }
        $table.append($tr);
    }
    // créer les tableaux de définition
    //     horizontal
    var $horizontal=$("#hDefs")
    $horizontal.empty();
    var $horizTable=$("<table class='definitions'></table>");
    $horizontal.append($horizTable);
    for (var i=0;i<nRows;i++){
        var h=horizDefs[i];
        if (h.length==0)continue;
        $tr=$("<tr><td class='defNo'>"+(i+1)+"</td></tr>");
        var $td=$("<td/>");
        for (var k=0;k<h.length;k++){
            var d=h[k];
            var $d=$("<span id='"+d.id+"-defH'>"+d.def+"</span>");
            $d.click(function(){
                setCurrent($("#"+$(this).attr("id").replace(/-defH$/,"")),false); // retrouver l'id de la case...
                if(direction!="H")changeDir();
            });
            $d.css("cursor","pointer");
            $td.append($d);
            if (k<h.length-1)$td.append(" &mdash; ");
        }
        $tr.append($td)
        $horizTable.append($tr);
    }
    //     vertical
    var $vertical=$("#vDefs");
    $vertical.empty();
    var $vertTable=$("<table class='definitions'></table>");
    $vertical.append($vertTable);
    for (var j=0;j<nCols;j++){
        var v=vertDefs[j]
        if (v.length==0)continue;
        $tr=$("<tr><td class='defNo'>"+(j+1)+"</td></tr>");
        var $td=$("<td/>");
        for (var k=0;k<v.length;k++){
            var d=v[k];
            var $d=$("<span id='"+d.id+"-defV'>"+d.def+"</span>");
            $d.click(function(){
                setCurrent($("#"+$(this).attr("id").replace(/-defV$/,"")),false); // retrouver l'id de la case...
                if(direction!="V")changeDir();
            });
            $d.css("cursor","pointer");
            $td.append($d);
            if (k<v.length-1)$td.append(" &mdash; ");
        }
        $tr.append($td)
        $vertTable.append($tr);
    }
    // ajuster les hauteurs des fenêtres de définitions
    $("#hDefs,#vDefs").height($("#grille").height());
}

function changeDir(){
    var id=decodeId($current.attr("id"));
    selectMot(id,false);
    direction = (direction=="H")?"V":"H";
    saveDir((direction=="H")?"V":"H",direction);
    selectMot(id,true);
    showDef();
    scrollTo($(direction=="H"?"#hDefs":"#vDefs"),$defCourante);    
}


// listeners
//  indiquer la nouvelle cellule courante indiqué par un clic de souris
// à partir de la cible d'un événement
function setCurrentEvent(event){
    var $save=$current;
    var $newCurrent = $(event.currentTarget);
    if ($current!=null && $newCurrent.attr("id")==$current.attr("id")){
        // si on reclique sur la cellule courante on change la direction
        changeDir();   // change de direction
        return;
    }
    setCurrent($newCurrent,true);
    saveDep($save,$current);
}


//   Gestion des clés de clavier
var codeA="A".charCodeAt(0);
var codeZ="Z".charCodeAt(0);
var codea="a".charCodeAt(0);
var codez="z".charCodeAt(0);

function keyDown(event){
    console.log("keyDown("+event.keyCode+":"+event.shiftKey+":"+event.metaKey+
                          ":"+event.ctrlKey+":"+event.which+")");
    if($current==null)return;
    var kc=event.keyCode||event.which;
    var $saveCurr=$current;
    var hv=decodeId($current.attr("id"));
    switch (kc) {
        case 32:// un espace qui change la direction
            event.preventDefault();
            changeDir();
            break;
        case 8: // backspace qui efface la lettre
            event.preventDefault();
            addLetter("",true);
            break;
        case 37://left
            event.preventDefault();
            if(setCurrentHV(hv.h,hv.v-1,false))
                saveDep($saveCurr,$current);
            break;
        case 38: //up
            event.preventDefault();
            if(setCurrentHV(hv.h-1,hv.v,false))
                saveDep($saveCurr,$current);
            break;
        case 39: // right
            event.preventDefault();
            if(setCurrentHV(hv.h,hv.v+1,false))
                saveDep($saveCurr,$current);
            break;
        case 40: // down
            event.preventDefault();
            if (setCurrentHV(hv.h+1,hv.v,false))
                saveDep($saveCurr,$current);  
            break;
        case 63:
            addLetter(solution[hv.h-1][hv.v-1],true);
            $saveCurr.addClass("cheat");
            break;
        default: // une lettre peut-être...
            if ((kc==codez||kc==codeZ) && (event.metaKey||event.ctrlKey)){ // C-Z : undo
                if(actions.length==0)return;
                var a = actions.pop();
                setCurrent(a.pos,true);
                if(a.op=="dep"){ 
                    // deplacement
                } else if (a.op=="ins"){ 
                    // insertion
                    addLetter(a.avant,false);
                } else if (a.op=="dir"){ // changement de direction
                    selectMot(decodeId($current.attr("id"),false));
                    direction=a.avant;
                    selectMot(decodeId($current.attr("id"),true));
                    showDef();
                    scrollTo($(direction=="H"?"#hDefs":"#vDefs"),$defCourante);
                } else
                    console.log("action bizarre"+a);
            } else if((codeA<=kc && kc<=codeZ) || (codea<=kc && kc<=codez)){
                // lettre à insérer dans la case
                var lettre = String.fromCharCode(kc);
                if(codea<=kc && kc<=codez)lettre=lettre.toUpperCase();
                addLetter(lettre,true);
            }
    }
}

function getFile(){
    let file = $("#file-input")[0].files[0];
    if (file!==undefined){
        if (!file.name.endsWith(".json")){
            window.alert('Fichier "'+ file.name+'" ne se termine pas par .json');
            return;
        }
        $("#fileName").text(file.name);
        // read the local file
    	let reader = new FileReader();
    	reader.addEventListener('load', function(e) {
            // uds=parseUDs(e.target.result,file.name)
            // parse();
            grille = JSON.parse(e.target.result)
            $("#author").text(grille.author);
            $("#puzzle").text(grille.puzzle);
            $("#copyright").text(grille.copyright);
            $("#message").empty();
            var $table=$("#grille");
            $table.empty();
            $table.parent().css("width",(grille.nCols+1)*30+"px");
            construireGrille($table);
            setCurrent($(".blanche").first(),true);
            startDate=new Date();
            $("#file-input").prop("value",""); // so that we can reload the last file...
    	});
    	reader.readAsText(file);
    }
}




$(document).ready(function() {
    $definitionCourante=$('#definitionCourante');
    $("#affiche-aide").click(function(){$("#aide").toggle()});
    // $("#choix").change(function(){chargerGrille($("#choix option:selected").val())});
    // // s'assurer que le menu affiche le choix de la grille au lancement de la page
    // $("#choix [value=choisissez]").prop("selected",true);
    $(document).keydown(keyDown);
    $("#file-input").change(getFile)
    // allow file selection via drag and drop
    // adapted from https://stackoverflow.com/questions/47515232/how-to-set-file-input-value-when-dropping-file-on-page/47522812#47522812

    let docElem = document.documentElement;
    let body = document.body;
    let fileInput = document.querySelector('#file-input');

    docElem.addEventListener('dragover', (e) => {
        e.preventDefault();
        body.classList.add('dragging');
    });

    docElem.addEventListener('dragleave', () => {
        body.classList.remove('dragging');
    });

    docElem.addEventListener('drop', (e) => {
        e.preventDefault();
        body.classList.remove('dragging');

        fileInput.files = e.dataTransfer.files;
        let file = fileInput.files[0];
        if (file!==undefined){
        //   d3.select("#fileName").text(file.name);
            getFile()
        }
    });

});