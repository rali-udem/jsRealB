<?php

/**
 * Description of Str
 *
 * @author molinspa
 */
class Str
{
    public static function getStringBetween($string, $start, $end)
    {
        if(empty($start))
        {
            $ini = 0;
        }
        else
        {
            if(($ini = strpos($string, $start)) === false)
            {
                $ini = 0;
            }
            else
            {
                $ini += strlen($start);
            }
        }
        
        if(empty($end))
        {
            $iEndPosition = strlen($string);
        }
        else
        {
            if(($iEndPosition = strpos($string, $end, $ini)) === false)
            {
                $iEndPosition = strlen($string);
            }
        }
        
        $len = $iEndPosition - $ini;
        
        return substr($string, $ini, $len);
    }
    
    public static function isValid($uValue)
    {
        return is_string($uValue);
    }
}