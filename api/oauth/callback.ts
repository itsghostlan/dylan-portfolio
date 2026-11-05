import { callback } from "./shared.ts";

export function GET(request: Request): Promise<Response> {
  return callback(request);
}
