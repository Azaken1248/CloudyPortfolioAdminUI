import { useDraftStore } from '../store/useDraftStore'

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('FileReader did not return a string'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function handleDraftImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)

  useDraftStore.getState().addPendingUpload(dataUrl, file)

  return dataUrl
}

export function isDraftImageUrl(url: string): boolean {
  return url.startsWith('data:image/')
}

export function clearPendingUploads(): void {
  const store = useDraftStore.getState()
  const pending = store.pendingUploads
  for (const [localUrl] of pending) {
    store.removePendingUpload(localUrl)
  }
}
