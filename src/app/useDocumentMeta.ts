import { useEffect } from 'react';

/**
 * Sets <title> and meta description for client-side navigation.
 * The prerendered /dossier HTML gets the same values baked in at build time.
 */
export function useDocumentMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
