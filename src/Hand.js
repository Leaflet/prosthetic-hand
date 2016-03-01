
import Finger from './Finger.js';

// 🖑class Hand
// Represents a set of `Finger`s, capable of performing synthetic touch gestures
class Hand {

	// 🖑factory Hand(eventMode: String, options?: {}): Hand
	// Instantiates a new `Hand`. `eventMode` must be either `pointer` or `touch`.
	constructor(eventMode, options) {

		this.eventMode = eventMode;

		this._fingers = [];

		this._fingersAreIdle = true;


		/// TODO: Timing modes: minimal, interval, frames

		// Cancellable reference to the next call to `_dispatchEvents`. This
		// might be either a `setTimeout` reference or a `requestAnimationFrame`
		// reference.
		this._nextDispatch = null;
	}


	// 🖑method growFinger(fingerMode, options): Finger
	// Creates a new `Finger` with the same parameters as the `Finger` constructor,
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

		for (var f of this._fingers) {
			if (!f.isIdle()) {
				return;
			}
		}

		console.log('Hand is idle.');
		this._fingersAreIdle = true;

		//// TODO: Stop the event loop
	}




	// 🖑method private_dispatchEvents(): this
	// Updates all the fingers, fetching their events/touchpoints, and dispatches
	// all `Event`s triggered by the update.
	// This is meant to be called on an internal timer.
	_dispatchEvents(){

		var now = performance.now();
		var events = [];
		var touches = [];

		var hasTouchStart = false;
		var hasTouchEnd = false;

		for (var f of this._fingers) {

			var evs = f.getEvents();

			for (var ev of evs) {
				if ('event' in ev) {
					events.push(ev.event);
				}
				if ('touch' in ev) {
					touches.push(ev.touch);
					if (ev.type === 'down') {
						hasTouchStart = true;
					}
					if (ev.type === 'up') {
						hasTouchEnd = true;
					}
				}
			}
		}

		// Fire all `MouseEvent`s and `PointerEvent`s
		for (var ev of events) {
			document.elementFromPoint(ev.clientX, ev.clientY).dispatchEvent(ev);
		}

		if (touches.length) {
			/// TODO: Build *ONE* `TouchEvent` with `TouchList`s built with
			/// the fingers' touches.
// 			for (var t of touches) {
//
// 			}
		}

		this._scheduleNextDispatch();

		return this;
	}

	_scheduleNextDispatch(){
		if (!this._fingersAreIdle) {
			/// TODO: Different timings
			setTimeout(this._dispatchEvents.bind(this), 50);
		}
	}

}




