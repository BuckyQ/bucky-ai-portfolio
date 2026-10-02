export type OceanQuality = "full" | "reduced";

export type OceanMotionPreference = "off" | "on" | null;

export interface OceanPerformanceInput {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  prefersReducedMotion: boolean;
  saveData?: boolean;
  storedPreference: OceanMotionPreference;
}

export interface OceanPerformanceSettings {
  constrainedDevice: boolean;
  motionEnabled: boolean;
  quality: OceanQuality;
}

export function resolveOceanPerformance(
  input: OceanPerformanceInput,
): OceanPerformanceSettings {
  const constrainedDevice = Boolean(
    input.saveData ||
      (input.deviceMemory !== undefined && input.deviceMemory <= 4) ||
      (input.hardwareConcurrency !== undefined &&
        input.hardwareConcurrency <= 4),
  );
  const severelyConstrained = Boolean(
    input.saveData ||
      (input.deviceMemory !== undefined && input.deviceMemory <= 2) ||
      (input.hardwareConcurrency !== undefined &&
        input.hardwareConcurrency <= 2),
  );

  const motionEnabled = input.prefersReducedMotion
    ? false
    : input.storedPreference === "off"
      ? false
      : input.storedPreference === "on"
        ? true
        : !severelyConstrained;

  return {
    constrainedDevice,
    motionEnabled,
    quality: constrainedDevice || !motionEnabled ? "reduced" : "full",
  };
}
