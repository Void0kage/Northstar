process.env.DB_PATH = ':memory:';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('./server');

test('POST /tasks creates a task', async () => {
  const res = await request(app)
    .post('/tasks')
    .send({ title: 'Test me' })
    .expect(201);

  assert.equal(res.body.title, 'Test me');
  assert.equal(res.body.done, false);
  assert.ok(res.body.id);
});

test('POST /tasks rejects empty title', async () => {
  await request(app).post('/tasks').send({}).expect(400);
});

test('GET /tasks lists tasks', async () => {
  await request(app).post('/tasks').send({ title: 'First' });
  await request(app).post('/tasks').send({ title: 'Second' });

  const res = await request(app).get('/tasks').expect(200);
  assert.ok(res.body.length >= 2);
});

test('PATCH /tasks/:id marks done', async () => {
  const created = await request(app).post('/tasks').send({ title: 'Do it' });
  const id = created.body.id;

  const res = await request(app)
    .patch(`/tasks/${id}`)
    .send({ done: true })
    .expect(200);

  assert.equal(res.body.done, true);
});

test('PATCH /tasks/9999 returns 404', async () => {
  await request(app).patch('/tasks/9999').send({ done: true }).expect(404);
});