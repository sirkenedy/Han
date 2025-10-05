/**
 * Custom Swagger UI Plugin for Developer Experience Features
 * Adds request chaining, code examples, and Postman export to Swagger UI
 */

import { getChainStorage } from "./playground/chain-storage";
import { ChainExecutor } from "./playground/chain-executor";
import { PostmanGenerator } from "./generators/postman.generator";
import { CodeExamplesGenerator } from "./generators/code-examples.generator";
import { SavedRequest } from "./interfaces/developer-experience.interface";

/**
 * Create Han OpenAPI Swagger UI plugin
 */
export function createHanOpenAPIPlugin(config: any = {}) {
  const storage = getChainStorage(config.requestChaining);
  const postmanGen = new PostmanGenerator(config.postmanGenerator);
  const codeGen = new CodeExamplesGenerator(config.codeExamples);

  return {
    statePlugins: {
      spec: {
        wrapActions: {
          // Intercept execute action to save requests
          execute:
            (oriAction: any, system: any) =>
            (...args: any[]) => {
              const result = oriAction(...args);

              // If auto-save is enabled, save the request
              if (config.requestChaining?.autoSave !== false) {
                setTimeout(() => {
                  saveExecutedRequest(system, storage);
                }, 100);
              }

              return result;
            },
        },
      },
    },

    components: {
      // Add custom UI components
      RequestChainButton: RequestChainButtonComponent(storage),
      SavedRequestsPanel: SavedRequestsPanelComponent(storage),
      CodeExamplesPanel: CodeExamplesPanelComponent(codeGen),
      PostmanExportButton: PostmanExportButtonComponent(postmanGen),
    },

    wrapComponents: {
      // Note: Component wrapping requires client-side React setup
      // These are placeholder functions for future client-side implementation
    },
  };
}

/**
 * Save executed request to storage
 */
