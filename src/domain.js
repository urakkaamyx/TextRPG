import { randomUUID } from 'node:crypto';

export const GENRES = {
  fantasy: { label: 'High fantasy', tone: 'A lived-in fantasy world of small wonders and old roads.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Vitals', 'Quests'] },
  'science-fiction': { label: 'Science fiction', tone: 'A grounded frontier among distant stars.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Vitals', 'Quests'] },
  cozy: { label: 'Cozy', tone: 'A warm, low-stakes world of neighbors, craft, and community.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Quests'] },
  western: { label: 'Western', tone: 'A frontier shaped by hard work, long distances, and close-knit towns.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Vitals', 'Quests'] },
  historical: { label: 'Historical', tone: 'A human-scale story grounded in its chosen era.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Quests'] },
  horror: { label: 'Horror', tone: 'An unsettling world where tension grows from what is actually encountered.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Checks', 'Quests'] },
  modern: { label: 'Modern', tone: 'Everyday life, relationships, and opportunity in the present day.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Quests'] },
  mystery: { label: 'Mystery', tone: 'A fair-play investigation built from discoverable evidence.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Checks', 'Quests'] },
  'post-apocalyptic': { label: 'Post-apocalyptic', tone: 'A resourceful community rebuilding amid a changed landscape.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Inventory', 'Vitals', 'Quests'] },
  superhero: { label: 'Superhero', tone: 'A modern world with extraordinary abilities and human consequences.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Checks', 'Vitals', 'Quests'] },
  custom: { label: 'Custom', tone: 'A world shaped by your own premise and rules.', plugins: ['Maps', 'Time', 'Exploration', 'Dialogue', 'Professions', 'Inventory', 'Vitals', 'Quests'] }
};

const clone = value => structuredClone(value);
const id = prefix => `${prefix}-${randomUUID().slice(0, 8)}`;
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const actor = (name, locationId, role, description) => ({ id: id('actor'), name, locationId, role, description, known: true, canSpeak: true, duties: [], memories: [] });

