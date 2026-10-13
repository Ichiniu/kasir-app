import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

const workflow = JSON.parse(readFileSync(new URL('./workflow-casir.json', import.meta.url), 'utf8'));
const byName = new Map(workflow.nodes.map(node => [node.name, node]));
const require = createRequire(import.meta.url);
const fixtureOwner = {
  active: true, phone: '628000000000', deviceId: '628000000001@s.whatsapp.net',
  gowaDeviceId: 'test-device', ownerId: 'owner-test', outletIds: ['outlet-a'],
};
const config = {
  liveEnabled: false, ingressControlsReady: false, databaseReady: false, aiReady: false,
  sendReplies: false, maxMessageAgeSeconds: 300, maxQuestionLength: 1500, owners: [],
};
const event = () => ({
  event: 'message', device_id: fixtureOwner.deviceId,
  payload: { id: 'TEST_MESSAGE', from: fixtureOwner.phone + '@s.whatsapp.net',
    chat_id: fixtureOwner.phone + '@s.whatsapp.net', is_from_me: false,
    timestamp: new Date().toISOString(), body: 'Penjualan hari ini berapa?' },
});
const authorized = {
  authorized: true, allowedOutletIds: ['outlet-a'], sender: fixtureOwner.phone,
  gowaDeviceId: 'test-device', messageId: 'TEST_MESSAGE',
};

async function run(name, json = {}, refs = {}, options = {}) {
  const globals = {
    Buffer, require, Date,
    $json: json,
    $input: { first: () => ({ json, binary: {} }) },
    $env: options.env || {},
    $: ref => ({ first: () => refs[ref] || { json: {} } }),
    helpers: { getBinaryDataBuffer: async () => options.raw || Buffer.from('{}') },
  };
  const context = vm.createContext(globals);
  const code = byName.get(name).parameters.jsCode;
  const result = await new vm.Script('(async function(){' + code + '\n}).call({helpers})').runInContext(context, { timeout: 1000 });
  return JSON.parse(JSON.stringify(result));
}
async function validate(e) {
  return (await run('Validasi Pesan', {}, {
    'Verifikasi Webhook GoWA': { json: { event: e } },
    'Konfigurasi Casir': { json: { config } },
  }))[0].json;
}
async function authorize(message, owners = [fixtureOwner]) {
  return (await run('Otorisasi Owner', message, {
    'Konfigurasi Casir': { json: { config: { ...config, owners } } },
  }))[0].json;
}
function params(overrides = {}, scope = authorized, ready = true) {
  const node = workflow.nodes.find(n => n.type === 'n8n-nodes-base.postgresTool');
  const expression = node.parameters.options.queryReplacement.slice(3, -2).trim();
  const values = { start_date: '2026-10-01', end_date: '2026-10-05', outlet_id: '', ...overrides };
  const context = vm.createContext({
    $: name => ({ first: () => ({ json: name === 'Otorisasi Owner' ? scope : { config: { databaseReady: ready } } }) }),
    $fromAI: key => values[key],
  });
  return JSON.parse(JSON.stringify(new vm.Script(expression).runInContext(context, { timeout: 1000 })));
}

