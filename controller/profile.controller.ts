import { supabase } from "@/util/supabase";
import { Toast } from "@/util/toast";

const createUser = async ({
  firstName,
  lastName,
  userName,
  bio,
  image,
}: {
  firstName: string;
  lastName: string;
  userName: string;
  bio: string;
  image: string;
}): Promise<{ success: boolean; message: string }> => {
  Toast.loading("Creating user...");
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
      Toast.error(profileError.message);
      return { success: false, message: profileError.message };
    }

    if (profileData != null) {
      Toast.error("User already exists");
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
      Toast.error(insertedError.message);
      console.error("Error creating user:", insertedError);
      return { success: false, message: insertedError.message };
    }

    Toast.success("User created successfully");
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Error creating user:", error);
    Toast.error("Something went wrong");
    return { success: false, message: "Something went wrong" };
  }
};

const updateUser = async ({
  firstName,
  lastName,
  userName,
  bio,
  image,
}: {
  firstName: string;
  lastName: string;
  userName: string;
  bio: string;
  image: string;
}): Promise<{ success: boolean; message: string }> => {
  Toast.loading("Updating user...");
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      Toast.error(error.message);
      return { success: false, message: error.message };
    }

    const { error: updatedError } = await supabase
      .from("users")
      .update({
        avatar: image,
        userName,
        firstName,
        lastName,
        about: bio,
      })
      .eq("email", data.user.email)
      .select("email")
      .single();

    if (updatedError) {
      Toast.error(updatedError.message);
      console.error("Error updating user:", updatedError);
      return { success: false, message: updatedError.message };
    }

    Toast.success("User updated successfully");
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user:", error);
    Toast.error("Something went wrong");
    return { success: false, message: "Something went wrong" };
  }
};

export { createUser, updateUser };
