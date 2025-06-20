/* ========== Global Persistence Functions ========== */
function getActiveMode() {
  // Find the active feature item in the sidebar
  const activeFeature = document.querySelector(".feature-item.active");
  if (activeFeature) {
    // Extract mode from the onclick attribute
    const onclickAttr = activeFeature.getAttribute("onclick");
    const match = onclickAttr.match(/switchMode\('(.+?)'\)/);
    if (match) return match[1];
  }

  // Fallback to checking sections
  if (document.getElementById("formatter-section").style.display !== "none")
    return "formatter";
  if (document.getElementById("compare-section").style.display !== "none")
    return "compare";
  if (document.getElementById("codegen-section").style.display !== "none")
    return "codegen";
  if (document.getElementById("convert-section").style.display !== "none")
    return "convert";
  if (document.getElementById("mockgen-section").style.display !== "none")
    return "mockgen";
  if (document.getElementById("editor-section").style.display !== "none")
    return "editor";
  return "formatter"; // Default fallback
}

function saveGlobalState() {
  const state = {
    darkMode: document.body.classList.contains("dark-mode"),
    activeMode: getActiveMode(),
    formatter: {
      activeTab:
        document.querySelector(
          "#formatter-tab-contents .json-tab-content.active"
        )?.id || "",
      tabs: [],
      activeFeatureTab: {}, // Store active feature tab (Raw/Tree/Error) for each formatter tab
    },
    compare: {
      activeTab:
        document.querySelector("#compare-tab-contents .json-tab-content.active")
          ?.id || "",
      tabs: [],
    },
    codegen: {
      activeTab:
        document.querySelector("#codegen-tab-contents .json-tab-content.active")
          ?.id || "",
      tabs: [],
    },
  };
  // Formatter tabs
  document
    .querySelectorAll("#formatter-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      const tabId = btn.getAttribute("data-tab");
      const name = btn.querySelector(".tab-name").textContent;
      const color = btn.querySelector(".tab-color-picker")?.value || "#e0e0e0";
      const content =
        document.querySelector("#" + tabId + " .json-input")?.value || "";
      state.formatter.tabs.push({
        id: tabId,
        name,
        color,
        content,
      });
    });
  // Compare tabs
  document
    .querySelectorAll("#compare-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      const tabId = btn.getAttribute("data-tab");
      const name = btn.querySelector(".tab-name").textContent;
      const leftContent =
        document.querySelector("#" + tabId + " .json-input-left")?.value || "";
      const rightContent =
        document.querySelector("#" + tabId + " .json-input-right")?.value || "";
      state.compare.tabs.push({
        id: tabId,
        name,
        leftContent,
        rightContent,
      });
    });
  // Codegen tabs
  document
    .querySelectorAll("#codegen-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      const tabId = btn.getAttribute("data-tab");
      const name = btn.querySelector(".tab-name").textContent;
      const input =
        document.querySelector("#" + tabId + " .json-input")?.value || "";
      const lang =
        document.getElementById("lang-select-" + tabId)?.value || "typescript";
      state.codegen.tabs.push({
        id: tabId,
        name,
        input,
        lang,
      });
    });
  localStorage.setItem("jsonToolState", JSON.stringify(state));
}

function loadGlobalState() {
  const stateStr = localStorage.getItem("jsonToolState");
  if (!stateStr) return;
  const state = JSON.parse(stateStr);
  // Dark Mode
  if (state.darkMode) document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");
  // Active Feature Mode (Formatter/Compare/Codegen/etc.)
  if (state.activeMode) {
    switchMode(state.activeMode);
  } else {
    switchMode("formatter"); // Default fallback
  }

  // Load Formatter tabs
  const ftc = document.getElementById("formatter-tabs-container");
  ftc.querySelectorAll(".tab-button[data-tab]").forEach((btn) => btn.remove());
  document.getElementById("formatter-tab-contents").innerHTML = "";
  formatterTabCount = 0;
  state.formatter.tabs.forEach((tabData) => {
    createFormatterTab(tabData);
  });
  if (state.formatter.activeTab) switchFormatterTab(state.formatter.activeTab);

  // Load Compare tabs
  const ctc = document.getElementById("compare-tabs-container");
  ctc.querySelectorAll(".tab-button[data-tab]").forEach((btn) => btn.remove());
  document.getElementById("compare-tab-contents").innerHTML = "";
  compareTabCount = 0;
  state.compare.tabs.forEach((tabData) => {
    createCompareTabWithData(tabData);
  });
  if (state.compare.activeTab) switchCompareTab(state.compare.activeTab);

  // Load Codegen tabs
  const cgtc = document.getElementById("codegen-tabs-container");
  cgtc.querySelectorAll(".tab-button[data-tab]").forEach((btn) => btn.remove());
  document.getElementById("codegen-tab-contents").innerHTML = "";
  codegenTabCount = 0;
  state.codegen.tabs.forEach((tabData) => {
    createCodegenTabWithData(tabData);
  });
  if (state.codegen.activeTab) switchCodegenTab(state.codegen.activeTab);

  enableTabReordering("formatter-tabs-container");
  enableTabReordering("compare-tabs-container");
  enableTabReordering("codegen-tabs-container");
}

/* ========== COPY FUNCTIONS ========== */
function copyRawJSON(tabId) {
  const rawPre = document.querySelector(`#${tabId}-raw-preview .raw-json`);
  copyToClipboard(rawPre.textContent, "JSON copied to clipboard");
}

function copyCompareLeft(tabId) {
  const leftTA = document.querySelector(`#${tabId} .json-input-left`);
  copyToClipboard(leftTA.value, "Left JSON copied");
}

function copyCompareRight(tabId) {
  const rightTA = document.querySelector(`#${tabId} .json-input-right`);
  copyToClipboard(rightTA.value, "Right JSON copied");
}

function copyCodeOutput(tabId) {
  const codePre = document.querySelector(`#${tabId} .code-output`);
  copyToClipboard(codePre.textContent, "Code copied");
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: successMessage,
        toast: true,
        timer: 2000,
        position: "top-end",
        showConfirmButton: false,
      });
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        toast: true,
        timer: 2000,
        position: "top-end",
        showConfirmButton: false,
      });
    });
}

/* ========== Mode Selector ========== */
function switchMode(mode) {
  const sections = [
    "formatter",
    "compare",
    "codegen",
    "convert",
    "mockgen",
    "editor",
  ];
  sections.forEach((s) => {
    const section = document.getElementById(`${s}-section`);
    if (section) {
      section.style.display = "none";
    }
  });

  const targetSection = document.getElementById(`${mode}-section`);
  if (targetSection) {
    targetSection.style.display = "block";
  }

  // Update sidebar active state
  document.querySelectorAll(".feature-item").forEach((item) => {
    item.classList.remove("active");
  });
  document
    .querySelector(`.feature-item[onclick*="${mode}"]`)
    ?.classList.add("active");

  if (mode === "mockgen") {
    renderMockgenDocs();
  } else if (mode === "editor") {
    loadEditorGlobalState();
  }

  applyEditorTabDarkMode();
  saveGlobalState(); // Save state when mode changes
}

