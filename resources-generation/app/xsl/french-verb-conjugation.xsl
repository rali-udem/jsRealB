<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : french-verb-conjugation.xsl
    Created on : 23 mars 2015, 15:28
    Author     : molinspa
    Description:
        french-verb.xml to json tables
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
    
    <rali:ts_conjugation>
        <entry mood="indicative" tense="present">p</entry>
        <entry mood="indicative" tense="imperfect">i</entry>
        <entry mood="indicative" tense="future">f</entry>
        <entry mood="indicative" tense="simple-past">ps</entry>
        <entry mood="conditional" tense="present">c</entry>
        <entry mood="subjunctive" tense="present">s</entry>
        <entry mood="subjunctive" tense="imperfect">si</entry>
        <entry mood="imperative" tense="imperative-present">ip</entry>
        <entry mood="participle" tense="present-participle">pr</entry>
        <entry mood="participle" tense="past-participle">pp</entry>
    </rali:ts_conjugation>
    
    <!-- Apply verb templates -->
    <xsl:template match="conjugation-fr">
        <xsl:variable name="content">
            <xsl:apply-templates />
        </xsl:variable>
        
        <xsl:text>{</xsl:text>
        <xsl:value-of select="$content"/>
        <xsl:text>}</xsl:text>
    </xsl:template>

    <!-- Verb -->
    <xsl:template match="template">
        <xsl:text>"</xsl:text>
        <xsl:value-of select="@name"/>
        <xsl:text>": </xsl:text>
        
        <xsl:text>{</xsl:text>
        <xsl:call-template name="ending" />
        <xsl:call-template name="mood" />
        <xsl:text>}</xsl:text>
        
        <xsl:if test="position() &lt; last()-1">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>
    
    <!-- Infinitive ending -->
    <xsl:template name="ending">
        <xsl:text>"ending": </xsl:text>
        
        <xsl:text>"</xsl:text>
        <xsl:value-of select="infinitive/infinitive-present/p/i[1]"/>
        <xsl:text>",</xsl:text>
    </xsl:template>
    
    <!-- Apply Mood templates -->
    <xsl:template name="mood">
        <xsl:text>"t": {</xsl:text>
        <xsl:apply-templates select="child::*[name(.)!='infinitive']" />
        <xsl:text>}</xsl:text>
    </xsl:template>
    
    <!-- Mood -->
    <xsl:template match="template/*">
        <xsl:apply-templates>
            <xsl:with-param name="last_mood" select="position() = last()" />
            <xsl:with-param name="mood" select="name(.)" />
        </xsl:apply-templates>
    </xsl:template>
    
    <!-- Tense -->
    <xsl:template match="template/*/*">
        <xsl:param name="last_mood" />
        <xsl:param name="mood" />
        <xsl:variable name="tense" select="name(.)" />
        
        <xsl:text>"</xsl:text>
        <xsl:value-of select="document('')/*/rali:ts_conjugation/entry[@mood=$mood and @tense=$tense]" />
        <xsl:text>": </xsl:text>
        
        <xsl:choose>
            <xsl:when test="$tense = 'imperative-present'">
                <xsl:text>[null,</xsl:text>
                    <xsl:apply-templates select="p[1]" />
                <xsl:text>,null,</xsl:text>
                    <xsl:apply-templates select="p[2]" />
                <xsl:text>,</xsl:text>
                    <xsl:apply-templates select="p[3]" />
                <xsl:text>,null]</xsl:text>
            </xsl:when>
            <!-- Nous ne voulons pas les terminaisons au feminin/pluriel -->
            <xsl:when test="count(p) = 1 or ($mood = 'participle' and $tense = 'past-participle')">
                <xsl:apply-templates select="p[1]" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:text>[</xsl:text>
                    <xsl:apply-templates select="p" />
                <xsl:text>]</xsl:text>
            </xsl:otherwise>
        </xsl:choose>
        
        <xsl:if test="$last_mood = false() or position() &lt; last()-1">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>
    
    <!-- Conjugation -->
    <xsl:template match="p">
        <xsl:choose>
            <xsl:when test="count(i) = 0">
                <xsl:text>null</xsl:text>
            </xsl:when>
            <xsl:otherwise>
                <xsl:text>"</xsl:text>
                <xsl:value-of select="i[1]" />
                <xsl:text>"</xsl:text>
            </xsl:otherwise>
        </xsl:choose>
        
        <xsl:if test="position() &lt; last()">
            <xsl:text>,</xsl:text>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>
