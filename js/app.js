var strip = document.getElementById('videoStrip');
var main = document.getElementById('mainVideo');

var canvas = document.getElementById('mainVideoCanvas');

var videoHandler = new multipleVideoHandler(strip,main,canvas,data,shaka);
//        var videoBox1 = document.querySelector(".videoBox");
//        var videoStripOverlay = document.querySelector("#videoStripOverlay");
//        videoStripOverlay.addEventListener("click", function(e){
//            var videoTargetId = e.target.id;
//            var channelNumber = videoTargetId.charAt(videoTargetId.length-1);
//            videoHandler.zapUp(channelNumber-1);
//        });
//        var hotzone = document.querySelector("#hotzone");
//        hotzone.addEventListener("mouseover", function(){
//            videoBox1.style.zIndex = 1;
//        });
//        videoStripOverlay.addEventListener("mouseout", function(){
//            videoBox1.style.zIndex = 0;
//        });
if (config.remoteSocketEndPoint && config.remoteSocketEndPoint != "") {
    var socket = io(config.remoteSocketEndPoint);
    socket.on('up', function (data) {
        console.log(data);
        socket.emit('my other event', {my: 'data'});
        videoHandler.zapUp();
//            alert("got called " + data.dir);
    });
    socket.on('down', function (data) {
        console.log(data);
        socket.emit('my other event', {my: 'data'});
        videoHandler.zapDown();
//            alert("got called " + data.dir);
    });
}