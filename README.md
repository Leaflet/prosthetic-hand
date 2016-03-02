
# 🖑 prosthetic-hand 🖑

A javascript library to emulate mouse/touch/pointer events, designed to help
unit-test touch gestures.


## Demos

http://ivansanchez.github.io/prosthetic-hand/demos/

## API documentation

http://ivansanchez.github.io/prosthetic-hand/api-docs.html



## Install

Run `npm install prosthetic-hand`.

Files will be in `node_modules/prosthetic-hand/dist/`

## Build & test

Run `npm install`, then `npm start`, then point your favourite web browser at
`http://localhost:4567/demos/`

## Compatibility note

Please note that in order to emulate `TouchEvent`s or `PointerEvent`s, your
web browser must support (or polyfill) these events. Short version: use
Chrome with running code that emulates `TouchEvents`, and IE11 or Edge when
emulating `PointerEvent`s.



