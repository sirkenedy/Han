import { Module } from "./decorators";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
