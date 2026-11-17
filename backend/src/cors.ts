import type { INestApplication } from '@nestjs/common';

export function configureCors(app: INestApplication) {
  const configured = process.env.CORS_ORIGINS || 'https://hm-reservation.vercel.app,https://hmreservation.vercel.app,https://hmreservation.netlify.app';
  const origins = configured.split(',').map(origin => origin.trim()).filter(Boolean);
  if (!process.env.VERCEL) origins.push('http://127.0.0.1:5174', 'http://localhost:5174');
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // If-None-Match stays allowed for pages loaded before the switch; ETags are off, so it is ignored.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Session', 'X-Records-Version', 'If-None-Match'],
    // Lets staff portals skip unchanged record downloads (see record-version.ts).
    exposedHeaders: ['X-Records-Version'],
    credentials: false,
    maxAge: 600,
  });
}
