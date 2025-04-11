// extensions/ImageWithPaste.js
import { Plugin, PluginKey } from '@tiptap/pm/state'
import Image from '@tiptap/extension-image'

export default Image.extend({
  name: 'customImageWithPaste', // 확장 이름 명시

  addProseMirrorPlugins() {
    const { editor } = this // this.editor를 명시적으로 저장

    return [
      new Plugin({
        key: new PluginKey('imagePaste'), // 플러그인 고유 키 설정
        props: {
          handlePaste(view, event) {
            const items = (event.clipboardData && event.clipboardData.items) || []
            for (const item of items) {
              if (item.type.startsWith('image/')) {
                // 이미지 타입 확인 개선
                const file = item.getAsFile()
                if (!file) return false // 파일이 없으면 처리 중단

                const reader = new FileReader()
                reader.onload = (readerEvent) => {
                  const src = readerEvent.target?.result
                  if (!src) return // 결과가 없으면 처리 중단

                  // 스키마에서 이미지 노드 생성
                  const node = editor.schema.nodes.image.create({ src })
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                }
                reader.readAsDataURL(file)
                return true // 이미지 처리 완료
              }
            }
            return false // 다른 핸들러로 전달
          },
        },
      }),
    ]
  },
})
