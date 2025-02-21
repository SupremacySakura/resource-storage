const fs = require('fs')
const path = require('path')

// 判断文件是否是图片文件，支持的扩展名可以根据需求添加
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

// 递归函数，读取文件夹及其子文件夹中的图片
function readFilesInDirectory(dirPath, extNameConfig = 'all') {
    let result = []

    // 读取文件夹中的所有文件和文件夹
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath) // 获取文件或文件夹的状态信息

        if (stats.isDirectory()) {
            // 如果是文件夹，递归读取该文件夹
            result = result.concat(readFilesInDirectory(filePath, extNameConfig))
        } else if (stats.isFile()) {
            // 如果是文件，检查是否满足条件
            if (extNameConfig === 'all') {
                result.push(filePath)
            } else if (extNameConfig === 'photo') {
                const extname = path.extname(file).toLowerCase()
                if (imageExtensions.includes(extname)) {
                    result.push(filePath)  // 如果是图片，加入结果数组
                }
            } else if (extNameConfig instanceof Array) {
                const extname = path.extname(file).toLowerCase()
                if (extNameConfig.includes(extname)) {
                    result.push(filePath)  // 自定义后缀名
                }
            }
        }
    })

    return result
}
module.exports = {
    readFilesInDirectory
}

