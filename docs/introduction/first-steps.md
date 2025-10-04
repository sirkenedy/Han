# First Steps

Now that you've [installed Han Framework](/introduction/getting-started), let's build a real application! We'll create a **Task Management API** with full CRUD operations, validation, and error handling.

## What We'll Build

A complete REST API for managing tasks with:

- ✅ Create, Read, Update, Delete tasks
- ✅ Task status management (pending, in-progress, completed)
- ✅ Input validation
- ✅ Error handling
- ✅ Proper HTTP status codes

## Project Setup

If you haven't already, create a new project:

```bash
han new task-manager
cd task-manager
npm install
```

## Step 1: Create the Task Module

Generate a complete resource:

```bash
han generate resource tasks
```

This creates:
- `tasks/tasks.controller.ts`
- `tasks/tasks.service.ts`
- `tasks/tasks.module.ts`

And automatically imports `TasksModule` into `app.module.ts`!

## Step 2: Define the Task Interface

Create a DTOs (Data Transfer Objects) folder:

```bash
mkdir src/tasks/dto
```

Create `src/tasks/dto/create-task.dto.ts`:

```typescript
export class CreateTaskDto {
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}
```

Create `src/tasks/dto/update-task.dto.ts`:

```typescript
export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}
```

Create `src/tasks/interfaces/task.interface.ts`:

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

## Step 3: Implement the Service

Update `src/tasks/tasks.service.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { Task } from './interfaces/task.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];
  private idCounter = 1;

  /**
   * Get all tasks
   */
  findAll(): Task[] {
    return this.tasks;
  }

  /**
   * Get tasks by status
   */
  findByStatus(status: 'pending' | 'in-progress' | 'completed'): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  /**
   * Get a single task by ID
   */
  findOne(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  /**
   * Create a new task
   */
  create(createTaskDto: CreateTaskDto): Task {
    const newTask: Task = {
      id: String(this.idCounter++),
      title: createTaskDto.title,
      description: createTaskDto.description || '',
      status: createTaskDto.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.push(newTask);
    return newTask;
  }

  /**
   * Update an existing task
   */
  update(id: string, updateTaskDto: UpdateTaskDto): Task | null {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      return null;
    }

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updateTaskDto,
      updatedAt: new Date(),
    };

    return this.tasks[taskIndex];
  }

  /**
   * Delete a task
   */
  delete(id: string): boolean {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      return false;
    }

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  /**
   * Get task statistics
   */
  getStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
    };
  }
}
```

## Step 4: Implement the Controller

Update `src/tasks/tasks.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from 'han-prev-core';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  /**
   * GET /tasks
   * Get all tasks or filter by status
   */
  @Get()
  findAll(@Query('status') status?: 'pending' | 'in-progress' | 'completed') {
    if (status) {
      return this.tasksService.findByStatus(status);
    }
    return this.tasksService.findAll();
  }

  /**
   * GET /tasks/stats
   * Get task statistics
   */
  @Get('stats')
  getStats() {
    return this.tasksService.getStats();
  }

  /**
   * GET /tasks/:id
   * Get a single task
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    const task = this.tasksService.findOne(id);

    if (!task) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    return {
      success: true,
      data: task,
    };
  }

  /**
   * POST /tasks
   * Create a new task
   */
  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    // Validation
    if (!createTaskDto.title || createTaskDto.title.trim() === '') {
      return {
        success: false,
        error: 'Title is required',
      };
    }

    const task = this.tasksService.create(createTaskDto);

    return {
      success: true,
      message: 'Task created successfully',
      data: task,
    };
  }

  /**
   * PUT /tasks/:id
   * Update a task
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const task = this.tasksService.update(id, updateTaskDto);

    if (!task) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    return {
      success: true,
      message: 'Task updated successfully',
      data: task,
    };
  }

  /**
   * DELETE /tasks/:id
   * Delete a task
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    const deleted = this.tasksService.delete(id);

    if (!deleted) {
      return {
        success: false,
        error: 'Task not found',
      };
    }

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }
}
```

## Step 5: Start the Server

```bash
npm run dev
```

Your server is now running at `http://localhost:3000`!

## Step 6: Test the API

### Create a Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Han Framework",
    "description": "Complete the first steps tutorial",
    "status": "in-progress"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "1",
    "title": "Learn Han Framework",
    "description": "Complete the first steps tutorial",
    "status": "in-progress",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Tasks

```bash
curl http://localhost:3000/tasks
```

### Get Tasks by Status

```bash
curl http://localhost:3000/tasks?status=in-progress
```

### Get a Single Task

```bash
curl http://localhost:3000/tasks/1
```

### Update a Task

