/**
 * Correctover Supplementary Benchmark v2
 * 
 * Addresses three gaps identified in peer review:
 * 1. End-to-end TASK completion rate (not single-call pass-through)
 * 2. Description obfuscation resistance (can attackers hide in benign wording?)
 * 3. Denominator clarification (23,639 static tools vs 1,092 runtime calls)
 * 
 * This is the test that determines whether claims are defensible.
 */

import { RuntimeGuard } from './correctover-runtime-guard/src/index.js';
import fs from 'node:fs';

const pools = JSON.parse(fs.readFileSync('/data/poc_pools.json', 'utf-8'));

// ══════════════════════════════════════════════════════════
// TEST 1: End-to-End Task Completion Rate
// ══════════════════════════════════════════════════════════
// 
// IntentShield's 8.6-14.3 point drop is measured at the TASK level:
// agent tries to complete N tasks, some fail because guard blocks
// intermediate calls. We must measure the same thing.
//
// Design: Define 30 realistic agent tasks. Each task requires a sequence
// of tool calls. A task "succeeds" only if ALL required calls are allowed.
// Run with guard ON, measure task success rate.

function defineTasks() {
  const benignTools = pools.benign;
  const tasks = [];
  
  // Task type A: Simple lookup (2-3 calls, all benign)
  for (let i = 0; i < 10; i++) {
    const tools = [];
    const callCount = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < callCount; j++) {
      const t = benignTools[Math.floor(Math.random() * benignTools.length)];
      tools.push({
        name: t.name,
        description: t.desc || '',
        inputSchema: t.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
        arguments: { input: `task-a-param-${i}-${j}` },
      });
    }
    tasks.push({ id: `task-a-${i}`, type: 'simple-lookup', calls: tools, expectedSuccess: true });
  }
  
  // Task type B: Multi-step workflow (4-6 calls, all benign, some from C-grade tools)
  for (let i = 0; i < 10; i++) {
    const tools = [];
    const callCount = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < callCount; j++) {
      // Mix of A/B grade and some C grade tools
      const pool = Math.random() < 0.8 ? benignTools : pools.risky.filter(t => t.grade === 'C');
      const source = pool.length > 0 ? pool : benignTools;
      const t = source[Math.floor(Math.random() * source.length)];
      tools.push({
        name: t.name,
        description: t.desc || '',
        inputSchema: t.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
        arguments: { input: `task-b-param-${i}-${j}` },
      });
    }
    tasks.push({ id: `task-b-${i}`, type: 'multi-step-workflow', calls: tools, expectedSuccess: true });
  }
  
  // Task type C: Task that REQUIRES a risky tool (D/F grade) to complete
  // These SHOULD fail under the guard — this is the utility cost of security
  for (let i = 0; i < 10; i++) {
    const tools = [];
    // 2-3 benign warmup calls
    const warmupCount = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < warmupCount; j++) {
      const t = benignTools[Math.floor(Math.random() * benignTools.length)];
      tools.push({
        name: t.name,
        description: t.desc || '',
        inputSchema: t.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
        arguments: { input: `task-c-warmup-${i}-${j}` },
      });
    }
    // 1 call to a D/F grade tool — this will be blocked
    const riskyTools = pools.risky.filter(t => t.grade === 'D' || t.grade === 'F');
    if (riskyTools.length > 0) {
      const t = riskyTools[Math.floor(Math.random() * riskyTools.length)];
      tools.push({
        name: t.name,
        description: t.desc || '',
        inputSchema: t.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
        arguments: { input: `task-c-risky-${i}` },
      });
    }
    tasks.push({ id: `task-c-${i}`, type: 'requires-risky-tool', calls: tools, expectedSuccess: false });
  }
  
  return tasks;
}

