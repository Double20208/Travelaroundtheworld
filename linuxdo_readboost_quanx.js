// ==UserScript==
// @name         LINUXDO ReadBoost (QuanX Version)
// @description  利用 QuanX 的响应体修改功能，将原有 Tampermonkey 脚本安全注入到浏览器 DOM 中
// ==/UserScript==

let body = $response.body;

// 仅在返回有效 HTML 时进行注入
if (body && body.includes('</body>')) {
    
    // 利用闭包和 toString() 黑科技，完美避开模板字符串(``)的转义地狱问题
    const injectedLogic = function() {
        'use strict';

        // --- Polyfill (垫片): 将 Tampermonkey API 转换为标准 Web API ---
        const GM_getValue = function(key, defaultValue) {
            const val = localStorage.getItem("ReadBoost_" + key);
            if (val === null) return defaultValue;
            try { return JSON.parse(val); } catch (e) { return val; }
        };

        const GM_setValue = function(key, value) {
            localStorage.setItem("ReadBoost_" + key, JSON.stringify(value));
        };

        // QuanX 注入后没有外部菜单，脚本内置的页面 UI 已足够使用
        const GM_registerMenuCommand = function(name, fn) {}; 

        // ==========================================
        // 以下为原版业务逻辑 (完全复用)
        // ==========================================
        const hasAgreed = GM_getValue("hasAgreed", false);
        if (!hasAgreed) {
            const userInput = prompt("[ LINUXDO ReadBoost ]\n检测到这是你第一次使用LINUXDO ReadBoost，使用前你必须知晓：使用该第三方脚本可能会导致包括并不限于账号被限制、被封禁的潜在风险，脚本不对出现的任何风险负责，这是一个开源脚本，你可以自由审核其中的内容，如果你同意以上内容，请输入'明白'");
            if (userInput !== "明白") {
                alert("您未同意风险提示，脚本已停止运行。");
                return;
            }
            GM_setValue("hasAgreed", true);
        }

        const DEFAULT_CONFIG = {
            baseDelay: 2500, randomDelayRange: 800,
            minReqSize: 8, maxReqSize: 20,
            minReadTime: 800, maxReadTime: 3000,
            autoStart: false, startFromCurrent: false
        };

        let config = { ...DEFAULT_CONFIG, ...getStoredConfig() };
        let isRunning = false, shouldStop = false, statusLabel = null, initTimeout = null;

        function isTopicPage() {
            return /^https:\/\/linux\.do\/t\/[^/]+\/\d+/.test(window.location.href);
        }

        function getPageInfo() {
            if (!isTopicPage()) throw new Error("不在帖子页面");
            const topicID = window.location.pathname.split("/")[3];
            const repliesElement = document.querySelector("div[class=timeline-replies]");
            const csrfElement = document.querySelector("meta[name=csrf-token]");
            if (!repliesElement || !csrfElement) throw new Error("无法获取页面信息，请确认在正确的帖子页面");
            
            const repliesInfo = repliesElement.textContent.trim();
            const [currentPosition, totalReplies] = repliesInfo.split("/").map(part => parseInt(part.trim(), 10));
            const csrfToken = csrfElement.getAttribute("content");
            return { topicID, currentPosition, totalReplies, csrfToken };
        }

        function getStoredConfig() {
            return {
                baseDelay: GM_getValue("baseDelay", DEFAULT_CONFIG.baseDelay),
                randomDelayRange: GM_getValue("randomDelayRange", DEFAULT_CONFIG.randomDelayRange),
                minReqSize: GM_getValue("minReqSize", DEFAULT_CONFIG.minReqSize),
                maxReqSize: GM_getValue("maxReqSize", DEFAULT_CONFIG.maxReqSize),
                minReadTime: GM_getValue("minReadTime", DEFAULT_CONFIG.minReadTime),
                maxReadTime: GM_getValue("maxReadTime", DEFAULT_CONFIG.maxReadTime),
                autoStart: GM_getValue("autoStart", DEFAULT_CONFIG.autoStart),
                startFromCurrent: GM_getValue("startFromCurrent", DEFAULT_CONFIG.startFromCurrent)
            };
        }

        function saveConfig(newConfig) {
            Object.keys(newConfig).forEach(key => {
                GM_setValue(key, newConfig[key]);
                config[key] = newConfig[key];
            });
            location.reload();
        }

        function createStatusLabel() {
            const existingLabel = document.getElementById("readBoostStatusLabel");
            if (existingLabel) existingLabel.remove();
            const headerButtons = document.querySelector(".header-buttons");
            if (!headerButtons) return null;

            const labelSpan = document.createElement("span");
            labelSpan.id = "readBoostStatusLabel";
            labelSpan.style.cssText = `margin-left: 10px; margin-right: 10px; padding: 5px 10px; border-radius: 4px; background: var(--primary-low); color: var(--primary); font-size: 12px; font-weight: bold; cursor: pointer;`;
            labelSpan.textContent = "ReadBoost ⚙️";
            labelSpan.addEventListener("click", showSettingsUI);
            headerButtons.appendChild(labelSpan);
            return labelSpan;
        }

        function updateStatus(text, type = "info") {
            if (!statusLabel) return;
            const colors = { info: "var(--primary)", success: "#2e8b57", warning: "#ff8c00", error: "#dc3545", running: "#007bff" };
            statusLabel.textContent = text + " ⚙️";
            statusLabel.style.color = colors[type] || colors.info;
        }

        function showSettingsUI() {
            const settingsDiv = document.createElement("div");
            settingsDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 25px; border-radius: 12px; z-index: 10000; background: var(--secondary); color: var(--primary); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); border: 1px solid var(--primary-low); min-width: 400px; max-width: 500px;`;
            
            const autoStartChecked = config.autoStart ? "checked" : "";
            const startFromCurrentChecked = config.startFromCurrent ? "checked" : "";
            
            settingsDiv.innerHTML = `
                <h3 style="margin-top: 0; color: var(--primary); text-align: center;">ReadBoost 设置</h3>
                <div style="display: grid; gap: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>基础延迟(ms):</span><input id="baseDelay" type="number" value="${config.baseDelay}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>随机延迟范围(ms):</span><input id="randomDelayRange" type="number" value="${config.randomDelayRange}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>最小每次请求量:</span><input id="minReqSize" type="number" value="${config.minReqSize}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>最大每次请求量:</span><input id="maxReqSize" type="number" value="${config.maxReqSize}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>最小阅读时间(ms):</span><input id="minReadTime" type="number" value="${config.minReadTime}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                        <label style="display: flex; flex-direction: column; gap: 5px;"><span>最大阅读时间(ms):</span><input id="maxReadTime" type="number" value="${config.maxReadTime}" style="padding: 8px; border: 1px solid var(--primary-low); border-radius: 4px; background: var(--secondary);"></label>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="advancedMode" style="transform: scale(1.2);"><span>高级设置模式</span></label>
                        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="autoStart" ${autoStartChecked} style="transform: scale(1.2);"><span>自动运行</span></label>
                        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="startFromCurrent" ${startFromCurrentChecked} style="transform: scale(1.2);"><span>从当前位置开始</span></label>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
                        <button id="saveSettings" style="padding: 10px 20px; border: none; border-radius: 6px; background: #007bff; color: white; cursor: pointer;">保存设置</button>
                        <button id="resetDefaults" style="padding: 10px 20px; border: none; border-radius: 6px; background: #6c757d; color: white; cursor: pointer;">重置默认</button>
                        <button id="closeSettings" style="padding: 10px 20px; border: none; border-radius: 6px; background: #dc3545; color: white; cursor: pointer;">关闭</button>
                        <button id="triggerStart" style="padding: 10px 20px; border: none; border-radius: 6px; background: #28a745; color: white; cursor: pointer;">🚀 立即开始</button>
                    </div>
                </div>
            `;
            document.body.appendChild(settingsDiv);

            const toggleAdvancedInputs = (enabled) => {
                ["baseDelay", "randomDelayRange", "minReqSize", "maxReqSize", "minReadTime", "maxReadTime"].forEach(id => {
                    const input = document.getElementById(id);
                    if (input) { input.disabled = !enabled; input.style.opacity = enabled ? "1" : "0.6"; }
                });
            };
            toggleAdvancedInputs(false);

            document.getElementById("advancedMode").addEventListener("change", (e) => {
                if (e.target.checked && !confirm("高级设置可能增加账号风险，确定要启用吗？")) {
                    e.target.checked = false; return;
                }
                toggleAdvancedInputs(e.target.checked);
            });

            document.getElementById("saveSettings").addEventListener("click", () => {
                saveConfig({
                    baseDelay: parseInt(document.getElementById("baseDelay").value, 10),
                    randomDelayRange: parseInt(document.getElementById("randomDelayRange").value, 10),
                    minReqSize: parseInt(document.getElementById("minReqSize").value, 10),
                    maxReqSize: parseInt(document.getElementById("maxReqSize").value, 10),
                    minReadTime: parseInt(document.getElementById("minReadTime").value, 10),
                    maxReadTime: parseInt(document.getElementById("maxReadTime").value, 10),
                    autoStart: document.getElementById("autoStart").checked,
                    startFromCurrent: document.getElementById("startFromCurrent").checked
                });
                settingsDiv.remove(); updateStatus("设置已保存", "success");
            });

            document.getElementById("resetDefaults").addEventListener("click", () => {
                if (confirm("确定要重置吗？")) { saveConfig(DEFAULT_CONFIG); settingsDiv.remove(); updateStatus("已重置", "info"); }
            });

            document.getElementById("closeSettings").addEventListener("click", () => settingsDiv.remove());
            
            // 为移动端增加便捷的触发按钮
            document.getElementById("triggerStart").addEventListener("click", () => {
                settingsDiv.remove();
                startReading();
            });
        }

        async function startReading() {
            if (isRunning) { updateStatus("脚本运行中...", "warning"); return; }
            try {
                const pageInfo = getPageInfo();
                isRunning = true; shouldStop = false;
                updateStatus("启动中...", "running");
                await processReading(pageInfo);
                updateStatus("处理完成", "success");
            } catch (error) {
                if (error.message === "用户停止执行") updateStatus("ReadBoost", "info");
                else updateStatus("失败: " + error.message, "error");
            } finally { isRunning = false; }
        }

        function stopReading() { shouldStop = true; updateStatus("停止中...", "warning"); }

        async function processReading(pageInfo) {
            const { topicID, currentPosition, totalReplies, csrfToken } = pageInfo;
            const startPosition = config.startFromCurrent ? currentPosition : 1;
            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            async function sendBatch(startId, endId, retryCount = 3) {
                if (shouldStop) throw new Error("用户停止执行");
                const params = new URLSearchParams();
                for (let i = startId; i <= endId; i++) params.append(`timings[${i}]`, getRandomInt(config.minReadTime, config.maxReadTime).toString());
                const topicTime = getRandomInt(config.minReadTime * (endId - startId + 1), config.maxReadTime * (endId - startId + 1)).toString();
                params.append('topic_time', topicTime); params.append('topic_id', topicID);

                try {
                    const response = await fetch("https://linux.do/topics/timings", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-CSRF-Token": csrfToken, "X-Requested-With": "XMLHttpRequest" },
                        body: params, credentials: "include"
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    if (shouldStop) throw new Error("用户停止执行");
                    updateStatus(`处理中 ${startId}-${endId} (${Math.round((endId / totalReplies) * 100)}%)`, "running");
                } catch (error) {
                    if (shouldStop) throw error;
                    if (retryCount > 0) {
                        updateStatus(`重试 ${startId}-${endId}`, "warning");
                        await new Promise(r => setTimeout(r, 2000));
                        return await sendBatch(startId, endId, retryCount - 1);
                    }
                    throw error;
                }

                const delay = config.baseDelay + getRandomInt(0, config.randomDelayRange);
                for (let i = 0; i < delay; i += 100) {
                    if (shouldStop) throw new Error("用户停止执行");
                    await new Promise(r => setTimeout(r, Math.min(100, delay - i)));
                }
            }

            for (let i = startPosition; i <= totalReplies;) {
                if (shouldStop) break;
                const batchSize = getRandomInt(config.minReqSize, config.maxReqSize);
                const startId = i; const endId = Math.min(i + batchSize - 1, totalReplies);
                await sendBatch(startId, endId); i = endId + 1;
            }
        }

        function init() {
            statusLabel = createStatusLabel();
            shouldStop = true;
            if (isRunning) { setTimeout(init, 1000); return; }
            isRunning = false; shouldStop = false;
            if (initTimeout) clearTimeout(initTimeout);
            if (!isTopicPage()) return;

            try {
                const pageInfo = getPageInfo();
                statusLabel = createStatusLabel();
                if (config.autoStart) initTimeout = setTimeout(startReading, 1000);
            } catch (error) {
                initTimeout = setTimeout(init, 1000);
            }
        }

        function setupRouteListener() {
            let lastUrl = location.href;
            const originalPushState = history.pushState;
            history.pushState = function () {
                originalPushState.apply(history, arguments);
                if (location.href !== lastUrl) { lastUrl = location.href; setTimeout(init, 500); }
            };
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => { init(); setupRouteListener(); });
        } else {
            init(); setupRouteListener();
        }
    };

    // 组装最终的注入脚本：调用 toString() 转化为纯字符串，完美回避所有引号与反引号冲突
    const scriptTag = `<script>\n(${injectedLogic.toString()})();\n</script>`;
    
    // 注入到页面底部
    body = body.replace(/<\/body>/i, scriptTag + '</body>');
}

$done({ body });
