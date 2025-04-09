// src/extensions/DraggableParagraph.ts
import Paragraph from '@tiptap/extension-paragraph'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'

export default Paragraph.extend({
  draggable: true,

  addNodeView() {
    return ({ editor, node, getPos }) => {
      return {
        dom: document.createElement('div'),
        contentDOM: document.createElement('div'),

        mount() {
          this.dom.classList.add('draggable-paragraph')
          this.dom.setAttribute('draggable', 'true')

          this.dom.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('application/x-block-pos', getPos().toString())
          })

          this.dom.addEventListener('drop', (e) => {
            e.preventDefault()
            const draggedPos = parseInt(
              e.dataTransfer?.getData('application/x-block-pos') || '-1',
              10,
            )
            if (draggedPos >= 0) {
              const content = editor.state.doc.content.child(draggedPos)
              const tr = editor.state.tr
              tr.delete(draggedPos, draggedPos + content.nodeSize)
              tr.insert(getPos(), content)
              editor.view.dispatch(tr)
            }
          })

          this.dom.addEventListener('dragover', (e) => {
            e.preventDefault()
          })

          this.dom.appendChild(this.contentDOM)
        },

        destroy() {
          this.dom.remove()
        },
      }
    }
  },
})
