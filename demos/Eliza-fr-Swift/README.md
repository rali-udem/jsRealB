<center style="font-size:3em; font-family: 'Open Sans'; font-weight: bold">Eliza en français avec <i>jsRealB</i></center>

<center><a href="mailto:lapalme@iro.umontreal.ca">Guy Lapalme</a><br/>RALI-DIRO<br/>Université de Montréal<br/>Juin 2026</center>

Ce projet illustre comment utiliser *jsRealB* à partir de Swift en s'appuyant sur le framework `JavaScriptCore`. Il présente deux applications une en *macOS* et une autre en *iOS* qui utilisent la démonstration Eliza de *jsRealB*. C'est une preuve de concept plutôt qu'une application distribuable. Cette exploration a été réalisée suite à une suggestion de Pierre-Luc Vaudry qui cherchait  une façon de rendre une génération plus *prévisible* que par un grand modèle de langue.

Ces applications gèrent un dialogue avec l'usager où toutes les réponses du système sont générées à l'aide d'expressions *jsRealB*. Une originalité de ce système est le fait qu'il est possible de changer le *genre* de l'usager et d'Eliza ainsi que le fait qu'Eliza vouvoie ou non l'usager. Ces particularités ne sont pas nécessaires ou peuvent être facilement contournées dans la version anglaise. Ce [document explique l'organisation de la gestion du dialogue](./Eliza_en_français.md). 

Les deux applications partagent la classe `JSCommunicationHandler`, le package *jsRealB.js* ainsi que le fichier *eliza.js* qui intègre les fichiers JavaScript de la démo originale, car le *JavaScriptCore* ne gère pas les `import` et les `export`.

# Éléments communs

## `JSCommunicationHandler` 

Cette classe est inspirée d'une [classe développée par Guiltiero Frigerio](https://github.com/gualtierofrigerio/JavaScriptCoreExample/tree/master/JavaScriptCoreExample). Elle a été simplifiée, car les interactions entre *Swift* et *JavaScript* sont limitées des chaînes de caractères. Il a toutefois fallu y ajouter un moyen de charger un fichier JavaScript à partir d'un bundle pour la version iOS. 

Les fonctions de ce fichier s'appuient sur `context.evaluateJavaScript(...)` qui évalue le contenu d'une chaîne de caractères dans l'environnement JavaScript. Les principales fonctions  permettant d'accéder à des fonctions ou des variables du contexte JavaScript sont:

- `getObject(nom)` : retourne  la valeur de la variable globale (déclarée avec `vat`)  qui porte le nom du paramètre 
- `setObject(valeur, nom)` : change à `valeur`, la variable globale désignée par `nom`.
- `loadSourceFile(fileName)` : évalue le contenu du fichier désigné par `fileName` qui devrait être un chemin de fichier absolu.
- `loadBundle(ressource,extension)` : dans une  application iOS, le chargement de fichier est difficile à contrôler, car les noms de fichiers relatifs semblent  *aléatoires*. Toutefois, en les ajoutant au bundle de l'application, on peut y accéder. Ceci se fait en éditant la cible `Eliza-iOS`: dans l'onglet `Build Phases` on peut les ajouter dans la section `Copy Bundle Ressources.`
- `call(funcName,params):` appel de la fonction JavaScript `funcName` en lui passant des paramètres qui doivent être des chaînes de caractères  qui seront *quotées* avant l'appel à l'environnement JavaScript pour éviter leur évaluation avant l'appel de la fonction correspondante dans *jsRealB*.

## `jsRealB.js`

Toutes les fonctions qui composent le réalisateur\. Il a été copié directement du répertoire `dist` de *jsRealb*. Ce fichier exporte un seul symbole: `jsRealB`.

## `eliza.js`

Ce fichier intègre, à la première ligne qui est très importante, tous les symboles de *jsRealB* dans l'environnement  et ensuite ajoute d'autres variables et fonctions pour gérer le dialogue.

## `Eliza_en_français.md`

Explication de l'organisation et du fonctionnement du programme `eliza.js.`\. Ce fichier est une copie du fichier correspondant dans la démo *jsRealB*.

# `eliza-macOS`

Voici un exemple de l’utilisation de *jsRealB* dans une simple boucle d’interaction dans une application *command\-line*\. Cette fonctionnalité isole les appels sans tenir compte des spécificités d’une interface\. Les énoncés d'Eliza sont créés par des expressions *jsRealB*. Les réponses de l'usager sont analysées par des fonctions qui identifient des éléments déclencheurs et qui choisissent aléatoirement parmi les expressions correspondant à ces déclencheurs.  

Le `main` présente les éléments suivants:

- Chargement de `jsRealB.js` et `eliza.js`.
- Illustration d'affectations de valeurs aux options de génération: genres de l'usager et d'Eliza, niveau de familiarité pour les interactions
- La présentation du système est illustrée par exemple d'appel direct à  `evaluateJavaScript(...)` 
- Boucle d'interaction qui montre des appels de fonctions JavaScript avec `call(fn,...)` 

# `eliza-iOS`

Cette application illustre l'utilisation de *jsRealB* dans une application de chat. L'application est très simpliste. Elle est une simplification (en mettant en commentaire la gestion des emojis et certaines animations) d'une application suggérée par Gemini suite à une requête Google. 

Toutefois les interactions sont générées par des expressions `jsRealB` et sont les mêmes que dans la version macOS . Les éléments importants sont:

- `eliza_frApp.swift`: chargement de `jsRealB.js` et `eliza.js` à partir du *bundle* de l'application.
- `ContentView.swift:` affichage des bulles de messages qui sont conservées dans la liste `messages` dont le premier élément est rempli avec un appel direct à  `evaluateJavaScript(...)`\. Le traitement de l’interaction se fait dans `commitMessageDispatch` qui reçoit la saisie de l’utilisateur et l’ajoute à la liste des messages, puis qui appelle `eliza.js` pour obtenir la réponse\. 

Il serait intéressant d'y ajouter un panneau permettant de changer les genres de l'usager et d'Eliza ainsi que le niveau de familiarité, mais nous laissons ceci comme exercice au lecteur qui pourra s'inspirer des appels présentés dans la version macOS.





 
