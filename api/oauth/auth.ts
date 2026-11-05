import { auth } from "./shared";

export function GET(request: Request): Response {
  return auth(request);
}
