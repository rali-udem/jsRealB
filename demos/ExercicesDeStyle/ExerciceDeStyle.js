//////  Selon le modèle des Exercices de style de Raymond Queneau
// la structure de phrase est celle du "résumé" donné à 
//      http://www.alalettre.com/queneau-oeuvres-exercices-de-style.php
//   nécessite le chargement de jQuery
Object.assign(globalThis,jsRealB);
var texte,temps,genre,nombre;

function completerLexique(){
    loadFr();
    // tous les mots utilisés sont déjà dans le lexique
}

function composer(t,g,n){
  loadFr();
  // personnages
  narrateur=NP(D("le"),N("narrateur").g(g).n(n)).tag("span", {"class": "narrateur genre nombre"});
  // unjeuneHomme=NP(D("un"),A("jeune"),N(g=="m"?"homme":"femme")).n(n).tag("span", {"class": "jeune-homme genre nombre"});
  // cejeuneHomme=NP(D("ce"),A("jeune"),N(g=="m"?"homme":"femme").n(n).tag("span", {"class": "jeune-homme genre nombre"});
  ami=N("ami").n(n).g(g).tag("span", {"class": "ami genre nombre"});
  voyageur=N("voyageur").g(g).n(n).tag("span", {"class": "voyageur genre nombre"});
  
  // Le narrateur rencontre dans un bus bondé de la ligne S 
  // un jeune homme au long cou, coiffé d'un chapeau mou. 
  var ps=[];
  ps[1]=
  S(narrateur,
    VP(V("rencontrer").t(t).a(",").tag("span", {"class": "temps"}),
       PP(P("dans"),
          NP(D("un"),N("bus").n(n),A("bondé")),
             PP(P("de"),NP(D("le"),N("ligne"),"S"))).a(","),
       NP(D("un"),A("jeune"),N(g=="m"?"homme":"femme").n(n).tag("span", {"class": "jeune-homme genre nombre"})),
          PP(P("à"),NP(D("le"),A("long").pos("pre"),N("cou"))).a(","),
          VP(V("coiffer").t("pp").g(g).n(n).tag("span", {"class": "genre nombre"}),           
            PP(P("de"),NP(D("un"),N("chapeau").n(n),A("mou"))).tag("span", {"class": "nombre"})))
  );

  // Ce jeune homme échange quelques mots assez vifs avec un autre voyageur, 
  // puis va s'asseoir à une place devenue libre.
   addToLexicon("quelque",{"D":{"tab":"n25"}});
  ps[2]=
       S(NP(D("ce"),A("jeune"),N(g=="m"?"homme":"femme").n(n)
                           .tag("span", {"class": "jeune-homme genre nombre"})),
             CP(C("puis"),
                 VP(V("échanger").t(t).tag("span", {"class": "temps"}),
                      NP(D("quelque"),N("mot").n("p"),Adv("assez"),A("vif")),
                      PP(P("avec"),
                         NP(D("un").g(g).n(n),A("autre").g(g).n(n), voyageur)
                                       .tag("span", {"class": "genre nombre"}))),
                 VP(V("aller").t(t).tag("span", {"class": "nombre temps"}),
                     "se",V("asseoir").t("b"),
                       PP(P("à"),
                          NP(D("un"),N("place"),A("libre"))))
               )
       );


  
  // Deux heures plus tard, le narrateur revoit ce jeune homme
  // devant la gare Saint-Lazare.
  ps[3]=
    S(SP(NP(NO(2).dOpt({nat: true}),N("heure")),AdvP(Adv("plus"),Adv("tard"))).a(","),
      narrateur,
      VP(V("revoir").t(t).n(n).tag("span", {"class": "temps nombre"}),
         NP(D("ce"),A("jeune"),N(g=="m"?"homme":"femme").n(n).tag("span", {"class": "jeune-homme genre nombre"})),
            PP(P("devant"),NP(D("le"),N("gare"),"Saint-Lazare")))
    );

  
  // Il est alors en train de discuter avec un ami.
  ps[4]=
  S(Pro("je").g(g).n(n).tag("span", {"class": "jeune-homme genre nombre"}),
    VP(V("être").t(t).tag("span", {"class": "temps"}),
       Adv("alors"),
       "en train de",
       VP(V("discuter").t("b"),
          P("avec"),NP(D("un"),ami.clone().n(n)).tag("span", {"class": "genre nombre"})))
  );

  // Celui-ci lui conseille de faire remonter le bouton supérieur de son pardessus.
  ps[5]=
  S(Pro("celui-ci").g(g).n(n).tag("span", {"class": "ami genre nombre"}),
    Pro("me*coi").g(g).n(n).tag("span", {"class": "genre nombre jeune-homme"}),
    VP(V("conseiller").n(n).t(t).tag("span", {"class": "nombre temps"}),
       PP(P("de"),
          VP(V("faire").t("b"),
             VP(V("remonter").t("b"),
                NP(D("le"),N("bouton").n(n),A("supérieur"),
                   PP(P("de"),NP(D(n=='s'?"mon":"notre").tag("span",{"class":"nombre"}),N("pardessus").n(n)))))))
       )
    );



    return $("<p/>").append(ps.join(" "));
}

/////////// version anglaise
// selon la version de Barbara Wright
// simplification de 
//      Notations: page 3 de http://www.almaclassics.com/excerpts/Exercises-in-Style-Excerpt.pdf
// 
// On the S bus, in the rush hour, a chap of about 26 with soft hat gets
// annoyed by a man standing next to him. He accuses him of pushing him every time anyone goes past.
// When he sees a vacant seat he throws himself onto it. 2
// hours later, I come across him in front of the Gare Saint-Lazare. He is discussing with a friend who says:
// “You should get an extra button put on your overcoat.”

