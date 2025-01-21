/**
 * @description: 循环生成svg logo
 * @author: filway
 */

import { svgToBase64, getLayoutPropsByNameLength } from '@/helper'
import store from '@/store'
import { TemplateProps } from '@/store/templates'
import { SVG } from '@svgdotjs/svg.js'
import { randomFamily } from '../constants/random.constant'

// 直接给定属性生成
type givenSvgProps = Pick<
  Required<TemplateProps>,
  'randomIndex' | 'randomTitleFamily' | 'randomSubTitleFamily'
>

const useCreateLogo = async (
  data: TemplateProps[],
  isRandom = true,
  givenProps: givenSvgProps = {
    randomIndex: 0,
    randomTitleFamily: '',
    randomSubTitleFamily: '',
  }
): Promise<void> => {
  data.forEach((item, key) => {
    const rgb = `${item.main_color}`
    let randonI, titleFamily, subTitleFamily
    let trueMaterialPath = item.materialPath
    trueMaterialPath = svgToBase64(item.svg)
    const trueNameColor = rgb
    const trueSloganColor = rgb
    if (item.name.length === 0) {
      // 中英文都没有
      item.len = 0
    }
    const layoutProps = getLayoutPropsByNameLength(item.len, item.randomIndex)
    const {
      imageX,
      imageY,
      nameDX,
      nameDY,
      nameEnDX,
      nameEnDY,
      nameFontSize,
      nameEnFontSize,
    } = layoutProps
    if (isRandom) {
      randonI = item.randomIndex
      // 横版字体取font_l，竖版字体取font_v
      if (randonI === 0) {
        titleFamily = item.font_l
        subTitleFamily = item.font_l
      } else if (randonI === 1) {
        titleFamily = item.font_v
        subTitleFamily = item.font_v
      } else {
        titleFamily = randomFamily[randonI]
        subTitleFamily = randomFamily[randonI]
      }
      if (givenProps.randomSubTitleFamily.length > 0) {
        randonI = givenProps.randomIndex
        titleFamily = givenProps.randomTitleFamily
        subTitleFamily = givenProps.randomSubTitleFamily
      }
      store.commit('setRandomProps', {
        materialId: item.materialId,
        randomIndex: randonI,
        randomTitleFamily: titleFamily,
        randomSubTitleFamily: subTitleFamily,
      })
    } else {
      //直接取对应属性
      randonI = item.randomIndex || 0
      titleFamily = item.randomTitleFamily || ''
      subTitleFamily = item.randomSubTitleFamily || ''
    }

    const draw = SVG()
    draw.addTo(`.svg${key}`)

    const group = draw.group().fill('dodgerblue').attr({
      transform: 'matrix(1,0,0,1,160,40) ',
    })
    const groupImage = draw
      .group()
      .fill('dodgerblue')
      .attr({
        transform: 'matrix(1,0,0,1,' + imageX + ',' + imageY + ') ',
        class: `svg-logo${key}`,
      })
    const img = draw.image(trueMaterialPath)
    //debugger
    const title = draw
      .plain(item.name)
      .font({
        size: nameFontSize,
        family: titleFamily,
        weight: 'bolder',
      })
      .attr({
        fill: `#000000`,
        dx: nameDX,
        dy: nameDY,
        'text-anchor': 'middle',
        class: `svg-name${key}`,
      })
    const subTitle = draw
      .plain(item.name_en)
      .font({
        size: nameEnFontSize,
        family: subTitleFamily,
        weight: 'bolder',
      })
      .attr({
        fill: '#000000',
        dx: nameEnDX,
        dy: nameEnDY,
        'text-anchor': 'middle',
        class: `svg-slogan${key}`,
      })
    groupImage.add(img)
    group.add(title)
    group.add(subTitle)
    if (item.len === 0) {
      img.size(160, 160)
    } else {
      img.size(130, 130)
    }
  })
}
export default useCreateLogo