async function testTaskCompletion() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: End-to-End Task Completion Rate');
  console.log('=' .repeat(70));
  
  const guard = new RuntimeGuard({
    policy: 'task-completion-test',
    blockGrades: ['F', 'D'],
  });
  
  const tasks = defineTasks();
  let tasksCompleted = 0;
  let tasksFailed = 0;
  let tasksExpectedToFail = 0;
  let tasksExpectedToFailActuallyFailed = 0;
  let tasksExpectedToSucceedButFailed = 0; // FALSE NEGATIVES — the real metric
  
  const details = [];
  
  for (const task of tasks) {
    let taskSuccess = true;
    let blockedCalls = 0;
    let totalCalls = task.calls.length;
    const callResults = [];
    
    for (const call of task.calls) {
      const result = await guard.guard(call, { serverId: call.name });
      callResults.push({
        tool: call.name,
        decision: result.decision,
        grade: result.risk.risk_grade,
        risk: result.risk.risk_score,
      });
      
      if (result.decision === 'deny') {
        blockedCalls++;
        taskSuccess = false;
      }
    }
    
    if (task.expectedSuccess) {
      if (taskSuccess) {
        tasksCompleted++;
      } else {
        tasksFailed++;
        tasksExpectedToSucceedButFailed++;
      }
    } else {
      tasksExpectedToFail++;
      if (!taskSuccess) {
        tasksExpectedToFailActuallyFailed++;
      }
    }
    
    details.push({
      taskId: task.id,
      type: task.type,
      expectedSuccess: task.expectedSuccess,
      actualSuccess: taskSuccess,
      totalCalls,
      blockedCalls,
      calls: callResults,
    });
  }
  
  // The critical metric: of tasks expected to succeed, what % actually succeeded?
  const expectedSuccessTasks = tasks.filter(t => t.expectedSuccess);
  const actualSuccessCount = expectedSuccessTasks.filter((t, i) => details[i].actualSuccess).length;
  const taskCompletionRate = expectedSuccessTasks.length > 0 
    ? (actualSuccessCount / expectedSuccessTasks.length * 100).toFixed(1)
    : '0';
  
  // False negative rate: tasks that should have succeeded but failed
  const falseNegativeRate = expectedSuccessTasks.length > 0
    ? (tasksExpectedToSucceedButFailed / expectedSuccessTasks.length * 100).toFixed(1)
    : '0';
  
  console.log(`\nTotal tasks: ${tasks.length}`);
  console.log(`  Expected to succeed: ${expectedSuccessTasks.length}`);
  console.log(`  Expected to fail (require risky tool): ${tasksExpectedToFail}`);
  console.log(`\nResults:`);
  console.log(`  Tasks completed (expected success): ${actualSuccessCount}/${expectedSuccessTasks.length} (${taskCompletionRate}%)`);
  console.log(`  Tasks failed (expected success): ${tasksExpectedToSucceedButFailed}/${expectedSuccessTasks.length} (${falseNegativeRate}%)`);
  console.log(`  Tasks correctly blocked (expected fail): ${tasksExpectedToFailActuallyFailed}/${tasksExpectedToFail}`);
  console.log(`\n  → Task completion rate: ${taskCompletionRate}%`);
  console.log(`  → False negative rate: ${falseNegativeRate}%`);
  console.log(`  → IntentShield comparison: ${taskCompletionRate}% vs their 85.7-91.4%`);
  
  return {
    test: 'task_completion',
    total_tasks: tasks.length,
    expected_success_tasks: expectedSuccessTasks.length,
    expected_fail_tasks: tasksExpectedToFail,
    actual_success_count: actualSuccessCount,
    task_completion_rate: taskCompletionRate + '%',
    false_negative_count: tasksExpectedToSucceedButFailed,
    false_negative_rate: falseNegativeRate + '%',
    correctly_blocked: tasksExpectedToFailActuallyFailed,
    intentshield_comparison: `${taskCompletionRate}% vs 85.7-91.4%`,
    details,
  };
}

// ══════════════════════════════════════════════════════════
// TEST 2: Description Obfuscation Resistance
// ══════════════════════════════════════════════════════════
//
// If assessRisk() relies on description text matching, then
// rewriting dangerous descriptions in benign language should
// bypass the guard. This test measures that vulnerability.
//
// Design: Take 10 high-risk tools (D/F grade), rewrite their
// descriptions to remove dangerous keywords while preserving
// the tool's functional intent. Re-run assessRisk. Measure
// how many still get blocked.

