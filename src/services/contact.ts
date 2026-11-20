import { supabase } from "@/integrations/supabase/client";

export async function sendContactMessage(input: { name: string; email: string; company: string; subject: string; message: string }) {
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    company: input.company || null,
    subject: input.subject,
    message: input.message,
  });
  if (error) throw error;
}
