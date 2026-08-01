import type { ComponentPropsWithRef } from 'react'
import { DialogClose, DialogContent, type DialogContentProps } from '../dialog/parts'

export type AlertDialogContentProps = DialogContentProps

/**
 * A Dialog announced as an alert dialog. The difference is `role`, plus the
 * convention that the only ways out are the buttons you provide — which is the
 * native default, since a modal `<dialog>` has no light dismiss to disable.
 *
 * Escape still closes, exactly as it does in Radix's AlertDialog.
 */
export function AlertDialogContent(props: AlertDialogContentProps) {
  return <DialogContent role="alertdialog" {...props} />
}

export type AlertDialogActionProps = ComponentPropsWithRef<'button'>

/** A close button that runs your handler. Both Action and Cancel dismiss. */
export function AlertDialogAction(props: AlertDialogActionProps) {
  return <DialogClose {...props} data-bedrock-alert-dialog-action="" />
}

export function AlertDialogCancel(props: AlertDialogActionProps) {
  return <DialogClose {...props} data-bedrock-alert-dialog-cancel="" />
}
