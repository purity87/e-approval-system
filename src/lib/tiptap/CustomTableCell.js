// extensions/CustomTableCell.js
import { TableCell } from '@tiptap/extension-table-cell'

export const CustomTableCell = TableCell.extend({
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

export default CustomTableCell
