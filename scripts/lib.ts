import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set (put it in .env or pass it in the environment).");
    process.exit(2);
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** True when DATABASE_URL points at this machine. Never prints the URL itself. */
export function isLocalDatabase(): boolean {
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) || host.endsWith(".local");
  } catch {
    return false;
  }
}

export function getArg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}
