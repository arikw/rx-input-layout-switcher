/* exported d, printState */

const
    dbg = true,
    Clutter = imports.gi.Clutter,
    ExtensionUtils = imports.misc.extensionUtils,
    Me = ExtensionUtils.getCurrentExtension(),
    tag = Me.uuid.split('@')[0],
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

function printState(mods, modifiersSequence) {
    // for (const mask of Object.keys(modBitsState)) {
    //     d(`${mask}: ${mods & Clutter.ModifierType[`${mask}_MASK`]}`, Clutter.ModifierType[`${mask}_MASK`], mods);
    // }
    for (const modName of Object.keys(modBitsState)) {
        modBitsState[modName] = mods & Clutter.ModifierType[`${modName}_MASK`];
    }

    const activeModsDescription = Object.entries(modBitsState)
        .filter(([_, value]) => value).map(([name]) => name)
        .join('|');

    d(`${activeModsDescription || 'NONE'} (value: ${mods})`);
    d(`modifiersSequence: ${modifiersSequence.map(v => v.bits).join('>')}`);
    d('');
}

function d(message, level = 'debug') {
    if ((level === 'debug') && !dbg) {
        return; // skip debug prints
    }

    log(`${tag}: ${message}`);
}
