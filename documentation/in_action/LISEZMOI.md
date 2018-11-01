# jsRealB en action 

[*English version*](README.html)

* [**Tutoriel en anglais**](http://rali.iro.umontreal.ca/JSrealB/current/Tutorial/tutorial.html)
* [**Documentation**](http://rali.iro.umontreal.ca/JSrealB/current/documentation/user.html) en français et en anglais.
* [**Environnement de développement**](http://rali.iro.umontreal.ca/JSrealB/current/IDE/index.html).

## Démonstrations

### Exemples simples sur une seule phrase
* Utilisation de boucles en Javascript pour créer des textes répétitifs
    * anglais: [99 bottles of beer](http://rali.iro.umontreal.ca/JSrealB/current/demos/99BottlesOfBeer/index.html)
    * français: [1 km à pied](http://rali.iro.umontreal.ca/JSrealB/current/demos/KilometresAPied/index.html)
* Tests de certaines possibilités
    * phrases en français et en anglais modifiées par le temps, le nombre et la conjugaison: [Date generation](http://rali.iro.umontreal.ca/JSrealB/current/demos/date/index.html)
    * expression jsRealB correspondant à une phrase en français ou en anglais qui sera réalisée avec toutes les possibilités de modifications [*Exécuter*](http://rali.iro.umontreal.ca/JSrealB/current/demos/VariantesDePhrases/index.html)
    * conjugaison et déclinaison en français ou en anglais d'un mot [Conjugaison and déclinaison](http://rali.iro.umontreal.ca/JSrealB/current/demos/inflection/index.html)
    * Illustration de l'élision de cas difficiles d'élision en français et en anglais même à travers des balises HTML qui sont affichées à dessein [phrases test](build/elisionTests.js) [*Exécuter*](http://rali.iro.umontreal.ca/JSrealB/current/demos/elision/index.html)
* `Node.js` module
    * une interface en ligne de commande écrite en `node.js` qui reçoit un mot et qui en donne une expression jsRealB pour la réaliser, si cela est possible (l'environnement de développement intègre ce module) [*lemmatize.js*](demos/lemmatize/lemmatize.js)
* Une interface pour créer une phrase simple avec de multiples options. Le système montre l'expression jsRealB et sa réalisation. Il est aussi possible de demander une phrase au hasard à partir des mots du lexique.
    * [*Exécuter en anglais*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/anglais.html) 
      [*Exécuter en français*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/français.html)

### Text realization
* Créer un [Exercice de Style](https://fr.wikipedia.org/wiki/Exercices_de_style) inspiré du récit original de Raymond Queneau en français ainsi qu'une version anglaise. Le texte peut être modifié avec des menus et les éléments changés sont mis en évidence. [Exercise de style](http://rali.iro.umontreal.ca/JSrealB/current/demos/ExercicesDeStyle/index.html)


###  Data to Text applications
* **Description (en français) d'une liste d'événements ** et des informations associées fournis en json. [Événements](http://rali.iro.umontreal.ca/JSrealB/current/demos/Evenements/index.html)
* **Description de la liste des étapes pour la construction d'un bâtiment**, à partir d'informations sur les tâches, leur dûrée et les relations de précédences entre elles.

    ![Copie d'écran de l'application](demos/Data2Text/batiment-small.jpg "Construction d'un bâtiment")
    
  Le système calcule d'abord le chemin critique pour trouver le début et la fin de chaque tâche. Il crée ensuite un graphique pour afficher le diagramme PERT et il réalise un texte qui explique les étapes à suivre. Il est possible de changer interactivement la date de début des travaux et d'explorer le graphique avec la souris pour afficher des infos-bulle aussi réalisées par jsRealB.
    * [anglais](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/building.html)
    * [français](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/batiment.html)
* **Description d'un itinéraire dans le réseau *optimiste* du métro de Montréal**. Le système montre une carte interactive du métro de Montréal comprenant une nouvelle ligne. Lorsqu'un usager clique deux stations, le système réalise un texte qui décrit l'itinéraire pour aller de la première station à la seconde.

    ![Copie d'écran de l'application](Tutorial/metro-fr.jpg "Trouver un chemin dans le métro")
    
    La langue de la page web et de la réalisation peut être changé interactivement en cliquant dans le haut à droite de la page. [Metro](http://rali.iro.umontreal.ca/JSrealB/current/Tutorial/metro.html)

