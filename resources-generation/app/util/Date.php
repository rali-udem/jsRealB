<?php

/**
 * Description of Date
 *
 * @author molinspa
 */
class Date
{
    public static function setLocalTimeZoneFromZoneNameFr($sAbbrFr)
    {
        $aTranslateZoneNameFrToEn = array(
            'HNP' => 'PST',
            'HNR' => 'MST',
            'HNC' => 'CST',
            'HNE' => 'EST',
            'HNA' => 'AST',
            'HNT' => 'NST',
            'HAP' => 'PDT',
            'HAR' => 'MDT',
            'HAC' => 'CDT',
            'HAE' => 'EDT',
            'HAA' => 'ADT',
            'HAT' => 'NDT'
        );
        
        $sAbbrEn = isset($aTranslateZoneNameFrToEn[$sAbbrFr]) 
                ? $aTranslateZoneNameFrToEn[$sAbbrFr] : null;
        
        self::setLocalTimeZoneFromZoneNameEn($sAbbrEn);
    }
    
    public static function setLocalTimeZoneFromZoneNameEn($sAbbrEn)
    {
        $sTimeZoneName = is_null($sAbbrEn) 
                ? Config::get('app.timezone') : timezone_name_from_abbr($sAbbrEn);
        
        date_default_timezone_set($sTimeZoneName);
    }
    
    /**
     * DateTime Format
     * @param $sISO8601Date Y-m-dTH:i:sZ
     */
    public static function getDateTimeFromISO8601($sISO8601Date)
    {
        $oDateTime = DateTime::createFromFormat(DateTime::ISO8601, $sISO8601Date);
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    /**
     * International Hour Format
     * @param type $sDateTime Y-m-d H:i:s
     */
    public static function getHourInFromDateTime($sDateTime)
    {
        $oDateTime = DateTime::createFromFormat(Config::get('format.date.int.full_date'), $sDateTime);
        return $oDateTime->format(Config::get('format.date.int.full_hour'));
    }
    
    
    /**
     * Utils
     */
    // Get current date + X days
    public static function getDateFromNow($iDayAdded)
    {
        return Date::getUTCFullDate(strtotime('+' . Number::getInt($iDayAdded) . 'days', time()));
    }
    
    public static function getFullDateDayDiff($sFullDate1, $sFullDate2)
    {
        $oDatetime1 = new DateTime($sFullDate1);
        $oDatetime2 = new DateTime($sFullDate2);
        $oInterval = $oDatetime1->diff($oDatetime2);
        return intval($oInterval->format('%a'));
    }
    
    public static function getFullDateHourDiff($sFullDate1, $sFullDate2)
    {
        $oDatetime1 = new DateTime($sFullDate1);
        $oDatetime2 = new DateTime($sFullDate2);
        $oInterval = $oDatetime1->diff($oDatetime2);
        return (intval($oInterval->format('%a'))*24) + intval($oInterval->format('%h'));
    }
    
    public static function getHour($sFullDate)
    {
        $oDatetime = new DateTime($sFullDate);
        return $oDatetime->format('H');
    }
    
    /**
     * Conversion
     */
    public static function getFullDateFromIso8601($sIso8601Date)
    {
        $oDateTime = DateTime::createFromFormat(DateTime::ISO8601, $sIso8601Date);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    } 
    
    private static function getLocalDateTimeFromUtc($sFullDateUTC)
    {
        $oDateTime = DateTime::createFromFormat(
                Config::get('format.date.int.full_date'), 
                $sFullDateUTC,
                new DateTimeZone('UTC'));
        $oDateTime->setTimezone(new DateTimeZone(date_default_timezone_get()));
        
        return $oDateTime;
    }
    
    public static function getTimeZoneOffset()
    {
        $oTimeZoneUtc = new DateTimeZone('UTC');
        $oTimeZoneLocal = new DateTimeZone(date_default_timezone_get());
        $oDateTime = new DateTime('now', $oTimeZoneUtc);
        return $oTimeZoneLocal->getOffset($oDateTime);
    }
    
    public static function setToStartOfDay($sFullDate)
    {
        $sFullDateStartOfDay = substr($sFullDate, 0, strpos($sFullDate, ' ')) 
                . ' 00:00:00';
        
        return $sFullDateStartOfDay;
    }
    
    public static function setToEndOfDay($sFullDate)
    {
        $sFullDateEndOfDay = substr($sFullDate, 0, strpos($sFullDate, ' ')) 
                . ' 23:59:59';
        
        return $sFullDateEndOfDay;
    }
    
    public static function setToNextHour($sFullDate)
    {
        $oDateTime = new DateTime(self::addHour($sFullDate, 1));
        $oDateTime->setTime($oDateTime->format('H'), 0, 0);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    public static function addDay($sFullDate, $iDay)
    {
        $oDateTime = new DateTime($sFullDate);
        $oDateInterval = new DateInterval('P' . abs(intval($iDay)) . 'D');
        if($iDay < 0)
        {
            $oDateInterval->invert = 1; // negative value
        }
        $oDateTime->add($oDateInterval);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    public static function addHour($sFullDate, $iHour)
    {
        $oDateTime = new DateTime($sFullDate);
        $oDateInterval = new DateInterval('PT' . abs(intval($iHour)) . 'H');
        if($iHour < 0)
        {
            $oDateInterval->invert = 1; // negative value
        }
        $oDateTime->add($oDateInterval);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    public static function addSecond($sFullDate, $iSecond)
    {
        $oDateTime = new DateTime($sFullDate);
        $oDateInterval = new DateInterval('PT' . abs(intval($iSecond)) . 'S');
        if($iSecond < 0)
        {
            $oDateInterval->invert = 1; // negative value
        }
        $oDateTime->add($oDateInterval);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
   
    /**
     * Current date UTC
     */
    public static function getUTCFullDate($iLocalTime = null)
    {
        $oDateTimeZone = new DateTimeZone('UTC');
        $oDateTime = new DateTime(gmdate(
                    Config::get('format.date.int.full_date'), 
                    (is_null($iLocalTime) ? time() : $iLocalTime)), 
                $oDateTimeZone);
        
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    
    /**
     * Print LOCAL date
     */
    public static function getLocalFullDate($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return $oDateTime->format('Y-m-d H:i:s');
    }
    
    public static function getLocalHour($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return intval($oDateTime->format('H'));
    }
    
    public static function getDisplayableFullDate($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return $oDateTime->format(Config::get('format.date.int.full_date'));
    }
    
    public static function getDisplayableDate($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return $oDateTime->format(Config::get('format.date.int.date'));
    }
    
    public static function getDisplayableFullHour($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return $oDateTime->format(Config::get('format.date.int.full_hour'));
    }
    
    public static function getDisplayableHour($sFullDateUTC)
    {
        $oDateTime = self::getLocalDateTimeFromUtc($sFullDateUTC);
        return $oDateTime->format(Config::get('format.date.int.hour'));
    }
}
