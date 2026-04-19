const assert = require('assert');

// ---------------------------------------------------------------------------
// Minimal DOM mock for Node.js
// ---------------------------------------------------------------------------
const listeners = {};

global.window = {
  addEventListener(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  },
  parent: {
    postMessage() {},
  },
};

// Provide window.parent at top-level too (sdk.js references window.parent)
global.parent = global.window.parent;

global.document = {
  getElementById: () => null,
  createElement(tag) {
    return { id: '', textContent: '', style: {}, tagName: tag.toUpperCase() };
  },
  head: {
    appendChild() {},
  },
  body: {
    appendChild() {},
  },
};

global.console = global.console || { log() {}, warn() {}, error() {} };

// ---------------------------------------------------------------------------
// Helper: dispatch a fake MessageEvent to the SDK
// ---------------------------------------------------------------------------
function dispatchMessage(data, source) {
  const event = {
    data,
    source: source !== undefined ? source : global.window.parent,
  };
  (listeners['message'] || []).forEach((fn) => fn(event));
}

// ---------------------------------------------------------------------------
// Load the SDK — assigns to window.MimiSDK as a plain script
// ---------------------------------------------------------------------------
let MimiSDK;
try {
  require('../sdk.js');
  MimiSDK = global.window.MimiSDK;
} catch (err) {
  console.error('Failed to load sdk.js:', err.message);
  process.exit(1);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \u2717 ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\nMimiSDK test suite\n');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('SDK exports an object', () => {
  assert.ok(MimiSDK, 'MimiSDK should be truthy');
  assert.strictEqual(typeof MimiSDK, 'object');
});

test('SDK exposes expected public methods', () => {
  const methods = ['ready', 'sendAction', 'onStateUpdate', 'onGameEvent', 'onPlayerInfo', 'injectTheme', 'init'];
  for (const m of methods) {
    assert.strictEqual(typeof MimiSDK[m], 'function', `MimiSDK.${m} should be a function`);
  }
});

test('SDK exposes theme object with expected keys', () => {
  assert.ok(MimiSDK.theme, 'theme should exist');
  assert.ok(MimiSDK.theme.colors, 'theme.colors should exist');
  assert.ok(MimiSDK.theme.radius, 'theme.radius should exist');
  assert.strictEqual(typeof MimiSDK.theme.font, 'string', 'theme.font should be a string');
  assert.strictEqual(MimiSDK.theme.colors.primary, '#7c3aed');
});

test('ready() calls parent.postMessage', () => {
  let called = false;
  let sentData = null;
  global.window.parent.postMessage = (data) => {
    called = true;
    sentData = data;
  };
  MimiSDK.ready();
  assert.ok(called, 'postMessage should have been called');
  assert.strictEqual(sentData.type, 'ready');
  // Restore
  global.window.parent.postMessage = () => {};
});

test('sendAction() posts correct message shape', () => {
  let sentData = null;
  global.window.parent.postMessage = (data) => {
    sentData = data;
  };
  MimiSDK.sendAction('move', { from: 'e2', to: 'e4' });
  assert.strictEqual(sentData.type, 'action');
  assert.strictEqual(sentData.action, 'move');
  assert.deepStrictEqual(sentData.payload, { from: 'e2', to: 'e4' });
  // Restore
  global.window.parent.postMessage = () => {};
});

test('onStateUpdate callback receives state_update messages', () => {
  let received = null;
  MimiSDK.onStateUpdate((payload) => {
    received = payload;
  });
  dispatchMessage({ type: 'state_update', delta: { x: 1 }, snapshot: null });
  assert.ok(received, 'callback should have been called');
  assert.deepStrictEqual(received.delta, { x: 1 });
  assert.strictEqual(received.snapshot, null);
});

test('onGameEvent callback receives game_event messages', () => {
  let received = null;
  MimiSDK.onGameEvent((evt) => {
    received = evt;
  });
  dispatchMessage({ type: 'game_event', event: { kind: 'phase_changed', phase: 'night' } });
  assert.ok(received, 'callback should have been called');
  assert.strictEqual(received.kind, 'phase_changed');
});

test('onPlayerInfo callback receives player_info messages', () => {
  let received = null;
  MimiSDK.onPlayerInfo((player) => {
    received = player;
  });
  dispatchMessage({ type: 'player_info', player: { id: '42', name: 'Alice', role: 'player' } });
  assert.ok(received, 'callback should have been called');
  assert.strictEqual(received.id, '42');
  assert.strictEqual(received.name, 'Alice');
});

test('Messages from non-parent sources are ignored', () => {
  let received = false;
  MimiSDK.onStateUpdate(() => {
    received = true;
  });
  // Dispatch with a different source
  dispatchMessage({ type: 'state_update', delta: {}, snapshot: null }, { not: 'parent' });
  assert.ok(!received, 'callback should NOT have been called for non-parent source');
});

test('init() sets targetOrigin and postMessage uses it', () => {
  let usedOrigin = null;
  global.window.parent.postMessage = (_data, origin) => {
    usedOrigin = origin;
  };
  MimiSDK.init({ targetOrigin: 'https://mimigames.io' });
  MimiSDK.ready();
  assert.strictEqual(usedOrigin, 'https://mimigames.io', 'Should use configured targetOrigin');
  // Restore
  global.window.parent.postMessage = () => {};
});

test('injectTheme() is idempotent (does not throw on second call)', () => {
  // Mock getElementById to return null first, then truthy
  let callCount = 0;
  global.document.getElementById = (id) => {
    callCount++;
    if (callCount > 1) return { id }; // pretend it exists on second call
    return null;
  };
  assert.doesNotThrow(() => MimiSDK.injectTheme());
  assert.doesNotThrow(() => MimiSDK.injectTheme());
  // Restore
  global.document.getElementById = () => null;
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('All tests passed');
