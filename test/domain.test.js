import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTurn, createStory, publicState, updatePlugin } from '../src/domain.js';

function turn(state, input, turnId, revision = state.revision) {
  return applyTurn(state, { input, turnId, expectedRevision: revision });
}

test('new worlds are anchored to a real starting place with source receipts', () => {
  const state = createStory({ name: 'River Days', playerName: 'Ari', genre: 'cozy' });
  assert.equal(state.world.foundation.status, 'anchored');
  assert.equal(state.actors.find(actor => actor.id === 'player').locationId, state.world.foundation.anchorLocationId);
  assert.ok(state.receipts.some(receipt => receipt.commandType === 'AnchorWorldFoundation'));
  assert.equal(publicState(state).player.name, 'Ari');
});

test('composite travel, local search, and work inquiry are ordered and source-bound', () => {
  const initial = createStory({ name: 'At the Mill', playerName: 'Ari' });
  const result = turn(initial, 'Travel to Old Mill Crossing, find Mara and ask her about work opportunities to earn coin.', 'turn-compound');
  assert.equal(result.state.actors.find(actor => actor.id === 'player').locationId, 'loc-mill');
  assert.equal(result.state.world.time, 10);
  assert.deepEqual(result.turn.actions.map(action => action.commandType), ['AdvanceTime', 'AdvanceJourney', 'Speak']);
  const speech = result.state.events.find(event => event.type === 'SpeakApplied');
  assert.equal(speech.actorId, result.state.actors.find(actor => actor.name === 'Mara').id);
  assert.equal(speech.speechType, 'work-paid-offer');
  assert.equal(result.state.currency.balance, 6, 'asking about work does not pay wages');
  assert.ok(result.state.knownJobOffers.includes('job-mill-help'));
  assert.ok(result.state.receipts.some(receipt => receipt.eventIds.includes(speech.id) && receipt.status === 'applied'));
});

test('performing a real funded job transfers money once and records time', () => {
  const moved = turn(createStory({}), 'Travel to Old Mill Crossing and ask Mara about work.', 'turn-1');
  const worked = turn(moved.state, 'Perform the paid job.', 'turn-2');
  assert.equal(worked.state.currency.balance, 14);
  assert.equal(worked.state.employerFunds[moved.state.jobOffers[0].employerId], 16);
  assert.equal(worked.state.world.time, 12);
  assert.equal(worked.state.completedJobs.length, 1);
  assert.equal(worked.state.events.filter(event => event.type === 'PerformJobApplied').length, 1);
  const repeated = turn(worked.state, 'Perform the paid job again.', 'turn-3');
  assert.equal(repeated.state.currency.balance, 14);
  assert.equal(repeated.state.events.filter(event => event.type === 'PerformJobApplied').length, 1);
});

test('using a consumable changes its quantity and a bounded vital through owner events', () => {
  const state = createStory({});
  state.actors.find(actor => actor.id === 'player').vitals.Stamina.current = 6;
  const result = turn(state, 'Eat a Trail bread.', 'turn-consume');
  assert.equal(result.state.actors.find(actor => actor.id === 'player').vitals.Stamina.current, 7);
  assert.equal(result.state.inventory.find(item => item.name === 'Trail bread').quantity, 1);
  assert.deepEqual(result.turn.actions.map(action => action.commandType), ['ConsumeItem', 'ApplyItemEffect']);
  const applied = result.state.events.find(event => event.type === 'VitalChanged');
  assert.equal(applied.after, 7);
  assert.ok(result.state.receipts.some(receipt => receipt.eventIds.includes(applied.id) && receipt.status === 'applied'));
});

test('a consumable is retained when it would exceed or cannot improve a full vital', () => {
  const state = createStory({});
  const result = turn(state, 'Use Trail bread.', 'turn-full-vital');
  assert.equal(result.state.actors.find(actor => actor.id === 'player').vitals.Stamina.current, 8);
  assert.equal(result.state.inventory.find(item => item.name === 'Trail bread').quantity, 2);
  assert.equal(result.state.events.some(event => event.type === 'ItemConsumed'), false);
});

