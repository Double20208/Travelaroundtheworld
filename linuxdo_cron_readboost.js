// ==UserScript==
// @name         LINUXDO ReadBoost (Cron + Capture V2)
// @description  自动抓取 Cookie 与 CSRF Token，并在后台定时刷取帖子阅读量
// @author       Universal Code Architect
// ==/UserScript==

const STORE_KEY_COOKIE = "linuxdo_cookie";
const STORE_KEY_CSRF = "linuxdo_csrf";
const STORE_KEY_TOPIC = "linuxdo_topic";
const STORE_KEY_POST_IDX = "linuxdo_post_idx";

const isCaptureMode = typeof $request !== "undefined" && typeof $response !== "undefined";

if (isCaptureMode) {
    // ==========================================
    // 1. 抓取模式 (Rewrite)
    // ==========================================
    const url = $request.url;
    // 统一获取小写 header，防止大小写兼容问题
    const getHeader = (key) => $request.headers[key] || $request.headers[key.toLowerCase()];
    
    const cookie = getHeader("Cookie");
    const body = $response.body || "";
    
    // 提取 CSRF (兼容单双引号及不同位置)
    const csrfMatch = body.match(/<meta[^>]+name=['"]csrf-token['"][^>]+content=['"]([^'"]+)['"]/i) || 
                      body.match(/<meta[^>]+content=['"]([^'"]+)['"][^>]+name=['"]csrf-token['"]/i);
    const csrf = csrfMatch ? csrfMatch[1] : null;
    
    // 提取 Topic ID (兼容带楼层号或参数的 URL，如 /t/topic-name/123/2)
    const topicMatch = url.match(/\/t\/[^/]+\/(\d+)/);
    const topicId = topicMatch ? topicMatch[1] : null;

    if (cookie && csrf && topicId) {
        $prefs.setValueForKey(cookie, STORE_KEY_COOKIE);
        $prefs.setValueForKey(csrf, STORE_KEY_CSRF);
        $prefs.setValueForKey(topicId, STORE_KEY_TOPIC);
        $prefs.setValueForKey("1", STORE_KEY_POST_IDX); 
        
        $notify("LINUX.DO 抓取成功 ✅", `帖子 ID: ${topicId}`, "凭证与Token已锁定，定时任务已准备就绪！");
    } else {
        // Debug 提示，帮助定位为何没抓到
        console.log(`[ReadBoost 抓取失败] Cookie: ${!!cookie}, CSRF: ${!!csrf}, TopicID: ${!!topicId}`);
    }
    
    $done({ body: body });

} else {
    // ==========================================
    // 2. 定时发包模式 (Cron Task)
    // ==========================================
    const cookie = $prefs.valueForKey(STORE_KEY_COOKIE);
    const csrf = $prefs.valueForKey(STORE_KEY_CSRF);
    const topicId = $prefs.valueForKey(STORE_KEY_TOPIC);
    let currentIdx = parseInt($prefs.valueForKey(STORE_KEY_POST_IDX) || "1", 10);

    if (!cookie || !csrf || !topicId) {
        console.log("LINUX.DO 刷量终止：未获取到凭证。");
        $done();
    }

    const batchSize = 15; 
    const minReadTime = 800;
    const maxReadTime = 3000;

    let postBody = `topic_id=${topicId}&topic_time=${(batchSize * 1500)}`; 
    for (let i = currentIdx; i < currentIdx + batchSize; i++) {
        let randomTime = Math.floor(Math.random() * (maxReadTime - minReadTime + 1)) + minReadTime;
        postBody += `&timings[${i}]=${randomTime}`;
    }

    const request = {
        url: "https://linux.do/topics/timings",
        method: "POST",
        headers: {
            "Cookie": cookie,
            "X-CSRF-Token": csrf,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
        },
        body: postBody
    };

    $task.fetch(request).then(response => {
        if (response.statusCode === 200 || response.statusCode === 202) {
            let nextIdx = currentIdx + batchSize;
            $prefs.setValueForKey(nextIdx.toString(), STORE_KEY_POST_IDX);
            console.log(`LINUX.DO 刷量成功: 帖子 ${topicId}, 进度 ${currentIdx} -> ${nextIdx - 1}`);
        } else if (response.statusCode === 403 || response.statusCode === 401) {
            $notify("LINUX.DO ReadBoost ⚠️", "凭证已失效", "请重新在浏览器打开帖子抓取 Cookie。");
        }
        $done();
    }, reason => {
        console.log(`LINUX.DO 请求错误: ${reason.error}`);
        $done();
    });
}
