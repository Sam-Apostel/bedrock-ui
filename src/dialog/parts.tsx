import {
  cloneElement,
  isValidElement,
  useEffect,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactNode,
} from 'react'
import { useClientRender } from '../client-render'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { validateElement } from '../validate-element'
import { validateTrigger } from '../validate-trigger'
import { useDialogContext } from './shared'

export interface DialogTriggerProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function DialogTrigger({ asChild, ref, ...props }: DialogTriggerProps) {
  const { id, open } = useDialogContext('Dialog.Trigger')
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      // After the spread: the invoker wiring is the part, not a default.
      type="button"
      commandfor={id}
      command="show-modal"
      // Chrome gives a popover invoker implicit `aria-expanded` and gives a
      // dialog invoker nothing, so this is written by hand — and it cannot go
      // stale, because it comes from the same DOM-observed state the content
      // uses, not from a React mirror of it.
      aria-expanded={open}
      // Only while there is something to point at: a reference to a hidden
      // element is worse than no reference.
      aria-controls={open ? id : undefined}
      data-bedrock-dialog-trigger=""
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Dialog.Trigger'),
      )}
    />
  )
}

export interface DialogContentProps extends ComponentPropsWithRef<'dialog'>, AsChildProps {}

/**
 * Radix's rule, and it is the right one: an `aria-describedby` you pass is
 * *added to*, not swapped for, the Description's id — the description is still
 * rendered, so dropping its reference would be a lie about the markup.
 *
 * Duplicates and stray whitespace are normalised, because an id list is a set
 * and `' a\ta a b '` is the shape these arrive in.
 */
function mergeIds(passed: string | undefined, own: string | undefined): string | undefined {
  const ids = [...(passed ?? '').split(/\s+/), ...(own ?? '').split(/\s+/)].filter(Boolean)
  const unique = [...new Set(ids)]

  return unique.length > 0 ? unique.join(' ') : undefined
}

export function DialogContent({ asChild, ref, children, ...props }: DialogContentProps) {
  const { id, open, registerContent, labelledBy, describedBy } = useDialogContext('Dialog.Content')

  const onClient = useClientRender()

  // The <dialog> itself is always rendered — the trigger's `commandfor` has to
  // resolve to something, always. Its children are not: they mount when the
  // browser opens it and unmount once the exit animation is done, so closing
  // resets whatever they were holding.
  const mounted = open || !onClient

  // `in` rather than `??`, so passing an explicit undefined removes the
  // association — the escape hatch for a dialog labelled some other way.
  const Part: ElementType = asChild ? Slot : 'dialog'

  // A label is one thing, so yours replaces ours. A description is a list, so
  // yours joins ours. `in` rather than `??` either way, so passing an explicit
  // undefined still removes the association entirely.
  const label = 'aria-labelledby' in props ? props['aria-labelledby'] : labelledBy
  const description =
    'aria-describedby' in props ? mergeIds(props['aria-describedby'], describedBy) : describedBy

  // With `asChild` the child *is* the <dialog>, so gating it would unmount the
  // element the trigger points at. What gets gated is one level deeper: the
  // child's own children.
  const body: ReactNode =
    asChild && isValidElement(children)
      ? cloneElement(
          children,
          {},
          mounted ? ((children.props as { children?: ReactNode }).children ?? null) : null,
        )
      : mounted
        ? children
        : null

  return (
    <Part
      {...props}
      // The trigger's `commandfor` points here, so this id is load-bearing and
      // is not forwarded from props the way every other part's id is.
      id={id}
      aria-labelledby={label}
      aria-describedby={description}
      data-bedrock-dialog=""
      ref={useComposedRefs<HTMLElement>(ref, registerContent, (node) =>
        validateElement(node, 'DIALOG', 'Dialog.Content'),
      )}
    >
      {body}
    </Part>
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
      ref={useComposedRefs<HTMLElement>(ref, (node) =>
        validateTrigger(node, 'command', 'Dialog.Close'),
      )}
    />
  )
}
