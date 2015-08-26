<?php

/**
 * Description of JSRealFrService
 *
 * @author molinspa
 */
class JSRealFrService extends JSRealService
{
    public function __construct($sLanguage)
    {
        parent::__construct($sLanguage);
    }
    
    public function export()
    {
        /// Lexicon
        $aPunctuation = $this->getPunctuation();
        $aLexicon = $this->getLexicon();
        $this->applyLexiconPatch($aLexicon);
        $this->extendLexicon($aLexicon);
//        Util::var_dump($aLexicon['le']);die;
        /// Get Additional Information
        $aVerbList = $this->getVerbList();
        $aConjugation = $this->getConjugation();
        $this->updateVerbId($aVerbList, $aConjugation);
        $this->addInfinitiveTense($aConjugation);
        
//        $aSimplifiedDmLexicon = $this->getDmTableId(
//                '; Nouns, Adjectives, Ordinals, Quantifiers:', 
//                '; Verbs:');
        $aNounList = $this->getDmLexicon('; Nouns, Adjectives, Ordinals, Quantifiers:', '; Verbs:', array(Config::get('jsreal.feature.category.word.noun')));
        $aAdjectiveList = $this->getDmLexicon('; Nouns, Adjectives, Ordinals, Quantifiers:', '; Verbs:', array(Config::get('jsreal.feature.category.word.adjective')));
        $aPronounList = $this->getDmLexicon('; Pronouns:', '; Prepositions:');
        $aDeterminerList = $this->getDmLexicon('; Determiners:', '; Pronouns:');
        $aAdverbList = $this->getDmLexicon('; Adverbs:', '; Coordinate and Subordinate Conjunctions:');
        $aPrepositionList = $this->getDmLexicon('; Prepositions:', '; Adverbs:');

        /// Upgrade Lexicon
//        $this->addTableIdToNounAndAdjective($aSimplifiedDmLexicon, $aLexicon); // Nouns, Adjectives, Ordinals, Quantifiers
        $this->addTableIdToVerb($aVerbList, $aLexicon); // Verb Only
        $aDmLexiconList = array(
                    Config::get('jsreal.feature.category.word.noun') => $aNounList,
                    Config::get('jsreal.feature.category.word.adjective') => $aAdjectiveList,
                    Config::get('jsreal.feature.category.word.pronoun') => $aPronounList,
                    Config::get('jsreal.feature.category.word.determiner') => $aDeterminerList,
                    Config::get('jsreal.feature.category.word.adverb') => $aAdverbList,
                    Config::get('jsreal.feature.category.word.preposition') => $aPrepositionList
                );
        $this->addTableIdToLexicon(
                $aDmLexiconList, 
                $aLexicon);
//        Util::var_dump($aLexicon['le']);die;
        
        /// Test
        $aTestConjugatedVerb = $this->getTestConjugatedVerb();
        $this->applyLexiconPatchToTestVerb($aTestConjugatedVerb);
        $aTestDeclension = $this->getTestDeclension($aLexicon);
        
        $aTest = array();
        $aTest['conjugation'] = $aTestConjugatedVerb;
        $aTest['declension'] = $aTestDeclension;
        
        /// Remove unuse information
        $this->removeConjugationInLexicon($aLexicon);
        $this->removeInflexionInLexicon($aLexicon);
        $this->removeFrenchPropertiesInLexicon($aLexicon);
        
        /// Create Rules Table
        $aNounAdjectiveDeclension = $this->getDmApplyRule('; Nouns rules:', '; verb rules:', 'declension');
        $aPronounDeclension = $this->getDmApplyRule('; Pronouns rules:', '; Prepositions rules:', 'declension');
        $aDeterminerDeclension = $this->getDmApplyRule('; Determiners rules', '; Pronouns rules:', 'declension');
        
        $aPunctuationRule = $this->getPunctuationRule();
        
        $aAdverbRule = $this->getDmApplyRule('; Adverbs rules:', '; Post-head particles:', 'option');
        $aPrepositionRule = $this->getDmApplyRule('; Prepositions rules:', '; Adverbs rules:', 'option');
        
        $aRuleTable = array();
        $aRuleTable['conjugation'] = $aConjugation;
//        $aRuleTable['declension'] = $aDeclensionRule;
//        $aRuleTable['pronoun'] = $aPronounRule;
//        $aRuleTable['punctuation'] = $aPunctuationRule;
        $aRuleTable['declension'] = array_merge(
                $aNounAdjectiveDeclension,
                $aPronounDeclension,
                $aDeterminerDeclension
            );
        $aRuleTable['punctuation'] = $aPunctuationRule;
        $aRuleTable['regular'] = array_merge(
                $aAdverbRule,
                $aPrepositionRule
            );
        $aRuleTable['date'] = $this->getDateRule();
        $aRuleTable['number'] = $this->getNumberRule();
        
        $aExportedFile = array_merge(
                $this->exportLexicon(array_merge($aPunctuation, $aLexicon)),
                $this->exportRuleTable($aRuleTable),
                $this->exportTest($aTest),
                $this->exportDmFeature()
            );
        
        return $aExportedFile;
    }
    
