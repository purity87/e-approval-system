<template>
  <div class="approval-wrapper">
    <div class="approval-view">
      <h2>전자결재 품의서</h2>

      <!-- ✅ 상단 정보: 테이블 형태 -->
      <table class="meta-table">
        <tbody>
          <tr>
            <th>입안일자</th>
            <td>{{ draftDate }}</td>
            <th>보존년한</th>
            <td>{{ retentionPeriod }}</td>
          </tr>
          <tr>
            <th>문서번호</th>
            <td>{{ docNumber }}</td>
            <th>입안부서</th>
            <td>{{ department }}</td>
          </tr>
          <tr>
            <th>입안자</th>
            <td colspan="3">{{ drafter }}</td>
          </tr>
          <tr>
            <th>수신자</th>
            <td colspan="3">
              <div class="horizontal-cell">
                <button class="select-btn" @click="selectRecipient">선택</button>
                <div class="tag-list">
                  <span class="tag-item" v-for="(r, index) in recipients" :key="index">
                    {{ r }}
                  </span>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <th>시행자</th>
            <td colspan="3">
              <div class="horizontal-cell">
                <button class="select-btn" @click="selectExecutor">선택</button>
                <div class="tag-list">
                  <span class="tag-item" v-for="(r, index) in executors" :key="index">
                    {{ r }}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ✅ 본문 항목 -->
      <div class="approval-section">
        <label>제목</label>
        <div class="field-box">
          <input v-model="title" type="text" class="title-input" />
        </div>
      </div>

      <div class="approval-section">
        <label>내용</label>
        <div class="editor-content">
          <VueTextEditor ref="editorRef" v-model:value="editorContent" />
          <button class="submit-btn" @click="submit">미리보기</button>
          <button class="submit-btn" @click="printPage">🖨️ 프린트</button>
          <button @click="printPage">🖨️ 프린트</button>
        </div>
        <!-- 아래는 출력용 -->
        <div
          v-html="previewHTML"
          class="preview-area"
          style="margin-top: 20px; border: 1px solid #ddd; padding: 1rem"
        />

        <!--        <EditorContent :editor="editor" class="editor-content" />-->
        <!--        <div class="field-box content-box">{{ content }}</div>-->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// import TipTap from '@/components/editor/Tiptap.vue'
// import VueTextEditor from '@/components/editor/quill/QuillEditor.vue'
import VueTextEditor from '@/components/editor/tiptap/NewTipTapEditor.vue'

const draftDate = '2025-04-08'
const retentionPeriod = '3년'
const docNumber = 'DOC-2025-0421'
const department = '서비스개발팀'
const drafter = '최정화 매니저'

const recipients = ['벨라', '젤리']
const executors = ['제이', '정화']
const title = ref('')

const editorContent = ref('')
const editorRef = ref(null)
const previewHTML = ref('')

function selectRecipient() {
  alert('수신자 선택 버튼 클릭됨')
  // 여기에 모달 호출 또는 사용자 선택 로직 연결 가능
}
function selectExecutor() {
  alert('시행자 선택 버튼 클릭됨')
  // 여기에 모달 호출 또는 사용자 선택 로직 연결 가능
}

function submit() {
  console.log('📝 작성한 내용111:', editorRef.value?.getEditorHTML())
  if (editorRef.value?.getEditorHTML) {
    previewHTML.value = editorRef.value.getEditorHTML()
  }
}
// ✅ 프린트 메서드
const printPage = () => {
  const htmlContent = editorRef.value?.getEditorHTML?.()
  if (!htmlContent) return

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Preview</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h2 {
            text-align: center;
            margin-bottom: 24px;
          }
          table { border-collapse: collapse; width: 100%;}
          td, th { border: 1px solid #000; padding: 8px; }
          .editor-output {
            margin-top: 16px;
            border: 1px solid #000;
            padding: 12px;
          }
        </style>
      </head>
      <body>
      <h2>전자결재 품의서</h2>

        <table class="meta-table">
          <tbody>
            <tr>
              <th>입안일자</th><td>${draftDate}</td>
              <th>보존년한</th><td>${retentionPeriod}</td>
            </tr>
            <tr>
              <th>문서번호</th><td>${docNumber}</td>
              <th>입안부서</th><td>${department}</td>
            </tr>
            <tr>
              <th>입안자</th><td colspan="3">${drafter}</td>
            </tr>
            <tr>
              <th>수신자</th>
              <td colspan="3">
                ${recipients.map((r) => `<span class="tag-item">${r}</span>`).join(', ')}
              </td>
            </tr>
            <tr>
              <th>시행자</th>
              <td colspan="3">
                ${executors.map((r) => `<span class="tag-item">${r}</span>`).join(', ')}
              </td>
            </tr>
            <tr>
              <th>제목</th>
              <td colspan="3">
                <strong>${title.value}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="editor-output">${htmlContent}</div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
</script>

<style scoped>
/* 전체를 화면에 가득 채우기 */
.approval-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2vw;
  background-color: #f0f2f5;
  box-sizing: border-box;
  color: #333;
  overflow-x: auto; /* 💡 전체 가로 스크롤 대응 */
}

.approval-view {
  width: 100%;
  max-width: 1200px; /* 💡 넓은 화면에서도 가로로 큼직하게 */
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  overflow-x: auto;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-size: 1.8rem;
}

/* 가로 테이블도 overflow 대응 */
.meta-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  font-size: 14px;
  color: #333;
  table-layout: fixed;
  word-break: keep-all;
  overflow-x: auto;
}

.meta-table th {
  background-color: #f6f8fa;
  text-align: left;
  padding: 8px;
  border: 1px solid #ccc;
  width: 20%;
  white-space: nowrap;
}

.meta-table td {
  background-color: #fff;
  padding: 8px;
  border: 1px solid #ccc;
  width: 30%;
}

.horizontal-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px; /* 높이 고정 느낌 */
  width: 100%;
}
.select-btn {
  padding: 6px 12px;
  background-color: #4a5974; /* 회색 섞인 남색 */
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.select-btn:hover {
  background-color: #3c475c;
}

.tag-list {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
}

.tag-item {
  border: 1px solid #ccc;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: #f9f9f9;
  font-size: 14px;
  white-space: nowrap;
}

/* 본문 항목 */
.approval-section {
  margin-bottom: 20px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 6px;
  color: #555;
}

.field-box {
  background: #fdfdfd;
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 8px;
  color: #333;
}

.title-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.submit-btn {
  border: none;
  border-radius: 7px;
  width: 100px;
  height: 35px;
  font-size: 23px;
  margin-top: 30px;
  background-color: rgb(209, 209, 209);
  color: #2c3e50;
}
.preview {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
}
/* 반응형 대응 */
@media (max-width: 1082px) {
  .approval-view {
    padding: 20px;
  }

  .meta-table th,
  .meta-table td {
    font-size: 13px;
    padding: 6px;
  }
}
</style>
