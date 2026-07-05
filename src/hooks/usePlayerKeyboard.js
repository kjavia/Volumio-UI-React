import { useEffect } from 'react';

/**
 * Registers player keyboard shortcuts.
 *
 * Keys (ignored when focus is on an input/textarea/contenteditable):
 *   p          — toggle play / pause
 *   ArrowLeft  — previous track
 *   ArrowRight — next track
 *   q          — toggle queue
 *   b          — open browser
 *   a          — open add-to-playlist
 *   f          — toggle favourite
 *   r          — toggle repeat
 *   s          — toggle shuffle
 *
 * @param {Object} actions
 * @param {Function} [actions.onPlayPause]
 * @param {Function} [actions.onPrev]
 * @param {Function} [actions.onNext]
 * @param {Function} [actions.onQueue]
 * @param {Function} [actions.onBrowse]
 * @param {Function} [actions.onAddToPlaylist]
 * @param {Function} [actions.onFavourite]
 * @param {Function} [actions.onRepeat]
 * @param {Function} [actions.onShuffle]
 */
const usePlayerKeyboard = ({
  onPlayPause,
  onPrev,
  onNext,
  onQueue,
  onBrowse,
  onAddToPlaylist,
  onFavourite,
  onRepeat,
  onShuffle,
} = {}) => {
  useEffect(() => {
    const keyMap = {
      p: onPlayPause,
      arrowleft: onPrev,
      arrowright: onNext,
      q: onQueue,
      b: onBrowse,
      a: onAddToPlaylist,
      f: onFavourite,
      r: onRepeat,
      s: onShuffle,
    };

    const handler = (e) => {
      const key = e.key.toLowerCase();
      const action = keyMap[key];
      if (!action) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      // Suppress player shortcuts while any dialog (browse, add-to-playlist,
      // settings, etc.) is open — the dialog owns keyboard input.
      if (document.querySelector('.dialog-container')) return;
      action();
      // Move focus to the corresponding button for visual feedback
      const btn = document.querySelector(`[data-shortcut-key="${key}"]`);
      btn?.focus();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onPlayPause, onPrev, onNext, onQueue, onBrowse, onAddToPlaylist, onFavourite, onRepeat, onShuffle]);
};

export default usePlayerKeyboard;
