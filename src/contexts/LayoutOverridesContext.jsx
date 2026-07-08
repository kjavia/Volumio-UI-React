import { createContext, useContext } from 'react';

/**
 * Per-layout Player override values from the LayoutDesigner. Consumers
 * (PlayerSeekbar, useFanartBackground, Home.jsx) read this to know
 * whether the currently active custom layout is overriding a specific
 * plugin config toggle.
 *
 * Shape (all optional / string): {
 *   hideSeekHandle: '' | 'true' | 'false',
 *   hideTrackTimes: '' | 'true' | 'false',
 *   showRemainingTime: '' | 'true' | 'false',
 *   displayFanartBackground: '' | 'true' | 'false',
 * }
 *
 * Empty string / undefined means "inherit from global plugin config".
 */
const LayoutOverridesContext = createContext(null);

export const LayoutOverridesProvider = LayoutOverridesContext.Provider;

/**
 * Resolves the effective boolean value of a per-layout Player toggle,
 * falling back to the base plugin config value when no override is set.
 * Accepts the override value ('' | 'true' | 'false' | boolean) and the
 * global fallback and returns a boolean.
 */
export const resolveOverride = (override, globalValue) => {
    if (override === 'true' || override === true) return true;
    if (override === 'false' || override === false) return false;
    return !!globalValue;
};

/**
 * Hook for accessing the layout overrides map. Returns `null` when no
 * custom layout is active.
 */
export const useLayoutOverrides = () => useContext(LayoutOverridesContext);
