import { describe, expect, it } from "vitest";

import { resolveOceanPerformance } from "./ocean-performance";

describe("resolveOceanPerformance", () => {
  it("uses the full animated scene on capable devices", () => {
    expect(
      resolveOceanPerformance({
        deviceMemory: 8,
        hardwareConcurrency: 8,
        prefersReducedMotion: false,
        saveData: false,
        storedPreference: null,
      }),
    ).toEqual({
      constrainedDevice: false,
      motionEnabled: true,
      quality: "full",
    });
  });

  it("uses reduced quality on modest hardware", () => {
    expect(
      resolveOceanPerformance({
        deviceMemory: 4,
        hardwareConcurrency: 4,
        prefersReducedMotion: false,
        storedPreference: null,
      }),
    ).toEqual({
      constrainedDevice: true,
      motionEnabled: true,
      quality: "reduced",
    });
  });

  it("starts paused on severely constrained hardware", () => {
    expect(
      resolveOceanPerformance({
        deviceMemory: 2,
        hardwareConcurrency: 2,
        prefersReducedMotion: false,
        storedPreference: null,
      }),
    ).toEqual({
      constrainedDevice: true,
      motionEnabled: false,
      quality: "reduced",
    });
  });

  it("honors reduced motion even when motion was previously enabled", () => {
    expect(
      resolveOceanPerformance({
        deviceMemory: 8,
        hardwareConcurrency: 8,
        prefersReducedMotion: true,
        storedPreference: "on",
      }).motionEnabled,
    ).toBe(false);
  });

  it("allows an explicit enable on constrained but not reduced-motion devices", () => {
    expect(
      resolveOceanPerformance({
        deviceMemory: 2,
        hardwareConcurrency: 2,
        prefersReducedMotion: false,
        storedPreference: "on",
      }),
    ).toEqual({
      constrainedDevice: true,
      motionEnabled: true,
      quality: "reduced",
    });
  });
});
