import { describe, expect, it } from 'vitest'

import { TemplateProcessor, type TemplateContext } from '../../../src/services/template/processor'
import { template as image2imageOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/image2image-optimize'
import { template as designTextEditOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/image2image/design-text-edit-optimize'
import { template as image2imageJsonZh } from '../../../src/services/template/default-templates/image-optimize/image2image/json-structured-optimize'
import { template as multiimageOptimizeZh } from '../../../src/services/template/default-templates/image-optimize/multiimage/multiimage-optimize'
import { template as multiimageOptimizeEn } from '../../../src/services/template/default-templates/image-optimize/multiimage/multiimage-optimize_en'

describe('image multimodal optimize template contracts', () => {
  const context: TemplateContext = {
    originalPrompt: '保留图1中的人物，把他融合到图2的海边场景中',
    hasInputImages: true,
    inputImageCount: 2,
    inputImagesJson: '[{"index":1,"label":"图1","mimeType":"image/png"},{"index":2,"label":"图2","mimeType":"image/jpeg"}]',
  }

  it.each([
    ['image2image-general-zh', image2imageOptimizeZh],
    ['image2image-design-text-zh', designTextEditOptimizeZh],
    ['image2image-json-zh', image2imageJsonZh],
  ])('declares attached image semantics for %s', (_label, template) => {
    const messages = TemplateProcessor.processTemplate(template, context)
    const combined = messages.map((message) => message.content).join('\n')

    expect(combined).toContain('图片')
    expect(combined).not.toContain('"b64"')
    expect(combined).not.toContain('{{inputImagesJson}}')
  })

  it('declares numbered attached image semantics for multiimage template', () => {
    const messages = TemplateProcessor.processTemplate(multiimageOptimizeZh, context)
    const combined = messages.map((message) => message.content).join('\n')

    expect(combined).toContain('图1')
    expect(combined).toContain('图2')
    expect(combined).toContain('图片')
    expect(combined).not.toContain('"b64"')
    expect(combined).not.toContain('{{inputImagesJson}}')
  })
})

describe('multiimage template reference roles', () => {
  const baseContext: TemplateContext = {
    originalPrompt: 'Put the character into the scene',
    hasInputImages: true,
    inputImageCount: 2,
    inputImagesJson: '[]',
  }

  const render = (template: typeof multiimageOptimizeZh, context: TemplateContext) =>
    TemplateProcessor.processTemplate(template, context).map((message) => message.content).join('\n')

  it('renders assigned character and scene roles', () => {
    const context: TemplateContext = {
      ...baseContext,
      hasInputImageRoles: true,
      inputImageRoles: [
        { index: 1, role: 'character', isCharacter: true, isScene: false },
        { index: 2, role: 'scene', isCharacter: false, isScene: true },
      ],
    }

    const en = render(multiimageOptimizeEn, context)
    expect(en).toContain('- Image 1: character reference.')
    expect(en).toContain('- Image 2: scene reference.')

    const zh = render(multiimageOptimizeZh, context)
    expect(zh).toContain('- 图1：人物参考')
    expect(zh).toContain('- 图2：场景参考')
  })

  it('omits the roles section when no role is assigned', () => {
    const context: TemplateContext = { ...baseContext, hasInputImageRoles: false, inputImageRoles: [] }

    expect(render(multiimageOptimizeEn, context)).not.toContain('Reference roles')
    expect(render(multiimageOptimizeZh, context)).not.toContain('参考用途')
  })
})
