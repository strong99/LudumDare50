// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    roots: [
        "./src",
        "./tests",
    ],
    moduleDirectories: ["node_modules", "src", "tests"],
    testMatch: [
        "**/*.test.[jt]s?(x)",
    ],

    testEnvironment: "jsdom",

    preset: "ts-jest",
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    transformIgnorePatterns: ["<rootDir>/node_modules/"],

    clearMocks: true,

    collectCoverage: false,
    collectCoverageFrom: [
        "./src/**/*.(ts|tsx)",
    ],

    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: [
        "/node_modules/",
    ],
    
    coverageProvider: "babel",
    coverageReporters: [
        "html",
        "text-summary",
    ],
}
