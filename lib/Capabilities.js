
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

// mouseEventConstructor, for MouseEvent
export var mouseEventConstructor = true;

try {
	var foo = new MouseEvent('mousedown');
} catch(e) {
	mouseEventConstructor = false;
}


// touchConstructor, for Touch
export var touchConstructor = true;

try {
	var foo = new Touch({ identifier: 0, target: document });
} catch(e) {
	touchConstructor = false;
}


// touchEventConstructor, for TouchEvent
// Weirdly, Safari on iOS has Touch constructor but no TouchEvent constructor.
export var touchEventConstructor = true;

try {
	var foo = new TouchEvent('touchdown')
} catch(e) {
	touchEventConstructor = false;
}


// pointerEventConstructor, for PointerEvent
export var pointerEventConstructor = true;

try {
	var foo = new PointerEvent('pointerdown');
} catch(e) {
	pointerEventConstructor = false;
}


// mouse: `true` if the browser implements `MouseEvent`
export var mouse = !!('MouseEvent' in window);

// touch: `true` if the browser implements `TouchEvent`
export var touch = !!('TouchEvent' in window);




// Some bits borrowed from Leaflet's L.Browser
const ua = navigator.userAgent.toLowerCase();
const webkit        = ua.includes('webkit');
const chrome =        ua.includes('chrome');
export const gecko  = ua.includes('gecko') && !webkit;
export const safari = !chrome && ua.includes('safari');