export function createStory({ name, playerName, genre = 'fantasy', premise = '' }) {
  const profile = GENRES[genre] ? genre : 'fantasy';
  const now = new Date().toISOString();
  const home = { id: 'loc-hearthside', name: 'Hearthside', description: 'A welcoming village tucked between pine-covered hills and a clear-running river.', known: true, services: ['Inn', 'Notice board', 'Market'] };
  const mill = { id: 'loc-mill', name: 'Old Mill Crossing', description: 'A working mill beside the river, where the road bends toward the wooded ridge.', known: true, services: ['Mill'] };
  const ridge = { id: 'loc-ridge', name: 'Pinewatch Ridge', description: 'A quiet rise above the valley. Wind moves through the pines and the village roofs sit far below.', known: true, services: [] };
  const player = actor(playerName || 'Traveler', home.id, 'player', 'The protagonist');
  player.id = 'player';
  player.vitals = { HP: { current: 10, max: 10 }, Stamina: { current: 8, max: 8 } };
  player.stats = { Grit: 2, Insight: 1, Grace: 1 };
  const mara = actor('Mara', mill.id, 'miller', 'A practical miller with flour-dusted sleeves and an eye for careful work.');
  mara.duties = ['Keeps the mill running and accepts occasional help with repairs.'];
  const innkeeper = actor('Tovin', home.id, 'innkeeper', 'The innkeeper remembers nearly everyone who passes through.');
  innkeeper.duties = ['Runs the Hearthside Inn.'];
  const state = {
    id: id('story'), name: (name || 'A New Beginning').trim().slice(0, 64), genre: profile,
    premise: (premise || '').trim().slice(0, 500) || GENRES[profile].tone,
    createdAt: now, updatedAt: now, revision: 0,
    world: { time: 8, day: 1, weather: 'Clear', season: 'Early Autumn', foundation: { status: 'anchored', pillars: ['A welcoming valley', 'A world that responds to player choices'], rules: ['The engine records what happens; narration cannot change the rules.'], anchorLocationId: home.id } },
    actors: [player, mara, innkeeper], locations: [home, mill, ridge],
    routes: [
      { id: 'route-river', from: home.id, to: mill.id, name: 'River Road', duration: 2, known: true, blocked: false },
      { id: 'route-ridge', from: home.id, to: ridge.id, name: 'Pine Path', duration: 3, known: true, blocked: false },
      { id: 'route-return', from: mill.id, to: home.id, name: 'Village Track', duration: 2, known: true, blocked: false },
      { id: 'route-downhill', from: ridge.id, to: home.id, name: 'Hill Road', duration: 3, known: true, blocked: false }
    ],
    inventory: [{ id: id('item'), name: 'Travel cloak', type: 'Clothing', weight: 2.1, condition: 94, quantity: 1 }, { id: id('item'), name: 'Trail bread', type: 'Consumable', weight: 0.3, condition: 100, quantity: 2, effects: { Stamina: 1 } }],
    currency: { name: 'Crowns', balance: 6 },
    employerFunds: { [mara.id]: 24 },
    jobOffers: [{ id: 'job-mill-help', employerId: mara.id, title: 'Help at the mill', description: 'Sort grain sacks and tidy the work floor.', wage: 8, duration: 2, materials: [], locationId: mill.id, active: true }],
    knownJobOffers: [],
    completedJobs: [], quests: [], events: [], receipts: [], turns: [], conversations: [],
    plugins: Object.fromEntries([...new Set([...GENRES[profile].plugins, 'Travel', 'Inventory', 'Vitals'])].map(plugin => [plugin.toLowerCase(), { name: plugin, enabled: true }])),
    settings: { narrationDepth: 'balanced', survivalEnabled: false }
  };
  const greeting = `${state.premise} Morning light settles over ${home.name}. The inn is stirring, the river road is open, and the day is yours to shape.`;
  const foundationEvent = { id: id('event'), type: 'WorldFoundationAnchored', tick: 8, summary: `The world foundation is anchored to the known starting place, ${home.name}.`, public: true, source: 'worldbuilding.core', locationId: home.id };
  const mapEvent = { id: id('event'), type: 'MapInitialized', tick: 8, summary: `${state.locations.length} known locations and ${state.routes.length} open routes are ready to explore.`, public: true, source: 'rpg.maps' };
  const createdEvent = { id: id('event'), type: 'StoryCreated', tick: 8, summary: greeting, public: true, source: 'worldbuilding.core' };
  state.events.push(foundationEvent, mapEvent, createdEvent);
  state.receipts.push({ commandId: `story-create:${foundationEvent.id}`, eventIds: [foundationEvent.id], status: 'applied', pluginId: 'worldbuilding.core', commandType: 'AnchorWorldFoundation', revision: 0 }, { commandId: `story-create:${mapEvent.id}`, eventIds: [mapEvent.id], status: 'applied', pluginId: 'rpg.maps', commandType: 'InitializeMap', revision: 0 });
  state.turns.push({ id: id('turn'), input: '', at: now, entries: [{ kind: 'narration', text: greeting }] });
  return state;
}

