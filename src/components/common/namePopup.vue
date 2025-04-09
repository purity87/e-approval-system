<template>
  <!-- 🔽 팝업 -->
  <div v-if="showPopup" class="popup-overlay">
    <div class="popup-box">
      <h3>{{ popupTargetLabel }} 이름을 입력하세요</h3>
      <input v-model="newName" placeholder="이름을 입력하세요" maxlength="4" class="name-input" />
      <div class="popup-buttons">
        <button class="btn-confirm" @click="addNameToTarget">추가</button>
        <button class="btn-cancel" @click="closePopup">취소</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const recipients = ref<string[]>([])
const executors = ref<string[]>([])

const showPopup = ref(false)
const popupTarget = ref<'recipients' | 'executors'>()
const popupTargetLabel = ref('수신자')
const newName = ref('')

function openPopup(target: 'recipients' | 'executors') {
  popupTarget.value = target
  popupTargetLabel.value = target === 'recipients' ? '수신자' : '시행자'
  newName.value = ''
  showPopup.value = true
}

function addNameToTarget() {
  if (!newName.value.trim()) return

  if (popupTarget.value === 'recipients') {
    recipients.value.push(newName.value)
  } else if (popupTarget.value === 'executors') {
    executors.value.push(newName.value)
  }

  closePopup()
}

function closePopup() {
  showPopup.value = false
}
</script>

<style scoped></style>
