<?php
  if(!isset($_POST['payload'])){
    die();
  }
  exec("git commit -a -m'autocommit-on-refresh' && git pull");
?>