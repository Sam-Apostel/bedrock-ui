import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import type { Orientation } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { TabsContext } from './shared'

export interface TabsRootProps extends ComponentPropsWithRef<'div'>, AsChildProps {
  defaultValue?: string
  orientation?: Orientation
  onValueChange?(value: string): void
}

/**
 * Holds the selected value in React state, because nothing in the platform
 * models "one of these panels is showing". This is a primitive where the
 * two-root split buys very little: both roots ship the same roving module.
 */
export function TabsRoot({
  asChild,
  children,
  defaultValue,
  orientation = 'horizontal',
  onValueChange,
  ...props
}: TabsRootProps) {
  const baseId = useId()
  const [value, setValue] = useState(defaultValue)
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const select = useCallback((next: string) => {
    setValue((current) => {
      if (current !== next) changeRef.current?.(next)
      return next
    })
  }, [])

  const context = useMemo(
    () => ({ baseId, value, select, orientation }),
    [baseId, value, select, orientation],
  )

  return (
    <TabsContext.Provider value={context}>
      <Part {...props} data-orientation={orientation} data-bedrock-tabs="">
        {children}
      </Part>
    </TabsContext.Provider>
  )
}
