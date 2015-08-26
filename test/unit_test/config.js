$.getJSON(URL.feature, function(feature) {
    QUnit.test( "Configuration testing", function( assert ) {
        var setting = {language: "fr"};
        assert.deepEqual( JSrealB.Config.set(setting), setting, "Mise à jour d'un paramètre de configuration existant");

        var setting2 = {toto: "totodata"};
        assert.deepEqual( JSrealB.Config.set(setting2), {}, "Erreur attendue : Ajout d'un paramètre de configuration non existant");

        var setting3 = {language: "fr"};
        assert.deepEqual( JSrealB.Config.add(setting3), {}, "Erreur attendue : Ajout d'un paramètre de configuration existant");

        var setting4 = {toto: "totodata"};
        assert.deepEqual( JSrealB.Config.add(setting4), setting4, "Ajout d'un paramètre de configuration non existant");

        assert.equal( JSrealB.Config.get("language"), "fr", "Récupération d'un paramètre de configuration existant");

        assert.equal( JSrealB.Config.get("_-_notexists_-_"), null, "Erreur attendue : Récupération d'un paramètre de configuration non existant");

// OLD METHOD
//        assert.equal( JSrealB.Config.get("category.verb"), "V", "Récupération de l'alias du mot 'verb' dans le lexique");
//
//        assert.equal( JSrealB.Config.get("grammar.number.plural"), "p", "Récupération de l'alias du mot 'plural'");
//        assert.equal( JSrealB.Config.get("grammar.number.singular"), "s", "Récupération de l'alias du mot 'singular'");
//
//        assert.equal( JSrealB.Config.get("grammar.gender.masculine"), "m", "Récupération de l'alias du mot 'masculine'");
//        assert.equal( JSrealB.Config.get("grammar.gender.feminine"), "f", "Récupération de l'alias du mot 'feminine'");
// OLD METHOD

        JSrealB.Config.set({feature: feature});
        assert.equal( JSrealB.Config.get("feature.gender.feminine"), "f", "Dictionnaire : Récupération de l'alias du mot 'feminine'");
        assert.equal( JSrealB.Config.get("feature.gender.masculine"), "m", "Dictionnaire : Récupération de l'alias du mot 'masculine'");
        
        assert.equal( JSrealB.Config.get("feature.number.plural"), "p", "Dictionnaire : Récupération de l'alias du mot 'plural'");
        assert.equal( JSrealB.Config.get("feature.number.singular"), "s", "Dictionnaire : Récupération de l'alias du mot 'singular'");
        
        assert.equal( JSrealB.Config.get("feature.category.word.verb"), "V", "Dictionnaire : Récupération de l'alias du mot 'verb' dans le lexique");
    });
});