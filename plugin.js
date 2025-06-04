import { eventSource, event_types, generateQuietPrompt, getCurrentChatId, is_send_press, saveSettingsDebounced, substituteParamsExtended } from '../../../../script.js';
import { ModuleWorkerWrapper, extension_settings, getContext } from '../../../extensions.js';
import { is_group_generating } from '../../../group-chats.js';
import { isImageInliningSupported } from '../../../openai.js';
import { getBase64Async, waitUntilCondition } from '../../../utils.js';
import { callGenericPopup, POPUP_TYPE } from '../../../popup.js';
import { getMultimodalCaption } from '../../shared.js';
import { getMessageTimeStamp } from '../../../RossAscends-mods.js';
import { localforage, DOMPurify } from '../../../../lib.js';

const gameStore = localforage.createInstance({ name: 'SillyTavern_EmulatorJS' });
const baseUrl = '/scripts/extensions/third-party/SillyTavern-EmulatorJS/plugin.html';
const docUrl = 'https://emulatorjs.org/docs4devs/cores';
const canvas = new OffscreenCanvas(512, 512);

let currentGame = '';
let currentCore = '';
let commentTimer = null;
let gamesLaunched = 0;

const defaultSettings = {
    commentInterval: 0,
    captionPrompt: 'This is a screenshot of "{{game}}" game played on {{core}}. Provide a detailed description of what is happening in the game.',
    commentPrompt: '{{user}} is playing "{{game}}" on {{core}}. Write a {{random:cheeky, snarky, funny, clever, witty, teasing, quirky, sly, saucy}} comment from {{char}}\'s perspective based on the following:\n\n{{caption}}',
    forceCaptions: false,
};

const commentWorker = new ModuleWorkerWrapper(provideComment);

const cores = {
    'Nintendo 64': 'n64',
    'Nintendo Game Boy / Color': 'gb',
    'Nintendo Game Boy Advance': 'gba',
    'Nintendo DS': 'nds',
    'Nintendo Entertainment System': 'nes',
    'Super Nintendo Entertainment System': 'snes',
    'PlayStation': 'psx',
    'Virtual Boy': 'vb',
    'Sega Mega Drive': 'segaMD',
    'Sega Master System': 'segaMS',
    'Sega CD': 'segaCD',
    'Atari Lynx': 'lynx',
    'Sega 32X': 'sega32x',
    'Atari Jaguar': 'jaguar',
    'Sega Game Gear': 'segaGG',
    'Sega Saturn': 'segaSaturn',
    'Atari 7800': 'atari7800',
    'Atari 2600': 'atari2600',
    'Arcade': 'arcade',
    'NEC TurboGrafx-16/SuperGrafx/PC Engine': 'pce',
    'NEC PC-FX': 'pcfx',
    'SNK NeoGeo Pocket (Color)': 'ngp',
    'Bandai WonderSwan (Color)': 'ws',
    'ColecoVision': 'coleco',
    'Commodore 64': 'vice_x64sc',
    'Commodore 128': 'vice_x128',
    'Commodore VIC20': 'vice_xvic',
    'Commodore Plus/4': 'vice_xplus4',
    'Commodore PET': 'vice_xpet',
};

function getAspectRatio(core) {
    switch (core) {
        case 'snes':
            return '4/3';
        case 'segaMD':
        case 'nes':
        case 'segaMS':
            return '13/10';
        case 'gba':
            return '3/2';
        case 'gb':
        case 'segaGG':
            return '10/9';
        case 'lynx':
            return '160/102';
    }

    return '4/3';
}