function currentLocation(state) { return state.locations.find(location => location.id === state.actors.find(a => a.id === 'player')?.locationId); }
function emit(state, type, summary, source, extra = {}) {
  const event = { id: id('event'), type, tick: state.world.time, summary, public: true, source, ...extra };
  state.events.push(event);
  return event;
}
function addReceipt(state, commandId, event, pluginId, commandType) {
  state.receipts.push({ commandId, eventIds: event ? [event.id] : [], status: event ? 'applied' : 'skipped', pluginId, commandType, revision: state.revision + 1 });
}
function advanceTime(state, duration, reason) {
  if (!Number.isInteger(duration) || duration < 1 || duration > 24) throw new Error('Time must advance by a whole number of hours, from 1 to 24.');
  state.world.time += duration;
  while (state.world.time >= 24) { state.world.time -= 24; state.world.day += 1; }
  const hour = state.world.time;
  const label = `${String(hour).padStart(2, '0')}:00`;
  return emit(state, 'TimeAdvanced', `${duration} hour${duration === 1 ? '' : 's'} pass (${reason}). It is now ${label} on day ${state.world.day}.`, 'rpg.time', { duration, reason });
}
function chooseRoute(state, target) {
  const here = currentLocation(state);
  const candidates = state.routes.filter(route => route.known && route.from === here?.id);
  const normalized = target.toLowerCase();
  return candidates.find(route => {
    const destination = state.locations.find(place => place.id === route.to);
    return destination && [destination.name, route.name].some(name => name.toLowerCase().includes(normalized) || normalized.includes(name.toLowerCase()));
  }) || candidates.find(route => state.locations.find(place => place.id === route.to)?.name.toLowerCase() === normalized);
}
function move(state, route) {
  const destination = state.locations.find(location => location.id === route.to);
  const origin = currentLocation(state);
  const timeEvent = advanceTime(state, route.duration, `travel along ${route.name}`);
  const player = state.actors.find(a => a.id === 'player');
  player.locationId = destination.id;
  const event = emit(state, 'JourneyAdvanced', `You travel from ${origin.name} to ${destination.name} along ${route.name}. The journey takes ${route.duration} hours.`, 'rpg.travel', { from: origin.id, to: destination.id, routeId: route.id, timeEventId: timeEvent.id });
  return { timeEvent, event, destination };
}
function nearbyActor(state, query) {
  const here = currentLocation(state);
  return state.actors.find(a => a.id !== 'player' && a.locationId === here?.id && a.known && a.name.toLowerCase() === query.toLowerCase());
}
function speak(state, target, topic, entries) {
  const person = nearbyActor(state, target);
  if (!person) {
    const event = emit(state, 'AreaInspected', `You look around ${currentLocation(state).name}, but ${target} is not here. No distant whereabouts are revealed.`, 'rpg.exploration', { searchedActor: target, found: false });
    entries.push({ kind: 'result', label: 'Search', text: event.summary });
    return event;
  }
  const isWork = /work|job|earning|coin|employment|hire|paid/i.test(topic);
  let response;
  let speechType = 'neutral';
  if (isWork) {
    const offer = state.jobOffers.find(item => item.employerId === person.id && item.active && !state.completedJobs.includes(item.id));
    if (offer) {
      response = `“I could use a hand here,” ${person.name} says. “${offer.title}: ${offer.description} It takes about ${offer.duration} hours, and I can pay ${offer.wage} ${state.currency.name} when it is done. No pressure.”`;
      speechType = 'work-paid-offer';
    } else {
      response = `“I don't have a paid shift to offer right now,” ${person.name} says. “You might try the notice board back in Hearthside.”`;
      speechType = 'work-no-lead';
    }
  } else if (/how are you|hello|hi\b|greet/i.test(topic)) {
    response = `“Well met,” ${person.name} says with a small smile.`;
  } else {
    response = `“${topic.replace(/[.!?]+$/, '')}?” ${person.name} considers the question. “I can tell you what I've seen here, but I don't want to guess at the rest.”`;
  }
  const offerId = isWork ? state.jobOffers.find(o => o.employerId === person.id && o.active && !state.completedJobs.includes(o.id))?.id ?? null : null;
  if (offerId && speechType === 'work-paid-offer') state.knownJobOffers.push(offerId);
  const event = emit(state, 'SpeakApplied', `${person.name}: ${response}`, 'rpg.dialogue', { actorId: person.id, topic, speechType, offerId });
  state.conversations.push({ id: id('conversation'), actorId: person.id, locationId: person.locationId, eventId: event.id, topic, speechType, tick: state.world.time });
  entries.push({ kind: 'speech', speaker: person.name, text: response, eventId: event.id });
  return event;
}

