import { TVStep } from '../lib/defs';
import { Executor } from '../lib/Executor';
import { Resolver } from '../lib/Resolver';
import { getSteppers, getDefaultWorld } from '../lib/util';

describe('haibun', () => {
  it('finds prose', async () => {
    const { world } = getDefaultWorld();
    const steppers = await getSteppers({ steppers: ['haibun'], world });
    const resolver = new Resolver(steppers, '', world);
    const test = 'A sentence.';
    const actions = resolver.findSteps(test);
    const tvstep: TVStep = {
      in: test,
      seq: 0,
      actions,
    };

    const res = await Executor.doFeatureStep(tvstep, world);
    expect(res.ok).toBe(true);
    expect(res.actionResults[0].name).toBe('prose');
  });
});