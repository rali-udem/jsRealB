<?php

/**
 * Description of JSRealLexiconService
 *
 * @author molinspa
 */
class JSRealService extends BaseService
{
    protected $sLanguage;
    protected $sDmFile;
    protected $oDmConverter;
    
    public function __construct($sLanguage)
    {
        $this->sLanguage = $sLanguage;
        
        $this->sDmFile = Config::get('path.real.root')
                . Config::get('path.relative.root_to_app')
                . Config::get('path.relative.app_to_data') . 
                Config::get('jsreal.lexicon.dm.file.' . $this->sLanguage);
        
        $sDmDictionary = Config::get('path.real.root')
                . Config::get('path.relative.root_to_app')
                . Config::get('path.relative.app_to_data') . 
                Config::get('jsreal.lexicon.dm.dictionary');

        $this->oDmConverter = new DmFeatureConverter($sDmDictionary);
    }
    
    protected function getLexicon()
    {
        $sXmlFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_data') .
                Config::get('jsreal.lexicon.simple_nlg.xml.' . $this->sLanguage);
        $sXslFileRealPath = Config::get('path.real.root') .
                Config::get('path.relative.root_to_app') .
                Config::get('path.relative.app_to_xsl') .
                Config::get('jsreal.lexicon.simple_nlg.xsl');
        $sJsonLexicon = Xslt::applyXsltTemplateToXml($sXmlFileRealPath, $sXslFileRealPath);

        return Conversion::getArrayFromJson($sJsonLexicon);
    }
    
    protected function applyLexiconPatch(array &$aLexicon)
    {
        $sPatchFile = Config::get('path.real.root') . Config::get('path.relative.root_to_app')
                . Config::get('path.relative.app_to_data') . 
                Config::get('jsreal.lexicon.simple_nlg.patch.' . $this->sLanguage);
        $sJsonPatch = Filesystem::get($sPatchFile);
        $aPatch = Conversion::getArrayFromJson($sJsonPatch);
        
        $aLexicon = array_replace_recursive($aLexicon, $aPatch);
    }
    
    protected function extendLexicon(array &$aLexicon)
    {
        $sPatchFile = Config::get('path.real.root') . Config::get('path.relative.root_to_app')
                . Config::get('path.relative.app_to_data') . 
                Config::get('jsreal.lexicon.simple_nlg.extension.' . $this->sLanguage);
        $sJsonExtension = Filesystem::get($sPatchFile);
        $aExtension = Conversion::getArrayFromJson($sJsonExtension);
        
        $aLexicon = array_merge_recursive($aLexicon, $aExtension);
    }
    
    protected function removeKeyListInLexicon(array &$aLexicon, $aKeyList)
    {
        $aNewLexicon = array();
        foreach($aLexicon as $sUnit => $aValueList)
        {
            foreach($aValueList as $i => $aCategory)
            {
                foreach($aCategory as $sKey => $uValue)
                {
                    if(!Arr::in($aKeyList, $sKey))
                    {
                        $aNewLexicon[$sUnit][$i][$sKey] = $uValue;
                    }
                }
            }
        }
        $aLexicon = $aNewLexicon;
    }
    
    protected function removeConjugationInLexicon(array &$aLexicon)
    {
        $aForbiddenKeyList = array('p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'ps1', 'ps2', 
            'ps3', 'ps4', 'ps5', 'ps6', 's1', 's2', 's3', 's4', 's5', 's6', 'ip2', 
            'ip4', 'ip5', 'pr', 'pp', 'fr', 'ir', 'pf');
        
        $this->removeKeyListInLexicon($aLexicon, $aForbiddenKeyList);
    }
    
    protected function removeInflexionInLexicon(array &$aLexicon)
    {
        $aForbiddenKeyList = array('fs', 'fp', 'p', 'og', 'co', 'su');
        
        $this->removeKeyListInLexicon($aLexicon, $aForbiddenKeyList);
    }

    protected function getDmApplyRule($sStart, $sEnd, $sOptionName)
    {
        $oDmParser = new DmParser($this->sDmFile, $sStart, $sEnd);
        $aRawRuleList = $oDmParser->run();
        
        $oDmFormatter = new DmFormatter($aRawRuleList, $this->oDmConverter);
        $aDmDeclensionTable = $oDmFormatter->getRuleTable($sOptionName);
        
        return $aDmDeclensionTable;
    }
    
    protected function getDmConjugation($sStart, $sEnd)
    {
        $oDmParser = new DmParser($this->sDmFile, $sStart, $sEnd);
        $aDmRawLexicon = $oDmParser->run();
        
        $oDmFormatter = new DmFormatter($aDmRawLexicon, $this->oDmConverter);
        $aDmConjugationTable = $oDmFormatter->getConjugationTable();
        
        return $aDmConjugationTable;
    }
    
