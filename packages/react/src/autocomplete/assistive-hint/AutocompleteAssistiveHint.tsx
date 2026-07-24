'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  useComboboxInputValueContext,
  useComboboxRootContext,
} from '../../combobox/root/ComboboxRootContext';
import { useAutocompleteRootContext } from '../root/AutocompleteRootContext';

export const DEFAULT_ASSISTIVE_HINT =
  'When results are available, use the arrow keys to highlight and Enter to select. ' +
  'Touch device users can explore by touch or with swipe gestures.';

/**
 * Writes the active assistive hint id to the store so the input references it via
 * `aria-describedby`, and drops the association after the first input. Also renders the default
 * hint element when no custom `<Autocomplete.AssistiveHint>` is present.
 *
 * @internal
 */
export function AutocompleteAssistiveHintManager() {
  const store = useComboboxRootContext();
  const inputValue = useComboboxInputValueContext();
  const { defaultAssistiveHintId, activeAssistiveHintId, hasCustomAssistiveHint } =
    useAutocompleteRootContext();

  const removedRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (removedRef.current) {
      return undefined;
    }

    store.set('assistiveHintId', activeAssistiveHintId);

    return () => {
      // Only clear the slot if it still points to the id this effect set, so a newly mounted
      // custom hint that already replaced it isn't wiped.
      if (store.state.assistiveHintId === activeAssistiveHintId) {
        store.set('assistiveHintId', undefined);
      }
    };
  }, [activeAssistiveHintId, store]);

  // Drop the association once the user starts typing so it isn't re-announced on every keystroke.
  React.useEffect(() => {
    if (removedRef.current) {
      return;
    }

    if (String(inputValue ?? '') !== '') {
      removedRef.current = true;
      store.set('assistiveHintId', undefined);
    }
  }, [inputValue, store]);

  if (hasCustomAssistiveHint) {
    return null;
  }

  return (
    <div id={defaultAssistiveHintId} style={visuallyHidden}>
      {DEFAULT_ASSISTIVE_HINT}
    </div>
  );
}

/**
 * A visually hidden hint that describes how to operate the autocomplete for screen reader users.
 * A default hint is rendered automatically; render this component to customize or translate it.
 * The hint is associated with the input via `aria-describedby`, and the association is
 * automatically removed after the first input to reduce screen reader verbosity.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteAssistiveHint = React.forwardRef(function AutocompleteAssistiveHint(
  componentProps: AutocompleteAssistiveHint.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, id: idProp, children, style, ...elementProps } = componentProps;

  const { registerAssistiveHint } = useAutocompleteRootContext();
  const id = useBaseUiId(idProp);

  // Registering suppresses the default hint and makes the manager point the input at this element.
  useIsoLayoutEffect(() => {
    if (!id) {
      return undefined;
    }
    return registerAssistiveHint(id);
  }, [id, registerAssistiveHint]);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        id,
        style: visuallyHidden,
        children: children ?? DEFAULT_ASSISTIVE_HINT,
      },
      elementProps,
    ],
  });
});

export interface AutocompleteAssistiveHintState {}

export interface AutocompleteAssistiveHintProps extends BaseUIComponentProps<
  'div',
  AutocompleteAssistiveHintState
> {}

export namespace AutocompleteAssistiveHint {
  export type State = AutocompleteAssistiveHintState;
  export type Props = AutocompleteAssistiveHintProps;
}