/* ========== Formatter Functions ========== */
let formatterTabCount = 0;

function addFormatterTab() {
  createFormatterTab();
  switchFormatterTab("formatterTab" + formatterTabCount);
  saveGlobalState();
}

function createFormatterTab(tabData = null) {
  formatterTabCount++;
  const tabId = "formatterTab" + formatterTabCount;

  // Create tab button
  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.onclick = () => switchFormatterTab(tabId);

  const tabName = tabData?.name || "Tab " + formatterTabCount;
  const tabColor = tabData?.color || "#e0e0e0";

  tabButton.innerHTML = `<span class="tab-name">${tabName}</span>
               <input type="color" class="tab-color-picker" value="${tabColor}" onchange="updateFormatterTabColor('${tabId}', this.value)">
               <span class="close-tab" onclick="closeFormatterTab('${tabId}', event)">×</span>`;

  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "formatter")
  );

  const tabsContainer = document.getElementById("formatter-tabs-container");
  const addButton = tabsContainer.querySelector(".add-tab-button");
  if (tabsContainer && addButton) {
    tabsContainer.insertBefore(tabButton, addButton);
  }
  // Create tab content
  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
               <textarea class="json-input" placeholder="Enter JSON here..."></textarea>
               <div class="search-container">
                 <input type="text" class="search-input" placeholder="Search keys or values..." />
                 <button onclick="searchFormatterJSON('${tabId}')">Search</button>
               </div>
               <div class="upload-download-container">
                 <input type="file" class="upload-json" style="display:none" onchange="uploadFormatterJSON('${tabId}', this)">
                 <button onclick="document.querySelector('#${tabId} .upload-json').click()">Upload JSON</button>
                 <button onclick="downloadFormatterJSON('${tabId}')">Download JSON</button>
               </div>
               <div class="tabs">
                 <button class="tab-button active" onclick="showFormatterPreviewTab('${tabId}', 'raw')">Raw JSON</button>
                 <button class="tab-button" onclick="showFormatterPreviewTab('${tabId}', 'tree')">Tree View</button>
                 <button class="tab-button" onclick="showFormatterPreviewTab('${tabId}', 'error')">Errors</button>
               </div>
               <div id="${tabId}-raw-preview" class="preview-section active">
                 <pre class="raw-json"></pre>
               </div>
               <div id="${tabId}-tree-preview" class="preview-section">
                 <div class="tree-view"></div>
               </div>
               <div id="${tabId}-error-preview" class="preview-section">
                 <div class="error-message"></div>
               </div>
               
               <div id="${tabId}-raw-preview" class="preview-section active">
                      <button class="copy-button" onclick="copyRawJSON('${tabId}')">Copy</button>
                      <pre class="raw-json"></pre>
                  </div>
                  <div id="${tabId}-tree-preview" class="preview-section">
                      <button class="copy-button" onclick="copyRawJSON('${tabId}')">Copy JSON</button>
                      <div class="tree-view"></div>
                  </div>
                  <pre class="code-output" style="margin-top:10px; overflow:auto;"></pre>
             `;
  document.getElementById("formatter-tab-contents").appendChild(tabContent);
  // Set content if provided
  if (tabData?.content) {
    tabContent.querySelector(".json-input").value = tabData.content;
  }
  const textarea = tabContent.querySelector(".json-input");
  textarea.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(textarea), 100)
  );
  textarea.addEventListener("blur", () => autoFormatTextarea(textarea));
  textarea.addEventListener("input", () => updateFormatterPreview(tabId));
  updateFormatterPreview(tabId);
  enableTabReordering("formatter-tabs-container");
}

function switchFormatterTab(tabId) {
  document
    .querySelectorAll("#formatter-tab-contents .json-tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active");
  document
    .querySelectorAll("#formatter-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
  saveGlobalState();
}

function updateFormatterPreview(tabId) {
  const tabContent = document.getElementById(tabId);
  const textarea = tabContent.querySelector(".json-input");
  const rawPreview = tabContent.querySelector(".raw-json");
  const errorMessage = tabContent.querySelector(".error-message");
  try {
    const parsed = JSON.parse(textarea.value);
    const formatted = JSON.stringify(parsed, null, 2);
    rawPreview.textContent = formatted;
    createTreeView(parsed, tabContent.querySelector(".tree-view"));
    errorMessage.textContent = "";
    showFormatterPreviewTab(tabId, "raw");
    textarea.value = formatted;
  } catch (e) {
    errorMessage.textContent = "Error: " + e.message;
    showFormatterPreviewTab(tabId, "error");
  }
  document.querySelectorAll(".tree-key").forEach((key) => {
    key.addEventListener("focus", () => {
      key.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  });
  saveGlobalState();
}

function showFormatterPreviewTab(tabId, previewType) {
  const tabContent = document.getElementById(tabId);
  const previews = tabContent.querySelectorAll(".preview-section");
  previews.forEach((section) => {
    section.classList.toggle(
      "active",
      section.id === `${tabId}-${previewType}-preview`
    );
  });
  const buttons = tabContent.querySelectorAll(".tabs .tab-button");
  buttons.forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.textContent.toLowerCase().includes(previewType)
    );
  });
}

function searchFormatterJSON(tabId) {
  const tabContent = document.getElementById(tabId);
  const searchInput = tabContent
    .querySelector(".search-input")
    .value.trim()
    .toLowerCase();
  const rawPreview = tabContent.querySelector(".raw-json");
  const treeView = tabContent.querySelector(".tree-view");
  tabContent.querySelectorAll(".highlight").forEach((el) => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
  });
  if (!searchInput) return;
  const regex = new RegExp(
    `(${searchInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  if (rawPreview.classList.contains("active")) {
    const content = rawPreview.textContent;
    rawPreview.innerHTML = content.replace(
      regex,
      '<span class="highlight">$1</span>'
    );
  }
  if (treeView.classList.contains("active")) {
    function highlightNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const matches = node.nodeValue.match(regex);
        if (matches) {
          const span = document.createElement("span");
          span.innerHTML = node.nodeValue.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
        node.childNodes.forEach((child) => highlightNode(child));
      }
    }
    treeView.childNodes.forEach((child) => highlightNode(child));
  }
  saveGlobalState();
}

function updateFormatterTabColor(tabId, colorValue) {
  // If needed, update visual indicators here.
  saveGlobalState();
}

function uploadFormatterJSON(tabId, inputElement) {
  if (inputElement.files?.[0]) {
    const file = inputElement.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const tabContent = document.getElementById(tabId);
      const textarea = tabContent.querySelector(".json-input");
      textarea.value = content;
      updateFormatterPreview(tabId);
    };
    reader.readAsText(file);
    inputElement.value = "";
  }
}

