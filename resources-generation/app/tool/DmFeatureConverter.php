<?php

/**
 * Description of DmFeatureConverter
 *
 * @author molinspa
 */
class DmFeatureConverter
{
    private $aDmDictionary = array();
    private $aDmFeature = array();
    private $aDmTranslation = array();
    
    public function __construct($sFileRealPath)
    {
        if(Filesystem::isFile($sFileRealPath))
        {
            $this->aDmDictionary = require $sFileRealPath;
        
            foreach($this->aDmDictionary as $sCategory => $aFeatureList)
            {
                foreach($aFeatureList as $sDmFeature => $sDmFeatureTranslation)
                {
                    $this->aDmFeature[$sDmFeature] = $sCategory;
                    
                    if(!Number::isValid($sDmFeature))
                    {
                        $this->aDmTranslation[$sDmFeature] = $sDmFeatureTranslation;
                    }
                }
            }
        }
    }
    
    public function getClassName($sFeatureName)
    {
        $sClassName = null;
        if(isset($this->aDmFeature[$sFeatureName]))
        {
            $sClassName = $this->aDmFeature[$sFeatureName];
        }
            
        return $sClassName;
    }
    
    public function getProperName($sFeatureName)
    {
        $sProperName = $sFeatureName;
        if(isset($this->aDmTranslation[$sFeatureName]) && !empty($this->aDmTranslation[$sFeatureName]))
        {
            $sProperName = $this->aDmTranslation[$sFeatureName];
        }
            
        return $sProperName;
    }
}