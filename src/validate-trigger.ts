import type { InvokerKind } from './types'

const ALLOWED: Record<InvokerKind, readonly string[]> = {
  // `commandfor` / `command` are defined on <button> and nowhere else.
  command: ['BUTTON'],
  // `interestfor` additionally works on <a>, which is what makes link previews
  // and hover cards possible without a wrapper element.
  interest: ['BUTTON', 'A'],
}

const ATTRIBUTE: Record<InvokerKind, string> = {
  command: 'commandfor',
  interest: 'interestfor',
}

function list(tags: readonly string[]) {
  return tags.map((tag) => `<${tag.toLowerCase()}>`).join(' or ')
}

/**
 * Called from the trigger's ref callback, so it sees what the child actually
 * rendered rather than what `asChild` was handed. `<MyButton>` may well render
 * a `<button>`; only the DOM knows.
 *
 * Deliberately has no repair path. A click-handler fallback would ship the
 * imperative trigger machinery this library exists to remove, to every
 * consumer, permanently — and a fallback that works is a fallback nobody
 * removes. Development throws so it can't be shipped by accident. Production
 * logs, so a trigger behind a rarely-rendered branch isn't a silent mystery.
 */
export function validateTrigger(
  node: HTMLElement | null,
  kind: InvokerKind,
  part: string,
): void {
  if (!node) return

  const allowed = ALLOWED[kind]

  if (!allowed.includes(node.tagName)) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `[bedrock] ${part} rendered <${node.tagName.toLowerCase()}>, but ` +
          `${ATTRIBUTE[kind]} only works on ${list(allowed)}.\n\n` +
          `Without it the trigger has no keyboard activation and no implicit ` +
          `aria-expanded.\n\n` +
          `Fix: render ${list(allowed)}, or drop asChild, or take the props ` +
          `yourself with the use${part.replace('.', '')} hook and handle ` +
          `accessibility on your side.`,
      )
    }
    console.error(
      `[bedrock] ${part} must render ${list(allowed)}; got ` +
        `<${node.tagName.toLowerCase()}>. Trigger is not keyboard accessible.`,
    )
    return
  }

  // A button inside a form defaults to type="submit", and submitting a form and
  // invoking a popover are conflicting behaviours, so the invocation is ignored.
  // Far more common in the wild than the wrong-tag case.
  if (
    node.tagName === 'BUTTON' &&
    (node as HTMLButtonElement).type !== 'button' &&
    node.closest('form')
  ) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `[bedrock] ${part} is a submit button inside a <form>. Submitting and ` +
          `invoking are conflicting behaviours, so the browser ignores ` +
          `${ATTRIBUTE[kind]}.\n\nFix: add type="button" to the child.`,
      )
    }
    console.error(
      `[bedrock] ${part} is a submit button inside a <form>; ` +
        `${ATTRIBUTE[kind]} will be ignored. Add type="button".`,
    )
  }
}
