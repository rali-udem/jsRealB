<?php

/**
 * Description of DmFormatter
 *
 * @author molinspa
 */
class DmFormatter
{
    private $aRawRuleList;
    private $oDmConverter;
    
    public function __construct($aRawRuleList, $oDmConverter = null)
    {
        $this->aRawRuleList = $aRawRuleList;
        $this->oDmConverter = $oDmConverter;
    }
    
    public function getConjugationTable()
    {
        $aFormatedRule = array();
        
        $sFeatureTense = Config::get('jsreal.feature.tense.alias');
        $sFeaturePerson = Config::get('jsreal.feature.person.alias');
        $sFeatureNumber = Config::get('jsreal.feature.number.alias');
        $sFeatureNumberPlural = Config::get('jsreal.feature.number.plural');
        
        $aAutocompletedTense = array();
        foreach($this->aRawRuleList as $aRawRule)
        {
            $sTableId = $aRawRule[0];
            $sEnding = $aRawRule[1];
            $aConjugationList = array();
            for($i = 2, $iLength1 = count($aRawRule); $i < $iLength1; $i++)
            {            
                $sConjugation = $aRawRule[$i][($j = 0)];
                
                $aInformation = array();
                for($j = 1, $iLength2 = count($aRawRule[$i]); $j < $iLength2; $j++)
                {
                    $aInformation[$this->oDmConverter->getClassName($aRawRule[$i][$j])]
                        = $this->oDmConverter->getProperName($aRawRule[$i][$j]);
                }

                if(isset($aInformation[$sFeatureTense]))
                {
                    if(isset($aInformation[$sFeaturePerson]) && !empty($aInformation[$sFeaturePerson]))
                    {
                        if(empty($aConjugationList[$aInformation[$sFeatureTense]]))
                        {
                            $aConjugationList[$aInformation[$sFeatureTense]] = array('', '', '', '', '', '');
//                            $aConjugationList[$aInformation[$sFeatureTense]] = 
//                                    array($sEnding, $sEnding, $sEnding, $sEnding, $sEnding, $sEnding, );

                            $aAutocompletedTense[] = $aInformation[$sFeatureTense];
                        }
                        
                        if(isset($aInformation[$sFeatureNumber]) && !empty($aInformation[$sFeatureNumber]))
                        {
                            $iPosition = ($aInformation[$sFeatureNumber] === $sFeatureNumberPlural) 
                                    ? $aInformation[$sFeaturePerson] + 3 : $aInformation[$sFeaturePerson];
                            if(empty($aConjugationList[$aInformation[$sFeatureTense]][$iPosition - 1]))
                                $aConjugationList[$aInformation[$sFeatureTense]][$iPosition - 1] = $sConjugation;
                        }
                        else
                        {
                            if(empty($aConjugationList[$aInformation[$sFeatureTense]][(($aInformation[$sFeaturePerson] + 3) - 1)]))
                                $aConjugationList[$aInformation[$sFeatureTense]][(($aInformation[$sFeaturePerson] + 3) - 1)] = $sConjugation;
                            
                            if(empty($aConjugationList[$aInformation[$sFeatureTense]][($aInformation[$sFeaturePerson] - 1)]))
                                $aConjugationList[$aInformation[$sFeatureTense]][($aInformation[$sFeaturePerson] - 1)] = $sConjugation;
                        }
                    }
                    else
                    {
                        if(!isset($aConjugationList[$aInformation[$sFeatureTense]]))
                            $aConjugationList[$aInformation[$sFeatureTense]] = $sConjugation;
                    }
                }
            }
            
            // Pour compléter avec les terminaisons régulières
            foreach($aConjugationList as $sTense => $aTenseConjugation)
            {
                if(Arr::isValid($aTenseConjugation) && Arr::in($aAutocompletedTense, $sTense))
                {
                    foreach($aTenseConjugation as $iIndex => $sCurrentConjugation)
                    {
                        if(empty($sCurrentConjugation))
                        {
                            $aConjugationList[$sTense][$iIndex] = $sEnding;
                        }
                    }
                }
            }
            
            $aFormatedRule[$sTableId] = array(
                'ending' => $sEnding,
                $sFeatureTense => $aConjugationList
            );
        }
        
        return $aFormatedRule;
    }
    
