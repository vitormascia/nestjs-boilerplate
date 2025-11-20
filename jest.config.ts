import type { Config } from "jest";
import { createDefaultEsmPreset } from "ts-jest";

const jestConfig: Config = {
	...createDefaultEsmPreset(),
	moduleFileExtensions: ["ts", "js", "json"],
	moduleDirectories: ["node_modules"],
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
	verbose: true,
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
	coverageDirectory: "coverage",
	coveragePathIgnorePatterns: ["/node_modules/", "/build/"],
	coverageReporters: ["html", "json", "lcov", "text", "text-summary"],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
};

export default jestConfig;
