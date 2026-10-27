export type StoredScan = { id: string; title: string; itemCount: number; totalValueKes: number; date: string; status: string; items: any[] }

const scans = new Map<string, StoredScan>()
const items = new Map<string, any[]>()

export function getScans() { return Array.from(scans.values()) }
export function getScan(id: string) { return scans.get(id) }
export function setScan(scan: StoredScan) { scans.set(scan.id, scan) }
export function getItems(scanId: string) { return items.get(scanId) ?? [] }
export function setItems(scanId: string, its: any[]) { items.set(scanId, its) }
