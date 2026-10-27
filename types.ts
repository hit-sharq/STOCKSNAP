export type Status = 'Running' | 'Needs you' | 'Done'

export type ItemType = {
  id: string
  name: string
  unit: string
  category: string
  quantity: number
  expectedQuantity: number
  condition: 'A' | 'B' | 'C'
  unitPriceKes: number
  confidence: number
  confirmed: boolean
  suggestedAction: string
  actionReason: string
  colorHex: string
}

export type RecentScan = {
  id: string
  title: string
  itemCount: number
  totalValueKes: number
  date: string
  status: Status
}
