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

      <BoldIcon
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ active: editor?.isActive('bold') }"
      />
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
      <button ref="buttonRef" @click="toggleOptions">📝표 삽입</button>
      <div v-if="showTableOptions" class="table-options" ref="optionsRef">
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
        <!--        <label style="font-size: 14px">
          <input v-model="withHeaderRow" type="checkbox" />
          헤더
        </label>-->
        <input
          type="color"
          v-model="selectedTableColor"
          title="배경색"
          style="width: 32px; height: 32px; padding: 0; border: none; cursor: pointer"
        />
        <button @click="insertTable">삽입</button>
        <button @click="editor.chain().focus().addRowAfter().run()">⬇️ 행 추가</button>
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
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'

// import { Bold } from '@tiptap/extension-bold'
import BoldIcon from 'vue-material-design-icons/FormatBold.vue'
import ItalicIcon from 'vue-material-design-icons/FormatItalic.vue'
import UnderlineIcon from 'vue-material-design-icons/FormatUnderline.vue'
import { FontSize } from 'tiptap-extension-font-size'
import CustomTableCell from '@/lib/tiptap/CustomTableCell'
import CustomTableHeader from '@/lib/tiptap/CustomTableHeader'

/// 이미지
import Image from '@tiptap/extension-image'

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

// 커스텀 Image 확장 (크기 조정 지원)
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '300px', // 기본 너비
        parseHTML: (element) => element.getAttribute('width') || element.style.width,
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height') || element.style.height,
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
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
    CustomTableCell, // 테이블셀 커스터마이징
    CustomTableHeader, // 테이블헤더 커스터마이징
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    GlobalDragHandle.configure({
      dragHandleWidth: 20,
      scrollThreshold: 100,
    }),
    ResizableImage.configure({
      inline: true, // 이미지를 인라인으로 삽입
      allowBase64: true, // Base64 이미지 허용
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
  },
})
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
const buttonRef = ref(null)
const optionsRef = ref(null)

const tableRows = ref(3)
const tableCols = ref(3)
// const withHeaderRow = ref(true)
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
  console.log('>>align > ', align)
  editor.chain().focus().setTextAlign(align).run()
}

const insertTable = () => {
  editor
    .chain()
    .focus()
    .insertTable({
      rows: tableRows.value,
      cols: tableCols.value,
      withHeaderRow: false, // 헤더 선 나오겠금.
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

// 표 모달창 열려 있을때 다른 곳 클릭하면 모달창 닫기 이벤트
const handleClickOutside = (event) => {
  const clickedOutside =
    buttonRef.value &&
    optionsRef.value &&
    !buttonRef.value.contains(event.target) &&
    !optionsRef.value.contains(event.target)

  if (clickedOutside) {
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
  margin-bottom: 10px;
}
.toolbar .active {
  background-color: #f0f0f0;
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

/* 에디터 높이 설정
(<style scoped>를 사용중으로 .ProseMirror는 내부에서 직접 렌더링되는 외부 DOM이라 scoped CSS의 영향을 받지 않음  :deep()이나 ::v-deep을 써야 함)
*/
::v-deep(.ProseMirror) {
  height: 400px;
  padding: 10px;
  overflow-y: auto;
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
  /*background-color: #f5f5f5;*/
  font-weight: bold;
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