function tryGetCore(ext) {
    if (['fds', 'nes', 'unif', 'unf'].includes(ext))
        return 'nes';

    if (['smc', 'fig', 'sfc', 'gd3', 'gd7', 'dx2', 'bsx', 'swc'].includes(ext))
        return 'snes';

    if (['iso', 'bin', 'chd', 'cue', 'ccd', 'mds', 'mdf', 'pbp', 'cbn', 'nrg', 'cdi', 'gdi', 'cue', 'cd'].includes(ext))
        return 'psx';

    if (['gen', 'bin', 'smd', 'md'].includes(ext))
        return 'segaMD';

    if (['sms'].includes(ext))
        return 'segaMS';

    if (['vb'].includes(ext))
        return 'vb';

    if (['lynx', 'lnx'].includes(ext))
        return 'lynx';

    if (['32x'].includes(ext))
        return 'sega32x';

    if (['j64', 'jag'].includes(ext))
        return 'jaguar';

    if (['gg'].includes(ext))
        return 'segaGG';

    if (['gbc'].includes(ext))
        return 'gb';

    if (['z64', 'n64'].includes(ext))
        return 'n64';

    if (['pce'].includes(ext))
        return 'pce';

    if (['ngp', 'ngc'].includes(ext))
        return 'ngp';

    if (['ws', 'wsc'].includes(ext))
        return 'ws';

    if (['col', 'cv'].includes(ext))
        return 'coleco';

    if (['d64'].includes(ext))
        return 'vice_x64';

    if (['nds', 'gba', 'gb', 'z64', 'n64'].includes(ext))
        return ext;
}

function getSlug() {
    return Date.now().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generates a description of the image using OpenAI API.
 * @param {string} base64Img  Base64-encoded image
 * @returns {Promise<string>} Generated description
 */
async function generateCaption(base64Img) {
    const captionPromptTemplate = extension_settings.emulatorjs.captionPrompt || defaultSettings.captionPrompt;
    const captionPrompt = substituteParamsExtended(captionPromptTemplate, { game: currentGame, core: currentCore });

    const caption = await getMultimodalCaption(base64Img, captionPrompt);
    return caption;
}

/**
 * Generate a character response for the provided game screenshot.
 * @param {string} base64Img  Base64-encoded image
 */
async function provideComment(base64Img) {
    const chatId = getCurrentChatId();
    console.debug('provideComment: got frame image');

    if (is_send_press || is_group_generating) {
        return console.log('provideComment: generation is in progress, skipping');
    }

    const ttsAudio = document.getElementById('tts_audio');

    if (ttsAudio && ttsAudio instanceof HTMLAudioElement && !ttsAudio.paused) {
        try {
            console.log('provideComment: waiting for TTS audio to finish');
            await waitUntilCondition(() => ttsAudio.paused, 30000);
        } catch {
            console.log('provideComment: TTS audio did not finish in 30 seconds, giving up');
        }
    }

    const input = substituteParamsExtended('{{input}}');

    if (input.length > 0) {
        return console.log('provideComment: user input is not empty, skipping');
    }

    let caption = 'see included image';
    const shouldGenerateCaption = extension_settings.emulatorjs.forceCaptions || !isImageInliningSupported();

    // If image inlining is not supported, generate a caption
    if (shouldGenerateCaption) {
        caption = await generateCaption(base64Img);
    }

    if (!caption) {
        return console.error('provideComment: failed to generate caption');
    }

    if (chatId !== getCurrentChatId()) {
        return console.log('provideComment: chat changed, skipping');
    }

    const commentPromptTemplate = extension_settings.emulatorjs.commentPrompt || defaultSettings.commentPrompt;
    const commentPrompt = substituteParamsExtended(commentPromptTemplate, { caption: caption, game: currentGame, core: currentCore });

    const quietImage = shouldGenerateCaption ? '' : base64Img;
    const commentMessage = await generateQuietPrompt(commentPrompt, true, false, quietImage);
    console.log('provideComment got comment message', commentMessage);

    if (!commentMessage) {
        return console.error('provideComment: failed to generate comment');
    }

    if (chatId !== getCurrentChatId()) {
        return console.log('provideComment: chat changed, skipping');
    }

    const context = getContext();
    const message = {
        mes: commentMessage,
        name: context.name2,
        is_system: false,
        is_user: false,
        send_date: getMessageTimeStamp(),
        extra: {},
    };

    context.chat.push(message);
    const messageId = context.chat.indexOf(message);
    await eventSource.emit(event_types.MESSAGE_RECEIVED, messageId);
    context.addOneMessage(message);
    await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, messageId);

    await context.saveChat();
}

