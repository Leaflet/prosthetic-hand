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

test('queuing moves from an event listener', () => {
	const hand = new Hand({timing: '10ms'});
	const finger = hand.growFinger('mouse');
	const ticks = [];
	let stops = 0;
	hand.addEventListener('tick', () => ticks.push(performance.now()));
	hand.addEventListener('stop', () => stops++);
	const log = record('mouseup', 'mousemove');
	document.addEventListener('mouseup', () => finger.moveBy(30, 0, 30), {once: true});

	finger.moveTo(10, 10).down().up();
	vi.runAllTimers();
	expect(events(log)).toEqual([
		'mousemove 10,10 @10', 'mouseup 10,10 @10',
		'mousemove 20,10 @20', 'mousemove 30,10 @30', 'mousemove 40,10 @40'
	]);
	expect(ticks).toEqual([10, 20, 30, 40]);
	expect(stops).toBe(1);
});

test('isPrimary', () => {
	const log = [];
	const listener = (e) => log.push(`${e.type} ${e.clientX} ${e.isPrimary} @${performance.now()}`);
	for (const type of ['pointerdown', 'pointerup']) document.addEventListener(type, listener);
	onTestFinished(() => {
		for (const type of ['pointerdown', 'pointerup']) document.removeEventListener(type, listener);
	});

	const hand = new Hand({timing: '10ms'});
	hand.growFinger('pointer', {pointerType: 'touch'}).moveTo(10, 10).down(10).up(20).down(10).up(20);
	hand.growFinger('pointer', {pointerType: 'touch'}).moveTo(50, 50).down(20).up(30).down(20).up(10);
	hand.growFinger('pointer', {pointerType: 'mouse'}).moveTo(90, 90).wait(90).down().up(10);
	vi.runAllTimers();
	expect(log).toEqual([
		'pointerdown 10 true @10', 'pointerdown 50 false @20', 'pointerup 10 true @30',
		// the primary lifted while another touch is still down, so neither is primary until both lift
		'pointerdown 10 false @40', 'pointerup 50 false @50', 'pointerup 10 false @60',
		'pointerdown 50 true @70', 'pointerup 50 true @80',
		'pointerdown 90 true @90', 'pointerup 90 true @100'
	]);
});

test('pointer button and buttons', () => {
	const log = [];
	const listener = e => log.push(`${e.type} ${e.button} ${e.buttons}`);
	const types = ['pointerdown', 'pointermove', 'pointerup'];
	for (const type of types) document.addEventListener(type, listener);
	onTestFinished(() => {
		for (const type of types) document.removeEventListener(type, listener);
	});

	new Hand({timing: '10ms'}).growFinger('pointer').moveTo(10, 10).down().moveBy(20, 0, 20).up();
	vi.runAllTimers();
	expect(log).toEqual([
		'pointermove -1 0', 'pointerdown 0 1', 'pointermove -1 1', 'pointerup 0 0'
	]);
});

test('run resolves with the hand', async () => {
	const hand = new Hand({timing: '10ms'});
	const finger = hand.growFinger('mouse').moveTo(10, 10, 20);
	const done = hand.run();
	vi.runAllTimers();
	expect(await done).toBe(hand);

	finger.moveBy(10, 0, 20);
	const doneAgain = hand.run();
	vi.runAllTimers();
	expect(await doneAgain).toBe(hand);
});

test('run resolves when there is nothing left to do', async () => {
	expect(await new Hand().run()).toBeInstanceOf(Hand);

	const hand = new Hand({timing: 'instant'});
	hand.growFinger('mouse').moveTo(10, 10, 20);
	expect(await hand.run()).toBe(hand);
});
