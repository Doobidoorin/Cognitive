/**
 * Run with: npm run validate-questions
 *
 * Sanity-checks the QUESTION_BANK in src/lib/questions.ts once you've
 * pasted in the real 30 questions — catches missing fields, duplicate
 * slots, out-of-range answers, and empty placeholders before you deploy.
 */
import { validateQuestionBank } from "../lib/questions";

const errors = validateQuestionBank();

if (errors.length === 0) {
  console.log("✅ Question bank looks good — all 30 questions are valid.");
  process.exit(0);
} else {
  console.error(`❌ Found ${errors.length} issue(s) in the question bank:\n`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
