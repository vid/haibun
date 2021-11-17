import { HAIBUN, IHasOptions, TOptions, TProtoOptions, TSpecl, } from "@haibun/core/build/lib/defs";
import { getDefaultWorld } from "@haibun/core/build/lib/test/lib";
import { getSteppers, getPre } from "@haibun/core/build/lib/util";
import { BaseOptions } from "./BaseOptions";
import { TRunResult } from "./cli";

type TEnv = { [name: string]: string | undefined };

export async function usageThenExit(specl: TSpecl, message?: string) {
  const output = await usage(specl, message);
  console[message ? 'error' : 'info'](output);
  process.exit(message ? 1 : 0);
};

export async function usage(specl: TSpecl, message?: string) {
  let steppers = await getSteppers({ steppers: specl.steppers, world: getDefaultWorld(0).world });
  let a: { [name: string]: { desc: string } } = {};
  steppers.forEach(s => {
    const o = (s as IHasOptions);
    if (o.options) {
      const p = getPre(s);
      a = { ...a, ...Object.keys(o.options).reduce((a, i) => ({ ...a, [`${p}${i}`]: o.options![i] }), {}) };
    }
  });

  const ret = [
    '',
    `usage: ${process.argv[1]} <project base>`,
    message || '',
    'Set these environmental variables to control options:\n',
    ...Object.entries(BaseOptions.options).map(([k, v]) => `${k.padEnd(55)} ${v.desc}`),
  ];
  if (Object.keys(a).length) {
    ret.push('\nThese variables are available for selected extensions (via config.js)\n',
      ...Object.entries(a).map(([k, v]) => `${k.padEnd(55)} ${v.desc}`));
  }
  return [...ret, ''].join('\n');
}

export function ranResultError(ranResults: TRunResult[], exceptionResults: any[]): any {
  return JSON.stringify(
    {
      ran: ranResults
        .filter((r) => !r.result.ok)
        .map((r) => ({ stage: r.result.failure?.stage, details: r.result.failure?.error.details, results: r.result.results?.find((r) => r.stepResults.find((r) => !r.ok)) })),
      exceptionResults,
    },
    null,
    2
  );
}

export function processEnv(env: TEnv, options: TOptions) {
  const protoOptions: TProtoOptions = { options: { ...options, env: {} }, extraOptions: {} };
  let errors: string[] = [];
  const pfx = `${HAIBUN}_`;

  const setIntOrError = (val: any, what: string) => val.match(/[^\d+]/) ? errors.push(`${what}: integer`) : protoOptions.options[what.toLowerCase()] = parseInt(val, 10);

  Object.entries(env)
    .filter(([k]) => k.startsWith(pfx))
    .map(([k]) => {
      const value = env[k];
      const opt = k.replace(pfx, '');
      const baseOption = (BaseOptions as IHasOptions).options![k];
      if (baseOption) {
        protoOptions.options[opt] = baseOption.parse(value!);
      } else {
        protoOptions.extraOptions[k] = value!;
      }
    });

  return { protoOptions, errors };
}

export function applyEnvCollections(value: string, protoOptions: TProtoOptions) {
  const pairs = new Set(value?.split(',').map(a => a.split('=')[0]));

  for (const pair of pairs) {
    const [k] = Array.from(new Set(pair.split('=')));
    if (protoOptions.options.env[k]) {
      throw Error(`ENVC ${k} already exists`);
    }
    protoOptions.options.env[k] = [];
  }
  for (const pair of value?.split(',')) {
    const [k, v] = pair.split('=');
    protoOptions.options.env[k].push(v);
  }
}
