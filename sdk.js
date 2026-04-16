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
  let _targetOrigin = '*';

  /**
   * Internal helper — send a postMessage to the parent window using the
   * configured target origin.  Falls back to '*' with a console warning
   * when no origin has been set via init().
   */
  function _post(data) {
    if (_targetOrigin === '*') {
      console.warn('[MimiSDK] No targetOrigin configured, using "*". Set targetOrigin for security.');
    }
    window.parent.postMessage(data, _targetOrigin);
  }

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
     * Design tokens matching the MimiGames platform colour palette.
     * Game UIs can read these values directly (e.g. MimiSDK.theme.colors.primary)
     * or call MimiSDK.injectTheme() to expose them as CSS custom properties.
     */
    theme: {
      colors: {
        bg: '#0f0f1a',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        teal: '#0d9488',
        amber: '#f59e0b',
        error: '#ff5454',
        surface: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.08)',
        textPrimary: '#fff',
        textSecondary: 'rgba(255,255,255,0.6)',
        textGhost: 'rgba(255,255,255,0.3)',
      },
      radius: { sm: '4px', md: '8px', lg: '12px' },
      font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },

    /**
     * Configure the SDK.  Call before ready() to set the target origin
     * for postMessage security.
     *
     * @param {object} options
     * @param {string} [options.targetOrigin] - e.g. 'https://mimigames.io'
     */
    init(options = {}) {
      if (options.targetOrigin) {
        _targetOrigin = options.targetOrigin;
      }
    },

    /**
     * Inject MimiGames CSS custom properties into the current document <head>.
     * Idempotent — calling it multiple times inserts the <style> only once.
     *
     * After calling this, game CSS can use:
     *   var(--mimi-bg), var(--mimi-primary), var(--mimi-teal), etc.
     */
    injectTheme() {
      if (document.getElementById('mimi-theme')) return;
      const style = document.createElement('style');
      style.id = 'mimi-theme';
      style.textContent = `
:root {
  --mimi-bg: #0f0f1a;
  --mimi-primary: #7c3aed;
  --mimi-primary-hover: #6d28d9;
  --mimi-teal: #0d9488;
  --mimi-amber: #f59e0b;
  --mimi-error: #ff5454;
  --mimi-surface: rgba(255,255,255,0.04);
  --mimi-border: rgba(255,255,255,0.08);
  --mimi-text: #fff;
  --mimi-text-secondary: rgba(255,255,255,0.6);
  --mimi-text-ghost: rgba(255,255,255,0.3);
  --mimi-radius-sm: 4px;
  --mimi-radius-md: 8px;
  --mimi-radius-lg: 12px;
}
`.trim();
      document.head.appendChild(style);
    },

    /**
     * Signal the platform that the iframe is ready to receive state.
     * Must be called after setting up all callbacks.
     * If not called within 10 seconds, the platform shows a load error.
     */
    ready() {
      _post({ type: 'ready' });
    },

    /**
     * Send a game action to the platform (forwarded to the game backend via WebSocket).
     * @param {string} action  - action name, e.g. 'move', 'vote'
     * @param {object} payload - action data
     */
    sendAction(action, payload = {}) {
      _post({ type: 'action', action, payload });
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
