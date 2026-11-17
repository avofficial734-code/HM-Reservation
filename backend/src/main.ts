import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureCors } from './cors.js';
import { answerUnchangedRecords } from './record-version.js';
async function bootstrap(){
 const app=await NestFactory.create<import('@nestjs/platform-express').NestExpressApplication>(AppModule);
 app.useBodyParser('json',{limit:'4mb'});
 configureCors(app);
 // Express ETags would answer 304s, which lose their CORS headers on Vercel.
 app.set('etag',false);
 app.use(answerUnchangedRecords);
 app.enableShutdownHooks();
 await app.listen(process.env.PORT??3001,process.env.VERCEL?'0.0.0.0':'127.0.0.1');
}
// Let Vercel finish importing the entrypoint while it starts the server.
void bootstrap();
