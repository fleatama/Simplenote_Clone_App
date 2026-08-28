import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      profile(profile) {
        return {
          id: profile.sub, // Google側の固定ID(sub)を常に使用する
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  // ★ secret を明示的に fallback 付きで設定
  // 本番環境に合わせ、環境変数からシークレットを取得する
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30日間
  },
  callbacks: {
    jwt({ token, user }) {
      if (user && user.email) {
        token.sub = user.email; // IDの代わりにEmailを識別子として固定する
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub as string; // 固定されたEmailをユーザーIDとしてセット
      }
      return session;
    },
  },
});
