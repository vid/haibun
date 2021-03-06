import { WorkspaceContext } from '../lib/contexts';
import { OK, TBuildResult, TFinalize, TNotOkStepActionResult, TOKStepActionResult, TResolvedFeature, TWorld } from '../lib/defs';
import { getNamedToVars } from '../lib/namedVars';
import { applyResShouldContinue } from '../lib/util';

export default class Builder {
  world: any;
  workspace: WorkspaceContext;
  constructor(world: TWorld, workspace: WorkspaceContext = new WorkspaceContext(`builder`)) {
    this.world = world;
    this.workspace = workspace;
  }
  async build(features: TResolvedFeature[]) {
    const finalizers: { [path: string]: TFinalize[] } = {};
    this.world.shared.values._scored = [];
    for (const feature of features) {
      for (const vstep of feature.vsteps) {
        for (const action of vstep.actions) {
          if (action.step.build) {
            if (!this.workspace.get(feature.path)) {
              this.workspace.createPath(feature.path);
              finalizers[feature.path] = [];
            }
            const namedWithVars = getNamedToVars(action, this.world);
            const res = await action.step.build(namedWithVars!, vstep, this.workspace.get(feature.path));

            const shouldContinue = applyResShouldContinue(this.world, res, action);
            if (!shouldContinue) {
              throw Error(`${action.name}: ${(<TNotOkStepActionResult>res).message}`);
            }
            if ((<TOKStepActionResult & TBuildResult>res).finalize) {
              finalizers[feature.path].push((<TOKStepActionResult & TBuildResult>res).finalize!);
            }
          }
        }
      }
    }
    for (const key of Object.keys(finalizers)) {
      for (const finalize of finalizers[key]) {
        finalize(this.workspace.get(key));
      }
    }

    return OK;
  }
}
