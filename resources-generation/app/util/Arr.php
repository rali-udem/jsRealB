<?php

/**
 * Description of Arr
 *
 * @author molinspa
 */
class Arr
{
    public static function removeByValue($uValue, array &$aArray)
    {
        if(($sKey = array_search($uValue, $aArray)) !== false)
        {
            unset($aArray[$sKey]);
            $aArray = array_values($aArray);

            return true;
        }

        return false;
    }
    
    public static function removeByKey($uKey, array &$aArray)
    {
        unset($aArray[$uKey]);
    }

    /**
     * Get an item from an array using "dot" notation.
     *
     * @param  array   $array
     * @param  string  $key
     * @param  mixed   $default
     * @return mixed
     */
    public static function get(array $array, $key, $default = null)
    {
        if(is_null($key))
            return $array;

        if(isset($array[$key]))
            return $array[$key];

        foreach(explode('.', $key) as $segment)
        {
            if(!is_array($array) || !array_key_exists($segment, $array))
            {
                return $default;
            }

            $array = $array[$segment];
        }

        return $array;
    }

    /**
     * Check if an item exists in an array using "dot" notation.
     *
     * @param  array   $array
     * @param  string  $key
     * @return bool
     */
    public static function has(array $array, $key)
    {
        if(empty($array) || is_null($key))
            return false;

        if(array_key_exists($key, $array))
            return true;

        foreach(explode('.', $key) as $segment)
        {
            if(!is_array($array) || !array_key_exists($segment, $array))
            {
                return false;
            }

            $array = $array[$segment];
        }

        return true;
    }
    
    /**
     * Check if a value exists in an array using "dot" notation.
     *
     * @param  array   $array
     * @param  string  $key
     * @return bool
     */
    public static function in(array $array, $key)
    {
        if(empty($array) || is_null($key))
            return false;

        if(in_array($key, $array))
            return true;

        foreach(explode('.', $key) as $segment)
        {
            if(!is_array($array) || !in_array($segment, $array))
            {
                return false;
            }

            $array = $array[$segment];
        }

        return true;
    }

    /**
     * Set an array item to a given value using "dot" notation.
     *
     * If no key is given to the method, the entire array will be replaced.
     *
     * @param  array   $array
     * @param  string  $key
     * @param  mixed   $value
     * @return array
     */
    public static function set(array &$array, $key, $value)
    {
        if(is_null($key))
            return $array = $value;

        $keys = explode('.', $key);

        while(count($keys) > 1)
        {
            $key = array_shift($keys);

            // If the key doesn't exist at this depth, we will just create an empty array
            // to hold the next value, allowing us to create the arrays to hold final
            // values at the correct depth. Then we'll keep digging into the array.
            if(!isset($array[$key]) || !is_array($array[$key]))
            {
                $array[$key] = array();
            }

            $array = & $array[$key];
        }

        $array[array_shift($keys)] = $value;

        return $array;
    }

    /**
     * Get size of array
     */
    public static function size(array $array)
    {
        return count($array);
    }

    /**
     * Returns first element or null
     */
    public static function first(array $array)
    {
        return (reset($array) === false) ? null : current($array);
    }

    /**
     * Returns last element or null
     */
    public static function last(array $array)
    {
        return (end($array) === false) ? null : current($array);
    }
    
    /**
     * Checks if it is an array
     */
    public static function isValid($uVal)
    {
        return is_array($uVal);
    }
}