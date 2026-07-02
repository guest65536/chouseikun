import { PrismaClient } from "@prisma/client";

// Next.js の開発モードではファイル変更のたびにモジュールが再読み込みされ、
// その都度 new PrismaClient() すると接続が増えすぎてしまう。
// globalThis に1つだけ保持して使い回す定番パターン。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
