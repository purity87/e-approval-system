<template>
  <div class="editor-wrapper">
    <div class="toolbar">
      <!-- 폰트 선택 드롭다운 -->
      <select @change="setFont($event.target.value)" :disabled="!editor">
        <option value="">기본 폰트</option>
        <option value="Gungsuh">궁서체</option>
        <option value="맑은 고딕">맑은 고딕</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Georgia">Georgia</option>
        <option value="Noto Sans KR">Noto Sans KR</option>
      </select>

      <BoldIcon @click="toggleBold" :class="{ active: editor?.isActive('bold') }" />
      <ItalicIcon
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ active: editor.isActive('italic') }"
      />
      <UnderlineIcon
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ active: editor.isActive('underline') }"
      />
      <input type="color" @input="setColor" title="글자 색상" />
      <select @change="setFontSize" :value="currentFontSize">
        <option :value="'10px'" :selected="currentFontSize === '10px'">10px</option>
        <option :value="'14px'" :selected="currentFontSize === '14px'">14px</option>
        <option :value="'18px'" :selected="currentFontSize === '18px'">18px</option>
        <option :value="'24px'" :selected="currentFontSize === '24px'">24px</option>
      </select>
      <select @change="setTextAlign" :value="currentTextAlign">
        <option value="left">왼쪽</option>
        <option value="center">가운데</option>
        <option value="right">오른쪽</option>
      </select>
      <button ref="tableOptionsRef" @click="toggleOptions">📝표 삽입</button>
      <div v-if="showTableOptions" class="table-options">
        <input
          v-model.number="tableRows"
          type="number"
          min="1"
          placeholder="행"
          style="width: 60px"
        />
        <input
          v-model.number="tableCols"
          type="number"
          min="1"
          placeholder="열"
          style="width: 60px"
        />
        <label style="font-size: 14px">
          <input v-model="withHeaderRow" type="checkbox" />
          헤더
        </label>
        <input
          type="color"
          v-model="selectedTableColor"
          title="배경색"
          style="width: 32px; height: 32px; padding: 0; border: none; cursor: pointer"
        />
        <button @click="insertTable">삽입</button>

        <button
          @click="editor.chain().focus().mergeCells().run()"
          :disabled="!editor.can().mergeCells()"
        >
          셀 병합
        </button>
        <button
          @click="editor.chain().focus().deleteTable().run()"
          :disabled="!editor.can().deleteTable()"
        >
          표 삭제
        </button>
      </div>
    </div>
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed, defineExpose, onMounted } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'

// import { Bold } from '@tiptap/extension-bold'
import BoldIcon from 'vue-material-design-icons/FormatBold.vue'
import ItalicIcon from 'vue-material-design-icons/FormatItalic.vue'
import UnderlineIcon from 'vue-material-design-icons/FormatUnderline.vue'
import { FontSize } from 'tiptap-extension-font-size'
import CustomTableCell from '@/lib/tiptap/CustomTableCell'

