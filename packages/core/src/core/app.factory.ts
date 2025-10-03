import { Express } from "express";
import { RouterFactory } from "./router.factory";
import { container } from "../container/container";

export class AppFactory {
  static registerControllers(app: Express, controllers: any[]): void {
    controllers.forEach((ControllerClass) => {
      const controllerInstance = container.resolve<any>(ControllerClass.name);
      const router = RouterFactory.createRouter(controllerInstance);
      app.use("/", router);
    });
  }
}
