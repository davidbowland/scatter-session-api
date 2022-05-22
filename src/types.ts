export * from 'aws-lambda'
export { Operation as PatchOperation } from 'fast-json-patch'

export interface StringObject {
  [key: string]: any
}

export interface Categories {
  [key: number]: string
}

export interface CategoriesObject {
  [key: string]: Categories
}

export interface CategoryPoints {
  [key: number]: number
}

export interface CategoryPointsObject {
  [key: string]: CategoryPoints
}

export interface Decisions {
  points: CategoryPointsObject
  responses: CategoriesObject
}

export interface NewSession {
  expiration?: number
  rounds: number
  timeLimit: number
  userCount: number
}

export interface Session extends NewSession {
  categories: CategoriesObject
  expiration: number
  owner: string
  status: 'playing' | 'pointing' | 'winner'
  winners?: string[]
}

export interface SessionBatch {
  data: Session
  id: string
}

export type MessageType = 'PROMOTIONAL' | 'TRANSACTIONAL'

export interface SMSMessage {
  to: string
  contents: string
  messageType?: MessageType
}
