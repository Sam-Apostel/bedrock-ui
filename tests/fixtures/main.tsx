import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CASES } from './cases'
// Through the module graph, not a <link>: the file lives outside vite's root.
import '../../src/bedrock.css'

const name = new URLSearchParams(location.search).get('case') ?? 'plain'
const element = CASES[name]

createRoot(document.getElementById('root')!).render(
  <StrictMode>{element ?? <p>unknown case: {name}</p>}</StrictMode>,
)