    public function getRuleTable($sRuleOptionName = 'option')
    {
        $aFormatedRule = array();
        
        foreach($this->aRawRuleList as $aRawRule)
        {
            $sTableId = $aRawRule[0];
            $sEnding = $aRawRule[1];
            $aDeclensionList = array();
            $sPreviousOption = '';
            $sCurrentOption = '';
            for($i = 2, $iLength1 = count($aRawRule); $i < $iLength1; $i++)
            {
                $sValue = $aRawRule[$i][0];
                $aOptionList = array('val' => $sValue);
                $sCurrentOption = Conversion::getJsonFromArray($aOptionList);
                for($j = 1, $iLength2 = count($aRawRule[$i]); $j < $iLength2; $j++)
                {
                    $sInformation = $aRawRule[$i][$j];
                    
                    $sFeatureClass = $this->oDmConverter->getClassName($sInformation);
                    
                    if(!is_null($sFeatureClass) && !empty($sFeatureClass))
                    {
                        $sFeatureValue = $this->oDmConverter->getProperName($sInformation);
                        $aOptionList[$sFeatureClass] = $sFeatureValue;
                        $sCurrentOption .= $sFeatureClass . $sFeatureValue;
                    }
                    else
                    {
                        echo 'Traduction manquante : '; // DEBUG ONLY
                        var_dump($sInformation);
                        echo '<br />';
//                        die;
                    }
                }
                
                if(
//                    count($aRawRule[$i]) > 1 // Only if there has features
//                    && 
                    $sPreviousOption !== $sCurrentOption) // Only the first option
                {
                    $aDeclensionList[] = $aOptionList;
                    
                    $sPreviousOption = $sCurrentOption;
                }
            }
            
            $aFormatedRule[$sTableId] = array(
                'ending' => $sEnding,
                $sRuleOptionName => $aDeclensionList
            );
        }
        
        return $aFormatedRule;
    }
    
//    public function getDeclensionTable()
//    {
//        $aFormatedRule = array();
//        
//        foreach($this->aRawRuleList as $aRawRule)
//        {
//            $sTableId = $aRawRule[0];
//            $sEnding = $aRawRule[1];
//            $aDeclensionList = array();
//            for($i = 2, $iLength1 = count($aRawRule); $i < $iLength1; $i++)
//            {
//                $sValue = $aRawRule[$i][0];
//                $sGrammaticalGender = '';
//                $sGrammaticalNumber = null;
//                for($j = 1, $iLength2 = count($aRawRule[$i]); $j < $iLength2; $j++)
//                {
//                    $sInformation = $aRawRule[$i][$j];
//                    if($sInformation === 'femi' || $sInformation === 'masc')
//                    {
//                        $sGrammaticalGender = $sInformation;
//                    }
//                    else if($sInformation === 'sing' || $sInformation === 'plur')
//                    {
//                        $sGrammaticalNumber = $sInformation;
//                    }
//                }
//                
//                if(!is_null($sGrammaticalNumber))
//                {
//                    $sGenderShortForm = !empty($sGrammaticalGender) ? substr($sGrammaticalGender, 0, 1) : $sGrammaticalGender;
//                    $sNumberShortForm = !empty($sGrammaticalNumber) ? substr($sGrammaticalNumber, 0, 1) : $sGrammaticalNumber;
//                    $aDeclensionList[$sGenderShortForm . $sNumberShortForm] = $sValue;
//                }
//                
//                // Merge ms and fs or mp and fp if equal
//                if(isset($aDeclensionList['ms'])
//                        && isset($aDeclensionList['fs'])
//                        && $aDeclensionList['ms'] === $aDeclensionList['fs'])
//                {
//                    $aDeclensionList['s'] = $aDeclensionList['ms'];
//                    unset($aDeclensionList['ms']);
//                    unset($aDeclensionList['fs']);
//                }
//                else if(isset($aDeclensionList['mp'])
//                        && isset($aDeclensionList['fp'])
//                        && $aDeclensionList['mp'] === $aDeclensionList['fp'])
//                {
//                    $aDeclensionList['p'] = $aDeclensionList['mp'];
//                    unset($aDeclensionList['mp']);
//                    unset($aDeclensionList['fp']);
//                }
//            }
//            
//            $aFormatedRule[$sTableId] = array(
//                'ending' => $sEnding,
//                'declension' => $aDeclensionList
//            );
//        }
//        
//        return $aFormatedRule;
//    }
    
//    public function getTableId()
//    {
//        $aFormatedRule = array();
//        
//        foreach($this->aRawRuleList as $aRawRule)
//        {
//            $sUnit = $aRawRule[0];
//            $sTableId = $aRawRule[1];
//            $sRawCategory = $aRawRule[2];
//            // 3, 4, 5... Additional Information
//            
//            if(Arr::in(array('NomC', 'AdjQ', 'Ordi'), $sRawCategory))
//            {
//                $sCategoryName = null;
//                switch($sRawCategory)
//                {
//                    case 'NomC':
//                        $sCategoryName = 'N';
//                        break;
//                    case 'AdjQ':
//                        $sCategoryName = 'A';
//                        break;
////                    case 'Ordi':
////                        $sCategoryName = '';
////                        break;
//                }
//                
//                if(!empty($sCategoryName))
//                {
//                    $aFormatedRule[$sUnit][$sCategoryName][] = $sTableId;
//                }
//            }
//        }
//        
//        return $aFormatedRule;
//    }
    
