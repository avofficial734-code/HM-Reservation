import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {requestJson,requestJsonIfChanged,clearConditionalCache} from '../src/api.js';
const originalFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch});
function reply(body,status=200){globalThis.fetch=async()=>new Response(body,{status})}
test('empty proxy error has a readable service message',async()=>{reply('',502);await assert.rejects(requestJson('/api/records'),/temporarily unavailable/)});
test('HTML error never exposes a JSON parsing failure',async()=>{reply('<html>Bad gateway</html>',500);await assert.rejects(requestJson('/api/records'),/temporarily unavailable/)});
test('empty and truncated success responses have a readable error',async()=>{for(const body of ['', '{"reservations":']){reply(body);await assert.rejects(requestJson('/api/records'),/incomplete response/)}});
test('server validation messages are preserved',async()=>{reply(JSON.stringify({message:['Email is required.','Accept the terms.']}),400);await assert.rejects(requestJson('/api/reservations'),/Email is required. Accept the terms./)});
test('unauthorized status is preserved for admin sign-in',async()=>{reply('',401);await assert.rejects(requestJson('/api/admin/records'),e=>e.status===401&&/sign in again/.test(e.message))});
test('network failure is readable',async()=>{globalThis.fetch=async()=>{throw new TypeError('Failed to fetch')};await assert.rejects(requestJson('/api/records'),/cannot be reached/)});
test('valid records and no-content responses are supported',async()=>{reply(JSON.stringify({reservations:[],reports:[],utilization:[]}));assert.deepEqual(await requestJson('/api/records'),{reservations:[],reports:[],utilization:[]});reply(null,204);assert.equal(await requestJson('/api/example'),null)});
test('unchanged staff records reuse the cached copy without an HTTP 304',async()=>{
  clearConditionalCache();const sent=[];let reply={body:{reservations:[1]},version:'"v1"'};
  globalThis.fetch=async(url,options)=>{sent.push(options.headers?.['X-Records-Version']||null);return new Response(JSON.stringify(reply.body),{status:200,headers:{'X-Records-Version':reply.version}})};
  const headers={Authorization:'Bearer key'};
  assert.deepEqual(await requestJsonIfChanged('/api/admin/records',{headers}),{reservations:[1]});
  reply={body:{unchanged:true},version:'"v1"'};
  assert.deepEqual(await requestJsonIfChanged('/api/admin/records',{headers}),{reservations:[1]});
  reply={body:{reservations:[1,2]},version:'"v2"'};
  assert.deepEqual(await requestJsonIfChanged('/api/admin/records',{headers}),{reservations:[1,2]});
  assert.deepEqual(sent,[null,'"v1"','"v1"']);
});
