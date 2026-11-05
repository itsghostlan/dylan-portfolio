import { callback } from "./shared";

export function GET(request: Request): Promise<Response> {
  return callback(request);
}
