import {test, expect, vi, beforeEach, afterEach, onTestFinished} from 'vitest';
import Hand from '../lib/Hand.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function record(...types) {
	const log = [];
	const listener = (e) => {
		const {clientX: x, clientY: y} = e.changedTouches ? e.changedTouches[0] : e;
		log.push({type: e.type, x, y, t: performance.now()});
	};
	for (const type of types) document.addEventListener(type, listener);
	onTestFinished(() => {
		for (const type of types) document.removeEventListener(type, listener);
	});
	return log;
}

function events(log) {
	return log.map(e => `${e.type} ${e.x},${e.y} @${e.t}`);
}

test('mouse drag', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '20ms'}).growFinger('mouse').moveTo(10, 10, 0).down().moveBy(100, 0, 100).up();
	vi.runAllTimers();
	expect(events(log)).toEqual([
		'mousemove 10,10 @20', 'mousedown 10,10 @20',
		'mousemove 50,10 @40', 'mousemove 70,10 @60', 'mousemove 90,10 @80', 'mousemove 110,10 @100',
		'mouseup 110,10 @100'
	]);
});

test('touch drag', () => {
	const log = record('touchstart', 'touchmove', 'touchend');
	new Hand({timing: '20ms'}).growFinger('touch').moveTo(10, 10, 0).down().moveBy(100, 0, 100).up();
	vi.runAllTimers();
	expect(events(log)).toEqual([
		'touchstart 10,10 @20',
		'touchmove 50,10 @40', 'touchmove 70,10 @60', 'touchmove 90,10 @80', 'touchmove 110,10 @100',
		'touchend 110,10 @100'
	]);
});

test('mouse tap within one tick', () => {
	const log = record('mousedown', 'mouseup');
	new Hand({timing: '20ms'}).growFinger('mouse').moveTo(10, 10, 0).down().up(5);
	vi.runAllTimers();
	expect(events(log)).toEqual(['mousedown 10,10 @20', 'mouseup 10,10 @20']);
});

test('touch tap within one tick', () => {
	const log = record('touchstart', 'touchend');
	new Hand({timing: 'frame'}).growFinger('touch').moveTo(10, 10, 0).down().up();
	vi.runAllTimers();
	expect(events(log)).toEqual(['touchstart 10,10 @16', 'touchend 10,10 @16']);
});

test('down and up respect their delay', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '10ms'}).growFinger('mouse').moveTo(10, 10, 0).down(50).up(30);
	vi.runAllTimers();

	expect(log.map(e => [e.type, e.t])).toEqual([['mousemove', 10], ['mousedown', 50], ['mouseup', 80]]);
});

test('moves without a delay are instant', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '20ms'}).growFinger('mouse').moveTo(10, 10).down().moveBy(100, 0).wait().up();
	vi.runAllTimers();
	expect(events(log)).toEqual(['mousemove 10,10 @20', 'mousedown 10,10 @20', 'mousemove 110,10 @20', 'mouseup 110,10 @20']);
});

test('sync without a delay', () => {
	const log = record('mousedown');
	const hand = new Hand({timing: '10ms'});
	const f1 = hand.growFinger('mouse').moveTo(10, 10).wait(50);
	const f2 = hand.growFinger('mouse').moveTo(20, 20);
	hand.sync();
	f1.down();
	f2.down();
	vi.runAllTimers();
	expect(events(log)).toEqual(['mousedown 10,10 @50', 'mousedown 20,20 @50']);
});

test('mouse drag off the viewport', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '20ms'}).growFinger('mouse').moveTo(10, 10).down().moveBy(-60, 0, 40).up();
	vi.runAllTimers();
	expect(events(log)).toEqual(['mousemove 10,10 @20', 'mousedown 10,10 @20', 'mousemove -50,10 @40', 'mouseup -50,10 @40']);
});
