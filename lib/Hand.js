
import Finger from './Finger.js';
import * as capabilities from './Capabilities.js';

const TimingMode = {
	Interval: Symbol('INTERVAL'),
	Minimal: Symbol('MINIMAL'),
	Instant: Symbol('INSTANT'),
	Frame: Symbol('FRAME'),
	FastFrame: Symbol('FAST_FRAME')
};

// 🖐️class Hand
// Represents a set of `Finger`s, capable of performing synthetic touch gestures

/*
🖐️example

```js
var h = new Hand({ timing: '20ms' });
```

*/
export default class Hand extends EventTarget {

	#fingers = [];
	#fingersAreIdle = true;
	#primaryPointers = new Map();

	// 🖐️factory Hand(options?: Hand options): Hand
	// Instantiates a new `Hand` with the given options.
	constructor(options) {
		super();
		if (!options) {
			options = {};
		}

		this.#fingers = [];

		this.#fingersAreIdle = true;
		this._capturedTargets = new Map();

		// 🖐️option timing: Timing= '20ms'
		// Defines how often new events will be fired, in one of the possible
		// timing modes

		// 🖐️miniclass Timing (Hand)
		this._timeInterval = 20;
		this._timingMode = TimingMode.Interval;
		this._framesPending = 0;
		if (options.timing) {
			var timing = options.timing.toString();

			// 🖐️option ms
			// Preceded by a number (e.g. `'20ms'`), this mode triggers an event
			// dispatch every that many milliseconds.
			if (timing.match(/^\d+ms$/)) {
				this._timingMode = TimingMode.Interval;
				this._timeInterval = parseInt(timing);
			}

			// 🖐️option frame
			// This mode dispatches an event every [animation frame](https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame).
			if (timing === 'frame') {
				this._timingMode = TimingMode.Frame;
				this._timeInterval = parseInt(timing);
			}

			// 🖐️option minimal
			// This mode triggers an event dispatch per finger change, and ensures
			// that every move can trigger its own event (no two movements will be
			// rolled into one event if they are very close).
			if (timing === 'minimal') {
				this._timingMode = TimingMode.Minimal;
				this._timeInterval = false;
			}

			// 🖐️option instant
			// Like the `minimal` mode, but ignores timings completely and dispatches
			// all events instantaneously. This might cause misbehaviour in graphical
			// browsers, and the `onStart` and `onStop` callbacks will be called at.
			// every step of the movement (as the movement ends before the next step
			// is chained in)
			if (timing === 'instant') {
				this._timingMode = TimingMode.Instant;
				this._timeInterval = false;
			}

			// 🖐️option fastframe
			// This mode ignores timings completely like the `instant` mode, and
			// dispatches a new event every so many frames.
			if (timing === 'fastframe') {
				this._timingMode = TimingMode.FastFrame;
				this._timeInterval = parseInt(timing);
			}
		}

		// 🖐️class Hand

		// 🖐️option onStart: Function
		// If set to a callback function, it will be called (with the `Hand`
		// as its only argument) whenever the movements start.
		if (options.onStart) {
			this.addEventListener('start', options.onStart);
		}

		// 🖐️option onStop: Function
		// If set to a callback function, it will be called (with the `Hand`
		// as its only argument) whenever the movements are completed.
		if (options.onStop) {
			this.addEventListener('stop', options.onStop);
		}


		// Cancellable reference to the next call to `#dispatchEvents`. This
		// might be either a `setTimeout` reference or a `requestAnimationFrame`
		// reference.
		this._nextDispatch = null;
	}


	// 🖐️method growFinger(eventMode, options): Finger
	// Creates a new `Finger` with the same parameters as the [`Finger` constructor](#finger-finger),
	// and adds it to the hand.
	growFinger(fingerMode, options) {

		if (!options) {
			options = {};
		}
		Object.assign(options, {hand: this});

		var finger = new Finger(fingerMode, options);

		this.#fingers.push(finger);
		return finger;
	}




	// 🖐️method fingerIsBusy(): this
	// Used by this hand's fingers to signal that there are movements to be
	// performed by at least one finger.
	fingerIsBusy() {

		if (this.#fingersAreIdle) {
			// 🖐️section
			// Use `hand.addEventListener('stop', fn)` to do stuff with it.
			// 🖐️event start: CustomEvent
			// Fired when all movements are complete.
			this.#fingersAreIdle = false;
			this.dispatchEvent(new CustomEvent('start'));
			this._scheduleNextDispatch();
		}

		return this;
	}

