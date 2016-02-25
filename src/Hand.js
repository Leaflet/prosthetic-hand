
import Finger from './Finger.js';

// 🖑class Hand
// Represents a set of `Finger`s, capable of performing synthetic touch gestures
class Hand {

	// 🖑factory Hand(eventMode: String, options?: {}): Hand
	// Instantiates a new `Hand`. `eventMode` must be either `pointer` or `touch`.
	constructor(eventMode, options) {

		this.eventMode = eventMode;

		this._fingers = [];

	}


	// 🖑method growFinger(fingerMode, options): Finger
	// Creates a new `Finger` with the same parameters as the `Finger` constructor,
	// and adds it to the hand.
	growFinger(fingerMode, options) {

		var finger = new Finger(fingerMode, options);

		this._fingers.push(finger);
		return finger;
	}

}















