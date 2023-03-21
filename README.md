# RX Input Layout Switcher GNOME Shell Extension

This extension makes it possible to switch keyboard layout with the ALT+SHIFT modifier keys without interrupting other shortcuts that use these modifiers as part of their key combination.

## Installation

Directly from GitHub:

```shell
$ git clone https://github.com/arikw/rx-input-layout-switcher ~/.local/share/gnome-shell/extensions/rx-input-layout-switcher@wzmn.net

$ gnome-extensions enable rx-input-layout-switcher@wzmn.net
```

***Notice:*** In Wayland, if the above command reports that extension does not exist, logout and re-login

## Rational
Well, it's hard to control remote Windows machines' input language on TeamViewer for Linux, because the local input method is what determines the language on the remote machine. It's not possible to switch the language if the modifier keys are set to be sent to the remote machine, so to switch the language on the remote, you need to turn off the "Send key combinations", switch the language locally and turn it back on. Really annoying.  
In addition, if you are new to Linux DE and used to the good old `ALT+SHIFT` combo on Windows and want to do the same on GNOME, you'll end up breaking any shortcut that uses these keys.

### ✅ Advantages
* Keeping the default language switching key combination from Windows
* Switching input method in TeamViewer with "Send key combinations" option is enabled
* Not interfering with other system or application keyboard accelerators

### ❌ Caveats

* A layout switch might occur when using shortcuts involving the ALT+SHIFT keys. The extension attempts to mitigate this issue by switching language if ALT+SHIFT was pressed briefly. The idea is that shortcuts that involve more non-modifier keys will take longer

### 💡 Future Improvements \ Ideas
* Use `xinput` for `X11` session to make sure that only the modifier keys were pressed to eliminate false layout switching
* Make the layout switching timing sensitivity configurable to balance between the false-positive switches and ease of use
* enable\disable layout switching for specific programs

# Misc

## Development
* Developed on Fedora 37
* GNOME Shell Extensions that I got a great deal of help from reading their source codes:
    * ["Keyboard Modifiers Status"](https://github.com/sneetsher/Keyboard-Modifiers-Status) by [sneetsher](https://extensions.gnome.org/accounts/profile/sneetsher)
    * ["Quick Lang Switch"](https://github.com/ankostis/gnome-shell-quick-lang-switch) by [ankostis](https://extensions.gnome.org/accounts/profile/ankostis)
* Websites worth mentioning:
    * [grep.app](https://grep.app/) to quickly search across many git repos


## Debugging
Run `journalctl -f -o cat | grep rx-input-layout-switcher@wzmn.net` to see extension logs.  
Set `dbg` variable to `true` in `logger.js` to see debug-level logs.  
If the extension doesn't load, make sure to run the broader logging by running `journalctl -f -o cat`