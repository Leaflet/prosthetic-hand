
# 🖑 prosthetic-hand 🖑


A very early WIP of a library to emulate mouse/touch/pointer events, designed to help
unit-test touch gestures.






## TODO

* Implement `TouchEvent`s
* Implement `PointerEvent`s
* Move the timing loop out of `Finger` and into `Hand`
* Allow setting the refresh time of the timing loop / sync to frames
* Add a delay option to `Finger.up()` and `Finger.down()`
* Allow to sync fingers (maybe via `Hand.syncFungers()` and/or ``
* Get some inspiration from https://github.com/hammerjs/simulator/blob/master/index.js


