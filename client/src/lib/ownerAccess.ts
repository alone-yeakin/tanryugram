export function canAccessCreatorStudio(user: {
  isOwner?: boolean | null;
  role?: string | null;
  isCreator?: boolean | null;
} | null | undefined) {
  return Boolean(user?.isOwner || (user?.role === "admin" && user?.isCreator));
}

export function canManageCreatorStudio(user: {
  isOwner?: boolean | null;
} | null | undefined) {
  return user?.isOwner === true;
}

export default canAccessCreatorStudio;
