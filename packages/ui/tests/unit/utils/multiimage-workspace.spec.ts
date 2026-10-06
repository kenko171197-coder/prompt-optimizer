import { describe, expect, it } from 'vitest'

import {
  applyImageRoleNote,
  buildMultiImageVariantFingerprint,
  getMultiImageSignature,
} from '../../../src/utils/multiimage-workspace'

describe('multiimage workspace utilities', () => {
  const inputImages = [
    { b64: 'AAAA1111BBBB2222', mimeType: 'image/png' },
    { b64: 'CCCC3333DDDD4444', mimeType: 'image/jpeg' },
  ]

  it('changes the image signature when the input image order changes', () => {
    const forward = getMultiImageSignature(inputImages)
    const reversed = getMultiImageSignature(inputImages.slice().reverse())

    expect(forward).not.toBe(reversed)
  })

  it('includes prompt, variables, model, version selection and ordered image signature in the fingerprint', () => {
    const base = buildMultiImageVariantFingerprint({
      selection: 'workspace',
      resolvedVersion: -1,
      modelKey: 'imagen-4',
      prompt: '把图1的人物放到图2的城市里',
      variables: { subject: '图1的人物', scene: '图2的城市' },
      inputImages,
    })

    const changedPrompt = buildMultiImageVariantFingerprint({
      selection: 'workspace',
      resolvedVersion: -1,
      modelKey: 'imagen-4',
      prompt: '把图1的人物放到图2的森林里',
      variables: { subject: '图1的人物', scene: '图2的城市' },
      inputImages,
    })

    const changedVariables = buildMultiImageVariantFingerprint({
      selection: 'workspace',
      resolvedVersion: -1,
      modelKey: 'imagen-4',
      prompt: '把图1的人物放到图2的城市里',
      variables: { subject: '图1的人物', scene: '图2的森林' },
      inputImages,
    })

    const changedOrder = buildMultiImageVariantFingerprint({
      selection: 'workspace',
      resolvedVersion: -1,
      modelKey: 'imagen-4',
      prompt: '把图1的人物放到图2的城市里',
      variables: { subject: '图1的人物', scene: '图2的城市' },
      inputImages: inputImages.slice().reverse(),
    })

    expect(base).not.toBe(changedPrompt)
    expect(base).not.toBe(changedVariables)
    expect(base).not.toBe(changedOrder)
    expect(base).toContain('workspace')
    expect(base).toContain('imagen-4')
  })
})

describe('multiimage image role note', () => {
  it('prepends a note describing tagged character and scene images', () => {
    const prompt = applyImageRoleNote('Make them wave', ['scene', null, 'character'])

    expect(prompt).toBe(
      'Image 1 is the scene reference: use its environment, layout, lighting and atmosphere as the setting. '
        + 'Image 3 is the character reference: keep the same character identity (face, hairstyle, body shape, outfit and distinctive features).'
        + '\n\nMake them wave',
    )
  })

  it('leaves the prompt unchanged when no role is assigned', () => {
    expect(applyImageRoleNote('Make them wave', [null, null])).toBe('Make them wave')
  })
})
