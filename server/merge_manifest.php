<?php

function getRequestParams()
{
        $scriptParts = explode('/', $_SERVER['SCRIPT_NAME']);
        $pathParts = array();
        if (isset($_SERVER['PHP_SELF']))
                $pathParts = explode('/', $_SERVER['PHP_SELF']);
        $pathParts = array_diff($pathParts, $scriptParts);

        $params = array();
        reset($pathParts);
        while(current($pathParts))
        {
                $key = each($pathParts);
                $value = each($pathParts);
                if (!array_key_exists($key['value'], $params))
                {
                        $params[$key['value']] = $value['value'];
                }
        }
        return $params;
}

    define('AdaptationSetStartTag', "<AdaptationSet");
    define('AdaptationSetEndTag', "</AdaptationSet>");

    function getContent($url, $headers = null)
    {
        $ch = curl_init();

        // set URL and other appropriate options
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_NOBODY, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        $content = curl_exec($ch);
        curl_close($ch);

        return $content;
    }

    function concatXmls($mpds)
    {
        $output = "";
        $prefix = "";
        $postfix = "";
        $isFirst = true;
        foreach($mpds as $index=>$response){
            $adaptationSetStartPos = strpos($response, AdaptationSetStartTag);
            $adaptationSetEndPos = strpos($response, AdaptationSetEndTag);
            if ($isFirst){
                $prefix = substr($response, 0, $adaptationSetStartPos);
                $postfix = substr($response, $adaptationSetEndPos + strlen(AdaptationSetEndTag));
                $isFirst = false;
            }
            $output = $output . substr($response, $adaptationSetStartPos, $adaptationSetEndPos-$adaptationSetStartPos + strlen(AdaptationSetEndTag));
        }

        $output = $prefix . $output . $postfix;
        return $output;
    }

$params = getRequestParams();
$fileName = $params['file'];

$arr = array();
if ($fileName == 'strip')
{
        $arr[]=getContent("http://lbd.kaltura.com:8001/mapped/strip.json/manifest.mpd");
	for ($i = 0; $i < 5; $i++)
	{
		$content=getContent("http://lbd.kaltura.com:8001/mapped/aud-$i.json/manifest.mpd");
		$adaptAttrs = 'group="'.($i+2).'"'."\n";
		$adaptAttrs .= '        lang="en_vid'.$i.'"';
		$content = str_replace('group="2"', $adaptAttrs, $content);
		$arr[]=$content;
	}
}
else
{
        $arr[]=getContent("http://lbd.kaltura.com:8001/mapped/vid-$fileName.json/manifest.mpd");
	$arr[]=getContent("http://lbd.kaltura.com:8001/mapped/aud-$fileName.json/manifest.mpd");
}

header('Content-Type: application/dash+xml');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Expose-Headers: Server,range,Content-Length,Content-Range,Date');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Origin: *');

$output = concatXmls($arr);
header('Content-Length: '.strlen($output));
echo $output;
