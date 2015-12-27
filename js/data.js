/**
 * Created by itayk on 27/12/15.
 */
var stream1 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon.php/file/1/manifest.mpd",
	channel:1,
	meta:"kaka",
	x:0,
	y:0,
	width:480,
	height:270
};
var stream2 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon.php/file/2/manifest.mpd",
	channel:2,
	meta:"kaka",
	x:480,
	y:0,
	width:480,
	height:270
};
var stream3 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon.php/file/3/manifest.mpd",
	channel:3,
	meta:"kaka",
	x:960,
	y:0,
	width:480,
	height:270
};
var stream4 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon.php/file/4/manifest.mpd",
	channel:4,
	meta:"kaka",
	x:1440,
	y:0,
	width:480,
	height:270
};
var data = {
	streams:[stream1,stream2,stream3,stream4],
	mainSrc:"http://lbd.kaltura.com:8001/mapped/hackathon.php/file/strip/manifest.mpd",
	data:"myData",
	width:480,
	height:270

};