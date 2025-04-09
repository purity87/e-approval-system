// src/quill/CustomTableModule.js
import Quill from 'quill'

const Module = Quill.import('core/module')

class CustomTableModule extends Module {
  constructor(quill, options) {
    super(quill, options)
    this.quill = quill
  }

  // 테이블 삽입
  insertTable(rows, cols) {
    const range = this.quill.getSelection(true)
    if (!range) return

    let tableHtml = '<table border="1">'
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>'
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td><br></td>' // 빈 셀에 <br> 추가로 커서 이동 용이
      }
      tableHtml += '</tr>'
    }
    tableHtml += '</table>'
    this.quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml)
  }

  // 행 추가
  addRowBelow() {
    const range = this.quill.getSelection(true)
    if (!range) return

    const table = this.getTable(range)
    if (table) {
      const rowIndex = this.getRowIndex(range, table)
      const newRow = table.rows[rowIndex].cloneNode(true)
      table.rows[rowIndex].parentNode.insertBefore(newRow, table.rows[rowIndex].nextSibling)
      this.quill.updateContents(new Quill.import('delta')) // 에디터 업데이트
    }
  }

  // 열 추가
  addColumnRight() {
    const range = this.quill.getSelection(true)
    if (!range) return

    const table = this.getTable(range)
    if (table) {
      const colIndex = this.getColumnIndex(range, table)
      Array.from(table.rows).forEach((row) => {
        const newCell = row.cells[colIndex].cloneNode(true)
        row.cells[colIndex].parentNode.insertBefore(newCell, row.cells[colIndex].nextSibling)
      })
      this.quill.updateContents(new Quill.import('delta'))
    }
  }

  // 현재 커서 위치에서 테이블 찾기
  getTable(range) {
    const [leaf] = this.quill.getLeaf(range.index)
    return leaf.domNode.closest('table')
  }

  // 행 인덱스 찾기
  getRowIndex(range, table) {
    const [leaf] = this.quill.getLeaf(range.index)
    const cell = leaf.domNode.closest('td')
    return Array.from(table.rows).indexOf(cell.parentNode)
  }

  // 열 인덱스 찾기
  getColumnIndex(range, table) {
    const [leaf] = this.quill.getLeaf(range.index)
    const cell = leaf.domNode.closest('td')
    return Array.from(cell.parentNode.cells).indexOf(cell)
  }
}

Quill.register('modules/custom-table', CustomTableModule)

export default CustomTableModule
