'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.openLocalDirectoryChannel = void 0;
const electron_1 = require('electron');
const MainIpcChannel_1 = require('./lib/MainIpcChannel');
const api_1 = require('../../common/ipc/api');
// IpcChannel<Incoming, Outgoing>
exports.openLocalDirectoryChannel = new MainIpcChannel_1.MainIpcChannel(
  api_1.OPEN_LOCAL_DIRECTORY_CHANNEL
);
exports.openLocalDirectoryChannel.onReceive((path) =>
  electron_1.shell.openPath(path) ? Promise.resolve() : Promise.reject()
);
//# sourceMappingURL=open-local-directory.js.map
