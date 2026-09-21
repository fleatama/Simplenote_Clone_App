import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(request: Request) {
  // セキュリティチェック：Vercel Cronからの実行か確認
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // データベースに現在時刻を書き込んでアクティブ状態を維持
    await redis.set("keep_alive_ping", new Date().toISOString());
    return NextResponse.json({
      success: true,
      message: "Database pinged successfully.",
    });
  } catch (error) {
    console.error("Keep-alive failed:", error);
    return NextResponse.json(
      { success: false, error: "Keep-alive failed" },
      { status: 500 },
    );
  }
}
