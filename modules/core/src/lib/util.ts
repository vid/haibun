import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { WorldContext } from './contexts';

import {
  IStepper,
  IExtensionConstructor,
  IHasOptions,
  TFeature,
  TNotOKActionResult,
  TOKActionResult,
  TOptionValue,
  TOutput,
  TResult,
  TSpecl,
  TWorld,
  TOptions,
  TProtoOptions,
  TRuntime,
  HAIBUN,
} from './defs';
import { withNameType } from './features';
import Logger, { LOGGER_NONE } from './Logger';

// FIXME tired of wrestling with ts/import issues
export async function use(module: string) {
  try {
    const re: any = (await import(module)).default;
    return re;
  } catch (e) {
    console.error('failed including', module);
    console.error(e);
    throw e;
  }
}

export async function resultOutput(type: string | undefined, result: TResult, shared: WorldContext) {
  if (type) {
    const AnOut = await use(type);
    const out: TOutput = new AnOut();
    if (out) {
      const res = await out.getOutput(result, {});
      return res;
    }
  }
  if (!result.ok) {
    return { ...result, results: result.results?.filter((r) => !r.ok).map((r) => (r.stepResults = r.stepResults.filter((s) => !s.ok))) };
  }
  return result;
}

export function actionNotOK(message: string, details?: any): TNotOKActionResult {
  return {
    ok: false,
    message,
    details,
  };
}

export function actionOK(details?: any): TOKActionResult {
  return { ok: true, details };
}

export async function getSteppers({ steppers = [], world, addSteppers = [] }: { steppers: string[]; world: TWorld; addSteppers?: IExtensionConstructor[] }) {
  const allSteppers: IStepper[] = [];
  for (const s of steppers) {
    const loc = getModuleLocation(s);

    const S: IExtensionConstructor = await use(loc);
    try {
      const stepper = new S(world);
      allSteppers.push(stepper);
    } catch (e) {
      console.error(`new ${S} from "${loc}" failed`, e, S);
      throw e;
    }
  }
  for (const S of addSteppers) {
    const stepper = new S(world);
    allSteppers.push(stepper);
  }
  return allSteppers;
}

function getModuleLocation(name: string) {
  if (name.startsWith('~')) {
    return [process.cwd(), 'node_modules', name.substr(1)].join('/');
  } else if (name.match(/^[a-zA-Z].*/)) {
    return `../steps/${name}`;
  }
  return path.resolve(process.cwd(), name);
}

export function debase(base: string, features: TFeature[]) {
  return features.map((f) => ({ ...f, path: f.path.replace(base, '') }));
}

export function recurse(dir: string, type: string, filter: RegExp | string | undefined = undefined): TFeature[] {
  const files = readdirSync(dir);
  let all: TFeature[] = [];
  for (const file of files) {
    const here = `${dir}/${file}`;
    if (statSync(here).isDirectory()) {
      all = all.concat(recurse(here, type, filter));
    } else if ((!type || file.endsWith(`.${type}`)) && (!filter || file.match(filter))) {
      all.push(withNameType(here, readFileSync(here, 'utf-8')));
    }
  }
  return all;
}

export function getDefaultOptions(): TSpecl {
  return {
    mode: 'all',
    steppers: ['vars'],
    options: {},
  };
}

export function getOptionsOrDefault(base?: string): TSpecl {
  if (base) {
    const f = `${base}/config.json`;
    if (existsSync(f)) {
      try {
        const specl = JSON.parse(readFileSync(f, 'utf-8'));
        if (!specl.options) {
          specl.options = {};
        }
        return specl;
      } catch (e) {
        console.error('missing or not valid project config file.');
        process.exit(1);
      }
    }
  }
  return getDefaultOptions();
}

