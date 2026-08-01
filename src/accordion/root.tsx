import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { AccordionContext } from './shared'

export interface AccordionRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  /**
   * `single` gives the items a shared name, which is what makes the browser
   * close the others. `multiple` leaves them independent.
   */
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  orientation?: 'horizontal' | 'vertical'
  /** Reports which items are open after a change. Cannot refuse. */
  onValueChange?(value: string[]): void
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Renders a plain container. All the behaviour is in the items, and all of it
 * is `<details name>` — no roving state, no open registry, no effect that
 * closes siblings.
 *
 * `type="single"` therefore always allows closing the open item, because a
 * `<summary>` toggles. Radix's `collapsible={false}` has no native equivalent
 * and is not offered.
 */
export function AccordionRoot({
  asChild,
  children,
  type = 'single',
  defaultValue,
  orientation = 'vertical',
  onValueChange,
  ...props
}: AccordionRootProps) {
  const name = useId()
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  // Tracked in a ref rather than state: the DOM is the source of truth, and the
  // root has nothing to re-render when an item opens. Read once, as the name of
  // the prop says.
  const initialValues = useRef(toArray(defaultValue))
  const openValues = useRef<string[]>(initialValues.current)

  const report = useCallback((value: string, open: boolean) => {
    const next = open
      ? [...new Set([...openValues.current, value])]
      : openValues.current.filter((entry) => entry !== value)

    openValues.current = next
    changeRef.current?.(next)
  }, [])

  const context = useMemo(
    () => ({
      name: type === 'single' ? name : undefined,
      orientation,
      report,
      value: undefined,
      defaultValue: initialValues.current,
    }),
    [name, type, orientation, report],
  )

  return (
    <AccordionContext.Provider value={context}>
      <Part {...props} data-orientation={orientation} data-bedrock-accordion="">
        {children}
      </Part>
    </AccordionContext.Provider>
  )
}
