import type { ImageInputRef, InputImageRole } from '@prompt-optimizer/core'

import { hashString, hashVariables } from './prompt-variables'

type VariantFingerprintParams = {
  selection: string | number
  resolvedVersion: number
  modelKey: string
  prompt: string
  variables: Record<string, string>
  inputImages: ImageInputRef[]
}

const getSingleImageSignature = (image: ImageInputRef, index: number): string => {
  const b64 = (image.b64 || '').trim()
  const mimeType = image.mimeType || 'image/png'

  if (!b64) {
    return `${index}:empty:${mimeType}`
  }

  const head = b64.slice(0, 96)
  const tail = b64.slice(-96)
  const sig = hashString(`${head}:${tail}`)
  return `${index}:b64:${b64.length}:${sig}:${mimeType}`
}

export const getMultiImageSignature = (inputImages: ImageInputRef[]): string => {
  if (!Array.isArray(inputImages) || inputImages.length === 0) {
    return 'noimg'
  }

  return inputImages
    .map((image, index) => getSingleImageSignature(image, index))
    .join('|')
}

export const buildMultiImageVariantFingerprint = ({
  selection,
  resolvedVersion,
  modelKey,
  prompt,
  variables,
  inputImages,
}: VariantFingerprintParams): string => {
  const promptHash = hashString((prompt || '').trim())
  const varsHash = hashVariables(variables || {})
  const imageSignature = getMultiImageSignature(inputImages || [])

  return `${String(selection)}:${resolvedVersion}:${modelKey}:${promptHash}:${varsHash}:${imageSignature}`
}

/**
 * Plain-language note telling the image model what each tagged input image is
 * for. Image models only see "Image N" positions, so without this a role picked
 * in the UI would never reach generation unless the prompt repeated it.
 */
export const buildImageRoleNote = (roles: Array<InputImageRole | null | undefined>): string =>
  roles
    .flatMap((role, index) => {
      const label = `Image ${index + 1}`
      if (role === 'character') {
        return [`${label} is the character reference: keep the same character identity (face, hairstyle, body shape, outfit and distinctive features).`]
      }
      if (role === 'scene') {
        return [`${label} is the scene reference: use its environment, layout, lighting and atmosphere as the setting.`]
      }
      return []
    })
    .join(' ')

export const applyImageRoleNote = (
  prompt: string,
  roles: Array<InputImageRole | null | undefined>,
): string => {
  const note = buildImageRoleNote(roles)
  return note ? `${note}\n\n${prompt}` : prompt
}
