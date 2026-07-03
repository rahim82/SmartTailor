export function dashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "tailor") return "/tailor";
  return "/customer";
}
