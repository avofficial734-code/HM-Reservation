import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const RECORDS_VERSION_HEADER = 'X-Records-Version';

export function recordsVersion(body: unknown) {
  return '"' + createHash('sha1').update(JSON.stringify(body) ?? '').digest('base64url') + '"';
}

// Staff portals poll records and skip downloads that have not changed. Vercel drops CORS headers from
// 304 responses, so an unchanged GET is answered with a small 200 body instead of an HTTP 304.
export function answerUnchangedRecords(request: Request, response: Response, next: NextFunction) {
  if (request.method !== 'GET') { next(); return; }
  const json = response.json.bind(response);
  response.json = (body: unknown) => {
    if (response.statusCode !== 200) return json(body);
    const version = recordsVersion(body);
    response.setHeader(RECORDS_VERSION_HEADER, version);
    return json(request.get(RECORDS_VERSION_HEADER) === version ? { unchanged: true } : body);
  };
  next();
}
