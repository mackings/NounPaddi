const NodeCache = require('node-cache');

// Create cache instances with different TTLs for different data types
const courseCache = new NodeCache({
  stdTTL: 3600, // 1 hour for courses
  checkperiod: 600 // Check for expired keys every 10 minutes
});

const departmentCache = new NodeCache({
  stdTTL: 7200, // 2 hours for departments (changes less frequently)
  checkperiod: 600
});

const facultyCache = new NodeCache({
  stdTTL: 7200, // 2 hours for faculties (changes less frequently)
  checkperiod: 600
});

const questionCache = new NodeCache({
  stdTTL: 1800, // 30 minutes for questions
  checkperiod: 300
});

const materialCache = new NodeCache({
  stdTTL: 3600, // 1 hour for materials
  checkperiod: 600
});

// Generic cache helper functions
const cacheHelper = {
  /**
   * Get data from cache or execute callback to fetch and cache it
   * @param {NodeCache} cache - The cache instance to use
   * @param {string} key - Cache key
   * @param {Function} fetchCallback - Async function to fetch data if not in cache
   * @returns {Promise<any>} Cached or freshly fetched data
   */
  async getOrSet(cache, key, fetchCallback) {
    try {
      // Try to get from cache first
      const cachedData = cache.get(key);

      if (cachedData !== undefined) {
        console.log(`Cache HIT for key: ${key}`);
        return cachedData;
      }

      // Cache miss - fetch fresh data
      console.log(`Cache MISS for key: ${key}`);
      const freshData = await fetchCallback();

      // Store in cache
      cache.set(key, freshData);

      return freshData;
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      // On error, try to fetch fresh data anyway
      return await fetchCallback();
    }
  },

  /**
   * Invalidate a specific cache key
   * @param {NodeCache} cache - The cache instance
   * @param {string} key - Cache key to invalidate
   */
  invalidate(cache, key) {
    cache.del(key);
    console.log(`Cache invalidated for key: ${key}`);
  },

  /**
   * Invalidate multiple cache keys matching a pattern
   * @param {NodeCache} cache - The cache instance
   * @param {string} pattern - Pattern to match keys (e.g., 'course_*')
   */
  invalidatePattern(cache, pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(key);
    });

    matchingKeys.forEach(key => cache.del(key));
    console.log(`Cache invalidated for pattern ${pattern}: ${matchingKeys.length} keys`);
  },

  /**
   * Clear entire cache
   * @param {NodeCache} cache - The cache instance
   */
  clear(cache) {
    cache.flushAll();
    console.log('Cache cleared');
  },

  /**
   * Get cache statistics
   * @param {NodeCache} cache - The cache instance
   * @returns {object} Cache statistics
   */
  getStats(cache) {
    return cache.getStats();
  }
};

module.exports = {
  courseCache,
  departmentCache,
  facultyCache,
  questionCache,
  materialCache,
  cacheHelper
};
