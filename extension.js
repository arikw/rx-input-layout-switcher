/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init, enable, disable */

const
    Clutter = imports.gi.Clutter,
    Mainloop = imports.mainloop,
    inputSourceManager = imports.ui.status.keyboard.getInputSourceManager(),
    dbg = true,
    tag = 'WZMN-RX-Ext:';

let
    mainLoopTimerId,
    acceleratorListenerId,
    modifiersState = null,
    modifiersSequence = [];

// TODO: test on Wayland

function onModifiersChange(mods) {
    modifiersState = mods;

    modifiersSequence.push({
        bits: modifiersState,
        date: Date.now(),
    });
    if (modifiersSequence > 5 /* max sequence length */) {
        modifiersSequence.shift(); // remove oldest event
    }

    if (
        modifiersSequence.length === 4 &&
        isAltOrShift(modifiersSequence[1].bits) &&
        modifiersSequence[2].bits ===
        (Clutter.ModifierType.MOD1_MASK | Clutter.ModifierType.SHIFT_MASK) &&
        (modifiersState === 0 || isAltOrShift(modifiersSequence[3].bits)) &&
        modifiersSequence[3].date - modifiersSequence[2].date < 300 /* shift pressed briefly */ &&
        true /* check no other shortcut occured */
    ) {
        if (dbg) {
            log(`${tag} change lang!!!!!`);
        }

        const numOfInputSources = Object.keys(
            inputSourceManager.inputSources
        ).length;
        const currentInput = inputSourceManager.currentSource;
        const nextInput = inputSourceManager.inputSources[(currentInput.index + 1) % numOfInputSources];
        nextInput.activate();

        resetSequence(modifiersState);
    }

    if (modifiersState === 0) {
        resetSequence(mods);
    }
}

function _tick() {
    const previousState = modifiersState;
    const mods = getCurrentModifiers();

    if (previousState !== mods) {
        onModifiersChange(mods);
        if (dbg) {
            debugState(mods);
        }
    }

    return true;
}

function isAltOrShift(bits) {
    return (
        bits === Clutter.ModifierType.MOD1_MASK ||
        bits === Clutter.ModifierType.SHIFT_MASK
    );
}

function getCurrentModifiers() {
    const [, , mods] = global.get_pointer();
    return mods &
        // Remove caps-lock and num-lock states from state mask
        ~(Clutter.ModifierType.LOCK_MASK |  Clutter.ModifierType.MOD2_MASK);
}


function resetSequence(mods) {
    modifiersSequence = [
        {
            bits: mods,
            date: Date.now(),
        },
    ];
}


// //////////////////////////////////////////////
const modBitsState = {
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
function debugState(mods) {
    // for (const mask of Object.keys(modBitsState)) {
    //     log(`${tag} ${mask}: ${mods & Clutter.ModifierType[`${mask}_MASK`]}`, Clutter.ModifierType[`${mask}_MASK`], mods);
    // }

    for (const modName of Object.keys(modBitsState)) {
        modBitsState[modName] = mods & Clutter.ModifierType[`${modName}_MASK`];
    }

    const activeModsDescription = Object.entries(modBitsState)
        .filter(([_, value]) => value).map(([name]) => name)
        .join('|');

    log(
        `${tag} ${activeModsDescription} (value: ${mods})`
    );
    log(
        `${tag} ${modifiersSequence.map(v => v.bits).join('>')}`
    );
    log('');
}
// //////////////////////////////////////////////

function enable() {
    mainLoopTimerId = null;

    // if(dbg) log(`${tag} Running Wayland: ` + Meta.is_wayland_compositor());

    mainLoopTimerId = Mainloop.timeout_add(50, _tick);

    acceleratorListenerId = global.display.connect(
        'accelerator-activated',
        (display, action, deviceId, timestamp) => {
            log(
                `${tag} Accelerator Activated: [display={}, action={}, deviceId={}, timestamp={}]`,
                display,
                action,
                deviceId,
                timestamp
            );
        }
    );
}

function disable() {
    Mainloop.source_remove(mainLoopTimerId);
    global.display.disconnect(acceleratorListenerId);
}

function init() {
    const mods = getCurrentModifiers();
    onModifiersChange(mods);
}