    protected function getDmLexicon($sStart, $sEnd, $aAllowedCategoryList = null)
    {
        $oDmParser = new DmParser($this->sDmFile, $sStart, $sEnd);
        $aDmRawLexicon = $oDmParser->run();
        
        $oDmFormatter = new DmFormatter($aDmRawLexicon, $this->oDmConverter);
        $aDmLexicon = $oDmFormatter->getLexicon($aAllowedCategoryList);
        
        return $aDmLexicon;
    }
    
    protected function getPunctuationRule()
    {
        return array(
            'pc1' => array(
                Config::get('jsreal.feature.typography.before') => '',
                Config::get('jsreal.feature.typography.after') => ''
            ),
            'pc2' => array(
                Config::get('jsreal.feature.typography.before') => ' ',
                Config::get('jsreal.feature.typography.after') => ' '
            ),
            'pc3' => array(
                Config::get('jsreal.feature.typography.before') => ' ',
                Config::get('jsreal.feature.typography.after') => ''
            ),
            'pc4' => array(
                Config::get('jsreal.feature.typography.before') => '',
                Config::get('jsreal.feature.typography.after') => ' '
            ),
            'pc5' => array(
                Config::get('jsreal.feature.typography.before') => ' ',
                Config::get('jsreal.feature.typography.after') => '',
                Config::get('jsreal.feature.typography.position.alias') => 
                    Config::get('jsreal.feature.typography.position.left')
            ),
            'pc6' => array(
                Config::get('jsreal.feature.typography.before') => '',
                Config::get('jsreal.feature.typography.after') => ' ',
                Config::get('jsreal.feature.typography.position.alias') => 
                    Config::get('jsreal.feature.typography.position.right')
            ),
            'pc7' => array(
                Config::get('jsreal.feature.typography.before') => ' ',
                Config::get('jsreal.feature.typography.after') => ' ',
                Config::get('jsreal.feature.typography.position.alias') => 
                    Config::get('jsreal.feature.typography.position.left')
            ),
            'pc8' => array(
                Config::get('jsreal.feature.typography.before') => ' ',
                Config::get('jsreal.feature.typography.after') => ' ',
                Config::get('jsreal.feature.typography.position.alias') => 
                    Config::get('jsreal.feature.typography.position.right')
            ),
        );
    }
    
    ///
    // Update Data
    ///
    protected function addTableIdToVerb(array &$aVerbList, array &$aLexicon)
    {
        foreach($aLexicon as $sUnit => $aInfoList)
        {
            if(isset($aLexicon[$sUnit]['V']) && isset($aVerbList[$sUnit]))
            {
                // en/fr formats support
                $uVerbInfo = $aVerbList[$sUnit];
                $aLexicon[$sUnit]['V']['tab'] = (Arr::isValid($uVerbInfo) ? $uVerbInfo['tab'][0] : $uVerbInfo);
            }
        }
    }
    
    protected function addTableIdToLexicon(array &$aSpecificLexiconList, array &$aLexicon)
    {
        $aAllowedType = array_keys($aSpecificLexiconList);
        
        foreach($aLexicon as $sUnit => $aInfoList)
        {
            foreach($aInfoList as $sType => $aInfo)
            {
                if(Arr::in($aAllowedType, $sType))
                {
                    if(isset($aSpecificLexiconList[$sType][$sUnit]))
                    {
                        $aRuleTableId = $aSpecificLexiconList[$sType][$sUnit]['tab'];
                        $aLexicon[$sUnit][$sType]['tab'] = $aRuleTableId;
                    }
                    else
                    {
                        unset($aLexicon[$sUnit][$sType]);
                    }
                }
            }
            
            if(Arr::size($aLexicon[$sUnit]) === 0)
            {
                unset($aLexicon[$sUnit]);
            }
        }
    }
    
    ///
    // TEST
    ///
    protected function getTestConjugation(array &$aLexicon)
    {
        $aAllowedCategoryList = array('V');
        $aAllowedConjugationList = array('p3', 'pp', 'pr', 'ps');
        
        $aOutput = array();
        foreach($aLexicon as $sUnit => $aCategoryList)
        {
            foreach($aCategoryList as $sCategory => $aUnitInfo)
            {
                if(!empty($aUnitInfo) && Arr::in($aAllowedCategoryList, $sCategory))
                {
//                    $aOutput[$sUnit]['category'] = $sCategory;
                    
                    foreach($aUnitInfo as $sFeatureName => $aConjugation)
                    {
                        if(Arr::in($aAllowedConjugationList, $sFeatureName))
                        {
                            $aOutput[$sUnit][$sFeatureName] = $aConjugation;
                        }
                    }
                    
                    if(isset($aOutput[$sUnit]) && Arr::size($aOutput[$sUnit]) <= 1)
                    {
                        unset($aOutput[$sUnit]);
                    }
                }
            }
        }
        
        return $aOutput;
    }
    
