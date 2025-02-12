import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { DurableObjectExample } from './do';
export { DurableObjectExample };

export type Env = {
  MY_WORKFLOW: Workflow;
  WAIT_EXAMPLE_KV: KVNamespace;
  DURABLE_OBJECT_EXAMPLE: DurableObjectNamespace<DurableObjectExample>;
};

// User-defined params passed to your workflow
type Params = {};

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		await step.do('pause', async () => {
      // Persist some state that we can use to determine if the workflow should resume
      this.env.WAIT_EXAMPLE_KV.put('complete', 'false');
      
      // Get the Durable Object instance that will be used to wait for the KV update
      // and trigger a resume of the workflow
      const id = this.env.DURABLE_OBJECT_EXAMPLE.idFromName(`workflow-${event.instanceId}`);
      const durableObjectExample = this.env.DURABLE_OBJECT_EXAMPLE.get(id);
      await durableObjectExample.waitForKvUpdate(event.instanceId, 10);

      // Pause the workflow
			const workflow = await this.env.MY_WORKFLOW.get(event.instanceId);
			await workflow.pause();
		});

    // This will be run once the Durable Object resumes the workflow
		await step.do('finish', async () => {
			console.log('finish');
		});
	}
}

// This is just here to start a Workflow instance
export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		let url = new URL(req.url);

		if (url.pathname.startsWith('/favicon')) {
			return Response.json({}, { status: 404 });
		}

		// Get the status of an existing instance, if provided
		let id = url.searchParams.get('instanceId');
		if (id) {
			let instance = await env.MY_WORKFLOW.get(id);
			return Response.json({
				status: await instance.status(),
			});
		}

		// Spawn a new instance and return the ID and status
		let instance = await env.MY_WORKFLOW.create();
		return Response.json({
			id: instance.id,
			details: await instance.status(),
		});
	},
};
