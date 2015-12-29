//Init application
var strip = document.getElementById('videoStrip');
var main = document.getElementById('mainVideo');
var canvas = document.getElementById('mainVideoCanvas');
var videoHandler = new multipleVideoHandler(strip,main,canvas,data,config,shaka);

//Set channel click handler
var videoStripGrid = document.querySelector("#videoStripGrid");
videoStripGrid.addEventListener("click", function(e){
    var videoTargetId = e.target.id;
    var channelNumber = videoTargetId.charAt(videoTargetId.length-1);
    videoHandler.zap(channelNumber-1);
});

//Set channels view display toggle
var channelsView = document.querySelector(".channelsView");
var videoStrip = document.querySelector("#videoStrip");
channelsView.addEventListener("mouseover", function(){
    videoStrip.classList.remove("hidden");
});
channelsView.addEventListener("mouseout", function(){
    videoStrip.classList.add("hidden");
});

//Add socket if configured
if (config.remoteSocketEndPoint && config.remoteSocketEndPoint != "") {
    var socket = io(config.remoteSocketEndPoint);
    socket.on('up', function () {
        console.log('up');
        videoHandler.zapUp();
    });
    socket.on('down', function () {
        console.log('down');
        videoHandler.zapDown();
    });
    socket.on('volumeUp', function () {
        console.log('volumeUp');
        videoHandler.setVolume(videoHandler.getVolume() + 10);
    });
    socket.on('volumeDown', function () {
        console.log('volumeDown');
        videoHandler.setVolume(videoHandler.getVolume() - 10);
    });
}