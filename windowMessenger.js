/**
	MIT License

	Copyright (c) 2016 Daniel Budde

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

//
//	Plugin Name:	windowMessenger
//	Author(s):		Daniel Budde
//	Created:		05/05/2016
//
//


// Verify jQuery is available and that the window supports messaging.
if (jQuery != undefined && window.postMessage != undefined)
{
	(
		function($, window, document, undefined)
		{
			/*************************/
			/*     Define Widget     */
			/*************************/
			var windowMessengerDefinition =
			{
				/*************************/
				/*    Default Options    */
				/*************************/
				options: {},




				/*************************/
				/*    Public Methods     */
				/*************************/
				addTrustedOrigin: function(origin)
				{
					if (this._isType(origin, "string"))
					{
						this._trustedOrigins[origin.toLowerCase()] = true;
					}
				},


				execute: function(method, args, windowName)
				{
					var message = {method: null, args: null, context: null};

					args = this._setDefault(args, []);
					windowName = this._setDefault(windowName, "default");

					if (this.isRegistered(windowName) && (this._isType(method, "string") || this._isType(method, "function")))
					{
						if (this._isType(method, "function"))
						{
							method = "" + method;
						}

						message.method = method;
						message.args = args;

						this._sendMessage("execute", message, "", windowName);
					}
				},


				getTrustedOrigins: function()
				{
					var key = null,
						trustedOrigins = [];

					for (key in this._trustedOrigins)
					{
						trustedOrigins.push(key);
					}

					return trustedOrigins;
				},


				getWindow: function(windowName, windowOnly)
				{
					var winObj = null;

					windowOnly = this._setDefault(windowOnly, true);

					winObj = this._getWindow(windowName);


					if (this._isType(winObj))
					{
						if (windowOnly)
						{
							return winObj.win;
						}
						else
						{
							return {origin: winObj.origin, win: winObj.win};
						}
					}
				},


				isRegistered: function(windowName)
				{
					if (!this._isType(windowName, "string") || !this._isType(this._windows[windowName]))
					{
						return false;
					}

					return true;
				},


				post: function(message, identifier, windowName)
				{
					windowName = this._setDefault(windowName, "default");
					identifier = this._setDefault(identifier, "");

					if (this.isRegistered(windowName))
					{
						this._sendMessage("post", message, identifier, windowName);
					}
				},


				registerWindow: function(windowName, win, origin, isDefault)
				{
					isDefault = this._setDefault(isDefault, false);
					origin = this._setDefault(origin, "*");


					if (this._isType(windowName, "string") && windowName != "default" && this._isType(win) && !this.isRegistered(windowName))
					{
						this.addTrustedOrigin(origin);

						this._windows[windowName] = {origin: origin, win: win};

						if (this._defaultWindow == null || isDefault)
						{
							this._defaultWindow = win;
							this._windows["default"] = this._windows[windowName];
						}
					}
				},




				/*************************/
				/*    Private Methods    */
				/*************************/
				_create: function()
				{
					var $scriptTag = $(scriptTag),
						autoRegister = null,
						i = 0,
						trustedOrigins = null;


					autoRegister = $scriptTag.data("autoregister");
					trustedOrigins = $scriptTag.data("trustedorigins");


					// Set widget auto-register setting from the script tag.
					if (this._isType(autoRegister))
					{
						this._autoRegister = Boolean(autoRegister);
					}

					// Add trusted origins loaded from the script tag.
					if (this._isType(trustedOrigins, "string"))
					{
						trustedOrigins = trustedOrigins.split(",");

						for (i = 0; i < trustedOrigins.length; i++)
						{
							this.addTrustedOrigin(trustedOrigins[i]);
						}
					}


					// Add this window's origin as a trusted origin.
					this.addTrustedOrigin(window.location.origin);


					this._initEvents();

					if (this._autoRegister)
					{
						this._registerParentWindow();
					}
				},


				_createID: function(length)
				{
					var i = 0,
						id = "",
						possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

					if (!this._isType(length, "number"))
					{
						length = 6;
					}

					for (i = 0; i < length; i++)
					{
						id += possible.charAt(Math.floor(Math.random() * possible.length));
					}

					return id;
				},


				_destroy: function()
				{
					
				},


				_discoverChildren: function()
				{
					var $plugin = this;

					$("iframe").each(
						function(index)
						{
							var name = "temp" + $plugin._createID(),
								success = false,
								win = this.contentWindow;

							if (this.id.length === 0)
							{
								this.id = "iFrame" + $plugin._createID();
							}

							$plugin._iFrames[this.id] = this;

							$plugin.registerWindow(name, win, "*");
							$plugin._pingChild(name, this.id);
							$plugin._unRegisterWindow(name);
						}
					);
				},


				_executeMethod: function(method, args)
				{
					var methodRef = null;


					// Parses a function out of text.  May not work well on poorly formated functions.
					if (method.length > 8 && method.substr(0, 8) == "function")
					{
						method = this._parseFunction(method);
					}


					// Handle a string path to a method.
					if (this._isType(method, "string"))
					{
						methodRef = eval(method);

						if (this._isType(methodRef, "function"))
						{
							methodRef.apply(undefined, args);
						}
					}

					// Handle a function being passed.
					else if (this._isType(method, "function"))
					{
						method.apply(undefined, args);
					}
				},


				_getWindow: function(windowName)
				{
					if (this.isRegistered(windowName))
					{
						return this._windows[windowName];
					}
				},


				_initEvents: function()
				{
					var $el = this.element,
						$plugin = this;

					// Add window listener to process received messages.
					$el.on(
						"message",
						function(ev)
						{
							var event = ev.originalEvent || ev;

							$plugin._processMessage.apply($plugin, [event]);
						}
					);


					if (this._autoRegister)
					{
						$el.on(
							"load",
							function(ev)
							{
								$plugin._discoverChildren.apply($plugin, []);
							}
						);
					}
				},


				_isTrustedOrigin: function(origin)
				{
					if (this._isType(this._trustedOrigins[origin]))
					{
						return true;
					}

					return false;
				},


				_isType: function(value, type)
				{
					if (value != undefined && value != null && (type === undefined || $.type(value) === type))
					{
						return true;
					}

					return false;
				},


				_parseFunction: function(method)
				{
					var args = [],
						argString = "",
						functionBody = "",
						i = 0,
						index = 0,
						m = method;

					m = m.substr(8, m.length - 8);


					// Stip out the function arguments.
					index = m.indexOf(")") + 1;

					argString = m.substr(0, index).replace(/\)/g, "").replace(/\(/g, "");
					m = m.substr(index, m.length - index);

					args = argString.split(",");

					for (i = 0; i < args.length; i++)
					{
						args[i] = this._trim(args[i]);
					}


					// Trim off first function bracket;
					index = m.indexOf("{") + 1;
					m = m.substr(index, m.length - index);

					index = m.lastIndexOf("}");
					m = m.substr(0, index);

					args.push(this._trim(m));

					return Function.apply(undefined, args);
				},


				_parseOriginDomain: function(origin)
				{
					var path = null,
						originDomain = origin.toLowerCase();

					if (originDomain.length > 4 && originDomain.substr(0, 4) === "http")
					{
						originDomain = originDomain.replace("http://", "");
						originDomain = originDomain.replace("https://", "");
					}


					path = originDomain.split("/");
					originDomain = path[0];

					return originDomain;
				},


				_pingChild: function(windowName, id)
				{
					windowName = this._setDefault(windowName, "default");

					if (this.isRegistered(windowName))
					{
						this._sendMessage("ping", {id: id, origin: window.location.origin}, "", windowName);
					}
				},


				_processMessage: function(ev)
				{
					// ev.data
					// ev.origin
					// ev.isTrusted
					// ev.type - 'message'


					var $el = this.element,
						action = ev.data.action,
						eventName = "messageReceived",
						identifier = ev.data.identifier,
						message = ev.data.message,
						originDomain = this._parseOriginDomain(ev.origin),
						parent = null;


					// * = Trust any
					// originDomain = Trust any coming from a specific domain.
					// origin = Trust with a specific origin.
					if (this._isTrustedOrigin("*") || this._isTrustedOrigin(originDomain) || this._isTrustedOrigin(ev.origin))
					{
						switch (ev.data.action)
						{
							case "execute":
								this._executeMethod(message.method, message.args);
								break;

							case "ping":

								// Correct origin for auto-registered parent.
								if (this._autoRegister)
								{
									parent = this._getWindow("parent");

									// Don't correct origin if it is the local file system.
									if (this._isType(parent) && message.origin.length >= 5 && message.origin.substr(0, 5) != "file:")
									{
										parent.origin = message.origin;
									}
								}

								this._sendMessage("pingResponse", {id: message.id, origin: window.location.origin}, "", "parent");
								break;

							case "pingResponse":
								if (this._isType(this._iFrames[message.id]))
								{
									this._registerChildWindow(this._iFrames[message.id].contentWindow, message.origin);

									delete this._iFrames[message.id];
								}
								break;

							case "registerChild":
								this._registerChildWindow(message.win, message.origin);
								break;

							default:
								$el.trigger(eventName, [message, identifier]);
						}
					}
				},


				_registerChildWindow: function(win, origin)
				{
					var name = "child",
						nextChild = this._childWindows.length + 1,
						winObj = null;

					name += nextChild;

					origin = this._setDefault(origin, "*");

					// Handle files ran on local file system.
					if (origin.length >= 5 && origin.substr(0, 5) === "file:")
					{
						origin = "*";
					}

					this.registerWindow(name, win, origin);

					winObj = this._getWindow(name);

					if (this._isType(winObj))
					{
						this._childWindows.push(winObj);
					}
				},


				_registerParentWindow: function()
				{
					// Register parent
					if (window != window.parent)
					{
						// This is only done for auto-register, since we don't know the parent's origin yet. Could be a security issue.
						this.registerWindow("parent", window.parent, "*");
					}

					// Register top
					if (window != window.top && window.parent != window.top)
					{
						// This is only done for auto-register, since we don't know the parent's origin yet. Could be a security issue.
						this.registerWindow("top", window.top, "*");
					}
				},


				_sendMessage: function(action, message, identifier, windowName)
				{
					var winObj = this._getWindow(windowName);

					identifier = this._setDefault(identifier, "");

					if (winObj != undefined)
					{
						winObj.win.postMessage({action: action, message: message, identifier: identifier}, winObj.origin);
					}
				},


				_setDefault: function(value, defaultValue)
				{
					if (this._isType(value))
					{
						return value;
					}

					return defaultValue;
				},


				_setOption: function(key, value)
				{
					var $plugin = this;


					switch (String(key).toLowerCase())
					{
						case "somevalue":
							// $plugin.options.someValue = doSomething(value);
							break;

						default:
							$plugin.options[key] = value;
							break;
					}
	
					$plugin._super("_setOption", key, value);
				},


				_trim: function(string)
				{
					return string.replace(/^\s*/, "").replace(/\s*$/, "");
				},


				_unRegisterWindow: function(windowName)
				{
					if (this._isType(this._windows[windowName]))
					{
						if (this._defaultWindow === this._windows[windowName].win)
						{
							this._defaultWindow = null;
						}

						if (this._windows["default"] === this._windows[windowName])
						{
							delete this._windows["default"];
						}

						delete this._windows[windowName];
					}
				},




				/*************************/
				/*    Private Values     */
				/*************************/
				_autoRegister: false,
				_childWindows: [],
				_defaultWindow: null,
				_iFrames: {},
				_trustedOrigins: {},
				_windows: {}
			};


			var scriptTag = document.currentScript;




			// Register widget definition with jQuery UI Widget factory
			$.widget("window.messenger", windowMessengerDefinition);


			// Load widget
			$(window).messenger();
		}
	)(jQuery, window, document);
}