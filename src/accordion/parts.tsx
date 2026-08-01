import { useCallback, useMemo, useRef, type ComponentPropsWithRef, type ElementType } from 'react'
import { useClientRender } from '../client-render'
import { composeRefs } from '../compose-refs'
import { useOpenState } from '../open-state'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'
import { AccordionItemContext, useAccordionContext, useAccordionItemContext } from './shared'

export interface AccordionItemProps
  extends Omit<ComponentPropsWithRef<'details'>, 'value'>, AsChildProps {
  value: string
  disabled?: boolean
}

/**
 * A `<details>`, sharing its `name` with its siblings when the root is
 * `type="single"`. Exclusivity is the browser's, so it survives with no
 * JavaScript and cannot get out of step with React state.
 */
export function AccordionItem({
  asChild,
  children,
  value,
  disabled,
  ref,
  ...props
}: AccordionItemProps) {
  const { name, report, value: controlled, defaultValue } = useAccordionContext('Accordion.Item')
  const Part: ElementType = asChild ? Slot : 'details'

  const reportRef = useRef(report)
  reportRef.current = report

  const onToggle = useCallback((next: boolean) => reportRef.current(value, next), [value])
  const startsOpen = (controlled ?? defaultValue).includes(value)
  const { open, observe } = useOpenState(onToggle, startsOpen)
  const startsOpenRef = useRef(startsOpen)

  const item = useMemo(() => ({ value, open }), [value, open])

  return (
    <AccordionItemContext.Provider value={item}>
      <Part
        {...props}
        name={name}
        open={startsOpenRef.current}
        // The controlled root reconciles by walking its own subtree, so the
        // value has to be readable from the DOM. Costs the plain root nothing.
        data-value={value}
        // A disabled disclosure is not a native concept; removing the summary
        // from the tab order and blocking the toggle is the closest thing.
        data-disabled={disabled ? '' : undefined}
        ref={composeRefs<HTMLElement>(ref, observe)}
        data-bedrock-accordion-item=""
      >
        {children}
      </Part>
    </AccordionItemContext.Provider>
  )
}

export interface AccordionHeaderProps extends ComponentPropsWithRef<'summary'>, AsChildProps {}

/**
 * The `<summary>`. Radix renders `<h3><button aria-expanded>`; the platform's
 * disclosure pattern is a summary, which carries the expanded state itself.
 *
 * If you need the heading semantics the APG asks for, put a heading *inside*
 * this — `<Accordion.Header><h3>…</h3></Accordion.Header>` is valid and keeps
 * the summary's behaviour.
 */
export function AccordionHeader({ asChild, ...props }: AccordionHeaderProps) {
  const Part: ElementType = asChild ? Slot : 'summary'

  return <Part {...props} data-bedrock-accordion-header="" />
}

export interface AccordionTriggerProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/**
 * Sits inside the header and is not itself interactive — the summary already
 * is, and nesting a button inside it would produce two tab stops for one
 * control. It exists so Radix-shaped markup keeps its styling hook.
 */
export function AccordionTrigger({ asChild, ...props }: AccordionTriggerProps) {
  const Part: ElementType = asChild ? Slot : 'span'

  return <Part {...props} data-bedrock-accordion-trigger="" />
}

export interface AccordionContentProps extends ComponentPropsWithRef<'div'>, AsChildProps {}

export function AccordionContent({ asChild, children, ...props }: AccordionContentProps) {
  const { open } = useAccordionItemContext('Accordion.Content')
  const onClient = useClientRender()
  const Part: ElementType = asChild ? Slot : 'div'

  return (
    <Part {...props} data-bedrock-accordion-content="">
      {open || !onClient ? children : null}
    </Part>
  )
}
