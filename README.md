# RX Input Layout Switcher GNOME Shell Extension

## Description

This extension makes it possible to switch keyboard layout with the ALT+SHIFT modifier keys without interrupting other shortcuts that use these modifiers as part of their key combination.

### ✅ Advantages
* Keeping the default language switching key combination from Windows
* Switching input method in TeamViewer with "Send key combinations" option is enabled
* Not interfering with other system or application keyboard accelerators

### ❌ Caveats

* A layout switch might occur when using shortcuts involving the ALT+SHIFT keys. The extension attempts to mitigate this issue by switching language if ALT+SHIFT was pressed briefly. The idea is that shortcuts that involve more non-modifier keys will take longer.

### 💡 Further Development \ Ideas
* Use `xinput` for `X11` session to make sure that only the modifier keys were pressed to eliminate false layout switching
* Make the layout switching timing sensitivity configurable to balance between the false-positive switches and ease of use
* enable\disable layout switching for specific programs
