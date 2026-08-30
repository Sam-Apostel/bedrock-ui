import { Collapsible } from '../../src/index'

/**
 * A single `<details>`. Unlike Dialog the root *is* the element, because
 * `<summary>` only works as a child of `<details>` — so there is nothing to
 * wire by id and `defaultOpen` is a plain attribute rather than an imperative
 * call on mount.
 */
export default function CollapsibleDemo() {
  return (
    <Collapsible.Root style={{ width: '100%', maxWidth: '28rem' }}>
      <Collapsible.Trigger>Delivery details</Collapsible.Trigger>
      <Collapsible.Content>
        Ships from Rotterdam. Tracked, and signed for over €50.
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
