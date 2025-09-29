import { Injectable } from '@/decorators';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable()
export class AppService {
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date().toISOString()
    }
  ];

  getHello(): string {
    return 'Welcome to Han Framework! 🚀';
  }

  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'han-framework',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };
  }

  getApplicationInfo() {
    return {
      name: 'Han Framework',
      version: '1.0.0',
      description: 'A modern, developer-friendly Node.js framework',
      environment: process.env.NODE_ENV || 'development',
      features: [
        '🚀 Zero configuration',
        '🛡️ Security by default',
        '⚡ Lightning fast',
        '🔧 Developer friendly',
        '📦 Full TypeScript support',
        '🎯 NestJS compatible',
        '🔄 Auto-restart on changes',
        '📊 Built-in analytics'
      ],
      endpoints: {
        welcome: '/',
        health: '/health',
        info: '/info',
        users: '/users'
      }
    };
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  createUser(userData: { name: string; email: string }): User {
    // Check if email already exists
    if (this.users.some(user => user.email === userData.email)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    return newUser;
  }
}