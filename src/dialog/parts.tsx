import { useEffect, type ComponentPropsWithRef, type ElementType } from 'react'
import { useClientRender } from '../client-render'
import { composeRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateTrigger } from '../validate-trigger'
import { useDialogContext } from './shared'

export interface DialogTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function DialogTrigger({ asChild, ref, ...props }: DialogTriggerProps) {
  const { id } = useDialogContext('Dialog.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      // After the spread: the invoker wiring is the part, not a default.
      type="button"
      commandfor={id}
      command="show-modal"
      data-bedrock-dialog-trigger=""
      ref={composeRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Dialog.Trigger'),
      )}
    />
  )
}

export type DialogContentProps = ComponentPropsWithRef<'dialog'>

export function DialogContent({ ref, children, ...props }: DialogContentProps) {
  const { id, open, registerContent, labelledBy, describedBy } = useDialogContext('Dialog.Content')

  const onClient = useClientRender()

  // The <dialog> itself is always rendered — the trigger's `commandfor` has to
  // resolve to something, always. Its children are not: they mount when the
  // browser opens it and unmount once the exit animation is done, so closing
  // resets whatever they were holding.
  const mounted = open || !onClient

  // `in` rather than `??`, so passing an explicit undefined removes the
  // association — the escape hatch for a dialog labelled some other way.
  const label = 'aria-labelledby' in props ? props['aria-labelledby'] : labelledBy
  const description = 'aria-describedby' in props ? props['aria-describedby'] : describedBy

  return (
    <dialog
      {...props}
      // The trigger's `commandfor` points here, so this id is load-bearing and
      // is not forwarded from props the way every other part's id is.
      id={id}
      aria-labelledby={label}
      aria-describedby={description}
      data-bedrock-dialog=""
      ref={composeRefs<HTMLDialogElement>(ref, registerContent)}
    >
      {mounted ? children : null}
    </dialog>
  )
}

export interface DialogTitleProps extends ComponentPropsWithRef<'h2'>, AsChildProps {}

export function DialogTitle({ asChild, ...props }: DialogTitleProps) {
  const { id, registerTitle } = useDialogContext('Dialog.Title')
  const Part: ElementType = asChild ? Slot : 'h2'

  // Announces itself so Content can point `aria-labelledby` at something that
  // exists. A reference to a missing element is a dialog with no name.
  useEffect(() => registerTitle(), [registerTitle])

  return <Part {...props} id={`${id}-title`} data-bedrock-dialog-title="" />
}

export interface DialogDescriptionProps extends ComponentPropsWithRef<'p'>, AsChildProps {}

export function DialogDescription({ asChild, ...props }: DialogDescriptionProps) {
  const { id, registerDescription } = useDialogContext('Dialog.Description')
  const Part: ElementType = asChild ? Slot : 'p'

  useEffect(() => registerDescription(), [registerDescription])

  return <Part {...props} id={`${id}-description`} data-bedrock-dialog-description="" />
}

export interface DialogCloseProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function DialogClose({ asChild, ref, ...props }: DialogCloseProps) {
  const { id } = useDialogContext('Dialog.Close')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      commandfor={id}
      // Never `close`: that skips `cancel`, the only cancelable close hook a
      // <dialog> has, and the controlled root's close veto is built on it.
      command="request-close"
      data-bedrock-dialog-close=""
      ref={composeRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Dialog.Close'),
      )}
    />
  )
}
