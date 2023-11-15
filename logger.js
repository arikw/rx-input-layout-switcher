import Clutter from 'gi://Clutter';

const
    dbg = false,
    tag = 'rx-input-layout-switcher@wzmn.net',
    modBitsState = {
        CONTROL: 0,
        SHIFT: 0,
        SUPER: 0,
        HYPER: 0,
        LOCK: 0, // CAPS LOCK
        META: 0,
        MOD1: 0, // ALT
        MOD2: 0, // NUM LOCK
        MOD3: 0,
        MOD4: 0, // WinKey
        MOD5: 0, // Right ALT
    };

export function printState({ bits, sequence }) {
    // for (const mask of Object.keys(modBitsState)) {
    //     d(`${mask}: ${mods & Clutter.ModifierType[`${mask}_MASK`]}`, Clutter.ModifierType[`${mask}_MASK`], mods);
    // }
    for (const modName of Object.keys(modBitsState)) {
        modBitsState[modName] = bits & Clutter.ModifierType[`${modName}_MASK`];
    }

    const activeModsDescription = Object.entries(modBitsState)
        .filter(([_, value]) => value).map(([name]) => name)
        .join('|');

    d(`${activeModsDescription || 'NONE'} (value: ${bits})`);
    d(`modifiersSequence: ${sequence.map(v => v.bits).join('>')}`);
    d('');
}

export function d(message, level = 'debug') {
    if ((level === 'debug') && !dbg) {
        return; // skip debug prints
    }

    console.log(`${tag}: ${message}`);
}