    private function getVerbList()
    {
        $sXmlFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_data') .
                Config::get('jsreal.verb.dictionary.xml.' . $this->sLanguage);
        $sXslFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_xsl') .
                Config::get('jsreal.verb.dictionary.xsl.' . $this->sLanguage);
        $sJsonVerbList = Xslt::applyXsltTemplateToXml($sXmlFileRealPath, $sXslFileRealPath);

        return Conversion::getArrayFromJson($sJsonVerbList);
    }
    
    private function getConjugation()
    {
        $sXmlFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_data') .
                Config::get('jsreal.verb.conjugation.xml.' . $this->sLanguage);
        $sXslFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_xsl') .
                Config::get('jsreal.verb.conjugation.xsl.' . $this->sLanguage);
        
        $sJsonConjugation = Xslt::applyXsltTemplateToXml($sXmlFileRealPath, $sXslFileRealPath);

        return Conversion::getArrayFromJson($sJsonConjugation);
    }
    
    private function addInfinitiveTense(array &$aConjugation)
    {
        foreach($aConjugation as $sTableId => $aConjugationTable)
        {
            if(isset($aConjugationTable["ending"])
                    && isset($aConjugationTable[Config::get("jsreal.feature.tense.alias")]))
            {
                $aConjugation[$sTableId][Config::get("jsreal.feature.tense.alias")][Config::get("jsreal.feature.tense.base")] = $aConjugationTable["ending"];
            }
        }
    }
    
    private function updateVerbId(array &$aVerbList, array &$aConjugation)
    {
        $aOldToNewIdMap = array();
        
        $i = 0;
        $aTmpConjugation = array();
        foreach($aConjugation as $sTableId => $aConjugationTable)
        {
            if(!isset($aOldToNewIdMap[$sTableId]))
            {
                $aOldToNewIdMap[$sTableId] = 'v' . $i++;
            }
            
            $aTmpConjugation[$aOldToNewIdMap[$sTableId]] = $aConjugationTable;
        }
        $aConjugation = $aTmpConjugation;
        
        foreach($aVerbList as $sVerb => $sTableId)
        {
            $aVerbList[$sVerb] = $aOldToNewIdMap[$sTableId];
        }
    }
    
    private function removeFrenchPropertiesInLexicon(array &$aLexicon)
    {
        $aForbiddenKeyList = array('pe', 'pt', 'l', 'pa', 'n', 'df', 'og', 'cp', 
            've', 'po', 'ne', 'd', 'r', 'nc', 'rc', 'ae', 'ae', 'cr');

        $this->removeKeyListInLexicon($aLexicon, $aForbiddenKeyList);
    }
    
    protected function getTestConjugatedVerb()
    {
        $sXmlFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_data') .
                Config::get('jsreal.test.conjugation.xml.' . $this->sLanguage);
        $sXslFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_xsl') .
                Config::get('jsreal.test.conjugation.xsl.' . $this->sLanguage);
        $sJsonConjugatedVerb = Xslt::applyXsltTemplateToXml($sXmlFileRealPath, $sXslFileRealPath);

        $aOriginalList = Conversion::getArrayFromJson($sJsonConjugatedVerb);
        
        $aProperConjugationTest = array();
        foreach($aOriginalList as $sUnit => $aInfo)
        {
            if(!empty($aInfo))
            {
                $aProperConjugationTest[$sUnit] = $aInfo;
            }
        }
        
        return $aProperConjugationTest;
    }
    
    protected function applyLexiconPatchToTestVerb(array &$aTestConjugatedVerb)
    {
        $aTenseList = array('p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'ps1', 'ps2', 
            'ps3', 'ps4', 'ps5', 'ps6', 's1', 's2', 's3', 's4', 's5', 's6', 'ip2', 
            'ip4', 'ip5', 'pr', 'pp');
        
        $sPatchFile = Config::get('path.real.root') . Config::get('path.relative.root_to_app')
                . Config::get('path.relative.app_to_data') . 
                Config::get('jsreal.lexicon.simple_nlg.patch.' . $this->sLanguage);
        $sJsonPatch = Filesystem::get($sPatchFile);
        $aPatch = Conversion::getArrayFromJson($sJsonPatch);
        
        foreach($aPatch as $sUnit => $aInfo)
        {
            if(isset($aInfo['V']))
            {
                foreach($aInfo['V'] as $sTenseAndPerson => $sConjugatedVerb)
                {
                    if(Arr::in($aTenseList, $sTenseAndPerson))
                    {
                        $aTestConjugatedVerb[$sUnit][$sTenseAndPerson] = $sConjugatedVerb;
                    }
                }
            }
        }
    }
    
