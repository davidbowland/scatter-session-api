import { APIGatewayProxyEventV2, NewSession } from '@types'
import { decodedJwt, jsonPatchOperations, newSession } from '../__mocks__'
import {
  extractJsonPatchFromEvent,
  extractJwtFromEvent,
  extractNewSessionFromEvent,
  formatSession,
} from '@utils/events'
import patchEventJson from '@events/patch-item.json'
import postEventJson from '@events/post-item.json'
import postSendTextEventJson from '@events/post-send-text.json'

describe('events', () => {
  describe('formatSession', () => {
    test('expect error when expiration too late session', () => {
      const tooLateExpirationSession = { ...newSession, expiration: new Date().getTime() + 100_000_000_000 }
      expect(() => formatSession(tooLateExpirationSession)).toThrow()
    })

    test.each([undefined, 0, 4])('expect error on invalid rounds (%s)', (rounds) => {
      const invalidSession = { ...newSession, rounds } as NewSession
      expect(() => formatSession(invalidSession)).toThrow()
    })

    test.each([undefined, 29, 301])('expect error on invalid timeLimit (%s)', (timeLimit) => {
      const invalidSession = { ...newSession, timeLimit } as NewSession
      expect(() => formatSession(invalidSession)).toThrow()
    })

    test.each([undefined, 1, 6])('expect error on invalid userCount (%s)', (userCount) => {
      const invalidSession = { ...newSession, userCount } as NewSession
      expect(() => formatSession(invalidSession)).toThrow()
    })

    test('expect formatted session returned', () => {
      const result = formatSession(newSession)
      expect(result).toEqual(expect.objectContaining(newSession))
      expect(result.expiration).toBeGreaterThan(new Date().getTime())
    })
  })

  describe('extractNewSessionFromEvent', () => {
    const event = postEventJson as unknown as APIGatewayProxyEventV2

    test('expect session from event', async () => {
      const result = await extractNewSessionFromEvent(event)
      expect(result).toEqual(expect.objectContaining(newSession))
    })

    test('expect session from event in base64', async () => {
      const tempEvent = {
        ...event,
        body: Buffer.from(event.body).toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEventV2
      const result = await extractNewSessionFromEvent(tempEvent)
      expect(result).toEqual(expect.objectContaining(newSession))
    })

    test('expect reject on invalid event', async () => {
      const tempEvent = { ...event, body: JSON.stringify({}) } as unknown as APIGatewayProxyEventV2
      expect(() => extractNewSessionFromEvent(tempEvent)).toThrow()
    })

    test('expect session to be formatted', async () => {
      const tempEmail = {
        ...newSession,
        foo: 'bar',
      }
      const tempEvent = { ...event, body: JSON.stringify(tempEmail) } as unknown as APIGatewayProxyEventV2
      const result = await extractNewSessionFromEvent(tempEvent)
      expect(result).toEqual(expect.objectContaining(newSession))
    })
  })

  describe('extractJsonPatchFromEvent', () => {
    test('expect preference from event', async () => {
      const result = await extractJsonPatchFromEvent(patchEventJson as unknown as APIGatewayProxyEventV2)
      expect(result).toEqual(jsonPatchOperations)
    })
  })

  describe('extractJwtFromEvent', () => {
    test('expect payload successfully extracted', () => {
      const result = extractJwtFromEvent(postSendTextEventJson as unknown as APIGatewayProxyEventV2)
      expect(result).toEqual(decodedJwt)
    })

    test('expect null on invalid JWT', () => {
      const result = extractJwtFromEvent({
        ...postSendTextEventJson,
        headers: {
          authorization: 'Bearer invalid jwt',
        },
      } as unknown as APIGatewayProxyEventV2)
      expect(result).toBe(null)
    })

    test('expect null on missing header', () => {
      const event = { ...postSendTextEventJson, headers: {} } as unknown as APIGatewayProxyEventV2
      const result = extractJwtFromEvent(event)
      expect(result).toBe(null)
    })
  })
})
