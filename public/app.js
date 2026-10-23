const app = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');
const icons = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 16a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12a4 4 0 0 1 0 7.75"/></svg>',
  journal: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18m4-13h6m-6 4h6"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l1 13H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2"/></svg>',
  sliders: '<svg viewBox="0 0 24 24"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 15l.8 1.7L7.5 17.5l-1.7.8L5 20l-.8-1.7-1.7-.8 1.7-.8L5 15Z"/></svg>'
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let stories = [];
let story = null;
let screen = 'loading';
let modal = '';
let genres = [];
let busy = false;
let activeSide = { left: 'World', right: 'Character' };
let openSides = { left: true, right: true };
let mobileSide = '';
let draft = '';
let createForm = { name: '', playerName: '', genre: 'fantasy', premise: '' };

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.error || 'Something went wrong.'); error.status = response.status; throw error; }
  return body;
}
function toast(message, kind = 'error') {
  const element = document.createElement('div'); element.className = `toast toast-${kind}`; element.textContent = message;
  toastRegion.append(element); setTimeout(() => element.remove(), 4200);
}
function getGenre(id) { return genres.find(item => item.id === id)?.label || id; }
function timeOfDay(hour) { return hour < 6 ? 'Night' : hour < 11 ? 'Morning' : hour < 16 ? 'Afternoon' : hour < 20 ? 'Evening' : 'Night'; }
function initials(name) { return (name || 'T').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase(); }

async function init() {
  try {
    const [storyResult, genreResult] = await Promise.all([api('/api/stories'), api('/api/genres')]);
    stories = storyResult.stories; genres = genreResult.genres;
    const last = localStorage.getItem('textrpg-active-story');
    if (last && stories.some(item => item.id === last)) await openStory(last);
    else screen = 'home';
    render();
  } catch (error) { app.innerHTML = `<main class="fatal"><span class="mark">T</span><h1>We couldn't open the storybook.</h1><p>${esc(error.message)}</p><button class="button button-primary" data-reload>Try again</button></main>`; }
}

async function refreshStory() {
  const response = await api(`/api/stories/${story.id}`);
  story = response.story; localStorage.setItem('textrpg-active-story', story.id);
}
async function openStory(id) {
  const response = await api(`/api/stories/${id}`);
  story = response.story; screen = 'game'; modal = ''; mobileSide = '';
  localStorage.setItem('textrpg-active-story', story.id);
  render();
}

function render() {
  if (screen === 'loading') return;
  app.innerHTML = screen === 'home' ? renderHome() : renderGame();
  bindEvents();
}

