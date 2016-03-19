
# 🖑 prosthetic-hand 🖑

A javascript library to emulate mouse/touch/pointer events, designed to help
unit-test touch gestures.


## Demos

http://leaflet.github.io/prosthetic-hand/demos/

## API documentation

http://leaflet.github.io/prosthetic-hand/api-docs.html



## Install

Run `npm install prosthetic-hand`.

Files will be in `node_modules/prosthetic-hand/dist/`

## Build & test

Run `npm install`, then `npm start`, then point your favourite web browser at
`http://localhost:4567/demos/`

## Compatibility note

Please note that in order to emulate `TouchEvent`s or `PointerEvent`s, your
web browser must support (or polyfill) these events. Short version: use
Chrome when running code that emulates `TouchEvents`, and IE11 or Edge when
emulating `PointerEvent`s.

## Contributing code

Read the Leaflet guidelines at https://github.com/Leaflet/Leaflet/blob/master/CONTRIBUTING.md

Whenever making a bugfix or a new feature, notify [IvanSanchez](https://github.com/IvanSanchez) so that a new version can be published to NPM.

## Legalese

#### "THE BEER-WARE LICENSE":

<ivan@sanchezortega.es> wrote this file. As long as you retain this notice you
can do whatever you want with this stuff. If we meet some day, and you think
this stuff is worth it, you can buy me a beer in return.
