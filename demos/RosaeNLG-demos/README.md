# RosaeNLG demos

Examples taken from the [RosaeNLG](https://rosaenlg.org/rosaenlg/4.3.0/index.html) tutorials 
* [English](https://rosaenlg.org/rosaenlg/4.3.0/tutorials/tutorial_en_US.html)
* [French](https://rosaenlg.org/rosaenlg/4.3.0/tutorials/tutorial_fr_FR.html) 

We use the same data and generate the same sentences in both English and French.

**Files**

* `English.js`: English realizer, compare it with `tuto-en.pug` and `example-en.pug` in the `RosaeNLG` directory
* `Francais.js` : French realizer, compare it with `tuto-fr.pug` and `example-fr.pug` in the `RosaeNLG` directory
* `index.html` : web page to display all realizations using `realizeAll.js`
* `phones.js` : data file for information about some types of phones
* `README.md` : this file
* `realizeAll.js` : script for launching all realizations; it can be used directly with `node` or imported in `index.html`
* `Realizer.js` : Common code to both realizers
* `RosaeNLG-pugs`: directory of pug files copied from the RosaeNLG tutorials

