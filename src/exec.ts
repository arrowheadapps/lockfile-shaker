/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

import { spawn, SpawnSyncOptionsWithStringEncoding } from 'child_process';

export function exec(cmd: string, opts: SpawnSyncOptionsWithStringEncoding) {
  return new Promise<string>((resolve, reject) => {
    const proc = spawn(cmd, opts);
    let stdout = '';
    let stderr = '';
    proc.stdout!.on('data', data => stdout += data);
    proc.stderr!.on('data', data => stderr += data);
    proc.once('error', reject);
    proc.once('close', code => {
      if (code) {
        reject(new Error(stderr));
        return;
      }
      resolve(stdout);
    });
  })
};
