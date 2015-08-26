<?php

/**
 * Description of Config
 *
 * @author molinspa
 */
require_once 'global/default.php';

class Config
{
    const ENV_PRODUCTION = 'prod';
    const ENV_STAGE = 'stage';
    const ENV_DEVELOPMENT = 'dev';
    
    private static $sRealRootPath = null;    
    private static $aConfiguration = array();
    
    /**
     * Get current Environment
     */
    public static function getEnvironment()
    {
//        if(strpos(Http::getCurrentUrl(), 'MeteoVis_dev') !== false
//                || php_sapi_name() === 'cli')
//        {
//            return self::ENV_DEVELOPMENT;
//        }
//        else if(strpos(Http::getCurrentUrl(), 'MeteoVis_stage') !== false)
//        {
//            return self::ENV_STAGE;
//        }
//        else
//        {
            return self::ENV_PRODUCTION;
//        }
    }
    
    public static function isProdEnv()
    {
        return (self::getEnvironment() === Config::ENV_PRODUCTION);
    }
    
    public static function isStageEnv()
    {
        return (self::getEnvironment() === Config::ENV_STAGE);
    }
    
    public static function isDevEnv()
    {
        return (self::getEnvironment() === Config::ENV_DEVELOPMENT);
    }
    
    /**
    * Get the specified configuration value.
    *
    * @param  string  $key
    * @param  mixed   $default
    * @return mixed
    */
    public static function get($key, $default = null)
    {
        self::loadConfiguration($key);

        $uValue = Arr::get(self::$aConfiguration, $key, $default);
        
        if(empty($uValue))
        {
            return null;
        }
        
        return $uValue;
    }

   /**
    * Set a given configuration value.
    *
    * @param  array|string  $key
    * @param  mixed   $value
    * @return void
    */
    public static function set($key, $value = null)
    {
        self::loadConfiguration($key);

        Arr::set(self::$aConfiguration, $key, $value);
        
        return self::get($key);
    }
    
    public static function loadConfiguration($sKey)
    {
        $aSegment = explode('.', $sKey);
        if(Arr::size($aSegment) > 0)
        {
            $sConfigName = Arr::first($aSegment);
            
            if(!isset(self::$aConfiguration[$sConfigName]))
            {
                self::initConfiguration();
                
                $aTmpConfig = array();
                
                // Common config
                $sCommonConfigPath = self::$sRealRootPath . RELATIVE_PATH_ROOT_TO_CONFIG 
                        . FOLDER_CONFIG_GLOBAL . $sConfigName . '.php';
                if(Filesystem::exists($sCommonConfigPath))
                {
                    $aTmpConfig = require $sCommonConfigPath;
                }

                // Env config
                $sCurrentEnvironment = self::getEnvironment();
                $sConfigEnvironmentPath = self::$sRealRootPath . RELATIVE_PATH_ROOT_TO_CONFIG 
                        . $sCurrentEnvironment . '/' . $sConfigName . '.php';
                if(Filesystem::exists($sConfigEnvironmentPath))
                {
                    $aTmpConfig = array_merge($aTmpConfig, require $sConfigEnvironmentPath);
                }
                
                self::$aConfiguration[$sConfigName] = $aTmpConfig;
            }
        }
    }
    
    private static function initConfiguration()
    {
        if(empty(self::$aConfiguration))
        {
            self::$sRealRootPath = realpath(__DIR__ . '/../') . '/';
        }
    }
}