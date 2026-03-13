module.exports = {
  getRandomBytes: jest.fn(() => ({
    toString: () => 'mock-random-bytes-12345678901234567890123456789012'
  })),
  digestStringAsync: jest.fn((algorithm, data) => 
    Promise.resolve(`hashed-${data}`)
  ),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256'
  }
};