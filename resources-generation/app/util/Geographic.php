<?php

/**
 * Description of Geographic
 *
 * @author molinspa
 * 
 * Source : http://www.web-max.ca/PHP/misc_6.php
 */
class Geographic
{
    public static function DMStoDEC($deg,$min,$sec)
    {
        // Converts DMS ( Degrees / minutes / seconds ) 
        // to decimal format longitude / latitude
        
        return $deg+((($min*60)+($sec))/3600);
    }

    public static function DECtoDMS($dec)
    {
        // Converts decimal longitude / latitude to DMS
        // ( Degrees / minutes / seconds )

        $vars = explode(".",$dec);
        $deg = $vars[0];
        $tempma = "0.".$vars[1];

        $tempma = $tempma * 3600;
        $min = floor($tempma / 60);
        $sec = $tempma - ($min*60);

        return array("deg"=>$deg,"min"=>$min,"sec"=>$sec);
    }
}