function updateLexicon(){
    loadEn();
    // tous les mots utilisés sont maintenant dans le lexique
}

function compose(t,g,n){
    loadEn();
    if(t=="i")t="ps";// imparfait n'existe pas en anglais, remplace par past...

    // personnages
    // chap=NP(D("a"),N(g==="m"?"chap":"gal").n(n).tag("span", {"class": "jeune-homme nombre"}))
    chapProSuj=Pro("I").g(g).n(n).tag("span", {"class": "jeune-homme nombre genre"}); // pronominalisation du chap
    chapProObj=Pro("me").g(g).n(n).tag("span", {"class": "jeune-homme nombre genre"}); // pronominalisation du chap
    otherMan=NP(D("a"),N(g=="m"?"man":"woman").n(n)).tag("span", {"class": "voyageur genre nombre"});
    otherManProSuj=Pro("I").g(g).n(n).tag("span", {"class": "voyageur genre nombre"}); // pronominalisation du otherMan
    otherManProObj=Pro("me").g(g).n(n).tag("span", {"class": "voyageur genre nombre"}); // pronominalisation du otherMan
    speakerPro=Pro("I").pe(1).g(g).n("s").tag("span", {"class": "narrateur genre nombre"});
    friend=NP(D("a"),N("friend").n(n)).tag("span", {"class": "ami nombre"});
    var ps=[];

    // On the S bus, in the rush hour, a chap of about 26 with a soft hat gets annoyed by a man standing next to him.
    ps[1]=
        S(PP(P("on"),D("the"),"S",N("bus")).a(","),
          PP(P("in"),D("the"),N("rush"),N("hour")).a(","),
             NP(D("a"),N(g==="m"?"chap":"gal").n(n).tag("span", {"class": "jeune-homme nombre"}),
                PP(P("of"),Adv("about"),NO(26)),
                PP(P("with"),D("a"),A("soft"),N("hat"))),
           VP(V("get").t(t).tag("span", {"class": "temps"}),V("annoy").t("pp"),
              PP(P("by"),otherMan,
                 VP(V("stand").t("pr").tag("span", {"class": "temps"}),
                    Adv("next"),P("to"),chapProObj)))
        );
        
    //He accuses him of pushing him every time he goes past.
    ps[2]=
        S(chapProSuj,
          VP(V("accuse").t(t).n(n).tag("span", {"class": "temps nombre"}),
             otherManProObj),
          PP(P("of"),V("push").t("pr").tag("span", {"class": "temps"}),
             chapProObj,
             D("every"),N("time"),
             otherManProSuj,
             VP(V("go").n(n).t(t).tag("span", {"class": "temps nombre"})),
             Adv("past"))
    ) ;
    // When he sees a vacant seat he throws himself onto it.
    ps[3]=
    S(
      SP(C("when"),
        VP(chapProSuj,
            V("see").t(t).n(n).tag("span", {"class": "temps nombre"}),
            NP(D("a"),A("vacant"),N("seat").n(n)).tag("span", {"class": "nombre"})).a(","),
            VP(chapProSuj,
            V("throw").t(t).n(n).tag("span", {"class": "temps nombre"}),
            Pro("myself").n(n).g(g).tag("span", {"class": "genre nombre"}),
            PP(P("into"),Pro("me").g("n").n(n).tag("span", {"class": "genre nombre"}))
         )
      )
    );
    // Two hours later, I come across him in front of the Gare Saint-Lazare.
    ps[4]=
    S(NP(NO(2).dOpt({nat: true}),N("hour"),Adv("late").f("co")).a(","),
      VP(speakerPro,
         V("come").t(t).tag("span", {"class": "temps"}),
         PP(P("across"),chapProObj),
         PP(P("in"),N("front"),P("of"),D("the"),
            "Gare St-Lazare"))
    );
    // He is discussing with a friend who says:
    ps[5]=
    S(VP(chapProSuj,
         V("be").t(t).n(n).tag("span", {"class": "temps nombre"}),V("discuss").t("pr").tag("span", {"class": "temps"}),
         PP(P("with"),friend,
            SP(Pro("who"),V("say").t(t).n(n).tag("span", {"class": "temps"})))
        )
    ).a(":");
    // “You should get an extra button put on your overcoat.”
    ps[6]=
    S(
      VP(Pro("I").pe(2),
         "should",
         V("get").t("p").pe(1),
         NP(D("a"),A("extra"),N("button")),
         V("put").t("pp"),
         PP(P("on"),D("my").pe(2).ow(n),N("coat")))
    ).en('"');
    return $("<p/>").append(ps.join(" "));
}


////  rédiger les textes dans les deux langues

function rediger(e){
   texte.html(composer(temps.val(),genre.val(),nombre.val()));
   text.html(compose(temps.val(),genre.val(),nombre.val()));    
   mettreEmphase();
   if(e==null)return; // lors de l'affichage initial
   // effacer les dernières modifications et afficher les courantes
   $(".high-light").not(".fixed").removeClass('high-light');
   $("."+e.target.name).addClass('high-light');
}

 function mettreEmphase(){
     $(".emphase").not(".fixed").removeClass('emphase');
     if(emphase.val()!== " ")
         $("."+emphase.val()).addClass('emphase');
 }

$(document).ready(function(){
    texte=$("#texte"); // french
    text=$("#text");   // english
    temps=$("#temps").change(rediger);
    genre=$("#genre").change(rediger);
    nombre=$("#nombre").change(rediger);
    (emphase=$("#emphase")).change(mettreEmphase);
    completerLexique();  
    updateLexicon();    
    rediger(null);
});