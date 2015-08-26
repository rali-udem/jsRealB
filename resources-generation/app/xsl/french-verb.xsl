<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : french-verb.xsl
    Created on : 23 mars 2015, 14:20
    Author     : molinspa
    Description:
        french-verb.xml to json key/value
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:rali="jsreal.rali.iro.umontreal.ca" 
    exclude-result-prefixes="rali"
    version="1.0">
    
    <xsl:output method="text"
        version="1.0"
        encoding="utf-8"
        omit-xml-declaration="yes"
        standalone="no"
        cdata-section-elements="namelist"
        indent="yes"
        media-type="application/json" />

    <xsl:template match="verbs-fr">
        <xsl:text>{</xsl:text>
            <xsl:apply-templates />
        <xsl:text>}</xsl:text>
    </xsl:template>

    <xsl:template match="v">
        <xsl:text>"</xsl:text>
            <xsl:value-of select="i" />
        <xsl:text>": "</xsl:text>
            <xsl:value-of select="t" />
        <xsl:text>"</xsl:text>
        
        <xsl:if test="position() &lt; last()-1">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>
