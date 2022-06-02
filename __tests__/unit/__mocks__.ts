import { Decisions, NewSession, PatchOperation, Session } from '@types'

export const decisions: Decisions = {
  points: {},
  responses: {
    P: {
      1: 'Plenty',
    },
  },
}

export const newSession: NewSession = {
  rounds: 2,
  timeLimit: 30,
  userCount: 2,
}

export const session: Session = {
  categories: {
    P: {
      1: 'Things to test',
    },
  },
  expiration: 1649131360051,
  owner: 'efd31b67-19f2-4d0a-a723-78506ffc0b7e',
  rounds: 1,
  status: 'playing',
  textUpdates: true,
  timeLimit: 30,
  userCount: 2,
}

export const sessionId = 'abc123'

export const jsonPatchOperations: PatchOperation[] = [{ op: 'replace', path: '/userCount', value: 1 }]

export const jwt =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMi5hbWF6b25hd3MuY29tL3VzLWVhc3QtMl9mSFJ4RTU3UFEiLCJpYXQiOjE2NTI2OTEwMDAsImV4cCI6MTY4NDIyNzAwMCwiYXVkIjoic2NhdHRlci5kYm93bGFuZC5jb20iLCJzdWIiOiJlZmQzMWI2Ny0xOWYyLTRkMGEtYTcyMy03ODUwNmZmYzBiN2UiLCJuYW1lIjoiRGF2ZSIsImNvZ25pdG86dXNlcm5hbWUiOiJlZmQzMWI2Ny0xOWYyLTRkMGEtYTcyMy03ODUwNmZmYzBiN2UiLCJwaG9uZV9udW1iZXIiOiIrMTU1NTEyMzQ1NjciLCJwaG9uZV9udW1iZXJfdmVyaWZpZWQiOiJ0cnVlIiwidG9rZW5fdXNlIjoiaWQifQ.Q1PeDQ5SNMWTYldSu-TxTPWAa5DaO-Z3WgBm_bKzZnA'

export const userId = '+15551234567'

export const decodedJwt = {
  aud: 'scatter.dbowland.com',
  'cognito:username': 'efd31b67-19f2-4d0a-a723-78506ffc0b7e',
  exp: 1684227000,
  iat: 1652691000,
  iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_fHRxE57PQ',
  name: 'Dave',
  phone_number: '+15551234567',
  phone_number_verified: 'true',
  sub: 'efd31b67-19f2-4d0a-a723-78506ffc0b7e',
  token_use: 'id',
}
