import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createLogger } from "../../src/index.js";

describe("@mcp-craftman/node logging", () => {
  it("writes logger output to the provided stream", () => {
    const writes: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        writes.push(chunk.toString());
        callback();
      },
    });

    createLogger(stream).info("server started", {
      transport: "stdio",
    });

    expect(writes).toEqual(['[info] server started {"transport":"stdio"}\n']);
  });
});
