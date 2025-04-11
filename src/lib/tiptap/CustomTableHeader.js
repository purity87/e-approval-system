// extensions/CustomTableHeader.js
import { TableHeader } from '@tiptap/extension-table-header'

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          return {
            style: attributes.style || null,
          }
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          return {
            style: attributes.backgroundColor
              ? `background-color: ${attributes.backgroundColor};`
              : null,
          }
        },
      },
    }
  },
})

export default CustomTableHeader
