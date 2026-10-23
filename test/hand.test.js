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

function expectDrag(log, down, move, up) {
	expect(log[0].type).toBe(down);
	expect(log.slice(1, -1).map(e => e.type)).toEqual(Array(log.length - 2).fill(move));
	expect(log.length).toBeGreaterThan(3);
	expect(log.at(-1)).toMatchObject({type: up, x: 110, y: 10});
	for (let i = 1; i < log.length; i++) expect(log[i].x).toBeGreaterThan(log[i - 1].x);
}

test('mouse drag', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '20ms'}).growFinger('mouse').moveTo(10, 10, 0).down().moveBy(100, 0, 100).up();
	vi.runAllTimers();

	expectDrag(log, 'mousedown', 'mousemove', 'mouseup');
});

test('touch drag', () => {
	const log = record('touchstart', 'touchmove', 'touchend');
	new Hand({timing: '20ms'}).growFinger('touch').moveTo(10, 10, 0).down().moveBy(100, 0, 100).up();
	vi.runAllTimers();

	expectDrag(log, 'touchstart', 'touchmove', 'touchend');
});

test('down and up respect their delay', () => {
	const log = record('mousedown', 'mousemove', 'mouseup');
	new Hand({timing: '10ms'}).growFinger('mouse').moveTo(10, 10, 0).down(50).up(30);
	vi.runAllTimers();

	expect(log.map(e => [e.type, e.t])).toEqual([['mousemove', 10], ['mousedown', 50], ['mouseup', 80]]);
});
