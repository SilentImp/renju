<?php
  if(!isset($_POST['payload'])){
    die();
  }
  chdir('../');
  exec("git commit -a -m'autocommit-on-refresh' && git pull");
?>