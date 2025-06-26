import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'readitt',
    short_name: 'readitt',
    description: 'Infinite stories',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/readitt-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}