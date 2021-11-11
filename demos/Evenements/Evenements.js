/// Adaptation de l'exemple présenté par Nicolas Daoust dans son mémoire de maîtrise
//      http://daou.st/JSreal/#/Demonstration
//  les données sont maintenant en "vrai" JSON avec des identificateurs plus évocateurs
//  Elles ne sont plus triées pour faire ressortir l'aspect Data2Text

loadFr();

// // ajouts au lexique
addToLexicon({"Alice":{ "N": { "g": "f", "pe": 3, "tab": ["nI"] } }});
addToLexicon({"Robert":{ "N": { "g": "m", "pe": 3, "tab": ["nI"] } }});
addToLexicon({"Nicolas":{ "N": { "g": "m", "pe": 3, "tab": ["nI"] } }});
addToLexicon({"consultation":{"N":{"g":"f","tab":["n17"]}}});
addToLexicon({"courriel":{"N":{"g":"m","tab":["n3"]}}});
addToLexicon({"contacter":{"V":{"tab":"v36","aux":["av"]}}});
addToLexicon({"privé":{"A":{"tab":["n28"]}}});

// événements à présenter

var evList = [
 { "date":"2013-09-25","time":"19:00:00", "ville":"Laval",
   "cat":"atelier", "attr":"nouveau", "tit":"Exercices de réalisation", "part":"al", "res":"al" } ,
 { "date":"2013-10-02","time":"19:00:00", "ville":"Longueuil",
   "cat":"conf", "attr":"nouveau", "tit":"Pourquoi la réalisation?", "part":"nico", "res":"nico" } ,
 { "date":"2013-09-30","time":"13:00:00", "ville":"Granby",
   "cat":"atelier", "attr":"classique", "tit":"Principes de réalisation", "part":"al" } ,
 { "date":"2013-09-27", "ville":"Montréal",
   "cat":"consult", "attr":"de une demi-heure", "part":"bob", "res":"bob" } ,
 { "date":"2013-09-30", "ville":"Granby", "adr":"au 901 rue Principale",
   "cat":"consult", "attr":"privé", "part":"bob", "res":"bob" } ,
 { "date":"2013-10-02","time":"13:00:00", "ville":"Granby",
   "cat":"atelier", "attr":"nouveau", "tit":"Exercices de réalisation", "part":"bob" } ,
 { "date":"2013-10-03","time":"13:00:00", "ville":"Longueuil",
   "cat":"atelier", "tit":"Planification et réalisation", "part":"nico" } 
];

// Définit les informations comme des chaines pour pouvoir les afficher dans la page avant l'évaluation des N
// catégories d'événements
catWordString='{"consult": N("consultation").n("p"),\n\
 "atelier": N("atelier"),\n\
 "conf":    N("conférence"),\n\
 "sejour":  N("séjour")}';
// parenthèses ajouter pour que eval sache que { } n'englobe pas un bloc mais bien une expression
catWord = eval("("+catWordString+")"); 

// participants
partInfoString='{"al":   {"name": N("Alice"),   "tel": 5552543, "email": false },\n\
 "bob":  {"name": N("Robert"),  "tel": false,   "email": "rob@JSreal.js" },\n\
 "nico": {"name": N("Nicolas"), "tel": 5556426, "email": "nic@JSreal.js" }}';
partInfo = eval("("+partInfoString+")"); 

// afficher un titre  et une liste d'objets javascript
function showList(titre,xs){
    var res;
    if (Array.isArray(xs)){ // affiche chaque élement du tableau
        res=[] 
        for (var i = 0; i < xs.length; i++) {
            res.push((i==0?"":" ")+JSON.stringify(xs[i]));
        }
        res="["+res.join(",\n")+"]"
    } else {
        res=xs;
    }
    return $("<div/>").append("<h3>"+titre+"</h3>").append("<pre>"+res+"</pre>");
}

function fmtTel(s){
    if (typeof(s)=="number")s=""+s;
    else if (typeof(s)!="string")return s;
    if (s.length==10)
        return s.replace(/(\d{3})(\d{3})(\d{4})/,"($1) $2-$3");
    if (s.length==7)
        return s.replace(/(\d{3})(\d{4})/,"(514) $1-$2");
    return s;
}

function fmtEmail(s){
    return S(s).tag("al",{"href":"mailto:"+s});
}

function last(l){
    return l[l.length-1]
}

function makeDate(date,time){
    if (time) return DT(date+"T"+time+"-04:00").dOpt({minute:time.match(/:00$/)==null,second:false});
    return DT(date+"T00:00:00-04:00").dOpt({hour:false,minute:false,second:false});
}

function comparerDateEvenement(e1,e2){
    var d1=new Date(e1.date+"T"+(e1.time!==undefined?e1.time:"00:00:00")).getTime();
    var d2=new Date(e2.date+"T"+(e2.time!==undefined?e2.time:"00:00:00")).getTime();
    return d1-d2;
}

function evenementsParVille(inL,outL){
    // console.log("%d:ev(%o,%o)",inL.length,inL,outL)
    if (inL.length == 0) return outL;
    var first=inL.shift();
    if (outL==undefined) return evenementsParVille(inL,[[first]]);
    if (first.ville==last(last(outL)).ville){
        last(outL).push(first)
    } else {
        outL.push([first])
    }
    return evenementsParVille(inL,outL);
}

