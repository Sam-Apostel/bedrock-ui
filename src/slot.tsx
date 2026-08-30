import { cloneElement, isValidElement, type Ref } from 'react'
import { useComposedRefs } from './compose-refs'
import type { AnyProps, SlotProps } from './types'

type Handler = (...args: unknown[]) => void

/**
 * Merges the props a part wanted to render onto the child it was handed.
 *
 * The child wins on plain values, because `asChild` exists so consumers can
 * override what we would have rendered. The exceptions are the three props
 * where losing one side silently breaks something: handlers both run, styles
 * merge, class names concatenate.
 */
function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps }

  for (const key of Object.keys(childProps)) {
    const ours = slotProps[key]
    const theirs = childProps[key]

    if (/^on[A-Z]/.test(key)) {
      if (typeof ours === 'function' && typeof theirs === 'function') {
        // Child first, so ours can read `event.defaultPrevented` and stand down.
        merged[key] = (...args: unknown[]) => {
          ;(theirs as Handler)(...args)
          ;(ours as Handler)(...args)
        }
      } else if (typeof ours === 'function') {
        merged[key] = ours
      }
    } else if (key === 'style') {
      merged[key] = { ...(ours as object), ...(theirs as object) }
    } else if (key === 'className') {
      merged[key] = [ours, theirs].filter(Boolean).join(' ')
    }
  }

  return merged
}

export function Slot({ children, ...slotProps }: SlotProps) {
  if (!isValidElement(children)) {
    throw new Error('[bedrock] asChild expects exactly one React element child.')
  }

  const childProps = children.props as AnyProps
  const merged = mergeProps(slotProps, childProps)

  // Ours reads the node for tag validation and, under the controlled root, for
  // event wiring; theirs must keep working regardless.
  merged.ref = useComposedRefs(slotProps.ref as Ref<unknown>, childProps.ref as Ref<unknown>)

  return cloneElement(children, merged)
}
