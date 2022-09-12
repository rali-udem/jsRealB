#!/bin/bash
demos=(demos/99BottlesOfBeer/index.html demos/Data2Text/batiment.html demos/Data2Text/building.html \
        demos/Augmentation/Augmentation.html \
        demos/date/index.html demos/e2eChallenge/index.html \
		demos/Evaluation/index.html demos/Evenements/index.html \
		demos/ExercicesDeStyle/index.html demos/Inflection/index.html \
		demos/KilometresAPied/index.html \
		demos/PetitChaperonRouge/LittleRedRidingHood.html demos/PetitChaperonRouge/PetitChaperonRouge.html \
		demos/Pronoms/index.html \
		demos/Personage/index.html \
		demos/randomGeneration/French.html demos/randomGeneration/English.html \
		demos/VariantesDePhrases/index.html \
		documentation/user.html \
		Tutorial/tutorial.html \
		Tests/testAll.html
        )

open /Applications/Safari.app ${demos[@]}
node dist/jsRealB-server.mjs demos/Weather/weatherLexicon.js & \
python3 demos/Weather/Bulletin.py ; \
killall node 
