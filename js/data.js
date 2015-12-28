/**
 * Created by itayk on 27/12/15.
 */
var stream1 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon2.php/file/1/manifest.mpd",
	channel:1,
	meta:"kaka",
	x:0,
	y:0,
	width:480,
	height:270
};
var stream2 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon2.php/file/2/manifest.mpd",
	channel:2,
	meta:"kaka",
	x:480,
	y:0,
	width:480,
	height:270
};
var stream3 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon2.php/file/3/manifest.mpd",
	channel:3,
	meta:"kaka",
	x:960,
	y:0,
	width:480,
	height:270
};
var stream4 = {
	src:"http://lbd.kaltura.com:8001/mapped/hackathon2.php/file/4/manifest.mpd",
	channel:4,
	meta:"kaka",
	x:1440,
	y:0,
	width:480,
	height:270
};
var data = {
	streams:[stream1,stream2,stream3,stream4],
	mainSrc:"http://lbd.kaltura.com:8001/mapped/hackathon2.php/file/strip/manifest.mpd",
	data:"myData",
	width:480,
	height:270

};


/**
 * Created by itayk on 27/12/15.
 */
var stream1_ = {
	src:" http://lbd.kaltura.com:8001/mapped/vid-0.json/manifest.mpd",
	channel:1,
	meta:"kaka",
	x:0,
	y:0,
	width:320,
	height:180
};
var stream2_ = {
	src:" http://lbd.kaltura.com:8001/mapped/vid-1.json/manifest.mpd",
	channel:2,
	meta:"kaka",
	x:320,
	y:0,
	width:320,
	height:180
};
var stream3_ = {
	src:" http://lbd.kaltura.com:8001/mapped/vid-2.json/manifest.mpd",
	channel:3,
	meta:"kaka",
	x:640,
	y:0,
	width:320,
	height:180
};
var stream4_ = {
	src:" http://lbd.kaltura.com:8001/mapped/vid-3.json/manifest.mpd",
	channel:4,
	meta:"kaka",
	x:960,
	y:0,
	width:320,
	height:180
};
var data2 = {
	streams:[stream1_,stream2_,stream3_,stream4_],
	mainSrc:"http://lbd.kaltura.com:8001/mapped/strip.json/manifest.mpd",
	data:"myData",
	width:320,
	height:180

};
/*
[28/12/2015, 12:36:42 AM] Eran Kornblau: http://lbd.kaltura.com:8001/mapped/strip.json/manifest.mpd
	[28/12/2015, 12:36:50 AM] Eran Kornblau: http://lbd.kaltura.com:8001/mapped/aud-0.json/manifest.mpd
	[28/12/2015, 12:36:55 AM] Eran Kornblau: http://lbd.kaltura.com:8001/mapped/vid-0.json/manifest.mpd
	[28/12/2015, 12:37:02 AM] Eran Kornblau: http://lbd.kaltura.com:8001/mapped/aud-1.json/manifest.mpd
	[28/12/2015, 12:37:07 AM] Eran Kornblau: http://lbd.kaltura.com:8001/mapped/vid-1.json/manifest.mpd
	*/