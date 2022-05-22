import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import { decisions, session, sessionId, userId } from '../__mocks__'
import { APIGatewayProxyEventV2 } from '@types'
import eventJson from '@events/get-by-id.json'
import { getByIdHandler } from '@handlers/get-by-id'
import status from '@utils/status'

jest.mock('@services/dynamodb')
jest.mock('@utils/logging')

describe('get-by-id', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  beforeAll(() => {
    mocked(dynamodb).getDecisionById.mockResolvedValue(decisions)
    mocked(dynamodb).getSessionById.mockResolvedValue(session)
    mocked(dynamodb).queryUserIdsBySessionId.mockResolvedValue([userId])
  })

  describe('getByIdHandler', () => {
    test('expect NOT_FOUND on getSessionById reject', async () => {
      mocked(dynamodb).getSessionById.mockRejectedValueOnce(undefined)
      const result = await getByIdHandler(event)
      expect(result).toEqual(expect.objectContaining(status.NOT_FOUND))
    })

    test('expect getDecisionById to be called once for each user ID', async () => {
      const userId2 = '+19992345678'
      mocked(dynamodb).queryUserIdsBySessionId.mockResolvedValue([userId, userId2])
      await getByIdHandler(event)
      expect(mocked(dynamodb).getDecisionById).toHaveBeenCalledWith(sessionId, userId)
      expect(mocked(dynamodb).getDecisionById).toHaveBeenCalledWith(sessionId, userId2)
    })

    test('expect OK when id exists', async () => {
      const decisions = {
        '+15551234567': { points: {}, responses: { P: { '1': 'Plenty' } } },
        '+19992345678': { points: {}, responses: { P: { '1': 'Plenty' } } },
      }
      const result = await getByIdHandler(event)
      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ ...session, decisions, sessionId }) })
    })
  })
})
