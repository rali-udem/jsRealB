<?php

/**
 * Description of Number
 *
 * @author molinspa
 */
class Number
{
    /**
     * Integer
     */
    public static function getInt($uValue)
    {
        return intval($uValue);
    }
    
    public static function getRoundedInt($uValue)
    {
        return round(self::getInt($uValue), 0, PHP_ROUND_HALF_EVEN);
    }
    
    public static function getDisplayableInt($uValue)
    {
        return number_format(self::getInt($uValue), 0, '.', ' ');
    }
    
    /**
     * Float
     */
    public static function getFloat($uValue)
    {
        return floatval($uValue);
    }
    
    public static function getRoundedFloat($uValue, $iPrecision = 2)
    {
        return round(self::getFloat($uValue), $iPrecision, PHP_ROUND_HALF_EVEN);
    }
    
    public static function getDisplayableFloat($uValue)
    {
        return number_format(self::getFloat($uValue), 2, '.', ' ');
    }
    
    /**
     * Utils
     */
    public static function isValid($uValue)
    {
        return is_numeric($uValue);
    }
}