// HTML에서 스타일과 콘텐츠를 파싱하는 함수
const parseContentFromHTML = (html) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const table = doc.querySelector('table')
  const content = []

  const extractStyles = (element) => {
    const style = element.getAttribute('style') || ''
    const fontSizeMatch = style.match(/font-size:\s*([^;]+)/i)
    const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/i)
    const backgroundColorMatch = style.match(/background-color:\s*([^;]+)/i)

    const marks = []
    if (fontSizeMatch)
      marks.push({ type: 'textStyle', attrs: { fontSize: fontSizeMatch[1].trim() } })
    if (fontFamilyMatch)
      marks.push({ type: 'textStyle', attrs: { fontFamily: fontFamilyMatch[1].trim() } })
    if (element.style.fontWeight === 'bold' || element.querySelector('b'))
      marks.push({ type: 'bold' })
    if (element.style.fontStyle === 'italic' || element.querySelector('i'))
      marks.push({ type: 'italic' })
    if (element.style.textDecoration === 'underline' || element.querySelector('u'))
      marks.push({ type: 'underline' })
    if (element.style.color) marks.push({ type: 'color', attrs: { color: element.style.color } })

    const attrs = {}
    if (backgroundColorMatch) attrs.backgroundColor = backgroundColorMatch[1].trim()

    return { marks, attrs }
  }

  if (table) {
    const rows = Array.from(table.querySelectorAll('tr')).map((row) => {
      const cells = Array.from(row.querySelectorAll('td, th')).map((cell) => {
        const { marks, attrs } = extractStyles(cell)
        return {
          type: cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell',
          attrs,
          content: [
            {
              type: 'paragraph',
              content: cell.textContent.trim()
                ? [{ type: 'text', text: cell.textContent.trim(), marks }]
                : [],
            },
          ],
        }
      })
      return { type: 'tableRow', content: cells }
    })
    content.push({ type: 'table', content: rows, attrs: { resizable: true } })
  } else {
    const nodes = Array.from(doc.body.childNodes).filter(
      (node) => node.nodeName === 'P' || node.nodeType === 3 || node.nodeName === 'SPAN',
    )
    nodes.forEach((node) => {
      const { marks, attrs } = extractStyles(node)
      const textContent = node.textContent.trim()
      if (textContent) {
        content.push({
          type: 'paragraph',
          attrs,
          content: [{ type: 'text', text: textContent, marks }],
        })
      }
    })
  }

  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] }
}

// 커스텀 TextStyle 확장 (fontFamily 지원)
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily.replace(/['"]/g, ''),
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {}
          return {
            style: `font-family: ${attributes.fontFamily}`,
          }
        },
      },
    }
  },
})

// 에디터와 현재 폰트 상태 정의
const currentFont = ref('')

const editor = new Editor({
  content: '',
  extensions: [
    StarterKit.configure({
      bold: {},
      italic: {},
      underline: {},
    }),
    FontSize,
    CustomTextStyle, // 글씨체 수정 지원
    Underline,
    Color,
    CustomTableCell, // ← 위에서 만든 확장
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    GlobalDragHandle.configure({
      dragHandleWidth: 20,
      scrollThreshold: 100,
    }),
  ],
  editorProps: {
    transformPastedHTML: (html) => {
      // 그냥 복붙한 HTML 그대로
      return html
    },
    attributes: {
      style: 'font-family: sans-serif;', // 기본 폰트 설정
    },
    onUpdate: () => {
      // 새로 입력하는 텍스트에도 현재 폰트 적용
      if (currentFont.value) {
        editor.chain().setMark('textStyle', { fontFamily: currentFont.value }).run()
      }
    },
    handlePaste(view, event) {
      const html = event.clipboardData.getData('text/html')
      const text = event.clipboardData.getData('text/plain')

      if (html) {
        // HTML 내용이 있으면 parsing 후 삽입
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // 필요한 내용만 추출: <table>과 일반 텍스트 포함
        const body = doc.body

        // body가 존재하면 그대로 innerHTML로 처리
        editor.commands.insertContent(body.innerHTML)
        return true
      }

      if (text) {
        // 일반 텍스트는 줄바꿈 기준으로 <p>로 나눠서 삽입
        const paragraphs = text.split('\n').map((line) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: line }],
        }))
        editor.commands.insertContent(paragraphs)
        return true
      }

      return false
    },
    handleDrop: (view, event) => {
      const text = event.dataTransfer.getData('text/plain')
      const html = event.dataTransfer.getData('text/html')
      const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
      if (!pos) return

      if (html) {
        const parsedContent = parseContentFromHTML(html)
        editor.commands.insertContentAt(pos.pos, parsedContent)
        return true
      } else if (text) {
        editor.commands.insertContentAt(pos.pos, {
          type: 'paragraph',
          content: [{ type: 'text', text }],
        })
        return true
      }
    },
  },
})
// 굵게 토글 함수
const toggleBold = () => {
  if (!editor) {
    console.error('Editor is not initialized yet')
    return
  }
  editor.chain().focus().toggleBold().run()
  console.log('Bold toggled:', editor.isActive('bold')) // 디버깅용
}
// 폰트 설정 함수
const setFont = (font) => {
  if (!editor) {
    console.error('Editor is not initialized yet')
    return
  }
  currentFont.value = font
  if (font) {
    editor.chain().focus().setMark('textStyle', { fontFamily: font }).run()
  } else {
    editor.chain().focus().unsetMark('textStyle').run()
  }
}
// 현재 선택된 스타일 추적
const currentFontSize = computed(() => {
  const { fontSize } = editor.getAttributes('textStyle')
  return fontSize || '14px' // 기본값
})