function downloadFormatterJSON(tabId) {
  const tabContent = document.getElementById(tabId);
  const content = tabContent.querySelector(".json-input").value;
  const blob = new Blob([content], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tabId + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function closeFormatterTab(tabId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const result = await Swal.fire({
    title: "Close tab?",
    text: "Are you sure you want to close this tab?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  const tabButton = document.querySelector(
    `#formatter-tabs-container .tab-button[data-tab="${tabId}"]`
  );
  const tabContent = document.getElementById(tabId);
  if (tabButton) tabButton.remove();
  if (tabContent) tabContent.remove();
  const remaining = document.querySelectorAll(
    "#formatter-tab-contents .json-tab-content"
  );
  if (remaining.length > 0)
    switchFormatterTab(remaining[remaining.length - 1].id);
  saveGlobalState();
}

/* ========== Compare Functions ========== */
let compareTabCount = 0;

function addCompareTab() {
  createCompareTab();
  switchCompareTab("compareTab" + compareTabCount);
  saveGlobalState();
}

function createCompareTab() {
  compareTabCount++;
  const tabId = "compareTab" + compareTabCount;
  // Create tab button
  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.onclick = () => switchCompareTab(tabId);
  tabButton.innerHTML = `<span class="tab-name">Tab ${compareTabCount}</span>
               <span class="close-tab" onclick="closeCompareTab('${tabId}', event)">×</span>`;
  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "compare")
  );
  const tabsContainer = document.getElementById("compare-tabs-container");
  const addButton = tabsContainer.querySelector(".add-tab-button");
  tabsContainer.insertBefore(tabButton, addButton);
  // Create tab content
  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
               <div style="display:flex; gap:10px;">
                 <textarea class="json-input-left" placeholder="Enter Left JSON" style="width:48%; height:200px;"></textarea>
                 <textarea class="json-input-right" placeholder="Enter Right JSON" style="width:48%; height:200px;"></textarea>
               </div>
               <button onclick="compareJSONs('${tabId}')">Compare JSONs</button>
               <div class="compare-result" style="margin-top:10px;"></div>
             `;
  document.getElementById("compare-tab-contents").appendChild(tabContent);
  const leftTA = tabContent.querySelector(".json-input-left");
  const rightTA = tabContent.querySelector(".json-input-right");
  leftTA.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(leftTA), 100)
  );
  leftTA.addEventListener("blur", () => autoFormatTextarea(leftTA));
  rightTA.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(rightTA), 100)
  );
  rightTA.addEventListener("blur", () => autoFormatTextarea(rightTA));
  saveGlobalState();
  enableTabReordering("compare-tabs-container");
}
// Create Compare tab using saved data
function createCompareTabWithData(tabData) {
  compareTabCount++;
  const tabId = tabData.id;
  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.onclick = () => switchCompareTab(tabId);
  tabButton.innerHTML = `<span class="tab-name">${tabData.name}</span>
               <span class="close-tab" onclick="closeCompareTab('${tabId}', event)">×</span>`;
  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "compare")
  );
  const tabsContainer = document.getElementById("compare-tabs-container");
  const addButton = tabsContainer.querySelector(".add-tab-button");
  tabsContainer.insertBefore(tabButton, addButton);
  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
               <div style="display:flex; gap:10px;">
                 <textarea class="json-input-left" placeholder="Enter Left JSON" style="width:48%; height:200px;"></textarea>
                 <textarea class="json-input-right" placeholder="Enter Right JSON" style="width:48%; height:200px;"></textarea>
               </div>
               <button onclick="compareJSONs('${tabId}')">Compare JSONs</button>
               <div class="compare-result" style="margin-top:10px;"></div>
             `;
  document.getElementById("compare-tab-contents").appendChild(tabContent);
  const leftTA = tabContent.querySelector(".json-input-left");
  const rightTA = tabContent.querySelector(".json-input-right");
  leftTA.value = tabData.leftContent;
  rightTA.value = tabData.rightContent;
  leftTA.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(leftTA), 100)
  );
  leftTA.addEventListener("blur", () => autoFormatTextarea(leftTA));
  rightTA.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(rightTA), 100)
  );
  rightTA.addEventListener("blur", () => autoFormatTextarea(rightTA));
  saveGlobalState();
  enableTabReordering("compare-tabs-container");
}

