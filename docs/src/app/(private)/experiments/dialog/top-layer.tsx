'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { Toast } from '@base-ui/react/toast';
import demoStyles from 'docs/src/app/(docs)/react/components/dialog/demos/page-toasts/css-modules/index.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './top-layer.module.css';

interface Settings {
  modal: boolean;
  topLayer: boolean;
}

export default function TopLayerExperiment() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <Toast.Provider>
      <div className={styles.Page}>
        <h1>Top layer</h1>

        <div className={styles.Intro}>
          <p>
            Toggle <code>topLayer</code> (and <code>modal</code>) in the settings panel, then verify
            the differences below by hand. <code>topLayer</code> only applies to modal dialogs.
          </p>
          <ol>
            <li>
              <strong>Stacking:</strong> open the dialog, then raise a toast from inside it. With{' '}
              <code>topLayer</code> on, the native top-layer dialog covers the toast; with it off,
              the toast stays above the dialog (its viewport is given a higher <code>z-index</code>
              ).
            </li>
            <li>
              <strong>Toast interactivity:</strong> try clicking the toast&rsquo;s <em>Undo</em>{' '}
              button while the dialog is open. It should stay clickable and announced when{' '}
              <code>topLayer</code> is off.
            </li>
            <li>
              <strong>Focus containment:</strong> open the dialog and press <kbd>Tab</kbd>{' '}
              repeatedly from the last control. With <code>topLayer</code> on, focus can leave into
              the browser chrome (native behavior); with it off, focus is trapped and cycles inside
              the dialog.
            </li>
            <li>
              <strong>Scroll lock &amp; animations:</strong> both behave identically regardless of{' '}
              <code>topLayer</code> — the page stays locked while a modal dialog is open, and the
              backdrop and popup animate in and out.
            </li>
          </ol>
        </div>

        <h2>Modal dialog</h2>
        <div className={styles.Container}>
          <Dialog.Root modal={settings.modal} topLayer={settings.topLayer}>
            <Dialog.Trigger className={demoStyles.Button}>Open dialog</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className={demoStyles.Backdrop} />
              <Dialog.Popup className={demoStyles.Popup}>
                <div className={demoStyles.Intro}>
                  <Dialog.Title className={demoStyles.Title}>Your cart</Dialog.Title>
                  <Dialog.Description className={demoStyles.Description}>
                    1 item in your cart.
                  </Dialog.Description>
                </div>

                <div className={styles.DialogSection}>
                  <label className={styles.Label}>
                    Quick note (verifies focus and state):
                    <NoteInput />
                  </label>
                </div>

                <div className={clsx(demoStyles.Actions)}>
                  <RaiseToastButton />
                  <Dialog.Close className={demoStyles.Button}>Close</Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <h2>Page content outside the dialog</h2>
        <div className={styles.OutsideRegion}>
          <p className={styles.OutsideRegionTitle}>
            Ordinary page content (rendered outside the dialog)
          </p>
          <div className={styles.Container}>
            <button type="button" className={demoStyles.Button}>
              Outside button
            </button>
            <a href="https://base-ui.com" target="_blank" rel="noreferrer">
              Outside link
            </a>
          </div>
        </div>
      </div>

      <Toast.Portal>
        <Toast.Viewport className={demoStyles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function NoteInput() {
  const [note, setNote] = React.useState('');
  return (
    <input
      className={styles.Input}
      type="text"
      value={note}
      onChange={(event) => setNote(event.target.value)}
      placeholder="Capture an idea"
    />
  );
}

function RaiseToastButton() {
  const toastManager = Toast.useToastManager();

  function removeItem() {
    const id = toastManager.add({
      title: 'Item removed',
      description: 'The item was removed from your cart.',
      actionProps: {
        children: 'Undo',
        onClick() {
          toastManager.close(id);
        },
      },
    });
  }

  return (
    <button type="button" className={demoStyles.Button} onClick={removeItem}>
      Raise toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={demoStyles.Toast}>
      <Toast.Content className={demoStyles.ToastContent}>
        <div className={demoStyles.ToastText}>
          <Toast.Title className={demoStyles.ToastTitle} />
          <Toast.Description className={demoStyles.ToastDescription} />
        </div>
        <Toast.Action className={demoStyles.ToastAction} />
      </Toast.Content>
    </Toast.Root>
  ));
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  modal: {
    type: 'boolean',
    label: 'Modal',
    default: true,
  },
  topLayer: {
    type: 'boolean',
    label: 'Top layer',
    default: true,
  },
};