    private function getPunctuation()
    {
        return array(
            ' ' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc1'))),
            '.' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            '...' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            ',' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            ';' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc2'))),
            ':' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc2'))),
            '!' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc2'))),
            '?' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc2'))),
            '-' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc1'))),
//            '-' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '-', 'tab' => array('pc7', 'pc8'))),
            '"' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '"', 'tab' => array('pc5', 'pc6'))),
            '*' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '*', 'tab' => array('pc5', 'pc6'))),
            '(' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => ')', 'tab' => array('pc5'))),
            ')' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '(', 'tab' => array('pc6'))),
            '[' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => ']', 'tab' => array('pc5'))),
            ']' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '[', 'tab' => array('pc6'))),
            '{' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '}', 'tab' => array('pc5'))),
            '}' => array(Config::get('jsreal.feature.category.word.punctuation') => array(Config::get('jsreal.feature.typography.complementary') => '{', 'tab' => array('pc6')))
//            "'" => array('tab' => array('pc5', 'pc6')),   // unused
//            '/' => array('tab' => ''),                    // unused
        );
    }
    
    private function getDateRule()
    {
        return array(
            /**
             * Y: A full numeric representation of a year, 4 digits
             * F: A full textual representation of a month, such as January or March
             * m: Numeric representation of a month, with leading zeros
             * d: Day of the month, 2 digits with leading zeros
             * j: Day of the month without leading zeros
             * l: (lowercase 'L') A full textual representation of the day of the week
             * A: Uppercase Ante meridiem and Post meridiem
             * h: 12-hour format of an hour with leading zeros
             * H: 24-hour format of an hour with leading zeros
             * i: Minutes with leading zeros
             * s: Seconds, with leading zeros
             */
            'format' => array(
                'non_natural' => array(
                    'year-month-date-day' => '[d]/[m]/[Y]',
                    'year-month-date' => '[d]/[m]/[Y]',
                    'year-month' => '[m]/[Y]',
                    'month-date' => '[d]/[m]',
                    'month-date-day' => '[d]/[m]',
                    'year' => '[Y]',
                    'month' => '[m]',
                    'date' => '[d]',
                    'day' => '[d]',
                    'hour:minute:second' => '[H]:[i]:[s]',
                    'hour:minute' => '[H]:[i]',
                    'minute:second' => '[i]:[s]',
                    'hour' => '[H]',
                    'minute' => '[i]',
                    'second' => '[s]'
                ),
                'natural' => array(
                    'year-month-date-day' => 'le [l] [j] [F] [Y]',
                    'year-month-date' => 'le [j] [F] [Y]',
                    'year-month' => 'en [F] [Y]',
                    'month-date' => 'le [j] [F]',
                    'month-date-day' => 'le [l] [j] [F]',
                    'year' => 'en [Y]',
                    'month' => 'en [F]',
                    'date' => 'le [j]',
                    'day' => 'le [l]',
                    'hour:minute:second' => 'à [H]h [i]min [s]s',
                    'hour:minute' => 'à [H]h[i]',
                    'minute:second' => 'à [i]min [s]s',
                    'hour' => 'à [H]h',
                    'minute' => 'à [i]min',
                    'second' => 'à [s]s'
                ),
                'relative_time' => array(
                    '-' => 'il y a [x] jours',
                    '-6' => '[l] dernier',
                    '-5' => '[l] dernier',
                    '-4' => '[l] dernier',
                    '-3' => '[l] dernier',
                    '-2' => 'avant-hier',
                    '-1' => 'hier',
                    '0' => 'aujourd\'hui',
                    '1' => 'demain',
                    '2' => 'après-demain',
                    '3' => '[l] prochain',
                    '4' => '[l] prochain',
                    '5' => '[l] prochain',
                    '6' => '[l] prochain',
                    '+' => 'dans [x] jours'
                )
            ),
            'text' => array(
                'weekday' => array(
                    0 => 'dimanche',
                    1 => 'lundi',
                    2 => 'mardi',
                    3 => 'mercredi',
                    4 => 'jeudi',
                    5 => 'vendredi',
                    6 => 'samedi'
                ),
                'month' => array(
                    1 => 'janvier',
                    2 => 'février',
                    3 => 'mars',
                    4 => 'avril',
                    5 => 'mai',
                    6 => 'juin',
                    7 => 'juillet',
                    8 => 'août',
                    9 => 'septembre',
                    10 => 'octobre',
                    11 => 'novembre',
                    12 => 'décembre'
                )
            )
        );
    }
    
    private function getNumberRule()
    {
        return array(
            'symbol' => array(
                'group' => ' ',
                'decimal' => ','
            ),
            'number' => array(
                0 => 'zéro'
            )
        );
    }
}