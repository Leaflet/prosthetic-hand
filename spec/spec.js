/* global describe, it, beforeEach, afterEach */
describe('prosthetic-hand', function () {
	chai.should();

	var h, map;
	beforeEach(function () {
		map = L.map('map').setView([0, 0], 6);
		L.polyline([[-1, -1], [0, 0], [0, 1]]).addTo(map);
		h = new Hand();
	});

	afterEach(function () {
		map.remove();
	});


	describe('mouse simulation', function () {
		it('moving a Leaflet map with mouse', function (done) {
			var mouse = h.growFinger('mouse');
			mouse.wait(25).moveTo(1, 50, 500).down().moveBy(400, 0, 500).up();

			setTimeout(function () {
				var center = map.getCenter();

				center.lat.should.equal(0);
				center.lng.should.not.be.closeTo(0, 0.1);

				done();
			}, 1800);
		});
	});
	describe('touch simulation', function () {
		it('Moves the map with a touch finger', function (done) {
			var finger = h.growFinger('touch');
			finger.wait(25).moveTo(1, 50, 50)
				 .down().moveBy(400, 0, 400).up();

			setTimeout(function () {
				var center = map.getCenter();

				center.lat.should.equal(0);
				center.lng.should.not.be.closeTo(0, 0.1);

				done();
			}, 1800);
		});

		it('Pinch zooms with two touch fingers', function (done) {
			var left = h.growFinger('touch');
			var right = h.growFinger('touch');

			var delta = 200;

			h.sync(5);
			left.wait(25).moveTo(250, 50, 500).down().moveBy(-delta, 0, 500).up();
			right.wait(25).moveTo(275, 50, 500).down().moveBy(delta, 0, 500).up();

			setTimeout(function () {
				var zoom = map.getZoom();

				zoom.should.not.equal(6);

				done();
			}, 1800);
		});
	});
});
