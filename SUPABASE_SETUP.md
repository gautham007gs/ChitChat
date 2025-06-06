
# Supabase Setup for Kruthika Chat Analytics & Configuration

This guide explains how to set up a Supabase project to:
1.  Collect analytics (like total messages and daily active user estimates) for your Kruthika Chat application.
2.  Store and manage global application configurations, such as Ad Settings, so they are universal for all users.

## 1. Create a Supabase Account and Project

1.  Go to [supabase.com](https://supabase.com/) and sign up for a free account if you don't have one.
2.  Create a new project. Choose a name, generate a strong database password (save this securely!), and select a region. The free tier is sufficient for this setup.

## 2. Get Your Project URL and Anon Key

Once your project is created:

1.  Navigate to your project dashboard in Supabase.
2.  Go to **Project Settings** (usually a gear icon).
3.  Click on **API**.
4.  You will find your **Project URL** and the **Project API Key** (specifically, the `anon` `public` key).
5.  Copy these values.

## 3. Configure Environment Variables

In your Kruthika Chat project, open the `.env` file (or create one if it doesn't exist at the root of your project). Add the following lines, replacing the placeholders with the values you copied from Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_project_anon_key_here

# Make sure your GOOGLE_API_KEY is also set for Genkit
GOOGLE_API_KEY=your_gemini_api_key_here
```

**Important:** If you deploy your application (e.g., to Vercel), you must set these environment variables in your hosting provider's settings. Do **not** commit the `.env` file with real keys to your Git repository.

## 4. Create Database Tables and Functions

The application is configured to log messages, daily activity, and store global configurations. You need to create these in your Supabase database.

1.  In your Supabase project dashboard, go to the **SQL Editor** (looks like an SQL query icon).
2.  Click **"+ New query"**.
3.  Paste the following SQL code in sections and click **"RUN"** for each section.

**Section 1: `messages_log` Table and Related Function (for message counts)**

```sql
-- Create the messages_log table
CREATE TABLE public.messages_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  message_id TEXT,
  sender_type TEXT, -- 'user' or 'ai'
  chat_id TEXT,     -- e.g., 'kruthika_chat' to identify this specific chat instance
  text_content TEXT, -- Store a snippet of the message text
  has_image BOOLEAN DEFAULT FALSE
);

-- Add comments on columns for clarity
COMMENT ON COLUMN public.messages_log.created_at IS 'Timestamp of when the log entry was created';
COMMENT ON COLUMN public.messages_log.message_id IS 'Unique ID of the original message from the chat';
COMMENT ON COLUMN public.messages_log.sender_type IS 'Indicates if the message was from a "user" or "ai"';
COMMENT ON COLUMN public.messages_log.chat_id IS 'Identifier for the chat session or AI character (e.g., kruthika_chat, kruthika_chat_offline_ping)';
COMMENT ON COLUMN public.messages_log.text_content IS 'Content of the message (can be truncated)';
COMMENT ON COLUMN public.messages_log.has_image IS 'Indicates if the message included an image';

-- Enable Row Level Security (RLS) on the new table.
ALTER TABLE public.messages_log ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert into messages_log.
-- !! CRITICAL PRODUCTION REVIEW !!: This policy is intentionally open for prototyping.
-- For a production app, you MUST restrict this to authenticated users or a secure backend mechanism.
-- Allowing global anonymous inserts can lead to abuse and high database costs.
-- Consider adding checks like `chat_id IN ('kruthika_chat', 'kruthika_chat_offline_ping')` if you want to restrict inserts only to known chat_ids from your app.
CREATE POLICY "Allow anon inserts for message logging - PROTOTYPE ONLY"
ON public.messages_log
FOR INSERT
WITH CHECK (true); -- DANGER: For a prototype, this is open. In production, TIGHTEN THIS CHECK SIGNIFICANTLY. For example: `WITH CHECK (auth.role() = 'authenticated' AND user_id_column = auth.uid())` if you have auth.

-- Create a policy that allows anonymous users (like your admin page) to read from messages_log.
-- !! CRITICAL PRODUCTION REVIEW !!: This policy is also open for prototyping.
-- For a production app, restrict this to specific authenticated admin roles only.
CREATE POLICY "Allow anon reads for analytics - PROTOTYPE ONLY"
ON public.messages_log
FOR SELECT
USING (true); -- DANGER: For a prototype, this is open. In production, restrict to specific roles. For example: `USING (auth.role() = 'service_role' OR (auth.role() = 'authenticated' AND is_admin_user_function(auth.uid())))`

-- Create a PostgreSQL function to get daily message counts (user and AI)
CREATE OR REPLACE FUNCTION get_daily_message_counts(start_date DATE)
RETURNS TABLE(date DATE, messages BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('day', ml.created_at AT TIME ZONE 'UTC')::DATE AS date, -- Ensure consistent timezone for truncation
    COUNT(ml.id) AS messages
  FROM public.messages_log ml
  WHERE (ml.created_at AT TIME ZONE 'UTC')::DATE >= start_date -- Compare dates directly
  GROUP BY DATE_TRUNC('day', ml.created_at AT TIME ZONE 'UTC')
  ORDER BY date ASC;
END;
$$;
```

**Section 2: `daily_activity_log` Table and Related Function (for DAU)**
**Make sure this table structure is correctly applied to your database. The `chat_id` column is essential.**
```sql
-- Create the daily_activity_log table
-- This table stores a log for each pseudo-anonymous user active on a given day for a specific chat_id.
CREATE TABLE public.daily_activity_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_pseudo_id TEXT NOT NULL, -- A browser-specific pseudo-anonymous ID for the user
  activity_date DATE NOT NULL,    -- The date the user was active
  chat_id TEXT,                 -- Identifier for the chat application (e.g., kruthika_chat), ensure this column exists!
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_activity_per_day_per_chat UNIQUE (user_pseudo_id, activity_date, chat_id) -- Ensures one entry per user, per day, per chat
);

-- Add comments for clarity
COMMENT ON COLUMN public.daily_activity_log.user_pseudo_id IS 'A browser-specific pseudo-anonymous ID for the user';
COMMENT ON COLUMN public.daily_activity_log.activity_date IS 'The date the user was active';
COMMENT ON COLUMN public.daily_activity_log.chat_id IS 'Identifier for the chat application (e.g., kruthika_chat). Crucial for distinguishing activity if using the same Supabase project for multiple apps.';


-- Enable Row Level Security (RLS) on the new table.
ALTER TABLE public.daily_activity_log ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert into daily_activity_log.
-- !! CRITICAL PRODUCTION REVIEW !!: Open for prototype. Restrict in production.
-- Consider adding checks like `chat_id = 'kruthika_chat'`
CREATE POLICY "Allow anon inserts for daily activity - PROTOTYPE ONLY"
ON public.daily_activity_log
FOR INSERT
WITH CHECK (true); -- DANGER: For a prototype, this is open.

-- Create a policy that allows anonymous users to read from daily_activity_log for analytics.
-- !! CRITICAL PRODUCTION REVIEW !!: Open for prototype. Restrict to admin roles in production.
CREATE POLICY "Allow anon reads for DAU analytics - PROTOTYPE ONLY"
ON public.daily_activity_log
FOR SELECT
USING (true); -- DANGER: For a prototype, this is open.

-- Create a PostgreSQL function to get daily active user counts
CREATE OR REPLACE FUNCTION get_daily_active_user_counts(start_date DATE)
RETURNS TABLE(date DATE, active_users BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dal.activity_date AS date,
    COUNT(DISTINCT dal.user_pseudo_id) AS active_users
  FROM public.daily_activity_log dal
  WHERE dal.activity_date >= start_date
  -- AND dal.chat_id = 'kruthika_chat' -- Uncomment if you want to scope DAU to this specific app, ensure your inserts match this chat_id
  GROUP BY dal.activity_date
  ORDER BY date ASC;
END;
$$;
```

**Section 3: `app_configurations` Table (for Global Ad Settings, etc.)**

```sql
-- Create the app_configurations table
CREATE TABLE public.app_configurations (
  id TEXT PRIMARY KEY, -- e.g., 'ad_settings_kruthika_chat_v1'
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for clarity
COMMENT ON COLUMN public.app_configurations.id IS 'Unique identifier for the configuration (e.g., ad_settings_kruthika_chat_v1)';
COMMENT ON COLUMN public.app_configurations.settings IS 'The actual configuration object stored as JSONB';
COMMENT ON COLUMN public.app_configurations.updated_at IS 'Timestamp of when the configuration was last updated';

-- Enable Row Level Security (RLS) on the new table.
ALTER TABLE public.app_configurations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users (ALL clients) to READ configurations.
-- This is necessary for the app to fetch ad settings for all users.
CREATE POLICY "Allow anon reads for app configurations"
ON public.app_configurations
FOR SELECT
USING (true);

-- Create a policy that allows anonymous users to INSERT configurations.
-- This is primarily for the first-time setup by the admin panel.
-- !! CRITICAL PRODUCTION REVIEW !!: For production, this INSERT should be restricted to an authenticated admin role.
CREATE POLICY "Allow anon inserts for app configurations - PROTOTYPE ONLY"
ON public.app_configurations
FOR INSERT
WITH CHECK (true); -- DANGER: Open for prototype. TIGHTEN THIS.

-- Create a policy that allows anonymous users to UPDATE configurations.
-- !! CRITICAL PRODUCTION REVIEW !!: This is HIGHLY INSECURE for production.
-- It means ANYONE could potentially change your global ad settings.
-- In production, this MUST be restricted to an authenticated admin role ONLY.
-- E.g., WITH CHECK (auth.role() = 'admin_user_role')
CREATE POLICY "Allow anon UPDATES for app configurations - EXTREMELY DANGEROUS FOR PRODUCTION - PROTOTYPE ONLY"
ON public.app_configurations
FOR UPDATE
USING (true) -- Allows any existing row to be targeted for update by anon
WITH CHECK (true); -- DANGER: Allows any update. TIGHTEN THIS (e.g., check auth.uid() or role).

-- Example: To insert initial ad_settings (can be done from Admin Panel save, or run this manually once after table creation)
-- INSERT INTO public.app_configurations (id, settings)
-- VALUES ('ad_settings_kruthika_chat_v1', '{
--   "adsEnabledGlobally": true,
--   "adsterraDirectLink": "YOUR_ADSTERRA_DEFAULT_LINK_HERE",
--   "adsterraDirectLinkEnabled": true,
--   "adsterraBannerCode": "<!-- Adsterra Banner Code Placeholder -->",
--   "adsterraBannerEnabled": false,
--   "adsterraPopunderCode": "<!-- Adsterra Pop-under Script Placeholder -->",
--   "adsterraPopunderEnabled": false,
--   "monetagDirectLink": "YOUR_MONETAG_DEFAULT_LINK_HERE",
--   "monetagDirectLinkEnabled": true,
--   "monetagBannerCode": "<!-- Monetag Banner Code Placeholder -->",
--   "monetagBannerEnabled": false,
--   "monetagPopunderCode": "<!-- Monetag Pop-under Script Placeholder -->",
--   "monetagPopunderEnabled": false
-- }');
```

**Section 4: Grant Execute Permissions on Functions**
```sql
-- Grant execute permission on the functions to the anon role
-- This allows the client to call these functions using the anon key for analytics.
-- !! CRITICAL PRODUCTION REVIEW !!: You may want to restrict function execution to authenticated users or backend roles.
-- Allowing anon role to execute any function can be a security risk if functions are not carefully designed.
GRANT EXECUTE ON FUNCTION get_daily_message_counts(DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_daily_active_user_counts(DATE) TO anon;
```

**Why these policies and functions?**
*   The `anon` key used by the frontend can only interact with tables based on RLS policies.
*   **`messages_log` & `daily_activity_log`:**
    *   The `INSERT` policies allow the chat page to log new messages and daily activity.
    *   The `SELECT` policies allow the admin dashboard page to read the data for analytics.
    *   The PostgreSQL functions provide an efficient way to query aggregated daily counts.
*   **`app_configurations`:**
    *   The `SELECT` policy allows *all* clients to fetch global settings (like ad settings).
    *   The `INSERT` and `UPDATE` policies (as defined above for PROTOTYPE ONLY) allow the admin panel (currently using the anon key) to save these global settings. **THESE ARE NOT PRODUCTION-SAFE.**

**CRITICAL Security Note on RLS Policies for Production:**
The Row Level Security (RLS) policies provided above, especially for `app_configurations` (INSERT/UPDATE) and `messages_log`/`daily_activity_log` (INSERT), are **intentionally permissive for this prototype and ARE NOT SUITABLE FOR PRODUCTION as-is**. In a **production environment**:
*   You **MUST** implement proper user authentication (e.g., Supabase Authentication).
*   For `app_configurations`, the `INSERT` and `UPDATE` policies **MUST** be restricted to a specific authenticated admin role (e.g., `WITH CHECK (auth.role() = 'admin_user_role')`). Consider using a Supabase Edge Function triggered by an authenticated admin request to perform these updates using the `service_role` key for maximum security.
*   For `messages_log` and `daily_activity_log` `INSERT` policies, consider adding checks like `chat_id = 'kruthika_chat'` to limit inserts only to data from your application.
*   **Failure to significantly tighten these RLS policies in production can lead to serious data privacy, security vulnerabilities (e.g., anyone changing your ad settings), and potential abuse of your database resources.**
*   **Review Supabase's official documentation on RLS and security best practices thoroughly before going live.**

## 5. Restart Your Application

After setting the environment variables and running the SQL to create the tables and functions, restart your Next.js development server:

```bash
npm run dev
```

Your Kruthika Chat app should now attempt to:
*   Log user and AI messages to your Supabase `messages_log` table.
*   Log daily activity for pseudo-anonymous users to the `daily_activity_log` table (this should now work if the schema is correct).
*   **Admin Panel:** Load and Save Ad Settings to/from the `app_configurations` table in Supabase.
*   **All Users:** Fetch Ad Settings from Supabase on app load to control ad display universally.

The Admin Profile page will also try to fetch and display analytics data from Supabase.

## Troubleshooting

*   **Check Browser Console:** Look for any Supabase-related errors (network errors, RLS permission errors).
*   **Check Supabase Logs:** In your Supabase project dashboard, go to **Logs** -> **PostgREST Logs** (for API calls) or **Database Logs** (for SQL function issues).
*   **Verify Tables, Functions, and Policies:** Double-check that all tables exist with the correct columns (especially `chat_id` in `daily_activity_log`), SQL functions exist, and RLS policies (including for `app_configurations`) are active.
    *   Test `app_configurations` read: `SELECT * FROM public.app_configurations WHERE id = 'ad_settings_kruthika_chat_v1';`
    *   Test `daily_activity_log` structure: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_activity_log';` (Ensure `chat_id` is listed as `text`).
*   **Environment Variables:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set.

This setup provides a foundation for global app configurations. Remember to prioritize security, especially RLS policies, if moving to production.

    