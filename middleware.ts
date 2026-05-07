export { auth as middleware } from "@/auth";

// すべてのルートを認証対象とし、静的ファイルや認証関連APIを除外する
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