function parseDestination(text) {
  const patterns = [/(?:travel|walk|go|head|journey|return|make my way|visit)(?:\s+back)?\s+(?:to|toward|for)\s+([^,.!?;]+?)(?:\s+(?:and|then|to find|to ask|to inspect|to explore)\b|$)/i,
    /(?:to|toward)\s+(Hearthside|Old Mill Crossing|the mill|Pinewatch Ridge|the ridge|the inn|home)(?:\b|$)/i];
  for (const pattern of patterns) { const match = text.match(pattern); if (match) return match[1].trim().replace(/^(the|a)\s+/i, ''); }
  return null;
}

export function applyTurn(original, payload) {
  if (!payload || typeof payload.input !== 'string' || !payload.input.trim()) throw new Error('Write an action before sending your turn.');
  const input = payload.input.trim().slice(0, 1200);
  const turnId = String(payload.turnId || id('turn')).slice(0, 80);
  const existing = original.turns.find(turn => turn.id === turnId);
  if (existing) return { state: clone(original), turn: clone(existing), replayed: true };
  if (Number.isInteger(payload.expectedRevision) && payload.expectedRevision !== original.revision) {
    const error = new Error('This story changed in another tab. Refresh the latest state before taking another turn.');
    error.statusCode = 409;
    throw error;
  }
  const state = clone(original);
  const entries = [{ kind: 'player', text: input }];
  const lower = input.toLowerCase();
  const actions = [];
  const destinationName = parseDestination(input);
  if (destinationName) {
    const route = chooseRoute(state, destinationName);
    if (route && !route.blocked && state.plugins.travel?.enabled !== false) {
      const moved = move(state, route);
      actions.push({ pluginId: 'rpg.time', commandType: 'AdvanceTime', event: moved.timeEvent });
      actions.push({ pluginId: 'rpg.travel', commandType: 'AdvanceJourney', event: moved.event });
      entries.push({ kind: 'narration', text: `The road unwinds ahead of you. ${moved.event.summary}` });
    } else if (route?.blocked) {
      entries.push({ kind: 'result', label: 'Travel', text: `The ${route.name} is blocked. You cannot reach ${destinationName} by this route right now.` });
    } else if (route) {
      entries.push({ kind: 'result', label: 'Travel', text: 'The Travel module is disabled for this story. Enable it from Add-ons to move.' });
    } else {
      const available = state.routes.filter(route => route.from === currentLocation(state)?.id && route.known).map(route => state.locations.find(place => place.id === route.to)?.name);
      const where = available.length ? ` Known open destinations from here: ${available.join(', ')}.` : '';
      entries.push({ kind: 'result', label: 'Travel', text: `There is no known open route from ${currentLocation(state).name} to ${destinationName}.${where}` });
    }
  }

  const inspect = /\b(inspect|look around|search the area|explore|examine|survey)\b/i.test(input);
  const seeking = input.match(/\bfind\s+([A-Z][\p{L}'-]{1,30})/iu) || input.match(/\blook for\s+([A-Z][\p{L}'-]{1,30})/iu);
  const requestedPerson = state.actors.filter(a => a.id !== 'player' && a.known).find(a => new RegExp(`\\b(?:ask|talk to|speak to|find|look for)\\s+(?:the\\s+)?${escapeRegExp(a.name)}\\b`, 'i').test(input));
  const namedTarget = seeking?.[1] || requestedPerson?.name || (/(?:ask|speak to|talk to|tell)\s+(?:her|him|them)\b/i.test(input) ? state.actors.find(a => a.id !== 'player' && state.conversations.some(c => c.actorId === a.id))?.name : null);
  const hasAsk = /\b(ask|talk to|speak to|tell)\b/i.test(input);
  const question = input.match(/\b(?:about|whether|if)\s+(.+?)(?:[.!?]|$)/i)?.[1] || (namedTarget ? input.replace(new RegExp(`.*?${escapeRegExp(namedTarget)}\\s*`, 'i'), '').replace(/^(about\s+)?/i, '').replace(/[.!?]+$/, '').trim() : 'how things are going');
  const askWork = /work|job|coin|earning|employment|hiring|paid/i.test(input);

  if (namedTarget && (hasAsk || seeking)) {
    if (currentLocation(state)?.id !== state.actors.find(a => a.id === namedTarget || a.name.toLowerCase() === namedTarget.toLowerCase())?.locationId) {
      // Search is local and reports absence without revealing remote location.
      const person = state.actors.find(a => a.id !== 'player' && a.name.toLowerCase() === namedTarget.toLowerCase() && a.known);
      if (person && state.plugins.exploration?.enabled === false) {
        entries.push({ kind: 'result', label: 'Search', text: 'Exploration is disabled for this story. No search is recorded.' });
      } else if (person) {
        const event = emit(state, 'AreaInspected', `${namedTarget} is not here at ${currentLocation(state).name}. You learn no more about their whereabouts.`, 'rpg.exploration', { searchedActor: person.id, found: false });
        actions.push({ pluginId: 'rpg.exploration', commandType: 'ExploreZone', event });
        entries.push({ kind: 'result', label: 'Search', text: event.summary });
      } else {
        entries.push({ kind: 'result', label: 'Search', text: `You don't have enough information to identify ${namedTarget} as someone you know.` });
      }
    } else if (hasAsk && state.plugins.dialogue?.enabled === false) {
      entries.push({ kind: 'result', label: 'Dialogue', text: 'Dialogue is disabled for this story. Enable it from Add-ons to speak with people.' });
    } else if (hasAsk) {
      const event = speak(state, namedTarget, askWork ? 'work opportunities to earn some coin' : question, entries);
      actions.push({ pluginId: 'rpg.dialogue', commandType: 'Speak', event });
    }
  } else if (hasAsk && !namedTarget) {
    const person = state.actors.find(a => a.id !== 'player' && a.locationId === currentLocation(state)?.id && a.known);
    if (state.plugins.dialogue?.enabled === false) entries.push({ kind: 'result', label: 'Dialogue', text: 'Dialogue is disabled for this story. Enable it from Add-ons to speak with people.' });
    else if (person) {
      const event = speak(state, person.name, askWork ? 'work opportunities to earn some coin' : question, entries);
      actions.push({ pluginId: 'rpg.dialogue', commandType: 'Speak', event });
    } else entries.push({ kind: 'result', label: 'Dialogue', text: 'There is no known person here to answer. You can travel somewhere familiar or describe another action.' });
  }

  if (inspect && !namedTarget) {
    const location = currentLocation(state);
    if (state.plugins.exploration?.enabled === false) {
      entries.push({ kind: 'result', label: 'Explore', text: 'Exploration is disabled for this story. No inspection is recorded.' });
    } else {
    const event = emit(state, 'AreaInspected', `You take a careful look around ${location.name}. ${location.description} Nothing new is revealed by this inspection.`, 'rpg.exploration', { locationId: location.id, discoveries: [] });
    actions.push({ pluginId: 'rpg.exploration', commandType: 'ExploreZone', event });
    entries.push({ kind: 'narration', text: event.summary });
    }
  }

  const consumeIntent = /\b(eat|consume|use)\b/i.test(input);
  if (consumeIntent) {
    const item = state.inventory.find(candidate => candidate.type === 'Consumable' && candidate.quantity > 0 && lower.includes(candidate.name.toLowerCase()));
    if (state.plugins.inventory?.enabled === false) {
      entries.push({ kind: 'result', label: 'Inventory', text: 'Inventory is disabled for this story. No item is consumed.' });
    } else if (!item) {
      entries.push({ kind: 'result', label: 'Inventory', text: 'You do not have that consumable in your pack.' });
    } else if (state.plugins.vitals?.enabled === false) {
      entries.push({ kind: 'result', label: 'Item', text: 'The Vitals module is disabled, so this item has no active effect.' });
    } else {
      const player = state.actors.find(actor => actor.id === 'player');
      const effects = Object.entries(item.effects || {}).map(([name, amount]) => [name, amount, player.vitals?.[name]]);
      const effective = effects.filter(([, amount, vital]) => vital && vital.current < vital.max && Number.isFinite(amount) && amount > 0);
      if (!effective.length) {
        entries.push({ kind: 'result', label: 'Item', text: `${item.name} would not help right now, so you keep it.` });
      } else {
        item.quantity -= 1;
        if (item.quantity <= 0) state.inventory = state.inventory.filter(candidate => candidate.id !== item.id);
        const itemEvent = emit(state, 'ItemConsumed', `You consume ${item.name}.`, 'rpg.inventory', { itemId: item.id, itemName: item.name, quantity: 1 });
        actions.push({ pluginId: 'rpg.inventory', commandType: 'ConsumeItem', event: itemEvent });
        for (const [name, amount, vital] of effective) {
          const before = vital.current;
          vital.current = Math.min(vital.max, vital.current + amount);
          const vitalEvent = emit(state, 'VitalChanged', `${name} recovers ${vital.current - before} point${vital.current - before === 1 ? '' : 's'} from ${item.name}.`, 'rpg.vitals', { actorId: player.id, vital: name, before, after: vital.current, sourceEventId: itemEvent.id });
          actions.push({ pluginId: 'rpg.vitals', commandType: 'ApplyItemEffect', event: vitalEvent });
        }
        entries.push({ kind: 'result', label: 'Item used', text: `${itemEvent.summary} ${effective.map(([name]) => `${name} is now ${player.vitals[name].current}/${player.vitals[name].max}.`).join(' ')}` });
      }
    }
  }

  const performWork = /\b(?:do|perform|work|complete|take)\b.{0,35}\b(?:job|shift|paid work|offer)\b/i.test(input) || /\bwork (?:at|for) (?:the )?mill\b/i.test(input);
  if (performWork) {
    if (state.plugins.professions?.enabled === false) {
      entries.push({ kind: 'result', label: 'Work', text: 'The Professions module is disabled for this story. No work or payment is recorded.' });
    } else {
    const offer = state.jobOffers.find(job => job.active && !state.completedJobs.includes(job.id) && job.locationId === currentLocation(state)?.id && (state.knownJobOffers || []).includes(job.id));
    if (!offer) {
      entries.push({ kind: 'result', label: 'Work', text: 'There is no active paid offer you have been given to complete here. Asking about a job is different from performing one.' });
    } else if ((state.employerFunds[offer.employerId] || 0) < offer.wage) {
      entries.push({ kind: 'result', label: 'Work', text: 'The employer cannot fund this offer, so the shift cannot be completed or paid.' });
    } else {
      const timeEvent = advanceTime(state, offer.duration, `work: ${offer.title}`);
      state.employerFunds[offer.employerId] -= offer.wage;
      state.currency.balance += offer.wage;
      state.completedJobs.push(offer.id);
      const event = emit(state, 'PerformJobApplied', `You finish ${offer.title}. ${offer.wage} ${state.currency.name} are paid into your purse for ${offer.duration} hours of work.`, 'rpg.professions', { offerId: offer.id, wage: offer.wage, currency: state.currency.name, employerId: offer.employerId, timeEventId: timeEvent.id });
      actions.push({ pluginId: 'rpg.time', commandType: 'AdvanceTime', event: timeEvent });
      actions.push({ pluginId: 'rpg.professions', commandType: 'PerformJob', event });
      entries.push({ kind: 'result', label: 'Paid work', text: event.summary });
    }
    }
  }

  const waitMatch = input.match(/\b(?:wait|rest|sleep)\s+(?:for\s+)?(\d+)\s*hours?\b/i);
  if (waitMatch && !performWork) {
    const duration = Math.min(24, Math.max(1, Number(waitMatch[1])));
    const event = advanceTime(state, duration, 'downtime');
    actions.push({ pluginId: 'rpg.time', commandType: 'AdvanceTime', event });
    entries.push({ kind: 'narration', text: `You take some quiet time. ${event.summary} Ordinary downtime does not automatically restore health or stamina.` });
  }

  const helpAction = /\b(help|what can i do|what do i do)\b/i.test(lower);
  if (!actions.length && !entries.some(entry => entry.kind === 'result') && !helpAction) {
    const event = emit(state, 'IntentUnresolved', 'I could not safely resolve that into a supported game action. Try a known route, inspect your surroundings, talk with someone here, perform an available job, or wait for a number of hours.', 'turn.coordinator');
    entries.push({ kind: 'result', label: 'No action committed', text: event.summary });
  }
  if (helpAction) entries.push({ kind: 'narration', text: 'Try: “travel to Old Mill Crossing,” “find Mara and ask about work,” “inspect the area,” “perform the paid job,” or “rest for 2 hours.” Available actions depend on your current location and established world state.' });

  const turn = { id: turnId, input, at: new Date().toISOString(), revision: state.revision + 1, entries, actions: actions.map(({ pluginId, commandType, event }) => ({ pluginId, commandType, eventId: event.id })) };
  for (const action of actions) addReceipt(state, `${turnId}:${action.commandType}:${action.event.id}`, action.event, action.pluginId, action.commandType);
  state.turns.push(turn);
  state.revision += 1;
  state.updatedAt = new Date().toISOString();
  return { state, turn, replayed: false };
}

