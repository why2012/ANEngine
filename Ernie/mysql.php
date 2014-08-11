<?php
Class DB
{
	var $query_num = 0;

	function DB ($dbhost, $dbuser, $dbpw, $dbname)
	{
		$this->connect($dbhost, $dbuser, $dbpw, $dbname);
	}
	
	function connect($dbhost, $dbuser, $dbpw, $dbname)
	{
		@mysql_connect($dbhost, $dbuser, $dbpw);
		mysql_errno()!=0 && $this->halt("Connect($pconnect) to MySQL failed");
		$charset = "utf8"; //($GLOBALS['charset'])?$GLOBALS['charset']:"gb2312";
		if($this->server_info() > '4.1' && $charset)
		{
			mysql_query("SET character_set_connection=$charset, character_set_results=$charset, character_set_client=binary");
		}
		if($this->server_info() > '5.0')
		{
			mysql_query("SET sql_mode=''");
		}
		if($dbname)
		{
			if (!@mysql_select_db($dbname))
			{
				$this->halt('Cannot use database');
			}
		}
	}
	
	function close()
	{
		return mysql_close();
	}
	
	function select_db($dbname)
	{
		if (!@mysql_select_db($dbname))
		{
			$this->halt('Cannot use database');
		}
	}
	function server_info()
	{
		return mysql_get_server_info();
	}
	function query($SQL,$method='') 
	{
		//echo $SQL."\n";
		if($method=='U_B' && function_exists('mysql_unbuffered_query'))
		{
			$query = mysql_unbuffered_query($SQL);
		}
		else
		{
			$query = mysql_query($SQL);
		}
		$this->query_num++;
		if ($query === false) $this->halt('Query Error : ' . $SQL);
		return $query;
	}

	function get_one($SQL)
	{
		$query=$this->query($SQL,'U_B');
		$rs =& mysql_fetch_array($query, MYSQL_ASSOC);
		return $rs;
	}

	function get_all($SQL)
	{
		$r = $this->query($SQL);
		$re = array();
		while( ($row = $this->fetch_array($r)) !== FALSE)
		{
			$re[] = $row;
		}
		return $re;
	}

	function fetch_array($query, $result_type = MYSQL_ASSOC)
	{
		if (!$result_type)
			return mysql_fetch_array($query);
		else
			return mysql_fetch_array($query, $result_type);
	}

	function affected_rows()
	{
		return mysql_affected_rows();
	}

	function num_rows($query)
	{
		$rows = mysql_num_rows($query);
		return $rows;
	}

	function free_result($query)
	{
		return mysql_free_result($query);
	}

	function insert_id()
	{
		$id = mysql_insert_id();
		return $id;
	}
	
	function halt($s)
	{
		echo "<div style='color:red;font-size:12px;'>$s<br /><pre>".mysql_error()."</pre></div>";
		die();
	}
}
?>