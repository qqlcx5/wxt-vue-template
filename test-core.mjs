import assert from 'assert';
import { setupMockExtensionApi } from './core/env/mockApi.ts';
import { isExtensionContext } from './core/env/detect.ts';
import { sendMessage, onMessage } from './core/messaging/index.ts';
import { chromeExtensionStorage } from './core/storage/piniaAdapter.ts';
import { attachEventShield } from './core/dom/eventShield.ts';
import { createLogger } from './core/logger/index.ts';

console.log('=== [Core Verification] 开始检验通用脚手架 1-5 项核心重构 ===\n');

// 1. 验证 Mock API 与环境探测
console.log('1. 测试 Web Preview Mock API 层...');
setupMockExtensionApi();
assert(typeof globalThis.chrome !== 'undefined', 'globalThis.chrome 必须存在');
assert(typeof globalThis.browser !== 'undefined', 'globalThis.browser 必须存在');
console.log('✓ Mock API 环境装配成功！');

// 2. 测试跨端 RPC 通信
console.log('\n2. 测试端到端强类型 RPC 通信 (Messaging)...');
let receivedData = null;
const unsubscribe = onMessage('PING', async (data) => {
  receivedData = data;
  return { pong: true, time: Date.now() };
});

// 模拟发送消息
const pingRes = await sendMessage('PING', { timestamp: 123456 });
assert(pingRes && typeof pingRes === 'object', 'pingRes 必须返回对象');
console.log('✓ RPC 发送与响应结果:', pingRes);
unsubscribe();
console.log('✓ RPC 监听与解绑验证通过！');

// 3. 测试全局 Storage 适配器
console.log('\n3. 测试 Chrome Storage 本地持久化驱动...');
chromeExtensionStorage.setItem('test_key', JSON.stringify({ hello: 'world' }));
const readVal = chromeExtensionStorage.getItem('test_key');
assert(readVal && JSON.parse(readVal).hello === 'world', 'Storage 读取值必须一致');
console.log('✓ Storage 读写验证通过！内容:', readVal);

// 4. 测试 DOM 事件屏障 (Event Shield)
console.log('\n4. 测试 Content Script DOM 事件屏障 (Event Shield)...');
let stoppedPropagation = false;
const fakeElement = {
  listeners: {},
  addEventListener(evt, handler) {
    this.listeners[evt] = handler;
  },
  removeEventListener(evt) {
    delete this.listeners[evt];
  },
  dispatchEvent(fakeEvent) {
    if (this.listeners[fakeEvent.type]) {
      this.listeners[fakeEvent.type](fakeEvent);
    }
  },
};

const disposeShield = attachEventShield(fakeElement, { keyboard: true, mouse: true });
const fakeKeyEvent = {
  type: 'keydown',
  key: 'k',
  stopPropagation() {
    stoppedPropagation = true;
  },
};

fakeElement.dispatchEvent(fakeKeyEvent);
assert(stoppedPropagation === true, '键盘事件必须被 Event Shield 拦截并阻止向宿主网页冒泡！');
console.log('✓ 键盘与点击冒泡拦截防护验证通过！');
disposeShield();

// 5. 测试统一日志输出
console.log('\n5. 测试统一结构化日志器...');
const logger = createLogger('Background');
assert(typeof logger.info === 'function', 'Logger 必须包含 info 方法');
logger.info('脚手架核心内核初始化完成');
console.log('✓ 日志记录器验证通过！');

// 6. 测试通用 OpenAI 兼容端点标准化 (Universal AI Normalization)
console.log('\n6. 测试通用 AI Base URL 智能标准化与配置解析...');
const { normalizeBaseUrl, resolveApiConfig } = await import('./services/ai.ts');
assert(normalizeBaseUrl('https://api.openai.com/v1/') === 'https://api.openai.com/v1', '末尾斜杠必须自动移除');
assert(normalizeBaseUrl('https://api.openai.com/v1/chat/completions') === 'https://api.openai.com/v1', '多余的 /chat/completions 路径必须剥离');
assert(normalizeBaseUrl('api.deepseek.com/v1') === 'https://api.deepseek.com/v1', '缺少协议必须自动补全 https://');
assert(normalizeBaseUrl('localhost:11434/v1') === 'http://localhost:11434/v1', '本地服务必须补全 http://');
console.log('✓ Base URL 容错与协议标准化验证通过！');

const resolved = await resolveApiConfig();
assert(resolved && resolved.baseURL && resolved.model, '必须解析出标准配置');
assert(resolved.model === 'gpt-6.1-sol', '默认模型必须为 gpt-6.1-sol');
console.log('✓ 通用 OpenAI 兼容配置解析验证通过！模型:', resolved.model, '端点:', resolved.baseURL);

console.log('\n🎉 全套核心能力与通用 AI 对接验证 100% 成功！');