const currentTextAlign = computed(() => {
  const { textAlign } = editor.getAttributes('paragraph') || editor.getAttributes('heading')
  return textAlign || 'left' // 기본값
})

// 표 삽입 옵션
const showTableOptions = ref(false)
const tableOptionsRef = ref(null)

const tableRows = ref(3)
const tableCols = ref(3)
const withHeaderRow = ref(true)
const selectedTableColor = ref('#f6f6f6')

const setColor = (e) => {
  editor.chain().focus().setColor(e.target.value).run()
}

const setFontSize = (e) => {
  const size = e.target.value

  if (editor.isActive('textStyle')) {
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
  } else {
    editor.chain().focus().toggleMark('textStyle', { fontSize: size }).run()
  }
  editor.chain().focus().selectAll().setMark('textStyle', { fontSize: size }).run()
}

const setTextAlign = (e) => {
  const align = e.target.value
  editor.chain().focus().setTextAlign(align).run()
}

const insertTable = () => {
  editor
    .chain()
    .focus()
    .insertTable({
      rows: tableRows.value,
      cols: tableCols.value,
      withHeaderRow: withHeaderRow.value,
    })
    .command(({ tr }) => {
      // 표 전체 셀 색상 초기 설정
      tr.doc.descendants((node, pos) => {
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            backgroundColor: selectedTableColor.value,
          })
        }
      })
      editor.view.dispatch(tr)
      return true
    })
    .run()
  showTableOptions.value = false
}
const toggleOptions = () => {
  showTableOptions.value = !showTableOptions.value
}

// 부모에서 editor.getHTML()을 쓸 수 있도록 메서드 노출
defineExpose({
  getEditorHTML: () => editor.getHTML(),
})

const handleClickOutside = (event) => {
  if (tableOptionsRef?.value && !tableOptionsRef.value.contains(event.target)) {
    showTableOptions.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  editor.destroy()
})
</script>

<style scoped>
/* 웹 폰트로 Gungsuh 추가 */
@font-face {
  font-family: 'Gungsuh';
  src: url('https://cdn.jsdelivr.net/npm/font-kopub@0.0.2/fonts/KoPubWorldBatangMedium.woff2')
    format('woff2');
}

.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 0px;
}
.toolbar .active {
  padding: 2px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
}

.toolbar svg {
  width: 10px;
  height: 10px;
  cursor: pointer;
  fill: #555;
}

.toolbar svg.active {
  fill: #2a5d9f;
}
.ProseMirror {
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 200px;
  outline: none;
}
.ProseMirror {
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 200px;
  outline: none;
}

.ProseMirror strong {
  font-weight: bold !important; /* 굵게 스타일 강제 적용 */
}

.ProseMirror table {
  border-collapse: collapse;
  width: 100%;
}

.ProseMirror th,
.ProseMirror td {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: left;
}

.ProseMirror th {
  background-color: #f0f0f0;
}
.table-options {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.editor-content {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.editor-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}
.editor-content :deep(strong) {
  font-weight: bold;
}

.editor-content :deep(th),
.editor-content :deep(td) {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
  position: relative;
}

.editor-content :deep(th) {
  background-color: #f5f5f5;
  /*font-weight: bold;*/
}

.drag-handle {
  width: 20px;
  height: 20px;
  background: #ccc;
  cursor: grab;
  position: absolute;
  left: -25px;
}
</style>
