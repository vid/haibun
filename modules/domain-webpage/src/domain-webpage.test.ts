import { onCurrentTypeForDomain } from '@haibun/core/build/steps/vars';
import { IExtensionConstructor, IStepper, TWorld, TNamed, IRequireDomains } from '@haibun/core/build/lib/defs';
import { runWith } from '@haibun/core/build/lib/run';
import { asFeatures } from '@haibun/core/build/lib/TestSteps';
import { getOptionsOrDefault, getDefaultWorld, actionOK } from '@haibun/core/build/lib/util';
import DomainWebPage, { webControl, webPage } from './domain-webpage';

const TestStepsRequiresDomain: IExtensionConstructor = class TestStepsRequiresDomain implements IStepper, IRequireDomains {
  world: TWorld;
  requireDomains = [webPage, webControl];
  constructor(world: TWorld) {
    this.world = world;
  }
  steps = {
    onType: {
      gwta: `on the {name} {type}$`,
      action: async ({ name, type }: TNamed) => {
        const location = onCurrentTypeForDomain({ name, type: webPage }, this.world);
        return actionOK(location);
      },
    },
    test: {
      gwta: `Press the {what: ${webControl}}`,
      action: async (named: TNamed) => {
        return actionOK();
      },
    },
  };
};

describe('domain webpage', () => {
  it.only('domain object from background', async () => {
    const specl = getOptionsOrDefault();
    const key = '/backgrounds/p1';

    const { world } = getDefaultWorld();
    const features = asFeatures([{ path: '/features/test.feature', content: `Backgrounds: p1.${webPage}\n\nOn the ${key} ${webPage}\nPress the submit button` }]);
    const backgrounds = asFeatures([{ path: `/backgrounds/p1.${webPage}.feature`, content: '' }]);
    const { result } = await runWith({ specl, features, backgrounds, addSteppers: [TestStepsRequiresDomain, DomainWebPage], world });

    expect(result.ok).toBe(true);
    expect(result.results![0].stepResults[0].actionResults[0].details).toEqual("http://localhost:8123/p1");
  });
});