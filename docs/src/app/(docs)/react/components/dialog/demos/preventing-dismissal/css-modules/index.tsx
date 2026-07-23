import { Dialog } from '@base-ui/react/dialog';
import styles from './index.module.css';

export default function ExampleDialog() {
  return (
    <Dialog.Root disablePointerDismissal>
      <Dialog.Trigger className={styles.Button}>Subscribe</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Confirm your subscription</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              Clicking the backdrop won't dismiss this dialog. Use the button below or press Escape
              to close it.
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
