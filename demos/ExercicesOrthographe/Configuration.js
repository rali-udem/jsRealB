// les patterns est une liste de chaînes chacune suivant la grammaire suivante
//     pattern = nps, vps, nps 
//     nps = np {"|" nps}
//     np  = nom [adjectif]
//     vps = vp {"|" vp}
//     vp  = verbe suffixe
//     suffixe = [adverbe] prep 
//  les mots doivent être indiqués sous forme de lemme
//  les determinants (définis ou indéfinis) sont choisis aléatoirement devant les noms
//  les alternatives sont choisies aléatoirement
var configuration = {
 "fr": {
    "levels":{
        "débutant":{ 
            "annee":1,
            "patterns":[
                "garçon, aimer, glace",
                "femme, manger, potage chaud",
                "fille, lire, livre",
            ],
            "pronominalization":0, 
            "temps":["Présent"],
            "types":["Affirmative"]
        },
        "junior":{
            "annee":2, 
            "patterns":[
                "loup gris|renard blanc, frapper à|cogner, porte bleu|porte petit",
                "garçon, nager dans, rivière",
                "ballon, voler au-dessus de, montagne",
                "fille, taper de, pied",               
            ],
            "pronominalization":0, 
            "temps":["Imparfait","Futur simple"],
            "types":["Négative"]
        },
        "expert":{
            "annee":4,
            "patterns":[
                "femme, aller à, hôtel",
                "chat, sommeiller dans, arbre",
                "enfant, écouter, grenouille|chien|coq",                        
            ],
            "pronominalization":0.25, 
            "temps":["Passé composé","Plus-que-parfait"],
            "types":["Passive"]
        },
        "maître":{
            "annee":5,
            "patterns":[
                "papa|enfant, ramasser|lancer, roseau|roche",
                "pêcheur, être dans,  mer",
                "chien, dormir dans, panier"                
            ],
            "pronominalization":0.5, 
            "temps":["Passé simple"],
            "types":["Interrogative"]
        },
        "génie":{
            "annee":6,
            "patterns":[
                "oisillon, attendre patiemment après, mère"
            ],
            "pronominalization":0.6,
            "temps":["Futur antérieur","Conditionnel présent"],
            "types":["Progressif","Nécessité"]
        }
    },
    "gender":{"masculin":"m", "féminin":"f"},
    "number":{"singulier":"s","pluriel":"p"},
    "types":{"Affirmative":{"neg":false},
             "Négative":{"neg":true},
             "Passive":{"pas":true},
             "Interrogative":{"int":"yon"},
             'Progressif':{"prog":true},
             "Nécessité":{"mod":"nece"}
    },
    "temps":{
            "Présent":"p","Imparfait":"i","Futur simple":"f","Passé simple":"ps",
            "Passé composé":"pc","Plus-que-parfait":"pq","Futur antérieur":"fa","Passé antérieur":"pa",
            "Subjonctif présent":"s","Subjonctif imparfait":"si","Subjonctif passé":"spa",
                 "Subjonctif plus-que-parfait":"spq",
             "Conditionnel présent":"c","Conditionnel passé":"cp","Impératif":"ip",
             "Participe présent":"pr","Participe passé":"pp","Infinitif":"b","Infinitif passé":"bp"
    },
    "determiners":["le","un"],
    "pronominaliser":"pronom",
    "montrerInstructions":"Montrer les instructions",
    "masquerInstructions":"Masquer les instructions",
    "phrasesuivante":"Phrase suivante",
    "otherLang":"Try it in English",
    "alt":"ou",
    "taperLaPhrase":"Entrer la phrase ici"
    },
 "en":{
    "levels":{
        "starter":{ 
            "annee":1,
            "patterns":[
                "boy, love, ice",
                "woman, eat, soup hot",
                "girl, read, book",
            ],
            "pronominalization":0, 
            "temps":["Present"],
            "types":["Affirmative"]},
        "junior":{
            "annee":2, 
            "patterns":[
                "wolf grey|fox white, knock on|bang, door blue|door small",
                "boy, swim in, river",
                "plane, go over, mountain",
                "girl, slap on, wrist",               
            ],
        "pronominalization":0, 
            "temps":["Simple past"],
            "types":["Negative"]},
        "expert":{
            "annee":4,
            "patterns":[
                "woman, go to, hotel",
                "cat, sleep in, tree",
                "child, listen, frog|dog|rooster",                        
            ],
            "pronominalization":0.25, 
            "temps":["Future"],
            "types":["Passive"]},
        "master":{
            "annee":5,
            "patterns":[
                "papa|child, pick up|throw, reed|rock",
                "fisherman, be in, sea",
                "dog, sleep in, basket"                
            ],
            "pronominalization":0.5, 
            "temps":["Conditional"],
            "types":["Interrogative"]
        },
        "wizard":{
            "annee":6,
            "patterns":[
                "chick, wait patiently for, mother"
            ],
            "pronominalization":0.6,
            "temps":["Subjonctive"],
            "types":["Progressive","Necessity"]
        }
    },
    "gender":{"masculine":"m", "feminine":"f"},
    "number":{"singular":"s","plural":"p"},
    "types":{"Affirmative":{"neg":false},
             "Negative":{"neg":true},
             "Passive":{"pas":true},
             "Interrogative":{"int":"yon"},
             'Progressive':{"prog":true},
             "Necessity":{"mod":"nece"}
    },
    "temps":{
            "Present":"p","Future":"f","Simple past":"ps",
            "Subjonctive":"s","Conditional":"c",
            "Past subjonctive":"si",
    },
    "determiners":["the","a"],
    "pronominaliser":"pronoun",
    "montrerInstructions":"Show instructions",
    "masquerInstructions":"Hide instructions",
    "phrasesuivante":"Next sentence",
    "otherLang":"Essayez en français",
    "alt":"or",
    "taperLaPhrase":"Type your sentence here"
    }
}