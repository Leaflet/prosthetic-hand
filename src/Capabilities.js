
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

// pointer: `true` if the browser implements `PointerEvent`
export var pointer = !!('PointerEvent' in window);




// Some bits borrowed from Leaflet's L.Browser

var ua = navigator.userAgent.toLowerCase(),
    ie = 'ActiveXObject' in window,
    webkit    = ua.indexOf('webkit') !== -1,
    phantomjs = ua.indexOf('phantom') !== -1,
    android23 = ua.search('android [23]') !== -1,
    chrome    = ua.indexOf('chrome') !== -1,
    gecko     = ua.indexOf('gecko') !== -1  && !webkit && !window.opera && !ie;

export var phantomjs = phantomjs;
export var ie = ie;
export var ielt9 = ie && !document.addEventListener;
export var edge = 'msLaunchUri' in navigator && !('documentMode' in document);
export var webkit = webkit;
export var gecko = gecko;
export var android = ua.indexOf('android') !== -1;
export var android23 = android23;
export var chrome = chrome;
export var safari = !chrome && !phantomjs && ua.indexOf('safari') !== -1;
