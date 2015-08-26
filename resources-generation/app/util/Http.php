<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Http
 *
 * @author molinspa
 */
class Http
{
    public static function getFile($sUrl)
    {
        $sContent = file_get_contents($sUrl);

        if($sContent === false)
        {
            throw new DownloadException($sUrl);
        }

        return $sContent;
    }

    public static function isHttps()
    {
        return Superglobal::isServerKey('HTTPS')
                && Superglobal::getServerValueByKey('HTTPS') != 'off';
    }

    public static function getCurrentUrl()
    {
        $url = '';

        // Check to see if it's over https
        $is_https = self::isHttps();
        if($is_https)
        {
            $url .= 'https://';
        }
        else
        {
            $url .= 'http://';
        }

        // Was a username or password passed?
        if(Superglobal::isServerKey('PHP_AUTH_USER'))
        {
            $url .= Superglobal::getServerValueByKey('PHP_AUTH_USER');

            if(Superglobal::isServerKey('PHP_AUTH_PW'))
            {
                $url .= ':' . Superglobal::getServerValueByKey('PHP_AUTH_PW');
            }

            $url .= '@';
        }


        // We want the user to stay on the same host they are currently on,
        // but beware of security issues
        // see http://shiflett.org/blog/2006/mar/server-name-versus-http-host
        $url .= Superglobal::getServerValueByKey('HTTP_HOST');

        $port = Superglobal::getServerValueByKey('SERVER_PORT');

        // Is it on a non standard port?
        if($is_https && ($port != 443))
        {
            $url .= ':' . Superglobal::getServerValueByKey('SERVER_PORT');
        }
        elseif(!$is_https && ($port != 80))
        {
            $url .= ':' . Superglobal::getServerValueByKey('SERVER_PORT');
        }

        // Get the rest of the URL
        if(!Superglobal::isServerKey('REQUEST_URI'))
        {
            // Microsoft IIS doesn't set REQUEST_URI by default
            $url .= Superglobal::getServerValueByKey('PHP_SELF');

            if(Superglobal::isServerKey('QUERY_STRING'))
            {
                $url .= '?' . Superglobal::getServerValueByKey('QUERY_STRING');
            }
        }
        else
        {
            $url .= Superglobal::getServerValueByKey('REQUEST_URI');
        }

        return $url;
    }

    /**
     * Return URL with fingerprint
     * @param type $sRootPath Path from root
     */
    public static function getStaticProperUrl($sRootPath)
    {
        $sFilePath = Filesystem::path($sRootPath);
        $sFileName = Filesystem::name($sRootPath);
        $sFileExtension = Filesystem::extension($sRootPath);
        $sFileLastModificationDate = filemtime($sRootPath);
        
        $sUrl = Config::get('app.url') . $sFilePath . Config::get('format.dir.slash') 
                . $sFileName . '_' . $sFileLastModificationDate . '_.' . $sFileExtension;
        
        return $sUrl;
    }
}