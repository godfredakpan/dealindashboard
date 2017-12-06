/*!
 * fancyBox - jQuery Plugin
 * version: 2.1.5 (Fri, 14 Jun 2013)
 * @requires jQuery v1.6 or later
 *
 * Examples at http://fancyapps.com/fancybox/
 * License: www.fancyapps.com/fancybox/#license
 *
 * Copyright 2012 Janis Skarnelis - janis@fancyapps.com
 *
 */


(function (window, document, $, undefined) {
	"use strict";

	var H = $("html"),
		W = $(window),
		D = $(document),
		F = $.fancybox = function () {
			F.open.apply( this, arguments );
		},
		IE =  navigator.userAgent.match(/msie/i),
		didUpdate	= null,
		isTouch		= document.createTouch !== undefined,

		isQuery	= function(obj) {
			return obj && obj.hasOwnProperty && obj instanceof $;
		},
		isString = function(str) {
			return str && $.type(str) === "string";
		},
		isPercentage = function(str) {
			return isString(str) && str.indexOf('%') > 0;
		},
		isScrollable = function(el) {
			return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
		},
		getScalar = function(orig, dim) {
			var value = parseInt(orig, 10) || 0;

			if (dim && isPercentage(orig)) {
				value = F.getViewport()[ dim ] / 100 * value;
			}

			return Math.ceil(value);
		},
		getValue = function(value, dim) {
			return getScalar(value, dim) + 'px';
		};

	$.extend(F, {
		// The current version of fancyBox
		version: '2.1.5',

		defaults: {
			padding : 15,
			margin  : 20,

			width     : 800,
			height    : 600,
			minWidth  : 100,
			minHeight : 100,
			maxWidth  : 9999,
			maxHeight : 9999,
			pixelRatio: 1, // Set to 2 for retina display support

			autoSize   : true,
			autoHeight : false,
			autoWidth  : false,

			autoResize  : true,
			autoCenter  : !isTouch,
			fitToView   : true,
			aspectRatio : false,
			topRatio    : 0.5,
			leftRatio   : 0.5,

			scrolling : 'auto', // 'auto', 'yes' or 'no'
			wrapCSS   : '',

			arrows     : true,
			closeBtn   : true,
			closeClick : false,
			nextClick  : false,
			mouseWheel : true,
			autoPlay   : false,
			playSpeed  : 3000,
			preload    : 3,
			modal      : false,
			loop       : true,

			ajax  : {
				dataType : 'html',
				headers  : { 'X-fancyBox': true }
			},
			iframe : {
				scrolling : 'auto',
				preload   : true
			},
			swf : {
				wmode: 'transparent',
				allowfullscreen   : 'true',
				allowscriptaccess : 'always'
			},

			keys  : {
				next : {
					13 : 'left', // enter
					34 : 'up',   // page down
					39 : 'left', // right arrow
					40 : 'up'    // down arrow
				},
				prev : {
					8  : 'right',  // backspace
					33 : 'down',   // page up
					37 : 'right',  // left arrow
					38 : 'down'    // up arrow
				},
				close  : [27], // escape key
				play   : [32], // space - start/stop slideshow
				toggle : [70]  // letter "f" - toggle fullscreen
			},

			direction : {
				next : 'left',
				prev : 'right'
			},

			scrollOutside  : true,

			// Override some properties
			index   : 0,
			type    : null,
			href    : null,
			content : null,
			title   : null,

			// HTML templates
			tpl: {
				wrap     : '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
				image    : '<img class="fancybox-image" src="{href}" alt="" />',
				iframe   : '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>',
				error    : '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn : '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',
				next     : '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',
				prev     : '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect  : 'fade', // 'elastic', 'fade' or 'none'
			openSpeed   : 250,
			openEasing  : 'swing',
			openOpacity : true,
			openMethod  : 'zoomIn',

			// Closing fancyBox
			closeEffect  : 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed   : 250,
			closeEasing  : 'swing',
			closeOpacity : true,
			closeMethod  : 'zoomOut',

			// Changing next gallery item
			nextEffect : 'elastic', // 'elastic', 'fade' or 'none'
			nextSpeed  : 250,
			nextEasing : 'swing',
			nextMethod : 'changeIn',

			// Changing previous gallery item
			prevEffect : 'elastic', // 'elastic', 'fade' or 'none'
			prevSpeed  : 250,
			prevEasing : 'swing',
			prevMethod : 'changeOut',

			// Enable default helpers
			helpers : {
				overlay : true,
				title   : true
			},

			// Callbacks
			onCancel     : $.noop, // If canceling
			beforeLoad   : $.noop, // Before loading
			afterLoad    : $.noop, // After loading
			beforeShow   : $.noop, // Before changing in current item
			afterShow    : $.noop, // After opening
			beforeChange : $.noop, // Before changing gallery item
			beforeClose  : $.noop, // Before closing
			afterClose   : $.noop  // After closing
		},

		//Current state
		group    : {}, // Selected group
		opts     : {}, // Group options
		previous : null,  // Previous element
		coming   : null,  // Element being loaded
		current  : null,  // Currently loaded element
		isActive : false, // Is activated
		isOpen   : false, // Is currently open
		isOpened : false, // Have been fully opened at least once

		wrap  : null,
		skin  : null,
		outer : null,
		inner : null,

		player : {
			timer    : null,
			isActive : false
		},

		// Loaders
		ajaxLoad   : null,
		imgPreload : null,

		// Some collections
		transitions : {},
		helpers     : {},

		/*
		 *	Static methods
		 */

		open: function (group, opts) {
			if (!group) {
				return;
			}

			if (!$.isPlainObject(opts)) {
				opts = {};
			}

			// Close if already active
			if (false === F.close(true)) {
				return;
			}

			// Normalize group
			if (!$.isArray(group)) {
				group = isQuery(group) ? $(group).get() : [group];
			}

			// Recheck if the type of each element is `object` and set content type (image, ajax, etc)
			$.each(group, function(i, element) {
				var obj = {},
					href,
					title,
					content,
					type,
					rez,
					hrefParts,
					selector;

				if ($.type(element) === "object") {
					// Check if is DOM element
					if (element.nodeType) {
						element = $(element);
					}

					if (isQuery(element)) {
						obj = {
							href    : element.data('fancybox-href') || element.attr('href'),
							title   : element.data('fancybox-title') || element.attr('title'),
							isDom   : true,
							element : element
						};

						if ($.metadata) {
							$.extend(true, obj, element.metadata());
						}

					} else {
						obj = element;
					}
				}

				href  = opts.href  || obj.href || (isString(element) ? element : null);
				title = opts.title !== undefined ? opts.title : obj.title || '';

				content = opts.content || obj.content;
				type    = content ? 'html' : (opts.type  || obj.type);

				if (!type && obj.isDom) {
					type = element.data('fancybox-type');

					if (!type) {
						rez  = element.prop('class').match(/fancybox\.(\w+)/);
						type = rez ? rez[1] : null;
					}
				}

				if (isString(href)) {
					// Try to guess the content type
					if (!type) {
						if (F.isImage(href)) {
							type = 'image';

						} else if (F.isSWF(href)) {
							type = 'swf';

						} else if (href.charAt(0) === '#') {
							type = 'inline';

						} else if (isString(element)) {
							type    = 'html';
							content = element;
						}
					}

					// Split url into two pieces with source url and content selector, e.g,
					// "/mypage.html #my_id" will load "/mypage.html" and display element having id "my_id"
					if (type === 'ajax') {
						hrefParts = href.split(/\s+/, 2);
						href      = hrefParts.shift();
						selector  = hrefParts.shift();
					}
				}

				if (!content) {
					if (type === 'inline') {
						if (href) {
							content = $( isString(href) ? href.replace(/.*(?=#[^\s]+$)/, '') : href ); //strip for ie7

						} else if (obj.isDom) {
							content = element;
						}

					} else if (type === 'html') {
						content = href;

					} else if (!type && !href && obj.isDom) {
						type    = 'inline';
						content = element;
					}
				}

				$.extend(obj, {
					href     : href,
					type     : type,
					content  : content,
					title    : title,
					selector : selector
				});

				group[ i ] = obj;
			});

			// Extend the defaults
			F.opts = $.extend(true, {}, F.defaults, opts);

			// All options are merged recursive except keys
			if (opts.keys !== undefined) {
				F.opts.keys = opts.keys ? $.extend({}, F.defaults.keys, opts.keys) : false;
			}

			F.group = group;

			return F._start(F.opts.index);
		},

		// Cancel image loading or abort ajax request
		cancel: function () {
			var coming = F.coming;

			if (!coming || false === F.trigger('onCancel')) {
				return;
			}

			F.hideLoading();

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onerror = null;
			}

			if (coming.wrap) {
				coming.wrap.stop(true, true).trigger('onReset').remove();
			}

			F.coming = null;

			// If the first item has been canceled, then clear everything
			if (!F.current) {
				F._afterZoomOut( coming );
			}
		},

		// Start closing animation if is open; remove immediately if opening/closing
		close: function (event) {
			F.cancel();

			if (false === F.trigger('beforeClose')) {
				return;
			}

			F.unbindEvents();

			if (!F.isActive) {
				return;
			}

			if (!F.isOpen || event === true) {
				$('.fancybox-wrap').stop(true).trigger('onReset').remove();

				F._afterZoomOut();

			} else {
				F.isOpen = F.isOpened = false;
				F.isClosing = true;

				$('.fancybox-item, .fancybox-nav').remove();

				F.wrap.stop(true, true).removeClass('fancybox-opened');

				F.transitions[ F.current.closeMethod ]();
			}
		},

		// Manage slideshow:
		//   $.fancybox.play(); - toggle slideshow
		//   $.fancybox.play( true ); - start
		//   $.fancybox.play( false ); - stop
		play: function ( action ) {
			var clear = function () {
					clearTimeout(F.player.timer);
				},
				set = function () {
					clear();

					if (F.current && F.player.isActive) {
						F.player.timer = setTimeout(F.next, F.current.playSpeed);
					}
				},
				stop = function () {
					clear();

					D.unbind('.player');

					F.player.isActive = false;

					F.trigger('onPlayEnd');
				},
				start = function () {
					if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
						F.player.isActive = true;

						D.bind({
							'onCancel.player beforeClose.player' : stop,
							'onUpdate.player'   : set,
							'beforeLoad.player' : clear
						});

						set();

						F.trigger('onPlayStart');
					}
				};

			if (action === true || (!F.player.isActive && action !== false)) {
				start();
			} else {
				stop();
			}
		},

		// Navigate to next gallery item
		next: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.next;
				}

				F.jumpto(current.index + 1, direction, 'next');
			}
		},

		// Navigate to previous gallery item
		prev: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.prev;
				}

				F.jumpto(current.index - 1, direction, 'prev');
			}
		},

		// Navigate to gallery item by index
		jumpto: function ( index, direction, router ) {
			var current = F.current;

			if (!current) {
				return;
			}

			index = getScalar(index);

			F.direction = direction || current.direction[ (index >= current.index ? 'next' : 'prev') ];
			F.router    = router || 'jumpto';

			if (current.loop) {
				if (index < 0) {
					index = current.group.length + (index % current.group.length);
				}

				index = index % current.group.length;
			}

			if (current.group[ index ] !== undefined) {
				F.cancel();

				F._start(index);
			}
		},

		// Center inside viewport and toggle position type to fixed or absolute if needed
		reposition: function (e, onlyAbsolute) {
			var current = F.current,
				wrap    = current ? current.wrap : null,
				pos;

			if (wrap) {
				pos = F._getPosition(onlyAbsolute);

				if (e && e.type === 'scroll') {
					delete pos.position;

					wrap.stop(true, true).animate(pos, 200);

				} else {
					wrap.css(pos);

					current.pos = $.extend({}, current.dim, pos);
				}
			}
		},

		update: function (e) {
			var type = (e && e.type),
				anyway = !type || type === 'orientationchange';

			if (anyway) {
				clearTimeout(didUpdate);

				didUpdate = null;
			}

			if (!F.isOpen || didUpdate) {
				return;
			}

			didUpdate = setTimeout(function() {
				var current = F.current;

				if (!current || F.isClosing) {
					return;
				}

				F.wrap.removeClass('fancybox-tmp');

				if (anyway || type === 'load' || (type === 'resize' && current.autoResize)) {
					F._setDimension();
				}

				if (!(type === 'scroll' && current.canShrink)) {
					F.reposition(e);
				}

				F.trigger('onUpdate');

				didUpdate = null;

			}, (anyway && !isTouch ? 0 : 300));
		},

		// Shrink content to fit inside viewport or restore if resized
		toggle: function ( action ) {
			if (F.isOpen) {
				F.current.fitToView = $.type(action) === "boolean" ? action : !F.current.fitToView;

				// Help browser to restore document dimensions
				if (isTouch) {
					F.wrap.removeAttr('style').addClass('fancybox-tmp');

					F.trigger('onUpdate');
				}

				F.update();
			}
		},

		hideLoading: function () {
			D.unbind('.loading');

			$('#fancybox-loading').remove();
		},

		showLoading: function () {
			var el, viewport;

			F.hideLoading();

			el = $('<div id="fancybox-loading"><div></div></div>').click(F.cancel).appendTo('body');

			// If user will press the escape-button, the request will be canceled
			D.bind('keydown.loading', function(e) {
				if ((e.which || e.keyCode) === 27) {
					e.preventDefault();

					F.cancel();
				}
			});

			if (!F.defaults.fixed) {
				viewport = F.getViewport();

				el.css({
					position : 'absolute',
					top  : (viewport.h * 0.5) + viewport.y,
					left : (viewport.w * 0.5) + viewport.x
				});
			}
		},

		getViewport: function () {
			var locked = (F.current && F.current.locked) || false,
				rez    = {
					x: W.scrollLeft(),
					y: W.scrollTop()
				};

			if (locked) {
				rez.w = locked[0].clientWidth;
				rez.h = locked[0].clientHeight;

			} else {
				// See http://bugs.jquery.com/ticket/6724
				rez.w = isTouch && window.innerWidth  ? window.innerWidth  : W.width();
				rez.h = isTouch && window.innerHeight ? window.innerHeight : W.height();
			}

			return rez;
		},

		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (F.wrap && isQuery(F.wrap)) {
				F.wrap.unbind('.fb');
			}

			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents: function () {
			var current = F.current,
				keys;

			if (!current) {
				return;
			}

			// Changing document height on iOS devices triggers a 'resize' event,
			// that can change document height... repeating infinitely
			W.bind('orientationchange.fb' + (isTouch ? '' : ' resize.fb') + (current.autoCenter && !current.locked ? ' scroll.fb' : ''), F.update);

			keys = current.keys;

			if (keys) {
				D.bind('keydown.fb', function (e) {
					var code   = e.which || e.keyCode,
						target = e.target || e.srcElement;

					// Skip esc key if loading, because showLoading will cancel preloading
					if (code === 27 && F.coming) {
						return false;
					}

					// Ignore key combinations and key events within form elements
					if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && !(target && (target.type || $(target).is('[contenteditable]')))) {
						$.each(keys, function(i, val) {
							if (current.group.length > 1 && val[ code ] !== undefined) {
								F[ i ]( val[ code ] );

								e.preventDefault();
								return false;
							}

							if ($.inArray(code, val) > -1) {
								F[ i ] ();

								e.preventDefault();
								return false;
							}
						});
					}
				});
			}

			if ($.fn.mousewheel && current.mouseWheel) {
				F.wrap.bind('mousewheel.fb', function (e, delta, deltaX, deltaY) {
					var target = e.target || null,
						parent = $(target),
						canScroll = false;

					while (parent.length) {
						if (canScroll || parent.is('.fancybox-skin') || parent.is('.fancybox-wrap')) {
							break;
						}

						canScroll = isScrollable( parent[0] );
						parent    = $(parent).parent();
					}

					if (delta !== 0 && !canScroll) {
						if (F.group.length > 1 && !current.canShrink) {
							if (deltaY > 0 || deltaX > 0) {
								F.prev( deltaY > 0 ? 'down' : 'left' );

							} else if (deltaY < 0 || deltaX < 0) {
								F.next( deltaY < 0 ? 'up' : 'right' );
							}

							e.preventDefault();
						}
					}
				});
			}
		},

		trigger: function (event, o) {
			var ret, obj = o || F.coming || F.current;

			if (!obj) {
				return;
			}

			if ($.isFunction( obj[event] )) {
				ret = obj[event].apply(obj, Array.prototype.slice.call(arguments, 1));
			}

			if (ret === false) {
				return false;
			}

			if (obj.helpers) {
				$.each(obj.helpers, function (helper, opts) {
					if (opts && F.helpers[helper] && $.isFunction(F.helpers[helper][event])) {
						F.helpers[helper][event]($.extend(true, {}, F.helpers[helper].defaults, opts), obj);
					}
				});
			}

			D.trigger(event);
		},

		isImage: function (str) {
			return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
		},

		isSWF: function (str) {
			return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
		},

		_start: function (index) {
			var coming = {},
				obj,
				href,
				type,
				margin,
				padding;

			index = getScalar( index );
			obj   = F.group[ index ] || null;

			if (!obj) {
				return false;
			}

			coming = $.extend(true, {}, F.opts, obj);

			// Convert margin and padding properties to array - top, right, bottom, left
			margin  = coming.margin;
			padding = coming.padding;

			if ($.type(margin) === 'number') {
				coming.margin = [margin, margin, margin, margin];
			}

			if ($.type(padding) === 'number') {
				coming.padding = [padding, padding, padding, padding];
			}

			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					closeBtn   : false,
					closeClick : false,
					nextClick  : false,
					arrows     : false,
					mouseWheel : false,
					keys       : null,
					helpers: {
						overlay : {
							closeClick : false
						}
					}
				});
			}

			// 'autoSize' property is a shortcut, too
			if (coming.autoSize) {
				coming.autoWidth = coming.autoHeight = true;
			}

			if (coming.width === 'auto') {
				coming.autoWidth = true;
			}

			if (coming.height === 'auto') {
				coming.autoHeight = true;
			}

			/*
			 * Add reference to the group, so it`s possible to access from callbacks, example:
			 * afterLoad : function() {
			 *     this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
			 * }
			 */

			coming.group  = F.group;
			coming.index  = index;

			// Give a chance for callback or helpers to update coming item (type, title, etc)
			F.coming = coming;

			if (false === F.trigger('beforeLoad')) {
				F.coming = null;

				return;
			}

			type = coming.type;
			href = coming.href;

			if (!type) {
				F.coming = null;

				//If we can not determine content type then drop silently or display next/prev item if looping through gallery
				if (F.current && F.router && F.router !== 'jumpto') {
					F.current.index = index;

					return F[ F.router ]( F.direction );
				}

				return false;
			}

			F.isActive = true;

			if (type === 'image' || type === 'swf') {
				coming.autoHeight = coming.autoWidth = false;
				coming.scrolling  = 'visible';
			}

			if (type === 'image') {
				coming.aspectRatio = true;
			}

			if (type === 'iframe' && isTouch) {
				coming.scrolling = 'scroll';
			}

			// Build the neccessary markup
			coming.wrap = $(coming.tpl.wrap).addClass('fancybox-' + (isTouch ? 'mobile' : 'desktop') + ' fancybox-type-' + type + ' fancybox-tmp ' + coming.wrapCSS).appendTo( coming.parent || 'body' );

			$.extend(coming, {
				skin  : $('.fancybox-skin',  coming.wrap),
				outer : $('.fancybox-outer', coming.wrap),
				inner : $('.fancybox-inner', coming.wrap)
			});

			$.each(["Top", "Right", "Bottom", "Left"], function(i, v) {
				coming.skin.css('padding' + v, getValue(coming.padding[ i ]));
			});

			F.trigger('onReady');

			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content || !coming.content.length) {
					return F._error( 'content' );
				}

			} else if (!href) {
				return F._error( 'href' );
			}

			if (type === 'image') {
				F._loadImage();

			} else if (type === 'ajax') {
				F._loadAjax();

			} else if (type === 'iframe') {
				F._loadIframe();

			} else {
				F._afterLoad();
			}
		},

		_error: function ( type ) {
			$.extend(F.coming, {
				type       : 'html',
				autoWidth  : true,
				autoHeight : true,
				minWidth   : 0,
				minHeight  : 0,
				scrolling  : 'no',
				hasError   : type,
				content    : F.coming.tpl.error
			});

			F._afterLoad();
		},

		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			var img = F.imgPreload = new Image();

			img.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width  = this.width / F.opts.pixelRatio;
				F.coming.height = this.height / F.opts.pixelRatio;

				F._afterLoad();
			};

			img.onerror = function () {
				this.onload = this.onerror = null;

				F._error( 'image' );
			};

			img.src = F.coming.href;

			if (img.complete !== true) {
				F.showLoading();
			}
		},

		_loadAjax: function () {
			var coming = F.coming;

			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, coming.ajax, {
				url: coming.href,
				error: function (jqXHR, textStatus) {
					if (F.coming && textStatus !== 'abort') {
						F._error( 'ajax', jqXHR );

					} else {
						F.hideLoading();
					}
				},
				success: function (data, textStatus) {
					if (textStatus === 'success') {
						coming.content = data;

						F._afterLoad();
					}
				}
			}));
		},

		_loadIframe: function() {
			var coming = F.coming,
				iframe = $(coming.tpl.iframe.replace(/\{rnd\}/g, new Date().getTime()))
					.attr('scrolling', isTouch ? 'auto' : coming.iframe.scrolling)
					.attr('src', coming.href);

			// This helps IE
			$(coming.wrap).bind('onReset', function () {
				try {
					$(this).find('iframe').hide().attr('src', '//about:blank').end().empty();
				} catch (e) {}
			});

			if (coming.iframe.preload) {
				F.showLoading();

				iframe.one('load', function() {
					$(this).data('ready', 1);

					// iOS will lose scrolling if we resize
					if (!isTouch) {
						$(this).bind('load.fb', F.update);
					}

					// Without this trick:
					//   - iframe won't scroll on iOS devices
					//   - IE7 sometimes displays empty iframe
					$(this).parents('.fancybox-wrap').width('100%').removeClass('fancybox-tmp').show();

					F._afterLoad();
				});
			}

			coming.content = iframe.appendTo( coming.inner );

			if (!coming.iframe.preload) {
				F._afterLoad();
			}
		},

		_preloadImages: function() {
			var group   = F.group,
				current = F.current,
				len     = group.length,
				cnt     = current.preload ? Math.min(current.preload, len - 1) : 0,
				item,
				i;

			for (i = 1; i <= cnt; i += 1) {
				item = group[ (current.index + i ) % len ];

				if (item.type === 'image' && item.href) {
					new Image().src = item.href;
				}
			}
		},

		_afterLoad: function () {
			var coming   = F.coming,
				previous = F.current,
				placeholder = 'fancybox-placeholder',
				current,
				content,
				type,
				scrolling,
				href,
				embed;

			F.hideLoading();

			if (!coming || F.isActive === false) {
				return;
			}

			if (false === F.trigger('afterLoad', coming, previous)) {
				coming.wrap.stop(true).trigger('onReset').remove();

				F.coming = null;

				return;
			}

			if (previous) {
				F.trigger('beforeChange', previous);

				previous.wrap.stop(true).removeClass('fancybox-opened')
					.find('.fancybox-item, .fancybox-nav')
					.remove();
			}

			F.unbindEvents();

			current   = coming;
			content   = coming.content;
			type      = coming.type;
			scrolling = coming.scrolling;

			$.extend(F, {
				wrap  : current.wrap,
				skin  : current.skin,
				outer : current.outer,
				inner : current.inner,
				current  : current,
				previous : previous
			});

			href = current.href;

			switch (type) {
				case 'inline':
				case 'ajax':
				case 'html':
					if (current.selector) {
						content = $('<div>').html(content).find(current.selector);

					} else if (isQuery(content)) {
						if (!content.data(placeholder)) {
							content.data(placeholder, $('<div class="' + placeholder + '"></div>').insertAfter( content ).hide() );
						}

						content = content.show().detach();

						current.wrap.bind('onReset', function () {
							if ($(this).find(content).length) {
								content.hide().replaceAll( content.data(placeholder) ).data(placeholder, false);
							}
						});
					}
				break;

				case 'image':
					content = current.tpl.image.replace('{href}', href);
				break;

				case 'swf':
					content = '<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + href + '"></param>';
					embed   = '';

					$.each(current.swf, function(name, val) {
						content += '<param name="' + name + '" value="' + val + '"></param>';
						embed   += ' ' + name + '="' + val + '"';
					});

					content += '<embed src="' + href + '" type="application/x-shockwave-flash" width="100%" height="100%"' + embed + '></embed></object>';
				break;
			}

			if (!(isQuery(content) && content.parent().is(current.inner))) {
				current.inner.append( content );
			}

			// Give a chance for helpers or callbacks to update elements
			F.trigger('beforeShow');

			// Set scrolling before calculating dimensions
			current.inner.css('overflow', scrolling === 'yes' ? 'scroll' : (scrolling === 'no' ? 'hidden' : scrolling));

			// Set initial dimensions and start position
			F._setDimension();

			F.reposition();

			F.isOpen = false;
			F.coming = null;

			F.bindEvents();

			if (!F.isOpened) {
				$('.fancybox-wrap').not( current.wrap ).stop(true).trigger('onReset').remove();

			} else if (previous.prevMethod) {
				F.transitions[ previous.prevMethod ]();
			}

			F.transitions[ F.isOpened ? current.nextMethod : current.openMethod ]();

			F._preloadImages();
		},

		_setDimension: function () {
			var viewport   = F.getViewport(),
				steps      = 0,
				canShrink  = false,
				canExpand  = false,
				wrap       = F.wrap,
				skin       = F.skin,
				inner      = F.inner,
				current    = F.current,
				width      = current.width,
				height     = current.height,
				minWidth   = current.minWidth,
				minHeight  = current.minHeight,
				maxWidth   = current.maxWidth,
				maxHeight  = current.maxHeight,
				scrolling  = current.scrolling,
				scrollOut  = current.scrollOutside ? current.scrollbarWidth : 0,
				margin     = current.margin,
				wMargin    = getScalar(margin[1] + margin[3]),
				hMargin    = getScalar(margin[0] + margin[2]),
				wPadding,
				hPadding,
				wSpace,
				hSpace,
				origWidth,
				origHeight,
				origMaxWidth,
				origMaxHeight,
				ratio,
				width_,
				height_,
				maxWidth_,
				maxHeight_,
				iframe,
				body;

			// Reset dimensions so we could re-check actual size
			wrap.add(skin).add(inner).width('auto').height('auto').removeClass('fancybox-tmp');

			wPadding = getScalar(skin.outerWidth(true)  - skin.width());
			hPadding = getScalar(skin.outerHeight(true) - skin.height());

			// Any space between content and viewport (margin, padding, border, title)
			wSpace = wMargin + wPadding;
			hSpace = hMargin + hPadding;

			origWidth  = isPercentage(width)  ? (viewport.w - wSpace) * getScalar(width)  / 100 : width;
			origHeight = isPercentage(height) ? (viewport.h - hSpace) * getScalar(height) / 100 : height;

			if (current.type === 'iframe') {
				iframe = current.content;

				if (current.autoHeight && iframe.data('ready') === 1) {
					try {
						if (iframe[0].contentWindow.document.location) {
							inner.width( origWidth ).height(9999);

							body = iframe.contents().find('body');

							if (scrollOut) {
								body.css('overflow-x', 'hidden');
							}

							origHeight = body.outerHeight(true);
						}

					} catch (e) {}
				}

			} else if (current.autoWidth || current.autoHeight) {
				inner.addClass( 'fancybox-tmp' );

				// Set width or height in case we need to calculate only one dimension
				if (!current.autoWidth) {
					inner.width( origWidth );
				}

				if (!current.autoHeight) {
					inner.height( origHeight );
				}

				if (current.autoWidth) {
					origWidth = inner.width();
				}

				if (current.autoHeight) {
					origHeight = inner.height();
				}

				inner.removeClass( 'fancybox-tmp' );
			}

			width  = getScalar( origWidth );
			height = getScalar( origHeight );

			ratio  = origWidth / origHeight;

			// Calculations for the content
			minWidth  = getScalar(isPercentage(minWidth) ? getScalar(minWidth, 'w') - wSpace : minWidth);
			maxWidth  = getScalar(isPercentage(maxWidth) ? getScalar(maxWidth, 'w') - wSpace : maxWidth);

			minHeight = getScalar(isPercentage(minHeight) ? getScalar(minHeight, 'h') - hSpace : minHeight);
			maxHeight = getScalar(isPercentage(maxHeight) ? getScalar(maxHeight, 'h') - hSpace : maxHeight);

			// These will be used to determine if wrap can fit in the viewport
			origMaxWidth  = maxWidth;
			origMaxHeight = maxHeight;

			if (current.fitToView) {
				maxWidth  = Math.min(viewport.w - wSpace, maxWidth);
				maxHeight = Math.min(viewport.h - hSpace, maxHeight);
			}

			maxWidth_  = viewport.w - wMargin;
			maxHeight_ = viewport.h - hMargin;

			if (current.aspectRatio) {
				if (width > maxWidth) {
					width  = maxWidth;
					height = getScalar(width / ratio);
				}

				if (height > maxHeight) {
					height = maxHeight;
					width  = getScalar(height * ratio);
				}

				if (width < minWidth) {
					width  = minWidth;
					height = getScalar(width / ratio);
				}

				if (height < minHeight) {
					height = minHeight;
					width  = getScalar(height * ratio);
				}

			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));

				if (current.autoHeight && current.type !== 'iframe') {
					inner.width( width );

					height = inner.height();
				}

				height = Math.max(minHeight, Math.min(height, maxHeight));
			}

			// Try to fit inside viewport (including the title)
			if (current.fitToView) {
				inner.width( width ).height( height );

				wrap.width( width + wPadding );

				// Real wrap dimensions
				width_  = wrap.width();
				height_ = wrap.height();

				if (current.aspectRatio) {
					while ((width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight) {
						if (steps++ > 19) {
							break;
						}

						height = Math.max(minHeight, Math.min(maxHeight, height - 10));
						width  = getScalar(height * ratio);

						if (width < minWidth) {
							width  = minWidth;
							height = getScalar(width / ratio);
						}

						if (width > maxWidth) {
							width  = maxWidth;
							height = getScalar(width / ratio);
						}

						inner.width( width ).height( height );

						wrap.width( width + wPadding );

						width_  = wrap.width();
						height_ = wrap.height();
					}

				} else {
					width  = Math.max(minWidth,  Math.min(width,  width  - (width_  - maxWidth_)));
					height = Math.max(minHeight, Math.min(height, height - (height_ - maxHeight_)));
				}
			}

			if (scrollOut && scrolling === 'auto' && height < origHeight && (width + wPadding + scrollOut) < maxWidth_) {
				width += scrollOut;
			}

			inner.width( width ).height( height );

			wrap.width( width + wPadding );

			width_  = wrap.width();
			height_ = wrap.height();

			canShrink = (width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight;
			canExpand = current.aspectRatio ? (width < origMaxWidth && height < origMaxHeight && width < origWidth && height < origHeight) : ((width < origMaxWidth || height < origMaxHeight) && (width < origWidth || height < origHeight));

			$.extend(current, {
				dim : {
					width	: getValue( width_ ),
					height	: getValue( height_ )
				},
				origWidth  : origWidth,
				origHeight : origHeight,
				canShrink  : canShrink,
				canExpand  : canExpand,
				wPadding   : wPadding,
				hPadding   : hPadding,
				wrapSpace  : height_ - skin.outerHeight(true),
				skinSpace  : skin.height() - height
			});

			if (!iframe && current.autoHeight && height > minHeight && height < maxHeight && !canExpand) {
				inner.height('auto');
			}
		},

		_getPosition: function (onlyAbsolute) {
			var current  = F.current,
				viewport = F.getViewport(),
				margin   = current.margin,
				width    = F.wrap.width()  + margin[1] + margin[3],
				height   = F.wrap.height() + margin[0] + margin[2],
				rez      = {
					position: 'absolute',
					top  : margin[0],
					left : margin[3]
				};

			if (current.autoCenter && current.fixed && !onlyAbsolute && height <= viewport.h && width <= viewport.w) {
				rez.position = 'fixed';

			} else if (!current.locked) {
				rez.top  += viewport.y;
				rez.left += viewport.x;
			}

			rez.top  = getValue(Math.max(rez.top,  rez.top  + ((viewport.h - height) * current.topRatio)));
			rez.left = getValue(Math.max(rez.left, rez.left + ((viewport.w - width)  * current.leftRatio)));

			return rez;
		},

		_afterZoomIn: function () {
			var current = F.current;

			if (!current) {
				return;
			}

			F.isOpen = F.isOpened = true;

			F.wrap.css('overflow', 'visible').addClass('fancybox-opened');

			F.update();

			// Assign a click event
			if ( current.closeClick || (current.nextClick && F.group.length > 1) ) {
				F.inner.css('cursor', 'pointer').bind('click.fb', function(e) {
					if (!$(e.target).is('a') && !$(e.target).parent().is('a')) {
						e.preventDefault();

						F[ current.closeClick ? 'close' : 'next' ]();
					}
				});
			}

			// Create a close button
			if (current.closeBtn) {
				$(current.tpl.closeBtn).appendTo(F.skin).bind('click.fb', function(e) {
					e.preventDefault();

					F.close();
				});
			}

			// Create navigation arrows
			if (current.arrows && F.group.length > 1) {
				if (current.loop || current.index > 0) {
					$(current.tpl.prev).appendTo(F.outer).bind('click.fb', F.prev);
				}

				if (current.loop || current.index < F.group.length - 1) {
					$(current.tpl.next).appendTo(F.outer).bind('click.fb', F.next);
				}
			}

			F.trigger('afterShow');

			// Stop the slideshow if this is the last item
			if (!current.loop && current.index === current.group.length - 1) {
				F.play( false );

			} else if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay = false;

				F.play();
			}
		},

		_afterZoomOut: function ( obj ) {
			obj = obj || F.current;

			$('.fancybox-wrap').trigger('onReset').remove();

			$.extend(F, {
				group  : {},
				opts   : {},
				router : false,
				current   : null,
				isActive  : false,
				isOpened  : false,
				isOpen    : false,
				isClosing : false,
				wrap   : null,
				skin   : null,
				outer  : null,
				inner  : null
			});

			F.trigger('afterClose', obj);
		}
	});

	/*
	 *	Default transitions
	 */

	F.transitions = {
		getOrigPosition: function () {
			var current  = F.current,
				element  = current.element,
				orig     = current.orig,
				pos      = {},
				width    = 50,
				height   = 50,
				hPadding = current.hPadding,
				wPadding = current.wPadding,
				viewport = F.getViewport();

			if (!orig && current.isDom && element.is(':visible')) {
				orig = element.find('img:first');

				if (!orig.length) {
					orig = element;
				}
			}

			if (isQuery(orig)) {
				pos = orig.offset();

				if (orig.is('img')) {
					width  = orig.outerWidth();
					height = orig.outerHeight();
				}

			} else {
				pos.top  = viewport.y + (viewport.h - height) * current.topRatio;
				pos.left = viewport.x + (viewport.w - width)  * current.leftRatio;
			}

			if (F.wrap.css('position') === 'fixed' || current.locked) {
				pos.top  -= viewport.y;
				pos.left -= viewport.x;
			}

			pos = {
				top     : getValue(pos.top  - hPadding * current.topRatio),
				left    : getValue(pos.left - wPadding * current.leftRatio),
				width   : getValue(width  + wPadding),
				height  : getValue(height + hPadding)
			};

			return pos;
		},

		step: function (now, fx) {
			var ratio,
				padding,
				value,
				prop       = fx.prop,
				current    = F.current,
				wrapSpace  = current.wrapSpace,
				skinSpace  = current.skinSpace;

			if (prop === 'width' || prop === 'height') {
				ratio = fx.end === fx.start ? 1 : (now - fx.start) / (fx.end - fx.start);

				if (F.isClosing) {
					ratio = 1 - ratio;
				}

				padding = prop === 'width' ? current.wPadding : current.hPadding;
				value   = now - padding;

				F.skin[ prop ](  getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) ) );
				F.inner[ prop ]( getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) - (skinSpace * ratio) ) );
			}
		},

		zoomIn: function () {
			var current  = F.current,
				startPos = current.pos,
				effect   = current.openEffect,
				elastic  = effect === 'elastic',
				endPos   = $.extend({opacity : 1}, startPos);

			// Remove "position" property that breaks older IE
			delete endPos.position;

			if (elastic) {
				startPos = this.getOrigPosition();

				if (current.openOpacity) {
					startPos.opacity = 0.1;
				}

			} else if (effect === 'fade') {
				startPos.opacity = 0.1;
			}

			F.wrap.css(startPos).animate(endPos, {
				duration : effect === 'none' ? 0 : current.openSpeed,
				easing   : current.openEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomIn
			});
		},

		zoomOut: function () {
			var current  = F.current,
				effect   = current.closeEffect,
				elastic  = effect === 'elastic',
				endPos   = {opacity : 0.1};

			if (elastic) {
				endPos = this.getOrigPosition();

				if (current.closeOpacity) {
					endPos.opacity = 0.1;
				}
			}

			F.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : current.closeSpeed,
				easing   : current.closeEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomOut
			});
		},

		changeIn: function () {
			var current   = F.current,
				effect    = current.nextEffect,
				startPos  = current.pos,
				endPos    = { opacity : 1 },
				direction = F.direction,
				distance  = 200,
				field;

			startPos.opacity = 0.1;

			if (effect === 'elastic') {
				field = direction === 'down' || direction === 'up' ? 'top' : 'left';

				if (direction === 'down' || direction === 'right') {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) - distance);
					endPos[ field ]   = '+=' + distance + 'px';

				} else {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) + distance);
					endPos[ field ]   = '-=' + distance + 'px';
				}
			}

			// Workaround for http://bugs.jquery.com/ticket/12273
			if (effect === 'none') {
				F._afterZoomIn();

			} else {
				F.wrap.css(startPos).animate(endPos, {
					duration : current.nextSpeed,
					easing   : current.nextEasing,
					complete : F._afterZoomIn
				});
			}
		},

		changeOut: function () {
			var previous  = F.previous,
				effect    = previous.prevEffect,
				endPos    = { opacity : 0.1 },
				direction = F.direction,
				distance  = 200;

			if (effect === 'elastic') {
				endPos[ direction === 'down' || direction === 'up' ? 'top' : 'left' ] = ( direction === 'up' || direction === 'left' ? '-' : '+' ) + '=' + distance + 'px';
			}

			previous.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : previous.prevSpeed,
				easing   : previous.prevEasing,
				complete : function () {
					$(this).trigger('onReset').remove();
				}
			});
		}
	};

	/*
	 *	Overlay helper
	 */

	F.helpers.overlay = {
		defaults : {
			closeClick : true,      // if true, fancyBox will be closed when user clicks on the overlay
			speedOut   : 200,       // duration of fadeOut animation
			showEarly  : true,      // indicates if should be opened immediately or wait until the content is ready
			css        : {},        // custom CSS properties
			locked     : !isTouch,  // if true, the content will be locked into overlay
			fixed      : true       // if false, the overlay CSS position property will not be set to "fixed"
		},

		overlay : null,      // current handle
		fixed   : false,     // indicates if the overlay has position "fixed"
		el      : $('html'), // element that contains "the lock"

		// Public methods
		create : function(opts) {
			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.close();
			}

			this.overlay = $('<div class="fancybox-overlay"></div>').appendTo( F.coming ? F.coming.parent : opts.parent );
			this.fixed   = false;

			if (opts.fixed && F.defaults.fixed) {
				this.overlay.addClass('fancybox-overlay-fixed');

				this.fixed = true;
			}
		},

		open : function(opts) {
			var that = this;

			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.overlay.unbind('.overlay').width('auto').height('auto');

			} else {
				this.create(opts);
			}

			if (!this.fixed) {
				W.bind('resize.overlay', $.proxy( this.update, this) );

				this.update();
			}

			if (opts.closeClick) {
				this.overlay.bind('click.overlay', function(e) {
					if ($(e.target).hasClass('fancybox-overlay')) {
						if (F.isActive) {
							F.close();
						} else {
							that.close();
						}

						return false;
					}
				});
			}

			this.overlay.css( opts.css ).show();
		},

		close : function() {
			var scrollV, scrollH;

			W.unbind('resize.overlay');

			if (this.el.hasClass('fancybox-lock')) {
				$('.fancybox-margin').removeClass('fancybox-margin');

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.removeClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			$('.fancybox-overlay').remove().hide();

			$.extend(this, {
				overlay : null,
				fixed   : false
			});
		},

		// Private, callbacks

		update : function () {
			var width = '100%', offsetWidth;

			// Reset width/height so it will not mess
			this.overlay.width(width).height('100%');

			// jQuery does not return reliable result for IE
			if (IE) {
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				if (D.width() > offsetWidth) {
					width = D.width();
				}

			} else if (D.width() > W.width()) {
				width = D.width();
			}

			this.overlay.width(width).height(D.height());
		},

		// This is where we can manipulate DOM, because later it would cause iframes to reload
		onReady : function (opts, obj) {
			var overlay = this.overlay;

			$('.fancybox-overlay').stop(true, true);

			if (!overlay) {
				this.create(opts);
			}

			if (opts.locked && this.fixed && obj.fixed) {
				if (!overlay) {
					this.margin = D.height() > W.height() ? $('html').css('margin-right').replace("px", "") : false;
				}

				obj.locked = this.overlay.append( obj.wrap );
				obj.fixed  = false;
			}

			if (opts.showEarly === true) {
				this.beforeShow.apply(this, arguments);
			}
		},

		beforeShow : function(opts, obj) {
			var scrollV, scrollH;

			if (obj.locked) {
				if (this.margin !== false) {
					$('*').filter(function(){
						return ($(this).css('position') === 'fixed' && !$(this).hasClass("fancybox-overlay") && !$(this).hasClass("fancybox-wrap") );
					}).addClass('fancybox-margin');

					this.el.addClass('fancybox-margin');
				}

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.addClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			this.open(opts);
		},

		onUpdate : function() {
			if (!this.fixed) {
				this.update();
			}
		},

		afterClose: function (opts) {
			// Remove overlay if exists and fancyBox is not opening
			// (e.g., it is not being open using afterClose callback)
			//if (this.overlay && !F.isActive) {
			if (this.overlay && !F.coming) {
				this.overlay.fadeOut(opts.speedOut, $.proxy( this.close, this ));
			}
		}
	};

	/*
	 *	Title helper
	 */

	F.helpers.title = {
		defaults : {
			type     : 'float', // 'float', 'inside', 'outside' or 'over',
			position : 'bottom' // 'top' or 'bottom'
		},

		beforeShow: function (opts) {
			var current = F.current,
				text    = current.title,
				type    = opts.type,
				title,
				target;

			if ($.isFunction(text)) {
				text = text.call(current.element, current);
			}

			if (!isString(text) || $.trim(text) === '') {
				return;
			}

			title = $('<div class="fancybox-title fancybox-title-' + type + '-wrap">' + text + '</div>');

			switch (type) {
				case 'inside':
					target = F.skin;
				break;

				case 'outside':
					target = F.wrap;
				break;

				case 'over':
					target = F.inner;
				break;

				default: // 'float'
					target = F.skin;

					title.appendTo('body');

					if (IE) {
						title.width( title.width() );
					}

					title.wrapInner('<span class="child"></span>');

					//Increase bottom margin so this title will also fit into viewport
					F.current.margin[2] += Math.abs( getScalar(title.css('margin-bottom')) );
				break;
			}

			title[ (opts.position === 'top' ? 'prependTo'  : 'appendTo') ](target);
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function (options) {
		var index,
			that     = $(this),
			selector = this.selector || '',
			run      = function(e) {
				var what = $(this).blur(), idx = index, relType, relVal;

				if (!(e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) && !what.is('.fancybox-wrap')) {
					relType = options.groupAttr || 'data-fancybox-group';
					relVal  = what.attr(relType);

					if (!relVal) {
						relType = 'rel';
						relVal  = what.get(0)[ relType ];
					}

					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						what = selector.length ? $(selector) : that;
						what = what.filter('[' + relType + '="' + relVal + '"]');
						idx  = what.index(this);
					}

					options.index = idx;

					// Stop an event from bubbling if everything is fine
					if (F.open(what, options) !== false) {
						e.preventDefault();
					}
				}
			};

		options = options || {};
		index   = options.index || 0;

		if (!selector || options.live === false) {
			that.unbind('click.fb-start').bind('click.fb-start', run);

		} else {
			D.undelegate(selector, 'click.fb-start').delegate(selector + ":not('.fancybox-item, .fancybox-nav')", 'click.fb-start', run);
		}

		this.filter('[data-fancybox-start=1]').trigger('click');

		return this;
	};

	// Tests that need a body at doc ready
	D.ready(function() {
		var w1, w2;

		if ( $.scrollbarWidth === undefined ) {
			// http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
			$.scrollbarWidth = function() {
				var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),
					child  = parent.children(),
					width  = child.innerWidth() - child.height( 99 ).innerWidth();

				parent.remove();

				return width;
			};
		}

		if ( $.support.fixedPosition === undefined ) {
			$.support.fixedPosition = (function() {
				var elem  = $('<div style="position:fixed;top:20px;"></div>').appendTo('body'),
					fixed = ( elem[0].offsetTop === 20 || elem[0].offsetTop === 15 );

				elem.remove();

				return fixed;
			}());
		}

		$.extend(F.defaults, {
			scrollbarWidth : $.scrollbarWidth(),
			fixed  : $.support.fixedPosition,
			parent : $('body')
		});

		//Get real width of page scroll-bar
		w1 = $(window).width();

		H.addClass('fancybox-lock-test');

		w2 = $(window).width();

		H.removeClass('fancybox-lock-test');

		$("<style type='text/css'>.fancybox-margin{margin-right:" + (w2 - w1) + "px;}</style>").appendTo("head");
	});

}(window, document, jQuery));
(function() {
  var CheckIfWix, Handle_sidebar_accordion_behavior, bindTracking;

  CheckIfWix = function() {
    if (gon.provider === "wix" && (self === top) && (!gon.is_multi_business)) {
      $.post("/business_logins/sign_out", {
        _method: 'delete'
      }, null, "script");
      return location.href = "/";
    }
  };

  bindTracking = function() {
    if (!gon.block_3th_party) {
      $('#sidebar #nav  a.locked').on('click', function() {
        if ($(this).hasClass('tokens')) {
          woopraTracker.pushEvent({
            name: "Dashboard Reward Tab Locked Clicked"
          });
        }
        if ($(this).hasClass('punch-card')) {
          woopraTracker.pushEvent({
            name: "Dashboard PunchCard Tab Locked Clicked"
          });
        }
        if ($(this).hasClass('statistics2')) {
          woopraTracker.pushEvent({
            name: "Dashboard Statistics Tab Locked Clicked"
          });
        }
        if ($(this).hasClass('email-campaigns')) {
          woopraTracker.pushEvent({
            name: "Dashboard Email Campaings Tab Locked Clicked"
          });
        }
        if ($(this).hasClass('broadcast')) {
          woopraTracker.pushEvent({
            name: "Dashboard Local Notifications Tab Locked Clicked"
          });
        }
        if ($(this).hasClass('members')) {
          return woopraTracker.pushEvent({
            name: "Dashboard  Club Members Tab Locked Clicked"
          });
        }
      });
      $('.crm-locked-button.locked').on('clicked', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard  Club Members Status Cards Page link Locked Clicked"
        });
      });
      $('.automate_checkin_button.locked').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Automate Checkins Locked Clicked"
        });
      });
      $('#rewards-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Reward Lightbox Upgrade Button Clicked"
        });
      });
      $('#punchcard-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard PunchCard Lightbox Upgrade Button Clicked"
        });
      });
      $('#email-campaigns-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Email Campaigns Lightbox Upgrade Button Clicked"
        });
      });
      $('#local-campaign-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Local Notifications Lightbox Upgrade Button Clicked"
        });
      });
      $('#crm-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Club Members Lightbox Upgrade Button Clicked"
        });
      });
      $('#ibeacon-locked .upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Automate Checkins Lightbox Upgrade Button Clicked"
        });
      });
      return $('#header .menu .upgrade-button, .side-upgrade').on('click', function() {
        return woopraTracker.pushEvent({
          name: "Dashboard Upgrade Button Clicked"
        });
      });
    }
  };

  Handle_sidebar_accordion_behavior = function() {
    $("#sidebar li").on("click", function() {
      var element, inner_sub, slider;
      element = $(this);
      if (element.hasClass('has-sub')) {
        inner_sub = element.data('navsec');
        slider = $('#inner_nav_wrap');
        slider.find('.sub-tabs').hide().removeClass('show');
        $('[data-navsec="' + inner_sub + '"]').show();
        $('#sidebar').addClass('sub_open');
        return $('#sidebar').removeClass('meanshow');
      }
    });
    $('#left_fixed_section #sidebar #nav').hover(function() {
      if ($(this).closest('#sidebar').hasClass('sub_open')) {
        return $('#sidebar').addClass('meanshow');
      }
    }, function() {
      if ($(this).closest('#sidebar').hasClass('sub_open')) {
        return $('#sidebar').removeClass('meanshow');
      }
    });
    return $('#left_fixed_section .profile_wrap, #profile_popup_wrap').hover(function() {
      $('#profile_popup_wrap').show();
      if ($(this).hasClass('profile_wrap')) {
        return lbTrackEvent("Profile_Interaction", "Profile_Expose");
      }
    }, function() {
      return $('#profile_popup_wrap').hide();
    });
  };

  $(function() {
    bindTracking();
    CheckIfWix();
    return Handle_sidebar_accordion_behavior();
  });

}).call(this);
(function() {
  var animateNewNotification, bindLayoutNotifications, bindLayoutNotificationsClicks, bindLayoutNotificationsHeader, closeHeaderNotifications, getTokenRecommendationsText, loadMoreNotificationsInWrapper, rearrangeJsonToFit;

  window.update_floating_notifications_timestamp = function() {
    return $.ajax({
      url: Routes.dashboard_ajax_update_floating_timestamp_path(),
      success: function(data) {
        window.feed_populated = true;
        lb_log("floating notifications timestamp updated:");
        return lb_log(data);
      }
    });
  };

  getTokenRecommendationsText = function(eventType) {
    var rewardMsg;
    rewardMsg = "";
    $.ajax({
      url: Routes.ajax_get_token_recomendations_path(),
      success: function(data) {
        var token, tokenType;
        token = data['token_recommendations'][0];
        if (token) {
          tokenType = token['token_type'];
          if (tokenType === eventType) {
            rewardMsg = token['settings'];
            rewardMsg = $.parseJSON(rewardMsg);
            return rewardMsg = rewardMsg['reward'];
          }
        }
      },
      async: false
    });
    return rewardMsg;
  };

  rearrangeJsonToFit = function(input) {
    var a, b, bl, broke_l, j, len, output_flat, output_separate, temp;
    output_flat = {};
    output_separate = {};
    for (a in input) {
      if (input.hasOwnProperty(a)) {
        output_flat[input[a]] = a;
      }
    }
    temp = output_flat;
    for (b in temp) {
      broke_l = b.split(',');
      for (j = 0, len = broke_l.length; j < len; j++) {
        bl = broke_l[j];
        output_separate[bl] = temp[b];
      }
    }
    return output_separate;
  };

  bindLayoutNotificationsClicks = function() {
    var backwords_notif_dictionary, notifications_click_dictionary;
    backwords_notif_dictionary = {
      'punch_tab': ['punchcards_at_limit', 'user_punchcard_unlocked'],
      'analytics_tab': ['app_live', 'members_at', 'redeemed_at', 'punchard_complete_at', 'business_check_ins'],
      'packages_tab': ['user_credit_unlocked', 'user_credit_used'],
      'beacon_tab': ['beacon_detection_at', 'beacon_battery_low_biz'],
      'rewards_tab': ['push_campaign_created', 'push_campaign_sent_at', 'push_campaign_sent_at_birthday', 'push_campaign_sent_at_visitreminder', 'push_campaign_sent_at_geotrap'],
      'push_tab': ['immediate_campaign_created'],
      'carrots_tab': ['carrot_created', 'carrots_usage_at', 'joined_from_carrots_at', 'carrot_credit_at_limit', 'carrot_token_at_limit'],
      'gallery_tab': ['user_posted_photo_to_gallery'],
      'chat': ['user_join', 'user_claimed_walkin', 'user_punch', 'user_punchcard_unlocked', 'user_fb_invites_count_unlocked', 'user_fb_shares_count_unlocked', 'user_random_walkin_unlocked', 'user_redeemed_reward_join', 'user_redeemed_reward_randomwalkin', 'user_redeemed_reward_fbsharescount', 'user_redeemed_reward_fbinvitescount', 'user_redeemed_reward_interval', 'user_redeemed_reward_geotrap', 'user_redeemed_reward_birthday', 'user_redeemed_reward_visitreminder', 'user_redeemed_reward_credit', 'user_redeemed_reward_immediate', 'user_redeemed_reward_general', 'user_purchase_reward_unlocked', 'user_redeemed_punchcard_reward', 'user_status_silver', 'user_status_gold', 'user_status_platinum', 'user_submitted_rating_to_business', 'user_chat', 'user_submitted_rating_to_business_web_user', 'user_chat_web_user', 'user_redeemed_reward_random_walkin', 'auto_chat_phone', 'auto_chat_address', 'auto_chat_hours', 'auto_chat_appointment', 'auto_chat_reservation', 'auto_chat_specials', 'auto_chat_feedback_explained', 'auto_chat_custom', 'auto_chat_general_question', 'auto_chat_punch_explained', 'auto_chat_general_chat'],
      'upgrade': ['freemium_offer_biz', 'premium_offer_biz'],
      'recommendation': ['token_recommendation_birthday', 'token_recommendation_visitreminder', 'token_recommendation_randomwalkin', 'token_recommendation_fbinvitescount', 'token_recommendation_fbsharescount', 'token_recommendation_join'],
      'empty_lightbox': ['push_at_monthly_limit'],
      'upgrade_cc': ['business_credit_card_expiration'],
      'get_merchant_app_lightbox': ['get_business_app']
    };
    notifications_click_dictionary = rearrangeJsonToFit(backwords_notif_dictionary);
    return $('#fl_notif_wrap, #floating-notifications-container').on('click', '.feed-entry', function(e) {
      var $relevant_chat, _that, click_ev, curr_class, curr_msg, rewardMsg;
      _that = $(this);
      curr_class = _that.data('notif-class');
      lbTrackEvent("Feed_Interaction", "Notification_Click_" + curr_class);
      click_ev = notifications_click_dictionary[curr_class];
      switch (click_ev) {
        case "punch_tab":
          return window.location = '/dashboard/punch-card';
        case "analytics_tab":
          return window.location = '/dashboard/analytics';
        case "packages_tab":
          return window.location = '/dashboard/packages';
        case "beacon_tab":
          return window.location = '/dashboard/automate';
        case "rewards_tab":
          return window.location = '/dashboard/rewards-tab';
        case "push_tab":
          return window.location = '/dashboard/campaigns-tab';
        case "carrots_tab":
          return window.location = '/dashboard/customer-discovery/new';
        case "gallery_tab":
          return window.location = '/dashboard/gallery';
        case "upgrade_cc":
          return window.location = window.location = Routes.dashboard_add_payment_method_path();
        case "get_merchant_app_lightbox":
          return window.openMerchantAppDownloadLightbox();
        case "empty_lightbox":
          return window.showEmptyMessagesLightbox();
        case "chat":
          $relevant_chat = $(jQuery.grep($('.chat-instance:visible'), function(n, i) {
            return $(n).data('userId') === parseInt($(this).data('userId'));
          }));
          if ($relevant_chat.length > 0) {
            if ($relevant_chat.hasClass('minimized')) {
              $relevant_chat.removeClass('minimized new-message-minimized');
              return $($relevant_chat).find('.new-chat-message-field').focus();
            } else {
              return $($relevant_chat).find('.new-chat-message-field').focus();
            }
          } else {
            return window.renderNewChatInstance($(this).data('userid'), gon.business_id);
          }
          break;
        case "upgrade":
          return window.showUpgradeLightbox(false);
        case "recommendation":
          curr_msg = curr_class.split('_')[2];
          rewardMsg = getTokenRecommendationsText(curr_msg);
          return window.showRewardOrPushCampaignNotification(curr_class, rewardMsg);
      }
    });
  };

  bindLayoutNotifications = function() {
    return $("#fl_notif_wrap").mCustomScrollbar({
      axis: "y",
      theme: 'dark-3',
      alwaysTriggerOffsets: false,
      onTotalScrollOffset: 200,
      alwaysTriggerOffsets: false,
      advanced: {
        updateOnImageLoad: false
      },
      mouseWheel: {
        preventDefault: true
      },
      callbacks: {
        whileScrolling: function() {
          var current_page, pct;
          pct = this.mcs.topPct;
          if (pct >= 80) {
            current_page = parseInt($("#fl_notif_wrap").data('page'));
            if (current_page !== -1) {
              return loadMoreNotificationsInWrapper(current_page);
            }
          }
        }
      }
    });
  };

  loadMoreNotificationsInWrapper = function(page) {
    var currRun;
    $("#fl_notif_wrap").addClass('loading');
    currRun = $(this);
    if (currRun.data('stillRuns')) {
      return;
    }
    currRun.data('stillRuns', true);
    return $.get("/dashboard/get_layout_notifications?type=partial&pn_page=" + page).done(function(data) {
      var $data;
      $data = $(data);
      if ($data.length === 0) {
        return $("#fl_notif_wrap").data('page', -1);
      } else {
        $data.insertBefore($("#fl_notif_wrap .loading-section"));
        return $("#fl_notif_wrap").data('page', parseInt(page) + 1);
      }
    }).fail(function() {
      return alert("We're experiencing problems loading messages. Please try again later.");
    }).always(function() {
      $("#fl_notif_wrap").removeClass('loading');
      return currRun.data('stillRuns', false);
    });
  };

  closeHeaderNotifications = function() {
    $("#fl_notif_wrap").removeClass('notifOpened');
    $("#fl_notif_wrap").css('top', '0').css('left', 'initial');
    window.pushMessagesOpen = false;
    return $("#overlay-cover-layout").hide();
  };

  bindLayoutNotificationsHeader = function() {
    window.pushMessagesOpen = false;
    $("#overlay-cover-layout").on('click', function(e) {
      return closeHeaderNotifications();
    });
    $("#fl_notif_wrap").on('click', function(e) {
      return closeHeaderNotifications();
    });
    return $(".header-notifications .more-btn").on('click', function(e) {
      e.preventDefault();
      $('#fl_notif_wrap').position({
        of: $(".header-notifications .more-btn"),
        my: 'right-10px top',
        at: 'left top'
      });
      $("#fl_notif_wrap").addClass('notifOpened');
      window.feed_was_opened = true;
      window.pushMessagesOpen = true;
      return $("#overlay-cover-layout").show();
    });
  };

  animateNewNotification = function(new_notif) {
    var $before_elem, $div_wrap, copy_new_notif;
    if ($(".header-notifications").css('display') === 'block') {
      if ($("#fl_notif_wrap").css('display') === 'block') {
        new_notif.addClass('feedAnimateSlideLeft');
        $before_elem = $('#fl_notif_wrap').find('.feed-entry').first();
        new_notif.insertBefore($before_elem);
      } else {
        copy_new_notif = new_notif.clone();
        $div_wrap = $('<div class="floating-notification"></div>');
        $div_wrap.append(copy_new_notif);
        $("#floating-notifications-container").append($div_wrap);
        $div_wrap.animate({
          opacity: 1,
          'margin-top': '10px'
        });
        setTimeout(function() {
          return $div_wrap.animate({
            'margin-left': "400px",
            'opacity': 0
          }, function() {
            return $div_wrap.fadeOut(600, function() {
              return $div_wrap.remove();
            });
          });
        }, 5000);
        $before_elem = $('#fl_notif_wrap').find('.feed-entry').first();
        new_notif.insertBefore($before_elem);
      }
    } else {
      new_notif.addClass('feedAnimateSlideLeft');
      $before_elem = $('#fl_notif_wrap').find('.feed-entry').first();
      new_notif.insertBefore($before_elem);
    }
    return setTimeout(function() {
      return new_notif.removeClass('feedAnimateSlideLeft');
    }, 1000);
  };

  window.insertNewNotificationToFeed = function(msg) {
    var $feed_instance, classes_list, date_data;
    if (msg['code'] === 'user_chat') {
      return;
    }
    $feed_instance = $('#feed_prototype_elem').clone();
    classes_list = 'feed-entry unread ' + msg['code'];
    if (msg['user_name'] !== "") {
      classes_list += ' add_username';
    }
    $feed_instance.removeAttr('id').addClass(classes_list);
    $feed_instance.attr('data-userid', msg['uid']).attr('data-notif-class', msg['code']);
    $feed_instance.find('.text').attr('data-username', msg['user_name']).attr('data-var', msg['counter'] || msg['code1']);
    date_data = moment.tz(msg['utc'] * 1000, "UTC").tz("" + gon.timezone).format("MM/DD/YY [at] h:mm a");
    $feed_instance.find('.date').attr('data-time', date_data);
    lbTrackEvent("Feed_Interaction", "New_Notification");
    return animateNewNotification($feed_instance);
  };

  $(function() {
    bindLayoutNotifications();
    bindLayoutNotificationsClicks();
    bindLayoutNotificationsHeader();
    return $('#dragg_header_elem').draggable({
      containment: 'window',
      stop: function(event, ui) {
        var _pos;
        _pos = ui.position.left + '##' + ui.position.top;
        return $.cookie('feed_drag_position', _pos, {
          expires: 7
        });
      }
    });
  });

}).call(this);
(function() {
  var autoGrowTextArea, bindCRMChatBtns, bindChatInstanceCloseButton, bindChatInstanceMinimizeButton, bindCloseDownloadAppBannerBtn, bindHeaderOnMinimized, bindLayoutChatButtons, bindMinimizedDownloadAppBanner, bindNewMessageUnseen, bindSearchOptionChat, bindSendMessageEnterClick, bindTopScroll, determineUserObject, handleVisibleChatInstances, hideJoinHolderForAllButFirstInstance, indexOf, insertMultipleMessagesIntoChatInstance, insertNewMessageIntoChatInstance, loadMoreChatsInWrapper, lockScroll, populateMessageContent, scrollToBottom,
    indexOf1 = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  autoGrowTextArea = function(chat_instance) {
    return $(chat_instance).find('.new-chat-message-field').on('change keyup paste cut copy', function(e) {
      while ($(this).outerHeight() < this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth'))) {
        $(this).height($(this).height() + 1.1);
      }
    });
  };

  handleVisibleChatInstances = function() {
    $('.chat-instance:not(.prototype):gt(-3)').show();
    $('.chat-instance:not(.prototype):lt(-2)').hide();
  };

  bindChatInstanceCloseButton = function() {
    return $('.chat-instance .instance-header .controls .close-icon').on('click', function(e) {
      e.preventDefault();
      $(this).closest('.chat-instance').remove();
      handleVisibleChatInstances();
    });
  };

  bindChatInstanceMinimizeButton = function() {
    return $('.chat-instance .instance-header .controls .minimize-icon').on('click', function(e) {
      e.preventDefault();
      handleVisibleChatInstances();
      $(this).closest('.chat-instance').addClass('minimized');
      bindHeaderOnMinimized($(this).closest('.chat-instance'));
    });
  };

  bindHeaderOnMinimized = function($chat_instance) {
    return $chat_instance.find('.instance-header').on('click', function(e) {
      e.preventDefault();
      if ($(e.target)[0] === $(this).find('.minimize-icon')[0]) {
        return false;
      }
      $chat_instance = $(this).closest('.chat-instance');
      $(this).removeClass('new-message-minimized');
      if ($chat_instance.hasClass('minimized')) {
        $chat_instance.removeClass('minimized');
      }
      $(this).off('click');
    });
  };

  bindSendMessageEnterClick = function(chat_instance) {
    return $(chat_instance).find('.new-chat-message-field').bind('keyup keydown', function(e) {
      var $chat_instance, $new_message, $text_field, params, randkey;
      if (window.message_being_sent && e.keyCode === 13) {
        return false;
      }
      $(this).val($(this).val().replace(/\v+\n/g, ''));
      if (e.keyCode === 13 && $(this).val().length > 0) {
        e.preventDefault();
        window.message_being_sent = true;
        $(this).animate({
          opacity: 0.4
        });
        randkey = Math.floor(Math.random() * 100000);
        $chat_instance = $(this).closest('.chat-instance');
        params = {
          uid: $chat_instance.data('userId'),
          body: $(this).val().toString().trim(),
          is_broadcast: "0",
          message_type: 'text',
          key: randkey.toString()
        };
        $new_message = $chat_instance.find('.message-row.prototype').clone().first().removeClass('prototype').css({
          opacity: 0.5
        });
        $new_message.find('.inner-message-holder').text(params.body);
        $new_message.find('.time-sent').text(moment(new Date()).tz("" + gon.timezone).format("MMM D, h:mm a"));
        $new_message.insertAfter($chat_instance.find('.message-row').last());
        $new_message.attr("data-messagekey", randkey);
        scrollToBottom($chat_instance);
        autoGrowTextArea($chat_instance);
        $chat_instance.find('.no-messages').hide();
        window.globalNode.sendChatMessage(params);
        $text_field = $chat_instance.find('.new-chat-message-field');
        $text_field.unbind('keyup');
        $text_field.val("");
        $text_field.css({
          height: "22px"
        });
        return window.message_being_sent = false;
      }
    });
  };

  lockScroll = 0;

  bindTopScroll = function(chat_instance) {
    return $(chat_instance).find('.inner-content-wrapper').on('scroll', function(e) {
      var $chat_instance, params;
      $chat_instance = $(this).closest('.chat-instance');
      if ($chat_instance.find('.inner-messages-holder').height() - ($chat_instance.find('.scrollbar-inner').scrollTop() + 300) < 100) {
        $chat_instance.find('.new-message-unseen-holder').css({
          bottom: '-5px'
        });
      }
      if ($(this).scrollTop() === 0) {
        if (lockScroll === 1) {
          return;
        }
        lockScroll = 1;
        $(this).unbind('scroll');
        $chat_instance.find('.loading-older-messages-animation').show();
        params = {
          user_id: $chat_instance.data('userId'),
          merchant_id: $chat_instance.data('merchantId'),
          oldest_message_fetched: $chat_instance.find('.message-row').first().data('message_id')
        };
        return $.ajax({
          url: Routes.dashboard_ajax_get_chat_messages_path(),
          data: params,
          success: function(data) {
            var height_added, height_after_new_message, height_before_new_message;
            lockScroll = 0;
            $chat_instance.find('.loading-older-messages-animation').hide();
            setTimeout(function() {
              if (!(data.messages.length < 1)) {
                return bindTopScroll($chat_instance);
              }
            }, 1000);
            if (data.messages.length < 1) {
              $chat_instance.find('.no-older-messages').show();
              return $chat_instance.find('.inner-content-wrapper').unbind('scroll');
            } else {
              height_before_new_message = $chat_instance.find('.inner-messages-holder').height();
              insertMultipleMessagesIntoChatInstance($chat_instance, data.messages, false);
              height_after_new_message = $chat_instance.find('.inner-messages-holder').height();
              height_added = height_after_new_message - height_before_new_message;
              return $chat_instance.find('.inner-content-wrapper').scrollTop(height_added - 40);
            }
          },
          error: function(data) {}
        });
      }
    });
  };

  indexOf = function(needle) {
    if (typeof Array.prototype.indexOf === 'function') {
      indexOf = Array.prototype.indexOf;
    } else {
      indexOf = function(needle) {
        var i, index;
        i = -1;
        index = -1;
        i = 0;
        while (i < this.length) {
          if (this[i] === needle) {
            index = i;
            break;
          }
          i++;
        }
        return index;
      };
    }
    return indexOf.call(this, needle);
  };

  scrollToBottom = function(chat_instance) {
    var $chat_instance;
    $chat_instance = $(chat_instance);
    $chat_instance.find('.inner-content-wrapper').scrollTop($chat_instance.find('.inner-content-wrapper')[0].scrollHeight);
    return $chat_instance.find('.new-message-unseen-holder').css({
      bottom: '-5px'
    });
  };

  bindNewMessageUnseen = function(chat_instance) {
    var $chat_instance;
    $chat_instance = $(chat_instance);
    return $chat_instance.find('.new-message-unseen-holder').on('click', function(e) {
      return scrollToBottom(chat_instance);
    });
  };

  window.bindOpenChatButtonClick = function(parent, elem, isWithAnalytics) {
    return $(parent).on('click', elem, function(e) {
      var $relevant_chat, $this;
      e.preventDefault();
      $this = $(this);
      if (isWithAnalytics) {
        lbTrackEvent("Feed_Interaction", "Customer_Click");
      }
      $relevant_chat = $(jQuery.grep($('.chat-instance:visible'), function(n, i) {
        return $(n).data('userId') === parseInt($this.data('userId'));
      }));
      if ($relevant_chat.length > 0) {
        if ($relevant_chat.hasClass('minimized')) {
          $relevant_chat.removeClass('minimized');
          $($relevant_chat).find('.new-chat-message-field').focus();
        } else {
          $($relevant_chat).find('.new-chat-message-field').focus();
        }
      } else {
        if (gon.is_live) {
          window.renderNewChatInstance($this.data('userId'), gon.business_id);
        }
      }
    });
  };

  bindLayoutChatButtons = function() {
    bindOpenChatButtonClick('#fl_chat_wrapper', '.chat_user_line', true);
    $("#chat_inner_wrapper").mCustomScrollbar({
      axis: "y",
      theme: 'dark-3',
      alwaysTriggerOffsets: false,
      onTotalScrollOffset: 100,
      alwaysTriggerOffsets: false,
      advanced: {
        updateOnImageLoad: false
      },
      mouseWheel: {
        preventDefault: true
      },
      callbacks: {
        whileScrolling: function() {
          var current_page, pct;
          pct = this.mcs.topPct;
          if (pct >= 80) {
            current_page = parseInt($("#chat_inner_wrapper").data('page'));
            if (current_page !== -1) {
              return loadMoreChatsInWrapper(current_page);
            }
          }
        }
      }
    });
    return $('#fl_chat_wrapper').on('click', '#chat_widget_minimize', function(e) {
      var _wrap;
      _wrap = $('#fl_chat_wrapper');
      if (_wrap.hasClass('minimize_chat')) {
        _wrap.removeClass('minimize_chat');
        return $.cookie('minimize_chat_class', '', {
          expires: 7
        });
      } else {
        _wrap.addClass('minimize_chat');
        return $.cookie('minimize_chat_class', 'minimize_chat', {
          expires: 7
        });
      }
    });
  };

  loadMoreChatsInWrapper = function(page) {
    var currRun;
    $("#fl_chat_wrapper").addClass('loading');
    currRun = $(this);
    if (currRun.data('stillRuns')) {
      return;
    }
    currRun.data('stillRuns', true);
    if (parseInt($("#chat_inner_wrapper").data('page')) === page) {
      return $.get("/dashboard/get_chat_users?type=partial&search=" + window.chatJqueryParams['search'] + "&pn_page=" + page).done(function(data) {
        var $data;
        $data = $(data);
        if ($data.length === 0) {
          return $("#chat_inner_wrapper").data('page', -1);
        } else {
          $data.insertBefore($("#chat_inner_wrapper .loading-section"));
          return $("#chat_inner_wrapper").data('page', parseInt(page) + 1);
        }
      }).fail(function() {
        return alert("We're experiencing problems loading messages. Please try again later.");
      }).always(function() {
        $("#fl_chat_wrapper").removeClass('loading');
        return currRun.data('stillRuns', false);
      });
    }
  };

  bindSearchOptionChat = function() {
    var searchCustomers;
    window.chatJqueryParams = {
      'search': ''
    };
    searchCustomers = function(elm) {
      var autoSearch, counter, timeoutId;
      timeoutId = void 0;
      counter = 0;
      autoSearch = function(getQ) {
        var thisCounter;
        counter++;
        thisCounter = counter;
        clearTimeout(timeoutId);
        timeoutId = setTimeout((function() {
          var q;
          q = getQ();
          if (!(window.chatJqueryParams['search'] && window.chatJqueryParams['search'] === q)) {
            window.chatJqueryParams['search'] = q;
            $("#chat_inner_wrapper .chat_user_line, #chat_inner_wrapper .show_empty_massage").remove();
            $("#chat_inner_wrapper").data('page', 1);
            loadMoreChatsInWrapper(1);
          }
        }), 1000);
      };
      return autoSearch((function() {
        return $(elm).val();
      }));
    };
    return $('#fl_chat_wrapper #search_field').on('keyup paste cut', function(e) {
      var $this;
      $this = $(this);
      return searchCustomers($this);
    });
  };

  bindCRMChatBtns = function() {
    return bindOpenChatButtonClick('#crm-tab .crm-tab-content', '.chat-btn', false);
  };

  bindMinimizedDownloadAppBanner = function() {
    return $('.join-holder .inner-container.minimized .download-text').on('click', function(e) {
      $(this).closest('.inner-container').removeClass('minimized').addClass('opened');
    });
  };

  bindCloseDownloadAppBannerBtn = function() {
    return $('.join-holder .inner-container .download-close-btn').on('click', function(e) {
      $(this).closest('.chat-instance').find('.inner-messages-holder').css({
        'padding-top': '0px'
      });
      $(this).closest('.join-holder').remove();
      $.ajax({
        url: Routes.dashboard_persist_chat_join_banner_close_path(),
        success: function(data) {
          lb_log(data);
        }
      });
    });
  };

  hideJoinHolderForAllButFirstInstance = function() {
    return $('.chat-instance').not('.prototype').each(function() {
      if (!$(this).data('first-in-session')) {
        $(this).find('.join-holder').hide();
      }
    });
  };

  determineUserObject = function(user_id, func) {
    if (window.all_club_users) {
      window.temp_user = window.all_club_users[user_id];
    }
    if (window.temp_user == null) {
      return $.ajax({
        url: Routes.dashboard_ajax_get_all_users_in_club_path(),
        success: function(data) {
          var j, len, ref, user;
          if (!window.all_club_users) {
            window.all_club_users = {};
          }
          ref = data.users;
          for (j = 0, len = ref.length; j < len; j++) {
            user = ref[j];
            if (!window.all_club_users[user.user_id]) {
              window.all_club_users[user.user_id] = user;
            }
          }
          window.temp_user = window.all_club_users[user_id];
          if (typeof func === "function") {
            return func();
          }
        }
      });
    } else {
      if (typeof func === "function") {
        return func();
      }
    }
  };

  populateMessageContent = function(message, new_message) {
    var $inner_message_holder, $stars_holder, rating, stars;
    $(new_message).addClass(message.message_type + "-message");
    $inner_message_holder = new_message.find('.inner-message-holder').text("");
    $inner_message_holder.addClass("" + message.message_type);
    if (message.extra_data != null) {
      message.extra_data = JSON.parse(message.extra_data);
    }
    switch (message.message_type) {
      case 'compound':
        $inner_message_holder.css({
          'padding': '0'
        });
        if (message.extra_data.thumb_url != null) {
          $inner_message_holder.append("<div class='image-message-holder'><img class='image-holder' src=\'" + message.extra_data.thumb_url + "\'></img></div>");
          $inner_message_holder.find('.image-message-holder').css({
            width: '170px',
            height: '170px'
          });
          $inner_message_holder.find('.image-holder').css({
            width: '100%',
            height: '100%'
          });
        }
        if (message.body !== "") {
          $inner_message_holder.append("<div class='text-holder'>" + message.body + "</div>");
          $inner_message_holder.find('.text-holder').css({
            width: '140px',
            padding: '12px 15px'
          });
        }
        if (message.extra_data.link != null) {
          $inner_message_holder.append("<a href='" + message.extra_data.link + "' target='_blank'><div class='link-holder'>CLICK HERE</div></a>");
          return $inner_message_holder.find('.link-holder').css({
            height: '40px',
            'line-height': '40px',
            'text-align': 'center',
            'border-top': '1px solid #374448'
          });
        }
        break;
      case 'image':
        $inner_message_holder.append("<div class='image-message-holder'><div class='image-holder' style=\'background: url(" + message.extra_data.thumb_url + ");\'></div></div>");
        $inner_message_holder.find('.image-message-holder').css({
          width: '170px',
          height: '170px'
        });
        $inner_message_holder.find('.image-holder').css({
          width: '100%',
          height: '100%',
          'border-radius': '13px'
        });
        $inner_message_holder.css({
          'padding': '0'
        });
        break;
      case 'rate':
        rating = /.*(\d)stars\.jpg/.exec(message.extra_data.picture_url)[1];
        $inner_message_holder.append("<div class='rating-message-holder'><div class='rating-title'>MY EXPERIENCE WAS</div><div class='stars-holder'></div></div></div>");
        $stars_holder = new_message.find('.stars-holder');
        stars = 5;
        while (stars > 0) {
          if (stars <= rating) {
            $stars_holder.append("<div class='rating-star filled'></div>");
          } else {
            $stars_holder.append("<div class='rating-star hollow'></div>");
          }
          stars -= 1;
        }
        break;
      case 'link':
        $inner_message_holder.append("<a href='" + message.extra_data.link + "' target='_blank'><div class='link-holder'>CLICK HERE</div></a>");
        return $inner_message_holder.find('.link-holder').css({
          height: '40px',
          'line-height': '40px',
          'text-align': 'center'
        });
      default:
        if ((message.extra_data != null) && (message.extra_data.link_text != null) && (message.extra_data.link != null)) {
          $inner_message_holder.html(message.body + " <a href='" + message.extra_data.link + "' onclick='lbTrackEvent(\"Post_Premium_Interaction\", \"AM_Chat_Launch_Call_Click\"); return;'>" + message.extra_data.link_text + "</a>");
        } else {
          $inner_message_holder.text(message.body);
        }
    }
  };

  insertMultipleMessagesIntoChatInstance = function($chat_instance, messages, is_new_message) {
    var j, len, message, results;
    results = [];
    for (j = 0, len = messages.length; j < len; j++) {
      message = messages[j];
      results.push(insertNewMessageIntoChatInstance($chat_instance, message, is_new_message));
    }
    return results;
  };

  insertNewMessageIntoChatInstance = function($chat_instance, message, is_new_message) {
    var $new_message;
    $new_message = $('.message-row.prototype').clone().first().removeClass('prototype');
    $new_message.data('message_id', message.id);
    $new_message.find('.time-sent').text(moment.tz(message.timestamp, "UTC").tz("" + gon.timezone).format("MMM D, h:mm a"));
    populateMessageContent(message, $new_message);
    if (message.is_sent_by_business === "0") {
      $new_message.find('.message-user-name').html($chat_instance.find('.user-name').text() + ",&nbsp;");
      $new_message.removeClass('merchant').addClass('user');
      if (typeof $chat_instance.data('userImage') === "string") {
        $new_message.find('.user-image').css({
          'background': $chat_instance.data('userImage'),
          'background-size': 'cover'
        });
      }
      window.update_user_image($new_message);
    } else {
      $new_message.addClass('merchant');
    }
    if (is_new_message) {
      $new_message.insertAfter($chat_instance.find('.message-row').last());
      if ($chat_instance.find('.inner-messages-holder').height() - ($chat_instance.find('.scrollbar-inner').scrollTop() + 300) > 100) {
        $chat_instance.find('.new-message-unseen-holder').css({
          bottom: '41px'
        });
      } else {
        scrollToBottom($chat_instance);
      }
    } else {
      $new_message.insertBefore($chat_instance.find('.message-row').first());
    }
    return $chat_instance.find('.no-messages').hide();
  };

  window.insertNewMessagebyUserId = function(user_id, message, should_open_chat_instance) {
    var chat_instance;
    chat_instance = jQuery.grep($('.chat-instance'), function(n, i) {
      return $(n).data('userId') === parseInt(user_id);
    });
    if (chat_instance.length === 0) {
      if (should_open_chat_instance) {
        window.renderNewChatInstance(user_id, gon.business_id);
        return lbTrackEvent("Feed_Interaction", "New_Chat");
      }
    } else {
      if (!window.pending_chat_instances[user_id]) {
        return insertNewMessageIntoChatInstance($(chat_instance), message, true);
      }
    }
  };

  window.renderNewChatInstance = function(user_id, merchant_id) {
    var total_unread_cnt, unread_cnt;
    if (window.pending_chat_instances[user_id]) {
      return;
    }
    unread_cnt = $(".interaction-holder .chat_user_line[data-user-id='" + user_id + "']").attr("data-unread-count");
    $(".interaction-holder .chat_user_line[data-user-id='" + user_id + "']").attr("data-unread-count", "0");
    total_unread_cnt = $(".new_messages_title").attr("data-unread-count");
    total_unread_cnt = total_unread_cnt - unread_cnt;
    if (isNaN(total_unread_cnt)) {
      total_unread_cnt = 0;
    }
    $(".new_messages_title").attr("data-unread-count", total_unread_cnt);
    window.pending_chat_instances[user_id] = 1;
    return determineUserObject(user_id, function() {
      var $anchor, $chat_instance, $relevant_chat_instance, is_email_subscriber, is_facebook_user, opened_chats, params, ref, ref1, ref2, user_image_path, user_joined, user_name, user_status;
      user_name = window.temp_user['user_name'];
      user_joined = window.temp_user['joined_on'].replace(/\-/g, '/');
      user_status = window.temp_user['user_status'] + " member";
      user_image_path = window.temp_user['picture_url'] || '/assets/dashboard-v2/status-cards/no-image-user.png';
      is_email_subscriber = (ref = window.temp_user['is_app_user'] === '0') != null ? ref : {
        "true": false
      };
      is_facebook_user = (ref1 = window.temp_user['is_app_user'] === '3') != null ? ref1 : {
        "true": false
      };
      if (is_email_subscriber && !gon.is_user_opened_subscriber) {
        return window.showAjaxChatSubscriberLightbox(null, user_id);
      } else {
        $chat_instance = $('.chat-instance.prototype').clone().removeClass('prototype');
        bindSendMessageEnterClick($chat_instance);
        autoGrowTextArea($chat_instance);
        $chat_instance.data('userId', user_id);
        $chat_instance.data('merchantId', merchant_id);
        $chat_instance.data('user-image', user_image_path);
        $chat_instance.find('.user-name').text(user_name);
        if (!is_email_subscriber && !is_facebook_user) {
          $chat_instance.find('.joined-date').text(new Date(user_joined).strftime("%b %d, %Y"));
          $chat_instance.find('.chat-status-holder').text(user_status);
          $chat_instance.find('.user-name').on('click', function(e) {
            return showUserInfoLightbox(user_id);
          });
        } else {
          if (is_email_subscriber) {
            $chat_instance.find('.joined').html("Email subscriber");
            $chat_instance.find('.user-status').hide();
            $chat_instance.find('.user-name').addClass("email-sub-head");
          } else {
            $chat_instance.find('.instance-header').addClass('fb-sub-head');
            $chat_instance.find('.joined').html("Facebook Member");
            $chat_instance.find('.user-status').hide();
            $chat_instance.find('.user-name').addClass("email-sub-head");
          }
        }
        opened_chats = $('.chat-instance:visible').map(function() {
          return ($(this).data('userId')).toString();
        });
        if (ref2 = user_id.toString(), indexOf1.call(opened_chats, ref2) >= 0) {
          $relevant_chat_instance = jQuery.grep($('.chat-instance'), function(n, i) {
            return $(n).data('userId') === parseInt(user_id);
          });
          $($relevant_chat_instance).find('.new-chat-message-field').focus();
          return delete window.pending_chat_instances[user_id];
        } else {
          $chat_instance.find('.loading-messages-animation').show();
          $anchor = $(".chat-instance:visible").length > 0 ? $(".chat-instance:visible").last() : $(".chat-instance.prototype").last();
          $chat_instance.insertAfter($anchor);
          $('.chat-instance:not(.prototype):lt(-2)').hide();
          $('.chat-instance:not(.prototype):gt(-3)').show();
          params = {
            user_id: user_id
          };
          return $.ajax({
            url: Routes.dashboard_ajax_get_chat_messages_path(),
            data: params,
            success: function(data) {
              bindTopScroll($chat_instance);
              insertMultipleMessagesIntoChatInstance($chat_instance, data.messages, false);
              if ($('.chat-instance').not('.prototype').length <= 1) {
                $chat_instance.data('first-in-session', true);
              }
              if (data.join_holder_visible && $chat_instance.data('first-in-session')) {
                $chat_instance.find('.join-holder').show();
                if ($chat_instance.find('.message-row').not('.prototype').length > 0) {
                  $chat_instance.find('.inner-messages-holder').css({
                    'padding-top': '50px'
                  });
                }
              }
              $('.loading-messages-animation').hide();
              if ($chat_instance.find('.message-row').not('.prototype').length === 0) {
                $chat_instance.find('.no-messages').show();
              } else {
                $chat_instance.find('.no-messages').hide();
              }
              scrollToBottom($chat_instance);
              bindTopScroll($chat_instance);
              bindNewMessageUnseen($chat_instance);
              handleVisibleChatInstances();
              bindChatInstanceCloseButton();
              bindChatInstanceMinimizeButton();
              bindMinimizedDownloadAppBanner();
              bindCloseDownloadAppBannerBtn();
              hideJoinHolderForAllButFirstInstance();
              bindHeaderOnMinimized($chat_instance);
              delete window.pending_chat_instances[user_id];
            },
            error: function(data) {
              return alert('Could not load new instance chat messages.');
            }
          });
        }
      }
    });
  };

  window.update_user_image = function($new_message) {
    var user_image_path;
    user_image_path = window.temp_user['picture_url'] || null;
    if (user_image_path) {
      $new_message.find('.user-container .user-image').css({
        'background': "url(" + user_image_path,
        'background-size': 'cover'
      });
    }
  };

  $(function() {
    bindChatInstanceCloseButton();
    bindChatInstanceMinimizeButton();
    handleVisibleChatInstances();
    bindCRMChatBtns();
    bindLayoutChatButtons();
    bindSearchOptionChat();
    return window.pending_chat_instances = {};
  });

}).call(this);
(function() {
  var changeQtipHeight, displayList, initializeScroller, initializeSlider, openUserProfileBox;

  window.displayList = function(qtipSelector, hasSlider, sliderOptions, listType, tokenId) {
    var didDataReturn;
    if (hasSlider == null) {
      hasSlider = false;
    }
    if (sliderOptions == null) {
      sliderOptions = "";
    }
    if (listType == null) {
      listType = "";
    }
    if (tokenId == null) {
      tokenId = "";
    }
    if (qtipSelector.length > 0) {
      didDataReturn = false;
      if (!hasSlider) {
        sliderOptions = "";
      }
      return qtipSelector.qtip({
        id: 'tooltip-list',
        prerender: true,
        animate: 'slow',
        hide: {
          target: $('#wrapper'),
          event: 'click'
        },
        position: {
          my: 'top right',
          at: 'right bottom',
          adjust: {
            y: 8,
            x: 25
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-style-1 custom-tip qtip-tooltip-list',
          tip: false
        },
        events: {
          show: function(event, api) {
            if ($('.qtip-tipsy').is(':visible')) {
              $('.qtip-tipsy').css({
                display: 'none'
              });
            }
            if (!didDataReturn) {
              $('.qtip-tooltip-list').append('<div class="tooltip-loading-section"></div>');
              $('.tooltip-loading-section').append('<div class="loading-icon layout-img layout-img-loading rotating-cog"></div>');
            }
            if (!hasSlider) {
              return changeQtipHeight();
            }
          }
        },
        content: {
          text: function(event, api) {
            $.ajax({
              url: Routes.dashboard_ajax_get_tooltip_users_path(),
              dataType: 'html',
              data: {
                list_type: listType,
                slider_options: sliderOptions,
                has_slider: hasSlider,
                token_id: tokenId,
                render_to_partial: 'true'
              }
            }).done((function(data) {
              var defaultSliderValue;
              $('.tooltip-loading-section').remove();
              api.set('content.text', data);
              didDataReturn = true;
              if (listType === "carrots_users") {
                defaultSliderValue = 0;
                displayList($('.left-side'), $('.right-side'));
              } else if (listType === "users_in_club") {
                if ($(data).find('.left-side').children().hasClass('search-user')) {
                  defaultSliderValue = 0;
                  displayList($('.left-side'), $('.right-side'));
                } else {
                  defaultSliderValue = 1;
                  displayList($('.right-side'), $('.left-side'));
                }
              } else if (listType === "purchased_packages_by_users") {
                displayList($('.left-side'), $('.right-side'));
              }
              if (hasSlider) {
                initializeSlider(sliderOptions, defaultSliderValue);
              }
              initializeScroller();
              if (listType === 'users_in_club') {
                return openUserProfileBox();
              }
            })).error(function(xhr, status, error) {
              var emptyListMsg, idDataReturn;
              idDataReturn = false;
              $('.tooltip-loading-section').remove();
              emptyListMsg = "Nothing to see here...yet";
              api.set('content.text', emptyListMsg);
              $('.qtip-content').css({
                top: "85px",
                "left": "35px"
              });
            });
          }
        }
      });
    }
  };

  initializeScroller = function() {
    $('.left-side').mCustomScrollbar({
      axis: "y",
      theme: 'minimal',
      scrollInertia: 0
    });
    return $('.right-side').mCustomScrollbar({
      axis: "y",
      theme: 'minimal',
      scrollInertia: 0
    });
  };

  initializeSlider = function(sliderOptions, defaultSliderValue) {
    if (defaultSliderValue == null) {
      defaultSliderValue = 0;
    }
    $('#real-slider-holder #inside-slider-holder').slider({
      value: defaultSliderValue,
      min: 0,
      max: 1,
      step: 1,
      create: function(event, ui) {
        window.sliderContent = $('#real-slider-holder #inside-slider-holder .ui-slider-handle');
        if (defaultSliderValue === 0) {
          return sliderContent.text(sliderOptions[0]);
        } else {
          return sliderContent.text(sliderOptions[1]);
        }
      },
      slide: function(event, ui) {
        if (ui.value === 0) {
          sliderContent.text(sliderOptions[0]);
          return displayList($('.left-side'), $('.right-side'));
        } else {
          sliderContent.text(sliderOptions[1]);
          return displayList($('.right-side'), $('.left-side'));
        }
      }
    });
    $('.left-choice').on('click', function(e) {
      $('#real-slider-holder #inside-slider-holder').slider('value', 0);
      sliderContent.text(sliderOptions[0]);
      return displayList($('.left-side'), $('.right-side'));
    });
    $('.right-choice').on('click', function(e) {
      $('#real-slider-holder #inside-slider-holder').slider('value', 1);
      sliderContent.text(sliderOptions[1]);
      return displayList($('.right-side'), $('.left-side'));
    });
  };

  displayList = function(displayedSide, hiddenSide) {
    $(hiddenSide).removeClass('display').addClass('hide');
    $(hiddenSide).css({
      display: "none"
    });
    $(displayedSide).removeClass('hide').addClass('display');
    return $(displayedSide).css({
      display: "block"
    });
  };

  changeQtipHeight = function() {
    $('.qtip-tooltip-list').addClass('without-slider');
    $('.list-area').addClass('without-slider');
    return $('.tooltip-loading-section').addClass('without-slider');
  };

  openUserProfileBox = function() {
    return $('.search-user .name').on('click', function(e) {
      var userId;
      userId = $(this).parent().attr('data-user-id');
      showUserInfoLightbox(userId);
      return $('.qtip-tipsy').css({
        display: "none"
      });
    });
  };

}).call(this);
(function() {
  var addUserTokenToList, alterCurrentToken, bindUserInfoTokenAction, getDateTimeFormatUserInfo, initActivityTab, initLeftInfoSection, initNotesTab, initPhotosTab, initSendMessageWithReward, initTabs, initUserInfoLightbox, loadAndAddPageToActivityTab, showSendMessageWithReward, updateActivityList;

  window.showUserInfoLightbox = function(user, opts) {
    var $overlay;
    if (opts == null) {
      opts = {};
    }
    $overlay = $("<div id='user-info-overlay'><div class='user-info-overlay-bg'></div></div>").appendTo("body");
    setTimeout(function() {
      return $overlay.addClass('show-o');
    }, 100);
    window.showBoxLoading($("#user-info-overlay"), {
      text: ''
    });
    $.ajax({
      url: Routes.lightbox_user_info_path(user),
      success: function(data) {
        $(data).appendTo('#user-info-overlay');
        window.hideBoxLoading("#user-info-overlay");
        blurWrapper();
        setTimeout(function() {
          return $overlay.addClass('show-i');
        }, 100);
        return initUserInfoLightbox(user);
      },
      error: function(data) {
        return $(".user-info-overlay-bg").click();
      }
    });
    return $(".user-info-overlay-bg").on('click', function() {
      unblurWrapper();
      $overlay.removeClass('show-o show-i');
      return setTimeout(function() {
        return $overlay.remove();
      }, 500);
    });
  };

  window.initUserInfoRewardsTab = function() {
    return $(".rewards-list-container .token-type").filter(function() {
      if (!$(this).data('qtip')) {
        return $(this).qtip({
          position: {
            my: 'left center',
            at: 'right center',
            adjust: {
              x: 45,
              y: 3
            }
          },
          style: {
            classes: 'qtip-tipsy qtip-rounded qtip-shadow selectric-qtip right-selectric-qtip user-info-qtip',
            tip: false
          }
        });
      }
    });
  };

  initPhotosTab = function(user) {
    $("#uib-photos .photo-container .share-btn").on('click', function(e) {
      e.preventDefault();
      return FB.ui({
        app_id: gon.fb_app_id,
        method: 'stream.share',
        name: "flok photo by " + ($(this).closest('.user-info-box-right-section').parent().find('.user-info-name-dates-rate .name').text().replace(/\n\s*/gm, '')),
        link: gon.full_members_path,
        picture: $(this).closest('.photo-container').data('photo'),
        caption: $(this).closest('.photo-container').data('caption'),
        u: $(this).closest('.photo-container').data('photo'),
        description: "Join the club. Get flok.",
        display: 'display'
      }, function(response) {});
    });
    $("#uib-photos .photo-container .delete-btn").on('click', function(e) {
      e.preventDefault();
      $("#uib-photos .photo-container").removeClass('confirm-delete');
      return $(this).parents(".photo-container").addClass("confirm-delete");
    });
    $("#uib-photos .photo-container .cancel-delete-btn").on('click', function(e) {
      e.preventDefault();
      return $("#uib-photos .photo-container").removeClass('confirm-delete');
    });
    return $("#uib-photos .photo-container .real-delete-btn").on('click', function(e) {
      var container, photo_id, url;
      e.preventDefault();
      url = $(this).attr('href');
      photo_id = $(this).data('photoId');
      $(window).trigger('deleteUserPhoto', [photo_id]);
      container = $(this).parents('.photo-container');
      container.removeClass('confirm-delete').addClass('deleting');
      window.showBoxLoading(container, {
        text: ''
      });
      return $.ajax({
        url: url,
        success: function(data) {
          window.hideBoxLoading(container);
          container.addClass('remove');
          return setTimeout(function() {
            return container.remove();
          }, 2000);
        },
        error: function() {
          window.hideBoxLoading(container);
          container.removeClass('deleting');
          return alert("An error has occurred while deleting this image");
        }
      });
    });
  };

  initNotesTab = function(user) {
    window.uib_notes_original_text = $('#uib-notes .js-count-chars').val();
    $('#uib-notes .js-prevent-newline').keypress(function(e) {
      if (e.which === 13) {
        return e.preventDefault();
      }
    });
    $('#uib-notes .js-count-chars').on('change paste keyup', function() {
      var $f, l, t;
      t = $(this).val();
      if (t.match(/\n/g)) {
        t = t.replace(/\n/g, " ");
        $(this).val(t);
      }
      l = t.length;
      $('#uib-notes .js-count-chars').toggleClass('changed', t !== window.uib_notes_original_text);
      $("#uib-notes .save-btn").toggleClass('disabled', t === window.uib_notes_original_text);
      $f = $('#uib-notes .js-c-count');
      return $f.text(l);
    }).trigger('change');
    $("#uib-notes .save-btn").on('click', function(e) {
      e.preventDefault();
      if ($(this).hasClass('disabled')) {
        return;
      }
      $("#uib-notes .update-user-note-form").submit();
      return window.showBoxLoading($("#uib-notes"), {
        text: ''
      });
    });
    $("#uib-notes .edit-btn").on('click', function(e) {
      e.preventDefault();
      return $("#uib-notes").removeClass('show-note-page').addClass('show-edit-page');
    });
    if (!window.user_info_lightbox_noteform_binded) {
      window.user_info_lightbox_noteform_binded = true;
      return $(document).on('ajax:success', "#uib-notes .update-user-note-form", function(e, data) {
        window.hideBoxLoading($("#uib-notes"));
        $("#uib-notes").removeClass('show-edit-page').addClass('show-note-page');
        window.uib_notes_original_text = $('#uib-notes .js-count-chars').val();
        $('#uib-notes .js-count-chars').trigger('change');
        $("#uib-notes .js-note").text(window.uib_notes_original_text);
        return $("#uib-notes .last-edited").text(data.created_at);
      }).on('ajax:error', "#uib-notes .update-user-note-form", function(e, data) {
        window.hideBoxLoading($("#uib-notes"));
        return alert("An error has occurred saving the note about this user");
      });
    }
  };

  initActivityTab = function(user) {
    $("#uib-activity .activity-list-container").mCustomScrollbar({
      axis: "y",
      theme: 'minimal-dark',
      scrollInertia: 0,
      callbacks: {
        onTotalScroll: function() {
          var current_page;
          current_page = parseInt($("#uib-activity .activity-list").data('page'));
          if (current_page !== -1) {
            return loadAndAddPageToActivityTab(user, current_page);
          }
        }
      }
    });
    return loadAndAddPageToActivityTab(user, 0);
  };

  loadAndAddPageToActivityTab = function(user, page) {
    console.log(page);
    $("#uib-activity").addClass('loading');
    $.get("/dashboard/lightbox/user-info-user-activity/?user_id=" + user + "&type=html&page=" + page + "&smallicons=1").done(function(data) {
      var $data, current_page;
      $data = $(data);
      if ($data.length !== 0) {
        $("#uib-activity").removeClass('no-content-sel');
        $data = $(data);
        $data.appendTo("#uib-activity .activity-list");
        current_page = parseInt($("#uib-activity .activity-list").data('page'));
        return $("#uib-activity .activity-list").data('page', current_page + 1);
      } else {
        return $("#uib-activity .activity-list").data('page', -1);
      }
    }).fail(function() {
      return lb_log('errors loading messages');
    }).always(function() {
      return $("#uib-activity").removeClass('loading');
    });
    return initNotesTab(user);
  };

  initLeftInfoSection = function(user) {
    $("#user-info-box .user-info-box-left-section .add-change-button").on('click', function(e) {
      e.preventDefault();
      if ($(this).hasClass('disabled')) {
        return;
      }
      $(this).parents('form').submit();
      $(this).parent().parent().addClass('loading');
      if ($(this).parent().parent().hasClass('punches-section')) {
        return window.showBoxLoading($("#user-info-box .punches-section"), {
          text: ''
        });
      } else if ($(this).parent().parent().hasClass('status-section')) {
        return window.showBoxLoading($("#user-info-box .status-section"), {
          text: ''
        });
      }
    });
    $("#user-info-box .user-info-box-left-section .enable-on-change").on('change', function() {
      if (!(($(this).hasClass('add-punches' && gon.punches_left_to_complete === '0')) || parseInt(user) < 0)) {
        return $(this).parents("form").find(".add-change-button").removeClass('disabled');
      }
    });
    if (!window.user_info_box_punches_form_success_binded) {
      window.user_info_box_punches_form_success_binded = true;
      $(document).on('ajax:success', "#user-info-box .user-info-box-left-section .add-user-punches-form", function(e, data) {
        var _user;
        console.log($(e.target));
        console.log(data);
        _user = $(e.target).find("#user_id").val();
        $(window).trigger("signalAddedPunches", data);
        return $.get("/dashboard/lightbox/user-info/" + _user).done(function(data) {
          var left_section, overview;
          left_section = $(data).find(".user-info-box-left-section");
          overview = $(data).find("#uib-overview");
          $("#user-info-box .user-info-box-left-section").replaceWith(left_section);
          $("#user-info-box #uib-overview").replaceWith(overview);
          initLeftInfoSection(_user);
          return bindSelectric();
        }).fail(function() {
          return alert("Error Updating");
        }).always(function() {
          window.hideBoxLoading($("#user-info-box .punches-section"));
          window.hideBoxLoading($("#user-info-box .status-section"));
          return $(this).parent().parent().removeClass('loading');
        });
      }).on('ajax:error', "#user-info-box .user-info-box-left-section .add-user-punches-form", function(e, data) {
        window.hideBoxLoading($("#user-info-box .punches-section"));
        window.hideBoxLoading($("#user-info-box .status-section"));
        return $(this).parent().parent().removeClass('loading');
      });
      $(document).on('ajax:success', "#user-info-box .user-info-box-left-section .change-user-status-form", function(e, data) {
        var _user, new_status, status, status_a;
        _user = $(e.target).find("#user_id").val();
        new_status = parseInt(data.new_status);
        status_a = ['Basic', 'Silver', 'Gold', 'Platinum'];
        status = status_a[new_status];
        $(window).trigger('userInfoLightboxUserStatusChanged', {
          user_id: _user,
          status_id: new_status,
          status: status
        });
        return $.get("/dashboard/lightbox/user-info/" + _user).done(function(data) {
          var left_section, overview;
          left_section = $(data).find(".user-info-box-left-section");
          overview = $(data).find("#uib-overview");
          $("#user-info-box .user-info-box-left-section").replaceWith(left_section);
          $("#user-info-box #uib-overview").replaceWith(overview);
          initLeftInfoSection(_user);
          return bindSelectric();
        }).fail(function() {
          return alert("Error Updating");
        }).always(function() {
          window.hideBoxLoading($("#user-info-box .punches-section"));
          window.hideBoxLoading($("#user-info-box .status-section"));
          return $(this).parent().parent().removeClass('loading');
        });
      }).on('ajax:error', "#user-info-box .user-info-box-left-section .change-user-status-form", function(e, data) {
        window.hideBoxLoading($("#user-info-box .punches-section"));
        window.hideBoxLoading($("#user-info-box .status-section"));
        return $(this).parent().parent().removeClass('loading');
      });
    }
    $("#user-info-box .user-info-box-left-section a.send-reward").on('click', function(e) {
      e.preventDefault();
      if (!(parseInt(user) < 0)) {
        showSendMessageWithReward();
        return $("#user-info-box").addClass("send-message-state");
      }
    });
    return $('#user-info-box .user-info-box-left-section a.chat').on('click', function(e) {
      var $overlay, $relevant_chat, $this;
      e.preventDefault();
      unblurWrapper();
      $overlay = $("#user-info-overlay");
      $overlay.removeClass('show-o show-i');
      setTimeout(function() {
        return $overlay.remove();
      }, 500);
      $this = $(this);
      $relevant_chat = $(jQuery.grep($('.chat-instance:visible'), function(n, i) {
        return $(n).data('userId') === parseInt($this.data('userId'));
      }));
      if ($relevant_chat.length > 0) {
        if ($relevant_chat.hasClass('minimized')) {
          $relevant_chat.removeClass('minimized');
          $($relevant_chat).find('.new-chat-message-field').focus();
        } else {
          $($relevant_chat).find('.new-chat-message-field').focus();
        }
      } else {
        if (gon.is_live) {
          window.renderNewChatInstance(user, gon.business_id);
        }
      }
    });
  };

  showSendMessageWithReward = function() {
    $("#user-info-box #crm-message-with-reward-lightbox .frame-holder").show();
    $("#user-info-box #crm-message-with-reward-lightbox .message-sent-holder").hide();
    return $("#user-info-box #crm-message-with-reward-lightbox .reward-field").val("").trigger('change');
  };

  initSendMessageWithReward = function(user) {
    $("#user-info-box #crm-message-with-reward-lightbox .cancel-link").on('click', function(e) {
      e.preventDefault();
      return $("#user-info-box").removeClass("send-message-state");
    });
    $('#user-info-box #crm-message-with-reward-lightbox .reward-field').keypress(function(e) {
      if (e.which === 13) {
        return e.preventDefault();
      }
    });
    $('#user-info-box #crm-message-with-reward-lightbox .reward-field').on('change paste keyup', function() {
      var $f, l, t;
      t = $(this).val();
      if (t.match(/\n/g)) {
        t = t.replace(/\n/g, " ");
        $(this).val(t);
      }
      l = t.length;
      $("#user-info-box #crm-message-with-reward-lightbox .send-btn").toggleClass("disabled", l < 3);
      $f = $('#user-info-box #crm-message-with-reward-lightbox #message-with-reward-charNum');
      return $f.text(l + "/60");
    });
    $("#user-info-box #crm-message-with-reward-lightbox .send-btn").on('click', function(e) {
      e.preventDefault();
      if ($(this).hasClass('disabled')) {
        return;
      }
      $("#user-info-box #crm-message-with-reward-lightbox .form-publish-token-message-with-reward").submit();
      return window.showBoxLoading("#user-info-box #crm-message-with-reward-lightbox", {
        text: ''
      });
    });
    if (!window.user_info_box_send_message_with_reward_binded) {
      window.user_info_box_send_message_with_reward_binded = true;
      return $(document).on('ajax:success', "#user-info-box #crm-message-with-reward-lightbox .form-publish-token-message-with-reward", function(e, data) {
        var _user;
        _user = $(e.target).parents("#user-info-box").find("#user_id").first().val();
        return $.get("/dashboard/lightbox/user-info/" + _user).done(function(data) {
          var left_section, overview;
          left_section = $(data).find(".user-info-box-left-section");
          overview = $(data).find("#uib-overview");
          $("#user-info-box .user-info-box-left-section").replaceWith(left_section);
          $("#user-info-box #uib-overview").replaceWith(overview);
          initLeftInfoSection(_user);
          bindSelectric();
          return $("#user-info-box #crm-message-with-reward-lightbox .frame-holder").hide('fade', function() {
            $("#user-info-box #crm-message-with-reward-lightbox .message-sent-holder").show('fade');
            return setTimeout(function() {
              return $("#user-info-box").removeClass("send-message-state");
            }, 2000);
          });
        }).fail(function() {
          return alert("Error Updating");
        }).always(function() {
          return window.hideBoxLoading("#user-info-box #crm-message-with-reward-lightbox");
        });
      }).on('ajax:error', "#user-info-box #crm-message-with-reward-lightbox .form-publish-token-message-with-reward", function(e, data) {
        return window.hideBoxLoading("#user-info-box #crm-message-with-reward-lightbox");
      });
    }
  };

  bindUserInfoTokenAction = function() {
    return $('.token-action-btn').on('click', function(e) {
      var actionBtn, actionType, businessTokenId, creditUsed, oldToken, tokenCode, userId, userTokenId;
      e.preventDefault();
      actionBtn = $(this);
      oldToken = actionBtn.parent();
      businessTokenId = actionBtn.attr('data-business-token-id');
      userTokenId = actionBtn.attr('data-user-token-id');
      actionType = actionBtn.attr('data-token-action');
      tokenCode = actionBtn.attr('data-token-code');
      creditUsed = actionBtn.attr('data-credit-used');
      userId = actionBtn.attr('data-user-id');
      if (actionBtn.hasClass('mark-as-used')) {
        lbTrackEvent('User_Profile_Interaction', 'Mark_As_Used_Click');
      }
      if (actionBtn.hasClass('use-one')) {
        lbTrackEvent('User_Profile_Interaction', 'Package_Use_One_Click');
      }
      return $.ajax({
        url: Routes.dashboard_ajax_user_token_action_path(),
        data: {
          business_token_id: businessTokenId,
          user_token_id: userTokenId,
          btn_action: actionType,
          token_code: tokenCode,
          credit_used: creditUsed,
          user_id: userId
        },
        success: function(data) {
          var isPackage, newToken, newTokenCode;
          isPackage = oldToken.attr('class') === 'credit-entry' ? true : false;
          if (actionType === 'reissue' || actionType === 'unexpire') {
            newToken = data.result.token;
            addUserTokenToList(oldToken, newToken, isPackage);
          } else {
            if (actionType === 'unlock') {
              newTokenCode = data.result.unlocked[userId];
            }
            alterCurrentToken(oldToken, actionType, isPackage, newTokenCode);
          }
          return updateActivityList(actionType);
        }
      });
    });
  };

  addUserTokenToList = function(oldToken, newToken, isPackage) {
    var token, tokenActionBtn;
    token = oldToken.clone(true, true);
    tokenActionBtn = token.find('.token-action-btn');
    if (newToken !== void 0) {
      tokenActionBtn.attr('data-token-code', newToken.token_code);
    }
    tokenActionBtn.attr('data-token-action', 'redeem');
    tokenActionBtn.removeClass('reissue');
    if (isPackage) {
      tokenActionBtn.addClass('use-one');
    } else {
      tokenActionBtn.addClass('mark-as-used');
    }
    token.find('.display-status').removeClass().addClass("unlocked display-status").html("Unlocked");
    token.prependTo('.rewards-list');
    return window.initUserInfoRewardsTab();
  };

  alterCurrentToken = function(currentToken, actionType, isPackage, newTokenCode) {
    var creditLeft, creditUsed, creditsTotal, displayDateTime, tokenActionBtn, tokenDate, tokenDesc;
    tokenActionBtn = currentToken.find('.token-action-btn');
    tokenActionBtn.attr('class', 'token-action-btn');
    tokenDesc = currentToken.find('.display-status').removeClass();
    if (actionType === 'unlock') {
      tokenActionBtn.attr('data-token-action', 'redeem');
      if (newTokenCode !== void 0) {
        tokenActionBtn.attr('data-token-code', newTokenCode);
      }
      if (isPackage) {
        tokenActionBtn.addClass('use-one');
      } else {
        tokenActionBtn.addClass('mark-as-used');
      }
      tokenDesc.addClass("unlocked display-status");
      tokenDesc.html("Unlocked");
    } else {
      tokenDesc.addClass("redeemed display-status");
      if (isPackage) {
        creditLeft = parseInt(tokenActionBtn.attr('data-credit-left'));
        creditUsed = parseInt(tokenActionBtn.attr('data-credit-used'));
        creditsTotal = creditLeft + creditUsed;
        if (creditLeft > 0) {
          creditUsed = creditUsed + 1;
          tokenDesc.html(creditUsed.toString() + " of " + creditsTotal.toString() + " Redeemed");
          creditLeft = creditLeft - 1;
          tokenActionBtn.attr('data-credit-left', creditLeft);
          tokenActionBtn.attr('data-credit-used', creditUsed);
          if (creditLeft === 0) {
            tokenActionBtn.addClass('reissue');
            tokenActionBtn.attr('data-token-action', 'reissue');
            tokenDesc.html("Redeemed");
          } else {
            tokenActionBtn.addClass('use-one');
            tokenActionBtn.attr('data-token-action', 'redeem');
          }
        } else {
          tokenActionBtn.addClass('reissue');
          tokenActionBtn.attr('data-token-action', 'reissue');
        }
      } else {
        if (currentToken.attr('class') !== 'interval-entry') {
          tokenActionBtn.addClass('reissue');
        }
        tokenActionBtn.attr('data-token-action', 'reissue');
        tokenDesc.html("Redeemed");
      }
    }
    tokenDate = currentToken.find('.display-date');
    displayDateTime = ' on ' + getDateTimeFormatUserInfo()[0] + ' at ' + getDateTimeFormatUserInfo()[1];
    return tokenDate.html(displayDateTime);
  };

  updateActivityList = function(actionType) {
    var displayDateTime, newMsgEntry;
    newMsgEntry = $('.activity-list .message-entry').first().clone();
    newMsgEntry.attr('class', 'message-entry');
    if (actionType === 'redeem') {
      newMsgEntry.addClass('redeemed-reward');
    }
    displayDateTime = getDateTimeFormatUserInfo()[0] + ' at ' + getDateTimeFormatUserInfo()[1];
    $('.message-entry .date').html(displayDateTime);
    return newMsgEntry.prependTo('.activity-list');
  };

  getDateTimeFormatUserInfo = function() {
    var displayDateTime, displayFullDate, displayFullTime;
    displayDateTime = new Date($.now());
    displayFullDate = displayDateTime.toLocaleDateString("us", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit"
    });
    displayFullTime = displayDateTime.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    return [displayFullDate, displayFullTime];
  };

  initUserInfoLightbox = function(user) {
    bindSelectric();
    initLeftInfoSection(user);
    initActivityTab(user);
    initTabs();
    initPhotosTab(user);
    window.initUserInfoRewardsTab();
    initSendMessageWithReward(user);
    return bindUserInfoTokenAction();
  };

  initTabs = function() {
    return $("#user-info-box .tabs-holder .tab-label").on('click', function(e) {
      e.preventDefault();
      $("#user-info-box .tabs-holder .tab-page").removeClass("active");
      $("#user-info-box .tabs-holder .tab-label").removeClass("active");
      $(this).addClass('active');
      return $($(this).attr("href")).addClass('active');
    });
  };

}).call(this);
/* Modernizr 2.8.3 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-canvas-canvastext-draganddrop-hashchange-history-audio-video-indexeddb-input-inputtypes-localstorage-postmessage-sessionstorage-websockets-websqldatabase-webworkers-geolocation-inlinesvg-smil-svg-svgclippaths-touch-webgl-shiv-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-load
 */

;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.8.3',

        Modernizr = {},

        enableClasses = true,

        docElement = document.documentElement,

        mod = 'modernizr',
        modElem = document.createElement(mod),
        mStyle = modElem.style,

        inputElem  = document.createElement('input')  ,

        smile = ':)',

        toString = {}.toString,

        prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



        omPrefixes = 'Webkit Moz O ms',

        cssomPrefixes = omPrefixes.split(' '),

        domPrefixes = omPrefixes.toLowerCase().split(' '),

        ns = {'svg': 'http://www.w3.org/2000/svg'},

        tests = {},
        inputs = {},
        attrs = {},

        classes = [],

        slice = classes.slice,

        featureName,


        injectElementWithStyles = function( rule, callback, nodes, testnames ) {

            var style, ret, node, docOverflow,
                div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body');

            if ( parseInt(nodes, 10) ) {
                while ( nodes-- ) {
                    node = document.createElement('div');
                    node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                    div.appendChild(node);
                }
            }

            style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
            div.id = mod;
            (body ? div : fakeBody).innerHTML += style;
            fakeBody.appendChild(div);
            if ( !body ) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
                docOverflow = docElement.style.overflow;
                docElement.style.overflow = 'hidden';
                docElement.appendChild(fakeBody);
            }

            ret = callback(div, rule);
            if ( !body ) {
                fakeBody.parentNode.removeChild(fakeBody);
                docElement.style.overflow = docOverflow;
            } else {
                div.parentNode.removeChild(div);
            }

            return !!ret;

        },



        isEventSupported = (function() {

            var TAGNAMES = {
                'select': 'input', 'change': 'input',
                'submit': 'form', 'reset': 'form',
                'error': 'img', 'load': 'img', 'abort': 'img'
            };

            function isEventSupported( eventName, element ) {

                element = element || document.createElement(TAGNAMES[eventName] || 'div');
                eventName = 'on' + eventName;

                var isSupported = eventName in element;

                if ( !isSupported ) {
                    if ( !element.setAttribute ) {
                        element = document.createElement('div');
                    }
                    if ( element.setAttribute && element.removeAttribute ) {
                        element.setAttribute(eventName, '');
                        isSupported = is(element[eventName], 'function');

                        if ( !is(element[eventName], 'undefined') ) {
                            element[eventName] = undefined;
                        }
                        element.removeAttribute(eventName);
                    }
                }

                element = null;
                return isSupported;
            }
            return isEventSupported;
        })(),


        _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
        hasOwnProp = function (object, property) {
            return _hasOwnProperty.call(object, property);
        };
    }
    else {
        hasOwnProp = function (object, property) {
            return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
        };
    }


    if (!Function.prototype.bind) {
        Function.prototype.bind = function bind(that) {

            var target = this;

            if (typeof target != "function") {
                throw new TypeError();
            }

            var args = slice.call(arguments, 1),
                bound = function () {

                    if (this instanceof bound) {

                        var F = function(){};
                        F.prototype = target.prototype;
                        var self = new F();

                        var result = target.apply(
                            self,
                            args.concat(slice.call(arguments))
                        );
                        if (Object(result) === result) {
                            return result;
                        }
                        return self;

                    } else {

                        return target.apply(
                            that,
                            args.concat(slice.call(arguments))
                        );

                    }

                };

            return bound;
        };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                if (elem === false) return props[i];

                if (is(item, 'function')){
                    return item.bind(elem || obj);
                }

                return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        if(is(prefixed, "string") || is(prefixed, "undefined")) {
            return testProps(props, prefixed);

        } else {
            props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
            return testDOMProps(props, prefixed, elem);
        }
    }    tests['flexbox'] = function() {
        return testPropsAll('flexWrap');
    };    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };



    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };


    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            bool = true;
        } else {
            injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
                bool = node.offsetTop === 9;
            });
        }

        return bool;
    };



    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
        return !!window.postMessage;
    };


    tests['websqldatabase'] = function() {
        return !!window.openDatabase;
    };

    tests['indexedDB'] = function() {
        return !!testPropsAll("indexedDB", window);
    };

    tests['hashchange'] = function() {
        return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    tests['history'] = function() {
        return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    tests['rgba'] = function() {
        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        setCss('background:url(https://),url(https://),red url(https://)');

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };



    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        setCssAll('opacity:.55');

        return (/^0.55$/).test(mStyle.opacity);
    };


    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
            (str1 + '-webkit- '.split(' ').join(str2 + str1) +
                prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        if ( ret && 'webkitPerspective' in docElement.style ) {

            injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
                ret = node.offsetLeft === 9 && node.offsetHeight === 3;
            });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };



    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
            var style = document.getElementById('smodernizr'),
                sheet = style.sheet || style.styleSheet,
                cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

            bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };

    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
            bool = node.offsetHeight >= 3;
        });

        return bool;
    };
    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                    elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    tests['inlinesvg'] = function() {
        var div = document.createElement('div');
        div.innerHTML = '<svg/>';
        return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };


    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    function webforms() {
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
                attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                        docElement.appendChild(inputElem);
                        defaultView = document.defaultView;

                        bool =  defaultView.getComputedStyle &&
                            defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                            (inputElem.offsetHeight !== 0);

                        docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                        bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
    }
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    Modernizr.input || webforms();


    Modernizr.addTest = function ( feature, test ) {
        if ( typeof feature == 'object' ) {
            for ( var key in feature ) {
                if ( hasOwnProp( feature, key ) ) {
                    Modernizr.addTest( key, feature[ key ] );
                }
            }
        } else {

            feature = feature.toLowerCase();

            if ( Modernizr[feature] !== undefined ) {
                return Modernizr;
            }

            test = typeof test == 'function' ? test() : test;

            if (typeof enableClasses !== "undefined" && enableClasses) {
                docElement.className += ' ' + (test ? '' : 'no-') + feature;
            }
            Modernizr[feature] = test;

        }

        return Modernizr;
    };


    setCss('');
    modElem = inputElem = null;

    ;(function(window, document) {
        var version = '3.7.0';

        var options = window.html5 || {};

        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        var supportsHtml5Styles;

        var expando = '_html5shiv';

        var expanID = 0;

        var expandoData = {};

        var supportsUnknownElements;

        (function() {
            try {
                var a = document.createElement('a');
                a.innerHTML = '<xyz></xyz>';
                supportsHtml5Styles = ('hidden' in a);

                supportsUnknownElements = a.childNodes.length == 1 || (function() {
                    (document.createElement)('a');
                    var frag = document.createDocumentFragment();
                    return (
                        typeof frag.cloneNode == 'undefined' ||
                        typeof frag.createDocumentFragment == 'undefined' ||
                        typeof frag.createElement == 'undefined'
                        );
                }());
            } catch(e) {
                supportsHtml5Styles = true;
                supportsUnknownElements = true;
            }

        }());

        function addStyleSheet(ownerDocument, cssText) {
            var p = ownerDocument.createElement('p'),
                parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

            p.innerHTML = 'x<style>' + cssText + '</style>';
            return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        function getElements() {
            var elements = html5.elements;
            return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        function getExpandoData(ownerDocument) {
            var data = expandoData[ownerDocument[expando]];
            if (!data) {
                data = {};
                expanID++;
                ownerDocument[expando] = expanID;
                expandoData[expanID] = data;
            }
            return data;
        }

        function createElement(nodeName, ownerDocument, data){
            if (!ownerDocument) {
                ownerDocument = document;
            }
            if(supportsUnknownElements){
                return ownerDocument.createElement(nodeName);
            }
            if (!data) {
                data = getExpandoData(ownerDocument);
            }
            var node;

            if (data.cache[nodeName]) {
                node = data.cache[nodeName].cloneNode();
            } else if (saveClones.test(nodeName)) {
                node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
            } else {
                node = data.createElem(nodeName);
            }

            return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        function createDocumentFragment(ownerDocument, data){
            if (!ownerDocument) {
                ownerDocument = document;
            }
            if(supportsUnknownElements){
                return ownerDocument.createDocumentFragment();
            }
            data = data || getExpandoData(ownerDocument);
            var clone = data.frag.cloneNode(),
                i = 0,
                elems = getElements(),
                l = elems.length;
            for(;i<l;i++){
                clone.createElement(elems[i]);
            }
            return clone;
        }

        function shivMethods(ownerDocument, data) {
            if (!data.cache) {
                data.cache = {};
                data.createElem = ownerDocument.createElement;
                data.createFrag = ownerDocument.createDocumentFragment;
                data.frag = data.createFrag();
            }


            ownerDocument.createElement = function(nodeName) {
                if (!html5.shivMethods) {
                    return data.createElem(nodeName);
                }
                return createElement(nodeName, ownerDocument, data);
            };

            ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                    'var n=f.cloneNode(),c=n.createElement;' +
                    'h.shivMethods&&(' +
                    getElements().join().replace(/[\w\-]+/g, function(nodeName) {
                        data.createElem(nodeName);
                        data.frag.createElement(nodeName);
                        return 'c("' + nodeName + '")';
                    }) +
                    ');return n}'
            )(html5, data.frag);
        }

        function shivDocument(ownerDocument) {
            if (!ownerDocument) {
                ownerDocument = document;
            }
            var data = getExpandoData(ownerDocument);

            if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
                data.hasCSS = !!addStyleSheet(ownerDocument,
                        'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                        'mark{background:#FF0;color:#000}' +
                        'template{display:none}'
                );
            }
            if (!supportsUnknownElements) {
                shivMethods(ownerDocument, data);
            }
            return ownerDocument;
        }

        var html5 = {

            'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

            'version': version,

            'shivCSS': (options.shivCSS !== false),

            'supportsUnknownElements': supportsUnknownElements,

            'shivMethods': (options.shivMethods !== false),

            'type': 'default',

            'shivDocument': shivDocument,

            createElement: createElement,

            createDocumentFragment: createDocumentFragment
        };

        window.html5 = html5;

        shivDocument(document);

    }(this, document));

    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;


    Modernizr.hasEvent      = isEventSupported;

    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    Modernizr.testStyles    = injectElementWithStyles;
    Modernizr.prefixed      = function(prop, obj, elem){
        if(!obj) {
            return testPropsAll(prop, 'pfx');
        } else {
            return testPropsAll(prop, obj, elem);
        }
    };


    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

        (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
/*yepnope1.5.4|WTFPL*/
(function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}})(this,document);
Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};
;
(function() {
  window.updateTokenPreview = function(selector, options) {
    var $selector;
    if (options == null) {
      options = {};
    }
    $selector = $(selector);
    if (options.reward !== null) {
      $selector.find('.reward-row, .offering').text(truncate(options.reward, {
        max: 60
      }));
    }
    if (options.new_price !== null) {
      $selector.find('.new-price').text("$" + options.new_price);
    }
    if (options.old_price !== null) {
      $selector.find('.old-price').text("$" + options.old_price);
    }
    if (options.expiry !== null) {
      $selector.find('.date-expiry').text(moment().add(options.expiry).format('M/D/YY'));
    }
    if (options.wdays !== null) {
      $selector.find('.open-hours-row').text(options.wdays);
    }
    if (options.unlock_type !== null) {
      $selector.removeClass('state-0 state-1 state-2');
      return $selector.addClass("state-" + options.unlock_type);
    }
  };

  window.initTokenPreview = function() {
    $('.token-preview .btn-right:not(.binded)').addClass("binded").on('click', function(e) {
      return $(this).parents(".token-preview").toggleClass("page-1", false).toggleClass("page-2", true);
    });
    return $('.token-preview .btn-left:not(.binded)').addClass("binded").on('click', function(e) {
      e.preventDefault();
      return $(this).parents(".token-preview").toggleClass("page-1", true).toggleClass("page-2", false);
    });
  };

}).call(this);
(function() {
  var bindAddPhotoContainer, bindCancelBtn, bindCaptionCharNum, bindDeleteBtn, bindPhotoUpload, bindShareButton, bindTrashBtn, getBase64FromImageUrl, initGallery, onUploadGalleryImageBeforeSend, onUploadGalleryImageComplete, onUploadGalleryImageError, onUploadGalleryImageSuccess, openUploadLightboxOverlay, openWixDialogForGallery, rebindElements;

  initGallery = function() {
    return window.temp_bla = 'bla';
  };

  bindDeleteBtn = function() {
    return $('#gallery-tab .gallery-tab-content .delete-btn').off('click.deletePhoto').on('click.deletePhoto', function() {
      var $this, params, photo_id;
      $('#gallery-tab .gallery-tab-content .delete-btn').off('click.deletePhoto');
      $this = $(this);
      photo_id = $this.closest('.photo-container').data('photoId');
      window.temp_photo_id = photo_id;
      params = {
        'photo_id': photo_id
      };
      return $.ajax({
        url: Routes.dashboard_delete_gallery_photo_path(),
        data: params,
        success: function(data) {
          var no_photos_left;
          window.temp_delete_data = data;
          no_photos_left = $('.photos-inner-wrapper .photo-container').length <= 1;
          $this.closest('.photo-container').remove();
          if (no_photos_left) {
            $('.add-photo-container').attr("id", 'add-photo-cover');
            return window.no_photos = true;
          }
        },
        complete: function(data) {
          return bindDeleteBtn();
        }
      });
    });
  };

  bindCancelBtn = function() {
    return $('#gallery-tab .gallery-tab-content .cancel-btn').on('click', function() {
      var delete_overlay;
      delete_overlay = $(this).siblings('.photo-holder').find('.delete-overlay');
      delete_overlay.addClass('completely-opaque');
      return $(this).closest('.delete-overlay').removeClass('active');
    });
  };

  bindTrashBtn = function() {
    return $('#gallery-tab .gallery-tab-content .js-delete-btn-not-real').on('click', function(e) {
      var delete_overlay;
      e.preventDefault();
      delete_overlay = $(this).parents(".inner-photo-wrapper").find('.delete-overlay');
      delete_overlay.removeClass('completely-opaque');
      return $(this).parents(".inner-photo-wrapper").find('.delete-overlay').addClass('active');
    });
  };

  bindShareButton = function() {
    return $("#gallery-tab .gallery-tab-content .share-btn:not(.binded)").addClass('binded').on('click', function(e) {
      var data;
      e.preventDefault();
      data = $(this).closest('.photo-container').data();
      console.log(data);
      return FB.ui({
        app_id: gon.fb_app_id,
        method: 'stream.share',
        name: "flok photo by " + (data.userName.replace(/\n\s*/gm, '')),
        link: gon.full_members_path,
        u: data.largePhoto,
        display: 'display',
        description: "Join the club. Get flok."
      }, function(response) {});
    });
  };

  bindAddPhotoContainer = function() {
    return $('#gallery-tab .gallery-tab-content .js-add-gallery-photo').on('click', function(e) {
      return e.preventDefault();
    });
  };

  getBase64FromImageUrl = function(URL) {
    var img;
    img = new Image;
    img.src = URL;
    img.onload = function() {
      var canvas, ctx, dataURL;
      canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      ctx = canvas.getContext('2d');
      ctx.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL('image/png');
      alert(dataURL.replace(/^data:image\/(png|jpg);base64,/, ''));
    };
  };

  openWixDialogForGallery = function() {
    return Wix.Dashboard.openMediaDialog(Wix.Settings.MediaType.IMAGE, false, function(data) {
      var imageUrl;
      imageUrl = Wix.Utils.Media.getImageUrl(data.relativeUri);
      imageUrl = imageUrl.replace("http://", "https://");
      return $.ajax({
        type: 'HEAD',
        url: imageUrl,
        success: function(xhr, text, response) {
          var type;
          type = response.getResponseHeader('Content-Type');
          if (type !== "image/jpeg" && type !== "image/png") {
            alert("File type is not supported. Please upload only JPG/JPEG/PNG typed files.");
            return;
          }
          window.currentGalleryWixImage = imageUrl;
          $('#add-gallery-photo-lightbox .photo-preview-holder').css('background-image', 'url(' + imageUrl + ')');
          $('.js-add-gallery-photo').click();
        }
      });
    });
  };

  bindPhotoUpload = function() {
    $('.js-add-photo').on('click', function(e) {
      e.preventDefault();
      if (gon.provider === 'wix') {
        return openWixDialogForGallery();
      } else {
        return $('#gallery-photo-input').trigger('click');
      }
    });
    $('#gallery-photo-input').on('change', function(e) {
      var f, file_size, files, reader;
      e.preventDefault();
      console.log("this:");
      console.log(this);
      files = !!this.files ? this.files : [];
      if (!files.length || !window.FileReader) {
        return;
      }
      if (/^image/.test(files[0].type)) {
        f = this.files[0];
        file_size = f.size || f.fileSize;
        if (file_size > 2000000) {
          alert("File size must not exceed 2MB. Please select a smaller image.");
          return;
        }
        if (f.type !== "image/jpeg" && f.type !== "image/png") {
          alert("File type is not supported. Please upload only JPG/JPEG/PNG typed files.");
          return;
        }
        reader = new FileReader;
        reader.readAsDataURL(files[0]);
        reader.onloadend = function() {
          $('#add-gallery-photo-lightbox .photo-preview-holder').css('background-image', 'url(' + this.result + ')');
        };
      }
      openUploadLightboxOverlay();
    });
    $('.gallery-photo-description-field').on('change keyup paste cut copy', function(e) {
      var caption_text;
      e.preventDefault();
      caption_text = $('.gallery-photo-description-field').val();
      $('.js-photo-caption-field').val(caption_text);
    });
    $('.photo-description-save-btn').on('click', function(e) {
      e.preventDefault();
      if (gon.provider === 'wix') {
        $.ajax({
          url: "/dashboard/add-gallery-photo",
          data: {
            i: window.currentGalleryWixImage,
            caption: $(".gallery-photo-description-field").val()
          },
          beforeSend: onUploadGalleryImageBeforeSend,
          complete: onUploadGalleryImageComplete,
          success: onUploadGalleryImageSuccess,
          error: onUploadGalleryImageError
        });
      } else {
        $('#add-gallery-photo-image').submit();
      }
    });
    return $('#add-gallery-photo-image').ajaxForm({
      uploadProgress: function(event, position, total, percentComplete) {
        console.log(percentComplete);
      },
      beforeSend: onUploadGalleryImageBeforeSend,
      complete: onUploadGalleryImageComplete,
      success: onUploadGalleryImageSuccess,
      error: onUploadGalleryImageError
    });
  };

  onUploadGalleryImageBeforeSend = function() {
    console.log('beforeSend');
    $("#add-photo-progress-bar").progressbar("option", "value", 30).delay(1300);
    $("#add-photo-progress-bar").progressbar("option", "value", 60).delay(1300);
    return $("#add-photo-progress-bar").progressbar("option", "value", 100);
  };

  onUploadGalleryImageComplete = function(xhr) {
    console.log("xhr");
    $("#add-photo-progress-bar").progressbar("option", "value", 100);
    setTimeout(function() {
      return $("#add-photo-progress-bar").progressbar("option", "value", 0);
    }, 500);
    $('#add-gallery-photo-lightbox .gallery-photo-description-field').val("");
    $('.js-photo-caption-field').val(null);
  };

  onUploadGalleryImageError = function(data) {
    window.temp_error_data = data;
    console.log(data);
    if (data.responseJSON && data.responseJSON.filesize) {
      alert("File size must not exceed 2MB. Please select a smaller image.");
      return $.fancybox.close();
    } else {
      return alert("Could not upload picture. Please try again later.");
    }
  };

  onUploadGalleryImageSuccess = function(data) {
    var $new_container, $photo_holder, thumb;
    $("#add-photo-progress-bar").progressbar("option", "value", 100);
    window.temp_gallery_data = data;
    $.fancybox.close();
    if (window.no_photos) {
      $('.add-photo-container').attr("id", "");
    }
    $new_container = window.photo_container_element().hide().insertAfter('.add-photo-container').css({
      opacity: 0
    });
    console.log(data.new_image);
    $new_container.data('photoId', data.new_image.photo_id);
    $new_container.data('large-photo', data.new_image.image);
    $new_container.data('caption', data.new_image.caption);
    $new_container.data('user-name', data.new_image.user_name);
    thumb = window.temp_gallery_data.new_image.thumb;
    $new_container.find('.posting-time-holder').text("Just now");
    $new_container.find('.poster-name-holder').text(data.new_image.user_name);
    if (!((data.new_image.caption != null) && data.new_image.caption.length > 0)) {
      $new_container.find('.hover-description').addClass('no-description');
    }
    if (data.new_image.caption != null) {
      $new_container.find('.hover-description-text').text(data.new_image.caption);
    } else {
      $new_container.find('.hover-description-text').text("");
    }
    $photo_holder = $new_container.show().find('.photo-holder');
    window.temp_photo_holder = $photo_holder;
    $photo_holder.removeAttr("style");
    $photo_holder.css({
      'background-image': "url(" + thumb + ")"
    });
    $new_container.css({
      opacity: 1
    });
    window.no_photos = false;
    $new_container.find(".binded").removeClass('binded');
    return rebindElements();
  };

  rebindElements = function() {
    bindDeleteBtn();
    bindCancelBtn();
    bindTrashBtn();
    return bindShareButton();
  };

  bindCaptionCharNum = function() {
    return $('#add-gallery-photo-lightbox .gallery-photo-description-field').on('change keyup cut copy paste', function() {
      $(this).siblings('.charNum').text(($(this).val().length != null) && $(this).val().length > 0 ? $(this).val().length + "/60" : "0/60");
    });
  };

  openUploadLightboxOverlay = function() {
    return $.fancybox({
      padding: 0,
      wrapCSS: 'fancybox-skin-no-box',
      closeClick: false,
      centerOnScroll: true,
      tpl: {
        closeBtn: '<a title="Close" class="layout2-img layout2-img-fancy-close fancy-close" href="javascript:;"></a>'
      },
      type: 'inline',
      href: '#add-gallery-photo-lightbox'
    });
  };

  window.initDashboardTabGallery = function() {
    setTimeout(function() {
      return $('.gallery-tab').css({
        'opacity': 1
      });
    }, 1);
    $('#add-photo-progress-bar').progressbar();
    window.no_photos = gon.no_photos;
    initGallery();
    bindDeleteBtn();
    bindCancelBtn();
    bindTrashBtn();
    bindPhotoUpload();
    bindCaptionCharNum();
    bindShareButton();
    window.photo_container_element = function() {
      return $('.hidden-photo-container-prototype .photo-container').clone();
    };
    return $.fn.removeStyle = function(style) {
      var search;
      search = new RegExp(style + '[^;]+;?', 'g');
      return this.each(function() {
        $(this).attr('style', function(i, style) {
          return style.replace(search, '');
        });
      });
    };
  };

}).call(this);
(function() {
  var createSlowestDayGraph, createSlowestHoursGraph, initBoostDayLightbox, initHoursRewardLightbox, initMasterCard, initResizeWindow, openBoostDayLightbox, openBoostHoursLightbox, updateEverything;

  createSlowestDayGraph = function() {
    var bars, data, data_filterd, g, gradient1, gradient2, handleMouseOut, handleMouseOver, handleMouseOverStarOverlay, height, margin, max, min, roundValue, starRound, svg, width, x, y;
    svg = d3V4.select('#slowest-day-graph');
    margin = {
      top: 10,
      right: 0,
      bottom: 20,
      left: 30
    };
    width = $("#slowest-day-graph").width();
    height = $("#slowest-day-graph").height();
    width = +width - margin.left - margin.right;
    height = +height - margin.top - margin.bottom;
    x = d3V4.scaleBand().rangeRound([0, width]).padding(0.2);
    y = d3V4.scaleLinear().rangeRound([height, 0]);
    gradient1 = svg.append('svg:defs').append('svg:linearGradient').attr('id', "linearGradient1").attr('x1', '50%').attr('y1', '-96.9870751%').attr('y2', '62.6372466%');
    gradient1.append('svg:stop').attr('offset', '0%').attr('stop-color', "#FF3A18");
    gradient1.append('svg:stop').attr('offset', '44.8698138%').attr('stop-color', "#FF6C17");
    gradient1.append('svg:stop').attr('offset', '100%').attr('stop-color', "#FFAA17");
    gradient2 = svg.append('svg:defs').append('svg:linearGradient').attr('id', "linearGradient2").attr('x1', '50%').attr('y1', '62.6372466%').attr('x2', '50%').attr('y2', '-68.0723457%');
    gradient2.append('svg:stop').attr('offset', '0%').attr('stop-color', "#FF3A18");
    gradient2.append('svg:stop').attr('offset', '100%').attr('stop-color', "#FFAA17");
    g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    data = gon.mastercard_data.weekdays_data;
    x.domain(data.data.map(function(d) {
      return d.weekday_letter;
    }));
    max = data.max_perc + data.max_perc * 0.1;
    min = 0;
    if (data.min_perc === 0) {
      min = -.03;
    }
    y.domain([min, max]);
    g.append('g').attr('class', 'axis axis--x').attr('transform', 'translate(0,' + height + ')').call(d3V4.axisBottom(x));
    g.append('g').attr('class', 'axis axis--y').call(d3V4.axisLeft(y).ticks(5, '%')).append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '0.71em');
    roundValue = 4;
    g.selectAll('.barHover2').data(data.data).enter().append('rect').attr('class', 'barHover2').attr('x', function(d) {
      return x(d.weekday_letter) + (x.bandwidth() / 2) - (this.getBBox().width / 2);
    }).attr('y', function(d) {
      return y(d.perc);
    }).attr('width', x.bandwidth()).attr('height', function(d) {
      return height - y(d.perc);
    }).attr("rx", roundValue).attr("ry", roundValue).attr("fill", function(d) {
      if (d.min) {
        return "url(#linearGradient2)";
      } else {
        return "url(#linearGradient1)";
      }
    }).attr("stroke", "white").attr("stroke-width", 4);
    bars = g.selectAll('.barHover').data(data.data).enter().append('rect').attr('class', 'barHover').attr('x', function(d) {
      return x(d.weekday_letter) + (x.bandwidth() / 2) - (this.getBBox().width / 2);
    }).attr('y', function(d) {
      return y(d.perc);
    }).attr('width', x.bandwidth()).attr('height', function(d) {
      return height - y(d.perc);
    }).attr("rx", roundValue).attr("ry", roundValue).attr("fill", 'white').attr("fill-opacity", 0).attr("stroke", function(d) {
      if (d.min) {
        return "url(#linearGradient2)";
      } else {
        return "url(#linearGradient1)";
      }
    }).attr("stroke-width", 1);
    g.selectAll('.bar').data(data.data).enter().append('rect').attr('class', function(d) {
      return "bar bar-" + d.weekday;
    }).attr('width', x.bandwidth()).attr("rx", roundValue).attr("ry", roundValue).attr("fill", function(d) {
      if (d.min) {
        return "url(#linearGradient2)";
      } else {
        return "url(#linearGradient1)";
      }
    }).attr('height', function(d) {
      return height - y(d.perc);
    }).attr('x', function(d) {
      return x(d.weekday_letter) + (x.bandwidth() / 2) - (this.getBBox().width / 2);
    }).attr('y', function(d) {
      return y(d.perc);
    });
    handleMouseOver = function(d, e, i) {
      x = d3V4.event.clientX;
      y = d3V4.event.clientY;
      d3V4.select("#slowest-day-graph .bar-" + d.weekday).classed('_hide', true);
      d3V4.select("#day-graph-tip").classed('show', true).attr("style", "top: " + ((y + 20) + 'px') + "; left:" + ((x + 10) + 'px'));
      d3V4.select("#day-graph-tip .perc").text(((d.perc * 100).toFixed(2)) + "%");
      return d3V4.select("#day-graph-tip .mess").classed('hide', false);
    };
    handleMouseOut = function(d, e, i) {
      d3V4.select("#slowest-day-graph .bar-" + d.weekday).classed('_hide', false);
      return d3V4.select("#day-graph-tip").classed('show', false);
    };
    g.selectAll('.overlay').data(data.data).enter().append('rect').attr('class', 'overlay').attr("fill", "black").attr('x', function(d) {
      return x(d.weekday_letter);
    }).attr('y', function(d) {
      return 0;
    }).attr('width', x.bandwidth()).attr('height', 100).on("mouseover", handleMouseOver).on("mouseout", handleMouseOut);
    if (data.has_token) {
      handleMouseOverStarOverlay = function(d, e, i) {
        var date, hour, text;
        x = d3V4.event.clientX;
        y = d3V4.event.clientY;
        d3V4.select("#slowest-day-graph .bar-" + d.weekday).classed('_hide', true);
        d3V4.select("#day-graph-tip").classed('show', true).attr("style", "top: " + ((y + 20) + 'px') + "; left:" + ((x + 10) + 'px'));
        text = "";
        if (data.next_scheduled_date_time_in_bz_tz !== null) {
          date = moment.tz(data.next_scheduled_date_time_in_bz_tz, data.business_timezone);
          hour = date.format("ha");
          if (data.token_repeats) {
            text = "Campaign scheduled for every<br> " + (date.format('dddd')) + " @ " + hour;
          } else {
            if (data.token_sent) {
              text = "Last campaign sent<br> " + (date.format('M/D')) + " @ " + hour;
            } else {
              text = "Campaign scheduled<br> for " + (date.format('M/D')) + " @ " + hour;
            }
          }
        }
        d3V4.select("#day-graph-tip .perc").html(text);
        d3V4.select("#day-graph-tip .mess").classed('hide', true);
        return console.log(data);
      };
      starRound = 0.679501705;
      data_filterd = data.data.filter(function(d) {
        return d.scheduled;
      });
      g.selectAll('.star').data(data_filterd).enter().append('rect').attr('class', 'star').attr('transform', function(d) {
        return "translate(" + (x(d.weekday_letter) + (x.bandwidth() / 2)) + ", " + (y(d.perc) - 13) + ") rotate(45)";
      }).attr("fill", '#00A0E2').attr("rx", starRound).attr("ry", starRound);
      g.selectAll('.star2').data(data_filterd).enter().append('rect').attr('class', 'star2').attr('transform', function(d) {
        return "translate(" + (x(d.weekday_letter) + (x.bandwidth() / 2)) + ", " + (y(d.perc) - 11.5) + ") rotate(45)";
      }).attr("fill", '#00A0E2').attr("stroke", "#ffffff").attr("rx", starRound).attr("ry", starRound);
      return g.selectAll('.starOverlay').data(data_filterd).enter().append('rect').attr('class', 'starOverlay').attr('transform', function(d) {
        return "translate(" + (x(d.weekday_letter)) + ", " + (y(d.perc) - 13) + ") ";
      }).attr("fill", 'black').attr('width', x.bandwidth()).attr('height', 10).on("mouseover", handleMouseOverStarOverlay).on("mouseout", handleMouseOut);
    }
  };

  createSlowestHoursGraph = function() {
    var _x1, _x2, _y, all_hours, bisectHour, circle1Inner, circle1Outer, circle2Inner, circle2Outer, data, g, gradient1, height, hour_extent, hour_max, hour_min, line, margin, max_gradient, mousemove, path, perc_extent, rect_width, starRound, svg, width, x, y;
    svg = d3V4.select('#slowest-hours-graph');
    margin = {
      top: 10,
      right: 10,
      bottom: 25,
      left: 30
    };
    width = $("#slowest-hours-graph").width();
    height = $("#slowest-hours-graph").height();
    width = +width - margin.left - margin.right;
    height = +height - margin.top - margin.bottom;
    g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    x = d3V4.scaleLinear().rangeRound([0, width]);
    y = d3V4.scaleLinear().rangeRound([height, 0]);
    data = gon.mastercard_data.hours_data;
    line = d3V4.line().curve(d3V4.curveMonotoneX).x(function(d) {
      return x(d.hour);
    }).y(function(d) {
      return y(d.perc);
    });
    hour_min = d3V4.min(gon.mastercard_data.hours_data.all_hours);
    hour_max = d3V4.max(gon.mastercard_data.hours_data.all_hours);
    hour_extent = d3V4.extent(data.data, function(d) {
      return d.hour;
    });
    perc_extent = d3V4.extent(data.data, function(d) {
      return d.perc;
    });
    max_gradient = perc_extent[1];
    perc_extent[1] += .05;
    x.domain(hour_extent);
    y.domain(perc_extent);
    console.log("perc_extent");
    console.log(perc_extent);
    gradient1 = svg.append('svg:defs').append('svg:linearGradient').attr("id", "linearGradient3").attr("gradientUnits", "userSpaceOnUse").attr("x1", 0).attr("y1", y(0)).attr("x2", 0).attr("y2", y(max_gradient)).selectAll("stop").data([
      {
        offset: "0%",
        color: "#FF0018"
      }, {
        offset: "50%",
        color: "#FFAA18"
      }, {
        offset: "100%",
        color: "#FFAA18"
      }
    ]).enter().append("stop").attr("offset", function(d) {
      return d.offset;
    }).attr("stop-color", function(d) {
      return d.color;
    });
    if (data.boost_set) {
      rect_width = Math.abs(x(data.boost_set_max_hour) - x(data.boost_set_min_hour));
      console.log("rect_width");
      console.log(rect_width);
      svg.append('rect').attr('class', 'boost-rect').attr('width', rect_width).attr('height', height + 5).attr('x', x(data.boost_set_min_hour) + margin.left).attr('y', margin.top);
      _x1 = x(data.boost_set_min_hour) + margin.left;
      _x2 = x(data.boost_set_max_hour) + margin.left;
      _y = height + margin.top + 9;
      svg.append('line').attr('class', 'boost-line').attr('x1', _x1).attr('x2', _x2).attr('y1', _y).attr('y2', _y).attr('stroke-dasharray', 3);
      starRound = 0.679501705;
      svg.append('rect').attr('class', 'starOuter').attr('transform', "translate(" + _x1 + ", " + (_y - 3) + ") rotate(45)").attr("rx", starRound).attr("ry", starRound);
      svg.append('rect').attr('class', 'starInner').attr('transform', "translate(" + _x1 + ", " + (_y - 2) + ") rotate(45)").attr("rx", starRound).attr("ry", starRound);
      svg.append('rect').attr('class', 'starOuter').attr('transform', "translate(" + _x2 + ", " + (_y - 3) + ") rotate(45)").attr("rx", starRound).attr("ry", starRound);
      svg.append('rect').attr('class', 'starInner').attr('transform', "translate(" + _x2 + ", " + (_y - 2) + ") rotate(45)").attr("rx", starRound).attr("ry", starRound);
    }
    all_hours = [];
    if (data.all_hours.length > 12) {
      data.all_hours.forEach(function(e) {
        if (e % 2 === 0) {
          return all_hours.push(e);
        }
      });
    } else {
      all_hours = data.all_hours;
    }
    g.append('g').attr('class', 'axis axis--x').attr('transform', 'translate(0,' + (height + 10) + ')').call(d3V4.axisBottom(x).tickValues(all_hours).tickFormat(function(d) {
      var _time;
      _time = new Date();
      _time.setHours(d);
      return _time.toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true
      }).replace(" ", "");
    }));
    g.append('g').attr('class', 'axis axis--y').call(d3V4.axisLeft(y).ticks(5, '%'));
    path = g.append('path').datum(data.data).attr('class', 'line').attr('d', line).attr("stroke", "url(#linearGradient3)").attr("fill", "none").attr("stroke-width", "1.5px");
    circle1Inner = svg.append('g').attr('class', 'focus').style('display', 'none');
    circle1Inner.append('circle').attr('r', 3.5);
    circle1Outer = svg.append('g').attr('class', 'focus2').style('display', 'none');
    circle1Outer.append('circle').attr('r', 5);
    circle2Inner = svg.append('g').attr('class', 'focus').style('display', 'none');
    circle2Inner.append('circle').attr('r', 3.5);
    circle2Outer = svg.append('g').attr('class', 'focus2').style('display', 'none');
    circle2Outer.append('circle').attr('r', 5);
    bisectHour = d3V4.bisector(function(d) {
      return d.hour;
    }).left;
    mousemove = function() {
      var _d, _d0, _d1, _left, _top, _x, d, d0, d1, hour_end, hour_start, i, left, time, top, x0;
      x0 = x.invert(d3V4.mouse(this)[0] - margin.left);
      x0 = parseInt(x0);
      i = bisectHour(data.data, x0, 1);
      d0 = data.data[i - 1];
      d1 = data.data[i];
      _d0 = data.data[i];
      _d1 = data.data[i + 1];
      console.log(d0);
      d = x0 - d0.hour > d1.hour - x0 ? d1 : d0;
      _d = x0 - d0.hour > d1.hour - x0 ? _d1 : _d0;
      left = x(d.hour) + margin.left;
      top = y(d.perc) + margin.top;
      circle1Inner.attr('transform', 'translate(' + left + ',' + top + ')');
      circle1Outer.attr('transform', 'translate(' + left + ',' + top + ')');
      _left = x(_d.hour) + margin.left;
      _top = y(_d.perc) + margin.top;
      circle2Inner.attr('transform', 'translate(' + _left + ',' + _top + ')');
      circle2Outer.attr('transform', 'translate(' + _left + ',' + _top + ')');
      svg.classed('show-stars', d.hour >= data.boost_set_min_hour && d.hour < data.boost_set_max_hour);
      _x = d3V4.event.clientX;
      _y = d3V4.event.clientY;
      time = new Date();
      time.setHours(d.hour);
      console.log(time);
      hour_start = time.toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true
      });
      time.setHours(_d.hour);
      hour_end = time.toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true
      });
      hour_start.replace(" ", "");
      hour_end.replace(" ", "");
      d3V4.select("#hours-graph-tip").attr("style", "top: " + ((_y + 20) + 'px') + "; left:" + ((_x - 170) + 'px'));
      d3V4.select('#hours-graph-tip .perc').text(((d.perc * 100).toFixed(2)) + "%");
      d3V4.select('#hours-graph-tip .time').text(hour_start + "-" + hour_end);
      return d3V4.select('#hours-graph-tip').classed('show-rewards-enabled', data.boost_set && d.hour >= data.boost_set_min_hour && d.hour < data.boost_set_max_hour);
    };
    return svg.append('rect').attr('class', 'overlay').attr('width', width).attr('height', height).attr('x', margin.left).attr('y', margin.top).on('mouseover', function() {
      circle1Inner.style('display', null);
      circle1Outer.style('display', null);
      circle2Inner.style('display', null);
      circle2Outer.style('display', null);
      d3V4.select("#hours-graph-tip").classed('show', true);
    }).on('mouseout', function() {
      circle1Inner.style('display', 'none');
      circle1Outer.style('display', 'none');
      circle2Inner.style('display', 'none');
      circle2Outer.style('display', 'none');
      d3V4.select("#hours-graph-tip").classed('show', false);
    }).on('mousemove', mousemove);
  };

  openBoostHoursLightbox = function() {
    return $.fancybox({
      type: 'inline',
      href: "#boost-hours-lightbox",
      padding: 0,
      closeBtn: true,
      scrolling: 'no',
      autoCenter: true,
      closeClick: false,
      helpers: {
        overlay: {
          closeClick: false
        }
      },
      wrapCSS: 'fancybox-skin-no-box',
      tpl: {
        closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
      },
      beforeShow: function() {
        blurWrapper();
        $('.fancybox-overlay').css("background", "rgba(0, 0, 0, 0.9)");
        $(".fancybox-skin").css("backgroundColor", "transparent");
        return $("#boost-hours-lightbox").toggleClass('show-success', false);
      },
      afterClose: function() {
        return unblurWrapper();
      }
    });
  };

  openBoostDayLightbox = function() {
    return $.fancybox({
      type: 'inline',
      href: "#boost-day-lightbox",
      padding: 0,
      closeBtn: true,
      scrolling: 'no',
      autoCenter: true,
      closeClick: false,
      helpers: {
        overlay: {
          closeClick: false
        }
      },
      wrapCSS: 'fancybox-skin-no-box',
      tpl: {
        closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
      },
      beforeShow: function() {
        blurWrapper();
        $('.fancybox-overlay').css("background", "rgba(0, 0, 0, 0.9)");
        $(".fancybox-skin").css("backgroundColor", "transparent");
        return $("#boost-day-lightbox").toggleClass('show-success', false);
      },
      afterClose: function() {
        return unblurWrapper();
      }
    });
  };

  initHoursRewardLightbox = function() {
    var checkBoostHoursFieldLength, numberToFormatedHour, textarea_ele;
    numberToFormatedHour = function(n) {
      var s;
      s = n + "00";
      if (s.length === 3) {
        s = "0" + s;
      }
      return s;
    };
    textarea_ele = $("#boost-hours-lightbox .reward-text");
    checkBoostHoursFieldLength = function(ele) {
      var len, max, max_chars;
      max_chars = 120;
      max = max_chars;
      len = textarea_ele.val().length;
      $('#boost-hours-lightbox .charNum').text(len + ("/" + max_chars));
      return $("#boost-hours-lightbox  .submit-btn").toggleClass('disabled', len < 3);
    };
    textarea_ele.on('keyup change paste textarea_sync', function() {
      return checkBoostHoursFieldLength();
    });
    checkBoostHoursFieldLength();
    $("#boost-hours-lightbox  .submit-btn").on('click', function(e) {
      e.preventDefault();
      if ($(this).hasClass("disabled")) {
        return false;
      }
      return $("#boost-hours-lightbox #slow-hours-boost-form").submit();
    });
    $("#boost-hours-lightbox .week-list a").on("click", function(e) {
      var $input, val;
      e.preventDefault();
      $input = $(this).find('input');
      val = $input.val() === "true";
      $input.val(!val);
      $(this).parents('li').toggleClass('on', !val);
      if ($("#boost-hours-lightbox .week-list li.on a").length === 0) {
        alert("You must select at least one weekday!");
        $(this).parents('li').toggleClass('on', true);
        return $input.val(true);
      }
    });
    $("#boost-hours-lightbox #slow-hours-boost-form").ajaxForm({
      beforeSubmit: function() {
        return showBoxLoading("#boost-hours-lightbox", {
          text: ""
        });
      },
      success: function(data) {
        hideBoxLoading();
        $("#boost-hours-lightbox").toggleClass('show-success', true);
        gon.mastercard_data = data.mastercard_data;
        gon.token_interval = data.token_interval;
        gon.token_immediate = gon.token_immediate;
        return updateEverything();
      },
      error: function() {
        hideBoxLoading();
        return alert("AN ERROR AS OCURRED");
      }
    });
    $("#boost-hours-lightbox  .hh-from-selector").on('change', function() {
      var a, i, j, new_v, ref, s, to_v, v;
      v = parseInt($(this).val()) / 100;
      to_v = parseInt($("#boost-hours-lightbox  .hh-to-selector").val()) / 100;
      a = [];
      for (i = j = 1, ref = v; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        a.push("option[value='" + (numberToFormatedHour(i)) + "']");
      }
      if (a.length > 0) {
        s = a.join(",");
        if (to_v <= v) {
          new_v = v + 1 >= 24 ? 0 : v + 1;
          $("#boost-hours-lightbox  .hh-to-selector").val(numberToFormatedHour(new_v));
        }
        $("#boost-hours-lightbox  .hh-to-selector option").attr("disabled", false);
        $("#boost-hours-lightbox  .hh-to-selector").find(s).attr("disabled", true);
        return $("#boost-hours-lightbox  .hh-to-selector").selectric('refresh');
      }
    });
    return $("#multi-campaings-tab   .form-publish-token").validate({
      onkeyup: false,
      errorElement: 'em',
      errorClass: 'validation-error',
      highlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
      }
    });
  };

  initBoostDayLightbox = function() {
    var checkBoostDayFieldLength, first_value, last_value, textarea_ele, updateBoostDaySelects;
    first_value = $("#boost-day-lightbox .boost_day_weekday_select option").first().val();
    last_value = $("#boost-day-lightbox .boost_day_weekday_select option").last().val();
    textarea_ele = $("#boost-day-lightbox .reward-text");
    checkBoostDayFieldLength = function(ele) {
      var len, max, max_chars;
      max_chars = 120;
      max = max_chars;
      len = textarea_ele.val().length;
      $('#boost-day-lightbox .charNum').text(len + ("/" + max_chars));
      return $("#boost-day-lightbox  .submit-btn").toggleClass('disabled', len < 3);
    };
    textarea_ele.on('keyup change paste textarea_sync', function() {
      return checkBoostDayFieldLength();
    });
    checkBoostDayFieldLength();
    $("#boost-day-lightbox  .submit-btn").on('click', function(e) {
      e.preventDefault();
      if ($(this).hasClass("disabled")) {
        return false;
      }
      return $("#boost-day-lightbox #slow-day-boost-form").submit();
    });
    updateBoostDaySelects = function(v) {
      if (v === first_value) {
        $("#boost-day-lightbox .boost_day_hour_select option").each(function() {
          return $(this).attr('disabled', parseInt($(this).val()) < minimal_boost_first_day_hour);
        });
      } else if (v === last_value) {
        $("#boost-day-lightbox .boost_day_hour_select option").each(function() {
          return $(this).attr('disabled', parseInt($(this).val()) >= minimal_boost_first_day_hour);
        });
      } else {
        $("#boost-day-lightbox .boost_day_hour_select option[disabled]").attr('disabled', false);
      }
      return $("#boost-day-lightbox .boost_day_hour_select").selectric('refresh');
    };
    $("#boost-day-lightbox .boost_day_weekday_select").on('change', function(e) {
      return updateBoostDaySelects($(this).val());
    });
    updateBoostDaySelects(parseInt($("#boost-day-lightbox  .boost_day_weekday_select option:selected").val()));
    return $("#boost-day-lightbox #slow-day-boost-form").ajaxForm({
      beforeSubmit: function() {
        return showBoxLoading("#boost-day-lightbox", {
          text: ""
        });
      },
      success: function(data) {
        var val, wdays;
        hideBoxLoading();
        $("#boost-day-lightbox").toggleClass('show-success', true);
        console.log(data);
        gon.mastercard_data = data.mastercard_data;
        gon.token_interval = data.token_interval;
        gon.token_immediate = gon.token_immediate;
        wdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        $("#boost-day-lightbox .slow_day").text(wdays[gon.mastercard_data.weekdays_data.boosted_wday]);
        val = $("#boost-day-lightbox .boost_day_hour_select").val();
        $("#boost-day-lightbox .time").text($("#boost-day-lightbox .boost_day_hour_select option[value=" + val + "]").text());
        $("#boost-day-lightbox .every").toggleClass('hide', !$("#boost-day-lightbox .check-holder #boost_day_repeat_check").is(":checked"));
        return updateEverything();
      },
      error: function() {
        hideBoxLoading();
        return alert("AN ERROR AS OCURRED");
      }
    });
  };

  updateEverything = function() {
    var boost_day_text, boost_hours_text;
    $('#slowest-day-graph').replaceWith("<svg class='graph' id='slowest-day-graph'><svg>");
    $('#slowest-hours-graph').replaceWith("<svg class='graph' id='slowest-hours-graph'><svg>");
    boost_day_text = gon.mastercard_data.weekdays_data.has_token ? "EDIT BOOST" : "BOOST";
    $(".boost-day-btn").text(boost_day_text);
    boost_hours_text = gon.mastercard_data.hours_data.boost_set ? "EDIT BOOST" : "BOOST";
    $(".boost-hour-btn").text(boost_hours_text);
    createSlowestDayGraph();
    return createSlowestHoursGraph();
  };

  initResizeWindow = function() {
    var delta, resizeend, rtime, timeout;
    rtime = void 0;
    timeout = false;
    delta = 200;
    resizeend = function() {
      if (new Date - rtime < delta) {
        setTimeout(resizeend, delta);
      } else {
        timeout = false;
        updateEverything();
      }
    };
    return $(window).resize(function() {
      rtime = new Date;
      if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
      }
    });
  };

  initMasterCard = function() {
    updateEverything();
    $("#mastercard-holder .boost-hour-btn").on('click', function(e) {
      e.preventDefault();
      return openBoostHoursLightbox();
    });
    initHoursRewardLightbox();
    $("#mastercard-holder .boost-day-btn").on('click', function(e) {
      e.preventDefault();
      return openBoostDayLightbox();
    });
    initBoostDayLightbox();
    return initResizeWindow();
  };

  window.__global_initMasterCard = initMasterCard;

}).call(this);
(function() {
  var createLineChart, initBotTile, initClosePrintPunchcardOverlay, initPushMessagesTile;

  window.initDashboardHome = function() {
    var qtipSelector, sliderOptions;
    $('.js-prevent-newline').keypress(function(e) {
      if (e.which === 13) {
        return e.preventDefault();
      }
    });
    $('.js-count-chars').on('change paste keyup', function() {
      var $f;
      $f = $(this).parent().find('.js-c-count');
      return $f.text($(this).val().length);
    });
    qtipSelector = $('.members-container .total');
    sliderOptions = ['Joined IN-STORE', 'Joined from flok'];
    if (typeof displayList !== 'undefined') {
      window.displayList(qtipSelector, true, sliderOptions, 'users_in_club');
    }
    window.defined_hash = gon.defined_hash;
    $(".preview-app-body-wrap").mCustomScrollbar({
      axis: "y",
      theme: 'light-thick',
      mouseWheel: {
        preventDefault: true
      },
      advanced: {
        updateOnImageLoad: false,
        updateOnContentResize: false
      }
    });
    if (gon.render_new_treatment) {
      initNewTreatment();
    }
    if (gon.render_mastercard) {
      return __global_initMasterCard();
    }
  };

  window.bindGoManualBtn = function() {
    return $('.js-go-manual').on('click', function(e) {
      return $('.manual-container').fadeOut(600, function() {
        $('.manual-selected .activated').show();
        $('.manual-selected').fadeIn(600);
        return $('.manual-selected .image-holder').animate({
          'margin-top': '+=60px'
        }, 600, function() {
          $('.edit-settings').hide();
          $('.upgrade-to-auto').show();
          return setTimeout((function() {
            parent.$.fancybox.close();
            return $.ajax({
              url: Routes.dashboard_ajax_set_checkin_configuration_path(),
              data: {
                'checkin_config': 'manual'
              },
              success: function(data) {
                console.log("data => ");
                console.log(data);
                $('.manual-container').show();
                $('.manual-selected .activated').hide();
                $('.manual-selected').hide();
                return $('.manual-selected .image-holder').animate({
                  'margin-top': '-=60px'
                });
              }
            });
          }), 1500);
        });
      });
    });
  };

  window.bindGoAutomaticBtn = function() {
    return $('.js-go-auto').on('click', function(e) {
      $('.select-screen-holder, .go-automatic-container').animate({
        'margin-left': '-=776px'
      }, 600, 'easeInOutCubic');
      return $.ajax({
        url: Routes.dashboard_ajax_set_checkin_configuration_path(),
        data: {
          'checkin_config': 'automatic'
        },
        success: function(data) {
          console.log("data => ");
          return console.log(data);
        }
      });
    });
  };

  window.bindMailingListForm = function() {
    $("form#xls_mailing_upload:not(.ajaxFormbinded)").addClass(".ajaxFormbinded").ajaxForm({
      beforeSend: function() {
        window.showSecureLoadingOverlay("Uploading...");
        if (beforeSend()) {
          return callbacks.beforeSend();
        }
      },
      success: function(data) {
        $('#content').hideLbOverlay();
        window.hideSecureLoadingOverlay();
        $(document).trigger('emailListUploaded');
        return $.ajax({
          url: Routes.dashboard_handle_email_list_upload_path(),
          success: function(data1) {
            var pending_invite;
            console.log(data1);
            pending_invite = data1.results.pending_invite;
            openUploadMailingListLightbox(pending_invite);
            return $('#adding-emails-lightbox .xls-error-holder').hide();
          }
        });
      },
      complete: function() {
        $('#content').hideLbOverlay();
        return window.hideSecureLoadingOverlay();
      },
      error: function(data) {
        return $('#adding-emails-lightbox .xls-error-holder').show();
      }
    });
    $('.btn-upload-mailing').on('click', function(e) {
      console.log(".btn-upload-mailing click");
      e.preventDefault();
      $('#mailing_list_mailing_list_file').trigger('click');
      return false;
    });
    return $('#mailing_list_mailing_list_file').on('change', function(e, i) {
      if ($(this).val() !== "") {
        $('#xls_mailing_upload').submit();
        return window.showSecureLoadingOverlay("Uploading...");
      }
    });
  };

  window.bindSendAsPushMessageBtns = function() {
    return $('.new-add-reward-container .rewards-history-container .send-push-msg-btn').on('click', function(e) {
      e.preventDefault();
      window.token_to_be_pushed = $(this).data('tid');
      $('#campaigns-send-push-lightbox .message').text($(this).data('reward'));
      console.log($(this).data('reward'));
      return $('.js-send-push').click();
    });
  };

  window.bindSendMessageBtn = function() {
    return $('#campaigns-send-push-lightbox .send-message-btn').on('click', function(e) {
      var params;
      e.preventDefault();
      $(this).closest('.frame-holder').hide();
      $('#campaigns-send-push-lightbox .progress-bar-holder').show();
      $('#progress-bar').trigger('campaignProgressing');
      params = {
        'tid': window.token_to_be_pushed
      };
      return $.ajax({
        url: Routes.lightbox_send_token_as_push_message_path(),
        data: params,
        success: function(data) {
          return window.push_message_sent_success = true;
        },
        complete: function() {},
        error: function(data) {
          return alert("Whoopsie daisy! The reward could not be sent. Please try again later.");
        }
      });
    });
  };

  window.bindSetPasscodeGetQRBtn = function() {
    return $('.enter-passcode .get-qr-code-btn').on('click', function(e) {
      var params, passcode;
      e.preventDefault();
      params = {
        'code_1': $('.qr_code_1').val(),
        'code_2': $('.qr_code_2').val(),
        'code_3': $('.qr_code_3').val(),
        'code_4': $('.qr_code_4').val()
      };
      passcode = $('.qr_code_1').val() + $('.qr_code_2').val() + $('.qr_code_3').val() + $('.qr_code_4').val();
      if (passcode.length !== 4) {
        $('.qr-passcode-form').addClass('error');
        return;
      }
      $.ajax({
        url: Routes.dashboard_update_qr_passcode_path(),
        data: params,
        success: function(data) {
          return console.log("success =>" + data);
        },
        error: function(data) {
          return console.log("error =>" + data);
        }
      });
      window.qr_printed = true;
      $('.enter-passcode').fadeOut(800);
      return $('.qr-code-ready').fadeIn(800);
    });
  };

  window.bindCampaignProgressBarInit = function() {
    return $('#progress-bar').on('campaignProgressing', function(e) {
      var bar_forward;
      e.preventDefault();
      window.progress_status = 3;
      bar_forward = function() {
        if (window.progress_status < 100) {
          $('#progress-bar').val(window.progress_status + 1);
          window.progress_status += 1;
        } else {
          clearInterval(window.interval_id);
          $('.progress-bar-holder').hide();
          $('.campaign-sent-frame').show();
        }
      };
      return window.interval_id = setInterval(bar_forward, 50);
    });
  };

  window.markCategoryAsComplete = function(category) {
    var cat, params;
    $(category).addClass("completed").removeClass("selected unselected");
    $(category).data('completed', true);
    cat = $(category).attr('id');
    console.log("cat => " + cat);
    params = {
      'category': cat
    };
    return $.ajax({
      url: Routes.dashboard_ajax_mark_category_completed_path(),
      data: params,
      success: function(data) {
        console.log("dashboard_mark_category_completed success => ");
        return console.log(data);
      },
      error: function(data) {
        console.log("dashboard_mark_category_completed error => ");
        return console.log(data);
      }
    });
  };

  window.initializePricingSlider = function() {
    return $("#slider").slider({
      min: 0,
      max: 1,
      step: 1,
      value: 0,
      animate: 800,
      change: function(event, ui) {
        if (ui.value === 1) {
          $('#basic-monthly-price, #pro-monthly-price, #enterprise-monthly-price, .monthly-text').fadeOut('fast', function() {
            return $('#basic-yearly-price, #pro-yearly-price, #enterprise-yearly-price, .annual-text').fadeIn('fast');
          });
          $('.m-pricing').addClass("inactive-category").delay(800).removeClass("active-category");
          return $('.y-pricing').addClass("active-category").delay(800).removeClass("inactive-category");
        } else {
          $('#basic-yearly-price, #pro-yearly-price, #enterprise-yearly-price, .annual-text').fadeOut('fast', function() {
            return $('#basic-monthly-price, #pro-monthly-price, #enterprise-monthly-price, .monthly-text').fadeIn('fast');
          });
          $('.m-pricing').addClass("active-category").delay(800).removeClass("inactive-category");
          return $('.y-pricing').addClass("inactive-category").delay(800).removeClass("active-category");
        }
      }
    }, $('#yearly-trigger, .y-pricing').on('click', function() {
      return $("#slider").slider("value", 1);
    }), $('.m-pricing').on('click', function() {
      return $("#slider").slider("value", 0);
    }));
  };

  createLineChart = function(_container, _data, graph_type) {
    var bisectDate, c_height, c_width, chart_value_tooltip, color_start, color_stop, container, container_parent, d, data, dp, dp2, dummy_data, focus, focus2, formatValue, gradient, height, increase, length, line, margin, max, min, mousemove, p, parseDate, previous_week_data, radius, svg, tooltip, v1, v2, week, width, x, xAxis, y, yAxis;
    if (graph_type == null) {
      graph_type = 1;
    }
    container = d3.select(_container);
    c_width = parseInt(container.style("width"), 10);
    c_height = parseInt(container.style("height"), 10);
    margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 45
    };
    if (graph_type === 1) {
      color_start = '#BE96F0';
      color_stop = '#1AA1DF';
    } else if (graph_type === 2) {
      color_start = '#F0A794';
      color_stop = '#1AA1DF';
    }
    dummy_data = _data.dummy_data;
    container_parent = d3.select(container.node().parentNode);
    container_parent.classed('dummy_data', dummy_data);
    length = _data.data.length;
    previous_week_data = _data.data.slice(length - 14, length - 7);
    data = _data.data.slice(length - 7, length);
    v1 = previous_week_data.reduce(function(previousValue, currentValue) {
      return previousValue + parseInt(currentValue['line1']);
    }, 0);
    v2 = data.reduce(function(previousValue, currentValue) {
      return previousValue + parseInt(currentValue['line1']);
    }, 0);
    increase = v2 - v1;
    p = increase / v1 * 100;
    if (!isFinite(p)) {
      p = 100;
    }
    if ((v1 === v2 && v2 === 0)) {
      p = 0;
    }
    p = Math.round(p);
    p = parseInt(p);
    container_parent.select(".per-arrows").classed('up', p >= 0);
    container_parent.select(".per-arrows").classed('down', p < 0);
    container_parent.select(".percentage").text((Math.abs(p)) + "%");
    container_parent.selectAll(".number-week").text(v2);
    tooltip = '.line-chart-tooltip';
    chart_value_tooltip = d3.select(container.node().parentNode).select(".chart-value-tooltip");
    if (dummy_data) {
      data = [
        {
          line1: 5,
          day: '2015-06-08'
        }, {
          line1: 0,
          day: '2015-06-09'
        }, {
          line1: 0,
          day: '2015-06-10'
        }, {
          line1: 0,
          day: '2015-06-11'
        }, {
          line1: 0,
          day: '2015-06-12'
        }, {
          line1: 0,
          day: '2015-06-13'
        }, {
          line1: 0,
          day: '2015-06-14'
        }
      ];
      tooltip = '.line-chart-no-data-tooltip';
    }
    tooltip = d3.select(container.node().parentNode).select(tooltip);
    parseDate = d3.time.format("%Y-%m-%d").parse;
    bisectDate = d3.bisector(function(d) {
      return d.date;
    }).left;
    formatValue = d3.format(',.2f');
    data.forEach(function(d) {
      d.date = parseDate(d.day);
      d.close = d.line1;
    });
    data.sort(function(a, b) {
      return a.date - b.date;
    });
    width = c_width - margin.left - margin.right;
    height = c_height - margin.top - margin.bottom;
    min = d3.min(data, function(d) {
      return d.line1;
    });
    max = d3.max(data, function(d) {
      return d.line1;
    });
    if (dummy_data) {
      min = 0;
    }
    if (dummy_data) {
      max = 20;
    }
    if ((max - min) <= 0) {
      max = min + 10;
    }
    x = d3.time.scale().range([0, width]);
    y = d3.scale.linear().range([height, 0]).domain([min, max]);
    week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(7).tickFormat(function(d, i) {
      return week[d.getDay()];
    }).tickValues(data.map(function(o) {
      return o.date;
    }));
    yAxis = d3.svg.axis().scale(y).orient('left').ticks(3).tickFormat(d3.format("d"));
    line = d3.svg.line().x(function(d) {
      return x(d.date);
    }).y(function(d) {
      return y(d.close);
    });
    if (graph_type === 2) {
      line.interpolate("monotone");
    }
    svg = container.append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    mousemove = function() {
      var d, d0, d1, i, x0;
      x0 = x.invert(d3.mouse(this)[0]);
      i = bisectDate(data, x0, 1);
      d0 = data[i - 1];
      d1 = data[i];
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      focus.attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')');
      focus2.attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')');
      tooltip.classed("show", true);
      return chart_value_tooltip.text(d.close);
    };
    x.domain([data[0].date, data[data.length - 1].date]);
    svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + (height + 10) + ')').call(xAxis);
    svg.append('g').attr('class', 'y axis').attr('transform', "translate(-10,0)").call(yAxis);
    gradient = svg.append('svg:defs').append('svg:linearGradient').attr('id', "gradient" + graph_type).attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%').attr('spreadMethod', 'pad').attr("gradientUnits", "userSpaceOnUse");
    gradient.append('svg:stop').attr('offset', '0%').attr('stop-color', color_start).attr('stop-opacity', 1);
    gradient.append('svg:stop').attr('offset', '100%').attr('stop-color', color_stop).attr('stop-opacity', 1);
    svg.append('path').datum(data).attr('class', 'line').attr('d', line).attr("stroke", "url(#gradient" + graph_type + ")").attr("fill", "url(#gradient" + graph_type + ")");
    focus = svg.append('g').attr('class', 'focus').style('display', 'none');
    focus.append('circle').attr('r', 4.5);
    focus2 = svg.append('g').attr('class', 'focus2').style('display', 'none');
    focus2.append('circle').attr('r', 6);
    if (graph_type === 1 && !dummy_data) {
      data.forEach(function(d) {
        var dp;
        dp = svg.append('g').attr('class', 'data-point');
        dp.append('circle').attr('r', 3);
        dp.attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')');
      });
    }
    if (dummy_data) {
      d = data[0];
      radius = 4;
      if (graph_type === 1) {
        radius = 3;
      }
      dp = svg.append('g').attr('class', 'data-point');
      dp.append('circle').attr('r', radius);
      dp.attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')');
      if (graph_type === 1) {
        dp.attr('class', 'data-point-2');
      }
      if (graph_type === 2) {
        dp2 = svg.append('g').attr('class', 'focus2').append('circle').attr('r', 6);
        dp2.attr('transform', 'translate(' + x(d.date) + ',' + y(d.close) + ')');
      }
    }
    svg.append('rect').attr('class', 'overlay').attr('width', width).attr('height', height).on('mouseover', function() {
      if (!dummy_data) {
        focus.style('display', null);
        focus2.style('display', null);
      }
    }).on('mouseout', function() {
      focus.style('display', 'none');
      focus2.style('display', 'none');
      tooltip.classed("show", false);
    }).on('mousemove', mousemove);
  };

  initPushMessagesTile = function() {
    return $(".speedometer-full-tooltip.bindmouse.big-tooltip").each(function() {
      return $(this).parent().on('mousemove', function(e) {
        var t, x, y;
        t = $(this).find(".big-tooltip");
        x = e.clientX;
        y = e.clientY;
        return t.attr("style", "top: " + ((y + 20) + 'px') + "; left:" + ((x - 130) + 'px'));
      });
    });
  };

  window.initPunchcardTile = function() {
    $(".big-tooltip.bindmouse").each(function() {
      return $(this).parent().on('mousemove', function(e) {
        var t, x, y;
        t = $(this).find(".big-tooltip");
        x = e.clientX;
        y = e.clientY;
        return t.attr("style", "top: " + ((y + 20) + 'px') + "; left:" + ((x - 30) + 'px'));
      });
    });
    createLineChart('.punches-container .graph-container', gon.punchcard_matrix);
    return d3.select(window).on('resize.punches_graph', function() {
      if ($('.punches-container .graph-container svg').length) {
        d3.select('.punches-container .graph-container svg').remove();
        return createLineChart('.punches-container .graph-container', gon.punchcard_matrix);
      }
    });
  };

  window.initMembersTile = function() {
    createLineChart('.members-container .graph-container', gon.members_matrix, 2);
    return d3.select(window).on('resize.members_graph', function() {
      if ($('.members-container .graph-container svg').length) {
        d3.select('.members-container .graph-container svg').remove();
        return createLineChart('.members-container .graph-container', gon.members_matrix, 2);
      }
    });
  };

  window.initRewardsLine = function() {
    $(".rewards-history-container div[title]").qtip({
      position: {
        my: 'top right',
        at: 'bottom right',
        adjust: {
          y: 8,
          x: 25
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-style-1 custom-tip ',
        tip: false
      }
    });
    $(".push-messages-tile .push-messages-entry > .tooltip ").qtip({
      position: {
        my: 'top right',
        at: 'bottom right',
        adjust: {
          y: 10,
          x: 22
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-style-1 custom-tip ',
        tip: false
      }
    });
    $(".push-messages-tile .p50-block .tooltip ").qtip({
      position: {
        my: 'top right',
        at: 'bottom right',
        adjust: {
          y: 10,
          x: -13
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-style-1 custom-tip ',
        tip: false
      }
    });
    return $(".new-add-reward-container .about-tooltip ").qtip({
      position: {
        my: 'top center',
        at: 'bottom center'
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-style-1'
      }
    });
  };

  initClosePrintPunchcardOverlay = function() {
    return $(".show-overlay .close-print-punchcard-overlay").on('click', function(e) {
      return $(".print-punchcard-area").removeClass("show-overlay");
    });
  };

  window.initNewTreatment = function() {
    var $container, $email_subscribers_number, $goal_field, $meetometer, $needle, $social_breach_count, $this_week_field, needle_val, percentage, state, updateSocialBreachCount;
    gon.weekly_goal_stats;
    $container = $("#new-treatement");
    $goal_field = $container.find('.total-num');
    $this_week_field = $container.find('.this-week-num');
    $social_breach_count = $container.find('.social-reach-number');
    $email_subscribers_number = $container.find('.email-subscribers-number');
    $meetometer = $container.find('.meetometer');
    $needle = $container.find('.meeter-needle');
    percentage = gon.weekly_goal_stats.percentage;
    if (percentage > 2) {
      percentage = 2;
    }
    state = 1;
    if (gon.weekly_goal_stats.percentage >= 0.5) {
      state = 2;
    }
    if (gon.weekly_goal_stats.percentage > 0.75) {
      state = 3;
    }
    if (gon.weekly_goal_stats.percentage > 1.25) {
      state = 4;
    }
    needle_val = -64;
    if (percentage <= 0.75) {
      needle_val = percentage / 0.75 * 39 + (-64);
    }
    if (percentage > 0.75 && percentage < 1) {
      needle_val = (percentage - 0.75) / 0.25 * 21 + (-21);
    }
    if (percentage >= 1 && percentage <= 1.25) {
      needle_val = (percentage - 1) / 0.25 * 27 + 0.;
    }
    if (percentage > 1.25) {
      needle_val = (percentage - 1.25) / 0.75 * 37 + 31;
    }
    setTimeout(function() {
      $meetometer.addClass("state-" + state);
      $needle.css("transform", "rotate(" + needle_val + "deg)");
      return $this_week_field.animateNumber({
        number: gon.weekly_goal_stats.thisweek
      }, 'slow');
    }, 2500);
    updateSocialBreachCount = function(data) {
      return setTimeout(function() {
        $social_breach_count.text(0);
        return $social_breach_count.animateNumber({
          number: data.tw_counter + data.fb_counter
        });
      }, 1500);
    };
    $(document).on('twitterPopupClosed', function() {
      $.fancybox.close();
      return $.ajax({
        url: Routes.dashboard_update_tweets_count_path()
      }).done(function(data) {
        updateSocialBreachCount(data);
        return lbTrackEvent("Dashboard_Interaction_Grow_Club", "Social_Twitter_Success");
      });
    });
    $(document).bind('facebookPopupClosed', function() {
      $.fancybox.close();
      return $.ajax({
        url: Routes.dashboard_update_facebook_shares_count_path(),
        success: function(data) {
          updateSocialBreachCount(data);
          return lbTrackEvent("Dashboard_Interaction_Grow_Club", "Social_Facebook_Success");
        }
      });
    });
    $(document).bind('welcomeEmailsSent signalContactsLightboxContactsSelected cvsContactEmailsAdded', function(e, data) {
      var $b, newtooltip;
      if (e.type === 'welcomeEmailsSent') {
        lbTrackEvent("Dashboard_Interaction_Grow_Club", "Emails_Added_Save");
      }
      if (e.type === 'signalContactsLightboxContactsSelected') {
        lbTrackEvent("Dashboard_Interaction_Grow_Club", "Emails_Import_Success");
      }
      if (e.type === 'cvsContactEmailsAdded') {
        lbTrackEvent("Dashboard_Interaction_Grow_Club", "Emails_Upload_Success");
      }
      $.fancybox.close();
      if (data.total > 0) {
        $b = $('#new-treatement .button-add-emails');
        newtooltip = $b.data('othertitle');
        $b.qtip('option', 'content.text', newtooltip);
      }
      return setTimeout(function() {
        $email_subscribers_number.text(0);
        return $email_subscribers_number.animateNumber({
          number: data.total_invitations
        });
      }, 1500);
    });
    $("#new-treatement *[title]").qtip({
      position: {
        my: 'top center',
        at: 'bottom center',
        hide: {
          when: {
            event: 'click'
          }
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow flok-qtip'
      }
    });
    return $("#new-treatement *[title]").on('click', function() {
      return $('.qtip').hide();
    });
  };

  initBotTile = function() {
    return $(".bot-q").on('click', function(e) {
      return window.openBotExplanationLightbox();
    });
  };

  window.initDashboardTabHome = function() {
    window.bindContactsLightboxNextBtn();
    window.bindSelectAllContactsCheckbox();
    window.initDashboardHome();
    window.bindGoManualBtn();
    window.bindGoAutomaticBtn();
    window.bindMailingListForm();
    window.bindSendAsPushMessageBtns();
    window.bindSendMessageBtn();
    window.bindCampaignProgressBarInit();
    window.initializePricingSlider();
    window.bindFinalPrintQRBtn();
    window.bindSetPasscodeGetQRBtn();
    initPunchcardTile();
    initMembersTile();
    initRewardsLine();
    initBotTile();
    initPushMessagesTile();
    initClosePrintPunchcardOverlay();
    window.isOpenFacebookPagesSelect();
    window.address_and_phone_provided = gon.address_and_phone_provided;
    window.welcome_reward_configured = gon.welcome_reward_configured;
    window.gmail_contacts = [];
    window.jquery_copy = jQuery;
    window.checked_contacts = false;
    window.token_to_be_pushed = null;
    window.qr_printed = false;
    window.push_message_sent_success = false;
    window.marketing_maximized = false;
    window.categories_opened = false;
    window.punchcard_mode = gon.is_pc_walkin === true ? 'walkin' : 'qr';
    window.elements_appended = false;
    $('#send-campaign-btn').fancybox({
      padding: 0,
      wrapCSS: 'locked-lightboxes',
      transitionIn: "fade",
      transitionOut: "fade"
    });
    $('#send-campaign-btn-small').fancybox({
      padding: 0,
      wrapCSS: 'locked-lightboxes',
      transitionIn: "fade",
      transitionOut: "fade"
    });
    $('#review-send-campaign-btn').fancybox({
      padding: 0,
      wrapCSS: 'locked-lightboxes',
      transitionIn: "fade",
      transitionOut: "fade"
    });
    $('#content').addClass('dashboard-home-content');
    return $('#preview-header > div.question-mark').qtip({
      content: {
        text: "This is what your app looks like! Any change you make or reward you add will be shown here."
      },
      position: {
        my: 'top center',
        at: 'bottom center',
        adjust: {
          y: 8,
          x: 8
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-preview'
      }
    });
  };

}).call(this);
(function() {
  var AboutTabObj;

  AboutTabObj = (function() {
    AboutTabObj.INSTANCES = [];

    AboutTabObj.clean_empty_instances = function() {
      var inst;
      inst = [];
      $.each(AboutTabObj.INSTANCES, function(i, v) {
        if (v && v.container_exists()) {
          return inst.push(v);
        }
      });
      return AboutTabObj.INSTANCES = inst;
    };

    function AboutTabObj(container, options) {
      var d_opts, obj;
      if (options == null) {
        options = {};
      }
      obj = this;
      this.container = $(container).first();
      if (this.container.length === 0) {
        this.container = $('body');
      }
      d_opts = {
        abouttext: this.container.find('.js-about-text'),
        working_hours_cont: this.container.find('.working-hours-container'),
        working_hours: gon.working_hours,
        hours_entry_html: ''
      };
      AboutTabObj.INSTANCES.push(this);
      this.options = $.extend(true, d_opts, options);
      this.$abouttext = this.options.abouttext;
      this.$working_hours_cont = this.options.working_hours_cont;
      this.working_hours = this.options.working_hours;
      this.hours_entry_html = this.options.hours_entry_html;
      this.text_changed = false;
      this.working_hours_changed = false;
      this.initWorkingHoursContainer();
      this.bindWorkingHoursContainerActions();
      this.container.find(".add-more-hours-btn").on('click', function(e) {
        var new_entry;
        e.preventDefault();
        if (obj.container.find(".working-hours-container .workhour-entry").length === 0) {
          obj.container.find(".working-hours-container").addClass('empty-not-changed');
        } else {
          obj.container.find(".working-hours-container").removeClass('empty-not-changed');
        }
        new_entry = null;
        new_entry = $(obj.hours_entry_html);
        new_entry.appendTo(obj.$working_hours_cont);
        obj.bindWorkingHoursContainerActions();
        return obj.container.find('.main-form-area-working-hours .right-col').mCustomScrollbar("scrollTo", '.workhour-entry:last');
      });
      this.container.find(".js-save-publish-btn").on('click', function(e) {
        e.preventDefault();
        if ($(this).parents(".main-form-area-header").hasClass('empty')) {
          return;
        }
        return $.ajax({
          type: "POST",
          url: Routes.dashboard_save_about_tab_path(),
          data: {
            about_tab_data: JSON.stringify(obj.collectData())
          },
          success: function() {
            obj.text_changed = false;
            obj.working_hours_changed = false;
            obj.updateCard();
            obj.container.find(".about-preview-edit-holder, .main-form-area-header").removeClass('not-published empty').addClass('published');
            return obj.updateEmptyClass();
          },
          dataType: 'json'
        });
      });
      this.container.find(".delete-this-section").on('click', function(e) {
        var json;
        e.preventDefault();
        json = obj.collectData();
        json.about_text = '';
        return $.ajax({
          type: "POST",
          url: Routes.dashboard_save_about_tab_path(),
          data: {
            about_tab_data: JSON.stringify(json)
          },
          success: function() {
            obj.container.find(".js-about-text").val("").trigger("change");
            obj.text_changed = false;
            obj.updateCard();
            obj.container.find(".about-preview-edit-holder, .main-form-area-header").removeClass('not-published empty').addClass('published');
            return obj.updateEmptyClass();
          },
          dataType: 'json'
        });
      });
      this.container.find('.js-count-chars').on('change paste keyup', function() {
        var $f;
        $f = $(this).parent().find('.js-c-count');
        return $f.text($(this).val().length);
      });
      this.container.find('.js-c-count').text(this.container.find('.js-count-chars').val().length);
      this.updateCard();
      if (obj.container.find(".working-hours-container .workhour-entry").length === 0) {
        obj.container.find(".working-hours-container").addClass('empty-not-changed');
        obj.container.find(".add-more-hours-btn").click();
      }
      this.initSocialInputs();
      obj.container.find('.close-about-banner-btn').on('click', function(e) {
        e.preventDefault();
        $(this).parents(".about-banner").slideUp();
        return $.get(Routes.set_business_attribute_json_var_path({
          about_tab_hide_banner: 1
        }));
      });
      if ($.trim(this.container.find(".js-about-text").val()).length < 5) {
        this.container.find(".about-preview-edit-holder, .main-form-area-header").addClass("not-published empty").removeClass('published');
      } else {
        this.container.find(".about-preview-edit-holder, .main-form-area-header").removeClass("not-published empty").addClass('published');
      }
      this.updateEmptyClass();
    }

    AboutTabObj.prototype.initSocialInputs = function() {
      var obj;
      obj = this;
      obj.container.find('.social-sites-main-area input').on('change paste keyup', function() {
        return $(this).parents(".social-row").addClass('changed').removeClass('saved');
      });
      obj.container.find(".social-sites-main-area input").focus(function() {
        return $(this).parents(".social-row").addClass('focus');
      });
      obj.container.find(".social-sites-main-area input").focusout(function() {
        return $(this).parents(".social-row").removeClass('focus');
      });
      obj.container.find(".social-sites-area .save-social-field").on('click', function(e) {
        e.preventDefault();
        if (!$(this).hasClass('disabled')) {
          return $(this).parents(".social-row").find('form').first().submit();
        }
      });
      $(document).on('ajax:success', obj.container.find(".social-sites-area form"), function(event, data) {
        return $(event.currentTarget.activeElement).parents(".social-row").removeClass('focus changed').addClass('saved check');
      });
      return obj.addValidationsToSocialInputs();
    };

    AboutTabObj.prototype.addValidationsToSocialInputs = function() {
      var errorClass, obj, validClass;
      obj = this;
      $.validator.addMethod("uri", (function(value, element, param) {
        var re;
        if (this.optional(element)) {
          return true;
        }
        re = new RegExp(/((http|https):\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/);
        if (!re.test(value)) {
          return false;
        }
        if (Object.prototype.toString.call(param) === "[object RegExp]") {
          param = new RegExp(param);
          return param.test(value);
        }
        return true;
      }), "Invalid format.");
      errorClass = "error";
      validClass = "valid";
      obj.container.find(".social-sites-area form").each(function() {
        return $(this).validate({
          onkeyup: false,
          onfocusout: false,
          highlight: function(element, errorClass, validClass) {
            $(element).parents("div.social-row").addClass(errorClass).removeClass(validClass);
            return $(element).parents('.input-col').siblings('.save-social-field-area').children('.social-field-btn').addClass('disabled');
          },
          unhighlight: function(element, errorClass, validClass) {
            $(element).parents("div.social-row").removeClass(errorClass).addClass(validClass);
            return $(element).parents('.input-col').siblings('.save-social-field-area').children('.social-field-btn').removeClass('disabled');
          },
          rules: {
            'twitter': {
              uri: /^https:\/\/(www\.)?twitter\.com\//,
              required: false
            },
            'instagram': {
              uri: /^http(s)?:\/\/(www\.)?instagram\.com\//,
              required: false
            },
            'foursquare': {
              uri: /^https:\/\/(www\.)?foursquare\.com\//,
              required: false
            },
            'facebook': {
              uri: /^https:\/\/(www\.)?facebook\.com\//,
              required: false
            },
            'googleplus': {
              uri: /^https:\/\/(www\.)?plus\.google\.com\//,
              required: false
            },
            'yelp': {
              uri: /^http:\/\/(www\.)?yelp\.com\//,
              required: false
            },
            'your_website': {
              uri: /^((http|https):\/\/)?(www\.)?/,
              required: false
            }
          },
          messages: {
            'twitter': {
              uri: 'Please insert a valid twitter url'
            },
            'instagram': {
              uri: 'Please insert a valid instagram url'
            },
            'foursquare': {
              uri: 'Please insert a valid foursquare url'
            },
            'facebook': {
              uri: 'Please insert a valid facebook url'
            },
            'googleplus': {
              uri: 'Please insert a valid googleplus url'
            },
            'yelp': {
              uri: 'Please insert a valid yelp url'
            },
            'your_website': {
              uri: 'Please insert a valid url'
            }
          }
        });
      });
      return obj.container.find(".social-sites-area form input[type=text]").on('change keyup paste', function() {
        return $(this).valid();
      });
    };

    AboutTabObj.prototype.initWorkingHoursContainer = function() {
      var j, len, new_entry, obj, ref, wh;
      obj = this;
      if (obj.working_hours.working_hours) {
        ref = obj.working_hours.working_hours;
        for (j = 0, len = ref.length; j < len; j++) {
          wh = ref[j];
          new_entry = null;
          new_entry = $(obj.hours_entry_html);
          new_entry.find('.sun').toggleClass('selected', wh.sun);
          new_entry.find('.mon').toggleClass('selected', wh.mon);
          new_entry.find('.tue').toggleClass('selected', wh.tue);
          new_entry.find('.wed').toggleClass('selected', wh.wed);
          new_entry.find('.thu').toggleClass('selected', wh.thu);
          new_entry.find('.fri').toggleClass('selected', wh.fri);
          new_entry.find('.sat').toggleClass('selected', wh.sat);
          new_entry.find('.choose-hours-selects .js-from-hours').val(wh.start);
          new_entry.find('.choose-hours-selects .js-to-hours').val(wh.end);
          new_entry.appendTo(obj.$working_hours_cont);
        }
      }
      return obj.bindSelectValidations();
    };

    AboutTabObj.prototype.bindWorkingHoursContainerActions = function() {
      var obj;
      obj = this;
      obj.container.find('.choose-weekdays-select li:not(.weekdaysBinded)').addClass("weekdaysBinded").on('click', function(e) {
        e.preventDefault();
        if ($(this).hasClass('selected')) {
          if ($(this).parents(".choose-weekdays-select").find("li.selected").length > 1) {
            $(this).toggleClass('selected');
          } else {
            $(this).effect("highlight");
          }
        } else {
          $(this).toggleClass('selected');
        }
        if (obj.isEntryValid($(this).parents('.workhour-entry'))) {
          obj.working_hours_changed = true;
          return obj.updateEmptyClass();
        }
      });
      obj.container.find('.remove-hours-btn:not(.removeHoursBtnBinded)').addClass('removeHoursBtnBinded').on('click', function(e) {
        e.preventDefault();
        return $(this).parents(".workhour-entry").slideUp(function() {
          $(this).remove();
          if (obj.container.find(".working-hours-container .workhour-entry").length === 0) {
            obj.container.find(".add-more-hours-btn").click();
          }
          if (gon.working_hours.working_hours.length > 0) {
            obj.working_hours_changed = true;
          }
          return obj.updateEmptyClass();
        });
      });
      obj.container.find('.js-about-text:not(.text-field-binded)').addClass("text-field-binded").on('change keyup paste', function() {
        if (!($(this).val().length < 1 || $(this).val().length >= 500)) {
          obj.text_changed = true;
          return obj.updateEmptyClass();
        }
      });
      obj.container.find(".js-from-hours:not(.select-binded)").addClass("select-binded").on('change', function() {
        return obj.updateSelects(this);
      });
      return obj.container.find(".js-from-hours:not(.select-binded-2), .js-to-hours:not(.select-binded-2)").addClass("select-binded-2").on('change', function() {
        var allowed_values, min_val, selected_val;
        if ($(this).hasClass('js-from-hours')) {
          selected_val = $(this).find("option:selected").val();
          min_val = parseInt(selected_val);
          allowed_values = [];
          $(this).parents(".workhour-entry").find(".js-to-hours option").each(function() {
            var val;
            val = $(this).val();
            if (parseInt(val) <= min_val) {
              return $(this).attr("disabled", true);
            } else {
              $(this).attr("disabled", false);
              return allowed_values.push(val);
            }
          });
          if (allowed_values.indexOf($(this).parents(".workhour-entry").find(".js-to-hours").val()) === -1) {
            $(this).parents(".workhour-entry").find(".js-to-hours").val(allowed_values[0]);
          }
        }
        if (obj.isEntryValid($(this).parents('.workhour-entry'))) {
          obj.working_hours_changed = true;
          return obj.updateEmptyClass();
        }
      });
    };

    AboutTabObj.prototype.isEntryValid = function(e) {
      var $e, obj;
      obj = this;
      $e = $(e);
      if ($e.find(".choose-weekdays-select li.selected").length > 0 && $(".js-from-hours").val() !== null && $(".js-to-hours").val() !== null) {
        return true;
      }
      return false;
    };

    AboutTabObj.prototype.updateEmptyClass = function() {
      var obj, text_length, trimed_text_lenght;
      obj = this;
      if (obj.text_changed || obj.working_hours_changed) {
        text_length = $(obj.$abouttext).val().length;
        trimed_text_lenght = $.trim($(obj.$abouttext).val()).length;
        if ((trimed_text_lenght === 0 && text_length === 0) || trimed_text_lenght > 5) {
          return obj.container.find(".main-form-area-header").removeClass("empty");
        } else {
          return obj.container.find(".main-form-area-header").addClass("empty");
        }
      } else {
        return obj.container.find(".main-form-area-header").addClass("empty");
      }
    };

    AboutTabObj.prototype.bindSelectValidations = function() {};

    AboutTabObj.prototype.updateSelects = function(e) {
      var ele, h, js_hours, obj;
      obj = this;
      ele = $(e);
      if (ele.length > 0 && typeof (ele.val()) === "string" && ele.val().length >= 2) {
        h = parseInt(ele.val().substring(0, 2));
        js_hours = ele.parents(".choose-hours-selects").find(".js-to-hours");
        return js_hours.find("option").each(function() {
          var v;
          return v = $(this).attr('value');
        });
      }
    };

    AboutTabObj.prototype.collectData = function() {
      var d, obj, wh;
      obj = this;
      d = {};
      d.about_text = this.$abouttext.val();
      wh = [];
      obj.$working_hours_cont.find(".workhour-entry").each(function(k, v) {
        var $this, new_entry;
        new_entry = {};
        $this = $(this);
        new_entry.sun = $this.find('.choose-weekdays-select .sun').first().hasClass('selected');
        new_entry.mon = $this.find('.choose-weekdays-select .mon').first().hasClass('selected');
        new_entry.tue = $this.find('.choose-weekdays-select .tue').first().hasClass('selected');
        new_entry.wed = $this.find('.choose-weekdays-select .wed').first().hasClass('selected');
        new_entry.thu = $this.find('.choose-weekdays-select .thu').first().hasClass('selected');
        new_entry.fri = $this.find('.choose-weekdays-select .fri').first().hasClass('selected');
        new_entry.sat = $this.find('.choose-weekdays-select .sat').first().hasClass('selected');
        new_entry.start = $this.find('.choose-hours-selects .js-from-hours').first().val();
        new_entry.end = $this.find('.choose-hours-selects .js-to-hours').first().val();
        if (!($this.find('.choose-weekdays-select .selected').length === 0 || new_entry.start === null || new_entry.end === null)) {
          return wh.push(new_entry);
        }
      });
      d.working_hours = wh;
      return d;
    };

    AboutTabObj.prototype.updateCard = function() {
      var data, entry, has_text, has_weekdays, hourToPmAm, hours_content, j, len, obj, ref, txt;
      obj = this;
      data = obj.collectData();
      has_text = data.about_text.length !== 0;
      obj.container.find(".about-preview-edit-holder .text-box-visible").text(data.about_text);
      obj.container.find(".about-preview-edit-holder").toggleClass('text-visible', has_text);
      obj.container.find(".about-preview-edit-holder").toggleClass('text-empty', !has_text);
      hourToPmAm = function(hour) {
        var ampm, h, m;
        h = parseInt(hour.substring(0, 2));
        m = parseInt(hour.substring(2, 4)) || "00";
        if ((h - 12) >= 0) {
          ampm = 'pm';
          h = h % 12;
        } else {
          ampm = 'am';
        }
        if (h === 0) {
          h = 12;
        }
        return h + ":" + m + ampm;
      };
      hours_content = "";
      ref = data.working_hours;
      for (j = 0, len = ref.length; j < len; j++) {
        entry = ref[j];
        txt = "";
        if (entry.mon) {
          txt += "Monday, ";
        }
        if (entry.tue) {
          txt += "Tuesday, ";
        }
        if (entry.wed) {
          txt += "Wednesday, ";
        }
        if (entry.thu) {
          txt += "Thursday, ";
        }
        if (entry.fri) {
          txt += "Friday, ";
        }
        if (entry.sat) {
          txt += "Saturday, ";
        }
        if (entry.sun) {
          txt += "Sunday, ";
        }
        txt = txt.replace(/, $/, '');
        txt += ": " + (hourToPmAm(entry.start)) + " - " + (hourToPmAm(entry.end));
        hours_content += "<li>" + txt + "</li>";
      }
      obj.container.find(".add-your-hours-content ul").html(hours_content);
      has_weekdays = data.working_hours.length !== 0;
      obj.container.find(".about-preview-edit-holder").toggleClass('hours-visible', has_weekdays);
      return obj.container.find(".about-preview-edit-holder").toggleClass('hours-empty', !has_weekdays);
    };

    return AboutTabObj;

  })();

  window.initDashboardAbout = function() {
    return $('#about-tab .add-your-hours-content, #about-tab .main-form-area-working-hours .right-col').mCustomScrollbar({
      theme: 'dark-3',
      scrollInertia: 750
    });
  };

  window.AboutTabObj = AboutTabObj;

}).call(this);
(function() {
  var changeMoudelVisibility, checkCopyBtn, displayTreatmentBar, hideTreatmentBar, initGoogleMap, initPhotoGallery;

  initGoogleMap = function() {
    var latLng, myOptions, wpAdressMap, wpMapMarker;
    if ($("#adress-module").length > 0) {
      latLng = new google.maps.LatLng(gon.business_location_lat, gon.business_location_lng);
      myOptions = {
        zoom: 15,
        center: latLng,
        zoomControl: false,
        scrollwheel: false,
        draggable: false,
        disableDoubleClickZoom: true,
        disableDefaultUI: true
      };
      wpAdressMap = new google.maps.Map(document.getElementById("adress-module-map"), myOptions);
      wpMapMarker = new google.maps.Marker({
        position: latLng,
        map: wpAdressMap
      });
      wpAdressMap.addListener('click', function() {
        window.open('https://www.google.com/maps?q=loc:' + gon.business_location_lat + ',' + gon.business_location_lng, '_blank');
      });
      wpMapMarker.addListener('click', function() {
        window.open('https://www.google.com/maps?q=loc:' + gon.business_location_lat + ',' + gon.business_location_lng, '_blank');
      });
      if (wpAdressMap) {

      }
    }
  };

  changeMoudelVisibility = function() {
    return $('.wp-switch-holder').on('click', function(e) {
      var chosenModule, gaData, switcher;
      e.preventDefault();
      switcher = $(this);
      chosenModule = switcher.closest($('.wp-module-defined')).prop('id');
      gaData = switcher.closest($('.wp-module-defined')).data("ga");
      return $.ajax({
        type: "GET",
        url: Routes.ajax_update_off_wp_modules_path(),
        dataType: 'json',
        data: {
          off_module: chosenModule
        }
      }).done(function(data) {
        if (switcher.hasClass('on')) {
          switcher.removeClass('on').addClass('off');
          return lbTrackEvent("Merchant_Web_Pages_Interaction", gaData + "_Off_Click");
        } else {
          switcher.removeClass('off').addClass('on');
          return lbTrackEvent("Merchant_Web_Pages_Interaction", gaData + "_On_Click");
        }
      });
    });
  };

  initPhotoGallery = function() {
    return $('#photo-gallery').unslider({
      keys: false,
      arrows: {
        prev: '<a class="unslider-arrow prev wp-img wp-img-gallery-left-arrow"></a>',
        next: '<a class="unslider-arrow next wp-img wp-img-gallery-right-arrow"></a>'
      },
      nav: false,
      infinite: true
    });
  };

  displayTreatmentBar = function() {
    return $('.share-it-btn').on('click', function(e) {
      var clickedElement, jclickedElement;
      clickedElement = e.originalEvent.srcElement;
      jclickedElement = $(clickedElement);
      if (!jclickedElement.hasClass('copy-link-btn')) {
        $('#dashboard-treatment-bar').toggleClass('visible');
        if ($('#dashboard-treatment-bar').hasClass('visible')) {
          return lbTrackEvent("Merchant_Web_Pages_Interaction", "Share_Click");
        }
      }
    });
  };

  hideTreatmentBar = function() {
    return $('#web-page-sub-tab').on('click', function() {
      return $('#dashboard-treatment-bar').removeClass('visible');
    });
  };

  checkCopyBtn = function() {
    $('.copy-link-btn').addClass('clicked');
    return setTimeout(function() {
      return $('.copy-link-btn').removeClass('clicked');
    }, 2000);
  };

  window.initDashboardTabWebPage = function() {
    var _elem, clipboard;
    displayTreatmentBar();
    hideTreatmentBar();
    changeMoudelVisibility();
    initGoogleMap();
    if (!gon.merchant_mode) {
      initPhotoGallery();
      $("#wep-page-layout").removeClass("wpOffest");
      return window.scroll(0, 240);
    } else {
      _elem = document.querySelectorAll('.copy-link-btn');
      clipboard = new Clipboard(_elem);
      return clipboard.on('success', function(e) {
        return checkCopyBtn();
      });
    }
  };

}).call(this);
(function() {
  var bindCustomPunches, changePunchcardMockImg, changePunchesNumberFontSize, disableSubmitWithEnter, dispalyPrintContainer, editPunchCard, enableDisableCustomerReferralsSwithcer, goBackToSavedMode, initAllPcFormValidations, initPlusMinusCounter, initializeCardTypeOptions, innerCloseAdvancedSettings, innerOpenAdvancedSettings, openAdvancedSettings, releaseSavePunchcardBtn, unableCustomPunches, unpublishPunchCard, updateChangesAfterSaving;

  dispalyPrintContainer = function(selectedPunchType) {
    if (selectedPunchType === "walkin") {
      $('.print-container').removeClass('active').addClass('disabled');
      return $('.unpublish-punchcard-container').addClass('display');
    } else if (selectedPunchType === "qr") {
      $('.print-container').removeClass('disabled').addClass('active');
      return $('.unpublish-punchcard-container').removeClass('display');
    }
  };

  releaseSavePunchcardBtn = function() {
    var saveBtn, tbLength, textBox;
    textBox = $('.js-edited-reward');
    tbLength = $.trim(textBox.val()).length;
    saveBtn = $('.js-punchcard-save');
    if (tbLength < 3) {
      saveBtn.addClass('disabled');
    }
    return $('.js-edited-reward').on('keyup', function(e) {
      tbLength = $.trim(textBox.val()).length;
      e.preventDefault();
      if (tbLength > 3 && tbLength < 61) {
        saveBtn.removeClass('disabled');
      } else {
        saveBtn.addClass('disabled');
      }
      return $('.reward-desctiprion-char-num').text(tbLength + "/60");
    });
  };

  openAdvancedSettings = function() {
    return $('.advanced-settings-link').on('click', function() {
      if ($(this).hasClass('isOpen')) {
        return innerCloseAdvancedSettings();
      } else {
        return innerOpenAdvancedSettings();
      }
    });
  };

  innerOpenAdvancedSettings = function() {
    var advancedHolder, customerReferral;
    $('.advanced-settings-link').addClass('isOpen');
    $('.punchcard-advanced-settings-btn-img').addClass('rotate');
    advancedHolder = $(".punchcard-edit-advanced-settings-choices-holder");
    customerReferral = $('.customer-referrals-holder');
    $('#punchcard-tab').addClass('change-height');
    $('.punchcard-edit-advanced-settings').addClass('change-height');
    advancedHolder.addClass('drop-transition').removeClass('lift-transition');
    return customerReferral.addClass('drop-transition').removeClass('lift-transition');
  };

  innerCloseAdvancedSettings = function() {
    var advancedHolder, customerReferral;
    $('.advanced-settings-link').removeClass('isOpen');
    $('.punchcard-advanced-settings-btn-img').removeClass('rotate');
    advancedHolder = $(".punchcard-edit-advanced-settings-choices-holder");
    customerReferral = $('.customer-referrals-holder');
    $('#punchcard-tab').removeClass('change-height');
    $('.punchcard-edit-advanced-settings').removeClass('change-height');
    advancedHolder.addClass('lift-transition').removeClass('drop-transition');
    return customerReferral.addClass('lift-transition').removeClass('drop-transition');
  };

  bindCustomPunches = function() {
    return $('#custom_punches_amount').on('change', function() {
      $('#custom-punches').val($(this).val());
    });
  };

  unableCustomPunches = function() {
    return $('.card-type-option').on('ifChanged', function() {
      var counterForm, currentPunchesChoise, lableText, minusButton, plusButton;
      currentPunchesChoise = $(this);
      lableText = currentPunchesChoise.parent().siblings('.option-text');
      lableText.toggleClass('bold');
      counterForm = $('.custom-punches-amount');
      minusButton = $('.counter-minus-btn');
      plusButton = $('.counter-plus-btn');
      if (currentPunchesChoise.prop('id') === 'punchcard_tab_form_custom-punches') {
        $('.plus-minus-counter').addClass('visible');
        $('.plus-minus-counter').removeClass('hidden');
        if (counterForm.val() <= 2) {
          minusButton.addClass('disable-counter-buttons');
          return plusButton.removeClass('disable-counter-buttons');
        } else if (counterForm.val() >= 99) {
          minusButton.removeClass('disable-counter-buttons');
          return plusButton.addClass('disable-counter-buttons');
        } else {
          minusButton.removeClass('disable-counter-buttons');
          return plusButton.removeClass('disable-counter-buttons');
        }
      } else {
        $('.plus-minus-counter').addClass('hidden');
        return $('.plus-minus-counter').removeClass('visible');
      }
    });
  };

  editPunchCard = function() {
    return $('#saved-punchcard-edit-button').on('click', function(e) {
      e.preventDefault();
      $('#punchcard-tab').removeClass('active').addClass('disabled');
      $('.unpublish-punchcard-container').removeClass('active').addClass('disabled');
      return $('.create-punchcard-title').text('Edit Punchcard');
    });
  };

  unpublishPunchCard = function() {
    $('.js-unpublish-punchcard').on('click', function(e) {
      return $.fancybox({
        type: 'inline',
        href: '#unpublish-punchcard-lightbox',
        padding: 0,
        wrapCSS: 'locked-lightboxes',
        closeBtn: false,
        closeClick: false,
        centerOnScroll: true
      });
    });
    return $('.js-choosen-to-unpublish-punchcard').on('click', function(e) {
      e.preventDefault();
      $.fancybox.close();
      return $.ajax({
        url: Routes.clear_punchcard_path(),
        beforeSend: function() {
          return showCogLoadingOverlay();
        },
        success: function(data) {
          $('#punchcard-tab').removeClass('active').addClass('disabled');
          $('.unpublish-punchcard-container').removeClass('active').addClass('disabled');
          $('.punchcard-statistics-amount').text('0');
          $('.js-back-btn').removeClass('active').addClass('disabled');
          $(".js-edited-reward").val("").trigger('change');
          return $(".btn-save-punchcard-button").addClass('disabled');
        },
        complete: function() {
          $('.customer-referrals-holder .switcher-holder').addClass('undefined');
          $('.customer-referrals-holder').addClass('undefined');
          innerCloseAdvancedSettings();
          return hideCogLoadingOverlay();
        },
        dataType: 'json'
      });
    });
  };

  changePunchcardMockImg = function(punchesAmount) {
    var isThemeDark, punchcardImg, punchesNumberLabel;
    if (punchesAmount === -1) {
      return;
    }
    isThemeDark = gon.isThemeColorDark;
    punchcardImg = $('.punchcard.punchcard-mock-img');
    punchesNumberLabel = $('.custom-punches-number');
    punchcardImg.attr('class', 'punchcard punchcard-mock-img');
    punchesNumberLabel.attr('class', 'custom-punches-number');
    if (isThemeDark) {
      switch (punchesAmount) {
        case '5':
          punchcardImg.addClass('punchcard-five-punches-punchcard-dark-img');
          return lbTrackEvent('Punch_Card_Interaction', '5_Punches_Select');
        case '10':
          punchcardImg.addClass('punchcard-ten-punches-punchcard-dark-img');
          return lbTrackEvent('Punch_Card_Interaction', '10_Punches_Select');
        default:
          punchcardImg.addClass('punchcard-custom-punchcard-dark-img');
          punchesNumberLabel.addClass('shown dark');
          changePunchesNumberFontSize(parseInt(punchesAmount));
          return lbTrackEvent('Punch_Card_Interaction', 'Custom_Punches_Select');
      }
    } else {
      switch (punchesAmount) {
        case '5':
          punchcardImg.addClass('punchcard-five-punches-punchcard-light-img');
          return lbTrackEvent('Punch_Card_Interaction', '5_Punches_Select');
        case '10':
          punchcardImg.addClass('punchcard-ten-punches-punchcard-light-img');
          return lbTrackEvent('Punch_Card_Interaction', '10_Punches_Select');
        default:
          punchcardImg.addClass('punchcard-custom-punchcard-light-img');
          punchesNumberLabel.addClass('shown light');
          changePunchesNumberFontSize(parseInt(punchesAmount));
          return lbTrackEvent('Punch_Card_Interaction', 'Custom_Punches_Select');
      }
    }
  };

  updateChangesAfterSaving = function() {
    $(document).on('ajax:beforeSend', 'form.update-punchcard', function() {
      return window.showCogLoadingOverlay();
    });
    return $(document).on('ajax:success', 'form.update-punchcard', function(e, data) {
      var newTokenId, punchesAmount, selectedPunchType;
      if (data.errors !== null) {
        $('#pc-server-errors-selection').val(data.errors);
      }
      newTokenId = data['new_punchcard_token_id'];
      $('.customer-referrals-holder .switcher-holder').attr('data-t-id', newTokenId);
      $('.customer-referrals-holder .switcher-holder').removeClass('undefined');
      $('.customer-referrals-holder').removeClass('undefined');
      $('#punchcard-tab').removeClass('change-height');
      punchesAmount = $('input[name="punchcard[size]"]:checked', '.update-punchcard').val();
      changePunchcardMockImg(punchesAmount);
      selectedPunchType = $('input[name="punchcard[punchcard_mode]"]:checked', '.update-punchcard').val();
      switch (selectedPunchType) {
        case "qr":
          lbTrackEvent('Punch_Card_Interaction', 'Select_Purchase_Based');
          break;
        case "walkin":
          lbTrackEvent('Punch_Card_Interaction', 'Select_Visit_Based');
      }
      dispalyPrintContainer(selectedPunchType);
      innerCloseAdvancedSettings();
      $('.card-description-text').text(parseInt(punchesAmount) + ' x Punch Card');
      $('.custom-punches-number').text(parseInt(punchesAmount));
      $('.reward-description-text').val($('.js-edited-reward').val());
      $('.reward-description-text').text($('.js-edited-reward').val());
      $('#punchcard-tab').removeClass('disabled').addClass('active');
      $('.unpublish-punchcard-container').removeClass('disabled').addClass('active');
      $('.js-back-btn').removeClass('disabled').addClass('active');
      return window.hideCogLoadingOverlay();
    });
  };

  changePunchesNumberFontSize = function(punches_amount) {
    var textToChange;
    textToChange = $('.custom-punches-number');
    if (punches_amount > 9) {
      return textToChange.addClass('two-chars');
    } else {
      return textToChange.removeClass('two-chars');
    }
  };

  goBackToSavedMode = function() {
    return $('.js-back-btn').on('click', function() {
      $('#punchcard-tab').removeClass('disabled').addClass('active');
      return $('.unpublish-punchcard-container').removeClass('disabled').addClass('active');
    });
  };

  disableSubmitWithEnter = function() {
    return $("form").on('keypress', function(e) {
      if (e.keyCode === 13) {
        return false;
      }
    });
  };

  initializeCardTypeOptions = function() {
    return $('.card-type-option').each(function() {
      if ($(this).is(':checked')) {
        $(this).siblings('.option-text').addClass('bold');
        if ($(this).prop('id') !== 'punchcard_tab_form_custom-punches') {
          $('.plus-minus-counter').addClass('hidden');
          return $('.plus-minus-counter').removeClass('visible');
        } else {
          $('.plus-minus-counter').removeClass('hidden');
          return $('.plus-minus-counter').addClass('visible');
        }
      }
    });
  };

  enableDisableCustomerReferralsSwithcer = function() {
    return $('.customer-referrals-holder .switcher-holder').on('click', function(e) {
      var switchedOff, switcher, tId;
      e.preventDefault();
      switcher = $(this);
      switchedOff = switcher.hasClass('on');
      tId = switcher.attr('data-t-id');
      return $.ajax({
        url: Routes.change_customer_referrals_state_path(),
        data: {
          type: "POST",
          turn_off: switchedOff,
          t_id: tId
        },
        success: function(data) {
          if (switchedOff) {
            switcher.removeClass('on').addClass('off');
            return $('#punchcard_tab_form_punchcard_customer_referral').val(0);
          } else {
            switcher.removeClass('off').addClass('on');
            return $('#punchcard_tab_form_punchcard_customer_referral').val(1);
          }
        }
      });
    });
  };

  initAllPcFormValidations = function() {
    return $('form.update-punchcard').validate({
      errorElement: 'em',
      errorClass: 'validation-error',
      highlight: function(element, errorClass, validClass) {
        return $(element).siblings(".validate-field").addClass(errorClass).removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).siblings(".validate-field").addClass(validClass).removeClass(errorClass);
      },
      rules: {
        "punchcard[description]": {
          required: true,
          minlength: 4,
          maxlength: 60
        },
        "punchcard[size]": {
          required: true,
          pcSizeRange: true
        }
      }
    });
  };

  initPlusMinusCounter = function() {
    var changePunchesAmountByButtons, changePunchesAmountByForm, validatePunchesAmount;
    changePunchesAmountByButtons = function() {
      return $('.counter-minus-btn, .counter-plus-btn').on('click', function() {
        var newPunchesAmount, punchesAmount;
        console.log("ELK");
        punchesAmount = $('.custom-punches-amount').val();
        console.log(punchesAmount);
        if (punchesAmount !== "NaN" || "") {
          if ($(this).hasClass('counter-minus-btn')) {
            newPunchesAmount = parseInt(punchesAmount) - 1;
          } else if ($(this).hasClass('counter-plus-btn')) {
            newPunchesAmount = parseInt(punchesAmount) + 1;
          }
          $('#custom_punches_amount').val(newPunchesAmount);
          $('#punchcard_tab_form_custom-punches').val(newPunchesAmount);
        } else {
          $('#custom-punches-amount').val(2);
          $('#punchcard_tab_form_custom-punches').val(2);
        }
        return validatePunchesAmount(newPunchesAmount);
      });
    };
    changePunchesAmountByForm = function() {
      return $('#custom_punches_amount').change(function() {
        var punchesAmount;
        punchesAmount = $('.custom-punches-amount').val();
        if (/^[a-zA-Z0-9.]*$/.test(punchesAmount)) {
          punchesAmount = parseInt(punchesAmount);
          if (punchesAmount < 2) {
            punchesAmount = 2;
          }
        } else {
          punchesAmount = 2;
        }
        $('.custom-punches-amount').val(punchesAmount);
        $('#punchcard_tab_form_custom-punches').val(punchesAmount);
        return validatePunchesAmount(punchesAmount);
      });
    };
    validatePunchesAmount = function(punchesAmount) {
      if (punchesAmount >= 99) {
        return $('.counter-plus-btn').addClass('disable-counter-buttons');
      } else if (punchesAmount <= 2) {
        return $('.counter-minus-btn').addClass('disable-counter-buttons');
      } else if ($('#punchcard_tab_form_custom-punches').is(':checked')) {
        return $('.counter-minus-btn, .counter-plus-btn').removeClass('disable-counter-buttons');
      }
    };
    $('.counter-minus-btn, .counter-plus-btn').addClass('disable-counter-buttons');
    changePunchesAmountByButtons();
    changePunchesAmountByForm();
    forceNumericality();
    return validatePunchesAmount();
  };

  window.initDashboardTabPunchCard = function() {
    var punchesAmount;
    punchesAmount = $('.card-type-selection-options').data('punches-size');
    if (gon.punchcard_varies) {
      punchesAmount = -1;
    }
    initializeCardTypeOptions();
    releaseSavePunchcardBtn();
    openAdvancedSettings();
    unableCustomPunches();
    editPunchCard();
    changePunchcardMockImg(punchesAmount);
    updateChangesAfterSaving();
    changePunchesNumberFontSize(parseInt(punchesAmount));
    unpublishPunchCard();
    disableSubmitWithEnter();
    goBackToSavedMode();
    bindCustomPunches();
    enableDisableCustomerReferralsSwithcer();
    initPlusMinusCounter();
    initAllPcFormValidations();
    if ($('.customer-referrals-holder .switcher-holder').attr('data-t-id') === void 0) {
      $('.customer-referrals-holder .switcher-holder').addClass('undefined');
      $('.customer-referrals-holder').addClass('undefined');
    }
    return $('.card-type-selection-options .card-type-option, .punch-type-options .punch-type-option').iCheck({
      checkboxClass: 'iradio_lb3',
      radioClass: 'iradio_lb3',
      increaseArea: '0%'
    });
  };

}).call(this);
(function() {
  var bindChanceSelectorChanges, bindCharCounterForTextArea, bindEditRewardBtn, bindEscapeKey, bindEscapeLinkPress, bindRemoveRewardBtn, bindRewardCategoryChange, bindRewardSubmissionForForm, bindRewardsInputsChange, bindTextAreaChangeForContainer, bindTopCloseBtn, converBuyExpiryToSelectItem, convertExpiryToSelectItem, flipRewardContainer, hourToPmAm, initCallValidationsFor, initFacebookForm, initFacebookReferralForm, initHappyHoursForm, initLuckyForm, initVisitValidationsFor, initWelcomeForm, isInt, locateQtipSelector, ordinal_suffix_of, populateNewValuesInPresettings, renderUpdatedTimeFor, resetForm, resetFormToPresettings, showEscapeContainer, updateHappyHourTimesInSavedContainer, updatePricesIfBuyType,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  bindRewardCategoryChange = function(select_ele) {
    select_ele.on('change', function() {
      var $relevant_content, $reward_container, buy_section, call_section, new_value, previously_selected_category, visit_section;
      console.log(select_ele.val());
      new_value = select_ele.val();
      $reward_container = $(this).closest('.reward-container');
      $relevant_content = select_ele.closest('.header').siblings('.content');
      previously_selected_category = $relevant_content.find('.selected');
      visit_section = $relevant_content.find('.visit');
      buy_section = $relevant_content.find('.buy-now');
      call_section = $relevant_content.find('.call-to-buy');
      $("#rewards-tab .ele-selectric-tooltip").qtip('hide');
      if (new_value === '0' && !visit_section.hasClass('selected')) {
        previously_selected_category.fadeOut();
        visit_section.fadeIn();
        previously_selected_category.removeClass('selected');
        previously_selected_category = visit_section;
        $reward_container.find('.saved-container.visit').addClass('show-saved-container').removeClass('hide-saved-container');
        $reward_container.find('.saved-container').not('.visit').addClass('hide-saved-container').removeClass('show-saved-container');
      } else if (new_value === '1' && !buy_section.hasClass('selected')) {
        console.log(gon.bank_info_configured);
        if (gon.buy_now_locked) {
          window.showBlockTabLightbox("buy_now");
          select_ele.val(window.last_selectric_val).selectric('refresh');
        } else {
          lb_log($reward_container.find('.type-container.selected'));
          lb_log($reward_container.find('.type-container.selected .unlock-type-field').val());
          previously_selected_category.fadeOut();
          buy_section.fadeIn();
          previously_selected_category.removeClass('selected');
          previously_selected_category = buy_section;
          $reward_container.find('.saved-container.buy').addClass('show-saved-container').removeClass('hide-saved-container');
          console.log($reward_container.children('.saved-container.buy'));
          $reward_container.find('.saved-container').not('.buy').addClass('hide-saved-container').removeClass('show-saved-container');
          console.log($reward_container.children('.saved-container').not('.buy'));
        }
      } else if (new_value === '2' && !call_section.hasClass('selected')) {
        previously_selected_category.fadeOut();
        call_section.fadeIn();
        previously_selected_category.removeClass('selected');
        previously_selected_category = call_section;
        $reward_container.find('.saved-container.call').addClass('show-saved-container').removeClass('hide-saved-container');
        $reward_container.find('.saved-container').not('.call').addClass('hide-saved-container').removeClass('show-saved-container');
      }
      return previously_selected_category.addClass('selected');
    });
    return select_ele.on('selectric-before-close', function() {
      return window.last_selectric_val = select_ele.val();
    });
  };

  bindTopCloseBtn = function() {
    return $('.close-info-banner-btn').on('click', function(e) {
      e.preventDefault;
      $(this).parents(".top-banner").slideUp();
      return $.get(Routes.set_business_attribute_json_var_path({
        rewards_top_banner_hide: 1
      }));
    });
  };

  bindCharCounterForTextArea = function(textarea_ele) {
    return textarea_ele.on('keyup change paste textarea_sync', function() {
      var len, max;
      max = 60;
      len = $(this).val().length;
      if (len >= max) {
        return $(this).parent().siblings('.charNum').text("60/60");
      } else {
        return $(this).parent().siblings('.charNum').text(len + "/60");
      }
    });
  };

  bindRewardSubmissionForForm = function(form_ele) {
    return form_ele.ajaxForm({
      beforeSend: function() {},
      success: function(data) {
        return form_ele.closest('.flip-container').toggleClass('saved-reward-transition');
      }
    });
  };

  populateNewValuesInPresettings = function($form) {
    var buy_presets, call_presets, days, expiry_presets, hh_presets, lucky_presets;
    buy_presets = {};
    expiry_presets = {};
    call_presets = {};
    hh_presets = {};
    lucky_presets = {};
    window.presets[$form.closest('.reward-container').data('tokenName')] = {
      'reward': $form.find(".reward-text").val(),
      'unlock_type': $form.find('.unlock-type-field').val()
    };
    if ($form.find('.unlock-type-field').val() === '1') {
      buy_presets = {
        'old_price': $form.find(".original-price-field").val(),
        'price': $form.find('.new-price-field').val(),
        'expiry': converBuyExpiryToSelectItem($form.find('.expiry-selector').val())
      };
    } else {
      expiry_presets = {
        'expiry': convertExpiryToSelectItem($form.find('.expiry-selector').val())
      };
    }
    if ($form.find('.unlock-type-field').val() === '2') {
      call_presets = {
        'phone': $form.find(".reward-phone-field").val()
      };
    }
    if ($form.closest('.reward-container').data('tokenType') === 'interval') {
      days = [];
      $form.find('.days-group').each(function() {
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('sun')) {
          days.push('0');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('mon')) {
          days.push('1');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('tue')) {
          days.push('2');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('wed')) {
          days.push('3');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('thu')) {
          days.push('4');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('fri')) {
          days.push('5');
        }
        if ($(this).val() === "true" && $(this).siblings('a').hasClass('sat')) {
          return days.push('6');
        }
      });
      hh_presets = {
        'days': days,
        'from': convertHourStringToSelectItem($form.find('.hh-from-selector').val()),
        'to': convertHourStringToSelectItem($form.find('.hh-to-selector').val())
      };
    }
    if ($form.closest('.reward-container').data('tokenType') === 'randomwalkin') {
      lucky_presets = {
        'chance': $form.find(".lucky-chance-selector").val()
      };
    }
    $.extend(window.presets[$form.closest('.reward-container').data('tokenName')], buy_presets, call_presets, hh_presets, lucky_presets, expiry_presets);
    lb_log(window.presets);
  };

  initWelcomeForm = function() {
    $(document).on("ajax:beforeSend", "form.welcome-reward-form", function() {
      var $this;
      console.log("before send");
      $this = $(this);
      renderUpdatedTimeFor($this);
      updatePricesIfBuyType($this);
      window.showSecureLoadingOverlay("Publishing your Welcome Reward...");
      return populateNewValuesInPresettings($this);
    });
    return $(document).on("ajax:success", "form.welcome-reward-form", function() {
      var $saved_container, $this, $welcome_container;
      console.log("success!");
      window.hideSecureLoadingOverlay();
      $this = $(this);
      $saved_container = $this.closest('.reward-container').find('.show-saved-container');
      $saved_container.find('.stats-container .reward-text').text($this.find('.reward-text').val());
      console.log($saved_container);
      window.saved_container_stats = $saved_container.find('.stats-number');
      $saved_container.find('.stats-number').text(0);
      $welcome_container = $('.welcome-container');
      showEscapeContainer($welcome_container);
      return flipRewardContainer($welcome_container);
    });
  };

  initHappyHoursForm = function() {
    console.log("Reaching initHappyHoursForm");
    $(".week-list a").on("click", function(e) {
      e.preventDefault();
      if ($(this).parent().find("input").val() === "true") {
        $(this).parent().find("input").val("false");
        return $(this).parent().removeClass("on");
      } else {
        $(this).parent().find("input").val("true");
        return $(this).parent().addClass("on");
      }
    });
    $(document).on("ajax:beforeSend", "form.hh-reward-form", function() {
      var $this, btn, element, from, to;
      window.showSecureLoadingOverlay("Publishing your Happy Hour Reward...");
      $this = $(this);
      renderUpdatedTimeFor($this);
      updatePricesIfBuyType($this);
      populateNewValuesInPresettings($this);
      from = parseInt($("form.hh-reward-form .selectric-hh-hours-selector .selectricInput").val());
      to = parseInt($("form.hh-reward-form .selectric-hh-hours-selector .selectricInput").val());
      if (from >= to) {
        element = $(".select_happy_hours div:first");
        element.qtip({
          style: {
            tip: "topLeft"
          },
          content: {
            text: "End hours have to be bigger than start hours"
          },
          show: {
            ready: true
          }
        });
        btn = $(this).find("input[type='submit']");
        btn.css("background", btn.data("background"));
        $(btn).attr("disabled", false);
        return false;
      }
    });
    return $(document).on("ajax:success", "form.hh-reward-form", function() {
      var $hh_container, $saved_container, $this;
      console.log("success!");
      window.hideSecureLoadingOverlay();
      $this = $(this);
      updateHappyHourTimesInSavedContainer();
      $saved_container = $this.closest('.reward-container').find('.show-saved-container');
      $saved_container.find('.stats-container .reward-text').text($this.find('.reward-text').val());
      $saved_container.find('.stats-number').text(0);
      $hh_container = $('.happy-hour-container');
      showEscapeContainer($hh_container);
      return flipRewardContainer($hh_container);
    });
  };

  initFacebookForm = function() {
    $(document).on("ajax:beforeSend", "form.facebook-reward-form", function() {
      var $this;
      console.log("before send");
      window.showSecureLoadingOverlay("Publishing your Facebook Check-in Reward...");
      $this = $(this);
      renderUpdatedTimeFor($this);
      updatePricesIfBuyType($this);
      return populateNewValuesInPresettings($this);
    });
    return $(document).on("ajax:success", "form.facebook-reward-form", function() {
      var $fb_container, $saved_container, $this;
      console.log("success!");
      window.hideSecureLoadingOverlay();
      $this = $(this);
      $saved_container = $this.closest('.reward-container').find('.show-saved-container');
      $saved_container.find('.stats-container .reward-text').text($this.find('.reward-text').val());
      $saved_container.find('.stats-number').text(0);
      $fb_container = $('.facebook-container');
      showEscapeContainer($fb_container);
      return flipRewardContainer($fb_container);
    });
  };

  initFacebookReferralForm = function() {
    $(document).on("ajax:beforeSend", "form.fb-referral-reward-form", function() {
      var $this;
      console.log("before send");
      $this = $(this);
      window.showSecureLoadingOverlay("Publishing your Facebook Referral Reward...");
      renderUpdatedTimeFor($this);
      updatePricesIfBuyType($this);
      return populateNewValuesInPresettings($this);
    });
    return $(document).on("ajax:success", "form.fb-referral-reward-form", function() {
      var $fb_ref_container, $saved_container, $this;
      console.log("success!");
      window.hideSecureLoadingOverlay();
      $this = $(this);
      $saved_container = $this.closest('.reward-container').find('.show-saved-container');
      $saved_container.find('.stats-container .reward-text').text($this.find('.reward-text').val());
      $saved_container.find('.stats-number').text(0);
      $fb_ref_container = $('.fb-referral-container');
      showEscapeContainer($fb_ref_container);
      return flipRewardContainer($fb_ref_container);
    });
  };

  initLuckyForm = function() {
    $(document).on("ajax:beforeSend", "form.lucky-reward-form", function() {
      var $this;
      console.log("before send");
      $this = $(this);
      window.showSecureLoadingOverlay("Publishing your Lucky Reward...");
      renderUpdatedTimeFor($this);
      updatePricesIfBuyType($this);
      return populateNewValuesInPresettings($this);
    });
    return $(document).on("ajax:success", "form.lucky-reward-form", function() {
      var $lucky_container, $saved_container, $this;
      console.log("success!");
      window.hideSecureLoadingOverlay();
      $this = $(this);
      $saved_container = $this.closest('.reward-container').find('.show-saved-container');
      $saved_container.find('.stats-container .reward-text').text($this.find('.reward-text').val());
      $saved_container.find('.stats-number').text(0);
      $lucky_container = $('.lucky-container');
      showEscapeContainer($lucky_container);
      return flipRewardContainer($lucky_container);
    });
  };

  ordinal_suffix_of = function(i) {
    var j, k;
    j = i % 10;
    k = i % 100;
    if (j === 1 && k !== 11) {
      return i + 'st';
    }
    if (j === 2 && k !== 12) {
      return i + 'nd';
    }
    if (j === 3 && k !== 13) {
      return i + 'rd';
    }
    return i + 'th';
  };

  bindChanceSelectorChanges = function() {
    return $('.select-chance-holder select').on('change', function() {
      var new_val;
      console.log("chance changed");
      new_val = $(this).val();
      return $('.prompts').text(ordinal_suffix_of(new_val));
    });
  };

  renderUpdatedTimeFor = function(form_ele) {
    var $this, hours, minutes, myDate;
    $this = form_ele;
    myDate = new Date;
    hours = myDate.getHours();
    minutes = myDate.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    return $this.closest('.reward-container').find('.last-updated').text(gon.formatted_time + hours + ":" + minutes);
  };

  isInt = function(n) {
    return n % 1 === 0;
  };

  updatePricesIfBuyType = function(form_ele) {
    var $this, new_price, old_price;
    if (form_ele.hasClass('buy-reward-form')) {
      $this = form_ele;
      old_price = "$" + $this.find('.original-price-field').val();
      new_price = "$" + $this.find('.new-price-field').val();
      if (isInt(old_price)) {
        old_price = old_price + ".00";
      }
      if (isInt(new_price)) {
        new_price = new_price + ".00";
      }
      $this.closest('.reward-container').find('.stats-container .price').removeClass('no-right-margin');
      $this.closest('.reward-container').find('.stats-container .old-price').text(old_price);
      return $this.closest('.reward-container').find('.stats-container .new-price').text(new_price);
    }
  };

  showEscapeContainer = function($reward_container) {
    return $reward_container.find('.escape-container').show();
  };

  resetForm = function($form) {
    $form.find('select').not('.lucky-chance-selector').val(0).selectric('refresh');
    $form.find('.lucky-chance-selector').val(5);
    $form.find('input, textarea').not('.save-btn').not('.unlock-type-field').val("");
    if ($form.hasClass('hh-reward-form')) {
      $form.find('.hh-from-selector').val('1500').selectric('refresh');
      $form.find('.hh-to-selector').val('1600').selectric('refresh');
      $form.find('.days-group').val(false);
      return $form.find('.days-group').closest("li").removeClass('on');
    }
  };

  resetFormToPresettings = function($form) {
    var $forms, $reward_container, chance, expiry, from_time, old_price, phone, price, to_time, token_name;
    $reward_container = $form.closest('.reward-container');
    $forms = $reward_container.find('form');
    token_name = $reward_container.data('tokenName');
    window.token_presets = window.presets[token_name];
    if (window.presets[token_name] != null) {
      expiry = window.presets[token_name]['expiry'] || 0;
      old_price = window.presets[token_name]['old_price'] || '';
      price = window.presets[token_name]['price'] || '';
      phone = window.presets[token_name]['phone'] || '';
      chance = parseInt(window.presets[token_name]['chance']) || 5;
      from_time = window.presets[token_name]['from'] ? window.presets[token_name]['from'][1] : "1500";
      to_time = window.presets[token_name]['to'] ? window.presets[token_name]['to'][1] : "1600";
      setTimeout(function() {
        var $relevant_content, buy_section, call_section, new_value, previously_selected_category, visit_section;
        $relevant_content = $reward_container.find('.content');
        previously_selected_category = $relevant_content.find('.selected');
        visit_section = $relevant_content.find('.visit');
        buy_section = $relevant_content.find('.buy-now');
        call_section = $relevant_content.find('.call-to-buy');
        new_value = window.presets[token_name]['unlock_type'];
        if (new_value === '0' && !visit_section.hasClass('selected')) {
          previously_selected_category.fadeOut();
          visit_section.fadeIn();
          previously_selected_category.removeClass('selected');
          previously_selected_category = visit_section;
          $reward_container.find('.saved-container.visit').addClass('show-saved-container').removeClass('hide-saved-container');
          $reward_container.find('.saved-container').not('.visit').addClass('hide-saved-container').removeClass('show-saved-container');
        } else if (new_value === '1' && !buy_section.hasClass('selected')) {
          previously_selected_category.fadeOut();
          buy_section.fadeIn();
          previously_selected_category.removeClass('selected');
          previously_selected_category = buy_section;
          $reward_container.find('.saved-container.buy').addClass('show-saved-container').removeClass('hide-saved-container');
          $reward_container.find('.saved-container').not('.buy').addClass('hide-saved-container').removeClass('show-saved-container');
        } else if (new_value === '2' && !call_section.hasClass('selected')) {
          previously_selected_category.fadeOut();
          call_section.fadeIn();
          previously_selected_category.removeClass('selected');
          previously_selected_category = call_section;
          $reward_container.find('.saved-container.call').addClass('show-saved-container').removeClass('hide-saved-container');
          $reward_container.find('.saved-container').not('.call').addClass('hide-saved-container').removeClass('show-saved-container');
        }
        $reward_container.find('.category-selector').val(new_value).selectric('refresh');
        return previously_selected_category.addClass('selected');
      }, 1000);
      $forms.find('.expiry-selector').val(expiry).selectric('refresh');
      $forms.find('.reward-text').val(window.presets[token_name]['reward']);
      $forms.find('.original-price-field').val(old_price);
      $forms.find('.new-price-field').val(price);
      $forms.find('.reward-phone-field').val(phone);
      $forms.find('.hh-from-selector').val(from_time).selectric('refresh');
      $forms.find('.hh-to-selector').val(to_time).selectric('refresh');
      $forms.find('.lucky-chance-selector').val(chance).selectric('refresh');
      return $forms.find('.days-group').each(function() {
        var ref;
        if (window.presets['hh']) {
          if (ref = $(this).data('day-index').toString(), indexOf.call(window.presets['hh']['days'], ref) >= 0) {
            $(this).val(true);
            return $(this).closest('li').addClass('on');
          } else {
            $(this).val(false);
            return $(this).closest('li').removeClass('on');
          }
        }
      });
    } else {
      return resetForm($forms);
    }
  };

  bindEscapeKey = function() {
    return $(document).keyup(function(e) {
      var $focused;
      if (e.keyCode === 27) {
        lb_log('escape!');
        $focused = $(':focus');
        if (($focused != null) && $focused.is('input, textarea')) {
          resetFormToPresettings($focused.closest('.reward-container').find('form'));
          lb_log("done presetting, now flipping");
          flipRewardContainer($focused.closest('.reward-container'));
        }
      }
    });
  };

  bindEscapeLinkPress = function() {
    return $('.esc-link').on('click', function(e) {
      e.preventDefault;
      resetFormToPresettings($(this).closest('.reward-container').find('form'));
      lb_log("done presetting, now flipping");
      flipRewardContainer($(this).closest('.reward-container'));
    });
  };

  flipRewardContainer = function(reward_container) {
    return reward_container.toggleClass('flip-container');
  };

  bindEditRewardBtn = function() {
    return $('#rewards-tab .edit-btn').on('click', function(e) {
      var $reward_container;
      e.preventDefault();
      $reward_container = $(this).closest('.reward-container');
      flipRewardContainer($reward_container);
      return $reward_container.find('.escape-container').show();
    });
  };

  bindTextAreaChangeForContainer = function($container) {
    var $expiry_ele, $text_area_ele;
    $text_area_ele = $container.find('.rewards-form .reward-text');
    $text_area_ele.on('keyup', function(e) {
      var new_val;
      console.log($(this));
      new_val = $(this).val();
      console.log(new_val);
      console.log($container.find('.rewards-form .reward-text').not(this));
      $container.find('.rewards-form .reward-text').not(this).val(new_val);
      return $container.find('.rewards-form .reward-text').not(this).trigger('textarea_sync');
    });
    $expiry_ele = $container.find('.rewards-form .expiry-selector');
    return $expiry_ele.on('change', function() {
      var new_val;
      console.log($(this));
      new_val = $(this).val();
      console.log(new_val);
      console.log($container.find('.rewards-form .expiry-selector').not(this));
      $container.find('.rewards-form .expiry-selector').not(this).val(new_val);
      console.log($container.find('.rewards-form .expiry-selector').not(this).val());
      return $container.find('.rewards-form .expiry-selector').selectric('refresh');
    });
  };

  bindRemoveRewardBtn = function() {
    return $('#rewards-tab .remove-btn').on('click', function(e) {
      var $reward_container, params;
      e.preventDefault();
      $reward_container = $(this).closest('.reward-container');
      $reward_container.find('.escape-container').hide();
      flipRewardContainer($reward_container);
      params = {
        'token_type': $reward_container.data('token-type')
      };
      console.log(params);
      return $.ajax({
        url: Routes.dashboard_ajax_clear_token_of_type_path(),
        data: params,
        beforeSend: function() {
          return resetForm($reward_container.find('form'));
        },
        success: function(data) {}
      });
    });
  };

  hourToPmAm = function(hour) {
    var ampm, h;
    h = parseInt(hour.substring(0, 2));
    if ((h - 12) >= 0) {
      ampm = 'pm';
    } else {
      ampm = 'am';
    }
    if (h === 0) {
      h = 12;
    }
    h = h % 12;
    return "" + h + ampm;
  };

  updateHappyHourTimesInSavedContainer = function() {
    var entry, from_time, hours_content, l, len1, ref, to_time, txt;
    txt = "";
    hours_content = "Available: ";
    if (window.presets['hh']['days'].length > 6) {
      txt = "All Week";
    } else {
      ref = window.presets['hh']['days'];
      for (l = 0, len1 = ref.length; l < len1; l++) {
        entry = ref[l];
        if (entry === '1') {
          txt += "Mon, ";
        }
        if (entry === '2') {
          txt += "Tue, ";
        }
        if (entry === '3') {
          txt += "Wed, ";
        }
        if (entry === '4') {
          txt += "Thu, ";
        }
        if (entry === '5') {
          txt += "Fri, ";
        }
        if (entry === '6') {
          txt += "Sat, ";
        }
        if (entry === '0') {
          txt += "Sun, ";
        }
      }
    }
    from_time = window.presets['hh']['from'] != null ? hourToPmAm(window.presets['hh']['from'][1]) : hourToPmAm("1500");
    to_time = window.presets['hh']['to'] != null ? hourToPmAm(window.presets['hh']['to'][1]) : hourToPmAm("1600");
    txt += from_time + " - " + to_time;
    hours_content += "" + txt;
    return $('.saved-container.saved-hh .hh-times').text(hours_content);
  };

  initVisitValidationsFor = function($container) {
    var errorClass, validClass;
    errorClass = "error";
    validClass = "valid";
    errorClass = "error";
    validClass = "valid";
    $.validator.addMethod('le', (function(value, element, param) {
      return this.optional(element) || value <= $(param).val();
    }), 'Invalid value');
    $.validator.addMethod('ge', (function(value, element, param) {
      return this.optional(element) || value >= $(param).val();
    }), 'Invalid value');
    return $container.find(".buy-reward-form").validate({
      onkeyup: false,
      errorElement: 'em',
      errorClass: 'validation-error',
      highlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
      },
      rules: {
        reward: {
          required: true,
          minlength: 5,
          maxlength: 60
        },
        old_price: {
          number: true,
          required: true
        },
        price: {
          number: true,
          required: true
        }
      },
      messages: {
        reward: "Please insert a reward",
        price: "New price must be lower than old price"
      }
    });
  };

  initCallValidationsFor = function($container) {
    var errorClass, validClass;
    errorClass = "error";
    validClass = "valid";
    return $container.find('.call-reward-form').validate({
      onkeyup: false,
      errorElement: 'em',
      errorClass: 'validation-error',
      highlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
      },
      rules: {
        reward: {
          required: true,
          minlength: 5,
          maxlength: 60
        },
        phone: {
          required: true
        }
      },
      messages: {
        reward: "Please insert a reward",
        phone: "Please provide a phone number"
      }
    });
  };

  convertExpiryToSelectItem = function(expiry) {
    switch (expiry) {
      case '60':
        return ["1 Hour", 60];
      case '1440':
        return ["1 Day", 1440];
      case '10080':
        return ["1 Week", 10080];
      case '43200':
        return ["1 Month", 43200];
      case '525600':
        return ["1 Year", 525600];
      default:
        return ["No expiration", 0];
    }
  };

  converBuyExpiryToSelectItem = function(expiry) {
    switch (expiry) {
      case '60':
        return ["1 Hour", 60];
      case '1440':
        return ["24 Hours", 1440];
      case '2880':
        return ["48 Hours", 2880];
      case '10080':
        return ["1 Week", 10080];
      case '43200':
        return ["1 Month", 43200];
      default:
        return ["No expiration", 0];
    }
  };

  window.convertHourStringToSelectItem = function(hour_str) {
    switch (hour_str) {
      case "0100":
        return ["1AM", "0100"];
      case "0200":
        return ["2AM", "0200"];
      case "0300":
        return ["3AM", "0300"];
      case "0400":
        return ["4AM", "0400"];
      case "0500":
        return ["5AM", "0500"];
      case "0600":
        return ["6AM", "0600"];
      case "0700":
        return ["7AM", "0700"];
      case "0800":
        return ["8AM", "0800"];
      case "0900":
        return ["9AM", "0900"];
      case "1000":
        return ["10AM", "1000"];
      case "1100":
        return ["11AM", "1100"];
      case "1200":
        return ["12PM", "1200"];
      case "1300":
        return ["1PM", "1300"];
      case "1400":
        return ["2PM", "1400"];
      case "1500":
        return ["3PM", "1500"];
      case "1600":
        return ["4PM", "1600"];
      case "1700":
        return ["5PM", "1700"];
      case "1800":
        return ["6PM", "1800"];
      case "1900":
        return ["7PM", "1900"];
      case "2000":
        return ["8PM", "2000"];
      case "2100":
        return ["9PM", "2100"];
      case "2200":
        return ["10PM", "2200"];
      case "2300":
        return ["11PM", "2300"];
      case "2400":
        return ["12AM", "2400"];
    }
  };

  bindRewardsInputsChange = function() {
    $('form.validate-token-form .reward-text-area').each(function() {
      var input_val_length;
      input_val_length = $(this).val().length;
      if (input_val_length > 4 && input_val_length < 61) {
        return $(this).closest('form').find('.save-btn').attr('disabled', false).css({
          opacity: 1
        });
      } else {
        return $(this).closest('form').find('.save-btn').attr('disabled', true).css({
          opacity: 0.3
        });
      }
    });
    return $('form.validate-token-form .reward-text-area').on('change keyup copy cut paste', function() {
      var input_val_length;
      input_val_length = $(this).val().length;
      if (input_val_length > 4 && input_val_length < 61) {
        return $(this).closest('form').find('.save-btn').attr('disabled', false).css({
          opacity: 1
        });
      } else {
        return $(this).closest('form').find('.save-btn').attr('disabled', true).css({
          opacity: 0.3
        });
      }
    });
  };

  locateQtipSelector = function() {
    var qtipSelector, rewardsPartials;
    rewardsPartials = $('.rewards-tab-content').children();
    qtipSelector = "";
    rewardsPartials.each(function() {
      if (this.hasAttribute('data-token-type')) {
        if (!$(this).hasClass("flip-container")) {
          qtipSelector = $(this).find($('.js-purchase-types-holder'));
          if (qtipSelector !== "") {
            return false;
          }
        }
      }
    });
    return qtipSelector;
  };

  window.initDashboardTabRewards = function() {
    window.presets = gon.presettings;
    window.last_selectric_val = '';
    $('#wrapper').height('2195px');
    $('.category-selector').each(function() {
      return bindRewardCategoryChange($(this));
    });
    $('.reward-text-area').each(function() {
      return bindCharCounterForTextArea($(this));
    });
    $('.reward-container').each(function() {
      return bindTextAreaChangeForContainer($(this));
    });
    forceNumericality();
    initHappyHoursForm();
    initWelcomeForm();
    initFacebookForm();
    initFacebookReferralForm();
    initLuckyForm();
    bindEditRewardBtn();
    bindRemoveRewardBtn();
    bindEscapeKey();
    bindEscapeLinkPress();
    bindTopCloseBtn();
    bindChanceSelectorChanges();
    bindRewardsInputsChange();
    setTimeout(function() {
      $('.rewards-tab').css({
        'opacity': 1
      });
      return setTimeout(function() {
        return $('.rewards-tab .save-btn').css({
          'display': 'block'
        });
      }, 800);
    }, 1);
    $("#rewards-tab .reward-percentage-metric-tooltip").each(function() {
      return $(this).qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 8,
            x: 75
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-stats'
        }
      });
    });
    $("#rewards-tab .buy-now.type-container .select-duration-holder .question-mark-tooltip").each(function() {
      return $(this).qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 8,
            x: 22
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-buy-expiration'
        }
      });
    });
    $.validator.setDefaults({
      ignore: []
    });
    $.validator.addMethod('lesserThan', (function(value, ele, target) {
      return parseFloat(value) < parseFloat($(ele).parents('form').find(target).val());
    }), 'New price must be lower than original price');
    $.validator.addMethod("phoneRegex", (function(value, element) {
      console.log(value);
      console.log(element);
      return /^[0-9\-\(\)\ ]+$/i.test(value);
    }), 'Uh-oh, your phone number is incorrect');
    $.validator.addMethod("validWeekday", (function(value, element) {
      var number;
      number = 0;
      console.log($(element).parents("form"));
      $(element).parents("form").find(".days-group").each(function() {
        if ($(this).val() === "true") {
          return number++;
        }
      });
      lb_log("number : " + number);
      return number > 0;
    }), 'Uh-oh. At least one weekday');
    $("form.validate-token-form").each(function() {
      return $(this).validate({
        onkeyup: false,
        errorElement: 'em',
        errorClass: 'validation-error',
        highlight: function(element, errorClass, validClass) {
          $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
          return $(element).closest('form').find('.save-btn').attr('disabled', true).css({
            opacity: 0.3
          });
        },
        unhighlight: function(element, errorClass, validClass) {
          $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
          return $(element).closest('form').find('.save-btn').attr('disabled', false).css({
            opacity: 1
          });
        },
        errorPlacement: function(error, element) {
          if (element.hasClass('hh-from-selector')) {
            return error.appendTo(element.parents(".validate-field"));
          } else {
            return error.insertAfter(element);
          }
        }
      });
    });
    $("form.validate-token-form .validate-reward").each(function() {
      return $(this).rules("add", {
        required: true,
        minlength: 5,
        maxlength: 60,
        messages: {
          required: "Please type in a reward"
        }
      });
    });
    $("form.validate-token-form .validate-phone").each(function() {
      return $(this).rules("add", {
        required: true,
        minlength: 9,
        maxlength: 15,
        phoneRegex: true,
        messages: {
          required: "Phone number is required",
          minlength: "Please provide a valid phone number",
          maxlength: "Please provide a valid phone number"
        }
      });
    });
    $("form.validate-token-form .validate-old-price").each(function() {
      return $(this).rules("add", {
        number: true,
        required: true
      });
    });
    $("form.validate-token-form .validate-new-price").each(function() {
      return $(this).rules("add", {
        number: true,
        required: true,
        lesserThan: '.validate-old-price'
      });
    });
    checkForPhoneIPMasks(".validate-phone");
    $("form.validate-token-form input[name='token_interval[mon]']").each(function() {
      return $(this).rules("add", {
        required: true,
        validWeekday: true
      });
    });
    return forceNumericality("form.validate-token-form .validate-phone");
  };

}).call(this);
(function() {
  window.showUnpublishStatusCardsLightbox = function() {
    return $.fancybox({
      type: 'inline',
      href: '#unpublish-statuscards-lightbox',
      padding: 0,
      wrapCSS: 'locked-lightboxes',
      closeBtn: false,
      closeClick: false,
      centerOnScroll: true
    });
  };

  window.initDashboardTabStatus = function() {
    $("#status-tab  .banner-close-button").on('click', function(e) {
      e.preventDefault();
      $("#status-tab  .status-banner-2").slideUp();
      return $.get(Routes.set_business_attribute_json_var_path({
        status_tab_cards_hide_banner: 1
      }));
    });
    $('.js-unpublish-statuscards').on('click', function(e) {
      return showUnpublishStatusCardsLightbox();
    });
    $('.js-real-unpublish-statuscards').on('click', function(e) {
      e.preventDefault();
      $(".pictures-names-holder").removeClass('show-members');
      $.fancybox.close();
      return $.ajax({
        url: Routes.clear_status_cards_path(),
        beforeSend: function() {
          return showCogLoadingOverlay();
        },
        success: function(data) {
          $("#status-tab .form-status #silver_count").val("5").trigger('change');
          $("#status-tab .form-status #gold_count").val("20").trigger('change');
          $("#status-tab .form-status #platinum_count").val("50").trigger('change');
          $("#status-tab .form-status .status-text-area ").val("").trigger('change');
          $("#status-tab .card").removeClass('modified');
          $("#status-tab .validate-field").removeClass('valid');
          $(".unpublish-statuscards-section").hide('fade');
          gon.silver_token_status_count = null;
          gon.gold_token_status_count = null;
          gon.platinum_token_status_count = null;
          return console.log(data);
        },
        complete: function() {
          return hideCogLoadingOverlay();
        }
      });
    });
    $('.members-box a.locked').fancybox({
      padding: 0,
      wrapCSS: 'locked-lightboxes'
    });
    $('#status-tab .form-status  .status-text-area').on('change paste keyup', function() {
      var $f;
      $f = $(this).parents("form").find('.js-c-count');
      return $f.text($(this).val().length);
    });
    $('#status-tab .form-status  .status-text-area').each(function() {
      var $f;
      $f = $(this).parents("form").find('.js-c-count');
      return $f.text($(this).val().length);
    });
    $('#status-tab .status-field').on('change paste keyup', function() {
      var e;
      e = $(this).parents('.card');
      if (!e.hasClass('modified')) {
        return e.addClass('modified');
      }
    });
    $(document).on('ajax:beforeSend', $("#status-tab .form-status"), function(event, data) {
      return showBoxLoading($(event.target).parents(".card"), {
        text: 'Saving...'
      });
    });
    $(document).on('ajax:success', $("#status-tab .form-status"), function(event, data) {
      var $form;
      hideBoxLoading();
      $form = $(event.target);
      $form.parents(".card").removeClass('modified');
      if ($form.hasClass('form-status-silver')) {
        gon.silver_token_status_count = parseInt($form.find(".token-status-count").first().val());
        $(".silver-names-holder.has-users").addClass('show-members');
      }
      if ($form.hasClass('form-status-gold')) {
        gon.gold_token_status_count = parseInt($form.find(".token-status-count").first().val());
        $(".gold-names-holder.has-users").addClass('show-members');
      }
      if ($form.hasClass('form-status-platinum')) {
        gon.platinum_token_status_count = parseInt($form.find(".token-status-count").first().val());
        $(".platinum-names-holder.has-users").addClass('show-members');
      }
      return $(".unpublish-statuscards-section").show();
    });
    forceNumericality('#status-tab .token-status-count', false, true, true);
    $("#status-tab .form-status").each(function() {
      var self;
      self = this;
      return $(this).validate({
        onkeyup: false,
        errorElement: 'em',
        errorClass: 'validation-error',
        highlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
        },
        unhighlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
        },
        rules: {
          "token_status[reward]": {
            required: true,
            minlength: 5,
            maxlength: 60
          },
          "token_status[count]": {
            required: true,
            minlength: 1,
            maxlength: 3
          }
        }
      });
    });
    $.validator.addMethod('silverCheck', (function(value, ele, target) {
      var v;
      v = parseInt(value);
      if (gon.gold_token_status_count) {
        if (v >= parseInt(gon.gold_token_status_count)) {
          return false;
        }
      }
      if (gon.platinum_token_status_count) {
        if (v >= parseInt(gon.platinum_token_status_count)) {
          return false;
        }
      }
      return true;
    }), 'Must be lower than gold and platinum');
    $("#status-tab .form-status #silver_count").rules("add", {
      silverCheck: true
    });
    $.validator.addMethod('goldCheck', (function(value, ele, target) {
      var v;
      v = parseInt(value);
      if (gon.silver_token_status_count) {
        if (v <= parseInt(gon.silver_token_status_count)) {
          return false;
        }
      }
      if (gon.platinum_token_status_count) {
        if (v >= parseInt(gon.platinum_token_status_count)) {
          return false;
        }
      }
      return true;
    }), 'Must be higher than silver and lower than platinum');
    $("#status-tab .form-status #gold_count").rules("add", {
      goldCheck: true
    });
    $.validator.addMethod('platinumCheck', (function(value, ele, target) {
      var v;
      v = parseInt(value);
      if (gon.gold_token_status_count) {
        if (v <= parseInt(gon.gold_token_status_count)) {
          return false;
        }
      }
      if (gon.silver_token_status_count) {
        if (v <= parseInt(gon.silver_token_status_count)) {
          return false;
        }
      }
      return true;
    }), 'Must be higher than silver and gold');
    return $("#status-tab .form-status #platinum_count").rules("add", {
      platinumCheck: true
    });
  };

}).call(this);
(function() {
  var bindMailingListForm, bindSendMailBtn, initPostSocialEvents;

  bindMailingListForm = function() {
    $("form#xls_mailing_upload").ajaxForm({
      beforeSend: function() {
        return window.showSecureLoadingOverlay("Uploading...");
      },
      success: function(data) {
        $('#content').hideLbOverlay();
        window.hideSecureLoadingOverlay();
        $(document).trigger('emailListUploaded');
        return $.ajax({
          url: Routes.dashboard_handle_email_list_upload_path(),
          success: function(data1) {
            var pending_invite;
            console.log(data1);
            pending_invite = data1.results.pending_invite;
            return openUploadMailingListLightbox(pending_invite);
          }
        });
      },
      complete: function() {
        $('#content').hideLbOverlay();
        return window.hideSecureLoadingOverlay();
      },
      error: function(data) {
        return $('#adding-emails-lightbox .xls-error-holder').show();
      }
    });
    $('.btn-upload-mailing').on('click', function(e) {
      e.preventDefault();
      $('#mailing_list_mailing_list_file').trigger('click');
      console.log(".btn-upload-mailing click");
      return false;
    });
    return $('#mailing_list_mailing_list_file').on('change', function(e, i) {
      if ($(this).val() !== "") {
        $('#xls_mailing_upload').submit();
        return window.showSecureLoadingOverlay("Uploading...");
      }
    });
  };

  bindSendMailBtn = function() {
    return $(document).bind('welcomeEmailsSent signalContactsLightboxContactsSelected cvsContactEmailsAdded', function(e, data) {
      return setTimeout(function() {
        window.temp_data = data;
        $('#content').hideLbOverlay();
        $('.promote-emails .initial').fadeOut(400);
        $('.promote-emails .number-of-contacts-span, .number-of-contacts').text(data.total_invitations);
        $('.promote-emails .last-email-date-span, .last-email-date').text(data.updated_at);
        return $('.promote-emails .stats').fadeIn(600);
      }, 1500);
    });
  };

  initPostSocialEvents = function() {
    $(document).bind('facebookPopupClosed', function() {
      return $.ajax({
        url: Routes.dashboard_update_facebook_shares_count_path(),
        success: function(data) {
          $('#engagement #grow-club .promote-fb-icon').addClass('completed');
          $('#engagement #grow-club .promote-fb .text').addClass('completed');
          $('.pseudo-shared-on-fb').trigger('click');
          if (window.defined_hash) {
            window.defined_hash['fb'] = true;
          }
          $('.promote-container.promote-social .facebook').removeClass('na');
          $('.promote-container.promote-social .stats .facebook .date-span').text(data.fb_date);
          if ($('.promote-container.promote-social .initial').is(":visible")) {
            return $('.promote-container.promote-social .initial').fadeOut(function() {
              return $('.promote-container.promote-social .stats').fadeIn();
            });
          }
        }
      });
    });
    return $(document).bind('twitterPopupClosed', function() {
      $('#engagement #grow-club .promote-twitter-icon').addClass('completed');
      $('#engagement #grow-club .promote-twitter .text').addClass('completed');
      $('.pseudo-shared-on-twitter').trigger('click');
      if (window.defined_hash) {
        window.defined_hash['twitter'] = true;
      }
      $(".dashboard-home .twitter .completed-img").fadeIn(600);
      $(document).bind('twitterPopupClosed', function() {});
      return $.ajax({
        url: Routes.dashboard_update_tweets_count_path()
      }).done(function(data) {
        $('.promote-container.promote-social .twitter').removeClass('na');
        $('.promote-container.promote-social .stats .twitter .date-span').text(data.tw_date);
        if ($('.promote-container.promote-social .initial').is(":visible")) {
          return $('.promote-container.promote-social .initial').fadeOut(function() {
            return $('.promote-container.promote-social .stats').fadeIn();
          });
        }
      });
    });
  };

  window.initDashboardTabRecruit = function() {
    bindMailingListForm();
    bindSendMailBtn();
    return initPostSocialEvents();
  };

}).call(this);
(function() {
  var DeleteCampaign, DeleteMultiCampaign, DuplicateCampaign, EditCampaign, bindScheduleLightbox, bindTopActions, clearForms, clearMessages, initClearState, initMainNavPage, initMessagesPages, initTokenPages, initTokenTypes, initValidations, onCreateCampaignCallback, onMessagesEntry, pushNotificationsPageData, setSchedule, showScheduleEditLightbox, showSuccessPushCampaignLighbox, unpublishToken, updateNotificationStripes, updateOfferSelect, updatePreviewOnInner, updateRadixUsers;

  pushNotificationsPageData = function(page) {
    var allSelectedClasses, k, m, push_page_data, v;
    if (page == null) {
      page = null;
    }
    if (!page) {
      page = window.location.href.toString();
    }
    push_page_data = {
      "push-not-main-nav": {
        init: '',
        section: '#push-content-page-main-nav',
        selectedClass: 'main-nav-selected'
      },
      "push-not-message-nav": {
        init: 'onMessagesEntry()',
        section: '#push-edit-wrapper',
        selectedClass: 'messages-selected'
      }
    };
    allSelectedClasses = null;
    for (k in push_page_data) {
      v = push_page_data[k];
      if (page === 'allSelectedClasses' && v.selectedClass) {
        if (!allSelectedClasses) {
          allSelectedClasses = [];
        }
        allSelectedClasses.push(v.selectedClass);
      } else {
        m = page.match(k);
        if (m) {
          v.page = k;
          return v;
        }
      }
    }
    return allSelectedClasses;
  };

  clearMessages = function() {
    var $form;
    $form = $("#form-publish-token-general-message");
    $form.find(".reward-field").val("").trigger('change');
    $form.find(".distance_miles").val("").selectric('refresh');
    $form.find(".gender-field").val('all').selectric('refresh');
    $("#push-not-tab #select-message-slider").slider('value', 0);
    $form = $("#form-publish-token-general-reward");
    $form.find(".distance_miles").val(50 * 1.6 * 1000).selectric('refresh');
    $form.find(".reward-field").val("").trigger('change');
    $form.find(".to_days_select").each(function() {
      return $(this).val(30 * 1440).selectric('refresh');
    });
    $form.find(".unlock-type").val(0).trigger("change").selectric('refresh');
    $form.find(".gender-field").val('all').selectric('refresh');
    $form.find(".price").val("").trigger('change');
    $form.find(".old_price, .old-price").val("").trigger('change');
    return $form.find(".phoneToCall").val("").trigger('change');
  };

  clearForms = function() {
    var $form;
    $form = $("#form-publish-token-general-message");
    $form.find(".status-field").val("all").trigger('change').selectric('refresh');
    $form.find(".distance-field").val("").selectric('refresh');
    $form.find(".reward-field").val("").trigger('change');
    $form.find(".gender-field").val('all').selectric('refresh');
    $form.find('input:hidden[name=scheduled_time]').remove();
    $form.find('input:hidden[name=is_schedule]').remove();
    $form.find('input:hidden[name=editable]').remove();
    $form = $("#form-publish-token-general-reward");
    $form.find(".unlock-type").val(0).trigger('change').selectric('refresh');
    $form.find(".to_days_select").val(30 * 1440).selectric('refresh');
    $form.find(".status-field").val("all").selectric('refresh');
    $form.find(".gender-field").val('all').selectric('refresh');
    $form.find(".distance-field").val("").selectric('refresh');
    $form.find(".reward-field").val("").trigger('change');
    $form.find(".phoneToCall").val("").trigger('change');
    $form.find(".money-input").val("").trigger('change');
    $form.find('input:hidden[name=scheduled_time]').remove();
    $form.find('input:hidden[name=is_schedule]').remove();
    $form.find('input:hidden[name=editable]').remove();
    $('#push-edit-wrapper .people-count').removeClass('no-members');
    return $('#push-edit-wrapper .save-button').removeClass('no-members-btn');
  };

  updatePreviewOnInner = function() {
    $("#form-publish-token-general-message").on('change', function() {
      var $reward, opts, tokenPreviews;
      $reward = $(this).find('.reward-field');
      tokenPreviews = $(".empty-preview-btn.btm-elem.btm-msg .token-preview");
      tokenPreviews.find('.reward_wrapper').addClass('hide');
      tokenPreviews.find('.msg_wrapper').removeClass('hide');
      opts = {};
      if ($reward.length > 0) {
        opts.reward = $reward.val();
      }
      tokenPreviews.removeClass('page-1 page-2');
      return updateTokenPreview(tokenPreviews, opts);
    }).trigger('change');
    return $("#form-publish-token-general-reward").on('change', function() {
      var $new_price, $old_price, $reward, $unlock_type, opts, tokenPreviews;
      $unlock_type = $(this).find('.unlock-type');
      $new_price = $(this).find('.new-price');
      $old_price = $(this).find('.old-price');
      $reward = $(this).find('.reward-field');
      tokenPreviews = $(".empty-preview-btn.btm-elem.btm-reward .token-preview");
      tokenPreviews.find('.msg_wrapper').addClass('hide');
      tokenPreviews.find('.reward_wrapper').removeClass('hide');
      opts = {};
      if ($unlock_type.length > 0) {
        opts.unlock_type = $unlock_type.val();
      }
      if ($new_price.length > 0) {
        opts.new_price = parseFloat($new_price.val());
        if (isNaN(opts.new_price)) {
          opts.new_price = 0.0;
        }
        tokenPreviews.find('.new-price').text("$" + opts.new_price);
      }
      if ($old_price.length > 0) {
        opts.old_price = parseFloat($old_price.val());
        if (isNaN(opts.old_price)) {
          opts.old_price = 0.0;
        }
        tokenPreviews.find('.old-price').text("$" + opts.old_price);
      }
      if ($reward.length > 0) {
        opts.reward = $reward.val();
      }
      tokenPreviews.removeClass('page-1 page-2').addClass('page-1');
      return updateTokenPreview(tokenPreviews, opts);
    }).trigger('change');
  };

  bindScheduleLightbox = function() {
    var _url;
    _url = '/lightboxes/schedule_push_lightbox';
    if (gon.multi_dashboard) {
      _url = '/multi_common_lightboxes/schedule_push_multi_lightbox';
    }
    return $(".schedule-btn").on('click', function(e) {
      var _this;
      _this = $(this);
      return $.fancybox({
        href: _url,
        type: 'ajax',
        padding: 0,
        autoSize: true,
        closeBtn: false,
        autoCenter: true,
        scrolling: 'no',
        wrapCSS: 'locked-lightboxes',
        closeClick: false,
        beforeShow: function() {
          bindSelectric();
          if (_this.hasClass('msg')) {
            $("#schedule-push-campaign-lighbox .header-text").text('Schedule Your Message!');
          } else {
            $("#schedule-push-campaign-lighbox .header-text").text('Schedule Your Reward!');
          }
          $("#schedule-push-campaign-lighbox #schedule-select-date").datepicker({
            minDate: 0,
            dateFormat: 'yy-mm-dd'
          });
          $(".submit-schedule").on('click', function(e) {
            lbTrackEvent(campaign_events_category, 'Schedule_Success');
            return setSchedule();
          });
        },
        helpers: {
          overlay: {
            closeClick: false
          }
        }
      });
    });
  };

  setSchedule = (function(_this) {
    return function() {
      var _btn, _date, _final_date, _schedule_date, _time, _timeZone, d, form, utc;
      _date = $("#schedule-select-date").val();
      _timeZone = $(".select-time-zone").val();
      _time = $(".select-time").val();
      _schedule_date = _date + " " + _time;
      d = new Date(_schedule_date);
      utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      _final_date = moment(new Date(utc)).tz(_timeZone).format("YYYY-MM-DD HH:mm:ss");
      $('#push-edit-wrapper').addClass('scheduled');
      if ($("#push-edit-wrapper").hasClass('msg_no_reward')) {
        form = $("#form-publish-token-general-message");
        _btn = $("#push-not-tab .js-save-only-msg");
      } else {
        form = $("#form-publish-token-general-reward");
        _btn = $("#push-not-tab .js-save-msg-reward");
      }
      form.append('<input type="hidden" name="scheduled_time" value="' + _final_date + '" />');
      form.append('<input type="hidden" name="is_schedule" value="true" />');
      _btn.addClass('isScheduled');
      _btn.click();
      return $.fancybox.close();
    };
  })(this);

  initMainNavPage = function() {
    $("#push-not-tab .js-goto-message:not(.gotoBinded)").addClass("gotoBinded").on('click', function(e) {
      e.preventDefault();
      return clearMessages();
    });
    $("#push-not-tab .on-time-message-area .dup-campaign-btn:not(.binded)").addClass("binded").on('click', function(e) {
      return DuplicateCampaign(event);
    });
    $("#push-not-tab .on-time-message-area .delete-campaign-btn:not(.binded)").addClass("binded").on('click', function(e) {
      return DeleteCampaign(e);
    });
    return $('.campaign-action-selector').on('selectric-change', function(event) {
      var selected_index;
      selected_index = event.target.selectedIndex;
      if (selected_index === 1) {
        DuplicateCampaign(event);
      } else if (selected_index === 2) {
        DeleteCampaign(event);
      } else if (selected_index === 3) {
        showScheduleEditLightbox(event);
      }
      $('.campaign-action-selector').val(-1);
      $('.campaign-action-selector').selectric('refresh');
    });
  };

  EditCampaign = function(e) {
    DuplicateCampaign(e, true);
    return $.fancybox.close();
  };

  DeleteMultiCampaign = function(e) {
    var $ele, list_entry_data, tids;
    e.preventDefault();
    $ele = $(e.target).parents(".list-entry");
    list_entry_data = $ele.data("it");
    tids = list_entry_data.businesses_tokens;
    return $.ajax("/multi-dashboard/multi-campaign-delete", {
      type: "POST",
      data: {
        businesses_tokens: tids
      },
      success: function() {
        $ele.addClass('removed');
        return $ele.remove();
      },
      error: function(data) {
        $ele.removeClass('removed');
        return alert("an error has occurred!");
      },
      beforeSend: function() {
        return $ele.addClass('removed');
      }
    });
  };

  DeleteCampaign = function(e) {
    var $ele, list_entry_data, tid;
    if (gon.multi_dashboard) {
      return DeleteMultiCampaign(e);
    } else {
      e.preventDefault();
      $ele = $(e.target).parents(".list-entry");
      list_entry_data = $ele.data("it");
      tid = list_entry_data.token_id;
      return $.ajax(Routes.dashboard_carrots_campaign_action_path("delete", tid), {
        dataType: 'json',
        success: function() {
          return $ele.remove();
        },
        error: function(data) {
          console.log(data);
          return alert("an error has occurred!");
        },
        beforeSend: function() {
          return showBoxLoading("#push-not-tab .on-time-message-area", {
            text: 'Deleting Message Campaign...'
          });
        },
        complete: function() {
          return hideBoxLoading("#push-not-tab .on-time-message-area");
        }
      });
    }
  };

  DuplicateCampaign = function(e, isEditable) {
    var $form, _class, _inner_type_class, list_entry_data;
    if (isEditable == null) {
      isEditable = false;
    }
    e.preventDefault();
    list_entry_data = $(e.target).parents(".list-entry").data("it");
    console.log(list_entry_data);
    lbTrackEvent(campaign_events_category, 'Duplicate_Click');
    if (list_entry_data.token_type === 'immediate_chat_campaign') {
      $form = $("#form-publish-token-general-message");
      $form.find(".status-field").val(list_entry_data.settings.member_status).selectric('refresh');
      $form.find(".reward-field").val(list_entry_data.reward);
      $form.find(".distance_miles").val(list_entry_data.settings.distance).selectric('refresh');
      $form.find(".gender-field").val(list_entry_data.settings.gender).selectric('refresh');
      _class = 'msg_no_reward';
    }
    if (list_entry_data.token_type === 'immediate_freetext') {
      $form = $("#form-publish-token-general-reward");
      _inner_type_class = 'reward_visit';
      $form.find(".reward-field").val(list_entry_data.reward).trigger('change');
      $form.find(".distance_miles").val(list_entry_data.settings.distance).selectric('refresh');
      $form.find(".status-field").val(list_entry_data.settings.member_status).selectric('refresh');
      $form.find(".to_days_select, #to_days_select_buy").each(function() {
        return $(this).val(list_entry_data.settings.expiry).selectric('refresh');
      });
      $form.find(".unlock-type").val(list_entry_data.unlock_type).selectric('refresh');
      updateOfferSelect($form.find(".unlock-type"));
      $form.find(".gender-field").val(list_entry_data.settings.gender).selectric('refresh');
      if (list_entry_data.settings.price) {
        _inner_type_class = 'reward_buy';
        $form.find(".price").val(list_entry_data.settings.price).trigger('change');
      }
      if (list_entry_data.settings.old_price) {
        $form.find(".old_price, .old-price").val(list_entry_data.settings.old_price).trigger('change');
      }
      if (list_entry_data.settings.phone) {
        _inner_type_class = 'reward_call';
        $form.find(".phoneToCall").val(list_entry_data.settings.phone).trigger('change');
      }
      _class = 'msg_with_reward ' + _inner_type_class;
    }
    if (isEditable) {
      $form.append('<input type="hidden" name="editable" value="' + list_entry_data.token_id + '" />');
    }
    updateRadixUsers($form);
    $('#push-content-page-main-nav').hide();
    return $('#push-edit-wrapper').attr('class', _class).fadeIn();
  };

  showScheduleEditLightbox = function(e) {
    var _ev, list_entry_data;
    lbTrackEvent(campaign_events_category, 'Edit_Click');
    _ev = e;
    list_entry_data = $(_ev.target).parents(".list-entry").data("it");
    $("#push-notifications-edit-listing-lightbox").removeClass('with_reward');
    if (list_entry_data.token_type === "immediate_freetext") {
      $("#push-notifications-edit-listing-lightbox").addClass('with_reward');
    }
    return $.fancybox({
      padding: 0,
      autoSize: false,
      closeBtn: true,
      autoCenter: true,
      width: '720px',
      height: '303px',
      scrolling: 'no',
      wrapCSS: 'fancybox-skin-no-box',
      type: 'inline',
      href: '#push-notifications-edit-listing-lightbox',
      closeClick: false,
      tpl: {
        closeBtn: false
      },
      beforeShow: function() {
        return $("#push-notifications-edit-listing-lightbox .edit-messages-btn").off().on('click', function(e) {
          lbTrackEvent(campaign_events_category, 'Continue_Edit');
          return EditCampaign(_ev);
        });
      }
    });
  };

  updateOfferSelect = function(ele) {
    var cla, clss, p, v;
    v = $(ele).val();
    cla = 'state-visit';
    if (v === '0') {
      cla = 'state-visit';
      clss = 'reward_visit';
    }
    if (v === '1') {
      cla = 'state-buy-now';
      clss = 'reward_buy';
    }
    if (v === '2') {
      cla = 'state-call-to-book';
      clss = 'reward_call';
    }
    p = $(ele).parents(".section-container");
    $("#push-edit-wrapper").attr('class', 'msg_with_reward ' + clss);
    if (v !== '1') {
      p.find(".money-input").val("");
    }
    return p.find(".c-box-2").first().removeClass('state-visit state-buy-now state-call-to-book').addClass(cla);
  };

  initTokenTypes = function() {
    return $("#push-not-tab .offerSelect").each(function() {
      $(this).on('change', function() {
        var dv, v;
        v = $(this).val();
        dv = $(this).data("vvalue");
        if (v === '1' && gon.buy_now_locked) {
          window.showBlockTabLightbox("buy_now");
          return $(this).val(window.last_selectric_val).selectric('refresh');
        } else {
          $(this).data("vvalue", v);
          updateOfferSelect(this);
        }
      });
      $(this).on('selectric-before-close', function() {
        return window.last_selectric_val = $(this).val();
      });
      updateOfferSelect(this);
      return $(this).data("value", $(this).val());
    });
  };

  initMessagesPages = function() {
    $("#push-edit-wrapper .gender-field, #push-edit-wrapper .distance-field, #push-edit-wrapper .status-field").on('change blur', function() {
      if (window.afterCampSubmit) {
        return delete window.afterCampSubmit;
      } else {
        if (!gon.multi_dashboard) {
          return updateRadixUsers($(this).parents("form"));
        }
      }
    });
    return $("#push-edit-wrapper .distance-field").each(function() {
      if (!gon.multi_dashboard) {
        return updateRadixUsers($(this).parents("form"));
      }
    });
  };

  onMessagesEntry = function() {
    return $("#push-edit-wrapper .form-publish-token").each(function() {
      if (!gon.multi_dashboard) {
        return updateRadixUsers(this);
      }
    });
  };

  updateRadixUsers = function(form) {
    var _url_to_send, distance, gender, status;
    if (!gon.multi_dashboard) {
      form = $(form).first();
      gender = form.find(".gender-field").val() || 'all';
      distance = form.find(".distance-field").val() || '128000000';
      status = form.find(".status-field").val() || 'all';
      _url_to_send = "/dashboard/push-notifications-get-users-on-radix?gender=" + gender + "&distance_miles=" + distance + "&status=" + status;
      if (gender && distance) {
        return $.getJSON(_url_to_send).done(function(json) {
          form.find(".people-count .count").first().text(json.count);
          if (json.count < 1) {
            $('#push-edit-wrapper .people-count').addClass('no-members');
            return $('#push-edit-wrapper .save-button').addClass('no-members-btn');
          } else {
            $('#push-edit-wrapper .people-count').removeClass('no-members');
            return $('#push-edit-wrapper .save-button').removeClass('no-members-btn');
          }
        });
      }
    }
  };

  unpublishToken = function(t_type) {
    showBoxLoading($("body"), {
      text: 'Unpublishing...'
    });
    lbTrackEvent(campaign_events_category, 'Delete_Click');
    return $.getJSON(Routes.delete_general_token_path({
      tokentype: t_type
    })).done(function(json) {
      return $.ajax("/dashboard/campaigns-tab?no_layout=1", {
        dataType: 'html',
        success: function(data) {
          var $data;
          $data = $(data);
          hideBoxLoading();
          $("#push-content-page-main-nav").replaceWith($data);
          updateNotificationStripes();
          return initMainNavPage();
        }
      });
    }).always(function() {
      return hideBoxLoading();
    });
  };

  initTokenPages = function() {
    $("form.form-publish-token :input").on('change paste keyup', function() {
      return $(this).parents("form").removeClass('unchanged');
    });
    $(document).on('ajax:beforeSend', '#push-not-tab  .form-publish-token', function(event, data) {
      var $form;
      $form = $(this);
      window.camp_last_num = parseInt($form.find(".people-count .usr_count_indx").first().text());
      return showBoxLoading($(this).parents('.c-box-2'), {
        text: 'Publishing...'
      });
    });
    $(document).on('ajax:success', '#push-not-tab  .form-publish-token', function(event, data) {
      var $form, _url;
      $form = $(this);
      window.camp_last_num = data.total_sent || window.camp_last_num;
      _url = '/dashboard/campaigns-tab?no_layout=1';
      if (gon.multi_dashboard) {
        _url = '/multi-dashboard/campaigns?no_layout=1';
        window.camp_last_num = 'selected';
      }
      window.afterCampSubmit = true;
      return $.ajax(_url, {
        dataType: 'html',
        success: function(data) {
          var $data, _class, is_scheduled, nav;
          $data = $(data);
          hideBoxLoading();
          _class = 'msg_sent';
          is_scheduled = $('#push-edit-wrapper').hasClass('scheduled');
          if (is_scheduled) {
            _class = 'msg_schedule';
          }
          if ($("#push-edit-wrapper").hasClass('msg_with_reward')) {
            _class = 'reward_sent';
            if (is_scheduled) {
              _class = 'reward_schedule';
            }
          }
          $("#push-content-page-main-nav").replaceWith($data);
          updateNotificationStripes();
          initMainNavPage();
          bindTopActions();
          $(".campaign-action-selector").selectric();
          initClearState();
          nav = $form.parents(".push-content-page").find(".nav-links-inner");
          if (nav) {
            nav.removeClass('no-unpublish');
          }
          if (gon.provider !== 'wix') {
            showSuccessPushCampaignLighbox(_class, window.camp_last_num);
            return delete window.camp_last_num;
          }
        },
        error: function(data) {
          alert(data.responseJSON.message);
          return hideBoxLoading();
        }
      });
    });
    $(document).on('ajax:error', '#push-not-tab  .form-publish-token', function(event, data) {
      hideBoxLoading();
      if (data.responseJSON.code === 1) {
        return showEmptyMessagesLightbox();
      } else {
        return alert("An error as ocurred publishing!");
      }
    });
    return $('#push-not-tab  .form-publish-token  .reward-field').each(function() {
      var $f;
      $(this).on('change paste keyup', function() {
        var $f;
        $f = $(this).parents("form").find('.js-c-count');
        return $f.text($(this).val().length);
      });
      $f = $(this).parents("form").find('.js-c-count');
      return $f.text($(this).val().length);
    });
  };

  showSuccessPushCampaignLighbox = function(_class, _num) {
    var _url;
    _url = '/lightboxes/success_push_lightbox';
    if (gon.multi_dashboard) {
      _url = '/multi_common_lightboxes/success_push_multi_lightbox';
    }
    return $.fancybox({
      href: _url,
      type: 'ajax',
      padding: 0,
      autoSize: true,
      closeBtn: false,
      autoCenter: true,
      scrolling: 'no',
      wrapCSS: 'locked-lightboxes',
      closeClick: false,
      beforeShow: function() {
        $("#success-push-campaign-lighbox ").attr('class', _class);
        $("#success-push-campaign-lighbox .msg-txt").attr('data-num', _num);
      },
      helpers: {
        overlay: {
          closeClick: false
        }
      }
    });
  };

  initValidations = function() {
    var errorClass, validClass;
    errorClass = "error";
    validClass = "valid";
    $.validator.addMethod('lesserThan', (function(value, ele, target) {
      return this.optional(ele) || parseFloat(value) < parseFloat($(ele).parents('form').find(target).val());
    }), 'New price must be lower than original price');
    $.validator.addMethod("phoneRegex", (function(value, element) {
      return /^[0-9\-\(\)\ ]+$/i.test(value);
    }), 'Uh-oh, your phone number is incorrect');
    return $("#push-not-tab .form-publish-token").each(function() {
      return $(this).validate({
        onkeyup: false,
        errorElement: 'em',
        errorClass: 'validation-error',
        highlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
        },
        unhighlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
        },
        rules: {
          reward: {
            required: true,
            minlength: 5,
            maxlength: 600
          },
          old_price: {
            number: true,
            required: {
              depends: function(e) {
                return $(this).parents('form').find("#unlock-type").val() === '1';
              }
            }
          },
          price: {
            number: true,
            lesserThan: '#old_price',
            required: {
              depends: function(e) {
                return $(this).parents('form').find("#unlock-type").val() === '1';
              }
            }
          },
          phone: {
            minlength: 9,
            phoneRegex: {
              depends: function(e) {
                return $(this).parents('form').find("#unlock-type").val() === '2';
              }
            },
            maxlength: 15,
            required: {
              depends: function(e) {
                return $(this).parents('form').find("#unlock-type").val() === '2';
              }
            }
          }
        },
        messages: {
          reward: {
            required: "Please insert text",
            minlength: "Your text is too short (minimum of 5 characters)"
          },
          phone: {
            minlength: "Please insert a valid phone"
          }
        }
      });
    });
  };

  updateNotificationStripes = function() {
    $(".notification-stripe.warning-stripe .messages-left").text(gon.push_messages_left);
    $(".notification-stripe.normal-stripe .messages-left").text(gon.push_limit);
    if (gon.push_messages_left <= 25) {
      $(".notification-stripe.warning-stripe").show();
      return $(".notification-stripe.normal-stripe").hide();
    } else {
      $(".notification-stripe.warning-stripe").hide();
      return $(".notification-stripe.normal-stripe").show();
    }
  };

  onCreateCampaignCallback = function(key) {
    if ('reward' === key) {
      lbTrackEvent(campaign_events_category, 'Create_One_Time_Reward');
      updateRadixUsers($("#form-publish-token-general-reward "));
      $('#push-content-page-main-nav').hide();
      return $('#push-edit-wrapper').attr('class', 'msg_with_reward reward_visit').fadeIn();
    } else {
      lbTrackEvent(campaign_events_category, 'Create_One_Time_Message');
      updateRadixUsers($("#form-publish-token-general-message"));
      $('#push-content-page-main-nav').hide();
      return $('#push-edit-wrapper').attr('class', 'msg_no_reward').fadeIn();
    }
  };

  initClearState = function() {
    clearForms();
    $('#push-edit-wrapper').hide();
    return $('#push-content-page-main-nav').fadeIn();
  };

  bindTopActions = function() {
    return $('#camp_create_btn').bindActionClick({
      elems: {
        'msg': 'SEND A MESSAGE',
        'reward': 'SEND A REWARD'
      },
      callback: onCreateCampaignCallback,
      default_item: {
        key: 'msg',
        val: 'SEND A MESSAGE'
      }
    });
  };

  window.initDashboardTabPushNotifications = function() {
    window.last_selectric_val = '';
    initMainNavPage();
    initTokenTypes();
    initTokenPages();
    initMessagesPages();
    initValidations();
    updateNotificationStripes();
    bindTopActions();
    bindScheduleLightbox();
    updatePreviewOnInner();
    $('#push-not-tab .back-btn-link').on('click', function() {
      return initClearState();
    });
    $("#push-not-tab .js-submit-parent").on('click', function(e) {
      var $form;
      e.preventDefault();
      if (!$(this).hasClass('no-members-btn') || $(this).hasClass('isScheduled')) {
        $(this).removeClass('isScheduled');
        $form = $(this).parents('form');
        if (!$form.hasClass("unchanged")) {
          return $form.submit();
        }
      }
    });
    $("#push-not-tab").on('click', '.empty-preview-btn', function(e) {
      var $self;
      e.preventDefault();
      $self = $(this);
      return $self.addClass('show');
    });
    $("#push-not-tab").on('click', '.invisible-overlay', function(e) {
      var tip;
      e.stopPropagation();
      tip = $(this);
      return tip.parents(".ftip-parent").removeClass('show');
    });
    return $(document).on('ajax:beforeSend', ".form-publish-token", function(v1, v2) {
      var _event;
      _event = (function() {
        switch ($(this).attr("id")) {
          case "form-publish-token-general-reward":
            return "Reward_Message_Send";
          case "form-publish-token-general-message":
            return "General_Message_Send";
        }
      }).call(this);
      return lbTrackEvent(campaign_events_category, _event);
    });
  };

}).call(this);
(function() {
  var AnalyticsLineChart, initAppActivity, initClubHealth, initPunchCampaigns, initPunchCard, initRatings, initRedemtionRates, initSocialStats, initStoreCheckins, initTotalMembers, initTotalMembersGraph, showSocialStatsTip, updateAnalyticsStats;

  window.dayOfTheWeekStartingOnMonday = function(e) {
    var r;
    r = (e % 7 - 4) % 7;
    if (r < 0) {
      return 7 + r;
    } else {
      return r;
    }
  };

  window.allDaysArray = function(start, end) {
    var arr;
    start = moment(start);
    end = moment(end);
    arr = [];
    while (end > start) {
      arr.push(moment(start).hour(0).minute(0).second(0).toDate());
      start.add(1, 'day');
    }
    return arr;
  };

  window.allMonthsArray = function(start, end) {
    var arr;
    start = moment(start);
    end = moment(end);
    arr = [];
    while (end > start) {
      arr.push(moment(start).hour(0).minute(0).second(0).toDate());
      start.add(7, 'days');
    }
    return arr;
  };

  window.lastMondayBasedOnEpoch = function(e) {
    return e - dayOfTheWeekStartingOnMonday(e);
  };

  window.lastMonday = function(e) {
    var c;
    c = moment(e).hour(0).minute(0).second(0);
    while (c.weekday() !== 1) {
      c.subtract(1, 'day');
    }
    return c.toDate();
  };

  window.nextSunday = function(e) {
    var c;
    c = moment(e).hour(0).minute(0).second(0);
    while (c.weekday() !== 0) {
      c.add(1, 'day');
    }
    return c.toDate();
  };

  window.addHalfDay = function(e) {
    return moment(e).add(6, 'hours').toDate();
  };

  window.subtractHalfDay = function(e) {
    return moment(e).subtract(6, 'hours').toDate();
  };

  window.currentDayFromEpoch = function() {
    var epoch, now;
    now = moment(new Date());
    epoch = moment(new Date(1970));
    return parseInt((now - epoch) / 1000 / 60 / 60 / 24);
  };

  AnalyticsLineChart = (function() {
    AnalyticsLineChart.prototype.setMinMax = function() {
      var obj;
      obj = this;
      if (this.periocity === 0) {
        obj.min = d3.min(obj.data.data.map(function(d) {
          if (moment(d.day) < moment(obj.cws) || moment(d.day) >= moment(d.day).add(7, 'days')) {
            return void 0;
          }
          return d3.min([d.line1, d.line2, d.line3]);
        }));
        obj.max = d3.max(obj.data.data.map(function(d) {
          if (moment(d.day) < moment(obj.cws) || moment(d.day) >= moment(d.day).add(7, 'days')) {
            return void 0;
          }
          return d3.max([d.line1, d.line2, d.line3]);
        }));
      }
      if (this.periocity === 1) {
        obj.min = d3.min(obj.data.data.map(function(d) {
          if (moment(d.day) < moment(obj.cms) || moment(d.day) >= moment(d.day).add(1, 'month')) {
            return void 0;
          }
          return d3.min([d.line1, d.line2, d.line3]);
        }));
        return obj.max = d3.max(obj.data.data.map(function(d) {
          if (moment(d.day) < moment(obj.cms) || moment(d.day) >= moment(d.day).add(1, 'days')) {
            return void 0;
          }
          return d3.max([d.line1, d.line2, d.line3]);
        }));
      }
    };

    AnalyticsLineChart.prototype.switchPeriocity = function() {
      var obj;
      obj = this;
      obj.periocity = obj.periocity === 0 ? 1 : 0;
      obj.setPeriocity(obj.periocity);
      return obj.update();
    };

    AnalyticsLineChart.prototype.setPeriocity = function(v) {
      var container_height, container_width, obj, week;
      obj = this;
      week = ["Su", "M", "T", "W", "Th", "F", "Sa"];
      container_width = parseInt(this.chart_container.style("width"), 10);
      container_height = parseInt(this.chart_container.style("height"), 10);
      if (obj.periocity === 1) {
        this.xScale.domain([this.cms, moment(this.cms).endOf('month')]);
        this.xAxis.scale(this.xScale).tickFormat(function(d, i) {
          return moment(d).format("MMM Do");
        }).orient("bottom").tickValues(allMonthsArray(this.data.first_date, this.data.last_date));
        obj.svg.select(".x.axis").transition().duration(1500).ease("sin-in-out").call(obj.xAxis);
      }
      if (obj.periocity === 0) {
        this.xScale.domain([subtractHalfDay(this.cws), addHalfDay(nextSunday(this.cws))]);
        this.xAxis.scale(this.xScale).tickFormat(function(d, i) {
          return week[moment(d).weekday()];
        }).orient("bottom").tickValues(allDaysArray(this.data.first_date, this.data.last_date));
        return obj.svg.select(".x.axis").transition().duration(1500).ease("sin-in-out").call(obj.xAxis);
      }
    };

    AnalyticsLineChart.prototype.rescale = function() {
      var container_height, container_width, obj;
      obj = this;
      container_width = parseInt(obj.chart_container.style("width"), 10);
      container_height = parseInt(obj.chart_container.style("height"), 10);
      obj.svg.attr('width', container_width).attr('height', container_height);
      obj.xScale.range([obj.margins.left, container_width - obj.margins.right]);
      obj.yScale.range([container_height - obj.margins.top, obj.margins.bottom]);
      obj.setMinMax();
      obj.setPeriocity(obj.periocity);
      obj.update();
      obj.svg.select(".x.axis").attr("transform", "translate(0," + (container_height - obj.margins.bottom) + ")").attr('class', 'x axis').call(obj.xAxis);
      obj.svg.select(".y.axis").call(obj.yAxis);
      obj.svg.selectAll('.Line1').attr('d', obj.lineGen1(obj.current_week_data));
      obj.svg.selectAll('.Line2').attr('d', obj.lineGen2(obj.current_week_data));
      return obj.svg.selectAll('.Line3').attr('d', obj.lineGen3(obj.current_week_data));
    };

    function AnalyticsLineChart(_container, _options) {
      var bisectDate, container_height, container_width, d_opts, data, height, obj, week, width;
      if (_container == null) {
        _container = 'body';
      }
      if (_options == null) {
        _options = {};
      }
      if (typeof _container !== "string") {
        return;
      }
      if (!window.analitics_chart_objs) {
        window.analitics_chart_objs = [];
      }
      window.analitics_chart_objs.push(this);
      d_opts = {
        margins: {
          top: 0,
          right: 5,
          bottom: 20,
          left: 5
        },
        previous_week_button: '.previous-week-btn',
        next_week_button: '.next-week-btn',
        container: _container,
        tooltip: '.line-chart-tooltip',
        no_data: false
      };
      this.options = $.extend(true, d_opts, _options);
      if (this.options.no_data) {
        this.options.data = {
          dummy_data: true,
          first_date: "2015-01-05",
          last_date: "2015-01-11",
          nweeks: 1,
          data: [
            {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-05"
            }, {
              line1: 1,
              line2: 0,
              line3: 0,
              day: "2015-01-06"
            }, {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-07"
            }, {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-08"
            }, {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-09"
            }, {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-10"
            }, {
              line1: 0,
              line2: 0,
              line3: 0,
              day: "2015-01-11"
            }
          ]
        };
      }
      this.container = d3.select(_container);
      this.chart_container = d3.select(_container + " " + this.options.chart_container);
      this.slider = $(_container + " .periocity-slider");
      this.periocity = 0;
      this.margins = this.options.margins;
      this.data = this.options.data;
      this.week_index = 0;
      this.current_week_data = this.data.data;
      this.previous_week_button = d3.select(_container + " " + this.options.previous_week_button + " ");
      this.next_week_button = d3.select(_container + " " + this.options.next_week_button + " ");
      obj = this;
      container_width = parseInt(this.chart_container.style("width"), 10);
      container_height = parseInt(this.chart_container.style("height"), 10);
      this.svg = this.chart_container.append('svg').attr('width', container_width).attr('height', container_height);
      width = container_width - this.margins.right - this.margins.left;
      height = container_height - this.margins.top - this.margins.bottom;
      this.cws = lastMonday(this.data.last_date);
      this.cms = moment(this.data.last_date).date(1).toDate();
      if (this.periocity === 0) {
        this.updateStats(this.cws);
      }
      if (this.periocity === 1) {
        this.updateStats(this.cms);
      }
      if (this.periocity === 0) {
        this.xScale = d3.scale.linear().range([this.margins.left, container_width - this.margins.right]).domain([subtractHalfDay(this.cws), addHalfDay(nextSunday(this.cws))]);
      }
      if (this.periocity === 1) {
        this.xScale = d3.scale.linear().range([this.margins.left, container_width - this.margins.right]).domain([this.cms, moment(this.cms).endOf('month')]);
      }
      if (this.options.no_data) {
        obj.min = 0;
        obj.max = 3;
      } else {
        this.setMinMax();
      }
      this.yScale = d3.scale.linear().range([container_height - this.margins.top, this.margins.bottom]).domain([obj.min, obj.max + 2]);
      week = ["Su", "M", "T", "W", "Th", "F", "Sa"];
      if (this.periocity === 0) {
        this.xAxis = d3.svg.axis().scale(this.xScale).tickFormat(function(d, i) {
          return week[moment(d).weekday()];
        }).orient("bottom").tickValues(allDaysArray(this.data.first_date, this.data.last_date));
      }
      if (this.periocity === 1) {
        this.xAxis = d3.svg.axis().scale(this.xScale).tickFormat(function(d, i) {
          return moment(d).format("MMM Do");
        }).orient("bottom").tickValues(allMonthsArray(this.data.first_date, this.data.last_date));
      }
      this.yAxis = d3.svg.axis().scale(this.yScale).tickSize(-width).ticks(5).tickFormat("").orient("left");
      this.svg.append("svg:g").attr("transform", "translate(0," + (container_height - this.margins.bottom) + ")").attr('class', 'x axis').call(this.xAxis);
      this.gy = this.svg.append("g").attr("transform", "translate(" + this.margins.left + "," + (-this.margins.bottom) + ")").attr("class", "y axis").call(this.yAxis);
      this.gy.selectAll('g').filter(function(d) {
        return d;
      }).classed('minor', true);
      this.gy.selectAll('text').attr('x', 4).attr('dy', -4);
      data = this.current_week_data;
      this.lineGen1 = d3.svg.line().x(function(d) {
        return obj.xScale(new Date(d.day));
      }).y(function(d) {
        return obj.yScale(d.line1);
      }).interpolate("monotone");
      this.lineGen2 = d3.svg.line().x(function(d) {
        return obj.xScale(new Date(d.day));
      }).y(function(d) {
        return obj.yScale(d.line2);
      }).interpolate("monotone");
      this.lineGen3 = d3.svg.line().x(function(d) {
        return obj.xScale(new Date(d.day));
      }).y(function(d) {
        return obj.yScale(d.line3);
      }).interpolate("monotone");
      this.line1 = this.svg.append('svg:path').attr("transform", "translate(0," + (-this.margins.bottom) + ")").attr('d', this.lineGen1(data)).attr('stroke', '#40C779').attr('stroke-width', 2).attr('fill', 'none').attr('class', 'Line1');
      if (!this.options.no_data) {
        this.line2 = this.svg.append('svg:path').attr("transform", "translate(0," + (-this.margins.bottom) + ")").attr('d', this.lineGen2(data)).attr('stroke', '#FAB731').attr('stroke-width', 2).attr('fill', 'none').attr('class', 'Line2');
        this.line3 = this.svg.append('svg:path').attr("transform", "translate(0," + (-this.margins.bottom) + ")").attr('d', this.lineGen3(data)).attr('stroke', '#BD94F0').attr('stroke-width', 2).attr('fill', 'none').attr('class', 'Line3');
        this.verticalLine = this.svg.append('line').attr({
          x1: 0,
          y1: 0,
          x2: 0,
          y2: height
        }).attr("stroke", "#B3C0C6").attr('stroke-width', 1).attr('class', 'verticalLine').style("stroke-dasharray", "6, 2");
      }
      this.circle1 = this.svg.append('circle').attr('opacity', 0).attr({
        r: 4,
        fill: '#40C779'
      }).style("stroke", "#ffffff").style("stroke-width", 1);
      if (!this.options.no_data) {
        this.circle2 = this.svg.append('circle').attr('opacity', 0).attr({
          r: 4,
          fill: '#FAB731'
        }).style("stroke", "#ffffff").style("stroke-width", 1);
        this.circle3 = this.svg.append('circle').attr('opacity', 0).attr({
          r: 4,
          fill: '#BD94F0'
        }).style("stroke", "#ffffff").style("stroke-width", 1);
        this.previous_week_button.on('click', function() {
          d3.event.stopPropagation();
          if (obj.periocity === 0) {
            if (obj.cws > new Date(obj.data.first_date)) {
              obj.cws = lastMonday(moment(obj.cws).subtract(7, 'days').toDate());
              obj.update();
            }
          }
          if (obj.periocity === 1) {
            if (obj.cms > new Date(obj.data.first_date)) {
              obj.cms = moment(obj.cms).subtract(1, 'month').date(1).toDate();
              return obj.update();
            }
          }
        });
        this.next_week_button.on('click', function() {
          d3.event.stopPropagation();
          if (obj.periocity === 0) {
            if (moment(obj.cws).add(7, 'days').toDate() <= new Date(obj.data.last_date)) {
              obj.cws = lastMonday(moment(obj.cws).add(7, 'days').toDate());
              obj.update();
            }
          }
          if (obj.periocity === 1) {
            if (moment(obj.cms).add(1, 'month').toDate() <= new Date(obj.data.last_date)) {
              obj.cms = moment(obj.cms).add(1, 'month').date(1).toDate();
              return obj.update();
            }
          }
        });
      }
      this.rect = this.svg.append("rect").attr({
        x: this.margins.left,
        y: this.margins.top,
        width: width,
        height: height,
        fill: "#ffffff",
        opacity: 0
      });
      bisectDate = d3.bisector(function(d) {
        var d1;
        d1 = new Date(d.day);
        return d1.getTime();
      }).left;
      this.rect.on('mousemove', function() {
        var d, d0, d0_date, d1, d1_date, day, dd, i, x0;
        x0 = obj.xScale.invert(d3.mouse(this)[0]);
        data = obj.data.data;
        i = bisectDate(data, x0, 1);
        d0 = data[i - 1];
        d1 = data[i];
        if (d0 === void 0) {
          return;
        }
        if (d1 === void 0) {
          return;
        }
        d0_date = new Date(d0.day);
        d1_date = new Date(d1.day);
        d = x0 - (d0_date.getTime()) > d1_date.getTime() - x0 ? d1 : d0;
        dd = new Date(d.day);
        if (obj.circle1) {
          obj.circle1.attr('opacity', 1).attr('transform', 'translate(' + obj.xScale(dd.getTime()) + ',' + (obj.yScale(d.line1) - obj.margins.bottom) + ')');
        }
        if (obj.circle2) {
          obj.circle2.attr('opacity', 1).attr('transform', 'translate(' + obj.xScale(dd.getTime()) + ',' + (obj.yScale(d.line2) - obj.margins.bottom) + ')');
        }
        if (obj.circle3) {
          obj.circle3.attr('opacity', 1).attr('transform', 'translate(' + obj.xScale(dd.getTime()) + ',' + (obj.yScale(d.line3) - obj.margins.bottom) + ')');
        }
        obj.container.select('.line1-number').text(d.line1);
        obj.container.select('.line2-number').text(d.line2);
        obj.container.select('.line3-number').text(d.line3);
        obj.container.select(obj.options.tooltip).classed("show", true);
        day = moment(d.day);
        return obj.container.select('.tooltip-date').text(day.format('ddd, MMMM Do YYYY'));
      }).on('mouseleave', function() {
        obj.container.select(obj.options.tooltip).classed("show", false);
        obj.circle1.attr('opacity', 0);
        if (!obj.options.no_data) {
          obj.circle2.attr('opacity', 0);
          obj.circle3.attr('opacity', 0);
          return obj.verticalLine.attr('opacity', 0);
        }
      });
      this.slider.slider({
        value: 0,
        min: 0,
        max: 1,
        step: 1,
        slide: function(event, ui) {
          var c;
          c = ui.value === 0 ? 'w' : 'm';
          $(this).parents('.slider-holder').removeClass('w m').addClass(c);
          obj.periocity = ui.value;
          obj.setPeriocity(ui.value);
          return obj.update();
        }
      });
      return;
    }

    AnalyticsLineChart.prototype.calculateWeekStats = function(date) {
      var line1, line2, line3, obj, one_week_from_date;
      obj = this;
      line1 = line2 = line3 = 0;
      date = moment(date);
      one_week_from_date = date.clone().add(7, 'days');
      obj.data.data.forEach(function(v) {
        var d;
        d = moment(v.day);
        if (d >= date && d < one_week_from_date) {
          line1 += v.line1;
          line2 += v.line2;
          return line3 += v.line3;
        }
      });
      return {
        line1: line1,
        line2: line2,
        line3: line3
      };
    };

    AnalyticsLineChart.prototype.calculateMonthStats = function(date) {
      var line1, line2, line3, obj, one_week_from_date;
      obj = this;
      line1 = line2 = line3 = 0;
      date = moment(date);
      one_week_from_date = date.clone().add(1, 'month');
      obj.data.data.forEach(function(v) {
        var d;
        d = moment(v.day);
        if (d >= date && d < one_week_from_date) {
          line1 += v.line1;
          line2 += v.line2;
          return line3 += v.line3;
        }
      });
      return {
        line1: line1,
        line2: line2,
        line3: line3
      };
    };

    AnalyticsLineChart.prototype.updateStats = function(date) {
      var day, day_end, month_name, obj, s, week, year;
      obj = this;
      s = 0;
      if (obj.periocity === 0) {
        s = obj.calculateWeekStats(date);
      }
      if (obj.periocity === 1) {
        s = obj.calculateMonthStats(date);
      }
      obj.container.select(".line-1-week-stats").text(s.line1);
      obj.container.select(".line-2-week-stats").text(s.line2);
      obj.container.select(".line-3-week-stats").text(s.line3);
      week = moment(date);
      month_name = week.format('MMMM');
      day = week.format('D');
      day_end = week.add(6, 'days').format("D");
      year = week.format("YYYY");
      if (obj.periocity === 0) {
        obj.container.select('.week-desc').text(month_name + " " + day + "-" + day_end + "  " + year);
      }
      if (obj.periocity === 1) {
        return obj.container.select('.week-desc').text(month_name + " - " + year);
      }
    };

    AnalyticsLineChart.prototype.update = function() {
      var obj, svg;
      obj = this;
      svg = obj.chart_container.transition();
      this.setMinMax();
      obj.yScale.domain([obj.min, obj.max + 2]);
      if (this.periocity === 0) {
        obj.xScale.domain([subtractHalfDay(this.cws), addHalfDay(nextSunday(this.cws))]);
      }
      if (this.periocity === 1) {
        obj.xScale.domain([this.cms, moment(this.cms).endOf('month')]);
      }
      svg.select(".Line1").duration(250).attr("d", obj.lineGen1(obj.data.data));
      svg.select(".Line2").duration(250).attr("d", obj.lineGen2(obj.current_week_data));
      svg.select(".Line3").duration(250).attr("d", obj.lineGen3(obj.current_week_data));
      svg.select(".x.axis").duration(250).call(obj.xAxis);
      svg.select(".y.axis").duration(750).call(obj.yAxis);
      if (this.periocity === 0) {
        this.updateStats(this.cws);
      }
      if (this.periocity === 1) {
        return this.updateStats(this.cms);
      }
    };

    return AnalyticsLineChart;

  })();

  updateAnalyticsStats = function() {
    showBoxLoading("#club-health-tile", {
      "class": 'small-loading',
      text: ''
    });
    showBoxLoading("#punch-card-tile", {
      "class": 'small-loading',
      text: ''
    });
    showBoxLoading("#punch-campaigns-tile", {
      "class": 'small-loading',
      text: ''
    });
    $('#club-health-tile, #punch-card-tile, #punch-campaigns-tile').addClass('loading');
    $.ajax("/dashboard/analytics_tab_data?analytics_stats=1", {
      dataType: 'json',
      success: function(data) {
        gon.analytics_stats = data.analytics_stats;
        window.hideBoxLoading(".analytics-stats-tile");
        $(".analytics-stats-tile").removeClass('loading');
        initTotalMembers();
        initAppActivity();
        initStoreCheckins();
        initSocialStats();
        return initRatings();
      }
    });
    $("#club-health-tile").addClass('loading');
    window.showBoxLoading($("#club-health-tile"), {
      "class": 'small-loading',
      text: ''
    });
    $.ajax("/dashboard/analytics_tab_data?members_matrix=1", {
      dataType: 'json',
      success: function(data) {
        gon.members_matrix = data.members_matrix;
        window.hideBoxLoading("#club-health-tile");
        $("#club-health-tile").removeClass('loading');
        return initClubHealth();
      }
    });
    $.ajax("/dashboard/analytics_tab_data?punchcard_matrix=1", {
      dataType: 'json',
      success: function(data) {
        gon.punchcard_matrix = data.punchcard_matrix;
        window.hideBoxLoading("#punch-card-tile");
        $("#punch-card-tile").removeClass('loading');
        return initPunchCard();
      }
    });
    $.ajax("/dashboard/analytics_tab_data?punch_campaigns_matrix=1", {
      dataType: 'json',
      success: function(data) {
        gon.punch_campaigns_matrix = data.punch_campaigns_matrix;
        window.hideBoxLoading("#punch-campaigns-tile");
        $("#punch-campaigns-tile").removeClass('loading');
        return initPunchCampaigns();
      }
    });
    $("#redemtion-rates-tile").addClass('loading');
    window.showBoxLoading('#redemtion-rates-tile', {
      "class": 'small-loading',
      text: ''
    });
    return $.ajax("/dashboard/analytics_tab_data?redemption_rates=1", {
      dataType: 'json',
      success: function(data) {
        gon.redemption_rates = data.redemption_rates;
        initRedemtionRates();
        window.hideBoxLoading("#redemtion-rates-tile");
        return $("#redemtion-rates-tile").removeClass('loading');
      }
    });
  };

  initRedemtionRates = function() {
    if (gon.redemption_rates.total_redeemed === 0) {
      $("#redemtion-rates-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
      if (gon.redemption_rates.join_reward || gon.redemption_rates.interval_reward || gon.redemption_rates.fbinvitescount_reward || gon.redemption_rates.fbsharescount_reward || gon.redemption_rates.randomwalkin_reward) {
        return $("#redemtion-rates-tile").removeClass('redemption-no-rewards-state');
      } else {
        return $("#redemtion-rates-tile").addClass('redemption-no-rewards-state');
      }
    } else {
      $("#redemtion-rates-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      if (gon.redemption_rates.join_reward === false) {
        $("#redemtion-rates-tile .welcome-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .welcome-row").removeClass('gray-state');
        $("#redemtion-rates-tile .welcome-row .redemtion-tooltip .reward").text(gon.redemption_rates.join_reward);
        $("#redemtion-rates-tile .welcome-row .perc").text(gon.redemption_rates.join_rate + "%");
      }
      if (gon.redemption_rates.interval_reward === false) {
        $("#redemtion-rates-tile .happy-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .happy-row").removeClass('gray-state');
        $("#redemtion-rates-tile .happy-row .redemtion-tooltip .reward").text(gon.redemption_rates.interval_reward);
        $("#redemtion-rates-tile .happy-row .perc").text(gon.redemption_rates.interval_rate + "%");
      }
      if (gon.redemption_rates.fbinvitescount_reward === false) {
        $("#redemtion-rates-tile .fb-ref-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .fb-ref-row").removeClass('gray-state');
        $("#redemtion-rates-tile .fb-ref-row .redemtion-tooltip .reward").text(gon.redemption_rates.fbinvitescount_reward);
        $("#redemtion-rates-tile .fb-ref-row .perc").text(gon.redemption_rates.fbinvitescount_rate + "%");
      }
      if (gon.redemption_rates.fbsharescount_reward === false) {
        $("#redemtion-rates-tile .fb-connect-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .fb-connect-row").removeClass('gray-state');
        $("#redemtion-rates-tile .fb-connect-row .redemtion-tooltip .reward").text(gon.redemption_rates.fbsharescount_reward);
        $("#redemtion-rates-tile .fb-connect-row  .perc").text(gon.redemption_rates.fbsharescount_rate + "%");
      }
      if (gon.redemption_rates.randomwalkin_reward === false) {
        $("#redemtion-rates-tile .lucky-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .lucky-row").removeClass('gray-state');
        $("#redemtion-rates-tile .lucky-row .redemtion-tooltip .reward").text(gon.redemption_rates.randomwalkin_reward);
        $("#redemtion-rates-tile .lucky-row .perc").text(gon.redemption_rates.randomwalkin_rate + "%");
      }
      if (gon.redemption_rates.total_immediate === 0) {
        return $("#redemtion-rates-tile .custom-row").addClass('gray-state');
      } else {
        $("#redemtion-rates-tile .custom-row").removeClass('gray-state');
        return $("#redemtion-rates-tile .custom-row .perc").text(gon.redemption_rates.immediate_rate + "%");
      }
    }
  };

  initRatings = function() {
    var r;
    if (gon.analytics_stats.alltime_rating + gon.analytics_stats.alltime_avg_rating <= 0) {
      return $("#ratings-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
    } else {
      $("#ratings-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      $("#ratings-tile").toggleClass("no-last-week", gon.analytics_stats.lastweek_total_rating + gon.analytics_stats.lastweek_avg_rating === 0);
      $("#ratings-tile").toggleClass("no-previous-week", gon.analytics_stats.previous_week_avg_rating === 0);
      $("#ratings-tile .average-total-block .number").text(gon.analytics_stats.alltime_avg_rating);
      $("#ratings-tile .average-total-block .desc2").text("(" + gon.analytics_stats.alltime_rating + " ratings)");
      $("#ratings-tile .average-last-week-block .number").text(gon.analytics_stats.lastweek_avg_rating);
      $("#ratings-tile .average-last-week-block  .desc2").text("(" + gon.analytics_stats.lastweek_total_rating + " ratings)");
      if (gon.analytics_stats.previous_week_avg_rating > 0) {
        r = gon.analytics_stats.lastweek_avg_rating / (gon.analytics_stats.previous_week_avg_rating / 100) - 100;
        $("#ratings-tile .weekly-progress").toggleClass("increasing", r > 0);
        $("#ratings-tile .weekly-progress").toggleClass("decreasing", r < 0);
        return $("#ratings-tile .weekly-progress .wp-number").text((Math.abs(r).toFixed(1)) + "%");
      }
    }
  };

  initSocialStats = function() {
    if (gon.analytics_stats.user_checkin_fb <= 0) {
      return $("#social-stats-tile, .social-stats-tile-holder").removeClass("data-state no-data-state loading").addClass("no-data-state");
    } else {
      return $("#social-stats-tile").removeClass("data-state no-data-state loading").addClass("data-state");
    }
  };

  initClubHealth = function() {
    var clubHealthChart, current_day, data, last_2weeks_total, noDataHeathChart, one_month_ago, total;
    data = gon.members_matrix.data;
    total = 0;
    last_2weeks_total = 0;
    current_day = moment();
    one_month_ago = moment().subtract(1, 'month');
    data.forEach(function(v) {
      total += v.line1;
      if (moment(v.date) >= one_month_ago) {
        return last_2weeks_total += v.line1;
      }
    });
    if (!gon.members_matrix.dummy_data && last_2weeks_total < 20) {
      $("#club-health-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
      AnalyticsLineChart(noDataHeathChart = new AnalyticsLineChart("#club-health-tile", {
        chart_container: "#club-health-no-data-chart",
        no_data: true,
        tooltip: '.line-chart-no-data-tooltip'
      }));
    } else {
      $("#club-health-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      return AnalyticsLineChart(clubHealthChart = new AnalyticsLineChart("#club-health-tile", {
        data: gon.members_matrix,
        chart_container: "#club-health-chart"
      }));
    }
  };

  initPunchCard = function() {
    var current_day, data, last_2weeks_total, noDataHeathChart, one_month_ago, punchCardChart, total;
    data = gon.punchcard_matrix.data;
    total = 0;
    last_2weeks_total = 0;
    current_day = moment();
    one_month_ago = moment().subtract(1, 'month');
    data.forEach(function(v) {
      total += v.line1;
      if (moment(v.date) >= one_month_ago) {
        return last_2weeks_total += v.line1;
      }
    });
    if (!gon.punchcard_matrix.dummy_data && last_2weeks_total < 5) {
      $("#punch-card-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
      if (gon.punchcard_matrix.has_punchcard) {
        $("#punch-card-tile").removeClass('width-punchcard-state no-punchcard-state').addClass('width-punchcard-state');
        AnalyticsLineChart(noDataHeathChart = new AnalyticsLineChart("#punch-card-tile", {
          chart_container: " #punch-card-no-data-chart",
          no_data: true,
          tooltip: '.line-chart-no-data-tooltip'
        }));
      } else {
        $("#punch-card-tile").removeClass('width-punchcard-state no-punchcard-state').addClass('no-punchcard-state');
      }
    } else {
      $("#punch-card-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      return AnalyticsLineChart(punchCardChart = new AnalyticsLineChart("#punch-card-tile", {
        data: gon.punchcard_matrix,
        chart_container: "#punchcard-chart"
      }));
    }
  };

  initPunchCampaigns = function() {
    var current_day, data, last_2weeks_total, noDataHeathChart, punchCampaignsChart, total, two_weeks_ago;
    data = gon.punch_campaigns_matrix.data;
    total = 0;
    last_2weeks_total = 0;
    current_day = moment();
    two_weeks_ago = moment().subtract(2, 'weeks');
    data.forEach(function(v) {
      total += v.line1;
      if (moment(v.date) >= two_weeks_ago) {
        return last_2weeks_total += v.line1;
      }
    });
    if (!gon.punch_campaigns_matrix.dummy_data && last_2weeks_total < 15) {
      $("#punch-campaigns-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
      if (gon.punch_campaigns_matrix.push_campaigns_count > 0) {
        $("#punch-campaigns-tile").removeClass('width-punch-campaings-state no-punch-campaings-state').addClass('width-punch-campaings-state');
        AnalyticsLineChart(noDataHeathChart = new AnalyticsLineChart("#punch-campaigns-tile", {
          chart_container: "#punch-campaigns-no-data-chart",
          no_data: true,
          tooltip: '.line-chart-no-data-tooltip'
        }));
      } else {
        $("#punch-campaigns-tile").removeClass('width-punch-campaings-state no-punch-campaings-state').addClass('no-punch-campaings-state');
      }
    } else {
      $("#punch-campaigns-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      return AnalyticsLineChart(punchCampaignsChart = new AnalyticsLineChart("#punch-campaigns-tile", {
        chart_container: "#punch-campaigns-chart",
        data: gon.punch_campaigns_matrix
      }));
    }
  };

  initAppActivity = function() {
    if (gon.analytics_stats.total_engaged <= 10) {
      $("#app-activity-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
    } else {
      $("#app-activity-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      $("#app-activity-tile .number-title").text(prettyNumber(gon.analytics_stats.total_engaged));
      $("#app-activity-tile .app-interactions-number").text(prettyNumber(gon.analytics_stats.app_interactions));
    }
    $("#total-app-tooltip .block").removeClass('visible');
    return $.each(gon.analytics_stats.user_interactions_stats, function(i, v) {
      $("#total-app-tooltip .block.block-" + i).addClass('visible');
      return $("#total-app-tooltip .block.block-" + i + " .number").text(prettyNumber(v));
    });
  };

  initTotalMembers = function() {
    if (gon.analytics_stats.total_members <= 0) {
      return $("#total-members-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
    } else {
      $("#total-members-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      return initTotalMembersGraph();
    }
  };

  initStoreCheckins = function() {
    $(".roi-field").val(gon.analytics_stats.roi);
    forceNumericality(".roi-field", true, false);
    $(".ret-inv").text("$" + (gon.analytics_stats.roi * gon.analytics_stats.total_claimed_walkins));
    $(".calculate-button").on('click', function() {
      return $(".ret-inv").text("$" + ((parseFloat($(".roi-field").val()) * gon.analytics_stats.total_claimed_walkins).toFixed(2)));
    });
    if (gon.analytics_stats.total_claimed_walkins <= 0) {
      return $("#store-checkins-tile").removeClass("data-state no-data-state loading").addClass("no-data-state");
    } else {
      $("#store-checkins-tile").removeClass("data-state no-data-state loading").addClass("data-state");
      return $("#store-checkins-tile .number-title").text(prettyNumber(gon.analytics_stats.total_claimed_walkins));
    }
  };

  initTotalMembersGraph = function() {
    var arcHover, color, dataset, donutWidth, height, new_customers, new_customers_per, radius, returning_customers, returning_customers_per, width;
    d3.select("#total-members-chart svg").remove();
    returning_customers = gon.analytics_stats.returning_members;
    new_customers = gon.analytics_stats.total_members - returning_customers;
    $("#total-members-tile .number-title").text(prettyNumber(gon.analytics_stats.total_members));
    new_customers_per = parseInt(new_customers / (gon.analytics_stats.total_members / 100));
    returning_customers_per = parseInt(100 - new_customers_per);
    $("#total-members-tile .new-customers-block .per").text(new_customers_per + "%");
    $("#total-members-tile .return-customers-block .per").text(returning_customers_per + "%");
    dataset = [
      {
        label: 'Returning customers',
        color: '#00A0E2',
        count: returning_customers
      }, {
        label: 'New customers',
        color: '#FAB731',
        count: new_customers
      }
    ];
    width = 100;
    height = 100;
    radius = Math.min(width, height) / 2;
    donutWidth = 6;
    color = d3.scale.category20b();
    window.total_members_svg = d3.select('#total-members-chart').append('svg').attr('width', width).attr('height', height).append('g').attr('transform', "translate(" + (width / 2) + "," + (height / 2) + ")");
    window.total_members_arc = d3.svg.arc().innerRadius(radius - donutWidth - 10).outerRadius(radius - 6);
    arcHover = d3.svg.arc().innerRadius(radius - donutWidth - 10).outerRadius(radius);
    window.total_members_pie = d3.layout.pie().value(function(d) {
      return d.count;
    }).sort(null);
    window.total_members_path = window.total_members_svg.selectAll('path').data(window.total_members_pie(dataset)).enter().append('path').attr('d', window.total_members_arc).attr('fill', function(d, i) {
      return d.data.color;
    }).on("mouseenter", function(d) {
      d3.select(this).transition().duration(250).attr("d", arcHover);
      $(".total-members-chart-tooltip .number ").text(d.data.count);
      return $(".total-members-chart-tooltip").addClass('show');
    }).on("mouseleave", function(d) {
      d3.select(this).transition().duration(250).attr("d", total_members_arc);
      return $(".total-members-chart-tooltip").removeClass('show');
    });
  };

  showSocialStatsTip = function() {
    return $('#social-stats-tile .social-triangle-tip').hover((function() {
      return $('.tip-statistics').toggleClass('display');
    }));
  };

  window.initDashboardTabAnalytics = function() {
    showSocialStatsTip();
    updateAnalyticsStats();
    return $(".big-tooltip.bindmouse").each(function() {
      return $(this).parent().on('mousemove', function(e) {
        var t, x, y;
        t = $(this).find(".big-tooltip");
        x = e.clientX;
        y = e.clientY;
        return t.attr("style", "top: " + ((y + 20) + 'px') + "; left:" + ((x + 10) + 'px'));
      });
    });
  };

}).call(this);
(function() {
  var bindActionSelectors, bindBottomScroll, bindCharCounterForTextArea, bindFavoriteBtns, bindGeneralMessageForm, bindGeneralMessageSendBtn, bindMessageSendLightboxes, bindMessageWithRewardForm, bindMessageWithRewardSendBtn, bindSelectMembersCheckbox, bindSignalsFromUserInfo, clearAllSelected, handleFiltering, handleSearching, handleSorting, initMessageLightboxes, searchCrm, sendRequestToServer, updateSelectedDisplay, update_selected_members;

  bindActionSelectors = function() {
    return $('.send-member-selector').on('selectric-change', function(event) {
      var selected_index;
      selected_index = event.target.selectedIndex;
      window.selected_members = $('#crm-tab .check-member').filter(':checked');
      window.messages_qtips.toggle(false);
      $("*").qtip('hide');
      if (selected_index === 1) {
        window.openSendGeneralMessage();
      } else if (selected_index === 2) {
        window.openSendMessageWithReward();
      }
      $('.send-member-selector').val(-1);
      $('.send-member-selector').selectric('refresh');
    });
  };

  bindGeneralMessageForm = function() {
    return $("form#form-publish-token-general-message").ajaxForm({
      beforeSubmit: function() {
        return window.showBoxLoading("#crm-general-message-lightbox", {
          text: 'Sending message...'
        });
      },
      success: function(data) {
        $('#crm-general-message-lightbox .frame-holder').fadeOut(300);
        $('#crm-general-message-lightbox .message-sent-holder').fadeIn(300);
        window.hideBoxLoading("#crm-general-message-lightbox");
        $('#crm-general-message-lightbox .reward-field').val('');
        return setTimeout((function() {
          parent.$.fancybox.close();
          return setTimeout((function() {
            return $('#crm-general-message-lightbox .message-sent-holder').hide('fast', function() {
              return $('#crm-general-message-lightbox .frame-holder').show();
            });
          }), 2000);
        }), 5000);
      }
    });
  };

  bindGeneralMessageSendBtn = function() {
    return $('#crm-general-message-lightbox .send-btn').on('click', function(e) {
      if ($(this).hasClass('disabled')) {
        return;
      }
      $(this).closest('.holder').find("form#form-publish-token-general-message").submit();
      $(this).addClass('disabled');
    });
  };

  bindMessageWithRewardForm = function() {
    return $("form#form-publish-token-message-with-reward").ajaxForm({
      beforeSubmit: function() {
        return window.showBoxLoading(" #crm-message-with-reward-lightbox.crm-tab", {
          text: 'Sending reward...'
        });
      },
      success: function(data) {
        $(' #crm-message-with-reward-lightbox.crm-tab .frame-holder').fadeOut(300);
        $(' #crm-message-with-reward-lightbox.crm-tab .message-sent-holder').fadeIn(300);
        window.hideBoxLoading(" #crm-message-with-reward-lightbox.crm-tab");
        $(' #crm-message-with-reward-lightbox.crm-tab .reward-field').val('');
        $(' #crm-message-with-reward-lightbox.crm-tab .to_days_select').val(30 * 1440);
        $(' #crm-message-with-reward-lightbox.crm-tab .to_days_select').selectric('refresh');
        return setTimeout((function() {
          parent.$.fancybox.close();
          return setTimeout((function() {
            return $(' #crm-message-with-reward-lightbox.crm-tab .message-sent-holder').hide('fast', function() {
              return $(' #crm-message-with-reward-lightbox.crm-tab .frame-holder').show();
            });
          }), 2000);
        }), 5000);
      }
    });
  };

  bindMessageWithRewardSendBtn = function() {
    return $(' #crm-message-with-reward-lightbox.crm-tab .send-btn').on('click', function(e) {
      if ($(this).hasClass('disabled')) {
        return;
      }
      $(" #crm-message-with-reward-lightbox.crm-tab form#form-publish-token-message-with-reward").submit();
      $(this).addClass('disabled');
    });
  };

  window.initGeneralMessageLightbox = function() {
    bindGeneralMessageForm();
    bindGeneralMessageSendBtn();
    bindMessageSendLightboxes();
    bindCharCounterForTextArea($('#crm-message-with-reward-lightbox.crm-tab .reward-field'), 60);
    bindCharCounterForTextArea($('#crm-general-message-lightbox .reward-field'), 600);
    return update_selected_members(window.number_of_selected_users);
  };

  initMessageLightboxes = function() {
    bindGeneralMessageForm();
    bindGeneralMessageSendBtn();
    bindMessageWithRewardForm();
    return bindMessageWithRewardSendBtn();
  };

  window.handleCRMSubmissionSuccess = function() {
    clearAllSelected();
  };

  bindMessageSendLightboxes = function() {
    return $('#crm-general-message-lightbox .reward-field,  #crm-message-with-reward-lightbox.crm-tab .reward-field').on('change paste keyup', function() {
      var l, t;
      t = $(this).val();
      if (t.match(/\n/g)) {
        t = t.replace(/\n/g, " ");
        $(this).val(t);
      }
      l = t.length;
      return $(this).closest('.holder').find('.send-btn').toggleClass("disabled", l < 3);
    });
  };

  bindCharCounterForTextArea = function(textarea_ele, max_chars) {
    if (max_chars == null) {
      max_chars = 60;
    }
    return textarea_ele.on('keyup change paste textarea_sync', function() {
      var len, max;
      max = max_chars;
      len = $(this).val().length;
      if (len >= max) {
        return $(this).parent().siblings('.charNum').text("60/" + max_chars);
      } else {
        return $(this).parent().siblings('.charNum').text(len + ("/" + max_chars));
      }
    });
  };

  bindFavoriteBtns = function() {
    return $("#crm-tab").on('click', '.fav-icon', function(e) {
      var $this;
      $this = $(this);
      if ($this.data('disabled') === 1) {
        return;
      }
      $this.toggleClass('favorite');
      if ($this.hasClass('favorite')) {
        lbTrackEvent("Customer_Tab_Interaction", "Favorite_Click");
      } else {
        lbTrackEvent("Customer_Tab_Interaction", "Defavorite_Click");
      }
      setTimeout(function() {
        var params;
        params = {
          'user_id': $this.closest('.user-row-container').data('id'),
          'favorite': $this.hasClass('favorite') ? 1 : 0
        };
        return $.ajax({
          url: '/ajax/update_member_favorite_status',
          type: "POST",
          data: params,
          success: function(data) {
            return lb_log("member changed favorite status");
          }
        });
      }, 2000);
    });
  };

  bindSelectMembersCheckbox = function() {
    $("input#select-all-club-members").on('change', function(e) {
      var visible_checkboxes;
      visible_checkboxes = $('#crm-tab .check-member').filter(':visible');
      if (visible_checkboxes.length > 0) {
        if ($(this).is(':checked')) {
          lbTrackEvent("Customer_Tab_Interaction", "Select_All_Customers");
          visible_checkboxes.prop('checked', true);
          window.number_of_selected_users = window.number_of_all_curr_users;
          window.current_selected_members = window.crm_all_users_ids.slice();
          window.is_crm_all_checked = true;
          return updateSelectedDisplay();
        } else {
          $('#crm-tab .check-member').prop('checked', false);
          window.number_of_selected_users = 0;
          window.current_selected_members = [];
          window.is_crm_all_checked = false;
          return updateSelectedDisplay();
        }
      } else {
        return $(this).prop('checked', false);
      }
    });
    $('#crm-tab').filter(':visible').on('change', '.check-member', function(e) {
      var index, usrId;
      usrId = $(this).closest('.user-row-container').data('id');
      if ($(this).is(':checked')) {
        lbTrackEvent("Customer_Tab_Interaction", "Select_Individual_Customer");
        window.current_selected_members.push(usrId);
      } else {
        index = window.current_selected_members.indexOf(usrId);
        window.current_selected_members.splice(index, 1);
      }
      return updateSelectedDisplay();
    });
    $('#top-members-send-selector').on('change', function(e) {
      if ($(this).val() === '0') {
        lbTrackEvent("Customer_Tab_Interaction", "Send_Message_Action_Top");
      } else if ($(this).val() === '1') {
        lbTrackEvent("Customer_Tab_Interaction", "Send_Reward_Action_Top");
      }
    });
    return $('#bottom-members-send-selector').on('change', function(e) {
      if ($(this).val() === '0') {
        lbTrackEvent("Customer_Tab_Interaction", "Send_Message_Action_Bottom");
      } else if ($(this).val() === '1') {
        lbTrackEvent("Customer_Tab_Interaction", "Send_Reward_Action_Bottom");
      }
    });
  };

  update_selected_members = function() {
    $('.choose-action-container .users-counter, #crm-general-message-lightbox .members-counter,  #crm-message-with-reward-lightbox.crm-tab .members-counter').text(window.current_selected_members.length);
    return $('#crm-message-with-reward-lightbox.crm-tab #message-with-reward-members-list, #crm-general-message-lightbox #general-message-members-list').val(window.current_selected_members);
  };

  clearAllSelected = function() {
    window.is_crm_all_checked = false;
    $("input#select-all-club-members").prop('checked', false);
    $('#crm-tab .check-member').prop('checked', false);
    window.current_selected_members = [];
    $('.select-overlay').show();
    return $('.choose-action-container').css({
      bottom: '-78px'
    });
  };

  updateSelectedDisplay = function() {
    if (window.current_selected_members.length > 0) {
      $('.choose-action-container .users-counter, #crm-general-message-lightbox .members-counter,  #crm-message-with-reward-lightbox.crm-tab .members-counter').text(window.current_selected_members.length);
      $('.select-overlay').hide();
      $('.choose-action-container').css({
        bottom: 0
      });
      return $('#crm-message-with-reward-lightbox.crm-tab #message-with-reward-members-list').val(window.current_selected_members);
    } else {
      $('.select-overlay').show();
      return $('.choose-action-container').css({
        bottom: '-78px'
      });
    }
  };

  bindBottomScroll = function() {
    if ($('.pagination').length) {
      $(window).scroll(function() {
        var url;
        url = $('.pagination .next_page').attr('href');
        if (url && $(window).scrollTop() > $(document).height() - $(window).height() - 50) {
          $('.pagination').text('Please Wait...');
          $('.loading-more-users').show();
          return $.getScript(url, function() {
            return $('.loading-more-users').hide();
          });
        }
      });
      return $(window).scroll();
    }
  };

  searchCrm = function(elm) {
    var autoComplete, counter, timeoutId;
    timeoutId = void 0;
    counter = 0;
    autoComplete = function(getQ) {
      var thisCounter;
      counter++;
      thisCounter = counter;
      clearTimeout(timeoutId);
      timeoutId = setTimeout((function() {
        var q;
        q = getQ();
        if (!(window.jqueryParams['search'] && window.jqueryParams['search'] === q)) {
          window.jqueryParams['search'] = q;
          sendRequestToServer();
        }
      }), 1000);
    };
    return autoComplete((function() {
      return $(elm).val();
    }));
  };

  sendRequestToServer = function() {
    $("#ajaxLoaderCrm").show();
    $.ajax({
      url: "/dashboard/customers",
      dataType: 'script',
      data: window.jqueryParams
    });
    return false;
  };

  handleSorting = function() {
    return $('.column-header:not(".checkbox-column-header")').on('click', function() {
      var _this;
      _this = $(this);
      if (_this.hasClass('current')) {
        if (_this.attr('data-isasc') === 'asc') {
          _this.attr('data-isasc', 'desc');
        } else {
          _this.attr('data-isasc', 'asc');
        }
      }
      $('.column-header:not(".checkbox-column-header")').removeClass('current');
      _this.addClass('current');
      window.jqueryParams['direction'] = _this.attr('data-isasc');
      window.jqueryParams['sort'] = _this.attr('data-sort');
      return sendRequestToServer();
    });
  };

  handleFiltering = function() {
    $(".filter-radio").on('ifClicked', function() {
      var _this, evnt;
      clearAllSelected();
      _this = $(this);
      evnt = _this.attr('data-lbtrack');
      if (evnt) {
        lbTrackEvent("Customer_Tab_Interaction", evnt);
      }
      if (_this.attr('data-isall')) {
        window.jqueryParams['filter'] = window.jqueryParams['filter'].replace(_this.attr('data-filter'), "");
        delete window.jqueryParams[_this.attr('data-sub')];
      } else {
        if (window.jqueryParams['filter'].indexOf(_this.attr('data-filter')) === -1) {
          window.jqueryParams['filter'] += _this.attr('data-filter');
        }
        window.jqueryParams[_this.attr('data-sub')] = _this.attr('data-val');
      }
      return sendRequestToServer();
    });
    return $('.reset-btn').on('click', function(e) {
      e.preventDefault();
      clearAllSelected();
      $('.radio-all').iCheck('check');
      $('.radio-all').iCheck('update');
      window.jqueryParams['filter'] = '';
      return sendRequestToServer();
    });
  };

  handleSearching = function() {
    return $('#crm-tab .search-field').on('keyup paste cut', function(e) {
      var $this;
      if (window.current_selected_members.length > 0) {
        clearAllSelected();
      }
      $this = $(this);
      return searchCrm($this);
    });
  };

  window.bindPlugins = function() {
    $('#crm-tab .filter-radio').iCheck({
      checkboxClass: 'iradio_lb3',
      radioClass: 'iradio_lb3',
      increaseArea: '0%'
    });
    $(window).on("bindSelectric:done", function() {
      window.messages_qtips = $(".ele-selectric-tooltip").qtip({
        position: {
          my: 'left center',
          at: 'right center',
          adjust: {
            x: 45,
            y: 3
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow selectric-qtip right-selectric-qtip'
        },
        show: {
          delay: 500
        }
      });
      return $("#crm-tab .ele-selectric-tooltip").qtip({
        position: {
          my: 'right center',
          at: 'left center',
          adjust: {
            x: -20
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow selectric-qtip'
        },
        show: {
          delay: 500
        }
      });
    });
    bindSelectric();
    $("#crm-tab .auto-chat-holder .question-mark").qtip({
      content: {
        text: "We'll automatically chat your customers after they visit and ask them to rate their experience"
      },
      position: {
        my: 'top left',
        at: 'bottom right',
        adjust: {
          y: 8,
          x: -37
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-engagement'
      }
    });
    $(".auto-chat-slider").slider({
      min: 0,
      max: 1,
      step: 1,
      value: gon.auto_chat,
      animate: 500,
      change: function(event, ui) {
        $(this).parents('.auto-chat-slider-holder').toggleClass('on', ui.value === 1);
        $(this).parents('.auto-chat-slider-holder').toggleClass('off', ui.value === 0);
        return $.ajax(Routes.dashboard_auto_chat_update_path(), {
          data: {
            auto_chat_enabled: ui.value
          },
          type: 'POST'
        });
      }
    });
    return $(window).on('userInfoLightboxUserStatusChanged', function(e, params) {
      console.log('userInfoLightboxUserStatusChanged');
      return $(".members-list [data-id='" + params.user_id + "'] .status-holder").text(params.status);
    });
  };

  bindSignalsFromUserInfo = function() {
    return $(window).on('signalAddedPunches', function(e, data) {
      var $ele, $punches_holder;
      $ele = $("div[data-id=" + data.user_id + "]");
      $punches_holder = $ele.find(".punches-holder");
      return $punches_holder.text(data.total_punches);
    });
  };

  window.initDashboardTabCRM = function() {
    window.jqueryParams = {
      'filter': ''
    };
    window.number_of_all_curr_users = gon.crm_total_user_size;
    window.current_selected_members = [];
    window.crm_all_users_ids = gon.club_users_id;
    window.is_crm_all_checked = false;
    bindPlugins();
    handleSorting();
    handleFiltering();
    handleSearching();
    bindActionSelectors();
    initMessageLightboxes();
    bindMessageSendLightboxes();
    bindFavoriteBtns();
    bindBottomScroll();
    bindSelectMembersCheckbox();
    bindSignalsFromUserInfo();
    if (gon.no_users) {
      return $('.no-members-container').show('fade');
    }
  };

}).call(this);
(function() {
  var changeEnableInstoreMsgSwitcher, charsCounter, editInstoreMsg, goBackScreen, saveEditedInstoreMsg;

  editInstoreMsg = function() {
    return $('#the-beacon-tab .edit-link').on('click', function(e) {
      e.preventDefault();
      $(this).addClass('hide');
      $('#the-beacon-tab .disabled-auto-msg').addClass('hide');
      $('.instore-msg-wrapper, .save-btn').removeClass('hide').addClass('display');
      $('#the-beacon-tab .go-back').removeClass('hide').addClass('display');
      $('#the-beacon-tab .beacon-tab-switcher').removeClass('display').addClass('hide');
    });
  };

  changeEnableInstoreMsgSwitcher = function() {
    return $('#the-beacon-tab .switcher-holder').on('click', function(e) {
      var switchedOn;
      e.preventDefault();
      switchedOn = $(this).hasClass('off');
      return $.ajax({
        type: "GET",
        url: '/beacon_tab/ajax_change_enable_instore_msg',
        dataType: 'json',
        data: {
          switched_on: switchedOn
        },
        success: function() {
          var editLink, savedMsg;
          editLink = $('.auto-text-info .edit-link');
          savedMsg = $('.auto-text-info .disabled-auto-msg');
          if (switchedOn) {
            editLink.removeClass('hide').addClass('display');
            savedMsg.removeClass('disabled');
            if ($('#instore_msg_hidden_tag').val() !== void 0) {
              $('.disabled-auto-msg').html($('#instore_msg_hidden_tag').val());
            }
            $('.auto-text-info .text').html('YOUR AUTOMATIC WELCOME MESSAGE:');
            $('.switcher-holder, .switcher-handle').removeClass('off').addClass('on');
            return lbTrackEvent("Beacon_Tab_Interaction", "Message_On_Click");
          } else {
            editLink.removeClass('display').addClass('hide');
            savedMsg.addClass('disabled');
            $('.disabled-auto-msg').html('Customers will be detected in your business but will not receive a Welcome Message.');
            $('.auto-text-info .text').html('AUTOMATIC CHAT DISABLED');
            $('.switcher-holder, .switcher-handle').removeClass('on').addClass('off');
            return lbTrackEvent("Beacon_Tab_Interaction", "Message_Off_Click");
          }
        }
      });
    });
  };

  saveEditedInstoreMsg = function() {
    return $('#the-beacon-tab .save-btn').on('click', function(e) {
      var saveBtn, savedAutoMsg;
      e.preventDefault();
      saveBtn = $(this);
      savedAutoMsg = $('#the-beacon-tab .instore-msg-field').val();
      if (savedAutoMsg.replace(/\s/g, '').length > 3) {
        return $.ajax({
          type: "POST",
          url: Routes.dashboard_ajax_automate_update_message_path(),
          dataType: 'json',
          data: {
            saved_auto_msg: savedAutoMsg
          },
          success: function() {
            saveBtn.removeClass('display').addClass('hide');
            $('#the-beacon-tab .go-back').removeClass('dispaly').addClass('hide');
            $('#the-beacon-tab .instore-msg-wrapper').removeClass('display').addClass('hide');
            $('#the-beacon-tab .disabled-auto-msg').html(savedAutoMsg).removeClass('hide').addClass('display');
            $('#the-beacon-tab .auto-text-info .edit-link').removeClass('hide').addClass('display');
            return lbTrackEvent("Beacon_Tab_Interaction", "Welcome_Message_Save");
          }
        });
      }
    });
  };

  charsCounter = function() {
    return $('#the-beacon-tab .instore-msg-field').on('change paste keyup', function(e) {
      var charsAmount;
      $(this).css('color', '#374448');
      charsAmount = $(this).val().trim().length;
      if (charsAmount < 61) {
        $('#the-beacon-tab .c-count').html(charsAmount);
        if (charsAmount > 3) {
          return $('#the-beacon-tab .save-btn').attr('disabled', false).removeClass('disabled');
        } else {
          return $('#the-beacon-tab .save-btn').attr('disabled', true).addClass('disabled');
        }
      }
    });
  };

  goBackScreen = function() {
    return $('#the-beacon-tab .go-back').on('click', function(e) {
      $(this).removeClass('display').addClass('hide');
      $('#the-beacon-tab .save-btn').removeClass('display').addClass('hide');
      $('#the-beacon-tab .instore-msg-wrapper').removeClass('display').addClass('hide');
      $('#the-beacon-tab .beacon-tab-switcher').removeClass('hide').addClass('display');
      $('#the-beacon-tab .disabled-auto-msg').removeClass('hide').addClass('display');
      return $('#the-beacon-tab .edit-link').removeClass('hide').addClass('display');
    });
  };

  $(function() {
    editInstoreMsg();
    changeEnableInstoreMsgSwitcher();
    saveEditedInstoreMsg();
    charsCounter();
    return goBackScreen();
  });

}).call(this);
(function() {
  var changeMsgSwitcher, changeMsgVisibility, closeMsg, closePreview, displayMobilePreview, displayStatsPercentage, editMsg, initEditTinymce, replacePreviewMsg, resetMsg, saveGoogleAnalytics, saveMsg;

  saveGoogleAnalytics = function(lbTrackEvent, event) {
    event = lbTrackEvent + event;
    return window.lbTrackEvent("Cruise_Control_Interaction", event);
  };

  window.openUpgradeLightbox = function(runMethod) {
    if (runMethod) {
      return $.fancybox({
        type: 'ajax',
        href: Routes.cruise_control_upgrade_pro_lightbox_path(),
        padding: 0,
        closeBtn: true,
        scrolling: 'no',
        autoCenter: true,
        closeClick: false,
        helpers: {
          overlay: {
            closeClick: false
          }
        },
        wrapCSS: 'fancybox-skin-no-box',
        tpl: {
          closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
        },
        afterClose: function() {
          if (gon.user_plan === "Free") {
            saveGoogleAnalytics("Non_Premium_Lightbox_" + "Close");
          }
          if (gon.user_plan === "Basic") {
            return saveGoogleAnalytics("Starter_Lightbox_" + "Close");
          }
        }
      });
    }
  };

  changeMsgSwitcher = function(chosenMsgId, chosenMsgType, switcher, wasSaved) {
    if (!(switcher === void 0 || chosenMsgType === void 0 || chosenMsgId === void 0)) {
      return $.ajax({
        type: "GET",
        url: Routes.ajax_update_off_cc_messages_path(),
        dataType: 'json',
        data: {
          off_msg_id: chosenMsgId,
          off_msg_type: chosenMsgType
        }
      }).success(function(data) {
        var event, lbCcMsg;
        lbCcMsg = switcher.closest('.cc-line').data('lb-track-event');
        if (switcher.hasClass('on')) {
          if (!wasSaved) {
            switcher.removeClass('on').addClass('off');
            switcher.closest('.cc-line').children('.stats').addClass('off');
            event = "Off";
            return saveGoogleAnalytics(lbCcMsg, event);
          }
        } else {
          switcher.removeClass('off').addClass('on');
          switcher.closest('.cc-line').children('.stats').removeClass('off');
          event = "On";
          return saveGoogleAnalytics(lbCcMsg, event);
        }
      });
    }
  };

  displayStatsPercentage = function() {
    return $('.label.triangle').hover((function() {
      return $(this).children('.cc-tooltip').toggleClass('display');
    }));
  };

  changeMsgVisibility = function() {
    return $('.switcher-holder').on('click', function(e) {
      var chosenMsgId, chosenMsgType, switcher;
      e.preventDefault();
      switcher = $(this);
      chosenMsgId = switcher.closest('.cc-line').data('cc-id');
      chosenMsgType = switcher.closest('.cc-line').data('cc-type');
      return changeMsgSwitcher(chosenMsgId, chosenMsgType, switcher, false);
    });
  };

  replacePreviewMsg = function(msgText, msg) {
    var i, len, possibleTags, replacedTag, tag;
    if (msgText !== void 0) {
      msgText = msgText.replace(/&nbsp;/g, " ").replace(/(^\s+|\s+$)/g, '');
      possibleTags = ['<img src="/assets/edit-tags/tags_fn.png" class="flok_tag_elem" data-tag="flok_tag_fn" height="22"></img>', '<img src="/assets/edit-tags/tags_bn.png" class="flok_tag_elem" data-tag="flok_tag_bn" height="22"></img>', '<img src="/assets/edit-tags/tags_ct.png" class="flok_tag_elem" data-tag="flok_tag_ct" height="22"></img>', '<img src="/assets/edit-tags/tags_ex.png" class="flok_tag_elem" data-tag="flok_tag_ex" height="22"></img>', '<img src="/assets/edit-tags/tags_rw.png" class="flok_tag_elem" data-tag="flok_tag_rw" height="22"></img>', '<img class="flok_tag_elem" style="opacity: 1;" src="../assets/edit-tags/tags_ex.png" alt="" height="22" data-tag="flok_tag_ex" />', '<img class="flok_tag_elem" style="opacity: 1;" src="../assets/edit-tags/tags_ct.png" alt="" height="22" data-tag="flok_tag_ct" />', '<img class="flok_tag_elem" style="opacity: 1;" src="../assets/edit-tags/tags_bn.png" alt="" height="22" data-tag="flok_tag_bn" />', '<img class="flok_tag_elem" style="opacity: 1;" src="../assets/edit-tags/tags_fn.png" alt="" height="22" data-tag="flok_tag_fn" />', '<img class="flok_tag_elem" style="opacity: 1;" src="../assets/edit-tags/tags_rw.png" alt="" height="22" data-tag="flok_tag_rw" />'];
      for (i = 0, len = possibleTags.length; i < len; i++) {
        tag = possibleTags[i];
        if (msgText.includes(tag)) {
          if (tag.includes("flok_tag_fn")) {
            replacedTag = ' <first name> ';
          }
          if (tag.includes("flok_tag_bn")) {
            replacedTag = ' ' + gon.business_name + ' ';
          }
          if (tag.includes("flok_tag_ex")) {
            replacedTag = ' <reward expiration> ';
          }
          if (tag.includes("flok_tag_rw")) {
            if (msg === "birthday-chat") {
              replacedTag = ' ' + gon.birthday_reward + ' ';
            }
            if (msg === "welcome-reward-reminder") {
              replacedTag = ' ' + gon.welcome_reward + ' ';
            }
            if (msg === "reward-expiration-reminder") {
              replacedTag = ' <reward> ';
            }
            if (msg === "location-based-reminder") {
              replacedTag = ' <reward> ';
            }
          }
          if (replacedTag !== void 0) {
            msgText = msgText.replace(tag, replacedTag);
          }
        }
      }
      return $('#cc-mobile-preview').find('.msg').text(msgText);
    }
  };

  displayMobilePreview = function() {
    return $('.links .preview').on('click', function(e) {
      var ed, edId, event, lbCcMsg, mobileMsgContent, msgName, previewBtn;
      e.preventDefault();
      previewBtn = $(this);
      msgName = previewBtn.parents('.cc-line').attr('id');
      edId = $(this).parent().siblings('.edit-section').find('textarea').attr('id');
      ed = tinymce.get(edId);
      if (ed === null) {
        mobileMsgContent = previewBtn.closest('.cc-line').find('textarea').val();
      } else {
        mobileMsgContent = ed.getContent();
      }
      if (mobileMsgContent === void 0) {
        mobileMsgContent = previewBtn.data('mobile-content');
      }
      replacePreviewMsg(mobileMsgContent, msgName);
      $('#cc-mobile-preview').toggleClass('display');
      if ($(this).closest('.cc-line').is('#reward-expiration-reminder')) {
        $('#cc-mobile-preview .tip').addClass('last-cc-line-tip');
      } else {
        $('#cc-mobile-preview .tip').removeClass('last-cc-line-tip');
      }
      $('#cc-mobile-preview').position({
        of: $(this),
        my: 'left+10% top-34%',
        at: 'right bottom'
      });
      lbCcMsg = previewBtn.closest('.cc-line').data('lb-track-event');
      event = "Preview";
      if ($('#cc-mobile-preview').hasClass('display')) {
        return saveGoogleAnalytics(lbCcMsg, event);
      }
    });
  };

  closePreview = function() {
    return $('#cc-mobile-preview-bg').on('click', function(e) {
      e.preventDefault();
      if ($('#cc-mobile-preview').hasClass('display')) {
        return $('#cc-mobile-preview').removeClass('display');
      }
    });
  };

  initEditTinymce = function(toolbarTags, textArea) {
    return tinymce.init({
      selector: '.cc-edit-textarea #' + textArea,
      toolbar: toolbarTags,
      menubar: false,
      skin: 'flok',
      paste_as_text: true,
      body_class: 'tinymce-tags-class',
      force_br_newlines: false,
      force_p_newlines: false,
      forced_root_block: '',
      keep_styles: false,
      statusbar: false,
      plugins: 'customem',
      content_css: "/assets/dashboard/flok_tags.css",
      setup: function(ed) {
        ed.on('init', function(evt) {
          var _fleditor, _fltoolbar, elemToShow;
          _fltoolbar = $(evt.target.editorContainer).find('>.mce-container-body >.mce-toolbar-grp');
          _fleditor = $(evt.target.editorContainer).find('>.mce-container-body >.mce-edit-area');
          _fltoolbar.detach().insertAfter(_fleditor);
          elemToShow = tinyMCE.activeEditor.dom.select(".flok_tag_elem");
          if (elemToShow.length > 0) {
            tinyMCE.activeEditor.dom.setStyle(elemToShow, 'opacity', '1');
            return ed.plugins.customem.updateOnChange();
          }
        });
        ed.on("click", function(e) {
          var curr_wrap_elem, tagName;
          if (e.target.className === "flok_tag_elem") {
            $(e.target).fadeOut();
            $(e.target).remove();
            tagName = $(e.target).data('tag');
            saveGoogleAnalytics('tag_removed_', tagName);
            curr_wrap_elem = $("#" + tinyMCE.activeEditor.id).closest(".cc-line");
            return curr_wrap_elem.find("#" + $(e.target).data("tag")).show().css('opacity', '1');
          }
        });
        return ed.on('KeyDown', function(e) {
          if (e.keyCode === 8 || e.keyCode === 46 || e.keyCode === 13) {
            ed.plugins.customem.updateOnChange();
          }
          if (e.ctrlKey || e.metaKey) {
            if (String.fromCharCode(e.which).toLowerCase() === 'z') {
              return ed.plugins.customem.updateOnChange();
            }
          }
        });
      }
    });
  };

  editMsg = function() {
    return $('.links .edit').on('click', function(e) {
      var chosenMsg, chosenMsgId, chosenMsgType, editBtn, textArea;
      e.preventDefault;
      editBtn = $(this);
      chosenMsg = editBtn.parents('.cc-line').attr('id');
      chosenMsgId = editBtn.parents('.cc-line').data('cc-id');
      chosenMsgType = editBtn.parents('.cc-line').data('cc-type');
      textArea = editBtn.parent().siblings('.edit-section').find('textarea').attr('id');
      editBtn.parent().siblings('.edit-section, .win-back-banner').addClass('display');
      editBtn.parent().siblings('.editing-links').addClass('display');
      editBtn.addClass('hide');
      switch (chosenMsg) {
        case "rating-request-chat":
          return initEditTinymce(false, textArea);
        case "welcome-chat":
          return initEditTinymce(false, textArea);
        case "welcome-reward-reminder":
          if (editBtn.data('has-expiration') === true) {
            return initEditTinymce('flok_tag_fn | flok_tag_ex | flok_tag_rw', textArea);
          } else {
            return initEditTinymce('flok_tag_fn | flok_tag_rw', textArea);
          }
          break;
        case "improve":
          return initEditTinymce('flok_tag_fn | flok_tag_bn', textArea);
        case "location-based-reminder":
          return initEditTinymce('flok_tag_fn | flok_tag_bn | flok_tag_rw', textArea);
        case "win-back-chat":
          return initEditTinymce('flok_tag_fn | flok_tag_bn', textArea);
        case "welcome-reward-reminder":
          return initEditTinymce('flok_tag_fn | flok_tag_rw | flok_tag_ex', textArea);
        case "reward-expiration-reminder":
          return initEditTinymce('flok_tag_fn | flok_tag_bn | flok_tag_ex | flok_tag_rw', textArea);
        case "birthday-chat":
          if (editBtn.data('has-reward') === true) {
            return initEditTinymce('flok_tag_fn | flok_tag_rw', textArea);
          } else {
            return initEditTinymce('flok_tag_fn', textArea);
          }
      }
    });
  };

  closeMsg = function() {
    return $('.editing-links .cancel').on('click', function(e) {
      var cancelBtn, ccId, ed, previousContent;
      e.preventDefault();
      cancelBtn = $(this);
      cancelBtn.parents('.cc-line').find('.edit-section').removeClass('display');
      cancelBtn.parents('.cc-line').find('.win-back-banner').removeClass('display');
      cancelBtn.parents('.cc-line').find('.editing-links').removeClass('display');
      cancelBtn.parent().siblings('.links').children('.edit').removeClass('hide');
      ccId = cancelBtn.parent().siblings('.edit-section').find('textarea').attr('id');
      previousContent = cancelBtn.data('cancel-text');
      ed = tinymce.get(ccId);
      ed.setContent(previousContent);
      return ed.remove();
    });
  };

  resetMsg = function() {
    return $('.editing-links .reset').on('click', function(e) {
      var ccId, defText, ed, elemToShow;
      ccId = $(this).parent().siblings('.edit-section').find('textarea').attr('id');
      defText = $(this).data('reset-text');
      ed = tinymce.get(ccId);
      ed.setContent(defText);
      elemToShow = ed.dom.select(".flok_tag_elem");
      if (elemToShow.length > 0) {
        ed.dom.setStyle(elemToShow, 'opacity', '1');
        return ed.plugins.customem.updateOnChange();
      }
    });
  };

  saveMsg = function() {
    return $('.save-btn').on('click', function(e) {
      var ccDays, ccId, ccOffset, ccType, chosenMsg, ed, editorContent, editorId, i, index, len, tagType, value;
      e.preventDefault();
      if ($('.cc-edit-textarea .empty-error').hasClass('empty-error')) {
        $('.cc-edit-textarea .empty-error').removeClass('empty-error');
      }
      chosenMsg = $(this);
      ccId = chosenMsg.parent().siblings('.edit-section').find('textarea').attr('id');
      editorId = chosenMsg.data('editor-id');
      ed = tinymce.get(ccId);
      editorContent = ed.getContent().replace(/&nbsp;/g, " ").replace(/(^\s+|\s+$)/g, '');
      if (!(editorContent.length < 3)) {
        editorContent = jQuery.parseHTML(editorContent);
        ccType = chosenMsg.closest('.cc-line').data('cc-type');
        ccId = chosenMsg.closest('.cc-line').data('cc-id');
        ccDays = chosenMsg.parents('.cc-line').find('.selectric-tooltip').val();
        if (ccDays === void 0) {
          ccDays = 0;
        }
        if (ccId === 6) {
          ccOffset = "offset_winback";
        }
        if (ccId === 2) {
          ccOffset = "offset_improve";
        }
        for (index = i = 0, len = editorContent.length; i < len; index = ++i) {
          value = editorContent[index];
          tagType = $(value).data('tag');
          if (tagType !== void 0) {
            switch (tagType) {
              case "flok_tag_fn":
                value = "{FIRST_NAME}";
                break;
              case "flok_tag_bn":
                value = "{BUSINESS_NAME}";
                break;
              case "flok_tag_ct":
                value = "{BUSINESS_CITY}";
                break;
              case "flok_tag_rw":
                value = "{REWARD}";
                break;
              case "flok_tag_ex":
                value = "{REWARD_EXPIRATION}";
            }
            editorContent[index] = value;
          } else {
            editorContent[index] = $(value).text();
          }
        }
        return $.ajax({
          type: "GET",
          url: Routes.ajax_update_cc_edited_msg_path(),
          dataType: 'json',
          data: {
            cc_type: ccType,
            cc_id: ccId,
            cc_dropdown_days: ccDays.length > 0 ? ccDays : void 0,
            cc_offset_type: ccOffset !== void 0 ? ccOffset : void 0,
            edited_text: editorContent
          }
        }).success(function(data) {
          var event, lbCcMsg, msgFullId, switcher;
          chosenMsg.parents('.cc-line').find('.edit-section').removeClass('display');
          chosenMsg.parents('.cc-line').find('.editing-links').removeClass('display');
          chosenMsg.parents('.cc-line').find('.win-back-banner').removeClass('display');
          chosenMsg.parent().siblings('.links').children('.edit').removeClass('hide');
          lbCcMsg = chosenMsg.parents('.cc-line').data('lb-track-event');
          event = "Save";
          switcher = chosenMsg.parents('.cc-line').find('.switcher-holder');
          if (!switcher.hasClass('on')) {
            changeMsgSwitcher(ccId, ccType, switcher, true);
          }
          msgFullId = chosenMsg.parents('.cc-line').attr('id');
          replacePreviewMsg(editorContent[0], msgFullId);
          return saveGoogleAnalytics(lbCcMsg, event);
        });
      } else {
        return chosenMsg.closest('.cc-line').find('.mce-edit-area').addClass('empty-error');
      }
    });
  };

  window.initDashboardTabCruiseControl = function() {
    changeMsgVisibility();
    displayMobilePreview();
    displayStatsPercentage();
    closePreview();
    editMsg();
    resetMsg();
    closeMsg();
    saveMsg();
    if (gon.user_plan === "Free" || gon.user_plan === "Basic") {
      return setTimeout(function() {
        openUpgradeLightbox(true);
        if (gon.user_plan === "Free") {
          saveGoogleAnalytics("Non_Premium_Lightbox_" + "Show");
        }
        if (gon.user_plan === "Basic") {
          return saveGoogleAnalytics("Starter_Lightbox_" + "Show");
        }
      }, 2000);
    }
  };

}).call(this);
(function() {
  var clearMainForm, initCreditTokenValidations, initPackagesPage, reloadPackageTabContents, selectPage, selectPage1andFillFromForm, showPurchasesQtip;

  $.validator.addMethod('biggerThan', (function(value, ele, target) {
    return parseFloat(value) > parseFloat($(ele).parents('form').find(target).val());
  }), 'Package price must be less than the regular price');

  initCreditTokenValidations = function() {
    return $("#create-credit-token-form").validate({
      errorClass: 'validation-error-tip',
      errorPlacement: function(error, element) {
        var $vf;
        $vf = $(element).parents(".validate-field");
        return $vf.find(".validation-error-txt").text($(error).text());
      },
      highlight: function(element, errorClass, validClass) {
        var $vf;
        $vf = $(element).parents(".validate-field");
        return $vf.addClass('error').removeClass('success');
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").removeClass('error').addClass('success');
      },
      rules: {
        credit: {
          required: true,
          digits: true
        },
        reward: {
          required: true,
          minlength: 5,
          maxlength: 60
        },
        price: {
          required: true,
          number: true
        },
        old_price: {
          required: true,
          biggerThan: '.price-field',
          number: true
        }
      }
    });
  };

  selectPage1andFillFromForm = function() {
    var credit, old_price, price, reward;
    $("#packages-tab .package-page-1").removeClass('sample-package');
    credit = $("#packages-tab #create-credit-token-form .credit-field").val();
    reward = $("#packages-tab #create-credit-token-form .reward-field").val();
    price = parseFloat($("#packages-tab #create-credit-token-form .price-field").val());
    price = parseFloat(Math.round(price * 100) / 100).toFixed(2);
    old_price = parseFloat($("#packages-tab #create-credit-token-form .old-price-field").val());
    old_price = parseFloat(Math.round(old_price * 100) / 100).toFixed(2);
    $("#packages-tab .package-page-1 .pack-desc-holder .descript").text(credit + " x " + reward);
    $("#packages-tab .package-page-1 .pack-desc-holder .pack-price-block .price ").text("$" + price);
    $("#packages-tab .package-page-1 .pack-desc-holder .regular-price-block .price ").text("$" + old_price);
    return selectPage(1);
  };

  showPurchasesQtip = function() {
    return $('.purchases-tooltip').each((function() {
      var qtipSelector, tokenId;
      qtipSelector = $(this);
      tokenId = qtipSelector.siblings('.buttons-block').children('a').data('tid');
      if (typeof displayList !== 'undefined') {
        return window.displayList(qtipSelector, false, "", 'purchased_packages_by_users', tokenId);
      }
    }));
  };

  clearMainForm = function() {
    $("#packages-tab .credit-field").val("").trigger('change');
    $("#packages-tab .reward-field").val("").trigger('change');
    $("#packages-tab .price-field").val("").trigger('change');
    return $("#packages-tab .old-price-field").val("").trigger('change');
  };

  selectPage = function(p) {
    return $("#packages-tab .package-page-holder").removeClass('page-1-sel page-2-sel page-3-sel').addClass("page-" + p + "-sel");
  };

  initPackagesPage = function() {
    initCreditTokenValidations();
    $("#packages-tab .save-review-btn").on('click', function(e) {
      if ($("#create-credit-token-form").valid()) {
        return selectPage1andFillFromForm();
      }
    });
    $("#packages-tab .package-page-1 .edit-btn, #packages-tab .package-page-1 .pack-desc-holder").on('click', function(e) {
      clearMainForm();
      $("#packages-tab .js-back-btn").data('backstep', 1);
      return selectPage(2);
    });
    $("#packages-tab .package-page-3 .create-pkg").on('click', function(e) {
      e.preventDefault();
      clearMainForm();
      $("#packages-tab .js-back-btn").data('backstep', 3);
      return selectPage(2);
    });
    $('#packages-tab .js-count-chars').on('change paste keyup', function() {
      var $f;
      $f = $(this).parent().find('.js-c-count');
      return $f.text($(this).val().length);
    });
    $('#packages-tab .js-c-count').text($('#packages-tab .js-count-chars').val().length);
    $("#packages-tab .package-page-1 .publish-pkg").on('click', function(e) {
      e.preventDefault();
      if ($(this).parents(".package-page-1").hasClass('sample-package')) {
        return;
      }
      showBoxLoading("#packages-tab .cover-img-holder", {
        text: 'Publishing'
      });
      return $("#create-credit-token-form").submit();
    });
    $("#packages-tab  .redemption-tooltip").each(function() {
      return $(this).qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 8,
            x: 75
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-stats qtip-stats-no-width',
          width: 200
        }
      });
    });
    $("#packages-tab .unlock-icn").on('click', function(e) {
      var price, tid;
      e.preventDefault();
      tid = $(this).data('tid');
      price = $(this).data('price');
      return showSearchCustomersTip($(this).parent(), tid, price, "packages-tab-search-customer-" + tid);
    });
    $("#packages-tab .duplicate-icn").on('click', function(e) {
      var token_id;
      e.preventDefault();
      token_id = $(this).data('tid');
      showBoxLoading("#packages-tab .package-list-page", {
        text: ''
      });
      return $.get("/ajax/ajax_send_as_push_to_all_users?token_id=" + token_id, function(data) {
        return showSuccessPushNotification();
      }).always(function() {
        return hideBoxLoading();
      }).fail(function() {
        return alert("An error as ocurred");
      });
    });
    $("#packages-tab .js-back-btn").on('click', function(e) {
      e.preventDefault();
      return selectPage($(this).data('backstep'));
    });
    $("#packages-tab .tip2").each(function() {
      var value;
      value = $(this).next('.tooltip:hidden').html();
      return $(this).qtip({
        position: {
          my: 'center left',
          at: 'center right',
          adjust: {
            x: 20
          }
        },
        content: {
          text: value
        },
        style: {
          classes: ' qtip-packages-2 ',
          tip: false
        },
        hide: {
          event: 'mouseleave click'
        }
      });
    });
    return $("#packages-tab .tip3").each(function() {
      return $(this).qtip({
        position: {
          my: 'center left',
          at: 'center right',
          adjust: {
            x: 20
          }
        },
        style: {
          classes: ' qtip-packages-3 ',
          tip: false
        }
      });
    });
  };

  reloadPackageTabContents = function() {
    return $.get('/dashboard/packages?page_only=1', function(data) {
      return $("#packages-tab").hide('fade', function() {
        $(this).replaceWith(data);
        return $(this).show('fade', function() {
          $(this).addClass("loaded-" + (++packages_tab_load_count));
          initPackagesPage();
          hideBoxLoading();
          return showPurchasesQtip();
        });
      });
    });
  };

  window.initDashboardTabPackages = function() {
    initPackagesPage();
    window.packages_tab_load_count = 1;
    $(window).on('DeletePackageLightboxPackageDeleted', function(e) {
      return reloadPackageTabContents();
    });
    $(document).on('ajax:success', '#create-credit-token-form', function(event, data) {
      return reloadPackageTabContents();
    });
    $(document).on('ajax:error', '#create-credit-token-form', function(event, data) {
      return hideBoxLoading();
    });
    return showPurchasesQtip();
  };

}).call(this);
(function() {
  var activilySelectPage, bindBottomNav, bindGmailContactsButton, bindMailingListExcelForm, bindSocialButtons, cscope, currentTemplateSelected, duplicateRegularCampaign, editRegularCampaignDraft, hideTextEditor, initEmailCampaignPreview, initEmailFormOnChange, initRegularPageScopeVars, initTextEditor, isEmailFormDraft, regularMailSelectPage, reloadListAndClearForm, resetEmailForm, saveEmailTemplateType, saveEmailTextArea, setEmailImageChanged, setListCampaignsVisibility, showTextEditor, submitEmailCampaignAsCampaign, submitEmailCampaignAsDraft, submitEmailCampaignAsSendLater, submitRegularForm, updateMailingMethodPage;

  cscope = this;

  initRegularPageScopeVars = function() {
    cscope.regular_form = $("form#new_email_campaign");
    cscope.regular_form_id = cscope.regular_form.find(".id");
    cscope.regular_form_is_draft_field = cscope.regular_form.find("#is-draft-field");
    cscope.regular_form_template_type_radio = cscope.regular_form.find("input.template_type-radio[type=radio]");
    cscope.regular_form_mailing_method_radio = cscope.regular_form.find("input.mailing-method-radio[type=radio]");
    cscope.regular_form_image_field = cscope.regular_form.find(".email-image-field");
    cscope.regular_form_image_link_field = cscope.regular_form.find(".email-image-link");
    cscope.regular_form_email_body = cscope.regular_form.find(".email-body");
    cscope.regular_form_email_subject = cscope.regular_form.find(".email-subject");
    cscope.regular_form_template_type_radio_value = function() {
      return parseInt(cscope.regular_form_template_type_radio.filter(":checked").val());
    };
    cscope.regular_form_mailing_method_value = function() {
      return parseInt(cscope.regular_form_mailing_method_radio.filter(":checked").val());
    };
    cscope.current_form_email_image = null;
    return window.cscope = cscope;
  };

  updateMailingMethodPage = function() {
    console.log("cscope.regular_form_mailing_method_value()");
    console.log(cscope.regular_form_mailing_method_value());
    $("#regular-emails-tab .saved-email-block").toggleClass('hidden', cscope.regular_form_mailing_method_value() !== 0);
    return $(".bottom-nav .next-btn").toggleClass('disabled', isNaN(cscope.regular_form_mailing_method_value()));
  };

  activilySelectPage = function(p) {
    var i, j, len, ref, s, v;
    if (p === 5) {
      $("#regular-emails-tab  iframe.final-preview").attr('src', constructIframeEmailCampaignParams());
    }
    if (p === 4) {
      hideTextEditor();
    }
    ref = [1, 2, 3, 4, 5];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      $("#regular-emails-tab").toggleClass("sel-" + i, p === i);
    }
    $("#regular-emails-tab .bottom-nav").toggleClass('disable-send-buttons', !checkRegularFinishAndSendValidation(true));
    if (p > 1) {
      $(".regular-mail-nav .page-" + (p - 1)).addClass('visited');
    }
    if (p === 3 && window.currentRePage === 2) {
      lbTrackEvent("Email_Interaction", "Regular_Selects_" + (currentTemplateSelected(false)));
    }
    if (p === 4 && window.currentRePage === 3) {
      v = currentTemplateSelected();
      s = v === 1 ? "Club_List" : "Saved_List";
      lbTrackEvent("Email_Interaction", "Regular_Selects_" + (currentTemplateSelected(false)));
    }
    if (p === 4) {
      setTimeout(function() {
        $("#regular-emails-tab .regular-page-1").css("display", 'none');
        $("#regular-emails-tab .regular-page-4").css("position", 'relative');
        $("#regular-emails-tab .regular-page").css("margin-top", '0');
        return console.log("SETTNIG ");
      }, 1000);
    }
    if (window.currentRePage === 4) {
      $("#regular-emails-tab .regular-page-1").css("display", 'block');
      $("#regular-emails-tab .regular-page-4").css("position", 'absolute');
      $("#regular-emails-tab .regular-page").css("margin-top", '');
    }
    $("#regular-emails-tab .error").removeClass('error');
    $(".bottom-nav .next-btn").toggleClass('disabled', p === 3 && isNaN(cscope.regular_form_mailing_method_value()));
    return window.currentRePage = p;
  };

  regularMailSelectPage = function(p) {
    console.log(" p => " + p + " ");
    if (p === 5 && currentRePage === 4 && !checkRegularEditMailPageValidation()) {
      return;
    }
    if (p === 4 && currentRePage === 3 && !checkRegularMailingListPageValidations()) {
      return;
    }
    $("#regular-emails-tab .main-page-header,#regular-emails-tab .email-campaigns-holder").toggleClass('transition1', p !== 1);
    $("#regular-emails-tab .bottom-nav").toggleClass('not-showing', p === 1);
    if ($(".bottom-upgrade-banner").length > 0) {
      if (p === 1) {
        $(".bottom-upgrade-banner").show('fade');
      } else {
        $(".bottom-upgrade-banner").hide('fade');
      }
    }
    $("#regular-emails-tab .bottom-nav").toggleClass('show-preview-btn', p === 4);
    $("#regular-emails-tab .bottom-nav").toggleClass('show-send-buttons', p === 5);
    $("#regular-emails-tab .bottom-nav").toggleClass('show-next', p < 5);
    $("#content-2").toggleClass('limit-height-for-regular', p !== 1 && p !== 4);
    if (currentRePage === 4) {
      showBoxLoading(".image-holder-filled", {
        text: "Saving..."
      });
      hideTextEditor();
      if (p === 5) {
        submitEmailCampaignAsDraft(function() {
          return activilySelectPage(p);
        });
        return;
      } else {
        submitEmailCampaignAsDraft();
      }
    }
    return activilySelectPage(p);
  };

  window.checkRegularEmailBodyValidation = function(noshow) {
    var error1;
    if (noshow == null) {
      noshow = false;
    }
    error1 = cscope.regular_form_email_body.val().length < 4;
    if (!noshow) {
      cscope.regular_form_email_body.parents(".textarea-container").toggleClass('error', error1);
    }
    console.log("error1 => " + error1);
    return !error1;
  };

  window.checkRegularEmailImageValidation = function(noshow) {
    var is_valid;
    if (noshow == null) {
      noshow = false;
    }
    if (cscope.regular_form_template_type_radio_value() !== 1) {
      return true;
    }
    is_valid = !is_blank($("#email-image-preview").attr("src"));
    if (is_valid) {
      return is_valid;
    }
    if (!noshow) {
      $(".image-holder-empty").toggleClass('error', !is_valid);
    }
    return is_valid;
  };

  window.checkRegularEditMailPageValidation = function(noshow) {
    var r;
    if (noshow == null) {
      noshow = false;
    }
    r = checkRegularEmailBodyValidation(noshow) + checkRegularEmailImageValidation(noshow);
    console.log("checkRegularEditMailPageValidation = > " + r);
    return r === 2;
  };

  window.checkRegularMailingListPageValidations = function(noshow) {
    var r;
    if (noshow == null) {
      noshow = false;
    }
    r = !isNaN(cscope.regular_form_mailing_method_value());
    if (r) {
      r = !(cscope.regular_form_mailing_method_value() === 1 && parseInt($(".radio-mailing-club-members .members-count").text()) === 0);
    }
    if (r) {
      r = !(cscope.regular_form_mailing_method_value() === 0 && (parseInt($(".radio-mailing-club-members .members-count").text()) === parseInt($(".radio-mailing-saved-list .saved-list").text())));
    }
    if (!noshow) {
      if (!r) {
        showEmailCampaignNoSelectedEmails();
      }
    }
    return r;
  };

  window.checkRegularFinishAndSendValidation = function(noshow) {
    var error1;
    if (noshow == null) {
      noshow = false;
    }
    error1 = cscope.regular_form_email_subject.val().length > 3;
    if (!noshow) {
      cscope.regular_form_email_subject.parents(".subject-holder").toggleClass('error', !error1);
    }
    console.log("error1 = " + error1);
    return error1;
  };

  window.validateUrl = function(value) {
    var expression, regex;
    expression = /[-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?/gi;
    regex = new RegExp(expression);
    return value.match(regex) !== null;
  };

  window.checkRegularImageLinkValidation = function(noshow) {
    var valid;
    if (noshow == null) {
      noshow = false;
    }
    console.log(cscope.regular_form_image_link_field.val());
    valid = cscope.regular_form_image_link_field.val().length === 0 || validateUrl(cscope.regular_form_image_link_field.val());
    if (!noshow) {
      cscope.regular_form_image_link_field.parents(".bottom-editing-image-bar").toggleClass('error', !valid);
    }
    return valid;
  };

  window.showEmailCampainPreviewPopup = function(id) {
    if (id == null) {
      id = null;
    }
    $('body').addClass('noscroll');
    $("#regular-emails-tab #preview-email-holder iframe.email-preview-big,#regular-emails-tab #preview-email-holder iframe.email-preview-phone").attr('src', constructIframeEmailCampaignParams(id));
    return $("#regular-emails-tab #preview-email-holder").addClass('showing');
  };

  initEmailCampaignPreview = function() {
    $("#regular-emails-tab .preview-btn").on('click', function(e) {
      e.preventDefault();
      if (checkRegularEditMailPageValidation() && cscope.regular_form_id.val()) {
        showEmailCampainPreviewPopup();
        return lbTrackEvent("Email_Interaction", (currentTemplateSelected(false)) + "_Email_Preview");
      }
    });
    return $("#preview-email-holder .close-btn").on('click', function(e) {
      $("#regular-emails-tab #preview-email-holder").removeClass('showing');
      return $('body').removeClass('noscroll');
    });
  };

  resetEmailForm = function() {};

  isEmailFormDraft = function() {
    return $("#email_campaign_id").val() !== '';
  };

  saveEmailTemplateType = function() {
    var data, id, template_type;
    id = parseInt($("#email_campaign_id").val());
    template_type = cscope.regular_form_template_type_radio_value();
    data = {
      email_campaign: {
        template_type: template_type
      }
    };
    if (!isNaN(id)) {
      data.email_campaign.id = id;
    }
    return $.ajax({
      type: "POST",
      url: '/ajax/post_email_campaign',
      data: data,
      success: function(data) {
        return $("#email_campaign_id").val(data.id);
      }
    });
  };

  saveEmailTextArea = function() {
    var data, email_body, id;
    email_body = tinyMCE.get('email_campaign_email_body').getContent();
    id = parseInt($("#email_campaign_id").val());
    data = {
      email_campaign: {
        email_body: email_body
      }
    };
    if (!isNaN(id)) {
      data.email_campaign.id = id;
    }
    return $.ajax({
      type: "POST",
      url: '/ajax/post_email_campaign',
      data: data,
      success: function(data) {
        $("#email_campaign_id").val(data.id);
        hideTextEditor();
        checkRegularEmailBodyValidation();
        return lbTrackEvent("Email_Interaction", (currentTemplateSelected(false)) + "_Email_Save_Text");
      }
    });
  };

  currentTemplateSelected = function(ret_int) {
    var r;
    if (ret_int == null) {
      ret_int = true;
    }
    r = parseInt($("input.template_type-radio:checked").val());
    if (ret_int) {
      return r;
    }
    if (r === 1) {
      return "Advanced";
    } else {
      return "Basic";
    }
  };

  initEmailFormOnChange = function() {
    cscope.regular_form_template_type_radio.on('change', function(e) {
      var v;
      console.log("this.value => " + ($(this).val()));
      v = parseInt($(this).val());
      $(".main-preview-container").removeClass('basic advanced').toggleClass('basic', v === 0).toggleClass('advanced', v === 1);
      if (isEmailFormDraft()) {
        return saveEmailTemplateType();
      }
    });
    return cscope.regular_form_mailing_method_radio.on('change', function(e) {
      return updateMailingMethodPage();
    });
  };

  setEmailImageChanged = function(v) {
    return $("#new_email_campaign #email-image-changed").val(v);
  };

  bindMailingListExcelForm = function() {
    $("form#xls_mailing_upload").ajaxForm({
      beforeSend: function() {
        return window.showSecureLoadingOverlay("Uploading...");
      },
      success: function(data1) {
        var data_new_invites, data_old_invites, saved_club_mem, saved_email_list, saved_list;
        $('#content').hideLbOverlay();
        window.hideSecureLoadingOverlay();
        $(document).trigger('emailListUploaded');
        console.log("data1");
        console.log(data1);
        data_old_invites = data1.mailing_list.mailing_list_total_members_invited;
        data_new_invites = data1.total;
        saved_club_mem = parseInt($(".radio-mailing-club-members .members-count").text());
        saved_list = data_old_invites + saved_club_mem;
        if (parseInt($(".radio-mailing-club-members .members-count").text()) === saved_list) {
          $("#regular-emails-tab  .contacts-invitations").css('display', 'none');
        }
        saved_email_list = parseInt($("#regular-emails-tab .radio-mailing-saved-list .saved-list").text());
        $("#regular-emails-tab .radio-mailing-saved-list .saved-list").text(saved_email_list + data_new_invites);
        if (data_new_invites !== 0) {
          $("#regular-emails-tab  .contacts-invitations").css('display', 'inline-block');
          $("#regular-emails-tab  .no-mailing-yet").hide();
        }
        openUploadMailingListLightbox(data1.total, true);
        $('#adding-emails-lightbox .xls-error-holder').hide();
        lbTrackEvent("Email_Interaction", "Regular_Uploads_List_Success");
        return $.ajax({
          url: Routes.dashboard_add_mailing_to_club_path({
            include_club_members: 1
          })
        });
      },
      complete: function() {
        $('#content').hideLbOverlay();
        window.hideSecureLoadingOverlay();
        return $('#mailing_list_mailing_list_file').val("");
      },
      error: function(data) {
        return showEmailCampaignErrorUploadingXls();
      }
    });
    return $('#mailing_list_mailing_list_file').on('change', function(e, i) {
      if ($(this).val() !== "") {
        $('#xls_mailing_upload').submit();
        return window.showSecureLoadingOverlay("Uploading...");
      }
    });
  };

  bindBottomNav = function() {
    $("#regular-emails-tab .bottom-nav .next-btn").on('click', function(e) {
      e.preventDefault();
      return regularMailSelectPage(window.currentRePage + 1);
    });
    $("#regular-emails-tab .bottom-nav .back-link").on('click', function(e) {
      e.preventDefault();
      return regularMailSelectPage(window.currentRePage - 1);
    });
    $("#regular-emails-tab .bottom-nav .send-later-btn").on('click', function(e) {
      e.preventDefault();
      if (!$(this).parents(".bottom-nav").hasClass('disable-send-buttons')) {
        lbTrackEvent("Email_Interaction", "Send_Later_Click");
        return submitEmailCampaignAsSendLater();
      }
    });
    return $("#regular-emails-tab .bottom-nav .send-now-btn").on('click', function(e) {
      e.preventDefault();
      return submitEmailCampaignAsCampaign();
    });
  };

  submitEmailCampaignAsDraft = function(onsucess) {
    $('#regular-emails-tab #new_email_campaign #is-draft-field').val(1);
    return submitRegularForm(onsucess);
  };

  submitEmailCampaignAsSendLater = function() {
    $('#regular-emails-tab #new_email_campaign #is-draft-field').val(1);
    window.reg_mail_cpgn_reload_list = true;
    showCogLoadingOverlay();
    $('#regular-emails-tab #new_email_campaign').submit();
    return $("#regular-emails-tab .bottom-nav").addClass('not-showing');
  };

  window.constructIframeEmailCampaignParams = function(id) {
    if (id == null) {
      id = null;
    }
    console.log("id = > " + id);
    console.log("cscope.regular_form_id.val() = " + (cscope.regular_form_id.val()));
    return "/ajax/email_render?type=regular&id=" + (id || cscope.regular_form_id.val());
  };

  window.clearRegularEmailForm = function() {
    var $form;
    $(".regular-mail-nav .regular-main-block").removeClass('visited');
    $form = cscope.regular_form;
    cscope.regular_form_id.val("");
    $form.find("#email-image-changed").val(0);
    cscope.regular_form_is_draft_field.val(1);
    cscope.regular_form_template_type_radio.filter("[value=0]").click();
    cscope.regular_form_mailing_method_radio.attr('checked', false);
    cscope.regular_form_image_field.val("");
    cscope.regular_form_email_body.val("");
    cscope.regular_form_email_subject.val("");
    cscope.regular_form_image_link_field.val("");
    if (tinymce.get('email_campaign_email_body')) {
      tinymce.get('email_campaign_email_body').setContent("");
    }
    $form.find(".post-to-twitter").attr("checked", false).trigger('change');
    $form.find(".post-to-facebook").attr("checked", false).trigger('change');
    $("#regular-emails-tab .image-holder-filled img#email-image-preview").remove();
    $("#regular-emails-tab .main-preview-container").removeClass('with-image editing-mode');
    $form.find("#copy-image-id-field").val("");
    updateMailingMethodPage();
    return cscope.current_form_email_image = null;
  };

  submitEmailCampaignAsCampaign = function() {
    console.log("submitEmailCampaignAsCampaign");
    if (checkRegularFinishAndSendValidation()) {
      lbTrackEvent("Email_Interaction", (currentTemplateSelected(false)) + "_Email_Send_Click");
      $('#regular-emails-tab #new_email_campaign #is-draft-field').val(0);
      window.reg_mail_cpgn_reload_list = true;
      showCogLoadingOverlay();
      return setTimeout(function() {
        $('#regular-emails-tab #new_email_campaign').submit();
        return $("#regular-emails-tab .bottom-nav").addClass('not-showing');
      }, 50);
    }
  };

  reloadListAndClearForm = function(onfinish) {
    return $.get(Routes.dashboard_regular_email_campaigns_path({
      list_only: 1
    }), function(data) {
      $("#regular-email-campaigns-holder").html($(data));
      hideBoxLoading();
      hideCogLoadingOverlay();
      clearRegularEmailForm();
      regularMailSelectPage(1);
      setListCampaignsVisibility();
      bindRegularCampaignsList();
      if (onfinish) {
        return onfinish();
      }
    });
  };

  duplicateRegularCampaign = function(data) {
    var $form, d;
    clearRegularEmailForm();
    $form = cscope.regular_form;
    d = {};
    d.templateType = first_valid([data.templateType, data.template_type]);
    d.mailingMethod = first_valid([data.mailingMethod, data.mailing_method]);
    d.emailBody = first_valid([data.emailBody, data.email_body]);
    d.emailSubject = first_valid([data.emailSubject, data.email_subject]);
    d.postToTwitter = first_valid([data.postToTwitter, data.post_to_twitter]);
    d.postToFacebook = first_valid([data.postToFacebook, data.post_to_facebook]);
    d.emailImageDisplay = data.emailImageDisplay || data.email_image_display;
    d.emailImageDisplayWidth = first_valid([data.emailImageDisplayWidth, data.email_image_display_width]);
    d.emailImageDisplayHeight = first_valid([data.emailImageDisplayHeight, data.email_image_display_height]);
    d.imageLink = first_valid([data.imageLink, data.image_link]);
    d.id = data.id;
    cscope.regular_form_template_type_radio.filter("[value=" + d.templateType + "]").click();
    $form.find("input.mailing-method-radio[type=radio][value=" + d.mailingMethod + "]").click();
    cscope.regular_form_email_body.val(d.emailBody);
    cscope.regular_form_email_subject.val(d.emailSubject);
    cscope.regular_form_image_link_field.val(d.imageLink);
    if (tinymce.get('email_campaign_email_body')) {
      tinymce.get('email_campaign_email_body').setContent(d.emailBody);
    }
    $form.find(".post-to-twitter").attr("checked", d.postToTwitter === 1).trigger('change');
    $form.find(".post-to-facebook").attr("checked", d.postToFacebook === 1).trigger('change');
    if (d.emailImageDisplay) {
      $("<img id='email-image-preview' width='" + d.emailImageDisplayWidth + "' height='" + d.emailImageDisplayHeight + "' src='" + d.emailImageDisplay + "' />").appendTo("#regular-emails-tab .image-holder-filled");
      $("#regular-emails-tab .image-holder-filled").height(d.emailImageDisplayHeight);
      $("#regular-emails-tab .main-preview-container").addClass('with-image');
      $form.find("#copy-image-id-field").val(d.id);
      cscope.current_form_email_image = d.emailImageDisplay;
    }
    updateMailingMethodPage();
    if (d.templateType === 1) {
      return $(".save-img-btn").trigger('click');
    }
  };

  editRegularCampaignDraft = function(data) {
    var $form;
    clearRegularEmailForm();
    $form = cscope.regular_form;
    cscope.regular_form_template_type_radio.filter("[value=" + data.templateType + "]").click();
    $form.find("input.mailing-method-radio[type=radio][value=" + data.mailingMethod + "]").click();
    cscope.regular_form_email_body.val(data.emailBody);
    cscope.regular_form_email_subject.val(data.emailSubject);
    if (tinymce.get('email_campaign_email_body')) {
      tinymce.get('email_campaign_email_body').setContent(data.emailBody);
    }
    $form.find(".post-to-twitter").attr("checked", data.postToTwitter === 1).trigger('change');
    $form.find(".post-to-facebook").attr("checked", data.postToFacebook === 1).trigger('change');
    if (data.emailImageDisplay) {
      $("<img id='email-image-preview' width='" + data.emailImageDisplayWidth + "' height='" + data.emailImageDisplayHeight + "' src='" + data.emailImageDisplay + "' />").appendTo("#regular-emails-tab .image-holder-filled");
      $("#regular-emails-tab .image-holder-filled").height(data.emailImageDisplayHeight);
      $("#regular-emails-tab .main-preview-container").addClass('with-image');
      cscope.current_form_email_image = data.emailImageDisplay;
      console.log("cscope.current_form_email_image");
      console.log(cscope.current_form_email_image);
      console.log(data.emailImageDisplay);
      console.log(data);
    }
    cscope.regular_form_id.val(data.id);
    return updateMailingMethodPage();
  };

  hideTextEditor = function() {
    var t_contents, tiny_ins;
    $(".textarea-preview").removeClass('editing');
    tiny_ins = tinymce.get('email_campaign_email_body');
    if (tiny_ins) {
      tiny_ins.hide();
      t_contents = tiny_ins.getContent();
      if (t_contents === '') {
        return $(".textarea-container .preview").html(window.regular_email_text_editor);
      } else {
        return $(".textarea-container .preview").html(t_contents);
      }
    } else {
      return $(".textarea-container .preview").html(window.regular_email_text_editor);
    }
  };

  showTextEditor = function() {
    initTextEditor();
    $(".textarea-preview").addClass('editing');
    if (tinymce.get('email_campaign_email_body')) {
      return tinymce.get('email_campaign_email_body').show();
    }
  };

  initTextEditor = function() {
    return tinyMCE.init({
      selector: '.textarea-preview #email_campaign_email_body',
      toolbar: 'undo redo |  bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | savebutton',
      menubar: false,
      skin: 'flok',
      paste_as_text: true,
      plugins: "autoresize",
      body_class: 'tinymce-body-email-class',
      force_br_newlines: false,
      force_p_newlines: false,
      forced_root_block: '',
      keep_styles: false,
      invalid_styles: 'color font-type background-color',
      statusbar: false,
      plugins: 'paste placeholder',
      content_css: "/assets/dashboard/tinymce_content.css",
      setup: function(editor) {
        editor.addButton('savebutton', {
          text: 'SAVE',
          icon: false,
          onclick: function() {
            saveEmailTextArea();
          }
        });
      }
    });
  };

  setListCampaignsVisibility = function() {
    return $(".regular-page.regular-page-1").toggleClass('no-campaigns', $(".email-campaign-entry").length === 0);
  };

  submitRegularForm = function(onsuccess) {
    if (onsuccess == null) {
      onsuccess = null;
    }
    window.regularEmailCampainsOnSuccessFunction = function(data) {
      if (onsuccess) {
        onsuccess(data);
      }
      return window.regularEmailCampainsOnSuccessFunction = null;
    };
    return cscope.regular_form.submit();
  };

  window.initDashboardTabRegularEmailCampaigns = function() {
    var newurl;
    initRegularPageScopeVars();
    bindGmailContactsButton();
    window.reg_mail_cpgn_reload_list = false;
    $("#email_campaign_post_to_facebook:enabled").on('change', function() {
      if ($(this).is(':checked')) {
        return lbTrackEvent("Email_Interaction", "Post_To_Facebook_Check");
      }
    });
    $("#email_campaign_post_to_twitter:enabled").on('change', function() {
      if ($(this).is(':checked')) {
        return lbTrackEvent("Email_Interaction", "Post_To_Twitter_Check");
      }
    });
    $("#regular-emails-tab .create-email-btn").on('click', function(e) {
      e.preventDefault();
      initTextEditor();
      clearRegularEmailForm();
      $("#regular-emails-tab .main-page-header,#regular-emails-tab .email-campaigns-holder").addClass('transition1');
      return setTimeout(function() {
        regularMailSelectPage(2);
        return $("#regular-emails-tab .regular-mail-nav.animate").removeClass('animate');
      }, 1000);
    });
    window.regular_email_text_editor = $(".textarea-container .preview").html();
    $(".textarea-container .js-edit-textarea ").on('click', function(e) {
      e.preventDefault();
      return showTextEditor();
    });
    window.currentRePage = 1;
    bindBottomNav();
    initEmailCampaignPreview();
    cscope.regular_form_image_field.on('change', function(e) {
      var f, file_size, files, reader;
      files = !!this.files ? this.files : [];
      if (!files.length || !window.FileReader) {
        return;
      }
      if (/^image/.test(files[0].type)) {
        f = this.files[0];
        file_size = f.size || f.fileSize;
        if (file_size > 2000000) {
          alert("File size must not exceed 2MB. Please select a smaller image.");
          return;
        }
        if (f.type !== "image/jpeg") {
          alert("File type is not supported. Please upload only JPG/JPEG typed files.");
          return;
        }
        reader = new FileReader;
        reader.readAsDataURL(files[0]);
        return reader.onload = function(file) {
          var image;
          image = new Image();
          image.src = file.target.result;
          return image.onload = function() {
            var height, max_width, ratio, width;
            max_width = 560;
            width = this.width > max_width ? max_width : this.width;
            ratio = max_width / this.width;
            height = ratio > 1 ? this.height : this.height * ratio;
            $("#regular-emails-tab .image-holder-filled img#email-image-preview").remove();
            $("<img id='email-image-preview' width='" + width + "' height='" + height + "' src='" + this.src + "' />").appendTo("#regular-emails-tab .image-holder-filled");
            $("#regular-emails-tab .image-holder-filled").height(height);
            $("#regular-emails-tab .main-preview-container").addClass('with-image editing-mode');
            return setEmailImageChanged(1);
          };
        };
      }
    });
    $("#regular-emails-tab  .custom-scrollbar").mCustomScrollbar({
      axis: "y",
      theme: 'dark-thick'
    });
    initEmailFormOnChange();
    $('#regular-emails-tab #new_email_campaign').ajaxForm({
      success: function(data) {
        $("#new_email_campaign #email_campaign_id").val(data.id);
        hideBoxLoading();
        $("#regular-emails-tab .main-preview-container").removeClass('editing-mode');
        setEmailImageChanged(0);
        cscope.current_form_email_image = data.email_image_url;
        if (reg_mail_cpgn_reload_list) {
          if (!data.is_draft) {
            if (data.users_sent_count === 0) {
              showCogLoadingOverlay();
              setTimeout(function() {
                return $.get("/ajax/delete_email_campaign?id=" + data.id, function(data) {
                  hideCogLoadingOverlay();
                  showEmailCampaignAddRecipientsLightbox();
                  return reloadListAndClearForm(function() {
                    duplicateRegularCampaign(data.data);
                    submitEmailCampaignAsDraft(false);
                    regularMailSelectPage(3);
                    return hideCogLoadingOverlay();
                  });
                }).fail(function() {
                  alert("An error has ocurred");
                  return hideCogLoadingOverlay();
                });
              }, 50);
            } else {
              lbTrackEvent("Email_Interaction", (currentTemplateSelected(false)) + "_Email_Send_Success");
              hideCogLoadingOverlay();
              showEmailSuccesSendLightbox(data.users_sent_count, function() {
                showCogLoadingOverlay();
                return reloadListAndClearForm(function() {
                  return hideCogLoadingOverlay();
                });
              });
            }
          } else {
            reloadListAndClearForm();
          }
        }
        window.reg_mail_cpgn_reload_list = false;
        if (window.regularEmailCampainsOnSuccessFunction) {
          return window.regularEmailCampainsOnSuccessFunction(data);
        }
      },
      error: function() {
        alert("An error as ocurred!");
        return hideBoxLoading();
      }
    });
    $(".save-img-btn").on('click', function(e) {
      if (checkRegularImageLinkValidation()) {
        showBoxLoading(".image-holder-filled", {
          text: "Saving..."
        });
        submitEmailCampaignAsDraft();
        return lbTrackEvent("Email_Interaction", "Advanced_Email_Save_Image");
      }
    });
    $(".js-edit-image").on('click', function(e) {
      e.preventDefault();
      return $("#regular-emails-tab .main-preview-container").addClass('editing-mode');
    });
    setListCampaignsVisibility();
    bindMailingListExcelForm();
    bindRegularCampaignsList();
    if (gon.fbparams) {
      gon.fbparams = JSON.parse(atob(gon.fbparams));
      if (history.pushState) {
        newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({
          path: newurl
        }, "", newurl);
      }
      if (gon.fbparams.gotocampaign) {
        $(".regular-page-1").hide();
        setTimeout(function() {
          var data;
          console.log(gon.fbparams);
          data = $(".email-campaign-entry[data-id=" + gon.fbparams.gotocampaign + "]").data();
          editRegularCampaignDraft(data);
          regularMailSelectPage(5);
          $(".regular-page-1").show();
          if (gon.fbparams.origin === 'fb-connect') {
            $(".js-fb-page-lightbox-btn").click();
          }
          if ((gon.fbparams.origin === 'fb-select-page' || gon.fbparams.origin === 'fb-connect') && gon.fb_is_active) {
            cscope.regular_form.find(".post-to-facebook").attr("checked", true).trigger('change');
          }
          if (gon.fbparams.origin === 'twitter') {
            return cscope.regular_form.find(".post-to-twitter").attr("checked", true).trigger('change');
          }
        }, 1000);
      }
    }
    return $(document).on("signalContactsLightboxContactsSelected", function(e, data) {
      $(".radio-mailing-saved-list .saved-list").text(data.total_invitations);
      if (parseInt($(".radio-mailing-club-members .members-count").text()) === data.total_invitations) {
        $("#regular-emails-tab  .contacts-invitations").css('display', 'none');
      } else {
        $("#regular-emails-tab  .contacts-invitations").css('display', 'inline-block');
        $("#regular-emails-tab .radio-mailing-saved-list .saved-list").text(data.total_invitations);
      }
      return lbTrackEvent("Email_Interaction", "Regular_Gmail_Contacts_Success");
    });
  };

  window.showRegularEmailsGmailContactsSelectionLightbox = function() {
    return ajaxLightbox1(Routes.dashboard_get_gmail_contacts_path({
      origin: Routes.dashboard_regular_email_campaigns_path()
    }), {
      height: 700,
      beforeShow: function() {
        var newurl;
        if (history.pushState) {
          newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.pushState({
            path: newurl
          }, "", newurl);
        }
        $("#select-email-contacts .contacts-next-btn").hide();
        return $("#select-email-contacts .contacts-add-button").show();
      },
      afterShow: function() {
        var data;
        console.log("### afterShow ###");
        window.initializeContactsLightbox(true);
        if (gon.email_campaign_state_params) {
          if (gon.email_campaign_state_params.gotocampaign) {
            data = $(".email-campaign-entry[data-id=" + gon.email_campaign_state_params.gotocampaign + "]").data();
            editRegularCampaignDraft(data);
            return regularMailSelectPage(3);
          }
        }
      }
    });
  };

  bindGmailContactsButton = function() {
    return $("#google-gmail-contacts-btn").on('click', function(e) {
      var gurl, redirect;
      e.preventDefault();
      gurl = $("#google-gmail-contacts-btn").data('gurl');
      redirect = $("#google-gmail-contacts-btn").data('redirect');
      console.log("Submitin");
      return submitEmailCampaignAsDraft(function(data) {
        var eparams;
        eparams = btoa(JSON.stringify({
          gotocampaign: data.id,
          origin: 'gmail',
          redirect_url: redirect
        }));
        console.log("eparams: " + eparams);
        return window.location = Routes.dashboard_get_google_access_token_path({
          eparams: eparams
        });
      });
    });
  };

  bindSocialButtons = function() {
    $(".js-connect-to-fb").on('click', function(e) {
      var url;
      e.preventDefault();
      url = $(this).attr('href');
      return submitEmailCampaignAsDraft(function() {
        var eparams, redirect_uri;
        eparams = Base64EncodeUrl(btoa(JSON.stringify({
          gotocampaign: cscope.regular_form_id.val(),
          origin: 'fb-connect'
        })));
        console.log(eparams);
        redirect_uri = (location.protocol + '//' + location.host + location.pathname) + "?fbparams=1&eparams=" + eparams;
        return window.openSocialConnectionsLightbox();
      });
    });
    $(".js-fb-page-lightbox-btn").on('click', function(e) {
      e.preventDefault();
      console.log("reacged");
      return submitEmailCampaignAsDraft(function() {
        var eparams, redirect_uri;
        eparams = Base64EncodeUrl(btoa(JSON.stringify({
          gotocampaign: cscope.regular_form_id.val(),
          origin: 'fb-select-page'
        })));
        redirect_uri = (location.protocol + '//' + location.host + location.pathname) + "?fbparams=1&eparams=" + eparams;
        return window.openSocialConnectionsLightbox();
      });
    });
    return $(".js-connect-to-twitter").on('click', function(e) {
      var url;
      e.preventDefault();
      url = $(this).attr('href');
      return submitEmailCampaignAsDraft(function() {
        var eparams, redirect_uri;
        eparams = Base64EncodeUrl(btoa(JSON.stringify({
          gotocampaign: cscope.regular_form_id.val(),
          origin: 'twitter'
        })));
        redirect_uri = (location.protocol + '//' + location.host + location.pathname) + "?fbparams=1&eparams=" + eparams;
        return window.location = url + "?return_uri=" + (encodeURIComponent(redirect_uri));
      });
    });
  };

  window.bindRegularCampaignsList = function() {
    bindSelectric();
    bindSocialButtons();
    $(".ec-entry-action:not(.change-binded)").addClass("change-binded").on('change', function() {
      var $ele, data, v;
      console.log($(this).val());
      v = parseInt($(this).val());
      $ele = $(this).parents(".email-campaign-entry");
      data = $ele.data();
      if (v === 1) {
        lbTrackEvent("Email_Interaction", "List_View_Sent_Duplicate");
        duplicateRegularCampaign(data);
        regularMailSelectPage(4);
      }
      if (v === 0) {
        editRegularCampaignDraft(data);
        regularMailSelectPage(4);
        lbTrackEvent("Email_Interaction", "List_View_Draft_Edit");
      }
      if (v === 2) {
        console.log("is_draft");
        console.log;
        if ($(this).parents(".email-campaign-entry").data("isDraft") === 1) {
          lbTrackEvent("Email_Interaction", "List_View_Draft_Delete");
        } else {
          lbTrackEvent("Email_Interaction", "List_View_Sent_Delete");
        }
        showEmailCampaignConfirmationDelete(function() {
          showCogLoadingOverlay();
          return $.get("/ajax/delete_email_campaign?id=" + data.id, function() {
            hideCogLoadingOverlay();
            return $ele.slideUp('slow', function() {
              $ele.remove();
              return setListCampaignsVisibility();
            });
          }).fail(function() {
            alert("An error has ocurred");
            return hideCogLoadingOverlay();
          });
        });
      }
      if (v !== -1) {
        return $(this).prop('selectedIndex', 0).selectric('refresh');
      }
    });
    return $(".email-campaign-entry .preview-link:not(.click-binded)").each(function() {
      $(this).addClass('click-binded').on('mouseenter', function(e) {
        var $ecblock, $maker, maker, subject;
        $ecblock = $(this).parents('.email-campaign-entry');
        if ($ecblock.find(".email-campaign-preview").length === 0) {
          maker = $("#regular-email-campaign-preview-maker").html();
          $maker = $(maker);
          $maker.addClass('not-visible');
          $maker.css('position', 'absolute');
          $maker.css('top', '-90px');
          $maker.css('left', '80px');
          $maker.css('z-index', 10);
          subject = $ecblock.data("emailSubject");
          if (subject === '') {
            subject = "Write a Catchy Header Here!";
          }
          $maker.find(".p-subject").text(subject);
          $ecblock.find(".preview-link-holder").append($maker);
          $ecblock.find("iframe.list-preview").attr("src", $ecblock.data("iframeurl"));
          $ecblock.find(".invisible-overlay").on('click', function(e) {
            return $maker.addClass("not-visible");
          });
          $maker.find(".ecp-content").on('mouseenter', function() {
            return $("body").addClass('noscroll');
          }).on('mouseleave', function() {
            return $("body").removeClass('noscroll');
          });
          return setTimeout(function() {
            return $maker.removeClass('not-visible');
          }, 50);
        } else {
          return $ecblock.find(".email-campaign-preview").removeClass('not-visible');
        }
      }).on('mouseleave', function(e) {
        var $ecblock;
        console.log("mouseleave");
        $ecblock = $(this).parents('.email-campaign-entry');
        return $ecblock.find(".email-campaign-preview").addClass('not-visible');
      }).on('click', function(e) {
        var $ecblock, id;
        e.preventDefault();
        $ecblock = $(this).parents('.email-campaign-entry');
        id = $ecblock.data('id');
        return showEmailCampainPreviewPopup(id);
      });
      $("#regular-emails-tab  .send-later-btn[title], #regular-emails-tab  .social-area *[title]").qtip({
        position: {
          my: 'bottom center',
          at: 'top center',
          adjust: {
            y: -20
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow emails3-qtip'
        }
      });
      $("#regular-emails-tab  .email-campaign-entry .lab.boost[title]").qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 8,
            x: 75
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-boost'
        }
      });
      $("#regular-emails-tab  .email-campaign-entry .lab.number[title]").qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 8,
            x: 75
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-stats'
        }
      });
      $("#regular-emails-tab  .choose-mailing-list-page *[title], #regular-emails-tab  .choose-mailing-list-page .show-qtip").qtip({
        position: {
          my: 'center left',
          at: 'center right',
          adjust: {
            x: 15
          }
        },
        content: function() {
          var v;
          v = $(this).attr('title');
          if (v) {
            return v;
          }
          return $(this).next('div.qtip-content:hidden').html();
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-flok'
        },
        hide: {
          when: {
            event: 'click'
          }
        }
      });
      return cscope.regular_form_email_subject.on('change paste keyup', function() {
        return $("#regular-emails-tab .bottom-nav").toggleClass('disable-send-buttons', !checkRegularFinishAndSendValidation(true));
      });
    });
  };

  window.initDashboardTabAutomaticEmail = function() {
    var onSliderChange;
    $("#aut-email-punch-preview .right-link, #aut-email-punch-preview .left-link").on('click', function(e) {
      var p;
      e.preventDefault();
      p = parseInt($("#aut-email-punch-preview").data('page'));
      if ($(this).hasClass('right-link')) {
        p++;
      } else {
        p--;
      }
      if (p < 1) {
        p = 3;
      }
      if (p > 3) {
        p = 1;
      }
      return $("#aut-email-punch-preview").removeClass('sel-1 sel-2 sel-3').addClass("sel-" + p).data('page', p);
    });
    onSliderChange = function($slider, value) {
      var type;
      $slider.parents('.flock-on-off-slider-holder').toggleClass('on', value === 1);
      $slider.parents('.flock-on-off-slider-holder').toggleClass('off', value === 0);
      type = $slider.data('type');
      return $.get(Routes.dashboard_ajax_set_auto_email_campaign_path(type, value), function() {
        $slider.parents('.autoemails-row').toggleClass('on', value === 1);
        return $slider.parents('.autoemails-row').toggleClass('off', value === 0);
      });
    };
    $(".flock-on-off-slider").each(function() {
      var $slider, v;
      v = parseInt($(this).data("val"));
      $slider = $(this);
      $slider.slider({
        min: 0,
        max: 1,
        step: 1,
        value: v,
        animate: 500,
        change: function(event, ui) {
          var trackclass, trackvalue;
          onSliderChange($slider, ui.value);
          trackclass = (function() {
            switch ($slider.data('type')) {
              case 'expiry':
                return 'Expiration';
              case 'birthday':
                return 'Birthday';
              case 'punchcard':
                return 'Punch';
              default:
                return 'unknowned';
            }
          })();
          trackvalue = ui.value === 1 ? 'On' : 'Off';
          return lbTrackEvent('Email_Interaction', "Automated_" + trackclass + "_" + trackvalue);
        }
      });
      $(".flock-on-off-slider-holder").each(function() {
        $(this).find(".left-area").on('click', function(e) {
          e.preventDefault();
          return $(this).parents(".flock-on-off-slider-holder").find(".flock-on-off-slider").slider('option', 'value', 0);
        });
        return $(this).find(".right-area").on('click', function(e) {
          e.preventDefault();
          return $(this).parents(".flock-on-off-slider-holder").find(".flock-on-off-slider").slider('option', 'value', 1);
        });
      });
      $(this).parents('.flock-on-off-slider-holder').toggleClass('on', v === 1);
      $(this).parents('.flock-on-off-slider-holder').toggleClass('off', v === 0);
      $(this).parents('.autoemails-row').toggleClass('on', v === 1);
      $(this).parents('.autoemails-row').toggleClass('off', v === 0);
      $("#automatic-emails-tab .exclamation").qtip({
        position: {
          my: 'left center',
          at: 'right center',
          adjust: {
            x: 20
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow emails1-qtip'
        }
      });
      $("#automatic-emails-tab .create-btn").qtip({
        position: {
          my: 'right center',
          at: 'left center',
          adjust: {
            x: -20
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow emails2-qtip'
        }
      });
      return $("#automatic-emails-tab .col .text[title]").qtip({
        position: {
          my: 'top right',
          at: 'bottom center',
          adjust: {
            y: 0,
            x: 48
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow qtip-boost2'
        }
      });
    });
    $("#automatic-emails-tab .preview-link ").on('click', function(e) {
      var $block;
      e.preventDefault();
      $block = $($(this).attr("href"));
      $block.toggleClass('not-visible');
      $block.find('iframe').each(function() {
        var $iframe;
        $iframe = $(this);
        if ($iframe.attr('src') === '') {
          return $iframe.attr('src', $iframe.data('url'));
        }
      });
      return $block.addClass('iframes-loaded');
    });
    return $("#automatic-emails-tab .invisible-overlay").on('click', function(e) {
      return $(this).parents(".email-campaign-preview").addClass("not-visible");
    });
  };

  window.initDashboardTabMarketingEmail = function() {
    $("#marketing-emails-tab .flock-on-off-slider-holder").on('click', function(e) {
      var _this, gaNum, timesOff;
      _this = $(this);
      gaNum = _this.data("ga");
      timesOff = _this.data('timesoff');
      return $.get(Routes.dashboard_ajax_marketing_email_pref_path(timesOff), function() {
        if (_this.hasClass("on")) {
          _this.addClass("off").removeClass("on");
          return lbTrackEvent("Marketing_Emails_Tab_Interaction", "Email_" + gaNum + "_Disable");
        } else {
          _this.addClass("on").removeClass("off");
          return lbTrackEvent("Marketing_Emails_Tab_Interaction", "Email_" + gaNum + "_Enable");
        }
      });
    });
    $("#marketing-emails-tab .mark-email-preview").on('click', function(e) {
      var $block, $iframe;
      e.preventDefault();
      $block = $($(this).data("element-attach"));
      $block.toggleClass('not-visible');
      $iframe = $block.find('iframe');
      if ($iframe.attr('src') === '') {
        $iframe.attr('src', $iframe.data('url'));
      }
      $block.addClass('iframes-loaded');
      return lbTrackEvent("Marketing_Emails_Tab_Interaction", $(this).data("ga"));
    });
    return $("#marketing-emails-tab .invisible-overlay").on('click', function(e) {
      return $(this).closest(".email-campaign-preview").addClass("not-visible");
    });
  };

}).call(this);
(function() {
  var connectManageAccounts, displayPreviewBox, enableDisableSocialCategories, hidePreviewBoxes, hidePreviewBoxesOnPrivewClick, openSocialUpgradeLightboxOnLoad;

  displayPreviewBox = function() {
    return $('#go-social-tab .preview-link').on('click', function(e) {
      e.preventDefault();
      if ($('.preview-link').is(':parent')) {
        hidePreviewBoxes();
      }
      return $(this).children(':first-child').addClass('display');
    });
  };

  hidePreviewBoxesOnPrivewClick = function() {
    return $('#go-social-tab .preview-box .closing-overlay').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return hidePreviewBoxes();
    });
  };

  hidePreviewBoxes = function() {
    return $('#go-social-tab .preview-box').removeClass('display');
  };

  connectManageAccounts = function() {
    return $('#go-social-tab .connect-accounts-btn , #go-social-tab .manage-accounts-btn').on('click', function(e) {
      e.preventDefault();
      return window.openSocialConnectionsLightbox();
    });
  };

  window.checkFacebookPagesExists = function(isConnectedToPage, hasMultiplePages) {
    if (hasMultiplePages && !isConnectedToPage) {
      return window.openSocialConnectionsLightbox();
    }
  };

  window.openSocialConnectionsLightbox = function() {
    var returnUri;
    lbTrackEvent("Social_Tab_Interaction", "Connect_Facebook_Page_Display");
    returnUri = window.location.href;
    return $.fancybox({
      type: 'ajax',
      href: Routes.connect_accounts_lightbox_path({
        social_connection_return_uri: returnUri
      }),
      padding: 0,
      closeBtn: true,
      scrolling: 'no',
      autoCenter: true,
      closeClick: false,
      parent: 'body',
      helpers: {
        overlay: {
          closeClick: false
        }
      },
      wrapCSS: 'fancybox-skin-no-box',
      tpl: {
        closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
      },
      beforeShow: function() {
        blurWrapper();
        return window.scrollPagesList();
      },
      afterClose: function() {
        return unblurWrapper();
      }
    });
  };

  openSocialUpgradeLightboxOnLoad = function() {
    var connectedBtn, isLead, manageBtn;
    isLead = $('#go-social-tab').data('is-lead');
    manageBtn = $('#go-social-tab .manage-accounts-btn');
    connectedBtn = $('#go-social-tab .connect-accounts-btn');
    if (isLead) {
      if (manageBtn.length > 0) {
        if (!(manageBtn.data('multiple-pages') && !manageBtn.data('connected-to-page'))) {
          return window.upgradePlanSocialTab();
        }
      } else {
        return window.upgradePlanSocialTab();
      }
    }
  };

  window.upgradePlanSocialTab = function() {
    return $.fancybox({
      type: 'ajax',
      href: Routes.social_tab_upgrade_plan_lightbox_path(),
      padding: 0,
      closeBtn: true,
      scrolling: 'no',
      parent: 'body',
      autoCenter: true,
      closeClick: false,
      helpers: {
        overlay: {
          closeClick: false
        }
      },
      wrapCSS: 'fancybox-skin-no-box',
      tpl: {
        closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
      },
      beforeShow: function() {
        return blurWrapper();
      },
      afterClose: function() {
        return unblurWrapper();
      }
    });
  };

  enableDisableSocialCategories = function() {
    return $('#go-social-tab .switcher-holder').on('click', function(e) {
      var choice, socialCategory, switcher;
      switcher = $(this);
      choice = switcher.hasClass('on') ? false : true;
      socialCategory = switcher.data('social-category');
      return $.ajax({
        type: "POST",
        url: Routes.dashboard_social_update_path(),
        data: {
          social_category: socialCategory,
          enable_disable_auto_post: choice
        },
        success: function(data) {
          if (choice) {
            switcher.removeClass('off').addClass('on');
            switch (socialCategory) {
              case 'checkins':
                return lbTrackEvent("Social_Tab_Interaction", "CheckIns_On");
              case 'rewards':
                return lbTrackEvent("Social_Tab_Interaction", "Rewards_On");
              case 'ratings':
                return lbTrackEvent("Social_Tab_Interaction", "Ratings_On");
              case 'photos':
                return lbTrackEvent("Social_Tab_Interaction", "Photos_On");
            }
          } else {
            switcher.removeClass('on').addClass('off');
            switch (socialCategory) {
              case 'checkins':
                return lbTrackEvent("Social_Tab_Interaction", "CheckIns_Off");
              case 'rewards':
                return lbTrackEvent("Social_Tab_Interaction", "Rewards_Off");
              case 'ratings':
                return lbTrackEvent("Social_Tab_Interaction", "Ratings_Off");
              case 'photos':
                return lbTrackEvent("Social_Tab_Interaction", "Photos_Off");
            }
          }
        }
      });
    });
  };

  window.scrollPagesList = function() {
    return $('.fb-pages-list').mCustomScrollbar({
      axis: "y",
      theme: 'minimal-dark',
      scrollInertia: 0
    });
  };

  window.initDashboardTabSocial = function() {
    var hasMultiplePages, isConnectedToPage, manageAccountsBtn;
    enableDisableSocialCategories();
    manageAccountsBtn = $('#go-social-tab .manage-accounts-btn');
    if (manageAccountsBtn.length > 0) {
      hasMultiplePages = manageAccountsBtn.data('multiple-pages');
      isConnectedToPage = manageAccountsBtn.data('connected-to-page');
      window.checkFacebookPagesExists(isConnectedToPage, hasMultiplePages);
    }
    displayPreviewBox();
    hidePreviewBoxesOnPrivewClick();
    connectManageAccounts();
    return openSocialUpgradeLightboxOnLoad();
  };

}).call(this);
(function() {
  var bindCampaignListButtons, gotoNextStep, gotoPage, gotoPreviousStep, gotoStep, initCampaignListPage, initChooseAudiencePage, initCreateCampaignPage, initValidations, loadPage, onMilesChange, onSlideAge, showReceivedJoinedUsersQtip, wasQtipSeen;

  gotoPage = function(p) {
    $("#customer-discovery-tab  .step").hide('fade', function() {
      return $("#customer-discovery-tab  .step" + p).show('fade');
    });
    return gon.page = p;
  };

  loadPage = function(page_data, on_finish) {
    var stepclasses;
    stepclasses = '';
    if (page_data) {
      $("#customer-discovery-tab .step").each(function() {
        return stepclasses += $(this).data("mainclass") + " ";
      });
      if ($(page_data.current).isVisible()) {
        if (!!page_data.onload) {
          eval(page_data.onload);
        }
        if (!!on_finish) {
          return on_finish();
        }
      } else {
        if (page_data.mainclass !== null) {
          $("#customer-discovery-tab").removeClass(stepclasses).addClass(page_data.mainclass);
        }
        if (!!page_data.onload) {
          eval(page_data.onload);
        }
        if (!!on_finish) {
          return on_finish();
        }
      }
    }
  };

  gotoStep = function(target) {
    var data;
    data = $(target).data();
    return loadPage(data, function() {
      return window.history.pushState(data, null, data.uri);
    });
  };

  gotoNextStep = function(target) {
    var next_data;
    if (!target) {
      target = $('#customer-discovery-tab .step').filterVisible();
      next_data = target.data('next').data();
    } else {
      target = $(target);
      next_data = $(target.parents('.step').data('next')).data();
    }
    return loadPage(next_data, function() {
      return window.history.pushState(next_data, null, next_data.uri);
    });
  };

  gotoPreviousStep = function(target) {
    var next_data;
    if (!target) {
      target = $('#customer-discovery-tab .step').filterVisible();
      next_data = target.data('previous').data();
    } else {
      target = $(target);
      next_data = $(target.parents('.step').data('previous')).data();
    }
    return loadPage(next_data, function() {
      return window.history.pushState(next_data, null, next_data.uri);
    });
  };

  wasQtipSeen = function() {
    var qtipHiddenInDom, qtipSeen;
    switch (gon.current_purchase_category_qtip_times_seen) {
      case 0:
        qtipSeen = false;
        break;
      case 1:
        qtipHiddenInDom = $('#qtip-purchase-category-explanation').length;
        if (qtipHiddenInDom === 1) {
          qtipSeen = true;
          $('#qtip-purchase-category-explanation').css({
            display: "block",
            top: "0.5px",
            left: "478px",
            opacity: "1"
          });
        } else {
          qtipSeen = false;
        }
        break;
      default:
        qtipSeen = true;
    }
    return qtipSeen;
  };

  window.bindNavigation = function() {
    var current_data, stack_onpopstate;
    $(document).on('ajax:success', function(e) {
      return gotoNextStep(e.target);
    });
    $('#customer-discovery-tab .js-next-step').on('click', function(e) {
      e.preventDefault();
      return gotoNextStep(this);
    });
    $('#customer-discovery-tab .js-previous-step').on('click', function(e) {
      e.preventDefault();
      return gotoPreviousStep(this);
    });
    current_data = $("#customer-discovery-tab  .step").filterVisible().first().data();
    window.history.replaceState(current_data, null, null);
    if (!!current_data.onload) {
      eval(current_data.onload);
    }
    return stack_onpopstate = function(e) {
      if (!window.carrots_quick_launch_visible && !gon.show_carrots_quicklaunch) {
        return loadPage($(window.history.state.current).data());
      }
    };
  };

  onSlideAge = function(min, max) {
    $('.choose-age-row .age-low').text(min + "yr.");
    $('.choose-age-row .age-high').text(max + "yr.");
    $('.age-preview').text(min + "YR. - " + max + "YR.");
    $('.from-age-field').val(min);
    return $('.to-age-field').val(max);
  };

  onMilesChange = function(miles) {
    $('.choose-distance-row .miles').text(miles + " miles from your club.");
    $('.distance-miles-preview').html(miles + "MI AROUND<br/>YOUR BUSINESS");
    return $(".distance-miles-field").val(miles);
  };

  showReceivedJoinedUsersQtip = function() {
    var sliderOptions;
    sliderOptions = ['RECEIVED Carrot', 'JOINED Club'];
    return $('.qtip-holder.triangle').each((function() {
      var qtipSelector, tokenId;
      qtipSelector = $(this);
      tokenId = qtipSelector.closest('.campaign-entry').attr('data-tid');
      if (typeof displayList !== 'undefined') {
        return window.displayList(qtipSelector, true, sliderOptions, 'carrots_users', tokenId);
      }
    }));
  };

  initChooseAudiencePage = function() {
    var from_age, to_age, updateGender;
    from_age = $('#step-choose-audience .from-age-field').val();
    to_age = $('#step-choose-audience .to-age-field').val();
    $('#age-range-slider').slider({
      range: true,
      min: 18,
      max: 75,
      values: [from_age, to_age],
      slide: function(event, ui) {
        return onSlideAge(ui.values[0], ui.values[1]);
      },
      stop: function(event, ui) {
        lbTrackEvent("Carrots_Interaction", "Selects_Age");
      }
    });
    $('#distance-slider').slider({
      range: "min",
      min: 0.25,
      max: 50,
      step: 0.25,
      value: 50,
      slide: function(event, ui) {
        return onMilesChange(ui.value);
      },
      stop: function(event, ui) {
        lbTrackEvent("Carrots_Interaction", "Selects_Distance");
      }
    });
    updateGender = function() {
      var v;
      v = $('#step-choose-audience .gender-field').val();
      $('#step-choose-audience .choose-audience-buttons .sel-button').removeClass('selected');
      $("#step-choose-audience .choose-audience-buttons .sel-button.js-" + v).addClass('selected');
      return $(".gender-preview").removeClass('gender-selected-male gender-selected-female gender-selected-all').addClass("gender-selected-" + v);
    };
    $('#step-choose-audience .choose-audience-buttons .sel-button').on('click', function(e) {
      e.preventDefault();
      $('#step-choose-audience .gender-field').val($(this).data('val'));
      return updateGender();
    });
    return updateGender();
  };

  initCreateCampaignPage = function() {
    var updateOfferSelect, updateRadio;
    window.last_selectric_val = '';
    $('#customer-discovery-tab .js-next-step-from-campaign').on('click', function(e) {
      e.preventDefault();
      if ($("#form-publish-customer-discovery").valid()) {
        return gotoNextStep(this);
      }
    });
    updateRadio = function() {
      var v;
      v = $('#step-create-campaign input[type=radio][name=run]:checked').val();
      if (v !== 'limit') {
        $('#step-create-campaign .create-reward-how-long-row').addClass('hideLimit');
        return $("#step-publish-and-track .how-long-preview").removeClass('limit-selected').addClass('cont-selected');
      } else {
        $('#step-create-campaign .create-reward-how-long-row').removeClass('hideLimit');
        return $("#step-publish-and-track .how-long-preview").removeClass('cont-selected').addClass('limit-selected');
      }
    };
    $('input[type=radio][name=run]').change(function() {
      return updateRadio();
    });
    updateRadio();
    $('#step-create-campaign .limit-campaigns-num-field').on('change paste keyup', function() {
      return $("#step-publish-and-track .how-long-preview .recipients").text($(this).val());
    });
    $("#step-publish-and-track .how-long-preview .recipients").text($('#step-create-campaign .limit-campaigns-num-field').val());
    updateOfferSelect = function() {
      var cla, events, v;
      v = $('#step-create-campaign .offerSelect').val();
      cla = 'state-visit';
      if (v === '0') {
        cla = 'state-visit';
      }
      if (v === '1') {
        cla = 'state-buy-now';
      }
      if (v === '2') {
        cla = 'state-call-to-book';
      }
      if (v !== '1') {
        $("#step-create-campaign .money-input").val("");
      }
      $('#step-create-campaign .step-main-area').removeClass('state-visit state-buy-now state-call-to-book').addClass(cla);
      events = ["Selects_Visit", "Selects_Buy_Now", "Selects_Call"];
      v = parseInt(v);
      if (v > 0) {
        return lbTrackEvent("Carrots_Interaction", events[v]);
      }
    };
    $("#step-create-campaign .offerSelect").each(function() {
      $(this).on('change', function() {
        var dv, v;
        v = $(this).val();
        dv = $(this).data("vvalue");
        if (v === '1' && gon.buy_now_locked) {
          $('*').qtip('hide');
          window.showBlockTabLightbox("buy_now");
          return $(this).val(window.last_selectric_val).selectric('refresh');
        } else {
          $(this).data("vvalue", v);
          updateOfferSelect(this);
        }
      });
      $(this).on('selectric-before-close', function() {
        return window.last_selectric_val = $(this).val();
      });
      updateOfferSelect(this);
      return $(this).data("value", $(this).val());
    });
    forceNumericality('#customer-discovery-tab .limit-campaigns-num-field', false, true);
    forceNumericality('#customer-discovery-tab  .money-input');
    $("#customer-discovery-tab  .reward-field").observeField('.reward-preview');
    return $('#customer-discovery-tab  .reward-field').on('change paste keyup', function() {
      var $f;
      $f = $('#customer-discovery-tab .js-c-count');
      return $f.text($(this).val().length);
    });
  };

  bindCampaignListButtons = function() {
    $("#step-new .campaings-holder .pause-campaign-btn:not(.campaignsControlButtonBinded)").addClass("campaignsControlButtonBinded").on('click', function(e) {
      var entry, tid;
      e.preventDefault();
      entry = $(this).parents(".campaign-entry");
      tid = entry.data('tid');
      return $.ajax(Routes.dashboard_carrots_campaign_action_path("pause", tid), {
        dataType: 'json',
        success: function() {
          return entry.addClass('paused').removeClass('playing');
        },
        error: function(data) {
          return alert(data.responseJSON.message);
        },
        beforeSend: function() {
          return showBoxLoading("#step-new .step-carrots-campaigns", {
            text: 'Pausing Campaign...'
          });
        },
        complete: function() {
          return hideBoxLoading("#step-new .step-carrots-campaigns");
        }
      });
    });
    $("#step-new .campaings-holder .play-campaign-btn:not(.campaignsControlButtonBinded)").addClass("campaignsControlButtonBinded").on('click', function(e) {
      var entry, tid;
      e.preventDefault();
      entry = $(this).parents(".campaign-entry");
      tid = entry.data('tid');
      return $.ajax(Routes.dashboard_carrots_campaign_action_path("play", tid), {
        dataType: 'json',
        success: function() {
          return entry.addClass('playing').removeClass('paused');
        },
        error: function(data) {
          return alert(data.responseJSON.message);
        },
        beforeSend: function() {
          return showBoxLoading("#step-new .step-carrots-campaigns", {
            text: 'Starting Campaign...'
          });
        },
        complete: function() {
          return hideBoxLoading("#step-new .step-carrots-campaigns");
        }
      });
    });
    return $("#step-new .campaings-holder .delete-campaign-btn:not(.campaignsControlButtonBinded)").addClass("campaignsControlButtonBinded").on('click', function(e) {
      var entry, tid;
      e.preventDefault();
      entry = $(this).parents(".campaign-entry");
      tid = entry.data('tid');
      return $.ajax(Routes.dashboard_carrots_campaign_action_path("delete", tid), {
        dataType: 'json',
        success: function() {
          entry.addClass('deleted');
          if ($('#step-new .campaings-holder .campaign-entry').filterVisible().length === 0) {
            return $("#step-new").removeClass('show-list').addClass('show-banner');
          }
        },
        error: function(data) {
          return alert(data.responseJSON.message);
        },
        beforeSend: function() {
          return showBoxLoading("#step-new .step-carrots-campaigns", {
            text: 'Deleting Campaign...'
          });
        },
        complete: function() {
          return hideBoxLoading("#step-new .step-carrots-campaigns");
        }
      });
    });
  };

  window.refreshCampaignList = function() {
    return $.get(Routes.dashboard_customer_discovery_path({
      page: 'html'
    }), function(data) {
      $("#customer-discovery-tab").replaceWith(data);
      initCarrot();
      return bindTrackingActions();
    });
  };

  window.resetCampaign = function() {
    var $slider;
    $("#form-publish-customer-discovery input[type=text],#form-publish-customer-discovery textarea ").each(function() {
      $(this).val("");
      return $(this).trigger('change');
    });
    $("#form-publish-customer-discovery .sel-button.js-all").click();
    $slider = $('#form-publish-customer-discovery #age-range-slider');
    $slider.slider('values', 0, 18);
    $slider.slider('values', 1, 75);
    onSlideAge(18, 75);
    $slider = $("#form-publish-customer-discovery #distance-slider");
    $slider.slider('value', 50.0);
    onMilesChange(50.0);
    $("#form-publish-customer-discovery #run_continuously").click();
    return $("#form-publish-customer-discovery .offerSelect").val("0").trigger("change");
  };

  initCampaignListPage = function() {
    return bindCampaignListButtons();
  };

  initValidations = function() {
    var errorClass, validClass;
    errorClass = "error";
    validClass = "valid";
    $.validator.addMethod('lesserThan', (function(value, ele, target) {
      return this.optional(ele) || parseFloat(value) < parseFloat($(ele).parents('form').find(target).val());
    }), 'New price must be lower than original price');
    $.validator.addMethod("phoneRegex", (function(value, element) {
      return /^[0-9\-\(\)\ ]+$/i.test(value);
    }), 'Uh-oh, your phone number is incorrect');
    $("#form-publish-customer-discovery").validate({
      onkeyup: false,
      errorElement: 'em',
      errorClass: 'validation-error',
      highlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
      },
      rules: {
        reward: {
          required: true,
          minlength: 5,
          maxlength: 60
        },
        limit: {
          min: 1,
          required: {
            depends: function(e) {
              return $('#form-publish-customer-discovery input[type=radio][name=run]:checked').val() === 'limit';
            }
          }
        },
        old_price: {
          required: {
            depends: function(e) {
              return $("#form-publish-customer-discovery #unlock-type").val() === '1';
            }
          }
        },
        price: {
          number: true,
          lesserThan: '#old_price',
          required: {
            depends: function(e) {
              return $("#form-publish-customer-discovery #unlock-type").val() === '1';
            }
          }
        },
        phone: {
          minlength: 9,
          phoneRegex: {
            depends: function(e) {
              return $("#form-publish-customer-discovery #unlock-type").val() === '2';
            }
          },
          maxlength: 15,
          required: {
            depends: function(e) {
              return $("#form-publish-customer-discovery #unlock-type").val() === '2';
            }
          }
        }
      },
      messages: {
        reward: {
          required: "Please insert a reward",
          minlength: "Your carrot is too short (minimum of 5 characters)"
        },
        limit: {
          required: 'Please insert a limit',
          min: 'Please insert a number greater than 0'
        },
        phone: {
          minlength: "Please insert a valid phone"
        }
      }
    });
    checkForPhoneIPMasks($(".phoneToCall"));
    return forceNumericality($(".phoneToCall"));
  };

  window.initCarrot = function() {
    bindNavigation();
    initChooseAudiencePage();
    initCreateCampaignPage();
    initCampaignListPage();
    resetCampaign();
    initValidations();
    showReceivedJoinedUsersQtip();
    $("#customer-discovery-tab .campaings-holder").mCustomScrollbar({
      axis: "y",
      theme: 'dark-thick'
    });
    bindSelectric();
    setTimeout(function() {
      return $("#customer-discovery-tab .ele-selectric-tooltip").qtip({
        position: {
          my: 'right center',
          at: 'left center',
          adjust: {
            x: -100
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow selectric-qtip'
        }
      });
    }, 1500);
    if (window.location.hash === "#show-carrots-pricing") {
      showAjaxCarrotsPricing();
    } else {
      if (!window.carrots_quick_launch_visible && !gon.show_carrots_quicklaunch) {
        if (!window.location.href.match(/new$/)) {
          gotoStep("#step-new");
        }
      }
    }
    if (window.carrots_action1_binded === void 0) {
      $(document).on('ajax:beforeSend', '.form-publish-customer-discovery', function(event, data) {
        return showBoxLoading("#step-publish-and-track .step-main-area", {
          text: 'Publishing...'
        });
      });
      window.carrots_action1_binded = true;
    }
    if (window.carrots_action2_binded === void 0) {
      $(document).on('ajax:success ajax:error', '.form-publish-customer-discovery', function(event, data) {
        hideBoxLoading("#step-publish-and-track .step-main-area");
        return hideBoxLoading();
      });
      window.carrots_action2_binded = true;
    }
    if (window.carrots_action3_binded === void 0) {
      $(document).on('ajax:success', '.form-publish-customer-discovery', function(event, data) {
        console.log(data);
        if (data.response === 'show_pricing') {
          return showAjaxCarrotsPricing(data.return_url);
        } else {
          showAjaxCarrotsCampaignLightbox();
          refreshCampaignList();
          $("#step-new").removeClass('show-banner').addClass('show-list');
          gotoStep("#step-new");
          return showReceivedJoinedUsersQtip();
        }
      });
      return window.carrots_action3_binded = true;
    }
  };

  window.customer_discover_go_to_step = gotoStep;

}).call(this);
(function() {
  var DesignAppObj;

  DesignAppObj = (function() {
    DesignAppObj.INSTANCES = [];

    DesignAppObj.clean_empty_instances = function() {
      var inst;
      inst = [];
      $.each(DesignAppObj.INSTANCES, function(i, v) {
        if (v && v.container_exists()) {
          return inst.push(v);
        }
      });
      return DesignAppObj.INSTANCES = inst;
    };

    function DesignAppObj(container, image_width, options) {
      var d_opts;
      this.image_width = image_width;
      if (options == null) {
        options = {};
      }
      d_opts = {
        bt_icons_folder: null,
        show_loading: showCogLoadingOverlay,
        hide_loading: hideCogLoadingOverlay,
        build_app_values: gon.build_app_values,
        default_cover_img: path_to_image('dashboard3/quick-launch-default-bg.jpg'),
        colors: gon.build_app_colors1_sliced,
        fancybox_opts: {},
        spectrum_opts: {}
      };
      DesignAppObj.INSTANCES.push(this);
      this.container = $(container).first();
      this.business_image_cropbox = this.container.find('.js-business-image-cropbox');
      this.options = $.extend(true, d_opts, options);
      this.crop_x = this.options.crop_x;
      this.crop_y = this.options.crop_y;
      this.crop_w = this.options.crop_w;
      this.crop_h = this.options.crop_h;
      this.business_logo_bind_jcrop_functions();
      this.cover_image_new_bind_functions();
      this.bind_color_functions();
      this.update();
    }

    DesignAppObj.prototype.container_exists = function() {
      return this.container.parents('html').length !== 0;
    };

    DesignAppObj.prototype.update_from_remote = function() {
      var obj;
      obj = this;
      return $.getJSON(Routes.ajax_get_build_app_vars_path(), null, function(data) {
        $.extend(true, gon, data);
        return obj.update();
      });
    };

    DesignAppObj.prototype.update = function() {
      var obj, src_value;
      obj = this;
      if (obj.options.build_app_values.business_logo_has_image) {
        this.container.find(".js-business-image-cropbox").attr('src', obj.options.build_app_values.business_logo_uris.orig);
        this.container.find("img.business_logo_orig").attr("src", obj.options.build_app_values.business_logo_uris.orig);
        this.container.find("img.business_logo_thumb, img.thumb-preview, img.js-business-logo-preview-img-thumb, img.js_img_thumb_src").attr("src", obj.options.build_app_values.business_logo_uris.thumb);
        this.container.find("img.business_logo_small").attr("src", obj.options.build_app_values.business_logo_uris.small);
        this.container.find(".js-bl-preview").attr("src", obj.options.build_app_values.business_logo_uris.small);
        this.container.find(".js-bl-preview-movable").attr("src", obj.options.build_app_values.business_logo_uris.thumb);
        this.container.find(".js-bl-preview-movable").attr('style', '');
        $(".js-global-bl-preview").attr("src", obj.options.build_app_values.business_logo_uris.small);
      } else {
        if (this.options.bt_icons_folder) {
          src_value = this.options.bt_icons_folder + "/" + obj.options.build_app_values.business_category_id + ".png";
          this.container.find(".js-bl-preview").attr("src", src_value);
          $(".js-global-bl-preview").attr("src", src_value);
        } else {
          src_value = build_generic_business_logo_link(obj.options.build_app_values.business_category_id);
          this.container.find(".js-bl-preview").attr("src", src_value);
          $(".js-global-bl-preview").attr("src", src_value);
        }
      }
      obj.container.find('.js-current-cover-image, .js-generic-cover-image').removeClass('selected');
      console.log("obj.options.build_app_values.cover_image_selected_type", obj.options.build_app_values.cover_image_selected_type);
      console.log("obj.options.build_app_values", obj.options.build_app_values);
      switch (obj.options.build_app_values.cover_image_selected_type) {
        case 'blank':
          this.container.find(".build-app-phone .js-cover-preview").attr("src", obj.options.default_cover_img);
          $(".js-global-cover-preview").attr("src", obj.options.default_cover_img);
          this.container.find(".js-current-cover-image").hide();
          break;
        case 'user':
          this.container.find(".js-cover-preview").attr("src", obj.options.build_app_values.cover_image_new_uris.small);
          $(".js-global-cover-preview").attr("src", obj.options.build_app_values.cover_image_new_uris.small);
          this.container.find(".js-current-cover-image").show();
          this.container.find(".js-current-cover-image").addClass('selected');
          break;
        case 'generic':
          this.container.find(".js-build-app-phone .js-cover-preview").attr("src", obj.options.build_app_values.selected_generic_cover_photo_path);
          $(".js-global-cover-preview").attr("src", obj.options.build_app_values.selected_generic_cover_photo_path);
          this.container.find(".js-generic-cover-image-" + obj.options.build_app_values.selected_generic_cover_photo).addClass('selected');
      }
      return obj.should_be_loading = false;
    };

    DesignAppObj.prototype.show_cover_image_select_photo_block = function() {
      var obj;
      obj = this;
      return obj.container.find('.js-cover-image-select-photo').show('fade', function() {
        return obj.container.find(".js-cover-image-select-photo .js-cover-container").mCustomScrollbar("scrollTo", $('.js-current-cover-image.selected, .js-generic-cover-image.selected').position().left - 182, {
          scrollInertia: 0
        });
      });
    };

    DesignAppObj.prototype.hide_cover_image_select_photo_block = function() {
      var obj;
      obj = this;
      return obj.container.find('.js-cover-image-select-photo').hide('fade');
    };

    DesignAppObj.prototype.cover_image_new_bind_functions = function() {
      var obj;
      obj = this;
      this.container.find(".js-cover-image-select-photo .js-cover-container").mCustomScrollbar({
        axis: "x",
        theme: 'inset',
        setLeft: 0,
        scrollInertia: 0
      });
      this.container.find(".js-current-cover-image, .js-generic-cover-image").on('click', function(e) {
        var generic_photo, path;
        e.preventDefault();
        obj.container.find('.js-current-cover-image, .js-generic-cover-image').removeClass('selected');
        $(this).addClass('selected');
        generic_photo = $(this).data('generic');
        if (generic_photo) {
          path = Routes.dashboard_set_generic_cover_image_path({
            generic: generic_photo
          });
        } else {
          path = Routes.dashboard_set_generic_cover_image_path();
        }
        return $.getJSON(path, function(data) {
          console.log("getting path:", path);
          console.log("data: ", data);
          obj.set_business_logo_vars(data);
          return obj.update();
        });
      });
      this.container.find('.js-choose-photo-cover-btn').on('click', function(e) {
        e.preventDefault();
        return obj.show_cover_image_select_photo_block();
      });
      this.container.find('.js-close-cover-block-btn, .js-close-cover-block').on('click', function(e) {
        e.preventDefault();
        return obj.hide_cover_image_select_photo_block();
      });
      this.container.find('.js-cover-upload-link').on('click', function(e) {
        e.preventDefault();
        if (gon.provider === 'wix') {
          return obj.openWixDialogForCoverImage();
        } else {
          return obj.container.find(".js-cover-image-new").trigger('click');
        }
      });
      obj.container.find(".js-cover-update-form").ajaxForm({
        dataType: 'json',
        success: function(data) {
          return obj.processCoverImageResponse(data);
        }
      });
      obj.container.find('.js-cover-update-form').on('submit', function() {
        return obj.options.show_loading();
      });
      return obj.container.find(".js-cover-update-form").on('change', function() {
        obj.options.show_loading();
        return $(this).submit();
      });
    };

    DesignAppObj.prototype.set_business_logo_vars = function(data) {
      var obj;
      obj = this;
      obj.options.build_app_values = data.build_app_values;
      if (obj.options.build_app_values.business_logo_has_image) {
        return this.container.find('a.js-bl-link-block').text('Edit thumbnail');
      } else {
        return this.container.find('a.js-bl-link-block').text('Upload Image');
      }
    };

    DesignAppObj.prototype.business_logo_update_crop = function(coords) {
      var obj, orig_height, orig_width, original_height, original_width, original_width_height, ratio, rx, ry, width_height;
      obj = this;
      rx = this.image_width / coords.w;
      ry = this.image_width / coords.h;
      orig_width = 300;
      orig_height = 300;
      width_height = obj.options.build_app_values.business_logo_geometry.original.split('x');
      original_width = parseInt(width_height[0]);
      original_height = parseInt(width_height[1]);
      original_width_height = original_width;
      if (original_height > original_width) {
        original_width_height = original_height;
      }
      if (!(original_width_height > 300)) {
        original_width_height = 300;
      }
      this.container.find(".js-bl-preview-movable").css({
        width: Math.round(rx * orig_width) + "px",
        height: Math.round(ry * orig_height) + "px",
        marginLeft: "-" + Math.round(rx * coords.x) + "px",
        marginTop: "-" + Math.round(ry * coords.y) + "px"
      });
      ratio = original_width_height / orig_width;
      this.crop_x = Math.round(coords.x * ratio);
      this.crop_y = Math.round(coords.y * ratio);
      this.crop_w = Math.round(coords.w * ratio);
      return this.crop_h = Math.round(coords.h * ratio);
    };

    DesignAppObj.prototype.business_logo_bind_jcropt = function() {
      var h, obj, orig_height, orig_width, original_height, original_width, original_width_height, ratio, sel_height, sel_width, sel_x_starting_point, sel_y_starting_point, setSelectValues, w, width_height, x, y;
      obj = this;
      if (!obj.options.build_app_values.business_logo_has_image) {
        return;
      }
      this.container.find('.js-bl-preview-movable').attr('src', obj.options.build_app_values.business_logo_uris.orig);
      orig_width = 300;
      orig_height = 300;
      width_height = obj.options.build_app_values.business_logo_geometry.original.split('x');
      original_width = parseInt(width_height[0]);
      original_height = parseInt(width_height[1]);
      original_width_height = original_width;
      if (original_height > original_width) {
        original_width_height = original_height;
      }
      if (!(original_width_height > 300)) {
        original_width_height = 300;
      }
      ratio = original_width_height / orig_width;
      if ($.isEmptyObject(obj.options.build_app_values.business_logo_crop_values)) {
        orig_width = obj.options.build_app_values.business_logo_geometry.orig.split('x')[0];
        orig_height = obj.options.build_app_values.business_logo_geometry.orig.split('x')[1];
        sel_width = Math.round(orig_width - (orig_width / 100 * 20));
        sel_height = Math.round(orig_height - (orig_height / 100 * 20));
        sel_x_starting_point = Math.round(orig_width / 2 - sel_width / 2);
        sel_y_starting_point = Math.round(orig_height / 2 - sel_height / 2);
        setSelectValues = [sel_x_starting_point, sel_y_starting_point, sel_x_starting_point + sel_width, sel_y_starting_point + sel_height];
      } else {
        x = obj.options.build_app_values.business_logo_crop_values.crop_x / ratio;
        y = obj.options.build_app_values.business_logo_crop_values.crop_y / ratio;
        w = obj.options.build_app_values.business_logo_crop_values.crop_w / ratio;
        h = obj.options.build_app_values.business_logo_crop_values.crop_h / ratio;
        setSelectValues = [Math.round(x), Math.round(y), Math.round(x + w), Math.round(y + h)];
      }
      if (obj.container.find(".js-bl-upload-image-block").is(":visible")) {
        obj.JcropAPI = this.business_image_cropbox.data('Jcrop');
        if (obj.JcropAPI) {
          obj.JcropAPI.release();
          obj.JcropAPI.disable();
          obj.JcropAPI.setImage(this.business_image_cropbox.attr("src"));
          obj.JcropAPI.enable();
          obj.JcropAPI.setOptions({
            setSelect: setSelectValues
          });
        } else {
          this.business_image_cropbox.Jcrop({
            onChange: function(c) {
              return obj.business_logo_update_crop(c);
            },
            onSelect: function(c) {
              return obj.business_logo_update_crop(c);
            },
            minSize: [50, 50],
            setSelect: setSelectValues,
            aspectRatio: 1,
            onRelease: function() {
              return this.setSelect(setSelectValues);
            },
            allowSelect: false
          });
        }
      }
      return false;
    };

    DesignAppObj.prototype.business_logo_unbind_jcrop_functions = function() {
      var obj;
      obj = this;
      if (!obj.options.build_app_values.business_logo_has_image) {
        return;
      }
      if (obj.JcropAPI) {
        obj.JcropAPI.release();
        obj.JcropAPI.disable();
      }
      this.container.find('img.js-bl-preview').attr('src', obj.options.build_app_values.business_logo_uris.thumb);
      return this.container.find('img.js-bl-preview').attr('style', '');
    };

    DesignAppObj.prototype.business_logo_open_upload_block = function() {
      var obj;
      obj = this;
      return this.container.find('.js-bl-upload-image-block').show('fade', function() {
        return obj.business_logo_bind_jcropt();
      });
    };

    DesignAppObj.prototype.business_logo_close_upload_block_without_closing = function() {
      var $block, $button;
      $button = this.container.find('a.js-bl-link-block');
      $button.data("link-disabled", true);
      $block = this.container.find($button.data("block"));
      this.business_logo_unbind_jcrop_functions();
      $button.data("link-disabled", false);
      return $button.data("imageblockopen", false);
    };

    DesignAppObj.prototype.business_logo_close_upload_block = function() {
      var obj;
      obj = this;
      obj.container.find('.js-bl-upload-image-block').hide('fade');
      return obj.update();
    };

    DesignAppObj.prototype.is_business_logo_crop_block_visible = function() {
      var obj;
      obj = this;
      return this.container.find('.js-bl-upload-image-block').is(":visible");
    };

    DesignAppObj.prototype.business_logo_bind_jcrop_functions = function() {
      var obj;
      obj = this;
      this.container.find('a.js-bl-crop-save').on('click', function(e) {
        var params;
        e.preventDefault();
        obj.options.show_loading();
        params = {
          'business_logo[crop_x]': obj.crop_x,
          'business_logo[crop_y]': obj.crop_y,
          'business_logo[crop_w]': obj.crop_w,
          'business_logo[crop_h]': obj.crop_h,
          'business_logo[cropping_business_logo]': 1
        };
        return $.ajax({
          data: params,
          dataType: "json",
          url: Routes.dashboard_update_bl_crop_values_path(),
          type: 'POST',
          complete: function() {
            return obj.business_logo_close_upload_block();
          },
          success: function(data) {
            var orig_height, orig_width, width_height;
            if (!obj.should_be_loading) {
              obj.options.hide_loading();
            }
            if (data.response === "ok") {
              obj.set_business_logo_vars(data);
              width_height = obj.options.build_app_values.business_logo_geometry.orig.split('x');
              orig_width = parseInt(width_height[0]);
              orig_height = parseInt(width_height[1]);
              obj.container.find('.js-bl-preview-movable').attr('src', obj.options.build_app_values.business_logo_uris.orig);
              obj.business_image_cropbox.attr('src', obj.options.build_app_values.business_logo_uris.orig);
              $("img.js-global-bl-orig").attr("src", obj.options.build_app_values.business_logo_uris.orig);
              $("img.js-global-bl-thumb").attr("src", obj.options.build_app_values.business_logo_uris.thumb);
              return $("img.js-global-bl-small").attr("src", obj.options.build_app_values.business_logo_uris.small);
            }
          }
        });
      });
      this.container.find('.js-bl-change-image-file-link').on('click', function(e) {
        e.preventDefault();
        if (gon.provider === 'wix') {
          obj.openWixDialogForBusinessLogo();
        } else {
          obj.container.find(".js-bl-change-image-input").click();
        }
        return false;
      });
      obj.container.find(".js-bl-update-bl-form").ajaxForm({
        target: ".js-bl-preview-movable",
        dataType: 'json',
        error: function() {
          return obj.options.hide_loading();
        },
        success: function(data) {
          return obj.processBusinessLogoResponse(data);
        }
      });
      this.container.find(".js-bl-update-bl-form").on('change', function() {
        obj.options.show_loading();
        return $(this).submit();
      });
      this.container.find("a.js-bl-link-block").on("click", function(e) {
        e.preventDefault();
        if (obj.options.build_app_values.business_logo_has_image) {
          return obj.business_logo_open_upload_block();
        } else {
          if (gon.provider === 'wix') {
            return obj.openWixDialogForBusinessLogo();
          } else {
            return obj.container.find(".js-bl-change-image-input").click();
          }
        }
      });
      return this.container.find('a.js-close-ba-btn, .js-close-ba').on('click', function(e) {
        e.preventDefault();
        obj.business_logo_close_upload_block();
        return false;
      });
    };

    DesignAppObj.prototype.hideColorPicker = function() {
      var e, obj;
      obj = this;
      e = this.container.find('.color-picker-holder');
      if (e.is(":visible")) {
        e.hide();
        if (!gon.user_has_chosen_color) {
          return $.get(Routes.user_has_chosen_color_path()).success(function() {
            gon.user_has_chosen_color = true;
            e = obj.container.find('.color-chooser-section');
            if (e.length > 0) {
              return e.removeClass('error');
            }
          });
        }
      }
    };

    DesignAppObj.prototype.change_bg_color = function(color) {
      var e;
      lb_log("change_bg_color");
      this.container.find(".js-color1-assets").animate({
        backgroundColor: color
      }, 300);
      this.container.find(".js-app-color-1-field").wheelColorPicker('color', color);
      this.container.find(".js-app-color-1-field").val(color);
      this.container.find(".js-app-color-1-field, #cp_color_input").attr('data-color', color);
      this.container.find(".js-app-color-1-field, #cp_color_input").data('color', color);
      this.container.find(".js-app-color-1-field, #cp_color_input").attr('value', color);
      this.container.find('.js-ba-color-form').submit();
      if (typeof obj !== "undefined" && obj !== null) {
        obj.hideColorPicker();
      }
      if (window.custom_color_generated) {
        gon.user_has_chosen_color = true;
        e = this.container.find('.color-chooser-section');
        if (e.length > 0) {
          e.removeClass('error');
        }
      }
      return lb_log("end");
    };

    DesignAppObj.prototype.showColorPicker = function() {
      return this.container.find('.js-color-picker-holder').show('fade');
    };

    DesignAppObj.prototype.updateColor1Assets = function(color) {
      var obj;
      obj = this;
      obj.container.find('.color1-assets, .js-color1-assets').css('background-color', color);
      $('.js-global-color1-assets').css('background-color', color);
      return obj.container.find('.display-input-value .color-value').val(color);
    };

    DesignAppObj.prototype.bind_color_functions = function() {
      var cp_color_input, obj, s_opts;
      this.hideColorPicker();
      obj = this;
      this.container.find('.js-color-picker-btn').on('click', function(e) {
        e.preventDefault();
        return obj.showColorPicker();
      });
      this.container.find(".js-close-cp-btn, .js-close-cp").on('click', function(e) {
        e.preventDefault();
        obj.hideColorPicker();
        return obj.container.find('.js-ba-color-form').submit();
      });
      s_opts = $.extend(true, {
        flat: false,
        showInput: true,
        preferredFormat: "hex6",
        allowEmpty: true,
        showInitial: true,
        showPalette: true,
        showButtons: true,
        palette: obj.options.colors,
        change: function(color) {
          obj.container.find(".js-app-color-1-field").val(color.toHexString());
          obj.change_bg_color(color.toHexString());
          return false;
        }
      }, obj.options.spectrum_opts);
      this.$color_picker_input = this.container.find("#app_color_1");
      this.$color_picker_input.wheelColorPicker({
        layout: 'block',
        quality: 2,
        sliders: 'v'
      });
      this.$color_picker_input.on('change', function() {
        return obj.options.onColorChangeCallback && obj.options.onColorChangeCallback(38);
      });
      $('body').on('mouseup', '.jQWCP-wWidget', this.$color_picker_input, function(event, data) {
        var color;
        obj.$color_picker_input.wheelColorPicker('color', $(this).data('color'));
        color = obj.$color_picker_input.wheelColorPicker('color');
        obj.container.find('.predefined-colors-holder a.color').removeClass('selected');
        return obj.updateColor1Assets("#" + color);
      });
      this.container.find('.predefined-colors-holder a.color').on('click', function(e) {
        var color;
        e.preventDefault();
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
        color = $(this).data('color');
        obj.$color_picker_input.wheelColorPicker('color', color);
        obj.$color_picker_input.attr('value', color);
        obj.updateColor1Assets(color);
        obj.hideColorPicker();
        if (!gon.user_has_chosen_color) {
          return $.get(Routes.user_has_chosen_color_path()).success(function() {
            gon.user_has_chosen_color = true;
            e = obj.container.find('.color-chooser-section');
            if (e.length > 0) {
              e.removeClass('error');
            }
            return obj.container.find('.js-ba-color-form').submit();
          });
        } else {
          return obj.container.find('.js-ba-color-form').submit();
        }
      });
      cp_color_input = this.container.find('#cp_color_input');
      return cp_color_input.on('blur', function(e) {
        var color, v;
        v = $(this).val();
        if (v.match(/^#(?:[0-9a-f]{3}){1,2}$/i)) {
          $(this).data('color', v);
          obj.$color_picker_input.wheelColorPicker('color', v);
          obj.$color_picker_input.attr('value', v);
          obj.updateColor1Assets(v);
          obj.hideColorPicker();
          if (!gon.user_has_chosen_color) {
            return $.get(Routes.user_has_chosen_color_path()).success(function() {
              gon.user_has_chosen_color = true;
              e = obj.container.find('.color-chooser-section');
              if (e.length > 0) {
                e.removeClass('error');
              }
              return obj.container.find('.js-ba-color-form').submit();
            });
          } else {
            return obj.container.find('.js-ba-color-form').submit();
          }
        } else {
          color = $(this).data('color');
          return $(this).val(color);
        }
      });
    };

    DesignAppObj.prototype.openWixDialogForBusinessLogo = function() {
      var obj;
      obj = this;
      Wix.Dashboard.openMediaDialog(Wix.Settings.MediaType.IMAGE, false, function(data) {
        var imageUrl;
        imageUrl = Wix.Utils.Media.getImageUrl(data.relativeUri);
        obj.options.show_loading();
        $.ajax({
          url: "/business_color_schemes/update_business_logo_image_wix",
          data: {
            i: imageUrl
          },
          success: function(data) {
            return obj.processBusinessLogoResponse(data);
          }
        });
      });
    };

    DesignAppObj.prototype.openWixDialogForCoverImage = function() {
      var obj;
      obj = this;
      Wix.Dashboard.openMediaDialog(Wix.Settings.MediaType.IMAGE, false, function(data) {
        var imageUrl;
        imageUrl = Wix.Utils.Media.getImageUrl(data.relativeUri);
        obj.options.show_loading();
        $.ajax({
          url: "/business_color_schemes/update_cover_image_new_image_wix",
          data: {
            i: imageUrl
          },
          success: function(data) {
            return obj.processCoverImageResponse(data);
          }
        });
      });
    };

    DesignAppObj.prototype.handleFbBusinessLogoExtract = function(img_url) {
      var imageUrl, obj;
      obj = this;
      imageUrl = img_url;
      obj.options.show_loading();
      return $.ajax({
        url: "/business_color_schemes/update_business_logo_image_from_url",
        data: {
          i: imageUrl
        },
        success: function(data) {
          obj.processBusinessLogoResponse(data, true);
        }
      });
    };

    DesignAppObj.prototype.handleFbCoverImageExtract = function(img_url) {
      var imageUrl, obj;
      obj = this;
      imageUrl = img_url;
      obj.options.show_loading();
      return $.ajax({
        url: "/business_color_schemes/update_cover_image_new_image_from_url",
        data: {
          i: imageUrl
        },
        success: function(data) {
          obj.processCoverImageResponse(data, true);
        }
      });
    };

    DesignAppObj.prototype.processCoverImageResponse = function(data, from_url) {
      var em_str, errormessage, i, j, len, obj, title;
      if (from_url == null) {
        from_url = false;
      }
      obj = this;
      if (data.response === "ok") {
        if (!from_url) {
          obj.options.onUploadCallback && obj.options.onUploadCallback(41);
        }
        obj.set_business_logo_vars(data);
        obj.update();
      } else {
        if (!obj.should_be_loading) {
          obj.options.hide_loading();
        }
        errormessage = [];
        console.log(data);
        if (data.errors !== undefined && data.errors.cover_image_new_content_type !== undefined) {
          errormessage.push("Invalid content type. Valid content types are jpg, png and gif.");
        }
        if (data.errors !== undefined && data.errors.cover_image_new_file_size !== undefined) {
          errormessage.push("File size " + data.errors.cover_image_new_file_size);
        } else {
          errormessage.push("An error has occurred!");
        }
        em_str = "";
        for (j = 0, len = errormessage.length; j < len; j++) {
          i = errormessage[j];
          em_str += "<p>" + i + "</p>";
        }
        title = "Error";
        $.fancybox("<h1>" + title + "</h1>" + em_str);
      }
      if (!(from_url || obj.should_be_loading)) {
        return obj.options.hide_loading();
      }
    };

    DesignAppObj.prototype.processBusinessLogoResponse = function(data, from_url) {
      var em_str, errormessage, i, j, len, obj, orig_height, orig_width, theme_color, title, width_height;
      if (from_url == null) {
        from_url = false;
      }
      obj = this;
      if (data.response === "ok") {
        if (!from_url) {
          obj.options.onUploadCallback && obj.options.onUploadCallback(44);
        }
        obj.set_business_logo_vars(data);
        obj.container.find('.js-bl-preview-movable').attr('src', obj.options.build_app_values.business_logo_uris.orig);
        width_height = obj.options.build_app_values.business_logo_geometry.orig.split('x');
        orig_width = parseInt(width_height[0]);
        orig_height = parseInt(width_height[1]);
        obj.business_image_cropbox.attr('src', obj.options.build_app_values.business_logo_uris.orig);
        obj.container.find("img.business_logo_orig").attr("src", obj.options.build_app_values.business_logo_uris.orig);
        obj.container.find("img.business_logo_thumb, img.thumb-preview, img.js-business-logo-preview-img-thumb, img.js_img_thumb_src").attr("src", obj.options.build_app_values.business_logo_uris.thumb);
        obj.container.find("img.business_logo_small").attr("src", obj.options.build_app_values.business_logo_uris.small);
        obj.business_logo_bind_jcropt();
        if (from_url) {
          theme_color = data.dominant_color;
          obj.change_bg_color(theme_color);
          obj.container.find('.display-input-value .color-value').val(theme_color);
        }
      } else {
        obj.business_logo_unbind_jcrop_functions();
        errormessage = [];
        if (data.errors !== undefined && data.errors.business_logo_content_type !== undefined) {
          errormessage.push("Invalid content type. Valid content types are jpg, png and gif.");
        }
        if (data.errors !== undefined && data.errors.business_logo_file_size !== undefined) {
          errormessage.push("File size " + data.errors.business_logo_file_size);
        } else {
          errormessage.push("An error has occurred!");
        }
        em_str = "";
        for (j = 0, len = errormessage.length; j < len; j++) {
          i = errormessage[j];
          em_str += "<p>" + i + "</p>";
        }
        title = "Error";
        $.fancybox("<h1>" + title + "</h1>" + em_str);
        obj.business_logo_bind_jcropt();
      }
      if (!(from_url || obj.should_be_loading)) {
        return obj.options.hide_loading();
      }
    };

    return DesignAppObj;

  })();

  window.DesignAppObj = DesignAppObj;

}).call(this);
(function() {
  window.showPaymentsLightbox = function(plan, options) {
    var box_ele, ele, overlay, return_uri;
    if (options == null) {
      options = {};
    }
    box_ele = null;
    window.payments_lightbox_options = options;
    ele = "<div id=\"payments-lightbox-overlay\">\n  <div class=\"payments-lightbox-overlay-keypress\"><div>\n  <div class=\"cog-1 rotating-cog\"></div>\n</div>";
    overlay = $(ele).appendTo($("body"));
    overlay.find(".payments-lightbox-overlay-keypress").on('click', function(e) {
      e.preventDefault();
      if (options.onCancel) {
        options.onCancel();
      }
      lbTrackEvent("Lightbox_Payment_Page_Interaction", "canceled");
      unblurWrapper();
      overlay.removeClass('visible');
      if ($("#payments-lightbox-box").length > 0) {
        $("#payments-lightbox-box").removeClass('visible');
      }
      return setTimeout(function() {
        return overlay.remove();
      }, 1000);
    });
    setTimeout(function() {
      overlay.addClass('visible');
      return setTimeout(function() {
        return blurWrapper();
      }, 500);
    }, 200);
    return_uri = encodeURI(window.location.pathname);
    if (options.return_uri) {
      return_uri = encodeURI(options.return_uri);
    }
    return $.get("/dashboard/set-pricing-plan/" + plan + "?lightbox_version=1&return_uri=" + return_uri, function(data) {
      $("#payments-lightbox-overlay .cog").remove();
      box_ele = $(data).appendTo(overlay);
      return setTimeout(function() {
        box_ele.find("#payments-lightbox-box").addClass('visible');
        overlay.find(".rotating-cog").remove();
        return lbTrackEvent("Lightbox_Payment_Page_Interaction", "opened");
      }, 500);
    }).fail(function() {
      alert("Problems Loading...");
      unblurWrapper();
      return overlay.remove();
    });
  };

}).call(this);
(function() {
  window.initDashboardTabBotManager = function() {
    var _check_custom_valid, _clear_errors, _data_validates, _handleSetOnOff, _link_validates, _show_error, add_custom_count, get_custom_count, get_last_index_elem, handle_custom_add_display, handle_custom_form, send_reset_request, showDisconnectLightbox, success_callback_func, update_custom_ids;
    add_custom_count = false;
    window.isOpenFacebookPagesSelect();
    get_custom_count = function() {
      var k, n, ref, v;
      n = 0;
      ref = window.auto_chat_data;
      for (k in ref) {
        v = ref[k];
        if (window.auto_chat_data[k]['is_custom'] === "1") {
          n++;
        }
      }
      return n;
    };
    handle_custom_add_display = function() {
      if (get_custom_count() >= 20) {
        $(".add-custom-wrap-line").hide();
        return $(".limit-custom-wrap").show();
      } else {
        $(".add-custom-wrap-line").show();
        return $(".limit-custom-wrap").hide();
      }
    };
    $('#bot_manager_tab').on('click', '.add-custom-wrap-line', function(e) {
      var new_elem;
      if (get_custom_count() >= 20) {
        $(".add-custom-wrap-line").hide();
        $(".limit-custom-wrap").show();
      } else {
        if ($('.new-not-index.bot-manage-line').length > 0) {
          $('.new-not-index.bot-manage-line').effect("highlight", {}, 1000);
        } else {
          new_elem = $(".demo-line").clone(true);
          new_elem.removeClass('demo-line').insertBefore(".demo-line").addClass('new-not-index');
          lbTrackEvent("Bot_Manager_Tab_Interaction", "Add_Custom_Response");
        }
      }
      return handle_custom_add_display();
    });
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-manage-edit-btn', function(e) {
      var curr_elem;
      curr_elem = $(this).closest('.bot-manage-line');
      curr_elem.addClass('edit-open');
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Edit_Click");
    });
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-manage-cancel-btn', function(e) {
      var curr_elem, curr_wrap, elem_list;
      curr_wrap = $(this).closest('.bot-manage-line');
      if (curr_wrap.hasClass('new-not-index')) {
        curr_wrap.remove();
      } else {
        curr_elem = curr_wrap.find('.bot-changes-wrap');
        _clear_errors(curr_elem);
        elem_list = curr_elem.find('.bot-edit-section');
        elem_list.each(function() {
          var inner_edit, inner_img;
          inner_edit = $(this).find('.edit-input');
          inner_edit.each(function() {
            var curr_updt, elm, elm_attr;
            elm = $(this).data('updtid');
            elm_attr = $(this).data('updtfld');
            curr_updt = window.auto_chat_data[elm][elm_attr];
            return $(this).val(curr_updt);
          });
          inner_img = $(this).find('.thumb-image');
          return inner_img.each(function() {
            var curr_updt, elm;
            elm = $(this).closest('.bot-image-preview').data('updtid');
            curr_updt = window.auto_chat_data[elm]['image_url'];
            $(this).attr('src', curr_updt);
            if (!curr_updt || curr_updt === '') {
              $(this).remove();
              curr_elem.removeClass('image-added');
              return curr_elem.find('form .bot-photo-input').val(null);
            }
          });
        });
        curr_wrap.removeClass('edit-open');
      }
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Cancel_Click");
    });
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-add-link-btn', function(e) {
      var curr_elem;
      curr_elem = $(this).closest('.bot-changes-wrap');
      if (curr_elem.hasClass('link-added')) {
        curr_elem.find('.add-link-input').val('');
      }
      curr_elem.toggleClass('link-added');
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Add_Link_Click");
    });
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-delete-image-btn', function(e) {
      var curr_elem;
      curr_elem = $(this).closest('.bot-changes-wrap');
      curr_elem.addClass('delete_image_note');
      curr_elem.find('.thumb-image').remove();
      curr_elem.find('.update_auto_chat_edit .bot-photo-input').val(null);
      curr_elem.removeClass('image-added');
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Remove_Image_Success");
    });
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-add-image-btn', function(e) {
      var _cc, curr_elem;
      e.preventDefault();
      curr_elem = $(this).closest('.bot-changes-wrap');
      _cc = curr_elem.find('.bot-photo-input');
      return _cc.trigger('click');
    });
    $('#bot_manager_tab').on('change', '.bot-manage-line .bot-photo-input', function(e) {
      var curr_elem, f, file_size, files, image_holder, reader;
      curr_elem = $(this).closest('.bot-changes-wrap');
      lbTrackEvent("Bot_Manager_Tab_Interaction", "Add_Image_Click");
      files = !!this.files ? this.files : [];
      if (!files.length || !window.FileReader) {
        return;
      }
      image_holder = curr_elem.find('.bot-image-preview');
      image_holder.find('img').remove();
      if (/^image/.test(files[0].type)) {
        f = this.files[0];
        file_size = f.size || f.fileSize;
        if (file_size > 2000000) {
          alert("File size must not exceed 2MB. Please select a smaller image.");
          return;
        }
        if (f.type !== "image/jpeg" && f.type !== "image/png") {
          alert("File type is not supported. Please upload only JPG/JPEG/PNG typed files.");
          return;
        }
        reader = new FileReader;
        reader.readAsDataURL(files[0]);
        return reader.onloadend = function() {
          $('<img />', {
            'width': '110px',
            'height': '110px',
            'src': this.result,
            'class': 'thumb-image'
          }).appendTo(image_holder);
          image_holder.show();
          curr_elem.removeClass('delete_image_note');
          curr_elem.addClass('image-added');
          lbTrackEvent("Bot_Manager_Tab_Interaction", "Add_Image_Success");
        };
      } else {
        return alert("File type is not supported. Please upload only JPG/JPEG/PNG typed files.");
      }
    });
    _handleSetOnOff = function(idx, send_data) {
      return $.ajax(Routes.update_auto_chat_reg_path(), {
        data: {
          send_data: send_data
        },
        type: 'POST',
        success: function(data) {
          if (data.result && '0' === data.result.ERR) {
            return window.auto_chat_data = data.result.messages;
          }
        }
      });
    };
    $('#bot_manager_tab').on('click', '.flock-on-off-slider-holder', function(e) {
      var _this, gaNum, idx, is_cust, j, len, offId, send_data, set_active, set_custom;
      _this = $(this);
      gaNum = _this.data("ga");
      offId = _this.data('offid');
      is_cust = _this.data('iscustom');
      set_active = "0";
      if (_this.hasClass('off')) {
        set_active = "1";
      }
      set_custom = "0";
      if (is_cust) {
        set_custom = "1";
      }
      for (j = 0, len = offId.length; j < len; j++) {
        idx = offId[j];
        send_data = {
          auto_chat_text_id: idx,
          is_active: set_active,
          is_custom: set_custom
        };
        _handleSetOnOff(idx, send_data);
      }
      if (_this.hasClass('on')) {
        _this.addClass('off').removeClass('on');
        return lbTrackEvent("Bot_Manager_Tab_Interaction", "Reply_Off_" + gaNum + "_Disable");
      } else {
        _this.addClass('on').removeClass('off');
        return lbTrackEvent("Bot_Manager_Tab_Interaction", "Reply_On_" + gaNum + "_Enable");
      }
    });
    _check_custom_valid = function(curr_elem) {
      var is_valid;
      is_valid = false;
      if (curr_elem.find('.custom-input').val().trim() === '') {
        return [false, 'Please insert a custom question'];
      }
      if (curr_elem.find('.custom-bot-answer').val().trim() !== '') {
        return [true];
      }
      if (curr_elem.find('.add-link-input').val().trim() !== '') {
        return [true];
      }
      if (curr_elem.find('.thumb-image').length > 0) {
        return [true];
      }
      return [false, 'Please insert at least one answer type'];
    };
    _show_error = function(curr_elem, msg) {
      curr_elem.attr('data-error', msg);
      return curr_elem.addClass('not-valid');
    };
    _link_validates = function(curr_elem) {
      var link_val;
      if (curr_elem.find('.add-link-input').length === 0) {
        return true;
      }
      link_val = curr_elem.find('.add-link-input').val();
      if (link_val.trim() === '') {
        return true;
      }
      return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[\/?#]\S*)?$/i.test(link_val);
    };
    _clear_errors = function(curr_elem) {
      return curr_elem.removeClass('invalid-link not-valid');
    };
    handle_custom_form = function(curr_wrap) {
      var curr_elem, valid_response;
      curr_elem = curr_wrap.find('.bot-changes-wrap');
      valid_response = _check_custom_valid(curr_elem);
      if (valid_response[0]) {
        if (_link_validates(curr_elem)) {
          return curr_elem.each(function() {
            var elem_list, form_edit;
            form_edit = $(this).find('.update_auto_chat_edit');
            elem_list = $(this).find('.bot-edit-section');
            elem_list.each(function() {
              var inner_edit;
              inner_edit = $(this).find('.edit-input');
              return inner_edit.each(function() {
                var asdasd, elm_attr, elm_val;
                elm_attr = $(this).data('updtfld');
                if (elm_attr === 'link') {
                  asdasd = '.bot-form-link';
                } else if (elm_attr === 'question_auto_chat_text') {
                  asdasd = '.bot-form-question-text';
                } else {
                  asdasd = '.bot-form-text';
                }
                elm_val = $(this).val();
                if (elm_val) {
                  return form_edit.find(asdasd).val(elm_val);
                }
              });
            });
            _clear_errors(curr_elem);
            form_edit.submit();
            add_custom_count = true;
            return curr_wrap.removeClass('edit-open');
          });
        } else {
          return curr_elem.addClass('invalid-link');
        }
      } else {
        return _show_error(curr_elem, valid_response[1]);
      }
    };
    _data_validates = function(curr_elem) {
      if (curr_elem.hasClass('optional-wrap')) {
        return true;
      }
      if (curr_elem.find('.edit-input').first().val().trim() !== '') {
        return true;
      }
      if (curr_elem.find('.add-link-input').length && curr_elem.find('.add-link-input').val().trim() !== '') {
        return true;
      }
      if (curr_elem.find('.thumb-image').length > 0) {
        return true;
      }
      return false;
    };
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-manage-save-btn', function(e) {
      var _is_valid, curr_elem, curr_wrap;
      curr_wrap = $(this).closest('.bot-manage-line');
      lbTrackEvent("Bot_Manager_Tab_Interaction", "Save_Reply");
      if ($(this).hasClass('custom_save')) {
        return handle_custom_form(curr_wrap);
      }
      _is_valid = true;
      curr_elem = curr_wrap.find('.bot-changes-wrap');
      curr_elem.each(function() {
        var elem_list, form_edit;
        if (_data_validates($(this))) {
          if (_link_validates($(this))) {
            form_edit = $(this).find('.update_auto_chat_edit');
            elem_list = $(this).find('.bot-edit-section');
            elem_list.each(function() {
              var inner_edit;
              inner_edit = $(this).find('.edit-input');
              return inner_edit.each(function() {
                var asdasd, elm, elm_attr, elm_val;
                elm = $(this).data('updtid');
                elm_attr = $(this).data('updtfld');
                if (elm_attr === 'link') {
                  asdasd = '.bot-form-link';
                } else {
                  asdasd = '.bot-form-text';
                }
                elm_val = $(this).val();
                form_edit.find(asdasd).val(elm_val);
                return form_edit.find('.bot-form-id').val(elm);
              });
            });
            _clear_errors($(this));
            if ($(this).hasClass('delete_image_note')) {
              $(this).removeClass('delete_image_note');
              form_edit.find('.bot-is-image_delete').val(1);
            }
            return form_edit.submit();
          } else {
            $(this).addClass('invalid-link');
            return _is_valid = false;
          }
        } else {
          _show_error($(this), 'Please insert at least one answer type');
          return _is_valid = false;
        }
      });
      if (_is_valid) {
        return curr_wrap.removeClass('edit-open');
      }
    });
    $('#bot_manager_tab').on('submit', '.update_auto_chat_edit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).ajaxSubmit({
        success: success_callback_func
      });
      return false;
    });
    get_last_index_elem = function(indx) {
      return window.auto_chat_data[Object.keys(window.auto_chat_data)[Object.keys(window.auto_chat_data).length - indx]];
    };
    update_custom_ids = function() {
      var ansr_edit_wrap, ansr_id, ansr_obj, curr_wrap, new_elem, quest_edit_wrap, quest_id, quest_obj;
      curr_wrap = $('.new-not-index').last();
      new_elem = $(".after-custom-wrap").clone(true);
      quest_obj = get_last_index_elem(2);
      quest_id = quest_obj['auto_chat_text_id'];
      ansr_obj = get_last_index_elem(1);
      ansr_id = ansr_obj['auto_chat_text_id'];
      if (quest_obj['auto_chat_text']) {
        new_elem.find('.mark-email-text').text(quest_obj['auto_chat_text']);
      }
      if (ansr_obj['auto_chat_text']) {
        new_elem.find('.bot-sub-exp').text(ansr_obj['auto_chat_text']);
      }
      quest_edit_wrap = new_elem.find('.bot-changes-wrap').first();
      quest_edit_wrap.attr('data-indx', quest_id);
      quest_edit_wrap.find('.edit-input').val(quest_obj['auto_chat_text']);
      quest_edit_wrap.find('.edit-input').attr('data-updtid', quest_id);
      ansr_edit_wrap = new_elem.find('.bot-changes-wrap').last();
      if (ansr_obj['image_url']) {
        ansr_edit_wrap.addClass('image-added');
        ansr_edit_wrap.find('.thumb-image').attr('src', ansr_obj['image_url']);
      }
      if (ansr_obj['link']) {
        ansr_edit_wrap.addClass('link-added');
        ansr_edit_wrap.find('.add-link-input').val(ansr_obj['link']);
      }
      ansr_edit_wrap.attr('data-indx', ansr_id);
      ansr_edit_wrap.find('.custom-bot-answer').val(ansr_obj['auto_chat_text']);
      ansr_edit_wrap.find('.custom-bot-answer').attr('data-updtid', ansr_id);
      ansr_edit_wrap.find('.bot-image-preview').attr('data-updtid', ansr_id);
      ansr_edit_wrap.find('.add-link-input').attr('data-updtid', ansr_id);
      new_elem.find('.mark-email-preview').attr('data-element-attach', "#mark-email-" + ansr_id).attr('data-show-q', quest_id).attr('data-show-a', ansr_id);
      new_elem.find('.bot-campaign-preview.not-visible').attr('id', "mark-email-" + ansr_id);
      new_elem.find('.bot-manage-reset-btn').attr('data-updtid', '[' + ansr_id + ',' + quest_id + ']');
      new_elem.find('.flock-on-off-slider-holder').attr('data-offid', '[' + quest_id + ']');
      new_elem.removeClass('after-custom-wrap');
      curr_wrap.replaceWith(new_elem).removeClass('new-not-index');
      return add_custom_count = false;
    };
    success_callback_func = function(data) {
      if (data.result && '0' === data.result.ERR) {
        window.auto_chat_data = data.result.messages;
      }
      if (add_custom_count) {
        handle_custom_add_display();
        return update_custom_ids();
      }
    };
    send_reset_request = function(send_data, curr_wrap, curr_indx) {
      return $.ajax(Routes.delete_auto_chat_data_path(), {
        data: {
          send_data: send_data
        },
        type: 'GET',
        success: function(data) {
          var curr_upd, elem_list;
          if (data.result && '0' === data.result.ERR) {
            window.auto_chat_data = data.result.messages;
            if (!window.auto_chat_data[curr_indx] && curr_indx > 33) {
              curr_wrap.hide();
              return handle_custom_add_display();
            } else {
              curr_upd = curr_wrap.find('.bot-changes-wrap[data-indx="' + curr_indx + '"]');
              _clear_errors(curr_upd);
              elem_list = curr_upd.find('.bot-edit-section');
              return elem_list.each(function() {
                var inner_edit, inner_img;
                inner_edit = $(this).find('.edit-input');
                inner_edit.each(function() {
                  var curr_updt, elm_attr;
                  elm_attr = $(this).data('updtfld');
                  curr_updt = window.auto_chat_data[curr_indx][elm_attr];
                  $(this).val(curr_updt);
                  if (elm_attr === 'link') {
                    curr_upd.removeClass('link-added');
                    if (curr_updt) {
                      return curr_upd.addClass('link-added');
                    } else {

                    }
                  }
                });
                inner_img = $(this).find('.thumb-image');
                return inner_img.each(function() {
                  var curr_img;
                  curr_img = window.auto_chat_data[curr_indx]['image_url'];
                  if (curr_img) {
                    $(this).attr('src', curr_img);
                    return curr_upd.addClass('image-added');
                  } else {
                    $(this).remove();
                    curr_upd.removeClass('image-added');
                    return curr_upd.find('form .bot-photo-input').val(null);
                  }
                });
              });
            }
          }
        }
      });
    };
    $('#bot_manager_tab').on('click', '.bot-manage-line .bot-manage-reset-btn', function(e) {
      var curr_indx, curr_wrap, elm, i, j, len, send_data;
      curr_wrap = $(this).closest('.bot-manage-line');
      elm = $(this).data('updtid');
      curr_indx = 0;
      for (j = 0, len = elm.length; j < len; j++) {
        i = elm[j];
        curr_indx = i;
        send_data = {};
        send_data['auto_chat_text_id'] = curr_indx;
        send_reset_request(send_data, curr_wrap, curr_indx);
      }
      curr_wrap.removeClass('edit-open');
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Reset_Click");
    });
    $('#bot_manager_tab').on('click', '.mark-email-preview', function(e) {
      var $block, chat_left, chat_right, elem_a, elem_q, txt_a, txt_q;
      e.preventDefault();
      $block = $($(this).data("element-attach"));
      elem_q = $(this).data("show-q");
      elem_a = $(this).data("show-a");
      chat_left = $(this).closest('.bot-preview-wrap').find(".chat-bubble.left-tip");
      chat_right = $(this).closest('.bot-preview-wrap').find(".chat-bubble.right-tip");
      if (elem_q) {
        txt_q = window.auto_chat_data[elem_q]['auto_chat_text'];
        chat_left.text(txt_q);
      }
      if (elem_a) {
        txt_a = window.auto_chat_data[elem_a]['auto_chat_text'];
        chat_right.text(txt_a);
      }
      if (window.auto_chat_data[elem_a]['link']) {
        chat_right.addClass('add-link');
      }
      if (window.auto_chat_data[elem_a]['image_url']) {
        chat_right.addClass('add-image');
        chat_right.css('background-image', 'url(' + window.auto_chat_data[elem_a]['image_url'] + ')');
      }
      $block.toggleClass('not-visible');
      return lbTrackEvent("Bot_Manager_Tab_Interaction", "Preview_Click");
    });
    $('#bot_manager_tab').on('click', '.invisible-overlay', function(e) {
      return $(this).closest(".bot-campaign-preview").addClass("not-visible");
    });
    showDisconnectLightbox = function() {
      return $.fancybox({
        href: '#bot-disconnect-wrap-lightbox',
        padding: 0,
        autoSize: false,
        closeBtn: true,
        autoCenter: true,
        width: '666px',
        height: '542px',
        scrolling: 'no',
        wrapCSS: 'fancybox-skin-no-box',
        closeClick: false,
        tpl: {
          closeBtn: '<div style="position: fixed;top:0;right:0"><a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a></div>'
        },
        beforeShow: function() {
          return blurWrapper();
        },
        afterClose: function() {
          return unblurWrapper();
        }
      });
    };
    return $('#bot_manager_tab').on('click', '.bot-disable-btn', function(e) {
      return showDisconnectLightbox();
    });
  };

  window.initDashboardTabConversations = function() {
    window.isOpenFacebookPagesSelect();
    $('#conversations_tab').on('click', '.bot-conv-tabs .bot-top-tabs', function(e) {
      var _track, cur_classes;
      if (!$(this).hasClass('active')) {
        $('.bot-top-tabs').removeClass('active');
        cur_classes = $(this).prop('class').split(' ');
        cur_classes.splice(cur_classes.indexOf('bot-top-tabs'), 1);
        $('.bot-bottom-tabs').removeClass('active');
        $("." + cur_classes).addClass('active');
        _track = $(this).attr('data-ga');
        return lbTrackEvent("Conversations_Tab_Interaction", _track);
      }
    });
    bindOpenChatButtonClick('#conversations_tab', '.chat-line-btn', false);
    $('#conversations_tab').on('click', '.tab-waiting-rep .chat-line-btn', function(e) {
      var curr_data, curr_elem, curr_num_wrap, curr_val, is_unread;
      curr_elem = $(this).closest('.bot-chat-line');
      is_unread = curr_elem.hasClass('unread');
      curr_elem.remove();
      curr_num_wrap = $('.bot-top-tabs.tab-waiting-rep .tab-num');
      curr_val = parseInt(curr_num_wrap.text());
      curr_num_wrap.text(curr_val - 1);
      lbTrackEvent("Conversations_Tab_Interaction", "Chats_Need_Reply_Reply_Click");
      if (is_unread) {
        curr_data = parseInt(curr_num_wrap.attr('data-new'));
        curr_num_wrap.attr('data-new', curr_data - 1);
      }
      if ($('#conversations_tab .bot-bottom-tabs.tab-waiting-rep .bot-chat-line').length === 0) {
        $('#conversations_tab .bot-bottom-tabs.tab-waiting-rep .cleared-chat-wrap').show();
        return lbTrackEvent("Conversations_Tab_Interaction", "Chats_Need_Reply_All_Replied");
      }
    });
    return $('#conversations_tab').on('click', '.tab-all-chat .chat-line-btn', function(e) {
      var curr_data, curr_elem, curr_num_wrap, is_unread;
      curr_elem = $(this).closest('.bot-chat-line');
      is_unread = curr_elem.hasClass('unread');
      curr_num_wrap = $('.bot-top-tabs.tab-all-chat .tab-num');
      lbTrackEvent("Conversations_Tab_Interaction", "All_Chats_Chat_Open");
      if (is_unread) {
        curr_data = parseInt(curr_num_wrap.attr('data-new'));
        curr_num_wrap.attr('data-new', curr_data - 1);
        return curr_elem.removeClass('unread');
      }
    });
  };

}).call(this);
(function() {
  var doPositioning, serializeCheckboxes;

  doPositioning = function($ele, parent) {
    var $parent, left, top;
    $parent = $(parent);
    top = $parent.offset().top;
    left = $parent.offset().left;
    $ele.removeClass('pos-right pos-left');
    if (($ele.width() + left) > window.innerWidth) {
      return $ele.addClass('pos-left');
    } else {
      return $ele.addClass('pos-right');
    }
  };

  serializeCheckboxes = function($form) {
    var sel;
    sel = [];
    $form.find("input[type=checkbox]:checked").each(function() {
      return sel.push($(this).val());
    });
    return sel;
  };

  window.showSearchCustomersTip = function(parent, tid, price, id, clear) {
    var $parent, $tip, e;
    if (price == null) {
      price = 0;
    }
    if (id == null) {
      id = null;
    }
    if (clear == null) {
      clear = false;
    }
    if (id === null) {
      id = "search-customer-tip-" + tid;
    }
    if (!clear && $("#" + id).length !== 0) {
      $("#" + id).addClass('visible');
      return;
    }
    $parent = $(parent);
    e = "<div id=\"" + id + "\" class=\"search-customer-tip  loading pos-bottom none-selected\">\n  <div class=\"invisible-overlay\"></div>\n  <div class=\"main-section\">\n    <div class=\"search-field-wrapper\">\n      <input type=\"text\" class=\"search-field-input\" placeholder=\"Search for your customer\"/>\n      <div class=\"layout3-img layout3-img-find-users find-users-icn\"></div>\n    </div>\n    <form class='pack-checks-form'>\n      <div class=\"search-area-wrapper\"></div>\n    </form>\n    <div class=\"bottom-area\">\n      <a href=\"javascript:;\" class=\"unlock-btn js-confirm-btn\">UNLOCK</a>\n    </div>\n  </div>\n  <div class=\"loading-section\">\n    <div class=\"loading-icon layout-img layout-img-loading rotating-cog\"></div>\n  </div>\n</div>";
    $tip = $(e).appendTo($parent);
    doPositioning($tip, parent);
    $(window).resize(function() {
      return doPositioning($tip, parent);
    });
    $tip.find(".invisible-overlay").on('click', function(e) {
      return $tip.hide('fade', function() {
        $tip.removeClass('visible');
        return $tip.show();
      });
    });
    $tip.addClass('visible');
    return $.getJSON("/ajax/ajax_get_all_users_in_club_for_search/?token_id=" + tid, function(data) {
      var $form, $inp, $saw, eles;
      $saw = $tip.find(".search-area-wrapper");
      $inp = $tip.find(".search-field-input");
      eles = "";
      eles += "<form action='#'>";
      $.each(data.users, function() {
        var ele, show_picture;
        show_picture = this.picture_url && this.picture_url.trim() !== '';
        ele = "<div class='search-user search-user-" + this.user_id + "'>";
        if (!this.unlocked) {
          ele += '<div class=search-check-container>';
          ele += "<input type='checkbox' id='user_ids-" + this.user_id + "' name='user_ids-" + this.user_id + "' class='search-check  flok-check' value='" + this.user_id + "' />";
          ele += "<label for='user_ids-" + this.user_id + "'></label>";
          ele += '</div>';
        } else {
          ele += "<div class='layout3-img layout3-img-search-unlock unlocked-icn'></div>";
        }
        if (show_picture) {
          ele += "<div class='picture-holder'><img src='" + this.picture_url + "' /></div>";
        } else {
          ele += "<div class='picture-holder no-bg'><div class='layout3-img layout3-img-no-pic-pack-tip pic-icn'></div></div>";
        }
        ele += "  <div class=\"name\" title=\"" + this.name + "\">" + this.partial_name + "</div>\n  <div class=\"date\">" + this.date + "</div>\n</div>";
        return eles += ele;
      });
      eles += "</form>";
      $inp.on('change paste keyup', function() {
        var v_arr, values;
        v_arr = this.value.trim().replace(/[ ]+/, " ").split(" ");
        values = $.grep(data.users, function(e) {
          var i, re;
          i = 0;
          while (i < v_arr.length) {
            re = new RegExp(v_arr[i], 'gi');
            if (!e.name.match(re)) {
              return false;
            }
            i++;
          }
          return true;
        }, false);
        $saw.find(".search-user").hide();
        return $.each(values, function() {
          return $saw.find(".search-user-" + this.user_id).show();
        });
      });
      $("<div class='search-area'>" + eles + "</div>").appendTo($saw);
      $tip.removeClass('loading');
      $tip.find(".search-area-wrapper").mCustomScrollbar({
        axis: "y",
        theme: 'minimal',
        scrollInertia: 0
      });
      $form = $tip.find(".pack-checks-form");
      $form.on('change', function() {
        return $tip.toggleClass('none-selected', serializeCheckboxes($form).length === 0);
      });
      return $tip.find(".js-confirm-btn").on('click', function(e) {
        var sc, total_price;
        e.preventDefault();
        if ($tip.hasClass('none-selected')) {
          return;
        }
        sc = serializeCheckboxes($form);
        price = parseFloat(price);
        total_price = price * sc.length;
        return showCancelUnlockLightbox(sc.length, total_price, function() {
          sc = serializeCheckboxes($form);
          if (sc.length === 0) {
            return;
          }
          $tip.addClass('loading');
          return $.get("/ajax/ajax_token_unlock", {
            token_id: tid,
            users: sc
          }, function(data) {
            $tip.removeClass('visible');
            return setTimeout(function() {
              return $tip.remove();
            }, 650);
          }).error(function() {
            $tip.removeClass('loading');
            return alert("An error as ocurred!");
          });
        }, function() {
          return console.log("CANCELING");
        });
      });
    }).fail(function() {
      alert("An error as ocurred.");
      return $tip.remove();
    });
  };

}).call(this);
(function() {
  var $mainselector, _$, cancelToken, clearToken, enterToken, initAnimations, initHappyHoursToken, initTokenValidations, initTokens, leaveToken, setLoadingAnimationVisibility, showConfirmationDelete, showSendPushMessageLigthbox, transEndEventName, transEndEventNames, updateDescTips, updateUnlockType;

  transEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'transition': 'transitionend'
  };

  transEndEventName = transEndEventNames[Modernizr.prefixed('transition')];

  $mainselector = null;

  $.fn.clickOff = function(callback, selfDestroy) {
    var clicked, destroy, parent;
    clicked = false;
    parent = this;
    destroy = selfDestroy || true;
    parent.click(function() {
      clicked = true;
    });
    $(document).click(function(event) {
      if (!clicked) {
        callback(parent, event);
      }
      if (destroy) {
        console.log(destroy);
      } else {

      }
      clicked = false;
    });
  };

  _$ = function(selector) {
    return $mainselector.find(selector);
  };

  initAnimations = function() {
    return _$(".flip-container").on(transEndEventName, function() {
      var $fc;
      $fc = $($(this).parents(".flip-container").context);
      if ($fc.hasClass('faced-back')) {
        return $fc.parents(".flipper-holder").toggleClass('faced-back', true);
      } else {
        return $fc.parents(".flipper-holder").toggleClass('faced-back', false);
      }
    });
  };

  updateUnlockType = function(container, value) {
    _$(container).toggleClass('unlock-type-0 unlock-type-1 unlock-type-2', false);
    return _$(container).toggleClass("unlock-type-" + value, true);
  };

  setLoadingAnimationVisibility = function(element, visible) {
    var $ele, back_card, loading_animation;
    $ele = $(element);
    back_card = null;
    if ($ele.hasClass('back-card')) {
      back_card = $ele;
    } else {
      back_card = $ele.parents(".back-card");
    }
    loading_animation = back_card.find('.loading-animation');
    if (loading_animation.length === 0) {
      loading_animation = $("<div class='loading-animation'><div class='loading'></div></div>").appendTo(back_card);
    }
    return loading_animation.toggleClass('show', visible);
  };

  window.setDeleteAnimationVisibility = function(element, visible) {
    var $ele, front_card, loading_animation;
    $ele = $(element);
    front_card = null;
    if ($ele.hasClass('front-card')) {
      front_card = $ele;
    } else {
      front_card = $ele.parents(".front-card");
    }
    loading_animation = front_card.find('.loading-animation');
    if (loading_animation.length === 0) {
      loading_animation = $("<div class='loading-animation' style='z-index:9999990'><div class='loading'></div></div>").appendTo(front_card);
    }
    return loading_animation.toggleClass('show', visible);
  };

  window.getWorkingDaysAndHours = function(form) {
    var $form, fdata, formatHour, from, to, used_weekdays, wdays, weeknames;
    formatHour = function(hour) {
      return "" + (hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)) + (hour >= 12 && hour !== 24 ? 'PM' : 'AM');
    };
    $form = $(form);
    console.log("$form", $form);
    fdata = $form.serializeObject();
    wdays = [false, false, false, false, false, false, false];
    to = null;
    from = null;
    $.each(fdata, function(i, v) {
      if (i.match(/\[mon\]/) !== null) {
        wdays[0] = v === 'true';
      }
      if (i.match(/\[tue\]/) !== null) {
        wdays[1] = v === 'true';
      }
      if (i.match(/\[wed\]/) !== null) {
        wdays[2] = v === 'true';
      }
      if (i.match(/\[thu\]/) !== null) {
        wdays[3] = v === 'true';
      }
      if (i.match(/\[fri\]/) !== null) {
        wdays[4] = v === 'true';
      }
      if (i.match(/\[sat\]/) !== null) {
        wdays[5] = v === 'true';
      }
      if (i.match(/\[sun\]/) !== null) {
        wdays[6] = v === 'true';
      }
      if (i.match(/\[from\]/) !== null) {
        from = v;
      }
      if (i.match(/\[to\]/) !== null) {
        return to = v;
      }
    });
    weeknames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    used_weekdays = [];
    weeknames.forEach(function(v, i) {
      if (wdays[i]) {
        return used_weekdays.push(v);
      }
    });
    from = parseInt(from) / 100;
    console.log("to", to);
    if (parseInt(to) === 2359) {
      to = "2400";
    }
    to = parseInt(to) / 100;
    return (used_weekdays.join(", ")) + " " + (formatHour(from)) + "-" + (formatHour(to));
  };

  initTokenValidations = function() {
    var errorClass, validClass;
    errorClass = "error-inside";
    validClass = "valid-inside";
    $.validator.addMethod("phoneRegexCustom", (function(value, element) {
      if (parseInt($(element).parents("form").find(".select-unlock-type").val()) !== 2) {
        return true;
      }
      return /^[0-9\-\(\)\ ]{9,15}$/i.test(value);
    }), 'Please enter a valid phone number');
    $.validator.addMethod("happyWeekdays", (function(value, element) {
      var valid;
      valid = false;
      $(element).parents("form").find('.validate-days').each(function() {
        if ($(this).val() === "true") {
          return valid = true;
        }
      });
      console.log("Valid", valid);
      return valid;
    }), 'Must select at least one day.');
    _$(".general-token-form").each(function() {
      return $(this).validate({
        ignore: [],
        errorElement: 'span',
        errorClass: 'validation-error-inside',
        highlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").addClass(errorClass).removeClass(validClass);
        },
        unhighlight: function(element, errorClass, validClass) {
          return $(element).parents(".validate-field").removeClass(errorClass).addClass(validClass);
        }
      });
    });
    _$(".reward-text-field").each(function() {
      return $(this).rules('add', {
        required: true,
        minlength: 5,
        maxlength: 120
      });
    });
    _$(".validate-mon").each(function() {
      return $(this).rules('add', {
        happyWeekdays: true
      });
    });
    _$(".phone-field").each(function() {
      return $(this).rules('add', {
        phoneRegexCustom: true
      });
    });
    _$(".validate-new-price").each(function() {
      return $(this).rules("add", {
        number: true,
        min: 0.001,
        required: function(e) {
          return parseInt($(e).parents(".general-token-form").find('.select-unlock-type').val()) === 1;
        },
        floatlesserThan: function(e) {
          return $(e).parents(".general-token-form").find('.validate-old-price');
        },
        messages: {
          floatlesserThan: "New price must be less than old price",
          min: "Please enter a value bigger than $0"
        }
      });
    });
    _$(".validate-old-price").each(function() {
      return $(this).rules("add", {
        number: true,
        required: function(e) {
          return parseInt($(e).parents(".general-token-form").find('.select-unlock-type').val()) === 1;
        }
      });
    });
    return _$(".validate-phone").each(function() {
      return $(this).rules("add", {
        required: function(e) {
          return parseInt($(e).parents(".general-token-form").find('.select-unlock-type').val()) === 2;
        },
        minlength: 9,
        maxlength: 15,
        phoneRegex: true,
        messages: {
          required: "Phone number is required",
          minlength: "Please provide a valid phone number",
          maxlength: "Please provide a valid phone number"
        }
      });
    });
  };

  initTokens = function() {
    _$(".select-unlock-type").on('change', function() {
      var container, value;
      container = $(this).parents(".flip-container");
      value = $(this).val();
      return updateUnlockType(container, value);
    });
    _$(".general-token-form").on('ajax:success', function(data, d1) {
      var $container, $form;
      setLoadingAnimationVisibility(data.currentTarget, false);
      $form = $(data.currentTarget);
      $form.data('formData', JSON.stringify($form.serializeObject()));
      $form.parents(".flip-container").removeClass('empty-token');
      $container = $form.parents(".flip-container");
      $container.find('.stats-holder .stat .number').text('-');
      $container.find('.stats-holder .stat').removeClass('ftip-parent');
      $container.find('.stats-holder .stat .ftip').remove();
      $container.find(".delete-btn").data('tid', d1.tid);
      return leaveToken($form.parents(".flip-container"));
    }).on('ajax:error', function(data) {
      setLoadingAnimationVisibility(data.currentTarget, false);
      return alert("An error as ocurred");
    }).on('ajax:beforeSend', function(data) {
      return setLoadingAnimationVisibility(data.currentTarget, true);
    });
    _$(".token-save-btn").on('click', function(e) {
      var form;
      form = $(this).parents("form");
      return form.submit();
    });
    _$(".general-token-form").on('change', function() {
      var $days_group, $desc, $flipContainer, $new_price, $old_price, $reward, $unlock_type, opts, tokenPreviews, txt;
      $flipContainer = $(this).parents(".flip-container");
      $days_group = $(this).find('.days-group');
      $unlock_type = $(this).find('.select-unlock-type');
      $new_price = $(this).find('.new-price');
      $old_price = $(this).find('.old-price');
      $reward = $(this).find('.reward-text-field');
      tokenPreviews = $flipContainer.find('.token-preview').not(".no-update");
      opts = {};
      if ($days_group.length > 0) {
        txt = getWorkingDaysAndHours(this);
        $flipContainer.find('.offer-days').text(truncate(txt, {
          max: 30
        })).attr('title', txt);
        opts.wdays = txt;
      }
      if ($unlock_type.length > 0) {
        opts.unlock_type = $unlock_type.val();
      }
      if ($new_price.length > 0) {
        opts.new_price = parseFloat($new_price.val());
        if (isNaN(opts.new_price)) {
          opts.new_price = 0.0;
        }
        $flipContainer.find('.new-price').text("$" + opts.new_price);
      }
      if ($old_price.length > 0) {
        opts.old_price = parseFloat($old_price.val());
        if (isNaN(opts.old_price)) {
          opts.old_price = 0.0;
        }
        $flipContainer.find('.old-price').text("$" + opts.old_price);
      }
      if ($reward.length > 0) {
        opts.reward = $reward.val();
        $desc = $flipContainer.find('.with-token .desc');
        $desc.toggleClass('no-tip', opts.reward.length < 30);
        updateDescTips();
        if ($days_group.length > 0 && opts.unlock_type === '1') {
          $desc.text(truncate(opts.reward, {
            max: 30
          }));
          $desc.attr('title', opts.reward);
          $flipContainer.toggleClass('compress-desc', true);
        } else {
          $flipContainer.toggleClass('compress-desc', false);
          $desc.text(truncate(opts.reward, {
            max: 50
          }));
          $desc.attr('title', opts.reward);
        }
      }
      return updateTokenPreview(tokenPreviews, opts);
    }).trigger('change');
    _$("select").on('selectric-init', function() {
      return window.messages_qtips = $(".ele-selectric-tooltip").qtip({
        position: {
          my: 'left center',
          at: 'right center',
          adjust: {
            x: 45,
            y: 3
          }
        },
        style: {
          classes: 'qtip-tipsy qtip-rounded qtip-shadow selectric-qtip-2 right-selectric-qtip'
        },
        show: {
          delay: 500
        }
      });
    });
    forceNumericality(".js-force-numericality", true, false, 2);
    checkForPhoneIPMasks(".phone-field");
    _$('.reward-text-field').on('change paste keyup', function() {
      var $f;
      $f = $(this).parents('form').find(".text-field-count .count");
      return $f.text($(this).val().length);
    }).trigger('change');
    return updateDescTips();
  };

  updateDescTips = function() {
    return _$(".offer-days, .with-token .desc").not(".no-tip").qtip({
      position: {
        my: 'top center',
        at: 'bottom center',
        hide: {
          when: {
            event: 'click'
          }
        }
      },
      style: {
        classes: 'qtip-tipsy qtip-rounded qtip-shadow flok-qtip'
      }
    });
  };

  leaveToken = function(container) {
    container.toggleClass('hide-front-content', true);
    container.toggleClass('hide-back-content', true);
    setTimeout(function() {
      container.toggleClass('faced-back', false);
      container.toggleClass('faced-back', false);
      return setTimeout(function() {
        return container.toggleClass('hide-front-content', false);
      }, 600);
    }, 200);
    return container.find('.settings-tip').show();
  };

  enterToken = function(container) {
    var $flipper_holder, $form;
    $flipper_holder = container.parents('.flipper-holder');
    container.find('.settings-tip').hide();
    container.toggleClass('hide-front-content', true);
    container.toggleClass('hide-back-content', true);
    setTimeout(function() {
      $flipper_holder.toggleClass('faced-back', true);
      container.toggleClass('faced-back', true);
      return setTimeout(function() {
        return container.toggleClass('hide-back-content', false);
      }, 600);
    }, 200);
    $form = container.find("form.general-token-form");
    return $form.data('formData', JSON.stringify($form.serializeObject()));
  };

  cancelToken = function(container) {
    var $form, formData;
    container.toggleClass('no-field-anim', true);
    setTimeout(function() {
      return container.toggleClass('no-field-anim', false);
    }, 750);
    $form = container.find("form.general-token-form");
    formData = JSON.parse($form.data('formData'));
    $.each(formData, function(key, value) {
      var $element;
      $element = $form.find("[name='" + key + "']");
      if ($element.is("input[type=text], textarea")) {
        $element.val(value).trigger('change');
        return;
      }
      if ($element.is("select")) {
        $element.val(value).selectric("refresh").trigger('change');
      }
      if ($element.is("input[type=hidden]") && $element.hasClass('days-group')) {
        value = value === "true";
        $element.val(value).trigger('change');
        return $element.parents("li").toggleClass('on', value);
      }
    });
    return leaveToken(container);
  };

  initHappyHoursToken = function() {
    var numberToFormatedHour;
    numberToFormatedHour = function(n) {
      var s;
      s = n + "00";
      if (s.length === 3) {
        s = "0" + s;
      }
      return s;
    };
    _$("#form-token-interval .week-list a").on("click", function(e) {
      var $input, val;
      e.preventDefault();
      $input = $(this).find('input');
      val = $input.val() === "true";
      $input.val(!val);
      $input.trigger('change');
      $(this).parents('li').toggleClass('on', !val);
      return $('.validate-mon').valid();
    });
    return _$("#form-token-interval  .hh-from-selector").on('change', function() {
      var a, i, j, new_v, ref, s, to_v, v;
      v = parseInt($(this).val()) / 100;
      to_v = parseInt(_$("#form-token-interval  .hh-to-selector").val()) / 100;
      a = [];
      for (i = j = 1, ref = v; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        a.push("option[value='" + (numberToFormatedHour(i)) + "']");
      }
      if (a.length > 0) {
        s = a.join(",");
        if (to_v <= v) {
          new_v = v + 1 >= 24 ? 0 : v + 1;
          $("#boost-hours-lightbox  .hh-to-selector").val(numberToFormatedHour(new_v));
        }
        $("#boost-hours-lightbox  .hh-to-selector option").attr("disabled", false);
        $("#boost-hours-lightbox  .hh-to-selector").find(s).attr("disabled", true);
        return $("#boost-hours-lightbox  .hh-to-selector").selectric('refresh');
      }
    });
  };

  showConfirmationDelete = function(ondelete) {
    if (ondelete == null) {
      ondelete = null;
    }
    return $.fancybox({
      padding: 0,
      autoSize: false,
      closeBtn: true,
      autoCenter: true,
      width: '120%',
      height: '120%',
      scrolling: 'no',
      wrapCSS: 'fancybox-skin-no-box',
      type: 'inline',
      href: '#confirm-delete-token-lightbox',
      closeClick: false,
      tpl: {
        closeBtn: false
      },
      beforeShow: function() {
        return $("#confirm-delete-token-lightbox .delete-btn").one('click', function(e) {
          e.preventDefault();
          if (ondelete) {
            ondelete();
          }
          return $.fancybox.close();
        });
      }
    });
  };

  showSendPushMessageLigthbox = function(token_type, message, onSuccess) {
    return $.fancybox({
      padding: 0,
      autoSize: false,
      closeBtn: true,
      autoCenter: true,
      width: '120%',
      height: '120%',
      scrolling: 'no',
      wrapCSS: 'fancybox-skin-no-box',
      type: 'inline',
      href: '#tokens-push-message-lightbox',
      closeClick: false,
      tpl: {
        closeBtn: '<a title="Close" class="fancybox-item fancybox-close internal-close darkbox-close" href="javascript:;"></a>'
      },
      beforeShow: function() {
        var $text, business_name;
        $("#tokens-push-message-lightbox .phase-1").show();
        $("#tokens-push-message-lightbox .phase-2").hide();
        $text = $("#tokens-push-message-lightbox .reward-text");
        business_name = $("#tokens-push-message-lightbox .business-name").text();
        $text.text("You have a reward");
        return $("#tokens-push-message-lightbox .send-reminder-btn").one('click', function(e) {
          showBoxLoading("#tokens-push-message-lightbox .content-area", {
            text: ''
          });
          return $.get("/dashboard/send-token-as-push?type=" + token_type, function() {
            if (onSuccess) {
              onSuccess();
            }
            hideBoxLoading();
            return $("#tokens-push-message-lightbox .phase-1").hide('fade', function() {
              return $("#tokens-push-message-lightbox .phase-2").show('fade', function() {
                var txt;
                txt = "You have a reward from " + business_name + ": " + message;
                return $text.text(txt);
              });
            });
          }).fail(function() {
            hideBoxLoading();
            alert("An Error as ocurred!");
            return $.fancybox.close();
          });
        });
      }
    });
  };

  clearToken = function(container) {
    var $chance, $distance, $expiry_selector, $form, $new_price, $old_price, $phone_field, $reward, $unlock_type;
    container.addClass('empty-token');
    $form = container.find('.general-token-form');
    $reward = $form.find('.reward-text-field');
    if ($reward.length > 0) {
      $reward.val("").trigger("change");
    }
    $unlock_type = $form.find(".select-unlock-type");
    if ($unlock_type.length > 0) {
      $unlock_type.val($unlock_type.find("option").first().val()).selectric("refresh").trigger('change');
    }
    $old_price = $form.find('.old-price');
    if ($old_price.length > 0) {
      $old_price.val("").trigger("change");
    }
    $new_price = $form.find('.new-price');
    if ($new_price.length > 0) {
      $new_price.val("").trigger("change");
    }
    $phone_field = $form.find('.phone-field');
    if ($phone_field.length > 0) {
      $phone_field.val("").trigger("change");
    }
    $expiry_selector = $form.find(".expiry-selector");
    if ($expiry_selector.length > 0) {
      $expiry_selector.val($expiry_selector.find("option").first().val()).selectric("refresh").trigger('change');
    }
    $distance = $form.find(".distance-selector");
    if ($distance.length > 0) {
      $distance.val($distance.find("option").first().val()).selectric("refresh").trigger('change');
    }
    $chance = $form.find(".chance-selector");
    if ($distance.length > 0) {
      $chance.val($chance.find("option").first().val()).selectric("refresh").trigger('change');
    }
    return $form.data('formData', JSON.stringify($form.serializeObject()));
  };

  window.initRewardsTab = function() {
    $mainselector = $("#rewards-tab-2");
    _$(".flip-container .edit-btn").on('click', function(e) {
      var container;
      e.preventDefault();
      container = $(this).parents(".flip-container");
      return enterToken(container);
    });
    _$(".flip-container .edit-btn").on('click', function(e) {
      var container;
      e.preventDefault();
      container = $(this).parents(".flip-container");
      return enterToken(container);
    });
    _$(".flip-container").each(function() {
      var $this;
      $this = $(this);
      return $this.clickOff(function() {
        if ($this.hasClass('faced-back')) {
          return _$(".flip-container.faced-back").each(function() {
            return leaveToken($(this));
          });
        }
      });
    });
    _$(".flip-container .preview-btn").on('click', function(e) {
      var $self, container;
      e.preventDefault();
      $self = $(this);
      container = $(this).parents(".flip-container");
      $self.parents(".settings-tip").hide();
      container.find(".front-preview-parent-1").addClass('show');
      return setTimeout(function() {
        return $self.parents(".settings-tip").show();
      }, 1000);
    });
    _$(".flip-container .empty-preview-btn").on('click', function(e) {
      var $self;
      e.preventDefault();
      $self = $(this);
      return $self.parents(".ftip-parent").addClass('show');
    });
    _$(".ftip-parent.no-hover .ftip-invisible-overlay").on('click', function(e) {
      var tip;
      tip = $(this);
      return tip.parents(".ftip-parent").removeClass('show');
    });
    _$(".flip-container .token-cancel-btn").on('click', function(e) {
      var container;
      e.preventDefault();
      container = $(this).parents(".flip-container");
      container.find('.validation-error-inside.validate-field').removeClass('validation-error-inside');
      container.find('span.validation-error-inside').hide();
      return cancelToken(container);
    });
    _$(".flip-container .delete-btn").on('click', function(e) {
      var $button, container, eventsCategory, eventsPrefix, tid;
      e.preventDefault();
      $button = $(this);
      tid = $(this).data('tid');
      container = $(this).parents(".flip-container");
      eventsCategory = container.data('eventscategory');
      eventsPrefix = container.data('eventsprefix');
      return showConfirmationDelete(function() {
        setDeleteAnimationVisibility($button, true);
        return $.get("/dashboard/delete-token?tid=" + tid, function() {
          lbTrackEvent(eventsCategory, eventsPrefix + "_Delete");
          setDeleteAnimationVisibility($button, false);
          return clearToken(container);
        }).fail(function() {
          setDeleteAnimationVisibility($button, false);
          return alert("An error has occurred!");
        });
      });
    });
    _$(".flip-container .resend-btn").on('click', function(e) {
      var container, eventsCategory, eventsPrefix, reward, ttype;
      e.preventDefault();
      ttype = $(this).data('ttype');
      container = $(this).parents(".flip-container");
      reward = container.find('.reward-text-field').val();
      eventsCategory = container.data('eventscategory');
      eventsPrefix = container.data('eventsprefix');
      return showSendPushMessageLigthbox(ttype, reward, function() {
        return lbTrackEvent(eventsCategory, eventsPrefix + "_Send_Reminder_Success");
      });
    });
    initAnimations();
    initTokens();
    initTokenValidations();
    return initHappyHoursToken();
  };

}).call(this);

///////*******    DASHBOARD GENERAL    ********** /////




//= //require dashboard/preview-box
//= //require tinymce/tinymce.min





///////*******    DASHBOARD TABS    ********** /////

























;
