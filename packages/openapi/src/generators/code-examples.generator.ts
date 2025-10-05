/**
 * Code Examples Generator
 * Generates code examples in multiple languages for API endpoints
 */

import {
  CodeExample,
  CodeExampleConfig,
  CodeGeneratorConfig,
  SupportedLanguage,
} from "../interfaces/developer-experience.interface";

const DEFAULT_CONFIG: Required<CodeGeneratorConfig> = {
  enabled: true,
  languages: ["typescript", "javascript", "python", "curl"],
  includeComments: true,
  includeErrorHandling: true,
  includeTypeDefinitions: true,
  framework: {
    typescript: "fetch",
    javascript: "fetch",
    python: "requests",
  },
};

/**
 * Code Examples Generator
 */
export class CodeExamplesGenerator {
  private config: Required<CodeGeneratorConfig>;

  constructor(config: Partial<CodeGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate code examples for all configured languages
   */
  generateExamples(exampleConfig: CodeExampleConfig): CodeExample[] {
    const examples: CodeExample[] = [];

    for (const language of this.config.languages!) {
      const example = this.generateExample(language, exampleConfig);
      if (example) {
        examples.push(example);
      }
    }

    return examples;
  }

  /**
   * Generate code example for a specific language
   */
  generateExample(
    language: SupportedLanguage,
    config: CodeExampleConfig,
  ): CodeExample | null {
    switch (language) {
      case "typescript":
        return this.generateTypeScriptExample(config);
      case "javascript":
        return this.generateJavaScriptExample(config);
      case "python":
        return this.generatePythonExample(config);
      case "curl":
        return this.generateCurlExample(config);
      case "go":
        return this.generateGoExample(config);
      case "java":
        return this.generateJavaExample(config);
      case "csharp":
        return this.generateCSharpExample(config);
      case "php":
        return this.generatePhpExample(config);
      case "ruby":
        return this.generateRubyExample(config);
      case "swift":
        return this.generateSwiftExample(config);
      default:
        return null;
    }
  }

  /**
   * Generate TypeScript example
   */
  private generateTypeScriptExample(config: CodeExampleConfig): CodeExample {
    const framework = this.config.framework?.typescript || "fetch";
    let code = "";

    // Add type definitions if enabled
    if (this.config.includeTypeDefinitions && config.parameters?.body) {
      code += this.generateTypeScriptInterface(config.parameters.body);
      code += "\n\n";
    }

    // Add comment
    if (this.config.includeComments) {
      code += `// ${config.method} ${config.endpoint}\n`;
    }

    if (framework === "axios") {
      code += this.generateTypeScriptAxios(config);
    } else if (framework === "node-fetch") {
      code += this.generateTypeScriptNodeFetch(config);
    } else {
      code += this.generateTypeScriptFetch(config);
    }

    return {
      language: "typescript",
      code,
      description: `TypeScript example using ${framework}`,
      dependencies: this.getTypeScriptDependencies(framework),
    };
  }

  /**
   * Generate TypeScript fetch example
   */
  private generateTypeScriptFetch(config: CodeExampleConfig): string {
    const url = this.buildUrl(config);
    const hasBody = config.parameters?.body && config.method !== "GET";

    let code = `async function ${this.getFunctionName(config)}() {\n`;

    if (this.config.includeErrorHandling) {
      code += `  try {\n`;
    }

    code += `    const response = await fetch('${url}', {\n`;
    code += `      method: '${config.method}',\n`;

    // Add headers
    const headers = this.buildHeaders(config);
    if (Object.keys(headers).length > 0) {
      code += `      headers: ${JSON.stringify(headers, null, 6)},\n`;
    }

    // Add body
    if (hasBody) {
      code += `      body: JSON.stringify(${JSON.stringify(config.parameters?.body, null, 6)}),\n`;
    }

    code += `    });\n\n`;
    code += `    if (!response.ok) {\n`;
    code += `      throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
    code += `    }\n\n`;
    code += `    const data = await response.json();\n`;
    code += `    return data;\n`;

    if (this.config.includeErrorHandling) {
      code += `  } catch (error) {\n`;
      code += `    console.error('Error:', error);\n`;
      code += `    throw error;\n`;
      code += `  }\n`;
    }

    code += `}\n`;

    return code;
  }

  /**
   * Generate TypeScript axios example
   */
  private generateTypeScriptAxios(config: CodeExampleConfig): string {
    const url = this.buildUrl(config);
    let code = `import axios from 'axios';\n\n`;
    code += `async function ${this.getFunctionName(config)}() {\n`;

    if (this.config.includeErrorHandling) {
      code += `  try {\n`;
    }

    code += `    const response = await axios({\n`;
    code += `      method: '${config.method.toLowerCase()}',\n`;
    code += `      url: '${url}',\n`;

    const headers = this.buildHeaders(config);
    if (Object.keys(headers).length > 0) {
      code += `      headers: ${JSON.stringify(headers, null, 6)},\n`;
    }

    if (config.parameters?.body && config.method !== "GET") {
      code += `      data: ${JSON.stringify(config.parameters.body, null, 6)},\n`;
    }

    code += `    });\n\n`;
    code += `    return response.data;\n`;

    if (this.config.includeErrorHandling) {
      code += `  } catch (error) {\n`;
      code += `    if (axios.isAxiosError(error)) {\n`;
      code += `      console.error('API Error:', error.response?.data);\n`;
      code += `    }\n`;
      code += `    throw error;\n`;
      code += `  }\n`;
    }

    code += `}\n`;

    return code;
  }

  /**
   * Generate TypeScript node-fetch example
   */
  private generateTypeScriptNodeFetch(config: CodeExampleConfig): string {
    let code = `import fetch from 'node-fetch';\n\n`;
    code += this.generateTypeScriptFetch(config);
    return code;
  }

  /**
   * Generate TypeScript interface
   */
  private generateTypeScriptInterface(body: any): string {
    let code = `interface RequestBody {\n`;

    for (const [key, value] of Object.entries(body)) {
      const type = typeof value;
      code += `  ${key}: ${type};\n`;
    }

    code += `}\n`;
    return code;
  }

  /**
   * Generate JavaScript example
   */
  private generateJavaScriptExample(config: CodeExampleConfig): CodeExample {
    const framework = this.config.framework?.javascript || "fetch";
    let code = "";

    if (this.config.includeComments) {
      code += `// ${config.method} ${config.endpoint}\n`;
    }

    if (framework === "axios") {
      code += `const axios = require('axios');\n\n`;
      code += this.generateTypeScriptAxios(config).replace(
        /import axios from 'axios';/,
        "",
      );
    } else {
      code += this.generateTypeScriptFetch(config);
    }

    return {
      language: "javascript",
      code,
      description: `JavaScript example using ${framework}`,
      dependencies: framework === "axios" ? ["axios"] : [],
    };
  }

  /**
   * Generate Python example
   */
  private generatePythonExample(config: CodeExampleConfig): CodeExample {
    const framework = this.config.framework?.python || "requests";
    let code = "";

    if (framework === "requests") {
      code += `import requests\n`;
      if (this.config.includeComments) {
        code += `import json\n`;
      }
      code += `\n`;

      if (this.config.includeComments) {
        code += `# ${config.method} ${config.endpoint}\n`;
      }

      code += `def ${this.getFunctionName(config)
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()}():\n`;

      const url = this.buildUrl(config);
      const headers = this.buildHeaders(config);

      if (this.config.includeErrorHandling) {
        code += `    try:\n`;
      }

      code += `        response = requests.${config.method.toLowerCase()}(\n`;
      code += `            '${url}',\n`;

      if (Object.keys(headers).length > 0) {
        code += `            headers=${this.pythonDict(headers)},\n`;
      }

      if (config.parameters?.body && config.method !== "GET") {
        code += `            json=${this.pythonDict(config.parameters.body)},\n`;
      }

      code += `        )\n\n`;
      code += `        response.raise_for_status()\n`;
      code += `        return response.json()\n`;

      if (this.config.includeErrorHandling) {
        code += `    except requests.exceptions.RequestException as e:\n`;
        code += `        print(f'Error: {e}')\n`;
        code += `        raise\n`;
      }
    }

    return {
      language: "python",
      code,
      description: `Python example using ${framework}`,
      dependencies: [framework],
    };
  }

  /**
   * Generate curl example
   */
  private generateCurlExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `curl -X ${config.method} '${url}'`;

    // Add headers
    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += ` \\\n  -H '${key}: ${value}'`;
    }

    // Add body
    if (config.parameters?.body && config.method !== "GET") {
      code += ` \\\n  -d '${JSON.stringify(config.parameters.body)}'`;
    }

    return {
      language: "curl",
      code,
      description: "curl command",
      dependencies: [],
    };
  }

  /**
   * Generate Go example
   */
  private generateGoExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `package main\n\n`;
    code += `import (\n`;
    code += `    "bytes"\n`;
    code += `    "encoding/json"\n`;
    code += `    "fmt"\n`;
    code += `    "io/ioutil"\n`;
    code += `    "net/http"\n`;
    code += `)\n\n`;

    code += `func ${this.getFunctionName(config)}() error {\n`;

    if (config.parameters?.body && config.method !== "GET") {
      code += `    payload := map[string]interface{}${this.goMap(config.parameters.body)}\n`;
      code += `    jsonData, err := json.Marshal(payload)\n`;
      code += `    if err != nil {\n`;
      code += `        return err\n`;
      code += `    }\n\n`;
      code += `    req, err := http.NewRequest("${config.method}", "${url}", bytes.NewBuffer(jsonData))\n`;
    } else {
      code += `    req, err := http.NewRequest("${config.method}", "${url}", nil)\n`;
    }

    code += `    if err != nil {\n`;
    code += `        return err\n`;
    code += `    }\n\n`;

    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += `    req.Header.Set("${key}", "${value}")\n`;
    }

    code += `\n    client := &http.Client{}\n`;
    code += `    resp, err := client.Do(req)\n`;
    code += `    if err != nil {\n`;
    code += `        return err\n`;
    code += `    }\n`;
    code += `    defer resp.Body.Close()\n\n`;
    code += `    body, _ := ioutil.ReadAll(resp.Body)\n`;
    code += `    fmt.Println(string(body))\n`;
    code += `    return nil\n`;
    code += `}\n`;

    return {
      language: "go",
      code,
      description: "Go example using net/http",
      dependencies: [],
    };
  }

  /**
   * Generate Java example
   */
  private generateJavaExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `import java.net.http.*;\nimport java.net.URI;\n\n`;

    code += `public class ApiClient {\n`;
    code += `    public static void ${this.getFunctionName(config)}() throws Exception {\n`;
    code += `        HttpClient client = HttpClient.newHttpClient();\n\n`;

    code += `        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()\n`;
    code += `            .uri(URI.create("${url}"))\n`;
    code += `            .method("${config.method}", `;

    if (config.parameters?.body && config.method !== "GET") {
      code += `HttpRequest.BodyPublishers.ofString("${JSON.stringify(config.parameters.body)}"))\n`;
    } else {
      code += `HttpRequest.BodyPublishers.noBody())\n`;
    }

    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += `            .header("${key}", "${value}")\n`;
    }

    code += `\n        HttpResponse<String> response = client.send(\n`;
    code += `            requestBuilder.build(),\n`;
    code += `            HttpResponse.BodyHandlers.ofString()\n`;
    code += `        );\n\n`;
    code += `        System.out.println(response.body());\n`;
    code += `    }\n`;
    code += `}\n`;

    return {
      language: "java",
      code,
      description: "Java example using HttpClient",
      dependencies: [],
    };
  }

  /**
   * Generate C# example
   */
  private generateCSharpExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `using System;\nusing System.Net.Http;\nusing System.Text;\nusing System.Threading.Tasks;\n\n`;

    code += `public class ApiClient\n{\n`;
    code += `    public static async Task ${this.getFunctionName(config)}()\n`;
    code += `    {\n`;
    code += `        using var client = new HttpClient();\n\n`;

    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += `        client.DefaultRequestHeaders.Add("${key}", "${value}");\n`;
    }

    if (config.parameters?.body && config.method !== "GET") {
      code += `\n        var content = new StringContent(\n`;
      code += `            "${JSON.stringify(config.parameters.body).replace(/"/g, '\\"')}",\n`;
      code += `            Encoding.UTF8,\n`;
      code += `            "application/json"\n`;
      code += `        );\n\n`;
      code += `        var response = await client.${this.capitalize(config.method.toLowerCase())}Async("${url}", content);\n`;
    } else {
      code += `\n        var response = await client.${this.capitalize(config.method.toLowerCase())}Async("${url}");\n`;
    }

    code += `        response.EnsureSuccessStatusCode();\n`;
    code += `        var result = await response.Content.ReadAsStringAsync();\n`;
    code += `        Console.WriteLine(result);\n`;
    code += `    }\n`;
    code += `}\n`;

    return {
      language: "csharp",
      code,
      description: "C# example using HttpClient",
      dependencies: [],
    };
  }

  /**
   * Generate PHP example
   */
  private generatePhpExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `<?php\n\n`;

    code += `function ${this.getFunctionName(config)}() {\n`;
    code += `    $ch = curl_init();\n\n`;
    code += `    curl_setopt($ch, CURLOPT_URL, '${url}');\n`;
    code += `    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
    code += `    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${config.method}');\n\n`;

    const headers = this.buildHeaders(config);
    if (Object.keys(headers).length > 0) {
      code += `    curl_setopt($ch, CURLOPT_HTTPHEADER, [\n`;
      for (const [key, value] of Object.entries(headers)) {
        code += `        '${key}: ${value}',\n`;
      }
      code += `    ]);\n\n`;
    }

    if (config.parameters?.body && config.method !== "GET") {
      code += `    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${this.phpArray(config.parameters.body)}));\n\n`;
    }

    code += `    $response = curl_exec($ch);\n`;
    code += `    curl_close($ch);\n\n`;
    code += `    return json_decode($response, true);\n`;
    code += `}\n`;

    return {
      language: "php",
      code,
      description: "PHP example using cURL",
      dependencies: [],
    };
  }

  /**
   * Generate Ruby example
   */
  private generateRubyExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `require 'net/http'\nrequire 'json'\n\n`;

    code += `def ${this.getFunctionName(config)
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()}\n`;
    code += `  uri = URI('${url}')\n`;
    code += `  http = Net::HTTP.new(uri.host, uri.port)\n`;
    code += `  http.use_ssl = true if uri.scheme == 'https'\n\n`;

    code += `  request = Net::HTTP::${this.capitalize(config.method.toLowerCase())}.new(uri)\n`;

    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += `  request['${key}'] = '${value}'\n`;
    }

    if (config.parameters?.body && config.method !== "GET") {
      code += `  request.body = ${this.rubyHash(config.parameters.body)}.to_json\n`;
    }

    code += `\n  response = http.request(request)\n`;
    code += `  JSON.parse(response.body)\n`;
    code += `end\n`;

    return {
      language: "ruby",
      code,
      description: "Ruby example using Net::HTTP",
      dependencies: [],
    };
  }

  /**
   * Generate Swift example
   */
  private generateSwiftExample(config: CodeExampleConfig): CodeExample {
    const url = this.buildUrl(config);
    let code = `import Foundation\n\n`;

    code += `func ${this.getFunctionName(config)}() async throws {\n`;
    code += `    guard let url = URL(string: "${url}") else {\n`;
    code += `        throw URLError(.badURL)\n`;
    code += `    }\n\n`;

    code += `    var request = URLRequest(url: url)\n`;
    code += `    request.httpMethod = "${config.method}"\n`;

    const headers = this.buildHeaders(config);
    for (const [key, value] of Object.entries(headers)) {
      code += `    request.setValue("${value}", forHTTPHeaderField: "${key}")\n`;
    }

    if (config.parameters?.body && config.method !== "GET") {
      code += `\n    let body = ${this.swiftDict(config.parameters.body)}\n`;
      code += `    request.httpBody = try JSONSerialization.data(withJSONObject: body)\n`;
    }

    code += `\n    let (data, response) = try await URLSession.shared.data(for: request)\n`;
    code += `    let result = try JSONSerialization.jsonObject(with: data)\n`;
    code += `    print(result)\n`;
    code += `}\n`;

    return {
      language: "swift",
      code,
      description: "Swift example using URLSession",
      dependencies: [],
    };
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(config: CodeExampleConfig): string {
    let url = (config.baseUrl || "https://api.example.com") + config.endpoint;

    // Replace path parameters
    if (config.parameters?.path) {
      for (const [key, value] of Object.entries(config.parameters.path)) {
        url = url.replace(`:${key}`, String(value));
        url = url.replace(`{${key}}`, String(value));
      }
    }

    // Add query parameters
    if (config.parameters?.query) {
      const queryString = new URLSearchParams(
        config.parameters.query as any,
      ).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Build headers object
   */
  private buildHeaders(config: CodeExampleConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add custom headers
    if (config.parameters?.header) {
      Object.assign(headers, config.parameters.header);
    }

    // Add auth header
    if (config.auth) {
      if (config.auth.type === "bearer") {
        headers["Authorization"] =
          `Bearer ${config.auth.value || "YOUR_TOKEN"}`;
      } else if (config.auth.type === "apikey") {
        headers["X-API-Key"] = config.auth.value || "YOUR_API_KEY";
      }
    }

    return headers;
  }

  /**
   * Get function name from endpoint
   */
  private getFunctionName(config: CodeExampleConfig): string {
    const method = config.method.toLowerCase();
    const parts = config.endpoint.split("/").filter(Boolean);
    const name = parts[parts.length - 1] || "request";
    return `${method}${this.capitalize(name.replace(/[^a-zA-Z0-9]/g, ""))}`;
  }

  /**
   * Get TypeScript dependencies
   */
  private getTypeScriptDependencies(framework: string): string[] {
    if (framework === "axios") return ["axios"];
    if (framework === "node-fetch") return ["node-fetch", "@types/node-fetch"];
    return [];
  }

  /**
   * Convert JS object to Python dict string
   */
  private pythonDict(obj: any): string {
    return JSON.stringify(obj).replace(/"/g, "'").replace(/null/g, "None");
  }

  /**
   * Convert JS object to Go map string
   */
  private goMap(obj: any): string {
    return JSON.stringify(obj, null, 4);
  }

  /**
   * Convert JS object to PHP array string
   */
  private phpArray(obj: any): string {
    return JSON.stringify(obj, null, 4);
  }

  /**
   * Convert JS object to Ruby hash string
   */
  private rubyHash(obj: any): string {
    return JSON.stringify(obj).replace(/"/g, "'");
  }

  /**
   * Convert JS object to Swift dictionary string
   */
  private swiftDict(obj: any): string {
    const entries = Object.entries(obj)
      .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
      .join(", ");
    return `[${entries}]`;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