function switchCompareTab(tabId) {
  document
    .querySelectorAll("#compare-tab-contents .json-tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active");
  document
    .querySelectorAll("#compare-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
  saveGlobalState();
}

function compareJSONs(tabId) {
  const tabContent = document.getElementById(tabId);
  const leftTA = tabContent.querySelector(".json-input-left");
  const rightTA = tabContent.querySelector(".json-input-right");
  const resultDiv = tabContent.querySelector(".compare-result");
  const leftText = leftTA.value;
  const rightText = rightTA.value;
  let leftObj;
  let rightObj;
  try {
    leftObj = JSON.parse(leftText);
  } catch (e) {
    resultDiv.textContent = "Left JSON Error: " + e.message;
    return;
  }
  try {
    rightObj = JSON.parse(rightText);
  } catch (e) {
    resultDiv.textContent = "Right JSON Error: " + e.message;
    return;
  }
  const leftFormatted = JSON.stringify(leftObj, null, 2);
  const rightFormatted = JSON.stringify(rightObj, null, 2);
  resultDiv.innerHTML = `
                  <div style="margin-bottom: 10px;">
                      <button class="copy-button" onclick="copyCompareLeft('${tabId}')">Copy Left</button>
                      <button class="copy-button" onclick="copyCompareRight('${tabId}')">Copy Right</button>
                  </div>
                  ${diffJSONsPreview(leftFormatted, rightFormatted)}
              `;
  leftTA.value = leftFormatted;
  rightTA.value = rightFormatted;
  saveGlobalState();
}

function diffJSONsPreview(leftText, rightText) {
  const isDarkMode = document.body.classList.contains("dark-mode");
  // Choose a diff color based on the theme:
  // For light mode, use a light red; for dark mode, use a darker or more muted red.
  const diffStyle = isDarkMode
    ? "background-color:#662222;"
    : "background-color:#ddd;";

  const leftLines = leftText.split("\n");
  const rightLines = rightText.split("\n");
  const maxLines = Math.max(leftLines.length, rightLines.length);
  let html = "<table style='width:100%; border-collapse:collapse;'>";
  for (let i = 0; i < maxLines; i++) {
    const lLine = leftLines[i] || "";
    const rLine = rightLines[i] || "";
    // Apply diffStyle if the lines differ
    const style = lLine === rLine ? "" : diffStyle;
    html += `<tr>
             <td style="width:50%; padding:2px; border:1px solid #ddd; ${style}">
               <pre style="margin:0;">${lLine}</pre>
             </td>
             <td style="width:50%; padding:2px; border:1px solid #ddd; ${style}">
               <pre style="margin:0;">${rLine}</pre>
             </td>
           </tr>`;
  }
  html += "</table>";
  return html;
}

async function closeCompareTab(tabId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const result = await Swal.fire({
    title: "Close tab?",
    text: "Are you sure you want to close this tab?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  const tabButton = document.querySelector(
    `#compare-tabs-container .tab-button[data-tab="${tabId}"]`
  );
  const tabContent = document.getElementById(tabId);
  if (tabButton) tabButton.remove();
  if (tabContent) tabContent.remove();
  const remaining = document.querySelectorAll(
    "#compare-tab-contents .json-tab-content"
  );
  if (remaining.length > 0)
    switchCompareTab(remaining[remaining.length - 1].id);
  saveGlobalState();
}

/* ========== CodeGen Functions ========== */
let codegenTabCount = 0;

function addCodegenTab() {
  createCodegenTab();
  switchCodegenTab("codegenTab" + codegenTabCount);
  saveGlobalState();
}

function createCodegenTab() {
  codegenTabCount++;
  const tabId = "codegenTab" + codegenTabCount;
  // Create tab button
  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.onclick = () => switchCodegenTab(tabId);
  tabButton.innerHTML = `<span class="tab-name">Tab ${codegenTabCount}</span>
               <span class="close-tab" onclick="closeCodegenTab('${tabId}', event)">×</span>`;
  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "codegen")
  );
  const tabsContainer = document.getElementById("codegen-tabs-container");
  const addButton = tabsContainer.querySelector(".add-tab-button");
  tabsContainer.insertBefore(tabButton, addButton);
  // Create tab content
  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
               <textarea class="json-input" placeholder="Enter JSON here..."></textarea>
               <div style="margin-top:10px;">
                 <label for="lang-select-${tabId}">Select Language:</label>
                 <select id="lang-select-${tabId}">
                   <option value="typescript">TypeScript</option>
                   <option value="python">Python</option>
                   <option value="go">Go</option>
                 </select>
                 <button onclick="generateCode('${tabId}')">Generate Code</button>
                 <button class="copy-button" onclick="copyCodeOutput('${tabId}')">Copy Code</button>
               </div>
               <pre class="code-output" style="margin-top:10px; overflow:auto;"></pre>
             `;
  document.getElementById("codegen-tab-contents").appendChild(tabContent);
  const textarea = tabContent.querySelector(".json-input");
  textarea.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(textarea), 100)
  );
  textarea.addEventListener("blur", () => autoFormatTextarea(textarea));
  saveGlobalState();
}

function createCodegenTabWithData(tabData) {
  codegenTabCount++;
  const tabId = tabData.id;
  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.onclick = () => switchCodegenTab(tabId);
  tabButton.innerHTML = `<span class="tab-name">${tabData.name}</span>
               <span class="close-tab" onclick="closeCodegenTab('${tabId}', event)">×</span>`;
  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "codegen")
  );
  const tabsContainer = document.getElementById("codegen-tabs-container");
  const addButton = tabsContainer.querySelector(".add-tab-button");
  tabsContainer.insertBefore(tabButton, addButton);
  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
               <textarea class="json-input" placeholder="Enter JSON here..."></textarea>
               <div style="margin-top:10px;">
                 <label for="lang-select-${tabId}">Select Language:</label>
                 <select id="lang-select-${tabId}">
                   <option value="typescript">TypeScript</option>
                   <option value="python">Python</option>
                   <option value="go">Go</option>
                 </select>
                 <button onclick="generateCode('${tabId}')">Generate Code</button>
               </div>
               <pre class="code-output" style="margin-top:10px; overflow:auto;"></pre>
             `;
  document.getElementById("codegen-tab-contents").appendChild(tabContent);
  const textarea = tabContent.querySelector(".json-input");
  textarea.value = tabData.input;
  const selectElem = document.getElementById("lang-select-" + tabId);
  selectElem.value = tabData.lang;
  textarea.addEventListener("paste", () =>
    setTimeout(() => autoFormatTextarea(textarea), 100)
  );
  textarea.addEventListener("blur", () => autoFormatTextarea(textarea));
  saveGlobalState();
  enableTabReordering("codegen-tabs-container");
}

