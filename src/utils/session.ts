import { CategoriesObject, CategoryPointsObject, Session, StringObject } from '../types'
import { getDecisionById, queryUserIdsBySessionId } from '../services/dynamodb'
import { corsDomain } from '../config'
import { sendSms } from '../services/queue'

const areResponsesComplete = (categories: CategoriesObject, responses: StringObject): boolean =>
  Object.keys(categories).every((letter) => letter in responses)

const extractPositivePoints = (points: StringObject): number =>
  Object.keys(points).reduce((previous, index) => previous + points[index], 0)

const extractLetterPoints = (points: StringObject): number =>
  Object.keys(points).reduce((previous, letter) => previous + extractPositivePoints(points[letter]), 0)

const countPointsForUser = (userId: string, points: CategoryPointsObject[]): number =>
  points.reduce((total, currentPoints) => total + extractLetterPoints(currentPoints[userId]), 0)

const filterInvalidPhoneNumbers = (phoneNumber: string) =>
  phoneNumber.match(/^\+1555|^\+1\d{3}555|^\+1[01]|^\+1\d{3}[01]/) === null

export const updateSessionStatus = async (sessionId: string, session: Session): Promise<Session> => {
  const decisionIds = await queryUserIdsBySessionId(sessionId)
  if (decisionIds.length < session.userCount || session.status === 'winner') {
    return session
  }
  const allDecisions = await Promise.all(decisionIds.map((userId) => getDecisionById(sessionId, userId)))

  if (session.status === 'playing') {
    const allResponses = allDecisions.map((decision) => decision.responses)
    const allResponsesComplete = allResponses.every((responses) => areResponsesComplete(session.categories, responses))
    if (!allResponsesComplete) {
      return session
    }
    if (session.textUpdates) {
      decisionIds
        .filter(filterInvalidPhoneNumbers)
        .map((userId) =>
          sendSms(userId, `Pointing has begun: ${corsDomain}/s/${sessionId}?u=${encodeURIComponent(userId)}`)
        )
    }
    return { ...session, status: 'pointing' }
  }

  const allPoints = allDecisions.map((decision) => decision.points)
  const allPointingComplete = allPoints.filter((points) => Object.keys(points).length > 0)
  if (allPointingComplete.length < decisionIds.length) {
    return session
  }

  const totalPoints: { [key: string]: number } = decisionIds.reduce(
    (prev, userId) => ({ ...prev, [userId]: countPointsForUser(userId, allPoints) }),
    {}
  )
  const maxPoints = Math.max(...Object.values(totalPoints))
  const winners = decisionIds.filter((userId) => totalPoints[userId] === maxPoints)

  if (session.textUpdates) {
    decisionIds
      .filter(filterInvalidPhoneNumbers)
      .map((userId) => sendSms(userId, `Winners for ${sessionId}: ${winners.join(', ')}`))
  }
  return { ...session, status: 'winner', winners }
}
