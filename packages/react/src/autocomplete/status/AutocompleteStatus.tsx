'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../../combobox/root/ComboboxRootContext';
import { selectors } from '../../combobox/store';
import { useInitialLiveRegionTextMutation } from '../../combobox/utils/useInitialLiveRegionTextMutation';
import { stringifyAsLabel } from '../../internals/resolveValueLabel';
import { useAutocompleteRootContext } from '../root/AutocompleteRootContext';

const DEFAULT_MESSAGES: AutocompleteStatus.Messages = {
  queryTooShort: (minLength) => `Type ${minLength} or more characters for results.`,
  noResults: () => 'No results found.',
  optionHighlighted: (label, count, index) => `${label} ${index + 1} of ${count} is highlighted.`,
  results: (count, highlightedText) => {
    const noun = count === 1 ? 'result' : 'results';
    const verb = count === 1 ? 'is' : 'are';
    return `${count} ${noun} ${verb} available. ${highlightedText}`.trim();
  },
};

/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * When no `children` are provided, it announces ready-made result counts, the highlighted option,
 * empty states, and (when `minLength` is set) a "type more characters" hint.
 * Provide `children` to render fully custom content instead.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteStatus = React.forwardRef(function AutocompleteStatus(
  componentProps: AutocompleteStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    style,
    children: childrenProp,
    messages: messagesProp,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const { query, flatFilteredItems } = useComboboxDerivedItemsContext();
  const { minLength } = useAutocompleteRootContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
  const statusRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  let children = childrenProp;

  // Only auto-generate content when `children` is omitted entirely. Passing an explicit value
  // (including `null`) opts out and preserves fully custom content.
  if (childrenProp === undefined) {
    const messages = messagesProp ? { ...DEFAULT_MESSAGES, ...messagesProp } : DEFAULT_MESSAGES;
    const trimmedQuery = query.trim();
    const count = flatFilteredItems.length;

    if (minLength > 0 && trimmedQuery.length < minLength) {
      children = messages.queryTooShort(minLength);
    } else if (count === 0) {
      children = messages.noResults();
    } else {
      let highlightedText = '';
      if (activeIndex != null && flatFilteredItems[activeIndex] !== undefined) {
        const label = stringifyAsLabel(flatFilteredItems[activeIndex], itemToStringLabel);
        highlightedText = messages.optionHighlighted(label, count, activeIndex);
      }
      children = messages.results(count, highlightedText);
    }
  }

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, statusRef],
    props: [
      {
        children,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export interface AutocompleteStatusState {}

export interface AutocompleteStatusMessages {
  /**
   * Announced when the query is shorter than the root's `minLength`.
   */
  queryTooShort: (minLength: number) => string;
  /**
   * Announced when no results match the query.
   */
  noResults: () => string;
  /**
   * Builds the announcement for the currently highlighted option.
   * Receives the option label, the total number of results, and the zero-based index.
   */
  optionHighlighted: (label: string, count: number, index: number) => string;
  /**
   * Builds the announcement for the available results.
   * Receives the number of results and the return value of `optionHighlighted` (or an empty string).
   */
  results: (count: number, highlightedText: string) => string;
}

export interface AutocompleteStatusProps extends Omit<
  BaseUIComponentProps<'div', AutocompleteStatusState>,
  'children'
> {
  /**
   * Custom content for the live region. When omitted, ready-made announcements are generated.
   */
  children?: React.ReactNode | undefined;
  /**
   * Overrides for the automatically generated announcement strings.
   * Useful for internationalization.
   */
  messages?: Partial<AutocompleteStatusMessages> | undefined;
}

export namespace AutocompleteStatus {
  export type State = AutocompleteStatusState;
  export type Props = AutocompleteStatusProps;
  export type Messages = AutocompleteStatusMessages;
}
