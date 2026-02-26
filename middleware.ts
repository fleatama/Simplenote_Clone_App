export { auth as middleware } from "@/auth";

// どのページに認証を適用するか（今回はAPIの一部以外すべて）
export const config = {
  matcher: ["/((?!api/notes|_next/static|_next/image|favicon.ico).*)"],
};
