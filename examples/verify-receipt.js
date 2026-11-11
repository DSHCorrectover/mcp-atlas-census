/**
 * CCS Verification Example
 * 
 * This example demonstrates how to verify a CCS receipt using the
 * benchmark implementation.
 */

const { verify } = require('../correctover-supplementary-benchmark-v2.js');

// Example 1: Valid receipt
const validReceipt = {
  evaluation_id: "eval_abc123",
  timestamp: Date.now(),
  model_id: "gpt-4",
  prompt_hash: "sha256:abcdef1234567890",
  response_hash: "sha256:0987654321fedcba",
  commitments: [
    "commitment_1",
    "commitment_2"
  ],
  signature: "sig_example_valid"
};

console.log('Verifying valid receipt...');
const result1 = verify(validReceipt);
console.log('Result:', result1);
// Expected: { valid: true, confidence: 1.0, details: {...} }

// Example 2: Invalid signature
const invalidReceipt = {
  ...validReceipt,
  signature: "sig_example_invalid"
};

console.log('\nVerifying invalid receipt...');
const result2 = verify(invalidReceipt);
console.log('Result:', result2);
// Expected: { valid: false, confidence: 0.0, error: "Invalid signature" }

// Example 3: Missing fields
const incompleteReceipt = {
  evaluation_id: "eval_def456"
  // Missing required fields
};

console.log('\nVerifying incomplete receipt...');
const result3 = verify(incompleteReceipt);
console.log('Result:', result3);
// Expected: { valid: false, confidence: 0.0, error: "Missing required fields" }

// Example 4: Batch verification
console.log('\nBatch verification...');
const receipts = [validReceipt, invalidReceipt, incompleteReceipt];
const results = receipts.map((r, i) => {
  const result = verify(r);
  return {
    index: i,
    valid: result.valid,
    confidence: result.confidence
  };
});
console.log('Batch results:', results);
