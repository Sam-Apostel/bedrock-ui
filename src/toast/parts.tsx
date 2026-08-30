import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactNode,
} from 'react'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

interface ToastProviderValue {
  duration: number
}

const ToastProviderContext = createContext<ToastProviderValue>({ duration: 5000 })

export interface ToastProviderProps {
  children?: ReactNode
  /** How long a toast stays up. Individual toasts can override it. */
  duration?: number
}

export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  const value = useMemo(() => ({ duration }), [duration])

  return <ToastProviderContext.Provider value={value}>{children}</ToastProviderContext.Provider>
}

export interface ToastViewportProps extends ComponentPropsWithRef<'ol'>, AsChildProps {}

/**
 * One `popover="manual"` region holding the whole stack, rather than a popover
 * per toast. Manual, because a toast must not be light-dismissed by a click
 * elsewhere and must not close whatever menu is open.
 *
 * The list is in the top layer, so it sits above dialogs without a z-index, and
 * ordinary flow layout applies inside it.
 */
export function ToastViewport({ asChild, ref, ...props }: ToastViewportProps) {
  const Part: ElementType = asChild ? Slot : 'ol'

  const show = useCallback((node: HTMLElement | null) => {
    // The one imperative call: there is no attribute that opens a popover on
    // parse, and a toast region has to be there before the first toast is.
    if (node && !node.matches(':popover-open')) node.showPopover()
  }, [])

  return (
    <Part
      {...props}
      popover="manual"
      role="region"
      aria-live="polite"
      tabIndex={-1}
      ref={useComposedRefs<HTMLElement>(ref, show)}
      data-bedrock-toast-viewport=""
    />
  )
}

export interface ToastRootProps extends ComponentPropsWithRef<'li'>, AsChildProps {
  duration?: number
  onOpenChange?(open: boolean): void
}

/**
 * Dismisses itself after `duration`, and pauses while the pointer is over it or
 * focus is inside — the two behaviours people notice when they are missing.
 *
 * No swipe-to-dismiss: that is a pointer gesture with no native equivalent, and
 * it is listed as a gap rather than half-implemented.
 */
export function ToastRoot({
  asChild,
  children,
  duration,
  onOpenChange,
  ref,
  ...props
}: ToastRootProps) {
  const { duration: fallback } = useContext(ToastProviderContext)
  const [open, setOpen] = useState(true)
  const nodeRef = useRef<HTMLElement | null>(null)
  const Part: ElementType = asChild ? Slot : 'li'

  const changeRef = useRef(onOpenChange)
  changeRef.current = onOpenChange
  const total = duration ?? fallback

  useEffect(() => {
    if (total === Infinity) return

    let timer = 0
    const node = nodeRef.current

    const start = () => {
      timer = window.setTimeout(() => {
        setOpen(false)
        changeRef.current?.(false)
      }, total)
    }

    const pause = () => window.clearTimeout(timer)
    const resume = () => {
      pause()
      start()
    }

    start()
    node?.addEventListener('pointerenter', pause)
    node?.addEventListener('pointerleave', resume)
    node?.addEventListener('focusin', pause)
    node?.addEventListener('focusout', resume)

    return () => {
      pause()
      node?.removeEventListener('pointerenter', pause)
      node?.removeEventListener('pointerleave', resume)
      node?.removeEventListener('focusin', pause)
      node?.removeEventListener('focusout', resume)
    }
  }, [total])

  // Above the early return: a hook cannot be called conditionally, and this one
  // has to keep its identity across the render that dismisses the toast.
  const composedRef = useComposedRefs<HTMLElement>(ref, (node) => {
    nodeRef.current = node
  })

  if (!open) return null

  return (
    <Part {...props} role="status" ref={composedRef} data-bedrock-toast="">
      {children}
    </Part>
  )
}

export interface ToastPartProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

export function ToastTitle({ asChild, ...props }: ToastPartProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} data-bedrock-toast-title="" />
}

export function ToastDescription({ asChild, ...props }: ToastPartProps) {
  const Part: ElementType = asChild ? Slot : 'div'

  return <Part {...props} data-bedrock-toast-description="" />
}

export interface ToastCloseProps extends ComponentPropsWithRef<'button'>, AsChildProps {}

export function ToastClose({ asChild, onClick, ...props }: ToastCloseProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  return (
    <Part
      {...props}
      type="button"
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        event.currentTarget.closest<HTMLElement>('[data-bedrock-toast]')?.remove()
      }}
      data-bedrock-toast-close=""
    />
  )
}

export function ToastAction({ asChild, ...props }: ToastCloseProps) {
  const Part: ElementType = asChild ? Slot : 'button'

  return <Part {...props} type="button" data-bedrock-toast-action="" />
}
