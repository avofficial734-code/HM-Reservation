import { answerUnchangedRecords, recordsVersion } from './record-version.js';

function call(method: string, asked: string | undefined, body: unknown, statusCode = 200) {
  const headers: Record<string, string> = {};
  let sent: unknown;
  const response = { statusCode, setHeader: (name: string, value: string) => { headers[name] = value; }, json: (value: unknown) => { sent = value; return response; } };
  const request = { method, get: (name: string) => (name === 'X-Records-Version' ? asked : undefined) };
  answerUnchangedRecords(request as never, response as never, () => {});
  response.json(body);
  return { headers, sent };
}

describe('unchanged records answer', () => {
  const records = { reservations: [{ id: 'a' }] };
  const version = recordsVersion(records);

  it('sends the full body with its version the first time', () => {
    expect(call('GET', undefined, records)).toEqual({ headers: { 'X-Records-Version': version }, sent: records });
  });
  it('answers a small 200 body when the caller already has this version', () => {
    expect(call('GET', version, records).sent).toEqual({ unchanged: true });
  });
  it('sends the full body again once the records change', () => {
    const changed = { reservations: [{ id: 'a' }, { id: 'b' }] };
    expect(call('GET', version, changed)).toEqual({ headers: { 'X-Records-Version': recordsVersion(changed) }, sent: changed });
  });
  it('leaves errors and non-GET requests untouched', () => {
    expect(call('GET', version, { message: 'Denied' }, 401)).toEqual({ headers: {}, sent: { message: 'Denied' } });
    expect(call('POST', version, records)).toEqual({ headers: {}, sent: records });
  });
});
