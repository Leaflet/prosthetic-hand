
import IvansFinger from './IvansIndexFinger.js';

// Self-incrementing identifier for touch ID and pointer ID.
// Fingers can either keep the same ID for their life, or request a new
//   ID whenever they go down.
var fingerIdSequence = 1;

// 🖑class Finger
// Represents a finger, capable of performing single touch/pointer/mouse synthetic
// events.
export default class Finger {

	// 🖑factory Finger(eventMode: String, options?: {}): Finger
	// Instantiates a new `Finger`. `fingerMode` must be either `pen`, `mouse`,
	// `touchscreen` or `touchpad`.
	constructor(fingerMode, options) {

		this._id = fingerIdSequence++;

		this._mode = fingerMode || mouse;

		this._hand = options.hand;

		/// TODO: parkinsonFactor or shakesFactor or jitteryness or something

		this._state = Object.assign({}, {
			x: 0,	// Absolute
			y: 0,	// Absolute
			down: false
		}, options);

		// 🖑option x: Number; The number of pixels from the left boundary the finger is at.
		// 🖑option y: Number; The number of pixels from the top boundary the finger is at.
		// 🖑option down: Boolean; Whether the finger is down (clicking/touching/pressing) or not.


		// A "finger movement" is a plain hashmap that describes either a
		// instantaneous state change (e.g. "touch down", "up/lift touch",
		// "change pressure") or a movement("move", "wiggle", "vary pressure
		// during a few seconds").
		// A finger movement has three things:
		// * A duration (can be zero)
		// * A final finger state
		// * A function that returns the finger state (run when the movement is
		//   still running, i.e. the end timestamp is not reached yet)
		// These are called duration, finalState and getState().
		// getState() gets called with an amount of milliseconds since the last movement
		// getState() might return `false`, meaning 'nothing happened since last time'

		this._movements = [];

		// Timestamp for the end of the last movement.
		this._movesUntil = performance.now();

		// Timestamp for the start of the current movement. This is always in the past.
		this._movesFrom = performance.now();

		// Final state of the last movement (to calculate the next movement if needed).
		this._finalState = Object.assign({}, this._state);

		// This should be configurable with custom/more graphics
		if (this._mode === 'touchscreen') {
			this._initGraphicIvansFinger();
		} else {
			this._mode = 'mouse';
			this._initGraphicCircle();
		}


		// Only used for `TouchEvent`s (as `Touch.target`): Will hold a
		// reference to the DOM element on which the touch point started when
		// it was first placed on the surface.
		this._touchTargetWhenDowned = undefined;

	}


	// 🖑method isIdle(): Boolean
	// Returns true when the finger has no more pending movements/waits/wiggles/etc.
	isIdle() {
		return !(this._movements.length);
	}


	// 🖑method down(options?: {}): this
	// Puts the finger down at the absolute `(x, y)` coordinates, optionally
	// setting some details like pressure or touch angle (if they make sense
	// to the current `fingerMode`).
	down() {
		return this.update({ down: true });
	}


	// 🖑method up(options?: {}): this
	// Lifts the finger up.
	up() {
		return this.update({ down: false });
	}


	// 🖑method wait(delay): this
	// Don't move this finger for `delay` milliseconds.
	wait(delay) {
		this._queueMove({finalState: this._finalState, getState: this._falseFn, duration: delay});
		return this;
	}


	// 🖑method update(options?: {}): this
	// Updates some of the finger options, like pressure or touch angle,
	// without disturbing its movement
	update(options) {

		this._queueMove({finalState: options, getState: this._falseFn, duration: 0});

// 		return this._update();
		return this;
	}


	// 🖑method reset(options?: {}): this
	// Clears all the queued movements for this finger and immediately lifts it up
	reset(options) {
		return this;
	}



	// 🖑method moveTo(x: Number, y: Number, delay: Number, options?: {}): this
	// Queues moving this finger to an absolute position at `(x, y)`; the
	// movement will last for `delay` milliseconds.
	moveTo(x, y, delay) {
		return this.moveBy(x - this._finalState.x, y - this._finalState.y, delay);
	}


