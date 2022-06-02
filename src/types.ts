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
  [key: string]: {
    [key: string]: number
  }
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
  textUpdates?: boolean
  timeLimit: number
  userCount: number
}

export interface Session extends NewSession {
  categories: CategoriesObject
  expiration: number
  owner: string
  status: 'playing' | 'pointing' | 'winner'
  textUpdates: boolean
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
