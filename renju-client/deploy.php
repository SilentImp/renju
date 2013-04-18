<?php
  if(!isset($_POST['payload'])){
    die();
  }
  exec("git commit -a -m'autocommit-on-refresh' && git pull",$output);

  file_put_contents('lasthook.log',$output);
?>