	// 🖑method moveBy(x: Number, y: Number, delay: Number, options?: {}): this
	// Queues a move of this finger to an position relative to its last position
	// plus`(x, y)`; the movement will last for `delay` milliseconds.
	moveBy(x, y, delay) {
		var fromX = this._finalState.x;
		var fromY = this._finalState.y;

		var move = {
			finalState: {
				x: fromX + x,
				y: fromY + y,
			},

			getState: (function(x1, y1, dx, dy){
				return function(msec) {
// 					console.log('elapsed in a moveBy: ', msec, performance.now());
					var percent = msec / delay;
					return {
						x: Math.round(x1 + (dx * percent)),
						y: Math.round(y1 + (dy * percent))
					}
				}
			})(fromX, fromY, x, y, delay),

			duration: delay
// 			until: this._movesUntil + delay
		}

		this._queueMove(move);

// 		return this._update();
		return this;
	}


	// An aux function that always returns false
	_falseFn() {
		return false;
	}


	// Queues a movement
	_queueMove( move ) {

		if (!this._movements.length) {
			this._movesUntil = this._movesFrom = performance.now();
		}

		move.until = this._movesUntil + move.duration;
		this._movements.push(move);

		Object.assign(this._finalState, this._finalState, move.finalState);
// 		console.log('After queueing a movement, final state will be:', this._finalState);
		this._movesUntil = move.until;

		if (this._movements.length === 1) {
			this._hand.fingerIsBusy();
		}
	}


	/*
	 * 🖑method getEvents(timestamp?: Number): []
	 * Updates the private properties of the finger (x, y, timestamp) by
	 * running the next movement(s) as far as indicated by the timestamp (or
	 * as fas as to `performance.now()`), then checks if the state has changed
	 * and means an event should be fired.
	 *
	 * Returns an array of objects of the form `{type: 'foo', event: MouseEvent(...)}`
	 * or `{type: 'foo', touch: Touch(...)}`, with all the active `Touch`es or
	 * all triggered mouse/pointer events triggered by executing moves until
	 * `timestamp`.
	 *
	 * If the finger doesn't matter when `getEvents()` is called, then an empty
	 * array is return instead. This happens for mice not moving, and fingers
	 * not touching (fingers touching but not moving, and mice not pressing
	 * but moving *do* matter).
	 *
	 * A `Hand` is reponsible for getting events (using loops, timings, or
	 * whatever), requesting the right timestamps if needed, merging `Touch`es
	 * into `TouchEvent`s, and firing the events via `dispatchEvent()`.
	*/
	getEvents(timestamp) {
		var now = timestamp || performance.now();
		var changed = false;
		var previousState = Object.assign({}, this._state);

		// Process all moves that already happened (since last frame)
		while (this._movements.length && this._movements[0].until < now) {
			Object.assign(this._state, this._movements[0].finalState);
			this._movesFrom = this._movements[0].until;
			this._movements.shift();
			changed = true;
		}


		// Process ongoing movement
		if (this._movements.length) {
			var move = this._movements[0];

			var updatedState = move.getState( now - this._movesFrom );

			if (updatedState && !this._statesAreEqual(updatedState, this._state)) {
				changed = true;
				Object.assign(this._state, updatedState);
			}

			//// FIXME: Don't know if this is the right way to request the next movement
			//// Maybe the updates need to be coordinated by the hand (to trigger
			//// touch events with several `Touch`es at the same time)
// 			requestAnimationFrame(this._update.bind(this));

// 			setTimeout(this._update.bind(this), 20);

		} else {
			this._hand.fingerIsIdle();
		}


// 		// TODO: Add jitter if needed

		var evType = 'idle';

		if (changed) {

			if (previousState.x !== this._state.x || previousState.y !== this._state.y) {
				evType = 'move'
			}
			/// TODO: Detect over/out events when the event target changes.

			if (previousState.down && (!this._state.down)) {
				this._graphic.style.display = 'none';
				this._touchTargetWhenDowned = undefined;
				evType = 'up';
			} else if ((!previousState.down) && this._state.down){
				this._graphic.style.display = 'block';
				this._touchTargetWhenDowned = document.elementFromPoint(this._state.x, this._state.y);
				evType = 'down';
			}

// 			console.log(previousState.down, this._state.down);
// 			console.log(this._asMouseEvent(evType));

// 			console.log('_updated to', this._state.x, this._state.y);
// 			console.log('_updated to', this._state);
			this._setGraphicPosition(this._state.x, this._state.y);
		}


		// `MouseEvent`s
		if (this._mode === 'mouse' || this._mode === 'touchpad') {
			if (evType === 'idle') {
				return [];
			}
			/// TODO: Check for mouseover/mouseout events, add them to the
			/// array.
			/// TODO: Create synthetic `click` and `dblclick` events if/when
			/// needed, add them to the array.
			return [{ type: evType, event: this._asMouseEvent(evType) }];
		}

		// `Touch`es
		if (this._mode === 'touchscreen') {
			if (this._touchTargetWhenDowned) {
				return [{ type: evType, touch: this._asTouch(evType) }];
			} else {
				return [];
			}
		}



		return [];
	}



