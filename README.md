# Cloudflare Workflow Wait For Action Demo

This demo repo demonstrates how to implement a pausable workflow using Cloudflare Workers, combining Durable Objects and Workflows. The application shows how to create a workflow that can pause execution and resume based on an external trigger (KV update in the example).

## What it Does

1. When triggered, the workflow starts and pauses itself
2. A Durable Object monitors a KV namespace for a status change
3. When the KV value is updated to 'true', the workflow automatically resumes
4. The Durable Object uses an alarm system to periodically check the KV status

Using a value in KV is just an example, you could publish a message to a queue that updates a D1 database, or even the Durable Object itself, and then have the DO wait for that action to complete before resuming the workflow.

## Cloudflare Products Used

- Cloudflare Workers
- Durable Objects (for state management and alarm functionality)
- Workflows (for orchestrating the pause/resume flow)
