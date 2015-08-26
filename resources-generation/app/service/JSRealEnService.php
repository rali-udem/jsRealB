<?php

/**
 * Description of JSRealEnService
 *
 * @author molinspa
 */
class JSRealEnService extends JSRealService
{
    public function __construct($sLanguage)
    {
        parent::__construct($sLanguage);
    }
    
    public function export()
    {
        /// Lexicon
        $aPunctuation = $this->getPunctuation();
        $aRefLexicon = $this->getLexicon();
//        Util::var_dump($aRefLexicon);die;
        
        /// Get Additional Information
        $aVerbList = $this->getDmLexicon('; Verbs', '; Adjectives:');
        
        $aNounList = $this->getDmLexicon('; Nouns:', '; Verbs:');
        $aAdjectiveList = $this->getDmLexicon('; Adjectives:', '; Adverbs:');
        $aPronounList = $this->getDmLexicon('; Pronouns:', '; Determiners:');
        $aDeterminerList = $this->getDmLexicon('; Determiners:', '; END');
        
        $aAdverbList = $this->getDmLexicon('; Adverbs:', '; Interjections:');
        $aPrepositionList = $this->getDmLexicon('; Prepositions:', '; Subordonate conjunction:');
//        Util::var_dump($aPrepositionList);die;

        /// Upgrade Lexicon
        $this->addTableIdToVerb($aVerbList, $aRefLexicon); // Verb Only
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
                $aRefLexicon);
//        Util::var_dump($aRefLexicon); die;
        
        /// Test
        $aTestConjugatedVerb = $this->getTestConjugation($aRefLexicon);
        $aTestDeclension = $this->getTestDeclension($aRefLexicon);
//        Util::var_dump($aRefLexicon); die;
//        Util::var_dump($aTestDeclension); die;
        
        $aTest = array();
        $aTest['conjugation'] = $aTestConjugatedVerb;
        $aTest['declension'] = $aTestDeclension;
        
//        /// Remove unuse information
        $this->removeConjugationInLexicon($aRefLexicon);
        $this->removeInflexionInLexicon($aRefLexicon);
        $this->removeEnglishPropertiesInLexicon($aRefLexicon);
        
        /// Create Rules Table
        $aNounDeclension = $this->getDmApplyRule('; Nouns rules:', '; verb rules:', 'declension');
        $aAdjectiveDeclension = $this->getDmApplyRule('; Adjective rules:', '; Determiners rules:', 'declension');
        $aPronounDeclension = $this->getDmApplyRule('; Pronouns rules:', '; Prepositions rules:', 'declension');
        $aDeterminerDeclension = $this->getDmApplyRule('; Determiners rules:', '; Pronouns rules:', 'declension');
        $aAdverbRule = $this->getDmApplyRule('; Adverbs rules:', '; Quantifiers rules', 'declension');
        $aPrepositionRule = $this->getDmApplyRule('; Prepositions rules:', '; Adverbs rules:', 'option');
        $aConjugationRule = $this->getDmConjugation('; verb rules:', '; Adjective rules:');
        $aPunctuationRule = $this->getPunctuationRule();
        
        $aRuleTable = array();
        $aRuleTable['conjugation'] = $aConjugationRule;
        $aRuleTable['declension'] = array_merge(
                $aNounDeclension, 
                $aAdjectiveDeclension,
                $aPronounDeclension,
                $aDeterminerDeclension,
                $aAdverbRule
            );
        $aRuleTable['punctuation'] = $aPunctuationRule;
        $aRuleTable['regular'] = array_merge(
                $aPrepositionRule
            );
        $aRuleTable['date'] = $this->getDateRule();
        $aRuleTable['number'] = $this->getNumberRule();

        /// Export to files
        $aExportedFile = array_merge(
                $this->exportLexicon(array_merge($aPunctuation, $aRefLexicon)),
                $this->exportRuleTable($aRuleTable),
                $this->exportTest($aTest),
                $this->exportDmFeature()
            );
        
        return $aExportedFile;
    }
    
    private function removeEnglishPropertiesInLexicon(array &$aLexicon)
    {
        $aForbiddenKeyList = array('di', 't', 'pr', 'q', 'in', 'vm', 'cl', 'it', 
            'nco', 'sm', 'ps', 'col', 'pro', 'irr', '', '');
        
        $this->removeKeyListInLexicon($aLexicon, $aForbiddenKeyList);
    }
    
    private function getPunctuation()
    {
        return array(
            ' ' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc1'))),
            '.' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            '...' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            ',' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            ';' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            ':' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            '!' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
            '?' => array(Config::get('jsreal.feature.category.word.punctuation') => array('tab' => array('pc4'))),
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
                    'year-month-date-day' => '[m]/[d]/[Y]',
                    'year-month-date' => '[m]/[d]/[Y]',
                    'year-month' => '[m]/[Y]',
                    'month-date' => '[m]/[d]',
                    'month-date-day' => '[m]/[d]',
                    'year' => '[Y]',
                    'month' => '[m]',
                    'date' => '[d]',
                    'day' => '[d]',
                    'hour:minute:second' => '[h]:[i]:[s] [A]',
                    'hour:minute' => '[h]:[i] [A]',
                    'minute:second' => '[i]:[s]',
                    'hour' => '[h] [A]',
                    'minute' => '[i]',
                    'second' => '[s]'
                ),
                'natural' => array(
                    'year-month-date-day' => 'on [l], [F] [j], [Y]',
                    'year-month-date' => 'on [F] [j], [Y]',
                    'year-month' => 'on [F] [Y]',
                    'month-date' => 'on [F] [j]',
                    'month-date-day' => 'on [l], [F] [j]',
                    'year' => 'on [Y]',
                    'month' => 'on [F]',
                    'date' => 'on [j]',
                    'day' => 'on [l]',
                    'hour:minute:second' => 'at [h]:[i]:[s] [A]',
                    'hour:minute' => 'at [h]:[i] [A]',
                    'minute:second' => 'at [i]:[s] [A]',
                    'hour' => 'at [h] [A]',
                    'minute' => 'at [i]min',
                    'second' => 'at [s]s'
                ),
                'relative_time' => array(
                    '-' => '[x] days ago',
                    '-6' => 'last [l]',
                    '-5' => 'last [l]',
                    '-4' => 'last [l]',
                    '-3' => 'last [l]',
                    '-2' => 'last [l]',
                    '-1' => 'yesterday',
                    '0' => 'today',
                    '1' => 'tomorrow',
                    '2' => 'next [l]',
                    '3' => 'next [l]',
                    '4' => 'next [l]',
                    '5' => 'next [l]',
                    '6' => 'next [l]',
                    '+' => 'in [x] days'
                )
            ),
            'text' => array(
                'weekday' => array(
                    0 => 'Sunday',
                    1 => 'Monday',
                    2 => 'Tuesday',
                    3 => 'Wednesday',
                    4 => 'Thursday',
                    5 => 'Friday',
                    6 => 'Saturday'
                ),
                'month' => array(
                    1 => 'January',
                    2 => 'February',
                    3 => 'March',
                    4 => 'April',
                    5 => 'May',
                    6 => 'June',
                    7 => 'July',
                    8 => 'August',
                    9 => 'September',
                    10 => 'October',
                    11 => 'November',
                    12 => 'December',
                ),
                'meridiem' => array(
                    0 => 'AM',
                    1 => 'PM'
                )
            )
        );
    }
    
    private function getNumberRule()
    {
        return array(
            'symbol' => array(
                'group' => ',',
                'decimal' => '.'
            ),
            'number' => array(
                0 => 'zero'
            )
        );
    }
}