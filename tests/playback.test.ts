import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Playback } from '../src/playback.ts';

// Catches wrong phase boundaries or a clock that skips a spell event.
test('fire advances through charge, release, impact, decay and becomes idle', () => {
  const p = new Playback(() => ({ update() {}, dispose() {} }));
  p.cast('fire');
  assert.equal(p.phase, 'charge');
  for (let i = 0; i < 24; i++) p.update(0.05);
  assert.equal(p.phase, 'release');
  for (let i = 0; i < 20; i++) p.update(0.05);
  assert.equal(p.phase, 'impact');
  for (let i = 0; i < 14; i++) p.update(0.05);
  assert.equal(p.phase, 'decay');
  for (let i = 0; i < 40; i++) p.update(0.05);
  assert.equal(p.phase, 'idle');
  assert.equal(p.id, null);
});

// Catches a missing cleanup on recast, finish or a repeated clear.
test('replacing and finishing casts releases each owned effect exactly once', () => {
  const resources = new Set<number>();
  const released: number[] = [];
  let next = 0;
  const p = new Playback(() => {
    const key = next++;
    resources.add(key);
    return { update() {}, dispose() { resources.delete(key); released.push(key); } };
  });
  for (let i = 0; i < 30; i++) p.cast(i % 2 ? 'fusion' : 'lightning');
  assert.equal(resources.size, 1);
  for (let i = 0; i < 120; i++) p.update(0.05);
  p.clear(); p.clear();
  assert.equal(resources.size, 0);
  assert.equal(released.length, 30);
  assert.equal(new Set(released).size, 30);
});

// Catches unbounded or invalid delta driving a resumed tab into an explosion.
test('delayed frames are capped and invalid deltas do not corrupt time', () => {
  const p = new Playback(() => ({ update() {}, dispose() {} }));
  p.cast('fusion');
  p.update(400);
  assert.equal(p.time, 0.05);
  p.update(-1); p.update(NaN); p.update(Infinity);
  assert.equal(p.time, 0.05);
  assert.equal(p.phase, 'charge');
});
