/**
 * Created by itayk on 27/12/15.
 */


var multipleVideoHandler = function(strip,main,canvas,data,shaka){
	var _this = this;
	this.stripVideo = strip;
	this.mainVideo = main;
	this.canvas = canvas;
	this.data = data;
	this.cancelSwitch = false;
	this.mainSrc = data.mainSrc;
	this.currentStreamIndex = 0;
	this.audioTracks = null;
	this.currentStream = this.data.streams[this.currentStreamIndex];
	this.canvas.width = this.data.width;
	this.canvas.height = this.data.height;

	//Install shaka polyfills
	shaka.polyfill.installAll();

	//Init main player
	this.mainPlayer = new shaka.player.Player(this.mainVideo);
	this.mainPlayer.configure({
		streamBufferSize: 10
	});
	var mainEstimator = new shaka.util.EWMABandwidthEstimator();
	var mainSource = new shaka.player.DashVideoSource(this.currentStream.src, null, mainEstimator);

	//Init strip player
	this.stripPlayer = new shaka.player.Player(this.stripVideo);
	this.stripPlayer.configure({
		streamBufferSize: 40
	});
	var stripEstimator = new shaka.util.EWMABandwidthEstimator();
	var stripSource = new shaka.player.DashVideoSource(this.mainSrc, null, stripEstimator);

	//Handle video display
	showVideo();

	//Load the main player and start playback
	_this.mainPlayer.load(mainSource).then(function(){
		_this.mainVideo.play();
	});

	//Load the strip player in the background
	_this.stripPlayer.load(stripSource).then(function(){
		context = _this.canvas.getContext("2d");
		_this.audioTracks = _this.stripPlayer.getAudioTracks();
		_this.stripVideo.volume = 0;
		_this.stripVideo.play();
		paintFrame();
	});

	_this.stripPlayer.addEventListener('trackschanged',onTrackChange);
	function onTrackChange(event){
		_this.stripVideo.volume = 1;
	}

	// _this.player.addEventListener('seekrangechanged', onSeekrangechanged);
	//_this.mainPlayer.addEventListener('seekrangechanged', onSeekrangechanged2);
	//function onSeekrangechanged(event) {
	//	console.info( "onSeekrangechanged: start=" + event.start + ", end=" + event.end );
    //
	//}
	//function onSeekrangechanged2(event) {
	//	console.info( "onSeekrangechanged22: start=" + event.start + ", end=" + event.end );
    //
	//}
	//setInterval(function(){
	//	console.warn("mainVideo: " + (_this.mainVideo.currentTime) + ", stripVideo: " + (_this.stripVideo.currentTime));
	//	console.warn("delta: " + (_this.mainVideo.currentTime-_this.stripVideo.currentTime));
	//}, 500);


	function updateSource(){
		//Cancel pending switch
		if (_this.isSwitching){
			console.info("Got request for switch while switching");
			_this.cancelSwitch = true;
			_this.mainVideo.removeEventListener("playing", _this.playingEventHandler);
		}
		//Pause the main video before changing to new stream
		_this.mainVideo.pause();
		//Display the canvas until we can show the new stream
		_this.showCanvas();
		_this.currentStream = _this.data.streams[_this.currentStreamIndex];
		//Handle audio stream switch until we can change to new stream
		if (_this.audioTracks){
			_this.stripPlayer.selectAudioTrack(_this.currentStream.channel+2, true, 2);
			_this.mainVideo.volume = 0;
			_this.stripVideo.volume = 0;
			setTimeout(function(){
				_this.stripVideo.volume = 1;
			}, 2000);
		}
		//Set the switching flag
		_this.isSwitching = true;
		//Load the new stream
		var playerCurrentStream = new shaka.player.DashVideoSource(_this.currentStream.src, null, mainEstimator);
		_this.mainPlayer.load(playerCurrentStream).then(function(){
			console.info("Main player loaded, register playing event");
			var alignPlayers = function(){
				_this.cancelSwitch = false;
				console.info("Remove playing event handler");
				_this.mainVideo.removeEventListener("playing", alignPlayers);
				console.info("Main video is playing, try to sync...");
				var boundedSync = sync.bind(_this);
				boundedSync()
						.then(function () {
							_this.isSwitching = false;
							_this.showVideo();
							_this.mainVideo.volume = 1;
							_this.stripVideo.volume = 0;
						})
						.catch(function () {
							_this.isSwitching = false;
							console.info("Failed sync, reset playback rates");
						});
			}.bind(_this);
			_this.playingEventHandler = alignPlayers;
			_this.mainVideo.addEventListener("playing", _this.playingEventHandler);
			_this.mainPlayer.setPlaybackStartTime(_this.stripVideo.currentTime + 10);
			_this.mainVideo.play();
		});
	}

	function sync(){
		var count = 0;
		var syncVideoInterval;
		var boundedSyncVideo = syncVideo.bind(this);
		var prom = new Promise(
			function(resolve, reject) {
				if (boundedSyncVideo()){
					return resolve();
				} else {
					syncVideoInterval = setInterval(function() {
						console.info("===============");
						console.info("Checking if videos are synced ("+count+")");
						if (boundedSyncVideo()){
							clearInterval(syncVideoInterval);
							console.info("Videos are synced");
							return resolve();
						}
						if (count >= 50 || _this.cancelSwitch){
							if (_this.cancelSwitch){
								console.info("Cancel switching");
								_this.cancelSwitch = false;
							}
							console.info("Videos are not synced after " + count + " retries");
							clearInterval(syncVideoInterval);
							return reject();
						}
						count = count + 1;
					}, 1000);
				}
			});
		return prom;
	}

	function syncVideo() {
		var sct = ( this.stripVideo.currentTime );
		var mct = ( this.mainVideo.currentTime );
		var delta = Math.abs(sct - mct);
		var adaptivePlaybackrateChange = Math.round(delta * 100) / 100;
		console.info("Time difference = " + delta);
		console.info("Main = " + mct + ", strip = " + sct);
		if (delta < 0.1) {
			//If delta is smaller than X then set playbackRate back to 1
			this.mainVideo.playbackRate = 1;
			this.seeking = false;
			console.info("Delta less then 0.05, Go power rangers, Go!");
			return true;
		} else if(!this.mainVideo.seeking && !this.seeking){
			//If delta is bigger than X then set playbackRate to Y to allow
			//The videos to catch up
			if (mct > sct) {
				if (adaptivePlaybackrateChange >= 1){
					this.mainVideo.pause();
					console.info("Main video is ahead of strip, pausing playback");
				} else {
					this.mainVideo.play();
					this.mainVideo.playbackRate = (1 - adaptivePlaybackrateChange);
					console.info("Main video is ahead of strip, slowing playback rate down to " + this.mainVideo.playbackRate);
				}

			} else {
				this.mainVideo.play();
				this.mainVideo.playbackRate = 1;
				this.seektarget = this.stripVideo.buffered.end(this.stripVideo.buffered.length-1);
				console.info("Main video is behind of strip, seeking to " + this.seektarget);
				this.mainVideo.currentTime = this.seektarget;
				this.seeking = true;
			}

			return false;
		} else {
			if ((this.mainVideo.currentTime >= this.seektarget) ||
				(this.mainVideo.currentTime >= this.stripVideo.currentTime) ||
				(this.stripVideo.currentTime > this.seektarget)) {
				this.seeking = false;
			}
			console.info("Waiting for seek to sync videos");
			return false;
		}
	}

	function paintFrame(){
		context.drawImage(_this.stripVideo,_this.currentStream.x,_this.currentStream.y,_this.currentStream.width,_this.currentStream.height,0,0,_this.data.width,_this.data.height);
		requestAnimationFrame(paintFrame);
	}

	function showVideo(){
		addClass(_this.canvas, "hidden");
		removeClass(_this.mainVideo, "hidden");
	}

	function showCanvas(){
		removeClass(_this.canvas, "hidden");
		addClass(_this.mainVideo, "hidden");
	}

	function addClass(el, className){
		if (el.classList)
			el.classList.add(className);
		else
			el.className += ' ' + className;
	}

	function removeClass(el, className){
		if (el.classList)
			el.classList.remove(className);
		else
			el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
	}

	//public API
	this.showVideo = function(){
		addClass(_this.canvas, "hidden");
		removeClass(_this.mainVideo, "hidden");
	};

	this.showCanvas = function(){
		removeClass(_this.canvas, "hidden");
		addClass(_this.mainVideo, "hidden");
		//_this.canvas.style.visibility = "";
		//_this.mainVideo.style.visibility = "hidden";
	};
	this.zapUp = function(index){
		if (index != _this.currentStreamIndex) {
			var channel = (index != null) && (index != undefined) ? index : _this.currentStreamIndex + 1;
			_this.currentStreamIndex = channel % _this.data.streams.length;
			updateSource();
		}
	};
};