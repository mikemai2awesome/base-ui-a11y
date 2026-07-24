'use client';
import * as React from 'react';

export interface AutocompleteRootContext {
  /**
   * The minimum number of characters required before suggestions are shown.
   */
  minLength: number;
  /**
   * Registers a custom `<Autocomplete.AssistiveHint>` so the default hint is suppressed.
   * Returns a cleanup function that unregisters the hint.
   */
  registerAssistiveHint: (id: string) => () => void;
  /**
   * The `id` of the default (auto-rendered) assistive hint element.
   */
  defaultAssistiveHintId: string | undefined;
  /**
   * The `id` of the assistive hint currently associated with the input.
   * Points to a custom hint when one is present, otherwise the default hint.
   */
  activeAssistiveHintId: string | undefined;
  /**
   * Whether a custom `<Autocomplete.AssistiveHint>` is present.
   */
  hasCustomAssistiveHint: boolean;
}

export const AutocompleteRootContext = React.createContext<AutocompleteRootContext>({
  minLength: 0,
  registerAssistiveHint: () => () => {},
  defaultAssistiveHintId: undefined,
  activeAssistiveHintId: undefined,
  hasCustomAssistiveHint: false,
});

export function useAutocompleteRootContext() {
  return React.useContext(AutocompleteRootContext);
}
