'use client'

import dynamic from 'next/dynamic'
import { forwardRef } from "react"
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor'

// Este es el único lugar donde importamos InitializedMDXEditor directamente
const Editor = dynamic(() => import('./InitializedMDXEditor'), {
  // Aseguramos que desactivamos SSR
  ssr: false
})

// Esto es lo que será importado por otros componentes
export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />
)

// TypeScript se queja sin esta línea
ForwardRefEditor.displayName = 'ForwardRefEditor'