import { handleUploadFile, ONE_DAY } from "@/util/common.functions";
import { BucketNames, TableNames } from "@/util/enum";
import { StoryRow, StoryViewer } from "@/util/interfaces/types";
import { supabase } from "@/util/supabase";
import { Toast } from "@/util/toast";

interface NewStoryAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  type?: "image" | "video" | "livePhoto" | "pairedVideo" | null;
}

const STORY_WINDOW_MS = ONE_DAY;

// Fetches every story uploaded within the last 24h by the current user and the
// people they chat with, then groups the rows by author. Each group is a
// StoryRow[] (a user's slides, oldest first). `myStory` is the current user's
// own slides; `seenStoryIds` lists the rows the current user has already viewed
// (used to drive the unseen ring).
const getStories = async (
  currentUserId: bigint | number | string,
): Promise<{
  myStory: StoryRow[];
  otherStories: StoryRow[][];
  seenStoryIds: string[];
}> => {
  try {
    const cutoff = new Date(Date.now() - STORY_WINDOW_MS).toUTCString();

    const { data: chatWithData, error: chatWithError } = await supabase
      .from(TableNames.inbox)
      .select("chatWithId")
      .eq("myId", currentUserId)
      .eq("isGroup", false);

    if (chatWithError) throw chatWithError;

    const chatWithIds = (chatWithData ?? []).map((obj) => obj.chatWithId);
    chatWithIds.push(currentUserId);

    const { data, error } = await supabase
      .from(TableNames.story)
      .select(
        "id, fileUrl, fileType, userId, description, createdAt, users(id, firstName, lastName, avatar, userName)",
      )
      .gt("createdAt", cutoff)
      .in("userId", chatWithIds)
      .order("createdAt", { ascending: true });

    if (error) throw error;

    if (data != null && data.length <= 0) {
      return { myStory: [], otherStories: [], seenStoryIds: [] };
    }

    const fileUrls = data?.map((obj) => obj.fileUrl);

    const { data: singedUrls, error: supabaseError } = await supabase.storage
      .from(BucketNames.stories)
      .createSignedUrls(fileUrls, ONE_DAY);

    if (supabaseError || singedUrls.length <= 0) {
      throw supabaseError ?? Error("no createSignedUrls data");
    }

    const rows = ((data ?? []) as unknown as StoryRow[]).map((obj, idx) => ({
      ...obj,
      fileName: obj.fileUrl,
      fileUrl: singedUrls[idx].signedUrl,
    }));

    const grouped = new Map<string, StoryRow[]>();
    for (const row of rows) {
      const userId = String(row.userId);
      if (!grouped.has(userId)) grouped.set(userId, []);
      grouped.get(userId)!.push(row);
    }

    const seenStoryIds = await getSeenStoryIds(
      rows.map((row) => String(row.id)),
      currentUserId,
    );

    const myId = String(currentUserId);
    const myStory = grouped.get(myId) ?? [];
    const otherStories = Array.from(grouped.entries())
      .filter(([userId]) => userId !== myId)
      .map(([, group]) => group);

    return { myStory, otherStories, seenStoryIds };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return { myStory: [], otherStories: [], seenStoryIds: [] };
  }
};

// Returns the ids of the given story rows that the current user has viewed.
const getSeenStoryIds = async (
  storyIds: string[],
  currentUserId: bigint | number | string,
): Promise<string[]> => {
  if (!storyIds.length) return [];

  const { data, error } = await supabase
    .from(TableNames.storyViews)
    .select("storyId")
    .eq("viewerId", currentUserId)
    .in("storyId", storyIds);

  if (error) {
    console.error("Error fetching seen state:", error);
    return [];
  }

  return (data ?? []).map((row) => String(row.storyId));
};

// Records that the current user watched a story slide. Idempotent: the unique
// (storyId, viewerId) constraint dedupes, so repeated calls are no-ops.
const recordStoryView = async (
  storyId: bigint | number | string,
  viewerId: bigint | number | string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TableNames.storyViews)
      .upsert(
        { storyId, viewerId },
        { onConflict: "storyId,viewerId", ignoreDuplicates: true },
      );
    if (error) throw error;
  } catch (error) {
    console.error("Error recording story view:", error);
  }
};

// Returns who watched a given story slide and when, most recent first. Intended
// for the story owner (RLS restricts visibility to the owner / the viewer).
const getStoryViewers = async (
  storyId: bigint | number | string,
): Promise<StoryViewer[]> => {
  try {
    const { data, error } = await supabase
      .from(TableNames.storyViews)
      .select(
        "id, viewerId, storyId, createdAt, users(id, firstName, lastName, avatar, userName)",
      )
      .eq("storyId", storyId)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return (data ?? []) as unknown as StoryViewer[];
  } catch (error) {
    console.error("Error fetching story viewers:", error);
    return [];
  }
};

const getFileExtension = (nameOrUri: string): string => {
  const clean = nameOrUri.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
};

// Uploads several picked items and inserts them in a single batch. Uploads run
// sequentially to keep memory bounded for large files. Returns true on success.
const createStories = async ({
  userId,
  items,
}: {
  userId: bigint | number | string;
  items: { asset: NewStoryAsset; description: string }[];
}): Promise<boolean> => {
  if (!items.length) return false;
  try {
    const rows = [];
    for (let index = 0; index < items.length; index++) {
      const { asset, description } = items[index];

      // Always upload under a unique object name. Reusing the picker's original
      // file name collides with an existing object (e.g. after deleting and
      // re-adding the same file), which turns the upload into an overwrite that
      // storage RLS rejects ("new row violates row-level security policy").
      const ext = getFileExtension(asset.fileName ?? asset.uri);
      const uploadName = `${userId}_${Date.now()}_${index}${ext ? `.${ext}` : ""}`;

      const { success, fileName } = await handleUploadFile(
        { ...asset, fileName: uploadName },
        BucketNames.stories,
      );

      if (!success || !fileName) {
        throw Error("Failed to upload media");
      }

      const fileType: "image" | "video" =
        asset.type === "video" || asset.type === "pairedVideo"
          ? "video"
          : "image";

      rows.push({
        userId,
        fileUrl: fileName,
        fileType,
        description: description.trim() || null,
      });
    }

    const { error } = await supabase.from(TableNames.story).insert(rows);
    if (error) throw error;

    Toast.success(rows.length > 1 ? "Stories added" : "Story added");
    return true;
  } catch (error) {
    console.error("Error creating stories:", error);
    Toast.error("Failed to add stories");
    return false;
  }
};

// Extracts the in-bucket object path from a public storage URL, e.g.
// ".../object/public/stories/file_123.mp4" -> "file_123.mp4".
const extractStoragePath = (
  publicUrl: string,
  bucket: string,
): string | null => {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0]);
};

// Deletes a story row and best-effort removes its file from the stories bucket.
// The row deletion is authoritative; a failed file removal is logged, not fatal.
const deleteStory = async (
  storyId: bigint | number | string,
  fileName: string,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TableNames.story)
      .delete()
      .eq("id", storyId);
    if (error) throw error;

    const path = extractStoragePath(fileName, BucketNames.stories);
    if (path) {
      const { error: storageError } = await supabase.storage
        .from(BucketNames.stories)
        .remove([path]);
      if (storageError) {
        console.error("Error removing story file:", storageError);
      }
    }

    Toast.success("Story deleted");
    return true;
  } catch (error) {
    console.error("Error deleting story:", error);
    Toast.error("Failed to delete story");
    return false;
  }
};

export {
  createStories,
  deleteStory,
  getStories,
  getStoryViewers,
  recordStoryView,
};
