---
title: Développement d'une version d'Eliza en français
author: Guy Lapalme
description: Eliza en français à l'aide de jsRealB
exportdir: "http://www.iro.umontreal.ca/~lapalme/RegexInSwift"
---

<center style="font-size:3em; font-family: 'Open Sans'; font-weight: bold">Développement d'une version d'Eliza en français</center>

<center><a href="mailto:lapalme@iro.umontreal.ca">Guy Lapalme</a><br/>RALI-DIRO<br/>Université de Montréal<br/>Octobre 2024</center>

# Contexte

La capacité de communiquer avec une machine a regagné en popularité récemment grâce à des systèmes avancés, tels que ChatGPT, une version améliorée des *chatbots alimentés par de grands modèles de langage*. Ces systèmes remontent aux années 1960, lorsque le premier d'entre eux, nommé *Eliza* (Weizenbaum 1966), a été créé par Joseph Weizenbaum. *Eliza* se réfère à *Eliza Doolittle* dans la pièce *Pygmalion* de George Bernard Shaw. Eliza est une servante à qui deux linguistes apprennent à parler comme une personne de la haute société, ce qui lui permet de *bluffer* ceux qui l’entourent. 

L’objectif initial de Weizenbaum était de démontrer les capacités de MAD-SLIP (Weizenbaum 1963), un groupe de *subroutines* en Fortran pour gérer une structure de données à double chaînage. Eliza utilisait le script DOCTOR pour imiter un style de conversation *rogerien, qui consiste à poser* des questions reprenant des fragments de l'énoncé *du patient* et ce, sans utiliser de connaissances externes. L'article de Weizenbaum décrit l'ensemble de questions préétablies avec des *espaces à remplir*, la division de la phrase de l'utilisateur pour combler ces espaces, ainsi que la hiérarchie entre les questions.  

Un des buts de l'article de Weizenbaum était de démontrer/démonter tous les détails du système afin de le démystifier. Il a été très surpris de la réaction des usagers qui se laissaient prendre au jeu, certains lui demandant même de sortir quand ils *discutaient* avec Eliza.  Il a par la suite consacré un livre aux implications sociales des systèmes informatiques (Weizenbaum 1976). Nous n'entrons pas dans ce débat, nous nous limitons à tenter de reproduire le système pour qu'on puisse interagir en français afin de faire ressortir certaines particularités de notre réalisateur de texte *jsRealB*.

