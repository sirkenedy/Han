# Security

Learn how to secure your Han Framework application against common security threats and vulnerabilities.

## Why Security Matters

**One security breach can destroy your business.** User data leaks, SQL injections, and XSS attacks make headlines every day. Don't be the next victim.

**Common Security Threats:**
- 🔓 **SQL Injection** - Malicious code in database queries
- 🕸️ **Cross-Site Scripting (XSS)** - Injecting malicious scripts
- 🔑 **Weak Authentication** - Easily guessable or stolen passwords
- 📋 **Data Exposure** - Sensitive data visible in logs/errors
- ⚡ **DDoS Attacks** - Overwhelming your server with requests
- 🔐 **CSRF** - Forging requests from authenticated users

::: danger Real Cost of Security Breaches
- 💸 Average data breach costs **$4.35 million**
- 📉 60% of small companies **go out of business** within 6 months of an attack
- ⚖️ GDPR fines can reach **€20 million or 4% of global revenue**
:::

**The Good News:** Most attacks are preventable with basic security practices!

## Security Best Practices

### 1. Environment Variables

Never hardcode sensitive information:

```typescript
// ✅ Good - Use environment variables
const jwtSecret = process.env.JWT_SECRET;
const dbPassword = process.env.DB_PASSWORD;

// ❌ Bad - Hardcoded secrets
const jwtSecret = 'my-secret-key';
const dbPassword = 'admin123';
```

### 2. HTTPS Only

Always use HTTPS in production:

```typescript
// config/security.ts
export const securityConfig = {
  forceHttps: process.env.NODE_ENV === 'production',
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};
```

## Password Security

### Hashing Passwords

```bash
npm install bcryptjs
```

```typescript
// services/password.service.ts
import { Injectable } from 'han-prev-core';
import bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  validate(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
}
```

### Using in Controllers

```typescript
import { Controller, Post, Body } from 'han-prev-core';
import { PasswordService } from './services/password.service';

@Controller('auth')
export class AuthController {
  constructor(private passwordService: PasswordService) {}

  @Post('register')
  async register(@Body() body: any) {
    if (!this.passwordService.validate(body.password)) {
      throw new Error('Password does not meet security requirements');
    }

    const hashedPassword = await this.passwordService.hash(body.password);

    return await User.create({
      email: body.email,
      password: hashedPassword,
    });
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await User.findOne({ email: body.email });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.passwordService.compare(
      body.password,
      user.password
    );

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return { token: this.generateToken(user) };
  }
}
```

## JWT Authentication

### JWT Service

```bash
npm install jsonwebtoken
```

```typescript
// services/jwt.service.ts
import { Injectable } from 'han-prev-core';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private secret = process.env.JWT_SECRET!;
  private expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  sign(payload: any): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  decode(token: string): any {
    return jwt.decode(token);
  }
}
```

### Auth Guard with JWT

```typescript
// guards/jwt-auth.guard.ts
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    try {
      const payload = this.jwtService.verify(parts[1]);
      request.user = payload;
      return true;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```

## Input Validation & Sanitization

### Preventing SQL Injection

