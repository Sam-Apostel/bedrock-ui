import { Accordion } from '../../src/index'

/**
 * Each item is a `<details>`, and `type="single"` gives the siblings a shared
 * `name` — so the browser closes the open one. Exclusivity survives with
 * JavaScript disabled, and cannot drift out of step with React state.
 */
export default function AccordionDemo() {
  return (
    <Accordion.Root type="single" style={{ width: '100%', maxWidth: '28rem' }}>
      <Accordion.Item value="shipping">
        <Accordion.Header>
          <Accordion.Trigger>When does it ship?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Within two working days, tracked.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Header>
          <Accordion.Trigger>Can I return it?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Thirty days, unopened, no questions.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="support">
        <Accordion.Header>
          <Accordion.Trigger>How do I get support?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Reply to your order email and it reaches a person.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
