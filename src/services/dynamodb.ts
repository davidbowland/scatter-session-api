import { DynamoDB } from 'aws-sdk'

import { Decisions, Session, SessionBatch } from '../types'
import { dynamodbDecisionTableName, dynamodbSessionTableName } from '../config'
import { xrayCapture } from '../utils/logging'

const dynamodb = xrayCapture(new DynamoDB({ apiVersion: '2012-08-10' }))

/* Delete item */

export const deleteDecisionById = (sessionId: string, userId: string): Promise<DynamoDB.Types.DeleteItemOutput> =>
  dynamodb
    .deleteItem({
      Key: {
        SessionId: {
          S: `${sessionId}`,
        },
        UserId: {
          S: `${userId}`,
        },
      },
      TableName: dynamodbDecisionTableName,
    })
    .promise()

export const deleteSessionById = (sessionId: string): Promise<DynamoDB.Types.DeleteItemOutput> =>
  dynamodb
    .deleteItem({
      Key: {
        SessionId: {
          S: `${sessionId}`,
        },
      },
      TableName: dynamodbSessionTableName,
    })
    .promise()

/* Get single item */

export const getDecisionById = (sessionId: string, userId: string): Promise<Decisions> =>
  dynamodb
    .getItem({
      Key: {
        SessionId: {
          S: `${sessionId}`,
        },
        UserId: {
          S: `${userId}`,
        },
      },
      TableName: dynamodbDecisionTableName,
    })
    .promise()
    .then((response) => response.Item.Data.S)
    .then(JSON.parse)
    .catch(() => ({ points: {}, responses: {} }))

export const getSessionById = (sessionId: string): Promise<Session> =>
  dynamodb
    .getItem({
      Key: {
        SessionId: {
          S: `${sessionId}`,
        },
      },
      TableName: dynamodbSessionTableName,
    })
    .promise()
    .then((response) => response.Item.Data.S)
    .then(JSON.parse)

/* Query for user IDs by session */

export const queryUserIdsBySessionId = (sessionId: string): Promise<string[]> =>
  dynamodb
    .query({
      ExpressionAttributeValues: {
        ':v1': {
          S: sessionId,
        },
      },
      KeyConditionExpression: 'SessionId = :v1',
      ProjectionExpression: 'UserId',
      TableName: dynamodbDecisionTableName,
    })
    .promise()
    .then((response) => response.Items.map((item) => item.UserId.S))

/* Scan for expired items */

export const scanExpiredSessionIds = (): Promise<string[]> =>
  dynamodb
    .scan({
      ExpressionAttributeValues: {
        ':v1': {
          N: '1',
        },
        ':v2': {
          N: `${new Date().getTime()}`,
        },
      },
      FilterExpression: 'Expiration BETWEEN :v1 AND :v2',
      IndexName: 'ExpirationIndex',
      TableName: dynamodbSessionTableName,
    })
    .promise()
    .then((response) => response.Items.map((item) => item.SessionId.S))

/* Scan for all items */

const getItemsFromScan = (response: DynamoDB.Types.ScanOutput): SessionBatch[] =>
  response.Items.map((item) => ({ data: JSON.parse(item.Data.S), id: item.SessionId.S }))

export const scanSessions = (): Promise<SessionBatch[]> =>
  dynamodb
    .scan({
      AttributesToGet: ['Data', 'SessionId', 'Expiration'],
      TableName: dynamodbSessionTableName,
    })
    .promise()
    .then((response) => getItemsFromScan(response))

/* Set item */

export const setDecisionById = (
  sessionId: string,
  userId: string,
  data: Decisions
): Promise<DynamoDB.Types.PutItemOutput> =>
  dynamodb
    .putItem({
      Item: {
        Data: {
          S: JSON.stringify(data),
        },
        SessionId: {
          S: `${sessionId}`,
        },
        UserId: {
          S: `${userId}`,
        },
      },
      TableName: dynamodbDecisionTableName,
    })
    .promise()

export const setSessionById = (sessionId: string, data: Session): Promise<DynamoDB.Types.PutItemOutput> =>
  dynamodb
    .putItem({
      Item: {
        Data: {
          S: JSON.stringify(data),
        },
        Expiration: {
          N: `${data.expiration ?? 0}`,
        },
        SessionId: {
          S: `${sessionId}`,
        },
      },
      TableName: dynamodbSessionTableName,
    })
    .promise()