	// 🖑method private_asTouch(): Touch
	// Returns an instance of `Touch` representing the current state of the finger
	_asTouch() {

		var touch = new Touch({
			identifier: this._id,
			target: this._touchTargetWhenDowned,
			clientX: this._state.x,
			clientY: this._state.y,
			screenX: this._state.x,	/// TODO: Handle page scrolling
			screenY: this._state.y,
			pageX: this._state.x,
			pageY: this._state.y,
			radiusX: 25,
			radiusY: 25,
			rotationAngle: 0,
			force: 0.5
		});

		return touch;
	}

	// 🖑method private_asPointerEvent(): PointerEvent
	// Returns an instance of `PointerEvent` representing the current state of the finger
	_asPointerEvent() {
// 		this._update();
	}

	// 🖑method private_asMouseEvent(evType: String): PointerEvent
	// Returns an instance of `PointerEvent` representing the current state of the finger
	_asMouseEvent(evType) {

		var ev = new MouseEvent('mouse' + evType, {
			bubbles: true,
			button: 0,	// Moz doesn't use -1 when no buttons are pressed, WTF?
			buttons: this._state.down ? 1 : 0,
			detail: (evType === 'down' || evType === 'up') ? 1 : 0,	// TODO: count consecutive clicks
			clientX: this._state.x,
			clientY: this._state.y,
			screenX: this._state.x,	/// TODO: Handle page scrolling
			screenY: this._state.y,
			pageX: this._state.x,
			pageY: this._state.y,
// 			target: document.elementFromPoint(this._state.x, this._state.y),	// works with viewport coords
		});

		return ev;
	}


	// Inits this._graphic to be a SVG circle.
	_initGraphicCircle() {

		this._graphic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this._graphic.style.height     = '50px';
		this._graphic.style.width      = '50px';
		this._graphic.style.zIndex     = 1000000;	// Some ridiculously high value
		this._graphic.style.position   = 'absolute';
		this._graphic.style.top        = 0;
		this._graphic.style.left       = 0;
		this._graphic.style.marginLeft = '-25px';
		this._graphic.style.marginTop  = '-25px';
		this._graphic.style.pointerEvents = 'none';

		this._graphic.innerHTML = '<circle cx="25" cy="25" r="20" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="rgba(0,0,0,0.1)"/>';

		this._graphic.style.display = 'none';
		document.body.appendChild(this._graphic);
	}

	// Inits this._graphic to be an image of Ivan's index finger
	_initGraphicIvansFinger() {

		this._graphic = document.createElement('img');
		this._graphic.src = IvansFinger;
		this._graphic.style.height     = '160px';
		this._graphic.style.width      = '160px';
		this._graphic.style.zIndex     = 1000000;	// Some ridiculously high value
		this._graphic.style.position   = 'absolute';
		this._graphic.style.top        = 0;
		this._graphic.style.left       = 0;
		this._graphic.style.marginLeft = '-20px';
		this._graphic.style.marginTop  = '-20px';
		this._graphic.style.pointerEvents = 'none';

		this._graphic.style.display = 'none';
		document.body.appendChild(this._graphic);
	}

	_setGraphicPosition(x, y) {
		// Borrowed from Leaflet code
		this._graphic.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
	}


	// Simple, non-deep comparison of hashmaps, used for comparing internal finger states.
	// Returns `false` when one of the properties of s1 differs from the same property
	// of s2 (or s2 doesn't have it). It ignores if s1 doesn't have all properties from
	// s2.
	_statesAreEqual(s1, s2) {
		for (var i in s1) {
			if (s1[i] !== s2[i]) {
				return false;
			}
		}
		return true;
	}


}







