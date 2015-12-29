var stream1_ = {
	src:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/0/manifest.mpd",
	channel:1,
	meta:"kaka",
	x:0,
	y:0,
	width:320,
	height:180
};
var stream2_ = {
	src:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/1/manifest.mpd",
	channel:2,
	meta:"kaka",
	x:320,
	y:0,
	width:320,
	height:180
};
var stream3_ = {
	src:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/2/manifest.mpd",
	channel:3,
	meta:"kaka",
	x:640,
	y:0,
	width:320,
	height:180
};
var stream4_ = {
	src:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/3/manifest.mpd",
	channel:4,
	meta:"kaka",
	x:960,
	y:0,
	width:320,
	height:180
};
var stream5_ = {
	src:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/4/manifest.mpd",
	channel:5,
	meta:"kaka",
	x:1280,
	y:0,
	width:320,
	height:180
};
var data = {
	streams:[stream1_,stream2_,stream3_,stream4_, stream5_],
	mainSrc:"http://lbd.kaltura.com:8001/mapped/merge_manifest.php/file/strip/manifest.mpd",
	data:"myData",
	width:320,
	height:180
};

var config = {
	remoteSocketEndPoint: "",
	debug: true
};