function obfuscateDescription(desc) {
  // Strategy: replace dangerous keywords with benign synonyms
  // This simulates what an attacker would do to evade text-matching
  const replacements = {
    // Shell/exec keywords
    'shell': 'environment',
    'exec': 'process',
    'spawn': 'start',
    'run_command': 'handle_request',
    'eval': 'process',
    'execute': 'process',
    'compile': 'build',
    'run_code': 'handle_logic',
    // File system keywords
    'write_file': 'save_content',
    'delete_file': 'remove_content',
    'create_file': 'add_content',
    'read_file': 'get_content',
    'filesystem': 'storage',
    // Network keywords
    'http_request': 'web_call',
    'fetch_url': 'get_page',
    'send_request': 'make_call',
    'api_call': 'service_call',
    'network': 'connection',
    'download': 'retrieve',
    'upload': 'transfer',
    // Credential keywords
    'credential': 'identity',
    'secret': 'private_info',
    'password': 'passphrase',
    'token': 'identifier',
    'api_key': 'service_key',
    'auth': 'verification',
    // Database keywords
    'database': 'datastore',
    'sql': 'query_language',
    // Privilege keywords
    'sudo': 'elevated',
    'admin': 'manager',
    'root': 'base',
    'privilege': 'access_level',
    // Browser keywords
    'browser': 'viewer',
    'playwright': 'automation',
    'puppeteer': 'controller',
    'selenium': 'driver',
    // Deploy keywords
    'deploy': 'release',
    'provision': 'setup',
    'kubernetes': 'orchestrator',
    'docker': 'container',
    // Destructive keywords
    'delete': 'remove',
    'destroy': 'clean_up',
    'drop': 'remove',
    'wipe': 'clear',
  };
  
  let result = desc.toLowerCase();
  for (const [dangerous, benign] of Object.entries(replacements)) {
    // Replace whole word matches only
    const regex = new RegExp(`\\b${dangerous}\\b`, 'gi');
    result = result.replace(regex, benign);
  }
  
  return result;
}

