import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from '../types'
import { extractJwtFromEvent } from '../utils/events'
import { getDecisionById } from '../services/dynamodb'
import { log } from '../utils/logging'
import status from '../utils/status'

export const getDecisionsByIdHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  log('Received event', { ...event, body: undefined })
  const sessionId = event.pathParameters.sessionId
  const userId = event.pathParameters.userId

  const jwtPayload = extractJwtFromEvent(event)
  if (jwtPayload && jwtPayload.phone_number !== userId) {
    return { ...status.FORBIDDEN, body: JSON.stringify({ message: 'Invalid JWT' }) }
  }

  const result = await getDecisionById(sessionId, userId)
  return { ...status.OK, body: JSON.stringify(result) }
}
