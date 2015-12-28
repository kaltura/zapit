/**
 * Created by itayk on 27/12/15.
 */
var multipleVideoHandler = function(strip,main,canvas,data,shaka){
	var _this = this;
	this.video = strip;
	this.mainVideo = main;
	this.canvas = canvas;
	this.data = data;
	this.mainSrc = data.mainSrc;
	this.currentStreamIndex = 0;
	this.audioTracks = null;
	this.currentStream = this.data.streams[this.currentStreamIndex];
	this.canvas.width = this.data.width;
	this.canvas.height = this.data.height;

	shaka.polyfill.installAll();
	this.player = new shaka.player.Player(this.video);
	this.player.configure({streamBufferSize:5});
	this.mainPlayer = new shaka.player.Player(this.mainVideo);

	var estimator = new shaka.util.EWMABandwidthEstimator();
	this.source = new shaka.player.DashVideoSource(this.mainSrc, null, estimator);

	_this.player.load(this.source).then(function(){
		context = _this.canvas.getContext("2d");
		_this.audioTracks = _this.player.getAudioTracks();
		_this.video.play();
		paintFrame();
	});

	 _this.player.addEventListener('seekrangechanged', onSeekrangechanged);
	_this.mainPlayer.addEventListener('seekrangechanged', onSeekrangechanged2);
	_this.player.addEventListener('trackschanged',onTrackChange);
	function onTrackChange(event){
		_this.video.volume = 1;

	}
	function onSeekrangechanged(event) {
		console.info( "onSeekrangechanged: start=" + event.start + ", end=" + event.end );

	}
	function onSeekrangechanged2(event) {
		console.info( "onSeekrangechanged22: start=" + event.start + ", end=" + event.end );

	}



	function updateSource(){
		_this.mainVideo.pause();
		_this.showCanvas();
		_this.currentStream = _this.data.streams[_this.currentStreamIndex];
		if (_this.audioTracks){
			_this.player.selectAudioTrack(_this.currentStream.channel,true,2);
			_this.video.volume = 0;
			setTimeout(function(){
				_this.video.volume = 1;
			},4000);
		}
		_this.mainPlayer.load(new shaka.player.DashVideoSource(_this.currentStream.src, null, estimator)).then(function(){
			_this.mainVideo.addEventListener("playing",function(){
				_this.showVideo();
			});
			_this.mainPlayer.setPlaybackStartTime(_this.video.currentTime/1000);
			_this.mainVideo.play();


		});

	}

	function paintFrame(){
		context.drawImage(_this.video,_this.currentStream.x,_this.currentStream.y,_this.currentStream.width,_this.currentStream.height,0,0,_this.data.width,_this.data.height);
		requestAnimationFrame(paintFrame);
	}

	//public API
	this.showVideo = function(){
	//	_this.canvas.style.visibility = "hidden";
		 _this.mainVideo.style.visibility = "";
	};

	this.showCanvas = function(){
		_this.canvas.style.visibility = "";
	//	_this.mainVideo.style.visibility = "hidden";
	};
	this.zapUp = function(){
		_this.currentStreamIndex = (_this.currentStreamIndex + 1) % _this.data.streams.length;

		updateSource();
	};


};