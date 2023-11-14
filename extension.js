/*
 * Copyright (C) 2023 Arik W (https://github.com/arikw)
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

import Clutter from 'gi://Clutter';
import { getInputSourceManager } from 'resource:///org/gnome/shell/ui/status/keyboard.js';
import { d, printState } from './logger.js';
import { watch, unwatch, observable } from './reactive.js';

const
    // consts
    { timeout_add, source_remove } = imports.mainloop,
    inputSourceManager = getInputSourceManager(),
    ALT_AND_SHIFT_MASK = Clutter.ModifierType.MOD1_MASK | Clutter.ModifierType.SHIFT_MASK,
    state = {
        modifiers: observable({
            bits: null,
            sequence: [],
            isBroken: false,
        }),
    };

let
    // variables
    mainLoopTimerId,
    acceleratorListenerId;

function _addToSequence(descriptor) {
    const modifiersSequence = state.modifiers.sequence;
    const previousState = modifiersSequence[modifiersSequence.length - 1] ?? {};
    modifiersSequence.push(descriptor);

    // break sequence if non ALT\SHIFT bits are raised
    if (descriptor.bits & ~ALT_AND_SHIFT_MASK) {
        state.modifiers.isBroken = true;
    }

    if (modifiersSequence.length > 5 /* max relevant sequence length */) {
        modifiersSequence.shift(); // remove oldest event
    }

    let shouldSwitch = false;
    if (
        !state.modifiers.isBroken &&
        modifiersSequence.length >= 1 &&
        modifiersSequence[0].bits === 0 && // sequence started without pressed modifiers
        (previousState.bits === ALT_AND_SHIFT_MASK)
    ) {
        // shift+shift pressed briefly?
        if ((descriptor.date - previousState.date) < 300) {
            shouldSwitch = true;
        } else {
            state.modifiers.isBroken = true;
        }
    }

    if (shouldSwitch) {
        _switchInputMethod();
    }

    if (shouldSwitch || (state.modifiers.bits === 0)) {
        d('--------------');
        _resetSequence(0);
    }
    d(JSON.stringify({ time: descriptor.date - (modifiersSequence[1]?.date ?? 0), isBroken: state.modifiers.isBroken, previousState: previousState.bits, althisft: previousState.bits === ALT_AND_SHIFT_MASK }));
}

function _switchInputMethod() {
    const numOfInputSources = Object.keys(inputSourceManager.inputSources).length;
    const currentInput = inputSourceManager.currentSource;
    const nextInput = inputSourceManager.inputSources[(currentInput.index + 1) % numOfInputSources];
    nextInput.activate();

    d(`switched input method from ${currentInput.shortName}-${currentInput.id} to ${nextInput.shortName}-${nextInput.id}`, 'info');
}

function _tick() {
    const previousState = state.modifiers.bits;
    const mods = _getCurrentModifiers();

    if (previousState !== mods) {
        state.modifiers.bits = mods;
        printState(state.modifiers);
    }

    return true;
}

function _getCurrentModifiers() {
    const [, , mods] = global.get_pointer();
    return mods &
        // Remove caps-lock and num-lock states from state mask
        ~(Clutter.ModifierType.LOCK_MASK |  Clutter.ModifierType.MOD2_MASK);
}

function _resetSequence(mods) {
    state.modifiers.sequence = [
        {
            bits: mods,
            date: Date.now(),
        },
    ];
    state.modifiers.isBroken = mods !== 0;
}

function _onModifierBitsChange(bits) {
    _addToSequence({ bits, date: Date.now() });
}

export default class RxInputLayoutSwitcher {

    enable() {
        watch(state.modifiers, 'bits', _onModifierBitsChange);
        state.modifiers.bits = _getCurrentModifiers();
        mainLoopTimerId = timeout_add(50, _tick);
        acceleratorListenerId = global.display.connect('accelerator-activated', () => {
            d('accelerator activation detected');
            state.modifiers.isBroken = true;
        });
    }

    disable() {
        source_remove(mainLoopTimerId);
        global.display.disconnect(acceleratorListenerId);
        unwatch(state.modifiers, 'bits', _onModifierBitsChange);
    }

}