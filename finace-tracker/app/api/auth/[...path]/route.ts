import { auth } from "@/_lib/auth/server";

export const { GET, POST } = auth.handler();
