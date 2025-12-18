export const uploadFile = async (file: File, token: string) => {
    /* ================= 获取文件 ================= */
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
            formData.append('size',file.size.toString())
            formData.append('modifiedTime',Date.now().toString())
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
    return mergeData
}

export const getFileList = async (token: string) => {
    const res = await fetch('http://localhost:3001/api/file/all', {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })
    const data = await res.json()
    return data
}