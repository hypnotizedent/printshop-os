/**
 * Redis caching utilities
 */

import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  if (process.env.DEBUG === 'true') {
    console.log('Redis client connected');
  }
});

// Initialize connection
let isConnected = false;
const connectRedis = async () => {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }
};

// Cache TTL in seconds
export const CACHE_TTL = {
  REVENUE: 15 * 60, // 15 minutes
  PRODUCTS: 30 * 60, // 30 minutes
  CUSTOMERS: 60 * 60, // 1 hour
  ORDERS: 15 * 60, // 15 minutes
};

/**
 * Get cached data
 */
export const getCache = async (key: string): Promise<any | null> => {
  try {
    await connectRedis();
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set cached data with TTL
 */
export const setCache = async (key: string, value: any, ttl: number = CACHE_TTL.REVENUE): Promise<void> => {
  try {
    await connectRedis();
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete cached data
 */
export const delCache = async (key: string): Promise<void> => {
  try {
    await connectRedis();
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Generate cache key from params
 */
export const generateCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
};

export default redisClient;
