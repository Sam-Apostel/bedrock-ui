'use client'

import * as React from 'react'
import { Checkbox as Bedrock } from '@apostel/bedrock'

import { cn } from '@/lib/utils'

/**
 * A real `<input type="checkbox">`, so there is no hidden input shadowing a
 * button and nothing to keep in sync.
 *
 * The tick is drawn by the element rather than by a `CheckIcon` inside it — an
 * input has no children — so `CheckboxIndicator` is gone and the mark is a
 * masked `::before` under `:checked` and `:indeterminate`.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof Bedrock.Root>) {
  return (
    <Bedrock.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input dark:bg-input/30 size-4 shrink-0 appearance-none rounded-[4px] border shadow-xs outline-none transition-shadow',
        'checked:bg-primary checked:border-primary checked:text-primary-foreground',
        'indeterminate:bg-primary indeterminate:border-primary indeterminate:text-primary-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // The mark itself: a checkmark when checked, a dash when indeterminate.
        "before:block before:size-3.5 before:bg-current before:opacity-0 before:content-['']",
        'before:[mask:var(--check)_center/contain_no-repeat] checked:before:opacity-100',
        'indeterminate:before:opacity-100 indeterminate:before:[mask:var(--dash)_center/contain_no-repeat]',
        "[--check:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='black' d='M6.2 11.3 3.3 8.4l1.1-1.1 1.8 1.8 4.4-4.4 1.1 1.1z'/></svg>\")]",
        "[--dash:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect fill='black' x='3' y='7' width='10' height='2'/></svg>\")]",
        'grid place-content-center',
        className,
      )}
      {...props}
    />
  )
}

export { Checkbox }
