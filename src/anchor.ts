import type { CSSProperties } from 'react'

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Align = 'start' | 'center' | 'end'

/**
 * `anchor-name` is document-scoped, so every instance needs its own. React's
 * generated ids are not all valid in a dashed-ident — `«r0»` is a real format —
 * so anything outside the ident grammar is replaced rather than trusted.
 */
export function anchorName(id: string): string {
  return `--bedrock-${id.replace(/[^\w-]/g, '')}`
}

/**
 * `side` and `align` in Radix's vocabulary, mapped to a `position-area` plus a
 * self-alignment.
 *
 * The self-alignment is the part that is easy to miss, and the reason
 * `side`/`align` are worth keeping as props rather than exposing the CSS: a
 * `span-*` area is a *region*, not a position, and an element in one is centred
 * within it by default. `align="start"` therefore needs `span-inline-end` **and**
 * `justify-self: start`, or the popover drifts to the middle of the viewport as
 * soon as the region is wider than the content.
 *
 * `center` uses `span-all` with `anchor-center` rather than the anchor's own
 * cell, so wide content centres on the trigger instead of being squeezed into
 * its width.
 */
interface Placement {
  area: string
  /** Which self-alignment property applies depends on the side. */
  alignment: string
}

const BLOCK_SIDE: Record<Align, Placement> = {
  start: { area: 'span-inline-end', alignment: 'start' },
  center: { area: 'span-all', alignment: 'anchor-center' },
  end: { area: 'span-inline-start', alignment: 'end' },
}

const INLINE_SIDE: Record<Align, Placement> = {
  start: { area: 'span-block-end', alignment: 'start' },
  center: { area: 'span-all', alignment: 'anchor-center' },
  end: { area: 'span-block-start', alignment: 'end' },
}

const AREA: Record<Side, Record<Align, Placement>> = {
  top: BLOCK_SIDE,
  bottom: BLOCK_SIDE,
  left: INLINE_SIDE,
  right: INLINE_SIDE,
}

const CELL: Record<Side, string> = {
  top: 'block-start',
  bottom: 'block-end',
  left: 'inline-start',
  right: 'inline-end',
}

const OFFSET_EDGE: Record<Side, string> = {
  top: 'marginBottom',
  bottom: 'marginTop',
  left: 'marginRight',
  right: 'marginLeft',
}

export interface PlacementOptions {
  side: Side
  align: Align
  sideOffset: number
  /** Flip to the opposite side rather than overflow the viewport. */
  avoidCollisions: boolean
}

/**
 * Inline styles rather than a stylesheet, because the anchor name is per
 * instance and because this library does not require its CSS to be loaded.
 *
 * A browser without anchor positioning ignores every one of these declarations
 * and the popover lands where the UA puts it — centred, usable, not beside its
 * trigger. That is the documented degradation, and it needs no feature test
 * because an unsupported property is simply dropped.
 */
export function placementStyles(anchor: string, options: PlacementOptions): CSSProperties {
  const { side, align, sideOffset, avoidCollisions } = options

  const placement = AREA[side][align]
  const alongBlock = side === 'top' || side === 'bottom'

  const styles: Record<string, string> = {
    positionAnchor: anchor,
    positionArea: `${CELL[side]} ${placement.area}`,
    // The UA stylesheet centres a popover with `inset: 0; margin: auto`, and
    // auto margins beat self-alignment. Undoing both is what lets `align` mean
    // anything at all — without it every popover sits in the middle of the
    // viewport with the anchor styles quietly applied and ignored.
    inset: 'auto',
    margin: '0',
    // Sized by its content, not by the region it sits in.
    width: 'max-content',
    maxWidth: 'max-content',
    [alongBlock ? 'justifySelf' : 'alignSelf']: placement.alignment,
  }

  if (sideOffset !== 0) styles[OFFSET_EDGE[side]] = `${sideOffset}px`
  if (avoidCollisions) styles.positionTryFallbacks = 'flip-block, flip-inline, flip-start'

  return styles as CSSProperties
}
