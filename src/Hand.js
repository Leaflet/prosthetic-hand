
import Finger from './Finger.js';
import * as enums from './Enums.js';

// 🖑class Hand
// Represents a set of `Finger`s, capable of performing synthetic touch gestures

/*
🖑example

```js
var h = new Hand({ timing: '20ms' });
```

*/
export default class Hand {

	// 🖑factory Hand(options?: Hand options): Hand
	// Instantiates a new `Hand` with the given options.
	constructor(options) {

		if (!options) {
			options = {};
		}

		this._fingers = [];

		this._fingersAreIdle = true;


		/// TODO: Timing modes: minimal, interval, frames

		// 🖑option timing: Timing= '20ms'
		// Defines how often new events will be fired, in one of the possible
		// timing modes

		// 🖑miniclass Timing (Hand)
		this._timeInterval = 20;
		this._timingMode = enums.INTERVAL;
		this._framesPending = 0;
		if (options.timing) {
			var timing = options.timing.toString();

			// 🖑option ms
			// Preceded by a number (e.g. `'20ms'`), this mode triggers an event
			// dispatch every that many milliseconds.
			if (timing.match(/^\d+ms$/)) {
				this._timingMode = enums.INTERVAL;
				this._timeInterval = parseInt(timing);
			}

			// 🖑option frame
			// This mode dispatches an event every [animation frame](https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame).
			if (timing === 'frame') {
				this._timingMode = enums.FRAME;
				this._timeInterval = parseInt(timing);
			}

			// 🖑option minimal
			// This mode triggers an event dispatch per finger change, and ensures
			// that every move can trigger its own event (no two movements will be
			// rolled into one event if they are very close).
			if (timing === 'minimal') {
				this._timingMode = enums.MINIMAL;
				this._timeInterval = false;
			}

			// 🖑option instant
			// Like the `minimal` mode, but ignores timings completely and dispatches
			// all events instantaneously. This might cause misbehaviour in graphical
			// browsers.
			if (timing === 'instant') {
				this._timingMode = enums.INSTANT;
				this._timeInterval = false;
			}

			// 🖑option fastframe
			// This mode ignores timings completely like the `instant` mode, and
			// dispatches a new event every so many frames.
			if (timing === 'fastframe') {
				this._timingMode = enums.FASTFRAME;
				this._timeInterval = parseInt(timing);
			}
		}
		// 🖑class Hand


		// Cancellable reference to the next call to `_dispatchEvents`. This
		// might be either a `setTimeout` reference or a `requestAnimationFrame`
		// reference.
		this._nextDispatch = null;
	}


	// 🖑method growFinger(eventMode, options): Finger
	// Creates a new `Finger` with the same parameters as the [`Finger` constructor](#finger-finger),
	// and adds it to the hand.
	growFinger(fingerMode, options) {

		if (!options) {
			options = {};
		}
		Object.assign(options, {hand: this});

		var finger = new Finger(fingerMode, options);

		this._fingers.push(finger);
		return finger;
	}




	// 🖑method fingerIsBusy(): this
	// Used by this hand's fingers to signal that there are movements to be
	// performed by at least one finger.
	fingerIsBusy() {

		/// TODO: Start up the event loop

		this._fingersAreIdle = false;
		this._scheduleNextDispatch();

		return this;
	}

	// 🖑method fingerIsIdle(): this
	// Used by this hand's fingers to signal that one finger has finished doing
	// all the queued movements.
	fingerIsIdle() {

		if (this._fingers.every( f => f.isIdle())) {
			this._fingersAreIdle = true;
		}

		//// TODO: Stop the event loop
	}




	// 🖑method private_dispatchEvents(): this
	// Updates all the fingers, fetching their events/touchpoints, and dispatches
	// all `Event`s triggered by the update.
	// This is meant to be called on an internal timer.
	_dispatchEvents(timestamp) {

		var now = timestamp || performance.now();
		var events = [];
		var touches = [];
		var changedTouches = [];

		var hasTouchStart = false;
		var touchStartTarget = undefined;
		var hasTouchEnd = false;
		var touchEndTarget = undefined;

		var fast = this._timingMode === enums.MINIMAL ||
		           this._timingMode === enums.INSTANT ||
		           this._timingMode === enums.FASTFRAME;

		this._fingers.forEach(f=> {

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
		events.forEach( ev => {
// 			console.log('Dispatching: ', ev.type);
			document.elementFromPoint(ev.clientX, ev.clientY).dispatchEvent(ev);
		});


		/// Build *ONE* `TouchEvent` with `TouchList`s built with
		/// the fingers' touches.
		if (touches.length || hasTouchEnd) {

			var touchEvent;
			var touchTarget;

			if (hasTouchStart) {
				// In case touches are added and removed on the same instant,
				// `touchstart` takes precedence.

				touchEvent = new TouchEvent("touchstart", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					targetTouches: touches.filter( t => t.target === touchStartTarget ),
					changedTouches: changedTouches
				});
				touchTarget = touchStartTarget;
// console.log('synthesizing touchstart', touchStartTarget, touchEvent);

			} else if (hasTouchEnd) {

				// This goes directly against the specifications!! They say:
				// «touchend: The event's target is the same element that received
				// the touchstart event corresponding to the touch point, even
				// if the touch point has moved outside that element.»
				touchEndTarget = document.elementFromPoint(changedTouches[0].clientX, changedTouches[0].clientY);

				touchEvent = new TouchEvent("touchend", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					target: touchEndTarget,
					targetTouches: touches.filter( t => t.target === touchEndTarget ),
					changedTouches: changedTouches
				});
				touchTarget = touchEndTarget;
// console.log('synthesizing touchend', touchEndTarget, touchEvent);

			} else {

				// I have no idea what I'm doing!!!!1
				// Apparently dispatching a touch event to the target of a touch
				// will not work.
// 				touchTarget = touches[0].target;
				touchTarget = document.elementFromPoint(touches[0].clientX, touches[0].clientY);

				touchEvent = new TouchEvent("touchmove", {
					cancelable: true,
					bubbles: true,
					touches: touches,
					targetTouches: touches.filter( t => t.target === touchTarget ),
					changedTouches: changedTouches
				});

			}

			if (changedTouches.length) {
// console.log('Dispatching touch event:', touchEvent.type, touchEvent, touchTarget);
				touchTarget.dispatchEvent(touchEvent);
			}

		}

		this._scheduleNextDispatch();

		return this;
	}


	_scheduleNextDispatch(){
		if (!this._fingersAreIdle) {

			// Calculate time for next movement end. Could be refactored out for
			// some timing modes.
			var min = Infinity;
			this._fingers.forEach(f=> {
				if (!f.isIdle()) {
					var next = f.getNextMoveEndTime();
					// 						console.log('next:', next);
					if (next < min) {
						min = next;
					}
				}
			});


			if (this._timingMode === enums.INTERVAL) {
				this._nextDispatch = setTimeout(this._dispatchEvents.bind(this), this._timeInterval);

			} else if (this._timingMode === enums.MINIMAL) {
				this._nextDispatch = setTimeout(this._dispatchEvents.bind(this), min - performance.now());

			} else if (this._timingMode === enums.INSTANT) {
				return this._dispatchEvents(min);

			} else if (this._timingMode === enums.FRAME) {
				this._nextDispatch = requestAnimationFrame( this._dispatchEvents.bind(this) );

			} else if (this._timingMode === enums.FASTFRAME) {
				this._nextDispatch = requestAnimationFrame( function() {
					this._dispatchEvents(min);
				}.bind(this));

			}
		}
	}

}