async function drawGameList() {
    const games = [];
    await gameStore.iterate((value, key) => {
        const id = String(DOMPurify.sanitize(key));
        const name = String(DOMPurify.sanitize(value.name));
        const core = String(DOMPurify.sanitize(value.core));

        games.push({ id, name, core });
    });

    games.sort((a, b) => { return a.core.localeCompare(b.core) || a.name.localeCompare(b.name); });

    const gameList = $('#game_list');
    gameList.empty();

    if (games.length === 0) {
        gameList.append('<div class="wide100p textAlignCenter">No ROMs found.</div>');
        return;
    }

    for (const game of games) {
        gameList.append(`
        <div class="flex-container alignitemscenter">
            <div title="Launch the game" class="emulatorjs_play fa-solid fa-play menu_button" game-id="${game.id}"></div>
            <span class="emulatorjs_rom_name flex1" title="${game.name}">${game.name}</span>
            <small>${game.core}</small>
            <div title="Delete the game" class="emulatorjs_delete fa-solid fa-trash menu_button" game-id="${game.id}"></div>
        </div>`);
    }
}

function getCoreName(core) {
    return Object.keys(cores).find(key => cores[key] === core) || core;
}

async function onGameFileSelect() {
    const file = this.files[0];
    const parts = file.name.split('.');
    const ext = parts.pop();
    let name = parts.join('.');
    let core = tryGetCore(ext) || 'nes';
    let bios = '';

    const popupText = `
        <div>
            <h4>Core</h4>
            <select id="emulatorjs_cores" class="text_pole wide100p"></select>
            <h4>Name</h4>
            <textarea id="emulatorjs_name" type="text" class="text_pole wide100p" placeholder="<Name>" rows="2"></textarea>
            <h4>BIOS (optional)</h4>
            <input id="emulatorjs_bios" type="file" class="text_pole wide100p" placeholder="<BIOS>" />
            <div class="emulatorjs_bios_info">
                Some cores require a BIOS file to work.<br>
                Please check the <a href="${docUrl}" target="_blank">documentation</a> of the core you selected.
            </div>
        </div>`;

    const popupInstance = $(popupText);
    const coreSelect = popupInstance.find('#emulatorjs_cores');
    const nameInput = popupInstance.find('#emulatorjs_name');
    const biosInput = popupInstance.find('#emulatorjs_bios');

    coreSelect.on('input change', () => {
        core = coreSelect.val();
    });

    nameInput.on('input change', () => {
        name = nameInput.val();
    });

    biosInput.on('change', async () => {
        const biosFile = biosInput.prop('files')[0];
        bios = await readAsArrayBuffer(biosFile);
    });

    for (const [key, value] of Object.entries(cores).sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))) {
        const option = document.createElement('option');
        option.innerText = key;
        option.value = value;
        option.selected = value === core;
        coreSelect.append(option);
    }

    nameInput.val(name).trigger('input');
    coreSelect.val(core).trigger('change');

    const confirm = await callGenericPopup(popupInstance, POPUP_TYPE.CONFIRM, '', { okButton: 'Save', cancelButton: 'Cancel' });

    if (!confirm) {
        return;
    }

    const data = await readAsArrayBuffer(file);

    const slug = `emulatorjs-${getSlug()}`;

    const game = {
        name: name,
        core: core,
        data: data,
        bios: bios,
    };

    await gameStore.setItem(slug, game);
    await drawGameList();
}

