import { decisions, session, sessionId, userId } from '../__mocks__'
import {
  deleteDecisionById,
  deleteSessionById,
  getDecisionById,
  getSessionById,
  queryUserIdsBySessionId,
  scanExpiredSessionIds,
  scanSessions,
  setDecisionById,
  setSessionById,
} from '@services/dynamodb'

const mockDeleteItem = jest.fn()
const mockGetItem = jest.fn()
const mockPutItem = jest.fn()
const mockQueryTable = jest.fn()
const mockScanTable = jest.fn()
jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn(() => ({
    deleteItem: (...args) => ({ promise: () => mockDeleteItem(...args) }),
    getItem: (...args) => ({ promise: () => mockGetItem(...args) }),
    putItem: (...args) => ({ promise: () => mockPutItem(...args) }),
    query: (...args) => ({ promise: () => mockQueryTable(...args) }),
    scan: (...args) => ({ promise: () => mockScanTable(...args) }),
  })),
}))

describe('dynamodb', () => {
  describe('deleteDecisionById', () => {
    test('expect index passed to delete', async () => {
      await deleteDecisionById(sessionId, userId)
      expect(mockDeleteItem).toHaveBeenCalledWith({
        Key: {
          SessionId: {
            S: `${sessionId}`,
          },
          UserId: {
            S: `${userId}`,
          },
        },
        TableName: 'decision-table',
      })
    })
  })

  describe('deleteSessionById', () => {
    test('expect index passed to delete', async () => {
      await deleteSessionById(sessionId)
      expect(mockDeleteItem).toHaveBeenCalledWith({
        Key: {
          SessionId: {
            S: `${sessionId}`,
          },
        },
        TableName: 'session-table',
      })
    })
  })

  describe('getDecisionById', () => {
    beforeAll(() => {
      mockGetItem.mockResolvedValue({ Item: { Data: { S: JSON.stringify(decisions) } } })
    })

    test('expect id passed to get', async () => {
      await getDecisionById(sessionId, userId)
      expect(mockGetItem).toHaveBeenCalledWith({
        Key: {
          SessionId: {
            S: `${sessionId}`,
          },
          UserId: {
            S: `${userId}`,
          },
        },
        TableName: 'decision-table',
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await getDecisionById(sessionId, userId)
      expect(result).toEqual(decisions)
    })
  })

  describe('getSessionById', () => {
    beforeAll(() => {
      mockGetItem.mockResolvedValue({ Item: { Data: { S: JSON.stringify(session) } } })
    })

    test('expect id passed to get', async () => {
      await getSessionById(sessionId)
      expect(mockGetItem).toHaveBeenCalledWith({
        Key: {
          SessionId: {
            S: `${sessionId}`,
          },
        },
        TableName: 'session-table',
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await getSessionById(sessionId)
      expect(result).toEqual(session)
    })
  })

  describe('queryUserIdsBySessionId', () => {
    beforeAll(() => {
      mockQueryTable.mockResolvedValue({
        Items: [{ UserId: { S: `${userId}` } }],
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await queryUserIdsBySessionId(sessionId)
      expect(result).toEqual([userId])
    })

    test('expect empty object with no data returned', async () => {
      mockQueryTable.mockResolvedValueOnce({ Items: [] })
      const result = await queryUserIdsBySessionId(sessionId)
      expect(result).toEqual([])
    })
  })

  describe('scanExpiredSessionIds', () => {
    beforeAll(() => {
      mockScanTable.mockResolvedValue({
        Items: [{ SessionId: { S: `${sessionId}` } }],
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await scanExpiredSessionIds()
      expect(result).toEqual([sessionId])
    })

    test('expect empty object with no data returned', async () => {
      mockScanTable.mockResolvedValueOnce({ Items: [] })
      const result = await scanExpiredSessionIds()
      expect(result).toEqual([])
    })
  })

  describe('scanSessions', () => {
    beforeAll(() => {
      mockScanTable.mockResolvedValue({
        Items: [{ Data: { S: JSON.stringify(session) }, SessionId: { S: `${sessionId}` } }],
      })
    })

    test('expect data parsed and returned', async () => {
      const result = await scanSessions()
      expect(result).toEqual([{ data: session, id: sessionId }])
    })

    test('expect empty object with no data returned', async () => {
      mockScanTable.mockResolvedValueOnce({ Items: [] })
      const result = await scanSessions()
      expect(result).toEqual([])
    })
  })

  describe('setDecisionById', () => {
    test('expect index and data passed to put', async () => {
      await setDecisionById(sessionId, userId, decisions)
      expect(mockPutItem).toHaveBeenCalledWith({
        Item: {
          Data: {
            S: JSON.stringify(decisions),
          },
          SessionId: {
            S: `${sessionId}`,
          },
          UserId: {
            S: `${userId}`,
          },
        },
        TableName: 'decision-table',
      })
    })
  })

  describe('setSessionById', () => {
    test('expect index and data passed to put', async () => {
      await setSessionById(sessionId, session)
      expect(mockPutItem).toHaveBeenCalledWith({
        Item: {
          Data: {
            S: JSON.stringify(session),
          },
          Expiration: {
            N: `${session.expiration}`,
          },
          SessionId: {
            S: `${sessionId}`,
          },
        },
        TableName: 'session-table',
      })
    })
  })
})