function switchCodegenTab(tabId) {
  document
    .querySelectorAll("#codegen-tab-contents .json-tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active");
  document
    .querySelectorAll("#codegen-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
  saveGlobalState();
}

function generateCode(tabId) {
  const tabContent = document.getElementById(tabId);
  const textarea = tabContent.querySelector(".json-input");
  const langSelect = document.getElementById("lang-select-" + tabId);
  const outputPre = tabContent.querySelector(".code-output");
  const inputText = textarea.value;
  const lang = langSelect.value;
  let obj;
  try {
    obj = JSON.parse(inputText);
  } catch (e) {
    outputPre.textContent = "Invalid JSON: " + e.message;
    return;
  }
  let code = "";
  if (lang === "typescript") code = generateTypeScript(obj, "Root");
  else if (lang === "python") code = generatePython(obj, "Root");
  else if (lang === "go") code = generateGo(obj, "Root");
  outputPre.innerHTML = code;
  // .replace(/(interface|class|type)\b/g, '<span class="keyword">$1</span>')
  // .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
  // .replace(/\b\d+\b/g, '<span class="number">$&</span>')
  // .replace(/\bstring|number|boolean|any|void\b/g, '<span class="type">$&</span>');

  saveGlobalState();
}

async function closeCodegenTab(tabId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const result = await Swal.fire({
    title: "Close tab?",
    text: "Are you sure you want to close this tab?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  const tabButton = document.querySelector(
    `#codegen-tabs-container .tab-button[data-tab="${tabId}"]`
  );
  const tabContent = document.getElementById(tabId);
  if (tabButton) tabButton.remove();
  if (tabContent) tabContent.remove();
  const remaining = document.querySelectorAll(
    "#codegen-tab-contents .json-tab-content"
  );
  if (remaining.length > 0)
    switchCodegenTab(remaining[remaining.length - 1].id);
  saveGlobalState();
}

/* ========== Utility Functions ========== */
function autoFormatTextarea(textarea) {
  try {
    const parsed = JSON.parse(textarea.value);
    textarea.value = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Do nothing if invalid
  }
}

function createTreeView(data, parentElement) {
  parentElement.innerHTML = "";
  const focusedNode = null;

  function processNode(value, parent, key, path = []) {
    const node = document.createElement("div");
    node.className = "tree-node";
    const currentPath = [...path, key];
    const displayKey = key !== undefined ? key : "";

    if (typeof value === "object" && value !== null) {
      const isArray = Array.isArray(value);
      const keySpan = document.createElement("span");
      keySpan.className = `tree-key ${isArray ? "type-array" : "type-object"}`;
      keySpan.tabIndex = 0;
      keySpan.innerHTML = `
                  <span>${displayKey}</span>
                  <span class="node-info">${
                    isArray
                      ? `[${value.length}]`
                      : `{${Object.keys(value).length}}`
                  }</span>
              `;

      // Keyboard navigation
      keySpan.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "ArrowRight":
            if (keySpan.classList.contains("collapsed")) toggleNode();
            break;
          case "ArrowLeft":
            if (!keySpan.classList.contains("collapsed")) toggleNode();
            break;
          case "ArrowDown":
            focusNextNode(keySpan);
            break;
          case "ArrowUp":
            focusPreviousNode(keySpan);
            break;
        }
      });

      // Context menu
      keySpan.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showContextMenu(e, currentPath, value);
      });

      const children = document.createElement("div");
      children.className = "tree-children";
      children.style.display = "none";

      const toggleNode = () => {
        keySpan.classList.toggle("expanded");
        keySpan.classList.toggle("collapsed");
        children.style.display =
          children.style.display === "none" ? "block" : "none";
      };

      keySpan.addEventListener("click", toggleNode);

      if (isArray) {
        value.forEach((item, index) =>
          processNode(item, children, index, currentPath)
        );
      } else {
        Object.entries(value).forEach(([k, v]) =>
          processNode(v, children, k, currentPath)
        );
      }

      node.appendChild(keySpan);
      node.appendChild(children);
      parent.appendChild(node);
    } else {
      const valueSpan = document.createElement("span");
      valueSpan.innerHTML = `
                  <span class="tree-key">${key}: </span>
                  <span class="${getValueTypeClass(value)}">${formatValue(
        value
      )}</span>
              `;

      // Value context menu
      valueSpan.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showContextMenu(e, currentPath, value);
      });

      node.appendChild(valueSpan);
      parent.appendChild(node);
    }

    return node;
  }

  function getValueTypeClass(value) {
    if (value === null) return "type-null";
    if (Array.isArray(value)) return "type-array";
    if (typeof value === "object") return "type-object";
    return `type-${typeof value}`;
  }

  function formatValue(value) {
    if (value === null) return "null";
    if (typeof value === "string") return `"${value}"`;
    return value.toString();
  }

  function showContextMenu(e, path, value) {
    const menu = document.createElement("div");
    menu.className = "tree-context-menu";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    const copyPath = document.createElement("div");
    copyPath.className = "tree-context-menu-item";
    copyPath.textContent = "Copy Path";
    copyPath.onclick = () => navigator.clipboard.writeText(path.join("."));

    const copyValue = document.createElement("div");
    copyValue.className = "tree-context-menu-item";
    copyValue.textContent = "Copy Value";
    copyValue.onclick = () =>
      navigator.clipboard.writeText(JSON.stringify(value));

    menu.appendChild(copyPath);
    menu.appendChild(copyValue);
    document.body.appendChild(menu);

    const closeMenu = () => {
      document.body.removeChild(menu);
      document.removeEventListener("click", closeMenu);
    };

    document.addEventListener("click", closeMenu);
  }

  function focusNextNode(currentNode) {
    const allNodes = parentElement.querySelectorAll(".tree-key");
    const currentIndex = Array.from(allNodes).indexOf(currentNode);
    if (currentIndex < allNodes.length - 1) {
      allNodes[currentIndex + 1].focus();
    }
  }

  function focusPreviousNode(currentNode) {
    const allNodes = parentElement.querySelectorAll(".tree-key");
    const currentIndex = Array.from(allNodes).indexOf(currentNode);
    if (currentIndex > 0) {
      allNodes[currentIndex - 1].focus();
    }
  }

  processNode(data, parentElement);
}

function openTabRenameTooltip(tabId, mode) {
  let containerSelector;
  if (mode === "formatter") containerSelector = "#formatter-tabs-container";
  else if (mode === "compare") containerSelector = "#compare-tabs-container";
  else if (mode === "codegen") containerSelector = "#codegen-tabs-container";
  else containerSelector = "#editor-tabs-container";

  const tabButton = document.querySelector(
    containerSelector + ` .tab-button[data-tab="${tabId}"]`
  );
  const existingTooltip = document.querySelector(".tab-rename-tooltip");
  if (existingTooltip) existingTooltip.remove();
  const tooltip = document.createElement("div");
  tooltip.className = "tab-rename-tooltip";
  const rect = tabButton.getBoundingClientRect();
  tooltip.style.left = rect.left + "px";
  tooltip.style.top = rect.bottom + window.scrollY + 5 + "px";
  const input = document.createElement("input");
  input.type = "text";
  input.value = tabButton.querySelector(".tab-name").textContent;
  input.style.width = "150px";
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finalizeRename();
    else if (e.key === "Escape") tooltip.remove();
  });
  input.addEventListener("blur", finalizeRename);
  tooltip.appendChild(input);
  document.body.appendChild(tooltip);
  input.focus();

  function finalizeRename() {
    const newName = input.value.trim();
    if (newName) {
      tabButton.querySelector(".tab-name").textContent = newName;
    }
    tooltip.remove();
    saveGlobalState();
  }
}

function generateTypeScript(obj, interfaceName) {
  let result = `interface ${interfaceName} {\n`;
  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;
    const value = obj[key];
    if (value === null) {
      result += `  ${key}: any;\n`;
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const elem = value[0];
        if (typeof elem === "object" && elem !== null) {
          const subInterface = interfaceName + capitalize(key);
          result += `  ${key}: ${subInterface}[];\n`;
          result += generateTypeScript(elem, subInterface);
        } else {
          result += `  ${key}: ${typeof elem}[];\n`;
        }
      } else {
        result += `  ${key}: any[];\n`;
      }
    } else if (typeof value === "object") {
      const subInterface = interfaceName + capitalize(key);
      result += `  ${key}: ${subInterface};\n`;
      result += generateTypeScript(value, subInterface);
    } else {
      result += `  ${key}: ${typeof value};\n`;
    }
  }
  result += "}\n";
  return result;
}

function generatePython(obj, className) {
  let result =
    "from dataclasses import dataclass\nfrom typing import Any, List\n\n";
  result += `@dataclass\nclass ${className}:\n`;
  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;
    const value = obj[key];
    let pyType = "Any";
    if (value === null) {
      pyType = "Any";
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const elem = value[0];
        if (typeof elem === "object" && elem !== null) {
          const subClass = className + capitalize(key);
          pyType = `List[${subClass}]`;
          result += "\n" + generatePython(elem, subClass);
        } else {
          if (typeof elem === "number") pyType = "List[float]";
          else if (typeof elem === "string") pyType = "List[str]";
          else if (typeof elem === "boolean") pyType = "List[bool]";
          else pyType = "List[Any]";
        }
      } else {
        pyType = "List[Any]";
      }
    } else if (typeof value === "object") {
      const subClass = className + capitalize(key);
      pyType = subClass;
      result += "\n" + generatePython(value, subClass);
    } else {
      if (typeof value === "number") pyType = "float";
      else if (typeof value === "string") pyType = "str";
      else if (typeof value === "boolean") pyType = "bool";
    }
    result += `    ${key}: ${pyType}\n`;
  }
  return result;
}

