<?php

ini_set('max_execution_time', 90);

ob_start();

header('Content-Type: text/html; charset=utf-8');

/*** error reporting ***/
error_reporting(-1);
ini_set('display_errors', 'On');
/*** error reporting ***/

define('REAL_PATH_ROOT', realpath('./') . '/');
require_once REAL_PATH_ROOT . 'autoloader.php';

try
{
    $oJSRealService = new JSRealFrService("fr");
    $aExportedFile = $oJSRealService->export();
    
    $sOutput = Conversion::getJsonFromArray(array_merge(array('bSuccess' => true), $aExportedFile));
}
catch (Exception $ex)
{
    $sOutput = Conversion::getJsonFromArray(array('bSuccess' => false, 
        'sErrorMessage' => $e->getMessage(), 'iErrorCode' => $e->getCode()));
}

//ob_end_clean();

echo $sOutput;