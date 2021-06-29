import { IStepper, IExtensionConstructor, OK, TKeyString, TWorld } from '../lib/defs';

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
    startStepDelay: {
      gwta: 'start step delay of (?<ms>.+)',
      action: async ({ ms }: TKeyString) => {
        this.world.options.step_delay = parseInt(ms, 10);
        return OK;
      },
    },
    stoptStepDelay: {
      gwta: 'stop step delay',
      action: async () => {
        return OK;
      },
    },
  };
};

export default Haibun;