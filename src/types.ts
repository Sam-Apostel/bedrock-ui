import type { ReactElement, ReactNode } from 'react'

export type AnyProps = Record<string, unknown>

export interface SlotProps extends AnyProps {
  children: ReactElement
}

export interface AsChildProps {
  /** Merge props onto the single child element instead of rendering our own. */
  asChild?: boolean
  children?: ReactNode
}

/**
 * Which invoker mechanism a part relies on, which decides the tags it accepts.
 *
 *  - `command`  — `commandfor` / `command`, buttons only
 *  - `interest` — `interestfor`, buttons and anchors
 */
export type InvokerKind = 'command' | 'interest'

/**
 * Everything the controlled entry point needs to know about a primitive in
 * order to reconcile it. One adapter per DOM shape, not per component.
 */
export interface OpenStateAdapter {
  /** Read current open state straight off the node. */
  isOpen(node: HTMLElement): boolean
  open(node: HTMLElement): void
  close(node: HTMLElement): void
  /**
   * Optional cancelable close event, e.g. `<dialog>`'s `cancel`, which fires
   * for Esc and for `command="request-close"`. Gives us a close veto on
   * elements whose `beforetoggle` isn't cancelable.
   */
  closeVetoEvent?: string
}

export interface RootContextValue {
  /** Shared id, used for `commandfor` / `interestfor` / `popovertarget`. */
  id: string
  /**
   * What the DOM is doing, not what a prop claims. Content parts render their
   * children only while this is true — plus however long an exit animation
   * runs — so closing tears the subtree down and reopening starts it fresh.
   * That is what makes a form inside a dialog reset itself without the consumer
   * wiring anything to `onOpenChange`.
   *
   * Both roots publish it and neither derives it from React state, so parts
   * still cannot tell which root they are under.
   */
  open: boolean
  /**
   * Content parts call this with their DOM node on mount and `null` on unmount.
   * The plain root uses it for at most a `toggle` listener; the controlled root
   * uses it to wire the veto. Children never branch on which root they're under.
   */
  registerContent(node: HTMLElement | null): void
}
