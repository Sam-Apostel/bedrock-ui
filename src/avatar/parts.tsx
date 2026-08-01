import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type ElementType,
  type SyntheticEvent,
} from 'react'
import { Slot } from '../slot'
import type { AsChildProps } from '../types'

type Status = 'idle' | 'loaded' | 'error'

interface AvatarContextValue {
  status: Status
  setStatus(status: Status): void
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

function useAvatarContext(part: string): AvatarContextValue {
  const context = useContext(AvatarContext)
  if (!context) throw new Error(`[bedrock] ${part} must be used inside Avatar.Root.`)
  return context
}

export interface AvatarProps extends ComponentPropsWithRef<'span'>, AsChildProps {}

/**
 * The one primitive here that genuinely needs JavaScript: there is no CSS or
 * markup that says "show this element only if that image failed to load".
 * `<object>` and `<picture>` both come close and neither degrades to arbitrary
 * fallback content.
 */
export function AvatarRoot({ asChild, children, ...props }: AvatarProps) {
  const [status, setStatus] = useState<Status>('idle')
  const Part: ElementType = asChild ? Slot : 'span'
  const context = useMemo(() => ({ status, setStatus }), [status])

  return (
    <AvatarContext.Provider value={context}>
      <Part {...props} data-bedrock-avatar="">
        {children}
      </Part>
    </AvatarContext.Provider>
  )
}

export interface AvatarImageProps extends ComponentPropsWithRef<'img'>, AsChildProps {}

export function AvatarImage({ asChild, onLoad, onError, ...props }: AvatarImageProps) {
  const { status, setStatus } = useAvatarContext('Avatar.Image')
  const Part: ElementType = asChild ? Slot : 'img'

  return (
    <Part
      {...props}
      // Hidden rather than unmounted while loading, so the request starts and
      // the browser's own cache and priority hints still apply.
      style={status === 'loaded' ? props.style : { ...props.style, display: 'none' }}
      onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
        setStatus('loaded')
        onLoad?.(event)
      }}
      onError={(event: SyntheticEvent<HTMLImageElement>) => {
        setStatus('error')
        onError?.(event)
      }}
      data-bedrock-avatar-image=""
    />
  )
}

export interface AvatarFallbackProps extends ComponentPropsWithRef<'span'>, AsChildProps {
  /**
   * Wait this long before showing. Stops a flash of initials on a fast
   * connection, where the image arrives in the same frame.
   */
  delayMs?: number
}

export function AvatarFallback({ asChild, delayMs = 0, ...props }: AvatarFallbackProps) {
  const { status } = useAvatarContext('Avatar.Fallback')
  const [waited, setWaited] = useState(delayMs === 0)
  const Part: ElementType = asChild ? Slot : 'span'

  useEffect(() => {
    if (delayMs === 0) return
    const timer = setTimeout(() => setWaited(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  if (status === 'loaded' || !waited) return null

  return <Part {...props} data-bedrock-avatar-fallback="" />
}
