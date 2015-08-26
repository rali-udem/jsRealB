<?php

/**
 * Description of Xslt
 *
 * @author molinspa
 */
class Xslt
{
    public static function applyXsltTemplateToXml($sXmlFileRealPath, $sXslFileRealPath, 
            array $aParameterList = array())
    {
        $xsldoc = new DOMDocument();
        $xsldoc->load($sXslFileRealPath);

        $xmldoc = new DOMDocument();
        $xmldoc->load($sXmlFileRealPath);

        $xsl = new XSLTProcessor();
        $xsl->importStyleSheet($xsldoc);

        foreach($aParameterList as $sName => $uValue)
        {
            $xsl->setParameter(null, $sName, $uValue);
        }
        
        return $xsl->transformToXML($xmldoc);  
    }
}