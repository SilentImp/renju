<?php
  if(!isset($_POST['payload'])){
    die();
  }
  exec("git pull && git commit -a -m'autocommit-on-refresh' && git push && git pull",$output);

  file_put_contents('lasthook.log',$output);
?>