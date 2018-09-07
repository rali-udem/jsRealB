// événements à présenter
var evList = [
{ date:'2013-09-25', ville:'Laval',cat:'at', h:'19:00', attr:'nouveau', tit:'Exercices de réalisation', part:'a', res:'a' } ,
{ date:'2013-09-27', ville:'Montréal',cat:'cs', attr:'de une demi-heure', part:'r', res:'r' } ,
{ date:'2013-09-30', ville:'Granby', adr:'au 901 rue Principale',cat:'cs', attr:'privé', part:'r', res:'r' } ,
{ date:'2013-09-30', ville:'Granby',cat:'at', h:'13:00', attr:'classique', tit:'Principes de réalisation', part:'a' } ,
{ date:'2013-10-02', ville:'Granby',cat:'at', h:'13:00', attr:'nouveau', tit:'Exercices de réalisation', part:'r' } ,
{ date:'2013-10-02', ville:'Longueuil',cat:'cf', h:'19:00', attr:'nouveau', tit:'Pourquoi la réalisation?', part:'n', res:'n' } ,
{ date:'2013-10-03', ville:'Longueuil',cat:'at', h:'13:00', tit:'Planification et réalisation', part:'n' } 
];

// Définit les informations comme des chaines pour pouvoir les afficher dans la page avant l'évaluation des N
// catégories d'événements
catWordString="{\n\
  cs: N('consultation').n('p'),\n\
  at: N('atelier'),\n\
  cf: N('conférence'),\n\
  sj: N('séjour')\n\
}";
// parenthèses ajouter pour que eval sache que { } n'englobe pas un bloc mais bien une expression
catWord = eval("("+catWordString+")"); 

// participants
partInfoString="{\n\
  a: { name: N('Alice'), tel: 5552543, email: false },\n\
  r: { name: N('Robert'), tel: false, email: 'rob@JSreal.js' },\n\
  n: { name: N('Nicolas'), tel: 5556426, email: 'nic@JSreal.js' }\n\
}";
partInfo = eval("("+partInfoString+")"); 

// texte à produire
//   attention il ne correspond pas tout à fait aux données !!!

// <h4>Atelier à Laval</h4>
// <p>Le mercredi 25 septembre 2013 à 19 h, Alice sera à Laval pour le nouvel atelier <i>Exercices de réalisation</i>. Pour réserver, contactez-la au 555-2543.</p>
// <h4>Consultations à Montréal</h4>
// <p>Le vendredi 27 septembre 2013, Robert sera à Montréal pour des consultations de une demi-heure. Pour réserver, contactez-le au <a href="mailto:rob@JSreal.js">rob@JSreal.js</a>.</p>
// <h4>Séjour à Granby</h4>
// <p>Du lundi 30 septembre au mercredi 2 octobre 2013, Alice et Robert seront à Granby, au 901 rue Principale, pour des consultations privées et deux ateliers.</p>
// <ul>
//   <li>30 septembre à 13 h: atelier classique <i>Principes de réalisation</i> avec Alice</li>
//   <li>2 octobre à 13 h: nouvel atelier <i>Exercices de réalisation</i> avec Robert</li>
// </ul>
// <p>Pour réserver, contactez Robert
// au <a href="mailto:rob@JSreal.js">rob@JSreal.js</a>.</p>
// <h4>Séjour à Longueuil</h4>
// <p>Les mercredi 2 et jeudi 3 octobre 2013, je serai à Longueuil pour plusieurs événements.</p>
// <ul>
//   <li>2 octobre à 19 h: nouvelle conférence <i>Pourquoi la réalisation?</i></li>
//   <li>3 octobre à 13 h: nouvel atelier <i>Planification et réalisation</i></li>
// </ul>
// <p>Pour réserver, contactez-moi
// au 555-6426 ou au <a href="mailto:nic@JSreal.js">nic@JSreal.js</a>.</p>

// function showObj(obj){
//     var res="";
//     for (i in obj) {
//         o=obj[i];
//         if (typeof(o)=="string")o='"'+o+'"';
//         res+=i+":"+o+", ";
//     }
//     return " {"+res.replace(/, $/,"")+"}";
// }

