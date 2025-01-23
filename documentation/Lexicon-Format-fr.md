Format d'un lexique *jsRealB* 
===========================

Les informations contenues dans les lexiques de *jsRealB* ont été converties à l'origine à partir d'un format interne inspiré de Lisp développé au RALI il y a de nombreuses années. Les lexiques JSON ont été créés à l'origine à l'aide d'un script Python, puis manuellement _patchés_ et mis à jour au fil des années avec de nouveaux champs au fur et à mesure que d'autres informations devenaient disponibles.

Les informations de déclinaison ou de conjugaison sont associées à des tables, définies dans les fichiers `rule-en.js` et `rule-fr.js`, qui couvrent la plupart des cas d'utilisation en anglais et en français.

Nous donnons maintenant le schéma [json-rnc](https://github.com/lapalme/json-rnc « GitHub - rali-udem/json-rnc : JSON validation with a RELAX-NG compact syntax") utilisé pour valider les entrées du lexique français. la [structure du lexique anglais](./Lexicon-Format-en.md) est similaire, quoique certains champs diffèrent.

Un lexique est un objet JSON unique dont les clés sont le lemme et la valeur est elle-même un autre objet de type `lexInfo` avec des informations sur les parties du discours autorisées pour ce lemme ; au moins un objet de partie du discours doit être défini.  L'objet associé à chaque partie du discours énumère les valeurs autorisées pour les différents champs donnant des informations sur la déclinaison ou la conjugaison.

# Schéma  (`data/lexicon-fr.jsonrnc`)

```json
start = {*:lexInfo}

lexInfo={N?:  {tab:/n(I|\d{1,3}a?)/, g?:gender, h?:one, niveau?:niv },
         A?:  {tab:/[an](I|\d{1,3}a?)/,  h?:one, pos?:/pre|post/,niveau?:niv},
         Pro?:{tab:/pn\d{1,2}(-[123][sp]?[mfn]?)?|n27|n28|n75|n76|d[1345]|nI/, 
               g?:gender, n?:num, pe?:oneTwoThree,niveau?:niv},
         V?:  {tab:/v\d{1,3}/, aux?:/av|êt|aê/, h?:one, pat?:[/tdir|tind|intr|réfl|impe/],niveau?:niv}, 
         D?:  {tab:/d\d{1,2}(-\d)?|n(I|23|25|27|28|48|75|76)/, n?:num, value?:number,niveau?:niv},  
         Adv?:{tab:/av|b\d/,h?:one,niveau?:niv}, 
         P?:  {tab:/ppe?/,h?:one,niveau?:niv},
         C?:  {tab:/cj|cje|cji/,niveau?:niv},
         Q?:  {tab:/av/},
         Pc?: {tab:[/pc\d{1,2}/], compl?:string},
         value?:number
    }@(minProperties=1)

one       = number@(minimum=1, maximum=1)
oneTwoThree  = number@(minimum=1, maximum=3)
niv  = number@(minimum=1,maximum=6)
gender = /m|f|x/
num = /s|p/
```

* Le `string` associé à `tab`doit être un numéro de table de déclinaison ou de conjugaison définie dans `rule-fr.js` 

* Le genre (`g`)et le nombre (`n`) peut seulement prendre quelques valeurs;

* Pour les déterminants et les adjectifs, `value` est la valeur numérique associée soit à un nombre cardinal, soit à un nombre ordinal.

* Pour les verbes : les arguments permis peuvent être spécifiés en utilisant une liste de modèles autorisés (`pat`) pour ce verbe :

  * `tdir` : transitif direct
  * `tind` : intransitif direct
  * `intr` : intransitif direct
  * `réfl` : réflexif
  * `impe` : impersonnel

  Lorsque le seul modèle est `réfl`, cela signifie que le verbe est _essentiellement réfléchi_ et qu'il est donc toujours précédé d'un pronom réfléchi lorsqu'il est conjugué.

* Dans le cas de `h`, il s'agit de _h aspiré_, auquel cas il n'y a pas d'élision entre ce mot et celui qui le précède;

* Dans le cas de `punct`, `compl` est le signe de ponctuation complémentaire, par exemple la parenthèse ou le crochet fermant correspondant.

* `niveau` est une indication d'un mot _commun_ dans un lexique, soit au niveau d'une entrée, soit pour une partie de discours donnée.  C'est un nombre entier entre 1 et 6, correspondant au niveau scolaire tel qu'indiqué par le champ _Année scolaire_ de la [Liste orthographique du ministère de l'Éducation du Québec] (https://www.education.gouv.qc.ca/fileadmin/site_web/documents/education/jeunes/pfeq/Liste-orthographique-document-reference.pdf). Cette information peut être utile pour générer des phrases avec des mots de la vie courante.

Interrogation du lexique avec `jq`
========================

La manière la plus pratique d'interroger le lexique est d'utiliser l'[IDE](../IDE/) ou la démonstration [Evaluation](../demos/Evaluation/index.html).

Il est aussi possible d'utiiser [jq](https://jqlang.github.io/jq/ "jq") pour interroger ces lexiques. Voici quelques exemples de requêtes:

- Chercher une entrée particulière, ici `amour`

`jq 'to_entries[]|select(.key=="amour")' lexicon-fr.json`

- Chercher les entrées corresponds à une expression régulière, ici les entrées débutant par `amour`, `-c` pour obtenir une sortie non indentée.

`jq -c 'to_entries[]|select(.key|test("^amour.*"))' lexicon-fr.json`

- Chercher en combinant plusieurs critères: les entrées qui terminent par er et qui peuvent être un nom, un adjectif et un verbe; `-r` pour afficher les résultats sans les guillemets 

`jq -r 'to_entries[]|select((.key|test("er$")) and (.value|has("N")) and (.value|has("V")) and (.value|has("A")))|.key' lexicon-fr.json`

# Validation

## Utiliser le  [`validateur jsonrnc`](https://github.com/lapalme/json-rnc?tab=readme-ov-file#5-using-the-validator)

```swift
.../ValidateJsonRnc.py --slurp lexicon-en.jsonrnc lexicon-en.json
.../ValidateJsonRnc.py --slurp lexicon-fr.jsonrnc lexicon-fr.json
```

This also creates a standard [JSON Schema](https://json-schema.org) which can be used in other contexts.

## Utiliser le validateur JSON de Visual Studio Code

Ceci est utile pour ajouter de nouvelles entrées au lexique. Ajouter ce qui suit au fichier de configuration `settings.json`. Ceci utilise le schéma JSON créé par le processus de validation précédent.

```json
"json.schemas": [
        {"fileMatch": ["/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-en.json"],
         "url": "./data/lexicon-en.jsonrnc.json"},
         {"fileMatch": ["/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-fr.json"],
         "url": "./data/lexicon-fr.jsonrnc.json"}
   ]
```

Contact: [Guy Lapalme](mailto:lapalme@iro.umontreal.ca) [RALI](http://rali.iro.umontreal.ca), Université de Montréal, 2024.