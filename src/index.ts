import 'reflect-metadata';
import 'module-alias/register';
import { HanFactory } from '@/core/han.factory';
import { AppModule } from '@/app.module';
import { Logger } from '@/utils';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    Logger.info(`🚀 Application is running on port ${port}`);
  });
}

bootstrap();