async function readAsArrayBuffer(file) {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        reader.onerror = (event) => {
            reject(event.target.error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Starts the game comment worker.
 * @param {HTMLIFrameElement} frameElement Host frame element
 */
async function setupCommentWorker(frameElement) {
    if (!getCurrentChatId()) {
        return console.log('provideComment: no chat selected, skipping');
    }

    if ('ImageCapture' in window === false) {
        toastr.error('Your browser does not support ImageCapture API. Please use a different browser.', 'EmulatorJS');
        return;
    }

    try {
        // Wait for the emulator object and its canvas to be initialized
        await waitUntilCondition(() => frameElement.contentWindow['EJS_emulator']?.canvas, 5000);
        const emulatorObject = frameElement.contentWindow['EJS_emulator'];
        const emulatorCanvas = /** @type {HTMLCanvasElement} */ (emulatorObject?.canvas);

        if (!emulatorCanvas) {
            throw new Error('Failed to get the emulator canvas.');
        }

        // Capture the emulator canvas at 1 FPS
        const stream = emulatorCanvas.captureStream(1);
        const [videoTrack] = stream.getVideoTracks();

        if (!videoTrack) {
            throw new Error('Failed to get the video track.');
        }

        // Create an image capture object
        const imageCapture = new window.ImageCapture(videoTrack);
        const updateMs = extension_settings.emulatorjs.commentInterval * 1000;

        // If the video track is ended, stop the worker
        videoTrack.addEventListener('ended', () => {
            clearTimeout(commentTimer);
            return console.log('provideComment: video ended, stopping comment worker.');
        });

        // If the chat is changed, stop the worker
        eventSource.once(event_types.CHAT_CHANGED, () => {
            clearTimeout(commentTimer);
            return console.log('provideComment: chat changed, stopping comment worker.');
        });

        const shouldStopWorker = () => videoTrack.readyState === 'ended' || extension_settings.emulatorjs.commentInterval === 0;

        const doUpdate = async () => {
            try {
                console.log(`provideComment: entered at ${new Date().toISOString()}`);

                // Check if the video track is not ended
                if (shouldStopWorker()) {
                    return console.log('provideComment: video track ended');
                }

                // Check if the document is focused
                if (!document.hasFocus()) {
                    return console.log('provideComment: document not focused');
                }

                // Check if the emulator is running
                if (emulatorObject?.paused === true) {
                    return console.log('provideComment: emulator paused');
                }

                // Grab a frame from the video track
                console.debug('provideComment: grabbing frame');
                const bitmap = await imageCapture.grabFrame();

                // Draw frame to canvas
                console.debug('provideComment: drawing frame to canvas');
                if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                    console.debug(`provideComment: resizing canvas to ${bitmap.width}x${bitmap.height}`);
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                }
                const context = canvas.getContext('2d');
                // Ensure the pixels stay crisp
                context.imageSmoothingEnabled = false;
                context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

                // Convert to base64 PNG string
                console.debug('provideComment: converting canvas to base64');
                const blob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });
                const base64 = await getBase64Async(blob);

                // Send to worker
                console.debug('provideComment: sending image to worker');
                await commentWorker.update(base64);
                console.debug('provideComment: worker finished');
            } finally {
                // If the video track is ended, stop the worker
                if (shouldStopWorker()) {
                    clearTimeout(commentTimer);
                    console.debug('provideComment: video ended, stopping comment worker.');
                } else {
                    // Schedule next update
                    commentTimer = setTimeout(doUpdate, updateMs);
                    const nextUpdate = new Date(Date.now() + updateMs).toISOString();
                    console.log(`provideComment: scheduled next update at ${nextUpdate}`);
                }
            }
        };

        // Start the worker
        const firstUpdate = new Date(Date.now() + updateMs).toISOString();
        console.log(`provideComment: starting comment worker, first update at ${firstUpdate}`);
        commentTimer = setTimeout(doUpdate, updateMs);
    } catch (error) {
        console.error('Failed to start comment worker.', error);
        toastr.warning('Failed to start comment worker. Check debug console for more details.', 'EmulatorJS');
    }
}