function renderHome() {
  const recent = stories.slice(0, 4);
  return `<main class="home-page">
    <header class="home-top"><a class="brand" href="#" aria-label="TextBasedRPG home"><span class="brand-mark">T</span><span>TEXT<span class="brand-light">BASE</span><span class="brand-rpg">RPG</span></span></a><div class="home-top-right"><span class="local-pill"><i></i> Local story storage</span><span class="version-label">0.1.0 · A new beginning</span></div></header>
    <section class="hero-section"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-line"></span> YOUR STORY, YOUR PACE</p><h1>A world that<br><em>remembers.</em></h1><p class="hero-description">A persistent text RPG built around the choices you make. Explore at your own pace, meet people where they are, and let the story grow from what actually happens.</p><div class="hero-actions"><button class="button button-primary button-large" data-action="new-story">Begin a new story <span>${icons.arrow}</span></button><span class="no-key">No account or AI key required</span></div><div class="hero-footnotes"><span>${icons.book} Your story saves locally</span><span>${icons.spark} The rules stay grounded</span></div></div>
    <div class="hero-art" aria-label="An illustrated village valley at dawn"><div class="art-grain"></div><div class="sun-disc"></div><div class="distant-mountain mountain-one"></div><div class="distant-mountain mountain-two"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><div class="river"></div><div class="village"><i></i><i></i><i></i><i></i></div><div class="art-caption"><span class="caption-pin">✳</span><span><b>THE VALLEY OF HEARTHSIDE</b><small>A quiet place to begin again.</small></span></div></div></section>
    ${recent.length ? `<section class="saved-section"><div class="section-heading"><div><p class="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Your stories</h2></div><button class="button button-quiet" data-action="new-story">+ New story</button></div><div class="saved-grid">${recent.map(item => `<button class="saved-card" data-story="${esc(item.id)}"><span class="saved-glyph">${esc((getGenre(item.genre) || 'S')[0])}</span><span class="saved-info"><b>${esc(item.name)}</b><small>${esc(getGenre(item.genre))} · Saved ${formatDate(item.updatedAt)}</small></span><span class="saved-arrow">${icons.chevron}</span></button>`).join('')}</div></section>` : ''}
    <footer class="home-footer"><span>BUILT FOR STORIES THAT TAKE THEIR TIME</span><span>EVERYTHING YOU DO HAS A SOURCE.</span></footer>
    ${modal === 'create' ? renderCreateModal() : ''}
  </main>`;
}
function formatDate(date) { const d = new Date(date); return Number.isNaN(d.valueOf()) ? 'just now' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function renderCreateModal() {
  return `<div class="modal-backdrop" data-action="backdrop"><section class="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><button class="icon-button modal-close" data-action="close-modal" aria-label="Close">${icons.close}</button><p class="eyebrow">THE FIRST PAGE</p><h2 id="create-title">Start a new story</h2><p class="modal-intro">Choose a tone, name your traveler, and begin somewhere real.</p><form id="create-form"><label>Story name<input name="name" maxlength="64" placeholder="The road to somewhere" value="${esc(createForm.name)}"></label><div class="form-row"><label>Your character<input name="playerName" maxlength="40" placeholder="What should we call you?" value="${esc(createForm.playerName)}"></label><label>Starting genre<select name="genre">${genres.map(item => `<option value="${esc(item.id)}" ${item.id === createForm.genre ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label></div><label>World premise <span class="optional">OPTIONAL</span><textarea name="premise" maxlength="500" rows="3" placeholder="A village at the edge of an old forest…">${esc(createForm.premise)}</textarea></label><div class="modal-note">Your story is saved on this device. You can change your direction at any time.</div><button class="button button-primary button-large modal-submit" type="submit">Create my world ${icons.arrow}</button></form></section></div>`;
}