function generateGo(obj, structName) {
  let result = `type ${structName} struct {\n`;
  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;
    const value = obj[key];
    let goType = "interface{}";
    if (value === null) {
      goType = "interface{}";
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const elem = value[0];
        if (typeof elem === "object" && elem !== null) {
          const subStruct = structName + capitalize(key);
          goType = `[]${subStruct}`;
          result += generateGo(elem, subStruct);
        } else {
          if (typeof elem === "number") goType = "[]float64";
          else if (typeof elem === "string") goType = "[]string";
          else if (typeof elem === "boolean") goType = "[]bool";
          else goType = "[]interface{}";
        }
      } else {
        goType = "[]interface{}";
      }
    } else if (typeof value === "object") {
      const subStruct = structName + capitalize(key);
      goType = subStruct;
      result += generateGo(value, subStruct);
    } else {
      if (typeof value === "number") goType = "float64";
      else if (typeof value === "string") goType = "string";
      else if (typeof value === "boolean") goType = "bool";
    }
    const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
    result += `    ${fieldName} ${goType} \`json:"${key}"\`\n`;
  }
  result += "}\n";
  return result;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ========== Convert to Dict Functions ========== */
let currentConvertMode = "dict-to-json";

function switchConvertDirection(mode) {
  currentConvertMode = mode;
  document.querySelectorAll("#convert-section .tab-button").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.textContent.includes("Dict") === (mode === "dict-to-json")
    );
  });
  document.getElementById("convert-input").value = "";
  document.getElementById("convert-output").textContent = "";
}

function convert() {
  const input = document.getElementById("convert-input").value;
  const output = document.getElementById("convert-output");

  try {
    if (currentConvertMode === "dict-to-json") {
      // 1) None/True/False → null/true/false
      let json = input
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false");
      // 2) remove trailing commas before } or ]
      json = json.replace(/,\s*(?=[}\]])/g, "");
      // 3) convert only quoted 'strings' → "strings"
      json = json.replace(/'([^']*?)'/g, '"$1"');

      const parsed = JSON.parse(json);
      output.textContent = JSON.stringify(parsed, null, 2);
    } else {
      // JSON → Python dict
      const obj = JSON.parse(input);
      let dictStr = JSON.stringify(obj, null, 2);
      // 1) only replace "quoted" strings → 'strings'
      dictStr = dictStr.replace(/"([^"]*?)"/g, "'$1'");
      // 2) true/false/null → True/False/None
      dictStr = dictStr
        .replace(/\btrue\b/g, "True")
        .replace(/\bfalse\b/g, "False")
        .replace(/\bnull\b/g, "None");

      output.textContent = dictStr;
    }
  } catch (e) {
    output.textContent = "Error: " + e.message;
  }
}

function copyConvertOutput() {
  const output = document.getElementById("convert-output").textContent;
  copyToClipboard(output, "Copied!");
}

/* ========== Mock data generator ========== */

let latestMockData = [];
const presets = {
  User: {
    id: "number|1000-9999",
    name: "name.fullName",
    email: "internet.email",
    isActive: "boolean",
  },
  Product: {
    id: "number|1-1000",
    title: "commerce.productName",
    price: "number|10-500",
    available: "boolean",
  },
};

function loadMockPreset(name) {
  if (presets[name]) {
    document.getElementById("mock-schema-input").value = JSON.stringify(
      presets[name],
      null,
      2
    );
  }
}

function generateMockData() {
  const input = document.getElementById("mock-schema-input").value;
  const count = Number.parseInt(
    document.getElementById("mockgen-count").value || "1",
    10
  );
  const outputContainer = document.getElementById("mock-output-container");

  try {
    const schema = JSON.parse(input);
    latestMockData = Array.from({ length: count }, () => {
      try {
        return mockFromSchema(schema);
      } catch (err) {
        return { error: err.message };
      }
    });
    document.getElementById(
      "mock-stats"
    ).textContent = `Showing ${count} record(s)`;
    updateMockView();
  } catch (e) {
    outputContainer.innerHTML = `<pre class="code-output">❌ Error: ${e.message}</pre>`;
  }
}
/* global faker */
function resolveFakerPath(path) {
  if (!path) throw new Error("Empty faker path");
  const parts = path.split(".");
  let current = faker;
  for (const part of parts) {
    if (!current[part]) throw new Error(`Invalid faker path: "${path}"`);
    current = current[part];
  }
  if (typeof current === "function") return current();
  throw new Error(`Faker path "${path}" does not resolve to a function`);
}

function mockFromSchema(schema) {
  if (Array.isArray(schema)) {
    return schema.map((item) => mockFromSchema(item));
  }
  if (typeof schema === "object") {
    const result = {};
    for (const [key, value] of Object.entries(schema)) {
      result[key] = mockFromSchema(value);
    }
    return result;
  }
  if (typeof schema === "string") {
    if (schema === "boolean") return Math.random() < 0.5;
    if (schema.startsWith("number|")) {
      const [min, max] = schema.split("|")[1].split("-").map(Number);
      return faker.number.int({ min, max });
    }

    return resolveFakerPath(schema);
  }
  return schema;
}

function updateMockView() {
  const mode = document.querySelector(
    'input[name="mock-view-mode"]:checked'
  ).value;
  const container = document.getElementById("mock-output-container");
  container.innerHTML = "";

  if (mode === "json") {
    const pre = document.createElement("pre");
    pre.className = "code-output";
    pre.textContent = JSON.stringify(
      latestMockData.length === 1 ? latestMockData[0] : latestMockData,
      null,
      2
    );
    container.appendChild(pre);
  } else {
    container.appendChild(renderTableFromJson(latestMockData));
  }
}

