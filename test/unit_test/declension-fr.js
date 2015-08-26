$.getJSON(URL.feature, function(feature) {
$.getJSON(URL.lexicon.fr, function(lexicon) {
    $.getJSON(URL.rule.fr, function(rule) {
        $.getJSON(URL.test.fr, function(test) {
    
    QUnit.test( "Declension FR", function( assert ) {
        JSrealB.Config.set({language: 'fr', lexicon: lexicon, rule: rule, feature: feature, isDevEnv: true, printTrace: false});

        var featureMp = {};
        featureMp[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        featureMp[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        
        var featureFp = {};
        featureFp[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.feminine');
        featureFp[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        
        var featureFs = {};
        featureFs[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.feminine');
        featureFs[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        
        assert.equal( JSrealB.Module.Declension.decline("cheval", JSrealB.Config.get('feature.category.word.noun'), featureMp), "chevaux", "(mp) cheval => chevaux" );
        assert.equal( JSrealB.Module.Declension.decline("acheteur", JSrealB.Config.get('feature.category.word.noun'), featureFp), "acheteuses", "(p) acheteur => acheteuses" );
        assert.equal( JSrealB.Module.Declension.decline("condisciple", JSrealB.Config.get('feature.category.word.noun'), featureMp), "condisciples", "(mp) condisciple => condisciples" );
        assert.equal( JSrealB.Module.Declension.decline("idéal", JSrealB.Config.get('feature.category.word.adjective'), featureMp), "idéaux", "(mp) idéal => idéaux" );
        assert.equal( JSrealB.Module.Declension.decline("relatif", JSrealB.Config.get('feature.category.word.adjective'), featureFs), "relative", "(fs) relatif => relative" );

        var feature4 = {};
        feature4[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature4[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature4[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature4[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("je", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "il", "(p3 masc sing) je => il" );
        assert.equal( JSrealB.Module.Declension.decline("moi", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "lui", "(p3 masc sing) moi => lui" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "le", "(p3 masc sing) me => le" );
        
        assert.equal( JSrealB.Module.Declension.decline("lequel", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "lequel", "(p3 masc sing) lequel => lequel" );
        assert.equal( JSrealB.Module.Declension.decline("celui-ci", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "celui-ci", "(p3 masc sing) celui-ci => celui-ci" );
        
        assert.equal( JSrealB.Module.Declension.decline("qui", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "qui", "(p3 masc sing) qui => qui" );
        assert.equal( JSrealB.Module.Declension.decline("que", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "que", "(p3 masc sing) que => que" );
        assert.equal( JSrealB.Module.Declension.decline("quoi", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "quoi", "(p3 masc sing) quoi => quoi" );
        assert.equal( JSrealB.Module.Declension.decline("où", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "où", "(p3 masc sing) où => où" );
        
        var feature4bis = {};
        feature4[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature4[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature4[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.neuter');
        feature4[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("ce", JSrealB.Config.get('feature.category.word.pronoun'), feature4bis), "ce", "(p3 neut sing) ce => ce" );

        var feature5 = {};
        feature5[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature5[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature5[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.feminine');
        feature5[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("je", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "elle", "(p3 fem sing) je => elle" );
        assert.equal( JSrealB.Module.Declension.decline("moi", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "elle", "(p3 fem sing) moi => elle" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "la", "(p3 fem sing) me => la" );
        
        assert.equal( JSrealB.Module.Declension.decline("lequel", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "laquelle", "(p3 fem sing) lequel => laquelle" );
        assert.equal( JSrealB.Module.Declension.decline("celui-ci", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "celle-ci", "(p3 fem sing) celui-ci => celle-ci" );
        
        assert.equal( JSrealB.Module.Declension.decline("qui", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "qui", "(p3 fem sing) qui => qui" );
        assert.equal( JSrealB.Module.Declension.decline("que", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "que", "(p3 fem sing) que => que" );
        assert.equal( JSrealB.Module.Declension.decline("quoi", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "quoi", "(p3 fem sing) quoi => quoi" );
        assert.equal( JSrealB.Module.Declension.decline("où", JSrealB.Config.get('feature.category.word.pronoun'), feature5), "où", "(p3 fem sing) où => où" );
        
        var feature6 = {};
        feature6[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.plural');
        feature6[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.plural');
        feature6[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.feminine');
        feature6[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p3');
        assert.equal( JSrealB.Module.Declension.decline("je", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "elles", "(p3 fem plur) je => elles" );
        assert.equal( JSrealB.Module.Declension.decline("moi", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "elles", "(p3 fem plur) moi => elles" );
        assert.equal( JSrealB.Module.Declension.decline("me", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "les", "(p3 fem sing) me => les" );
        
        assert.equal( JSrealB.Module.Declension.decline("lequel", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "lesquelles", "(p3 fem plur) lequel => lesquelles" );
        assert.equal( JSrealB.Module.Declension.decline("celui-ci", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "celles-ci", "(p3 fem plur) celui-ci => celles-ci" );
        
        assert.equal( JSrealB.Module.Declension.decline("qui", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "qui", "(p3 fem plur) qui => qui" );
        assert.equal( JSrealB.Module.Declension.decline("que", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "que", "(p3 fem plur) que => que" );
        assert.equal( JSrealB.Module.Declension.decline("quoi", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "quoi", "(p3 fem plur) quoi => quoi" );
        assert.equal( JSrealB.Module.Declension.decline("où", JSrealB.Config.get('feature.category.word.pronoun'), feature6), "où", "(p3 fem plur) où => où" );
        
        var feature7 = {};
        feature7[(JSrealB.Config.get('feature.number.alias'))] = JSrealB.Config.get('feature.number.singular');
        feature7[(JSrealB.Config.get('feature.owner.alias'))] = JSrealB.Config.get('feature.owner.singular');
        feature7[(JSrealB.Config.get('feature.gender.alias'))] = JSrealB.Config.get('feature.gender.masculine');
        feature7[(JSrealB.Config.get('feature.person.alias'))] = JSrealB.Config.get('feature.person.p1');
        assert.equal( JSrealB.Module.Declension.decline("le", JSrealB.Config.get('feature.category.word.determiner'), feature7), "le", "le => le" );
        assert.equal( JSrealB.Module.Declension.decline("au", JSrealB.Config.get('feature.category.word.determiner'), feature7), "au", "au => au" );
        assert.equal( JSrealB.Module.Declension.decline("du", JSrealB.Config.get('feature.category.word.determiner'), feature7), "du", "du => du" );
        assert.equal( JSrealB.Module.Declension.decline("un", JSrealB.Config.get('feature.category.word.determiner'), feature7), "un", "un => un" );
        assert.equal( JSrealB.Module.Declension.decline("mon", JSrealB.Config.get('feature.category.word.determiner'), feature7), "mon", "mon => mon" );
        assert.equal( JSrealB.Module.Declension.decline("notre", JSrealB.Config.get('feature.category.word.determiner'), feature7), "notre", "notre => notre" );
        
        
        
//        assert.equal( JSrealB.Module.Declension.decline("", JSrealB.Config.get('feature.category.word.pronoun'), feature4), "", "() => " );
        
        
        // Automatic Testing
        var declensionTable = test.declension;
        var i = 0;
        $.each(declensionTable, function(unit, categoryList) {
        $.each(categoryList, function(category, unitInfo) {
            
            if(unitInfo !== null 
                    && $.isPlainObject(unitInfo)
                    && !$.isEmptyObject(unitInfo))
            {
                var declensions = Object.keys(unitInfo);
                
                var randomPosition = Math.floor(declensions.length * Math.random());
                var declensionShortForm = declensions[((randomPosition === 0 && declensions[0] === "category") ? randomPosition+1 : randomPosition)];

                var declinedUnit = unitInfo[declensionShortForm];
                if(declinedUnit.length > 0)
                {
                    if((declensionShortForm === "s" && unitInfo["fs"] !== undefined)
                            || (declensionShortForm === "p" && unitInfo["fp"] !== undefined))
                    {
                        declensionShortForm = "m" + declensionShortForm;
                    } 
                    else if(declensionShortForm.charAt(0) === "x")
                    {
                        declensionShortForm = ((Math.floor(2 * Math.random() === 0) ? "m" : "f")) 
                                + declensionShortForm.charAt(1);
                    }
//                    var genderAndNumber = declensionShortForm.separateGenderAndNumber();

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
                    else if(declensionShortForm === 's' 
                            || declensionShortForm === 'p'
                            || declensionShortForm === 'n')
                    {
                        feature[(JSrealB.Config.get('feature.number.alias'))] = declensionShortForm;

                    }
                    
                    if(declensionShortForm !== 'co') // on ne teste pas les comparatifs
                    {
                        assert.equal( JSrealB.Module.Declension.decline(
                            unit,
                            category,
                            feature), 
                        declinedUnit, 
                        "(" + declensionShortForm + ") " + unit + " => " + declinedUnit);
                    }
                }
            }
        });
                
        if(i > 3000)
        {
            return false;
        }

        i++;
        });
//    assert.equal( , "", "" );

    });
        });
    });
});
});