import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { useComposedRefs } from '../compose-refs'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { AccordionContext } from './shared'

export interface ControlledAccordionRootProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'>, AsChildProps {
  type?: 'single' | 'multiple'
  value: string | string[]
  orientation?: 'horizontal' | 'vertical'
  onValueChange?: ((value: string[]) => void) | undefined
}

function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * Reconciles by walking its own subtree rather than by telling each item what
 * to do, which is what keeps `Accordion.Item` byte-identical under both roots.
 * Items publish their value as a data attribute; nothing about that costs the
 * plain root anything.
 *
 * `<details>` has no cancelable toggle, so this cannot refuse: the disclosure
 * moves, you are told, and it stays moved. The walk below runs when `value`
 * changes, and declining means leaving `value` alone — so a declined item is
 * left disagreeing with the prop. Same gap as Collapsible, same reasoning, in
 * `create-controlled-root.ts` and docs/known-gaps.md.
 */
export function AccordionRoot({
  asChild,
  children,
  type = 'single',
  value,
  orientation = 'vertical',
  onValueChange,
  ref,
  ...props
}: ControlledAccordionRootProps) {
  const name = useId()
  const Part: ElementType = asChild ? Slot : 'div'
  const nodeRef = useRef<HTMLElement | null>(null)

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const values = useMemo(() => toArray(value), [value])
  const report = useCallback(
    (changed: string, open: boolean) => {
      const next = open
        ? [...new Set([...values, changed])]
        : values.filter((entry) => entry !== changed)
      changeRef.current?.(next)
    },
    [values],
  )

  useEffect(() => {
    const root = nodeRef.current
    if (!root) return

    for (const item of root.querySelectorAll<HTMLDetailsElement>('[data-bedrock-accordion-item]')) {
      const itemValue = item.dataset.value
      const shouldBeOpen = itemValue !== undefined && values.includes(itemValue)
      if (item.open !== shouldBeOpen) item.open = shouldBeOpen
    }
  }, [values])

  const context = useMemo(
    () => ({
      name: type === 'single' ? name : undefined,
      orientation,
      report,
      value: values,
      defaultValue: [],
    }),
    [name, type, orientation, report, values],
  )

  return (
    <AccordionContext.Provider value={context}>
      <Part
        {...props}
        ref={useComposedRefs<HTMLElement>(ref, (node) => {
          nodeRef.current = node
        })}
        data-orientation={orientation}
        data-bedrock-accordion=""
      >
        {children}
      </Part>
    </AccordionContext.Provider>
  )
}
