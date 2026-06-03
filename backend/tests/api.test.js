const request  = require('supertest')
const app      = require('../server')
const prisma   = require('../src/config/prisma')

// ── Test user creds ───────────────────────────────────────────────────────────
const testUser = {
  name:  'Test Farmer',
  email: `test_${Date.now()}@gramsaathi.test`,
  password: 'Test@1234',
  role: 'farmer',
}

let accessToken  = ''
let refreshToken = ''
let sessionId    = ''

// ── Auth Tests ────────────────────────────────────────────────────────────────
describe('Auth API', () => {
  test('POST /api/auth/register → 201 + tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    expect(res.body.user.email).toBe(testUser.email)
    accessToken  = res.body.accessToken
    refreshToken = res.body.refreshToken
  })

  test('POST /api/auth/register → 409 on duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser)
    expect(res.status).toBe(409)
  })

  test('POST /api/auth/login → 200 + tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    accessToken  = res.body.accessToken
    refreshToken = res.body.refreshToken
  })

  test('POST /api/auth/login → 401 wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/me → 200 authenticated user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(testUser.email)
  })

  test('GET /api/auth/me → 401 no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('POST /api/auth/refresh → 200 new tokens', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    accessToken  = res.body.accessToken
    refreshToken = res.body.refreshToken
  })
})

// ── Chat Tests ────────────────────────────────────────────────────────────────
describe('Chat API', () => {
  test('POST /api/chat/send → 200 creates session and message', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Hello GramSaathi', language: 'en' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('sessionId')
    expect(res.body).toHaveProperty('message')
    sessionId = res.body.sessionId
  })

  test('GET /api/chat/sessions → 200 list sessions', async () => {
    const res = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.sessions)).toBe(true)
  })

  test('GET /api/chat/sessions/:id → 200 session messages', async () => {
    const res = await request(app)
      .get(`/api/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.session.messages.length).toBeGreaterThan(0)
  })

  test('DELETE /api/chat/sessions/:id → 200 deleted', async () => {
    const res = await request(app)
      .delete(`/api/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
  })
})

// ── User Tests ────────────────────────────────────────────────────────────────
describe('User API', () => {
  test('GET /api/user/dashboard → 200 stats', async () => {
    const res = await request(app)
      .get('/api/user/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('stats')
    expect(res.body.stats).toHaveProperty('chatSessions')
  })

  test('PATCH /api/user/profile → 200 updated', async () => {
    const res = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Farmer', state: 'Maharashtra' })
    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Updated Farmer')
  })
})

// ── Cleanup ───────────────────────────────────────────────────────────────────
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@gramsaathi.test' } } })
  await prisma.$disconnect()
})
