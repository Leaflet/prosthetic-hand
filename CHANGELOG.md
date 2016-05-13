
# v1.3.1

* Added polyfill for `CustomEvent` (@perliedman)
* Updated dependencies (`gobble-rollup` to 0.26.3) (@perliedman)

# v1.3.0

* Added `onStart` and `onStop` callbacks

# v1.2.6

* Fixed PhantomJS regression introduced in v1.2.1.

# v1.2.4

* Cleaned up `console.log()`s

# v1.2.3

* Fixed a typo affecting strict mode globals

# v1.2.2

* Fixed display of circles in Edge

# v1.2.1

* Worked around iOS+Safari inconsistent TouchEvent implementation

# v1.2.0

* Added `Hand.sync()`
* Added `Finger.waitUntil`
* `Hand` fires events in `document`: `prostheticHandStart`, `prostheticHandStop` and `prostheticHandTick`

# v1.1.2

* Added legacy `initTouch()`, `initTouchList()` and `createEvent('TouchEvent')` for PhantomJS

# v1.1.1

* Added legacy `initMouseEvent()` for PhantomJS

# v1.1.0

* Replaced timing loop with 5 different timing modes
* Added delay option to `Finger.down()` and `Finger.up()`
* Changed build system to produce a UMD file.

# v1.0.3

* Fixed NPM published package (bug in `.npmignore`)
* Pushed CHANGELOG.md

# v1.0.2

* Fixed a bug preventing usage in IE11 (#1)

# v1.0.0

* Emulates `MouseEvent`s, `TouchEvent`s, and `PointerEvent`s
* Configurable event firing rate
* Fingers have a queue of movements to be performed
* Fingers can touch, lift, move, and wait
* Demos can pan and zoom a Leaflet map




# TODO

* Check if there's any way to make `PointerEvent`s work in PhantomJS
* Implement some kind of wheel-scrolling for `MouseEvent` and `PointerEvent` fingers
* Implement `Hand`-level gestures (pinch, rotate, 2-, 3-, 4-finger pan)
* Implement `ctrlKey`, `metaKey` and `shiftKey` event properties
* Test with the PointerEvents Polyfill: https://github.com/jquery/PEP and the TouchEvents polyfill at https://github.com/CamHenlin/TouchPolyfill
* Implement double-click (and triple, etc) via the `detail` property of `MouseEvent` and `PointerEvent`


