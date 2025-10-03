import { Controller, Get, Post, Body, Param } from "./decorators";
import { AppService, User } from "./app.service";

interface CreateUserDto {
  name: string;
  email: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      message: this.appService.getHello(),
      framework: "Han Framework",
      version: "1.0.0",
      features: [
        "🚀 Zero configuration",
        "🛡️ Security by default",
        "⚡ Lightning fast",
        "🔧 Developer friendly",
        "📦 Full TypeScript support",
        "🎯 NestJS compatible",
      ],
    };
  }

  @Get("health")
  getHealth() {
    return this.appService.getHealthStatus();
  }

  @Get("info")
  getInfo() {
    return this.appService.getApplicationInfo();
  }

  @Get("users")
  getUsers() {
    return {
      data: this.appService.getUsers(),
      count: this.appService.getUsers().length,
    };
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    const user = this.appService.getUserById(parseInt(id));
    if (!user) {
      return { error: "User not found", statusCode: 404 };
    }
    return { data: user };
  }

  @Post("users")
  createUser(@Body() userData: CreateUserDto) {
    try {
      const newUser = this.appService.createUser(userData);
      return {
        message: "User created successfully",
        data: newUser,
        statusCode: 201,
      };
    } catch (error: any) {
      return {
        error: "Failed to create user",
        message: error.message,
        statusCode: 400,
      };
    }
  }
}
