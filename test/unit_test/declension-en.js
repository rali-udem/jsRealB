$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.en, function(lexicon) {
    $.getJSON(URL.rule.en, function(rule) {
        $.getJSON(URL.test.en, function(test) {
    
    QUnit.test( "Declension EN", function( assert ) {
        JSrealB.Config.set({language: 'en', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});

        var feature1 = {};
        feature1[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        
        assert.equal( JSrealB.Module.Declension.decline("berry", JSrealB.Config.get('feature.category.word.noun'), feature1), "berries", "(p) berry => berries" );
        assert.equal( JSrealB.Module.Declension.decline("activity", JSrealB.Config.get('feature.category.word.noun'), feature1), "activities", "(p) activity => activities" );
        assert.equal( JSrealB.Module.Declension.decline("church", JSrealB.Config.get('feature.category.word.noun'), feature1), "churches", "(p) church => churches" );
        assert.equal( JSrealB.Module.Declension.decline("bus", JSrealB.Config.get('feature.category.word.noun'), feature1), "buses", "(p) bus => buses" );
        assert.equal( JSrealB.Module.Declension.decline("knife", JSrealB.Config.get('feature.category.word.noun'), feature1), "knives", "(p) knife => knives" );
        assert.equal( JSrealB.Module.Declension.decline("half", JSrealB.Config.get('feature.category.word.noun'), feature1), "halves", "(p) half => halves" );
        assert.equal( JSrealB.Module.Declension.decline("chief", JSrealB.Config.get('feature.category.word.noun'), feature1), "chiefs", "(p) chief => chiefs" );
        assert.equal( JSrealB.Module.Declension.decline("solo", JSrealB.Config.get('feature.category.word.noun'), feature1), "solos", "(p) solo => solos" );
        assert.equal( JSrealB.Module.Declension.decline("zero", JSrealB.Config.get('feature.category.word.noun'), feature1), "zeros", "(p) zero => zeros" );
        assert.equal( JSrealB.Module.Declension.decline("avocado", JSrealB.Config.get('feature.category.word.noun'), feature1), "avocados", "(p) avocado => avocados" );
        assert.equal( JSrealB.Module.Declension.decline("zoo", JSrealB.Config.get('feature.category.word.noun'), feature1), "zoos", "(p) zoo => zoos" );
        assert.equal( JSrealB.Module.Declension.decline("tomato", JSrealB.Config.get('feature.category.word.noun'), feature1), "tomatoes", "(p) tomato => tomatoes" );
        assert.equal( JSrealB.Module.Declension.decline("hero", JSrealB.Config.get('feature.category.word.noun'), feature1), "heroes", "(p) hero => heroes" );
        assert.equal( JSrealB.Module.Declension.decline("potato", JSrealB.Config.get('feature.category.word.noun'), feature1), "potatoes", "(p) potato => potatoes" );
        assert.equal( JSrealB.Module.Declension.decline("cargo", JSrealB.Config.get('feature.category.word.noun'), feature1), "cargoes", "(p) cargo => cargoes" );
        assert.equal( JSrealB.Module.Declension.decline("formula", JSrealB.Config.get('feature.category.word.noun'), feature1), "formulae", "(p) formula => formulae" );
        assert.equal( JSrealB.Module.Declension.decline("crisis", JSrealB.Config.get('feature.category.word.noun'), feature1), "crises", "(p) crisis => crises" );
        assert.equal( JSrealB.Module.Declension.decline("city", JSrealB.Config.get('feature.category.word.noun'), feature1), "cities", "(p) city => cities" );
        assert.equal( JSrealB.Module.Declension.decline("car", JSrealB.Config.get('feature.category.word.noun'), feature1), "cars", "(p) car => cars" );
        assert.equal( JSrealB.Module.Declension.decline("box", JSrealB.Config.get('feature.category.word.noun'), feature1), "boxes", "(p) box => boxes" );
        assert.equal( JSrealB.Module.Declension.decline("boy", JSrealB.Config.get('feature.category.word.noun'), feature1), "boys", "(p) boy => boys" );
        assert.equal( JSrealB.Module.Declension.decline("day", JSrealB.Config.get('feature.category.word.noun'), feature1), "days", "(p) day => days" );
        assert.equal( JSrealB.Module.Declension.decline("roof", JSrealB.Config.get('feature.category.word.noun'), feature1), "roofs", "(p) roof => roofs" );
        assert.equal( JSrealB.Module.Declension.decline("wife", JSrealB.Config.get('feature.category.word.noun'), feature1), "wives", "(p) wife => wives" );
        assert.equal( JSrealB.Module.Declension.decline("thief", JSrealB.Config.get('feature.category.word.noun'), feature1), "thieves", "(p) thief => thieves" );
        assert.equal( JSrealB.Module.Declension.decline("man", JSrealB.Config.get('feature.category.word.noun'), feature1), "men", "(p) man => men" );
        assert.equal( JSrealB.Module.Declension.decline("child", JSrealB.Config.get('feature.category.word.noun'), feature1), "children", "(p) child => children" );
        assert.equal( JSrealB.Module.Declension.decline("foot", JSrealB.Config.get('feature.category.word.noun'), feature1), "feet", "(p) foot => feet" );
        
        var feature2 = {};
        feature2[(JSrealB.Config.get('feature.form.alias'))] = JSrealB.Config.get('feature.form.comparative');
        assert.equal( JSrealB.Module.Declension.decline("red", JSrealB.Config.get('feature.category.word.adjective'), feature2), "redder", "(co) red => redder" );

        var feature3 = {};
        feature3[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature3[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature3[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature3[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p1');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature3), "I", "(p1 sing) I => I" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature3), "me", "(p1 sing) me => me" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature3), "mine", "(p1 sing) mine => mine" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature3), "myself", "(p1 sing) myself => myself" );
        
        var feature31 = {};
        feature31[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature31[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature31[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature31[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p2');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature31), "you", "(p2 sing) I => you" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature31), "you", "(p2 sing) me => you" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature31), "yours", "(p2 sing) mine => yours" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature31), "yourself", "(p2 sing) myself => yourself" );
                
        var feature32 = {};
        feature32[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature32[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature32[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature32[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature32), "he", "(p3 sing masc) I => he" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature32), "him", "(p3 sing masc) me => him" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature32), "his", "(pp3 sing masc) mine => his" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature32), "himself", "(p3 sing masc) myself => himself" );
                
        var feature33 = {};
        feature33[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature33[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature33[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.feminine');
        feature33[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature33), "she", "(p3 sing fem) I => she" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature33), "her", "(p3 sing fem) me => her" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature33), "hers", "(p3 sing fem) mine => hers" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature33), "herself", "(p3 sing fem) myself => herself" );
        
        var feature34 = {};
        feature34[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature34[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature34[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.neuter');
        feature34[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature34), "it", "(p3 sing neuter) I => it" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature34), "it", "(p3 sing neuter) me => it" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature34), "its", "(p3 sing neuter) mine => its" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature34), "itself", "(p3 sing neuter) myself => itself" );
        
        var feature35 = {};
        feature35[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature35[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.plural');
        feature35[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature35[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p1');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature35), "we", "(p1 plur masc) I => it" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature35), "us", "(p1 plur masc) me => us" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature35), "ours", "(p1 plur masc) mine => ours" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature35), "ourselves", "(p1 plur masc) myself => ourselves" );
       
        var feature36 = {};
        feature36[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature36[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.plural');
        feature36[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature36[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p2');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature36), "you", "(p2 plur masc) I => you" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature36), "you", "(p2 plur masc) me => you" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature36), "yours", "(p2 plur masc) mine => yours" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature36), "yourselves", "(p2 plur masc) myself => yourselves" );
        
        var feature37 = {};
        feature37[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature37[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.plural');
        feature37[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature37[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("I", JSrealB.Config.get('feature.category.word.pronoun'), feature37), "they", "(p3 plural) I => they" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature37), "them", "(p3 plural) me => them" );
        assert.equal( JSrealB.Module.Declension.decline("mine", JSrealB.Config.get('feature.category.word.pronoun'), feature37), "theirs", "(p3 plural) mine => theirs" );
        assert.equal( JSrealB.Module.Declension.decline("myself", JSrealB.Config.get('feature.category.word.pronoun'), feature37), "themselves", "(p3 plural) myself => themselves" );
        
        var feature4 = {};
        feature4[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature4[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature4[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p1');
        assert.equal( JSrealB.Module.Declension.decline("why", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "why", "why => why" );
        assert.equal( JSrealB.Module.Declension.decline("who", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "who", "who => who" );
        assert.equal( JSrealB.Module.Declension.decline("where", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "where", "where => where" );
//        assert.equal( JSrealB.Module.Declension.decline("this", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "this", "this => this" );
//        assert.equal( JSrealB.Module.Declension.decline("nothing", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "nothing", "nothing => nothing" );
        assert.equal( JSrealB.Module.Declension.decline("these", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "these", "these => these" );

        var feature5 = {};
        feature5[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature5[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.plural');
        feature5[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature5[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p1');
        assert.equal( JSrealB.Module.Declension.decline("a", JSrealB.Config.get('feature.category.word.determiner'), feature5), "the", "(masc plur) a => the" );
        assert.equal( JSrealB.Module.Declension.decline("my", JSrealB.Config.get('feature.category.word.determiner'), feature5), "our", "(masc plur) my => our" );
        assert.equal( JSrealB.Module.Declension.decline("that", JSrealB.Config.get('feature.category.word.determiner'), feature5), "those", "(plur) that => those" );
        assert.equal( JSrealB.Module.Declension.decline("what", JSrealB.Config.get('feature.category.word.determiner'), feature5), "what", "what => what" );
        assert.equal( JSrealB.Module.Declension.decline("which", JSrealB.Config.get('feature.category.word.determiner'), feature5), "which", "which => which" );
        assert.equal( JSrealB.Module.Declension.decline("whose", JSrealB.Config.get('feature.category.word.determiner'), feature5), "whose", "whose => whose" );

        var feature6 = {};
        feature6[(JSrealB.Config.get('feature.form.alias'))] = JSrealB.Config.get('feature.form.comparative');
        assert.equal( JSrealB.Module.Declension.decline("about", JSrealB.Config.get('feature.category.word.adverb'), feature6), "about", "about => about" );
        assert.equal( JSrealB.Module.Declension.decline("all", JSrealB.Config.get('feature.category.word.adverb'), feature6), "all", "all => " );
        assert.equal( JSrealB.Module.Declension.decline("badly", JSrealB.Config.get('feature.category.word.adverb'), feature6), "worse", "(co) badly => worse" );
        assert.equal( JSrealB.Module.Declension.decline("far", JSrealB.Config.get('feature.category.word.adverb'), feature6), "farther", "(co) far => farther" );
        assert.equal( JSrealB.Module.Declension.decline("little", JSrealB.Config.get('feature.category.word.adverb'), feature6), "less", "(co) little => less" );
        assert.equal( JSrealB.Module.Declension.decline("well", JSrealB.Config.get('feature.category.word.adverb'), feature6), "better", "(co) well => better" );
        
        
        // Automatic Testing
        var declensionTable = test.declension;
        $.each(declensionTable, function(unit, aCategoryList) {
        $.each(aCategoryList, function(category, unitInfo) {
            if(unitInfo !== null 
                    && $.isPlainObject(unitInfo)
                    && !$.isEmptyObject(unitInfo))
            {
                $.each(unitInfo, function(declensionShortForm, declinedUnit) {
                if(declinedUnit.length > 0)
                {
                    var feature = {};
                    if(declensionShortForm === 'fs'
                            || declensionShortForm === 'ms'
                            || declensionShortForm === 'ns'
                            || declensionShortForm === 'xs'
                            || declensionShortForm === 'fp'
                            || declensionShortForm === 'mp'
                            || declensionShortForm === 'np'
                            || declensionShortForm === 'xp')
                    {
                        feature = declensionShortForm.separateGenderAndNumber();
                    }
                    else
                    {
                        switch(declensionShortForm)
                        {
                            case JSrealB.Config.get('feature.form.comparative'): 
                            case JSrealB.Config.get('feature.form.superlative'):
                                feature[(JSrealB.Config.get('feature.form.alias'))] = declensionShortForm;
                            break;
                            case JSrealB.Config.get('feature.number.plural'):
                                feature[(JSrealB.Config.get('feature.number.alias'))] = declensionShortForm;
                            break;
                            default:
                                console.error("Alias non supporté : " + declensionShortForm);
                        }
                    }
                    
                    assert.equal( JSrealB.Module.Declension.decline(
                            unit,
                            category,
                            feature), 
                        declinedUnit, 
                        "(" + declensionShortForm + ") " + unit + " => " + declinedUnit);
                }
                });
            }
        });
        });
    });
    });
    });
});
});