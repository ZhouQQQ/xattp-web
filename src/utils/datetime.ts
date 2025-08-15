import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function formatRelativeTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const relativeTime = formatDistanceToNow(date, { includeSeconds:true,addSuffix: true, locale: zhCN })
    return relativeTime
}
