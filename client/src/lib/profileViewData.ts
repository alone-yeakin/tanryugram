export function resolveProfileUser<T extends { id?: number | string }>(selectedUser: T | null | undefined, loadedUser: T | null | undefined) {
  return loadedUser?.id ? loadedUser : selectedUser;
}