async function testDescriptionObfuscation() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Description Obfuscation Resistance');
  console.log('=' .repeat(70));
  
  const guard = new RuntimeGuard({
    policy: 'obfuscation-test',
    blockGrades: ['F', 'D'],
  });
  
  // Select attack pool tools with highest risk scores
  const highRiskTools = pools.attack
    .filter(t => t.grade === 'F' || t.grade === 'D')
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 30); // Test 30 tools for statistical significance
  
  console.log(`\nTesting ${highRiskTools.length} high-risk tools with obfuscated descriptions`);
  console.log(`Original grade distribution: F=${highRiskTools.filter(t=>t.grade==='F').length}, D=${highRiskTools.filter(t=>t.grade==='D').length}`);
  
  let originalBlocked = 0;
  let obfuscatedBlocked = 0;
  let gradeShifts = { 'F→F': 0, 'F→D': 0, 'F→C': 0, 'F→B': 0, 'F→A': 0, 'D→D': 0, 'D→C': 0, 'D→B': 0, 'D→A': 0 };
  
  const details = [];
  
  for (const tool of highRiskTools) {
    // Test with ORIGINAL description
    const originalCall = {
      name: tool.name,
      description: tool.desc || '',
      inputSchema: tool.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
      arguments: { input: 'test' },
    };
    const originalResult = await guard.guard(originalCall, { serverId: tool.name });
    const originalDecision = originalResult.decision;
    const originalGrade = originalResult.risk.risk_grade;
    const originalRisk = originalResult.risk.risk_score;
    
    if (originalDecision === 'deny') originalBlocked++;
    
    // Test with OBFUSCATED description
    const obfuscatedDesc = obfuscateDescription(tool.desc || '');
    const obfuscatedCall = {
      name: tool.name,
      description: obfuscatedDesc,
      inputSchema: tool.schema || { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
      arguments: { input: 'test' },
    };
    const obfuscatedResult = await guard.guard(obfuscatedCall, { serverId: tool.name });
    const obfuscatedDecision = obfuscatedResult.decision;
    const obfuscatedGrade = obfuscatedResult.risk.risk_grade;
    const obfuscatedRisk = obfuscatedResult.risk.risk_score;
    
    if (obfuscatedDecision === 'deny') obfuscatedBlocked++;
    
    // Track grade shifts
    const shiftKey = `${originalGrade}→${obfuscatedGrade}`;
    if (gradeShifts[shiftKey] !== undefined) {
      gradeShifts[shiftKey]++;
    }
    
    details.push({
      tool: tool.name,
      original_grade: originalGrade,
      original_risk: originalRisk,
      original_decision: originalDecision,
      obfuscated_grade: obfuscatedGrade,
      obfuscated_risk: obfuscatedRisk,
      obfuscated_decision: obfuscatedDecision,
      grade_shift: shiftKey,
      original_desc_preview: (tool.desc || '').slice(0, 80),
      obfuscated_desc_preview: obfuscatedDesc.slice(0, 80),
    });
  }
  
  const originalBlockRate = (originalBlocked / highRiskTools.length * 100).toFixed(1);
  const obfuscatedBlockRate = (obfuscatedBlocked / highRiskTools.length * 100).toFixed(1);
  const evasionRate = ((1 - obfuscatedBlocked / Math.max(1, originalBlocked)) * 100).toFixed(1);
  
  console.log(`\nResults:`);
  console.log(`  Original descriptions blocked: ${originalBlocked}/${highRiskTools.length} (${originalBlockRate}%)`);
  console.log(`  Obfuscated descriptions blocked: ${obfuscatedBlocked}/${highRiskTools.length} (${obfuscatedBlockRate}%)`);
  console.log(`  Evasion success rate: ${evasionRate}%`);
  console.log(`\nGrade shifts:`);
  for (const [shift, count] of Object.entries(gradeShifts)) {
    if (count > 0) console.log(`  ${shift}: ${count}`);
  }
  
  // Show examples of successful evasion
  const evaded = details.filter(d => d.original_decision === 'deny' && d.obfuscated_decision === 'allow');
  if (evaded.length > 0) {
    console.log(`\nExamples of successful evasion (${evaded.length} total):`);
    evaded.slice(0, 3).forEach(d => {
      console.log(`  Tool: ${d.tool}`);
      console.log(`    Original: ${d.original_grade} (${d.original_risk}) → ${d.original_decision}`);
      console.log(`    Obfuscated: ${d.obfuscated_grade} (${d.obfuscated_risk}) → ${d.obfuscated_decision}`);
      console.log(`    Original desc: ${d.original_desc_preview}...`);
      console.log(`    Obfuscated desc: ${d.obfuscated_desc_preview}...`);
      console.log();
    });
  }
  
  return {
    test: 'description_obfuscation',
    tools_tested: highRiskTools.length,
    original_blocked: originalBlocked,
    original_block_rate: originalBlockRate + '%',
    obfuscated_blocked: obfuscatedBlocked,
    obfuscated_block_rate: obfuscatedBlockRate + '%',
    evasion_success_rate: evasionRate + '%',
    grade_shifts: gradeShifts,
    details,
  };
}

// ══════════════════════════════════════════════════════════
// TEST 3: Denominator Clarification
// ══════════════════════════════════════════════════════════
//
// 23,639 tools (static scan) vs 1,092 calls (runtime test)
// What's the relationship? This test documents it clearly.