const leftTabs = ['World', 'People', 'Journal'];
const rightTabs = ['Character', 'Inventory', 'Work', 'Add-ons'];
function renderTabRail(side, tabs) {
  return `<nav class="tab-rail tab-rail-${side}" aria-label="${side} story panels">${tabs.map(tab => `<button class="rail-tab ${activeSide[side] === tab ? 'selected' : ''} ${openSides[side] && activeSide[side] === tab ? 'active' : ''}" data-panel="${side}:${tab}" aria-pressed="${openSides[side] && activeSide[side] === tab}"><span class="rail-icon">${tabIcon(tab)}</span><span>${tab}</span></button>`).join('')}</nav>`;
}
function tabIcon(tab) { return ({ World: icons.map, People: icons.users, Journal: icons.journal, Character: icons.heart, Inventory: icons.bag, Work: icons.briefcase, 'Add-ons': icons.sliders })[tab] || icons.book; }
function renderPanel(side) {
  if (!openSides[side]) return `<aside class="sidebar sidebar-${side} collapsed"><div class="collapsed-brand">${side === 'left' ? 'WORLD' : 'YOU'}</div></aside>`;
  const tab = activeSide[side];
  return `<aside class="sidebar sidebar-${side} ${mobileSide === side ? 'mobile-open' : ''}"><div class="panel-top"><div><p class="eyebrow">${side === 'left' ? 'THE SETTING' : 'YOUR ADVENTURE'}</p><h2>${tab}</h2></div><button class="icon-button panel-close" data-action="close-${side}" aria-label="Close ${side} panel">${icons.close}</button></div>${tab === 'World' ? renderWorld() : tab === 'People' ? renderPeople() : tab === 'Journal' ? renderJournal() : tab === 'Character' ? renderCharacter() : tab === 'Inventory' ? renderInventory() : tab === 'Work' ? renderWork() : renderAddons()}</aside>`;
}
function renderWorld() {
  const here = story.world.location;
  const visibleRoutes = story.world.routes.filter(route => route.from === story.player.locationId && !route.blocked);
  return `<div class="panel-scroll"><article class="world-card"><div class="world-card-top"><span class="location-icon">${icons.map}</span><span class="live-tag"><i></i> YOU ARE HERE</span></div><h3>${esc(here.name)}</h3><p>${esc(here.description)}</p><div class="world-card-meta"><span>${icons.sun} ${esc(story.world.weather)}</span><span>✳ ${esc(story.world.season)}</span></div></article><div class="panel-section"><div class="panel-section-heading"><h3>Known paths</h3><span class="count-dot">${visibleRoutes.length}</span></div>${visibleRoutes.length ? visibleRoutes.map(route => { const dest = story.world.knownLocations.find(item => item.id === route.to); return `<button class="route-row" data-fill="Travel to ${esc(dest?.name || route.name)}"><span class="route-marker">${icons.arrow}</span><span class="route-copy"><b>${esc(dest?.name || route.name)}</b><small>${esc(route.name)} · ${route.duration}h</small></span><span class="route-go">${icons.chevron}</span></button>`; }).join('') : '<p class="muted small-copy">No known paths lead from here.</p>'}</div><div class="panel-section"><div class="panel-section-heading"><h3>At a glance</h3></div><div class="mini-stat"><span>Day</span><b>${story.world.day}</b></div><div class="mini-stat"><span>Local time</span><b>${esc(story.world.timeLabel)} · ${timeOfDay(story.world.time)}</b></div><div class="mini-stat"><span>World foundation</span><b class="foundation-status"><i></i> Anchored</b></div></div><p class="panel-footnote">The world moves when you do. No hidden real-time ticks.</p></div>`;
}
function renderPeople() {
  const here = story.people.filter(person => person.isHere);
  const others = story.people.filter(person => !person.isHere);
  return `<div class="panel-scroll"><div class="people-intro">People are where the story last left them. A conversation can only happen face to face.</div><div class="panel-section"><div class="panel-section-heading"><h3>Here with you</h3><span class="count-dot">${here.length}</span></div>${here.length ? here.map(personCard).join('') : '<div class="empty-mini">The place is quiet. You can travel to a known location.</div>'}</div><div class="panel-section"><div class="panel-section-heading"><h3>People you know</h3><span class="count-dot">${others.length}</span></div>${others.length ? others.map(personCard).join('') : '<div class="empty-mini">You have not met anyone else yet.</div>'}</div></div>`;
}
function personCard(person) { return `<article class="person-card"><span class="person-avatar">${esc(initials(person.name))}</span><div class="person-copy"><b>${esc(person.name)}</b><small>${esc(titleCase(person.role))}${person.isHere ? ' · here' : ''}</small></div>${person.isHere ? `<button class="tiny-action" data-fill="Talk to ${esc(person.name)}" aria-label="Talk to ${esc(person.name)}">${icons.arrow}</button>` : `<span class="person-away">Known</span>`}</article>`; }
function titleCase(text) { return String(text || '').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function renderJournal() {
  const events = [...story.events].reverse();
  return `<div class="panel-scroll"><div class="journal-intro">A record of what has actually happened. Receipts and events keep the story's history in order.</div>${events.length ? `<div class="timeline">${events.map(event => `<article class="timeline-item"><span class="timeline-dot ${event.type === 'SpeakApplied' ? 'dot-speech' : ''}"></span><div><small>${event.tick != null ? `${String(event.tick).padStart(2, '0')}:00` : '—'} · ${esc(titleCase(event.type))}</small><p>${esc(event.summary)}</p></div></article>`).join('')}</div>` : '<div class="empty-mini">Your journal is waiting for its first entry.</div>'}<div class="receipt-note"><span>✓</span> ${story.receipts.length} owner receipts recorded</div></div>`;
}
function renderCharacter() {
  const vitals = Object.entries(story.player.vitals || {});
  return `<div class="panel-scroll"><div class="character-card"><div class="character-portrait"><span>${esc(initials(story.player.name))}</span><button aria-label="Edit portrait" title="Portrait studio coming soon">✎</button><div class="portrait-orbit"></div></div><h3>${esc(story.player.name)}</h3><p>${esc(getGenre(story.genre))} traveler</p><span class="character-location">${esc(story.world.location.name)}</span></div><div class="panel-section"><div class="panel-section-heading"><h3>Vitals</h3><span class="safe-label">STABLE</span></div>${vitals.map(([name, value]) => `<div class="vital-block"><div class="vital-label"><span>${esc(name)}</span><b>${value.current}<small> / ${value.max}</small></b></div><div class="meter"><i class="meter-${name.toLowerCase()}" style="width:${Math.min(100, value.current / value.max * 100)}%"></i></div></div>`).join('')}<p class="panel-footnote">Unconfigured survival needs do not drain.</p></div><div class="panel-section"><div class="panel-section-heading"><h3>Attributes</h3></div><div class="stat-grid">${Object.entries(story.player.stats || {}).map(([name, value]) => `<div class="stat-chip"><b>${value}</b><small>${esc(name)}</small></div>`).join('')}</div></div><div class="balance-card"><span>On hand</span><b>${story.currency.balance} <small>${esc(story.currency.name)}</small></b></div></div>`;
}
function renderInventory() {
  return `<div class="panel-scroll"><div class="inventory-head"><span>ITEM</span><span>TYPE</span><span>WT</span><span>COND%</span></div>${story.inventory.length ? story.inventory.map(item => `<article class="inventory-row"><span class="item-title"><i>${item.type === 'Consumable' ? '◒' : '◈'}</i><b>${esc(item.name)}${item.quantity > 1 ? `<small>×${item.quantity}</small>` : ''}</b>${item.type === 'Consumable' ? `<button class="item-use" data-fill="Eat ${esc(item.name)}" title="Use ${esc(item.name)}">Use</button>` : ''}</span><span>${esc(item.type)}</span><span>${Number(item.weight).toFixed(1)}</span><span><i class="condition-dot" style="--condition:${item.condition}%"></i>${item.condition}</span></article>`).join('') : '<div class="empty-mini">Your pack is empty.</div>'}<div class="inventory-note">Only items you own appear here. Transfers and use require a real game action.</div><div class="inventory-weight"><span>Pack weight</span><b>${story.inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0).toFixed(1)} <small>lb</small></b></div></div>`;
}
function renderWork() {
  return `<div class="panel-scroll"><div class="work-intro">Offers only become yours when someone actually makes one. Asking never pays out by itself.</div>${story.jobs.length ? story.jobs.map(job => `<article class="job-card"><div class="job-card-top"><span class="job-icon">${icons.briefcase}</span><span class="job-pay">+${job.wage} ${esc(story.currency.name)}</span></div><h3>${esc(job.title)}</h3><p>${esc(job.description)}</p><div class="job-meta"><span>${esc(job.employer)} · ${esc(job.locationName || 'Known worksite')}</span><span>${job.duration} hours</span></div>${job.availableHere ? `<button class="button button-primary job-accept" data-fill="Perform the paid job">Do this work ${icons.arrow}</button>` : `<span class="job-where">Ask about it in person</span>`}</article>`).join('') : `<div class="empty-state-card"><span class="empty-icon">${icons.briefcase}</span><h3>No open offers</h3><p>Ask someone you meet about work. Any offer will show up here with its real terms.</p><button class="text-action" data-panel="left:People">See who is nearby ${icons.arrow}</button></div>`}<div class="economic-rule"><b>WORK ≠ WAGES</b><p>Paid work spends time and transfers funded money. Ordinary labor does not mint currency.</p></div></div>`;
}
function renderAddons() {
  const plugins = Object.entries(story.plugins || {});
  return `<div class="panel-scroll"><div class="addons-intro">Story-local modules. Turning a panel off never erases its saved history. Core world systems remain active.</div><div class="addon-list">${plugins.map(([key, plugin]) => { const core = ['maps', 'time', 'exploration', 'dialogue'].includes(key); return `<article class="addon-row"><span class="addon-icon">${tabIcon(plugin.name === 'Inventory' ? 'Inventory' : plugin.name === 'Professions' ? 'Work' : 'World')}</span><span class="addon-text"><b>${esc(plugin.name)}</b><small>${core ? 'Core system' : 'Story module'}</small></span><button class="switch ${plugin.enabled ? 'on' : ''} ${core ? 'locked' : ''}" data-plugin="${esc(key)}" aria-label="${plugin.enabled ? 'Disable' : 'Enable'} ${esc(plugin.name)}" aria-pressed="${plugin.enabled}" ${core ? 'disabled title="Essential core system"' : ''}><i></i></button></article>`; }).join('')}</div><div class="addon-note">These modules are deterministic local systems. No external AI provider is connected.</div></div>`;
}
function renderGame() {
  const turnEntries = story.turns.flatMap(turn => turn.entries || []);
  const storyCreated = turnEntries.length === 1 && story.revision === 0;
  const chat = turnEntries.map((entry, index) => renderEntry(entry, index)).join('');
  const liveClasses = mobileSide ? `mobile-drawer-${mobileSide}` : '';
  return `<div class="game-shell ${liveClasses}"><header class="game-header"><button class="brand brand-game" data-action="home"><span class="brand-mark">T</span><span>TEXT<span class="brand-light">BASE</span><span class="brand-rpg">RPG</span></span></button><div class="header-story"><span class="header-genre">${esc(getGenre(story.genre))}</span><span class="header-divider">/</span><b>${esc(story.name)}</b><span class="saved-indicator"><i></i> Saved</span></div><div class="header-actions"><button class="header-button" data-action="reference" title="Insert a reference">${icons.book}<span>Reference</span></button><button class="header-button" data-action="story-list" title="Switch stories">▤<span>Stories</span></button><span class="header-avatar">${esc(initials(story.player.name))}</span></div></header><div class="game-grid ${!openSides.left ? 'left-closed' : ''} ${!openSides.right ? 'right-closed' : ''}">${renderTabRail('left', leftTabs)}${renderPanel('left')}<main class="story-stage"><div class="scene-header"><div class="scene-heading"><span class="scene-pin">✳</span><div><p>${esc(story.world.location.name)} <span>·</span> Day ${story.world.day}, ${esc(story.world.timeLabel)}</p><h1>${esc(timeOfDay(story.world.time))} in ${esc(story.world.location.name)}</h1></div></div><div class="weather-chip">${icons.sun}<span>${esc(story.world.weather)}</span></div></div><div class="chat-scroll" id="chat-scroll"><div class="chat-inner"><div class="chapter-marker"><span>✦</span><i></i><small>THE STORY SO FAR</small><i></i><span>✦</span></div>${chat}${storyCreated ? `<div class="suggested-actions"><span>THE DAY IS YOURS</span><div><button data-fill="Inspect the area">Look around</button><button data-fill="Travel to Old Mill Crossing">Follow the river road</button><button data-fill="Talk to Tovin about work">Ask about work</button></div></div>` : ''}</div></div><div class="composer-wrap"><div class="composer-hints"><span>TYPE WHAT YOU WANT TO DO</span><span>ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span></div><form class="composer" id="turn-form"><button class="composer-reference" type="button" data-action="reference" aria-label="Insert reference">#</button><textarea id="turn-input" maxlength="1200" rows="1" placeholder="What do you do?" ${busy ? 'disabled' : ''}>${esc(draft)}</textarea><button class="send-button" type="submit" aria-label="Send turn" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span>' : icons.send}</button></form><p class="composer-disclaimer">Your intention is yours. Game rules decide what actually happens.</p></div></main>${renderPanel('right')}${renderTabRail('right', rightTabs)}</div><footer class="game-footer"><span><i class="footer-dot"></i> LOCAL STORY · NO PROVIDER CONNECTED</span><span>REVISION ${String(story.revision).padStart(3, '0')} <b>·</b> ${story.receipts.length} RECEIPTS</span><button data-action="help">HOW TO PLAY</button></footer>${modal === 'references' ? renderReferenceModal() : modal === 'story-list' ? renderStoryListModal() : modal === 'help' ? renderHelpModal() : ''}<button class="mobile-rail mobile-left" data-action="mobile-left" aria-label="Open world panels">${icons.map}</button><button class="mobile-rail mobile-right" data-action="mobile-right" aria-label="Open character panels">${icons.heart}</button></div>`;
}
function renderEntry(entry, index) {
  const anchor = `message-${index}`;
  if (entry.kind === 'player') return `<article class="message-row player-row" id="${anchor}"><div class="player-message"><p>${esc(entry.text)}</p><span>YOU <i>· JUST NOW</i></span></div><span class="message-avatar">${esc(initials(story.player.name))}</span></article>`;
  if (entry.kind === 'speech') return `<article class="message-row speech-row" id="${anchor}"><span class="speaker-avatar">${esc(initials(entry.speaker))}</span><div class="speech-block"><span class="speaker-name">${esc(entry.speaker)}</span><p>${esc(entry.text)}</p></div></article>`;
  if (entry.kind === 'result') return `<article class="action-card" id="${anchor}"><span class="action-card-icon">${icons.spark}</span><div><span>${esc(entry.label || 'RESULT')}</span><p>${esc(entry.text)}</p></div><i class="source-check">✓</i></article>`;
  return `<article class="narration-block" id="${anchor}"><span class="narration-mark">✳</span><p>${esc(entry.text)}</p></article>`;
}
function renderReferenceModal() {
  const refs = [{ kind: 'People', entries: story.people.filter(person => person.isHere).map(person => ({ label: person.name, detail: titleCase(person.role) })) }, { kind: 'Location', entries: [{ label: story.world.location.name, detail: 'Current location' }, ...story.world.routes.filter(route => route.from === story.player.locationId).map(route => ({ label: story.world.knownLocations.find(place => place.id === route.to)?.name || route.name, detail: route.name }))] }, { kind: 'Inventory', entries: story.inventory.map(item => ({ label: item.name, detail: item.type })) }];
  return `<div class="modal-backdrop" data-action="backdrop"><section class="utility-modal reference-modal" role="dialog" aria-modal="true"><button class="icon-button modal-close" data-action="close-modal" aria-label="Close">${icons.close}</button><p class="eyebrow">KNOWN TO YOU</p><h2>Reference catalog</h2><p class="modal-intro">Insert something from your current story context.</p>${refs.map(group => `<div class="reference-group"><h3>${esc(group.kind)}</h3>${group.entries.length ? group.entries.map(item => `<button class="reference-row" data-reference="${esc(item.label)}"><span><b>${esc(item.label)}</b><small>${esc(item.detail)}</small></span><span>+</span></button>`).join('') : '<p class="empty-mini">Nothing nearby.</p>'}</div>`).join('')}</section></div>`;
}
function renderStoryListModal() {
  return `<div class="modal-backdrop" data-action="backdrop"><section class="utility-modal" role="dialog" aria-modal="true"><button class="icon-button modal-close" data-action="close-modal" aria-label="Close">${icons.close}</button><p class="eyebrow">YOUR STORYBOOK</p><h2>Switch stories</h2><div class="story-switch-list">${stories.map(item => `<button class="saved-card ${item.id === story.id ? 'current-story' : ''}" data-story="${esc(item.id)}"><span class="saved-glyph">${esc(getGenre(item.genre)[0])}</span><span class="saved-info"><b>${esc(item.name)}</b><small>${esc(getGenre(item.genre))} · ${formatDate(item.updatedAt)}</small></span>${item.id === story.id ? '<span class="current-check">✓</span>' : ''}</button>`).join('')}</div><button class="button button-primary button-large modal-submit" data-action="new-story">Create another story ${icons.arrow}</button></section></div>`;
}
function renderHelpModal() {
  return `<div class="modal-backdrop" data-action="backdrop"><section class="utility-modal" role="dialog" aria-modal="true"><button class="icon-button modal-close" data-action="close-modal" aria-label="Close">${icons.close}</button><p class="eyebrow">A FEW USEFUL THINGS</p><h2>How to play</h2><div class="help-list"><p><b>Say what you want to do.</b> Natural language is welcome. This offline build resolves a bounded set of travel, talk, explore, work, and wait actions.</p><p><b>Ask, then act.</b> Asking about work may reveal a real offer. It never pays until you perform it.</p><p><b>Time belongs to your actions.</b> Travel and waiting advance the fictional clock. No automatic health restoration or surprise survival drain.</p><p><b>What is written is what happened.</b> The journal and event receipts are tied to state changes. Unsupported intentions are never turned into pretend results.</p></div></section></div>`;
}

function bindEvents() {
  app.querySelectorAll('[data-action="new-story"]').forEach(button => button.addEventListener('click', () => { createForm = { name: '', playerName: '', genre: 'fantasy', premise: '' }; modal = 'create'; render(); }));
  app.querySelectorAll('[data-action="close-modal"]').forEach(button => button.addEventListener('click', () => { modal = ''; render(); }));
  app.querySelectorAll('[data-action="backdrop"]').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) { modal = ''; render(); } }));
  app.querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => openStory(button.dataset.story).catch(error => toast(error.message))));
  app.querySelectorAll('[data-action="home"]').forEach(button => button.addEventListener('click', async () => { await loadStoryList(); modal = ''; screen = 'home'; render(); }));
  app.querySelectorAll('[data-action="story-list"]').forEach(button => button.addEventListener('click', async () => { await loadStoryList(); modal = 'story-list'; render(); }));
  app.querySelectorAll('[data-action="reference"]').forEach(button => button.addEventListener('click', () => { modal = 'references'; render(); }));
  app.querySelectorAll('[data-action="help"]').forEach(button => button.addEventListener('click', () => { modal = 'help'; render(); }));
  app.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    const [side, panel] = button.dataset.panel.split(':');
    if (!side) return;
    if (side === 'left' || side === 'right') {
      if (activeSide[side] === panel && openSides[side]) openSides[side] = false;
      else { activeSide[side] = panel; openSides[side] = true; }
      mobileSide = '';
    } else { activeSide.left = panel; openSides.left = true; }
    render();
  }));
  app.querySelectorAll('[data-action="close-left"], [data-action="close-right"]').forEach(button => button.addEventListener('click', () => { openSides[button.dataset.action.slice(6)] = false; mobileSide = ''; render(); }));
  app.querySelectorAll('[data-action="mobile-left"], [data-action="mobile-right"]').forEach(button => button.addEventListener('click', () => { mobileSide = button.dataset.action.endsWith('left') ? 'left' : 'right'; openSides[mobileSide] = true; render(); }));
  app.querySelectorAll('[data-fill]').forEach(button => button.addEventListener('click', () => {
    draft = button.dataset.fill;
    if (button.dataset.panel) { const [side, panel] = button.dataset.panel.split(':'); activeSide[side] = panel; openSides[side] = true; }
    render(); const input = app.querySelector('#turn-input'); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length);
  }));
  app.querySelectorAll('[data-reference]').forEach(button => button.addEventListener('click', () => { draft = `${draft}${draft ? ' ' : ''}#${button.dataset.reference}`; modal = ''; render(); const input = app.querySelector('#turn-input'); input?.focus(); }));
  const create = app.querySelector('#create-form');
  create?.addEventListener('input', event => { if (event.target.name) createForm[event.target.name] = event.target.value; });
  create?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(create);
    createForm = Object.fromEntries(form.entries());
    const submit = create.querySelector('[type="submit"]'); submit.disabled = true; submit.innerHTML = '<span class="spinner"></span> Making a world…';
    try { const result = await api('/api/stories', { method: 'POST', body: JSON.stringify(createForm) }); story = result.story; stories = [{ id: story.id, name: story.name, genre: story.genre, updatedAt: story.updatedAt }, ...stories]; screen = 'game'; modal = ''; localStorage.setItem('textrpg-active-story', story.id); render(); }
    catch (error) { toast(error.message); submit.disabled = false; submit.innerHTML = `Create my world ${icons.arrow}`; }
  });
  const input = app.querySelector('#turn-input');
  input?.addEventListener('input', () => { draft = input.value; input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 176)}px`; });
  input?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); app.querySelector('#turn-form')?.requestSubmit(); } });
  app.querySelector('#turn-form')?.addEventListener('submit', submitTurn);
  app.querySelectorAll('[data-plugin]').forEach(button => button.addEventListener('click', () => togglePlugin(button.dataset.plugin, !story.plugins[button.dataset.plugin].enabled)));
  if (screen === 'game') requestAnimationFrame(() => { const scroll = app.querySelector('#chat-scroll'); if (scroll) scroll.scrollTop = scroll.scrollHeight; });
}
async function loadStoryList() { try { stories = (await api('/api/stories')).stories; } catch (error) { toast(error.message); } }
async function submitTurn(event) {
  event.preventDefault(); if (busy) return;
  const input = app.querySelector('#turn-input'); const text = input.value.trim(); if (!text) return;
  busy = true; draft = ''; render();
  const turnId = `turn-${crypto.randomUUID()}`;
  try {
    const result = await api(`/api/stories/${story.id}/turn`, { method: 'POST', body: JSON.stringify({ input: text, turnId, expectedRevision: story.revision }) });
    story = result.story;
    stories = stories.map(item => item.id === story.id ? { ...item, updatedAt: story.updatedAt, revision: story.revision } : item);
  } catch (error) {
    draft = text;
    if (error.status === 409) { try { await refreshStory(); } catch {} }
    toast(error.message);
  } finally { busy = false; render(); if (draft) { const textarea = app.querySelector('#turn-input'); textarea?.focus(); } }
}
async function togglePlugin(plugin, enabled) {
  try { const result = await api(`/api/stories/${story.id}/plugins/${plugin}`, { method: 'PATCH', body: JSON.stringify({ enabled, expectedRevision: story.revision }) }); story = result.story; render(); toast(`${titleCase(story.plugins[plugin].name)} ${enabled ? 'enabled' : 'disabled'}.`, 'success'); }
  catch (error) { if (error.status === 409) await refreshStory().catch(() => {}); render(); toast(error.message); }
}

app.addEventListener('click', event => { if (event.target.closest('[data-reload]')) location.reload(); });
init();
