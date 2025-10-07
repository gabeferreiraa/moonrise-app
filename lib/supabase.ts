import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Subscriber type matching your schema
export type Subscriber = {
  id?: string;
  user_id?: string | null;
  name?: string | null;
  email: string;
  created_at?: string;
};

// Newsletter service functions
export const newsletterService = {
  /**
   * Subscribe a user to the newsletter
   */
  async subscribe(
    email: string,
    name?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email
      if (!email || !isValidEmail(email)) {
        return {
          success: false,
          message: "Please enter a valid email address",
        };
      }

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists
      const { data: existing, error: checkError } = await supabase
        .from("subscribers")
        .select("id, email")
        .eq("email", normalizedEmail)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      if (checkError) {
        console.error("Error checking existing subscription:", checkError);
        return {
          success: false,
          message: "Something went wrong. Please try again.",
        };
      }

      if (existing) {
        if (name && name.trim()) {
          const { error: updateError } = await supabase
            .from("subscribers")
            .update({
              name: name.trim(),
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error("Error updating name:", updateError);
          }
        }

        return {
          success: true,
          message: "You're already subscribed! ✨",
        };
      }

      const { data: newSubscriber, error: insertError } = await supabase
        .from("subscribers")
        .insert({
          email: normalizedEmail,
          name: name?.trim() || null,
          user_id: null, // Anonymous subscription, no auth user
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating subscription:", insertError);

        // Check if it's a unique constraint error (duplicate email)
        if (insertError.code === "23505") {
          return {
            success: true,
            message: "You're already on the list! ✨",
          };
        }

        return {
          success: false,
          message: "Something went wrong. Please try again.",
        };
      }

      // Optional: Trigger a welcome email via Supabase Edge Function
      // You can uncomment this if you have an edge function set up
      /*
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { 
            email: normalizedEmail, 
            name: name?.trim() || null,
            subscriberId: newSubscriber.id
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email sending fails
      }
      */

      return {
        success: true,
        message: "You're in! We'll keep you posted ✨",
      };
    } catch (error) {
      console.error("Subscription error:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }
  },

  /**
   * Unsubscribe a user from the newsletter
   * Note: This actually deletes the record since there's no status field
   */
  async unsubscribe(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from("subscribers")
        .delete()
        .eq("email", email.toLowerCase().trim());

      if (error) {
        console.error("Error unsubscribing:", error);
        return {
          success: false,
          message: "Could not unsubscribe. Please try again.",
        };
      }

      return {
        success: true,
        message: "You've been unsubscribed.",
      };
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return {
        success: false,
        message: "Something went wrong. Please try again.",
      };
    }
  },

  /**
   * Check if an email is subscribed
   */
  async isSubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  },

  /**
   * Get subscriber details
   */
  async getSubscriber(email: string): Promise<Subscriber | null> {
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscriber:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching subscriber:", error);
      return null;
    }
  },
};

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export default client
export default supabase;
