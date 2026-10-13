import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
export default defineConfig({
  testDir:'tests/e2e',timeout:60000,retries:0,workers:1,
  use:{baseURL:process.env.BASE_URL??'http://localhost:3000',channel:'msedge',headless:true,trace:'off',screenshot:'off',actionTimeout:15000},
  reporter:[['list']],
});

