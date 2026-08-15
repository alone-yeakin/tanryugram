export function canSeeOwnerStudio(user: any): boolean {
  if (!user) return false;
  if (user.isOwner === true) return true;
  if (String(user.email || "").trim().toLowerCase() === "realaayan.apple@gmail.com") return true;
  return String(user.role || "").toLowerCase() === "admin" && user.isCreator === true;
}
