import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bearer = {
  type: 'bearer',
  bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
};

function jsonBody(obj) {
  return {
    mode: 'raw',
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: 'json' } },
  };
}

function urlRaw(path) {
  return '{{baseUrl}}' + path;
}

function makeUrl(raw) {
  const u = raw.replace('{{baseUrl}}', 'http://localhost:3000');
  try {
    const parsed = new URL(u);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    return {
      raw,
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname.split('.'),
      port: parsed.port || undefined,
      path: pathSegments,
      query: undefined,
    };
  } catch {
    return { raw, host: ['{{baseUrl}}'], path: [] };
  }
}

function req(name, method, path, opts = {}) {
  const raw = urlRaw(path);
  const headers = [];
  const hasJsonBody = opts.body && opts.body.mode === 'raw' && opts.body.options?.raw?.language === 'json';
  if (hasJsonBody) {
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  const r = {
    name,
    request: {
      method,
      header: headers,
      url: makeUrl(raw),
    },
  };
  if (opts.body) r.request.body = opts.body;
  if (opts.auth) r.request.auth = opts.auth;
  if (opts.query) r.request.url.query = opts.query;
  if (opts.event) r.event = opts.event;
  if (opts.desc) r.request.description = opts.desc;
  return r;
}

const saveTokens = {
  listen: 'test',
  script: {
    exec: [
      'try {',
      '  const j = pm.response.json();',
      '  if (j.accessToken) { pm.environment.set("accessToken", j.accessToken); pm.collectionVariables.set("accessToken", j.accessToken); }',
      '  if (j.refreshToken) { pm.environment.set("refreshToken", j.refreshToken); pm.collectionVariables.set("refreshToken", j.refreshToken); }',
      '} catch (e) {}',
    ],
    type: 'text/javascript',
  },
};

const collection = {
  info: {
    name: 'Memoria API',
    description:
      'Set `baseUrl` (default http://localhost:3000). Run **Login** or **Register** to save tokens. Fill `memoryId`, `circleId`, etc. for path params.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'memoryId', value: '' },
    { key: 'circleId', value: '' },
    { key: 'conversationId', value: '' },
    { key: 'targetUserId', value: '' },
  ],
  item: [
    {
      name: 'Health',
      item: [
        req('GET /health', 'GET', '/health'),
        req('GET /api/v1/health', 'GET', '/api/v1/health'),
      ],
    },
    {
      name: 'Auth',
      item: [
        Object.assign(
          req('POST Register', 'POST', '/api/v1/auth/register', {
            body: jsonBody({ email: 'user@example.com', password: 'TestPassword1', name: 'Test User' }),
          }),
          { event: [saveTokens] }
        ),
        Object.assign(
          req('POST Login', 'POST', '/api/v1/auth/login', {
            body: jsonBody({ email: 'user@example.com', password: 'TestPassword1' }),
          }),
          { event: [saveTokens] }
        ),
        req('POST Refresh', 'POST', '/api/v1/auth/refresh', {
          body: jsonBody({ refreshToken: '{{refreshToken}}' }),
        }),
        req('GET Me', 'GET', '/api/v1/auth/me', { auth: bearer }),
        req('PATCH Profile', 'PATCH', '/api/v1/auth/profile', {
          auth: bearer,
          body: jsonBody({ name: 'Updated', bio: 'Hello' }),
        }),
        req('POST Profile avatar', 'POST', '/api/v1/auth/profile/avatar', {
          auth: bearer,
          body: {
            mode: 'formdata',
            formdata: [{ key: 'avatar', type: 'file', src: [] }],
          },
        }),
        req('POST Logout', 'POST', '/api/v1/auth/logout', { auth: bearer }),
      ],
    },
    {
      name: 'Memories',
      auth: bearer,
      item: [
        req('GET Activity', 'GET', '/api/v1/memories/activity'),
        req('GET List', 'GET', '/api/v1/memories?page=1&limit=20', {
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
          ],
        }),
        req('GET Trash', 'GET', '/api/v1/memories/trash'),
        req('GET By id', 'GET', '/api/v1/memories/{{memoryId}}'),
        req('POST Upload', 'POST', '/api/v1/memories', {
          body: {
            mode: 'formdata',
            formdata: [
              { key: 'file', type: 'file', src: [] },
              { key: 'mood', type: 'text', value: '' },
              { key: 'cluster', type: 'text', value: '' },
              { key: 'locationName', type: 'text', value: '' },
              { key: 'caption', type: 'text', value: '' },
            ],
          },
        }),
        req('PATCH Memory', 'PATCH', '/api/v1/memories/{{memoryId}}', {
          body: jsonBody({ mood: 'calm', locationName: 'Paris' }),
        }),
        req('DELETE Soft', 'DELETE', '/api/v1/memories/{{memoryId}}'),
        req('POST Restore', 'POST', '/api/v1/memories/{{memoryId}}/restore'),
        req('DELETE Permanent', 'DELETE', '/api/v1/memories/{{memoryId}}/permanent'),
        req('POST Retry caption', 'POST', '/api/v1/memories/{{memoryId}}/retry-caption'),
        req('POST Retry all failed', 'POST', '/api/v1/memories/retry-all-failed'),
      ],
    },
    {
      name: 'Search',
      auth: bearer,
      item: [
        req('GET Search', 'GET', '/api/v1/search', {
          query: [
            { key: 'q', value: 'beach' },
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
          ],
        }),
      ],
    },
    {
      name: 'Circles',
      auth: bearer,
      item: [
        req('POST Create', 'POST', '/api/v1/circles', {
          body: jsonBody({ name: 'Family', description: 'Photos', emoji: '👪' }),
        }),
        req('GET List', 'GET', '/api/v1/circles'),
        req('GET Detail', 'GET', '/api/v1/circles/{{circleId}}'),
        req('PATCH Update', 'PATCH', '/api/v1/circles/{{circleId}}', {
          body: jsonBody({ name: 'Family (v2)' }),
        }),
        req('GET Photos', 'GET', '/api/v1/circles/{{circleId}}/photos?page=1&limit=20', {
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
          ],
        }),
        req('POST Add photo', 'POST', '/api/v1/circles/{{circleId}}/photos', {
          body: jsonBody({ photoId: '{{memoryId}}' }),
        }),
        req('POST Bulk photos', 'POST', '/api/v1/circles/{{circleId}}/photos/bulk', {
          body: jsonBody({ photoIds: ['replace-with-uuid'] }),
        }),
        req('GET Members', 'GET', '/api/v1/circles/{{circleId}}/members'),
        req('POST Add member', 'POST', '/api/v1/circles/{{circleId}}/members', {
          body: jsonBody({ userId: '{{targetUserId}}' }),
        }),
        req('PATCH Member role', 'PATCH', '/api/v1/circles/{{circleId}}/members/{{targetUserId}}', {
          body: jsonBody({ role: 'admin' }),
        }),
        req('DELETE Member', 'DELETE', '/api/v1/circles/{{circleId}}/members/{{targetUserId}}'),
        req('DELETE Circle', 'DELETE', '/api/v1/circles/{{circleId}}'),
      ],
    },
    {
      name: 'Users',
      auth: bearer,
      item: [
        req('GET Search users', 'GET', '/api/v1/users/search', {
          query: [{ key: 'q', value: 'alice' }],
        }),
      ],
    },
    {
      name: 'AI',
      auth: bearer,
      item: [
        req('POST Chat', 'POST', '/api/v1/ai/chat', {
          body: jsonBody({
            messages: [
              {
                role: 'user',
                parts: [{ type: 'text', text: 'What photos do I have from last summer?' }],
              },
            ],
            conversationId: null,
          }),
        }),
        req('GET Conversations', 'GET', '/api/v1/ai/conversations'),
        req('GET Messages', 'GET', '/api/v1/ai/conversations/{{conversationId}}/messages'),
        req('DELETE Conversation', 'DELETE', '/api/v1/ai/conversations/{{conversationId}}'),
      ],
    },
    {
      name: 'Admin',
      item: [
        req('GET Bull Board', 'GET', '/admin/queues', {
          desc: 'Open in browser; BullMQ dashboard.',
        }),
      ],
    },
  ],
};

// Fix URLs: merge query into url object for requests that use query param
function fixItem(items) {
  for (const it of items) {
    if (it.item) fixItem(it.item);
    else if (it.request?.url?.query) {
      const q = it.request.url.query;
      const base = it.request.url.raw.split('?')[0];
      const qs = q.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
      it.request.url.raw = base + '?' + qs;
    }
  }
}
fixItem(collection.item);

const out = join(__dirname, 'Memoria-API.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log('Wrote', out);
