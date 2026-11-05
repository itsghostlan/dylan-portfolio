import { auth } from "./shared.ts";

export function GET(request: Request): Response {
  return auth(request);
}
