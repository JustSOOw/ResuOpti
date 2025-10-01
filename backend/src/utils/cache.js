/**
 * 简单的LRU缓存工具
 * 提供内存级别的缓存功能，适用于不常变化的数据
 * 使用LRU（最近最少使用）策略进行缓存淘汰
 */

class LRUCache {
  /**
   * 创建LRU缓存实例
   * @param {number} maxSize - 缓存最大容量，默认100条
   * @param {number} ttl - 缓存生存时间（毫秒），默认5分钟
   */
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    // 使用Map保证插入顺序，便于实现LRU
    this.cache = new Map();
    // 记录每个key的过期时间
    this.expiryTimes = new Map();
  }

  /**
   * 生成缓存key
   * @param {string} prefix - 前缀
   * @param {Array} args - 参数数组
   * @returns {string} 缓存key
   */
  static generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  /**
   * 检查key是否过期
   * @param {string} key - 缓存key
   * @returns {boolean} 是否过期
   */
  _isExpired(key) {
    const expiryTime = this.expiryTimes.get(key);
    if (!expiryTime) {
      return true;
    }
    return Date.now() > expiryTime;
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存key
   * @returns {*} 缓存值，不存在或已过期返回undefined
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 检查是否过期
    if (this._isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    // 更新访问顺序（删除后重新插入到末尾）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存key
   * @param {*} value - 缓存值
   * @param {number} [customTtl] - 自定义TTL（毫秒），不传则使用默认TTL
   */
  set(key, value, customTtl) {
    // 如果已存在，先删除（以更新位置）
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.expiryTimes.delete(key);
    }

    // 如果缓存已满，删除最旧的项（Map的第一个项）
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.expiryTimes.delete(oldestKey);
    }

    // 插入新项（会被添加到末尾）
    this.cache.set(key, value);
    const ttl = customTtl !== undefined ? customTtl : this.ttl;
    this.expiryTimes.set(key, Date.now() + ttl);
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存key
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    this.expiryTimes.delete(key);
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
  }

  /**
   * 根据前缀清空缓存
   * @param {string} prefix - 缓存key前缀
   * @returns {number} 删除的缓存数量
   */
  clearByPrefix(prefix) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    // 清理过期项
    for (const key of this.cache.keys()) {
      if (this._isExpired(key)) {
        this.delete(key);
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationRate: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`
    };
  }

  /**
   * 包装异步函数，自动缓存结果
   * @param {string} key - 缓存key
   * @param {Function} fn - 异步函数
   * @param {number} [customTtl] - 自定义TTL
   * @returns {Promise<*>} 函数结果
   */
  async wrap(key, fn, customTtl) {
    // 先尝试从缓存获取
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // 缓存未命中，执行函数
    const result = await fn();

    // 存入缓存
    this.set(key, result, customTtl);

    return result;
  }
}

// 创建不同用途的缓存实例

/**
 * 用户信息缓存
 * 容量：200条
 * TTL：10分钟
 */
const userCache = new LRUCache(200, 10 * 60 * 1000);

/**
 * 岗位信息缓存
 * 容量：500条
 * TTL：5分钟
 */
const positionCache = new LRUCache(500, 5 * 60 * 1000);

/**
 * 简历元数据缓存
 * 容量：1000条
 * TTL：3分钟
 */
const metadataCache = new LRUCache(1000, 3 * 60 * 1000);

/**
 * 统计数据缓存
 * 容量：100条
 * TTL：30秒（统计数据更新较频繁）
 */
const statsCache = new LRUCache(100, 30 * 1000);

module.exports = {
  LRUCache,
  userCache,
  positionCache,
  metadataCache,
  statsCache
};