async function startEmulator(gameId) {
    let game = {};

    if (gameId) {
        game = await gameStore.getItem(gameId);
    } else {
        const popupText = '<div><h3>Select a ROM file:</h3><select id="emulatorjs_game_select" class="wide100p text_pole"></select></div>';
        const popupInstance = $(popupText);

        const gameSelect = popupInstance.find('#emulatorjs_game_select').on('input change', async () => {
            game = await gameStore.getItem(gameSelect.val().toString());
        });

        const games = [];
        await gameStore.iterate((value, key) => {
            games.push({ name: value.name, core: value.core, key });
        });

        if (games.length === 0) {
            toastr.info('No games found. Please add a game first.');
            return;
        }

        games.sort((a, b) => { return a.core.localeCompare(b.core) || a.name.localeCompare(b.name); });

        for (const game of games) {
            const option = document.createElement('option');
            option.innerText = `${game.name} - ${game.core}`;
            option.value = game.key;
            gameSelect.append(option);
        }

        gameSelect.trigger('change');
        const confirm = await callGenericPopup(popupInstance, POPUP_TYPE.CONFIRM, '', { okButton: 'Launch', cancelButton: 'Cancel' });

        if (!confirm) {
            console.log('User canceled the game selection.');
            return;
        }
    }

    if (!game?.data) {
        toastr.error('Failed to start EmulatorJS. Please try again.');
        return;
    }

    const slug = 'emulatorjs-frame-' + getSlug();
    const context = getContext();
    const commentsEnabled = extension_settings.emulatorjs.commentInterval > 0 && !!window.ImageCapture;
    const coreName = getCoreName(game.core);
    context.sendSystemMessage('generic', slug);

    if (Array.isArray(context.chat)) {
        for (const message of context.chat) {
            if (message.mes == slug) {
                message.mes = `[EmulatorJS: ${context.name1} launches the game ${game.name} on ${coreName}]`;
                break;
            }
        }
    }

    const slugMessage = $('#chat .last_mes');
    const slugMessageText = slugMessage.find('.mes_text');
    if (slugMessageText.text().includes(slug)) {
        slugMessage.removeClass('last_mes');
        currentGame = game.name;
        currentCore = coreName;
        const aspect = getAspectRatio(game.core);
        const frame = `<iframe id="${slug}" class="emulatorjs_game" src="${baseUrl}"></iframe>`;
        const frameInstance = $(frame);
        frameInstance.css('aspect-ratio', aspect);
        slugMessageText.empty().append(frameInstance);

        // Detach the message from the chat flow
        const order = (10000 + gamesLaunched++).toFixed(0);
        slugMessage.css('order', order);

        frameInstance.on('load', async () => {
            const frameElement = frameInstance[0];
            if (frameElement instanceof HTMLIFrameElement) {
                frameElement.contentWindow.postMessage(game, '*');
                frameElement.contentWindow.addEventListener('click', () => {
                    frameElement.contentWindow.focus();
                });
                frameElement.contentWindow.addEventListener('mousemove', () => {
                    frameElement.contentWindow.focus();
                });
                if (commentsEnabled) {
                    await setupCommentWorker(frameElement);
                }
            }
        });

        frameInstance.on('unload', () => {
            if (commentsEnabled) {
                clearTimeout(commentTimer);
            }
        });

        $('#chat').scrollTop($('#chat')[0].scrollHeight);
    } else {
        toastr.error('Failed to start EmulatorJS. Please try again.');
        return;
    }
}

