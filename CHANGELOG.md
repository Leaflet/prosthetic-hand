
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

* Allow use of the deprecated `initEvent()` event creation functions (instead of `new Event()`), for PhantomJS.
* Test multi-finger `PointerEvents`s
* Allow to sync fingers (maybe via `Hand.syncFingers()` and/or `Finger.sync()`)
* Implement some kind of wheel-scrolling for `MouseEvent` and `PointerEvent` fingers
* Implement `Hand`-level gestures (pinch, rotate, 2-, 3-, 4-finger pan)
* Implement `ctrlKey`, `metaKey` and `shiftKey` event properties
* Test with the PointerEvents Polyfill: https://github.com/jquery/PEP and the TouchEvents polyfill at https://github.com/CamHenlin/TouchPolyfill


