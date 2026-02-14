import { supabase } from "@/util/supabase";

const createUser = async ({
  firstName,
  lastName,
  userName,
  bio,
  image,
  showToast,
}: {
  firstName: string;
  lastName: string;
  userName: string;
  bio: string;
  image: string;
  showToast: (message: string, type: "success" | "error" | "alert") => void;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return { success: false, message: error.message };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("email")
      .eq("email", data.user.email)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      showToast(profileError.message, "error");
      return { success: false, message: profileError.message };
    }

    if (profileData != null) {
      showToast("User already exists", "error");
      return { success: false, message: "User already exists" };
    }

    const { error: insertedError } = await supabase
      .from("users")
      .insert({
        email: data.user.email,
        avatar: image || data.user.user_metadata.picture,
        userName,
        firstName,
        lastName,
        about: bio,
      })
      .select("email")
      .single();

    if (insertedError) {
      showToast(insertedError.message, "error");
      console.error("Error creating user:", insertedError);
      return { success: false, message: insertedError.message };
    }

    showToast("User created successfully", "success");
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export { createUser };
