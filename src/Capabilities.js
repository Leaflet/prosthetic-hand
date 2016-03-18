
// Detects some browser capabilities. Only for internal use, not exposed to the
// API user.



// eventConstructors
// `true` if the browser can run `new Event()`.
// If `false`, then the library will resort to the (deprecated) `window.createEvent()`
// and `event.initMouseEvent()`. This is needed for legacy browsers and PhantomJS.
export var eventConstructors = true;

try {
	var foo = new Touch({ identifier: 0, target: document });
// 	var foo = new MouseEvent();
} catch(e) {
	eventConstructors = false;
}


// mouse: `true` if the browser implements `MouseEvent`
export var mouse = !!('MouseEvent' in window);

// touch: `true` if the browser implements `TouchEvent`
export var touch = !!('TouchEvent' in window);

// pointer: `true` if the browser implements `PointerEvent`
export var pointer = !!('PointerEvent' in window);


