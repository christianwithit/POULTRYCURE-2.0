import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Defensive checks for required environment variables
if (!supabaseUrl) {
  throw new Error(
    "❌ EXPO_PUBLIC_SUPABASE_URL is not defined. " +
      "Please add it to EAS secrets using: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value <your-url>",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. " +
      "Please add it to EAS secrets using: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <your-key>",
  );
}

console.log(
  "✅ Supabase client initializing with URL:",
  supabaseUrl.substring(0, 30) + "...",
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          profile_photo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          profile_photo?: string | null;
        };
        Update: {
          name?: string;
          profile_photo?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};
