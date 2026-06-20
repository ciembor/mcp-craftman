import { describe, expect, it } from "vitest";

import { readOptionalNumberField, readQueryLimitInput, readRequiredStringField, requireObjectInput } from "../../src/index.js";

const getPlaceRequiresId = "get_place requires id.";

describe("@mcp-craftman/core input helpers", () => {
  it("reads required string fields with stable MCP tool errors", () => {
    expect(readRequiredStringField({ id: "123" }, "id", "get_place")).toBe("123");

    expect(() => readRequiredStringField({}, "id", "get_place")).toThrow(getPlaceRequiresId);
    expect(() => readRequiredStringField(null, "id", "get_place")).toThrow(getPlaceRequiresId);
    expect(() => readRequiredStringField({ id: 123 }, "id", "get_place")).toThrow(getPlaceRequiresId);
  });

  it("reads optional number fields with stable MCP tool errors", () => {
    expect(readOptionalNumberField({ limit: 20 }, "limit", "search_places")).toBe(20);
    expect(readOptionalNumberField({}, "limit", "search_places")).toBeUndefined();

    expect(() => readOptionalNumberField({ limit: "20" }, "limit", "search_places")).toThrow(
      "search_places limit must be a number.",
    );
  });

  it("reads common query and limit inputs", () => {
    expect(readQueryLimitInput({ limit: 20, query: "Krakow" }, "search_places")).toEqual({
      limit: 20,
      query: "Krakow",
    });
    expect(readQueryLimitInput({ query: "Krakow" }, "search_places")).toEqual({
      query: "Krakow",
    });

    expect(() => readQueryLimitInput({}, "search_places")).toThrow("search_places requires query.");
    expect(() => readQueryLimitInput({ query: "Krakow", limit: "20" }, "search_places")).toThrow(
      "search_places limit must be a number.",
    );
  });

  it("guards object input", () => {
    expect(requireObjectInput({ query: "Krakow" }, "search_places")).toEqual({
      query: "Krakow",
    });

    expect(() => requireObjectInput(null, "search_places")).toThrow("search_places requires object input.");
  });
});