function renderTableFromJson(data) {
  const table = document.createElement("table");
  table.className = "mock-preview-table";

  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    typeof data[0] !== "object"
  ) {
    table.innerHTML = "<tr><td>No tabular data available</td></tr>";
    return table;
  }

  const headers = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    // Add title for full text on hover
    th.title = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.error) {
      tr.classList.add("error");
    }

    headers.forEach((key) => {
      const td = document.createElement("td");
      const val = row[key];
      let displayVal;

      if (val && typeof val === "object") {
        displayVal = JSON.stringify(val);
      } else {
        displayVal = val ?? "";
      }

      td.textContent = displayVal;
      // Add title for full text on hover
      td.title = displayVal;

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function copyMockOutput(format = "json") {
  let text = "";
  if (format === "json") {
    text = JSON.stringify(
      latestMockData.length === 1 ? latestMockData[0] : latestMockData,
      null,
      2
    );
  } else if (format === "csv") {
    if (!latestMockData.length || typeof latestMockData[0] !== "object") return;
    const keys = Object.keys(latestMockData[0]);
    const rows = latestMockData.map((obj) =>
      keys.map((k) => JSON.stringify(obj[k] ?? ""))
    );
    text = [keys.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  copyToClipboard(text, `Copied ${format.toUpperCase()}!`);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let userInputValue = ""; // This variable will store filename input from user using the following event listener:

document.getElementById("userInput").addEventListener("input", (e) => {
  userInputValue = e.target.value;
  //console.log("Saved input:", userInputValue); // Optional: see it live
});

function exportMockOutput(format = "json") {
  if (!Array.isArray(latestMockData) || latestMockData.length === 0) {
    console.error("No data available to export.");
    return;
  }

  let content = "";
  let filename = userInputValue !== "" ? userInputValue : "mock_data"; // Use user input if available

  if (format === "json") {
    content = JSON.stringify(
      latestMockData.length === 1 ? latestMockData[0] : latestMockData,
      null,
      2
    );
    filename += ".json";
    downloadFile(content, filename, "application/json");
  } else if (format === "csv") {
    if (!latestMockData.length || typeof latestMockData[0] !== "object") return;

    const keys = Object.keys(latestMockData[0]);
    const rows = latestMockData.map((obj) =>
      keys.map((k) => JSON.stringify(obj[k] ?? ""))
    );
    content = [keys.join(","), ...rows.map((r) => r.join(","))].join("\n");
    filename += ".csv";
    downloadFile(content, filename, "text/csv");
  }
}

const mockgenDocs = `
  # 🧪 Mock Data Schema Format
  
  ## Supported Types
  
  - \`"name.fullName"\`: Full name
  - \`"internet.email"\`: Email address
  - \`"number|10-50"\`: Custom range
  - \`"boolean"\`: true / false
  - Arrays: \`["lorem.word"]\`
  - Nested: 
  
  \`\`\`json
  {
    "user": {
      "name": "name.fullName",
      "email": "internet.email"
    }
  }
  \`\`\`
  
  ## Example
  
  \`\`\`json
  {
    "id": "number|1000-9999",
    "name": "name.fullName",
    "email": "internet.email",
    "isActive": "boolean"
  }
  \`\`\`
  `;

function switchMockTab(tab) {
  const schemaPanel = document.getElementById("mockgen-schema-panel");
  const docsPanel = document.getElementById("mockgen-docs-panel");

  document.getElementById("mock-tab-schema").classList.remove("active");
  document.getElementById("mock-tab-docs").classList.remove("active");

  if (tab === "schema") {
    schemaPanel.style.display = "block";
    docsPanel.style.display = "none";
    document.getElementById("mock-tab-schema").classList.add("active");
  } else {
    schemaPanel.style.display = "none";
    docsPanel.style.display = "block";
    document.getElementById("mock-tab-docs").classList.add("active");
    renderMockgenDocs();
  }
}

function renderMockgenDocs() {
  document.getElementById("mockgen-docs-preview").innerHTML =
    marked.parse(mockgenDocs);
}

// Text Editor
let editorTabCount = 0;
const editorInstances = {};

function addEditorTab(tabData = null) {
  let tabId;
  if (tabData?.id) {
    tabId = tabData.id;
    const match = tabId.match(/editor-tab-(\d+)/);
    if (match && Number.parseInt(match[1], 10) > editorTabCount) {
      editorTabCount = Number.parseInt(match[1], 10);
    }
  } else {
    editorTabCount++;
    tabId = `editor-tab-${editorTabCount}`;
  }

  const tabButton = document.createElement("button");
  tabButton.className = "tab-button";
  tabButton.setAttribute("data-tab", tabId);
  tabButton.innerHTML = `<span class="tab-name">${
    tabData?.title || `Note ${editorTabCount}`
  }</span><span class="close-tab" onclick="deleteEditorTab('${tabId}', event)">×</span>`;
  tabButton.onclick = () => switchEditorTab(tabId);
  tabButton.addEventListener("dblclick", () =>
    openTabRenameTooltip(tabId, "editor")
  );

  document
    .getElementById("editor-tabs-container")
    .insertBefore(
      tabButton,
      document.querySelector("#editor-tabs-container .add-tab-button")
    );

  const tabContent = document.createElement("div");
  tabContent.id = tabId;
  tabContent.className = "json-tab-content";
  tabContent.innerHTML = `
      <div id="${tabId}-editor"></div>
      <div style="margin-top:10px;">
        <button onclick="saveEditorContent('${tabId}')">💾 Save</button>
      </div>
    `;

  document.getElementById("editor-tab-contents").appendChild(tabContent);

  const editor = new toastui.Editor({
    el: document.getElementById(`${tabId}-editor`),
    height: "400px",
    initialEditType: "markdown",
    previewStyle: "vertical",
  });
  editorInstances[tabId] = editor;

  const saved = localStorage.getItem(tabId);
  if (saved) editor.setMarkdown(saved);

  enableEditorTabReordering();
  applyEditorTabDarkMode();
}

function switchEditorTab(tabId) {
  document
    .querySelectorAll("#editor-tab-contents .json-tab-content")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(tabId)?.classList.add("active");

  document
    .querySelectorAll("#editor-tabs-container .tab-button")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
  updateEditorGlobalState();
}

function saveEditorContent(tabId) {
  const content = editorInstances[tabId].getMarkdown();
  localStorage.setItem(tabId, content);
  updateEditorGlobalState();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Autosaved",
    showConfirmButton: false,
    timer: 1500,
  });
}

async function deleteEditorTab(tabId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const result = await Swal.fire({
    title: "Close tab?",
    text: "Are you sure you want to close this tab?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (!result.isConfirmed) return;

  localStorage.removeItem(tabId);
  delete editorInstances[tabId];
  document
    .querySelector(`#editor-tabs-container .tab-button[data-tab="${tabId}"]`)
    ?.remove();
  document.getElementById(tabId)?.remove();
  const remaining = document.querySelectorAll(
    "#editor-tab-contents .json-tab-content"
  );
  if (remaining.length > 0) switchEditorTab(remaining[0].id);
  updateEditorGlobalState();
}

function updateEditorGlobalState() {
  const state = {
    activeTab:
      document.querySelector("#editor-tab-contents .json-tab-content.active")
        ?.id || "",
    tabs: [],
  };
  document
    .querySelectorAll("#editor-tabs-container .tab-button[data-tab]")
    .forEach((btn) => {
      const tabId = btn.getAttribute("data-tab");
      const title = btn.querySelector(".tab-name").textContent;
      state.tabs.push({ id: tabId, title });
    });
  localStorage.setItem("editorState", JSON.stringify(state));
}

function loadEditorGlobalState() {
  const stateStr = localStorage.getItem("editorState");
  const container = document.getElementById("editor-tabs-container");
  container
    .querySelectorAll(".tab-button[data-tab]")
    .forEach((btn) => btn.remove());
  document.getElementById("editor-tab-contents").innerHTML = "";
  editorTabCount = 0;

  if (!stateStr) {
    addEditorTab();
    return;
  }

  const state = JSON.parse(stateStr);
  state.tabs.forEach((tabData) => addEditorTab(tabData));

  if (state.activeTab && document.getElementById(state.activeTab)) {
    switchEditorTab(state.activeTab);
  } else if (state.tabs.length > 0) {
    switchEditorTab(state.tabs[0].id);
  }
}

function enableEditorTabReordering() {
  const container = document.getElementById("editor-tabs-container");
  const buttons = container.querySelectorAll(".tab-button[data-tab]");
  buttons.forEach((btn) => {
    btn.draggable = true;
    btn.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", btn.getAttribute("data-tab"));
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
      btn.classList.remove("dragging");
    });
    btn.addEventListener("dragover", (e) => {
      e.preventDefault();
      btn.classList.add("drag-over");
    });
    btn.addEventListener("dragleave", () => {
      btn.classList.remove("drag-over");
    });
    btn.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      const draggedBtn = container.querySelector(`[data-tab="${draggedId}"]`);
      btn.classList.remove("drag-over");
      if (draggedBtn && draggedBtn !== btn) {
        container.insertBefore(draggedBtn, btn);
        updateEditorGlobalState();
      }
    });
  });
}

function applyEditorTabDarkMode() {
  const container = document.getElementById("editor-tabs-container");
  container.querySelectorAll(".tab-button").forEach((btn) => {
    if (document.body.classList.contains("dark-mode")) {
      btn.style.backgroundColor = "#2c2c2c";
      btn.style.color = "#eee";
      btn.style.borderColor = "#444";
    } else {
      btn.style.backgroundColor = "";
      btn.style.color = "";
      btn.style.borderColor = "";
    }
  });
}

/* ========== Mobile Sidebar Functions ========== */
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("active");

  // Close sidebar when clicking outside
  if (sidebar.classList.contains("active")) {
    const closeOnClickOutside = (e) => {
      if (
        !sidebar.contains(e.target) &&
        !e.target.matches(".mobile-sidebar-toggle")
      ) {
        sidebar.classList.remove("active");
        document.removeEventListener("click", closeOnClickOutside);
      }
    };
    // Add event listener with a slight delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", closeOnClickOutside);
    }, 100);
  }
}