```typescript
// ✅ Good - Use parameterized queries
const user = await User.findOne({ email: userEmail });

// ❌ Bad - String concatenation (vulnerable)
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### Preventing XSS

```bash
npm install sanitize-html
```

```typescript
// services/sanitizer.service.ts
import { Injectable } from 'han-prev-core';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizerService {
  sanitize(dirty: string): string {
    return sanitizeHtml(dirty, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
      allowedAttributes: {
        'a': ['href'],
      },
    });
  }

  sanitizeStrict(dirty: string): string {
    return sanitizeHtml(dirty, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
}
```

### Using Validation

```typescript
import { IsString, IsEmail, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreatePostDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  content: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  authorEmail: string;
}
```

## CORS Configuration

### Setting up CORS

```bash
npm install cors @types/cors
```

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import cors from 'cors';

const bootstrap = async () => {
  const app = await HanFactory.create(AppModule);
  const expressApp = app.getHttpServer();

  // Configure CORS
  expressApp.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }));

  await app.listen(3000);
};

bootstrap();
```

### Custom CORS Middleware

```typescript
// middleware/cors.middleware.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class CorsMiddleware {
  use(req: any, res: any, next: any) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  }
}
```

## Rate Limiting

### Basic Rate Limiter

```typescript
// middleware/rate-limit.middleware.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class RateLimitMiddleware {
  private requests = new Map<string, number[]>();
  private maxRequests = 100;
  private windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: any, res: any, next: any) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    const userRequests = this.requests.get(ip) || [];
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(this.windowMs / 1000),
      });
    }

    validRequests.push(now);
    this.requests.set(ip, validRequests);

    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (this.maxRequests - validRequests.length).toString());

    next();
  }
}
```

### Using express-rate-limit

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

expressApp.use('/api/', limiter);
```

## Security Headers

### Using Helmet

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

expressApp.use(helmet());

// Or configure specific options
expressApp.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### Manual Security Headers

```typescript
// middleware/security-headers.middleware.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class SecurityHeadersMiddleware {
  use(req: any, res: any, next: any) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'no-referrer');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');

    // HSTS
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    next();
  }
}
```

## CSRF Protection

```bash
npm install csurf
```

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

expressApp.use(cookieParser());
expressApp.use(csrf({ cookie: true }));

// Add CSRF token to responses
expressApp.use((req: any, res: any, next: any) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

## SQL Injection Prevention

### Using Mongoose (MongoDB)

```typescript
// ✅ Good - Mongoose automatically escapes
const user = await User.findOne({ email: userInput });

// ✅ Good - Query operators are safe
const users = await User.find({
  age: { $gte: 18 },
  name: { $regex: searchTerm, $options: 'i' },
});
```

### Input Validation

```typescript
import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9!@#$%^&*]{8,}$/)
  password: string;
}
```

## Session Security

### Secure Session Configuration

```bash
npm install express-session
```

```typescript
import session from 'express-session';

expressApp.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict', // CSRF protection
    },
  })
);
```

## File Upload Security

```bash
npm install multer
```

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

expressApp.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file?.filename });
});
```

## Logging & Monitoring

### Security Event Logging

```typescript
// services/security-logger.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class SecurityLoggerService {
  logLoginAttempt(email: string, success: boolean, ip: string) {
    console.log({
      event: 'LOGIN_ATTEMPT',
      email,
      success,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logUnauthorizedAccess(path: string, ip: string) {
    console.log({
      event: 'UNAUTHORIZED_ACCESS',
      path,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logSuspiciousActivity(description: string, details: any) {
    console.log({
      event: 'SUSPICIOUS_ACTIVITY',
      description,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## API Key Authentication

```typescript
// guards/api-key.guard.ts
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private validApiKeys = process.env.API_KEYS?.split(',') || [];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (!this.validApiKeys.includes(apiKey)) {
      throw new Error('Invalid API key');
    }

    return true;
  }
}
```

## Best Practices Checklist

```typescript
// security-checklist.md

## Authentication & Authorization
- [ ] Use strong password hashing (bcrypt, scrypt)
- [ ] Implement JWT with proper expiration
- [ ] Use HTTPS in production
- [ ] Implement proper session management
- [ ] Use secure cookies (httpOnly, secure, sameSite)

## Input Validation
- [ ] Validate all user inputs
- [ ] Sanitize HTML content
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Validate file uploads

## Security Headers
- [ ] Use Helmet.js
- [ ] Set Content-Security-Policy
- [ ] Enable HSTS
- [ ] Set X-Frame-Options
- [ ] Set X-Content-Type-Options

## Data Protection
- [ ] Never commit secrets to version control
- [ ] Use environment variables for sensitive data
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for data in transit
- [ ] Implement proper error handling (don't leak info)

## Monitoring
- [ ] Log security events
- [ ] Monitor failed login attempts
- [ ] Set up alerts for suspicious activity
- [ ] Regular security audits
- [ ] Keep dependencies updated
```

## Quick Reference

```typescript
// Password hashing
const hash = await bcrypt.hash(password, 10);
const valid = await bcrypt.compare(password, hash);

// JWT
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
const decoded = jwt.verify(token, secret);

// Input sanitization
const clean = sanitizeHtml(dirty);

// CORS
app.use(cors({ origin: 'https://example.com' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Security headers
app.use(helmet());
```

## Next Steps

- Learn about [Validation](/techniques/validation) for input validation
- Explore [Configuration](/techniques/configuration) for secrets management
- Check out [Middleware](/techniques/middleware) for security middleware

Security should be a top priority in every application! 🔒