    public function getLexicon($aAllowedCategoryList = null)
    {
        $aFormatedRule = array();
        
        foreach($this->aRawRuleList as $aRawRule)
        {
            $sUnit = $aRawRule[0];
            $sTableId = $aRawRule[1];
            $sCategory = $this->oDmConverter->getProperName($aRawRule[2]);
            
//            if(!isset($aFormatedRule[$sUnit]))
//            {
//                // Additional Information
//                $aFormatedRule[$sUnit] = array();
//                for($i = 2, $iLength = count($aRawRule); $i < $iLength; $i++)
//                {
//                    $aFormatedRule[$sUnit][$this->oDmConverter->getClassName($aRawRule[$i])] 
//                            = $this->oDmConverter->getProperName($aRawRule[$i]);
//                }
//                
//                if($aAllowedCategoryList !== null
//                        && !Arr::in($aAllowedCategoryList, 
//                                $aFormatedRule[$sUnit][Config::get('jsreal.feature.category.alias')]))
//                {
//                    unset($aFormatedRule[$sUnit]);
//                }
//                else
//                {
//                    $aFormatedRule[$sUnit]['tab'][] = $sTableId;
//                }
//            }
//            if($aAllowedCategoryList !== null)
//            {
//                Util::var_dump($sCategory);die;
//            }
            
            if($aAllowedCategoryList === null || Arr::in($aAllowedCategoryList, $sCategory))
            {
                // Additional Information
                if(!isset($aFormatedRule[$sUnit]))
                {
                    $aFormatedRule[$sUnit] = array();
                }
                
                for($i = 2, $iLength = count($aRawRule); $i < $iLength; $i++)
                {
                    if(!isset($aFormatedRule[$sUnit][$this->oDmConverter->getClassName($aRawRule[$i])]))
                    {
                        $aFormatedRule[$sUnit][$this->oDmConverter->getClassName($aRawRule[$i])] 
                            = $this->oDmConverter->getProperName($aRawRule[$i]);
                    }
                }
                
                $aFormatedRule[$sUnit]['tab'][] = $sTableId;
            }
        }
        
        return $aFormatedRule;
    }
}