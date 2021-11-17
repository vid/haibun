import { HAIBUN, IHasOptions } from "@haibun/core/build/lib/defs";
import { getIntOrError } from "@haibun/core/build/lib/util";

const pfx = `${HAIBUN}_`

const setIntOrError = (val: any, what: string) => {
    if (val.match(/[^\d+]/)) {
        throw Error(`${what}: integer`)
    }
    return parseInt(val, 10);
}

const setBoolOrError = (val: any, what: string) => {
    if (val !== 'false' && val !== 'true') {
        throw Error(`${what}: true or false`);
    }
    return val === 'true';
}

export class BaseOptions implements IHasOptions {
    static options = {
        SPLIT_SHARED: {
            desc: 'hi',
            parse: (input: string) => {
                const [what, s] = input.split('=');
                if (!s) {
                    throw Error(`${pfx}SPLIT_SHARED=var=option1,option2`);
                } else {
                    return s.split(',').map((w: string) => ({ [what]: w }));
                }
            }
        },
        TRACE: {
            desc: 'trace',
            parse: (input: string) => setBoolOrError(input, 'trace')
        },
        /*
        CLI= {
            parse(input: string) =>  true;
        },
        STAY= {
            parse(input: string) =>  value;
        },
        LOG_FOLLOW= {
            parse(input: string) =>  value;
        },
        LOG_LEVEL= {
            parse(input: string) =>  value;
        },
        ENV= {
            const pairs = value?.split(',');
            for(const pair in pairs) {
    const [k, v] = pair.split(',').map(i => i.trim());
    if (protoOptions.options.env[k]) {
        throw Error(`ENV ${k} already exists`);
    }
    protoOptions.options.env[k] = v;
}
},
        ENVC: {
            parse(input: string) => applyEnvCollections(input!, protoOptions);
        }
        */
        STEP_DELAY: {
            desc: 'hi',
            parse: (input: string) => getIntOrError(input)
        },

        /*
        LOOPS : {
            desc: 'hi',
            parse: (input: string) => getIntOrError
        },
        LOOP_START = {
            desc: 'hi',
            parse: (input: string) => getIntOrError
        },
        LOOP_INC = {
            desc: 'hi',
            parse: (input: string) => getIntOrError
        },
        MEMBERS = {
            desc: 'hi',
            parse: (input: string) => getIntOrError
        },
        CONTINUE_ON_ERROR_IF_SCORED = {
            desc: 'scoring for continuation',
            parse: (input: string) => input;
        },
        OUTPUT = {
            desc: 'Output format (AsXUnit)';
            parse: (input: string) => input;
        },
        CLI = {
            desc: 'start a cli for each instance';
            parse: (input: string) => true;
        },
        LOG_LEVEL = {
            desc: 'log level (debug, log, info, warn, error, none)';
            parse: (input: string) => true;
        },
        SPLIT_SHARED = {
            desc: 'Use vars for split instances (=ex=1,2,3)';
            parse: (input: string) => true;
        },
        PWDEBUG = {
            desc: '(web) Enable Playwright debugging (0 or 1)';
            parse: (input: string) => true;
        },
        STEP_DELAY = {
            desc: 'ms to wait between every step';
            parse: (input: string) => true;
        },
        STAY = {
            desc: 'ok or error';
            parse: (input: string) => true;
        },
        */
    };
}
