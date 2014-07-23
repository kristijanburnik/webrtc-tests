<?php

$data = $_POST['data'];

$length = strlen( $data );

print_r( $length );

$date = date("Y-m-d H:i:s");

file_put_contents( dirname(__FILE__) . "/image.data.log.txt","$date $length\n",FILE_APPEND);

?>
