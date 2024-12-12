var configuration = {
 "fr": {
    "levels":{
        "débutant":{ 
            "annee":1,
            "verbs":["aimer","avoir","chanter","lever","lire"],
            "nouns":["ami","arbre","fille","jardin","lapin","chien","oiseau"],
            "adjectives":["brun","chaud","rouge","vert"],
            "pronominalization":0, 
            "temps":["Présent"],
            "types":["Affirmative"]},
        "junior":{
            "annee":2, 
            "pronominalization":0, 
            "temps":["Imparfait","Futur simple"],
            "types":["Négative"]},
        "expert":{
            "annee":4,
            "pronominalization":0.25, 
            "temps":["Passé composé","Plus-que-parfait"],
            "types":["Passive"]},
        "maître":{
            "annee":5,
            "pronominalization":0.5, 
            "temps":["Passé simple"],
            "types":["Interrogative"]
        },
        "génie":{
            "annee":6,
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
    "otherLang":"Try it in English",
    "alt":"ou",
    "taperLaPhrase":"Entrer la phrase ici"
    },
 "en":{
    "levels":{
        "starter":{ 
            "annee":1,
            "verbs":["eat","love","hate","admire","understand"],
            "nouns":["cat","dog","mouse","veal","man","woman"],
            "adjectives":["pretty","white","small","big"],
            "pronominalization":0, 
            "temps":["Present"],
            "types":["Affirmative"]},
        "junior":{
            "annee":2, 
            "pronominalization":0, 
            "temps":["Simple past"],
            "types":["Negative"]},
        "expert":{
            "annee":4,
            "pronominalization":0.25, 
            "temps":["Future"],
            "types":["Passive"]},
        "master":{
            "annee":5,
            "pronominalization":0.5, 
            "temps":["Conditional"],
            "types":["Interrogative"]
        },
        "wizard":{
            "annee":6,
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
    "otherLang":"Essayez en français",
    "alt":"or",
    "taperLaPhrase":"Type your sentence here"
    }
}