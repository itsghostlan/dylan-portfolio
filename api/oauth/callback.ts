import { callback } from "./shared.js"

export function GET(request: Request): Promise<Response> {
  return callback(request)
}
