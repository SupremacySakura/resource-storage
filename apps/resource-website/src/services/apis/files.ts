import { calculateHash } from '../../utils/hash'

export const uploadFile = async (file: File, token: string) => {
    /* ================= 获取文件 ================= */
    if (!file) return

    /* ================= 初始化上传 ================= */
    const chunkSize = 1024 * 1024 // 1MB
    const chunkCount = Math.ceil(file.size / chunkSize)

    // Calculate SHA-256 hash of the file content
    const fileHash = await calculateHash(file)

    const initRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/init-upload`, {
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
            formData.append('hash', fileHash)
            formData.append('chunkCount', chunkCount.toString())
            formData.append('chunkIndex', i.toString())
            formData.append('chunkHash', await calculateHash(chunk))
            formData.append('size', file.size.toString())
            formData.append('modifiedTime', Date.now().toString())
            formData.append('file', chunk)


            const uploadRes = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/api/file/upload`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            )

            await uploadRes.json()
        }
    }

    /* ================= 合并分片 ================= */
    const mergeRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/merge`, {
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
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/all`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })
    const data = await res.json()
    return data
}

export const updateFilePermission = async (fileHash: string, role: 'public' | 'key', token: string) => {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/update-permission`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileHash, role }),
    })
    const data = await res.json()
    return data
}

export const generateKey = async (fileHash: string, token: string) => {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/generate-key`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileHash }),
    })
    const data = await res.json()
    return data
}

export const deleteFile = async (fileHash: string, token: string) => {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/file/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileHash }),
    })
    const data = await res.json()
    return data
}