export function getActionable(value: string) {
  return value.replace(/#.*/, '').trim();
}

export function describeSteppers(steppers: IStepper[]) {
  return steppers
    .map((stepper) => {
      return Object.keys(stepper.steps).map((name) => {
        return `${stepper.constructor.name}:${name}`;
      });
    })
    .join(' ');
}

// from https://stackoverflow.com/questions/1027224/how-can-i-test-if-a-letter-in-a-string-is-uppercase-or-lowercase-using-javascrip
export function isLowerCase(str: string) {
  return str.toLowerCase() && str != str.toUpperCase();
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getDefaultWorld(): { world: TWorld } {
  return {
    world: {
      shared: new WorldContext('default'),
      logger: new Logger(process.env.HAIBUN_LOG_LEVEL ? { level: process.env.HAIBUN_LOG_LEVEL } : LOGGER_NONE),
      runtime: {},
      options: {},
      domains: [],
    },
  };
}

type TEnv = { [name: string]: string | undefined };

export function processEnv(env: TEnv, options: TOptions) {
  const protoOptions: TProtoOptions = { options: { ...options }, extraOptions: {} };
  let splits: { [name: string]: string }[] = [{}];
  let errors: string[] = [];
  const pfx = `${HAIBUN}_`;
  Object.entries(env)
    .filter(([k]) => k.startsWith(pfx))
    .map(([k]) => {
      const value = env[k];
      const opt = k.replace(pfx, '');
      if (opt === 'SPLIT_SHARED' && value !== undefined) {
        const [what, s] = value.split('=');
        if (!s) {
          errors.push(`  ${pfx}SPLIT_SHARED=var=option1,option2`);
        } else {
          splits = s.split(',').map((w: string) => ({ [what]: w }));
        }
      } else if (opt === 'STEP_DELAY') {
        protoOptions.options.step_delay = parseInt(value!, 10);
      } else if (opt === 'CLI') {
        protoOptions.options.cli = true;
      } else if (opt === 'STAY') {
        protoOptions.options.stay = value!;
      } else if (opt === 'LOG_LEVEL') {
      } else {
        protoOptions.extraOptions[k] = value!;
      }
    });

  return { splits, protoOptions, errors };
}

// has side effects
export function applyExtraOptions(protoOptions: TProtoOptions, steppers: IStepper[], world: TWorld) {
  if (!protoOptions.extraOptions) {
    return;
  }
  Object.entries(protoOptions.extraOptions).map(([k, v]) => {
    const conc = getStepperOptions(k, v!, steppers);
    if (!conc) {
      throw Error(`no option ${k}`);
    }
    delete protoOptions.extraOptions[k];
    world.options[k] = conc;
  });

  if (Object.keys(protoOptions.extraOptions).length > 0) {
    throw Error(`no options provided for ${protoOptions.extraOptions}`);
  }
}

function getPre(stepper: IStepper) {
  return ['HAIBUN', 'O', (stepper as any as IExtensionConstructor).constructor.name.toUpperCase()].join('_') + '_';
}

export function getStepperOptions(key: string, value: string, steppers: (IStepper & IHasOptions)[]): TOptionValue | void {
  for (const stepper of steppers) {
    const pre = getPre(stepper);
    const int = key.replace(pre, '');
    if (key.startsWith(pre) && stepper.options![int]) {
      return stepper.options![int].parse(value);
    }
  }
}

export function getStepperOption(stepper: IStepper, name: string, options: TOptions): TOptionValue {
  const key = getPre(stepper) + name;
  return options[key];
}

export function ensureDirectory(base: string, folder: string) {
  try {
    if (!existsSync(base)) {
      mkdirSync(base);
      console.info(`created ${base}`);
    }
    if (!existsSync(`${base}/${folder}`)) {
      mkdirSync(`${base}/${folder}`);
      console.info(`created ${base}/${folder}`);
    }
  } catch (e) {
    console.error(`coudl not create ${base}/${folder}`, e);
    throw e;
  }
}

// FIXME
export function getStepper<Type>(steppers: IStepper[], name: string): Type {
  return <Type>(steppers.find((s) => s.constructor.name === name) as any);
}

export function getFromRuntime<Type>(runtime: TRuntime, name: string): Type {
  return runtime[name] as Type;
}
