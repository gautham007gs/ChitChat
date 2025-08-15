
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

const createMockClient = (reason: string): SupabaseClient => {
  console.warn(`Supabase Client: Using MOCK client. Reason: ${reason}. Analytics and global configs will not be fetched/saved from/to Supabase.`);
  return {
    from: (table: string) => ({
      select: async (selectQuery = '*', options = {}) => {
        console.warn(`Supabase (mock client): Mock select from ${table}. Query: ${selectQuery}`);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      },
      insert: async (data: any, options = {}) => {
        console.warn(`Supabase (mock client): Mock insert into ${table}. Data:`, data);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      },
      update: async (data: any, options = {}) => {
        console.warn(`Supabase (mock client): Mock update on ${table}. Data:`, data);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      },
      delete: async (options = {}) => {
        console.warn(`Supabase (mock client): Mock delete from ${table}.`);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      },
      upsert: async (data: any, options = {}) => {
        console.warn(`Supabase (mock client): Mock upsert into ${table}. Data:`, data);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      },
      rpc: async (fn: string, params?: object, options = {}) => {
        console.warn(`Supabase (mock client): Mock rpc call to ${fn}. Params:`, params);
        return { data: null, error: { message: `Mock client: ${reason}`, details: '', hint: '', code: '' }, count: null, status: 400, statusText: 'Bad Request' };
      }
    }),
    // Add other top-level Supabase client methods if needed by the app, e.g., auth
    auth: {
        signInWithPassword: async (credentials) => {
            console.warn('Supabase (mock client): Mock signInWithPassword.');
            return { data: null, user: null, session: null, error: { message: `Mock client: ${reason}`, name: 'AuthApiError', status: 400 } as any };
        },
        // Add other auth methods as needed
    } as any,
  } as any; // Cast to any to satisfy SupabaseClient type for mock
};

if (typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '' && supabaseUrl !== 'your_supabase_project_url_here' &&
    typeof supabaseAnonKey === 'string' && supabaseAnonKey.trim() !== '' && supabaseAnonKey !== 'your_supabase_project_anon_key_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase Client: Successfully initialized REAL Supabase client.");
  } catch (error: any) {
    const initErrorMessage = `Failed to initialize Supabase client: ${error.message}. Check if NEXT_PUBLIC_SUPABASE_URL is a valid URL.`;
    console.error("❌", initErrorMessage);
    supabase = createMockClient(initErrorMessage);
  }
} else {
  let missingVarsReason = '⚠️  Supabase credentials missing or using placeholder values.';
  if (!supabaseUrl || supabaseUrl.trim() === '' || supabaseUrl === 'your_supabase_project_url_here') {
    missingVarsReason += ' NEXT_PUBLIC_SUPABASE_URL needs to be set with actual value.';
  }
  if (!supabaseAnonKey || supabaseAnonKey.trim() === '' || supabaseAnonKey === 'your_supabase_project_anon_key_here') {
    missingVarsReason += ' NEXT_PUBLIC_SUPABASE_ANON_KEY needs to be set with actual value.';
  }
  console.warn(missingVarsReason);
  supabase = createMockClient(missingVarsReason + ' Using mock client for development.');
}

export { supabase };
