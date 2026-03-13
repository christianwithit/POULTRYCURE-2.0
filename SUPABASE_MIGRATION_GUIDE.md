# PoultryCure - Supabase Migration Guide

Complete guide for migrating PoultryCure authentication from local storage to Supabase.

## 📋 Prerequisites

- Node.js and npm installed
- Expo CLI installed
- Supabase account (free tier is sufficient)

## 🚀 Step-by-Step Setup

### **Step 1: Create Supabase Project**

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the details:
   - **Name:** `PoultryCure`
   - **Database Password:** Generate a strong password and **save it securely**
   - **Region:** Choose closest to Uganda:
     - Recommended: `eu-west-1` (Ireland) or `ap-southeast-1` (Singapore)
   - **Pricing Plan:** Free tier
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### **Step 2: Get Your Supabase Credentials**

1. Once the project is ready, go to **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

⚠️ **Important:** Use the **anon public** key, NOT the service_role key!

### **Step 3: Update Environment Variables**

1. Open your `.env` file (create one if it doesn't exist by copying `.env.example`)
2. Add your Supabase credentials:

```bash
# Existing Gemini API Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (ADD THESE)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. **Restart your Expo development server** for changes to take effect

### **Step 4: Set Up Database**

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the `SUPABASE_SETUP.sql` file from your project root
4. Copy the entire SQL script
5. Paste it into the SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`
7. Verify success - you should see "Success. No rows returned" messages

### **Step 5: Configure Authentication Settings**

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Email Auth** section:
   - ✅ **Enable email provider** (should be on by default)
   - For development: ⚠️ **Disable email confirmations** (optional, for easier testing)
   - For production: ✅ **Enable email confirmations** (recommended)
3. Under **Auth Providers**, ensure **Email** is enabled
4. Click **Save**

### **Step 6: Customize Email Templates (Optional)**

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Welcome email with verification link
   - **Reset password** - Password reset instructions
   - **Magic Link** - Passwordless login (if you want to add this later)

### **Step 7: Test the Integration**

1. **Start your Expo app:**
   ```bash
   npm start
   ```

2. **Test Signup:**
   - Open the app
   - Go to Sign Up screen
   - Create a new account with:
     - Name: Test User
     - Email: test@example.com
     - Password: (must meet requirements)
   - Should redirect to home screen after successful signup

3. **Verify in Supabase:**
   - Go to **Authentication** → **Users** in Supabase dashboard
   - You should see your new user
   - Go to **Table Editor** → **profiles**
   - You should see a profile entry with the user's name

4. **Test Login:**
   - Logout from the app
   - Login with the credentials you just created
   - Should successfully authenticate

5. **Test Password Reset:**
   - Go to Forgot Password screen
   - Enter your email
   - Check your email inbox (and spam folder)
   - Click the reset link
   - Set a new password

## 🔍 Verification Checklist

After setup, verify these items:

- [ ] Supabase project created and running
- [ ] Environment variables added to `.env`
- [ ] SQL setup script executed successfully
- [ ] `profiles` table exists in Supabase
- [ ] RLS (Row Level Security) enabled on `profiles` table
- [ ] Can create new user account
- [ ] Profile automatically created on signup
- [ ] Can login with created account
- [ ] Can logout successfully
- [ ] Session persists after app restart
- [ ] Password reset email received

## 🐛 Troubleshooting

### **Issue: "Invalid API key" or "Supabase credentials not found"**

**Solution:**
1. Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Restart Expo dev server: Stop and run `npm start` again
3. Clear Expo cache: `npx expo start -c`

### **Issue: "Email not confirmed" error on login**

**Solution:**
1. Go to Supabase dashboard → **Authentication** → **Settings**
2. Under **Email Auth**, disable **"Confirm email"** for development
3. Or check your email inbox for verification link

### **Issue: "User already registered" but can't login**

**Solution:**
1. Go to Supabase dashboard → **Authentication** → **Users**
2. Find the user and check if email is confirmed
3. If not confirmed, click the user → **Send confirmation email**
4. Or manually confirm by clicking **Confirm user**

### **Issue: Profile not created automatically**

**Solution:**
1. Go to **SQL Editor** in Supabase
2. Run this query to check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. If not found, re-run the `SUPABASE_SETUP.sql` script
4. Manually create profile for existing users:
   ```sql
   INSERT INTO public.profiles (id, name)
   SELECT id, COALESCE(raw_user_meta_data->>'name', 'User')
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.profiles);
   ```

### **Issue: "Row Level Security" policy violation**

**Solution:**
1. Verify RLS policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
   ```
2. If missing, re-run the RLS policy section from `SUPABASE_SETUP.sql`

### **Issue: Session not persisting after app restart**

**Solution:**
1. Check AsyncStorage permissions on your device
2. Verify Supabase client configuration in `lib/supabase.ts`:
   ```typescript
   auth: {
     storage: AsyncStorage,
     autoRefreshToken: true,
     persistSession: true,
   }
   ```

## 📊 What Changed?

### **Files Modified:**
- ✅ `lib/supabase.ts` - New Supabase client configuration
- ✅ `services/supabase-auth.ts` - New auth service using Supabase
- ✅ `contexts/AuthContext.tsx` - Updated to use Supabase
- ✅ `app/auth/login.tsx` - Cleaned up (removed debug button)
- ✅ `app/auth/signup.tsx` - Removed duplicate email check
- ✅ `app/auth/forgot-password.tsx` - Uses Supabase password reset
- ✅ `utils/errorHandling.ts` - Added Supabase error mapping
- ✅ `.env.example` - Added Supabase configuration template

### **Files Backed Up:**
- 📦 `services/auth.legacy.ts` - Original local auth service (backup)

### **New Files:**
- 🆕 `lib/supabase.ts` - Supabase client
- 🆕 `services/supabase-auth.ts` - Supabase auth service
- 🆕 `SUPABASE_SETUP.sql` - Database setup script
- 🆕 `SUPABASE_MIGRATION_GUIDE.md` - This guide

## 🔐 Security Notes

### **Environment Variables:**
- ✅ `EXPO_PUBLIC_SUPABASE_URL` - Safe to expose (public)
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (RLS protected)
- ❌ **Never** expose `service_role` key in client code

### **Row Level Security (RLS):**
- All database tables are protected by RLS policies
- Users can only access their own data
- Policies are enforced at the database level (cannot be bypassed from client)

### **Password Security:**
- Supabase uses bcrypt for password hashing (industry standard)
- Passwords are never stored in plain text
- Password reset uses secure email tokens with expiration

## 🎯 Next Steps (Optional)

Once authentication is working, you can:

1. **Migrate Diagnosis History to Supabase:**
   - Uncomment the `diagnoses` table section in `SUPABASE_SETUP.sql`
   - Run the SQL to create the table
   - Update `DiagnosisContext` to sync with Supabase

2. **Add Supabase Storage for Images:**
   - Create storage buckets for diagnosis images
   - Update image upload logic to use Supabase Storage
   - Enable CDN for faster image loading

3. **Create Edge Functions for Gemini AI:**
   - Move Gemini API calls to Supabase Edge Functions
   - Keep API key secure on server-side
   - Add rate limiting and caching

4. **Enable Real-time Features:**
   - Use Supabase Realtime for live updates
   - Add collaborative features
   - Implement notifications

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: Dashboard → **Logs** → **Auth Logs**
3. Check Expo console for error messages
4. Verify all steps were completed in order

## ✅ Success!

You've successfully migrated PoultryCure to Supabase! 🎉

Your app now has:
- ✅ Cloud-based authentication
- ✅ Secure password management
- ✅ Email verification capability
- ✅ Password reset via email
- ✅ Multi-device session support
- ✅ Scalable backend infrastructure

Happy coding! 🚀
