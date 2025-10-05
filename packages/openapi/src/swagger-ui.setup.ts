import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { OpenAPIDocument } from "./interfaces/openapi.interface";
import { DeveloperExperienceConfig } from "./interfaces/developer-experience.interface";
import { createHanOpenAPIPlugin } from "./swagger-ui.plugin";

export interface SwaggerUIOptions {
  /**
   * Path where Swagger UI will be available
   * @default '/api-docs'
   */
  path?: string;

  /**
   * Custom CSS for Swagger UI
   */
  customCss?: string;

  /**
   * Custom CSS URL
   */
  customCssUrl?: string;

  /**
   * Custom site title
   */
  customSiteTitle?: string;

  /**
   * Custom favicon
   */
  customfavIcon?: string;

  /**
   * Swagger UI configuration options
   */
  swaggerOptions?: Record<string, any>;

  /**
   * Explorer enabled
   * @default true
   */
  explorer?: boolean;

  /**
   * Custom Swagger UI HTML
   */
  customJs?: string;

  /**
   * Developer Experience Features Configuration
   * Enable request chaining, code examples, and Postman export
   */
  developerExperience?: DeveloperExperienceConfig;
}

/**
 * Setup Swagger UI for an Express application
 */
export class SwaggerModule {
  /**
   * Setup Swagger UI middleware
   *
   * @example
   * ```typescript
   * const document = new DocumentBuilder()
   *   .setTitle('My API')
   *   .setVersion('1.0')
   *   .build();
   *
   * SwaggerModule.setup('/api-docs', app, document);
   * ```
   */
  static setup(
    path: string | SwaggerUIOptions,
    app: Express,
    document: OpenAPIDocument,
    options?: SwaggerUIOptions,
  ): void {
    let finalPath: string;
    let finalOptions: SwaggerUIOptions;

    if (typeof path === "string") {
      finalPath = path;
      finalOptions = options || {};
    } else {
      finalOptions = path;
      finalPath = path.path || "/api-docs";
    }

    // Setup Swagger UI options
    const swaggerUiOptions: any = {
      explorer: finalOptions.explorer !== false,
      ...finalOptions.swaggerOptions,
    };

    // Add Developer Experience plugin if enabled
    if (finalOptions.developerExperience) {
      const plugin = createHanOpenAPIPlugin(finalOptions.developerExperience);
      swaggerUiOptions.plugins = [...(swaggerUiOptions.plugins || []), plugin];
    }

    const uiSetup = swaggerUi.setup(document, {
      customCss: finalOptions.customCss,
      customCssUrl: finalOptions.customCssUrl,
      customSiteTitle:
        finalOptions.customSiteTitle ||
        document.info?.title ||
        "API Documentation",
      customfavIcon: finalOptions.customfavIcon,
      swaggerOptions: swaggerUiOptions,
      customJs: finalOptions.customJs,
    });

    // Serve Swagger UI
    app.use(finalPath, swaggerUi.serve);
    app.get(finalPath, uiSetup);

    // Serve JSON document
    app.get(`${finalPath}-json`, (req: Request, res: Response) => {
      res.json(document);
    });

    // Serve YAML document (if needed)
    app.get(`${finalPath}-yaml`, (req: Request, res: Response) => {
      res.setHeader("Content-Type", "text/yaml");
      res.send(this.convertToYaml(document));
    });

    console.log(`📚 Swagger UI available at: ${finalPath}`);
    console.log(`📄 OpenAPI JSON available at: ${finalPath}-json`);
    console.log(`📄 OpenAPI YAML available at: ${finalPath}-yaml`);
  }

  /**
   * Create OpenAPI document from controllers
   */
  static createDocument(
    app: Express,
    options: any,
    controllers: any[],
  ): OpenAPIDocument {
    const { DocumentBuilder } = require("./builders/document.builder");
    const { DocumentScanner } = require("./builders/document.scanner");

    const builder = new DocumentBuilder();

    if (options.title) builder.setTitle(options.title);
    if (options.description) builder.setDescription(options.description);
    if (options.version) builder.setVersion(options.version);
    if (options.termsOfService)
      builder.setTermsOfService(options.termsOfService);
    if (options.contact)
      builder.setContact(
        options.contact.name,
        options.contact.url,
        options.contact.email,
      );
    if (options.license)
      builder.setLicense(options.license.name, options.license.url);

    if (options.servers) {
      options.servers.forEach((server: any) => {
        builder.addServer(server.url, server.description);
      });
    }

    if (options.tags) {
      options.tags.forEach((tag: any) => {
        builder.addTag(tag.name, tag.description, tag.externalDocs);
      });
    }

    const scanner = new DocumentScanner(builder);
    return scanner.scanControllers(controllers);
  }

  /**
   * Convert OpenAPI document to YAML format
   */
  private static convertToYaml(document: OpenAPIDocument): string {
    // Simple YAML conversion (you can use a library like 'js-yaml' for production)
    const yaml = this.objectToYaml(document, 0);
    return yaml;
  }

  private static objectToYaml(obj: any, indent: number): string {
    const spaces = "  ".repeat(indent);
    let yaml = "";

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (typeof value === "object" && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item: any) => {
          if (typeof item === "object") {
            yaml += `${spaces}- \n`;
            yaml += this.objectToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return yaml;
  }
}
