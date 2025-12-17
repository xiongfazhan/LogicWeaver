/**
 * API 配置文件
 * 配置 OpenAPI 客户端的 base URL 和其他设置
 */
import { OpenAPI } from './generated';

// 从环境变量获取 API base URL，默认为本地开发地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * 初始化 API 配置
 */
export function initializeApi() {
  OpenAPI.BASE = API_BASE_URL;
  OpenAPI.WITH_CREDENTIALS = true;
}

/**
 * 获取当前 API base URL
 */
export function getApiBaseUrl(): string {
  return OpenAPI.BASE || API_BASE_URL;
}

// 导出配置常量
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 秒超时
} as const;
