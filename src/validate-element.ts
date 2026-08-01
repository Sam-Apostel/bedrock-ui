/**
 * The `asChild` counterpart to `validateTrigger`, for parts where the element
 * itself is load-bearing rather than the invoker attribute on it.
 *
 * A `Dialog.Content` that is not a `<dialog>` does not fail loudly — it renders
 * a div that never enters the top layer, never traps focus and never opens,
 * while `showModal()` throws somewhere the consumer will not connect to their
 * markup. Same policy as the trigger rule: throw in development, log in
 * production, repair nothing.
 */
export function validateElement(node: HTMLElement | null, tag: string, part: string): void {
  if (!node || node.tagName === tag) return

  const message =
    `[bedrock] ${part} rendered <${node.tagName.toLowerCase()}>, but it must be a ` +
    `<${tag.toLowerCase()}>. Everything it does — the top layer, the focus trap, the ` +
    `backdrop, showModal() — belongs to that element.`

  if (process.env.NODE_ENV !== 'production') throw new Error(message)
  console.error(message)
}