	// 🖐️method sync(delay?: Number): this
	// Synchronizes the finger movements by adding a delay of **at least** `delay`
	// milliseconds to each finger. After a sync, the movements of the fingers
	// will happen at exactly the same time.
	sync(delay) {

		var endTimestamp = performance.now();

		this.#fingers.forEach( f =>  {
			var movesUntil = f._movesUntil;
			if (movesUntil) {
				endTimestamp = Math.max(endTimestamp, movesUntil);
			}
		});

		var waitUntil = endTimestamp + (delay || 0);

		this.#fingers.forEach( f =>  {
			f.waitUntil(waitUntil);
		});

		return this;
	}


	// 🖐️method run(): Promise to this
	// Returns a `Promise` that resolves when all fingers are idle (right away if they already are).
	run() {
		return new Promise((resolve) => {
			if (this.#fingersAreIdle) {
				resolve(this);
			} else {
				this.addEventListener('stop', () => resolve(this), {once: true});
			}
		});
	}



	// 🖐️method private#dispatchEvents(): this
	// Updates all the fingers, fetching their events/touchpoints, and dispatches
	// all `Event`s triggered by the update.
	// This is meant to be called on an internal timer.
	#dispatchEvents(timestamp, followUp) {

		// 🖐️event tick: CustomEvent
		// Fired a movement is about to start, just before the mouse/touch/pointer
		// events are fired.
		if (!followUp) {
			this.dispatchEvent(new CustomEvent('tick'));
		}


		var now = timestamp || performance.now();
		var events = [];
		var touches = [];
		var changedTouches = [];

		var hasTouchStart = false;
		var touchStartTarget = undefined;
		var hasTouchEnd = false;
		var touchEndTarget = undefined;

		var fast = this._timingMode === TimingMode.Minimal ||
		           this._timingMode === TimingMode.Instant ||
		           this._timingMode === TimingMode.FastFrame;

		this.#fingers.forEach(f=> {

			var evs = f.getEvents(now, fast);

			evs.forEach( ev => {
				if ('event' in ev) {
					events.push(ev.event);
				}
				if ('touch' in ev) {
					if (ev.type === 'down') {
						hasTouchStart = true;
						touchStartTarget = ev.touch.target;
						// If several touches start in the same instant at
						// the diffetent targets, this code will instead
						// assume the last target.
					}

					if (ev.type === 'up') {
						hasTouchEnd = true;
						touchEndTarget = ev.touch.target;
					} else {
						// Touches which have just been lost must not be added
						// to 'touches' or 'targetTouches'
						touches.push(ev.touch);
					}

					if (ev.type !== 'idle') {
						changedTouches.push(ev.touch);
					}
				}
			});
		});

		// Fire all `MouseEvent`s and `PointerEvent`s
		// Must keep track of cancelled `pointerup`s to prevent `click`s
		let lastCancelled;
		events.forEach( ev => {

			if (ev.type === 'click' && lastCancelled === 'pointerup') {
				return;
			}

			let el;
			if (this._capturedTargets.has(ev.pointerId)) {
				el = this._capturedTargets.get(ev.pointerId);
			} else {
				el = document.elementFromPoint(ev.clientX, ev.clientY);
				if (el) {
					this._hookProstheticCapture(el);
				} else {
					el = document;
				}
			}

			const cancelled = !el.dispatchEvent(ev);
			if (cancelled) {
				lastCancelled = ev.type;
			} else {
				lastCancelled = undefined;
			}
		});

		/// Build *ONE* `TouchEvent` with `TouchList`s built with
		/// the fingers' touches.
		if (touches.length || hasTouchEnd) {
			var touchEvent;
			var touchTarget;

			if (hasTouchStart) {
				// In case touches are added and removed on the same instant,
				// `touchstart` takes precedence.

				touchEvent = this._createTouchEvent("touchstart", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					targetTouches: touches.filter( t => t.target === touchStartTarget ),
					changedTouches: changedTouches
				});
				touchTarget = touchStartTarget;

			} else if (hasTouchEnd) {

				// This goes directly against the specifications!! They say:
				// «touchend: The event's target is the same element that received
				// the touchstart event corresponding to the touch point, even
				// if the touch point has moved outside that element.»
				touchEndTarget = document.elementFromPoint(changedTouches[0].clientX, changedTouches[0].clientY);

				touchEvent = this._createTouchEvent("touchend", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					target: touchEndTarget,
					targetTouches: touches.filter( t => t.target === touchEndTarget ),
					changedTouches: changedTouches
				});
				touchTarget = touchEndTarget;

			} else {

				// I have no idea what I'm doing!!!!1
				// Apparently dispatching a touch event to the target of a touch
				// will not work.
				touchTarget = document.elementFromPoint(touches[0].clientX, touches[0].clientY);

				touchEvent = this._createTouchEvent("touchmove", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					targetTouches: touches.filter( t => t.target === touchTarget ),
					changedTouches: changedTouches
				});

			}

			if (changedTouches.length) {

				// Safari misbehaves when searching for the elementFromPoint(0, 0)
				// and returns `undefined` instead of `document`
				if (!touchTarget) {
					touchTarget = document;
				}

				touchTarget.dispatchEvent(touchEvent);
			}

		}

		// A finger stops at a down/up transition, so finish the moves that are already due right away
		if (!fast && this.#fingers.some(f => f.getNextMoveEndTime() <= now)) {
			return this.#dispatchEvents(now, true);
		}

		this._scheduleNextDispatch();

		return this;
	}

	// Wrapper over `new Event()` or `createEvent(); initTouchEvent()` depending
	// on what the browser supports.
	_createTouchEvent(type, data) {
		if (capabilities.touchEventConstructor) {
			return new TouchEvent(type, data);
		} else {
			// It's ugly, it's legacy, but it should work.
			// See https://miketaylr.com/posts/2015/09/init-touch-event-is-a-rats-nest.html

			var touchEvent;
			try {
				touchEvent = document.createEvent('TouchEvent');
			} catch (e) {
				touchEvent = document.createEvent('UIEvent');
			}

			if (touchEvent && touchEvent.initTouchEvent) {
				if (touchEvent.initTouchEvent.length == 0 && !capabilities.safari) { // Chrome
					touchEvent.initTouchEvent(
						document.createTouchList(...data.touches),
						document.createTouchList(...data.targetTouches),
						document.createTouchList(...data.changedTouches),
						type,
						window,
						0,	// screenX
						0,	// screenY
						0,	// clientX
						0	// clientY
					);

				} else if ( touchEvent.initTouchEvent.length == 12 ) { //firefox
					touchEvent.initTouchEvent(
						type,
						data.bubbles,
						data.cancelable,
						window,
						data.detail,
						data.ctrlKey,
						data.altKey,
						data.shiftKey,
						data.metaKey,
						document.createTouchList(...data.touches),
						document.createTouchList(...data.targetTouches),
						document.createTouchList(...data.changedTouches)
					);

				} else { // Safari (length = 18, shows 0)
					// https://developer.apple.com/library/safari/documentation/UserExperience/Reference/TouchEventClassReference/index.html#//apple_ref/javascript/instm/TouchEvent/initTouchEvent
					touchEvent.initTouchEvent(
						type,
						data.bubbles,
						data.cancelable,
						window,
						data.detail,
						0, // screenX,
						0, // screenY,
						0, // pageX,
						0, // pageY,
						data.ctrlKey,
						data.altKey,
						data.shiftKey,
						data.metaKey,
						document.createTouchList(...data.touches),
						document.createTouchList(...data.targetTouches),
						document.createTouchList(...data.changedTouches),
						1, // data.scale,	- as factor of initial distance between the two first touches
						0 // data.rotation	- as delta of angle of two first touches
					);
				}
			}
			return touchEvent;
		}
	}


	_scheduleNextDispatch(){
		// Checked only after a dispatch rather than when a finger runs out of moves, so that moves queued
		// by event listeners in the meantime continue this loop instead of starting another one.
		if (this.#fingers.every(f => f.isIdle())) {
			this.#fingersAreIdle = true;
			// 🖐️event stop: CustomEvent
			// Fired when all movements are complete.
			this.dispatchEvent(new CustomEvent('stop'));
		} else {

			// Calculate time for next movement end. Could be refactored out for
			// some timing modes.
			var min = Infinity;
			this.#fingers.forEach(f=> {
				if (!f.isIdle()) {
					var next = f.getNextMoveEndTime();
					if (next < min) {
						min = next;
					}
				}
			});


			if (this._timingMode === TimingMode.Interval) {
				this._nextDispatch = setTimeout(this.#dispatchEvents.bind(this), this._timeInterval);

			} else if (this._timingMode === TimingMode.Minimal) {
				this._nextDispatch = setTimeout(this.#dispatchEvents.bind(this), min - performance.now());

			} else if (this._timingMode === TimingMode.Instant) {
				return this.#dispatchEvents(min);

			} else if (this._timingMode === TimingMode.Frame) {
				this._nextDispatch = requestAnimationFrame( this.#dispatchEvents.bind(this) );

			} else if (this._timingMode === TimingMode.FastFrame) {
				this._nextDispatch = requestAnimationFrame( function() {
					this.#dispatchEvents(min);
				}.bind(this));

			}
		}
	}


	// Per the Pointer Events spec, a mouse is always primary, and a pointer of any other type is
	// primary if it went down while no other pointer of that type was down.
	_isPrimaryPointer(finger, evType) {
		const type = finger._state.pointerType;
		if (type === 'mouse') {
			return true;
		}
		if (evType === 'down') {
			const othersDown = this.#fingers.some(f => f !== finger && f._mode === 'pointer' &&
				f._state.pointerType === type && f._state.down);
			const primary = this.#primaryPointers.get(type);
			if (!othersDown) {
				this.#primaryPointers.set(type, finger);
			} else if (primary === finger || !primary?._state.down) {
				// the primary lifted while others are still down, so none is primary until they all lift
				this.#primaryPointers.delete(type);
			}
		}
		return this.#primaryPointers.get(type) === finger;
	}


	_hookProstheticCapture(el) {
		if (el.__prostheticPointerCapture) { return; }

		const captureFn = el.setPointerCapture;
		const releaseFn = el.releasePointerCapture;
		el.setPointerCapture = ((id)=> {
			if (id >= 1000) {
				this._capturedTargets.set(id, el);
			} else
				return captureFn.call(el, id);
		} );

		el.releasePointerCapture = ((id)=> {
			if (this._capturedTargets.get(id) === el) {
				this._capturedTargets.delete(id);
			} else
				return releaseFn.call(el, id);
		} );

		el.__prostheticPointerCapture = true;
	}


}