test('ordinary work does not create currency and an inquiry is not a payout', () => {
  let state = createStory({});
  const start = state.currency.balance;
  state = turn(state, 'Talk to Tovin about work.', 'turn-talk').state;
  assert.equal(state.currency.balance, start);
  assert.equal(state.events.filter(event => event.type === 'PerformJobApplied').length, 0);
});

test('searches are local and do not expose a remote person location', () => {
  const state = createStory({});
  const search = turn(state, 'Find Mara and ask her about work.', 'turn-search');
  const publicView = publicState(search.state);
  const mara = publicView.people.find(person => person.name === 'Mara');
  assert.equal(mara.isHere, false);
  assert.equal('locationId' in mara, false);
  assert.equal('locationName' in mara, false);
  assert.match(search.state.events.at(-1).summary, /not here/);
  assert.equal(search.state.events.at(-1).found, false);
  assert.equal(search.state.events.some(event => event.type === 'SpeakApplied'), false);
});

test('a named remote NPC is never replaced by a different nearby speaker', () => {
  const state = createStory({});
  const result = turn(state, 'Ask Mara about work opportunities.', 'turn-explicit-person');
  assert.equal(result.state.events.filter(event => event.type === 'SpeakApplied').length, 0);
  assert.equal(result.state.events.at(-1).type, 'AreaInspected');
  assert.match(result.state.events.at(-1).summary, /Mara is not here/);
  assert.equal(result.turn.entries.some(entry => entry.speaker === 'Tovin'), false);
});

test('blocked routes do not move the player or advance time', () => {
  const state = createStory({});
  state.routes.find(route => route.id === 'route-river').blocked = true;
  const result = turn(state, 'Travel to Old Mill Crossing.', 'turn-blocked');
  assert.equal(result.state.actors.find(actor => actor.id === 'player').locationId, 'loc-hearthside');
  assert.equal(result.state.world.time, 8);
  assert.equal(result.state.events.filter(event => event.type === 'JourneyAdvanced').length, 0);
  assert.match(result.turn.entries.at(-1).text, /blocked/);
});

test('turn ids are idempotent and stale revisions are rejected', () => {
  const original = createStory({});
  const applied = turn(original, 'Wait for 1 hour.', 'stable-turn');
  const replay = turn(applied.state, 'Wait for 1 hour.', 'stable-turn');
  assert.equal(replay.replayed, true);
  assert.equal(replay.state.revision, applied.state.revision);
  assert.throws(() => turn(applied.state, 'Wait for 1 hour.', 'stale-turn', 0), /changed in another tab/);
});

test('disabled add-ons stop their mechanics without changing owner state', () => {
  const created = createStory({});
  const configured = updatePlugin(created, 'professions', false, 0);
  const moved = turn(configured, 'Travel to Old Mill Crossing and ask Mara about work.', 'turn-ask');
  const result = turn(moved.state, 'Perform the paid job.', 'turn-work');
  assert.equal(result.state.currency.balance, 6);
  assert.equal(result.state.completedJobs.length, 0);
  assert.equal(result.state.events.filter(event => event.type === 'PerformJobApplied').length, 0);
  assert.match(result.turn.entries.at(-1).text, /disabled/);
});

test('unknown actions do not invent mechanical progress', () => {
  const state = createStory({});
  const result = turn(state, 'I declare that a dragon gives me one thousand crowns.', 'turn-unsupported');
  assert.equal(result.state.currency.balance, 6);
  assert.equal(result.state.actors.find(actor => actor.id === 'player').locationId, 'loc-hearthside');
  assert.deepEqual(result.turn.actions, []);
  assert.equal(result.state.events.some(event => event.type === 'CurrencyGranted'), false);
});
