// French words taken https://www.languefr.net/2019/03/100-mots-les-plus-utilises-en.html?fullpost
//  translated with Google translate and hand-checked
//  some ambiguous words (e.g. temps) were removed

// top 25 des noms les plus utilisés en français :
const nouns = 
    {"fr":["maison", "ville", "porte", "route", "homme", "femme", "amour", "voiture", "bien", "rue",
           "monde", "tête",  "pays", "raison", "coeur", "dieu", "monde", "jour", "monsieur", "personne", 
           "chambre"],
      "en":["house", "town", "door", "road", "man", "woman", "love", "car", "good", "street", 
            "world", "head", "country", "reason", "heart", "god", "world", "day", "sir", "person", 
            "room"]
    };

// top 25 des verbes les plus utilisés en français (les verbes auxiliaires et semi-auxiliaires ont été enlevés)
//   les verbes intransitifs ont été placés dans une autre liste
const verbs =
    {"fr": ["mettre", "dire", "prendre", "donner", "vouloir",
            "voir", "demander", "trouver", "passer", "comprendre", 
            "tenir", "porter", "montrer", ],
     "en": ["put", "say", "take", "give", "want", 
            "see", "ask", "find", "pass", "understand",
            "hold", "carry", "show",]
    };

const intransitiveVerbs = 
    {"fr": ["aller", "venir","rester","parler", ],
     "en": ["go", "come",  "stay", "speak", ],
}

// top 25 des adjectifs les plus utilisés en français :
const adjectives = 
     {"fr": ["lent", "rapide", "méchant", "beau", "intelligent", "ancien", "nouveau", "triste", "heureux", "adorable",
            "timide", "bon", "sage", "fort", "magnifique", "merveilleux", "brave", "dynamique", "élégant", 
            "sombre", "mauvais", "moyen", ],
      "en": ["slow", "fast", "wicked", "beautiful", "smart", "old", "new", "sad", "happy", "lovely", 
             "shy", "good", "wise" , "strong", "beautiful", "wonderful", "brave", "dynamic", "elegant",  
             "dark", "bad", "average",]
     };

// top 25 des adverbes les plus utilisés en français :
const adverbs = 
    {"fr":["rapidement", "malheureusement", "lentement", "couramment", "également", "parfois", "encore", "tellement",
           "certainement", "probablement", "précisément", "beaucoup", "souvent", "presque", "bientôt", "cependant",
           "désormais", "davantage", "vraiment", "habituellement", "régulièrement", "calmement","tranquillement",
           "jamais", "partout",],
     "en":["quickly", "unfortunately", "slowly", "fluently", "also", "sometimes", "again", "so much", "certainly",
           "probably", "precisely", "many", "often" , "almost", "soon", "however", "now", "more", "really", "usually",
           "regularly", "calmly", "quietly", "never", "everywhere",]
    }
    
//  pronouns 
const tonicPronouns = 
    {"fr": ["moi","toi","lui","nous","vous","eux","elle","elles"],
     "en": ["me","you","him","us",  "you", "them","her","them"],
     "pe": [   1,    2,    3,    1,     2,     3,    3,    3],
     "n" : [  "s",  "s",  "s",  "p",   "p",   "p",  "s",   "p"]
    };

const numbers=["s","p"]
const determiners = [{"fr":"un","en":"a"},{"fr":"le","en":"the"}];
const tenses = ["p","ps","f"];