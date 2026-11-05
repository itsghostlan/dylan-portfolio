import { auth } from "./shared.js";

export function GET(request: Request): Response {
  return auth(request);
}
