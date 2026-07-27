/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    // Redirect .js imports to .ts source files so Jest can resolve them
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["@swc/jest", {
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true }
      }
    }],
  },
};
