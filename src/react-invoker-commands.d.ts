import 'react'

/**
 * @types/react 19.2 has no invoker command props, and react-dom 19.2 doesn't
 * recognise a camelCased `commandFor` either — it warns and tells you to spell
 * the attribute in lowercase, which is what the parts do. Declaring the two
 * attributes here keeps that from needing a cast at every trigger.
 *
 * Delete this file, and rename the props, once React ships real support.
 */
declare module 'react' {
  interface ButtonHTMLAttributes<T> {
    command?: string
    commandfor?: string
  }
}
