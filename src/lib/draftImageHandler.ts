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

/**
 * Pending images live in the draft as base64 data URLs, which are ~33% larger
 * than the file and are serialised on every preview update and dirty check. The
 * API accepts up to 50 MB, but a file that size becomes ~67 MB of string in
 * memory, so the editor caps it well below that.
 */
export const MAX_DRAFT_IMAGE_BYTES = 5 * 1024 * 1024

export class DraftImageTooLargeError extends Error {
  constructor(bytes: number) {
    super(
      `Image is ${(bytes / 1024 / 1024).toFixed(1)} MB; the limit is ` +
        `${MAX_DRAFT_IMAGE_BYTES / 1024 / 1024} MB. Please resize it first.`,
    )
    this.name = 'DraftImageTooLargeError'
  }
}

export async function handleDraftImage(file: File): Promise<string> {
  if (file.size > MAX_DRAFT_IMAGE_BYTES) {
    throw new DraftImageTooLargeError(file.size)
  }

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
