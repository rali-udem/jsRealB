<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : conjugation-testing.xsl
    Created on : 27 mars 2015, 10:35
    Author     : molinspa
    Description:
        Test data for JSrealV2
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
    
    <rali:ts_tag>
        <entry src="feminine_singular">fs</entry>
        <entry src="feminine_plural">fp</entry>
        <entry src="plural">p</entry>
    </rali:ts_tag>
    
    <xsl:template match="lexicon">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="word[category='noun' or category='adjective']" />
        <xsl:text>}</xsl:text>
    </xsl:template>
    
    <xsl:template match="word">
        <xsl:text>"</xsl:text>
            <xsl:value-of select="base" />
        <xsl:text>": {</xsl:text>
        
        <xsl:variable name="declensions">
        <xsl:for-each select="child::*">
            <xsl:if test="count(document('')/*/rali:ts_tag/entry[@src=name(current())]) > 0">
                <xsl:text>"</xsl:text>
                <xsl:value-of select="document('')/*/rali:ts_tag/entry[@src=name(current())]"/>
                <xsl:text>": </xsl:text>
                <xsl:text>"</xsl:text>
                <xsl:value-of select="current()"/>
                <xsl:text>",</xsl:text>
            </xsl:if>
        </xsl:for-each>
        </xsl:variable>
        
        <xsl:value-of select="substring($declensions, 1, string-length($declensions)-1)"/>
        
        <xsl:text>}</xsl:text>
        <xsl:if test="position() &lt; last()">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>