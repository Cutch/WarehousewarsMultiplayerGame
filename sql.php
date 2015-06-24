<?php
$method = $_SERVER['REQUEST_METHOD'];
$dbconn = pg_connect("")
				or die('Could not connect: ' . pg_last_error());
				
switch ($method) {
  case 'POST': // Add Score
	pg_prepare($dbconn, "addMsg","INSERT INTO score (name, score) VALUES ($1, $2) RETURNING id");
	$name = pg_escape_string($_POST['name']);
	$score = pg_escape_string($_POST['score']); 
	$sql = pg_execute($dbconn, "addMsg", array($name, $score));
	if($sql){
		$id = 0;
		while($userINPUTArray = pg_fetch_array($sql))
		{
			$id = $userINPUTArray[0];
		}
		$sql = pg_query("WITH highscores AS (SELECT DISTINCT id, name, score, date, DENSE_RANK() OVER (ORDER BY score DESC) dense_rank FROM score ORDER BY score DESC, date DESC) SELECT id,dense_rank FROM highscores WHERE id = ".$id);
		if($sql){
			while($userINPUTArray = pg_fetch_array($sql))
			{
				$rank = $userINPUTArray[1];
			}
			$status = "ok";
			$errormessage = $rank;
		}else{
			$status = "fail";
			$errormessage = pg_last_error();
		}
	}else{
		$status = "fail";
		$errormessage = pg_last_error();
	}
	$arr = array($status,$errormessage);
	print json_encode($arr);
    break;
}
pg_close($dbconn);
?>