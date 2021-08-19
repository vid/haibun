import { Context, DomainContext } from '../lib/contexts';
import { IStepper, IExtensionConstructor, OK, TNamed, TVStep, TWorld } from '../lib/defs';
import { getStepShared } from '../lib/Domain';

const vars: IExtensionConstructor = class Vars implements IStepper {
  world: TWorld;
  constructor(world: TWorld) {
    this.world = world;
  }

  async onType({ what, type }: TNamed, where: Context) {
    this.world.shared.setDomain(type, what);

    return OK;
  }
  steps = {
    set: {
      gwta: 'set( empty)? {what: string} to {value: string}',
      action: async (named: TNamed, vstep: TVStep) => setShared(named, vstep, this.world),
      build: async (named: TNamed, vstep: TVStep, workspace: DomainContext) => setShared(named, vstep, this.world),
    },
    onType: {
      gwta: 'on the {what} {type}$',
      action: async (named: TNamed, vstep: TVStep) => this.onType(named, this.world.shared),
      build: async (named: TNamed, vstep: TVStep, workspace: DomainContext) => this.onType(named, this.world.shared),
    },
    background: {
      match: /^Background: ?(?<background>.+)?$/,
      action: async ({ background }: TNamed) => {
        this.world.shared.set('background', background);
        return OK;
      },
    },
    feature: {
      match: /^Feature: ?(?<feature>.+)?$/,
      action: async ({ feature }: TNamed) => {
        this.world.shared.set('feature', feature);
        return OK;
      },
    },
    scenario: {
      match: /^Scenario: (?<scenario>.+)$/,
      action: async ({ scenario }: TNamed) => {
        this.world.shared.set('scenario', scenario);
        return OK;
      },
    },
    display: {
      gwta: 'display (?<what>.+)',
      action: async ({ what }: TNamed) => {
        this.world.logger.log(`${what} is ${this.world.shared.get(what)}`);

        return OK;
      },
    },
  };
};
export default vars;

export const didNotOverwrite = (what: string, present: string | Context, value: string) => `did not overwrite ${what} value of "${present}" with "${value}"`;

  export const setShared = ({ what, value }: TNamed, vstep: TVStep, world: TWorld) => {
    // FIXME hokey
    const missingOnly = vstep.in.match(/set missing /);

    // if on a domain page, set it in that domain's shared
    const { type, name } = vstep.source;

    let shared = getStepShared(type, world);
    if (shared instanceof DomainContext) {
      const dc = <DomainContext>shared;
      shared = dc.get(name) || dc.createPath(name);
    }

    if (missingOnly || shared.get(what) === undefined) {
      shared.set(what, value);
      return OK;
    }
    
    return { ...OK, details: didNotOverwrite(what, shared.get(what), value) };
  }