export function publicState(state) {
  const locationById = Object.fromEntries(state.locations.map(location => [location.id, location]));
  const here = currentLocation(state);
  const player = state.actors.find(a => a.id === 'player');
  return {
    id: state.id, name: state.name, genre: state.genre, genreLabel: GENRES[state.genre]?.label || 'Custom', premise: state.premise,
    revision: state.revision, createdAt: state.createdAt, updatedAt: state.updatedAt,
    world: { ...state.world, timeLabel: `${String(state.world.time).padStart(2, '0')}:00`, location: here, knownLocations: state.locations.filter(location => location.known), routes: state.routes.filter(route => route.known) },
    player: { id: player.id, name: player.name, vitals: player.vitals, stats: player.stats, locationId: player.locationId },
    people: state.actors.filter(a => a.id !== 'player' && a.known).map(a => ({ id: a.id, name: a.name, role: a.role, isHere: a.locationId === player.locationId, description: a.description, canSpeak: a.canSpeak })),
    inventory: state.inventory, currency: state.currency,
    jobs: state.jobOffers.filter(job => job.active && !state.completedJobs.includes(job.id) && (state.knownJobOffers || []).includes(job.id)).map(job => ({ id: job.id, title: job.title, description: job.description, wage: job.wage, duration: job.duration, employer: state.actors.find(a => a.id === job.employerId)?.name, locationName: locationById[job.locationId]?.name, availableHere: job.locationId === player.locationId })), 
    completedJobs: state.completedJobs.length, quests: state.quests, events: state.events.filter(event => event.public).slice(-30), receipts: state.receipts.slice(-40),
    turns: state.turns.slice(-80), plugins: state.plugins, settings: state.settings,
    nearby: state.actors.filter(a => a.id !== 'player' && a.known && a.locationId === player.locationId).map(a => ({ id: a.id, name: a.name, role: a.role, description: a.description }))
  };
}

export function updatePlugin(state, pluginKey, enabled, expectedRevision) {
  if (state.revision !== expectedRevision) { const error = new Error('This story changed in another tab. Refresh before changing settings.'); error.statusCode = 409; throw error; }
  if (!/^[a-z0-9-]{2,32}$/.test(pluginKey)) throw new Error('Invalid plugin key.');
  const next = clone(state);
  if (!next.plugins[pluginKey]) {
    const title = pluginKey.split('-').map(part => part[0]?.toUpperCase() + part.slice(1)).join(' ');
    next.plugins[pluginKey] = { name: title, enabled: true };
  }
  if (['maps', 'time', 'exploration', 'dialogue'].includes(pluginKey) && enabled === false) throw new Error('Core world foundations and essential play systems cannot be disabled.');
  next.plugins[pluginKey].enabled = Boolean(enabled);
  next.revision += 1;
  next.updatedAt = new Date().toISOString();
  emit(next, 'PluginConfigurationChanged', `${next.plugins[pluginKey].name} ${enabled ? 'enabled' : 'disabled'}.`, 'configuration');
  return next;
}