// Add touch event handling for better mobile experience
document.addEventListener("DOMContentLoaded", () => {
  let touchStartX = 0;
  let touchEndX = 0;
  const sidebar = document.querySelector(".sidebar");

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    false
  );

  document.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    false
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const swipeLength = touchEndX - touchStartX;

    // Swipe right to open sidebar
    if (swipeLength > swipeThreshold && touchStartX < 30) {
      sidebar.classList.add("active");
    }
    // Swipe left to close sidebar
    else if (
      swipeLength < -swipeThreshold &&
      sidebar.classList.contains("active")
    ) {
      sidebar.classList.remove("active");
    }
  }
});

/* ========== Shortcut Modal & Dark Mode ========== */
function toggleShortcutModal() {
  const modal = document.getElementById("shortcut-modal");
  modal.style.display = modal.style.display === "block" ? "none" : "block";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  saveGlobalState();
  // If the Compare section is visible, update all diff previews
  if (document.getElementById("compare-section").style.display !== "none") {
    document
      .querySelectorAll("#compare-tab-contents .json-tab-content")
      .forEach((tab) => {
        compareJSONs(tab.id);
      });
  }
}
/* ========== Keyboard Shortcuts ========== */
document.addEventListener("keydown", (e) => {
  if (
    e.ctrlKey &&
    e.key.toLowerCase() === "t" &&
    document.getElementById("formatter-section").style.display !== "none"
  ) {
    e.preventDefault();
    addFormatterTab();
  }
  if (
    e.ctrlKey &&
    e.key.toLowerCase() === "w" &&
    document.getElementById("formatter-section").style.display !== "none"
  ) {
    e.preventDefault();
    const activeTab = document.querySelector(
      "#formatter-tab-contents .json-tab-content.active"
    );
    if (activeTab) closeFormatterTab(activeTab.id);
  }
  if (e.ctrlKey && (e.key === "/" || e.key === "?")) {
    e.preventDefault();
    toggleShortcutModal();
  }
  if (e.key === "Escape") {
    const modal = document.getElementById("shortcut-modal");
    if (modal.style.display === "block") toggleShortcutModal();
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    const activeTab = document.querySelector(
      "#editor-tab-contents .json-tab-content.active"
    );
    if (activeTab) saveEditorContent(activeTab.id);
  }
});

/* ========== Tab reordering ========== */
function enableTabReordering(containerId) {
  const container = document.getElementById(containerId);
  const tabButtons = container.querySelectorAll(".tab-button[data-tab]");

  tabButtons.forEach((button) => {
    button.draggable = true;

    button.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", button.getAttribute("data-tab"));
      button.classList.add("dragging");
    });

    button.addEventListener("dragend", () => {
      button.classList.remove("dragging");
      container
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("drag-over"));
    });

    button.addEventListener("dragover", (e) => {
      e.preventDefault();
      button.classList.add("drag-over");
    });

    button.addEventListener("dragleave", () => {
      button.classList.remove("drag-over");
    });

    button.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      const draggedBtn = container.querySelector(`[data-tab="${draggedId}"]`);

      button.classList.remove("drag-over");

      if (draggedBtn && draggedBtn !== button) {
        container.insertBefore(draggedBtn, button);
        saveGlobalState();
      }
    });
  });
}

/* ========== Initialization ========== */
window.addEventListener("load", () => {
  loadGlobalState();
  loadEditorGlobalState();
  // If no saved state, create a default tabs.
  if (document.getElementById("formatter-tab-contents").children.length === 0) {
    addFormatterTab();
  }

  if (document.getElementById("compare-tab-contents").children.length === 0) {
    addCompareTab();
  }

  if (document.getElementById("codegen-tab-contents").children.length === 0) {
    addCodegenTab();
  }

  if (document.getElementById("editor-tab-contents").children.length === 0) {
    addEditorTab();
    switchEditorTab("editor-tab-1");
  }
});

setInterval(() => {
  const editorVisible =
    document.getElementById("editor-section").style.display !== "none";
  const activeTab = document.querySelector(
    "#editor-tab-contents .json-tab-content.active"
  );

  if (!Swal.isVisible() && editorVisible && activeTab) {
    saveEditorContent(activeTab.id);
  }
}, 5000);
