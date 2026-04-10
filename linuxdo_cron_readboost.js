// ==UserScript==
// @name         LINUXDO ReadBoost (Cron + Capture)
// @description  自动抓取 Cookie 与 CSRF Token，并在后台定时刷取帖子阅读量
// @author       Universal Code Architect
// ==/UserScript==

const STORE_KEY_COOKIE = "linuxdo_cookie";
const STORE_KEY_CSRF = "linuxdo_csrf";
const STORE_KEY_TOPIC = "linuxdo_topic";
const STORE_KEY_POST_IDX = "linuxdo_post_idx";

// 智能判定运行环境：如果有 $request 和 $response，说明是通过重写(Rewrite)触发的抓取模式
const isCaptureMode = typeof $request !== "undefined" && typeof $response !== "undefined";

if (isCaptureMode) {
    // ==========================================
    // 1. 抓取模式 (Rewrite - 浏览器访问帖子时触发)
    // ==========================================
    const url = $request.url;
    const headers = $request.headers;
    const body = $response.body;

    // 兼容 header 键名大小写
    const cookie = headers["Cookie"] || headers["cookie"];
    
    // 从 HTML 响应体中提取 CSRF 令牌
    const csrfMatch = body.match(/<meta name="csrf-token" content="([^"]+)"/);
    const csrf = csrfMatch ? csrfMatch[1] : null;
    
    // 从 URL 中提取当前正在访问的 Topic ID
    const topicMatch = url.match(/\/t\/[^/]+\/(\d+)/);
    const topicId = topicMatch ? topicMatch[1] : null;

    if (cookie && csrf && topicId) {
        // 存储抓取到的凭证
        $prefs.setValueForKey(cookie, STORE_KEY_COOKIE);
        $prefs.setValueForKey(csrf, STORE_KEY_CSRF);
        $prefs.setValueForKey(topicId, STORE_KEY_TOPIC);
        
        // 每次抓取新帖子时，重置阅读的楼层进度为 1
        $prefs.setValueForKey("1", STORE_KEY_POST_IDX); 
        
        $notify("LINUX.DO 抓取成功 ✅", `已锁定帖子 ID: ${topicId}`, "凭证已保存，后续将由定时任务自动接管刷量。");
    }
    
    // 必须调用 $done 放行原始响应，否则网页会白屏
    $done({ body: body });

} else {
    // ==========================================
    // 2. 自动化执行模式 (Cron Task - 定时在后台触发)
    // ==========================================
    const cookie = $prefs.valueForKey(STORE_KEY_COOKIE);
    const csrf = $prefs.valueForKey(STORE_KEY_CSRF);
    const topicId = $prefs.valueForKey(STORE_KEY_TOPIC);
    // 获取当前该帖子的阅读进度，默认从 1 楼开始
    let currentIdx = parseInt($prefs.valueForKey(STORE_KEY_POST_IDX) || "1", 10);

    if (!cookie || !csrf || !topicId) {
        $notify("LINUX.DO ReadBoost ❌", "缺少凭证或配置", "请先在手机浏览器中打开任意 LINUX.DO 帖子进行自动抓取。");
        $done();
    }

    // 每次定时任务模拟阅读 15 个楼层 (控制单次请求体大小，防止被 WAF 拦截)
    const batchSize = 15; 
    const minReadTime = 800;
    const maxReadTime = 3000;

    // 构造 x-www-form-urlencoded 格式的 Body
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
            // 成功后，将进度往前推 15 楼，存入本地
            let nextIdx = currentIdx + batchSize;
            $prefs.setValueForKey(nextIdx.toString(), STORE_KEY_POST_IDX);
            console.log(`LINUX.DO 刷量成功: 帖子 ${topicId}, 模拟阅读楼层 ${currentIdx} - ${nextIdx - 1}`);
            // 为避免频繁弹窗打扰，成功状态仅记录在 QuanX 日志中
        } else {
            console.log(`LINUX.DO 刷量异常: 状态码 ${response.statusCode}`);
            if (response.statusCode === 403 || response.statusCode === 401) {
                 $notify("LINUX.DO ReadBoost ⚠️", "登录凭证可能已失效", "请重新打开浏览器访问帖子以刷新 Cookie。");
            }
        }
        $done();
    }, reason => {
        console.log(`LINUX.DO 请求网络错误: ${reason.error}`);
        $done();
    });
}