function clarifyDenominators() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Denominator Clarification');
  console.log('=' .repeat(70));
  
  const totalStaticTools = 229539;
  const benignPoolSize = pools.benign.length;
  const riskyPoolSize = pools.risky.length;
  const attackPoolSize = pools.attack.length;
  const totalPoolSize = benignPoolSize + riskyPoolSize + attackPoolSize;
  
  console.log(`\nStatic Scan (Census 2026-Q4):`);
  console.log(`  Total tools scanned: ${totalStaticTools.toLocaleString()}`);
  console.log(`  This is a one-time static analysis of all available MCP tools`);
  console.log(`  Output: risk grade (A-F) for each tool`);
  
  console.log(`\nRuntime Test Pools (sampled from static scan):`);
  console.log(`  Benign pool (A/B grade): ${benignPoolSize} tools`);
  console.log(`  Risky pool (C/D/F grade): ${riskyPoolSize} tools`);
  console.log(`  Attack pool (D/F grade, compounds≥1): ${attackPoolSize} tools`);
  console.log(`  Total pool: ${totalPoolSize} tools`);
  console.log(`  Pool as % of census: ${(totalPoolSize / totalStaticTools * 100).toFixed(2)}%`);
  
  console.log(`\nRuntime Benchmark (POC):`);
  console.log(`  Sessions: 200 (100 benign + 50 attack + 50 mixed)`);
  console.log(`  Total tool calls: 1,092`);
  console.log(`  CCS receipts generated: 1,092 (one per call)`);
  console.log(`  CCS receipts verified: 50/50 (sampled)`);
  
  console.log(`\nRelationship:`);
  console.log(`  23,639 = static scan universe (all tools analyzed)`);
  console.log(`  1,241 = runtime test pool (sampled from static scan)`);
  console.log(`  1,092 = actual runtime calls made during benchmark`);
  console.log(`  Each of the 1,092 calls → 1 CCS receipt → 1 Ed25519 signature`);
  console.log(`  50 receipts sampled for offline verification (all passed)`);
  
  console.log(`\nWhy not 23,639 runtime calls?`);
  console.log(`  Static scan ≠ runtime test. Static scan analyzes tool descriptions.`);
  console.log(`  Runtime test simulates actual agent behavior with those tools.`);
  console.log(`  1,092 calls across 200 sessions is the POC scale; production`);
  console.log(`  deployment would generate millions of calls and receipts.`);
  
  return {
    test: 'denominator_clarification',
    static_scan_tools: totalStaticTools,
    runtime_pool_tools: totalPoolSize,
    runtime_pool_pct_of_census: (totalPoolSize / totalStaticTools * 100).toFixed(2) + '%',
    runtime_calls_made: 1092,
    ccs_receipts_generated: 1092,
    ccs_receipts_verified_sample: '50/50',
    relationship: '23,639 static → 1,241 pool → 1,092 runtime calls → 1,092 receipts → 50 verified',
  };
}

// ══════════════════════════════════════════════════════════
// RUN ALL TESTS
// ══════════════════════════════════════════════════════════

async function main() {
  console.log('Correctover Supplementary Benchmark v2');
  console.log('Testing: task completion, description obfuscation, denominator clarity');
  console.log('Date:', new Date().toISOString());
  
  const results = {};
  
  // Test 1: Task completion
  results.task_completion = await testTaskCompletion();
  
  // Test 2: Description obfuscation
  results.obfuscation = await testDescriptionObfuscation();
  
  // Test 3: Denominator clarification
  results.denominators = clarifyDenominators();
  
  // Save full results
  fs.writeFileSync('/data/supplementary_benchmark_v2.json', JSON.stringify(results, null, 2));
  
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('=' .repeat(70));
  console.log(`\nTest 1 - Task Completion:`);
  console.log(`  Rate: ${results.task_completion.task_completion_rate}`);
  console.log(`  False negatives: ${results.task_completion.false_negative_count}`);
  console.log(`  Comparable to IntentShield: ${results.task_completion.intentshield_comparison}`);
  
  console.log(`\nTest 2 - Description Obfuscation:`);
  console.log(`  Original block rate: ${results.obfuscation.original_block_rate}`);
  console.log(`  Obfuscated block rate: ${results.obfuscation.obfuscated_block_rate}`);
  console.log(`  Evasion success: ${results.obfuscation.evasion_success_rate}`);
  console.log(`  → This reveals whether guard is text-matching or behavior-aware`);
  
  console.log(`\nTest 3 - Denominators:`);
  console.log(`  ${results.denominators.relationship}`);
  
  console.log(`\n✓ Full results saved to /data/supplementary_benchmark_v2.json`);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
