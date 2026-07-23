'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingFocusManager } from '../../floating-ui-react';
import { getTarget } from '../../floating-ui-react/utils';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { type BaseUIComponentProps } from '../../internals/types';
import { type TransitionStatus } from '../../internals/useTransitionStatus';
import { type StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { DialogPopupCssVars } from './DialogPopupCssVars';
import { DialogPopupDataAttributes } from './DialogPopupDataAttributes';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { COMPOSITE_KEYS } from '../../internals/composite/composite';
import { FOCUSABLE_POPUP_PROPS, createDefaultInitialFocus } from '../../utils/popups';

const stateAttributesMapping: StateAttributesMapping<DialogPopupState> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? { [DialogPopupDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * Whether the current environment implements the native `<dialog>` element methods. jsdom and older
 * browsers do not, in which case the popup falls back to the JavaScript-driven behavior below.
 */
function supportsNativeDialog(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.HTMLDialogElement === 'function' &&
    typeof window.HTMLDialogElement.prototype.showModal === 'function'
  );
}

/**
 * A container for the dialog contents.
 * Renders a native `<dialog>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogPopup = React.forwardRef(function DialogPopup(
  componentProps: DialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDialogElement>,
) {
  const { render, className, style, finalFocus, initialFocus, ...elementProps } = componentProps;

  const { store } = useDialogRootContext();

  const descriptionElementId = store.useState('descriptionElementId');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const titleElementId = store.useState('titleElementId');
  const transitionStatus = store.useState('transitionStatus');
  const role = store.useState('role');
  const topLayer = store.useState('topLayer');
  const floatingId = floatingRootContext.useState('floatingId');

  const popupId = elementProps.id ?? floatingId;

  useDialogPortalContext();

  // When native `<dialog>` is available, a fully modal dialog delegates the top layer, `::backdrop`,
  // background `inert`, and the Tab focus trap to the browser via `showModal()`. Non-modal and
  // `'trap-focus'` dialogs, dialogs with `topLayer={false}` — as well as unsupported environments —
  // keep relying on the JavaScript layer (`FloatingFocusManager`, the internal backdrop, and
  // `useDismiss`).
  const canUseNativeDialog = React.useMemo(() => topLayer && supportsNativeDialog(), [topLayer]);
  const nativeModalActive = canUseNativeDialog && modal === true;

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  const resolvedInitialFocus =
    initialFocus === undefined ? createDefaultInitialFocus(store.context.popupRef) : initialFocus;

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const setPopupElement = store.useStateSetter('popupElement');

  // Drive the native modal from the floating context's `floatingElement` — the exact signal the focus
  // manager keys its "element focused before opening" capture on. Sharing the signal makes this effect
  // run on the same render, and as a parent layout effect it runs *after* the manager's (child) capture,
  // so `showModal()` can't move focus first and corrupt the return-focus target. Keying off `mounted`
  // keeps the element in the top layer through any exit animation, then closes it on unmount.
  const floatingElement = floatingRootContext.useState('floatingElement');
  useIsoLayoutEffect(() => {
    const dialog = floatingElement as HTMLDialogElement | null;
    if (modal !== true || !mounted || dialog == null) {
      return undefined;
    }

    if (canUseNativeDialog) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return () => {
        if (dialog.open) {
          dialog.close();
        }
      };
    }

    // Fallback: make the dialog visible without the top layer where `showModal()` is unavailable.
    dialog.setAttribute('open', '');
    return () => {
      dialog.removeAttribute('open');
    };
  }, [mounted, modal, canUseNativeDialog, floatingElement]);

  const state: DialogPopupState = {
    open,
    nested,
    transitionStatus,
    nestedDialogOpen,
  };

  const element = useRenderElement('dialog', componentProps, {
    state,
    props: [
      rootPopupProps,
      {
        id: popupId,
        // The native `<dialog>` already exposes the `dialog` role; only override it for alert dialogs.
        role: role === 'alertdialog' ? 'alertdialog' : undefined,
        'aria-labelledby': titleElementId ?? undefined,
        'aria-describedby': descriptionElementId ?? undefined,
        // Non-modal (and `'trap-focus'`) dialogs are shown via the `open` attribute, which — unlike
        // `show()`/`showModal()` — has no focus side effects, leaving focus fully to the JS layer.
        // Modal dialogs are opened imperatively (see the effect above), so React must not own `open`.
        open: modal !== true && mounted ? true : undefined,
        ...FOCUSABLE_POPUP_PROPS,
        hidden: !mounted,
        onKeyDown(event: React.KeyboardEvent) {
          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
        onCancel(event: React.SyntheticEvent) {
          if (!nativeModalActive) {
            return;
          }
          // Route the browser's Escape request through the store so controlled state and exit
          // animations stay in sync, instead of letting the browser close the element immediately.
          event.preventDefault();
          store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));
        },
        onClick(event: React.MouseEvent) {
          if (!nativeModalActive || disablePointerDismissal) {
            return;
          }
          // A click whose target is the `<dialog>` element itself lands on its `::backdrop`; clicks
          // on the contents target descendant elements instead.
          if (getTarget(event.nativeEvent) !== event.currentTarget) {
            return;
          }
          if (!store.context.outsidePressEnabledRef.current) {
            return;
          }
          store.setOpen(false, createChangeEventDetails(REASONS.outsidePress));
        },
        style: {
          [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount,
        } as React.CSSProperties,
      },
      elementProps,
    ],
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping,
  });

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      openInteractionType={openMethod}
      disabled={!mounted}
      closeOnFocusOut={!disablePointerDismissal}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      // Kept authoritative for resolving initial/final focus. For a native modal dialog the browser's
      // `inert` background neutralizes this Tab trap (native owns it), but the focus-manager's
      // return-focus semantics must be preserved, so its `modal` value stays unchanged.
      modal={modal !== false}
      restoreFocus="popup"
    >
      {element}
    </FloatingFocusManager>
  );
});

export interface DialogPopupProps extends BaseUIComponentProps<'dialog', DialogPopupState> {
  /**
   * Determines the element to focus when the dialog is opened.
   * By default, focus moves to the first tabbable element inside the popup, except when the dialog
   * is opened by touch — then the popup itself is focused to avoid opening the virtual keyboard.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or popup).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fall back to the default behavior, or `false`/`undefined` to do nothing.
   */
  initialFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((openType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
  /**
   * Determines the element to focus when the dialog is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fall back to the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
}

export interface DialogPopupState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the dialog is nested within a parent dialog.
   */
  nested: boolean;
  /**
   * Whether the dialog has nested dialogs open.
   */
  nestedDialogOpen: boolean;
}

export namespace DialogPopup {
  export type Props = DialogPopupProps;
  export type State = DialogPopupState;
}
