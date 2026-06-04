import { Config } from '../../constants/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 调用智谱 GLM-4-Flash 聊天接口，返回模型生成的文本。
 * 智谱 v4 接口支持直接用 API Key 作为 Bearer Token 鉴权。
 */
export async function zhipuChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const { temperature = 0.6, maxTokens = 1024, timeoutMs = 20000 } = options;

  const res = await fetchWithTimeout(
    Config.zhipu.baseUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Config.zhipu.apiKey}`,
      },
      body: JSON.stringify({
        model: Config.zhipu.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    throw new Error(`Zhipu API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * 从模型返回文本中宽松解析 JSON（容忍 ```json 代码块和前后多余文字）。
 * 解析失败返回 null，由调用方降级处理。
 */
export function parseJsonLoose<T>(text: string): T | null {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstObj = cleaned.indexOf('{');
  const firstArr = cleaned.indexOf('[');
  let start = -1;
  let close = '';
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    close = ']';
  } else if (firstObj !== -1) {
    start = firstObj;
    close = '}';
  }
  if (start === -1) return null;

  const end = cleaned.lastIndexOf(close);
  if (end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
