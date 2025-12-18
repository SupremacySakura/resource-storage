<script lang="ts" setup>
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, type UploadInstance, type UploadUserFile } from 'element-plus'
import { useUserStore } from '../stores/user'
import { uploadFile } from '../services/apis/files'

const userStore = useUserStore()
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)

const handleExceed = (files: File[]) => {
    uploadRef.value!.clearFiles()
    const file = files[0] as any
    file.uid = Date.now()
    uploadRef.value!.handleStart(file)
}

const submitUpload = async () => {
    if (fileList.value.length === 0) {
        ElMessage.warning('Please select a file first.')
        return
    }

    const file = (fileList.value[0] as any).raw
    if (!file) return

    uploading.value = true
    try {
        const res = await uploadFile(file, userStore.token)
        if (res.success === true) {
            ElMessage.success(res.message)
            fileList.value = []
        } else {
            ElMessage.error(res.message)
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('Upload failed.')
    } finally {
        uploading.value = false
    }
}
</script>

<template>
    <div class="upload-container">
        <el-card class="upload-card">
            <template #header>
                <div class="card-header">
                    <span>File Upload</span>
                </div>
            </template>

            <el-upload ref="uploadRef" class="upload-demo" drag action="#" :auto-upload="false"
                v-model:file-list="fileList" :limit="1" :on-exceed="handleExceed">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                    Drop file here or <em>click to upload</em>
                </div>
                <template #tip>
                    <div class="el-upload__tip">
                        Support for large file upload with chunking
                    </div>
                </template>
            </el-upload>

            <div class="actions">
                <el-button type="primary" @click="submitUpload" :loading="uploading">
                    Start Upload
                </el-button>
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.upload-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.upload-card {
    width: 100%;
}

.actions {
    margin-top: 20px;
    text-align: right;
}
</style>
