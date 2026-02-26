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
  messages = "messages",
  chatProfile = "chatProfile",
}

enum TableNames {
  users = "users",
  conversations = "conversations",
  messages = "messages",
  participants = "participants",
  inbox = "inbox",
}

export { FileTypes, QueryKeys, SearchParams, TableNames };
