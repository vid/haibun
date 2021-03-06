import { IStepper, IExtensionConstructor, OK, TWorld, TNamed } from '../lib/defs';
import { actionOK, sleep } from '../lib/util';

const Haibun: IExtensionConstructor = class Haibun implements IStepper {
  world: TWorld;
  constructor(world: TWorld) {
    this.world = world;
  }
  steps = {
    prose: {
      gwta: '.*[.?!]$',
      action: async () => OK,
    },
    sendFeatures: {
      gwta: 'send features',
      action: async () => {
        return actionOK({features: this.world.shared.values._features});
      },
    },
    startStepDelay: {
      gwta: 'start step delay of (?<ms>.+)',
      action: async ({ ms }: TNamed) => {
        this.world.options.step_delay = parseInt(ms, 10);
        return OK;
      },
    },
    stopStepDelay: {
      gwta: 'stop step delay',
      action: async () => {
        return OK;
      },
    },
    pauseSeconds: {
      gwta: 'pause for {ms}s',
      action: async ({ ms }: TNamed) => {
        const seconds = parseInt(ms, 10) * 1000;
        await sleep(seconds);
        return OK;
      },
    },
  };
};

export default Haibun;
