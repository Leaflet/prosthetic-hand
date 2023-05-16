
// Detects some browser capabilities. Only for internal use, not exposed to the
// API user.

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

// touch: `true` if the browser implements `TouchEvent`
export var touch = !!('TouchEvent' in window);

// Some bits borrowed from Leaflet's L.Browser
const ua = navigator.userAgent.toLowerCase();
const webkit        = ua.includes('webkit');
const chrome =        ua.includes('chrome');
export const gecko  = ua.includes('gecko') && !webkit;
export const safari = !chrome && ua.includes('safari');
