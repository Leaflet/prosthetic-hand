
import Finger from './Finger.js';

// 🖑class Hand
// Represents a set of `Finger`s, capable of performing synthetic touch gestures

/*
🖑example

```js
var h = new Hand({ timing: '20ms' });
```

*/
class Hand {

	// 🖑factory Hand(options?: Hand options): Hand
	// Instantiates a new `Hand` with the given options.
	constructor(options) {

		if (!options) {
			options = {};
		}

		this._fingers = [];

		this._fingersAreIdle = true;


		/// TODO: Timing modes: minimal, interval, frames

		// 🖑option timing(String): '20ms'
		// Defines how often new events will be fired. If the value is a number
		// followed by `'ms'`, then it specified how many milliseconds to wait
		// between event dispatches.
		this._timeInterval = 20;
		if (options.timing) {
			if (options.timing.toString().substr(-2) === 'ms') {
				this._timeInterval = parseInt(options.timing);
			}
		}


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
	_dispatchEvents(){

		var now = performance.now();
		var events = [];
		var touches = [];
		var changedTouches = [];

		var hasTouchStart = false;
		var touchStartTarget = undefined;
		var hasTouchEnd = false;
		var touchEndTarget = undefined;

		this._fingers.forEach(f=> {

			var evs = f.getEvents();

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
			if (this._timeInterval) {
				setTimeout(this._dispatchEvents.bind(this), this._timeInterval);
			}
		}
	}

}




