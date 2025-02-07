import { DurableObject } from "cloudflare:workers";
import { Env } from "./index";

export class DurableObjectExample extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async waitForKvUpdate(instanceId: string, retryPeriod: number) {
    // We need to persist the instanceId so we can resume the workflow later
    this.ctx.storage.put('instanceId', instanceId);

    // we need to persist the retryPeriod so the alarm can use it
    this.ctx.storage.put('retryPeriod', retryPeriod);

    // Set the alarm to go off in retryPeriod seconds
    this.ctx.storage.setAlarm(Date.now() + retryPeriod * 1000);
  }

  async alarm() {
    // Retrieve the state from the KV
    const complete = await this.env.WAIT_EXAMPLE_KV.get('complete');

    // If it has been updated to true, resume the workflow
    // For the demo, KV will be updated manually in the UI or via the CLI
    // Careful if you run this yourself, you may end up with a lot of alarms triggering if you forget to update KV
    if (complete === 'true') {
      console.log('Complete is true, resuming workflow');
      const instanceId = await this.ctx.storage.get('instanceId');
      const workflow = await this.env.MY_WORKFLOW.get(instanceId as string);
      await workflow.resume();
    } else {
      // If it has not been updated to true, set the alarm to go off in retryPeriod seconds
      console.log('Complete is false, setting alarm');
      const retryPeriod = parseInt(await this.ctx.storage.get('retryPeriod') as string);

      this.ctx.storage.setAlarm(Date.now() + retryPeriod * 1000);
    }
  }
}