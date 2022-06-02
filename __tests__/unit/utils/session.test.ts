import { mocked } from 'jest-mock'

import * as dynamodb from '@services/dynamodb'
import * as queue from '@services/queue'
import { Decisions, Session } from '@types'
import { decisions, session, sessionId, userId } from '../__mocks__'
import { updateSessionStatus } from '@utils/session'

jest.mock('@services/dynamodb')
jest.mock('@services/queue')
jest.mock('@utils/logging')

describe('sessions', () => {
  const validPhoneNumber = '+18008675309'

  beforeAll(() => {
    mocked(dynamodb).getDecisionById.mockResolvedValue(decisions)
    mocked(dynamodb).queryUserIdsBySessionId.mockResolvedValue(['+15551234567', validPhoneNumber])
  })

  describe('updateSessionStatus', () => {
    describe('unchanged', () => {
      test('expect status unchanged when no users', async () => {
        mocked(dynamodb).queryUserIdsBySessionId.mockResolvedValueOnce([])
        const result = await updateSessionStatus(sessionId, session)
        expect(result).toEqual(session)
      })

      test('expect status unchanged when only one voter', async () => {
        mocked(dynamodb).queryUserIdsBySessionId.mockResolvedValueOnce([userId])
        const result = await updateSessionStatus(sessionId, session)
        expect(result).toEqual(session)
      })

      test('expect status unchanged when already winner', async () => {
        const winnerSession = { ...session, status: 'winner' } as Session
        const result = await updateSessionStatus(sessionId, winnerSession)
        expect(result).toEqual(winnerSession)
      })
    })

    describe('playing', () => {
      const playingSession = { ...session, status: 'playing' } as Session

      test('expect status unchanged when not enough responses', async () => {
        mocked(dynamodb).getDecisionById.mockResolvedValueOnce({ points: {}, responses: {} })
        const result = await updateSessionStatus(sessionId, playingSession)
        expect(result).toEqual(playingSession)
      })

      test('expect status changed when enough responses', async () => {
        const result = await updateSessionStatus(sessionId, playingSession)
        expect(result).toEqual(expect.objectContaining({ status: 'pointing' }))
      })

      test('expect text messages sent when status changed', async () => {
        const result = await updateSessionStatus(sessionId, playingSession)
        expect(result).toEqual(expect.objectContaining({ status: 'pointing' }))
        expect(mocked(queue).sendSms).toHaveBeenCalledWith(validPhoneNumber, expect.stringContaining(sessionId))
      })
    })

    describe('winner', () => {
      const pointedDecisions = {
        ...decisions,
        points: {
          '+15551234567': {
            N: {
              '1': 1,
            },
          },
          [validPhoneNumber]: {
            N: {
              '1': 2,
            },
          },
        },
      } as Decisions
      const pointingSession = { ...session, status: 'pointing' } as Session

      beforeAll(() => {
        mocked(dynamodb).getDecisionById.mockResolvedValue(pointedDecisions)
      })

      test('expect not enough players does not change session', async () => {
        const noDecisions = {
          ...decisions,
          points: {},
        } as Decisions
        mocked(dynamodb).getDecisionById.mockResolvedValueOnce(noDecisions)
        const result = await updateSessionStatus(sessionId, pointingSession)
        expect(result).toEqual(pointingSession)
      })

      test('expect winner calculated and status changed', async () => {
        const result = await updateSessionStatus(sessionId, pointingSession)
        expect(result).toEqual(expect.objectContaining({ status: 'winner' }))
        expect(result.winners).toEqual([validPhoneNumber])
      })

      test('expect text messages sent when status changed', async () => {
        const result = await updateSessionStatus(sessionId, pointingSession)
        expect(result).toEqual(expect.objectContaining({ status: 'winner' }))
        expect(mocked(queue).sendSms).toHaveBeenCalledWith(validPhoneNumber, expect.stringContaining(sessionId))
      })
    })
  })
})
