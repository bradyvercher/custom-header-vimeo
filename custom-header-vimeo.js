(function( window, wp ) {

	var VimeoHandler = wp.customHeader.BaseVideoHandler.extend({
		test: function( settings ) {
			return 'video/x-vimeo' === settings.mimeType;
		},

		ready: function() {
			var handler = this;

			if ( 'Vimeo' in window ) {
				handler.loadVideo();
			} else {
				var tag = document.createElement( 'script' );
				tag.src = 'https://player.vimeo.com/api/player.js';
				tag.onload = function () { handler.loadVideo(); };
				document.getElementsByTagName( 'head' )[0].appendChild( tag );
			}
		},

		loadVideo: function() {
			var player,
				handler = this;

			// Track the paused state since the getPaused() method is asynchronous.
			this._paused = true;

			this.player = player = new Vimeo.Player( this.container, {
				autopause: false,
				autoplay: true,
				// Background isn't currently supported in Vimeo's player library:
				// https://github.com/vimeo/player.js/issues/39
				background: true,
				byline: false,
				height: this.settings.height,
				loop: true,
				portrait: false,
				title: false,
				url: this.settings.videoUrl,
				width: this.settings.width
			});

			player.on( 'play', function() {
				handler._paused = false;
				handler.trigger( 'play' );
			});

			player.on( 'pause', function() {
				handler._paused = true;
				handler.trigger( 'pause' );
			});

			player.ready().then(function() {
				handler.showControls();

				// Autoplay doesn't trigger a play event, so check the video
				// state when ready is triggered.
				player.getPaused().then(function( paused ) {
					handler._paused = paused;

					if ( ! paused ) {
						handler.trigger( 'play' );
					}
				});
			});

			player.setVolume( 0 );
		},

		isPaused: function() {
			return this._paused;
		},

		pause: function() {
			this.player.pause();
		},

		play: function() {
			this.player.play();
		},
	});

	var VimeoLegacyHandler = wp.customHeader.BaseVideoHandler.extend({
		origin: 'https://player.vimeo.com',

		test: function( settings ) {
			return 'video/x-vimeo' === settings.mimeType;
		},

		ready: function() {
			var handler = this,
				videoId = this.settings.videoUrl.split( '/' ).pop(),
				iframe = document.createElement( 'iframe' );

			this._paused = true;
			handler.setVideo( iframe );

			iframe.id = 'wp-custom-header-video';
			iframe.src = 'https://player.vimeo.com/video/' + videoId + '?api=1&autopause=0&autoplay=0&background=1&badge=0&byline=0&loop=1&player_id=' + iframe.id + '&portrait=0&title=0';
			this.iframe = iframe;

			window.addEventListener( 'message', function( e ) {
				var data;

				if ( handler.origin !== e.origin ) {
					return;
				}

				try {
					data = JSON.parse( e.data );
				} catch ( ex ) {
					return;
				}

				if ( 'wp-custom-header-video' !== data.player_id ) {
					return;
				}

				if ( 'ready' === data.event ) {
					handler.postMessage( 'addEventListener', 'pause' );
					handler.postMessage( 'addEventListener', 'play' );
					handler.postMessage( 'setVolume', 0 );
					handler.play();
					handler.showControls();
				} else if ( 'pause' === data.event ) {
					handler._paused = true;
					handler.trigger( data.event );
				} else if ( 'play' === data.event ) {
					handler._paused = false;
					handler.trigger( data.event );
				}
			});
		},

		isPaused: function() {
			return this._paused;
		},

		pause: function() {
			this.postMessage( 'pause' );
		},

		play: function() {
			this.postMessage( 'play' );
		},

		postMessage: function( method, params ) {
			var data = JSON.stringify({
				method: method,
				value: params
			});

			this.iframe.contentWindow.postMessage( data, this.origin );
		}
	});

	wp.customHeader.handlers.vimeo = new VimeoHandler();

})( window, wp );
