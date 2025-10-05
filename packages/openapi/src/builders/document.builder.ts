import "reflect-metadata";
import {
  OpenAPIDocument,
  OpenAPIInfo,
  OpenAPIServer,
  OpenAPITag,
  OpenAPIComponents,
  OpenAPISecurityScheme,
  OpenAPIPaths,
  OpenAPIPathItem,
  OpenAPIOperation,
  OpenAPIResponse,
  OpenAPIParameter,
  OpenAPIRequestBody,
} from "../interfaces/openapi.interface";
import {
  DEFAULT_OPENAPI_VERSION,
  OPENAPI_METADATA_KEYS,
  CONTENT_TYPES,
} from "../constants";
import { SchemaGenerator } from "../utils/schema-generator";

export interface DocumentBuilderOptions {
  title: string;
  description?: string;
  version: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
  servers?: OpenAPIServer[];
  tags?: OpenAPITag[];
}

/**
 * Builder class for creating OpenAPI documents
 */
export class DocumentBuilder {
  private document: Partial<OpenAPIDocument>;

  constructor() {
    this.document = {
      openapi: DEFAULT_OPENAPI_VERSION,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
        responses: {},
        parameters: {},
      },
    };
  }

  /**
   * Set API information
   */
  setTitle(title: string): this {
    this.ensureInfo();
    this.document.info!.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.ensureInfo();
    this.document.info!.description = description;
    return this;
  }

  setVersion(version: string): this {
    this.ensureInfo();
    this.document.info!.version = version;
    return this;
  }

  setTermsOfService(termsOfService: string): this {
    this.ensureInfo();
    this.document.info!.termsOfService = termsOfService;
    return this;
  }

  setContact(name: string, url?: string, email?: string): this {
    this.ensureInfo();
    this.document.info!.contact = { name, url, email };
    return this;
  }

  setLicense(name: string, url?: string): this {
    this.ensureInfo();
    this.document.info!.license = { name, url };
    return this;
  }

  /**
   * Add server
   */
  addServer(url: string, description?: string): this {
    if (!this.document.servers) {
      this.document.servers = [];
    }
    this.document.servers.push({ url, description });
    return this;
  }

  /**
   * Add tag
   */
  addTag(
    name: string,
    description?: string,
    externalDocs?: { url: string; description?: string },
  ): this {
    if (!this.document.tags) {
      this.document.tags = [];
    }
    this.document.tags.push({ name, description, externalDocs });
    return this;
  }

  /**
   * Add multiple tags in order
   *
   * @example
   * ```typescript
   * builder.addTagsInOrder([
   *   { name: 'Authentication', description: 'Auth endpoints' },
   *   { name: 'Users', description: 'User management' },
   *   { name: 'Products', description: 'Product catalog' },
   * ])
   * ```
   */
  addTagsInOrder(
    tags: Array<{
      name: string;
      description?: string;
      externalDocs?: { url: string; description?: string };
    }>,
  ): this {
    if (!this.document.tags) {
      this.document.tags = [];
    }
    tags.forEach((tag) => {
      this.document.tags!.push(tag);
    });
    return this;
  }

  /**
   * Set tag order explicitly
   * Tags not in the order array will appear after ordered tags
   *
   * @example
   * ```typescript
   * builder.setTagOrder(['Authentication', 'Users', 'Products', 'Admin'])
   * ```
   */
  setTagOrder(orderedTagNames: string[]): this {
    if (!this.document.tags || this.document.tags.length === 0) {
      return this;
    }

    const tagMap = new Map(this.document.tags.map((tag) => [tag.name, tag]));
    const orderedTags: typeof this.document.tags = [];
    const remainingTags: typeof this.document.tags = [];

    // Add tags in specified order
    orderedTagNames.forEach((name) => {
      const tag = tagMap.get(name);
      if (tag) {
        orderedTags.push(tag);
        tagMap.delete(name);
      }
    });

    // Add remaining tags (not in order list)
    tagMap.forEach((tag) => {
      remainingTags.push(tag);
    });

    this.document.tags = [...orderedTags, ...remainingTags];
    return this;
  }

  /**
   * Sort tags alphabetically
   */
  sortTagsAlphabetically(): this {
    if (!this.document.tags || this.document.tags.length === 0) {
      return this;
    }

    this.document.tags.sort((a, b) => a.name.localeCompare(b.name));
    return this;
  }

  /**
   * Add security schemes
   */
  addBearerAuth(
    name: string = "bearer",
    options: { description?: string; bearerFormat?: string } = {},
  ): this {
    this.ensureComponents();
    this.document.components!.securitySchemes![name] = {
      type: "http",
      scheme: "bearer",
      bearerFormat: options.bearerFormat || "JWT",
      description: options.description,
    };
    return this;
  }

  addBasicAuth(name: string = "basic", description?: string): this {
    this.ensureComponents();
    this.document.components!.securitySchemes![name] = {
      type: "http",
      scheme: "basic",
      description,
    };
    return this;
  }

  addApiKey(
    name: string = "api-key",
    options: {
      keyName: string;
      in: "header" | "query" | "cookie";
      description?: string;
    },
  ): this {
    this.ensureComponents();
    this.document.components!.securitySchemes![name] = {
      type: "apiKey",
      name: options.keyName,
      in: options.in,
      description: options.description,
    };
    return this;
  }

  addOAuth2(
    name: string = "oauth2",
    flows: {
      authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
      };
      implicit?: {
        authorizationUrl: string;
        scopes: Record<string, string>;
      };
      password?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
      };
      clientCredentials?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
      };
    },
    description?: string,
  ): this {
    this.ensureComponents();
    this.document.components!.securitySchemes![name] = {
      type: "oauth2",
      flows,
      description,
    };
    return this;
  }

  /**
   * Add global security requirement
   */
  addSecurity(name: string, scopes: string[] = []): this {
    if (!this.document.security) {
      this.document.security = [];
    }
    this.document.security.push({ [name]: scopes });
    return this;
  }

  /**
   * Build the final document
   */
  build(): OpenAPIDocument {
    this.ensureInfo();

    return this.document as OpenAPIDocument;
  }

  /**
   * Get the current document state
   */
  getDocument(): Partial<OpenAPIDocument> {
    return this.document;
  }

  /**
   * Set the entire document
   */
  setDocument(document: Partial<OpenAPIDocument>): this {
    this.document = document;
    return this;
  }

  private ensureInfo(): void {
    if (!this.document.info) {
      this.document.info = {
        title: "API Documentation",
        version: "1.0.0",
      };
    }
  }

  private ensureComponents(): void {
    if (!this.document.components) {
      this.document.components = {
        schemas: {},
        securitySchemes: {},
      };
    }
    if (!this.document.components.securitySchemes) {
      this.document.components.securitySchemes = {};
    }
  }
}