```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Get Statistics

```bash
curl http://localhost:3000/tasks/stats
```

**Response:**
```json
{
  "total": 1,
  "pending": 0,
  "inProgress": 0,
  "completed": 1
}
```

### Delete a Task

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

## Step 7: Add More Features

### Add Priority Field

Update `create-task.dto.ts`:

```typescript
export class CreateTaskDto {
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high'; // ✅ New field
}
```

Update the interface and service accordingly.

### Add Due Date

```typescript
export class CreateTaskDto {
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date; // ✅ New field
}
```

### Add Search Functionality

```typescript
@Get('search')
search(@Query('q') query: string) {
  return this.tasksService.search(query);
}
```

In the service:

```typescript
search(query: string): Task[] {
  const lowerQuery = query.toLowerCase();
  return this.tasks.filter(
    task =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description.toLowerCase().includes(lowerQuery)
  );
}
```

## Step 8: Add Error Handling

Create `src/shared/exceptions/http-exception.ts`:

```typescript
export class HttpException extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}
```

Update the controller:

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  const task = this.tasksService.findOne(id);

  if (!task) {
    throw new HttpException('Task not found', 404);
  }

  return {
    success: true,
    data: task,
  };
}
```

## Step 9: Add Middleware for Logging

Generate middleware:

```bash
han generate middleware logger
```

Update `src/middleware/logger.middleware.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
        );
      });

      next();
    };
  }
}
```

Apply to TasksModule:

```typescript
import { Module, HanModule, MiddlewareConsumer } from 'han-prev-core';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  controllers: [TasksController],
  providers: [TasksService, LoggerMiddleware],
})
export class TasksModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(TasksController);
  }
}
```

## Complete Project Structure

```
task-manager/
├── src/
│   ├── tasks/
│   │   ├── dto/
│   │   │   ├── create-task.dto.ts
│   │   │   └── update-task.dto.ts
│   │   ├── interfaces/
│   │   │   └── task.interface.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   └── tasks.module.ts
│   ├── middleware/
│   │   └── logger.middleware.ts
│   ├── shared/
│   │   └── exceptions/
│   │       └── http-exception.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## What You've Learned

✅ Creating modules with `han generate resource`
✅ Implementing services with business logic
✅ Building REST API controllers
✅ Using DTOs for type safety
✅ Handling query parameters and route parameters
✅ Creating, reading, updating, and deleting resources
✅ Adding middleware for logging
✅ Error handling with custom exceptions
✅ Organizing code with modules

## Next Steps

Ready to learn more? Here are some suggestions:

### Add Database Integration

Replace in-memory storage with MongoDB:

```bash
npm install mongoose
```

Learn more: [Database Integration →](/techniques/mongoose)

### Add Validation

Use class-validator for automatic validation:

```bash
npm install class-validator class-transformer
```

Learn more: [Validation →](/techniques/validation)

### Add Authentication

Protect routes with JWT authentication:

```bash
npm install jsonwebtoken bcryptjs
```

Learn more: [Security →](/techniques/security)

### Add Testing

Write tests for your application:

```bash
npm install --save-dev han-prev-testing
```

Learn more: [Testing →](/techniques/testing)

### Deploy to Production

Build and deploy your application:

```bash
npm run build
npm start
```

## Tips & Tricks

### Use Environment Variables

```bash
# .env
PORT=3000
NODE_ENV=development
```

```typescript
// index.ts
import 'dotenv/config';

const port = process.env.PORT || 3000;
await app.listen(port);
```

### Add Global Prefix

```typescript
const app = await HanFactory.create(AppModule, {
  globalPrefix: 'api/v1', // All routes start with /api/v1
});
```

Now your routes are:
- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- etc.

### Enable CORS

```typescript
const app = await HanFactory.create(AppModule, {
  cors: true, // Enable CORS for all origins
});
```

### Add Request Body Size Limit

```typescript
const app = await HanFactory.create(AppModule, {
  bodyParser: {
    limit: '10mb',
  },
});
```

## Common Issues

### Port Already in Use

```bash
Error: listen EADDRINUSE :::3000
```

**Solution:** Change the port or kill the process:

```bash
lsof -i :3000
kill -9 <PID>
```

### Module Not Found

```bash
Cannot find module './tasks.service'
```

**Solution:** Check file paths and imports are correct.

### Decorator Errors

```
Experimental support for decorators...
```

**Solution:** Ensure `experimentalDecorators: true` in `tsconfig.json`.

## Congratulations! 🎉

You've built a complete REST API with Han Framework! You now understand:

- How to structure a Han Framework application
- How to create controllers and services
- How to handle HTTP requests and responses
- How to use dependency injection
- How to organize code with modules

Keep building and exploring! Check out the [Fundamentals](/fundamentals/controllers) section to dive deeper into Han Framework features.

## Need Help?

- 📖 [Documentation](/)
- 💬 [Discord Community](https://discord.gg/hanframework)
- 🐛 [Report Issues](https://github.com/sirkenedy/han/issues)
- 💡 [Discussions](https://github.com/sirkenedy/han/discussions)
