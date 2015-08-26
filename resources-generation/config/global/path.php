<?php

return array(
    'real' => array(
        'root' => realpath(__DIR__ . '/../../') . '/'
    ),
    
    'relative' => array(
        'root_to_app' => 'app/',
        'root_to_config' => 'config/',
        'root_to_public_data' => '../data/',
        'root_to_test_data' => '../test/data/',
        'app_to_data' => 'data/',
        'app_to_xsl' => 'xsl/'
    )
);