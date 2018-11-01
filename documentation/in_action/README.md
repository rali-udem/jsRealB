# jsRealB in use

[*Version française*](LISEZMOI.md)

* [**Tutorial**](http://rali.iro.umontreal.ca/JSrealB/current/Tutorial/tutorial.html)
* [**Documentation**](http://rali.iro.umontreal.ca/JSrealB/current/documentation/user.html) in both English and French.
* [**Integrated Development Environment**](http://rali.iro.umontreal.ca/JSrealB/current/IDE/index.html).

## Demos

### Simple examples on a single sentence
* Use of loops in Javascript to create repetitive texts
    * English: [99 bottles of beer](http://rali.iro.umontreal.ca/JSrealB/current/demos/99BottlesOfBeer/index.html)
    * French: [1 km à pied](http://rali.iro.umontreal.ca/JSrealB/current/demos/KilometresAPied/index.html)
* Tests of specific features
    * French and English sentences modified with time, number and conjugation: [Date generation](http://rali.iro.umontreal.ca/JSrealB/current/demos/date/index.html)
    * Type a French or English sentence that will be realized with all possible sentence modifyers [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/VariantesDePhrases/index.html)
    * French or English conjugation and declension of a word [Conjugation and declension](http://rali.iro.umontreal.ca/JSrealB/current/demos/inflection/index.html)
    * Show elision in contrived French and English sentences even across HTML tags that are displayed on purpose [elision](demos/elision) [sentences to elide](build/elisionTests.js) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/elision/index.html)
* `Node.js` module
    * a command-line interface written `node.js` program that given a word finds a jsRealB expression to realize it (this capability is now included in the IDE) [*lemmatize.js*](demos/lemmatize/lemmatize.js)
* User interface to create a simple sentence with options. The system shows the jsRealB expression and its realization. It is also possible to ask for a random sentence using words of the lexicon.
    * [*Execute in English*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/english.html) 
      [*Execute in French*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/french.html)

### Text realization
* Create an [Exercise in Style](https://en.wikipedia.org/wiki/Exercises_in_Style) which creates the structure of the original story of Raymond Queneau in both French and English. Using menus, some elements of the text can be modified and the modifications are highlighted in the web page. [Exercises in style](http://rali.iro.umontreal.ca/JSrealB/current/demos/ExercicesDeStyle/index.html)

###  Data to Text applications
* **Description (in French) of a list of events** and associated informations given as a json file [Événements](http://rali.iro.umontreal.ca/JSrealB/current/demos/Evenements/index.html)
* **Description of list of steps for the building of a house**, given information about tasks, the duration and the precedence relations between them. 

    ![Screen copy of the application](demos/Data2Text/building-small.jpg "Construction of a building")
    
  The system first computes the critical path to find the start and end times of each task. It then creates a graphic for displaying the PERT diagram and an accompanying text to explain the steps to follow. It is possible to interactively change the start date and to explore the graphic with the mouse which also uses jsRealB to generate the text of the tooltips. 
    * [English](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/building.html)
    * [French](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/batiment.html)
* **Itinerary description in an *optimistic* Montréal Métro network**. The system shows an interactive map of the Montréal Métro station with a new line. When a user clicks two stations, the systems realizes a text describing the itinerary to go from the first station to the second. 

    ![Screen copy of the application](Tutorial/metro.jpg "Finding a path in the metro")
    
    The langage of the web page and of the realization can be changed interactively by clicking in the top right of the page. [Metro](http://rali.iro.umontreal.ca/JSrealB/current/Tutorial/metro.html)

