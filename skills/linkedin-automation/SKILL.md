---
name: linkedin-automation
description: Automate LinkedIn growth workflows for content planning, post drafting, outreach messaging, engagement triage, browser execution, and weekly performance analysis. Use when Codex needs to handle LinkedIn tasks such as building a content calendar, turning notes/transcripts into posts, drafting connection and follow-up messages, preparing reply/comment drafts, or running human-approved LinkedIn UI actions with browser automation.
---

# LinkedIn Automation

## Overview

Run repeatable, human-reviewed LinkedIn workflows for creating content, managing outreach, and executing UI tasks safely. Optimize for practical throughput without spammy behavior or blind autoposting.

## Workflow Decision Tree

- Run the content workflow when the user asks for post ideas, post drafts, hooks, carousels, or comment/reply drafts.
- Run the outreach workflow when the user asks for connection requests, personalized follow-ups, or DM sequences.
- Run the execution workflow when the user asks to perform in-product actions (post, comment, message, capture metrics) in a browser.
- Run the analytics workflow when the user asks what is working, what to double down on, or how to improve next week.

## Step 1: Gather Inputs

Collect the minimum viable context before generating assets:

- Profile positioning: role, expertise, and desired audience.
- Objective: authority building, inbound leads, recruiting, partnerships, or hiring.
- Offer: CTA destination, lead magnet, product page, or booking link.
- Voice: tone, writing style, and examples to imitate.
- Constraints: posting cadence, geographic focus, banned claims, and approval needs.

If key context is missing, assume practical defaults and continue.

## Step 2: Build the Weekly Plan

Define a weekly operating plan before writing individual messages:

1. Select 2-3 content pillars tied to audience pains and business goals.
2. Assign each planned post one primary goal: reach, trust, or conversion.
3. Mix post formats across the week: story, insight, how-to, and opinion.
4. Add one lightweight engagement block per posting day (comments, replies, DMs).
5. Keep one explicit experiment variable each week (hook style, CTA, or format).

Use templates in [references/content-templates.md](references/content-templates.md).

## Step 3: Produce Content Assets

Generate deliverables in this order:

1. Write post concepts with angle, target audience, and CTA.
2. Draft post variants with one conservative and one bold option.
3. Draft first-comment options that extend value and invite discussion.
4. Draft follow-up comment/reply snippets for likely audience responses.
5. Package everything in an approval-ready batch.

Keep posts concise, specific, and example-driven. Avoid generic motivational filler.

## Step 4: Produce Outreach Assets

Generate outreach in small, high-personalization batches:

1. Write connection note variants tied to recipient context.
2. Write follow-up sequence drafts with clear spacing between touches.
3. Write objection-handling replies for common responses.
4. Include a no-pressure off-ramp in each sequence.

Avoid mass-message language. Personalize every first line.

## Step 5: Execute Browser Tasks Safely

Use this step only when the user asks to execute actions in LinkedIn UI.

1. Prefer official APIs or first-party integrations when available.
2. Use the `$playwright` skill for browser automation tasks.
3. Request explicit confirmation immediately before any external action:
   posting, commenting, reacting, sending requests, or sending messages.
4. Start with dry-run mode when possible (navigate, capture state, no submit).
5. Run actions in small batches and stop on captcha, 2FA, or anti-abuse prompts.
6. Return execution logs with completed, skipped, and failed items.

Do not continue execution after platform friction signals. Hand control back to the user.

## Step 6: Analyze and Iterate

At weekly review, summarize:

- Top posts by impressions, saves, comments, and profile visits.
- Highest-converting outreach messages and response rates.
- Patterns in hooks, topics, and CTA placement.
- One keep, one stop, one start recommendation for next week.

Recommend only high-leverage next actions with measurable impact.

## Output Contract

Return outputs in this structure:

1. Assumptions and missing inputs.
2. Weekly plan.
3. Content assets.
4. Outreach assets.
5. Execution plan with approval checkpoints.
6. KPI tracker table for next review.

## Guardrails

- Require human approval before sending or publishing anything externally.
- Refuse requests for spam, deceptive impersonation, or abusive mass outreach.
- Avoid scraping at scale or instructions to bypass platform protections.
- Keep claims truthful and avoid fabricated results/testimonials.
- Do not request or store raw account credentials.

## Reference

- Use [references/content-templates.md](references/content-templates.md) for copy frameworks and message templates.
