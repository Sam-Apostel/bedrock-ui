import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type MouseEvent,
} from 'react'
import { composeRefs } from '../compose-refs'
import { useRoving, type Orientation } from '../roving'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

interface ToggleGroupContextValue {
  pressed: readonly string[]
  toggle(value: string): void
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

export function useToggleGroupContext(part: string): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside ToggleGroup.Root.`)
  return context
}

export { ToggleGroupContext }

export interface ToggleGroupRootProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'>, AsChildProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  orientation?: Orientation
  loop?: boolean
  onValueChange?(value: string[]): void
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * A group of toggle buttons sharing one tab stop. `aria-pressed` on each,
 * rather than radio semantics, because these are buttons that stay down — the
 * bold/italic/underline row, not a choice of one thing.
 */
export function ToggleGroupRoot({
  asChild,
  children,
  type = 'single',
  defaultValue,
  orientation = 'horizontal',
  loop = true,
  onValueChange,
  ref,
  ...props
}: ToggleGroupRootProps) {
  const [pressed, setPressed] = useState(() => toArray(defaultValue))
  const { registerContainer } = useRoving({ orientation, loop, typeahead: false })
  const Part: ElementType = asChild ? Slot : 'div'

  const changeRef = useRef(onValueChange)
  changeRef.current = onValueChange

  const toggle = useCallback(
    (value: string) => {
      setPressed((current) => {
        const isOn = current.includes(value)
        const next =
          type === 'single'
            ? isOn
              ? []
              : [value]
            : isOn
              ? current.filter((entry) => entry !== value)
              : [...current, value]

        changeRef.current?.(next)
        return next
      })
    },
    [type],
  )

  const context = useMemo(() => ({ pressed, toggle }), [pressed, toggle])

  return (
    <ToggleGroupContext.Provider value={context}>
      <Part
        {...props}
        role="group"
        data-orientation={orientation}
        ref={composeRefs<HTMLElement>(ref, registerContainer)}
        data-bedrock-toggle-group=""
      >
        {children}
      </Part>
    </ToggleGroupContext.Provider>
  )
}

export interface ToggleGroupItemProps extends ComponentPropsWithRef<'button'>, AsChildProps {
  value: string
}

export function ToggleGroupItem({ asChild, value, onClick, ...props }: ToggleGroupItemProps) {
  const { pressed, toggle } = useToggleGroupContext('ToggleGroup.Item')
  const Part: ElementType = asChild ? Slot : 'button'

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) toggle(value)
    },
    [onClick, toggle, value],
  )

  return (
    <Part
      {...props}
      type="button"
      aria-pressed={pressed.includes(value)}
      onClick={handleClick}
      data-bedrock-roving-item=""
      data-bedrock-toggle-group-item=""
    />
  )
}