function saveExecutedRequest(system: any, storage: any): void {
  try {
    const state = system.getState();
    const responses = state.get("responses");
    const requests = state.get("requests");

    if (!responses || !requests) return;

    // Get the last executed request
    const lastPath = responses.keySeq().last();
    if (!lastPath) return;

    const response = responses.get(lastPath);
    const request = requests.get(lastPath);

    if (!request || !response) return;

    const [method, endpoint] = lastPath.split("_");

    const savedRequest: SavedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${method.toUpperCase()} ${endpoint}`,
      endpoint,
      method: method.toUpperCase(),
      timestamp: new Date(),
      request: {
        body: request.get("body"),
        headers: request.get("headers")?.toJS(),
        query: request.get("query")?.toJS(),
      },
      response: {
        status: response.get("status"),
        body: response.get("body"),
        headers: response.get("headers")?.toJS(),
        duration: response.get("duration") || 0,
      },
    };

    storage.saveRequest(savedRequest);
    showNotification("✅ Request saved to history");
  } catch (error) {
    console.error("Failed to save request:", error);
  }
}

/**
 * Show code examples modal
 */
function showCodeExamples(
  operation: any,
  codeGen: CodeExamplesGenerator,
): void {
  const config = {
    endpoint: operation.path,
    method: operation.method.toUpperCase(),
    parameters: operation.parameters,
    baseUrl: window.location.origin,
  };

  const examples = codeGen.generateExamples(config);

  // Create modal
  const modal = createModal("Code Examples");
  const content = modal.querySelector(".modal-content");

  if (content) {
    // Create tabs for each language
    const tabs = document.createElement("div");
    tabs.className = "code-examples-tabs";
    tabs.style.cssText = "display: flex; gap: 10px; margin-bottom: 15px;";

    const codeContainer = document.createElement("div");
    codeContainer.className = "code-container";

    examples.forEach((example, index) => {
      // Create tab button
      const tab = document.createElement("button");
      tab.textContent = example.language;
      tab.style.cssText =
        buttonStyle + (index === 0 ? "; background: #4A90E2;" : "");
      tab.onclick = () => {
        // Update active tab
        tabs.querySelectorAll("button").forEach((b: Element) => {
          (b as HTMLElement).style.background = "#61affe";
        });
        tab.style.background = "#4A90E2";

        // Show code
        showCode(
          codeContainer,
          example.code,
          example.language,
          example.dependencies,
        );
      };
      tabs.appendChild(tab);

      // Show first example by default
      if (index === 0) {
        showCode(
          codeContainer,
          example.code,
          example.language,
          example.dependencies,
        );
      }
    });

    content.appendChild(tabs);
    content.appendChild(codeContainer);
  }

  document.body.appendChild(modal);
}

/**
 * Show code in container
 */
function showCode(
  container: HTMLElement,
  code: string,
  language: string,
  dependencies?: string[],
): void {
  container.innerHTML = "";

  // Add dependencies info if present
  if (dependencies && dependencies.length > 0) {
    const depsDiv = document.createElement("div");
    depsDiv.style.cssText =
      "margin-bottom: 10px; padding: 10px; background: #f7f7f7; border-radius: 4px;";
    depsDiv.innerHTML = `<strong>Dependencies:</strong> ${dependencies.join(", ")}`;
    container.appendChild(depsDiv);
  }

  // Create code block
  const pre = document.createElement("pre");
  pre.style.cssText =
    "background: #2d2d2d; color: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 500px;";

  const codeEl = document.createElement("code");
  codeEl.textContent = code;
  pre.appendChild(codeEl);

  // Add copy button
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "📋 Copy";
  copyBtn.style.cssText = buttonStyle + "; float: right; margin-bottom: 10px;";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(code);
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 2000);
  };

  container.appendChild(copyBtn);
  container.appendChild(document.createElement("div")).style.clear = "both";
  container.appendChild(pre);
}

/**
 * Save operation to chain
 */
function saveToChain(props: any, storage: any): void {
  const name = prompt("Enter a name for this request:");
  if (!name) return;

  // Create a simple saved request
  const savedRequest: SavedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    endpoint: props.path,
    method: props.method.toUpperCase(),
    timestamp: new Date(),
    request: {},
  };

  storage.saveRequest(savedRequest);
  showNotification(`✅ Saved "${name}" to requests`);
}

/**
 * Show saved requests
 */
function showSavedRequests(storage: any): void {
  const requests = storage.getSavedRequests();

  const modal = createModal("Saved Requests");
  const content = modal.querySelector(".modal-content");

  if (content) {
    if (requests.length === 0) {
      content.innerHTML =
        "<p>No saved requests yet. Execute some requests to see them here!</p>";
    } else {
      const list = document.createElement("div");
      list.style.cssText = "max-height: 500px; overflow-y: auto;";

      requests.forEach((req: SavedRequest) => {
        const item = createRequestListItem(req, storage);
        list.appendChild(item);
      });

      content.appendChild(list);
    }
  }

  document.body.appendChild(modal);
}

/**
 * Create request list item
 */
function createRequestListItem(req: SavedRequest, storage: any): HTMLElement {
  const item = document.createElement("div");
  item.style.cssText =
    "padding: 15px; margin-bottom: 10px; background: #f7f7f7; border-radius: 4px; border-left: 4px solid #61affe;";

  item.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${req.method}</strong> ${req.endpoint}
        <br/>
        <small style="color: #666;">${new Date(req.timestamp).toLocaleString()}</small>
      </div>
      <div>
        <button class="view-btn" style="${buttonStyle}">👁️ View</button>
        <button class="delete-btn" style="${buttonStyle}; background: #dc3545;">🗑️ Delete</button>
      </div>
    </div>
  `;

  const viewBtn = item.querySelector(".view-btn");
  const deleteBtn = item.querySelector(".delete-btn");

  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      showRequestDetails(req);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete request "${req.name}"?`)) {
        storage.deleteSavedRequest(req.id);
        item.remove();
        showNotification("🗑️ Request deleted");
      }
    });
  }

  return item;
}

/**
 * Show request details
 */
function showRequestDetails(req: SavedRequest): void {
  const modal = createModal(`Request Details: ${req.name}`);
  const content = modal.querySelector(".modal-content");

  if (content) {
    const details = `
      <div style="font-family: monospace;">
        <h3>Request</h3>
        <pre style="background: #2d2d2d; color: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(req.request, null, 2)}</pre>

        ${
          req.response
            ? `<h3>Response (${req.response.status})</h3>
        <pre style="background: #2d2d2d; color: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(req.response.body, null, 2)}</pre>
        <p><small>Duration: ${req.response.duration}ms</small></p>`
            : ""
        }
      </div>
    `;
    content.innerHTML = details;
  }

  document.body.appendChild(modal);
}

/**
 * Show chains
 */
function showChains(storage: any): void {
  const chains = storage.getChains();

  const modal = createModal("Request Chains");
  const content = modal.querySelector(".modal-content");

  if (content) {
    const createBtn = document.createElement("button");
    createBtn.textContent = "➕ Create New Chain";
    createBtn.style.cssText = buttonStyle + "; margin-bottom: 15px;";
    createBtn.onclick = () => {
      alert(
        "Chain builder coming soon! For now, use the saved requests to build chains.",
      );
    };
    content.appendChild(createBtn);

    if (chains.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No chains created yet.";
      content.appendChild(empty);
    } else {
      // Show chains list
      const list = document.createElement("div");
      chains.forEach((chain: any) => {
        const item = document.createElement("div");
        item.style.cssText =
          "padding: 10px; margin-bottom: 10px; background: #f7f7f7; border-radius: 4px;";
        item.innerHTML = `
          <strong>${chain.name}</strong>
          <p>${chain.description || ""}</p>
          <small>${chain.requests.length} requests</small>
        `;
        list.appendChild(item);
      });
      content.appendChild(list);
    }
  }

  document.body.appendChild(modal);
}

/**
 * Export to Postman
 */
function exportToPostman(system: any, postmanGen: PostmanGenerator): void {
  try {
    const spec = system.getState().get("spec").get("json").toJS();
    const collection = postmanGen.generateCollection(spec);
    postmanGen.downloadCollection(collection);
    showNotification("✅ Postman collection exported!");
  } catch (error) {
    alert(`Failed to export: ${error}`);
  }
}

/**
 * Clear all data
 */
function clearAllData(storage: any): void {
  if (
    confirm("Are you sure? This will delete all saved requests and chains.")
  ) {
    storage.clearAll();
    showNotification("🗑️ All data cleared");
  }
}

/**
 * Create modal
 */
function createModal(title: string): HTMLElement {
  const modal = document.createElement("div");
  modal.className = "han-modal";
  modal.style.cssText = modalOverlayStyle;

  modal.innerHTML = `
    <div class="modal-dialog" style="${modalDialogStyle}">
      <div class="modal-header" style="${modalHeaderStyle}">
        <h3 style="margin: 0;">${title}</h3>
        <button class="close-btn" style="${closeButtonStyle}">✕</button>
      </div>
      <div class="modal-content" style="${modalContentStyle}"></div>
    </div>
  `;

  const closeBtn = modal.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
  }

  modal.addEventListener("click", (e: MouseEvent) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  return modal;
}

/**
 * Show notification
 */
function showNotification(message: string): void {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = notificationStyle;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Component placeholders (for TypeScript)
 */
function RequestChainButtonComponent(storage: any) {
  return () => null;
}

function SavedRequestsPanelComponent(storage: any) {
  return () => null;
}

function CodeExamplesPanelComponent(codeGen: any) {
  return () => null;
}

function PostmanExportButtonComponent(postmanGen: any) {
  return () => null;
}

// Styles
const buttonStyle = `
  padding: 8px 15px;
  background: #61affe;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 5px;
`;

const dangerButtonStyle = `
  background: #dc3545;
`;

const actionButtonsStyle = `
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid #e8e8e8;
`;

const toolbarStyle = `
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
`;

const toolbarButtonStyle = `
  padding: 8px 15px;
  background: #61affe;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
`;

const modalOverlayStyle = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const modalDialogStyle = `
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const modalHeaderStyle = `
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const modalContentStyle = `
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const closeButtonStyle = `
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
`;

const notificationStyle = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 15px 20px;
  border-radius: 4px;
  z-index: 10001;
  transition: opacity 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
`;
