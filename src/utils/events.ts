import jwt from 'jsonwebtoken'

import { APIGatewayProxyEventV2, NewSession, PatchOperation, StringObject } from '../types'
import { sessionExpireHours } from '../config'

// 60 minutes * 60 seconds * 1000 milliseconds = 3_600_000
const EXPIRATION_DURATION = sessionExpireHours * 3_600_000

/* Scatter */

export const formatSession = (session: NewSession): NewSession => {
  const lastExpiration = new Date().getTime() + EXPIRATION_DURATION
  if (session.expiration !== undefined && session.expiration > lastExpiration) {
    throw new Error('expiration is outside acceptable range')
  }
  if (session.rounds === undefined || session.rounds < 1 || session.rounds > 5) {
    throw new Error('rounds must be 1 thru 5')
  }
  if (session.timeLimit === undefined || session.timeLimit < 30 || session.timeLimit > 300) {
    throw new Error('timeLimit must be 30 thru 300')
  }
  if (session.userCount === undefined || session.userCount < 2 || session.userCount > 5) {
    throw new Error('userCount must be 2 thru 5')
  }
  return {
    expiration: session.expiration ?? lastExpiration,
    rounds: session.rounds,
    timeLimit: session.timeLimit,
    userCount: session.userCount,
  }
}

/* Event */

const parseEventBody = (event: APIGatewayProxyEventV2): unknown =>
  JSON.parse(
    event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body as string)
  )

export const extractNewSessionFromEvent = (event: APIGatewayProxyEventV2): NewSession =>
  formatSession(parseEventBody(event) as NewSession)

export const extractJsonPatchFromEvent = (event: APIGatewayProxyEventV2): PatchOperation[] =>
  parseEventBody(event) as PatchOperation[]

export const extractJwtFromEvent = (event: APIGatewayProxyEventV2): StringObject =>
  jwt.decode((event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer /i, ''))
