<script setup lang="ts">
import { ref } from 'vue'

const fileInput = ref<HTMLInputElement>()

const uploadFile = async () => {
  /* ================= 登录 ================= */
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: '123456',
    }),
  })

  const loginData = await loginRes.json()
  console.log(loginData)

  if (!loginData.success) return

  const token = loginData.data

  /* ================= 获取文件 ================= */
  if (!fileInput.value) return

  const file = fileInput.value.files?.[0]
  if (!file) return

  /* ================= 初始化上传 ================= */
  const chunkSize = 1024 * 1024 // 1MB
  const chunkCount = Math.ceil(file.size / chunkSize)
  const fileHash = file.name

  const initRes = await fetch('http://localhost:3001/api/file/init-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileHash }),
  })

  const initData = await initRes.json()
  console.log(initData)

  /* ================= 上传分片 ================= */
  if (initData.data === 'all') {
    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('name', file.name)
      formData.append('hash', file.name)
      formData.append('chunkCount', chunkCount.toString())
      formData.append('chunkIndex', i.toString())
      formData.append('chunkHash', chunk.toString())
      formData.append('file', chunk)

      const uploadRes = await fetch(
        'http://localhost:3001/api/file/upload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const uploadData = await uploadRes.json()
      console.log(uploadData)
    }
  }

  /* ================= 合并分片 ================= */
  const mergeRes = await fetch('http://localhost:3001/api/file/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileHash }),
  })

  const mergeData = await mergeRes.json()
  console.log(mergeData)
}

</script>

<template>
  <div>
    <h1>Resource Storage</h1>
    <div>
      <input type="file" id="file-input" ref="fileInput">
      <button @click="uploadFile">上传文件</button>
    </div>
  </div>
</template>

<style scoped></style>
