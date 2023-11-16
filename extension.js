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
import Glib from 'gi://GLib';

const
    // consts
    ALT_AND_SHIFT_MASK = Clutter.ModifierType.MOD1_MASK | Clutter.ModifierType.SHIFT_MASK,
    { timeout_add, source_remove, PRIORITY_DEFAULT } = Glib;

export default class RxInputLayoutSwitcher {

    enable() {
        this.inputSourceManager = getInputSourceManager();
        this.state = {
            modifiers: observable({
                bits: null,
                sequence: [],
                isBroken: false,
            }),
        };
    
        watch(this.state.modifiers, 'bits', this._onModifierBitsChange.bind(this));
        this.state.modifiers.bits = this._getCurrentModifiers();
        this.mainLoopTimerId = timeout_add(PRIORITY_DEFAULT, 50, this._tick.bind(this));
        this.acceleratorListenerId = global.display.connect('accelerator-activated', () => {
            d('accelerator activation detected');
            this.state.modifiers.isBroken = true;
        });
    }

    disable() {
        source_remove(this.mainLoopTimerId);
        global.display.disconnect(this.acceleratorListenerId);
        unwatch(this.state.modifiers, 'bits', this._onModifierBitsChange);
        this.inputSourceManager = null;
        this.state = null;
    }

    _addToSequence(descriptor) {
        const modifiersSequence = this.state.modifiers.sequence;
        const previousState = modifiersSequence[modifiersSequence.length - 1] ?? {};
        modifiersSequence.push(descriptor);

        // break sequence if non ALT\SHIFT bits are raised
        if (descriptor.bits & ~ALT_AND_SHIFT_MASK) {
            this.state.modifiers.isBroken = true;
        }

        if (modifiersSequence.length > 5 /* max relevant sequence length */) {
            modifiersSequence.shift(); // remove oldest event
        }

        let shouldSwitch = false;
        if (
            !this.state.modifiers.isBroken &&
            modifiersSequence.length >= 1 &&
            modifiersSequence[0].bits === 0 && // sequence started without pressed modifiers
            (previousState.bits === ALT_AND_SHIFT_MASK)
        ) {
            // shift+shift pressed briefly?
            if ((descriptor.date - previousState.date) < 300) {
                shouldSwitch = true;
            } else {
                this.state.modifiers.isBroken = true;
            }
        }

        if (shouldSwitch) {
            this._switchInputMethod();
        }

        if (shouldSwitch || (this.state.modifiers.bits === 0)) {
            d('--------------');
            this._resetSequence(0);
        }
        d(JSON.stringify({ time: descriptor.date - (modifiersSequence[1]?.date ?? 0), isBroken: this.state.modifiers.isBroken, previousState: previousState.bits, althisft: previousState.bits === ALT_AND_SHIFT_MASK }));
    }

    _switchInputMethod() {
        const numOfInputSources = Object.keys(this.inputSourceManager.inputSources).length;
        const currentInput = this.inputSourceManager.currentSource;
        const nextInput = this.inputSourceManager.inputSources[(currentInput.index + 1) % numOfInputSources];
        nextInput.activate();

        d(`switched input method from ${currentInput.shortName}-${currentInput.id} to ${nextInput.shortName}-${nextInput.id}`, 'info');
    }

    _tick() {
        const previousState = this.state.modifiers.bits;
        const mods = this._getCurrentModifiers();

        if (previousState !== mods) {
            this.state.modifiers.bits = mods;
            printState(this.state.modifiers);
        }

        return true;
    }

    _getCurrentModifiers() {
        const [, , mods] = global.get_pointer();
        return mods &
            // Remove caps-lock and num-lock states from state mask
            ~(Clutter.ModifierType.LOCK_MASK |  Clutter.ModifierType.MOD2_MASK);
    }

    _resetSequence(mods) {
        this.state.modifiers.sequence = [
            {
                bits: mods,
                date: Date.now(),
            },
        ];
        this.state.modifiers.isBroken = mods !== 0;
    }

    _onModifierBitsChange(bits) {
        this._addToSequence({ bits, date: Date.now() });
    }

}