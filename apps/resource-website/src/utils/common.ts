/**
 * 格式化日期
 * @param value 日期字符串或时间戳
 * @returns 格式化后的日期字符串
 */
export const formatDate = (value: string | number) => {
    if (!value) return ''

    let ts = typeof value === 'string' ? Number(value.trim()) : value

    // 如果是秒级时间戳（10位），转成毫秒
    if (ts < 1e12) ts *= 1000

    const date = new Date(ts)

    return isNaN(date.getTime()) ? '' : date.toLocaleString()
}