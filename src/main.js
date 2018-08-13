/*
 * Copyright 2018 Hochikong
 * All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {app, BrowserWindow, ipcMain} from 'electron';
import {exists, readFileSync, writeFileSync} from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 482,
        height: 650,
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function generateUserData() {
    const current = new Date();
    return {
        meta: {
            recordDay: current.getDate(),
            recordMonth: current.getMonth() + 1,
            recordYear: current.getFullYear(),
        },
        user: {
            total: 0,
            deposit: 0,
            warn: 0,
            remain: 0,
            dayAverage: 0,
            dayCost: 0,
            daysRemain: 0,
        },
    };
}

// read the default user data file userdata
const userDataFile = 'userdata.json';
let userDataCache;
let userDataExists;

// by default rewrite userdata.json
function updateUserData(args) {
    const cache = JSON.stringify(args);
    writeFileSync(userDataFile, cache);
}

function updateCache() {
    exists(userDataFile, (isExists) => {
        if (isExists) {
            const rawdata = readFileSync(userDataFile);
            userDataCache = JSON.parse(rawdata);
            userDataExists = true;
        } else {
            userDataCache = generateUserData();
            // updateUserData(userDataCache);
            userDataExists = false;
        }
    });
}

updateCache();

// arg structure: { head:xxx, body:{} }

ipcMain.on('RTOM', (event, arg) => {
    switch (arg.head) {
        // renderer query current cache every loading time, send a empty body
        case 'query': {
            event.sender.send('MTOR', {
                exists: userDataExists,
                data: userDataCache,
            });
            break;
        }
        case 'update': {
            updateUserData(arg.body);
            updateCache();
            event.sender.send('MTORUpdateView', {
                exists: userDataExists,
                data: arg.body,
            });
            break;
        }
        default:
        // empty
    }
});
