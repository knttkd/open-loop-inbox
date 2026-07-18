const workspace = document.querySelector("#workspace");
const status = document.querySelector("#status");
const loadButton = document.querySelector("#load-button");
const tasks = document.querySelector("#tasks");
const count = document.querySelector("#count");
const detailsPanel = document.querySelector("#details-panel");
const detailsHeading = document.querySelector("#details-heading");
const messages = document.querySelector("#messages");

function dateLabel(value) {
  if (value === null || value === undefined) return "更新日時不明";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.valueOf()) ? "更新日時不明" : new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function jsonRequest(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "処理に失敗しました");
  return payload;
}

async function readThread(thread, button) {
  button.disabled = true;
  setStatus(`「${thread.title}」を読み取っています…`);
  try {
    const payload = await jsonRequest("/api/threads/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: thread.id, confirmed: true }),
    });
    detailsHeading.textContent = payload.thread.title;
    messages.replaceChildren();
    if (payload.thread.messages.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "表示できるユーザー／アシスタントメッセージはありません。";
      messages.append(empty);
    } else {
      for (const message of payload.thread.messages) {
        const article = document.createElement("article");
        article.className = `message ${message.role}`;
        const label = document.createElement("strong");
        label.textContent = message.role === "user" ? "YOU" : "CODEX";
        const text = document.createElement("p");
        text.textContent = message.text;
        article.append(label, text);
        messages.append(article);
      }
    }
    detailsPanel.hidden = false;
    detailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("選択したタスクだけを読み取りました。");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function renderThreads(threads) {
  tasks.replaceChildren();
  count.textContent = `${threads.length}件`;
  if (threads.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "このWorkspaceに対象タスクはありません。";
    tasks.append(empty);
    return;
  }

  for (const thread of threads) {
    const article = document.createElement("article");
    article.className = "task";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = thread.title;
    const meta = document.createElement("p");
    meta.textContent = dateLabel(thread.updatedAt);
    copy.append(title, meta);
    const button = document.createElement("button");
    button.className = "secondary";
    button.type = "button";
    button.textContent = "選択して本文を読む";
    button.addEventListener("click", () => readThread(thread, button));
    article.append(copy, button);
    tasks.append(article);
  }
}

loadButton.addEventListener("click", async () => {
  loadButton.disabled = true;
  detailsPanel.hidden = true;
  setStatus("メタデータだけを取得しています…");
  try {
    const payload = await jsonRequest("/api/threads?limit=10");
    renderThreads(payload.threads);
    setStatus("本文はまだ読み取っていません。読み取るタスクを選択してください。");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    loadButton.disabled = false;
  }
});

jsonRequest("/api/config")
  .then((payload) => { workspace.textContent = payload.workspace; })
  .catch((error) => setStatus(error.message, true));