jQuery(async () => {
    if (!extension_settings.emulatorjs) {
        extension_settings.emulatorjs = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (extension_settings.emulatorjs[key] === undefined) {
            extension_settings.emulatorjs[key] = defaultSettings[key];
        }
    }

    const button = $(`
    <div id="emulatorjs_start" class="list-group-item flex-container flexGap5 interactable" tabindex="0">
        <div class="fa-solid fa-gamepad" title="Start a new game in the emulator"/></div>
        Play EmulatorJS
    </div>`);

    const getWandContainer = () => $(document.getElementById('emulatorjs_wand_container') ?? document.getElementById('extensionsMenu'));
    const wandContainer = getWandContainer();
    wandContainer.attr('tabindex', '0');
    wandContainer.addClass('interactable');
    wandContainer.append(button);

    const settings = `
    <div class="emulatorjs_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>EmulatorJS</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container">
                    <label for="emulatorjs_comment_interval">Comment Interval <small>(in seconds, 0 = disabled)</small></label>
                    <small>
                        Your browser must support <a href="https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture#browser_compatibility" target="_blank">ImageCapture</a>.
                        A supported Chat Completion model with image inlining enabled or captioning extension with multimodal API chosen is required.
                    </small>
                    <input id="emulatorjs_comment_interval" type="number" class="text_pole wide100p" value="0" min="0" step="10" max="6000" />
                    <label for="emulatorjs_caption_prompt">Caption Prompt</label>
                    <small>
                        This prompt is used to generate a description of the image using a multimodal model.
                        If image inlining is supported and captioning is not forced, this prompt is not used.
                        Select your preferred source and model in the "Image Captioning" section of the settings.
                        You can use <code>{{game}}</code> and <code>{{core}}</code> macros here.
                    </small>
                    <textarea id="emulatorjs_caption_prompt" type="text" class="text_pole textarea_compact wide100p" rows="3">${defaultSettings.captionPrompt}</textarea>
                    <label for="emulatorjs_comment_prompt">Comment Prompt</label>
                    <small>
                        This prompt is used to generate a character's comment.
                        You can use <code>{{game}}</code>, <code>{{core}}</code> and <code>{{caption}}</code> macros.
                        For image inlining mode, <code>{{caption}}</code> is replaced with <code>see included image</code>.
                    </small>
                    <textarea id="emulatorjs_comment_prompt" type="text" class="text_pole textarea_compact wide100p" rows="4">${defaultSettings.commentPrompt}</textarea>
                    <label for="emulatorjs_force_captions" class="checkbox_label">
                        <input id="emulatorjs_force_captions" type="checkbox" />
                        <span>Force captions</span>
                    </label>
                    <small>
                        If enabled, multimodal captions will be generated even if image inlining is supported.
                    </small>
                </div>
                <input id="emulatorjs_file" type="file" hidden />
                <div class="flex-container wide100p alignitemscenter">
                    <h3 class="flex1">ROM Files</h3>
                    <div id="emulatorjs_add" class="menu_button menu_button_icon">Add ROM file</div>
                </div>
                <hr>
                <div id="game_list" class="m-b-1"></div>
            </div>
        </div>
    </div>`;

    const getContainer = () => $(document.getElementById('emulatorjs_container') ?? document.getElementById('extensions_settings2'));
    getContainer().append(settings);
    $('#emulatorjs_add').on('click', function () {
        $('#emulatorjs_file').trigger('click');
    });
    $('#emulatorjs_file').on('change', onGameFileSelect);
    $('#emulatorjs_start').on('click', function () {
        startEmulator();
    });
    $('#emulatorjs_comment_interval').val(extension_settings.emulatorjs.commentInterval);
    $('#emulatorjs_comment_interval').on('input change', function () {
        extension_settings.emulatorjs.commentInterval = Number($(this).val());
        saveSettingsDebounced();
    });
    $('#emulatorjs_caption_prompt').val(extension_settings.emulatorjs.captionPrompt);
    $('#emulatorjs_caption_prompt').on('input change', function () {
        extension_settings.emulatorjs.captionPrompt = $(this).val();
        saveSettingsDebounced();
    });
    $('#emulatorjs_comment_prompt').val(extension_settings.emulatorjs.commentPrompt);
    $('#emulatorjs_comment_prompt').on('input change', function () {
        extension_settings.emulatorjs.commentPrompt = $(this).val();
        saveSettingsDebounced();
    });
    $('#emulatorjs_force_captions').prop('checked', extension_settings.emulatorjs.forceCaptions);
    $('#emulatorjs_force_captions').on('input change', function () {
        extension_settings.emulatorjs.forceCaptions = $(this).prop('checked');
        saveSettingsDebounced();
    });
    $(document).on('click', '.emulatorjs_play', async function () {
        const id = $(this).attr('game-id');
        await startEmulator(id);
    });
    $(document).on('click', '.emulatorjs_delete', async function () {
        const id = $(this).attr('game-id');
        const confirm = await callGenericPopup('Are you sure you want to delete this game?', POPUP_TYPE.CONFIRM, '', { okButton: 'Delete', cancelButton: 'Cancel' });

        if (!confirm) {
            return;
        }

        await gameStore.removeItem(id);
        await drawGameList();
    });

    await drawGameList();
});
