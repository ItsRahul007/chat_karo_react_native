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
}

export { FileTypes, QueryKeys, SearchParams };
