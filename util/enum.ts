enum FileTypes {
  image = "IMAGE",
  video = "VIDEO",
  audio = "AUDIO",
  file = "FILE",
}

enum SearchParams {
  person = "person",
  community = "community",
  addCommunityMember = "add-community-member",
  newChat = "new-chat",
  story = "story",
}

enum QueryKeys {
  userProfile = "userProfile",
  privateChats = "privateChats",
  communityChats = "communityChats",
  communityMembers = "communityMembers",
  messages = "messages",
  chatProfile = "chatProfile",
  newCommunity = "newCommunity",
  chatMedia = "chatMedia",
  story = "story",
}

enum TableNames {
  users = "users",
  conversations = "conversations",
  messages = "messages",
  participants = "participants",
  inbox = "inbox",
  story = "story",
  storyViews = "story_views",
}

enum BucketNames {
  chatFiles = "chat-files",
  profilePictures = "profile-pictures",
  stories = "stories",
}

export { BucketNames, FileTypes, QueryKeys, SearchParams, TableNames };
