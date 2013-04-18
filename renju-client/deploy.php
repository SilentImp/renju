<?php
  if(!isset($_POST['payload'])){
    die();
  }
  chdir('../');
  exec("git pull");
?>