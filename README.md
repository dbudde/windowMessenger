# windowMessenger
**windowMessenger** is a jQuery UI Widget that when installed on two windows allows the two windows to communicate back and forth with each other (such as a window communicating with a child iFrame or child to parent). Communication between windows is accomplished by using the browser window's `postMessage()` method to send messages between windows. This allows for both same domain and cross domain communication.

**windowMessenger** also has the ability to execute methods that exist on the other window or send functions across to be executed on the other window. This is a very powerful ability, but make sure you are aware of the security risks involved with cross window communication.  This is covered further in the [Wiki](https://github.com/dbudde/windowMessenger/wiki).

To learn how to integrate **windowMessenger** into your project, please read the [documentation available in the Wiki](https://github.com/dbudde/windowMessenger/wiki).