test('all graph references and node IDs are unique and valid', () => {
  assert.equal(byName.size, workflow.nodes.length);
  assert.equal(new Set(workflow.nodes.map(n => n.id)).size, workflow.nodes.length);
  for (const [source, types] of Object.entries(workflow.connections)) {
    assert.ok(byName.has(source), source);
    for (const outputs of Object.values(types)) for (const output of outputs)
      for (const edge of output) assert.ok(byName.has(edge.node), edge.node);
  }
});
test('every Code node compiles', () => {
  for (const node of workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code'))
    assert.doesNotThrow(() => new vm.Script('(async function(){' + node.parameters.jsCode + '\n})'));
});
test('draft defaults never enable live, DB, AI, delivery or owner access', async () => {
  const c = (await run('Konfigurasi Casir'))[0].json.config;
  for (const flag of ['liveEnabled', 'databaseReady', 'aiReady', 'sendReplies', 'ingressControlsReady']) assert.equal(c[flag], false);
  assert.deepEqual(c.owners, []);
});
test('manual trigger has no path to AI, database, webhook or GoWA', () => {
  const seen = new Set(); const queue = ['Uji Draft Manual'];
  while (queue.length) {
    const name = queue.shift(); if (seen.has(name)) continue; seen.add(name);
    const node = byName.get(name);
    assert.ok(!/postgres|gowa|langchain|webhook/i.test(node.type));
    for (const output of workflow.connections[name]?.main || []) for (const edge of output) queue.push(edge.node);
  }
  assert.equal(seen.size, 2);
});
test('webhook fails closed before touching secret when draft disabled', async () => {
  assert.equal((await run('Verifikasi Webhook GoWA', { config }))[0].json.httpStatus, 503);
});
test('live webhook without secret fails closed', async () => {
  assert.equal((await run('Verifikasi Webhook GoWA', { config: { ...config, liveEnabled: true, ingressControlsReady: true } }))[0].json.httpStatus, 503);
});
test('valid raw-body HMAC succeeds; altered or unsigned data rejected', async () => {
  const raw = Buffer.from(JSON.stringify(event()));
  const secret = 'test-only-secret-not-a-production-credential-0000';
  const signature = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  const settings = { config: { ...config, liveEnabled: true, ingressControlsReady: true } };
  const refs = { 'Pesan WhatsApp Masuk': { json: { headers: { 'x-hub-signature-256': signature } } } };
  const options = { env: { CASIR_GOWA_WEBHOOK_SECRET: secret }, raw };
  assert.equal((await run('Verifikasi Webhook GoWA', settings, refs, options))[0].json.accepted, true);
  assert.equal((await run('Verifikasi Webhook GoWA', settings, refs, { ...options, raw: Buffer.from('{}') }))[0].json.httpStatus, 401);
  assert.equal((await run('Verifikasi Webhook GoWA', settings, { 'Pesan WhatsApp Masuk': { json: { headers: {} } } }, options))[0].json.httpStatus, 401);
});
test('one-to-one fresh text event accepted', async () => assert.equal((await validate(event())).valid, true));
for (const [label, mutate] of [
  ['group', e => { e.payload.chat_id = '123456789@g.us'; }],
  ['self message', e => { e.payload.is_from_me = true; }],
  ['receipt', e => { e.event = 'message.ack'; }],
  ['unsupported LID', e => { e.payload.from = '123456789@lid'; }],
  ['overlong question', e => { e.payload.body = 'a'.repeat(1501); }],
  ['media without text', e => { delete e.payload.body; }],
  ['missing message id', e => { delete e.payload.id; }],
  ['old event', e => { e.payload.timestamp = new Date(Date.now() - 600000).toISOString(); }],
  ['future event', e => { e.payload.timestamp = new Date(Date.now() + 120000).toISOString(); }],
]) test('reject ' + label, async () => { const e = event(); mutate(e); assert.equal((await validate(e)).valid, false); });
test('verified owner receives only configured outlet IDs', async () => {
  const result = await authorize({ ...(await validate(event())), outletIds: ['victim'], role: 'SUPERADMIN' });
  assert.equal(result.authorized, true); assert.deepEqual(result.allowedOutletIds, ['outlet-a']);
});
test('unknown sender, wrong device, duplicate mapping and empty scope denied', async () => {
  const message = await validate(event());
  for (const candidate of [{ ...message, sender: '628000000999' }, { ...message, deviceId: 'wrong' }])
    assert.equal((await authorize(candidate)).authorized, false);
  assert.equal((await authorize(message, [fixtureOwner, fixtureOwner])).authorized, false);
  assert.equal((await authorize(message, [{ ...fixtureOwner, outletIds: [] }])).authorized, false);
  assert.equal((await authorize(message, [])).authorized, false);
});
test('report parameters preserve trusted scope and separate all values from SQL', () => {
  assert.deepEqual(params(), ['["outlet-a"]', '2026-10-01', '2026-10-05', '']);
  assert.equal(params({ outlet_id: 'outlet-a' })[3], 'outlet-a');
});
for (const [label, values] of [
  ['foreign outlet', { outlet_id: 'outlet-b' }],
  ['SQL injection outlet', { outlet_id: "'; DROP TABLE products; --" }],
  ['SQL injection date', { start_date: "2026-10-01'; SELECT 1;--" }],
  ['impossible date', { start_date: '2026-02-30' }],
  ['reversed range', { end_date: '2026-09-01' }],
  ['unbounded period', { start_date: '2020-01-01' }],
]) test('parameter validation rejects ' + label, () => assert.throws(() => params(values)));
test('report parameters reject no authorization or database-not-ready', () => {
  assert.throws(() => params({}, { authorized: false }));
  assert.throws(() => params({}, authorized, false));
});
test('all 11 tools are fixed scoped SELECT and have no database credentials', () => {
  const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
  const tables = new Set([...schema.matchAll(/@@map\("([a-z_]+)"\)/g)].map(m => m[1]));
  const tools = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.postgresTool');
  assert.equal(tools.length, 11);
  for (const tool of tools) {
    const { query, options } = tool.parameters;
    assert.equal(tool.credentials, undefined);
    assert.match(query, /jsonb_array_elements_text\(\$1::jsonb\)/);
    assert.match(query, /JOIN scope|FROM scope/);
    assert.match(query, /LIMIT \d+/);
    assert.doesNotMatch(query, /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|GRANT|COPY|CALL)\b/i);
    assert.doesNotMatch(query, /public\.(accounts|sessions|verifications|settings|audit_logs)\b/);
    assert.doesNotMatch(query, /\{\{|\$fromAI/);
    assert.match(options.queryReplacement, /allowedOutletIds/);
    for (const match of query.matchAll(/public\.([a-z_]+)/g)) assert.ok(tables.has(match[1]), match[1]);
    assert.equal(workflow.connections[tool.name].ai_tool[0][0].node, 'AI Agent Laporan Casir');
  }
});
test('sales, session and top-product reports only use COMPLETED', () => {
  for (const name of ['laporan_penjualan', 'penjualan_harian_pembayaran', 'sesi_kasir', 'produk_terlaris'])
    assert.match(byName.get(name).parameters.query, /"paymentStatus"='COMPLETED'/);
  assert.doesNotMatch(byName.get('sesi_kasir').parameters.query, /"totalSales"/);
});
test('unconnected database reply contains no invented financial data', async () => {
  const raw = (await run('Database Belum Terhubung'))[0].json;
  const result = (await run('Jawaban Aman', raw, { 'Otorisasi Owner': { json: authorized } }))[0].json;
  assert.match(result.message, /belum terhubung/);
  assert.doesNotMatch(result.message, /Rp\s*\d/);
  assert.equal(result.phone, fixtureOwner.phone);
});
test('AI cannot set the reply recipient or expose obvious secret/SQL errors', async () => {
  const refs = { 'Otorisasi Owner': { json: authorized } };
  const result = (await run('Jawaban Aman', { output: 'postgresql://username:password@db/kasir', intermediateSteps: [{}], phone: 'victim' }, refs))[0].json;
  assert.equal(result.phone, fixtureOwner.phone); assert.doesNotMatch(result.message, /password/);
  await assert.rejects(run('Jawaban Aman', { output: 'x' }, { 'Otorisasi Owner': { json: { authorized: false } } }));
});
test('model without tool evidence cannot present an invented report', async () => {
  const result = (await run('Jawaban Aman', { output: 'Omzet Rp 1000000', intermediateSteps: [] }, { 'Otorisasi Owner': { json: authorized } }))[0].json;
  assert.doesNotMatch(result.message, /1000000/);
});
test('delivery is only via GoWA and gated; default logs do not retain report data', () => {
  const sender = byName.get('GoWA - Balas Owner');
  assert.equal(sender.parameters.operation, 'sendText');
  assert.equal(sender.parameters.phoneNumber, '={{ $json.phone }}');
  assert.equal(workflow.connections['Pengiriman Diaktifkan?'].main[0][0].node, sender.name);
  assert.equal(workflow.connections['Pengiriman Diaktifkan?'].main[1][0].node, 'Preview - Tidak Mengirim');
  assert.equal(workflow.settings.saveDataSuccessExecution, 'none');
  assert.equal(workflow.settings.availableInMCP, false);
  assert.equal(workflow.settings.saveDataErrorExecution, 'none');
  assert.equal(workflow.settings.saveManualExecutions, false);
});
