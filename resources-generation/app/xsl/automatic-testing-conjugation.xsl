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
        <!-- Common -->
        <entry src="present3s">p3</entry>
        <entry src="pastParticiple">pp</entry>
        <entry src="presentParticiple">pr</entry>
        
        <!-- French Only -->
        <entry src="present1s">p1</entry>
        <entry src="present2s">p2</entry>
        <entry src="present1p">p4</entry>
        <entry src="present2p">p5</entry>
        <entry src="present3p">p6</entry>
        <entry src="imperative2s">ip2</entry>
        <entry src="imperative1p">ip4</entry>
        <entry src="imperative2p">ip5</entry>
        <!--<entry src="future_radical">fr</entry>-->
        <!--<entry src="imparfait_radical">ir</entry>-->
        <entry src="subjunctive1s">s1</entry>
        <entry src="subjunctive2s">s2</entry>
        <entry src="subjunctive3s">s3</entry>
        <entry src="subjunctive1p">s4</entry>
        <entry src="subjunctive2p">s5</entry>
        <entry src="subjunctive3p">s6</entry>
    </rali:ts_tag>
    
    <xsl:template match="lexicon">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="word[category='verb']" />
        <xsl:text>}</xsl:text>
    </xsl:template>
    
    <xsl:template match="word">
        <xsl:text>"</xsl:text>
            <xsl:value-of select="base" />
        <xsl:text>": {</xsl:text>
        
        <xsl:variable name="conjugations">
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
        
        <xsl:value-of select="substring($conjugations, 1, string-length($conjugations)-1)"/>
        
        <xsl:text>}</xsl:text>
        <xsl:if test="position() &lt; last()">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
