// Build-time identity, never inferred from a URL or copied backup.
export const CHANNEL=typeof __SETKA_CHANNEL__==='undefined'?'unstable':__SETKA_CHANNEL__;
export const VERSION=typeof __SETKA_VERSION__==='undefined'?'0.5.0-unstable.1':__SETKA_VERSION__;
export const CHANNEL_LABEL={stable:'Stable',unstable:'Unstable',betha:'Betha'}[CHANNEL];
if(!CHANNEL_LABEL)throw Error('Unknown release channel');
export const storageKey=name=>`setka.${CHANNEL==='stable'?'':CHANNEL+'.'}${name}`;
