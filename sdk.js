/**
 * MimiSDK — public JavaScript SDK for MimiGames game developers.
 *
 * Usage:
 *   import MimiSDK from 'https://mimigames.io/sdk.js'
 *
 *   MimiSDK.onPlayerInfo((player) => { ... })
 *   MimiSDK.onStateUpdate(({ delta, snapshot }) => { ... })
 *   MimiSDK.onGameEvent((event) => { ... })
 *   MimiSDK.sendAction('move', { from: 'e2', to: 'e4' })
 *   MimiSDK.ready()
 */

const MimiSDK = (() => {
  let _onStateUpdate = null;
  let _onGameEvent = null;
  let _onPlayerInfo = null;

  /**
   * Listen for messages from the platform (parent window).
   * The platform sends: state_update, game_event, player_info.
   */
  window.addEventListener('message', (event) => {
    // Only accept messages from direct parent
    if (event.source !== window.parent) return;

    const { type } = event.data || {};

    if (type === 'state_update' && _onStateUpdate) {
      const { delta, snapshot } = event.data;
      _onStateUpdate({ delta: delta ?? null, snapshot: snapshot ?? null });
    } else if (type === 'game_event' && _onGameEvent) {
      _onGameEvent(event.data.event);
    } else if (type === 'player_info' && _onPlayerInfo) {
      _onPlayerInfo(event.data.player);
    }
  });

  return {
    /**
     * Signal the platform that the iframe is ready to receive state.
     * Must be called after setting up all callbacks.
     * If not called within 10 seconds, the platform shows a load error.
     */
    ready() {
      window.parent.postMessage({ type: 'ready' }, '*');
    },

    /**
     * Send a game action to the platform (forwarded to the game backend via WebSocket).
     * @param {string} action  - action name, e.g. 'move', 'vote'
     * @param {object} payload - action data
     */
    sendAction(action, payload = {}) {
      window.parent.postMessage({ type: 'action', action, payload }, '*');
    },

    /**
     * Register a callback for state updates.
     * Called with { delta, snapshot } — one of them is always null:
     *   - snapshot: full state on first load / reconnect
     *   - delta: partial update during gameplay
     * @param {function} callback
     */
    onStateUpdate(callback) {
      _onStateUpdate = callback;
    },

    /**
     * Register a callback for game events (phase_changed, player_eliminated, etc).
     * @param {function} callback
     */
    onGameEvent(callback) {
      _onGameEvent = callback;
    },

    /**
     * Register a callback to receive current player info { id, name, role }.
     * role is either 'player' or 'spectator'.
     * Called once after MimiSDK.ready() is acknowledged.
     * @param {function} callback
     */
    onPlayerInfo(callback) {
      _onPlayerInfo = callback;
    },
  };
})();

export default MimiSDK;