    protected function getTestDeclension(array &$aLexicon)
    {
        $aAllowedCategoryList = array('N', 'A');
//        $aAllowedTypeList = array('N', 'A', 'D');
        $aAllowedDeclensionList = array('fs', 'fp', 'p', 'co', 'su');
        
        $aOutput = array();
        foreach($aLexicon as $sUnit => $aCategoryList)
        {
            foreach($aCategoryList as $sCategory => $aUnitInfo)
            {
                if(!empty($aUnitInfo) && Arr::in($aAllowedCategoryList, $sCategory))
                {
//                    $aOutput[$sUnit][$sCategory]['c'] = $sCategory;
                    
                    foreach($aUnitInfo as $sDeclensionName => $sDeclension)
                    {
                        if(Arr::in($aAllowedDeclensionList, $sDeclensionName))
                        {
                            if(($sDeclensionName === 's' || $sDeclensionName === 'p') 
                                    && isset($aUnitInfo['g']))
                            {
                                $sDeclensionName = $aUnitInfo['g'] . $sDeclensionName;
                            }
                            
                            $aOutput[$sUnit][$sCategory][$sDeclensionName] = $sDeclension;
                        }
                    }
                    
//                    if(Arr::size($aOutput[$sUnit]) <= 1)
//                    {
//                        unset($aOutput[$sUnit]);
//                    }
                }
            }
        }
        
        return $aOutput;
    }
    
    ///
    // EXPORT
    ///
    protected function exportLexicon(array $aLexicon)
    {
        $aExportedFile = array();
        
        $sUncompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.lexicon.public.uncompressed.' . $this->sLanguage);
        $aExportedFile['sLexiconFile'] = $this->exportToJson($sUncompressedJson, $aLexicon, false);
        
        $sCompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.lexicon.public.compressed.' . $this->sLanguage);
        $aExportedFile['sLexiconMinFile'] = $this->exportToJson($sCompressedJson, $aLexicon, true);
        
        return $aExportedFile;
    }
    
    protected function exportRuleTable(array $aRuleTable)
    {
        $aExportedFile = array();
        
        $sUncompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.rule.public.uncompressed.' . $this->sLanguage);
        $aExportedFile['sRuleFile'] = $this->exportToJson($sUncompressedJson, $aRuleTable, false);
        
        $sCompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.rule.public.compressed.' . $this->sLanguage);
        $aExportedFile['sRuleMinFile'] = $this->exportToJson($sCompressedJson, $aRuleTable, true);
        
        return $aExportedFile;
    }
    
    protected function exportTest(array $aTest)
    {
        $sUncompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_test_data') .
                Config::get('jsreal.test.public.uncompressed.' . $this->sLanguage);
        $aExportedFile['sTestFile'] = $this->exportToJson($sUncompressedJson, $aTest, false);
        
        $sCompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_test_data') .
                Config::get('jsreal.test.public.compressed.' . $this->sLanguage);
        $aExportedFile['sTestMinFile'] = $this->exportToJson($sCompressedJson, $aTest, true);
        
        return $aExportedFile;
    }
    
    protected function exportDmFeature()
    {
        $aFeature = Config::get('jsreal.feature');
        
        $sUncompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.feature_info.file.uncompressed');

        $aExportedFile['sFeatureFile'] = $this->exportToJson($sUncompressedJson, $aFeature, false);
        
        $sCompressedJson = Config::get('path.real.root') . 
                Config::get('path.relative.root_to_public_data') .
                Config::get('jsreal.feature_info.file.compressed');
        $aExportedFile['sFeatureMinFile'] = $this->exportToJson($sCompressedJson, $aFeature, true);

        return $aExportedFile;
    }
    
    private function exportToJson($sJsonFilePath, array $aData, $bCompress = false)
    {
        $sNewJsonContent = Conversion::getJsonFromArray($aData, $bCompress);
        
        if(Filesystem::put($sJsonFilePath, $sNewJsonContent) !== false)
        {
            return Filesystem::name($sJsonFilePath) . '.' . Filesystem::extension($sJsonFilePath);
        }
        else
        {
            throw new FileNotCreatedException('File : ' . $sJsonFilePath);
        }
    }
}