function showMotif(ev){
    // motif
    if (ev.attr){
        if (ev.attr.indexOf(" ")>0) // si l'attribut comprend plus d'un mot les ajouter à la fin
            return NP(D("un"),catWord[ev.cat],ev.attr)
        else 
            return NP(D("un"),A(ev.attr),catWord[ev.cat]);
    } else
        return NP(D("un"),catWord[ev.cat]);
}

function showContact(ev,pronominalise){
    var part=partInfo[ev.part]
    var nomParticipant=NP(part.name);
    var contacter=V("contacter").t("ip").pe(2).n("p");
    if (pronominalise){
        nomParticipant=nomParticipant.pro();
        contacter=contacter.lier();
    }
    return S(PP(P("pour"),V("réserver").t("b")).a(","),
             S(VP(contacter,nomParticipant)).a(":"),part.contact);
}

function showGroupe(evs,$elem){
    // console.log("showGroupe(%o)",evs);
    var ev,titre,quand,participant,participants,constituants,place,contact;
    
    if (evs.length==1){// 1 seul événement, verbaliser directement
        ev=evs[0]
        titre = S(catWord[ev.cat], P("à"),ev.ville).a(" ").tag("h4");
        $elem.append(titre.toString());
        quand=makeDate(ev.date,ev.time).a(",")
        // participant
        participant=partInfo[ev.part].name
        // ville et adresse
        if (ev.adr)
            place=S(ev.adr,P('à'),ev.ville);
        else
            place = S(P('à'),ev.ville);
        showContact(ev,true)
        // titre
        $p=$("<p/>");
        constituants=S(quand,participant,V("être").t("f"),place,PP(P("pour"),showMotif(ev)));
        if (ev.tit)
            constituants.add(S(ev.tit).tag("i"));  
        $p.append(""+constituants)
        $p.append("<br/>")
        $p.append(""+showContact(ev,true));
        $elem.append($p)
    } else { // groupe de plusieurs événements dans la même ville
        ev=evs[0];
        titre = S(N("séjour"), P("à"),ev.ville).a(" ").tag("h4");
        $elem.append(titre.toString());
        quand=PP(P("de"),makeDate(evs[0].date,null),
                 P("à"), makeDate(last(evs).date,null)).a(",");
        // récupérer tous les participants et catégories 
        var ps=[],cats={};
        for (var i = 0; i < evs.length; i++) {
            var p=partInfo[evs[i].part];
            var cat=evs[i].cat;
            // console.log(i,evs[i])
            if (ps.indexOf(p)<0)ps.push(p);
            var nb=cats[cat];
            if (nb==null)
                cats[cat]=1;
            else
                cats[cat]+=1
        }
        // réaliser les participants
        if (ps.length>1)
            participants=CP.apply(this,[C("et")].concat(ps.map(function(p){return p.name})));
        else
            participants=ps[0].name;
        // ville et adresse
        if (ev.adr)
            place=S(ev.adr,P('à'),ev.ville);
        else
            place = S(P('à'),ev.ville);
        // réaliser les catégories d'activités
        var cs=CP(C("et"))
        for (c in cats){
            var val=cats[c];
            if (val==1)
                cs.add(NP(D("un"),catWord[c]));
            else
                cs.add(NP(NO(val).nat(),catWord[c].n("p")));
        }
        var struct=S(quand,participants,VP(V("être").t("f"),place,PP(P("pour"),cs)));
        // formatter le tout dans une liste à puces
        $elem.append("<p>"+struct+"</p>");
        $ul=$("<ul/>");
        for (var i = 0; i < evs.length; i++) {
            ev=evs[i];
            quand= makeDate(ev.date,ev.time).dOpt({det:false,day:false,year:false});
            constituants=S(quand.a(":"),showMotif(ev));
            if (ev.tit) // ajouter le titre si nécessaire
                constituants.add(S(ev.tit).tag("i"));
            if (ps.length>1) // préciser le participant s'il y en a plus d'un dans la période
                constituants.add(PP(P("avec"),partInfo[ev.part].name))
            $ul.append(""+constituants.tag("li"))
        }
        $elem.append($ul);
        $elem.append("<p>"+showContact(evs[0],ps.length==1)+"</p>")
    }
}

function generer(){
    var $sortie=$("#sortie");
    // trier les événements par date
    evList.sort(comparerDateEvenement);
    // ajouter les informations de contact
    for (p in partInfo) {
        var contact = CP(C("ou"));
        var tel = partInfo[p].tel;
        if (tel)
            contact.add(S(fmtTel(tel)));
        var em = partInfo[p].email;
        if (em)
            contact.add(S(fmtEmail(em)));
        partInfo[p].contact = contact;
    }
    var groupes=evenementsParVille(evList)
    for (var i = 0; i < groupes.length; i++) {
        showGroupe(groupes[i],$sortie);
    }
}

$(document).ready(function() {
    // montrer les données
    $("#donnees").append(showList("Événements",evList));
    $("#donnees").append(showList("Participants",partInfoString));
    $("#donnees").append(showList("Catégories d'événement",catWordString));
    generer();
});
