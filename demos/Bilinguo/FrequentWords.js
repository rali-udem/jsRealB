// French words taken https://www.languefr.net/2019/03/100-mots-les-plus-utilises-en.html?fullpost
//  translated with Google translate and hand-checked

// top 25 des noms les plus utilisés en français :

var nouns = 
    {"fr":["maison", "ville", "porte", "route", "homme", "femme", "amour", "voiture", "temps", "bien", "fois", "rue",
           "monde", "tête", "temps", "pays", "raison", "coeur", "dieu", "monde", "jour", "monsieur", "personne", 
           "part", "chambre"],
      "en":["house", "city", "door", "road", "man", "woman", "love", "car", "weather", "good", "times", "street", 
            "world ", "head", "time", "country", "reason", "heart", "god", "world", "day", "sir", "person", 
            "part", "room"]
    };

// top 25 des verbes les plus utilisés en français (les auxiliaires et semi-auxiliaires ont été enlevés)
var verbs =
    {"fr": ["faire", "mettre", "dire", "prendre", "donner", "aller", "vouloir",
            "voir", "demander", "trouver", "rendre", "venir", "passer", "comprendre", "rester",
            "tenir", "porter", "parler", "montrer", ],
     "en": ["do", "put", "say", "take", "give", "go", "want", 
            "see", "ask", "find", "return", "come", "pass", "understand", "stay", 
            "hold", "carry", "speak", "show",]
    };

// top 25 des adjectifs les plus utilisés en français :
var adjectives = 
     {"fr": ["lent", "rapide", "méchant", "belle", "intelligent", "ancien", "nouveau", "triste", "heureux", "adorable",
            "timide", "bon", "sage", "fort", "magnifique", "merveilleux", "brave", "dynamique", "élégant", "énervé",
            "sombre", "mauvais", "possible", "moyen", "fatigant", ],
      "en": ["slow", "fast", "wicked", "beautiful", "smart", "old", "new", "sad", "happy", "lovely", 
             "shy", "good", "wise" , "strong", "beautiful", "wonderful", "brave", "dynamic", "elegant", "edgy", 
             "dark", "bad", "possible", "average", "tiring",]

// top 25 des adverbes les plus utilisés en français :
var adverbs = 
    {"fr":["rapidement", "malheureusement", "lentement", "couramment", "également", "parfois", "encore", "tellement",
           "certainement", "probablement", "précisément", "beaucoup", "souvent", "presque", "bientôt", "cependant",
           "désormais", "davantage", "vraiment", "habituellement", "régulièrement", "calmement","tranquillement",
           "jamais", "partout",],
     "en":["quickly", "unfortunately", "slowly", "fluently", "also", "sometimes", "again", "so much", "certainly",
           "probably", "precisely", "many", "often" , "almost", "soon", "however", "now", "more", "really", "usually",
           "regularly", "calmly", "quietly", "never", "everywhere",]
    }
    
//  pronouns 
var tonicPronouns = 
    {"fr": ["moi","toi","lui","nous","vous","eux","elle","elles"],
     "en": ["me", "you","him","us",  "you", "them","her","them"]}