import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type ElementType,
} from 'react'
import type { Orientation } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { TabsContext } from './shared'

export interface ControlledTabsRootProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'>, AsChildProps {
  value: string
  orientation?: Orientation
  onValueChange?: ((value: string) => void) | undefined
}

/** `value` decides; selecting a tab asks and changes nothing on its own. */
export function TabsRoot({
  asChild,
  children,
  value,
  orientation = 'horizontal',
  onValueChange,
  ...props
}: ControlledTabsRootProps) {
  const baseId = useId()
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const select = useCallback((next: string) => changeRef.current?.(next), [])

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
