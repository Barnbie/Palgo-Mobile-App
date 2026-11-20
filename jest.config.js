module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/.android-sdk/', '/dist/'],
  transform: { '^.+\\.js$': 'babel-jest' },
};
