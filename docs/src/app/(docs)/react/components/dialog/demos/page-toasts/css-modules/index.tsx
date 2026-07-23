'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Toast } from '@base-ui/react/toast';
import styles from './index.module.css';

export default function ExampleDialog() {
  return (
    <Toast.Provider>
      <Dialog.Root topLayer={false}>
        <Dialog.Trigger className={styles.Button}>View cart</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Your cart</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                1 item in your cart.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <RemoveItemButton />
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast.Portal>
        <Toast.Viewport className={styles.Viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function RemoveItemButton() {
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
    <button type="button" className={styles.Button} onClick={removeItem}>
      Remove item
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.Toast}>
      <Toast.Content className={styles.ToastContent}>
        <div className={styles.ToastText}>
          <Toast.Title className={styles.ToastTitle} />
          <Toast.Description className={styles.ToastDescription} />
        </div>
        <Toast.Action className={styles.ToastAction} />
      </Toast.Content>
    </Toast.Root>
  ));
}
