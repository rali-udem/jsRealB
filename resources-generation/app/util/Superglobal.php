<?php

/**
 * Description of Superglobal
 *
 * @author molinspa
 */
class Superglobal
{
    // !!! 
    // Stop using filter_input with $_SERVER, $_GET, $_POST variables
    // A PHP confirmed bug. Function returns null on this server.
    // !!!
    
    public static function isServerKey($sKey)
    {
        return (!empty($sKey) && isset($_SERVER[$sKey]));
    }
    
    public static function getServerValueByKey($sKey)
    {
        if(self::isServerKey($sKey))
        {
            return filter_var($_SERVER[$sKey]);
        }
        
        return null;
    }
    
    public static function isGetKey($sKey)
    {
        return (!empty($sKey) && isset($_GET[$sKey]));
    }
    
    public static function getGetValueByKey($sKey)
    {
        if(self::isGetKey($sKey))
        {
            return filter_var($_GET[$sKey]);
        }
        
        return null;
    }
    
    public static function isPostKey($sKey)
    {
        return (!empty($sKey) && isset($_POST[$sKey]));
    }
    
    public static function getPostValueByKey($sKey)
    {
        if(self::isPostKey($sKey))
        {
            return filter_var($_POST[$sKey]);
        }
        
        return null;
    }
}