function showList(titre,xs){
    var res="";
    if (Array.isArray(xs)){
        for (var i = 0; i < xs.length; i++) {
            res+=" "+JSON.stringify(xs[i])+",\n";
        }
        res="[\n"+res.replace(/,\n$/,"\n")+"]"
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
    return S(s).tag("a",{"href":"mailto:"+s});
}

function last(l){
    return l[l.length-1]
}

function makeDate(d,h){
    if (h) return DT(d+"T"+h+"-04:00").dOpt({minute:h.match(/:00$/)==null});
    return DT(d+"T00:00:00-04:00").dOpt({hour:false,minute:false});
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
    var nomParticipant=NP(part.name)
    if (pronominalise) nomParticipant=nomParticipant.pro()
    return S(PP(P("pour"),V("réserver").t("b")).a(","),
             S(VP(V("contacter").t("ip").pe(2).n("p"),nomParticipant),part.contact));
}

function showGroupe(evs,$elem){
    // console.log("showGroupe(%o)",evs);
    var ev,titre,quand,participant,participants,constituants,place,contact;
    if (evs.length==1){
        ev=evs[0]
        titre = S(catWord[ev.cat], P("à"),ev.ville).tag("h4");
        $elem.append(titre.toString());
        quand=makeDate(ev.date,ev.h).a(",")
        // participant
        participant=partInfo[ev.part].name
        // ville et adresse
        if (ev.adr)
            place=S(ev.adr,P('à'),ev.ville);
        else
            place = S(P('à'),ev.ville);
        showContact(ev,true)
        // contact=S(PP(P("pour"),V("réserver").t("b")).a(","),
        //           S(VP(V("contacter").t("b"),NP(getLemma(participant)).pro())),partInfo[ev.part].contact).b(" ");
        // titre
        $p=$("<p/>");
        constituants=S(quand,participant,V("être").t("f"),place,PP(P("pour"),showMotif(ev)));
        if (ev.tit)
            constituants.add(S(ev.tit).tag("i"));  
        $p.append(""+constituants)
        $p.append("<br/>")
        $p.append(""+showContact(ev,true));
        $elem.append($p)
    } else {
        ev=evs[0];
        titre = S(N("séjour"), P("à"),ev.ville).tag("h4");
        $elem.append(titre.toString());
        quand=PP(P("de"),makeDate(evs[0].date,null),
                 P("à"), makeDate(last(evs).date,null)).a(",");
        // récupérer les participants et les catégories d'activités
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
        // console.log("ps=%o",ps);
        if (ps.length>1)
            participants=CP.apply(this,[C("et")].concat(ps.map(function(p){return p.name})));
        else
            participants=ps[0].name;
        // console.log("participants:%o",participants);
        // ville et adresse
        if (ev.adr)
            place=S(ev.adr,P('à'),ev.ville);
        else
            place = S(P('à'),ev.ville);
        // catégories d'activites
        var cs=CP(C("et"))
        for (c in cats){
            var val=cats[c];
            if (val==1)
                cs.add(NP(D("un"),catWord[c]));
            else
                cs.add(NP(NO(val).nat(),catWord[c].n("p")));
        }
        var struct=S(quand,participants,VP(V("être").t("f"),place,PP(P("pour"),cs)));
        // console.log("struct:%o",struct)
        $elem.append("<p>"+struct+"</p>");
        $ul=$("<ul/>");
        for (var i = 0; i < evs.length; i++) {
            ev=evs[i];
            quand= makeDate(ev.date,ev.h).dOpt({det:false,day:false,year:false});
            constituants=S(quand.a(":"),showMotif(ev));
            if (ev.tit) // ajouter le titre si nécessaire
                constituants.add(S(ev.tit).tag("i"));
            if (ps.length>1) // préciser le participants s'il y en a plus qu'un
                constituants.add(PP(P("avec"),partInfo[ev.part].name))
            $ul.append(""+constituants.tag("li"))
        }
        $elem.append($ul);
        $elem.append("<p>"+showContact(evs[0],ps.length==1)+"</p>")
    }
}

function generer(){
    var $sortie=$("#sortie");
    // // ajouts au lexique
    addToLexicon({"Alice":{ "N": { "g": "f", "pe": 3, "tab": ["nI"] } }});
    addToLexicon({"Robert":{ "N": { "g": "m", "pe": 3, "tab": ["nI"] } }});
    addToLexicon({"Nicolas":{ "N": { "g": "m", "pe": 3, "tab": ["nI"] } }});
    addToLexicon({"consultation":{"N":{"g":"f","tab":["n17"]}}});
    addToLexicon({"courriel":{"N":{"g":"m","tab":["n3"]}}});
    addToLexicon({"contacter":{"V":{"tab":"v36","aux":["av"]}}});
    addToLexicon({"privé":{"A":{"tab":["n28"]}}});

    // ajout des structures JSrealB pour compléter les informations sur les participants et les catégories d'événements

    // ajouter les informations de contact
    for (p in partInfo) {
        var contact = CP(C("ou"));
        var tel = partInfo[p].tel;
        if (tel)
            contact.add(S(D('au'), fmtTel(tel)));
        var em = partInfo[p].email;
        if (em)
            contact.add(S(P('à'),fmtEmail(em)));
        partInfo[p].contact = contact;
        // console.log(p,partInfo[p].cdet)
    }
    var groupes=evenementsParVille(evList)
    for (var i = 0; i < groupes.length; i++) {
        showGroupe(groupes[i],$sortie);
    }
}

$(document).ready(function() {
    // montrer les données
    $("#donnees").append(showList("Liste des événements",evList));
    $("#donnees").append(showList("Information sur les participants",partInfoString));
    $("#donnees").append(showList("Catégories d'activités",catWordString));
    generer();
});