Eliza a été [reprogrammé maintes fois, et dans plusieurs langages de programmation](https://github.com/jeffshrager/elizagen.org/tree/master/Other_Elizas), souvent en utilisant des expressions régulières pour identifier et récupérer certaines parties de l'énoncé.  Notre but n'est pas de créer encore une autre version d'Eliza, mais plutôt d'illustrer certains aspects originaux de *jsRealB* .  Cet exercice nous a permis de corriger quelques erreurs dans *jsRealB* et nous a incité à ajouter un nouveau type de transformation de phrase, le *majestatif* pour permettre le vouvoiement.

L'idée de ce développement nous est venue lorsque nous avons utilisé Eliza, en anglais, comme [exemple d'utilisation des expressions régulières en Swift](http://www.iro.umontreal.ca/~lapalme/RegexInSwift/index.html#eliza-like-chatbot). Pour ce faire, nous avons adapté la version JavaScript de Norbert Landsteiner (2005) qui reproduit le script de l'article de Weizenbaum ainsi que leur regroupement en une liste de mots-clés. Cette version est utilisable dans une page web, il y a même une version où Eliza répond avec un synthétiseur de parole.

# Adaptation au français

L'anglais est une langue avec relativement peu de flexions pour les verbes. Et même pour les verbes, outre  *be*, la forme de l'infinitif ne change pas pour la première et la deuxième personne du singulier qui sont utilisées dans un dialogue.  Ceci explique pourquoi des sous-chaînes de l'énoncé de l'usager peuvent être reprises verbatim dans la question posée par le système tout en gardant la grammaticalité de la question.  Le peu de flexion en anglais facilite aussi l'identification des mots-clés qui servent d'amorce pour les patrons de phrases. Quelques transformations sont toutefois nécessaires pour les pronoms personnels.

Ce type  *d'astuce* fonctionne plus difficilement en français, c'est pourquoi plusieurs versions françaises d'Eliza se limitent à des questions qui n'intègrent presque pas des bouts de phrases de l'usager et retournent le plus souvent des questions génériques. 

## Rappels de *jsRealB*

[*jsRealB*](https://github.com/rali-udem/jsRealB) est un réalisateur de texte en JavaScript pour aider à la réalisation de phrases en anglais et en français. Nous traitons ici que du français, mais les mêmes principes s'appliquent pour l'anglais. 

Une expression *jsRealB* est une suite d'appels de fonctions qui créent une structure de données JavaScript. La réalisation en une phrase en français est obtenue en parcourant cette structure à l'aide de la méthode `realize()`.  Les noms des fonctions sont les mêmes que les symboles utilisés par les linguistes pour définir des structures en constituants comportant des syntagmes ou des terminaux. On peut ajouter des options à l'aide de la notion pointée à ces structures pour en modifier certains attributs, tels le genre, le nombre, le temps ou la personne.  

- **Terminal**: `N` (nom), `V` (verbe), `A` (adjectif), `D` (determinant), `Pro` (pronom), `Adv` (adverbe), `P` (préposition), `C` (conjonction), `NO` (nombre), `DT` (date), `Q` (texte verbatim). Un terminal est créé avec un seul paramètre, le plus souvent une chaîne de caractère. Voici quelques exemples de terminaux avec la réalisation correspondante. L'appel à la fonction `realize()` n'est pas indiqué ici.

  ```javascript
  Pro('moi').pe(3).g("f").c("nom") => "elle"   (pronom 3e personne, féminin, nominatif)
  A("content").g("f")              => "contente" (adjectif au féminin)
  V("être").t("i").pe(2)     => "étais"  (imparfait 2e personne sigulier)
  ```

- **Syntagme** (**Phrase**) pour combiner ses paramètres, i.e. des terminaux ou d'autres syntagmes: `S` (Sentence), `SP` (Subordinate Phrase), `NP` (Noun Phrase), `VP` (Verb Phrase), `AP` (Adjective Phrase), `CP` (Coordinate Phrase), `PP` (Prepositional Phrase), `AdvP` (Adverbial Phrase). L'exemple suivant montre une combinaison de terminaux et de syntagmes avec la réalisation. Lorsqu'une chaîne de caractère est donnée en paramètre, elle est insérée telle quelle dans la phrase. On constate que les accords en personne et en genre entre les constituants sont faits automatiquement.

  ```javascript
  S(Pro("moi").pe(3).g("f").c("nom"), (Phrase avec un pronom comme sujet)
     VP(V("être").t("i"),             (Syntagme verbal avec un verbe
        A("content"),"de venir"))      un attribut et une chaîne verbatim)
  => "Elle était contente de venir. "
  ```

  Il est possible de spécifier des variations de phrases pour transformer une phrase active en passive, négative ou interrogative. Cette dernière option est très utile dans le contexte d'Eliza car la majorité des phrases énoncées sont des questions. Voici un exemple qui transforme la forme active en une interrogative négative.

  ```javascript
  S(Pro('moi').pe(3).g("f").c("nom"),
    VP(V('être').t("i"),
       A('content'),"de venir")
   ).typ({"int":"yon","neg":true}) (interrogative oui-non, négative)
  => "N'était-elle pas contente de venir? "
  ```

Comme la spécification d'une expression *jsRealB* est code JavaScript *pur*, on peut utiliser les constructions du langage pour organiser la génération, en particulier la définition de fonctions.  

L'exemple suivant montre deux définitions de *fonctions* qui paramètrent des expressions *jsRealB*. La ligne 1 définit une expression pour générer un pronom personnel à la deuxième personne paramétrée par le genre. Les lignes 2 à 6 définissent une fonction à deux paramètres: le premier est un tableau de chaînes contenant les sous-chaînes extraites de l'énoncé de l'utilisateur et le deuxième est le genre associé à l'usager. La structure de la phrase comprend le pronom sujet suivi d'un syntagme verbal composé d'un verbe et d'un syntagme prépositionnel.  La ligne 7 donne un exemple d'un tableau de sous-chaînes.

La ligne 9 montre un appel pour obtenir la réalisation de la structure à la forme active. La ligne 10 montre la transformation à appliquer pour obtenir la réalisation d'une interrogation complète, soit une question qui se répond par « oui » ou par « non » (« yes or no », abrégé en « yon »). 

```javascript
function vous(g){return Pro("moi").pe(2).g(g).c("nom")}
function f (m,g){
    return S(vous(g),
             VP(V("penser"),
             PP(P("à"),m[2])))
}
const m = ["","","revenir à la maison"]

f(m,"f")                    => "Tu penses à revenir à la maison. "
f(m,"f").typ({"int":"yon"}) => "Penses-tu à revenir à la maison? "
```

## Flexibilité pour le dialogue

Afin de tirer parti du fait qu'Eliza interagit en français, nous avons décidé de permettre des variations aux questions posées par Eliza en fonction des paramètres suivants qui sont fixés au début du dialogue:

| Interlocuteur                | genre                      | vouvoiement (`maje`)          |
| ---------------------------- | -------------------------- | ----------------------------- |
| Eliza sous forme de question | `"m"` ou `"f"`(par défaut) | `true`(par défaut) ou `false` |
| Patient                      | `"m"`(par défaut) ou `"f"` |                               |

Eliza peut donc vouvoyer le patient dans ses questions, mais le patient ne peut pas vouvoyer Eliza. Comme l'implantation du vouvoiement a soulevé des problèmes *intéressants*, nous discutons de son utilisation dans notre application.  

Le vouvoiement est obtenu par une transformation de phrase indiquée par `maje` pour *majestatif*.  L'exemple précédent peut ainsi être transformé.  

```javascript
f(m,"f").typ({"int":"yon","maje":true})
    => "Pensez-vous à revenir à la maison? "
```

Ce mode met au pluriel les pronoms personnels, les  pronoms et déterminants possessifs et les verbes qui sont au singulier dans une phrase. Toutefois certains adjectifs ou participes passés ne doivent pas être mis au pluriel. L'exemple suivant montre un cas où l'adjectif doit rester au singulier, car le pronom réfère à un sujet singulier en mode majestatif.  Notons aussi que tous les pronoms ont été mis en majestatif, y compris le pronom `moi` de la ligne 5 . 

```javascript
function moi(g){return Pro("moi").pe(1).g(g).tn("")}
function f1(){
    return S(vous("f"),
             VP(V("être"),
                A("content"),
                PP(P("de"),moi("m")))
           ).typ({"maje":true})
}
f1()    => "Vous êtes contente de nous. "
```

Comme dans notre application, Eliza voudra vouvoyer l'utilisateur, mais ne pas le faire lorsqu'elle réfère à elle-même, il faut un moyen pour annuler localement ce mode sur certains pronoms ou déterminants. Dans ces cas, on utilise une option `.maje(false)` sur un pronom ou un déterminant, comme dans l'exemple suivant qui redéfinit le pronom (ligne 1). 

```javascript
function moi_(g){return Pro("moi").pe(1).g(g).tn("").maje(false)}
function f1_(){
    return S(vous("f"),
             VP(V("être"),
                A("content"),
                PP(P("de"),moi_("m")))
           ).typ({"maje":true})
}
f1_()  => "Vous êtes contente de moi. "
```

# Organisation du programme

Weizenbaum prédéfinit des patrons associés à des mots-clés qui doivent être présents dans l'énoncé du patient. Afin de varier les interactions, plusieurs modèles de questions ont été définis pour chaque patron. Le mode de fonctionnement d'Eliza peut être schématisé comme suit:

- Souhaiter *la bienvenue* avec une invitation à discuter

- Lire l'énoncé de l'usager

- Tant que l'énoncé ne contient pas de *mot-clé de fin* (e.g. *bye* ou *end*)
    * Chercher la présence d'un *mot-clé* dans l'énoncé
    
    * Si on a trouvé un *mot-clé*
        + Déterminer le patron qui peut être apparié à l'énoncé (il y en a toujours un)
        
          + Extraire certaines parties de l'énoncé  en fonction du patron      
          * Dans ces parties, intervertir `"my"` par `"your"` et `"me"` par `"you"` 
          + Appliquer une des transformations associées au patron sur l'énoncé
        
          + Générer la question avec cette transformation	
        * Générer une question générique pour inciter à continuer
        
    * Lire l'énoncé de l'usager
    
- Dire *au revoir*

Lorsque plusieurs questions sont possibles, le système en choisit une tour à tour afin d'éviter les répétitions. Les formules de bienvenue et d'au revoir sont choisies aléatoirement. 

## Organisation des questions

Dans la version de Landsteiner, les questions sont conservées dans une liste de mots-clés triée par priorité, ce qui suit l'organisation de listes imbriquées de l'article de Weizenbaum. Comme certains mots-clés étant assez génériques (p.ex. `je` ou `suis`) alors que d'autres sont plus spécifiques (p.e. `ordinateur` ou  `rêver`), on voudra privilégier les patrons associés à des mots-clés spécifiques.  La recherche s'effectue séquentiellement dans cette liste jusqu'à trouver un mot-clé présent dans l'énoncé de l'usager.  Pour l'anglais, une structure associée à un mot-clé est organisée selon le modèle de la partie gauche de la figure suivante. 

```javascript
[mot-clé, priorité, [  | ["remember", 5, [
 [patron-1,            |  ["* i remember *", [
   [question-11,       |      "Do you often think of (2) ?",
    question-12,       |      "Does thinking of (2) bring anything else to mind ?", 
    ...]],             |      ...]],
 [patron-2,            |  ["* do you remember *", [
   [question-21,       |      "Did you think I would forget (2) ?",
    question-22,       |      "Why do you think I should recall (2) now ?",
    ...]],             |      ...]],
 ...]                  |  ...
]                      |  ]
```

La partie droite donne un exemple pour le mot-clé `remember` et où les `*` correspondent à une sous-chaine possiblement vide. Par exemple, pour l'énoncé `Often I remember coming to my house`, Eliza pourra poser la question `Do you often think of coming to your house ?` en appariant le *patron-1* où la deuxième étoile correspond la chaine  *coming to my house* dans laquelle `my`  est remplacé par `your`. Cette chaîne est insérée dans la *question-11* à la place du `(2)` qui correspond à la deuxième étoile.  

Dans notre version, nous utilisons plutôt une liste d'objets où les différents éléments sont identifiés par nom. Voici comment est organisé l'exemple précédent, les détails seront expliqués plus loin, mais on peut déjà remarquer que les questions ne sont pas des chaînes de caractères mais plutôt des fonctions fléchées qui retournent une expression *jsRealB*. Une de ces fonctions sera appelée pour générer une nouvelle question.

```javascript
{"key":V("rappeler"), "rank":5, "pats":[  
    {"decomp":[star,je_decomp,me_decomp,V("rappeler"),star], // * je me rappelle *  
     "reasmb":[
    // fr: Pensez-vous souvent à (2)
    (m,g) => S(vous(g),
               VP(V("penser"),Adv("souvent"),
                  PP(P("à"),m[2]))).typ({"int":"yon"}),
    // fr: Le fait de penser à (2) vous rappelle-t-il quelque chose?
    (m,g) => S(NP(D("le"),N("fait"),
                  PP(P("de"), VP (V("penser").t("b"),
                     PP(P("à"),m[2])))),
               VP (vous_coi(g),V("rappeler"),
                  NP (D("quelque"), N("chose")))).typ({"int":"yon"}),
		...
     ]},
    {"decomp":[star,tu_decomp,tu_decomp,V("rappeler").n("p").pe(2),P("de"),star],  // * vous vous rappelez de 
     "reasmb":[
    // fr: Comment est-ce que nous pourrions oublier?
    (m,g) => S(moi(),
               VP(V("oublier").t('c'),m[2])).typ({"int":"how","mod":"poss"}),
    // fr: De quoi dois-je me souvenir à propos de (2) ?
    (m,g) => S(PP(P("de"),Pro("quoi")),moi(),
               VP(V("souvenir").pe(1),
                  PP(P("à"),N("propos"),P("de"),m[2]))
              ).typ({"mod":"nece","int":"yon"}),
    ...   
    ]},
```

## Analyse de l'énoncé du *patient*

À cause des multiples flexions possibles en français, l'identification des mots-clés est plus difficile quoique non impossible, en ajoutant des listes de formes équivalentes comme c'est fait dans la version  anglaise. 

Nous avons plutôt décidé de *lemmatiser* les mots de l'énoncé en utilisant *jsRealB* *à l'envers*: nous créons une table en générant toutes les formes possibles du dictionnaire français (il y en a environ 350&nbsp;000) et en y associant la liste de toutes les expressions possibles permettant de la  générer. Voici quelques exemples:

```javascript
"suis" : [V('être').pe(1), V('suivre').pe(1), V('suivre').pe(2), V('suivre').t("ip").pe(2)]
"la"   : [D('le').g("f"), 
          Pro('elle').g("f").c("acc"),Pro('le').g("f"),Pro('me').g("f"),Pro('moi').g("f").pe(3).c("acc"), 
          N('la')]
```

Cette table était déjà utilisée dans l'environnement de développement de *jsRealB*. La ligne 1 montre que `"suis"` peut être soit le verbe *être* à la première personne du singulier du présent ou différentes formes du verbe *suivre*. Les lignes 2 à 4 montrent que ` "la"` peut être le déterminant *le* au féminin. différentes formes de pronoms personnels ainsi qu'un nom, la note *la*. 

La chaîne écrite par le patient est transformée en minuscules et pour ne conserver que les *mots*, une suite de lettres ou d'apostrophes.  Si une suite de caractères avec une apostrophe correspond à une élision (e.g. `j'aime`), elle est séparée en deux (`je`, `aime`). On vérifie également si un *mot* peut-être une contraction (e.g. `au`), dans quel cas, il est séparé en deux mots (`à`, `le`). Par exemple, la chaîne `"Généralement je me rappelle le début de ma carrière"` sera transformé en la liste suivante (ici, nous n'affichons que la première possibilité de chaque liste de terminaux lorsqu'il y en a plusieurs:

```swift
[[Adv('généralement')], [Pro('je').pe(1),..], [Pro('me').pe(1),...], 
 [V("rappeler").pe(1),...], [D('le'),...], [N('début')], [P('de'),..],
 [P("de")], [D('mon').g("f").pe(1)], [N('carrière')]]
```

C'est cette liste de mots qui est utilisée pour la recherche de mots-clés en vérifiant pour chaque mot si un de ses lemme et catégorie correspond à celle associée à `"key"`.Comme les mots-clés sont cherchés en ordre décroissant de `"rank"`, les mots-clés les plus spécifiques sont traités en premier. 

## Génération des questions

Landsteiner a défini environ 250 questions ou interactions en anglais. Pour en obtenir les versions françaises, nous avons fait traduire les questions en utilisant [DeepL](https://www.deepl.com/fr/translator), afin de ne pas risquer d'utiliser des formes que nous savions déjà réalisables par *jsRealB*.  Cet exercice a d'ailleurs fait ressortir quelques problèmes dans la génération de formes interrogatives avec *jsRealB*.

Une fois un mot-clé identifié, il faut apparier  l'énoncé  avec chaque patron associé à `"pats"`  pour vérifier s'il correspond à la liste des terminaux associée à `"decomp"`. Si c'est le cas, isoler les parties qui correspondent aux `étoiles`. Par exemple, la première liste de décomposition correspond à cette expression. si on remplace les valeurs des variables.

```swift
[Q("*"),Pro("je").pe(1),Pro("me").pe(1),V("rappeler"),Q("*")]
```

Cette liste sera comparée avec les listes de mots de l'énoncé et si les terminaux correspondent non seulement avec leur type et leur lemme mais aussi en personne, en genre, en nombre et en temps. Un tableau des listes de terminaux associées aux étoiles est retourné. Par exemple, pour la liste de terminaux précédents, on trouvera le tableau suivant. Seule la première alternative de  chaque terminal est conservée.

```swift
[[Q("dummy")],  // inutilisé
 [Adv("généralement")], 
 [D("le"), N("début"), D("de"), D("notre").g("f").pe(2).maje(false), N("carrière")]
]
```

Ce tableau sera donné comme premier paramètre à la fonction de génération.  À noter que le déterminant ` "mon"` (l'avant-dernier élément de la liste sur la ligne 3) a été changé en ` "notre"`, sa personne a été changée à 2 et on y a ajouté une indication de ne pas appliquer le mode majesté. C'est l'équivalent de la transformation de `my` en `your` en anglais.

Une fois cet objet passé comme premier paramètre de la fonction associée à la première question du premier patron, on obtient l'équivalent de la structure suivante en supposant qu'on vouvoie le patient (ligne 6) du genre masculin (paramètre de `g(..)` à la ligne 1).

``` javascript
S(Pro("moi").pe(2).g("m").c("nom"),
  VP (V("penser"),
     Adv("souvent"),
     PP(P("à"),[D('le'), N('début'), D('de'), 
                D('notre').g("f").pe(2).maje(false), N('carrière')]))
 ).typ({"int":"yon"}).typ({"maje":true}).realize()
  => "Pensez-vous souvent au début de votre carrière?  "
```

On remarque qu'une contraction entre ` "à"` et ` "le"` a été introduite et que le déterminant *mon*, utilisé par le patient, a été remplacé par *votre* dans la reprise de la chaîne extraite de l'énoncé. Si le vouvoiement n'était pas utilisé, l'appel de la fonction retournerait plutôt `"Penses-tu souvent au début de ta carrière? `

## Autres aspects intéressants du dialogue

Afin d'obtenir des patrons plus flexibles, on peut utiliser des listes de terminaux au lieu d'un simple terminal. Cette partie du patron s'appariera si un des éléments de la liste correspond à ce qui est attendu. Par exemple,  le patron suivant permet de correspondre avec un membre de la famille. Si une valeur de genre ou nombre est ` "x"`, alors n'importe quel valeur correspondra, par exemple ici, non seulement *époux* ou *enfant*, mais aussi *épouse* ou *enfants*.

```swift
const family = [N("mère"),N("maman"),N("père"),N("papa"),N("frère"),N("soeur"),
                N("époux").g("x"),N("enfant").n("x")]
```

Afin de ne pas répéter  une même question pour un même patron, une propriété est ajoutée à chaque patron pour conserver l'index de la dernière question utilisée. Lorsqu'on doit réutiliser le même patron on utilise ainsi la prochaine question et on met à jour cette propriété. Lorsque tous les patrons auront été utilisés, on recommence avec le premier.

Une des alternatives d'un patron peut référer à un autre patron tout en gardant la même liste de terminaux et donc de groupes. Ceci permet de réutiliser certaines questions dans plusieurs contextes.

## Différences avec la version anglaise

La version anglaise de Landsteiner crée des phrases anglaises grammaticalement acceptables en n'utilisant que de la manipulation de chaînes de caractères avec des expressions régulières. Il faut toutefois utiliser quelques listes de *synonymes* pour tenir compte de variations entre le singulier et le pluriel ( `machines` =>  `machine`), quelques conjugaisons fréquentes (`am` => `are`) ou l'élision `(i'm` => `i am`). Comme l'insertion de chaînes peut amener plusieurs espaces à la suite, il y a finalement une normalisation des espaces en utilisant des expressions régulières évidemment.

Toutes ces astuces ne sont pas nécessaires avec *jsRealB*  qui gère lui-même tous ces cas de figure. De plus en anglais, le vouvoiement de l'usager n'existe pas, ni aucune variation de genre même pas pour les pronoms personnels à la première ou deuxième personne. 

# Exemple de dialogues

Voici quelques exemples d'interaction avec Eliza genre féminin et patient masculin dont les énoncés sont indiqués ici en italique. Les numéros s'apparaissent ici que pour fin de référence.

------

1. Quelque chose vous préoccupe?

2. *Je me rappelle le bon vieux temps*
   Pensez-vous souvent au bon vieux temps?

3. *Mais j'oublie toujours votre nom*
   Les noms ne m'intéressent pas.

4.  *Je rêve de devenir célèbre*
   Réellement, devenir célèbre?

5. *J'ai peur des machines*
   Les ordinateurs vous inquiètent-ils?

6. *Je suis souvent fatigué*
   Est-ce parce que vous êtes souvent fatigué que vous êtes venu me voir?

7. *J'estime que vous ne m'aidez pas beaucoup*
   Je parlais de vous, pas de moi.

8. *J'aimerais vous présenter de mon épouse*
   Parlez-moi de votre famille.

9. *Pourquoi ne pouvez-vous pas m'aider à progresser*
   Vous dites  "pourquoi ne pouvez nous pas vous aider à progresser" ?

10. *Pourquoi ne pouvez-vous pas m'aider à progresser*
    Pouvez-vous élaborer sur cela?

11. *Je vous demande pardon*
    S'il vous plaît, ne vous excusez pas.

12. *Tous les personnes sont semblables*
    En quoi?

13. *Can we continue in English*
    Je ne comprends que le français.

14. *But I want to speak in English*
    Je vous l'ai déjà dit, je ne comprends pas l'anglais.

15. *Fin*
    Au revoir. C'était vraiment une belle discussion.

    ------

Après une invitation à dialoguer (ligne 1), les lignes 2 et 4 reprennent des bouts de l'énoncé du patient. Les lignes 2 et 5 sont des réponses à la présence d'un mot-clé (*nom* ou *machine*). La ligne 8 a détecté la présence d'un mot faisant référence à la famille. La ligne 9 se borne à répéter l'énoncé tel quel. Les lignes 9 et 10 sont des réponses génériques lorsqu'aucun patron spécifiques n'a été reconnu. La ligne 11 sont des réponses aux mots-clés *pardon* et *semblable*. Les lignes 13 et 14 répondent au mot-clé *English*.   La ligne 15 est une des réponses pour un mot-clé de fin.

# Bibliographie

- Landsteiner, N. elizabot, 2005, https://www.masswerk.at/elizabot/ . 
- Lapalme, G.. *The jsRealB text realizer: Organization and use cases*. ([arXiv:2012.15425] (https://arxiv.org/abs/2012.15425)), may 2022. [Accès au système](https://github.com/rali-udem/jsRealB).
- Weizenbaum, J.,  *ELIZA - A Computer Program for the Study of Natural Language Communication Between Man and Machine,* CACM, Vol 9, no 1, Jan 1966, p 36-45.
- Weizenbaum, J. *Symmetric List Processor*, CACM, vol 6, no 9, 1963, p 524-536.
- Weizenbaum, J. *Computer Power and Human Reason: From Judgment to Calculation*, W. H. Freeman, 1976, 300p. 

# Annexes

## Organisation du code source

- `tokenizeFr.js` : créer la table de lemmatisation en parcourant le dictionnaire pour générer toutes les formes possibles (appel à `buildLemmataMap("fr")`) et 
séparer une phrase en mots en tenant compte des élisions et euphonies.
- `eliza.js`  :  fonctions pour obtenir la liste des terminaux, chercher le patron avec les mots-clés,  apparier les patrons et déterminer la fonction de réalisation
- `keywordsFr.js` :  patrons de décomposition et fonctions de génération de questions
- `eliza-talk.js` :  dialogue interactif avec l'usager, les paramètres de dialogue sont spécifiées au début de ce fichier
- `eliza-test.js` :  fonctions de mise au point
  - `runScript(...)` : affiche les réponses suite à une liste d'énoncés
  - `testAll(..)` : tests systématiques de toutes les questions possibles
  - `exemplesPapier(..)` : code des exemples de ce document

## Dialogue original de Weizenbaum

Voici une reproduction du dialogue en français tel que produit par la fonction `runScript()`. Les énoncés sont la traduction du dialogue présenté par Landsteiner qui reprenait lui-même l'exemple de l'article original de Weizenbaum.

```text
Discussion avec Eliza: 
  genre du patient:f, genre d'Eliza:f vouvoiement: oui

Dites-moi ce qui vous tracasse.
Patient: C'est mon petit ami qui m'a fait venir ici
Votre petit ami qui vous a fait venir ici?
Patient: Les hommes se ressemblent tous.
Vraiment?
Patient: Ils nous embêtent toujours à propos de quelque chose ou d'autre.
Pouvez-vous penser à un exemple précis?
Patient: Il dit que je suis souvent déprimée.
Est-ce parce que vous êtes souvent déprimée que vous êtes venue me voir?
Patient: C'est vrai. Je suis malheureuse
Depuis combien de temps êtes-vous malheureuse?
Patient: J'ai besoin d'aide, c'est certain.
Vous dites  "vous avez besoin d'aide c'est certain" ?
Patient: Je pourrais peut-être apprendre à m'entendre avec ma mère.
Parlez-moi de votre famille.
Patient: Ma mère s'occupe de moi.
Qui d'autre dans votre famille?
Patient: Mon père
Votre famille?
Patient: Vous ressemblez à mon père par certains côtés.
Qu'est-ce qui vous vient à l'esprit quand vous pensez à votre famille?
Patient: Tu n'es pas très agressif, mais je pense que tu ne veux pas que je le remarque.
Pourquoi dites-vous cela?
Patient: Tu ne te disputes pas avec moi.
Pouvez-vous élaborer sur cela?
Patient: Tu as peur de moi
Vous dites  "tu as peur de moi" pour une raison particulière.
Patient: Mon père a peur de tout le monde
Parlez-moi de votre famille.
Patient: Les brutes
Je ne suis pas sûr de bien vous comprendre.
Patient: Fin
Au revoir. C'était vraiment une belle discussion.
```

