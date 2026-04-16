/**
 * MimiSDK — TypeScript type definitions.
 *
 * The SDK is a postMessage bridge between game iframes and the MimiGames platform.
 * Import: import MimiSDK from 'https://mimigames.io/sdk.js'
 */

/** Design-token colour palette exposed by the platform. */
export interface MimiThemeColors {
  bg: string;
  primary: string;
  primaryHover: string;
  teal: string;
  amber: string;
  error: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textGhost: string;
}

/** Border-radius tokens. */
export interface MimiThemeRadius {
  sm: string;
  md: string;
  lg: string;
}

/** Full theme object available at MimiSDK.theme. */
export interface MimiTheme {
  colors: MimiThemeColors;
  radius: MimiThemeRadius;
  font: string;
}

/** Payload delivered to the onStateUpdate callback. */
export interface StateUpdatePayload {
  /** Partial state update during gameplay (null on initial load). */
  delta: Record<string, unknown> | null;
  /** Full state snapshot on first load / reconnect (null during deltas). */
  snapshot: Record<string, unknown> | null;
}

/** Player information delivered to the onPlayerInfo callback. */
export interface PlayerInfo {
  id: string;
  name: string;
  role: 'player' | 'spectator';
}

/** Configuration options for MimiSDK.init(). */
export interface MimiSDKInitOptions {
  /**
   * Target origin for postMessage calls to the parent window.
   * Defaults to '*' (insecure) with a console warning.
   * Recommended: 'https://mimigames.io'
   */
  targetOrigin?: string;
}

/** The MimiSDK public API. */
export interface MimiSDKInterface {
  /** Design tokens matching the MimiGames platform colour palette. */
  theme: MimiTheme;

  /**
   * Configure the SDK. Call before ready() to set targetOrigin.
   * @param options - configuration options
   */
  init(options: MimiSDKInitOptions): void;

  /**
   * Inject MimiGames CSS custom properties into the document <head>.
   * Idempotent — multiple calls insert the <style> only once.
   */
  injectTheme(): void;

  /**
   * Signal the platform that the iframe is ready to receive state.
   * Must be called after setting up all callbacks.
   */
  ready(): void;

  /**
   * Send a game action to the platform.
   * @param action  - action name, e.g. 'move', 'vote'
   * @param payload - action data
   */
  sendAction(action: string, payload?: Record<string, unknown>): void;

  /**
   * Register a callback for state updates.
   * Called with { delta, snapshot } — one is always null.
   */
  onStateUpdate(callback: (payload: StateUpdatePayload) => void): void;

  /**
   * Register a callback for game events (phase_changed, player_eliminated, etc.).
   */
  onGameEvent(callback: (event: Record<string, unknown>) => void): void;

  /**
   * Register a callback to receive current player info.
   * Called once after ready() is acknowledged.
   */
  onPlayerInfo(callback: (player: PlayerInfo) => void): void;
}

declare const MimiSDK: MimiSDKInterface;
export default MimiSDK;
