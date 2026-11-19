import { beforeEach, describe, expect, it } from "vitest";
import { rememberGoogleReturn, takeGoogleReturn } from "./auth";

describe("Google sign-in return destination", () => {
  beforeEach(() => sessionStorage.clear());

  it("brings the user back to the page they were heading to", () => {
    rememberGoogleReturn("/cart");
    expect(takeGoogleReturn()).toBe("/cart");
  });

  it("uses the default page when no destination was given", () => {
    rememberGoogleReturn(null);
    expect(takeGoogleReturn()).toBe("");
  });

  it("only redirects once after returning from Google", () => {
    rememberGoogleReturn("/orders");
    takeGoogleReturn();
    expect(takeGoogleReturn()).toBeNull();
  });

  it("does nothing on a normal visit to the start page", () => {
    expect(takeGoogleReturn()).toBeNull();
  });
});
