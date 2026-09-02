import { AspectRatio, Avatar, Progress, ScrollArea, Separator } from '../../src/index'

/**
 * The primitives that are markup and nothing else. Each renders one element
 * with the right semantics — `<progress>`, `<hr>`, an `<img>` with a fallback
 * sibling — and between them they cost close to nothing, because there is
 * almost no code to ship.
 */
export default function DisplayDemo() {
  return (
    <div style={{ width: '100%' }}>
      <div className="demo-row">
        <Avatar.Root>
          <Avatar.Image src="/does-not-exist.png" alt="Ada Lovelace" />
          <Avatar.Fallback>AL</Avatar.Fallback>
        </Avatar.Root>
        <span>Fallback, because that image 404s.</span>
      </div>

      <div className="demo-row">
        <Progress.Root value={62} max={100} />
        <span>62%</span>
      </div>

      <div className="demo-row">
        <span>Left</span>
        <Separator.Root orientation="vertical" style={{ height: '1rem' }} />
        <span>Right</span>
      </div>

      <AspectRatio.Root ratio={16 / 9} style={{ background: 'var(--sunk)', maxWidth: '18rem' }}>
        <div style={{ padding: '.5rem' }}>16 / 9</div>
      </AspectRatio.Root>

      <ScrollArea.Root style={{ height: 90, width: '100%', maxWidth: '18rem', marginTop: '1rem' }}>
        <ScrollArea.Viewport>
          <div style={{ height: 400, padding: '.5rem' }}>
            Native overflow, scrolled by the browser — keyboard, wheel, trackpad momentum and the OS
            scrollbar preference all included.
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar />
      </ScrollArea.Root>
    </div>
  )
}
